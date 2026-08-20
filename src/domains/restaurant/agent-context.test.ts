import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent, fixtureOffers } from "../../harness/restaurant-fixtures.js";
import type { RestaurantTaskState } from "./contracts.js";
import { projectRestaurantAgentContext } from "./agent-context.js";

test("Restaurant Agent context is minimal and excludes execution authority and provider artifacts", () => {
  const state: RestaurantTaskState = {
    schemaVersion: "9",
    phase: "SEARCHING",
    intentDraft: { ...fixtureIntent, schemaVersion: "3" },
    intent: fixtureIntent,
    candidates: fixtureCandidates,
    availability: { [fixtureCandidates[0]!.restaurant.id]: [fixtureOffers[0]!] },
    availabilityChecks: { [fixtureCandidates[0]!.restaurant.id]: { status: "AVAILABLE", checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: [] } },
    readEvidence: [],
    searchRevision: 1,
    selectedCandidateId: fixtureCandidates[0]!.restaurant.id,
    selectedOfferId: fixtureOffers[0]!.id,
    proposal: {
      id: "proposal:private",
      taskId: "task-1",
      actionType: "BOOK",
      target: { type: "RESTAURANT_OUTLET", id: fixtureCandidates[0]!.restaurant.id },
      termsHash: "private-terms-hash",
      risk: "LOW",
      reversible: true,
    },
    authorization: {
      id: "authorization:private",
      proposalId: "proposal:private",
      scope: "ONE_TIME",
      approvedAt: "2026-08-05T09:00:00.000Z",
      expiresAt: "2026-08-05T09:05:00.000Z",
    },
    activeAttemptId: "attempt:private",
    lastExecutionResult: { status: "SUBMITTED", attemptId: "attempt:private", providerReference: "private-provider-reference", submittedAt: "2026-08-05T09:00:00.000Z" },
    evidence: {
      evidenceId: "evidence:private",
      attemptId: "attempt:private",
      strength: "STRONG",
      source: "MOCK_PROVIDER",
      observedAt: "2026-08-05T09:00:00.000Z",
      artifactRef: { kind: "MOCK", reference: "mock://private" },
      claims: {
        status: "CONFIRMED",
        providerReference: "private-provider-reference",
        restaurantId: fixtureCandidates[0]!.restaurant.id,
        dateTime: fixtureOffers[0]!.dateTime,
        partySize: fixtureOffers[0]!.partySize,
      },
      matchedFields: [],
      missingFields: [],
      conflictingFields: [],
    },
    reservation: {
      providerReference: "private-provider-reference",
      restaurantId: fixtureCandidates[0]!.restaurant.id,
      dateTime: fixtureOffers[0]!.dateTime,
      partySize: fixtureOffers[0]!.partySize,
    },
    failure: { code: "SEARCH_FAILED", message: "private provider diagnostic" },
  };

  const context = projectRestaurantAgentContext(state);

  assert.deepEqual(context.missingBlockingFields, []);
  assert.deepEqual(context.failure, { code: "SEARCH_FAILED" });
  assert.deepEqual(context.availabilityChecks, {
    [fixtureCandidates[0]!.restaurant.id]: { status: "AVAILABLE" },
  });
  assert.deepEqual(context.candidates[0], {
    id: fixtureCandidates[0]!.restaurant.id,
    outletName: fixtureCandidates[0]!.restaurant.outletName,
    address: fixtureCandidates[0]!.restaurant.address,
    matchReasons: fixtureCandidates[0]!.matchReasons,
    warnings: fixtureCandidates[0]!.warnings,
    executionConfidence: fixtureCandidates[0]!.executionConfidence,
  });
  assert.equal(JSON.stringify(context).includes("private-provider-reference"), false);
  assert.equal("proposal" in context, false);
  assert.equal("authorization" in context, false);
  assert.equal("activeAttemptId" in context, false);
  assert.equal("evidence" in context, false);
  assert.equal("reservation" in context, false);
  assert.equal(JSON.stringify(context).includes("TABELOG"), false);
});
