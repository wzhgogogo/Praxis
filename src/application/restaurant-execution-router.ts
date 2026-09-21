import type { RestaurantAgentAction } from "../domains/restaurant/agent-action.js";
import type {
  RestaurantAvailabilityCheck,
  RestaurantCandidateFactRead,
  RestaurantCandidateFactRequest,
  RestaurantAvailabilityRead,
  RestaurantAvailabilityRequest,
  RestaurantEvent,
  RestaurantExecutionRoute,
  RestaurantReadExecutionMetadata,
  RestaurantReadObservation,
  RestaurantSearchRead,
  RestaurantSearchRequest,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { restaurantSearchIntentFingerprint } from "../domains/restaurant/contracts.js";
import { assessRestaurantRead, restaurantPresentationEvidenceIds } from "../domains/restaurant/read-assessment.js";
import { completeRestaurantIntent, completeRestaurantSearchIntent } from "../domains/restaurant/intent-state.js";
import { RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS } from "../domains/restaurant/availability-freshness.js";

export interface RestaurantSearchPort {
  readonly executionRoute: "STRUCTURED_ADAPTER";
  search(request: RestaurantSearchRequest, signal: AbortSignal): Promise<RestaurantSearchRead>;
  /** Optional source-owned cumulative accounting; never visible to the Agent. */
  googleRequestUsage?(readRunId: string | undefined): NonNullable<RestaurantReadExecutionMetadata["googleRequests"]>;
}

export interface RestaurantAvailabilityPort {
  readonly executionRoute: "STRUCTURED_ADAPTER" | "GENERIC_BROWSER";
  /** Optional per-Agent-loop budget lifecycle; adapters never receive Task State. */
  beginReadRun?(): void;
  endReadRun?(): void;
  check(request: RestaurantAvailabilityRequest, signal: AbortSignal): Promise<RestaurantAvailabilityRead>;
}

export interface RestaurantCandidateFactPort {
  readonly executionRoute: "STRUCTURED_ADAPTER" | "GENERIC_BROWSER";
  inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal): Promise<RestaurantCandidateFactRead>;
  googleRequestUsage?(readRunId: string | undefined): NonNullable<RestaurantReadExecutionMetadata["googleRequests"]>;
}

function googleUsageMetadata(
  port: Pick<RestaurantSearchPort | RestaurantCandidateFactPort, "googleRequestUsage">,
  readRunId: string | undefined,
): Pick<RestaurantReadExecutionMetadata, "googleRequests"> {
  try {
    const googleRequests = port.googleRequestUsage?.(readRunId);
    return googleRequests ? { googleRequests } : {};
  } catch {
    return {};
  }
}

export interface RestaurantExecutionRouterOptions {
  structuredReadTimeoutMs?: number;
  /** `null` is eval-only: an explicit human browser pause owns its own wait. */
  browserReadTimeoutMs?: number | null;
}

export interface RestaurantActionExecution {
  route?: RestaurantExecutionRoute;
  event?: RestaurantEvent;
  observation?: RestaurantReadObservation;
  executionMetadata?: RestaurantReadExecutionMetadata;
  failure?: { source: "PROVIDER"; code: string; reason: string; scope: "CANDIDATE" | "PROVIDER" | "BATCH" | "TASK"; terminal?: boolean };
}

function stableFailureCode(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
  return fallback;
}

function authoritativeSearchRequest(
  state: Readonly<RestaurantTaskState>,
  retrievalHint: string | undefined,
  readRunId: string | undefined,
): RestaurantSearchRequest {
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  if (!intent) throw new Error("Validated Restaurant search requires a complete authoritative intent");
  const continuation = state.searchContinuation;
  return {
    intent,
    ...(continuation?.intentFingerprint === restaurantSearchIntentFingerprint(intent)
      ? { continuation: structuredClone(continuation) }
      : {}),
    ...(retrievalHint ? { retrievalHint } : {}),
    ...(readRunId ? { readRunId } : {}),
  };
}

