import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import type { SqlDatabase, SqlExecutor, SqlQueryResult } from "../../../infrastructure/postgres/sql-database.js";
import { applyPostgresMigrations } from "../../../infrastructure/postgres/migrations.js";
import { PersistentRestaurantAgentApplication } from "../../../application/persistent-restaurant-agent.js";
import { withBookingHandoffs } from "../../../application/restaurant-booking-handoff.js";
import { RunBoundedModelGateway } from "../../../application/run-bounded-model-gateway.js";
import { DeliveryReservedModelGateway } from "../../../application/delivery-reserved-model-gateway.js";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET as limits } from "../../../application/live-read-investigation-budget.js";
import { RestaurantAgentDecision } from "../../../domains/restaurant/agent-decision.js";
import { RestaurantSemanticInterpreter } from "../../../domains/restaurant/semantic-interpreter.js";
import { RestaurantPartySizeSupplementResolver } from "../../../domains/restaurant/party-size-supplement-resolver.js";
import type { RestaurantSemanticProposal } from "../../../domains/restaurant/semantic-proposal.js";
import type { RestaurantAgentContext } from "../../../domains/restaurant/agent-context.js";
import type { RestaurantCaseView } from "../../../application/agent-workspace.js";
import type { ModelGateway, ModelRequest, ModelResponse } from "../../../core/model/contracts.js";
import type { BrowserRuntime } from "../../../infrastructure/browser/browser-runtime.js";
import { createLiveReadAssembly } from "../../../integrations/restaurant-search/live-read-assembly.js";
import { googlePlacesDiscoveryPack } from "../../../integrations/restaurant-search/source-packs.js";
import { GooglePlacesClient } from "../../../integrations/google/google-places-client.js";
import { FakeClock } from "../../../harness/fake-clock.js";
import { strictAction } from "../../../harness/restaurant-read-test-fixtures.js";

class LocalDatabase implements SqlDatabase {
  constructor(private readonly database: PGlite) {}
  async query<Row>(sql: string, parameters: readonly unknown[] = []): Promise<SqlQueryResult<Row>> {
    const result = await this.database.query<Row>(sql, [...parameters]);
    return {rows:result.rows,affectedRows:result.affectedRows ?? 0};
  }
  transaction<T>(callback: (tx: SqlExecutor) => Promise<T>): Promise<T> {
    return this.database.transaction((tx: Transaction) => callback({async query<Row>(sql: string, parameters: readonly unknown[] = []) {
      const r = await tx.query<Row>(sql,[...parameters]); return {rows:r.rows,affectedRows:r.affectedRows ?? 0};
    }}));
  }
}

