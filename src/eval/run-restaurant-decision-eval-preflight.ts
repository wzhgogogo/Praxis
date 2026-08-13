import { runRestaurantDecisionEvalPreflight } from "./restaurant-decision-eval-preflight.js";
import { restaurantDecisionGoldenSeedV010 } from "./restaurant-decision-eval-seed.js";

const allowedArguments = new Set(["--require-complete"]);
const unsupportedArguments = process.argv.slice(2).filter((argument) => !allowedArguments.has(argument));
if (unsupportedArguments.length > 0) {
  throw new Error(`Unsupported arguments: ${unsupportedArguments.join(", ")}`);
}

const mode = process.argv.includes("--require-complete")
  ? "REQUIRE_COMPLETE"
  : "ANNOTATION_DRAFT";
const report = runRestaurantDecisionEvalPreflight(restaurantDecisionGoldenSeedV010, mode);

console.log(JSON.stringify(report, null, 2));

if (report.status === "INVALID" || report.status === "BLOCKED_PENDING_HUMAN_LABELS") {
  process.exitCode = 1;
}
