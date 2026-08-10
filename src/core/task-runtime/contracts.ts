export type TaskLifecycleState =
  | "CREATED"
  | "READY"
  | "RUNNING"
  | "WAITING_USER"
  | "WAITING_TIME"
  | "WAITING_EXTERNAL"
  | "NEEDS_ATTENTION"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED";

export type CommandCategory =
  | "READ"
  | "PREPARE"
  | "POLICY"
  | "EXTERNAL_WRITE"
  | "VERIFY"
  | "WAIT";

export interface DomainEvent {
  type: string;
}

export interface DomainCommand {
  type: string;
  category: CommandCategory;
  idempotencyKey: string;
  attemptId?: string;
}

export type RuntimeActor =
  | "USER"
  | "RUNTIME"
  | "MODEL"
  | "POLICY"
  | "ADAPTER"
  | "SYSTEM";

export interface TraceMetadata {
  schemaVersion: "1";
  runId: string;
  attemptId?: string;
  correlationId: string;
  causationId?: string;
  actor: RuntimeActor;
}

export interface CommandTraceMetadata extends TraceMetadata {
  causationId: string;
  actor: "RUNTIME";
}

export interface TaskContext {
  taskId: string;
  runId: string;
  now: string;
  createId(prefix: string): string;
}

export interface TransitionResult<State, Command extends DomainCommand> {
  state: State;
  commands: Command[];
}

export interface TaskDefinition<
  State,
  Event extends DomainEvent,
  Command extends DomainCommand,
  Outcome,
> {
  type: string;
  version: string;
  create(input: unknown, context: TaskContext): State;
  transition(
    state: Readonly<State>,
    event: Readonly<Event>,
    context: TaskContext,
  ): TransitionResult<State, Command>;
  getLifecycleState(state: Readonly<State>): TaskLifecycleState;
  evaluateOutcome(state: Readonly<State>): Outcome | null;
}

export interface EventEnvelope<Event extends DomainEvent> {
  id: string;
  taskId: string;
  event: Event;
  occurredAt: string;
  trace: TraceMetadata;
}

export interface RecordedEventEnvelope<Event extends DomainEvent>
  extends Omit<EventEnvelope<Event>, "trace"> {
  trace: TraceMetadata;
}

export interface CommandEnvelope<Command extends DomainCommand> {
  id: string;
  taskId: string;
  taskVersion: number;
  command: Command;
  issuedAt: string;
  trace: CommandTraceMetadata;
}

export interface TaskSnapshot<State, Outcome> {
  id: string;
  runId: string;
  taskType: string;
  definitionVersion: string;
  lifecycleState: TaskLifecycleState;
  domainState: State;
  outcome: Outcome | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchResult<State, Command extends DomainCommand, Outcome> {
  snapshot: TaskSnapshot<State, Outcome>;
  commands: CommandEnvelope<Command>[];
  duplicateEvent: boolean;
}

export interface RuntimeClock {
  now(): Date;
}

export type IdFactory = (prefix: string) => string;

export interface CreateTaskOptions {
  runId?: string;
}
