import { createHash, randomUUID } from "node:crypto";

import type {
  DispatchResult,
  EventEnvelope,
  IdFactory,
  RuntimeClock,
  TaskSnapshot,
} from "../core/task-runtime/contracts.js";
import type { RestaurantAgentDecisionPort } from "../domains/restaurant/agent-decision.js";
import {
  projectRestaurantAgentContext,
  type RestaurantAgentContext,
} from "../domains/restaurant/agent-context.js";
import { validateRestaurantAction } from "../domains/restaurant/action-validator.js";
import type {
  RestaurantAgentLoopTermination,
  RestaurantCommand,
  RestaurantEvent,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { RESTAURANT_AGENT_CAPABILITIES } from "../domains/restaurant/restaurant-capabilities.js";
import type {
  RestaurantAgentTrajectoryCausalRefs,
  RestaurantAgentTrajectoryStep,
  RestaurantAgentTrajectoryStore,
} from "../infrastructure/postgres/restaurant-agent-trajectory-store.js";
import { RestaurantExecutionRouter } from "./restaurant-execution-router.js";

export interface RestaurantAgentLoopRuntime {
  snapshot(taskId: string): Promise<TaskSnapshot<RestaurantTaskState, RestaurantOutcome>>;
  dispatch(
    envelope: EventEnvelope<RestaurantEvent>,
    expectedVersion?: number,
  ): Promise<DispatchResult<RestaurantTaskState, RestaurantCommand, RestaurantOutcome>>;
}

export interface RestaurantAgentLoopOptions {
  maxSteps?: number;
  maxRejectedActions?: number;
  timeoutMs?: number;
}

export type RestaurantAgentLoopResult =
  | { status: "WAITING_USER"; steps: number }
  | { status: "TERMINAL"; steps: number }
  | { status: "TIMEOUT"; steps: number }
  | { status: "STEP_LIMIT"; steps: number }
  | { status: "REJECTION_LIMIT"; steps: number }
  | { status: "NO_PROGRESS"; steps: number }
  | { status: "MODEL_FAILURE"; steps: number }
  | { status: "EXECUTION_FAILURE"; steps: number };

type TrajectoryBase = Pick<
  RestaurantAgentTrajectoryStep,
  "id" | "taskId" | "stepNumber" | "occurredAt" | "stateVersionBefore" | "stateHashBefore" | "causalRefs" | "capabilities" | "contextSchemaVersion" | "decisionContext"
>;

function stateHash(state: RestaurantTaskState): string {
  return createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

function waitingForUser(state: RestaurantTaskState): boolean {
  return state.phase === "AWAITING_AUTHORIZATION" ||
    (state.phase === "NEEDS_INPUT" && state.pendingUserQuestion !== undefined);
}

function terminal(state: RestaurantTaskState): boolean {
  return state.phase === "BOOKED_VERIFIED" || state.phase === "PRESENT_RESULTS" || state.phase === "OUTCOME_UNKNOWN" || state.phase === "FAILED";
}

/**
 * A provider budget is a run-scoped capability boundary, not a user-input
 * problem.  Once discovery has failed before yielding any candidate, there is
 * no legal read action left: wording changes cannot replenish the provider.
 * Stop before asking the model to improvise repeated searches.
 */
function noExecutableDiscoveryPath(state: RestaurantTaskState): boolean {
  return state.sourceReadState?.googlePlacesSearchBudget === "EXHAUSTED" && state.candidates.length === 0;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function causalRefsForState(state: RestaurantTaskState): RestaurantAgentTrajectoryCausalRefs {
  return {
    eventIds: [],
    commandIds: [],
    attemptIds: state.activeAttemptId ? [state.activeAttemptId] : [],
    evidenceIds: state.evidence ? [state.evidence.evidenceId] : [],
  };
}

function mergeCausalRefs(
  left: RestaurantAgentTrajectoryCausalRefs,
  right: RestaurantAgentTrajectoryCausalRefs,
): RestaurantAgentTrajectoryCausalRefs {
  return {
    eventIds: unique([...left.eventIds, ...right.eventIds]),
    commandIds: unique([...left.commandIds, ...right.commandIds]),
    attemptIds: unique([...left.attemptIds, ...right.attemptIds]),
    evidenceIds: unique([...left.evidenceIds, ...right.evidenceIds]),
  };
}

/** Bounded coordinator: only this layer turns an Agent proposal into a validated routed action. */
export class RestaurantAgentLoopCoordinator {
  private readonly maxSteps: number;
  private readonly maxRejectedActions: number;
  private readonly timeoutMs: number;
  private readonly createId: IdFactory;

  constructor(
    private readonly runtime: RestaurantAgentLoopRuntime,
    private readonly decision: RestaurantAgentDecisionPort,
    private readonly router: RestaurantExecutionRouter,
    private readonly trajectories: RestaurantAgentTrajectoryStore,
    private readonly clock: RuntimeClock,
    options: RestaurantAgentLoopOptions = {},
    createId: IdFactory = (prefix) => `${prefix}:${randomUUID()}`,
  ) {
    this.maxSteps = options.maxSteps ?? 12;
    this.maxRejectedActions = options.maxRejectedActions ?? 3;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.createId = createId;
  }

  async run(taskId: string): Promise<RestaurantAgentLoopResult> {
    this.router.beginReadRun();
    try {
      return await this.runWithinReadBudget(taskId);
    } finally {
      this.router.endReadRun();
    }
  }

  private async runWithinReadBudget(taskId: string): Promise<RestaurantAgentLoopResult> {
    const priorSteps = await this.trajectories.list(taskId);
    let stepNumber = priorSteps.length;
    let rejectedActions = 0;
    let lastRejection: { code: string; reason: string } | undefined;
    let lastRejectedAction: string | undefined;
    const startedAt = this.clock.now().valueOf();
    const recentExecutionHistory: Array<{ type: string; detail: string }> = priorSteps.slice(-12).map((step) => ({
      type: step.stepOutcome,
      detail: step.stepOutcome === "EXECUTION_FAILURE"
        ? step.observation?.type ?? "Provider read failed"
        : step.observation?.detail ?? step.actionValidation?.status ?? "No observation",
    }));

    for (let step = 0; step < this.maxSteps; step += 1) {
      const snapshot = await this.runtime.snapshot(taskId);
      if (terminal(snapshot.domainState)) return { status: "TERMINAL", steps: step };
      if (waitingForUser(snapshot.domainState)) return { status: "WAITING_USER", steps: step };
      if (noExecutableDiscoveryPath(snapshot.domainState)) {
        stepNumber += 1;
        await this.terminate(
          snapshot,
          this.base(taskId, stepNumber, snapshot),
          "NO_PROGRESS",
          "Google discovery budget is exhausted before any candidate was found; no valid read action remains",
        );
        return { status: "NO_PROGRESS", steps: step };
      }
      if (this.timedOut(startedAt)) {
        stepNumber += 1;
        await this.terminate(snapshot, this.base(taskId, stepNumber, snapshot), "TIMEOUT", `Agent loop exceeded ${this.timeoutMs}ms`);
        return { status: "TIMEOUT", steps: step };
      }

      const context = projectRestaurantAgentContext(snapshot.domainState, this.clock.now().toISOString());
      const decision = await this.decision.decide({
        taskId,
        context,
        recentExecutionHistory,
        capabilities: RESTAURANT_AGENT_CAPABILITIES,
        ...(lastRejection ? { lastRejection } : {}),
      });
      stepNumber += 1;
      const base = this.base(taskId, stepNumber, snapshot, context);

      if (this.timedOut(startedAt)) {
        await this.terminate(
          snapshot,
          base,
          "TIMEOUT",
          `Agent loop exceeded ${this.timeoutMs}ms while awaiting a decision`,
          decision.status === "PROPOSED"
            ? {
                agentAction: decision.action,
                ...(decision.decisionSummary ? { decisionSummary: decision.decisionSummary } : {}),
                modelAttempt: decision.modelAttempt,
              }
            : decision.status === "INVALID_MODEL_OUTPUT" && decision.modelAttempt
              ? { modelAttempt: decision.modelAttempt }
              : {},
        );
        return { status: "TIMEOUT", steps: step + 1 };
      }

      if (decision.status !== "PROPOSED") {
        const reason = decision.status === "MODEL_FAILURE"
          ? `Model decision failed: ${decision.errorCode}`
          : `Model action was invalid: ${decision.errors.join("; ")}`;
        const after = await this.dispatch(snapshot, { type: "AGENT_DECISION_FAILED", reason }, "SYSTEM");
        await this.trajectories.append({
          ...base,
          ...(decision.status === "INVALID_MODEL_OUTPUT" && decision.modelAttempt ? { modelAttempt: decision.modelAttempt } : {}),
          causalRefs: mergeCausalRefs(base.causalRefs, after.causalRefs),
          stateVersionAfter: after.snapshot.version,
          stateHashAfter: stateHash(after.snapshot.domainState),
          stepOutcome: "MODEL_FAILURE",
        });
        return { status: "MODEL_FAILURE", steps: step + 1 };
      }

      const verdict = validateRestaurantAction(snapshot.domainState, decision.action, this.clock.now().toISOString());
      if (verdict.status === "REJECTED") {
        rejectedActions += 1;
        lastRejection = { code: verdict.code, reason: verdict.reason };
        const repeated = lastRejectedAction === JSON.stringify(decision.action);
        lastRejectedAction = JSON.stringify(decision.action);
        await this.trajectories.append({
          ...base,
          agentAction: decision.action,
          ...(decision.decisionSummary ? { decisionSummary: decision.decisionSummary } : {}),
          modelAttempt: decision.modelAttempt,
          actionValidation: verdict,
          stateVersionAfter: snapshot.version,
          stateHashAfter: stateHash(snapshot.domainState),
          stepOutcome: "REJECTED",
        });
        recentExecutionHistory.push({ type: verdict.code, detail: verdict.reason });
        if (repeated || rejectedActions >= this.maxRejectedActions) {
          const current = await this.runtime.snapshot(taskId);
          stepNumber += 1;
          await this.terminate(
            current,
            this.base(taskId, stepNumber, current),
            "REJECTION_LIMIT",
            repeated
              ? `Agent repeated the same rejected action after ${verdict.code}; corrective action was required`
              : `Agent exceeded ${this.maxRejectedActions} rejected actions; last rejection: ${verdict.code}`,
          );
          return { status: "REJECTION_LIMIT", steps: step + 1 };
        }
        continue;
      }

      let execution;
      try {
        execution = await this.router.execute(
          decision.action,
          snapshot.domainState,
          this.clock.now().toISOString(),
          snapshot.runId,
        );
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Restaurant action execution failed";
        const after = await this.dispatch(snapshot, { type: "AGENT_EXECUTION_FAILED", reason }, "SYSTEM");
        await this.trajectories.append({
          ...base,
          agentAction: decision.action,
          ...(decision.decisionSummary ? { decisionSummary: decision.decisionSummary } : {}),
          modelAttempt: decision.modelAttempt,
          actionValidation: verdict,
          causalRefs: mergeCausalRefs(base.causalRefs, after.causalRefs),
          stateVersionAfter: after.snapshot.version,
          stateHashAfter: stateHash(after.snapshot.domainState),
          stepOutcome: "EXECUTION_FAILURE",
        });
        return { status: "EXECUTION_FAILURE", steps: step + 1 };
      }

      const after = execution.event
        ? await this.dispatch(snapshot, execution.event, execution.route === "STRUCTURED_ADAPTER" || execution.route === "GENERIC_BROWSER" ? "ADAPTER" : "SYSTEM")
        : { snapshot, causalRefs: causalRefsForState(snapshot.domainState) };
      const outcome = execution.failure
        ? "EXECUTION_FAILURE"
        : terminal(after.snapshot.domainState)
          ? "TERMINAL"
          : waitingForUser(after.snapshot.domainState)
            ? "WAITING_USER"
            : "EXECUTED";
      await this.trajectories.append({
        ...base,
        agentAction: decision.action,
        ...(decision.decisionSummary ? { decisionSummary: decision.decisionSummary } : {}),
        modelAttempt: decision.modelAttempt,
        actionValidation: verdict,
        ...(execution.route ? { executionRoute: execution.route } : {}),
        ...(execution.executionMetadata ? { executionMetadata: execution.executionMetadata } : {}),
        ...(execution.observation ? { observation: execution.observation } : {}),
        ...(decision.action.type === "BOOK_RESERVATION" && after.snapshot.domainState.proposal
          ? { proposalId: after.snapshot.domainState.proposal.id }
          : {}),
        causalRefs: mergeCausalRefs(base.causalRefs, after.causalRefs),
        stateVersionAfter: after.snapshot.version,
        stateHashAfter: stateHash(after.snapshot.domainState),
        stepOutcome: outcome,
      });
      if (execution.failure) {
        recentExecutionHistory.push({ type: execution.failure.code, detail: "Provider read failed" });
      } else if (execution.observation) {
        recentExecutionHistory.push(execution.observation);
      }
      if (outcome === "TERMINAL") return { status: "TERMINAL", steps: step + 1 };
      if (outcome === "WAITING_USER") return { status: "WAITING_USER", steps: step + 1 };
      if (execution.failure?.terminal) {
        stepNumber += 1;
        await this.terminate(
          after.snapshot,
          this.base(taskId, stepNumber, after.snapshot),
          "EXECUTION_FAILURE",
          execution.failure.reason,
        );
        return { status: "EXECUTION_FAILURE", steps: step + 1 };
      }
      lastRejection = undefined;
      lastRejectedAction = undefined;
      rejectedActions = 0;
    }

    const snapshot = await this.runtime.snapshot(taskId);
    stepNumber += 1;
    await this.terminate(
      snapshot,
      this.base(taskId, stepNumber, snapshot),
      "STEP_LIMIT",
      `Agent loop reached its ${this.maxSteps} step limit`,
    );
    return { status: "STEP_LIMIT", steps: this.maxSteps };
  }

  /** Called by the application orchestrator after a mandatory Policy/Commit/Verify chain completes. */
  async resumeAfterMandatoryCommandChain(taskId: string): Promise<RestaurantAgentLoopResult | undefined> {
    const snapshot = await this.runtime.snapshot(taskId);
    return snapshot.domainState.phase === "SELECTION_REQUIRED"
      ? this.run(taskId)
      : undefined;
  }

  private timedOut(startedAt: number): boolean {
    return this.clock.now().valueOf() - startedAt >= this.timeoutMs;
  }

  private base(
    taskId: string,
    stepNumber: number,
    snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,
    decisionContext?: RestaurantAgentContext,
  ): TrajectoryBase {
    return {
      id: `trajectory:${taskId}:${stepNumber}`,
      taskId,
      stepNumber,
      occurredAt: this.clock.now().toISOString(),
      stateVersionBefore: snapshot.version,
      stateHashBefore: stateHash(snapshot.domainState),
      causalRefs: causalRefsForState(snapshot.domainState),
      capabilities: RESTAURANT_AGENT_CAPABILITIES,
      ...(decisionContext ? {
        contextSchemaVersion: decisionContext.schemaVersion,
        decisionContext: structuredClone(decisionContext),
      } : {}),
    };
  }

  private async terminate(
    snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,
    base: TrajectoryBase,
    termination: RestaurantAgentLoopTermination,
    reason: string,
    extra: Pick<RestaurantAgentTrajectoryStep, "agentAction" | "decisionSummary" | "modelAttempt" | "actionValidation"> | Record<string, never> = {},
  ): Promise<void> {
    const after = await this.dispatch(snapshot, { type: "AGENT_LOOP_TERMINATED", termination, reason }, "SYSTEM");
    await this.trajectories.append({
      ...base,
      ...extra,
      causalRefs: mergeCausalRefs(base.causalRefs, after.causalRefs),
      stateVersionAfter: after.snapshot.version,
      stateHashAfter: stateHash(after.snapshot.domainState),
      stepOutcome: termination,
    });
  }

  private async dispatch(
    snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,
    event: RestaurantEvent,
    actor: "SYSTEM" | "ADAPTER",
  ): Promise<{ snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>; causalRefs: RestaurantAgentTrajectoryCausalRefs }> {
    const id = this.createId("event:restaurant-agent");
    const result = await this.runtime.dispatch({
      id,
      taskId: snapshot.id,
      event,
      occurredAt: this.clock.now().toISOString(),
      trace: { schemaVersion: "1", runId: snapshot.runId, correlationId: id, actor },
    }, snapshot.version);
    return {
      snapshot: result.snapshot,
      causalRefs: {
        eventIds: [id],
        commandIds: result.commands.map((command) => command.id),
        attemptIds: unique(result.commands.flatMap((command) => [
          ...(command.command.attemptId ? [command.command.attemptId] : []),
          ...(command.trace.attemptId ? [command.trace.attemptId] : []),
        ])),
        evidenceIds: result.snapshot.domainState.evidence ? [result.snapshot.domainState.evidence.evidenceId] : [],
      },
    };
  }
}
