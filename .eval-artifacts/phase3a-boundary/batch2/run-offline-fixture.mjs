import { writeFileSync } from "node:fs";
import { RestaurantSemanticRegressionFixtureInterpreter } from "../../../src/eval/restaurant/semantic/fixture-interpreter.ts";
import { restaurantSemanticRegressionV3 } from "../../../src/eval/restaurant/semantic/fixtures.ts";
import { runRestaurantSemanticRegression } from "../../../src/eval/restaurant/semantic/regression.ts";

const report = await runRestaurantSemanticRegression(new RestaurantSemanticRegressionFixtureInterpreter(), {
  mode: "FIXTURE", attributionLevel: "DEVELOPMENT_STAGE_ORACLES", dataset: restaurantSemanticRegressionV3,
});
writeFileSync(new URL("semantic-fixture-execution-r2.json", import.meta.url), JSON.stringify({
  evidenceStatus: "exposed development / offline fixture / not Clean Baseline", realModelCalls: 0, report,
}, null, 2) + "\n");
console.log(JSON.stringify(report.summary));
if (report.summary.passedTurns !== report.summary.totalTurns) process.exitCode = 1;
