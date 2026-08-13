import assert from "node:assert/strict";
import { test } from "node:test";

import { applyDecisionStatePatch } from "./restaurant-decision-eval-reducer.js";
import { decideRestaurantEvalTurn } from "./restaurant-decision-eval-decision-kernel.js";
import { restaurantDecisionGoldenSeedV010 } from "./restaurant-decision-eval-seed.js";

function labeledTurn(episodeId: string, turnId: string) {
  const episode = restaurantDecisionGoldenSeedV010.episodes.find((item) => item.id === episodeId);
  assert.ok(episode);
  const turn = episode.turns.find((item) => item.id === turnId);
  assert.ok(turn);
  assert.equal(turn.expected.annotationStatus, "LABELED");
  return { episode, turn, expected: turn.expected };
}

test("Decision Kernel deterministically owns readiness and routing for stable named-target and fallback cases", () => {
  const brand = labeledTurn("DGS02-e1-brand-kinshicho", "DGS02-T01");
  const brandState = applyDecisionStatePatch(brand.episode.initialState, brand.expected.statePatch);
  assert.ok(brand.expected.retrieval);
  const brandDecision = decideRestaurantEvalTurn({
    state: brandState,
    retrievedCandidateIds: brand.expected.retrieval.eligibleCandidateIds,
    hasVisibleOptions: false,
    hasPreferenceUpdate: false,
  });
  assert.equal(brandDecision.readiness, "AVAILABILITY_READY");
  assert.deepEqual(brandDecision.nextAction, { type: "CHECK_AVAILABILITY" });

  const target = labeledTurn("DGS03-e2-restaurant-sora-dining", "DGS03-T02");
  const targetBefore = applyDecisionStatePatch(target.episode.initialState, target.episode.turns[0]?.expected.annotationStatus === "LABELED" ? target.episode.turns[0].expected.statePatch : {});
  const targetState = applyDecisionStatePatch(targetBefore, target.expected.statePatch);
  assert.ok(target.expected.retrieval);
  const targetDecision = decideRestaurantEvalTurn({
    state: targetState,
    retrievedCandidateIds: target.expected.retrieval.eligibleCandidateIds,
    hasVisibleOptions: true,
    hasPreferenceUpdate: false,
  });
  assert.equal(targetDecision.readiness, "RECOMMENDATION_READY");
  assert.deepEqual(targetDecision.nextAction, { type: "CHECK_TARGET_RESTAURANT" });

  const fallback = labeledTurn("DGS07-e1-brand-zero-result-relaxation", "DGS07-T01");
  const fallbackState = applyDecisionStatePatch(fallback.episode.initialState, fallback.expected.statePatch);
  const fallbackDecision = decideRestaurantEvalTurn({
    state: fallbackState,
    retrievedCandidateIds: [],
    hasVisibleOptions: false,
    hasPreferenceUpdate: false,
  });
  assert.equal(fallbackDecision.readiness, "AVAILABILITY_READY");
  assert.deepEqual(fallbackDecision.nextAction, { type: "PROPOSE_CONSTRAINT_RELAXATION" });
});

test("Decision Kernel determines candidate quota and grounding without model-supplied evidence", () => {
  const sample = labeledTurn("DGS04-e2-team-izakaya", "DGS04-T03");
  let state = structuredClone(sample.episode.initialState);
  for (const previous of sample.episode.turns.slice(0, 2)) {
    assert.equal(previous.expected.annotationStatus, "LABELED");
    state = applyDecisionStatePatch(state, previous.expected.statePatch);
  }
  state = applyDecisionStatePatch(state, sample.expected.statePatch);
  const pool = restaurantDecisionGoldenSeedV010.candidatePools.find((item) => item.id === sample.episode.candidatePoolRef);
  assert.ok(pool);
  assert.ok(sample.expected.retrieval);
  const candidateContext = sample.expected.retrieval.eligibleCandidateIds.map((id) => {
    const candidate = pool.candidates.find((item) => item.id === id);
    assert.ok(candidate);
    return { id: candidate.id, facts: candidate.facts };
  });
  const decision = decideRestaurantEvalTurn({
    state,
    retrievedCandidateIds: sample.expected.retrieval.eligibleCandidateIds,
    candidateContext,
    retrievalSufficiency: "LIMITED",
    hasVisibleOptions: true,
    hasPreferenceUpdate: true,
  });

  assert.deepEqual(decision.nextAction, { type: "NARROW_FROM_FEEDBACK" });
  assert.equal(decision.recommendation?.candidateIds.length, 2);
  assert.equal(decision.recommendation?.explainsInsufficientCandidates, true);
  assert.deepEqual(decision.grounding.stateFactRefs, sample.expected.grounding?.allowedStateFactRefs);
  assert.deepEqual(decision.grounding.candidateFactRefs, sample.expected.grounding?.allowedCandidateFactRefs);
});
