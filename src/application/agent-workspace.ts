import type { TaskLifecycleState } from "../core/task-runtime/contracts.js";
import type {
  ExecutableCandidate,
  RestaurantOutcome,
  RestaurantPhase,
} from "../domains/restaurant/contracts.js";

export const AGENT_WORKSPACE_MODE = "FIXTURE" as const;

export type CaseStatus = "ACTIVE" | "NEEDS_YOU" | "WAITING" | "COMPLETED";

export type PendingUserAction =
  | "PROVIDE_DETAILS"
  | "SELECT_CANDIDATE"
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
      data: { candidates: ExecutableCandidate[] };
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
  pendingUserAction?: PendingUserAction;
  updatedAt: string;
}

export interface RestaurantCaseView {
  mode: typeof AGENT_WORKSPACE_MODE;
  case: RestaurantCaseSummary;
  conversation: {
    id: string;
    messages: ConversationMessage[];
  };
  restaurant: {
    missingRequiredFields: string[];
    candidates: ExecutableCandidate[];
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
    case "AWAITING_SELECTION":
    case "SELECTION_REQUIRED":
      return "SELECT_CANDIDATE";
    case "AWAITING_AUTHORIZATION":
      return "AUTHORIZE";
    case "OUTCOME_UNKNOWN":
    case "FAILED":
      return "REVIEW_ATTENTION";
    default:
      return undefined;
  }
}