function authoritativeAvailabilityRequest(
  state: Readonly<RestaurantTaskState>,
  candidateIds: string[],
  now: string,
): RestaurantAvailabilityRequest {
  const intent = completeRestaurantIntent(state.intentDraft);
  if (!intent) throw new Error("Validated Restaurant availability requires a complete authoritative intent");
  const eligibility = new Map(assessRestaurantRead(state, now).presentation.map((item) => [item.candidateId, item]));
  const recheckReasons = candidateIds
    .map((candidateId) => eligibility.get(candidateId))
    .filter((item): item is NonNullable<typeof item> => item?.recheckReason !== undefined);
  // Keep the new observation auditable even if an intervening UNKNOWN check
  // replaced the latest check's evidence list.
  const previousEvidenceIds = [...new Set(state.readEvidence
    .filter((evidence) => evidence.kind === "AVAILABILITY" && candidateIds.includes(evidence.candidateId ?? ""))
    .map((evidence) => evidence.evidenceId))];
  return {
    candidateIds: [...candidateIds],
    candidates: candidateIds.map((candidateId) => {
      const candidate = state.candidates.find((item) => item.restaurant.id === candidateId);
      if (!candidate) throw new Error(`Validated availability request cannot bind unknown candidate ${candidateId}`);
      return structuredClone(candidate);
    }),
    date: intent.date,
    timeWindow: structuredClone(intent.permittedAlternativeTimeWindow ?? intent.timeWindow),
    ...(intent.permittedAlternativeTimeWindow ? { requestedTimeWindow: structuredClone(intent.timeWindow) } : {}),
    ...(state.intentDraft?.temporalResolution?.immediateAvailability
      ? { immediateAvailability: structuredClone(state.intentDraft.temporalResolution.immediateAvailability) }
      : {}),
    partySize: intent.partySize,
    hardCriteria: intent.criteria.filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD").map((criterion) => criterion.text),
    ...(recheckReasons.length ? {
      recheck: {
        reason: recheckReasons[0]!.recheckReason!,
        previousEvidenceIds,
      },
    } : {}),
  };
}

function immediateAvailabilityFailure(
  state: Readonly<RestaurantTaskState>,
  now: string,
): "IMMEDIATE_REQUEST_EXPIRED" | undefined {
  const immediate = state.intentDraft?.temporalResolution?.immediateAvailability;
  if (!immediate) return undefined;
  const current = new Date(now);
  const validUntil = new Date(immediate.validUntil);
  if (Number.isNaN(current.valueOf()) || Number.isNaN(validUntil.valueOf()) || current.valueOf() > validUntil.valueOf()) return "IMMEDIATE_REQUEST_EXPIRED";
  return undefined;
}

/**
 * Executes a previously validated business action. This route exposes no provider detail
 * to the Agent and deliberately has no direct Commit implementation.
 */
export class RestaurantExecutionRouter {
  private readonly structuredReadTimeoutMs: number;
  private readonly browserReadTimeoutMs: number | null;

  constructor(
    private readonly search: RestaurantSearchPort,
    private readonly availability: RestaurantAvailabilityPort,
    options: RestaurantExecutionRouterOptions = {},
    private readonly facts?: RestaurantCandidateFactPort,
  ) {
    this.structuredReadTimeoutMs = options.structuredReadTimeoutMs ?? 8_000;
    this.browserReadTimeoutMs = options.browserReadTimeoutMs === null ? null : options.browserReadTimeoutMs ?? 20_000;
  }

  /** Keeps source-level cumulative budgets aligned with one outer Agent run. */
  beginReadRun(): void { this.availability.beginReadRun?.(); }

  endReadRun(): void { this.availability.endReadRun?.(); }

