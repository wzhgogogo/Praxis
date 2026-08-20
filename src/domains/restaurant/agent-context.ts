import type {
  RestaurantBookingIntent,
  RestaurantIntentDraft,
  RestaurantPhase,
  RestaurantTaskState,
} from "./contracts.js";
import { missingBlockingFields } from "./intent-state.js";

export const RESTAURANT_AGENT_CONTEXT_SCHEMA = {
  name: "restaurant_agent_context",
  version: "1",
} as const;

export interface RestaurantAgentContext {
  schemaVersion: "1";
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
    expiresAt: string;
  }>>;
  selectedCandidateId?: string;
  selectedOfferId?: string;
  failure?: { code: string };
}

/** Domain-owned, minimal projection for one untrusted Restaurant Agent decision. */
export function projectRestaurantAgentContext(
  state: Readonly<RestaurantTaskState>,
): RestaurantAgentContext {
  return {
    schemaVersion: "1",
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
          expiresAt: offer.expiresAt,
        })),
      ]),
    ),
    ...(state.selectedCandidateId ? { selectedCandidateId: state.selectedCandidateId } : {}),
    ...(state.selectedOfferId ? { selectedOfferId: state.selectedOfferId } : {}),
    ...(state.failure ? { failure: { code: state.failure.code } } : {}),
  };
}
