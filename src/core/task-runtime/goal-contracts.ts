import type { TaskLifecycleState } from "./contracts.js";

export type GoalStatus = "ACTIVE" | "ACHIEVED" | "FAILED" | "CANCELLED";

export type DependencyCondition =
  | "UPSTREAM_SUCCEEDED"
  | "UPSTREAM_TERMINAL"
  | "ANY_UPSTREAM_SUCCEEDED"
  | "ALL_UPSTREAM_SUCCEEDED";

export type DependencyReadiness = "READY" | "WAITING" | "BLOCKED";

export interface GoalSnapshot {
  id: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoalTaskMembership {
  goalId: string;
  taskId: string;
  parentTaskId?: string;
  critical: boolean;
  createdAt: string;
}

export interface TaskDependency {
  goalId: string;
  upstreamTaskId: string;
  downstreamTaskId: string;
  condition: DependencyCondition;
  createdAt: string;
}

export interface TaskDependencyReadiness {
  goalId: string;
  taskId: string;
  status: DependencyReadiness;
  condition?: DependencyCondition;
  upstream: Array<{ taskId: string; lifecycleState: TaskLifecycleState }>;
}
