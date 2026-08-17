import { RestaurantSemanticRegressionFixtureInterpreter } from "./fixture-interpreter.js";
import { restaurantSemanticRegressionV1 } from "./fixtures.js";
import { runRestaurantSemanticRegression } from "./regression.js";

const report = await runRestaurantSemanticRegression(
  new RestaurantSemanticRegressionFixtureInterpreter(),
  {
    mode: "FIXTURE",
    attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
    dataset: restaurantSemanticRegressionV1,
  },
);

console.log(
  JSON.stringify(
    {
      evaluationClassification: {
        cohort: "DEVELOPMENT_DIAGNOSTIC",
        contaminationStatus: "PROMPT_AND_RESULT_EXPOSED",
        baselineEligible: false,
      },
      report: {
        evaluatorVersion: report.evaluatorVersion,
        datasetId: report.datasetId,
        datasetVersion: report.datasetVersion,
        mode: report.mode,
        attributionLevel: report.attributionLevel,
        status: report.status,
        summary: report.summary,
      },
    },
    null,
    2,
  ),
);

if (report.summary.passedTurns !== report.summary.totalTurns) process.exitCode = 1;
