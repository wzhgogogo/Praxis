import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {PGlite,type Transaction} from "@electric-sql/pglite";
import type {SqlDatabase,SqlExecutor,SqlQueryResult} from "../../infrastructure/postgres/sql-database.js";
import {applyPostgresMigrations} from "../../infrastructure/postgres/migrations.js";
import {PersistentRestaurantAgentApplication} from "../persistent-restaurant-agent.js";
import {RunBoundedModelGateway} from "../run-bounded-model-gateway.js";
import {DeliveryReservedModelGateway} from "../delivery-reserved-model-gateway.js";
import {withBookingHandoffs} from "../restaurant-booking-handoff.js";
import {LIVE_READ_DEBUG_INVESTIGATION_BUDGET as limits} from "../live-read-investigation-budget.js";
import {RestaurantSemanticInterpreter} from "../../domains/restaurant/semantic-interpreter.js";
import {RestaurantAgentDecision} from "../../domains/restaurant/agent-decision.js";
import type {RestaurantAgentContext} from "../../domains/restaurant/agent-context.js";
import type {ModelGateway,ModelRequest,ModelResponse} from "../../core/model/contracts.js";
import type {BrowserRuntime} from "../../infrastructure/browser/browser-runtime.js";
import {createLiveReadAssembly} from "../../integrations/restaurant-search/live-read-assembly.js";
import {googlePlacesDiscoveryPack} from "../../integrations/restaurant-search/source-packs.js";
import {GooglePlacesClient} from "../../integrations/google/google-places-client.js";
import {FakeClock} from "../../harness/fake-clock.js";
import {strictAction} from "../../harness/restaurant-read-test-fixtures.js";
import {localFixture,exactGuideAvailabilityUrl} from "../../harness/browser/browser-read-test-fixtures.js";

class Database implements SqlDatabase {
  constructor(private readonly db:PGlite){}
  async query<Row>(sql:string,params:readonly unknown[]=[]):Promise<SqlQueryResult<Row>>{const r=await this.db.query<Row>(sql,[...params]);return {rows:r.rows,affectedRows:r.affectedRows??0};}
  transaction<T>(fn:(tx:SqlExecutor)=>Promise<T>):Promise<T>{return this.db.transaction((tx:Transaction)=>fn({async query<Row>(sql:string,params:readonly unknown[]=[]){const r=await tx.query<Row>(sql,[...params]);return {rows:r.rows,affectedRows:r.affectedRows??0};}}));}
}
export const cancellationQuote="Cancellations on the reservation date are charged at 100% of the course price.";
export const cancellationAnswer="Same-day cancellations cost 100% of the course price.";
export const japaneseQuote="当日キャンセルの場合はコース料金の50％を申し受けます。";
export const japaneseAnswer="The Japanese page charges 50% of the course price for same-day cancellations.";
export const cardQuote="A credit card is required to guarantee this reservation.";
interface Options {
  provider?:"TABELOG"|"TABLECHECK";conflict?:boolean;notStated?:boolean;maxCalls?:number;
  wrongPage?:"SHOP"|"CHANNEL";onQuestion?:(request:ModelRequest)=>Promise<void>|void;
}

