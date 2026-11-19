import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { RestaurantAgentLoopCoordinator } from "./restaurant-agent-loop.js";
import { RestaurantExecutionRouter } from "./restaurant-execution-router.js";
import type { TaskSnapshot } from "../core/task-runtime/contracts.js";
import { restaurantSearchIntentFingerprint, type RestaurantAgentLoopTermination, type RestaurantOutcome, type RestaurantTaskState, type RestaurantEvent } from "../domains/restaurant/contracts.js";
import { ScriptedRestaurantAgentDecisionPort, type RestaurantAgentDecisionPort } from "../domains/restaurant/agent-decision.js";
import { defaultBatchDeliveryCandidateIds, validateRestaurantAction } from "../domains/restaurant/action-validator.js";
import { assessRestaurantRead, discoveryShortBatchDeliveryReady } from "../domains/restaurant/read-assessment.js";
import { projectRestaurantAgentContext } from "../domains/restaurant/agent-context.js";
import { completeRestaurantSearchIntent } from "../domains/restaurant/intent-state.js";
import { restaurantBookingTaskDefinition as definition } from "../domains/restaurant/task-definition.js";
import { InMemoryRestaurantAgentTrajectoryStore } from "../infrastructure/postgres/restaurant-agent-trajectory-store.js";

interface SavedState { name: string; now: string; reason: string; state: RestaurantTaskState; source: { stateVersionBefore: number }; }
const fixtures = JSON.parse(await readFile(new URL("./fixtures/p1-g2-h001-terminal-states.json", import.meta.url), "utf8")) as { states: SavedState[] };

// A real saved state is explicitly injected for terminal-path regression only.
// This is not an end-to-end discovery claim; the separate native composition
// tests retain the production Guard, network policy and evidence-producing path.
async function stop(fixture: SavedState, termination: RestaurantAgentLoopTermination = "REJECTION_LIMIT", runFailure?: "PROVIDER_REJECTED" | "UNCAUGHT_EXCEPTION" | "EXHAUSTED_BROWSER" | "EXHAUSTED_MODEL" | "FAILED_SEARCH", timing?: { now: () => Date; afterPresentation?: (presentationTime: string) => void }) {
  let ticks = 0;
  const clock = { now: timing?.now ?? (() => new Date(Date.parse(fixture.now) + ticks++)) };
  let current: TaskSnapshot<RestaurantTaskState, RestaurantOutcome> = {
    id: "saved-h001", runId: "saved-h001", taskType: definition.type, definitionVersion: definition.version,
    domainState: structuredClone(fixture.state), lifecycleState: definition.getLifecycleState(fixture.state),
    outcome: definition.evaluateOutcome(fixture.state), version: fixture.source.stateVersionBefore,
    createdAt: fixture.now, updatedAt: fixture.now,
  };
  const initial = structuredClone(current);
  const events: string[] = [];
  const trajectories = new InMemoryRestaurantAgentTrajectoryStore();
  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { throw new Error("No network allowed"); } },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { throw new Error("No network allowed"); } }, { structuredReadTimeoutMs: 8_000, browserReadTimeoutMs: 20_000 },
  );
  const afterPresentation = timing?.afterPresentation;
  if (afterPresentation) {
    const execute = router.execute.bind(router);
    router.execute = async (action, state, now) => {
      const result = await execute(action, state, now);
      if (result.event?.type === "RESULTS_PRESENTED") {
        assert.ok(now);
        afterPresentation(now);
      }
      return result;
    };
  }
  let decisionCalls = 0;
  const decision = new ScriptedRestaurantAgentDecisionPort((runFailure === "EXHAUSTED_BROWSER" || runFailure === "FAILED_SEARCH") ? Array.from({length:12},()=>({type:"SEARCH_RESTAURANTS" as const})) : runFailure === "UNCAUGHT_EXCEPTION"
    ? [{ type: "CHECK_AVAILABILITY", candidateIds: assessRestaurantRead(fixture.state, fixture.now).checkableCandidateIds.slice(0, 1) }] : []);
  if (runFailure === "PROVIDER_REJECTED") decision.decide = async () => ({ status: "MODEL_FAILURE", errorCode: "PROVIDER_REJECTED", retryable: false });
  if (runFailure === "EXHAUSTED_BROWSER" || runFailure === "FAILED_SEARCH") {
    const code = runFailure === "FAILED_SEARCH" ? "SEARCH_FAILED" : "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED";
    const originalDecide = decision.decide.bind(decision);
    decision.decide = async input => { decisionCalls++; return originalDecide(input); };
    router.execute = async () => ({ event: {type:"SEARCH_FAILED",code,reason:"Scripted failed search"}, observation: {type:"DISCOVERY_FAILED",detail:"No model budget"}, failure: {source:"PROVIDER",scope:"PROVIDER",code,reason:"Scripted failed search",terminal:false} });
  }
  if (runFailure === "EXHAUSTED_MODEL") decision.decide = async () => {
    throw new Error("Budget exhaustion must deliver without a model call");
  };
  if (runFailure === "UNCAUGHT_EXCEPTION") router.execute = async () => { throw new Error("Uncaught router exception"); };
  const coordinator = new RestaurantAgentLoopCoordinator({
    async snapshot() { return current; },
    async dispatch(envelope, expectedVersion) {
      assert.equal(expectedVersion, current.version);
      const result = definition.transition(current.domainState, envelope.event, {
        taskId: current.id, runId: current.runId, now: envelope.occurredAt, createId: prefix => prefix,
      });
      events.push(envelope.event.type);
      current = { ...current, domainState: result.state, version: current.version + 1,
        lifecycleState: definition.getLifecycleState(result.state), outcome: definition.evaluateOutcome(result.state), updatedAt: envelope.occurredAt };
      return { snapshot: current, commands: [], duplicateEvent: false };
    },
  }, decision, router, trajectories, clock, { maxSteps: 12, maxRejectedActions: 3, timeoutMs: 500_000,
    ...(runFailure === "EXHAUSTED_MODEL" ? { remainingModelCalls: () => 0 } : {}),
  });
  // Deliberately exercise the same internal stop boundary as the recorded
  // trajectory, with a monotonically advancing clock rather than frozen time.
  if (runFailure) await coordinator.run(current.id);
  else await Reflect.get(coordinator, "terminate").call(coordinator, current, {
    id: "stop", taskId: current.id, stepNumber: 1, occurredAt: fixture.now,
    stateVersionBefore: current.version, stateHashBefore: "saved-state",
    causalRefs: { eventIds: [], commandIds: [], attemptIds: [], evidenceIds: [] }, capabilities: [],
  }, termination, fixture.reason);
  return { initial, current, events, trajectories, decisionCalls };
}

