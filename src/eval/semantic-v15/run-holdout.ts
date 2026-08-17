import { createHash } from "node:crypto";
import { mkdir, open, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ModelInvocationRecord } from "../../core/model/contracts.js";
import { RestaurantSemanticInterpreter } from "../../domains/restaurant/semantic-interpreter.js";
import { DeepSeekModelGateway } from "../../infrastructure/deepseek/deepseek-model-gateway.js";
import {
  RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST,
  loadRestaurantSemanticHoldout,
  restaurantSemanticHoldoutTurnCount,
} from "./holdout.js";
import { runRestaurantSemanticRegression } from "./regression.js";
import {
  requireRealModelEvalConfiguration,
  summarizeRealModelEval,
} from "../shared/real-model.js";

const preflight = await loadRestaurantSemanticHoldout(undefined, "REQUIRE_COMPLETE");
if (preflight.status !== "READY_FOR_BASELINE" || !preflight.dataset) {
  throw new Error(`Holdout preflight failed:\n${JSON.stringify(preflight.issues, null, 2)}`);
}
if (process.env.PRAXIS_CONFIRM_CLEAN_HOLDOUT !== "1") {
  throw new Error(
    "PRAXIS_CONFIRM_CLEAN_HOLDOUT=1 is required to confirm the private dataset is still unseen by Prompt development",
  );
}
if (process.env.DEEPSEEK_MODEL !== RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.model) {
  throw new Error(
    `DEEPSEEK_MODEL must remain ${RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST.model} for this frozen baseline`,
  );
}

const turnCount = restaurantSemanticHoldoutTurnCount(preflight.dataset);
const configuration = requireRealModelEvalConfiguration(process.env, turnCount);
if (configuration.caseLimit !== turnCount) {
  throw new Error(
    `v15 Semantic Holdout requires exactly ${turnCount} turns. ` +
      `Set PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=${turnCount} or omit it.`,
  );
}

const datasetSource = await readFile(preflight.datasetPath, "utf8");
const datasetSha256 = createHash("sha256").update(datasetSource).digest("hex");
const artifactDirectory = resolve(".eval-artifacts", "restaurant-semantic-holdout");
const artifactPath = resolve(
  artifactDirectory,
  `${preflight.dataset.id}-v${preflight.dataset.version}-baseline.json`,
);
await mkdir(artifactDirectory, { recursive: true });

let lock;
try {
  lock = await open(artifactPath, "wx");
} catch (error) {
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  if (code === "EEXIST") {
    throw new Error(
      `This Holdout version already has a run record at ${artifactPath}. ` +
        "Do not rerun it as CLEAN_HOLDOUT; create a new unseen dataset version.",
    );
  }
  throw error;
}
await lock.writeFile(
  JSON.stringify(
    {
      status: "STARTED",
      startedAt: new Date().toISOString(),
      datasetSha256,
      manifest: RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST,
      preflight: { stats: preflight.stats, issues: preflight.issues },
    },
    null,
    2,
  ),
  "utf8",
);
await lock.close();

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
  const evaluationClassification = {
    cohort: "HOLDOUT_BASELINE",
    contaminationStatus: "CLEAN_HOLDOUT",
    baselineEligible: manifestConformant,
    postRunStatus: "RESULT_EXPOSED",
    reusableAsCleanHoldout: false,
    reason: manifestConformant
      ? "The first run used the frozen v15 manifest and the private Holdout had passed complete preflight."
      : "At least one recorded model invocation did not conform to the frozen manifest.",
  } as const;
  const artifact = {
    status: "COMPLETED",
    startedAt: JSON.parse(await readFile(artifactPath, "utf8")).startedAt as unknown,
    completedAt: new Date().toISOString(),
    datasetSha256,
    manifest: RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST,
    evaluationClassification,
    preflight: { stats: preflight.stats, issues: preflight.issues },
    report,
    modelMetrics: summarizeRealModelEval(
      invocationRecords,
      report.summary.modelEvaluatedTurns,
      configuration.pricing,
    ),
  };
  await writeFile(artifactPath, JSON.stringify(artifact, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        evaluationClassification,
        report: {
          evaluatorVersion: report.evaluatorVersion,
          datasetId: report.datasetId,
          datasetVersion: report.datasetVersion,
          mode: report.mode,
          status: report.status,
          summary: report.summary,
        },
        modelMetrics: artifact.modelMetrics,
        baselineRecord: {
          format: "JSON",
          path: artifactPath,
          datasetSha256,
          privacy: "PRIVATE_HOLDOUT_AND_STRUCTURED_RESULTS_GIT_IGNORED",
        },
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
        failedAt: new Date().toISOString(),
        datasetSha256,
        manifest: RESTAURANT_SEMANTIC_HOLDOUT_MANIFEST,
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
