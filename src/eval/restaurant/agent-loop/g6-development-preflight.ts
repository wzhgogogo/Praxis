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

export async function runG6DevelopmentPreflight(output: string, path: "P1" | "P2" | "P3" | "P4" = "P1", variant = 0, provider: "TABELOG" | "TABLECHECK" = "TABELOG") {
  const source = JSON.parse(await readFile(new URL("./cases/g6-development/source.json", import.meta.url),"utf8")) as {
    referenceTime:string; outlet:{id:string;name:string;address:string;phone:string;latitude:number;longitude:number};
    pageUrl:string;date:string;time:string;partySize:number;initialRequest:string;bookingFollowups:string[];
    vacancy:{url:string;body:unknown};merchantQuote:string;
    recommendationRequest:string;uncheckedBookingRequest:string;partyReply:string;undatedRequest:string;dateReply:string;question:string;
    tablecheck:{pageUrl:string;expectedHandoffUrl:string};
  };
  const pageUrl=provider==="TABLECHECK" ? source.tablecheck.pageUrl : source.pageUrl;
  const html = await readFile(new URL(provider==="TABLECHECK" ? "./cases/g6-development/tablecheck.html" : "./cases/g6-development/outlet.html", import.meta.url),"utf8");
  const clock = new FakeClock(source.referenceTime);
  const pglite = await PGlite.create(), database = new LocalDatabase(pglite);
  await applyPostgresMigrations(database);
  const requests: Array<{turn:string;request:ModelRequest;response:ModelResponse}> = [];
  const sourceCalls: Array<{kind:string;method:string;url:string;turn:string}> = [];
  let turn = "INITIAL", semanticCount = 0;
  const response = (body: unknown): ModelResponse => ({invocationId:`g6-script:${requests.length+1}`,provider:"FIXTURE",model:"g6-fixed-boundary",outputText:JSON.stringify(body),latencyMs:0,finishReason:"TOOL_CALLS"});
  const fixtureModel: ModelGateway = {async complete(request) {
    let body: unknown;
    if (request.purpose === "restaurant_semantic_interpret") {
      const message = JSON.parse(request.messages.find(m=>m.role === "user")!.content.slice("User restaurant message as JSON string: ".length)) as string;
      const recommendation = path === "P2" && turn === "INITIAL";
      const open = turn === "INITIAL" && path !== "P3";
      const target: RestaurantSemanticProposal["facts"][number] = {field:"TARGET",operation:semanticCount++ ? "CORRECT" : "ASSERT",value:{kind:"TARGET",goal:recommendation ? "RECOMMENDATION" : "AVAILABILITY",query:open ? "restaurant in Shibuya" : source.outlet.name,
        selectionScope:open ? "OPEN_ENDED" : "SPECIFIC_OUTLET",...(open ? {requestedResultCount:1} : {}),goalBasis:{type:recommendation ? "JUDGMENT" : "BOOKING_WORDING",reason:"Explicit controlled development request",quotes:[message]}}};
      const date: RestaurantSemanticProposal["facts"][number] = {field:"DATE",operation:"ASSERT",value:{kind:"DATE",value:source.date,raw:"November 11, 2026"}};
      const time: RestaurantSemanticProposal["facts"][number] = {field:"TIME_WINDOW",operation:"ASSERT",value:{kind:"TIME_WINDOW",earliest:source.time,latest:source.time,raw:"7 PM"}};
      const party: RestaurantSemanticProposal["facts"][number] = {field:"PARTY_SIZE",operation:"ASSERT",value:{kind:"PARTY_SIZE",value:source.partySize,source:"EXPLICIT"}};
      const area: RestaurantSemanticProposal["facts"][number] = {field:"AREA",operation:"ASSERT",value:{kind:"AREA",query:"Shibuya"}};
      const facts = turn === "ADD_PARTY" ? [party] : turn === "ADD_DATE" ? [date]
        : turn !== "INITIAL" ? path === "P2" ? [target,date,time] : [target]
        : recommendation ? [target,area] : path === "P3" ? [target,time,party,area] : [target,date,time,party,area];
      body = {schemaVersion:"4",facts};
    } else if (request.purpose === "restaurant_source_facts") body = {selections:[]};
    else if (request.purpose === "restaurant_party_size_supplement") body = {status:"UNKNOWN",partySize:0};
    else if (request.purpose === "browser_read_decide") body = {action:"COMPLETE",targetRef:"",authoritativeField:"NONE",requestedState:"NONE",reason:"Constructed public page is fully readable."};
    else if (request.purpose === "restaurant_page_question") {
      const payload=JSON.parse(request.messages.find(m=>m.role==="user")!.content);
      const doc=payload.sourceDocuments.find((d:{statements:Array<{text:string}>})=>d.statements.some(s=>s.text===source.merchantQuote));
      assert.ok(doc,"The real G1 reader must supply the merchant sentence");
      const sentence=doc.statements.find((s:{text:string})=>s.text===source.merchantQuote);
      body={status:"ANSWERED",answer:"The page says a private room is available for groups of four or more.",citations:[{documentId:doc.id,statementId:sentence.id,quote:sentence.text}],sensitiveCategory:"NONE",sourceConflict:false};
    }
    else if (request.purpose === "restaurant_agent_decide") {
      const context = JSON.parse(request.messages.find(m=>m.role === "user")!.content).context as RestaurantAgentContext;
      const ids = context.candidates.map(c=>c.id), id = ids[0];
      const offer = id ? context.availability[id]?.[0] : undefined;
      if (context.missingBlockingFields.length && context.intentDraft?.target?.goal === "AVAILABILITY") body={...strictAction("ASK_USER"),question:context.missingBlockingFields.includes("date") ? "Which date would you like?" : "How many people?",relatedFields:context.missingBlockingFields};
      else if (!ids.length) body = strictAction("SEARCH_RESTAURANTS");
      else if (context.intentDraft?.target?.goal === "RECOMMENDATION") body = context.presentation.some(p=>p.eligible)
        ? strictAction("PRESENT_RESULTS",context.presentation.filter(p=>p.eligible).map(p=>p.candidateId))
        : strictAction("INVESTIGATE_CANDIDATE_FACTS",context.factInvestigableCandidateIds?.slice(0,1) ?? []);
      else if (!offer) body = strictAction("CHECK_AVAILABILITY",context.checkableCandidateIds?.slice(0,1) ?? []);
      // B1 selects the outlet, not an automatically executable booking offer.
      // Read-only slots intentionally require a booking recheck for the legacy
      // proposal path; B1 is independently checked by the source-link cache.
      else if ((path === "P1" || path === "P2") && turn !== "INITIAL" && context.selectedCandidateId !== id) body = {...strictAction("SELECT_CANDIDATE"),candidateId:id};
      else body = strictAction("PRESENT_RESULTS",context.presentation.filter(p=>p.eligible).map(p=>p.candidateId));
    } else throw new Error("Unconfigured fixture purpose: " + request.purpose);
    const result = response(body); requests.push({turn,request:structuredClone(request),response:result}); return result;
  }};
  const counted = new RunBoundedModelGateway(fixtureModel,limits.maxModelCalls,limits.maxAutomaticBrowserMs);
  const model = new DeliveryReservedModelGateway(counted);
  const browser: BrowserRuntime = {async openSession() {
    let url = pageUrl;
    return {metadata:{runtimeProvider:"LOCAL_PLAYWRIGHT_CHROMIUM",engine:"CHROMIUM",startedAt:source.referenceTime},
      async navigate(target) {
        sourceCalls.push({kind:"BROWSER_NAVIGATE",method:"GET",url:target,turn});
        if(provider==="TABLECHECK"){
          const actual=new URL(target),expected=new URL(pageUrl);
          assert.equal(actual.origin+actual.pathname,expected.origin+expected.pathname,"Only the observed same-shop public source entrance is readable");
          assert.ok([...actual.searchParams.keys()].every(k=>["start_date","start_time","num_people"].includes(k)));
        } else assert.equal(target,pageUrl,"Only the fixed public detail page is readable; no workflow or submission transport");
        url=target;
      },
      async snapshot() {return {url,title:source.outlet.name,text:[source.outlet.name,source.outlet.address,source.outlet.phone,source.merchantQuote,"Availability","November 11, 2026. 2 guests. 19:00."].join("\n"),html,
        responses:provider==="TABLECHECK" ? [] : [{url:source.vacancy.url,status:200,observedAt:clock.now().toISOString(),sequence:1,body:source.vacancy.body}]};},
      async select(_selector,value){return [value];},async click(){assert.fail("No submission/click transport in fixed source");},async fill(){assert.fail("No form filling in fixed source");},
      async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};
  }};
  const google = new GooglePlacesClient({apiKey:"local-fixture-key",fetchImplementation:async(url,init)=>{
    sourceCalls.push({kind:"FIXED_GOOGLE_TRANSPORT",method:init?.method ?? "GET",url:String(url),turn});
    const place = {id:source.outlet.id,displayName:{text:source.outlet.name},formattedAddress:source.outlet.address,nationalPhoneNumber:source.outlet.phone,websiteUri:pageUrl,
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
    const initialRequest=path === "P2" ? source.recommendationRequest : path === "P3" ? source.undatedRequest : source.initialRequest;
    const created = await completed(()=>application.createCase("g6-development-user",initialRequest,"g6-initial"));
    const initial = project(await application.getCase("g6-development-user",created.case.caseId));
    const initialArtifact = await application.exportReadArtifact(initial.case.caseId);
    artifact = {mode:"OFFLINE_LOCAL_CONSTRUCTED_SOURCES",path,variant,provider,initialRequest,initial,initialArtifact};
    if(path === "P3") {
      assert.equal(initial.case.phase,"NEEDS_INPUT","Undated named request must ask before any availability read");
      assert.equal(initial.restaurant.intentDraft?.date,undefined,"No autonomous date may enter State");
      assert.equal(sourceCalls.length,0,"No provider read before a concrete date");
      assert.ok(initial.activities.some(a=>a.type === "AGENT_ASKED_USER"));
      turn="ADD_DATE";
      await completed(()=>application.submitMessage({userId:"g6-development-user",conversationId:initial.case.conversationId,requestId:"g6-add-date",expectedVersion:initial.case.taskVersion,message:source.dateReply}));
      const after=project(await application.getCase("g6-development-user",initial.case.caseId));
      artifact={...artifact,after,afterArtifact:await application.exportReadArtifact(initial.case.caseId)};
      assert.equal(after.case.phase,"PRESENT_RESULTS");
      assert.equal(after.restaurant.intentDraft?.date,source.date);
      assert.ok(after.restaurant.bookingHandoffs?.length);
    } else {
    assert.equal(initial.case.phase,"PRESENT_RESULTS","Initial normal control must deliver, before testing a follow-up");
    const first = initial.restaurant.presentedCandidateIds?.[0];
    assert.ok(first,"Initial control must have an actual displayed outlet");
    if(path !== "P2") {
      assert.equal(initial.restaurant.availabilityChecks[first]?.status,"AVAILABLE");
      assert.equal(initial.restaurant.bookingHandoffs?.[0]?.candidateId,first,"Initial ordinary source cache must produce B1");
    } else {
      assert.equal(Object.keys(initial.restaurant.availabilityChecks).length,0,"Recommendation control must not already have a slot");
      assert.equal(initial.restaurant.bookingHandoffs?.length ?? 0,0);
    }
    if(path === "P4") {
      turn="G1_QUESTION";
      await completed(()=>application.askRestaurantQuestion({userId:"g6-development-user",caseId:initial.case.caseId,candidateId:first,question:source.question,requestId:"g6-question",expectedVersion:initial.case.taskVersion}));
      const after=project(await application.getCase("g6-development-user",initial.case.caseId));
      artifact={...artifact,after,afterArtifact:await application.exportReadArtifact(initial.case.caseId)};
      const answer=after.restaurant.pageQuestion?.result;
      assert.equal(answer?.status,"ANSWERED","Explicit bound G1 follow-up must reach the core");
      assert.ok(answer && answer.status === "ANSWERED");
      assert.equal(answer.candidateId,first);
      assert.deepEqual(answer.citations.map(c=>[c.text,c.url,c.readAt]),[[source.merchantQuote,source.pageUrl,source.referenceTime]]);
    } else {
    turn = "BOOK_DISPLAYED";
    const boundary = requests.length;
    await completed(()=>application.submitMessage({userId:"g6-development-user",conversationId:initial.case.conversationId,requestId:"g6-book-displayed",expectedVersion:initial.case.taskVersion,
      message:path === "P2" ? source.uncheckedBookingRequest : source.bookingFollowups[variant]!,viewContext:{view:"DETAILS",candidateId:first,comparedCandidateIds:[]}}));
    let after = project(await application.getCase("g6-development-user",initial.case.caseId));
    if(path === "P2") {
      artifact={...artifact,missingParty:after};
      assert.equal(after.case.phase,"NEEDS_INPUT");
      assert.equal(after.restaurant.intentDraft?.partySize,undefined);
      assert.equal(after.restaurant.bookingHandoffs?.length ?? 0,0,"No B1 from a recommendation or missing guests");
      turn="ADD_PARTY";
      await completed(()=>application.submitMessage({userId:"g6-development-user",conversationId:initial.case.conversationId,requestId:"g6-add-party",expectedVersion:after.case.taskVersion,message:source.partyReply}));
      after=project(await application.getCase("g6-development-user",initial.case.caseId));
    }
    const afterArtifact = await application.exportReadArtifact(initial.case.caseId);
    artifact = {...artifact,followup:path === "P2" ? source.uncheckedBookingRequest : source.bookingFollowups[variant],after,afterArtifact,boundary,requests,sourceCalls};
    assert.equal(after.restaurant.selectedCandidateId,first,"G6-P1: booking follow-up must select the explicitly displayed outlet");
    const handoff = after.restaurant.bookingHandoffs?.find(h=>h.candidateId===first);
    assert.ok(handoff,"G6-P1: booking follow-up must keep an admitted B1 handoff");
    assert.match(handoff.continueLabel,/filled in/);
    if(provider==="TABLECHECK"){
      const url=new URL(handoff.url),expected=new URL(source.tablecheck.expectedHandoffUrl);
      assert.equal(url.origin+url.pathname,expected.origin+expected.pathname);
      assert.deepEqual([...url.searchParams.entries()].sort(),[...expected.searchParams.entries()].sort());
    } else assert.equal(handoff.url,(source.vacancy.body as {selection:Array<{url:string}>}).selection[0]!.url);
    }
    }
    assert.ok(!sourceCalls.some(c=>c.kind==="BROWSER_NAVIGATE"&&/form_course|yoyaku|payment|confirm|checkout/.test(new URL(c.url).pathname)),"No workflow request in this turn");
    await writeFile(join(output,"preflight.json"),JSON.stringify({...artifact,requests,sourceCalls,status:"PASS",realModelCalls:0,publicGET:0},null,2)+"\n",{flag:"wx"});
    return {status:"PASS",path,variant,output};
  } catch (error) {
    await writeFile(join(output,"preflight.json"),JSON.stringify({...artifact,status:"FAILED",failure:{name:error instanceof Error?error.name:"Error",message:error instanceof Error?error.message:"Unknown failure"},requests,sourceCalls,realModelCalls:0,publicGET:0},null,2)+"\n",{flag:"wx"});
    throw error;
  } finally {await application.stopActiveReads();await pglite.close();}
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args=process.argv.slice(2);if(args.length!==4||args[0]!=="--out"||args[2]!=="--path"||!["P1","P2","P3","P4"].includes(args[3]!))throw new Error("Usage: g6-development-preflight.ts --out <new-output-directory> --path P1|P2|P3|P4");
  try {console.log(JSON.stringify(await runG6DevelopmentPreflight(resolve(args[1]!),args[3] as "P1"|"P2"|"P3"|"P4")));}
  catch(error){console.error(error instanceof Error?error.message:"G6 preflight failed");process.exitCode=1;}
}