for (const fixture of fixtures.states) test(`P1-G2 actual ${fixture.name} stop returns a user-facing outcome`, async () => {
  const result = await stop(fixture);
  console.log(JSON.stringify({ fixture: fixture.name, phaseBefore: result.initial.domainState.phase,
    failureBefore: result.initial.domainState.failure?.code ?? null, events: result.events,
    phaseAfter: result.current.domainState.phase }));
  assert.equal(result.current.domainState.phase, "NO_VERIFIED_RESULT");
  assert.equal(result.current.outcome?.status, "NO_VERIFIED_RESULT");
  assert.ok(result.current.domainState.noVerifiedResult?.remainingGaps.some(gap => gap.includes("REJECTION_LIMIT")));
  assert.equal(result.current.domainState.presentedResults, undefined);
});

for (const [termination, code] of [
  ["REJECTION_LIMIT", "BROWSER_RUNTIME_FAILED"], ["NO_PROGRESS", "GOOGLE_LOCATION_UNRESOLVED"], ["STEP_LIMIT", "AVAILABILITY_FAILED"],
] as const) test(`P1-G2 ${termination} retains ${code} as a scoped reason`, async () => {
  const fixture = structuredClone(fixtures.states[0]!);
  fixture.state.failure = { code, message: "Recorded local read failure" };
  const { current } = await stop(fixture, termination);
  assert.equal(current.domainState.phase, "NO_VERIFIED_RESULT");
  assert.equal(current.domainState.failure, undefined);
  const summary = current.domainState.noVerifiedResult!;
  assert.ok(summary.remainingGaps.some(gap => gap.includes(termination) && gap.includes(code)));
  const checked = fixture.state.candidates.filter(c => fixture.state.availabilityChecks[c.restaurant.id] || fixture.state.factChecks?.[c.restaurant.id]).map(c => c.restaurant.id);
  assert.deepEqual(summary.investigatedCandidateIds, checked);
  assert.ok(summary.remainingGaps.some(gap => gap.includes("NOT_CHECKED")), "unread outlets must remain explicit gaps");
  assert.ok(summary.remainingGaps.some(gap => gap.includes("unread discovery entries")));
});

