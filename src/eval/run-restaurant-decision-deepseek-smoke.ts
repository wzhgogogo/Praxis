import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ModelInvocationRecord } from "../core/model/contracts.js";
import { DeepSeekModelGateway } from "../infrastructure/deepseek/deepseek-model-gateway.js";
import {
  RestaurantDecisionEvalModelContract,
  type DecisionEvalModelCompletionDiagnostic,
} from "./restaurant-decision-eval-model-contract.js";
import {
  runRestaurantDecisionEvalEpisodes,
  type DecisionEvalTurnDiagnostic,
} from "./restaurant-decision-eval-runner.js";
import { renderRestaurantDecisionEvalDiagnosticLog } from "./restaurant-decision-eval-diagnostic-log.js";
import { restaurantDecisionGoldenSeedV010 } from "./restaurant-decision-eval-seed.js";
import {
  requireRealModelEvalConfiguration,
  summarizeRealModelEval,
} from "./real-model-eval.js";

const smokeEpisodeIds = [
  "DGS01-e1-category-ginza-western",
  "DGS03-e2-restaurant-sora-dining",
  "DGS05-e3-date-ebisu",
] as const;
const fullRegressionEpisodeIds = restaurantDecisionGoldenSeedV010.episodes
  .filter((episode) => episode.split === "REGRESSION")
  .map((episode) => episode.id);
const requestedScope = process.env.PRAXIS_DECISION_EVAL_SCOPE ?? "SMOKE";
if (requestedScope !== "SMOKE" && requestedScope !== "FULL_REGRESSION") {
  throw new Error(
    "PRAXIS_DECISION_EVAL_SCOPE must be SMOKE (the default) or FULL_REGRESSION",
  );
}
const episodeIds = requestedScope === "SMOKE" ? smokeEpisodeIds : fullRegressionEpisodeIds;
const selectedEpisodeIdSet = new Set<string>(episodeIds);
const selectedTurnCount = restaurantDecisionGoldenSeedV010.episodes
  .filter((episode) => selectedEpisodeIdSet.has(episode.id))
  .reduce((total, episode) => total + episode.turns.length, 0);
/**
 * Every current Golden Seed is a Regression sample. The default Smoke uses
 * three repeatedly inspected examples; FULL_REGRESSION runs all of them.
 * Neither scope can be presented as an independent quality baseline or holdout.
 */
const evaluationClassification = {
  scope: requestedScope,
  selectedEpisodeCount: episodeIds.length,
  cohort: "DEVELOPMENT_DIAGNOSTIC",
  contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
  baselineEligible: false,
  reason: requestedScope === "SMOKE"
    ? "DGS01/DGS03/DGS05 and their observed outputs were used to tune Prompt v1-v5; prompt rules now include facts derived from these cases."
    : "Every current Golden Seed is a Regression sample whose labels or results are visible to the prompt-development process.",
} as const;
const configuration = requireRealModelEvalConfiguration(process.env, episodeIds.length);
const showCompletionDiagnostics = process.env.PRAXIS_EVAL_SHOW_COMPLETIONS === "1";
if (configuration.caseLimit !== episodeIds.length) {
  throw new Error(
    `Progressive Decision ${requestedScope} requires exactly ${episodeIds.length} Episodes. Set PRAXIS_LIVE_MODEL_EVAL_CASE_LIMIT=${episodeIds.length} or omit it.`,
  );
}

const invocationRecords: ModelInvocationRecord[] = [];
const completionDiagnostics: DecisionEvalModelCompletionDiagnostic[] = [];
const turnDiagnostics: DecisionEvalTurnDiagnostic[] = [];
const gateway = DeepSeekModelGateway.fromEnvironment(process.env, {
  observer: {
    observe(record) {
      invocationRecords.push(record);
    },
  },
});
const report = await runRestaurantDecisionEvalEpisodes(restaurantDecisionGoldenSeedV010, {
  mode: "REAL_MODEL_MOCK_WORLD",
  modelContract: new RestaurantDecisionEvalModelContract(
    gateway,
    showCompletionDiagnostics
      ? { onCompletionDiagnostic: (diagnostic) => completionDiagnostics.push(diagnostic) }
      : {},
  ),
  episodeIds,
  onTurnDiagnostic(diagnostic) {
    turnDiagnostics.push(diagnostic);
  },
});

if (restaurantDecisionGoldenSeedV010.episodes.some((episode) => episode.split !== "REGRESSION")) {
  throw new Error("Refusing to persist a diagnostic artifact for a non-Regression decision Eval episode");
}
const diagnosticDirectory = resolve(".eval-artifacts", "restaurant-decision");
const diagnosticLogPath = resolve(
  diagnosticDirectory,
  `${new Date().toISOString().replace(/[:.]/g, "-")}-${requestedScope.toLowerCase()}.md`,
);
await mkdir(diagnosticDirectory, { recursive: true });
await writeFile(
  diagnosticLogPath,
  renderRestaurantDecisionEvalDiagnosticLog(report, turnDiagnostics, {
    generatedAt: new Date().toISOString(),
    classification: evaluationClassification,
  }),
  "utf8",
);

console.log(
  JSON.stringify(
    {
      evaluationClassification,
      report,
      modelMetrics: summarizeRealModelEval(
        invocationRecords,
        selectedTurnCount,
        configuration.pricing,
      ),
      diagnosticLog: {
        format: "MARKDOWN",
        path: diagnosticLogPath,
        privacy: "STATIC_GOLDEN_REGRESSION_STRUCTURED_PROPOSALS_ONLY",
      },
      ...(showCompletionDiagnostics
        ? {
            completionDiagnostics: {
              scope: "EPHEMERAL_STDOUT_STATIC_GOLDEN_FIXTURE_ONLY",
              entries: completionDiagnostics,
            },
          }
        : {}),
    },
    null,
    2,
  ),
);

if (report.status !== "COMPLETED" || report.episodes.some((episode) => episode.status !== "SCORED")) {
  process.exitCode = 1;
}