  async execute(
    action: RestaurantAgentAction,
    state: Readonly<RestaurantTaskState>,
    now = new Date().toISOString(),
    /** Bound by the coordinator; never Agent-controlled. */
    readRunId?: string,
    /** Owned by the user-visible read run; never supplied by the Agent. */
    parentSignal?: AbortSignal,
  ): Promise<RestaurantActionExecution> {
    switch (action.type) {
      case "ASK_USER":
        return {
          event: { type: "AGENT_ASKED_USER", question: action.question, ...(action.relatedFields ? { relatedFields: action.relatedFields } : {}) },
          observation: { type: "USER_QUESTION", detail: action.question },
        };
      case "SEARCH_RESTAURANTS": {
        const request = authoritativeSearchRequest(state, action.retrievalHint, readRunId);
        const knownCandidateIds = new Set(state.candidates.map((candidate) => candidate.restaurant.id));
        try {
          const read = await this.withProviderReadDeadline(
            "Restaurant search",
            this.structuredReadTimeoutMs,
            (signal) => this.search.search(request, signal),
            false,
            parentSignal,
          );
          return {
            route: "STRUCTURED_ADAPTER",
            event: { type: "SEARCH_COMPLETED", request, ...read },
            // A provider can return ten ranked rows while every one is already
            // in the authoritative candidate pool. Record the delta before
            // reduction so the Agent loop and artifact can distinguish a real
            // discovery advance from a rewritten-query loop.
            observation: {
              type: "DISCOVERY",
              detail: `${read.candidates.length} candidates discovered; ${read.candidates.filter((candidate) => !knownCandidateIds.has(candidate.restaurant.id)).length} newly accepted`,
              candidateIds: read.candidates.map((candidate) => candidate.restaurant.id),
              newCandidateIds: read.candidates.filter((candidate) => !knownCandidateIds.has(candidate.restaurant.id)).map((candidate) => candidate.restaurant.id),
              evidenceIds: read.evidence.map((evidence) => evidence.evidenceId),
            },
            executionMetadata: read.metadata,
          };
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown Restaurant search failure";
          const code = stableFailureCode(error, "SEARCH_FAILED");
          return {
            route: "STRUCTURED_ADAPTER",
            event: { type: "SEARCH_FAILED", reason, code },
            observation: { type: "DISCOVERY_FAILED", detail: reason },
            executionMetadata: {
              provider: "GOOGLE_PLACES",
              route: "STRUCTURED_ADAPTER",
              latencyMs: 0,
              failureCode: code,
              ...googleUsageMetadata(this.search, readRunId),
            },
            failure: { source: "PROVIDER", code, reason, scope: "PROVIDER" },
          };
        }
      }
      case "INVESTIGATE_CANDIDATE_FACTS": {
        if (!this.facts) {
          return {
            event: { type: "AGENT_EXECUTION_FAILED", code: "AGENT_EXECUTION_FAILED", reason: "Candidate fact investigation is unavailable in this composition" },
            observation: { type: "FACTS_UNAVAILABLE", detail: "Candidate fact investigation is unavailable" },
          };
        }
        const intent = completeRestaurantSearchIntent(state.intentDraft);
        if (!intent) throw new Error("Validated candidate fact read requires a complete authoritative search intent");
        const request: RestaurantCandidateFactRequest = {
          candidateIds: [...action.candidateIds],
          candidates: action.candidateIds.map((candidateId) => {
            const candidate = state.candidates.find((item) => item.restaurant.id === candidateId);
            if (!candidate) throw new Error(`Validated fact investigation cannot bind unknown candidate ${candidateId}`);
            return structuredClone(candidate);
          }),
          intent,
          ...(readRunId ? { readRunId } : {}),
          ...(state.factRefreshRequestedCandidateIds?.length && action.candidateIds.every((candidateId) => state.factRefreshRequestedCandidateIds!.includes(candidateId))
            ? { recheck: { reason: "USER_REQUESTED_REFRESH" as const } }
            : {}),
        };
        try {
          const read = await this.withProviderReadDeadline(
            "Restaurant candidate facts",
            this.facts.executionRoute === "GENERIC_BROWSER" ? this.browserReadTimeoutMs : this.structuredReadTimeoutMs,
            (signal) => this.facts!.inspectFacts(request, signal),
            this.facts.executionRoute === "GENERIC_BROWSER",
            parentSignal,
          );
          return {
            route: this.facts.executionRoute,
            event: { type: "CANDIDATE_FACTS_CHECKED", request, ...read, metadata: { ...read.metadata, ...(request.recheck ? { recheckReason: request.recheck.reason } : {}) } },
            observation: {
              type: "CANDIDATE_FACTS", detail: `${request.candidateIds.length} candidate fact read(s) completed`, candidateIds: request.candidateIds, evidenceIds: read.evidence.map((evidence) => evidence.evidenceId),
              factSourceAttempts: request.candidateIds.flatMap(candidateId => {
                const check = read.factChecks[candidateId]!;
                return (check.sourceAttempts ?? [{ source: check.sourceProvider ?? read.metadata.provider, outcome: check.status, ...(check.reasonCode ? { reasonCode: check.reasonCode } : {}) }])
                  .map(attempt => ({ candidateId, ...attempt }));
              }),
            },
            executionMetadata: { ...read.metadata, ...(request.recheck ? { recheckReason: request.recheck.reason } : {}) },
          };
        } catch (error) {
          if (parentSignal?.aborted || (error && typeof error === "object" && "code" in error && (error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "MODEL_CALL_BUDGET_EXHAUSTED"))) throw error;
          const reason = error instanceof Error ? error.message : "Unknown candidate fact investigation failure";
          const code = stableFailureCode(error, "FACT_INVESTIGATION_FAILED");
          return {
            route: this.facts.executionRoute,
            event: {
              type: "CANDIDATE_FACTS_CHECKED",
              request,
              evidence: [],
              factChecks: Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, { status: "UNKNOWN" as const, checkedAt: now, evidenceIds: [], reasonCode: code }])),
              metadata: { provider: "GOOGLE_PLACES", route: this.facts.executionRoute, latencyMs: 0, failureCode: code, ...googleUsageMetadata(this.facts, readRunId), ...(request.recheck ? { recheckReason: request.recheck.reason } : {}) },
            },
            observation: { type: "CANDIDATE_FACTS_UNKNOWN", detail: reason, candidateIds: request.candidateIds },
            executionMetadata: { provider: "GOOGLE_PLACES", route: this.facts.executionRoute, latencyMs: 0, failureCode: code, ...googleUsageMetadata(this.facts, readRunId), ...(request.recheck ? { recheckReason: request.recheck.reason } : {}) },
            failure: { source: "PROVIDER", code, reason, scope: "PROVIDER" },
          };
        }
      }
      case "CHECK_AVAILABILITY": {
        const request = authoritativeAvailabilityRequest(state, action.candidateIds, now);
        const immediateFailure = immediateAvailabilityFailure(state, now);
        if (immediateFailure) {
          const availabilityChecks = Object.fromEntries(request.candidateIds.map((candidateId) => [candidateId, {
            status: "UNKNOWN" as const,
            checkedAt: now,
            evidenceIds: [],
            reasonCode: immediateFailure,
          }]));
          const metadata: RestaurantReadExecutionMetadata = {
            provider: "AVAILABILITY_SOURCE_RESOLVER",
            route: this.availability.executionRoute,
            latencyMs: 0,
            failureCode: immediateFailure,
            freshnessPolicyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
          };
          return {
            route: this.availability.executionRoute,
            event: { type: "AVAILABILITY_CHECKED", request, offers: [], availabilityChecks, evidence: [], metadata },
            observation: { type: "AVAILABILITY_UNKNOWN", detail: immediateFailure === "IMMEDIATE_REQUEST_EXPIRED"
              ? "The immediate request elapsed before a provider query; no later slot was substituted."
              : "The exact immediate time is not a supported discrete reservation slot; no later slot was substituted.", candidateIds: request.candidateIds },
            executionMetadata: metadata,
          };
        }
        try {
          const read = await this.withProviderReadDeadline(
            "Restaurant availability",
            this.availability.executionRoute === "GENERIC_BROWSER"
              ? this.browserReadTimeoutMs
              : this.structuredReadTimeoutMs,
            (signal) => this.availability.check(request, signal),
            this.availability.executionRoute === "GENERIC_BROWSER",
            parentSignal,
          );
          const metadata: RestaurantReadExecutionMetadata = {
            ...read.metadata,
            freshnessPolicyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
            ...(request.recheck ? { recheckReason: request.recheck.reason } : {}),
          };
          return {
            route: this.availability.executionRoute,
            event: { type: "AVAILABILITY_CHECKED", request, ...read, metadata },
            observation: { type: "AVAILABILITY", detail: `${read.offers.length} offers observed`, candidateIds: request.candidateIds, evidenceIds: read.evidence.map((evidence) => evidence.evidenceId) },
            executionMetadata: metadata,
          };
        } catch (error) {
          // The coordinator's outer cancellation/deadline and the shared
          // browser-model ceiling are task facts. They must stop this run,
          // rather than being converted into a local no-result outcome.
          if (parentSignal?.aborted || (error && typeof error === "object" && "code" in error && (error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "MODEL_CALL_BUDGET_EXHAUSTED"))) throw error;
          const reason = error instanceof Error ? error.message : "Unknown Restaurant availability failure";
          const code = stableFailureCode(
            error,
            this.availability.executionRoute === "GENERIC_BROWSER" && /timed out/i.test(reason)
              ? "BROWSER_TIMEOUT"
              : "BROWSER_RUNTIME_FAILED",
          );
          const checkedAt = now;
          const availabilityChecks: Record<string, RestaurantAvailabilityCheck> = Object.fromEntries(
            request.candidateIds.map((candidateId) => [candidateId, {
              status: "UNKNOWN",
              checkedAt,
              evidenceIds: [],
              reasonCode: code,
            }]),
          );
          return {
            route: this.availability.executionRoute,
            event: {
              type: "AVAILABILITY_CHECKED",
              request,
              offers: [],
              availabilityChecks,
              evidence: [],
              metadata: {
                provider: this.availability.executionRoute === "GENERIC_BROWSER" ? "TABELOG" : "FIXTURE",
                route: this.availability.executionRoute,
                latencyMs: 0,
                failureCode: code,
                failureScope: "BATCH",
                freshnessPolicyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
                ...(request.recheck ? { recheckReason: request.recheck.reason } : {}),
              },
            },
            observation: { type: "AVAILABILITY_UNKNOWN", detail: reason, candidateIds: request.candidateIds },
            executionMetadata: {
              provider: this.availability.executionRoute === "GENERIC_BROWSER" ? "TABELOG" : "FIXTURE",
              route: this.availability.executionRoute,
              latencyMs: 0,
              failureCode: code,
              failureScope: "BATCH",
              freshnessPolicyVersion: RESTAURANT_AVAILABILITY_DISPLAY_FRESHNESS.version,
              ...(request.recheck ? { recheckReason: request.recheck.reason } : {}),
            },
            // A source/batch browser failure is candidate-scoped evidence, not
            // proof that the whole task cannot continue with another outlet,
            // cursor page, or source. The coordinator owns task-global budget
            // and deadline termination.
            failure: { source: "PROVIDER", code, reason, scope: "BATCH" },
          };
        }
      }
      case "PRESENT_RESULTS": {
        const evidenceIds = action.candidateIds.flatMap((candidateId) =>
          restaurantPresentationEvidenceIds(state, candidateId, now) ?? [],
        );
        return {
          event: { type: "RESULTS_PRESENTED", candidateIds: [...action.candidateIds], evidenceIds },
          observation: { type: "RESULTS_PRESENTED", detail: `${action.candidateIds.length} grounded restaurant result(s) presented` },
        };
      }
      case "END_READ": {
        const assessment = assessRestaurantRead(state, now);
        return {
          event: {
            type: "READ_ENDED_NO_VERIFIED_RESULT",
            investigatedCandidateIds: state.candidates.map((candidate) => candidate.restaurant.id),
            unresolvedCandidateIds: assessment.unresolvedCandidateIds,
            remainingGaps: assessment.presentation.filter((item) => !item.eligible).map((item) => item.missingReason ?? `Candidate ${item.candidateId} is not displayable`),
          },
          observation: { type: "READ_ENDED", detail: "Bounded read ended without a grounded result", candidateIds: state.candidates.map((candidate) => candidate.restaurant.id), unresolvedCandidateIds: assessment.unresolvedCandidateIds },
        };
      }
      case "SELECT_CANDIDATE":
        return {
          event: { type: "CANDIDATE_SELECTED", candidateId: action.candidateId, ...(action.offerId ? { offerId: action.offerId } : {}) },
          observation: { type: "CANDIDATE_SELECTED", detail: action.candidateId },
        };
      case "BOOK_RESERVATION":
        return {
          event: { type: "BOOKING_PROPOSED", candidateId: action.candidateId, offerId: action.offerId },
          observation: { type: "BOOKING_PROPOSAL", detail: `${action.candidateId}:${action.offerId}` },
        };
    }
  }

  private async withProviderReadDeadline<Value>(
    operationName: string,
    timeoutMs: number | null,
    operation: (signal: AbortSignal) => Promise<Value>,
    /** A browser executor owns interactive actions and must close before timeout returns. */
    settleAfterAbort = false,
    parentSignal?: AbortSignal,
  ): Promise<Value> {
    if (parentSignal?.aborted) throw parentSignal.reason ?? new Error("Read-only investigation was cancelled");
    if (timeoutMs === null) return operation(parentSignal ?? new AbortController().signal);
    const controller = new AbortController();
    let deadlineExceeded = false;
    let rejectDeadline: ((reason: Error) => void) | undefined;
    let rejectParentAbort: ((reason: unknown) => void) | undefined;
    // Browser reads must settle their own cancellation and close their session.
    // Do not create a rejected race promise for that branch: it would be
    // unobserved while awaiting `work`, turning a correct abort into a process
    // level unhandledRejection.
    const deadline = settleAfterAbort
      ? undefined
      : new Promise<never>((_resolve, reject) => { rejectDeadline = reject; });
    const parentAbort = !settleAfterAbort && parentSignal
      ? new Promise<never>((_resolve, reject) => { rejectParentAbort = reject; })
      : undefined;
    const abortFromParent = () => {
      const reason = parentSignal?.reason ?? new Error("Read-only investigation was cancelled");
      controller.abort(reason);
      rejectParentAbort?.(reason);
    };
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
    const timeout = setTimeout(() => {
      deadlineExceeded = true;
      const error = new Error(`${operationName} timed out after ${timeoutMs}ms`);
      controller.abort(error);
      rejectDeadline?.(error);
    }, timeoutMs);
    try {
      const work = operation(controller.signal);
      // A generic browser must settle after AbortSignal so its executor closes before
      // control returns. Structured read-only retrieval has no browser action and may
      // be bounded at the Router even if a broken provider ignores abort.
      const value = await (settleAfterAbort
        ? work
        : Promise.race([work, deadline!, ...(parentAbort ? [parentAbort] : [])]));
      if (parentSignal?.aborted) throw parentSignal.reason ?? new Error("Read-only investigation was cancelled");
      if (deadlineExceeded) throw new Error(`${operationName} timed out after ${timeoutMs}ms`);
      return value;
    } catch (error) {
      if (deadlineExceeded) throw new Error(`${operationName} timed out after ${timeoutMs}ms`);
      throw error;
    } finally {
      clearTimeout(timeout);
      parentSignal?.removeEventListener("abort", abortFromParent);
    }
  }
}