for (const failure of ["PROVIDER_REJECTED", "UNCAUGHT_EXCEPTION"] as const) test(`P1-G2 actual ${failure} stays FAILED`, async () => {
  const result = await stop(fixtures.states[0]!, "REJECTION_LIMIT", failure);
  assert.equal(result.current.domainState.phase, "FAILED");
  assert.equal(result.current.domainState.failure?.code, failure === "PROVIDER_REJECTED" ? "PROVIDER_REJECTED" : "AGENT_EXECUTION_FAILED");
  assert.equal(result.current.domainState.noVerifiedResult, undefined);
});

for (const code of ["AUTHORIZATION_INVALID", "SIDE_EFFECT_UNCERTAIN"] as const) test(`P1-G2 ${code} cannot become a business completion`, async () => {
  const fixture = structuredClone(fixtures.states[0]!);
  fixture.state.failure = { code, message: "System safety failure" };
  const result = await stop(fixture);
  assert.equal(result.current.domainState.phase, "FAILED");
  assert.equal(result.current.domainState.noVerifiedResult, undefined);
});

const exhaustedFixture = JSON.parse(await readFile(new URL("./fixtures/p2-0-h001-exhausted-state.json", import.meta.url), "utf8")) as SavedState;
test("P2-0 actual h001 step-six exhausted state stops before another model proposal", async () => {
  const result = await stop(exhaustedFixture, "NO_PROGRESS", "EXHAUSTED_BROWSER");
  console.log(JSON.stringify({decisionCalls:result.decisionCalls,phase:result.current.domainState.phase,events:result.events}));
  assert.ok(result.decisionCalls <= 2, "known budget failure must not cause more agent proposals");
  assert.equal(result.current.domainState.phase,"NO_VERIFIED_RESULT");
});
test("P2-0 bounded timeout returns a truthful user result", async () => {
  const result = await stop(fixtures.states[0]!, "TIMEOUT");
  assert.equal(result.current.domainState.phase,"NO_VERIFIED_RESULT");
});

for (const type of ["SEARCH_RESTAURANTS", "INVESTIGATE_CANDIDATE_FACTS", "CHECK_AVAILABILITY"] as const) test(`P2-0 ${type} rejects a known exhausted budget before source work`, () => {
  const action = type === "SEARCH_RESTAURANTS" ? {type} : {type,candidateIds:exhaustedFixture.state.candidates.slice(0,1).map(c=>c.restaurant.id)};
  assert.equal(validateRestaurantAction(exhaustedFixture.state,action,exhaustedFixture.now).status,"REJECTED");
  const fresh=structuredClone(fixtures.states[0]!.state); delete fresh.failure;
  assert.equal(validateRestaurantAction(fresh,action,exhaustedFixture.now,{remainingModelCalls:0}).status,"REJECTED");
  assert.equal(validateRestaurantAction(fresh,action,exhaustedFixture.now,{browserModelBudgetExhausted:true}).status,"REJECTED");
});

test("P2-0 failed executions do not reset consecutive no-progress accounting", async () => {
  const fixture=structuredClone(exhaustedFixture); fixture.state.failure={code:"SEARCH_FAILED",message:"Scoped read failure"};
  const result=await stop(fixture,"NO_PROGRESS","FAILED_SEARCH");
  assert.equal(result.decisionCalls,3);
  assert.equal(result.current.domainState.phase,"NO_VERIFIED_RESULT");
  assert.ok(result.current.domainState.noVerifiedResult?.remainingGaps.some(g=>g.includes("NO_PROGRESS")));
});

test("P2-0 system-ended no-result records structured business termination", async () => {
  const result=await stop(exhaustedFixture,"NO_PROGRESS","EXHAUSTED_BROWSER");
  const reason=(result.current.domainState.noVerifiedResult as unknown as {termination?: {type:string;reasonCode:string;isSystemReason:boolean}})?.termination;
  assert.deepEqual(reason && {type:reason.type,reasonCode:reason.reasonCode,isSystemReason:reason.isSystemReason},
    {type:"NO_PROGRESS",reasonCode:"BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED",isSystemReason:false});
});

