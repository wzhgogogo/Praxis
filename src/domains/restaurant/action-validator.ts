import type { RestaurantAgentAction } from "./agent-action.js";
import { type AvailabilityOffer, type RestaurantTaskState } from "./contracts.js";
import { completeRestaurantIntent, completeRestaurantSearchIntent } from "./intent-state.js";
import {
  assessRestaurantRead,
  type RestaurantPresentationReadiness,
} from "./read-assessment.js";

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
  | "OUTCOME_UNKNOWN"
  | "AVAILABILITY_ALREADY_CHECKED"
  | "REFRESH_TARGET_REQUIRED"
  | "PRESENTATION_READY"
  | "AVAILABILITY_BATCH_LIMIT"
  | "PRESENTATION_EVIDENCE_MISSING"
  | "FACTS_ALREADY_CHECKED"
  | "DISCOVERY_UNAVAILABLE";

/** A browser/read batch is bounded separately from the discovery pool and UI. */
export const MAX_AVAILABILITY_CHECK_BATCH = 3;

export type RestaurantActionValidation =
  | { status: "ALLOWED" }
  | { status: "REQUIRES_AUTHORIZATION" }
  | { status: "REJECTED"; code: RestaurantActionRejectionCode; reason: string };

function rejected(code: RestaurantActionRejectionCode, reason: string): RestaurantActionValidation {
  return { status: "REJECTED", code, reason };
}

function isTerminal(state: Readonly<RestaurantTaskState>): boolean {
  return state.phase === "BOOKED_VERIFIED" || state.phase === "NO_VERIFIED_RESULT" || state.phase === "OUTCOME_UNKNOWN" || state.phase === "FAILED";
}

