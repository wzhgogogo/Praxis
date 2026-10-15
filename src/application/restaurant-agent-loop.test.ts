import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { RestaurantAgentLoopCoordinator } from "./restaurant-agent-loop.js";
import { RestaurantExecutionRouter } from "./restaurant-execution-router.js";
import type { TaskSnapshot } from "../core/task-runtime/contracts.js";
import type { RestaurantAgentLoopTermination, RestaurantOutcome, RestaurantTaskState } from "../domains/restaurant/contracts.js";
import { ScriptedRestaurantAgentDecisionPort } from "../domains/restaurant/agent-decision.js";
import { assessRestaurantRead } from "../domains/restaurant/read-assessment.js";
import { restaurantBookingTaskDefinition as definition } from "../domains/restaurant/task-definition.js";
import { InMemoryRestaurantAgentTrajectoryStore } from "../infrastructure/postgres/restaurant-agent-trajectory-store.js";

interface SavedState { name: string; now: string; reason: string; state: RestaurantTaskState; source: { stateVersionBefore: number }; }
const fixtures = JSON.parse(await readFile(new URL("./fixtures/p1-g2-h001-terminal-states.json", import.meta.url), "utf8")) as { states: SavedState[] };

// A real saved state is explicitly injected for terminal-path regression only.
// This is not an end-to-end discovery claim; the separate native composition
// tests retain the production Guard, network policy and evidence-producing path.
async function stop(fixture: SavedState, termination: RestaurantAgentLoopTermination = "REJECTION_LIMIT", runFailure?: "PROVIDER_REJECTED" | "UNCAUGHT_EXCEPTION") {
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
  const decision = new ScriptedRestaurantAgentDecisionPort(runFailure === "UNCAUGHT_EXCEPTION"
    ? [{ type: "CHECK_AVAILABILITY", candidateIds: assessRestaurantRead(fixture.state, fixture.now).checkableCandidateIds.slice(0, 1) }] : []);
  if (runFailure === "PROVIDER_REJECTED") decision.decide = async () => ({ status: "MODEL_FAILURE", errorCode: "PROVIDER_REJECTED", retryable: false });
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
  return { initial, current, events, trajectories };
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
