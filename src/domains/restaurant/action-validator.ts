import type { RestaurantAgentAction } from "./agent-action.js";
import type { AvailabilityOffer, RestaurantTaskState } from "./contracts.js";
import { completeRestaurantIntent, completeRestaurantSearchIntent } from "./intent-state.js";
import { isDisplayFresh } from "./availability-freshness.js";

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
  return state.phase === "BOOKED_VERIFIED" || state.phase === "PRESENT_RESULTS" || state.phase === "OUTCOME_UNKNOWN" || state.phase === "FAILED";
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function stringClaim(evidence: RestaurantTaskState["readEvidence"][number], key: string): string | undefined {
  const value = evidence.claims[key];
  return typeof value === "string" ? value : undefined;
}

function stringListClaim(evidence: RestaurantTaskState["readEvidence"][number], key: string): string[] {
  const value = evidence.claims[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

export interface RestaurantPresentationReadiness {
  candidateId: string;
  eligible: boolean;
  missingReason?: string;
  recheckReason?: "DISPLAY_EVIDENCE_EXPIRED" | "USER_REQUESTED_REFRESH";
}

function presentationEvidenceIds(
  state: Readonly<RestaurantTaskState>,
  candidateId: string,
  intent: NonNullable<ReturnType<typeof completeRestaurantSearchIntent>>,
  now: string,
): { valid: true; evidenceIds: string[] } | { valid: false; reason: string } {
  const candidateEvidence = state.readEvidence.filter((evidence) => evidence.candidateId === candidateId);
  const entities = candidateEvidence.filter((evidence) => evidence.kind === "ENTITY_MATCH" && evidence.entityMatch?.confidence === "HIGH");
  const area = candidateEvidence.find((evidence) =>
    evidence.kind === "DISCOVERY" && evidence.claims.areaMatch === true && normalized(stringClaim(evidence, "areaQuery") ?? "") === normalized(intent.area.query),
  );
  if (!area) return { valid: false, reason: `Candidate ${candidateId} has no evidence that it satisfies ${intent.area.query}` };
  for (const criterion of intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD")) {
    const supported = candidateEvidence.some((evidence) =>
      evidence.kind === "RESTAURANT_FACT" && stringListClaim(evidence, "verifiedHardCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (!supported) return { valid: false, reason: `Candidate ${candidateId} has no evidence for HARD criterion ${criterion.text}` };
  }
  for (const criterion of intent.criteria.filter((item) => item.polarity === "NEGATIVE" && item.strength === "HARD")) {
    const violated = candidateEvidence.some((evidence) =>
      evidence.kind === "RESTAURANT_FACT" && stringListClaim(evidence, "violatedNegativeCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (violated) return { valid: false, reason: `Candidate ${candidateId} violates negative criterion ${criterion.text}` };
    const supported = candidateEvidence.some((evidence) =>
      evidence.kind === "RESTAURANT_FACT" && stringListClaim(evidence, "verifiedNegativeCriteria").some((value) => normalized(value) === normalized(criterion.text)),
    );
    if (!supported) return { valid: false, reason: `Candidate ${candidateId} has no source fact supporting negative criterion ${criterion.text}` };
  }
  const requiresAvailability = intent.target?.goal === "AVAILABILITY";
  if (!requiresAvailability) {
    const entity = entities[0];
    if (!entity) return { valid: false, reason: `Candidate ${candidateId} has no HIGH outlet identity evidence` };
    const openingHours = intent.date && intent.timeWindow
      ? candidateEvidence.find((evidence) => evidence.kind === "RESTAURANT_FACT" && evidence.claims.openingHoursMatch === true)
      : undefined;
    if (intent.date && intent.timeWindow && !openingHours) {
      return { valid: false, reason: `Candidate ${candidateId} has no opening-hours evidence for the requested visit window` };
    }
    return {
      valid: true,
      evidenceIds: [...new Set([entity.evidenceId, area.evidenceId, ...(openingHours ? [openingHours.evidenceId] : []), ...candidateEvidence
        .filter((evidence) => evidence.kind === "RESTAURANT_FACT")
        .map((evidence) => evidence.evidenceId)])],
    };
  }
  const bookingIntent = completeRestaurantIntent(state.intentDraft);
  if (!bookingIntent) return { valid: false, reason: "Availability requested but party size is missing" };
  const offer = state.availability[candidateId]?.find((item) =>
    isDisplayFresh(item.displayExpiresAt, now) && item.partySize === bookingIntent.partySize && item.dateTime.slice(0, 10) === bookingIntent.date &&
    item.dateTime.slice(11, 16) >= bookingIntent.timeWindow.earliest && item.dateTime.slice(11, 16) <= bookingIntent.timeWindow.latest,
  );
  const availability = candidateEvidence.find((evidence) =>
    evidence.kind === "AVAILABILITY" &&
      isDisplayFresh(evidence.displayExpiresAt, now) &&
      stringClaim(evidence, "date") === bookingIntent.date && evidence.claims.partySize === bookingIntent.partySize &&
      offer !== undefined && stringListClaim(evidence, "visibleSlots").includes(offer.dateTime.slice(11, 16)),
  );
  const entity = availability
    ? entities.find((item) => item.provider === availability.provider && item.sourceEntityId === availability.sourceEntityId)
    : undefined;
  if (!entity) return { valid: false, reason: `Candidate ${candidateId} has no HIGH outlet identity evidence associated with its availability source` };
  if (!offer || state.availabilityChecks[candidateId]?.status !== "AVAILABLE" || !availability) {
    return { valid: false, reason: `Candidate ${candidateId} lacks fresh evidenced availability for the authoritative request` };
  }
  return { valid: true, evidenceIds: [...new Set([entity.evidenceId, area.evidenceId, availability.evidenceId, ...candidateEvidence
    .filter((evidence) => evidence.kind === "RESTAURANT_FACT")
    .map((evidence) => evidence.evidenceId)])] };
}

/** Code-derived read eligibility is the only availability status exposed to the Agent. */
export function restaurantPresentationReadiness(
  state: Readonly<RestaurantTaskState>,
  now: string,
): RestaurantPresentationReadiness[] {
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  if (!intent) return [];
  return state.candidates.map((candidate) => {
    const candidateId = candidate.restaurant.id;
    const userRequestedRefresh = state.refreshRequestedCandidateIds?.includes(candidateId) ?? false;
    if (userRequestedRefresh) {
      return {
        candidateId,
        eligible: false,
        missingReason: "A user-requested read-only refresh is pending",
        recheckReason: "USER_REQUESTED_REFRESH" as const,
      };
    }
    const evidence = presentationEvidenceIds(state, candidateId, intent, now);
    if (evidence.valid) return { candidateId, eligible: true };
    const check = state.availabilityChecks[candidateId];
    const hasExpiredDisplayEvidence = check?.status === "AVAILABLE" && !isDisplayFresh(check.displayExpiresAt, now);
    return {
      candidateId,
      eligible: false,
      missingReason: evidence.reason,
      ...(userRequestedRefresh
        ? { recheckReason: "USER_REQUESTED_REFRESH" as const }
        : hasExpiredDisplayEvidence ? { recheckReason: "DISPLAY_EVIDENCE_EXPIRED" as const } : {}),
    };
  });
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

  if (action.type === "SEARCH_RESTAURANTS") {
    if (state.sourceReadState?.googlePlacesSearchBudget === "EXHAUSTED") {
      return rejected("DISCOVERY_UNAVAILABLE", "Google discovery budget is exhausted for this run; changing retrieval wording cannot restore it");
    }
    const intent = requireCompleteSearchIntent(state);
    if (!intent.valid) return intent.verdict;
    if (intent.intent.target?.goal === "AVAILABILITY" && !completeRestaurantIntent(state.intentDraft)) {
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
    if (refreshTargets.length === 0 && presentation.some((item) => item.eligible)) {
      return rejected("PRESENTATION_READY", "A fresh evidence-grounded result is ready; present it before investigating more candidates");
    }
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
    if ((state.refreshRequestedCandidateIds?.length ?? 0) > 0) {
      return rejected("PRESENTATION_EVIDENCE_MISSING", "All user-requested refresh targets require one new availability observation before results can be presented");
    }
    if ((state.factRefreshRequestedCandidateIds?.length ?? 0) > 0) {
      return rejected("PRESENTATION_EVIDENCE_MISSING", "All user-requested recommendation refresh targets require one new fact observation before results can be presented");
    }
    for (const candidateId of action.candidateIds) {
      if (!candidate(state, candidateId)) return rejected("CANDIDATE_UNKNOWN", "Results can only include known candidates");
      const evidence = presentationEvidenceIds(state, candidateId, intent.intent, now);
      if (!evidence.valid) return rejected("PRESENTATION_EVIDENCE_MISSING", evidence.reason);
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
