import { isDeepStrictEqual } from "node:util";

import type {
  RestaurantCriterion,
  RestaurantSemanticExpectedDecision,
  RestaurantIntentDraft,
} from "../../domains/restaurant/contracts.js";
import type { RestaurantSemanticHoldoutDataset } from "./holdout.js";
import type {
  RestaurantSemanticRegressionReport,
  RestaurantSemanticRegressionTurnResult,
} from "./regression.js";
import { equalRestaurantIntentDrafts } from "./scorer.js";

export const RESTAURANT_SEMANTIC_EXPOSED_REGRESSION_COMPARISON_VERSION = "1";

export const RESTAURANT_SEMANTIC_FIELD_DIMENSIONS = [
  "criteriaText",
  "polarity",
  "strength",
  "date",
  "timeWindow",
  "partySize",
  "area",
  "decision",
] as const;

export type RestaurantSemanticFieldDimension =
  (typeof RESTAURANT_SEMANTIC_FIELD_DIMENSIONS)[number];

export type RestaurantSemanticFieldMismatchCounts = Record<
  RestaurantSemanticFieldDimension,
  number
>;

export interface RestaurantSemanticExposedTurnDiagnosis {
  sessionId: string;
  turnId: string;
  status: RestaurantSemanticRegressionTurnResult["status"];
  modelEvaluated: boolean;
  scorable: boolean;
  firstFailureStage?: RestaurantSemanticRegressionTurnResult["firstFailureStage"];
  expectedDraft: RestaurantIntentDraft;
  expectedDecision: RestaurantSemanticExpectedDecision;
  actualDraft?: RestaurantIntentDraft;
  actualDecision?: RestaurantSemanticExpectedDecision;
  mismatchedFields: RestaurantSemanticFieldDimension[];
}

export interface RestaurantSemanticFieldDiagnosticSummary {
  turnScope: "ALL_MODEL_EVALUATED" | "SELECTED_TURNS";
  selectedTurnCount?: number;
  totalTurnsInScope: number;
  modelEvaluatedTurns: number;
  scorableTurns: number;
  unscorableModelTurns: number;
  exactPassedTurns: number;
  blockedTurns: number;
  fieldMismatches: RestaurantSemanticFieldMismatchCounts;
  criteria: {
    expectedSlots: number;
    actualSlots: number;
    matchedTextSlots: number;
  };
  strength: {
    expected: Record<RestaurantCriterion["strength"], number>;
    actual: Record<RestaurantCriterion["strength"], number>;
    expectedHardOrSoftActualUnspecifiedSlots: number;
  };
  timeWindow: {
    expectedExactTurns: number;
    exactMatchedTurns: number;
    expectedMissingActualPresentTurns: number;
  };
  partySize: {
    expectedPresentTurns: number;
    matchedTurns: number;
  };
  diagnostics: RestaurantSemanticExposedTurnDiagnosis[];
}

export interface RestaurantSemanticExposedRegressionComparison {
  comparisonVersion: typeof RESTAURANT_SEMANTIC_EXPOSED_REGRESSION_COMPARISON_VERSION;
  comparableTurnIds: string[];
  baselineV4: RestaurantSemanticFieldDiagnosticSummary;
  promptV5Comparable: RestaurantSemanticFieldDiagnosticSummary;
  baselineToPromptV5FieldMismatchDelta: RestaurantSemanticFieldMismatchCounts;
  promptV5Overall: RestaurantSemanticFieldDiagnosticSummary;
  multiTurnContinuation: {
    baselineBlockedTurns: string[];
    promptV5ModelEvaluatedFormerlyBlockedTurns: string[];
    promptV5StillBlockedFormerlyBlockedTurns: string[];
  };
}

export interface RestaurantSemanticExpectedTurnSnapshot {
  sessionId: string;
  turnId: string;
  expectedDraft: RestaurantIntentDraft;
  expectedDecision: RestaurantSemanticExpectedDecision;
}

