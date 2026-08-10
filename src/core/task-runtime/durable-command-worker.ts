import type {
  CommandEnvelope,
  DomainCommand,
  DomainEvent,
  EventEnvelope,
  RuntimeActor,
  RuntimeClock,
} from "./contracts.js";

export type OutboxCommandStatus =
  | "PENDING"
  | "LEASED"
  | "SUCCEEDED"
  | "RECOVERY_REQUIRED"
  | "RECOVERY_DISPATCHED";

export interface LeasedCommand<Command extends DomainCommand>
  extends CommandEnvelope<Command> {
  leaseOwner: string;
  leaseExpiresAt: string;
  deliveryAttempt: number;
}

export interface LeaseCommandInput {
  workerId: string;
  now: string;
  leaseDurationMs: number;
}

export interface RecoverExpiredLeasesResult {
  retried: number;
  recoveryRequired: number;
  reconciled: number;
}

export interface DurableCommandQueue<Command extends DomainCommand> {
  leaseNext(input: LeaseCommandInput): Promise<LeasedCommand<Command> | null>;
  complete(input: {
    commandId: string;
    workerId: string;
    completedAt: string;
  }): Promise<void>;
  fail(input: {
    command: LeasedCommand<Command>;
    workerId: string;
    failedAt: string;
    retryAt: string;
    error: string;
  }): Promise<void>;
  recoverExpiredLeases(now: string): Promise<RecoverExpiredLeasesResult>;
}

export interface AsyncTaskDispatcher<Event extends DomainEvent> {
  dispatch(envelope: EventEnvelope<Event>, expectedVersion?: number): Promise<unknown>;
}

export type CommandHandlerResult<Event extends DomainEvent> = {
  event: Event;
  actor: Exclude<RuntimeActor, "USER" | "RUNTIME">;
};

export type WorkerRunResult =
  | { status: "IDLE" }
  | { status: "SUCCEEDED"; commandId: string; eventId: string }
  | { status: "HANDLER_FAILED" | "DISPATCH_FAILED"; commandId: string; error: string }
  | { status: "COMPLETION_UNCERTAIN"; commandId: string; eventId: string; error: string };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class DurableCommandWorker<
  Command extends DomainCommand,
  Event extends DomainEvent,
> {
  constructor(
    private readonly options: {
      queue: DurableCommandQueue<Command>;
      runtime: AsyncTaskDispatcher<Event>;
      clock: RuntimeClock;
      leaseDurationMs: number;
      retryDelayMs: number;
    },
  ) {}

  async runOnce(
    workerId: string,
    handler: (
      command: LeasedCommand<Command>,
    ) => Promise<CommandHandlerResult<Event>>,
  ): Promise<WorkerRunResult> {
    const leased = await this.options.queue.leaseNext({
      workerId,
      now: this.options.clock.now().toISOString(),
      leaseDurationMs: this.options.leaseDurationMs,
    });
    if (!leased) {
      return { status: "IDLE" };
    }

    let handled: CommandHandlerResult<Event>;
    try {
      handled = await handler(leased);
    } catch (error) {
      const message = errorMessage(error);
      await this.fail(leased, workerId, message);
      return { status: "HANDLER_FAILED", commandId: leased.id, error: message };
    }

    const eventId = `event:command:${leased.id}`;
    const occurredAt = this.options.clock.now().toISOString();
    try {
      await this.options.runtime.dispatch(
        {
          id: eventId,
          taskId: leased.taskId,
          event: handled.event,
          occurredAt,
          trace: {
            schemaVersion: "1",
            runId: leased.trace.runId,
            ...(leased.trace.attemptId ? { attemptId: leased.trace.attemptId } : {}),
            correlationId: leased.trace.correlationId,
            causationId: leased.id,
            actor: handled.actor,
          },
        },
        leased.taskVersion,
      );
    } catch (error) {
      const message = errorMessage(error);
      await this.fail(leased, workerId, message);
      return { status: "DISPATCH_FAILED", commandId: leased.id, error: message };
    }

    try {
      await this.options.queue.complete({
        commandId: leased.id,
        workerId,
        completedAt: this.options.clock.now().toISOString(),
      });
    } catch (error) {
      return {
        status: "COMPLETION_UNCERTAIN",
        commandId: leased.id,
        eventId,
        error: errorMessage(error),
      };
    }

    return { status: "SUCCEEDED", commandId: leased.id, eventId };
  }

  private fail(
    command: LeasedCommand<Command>,
    workerId: string,
    error: string,
  ): Promise<void> {
    const failedAt = this.options.clock.now();
    return this.options.queue.fail({
      command,
      workerId,
      failedAt: failedAt.toISOString(),
      retryAt: new Date(failedAt.valueOf() + this.options.retryDelayMs).toISOString(),
      error,
    });
  }
}
