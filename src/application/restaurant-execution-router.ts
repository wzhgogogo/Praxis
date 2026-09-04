import type { RestaurantAgentAction } from "../domains/restaurant/agent-action.js";
import type {
  RestaurantAvailabilityCheck,
  RestaurantAvailabilityRead,
  RestaurantAvailabilityRequest,
  RestaurantEvent,
  RestaurantExecutionRoute,
  RestaurantReadExecutionMetadata,
  RestaurantSearchRead,
  RestaurantSearchRequest,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { completeRestaurantIntent } from "../domains/restaurant/intent-state.js";

export interface RestaurantSearchPort {
  readonly executionRoute: "STRUCTURED_ADAPTER";
  search(request: RestaurantSearchRequest, signal: AbortSignal): Promise<RestaurantSearchRead>;
}

export interface RestaurantAvailabilityPort {
  readonly executionRoute: "STRUCTURED_ADAPTER" | "GENERIC_BROWSER";
  check(request: RestaurantAvailabilityRequest, signal: AbortSignal): Promise<RestaurantAvailabilityRead>;
}

export interface RestaurantExecutionRouterOptions {
  structuredReadTimeoutMs?: number;
  browserReadTimeoutMs?: number;
}

export interface RestaurantActionExecution {
  route?: RestaurantExecutionRoute;
  event?: RestaurantEvent;
  observation?: { type: string; detail: string };
  executionMetadata?: RestaurantReadExecutionMetadata;
  failure?: { source: "PROVIDER"; code: string; reason: string; terminal?: boolean };
}

function terminalBrowserReadFailure(
  read: RestaurantAvailabilityRead,
  candidateIds: string[],
): "BROWSER_RUNTIME_FAILED" | "BROWSER_TIMEOUT" | undefined {
  const providerAttempts = read.metadata.providerAttempts;
  if (providerAttempts?.length) {
    const code = providerAttempts[0]?.failureCode;
    if (
      (code === "BROWSER_RUNTIME_FAILED" || code === "BROWSER_TIMEOUT") &&
      providerAttempts.length >= candidateIds.length &&
      providerAttempts.every((attempt) => attempt.failureCode === code)
    ) return code;
  }
  const codes = candidateIds.map((candidateId) => read.availabilityChecks[candidateId]?.reasonCode);
  const code = codes[0];
  return codes.length > 0 &&
    (code === "BROWSER_RUNTIME_FAILED" || code === "BROWSER_TIMEOUT") &&
    codes.every((item) => item === code)
    ? code
    : undefined;
}

function stableFailureCode(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") return error.code;
  return fallback;
}

function authoritativeSearchRequest(
  state: Readonly<RestaurantTaskState>,
  retrievalHint: string | undefined,
): RestaurantSearchRequest {
  const intent = completeRestaurantIntent(state.intentDraft);
  if (!intent) throw new Error("Validated Restaurant search requires a complete authoritative intent");
  return { intent, ...(retrievalHint ? { retrievalHint } : {}) };
}

function authoritativeAvailabilityRequest(
  state: Readonly<RestaurantTaskState>,
  candidateIds: string[],
): RestaurantAvailabilityRequest {
  const intent = completeRestaurantIntent(state.intentDraft);
  if (!intent) throw new Error("Validated Restaurant availability requires a complete authoritative intent");
  return {
    candidateIds: [...candidateIds],
    candidates: candidateIds.map((candidateId) => {
      const candidate = state.candidates.find((item) => item.restaurant.id === candidateId);
      if (!candidate) throw new Error(`Validated availability request cannot bind unknown candidate ${candidateId}`);
      return structuredClone(candidate);
    }),
    date: intent.date,
    timeWindow: structuredClone(intent.timeWindow),
    partySize: intent.partySize,
    hardCriteria: intent.criteria.filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD").map((criterion) => criterion.text),
  };
}

/**
 * Executes a previously validated business action. This route exposes no provider detail
 * to the Agent and deliberately has no direct Commit implementation.
 */
export class RestaurantExecutionRouter {
  private readonly structuredReadTimeoutMs: number;
  private readonly browserReadTimeoutMs: number;

  constructor(
    private readonly search: RestaurantSearchPort,
    private readonly availability: RestaurantAvailabilityPort,
    options: RestaurantExecutionRouterOptions = {},
  ) {
    this.structuredReadTimeoutMs = options.structuredReadTimeoutMs ?? 8_000;
    this.browserReadTimeoutMs = options.browserReadTimeoutMs ?? 20_000;
  }

  async execute(
    action: RestaurantAgentAction,
    state: Readonly<RestaurantTaskState>,
  ): Promise<RestaurantActionExecution> {
    switch (action.type) {
      case "ASK_USER":
        return {
          event: { type: "AGENT_ASKED_USER", question: action.question, ...(action.relatedFields ? { relatedFields: action.relatedFields } : {}) },
          observation: { type: "USER_QUESTION", detail: action.question },
        };
      case "SEARCH_RESTAURANTS": {
        const request = authoritativeSearchRequest(state, action.retrievalHint);
        try {
          const read = await this.withProviderReadDeadline(
            "Restaurant search",
            this.structuredReadTimeoutMs,
            (signal) => this.search.search(request, signal),
          );
          return {
            route: "STRUCTURED_ADAPTER",
            event: { type: "SEARCH_COMPLETED", request, ...read },
            observation: { type: "DISCOVERY", detail: `${read.candidates.length} candidates discovered` },
            executionMetadata: read.metadata,
          };
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown Restaurant search failure";
          const code = stableFailureCode(error, "SEARCH_FAILED");
          return {
            route: "STRUCTURED_ADAPTER",
            event: { type: "SEARCH_FAILED", reason },
            observation: { type: "DISCOVERY_FAILED", detail: reason },
            failure: { source: "PROVIDER", code, reason },
          };
        }
      }
      case "CHECK_AVAILABILITY": {
        const request = authoritativeAvailabilityRequest(state, action.candidateIds);
        try {
          const read = await this.withProviderReadDeadline(
            "Restaurant availability",
            this.availability.executionRoute === "GENERIC_BROWSER"
              ? this.browserReadTimeoutMs
              : this.structuredReadTimeoutMs,
            (signal) => this.availability.check(request, signal),
          );
          const terminalFailureCode = terminalBrowserReadFailure(read, request.candidateIds);
          return {
            route: this.availability.executionRoute,
            event: { type: "AVAILABILITY_CHECKED", request, ...read },
            observation: { type: "AVAILABILITY", detail: `${read.offers.length} offers observed` },
            executionMetadata: read.metadata,
            ...(terminalFailureCode ? {
              failure: {
                source: "PROVIDER" as const,
                code: terminalFailureCode,
                reason: `Tabelog browser read could not establish a safe session: ${terminalFailureCode}`,
                terminal: true,
              },
            } : {}),
          };
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown Restaurant availability failure";
          const code = stableFailureCode(
            error,
            this.availability.executionRoute === "GENERIC_BROWSER" && /timed out/i.test(reason)
              ? "BROWSER_TIMEOUT"
              : "BROWSER_RUNTIME_FAILED",
          );
          const checkedAt = new Date().toISOString();
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
              },
            },
            observation: { type: "AVAILABILITY_UNKNOWN", detail: reason },
            executionMetadata: {
              provider: this.availability.executionRoute === "GENERIC_BROWSER" ? "TABELOG" : "FIXTURE",
              route: this.availability.executionRoute,
              latencyMs: 0,
              failureCode: code,
            },
            failure: { source: "PROVIDER", code, reason, ...(this.availability.executionRoute === "GENERIC_BROWSER" ? { terminal: true } : {}) },
          };
        }
      }
      case "PRESENT_RESULTS": {
        const evidenceIds = state.readEvidence
          .filter((evidence) => action.candidateIds.includes(evidence.candidateId ?? ""))
          .map((evidence) => evidence.evidenceId);
        return {
          event: { type: "RESULTS_PRESENTED", candidateIds: [...action.candidateIds], evidenceIds },
          observation: { type: "RESULTS_PRESENTED", detail: `${action.candidateIds.length} grounded restaurant result(s) presented` },
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
    timeoutMs: number,
    operation: (signal: AbortSignal) => Promise<Value>,
  ): Promise<Value> {
    const controller = new AbortController();
    return new Promise<Value>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const error = new Error(`${operationName} timed out after ${timeoutMs}ms`);
        controller.abort(error);
        reject(error);
      }, timeoutMs);
      void Promise.resolve().then(() => operation(controller.signal)).then(
        (value) => {
          clearTimeout(timeout);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timeout);
          reject(error);
        },
      );
    });
  }
}
