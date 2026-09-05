import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantTaskState } from "./contracts.js";
import { validateRestaurantAction } from "./action-validator.js";
import { applyRestaurantIntentPatch, missingBlockingFields } from "./intent-state.js";
import { restaurantBookingTaskDefinition } from "./task-definition.js";

const incompleteState: RestaurantTaskState = {
  schemaVersion: "10",
  phase: "UNDERSTANDING",
  candidates: [],
  availability: {},
  availabilityChecks: {},
  readEvidence: [],
  searchRevision: 0,
};

const now = "2026-08-05T09:00:00.000Z";

test("Reducer derives missing fields and accumulates a criterion correction deterministically", () => {
  const first = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", partySize: 2, addCriteria: [{ text: "yakiniku", polarity: "POSITIVE", strength: "UNSPECIFIED" }] });
  const corrected = applyRestaurantIntentPatch(first, { schemaVersion: "3", partySize: 3, area: { query: "Shibuya" }, timeWindow: { earliest: "19:00", latest: "19:30" }, removeCriteria: [{ text: "YAKINIKU", polarity: "POSITIVE", strength: "UNSPECIFIED" }] });
  assert.deepEqual(missingBlockingFields(first), ["timeWindow", "area"]);
  assert.deepEqual(missingBlockingFields(corrected), []);
  assert.equal(corrected.partySize, 3);
  assert.deepEqual(corrected.criteria, []);
});

test("Action validator binds search to complete authoritative intent", () => {
  assert.deepEqual(
    validateRestaurantAction(incompleteState, { type: "SEARCH_RESTAURANTS" }, now),
    { status: "REJECTED", code: "INTENT_INCOMPLETE", reason: "Restaurant intent is missing required fields" },
  );
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" }, addCriteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] });
  const state = { ...incompleteState, intentDraft: draft };
  assert.equal(validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS", retrievalHint: "broaden omakase search" }, now).status, "ALLOWED");
});

test("Action validator blocks unknown candidates, stale offers, and booking schedule mismatches", () => {
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } });
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: draft,
    candidates: [{ restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    availability: { a: [{ id: "stale", restaurantId: "a", source: "fixture", dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2, bookingMode: "INSTANT", executionMode: "API", checkedAt: now, expiresAt: now }] },
  };
  assert.equal(validateRestaurantAction(state, { type: "SELECT_CANDIDATE", candidateId: "missing" }, now).status, "REJECTED");
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["missing"] }, now).status, "REJECTED");
  assert.equal(validateRestaurantAction(state, { type: "SELECT_CANDIDATE", candidateId: "a", offerId: "stale" }, now).status, "REJECTED");
  const fresh = { ...state.availability.a![0]!, id: "fresh", expiresAt: "2026-08-05T09:02:00.000Z" };
  const selected = { ...state, selectedCandidateId: "a", selectedOfferId: "fresh" };
  const book = { type: "BOOK_RESERVATION" as const, candidateId: "a", offerId: "fresh" };
  assert.equal(validateRestaurantAction({ ...selected, availability: { a: [fresh] } }, book, now).status, "REQUIRES_AUTHORIZATION");
  for (const [label, patch] of [
    ["wrong date", { dateTime: "2026-08-06T19:00:00+09:00" }],
    ["wrong party", { partySize: 3 }],
    ["too early", { dateTime: "2026-08-05T18:59:00+09:00" }],
    ["too late", { dateTime: "2026-08-05T19:31:00+09:00" }],
  ] as const) {
    const verdict = validateRestaurantAction({ ...selected, availability: { a: [{ ...fresh, ...patch }] } }, book, now);
    assert.equal(verdict.status, "REJECTED", label);
    if (verdict.status === "REJECTED") assert.equal(verdict.code, "SCHEDULE_MISMATCH", label);
  }

});