test("P2-0 failure classification is exhaustive across typed model/browser/Google contracts", async () => {
  const {RESTAURANT_FAILURE_CLASSIFICATION: classes,restaurantFailureCode}=await import("../domains/restaurant/failure-codes.js");
  const checked: Record<import("../core/model/errors.js").ModelGatewayErrorCode
    | import("../infrastructure/browser/browser-runtime-errors.js").BrowserRuntimeFailureCode
    | import("../integrations/google/google-places-contracts.js").GooglePlacesError["code"],"SYSTEM"|"BUSINESS">=classes;
  assert.equal(checked.BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED,"BUSINESS");
  assert.equal(checked.PROVIDER_REJECTED,"SYSTEM");
  // @ts-expect-error Adding a code without classifying it must not compile.
  const missing: Record<import("../domains/restaurant/failure-codes.js").RestaurantFailureCode|"NEW_UNCLASSIFIED_FAILURE","SYSTEM"|"BUSINESS">=classes;
  void missing;
  assert.equal(restaurantFailureCode("arbitrary provider code","SEARCH_FAILED"),"AGENT_EXECUTION_FAILED");
});

test("P2-0 an unrecognized persisted failure cannot default to business", async()=>{
  const {restaurantReadStopIsSystem}=await import("../domains/restaurant/read-loop-termination.js");
  assert.equal(restaurantReadStopIsSystem("NO_PROGRESS","unclassified persisted code" as import("../domains/restaurant/failure-codes.js").RestaurantFailureCode),true);
});

// Fixed pre-action Live checkpoint, reconstructed locally; not a website replay.
// The actual coordinator/context/Validator/Router/Reducer decide what is legal.
test('F6 slot3 26.596 seconds blocks the original availability action and ends honestly',async()=>{
 const f=JSON.parse(await readFile(new URL('./fixtures/f6-slot3-read-state.json',import.meta.url),'utf8'));
 const observedContexts:import('../domains/restaurant/agent-context.js').RestaurantAgentContext[]=[];let sourceCalls=0;
 const start=Date.parse(f.referenceTime),instant=start+f.maxAutomaticMs-f.remainingMs;
 const localClock={now:()=>new Date(instant)};
 const currentState:RestaurantTaskState={...f.state,schemaVersion:"25"};
 let current:TaskSnapshot<RestaurantTaskState,RestaurantOutcome>={id:'f6-slot3',runId:'f6-slot3',taskType:definition.type,definitionVersion:definition.version,version:8,lifecycleState:definition.getLifecycleState(currentState),domainState:currentState,outcome:definition.evaluateOutcome(currentState),createdAt:f.referenceTime,updatedAt:localClock.now().toISOString()};
 const events:RestaurantEvent[]=[];const trajectories=new InMemoryRestaurantAgentTrajectoryStore();
 const router=new RestaurantExecutionRouter({executionRoute:'STRUCTURED_ADAPTER',async search(){throw Error('No search expected');}},
  {executionRoute:'STRUCTURED_ADAPTER',async check(request){sourceCalls++;return {offers:[],evidence:[],availabilityChecks:Object.fromEntries(request.candidateIds.map(id=>[id,{status:'UNKNOWN' as const,checkedAt:localClock.now().toISOString(),evidenceIds:[]}])),metadata:{provider:'FIXTURE',route:'STRUCTURED_ADAPTER',latencyMs:0}};}},{structuredReadTimeoutMs:8000,browserReadTimeoutMs:500000});
 const scripted=new ScriptedRestaurantAgentDecisionPort([f.action,f.action,f.action]);
 const decision:RestaurantAgentDecisionPort={decide:async input=>{observedContexts.push(input.context);return scripted.decide(input);}};
 const coordinator=new RestaurantAgentLoopCoordinator({snapshot:async()=>current,dispatch:async(envelope,version)=>{
  assert.equal(version,current.version);const changed=definition.transition(current.domainState,envelope.event,{taskId:current.id,runId:current.runId,now:envelope.occurredAt,createId:p=>p});events.push(envelope.event);
  current={...current,domainState:changed.state,version:current.version+1,lifecycleState:definition.getLifecycleState(changed.state),outcome:definition.evaluateOutcome(changed.state),updatedAt:envelope.occurredAt};return {snapshot:current,commands:[],duplicateEvent:false};
 }},decision,router,trajectories,localClock,{maxSteps:4,maxRejectedActions:3,timeoutMs:f.maxAutomaticMs,remainingModelCalls:()=>f.remainingModelCalls});
 await coordinator.run(current.id,undefined,new Date(start+f.maxAutomaticMs));
 assert.equal(sourceCalls,0,'the original slot3 CHECK_AVAILABILITY must never start with only 26.596 seconds');
 assert.deepEqual(observedContexts[0]?.legalActions.checkAvailability,[],'real code-derived context removes the unaffordable action');
 assert.equal(current.domainState.phase,'NO_VERIFIED_RESULT');assert.equal(current.domainState.presentedResults,undefined);
 assert.ok(current.domainState.noVerifiedResult?.remainingGaps.some(gap=>/time|reserve|未|UNKNOWN|NOT_CHECKED/i.test(gap)));
 assert.equal(current.domainState.searchContinuation?.exhausted,f.state.searchContinuation?.exhausted,'closure cannot manufacture source exhaustion');
 assert.equal(events.filter(e=>e.type==='AVAILABILITY_CHECKED').length,0);
});

