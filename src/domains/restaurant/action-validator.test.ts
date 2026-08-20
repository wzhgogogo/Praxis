import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantTaskState } from "./contracts.js";
import { validateRestaurantAction } from "./action-validator.js";
import { applyRestaurantIntentPatch, missingBlockingFields } from "./intent-state.js";

const incompleteState: RestaurantTaskState = {
  schemaVersion: "9",
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
});
