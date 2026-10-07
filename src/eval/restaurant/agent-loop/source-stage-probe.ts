import { createHash } from "node:crypto";

import type { LivePreflightTarget } from "./live-preflight.js";
import type { BrowserExecutionDiagnostic } from "../../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime } from "../../../infrastructure/browser/browser-runtime.js";
import { discoveryPackNetworkPolicy, type DiscoverySourcePack } from "../../../integrations/restaurant-search/source-packs.js";
import { restaurantSearchIntentFingerprint, type RestaurantSearchIntent, type RestaurantSearchRead } from "../../../domains/restaurant/contracts.js";
import { NativeRestaurantSearch } from "../../../integrations/restaurant-search/native-restaurant-search.js";
import { GooglePlacesRestaurantSearch } from "../../../integrations/google/google-places-restaurant-search.js";
import type { BrowserReadActionDecisionPort } from "../../../infrastructure/browser/browser-action-decision.js";
import type { BrowserExecutionBudget } from "../../../infrastructure/browser/browser-task-executor.js";

/**
 * Phase-three source probes deliberately retain planning and execution facts
 * separately. A plan is not an execution result and cannot satisfy any
 * source-matrix threshold by itself.
 */
export const SOURCE_STAGE_PROBE_VERSION = "source-stage-probe@4";

export type SourceStageProbeStage = "DISCOVERY" | "IDENTITY" | "AVAILABILITY" | "WEBSITE_FACTS";
export type SourceStageProbeMode = "PLAN_ONLY" | "LIVE_READ_ONLY" | "REPLAY";
export type SourceStageProbeEvaluatorApplicability = "REUSE_RESTAURANT_EVALUATOR" | "NOT_APPLICABLE";

export interface SourceStageProbeBudget {
  sampleMaxElapsedMs: number;
  sampleMaxModelCalls: number;
  matrixMaxModelCalls: number;
  matrixMaxElapsedMs: number;
  matrixRepairRoundsMax: number;
  stageActualModelCallsMax: number;
}

export interface SourceStageProbeSample {
  /** Stable, operator-reviewed key; it cannot be a discovered outlet substitute. */
  id: string;
  /** Opaque SourcePack id. The runner never switches on a marketplace name. */
  sourcePackId: string;
  /** Immutable input descriptor with no credential, cookie, token, or free-text page capture. */
  input: Record<string, unknown>;
}

export interface SourceStageProbeManifestInput {
  stage: SourceStageProbeStage;
  mode: SourceStageProbeMode;
  samples: readonly SourceStageProbeSample[];
  budget: SourceStageProbeBudget;
  sourceDataset: { path: string; sha256: string; contamination: "PROMPT_AND_RESULT_EXPOSED" };
  network: { proxyMode: "ENVIRONMENT" | "DISABLED_BY_CLI"; preflightTargets: readonly LivePreflightTarget[] };
  /** Every newly created manifest freezes its browser runtime before any execution. */
  runtime: { browserEngine: "LOCAL_CHROMIUM" | "KITESURF" };
  /** Phase repair-round provenance, when a matrix is rerun after a retained failure. */
  round?: { number: number; reason: string; reusesManifest?: string };
  /** Optional capture is explicit so a failed live source read cannot disappear without a Replay disposition. */
  recording?: { enabled: boolean; requiredOnFailure: boolean };
}

export interface SourceStageProbeManifest {
  schemaVersion: typeof SOURCE_STAGE_PROBE_VERSION;
  status: "PLANNED";
  stage: SourceStageProbeStage;
  mode: SourceStageProbeMode;
  samples: readonly SourceStageProbeSample[];
  budget: SourceStageProbeBudget;
  sourceDataset: SourceStageProbeManifestInput["sourceDataset"];
  network: SourceStageProbeManifestInput["network"];
  runtime: SourceStageProbeManifestInput["runtime"];
  round?: NonNullable<SourceStageProbeManifestInput["round"]>;
  recording: { enabled: boolean; requiredOnFailure: boolean };
  evaluator: { applicability: SourceStageProbeEvaluatorApplicability; reason: string };
  attemptAccounting: {
    allSamplesAreDenominator: true;
    failedPreflightIsRetained: true;
    replayFallbackNetworkDisabled: true;
  };
}

