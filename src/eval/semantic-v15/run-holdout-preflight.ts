import { loadRestaurantSemanticHoldout } from "./holdout.js";

const requireComplete = process.argv.includes("--require-complete");
const report = await loadRestaurantSemanticHoldout(
  undefined,
  requireComplete ? "REQUIRE_COMPLETE" : "DRAFT",
);

console.log(
  JSON.stringify(
    {
      preflightVersion: report.preflightVersion,
      mode: report.mode,
      status: report.status,
      datasetPath: report.datasetPath,
      stats: report.stats,
      issues: report.issues,
    },
    null,
    2,
  ),
);

if (report.status === "NOT_READY") process.exitCode = 1;
