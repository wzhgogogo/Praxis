import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  DecisionEvalEpisode,
  DecisionEvalTurnPrediction,
  DecisionState,
  RecommendationCandidatePool,
} from "./restaurant-decision-eval-contract.js";
import { applyDecisionStatePatch } from "./restaurant-decision-eval-reducer.js";
import {
  predictionFromGolden,
  scoreDecisionEpisode,
} from "./restaurant-decision-eval-scorer.js";
import { restaurantDecisionGoldenSeedV07 } from "./restaurant-decision-eval-seed.js";

function episodeById(episodeId: string): DecisionEvalEpisode {
  const episode = restaurantDecisionGoldenSeedV07.episodes.find((item) => item.id === episodeId);
  assert.ok(episode !== undefined, `missing episode ${episodeId}`);
  return episode;
}

function poolFor(episode: DecisionEvalEpisode): RecommendationCandidatePool {
  assert.ok(episode.candidatePoolRef !== undefined, `${episode.id} requires a candidate pool`);
  const pool = restaurantDecisionGoldenSeedV07.candidatePools.find(
    (item) => item.id === episode.candidatePoolRef,
  );
  assert.ok(pool !== undefined, `missing pool ${episode.candidatePoolRef}`);
  return pool;
}

function perfectPredictions(episodeId: string): Map<string, DecisionEvalTurnPrediction> {
  const episode = episodeById(episodeId);
  return new Map(
    episode.turns.map((turn) => {
      assert.ok(turn.expected.annotationStatus === "LABELED");
      return [turn.id, predictionFromGolden(turn.expected)];
    }),
  );
}

function score(episode: DecisionEvalEpisode, predictions: ReadonlyMap<string, DecisionEvalTurnPrediction>) {
  return scoreDecisionEpisode(episode, predictions, poolFor(episode));
}

test("Eval-only reducer applies corrections, clears fields, and preserves unrelated facts", () => {
  const current: DecisionState = {
    occasion: "FRIENDS",
    time: { date: "2026-08-15", precision: "DAYPART", daypart: "DINNER" },
    party: { min: 6, max: 8, precision: "RANGE" },
    location: { kind: "FLEXIBLE" },
    target: { kind: "OPEN" },
    positivePreferences: ["Japanese food"],
    negativePreferences: ["formal"],
    hardConstraints: ["severe peanut allergy"],
  };

  const next = applyDecisionStatePatch(current, {
    set: {
      party: { min: 5, max: 5, precision: "EXACT" },
      location: { kind: "FLEXIBLE", scope: "from Ueno" },
      time: null,
    },
    add: { positivePreferences: ["quiet"] },
    remove: { negativePreferences: ["formal"] },
  });

  assert.deepEqual(next, {
    occasion: "FRIENDS",
    party: { min: 5, max: 5, precision: "EXACT" },
    location: { kind: "FLEXIBLE", scope: "from Ueno" },
    target: { kind: "OPEN" },
    positivePreferences: ["Japanese food", "quiet"],
    negativePreferences: [],
    hardConstraints: ["severe peanut allergy"],
  });
  assert.equal(current.time?.date, "2026-08-15");
  assert.deepEqual(current.party, { min: 6, max: 8, precision: "RANGE" });
});

test("Perfect Oracle passes every S1–S8 stage across the complete Golden Seed", () => {
  for (const episode of restaurantDecisionGoldenSeedV07.episodes) {
    const episodeScore = score(episode, perfectPredictions(episode.id));
    assert.equal(episodeScore.rawJourneyPass, true, episode.id);
    assert.equal(episodeScore.controllableJourneyPass, true, episode.id);
    assert.equal(episodeScore.appropriateIntermediatePass, true, episode.id);
    for (const turn of episodeScore.turns) {
      assert.equal(turn.firstFailureStage, undefined, `${episode.id}/${turn.turnId}`);
      assert.equal(
        turn.stages.every((stage) => stage.status === "PASS" || stage.status === "NOT_APPLICABLE"),
        true,
        `${episode.id}/${turn.turnId}`,
      );
    }
  }
});

