import type { ModelGateway, ModelResponse } from "../core/model/contracts.js";
import { applyDecisionStatePatch } from "./restaurant-decision-eval-reducer.js";
import {
  RestaurantDecisionEvalModelContract,
  type DecisionEvalModelCandidateContext,
  type DecisionEvalModelAttempt,
  type DecisionEvalModelProposal,
} from "./restaurant-decision-eval-model-contract.js";
import {
  applyTrustedNamedTargetResolution,
  decideRestaurantEvalTurn,
  type DecisionEvalKernelDecision,
} from "./restaurant-decision-eval-decision-kernel.js";
import {
  applyDecisionEvalRelativeTimeToPatch,
  applyDecisionEvalRelativeTimeToState,
  resolveDecisionEvalRelativeTime,
  type DecisionEvalRelativeTimeResolution,
} from "./restaurant-decision-eval-relative-time.js";
import {
  runRestaurantDecisionEvalPreflight,
  type DecisionEvalPreflightReport,
} from "./restaurant-decision-eval-preflight.js";
import {
  DECISION_EVAL_STAGE_IDS,
  scoreDecisionEpisode,
  type DecisionEvalEpisodeScore,
  type DecisionEvalStageId,
  type DecisionEvalStageStatus,
  type DecisionEvalTurnScore,
} from "./restaurant-decision-eval-scorer.js";
import type {
  DecisionEvalDataset,
  DecisionEvalEpisode,
  DecisionEvalGroundingPrediction,
  DecisionEvalLabeledExpectation,
  DecisionEvalTurn,
  DecisionEvalTurnPrediction,
  DecisionState,
  RecommendationCandidateFixture,
  RecommendationCandidatePool,
} from "./restaurant-decision-eval-contract.js";

export const RESTAURANT_DECISION_EVAL_RUNNER_VERSION = "4";

/**
 * A fixture model only proves the Runner wiring. REAL_MODEL_MOCK_WORLD still
 * uses the fixed Candidate Fixture; it never reaches a live Discovery source.
 */
export type DecisionEvalRunnerMode = "FIXTURE_MODEL" | "REAL_MODEL_MOCK_WORLD";

export type DecisionEvalCandidateContextSource =
  | "NONE"
  | "VISIBLE_OPTIONS"
  | "FIXTURE_ELIGIBLE"
  | "OUTLET_DISCOVERY";

export type DecisionEvalEpisodeRunStatus =
  | "SCORED"
  | "MODEL_FAILURE"
  | "INVALID_MODEL_OUTPUT"
  | "INPUT_INVALID"
  | "HARNESS_ERROR";

export interface DecisionEvalRunnerOptions {
  mode: DecisionEvalRunnerMode;
  modelContract: RestaurantDecisionEvalModelContract;
  /** Omit to run every fully labeled Episode after a strict dataset preflight. */
  episodeIds?: readonly string[];
  /**
   * Eval-only structured witness for the static fixture world. It deliberately
   * excludes raw prompts and natural-language model completions so it can be
   * rendered as a local diagnostic artifact without entering Gateway telemetry.
   */
  onTurnDiagnostic?: (diagnostic: DecisionEvalTurnDiagnostic) => void;
}

export interface DecisionEvalTurnRun {
  turnId: string;
  candidateContextSource: DecisionEvalCandidateContextSource;
  candidateContextIds: string[];
  /** S6 is a deterministic Fixture/Search result, never a model-provided value. */
  retrievedCandidateIds?: string[];
  modelAttempts: DecisionEvalModelAttempt[];
  status: "SCORED" | Exclude<DecisionEvalEpisodeRunStatus, "SCORED">;
  errors?: string[];
  errorCode?: string;
}

