export const DECISION_OCCASIONS = [
  "SOLO",
  "DATE",
  "FRIENDS",
  "FAMILY",
  "TEAM",
  "OTHER",
] as const;

export const DECISION_TIME_PRECISIONS = [
  "UNKNOWN",
  "DAY",
  "DAYPART",
  "APPROXIMATE",
  "WINDOW",
  "EXACT",
] as const;

export const DECISION_DAYPARTS = [
  "BREAKFAST",
  "LUNCH",
  "AFTERNOON",
  "DINNER",
  "LATE_NIGHT",
] as const;

export const DECISION_LOCATION_KINDS = [
  "AREA",
  "NEAR_PLACE",
  "ADDRESS_OR_STREET",
  "FLEXIBLE",
  "UNKNOWN",
] as const;

export const DECISION_TARGET_KINDS = [
  "OPEN",
  "CATEGORY",
  "BRAND",
  "RESTAURANT",
] as const;

export const DECISION_READINESS = [
  "NOT_READY",
  "RECOMMENDATION_READY",
  "AVAILABILITY_READY",
] as const;

export const DECISION_ACTION_TYPES = [
  "ASK_CORE_FIELD",
  "SHOW_RECOMMENDATIONS",
  "RESOLVE_BRAND_OUTLET",
  "CHECK_TARGET_RESTAURANT",
  "NARROW_FROM_FEEDBACK",
  "CHECK_AVAILABILITY",
  "PROPOSE_CONSTRAINT_RELAXATION",
  "REQUEST_FINAL_BOOKING_DETAIL",
  "STOP_OR_SAVE",
] as const;

export const DECISION_RELAXATION_TYPES = [
  "EXPAND_LOCATION",
  "RELAX_BRAND_TO_CATEGORY",
] as const;

export const DECISION_CORE_TOPICS = [
  "DATE",
  "TIME",
  "PARTY",
  "LOCATION_STRATEGY",
] as const;

export const DECISION_DIVERSITY_AXES = [
  "CUISINE",
  "PRICE_BAND",
  "VIBE",
  "NEIGHBORHOOD",
  "CHAIN_TYPE",
  "OUTLET",
  "OFFER",
] as const;

export const PENDING_HUMAN_LABEL = "PENDING_HUMAN_LABEL" as const;

export type DecisionOccasion = (typeof DECISION_OCCASIONS)[number];
export type DecisionTimePrecision = (typeof DECISION_TIME_PRECISIONS)[number];
export type DecisionDaypart = (typeof DECISION_DAYPARTS)[number];
export type DecisionLocationKind = (typeof DECISION_LOCATION_KINDS)[number];
export type DecisionTargetKind = (typeof DECISION_TARGET_KINDS)[number];
export type DecisionReadiness = (typeof DECISION_READINESS)[number];
export type DecisionActionType = (typeof DECISION_ACTION_TYPES)[number];
export type DecisionRelaxationType = (typeof DECISION_RELAXATION_TYPES)[number];
export type DecisionCoreTopic = (typeof DECISION_CORE_TOPICS)[number];
export type DecisionDiversityAxis = (typeof DECISION_DIVERSITY_AXES)[number];

export interface DecisionTime {
  date?: string;
  precision: DecisionTimePrecision;
  daypart?: DecisionDaypart;
  preferred?: string;
  earliest?: string;
  latest?: string;
}

export interface DecisionParty {
  min: number;
  max: number;
  precision: "EXACT" | "RANGE";
}

export type DecisionLocation =
  | { kind: "AREA"; query: string }
  | { kind: "NEAR_PLACE"; query: string }
  | { kind: "ADDRESS_OR_STREET"; query: string }
  | { kind: "FLEXIBLE"; scope?: string }
  | { kind: "UNKNOWN" };

export type DecisionTarget =
  | { kind: "OPEN" }
  | { kind: "CATEGORY"; query: string }
  | { kind: "BRAND"; query: string }
  | { kind: "RESTAURANT"; query: string; outletQuery?: string };

export interface DecisionState {
  occasion?: DecisionOccasion;
  time?: DecisionTime;
  party?: DecisionParty;
  location?: DecisionLocation;
  target: DecisionTarget;
  positivePreferences: string[];
  negativePreferences: string[];
  hardConstraints: string[];
}

export interface DecisionStatePatch {
  set?: {
    occasion?: DecisionOccasion | null;
    time?: DecisionTime | null;
    party?: DecisionParty | null;
    location?: DecisionLocation | null;
    target?: DecisionTarget;
  };
  add?: {
    positivePreferences?: string[];
    negativePreferences?: string[];
    hardConstraints?: string[];
  };
  remove?: {
    positivePreferences?: string[];
    negativePreferences?: string[];
    hardConstraints?: string[];
  };
}

export type ProposedNextAction =
  | { type: "ASK_CORE_FIELD"; topics: DecisionCoreTopic[] }
  | { type: "SHOW_RECOMMENDATIONS" }
  | { type: "RESOLVE_BRAND_OUTLET" }
  | { type: "CHECK_TARGET_RESTAURANT" }
  | { type: "NARROW_FROM_FEEDBACK" }
  | { type: "CHECK_AVAILABILITY" }
  | { type: "PROPOSE_CONSTRAINT_RELAXATION" }
  | { type: "REQUEST_FINAL_BOOKING_DETAIL" }
  | { type: "STOP_OR_SAVE" };