test("Action validator rejects availability reads that would repeat a candidate already checked for the current search", () => {
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } });
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: draft,
    candidates: [
      { restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "LOW" },
      { restaurant: { id: "b", outletName: "B", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "LOW" },
    ],
    availabilityChecks: { a: { status: "UNKNOWN", checkedAt: now, evidenceIds: [], reasonCode: "ENTITY_MATCH_UNCERTAIN" } },
  };
  assert.deepEqual(
    validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a"] }, now),
    { status: "REJECTED", code: "AVAILABILITY_ALREADY_CHECKED", reason: "Availability was already checked for a under the current authoritative search and schedule" },
  );
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["b"] }, now).status, "ALLOWED");
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds: ["a", "b"] }, now).status, "REJECTED");
});

test("PRESENT_RESULTS fails closed until area, HARD criterion, identity, and availability are evidenced", () => {
  const candidate = { restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Shinjuku, Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  const draft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2,
    area: { query: "Shinjuku" }, addCriteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }],
  });
  const base: RestaurantTaskState = {
    ...incompleteState, phase: "SEARCHING", intentDraft: draft, candidates: [candidate],
    availability: { a: [{ id: "fresh", restaurantId: "a", source: "TABELOG", dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2, bookingMode: "REQUEST", executionMode: "BROWSER", checkedAt: now, expiresAt: "2026-08-05T09:02:00.000Z" }] },
    availabilityChecks: { a: { status: "AVAILABLE", checkedAt: now, evidenceIds: ["availability"] } },
  };
  assert.equal(validateRestaurantAction(base, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now).status, "REJECTED");
  const grounded: RestaurantTaskState = {
    ...base,
    readEvidence: [
      { evidenceId: "discovery", kind: "DISCOVERY", provider: "GOOGLE_PLACES", candidateId: "a", observedAt: now, requestFingerprint: "x", claims: { areaQuery: "Shinjuku", areaMatch: true } },
      { evidenceId: "entity", kind: "ENTITY_MATCH", provider: "TABELOG", candidateId: "a", observedAt: now, requestFingerprint: "x", claims: {}, entityMatch: { confidence: "HIGH", matchedBy: ["NORMALIZED_NAME_AND_ADDRESS"] } },
      { evidenceId: "fact", kind: "RESTAURANT_FACT", provider: "TABELOG", candidateId: "a", observedAt: now, requestFingerprint: "x", claims: { verifiedHardCriteria: ["omakase"] } },
      { evidenceId: "availability", kind: "AVAILABILITY", provider: "TABELOG", candidateId: "a", observedAt: now, expiresAt: "2026-08-05T09:02:00.000Z", requestFingerprint: "x", claims: { date: "2026-08-05", partySize: 2 } },
    ],
  };
  assert.deepEqual(validateRestaurantAction(grounded, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now), { status: "ALLOWED" });
  for (const omitted of grounded.readEvidence) {
    const verdict = validateRestaurantAction({ ...grounded, readEvidence: grounded.readEvidence.filter((item) => item !== omitted) }, { type: "PRESENT_RESULTS", candidateIds: ["a"] }, now);
    assert.equal(verdict.status, "REJECTED", `missing ${omitted.kind}`);
    if (verdict.status === "REJECTED") assert.equal(verdict.code, "PRESENTATION_EVIDENCE_MISSING", omitted.kind);
  }

  const transition = restaurantBookingTaskDefinition.transition(grounded, {
    type: "RESULTS_PRESENTED", candidateIds: ["a"], evidenceIds: grounded.readEvidence.map((item) => item.evidenceId),
  }, { taskId: "task", runId: "run", now, createId: (prefix) => prefix });
  assert.equal(transition.state.phase, "PRESENT_RESULTS");
  assert.deepEqual(restaurantBookingTaskDefinition.evaluateOutcome(transition.state), {
    status: "PRESENT_RESULTS", candidateIds: ["a"], evidenceIds: grounded.readEvidence.map((item) => item.evidenceId),
  });
});
