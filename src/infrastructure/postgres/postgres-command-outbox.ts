import type {
  DurableCommandQueue,
  LeaseCommandInput,
  LeasedCommand,
  OutboxCommandStatus,
  RecoverExpiredLeasesResult,
} from "../../core/task-runtime/durable-command-worker.js";
import type {
  RecoveryCommandQueue,
  RecoveryRequiredCommand,
} from "../../core/task-runtime/recovery-coordinator.js";
import type {
  CommandEnvelope,
  CommandTraceMetadata,
  DomainCommand,
} from "../../core/task-runtime/contracts.js";
import type { SqlDatabase } from "./sql-database.js";

interface CommandRow {
  id: string;
  task_id: string;
  task_version: number;
  payload: unknown;
  issued_at: unknown;
  trace: unknown;
  lease_owner: string;
  lease_expires_at: unknown;
  delivery_attempts: number;
  last_error?: string | null;
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
    throw new Error("Command lease duration must be greater than zero");
  }
}

export class PostgresCommandOutbox<Command extends DomainCommand>
  implements DurableCommandQueue<Command>, RecoveryCommandQueue<Command>
{
  constructor(private readonly database: SqlDatabase) {}

  async leaseNext(input: LeaseCommandInput): Promise<LeasedCommand<Command> | null> {
    requireDuration(input.leaseDurationMs);
    const leaseExpiresAt = new Date(
      Date.parse(input.now) + input.leaseDurationMs,
    ).toISOString();
    const result = await this.database.query<CommandRow>(
      `WITH candidate AS (
        SELECT id
        FROM task_commands
        WHERE status = 'PENDING' AND available_at <= $1
        ORDER BY available_at ASC, issued_at ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE task_commands AS command
      SET status = 'LEASED',
          lease_owner = $2,
          lease_expires_at = $3,
          delivery_attempts = delivery_attempts + 1
      FROM candidate
      WHERE command.id = candidate.id
      RETURNING command.id, command.task_id, command.task_version, command.payload,
                command.issued_at, command.trace, command.lease_owner,
                command.lease_expires_at, command.delivery_attempts`,
      [input.now, input.workerId, leaseExpiresAt],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      taskId: row.task_id,
      taskVersion: row.task_version,
      command: parseJson<Command>(row.payload),
      issuedAt: toIsoString(row.issued_at),
      trace: parseJson<CommandTraceMetadata>(row.trace),
      leaseOwner: row.lease_owner,
      leaseExpiresAt: toIsoString(row.lease_expires_at),
      deliveryAttempt: row.delivery_attempts,
    };
  }

  async complete(input: {
    commandId: string;
    workerId: string;
    completedAt: string;
  }): Promise<void> {
    const result = await this.database.query(
      `UPDATE task_commands
        SET status = 'SUCCEEDED', completed_at = $3,
            lease_owner = NULL, lease_expires_at = NULL, last_error = NULL
        WHERE id = $1 AND status = 'LEASED' AND lease_owner = $2`,
      [input.commandId, input.workerId, input.completedAt],
    );
    if (result.affectedRows !== 1) {
      throw new Error(`Command lease is no longer owned by ${input.workerId}: ${input.commandId}`);
    }
  }

  async fail(input: {
    command: LeasedCommand<Command>;
    workerId: string;
    failedAt: string;
    retryAt: string;
    error: string;
  }): Promise<void> {
    const externalWrite = input.command.command.category === "EXTERNAL_WRITE";
    const result = await this.database.query(
      externalWrite
        ? `UPDATE task_commands
            SET status = 'RECOVERY_REQUIRED', last_error = $3,
                lease_owner = NULL, lease_expires_at = NULL
            WHERE id = $1 AND status = 'LEASED' AND lease_owner = $2`
        : `UPDATE task_commands
            SET status = 'PENDING', available_at = $4, last_error = $3,
                lease_owner = NULL, lease_expires_at = NULL
            WHERE id = $1 AND status = 'LEASED' AND lease_owner = $2`,
      externalWrite
        ? [input.command.id, input.workerId, input.error.slice(0, 2_000)]
        : [input.command.id, input.workerId, input.error.slice(0, 2_000), input.retryAt],
    );
    if (result.affectedRows !== 1) {
      throw new Error(
        `Command failure could not be recorded for ${input.workerId}: ${input.command.id}`,
      );
    }
  }

  recoverExpiredLeases(now: string): Promise<RecoverExpiredLeasesResult> {
    return this.database.transaction(async (transaction) => {
      const reconciled = await transaction.query(
        `UPDATE task_commands AS command
          SET status = 'SUCCEEDED', completed_at = $1,
              lease_owner = NULL, lease_expires_at = NULL, last_error = NULL
          WHERE command.status IN ('LEASED', 'RECOVERY_REQUIRED')
            AND command.category = 'EXTERNAL_WRITE'
            AND EXISTS (
              SELECT 1 FROM task_events AS event
              WHERE event.id = 'event:command:' || command.id
            )`,
        [now],
      );
      const recoveryRequired = await transaction.query(
        `UPDATE task_commands AS command
          SET status = 'RECOVERY_REQUIRED',
              last_error = 'External write lease expired without a persisted result event',
              lease_owner = NULL, lease_expires_at = NULL
          WHERE command.status = 'LEASED'
            AND command.category = 'EXTERNAL_WRITE'
            AND command.lease_expires_at <= $1
            AND NOT EXISTS (
              SELECT 1 FROM task_events AS event
              WHERE event.id = 'event:command:' || command.id
            )`,
        [now],
      );
      const retried = await transaction.query(
        `UPDATE task_commands
          SET status = 'PENDING', available_at = $1,
              lease_owner = NULL, lease_expires_at = NULL,
              last_error = 'Worker lease expired before completion'
          WHERE status = 'LEASED'
            AND category <> 'EXTERNAL_WRITE'
            AND lease_expires_at <= $1`,
        [now],
      );
      return {
        retried: retried.affectedRows,
        recoveryRequired: recoveryRequired.affectedRows,
        reconciled: reconciled.affectedRows,
      };
    });
  }

  async claimNextRecovery(input: {
    workerId: string;
    now: string;
    leaseDurationMs: number;
  }): Promise<RecoveryRequiredCommand<Command> | null> {
    requireDuration(input.leaseDurationMs);
    const leaseExpiresAt = new Date(
      Date.parse(input.now) + input.leaseDurationMs,
    ).toISOString();
    const result = await this.database.query<CommandRow>(
      `WITH candidate AS (
        SELECT id
        FROM task_commands
        WHERE status = 'RECOVERY_REQUIRED'
          AND category = 'EXTERNAL_WRITE'
          AND available_at <= $1
          AND (lease_expires_at IS NULL OR lease_expires_at <= $1)
        ORDER BY available_at ASC, issued_at ASC, id ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE task_commands AS command
      SET lease_owner = $2, lease_expires_at = $3
      FROM candidate
      WHERE command.id = candidate.id
      RETURNING command.id, command.task_id, command.task_version, command.payload,
                command.issued_at, command.trace, command.lease_owner,
                command.lease_expires_at, command.delivery_attempts,
                command.last_error`,
      [input.now, input.workerId, leaseExpiresAt],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      taskId: row.task_id,
      taskVersion: row.task_version,
      command: parseJson<Command>(row.payload),
      issuedAt: toIsoString(row.issued_at),
      trace: parseJson<CommandTraceMetadata>(row.trace),
      recoveryReason: row.last_error ?? "External write outcome requires recovery",
      deliveryAttempt: row.delivery_attempts,
      recoveryLeaseOwner: row.lease_owner,
      recoveryLeaseExpiresAt: toIsoString(row.lease_expires_at),
    };
  }

  async completeRecovery(input: {
    commandId: string;
    workerId: string;
    completedAt: string;
  }): Promise<void> {
    const result = await this.database.query(
      `UPDATE task_commands
        SET status = 'RECOVERY_DISPATCHED', completed_at = $3,
            lease_owner = NULL, lease_expires_at = NULL
        WHERE id = $1 AND status = 'RECOVERY_REQUIRED' AND lease_owner = $2`,
      [input.commandId, input.workerId, input.completedAt],
    );
    if (result.affectedRows !== 1) {
      throw new Error(
        `Recovery lease is no longer owned by ${input.workerId}: ${input.commandId}`,
      );
    }
  }

  async failRecovery(input: {
    commandId: string;
    workerId: string;
    retryAt: string;
    error: string;
  }): Promise<void> {
    const result = await this.database.query(
      `UPDATE task_commands
        SET available_at = $3,
            lease_owner = NULL,
            lease_expires_at = NULL,
            last_error = LEFT(
              COALESCE(last_error, '') || ' | Recovery dispatch failed: ' || $4,
              2000
            )
        WHERE id = $1 AND status = 'RECOVERY_REQUIRED' AND lease_owner = $2`,
      [input.commandId, input.workerId, input.retryAt, input.error],
    );
    if (result.affectedRows !== 1) {
      throw new Error(
        `Recovery failure could not be recorded for ${input.workerId}: ${input.commandId}`,
      );
    }
  }

  async getStatus(commandId: string): Promise<OutboxCommandStatus | null> {
    const result = await this.database.query<{ status: OutboxCommandStatus }>(
      "SELECT status FROM task_commands WHERE id = $1",
      [commandId],
    );
    return result.rows[0]?.status ?? null;
  }

  async getEnvelope(commandId: string): Promise<CommandEnvelope<Command> | null> {
    const result = await this.database.query<CommandRow>(
      `SELECT id, task_id, task_version, payload, issued_at, trace,
              COALESCE(lease_owner, '') AS lease_owner,
              COALESCE(lease_expires_at, issued_at) AS lease_expires_at,
              delivery_attempts
        FROM task_commands WHERE id = $1`,
      [commandId],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      taskId: row.task_id,
      taskVersion: row.task_version,
      command: parseJson<Command>(row.payload),
      issuedAt: toIsoString(row.issued_at),
      trace: parseJson<CommandTraceMetadata>(row.trace),
    };
  }
}