function validSampleId(value: string): boolean {
  return /^[a-z0-9][a-z0-9._:-]{0,119}$/i.test(value);
}

function assertBudget(budget: SourceStageProbeBudget): void {
  for (const [field, value] of Object.entries(budget)) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Source-stage ${field} must be a positive safe integer`);
  }
  if (budget.sampleMaxElapsedMs > 60_000) throw new Error("Source-stage sample elapsed budget cannot exceed 60000ms");
  if (budget.sampleMaxModelCalls > 2) throw new Error("Source-stage sample model budget cannot exceed 2 calls");
  if (budget.matrixMaxModelCalls > 50) throw new Error("Source-stage matrix model budget cannot exceed 50 calls");
  if (budget.matrixMaxElapsedMs > 1_800_000) throw new Error("Source-stage matrix elapsed budget cannot exceed 30 minutes");
  if (budget.matrixRepairRoundsMax > 3) throw new Error("Source-stage repair rounds cannot exceed 3");
  if (budget.stageActualModelCallsMax > 150) throw new Error("Source-stage actual model ceiling cannot exceed 150 calls");
}

function evaluatorFor(stage: SourceStageProbeStage): SourceStageProbeManifest["evaluator"] {
  if (stage === "IDENTITY" || stage === "AVAILABILITY" || stage === "WEBSITE_FACTS") {
    return {
      applicability: "REUSE_RESTAURANT_EVALUATOR",
      reason: "Actual grounded identity, availability, or source-fact claims require the existing independent restaurant evaluator; this manifest supplies no claim by itself.",
    };
  }
  return {
    applicability: "NOT_APPLICABLE",
    reason: "Discovery parse and current explicit-empty observations do not establish a restaurant claim or user-goal completion.",
  };
}

/** Validates an immutable manifest before a preflight or source/model call can begin. */
export function createSourceStageProbeManifest(input: SourceStageProbeManifestInput): SourceStageProbeManifest {
  assertBudget(input.budget);
  if (!input.samples.length) throw new Error("Source-stage manifest requires at least one planned sample");
  const ids = new Set<string>();
  for (const sample of input.samples) {
    if (!validSampleId(sample.id) || !sample.sourcePackId.trim()) throw new Error("Source-stage sample must have a safe id and an opaque source-pack id");
    if (ids.has(sample.id)) throw new Error(`Duplicate source-stage sample id: ${sample.id}`);
    ids.add(sample.id);
    if (!sample.input || Array.isArray(sample.input)) throw new Error(`Source-stage sample ${sample.id} requires an input object`);
  }
  if (!input.network.preflightTargets.length) throw new Error("Source-stage manifest requires preflight targets");
  if (!input.runtime || (input.runtime.browserEngine !== "LOCAL_CHROMIUM" && input.runtime.browserEngine !== "KITESURF")) {
    throw new Error("Source-stage manifest must freeze a supported browser engine");
  }
  if (input.round && (!Number.isSafeInteger(input.round.number) || input.round.number < 1 || input.round.number > 3 || !input.round.reason.trim())) {
    throw new Error("Source-stage repair-round metadata is invalid");
  }
  return {
    schemaVersion: SOURCE_STAGE_PROBE_VERSION,
    status: "PLANNED",
    stage: input.stage,
    mode: input.mode,
    samples: input.samples.map((sample) => ({ id: sample.id, sourcePackId: sample.sourcePackId, input: structuredClone(sample.input) })),
    budget: { ...input.budget },
    sourceDataset: { ...input.sourceDataset },
    network: { proxyMode: input.network.proxyMode, preflightTargets: [...new Set(input.network.preflightTargets)] },
    runtime: { browserEngine: input.runtime.browserEngine },
    ...(input.round ? { round: { number: input.round.number, reason: input.round.reason, ...(input.round.reusesManifest ? { reusesManifest: input.round.reusesManifest } : {}) } } : {}),
    recording: { enabled: input.recording?.enabled ?? false, requiredOnFailure: input.recording?.requiredOnFailure ?? false },
    evaluator: evaluatorFor(input.stage),
    attemptAccounting: { allSamplesAreDenominator: true, failedPreflightIsRetained: true, replayFallbackNetworkDisabled: true },
  };
}

/** Stable public input digest for operator review; it is not an outlet identity or result claim. */
export function sourceStageManifestFingerprint(manifest: SourceStageProbeManifest): string {
  return createHash("sha256").update(JSON.stringify({
    schemaVersion: manifest.schemaVersion,
    stage: manifest.stage,
    mode: manifest.mode,
    samples: manifest.samples,
    budget: manifest.budget,
    sourceDataset: manifest.sourceDataset,
    network: manifest.network,
    runtime: manifest.runtime,
    round: manifest.round,
    recording: manifest.recording,
  })).digest("hex");
}

/**
 * A completed source sample must retain its actual start, settlement and any
 * no-coverage Replay disposition. This is intentionally a transport ledger,
 * not a second restaurant scorer.
 */
export type SourceStageGuardAssessment = "FALSE_GUARD_BLOCK" | "CORRECT_NONESSENTIAL_BLOCK" | "NOT_ASSESSED";

export interface SourceStageProbeAttempt {
  sampleId: string;
  status: "SUCCEEDED" | "FAILED" | "NO_COVERAGE" | "NOT_RUN";
  elapsedMs: number;
  modelCallsStarted: number;
  preflightArtifactPath?: string;
  resultArtifactPath?: string;
  evaluationArtifactPath?: string;
  acceptanceArtifactPath?: string;
  failureCode?: string;
  /** Discovery coverage is intentionally narrower than a parsed or radius-filtered list. */
  discoveryCoverage?: "REGION_FILTERED_LIST_ONLY" | "NO_COVERAGE";
  /** A missing diagnostic is not evidence of zero false Guard blocks. */
  guardAssessment?: SourceStageGuardAssessment;
  replay: "REPLAYED" | "NO_COVERAGE" | "NOT_APPLICABLE";
}

export interface SourceStageAttemptSummaryOptions {
  /** Matrix wall time begins before preflight and retains its actual cost. */
  matrixElapsedMs?: number;
}

function nonNegativeSafeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Source-stage ${field} must be a non-negative safe integer`);
}

