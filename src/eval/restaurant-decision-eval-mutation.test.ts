import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  DecisionEvalDataset,
  DecisionEvalEpisode,
  DecisionEvalTurnPrediction,
  RecommendationCandidatePool,
} from "./restaurant-decision-eval-contract.js";
import { runRestaurantDecisionEvalPreflight } from "./restaurant-decision-eval-preflight.js";
import {
  predictionFromGolden,
  scoreDecisionEpisode,
  type DecisionEvalStageId,
  type DecisionEvalTurnScore,
} from "./restaurant-decision-eval-scorer.js";
import { restaurantDecisionGoldenSeedV010 } from "./restaurant-decision-eval-seed.js";

function clonedDataset(): DecisionEvalDataset {
  return structuredClone(restaurantDecisionGoldenSeedV010);
}

function episodeById(dataset: DecisionEvalDataset, episodeId: string): DecisionEvalEpisode {
  const episode = dataset.episodes.find((item) => item.id === episodeId);
  assert.ok(episode !== undefined, `missing episode ${episodeId}`);
  return episode;
}

function poolFor(dataset: DecisionEvalDataset, episode: DecisionEvalEpisode): RecommendationCandidatePool {
  assert.ok(episode.candidatePoolRef !== undefined, `${episode.id} requires a candidate pool`);
  const pool = dataset.candidatePools.find((item) => item.id === episode.candidatePoolRef);
  assert.ok(pool !== undefined, `missing pool ${episode.candidatePoolRef}`);
  return pool;
}

function predictionsFromEpisode(episode: DecisionEvalEpisode): Map<string, DecisionEvalTurnPrediction> {
  return new Map(
    episode.turns.map((turn) => {
      assert.ok(turn.expected.annotationStatus === "LABELED");
      return [turn.id, predictionFromGolden(turn.expected)];
    }),
  );
}

function scoreTurn(
  dataset: DecisionEvalDataset,
  episode: DecisionEvalEpisode,
  predictions: ReadonlyMap<string, DecisionEvalTurnPrediction>,
  turnIndex: number,
): DecisionEvalTurnScore {
  const turn = scoreDecisionEpisode(episode, predictions, poolFor(dataset, episode)).turns[turnIndex];
  assert.ok(turn !== undefined, `missing scored turn ${turnIndex}`);
  return turn;
}

function assertFirstFailure(
  mutationId: string,
  turn: DecisionEvalTurnScore,
  stage: DecisionEvalStageId,
  errorCodes: string[],
): void {
  assert.equal(turn.firstFailureStage, stage, mutationId);
  assert.deepEqual(turn.firstFailureCodes, errorCodes, mutationId);
}

test("M01 S0 rejects an invalid candidate-pool identifier before scoring", () => {
  const dataset = clonedDataset();
  const pool = dataset.candidatePools[0];
  assert.ok(pool !== undefined);
  pool.id = "";

  const report = runRestaurantDecisionEvalPreflight(dataset, "REQUIRE_COMPLETE");
  assert.equal(report.status, "INVALID");
  assert.equal(report.issues.some((issue) => issue.rule === "IDENTIFIER"), true);
});

test("M02 S0 rejects an allergy disclosure without the candidate attributes evidence", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS06-e3-friends-correction-allergy");
  const turn = episode.turns[2];
  assert.ok(turn?.expected.annotationStatus === "LABELED");
  const disclosure = turn.expected.grounding?.requiredCandidateDisclosures?.[0];
  assert.ok(disclosure !== undefined);
  disclosure.factRef = "flex-friends-kappo-haru.area";

  const report = runRestaurantDecisionEvalPreflight(dataset, "REQUIRE_COMPLETE");
  assert.equal(report.status, "INVALID");
  assert.equal(report.issues.some((issue) => issue.rule === "ALLERGY_DISCLOSURE_EVIDENCE"), true);
});

