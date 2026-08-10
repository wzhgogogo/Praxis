import type {
  DomainCommand,
  DomainEvent,
  TaskContext,
  TaskDefinition,
  TaskLifecycleState,
  TransitionResult,
} from "../../core/task-runtime/contracts.js";

export interface LongRunningCaseTaskState {
  schemaVersion: "1";
  phase:
    | "PREPARING"
    | "SUBMITTING"
    | "WAITING_EXTERNAL"
    | "NEEDS_MATERIAL"
    | "RESUBMITTING"
    | "RESOLVED";
  submissionCount: number;
  materialRequest?: string;
  resolution?: string;
}

export type LongRunningCaseEvent =
  | (DomainEvent & { type: "SUBMISSION_REQUESTED" })
  | (DomainEvent & { type: "SUBMISSION_PREPARED" })
  | (DomainEvent & { type: "EXTERNAL_NEEDS_MATERIAL"; request: string })
  | (DomainEvent & { type: "MATERIALS_PROVIDED" })
  | (DomainEvent & { type: "RESUBMISSION_PREPARED" })
  | (DomainEvent & { type: "EXTERNAL_RESOLVED"; resolution: string });

export type LongRunningCaseCommand =
  | (DomainCommand & { type: "PREPARE_SUBMISSION"; submissionNumber: number })
  | (DomainCommand & { type: "PREPARE_RESUBMISSION"; submissionNumber: number });

function requirePhase(
  state: Readonly<LongRunningCaseTaskState>,
  allowed: LongRunningCaseTaskState["phase"][],
  eventType: string,
): void {
  if (!allowed.includes(state.phase)) {
    throw new Error(`Event ${eventType} is invalid while long-running case is ${state.phase}`);
  }
}

function prepareSubmission(
  context: TaskContext,
  submissionNumber: number,
  type: LongRunningCaseCommand["type"],
): LongRunningCaseCommand {
  return {
    type,
    category: "PREPARE",
    idempotencyKey: `${context.taskId}:case:prepare:${submissionNumber}`,
    submissionNumber,
  };
}

export const longRunningCaseTaskDefinition: TaskDefinition<
  LongRunningCaseTaskState,
  LongRunningCaseEvent,
  LongRunningCaseCommand,
  { status: "RESOLVED"; resolution: string } | null
> = {
  type: "harness.synthetic.long-running-case",
  version: "1",
  create() {
    return { schemaVersion: "1", phase: "PREPARING", submissionCount: 0 };
  },
  transition(
    state: Readonly<LongRunningCaseTaskState>,
    event: Readonly<LongRunningCaseEvent>,
    context: TaskContext,
  ): TransitionResult<LongRunningCaseTaskState, LongRunningCaseCommand> {
    switch (event.type) {
      case "SUBMISSION_REQUESTED": {
        requirePhase(state, ["PREPARING"], event.type);
        return {
          state: { ...state, phase: "SUBMITTING" },
          commands: [prepareSubmission(context, state.submissionCount + 1, "PREPARE_SUBMISSION")],
        };
      }
      case "SUBMISSION_PREPARED":
        requirePhase(state, ["SUBMITTING"], event.type);
        return {
          state: {
            ...state,
            phase: "WAITING_EXTERNAL",
            submissionCount: state.submissionCount + 1,
          },
          commands: [],
        };
      case "EXTERNAL_NEEDS_MATERIAL":
        requirePhase(state, ["WAITING_EXTERNAL"], event.type);
        return {
          state: { ...state, phase: "NEEDS_MATERIAL", materialRequest: event.request },
          commands: [],
        };
      case "MATERIALS_PROVIDED":
        requirePhase(state, ["NEEDS_MATERIAL"], event.type);
        return {
          state: { ...state, phase: "RESUBMITTING" },
          commands: [
            prepareSubmission(context, state.submissionCount + 1, "PREPARE_RESUBMISSION"),
          ],
        };
      case "RESUBMISSION_PREPARED": {
        requirePhase(state, ["RESUBMITTING"], event.type);
        const submissionCount = state.submissionCount + 1;
        const { materialRequest: _materialRequest, ...withoutMaterialRequest } = state;
        return {
          state: {
            ...withoutMaterialRequest,
            phase: "WAITING_EXTERNAL",
            submissionCount,
          },
          commands: [],
        };
      }
      case "EXTERNAL_RESOLVED":
        requirePhase(state, ["WAITING_EXTERNAL"], event.type);
        return {
          state: { ...state, phase: "RESOLVED", resolution: event.resolution },
          commands: [],
        };
    }
  },
  getLifecycleState(state): TaskLifecycleState {
    switch (state.phase) {
      case "PREPARING":
      case "SUBMITTING":
      case "RESUBMITTING":
        return "RUNNING";
      case "WAITING_EXTERNAL":
        return "WAITING_EXTERNAL";
      case "NEEDS_MATERIAL":
        return "WAITING_USER";
      case "RESOLVED":
        return "SUCCEEDED";
    }
  },
  evaluateOutcome(state) {
    return state.phase === "RESOLVED" && state.resolution
      ? { status: "RESOLVED", resolution: state.resolution }
      : null;
  },
};
