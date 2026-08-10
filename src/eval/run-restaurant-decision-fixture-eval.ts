import { runRestaurantDecisionEvalPreflight } from "./restaurant-decision-eval-preflight.js";
import { evaluateDecisionFixtureOracle } from "./restaurant-decision-eval-scorer.js";
import { restaurantDecisionGoldenSeedV07 } from "./restaurant-decision-eval-seed.js";

const preflight = runRestaurantDecisionEvalPreflight(
  restaurantDecisionGoldenSeedV07,
  "REQUIRE_COMPLETE",
);
if (preflight.status !== "READY_FOR_EVALUATOR") {
  console.error(JSON.stringify(preflight, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        preflight,
        evaluation: evaluateDecisionFixtureOracle(restaurantDecisionGoldenSeedV07),
      },
      null,
      2,
    ),
  );
}
