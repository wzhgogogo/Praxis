import type { TraceMetadata } from "../../core/task-runtime/contracts.js";
import type {
  LeasedTrigger,
  PersistentTriggerQueue,
  ScheduledTrigger,
  TriggerFailureResult,
  TriggerStatus,
} from "../../core/task-runtime/trigger-scheduler.js";
import type { SqlDatabase } from "./sql-database.js";

interface TriggerRow {
  id: string;
  task_id: string;
  expected_task_version: number | null;
  idempotency_key: string;
  trigger_at: unknown;
  payload: unknown;
  trace: unknown;
  created_at: unknown;
  lease_owner: string | null;
  lease_expires_at: unknown | null;
  delivery_attempts: number;
  status: TriggerStatus;
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

function requireDuration(milliseconds: number): void {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    throw new Error("Trigger lease duration must be greater than zero");
  }
}

function fromRow<Payload>(row: TriggerRow): ScheduledTrigger<Payload> {
  return {
    id: row.id,
    taskId: row.task_id,
    ...(row.expected_task_version === null
      ? {}
      : { expectedTaskVersion: row.expected_task_version }),
    idempotencyKey: row.idempotency_key,
    triggerAt: toIsoString(row.trigger_at),
    payload: parseJson<Payload>(row.payload),
    trace: parseJson<TraceMetadata>(row.trace),
    createdAt: toIsoString(row.created_at),
  };
}

export class PostgresTriggerStore<Payload = unknown>
  implements PersistentTriggerQueue<Payload>
{
  constructor(private readonly database: SqlDatabase) {}

  async schedule(input: ScheduledTrigger<Payload>): Promise<ScheduledTrigger<Payload>> {
    const existing = await this.database.query<TriggerRow>(
      `SELECT id, task_id, expected_task_version, idempotency_key, trigger_at,
              payload, trace, created_at, lease_owner, lease_expires_at,
              delivery_attempts, status
         FROM task_triggers
        WHERE task_id = $1 AND idempotency_key = $2`,
      [input.taskId, input.idempotencyKey],
    );
    if (existing.rows[0]) {
      return fromRow(existing.rows[0]);
    }
    await this.database.query(
      `INSERT INTO task_triggers (
        id, task_id, expected_task_version, idempotency_key,
        trigger_at, payload, trace, status, available_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, 'PENDING', $5, $8)`,
      [
        input.id,
        input.taskId,
        input.expectedTaskVersion ?? null,
        input.idempotencyKey,
        input.triggerAt,
        JSON.stringify(input.payload),
        JSON.stringify(input.trace),
        input.createdAt,
      ],
    );
    return structuredClone(input);
  }

  async leaseDue(input: {
    workerId: string;
    now: string;
    leaseDurationMs: number;
  }): Promise<LeasedTrigger<Payload> | null> {
    requireDuration(input.leaseDurationMs);
    const leaseExpiresAt = new Date(
      Date.parse(input.now) + input.leaseDurationMs,
    ).toISOString();
    const result = await this.database.query<TriggerRow>(
      `WITH candidate AS (
        SELECT id
          FROM task_triggers
         WHERE status = 'PENDING'
           AND trigger_at <= $1
           AND available_at <= $1
         ORDER BY trigger_at ASC, created_at ASC, id ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1
      )
      UPDATE task_triggers AS trigger
         SET status = 'LEASED',
             lease_owner = $2,
             lease_expires_at = $3,
             delivery_attempts = delivery_attempts + 1
        FROM candidate
       WHERE trigger.id = candidate.id
      RETURNING trigger.id, trigger.task_id, trigger.expected_task_version,
                trigger.idempotency_key, trigger.trigger_at, trigger.payload,
                trigger.trace, trigger.created_at, trigger.lease_owner,
                trigger.lease_expires_at, trigger.delivery_attempts, trigger.status`,
      [input.now, input.workerId, leaseExpiresAt],
    );
    const row = result.rows[0];
    if (!row || !row.lease_owner || !row.lease_expires_at) {
      return null;
    }
    return {
      ...fromRow<Payload>(row),
      leaseOwner: row.lease_owner,
      leaseExpiresAt: toIsoString(row.lease_expires_at),
      deliveryAttempt: row.delivery_attempts,
    };
  }

  async complete(input: {
    triggerId: string;
    workerId: string;
    completedAt: string;
  }): Promise<void> {
    const result = await this.database.query(
      `UPDATE task_triggers
          SET status = 'DISPATCHED', dispatched_at = $3,
              lease_owner = NULL, lease_expires_at = NULL, last_error = NULL
        WHERE id = $1 AND status = 'LEASED' AND lease_owner = $2`,
      [input.triggerId, input.workerId, input.completedAt],
    );
    if (result.affectedRows !== 1) {
      throw new Error(`Trigger lease is no longer owned by ${input.workerId}: ${input.triggerId}`);
    }
  }

  async fail(input: {
    trigger: LeasedTrigger<Payload>;
    workerId: string;
    retryAt: string;
    error: string;
    maxDeliveryAttempts: number;
  }): Promise<TriggerFailureResult> {
    const finalFailure = input.trigger.deliveryAttempt >= input.maxDeliveryAttempts;
    const result = await this.database.query(
      finalFailure
        ? `UPDATE task_triggers
            SET status = 'FAILED', dispatched_at = $3, last_error = $4,
                lease_owner = NULL, lease_expires_at = NULL
          WHERE id = $1 AND status = 'LEASED' AND lease_owner = $2`
        : `UPDATE task_triggers
            SET status = 'PENDING', available_at = $3, last_error = $4,
                lease_owner = NULL, lease_expires_at = NULL
          WHERE id = $1 AND status = 'LEASED' AND lease_owner = $2`,
      [input.trigger.id, input.workerId, input.retryAt, input.error.slice(0, 2_000)],
    );
    if (result.affectedRows !== 1) {
      throw new Error(
        `Trigger failure could not be recorded for ${input.workerId}: ${input.trigger.id}`,
      );
    }
    return { status: finalFailure ? "FAILED" : "PENDING" };
  }

  async markObsolete(input: {
    triggerId: string;
    workerId: string;
    completedAt: string;
    reason: string;
  }): Promise<void> {
    const result = await this.database.query(
      `UPDATE task_triggers
          SET status = 'OBSOLETE', dispatched_at = $3, last_error = $4,
              lease_owner = NULL, lease_expires_at = NULL
        WHERE id = $1 AND status = 'LEASED' AND lease_owner = $2`,
      [input.triggerId, input.workerId, input.completedAt, input.reason.slice(0, 2_000)],
    );
    if (result.affectedRows !== 1) {
      throw new Error(
        `Trigger obsolete result could not be recorded for ${input.workerId}: ${input.triggerId}`,
      );
    }
  }

  async recoverExpiredLeases(now: string): Promise<number> {
    const result = await this.database.query(
      `UPDATE task_triggers
          SET status = 'PENDING', available_at = $1,
              lease_owner = NULL, lease_expires_at = NULL,
              last_error = 'Scheduler lease expired before completion'
        WHERE status = 'LEASED' AND lease_expires_at <= $1`,
      [now],
    );
    return result.affectedRows;
  }

  async getStatus(triggerId: string): Promise<TriggerStatus | null> {
    const result = await this.database.query<{ status: TriggerStatus }>(
      "SELECT status FROM task_triggers WHERE id = $1",
      [triggerId],
    );
    return result.rows[0]?.status ?? null;
  }
}
