import type {
  CommandEnvelope,
  CreateTaskOptions,
  DispatchResult,
  DomainCommand,
  DomainEvent,
  EventEnvelope,
  IdFactory,
  RecordedEventEnvelope,
  RuntimeClock,
  TaskDefinition,
  TaskLifecycleState,
  TaskSnapshot,
  TraceMetadata,
} from "../../core/task-runtime/contracts.js";
import {
  StaleTaskVersionError,
  TaskDefinitionVersionMismatchError,
} from "../../core/task-runtime/errors.js";
import {
  createCommandTrace,
  requireEventTrace,
} from "../../core/task-runtime/trace.js";
import type { SqlDatabase, SqlExecutor } from "./sql-database.js";

interface TaskRow {
  id: string;
  run_id: string;
  task_type: string;
  definition_version: string;
  lifecycle_state: TaskLifecycleState;
  domain_state_schema_version: string;
  domain_state: unknown;
  outcome: unknown | null;
  version: number;
  created_at: unknown;
  updated_at: unknown;
}

interface EventRow {
  id: string;
  task_id: string;
  task_version: number;
  payload: unknown;
  occurred_at: unknown;
  trace: unknown;
}

interface CommandRow {
  id: string;
  task_id: string;
  task_version: number;
  payload: unknown;
  issued_at: unknown;
  trace: unknown;
}

export interface PostgresTaskRuntimeOptions<State> {
  decodeState?: (input: unknown) => State;
}

