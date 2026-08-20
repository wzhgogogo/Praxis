import type { RestaurantAgentAction } from "../domains/restaurant/agent-action.js";
import type {
  AvailabilityOffer,
  RestaurantAvailabilityRequest,
  RestaurantCandidate,
  RestaurantEvent,
  RestaurantSearchRequest,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { completeRestaurantIntent } from "../domains/restaurant/intent-state.js";

export interface RestaurantSearchPort {
  search(request: RestaurantSearchRequest): Promise<RestaurantCandidate[]>;
}

export interface RestaurantAvailabilityPort {
  check(request: RestaurantAvailabilityRequest): Promise<AvailabilityOffer[]>;
}

export interface RestaurantActionExecution {
  route: "FIXTURE_STRUCTURED" | "RUNTIME" | "POLICY_CHECKPOINT";
  event?: RestaurantEvent;
  observation?: { type: string; detail: string };
  failure?: { source: "PROVIDER"; code: "SEARCH_FAILED" | "AVAILABILITY_FAILED"; reason: string };
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
    date: intent.date,
    timeWindow: structuredClone(intent.timeWindow),
    partySize: intent.partySize,
  };
}

/**
 * Executes a previously validated business action. This route exposes no provider detail
 * to the Agent and deliberately has no direct Commit implementation.
 */
export class RestaurantExecutionRouter {
  constructor(
    private readonly search: RestaurantSearchPort,
    private readonly availability: RestaurantAvailabilityPort,
  ) {}

  async execute(
    action: RestaurantAgentAction,
    state: Readonly<RestaurantTaskState>,
  ): Promise<RestaurantActionExecution> {
    switch (action.type) {
      case "ASK_USER":
        return {
          route: "RUNTIME",
          event: { type: "AGENT_ASKED_USER", question: action.question, ...(action.relatedFields ? { relatedFields: action.relatedFields } : {}) },
          observation: { type: "USER_QUESTION", detail: action.question },
        };
      case "SEARCH_RESTAURANTS": {
        const request = authoritativeSearchRequest(state, action.retrievalHint);
        try {
          const candidates = await this.search.search(request);
          return {
            route: "FIXTURE_STRUCTURED",
            event: { type: "SEARCH_COMPLETED", request, candidates },
            observation: { type: "DISCOVERY", detail: `${candidates.length} candidates discovered` },
          };
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown Restaurant search failure";
          return {
            route: "FIXTURE_STRUCTURED",
            event: { type: "SEARCH_FAILED", reason },
            observation: { type: "DISCOVERY_FAILED", detail: reason },
            failure: { source: "PROVIDER", code: "SEARCH_FAILED", reason },
          };
        }
      }
      case "CHECK_AVAILABILITY": {
        const request = authoritativeAvailabilityRequest(state, action.candidateIds);
        try {
          const offers = await this.availability.check(request);
          return {
            route: "FIXTURE_STRUCTURED",
            event: { type: "AVAILABILITY_CHECKED", request, offers },
            observation: { type: "AVAILABILITY", detail: `${offers.length} offers observed` },
          };
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown Restaurant availability failure";
          return {
            route: "FIXTURE_STRUCTURED",
            event: { type: "AVAILABILITY_FAILED", reason },
            observation: { type: "AVAILABILITY_FAILED", detail: reason },
            failure: { source: "PROVIDER", code: "AVAILABILITY_FAILED", reason },
          };
        }
      }
      case "SELECT_CANDIDATE":
        return {
          route: "RUNTIME",
          event: { type: "CANDIDATE_SELECTED", candidateId: action.candidateId, ...(action.offerId ? { offerId: action.offerId } : {}) },
          observation: { type: "CANDIDATE_SELECTED", detail: action.candidateId },
        };
      case "BOOK_RESERVATION":
        return {
          route: "POLICY_CHECKPOINT",
          event: { type: "BOOKING_PROPOSED", candidateId: action.candidateId, offerId: action.offerId },
          observation: { type: "BOOKING_PROPOSAL", detail: `${action.candidateId}:${action.offerId}` },
        };
    }
  }
}