export interface RestaurantSemanticCommonUnchangedTurnsComparison {
  comparisonScope: "COMMON_UNCHANGED_TURNS";
  commonTurnIds: string[];
  annotationChangedTurnIds: string[];
  unavailableInPreviousSnapshotTurnIds: string[];
  previous: RestaurantSemanticFieldDiagnosticSummary;
  current: RestaurantSemanticFieldDiagnosticSummary;
  previousToCurrentFieldMismatchDelta: RestaurantSemanticFieldMismatchCounts;
}

interface ExpectedTurn {
  sessionId: string;
  turnId: string;
  expectedDraft: RestaurantIntentDraft;
  expectedDecision: RestaurantSemanticExpectedDecision;
}

function keyOf(sessionId: string, turnId: string): string {
  return `${sessionId}\u0000${turnId}`;
}

function emptyFieldMismatchCounts(): RestaurantSemanticFieldMismatchCounts {
  return {
    criteriaText: 0,
    polarity: 0,
    strength: 0,
    date: 0,
    timeWindow: 0,
    partySize: 0,
    area: 0,
    decision: 0,
  };
}

function emptyStrengthDistribution(): Record<RestaurantCriterion["strength"], number> {
  return { HARD: 0, SOFT: 0, UNSPECIFIED: 0 };
}

function canonicalCriterionText(value: string): string {
  return value.trim().toLowerCase();
}

function criterionByText(criteria: readonly RestaurantCriterion[]): Map<string, RestaurantCriterion> {
  const result = new Map<string, RestaurantCriterion>();
  for (const criterion of criteria) {
    result.set(canonicalCriterionText(criterion.text), criterion);
  }
  return result;
}

function expectedTurnsFor(dataset: RestaurantSemanticHoldoutDataset): Map<string, ExpectedTurn> {
  const expectedTurns = new Map<string, ExpectedTurn>();
  for (const session of dataset.sessions) {
    for (const turn of session.turns) {
      expectedTurns.set(keyOf(session.id, turn.id), {
        sessionId: session.id,
        turnId: turn.id,
        expectedDraft: turn.expectedDraft,
        expectedDecision: turn.expectedDecision,
      });
    }
  }
  return expectedTurns;
}

function mismatchedFields(
  expectedDraft: RestaurantIntentDraft,
  expectedDecision: RestaurantSemanticExpectedDecision,
  actualDraft: RestaurantIntentDraft,
  actualDecision: RestaurantSemanticExpectedDecision,
): RestaurantSemanticFieldDimension[] {
  const mismatches: RestaurantSemanticFieldDimension[] = [];
  const expectedCriteria = criterionByText(expectedDraft.criteria);
  const actualCriteria = criterionByText(actualDraft.criteria);
  if (
    expectedCriteria.size !== actualCriteria.size ||
    [...expectedCriteria.keys()].some((text) => !actualCriteria.has(text))
  ) {
    mismatches.push("criteriaText");
  }
  if (
    [...expectedCriteria.entries()].some(([text, expected]) => {
      const actual = actualCriteria.get(text);
      return actual !== undefined && actual.polarity !== expected.polarity;
    })
  ) {
    mismatches.push("polarity");
  }
  if (
    [...expectedCriteria.entries()].some(([text, expected]) => {
      const actual = actualCriteria.get(text);
      return actual !== undefined && actual.strength !== expected.strength;
    })
  ) {
    mismatches.push("strength");
  }
  if (!isDeepStrictEqual(actualDraft.date, expectedDraft.date)) mismatches.push("date");
  if (!isDeepStrictEqual(actualDraft.timeWindow, expectedDraft.timeWindow)) {
    mismatches.push("timeWindow");
  }
  if (!isDeepStrictEqual(actualDraft.partySize, expectedDraft.partySize)) {
    mismatches.push("partySize");
  }
  if (!isDeepStrictEqual(actualDraft.area, expectedDraft.area)) mismatches.push("area");
  if (!isDeepStrictEqual(actualDecision, expectedDecision)) mismatches.push("decision");
  return mismatches;
}

