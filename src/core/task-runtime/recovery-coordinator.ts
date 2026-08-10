import type {
  CommandEnvelope,
  DomainCommand,
  DomainEvent,
  EventEnvelope,
  RuntimeClock,
} from "./contracts.js";

export interface RecoveryRequiredCommand<Command extends DomainCommand>
  extends CommandEnvelope<Command> {
  recoveryReason: string;
  deliveryAttempt: number;
  recoveryLeaseOwner: string;
  recoveryLeaseExpiresAt: string;
}

export interface RecoveryCommandQueue<Command extends DomainCommand> {
  claimNextRecovery(input: {
    workerId: string;
    now: string;
    leaseDurationMs: number;
  }): Promise<RecoveryRequiredCommand<Command> | null>;
  completeRecovery(input: {
    commandId: string;
    workerId: string;
    completedAt: string;
  }): Promise<void>;
  failRecovery(input: {
    commandId: string;
    workerId: string;
    retryAt: string;
    error: string;
  }): Promise<void>;
}

export interface RecoveryTaskDispatcher<Event extends DomainEvent> {
  dispatch(envelope: EventEnvelope<Event>, expectedVersion?: number): Promise<unknown>;
}

export interface RecoveryEventFactory<
  Command extends DomainCommand,
  Event extends DomainEvent,
> {
  createRecoveryEvent(
    command: RecoveryRequiredCommand<Command>,
    detectedAt: string,
  ): Event;
}

export type RecoveryRunResult =
  | { status: "IDLE" }
  | { status: "DISPATCHED"; commandId: string; eventId: string }
  | {
      status: "MAPPING_FAILED" | "DISPATCH_FAILED";
      commandId: string;
      error: string;
    }
  | {
      status: "COMPLETION_UNCERTAIN";
      commandId: string;
      eventId: string;
      error: string;
    };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function requirePositiveDuration(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero`);
  }
}

export class RecoveryCoordinator<
  Command extends DomainCommand,
  Event extends DomainEvent,
> {
  constructor(
    private readonly options: {
      queue: RecoveryCommandQueue<Command>;
      runtime: RecoveryTaskDispatcher<Event>;
      eventFactory: RecoveryEventFactory<Command, Event>;
      clock: RuntimeClock;
      leaseDurationMs: number;
      retryDelayMs: number;
    },
  ) {
    requirePositiveDuration(options.leaseDurationMs, "Recovery lease duration");
    requirePositiveDuration(options.retryDelayMs, "Recovery retry delay");
  }

  async runOnce(workerId: string): Promise<RecoveryRunResult> {
    const claimed = await this.options.queue.claimNextRecovery({
      workerId,
      now: this.options.clock.now().toISOString(),
      leaseDurationMs: this.options.leaseDurationMs,
    });
    if (!claimed) {
      return { status: "IDLE" };
    }

    let event: Event;
    const detectedAt = this.options.clock.now().toISOString();
    try {
      event = this.options.eventFactory.createRecoveryEvent(claimed, detectedAt);
    } catch (error) {
      const message = errorMessage(error);
      await this.release(claimed, workerId, message);
      return { status: "MAPPING_FAILED", commandId: claimed.id, error: message };
    }

    const eventId = `event:recovery:${claimed.id}`;
    try {
      await this.options.runtime.dispatch(
        {
          id: eventId,
          taskId: claimed.taskId,
          event,
          occurredAt: detectedAt,
          trace: {
            schemaVersion: "1",
            runId: claimed.trace.runId,
            ...(claimed.trace.attemptId
              ? { attemptId: claimed.trace.attemptId }
              : {}),
            correlationId: claimed.trace.correlationId,
            causationId: claimed.id,
            actor: "SYSTEM",
          },
        },
        claimed.taskVersion,
      );
    } catch (error) {
      const message = errorMessage(error);
      await this.release(claimed, workerId, message);
      return { status: "DISPATCH_FAILED", commandId: claimed.id, error: message };
    }

    try {
      await this.options.queue.completeRecovery({
        commandId: claimed.id,
        workerId,
        completedAt: this.options.clock.now().toISOString(),
      });
    } catch (error) {
      return {
        status: "COMPLETION_UNCERTAIN",
        commandId: claimed.id,
        eventId,
        error: errorMessage(error),
      };
    }

    return { status: "DISPATCHED", commandId: claimed.id, eventId };
  }

  private release(
    command: RecoveryRequiredCommand<Command>,
    workerId: string,
    error: string,
  ): Promise<void> {
    const now = this.options.clock.now();
    return this.options.queue.failRecovery({
      commandId: command.id,
      workerId,
      retryAt: new Date(now.valueOf() + this.options.retryDelayMs).toISOString(),
      error,
    });
  }
}
