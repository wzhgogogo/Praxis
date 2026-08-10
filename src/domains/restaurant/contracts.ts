import type { ExecutionResult } from "../../core/execution/contracts.js";
import type { ActionProposal, Authorization, PolicyDenialCode } from "../../core/policy/contracts.js";
import type { DomainCommand, DomainEvent } from "../../core/task-runtime/contracts.js";

export const RESTAURANT_BLOCKING_FIELDS = [
  "date",
  "timeWindow",
  "partySize",
  "area",
] as const;

export type RestaurantBlockingField = (typeof RESTAURANT_BLOCKING_FIELDS)[number];

export interface RestaurantIntentDraft {
  schemaVersion: "1";
  timezone: "Asia/Tokyo";
  date?: string;
  timeWindow?: { earliest: string; latest: string };
  partySize?: number;
  area?: { query: string; placeId?: string; radiusMeters?: number };
  cuisines: string[];
  budgetPerPerson?: { max: number; currency: "JPY" };
  hardConstraints: string[];
  softPreferences: string[];
  missingRequiredFields: RestaurantBlockingField[];
}

export interface RestaurantBookingIntent {
  timezone: "Asia/Tokyo";
  date: string;
  timeWindow: { earliest: string; latest: string };
  partySize: number;
  area: { query: string; placeId?: string; radiusMeters?: number };
  cuisines: string[];
  budgetPerPerson?: { max: number; currency: "JPY" };
  hardConstraints: string[];
  softPreferences: string[];
  missingRequiredFields: RestaurantBlockingField[];
}

export interface RestaurantOutlet {
  id: string;
  brandName?: string;
  outletName: string;
  sourceIds: Record<string, string>;
  address: string;
  coordinates?: { lat: number; lng: number };
  provenance: Record<string, string>;
}

export interface AvailabilityOffer {
  id: string;
  restaurantId: string;
  source: string;
  dateTime: string;
  timezone: "Asia/Tokyo";
  partySize: number;
  seating?: string;
  plan?: string;
  price?: { amount: number; currency: "JPY"; basis: "PER_PERSON" | "TOTAL" };
  cancellationTerms?: string;
  bookingMode: "INSTANT" | "REQUEST";
  executionMode: "API" | "BROWSER" | "TAKEOVER" | "DEEPLINK";
  checkedAt: string;
  expiresAt: string;
}

export interface ExecutableCandidate {
  restaurant: RestaurantOutlet;
  offer: AvailabilityOffer;
  matchReasons: string[];
  warnings: string[];
  executionConfidence: "HIGH" | "MEDIUM" | "LOW";
}

export type BookingProofField =
  | "attemptId"
  | "providerReference"
  | "restaurantId"
  | "dateTime"
  | "partySize"
  | "status";

export type BookingProofSource =
  | "SUCCESS_PAGE"
  | "ORDER_PAGE"
  | "CONFIRMATION_EMAIL"
  | "MOCK_PROVIDER"
  | "FORM_SUBMITTED"
  | "THANK_YOU_PAGE";

export interface BookingProofClaims {
  status?: "CONFIRMED" | "SUBMITTED" | "UNKNOWN";
  providerReference?: string;
  restaurantId?: string;
  dateTime?: string;
  partySize?: number;
}

export interface BookingProofBundle {
  evidenceId: string;
  attemptId: string;
  strength: "STRONG" | "WEAK";
  source: BookingProofSource;
  observedAt: string;
  artifactRef?: {
    kind: "API_RESPONSE" | "DOM_SNAPSHOT" | "EMAIL" | "MOCK";
    reference: string;
    sha256?: string;
  };
  claims: BookingProofClaims;
  matchedFields: BookingProofField[];
  missingFields: BookingProofField[];
  conflictingFields: BookingProofField[];
}

export interface ConfirmedBookingProof extends Omit<BookingProofBundle, "strength" | "claims"> {
  strength: "STRONG";
  claims: BookingProofClaims & {
    status: "CONFIRMED";
    providerReference: string;
    restaurantId: string;
    dateTime: string;
    partySize: number;
  };
}

export type BookingVerificationObservation =
  | { status: "EVIDENCE"; evidence: BookingProofBundle; checkedAt: string }
  | { status: "ABSENT"; checkedAt: string }
  | { status: "INCONCLUSIVE"; evidence?: BookingProofBundle; checkedAt: string };

