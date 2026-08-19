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

export interface RestaurantTarget {
  query: string;
}

export const RESTAURANT_CRITERION_POLARITIES = ["POSITIVE", "NEGATIVE"] as const;
export type RestaurantCriterionPolarity = (typeof RESTAURANT_CRITERION_POLARITIES)[number];

export const RESTAURANT_CRITERION_STRENGTHS = [
  "HARD",
  "SOFT",
  "UNSPECIFIED",
] as const;
export type RestaurantCriterionStrength = (typeof RESTAURANT_CRITERION_STRENGTHS)[number];

/** A user-expressed restaurant selection criterion; intentionally not an ontology category. */
export interface RestaurantCriterion {
  text: string;
  polarity: RestaurantCriterionPolarity;
  strength: RestaurantCriterionStrength;
}

export interface RestaurantIntentDraft {
  schemaVersion: "3";
  timezone: "Asia/Tokyo";
  target?: RestaurantTarget;
  date?: string;
  timeWindow?: { earliest: string; latest: string };
  partySize?: number;
  area?: { query: string; placeId?: string; radiusMeters?: number };
  criteria: RestaurantCriterion[];
  budgetPerPerson?: { max: number; currency: "JPY" };
}

export interface RestaurantBookingIntent {
  timezone: "Asia/Tokyo";
  target?: RestaurantTarget;
  date: string;
  timeWindow: { earliest: string; latest: string };
  partySize: number;
  area: { query: string; placeId?: string; radiusMeters?: number };
  criteria: RestaurantCriterion[];
  budgetPerPerson?: { max: number; currency: "JPY" };
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

/** Discovery result. It deliberately does not assert present availability. */
export interface RestaurantCandidate {
  restaurant: RestaurantOutlet;
  matchReasons: string[];
  warnings: string[];
  executionConfidence: "HIGH" | "MEDIUM" | "LOW";
}

export interface RestaurantSearchRequest {
  /** Must exactly preserve the authoritative intent; a hint may only adjust retrieval. */
  intent: RestaurantBookingIntent;
  retrievalHint?: string;
}

export interface RestaurantAvailabilityRequest {
  candidateIds: string[];
  date: string;
  timeWindow: { earliest: string; latest: string };
  partySize: number;
}

export interface RestaurantBookingSelection {
  candidate: RestaurantCandidate;
  offer: AvailabilityOffer;
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
  schemaVersion: "7";
  phase: RestaurantPhase;
  intentDraft?: RestaurantIntentDraft;
  intent?: RestaurantBookingIntent;
  semanticConflict?: RestaurantSemanticConflict;
  candidates: RestaurantCandidate[];
  availability: Record<string, AvailabilityOffer[]>;
  searchRevision: number;
  selectedCandidateId?: string;
  selectedOfferId?: string;
  pendingUserQuestion?: { question: string; relatedFields?: string[] };
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

export interface RestaurantIntentPatch {
  schemaVersion: "3";
  target?: RestaurantTarget | null;
  date?: string | null;
  timeWindow?: { earliest: string; latest: string } | null;
  partySize?: number | null;
  area?: { query: string } | null;
  budgetPerPerson?: { max: number; currency: "JPY" } | null;
  addCriteria?: RestaurantCriterion[];
  replaceCriteria?: RestaurantCriterion[];
  removeCriteria?: RestaurantCriterion[];
}

export interface RestaurantSemanticConflict {
  code: "CONTRADICTORY_PROPOSAL" | "UNSUPPORTED_SEMANTIC_EXPRESSION";
  affectedFields: string[];
  message: string;
}

/** Historical semantic-evaluation annotation. It is not an Agent action or a runtime Decision. */
export type RestaurantSemanticExpectedDecision =
  | { type: "ASK_USER"; missingRequiredFields: RestaurantBlockingField[] }
  | { type: "SEARCH" };

export type RestaurantEvent =
  | (DomainEvent & { type: "SEMANTIC_PROPOSAL_COMPILED"; patch: RestaurantIntentPatch })
  | (DomainEvent & { type: "SEMANTIC_CONFLICT_RECORDED"; conflict: RestaurantSemanticConflict })
  | (DomainEvent & { type: "AGENT_ASKED_USER"; question: string; relatedFields?: string[] })
  | (DomainEvent & { type: "AGENT_DECISION_FAILED"; reason: string })
  | (DomainEvent & {
      type: "SEARCH_COMPLETED";
      request: RestaurantSearchRequest;
      candidates: RestaurantCandidate[];
    })
  | (DomainEvent & { type: "SEARCH_FAILED"; reason: string })
  | (DomainEvent & {
      type: "AVAILABILITY_CHECKED";
      request: RestaurantAvailabilityRequest;
      offers: AvailabilityOffer[];
    })
  | (DomainEvent & { type: "CANDIDATE_SELECTED"; candidateId: string; offerId?: string })
  | (DomainEvent & { type: "BOOKING_PROPOSED"; candidateId: string; offerId: string })
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
      selection: RestaurantBookingSelection;
    })
  | (DomainCommand & {
      type: "VERIFY_BOOKING";
      attemptId: string;
      selection: RestaurantBookingSelection;
      executionResult: ExecutionResult;
    });