function qualifiedBudgetFixture(count: number): SavedState {
  const now = "2026-11-19T09:00:00.000Z";
  const candidates: RestaurantTaskState["candidates"] = Array.from({length:count}, (_, index) => {
    const id = String(index+1);
    return {
      restaurant:{id,outletName:"Fixture "+id,address:"Shinjuku "+id,sourceIds:{googlePlaces:"place-"+id},provenance:{}},
      matchReasons:[],warnings:[],executionConfidence:"HIGH",
    };
  });
  const readEvidence: RestaurantTaskState["readEvidence"] = candidates.flatMap(({restaurant:{id}}) => {
    const binding = {candidateId:id,sourceEntityId:"place-"+id,provider:"GOOGLE_PLACES" as const,observedAt:now,requestFingerprint:"fixture"};
    return [
      {...binding,evidenceId:"area-"+id,kind:"DISCOVERY" as const,claims:{areaQuery:"Shinjuku",areaMatch:true}},
      {...binding,evidenceId:"entity-"+id,kind:"ENTITY_MATCH" as const,claims:{},entityMatch:{confidence:"HIGH" as const,matchedBy:["FIXTURE"]}},
      {...binding,evidenceId:"fact-"+id,kind:"RESTAURANT_FACT" as const,claims:{}},
    ];
  });
  return {
    name:"qualified-budget",now,reason:"Model calls exhausted",source:{stateVersionBefore:10},
    state:{
      schemaVersion:"25",phase:"SEARCHING",pendingResultBatchTarget:3,searchRevision:1,
      intentDraft:{schemaVersion:"3",timezone:"Asia/Tokyo",target:{goal:"RECOMMENDATION",query:"restaurants",selectionScope:"OPEN_ENDED"},
        area:{query:"Shinjuku"},criteria:[]},
      candidates,readEvidence,availability:{},availabilityChecks:{},
    },
  };
}

for (const count of [1,2]) test(`first short batch still delivers ${count} qualified restaurants after saving a card`,async()=>{
  const fixture = qualifiedBudgetFixture(count);
  fixture.state = definition.transition(fixture.state,{type:"SHORTLIST_UPDATED",candidateId:"1",shortlisted:true},
    {taskId:"fixture",runId:"fixture",now:fixture.now,createId:prefix=>prefix}).state;
  assert.deepEqual(fixture.state.selectionSession?.deliveredCandidateIds,[]);
  assert.deepEqual(fixture.state.selectionSession?.shortlistCandidateIds,["1"]);
  const result = await stop(fixture,"NO_PROGRESS","EXHAUSTED_MODEL");
  assert.equal(result.current.domainState.phase,"PRESENT_RESULTS");
  assert.deepEqual(result.current.domainState.presentedResults?.candidateIds,count===1?["1"]:["1","2"]);
  assert.ok(result.events.includes("DEFAULT_BATCH_DELIVERY_WINDOW_OPENED"));
  assert.deepEqual(result.current.domainState.selectionSession?.shortlistCandidateIds,["1"]);
});

