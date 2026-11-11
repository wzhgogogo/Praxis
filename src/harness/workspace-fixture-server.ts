import { PGlite, type Transaction } from "@electric-sql/pglite";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { pathToFileURL } from "node:url";
import { PersistentRestaurantAgentApplication, PilotSessionService } from "../application/persistent-restaurant-agent.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET as readLimits } from "../application/live-read-investigation-budget.js";
import type { SqlDatabase, SqlExecutor, SqlQueryResult } from "../infrastructure/postgres/sql-database.js";
import { applyPostgresMigrations } from "../infrastructure/postgres/migrations.js";
import { FixtureRestaurantSearch } from "../infrastructure/fixture/fixture-restaurant-search.js";
import { RestaurantSemanticInterpreter } from "../domains/restaurant/semantic-interpreter.js";
import { RestaurantAgentDecision } from "../domains/restaurant/agent-decision.js";
import type { ModelGateway, ModelRequest, ModelResponse } from "../core/model/contracts.js";
import { ModelGatewayError } from "../core/model/errors.js";
import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";
import type { RestaurantCandidate, RestaurantSearchRequest, RestaurantAvailabilityRequest } from "../domains/restaurant/contracts.js";
import { restaurantAvailabilityRequestFingerprint, restaurantSearchIntentFingerprint } from "../domains/restaurant/contracts.js";
import { groundTabelogAvailability, groundTableCheckAvailability } from "../domains/restaurant/read-grounding.js";
import { prepareBookingHandoff, type BookingHandoffContext, type BookingHandoffSource, type PreparedBookingHandoff } from "../domains/restaurant/booking-handoff.js";
import { createLocalWebServer } from "../server/local-web-server.js";
import { FakeClock } from "./fake-clock.js";
import { strictAction } from "./restaurant-read-test-fixtures.js";
import type { RestaurantPageAnswer, RestaurantPageQuestionRequest } from "../domains/restaurant/page-question.js";
import type { ServerResponse } from "node:http";

class Database implements SqlDatabase {
  constructor(readonly pglite: PGlite) {}
  async query<Row>(sql:string, parameters:readonly unknown[]=[]):Promise<SqlQueryResult<Row>> {
    const r=await this.pglite.query<Row>(sql,[...parameters]);return {rows:r.rows,affectedRows:r.affectedRows??0};
  }
  transaction<T>(callback:(tx:SqlExecutor)=>Promise<T>):Promise<T> {
    return this.pglite.transaction((tx:Transaction)=>callback({async query<Row>(sql:string,parameters:readonly unknown[]=[]):Promise<SqlQueryResult<Row>>{
      const r=await tx.query<Row>(sql,[...parameters]);return {rows:r.rows,affectedRows:r.affectedRows??0};
    }}));
  }
}