/** Actual production assembly/application/Router/Reducer/SQL. Only external I/O is fixed. */
export async function bookingTermsComposition(options:Options={}){
  const source=JSON.parse(await readFile(new URL("../../eval/restaurant/agent-loop/cases/g6-development/source.json",import.meta.url),"utf8"));
  const provider=options.provider??"TABELOG",url=provider==="TABELOG"?source.pageUrl:source.tablecheck.pageUrl;
  const ja=url.replace("/en/","/");
  const original=await readFile(new URL("../../eval/restaurant/agent-loop/cases/g6-development/"+(provider==="TABELOG"?"outlet.html":"tablecheck.html"),import.meta.url),"utf8");
  const prose=options.notStated?"No booking policy is stated here.":cancellationQuote+"</p><p>"+cardQuote;
  const english=original.replace(source.merchantQuote,prose)+(options.conflict?`<a href="${ja}">日本語</a>`:"");
  const japanese=original.replace(source.merchantQuote,japaneseQuote+"</p><p>"+cardQuote);
  const clock=new FakeClock(source.referenceTime),db=await PGlite.create(),database=new Database(db);await applyPostgresMigrations(database);
  const requests:Array<{turn:string;request:ModelRequest;response:ModelResponse}>=[],sourceCalls:Array<{turn:string;url:string;kind:string}>=[];
  let turn="INITIAL",stage="",omit=options.notStated??false;
  const transport:ModelGateway={async complete(request){
    let body:unknown;
    if(request.purpose==="restaurant_semantic_interpret"){
      const raw=JSON.parse(request.messages.find(m=>m.role==="user")!.content.slice("User restaurant message as JSON string: ".length));
      body={schemaVersion:"4",facts:[
        {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:"AVAILABILITY",query:turn==="INITIAL"?"restaurant in Shibuya":source.outlet.name,selectionScope:turn==="INITIAL"?"OPEN_ENDED":"SPECIFIC_OUTLET",...(turn==="INITIAL"?{requestedResultCount:1}:{}),goalBasis:{type:"BOOKING_WORDING",reason:"Constructed explicit restaurant selection",quotes:[raw]}}},
        {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:source.date,raw:"November 11, 2026"}},
        {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:"19:00",latest:"19:00",raw:"7 PM"}},
        {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:2,source:"EXPLICIT"}},
        {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Shibuya"}}]};
    }else if(request.purpose==="restaurant_agent_decide"){
      const context=JSON.parse(request.messages.find(m=>m.role==="user")!.content).context as RestaurantAgentContext;
      const id=context.candidates[0]?.id;
      body=!id?strictAction("SEARCH_RESTAURANTS") : !context.availability[id]?.length?strictAction("CHECK_AVAILABILITY",context.checkableCandidateIds?.slice(0,1)??[])
        :turn!=="INITIAL"&&context.selectedCandidateId!==id?{...strictAction("SELECT_CANDIDATE"),candidateId:id}
        :strictAction("PRESENT_RESULTS",context.presentation.filter(p=>p.eligible).map(p=>p.candidateId));
    }else if(request.purpose==="restaurant_page_question"){
      await options.onQuestion?.(request);
      const payload=JSON.parse(request.messages.find(m=>m.role==="user")!.content);
      const isCard=/require a credit card|card required|credit card.*booking/i.test(payload.question);
      const quotes=isCard?[cardQuote]:[cancellationQuote,japaneseQuote];
      const selected=payload.sourceDocuments.flatMap((doc:{id:string;statements:Array<{id:string;text:string}>})=>doc.statements.filter(s=>quotes.includes(s.text)).map(s=>({documentId:doc.id,statementId:s.id,quote:s.text})));
      const both=selected.some((s:{quote:string})=>s.quote===cancellationQuote)&&selected.some((s:{quote:string})=>s.quote===japaneseQuote);
      body=selected.length?{status:"ANSWERED",answer:isCard?"Card required":both?"The English page charges 100% and the Japanese page charges 50% for same-day cancellations.":selected[0].quote===japaneseQuote?japaneseAnswer:cancellationAnswer,
        citations:selected.slice(0,3),sensitiveCategory:"NONE",sourceConflict:both}
        :{status:"NOT_STATED",answer:null,citations:[],sensitiveCategory:"NONE",sourceConflict:false};
    }else if(request.purpose==="fixture_budget_work")body={};
    else if(request.purpose==="restaurant_source_facts")body={selections:[]};
    else if(request.purpose==="browser_read_decide")body={action:"COMPLETE",targetRef:"",authoritativeField:"NONE",requestedState:"NONE",reason:"Constructed public source is fully readable."};
    else throw new Error("Unconfigured fixture purpose "+request.purpose);
    const response:ModelResponse={invocationId:"fixture:"+requests.length,provider:"FIXTURE",model:"b1-terms-construction",outputText:JSON.stringify(body),finishReason:"TOOL_CALLS",latencyMs:0};
    requests.push({turn,request:structuredClone(request),response});return response;
  }};
  const counted=new RunBoundedModelGateway(transport,options.maxCalls??50,limits.maxAutomaticBrowserMs);
  const model=new DeliveryReservedModelGateway(counted);
  const chrome=provider==="TABLECHECK"?localFixture({[url]:english,[exactGuideAvailabilityUrl(url,source.date,2,"19:00")]:english}):undefined;
  const browser:BrowserRuntime={async openSession(input){
    const session=chrome?await chrome.openSession(input):undefined;
    let pageUrl=url;
    const navigate=async(target:string)=>{
      assert.ok(!/form_course|yoyaku|payment|confirm|checkout|account/.test(new URL(target).pathname));
      sourceCalls.push({turn,url:target,kind:"BROWSER_NAVIGATE"});pageUrl=target;
      if(stage==="FACTS"&&options.wrongPage)pageUrl=options.wrongPage==="CHANNEL"?"https://www.tablecheck.com/en/shops/other-channel/reserve":url.replace("13123456","13999999");
      if(session)await session.navigate(pageUrl);
    };
    if(session){const snapshot=session.snapshot.bind(session);session.navigate=navigate;session.snapshot=async()=>{const p=await snapshot();return omit?{...p,text:p.text.replace(cancellationQuote,"").replace(cardQuote,"")}:p;};return session;}
    return {metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:source.referenceTime},navigate,
      async snapshot(){const jp=pageUrl===ja;const text=[source.outlet.name,source.outlet.address,source.outlet.phone,...(omit?[]:[jp?japaneseQuote:cancellationQuote,cardQuote]),"Availability","November 11, 2026. 2 guests. 19:00."].join("\n");return {url:pageUrl,title:source.outlet.name,text,html:(jp?japanese:english).replace(omit?cancellationQuote:"__unused__",""),responses:stage==="FACTS"?[]:[{url:source.vacancy.url,status:200,observedAt:clock.now().toISOString(),sequence:1,body:source.vacancy.body}]};},
      async observeControls(){return options.conflict&&pageUrl===url?[{id:"lang-ja",stableKey:"lang-ja",kind:"LINK" as const,role:"link",label:"日本語",href:ja,visible:true,disabled:false}]:[];},
      async select(_selector,value){return [value];},async click(){assert.fail("No click transport");},async fill(){assert.fail("No form transport");},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};
  }};
  const google=new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async(target,init)=>{
    sourceCalls.push({turn,url:String(target),kind:"GOOGLE_FIXTURE"});
    const place={id:source.outlet.id,displayName:{text:source.outlet.name},formattedAddress:source.outlet.address,nationalPhoneNumber:source.outlet.phone,websiteUri:url,location:{latitude:source.outlet.latitude,longitude:source.outlet.longitude},types:["restaurant"]};
    const query=init?.body?JSON.parse(String(init.body)).textQuery:undefined;
    return new Response(JSON.stringify(init?.method==="POST"?{places:query==="Shibuya"?[{id:"station",types:["train_station"],displayName:{text:"Shibuya"},location:place.location}]:[place]}:place),{status:200});
  }});
  const assembly=createLiveReadAssembly({...limits,packs:[googlePlacesDiscoveryPack]},{model,google,browser,clock,
    currentTaskId:()=>counted.currentTaskId(),remainingModelCalls:id=>counted.remainingCalls(id),onBrowserDiagnostic:d=>{stage=d.stage;}});
  const app=new PersistentRestaurantAgentApplication({database,clock,semanticInterpreter:new RestaurantSemanticInterpreter(model),agentDecision:new RestaurantAgentDecision(model),restaurantSearch:assembly.search,restaurantAvailability:assembly.availability,restaurantFacts:assembly.facts,restaurantQuestions:assembly.questions,executionRouterOptions:assembly.router,agentLoopOptions:assembly.loop,modelRunBudget:counted,workspaceMode:"LIVE_READ"});
  await app.store.upsertUser({id:"terms-user",displayName:"Fixture"},clock.now().toISOString());
  let caseId="",conversationId="",version=0;
  const project=async()=>{const raw=await app.getCase("terms-user",caseId);version=raw.case.taskVersion;return withBookingHandoffs(raw,assembly.bookingHandoffs.readPrepared(raw),clock.now().toISOString());};
  async function finished(work:()=>Promise<unknown>){let resolve!:()=>void;const done=new Promise<void>(r=>resolve=r);const unsubscribe=app.subscribeReadFinished(()=>resolve());let timer:ReturnType<typeof setTimeout>|undefined;try{await work();await Promise.race([done,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Fixture lifecycle not finished")),15000);})]);}finally{unsubscribe();if(timer)clearTimeout(timer);}}
  return {app,assembly,clock,requests,sourceCalls,counted,url,source,
    async initial(){await finished(async()=>{const v=await app.createCase("terms-user",source.initialRequest,"initial");caseId=v.case.caseId;conversationId=v.case.conversationId;});return project();},
    async select(){turn="SELECTED";await finished(()=>app.submitMessage({userId:"terms-user",conversationId,requestId:"selected:"+version,expectedVersion:version,message:source.bookingFollowups[0]}));return project();},
    async question(){turn="USER_QUESTION";const v=await project();await finished(()=>app.askRestaurantQuestion({userId:"terms-user",caseId,candidateId:v.restaurant.presentedCandidateIds![0]!,requestId:"question:"+version,expectedVersion:version,question:"What is this restaurant's same-day cancellation policy?"}));return project();},
    project,omitTerms(){omit=true;},async cancel(){return app.cancelCase("terms-user",caseId);},
    async close(){await app.stopActiveReads();await db.close();},
    artifact:async()=>({requests,sourceCalls,view:await project(),run:counted.usage(caseId),execution:await app.exportReadArtifact(caseId),realCalls:0}),
  };
}
