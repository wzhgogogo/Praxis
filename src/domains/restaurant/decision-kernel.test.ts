import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantTaskState } from "./contracts.js";
import { validateRestaurantAction } from "./decision-kernel.js";
import { applyRestaurantIntentPatch, missingBlockingFields } from "./intent-state.js";

const incompleteState: RestaurantTaskState = {
  schemaVersion: "7",
  phase: "UNDERSTANDING",
  candidates: [],
  availability: {},
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

test("Action validator rejects incomplete and constraint-changing search actions", () => {
  assert.deepEqual(
    validateRestaurantAction(incompleteState, { type: "SEARCH_RESTAURANTS", request: { intent: {} as never } }, now),
    { status: "REJECTED", code: "INTENT_INCOMPLETE", reason: "Restaurant intent is missing required fields" },
  );
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" }, addCriteria: [{ text: "omakase", polarity: "POSITIVE", strength: "HARD" }] });
  const state = { ...incompleteState, intentDraft: draft };
  assert.equal(validateRestaurantAction(state, { type: "SEARCH_RESTAURANTS", request: { intent: { ...draft, date: "2026-08-06" } as never } }, now).status, "REJECTED");
});

test("Action validator blocks unknown candidates, schedule mismatches, stale offers, and unverified completion", () => {
  const draft = applyRestaurantIntentPatch(undefined, { schemaVersion: "3", date: "2026-08-05", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2, area: { query: "Shinjuku" } });
  const state: RestaurantTaskState = {
    ...incompleteState,
    phase: "SEARCHING",
    intentDraft: draft,
    candidates: [{ restaurant: { id: "a", outletName: "A", sourceIds: {}, address: "Tokyo", provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" }],
    availability: { a: [{ id: "stale", restaurantId: "a", source: "fixture", dateTime: "2026-08-05T19:00:00+09:00", timezone: "Asia/Tokyo", partySize: 2, bookingMode: "INSTANT", executionMode: "API", checkedAt: now, expiresAt: now }] },
  };
  assert.equal(validateRestaurantAction(state, { type: "SELECT_CANDIDATE", candidateId: "missing" }, now).status, "REJECTED");
  assert.equal(validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", request: { candidateIds: ["a"], date: "2026-08-06", timeWindow: { earliest: "19:00", latest: "19:30" }, partySize: 2 } }, now).status, "REJECTED");
  assert.equal(validateRestaurantAction(state, { type: "SELECT_CANDIDATE", candidateId: "a", offerId: "stale" }, now).status, "REJECTED");
  assert.equal(validateRestaurantAction(state, { type: "COMPLETE" }, now).status, "REJECTED");
});
