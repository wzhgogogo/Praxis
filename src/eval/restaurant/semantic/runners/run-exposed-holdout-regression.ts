import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import type { ModelInvocationRecord } from "../../../../core/model/contracts.js";
import { RestaurantSemanticInterpreter } from "../../../../domains/restaurant/semantic-interpreter.js";
import { DeepSeekModelGateway } from "../../../../infrastructure/deepseek/deepseek-model-gateway.js";
import {
  compareRestaurantSemanticCommonUnchangedTurns,
  compareRestaurantSemanticExposedRegression,
  type RestaurantSemanticExpectedTurnSnapshot,
  type RestaurantSemanticExposedRegressionComparison,
} from "../exposed-regression.js";
import {
  RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST,
  loadRestaurantSemanticHoldout,
  restaurantSemanticHoldoutFrozenAudit,
  restaurantSemanticHoldoutTurnCount,
} from "../holdout.js";
import {
  runRestaurantSemanticRegression,
  type RestaurantSemanticRegressionReport,
} from "../regression.js";
import {
  requireRealModelEvalConfiguration,
  summarizeRealModelEval,
} from "../../../shared/real-model.js";

const execFileAsync = promisify(execFile);
const EXPOSED_REGRESSION_CONFIRMATION_ENV = "PRAXIS_CONFIRM_EXPOSED_HOLDOUT_REGRESSION";
const CURRENT_CANONICAL_GOLD_CONFIRMATION_ENV = "PRAXIS_CONFIRM_CURRENT_EXPOSED_GOLD_VERSION";
const PREVIOUS_EXPOSED_REGRESSION_ARTIFACT_ENV = "PRAXIS_PREVIOUS_EXPOSED_REGRESSION_ARTIFACT";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function gitOutput(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args);
  return stdout;
}

async function captureCodeSnapshot(): Promise<{
  gitCommitSha: string;
  gitStatusPorcelain: string;
  gitDiff: string;
  gitDiffSha256: string;
}> {
  const gitCommitSha = (await gitOutput(["rev-parse", "HEAD"])).trim();
  if (!/^[0-9a-f]{40}$/i.test(gitCommitSha)) {
    throw new Error("Exposed regression requires the checked-out git commit SHA before model invocation");
  }
  const [gitStatusPorcelain, gitDiff] = await Promise.all([
    gitOutput(["status", "--porcelain"]),
    gitOutput(["diff", "--binary", "--no-ext-diff"]),
  ]);
  return {
    gitCommitSha,
    gitStatusPorcelain,
    gitDiff,
    gitDiffSha256: sha256(gitDiff),
  };
}

function isRegressionReport(value: unknown): value is RestaurantSemanticRegressionReport {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.status === "COMPLETED" &&
    Array.isArray(record.turns) &&
    typeof record.summary === "object" &&
    record.summary !== null
  );
}