test("previously delivered restaurants cannot open a first-batch short delivery window",()=>{
  const {state,now} = qualifiedBudgetFixture(2);
  state.selectionSession = {deliveredCandidateIds:["earlier"],viewedCandidateIds:[],shortlistCandidateIds:["1"]};
  assert.deepEqual(defaultBatchDeliveryCandidateIds(state,now),[]);
});

for (const continuing of [false,true]) test(`budget exhaustion delivers only three qualified ${continuing?"new":"first-batch"} restaurants`,async()=>{
  const fixture = qualifiedBudgetFixture(continuing?8:5);
  if (continuing) fixture.state.selectionSession = {deliveredCandidateIds:["1","2","3"],viewedCandidateIds:[],shortlistCandidateIds:[]};
  assert.equal(assessRestaurantRead(fixture.state,fixture.now).presentation.filter(item=>item.eligible).length,continuing?8:5);
  const result = await stop(fixture,"NO_PROGRESS","EXHAUSTED_MODEL");
  assert.equal(result.current.domainState.phase,"PRESENT_RESULTS");
  assert.deepEqual(result.current.domainState.presentedResults?.candidateIds,continuing?["4","5","6"]:["1","2","3"]);
  assert.deepEqual(result.events,["RESULTS_PRESENTED"]);
});

for (const exhausted of [false, true]) test(`expired read-end deadline with ${exhausted ? "exhausted" : "unread"} sources resolves without reopening a short window`, async () => {
  const fixture = qualifiedBudgetFixture(1);
  const { state, now } = fixture;
  state.readEndWindow = {
    reason: "DELIVERY_TIME", openedAt: new Date(Date.parse(now) - 1000).toISOString(), deadlineAt: now,
  };
  state.searchContinuation = { intentFingerprint: "recorded", usedPageTokens: [], pagesRead: 1, exhausted };
  if (exhausted) state.factChecks = { "1": { status: "COMPLETED", checkedAt: now, evidenceIds: ["fact-1"] } };
  const afterDeadline = new Date(Date.parse(now) + 1);
  const assessment = assessRestaurantRead(state, afterDeadline.toISOString());
  assert.deepEqual(assessment.factInvestigableCandidateIds, exhausted ? [] : ["1"]);
  assert.deepEqual(assessment.checkableCandidateIds, []);
  const { current, events, trajectories } = await stop(fixture, "NO_PROGRESS", "EXHAUSTED_MODEL", { now: () => afterDeadline });
  assert.equal(current.domainState.phase, exhausted ? "PRESENT_RESULTS" : "NO_VERIFIED_RESULT");
  assert.deepEqual(events, [exhausted ? "RESULTS_PRESENTED" : "AGENT_LOOP_TERMINATED"]);
  assert.equal((await trajectories.list(current.id)).at(-1)?.stepOutcome, "TERMINAL");
});

test("the real Reducer accepts short delivery at the deadline even after the clock advances before dispatch", async () => {
  const fixture = qualifiedBudgetFixture(1);
  const atDeadline = Date.parse(fixture.now);
  fixture.state.readEndWindow = { reason: "MODEL_CALL", openedAt: new Date(atDeadline - 1000).toISOString(), deadlineAt: fixture.now };
  let instant = atDeadline;
  let routed = false;
  const { current, events } = await stop(fixture, "NO_PROGRESS", undefined, {
    now: () => new Date(instant),
    afterPresentation(presentationTime) {
      assert.equal(presentationTime, fixture.now);
      routed = true;
      instant += 1;
    },
  });
  assert.equal(routed, true);
  assert.equal(instant, atDeadline + 1);
  assert.equal(current.updatedAt, fixture.now);
  assert.equal(current.domainState.phase, "PRESENT_RESULTS");
  assert.deepEqual(events, ["DEFAULT_BATCH_DELIVERY_WINDOW_OPENED", "RESULTS_PRESENTED"]);
});

