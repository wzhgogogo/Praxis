import type {
  DomainCommand,
  DomainEvent,
  TaskContext,
  TaskDefinition,
  TaskLifecycleState,
  TransitionResult,
} from "../../core/task-runtime/contracts.js";
import type {
  LeasedTrigger,
  TriggerEventFactory,
} from "../../core/task-runtime/trigger-scheduler.js";

export interface RecurringShoppingTaskInput {
  cycleIntervalMs: number;
}

export interface RecurringShoppingTaskState {
  schemaVersion: "1";
  phase: "MONITORING" | "AWAITING_CONFIRMATION" | "PREPARING_ORDER";
  cycle: number;
  cycleIntervalMs: number;
  activeCycle?: number;
  lastSimulatedOrder?: { cycle: number; reference: string; orderedAt: string };
}

export type RecurringShoppingEvent =
  | (DomainEvent & { type: "CYCLE_DUE"; cycle: number; firedAt: string })
  | (DomainEvent & { type: "CONFIRM_PURCHASE"; cycle: number })
  | (DomainEvent & { type: "PURCHASE_SIMULATED"; cycle: number; reference: string });

export type RecurringShoppingCommand =
  | (DomainCommand & {
      type: "PREPARE_SIMULATED_PURCHASE";
      cycle: number;
    })
  | (DomainCommand & {
      type: "SCHEDULE_NEXT_CYCLE";
      cycle: number;
      triggerAt: string;
    });

export interface RecurringShoppingTriggerPayload {
  kind: "RECURRENCE_DUE";
  cycle: number;
}

function requirePositiveInteger(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function requirePhase(
  state: Readonly<RecurringShoppingTaskState>,
  expected: RecurringShoppingTaskState["phase"],
  eventType: string,
): void {
  if (state.phase !== expected) {
    throw new Error(`Event ${eventType} is invalid while recurring shopping is ${state.phase}`);
  }
}

function requireActiveCycle(
  state: Readonly<RecurringShoppingTaskState>,
  cycle: number,
  eventType: string,
): void {
  if (state.activeCycle !== cycle) {
    throw new Error(
      `Event ${eventType} cycle ${cycle} does not match active cycle ${state.activeCycle ?? "none"}`,
    );
  }
}

function scheduleNextCycle(
  state: Readonly<RecurringShoppingTaskState>,
  context: TaskContext,
): RecurringShoppingCommand {
  const cycle = state.cycle + 1;
  const triggerAt = new Date(
    Date.parse(context.now) + state.cycleIntervalMs,
  ).toISOString();
  return {
    type: "SCHEDULE_NEXT_CYCLE",
    category: "WAIT",
    idempotencyKey: `${context.taskId}:shopping:cycle:${cycle}`,
    cycle,
    triggerAt,
  };
}

export const recurringShoppingTaskDefinition: TaskDefinition<
  RecurringShoppingTaskState,
  RecurringShoppingEvent,
  RecurringShoppingCommand,
  null
> = {
  type: "harness.synthetic.recurring-shopping",
  version: "1",
  create(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      throw new Error("Recurring shopping input must be an object");
    }
    const value = input as RecurringShoppingTaskInput;
    return {
      schemaVersion: "1",
      phase: "MONITORING",
      cycle: 0,
      cycleIntervalMs: requirePositiveInteger(value.cycleIntervalMs, "cycleIntervalMs"),
    };
  },
  transition(
    state: Readonly<RecurringShoppingTaskState>,
    event: Readonly<RecurringShoppingEvent>,
    context: TaskContext,
  ): TransitionResult<RecurringShoppingTaskState, RecurringShoppingCommand> {
    switch (event.type) {
      case "CYCLE_DUE":
        requirePhase(state, "MONITORING", event.type);
        if (event.cycle !== state.cycle + 1) {
          throw new Error(`Cycle ${event.cycle} is not the next recurring shopping cycle`);
        }
        return {
          state: { ...state, phase: "AWAITING_CONFIRMATION", activeCycle: event.cycle },
          commands: [],
        };
      case "CONFIRM_PURCHASE":
        requirePhase(state, "AWAITING_CONFIRMATION", event.type);
        requireActiveCycle(state, event.cycle, event.type);
        return {
          state: { ...state, phase: "PREPARING_ORDER" },
          commands: [
            {
              type: "PREPARE_SIMULATED_PURCHASE",
              category: "PREPARE",
              idempotencyKey: `${context.taskId}:shopping:prepare:${event.cycle}`,
              cycle: event.cycle,
            },
          ],
        };
      case "PURCHASE_SIMULATED": {
        requirePhase(state, "PREPARING_ORDER", event.type);
        requireActiveCycle(state, event.cycle, event.type);
        const { activeCycle: _activeCycle, ...withoutActiveCycle } = state;
        const nextState: RecurringShoppingTaskState = {
          ...withoutActiveCycle,
          phase: "MONITORING",
          cycle: event.cycle,
          lastSimulatedOrder: {
            cycle: event.cycle,
            reference: event.reference,
            orderedAt: context.now,
          },
        };
        return {
          state: nextState,
          commands: [scheduleNextCycle(nextState, context)],
        };
      }
    }
  },
  getLifecycleState(state): TaskLifecycleState {
    switch (state.phase) {
      case "MONITORING":
        return "WAITING_TIME";
      case "AWAITING_CONFIRMATION":
        return "WAITING_USER";
      case "PREPARING_ORDER":
        return "RUNNING";
    }
  },
  evaluateOutcome() {
    return null;
  },
};

export const recurringShoppingTriggerEventFactory: TriggerEventFactory<
  RecurringShoppingTriggerPayload,
  RecurringShoppingEvent
> = {
  createEvent(trigger: LeasedTrigger<RecurringShoppingTriggerPayload>, firedAt: string) {
    if (trigger.payload.kind !== "RECURRENCE_DUE") {
      throw new Error(`Unsupported recurring shopping trigger kind: ${trigger.payload.kind}`);
    }
    return {
      type: "CYCLE_DUE",
      cycle: requirePositiveInteger(trigger.payload.cycle, "trigger payload cycle"),
      firedAt,
    };
  },
};