function selected(turn: RestaurantSemanticRegressionTurnResult, turnIds: ReadonlySet<string> | undefined) {
  return turnIds === undefined || turnIds.has(keyOf(turn.sessionId, turn.turnId));
}

/**
 * Produces field-level diagnostics from deterministic Gold without using an LLM Judge.
 * A model-gateway failure is kept visible as unscorable rather than guessed as a field mismatch.
 */
export function diagnoseRestaurantSemanticRegression(
  dataset: RestaurantSemanticHoldoutDataset,
  report: RestaurantSemanticRegressionReport,
  turnIds?: ReadonlySet<string>,
): RestaurantSemanticFieldDiagnosticSummary {
  const expectedTurns = expectedTurnsFor(dataset);
  const fieldMismatches = emptyFieldMismatchCounts();
  const expectedStrength = emptyStrengthDistribution();
  const actualStrength = emptyStrengthDistribution();
  const diagnostics: RestaurantSemanticExposedTurnDiagnosis[] = [];
  let modelEvaluatedTurns = 0;
  let scorableTurns = 0;
  let exactPassedTurns = 0;
  let blockedTurns = 0;
  let expectedCriteriaSlots = 0;
  let actualCriteriaSlots = 0;
  let matchedTextSlots = 0;
  let expectedHardOrSoftActualUnspecifiedSlots = 0;
  let expectedExactTurns = 0;
  let exactMatchedTurns = 0;
  let expectedMissingActualPresentTurns = 0;
  let expectedPartySizeTurns = 0;
  let matchedPartySizeTurns = 0;

  for (const turn of report.turns) {
    if (!selected(turn, turnIds)) continue;
    const expected = expectedTurns.get(keyOf(turn.sessionId, turn.turnId));
    if (!expected) {
      throw new Error(`Regression result has no matching Gold turn: ${turn.sessionId}/${turn.turnId}`);
    }
    const modelEvaluated = turn.status !== "BLOCKED_BY_UPSTREAM";
    if (!modelEvaluated) blockedTurns += 1;
    else modelEvaluatedTurns += 1;
    if (turn.status === "PASS") exactPassedTurns += 1;

    const scorable = modelEvaluated && turn.actualDraft !== undefined && turn.actualDecision !== undefined;
    const diagnosis: RestaurantSemanticExposedTurnDiagnosis = {
      sessionId: turn.sessionId,
      turnId: turn.turnId,
      status: turn.status,
      modelEvaluated,
      scorable,
      ...(turn.firstFailureStage ? { firstFailureStage: turn.firstFailureStage } : {}),
      expectedDraft: expected.expectedDraft,
      expectedDecision: expected.expectedDecision,
      ...(turn.actualDraft ? { actualDraft: turn.actualDraft } : {}),
      ...(turn.actualDecision ? { actualDecision: turn.actualDecision } : {}),
      mismatchedFields: [],
    };
    if (!scorable || turn.actualDraft === undefined || turn.actualDecision === undefined) {
      diagnostics.push(diagnosis);
      continue;
    }

    scorableTurns += 1;
    const actualDraft = turn.actualDraft;
    const actualDecision = turn.actualDecision;
    const mismatches = mismatchedFields(
      expected.expectedDraft,
      expected.expectedDecision,
      actualDraft,
      actualDecision,
    );
    diagnosis.mismatchedFields = mismatches;
    for (const field of mismatches) fieldMismatches[field] += 1;

    const expectedCriteria = criterionByText(expected.expectedDraft.criteria);
    const actualCriteria = criterionByText(actualDraft.criteria);
    expectedCriteriaSlots += expectedCriteria.size;
    actualCriteriaSlots += actualCriteria.size;
    for (const criterion of expectedCriteria.values()) expectedStrength[criterion.strength] += 1;
    for (const criterion of actualCriteria.values()) actualStrength[criterion.strength] += 1;
    for (const [text, expectedCriterion] of expectedCriteria) {
      const actualCriterion = actualCriteria.get(text);
      if (!actualCriterion) continue;
      matchedTextSlots += 1;
      if (
        (expectedCriterion.strength === "HARD" || expectedCriterion.strength === "SOFT") &&
        actualCriterion.strength === "UNSPECIFIED"
      ) {
        expectedHardOrSoftActualUnspecifiedSlots += 1;
      }
    }

    const expectedWindow = expected.expectedDraft.timeWindow;
    const actualWindow = actualDraft.timeWindow;
    if (expectedWindow !== undefined && expectedWindow.earliest === expectedWindow.latest) {
      expectedExactTurns += 1;
      if (isDeepStrictEqual(expectedWindow, actualWindow)) exactMatchedTurns += 1;
    }
    if (expectedWindow === undefined && actualWindow !== undefined) {
      expectedMissingActualPresentTurns += 1;
    }
    if (expected.expectedDraft.partySize !== undefined) {
      expectedPartySizeTurns += 1;
      if (actualDraft.partySize === expected.expectedDraft.partySize) matchedPartySizeTurns += 1;
    }
    diagnostics.push(diagnosis);
  }

  return {
    turnScope: turnIds === undefined ? "ALL_MODEL_EVALUATED" : "SELECTED_TURNS",
    ...(turnIds === undefined ? {} : { selectedTurnCount: turnIds.size }),
    totalTurnsInScope: diagnostics.length,
    modelEvaluatedTurns,
    scorableTurns,
    unscorableModelTurns: modelEvaluatedTurns - scorableTurns,
    exactPassedTurns,
    blockedTurns,
    fieldMismatches,
    criteria: {
      expectedSlots: expectedCriteriaSlots,
      actualSlots: actualCriteriaSlots,
      matchedTextSlots,
    },
    strength: {
      expected: expectedStrength,
      actual: actualStrength,
      expectedHardOrSoftActualUnspecifiedSlots,
    },
    timeWindow: {
      expectedExactTurns,
      exactMatchedTurns,
      expectedMissingActualPresentTurns,
    },
    partySize: {
      expectedPresentTurns: expectedPartySizeTurns,
      matchedTurns: matchedPartySizeTurns,
    },
    diagnostics,
  };
}

