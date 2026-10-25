import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  RestaurantSemanticExpectedDecision,
  RestaurantIntentDraft,
  RestaurantIntentPatch,
} from "../../../domains/restaurant/contracts.js";
import {
  validateRestaurantSemanticProposal,
  type RestaurantSemanticProposal,
} from "../../../domains/restaurant/semantic-proposal.js";
import { scoreRestaurantSemanticTurn } from "./scorer.js";

const expectedProposal: RestaurantSemanticProposal = {
  schemaVersion: "4",
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
    schemaVersion: "4",
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

test("semantic scorer ignores the retired ADR-0007 next-step annotation", () => {
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
    schemaVersion: "4",
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


test("ADR-0044 scoring permits either grounded gray goal but rejects fabricated basis and wrong anchors", () => {
  const message = "Good cafes nearby on Wednesday afternoon.";
  const draft = (goal: "RECOMMENDATION" | "AVAILABILITY"): RestaurantIntentDraft => ({ schemaVersion: "3", timezone: "Asia/Tokyo", target: { goal, query: "cafes" }, criteria: [] });
  for (const sample of [
    { category: "GRAY", goal: "RECOMMENDATION", quote: "cafes nearby", pass: true },
    { category: "GRAY", goal: "AVAILABILITY", quote: "cafes nearby", pass: true },
    { category: "GRAY", goal: "RECOMMENDATION", quote: "book a table", pass: false },
    { category: "A", goal: "RECOMMENDATION", quote: "cafes nearby", pass: false },
    { category: "B", goal: "RECOMMENDATION", quote: "cafes nearby", pass: false },
    { category: "NO_TIME", goal: "RECOMMENDATION", quote: "cafes nearby", pass: true },
    { category: "NO_TIME", goal: "AVAILABILITY", quote: "cafes nearby", pass: false },
  ] as const) {
    const input = {
      actualProposal: { schemaVersion: "4" as const, facts: [{ field: "TARGET" as const, operation: "ASSERT" as const,
        value: { kind: "TARGET" as const, goal: sample.goal, query: "cafes", goalBasis: { type: "JUDGMENT" as const, reason: "Controlled score.", quotes: [sample.quote] } },
      }] },
      actualDraft: draft(sample.goal), expectedDraft: draft("RECOMMENDATION"),
      goalBoundary: { category: sample.category, message },
    };
    assert.equal(scoreRestaurantSemanticTurn(input).status, sample.pass ? "PASS" : "FAIL", JSON.stringify(sample));
  }
});

test("ADR-0044 gray goal flexibility does not hide other semantic drift or a changed carried goal", () => {
  const before: RestaurantIntentDraft = { schemaVersion: "3", timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "cafes" }, partySize: 2, criteria: [] };
  const actualProposal: RestaurantSemanticProposal = { schemaVersion: "4", facts: [] };
  const carry = { category: "CONTEXT_CARRY" as const, message: "Use Ginza instead.", previousGoal: "RECOMMENDATION" as const };
  assert.equal(scoreRestaurantSemanticTurn({ actualProposal, actualDraft: before, expectedDraft: before, goalBoundary: carry }).status, "PASS");
  assert.equal(scoreRestaurantSemanticTurn({ actualProposal, actualDraft: { ...before, target: { ...before.target!, goal: "AVAILABILITY" } }, expectedDraft: before, goalBoundary: carry }).status, "FAIL");
  assert.equal(scoreRestaurantSemanticTurn({ actualProposal, actualDraft: { ...before, partySize: 3 }, expectedDraft: before, goalBoundary: carry }).status, "FAIL");
  assert.equal(scoreRestaurantSemanticTurn({ actualProposal, actualDraft: { ...before, partySizeSource: "EXPLICIT" }, expectedDraft: before, goalBoundary: carry }).status, "FAIL", "non-target diagnostic differences also remain visible");
});

for (const category of ["GRAY", "A", "B"] as const) {
  test(`ADR-0044 independently rejects ${category === "GRAY" ? "ungrounded gray basis" : `${category} recommendation`}`, () => {
    const draft: RestaurantIntentDraft = { schemaVersion: "3", timezone: "Asia/Tokyo", target: { goal: "RECOMMENDATION", query: "cafes" }, criteria: [] };
    const input = {
      actualProposal: { schemaVersion: "4" as const, facts: [{ field: "TARGET" as const, operation: "ASSERT" as const,
        value: { kind: "TARGET" as const, goal: "RECOMMENDATION" as const, query: "cafes", goalBasis: {
          type: "JUDGMENT" as const, reason: "Controlled score.", quotes: [category === "GRAY" ? "invented quote" : "cafes"],
        } },
      }] },
      actualDraft: draft, expectedDraft: draft,
      goalBoundary: { category, message: "Good cafes this afternoon." },
    };
    assert.equal(scoreRestaurantSemanticTurn(input).status, "FAIL");
  });
}
