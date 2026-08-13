import assert from "node:assert/strict";
import { test } from "node:test";

import type { RestaurantSemanticInterpretInput, RestaurantSemanticInterpretResult } from "../domains/restaurant/semantic-interpreter.js";
import type { RestaurantSemanticProposal } from "../domains/restaurant/semantic-proposal.js";
import {
  type RestaurantSemanticRegressionInterpreter,
  runRestaurantSemanticRegression,
} from "./restaurant-semantic-regression-eval.js";
import {
  type RestaurantSemanticRegressionDataset,
  restaurantSemanticRegressionV1,
} from "./restaurant-semantic-regression-fixtures.js";

class FixtureInterpreter implements RestaurantSemanticRegressionInterpreter {
  readonly inputs: RestaurantSemanticInterpretInput[] = [];

  async interpret(input: RestaurantSemanticInterpretInput): Promise<RestaurantSemanticInterpretResult> {
    this.inputs.push(input);
    const proposal = proposals[input.message];
    if (!proposal) throw new Error(`Unexpected fixture message: ${input.message}`);
    return { status: "PROPOSED", proposal, attempts: [] };
  }
}

const proposals: Record<string, RestaurantSemanticProposal> = {
  "Tomorrow between 19:00 and 19:30 in Shinjuku for two people, yakiniku under 5000 JPY per person.": {
    schemaVersion: "1",
    facts: [
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: "2026-08-06" } },
      {
        field: "TIME_WINDOW",
        operation: "ASSERT",
        value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:30" },
      },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "Shinjuku" } },
      { field: "CUISINE", operation: "ASSERT", value: { kind: "CUISINE", value: "yakiniku" } },
      {
        field: "BUDGET_PER_PERSON",
        operation: "ASSERT",
        value: { kind: "BUDGET_PER_PERSON", max: 5000, currency: "JPY" },
      },
    ],
  },
  "Actually make it three people in Shibuya, and remove yakiniku.": {
    schemaVersion: "1",
    facts: [
      { field: "PARTY_SIZE", operation: "CORRECT", value: { kind: "PARTY_SIZE", value: 3 } },
      { field: "AREA", operation: "CORRECT", value: { kind: "AREA", query: "Shibuya" } },
      { field: "CUISINE", operation: "NEGATE", value: { kind: "CUISINE", value: "yakiniku" } },
    ],
  },
};

test("v15 semantic regression runs Proposal, Compiler, Runtime/Reducer, and Kernel in order", async () => {
  const session = restaurantSemanticRegressionV1.sessions[0]!;
  const dataset: RestaurantSemanticRegressionDataset = {
    ...restaurantSemanticRegressionV1,
    sessions: [session],
  };
  const interpreter = new FixtureInterpreter();

  const report = await runRestaurantSemanticRegression(interpreter, {
    mode: "FIXTURE",
    dataset,
  });

  assert.equal(report.status, "COMPLETED");
  assert.deepEqual(report.summary, {
    totalTurns: 2,
    modelEvaluatedTurns: 2,
    passedTurns: 2,
    blockedTurns: 0,
    firstFailureStages: {},
  });
  assert.deepEqual(report.turns.map((turn) => turn.status), ["PASS", "PASS"]);
  assert.equal(interpreter.inputs[1]?.currentDraft?.partySize, 2);
  assert.equal(interpreter.inputs[1]?.currentDraft?.area?.query, "Shinjuku");
});
