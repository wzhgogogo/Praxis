import { runLocalSearchFixtureEval } from "./local-search-eval.js";

const result = await runLocalSearchFixtureEval();
console.log(JSON.stringify(result, null, 2));
if (result.failedCaseIds.length > 0) {
  process.exitCode = 1;
}
