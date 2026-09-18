import type {
  RestaurantSearchIntent,
  RestaurantIntentDraft,
  RestaurantPhase,
  RestaurantTaskState,
} from "./contracts.js";
import { missingBlockingFields, missingSearchFields } from "./intent-state.js";
import { assessRestaurantRead, restaurantCurrentFactEvidence } from "./read-assessment.js";

export const RESTAURANT_AGENT_CONTEXT_SCHEMA = {
  name: "restaurant_agent_context",
  version: "7",
} as const;

export interface RestaurantAgentContext {
  schemaVersion: "7";
  now: string;
  phase: RestaurantPhase;
  intentDraft?: RestaurantIntentDraft;
  intent?: RestaurantSearchIntent;
  missingBlockingFields: string[];
  candidates: Array<{
    id: string;
    outletName: string;
    address: string;
    matchReasons: string[];
    warnings: string[];
    executionConfidence: "HIGH" | "MEDIUM" | "LOW";
    /** Bounded business facts, not raw pages, URLs, provider payloads, or authority objects. */
    observedFacts: {
      verifiedHardCriteria: string[];
      verifiedNegativeCriteria: string[];
      violatedNegativeCriteria: string[];
      openingHoursMatch: boolean;
      /** Current candidate-bound public commercial facts, each with its source. */
      commercialNotes: Array<{
        field: "COURSE_PRICE" | "COURSE_DETAILS" | "PRIVATE_ROOM_MINIMUM" | "CANCELLATION" | "NO_SHOW";
        value: string;
        source: string;
      }>;
    };
    sourceAttempts: Array<{
      source: string;
      outcome: string;
      reasonCode?: string;
    }>;
  }>;
  availability: Record<string, Array<{
    id: string;
    dateTime: string;
    partySize: number;
    seating?: string;
    plan?: string;
    price?: { amount: number; currency: string; basis: "PER_PERSON" | "TOTAL" };
    bookingMode: "INSTANT" | "REQUEST";
    executionMode: "API" | "BROWSER" | "TAKEOVER" | "DEEPLINK";
    displayExpiresAt?: string;
  }>>;
  /** Business-only summary. Provider, URL, browser, DOM and evidence internals stay out. */
  availabilityChecks: Record<string, {
    status: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN" | "SOURCE_UNSUPPORTED";
    receptionMode: "RESERVATION_SUPPORTED" | "WALK_IN_SUPPORTED" | "RESERVATION_AND_WALK_IN_SUPPORTED" | "UNKNOWN";
    reasonCode?: string;
  }>;
  /** Code-derived eligibility; the Agent chooses an action but cannot infer freshness itself. */
  presentation: Array<{
    candidateId: string;
    eligible: boolean;
    missingReason?: string;
    recheckReason?: "DISPLAY_EVIDENCE_EXPIRED" | "USER_REQUESTED_REFRESH";
  }>;
  /** A user-requested same-condition batch cannot repeat delivered candidates. */
  resultBatchTarget?: { candidateCount: number; excludeCandidateIds: string[] };
  /** Verbatim user preference feedback; it does not establish a price or fact. */
  selectionFeedback?: string[];
  /** Candidates allowed for the next bounded availability read, including justified rechecks. */
  checkableCandidateIds?: string[];
  /** Candidates whose fact evidence has not yet received one bounded read. */
  factInvestigableCandidateIds?: string[];
  /** A bounded model-selected ending is legal only when code-derived records support it. */
  readCompletion: { allowed: boolean; reason?: string; investigationRecorded: boolean; unresolvedCandidateIds: string[] };
  /** Code-derived legal scope. The Agent selects among it; it cannot expand it. */
  legalActions: {
    search: boolean;
    investigateCandidateFacts: string[];
    checkAvailability: string[];
    presentResults: string[];
    endRead: boolean;
  };
  searchAvailability: { available: boolean; reason?: string };
  selectedCandidateId?: string;
  selectedOfferId?: string;
  failure?: { code: string };
}

