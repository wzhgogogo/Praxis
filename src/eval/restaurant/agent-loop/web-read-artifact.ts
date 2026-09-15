import { resolve } from "node:path";

import { evaluateArtifactAfterFinish, RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION, RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION } from "./diagnostic-evaluator.js";
import { startDiagnosticRun } from "../../shared/diagnostic-run.js";

/**
 * The Web path writes the same immutable result + evaluation-sidecar shape as
 * Hybrid. It deliberately contains no raw conversation text or browser DOM.
 */
export async function persistWebReadArtifact(
  directory: string,
  artifact: Record<string, unknown> & { status: "SUCCEEDED" | "FAILED" | "CANCELLED" },
): Promise<{ resultPath: string; evaluationPath?: string; evaluationFailure?: string; evaluationFailurePath?: string }> {
  const journal = await startDiagnosticRun(resolve(directory), {
    mode: "WEB_READ",
    caseId: artifact.caseId,
    diagnosticEvaluator: {
      version: RESTAURANT_HYBRID_DIAGNOSTIC_EVALUATOR_VERSION,
      rubricVersion: RESTAURANT_HYBRID_DIAGNOSTIC_RUBRIC_VERSION,
    },
    requestMetadata: artifact.requestMetadata,
    safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: "NOT_MEASURED" },
  });
  await journal.finish(artifact);
  const evaluation = await evaluateArtifactAfterFinish(journal.resultPath);
  return {
    resultPath: journal.resultPath,
    ...(evaluation.outputPath ? { evaluationPath: evaluation.outputPath } : {}),
    ...(evaluation.evaluationFailure ? { evaluationFailure: evaluation.evaluationFailure } : {}),
    ...(evaluation.failurePath ? { evaluationFailurePath: evaluation.failurePath } : {}),
  };
}
