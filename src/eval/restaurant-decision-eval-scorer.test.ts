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
import { restaurantDecisionGoldenSeedV010 } from "./restaurant-decision-eval-seed.js";

function episodeById(episodeId: string): DecisionEvalEpisode {
  const episode = restaurantDecisionGoldenSeedV010.episodes.find((item) => item.id === episodeId);
  assert.ok(episode !== undefined, `missing episode ${episodeId}`);
  return episode;
}

function poolFor(episode: DecisionEvalEpisode): RecommendationCandidatePool {
  assert.ok(episode.candidatePoolRef !== undefined, `${episode.id} requires a candidate pool`);
  const pool = restaurantDecisionGoldenSeedV010.candidatePools.find(
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
    preferences: [
      { facet: "CUISINE", value: "Japanese food", polarity: "PREFER" },
      { facet: "FORMALITY", value: "FORMAL", polarity: "AVOID" },
    ],
    hardConstraints: [{ kind: "ALLERGY", allergen: "PEANUT", severity: "SEVERE" }],
  };

  const next = applyDecisionStatePatch(current, {
    set: {
      party: { min: 5, max: 5, precision: "EXACT" },
      location: { kind: "FLEXIBLE", anchorQuery: "Ueno" },
      time: null,
    },
    add: { preferences: [{ facet: "VIBE", value: "QUIET", polarity: "PREFER" }] },
    remove: { preferences: [{ facet: "FORMALITY", value: "FORMAL", polarity: "AVOID" }] },
  });

  assert.deepEqual(next, {
    occasion: "FRIENDS",
    party: { min: 5, max: 5, precision: "EXACT" },
    location: { kind: "FLEXIBLE", anchorQuery: "Ueno" },
    target: { kind: "OPEN" },
    preferences: [
      { facet: "CUISINE", value: "Japanese food", polarity: "PREFER" },
      { facet: "VIBE", value: "QUIET", polarity: "PREFER" },
    ],
    hardConstraints: [{ kind: "ALLERGY", allergen: "PEANUT", severity: "SEVERE" }],
  });
  assert.equal(current.time?.date, "2026-08-15");
  assert.deepEqual(current.party, { min: 6, max: 8, precision: "RANGE" });
});

