import assert from "node:assert/strict";
import test from "node:test";

import { runLocalSearchFixtureEval } from "./eval.js";

test("local fixture Search Eval covers full intent, clarification, and selection", async () => {
  const result = await runLocalSearchFixtureEval();

  assert.equal(result.mode, "FIXTURE");
  assert.equal(result.cases, 3);
  assert.equal(result.passed, 3);
  assert.deepEqual(result.failedCaseIds, []);
});
