import assert from "node:assert/strict";
import test from "node:test";

import { assessFixedSourceAcceptance } from "./fixed-source-acceptance.js";
import type { RestaurantHybridDiagnosticEvaluation } from "./diagnostic-evaluator.js";
import type { FixedSourceExpectation } from "./fixed-source-case-registry.js";

const required = ["AUTHORITATIVE_CONDITIONS", "REQUIRED_EVIDENCE", "FINAL_CLAIM", "COMPLETION_OUTCOME"] as const;
const positive: FixedSourceExpectation = { kind: "QUALIFIED_RESULT", execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" }, coverage: { necessary: true }, requiredDimensions: required };
const unavailable: FixedSourceExpectation = { kind: "VERIFIED_NO_RESULT", execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "NO_VERIFIED_RESULT" }, coverage: { necessary: true }, requiredDimensions: required };
const missingInput: FixedSourceExpectation = { kind: "NEEDS_USER_INPUT", execution: { status: "SUCCEEDED", loopStatus: "WAITING_USER", phase: "NEEDS_INPUT" }, coverage: { necessary: true }, requiredDimensions: ["COMPLETION_OUTCOME"] };
const cancelled: FixedSourceExpectation = { kind: "USER_CANCELLED", execution: { status: "CANCELLED", loopStatus: "CANCELLED", failureCodes: ["CANCELLED", "AGENT_LOOP_CANCELLED"] }, coverage: { necessary: true }, requiredDimensions: ["COMPLETION_OUTCOME"] };
const exhausted: FixedSourceExpectation = { kind: "BUDGET_OR_DEADLINE_STOP", execution: { status: "FAILED", failureCodes: ["MODEL_CALL_BUDGET_EXHAUSTED", "CANCELLED"] }, coverage: { necessary: true }, requiredDimensions: ["COMPLETION_OUTCOME"] };
const userRequestedThree: FixedSourceExpectation = {
  ...positive,
  requiredResultBatch: { source: "USER_EXPLICIT", candidateCount: 3 },
};

function evaluation(overrides: Partial<RestaurantHybridDiagnosticEvaluation["execution"]> = {}, failedDimension?: string): RestaurantHybridDiagnosticEvaluation {
  return {
    schemaVersion: "1", evaluatorVersion: "restaurant-hybrid-read-diagnostic-evaluator@19", rubricVersion: "restaurant-hybrid-read-diagnostic-rubric@19", rubricStatus: "DRAFT_DIAGNOSTIC_ONLY",
    sourceArtifact: { path: "fixture", sha256: "fixture" },
    execution: { status: "SUCCEEDED", stage: "AGENT_LOOP", taskProducedQualifiedResult: "YES", systemBehavior: "SUPPORTED_BY_EVIDENCE", externalConditions: "OBSERVED", evidenceSufficiency: "SUFFICIENT_FOR_PRESENTED_RESULT", completion: "PRESENTATION_RECORDED", ...overrides },
    candidateSummaries: [],
    findings: required.map((dimension) => ({ dimension, status: dimension === failedDimension ? "NOT_SATISFIED" : "SATISFIED", stage: "TEST", requirement: "fixture", observations: [], directCause: "fixture", rootCauseHypothesis: "fixture", certainty: "CONFIRMED", evidenceRefs: [], downstreamImpact: "fixture" })),
    unassessedDimensions: [],
  };
}

test("qualified result requires its own terminal record and independent support", () => {
  const wrong = assessFixedSourceAcceptance({ expectation: positive, execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "NO_VERIFIED_RESULT" }, evaluation: evaluation({ taskProducedQualifiedResult: "NO", completion: "NO_VERIFIED_RESULT" }) });
  assert.equal(wrong.acceptance, "FAIL");
  const normal = assessFixedSourceAcceptance({
    expectation: positive,
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: { candidateIds: ["a"], resultBatchTarget: { candidateCount: 3, met: false } },
  });
  assert.equal(normal.acceptance, "PASS");
});

