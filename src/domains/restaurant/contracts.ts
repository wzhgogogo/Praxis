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

/** The desired outcome controls required evidence; party size only parameterizes availability. */
export const RESTAURANT_READ_GOALS = ["RECOMMENDATION", "AVAILABILITY"] as const;
export type RestaurantReadGoal = (typeof RESTAURANT_READ_GOALS)[number];
export interface RestaurantTarget { goal: RestaurantReadGoal; query: string; }

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
  area?: { query: string; placeId?: string; radiusMeters?: number; coordinates?: { latitude: number; longitude: number; accuracyMeters?: number; observedAt: string; source: "DEVICE" | "MANUAL_PLACE" } };
  criteria: RestaurantCriterion[];
  budgetPerPerson?: { max: number; currency: "JPY" };
}

/** Facts needed for a read-only place recommendation. Availability is optional. */
export interface RestaurantSearchIntent {
  timezone: "Asia/Tokyo";
  target?: RestaurantTarget;
  date: string;
  timeWindow: { earliest: string; latest: string };
  area: { query: string; placeId?: string; radiusMeters?: number; coordinates?: { latitude: number; longitude: number; accuracyMeters?: number; observedAt: string; source: "DEVICE" | "MANUAL_PLACE" } };
  criteria: RestaurantCriterion[];
  budgetPerPerson?: { max: number; currency: "JPY" };
}

/** A reservation/availability read adds party size to the read-only search facts. */
export interface RestaurantBookingIntent extends RestaurantSearchIntent {
  partySize: number;
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
  /** Product display policy; it never grants a booking right or locks a slot. */
  displayExpiresAt?: string;
  /** A source-declared deadline, when observed. It may only shorten display freshness. */
  sourceExpiresAt?: string;
  /** Live browser observations without a provider booking deadline require a new pre-booking read. */
  bookingRecheckRequired?: boolean;
  /** Existing proposal/policy expiry. It is not used to decide read-only display freshness. */
  expiresAt: string;
}

/** The result of one bounded availability read, distinct from its returned slots. */
export type RestaurantAvailabilityCheckStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "UNKNOWN"
  | "SOURCE_UNSUPPORTED";

export interface RestaurantAvailabilityCheck {
  status: RestaurantAvailabilityCheckStatus;
  checkedAt: string;
  expiresAt?: string;
  displayExpiresAt?: string;
  freshnessPolicyVersion?: string;
  evidenceIds: string[];
  reasonCode?: string;
}

export type RestaurantReadEvidenceKind =
  | "DISCOVERY"
  | "RESTAURANT_FACT"
  | "ENTITY_MATCH"
  | "AVAILABILITY";

export type RestaurantReadEvidenceProvider = "GOOGLE_PLACES" | "TABLECHECK" | "TABELOG";

/**
 * Small Domain-owned record of a grounded external read. It intentionally holds
 * normalized claims, never a provider payload, full HTML page, secret, or model reasoning.
 */
export interface RestaurantReadEvidence {
  evidenceId: string;
  kind: RestaurantReadEvidenceKind;
  provider: RestaurantReadEvidenceProvider;
  candidateId?: string;
  sourceEntityId?: string;
  sourceUrl?: string;
  observedAt: string;
  expiresAt?: string;
  displayExpiresAt?: string;
  sourceExpiresAt?: string;
  freshnessPolicyVersion?: string;
  /** Earlier evidence for the same candidate that this bounded recheck supersedes. */
  supersedesEvidenceIds?: string[];
  requestFingerprint: string;
  claims: Record<string, string | number | boolean | string[]>;
  entityMatch?: {
    confidence: "HIGH" | "MEDIUM" | "LOW";
    matchedBy: string[];
  };
  artifactRef?: { kind: "DOM_EXCERPT" | "SCREENSHOT" | "API_RESPONSE"; reference: string; sha256?: string };
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
  intent: RestaurantSearchIntent;
  retrievalHint?: string;
}