export async function runG6DevelopmentPreflight(output: string) {
  const source = JSON.parse(await readFile(new URL("./cases/g6-development/source.json", import.meta.url),"utf8")) as {
    referenceTime:string; outlet:{id:string;name:string;address:string;phone:string;latitude:number;longitude:number};
    pageUrl:string;date:string;time:string;partySize:number;initialRequest:string;bookingFollowups:string[];
    vacancy:{url:string;body:unknown};merchantQuote:string;
  };
  const html = await readFile(new URL("./cases/g6-development/outlet.html", import.meta.url),"utf8");
  const clock = new FakeClock(source.referenceTime);
  const pglite = await PGlite.create(), database = new LocalDatabase(pglite);
  await applyPostgresMigrations(database);
  const requests: Array<{turn:string;request:ModelRequest;response:ModelResponse}> = [];
  const sourceCalls: Array<{kind:string;method:string;url:string}> = [];
  let turn = "INITIAL", semanticCount = 0;
  const response = (body: unknown): ModelResponse => ({invocationId:`g6-script:${requests.length+1}`,provider:"FIXTURE",model:"g6-fixed-boundary",outputText:JSON.stringify(body),latencyMs:0,finishReason:"TOOL_CALLS"});
  const fixtureModel: ModelGateway = {async complete(request) {
    let body: unknown;
    if (request.purpose === "restaurant_semantic_interpret") {
      const message = JSON.parse(request.messages.find(m=>m.role === "user")!.content.slice("User restaurant message as JSON string: ".length)) as string;
      const target: RestaurantSemanticProposal["facts"][number] = {field:"TARGET",operation:semanticCount++ ? "CORRECT" : "ASSERT",value:{kind:"TARGET",goal:"AVAILABILITY",query:turn === "INITIAL" ? "restaurant in Shibuya" : source.outlet.name,
        selectionScope:turn === "INITIAL" ? "OPEN_ENDED" : "SPECIFIC_OUTLET",...(turn === "INITIAL" ? {requestedResultCount:1} : {}),goalBasis:{type:"BOOKING_WORDING",reason:"Explicit controlled development request",quotes:[message]}}};
      body = {schemaVersion:"4",facts:turn === "INITIAL" ? [target,
        {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:source.date,raw:"November 11, 2026"}},
        {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:source.time,latest:source.time,raw:"7 PM"}},
        {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:source.partySize,source:"EXPLICIT"}},
        {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Shibuya"}},
      ] : [target]};
    } else if (request.purpose === "restaurant_source_facts") body = {selections:[]};
    else if (request.purpose === "restaurant_agent_decide") {
      const context = JSON.parse(request.messages.find(m=>m.role === "user")!.content).context as RestaurantAgentContext;
      const ids = context.candidates.map(c=>c.id), id = ids[0];
      const offer = id ? context.availability[id]?.[0] : undefined;
      if (!ids.length) body = strictAction("SEARCH_RESTAURANTS");
      else if (!offer) body = strictAction("CHECK_AVAILABILITY",context.checkableCandidateIds?.slice(0,1) ?? []);
      // B1 selects the outlet, not an automatically executable booking offer.
      // Read-only slots intentionally require a booking recheck for the legacy
      // proposal path; B1 is independently checked by the source-link cache.
      else if (turn !== "INITIAL" && context.selectedCandidateId !== id) body = {...strictAction("SELECT_CANDIDATE"),candidateId:id};
      else body = strictAction("PRESENT_RESULTS",context.presentation.filter(p=>p.eligible).map(p=>p.candidateId));
    } else throw new Error("Unconfigured fixture purpose: " + request.purpose);
    const result = response(body); requests.push({turn,request:structuredClone(request),response:result}); return result;
  }};
  const counted = new RunBoundedModelGateway(fixtureModel,limits.maxModelCalls,limits.maxAutomaticBrowserMs);
  const model = new DeliveryReservedModelGateway(counted);
  const browser: BrowserRuntime = {async openSession() {
    let url = source.pageUrl;
    return {metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:source.referenceTime},
      async navigate(target) { sourceCalls.push({kind:"BROWSER_NAVIGATE",method:"GET",url:target});assert.equal(target,source.pageUrl,"Only the fixed public detail page is readable; no workflow or submission transport");url=target; },
      async snapshot() {return {url,title:source.outlet.name,text:[source.outlet.name,source.outlet.address,source.outlet.phone,source.merchantQuote,"Availability","November 11, 2026. 2 guests. 19:00."].join("\n"),html,
        responses:[{url:source.vacancy.url,status:200,observedAt:clock.now().toISOString(),sequence:1,body:source.vacancy.body}]};},
      async select(_selector,value){return [value];},async click(){assert.fail("No submission/click transport in fixed source");},async fill(){assert.fail("No form filling in fixed source");},
      async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};
  }};
  const google = new GooglePlacesClient({apiKey:"local-fixture-key",fetchImplementation:async(url,init)=>{
    sourceCalls.push({kind:"FIXED_GOOGLE_TRANSPORT",method:init?.method ?? "GET",url:String(url)});
    const place = {id:source.outlet.id,displayName:{text:source.outlet.name},formattedAddress:source.outlet.address,nationalPhoneNumber:source.outlet.phone,websiteUri:source.pageUrl,
      location:{latitude:source.outlet.latitude,longitude:source.outlet.longitude},types:["restaurant"]};
    const query = init?.body ? JSON.parse(String(init.body)).textQuery : undefined;
    return new Response(JSON.stringify(init?.method === "POST" ? {places:query === "Shibuya" ? [{id:"g6-development-station",displayName:{text:"Shibuya"},types:["train_station"],location:place.location}] : [place]} : place),{status:200});
  }});
  const assembly = createLiveReadAssembly({...limits,packs:[googlePlacesDiscoveryPack]},{model,google,browser,clock,currentTaskId:()=>counted.currentTaskId(),remainingModelCalls:id=>counted.remainingCalls(id)});
  const application = new PersistentRestaurantAgentApplication({database,clock,semanticInterpreter:new RestaurantSemanticInterpreter(model),partySizeSupplementResolver:new RestaurantPartySizeSupplementResolver(model),agentDecision:new RestaurantAgentDecision(model),
    restaurantSearch:assembly.search,restaurantAvailability:assembly.availability,restaurantFacts:assembly.facts,restaurantQuestions:assembly.questions,
    executionRouterOptions:assembly.router,agentLoopOptions:assembly.loop,modelRunBudget:counted,workspaceMode:"LIVE_READ",liveReadLimits:assembly.runCeilings});
  await application.store.upsertUser({id:"g6-development-user",displayName:"Development fixture"},clock.now().toISOString());
  const project = (view: RestaurantCaseView) => withBookingHandoffs(view,assembly.bookingHandoffs.readPrepared(view),clock.now().toISOString());
  async function completed<T>(work:()=>Promise<T>): Promise<T> {
    let finish!:()=>void;const done = new Promise<void>(r=>{finish=r;});
    const unsubscribe = application.subscribeReadFinished(()=>finish());
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await work();
      await Promise.race([done,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("G6 development lifecycle did not finish")),30_000);})]);
      return result;
    } finally {unsubscribe();if(timer)clearTimeout(timer);}
  }
  await mkdir(output,{recursive:true});
  let artifact: Record<string,unknown> = {};
  try {
    const created = await completed(()=>application.createCase("g6-development-user",source.initialRequest,"g6-initial"));
    const initial = project(await application.getCase("g6-development-user",created.case.caseId));
    const initialArtifact = await application.exportReadArtifact(initial.case.caseId);
    artifact = {mode:"OFFLINE_LOCAL_CONSTRUCTED_SOURCES",initial,initialArtifact};
    assert.equal(initial.case.phase,"PRESENT_RESULTS","Initial normal control must deliver, before testing a follow-up");
    const first = initial.restaurant.presentedCandidateIds?.[0];
    assert.ok(first,"Initial control must have an actual displayed outlet");
    assert.equal(initial.restaurant.availabilityChecks[first]?.status,"AVAILABLE");
    assert.equal(initial.restaurant.bookingHandoffs?.[0]?.candidateId,first,"Initial ordinary source cache must produce B1");
    turn = "BOOK_DISPLAYED";
    const boundary = requests.length;
    await completed(()=>application.submitMessage({userId:"g6-development-user",conversationId:initial.case.conversationId,requestId:"g6-book-displayed",expectedVersion:initial.case.taskVersion,
      message:source.bookingFollowups[0]!,viewContext:{view:"DETAILS",candidateId:first,comparedCandidateIds:[]}}));
    const after = project(await application.getCase("g6-development-user",initial.case.caseId));
    const afterArtifact = await application.exportReadArtifact(initial.case.caseId);
    artifact = {...artifact,followup:source.bookingFollowups[0],after,afterArtifact,boundary,requests,sourceCalls};
    assert.equal(after.restaurant.selectedCandidateId,first,"G6-P1: booking follow-up must select the explicitly displayed outlet");
    const handoff = after.restaurant.bookingHandoffs?.find(h=>h.candidateId===first);
    assert.ok(handoff,"G6-P1: booking follow-up must keep an admitted B1 handoff");
    assert.match(handoff.continueLabel,/filled in/);
    assert.equal(handoff.url,(source.vacancy.body as {selection:Array<{url:string}>}).selection[0]!.url);
    assert.ok(!sourceCalls.some(c=>c.kind==="BROWSER_NAVIGATE"&&/form_course|yoyaku|payment|confirm|checkout/.test(new URL(c.url).pathname)),"No workflow request in this turn");
    await writeFile(join(output,"preflight.json"),JSON.stringify({...artifact,status:"PASS",realModelCalls:0,publicGET:0},null,2)+"\n",{flag:"wx"});
    return {status:"PASS",output};
  } catch (error) {
    await writeFile(join(output,"preflight.json"),JSON.stringify({...artifact,status:"FAILED",failure:{name:error instanceof Error?error.name:"Error",message:error instanceof Error?error.message:"Unknown failure"},requests,sourceCalls,realModelCalls:0,publicGET:0},null,2)+"\n",{flag:"wx"});
    throw error;
  } finally {await application.stopActiveReads();await pglite.close();}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=="--out")throw new Error("Usage: g6-development-preflight.ts --out <new-output-directory>");
  try {console.log(JSON.stringify(await runG6DevelopmentPreflight(resolve(args[1]!))));}
  catch(error){console.error(error instanceof Error?error.message:"G6 preflight failed");process.exitCode=1;}
}
