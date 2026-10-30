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
import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";
import type { RestaurantCandidate, RestaurantSearchRequest, RestaurantAvailabilityRequest } from "../domains/restaurant/contracts.js";
import { restaurantAvailabilityRequestFingerprint } from "../domains/restaurant/contracts.js";
import { groundTabelogAvailability, groundTableCheckAvailability } from "../domains/restaurant/read-grounding.js";
import { prepareBookingHandoff, type BookingHandoffContext, type BookingHandoffSource, type PreparedBookingHandoff } from "../domains/restaurant/booking-handoff.js";
import { createLocalWebServer } from "../server/local-web-server.js";
import { FakeClock } from "./fake-clock.js";
import { strictAction } from "./restaurant-read-test-fixtures.js";

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
export async function startWorkspaceFixture(options:{staged?:boolean;provider?:"TABELOG"|"TABLECHECK";cancellationConflict?:boolean}={}) {
  const raw=JSON.parse(await readFile(new URL("../domains/restaurant/fixtures/booking-handoff/source.json",import.meta.url),"utf8")) as {context:BookingHandoffContext;source:BookingHandoffSource};
  const pglite=await PGlite.create(),database=new Database(pglite),clock=new FakeClock(raw.context.now);
  await applyPostgresMigrations(database);
  let held=options.staged??false,release:()=>void=()=>{},gate=Promise.resolve(),checkStarted:()=>void=()=>{};
  let checking=new Promise<void>(resolve=>{checkStarted=resolve});
  const requests:ModelRequest[]=[], providerCalls:Array<{candidateId:string;partySize:number;aborted:boolean;completed:boolean}>=[];
  let candidates:RestaurantCandidate[]=[];
  const cache=new Map<string,PreparedBookingHandoff>();
  const base=new FixtureRestaurantSearch(), provider=options.provider??"TABLECHECK";
  const resetGate=()=>{held=true;gate=new Promise<void>(resolve=>{release=resolve});checking=new Promise<void>(resolve=>{checkStarted=resolve});};
  if(held)resetGate();
  const model:ModelGateway={async complete(request):Promise<ModelResponse>{
    requests.push(structuredClone(request));
    let body:unknown;
    if(request.purpose==="restaurant_semantic_interpret"){
      const text=JSON.parse(request.messages.find(m=>m.role==="user")!.content.slice("User restaurant message as JSON string: ".length)) as string;
      const contextLine=request.messages[0]!.content.split("\n").find(line=>line.startsWith("{")&&line.includes('"viewingContext"'));
      const viewed=contextLine?JSON.parse(contextLine).viewingContext?.candidate:undefined;
      const edit=/three|3 guests/i.test(text);
      const refer=/this one/i.test(text);
      const facts:RestaurantSemanticProposal["facts"]=edit?[
        {field:"PARTY_SIZE",operation:"CORRECT",value:{kind:"PARTY_SIZE",value:3,source:"EXPLICIT"}},
      ]:refer?[
        {field:"TARGET",operation:"CORRECT",value:{kind:"TARGET",goal:"AVAILABILITY",query:viewed?.outletName??"UNRESOLVED",selectionScope:"SPECIFIC_OUTLET",goalBasis:{type:"BOOKING_WORDING",reason:"Fixture current reference",quotes:[text]}}},
      ]:[
        {field:"TARGET",operation:"ASSERT",value:{kind:"TARGET",goal:"AVAILABILITY",query:"sushi in Tokyo",selectionScope:"OPEN_ENDED",goalBasis:{type:"BOOKING_WORDING",reason:"Fixture booking wording",quotes:[text]}}},
        {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:"2026-11-02",raw:"2026-11-02"}},
        {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:"19:00",latest:"19:30",raw:"19:00"}},
        {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:2,source:"EXPLICIT"}},
        {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Tokyo"}},
      ];
      body={schemaVersion:"4",facts};
    } else if(request.purpose==="restaurant_agent_decide"){
      const {context}=JSON.parse(request.messages.find(m=>m.role==="user")!.content) as {context:{candidates?:Array<{id:string}>;checkableCandidateIds?:string[];presentation?:Array<{candidateId:string;eligible:boolean}>}};
      const ready=context.presentation?.filter(item=>item.eligible).map(item=>item.candidateId)??[];
      body=!context.candidates?.length?strictAction("SEARCH_RESTAURANTS"):context.checkableCandidateIds?.length?
        strictAction("CHECK_AVAILABILITY",[context.checkableCandidateIds[0]!]):ready.length?strictAction("PRESENT_RESULTS",ready):strictAction("END_READ");
    } else throw new Error("No external model or unsupported fixture purpose: "+request.purpose);
    return {invocationId:"workspace-fixture:"+requests.length,provider:"FIXTURE",model:"workspace-fixed-boundary",outputText:JSON.stringify(body),finishReason:"TOOL_CALLS",latencyMs:0};
  }};
  const restaurant={
    executionRoute:"STRUCTURED_ADAPTER" as const,
    async search(request:RestaurantSearchRequest,signal:AbortSignal){
      const fixture=await base.search(request,signal);
      candidates=[structuredClone(raw.context.candidate),...fixture.candidates.slice(1)];
      candidates[0]!.matchReasons=[...fixture.candidates[0]!.matchReasons];
      candidates.forEach((c,i)=>{c.restaurant.sourceIds={tabelog:String(13123456+i),...(provider==="TABLECHECK"?{tablecheck:"fixture-sushi"+(i||"")}:{})};c.executionConfidence="HIGH";});
      return {candidates,evidence:candidates.map(c=>({evidenceId:"area:"+c.restaurant.id,kind:"DISCOVERY" as const,provider:"GOOGLE_PLACES" as const,candidateId:c.restaurant.id,sourceEntityId:"fixture-place:"+c.restaurant.id,observedAt:clock.now().toISOString(),requestFingerprint:"workspace-fixture-search",claims:{areaQuery:"Tokyo",areaMatch:true}})),metadata:{provider:"FIXTURE" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};
    },
    async check(request:RestaurantAvailabilityRequest,signal:AbortSignal){
      const id=request.candidateIds[0]!,index=candidates.findIndex(c=>c.restaurant.id===id);
      const call={candidateId:id,partySize:request.partySize,aborted:false,completed:false};providerCalls.push(call);
      signal.addEventListener("abort",()=>{call.aborted=true;},{once:true});
      if(held&&index===1){checkStarted();await gate;}
      // Deliberately deliver a late fixture response even after abort. The real Router/Runtime must discard it.
      const candidate=candidates[index]!;
      const sourceEntityId=provider==="TABLECHECK"?"fixture-sushi"+(index||""):String(13123456+index);
      const sourceUrl=provider==="TABLECHECK"?"https://www.tablecheck.com/en/shops/"+sourceEntityId+"/reserve":"https://tabelog.com/en/tokyo/A1301/A130101/"+sourceEntityId+"/";
      const ground=provider==="TABLECHECK"?groundTableCheckAvailability:groundTabelogAvailability;
      const result=ground(candidate,request,{candidateId:id,sourceEntityId,sourceUrl,observedAt:clock.now().toISOString(),requestedDate:"2026-11-02",requestedPartySize:request.partySize,visibleSlots:["19:00"],pageState:"AVAILABLE",entityMatch:{confidence:"HIGH",matchedBy:["SYNTHETIC_SAME_OUTLET"]}},clock.now().toISOString());
      const entity=result.evidence.find(e=>e.kind==="ENTITY_MATCH")!,availability=result.evidence.find(e=>e.kind==="AVAILABILITY")!;
      let source:BookingHandoffSource={...structuredClone(raw.source),candidateId:id,sourceEntityId,offerId:result.offers[0]!.id,availabilityEvidenceId:availability.evidenceId,
        url:index===0&&request.partySize===2?raw.source.url:"https://tabelog.com/en/booking/form_course/new?rcd="+sourceEntityId+"&member="+request.partySize+"&visit_date=20261102&visit_time=1900"};
      // The source-cache preparation uses the same request binding that the
      // real reducer will independently attach to the returned availability event.
      const check={...result.check,sourceProvider:provider,requestFingerprint:restaurantAvailabilityRequestFingerprint(request)};
      if(index!==0)delete source.terms;
      if(provider==="TABLECHECK"){
        const shop="fixture-sushi"+(index||""),entrance="https://www.tablecheck.com/en/shops/"+shop+"/reserve";
        source={...source,provider:"TABLECHECK",linkBasis:"VERIFIED_PARAMETERS",sourceEntityId:shop,observedEntranceUrl:entrance,url:entrance+"?start_date=2026-11-02&start_time=19%3A00&num_people="+request.partySize};
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
        for(const answer of [source.terms.cancellation,source.terms.card?.answer,source.terms.cancellationConflict?.japanese,source.terms.cancellationConflict?.english])if(answer){answer.candidateId=id;for(const p of answer.checkedPages)if(provider==="TABLECHECK")p.url=source.terms.pages[0]!.url;if("citations" in answer)for(const c of answer.citations){c.identityEvidenceId=entity.evidenceId;if(provider==="TABLECHECK")c.url=source.terms.pages[0]!.url;}}
        if(source.terms.plan){source.terms.plan.identityEvidenceId=entity.evidenceId;if(provider==="TABLECHECK")source.terms.plan.url=source.terms.pages[0]!.url;}
      }
      const prepared=prepareBookingHandoff(source,{candidate,offer:result.offers[0]!,check,request:{...raw.context.request,date:request.date,timeWindow:request.timeWindow,partySize:request.partySize},evidence:result.evidence,now:clock.now().toISOString()});
      if(prepared)cache.set(id,prepared);
      else throw new Error("Fixture B1 source was not admitted for "+id);
      call.completed=true;
      return {...result,availabilityChecks:{[id]:check},metadata:{provider:"FIXTURE" as const,route:"STRUCTURED_ADAPTER" as const,latencyMs:0}};
    },
    async inspectFacts(){throw new Error("No fixture fact read was planned");},
  };
  const application=new PersistentRestaurantAgentApplication({database,clock,semanticInterpreter:new RestaurantSemanticInterpreter(model),agentDecision:new RestaurantAgentDecision(model),restaurantSearch:restaurant,restaurantAvailability:restaurant,restaurantFacts:restaurant,
    workspaceMode:"LIVE_READ",executionRouterOptions:{structuredReadTimeoutMs:readLimits.maxStructuredReadMs,browserReadTimeoutMs:readLimits.maxAutomaticBrowserMs},agentLoopOptions:{maxSteps:readLimits.maxAgentSteps,maxRejectedActions:readLimits.maxRejectedActions,timeoutMs:readLimits.maxAutomaticBrowserMs}});
  const sessions=new PilotSessionService(application.store,[{accessToken:"workspace-fixture",id:"workspace-user",displayName:"Fixture account"},{accessToken:"workspace-other",id:"other-user",displayName:"Other account"}],clock);
  const server=createLocalWebServer({application,sessions,bookingHandoffs:{readPrepared:()=>[...cache.values()],now:()=>clock.now().toISOString()}});
  server.listen(0,"127.0.0.1");await once(server,"listening");
  return {baseUrl:"http://127.0.0.1:"+(server.address() as AddressInfo).port,application,clock,requests,providerCalls,
    release(){held=false;release();},hold(){resetGate();},waitForCheck(){return checking;},
    async close(){held=false;release();await application.stopActiveReads();server.close();server.closeAllConnections();await once(server,"close");await pglite.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const host=await startWorkspaceFixture();process.stdout.write(JSON.stringify({mode:"LOCAL_CHROMIUM_FIXTURE",url:host.baseUrl,accessToken:"workspace-fixture",realProviderCalls:0})+"\n");
  process.on("SIGINT",()=>{void host.close().then(()=>process.exit(0));});
}
