import type {
  RestaurantBookingIntent,
  RestaurantIntentDraft,
  RestaurantPhase,
  RestaurantTaskState,
} from "./contracts.js";
import { missingBlockingFields } from "./intent-state.js";
import { restaurantPresentationReadiness } from "./action-validator.js";

export const RESTAURANT_AGENT_CONTEXT_SCHEMA = {
  name: "restaurant_agent_context",
  version: "3",
} as const;

export interface RestaurantAgentContext {
  schemaVersion: "3";
  now: string;
  phase: RestaurantPhase;
  intentDraft?: RestaurantIntentDraft;
  intent?: RestaurantBookingIntent;
  missingBlockingFields: string[];
  candidates: Array<{
    id: string;
    outletName: string;
    address: string;
    matchReasons: string[];
    warnings: string[];
    executionConfidence: "HIGH" | "MEDIUM" | "LOW";
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
    reasonCode?: string;
  }>;
  /** Code-derived eligibility; the Agent chooses an action but cannot infer freshness itself. */
  presentation: Array<{
    candidateId: string;
    eligible: boolean;
    missingReason?: string;
    recheckReason?: "DISPLAY_EVIDENCE_EXPIRED" | "USER_REQUESTED_REFRESH";
  }>;
  /** Candidates allowed for the next bounded availability read, including justified rechecks. */
  checkableCandidateIds?: string[];
  selectedCandidateId?: string;
  selectedOfferId?: string;
  failure?: { code: string };
}

/** Domain-owned, minimal projection for one untrusted Restaurant Agent decision. */
export function projectRestaurantAgentContext(
  state: Readonly<RestaurantTaskState>,
  now = new Date().toISOString(),
): RestaurantAgentContext {
  const presentation = restaurantPresentationReadiness(state, now);
  return {
    schemaVersion: "3",
    now,
    phase: state.phase,
    ...(state.intentDraft ? { intentDraft: structuredClone(state.intentDraft) } : {}),
    ...(state.intent ? { intent: structuredClone(state.intent) } : {}),
    missingBlockingFields: missingBlockingFields(state.intentDraft ?? {}),
    candidates: state.candidates.map((candidate) => ({
      id: candidate.restaurant.id,
      outletName: candidate.restaurant.outletName,
      address: candidate.restaurant.address,
      matchReasons: [...candidate.matchReasons],
      warnings: [...candidate.warnings],
      executionConfidence: candidate.executionConfidence,
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
          ...(check.reasonCode ? { reasonCode: check.reasonCode } : {}),
        },
      ]),
    ),
    presentation,
    checkableCandidateIds: presentation
      .filter((item) => state.availabilityChecks[item.candidateId] === undefined || item.recheckReason !== undefined)
      .map((item) => item.candidateId),
    ...(state.selectedCandidateId ? { selectedCandidateId: state.selectedCandidateId } : {}),
    ...(state.selectedOfferId ? { selectedOfferId: state.selectedOfferId } : {}),
    ...(state.failure ? { failure: { code: state.failure.code } } : {}),
  };
}
