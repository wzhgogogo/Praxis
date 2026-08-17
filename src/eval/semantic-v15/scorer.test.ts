import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  RestaurantDecision,
  RestaurantIntentDraft,
  RestaurantIntentPatch,
} from "../../domains/restaurant/contracts.js";
import {
  validateRestaurantSemanticProposal,
  type RestaurantSemanticProposal,
} from "../../domains/restaurant/semantic-proposal.js";
import { scoreRestaurantSemanticTurn } from "./scorer.js";

const expectedProposal: RestaurantSemanticProposal = {
  schemaVersion: "1",
  facts: [{ field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } }],
};
const expectedPatch: RestaurantIntentPatch = { schemaVersion: "1", partySize: 2 };
const expectedDraft: RestaurantIntentDraft = {
  schemaVersion: "1",
  timezone: "Asia/Tokyo",
  partySize: 2,
  cuisines: [],
  hardConstraints: [],
  softPreferences: [],
};
const expectedDecision: Extract<RestaurantDecision, { type: "ASK_USER" }> = {
  type: "ASK_USER",
  missingRequiredFields: ["date", "timeWindow", "area"],
};

test("stage scorer assigns valid but wrong meaning to Semantic Interpreter", () => {
  const wrongMeaning: RestaurantSemanticProposal = {
    schemaVersion: "1",
    facts: [{ field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 3 } }],
  };
  assert.equal(validateRestaurantSemanticProposal(wrongMeaning).valid, true);
  const score = scoreRestaurantSemanticTurn({
    actualProposal: wrongMeaning,
    expectedProposal,
    actualCompiledPatch: { schemaVersion: "1", partySize: 3 },
    expectedCompiledPatch: expectedPatch,
    actualDraft: { ...expectedDraft, partySize: 3 },
    expectedDraft,
    actualDecision: expectedDecision,
    expectedDecision,
  });
  assert.equal(score.status === "FAIL" ? score.firstFailureStage : undefined, "SEMANTIC_INTERPRETER");
});

test("stage scorer assigns a wrong deterministic translation to Compiler", () => {
  const score = scoreRestaurantSemanticTurn({
    actualProposal: expectedProposal,
    expectedProposal,
    actualCompiledPatch: { schemaVersion: "1", partySize: 3 },
    expectedCompiledPatch: expectedPatch,
    actualDraft: { ...expectedDraft, partySize: 3 },
    expectedDraft,
    actualDecision: expectedDecision,
    expectedDecision,
  });
  assert.equal(score.status === "FAIL" ? score.firstFailureStage : undefined, "COMPILER");
});

test("stage scorer assigns wrong accumulated state after correct compilation to Reducer", () => {
  const score = scoreRestaurantSemanticTurn({
    actualProposal: expectedProposal,
    expectedProposal,
    actualCompiledPatch: expectedPatch,
    expectedCompiledPatch: expectedPatch,
    actualDraft: { ...expectedDraft, partySize: 3 },
    expectedDraft,
    actualDecision: expectedDecision,
    expectedDecision,
  });
  assert.equal(score.status === "FAIL" ? score.firstFailureStage : undefined, "REDUCER");
});

test("stage scorer assigns wrong next step after correct state to Decision Kernel", () => {
  const score = scoreRestaurantSemanticTurn({
    actualProposal: expectedProposal,
    expectedProposal,
    actualCompiledPatch: expectedPatch,
    expectedCompiledPatch: expectedPatch,
    actualDraft: expectedDraft,
    expectedDraft,
    actualDecision: { type: "SEARCH" },
    expectedDecision,
  });
  assert.equal(score.status === "FAIL" ? score.firstFailureStage : undefined, "DECISION_KERNEL");
});

test("stage scorer treats unordered facts, patches, and Draft collections as semantically equal", () => {
  const expected: RestaurantSemanticProposal = {
    schemaVersion: "1",
    facts: [
      { field: "CUISINE", operation: "ASSERT", value: { kind: "CUISINE", value: "Thai" } },
      {
        field: "HARD_CONSTRAINT",
        operation: "ASSERT",
        value: { kind: "HARD_CONSTRAINT", value: "no spicy" },
      },
      {
        field: "HARD_CONSTRAINT",
        operation: "ASSERT",
        value: { kind: "HARD_CONSTRAINT", value: "no hot pot" },
      },
    ],
  };
  const score = scoreRestaurantSemanticTurn({
    actualProposal: { ...expected, facts: [...expected.facts].reverse() },
    expectedProposal: expected,
    actualCompiledPatch: {
      schemaVersion: "1",
      addCuisines: ["Thai"],
      addHardConstraints: ["no hot pot", "no spicy"],
    },
    expectedCompiledPatch: {
      schemaVersion: "1",
      addCuisines: ["Thai"],
      addHardConstraints: ["no spicy", "no hot pot"],
    },
    actualDraft: {
      ...expectedDraft,
      cuisines: ["Thai", "Thai"],
      hardConstraints: ["no hot pot", "no spicy"],
      softPreferences: ["quiet", "quiet"],
    },
    expectedDraft: {
      ...expectedDraft,
      cuisines: ["Thai"],
      hardConstraints: ["no spicy", "no hot pot"],
      softPreferences: ["quiet"],
    },
    actualDecision: expectedDecision,
    expectedDecision,
  });
  assert.deepEqual(score, { status: "PASS" });
});
