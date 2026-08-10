import type { RuntimeClock, TaskLifecycleState } from "../../core/task-runtime/contracts.js";
import type {
  DependencyCondition,
  GoalSnapshot,
  GoalStatus,
  GoalTaskMembership,
  TaskDependency,
  TaskDependencyReadiness,
} from "../../core/task-runtime/goal-contracts.js";
import type { SqlDatabase, SqlExecutor } from "./sql-database.js";

interface GoalRow {
  id: string;
  status: GoalStatus;
  created_at: unknown;
  updated_at: unknown;
}

interface MembershipRow {
  goal_id: string;
  task_id: string;
  parent_task_id: string | null;
  critical: boolean;
  created_at: unknown;
}

interface DependencyRow {
  goal_id: string;
  upstream_task_id: string;
  downstream_task_id: string;
  condition: DependencyCondition;
  created_at: unknown;
}

interface UpstreamRow {
  task_id: string;
  lifecycle_state: TaskLifecycleState;
  condition: DependencyCondition;
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return new Date(value).toISOString();
  }
  throw new Error(`Unsupported PostgreSQL timestamp value: ${String(value)}`);
}

function isTerminal(state: TaskLifecycleState): boolean {
  return state === "SUCCEEDED" || state === "FAILED" || state === "CANCELLED";
}