export interface DecisionEvalTurnDiagnostic {
  episodeId: string;
  turnId: string;
  /** Static Golden Fixture input only; never populated from a product session. */
  userMessage: string;
  candidateContext: {
    source: DecisionEvalCandidateContextSource;
    candidateIds: string[];
  };
  /** Eval-only trusted normalization derived from the fixed reference clock. */
  relativeTimeResolution?: DecisionEvalRelativeTimeResolution;
  /** The state actually supplied to the model, which may diverge after an earlier error. */
  modelInputState: DecisionState;
  /** Golden state before this turn, used for the isolated Patch-effect comparison in S1. */
  goldStateBefore: DecisionState;
  expected: {
    statePatch: DecisionEvalLabeledExpectation["statePatch"];
    stateAfter: DecisionState;
    readiness: DecisionEvalLabeledExpectation["readiness"];
    acceptableNextActions: DecisionEvalLabeledExpectation["acceptableNextActions"];
  };
  actual?: {
    /** Raw model Patch before trusted relative-time facts are composed. */
    modelStatePatch: DecisionEvalModelProposal["statePatch"];
    /** Effective Patch used for state/scoring after trusted composition. */
    statePatch: DecisionEvalModelProposal["statePatch"];
    /** The model Patch applied to the same Golden predecessor as the expected Patch. */
    stateEffectOnGoldState: DecisionState;
    /** The state that continues to the next model turn. */
    accumulatedState: DecisionState;
    /** Kernel output derived from trusted state and Fixture/Search context. */
    readiness: DecisionEvalKernelDecision["readiness"];
    nextAction: DecisionEvalKernelDecision["nextAction"];
    recommendation?: DecisionEvalKernelDecision["recommendation"];
    rankedCandidateIds?: DecisionEvalModelProposal["rankedCandidateIds"];
  };
  result: {
    status: DecisionEvalTurnRun["status"];
    errorCode?: string;
    errors?: string[];
  };
  score?: DecisionEvalTurnScore;
}

export interface DecisionEvalEpisodeRun {
  episodeId: string;
  initialClarity: DecisionEvalEpisode["initialClarity"];
  targetKind: DecisionEvalEpisode["targetKind"];
  status: DecisionEvalEpisodeRunStatus;
  turns: DecisionEvalTurnRun[];
  score?: DecisionEvalEpisodeScore;
}

export interface DecisionEvalRunnerSummary {
  modelCalls: number;
  schemaRetryCalls: number;
  totalLatencyMs: number;
  providerModels: string[];
  stages: Record<DecisionEvalStageId, Record<DecisionEvalStageStatus, number>>;
  firstFailureStages: Partial<Record<DecisionEvalStageId, number>>;
  p0ErrorCodes: string[];
}

export type DecisionEvalRunnerReport =
  | {
      runnerVersion: typeof RESTAURANT_DECISION_EVAL_RUNNER_VERSION;
      mode: DecisionEvalRunnerMode;
      status: "BLOCKED_PREFLIGHT";
      preflight: DecisionEvalPreflightReport;
      episodes: [];
    }
  | {
      runnerVersion: typeof RESTAURANT_DECISION_EVAL_RUNNER_VERSION;
      mode: DecisionEvalRunnerMode;
      status: "COMPLETED";
      /** Candidate IDs and Fact fixtures are deterministic Mock World input. */
      candidateWorld: "GOLDEN_FIXTURE";
      preflight: DecisionEvalPreflightReport;
      datasetId: string;
      datasetVersion: string;
      episodes: DecisionEvalEpisodeRun[];
      summary: DecisionEvalRunnerSummary;
    };

function emptyStageCounts(): DecisionEvalRunnerSummary["stages"] {
  return Object.fromEntries(
    DECISION_EVAL_STAGE_IDS.map((stage) => [
      stage,
      { PASS: 0, FAIL: 0, BLOCKED_BY_UPSTREAM: 0, NOT_APPLICABLE: 0 },
    ]),
  ) as DecisionEvalRunnerSummary["stages"];
}

function selectedEpisodes(
  dataset: DecisionEvalDataset,
  episodeIds: readonly string[] | undefined,
): DecisionEvalEpisode[] {
  if (episodeIds === undefined) return dataset.episodes;
  const wanted = new Set(episodeIds);
  if (wanted.size !== episodeIds.length) {
    throw new Error("Decision Eval Runner episodeIds must not contain duplicates");
  }
  const episodes = dataset.episodes.filter((episode) => wanted.has(episode.id));
  if (episodes.length !== wanted.size) {
    const found = new Set(episodes.map((episode) => episode.id));
    const missing = episodeIds.filter((episodeId) => !found.has(episodeId));
    throw new Error(`Decision Eval Runner requested unknown episodes: ${missing.join(", ")}`);
  }
  return episodes;
}