function record(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function expectedTurnSnapshotsFromPreviousAnalysis(value: unknown): RestaurantSemanticExpectedTurnSnapshot[] {
  if (!Array.isArray(value)) {
    throw new Error("Previous exposed regression analysis does not contain promptV5Overall diagnostics");
  }
  return value.map((item, index) => {
    const diagnostic = record(item, `Invalid previous diagnostic at index ${index}`);
    if (
      typeof diagnostic.sessionId !== "string" ||
      typeof diagnostic.turnId !== "string" ||
      typeof diagnostic.expectedDraft !== "object" ||
      diagnostic.expectedDraft === null ||
      typeof diagnostic.expectedDecision !== "object" ||
      diagnostic.expectedDecision === null
    ) {
      throw new Error(`Invalid expected-turn snapshot at index ${index}`);
    }
    return {
      sessionId: diagnostic.sessionId,
      turnId: diagnostic.turnId,
      expectedDraft: diagnostic.expectedDraft as RestaurantSemanticExpectedTurnSnapshot["expectedDraft"],
      expectedDecision: diagnostic.expectedDecision as RestaurantSemanticExpectedTurnSnapshot["expectedDecision"],
    };
  });
}

function previousPromptVersionFor(currentPromptVersion: string): string {
  const match = /^v([1-9][0-9]*)$/.exec(currentPromptVersion);
  if (!match || Number(match[1]) <= 1) {
    throw new Error(`Cannot determine the predecessor for prompt version ${currentPromptVersion}`);
  }
  return `v${Number(match[1]) - 1}`;
}

function comparisonSummary(comparison: RestaurantSemanticExposedRegressionComparison) {
  return {
    comparableTurns: comparison.comparableTurnIds.length,
    baselineV4: {
      exactPassedTurns: comparison.baselineV4.exactPassedTurns,
      fieldMismatches: comparison.baselineV4.fieldMismatches,
    },
    promptV5Comparable: {
      exactPassedTurns: comparison.promptV5Comparable.exactPassedTurns,
      fieldMismatches: comparison.promptV5Comparable.fieldMismatches,
    },
    baselineToPromptV5FieldMismatchDelta: comparison.baselineToPromptV5FieldMismatchDelta,
    promptV5Overall: {
      totalTurnsInScope: comparison.promptV5Overall.totalTurnsInScope,
      modelEvaluatedTurns: comparison.promptV5Overall.modelEvaluatedTurns,
      exactPassedTurns: comparison.promptV5Overall.exactPassedTurns,
      blockedTurns: comparison.promptV5Overall.blockedTurns,
      fieldMismatches: comparison.promptV5Overall.fieldMismatches,
    },
    multiTurnContinuation: {
      baselineBlockedTurns: comparison.multiTurnContinuation.baselineBlockedTurns.length,
      promptV5ModelEvaluatedFormerlyBlockedTurns:
        comparison.multiTurnContinuation.promptV5ModelEvaluatedFormerlyBlockedTurns.length,
      promptV5StillBlockedFormerlyBlockedTurns:
        comparison.multiTurnContinuation.promptV5StillBlockedFormerlyBlockedTurns.length,
    },
  };
}

function commonUnchangedTurnsSummary(
  comparison: ReturnType<typeof compareRestaurantSemanticCommonUnchangedTurns>,
) {
  return {
    comparisonScope: comparison.comparisonScope,
    commonTurns: comparison.commonTurnIds.length,
    annotationChangedTurns: comparison.annotationChangedTurnIds.length,
    unavailableInPreviousSnapshotTurns: comparison.unavailableInPreviousSnapshotTurnIds.length,
    previous: {
      exactPassedTurns: comparison.previous.exactPassedTurns,
      fieldMismatches: comparison.previous.fieldMismatches,
    },
    current: {
      exactPassedTurns: comparison.current.exactPassedTurns,
      fieldMismatches: comparison.current.fieldMismatches,
    },
    previousToCurrentFieldMismatchDelta: comparison.previousToCurrentFieldMismatchDelta,
  };
}

const preflight = await loadRestaurantSemanticHoldout(undefined, "REQUIRE_COMPLETE");
if (preflight.status !== "READY_FOR_BASELINE" || !preflight.dataset) {
  throw new Error(`Exposed Holdout regression preflight failed:\n${JSON.stringify(preflight.issues, null, 2)}`);
}
if (process.env[EXPOSED_REGRESSION_CONFIRMATION_ENV] !== "1") {
  throw new Error(
    `${EXPOSED_REGRESSION_CONFIRMATION_ENV}=1 is required because this makes paid calls against an already exposed private dataset`,
  );
}
if (process.env.DEEPSEEK_MODEL !== RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.model) {
  throw new Error(
    `DEEPSEEK_MODEL must remain ${RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.model} for the baseline comparison`,
  );
}

const turnCount = restaurantSemanticHoldoutTurnCount(preflight.dataset);
const configuration = requireRealModelEvalConfiguration(process.env, turnCount);
if (configuration.caseLimit !== turnCount) {
  throw new Error(
    `Exposed Holdout regression requires exactly ${turnCount} turns. ` +
      `Set PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=${turnCount} or omit it.`,
  );
}

const baselineArtifactPath = resolve(
  ".eval-artifacts",
  "restaurant-semantic-holdout",
  `${preflight.dataset.id}-v${preflight.dataset.version}-baseline.json`,
);
const [datasetSource, baselineSource, codeSnapshot] = await Promise.all([
  readFile(preflight.datasetPath, "utf8"),
  readFile(baselineArtifactPath, "utf8"),
  captureCodeSnapshot(),
]);
const datasetSha256 = sha256(datasetSource);
const baselineArtifact = JSON.parse(baselineSource) as Record<string, unknown>;
if (baselineArtifact.status !== "COMPLETED" || baselineArtifact.datasetStatus !== "EXPOSED") {
  throw new Error(`Baseline artifact is not a completed exposed result: ${baselineArtifactPath}`);
}
const matchesOriginalBaselineDataset = baselineArtifact.datasetSha256 === datasetSha256;
const usesCurrentCanonicalGold = !matchesOriginalBaselineDataset;
if (
  usesCurrentCanonicalGold &&
  process.env[CURRENT_CANONICAL_GOLD_CONFIRMATION_ENV] !== "1"
) {
  throw new Error(
    `The private dataset SHA differs from the completed baseline artifact. ` +
      `Set ${CURRENT_CANONICAL_GOLD_CONFIRMATION_ENV}=1 only after explicitly accepting the current exposed Gold as canonical.`,
  );
}
if (!isRegressionReport(baselineArtifact.report)) {
  throw new Error(`Baseline artifact does not contain a readable regression report: ${baselineArtifactPath}`);
}

const previousArtifactPath = usesCurrentCanonicalGold
  ? process.env[PREVIOUS_EXPOSED_REGRESSION_ARTIFACT_ENV]
  : undefined;
if (usesCurrentCanonicalGold && !previousArtifactPath) {
  throw new Error(
    `${PREVIOUS_EXPOSED_REGRESSION_ARTIFACT_ENV} must identify the prior exposed regression ` +
      "so the current canonical Gold can be compared only on COMMON_UNCHANGED_TURNS.",
  );
}
const previousExposedRegression = previousArtifactPath
  ? await (async () => {
      const artifactPath = resolve(previousArtifactPath);
      const artifactSource = await readFile(artifactPath, "utf8");
      const artifact = record(JSON.parse(artifactSource), "Previous exposed regression artifact must be an object");
      if (artifact.status !== "COMPLETED" || !isRegressionReport(artifact.report)) {
        throw new Error(`Previous exposed regression is not completed: ${artifactPath}`);
      }
      const promptVersion = record(artifact.manifest, "Previous exposed regression has no manifest").promptVersion;
      const expectedPreviousPromptVersion = previousPromptVersionFor(
        RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.promptVersion,
      );
      if (promptVersion !== expectedPreviousPromptVersion) {
        throw new Error(
          `Previous exposed regression must be Prompt ${expectedPreviousPromptVersion}, received ${String(promptVersion)}`,
        );
      }
      if (artifact.datasetSha256 !== datasetSha256) {
        throw new Error(
          "The current dataset SHA differs from the previous exposed regression artifact; " +
            "confirm the Gold lineage before running instead of mixing cohorts.",
        );
      }
      const analysisPath = artifactPath.replace(/\.json$/, "-field-analysis-v2.json");
      let expectedTurns: RestaurantSemanticExpectedTurnSnapshot[];
      let expectedTurnSnapshotPath: string;
      let expectedTurnSnapshotSource: string;
      if (promptVersion === "v5") {
        const analysisSource = await readFile(analysisPath, "utf8");
        const analysis = record(JSON.parse(analysisSource), "Previous exposed regression analysis must be an object");
        const analysisComparison = record(
          analysis.comparison,
          "Previous exposed regression analysis has no comparison",
        );
        const promptV5Overall = record(
          analysisComparison.promptV5Overall,
          "Previous exposed regression analysis has no promptV5Overall",
        );
        expectedTurns = expectedTurnSnapshotsFromPreviousAnalysis(promptV5Overall.diagnostics);
        expectedTurnSnapshotPath = analysisPath;
        expectedTurnSnapshotSource = analysisSource;
      } else {
        const commonComparison = record(
          artifact.commonUnchangedTurnsComparison,
          "Previous exposed regression has no common-unchanged comparison",
        );
        const current = record(
          commonComparison.current,
          "Previous exposed regression common-unchanged comparison has no current diagnostics",
        );
        expectedTurns = expectedTurnSnapshotsFromPreviousAnalysis(current.diagnostics);
        expectedTurnSnapshotPath = artifactPath;
        expectedTurnSnapshotSource = artifactSource;
      }
      return {
        artifactPath,
        artifactSource,
        report: artifact.report,
        expectedTurnSnapshotPath,
        expectedTurnSnapshotSource,
        expectedTurns,
      };
    })()
  : undefined;

const frozenAudit = restaurantSemanticHoldoutFrozenAudit();
const startedAt = new Date().toISOString();
const runId = `exposed-regression-${randomUUID()}`;
const artifactDirectory = resolve(".eval-artifacts", "restaurant-semantic-exposed-regression");
const artifactPath = resolve(artifactDirectory, `${runId}.json`);
const evaluationClassification = usesCurrentCanonicalGold
  ? {
      cohort: "EXPOSED_GOLD_ACCEPTANCE_DIAGNOSTIC",
      contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
      baselineEligible: false,
      sourceDatasetStatus: "EXPOSED",
      reason:
        `The current Gold SHA was explicitly accepted as canonical after the restaurant-semantic-prompt@4/@5 cohort. This is not a Clean Holdout and only compares to ${previousPromptVersionFor(RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.promptVersion)} on COMMON_UNCHANGED_TURNS.`,
    }
  : {
      cohort: "EXPOSED_HOLDOUT_REGRESSION",
      contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
      baselineEligible: false,
      sourceDatasetStatus: "EXPOSED",
      reason:
        "This is a paid exposed-data diagnostic against the holdout already exposed by restaurant-semantic-prompt@4. It is not and cannot become a Clean Holdout baseline.",
    };
const frozenConfiguration = {
  ...codeSnapshot,
  ...frozenAudit,
};
const datasetLineage = {
  currentDatasetSha256: datasetSha256,
  originalCleanBaselineDatasetSha256: baselineArtifact.datasetSha256,
  currentGoldStatus: usesCurrentCanonicalGold ? "CANONICAL_EXPOSED_GOLD" : "ORIGINAL_EXPOSED_GOLD",
  comparisonPolicy: usesCurrentCanonicalGold
    ? "COMMON_UNCHANGED_TURNS_ONLY"
    : "V4_BASELINE_MODEL_EVALUATED_TURNS",
};

await mkdir(artifactDirectory, { recursive: true });
await writeFile(
  artifactPath,
  JSON.stringify(
    {
      status: "STARTED",
      runId,
      startedAt,
      sourceDatasetStatus: "EXPOSED",
      datasetSha256,
      baselineArtifact: { path: baselineArtifactPath, sha256: sha256(baselineSource) },
      datasetLineage,
      ...(previousExposedRegression
        ? {
            previousExposedRegression: {
              path: previousExposedRegression.artifactPath,
              sha256: sha256(previousExposedRegression.artifactSource),
              expectedTurnSnapshotPath: previousExposedRegression.expectedTurnSnapshotPath,
              expectedTurnSnapshotSha256: sha256(previousExposedRegression.expectedTurnSnapshotSource),
            },
          }
        : {}),
      manifest: RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST,
      frozenConfiguration,
      evaluationClassification,
      preflight: { stats: preflight.stats, issues: preflight.issues },
    },
    null,
    2,
  ),
  { encoding: "utf8", flag: "wx" },
);

const invocationRecords: ModelInvocationRecord[] = [];
try {
  const gateway = DeepSeekModelGateway.fromEnvironment(process.env, {
    observer: {
      observe(record) {
        invocationRecords.push(record);
      },
    },
  });
  const report = await runRestaurantSemanticRegression(
    new RestaurantSemanticInterpreter(gateway),
    {
      mode: "REAL_MODEL_MOCK_WORLD",
      attributionLevel: "PRODUCT_SEMANTIC_ONLY",
      dataset: preflight.dataset,
    },
  );
  const manifestConformant = invocationRecords.every(
    (record) =>
      record.provider === RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.provider &&
      record.model === RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.model &&
      record.promptVersion === RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.promptVersion &&
      record.responseFormat === RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.responseFormat &&
      record.outputSchema.name === RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.proposalSchema.name &&
      record.outputSchema.version === RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.proposalSchema.version,
  );
  const baselineComparison = matchesOriginalBaselineDataset
    ? compareRestaurantSemanticExposedRegression(preflight.dataset, baselineArtifact.report, report)
    : undefined;
  const commonUnchangedTurnsComparison = previousExposedRegression
    ? compareRestaurantSemanticCommonUnchangedTurns(
        preflight.dataset,
        previousExposedRegression.report,
        report,
        previousExposedRegression.expectedTurns,
      )
    : undefined;
  const artifact = {
    status: "COMPLETED",
    runId,
    startedAt,
    completedAt: new Date().toISOString(),
    sourceDatasetStatus: "EXPOSED",
    datasetSha256,
    baselineArtifact: { path: baselineArtifactPath, sha256: sha256(baselineSource) },
    datasetLineage,
    ...(previousExposedRegression
      ? {
          previousExposedRegression: {
            path: previousExposedRegression.artifactPath,
            sha256: sha256(previousExposedRegression.artifactSource),
            expectedTurnSnapshotPath: previousExposedRegression.expectedTurnSnapshotPath,
            expectedTurnSnapshotSha256: sha256(previousExposedRegression.expectedTurnSnapshotSource),
          },
        }
      : {}),
    manifest: RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST,
    frozenConfiguration,
    evaluationClassification: {
      ...evaluationClassification,
      manifestConformant,
    },
    preflight: { stats: preflight.stats, issues: preflight.issues },
    report,
    ...(baselineComparison ? { baselineComparison } : {}),
    ...(commonUnchangedTurnsComparison ? { commonUnchangedTurnsComparison } : {}),
    modelMetrics: summarizeRealModelEval(
      invocationRecords,
      report.summary.modelEvaluatedTurns,
      configuration.pricing,
    ),
    durableRecord: {
      format: "JSON_ARTIFACT",
      purpose: "EXPOSED_HOLDOUT_PROMPT_REGRESSION_AND_FIELD_LEVEL_DELTA",
      privacy: "PRIVATE_EXPOSED_HOLDOUT_AND_STRUCTURED_RESULTS_GIT_IGNORED",
    },
  };
  await writeFile(artifactPath, JSON.stringify(artifact, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        evaluationClassification: artifact.evaluationClassification,
        report: {
          evaluatorVersion: report.evaluatorVersion,
          datasetId: report.datasetId,
          datasetVersion: report.datasetVersion,
          mode: report.mode,
          attributionLevel: report.attributionLevel,
          status: report.status,
          summary: report.summary,
        },
        ...(baselineComparison ? { baselineComparison: comparisonSummary(baselineComparison) } : {}),
        ...(commonUnchangedTurnsComparison
          ? {
              commonUnchangedTurnsComparison: commonUnchangedTurnsSummary(
                commonUnchangedTurnsComparison,
              ),
            }
          : {}),
        modelMetrics: artifact.modelMetrics,
        durableRecord: { path: artifactPath, ...artifact.durableRecord },
      },
      null,
      2,
    ),
  );
} catch (error) {
  await writeFile(
    artifactPath,
    JSON.stringify(
      {
        status: "FAILED_AFTER_START",
        runId,
        startedAt,
        failedAt: new Date().toISOString(),
        sourceDatasetStatus: "EXPOSED",
        datasetSha256,
        baselineArtifact: { path: baselineArtifactPath, sha256: sha256(baselineSource) },
        datasetLineage,
        ...(previousExposedRegression
          ? {
              previousExposedRegression: {
                path: previousExposedRegression.artifactPath,
                sha256: sha256(previousExposedRegression.artifactSource),
                expectedTurnSnapshotPath: previousExposedRegression.expectedTurnSnapshotPath,
                expectedTurnSnapshotSha256: sha256(previousExposedRegression.expectedTurnSnapshotSource),
              },
            }
          : {}),
        manifest: RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST,
        frozenConfiguration,
        evaluationClassification,
        reusableAsCleanHoldout: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
    "utf8",
  );
  throw error;
}
