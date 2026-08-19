import type { RestaurantAgentAction } from "../domains/restaurant/agent-action.js";
import { compileRestaurantSemanticProposal } from "../domains/restaurant/semantic-compiler.js";
import type {
  AvailabilityOffer,
  RestaurantAvailabilityRequest,
  RestaurantCandidate,
  RestaurantEvent,
  RestaurantSearchRequest,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import type {
  RestaurantSemanticInterpretInput,
  RestaurantSemanticInterpreter,
} from "../domains/restaurant/semantic-interpreter.js";

export type RestaurantSemanticInterpreterPort = Pick<RestaurantSemanticInterpreter, "interpret">;

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
}

/**
 * Executes a previously validated business action. This v18 route exposes no provider detail
 * to the Agent and deliberately has no direct Commit implementation.
 */
export class RestaurantExecutionRouter {
  constructor(
    private readonly search: RestaurantSearchPort,
    private readonly availability: RestaurantAvailabilityPort,
  ) {}

  async execute(
    action: RestaurantAgentAction,
    _state: Readonly<RestaurantTaskState>,
  ): Promise<RestaurantActionExecution> {
    switch (action.type) {
      case "ASK_USER":
        return {
          route: "RUNTIME",
          event: { type: "AGENT_ASKED_USER", question: action.question, ...(action.relatedFields ? { relatedFields: action.relatedFields } : {}) },
          observation: { type: "USER_QUESTION", detail: action.question },
        };
      case "SEARCH_RESTAURANTS": {
        try {
          const candidates = await this.search.search(action.request);
          return {
            route: "FIXTURE_STRUCTURED",
            event: { type: "SEARCH_COMPLETED", request: action.request, candidates },
            observation: { type: "DISCOVERY", detail: `${candidates.length} candidates discovered` },
          };
        } catch (error) {
          const reason = error instanceof Error ? error.message : "Unknown Restaurant search failure";
          return { route: "FIXTURE_STRUCTURED", event: { type: "SEARCH_FAILED", reason }, observation: { type: "DISCOVERY_FAILED", detail: reason } };
        }
      }
      case "CHECK_AVAILABILITY": {
        const offers = await this.availability.check(action.request);
        return {
          route: "FIXTURE_STRUCTURED",
          event: { type: "AVAILABILITY_CHECKED", request: action.request, offers },
          observation: { type: "AVAILABILITY", detail: `${offers.length} offers observed` },
        };
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
      case "COMPLETE":
        return { route: "RUNTIME", observation: { type: "COMPLETED", detail: "Verifier-confirmed outcome retained" } };
    }
  }
}

export async function restaurantEventForMessage(
  interpreter: RestaurantSemanticInterpreterPort,
  input: RestaurantSemanticInterpretInput,
): Promise<RestaurantEvent> {
  const interpreted = await interpreter.interpret(input);
  if (interpreted.status !== "PROPOSED") {
    throw new Error(`Restaurant Semantic Interpreter did not produce a proposal: ${interpreted.status}`);
  }
  const compilation = compileRestaurantSemanticProposal(interpreted.proposal);
  return compilation.status === "COMPILED"
    ? { type: "SEMANTIC_PROPOSAL_COMPILED", patch: compilation.patch }
    : { type: "SEMANTIC_CONFLICT_RECORDED", conflict: compilation.conflict };
}