function poolFor(
  dataset: DecisionEvalDataset,
  episode: DecisionEvalEpisode,
): RecommendationCandidatePool {
  if (episode.candidatePoolRef === undefined) {
    throw new Error(`Decision Eval Episode ${episode.id} has no Candidate Fixture pool`);
  }
  const pool = dataset.candidatePools.find((item) => item.id === episode.candidatePoolRef);
  if (pool === undefined) {
    throw new Error(`Decision Eval Episode ${episode.id} references missing pool ${episode.candidatePoolRef}`);
  }
  return pool;
}

function expectationFor(turn: DecisionEvalTurn): DecisionEvalLabeledExpectation {
  if (turn.expected.annotationStatus !== "LABELED") {
    throw new Error(`Decision Eval Runner requires a labeled turn: ${turn.id}`);
  }
  return turn.expected;
}

function candidateContextPlan(
  turn: DecisionEvalTurn,
  expected: DecisionEvalLabeledExpectation,
): { source: DecisionEvalCandidateContextSource; candidateIds: string[] } {
  if (turn.visibleOptionIds !== undefined) {
    return { source: "VISIBLE_OPTIONS", candidateIds: [...turn.visibleOptionIds] };
  }
  if (expected.retrieval !== undefined) {
    return { source: "FIXTURE_ELIGIBLE", candidateIds: [...expected.retrieval.eligibleCandidateIds] };
  }
  if (expected.outletDiscovery !== undefined) {
    return { source: "OUTLET_DISCOVERY", candidateIds: [...expected.outletDiscovery.candidateIds] };
  }
  return { source: "NONE", candidateIds: [] };
}

function candidateContext(
  pool: RecommendationCandidatePool,
  candidateIds: readonly string[],
): Array<{ id: string; facts: RecommendationCandidateFixture["facts"] }> | undefined {
  if (candidateIds.length === 0) return undefined;
  if (candidateIds.length > 8) {
    throw new Error("Decision Eval Runner Candidate Fixture context exceeds the Model Contract limit of 8");
  }
  const candidates = new Map(pool.candidates.map((candidate) => [candidate.id, candidate]));
  return candidateIds.map((candidateId) => {
    const candidate = candidates.get(candidateId);
    if (candidate === undefined) {
      throw new Error(`Decision Eval Runner Candidate Fixture is missing ${candidateId}`);
    }
    if (candidate.facts.length > 20) {
      throw new Error(`Decision Eval Runner Candidate Fixture ${candidateId} exceeds the Model Contract fact limit`);
    }
    return { id: candidate.id, facts: structuredClone(candidate.facts) };
  });
}

function predictionFromProposal(
  proposal: DecisionEvalModelProposal,
  expected: DecisionEvalLabeledExpectation,
  kernel: DecisionEvalKernelDecision,
): DecisionEvalTurnPrediction {
  return {
    statePatch: proposal.statePatch,
    readiness: kernel.readiness,
    nextAction: kernel.nextAction,
    ...(expected.retrieval === undefined
      ? {}
      : { retrievedCandidateIds: structuredClone(expected.retrieval.eligibleCandidateIds) }),
    ...(kernel.recommendation === undefined ? {} : { recommendation: kernel.recommendation }),
    grounding: kernel.grounding,
  };
}

function summarize(episodes: readonly DecisionEvalEpisodeRun[]): DecisionEvalRunnerSummary {
  const stages = emptyStageCounts();
  const firstFailureStages: DecisionEvalRunnerSummary["firstFailureStages"] = {};
  const p0ErrorCodes = new Set<string>();
  const attempts = episodes.flatMap((episode) => episode.turns.flatMap((turn) => turn.modelAttempts));

  for (const episode of episodes) {
    for (const turn of episode.score?.turns ?? []) {
      for (const result of turn.stages) {
        stages[result.stage][result.status] += 1;
        for (const errorCode of result.errorCodes) {
          if (errorCode.startsWith("P0_")) p0ErrorCodes.add(errorCode);
        }
      }
      if (turn.firstFailureStage !== undefined) {
        firstFailureStages[turn.firstFailureStage] =
          (firstFailureStages[turn.firstFailureStage] ?? 0) + 1;
      }
    }
  }

  return {
    modelCalls: attempts.length,
    schemaRetryCalls: Math.max(0, attempts.length - episodes.reduce(
      (total, episode) => total + episode.turns.filter((turn) => turn.modelAttempts.length > 0).length,
      0,
    )),
    totalLatencyMs: attempts.reduce((total, attempt) => total + attempt.latencyMs, 0),
    providerModels: [...new Set(attempts.map((attempt) => `${attempt.provider}:${attempt.model}`))].sort(),
    stages,
    firstFailureStages,
    p0ErrorCodes: [...p0ErrorCodes].sort(),
  };
}

