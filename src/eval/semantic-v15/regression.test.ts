import assert from "node:assert/strict";
import { test } from "node:test";

import { RestaurantSemanticRegressionFixtureInterpreter } from "./fixture-interpreter.js";
import { restaurantSemanticRegressionV1 } from "./fixtures.js";
import { runRestaurantSemanticRegression } from "./regression.js";

test("v15 semantic regression runs Proposal, Compiler, Runtime/Reducer, and Kernel in order", async () => {
  const interpreter = new RestaurantSemanticRegressionFixtureInterpreter();

  const report = await runRestaurantSemanticRegression(interpreter, {
    mode: "FIXTURE",
    dataset: restaurantSemanticRegressionV1,
  });

  assert.equal(report.status, "COMPLETED");
  assert.deepEqual(report.summary, {
    totalTurns: 7,
    modelEvaluatedTurns: 7,
    passedTurns: 7,
    blockedTurns: 0,
    firstFailureStages: {},
  });
  assert.deepEqual(report.turns.map((turn) => turn.status), Array(7).fill("PASS"));
  assert.equal(interpreter.inputs[1]?.currentDraft?.partySize, 2);
  assert.equal(interpreter.inputs[1]?.currentDraft?.area?.query, "Shinjuku");
});