test("M03 S1 attributes an invented state fact to extraction", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS04-e2-team-izakaya");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS04-T03");
  assert.ok(prediction !== undefined);
  prediction.statePatch = {
    add: {
      preferences: [
        { facet: "VIBE", value: "QUIET", polarity: "PREFER" },
        { facet: "VIBE", value: "INTIMATE", polarity: "PREFER" },
      ],
    },
  };

  assertFirstFailure(
    "M03",
    scoreTurn(dataset, episode, predictions, 2),
    "S1_STATE_EXTRACTION",
    ["STATE_PATCH_MISMATCH"],
  );
});

test("M04 S2 attributes an inconsistent Gold accumulated state to the reducer", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const turn = episode.turns[0];
  assert.ok(turn?.expected.annotationStatus === "LABELED");
  turn.expected.accumulatedState.party = { min: 5, max: 5, precision: "EXACT" };
  const predictions = predictionsFromEpisode(episode);

  assertFirstFailure(
    "M04",
    scoreTurn(dataset, episode, predictions, 0),
    "S2_STATE_ACCUMULATION",
    ["GOLD_REDUCER_MISMATCH"],
  );
});

test("M05 S3 attributes a wrong readiness label to readiness", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction !== undefined);
  prediction.readiness = "NOT_READY";

  assertFirstFailure(
    "M05",
    scoreTurn(dataset, episode, predictions, 0),
    "S3_READINESS",
    ["READINESS_MISMATCH"],
  );
});

test("M06 S4 attributes an invalid next action to routing", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction !== undefined);
  prediction.nextAction = { type: "CHECK_AVAILABILITY" };

  assertFirstFailure(
    "M06",
    scoreTurn(dataset, episode, predictions, 0),
    "S4_ACTION_ROUTING",
    ["ACTION_TYPE_NOT_ACCEPTABLE"],
  );
});

test("M07 S5 attributes a repeated core question to clarification", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS05-e3-date-ebisu");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS05-T02");
  assert.ok(prediction !== undefined);
  prediction.nextAction = { type: "ASK_CORE_FIELD", topics: ["DATE"] };

  assertFirstFailure(
    "M07",
    scoreTurn(dataset, episode, predictions, 1),
    "S5_CLARIFICATION",
    ["CLARIFICATION_TOPIC_NOT_ALLOWED", "CLARIFICATION_TOPIC_REPEATED"],
  );
});

test("M08 S6 attributes a missing eligible candidate to retrieval", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction?.retrievedCandidateIds !== undefined);
  prediction.retrievedCandidateIds.pop();

  assertFirstFailure(
    "M08",
    scoreTurn(dataset, episode, predictions, 0),
    "S6_CANDIDATE_RETRIEVAL",
    ["CANDIDATE_RETRIEVAL_MISSING_ELIGIBLE"],
  );
});

test("M09 S6 attributes an unrelated candidate to retrieval", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction?.retrievedCandidateIds !== undefined);
  prediction.retrievedCandidateIds.push("ginza-japanese-kappo-mizu");

  assertFirstFailure(
    "M09",
    scoreTurn(dataset, episode, predictions, 0),
    "S6_CANDIDATE_RETRIEVAL",
    ["CANDIDATE_RETRIEVAL_UNEXPECTED_CANDIDATE"],
  );
});

test("M10 S6 emits P0 when retrieval includes a candidate that explicitly rejects the allergy", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS06-e3-friends-correction-allergy");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS06-T03");
  assert.ok(prediction?.retrievedCandidateIds !== undefined);
  prediction.retrievedCandidateIds.push("flex-friends-yakitori-matsu");

  assertFirstFailure(
    "M10",
    scoreTurn(dataset, episode, predictions, 2),
    "S6_CANDIDATE_RETRIEVAL",
    ["CANDIDATE_RETRIEVAL_UNEXPECTED_CANDIDATE", "P0_HARD_CONSTRAINT_VIOLATION"],
  );
});

test("M11 S7 attributes a too-short otherwise diverse recommendation to selection", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction?.recommendation !== undefined);
  prediction.recommendation.candidateIds = [
    "ginza-western-bistro-lune",
    "ginza-western-table-ember",
  ];

  assertFirstFailure(
    "M11",
    scoreTurn(dataset, episode, predictions, 0),
    "S7_SELECTION_DIVERSITY",
    ["RECOMMENDATION_CANDIDATE_COUNT"],
  );
});

