import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { PGlite, type Results, type Transaction } from "@electric-sql/pglite";

import { DurableCommandWorker } from "../../core/task-runtime/durable-command-worker.js";
import { RecoveryCoordinator } from "../../core/task-runtime/recovery-coordinator.js";
import { TriggerScheduler } from "../../core/task-runtime/trigger-scheduler.js";
import type {
  DomainCommand,
  DomainEvent,
  EventEnvelope,
  TaskDefinition,
  TraceMetadata,
} from "../../core/task-runtime/contracts.js";
import { StaleTaskVersionError } from "../../core/task-runtime/errors.js";
import { FakeClock } from "../../harness/fake-clock.js";
import {
  longRunningCaseTaskDefinition,
  type LongRunningCaseCommand,
  type LongRunningCaseEvent,
  type LongRunningCaseTaskState,
} from "../../harness/synthetic/long-running-case.js";
import {
  recurringShoppingTaskDefinition,
  recurringShoppingTriggerEventFactory,
  type RecurringShoppingCommand,
  type RecurringShoppingEvent,
  type RecurringShoppingTaskState,
  type RecurringShoppingTriggerPayload,
} from "../../harness/synthetic/recurring-shopping.js";
import {
  fixtureCandidates,
  fixtureIntent,
  fixtureOffers,
} from "../../harness/restaurant-fixtures.js";
import { restaurantBookingTaskDefinition } from "../../domains/restaurant/task-definition.js";
import type { RestaurantIntentPatch } from "../../domains/restaurant/contracts.js";
import { restaurantRecoveryEventFactory } from "../../domains/restaurant/recovery.js";
import { applyPostgresMigrations, POSTGRES_MIGRATIONS } from "./migrations.js";
import { PostgresCommandOutbox } from "./postgres-command-outbox.js";
import { PostgresGoalGraph } from "./postgres-goal-graph.js";
import { PostgresRestaurantAgentTrajectoryStore } from "./restaurant-agent-trajectory-store.js";
import { PostgresTaskRuntime } from "./postgres-task-runtime.js";
import { PostgresTriggerStore } from "./postgres-trigger-store.js";
import type { SqlDatabase, SqlExecutor, SqlQueryResult } from "./sql-database.js";

type TestState = {
  schemaVersion: "1";
  phase: "READY" | "WAITING" | "DONE" | "FAILED";
  value: number;
};

type TestEvent =
  | (DomainEvent & { type: "TRIGGER_READ" })
  | (DomainEvent & { type: "TRIGGER_WRITE" })
  | (DomainEvent & { type: "COMPLETED"; value: number })
  | (DomainEvent & { type: "FAILED" });

type TestCommand =
  | (DomainCommand & { type: "EXECUTE_READ" })
  | (DomainCommand & { type: "EXECUTE_WRITE"; attemptId: string });

type TestEventEnvelope<Event extends DomainEvent> = Omit<EventEnvelope<Event>, "trace"> & {
  trace?: TraceMetadata;
};

const fixtureSemanticPatch: RestaurantIntentPatch = {
  schemaVersion: "3",
  date: fixtureIntent.date,
  timeWindow: fixtureIntent.timeWindow,
  partySize: fixtureIntent.partySize,
  area: { query: fixtureIntent.area.query },
  addCriteria: fixtureIntent.criteria,
  ...(fixtureIntent.budgetPerPerson ? { budgetPerPerson: fixtureIntent.budgetPerPerson } : {}),
};

const definition: TaskDefinition<TestState, TestEvent, TestCommand, number | null> = {
  type: "test.durable-counter",
  version: "1",
  create() {
    return { schemaVersion: "1", phase: "READY", value: 0 };
  },
  transition(state, event, context) {
    switch (event.type) {
      case "TRIGGER_READ":
        return {
          state: { ...state, phase: "WAITING" },
          commands: [
            {
              type: "EXECUTE_READ",
              category: "READ",
              idempotencyKey: `${context.taskId}:read`,
            },
          ],
        };
      case "TRIGGER_WRITE": {
        const attemptId = context.createId("attempt");
        return {
          state: { ...state, phase: "WAITING" },
          commands: [
            {
              type: "EXECUTE_WRITE",
              category: "EXTERNAL_WRITE",
              idempotencyKey: `${context.taskId}:write`,
              attemptId,
            },
          ],
        };
      }
      case "COMPLETED":
        return {
          state: { ...state, phase: "DONE", value: event.value },
          commands: [],
        };
      case "FAILED":
        return {
          state: { ...state, phase: "FAILED" },
          commands: [],
        };
    }
  },
  getLifecycleState(state) {
    if (state.phase === "DONE") {
      return "SUCCEEDED";
    }
    if (state.phase === "FAILED") {
      return "FAILED";
    }
    return state.phase === "READY" ? "READY" : "RUNNING";
  },
  evaluateOutcome(state) {
    return state.phase === "DONE" ? state.value : null;
  },
};

class PGliteSqlExecutor implements SqlExecutor {
  constructor(private readonly executor: Pick<PGlite | Transaction, "query">) {}

  async query<Row>(
    sql: string,
    parameters: readonly unknown[] = [],
  ): Promise<SqlQueryResult<Row>> {
    const result = (await this.executor.query<Row>(sql, [...parameters])) as Results<Row>;
    return {
      rows: result.rows,
      affectedRows: result.affectedRows ?? 0,
    };
  }
}

class PGliteSqlDatabase extends PGliteSqlExecutor implements SqlDatabase {
  constructor(private readonly database: PGlite) {
    super(database);
  }

  transaction<Result>(callback: (transaction: SqlExecutor) => Promise<Result>): Promise<Result> {
    return this.database.transaction((transaction) =>
      callback(new PGliteSqlExecutor(transaction)),
    );
  }
}

async function withDatabase(
  callback: (input: { database: SqlDatabase; clock: FakeClock }) => Promise<void>,
): Promise<void> {
  const pglite = await PGlite.create();
  const database = new PGliteSqlDatabase(pglite);
  const clock = new FakeClock("2026-08-07T09:00:00.000Z");
  try {
    await applyPostgresMigrations(database);
    await callback({ database, clock });
  } finally {
    await pglite.close();
  }
}

