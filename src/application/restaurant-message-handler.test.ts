import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";
import type { RestaurantSemanticInterpreterPort, RestaurantPartySizeSupplementResolverPort } from "./restaurant-message-handler.js";
import { restaurantEventForMessage } from "./restaurant-message-handler.js";

const availabilityProposal = (partySize?: number): RestaurantSemanticProposal => ({
  schemaVersion: "3",
  facts: [
    { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "find a table" } },
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
  const recommendationEvent = await eventFor({ ...availabilityProposal(), facts: [{ field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "RECOMMENDATION", query: "recommend a cafe" } }] }, recommendation.port);
  assert.equal(recommendation.calls(), 0, "T6 recommendation never triggers party supplementation");
  if (recommendationEvent.type === "SEMANTIC_PROPOSAL_COMPILED") assert.equal(recommendationEvent.partySizeSupplement, undefined);
});