test("M12 S7 attributes selection outside the retrieved set to selection", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction?.recommendation !== undefined);
  prediction.recommendation.candidateIds = [
    "ginza-western-bistro-lune",
    "ginza-western-table-ember",
    "ginza-japanese-kappo-mizu",
  ];

  assertFirstFailure(
    "M12",
    scoreTurn(dataset, episode, predictions, 0),
    "S7_SELECTION_DIVERSITY",
    [
      "RECOMMENDATION_NOT_ALLOWED",
      "RECOMMENDATION_FORBIDDEN_CANDIDATE",
      "RECOMMENDATION_NOT_RETRIEVED",
    ],
  );
});

test("M13 S7 identifies a fixture diversity gap before blaming a valid selection", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS04-e2-team-izakaya");
  const pool = poolFor(dataset, episode);
  const hachi = pool.candidates.find((candidate) => candidate.id === "shimbashi-izakaya-hachi");
  assert.ok(hachi !== undefined);
  hachi.chainType = "INDEPENDENT";
  const predictions = predictionsFromEpisode(episode);

  assertFirstFailure(
    "M13",
    scoreTurn(dataset, episode, predictions, 1),
    "S7_SELECTION_DIVERSITY",
    ["FIXTURE_COVERAGE_GAP"],
  );
});

test("M14 S8 rejects a state fact that was not in the supplied context", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction?.grounding !== undefined);
  prediction.grounding.stateFactRefs.push("state.invented");

  assertFirstFailure(
    "M14",
    scoreTurn(dataset, episode, predictions, 0),
    "S8_RESPONSE_GROUNDING",
    ["PROCESS_GROUNDING_UNSUPPORTED_STATE_FACT"],
  );
});

test("M15 S8 rejects a candidate fact that was not supplied for this result", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction?.grounding !== undefined);
  prediction.grounding.candidateFactRefs.push("ginza-japanese-kappo-mizu.area");

  assertFirstFailure(
    "M15",
    scoreTurn(dataset, episode, predictions, 0),
    "S8_RESPONSE_GROUNDING",
    ["RESULT_GROUNDING_UNSUPPORTED_CANDIDATE_FACT"],
  );
});

test("M16 S8 rejects a forbidden availability claim", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction?.grounding !== undefined);
  prediction.grounding.claimLabels.push("availability is guaranteed");

  assertFirstFailure(
    "M16",
    scoreTurn(dataset, episode, predictions, 0),
    "S8_RESPONSE_GROUNDING",
    ["RESULT_GROUNDING_FORBIDDEN_CLAIM"],
  );
});

test("M17 S8 requires every approved allergy candidate card to disclose confirmation", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS06-e3-friends-correction-allergy");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS06-T03");
  assert.ok(prediction?.grounding !== undefined);
  prediction.grounding.candidateDisclosures = prediction.grounding.candidateDisclosures.slice(1);

  assertFirstFailure(
    "M17",
    scoreTurn(dataset, episode, predictions, 2),
    "S8_RESPONSE_GROUNDING",
    ["RESULT_GROUNDING_REQUIRED_DISCLOSURE_MISSING"],
  );
});

test("M18 S8 rejects duplicate state evidence even when the fact is allowed", () => {
  const dataset = clonedDataset();
  const episode = episodeById(dataset, "DGS01-e1-category-ginza-western");
  const predictions = predictionsFromEpisode(episode);
  const prediction = predictions.get("DGS01-T01");
  assert.ok(prediction?.grounding !== undefined);
  prediction.grounding.stateFactRefs.push("state.time");

  assertFirstFailure(
    "M18",
    scoreTurn(dataset, episode, predictions, 0),
    "S8_RESPONSE_GROUNDING",
    ["PROCESS_GROUNDING_DUPLICATE_STATE_FACT"],
  );
});
