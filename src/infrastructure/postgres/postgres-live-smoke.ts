import { randomUUID } from "node:crypto";

import type {
  DomainCommand,
  DomainEvent,
  TaskDefinition,
} from "../../core/task-runtime/contracts.js";
import { TriggerScheduler } from "../../core/task-runtime/trigger-scheduler.js";
import { applyPostgresMigrations } from "./migrations.js";
import { NodePostgresDatabase } from "./node-postgres-database.js";
import { PostgresGoalGraph } from "./postgres-goal-graph.js";
import { PostgresTaskRuntime } from "./postgres-task-runtime.js";
import { PostgresTriggerStore } from "./postgres-trigger-store.js";

type SmokeState = { schemaVersion: "1"; count: number; completed: boolean };
type SmokeEvent =
  | (DomainEvent & { type: "INCREMENT" })
  | (DomainEvent & { type: "COMPLETE" });
type SmokeCommand = DomainCommand & { type: "OBSERVE_COUNT"; count: number };

const definition: TaskDefinition<SmokeState, SmokeEvent, SmokeCommand, number> = {
  type: "smoke.postgres",
  version: "1",
  create() {
    return { schemaVersion: "1", count: 0, completed: false };
  },
  transition(state, event, context) {
    if (event.type === "COMPLETE") {
      return { state: { ...state, completed: true }, commands: [] };
    }
    const count = state.count + 1;
    return {
      state: { ...state, count },
      commands: [
        {
          type: "OBSERVE_COUNT",
          category: "READ",
          idempotencyKey: `${context.taskId}:observe:${count}`,
          count,
        },
      ],
    };
  },
  getLifecycleState(state) {
    return state.completed ? "SUCCEEDED" : "READY";
  },
  evaluateOutcome(state) {
    return state.count;
  },
};

const connectionString = process.env.PRAXIS_TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error("PRAXIS_TEST_DATABASE_URL is required for the real PostgreSQL smoke test");
}
if (process.env.PRAXIS_ALLOW_TEST_DATABASE_WRITE !== "1") {
  throw new Error(
    "Set PRAXIS_ALLOW_TEST_DATABASE_WRITE=1 to acknowledge schema and temporary row writes",
  );
}

const database = new NodePostgresDatabase({ connectionString });
const taskId = `postgres-smoke:${randomUUID()}`;
const bookingTaskId = `postgres-smoke:booking:${randomUUID()}`;
const routeTaskId = `postgres-smoke:route:${randomUUID()}`;
const goalId = `postgres-smoke:goal:${randomUUID()}`;
let sequence = 0;
const fixedNow = "2026-08-07T09:00:00.000Z";
const failures: unknown[] = [];

try {
  await applyPostgresMigrations(database);
  const runtime = new PostgresTaskRuntime(
    database,
    definition,
    { now: () => new Date(fixedNow) },
    (prefix) => `${prefix}:${randomUUID()}:${++sequence}`,
  );
  await runtime.createTask(taskId, {}, { runId: `run:${taskId}` });
  await runtime.createTask(bookingTaskId, {}, { runId: `run:${bookingTaskId}` });
  await runtime.createTask(routeTaskId, {}, { runId: `run:${routeTaskId}` });
  const result = await runtime.dispatch({
    id: `event:${randomUUID()}`,
    taskId,
    event: { type: "INCREMENT" },
    occurredAt: fixedNow,
    trace: {
      schemaVersion: "1",
      runId: `run:${taskId}`,
      correlationId: `correlation:${taskId}`,
      actor: "USER",
    },
  });
  if (result.snapshot.version !== 1 || result.commands.length !== 1) {
    throw new Error("Real PostgreSQL smoke produced an unexpected task snapshot");
  }
  const graph = new PostgresGoalGraph(database, { now: () => new Date(fixedNow) });
  await graph.createGoal(goalId);
  await graph.addTask({ goalId, taskId, critical: false });
  await graph.addTask({
    goalId,
    taskId: bookingTaskId,
    parentTaskId: taskId,
    critical: true,
  });
  await graph.addTask({
    goalId,
    taskId: routeTaskId,
    parentTaskId: taskId,
    critical: true,
  });
  await graph.addDependency({
    goalId,
    upstreamTaskId: bookingTaskId,
    downstreamTaskId: routeTaskId,
    condition: "ALL_UPSTREAM_SUCCEEDED",
  });
  if ((await graph.dependencyReadiness(goalId, routeTaskId)).status !== "WAITING") {
    throw new Error("Real PostgreSQL smoke expected route task to wait for booking");
  }
  const triggers = new PostgresTriggerStore<{}>(database);
  await triggers.schedule({
    id: `trigger:${randomUUID()}`,
    taskId: bookingTaskId,
    expectedTaskVersion: 0,
    idempotencyKey: `${bookingTaskId}:complete`,
    triggerAt: fixedNow,
    payload: {},
    trace: {
      schemaVersion: "1",
      runId: `run:${bookingTaskId}`,
      correlationId: `correlation:${bookingTaskId}`,
      actor: "RUNTIME",
    },
    createdAt: fixedNow,
  });
  const scheduler = new TriggerScheduler<{}, SmokeEvent>({
    queue: triggers,
    runtime,
    eventFactory: { createEvent: () => ({ type: "COMPLETE" }) },
    clock: { now: () => new Date(fixedNow) },
    leaseDurationMs: 1_000,
    retryDelayMs: 100,
    maxDeliveryAttempts: 2,
  });
  const scheduled = await scheduler.runOnce("real-postgres-smoke-scheduler");
  if (scheduled.status !== "DISPATCHED") {
    throw new Error("Real PostgreSQL smoke expected scheduler to dispatch booking completion");
  }
  if ((await graph.dependencyReadiness(goalId, routeTaskId)).status !== "READY") {
    throw new Error("Real PostgreSQL smoke expected route task to become dependency-ready");
  }
  await runtime.dispatch({
    id: `event:${randomUUID()}`,
    taskId: routeTaskId,
    event: { type: "COMPLETE" },
    occurredAt: fixedNow,
    trace: {
      schemaVersion: "1",
      runId: `run:${routeTaskId}`,
      correlationId: `correlation:${routeTaskId}`,
      actor: "USER",
    },
  });
  if ((await graph.reconcileGoal(goalId)).status !== "ACHIEVED") {
    throw new Error("Real PostgreSQL smoke expected Goal to be achieved");
  }
} catch (error) {
  failures.push(error);
} finally {
  // Attempt every owned-row cleanup; success includes cleanup, not just assertions.
  await database.query("DELETE FROM goals WHERE id = $1", [goalId]).catch((error) => { failures.push(error); });
  for (const ownedTaskId of [taskId, bookingTaskId, routeTaskId]) {
    await database.query("DELETE FROM tasks WHERE id = $1", [ownedTaskId]).catch((error) => { failures.push(error); });
  }
  await database.close().catch((error) => { failures.push(error); });
}
if (failures.length > 0) throw new AggregateError(failures, "Real PostgreSQL smoke or cleanup failed");
console.log("real-postgres-smoke: pass");
