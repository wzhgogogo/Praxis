import { StaleTaskVersionError } from "./errors.js";
import type {
  DomainEvent,
  EventEnvelope,
  RuntimeClock,
  TraceMetadata,
} from "./contracts.js";

export type TriggerStatus =
  | "PENDING"
  | "LEASED"
  | "DISPATCHED"
  | "OBSOLETE"
  | "FAILED";

export interface ScheduledTrigger<Payload = unknown> {
  id: string;
  taskId: string;
  expectedTaskVersion?: number;
  idempotencyKey: string;
  triggerAt: string;
  payload: Payload;
  trace: TraceMetadata;
  createdAt: string;
}

export interface LeasedTrigger<Payload = unknown> extends ScheduledTrigger<Payload> {
  leaseOwner: string;
  leaseExpiresAt: string;
  deliveryAttempt: number;
}

export interface TriggerFailureResult {
  status: "PENDING" | "FAILED";
}

export interface PersistentTriggerQueue<Payload = unknown> {
  leaseDue(input: {
    workerId: string;
    now: string;
    leaseDurationMs: number;
  }): Promise<LeasedTrigger<Payload> | null>;
  complete(input: {
    triggerId: string;
    workerId: string;
    completedAt: string;
  }): Promise<void>;
  fail(input: {
    trigger: LeasedTrigger<Payload>;
    workerId: string;
    retryAt: string;
    error: string;
    maxDeliveryAttempts: number;
  }): Promise<TriggerFailureResult>;
  markObsolete(input: {
    triggerId: string;
    workerId: string;
    completedAt: string;
    reason: string;
  }): Promise<void>;
  recoverExpiredLeases(now: string): Promise<number>;
}

export interface TriggerTaskDispatcher<Event extends DomainEvent> {
  dispatch(envelope: EventEnvelope<Event>, expectedVersion?: number): Promise<unknown>;
}

export interface TriggerEventFactory<Payload, Event extends DomainEvent> {
  createEvent(trigger: LeasedTrigger<Payload>, firedAt: string): Event;
}

export type TriggerRunResult =
  | { status: "IDLE" }
  | { status: "DISPATCHED"; triggerId: string; eventId: string }
  | { status: "OBSOLETE"; triggerId: string; reason: string }
  | {
      status: "MAPPING_FAILED" | "DISPATCH_FAILED";
      triggerId: string;
      retryStatus: "PENDING" | "FAILED";
      error: string;
    }
  | {
      status: "COMPLETION_UNCERTAIN";
      triggerId: string;
      eventId: string;
      error: string;
    };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requirePositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function requirePositiveDuration(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
}

export class TriggerScheduler<Payload, Event extends DomainEvent> {
  constructor(
    private readonly options: {
      queue: PersistentTriggerQueue<Payload>;
      runtime: TriggerTaskDispatcher<Event>;
      eventFactory: TriggerEventFactory<Payload, Event>;
      clock: RuntimeClock;
      leaseDurationMs: number;
      retryDelayMs: number;
      maxDeliveryAttempts: number;
    },
  ) {
    requirePositiveDuration(options.leaseDurationMs, "Trigger lease duration");
    requirePositiveDuration(options.retryDelayMs, "Trigger retry delay");
    requirePositiveInteger(options.maxDeliveryAttempts, "Trigger max delivery attempts");
  }

  async runOnce(workerId: string): Promise<TriggerRunResult> {
    const now = this.options.clock.now().toISOString();
    await this.options.queue.recoverExpiredLeases(now);
    const leased = await this.options.queue.leaseDue({
      workerId,
      now,
      leaseDurationMs: this.options.leaseDurationMs,
    });
    if (!leased) {
      return { status: "IDLE" };
    }

    const firedAt = this.options.clock.now().toISOString();
    let event: Event;
    try {
      event = this.options.eventFactory.createEvent(leased, firedAt);
    } catch (error) {
      return this.fail(leased, workerId, "MAPPING_FAILED", errorMessage(error));
    }

    const eventId = `event:trigger:${leased.id}`;
    try {
      await this.options.runtime.dispatch(
        {
          id: eventId,
          taskId: leased.taskId,
          event,
          occurredAt: firedAt,
          trace: {
            schemaVersion: "1",
            runId: leased.trace.runId,
            ...(leased.trace.attemptId ? { attemptId: leased.trace.attemptId } : {}),
            correlationId: leased.trace.correlationId,
            causationId: leased.id,
            actor: "SYSTEM",
          },
        },
        leased.expectedTaskVersion,
      );
    } catch (error) {
      if (error instanceof StaleTaskVersionError) {
        const reason = errorMessage(error);
        await this.options.queue.markObsolete({
          triggerId: leased.id,
          workerId,
          completedAt: this.options.clock.now().toISOString(),
          reason,
        });
        return { status: "OBSOLETE", triggerId: leased.id, reason };
      }
      return this.fail(leased, workerId, "DISPATCH_FAILED", errorMessage(error));
    }

    try {
      await this.options.queue.complete({
        triggerId: leased.id,
        workerId,
        completedAt: this.options.clock.now().toISOString(),
      });
    } catch (error) {
      return {
        status: "COMPLETION_UNCERTAIN",
        triggerId: leased.id,
        eventId,
        error: errorMessage(error),
      };
    }
    return { status: "DISPATCHED", triggerId: leased.id, eventId };
  }

  private async fail(
    trigger: LeasedTrigger<Payload>,
    workerId: string,
    status: "MAPPING_FAILED" | "DISPATCH_FAILED",
    error: string,
  ): Promise<TriggerRunResult> {
    const now = this.options.clock.now();
    const failure = await this.options.queue.fail({
      trigger,
      workerId,
      retryAt: new Date(now.valueOf() + this.options.retryDelayMs).toISOString(),
      error,
      maxDeliveryAttempts: this.options.maxDeliveryAttempts,
    });
    return { status, triggerId: trigger.id, retryStatus: failure.status, error };
  }
}