test("S1–S5 single-point mutations have stable first-failure attribution", () => {
  const readinessEpisode = episodeById("DGS01-e1-category-ginza-western");
  const wrongReadiness = perfectPredictions(readinessEpisode.id);
  const readinessPrediction = wrongReadiness.get("DGS01-T01");
  assert.ok(readinessPrediction !== undefined);
  readinessPrediction.readiness = "NOT_READY";
  const readinessScore = score(readinessEpisode, wrongReadiness);
  assert.equal(readinessScore.turns[0]?.firstFailureStage, "S3_READINESS");
  assert.deepEqual(readinessScore.turns[0]?.firstFailureCodes, ["READINESS_MISMATCH"]);

  const clarificationEpisode = episodeById("DGS05-e3-date-ebisu");
  const repeatedQuestion = perfectPredictions(clarificationEpisode.id);
  const clarificationPrediction = repeatedQuestion.get("DGS05-T02");
  assert.ok(clarificationPrediction !== undefined);
  clarificationPrediction.nextAction = { type: "ASK_CORE_FIELD", topics: ["DATE"] };
  const clarificationScore = score(clarificationEpisode, repeatedQuestion);
  const secondTurn = clarificationScore.turns[1];
  assert.equal(secondTurn?.firstFailureStage, "S5_CLARIFICATION");
  assert.deepEqual(secondTurn?.firstFailureCodes, [
    "CLARIFICATION_TOPIC_NOT_ALLOWED",
    "CLARIFICATION_TOPIC_REPEATED",
  ]);

  const extractionEpisode = episodeById("DGS04-e2-team-izakaya");
  const inventedFact = perfectPredictions(extractionEpisode.id);
  const extractionPrediction = inventedFact.get("DGS04-T03");
  assert.ok(extractionPrediction !== undefined);
  extractionPrediction.statePatch = {
    add: {
      positivePreferences: ["quiet", "romantic"],
      hardConstraints: ["fully non-smoking"],
    },
  };
  const extractionScore = score(extractionEpisode, inventedFact);
  const thirdTurn = extractionScore.turns[2];
  assert.equal(thirdTurn?.firstFailureStage, "S1_STATE_EXTRACTION");
  assert.deepEqual(thirdTurn?.firstFailureCodes, ["STATE_PATCH_MISMATCH"]);
  assert.equal(
    thirdTurn?.stages.find((stage) => stage.stage === "S2_STATE_ACCUMULATION")?.status,
    "BLOCKED_BY_UPSTREAM",
  );
});

test("S6 rejects a retrieved restaurant that explicitly violates a hard allergy constraint", () => {
  const episode = episodeById("DGS06-e3-friends-correction-allergy");
  const predictions = perfectPredictions(episode.id);
  const prediction = predictions.get("DGS06-T03");
  assert.ok(prediction !== undefined);
  assert.ok(prediction.retrievedCandidateIds !== undefined);
  prediction.retrievedCandidateIds.push("flex-friends-yakitori-matsu");

  const episodeScore = score(episode, predictions);
  const turn = episodeScore.turns[2];
  assert.equal(turn?.firstFailureStage, "S6_CANDIDATE_RETRIEVAL");
  assert.deepEqual(turn?.firstFailureCodes, [
    "CANDIDATE_RETRIEVAL_UNEXPECTED_CANDIDATE",
    "P0_HARD_CONSTRAINT_VIOLATION",
  ]);
  assert.equal(
    turn?.stages.find((stage) => stage.stage === "S7_SELECTION_DIVERSITY")?.status,
    "BLOCKED_BY_UPSTREAM",
  );
});

test("S7 rejects a recommendation outside the retrieved eligible set", () => {
  const episode = episodeById("DGS04-e2-team-izakaya");
  const predictions = perfectPredictions(episode.id);
  const prediction = predictions.get("DGS04-T03");
  assert.ok(prediction?.recommendation !== undefined);
  prediction.recommendation.candidateIds = [
    "shimbashi-izakaya-nagi",
    "shimbashi-izakaya-kado",
  ];

  const episodeScore = score(episode, predictions);
  const turn = episodeScore.turns[2];
  assert.equal(turn?.firstFailureStage, "S7_SELECTION_DIVERSITY");
  assert.deepEqual(turn?.firstFailureCodes, [
    "RECOMMENDATION_NOT_ALLOWED",
    "RECOMMENDATION_FORBIDDEN_CANDIDATE",
    "RECOMMENDATION_NOT_RETRIEVED",
    "P0_HARD_CONSTRAINT_VIOLATION",
    "RECOMMENDATION_DIVERSITY_NEIGHBORHOOD_MISSING",
    "RECOMMENDATION_DIVERSITY_CHAIN_TYPE_MISSING",
  ]);
});

test("S8 requires the allergy confirmation disclosure on every displayed candidate card", () => {
  const episode = episodeById("DGS06-e3-friends-correction-allergy");
  const predictions = perfectPredictions(episode.id);
  const prediction = predictions.get("DGS06-T03");
  assert.ok(prediction?.grounding !== undefined);
  prediction.grounding.candidateDisclosures = prediction.grounding.candidateDisclosures.slice(1);

  const episodeScore = score(episode, predictions);
  const turn = episodeScore.turns[2];
  assert.equal(turn?.firstFailureStage, "S8_RESPONSE_GROUNDING");
  assert.deepEqual(turn?.firstFailureCodes, [
    "RESULT_GROUNDING_REQUIRED_DISCLOSURE_MISSING",
  ]);
});

test("Scorer fails closed for a missing structured prediction", () => {
  const episode = episodeById("DGS01-e1-category-ginza-western");
  assert.throws(
    () => score(episode, new Map()),
    /Missing Eval-only prediction for turn: DGS01-T01/,
  );
});
