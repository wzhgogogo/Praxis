import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantTaskState } from "./contracts.js";
import { decideRestaurantNext } from "./decision-kernel.js";
import { applyRestaurantIntentPatch, missingBlockingFields } from "./intent-state.js";

const incompleteState: RestaurantTaskState = {
  schemaVersion: "4",
  phase: "UNDERSTANDING",
  candidates: [],
  searchRevision: 0,
};

test("Reducer derives missing fields and accumulates a correction deterministically", () => {
  const first = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "1",
    date: "2026-08-05",
    partySize: 2,
    addCuisines: ["yakiniku"],
  });
  const corrected = applyRestaurantIntentPatch(first, {
    schemaVersion: "1",
    partySize: 3,
    area: { query: "Shibuya" },
    timeWindow: { earliest: "19:00", latest: "19:30" },
    removeCuisines: ["yakiniku"],
  });

  assert.deepEqual(missingBlockingFields(first), ["timeWindow", "area"]);
  assert.deepEqual(missingBlockingFields(corrected), []);
  assert.equal(corrected.partySize, 3);
  assert.equal(corrected.area?.query, "Shibuya");
  assert.deepEqual(corrected.cuisines, []);
});

test("Decision Kernel derives a safe clarification, search, and v15 re-interpretation reserve", () => {
  assert.deepEqual(decideRestaurantNext(incompleteState), {
    type: "ASK_USER",
    missingRequiredFields: ["date", "timeWindow", "partySize", "area"],
  });

  const completeDraft = applyRestaurantIntentPatch(undefined, {
    schemaVersion: "1",
    date: "2026-08-05",
    timeWindow: { earliest: "19:00", latest: "19:30" },
    partySize: 2,
    area: { query: "Shinjuku" },
  });
  assert.deepEqual(
    decideRestaurantNext({ ...incompleteState, phase: "NEEDS_INPUT", intentDraft: completeDraft }),
    { type: "SEARCH" },
  );
  const removedArea = applyRestaurantIntentPatch(completeDraft, {
    schemaVersion: "1",
    area: null,
  });
  assert.deepEqual(missingBlockingFields(removedArea), ["area"]);
  assert.deepEqual(
    decideRestaurantNext({ ...incompleteState, phase: "NEEDS_INPUT", intentDraft: removedArea }),
    { type: "ASK_USER", missingRequiredFields: ["area"] },
  );

  const conflictState: RestaurantTaskState = {
    ...incompleteState,
    phase: "NEEDS_INPUT",
    semanticConflict: {
      code: "CONTRADICTORY_PROPOSAL",
      affectedFields: ["PARTY_SIZE"],
      message: "Clarify party size",
    },
  };
  assert.deepEqual(decideRestaurantNext(conflictState), {
    type: "NEED_REINTERPRETATION",
    conflict: conflictState.semanticConflict,
  });
});
