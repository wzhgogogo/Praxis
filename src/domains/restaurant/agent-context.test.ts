import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent, fixtureOffers } from "../../harness/restaurant-fixtures.js";
import type { RestaurantTaskState } from "./contracts.js";
import { projectRestaurantAgentContext } from "./agent-context.js";

test("Restaurant Agent context retains bounded observations and action scope while excluding execution authority and raw provider artifacts", () => {
  const state: RestaurantTaskState = {
    schemaVersion: "10",
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
  assert.equal(context.schemaVersion, "7");
  assert.deepEqual(context.searchAvailability, { available: true });
  assert.deepEqual(context.failure, { code: "SEARCH_FAILED" });
  assert.deepEqual(context.availabilityChecks, {
    [fixtureCandidates[0]!.restaurant.id]: { status: "AVAILABLE", receptionMode: "UNKNOWN" },
  });
  assert.deepEqual(context.candidates[0], {
    id: fixtureCandidates[0]!.restaurant.id,
    outletName: fixtureCandidates[0]!.restaurant.outletName,
    address: fixtureCandidates[0]!.restaurant.address,
    matchReasons: fixtureCandidates[0]!.matchReasons,
    warnings: fixtureCandidates[0]!.warnings,
    executionConfidence: fixtureCandidates[0]!.executionConfidence,
    observedFacts: {
      verifiedHardCriteria: [],
      verifiedNegativeCriteria: [],
      violatedNegativeCriteria: [],
      openingHoursMatch: false,
      commercialNotes: [],
    },
    sourceAttempts: [],
  });
  assert.deepEqual(context.legalActions.presentResults, []);
  assert.equal(JSON.stringify(context).includes("private-provider-reference"), false);
  assert.equal("proposal" in context, false);
  assert.equal("authorization" in context, false);
  assert.equal("activeAttemptId" in context, false);
  assert.equal("evidence" in context, false);
  assert.equal("reservation" in context, false);
  assert.equal(JSON.stringify(context).includes("mock://private"), false);
});

test("Restaurant Agent context exposes a stable exhausted-discovery state without provider internals", () => {
  const context = projectRestaurantAgentContext({
    schemaVersion: "10", phase: "SEARCHING", candidates: [], availability: {}, availabilityChecks: {}, readEvidence: [], searchRevision: 1,
    failure: { code: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", message: "provider-specific private detail" },
    sourceReadState: { googlePlacesSearchBudget: "EXHAUSTED" },
  });
  assert.deepEqual(context.searchAvailability, { available: false, reason: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" });
  assert.equal(context.legalActions.search, false);
  assert.equal(JSON.stringify(context).includes("provider-specific private detail"), false);
});

test("Restaurant Agent context exposes bounded candidate facts, provider attempts, reception and code-derived next actions", () => {
  const candidateId = fixtureCandidates[0]!.restaurant.id;
  const context = projectRestaurantAgentContext({
    schemaVersion: "10", phase: "SEARCHING", intentDraft: { ...fixtureIntent, schemaVersion: "3" }, intent: fixtureIntent,
    candidates: fixtureCandidates, availability: {}, searchRevision: 1,
    availabilityChecks: {
      [candidateId]: {
        status: "UNAVAILABLE", receptionMode: "WALK_IN_SUPPORTED", checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: ["fact-a"],
        sourceAttempts: [{ source: "TABLECHECK", outcome: "FAILED", reasonCode: "NO_MATCHING_SLOT" }],
      },
    },
    factChecks: { [candidateId]: { status: "COMPLETED", checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: ["fact-a"], sourceProvider: "RESTAURANT_WEBSITE" } },
    readEvidence: [{
      evidenceId: "entity-a", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "request-a", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] },
    }, {
      evidenceId: "fact-a", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "request-a",
      claims: { verifiedHardCriteria: ["yakiniku"], verifiedNegativeCriteria: ["not all-you-can-eat"], openingHoursMatch: true },
    }],
  });
  assert.deepEqual(context.candidates[0]?.observedFacts, {
    verifiedHardCriteria: ["yakiniku"], verifiedNegativeCriteria: ["not all-you-can-eat"], violatedNegativeCriteria: [], openingHoursMatch: true, commercialNotes: [],
  });
  assert.deepEqual(context.candidates[0]?.sourceAttempts, [
    { source: "RESTAURANT_WEBSITE", outcome: "COMPLETED" },
    { source: "TABLECHECK", outcome: "FAILED", reasonCode: "NO_MATCHING_SLOT" },
  ]);
  assert.deepEqual(context.availabilityChecks[candidateId], { status: "UNAVAILABLE", receptionMode: "WALK_IN_SUPPORTED" });
  assert.equal(context.legalActions.endRead, true);
});

test("Restaurant Agent context exposes only current candidate-bound commercial notes with their evidence source", () => {
  const candidateId = fixtureCandidates[0]!.restaurant.id;
  const context = projectRestaurantAgentContext({
    schemaVersion: "10", phase: "SEARCHING", intentDraft: { ...fixtureIntent, schemaVersion: "3" }, intent: fixtureIntent,
    candidates: fixtureCandidates, availability: {}, availabilityChecks: {}, searchRevision: 1,
    factChecks: {
      [candidateId]: {
        status: "COMPLETED", checkedAt: "2026-08-05T09:00:00.000Z", evidenceIds: ["website-current"], sourceProvider: "RESTAURANT_WEBSITE",
        supersededEvidenceIds: ["website-old"],
      },
    },
    readEvidence: [{
      evidenceId: "website-entity", kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "entity", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["EXACT_PHONE"] },
    }, {
      evidenceId: "website-old", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T09:00:00.000Z", requestFingerprint: "old", claims: { noShowTerms: "No-show: 100% fee." },
    }, {
      evidenceId: "website-current", kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId, sourceEntityId: "official-a",
      observedAt: "2026-08-05T10:00:00.000Z", requestFingerprint: "current",
      claims: { listedCourseDetails: ["Lunch course: JPY 6000, tax included; lunch only."], coursePriceYen: 8000, coursePriceTax: "INCLUDED", privateRoomMinimumYen: 20000, cancellationTerms: "Cancellation: no fee until 17:00." },
    }],
  });

  assert.deepEqual(context.candidates[0]?.observedFacts.commercialNotes, [
    { field: "COURSE_DETAILS", value: "Lunch course: JPY 6000, tax included; lunch only.", source: "RESTAURANT_WEBSITE" },
    { field: "COURSE_PRICE", value: "8000 JPY (tax included)", source: "RESTAURANT_WEBSITE" },
    { field: "PRIVATE_ROOM_MINIMUM", value: "20000 JPY", source: "RESTAURANT_WEBSITE" },
    { field: "CANCELLATION", value: "Cancellation: no fee until 17:00.", source: "RESTAURANT_WEBSITE" },
  ]);
  assert.equal(JSON.stringify(context).includes("No-show: 100% fee."), false, "superseded website facts must not reach the Agent");
  assert.equal(JSON.stringify(context).includes("official-a"), false, "source entity ids are evidence internals, not model context");
});