/** Uses the existing B1 source fixture and restaurant fixture candidates. No external transport exists. */
export async function startWorkspaceFixture(options:{staged?:boolean;multiSlot?:boolean;provider?:"TABELOG"|"TABLECHECK";cancellationConflict?:boolean;questions?:boolean;inferredParty?:boolean;extraCandidates?:boolean;sourceValidityMs?:number;revisionScenario?:"structured"|"missing";outcome?:"empty"|"all-sources-failed"|"partial";continuation?:"pool"|"search";semanticFailureMessage?:string}={}) {
  const raw=JSON.parse(await readFile(new URL("../domains/restaurant/fixtures/booking-handoff/source.json",import.meta.url),"utf8")) as {context:BookingHandoffContext;source:BookingHandoffSource};
  const pglite=await PGlite.create(),database=new Database(pglite),clock=new FakeClock(raw.context.now);
  await applyPostgresMigrations(database);
  let held=options.staged??false,release:()=>void=()=>{},gate=Promise.resolve(),checkStarted:()=>void=()=>{};
  let checking=new Promise<void>(resolve=>{checkStarted=resolve});
  const requests:ModelRequest[]=[], providerCalls:Array<{candidateId:string;partySize:number;aborted:boolean;completed:boolean}>=[];
  const searches:RestaurantSearchRequest[]=[];
  let failuresRecovered=false, reserveUsed=false;
  let candidates:RestaurantCandidate[]=[];
  const cache=new Map<string,PreparedBookingHandoff>();
  const questionRequests:RestaurantPageQuestionRequest[]=[],answers=new Map<string,RestaurantPageAnswer>();
  const base=new FixtureRestaurantSearch(), provider=options.provider??"TABLECHECK";
  const resetGate=()=>{held=true;gate=new Promise<void>(resolve=>{release=resolve});checking=new Promise<void>(resolve=>{checkStarted=resolve});};
  if(held)resetGate();
  const model:ModelGateway={async complete(request):Promise<ModelResponse>{
    requests.push(structuredClone(request));
    let body:unknown;
    if(request.purpose==="restaurant_semantic_interpret"){
      const text=JSON.parse(request.messages.find(m=>m.role==="user")!.content.slice("User restaurant message as JSON string: ".length)) as string;
      if(text===options.semanticFailureMessage)throw new ModelGatewayError("Fixture semantic transport failure","NETWORK",false);
      const lines=request.messages[0]!.content.split("\n"),contextLine=lines[lines.findIndex(line=>line.startsWith("Current authoritative context"))+1];
      const semanticContext=contextLine?JSON.parse(contextLine):{},viewed=semanticContext.viewingContext?.candidate;
      const edit=Object.keys(semanticContext).some(key=>key!=="viewingContext")&&/three|3 guests/i.test(text);
      const refer=/this one/i.test(text);
      const facts:RestaurantSemanticProposal["facts"]=edit?[
        {field:"PARTY_SIZE",operation:"CORRECT",value:{kind:"PARTY_SIZE",value:3,source:"EXPLICIT"}},
        ...(options.revisionScenario?[
          {field:"TARGET",operation:"CORRECT",value:{kind:"TARGET",goal:"AVAILABILITY",query:"sushi in Tokyo",selectionScope:"OPEN_ENDED",requestedResultCount:2,goalBasis:{type:"BOOKING_WORDING",reason:"Fixed updated request",quotes:[text]}}},
          {field:"TIME_WINDOW",operation:"CORRECT",value:{kind:"TIME_WINDOW",earliest:"20:00",latest:"20:30",raw:"20:00"}},
          {field:"BUDGET_PER_PERSON",operation:"ASSERT",value:{kind:"BUDGET_PER_PERSON",max:10_000,currency:"JPY"}},
        ] as RestaurantSemanticProposal["facts"]:[]),
      ]:refer?[
        {field:"TARGET",operation:"CORRECT",value:{kind:"TARGET",goal:"AVAILABILITY",query:viewed?.outletName??"UNRESOLVED",selectionScope:"SPECIFIC_OUTLET",goalBasis:{type:"JUDGMENT",reason:"Fixture current reference",quotes:[text]}}},
      ]:[
        {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:"AVAILABILITY",query:"sushi in Tokyo",selectionScope:"OPEN_ENDED",...(options.outcome==="partial"?{requestedResultCount:2}:{}),goalBasis:{type:"BOOKING_WORDING",reason:"Fixture booking wording",quotes:[text]}}},
        {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:"2026-11-02",raw:"2026-11-02"}},
        {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:"19:00",latest:"19:30",raw:"19:00"}},
        {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:options.inferredParty?4:2,source:options.inferredParty?"INFERRED_CLOSED_PARTY":"EXPLICIT"}},
        {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Tokyo"}},
      ];
      body={schemaVersion:"4",facts};
    } else if(request.purpose==="restaurant_agent_decide"){
      const {context}=JSON.parse(request.messages.find(m=>m.role==="user")!.content) as {context:{candidates?:Array<{id:string}>;checkableCandidateIds?:string[];legalActions?:{search:boolean};searchAvailability?:{available:boolean};presentation?:Array<{candidateId:string;eligible:boolean}>;resultBatchTarget?:{excludeCandidateIds:string[]}}};
      const ready=context.presentation?.filter(item=>item.eligible&&!context.resultBatchTarget?.excludeCandidateIds.includes(item.candidateId)).map(item=>item.candidateId)??[];
      body=ready.length>=3?strictAction("PRESENT_RESULTS",ready.slice(0,3)):!context.candidates?.length?strictAction("SEARCH_RESTAURANTS"):context.checkableCandidateIds?.length?
        strictAction("CHECK_AVAILABILITY",[context.checkableCandidateIds[0]!]):ready.length?strictAction("PRESENT_RESULTS",ready):options.continuation==="search"&&context.legalActions?.search?strictAction("SEARCH_RESTAURANTS"):strictAction("END_READ");
    } else throw new Error("No external model or unsupported fixture purpose: "+request.purpose);
    return {invocationId:"workspace-fixture:"+requests.length,provider:"FIXTURE",model:"workspace-fixed-boundary",outputText:JSON.stringify(body),finishReason:"TOOL_CALLS",latencyMs:0};
  }};
  const restaurant={
    executionRoute:"STRUCTURED_ADAPTER" as const,
    async search(request:RestaurantSearchRequest,signal:AbortSignal){
      searches.push(structuredClone(request));
      const fixture=await base.search(request,signal);
      candidates=[structuredClone(raw.context.candidate),...fixture.candidates.slice(1)];
      candidates[0]!.matchReasons=[...fixture.candidates[0]!.matchReasons];
      if(options.revisionScenario&&request.intent.partySize===3){
        const added={...structuredClone(fixture.candidates[2]!),restaurant:{...structuredClone(fixture.candidates[2]!.restaurant),id:"fixture-revision-added",outletName:"Fixture new option"}};
        candidates=options.revisionScenario==="missing"?[candidates[0]!,added]:[...candidates,added];
      }
      if(options.extraCandidates||options.continuation==="pool")candidates.push(...fixture.candidates.map((item,index)=>({...structuredClone(item),restaurant:{...structuredClone(item.restaurant),id:"fixture-later-"+index,outletName:"Fixture later restaurant "+(index+1)}})));
      if(options.continuation==="search")candidates=searches.length===1?candidates.slice(0,1):fixture.candidates.map((item,index)=>({...structuredClone(item),restaurant:{...structuredClone(item.restaurant),id:"fixture-continuation-"+index,outletName:"Fixture continued restaurant "+(index+1)}}));
      candidates.forEach((c,i)=>{const serial=c.restaurant.id==="fixture-revision-added"?99:c.restaurant.id.startsWith("fixture-continuation-")?100+i:i;c.restaurant.sourceIds={tabelog:String(13123456+serial),...(provider==="TABLECHECK"?{tablecheck:serial===99?"fixture-revision-new":"fixture-sushi"+(serial||"")}:{})};c.executionConfidence="HIGH";});
      const found=request.intent.target?.selectionScope==="SPECIFIC_OUTLET"?candidates.filter(c=>c.restaurant.outletName===request.intent.target!.query):candidates;
      return {candidates:found,evidence:found.map(c=>({evidenceId:"area:"+c.restaurant.id,kind:"DISCOVERY" as const,provider:"GOOGLE_PLACES" as const,candidateId:c.restaurant.id,sourceEntityId:"fixture-place:"+c.restaurant.id,observedAt:clock.now().toISOString(),requestFingerprint:"workspace-fixture-search",claims:{areaQuery:"Tokyo",areaMatch:true}})),...(options.continuation==="search"?{continuation:{intentFingerprint:restaurantSearchIntentFingerprint(request.intent),usedPageTokens:searches.length===1?[]:["workspace-next"],pagesRead:searches.length,exhausted:searches.length>1,...(searches.length===1?{nextPageToken:"workspace-next"}:{})}}:{}),metadata:{provider:"FIXTURE" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};
    },
    async check(request:RestaurantAvailabilityRequest,signal:AbortSignal){
      const id=request.candidateIds[0]!,index=candidates.findIndex(c=>c.restaurant.id===id);
      const call={candidateId:id,partySize:request.partySize,aborted:false,completed:false};providerCalls.push(call);
      signal.addEventListener("abort",()=>{call.aborted=true;},{once:true});
      if(held&&index===1){checkStarted();await gate;}
      // Deliberately deliver a late fixture response even after abort. The real Router/Runtime must discard it.
      const candidate=candidates[index]!;
      const sourceEntityId=provider==="TABLECHECK"?candidate.restaurant.sourceIds.tablecheck!:candidate.restaurant.sourceIds.tabelog!;
      const sourceUrl=provider==="TABLECHECK"?"https://www.tablecheck.com/en/shops/"+sourceEntityId+"/reserve":"https://tabelog.com/en/tokyo/A1301/A130101/"+sourceEntityId+"/";
      const ground=provider==="TABLECHECK"?groundTableCheckAvailability:groundTabelogAvailability;
      const changed=!!options.revisionScenario&&request.partySize===3;
      const reserve=!!options.continuation&&!reserveUsed;
      const failed=!failuresRecovered&&(options.outcome==="all-sources-failed"||(options.outcome==="partial"&&index===1)||(reserve&&options.continuation==="pool"));
      const noSlot=reserve||options.outcome==="empty"||(changed&&id==="fixture-restaurant-3");
      const amount=changed&&id==="fixture-restaurant-2"?20_000:5_000;
      const result=ground(candidate,request,{candidateId:id,sourceEntityId,sourceUrl,observedAt:clock.now().toISOString(),...(options.sourceValidityMs?{sourceExpiresAt:new Date(clock.now().valueOf()+options.sourceValidityMs).toISOString()}:{}),requestedDate:"2026-11-02",requestedPartySize:request.partySize,visibleSlots:noSlot||failed?[]:options.multiSlot?[request.timeWindow.earliest,request.timeWindow.latest]:[request.timeWindow.earliest],pageState:failed?"BOT_CHALLENGE":noSlot?"NO_MATCHING_SLOT":"AVAILABLE",entityMatch:{confidence:"HIGH",matchedBy:["SYNTHETIC_SAME_OUTLET"]},
        ...(options.revisionScenario?{priceFacts:{schemaVersion:"restaurant-price-facts@1" as const,listedCoursePricesYen:[{amount,kind:"MEAL" as const,meal:"DINNER" as const,tax:"INCLUDED" as const,quote:"Dinner course ¥"+amount,sourceUrl}]}}:{})},clock.now().toISOString());
      const check={...result.check,sourceProvider:provider,requestFingerprint:restaurantAvailabilityRequestFingerprint(request),...(failed?{sourceAttempts:[{source:provider,outcome:"FAILED" as const,reasonCode:"BOT_CHALLENGE"}]}:{})};
      if(!result.offers.length){if(reserve){reserveUsed=true;clock.advance(readLimits.maxAutomaticBrowserMs-19_000);}call.completed=true;return {...result,availabilityChecks:{[id]:check},metadata:{provider:"FIXTURE" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};}
      const entity=result.evidence.find(e=>e.kind==="ENTITY_MATCH")!,availability=result.evidence.find(e=>e.kind==="AVAILABILITY")!;
      for(const offer of result.offers){
      let source:BookingHandoffSource={...structuredClone(raw.source),observedAt:clock.now().toISOString(),candidateId:id,sourceEntityId,offerId:offer.id,availabilityEvidenceId:availability.evidenceId,
        url:index===0&&request.partySize===2?raw.source.url:"https://tabelog.com/en/booking/form_course/new?rcd="+sourceEntityId+"&member="+request.partySize+"&visit_date=20261102&visit_time="+offer.dateTime.slice(11,16).replace(":","")};
      // The source-cache preparation uses the same request binding that the
      // real reducer will independently attach to the returned availability event.
      if(index!==0)delete source.terms;
      if(provider==="TABLECHECK"){
        const shop=sourceEntityId,entrance="https://www.tablecheck.com/en/shops/"+shop+"/reserve";
        source={...source,provider:"TABLECHECK",linkBasis:"VERIFIED_PARAMETERS",sourceEntityId:shop,observedEntranceUrl:entrance,url:entrance+"?start_date=2026-11-02&start_time="+encodeURIComponent(offer.dateTime.slice(11,16))+"&num_people="+request.partySize};
      }
      if(source.terms){
        if(options.cancellationConflict&&provider==="TABELOG"){
          const english=structuredClone(source.terms.cancellation!),japanese=structuredClone(english);
          if(japanese.status!=="ANSWERED")throw new Error("Expected existing B1 answer fixture");
          const url="https://tabelog.com/tokyo/A1301/A130101/13123456/",quote="前日キャンセルは50％、当日は100％です。";
          japanese.answer="Cancellation costs 50% the day before and 100% on the day.";
          japanese.citations=[{...japanese.citations[0]!,url,text:quote}];japanese.checkedPages=[{url,readAt:clock.now().toISOString()}];
          source.terms.pages=[...source.terms.pages,{...source.terms.pages[0]!,url,text:quote}];
          source.terms.cancellationConflict={japanese,english};
        }
        for(const page of source.terms.pages){page.identityEvidenceId=entity.evidenceId;page.readAt=clock.now().toISOString();if(provider==="TABLECHECK"){page.provider="TABLECHECK";page.sourceEntityId=source.sourceEntityId;page.url="https://www.tablecheck.com/en/shops/"+source.sourceEntityId+"/reserve";}}
        for(const answer of [source.terms.cancellation,source.terms.card?.answer,source.terms.cancellationConflict?.japanese,source.terms.cancellationConflict?.english])if(answer){answer.candidateId=id;for(const p of answer.checkedPages){p.readAt=clock.now().toISOString();if(provider==="TABLECHECK")p.url=source.terms.pages[0]!.url;}if("citations" in answer)for(const c of answer.citations){c.readAt=clock.now().toISOString();c.identityEvidenceId=entity.evidenceId;if(provider==="TABLECHECK")c.url=source.terms.pages[0]!.url;}}
        if(source.terms.plan)source.terms.plan.readAt=clock.now().toISOString();
        if(source.terms.plan){source.terms.plan.identityEvidenceId=entity.evidenceId;if(provider==="TABLECHECK")source.terms.plan.url=source.terms.pages[0]!.url;}
      }
      const prepared=prepareBookingHandoff(source,{candidate,offer:offer,check,request:{...raw.context.request,date:request.date,timeWindow:request.timeWindow,partySize:request.partySize},evidence:result.evidence,now:clock.now().toISOString()});
      if(source.terms?.card?.answer)answers.set(id,structuredClone(source.terms.card.answer));
      if(prepared)cache.set(id+":"+offer.id,prepared);
      else throw new Error("Fixture B1 source was not admitted for "+id);
      }
      call.completed=true;
      return {...result,availabilityChecks:{[id]:check},metadata:{provider:"FIXTURE" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};
    },
    async inspectFacts(){throw new Error("No fixture fact read was planned");},
  };
  const application=new PersistentRestaurantAgentApplication({database,clock,semanticInterpreter:new RestaurantSemanticInterpreter(model),agentDecision:new RestaurantAgentDecision(model),restaurantSearch:restaurant,restaurantAvailability:restaurant,restaurantFacts:restaurant,
    ...(options.questions?{restaurantQuestions:{executionRoute:"STRUCTURED_ADAPTER" as const,async answerQuestion(input:RestaurantPageQuestionRequest):Promise<RestaurantPageAnswer>{questionRequests.push(structuredClone(input));return structuredClone(answers.get(input.candidate.restaurant.id)??{status:"UNVERIFIED",candidateId:input.candidate.restaurant.id,reason:"NO_BOUND_PAGE",checkedPages:[]});}}}:{}),
    workspaceMode:"LIVE_READ",executionRouterOptions:{structuredReadTimeoutMs:readLimits.maxStructuredReadMs,browserReadTimeoutMs:readLimits.maxAutomaticBrowserMs},agentLoopOptions:{maxSteps:readLimits.maxAgentSteps,maxRejectedActions:readLimits.maxRejectedActions,timeoutMs:readLimits.maxAutomaticBrowserMs}});
  const sessions=new PilotSessionService(application.store,[{accessToken:"workspace-fixture",id:"workspace-user",displayName:"Fixture account"},{accessToken:"workspace-other",id:"other-user",displayName:"Other account"}],clock);
  const server=createLocalWebServer({application,sessions,bookingHandoffs:{readPrepared:()=>[...cache.values()],now:()=>clock.now().toISOString()}});
  const streams=new Set<ServerResponse>();server.on("request",(request,response)=>{if(request.url?.endsWith("/events")){streams.add(response);response.on("close",()=>streams.delete(response));}});
  server.listen(0,"127.0.0.1");await once(server,"listening");
  return {baseUrl:"http://127.0.0.1:"+(server.address() as AddressInfo).port,application,clock,requests,providerCalls,questionRequests,searches,
    recoverSources(){failuresRecovered=true;},
    disconnectStreams(){for(const stream of streams)stream.end();},
    activeStreamCount(){return streams.size;},
    release(){held=false;release();},hold(){resetGate();},waitForCheck(){return checking;},
    async close(){held=false;release();await application.stopActiveReads();server.close();server.closeAllConnections();await once(server,"close");await pglite.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const host=await startWorkspaceFixture();process.stdout.write(JSON.stringify({mode:"LOCAL_CHROMIUM_FIXTURE",url:host.baseUrl,accessToken:"workspace-fixture",realProviderCalls:0})+"\n");
  process.on("SIGINT",()=>{void host.close().then(()=>process.exit(0));});
}
