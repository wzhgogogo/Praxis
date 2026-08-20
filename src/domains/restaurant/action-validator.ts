import type { RestaurantAgentAction } from "./agent-action.js";
import type { AvailabilityOffer, RestaurantTaskState } from "./contracts.js";
import { completeRestaurantIntent } from "./intent-state.js";

export type RestaurantActionRejectionCode =
  | "TASK_TERMINAL"
  | "INTENT_INCOMPLETE"
  | "CANDIDATE_UNKNOWN"
  | "OFFER_UNKNOWN"
  | "OFFER_CANDIDATE_MISMATCH"
  | "SCHEDULE_MISMATCH"
  | "OFFER_STALE"
  | "SELECTION_REQUIRED"
  | "ACTIVE_ATTEMPT"
  | "OUTCOME_UNKNOWN";

export type RestaurantActionValidation =
  | { status: "ALLOWED" }
  | { status: "REQUIRES_AUTHORIZATION" }
  | { status: "REJECTED"; code: RestaurantActionRejectionCode; reason: string };

function rejected(code: RestaurantActionRejectionCode, reason: string): RestaurantActionValidation {
  return { status: "REJECTED", code, reason };
}

function isTerminal(state: Readonly<RestaurantTaskState>): boolean {
  return state.phase === "BOOKED_VERIFIED" || state.phase === "OUTCOME_UNKNOWN" || state.phase === "FAILED";
}

function candidate(state: Readonly<RestaurantTaskState>, candidateId: string) {
  return state.candidates.find((item) => item.restaurant.id === candidateId);
}

function offer(state: Readonly<RestaurantTaskState>, candidateId: string, offerId: string): AvailabilityOffer | undefined {
  return state.availability[candidateId]?.find((item) => item.id === offerId);
}

function freshOffer(
  state: Readonly<RestaurantTaskState>,
  candidateId: string,
  offerId: string,
  now: string,
): RestaurantActionValidation | AvailabilityOffer {
  const found = offer(state, candidateId, offerId);
  if (!found) return rejected("OFFER_UNKNOWN", `Offer ${offerId} is not available for candidate ${candidateId}`);
  if (found.restaurantId !== candidateId) {
    return rejected("OFFER_CANDIDATE_MISMATCH", "Offer restaurant identity does not match its candidate");
  }
  if (Date.parse(found.expiresAt) <= Date.parse(now)) {
    return rejected("OFFER_STALE", `Offer ${offerId} has expired`);
  }
  return found;
}

function requireCompleteIntent(state: Readonly<RestaurantTaskState>):
  | { valid: true; intent: NonNullable<ReturnType<typeof completeRestaurantIntent>> }
  | { valid: false; verdict: RestaurantActionValidation } {
  const intent = completeRestaurantIntent(state.intentDraft);
  return intent
    ? { valid: true, intent }
    : { valid: false, verdict: rejected("INTENT_INCOMPLETE", "Restaurant intent is missing required fields") };
}

/** Domain-owned invariant guard. It never chooses an action and never invokes a provider. */
export function validateRestaurantAction(
  state: Readonly<RestaurantTaskState>,
  action: RestaurantAgentAction,
  now: string,
): RestaurantActionValidation {
  if (state.phase === "OUTCOME_UNKNOWN") {
    return rejected("OUTCOME_UNKNOWN", "An unknown booking outcome must be verified before any new action");
  }
  if (isTerminal(state)) return rejected("TASK_TERMINAL", `Task is terminal in ${state.phase}`);
  if (action.type === "ASK_USER") return { status: "ALLOWED" };

  const intent = requireCompleteIntent(state);
  if (!intent.valid) return intent.verdict;

  if (action.type === "SEARCH_RESTAURANTS") {
    return { status: "ALLOWED" };
  }

  if (action.type === "CHECK_AVAILABILITY") {
    if (action.candidateIds.length === 0 || new Set(action.candidateIds).size !== action.candidateIds.length) {
      return rejected("CANDIDATE_UNKNOWN", "Availability requires one or more unique known candidate IDs");
    }
    return action.candidateIds.every((candidateId) => candidate(state, candidateId))
      ? { status: "ALLOWED" }
      : rejected("CANDIDATE_UNKNOWN", "Availability can only be checked for known candidates");
  }

  if (!candidate(state, action.candidateId)) {
    return rejected("CANDIDATE_UNKNOWN", `Candidate ${action.candidateId} is not in authoritative discovery results`);
  }
  if (action.type === "SELECT_CANDIDATE") {
    if (!action.offerId) return { status: "ALLOWED" };
    const checkedOffer = freshOffer(state, action.candidateId, action.offerId, now);
    return "status" in checkedOffer ? checkedOffer : { status: "ALLOWED" };
  }

  if (state.activeAttemptId) return rejected("ACTIVE_ATTEMPT", "A booking attempt is already active");
  if (state.selectedCandidateId !== action.candidateId || state.selectedOfferId !== action.offerId) {
    return rejected("SELECTION_REQUIRED", "Booking requires the Agent to select the same candidate and offer first");
  }
  const checkedOffer = freshOffer(state, action.candidateId, action.offerId, now);
  if ("status" in checkedOffer) return checkedOffer;
  if (
    checkedOffer.dateTime.slice(0, 10) !== intent.intent.date ||
    checkedOffer.partySize !== intent.intent.partySize ||
    checkedOffer.dateTime.slice(11, 16) < intent.intent.timeWindow.earliest ||
    checkedOffer.dateTime.slice(11, 16) > intent.intent.timeWindow.latest
  ) {
    return rejected("SCHEDULE_MISMATCH", "Offer does not match the authoritative date, time window, and party size");
  }
  return { status: "REQUIRES_AUTHORIZATION" };
}