export type RestaurantVerificationResult =
  | { status: "CONFIRMED"; evidence: ConfirmedBookingProof }
  | { status: "ABSENT"; checkedAt: string }
  | { status: "INCONCLUSIVE"; evidence?: BookingProofBundle; checkedAt: string };

export type RestaurantPhase =
  | "UNDERSTANDING"
  | "NEEDS_INPUT"
  | "SEARCHING"
  | "AWAITING_SELECTION"
  | "REVALIDATING"
  | "AWAITING_AUTHORIZATION"
  | "EXECUTING"
  | "VERIFYING"
  | "BOOKED_VERIFIED"
  | "SELECTION_REQUIRED"
  | "OUTCOME_UNKNOWN"
  | "FAILED";

export interface VerifiedReservation {
  providerReference: string;
  restaurantId: string;
  dateTime: string;
  partySize: number;
}

export interface RestaurantTaskState {
  schemaVersion: "3";
  phase: RestaurantPhase;
  intentDraft?: RestaurantIntentDraft;
  intent?: RestaurantBookingIntent;
  candidates: ExecutableCandidate[];
  searchRevision: number;
  selectedCandidateId?: string;
  proposal?: ActionProposal;
  authorization?: Authorization;
  activeAttemptId?: string;
  lastExecutionResult?: ExecutionResult;
  evidence?: BookingProofBundle;
  reservation?: VerifiedReservation;
  failure?: { code: string; message: string };
}

export type RestaurantOutcome =
  | { status: "BOOKED_VERIFIED"; reservation: VerifiedReservation }
  | { status: "OUTCOME_UNKNOWN"; attemptId: string }
  | { status: "FAILED"; reason: string };

export type RestaurantEvent =
  | (DomainEvent & { type: "INTENT_PARSED"; draft: RestaurantIntentDraft })
  | (DomainEvent & { type: "SEARCH_COMPLETED"; candidates: ExecutableCandidate[] })
  | (DomainEvent & { type: "SEARCH_FAILED"; reason: string })
  | (DomainEvent & { type: "SELECT_CANDIDATE"; candidateId: string })
  | (DomainEvent & { type: "OFFER_REVALIDATED"; candidate: ExecutableCandidate })
  | (DomainEvent & { type: "OFFER_UNAVAILABLE"; candidateId: string })
  | (DomainEvent & { type: "AUTHORIZE"; authorization: Authorization })
  | (DomainEvent & { type: "POLICY_APPROVED" })
  | (DomainEvent & { type: "POLICY_DENIED"; code: PolicyDenialCode })
  | (DomainEvent & { type: "COMMIT_SUCCEEDED"; result: ExecutionResult & { status: "SUBMITTED" } })
  | (DomainEvent & {
      type: "COMMIT_FAILED";
      result: ExecutionResult & { status: "FAILED_BEFORE_SIDE_EFFECT" };
    })
  | (DomainEvent & {
      type: "COMMIT_UNCERTAIN";
      result: ExecutionResult & { status: "SIDE_EFFECT_UNCERTAIN" };
    })
  | (DomainEvent & { type: "BOOKING_VERIFIED"; evidence: ConfirmedBookingProof })
  | (DomainEvent & { type: "BOOKING_ABSENT"; checkedAt: string })
  | (DomainEvent & { type: "VERIFICATION_INCONCLUSIVE"; evidence?: BookingProofBundle });

export type RestaurantCommand =
  | (DomainCommand & {
      type: "SEARCH_RESTAURANTS";
      intent: RestaurantBookingIntent;
      searchRevision: number;
    })
  | (DomainCommand & {
      type: "REVALIDATE_OFFER";
      candidate: ExecutableCandidate;
    })
  | (DomainCommand & {
      type: "EVALUATE_BOOKING_POLICY";
      proposal: ActionProposal;
      authorization: Authorization;
      offerExpiresAt: string;
    })
  | (DomainCommand & {
      type: "COMMIT_BOOKING";
      attemptId: string;
      proposal: ActionProposal;
      authorization: Authorization;
      candidate: ExecutableCandidate;
    })
  | (DomainCommand & {
      type: "VERIFY_BOOKING";
      attemptId: string;
      candidate: ExecutableCandidate;
      executionResult: ExecutionResult;
    });