function emitTurnDiagnostic(
  options: DecisionEvalRunnerOptions,
  diagnostic: DecisionEvalTurnDiagnostic,
): void {
  try {
    options.onTurnDiagnostic?.(structuredClone(diagnostic));
  } catch {
    // A diagnostic observer must never change a fail-closed Eval result.
  }
}

/**
 * Executes a fully labeled multi-turn dataset without touching Task Runtime,
 * Authorization, external Discovery, or any side-effect adapter. Candidate
 * context and S6 retrieval come only from the explicit Golden Fixture world.
 */
export async function runRestaurantDecisionEvalEpisodes(
  dataset: DecisionEvalDataset,
  options: DecisionEvalRunnerOptions,
): Promise<DecisionEvalRunnerReport> {
  const preflight = runRestaurantDecisionEvalPreflight(dataset, "REQUIRE_COMPLETE");
  if (preflight.status !== "READY_FOR_EVALUATOR") {
    return {
      runnerVersion: RESTAURANT_DECISION_EVAL_RUNNER_VERSION,
      mode: options.mode,
      status: "BLOCKED_PREFLIGHT",
      preflight,
      episodes: [],
    };
  }

  const runs: DecisionEvalEpisodeRun[] = [];
  for (const episode of selectedEpisodes(dataset, options.episodeIds)) {
    const pool = poolFor(dataset, episode);
    const predictions = new Map<string, DecisionEvalTurnPrediction>();
    const turns: DecisionEvalTurnRun[] = [];
    const diagnosticDrafts: Array<Omit<DecisionEvalTurnDiagnostic, "score">> = [];
    let state = structuredClone(episode.initialState);
    let goldState = structuredClone(episode.initialState);
    let failure: DecisionEvalEpisodeRunStatus | undefined;

    for (const turn of episode.turns) {
      if (failure !== undefined) break;
      const expected = expectationFor(turn);
      const relativeTimeResolution = resolveDecisionEvalRelativeTime(
        turn.userMessage,
        episode.referenceTime,
        episode.timezone,
      );
      state = applyDecisionEvalRelativeTimeToState(state, relativeTimeResolution);
      goldState = applyDecisionEvalRelativeTimeToState(goldState, relativeTimeResolution);
      const contextPlan = candidateContextPlan(turn, expected);
      const modelInputState = structuredClone(state);
      const goldStateBefore = structuredClone(goldState);
      const expectedStateAfter = applyDecisionStatePatch(goldStateBefore, expected.statePatch);
      let context: ReturnType<typeof candidateContext>;
      try {
        context = candidateContext(pool, contextPlan.candidateIds);
      } catch (error) {
        const errors = [error instanceof Error ? error.message : "Candidate Fixture context preparation failed"];
        turns.push({
          turnId: turn.id,
          candidateContextSource: contextPlan.source,
          candidateContextIds: contextPlan.candidateIds,
          modelAttempts: [],
          status: "HARNESS_ERROR",
          errors,
        });
        diagnosticDrafts.push({
          episodeId: episode.id,
          turnId: turn.id,
          userMessage: turn.userMessage,
          candidateContext: { source: contextPlan.source, candidateIds: structuredClone(contextPlan.candidateIds) },
          ...(relativeTimeResolution === undefined ? {} : { relativeTimeResolution }),
          modelInputState,
          goldStateBefore,
          expected: {
            statePatch: structuredClone(expected.statePatch),
            stateAfter: expectedStateAfter,
            readiness: expected.readiness,
            acceptableNextActions: structuredClone(expected.acceptableNextActions),
          },
          result: { status: "HARNESS_ERROR", errors },
        });
        failure = "HARNESS_ERROR";
        break;
      }

      const result = await options.modelContract.propose({
        taskId: `eval:decision:${episode.id}:${turn.id}`,
        turnId: turn.id,
        userMessage: turn.userMessage,
        referenceTime: episode.referenceTime,
        timezone: episode.timezone,
        accumulatedState: state,
        ...(episode.namedTargetResolution === undefined
          ? {}
          : { namedTargetResolution: episode.namedTargetResolution }),
        ...(context === undefined ? {} : { candidateContext: context }),
      });

      if (result.status === "PARSED") {
        const effectiveStatePatch = applyDecisionEvalRelativeTimeToPatch(
          state,
          result.proposal.statePatch,
          relativeTimeResolution,
        );
        const extractedProposal: DecisionEvalModelProposal = {
          ...result.proposal,
          statePatch: effectiveStatePatch,
        };
        const effectiveProposal: DecisionEvalModelProposal = {
          ...extractedProposal,
          statePatch: applyTrustedNamedTargetResolution(
            state,
            extractedProposal.statePatch,
            episode.namedTargetResolution?.target,
          ),
        };
        const nextState = applyDecisionStatePatch(state, effectiveProposal.statePatch);
        const stateEffectOnGoldState = applyDecisionStatePatch(goldStateBefore, effectiveProposal.statePatch);
        const kernel = decideRestaurantEvalTurn({
          state: nextState,
          ...(expected.retrieval === undefined
            ? {}
            : { retrievedCandidateIds: expected.retrieval.eligibleCandidateIds }),
          ...(context === undefined ? {} : { candidateContext: context }),
          ...(expected.recommendation?.mustExplainInsufficientCandidates === true
            ? { retrievalSufficiency: "LIMITED" as const }
            : { retrievalSufficiency: "ADEQUATE" as const }),
          hasVisibleOptions: turn.visibleOptionIds !== undefined,
          hasPreferenceUpdate:
            effectiveProposal.statePatch.add?.preferences !== undefined ||
            effectiveProposal.statePatch.remove?.preferences !== undefined,
          ...(effectiveProposal.rankedCandidateIds === undefined
            ? {}
            : { rankedCandidateIds: effectiveProposal.rankedCandidateIds }),
        });
        const prediction = predictionFromProposal(
          effectiveProposal,
          expected,
          kernel,
        );
        predictions.set(turn.id, prediction);
        state = nextState;
        goldState = expectedStateAfter;
        turns.push({
          turnId: turn.id,
          candidateContextSource: contextPlan.source,
          candidateContextIds: contextPlan.candidateIds,
          ...(prediction.retrievedCandidateIds === undefined
            ? {}
            : { retrievedCandidateIds: prediction.retrievedCandidateIds }),
          modelAttempts: result.attempts,
          status: "SCORED",
        });
        diagnosticDrafts.push({
          episodeId: episode.id,
          turnId: turn.id,
          userMessage: turn.userMessage,
          candidateContext: { source: contextPlan.source, candidateIds: structuredClone(contextPlan.candidateIds) },
          ...(relativeTimeResolution === undefined ? {} : { relativeTimeResolution }),
          modelInputState,
          goldStateBefore,
          expected: {
            statePatch: structuredClone(expected.statePatch),
            stateAfter: expectedStateAfter,
            readiness: expected.readiness,
            acceptableNextActions: structuredClone(expected.acceptableNextActions),
          },
          actual: {
            modelStatePatch: structuredClone(result.proposal.statePatch),
            statePatch: structuredClone(effectiveProposal.statePatch),
            stateEffectOnGoldState,
            accumulatedState: structuredClone(nextState),
            readiness: kernel.readiness,
            nextAction: structuredClone(kernel.nextAction),
            ...(kernel.recommendation === undefined
              ? {}
              : { recommendation: structuredClone(kernel.recommendation) }),
            ...(result.proposal.rankedCandidateIds === undefined
              ? {}
              : { rankedCandidateIds: structuredClone(result.proposal.rankedCandidateIds) }),
          },
          result: { status: "SCORED" },
        });
        continue;
      }

      const status: Exclude<DecisionEvalEpisodeRunStatus, "SCORED" | "HARNESS_ERROR"> = result.status;
      turns.push({
        turnId: turn.id,
        candidateContextSource: contextPlan.source,
        candidateContextIds: contextPlan.candidateIds,
        modelAttempts: result.attempts,
        status,
        ...(result.status === "MODEL_FAILURE"
          ? { errorCode: result.errorCode }
          : { errors: result.errors }),
      });
      diagnosticDrafts.push({
        episodeId: episode.id,
        turnId: turn.id,
        userMessage: turn.userMessage,
        candidateContext: { source: contextPlan.source, candidateIds: structuredClone(contextPlan.candidateIds) },
        ...(relativeTimeResolution === undefined ? {} : { relativeTimeResolution }),
        modelInputState,
        goldStateBefore,
        expected: {
          statePatch: structuredClone(expected.statePatch),
          stateAfter: expectedStateAfter,
          readiness: expected.readiness,
          acceptableNextActions: structuredClone(expected.acceptableNextActions),
        },
        result: result.status === "MODEL_FAILURE"
          ? { status, errorCode: result.errorCode }
          : { status, errors: structuredClone(result.errors) },
      });
      failure = status;
    }

    if (failure !== undefined) {
      for (const diagnostic of diagnosticDrafts) emitTurnDiagnostic(options, diagnostic);
      runs.push({
        episodeId: episode.id,
        initialClarity: episode.initialClarity,
        targetKind: episode.targetKind,
        status: failure,
        turns,
      });
      continue;
    }

    try {
      const score = scoreDecisionEpisode(episode, predictions, pool);
      const scoresByTurn = new Map(score.turns.map((turn) => [turn.turnId, turn]));
      runs.push({
        episodeId: episode.id,
        initialClarity: episode.initialClarity,
        targetKind: episode.targetKind,
        status: "SCORED",
        turns,
        score,
      });
      for (const diagnostic of diagnosticDrafts) {
        const turnScore = scoresByTurn.get(diagnostic.turnId);
        emitTurnDiagnostic(
          options,
          turnScore === undefined ? diagnostic : { ...diagnostic, score: turnScore },
        );
      }
    } catch (error) {
      runs.push({
        episodeId: episode.id,
        initialClarity: episode.initialClarity,
        targetKind: episode.targetKind,
        status: "HARNESS_ERROR",
        turns,
      });
    }
  }

  return {
    runnerVersion: RESTAURANT_DECISION_EVAL_RUNNER_VERSION,
    mode: options.mode,
    status: "COMPLETED",
    candidateWorld: "GOLDEN_FIXTURE",
    preflight,
    datasetId: dataset.datasetId,
    datasetVersion: dataset.datasetVersion,
    episodes: runs,
    summary: summarize(runs),
  };
}

