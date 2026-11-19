import {restaurantCandidateReadPriority} from "./candidate-read-priority.js";
import {restaurantReadActionFits,RESTAURANT_READ_CONCLUSION_RESERVE_MS} from "./read-time-reserve.js";
import { priceCommercialNotes } from "./condition-states.js";
import type {
  RestaurantSearchIntent,
  RestaurantReadEvidence,
  RestaurantIntentDraft,
  RestaurantPhase,
  RestaurantTaskState,
} from "./contracts.js";
import { missingBlockingFields, missingSearchFields } from "./intent-state.js";
import { assessRestaurantRead, restaurantPresentableCandidateIds, discoveryShortBatchDeliveryReady, discoveryPlanSearchBlockReason, restaurantCurrentFactEvidence, immediateRequestWindowExpired } from "./read-assessment.js";
import { observedCandidateAvailabilityPath, observedCandidateDistance, type CandidateDistanceObservation } from "./candidate-read-observations.js";
import { defaultBatchDeliveryWindowActive, type RestaurantReadBudgetStatus } from "./action-validator.js";

export const RESTAURANT_AGENT_CONTEXT_SCHEMA = {
  name: "restaurant_agent_context",
  version: "17",
} as const;

export interface RestaurantAgentContext {
  schemaVersion: "17";
  now: string;
  pageQuestion?: { question: string; outletName: string };
  /** Code-owned whole-read remainder; the Agent cannot alter it. */
  readBudget?: {remainingMs:number; conclusionReserveMs:number};
  phase: RestaurantPhase;
  intentDraft?: RestaurantIntentDraft;
  intent?: RestaurantSearchIntent;
  missingBlockingFields: string[];
  candidates: Array<{
    id: string;
    outletName: string;
    address: string;
    distanceObservation?: CandidateDistanceObservation;
    sourceCategories: Array<{ source: string; values: string[] }>;
    availabilityPath: "DIRECT_SOURCE_PAGE" | "NAME_RESOLUTION" | "NONE";
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
        field: "COURSE_PRICE" | "COURSE_DETAILS" | "DINNER_BUDGET" | "LUNCH_BUDGET" | "PRIVATE_ROOM_MINIMUM" | "CANCELLATION" | "NO_SHOW";
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
    answerPageQuestion: boolean;
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

/** Advisory discovery observations; they never participate in qualification. */
export function observedCandidateSourceCategories(evidence: readonly RestaurantReadEvidence[], candidateId: string, now: string) {
  const sources = new Map<string, Set<string>>();
  for (const item of evidence) {
    if (item.kind !== "DISCOVERY" || item.candidateId !== candidateId || Date.parse(item.observedAt) > Date.parse(now)) continue;
    const values = [item.claims.primaryType, ...(Array.isArray(item.claims.types) ? item.claims.types : []), ...(Array.isArray(item.claims.sourceCategories) ? item.claims.sourceCategories : [])]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= 240);
    if (!values.length) continue;
    const observed = sources.get(item.provider) ?? new Set<string>();
    values.forEach(value => observed.add(value)); sources.set(item.provider, observed);
  }
  return [...sources].map(([source, values]) => ({ source, values: [...values].slice(0, 20) }));
}

/** Domain-owned, minimal projection for one untrusted Restaurant Agent decision. */
export function projectRestaurantAgentContext(
  state: Readonly<RestaurantTaskState>,
  now = new Date().toISOString(),
  budget: RestaurantReadBudgetStatus = {},
): RestaurantAgentContext {
  const assessment = assessRestaurantRead(state, now);
  const factRefreshPending = Boolean(state.factRefreshRequestedCandidateIds?.length);
  const deliveryWindow = defaultBatchDeliveryWindowActive(state, now);
  const nativeBatchDeliveryReady = discoveryShortBatchDeliveryReady(state, now);
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
      ...priceCommercialNotes(facts),
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
    schemaVersion: "17",
    now,
    ...(state.pageQuestion && !state.pageQuestion.result ? { pageQuestion: { question: state.pageQuestion.question, outletName: state.candidates.find(c => c.restaurant.id === state.pageQuestion!.candidateId)?.restaurant.outletName ?? "" } } : {}),
    ...(budget.remainingAutomaticMs !== undefined ? {readBudget:{remainingMs:budget.remainingAutomaticMs,conclusionReserveMs:RESTAURANT_READ_CONCLUSION_RESERVE_MS}} : {}),
    phase: state.phase,
    ...(state.intentDraft ? { intentDraft: structuredClone(state.intentDraft) } : {}),
    ...(state.intent ? { intent: structuredClone(state.intent) } : {}),
    missingBlockingFields: state.intentDraft?.target?.goal === "AVAILABILITY"
      ? missingBlockingFields(state.intentDraft)
      : missingSearchFields(state.intentDraft ?? {}),
    candidates: [...state.candidates].sort((a,b)=>restaurantCandidateReadPriority(state,a.restaurant.id)-restaurantCandidateReadPriority(state,b.restaurant.id)).map((candidate) => ({
      id: candidate.restaurant.id,
      outletName: candidate.restaurant.outletName,
      address: candidate.restaurant.address,
      ...observedCandidateDistance(state.readEvidence, candidate.restaurant.id, now),
      sourceCategories: observedCandidateSourceCategories(state.readEvidence, candidate.restaurant.id, now),
      availabilityPath: observedCandidateAvailabilityPath(state.readEvidence, candidate.restaurant.id, now),
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
    searchAvailability: factRefreshPending ? { available: false, reason: "REFRESH_TARGET_REQUIRED" } : !restaurantReadActionFits("SEARCH_RESTAURANTS",budget.remainingAutomaticMs) ? {available:false,reason:"READ_TIME_RESERVED"} : /^(MODEL_CALL_RESERVE|READ_TIME_RESERVE|IMMEDIATE_SOURCES_CLOSED)/.test(assessment.endReadReason ?? "")
      ? { available: false, reason: assessment.endReadReason!.split(":", 1)[0]! }
      : immediateRequestWindowExpired(state, now)
      ? { available: false, reason: "IMMEDIATE_REQUEST_EXPIRED" }
      : deliveryWindow
      ? { available: false, reason: "DEFAULT_BATCH_DELIVERY_WINDOW" }
      : nativeBatchDeliveryReady
      ? { available: false, reason: "NATIVE_CURRENT_BATCH_DELIVERY_READY" }
      : discoveryPlanSearchBlockReason(state, now)
      ? { available: false, reason: "NATIVE_FIRST_BATCH_PENDING" }
      : state.sourceReadState?.googlePlacesSearchBudget === "EXHAUSTED" || state.searchContinuation?.exhausted === true
      ? { available: false, reason: state.searchContinuation?.exhausted ? "DISCOVERY_PLAN_EXHAUSTED" : "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" }
      : { available: true },
    ...(!deliveryWindow && restaurantReadActionFits("CHECK_AVAILABILITY",budget.remainingAutomaticMs) && assessment.checkableCandidateIds.length ? { checkableCandidateIds: [...assessment.checkableCandidateIds].sort((a,b)=>restaurantCandidateReadPriority(state,a)-restaurantCandidateReadPriority(state,b)) } : {}),
    ...(!deliveryWindow && restaurantReadActionFits("INVESTIGATE_CANDIDATE_FACTS",budget.remainingAutomaticMs) && assessment.factInvestigableCandidateIds.length ? { factInvestigableCandidateIds: [...assessment.factInvestigableCandidateIds].sort((a,b)=>restaurantCandidateReadPriority(state,a)-restaurantCandidateReadPriority(state,b)) } : {}),
    readCompletion: {
      allowed: assessment.canEndRead,
      investigationRecorded: assessment.investigationRecorded,
      unresolvedCandidateIds: assessment.unresolvedCandidateIds,
      ...(assessment.endReadBlockReason || assessment.endReadReason ? { reason: assessment.endReadBlockReason ?? assessment.endReadReason } : {}),
    },
    legalActions: {
      answerPageQuestion: !!state.pageQuestion && !state.pageQuestion.result,
      search: !factRefreshPending && restaurantReadActionFits("SEARCH_RESTAURANTS",budget.remainingAutomaticMs) && !/^(MODEL_CALL_RESERVE|READ_TIME_RESERVE|IMMEDIATE_SOURCES_CLOSED)/.test(assessment.endReadReason ?? "") && !immediateRequestWindowExpired(state, now) && !deliveryWindow && !nativeBatchDeliveryReady && !discoveryPlanSearchBlockReason(state, now) && state.sourceReadState?.googlePlacesSearchBudget !== "EXHAUSTED" && state.searchContinuation?.exhausted !== true && missingSearchFields(state.intentDraft ?? {}).length === 0,
      investigateCandidateFacts: deliveryWindow || !restaurantReadActionFits("INVESTIGATE_CANDIDATE_FACTS",budget.remainingAutomaticMs) ? [] : [...assessment.factInvestigableCandidateIds].sort((a,b)=>restaurantCandidateReadPriority(state,a)-restaurantCandidateReadPriority(state,b)),
      checkAvailability: deliveryWindow || !restaurantReadActionFits("CHECK_AVAILABILITY",budget.remainingAutomaticMs) ? [] : [...assessment.checkableCandidateIds].sort((a,b)=>restaurantCandidateReadPriority(state,a)-restaurantCandidateReadPriority(state,b)),
      presentResults: restaurantPresentableCandidateIds(state, now, presentation),
      endRead: assessment.canEndRead,
    },
    ...(state.pageQuestion && !state.pageQuestion.result ? { legalActions: {
      answerPageQuestion: true, search: false, investigateCandidateFacts: [], checkAvailability: [], presentResults: [], endRead: false,
    } } : {}),
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