/**
 * Eval-only structured output for a single progressive-decision turn.
 * It is intentionally not a Runtime event, Task State mutation, or Tool command.
 * It is deliberately separate from Runtime events, Task State mutations and Tool
 * commands. S6–S8 fields describe only the Mock World evidence considered for
 * this turn, so a model prediction remains an evaluable proposal.
 */
export interface DecisionEvalTurnPrediction {
  statePatch: DecisionStatePatch;
  readiness: DecisionReadiness;
  nextAction: ProposedNextAction;
  retrievedCandidateIds?: string[];
  recommendation?: {
    candidateIds: string[];
    explainsInsufficientCandidates?: boolean;
  };
  grounding?: DecisionEvalGroundingPrediction;
}

export interface DecisionCandidateDisclosure {
  candidateId: string;
  type: "ALLERGY_CONFIRMATION_REQUIRED";
  factRef: string;
}

export interface DecisionEvalGroundingPrediction {
  stateFactRefs: string[];
  candidateFactRefs: string[];
  claimLabels: string[];
  candidateDisclosures: DecisionCandidateDisclosure[];
}

export interface DecisionConstraintRelaxationOracle {
  options: Array<{
    type: DecisionRelaxationType;
    candidateIds: string[];
  }>;
  requiresUserChoice: true;
}

export interface RecommendationAvailabilityFixture {
  status: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  date: string;
  earliest: string;
  latest: string;
  partyMin: number;
  partyMax: number;
  checkedAt: string;
  expiresAt: string;
}

export type RecommendationFactValue = string | number | boolean | string[];

export interface RecommendationFactFixture {
  id: string;
  field: string;
  value: RecommendationFactValue;
}

export interface RecommendationCandidateFixture {
  id: string;
  outletName: string;
  brandName?: string;
  area: string;
  cuisines: string[];
  priceBand: "BUDGET" | "MID_RANGE" | "PREMIUM";
  vibes: string[];
  chainType: "INDEPENDENT" | "CHAIN";
  capacity: { min: number; max: number };
  attributes: string[];
  unsupportedConstraints: string[];
  availability?: RecommendationAvailabilityFixture;
  source: {
    mode: "FIXTURE";
    observedAt: string;
  };
  facts: RecommendationFactFixture[];
}

export interface RecommendationCandidatePool {
  schemaVersion: "1";
  id: string;
  candidates: RecommendationCandidateFixture[];
}

export interface RecommendationOracle {
  minCandidates: number;
  maxCandidates: number;
  allowedCandidateIds: string[];
  forbiddenCandidateIds: string[];
  requiredDiversityAxes: DecisionDiversityAxis[];
  mustExplainInsufficientCandidates: boolean;
}

export interface DecisionEvalLabeledExpectation {
  annotationStatus: "LABELED";
  statePatch: DecisionStatePatch;
  accumulatedState: DecisionState;
  readiness: DecisionReadiness;
  acceptableNextActions: ProposedNextAction[];
  forbiddenActionTypes: DecisionActionType[];
  clarification?: {
    allowedTopics: DecisionCoreTopic[];
    maxTopics: 1 | 2;
    mustNotAsk: DecisionCoreTopic[];
  };
  retrieval?: {
    eligibleCandidateIds: string[];
    allowEmpty: boolean;
    minimumExpected: number;
  };
  recommendation?: RecommendationOracle;
  outletDiscovery?: {
    candidateIds: string[];
  };
  constraintRelaxation?: DecisionConstraintRelaxationOracle;
  grounding?: {
    allowedStateFactRefs: string[];
    allowedCandidateFactRefs: string[];
    forbiddenClaims: string[];
    requiredCandidateDisclosures?: DecisionCandidateDisclosure[];
  };
}

export interface DecisionEvalPendingExpectation {
  annotationStatus: typeof PENDING_HUMAN_LABEL;
  annotationFocus: string[];
}

export type DecisionEvalExpectation =
  | DecisionEvalLabeledExpectation
  | DecisionEvalPendingExpectation;

export interface DecisionEvalTurn {
  id: string;
  userMessage: string;
  visibleOptionIds?: string[];
  expected: DecisionEvalExpectation;
}

export interface DecisionEvalEpisode {
  schemaVersion: "2";
  datasetVersion: string;
  id: string;
  split: "REGRESSION" | "HOLDOUT";
  initialClarity: "E1" | "E2" | "E3";
  targetKind: DecisionTargetKind;
  referenceTime: string;
  timezone: "Asia/Tokyo";
  tags: string[];
  candidatePoolRef?: string;
  initialState: DecisionState;
  turns: DecisionEvalTurn[];
}

export interface DecisionEvalDataset {
  schemaVersion: "2";
  datasetId: string;
  datasetVersion: string;
  evaluatorTargetVersion: "2";
  mode: "GOLDEN_SEED" | "FROZEN_BASELINE";
  candidatePools: RecommendationCandidatePool[];
  episodes: DecisionEvalEpisode[];
}