function goalFromRow(row: GoalRow): GoalSnapshot {
  return {
    id: row.id,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function membershipFromRow(row: MembershipRow): GoalTaskMembership {
  return {
    goalId: row.goal_id,
    taskId: row.task_id,
    ...(row.parent_task_id ? { parentTaskId: row.parent_task_id } : {}),
    critical: row.critical,
    createdAt: toIsoString(row.created_at),
  };
}

function dependencyFromRow(row: DependencyRow): TaskDependency {
  return {
    goalId: row.goal_id,
    upstreamTaskId: row.upstream_task_id,
    downstreamTaskId: row.downstream_task_id,
    condition: row.condition,
    createdAt: toIsoString(row.created_at),
  };
}

export class PostgresGoalGraph {
  constructor(
    private readonly database: SqlDatabase,
    private readonly clock: RuntimeClock,
  ) {}

  async createGoal(goalId: string): Promise<GoalSnapshot> {
    const now = this.clock.now().toISOString();
    await this.database.query(
      `INSERT INTO goals (id, status, created_at, updated_at)
       VALUES ($1, 'ACTIVE', $2, $2)`,
      [goalId, now],
    );
    return { id: goalId, status: "ACTIVE", createdAt: now, updatedAt: now };
  }

  async getGoal(goalId: string): Promise<GoalSnapshot> {
    const goal = await this.requireGoal(this.database, goalId, false);
    return goalFromRow(goal);
  }

  addTask(input: {
    goalId: string;
    taskId: string;
    parentTaskId?: string;
    critical: boolean;
  }): Promise<GoalTaskMembership> {
    return this.database.transaction(async (transaction) => {
      const goal = await this.requireGoal(transaction, input.goalId, true);
      if (goal.status !== "ACTIVE") {
        throw new Error(`Cannot add a task to terminal goal ${input.goalId}`);
      }
      await this.requireTask(transaction, input.taskId);
      if (input.parentTaskId) {
        if (input.parentTaskId === input.taskId) {
          throw new Error("A task cannot be its own parent");
        }
        await this.requireMembership(transaction, input.goalId, input.parentTaskId);
      }
      const existing = await transaction.query<MembershipRow>(
        `SELECT goal_id, task_id, parent_task_id, critical, created_at
           FROM goal_task_memberships
          WHERE task_id = $1`,
        [input.taskId],
      );
      if (existing.rows[0]) {
        const membership = membershipFromRow(existing.rows[0]);
        if (
          membership.goalId === input.goalId &&
          membership.parentTaskId === input.parentTaskId &&
          membership.critical === input.critical
        ) {
          return membership;
        }
        throw new Error(`Task ${input.taskId} already belongs to a goal`);
      }
      const now = this.clock.now().toISOString();
      await transaction.query(
        `INSERT INTO goal_task_memberships (
          goal_id, task_id, parent_task_id, critical, created_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [input.goalId, input.taskId, input.parentTaskId ?? null, input.critical, now],
      );
      return {
        goalId: input.goalId,
        taskId: input.taskId,
        ...(input.parentTaskId ? { parentTaskId: input.parentTaskId } : {}),
        critical: input.critical,
        createdAt: now,
      };
    });
  }

  addDependency(input: {
    goalId: string;
    upstreamTaskId: string;
    downstreamTaskId: string;
    condition: DependencyCondition;
  }): Promise<TaskDependency> {
    return this.database.transaction(async (transaction) => {
      const goal = await this.requireGoal(transaction, input.goalId, true);
      if (goal.status !== "ACTIVE") {
        throw new Error(`Cannot change dependencies for terminal goal ${input.goalId}`);
      }
      if (input.upstreamTaskId === input.downstreamTaskId) {
        throw new Error("A task cannot depend on itself");
      }
      await this.requireMembership(transaction, input.goalId, input.upstreamTaskId);
      await this.requireMembership(transaction, input.goalId, input.downstreamTaskId);

      const existingCondition = await transaction.query<{ condition: DependencyCondition }>(
        `SELECT condition
           FROM task_dependencies
          WHERE goal_id = $1 AND downstream_task_id = $2
          LIMIT 1`,
        [input.goalId, input.downstreamTaskId],
      );
      if (
        existingCondition.rows[0] &&
        existingCondition.rows[0].condition !== input.condition
      ) {
        throw new Error(
          `All dependencies for ${input.downstreamTaskId} must use the same condition`,
        );
      }

      const cycle = await transaction.query<{ task_id: string }>(
        `WITH RECURSIVE reachable(task_id) AS (
          SELECT downstream_task_id
            FROM task_dependencies
           WHERE goal_id = $1 AND upstream_task_id = $2
          UNION
          SELECT dependency.downstream_task_id
            FROM task_dependencies AS dependency
            JOIN reachable ON dependency.upstream_task_id = reachable.task_id
           WHERE dependency.goal_id = $1
        )
        SELECT task_id FROM reachable WHERE task_id = $3 LIMIT 1`,
        [input.goalId, input.downstreamTaskId, input.upstreamTaskId],
      );
      if (cycle.rows.length > 0) {
        throw new Error(
          `Dependency ${input.upstreamTaskId} -> ${input.downstreamTaskId} would create a cycle`,
        );
      }

      const existing = await transaction.query<DependencyRow>(
        `SELECT goal_id, upstream_task_id, downstream_task_id, condition, created_at
           FROM task_dependencies
          WHERE goal_id = $1 AND upstream_task_id = $2 AND downstream_task_id = $3`,
        [input.goalId, input.upstreamTaskId, input.downstreamTaskId],
      );
      if (existing.rows[0]) {
        return dependencyFromRow(existing.rows[0]);
      }
      const now = this.clock.now().toISOString();
      await transaction.query(
        `INSERT INTO task_dependencies (
          goal_id, upstream_task_id, downstream_task_id, condition, created_at
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          input.goalId,
          input.upstreamTaskId,
          input.downstreamTaskId,
          input.condition,
          now,
        ],
      );
      return { ...input, createdAt: now };
    });
  }

  async listMembers(goalId: string): Promise<GoalTaskMembership[]> {
    const result = await this.database.query<MembershipRow>(
      `SELECT goal_id, task_id, parent_task_id, critical, created_at
         FROM goal_task_memberships
        WHERE goal_id = $1
        ORDER BY created_at ASC, task_id ASC`,
      [goalId],
    );
    return result.rows.map(membershipFromRow);
  }

  async listDependencies(goalId: string): Promise<TaskDependency[]> {
    const result = await this.database.query<DependencyRow>(
      `SELECT goal_id, upstream_task_id, downstream_task_id, condition, created_at
         FROM task_dependencies
        WHERE goal_id = $1
        ORDER BY created_at ASC, upstream_task_id ASC`,
      [goalId],
    );
    return result.rows.map(dependencyFromRow);
  }

  async dependencyReadiness(
    goalId: string,
    taskId: string,
  ): Promise<TaskDependencyReadiness> {
    await this.requireMembership(this.database, goalId, taskId);
    const result = await this.database.query<UpstreamRow>(
      `SELECT dependency.upstream_task_id AS task_id,
              task.lifecycle_state,
              dependency.condition
         FROM task_dependencies AS dependency
         JOIN tasks AS task ON task.id = dependency.upstream_task_id
        WHERE dependency.goal_id = $1
          AND dependency.downstream_task_id = $2
        ORDER BY dependency.upstream_task_id ASC`,
      [goalId, taskId],
    );
    const upstream = result.rows.map((row) => ({
      taskId: row.task_id,
      lifecycleState: row.lifecycle_state,
    }));
    if (result.rows.length === 0) {
      return { goalId, taskId, status: "READY", upstream };
    }
    const condition = result.rows[0]!.condition;
    const states = upstream.map((item) => item.lifecycleState);
    let status: TaskDependencyReadiness["status"];
    switch (condition) {
      case "UPSTREAM_SUCCEEDED":
      case "ALL_UPSTREAM_SUCCEEDED":
        status = states.every((state) => state === "SUCCEEDED")
          ? "READY"
          : states.some((state) => isTerminal(state))
            ? "BLOCKED"
            : "WAITING";
        break;
      case "UPSTREAM_TERMINAL":
        status = states.every(isTerminal) ? "READY" : "WAITING";
        break;
      case "ANY_UPSTREAM_SUCCEEDED":
        status = states.some((state) => state === "SUCCEEDED")
          ? "READY"
          : states.every(isTerminal)
            ? "BLOCKED"
            : "WAITING";
        break;
    }
    return { goalId, taskId, status, condition, upstream };
  }

  reconcileGoal(goalId: string): Promise<GoalSnapshot> {
    return this.database.transaction(async (transaction) => {
      const goal = await this.requireGoal(transaction, goalId, true);
      if (goal.status !== "ACTIVE") {
        return goalFromRow(goal);
      }
      const critical = await transaction.query<{ lifecycle_state: TaskLifecycleState }>(
        `SELECT task.lifecycle_state
           FROM goal_task_memberships AS membership
           JOIN tasks AS task ON task.id = membership.task_id
          WHERE membership.goal_id = $1 AND membership.critical = TRUE`,
        [goalId],
      );
      let nextStatus: GoalStatus = "ACTIVE";
      const states = critical.rows.map((row) => row.lifecycle_state);
      if (states.length > 0 && states.every((state) => state === "SUCCEEDED")) {
        nextStatus = "ACHIEVED";
      } else if (states.some((state) => state === "FAILED")) {
        nextStatus = "FAILED";
      } else if (states.length > 0 && states.every((state) => state === "CANCELLED")) {
        nextStatus = "CANCELLED";
      }
      if (nextStatus === goal.status) {
        return goalFromRow(goal);
      }
      const now = this.clock.now().toISOString();
      await transaction.query(
        "UPDATE goals SET status = $2, updated_at = $3 WHERE id = $1",
        [goalId, nextStatus, now],
      );
      return { id: goalId, status: nextStatus, createdAt: toIsoString(goal.created_at), updatedAt: now };
    });
  }

  private async requireGoal(
    executor: SqlExecutor,
    goalId: string,
    forUpdate: boolean,
  ): Promise<GoalRow> {
    const result = await executor.query<GoalRow>(
      `SELECT id, status, created_at, updated_at
         FROM goals WHERE id = $1${forUpdate ? " FOR UPDATE" : ""}`,
      [goalId],
    );
    const goal = result.rows[0];
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }
    return goal;
  }

  private async requireTask(executor: SqlExecutor, taskId: string): Promise<void> {
    const result = await executor.query<{ id: string }>("SELECT id FROM tasks WHERE id = $1", [
      taskId,
    ]);
    if (!result.rows[0]) {
      throw new Error(`Task not found: ${taskId}`);
    }
  }

  private async requireMembership(
    executor: SqlExecutor,
    goalId: string,
    taskId: string,
  ): Promise<void> {
    const result = await executor.query<{ task_id: string }>(
      `SELECT task_id FROM goal_task_memberships
        WHERE goal_id = $1 AND task_id = $2`,
      [goalId, taskId],
    );
    if (!result.rows[0]) {
      throw new Error(`Task ${taskId} is not a member of goal ${goalId}`);
    }
  }
}