test("a default open-ended target is reported but does not turn a qualified short batch into failure", () => {
  const fullBatch = assessFixedSourceAcceptance({
    expectation: positive,
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: { candidateIds: ["a", "b", "c"], resultBatchTarget: { candidateCount: 3, met: true } },
  });
  assert.deepEqual(fullBatch, {
    acceptance: "PASS", userGoalCompletion: "COMPLETE", reasons: [],
    defaultBatchTarget: { target: 3, actual: 3, met: true }, exitCode: 0,
  });

  const sourceLimitedShortBatch = assessFixedSourceAcceptance({
    expectation: positive,
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: { candidateIds: ["a", "b"], resultBatchTarget: { candidateCount: 3, met: false } },
  });
  assert.deepEqual(sourceLimitedShortBatch, {
    acceptance: "PASS", userGoalCompletion: "COMPLETE", reasons: [],
    defaultBatchTarget: { target: 3, actual: 2, met: false }, exitCode: 0,
  });
});

test("an explicit requested result count remains a completion requirement", () => {
  const insufficient = assessFixedSourceAcceptance({
    expectation: userRequestedThree,
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: {
      candidateIds: ["a", "b"], requestedResultCount: 3,
      resultBatchTarget: { candidateCount: 3, met: false },
    },
  });
  assert.equal(insufficient.acceptance, "FAIL");
  assert.match(insufficient.reasons.join("\n"), /3 distinct/);

  const fulfilled = assessFixedSourceAcceptance({
    expectation: userRequestedThree,
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: {
      candidateIds: ["a", "b", "c"], requestedResultCount: 3,
      resultBatchTarget: { candidateCount: 3, met: true },
    },
  });
  assert.equal(fulfilled.acceptance, "PASS");

  const twoRequested = assessFixedSourceAcceptance({
    expectation: { ...positive, requiredResultBatch: { source: "USER_EXPLICIT", candidateCount: 2 } },
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: {
      candidateIds: ["a", "b"], requestedResultCount: 2,
      resultBatchTarget: { candidateCount: 2, met: true },
    },
  });
  assert.equal(twoRequested.acceptance, "PASS");
});

test("an authoritative requested result count cannot be silently treated as a default batch", () => {
  const missingRegistration = assessFixedSourceAcceptance({
    expectation: positive,
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: {
      candidateIds: ["a", "b"], requestedResultCount: 3,
      resultBatchTarget: { candidateCount: 3, met: false },
    },
  });
  assert.equal(missingRegistration.acceptance, "FAIL");
  assert.equal(missingRegistration.defaultBatchTarget, undefined);
  assert.match(missingRegistration.reasons.join("\n"), /no USER_EXPLICIT result-count expectation/);

  const mismatchedRegistration = assessFixedSourceAcceptance({
    expectation: { ...positive, requiredResultBatch: { source: "USER_EXPLICIT", candidateCount: 2 } },
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: {
      candidateIds: ["a", "b"], requestedResultCount: 3,
      resultBatchTarget: { candidateCount: 2, met: true },
    },
  });
  assert.equal(mismatchedRegistration.acceptance, "FAIL");
  assert.match(mismatchedRegistration.reasons.join("\n"), /disagrees with authoritative State/);
});

test("a qualified result cannot pass with an empty presentation", () => {
  const empty = assessFixedSourceAcceptance({
    expectation: positive,
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    presentedResult: { candidateIds: [], resultBatchTarget: { candidateCount: 3, met: false } },
  });
  assert.equal(empty.acceptance, "FAIL");
  assert.match(empty.reasons.join("\n"), /one or more distinct/);
});

test("verified no-result passes only with matching no-result evidence", () => {
  const normal = assessFixedSourceAcceptance({ expectation: unavailable, execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "NO_VERIFIED_RESULT" }, evaluation: evaluation({ taskProducedQualifiedResult: "NO", completion: "NO_VERIFIED_RESULT", evidenceSufficiency: "INSUFFICIENT" }) });
  assert.equal(normal.acceptance, "PASS");
  assert.equal(normal.userGoalCompletion, "NOT_COMPLETE");
  const wrongReason = assessFixedSourceAcceptance({ expectation: unavailable, execution: { status: "FAILED", loopStatus: "CANCELLED", phase: "SEARCHING", failureCode: "NETWORK_FAILED" }, evaluation: evaluation({ taskProducedQualifiedResult: "NO", completion: "NO_VERIFIED_RESULT" }) });
  assert.equal(wrongReason.acceptance, "FAIL");
});

