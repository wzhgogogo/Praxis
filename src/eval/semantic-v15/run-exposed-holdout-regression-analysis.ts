import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { compareRestaurantSemanticExposedRegression } from "./exposed-regression.js";
import { loadRestaurantSemanticHoldout } from "./holdout.js";
import type { RestaurantSemanticRegressionReport } from "./regression.js";

const FIELD_ANALYSIS_VERSION = "2";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function record(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(message);
  }
  return value as Record<string, unknown>;
}

function regressionReport(value: unknown, message: string): RestaurantSemanticRegressionReport {
  const candidate = record(value, message);
  if (
    candidate.status !== "COMPLETED" ||
    !Array.isArray(candidate.turns) ||
    typeof candidate.summary !== "object" ||
    candidate.summary === null
  ) {
    throw new Error(message);
  }
  return candidate as unknown as RestaurantSemanticRegressionReport;
}

const inputPath = process.argv[2];
if (!inputPath) {
  throw new Error("Pass the completed exposed regression artifact path as the only argument");
}
const artifactPath = resolve(inputPath);
if (!artifactPath.endsWith(".json")) {
  throw new Error("The exposed regression artifact path must end in .json");
}
const outputPath = artifactPath.replace(/\.json$/, `-field-analysis-v${FIELD_ANALYSIS_VERSION}.json`);
const runArtifactSource = await readFile(artifactPath, "utf8");
const runArtifact = record(JSON.parse(runArtifactSource), "Exposed regression artifact must be an object");
if (runArtifact.status !== "COMPLETED") {
  throw new Error("Field analysis requires a completed exposed regression artifact");
}
const baselineArtifactReference = record(
  runArtifact.baselineArtifact,
  "Exposed regression artifact has no baseline artifact reference",
);
if (typeof baselineArtifactReference.path !== "string") {
  throw new Error("Baseline artifact reference has no path");
}
const [preflight, baselineSource] = await Promise.all([
  loadRestaurantSemanticHoldout(undefined, "REQUIRE_COMPLETE"),
  readFile(baselineArtifactReference.path, "utf8"),
]);
if (preflight.status !== "READY_FOR_BASELINE" || !preflight.dataset) {
  throw new Error(`Current dataset cannot be analysed:\n${JSON.stringify(preflight.issues, null, 2)}`);
}
const datasetSource = await readFile(preflight.datasetPath, "utf8");
if (runArtifact.datasetSha256 !== sha256(datasetSource)) {
  throw new Error("Current dataset SHA differs from the recorded exposed regression; do not regenerate analysis");
}
const baselineArtifact = record(JSON.parse(baselineSource), "Baseline artifact must be an object");
if (baselineArtifact.status !== "COMPLETED" || baselineArtifact.datasetSha256 !== runArtifact.datasetSha256) {
  throw new Error("Baseline artifact is incomplete or was produced from a different dataset SHA");
}

const baselineReport = regressionReport(
  baselineArtifact.report,
  "Baseline artifact does not contain a completed regression report",
);
const promptV5Report = regressionReport(
  runArtifact.report,
  "Exposed regression artifact does not contain a completed regression report",
);
const comparison = compareRestaurantSemanticExposedRegression(
  preflight.dataset,
  baselineReport,
  promptV5Report,
);

await writeFile(
  outputPath,
  JSON.stringify(
    {
      status: "COMPLETED",
      analysisVersion: FIELD_ANALYSIS_VERSION,
      generatedAt: new Date().toISOString(),
      correction: {
        reason:
          "v1 diagnostic counts treated a criteria-text mismatch as an additional polarity/strength mismatch. v2 only compares polarity and strength when canonical criterion text matches.",
        replacesAnalysisOnly: artifactPath,
        preservesRawModelResult: true,
        preservesBaselineArtifact: true,
      },
      sourceRunArtifact: { path: artifactPath, sha256: sha256(runArtifactSource) },
      baselineArtifact: { path: baselineArtifactReference.path, sha256: sha256(baselineSource) },
      datasetSha256: sha256(datasetSource),
      evaluationClassification: runArtifact.evaluationClassification,
      comparison,
      durableRecord: {
        format: "JSON_ANALYSIS_SIDECAR",
        purpose: "CORRECTED_FIELD_LEVEL_DELTA_FOR_EXPOSED_HOLDOUT_PROMPT_REGRESSION",
        privacy: "PRIVATE_EXPOSED_HOLDOUT_AND_STRUCTURED_RESULTS_GIT_IGNORED",
      },
    },
    null,
    2,
  ),
  { encoding: "utf8", flag: "wx" },
);

console.log(
  JSON.stringify(
    {
      analysisVersion: FIELD_ANALYSIS_VERSION,
      outputPath,
      comparableTurns: comparison.comparableTurnIds.length,
      baselineToPromptV5FieldMismatchDelta: comparison.baselineToPromptV5FieldMismatchDelta,
      promptV5Overall: {
        exactPassedTurns: comparison.promptV5Overall.exactPassedTurns,
        modelEvaluatedTurns: comparison.promptV5Overall.modelEvaluatedTurns,
        blockedTurns: comparison.promptV5Overall.blockedTurns,
      },
      multiTurnContinuation: {
        baselineBlockedTurns: comparison.multiTurnContinuation.baselineBlockedTurns.length,
        promptV5ModelEvaluatedFormerlyBlockedTurns:
          comparison.multiTurnContinuation.promptV5ModelEvaluatedFormerlyBlockedTurns.length,
      },
    },
    null,
    2,
  ),
);