export function sourceStageSampleBudgetViolations(manifest: SourceStageProbeManifest, attempt: Pick<SourceStageProbeAttempt, "sampleId" | "elapsedMs" | "modelCallsStarted">) {
  nonNegativeSafeInteger(attempt.elapsedMs, `attempt ${attempt.sampleId} elapsedMs`);
  nonNegativeSafeInteger(attempt.modelCallsStarted, `attempt ${attempt.sampleId} modelCallsStarted`);
  return {
    ...(attempt.elapsedMs > manifest.budget.sampleMaxElapsedMs ? { elapsedMs: { actual: attempt.elapsedMs, limit: manifest.budget.sampleMaxElapsedMs } } : {}),
    ...(attempt.modelCallsStarted > manifest.budget.sampleMaxModelCalls ? { modelCallsStarted: { actual: attempt.modelCallsStarted, limit: manifest.budget.sampleMaxModelCalls } } : {}),
  };
}

/**
 * Retains every completed attempt, including overspend. Budget violations are
 * accounting facts for acceptance, not an excuse to discard the matrix ledger.
 */
export function summarizeSourceStageAttempts(
  manifest: SourceStageProbeManifest,
  attempts: readonly SourceStageProbeAttempt[],
  options: SourceStageAttemptSummaryOptions = {},
) {
  const byId = new Map(attempts.map((attempt) => [attempt.sampleId, attempt]));
  if (byId.size !== attempts.length || attempts.some((attempt) => !manifest.samples.some((sample) => sample.id === attempt.sampleId))) {
    throw new Error("Source-stage attempts must map one-to-one to planned sample ids");
  }
  for (const attempt of attempts) sourceStageSampleBudgetViolations(manifest, attempt);
  const matrixElapsedMs = options.matrixElapsedMs ?? attempts.reduce((total, attempt) => total + attempt.elapsedMs, 0);
  nonNegativeSafeInteger(matrixElapsedMs, "matrix elapsedMs");
  const missing = manifest.samples.filter((sample) => !byId.has(sample.id)).map((sample) => sample.id);
  const totalModelCalls = attempts.reduce((total, attempt) => total + attempt.modelCallsStarted, 0);
  const budgetViolations = {
    sampleElapsedMs: attempts.flatMap((attempt) => {
      const violation = sourceStageSampleBudgetViolations(manifest, attempt).elapsedMs;
      return violation ? [{ sampleId: attempt.sampleId, ...violation }] : [];
    }),
    sampleModelCalls: attempts.flatMap((attempt) => {
      const violation = sourceStageSampleBudgetViolations(manifest, attempt).modelCallsStarted;
      return violation ? [{ sampleId: attempt.sampleId, ...violation }] : [];
    }),
    matrixModelCalls: totalModelCalls > manifest.budget.matrixMaxModelCalls
      ? { actual: totalModelCalls, limit: manifest.budget.matrixMaxModelCalls } : undefined,
    matrixElapsedMs: matrixElapsedMs > manifest.budget.matrixMaxElapsedMs
      ? { actual: matrixElapsedMs, limit: manifest.budget.matrixMaxElapsedMs } : undefined,
    stageActualModelCalls: totalModelCalls > manifest.budget.stageActualModelCallsMax
      ? { actual: totalModelCalls, limit: manifest.budget.stageActualModelCallsMax } : undefined,
  };
  const falseGuardBlocks = attempts.filter((attempt) => attempt.guardAssessment === "FALSE_GUARD_BLOCK").map((attempt) => attempt.sampleId);
  const guardAssessment = falseGuardBlocks.length
    ? "FALSE_GUARD_BLOCK" as const
    : attempts.length > 0 && attempts.every((attempt) => attempt.guardAssessment === "CORRECT_NONESSENTIAL_BLOCK")
      ? "NO_FALSE_GUARD_BLOCKS" as const
      : "NOT_ASSESSED" as const;
  return {
    plannedSampleCount: manifest.samples.length,
    attemptedSampleCount: attempts.length,
    missingSampleIds: missing,
    statuses: Object.fromEntries(manifest.samples.map((sample) => [sample.id, byId.get(sample.id)?.status ?? "NOT_RUN"])),
    totalModelCalls,
    matrixElapsedMs,
    budgetViolations,
    budgetCompliant: budgetViolations.sampleElapsedMs.length === 0
      && budgetViolations.sampleModelCalls.length === 0
      && budgetViolations.matrixModelCalls === undefined
      && budgetViolations.matrixElapsedMs === undefined
      && budgetViolations.stageActualModelCalls === undefined,
    falseGuardBlocks,
    guardAssessment,
    completeDenominator: missing.length === 0,
  } as const;
}

