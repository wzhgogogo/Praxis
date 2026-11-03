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
  agentSelectInitial?:boolean;
  unverifiedHard?:boolean;
  beforePresent?:()=>Promise<void>;
  namedWithoutArea?: {outputText:string;scenario?:"AMBIGUOUS"|"MISSING"|"UNRELATED"|"BRANCH"|"OUTSIDE_TOKYO";openEnded?:boolean};
  beforeTerms?:(deadlineAt:string)=>void;
  afterFactControls?:(url:string)=>void;
  onFactNavigate?:(url:string,signal:AbortSignal)=>Promise<void>;
  selectionReplay?: {
    response:ModelResponse; path?:"P1"|"P2"|"NAMED";
    scope?:"OPEN_ENDED"|"SPECIFIC_OUTLET";basis?:"BOOKING_WORDING"|"JUDGMENT";
    query?:string; ambiguous?:boolean; duplicateAgentChoice?:boolean;
    beforeAvailability?:()=>Promise<void>;
  };
}

/** Actual production assembly/application/Router/Reducer/SQL. Only external I/O is fixed. */
export async function bookingTermsComposition(options:Options={}){
  const source=JSON.parse(await readFile(new URL("../../eval/restaurant/agent-loop/cases/g6-development/source.json",import.meta.url),"utf8"));
  const originalOutlet=structuredClone(source.outlet);
  if(options.namedWithoutArea)Object.assign(source.outlet,{name:"Kushi Katsu Dengana Akabane ten",address:"東京都北区赤羽1-15-1 新仲ビル1F",phone:"03-5249-4011",latitude:35.778,longitude:139.721});
  const provider=options.provider??"TABELOG",url=provider==="TABELOG"?source.pageUrl:source.tablecheck.pageUrl;
  const ja=url.replace("/en/","/");
  const original=(await readFile(new URL("../../eval/restaurant/agent-loop/cases/g6-development/"+(provider==="TABELOG"?"outlet.html":"tablecheck.html"),import.meta.url),"utf8")).replaceAll(originalOutlet.name,source.outlet.name).replaceAll(originalOutlet.address,source.outlet.address).replaceAll(originalOutlet.phone,source.outlet.phone);
  const prose=options.notStated?"No booking policy is stated here.":cancellationQuote+"</p><p>"+cardQuote;
  const english=original.replace(source.merchantQuote,prose)+(options.conflict?`<a href="${ja}">日本語</a>`:"");
  const japanese=original.replace(source.merchantQuote,japaneseQuote+"</p><p>"+cardQuote);
  const clock=new FakeClock(source.referenceTime),db=await PGlite.create(),database=new Database(db);await applyPostgresMigrations(database);
  const requests:Array<{turn:string;request:ModelRequest;response:ModelResponse}>=[],sourceCalls:Array<{turn:string;url:string;kind:string}>=[],sourcePages:unknown[]=[];
  let turn="INITIAL",stage="",omit=options.notStated??false,termsSignal:AbortSignal|undefined,duplicateSent=false;
  const origin=performance.now();
  const timeline:Array<{event:string;turn:string;elapsedMs:number;clockAtCET:string;detail:Record<string,unknown>}>=[];
  const mark=(event:string,detail:Record<string,unknown>={})=>timeline.push({event,turn,elapsedMs:performance.now()-origin,
    clockAtCET:new Date(clock.now().valueOf()+3_600_000).toISOString().replace("Z","+01:00"),detail});
  const transport:ModelGateway={async complete(request){
    mark("MODEL_BEGIN",{purpose:request.purpose});
    let body:unknown;
    if(request.purpose==="restaurant_semantic_interpret"){
      const raw=JSON.parse(request.messages.find(m=>m.role==="user")!.content.slice("User restaurant message as JSON string: ".length));
      body={schemaVersion:"4",facts:[
        {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:"AVAILABILITY",query:turn==="INITIAL"?"restaurant in Shibuya":source.outlet.name,selectionScope:turn==="INITIAL"?"OPEN_ENDED":"SPECIFIC_OUTLET",...(turn==="INITIAL"?{requestedResultCount:1}:{}),goalBasis:{type:"BOOKING_WORDING",reason:"Constructed explicit restaurant selection",quotes:[raw]}}},
        {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:source.date,raw:"November 11, 2026"}},
        {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:"19:00",latest:"19:00",raw:"7 PM"}},
        {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:2,source:"EXPLICIT"}},
        {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Shibuya"}}]};
      if(options.namedWithoutArea){
        body=JSON.parse(options.namedWithoutArea.outputText);
        if(turn==="AREA_UPDATE")body={schemaVersion:"4",facts:[{field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Akabane"}}]};
        else if(options.namedWithoutArea.openEnded){const target=(body as {facts:Array<{field:string;value:Record<string,unknown>}>}).facts.find(f=>f.field==="TARGET")!.value;target.selectionScope="OPEN_ENDED";target.query="restaurant";}
      }
      if(options.unverifiedHard)(body as {facts:unknown[]}).facts.push({field:"CRITERION",operation:"ASSERT",value:{kind:"CRITERION",text:"kushikatsu",polarity:"POSITIVE",strength:"HARD"}});
      if(options.selectionReplay){
        const value=body as {facts:Array<{field:string;value:Record<string,unknown>}>};
        const target=value.facts[0]!.value;
        const named=turn!=="INITIAL"||options.selectionReplay.path==="NAMED";
        target.query=named?options.selectionReplay.query??source.outlet.name:"restaurant in Shibuya";
        target.selectionScope=named?options.selectionReplay.scope??"SPECIFIC_OUTLET":"OPEN_ENDED";
        if(named){delete target.requestedResultCount;target.goalBasis={type:options.selectionReplay.basis??"BOOKING_WORDING",reason:"Fixed user booking message",quotes:[raw]};}
        if(options.selectionReplay.path==="P2"){
          if(turn==="INITIAL"){target.goal="RECOMMENDATION";target.goalBasis={type:"JUDGMENT",reason:"Recommendation without a visit",quotes:[raw]};value.facts=value.facts.filter(f=>f.field==="TARGET"||f.field==="AREA");}
          else if(turn==="SELECTED")value.facts=value.facts.filter(f=>f.field!=="PARTY_SIZE");
          else if(turn==="ADD_PARTY")value.facts=value.facts.filter(f=>f.field==="PARTY_SIZE");
        }
      }
    }else if(request.purpose==="restaurant_agent_decide"){
      const context=JSON.parse(request.messages.find(m=>m.role==="user")!.content).context as RestaurantAgentContext;
      const id=context.candidates[0]?.id;
      if(options.namedWithoutArea){
        if(context.missingBlockingFields.length)body={...strictAction("ASK_USER"),question:"Which area?",relatedFields:context.missingBlockingFields};
        else if(!id)body=strictAction(context.legalActions.search?"SEARCH_RESTAURANTS":"END_READ");
        else if(!context.availability[id]?.length&&!context.checkableCandidateIds?.length){
          if(options.namedWithoutArea.scenario==="AMBIGUOUS"&&!duplicateSent){duplicateSent=true;body={...strictAction("SELECT_CANDIDATE"),candidateId:id};}
          else body={...strictAction("ASK_USER"),question:"Which branch or area do you mean?",relatedFields:["area"]};
        }
        else if(!context.availability[id]?.length)body=strictAction("CHECK_AVAILABILITY",context.checkableCandidateIds?.slice(0,1)??[]);
        else body=strictAction("PRESENT_RESULTS",context.presentation.filter(p=>p.eligible).map(p=>p.candidateId));
      }else if(options.unverifiedHard){
        body=!id?strictAction("SEARCH_RESTAURANTS")
          :!context.availability[id]?.length?strictAction("CHECK_AVAILABILITY",context.checkableCandidateIds?.slice(0,1)??[])
          :context.factInvestigableCandidateIds?.length?strictAction("INVESTIGATE_CANDIDATE_FACTS",context.factInvestigableCandidateIds.slice(0,1))
          :strictAction("END_READ");
      }else if(options.selectionReplay){
        if(context.intentDraft?.target?.goal==="AVAILABILITY"&&context.missingBlockingFields.length)body={...strictAction("ASK_USER"),question:"How many people?",relatedFields:context.missingBlockingFields};
        else if(!id)body=strictAction("SEARCH_RESTAURANTS");
        else if(context.intentDraft?.target?.goal==="RECOMMENDATION")body=context.presentation.some(p=>p.eligible)?strictAction("PRESENT_RESULTS",context.presentation.filter(p=>p.eligible).map(p=>p.candidateId)):strictAction("INVESTIGATE_CANDIDATE_FACTS",context.factInvestigableCandidateIds?.slice(0,1)??[]);
        else if(!context.availability[id]?.length){if(turn!=="INITIAL")await options.selectionReplay.beforeAvailability?.();body=strictAction("CHECK_AVAILABILITY",context.checkableCandidateIds?.slice(0,1)??[]);}
        else if(options.selectionReplay.duplicateAgentChoice&&!duplicateSent&&turn!=="INITIAL"){duplicateSent=true;body={...strictAction("SELECT_CANDIDATE"),candidateId:id};}
        else if(turn!=="INITIAL"||options.selectionReplay.path==="NAMED"){
          // Replay bytes are not rewritten to make the action pick this outlet.
          assert.equal(id,JSON.parse(options.selectionReplay.response.outputText).candidateIds[0]);
          const response=structuredClone(options.selectionReplay.response);requests.push({turn,request:structuredClone(request),response});mark("MODEL_END",{purpose:request.purpose});return response;
        }else body=strictAction("PRESENT_RESULTS",context.presentation.filter(p=>p.eligible).map(p=>p.candidateId));
      }else body=!id?strictAction("SEARCH_RESTAURANTS") : !context.availability[id]?.length?strictAction("CHECK_AVAILABILITY",context.checkableCandidateIds?.slice(0,1)??[])
        :(turn!=="INITIAL"||options.agentSelectInitial)&&context.selectedCandidateId!==id?{...strictAction("SELECT_CANDIDATE"),candidateId:id}
        :strictAction("PRESENT_RESULTS",context.presentation.filter(p=>p.eligible).map(p=>p.candidateId));
      if((body as {type:string}).type==="PRESENT_RESULTS")await options.beforePresent?.();
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
    }else if(request.purpose==="restaurant_discovery_retrieval")body={choice:"KEYWORD",keyword:"kushikatsu",criterionRef:"criterion:0",generalRef:"",categoryUrl:"",reason:"The explicit HARD criterion supplies this retrieval word; retrieval does not qualify the outlet."};
    else if(request.purpose==="fixture_budget_work")body={};
    else if(request.purpose==="restaurant_source_facts")body={selections:[]};
    else if(request.purpose==="browser_read_decide")body={action:"COMPLETE",targetRef:"",authoritativeField:"NONE",requestedState:"NONE",reason:"Constructed public source is fully readable."};
    else throw new Error("Unconfigured fixture purpose "+request.purpose);
    const literal=options.namedWithoutArea&&!options.namedWithoutArea.openEnded&&turn==="INITIAL"&&request.purpose==="restaurant_semantic_interpret"?options.namedWithoutArea.outputText:undefined;
    const response:ModelResponse={invocationId:"fixture:"+requests.length,provider:"FIXTURE",model:"b1-terms-construction",outputText:literal??JSON.stringify(body),finishReason:"TOOL_CALLS",latencyMs:0};
    requests.push({turn,request:structuredClone(request),response});mark("MODEL_END",{purpose:request.purpose});return response;
  }};
  const counted=new RunBoundedModelGateway(transport,options.maxCalls??50,limits.maxAutomaticBrowserMs);
  const model=new DeliveryReservedModelGateway(counted);
  const chrome=provider==="TABLECHECK"?localFixture({[url]:english,[exactGuideAvailabilityUrl(url,source.date,2,"19:00")]:english}):undefined;
  const browser:BrowserRuntime={async openSession(input){
    if(stage==="FACTS"){termsSignal=input.signal;mark("FACTS_SESSION_BEGIN");input.signal.addEventListener("abort",()=>{mark("FACTS_ABORT",{reasonCode:input.signal.reason?.code??"CANCELLED"});},{once:true});}
    const session=chrome?await chrome.openSession(input):undefined;
    const originalNavigate=session?.navigate.bind(session);
    let pageUrl=url;
    const navigate=async(target:string)=>{
      assert.ok(!/form_course|yoyaku|payment|confirm|checkout|account/.test(new URL(target).pathname));
      if(stage==="FACTS")mark("FACTS_PAGE_BEGIN",{url:target});
      sourceCalls.push({turn,url:target,kind:"BROWSER_NAVIGATE"});pageUrl=target;
      if(stage==="FACTS"&&options.wrongPage)pageUrl=options.wrongPage==="CHANNEL"?"https://www.tablecheck.com/en/shops/other-channel/reserve":url.replace("13123456","13999999");
      if(stage==="FACTS")await options.onFactNavigate?.(target,input.signal);
      if(originalNavigate)await originalNavigate(pageUrl);
    };
    if(session){const snapshot=session.snapshot.bind(session);session.navigate=navigate;session.snapshot=async()=>{const original=await snapshot();const p=omit?{...original,text:original.text.replace(cancellationQuote,"").replace(cardQuote,"")}:original;sourcePages.push({turn,observedAt:clock.now().toISOString(),page:structuredClone(p)});return p;};return session;}
    return {metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:source.referenceTime},navigate,
      async snapshot(){const jp=pageUrl===ja;const text=[source.outlet.name,source.outlet.address,source.outlet.phone,...(omit?[]:[jp?japaneseQuote:cancellationQuote,cardQuote]),"Availability","November 11, 2026. 2 guests. 19:00."].join("\n");const p={url:pageUrl,title:source.outlet.name,text,html:(jp?japanese:english).replace(omit?cancellationQuote:"__unused__",""),responses:stage==="FACTS"?[]:[{url:source.vacancy.url,status:200,observedAt:clock.now().toISOString(),sequence:1,body:source.vacancy.body}]};sourcePages.push({turn,observedAt:clock.now().toISOString(),page:structuredClone(p)});return p;},
      async observeControls(){const controls=options.conflict&&pageUrl===url?[{id:"lang-ja",stableKey:"lang-ja",kind:"LINK" as const,role:"link",label:"日本語",href:ja,visible:true,disabled:false}]:[];
        if(stage==="FACTS"){mark("FACTS_CONTROLS_END",{url:pageUrl});options.afterFactControls?.(pageUrl);}return controls;},
      async select(_selector,value){return [value];},async click(){assert.fail("No click transport");},async fill(){assert.fail("No form transport");},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};
  }};
  const google=new GooglePlacesClient({apiKey:"fixture",fetchImplementation:async(target,init)=>{
    sourceCalls.push({turn,url:String(target),kind:"GOOGLE_FIXTURE"});
    const place={id:source.outlet.id,displayName:{text:source.outlet.name},formattedAddress:source.outlet.address,nationalPhoneNumber:source.outlet.phone,websiteUri:url,location:{latitude:source.outlet.latitude,longitude:source.outlet.longitude},types:["restaurant"]};
    const query=init?.body?JSON.parse(String(init.body)).textQuery:undefined;
    const places=options.namedWithoutArea?.scenario==="MISSING"?[]:options.namedWithoutArea?.scenario==="OUTSIDE_TOKYO"?[{...place,formattedAddress:"1-2-3 Osaka Japan"}]:options.namedWithoutArea?.scenario==="UNRELATED"?[{...place,displayName:{text:"Unrelated Ramen"}}]
      :options.namedWithoutArea?.scenario==="BRANCH"?[{...place,displayName:{text:"Kushi Katsu Dengana Asakusa ten"}}]
      :options.selectionReplay?.ambiguous||options.namedWithoutArea?.scenario==="AMBIGUOUS"?[place,{...place,id:source.outlet.id+"-other",formattedAddress:"9-8-7 Ginza Tokyo",nationalPhoneNumber:"03-9876-5432"}]:[place];
    return new Response(JSON.stringify(init?.method==="POST"?{places:query==="Shibuya"||query==="Akabane"?[{id:"station",types:["train_station"],displayName:{text:query},location:place.location}]:places}:places.find(p=>new URL(String(target)).pathname.endsWith("/"+p.id))??place),{status:200});
  }});
  const assembly=createLiveReadAssembly({...limits,...(!options.namedWithoutArea?{packs:[googlePlacesDiscoveryPack]}:{})},{model,google,browser,clock,
    currentTaskId:()=>counted.currentTaskId(),remainingModelCalls:id=>counted.remainingCalls(id),onBrowserDiagnostic:d=>{stage=d.stage;}});
  const readTerms=assembly.questions.readBookingTerms.bind(assembly.questions);
  assembly.questions.readBookingTerms=async(view,deadlineAt,signal)=>{
    if(view.restaurant.selectedCandidateId&&view.restaurant.intentDraft?.target?.selectionScope==="SPECIFIC_OUTLET")options.beforeTerms?.(deadlineAt);
    mark("TERMS_BEGIN",{deadlineAt,remainingMs:Date.parse(deadlineAt)-clock.now().valueOf()});
    try{await readTerms(view,deadlineAt,signal);}finally{mark("TERMS_END",{remainingMs:Date.parse(deadlineAt)-clock.now().valueOf()});}
  };
  const app=new PersistentRestaurantAgentApplication({database,clock,semanticInterpreter:new RestaurantSemanticInterpreter(model),agentDecision:new RestaurantAgentDecision(model),restaurantSearch:assembly.search,restaurantAvailability:assembly.availability,restaurantFacts:assembly.facts,restaurantQuestions:assembly.questions,executionRouterOptions:assembly.router,agentLoopOptions:assembly.loop,modelRunBudget:counted,workspaceMode:"LIVE_READ"});
  const appendMessage=app.store.appendMessage.bind(app.store);
  app.store.appendMessage=async input=>{const result=await appendMessage(input);if(input.role==="ASSISTANT")mark("ASSISTANT_APPENDED");return result;};
  app.subscribeReadFinished(()=>{mark("READ_FINISHED");});
  app.subscribeCaseUpdates(view=>{if(view.case.phase==="PRESENT_RESULTS")mark("RESULTS_VISIBLE",{selected:Boolean(view.restaurant.selectedCandidateId),active:view.restaurant.progress.active});});
  await app.store.upsertUser({id:"terms-user",displayName:"Fixture"},clock.now().toISOString());
  let caseId="",conversationId="",version=0;
  const project=async()=>{const raw=await app.getCase("terms-user",caseId);version=raw.case.taskVersion;return withBookingHandoffs(raw,assembly.bookingHandoffs.readPrepared(raw),clock.now().toISOString());};
  async function finished(work:()=>Promise<unknown>){let resolve!:()=>void,readFinished=false;const done=new Promise<void>(r=>resolve=r);const unsubscribe=app.subscribeReadFinished(()=>{readFinished=true;});const unsubscribeUpdate=app.subscribeCaseUpdates(()=>{if(readFinished)resolve();});let timer:ReturnType<typeof setTimeout>|undefined;try{await work();await Promise.race([done,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Fixture lifecycle not finished")),15000);})]);}finally{unsubscribe();unsubscribeUpdate();if(timer)clearTimeout(timer);}}
  return {app,assembly,clock,requests,sourceCalls,counted,url,source,timeline,get termsSignal(){return termsSignal;},
    async initial(){await finished(async()=>{const message=options.namedWithoutArea?"Can you find a table for two at Kushi Katsu Dengana Akabane ten on November 11, 2026 at 7 PM?":options.selectionReplay?.path==="P2"?source.recommendationRequest:options.selectionReplay?.path==="NAMED"?source.uncheckedBookingRequest+" For two people.":source.initialRequest+(options.unverifiedHard?" I require kushikatsu.":"");const v=await app.createCase("terms-user",message,"initial");caseId=v.case.caseId;conversationId=v.case.conversationId;});return project();},
    async area(){turn="AREA_UPDATE";await project();await finished(()=>app.submitMessage({userId:"terms-user",conversationId,requestId:"area:"+version,expectedVersion:version,message:"In Akabane, please."}));return project();},
    async select(message?:string){turn="SELECTED";const viewed=await project();await finished(()=>app.submitMessage({userId:"terms-user",conversationId,requestId:"selected:"+version,expectedVersion:version,message:message??(options.selectionReplay?.path==="P2"?source.uncheckedBookingRequest:source.bookingFollowups[0]),viewContext:{view:"DETAILS",candidateId:viewed.restaurant.presentedCandidateIds![0]!,comparedCandidateIds:[]}}));return project();},
    async party(){turn="ADD_PARTY";await finished(()=>app.submitMessage({userId:"terms-user",conversationId,requestId:"party:"+version,expectedVersion:version,message:source.partyReply}));return project();},
    async question(){turn="USER_QUESTION";const v=await project();await finished(()=>app.askRestaurantQuestion({userId:"terms-user",caseId,candidateId:v.restaurant.presentedCandidateIds![0]!,requestId:"question:"+version,expectedVersion:version,question:"What is this restaurant's same-day cancellation policy?"}));return project();},
    project,omitTerms(){omit=true;},async cancel(){return app.cancelCase("terms-user",caseId);},
    async close(){await app.stopActiveReads();await db.close();},
    artifact:async()=>{const raw=await app.getCase("terms-user",caseId),prepared=assembly.bookingHandoffs.readPrepared(raw);return {requests,sourceCalls,sourcePages,
      view:withBookingHandoffs(raw,prepared,clock.now().toISOString()),prepared,timeline,run:counted.usage(caseId),execution:await app.exportReadArtifact(caseId),realCalls:0};},
  };
}