function turnIdsEvaluatedBy(
  report: RestaurantSemanticRegressionReport,
  predicate: (turn: RestaurantSemanticRegressionTurnResult) => boolean,
): Set<string> {
  return new Set(
    report.turns.filter(predicate).map((turn) => keyOf(turn.sessionId, turn.turnId)),
  );
}

function fieldMismatchDelta(
  baseline: RestaurantSemanticFieldMismatchCounts,
  current: RestaurantSemanticFieldMismatchCounts,
): RestaurantSemanticFieldMismatchCounts {
  const result = emptyFieldMismatchCounts();
  for (const field of RESTAURANT_SEMANTIC_FIELD_DIMENSIONS) {
    result[field] = baseline[field] - current[field];
  }
  return result;
}

/**
 * Compares only turns whose current Gold Draft and Decision retain the previous
 * annotation's semantics. This deliberately never turns a new Gold version into
 * a baseline comparison.
 */
export function compareRestaurantSemanticCommonUnchangedTurns(
  currentDataset: RestaurantSemanticHoldoutDataset,
  previousReport: RestaurantSemanticRegressionReport,
  currentReport: RestaurantSemanticRegressionReport,
  previousExpectedTurns: readonly RestaurantSemanticExpectedTurnSnapshot[],
): RestaurantSemanticCommonUnchangedTurnsComparison {
  const previousExpectedByTurn = new Map(
    previousExpectedTurns.map((turn) => [keyOf(turn.sessionId, turn.turnId), turn]),
  );
  const commonTurnIds = new Set<string>();
  const annotationChangedTurnIds: string[] = [];
  const unavailableInPreviousSnapshotTurnIds: string[] = [];
  for (const current of expectedTurnsFor(currentDataset).values()) {
    const turnId = keyOf(current.sessionId, current.turnId);
    const previous = previousExpectedByTurn.get(turnId);
    if (!previous) {
      unavailableInPreviousSnapshotTurnIds.push(turnId);
      continue;
    }
    if (
      equalRestaurantIntentDrafts(current.expectedDraft, previous.expectedDraft) &&
      isDeepStrictEqual(current.expectedDecision, previous.expectedDecision)
    ) {
      commonTurnIds.add(turnId);
    } else {
      annotationChangedTurnIds.push(turnId);
    }
  }
  const previousSummary = diagnoseRestaurantSemanticRegression(
    currentDataset,
    previousReport,
    commonTurnIds,
  );
  const currentSummary = diagnoseRestaurantSemanticRegression(
    currentDataset,
    currentReport,
    commonTurnIds,
  );
  return {
    comparisonScope: "COMMON_UNCHANGED_TURNS",
    commonTurnIds: [...commonTurnIds].sort(),
    annotationChangedTurnIds: annotationChangedTurnIds.sort(),
    unavailableInPreviousSnapshotTurnIds: unavailableInPreviousSnapshotTurnIds.sort(),
    previous: previousSummary,
    current: currentSummary,
    previousToCurrentFieldMismatchDelta: fieldMismatchDelta(
      previousSummary.fieldMismatches,
      currentSummary.fieldMismatches,
    ),
  };
}

