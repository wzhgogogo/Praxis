import type {
  DecisionCandidateDisclosure,
  DecisionCoreTopic,
  DecisionDiversityAxis,
  DecisionEvalDataset,
  DecisionEvalEpisode,
  DecisionEvalGroundingPrediction,
  DecisionEvalLabeledExpectation,
  DecisionEvalTurnPrediction,
  DecisionState,
  ProposedNextAction,
  RecommendationCandidateFixture,
  RecommendationCandidatePool,
} from "./restaurant-decision-eval-contract.js";
import { applyDecisionStatePatch } from "./restaurant-decision-eval-reducer.js";

export const DECISION_EVAL_STAGE_IDS = [
  "S1_STATE_EXTRACTION",
  "S2_STATE_ACCUMULATION",
  "S3_READINESS",
  "S4_ACTION_ROUTING",
  "S5_CLARIFICATION",
  "S6_CANDIDATE_RETRIEVAL",
  "S7_SELECTION_DIVERSITY",
  "S8_RESPONSE_GROUNDING",
] as const;

export type DecisionEvalStageId = (typeof DECISION_EVAL_STAGE_IDS)[number];
export type DecisionEvalStageStatus = "PASS" | "FAIL" | "BLOCKED_BY_UPSTREAM" | "NOT_APPLICABLE";

export interface DecisionEvalStageResult {
  stage: DecisionEvalStageId;
  status: DecisionEvalStageStatus;
  errorCodes: string[];
}

export interface DecisionEvalTurnScore {
  turnId: string;
  stages: DecisionEvalStageResult[];
  firstFailureStage?: DecisionEvalStageId;
  firstFailureCodes: string[];
}

export interface DecisionEvalEpisodeScore {
  episodeId: string;
  turns: DecisionEvalTurnScore[];
  rawJourneyPass: boolean;
  controllableJourneyPass: boolean;
  appropriateIntermediatePass: boolean;
}

export interface DecisionEvalFixtureReport {
  evaluatorVersion: "1";
  mode: "FIXTURE_ORACLE";
  datasetId: string;
  datasetVersion: string;
  stages: Record<DecisionEvalStageId, Record<DecisionEvalStageStatus, number>>;
  episodes: DecisionEvalEpisodeScore[];
  rawJourneyPassRate: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => sameValue(value, right[index]))
    );
  }
  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && sameValue(left[key], right[key]))
  );
}