export interface RestaurantAvailabilityRequest {
  candidateIds: string[];
  /** Bound by Router from authoritative State; never supplied by the Agent. */
  candidates: RestaurantCandidate[];
  date: string;
  timeWindow: { earliest: string; latest: string };
  partySize: number;
  /** Router-bound positive HARD criteria; the browser can only report source-supported facts. */
  hardCriteria: string[];
  /** Code-derived; never supplied by the Agent or a provider. */
  recheck?: {
    reason: "DISPLAY_EVIDENCE_EXPIRED" | "USER_REQUESTED_REFRESH";
    previousEvidenceIds: string[];
  };
}

/** A bounded read of source facts for an already-discovered outlet; never an availability query. */
export interface RestaurantCandidateFactRequest {
  candidateIds: string[];
  /** Bound by the Router from authoritative State; never supplied by the Agent. */
  candidates: RestaurantCandidate[];
  intent: RestaurantSearchIntent;
}

export interface RestaurantCandidateFactCheck {
  status: "COMPLETED" | "UNKNOWN";
  checkedAt: string;
  evidenceIds: string[];
  reasonCode?: string;
}

export interface RestaurantCandidateFactRead {
  evidence: RestaurantReadEvidence[];
  factChecks: Record<string, RestaurantCandidateFactCheck>;
  metadata: RestaurantReadExecutionMetadata;
}

export interface RestaurantReadExecutionMetadata {
  provider: "GOOGLE_PLACES" | "TABLECHECK" | "TABELOG" | "AVAILABILITY_SOURCE_RESOLVER" | "FIXTURE";
  route: RestaurantExecutionRoute;
  latencyMs: number;
  failureCode?: string;
  freshnessPolicyVersion?: string;
  recheckReason?: NonNullable<RestaurantAvailabilityRequest["recheck"]>["reason"];
  /** Internal read-only source chain trace; never projected into Agent context. */
  providerAttempts?: Array<{
    candidateId: string;
    provider: "TABLECHECK" | "TABELOG";
    outcome: "AVAILABLE" | "UNAVAILABLE" | "PROVIDER_FAILURE";
    failureCode?: string;
  }>;
  browser?: {
    runtimeProvider: "CLOUDFLARE_BROWSER_RUN" | "LOCAL_PLAYWRIGHT_CHROMIUM";
    engine: "KITESURF" | "CHROMIUM";
    sessionId?: string;
  };
}

export interface RestaurantSearchRead {
  candidates: RestaurantCandidate[];
  evidence: RestaurantReadEvidence[];
  metadata: RestaurantReadExecutionMetadata;
}

export interface RestaurantAvailabilityRead {
  offers: AvailabilityOffer[];
  availabilityChecks: Record<string, RestaurantAvailabilityCheck>;
  evidence: RestaurantReadEvidence[];
  metadata: RestaurantReadExecutionMetadata;
  candidateFactUpdates?: RestaurantCandidateFactUpdate[];
}

/** Trusted candidate-facing facts grounded during an availability read. */
export interface RestaurantCandidateFactUpdate {
  candidateId: string;
  matchReasons: string[];
  evidenceIds: string[];
}