function parseJson<Value>(value: unknown): Value {
  if (typeof value === "string") {
    return JSON.parse(value) as Value;
  }
  return structuredClone(value) as Value;
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

function stateSchemaVersion(state: unknown, fallback: string): string {
  if (
    typeof state === "object" &&
    state !== null &&
    "schemaVersion" in state &&
    typeof state.schemaVersion === "string"
  ) {
    return state.schemaVersion;
  }
  return fallback;
}

export class PostgresTaskRuntime<
  State,
  Event extends DomainEvent,
  Command extends DomainCommand,
  Outcome,
> {
  private readonly decodeState: (input: unknown) => State;

  constructor(
    private readonly database: SqlDatabase,
    private readonly definition: TaskDefinition<State, Event, Command, Outcome>,
    private readonly clock: RuntimeClock,
    private readonly createId: IdFactory,
    options: PostgresTaskRuntimeOptions<State> = {},
  ) {
    this.decodeState =
      options.decodeState ?? ((input) => structuredClone(input) as State);
  }

  async createTask(
    taskId: string,
    input: unknown,
    options: CreateTaskOptions = {},
  ): Promise<TaskSnapshot<State, Outcome>> {
    const now = this.clock.now().toISOString();
    const runId = options.runId ?? `run:${taskId}`;
    const state = this.definition.create(input, this.context(taskId, runId, now));
    const lifecycleState = this.definition.getLifecycleState(state);
    const outcome = this.definition.evaluateOutcome(state);

    await this.database.query(
      `INSERT INTO tasks (
        id, run_id, task_type, definition_version, lifecycle_state,
        domain_state_schema_version, domain_state, outcome, version, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, 0, $9, $9)`,
      [
        taskId,
        runId,
        this.definition.type,
        this.definition.version,
        lifecycleState,
        stateSchemaVersion(state, this.definition.version),
        JSON.stringify(state),
        outcome === null ? null : JSON.stringify(outcome),
        now,
      ],
    );

    return {
      id: taskId,
      runId,
      taskType: this.definition.type,
      definitionVersion: this.definition.version,
      lifecycleState,
      domainState: structuredClone(state),
      outcome: outcome === null ? null : structuredClone(outcome),
      version: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  dispatch(
    envelope: EventEnvelope<Event>,
    expectedVersion?: number,
  ): Promise<DispatchResult<State, Command, Outcome>> {
    return this.database.transaction(async (transaction) => {
      const task = await this.requireTask(transaction, envelope.taskId, true);
      this.assertCompatibleDefinition(task);

      const existingEvent = await transaction.query<{ id: string }>(
        "SELECT id FROM task_events WHERE id = $1 AND task_id = $2",
        [envelope.id, envelope.taskId],
      );
      if (existingEvent.rows.length > 0) {
        return {
          snapshot: this.rowToSnapshot(task),
          commands: [],
          duplicateEvent: true,
        };
      }

      if (expectedVersion !== undefined && expectedVersion !== task.version) {
        throw new StaleTaskVersionError(expectedVersion, task.version);
      }

      const state = this.decodeState(parseJson(task.domain_state));
      const trace = requireEventTrace(envelope, task.run_id);
      const result = this.definition.transition(
        state,
        envelope.event,
        this.context(envelope.taskId, task.run_id, envelope.occurredAt),
      );
      const nextVersion = task.version + 1;
      const lifecycleState = this.definition.getLifecycleState(result.state);
      const outcome = this.definition.evaluateOutcome(result.state);
      const commands: CommandEnvelope<Command>[] = result.commands.map((command) => ({
        id: this.createId("command"),
        taskId: envelope.taskId,
        taskVersion: nextVersion,
        command,
        issuedAt: envelope.occurredAt,
        trace: createCommandTrace(command, trace, envelope.id),
      }));

      await transaction.query(
        `INSERT INTO task_events (
          id, task_id, task_version, event_type, payload, occurred_at, trace
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb)`,
        [
          envelope.id,
          envelope.taskId,
          nextVersion,
          envelope.event.type,
          JSON.stringify(envelope.event),
          envelope.occurredAt,
          JSON.stringify(trace),
        ],
      );

      for (const command of commands) {
        await transaction.query(
          `INSERT INTO task_commands (
            id, task_id, task_version, command_type, category, idempotency_key,
            payload, issued_at, trace, status, available_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, 'PENDING', $8)`,
          [
            command.id,
            command.taskId,
            command.taskVersion,
            command.command.type,
            command.command.category,
            command.command.idempotencyKey,
            JSON.stringify(command.command),
            command.issuedAt,
            JSON.stringify(command.trace),
          ],
        );
      }

      const updated = await transaction.query(
        `UPDATE tasks
          SET lifecycle_state = $2,
              domain_state_schema_version = $3,
              domain_state = $4::jsonb,
              outcome = $5::jsonb,
              version = $6,
              updated_at = $7
          WHERE id = $1 AND version = $8`,
        [
          envelope.taskId,
          lifecycleState,
          stateSchemaVersion(result.state, this.definition.version),
          JSON.stringify(result.state),
          outcome === null ? null : JSON.stringify(outcome),
          nextVersion,
          envelope.occurredAt,
          task.version,
        ],
      );
      if (updated.affectedRows !== 1) {
        throw new StaleTaskVersionError(task.version, nextVersion);
      }

      return {
        snapshot: {
          id: task.id,
          runId: task.run_id,
          taskType: task.task_type,
          definitionVersion: task.definition_version,
          lifecycleState,
          domainState: structuredClone(result.state),
          outcome: outcome === null ? null : structuredClone(outcome),
          version: nextVersion,
          createdAt: toIsoString(task.created_at),
          updatedAt: envelope.occurredAt,
        },
        commands,
        duplicateEvent: false,
      };
    });
  }

  async snapshot(taskId: string): Promise<TaskSnapshot<State, Outcome>> {
    const task = await this.requireTask(this.database, taskId, false);
    this.assertCompatibleDefinition(task);
    return this.rowToSnapshot(task);
  }

  async listEvents(taskId: string): Promise<RecordedEventEnvelope<Event>[]> {
    const result = await this.database.query<EventRow>(
      `SELECT id, task_id, task_version, payload, occurred_at, trace
        FROM task_events
        WHERE task_id = $1
        ORDER BY task_version ASC`,
      [taskId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      event: parseJson<Event>(row.payload),
      occurredAt: toIsoString(row.occurred_at),
      trace: parseJson<TraceMetadata>(row.trace),
    }));
  }

  async listCommands(taskId: string): Promise<CommandEnvelope<Command>[]> {
    const result = await this.database.query<CommandRow>(
      `SELECT id, task_id, task_version, payload, issued_at, trace
        FROM task_commands
        WHERE task_id = $1
        ORDER BY task_version ASC, issued_at ASC, id ASC`,
      [taskId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      taskVersion: row.task_version,
      command: parseJson<Command>(row.payload),
      issuedAt: toIsoString(row.issued_at),
      trace: parseJson<CommandEnvelope<Command>["trace"]>(row.trace),
    }));
  }

  private context(taskId: string, runId: string, now: string) {
    return {
      taskId,
      runId,
      now,
      createId: this.createId,
    };
  }

  private async requireTask(
    executor: SqlExecutor,
    taskId: string,
    forUpdate: boolean,
  ): Promise<TaskRow> {
    const result = await executor.query<TaskRow>(
      `SELECT id, run_id, task_type, definition_version, lifecycle_state,
              domain_state_schema_version, domain_state, outcome, version,
              created_at, updated_at
        FROM tasks
        WHERE id = $1${forUpdate ? " FOR UPDATE" : ""}`,
      [taskId],
    );
    const task = result.rows[0];
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return task;
  }

  private assertCompatibleDefinition(task: TaskRow): void {
    if (task.task_type !== this.definition.type) {
      throw new Error(
        `Task type mismatch: stored ${task.task_type}, current ${this.definition.type}`,
      );
    }
    if (task.definition_version !== this.definition.version) {
      throw new TaskDefinitionVersionMismatchError(
        task.definition_version,
        this.definition.version,
      );
    }
  }

  private rowToSnapshot(task: TaskRow): TaskSnapshot<State, Outcome> {
    return {
      id: task.id,
      runId: task.run_id,
      taskType: task.task_type,
      definitionVersion: task.definition_version,
      lifecycleState: task.lifecycle_state,
      domainState: this.decodeState(parseJson(task.domain_state)),
      outcome: task.outcome === null ? null : parseJson<Outcome>(task.outcome),
      version: task.version,
      createdAt: toIsoString(task.created_at),
      updatedAt: toIsoString(task.updated_at),
    };
  }
}
