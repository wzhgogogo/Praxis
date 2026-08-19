import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  RestaurantSemanticExpectedDecision,
  RestaurantIntentDraft,
  RestaurantIntentPatch,
} from "../../domains/restaurant/contracts.js";
import {
  validateRestaurantSemanticProposal,
  type RestaurantSemanticProposal,
} from "../../domains/restaurant/semantic-proposal.js";
import { scoreRestaurantSemanticTurn } from "./scorer.js";

const expectedProposal: RestaurantSemanticProposal = {
  schemaVersion: "3",
  facts: [{ field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } }],
};
const expectedPatch: RestaurantIntentPatch = { schemaVersion: "3", partySize: 2 };
const expectedDraft: RestaurantIntentDraft = {
  schemaVersion: "3",
  timezone: "Asia/Tokyo",
  partySize: 2,
  criteria: [],
};
const expectedDecision: Extract<RestaurantSemanticExpectedDecision, { type: "ASK_USER" }> = {
  type: "ASK_USER",
  missingRequiredFields: ["date", "timeWindow", "area"],
};

test("stage scorer assigns valid but wrong meaning to Semantic Interpreter", () => {
  const wrongMeaning: RestaurantSemanticProposal = {
    schemaVersion: "3",
    facts: [{ field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 3 } }],
  };
  assert.equal(validateRestaurantSemanticProposal(wrongMeaning).valid, true);
  const score = scoreRestaurantSemanticTurn({
    actualProposal: wrongMeaning,
    expectedProposal,
    actualCompiledPatch: { schemaVersion: "3", partySize: 3 },
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
    actualCompiledPatch: { schemaVersion: "3", partySize: 3 },
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

test("semantic scorer ignores the retired v17 next-step annotation", () => {
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
  assert.equal(score.status, "PASS");
});

test("stage scorer treats unordered criteria and facts with case/whitespace-only text changes as equal", () => {
  const expected: RestaurantSemanticProposal = {
    schemaVersion: "3",
    facts: [
      {
        field: "CRITERION",
        operation: "ASSERT",
        value: { kind: "CRITERION", text: "no spicy", polarity: "NEGATIVE", strength: "HARD" },
      },
      {
        field: "CRITERION",
        operation: "ASSERT",
        value: { kind: "CRITERION", text: "quiet", polarity: "POSITIVE", strength: "SOFT" },
      },
    ],
  };
  const score = scoreRestaurantSemanticTurn({
    actualProposal: {
      ...expected,
      facts: [
        {
          field: "CRITERION",
          operation: "ASSERT",
          value: { kind: "CRITERION", text: " QUIET ", polarity: "POSITIVE", strength: "SOFT" },
        },
        {
          field: "CRITERION",
          operation: "ASSERT",
          value: { kind: "CRITERION", text: "NO SPICY", polarity: "NEGATIVE", strength: "HARD" },
        },
      ],
    },
    expectedProposal: expected,
    actualCompiledPatch: {
      schemaVersion: "3",
      addCriteria: [
        { text: "quiet", polarity: "POSITIVE", strength: "SOFT" },
        { text: "no spicy", polarity: "NEGATIVE", strength: "HARD" },
      ],
    },
    expectedCompiledPatch: {
      schemaVersion: "3",
      addCriteria: [
        { text: "no spicy", polarity: "NEGATIVE", strength: "HARD" },
        { text: "quiet", polarity: "POSITIVE", strength: "SOFT" },
      ],
    },
    actualDraft: {
      ...expectedDraft,
      criteria: [
        { text: " QUIET ", polarity: "POSITIVE", strength: "SOFT" },
        { text: "NO SPICY", polarity: "NEGATIVE", strength: "HARD" },
      ],
    },
    expectedDraft: {
      ...expectedDraft,
      criteria: [
        { text: "no spicy", polarity: "NEGATIVE", strength: "HARD" },
        { text: "quiet", polarity: "POSITIVE", strength: "SOFT" },
      ],
    },
    actualDecision: expectedDecision,
    expectedDecision,
  });
  assert.deepEqual(score, { status: "PASS" });
});
