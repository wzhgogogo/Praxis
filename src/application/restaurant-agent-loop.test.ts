import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { RestaurantAgentLoopCoordinator } from "./restaurant-agent-loop.js";
import { RestaurantExecutionRouter } from "./restaurant-execution-router.js";
import type { TaskSnapshot } from "../core/task-runtime/contracts.js";
import type { RestaurantAgentLoopTermination, RestaurantOutcome, RestaurantTaskState } from "../domains/restaurant/contracts.js";
import { ScriptedRestaurantAgentDecisionPort } from "../domains/restaurant/agent-decision.js";
import { validateRestaurantAction } from "../domains/restaurant/action-validator.js";
import { assessRestaurantRead } from "../domains/restaurant/read-assessment.js";
import { restaurantBookingTaskDefinition as definition } from "../domains/restaurant/task-definition.js";
import { InMemoryRestaurantAgentTrajectoryStore } from "../infrastructure/postgres/restaurant-agent-trajectory-store.js";

interface SavedState { name: string; now: string; reason: string; state: RestaurantTaskState; source: { stateVersionBefore: number }; }
const fixtures = JSON.parse(await readFile(new URL("./fixtures/p1-g2-h001-terminal-states.json", import.meta.url), "utf8")) as { states: SavedState[] };

// A real saved state is explicitly injected for terminal-path regression only.
// This is not an end-to-end discovery claim; the separate native composition
// tests retain the production Guard, network policy and evidence-producing path.
async function stop(fixture: SavedState, termination: RestaurantAgentLoopTermination = "REJECTION_LIMIT", runFailure?: "PROVIDER_REJECTED" | "UNCAUGHT_EXCEPTION" | "EXHAUSTED_BROWSER" | "FAILED_SEARCH") {
  let ticks = 0;
  const clock = { now: () => new Date(Date.parse(fixture.now) + ticks++) };
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
    { executionRoute: "STRUCTURED_ADAPTER", async check() { throw new Error("No network allowed"); } },
  );
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
  }, decision, router, trajectories, clock);
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
