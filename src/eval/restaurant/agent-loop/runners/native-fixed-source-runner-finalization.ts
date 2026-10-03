import { writeFile } from "node:fs/promises";

import type { RestaurantHybridDiagnosticEvaluation } from "../diagnostic-evaluator.js";

type FinalEvaluation = {
  outputPath?: string;
  evaluation?: RestaurantHybridDiagnosticEvaluation;
  evaluationFailure?: string;
  failurePath?: string;
};

type NativeFixedSourceJournal = {
  resultPath: string;
  finish(result: Record<string, unknown> & { status: "SUCCEEDED" | "FAILED" | "CANCELLED" }): Promise<void>;
};

export type NativeFixedSourceFinalizationProgress = {
  executionArtifactSaved: boolean;
  evaluation?: FinalEvaluation;
};

/**
 * The fixed-source model runner's durable closing sequence.  Keep execution,
 * independent evaluation, and acceptance in separate immutable files.
 */
export async function finalizeNativeFixedSourceRun(input: {
  journal: NativeFixedSourceJournal;
  result: Record<string, unknown> & { status: "SUCCEEDED" | "FAILED" | "CANCELLED" };
  progress: NativeFixedSourceFinalizationProgress;
  evaluate(path: string): Promise<FinalEvaluation>;
  buildAcceptanceSidecar(evaluation: FinalEvaluation): Record<string, unknown>;
}): Promise<{ acceptancePath: string; evaluation: FinalEvaluation }> {
  await input.journal.finish(input.result);
  input.progress.executionArtifactSaved = true;
  const evaluation = await input.evaluate(input.journal.resultPath);
  input.progress.evaluation = evaluation;
  const acceptancePath = input.journal.resultPath.replace(/\.result\.json$/, ".acceptance.json");
  await writeFile(acceptancePath, JSON.stringify(input.buildAcceptanceSidecar(evaluation), null, 2), { flag: "wx" });
  return { acceptancePath, evaluation };
}
