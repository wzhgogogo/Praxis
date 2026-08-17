import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ModelInvocationRecord } from "../../core/model/contracts.js";
import { RestaurantSemanticInterpreter } from "../../domains/restaurant/semantic-interpreter.js";
import { DeepSeekModelGateway } from "../../infrastructure/deepseek/deepseek-model-gateway.js";
import {
  restaurantSemanticRegressionTurnCount,
  restaurantSemanticRegressionV1,
} from "./fixtures.js";
import { runRestaurantSemanticRegression } from "./regression.js";
import {
  requireRealModelEvalConfiguration,
  summarizeRealModelEval,
} from "../shared/real-model.js";

const configuration = requireRealModelEvalConfiguration(
  process.env,
  restaurantSemanticRegressionTurnCount,
);
if (configuration.caseLimit !== restaurantSemanticRegressionTurnCount) {
  throw new Error(
    `v15 Semantic Regression requires exactly ${restaurantSemanticRegressionTurnCount} turns. ` +
      `Set PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=${restaurantSemanticRegressionTurnCount} or omit it.`,
  );
}

const invocationRecords: ModelInvocationRecord[] = [];
const gateway = DeepSeekModelGateway.fromEnvironment(process.env, {
  observer: {
    observe(record) {
      invocationRecords.push(record);
    },
  },
});
const report = await runRestaurantSemanticRegression(
  new RestaurantSemanticInterpreter(gateway),
  { mode: "REAL_MODEL_MOCK_WORLD", dataset: restaurantSemanticRegressionV1 },
);
const evaluationClassification = {
  cohort: "DEVELOPMENT_DIAGNOSTIC",
  contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
  baselineEligible: false,
  reason:
    "The static v15 Semantic Regression labels are used for current architecture and prompt development.",
} as const;
const artifactDirectory = resolve(".eval-artifacts", "restaurant-semantic");
const artifactPath = resolve(
  artifactDirectory,
  `${new Date().toISOString().replace(/[:.]/g, "-")}-v15-semantic-regression.json`,
);
await mkdir(artifactDirectory, { recursive: true });
await writeFile(
  artifactPath,
  JSON.stringify({ evaluationClassification, report }, null, 2),
  "utf8",
);

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
      modelMetrics: summarizeRealModelEval(
        invocationRecords,
        report.summary.modelEvaluatedTurns,
        configuration.pricing,
      ),
      diagnosticLog: {
        format: "JSON",
        path: artifactPath,
        privacy: "STATIC_V15_REGRESSION_PROPOSALS_ONLY",
      },
    },
    null,
  ),
);