function proposalFromGolden(expected: DecisionEvalLabeledExpectation): DecisionEvalModelProposal {
  return {
    statePatch: structuredClone(expected.statePatch),
    ...(expected.recommendation === undefined
      ? {}
      : { rankedCandidateIds: structuredClone(expected.recommendation.allowedCandidateIds) }),
  };
}

/**
 * Deterministic local double for Runner wiring. It only emits labeled Fixture
 * proposals and is never used to claim model quality or to replace DeepSeek.
 */
export class GoldenDecisionEvalFixtureGateway implements ModelGateway {
  private sequence = 0;
  private readonly proposals = new Map<string, DecisionEvalModelProposal>();

  constructor(dataset: DecisionEvalDataset) {
    for (const episode of dataset.episodes) {
      for (const turn of episode.turns) {
        if (turn.expected.annotationStatus !== "LABELED") continue;
        this.proposals.set(
          `eval:decision:${episode.id}:${turn.id}`,
          proposalFromGolden(turn.expected),
        );
      }
    }
  }

  async complete(request: Parameters<ModelGateway["complete"]>[0]): Promise<ModelResponse> {
    const proposal = this.proposals.get(request.taskId);
    if (proposal === undefined) {
      throw new Error(`Golden Decision Fixture has no proposal for ${request.taskId}`);
    }
    this.sequence += 1;
    return {
      invocationId: `fixture-decision-${this.sequence}`,
      provider: "FIXTURE",
      model: "fixture-decision-golden-v1",
      outputText: JSON.stringify(proposal),
      finishReason: "STOP",
      latencyMs: 0,
    };
  }
}
