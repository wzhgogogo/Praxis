import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";
import type { RestaurantSemanticInterpreterPort, RestaurantPartySizeSupplementResolverPort } from "./restaurant-message-handler.js";
import { restaurantEventForMessage } from "./restaurant-message-handler.js";
import { RestaurantSemanticInterpreter } from "../domains/restaurant/semantic-interpreter.js";
import { restaurantBookingTaskDefinition } from "../domains/restaurant/task-definition.js";
import { InMemoryTaskRuntime } from "../core/task-runtime/in-memory-task-runtime.js";
import { FakeClock } from "../harness/fake-clock.js";

const availabilityProposal = (partySize?: number): RestaurantSemanticProposal => ({
  schemaVersion: "4",
  facts: [
    { field: "TARGET", operation: "ASSERT", value: { goalBasis: { type: "JUDGMENT", reason: "Controlled fixture target.", quotes: ["find"] }, kind: "TARGET", goal: "AVAILABILITY", query: "find a table" } },
    { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-09-19", raw: "tomorrow" } },
    { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
    { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shibuya" } },
    ...(partySize === undefined ? [] : [{ field: "PARTY_SIZE" as const, operation: "ASSERT" as const, value: { kind: "PARTY_SIZE" as const, value: partySize, source: "EXPLICIT" as const } }]),
  ],
});

function interpreter(proposal: RestaurantSemanticProposal): RestaurantSemanticInterpreterPort {
  return { interpret: async () => ({ status: "PROPOSED", proposal, attempts: [] }) };
}

function resolver(status: "RESOLVED" | "UNKNOWN" | "MODEL_FAILURE", partySize = 2): { port: RestaurantPartySizeSupplementResolverPort; calls: () => number } {
  let count = 0;
  return {
    calls: () => count,
    port: {
      resolve: async () => {
        count += 1;
        if (status === "RESOLVED") return { status, partySize, attempts: [{ invocationId: "resolver", provider: "FIXTURE", model: "fixture", purpose: "restaurant_party_size_supplement", promptVersion: "v2", outputSchema: { name: "restaurant-party-size-supplement", version: "2" }, finishReason: "TOOL_CALLS", latencyMs: 0 }] };
        if (status === "UNKNOWN") return { status, attempts: [{ invocationId: "resolver", provider: "FIXTURE", model: "fixture", purpose: "restaurant_party_size_supplement", promptVersion: "v2", outputSchema: { name: "restaurant-party-size-supplement", version: "2" }, finishReason: "TOOL_CALLS", latencyMs: 0 }] };
        return { status, errorCode: "NETWORK", retryable: false, attempts: [] };
      },
    },
  };
}

async function eventFor(proposal: RestaurantSemanticProposal, supplement?: RestaurantPartySizeSupplementResolverPort) {
  return restaurantEventForMessage(interpreter(proposal), {
    taskId: "handler-party", message: "Find dinner tomorrow at seven.", referenceTime: "2026-09-18T09:00:00+09:00", timezone: "Asia/Tokyo",
  }, supplement);
}

test("T1-T6 handler composition patches only an eligible missing availability party", async () => {
  const explicit = resolver("RESOLVED", 9);
  const explicitEvent = await eventFor(availabilityProposal(4), explicit.port);
  assert.equal(explicit.calls(), 0, "T1 primary explicit party never calls the resolver");
  assert.equal(explicitEvent.type, "SEMANTIC_PROPOSAL_COMPILED");
  if (explicitEvent.type === "SEMANTIC_PROPOSAL_COMPILED") assert.deepEqual({ partySize: explicitEvent.patch.partySize, source: explicitEvent.patch.partySizeSource, audit: explicitEvent.partySizeSupplement }, { partySize: 4, source: "EXPLICIT", audit: undefined });

  const relational = resolver("RESOLVED", 3);
  const relationalEvent = await eventFor(availabilityProposal(), relational.port);
  assert.equal(relational.calls(), 1, "T2 calls once after primary omission");
  assert.equal(relationalEvent.type, "SEMANTIC_PROPOSAL_COMPILED");
  if (relationalEvent.type === "SEMANTIC_PROPOSAL_COMPILED") assert.deepEqual({ partySize: relationalEvent.patch.partySize, source: relationalEvent.patch.partySizeSource, audit: relationalEvent.partySizeSupplement }, { partySize: 3, source: "INFERRED_CLOSED_PARTY", audit: { status: "RESOLVED", invocationCount: 1, responseAttemptCount: 1 } });

  const h002 = resolver("RESOLVED", 2);
  const h002Event = await eventFor(availabilityProposal(), h002.port);
  assert.equal(h002.calls(), 1, "T3 closed-party resolver path is a single call");
  if (h002Event.type === "SEMANTIC_PROPOSAL_COMPILED") assert.equal(h002Event.patch.partySizeSource, "INFERRED_CLOSED_PARTY");

  const unknown = resolver("UNKNOWN");
  const unknownEvent = await eventFor(availabilityProposal(), unknown.port);
  assert.equal(unknown.calls(), 1, "T4 open-party UNKNOWN is recorded after one call");
  if (unknownEvent.type === "SEMANTIC_PROPOSAL_COMPILED") assert.deepEqual({ partySize: unknownEvent.patch.partySize, audit: unknownEvent.partySizeSupplement }, { partySize: undefined, audit: { status: "UNKNOWN", invocationCount: 1, responseAttemptCount: 1 } });

  const failed = resolver("MODEL_FAILURE");
  const failedEvent = await eventFor(availabilityProposal(), failed.port);
  assert.equal(failed.calls(), 1, "T5 resolver failures do not retry or invent");
  if (failedEvent.type === "SEMANTIC_PROPOSAL_COMPILED") assert.deepEqual({ partySize: failedEvent.patch.partySize, audit: failedEvent.partySizeSupplement }, { partySize: undefined, audit: { status: "MODEL_FAILURE", invocationCount: 1, responseAttemptCount: 0 } });

  const recommendation = resolver("RESOLVED", 2);
  const recommendationEvent = await eventFor({ ...availabilityProposal(), facts: [{ field: "TARGET", operation: "ASSERT", value: { goalBasis: { type: "JUDGMENT", reason: "Controlled fixture target.", quotes: ["recommend"] }, kind: "TARGET", goal: "RECOMMENDATION", query: "recommend a cafe" } }] }, recommendation.port);
  assert.equal(recommendation.calls(), 0, "T6 recommendation never triggers party supplementation");
  if (recommendationEvent.type === "SEMANTIC_PROPOSAL_COMPILED") assert.equal(recommendationEvent.partySizeSupplement, undefined);
});

test("ADR-0044 handler rejects missing, empty or fabricated citations before any semantic State write", async () => {
  for (const quotes of [undefined, [], [""], ["book a table"], ["cafes", "a prior message"]]) {
    let calls = 0;
    const interpreter = new RestaurantSemanticInterpreter({ async complete() {
      calls += 1;
      return { invocationId: `bad-goal-${calls}`, provider: "FIXTURE", model: "fixture", latencyMs: 0, finishReason: "TOOL_CALLS" as const,
        outputText: JSON.stringify({ schemaVersion: "4", facts: [{ field: "TARGET", operation: "ASSERT", value: {
          kind: "TARGET", goal: "AVAILABILITY", query: "cafes", ...(quotes === undefined ? {} : { goalBasis: { type: "JUDGMENT", reason: "Controlled bad evidence.", quotes } }),
        } }] }) };
    } });
    const event = await restaurantEventForMessage(interpreter, { taskId: "bad-goal", message: "Good cafes on Wednesday afternoon.", referenceTime: "2026-10-25T09:00:00+09:00", timezone: "Asia/Tokyo" });
    assert.equal(event.type, "SEMANTIC_INTERPRETATION_FAILED");
    const runtime = new InMemoryTaskRuntime(restaurantBookingTaskDefinition, new FakeClock("2026-10-25T09:00:00+09:00"), prefix => `${prefix}-bad-goal`);
    runtime.createTask("bad-goal", {}, { runId: "bad-goal-run" });
    const result = runtime.dispatch({ id: "bad-goal-event", taskId: "bad-goal", event, occurredAt: "2026-10-25T09:00:00+09:00", trace: { schemaVersion: "1", runId: "bad-goal-run", correlationId: "bad-goal-event", actor: "MODEL" } }, runtime.snapshot("bad-goal").version);
    assert.equal(result.snapshot.domainState.phase, "FAILED");
    assert.equal(result.snapshot.domainState.intentDraft, undefined);
    assert.equal(calls, 2);
  }
});

test("ADR-0044 real semantic handler and Reducer retain either goal and only availability supplements a missing party", async () => {
  for (const goal of ["RECOMMENDATION", "AVAILABILITY"] as const) {
    const semantic = new RestaurantSemanticInterpreter({ async complete() {
      return { invocationId: "valid-goal", provider: "FIXTURE", model: "fixture", latencyMs: 0, finishReason: "TOOL_CALLS" as const,
        outputText: JSON.stringify({ schemaVersion: "4", facts: [
          { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal, query: "cafes", goalBasis: { type: "JUDGMENT", reason: "Controlled gray choice.", quotes: ["cafes"] } } },
          { field: "DATE", operation: "ASSERT", value: { kind: "DATE", weekday: "WEDNESDAY", raw: "Wednesday" } },
          { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", daypart: "AFTERNOON", raw: "afternoon" } },
          { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Ginza" } },
        ] }) };
    } });
    const party = resolver("RESOLVED", 2);
    const event = await restaurantEventForMessage(semantic, { taskId: "valid-goal", message: "Good cafes in Ginza on Wednesday afternoon.", referenceTime: "2026-10-25T09:00:00+09:00", timezone: "Asia/Tokyo" }, party.port);
    assert.equal(event.type, "SEMANTIC_PROPOSAL_COMPILED");
    const runtime = new InMemoryTaskRuntime(restaurantBookingTaskDefinition, new FakeClock("2026-10-25T09:00:00+09:00"), prefix => `${prefix}-valid-goal`);
    runtime.createTask("valid-goal", {}, { runId: "valid-goal-run" });
    const result = runtime.dispatch({ id: "valid-goal-event", taskId: "valid-goal", event, occurredAt: "2026-10-25T09:00:00+09:00", trace: { schemaVersion: "1", runId: "valid-goal-run", correlationId: "valid-goal-event", actor: "MODEL" } }, runtime.snapshot("valid-goal").version);
    assert.equal(result.snapshot.domainState.intentDraft?.target?.goal, goal);
    assert.equal(party.calls(), goal === "AVAILABILITY" ? 1 : 0);
    assert.equal(result.snapshot.domainState.intentDraft?.partySize, goal === "AVAILABILITY" ? 2 : undefined);
    assert.equal(JSON.stringify(result.snapshot.domainState).includes("goalBasis"), false);
    assert.equal(result.snapshot.domainState.schemaVersion, "22");
    assert.equal(result.snapshot.definitionVersion, "20");
  }
});
