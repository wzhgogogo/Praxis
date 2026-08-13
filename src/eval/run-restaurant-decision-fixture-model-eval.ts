import { RestaurantDecisionEvalModelContract } from "./restaurant-decision-eval-model-contract.js";
import {
  GoldenDecisionEvalFixtureGateway,
  runRestaurantDecisionEvalEpisodes,
} from "./restaurant-decision-eval-runner.js";
import { restaurantDecisionGoldenSeedV010 } from "./restaurant-decision-eval-seed.js";

const report = await runRestaurantDecisionEvalEpisodes(restaurantDecisionGoldenSeedV010, {
  mode: "FIXTURE_MODEL",
  modelContract: new RestaurantDecisionEvalModelContract(
    new GoldenDecisionEvalFixtureGateway(restaurantDecisionGoldenSeedV010),
  ),
});

console.log(JSON.stringify(report, null, 2));
if (
  report.status !== "COMPLETED" ||
  report.episodes.some((episode) => episode.status !== "SCORED" || episode.score?.rawJourneyPass !== true)
) {
  process.exitCode = 1;
}
