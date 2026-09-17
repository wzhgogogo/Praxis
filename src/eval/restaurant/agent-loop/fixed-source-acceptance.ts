import type { DiagnosticFinding, RestaurantHybridDiagnosticEvaluation } from "./diagnostic-evaluator.js";
import type { FixedSourceExpectation } from "./fixed-source-case-registry.js";

export type FixedSourceExecutionResult = {
  status: "SUCCEEDED" | "FAILED" | "CANCELLED";
  loopStatus?: string;
  phase?: string;
  failureCode?: string | null;
};

export type FixedSourceAcceptanceResult = {
  acceptance: "PASS" | "FAIL" | "BLOCKED";
  userGoalCompletion: "COMPLETE" | "NOT_COMPLETE" | "UNKNOWN";
  reasons: string[];
  exitCode: 0 | 1;
};

function findingStatus(evaluation: RestaurantHybridDiagnosticEvaluation, dimension: DiagnosticFinding["dimension"]): string | undefined {
  return evaluation.findings.find((finding) => finding.dimension === dimension)?.status;
}

/**
 * Converts independent evaluator evidence plus a case's predeclared contract
 * into the only successful CLI outcome.  It intentionally has no access to
 * production `eligible`, `canEndRead`, or terminal labels as an oracle.
 */
export function assessFixedSourceAcceptance(input: {
  expectation: FixedSourceExpectation;
  execution: FixedSourceExecutionResult;
  evaluation?: RestaurantHybridDiagnosticEvaluation;
  evaluationFailure?: string;
}): FixedSourceAcceptanceResult {
  const reasons: string[] = [];
  if (input.evaluationFailure || !input.evaluation) {
    return { acceptance: "BLOCKED", userGoalCompletion: "UNKNOWN", reasons: [`Evaluator unavailable: ${input.evaluationFailure ?? "EVALUATION_MISSING"}`], exitCode: 1 };
  }
  const evaluation = input.evaluation;
  for (const dimension of input.expectation.requiredDimensions) {
    const status = findingStatus(evaluation, dimension);
    if (status !== "SATISFIED") reasons.push(`Required evaluator dimension ${dimension} is ${status ?? "MISSING"}.`);
  }
  if (input.execution.status !== "SUCCEEDED" || input.execution.loopStatus !== "TERMINAL") {
    reasons.push(`Execution did not terminate successfully (${input.execution.status}/${input.execution.loopStatus ?? "MISSING"}).`);
  }
  const qualified = evaluation.execution.taskProducedQualifiedResult === "YES";
  const expectedQualified = input.expectation.kind === "QUALIFIED_RESULT";
  if (qualified !== expectedQualified) reasons.push(`Expected ${input.expectation.kind}, got ${evaluation.execution.taskProducedQualifiedResult}.`);
  if (expectedQualified && input.execution.phase !== "PRESENT_RESULTS") reasons.push(`Positive case ended in ${input.execution.phase ?? "MISSING"}, not PRESENT_RESULTS.`);
  if (!expectedQualified && input.execution.phase !== "NO_VERIFIED_RESULT") reasons.push(`No-result case ended in ${input.execution.phase ?? "MISSING"}, not NO_VERIFIED_RESULT.`);
  const acceptance = reasons.length ? "FAIL" : "PASS";
  const userGoalCompletion = acceptance !== "PASS" ? "UNKNOWN" : input.expectation.userGoalComplete ? "COMPLETE" : "NOT_COMPLETE";
  return { acceptance, userGoalCompletion, reasons, exitCode: acceptance === "PASS" ? 0 : 1 };
}