test("Perfect Oracle passes every S1–S8 stage across the complete Golden Seed", () => {
  for (const episode of restaurantDecisionGoldenSeedV010.episodes) {
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
      preferences: [
        { facet: "VIBE", value: "QUIET", polarity: "PREFER" },
        { facet: "VIBE", value: "INTIMATE", polarity: "PREFER" },
      ],
      hardConstraints: [{ kind: "SMOKING_POLICY", value: "FULLY_NON_SMOKING" }],
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

test("S1 accepts a redundant no-op patch while S2 still checks the resulting state", () => {
  const episode = episodeById("DGS06-e3-friends-correction-allergy");
  const predictions = perfectPredictions(episode.id);
  const prediction = predictions.get("DGS06-T04");
  assert.ok(prediction !== undefined);
  prediction.statePatch = {
    set: { target: { kind: "OPEN" } },
    add: {
      preferences: [
        { facet: "CUISINE", value: "Japanese food", polarity: "PREFER" },
        { facet: "FORMALITY", value: "FORMAL", polarity: "AVOID" },
      ],
    },
  };

  const episodeScore = score(episode, predictions);
  const turn = episodeScore.turns[3];
  assert.equal(turn?.stages.find((stage) => stage.stage === "S1_STATE_EXTRACTION")?.status, "PASS");
  assert.equal(turn?.stages.find((stage) => stage.stage === "S2_STATE_ACCUMULATION")?.status, "PASS");
});

test("S1 and S2 accept only approved restaurant-category aliases and casing", () => {
  const westernEpisode = episodeById("DGS01-e1-category-ginza-western");
  const westernPredictions = perfectPredictions(westernEpisode.id);
  const westernPrediction = westernPredictions.get("DGS01-T01");
  assert.ok(westernPrediction?.statePatch.set?.target?.kind === "CATEGORY");
  westernPrediction.statePatch.set.target.query = "WESTERN";
  const westernScore = score(westernEpisode, westernPredictions).turns[0];
  assert.equal(westernScore?.firstFailureStage, undefined);

  const izakayaEpisode = episodeById("DGS04-e2-team-izakaya");
  const izakayaPredictions = perfectPredictions(izakayaEpisode.id);
  const izakayaPrediction = izakayaPredictions.get("DGS04-T01");
  assert.ok(izakayaPrediction?.statePatch.set?.target?.kind === "CATEGORY");
  izakayaPrediction.statePatch.set.target.query = "IZAKAYA";
  const izakayaScore = score(izakayaEpisode, izakayaPredictions).turns[0];
  assert.equal(izakayaScore?.firstFailureStage, undefined);

  const japaneseEpisode = episodeById("DGS06-e3-friends-correction-allergy");
  const japanesePredictions = perfectPredictions(japaneseEpisode.id);
  const japanesePrediction = japanesePredictions.get("DGS06-T04");
  assert.ok(japanesePrediction?.statePatch.add?.preferences !== undefined);
  japanesePrediction.statePatch.add.preferences = [
    { facet: "CUISINE", value: "JAPANESE", polarity: "PREFER" },
    { facet: "FORMALITY", value: "FORMAL", polarity: "AVOID" },
  ];
  const japaneseScore = score(japaneseEpisode, japanesePredictions).turns[3];
  assert.equal(japaneseScore?.firstFailureStage, undefined);

  const unrelatedPrediction = perfectPredictions(westernEpisode.id);
  const unrelatedTarget = unrelatedPrediction.get("DGS01-T01");
  assert.ok(unrelatedTarget?.statePatch.set?.target?.kind === "CATEGORY");
  unrelatedTarget.statePatch.set.target.query = "Italian";
  assert.equal(
    score(westernEpisode, unrelatedPrediction).turns[0]?.firstFailureStage,
    "S1_STATE_EXTRACTION",
  );
});

test("S1 and S2 accept bounded location canonicalization without hiding missing location updates", () => {
  const brandEpisode = episodeById("DGS07-e1-brand-zero-result-relaxation");
  const areaNearPlacePredictions = perfectPredictions(brandEpisode.id);
  const firstBrandPrediction = areaNearPlacePredictions.get("DGS07-T01");
  assert.ok(firstBrandPrediction?.statePatch.set?.location?.kind === "AREA");
  firstBrandPrediction.statePatch.set.location = { kind: "NEAR_PLACE", query: "KINSHICHO" };
  const areaNearPlaceScore = score(brandEpisode, areaNearPlacePredictions).turns[0];
  assert.equal(areaNearPlaceScore?.firstFailureStage, undefined);

  const addressPredictions = perfectPredictions(brandEpisode.id);
  const addressPrediction = addressPredictions.get("DGS07-T01");
  assert.ok(addressPrediction?.statePatch.set?.location?.kind === "AREA");
  addressPrediction.statePatch.set.location = {
    kind: "ADDRESS_OR_STREET",
    query: "Kinshicho",
  };
  const addressScore = score(brandEpisode, addressPredictions).turns[0];
  assert.equal(addressScore?.firstFailureStage, "S1_STATE_EXTRACTION");

  const flexibleEpisode = episodeById("DGS06-e3-friends-correction-allergy");
  const genericScopePredictions = perfectPredictions(flexibleEpisode.id);
  const secondFlexiblePrediction = genericScopePredictions.get("DGS06-T02");
  assert.ok(secondFlexiblePrediction?.statePatch.set?.location?.kind === "FLEXIBLE");
  secondFlexiblePrediction.statePatch.set.location = {
    kind: "FLEXIBLE",
    scope: "willing to travel",
  };
  const genericScopeScore = score(flexibleEpisode, genericScopePredictions).turns[1];
  assert.equal(genericScopeScore?.firstFailureStage, undefined);

  const legacyAnchorPredictions = perfectPredictions(flexibleEpisode.id);
  const thirdFlexiblePrediction = legacyAnchorPredictions.get("DGS06-T03");
  assert.ok(thirdFlexiblePrediction?.statePatch.set?.location?.kind === "FLEXIBLE");
  thirdFlexiblePrediction.statePatch.set.location = {
    kind: "FLEXIBLE",
    scope: "start around Ueno and can travel farther",
  };
  const legacyAnchorScore = score(flexibleEpisode, legacyAnchorPredictions).turns[2];
  assert.equal(legacyAnchorScore?.firstFailureStage, undefined);

  const missingLocationPredictions = perfectPredictions(brandEpisode.id);
  const secondBrandPrediction = missingLocationPredictions.get("DGS07-T02");
  assert.ok(secondBrandPrediction !== undefined);
  secondBrandPrediction.statePatch = {};
  const missingLocationScore = score(brandEpisode, missingLocationPredictions).turns[1];
  assert.equal(missingLocationScore?.firstFailureStage, "S1_STATE_EXTRACTION");
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
