import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantIntentDraft } from "../../../domains/restaurant/contracts.js";
import {
  compareRestaurantSemanticCommonUnchangedTurns,
  compareRestaurantSemanticExposedRegression,
  diagnoseRestaurantSemanticRegression,
} from "./exposed-regression.js";
import {
  RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID,
  RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION,
  RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME,
  type RestaurantSemanticHoldoutDataset,
} from "./holdout.js";
import type { RestaurantSemanticRegressionReport } from "./regression.js";

function draft(input: Partial<RestaurantIntentDraft> = {}): RestaurantIntentDraft {
  return {
    schemaVersion: "3",
    timezone: "Asia/Tokyo",
    criteria: [],
    ...input,
  };
}

const dataset: RestaurantSemanticHoldoutDataset = {
  schemaVersion: "3",
  id: RESTAURANT_SEMANTIC_HOLDOUT_DATASET_ID,
  version: RESTAURANT_SEMANTIC_HOLDOUT_DATASET_VERSION,
  cohort: "HOLDOUT",
  contaminationStatus: "CLEAN_HOLDOUT",
  referenceTime: RESTAURANT_SEMANTIC_HOLDOUT_REFERENCE_TIME,
  timezone: "Asia/Tokyo",
  sessions: [
    {
      id: "S1",
      turns: [
        {
          id: "T1",
          message: "synthetic baseline turn",
          expectedDraft: draft({
            date: "2026-08-21",
            timeWindow: { earliest: "19:00", latest: "19:00" },
            partySize: 2,
            area: { query: "Ginza" },
            criteria: [{ text: "quiet", polarity: "POSITIVE", strength: "HARD" }],
          }),
          expectedDecision: { type: "SEARCH" },
        },
        {
          id: "T2",
          message: "synthetic formerly blocked turn",
          expectedDraft: draft({
            date: "2026-08-21",
            partySize: 2,
            area: { query: "Ginza" },
            criteria: [{ text: "view", polarity: "POSITIVE", strength: "SOFT" }],
          }),
          expectedDecision: { type: "ASK_USER", missingRequiredFields: ["timeWindow"] },
        },
      ],
    },
  ],
};

function report(
  turns: RestaurantSemanticRegressionReport["turns"],
): RestaurantSemanticRegressionReport {
  return {
    evaluatorVersion: "3",
    datasetId: dataset.id,
    datasetVersion: dataset.version,
    mode: "REAL_MODEL_MOCK_WORLD",
    attributionLevel: "PRODUCT_SEMANTIC_ONLY",
    status: "COMPLETED",
    turns,
    summary: {
      totalTurns: turns.length,
      modelEvaluatedTurns: turns.filter((turn) => turn.status !== "BLOCKED_BY_UPSTREAM").length,
      passedTurns: turns.filter((turn) => turn.status === "PASS").length,
      blockedTurns: turns.filter((turn) => turn.status === "BLOCKED_BY_UPSTREAM").length,
      firstFailureStages: {},
    },
  };
}

