import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { RestaurantSemanticRegressionFixtureInterpreter } from "./fixture-interpreter.js";
import { restaurantSemanticRegression } from "./dataset.js";
import { restaurantSemanticRegressionV3 } from "./fixtures.js";
import { runRestaurantSemanticRegression } from "./regression.js";
import { compileRestaurantSemanticProposal } from "../../../domains/restaurant/semantic-compiler.js";
import { restaurantSemanticRegressionProposalFor } from "./stage-oracles.js";

test("semantic regression runs Proposal, Compiler, and Runtime/Reducer in order", async () => {
  const interpreter = new RestaurantSemanticRegressionFixtureInterpreter();

  const report = await runRestaurantSemanticRegression(interpreter, {
    mode: "FIXTURE",
    attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
    dataset: restaurantSemanticRegression,
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
  assert.equal(namedFollowup.goldGoal, "AVAILABILITY");
  assert.equal(namedFollowup.actualDraft?.target?.goal, "AVAILABILITY");
  assert.equal(namedFollowup.goalBoundary?.category, "B");
  assert.equal(restaurantSemanticRegression.sessions[2]?.turns[1]?.expectedDraft.target?.goal, "AVAILABILITY", "user approved Gold@4 at stop 3");
  assert.equal(JSON.stringify(namedFollowup.actualDraft).includes("goalBasis"), false);
  assert.ok(namedFollowup.proposal, "passing static results retain the actual proposal and basis");
  const booking = report.turns.find(turn => turn.turnId === "SR02-T01")!;
  assert.equal(booking.goalBoundary?.category, "A");
  assert.equal(booking.actualDraft?.target?.goal, "AVAILABILITY");
  assert.equal(booking.actualDraft?.date, undefined);
  assert.equal(booking.actualDraft?.timeWindow, undefined);
  const completedBooking = report.turns.find(turn => turn.turnId === "SR02-T02")!;
  assert.equal(completedBooking.actualDraft?.target?.goal, "AVAILABILITY");
  assert.equal(completedBooking.proposal && JSON.stringify(completedBooking.proposal).includes('"TARGET"'), false);
  for (const id of ["SR01-T02", "SR02-T02", "SR08-T02", "SR09-T02"]) assert.equal(report.turns.find(turn => turn.turnId === id)?.goalBoundary?.category, "CONTEXT_CARRY");
});

test("Gold@5 applies the 15 approved labels while Gold@3 and Gold@4 remain frozen", () => {
  const oldSource = readFileSync("src/eval/restaurant/semantic/fixtures.ts");
  assert.equal(createHash("sha256").update(oldSource).digest("hex"), "fa4a8e52a82806af6d507a06f4ba16426e6c28376936363c777c4e981cf3ca72");
  assert.equal(restaurantSemanticRegressionV3.sessions[2]?.turns[1]?.expectedDraft.target?.goal, "RECOMMENDATION");
  const expected = structuredClone(restaurantSemanticRegressionV3);
  expected.id = "restaurant-semantic-regression-v4";
  expected.version = "4";
  expected.sessions[2]!.turns[1]!.expectedDraft.target!.goal = "AVAILABILITY";
  const frozen4 = JSON.parse(readFileSync("src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold4.json", "utf8"));
  assert.equal(createHash("sha256").update(readFileSync("src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold4.json")).digest("hex"), "96a3dbd7c406805e31586a0a6fb472b5bb2dd7458bd3187a3413c6ed2e5f8b66");
  assert.deepEqual(frozen4, expected);
  const approved5 = structuredClone(expected);
  approved5.id = "restaurant-semantic-regression-v5";
  approved5.version = "5";
  const turn = (id: string) => approved5.sessions.flatMap(session => session.turns).find(item => item.id === id)!;
  for (const [id, texts] of [
    ["SR01-T01", ["yakiniku"]], ["SR04-T01", ["Japanese food"]], ["SR07-T01", ["Korean food"]],
    ["SR08-T01", ["sushi", "omakase"]], ["SR08-T02", ["sushi"]],
    ["SR09-T01", ["Italian food"]], ["SR09-T02", ["Italian food"]],
  ] as const) for (const text of texts) turn(id).expectedDraft.criteria.find(c => c.text === text)!.strength = "HARD";
  for (const id of ["SR05-T01", "SR08-T01", "SR08-T02", "SR09-T01", "SR09-T02"]) {
    turn(id).expectedDraft.timeWindow = { earliest: "18:00", latest: "23:00" };
  }
  turn("SR06-T01").expectedDraft.timeWindow = { earliest: "12:00", latest: "17:00" };
  turn("SR10-T01").expectedDraft.timeWindow = { earliest: "17:30", latest: "22:00" };
  assert.deepEqual(restaurantSemanticRegression, approved5, "Gold5 contains exactly the 15 user-confirmed labels, with every other field frozen");
});

test("development attribution stops at Compiler before Reducer", async () => {
  const report = await runRestaurantSemanticRegression(
    new RestaurantSemanticRegressionFixtureInterpreter(),
    {
      mode: "FIXTURE",
      attributionLevel: "DEVELOPMENT_STAGE_ORACLES",
      dataset: {
        ...restaurantSemanticRegression,
        sessions: [restaurantSemanticRegression.sessions[3]!],
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
        ...restaurantSemanticRegression,
        sessions: [restaurantSemanticRegression.sessions[0]!],
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
        ...restaurantSemanticRegression,
        sessions: [restaurantSemanticRegression.sessions[3]!],
      },
    },
  );

  assert.equal(report.turns[0]?.status, "PASS");
});
