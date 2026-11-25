import type { CandidateDistanceObservation } from "../domains/restaurant/candidate-read-observations.js";
import type { TaskLifecycleState } from "../core/task-runtime/contracts.js";
import type {
  AvailabilityOffer,
  RestaurantAvailabilityCheck,
  RestaurantCandidate,
  RestaurantOutcome,
  RestaurantPhase,
  RestaurantReadEvidence,
  RestaurantSearchContinuation,
} from "../domains/restaurant/contracts.js";

export type AgentWorkspaceMode = "FIXTURE" | "LIVE_READ";

/** Client references only; the authenticated application resolves their ownership. */
export interface WorkspaceViewContext {
  view: "HOME" | "CONVERSATION" | "CANDIDATES" | "DETAILS" | "SAVED" | "HANDOFF";
  candidateId?: string;
  comparedCandidateIds: string[];
}

export function workspaceViewContext(value: unknown): WorkspaceViewContext {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Current view context is required");
  const item = value as Record<string, unknown>;
  if (Object.keys(item).some(key => !["view", "candidateId", "comparedCandidateIds"].includes(key))
    || !["HOME", "CONVERSATION", "CANDIDATES", "DETAILS", "SAVED", "HANDOFF"].includes(String(item.view))
    || (item.candidateId !== undefined && (typeof item.candidateId !== "string" || !item.candidateId.trim()))
    || !Array.isArray(item.comparedCandidateIds) || item.comparedCandidateIds.length > 3
    || item.comparedCandidateIds.some(id => typeof id !== "string" || !id.trim())
    || new Set(item.comparedCandidateIds).size !== item.comparedCandidateIds.length
    || (item.candidateId !== undefined && !["CANDIDATES", "DETAILS", "HANDOFF"].includes(String(item.view)))
    || (item.view === "HOME" && item.comparedCandidateIds.length > 0)) throw new Error("Invalid current view context");
  return {view:item.view as WorkspaceViewContext["view"], ...(item.candidateId ? {candidateId:item.candidateId as string}:{}), comparedCandidateIds:[...item.comparedCandidateIds] as string[]};
}

export type CaseStatus = "ACTIVE" | "NEEDS_YOU" | "WAITING" | "COMPLETED";

export type PendingUserAction =
  | "PROVIDE_DETAILS"
  | "AUTHORIZE"
  | "REVIEW_ATTENTION";

export interface WorkspaceUser {
  id: string;
  displayName: string;
}

export interface ConversationMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface ActivityItem {
  activityId: string;
  caseId: string;
  sourceRef: { kind: "EVENT" | "COMMAND" | "ATTEMPT" | "OUTCOME"; id: string };
  type: string;
  display: { title: string; detail?: string };
  occurredAt: string;
}

export type AgentArtifact =
  | {
      artifactId: string;
      caseId: string;
      domain: "restaurant";
      type: "CANDIDATES";
      sourceVersion: number;
      data: { candidates: Array<RestaurantCandidate & { distanceObservation?: CandidateDistanceObservation }>; availability: Record<string, AvailabilityOffer[]> };
    }
  | {
      artifactId: string;
      caseId: string;
      domain: "restaurant";
      type: "AUTHORIZATION_REQUEST";
      sourceVersion: number;
      data: {
        proposal: {
          id: string;
          actionType: string;
          targetName: string;
          termsHash: string;
        };
        note: string;
      };
    }
  | {
      artifactId: string;
      caseId: string;
      domain: "restaurant";
      type: "OUTCOME";
      sourceVersion: number;
      data: { outcome: RestaurantOutcome };
    };

export interface RestaurantCaseSummary {
  caseId: string;
  conversationId: string;
  rootTaskId: string;
  title: string;
  status: CaseStatus;
  phase: RestaurantPhase;
  taskVersion: number;
  readonly stopped?: boolean;
  pendingUserAction?: PendingUserAction;
  updatedAt: string;
}

