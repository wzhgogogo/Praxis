import assert from "node:assert/strict";
import { test } from "node:test";

import { RestaurantSemanticRegressionFixtureInterpreter } from "./fixture-interpreter.js";
import { restaurantSemanticRegressionV3 } from "./fixtures.js";
import { runRestaurantSemanticRegression } from "./regression.js";
import { compileRestaurantSemanticProposal } from "../../../domains/restaurant/semantic-compiler.js";
import { restaurantSemanticRegressionProposalFor } from "./stage-oracles.js";

test("semantic regression runs Proposal, Compiler, and Runtime/Reducer in order", async () => {
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
  assert.equal(report.evaluatorVersion, "4");
  assert.equal(report.turns.every(turn => turn.goalBoundary?.status === "SATISFIED"), true);
  const namedFollowup = report.turns.find(turn => turn.turnId === "SR03-T02")!;
  assert.equal(namedFollowup.oldGoldGoal, "RECOMMENDATION");
  assert.equal(namedFollowup.actualDraft?.target?.goal, "AVAILABILITY");
  assert.equal(namedFollowup.goalBoundary?.category, "B");
  assert.equal(restaurantSemanticRegressionV3.sessions[2]?.turns[1]?.expectedDraft.target?.goal, "RECOMMENDATION", "old Gold remains frozen for stop 3");
  assert.equal(JSON.stringify(namedFollowup.actualDraft).includes("goalBasis"), false);
  assert.ok(namedFollowup.proposal, "passing static results retain the actual proposal and basis");
  for (const id of ["SR01-T02", "SR08-T02", "SR09-T02"]) assert.equal(report.turns.find(turn => turn.turnId === id)?.goalBoundary?.category, "CONTEXT_CARRY");
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