test("input pause, cancellation, and budget stops are distinct accepted behaviors", () => {
  const input = assessFixedSourceAcceptance({ expectation: missingInput, execution: { status: "SUCCEEDED", loopStatus: "WAITING_USER", phase: "NEEDS_INPUT" }, evaluation: evaluation({ taskProducedQualifiedResult: "UNKNOWN", completion: "NEEDS_USER_INPUT" }) });
  assert.equal(input.acceptance, "PASS");
  const cancelledOk = assessFixedSourceAcceptance({ expectation: cancelled, execution: { status: "CANCELLED", loopStatus: "CANCELLED", phase: "SEARCHING", failureCode: "CANCELLED" }, evaluation: evaluation({ taskProducedQualifiedResult: "NO", completion: "CANCELLED" }) });
  assert.equal(cancelledOk.acceptance, "PASS");
  const cancellationPretendingToBeInput = assessFixedSourceAcceptance({ expectation: missingInput, execution: { status: "CANCELLED", loopStatus: "CANCELLED", phase: "SEARCHING", failureCode: "CANCELLED" }, evaluation: evaluation({ taskProducedQualifiedResult: "UNKNOWN", completion: "NEEDS_USER_INPUT" }) });
  assert.equal(cancellationPretendingToBeInput.acceptance, "FAIL");
  const budgetOk = assessFixedSourceAcceptance({ expectation: exhausted, execution: { status: "FAILED", phase: "SEARCHING", failureCode: "MODEL_CALL_BUDGET_EXHAUSTED" }, evaluation: evaluation({ taskProducedQualifiedResult: "NO", completion: "BUDGET_OR_DEADLINE_STOP" }) });
  assert.equal(budgetOk.acceptance, "PASS");
  const wrongBudgetReason = assessFixedSourceAcceptance({ expectation: exhausted, execution: { status: "FAILED", phase: "SEARCHING", failureCode: "NETWORK_FAILED" }, evaluation: evaluation({ taskProducedQualifiedResult: "UNKNOWN", completion: "INTERNAL_EXECUTION_FAILURE" }) });
  assert.equal(wrongBudgetReason.acceptance, "FAIL");
});

test("coverage gaps and unassessed evaluator dimensions are nonzero outcomes", () => {
  const blocked = assessFixedSourceAcceptance({ expectation: positive, execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" }, evaluation: evaluation(), coverageGaps: [{ source: "GOOGLE_DETAILS", stage: "DETAILS", request: "placeId=missing", reason: "unconfigured" }] });
  assert.equal(blocked.acceptance, "BLOCKED");
  assert.equal(blocked.exitCode, 1);
  const unassessed = assessFixedSourceAcceptance({ expectation: positive, execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" }, evaluation: evaluation({}, "REQUIRED_EVIDENCE") });
  assert.equal(unassessed.acceptance, "FAIL");
  const evaluatorFailure = assessFixedSourceAcceptance({ expectation: positive, execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" }, evaluationFailure: "EVALUATION_FAILED" });
  assert.equal(evaluatorFailure.acceptance, "BLOCKED");
  const optional = { ...positive, coverage: { necessary: false, optionalSources: ["WEBSITE"] } };
  const optionalWithoutIndependentResult = assessFixedSourceAcceptance({ expectation: optional, execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" }, evaluation: evaluation({ taskProducedQualifiedResult: "UNKNOWN" }), coverageGaps: [{ source: "WEBSITE", stage: "FACTS", request: "site", reason: "not configured" }] });
  assert.equal(optionalWithoutIndependentResult.acceptance, "BLOCKED");
  const optionalWithIndependentResult = assessFixedSourceAcceptance({
    expectation: optional,
    execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" },
    evaluation: evaluation(),
    coverageGaps: [{ source: "WEBSITE", stage: "FACTS", request: "site", reason: "not configured" }],
    presentedResult: { candidateIds: ["a"], resultBatchTarget: { candidateCount: 3, met: false } },
  });
  assert.equal(optionalWithIndependentResult.acceptance, "PASS");
});