async function applyMigrationsThrough(database: SqlDatabase, count: number): Promise<void> {
  await database.transaction(async (transaction) => {
    await transaction.query(
      `CREATE TABLE IF NOT EXISTS praxis_schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    );
    for (const migration of POSTGRES_MIGRATIONS.slice(0, count)) {
      for (const statement of migration.statements ?? []) {
        await transaction.query(statement);
      }
      await migration.apply?.(transaction);
      await transaction.query("INSERT INTO praxis_schema_migrations (id) VALUES ($1)", [migration.id]);
    }
  });
}

function parseDatabaseJson<Value>(value: unknown): Value {
  return (typeof value === "string" ? JSON.parse(value) : structuredClone(value)) as Value;
}

function withTestTrace<State, Event extends DomainEvent, Command extends DomainCommand, Outcome>(
  runtime: PostgresTaskRuntime<State, Event, Command, Outcome>,
) {
  return {
    createTask: runtime.createTask.bind(runtime),
    dispatch: async (envelope: TestEventEnvelope<Event>, expectedVersion?: number) => {
      const snapshot = await runtime.snapshot(envelope.taskId);
      return runtime.dispatch(
        {
          ...envelope,
          trace:
            envelope.trace ??
            {
              schemaVersion: "1",
              runId: snapshot.runId,
              correlationId: envelope.id,
              actor: "USER",
            },
        },
        expectedVersion,
      );
    },
    snapshot: runtime.snapshot.bind(runtime),
    listEvents: runtime.listEvents.bind(runtime),
    listCommands: runtime.listCommands.bind(runtime),
  };
}

function createRuntime(database: SqlDatabase, clock: FakeClock) {
  let sequence = 0;
  return withTestTrace(new PostgresTaskRuntime(
    database,
    definition,
    clock,
    (prefix) => `${prefix}-${++sequence}`,
  ));
}

function createRecurringShoppingRuntime(database: SqlDatabase, clock: FakeClock) {
  let sequence = 0;
  return withTestTrace(new PostgresTaskRuntime<
    RecurringShoppingTaskState,
    RecurringShoppingEvent,
    RecurringShoppingCommand,
    null
  >(database, recurringShoppingTaskDefinition, clock, (prefix) => `${prefix}-${++sequence}`));
}

function createLongRunningCaseRuntime(database: SqlDatabase, clock: FakeClock) {
  let sequence = 0;
  return withTestTrace(new PostgresTaskRuntime<
    LongRunningCaseTaskState,
    LongRunningCaseEvent,
    LongRunningCaseCommand,
    { status: "RESOLVED"; resolution: string } | null
  >(database, longRunningCaseTaskDefinition, clock, (prefix) => `${prefix}-${++sequence}`));
}

type TestBody = () => void | Promise<void>;
const runFrozenProbes = process.env.PRAXIS_RUN_FROZEN_PROBES === "1";

function currentTest(name: string, body: TestBody): void {
  if (!runFrozenProbes) test(name, body);
}

function probeTest(name: string, body: TestBody): void {
  if (runFrozenProbes) test(name, body);
}

describe("PostgresTaskRuntime with PGlite", () => {
  currentTest("upgrades immutable trajectory migration 0006 with causal refs and proposal joins", async () => {
    const pglite = await PGlite.create();
    const database = new PGliteSqlDatabase(pglite);
    try {
      const legacyMigration = POSTGRES_MIGRATIONS.find((migration) => migration.id === "0006-restaurant-agent-trajectory");
      assert.ok(legacyMigration?.statements?.some((statement) => statement.includes("evidence_refs JSONB NOT NULL")));
      assert.equal(legacyMigration?.statements?.some((statement) => statement.includes("causal_refs")), false);

      await applyMigrationsThrough(database, 6);
      await database.query(
        `INSERT INTO tasks (
          id, run_id, task_type, definition_version, lifecycle_state,
          domain_state_schema_version, domain_state, outcome, version, created_at, updated_at
        ) VALUES (
          'legacy-restaurant-task', 'legacy-run', 'restaurant.booking', '7', 'RUNNING',
          '7', '{"schemaVersion":"7"}'::jsonb, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
      );
      await database.query(
        `INSERT INTO restaurant_agent_trajectory_steps (
          id, task_id, step_number, occurred_at, state_version_before, state_hash_before,
          evidence_refs, capabilities, step_outcome
        ) VALUES (
          'legacy-trajectory', 'legacy-restaurant-task', 1, CURRENT_TIMESTAMP, 0, 'legacy-hash',
          '["evidence-legacy"]'::jsonb, '[]'::jsonb, 'EXECUTED'
        )`,
      );

      await applyPostgresMigrations(database);
      const migrated = await database.query<{
        causal_refs: unknown;
        proposal_id: string | null;
        context_schema_version: string | null;
        decision_context: unknown | null;
      }>(
        "SELECT causal_refs, proposal_id, context_schema_version, decision_context FROM restaurant_agent_trajectory_steps WHERE id = 'legacy-trajectory'",
      );
      assert.deepEqual(parseDatabaseJson(migrated.rows[0]?.causal_refs), {
        eventIds: [],
        commandIds: [],
        attemptIds: [],
        evidenceIds: ["evidence-legacy"],
      });
      assert.equal(migrated.rows[0]?.proposal_id, null);
      assert.equal(migrated.rows[0]?.context_schema_version, null);
      assert.equal(migrated.rows[0]?.decision_context, null);
      const oldColumn = await database.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'restaurant_agent_trajectory_steps'
            AND column_name = 'evidence_refs'`,
      );
      assert.equal(oldColumn.rows.length, 0);
    } finally {
      await pglite.close();
    }
  });

  currentTest("keeps the short-lived causal-ref development form of already-applied migration 0006", async () => {
    const pglite = await PGlite.create();
    const database = new PGliteSqlDatabase(pglite);
    try {
      await applyMigrationsThrough(database, 5);
      await database.query(
        `CREATE TABLE restaurant_agent_trajectory_steps (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL CHECK (step_number > 0),
          occurred_at TIMESTAMPTZ NOT NULL,
          state_version_before INTEGER NOT NULL CHECK (state_version_before >= 0),
          state_hash_before TEXT NOT NULL,
          causal_refs JSONB NOT NULL,
          capabilities JSONB NOT NULL,
          agent_action JSONB,
          decision_summary TEXT,
          model_attempt JSONB,
          action_validation JSONB,
          execution_route TEXT,
          observation JSONB,
          state_version_after INTEGER,
          state_hash_after TEXT,
          step_outcome TEXT NOT NULL,
          UNIQUE (task_id, step_number)
        )`,
      );
      await database.query("INSERT INTO praxis_schema_migrations (id) VALUES ('0006-restaurant-agent-trajectory')");
      await database.query(
        `INSERT INTO tasks (
          id, run_id, task_type, definition_version, lifecycle_state,
          domain_state_schema_version, domain_state, outcome, version, created_at, updated_at
        ) VALUES (
          'causal-dev-task', 'causal-dev-run', 'restaurant.booking', '8', 'RUNNING',
          '8', '{"schemaVersion":"8"}'::jsonb, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
      );
      await database.query(
        `INSERT INTO restaurant_agent_trajectory_steps (
          id, task_id, step_number, occurred_at, state_version_before, state_hash_before,
          causal_refs, capabilities, step_outcome
        ) VALUES (
          'causal-dev-trajectory', 'causal-dev-task', 1, CURRENT_TIMESTAMP, 0, 'causal-dev-hash',
          '{"eventIds":["event-1"],"commandIds":[],"attemptIds":[],"evidenceIds":[]}'::jsonb,
          '[]'::jsonb, 'EXECUTED'
        )`,
      );

      await applyPostgresMigrations(database);
      const migrated = await database.query<{ causal_refs: unknown; proposal_id: string | null }>(
        "SELECT causal_refs, proposal_id FROM restaurant_agent_trajectory_steps WHERE id = 'causal-dev-trajectory'",
      );
      assert.deepEqual(parseDatabaseJson(migrated.rows[0]?.causal_refs), {
        eventIds: ["event-1"],
        commandIds: [],
        attemptIds: [],
        evidenceIds: [],
      });
      assert.equal(migrated.rows[0]?.proposal_id, null);
    } finally {
      await pglite.close();
    }
  });

  currentTest("round-trips the supplied Agent decision context and schema version", async () => {
    await withDatabase(async ({ database }) => {
      await database.query(
        `INSERT INTO tasks (
          id, run_id, task_type, definition_version, lifecycle_state,
          domain_state_schema_version, domain_state, outcome, version, created_at, updated_at
        ) VALUES (
          'trajectory-context-task', 'trajectory-context-run', 'restaurant.booking', '9', 'RUNNING',
          '9', '{"schemaVersion":"9"}'::jsonb, NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )`,
      );
      const store = new PostgresRestaurantAgentTrajectoryStore(database);
      await store.append({
        id: "trajectory-context-step",
        taskId: "trajectory-context-task",
        stepNumber: 1,
        occurredAt: "2026-08-20T00:00:00.000Z",
        stateVersionBefore: 0,
        stateHashBefore: "context-hash",
        causalRefs: { eventIds: [], commandIds: [], attemptIds: [], evidenceIds: [] },
        capabilities: [],
        contextSchemaVersion: "3",
        decisionContext: {
          schemaVersion: "3",
          now: "2026-08-20T00:00:00.000Z",
          phase: "SEARCHING",
          missingBlockingFields: [],
          candidates: [],
          availability: {},
          availabilityChecks: {},
          presentation: [],
        },
        executionRoute: "STRUCTURED_ADAPTER",
        observation: { type: "DISCOVERY", detail: "0 candidates discovered" },
        stepOutcome: "EXECUTED",
      });

      const [step] = await store.list("trajectory-context-task");
      assert.equal(step?.contextSchemaVersion, "3");
      assert.deepEqual(step?.decisionContext, {
        schemaVersion: "3",
        now: "2026-08-20T00:00:00.000Z",
        phase: "SEARCHING",
        missingBlockingFields: [],
        candidates: [],
        availability: {},
        availabilityChecks: {},
        presentation: [],
      });
      assert.equal(step?.executionRoute, "STRUCTURED_ADAPTER");
    });
  });

  currentTest("atomically stores task state, event and outbox command", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      await runtime.createTask("task-1", {}, { runId: "run-1" });

      const result = await runtime.dispatch(
        {
          id: "event-1",
          taskId: "task-1",
          event: { type: "TRIGGER_READ" },
          occurredAt: clock.now().toISOString(),
          trace: {
            schemaVersion: "1",
            runId: "run-1",
            correlationId: "correlation-1",
            actor: "USER",
          },
        },
        0,
      );

      assert.equal(result.snapshot.version, 1);
      assert.equal(result.snapshot.domainState.phase, "WAITING");
      assert.equal(result.commands.length, 1);
      assert.equal(result.commands[0]?.trace.causationId, "event-1");
      assert.equal((await runtime.listEvents("task-1")).length, 1);
      assert.equal((await runtime.listCommands("task-1")).length, 1);

      const status = await new PostgresCommandOutbox<TestCommand>(database).getStatus(
        result.commands[0]!.id,
      );
      assert.equal(status, "PENDING");
    });
  });

  currentTest("deduplicates a persisted event without emitting another command", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      await runtime.createTask("task-1", {});
      const envelope = {
        id: "event-1",
        taskId: "task-1",
        event: { type: "TRIGGER_READ" } as const,
        occurredAt: clock.now().toISOString(),
      };

      const first = await runtime.dispatch(envelope, 0);
      const duplicate = await runtime.dispatch(envelope, 0);

      assert.equal(first.commands.length, 1);
      assert.equal(duplicate.duplicateEvent, true);
      assert.equal(duplicate.commands.length, 0);
      assert.equal((await runtime.listCommands("task-1")).length, 1);
    });
  });

  currentTest("rejects a stale expected version", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      await runtime.createTask("task-1", {});
      await runtime.dispatch({
        id: "event-1",
        taskId: "task-1",
        event: { type: "TRIGGER_READ" },
        occurredAt: clock.now().toISOString(),
      });

      await assert.rejects(
        runtime.dispatch(
          {
            id: "event-2",
            taskId: "task-1",
            event: { type: "COMPLETED", value: 1 },
            occurredAt: clock.now().toISOString(),
          },
          0,
        ),
        StaleTaskVersionError,
      );
    });
  });

  currentTest("rolls back state and event when outbox insertion fails", async () => {
    await withDatabase(async ({ database, clock }) => {
      const invalidDefinition: TaskDefinition<
        TestState,
        Extract<TestEvent, { type: "TRIGGER_READ" }>,
        Extract<TestCommand, { type: "EXECUTE_READ" }>,
        null
      > = {
        ...definition,
        transition(state, _event, context) {
          const duplicate = {
            type: "EXECUTE_READ" as const,
            category: "READ" as const,
            idempotencyKey: `${context.taskId}:duplicate`,
          };
          return {
            state: { ...state, phase: "WAITING" },
            commands: [duplicate, duplicate],
          };
        },
        evaluateOutcome() {
          return null;
        },
      };
      let sequence = 0;
      const runtime = withTestTrace(new PostgresTaskRuntime(
        database,
        invalidDefinition,
        clock,
        (prefix) => `${prefix}-${++sequence}`,
      ));
      await runtime.createTask("task-1", {});

      await assert.rejects(
        runtime.dispatch({
          id: "event-1",
          taskId: "task-1",
          event: { type: "TRIGGER_READ" },
          occurredAt: clock.now().toISOString(),
        }),
      );

      assert.equal((await runtime.snapshot("task-1")).version, 0);
      assert.equal((await runtime.listEvents("task-1")).length, 0);
      assert.equal((await runtime.listCommands("task-1")).length, 0);
    });
  });

  currentTest("releases an expired read lease for another worker", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const outbox = new PostgresCommandOutbox<TestCommand>(database);
      await runtime.createTask("task-1", {});
      await runtime.dispatch({
        id: "event-1",
        taskId: "task-1",
        event: { type: "TRIGGER_READ" },
        occurredAt: clock.now().toISOString(),
      });

      const first = await outbox.leaseNext({
        workerId: "worker-1",
        now: clock.now().toISOString(),
        leaseDurationMs: 1_000,
      });
      assert.equal(first?.deliveryAttempt, 1);

      clock.advance(1_001);
      assert.deepEqual(await outbox.recoverExpiredLeases(clock.now().toISOString()), {
        retried: 1,
        recoveryRequired: 0,
        reconciled: 0,
      });
      const second = await outbox.leaseNext({
        workerId: "worker-2",
        now: clock.now().toISOString(),
        leaseDurationMs: 1_000,
      });
      assert.equal(second?.id, first?.id);
      assert.equal(second?.deliveryAttempt, 2);
    });
  });

  currentTest("never re-leases an expired external write without a result event", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const outbox = new PostgresCommandOutbox<TestCommand>(database);
      await runtime.createTask("task-1", {});
      const dispatched = await runtime.dispatch({
        id: "event-1",
        taskId: "task-1",
        event: { type: "TRIGGER_WRITE" },
        occurredAt: clock.now().toISOString(),
      });
      const commandId = dispatched.commands[0]!.id;

      await outbox.leaseNext({
        workerId: "worker-1",
        now: clock.now().toISOString(),
        leaseDurationMs: 1_000,
      });
      clock.advance(1_001);

      assert.deepEqual(await outbox.recoverExpiredLeases(clock.now().toISOString()), {
        retried: 0,
        recoveryRequired: 1,
        reconciled: 0,
      });
      assert.equal(await outbox.getStatus(commandId), "RECOVERY_REQUIRED");
      assert.equal(
        await outbox.leaseNext({
          workerId: "worker-2",
          now: clock.now().toISOString(),
          leaseDurationMs: 1_000,
        }),
        null,
      );
    });
  });

  currentTest("reconciles an expired external write when its result event was persisted", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const outbox = new PostgresCommandOutbox<TestCommand>(database);
      await runtime.createTask("task-1", {});
      const dispatched = await runtime.dispatch({
        id: "event-1",
        taskId: "task-1",
        event: { type: "TRIGGER_WRITE" },
        occurredAt: clock.now().toISOString(),
      });
      const command = await outbox.leaseNext({
        workerId: "worker-1",
        now: clock.now().toISOString(),
        leaseDurationMs: 1_000,
      });
      assert.ok(command);

      await runtime.dispatch(
        {
          id: `event:command:${command.id}`,
          taskId: command.taskId,
          event: { type: "COMPLETED", value: 7 },
          occurredAt: clock.now().toISOString(),
          trace: {
            schemaVersion: "1",
            runId: command.trace.runId,
            ...(command.trace.attemptId ? { attemptId: command.trace.attemptId } : {}),
            correlationId: command.trace.correlationId,
            causationId: command.id,
            actor: "ADAPTER",
          },
        },
        command.taskVersion,
      );
      clock.advance(1_001);

      assert.deepEqual(await outbox.recoverExpiredLeases(clock.now().toISOString()), {
        retried: 0,
        recoveryRequired: 0,
        reconciled: 1,
      });
      assert.equal(await outbox.getStatus(dispatched.commands[0]!.id), "SUCCEEDED");
    });
  });

  currentTest("worker persists a deterministic result event before completing the command", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const outbox = new PostgresCommandOutbox<TestCommand>(database);
      await runtime.createTask("task-1", {});
      const dispatched = await runtime.dispatch({
        id: "event-1",
        taskId: "task-1",
        event: { type: "TRIGGER_READ" },
        occurredAt: clock.now().toISOString(),
      });
      const complete = outbox.complete.bind(outbox);
      outbox.complete = async (input) => {
        const events = await runtime.listEvents("task-1");
        assert.ok(events.some((event) => event.id === `event:command:${input.commandId}`), "result must be persisted before completing the outbox entry");
        await complete(input);
      };
      const worker = new DurableCommandWorker<TestCommand, TestEvent>({
        queue: outbox,
        runtime,
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
      });

      const result = await worker.runOnce("worker-1", async () => ({
        event: { type: "COMPLETED", value: 9 },
        actor: "ADAPTER",
      }));

      assert.equal(result.status, "SUCCEEDED");
      assert.equal((await runtime.snapshot("task-1")).outcome, 9);
      assert.equal(
        await outbox.getStatus(dispatched.commands[0]!.id),
        "SUCCEEDED",
      );
      assert.equal(
        (await runtime.listEvents("task-1"))[1]?.id,
        `event:command:${dispatched.commands[0]!.id}`,
      );
    });
  });

  currentTest("worker delays a failed read command until its retry time", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const outbox = new PostgresCommandOutbox<TestCommand>(database);
      await runtime.createTask("task-1", {});
      const dispatched = await runtime.dispatch({
        id: "event-1",
        taskId: "task-1",
        event: { type: "TRIGGER_READ" },
        occurredAt: clock.now().toISOString(),
      });
      const worker = new DurableCommandWorker<TestCommand, TestEvent>({
        queue: outbox,
        runtime,
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
      });

      const result = await worker.runOnce("worker-1", async () => {
        throw new Error("mock read failed");
      });

      assert.equal(result.status, "HANDLER_FAILED");
      assert.equal(await outbox.getStatus(dispatched.commands[0]!.id), "PENDING");
      assert.equal(
        await outbox.leaseNext({
          workerId: "worker-2",
          now: clock.now().toISOString(),
          leaseDurationMs: 1_000,
        }),
        null,
      );
      clock.advance(100);
      const retried = await outbox.leaseNext({
        workerId: "worker-2",
        now: clock.now().toISOString(),
        leaseDurationMs: 1_000,
      });
      assert.equal(retried?.deliveryAttempt, 2);
    });
  });

  currentTest("worker never retries a failed external-write handler blindly", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const outbox = new PostgresCommandOutbox<TestCommand>(database);
      await runtime.createTask("task-1", {});
      const dispatched = await runtime.dispatch({
        id: "event-1",
        taskId: "task-1",
        event: { type: "TRIGGER_WRITE" },
        occurredAt: clock.now().toISOString(),
      });
      const worker = new DurableCommandWorker<TestCommand, TestEvent>({
        queue: outbox,
        runtime,
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
      });

      const result = await worker.runOnce("worker-1", async () => {
        throw new Error("connection lost during external write");
      });

      assert.equal(result.status, "HANDLER_FAILED");
      assert.equal(
        await outbox.getStatus(dispatched.commands[0]!.id),
        "RECOVERY_REQUIRED",
      );
      clock.advance(10_000);
      assert.equal(
        await outbox.leaseNext({
          workerId: "worker-2",
          now: clock.now().toISOString(),
          leaseDurationMs: 1_000,
        }),
        null,
      );
    });
  });

  currentTest("restores a Restaurant task through a new runtime instance", async () => {
    await withDatabase(async ({ database, clock }) => {
      let firstSequence = 0;
      const firstRuntime = withTestTrace(new PostgresTaskRuntime(
        database,
        restaurantBookingTaskDefinition,
        clock,
        (prefix) => `first-${prefix}-${++firstSequence}`,
      ));
      await firstRuntime.createTask("restaurant-task-1", {}, {
        runId: "restaurant-run-1",
      });
      await firstRuntime.dispatch({
        id: "restaurant-event-1",
        taskId: "restaurant-task-1",
        event: {
          type: "SEMANTIC_PROPOSAL_COMPILED",
          patch: fixtureSemanticPatch,
        },
        occurredAt: clock.now().toISOString(),
      });
      await firstRuntime.dispatch(
        {
          id: "restaurant-event-2",
          taskId: "restaurant-task-1",
          event: { type: "SEARCH_COMPLETED", request: { intent: fixtureIntent }, candidates: fixtureCandidates, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } },
          occurredAt: clock.now().toISOString(),
        },
        1,
      );

      let secondSequence = 0;
      const restartedRuntime = withTestTrace(new PostgresTaskRuntime(
        database,
        restaurantBookingTaskDefinition,
        clock,
        (prefix) => `second-${prefix}-${++secondSequence}`,
      ));
      const restored = await restartedRuntime.snapshot("restaurant-task-1");
      const duplicate = await restartedRuntime.dispatch({
        id: "restaurant-event-1",
        taskId: "restaurant-task-1",
        event: {
          type: "SEMANTIC_PROPOSAL_COMPILED",
          patch: fixtureSemanticPatch,
        },
        occurredAt: clock.now().toISOString(),
      });

      assert.equal(restored.runId, "restaurant-run-1");
      assert.equal(restored.domainState.schemaVersion, "10");
      assert.equal(restored.domainState.phase, "SEARCHING");
      assert.equal(restored.version, 2);
      assert.equal(duplicate.duplicateEvent, true);
      assert.equal(duplicate.commands.length, 0);
    });
  });

  currentTest("routes an uncertain Restaurant external write into verification without retrying commit", async () => {
    await withDatabase(async ({ database, clock }) => {
      let sequence = 0;
      const runtime = withTestTrace(new PostgresTaskRuntime(
        database,
        restaurantBookingTaskDefinition,
        clock,
        (prefix) => `${prefix}-${++sequence}`,
      ));
      const outbox = new PostgresCommandOutbox<
        Parameters<typeof restaurantRecoveryEventFactory.createRecoveryEvent>[0]["command"]
      >(database);
      await runtime.createTask("restaurant-recovery-1", {}, {
        runId: "restaurant-recovery-run-1",
      });

      await runtime.dispatch({
        id: "restaurant-recovery-start",
        taskId: "restaurant-recovery-1",
        event: {
          type: "SEMANTIC_PROPOSAL_COMPILED",
          patch: fixtureSemanticPatch,
        },
        occurredAt: clock.now().toISOString(),
      });
      await runtime.dispatch(
        {
          id: "restaurant-recovery-decision-search",
          taskId: "restaurant-recovery-1",
          event: { type: "SEARCH_COMPLETED", request: { intent: fixtureIntent }, candidates: fixtureCandidates, evidence: [], metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 } },
          occurredAt: clock.now().toISOString(),
        },
        1,
      );
      await runtime.dispatch(
        {
          id: "restaurant-recovery-search",
          taskId: "restaurant-recovery-1",
          event: {
            type: "AVAILABILITY_CHECKED",
            request: { candidateIds: [fixtureCandidates[0]!.restaurant.id], candidates: [fixtureCandidates[0]!], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"] },
            offers: [fixtureOffers[0]!],
            availabilityChecks: { [fixtureCandidates[0]!.restaurant.id]: { status: "AVAILABLE", checkedAt: clock.now().toISOString(), evidenceIds: [] } },
            evidence: [],
            metadata: { provider: "FIXTURE", route: "STRUCTURED_ADAPTER", latencyMs: 0 },
          },
          occurredAt: clock.now().toISOString(),
        },
        2,
      );
      await runtime.dispatch(
        {
          id: "restaurant-recovery-select",
          taskId: "restaurant-recovery-1",
          event: { type: "CANDIDATE_SELECTED", candidateId: fixtureCandidates[0]!.restaurant.id, offerId: fixtureOffers[0]!.id },
          occurredAt: clock.now().toISOString(),
        },
        3,
      );
      await runtime.dispatch(
        {
          id: "restaurant-recovery-propose",
          taskId: "restaurant-recovery-1",
          event: { type: "BOOKING_PROPOSED", candidateId: fixtureCandidates[0]!.restaurant.id, offerId: fixtureOffers[0]!.id },
          occurredAt: clock.now().toISOString(),
        },
        4,
      );
      const awaitingAuthorization = await runtime.snapshot("restaurant-recovery-1");
      const proposal = awaitingAuthorization.domainState.proposal;
      assert.ok(proposal);
      await runtime.dispatch(
        {
          id: "restaurant-recovery-authorize",
          taskId: "restaurant-recovery-1",
          event: {
            type: "AUTHORIZE",
            authorization: {
              id: "restaurant-recovery-authorization",
              proposalId: proposal.id,
              scope: "ONE_TIME",
              approvedAt: clock.now().toISOString(),
              expiresAt: new Date(clock.now().valueOf() + 60_000).toISOString(),
            },
          },
          occurredAt: clock.now().toISOString(),
        },
        5,
      );
      const approved = await runtime.dispatch(
        {
          id: "restaurant-recovery-policy",
          taskId: "restaurant-recovery-1",
          event: { type: "POLICY_APPROVED" },
          occurredAt: clock.now().toISOString(),
        },
        6,
      );
      const commitCommand = approved.commands.find(
        (command) => command.command.type === "COMMIT_BOOKING",
      );
      assert.ok(commitCommand);

      await database.query(
        "UPDATE task_commands SET status = 'SUCCEEDED' WHERE task_id = $1 AND id <> $2",
        ["restaurant-recovery-1", commitCommand.id],
      );
      const worker = new DurableCommandWorker({
        queue: outbox,
        runtime,
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
      });
      const failed = await worker.runOnce("booking-worker", async () => {
        throw new Error("connection lost while booking outcome was unknown");
      });
      assert.equal(failed.status, "HANDLER_FAILED");
      assert.equal(await outbox.getStatus(commitCommand.id), "RECOVERY_REQUIRED");

      const coordinator = new RecoveryCoordinator({
        queue: outbox,
        runtime,
        eventFactory: restaurantRecoveryEventFactory,
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
      });
      const recovered = await coordinator.runOnce("recovery-worker");

      assert.deepEqual(recovered, {
        status: "DISPATCHED",
        commandId: commitCommand.id,
        eventId: `event:recovery:${commitCommand.id}`,
      });
      assert.equal(await outbox.getStatus(commitCommand.id), "RECOVERY_DISPATCHED");
      const snapshot = await runtime.snapshot("restaurant-recovery-1");
      assert.equal(snapshot.domainState.phase, "OUTCOME_UNKNOWN");
      assert.equal(snapshot.outcome?.status, "OUTCOME_UNKNOWN");
      assert.equal(snapshot.version, 8);
      assert.deepEqual(await coordinator.runOnce("recovery-worker"), { status: "IDLE" });

      const commands = await runtime.listCommands("restaurant-recovery-1");
      assert.equal(
        commands.filter((command) => command.command.type === "COMMIT_BOOKING").length,
        1,
      );
      assert.equal(
        commands.filter((command) => command.command.type === "VERIFY_BOOKING").length,
        1,
      );
      const events = await runtime.listEvents("restaurant-recovery-1");
      const recoveryEvent = events.find(
        (event) => event.id === `event:recovery:${commitCommand.id}`,
      );
      assert.equal(recoveryEvent?.trace.actor, "SYSTEM");
      assert.equal(recoveryEvent?.trace.causationId, commitCommand.id);
    });
  });

  probeTest("G03 completes a Goal only after both critical child tasks succeed", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const graph = new PostgresGoalGraph(database, clock);
      await runtime.createTask("coordination-root", {});
      await runtime.createTask("coordination-booking", {});
      await runtime.createTask("coordination-route", {});
      await graph.createGoal("goal-coordination-1");
      await graph.addTask({
        goalId: "goal-coordination-1",
        taskId: "coordination-root",
        critical: false,
      });
      await graph.addTask({
        goalId: "goal-coordination-1",
        taskId: "coordination-booking",
        parentTaskId: "coordination-root",
        critical: true,
      });
      await graph.addTask({
        goalId: "goal-coordination-1",
        taskId: "coordination-route",
        parentTaskId: "coordination-root",
        critical: true,
      });
      await graph.addDependency({
        goalId: "goal-coordination-1",
        upstreamTaskId: "coordination-booking",
        downstreamTaskId: "coordination-route",
        condition: "ALL_UPSTREAM_SUCCEEDED",
      });

      assert.deepEqual(
        await graph.dependencyReadiness("goal-coordination-1", "coordination-route"),
        {
          goalId: "goal-coordination-1",
          taskId: "coordination-route",
          status: "WAITING",
          condition: "ALL_UPSTREAM_SUCCEEDED",
          upstream: [{ taskId: "coordination-booking", lifecycleState: "READY" }],
        },
      );

      await runtime.dispatch({
        id: "coordination-booking-done",
        taskId: "coordination-booking",
        event: { type: "COMPLETED", value: 1 },
        occurredAt: clock.now().toISOString(),
      });
      assert.equal(
        (await graph.dependencyReadiness("goal-coordination-1", "coordination-route"))
          .status,
        "READY",
      );
      assert.equal((await graph.reconcileGoal("goal-coordination-1")).status, "ACTIVE");

      await runtime.dispatch({
        id: "coordination-route-done",
        taskId: "coordination-route",
        event: { type: "COMPLETED", value: 2 },
        occurredAt: clock.now().toISOString(),
      });
      assert.equal((await graph.reconcileGoal("goal-coordination-1")).status, "ACHIEVED");
      assert.deepEqual(await graph.listMembers("goal-coordination-1"), [
        {
          goalId: "goal-coordination-1",
          taskId: "coordination-booking",
          parentTaskId: "coordination-root",
          critical: true,
          createdAt: clock.now().toISOString(),
        },
        {
          goalId: "goal-coordination-1",
          taskId: "coordination-root",
          critical: false,
          createdAt: clock.now().toISOString(),
        },
        {
          goalId: "goal-coordination-1",
          taskId: "coordination-route",
          parentTaskId: "coordination-root",
          critical: true,
          createdAt: clock.now().toISOString(),
        },
      ]);
    });
  });

  probeTest("blocks an unsatisfiable dependency and rejects cycles", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const graph = new PostgresGoalGraph(database, clock);
      await runtime.createTask("graph-a", {});
      await runtime.createTask("graph-b", {});
      await runtime.createTask("graph-c", {});
      await graph.createGoal("goal-graph-2");
      for (const taskId of ["graph-a", "graph-b", "graph-c"]) {
        await graph.addTask({ goalId: "goal-graph-2", taskId, critical: true });
      }
      await graph.addDependency({
        goalId: "goal-graph-2",
        upstreamTaskId: "graph-a",
        downstreamTaskId: "graph-b",
        condition: "UPSTREAM_SUCCEEDED",
      });
      await runtime.dispatch({
        id: "graph-a-failed",
        taskId: "graph-a",
        event: { type: "FAILED" },
        occurredAt: clock.now().toISOString(),
      });
      assert.equal(
        (await graph.dependencyReadiness("goal-graph-2", "graph-b")).status,
        "BLOCKED",
      );
      await graph.addDependency({
        goalId: "goal-graph-2",
        upstreamTaskId: "graph-b",
        downstreamTaskId: "graph-c",
        condition: "UPSTREAM_SUCCEEDED",
      });
      await assert.rejects(
        graph.addDependency({
          goalId: "goal-graph-2",
          upstreamTaskId: "graph-c",
          downstreamTaskId: "graph-b",
          condition: "UPSTREAM_SUCCEEDED",
        }),
        /would create a cycle/,
      );
    });
  });

  probeTest("dispatches a due trigger once and preserves its causal event ID", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const triggers = new PostgresTriggerStore<{ value: number }>(database);
      await runtime.createTask("trigger-due-task", {});
      await triggers.schedule({
        id: "trigger-due-1",
        taskId: "trigger-due-task",
        expectedTaskVersion: 0,
        idempotencyKey: "trigger-due-task:complete",
        triggerAt: new Date(clock.now().valueOf() + 1_000).toISOString(),
        payload: { value: 42 },
        trace: {
          schemaVersion: "1",
          runId: "run:trigger-due-task",
          correlationId: "correlation:trigger-due",
          actor: "RUNTIME",
        },
        createdAt: clock.now().toISOString(),
      });
      const scheduler = new TriggerScheduler({
        queue: triggers,
        runtime,
        eventFactory: {
          createEvent(trigger) {
            return { type: "COMPLETED", value: trigger.payload.value } as const;
          },
        },
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
        maxDeliveryAttempts: 2,
      });

      assert.deepEqual(await scheduler.runOnce("scheduler-1"), { status: "IDLE" });
      clock.advance(1_000);
      assert.deepEqual(await scheduler.runOnce("scheduler-1"), {
        status: "DISPATCHED",
        triggerId: "trigger-due-1",
        eventId: "event:trigger:trigger-due-1",
      });
      assert.equal((await runtime.snapshot("trigger-due-task")).outcome, 42);
      assert.equal(await triggers.getStatus("trigger-due-1"), "DISPATCHED");
      assert.deepEqual(await scheduler.runOnce("scheduler-2"), { status: "IDLE" });
      const event = (await runtime.listEvents("trigger-due-task")).find(
        (item) => item.id === "event:trigger:trigger-due-1",
      );
      assert.equal(event?.trace.causationId, "trigger-due-1");
      assert.equal(event?.trace.actor, "SYSTEM");
    });
  });

  probeTest("G01 recurring shopping waits for every user confirmation across persisted trigger cycles", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRecurringShoppingRuntime(database, clock);
      const triggers = new PostgresTriggerStore<RecurringShoppingTriggerPayload>(database);
      const taskId = "shopping-recurring-1";
      await runtime.createTask(taskId, { cycleIntervalMs: 60_000 });
      await triggers.schedule({
        id: "shopping-trigger-1",
        taskId,
        expectedTaskVersion: 0,
        idempotencyKey: `${taskId}:shopping:cycle:1`,
        triggerAt: new Date(clock.now().valueOf() + 60_000).toISOString(),
        payload: { kind: "RECURRENCE_DUE", cycle: 1 },
        trace: {
          schemaVersion: "1",
          runId: `run:${taskId}`,
          correlationId: "correlation:shopping:1",
          actor: "RUNTIME",
        },
        createdAt: clock.now().toISOString(),
      });
      const scheduler = new TriggerScheduler({
        queue: triggers,
        runtime,
        eventFactory: recurringShoppingTriggerEventFactory,
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
        maxDeliveryAttempts: 2,
      });

      assert.equal((await runtime.snapshot(taskId)).lifecycleState, "WAITING_TIME");
      clock.advance(60_000);
      assert.deepEqual(await scheduler.runOnce("shopping-scheduler"), {
        status: "DISPATCHED",
        triggerId: "shopping-trigger-1",
        eventId: "event:trigger:shopping-trigger-1",
      });
      let snapshot = await runtime.snapshot(taskId);
      assert.equal(snapshot.domainState.phase, "AWAITING_CONFIRMATION");
      assert.equal(snapshot.lifecycleState, "WAITING_USER");
      assert.equal((await runtime.listCommands(taskId)).length, 0);

      const confirmation = await runtime.dispatch(
        {
          id: "shopping-confirm-1",
          taskId,
          event: { type: "CONFIRM_PURCHASE", cycle: 1 },
          occurredAt: clock.now().toISOString(),
        },
        snapshot.version,
      );
      assert.equal(confirmation.snapshot.domainState.phase, "PREPARING_ORDER");
      assert.deepEqual(confirmation.commands.map((command) => command.command.category), ["PREPARE"]);
      assert.equal(
        confirmation.commands.some((command) => command.command.category === "EXTERNAL_WRITE"),
        false,
      );

      const ordered = await runtime.dispatch(
        {
          id: "shopping-simulated-order-1",
          taskId,
          event: { type: "PURCHASE_SIMULATED", cycle: 1, reference: "mock-order-1" },
          occurredAt: clock.now().toISOString(),
        },
        confirmation.snapshot.version,
      );
      assert.equal(ordered.snapshot.domainState.phase, "MONITORING");
      const nextCycle = ordered.commands[0]?.command;
      assert.deepEqual(nextCycle, {
        type: "SCHEDULE_NEXT_CYCLE",
        category: "WAIT",
        idempotencyKey: `${taskId}:shopping:cycle:2`,
        cycle: 2,
        triggerAt: new Date(clock.now().valueOf() + 60_000).toISOString(),
      });
      if (!nextCycle || nextCycle.type !== "SCHEDULE_NEXT_CYCLE") {
        throw new Error("Expected next recurring shopping cycle command");
      }
      await triggers.schedule({
        id: "shopping-trigger-2",
        taskId,
        expectedTaskVersion: ordered.snapshot.version,
        idempotencyKey: nextCycle.idempotencyKey,
        triggerAt: nextCycle.triggerAt,
        payload: { kind: "RECURRENCE_DUE", cycle: nextCycle.cycle },
        trace: {
          schemaVersion: "1",
          runId: ordered.snapshot.runId,
          correlationId: "correlation:shopping:2",
          actor: "RUNTIME",
        },
        createdAt: clock.now().toISOString(),
      });

      clock.advance(60_000);
      assert.equal((await scheduler.runOnce("shopping-scheduler")).status, "DISPATCHED");
      snapshot = await runtime.snapshot(taskId);
      assert.equal(snapshot.domainState.phase, "AWAITING_CONFIRMATION");
      assert.equal(snapshot.domainState.activeCycle, 2);
      assert.equal(snapshot.lifecycleState, "WAITING_USER");
      const allCommands = await runtime.listCommands(taskId);
      assert.equal(
        allCommands.filter((command) => command.command.type === "PREPARE_SIMULATED_PURCHASE")
          .length,
        1,
      );
    });
  });

  probeTest("G02 long-running case waits for external events and material before resubmitting", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createLongRunningCaseRuntime(database, clock);
      const taskId = "case-long-running-1";
      await runtime.createTask(taskId, {});

      const requested = await runtime.dispatch({
        id: "case-submission-requested-1",
        taskId,
        event: { type: "SUBMISSION_REQUESTED" },
        occurredAt: clock.now().toISOString(),
      });
      assert.equal(requested.snapshot.domainState.phase, "SUBMITTING");
      assert.deepEqual(requested.commands.map((command) => command.command), [
        {
          type: "PREPARE_SUBMISSION",
          category: "PREPARE",
          idempotencyKey: `${taskId}:case:prepare:1`,
          submissionNumber: 1,
        },
      ]);

      const firstSubmission = await runtime.dispatch(
        {
          id: "case-submission-prepared-1",
          taskId,
          event: { type: "SUBMISSION_PREPARED" },
          occurredAt: clock.now().toISOString(),
        },
        requested.snapshot.version,
      );
      assert.equal(firstSubmission.snapshot.domainState.phase, "WAITING_EXTERNAL");
      assert.equal(firstSubmission.snapshot.lifecycleState, "WAITING_EXTERNAL");
      assert.equal(firstSubmission.snapshot.domainState.submissionCount, 1);
      assert.equal(firstSubmission.commands.length, 0);

      const needsMaterial = await runtime.dispatch(
        {
          id: "case-needs-material-1",
          taskId,
          event: { type: "EXTERNAL_NEEDS_MATERIAL", request: "Upload receipt" },
          occurredAt: clock.now().toISOString(),
        },
        firstSubmission.snapshot.version,
      );
      assert.equal(needsMaterial.snapshot.domainState.phase, "NEEDS_MATERIAL");
      assert.equal(needsMaterial.snapshot.lifecycleState, "WAITING_USER");
      assert.equal(needsMaterial.commands.length, 0);

      const provided = await runtime.dispatch(
        {
          id: "case-materials-provided-1",
          taskId,
          event: { type: "MATERIALS_PROVIDED" },
          occurredAt: clock.now().toISOString(),
        },
        needsMaterial.snapshot.version,
      );
      assert.equal(provided.snapshot.domainState.phase, "RESUBMITTING");
      assert.deepEqual(provided.commands.map((command) => command.command), [
        {
          type: "PREPARE_RESUBMISSION",
          category: "PREPARE",
          idempotencyKey: `${taskId}:case:prepare:2`,
          submissionNumber: 2,
        },
      ]);

      const resubmitted = await runtime.dispatch(
        {
          id: "case-resubmission-prepared-1",
          taskId,
          event: { type: "RESUBMISSION_PREPARED" },
          occurredAt: clock.now().toISOString(),
        },
        provided.snapshot.version,
      );
      assert.equal(resubmitted.snapshot.domainState.submissionCount, 2);
      assert.equal(resubmitted.snapshot.domainState.phase, "WAITING_EXTERNAL");
      assert.equal(resubmitted.commands.length, 0);

      const resolved = await runtime.dispatch(
        {
          id: "case-resolved-1",
          taskId,
          event: { type: "EXTERNAL_RESOLVED", resolution: "Refund approved" },
          occurredAt: clock.now().toISOString(),
        },
        resubmitted.snapshot.version,
      );
      assert.equal(resolved.snapshot.lifecycleState, "SUCCEEDED");
      assert.deepEqual(resolved.snapshot.outcome, {
        status: "RESOLVED",
        resolution: "Refund approved",
      });
      assert.equal(
        (await runtime.listCommands(taskId)).some(
          (command) => command.command.category === "EXTERNAL_WRITE",
        ),
        false,
      );
    });
  });

  probeTest("recovers an expired trigger lease and lets another scheduler deliver it", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const triggers = new PostgresTriggerStore<{ value: number }>(database);
      await runtime.createTask("trigger-recovery-task", {});
      await triggers.schedule({
        id: "trigger-recovery-1",
        taskId: "trigger-recovery-task",
        idempotencyKey: "trigger-recovery-task:complete",
        triggerAt: clock.now().toISOString(),
        payload: { value: 7 },
        trace: {
          schemaVersion: "1",
          runId: "run:trigger-recovery-task",
          correlationId: "correlation:trigger-recovery",
          actor: "RUNTIME",
        },
        createdAt: clock.now().toISOString(),
      });
      const firstLease = await triggers.leaseDue({
        workerId: "scheduler-crashed",
        now: clock.now().toISOString(),
        leaseDurationMs: 1_000,
      });
      assert.equal(firstLease?.deliveryAttempt, 1);
      clock.advance(1_001);
      const scheduler = new TriggerScheduler({
        queue: triggers,
        runtime,
        eventFactory: {
          createEvent(trigger) {
            return { type: "COMPLETED", value: trigger.payload.value } as const;
          },
        },
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
        maxDeliveryAttempts: 2,
      });

      const result = await scheduler.runOnce("scheduler-recovered");
      assert.equal(result.status, "DISPATCHED");
      assert.equal((await runtime.snapshot("trigger-recovery-task")).outcome, 7);
      assert.equal(await triggers.getStatus("trigger-recovery-1"), "DISPATCHED");
    });
  });

  probeTest("marks a trigger obsolete when its expected Task version is stale", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const triggers = new PostgresTriggerStore<{ value: number }>(database);
      await runtime.createTask("trigger-stale-task", {});
      await triggers.schedule({
        id: "trigger-stale-1",
        taskId: "trigger-stale-task",
        expectedTaskVersion: 0,
        idempotencyKey: "trigger-stale-task:complete",
        triggerAt: clock.now().toISOString(),
        payload: { value: 5 },
        trace: {
          schemaVersion: "1",
          runId: "run:trigger-stale-task",
          correlationId: "correlation:trigger-stale",
          actor: "RUNTIME",
        },
        createdAt: clock.now().toISOString(),
      });
      await runtime.dispatch({
        id: "trigger-stale-advance-task",
        taskId: "trigger-stale-task",
        event: { type: "TRIGGER_READ" },
        occurredAt: clock.now().toISOString(),
      });
      const scheduler = new TriggerScheduler({
        queue: triggers,
        runtime,
        eventFactory: {
          createEvent(trigger) {
            return { type: "COMPLETED", value: trigger.payload.value } as const;
          },
        },
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
        maxDeliveryAttempts: 2,
      });

      const result = await scheduler.runOnce("scheduler-stale");
      assert.equal(result.status, "OBSOLETE");
      assert.equal(await triggers.getStatus("trigger-stale-1"), "OBSOLETE");
      assert.equal((await runtime.listEvents("trigger-stale-task")).length, 1);
    });
  });

  probeTest("bounds a trigger mapping failure instead of retrying forever", async () => {
    await withDatabase(async ({ database, clock }) => {
      const runtime = createRuntime(database, clock);
      const triggers = new PostgresTriggerStore<{}>(database);
      await runtime.createTask("trigger-failure-task", {});
      await triggers.schedule({
        id: "trigger-failure-1",
        taskId: "trigger-failure-task",
        idempotencyKey: "trigger-failure-task:failure",
        triggerAt: clock.now().toISOString(),
        payload: {},
        trace: {
          schemaVersion: "1",
          runId: "run:trigger-failure-task",
          correlationId: "correlation:trigger-failure",
          actor: "RUNTIME",
        },
        createdAt: clock.now().toISOString(),
      });
      const scheduler = new TriggerScheduler<{}, TestEvent>({
        queue: triggers,
        runtime,
        eventFactory: {
          createEvent() {
            throw new Error("unsupported scheduled event");
          },
        },
        clock,
        leaseDurationMs: 1_000,
        retryDelayMs: 100,
        maxDeliveryAttempts: 1,
      });

      assert.deepEqual(await scheduler.runOnce("scheduler-failure"), {
        status: "MAPPING_FAILED",
        triggerId: "trigger-failure-1",
        retryStatus: "FAILED",
        error: "unsupported scheduled event",
      });
      assert.equal(await triggers.getStatus("trigger-failure-1"), "FAILED");
    });
  });
});
