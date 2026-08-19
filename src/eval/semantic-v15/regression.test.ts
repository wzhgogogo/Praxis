import assert from "node:assert/strict";
import { test } from "node:test";

import { RestaurantSemanticRegressionFixtureInterpreter } from "./fixture-interpreter.js";
import { restaurantSemanticRegressionV3 } from "./fixtures.js";
import { runRestaurantSemanticRegression } from "./regression.js";
import { compileRestaurantSemanticProposal } from "../../domains/restaurant/semantic-compiler.js";
import { restaurantSemanticRegressionProposalFor } from "./stage-oracles.js";

test("v18 semantic regression runs Proposal, Compiler, and Runtime/Reducer in order", async () => {
  const interpreter = new RestaurantSemanticRegressionFixtureInterpreter();

  const report = await runRestaurantSemanticRegression(interpreter, {
    mode: "FIXTURE",
    attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
    dataset: restaurantSemanticRegressionV3,
  });

  assert.equal(report.status, "COMPLETED");
  assert.equal(report.attributionLevel, "DEVELOPMENT_STAGE_ORACLES");
  assert.deepEqual(report.summary, {
    totalTurns: 15,
    modelEvaluatedTurns: 15,
    passedTurns: 15,
    blockedTurns: 0,
    firstFailureStages: {},
  });
  assert.deepEqual(report.turns.map((turn) => turn.status), Array(15).fill("PASS"));
  assert.equal(interpreter.inputs[1]?.currentDraft?.partySize, 2);
  assert.equal(interpreter.inputs[1]?.currentDraft?.area?.query, "Shinjuku");
});

test("development attribution stops at Compiler before Reducer", async () => {
  const report = await runRestaurantSemanticRegression(
    new RestaurantSemanticRegressionFixtureInterpreter(),
    {
      mode: "FIXTURE",
      attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
      dataset: {
        ...restaurantSemanticRegressionV3,
        sessions: [restaurantSemanticRegressionV3.sessions[3]!],
      },
      dependencies: {
        compile(proposal) {
          const compiled = compileRestaurantSemanticProposal(proposal);
          return compiled.status === "COMPILED"
            ? { status: "COMPILED", patch: { ...compiled.patch, partySize: 99 } }
            : compiled;
        },
      },
    },
  );
  assert.equal(report.turns[0]?.firstFailureStage, "COMPILER");
});

test("development attribution stops at the semantic reducer boundary", async () => {
  const report = await runRestaurantSemanticRegression(
    new RestaurantSemanticRegressionFixtureInterpreter(),
    {
      mode: "FIXTURE",
      attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
      dataset: {
        ...restaurantSemanticRegressionV3,
        sessions: [restaurantSemanticRegressionV3.sessions[3]!],
      },
    },
  );
  assert.equal(report.turns[0]?.status, "PASS");
});

test("invalid model JSON is attributed to Proposal Contract and blocks downstream turns", async () => {
  const report = await runRestaurantSemanticRegression(
    {
      async interpret() {
        return {
          status: "INVALID_MODEL_OUTPUT" as const,
          errors: ["Model response is not valid JSON"],
          fallback: "STRUCTURED_FORM" as const,
          attempts: [],
        };
      },
    },
    {
      mode: "FIXTURE",
      attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
      dataset: {
        ...restaurantSemanticRegressionV3,
        sessions: [restaurantSemanticRegressionV3.sessions[0]!],
      },
    },
  );

  assert.equal(report.turns[0]?.firstFailureStage, "SEMANTIC_PROPOSAL_CONTRACT");
  assert.equal(report.turns[1]?.status, "BLOCKED_BY_UPSTREAM");
  assert.deepEqual(report.summary.firstFailureStages, { SEMANTIC_PROPOSAL_CONTRACT: 1 });
});

test("development attribution accepts a semantically equivalent Proposal with reordered facts", async () => {
  const report = await runRestaurantSemanticRegression(
    {
      async interpret(input) {
        const proposal = restaurantSemanticRegressionProposalFor(input.message);
        if (!proposal) throw new Error("Unexpected regression message");
        return {
          status: "PROPOSED" as const,
          proposal: { ...proposal, facts: [...proposal.facts].reverse() },
          attempts: [],
        };
      },
    },
    {
      mode: "FIXTURE",
      attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
      dataset: {
        ...restaurantSemanticRegressionV3,
        sessions: [restaurantSemanticRegressionV3.sessions[3]!],
      },
    },
  );

  assert.equal(report.turns[0]?.status, "PASS");
});