test("field diagnostics count criteria and singleton mismatches once per turn", () => {
  const result = diagnoseRestaurantSemanticRegression(
    dataset,
    report([
      {
        sessionId: "S1",
        turnId: "T1",
        status: "FAIL",
        firstFailureStage: "SEMANTIC_RESULT",
        errors: [],
        actualDraft: draft({
          date: "2026-08-21",
          timeWindow: { earliest: "19:00", latest: "22:00" },
          area: { query: "Ginza" },
          criteria: [{ text: "quiet", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
        }),
        actualDecision: { type: "ASK_USER", missingRequiredFields: ["partySize"] },
      },
      { sessionId: "S1", turnId: "T2", status: "BLOCKED_BY_UPSTREAM", errors: [] },
    ]),
  );

  assert.deepEqual(result.fieldMismatches, {
    criteriaText: 0,
    polarity: 0,
    strength: 1,
    date: 0,
    timeWindow: 1,
    partySize: 1,
    area: 0,
    decision: 1,
  });
  assert.equal(result.strength.expectedHardOrSoftActualUnspecifiedSlots, 1);
  assert.deepEqual(result.timeWindow, {
    expectedExactTurns: 1,
    exactMatchedTurns: 0,
    expectedMissingActualPresentTurns: 0,
  });
  assert.equal(result.blockedTurns, 1);
});

test("a criterion text mismatch is not also misclassified as polarity or strength", () => {
  const result = diagnoseRestaurantSemanticRegression(
    dataset,
    report([
      {
        sessionId: "S1",
        turnId: "T1",
        status: "FAIL",
        firstFailureStage: "SEMANTIC_RESULT",
        errors: [],
        actualDraft: draft({
          date: "2026-08-21",
          timeWindow: { earliest: "19:00", latest: "19:00" },
          partySize: 2,
          area: { query: "Ginza" },
          criteria: [{ text: "quiet room", polarity: "NEGATIVE", strength: "SOFT" }],
        }),
        actualDecision: { type: "SEARCH" },
      },
    ]),
  );

  assert.equal(result.fieldMismatches.criteriaText, 1);
  assert.equal(result.fieldMismatches.polarity, 0);
  assert.equal(result.fieldMismatches.strength, 0);
});

test("baseline comparison keeps the prompt @4 subset separate and reports newly continued turns", () => {
  const baseline = report([
    {
      sessionId: "S1",
      turnId: "T1",
      status: "FAIL",
      firstFailureStage: "SEMANTIC_RESULT",
      errors: [],
      actualDraft: draft({
        date: "2026-08-21",
        timeWindow: { earliest: "19:00", latest: "22:00" },
        partySize: 2,
        area: { query: "Ginza" },
        criteria: [{ text: "quiet", polarity: "POSITIVE", strength: "UNSPECIFIED" }],
      }),
      actualDecision: { type: "SEARCH" },
    },
    { sessionId: "S1", turnId: "T2", status: "BLOCKED_BY_UPSTREAM", errors: [] },
  ]);
  const promptV5 = report([
    {
      sessionId: "S1",
      turnId: "T1",
      status: "PASS",
      errors: [],
      actualDraft: dataset.sessions[0]!.turns[0]!.expectedDraft,
      actualDecision: { type: "SEARCH" },
    },
    {
      sessionId: "S1",
      turnId: "T2",
      status: "PASS",
      errors: [],
      actualDraft: dataset.sessions[0]!.turns[1]!.expectedDraft,
      actualDecision: { type: "ASK_USER", missingRequiredFields: ["timeWindow"] },
    },
  ]);

  const comparison = compareRestaurantSemanticExposedRegression(dataset, baseline, promptV5);

  assert.equal(comparison.comparableTurnIds.length, 1);
  assert.equal(comparison.baselineToPromptV5FieldMismatchDelta.strength, 1);
  assert.equal(comparison.baselineToPromptV5FieldMismatchDelta.timeWindow, 1);
  assert.equal(comparison.promptV5Overall.modelEvaluatedTurns, 2);
  assert.deepEqual(comparison.multiTurnContinuation.promptV5ModelEvaluatedFormerlyBlockedTurns, [
    "S1\u0000T2",
  ]);
});

test("common-unchanged comparison excludes a changed Gold turn instead of comparing it", () => {
  const prior = report([
    {
      sessionId: "S1",
      turnId: "T1",
      status: "PASS",
      errors: [],
      actualDraft: dataset.sessions[0]!.turns[0]!.expectedDraft,
      actualDecision: { type: "SEARCH" },
    },
    {
      sessionId: "S1",
      turnId: "T2",
      status: "PASS",
      errors: [],
      actualDraft: dataset.sessions[0]!.turns[1]!.expectedDraft,
      actualDecision: { type: "ASK_USER", missingRequiredFields: ["timeWindow"] },
    },
  ]);
  const currentDataset = structuredClone(dataset);
  currentDataset.sessions[0]!.turns[1]!.expectedDraft = draft({
    date: "2026-08-21",
    partySize: 3,
    area: { query: "Ginza" },
    criteria: [{ text: "view", polarity: "POSITIVE", strength: "SOFT" }],
  });
  const current = report([
    {
      sessionId: "S1",
      turnId: "T1",
      status: "PASS",
      errors: [],
      actualDraft: currentDataset.sessions[0]!.turns[0]!.expectedDraft,
      actualDecision: { type: "SEARCH" },
    },
    {
      sessionId: "S1",
      turnId: "T2",
      status: "PASS",
      errors: [],
      actualDraft: currentDataset.sessions[0]!.turns[1]!.expectedDraft,
      actualDecision: { type: "ASK_USER", missingRequiredFields: ["timeWindow"] },
    },
  ]);

  const comparison = compareRestaurantSemanticCommonUnchangedTurns(
    currentDataset,
    prior,
    current,
    dataset.sessions.flatMap((session) =>
      session.turns.map((turn) => ({
        sessionId: session.id,
        turnId: turn.id,
        expectedDraft: turn.expectedDraft,
        expectedDecision: turn.expectedDecision,
      })),
    ),
  );

  assert.deepEqual(comparison.commonTurnIds, ["S1\u0000T1"]);
  assert.deepEqual(comparison.annotationChangedTurnIds, ["S1\u0000T2"]);
  assert.equal(comparison.current.totalTurnsInScope, 1);
});
