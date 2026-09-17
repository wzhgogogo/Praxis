import assert from "node:assert/strict";
import test from "node:test";

import { assessFixedSourceAcceptance } from "./fixed-source-acceptance.js";
import type { RestaurantHybridDiagnosticEvaluation } from "./diagnostic-evaluator.js";

const required = ["AUTHORITATIVE_CONDITIONS", "REQUIRED_EVIDENCE", "FINAL_CLAIM", "COMPLETION_OUTCOME"] as const;
const positive = { kind: "QUALIFIED_RESULT" as const, userGoalComplete: true, requiredDimensions: required };
const unavailable = { kind: "NO_QUALIFIED_RESULT" as const, userGoalComplete: false, requiredDimensions: required };

function evaluation(overrides: Partial<RestaurantHybridDiagnosticEvaluation["execution"]> = {}, failedDimension?: string): RestaurantHybridDiagnosticEvaluation {
  return {
    schemaVersion: "1", evaluatorVersion: "restaurant-hybrid-read-diagnostic-evaluator@15", rubricVersion: "restaurant-hybrid-read-diagnostic-rubric@15", rubricStatus: "DRAFT_DIAGNOSTIC_ONLY",
    sourceArtifact: { path: "fixture", sha256: "fixture" },
    execution: { status: "SUCCEEDED", stage: "AGENT_LOOP", taskProducedQualifiedResult: "YES", systemBehavior: "SUPPORTED_BY_EVIDENCE", externalConditions: "OBSERVED", evidenceSufficiency: "SUFFICIENT_FOR_PRESENTED_RESULT", completion: "PRESENTATION_RECORDED", ...overrides },
    candidateSummaries: [],
    findings: required.map((dimension) => ({ dimension, status: dimension === failedDimension ? "NOT_SATISFIED" : "SATISFIED", stage: "TEST", requirement: "fixture", observations: [], directCause: "fixture", rootCauseHypothesis: "fixture", certainty: "CONFIRMED", evidenceRefs: [], downstreamImpact: "fixture" })),
    unassessedDimensions: [],
  };
}

const success = { status: "SUCCEEDED" as const, loopStatus: "TERMINAL", phase: "PRESENT_RESULTS" };

test("positive fixed-source acceptance fails for a terminal no-result", () => {
  const result = assessFixedSourceAcceptance({ expectation: positive, execution: { ...success, phase: "NO_VERIFIED_RESULT" }, evaluation: evaluation({ taskProducedQualifiedResult: "NO", completion: "NO_VERIFIED_RESULT" }) });
  assert.equal(result.acceptance, "FAIL");
  assert.equal(result.exitCode, 1);
});

test("fixed-source acceptance fails missing evidence and evaluator failures", () => {
  const unsupported = assessFixedSourceAcceptance({ expectation: positive, execution: success, evaluation: evaluation({}, "REQUIRED_EVIDENCE") });
  assert.equal(unsupported.acceptance, "FAIL");
  assert.equal(unsupported.exitCode, 1);
  const blocked = assessFixedSourceAcceptance({ expectation: positive, execution: success, evaluationFailure: "EVALUATION_FAILED" });
  assert.equal(blocked.acceptance, "BLOCKED");
  assert.equal(blocked.exitCode, 1);
});

test("declared no-result can pass without claiming the user goal", () => {
  const result = assessFixedSourceAcceptance({ expectation: unavailable, execution: { ...success, phase: "NO_VERIFIED_RESULT" }, evaluation: evaluation({ taskProducedQualifiedResult: "NO", completion: "NO_VERIFIED_RESULT" }) });
  assert.equal(result.acceptance, "PASS");
  assert.equal(result.userGoalCompletion, "NOT_COMPLETE");
  assert.equal(result.exitCode, 0);
});

test("fully-supported positive returns the only zero exit code", () => {
  const result = assessFixedSourceAcceptance({ expectation: positive, execution: success, evaluation: evaluation() });
  assert.deepEqual(result, { acceptance: "PASS", userGoalCompletion: "COMPLETE", reasons: [], exitCode: 0 });
});