/** Domain-owned, minimal projection for one untrusted Restaurant Agent decision. */
export function projectRestaurantAgentContext(
  state: Readonly<RestaurantTaskState>,
  now = new Date().toISOString(),
): RestaurantAgentContext {
  const assessment = assessRestaurantRead(state, now);
  const presentation = assessment.presentation;
  const candidateSummary = (candidateId: string) => {
    const facts = restaurantCurrentFactEvidence(state, candidateId);
    const claimed = (key: string) => facts.flatMap((evidence) => {
      const value = evidence.claims[key];
      return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
    });
    const openingHoursMatch = facts.some((evidence) => evidence.claims.openingHoursMatch === true);
    const commercialNote = (
      field: "COURSE_PRICE" | "PRIVATE_ROOM_MINIMUM" | "CANCELLATION" | "NO_SHOW",
      claim: "coursePriceYen" | "privateRoomMinimumYen" | "cancellationTerms" | "noShowTerms",
      format: (value: string | number, evidence: typeof facts[number]) => string | undefined,
    ) => facts.flatMap((evidence) => {
      const value = evidence.claims[claim];
      if (typeof value !== "string" && typeof value !== "number") return [];
      const formatted = format(value, evidence);
      return formatted ? [{ field, value: formatted, source: evidence.provider }] : [];
    });
    const commercialNotes = [
      ...facts.flatMap(evidence => Array.isArray(evidence.claims.listedCourseDetails) ? evidence.claims.listedCourseDetails.filter((value): value is string => typeof value === "string" && value.length <= 1600).slice(0, 3).map(value => ({ field: "COURSE_DETAILS" as const, value, source: evidence.provider })) : []),
      ...commercialNote("COURSE_PRICE", "coursePriceYen", (value, evidence) => {
        if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return undefined;
        const tax = evidence.claims.coursePriceTax;
        return `${value} JPY (${tax === "INCLUDED" ? "tax included" : tax === "EXCLUDED" ? "tax excluded" : "tax unspecified"})`;
      }),
      ...commercialNote("PRIVATE_ROOM_MINIMUM", "privateRoomMinimumYen", (value) =>
        typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? `${value} JPY` : undefined),
      ...commercialNote("CANCELLATION", "cancellationTerms", (value) => typeof value === "string" && value.trim() ? value.trim() : undefined),
      ...commercialNote("NO_SHOW", "noShowTerms", (value) => typeof value === "string" && value.trim() ? value.trim() : undefined),
    ];
    const availability = state.availabilityChecks[candidateId];
    const factCheck = state.factChecks?.[candidateId];
    const sourceAttempts = [
      ...(factCheck?.sourceAttempts ?? (factCheck?.sourceProvider ? [{ source: factCheck.sourceProvider, outcome: factCheck.status, ...(factCheck.reasonCode ? { reasonCode: factCheck.reasonCode } : {}) }] : [])),
      ...(availability?.sourceAttempts ?? []),
      ...(availability?.sourceAttempts || !availability?.sourceProvider ? [] : [{ source: availability.sourceProvider, outcome: availability.status, ...(availability.reasonCode ? { reasonCode: availability.reasonCode } : {}) }]),
    ];
    return {
      observedFacts: {
        verifiedHardCriteria: [...new Set(claimed("verifiedHardCriteria"))],
        verifiedNegativeCriteria: [...new Set(claimed("verifiedNegativeCriteria"))],
        violatedNegativeCriteria: [...new Set(claimed("violatedNegativeCriteria"))],
        openingHoursMatch,
        commercialNotes,
      },
      sourceAttempts,
    };
  };
  return {
    schemaVersion: "7",
    now,
    phase: state.phase,
    ...(state.intentDraft ? { intentDraft: structuredClone(state.intentDraft) } : {}),
    ...(state.intent ? { intent: structuredClone(state.intent) } : {}),
    missingBlockingFields: state.intentDraft?.target?.goal === "AVAILABILITY"
      ? missingBlockingFields(state.intentDraft)
      : missingSearchFields(state.intentDraft ?? {}),
    candidates: state.candidates.map((candidate) => ({
      id: candidate.restaurant.id,
      outletName: candidate.restaurant.outletName,
      address: candidate.restaurant.address,
      matchReasons: [...candidate.matchReasons],
      warnings: [...candidate.warnings],
      executionConfidence: candidate.executionConfidence,
      ...candidateSummary(candidate.restaurant.id),
    })),
    availability: Object.fromEntries(
      Object.entries(state.availability).map(([candidateId, offers]) => [
        candidateId,
        offers.map((offer) => ({
          id: offer.id,
          dateTime: offer.dateTime,
          partySize: offer.partySize,
          ...(offer.seating ? { seating: offer.seating } : {}),
          ...(offer.plan ? { plan: offer.plan } : {}),
          ...(offer.price ? { price: structuredClone(offer.price) } : {}),
          bookingMode: offer.bookingMode,
          executionMode: offer.executionMode,
          ...(offer.displayExpiresAt ? { displayExpiresAt: offer.displayExpiresAt } : {}),
        })),
      ]),
    ),
    availabilityChecks: Object.fromEntries(
      Object.entries(state.availabilityChecks).map(([candidateId, check]) => [
        candidateId,
        {
          status: check.status,
          receptionMode: check.receptionMode ?? "UNKNOWN",
          ...(check.reasonCode ? { reasonCode: check.reasonCode } : {}),
        },
      ]),
    ),
    presentation,
    searchAvailability: state.sourceReadState?.googlePlacesSearchBudget === "EXHAUSTED" || state.searchContinuation?.exhausted === true
      ? { available: false, reason: state.searchContinuation?.exhausted ? "GOOGLE_DISCOVERY_EXHAUSTED" : "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" }
      : { available: true },
    ...(assessment.checkableCandidateIds.length ? { checkableCandidateIds: assessment.checkableCandidateIds } : {}),
    ...(assessment.factInvestigableCandidateIds.length ? { factInvestigableCandidateIds: assessment.factInvestigableCandidateIds } : {}),
    readCompletion: {
      allowed: assessment.canEndRead,
      investigationRecorded: assessment.investigationRecorded,
      unresolvedCandidateIds: assessment.unresolvedCandidateIds,
      ...(assessment.endReadBlockReason ? { reason: assessment.endReadBlockReason } : {}),
    },
    legalActions: {
      search: state.sourceReadState?.googlePlacesSearchBudget !== "EXHAUSTED" && state.searchContinuation?.exhausted !== true && missingSearchFields(state.intentDraft ?? {}).length === 0,
      investigateCandidateFacts: [...assessment.factInvestigableCandidateIds],
      checkAvailability: [...assessment.checkableCandidateIds],
      presentResults: presentation
        .filter((item) => item.eligible && !(state.pendingResultBatchTarget !== undefined && (state.selectionSession?.deliveredCandidateIds ?? []).includes(item.candidateId)))
        .map((item) => item.candidateId),
      endRead: assessment.canEndRead,
    },
    ...(state.pendingResultBatchTarget !== undefined ? {
      resultBatchTarget: {
        candidateCount: state.pendingResultBatchTarget,
        excludeCandidateIds: [...(state.selectionSession?.deliveredCandidateIds ?? [])],
      },
    } : {}),
    ...(state.selectionSession?.feedback?.length ? { selectionFeedback: [...state.selectionSession.feedback] } : {}),
    ...(state.selectedCandidateId ? { selectedCandidateId: state.selectedCandidateId } : {}),
    ...(state.selectedOfferId ? { selectedOfferId: state.selectedOfferId } : {}),
    ...(state.failure ? { failure: { code: state.failure.code } } : {}),
  };
}
