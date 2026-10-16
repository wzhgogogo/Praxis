import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { evaluateArtifactFile, evaluateRestaurantHybridLiveArtifact } from "../diagnostic-evaluator.js";
import { loadFrozenCalibrationInput, loadCalibrationObservations } from "../calibration-inputs.js";
import { loadWitnessContext } from "../diagnostic-evaluator-witness.js";

export async function evaluateFrozenCalibrationArtifact(manifest: string, runId: string, outputDirectory: string, witnessContext?: string, sourceContext?: string) {
  if (!/^[a-zA-Z0-9-]+$/.test(runId)) throw Error("Invalid output run ID");
  const input = await loadFrozenCalibrationInput(manifest, runId);
  const witnessOracle = witnessContext ? loadWitnessContext(witnessContext, runId) : undefined;
  const observations = sourceContext ? await loadCalibrationObservations(sourceContext, runId, input.sourceArtifact.sha256) : undefined;
  const evaluation = evaluateRestaurantHybridLiveArtifact(input.artifact, input.sourceArtifact, { ...input.options, ...observations?.options, ...(witnessOracle ? { witnessOracle } : {}) });
  const outputPath = resolve(outputDirectory, `${runId}.evaluation.29.${randomUUID()}.json`);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, JSON.stringify({ ...evaluation, frozenInput: { manifestSha256: input.manifestSha256, fileRefs: input.fileRefs, ...(observations ? { observationContextSha256: observations.contextSha256, observationRefs: observations.refs } : {}) } }, null, 2), { flag: "wx" });
  return { evaluation, outputPath };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const argument = (flag: string) => { const index = process.argv.indexOf(flag); if (index < 0 || !process.argv[index + 1]) throw Error(`Missing ${flag}`); return process.argv[index + 1]!; };
  const inputPath = process.argv[2];
  if (!inputPath) throw Error("Pass an existing result.json[.gz], or --manifest <path> --run <id> --out-dir <directory>");
  const { evaluation, outputPath } = inputPath === "--manifest"
    ? await evaluateFrozenCalibrationArtifact(argument("--manifest"), argument("--run"), argument("--out-dir"), process.argv.includes("--witness-context") ? argument("--witness-context") : undefined, process.argv.includes("--source-context") ? argument("--source-context") : undefined)
    : await evaluateArtifactFile(inputPath);
  console.log(JSON.stringify({ outputPath, execution: evaluation.execution, outcome: evaluation.outcome, severity: evaluation.severity, evaluatorVersion: evaluation.evaluatorVersion }, null, 2));
}