/** Long-lived external execution taxonomy; fixture/live are run metadata, not route kinds. */
export type RestaurantExecutionRoute =
  | "STRUCTURED_ADAPTER"
  | "GENERIC_BROWSER"
  | "HUMAN_TAKEOVER";

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
  | "PRESENT_RESULTS"
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
  schemaVersion: "10";
  phase: RestaurantPhase;
  intentDraft?: RestaurantIntentDraft;
  intent?: RestaurantSearchIntent;
  semanticConflict?: RestaurantSemanticConflict;
  candidates: RestaurantCandidate[];
  availability: Record<string, AvailabilityOffer[]>;
  availabilityChecks: Record<string, RestaurantAvailabilityCheck>;
  /** Bounded fact reads prevent retrying the same missing evidence without a new request. */
  factChecks?: Record<string, RestaurantCandidateFactCheck>;
  readEvidence: RestaurantReadEvidence[];
  searchRevision: number;
  selectedCandidateId?: string;
  selectedOfferId?: string;
  presentedResults?: { candidateIds: string[]; evidenceIds: string[]; presentedAt: string };
  /** An explicit user refresh only rechecks previously displayed candidates. */
  refreshRequestedCandidateIds?: string[];
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
  | { status: "PRESENT_RESULTS"; candidateIds: string[]; evidenceIds: string[] }
  | { status: "OUTCOME_UNKNOWN"; attemptId: string }
  | { status: "FAILED"; reason: string };

export interface RestaurantIntentPatch {
  schemaVersion: "3";
  target?: RestaurantTarget | null;
  date?: string | null;
  timeWindow?: { earliest: string; latest: string } | null;
  partySize?: number | null;
  area?: { query: string; placeId?: string; radiusMeters?: number; coordinates?: { latitude: number; longitude: number; accuracyMeters?: number; observedAt: string; source: "DEVICE" | "MANUAL_PLACE" } } | null;
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

export type RestaurantAgentLoopTermination = "TIMEOUT" | "STEP_LIMIT" | "REJECTION_LIMIT" | "EXECUTION_FAILURE" | "NO_PROGRESS";

/** Historical semantic-evaluation annotation. It is not an Agent action or a runtime Decision. */
export type RestaurantSemanticExpectedDecision =
  | { type: "ASK_USER"; missingRequiredFields: RestaurantBlockingField[] }
  | { type: "SEARCH" };

export type RestaurantEvent =
  | (DomainEvent & { type: "SEMANTIC_PROPOSAL_COMPILED"; patch: RestaurantIntentPatch })
  | (DomainEvent & { type: "SEMANTIC_CONFLICT_RECORDED"; conflict: RestaurantSemanticConflict })
  | (DomainEvent & { type: "AGENT_ASKED_USER"; question: string; relatedFields?: string[] })
  | (DomainEvent & { type: "AGENT_DECISION_FAILED"; reason: string })
  | (DomainEvent & { type: "AGENT_EXECUTION_FAILED"; reason: string })
  | (DomainEvent & { type: "AGENT_LOOP_TERMINATED"; termination: RestaurantAgentLoopTermination; reason: string })
  | (DomainEvent & {
      type: "SEARCH_COMPLETED";
      request: RestaurantSearchRequest;
      candidates: RestaurantCandidate[];
      evidence: RestaurantReadEvidence[];
      metadata: RestaurantReadExecutionMetadata;
    })
  | (DomainEvent & { type: "RESULTS_PRESENTED"; candidateIds: string[]; evidenceIds: string[] })
  | (DomainEvent & { type: "AVAILABILITY_REFRESH_REQUESTED"; candidateIds: string[] })
  | (DomainEvent & { type: "SEARCH_FAILED"; reason: string; code?: string })
  | (DomainEvent & { type: "AVAILABILITY_FAILED"; reason: string })
  | (DomainEvent & {
      type: "AVAILABILITY_CHECKED";
      request: RestaurantAvailabilityRequest;
      offers: AvailabilityOffer[];
      availabilityChecks: Record<string, RestaurantAvailabilityCheck>;
      evidence: RestaurantReadEvidence[];
      metadata: RestaurantReadExecutionMetadata;
      candidateFactUpdates?: RestaurantCandidateFactUpdate[];
    })
  | (DomainEvent & {
      type: "CANDIDATE_FACTS_CHECKED";
      request: RestaurantCandidateFactRequest;
      evidence: RestaurantReadEvidence[];
      factChecks: Record<string, RestaurantCandidateFactCheck>;
      metadata: RestaurantReadExecutionMetadata;
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