export interface SourceStageNativeDiscoveryExecutionInput {
  pack: DiscoverySourcePack;
  intent: RestaurantSearchIntent;
  /** A separately frozen Google named-location result; it prevents every Pack from resolving the same place again. */
  locationContext?: { latitude: number; longitude: number; radiusMeters: number; label: string; areaMatchBasis: "NAMED_PLACE_RADIUS" | "TASK_LOCATION_RADIUS" | "EVALUATION_LOCATION_RADIUS" };
  runtime: BrowserRuntime;
  locality: GooglePlacesRestaurantSearch;
  readRunId: string;
  timeoutMs: number;
  signal: AbortSignal;
  modelDecision?: BrowserReadActionDecisionPort;
  browserBudget?: BrowserExecutionBudget;
  onDiagnostic?: (event: BrowserExecutionDiagnostic) => void;
  now?: () => string;
}

export type SourceStageNativeDiscoveryExecutionResult = {
  status: "LIST_OBSERVED" | "EXPLICIT_EMPTY" | "NO_COVERAGE" | "SOURCE_FAILED";
  /** Candidate radius admission is distinct from proof that the listing query stayed on the frozen region. */
  discoveryCoverage: "REGION_FILTERED_LIST_ONLY" | "NO_COVERAGE";
  packId: string;
  elapsedMs: number;
  read: RestaurantSearchRead;
  modelCallsStarted: number;
  failureCode?: string;
};

