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

/** Coordinates enter the authority path only from the named trusted source. */
export interface RestaurantAreaCoordinates {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  observedAt: string;
  source: "DEVICE" | "MANUAL_PLACE" | "EVALUATION";
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

/** Immutable code-derived audit record for a user temporal expression. */
export interface RestaurantTemporalResolution {
  policyVersion: "restaurant-temporal-materialization@3";
  referenceTime: string;
  timezone: "Asia/Tokyo";
  date?: { expression: string; resolvedDate: string; basis: string };
  timeWindow?: { expression: string; resolvedTimeWindow: { earliest: string; latest: string }; basis: string };
}

export interface RestaurantIntentDraft {
  schemaVersion: "3";
  timezone: "Asia/Tokyo";
  target?: RestaurantTarget;
  date?: string;
  timeWindow?: { earliest: string; latest: string };
  /** User-authorized search range around the original time window; never inferred from a provider page. */
  permittedAlternativeTimeWindow?: { earliest: string; latest: string };
  temporalResolution?: RestaurantTemporalResolution;
  partySize?: number;
  area?: { query: string; placeId?: string; radiusMeters?: number; coordinates?: RestaurantAreaCoordinates };
  criteria: RestaurantCriterion[];
  budgetPerPerson?: { max: number; currency: "JPY" };
}

/** Facts needed for a read-only place recommendation. Availability is optional. */
export interface RestaurantSearchIntent {
  timezone: "Asia/Tokyo";
  target?: RestaurantTarget;
  /** A fact-only recommendation may be unscheduled and must not claim hours. */
  date?: string;
  timeWindow?: { earliest: string; latest: string };
  permittedAlternativeTimeWindow?: { earliest: string; latest: string };
  area: { query: string; placeId?: string; radiusMeters?: number; coordinates?: RestaurantAreaCoordinates };
  criteria: RestaurantCriterion[];
  budgetPerPerson?: { max: number; currency: "JPY" };
}

/** A reservation/availability read adds party size to the read-only search facts. */
export interface RestaurantBookingIntent extends RestaurantSearchIntent {
  date: string;
  timeWindow: { earliest: string; latest: string };
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
  /** The returned slot is within an explicitly user-permitted alternative range, not the original target window. */
  alternativeToRequestedTime?: boolean;
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

/** Reception support and current inventory are separate user-facing facts. */
export const RESTAURANT_RECEPTION_MODES = [
  "RESERVATION_SUPPORTED",
  "WALK_IN_SUPPORTED",
  "RESERVATION_AND_WALK_IN_SUPPORTED",
  "UNKNOWN",
] as const;
export type RestaurantReceptionMode = (typeof RESTAURANT_RECEPTION_MODES)[number];

export interface RestaurantAvailabilityCheck {
  status: RestaurantAvailabilityCheckStatus;
  /** Never infer walk-in support merely because a booking entry was absent. */
  receptionMode?: RestaurantReceptionMode;
  checkedAt: string;
  expiresAt?: string;
  displayExpiresAt?: string;
  freshnessPolicyVersion?: string;
  evidenceIds: string[];
  /** The provider whose current availability/fact observation this is. */
  sourceProvider?: RestaurantReadExecutionMetadata["provider"];
  /** Bounded source attempts, including an otherwise useful partial observation. */
  sourceAttempts?: Array<{
    source: Exclude<RestaurantReadEvidenceProvider, "MODEL_JUDGMENT">;
    outcome: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN" | "SOURCE_UNSUPPORTED" | "FAILED";
    reasonCode?: string;
  }>;
  reasonCode?: string;
  /** Bound by the reducer from the exact authoritative availability request. */
  requestFingerprint?: string;
}

/** Stable request binding for a completed slot/no-slot observation. */
export function restaurantAvailabilityRequestFingerprint(input: {
  date: string;
  timeWindow: { earliest: string; latest: string };
  requestedTimeWindow?: { earliest: string; latest: string };
  partySize: number;
}): string {
  return JSON.stringify({ date: input.date, timeWindow: input.timeWindow, ...(input.requestedTimeWindow ? { requestedTimeWindow: input.requestedTimeWindow } : {}), partySize: input.partySize });
}

export type RestaurantReadEvidenceKind =
  | "DISCOVERY"
  | "RESTAURANT_FACT"
  | "ENTITY_MATCH"
  | "AVAILABILITY";

/** `MODEL_JUDGMENT` is a derived, cited interpretation, never a source page. */
export type RestaurantReadEvidenceProvider = "GOOGLE_PLACES" | "RESTAURANT_WEBSITE" | "TABLECHECK" | "TABELOG" | "MODEL_JUDGMENT";

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
  /** Runtime-bound persistent task run identity for provider budget isolation. */
  readRunId?: string;
}

export interface RestaurantAvailabilityRequest {
  candidateIds: string[];
  /** Bound by Router from authoritative State; never supplied by the Agent. */
  candidates: RestaurantCandidate[];
  date: string;
  timeWindow: { earliest: string; latest: string };
  /** Original user target when `timeWindow` is the separately authorized broader query range. */
  requestedTimeWindow?: { earliest: string; latest: string };
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
  /** Runtime-bound persistent task run identity for provider budget isolation. */
  readRunId?: string;
  /** Explicit recommendation refresh only; bound by the Router from State. */
  recheck?: { reason: "USER_REQUESTED_REFRESH" };
}

export interface RestaurantCandidateFactCheck {
  status: "COMPLETED" | "UNKNOWN";
  checkedAt: string;
  evidenceIds: string[];
  /** The source whose same-purpose facts this observation can replace. */
  sourceProvider?: RestaurantReadExecutionMetadata["provider"];
  /** Compound reads retain unsuccessful sources as well as evidence-producing ones. */
  sourceAttempts?: Array<{
    source: RestaurantReadExecutionMetadata["provider"];
    outcome: "COMPLETED" | "UNKNOWN";
    reasonCode?: string;
  }>;
  /** Reducer-owned cumulative invalidation within this request; raw evidence is immutable. */
  supersededEvidenceIds?: string[];
  reasonCode?: string;
}

export interface RestaurantCandidateFactRead {
  evidence: RestaurantReadEvidence[];
  factChecks: Record<string, RestaurantCandidateFactCheck>;
  metadata: RestaurantReadExecutionMetadata;
}

export interface RestaurantReadExecutionMetadata {
  provider: "GOOGLE_PLACES" | "RESTAURANT_WEBSITE" | "TABLECHECK" | "TABELOG" | "AVAILABILITY_SOURCE_RESOLVER" | "FIXTURE";
  route: RestaurantExecutionRoute;
  latencyMs: number;
  failureCode?: string;
  freshnessPolicyVersion?: string;
  recheckReason?: NonNullable<RestaurantAvailabilityRequest["recheck"]>["reason"];
  /** Bounded model work inside a read adapter; agent decisions are recorded separately. */
  modelUsage?: {
    calls: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  /** Cumulative Google Places requests for this task read run; failed sent requests count too. */
  googleRequests?: {
    limit: number;
    total: number;
    namedPlaceResolution: number;
    discovery: number;
    placeDetails: number;
  };
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

/** Provider/result-derived progress only; never a model self-assessment. */
export interface RestaurantReadObservation {
  type: "USER_QUESTION" | "DISCOVERY" | "DISCOVERY_FAILED" | "CANDIDATE_FACTS" | "CANDIDATE_FACTS_UNKNOWN" | "AVAILABILITY" | "AVAILABILITY_UNKNOWN" | "RESULTS_PRESENTED" | "READ_ENDED" | "CANDIDATE_SELECTED" | "BOOKING_PROPOSAL" | "FACTS_UNAVAILABLE";
  detail: string;
  candidateIds?: string[];
  newCandidateIds?: string[];
  evidenceIds?: string[];
  factSourceAttempts?: Array<{
    candidateId: string;
    source: RestaurantReadExecutionMetadata["provider"];
    outcome: "COMPLETED" | "UNKNOWN";
    reasonCode?: string;
  }>;
  unresolvedCandidateIds?: string[];
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
  | "NO_VERIFIED_RESULT"
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
  /** Provider capability state is durable within this task run; it is not the last arbitrary failure. */
  sourceReadState?: { googlePlacesSearchBudget: "AVAILABLE" | "EXHAUSTED" };
  readEvidence: RestaurantReadEvidence[];
  searchRevision: number;
  /** Increments only when the user changes authoritative semantics. */
  investigationRevision?: number;
  selectedCandidateId?: string;
  selectedOfferId?: string;
  presentedResults?: { candidateIds: string[]; evidenceIds: string[]; presentedAt: string };
  /** Scoped normal read completion, never a claim that every restaurant is unavailable. */
  noVerifiedResult?: { endedAt: string; investigatedCandidateIds: string[]; unresolvedCandidateIds: string[]; remainingGaps: string[] };
  /** An explicit user refresh only rechecks previously displayed candidates. */
  refreshRequestedCandidateIds?: string[];
  /** An explicit recommendation refresh only re-reads facts for displayed candidates. */
  factRefreshRequestedCandidateIds?: string[];
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
  | { status: "NO_VERIFIED_RESULT"; investigatedCandidateIds: string[]; unresolvedCandidateIds: string[]; remainingGaps: string[] }
  | { status: "OUTCOME_UNKNOWN"; attemptId: string }
  | { status: "FAILED"; reason: string };

export interface RestaurantIntentPatch {
  schemaVersion: "3";
  target?: RestaurantTarget | null;
  date?: string | null;
  timeWindow?: { earliest: string; latest: string } | null;
  permittedAlternativeTimeWindow?: { earliest: string; latest: string } | null;
  temporalResolution?: RestaurantTemporalResolution | null;
  partySize?: number | null;
  area?: { query: string; placeId?: string; radiusMeters?: number; coordinates?: RestaurantAreaCoordinates } | null;
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

export type RestaurantAgentLoopTermination = "TIMEOUT" | "STEP_LIMIT" | "REJECTION_LIMIT" | "EXECUTION_FAILURE" | "NO_PROGRESS" | "CANCELLED";

/** Historical semantic-evaluation annotation. It is not an Agent action or a runtime Decision. */
export type RestaurantSemanticExpectedDecision =
  | { type: "ASK_USER"; missingRequiredFields: RestaurantBlockingField[] }
  | { type: "SEARCH" };

export type RestaurantEvent =
  | (DomainEvent & { type: "SEMANTIC_PROPOSAL_COMPILED"; patch: RestaurantIntentPatch })
  /** Eval-only trusted context, never a user device-location substitute or product default. */
  | (DomainEvent & { type: "EVALUATION_LOCATION_BOUND"; coordinates: RestaurantAreaCoordinates & { source: "EVALUATION"; radiusMeters?: number } })
  | (DomainEvent & { type: "SEMANTIC_CONFLICT_RECORDED"; conflict: RestaurantSemanticConflict })
  /** The user message reached the semantic boundary, but no safe proposal was produced. */
  | (DomainEvent & {
      type: "SEMANTIC_INTERPRETATION_FAILED";
      status: "INPUT_INVALID" | "INVALID_MODEL_OUTPUT" | "MODEL_FAILURE";
      reason: string;
    })
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
  | (DomainEvent & { type: "READ_ENDED_NO_VERIFIED_RESULT"; investigatedCandidateIds: string[]; unresolvedCandidateIds: string[]; remainingGaps: string[] })
  | (DomainEvent & { type: "AVAILABILITY_REFRESH_REQUESTED"; candidateIds: string[] })
  | (DomainEvent & { type: "CANDIDATE_FACTS_REFRESH_REQUESTED"; candidateIds: string[] })
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
