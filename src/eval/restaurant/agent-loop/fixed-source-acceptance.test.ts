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

function evaluation(overrides: Partial<RestaurantHybridDiagnosticEvaluation["execution"]> = {}, failedDimension?: string): RestaurantHybridDiagnosticEvaluation {
  return {
    schemaVersion: "1", evaluatorVersion: "restaurant-hybrid-read-diagnostic-evaluator@16", rubricVersion: "restaurant-hybrid-read-diagnostic-rubric@16", rubricStatus: "DRAFT_DIAGNOSTIC_ONLY",
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
  const normal = assessFixedSourceAcceptance({ expectation: positive, execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" }, evaluation: evaluation() });
  assert.deepEqual(normal, { acceptance: "PASS", userGoalCompletion: "COMPLETE", reasons: [], exitCode: 0 });
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
  const optionalWithIndependentResult = assessFixedSourceAcceptance({ expectation: optional, execution: { status: "SUCCEEDED", loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" }, evaluation: evaluation(), coverageGaps: [{ source: "WEBSITE", stage: "FACTS", request: "site", reason: "not configured" }] });
  assert.equal(optionalWithIndependentResult.acceptance, "PASS");
});