test("another batch continues past a cross-source duplicate, ends when exhausted, and delivers a genuinely new outlet", async () => {
  const { state, now } = qualifiedBudgetFixture(3);
  const [a, alias, b] = state.candidates;
  a!.restaurant.sourceIds.discoverySourceId = "tabelog";
  alias!.restaurant.sourceIds.discoverySourceId = "tablecheck";
  alias!.restaurant.outletName = a!.restaurant.outletName;
  alias!.restaurant.address = a!.restaurant.address;
  b!.restaurant.sourceIds.discoverySourceId = "google-places";
  state.candidates = [a!, alias!];
  state.selectionSession = { deliveredCandidateIds: ["1"], viewedCandidateIds: [], shortlistCandidateIds: [] };
  state.factChecks = Object.fromEntries(["1", "2", "3"].map(id => [id, { status: "COMPLETED", checkedAt: now, evidenceIds: ["fact-" + id] }]));
  const entries = ["tabelog", "tablecheck", "google-places"].map(sourceId => ({
    sourceId, query: { positiveCriteria: [], category: "restaurant",
      location: { latitude: 35.69, longitude: 139.7, radiusMeters: 1000, label: "Shinjuku", areaMatchBasis: "TASK_LOCATION_RADIUS" as const } },
  }));
  state.searchContinuation = {
    intentFingerprint: restaurantSearchIntentFingerprint(completeRestaurantSearchIntent(state.intentDraft)!),
    usedPageTokens: [], pagesRead: 2, exhausted: false, discoveryPlan: { entries, cursor: 2 },
    currentDiscoveryBatch: { sourceId: "tablecheck", candidateIds: ["2"] },
  };
  const context = projectRestaurantAgentContext(state, now);
  assert.equal(assessRestaurantRead(state, now).presentation.find(item => item.candidateId === "2")?.eligible, true);
  assert.deepEqual(context.legalActions.presentResults, []);
  assert.equal(context.legalActions.search, true);
  assert.equal(discoveryShortBatchDeliveryReady(state, now), false);
  for (const candidateId of ["1", "2"]) {
    const result = validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: [candidateId] }, now);
    assert.equal(result.status, "REJECTED");
    assert.equal("code" in result && result.code, "PRESENTATION_EVIDENCE_MISSING");
  }
  for (const reason of ["DELIVERY_TIME", "MODEL_CALL"] as const) {
    assert.equal(assessRestaurantRead({ ...state, readEndWindow: { reason, openedAt: now, deadlineAt: now } }, now).canEndRead, true);
  }

  const exhausted: RestaurantTaskState = { ...state, searchContinuation: { ...state.searchContinuation, exhausted: true, discoveryPlan: { entries, cursor: 3 } } };
  const assessment = assessRestaurantRead(exhausted, now);
  assert.deepEqual(assessment.factInvestigableCandidateIds, []);
  assert.deepEqual(assessment.checkableCandidateIds, []);
  assert.equal(assessment.canEndRead, true);

  const router = new RestaurantExecutionRouter(
    { executionRoute: "STRUCTURED_ADAPTER", async search() { throw new Error("No source calls expected"); } },
    { executionRoute: "STRUCTURED_ADAPTER", async check() { throw new Error("No source calls expected"); } },
    { structuredReadTimeoutMs: 8000, browserReadTimeoutMs: 20_000 },
  );
  const reduce = (snapshot: RestaurantTaskState, event: RestaurantEvent) =>
    definition.transition(snapshot, event, { taskId: "batch", runId: "batch", now, createId: prefix => prefix }).state;
  const end = { type: "END_READ" as const };
  assert.equal(validateRestaurantAction(exhausted, end, now).status, "ALLOWED");
  const ended = await router.execute(end, exhausted, now);
  assert.equal(ended.event?.type, "READ_ENDED_NO_VERIFIED_RESULT");
  assert.equal(reduce(exhausted, ended.event!).phase, "NO_VERIFIED_RESULT");

  const withNew: RestaurantTaskState = {
    ...exhausted, candidates: [a!, alias!, b!],
    searchContinuation: { ...exhausted.searchContinuation!, currentDiscoveryBatch: { sourceId: "google-places", candidateIds: ["3"] } },
  };
  assert.deepEqual(projectRestaurantAgentContext(withNew, now).legalActions.presentResults, ["3"]);
  const present = { type: "PRESENT_RESULTS" as const, candidateIds: ["3"] };
  assert.equal(validateRestaurantAction(withNew, present, now).status, "ALLOWED");
  const presented = await router.execute(present, withNew, now);
  assert.equal(presented.event?.type, "RESULTS_PRESENTED");
  const delivered = reduce(withNew, presented.event!);
  assert.deepEqual(delivered.presentedResults?.candidateIds, ["3"]);
  assert.deepEqual(delivered.selectionSession?.deliveredCandidateIds, ["1", "3"]);
});