/**
 * Compares a new exposed-data run to the exact subset that reached the v4 model in
 * the immutable baseline, then separately reports the new run's complete coverage.
 */
export function compareRestaurantSemanticExposedRegression(
  dataset: RestaurantSemanticHoldoutDataset,
  baselineReport: RestaurantSemanticRegressionReport,
  promptV5Report: RestaurantSemanticRegressionReport,
): RestaurantSemanticExposedRegressionComparison {
  const baselineModelTurnIds = turnIdsEvaluatedBy(
    baselineReport,
    (turn) => turn.status !== "BLOCKED_BY_UPSTREAM",
  );
  const baselineBlockedTurnIds = turnIdsEvaluatedBy(
    baselineReport,
    (turn) => turn.status === "BLOCKED_BY_UPSTREAM",
  );
  const promptV5ModelTurnIds = turnIdsEvaluatedBy(
    promptV5Report,
    (turn) => turn.status !== "BLOCKED_BY_UPSTREAM",
  );
  const promptV5BlockedTurnIds = turnIdsEvaluatedBy(
    promptV5Report,
    (turn) => turn.status === "BLOCKED_BY_UPSTREAM",
  );
  const baselineV4 = diagnoseRestaurantSemanticRegression(dataset, baselineReport, baselineModelTurnIds);
  const promptV5Comparable = diagnoseRestaurantSemanticRegression(
    dataset,
    promptV5Report,
    baselineModelTurnIds,
  );

  return {
    comparisonVersion: RESTAURANT_SEMANTIC_EXPOSED_REGRESSION_COMPARISON_VERSION,
    comparableTurnIds: [...baselineModelTurnIds].sort(),
    baselineV4,
    promptV5Comparable,
    baselineToPromptV5FieldMismatchDelta: fieldMismatchDelta(
      baselineV4.fieldMismatches,
      promptV5Comparable.fieldMismatches,
    ),
    promptV5Overall: diagnoseRestaurantSemanticRegression(dataset, promptV5Report),
    multiTurnContinuation: {
      baselineBlockedTurns: [...baselineBlockedTurnIds].sort(),
      promptV5ModelEvaluatedFormerlyBlockedTurns: [...baselineBlockedTurnIds]
        .filter((turnId) => promptV5ModelTurnIds.has(turnId))
        .sort(),
      promptV5StillBlockedFormerlyBlockedTurns: [...baselineBlockedTurnIds]
        .filter((turnId) => promptV5BlockedTurnIds.has(turnId))
        .sort(),
    },
  };
}
