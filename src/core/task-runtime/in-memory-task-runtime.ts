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
  TaskSnapshot,
} from "./contracts.js";
import { StaleTaskVersionError } from "./errors.js";
import { createCommandTrace, requireEventTrace } from "./trace.js";

type StoredTask<State> = {
  id: string;
  runId: string;
  state: State;
  version: number;
  createdAt: string;
  updatedAt: string;
  processedEventIds: Set<string>;
};

export class InMemoryTaskRuntime<
  State,
  Event extends DomainEvent,
  Command extends DomainCommand,
  Outcome,
> {
  readonly eventLog: RecordedEventEnvelope<Event>[] = [];
  readonly commandLog: CommandEnvelope<Command>[] = [];

  private readonly tasks = new Map<string, StoredTask<State>>();

  constructor(
    private readonly definition: TaskDefinition<State, Event, Command, Outcome>,
    private readonly clock: RuntimeClock,
    private readonly createId: IdFactory,
  ) {}

  createTask(
    taskId: string,
    input: unknown,
    options: CreateTaskOptions = {},
  ): TaskSnapshot<State, Outcome> {
    if (this.tasks.has(taskId)) {
      throw new Error(`Task already exists: ${taskId}`);
    }

    const now = this.clock.now().toISOString();
    const runId = options.runId ?? `run:${taskId}`;
    const state = this.definition.create(input, this.context(taskId, runId, now));
    this.tasks.set(taskId, {
      id: taskId,
      runId,
      state,
      version: 0,
      createdAt: now,
      updatedAt: now,
      processedEventIds: new Set(),
    });

    return this.snapshot(taskId);
  }

  dispatch(
    envelope: EventEnvelope<Event>,
    expectedVersion?: number,
  ): DispatchResult<State, Command, Outcome> {
    const stored = this.requireTask(envelope.taskId);

    if (stored.processedEventIds.has(envelope.id)) {
      return {
        snapshot: this.snapshot(envelope.taskId),
        commands: [],
        duplicateEvent: true,
      };
    }

    if (expectedVersion !== undefined && expectedVersion !== stored.version) {
      throw new StaleTaskVersionError(expectedVersion, stored.version);
    }

    const result = this.definition.transition(
      stored.state,
      envelope.event,
      this.context(envelope.taskId, stored.runId, envelope.occurredAt),
    );
    const trace = requireEventTrace(envelope, stored.runId);
    const nextVersion = stored.version + 1;
    const commands = result.commands.map((command) => ({
      id: this.createId("command"),
      taskId: envelope.taskId,
      taskVersion: nextVersion,
      command,
      issuedAt: envelope.occurredAt,
      trace: createCommandTrace(command, trace, envelope.id),
    }));

    stored.state = result.state;
    stored.version = nextVersion;
    stored.updatedAt = envelope.occurredAt;
    stored.processedEventIds.add(envelope.id);
    this.eventLog.push({ ...envelope, trace });
    this.commandLog.push(...commands);

    return {
      snapshot: this.snapshot(envelope.taskId),
      commands,
      duplicateEvent: false,
    };
  }

  snapshot(taskId: string): TaskSnapshot<State, Outcome> {
    const stored = this.requireTask(taskId);
    return {
      id: stored.id,
      runId: stored.runId,
      taskType: this.definition.type,
      definitionVersion: this.definition.version,
      lifecycleState: this.definition.getLifecycleState(stored.state),
      domainState: structuredClone(stored.state),
      outcome: this.definition.evaluateOutcome(stored.state),
      version: stored.version,
      createdAt: stored.createdAt,
      updatedAt: stored.updatedAt,
    };
  }

  private context(taskId: string, runId: string, now: string) {
    return {
      taskId,
      runId,
      now,
      createId: this.createId,
    };
  }

  private requireTask(taskId: string): StoredTask<State> {
    const stored = this.tasks.get(taskId);
    if (!stored) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return stored;
  }
}