export type WorkspaceCandidateChangeReason = "OVER_BUDGET" | "NEW_TIME_MISMATCH" | "NO_LONGER_MATCHES";
export interface RestaurantWorkspaceReadProjection {
  requirementRevision: number;
  /** Completed questions from this Case's existing events, newest first. */
  questionHistory: import("../domains/restaurant/page-question.js").RestaurantPageQuestionState[];
  savedCandidates: Array<{ candidateId: string; outletName: string; current: boolean; reasonCode?: WorkspaceCandidateChangeReason }>;
  revisionDiff?: {
    fromRevision: number;
    toRevision: number;
    removed: Array<{ candidateId: string; outletName: string; reasonCode: WorkspaceCandidateChangeReason; sourceUrl?: string }>;
    added: Array<{ candidateId: string; outletName: string }>;
  };
  readStatus: {
    kind: "PENDING" | "RESULTS" | "NO_QUALIFIED_RESULTS" | "ALL_SOURCES_FAILED" | "MODEL_FAILURE" | "OTHER_FAILURE";
    partialSourceFailure: boolean;
    canContinue: boolean;
    canRetry: boolean;
  };
}

export interface RestaurantCaseView {
  mode: AgentWorkspaceMode;
  case: RestaurantCaseSummary;
  conversation: {
    id: string;
    messages: ConversationMessage[];
  };
  restaurant: RestaurantWorkspaceReadProjection & {
    /** Current task-local request projection; coordinates are only returned to its authenticated owner. */
    intentDraft?: import("../domains/restaurant/contracts.js").RestaurantIntentDraft;
    /** The source-observed center actually used; never a rewrite of the user's AREA. */
    searchLocation?: RestaurantSearchContinuation["locationContext"];
    /** Current structured-state clarification, never a historical G1 answer. */
    clarificationQuestion?: string;
    missingRequiredFields: string[];
    /** Search/page counter; requirementRevision tracks condition updates separately. */
    searchRevision: number;
    /** Qualified from the current state, including results ready before the batch ends. */
    readyCandidateIds: string[];
    progress: { stage?: 'UNDERSTANDING' | 'FINDING' | 'CHECKING'; active: boolean; stopped: boolean; discoveredCount?: number; checkedCount?: number };
    candidates: Array<RestaurantCandidate & { distanceObservation?: CandidateDistanceObservation }>;
    availability: Record<string, AvailabilityOffer[]>;
    availabilityChecks: Record<string, RestaurantAvailabilityCheck>;
    /** Transient server-checked B1 projection; absent until a reviewed source-cache reader is wired. */
    bookingHandoffs?: import("../domains/restaurant/booking-handoff.js").BookingHandoffView[];
    /** Interaction receipt projection only; never availability or booking success. */
    bookingFeedbackAvailable?: boolean;
    /** Safe, structured read evidence only; raw DOM and browser credentials are excluded. */
    readEvidence: RestaurantReadEvidence[];
    /** Current source-scoped facts only; historical facts remain in durable state. */
    currentFactEvidence: RestaurantReadEvidence[];
    pageQuestion?: import("../domains/restaurant/page-question.js").RestaurantPageQuestionState;
    /** Server projection of the authoritative investigation; never accepted from a client. */
    sourceReadContext?: { runId: string; startedAt: string; handleId?: string };
    presentedCandidateIds?: string[];
    conditionStates?: Record<string, import("../domains/restaurant/condition-states.js").RestaurantConditionState[]>;
    viewedCandidateIds?: string[];
    shortlistCandidateIds?: string[];
    selectionFeedback?: string[];
    /** The last explicit recommendation target and whether source limits prevented meeting it. */
    resultBatchTarget?: { candidateCount: number; met: boolean };
    selectedCandidateId?: string;
  };
  artifacts: AgentArtifact[];
  activities: ActivityItem[];
  note: string;
}

export function caseStatus(lifecycle: TaskLifecycleState): CaseStatus {
  switch (lifecycle) {
    case "WAITING_USER":
    case "NEEDS_ATTENTION":
      return "NEEDS_YOU";
    case "WAITING_TIME":
    case "WAITING_EXTERNAL":
      return "WAITING";
    case "SUCCEEDED":
    case "FAILED":
    case "CANCELLED":
      return "COMPLETED";
    default:
      return "ACTIVE";
  }
}

export function pendingAction(phase: RestaurantPhase): PendingUserAction | undefined {
  switch (phase) {
    case "NEEDS_INPUT":
      return "PROVIDE_DETAILS";
    case "AWAITING_AUTHORIZATION":
      return "AUTHORIZE";
    case "OUTCOME_UNKNOWN":
    case "FAILED":
      return "REVIEW_ATTENTION";
    default:
      return undefined;
  }
}