/** Compatibility projection; all logic belongs to read-assessment.ts. */
export function restaurantPresentationReadiness(state: Readonly<RestaurantTaskState>, now: string): RestaurantPresentationReadiness[] {
  return assessRestaurantRead(state, now).presentation;
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
  if (found.bookingRecheckRequired) {
    return rejected("OFFER_STALE", `Offer ${offerId} requires a fresh pre-booking availability and terms check`);
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

function requireCompleteSearchIntent(state: Readonly<RestaurantTaskState>):
  | { valid: true; intent: NonNullable<ReturnType<typeof completeRestaurantSearchIntent>> }
  | { valid: false; verdict: RestaurantActionValidation } {
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  return intent
    ? { valid: true, intent }
    : { valid: false, verdict: rejected("INTENT_INCOMPLETE", "Restaurant search intent is missing required fields") };
}

/** A short result batch is truthful only after every ordinary bounded read is unavailable. */
function resultTargetCannotBeMetWithFurtherRead(state: Readonly<RestaurantTaskState>, now: string): boolean {
  const assessment = assessRestaurantRead(state, now);
  const discoveryAvailable = state.sourceReadState?.googlePlacesSearchBudget !== "EXHAUSTED" && state.searchContinuation?.exhausted !== true;
  return !discoveryAvailable && assessment.factInvestigableCandidateIds.length === 0 && assessment.checkableCandidateIds.length === 0;
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

  if (action.type === "END_READ") {
    const assessment = assessRestaurantRead(state, now);
    return assessment.canEndRead
      ? { status: "ALLOWED" }
      : rejected("PRESENTATION_EVIDENCE_MISSING", assessment.endReadBlockReason ?? "The current read cannot end safely");
  }

  if (action.type === "SEARCH_RESTAURANTS") {
    if (state.sourceReadState?.googlePlacesSearchBudget === "EXHAUSTED") {
      return rejected("DISCOVERY_UNAVAILABLE", "The local per-run Google request budget is exhausted; changing retrieval wording cannot restore it");
    }
    if (state.searchContinuation?.exhausted) {
      return rejected("DISCOVERY_UNAVAILABLE", "The current authoritative Google discovery cursor is exhausted; changing retrieval wording cannot restart it");
    }
    const intent = requireCompleteSearchIntent(state);
    if (!intent.valid) return intent.verdict;
    // Discovery can start before a concrete visit time is known, but an
    // availability request without its party size cannot make a meaningful
    // next read. Ask rather than spending the discovery budget as though this
    // were merely a recommendation request.
    if (intent.intent.target?.goal === "AVAILABILITY" && !state.intentDraft?.partySize) {
      return rejected("INTENT_INCOMPLETE", "Availability requested but party size is missing");
    }
    return { status: "ALLOWED" };
  }

  if (action.type === "INVESTIGATE_CANDIDATE_FACTS") {
    const intent = requireCompleteSearchIntent(state);
    if (!intent.valid) return intent.verdict;
    if (action.candidateIds.length === 0 || new Set(action.candidateIds).size !== action.candidateIds.length) {
      return rejected("CANDIDATE_UNKNOWN", "Fact investigation requires one or more unique known candidate IDs");
    }
    if (!action.candidateIds.every((candidateId) => candidate(state, candidateId))) {
      return rejected("CANDIDATE_UNKNOWN", "Facts can only be investigated for known candidates");
    }
    if (action.candidateIds.length > MAX_AVAILABILITY_CHECK_BATCH) {
      return rejected("AVAILABILITY_BATCH_LIMIT", `Fact investigations are limited to ${MAX_AVAILABILITY_CHECK_BATCH} candidates per batch`);
    }
    const refreshTargets = state.factRefreshRequestedCandidateIds ?? [];
    if (refreshTargets.length > 0 && !action.candidateIds.every((candidateId) => refreshTargets.includes(candidateId))) {
      return rejected("REFRESH_TARGET_REQUIRED", "A pending recommendation refresh may only inspect its previously presented candidate targets");
    }
    const alreadyChecked = action.candidateIds.filter((candidateId) => state.factChecks?.[candidateId] !== undefined && !refreshTargets.includes(candidateId));
    if (alreadyChecked.length) return rejected("FACTS_ALREADY_CHECKED", `Facts were already checked for ${alreadyChecked.join(", ")} in this request`);
    return { status: "ALLOWED" };
  }

  if (action.type === "CHECK_AVAILABILITY") {
    const intent = requireCompleteIntent(state);
    if (!intent.valid) return intent.verdict;
    const presentation = restaurantPresentationReadiness(state, now);
    const refreshTargets = state.refreshRequestedCandidateIds ?? [];
    if (refreshTargets.length > 0 && !action.candidateIds.every((candidateId) => refreshTargets.includes(candidateId))) {
      return rejected("REFRESH_TARGET_REQUIRED", "A pending user refresh may only check its previously presented candidate targets");
    }
    // A user explicitly asked to refresh the full previously presented set.  A
    // newly fresh A must not prevent the remaining B target from receiving its
    // bounded read; partial presentation would silently abandon that request.
    if (action.candidateIds.length === 0 || new Set(action.candidateIds).size !== action.candidateIds.length) {
      return rejected("CANDIDATE_UNKNOWN", "Availability requires one or more unique known candidate IDs");
    }
    if (!action.candidateIds.every((candidateId) => candidate(state, candidateId))) {
      return rejected("CANDIDATE_UNKNOWN", "Availability can only be checked for known candidates");
    }
    if (action.candidateIds.length > MAX_AVAILABILITY_CHECK_BATCH) {
      return rejected("AVAILABILITY_BATCH_LIMIT", `Availability checks are limited to ${MAX_AVAILABILITY_CHECK_BATCH} candidates per batch`);
    }
    const recheckable = new Map(
      restaurantPresentationReadiness(state, now)
        .flatMap((item) => item.recheckReason ? [[item.candidateId, item.recheckReason] as const] : []),
    );
    const unavailable = action.candidateIds.filter((candidateId) =>
      state.availabilityChecks[candidateId] !== undefined && !recheckable.has(candidateId),
    );
    return unavailable.length === 0
      ? { status: "ALLOWED" }
      : rejected("AVAILABILITY_ALREADY_CHECKED", `Availability was already checked for ${unavailable.join(", ")} and no expiry or user refresh permits a recheck`);
  }

  if (action.type === "PRESENT_RESULTS") {
    const intent = requireCompleteSearchIntent(state);
    if (!intent.valid) return intent.verdict;
    if (action.candidateIds.length === 0 || new Set(action.candidateIds).size !== action.candidateIds.length) {
      return rejected("CANDIDATE_UNKNOWN", "Presenting results requires one or more unique known candidate IDs");
    }
    if (state.pendingResultBatchTarget !== undefined) {
      if (action.candidateIds.length > state.pendingResultBatchTarget) {
        return rejected("PRESENTATION_EVIDENCE_MISSING", `The current result target allows at most ${state.pendingResultBatchTarget} qualified restaurants`);
      }
      if (action.candidateIds.length < state.pendingResultBatchTarget && !resultTargetCannotBeMetWithFurtherRead(state, now)) {
        return rejected("PRESENTATION_EVIDENCE_MISSING", `The requested next batch requires ${state.pendingResultBatchTarget} distinct qualified restaurants before it can be presented`);
      }
      const delivered = new Set(state.selectionSession?.deliveredCandidateIds ?? []);
      if (action.candidateIds.some((candidateId) => delivered.has(candidateId))) {
        return rejected("PRESENTATION_EVIDENCE_MISSING", "The requested next batch may contain only previously unshown restaurants");
      }
    }
    if ((state.refreshRequestedCandidateIds?.length ?? 0) > 0) {
      return rejected("PRESENTATION_EVIDENCE_MISSING", "All user-requested refresh targets require one new availability observation before results can be presented");
    }
    if ((state.factRefreshRequestedCandidateIds?.length ?? 0) > 0) {
      return rejected("PRESENTATION_EVIDENCE_MISSING", "All user-requested recommendation refresh targets require one new fact observation before results can be presented");
    }
    for (const candidateId of action.candidateIds) {
      if (!candidate(state, candidateId)) return rejected("CANDIDATE_UNKNOWN", "Results can only include known candidates");
      const readiness = assessRestaurantRead(state, now).presentation.find((item) => item.candidateId === candidateId);
      if (!readiness?.eligible) return rejected("PRESENTATION_EVIDENCE_MISSING", readiness?.missingReason ?? `Candidate ${candidateId} lacks current evidence for the authoritative request`);
    }
    return { status: "ALLOWED" };
  }

  if (!candidate(state, action.candidateId)) {
    return rejected("CANDIDATE_UNKNOWN", `Candidate ${action.candidateId} is not in authoritative discovery results`);
  }
  if (action.type === "SELECT_CANDIDATE") {
    if (!action.offerId) return { status: "ALLOWED" };
    const checkedOffer = freshOffer(state, action.candidateId, action.offerId, now);
    return "status" in checkedOffer ? checkedOffer : { status: "ALLOWED" };
  }

  const intent = requireCompleteIntent(state);
  if (!intent.valid) return intent.verdict;

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