function stage(
  stageId: DecisionEvalStageId,
  status: DecisionEvalStageStatus,
  ...errorCodes: string[]
): DecisionEvalStageResult {
  return { stage: stageId, status, errorCodes };
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function actionTypeIsAcceptable(
  nextAction: ProposedNextAction,
  expected: DecisionEvalLabeledExpectation,
): boolean {
  return expected.acceptableNextActions.some((action) => action.type === nextAction.type);
}

function scoreClarification(
  nextAction: ProposedNextAction,
  expected: DecisionEvalLabeledExpectation,
): DecisionEvalStageResult {
  if (nextAction.type !== "ASK_CORE_FIELD") {
    return stage("S5_CLARIFICATION", "NOT_APPLICABLE");
  }
  const clarification = expected.clarification;
  if (clarification === undefined) {
    return stage("S5_CLARIFICATION", "FAIL", "UNEXPECTED_CLARIFICATION");
  }
  const topics = nextAction.topics;
  const errorCodes: string[] = [];
  if (topics.length === 0 || topics.length > clarification.maxTopics) {
    errorCodes.push("CLARIFICATION_TOPIC_COUNT");
  }
  if (topics.some((topic) => !clarification.allowedTopics.includes(topic))) {
    errorCodes.push("CLARIFICATION_TOPIC_NOT_ALLOWED");
  }
  if (topics.some((topic) => clarification.mustNotAsk.includes(topic))) {
    errorCodes.push("CLARIFICATION_TOPIC_REPEATED");
  }
  return errorCodes.length === 0
    ? stage("S5_CLARIFICATION", "PASS")
    : stage("S5_CLARIFICATION", "FAIL", ...errorCodes);
}

function candidateMap(pool: RecommendationCandidatePool | undefined): Map<string, RecommendationCandidateFixture> {
  return new Map(pool?.candidates.map((candidate) => [candidate.id, candidate]) ?? []);
}

function hasHardConstraintConflict(
  candidate: RecommendationCandidateFixture,
  state: DecisionState,
): boolean {
  return state.hardConstraints.some((constraint) => candidate.unsupportedConstraints.includes(constraint));
}

function scoreCandidateRetrieval(
  expected: DecisionEvalLabeledExpectation,
  prediction: DecisionEvalTurnPrediction,
  pool: RecommendationCandidatePool | undefined,
  state: DecisionState,
): DecisionEvalStageResult {
  const actualIds = prediction.retrievedCandidateIds;
  if (expected.retrieval === undefined) {
    return actualIds === undefined || actualIds.length === 0
      ? stage("S6_CANDIDATE_RETRIEVAL", "NOT_APPLICABLE")
      : stage("S6_CANDIDATE_RETRIEVAL", "FAIL", "UNEXPECTED_CANDIDATE_RETRIEVAL");
  }
  if (pool === undefined) {
    return stage("S6_CANDIDATE_RETRIEVAL", "FAIL", "HARNESS_CANDIDATE_POOL_MISSING");
  }
  if (actualIds === undefined) {
    return stage("S6_CANDIDATE_RETRIEVAL", "FAIL", "CANDIDATE_RETRIEVAL_MISSING");
  }

  const candidates = candidateMap(pool);
  const errorCodes: string[] = [];
  if (!unique(actualIds)) errorCodes.push("CANDIDATE_RETRIEVAL_DUPLICATE_CANDIDATE");
  if (actualIds.some((candidateId) => !candidates.has(candidateId))) {
    errorCodes.push("CANDIDATE_RETRIEVAL_UNKNOWN_CANDIDATE");
  }
  const missingEligible = expected.retrieval.eligibleCandidateIds.some(
    (candidateId) => !actualIds.includes(candidateId),
  );
  if (missingEligible) errorCodes.push("CANDIDATE_RETRIEVAL_MISSING_ELIGIBLE");
  const unexpectedCandidateIds = actualIds.filter(
    (candidateId) => !expected.retrieval?.eligibleCandidateIds.includes(candidateId),
  );
  if (unexpectedCandidateIds.length > 0) {
    errorCodes.push("CANDIDATE_RETRIEVAL_UNEXPECTED_CANDIDATE");
  }
  if (
    actualIds.some((candidateId) => {
      const candidate = candidates.get(candidateId);
      return candidate !== undefined && hasHardConstraintConflict(candidate, state);
    })
  ) {
    errorCodes.push("P0_HARD_CONSTRAINT_VIOLATION");
  }
  return errorCodes.length === 0
    ? stage("S6_CANDIDATE_RETRIEVAL", "PASS")
    : stage("S6_CANDIDATE_RETRIEVAL", "FAIL", ...errorCodes);
}

function valuesForDiversityAxis(
  candidate: RecommendationCandidateFixture,
  axis: DecisionDiversityAxis,
): string[] {
  switch (axis) {
    case "CUISINE":
      return candidate.cuisines;
    case "PRICE_BAND":
      return [candidate.priceBand];
    case "VIBE":
      return candidate.vibes;
    case "NEIGHBORHOOD":
      return [candidate.area];
    case "CHAIN_TYPE":
      return [candidate.chainType];
    case "OUTLET":
      return [candidate.outletName];
    case "OFFER":
      return candidate.availability === undefined
        ? []
        : [
            `${candidate.availability.date}:${candidate.availability.earliest}-${candidate.availability.latest}:${candidate.availability.partyMax}`,
          ];
  }
}

function candidateSelections<T>(items: readonly T[], count: number): T[][] {
  if (count === 0) return [[]];
  if (count > items.length) return [];
  const selections: T[][] = [];
  for (let index = 0; index <= items.length - count; index += 1) {
    for (const tail of candidateSelections(items.slice(index + 1), count - 1)) {
      selections.push([items[index] as T, ...tail]);
    }
  }
  return selections;
}

function fixtureCanSatisfyRecommendation(
  expected: NonNullable<DecisionEvalLabeledExpectation["recommendation"]>,
  candidates: Map<string, RecommendationCandidateFixture>,
): boolean {
  const allowedCandidates = expected.allowedCandidateIds
    .map((candidateId) => candidates.get(candidateId))
    .filter((candidate): candidate is RecommendationCandidateFixture => candidate !== undefined);
  if (allowedCandidates.length !== expected.allowedCandidateIds.length) return false;
  for (let count = expected.minCandidates; count <= expected.maxCandidates; count += 1) {
    for (const selection of candidateSelections(allowedCandidates, count)) {
      const satisfiesAllAxes = expected.requiredDiversityAxes.every((axis) => {
        const values = new Set(selection.flatMap((candidate) => valuesForDiversityAxis(candidate, axis)));
        return values.size >= 2;
      });
      if (satisfiesAllAxes) return true;
    }
  }
  return false;
}

function scoreSelectionDiversity(
  expected: DecisionEvalLabeledExpectation,
  prediction: DecisionEvalTurnPrediction,
  pool: RecommendationCandidatePool | undefined,
  state: DecisionState,
): DecisionEvalStageResult {
  if (expected.recommendation === undefined) {
    const candidateIds = prediction.recommendation?.candidateIds ?? [];
    return candidateIds.length === 0
      ? stage("S7_SELECTION_DIVERSITY", "NOT_APPLICABLE")
      : stage("S7_SELECTION_DIVERSITY", "FAIL", "UNEXPECTED_RECOMMENDATION");
  }
  if (pool === undefined) {
    return stage("S7_SELECTION_DIVERSITY", "FAIL", "HARNESS_CANDIDATE_POOL_MISSING");
  }
  const candidates = candidateMap(pool);
  if (!fixtureCanSatisfyRecommendation(expected.recommendation, candidates)) {
    return stage("S7_SELECTION_DIVERSITY", "FAIL", "FIXTURE_COVERAGE_GAP");
  }
  const recommendation = prediction.recommendation;
  if (recommendation === undefined) {
    return stage("S7_SELECTION_DIVERSITY", "FAIL", "RECOMMENDATION_MISSING");
  }

  const candidateIds = recommendation.candidateIds;
  const errorCodes: string[] = [];
  if (!unique(candidateIds)) errorCodes.push("RECOMMENDATION_DUPLICATE_CANDIDATE");
  if (candidateIds.some((candidateId) => !candidates.has(candidateId))) {
    errorCodes.push("RECOMMENDATION_UNKNOWN_CANDIDATE");
  }
  if (
    candidateIds.length < expected.recommendation.minCandidates ||
    candidateIds.length > expected.recommendation.maxCandidates
  ) {
    errorCodes.push("RECOMMENDATION_CANDIDATE_COUNT");
  }
  if (
    candidateIds.some(
      (candidateId) => !expected.recommendation?.allowedCandidateIds.includes(candidateId),
    )
  ) {
    errorCodes.push("RECOMMENDATION_NOT_ALLOWED");
  }
  if (
    candidateIds.some((candidateId) => expected.recommendation?.forbiddenCandidateIds.includes(candidateId))
  ) {
    errorCodes.push("RECOMMENDATION_FORBIDDEN_CANDIDATE");
  }
  const retrievedCandidateIds = prediction.retrievedCandidateIds ?? [];
  if (candidateIds.some((candidateId) => !retrievedCandidateIds.includes(candidateId))) {
    errorCodes.push("RECOMMENDATION_NOT_RETRIEVED");
  }
  if (
    candidateIds.some((candidateId) => {
      const candidate = candidates.get(candidateId);
      return candidate !== undefined && hasHardConstraintConflict(candidate, state);
    })
  ) {
    errorCodes.push("P0_HARD_CONSTRAINT_VIOLATION");
  }
  if (expected.recommendation.mustExplainInsufficientCandidates && recommendation.explainsInsufficientCandidates !== true) {
    errorCodes.push("RECOMMENDATION_INSUFFICIENT_SET_EXPLANATION_MISSING");
  }

  const selectedCandidates = candidateIds
    .map((candidateId) => candidates.get(candidateId))
    .filter((candidate): candidate is RecommendationCandidateFixture => candidate !== undefined);
  for (const axis of expected.recommendation.requiredDiversityAxes) {
    const values = new Set(selectedCandidates.flatMap((candidate) => valuesForDiversityAxis(candidate, axis)));
    if (values.size < 2) errorCodes.push(`RECOMMENDATION_DIVERSITY_${axis}_MISSING`);
  }
  return errorCodes.length === 0
    ? stage("S7_SELECTION_DIVERSITY", "PASS")
    : stage("S7_SELECTION_DIVERSITY", "FAIL", ...errorCodes);
}

function disclosureKey(disclosure: DecisionCandidateDisclosure): string {
  return `${disclosure.candidateId}:${disclosure.type}:${disclosure.factRef}`;
}

function hasGroundingContent(grounding: DecisionEvalGroundingPrediction | undefined): boolean {
  return (
    grounding !== undefined &&
    (grounding.stateFactRefs.length > 0 ||
      grounding.candidateFactRefs.length > 0 ||
      grounding.claimLabels.length > 0 ||
      grounding.candidateDisclosures.length > 0)
  );
}

function scoreGrounding(
  expected: DecisionEvalLabeledExpectation,
  prediction: DecisionEvalTurnPrediction,
): DecisionEvalStageResult {
  if (expected.grounding === undefined) {
    return hasGroundingContent(prediction.grounding)
      ? stage("S8_RESPONSE_GROUNDING", "FAIL", "UNEXPECTED_GROUNDING")
      : stage("S8_RESPONSE_GROUNDING", "NOT_APPLICABLE");
  }
  const grounding = prediction.grounding;
  if (grounding === undefined) {
    return stage("S8_RESPONSE_GROUNDING", "FAIL", "GROUNDING_MISSING");
  }

  const errorCodes: string[] = [];
  if (!unique(grounding.stateFactRefs)) errorCodes.push("PROCESS_GROUNDING_DUPLICATE_STATE_FACT");
  if (!unique(grounding.candidateFactRefs)) errorCodes.push("RESULT_GROUNDING_DUPLICATE_CANDIDATE_FACT");
  if (!unique(grounding.claimLabels)) errorCodes.push("RESULT_GROUNDING_DUPLICATE_CLAIM");
  if (
    grounding.stateFactRefs.some(
      (factRef) => !expected.grounding?.allowedStateFactRefs.includes(factRef),
    )
  ) {
    errorCodes.push("PROCESS_GROUNDING_UNSUPPORTED_STATE_FACT");
  }
  if (
    grounding.candidateFactRefs.some(
      (factRef) => !expected.grounding?.allowedCandidateFactRefs.includes(factRef),
    )
  ) {
    errorCodes.push("RESULT_GROUNDING_UNSUPPORTED_CANDIDATE_FACT");
  }
  const forbiddenClaims = grounding.claimLabels.filter((claim) =>
    expected.grounding?.forbiddenClaims.includes(claim),
  );
  if (forbiddenClaims.length > 0) {
    errorCodes.push("RESULT_GROUNDING_FORBIDDEN_CLAIM");
    if (forbiddenClaims.some((claim) => claim.toLowerCase().includes("allergy"))) {
      errorCodes.push("P0_UNSAFE_ALLERGY_CLAIM");
    }
  }

  const disclosureKeys = grounding.candidateDisclosures.map(disclosureKey);
  if (!unique(disclosureKeys)) errorCodes.push("RESULT_GROUNDING_DUPLICATE_DISCLOSURE");
  if (
    grounding.candidateDisclosures.some(
      (disclosure) =>
        !expected.grounding?.allowedCandidateFactRefs.includes(disclosure.factRef) ||
        !disclosure.factRef.startsWith(`${disclosure.candidateId}.`),
    )
  ) {
    errorCodes.push("RESULT_GROUNDING_UNSUPPORTED_DISCLOSURE");
  }
  const requiredDisclosureKeys = new Set(
    (expected.grounding.requiredCandidateDisclosures ?? []).map(disclosureKey),
  );
  if ([...requiredDisclosureKeys].some((key) => !disclosureKeys.includes(key))) {
    errorCodes.push("RESULT_GROUNDING_REQUIRED_DISCLOSURE_MISSING");
  }
  return errorCodes.length === 0
    ? stage("S8_RESPONSE_GROUNDING", "PASS")
    : stage("S8_RESPONSE_GROUNDING", "FAIL", ...errorCodes);
}

function scoreTurn(
  turnId: string,
  expected: DecisionEvalLabeledExpectation,
  prediction: DecisionEvalTurnPrediction,
  priorGoldState: DecisionState,
  priorPredictedState: DecisionState,
  pool: RecommendationCandidatePool | undefined,
): { score: DecisionEvalTurnScore; goldState: DecisionState; predictedState: DecisionState } {
  const stateExtraction = sameValue(prediction.statePatch, expected.statePatch)
    ? stage("S1_STATE_EXTRACTION", "PASS")
    : stage("S1_STATE_EXTRACTION", "FAIL", "STATE_PATCH_MISMATCH");

  const goldState = applyDecisionStatePatch(priorGoldState, expected.statePatch);
  const goldReducerValid = sameValue(goldState, expected.accumulatedState);
  const predictedState = applyDecisionStatePatch(priorPredictedState, prediction.statePatch);
  const stateAccumulation = !goldReducerValid
    ? stage("S2_STATE_ACCUMULATION", "FAIL", "GOLD_REDUCER_MISMATCH")
    : stateExtraction.status === "FAIL"
      ? stage("S2_STATE_ACCUMULATION", "BLOCKED_BY_UPSTREAM", "BLOCKED_BY_S1")
      : sameValue(predictedState, expected.accumulatedState)
        ? stage("S2_STATE_ACCUMULATION", "PASS")
        : stage("S2_STATE_ACCUMULATION", "FAIL", "STATE_ACCUMULATION_MISMATCH");

  const readiness = stateExtraction.status !== "PASS" || stateAccumulation.status !== "PASS"
    ? stage("S3_READINESS", "BLOCKED_BY_UPSTREAM", "BLOCKED_BY_STATE")
    : prediction.readiness === expected.readiness
      ? stage("S3_READINESS", "PASS")
      : stage("S3_READINESS", "FAIL", "READINESS_MISMATCH");

  const actionRouting = readiness.status !== "PASS"
    ? stage("S4_ACTION_ROUTING", "BLOCKED_BY_UPSTREAM", "BLOCKED_BY_READINESS")
    : actionTypeIsAcceptable(prediction.nextAction, expected)
      ? stage("S4_ACTION_ROUTING", "PASS")
      : stage("S4_ACTION_ROUTING", "FAIL", "ACTION_TYPE_NOT_ACCEPTABLE");

  const clarification = actionRouting.status !== "PASS"
    ? stage("S5_CLARIFICATION", "BLOCKED_BY_UPSTREAM", "BLOCKED_BY_ACTION_ROUTING")
    : scoreClarification(prediction.nextAction, expected);

  const retrieval =
    actionRouting.status !== "PASS" || clarification.status === "FAIL"
      ? stage("S6_CANDIDATE_RETRIEVAL", "BLOCKED_BY_UPSTREAM", "BLOCKED_BY_DIALOGUE")
      : scoreCandidateRetrieval(expected, prediction, pool, goldState);

  const selection =
    retrieval.status === "FAIL" || retrieval.status === "BLOCKED_BY_UPSTREAM"
      ? stage("S7_SELECTION_DIVERSITY", "BLOCKED_BY_UPSTREAM", "BLOCKED_BY_S6")
      : scoreSelectionDiversity(expected, prediction, pool, goldState);

  const grounding =
    retrieval.status === "FAIL" ||
    retrieval.status === "BLOCKED_BY_UPSTREAM" ||
    selection.status === "FAIL" ||
    selection.status === "BLOCKED_BY_UPSTREAM"
      ? stage("S8_RESPONSE_GROUNDING", "BLOCKED_BY_UPSTREAM", "BLOCKED_BY_CANDIDATE_STAGE")
      : scoreGrounding(expected, prediction);

  const stages = [
    stateExtraction,
    stateAccumulation,
    readiness,
    actionRouting,
    clarification,
    retrieval,
    selection,
    grounding,
  ];
  const firstFailure = stages.find((item) => item.status === "FAIL");
  const score: DecisionEvalTurnScore = {
    turnId,
    stages,
    firstFailureCodes: firstFailure?.errorCodes ?? [],
  };
  if (firstFailure !== undefined) score.firstFailureStage = firstFailure.stage;
  return {
    score,
    goldState,
    predictedState,
  };
}

export function predictionFromGolden(
  expected: DecisionEvalLabeledExpectation,
): DecisionEvalTurnPrediction {
  const firstAction = expected.acceptableNextActions[0];
  if (firstAction === undefined) {
    throw new Error("Labeled expectation must contain at least one acceptable action");
  }
  return {
    statePatch: structuredClone(expected.statePatch),
    readiness: expected.readiness,
    nextAction: structuredClone(firstAction),
    ...(expected.retrieval === undefined
      ? {}
      : { retrievedCandidateIds: structuredClone(expected.retrieval.eligibleCandidateIds) }),
    ...(expected.recommendation === undefined
      ? {}
      : {
          recommendation: {
            candidateIds: structuredClone(expected.recommendation.allowedCandidateIds),
            explainsInsufficientCandidates: expected.recommendation.mustExplainInsufficientCandidates,
          },
        }),
    ...(expected.grounding === undefined
      ? {}
      : {
          grounding: {
            stateFactRefs: structuredClone(expected.grounding.allowedStateFactRefs),
            candidateFactRefs: structuredClone(expected.grounding.allowedCandidateFactRefs),
            claimLabels: [],
            candidateDisclosures: structuredClone(
              expected.grounding.requiredCandidateDisclosures ?? [],
            ),
          },
        }),
  };
}

/**
 * Scores the Eval-only S1–S8 chain for a fully labeled Episode. The supplied
 * pool is fixture-only context; missing predictions or pool data fail closed.
 */
export function scoreDecisionEpisode(
  episode: DecisionEvalEpisode,
  predictions: ReadonlyMap<string, DecisionEvalTurnPrediction>,
  candidatePool?: RecommendationCandidatePool,
): DecisionEvalEpisodeScore {
  let goldState = structuredClone(episode.initialState);
  let predictedState = structuredClone(episode.initialState);
  const turns: DecisionEvalTurnScore[] = [];

  for (const turn of episode.turns) {
    if (turn.expected.annotationStatus !== "LABELED") {
      throw new Error(`Cannot score pending human label: ${turn.id}`);
    }
    const prediction = predictions.get(turn.id);
    if (prediction === undefined) {
      throw new Error(`Missing Eval-only prediction for turn: ${turn.id}`);
    }
    const scored = scoreTurn(
      turn.id,
      turn.expected,
      prediction,
      goldState,
      predictedState,
      candidatePool,
    );
    turns.push(scored.score);
    goldState = scored.goldState;
    predictedState = scored.predictedState;
  }

  const rawJourneyPass = turns.every((turn) => turn.firstFailureStage === undefined);
  return {
    episodeId: episode.id,
    turns,
    rawJourneyPass,
    controllableJourneyPass: rawJourneyPass,
    appropriateIntermediatePass: rawJourneyPass,
  };
}

export function coreTopicsFromAction(action: ProposedNextAction): DecisionCoreTopic[] {
  return action.type === "ASK_CORE_FIELD" ? [...action.topics] : [];
}

export function evaluateDecisionFixtureOracle(
  dataset: DecisionEvalDataset,
): DecisionEvalFixtureReport {
  const poolsById = new Map(dataset.candidatePools.map((pool) => [pool.id, pool]));
  const episodes = dataset.episodes.map((episode) => {
    const predictions = new Map<string, DecisionEvalTurnPrediction>();
    for (const turn of episode.turns) {
      if (turn.expected.annotationStatus !== "LABELED") {
        throw new Error(`Cannot run Fixture Oracle with pending human label: ${turn.id}`);
      }
      predictions.set(turn.id, predictionFromGolden(turn.expected));
    }
    return scoreDecisionEpisode(
      episode,
      predictions,
      episode.candidatePoolRef === undefined ? undefined : poolsById.get(episode.candidatePoolRef),
    );
  });
  const stages = Object.fromEntries(
    DECISION_EVAL_STAGE_IDS.map((stageId) => [
      stageId,
      { PASS: 0, FAIL: 0, BLOCKED_BY_UPSTREAM: 0, NOT_APPLICABLE: 0 },
    ]),
  ) as DecisionEvalFixtureReport["stages"];
  for (const episode of episodes) {
    for (const turn of episode.turns) {
      for (const result of turn.stages) stages[result.stage][result.status] += 1;
    }
  }
  const passedJourneys = episodes.filter((episode) => episode.rawJourneyPass).length;
  return {
    evaluatorVersion: "1",
    mode: "FIXTURE_ORACLE",
    datasetId: dataset.datasetId,
    datasetVersion: dataset.datasetVersion,
    stages,
    episodes,
    rawJourneyPassRate: episodes.length === 0 ? 0 : passedJourneys / episodes.length,
  };
}