export async function runSourceStageNativeDiscoveryProbe(
  input: SourceStageNativeDiscoveryExecutionInput,
): Promise<SourceStageNativeDiscoveryExecutionResult> {
  if (!Number.isSafeInteger(input.timeoutMs) || input.timeoutMs < 1 || input.timeoutMs > 60_000) {
    throw new Error("Source-stage native discovery timeout must be 1..60000ms");
  }
  const startedAt = Date.now();
  const budget = input.browserBudget ?? { totalModelCalls: 0, maxModelCalls: 2 };
  const native = new NativeRestaurantSearch(
    input.runtime,
    input.locality,
    input.now,
    undefined,
    input.modelDecision,
    budget,
    input.onDiagnostic,
    { maxOperationsPerCandidate: 24 },
    input.runtime.readNetworkBoundaryCapability === "ISOLATED_CONTEXT" ? discoveryPackNetworkPolicy([input.pack]) : undefined,
    [input.pack],
  );
  try {
    const read = await native.search({
      intent: input.intent,
      readRunId: input.readRunId,
      ...(input.locationContext ? {
        continuation: {
          intentFingerprint: restaurantSearchIntentFingerprint(input.intent),
          usedPageTokens: [], pagesRead: 0, exhausted: false,
          locationContext: input.locationContext,
        },
      } : {}),
    }, input.signal);
    const metadata = read.metadata as { failureCode?: string; nativeDiscoveryFunnel?: { parsedOutlets?: number; sourceExhausted?: boolean; sourceEnded?: boolean } };
    const funnel = metadata.nativeDiscoveryFunnel;
    const parsedOutlets = funnel?.parsedOutlets ?? read.candidates.length;
    const failureCode = metadata.failureCode;
    // A browser Pack can prove an explicit current empty only when it ended a
    // bounded source read without an adapter failure.  Generic parse absence
    // stays failed rather than becoming a stock or discovery success.
    // Existing production metadata proves exact-radius admission for candidates,
    // but does not preserve a source-independent "current regional query" marker.
    // Keep that narrower gap visible instead of turning parsed nationwide links
    // into a current-region discovery pass.
    const discoveryCoverage = read.candidates.length > 0
      ? "REGION_FILTERED_LIST_ONLY" as const
      : "NO_COVERAGE" as const;
    const status = failureCode
      ? "SOURCE_FAILED" as const
      : read.candidates.length > 0
        ? "LIST_OBSERVED" as const
        : parsedOutlets > 0
          ? "NO_COVERAGE" as const
          : funnel?.sourceEnded && funnel.sourceExhausted === true
            ? "EXPLICIT_EMPTY" as const
            : "SOURCE_FAILED" as const;
    return {
      status,
      discoveryCoverage,
      packId: input.pack.meta.id,
      elapsedMs: Date.now() - startedAt,
      read,
      modelCallsStarted: budget.totalModelCalls,
      ...(failureCode ? { failureCode } : status === "SOURCE_FAILED" ? { failureCode: "DISCOVERY_LIST_NOT_CURRENT_OR_PARSEABLE" } : {}),
    };
  } catch (error) {
    const failureCode = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code : "DISCOVERY_SOURCE_FAILED";
    throw Object.assign(error instanceof Error ? error : new Error("Native discovery source probe failed"), {
      code: failureCode,
      sourceStageModelCalls: budget.totalModelCalls,
    });
  }
}
