import { restaurantFailureCode } from "../domains/restaurant/failure-codes.js";
import { restaurantReadBudgetExhausted } from "../domains/restaurant/action-validator.js";
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
import { defaultBatchDeliveryCandidateIds, validateRestaurantAction } from "../domains/restaurant/action-validator.js";
import { assessRestaurantRead } from "../domains/restaurant/read-assessment.js";
import { restaurantReadStopIsSystem } from "../domains/restaurant/read-loop-termination.js";
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
  maxSteps: number;
  maxRejectedActions: number;
  timeoutMs: number;
  /** Trusted caller's active whole-run budget; shared by all model purposes. */
  remainingModelCalls?: (taskId: string) => number | undefined;
  /** Observes persisted transitions for a user-visible owner; it cannot change Agent state. */
  onStateUpdated?: (taskId: string) => Promise<void> | void;
}

export type RestaurantAgentLoopResult =
  | { status: "WAITING_USER"; steps: number }
  | { status: "TERMINAL"; steps: number }
  | { status: "TIMEOUT"; steps: number }
  | { status: "STEP_LIMIT"; steps: number }
  | { status: "REJECTION_LIMIT"; steps: number }
  | { status: "NO_PROGRESS"; steps: number }
  | { status: "MODEL_FAILURE"; steps: number }
  | { status: "EXECUTION_FAILURE"; steps: number }
  | { status: "CANCELLED"; steps: number };

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
  return state.phase === "BOOKED_VERIFIED" || state.phase === "PRESENT_RESULTS" || state.phase === "NO_VERIFIED_RESULT" || state.phase === "OUTCOME_UNKNOWN" || state.phase === "FAILED";
}

function cancellationReason(signal: AbortSignal): string {
  return signal.reason instanceof Error && signal.reason.message
    ? signal.reason.message
    : "The user cancelled this read-only investigation.";
}

function isRunDeadline(signal: AbortSignal): boolean {
  return !!signal.reason && typeof signal.reason === "object" && "code" in signal.reason
    && signal.reason.code === "RUN_DEADLINE_EXCEEDED";
}

/**
 * A failed location lookup, failed network read or spent provider budget
 * cannot establish nearby candidates by repeating the unchanged search.
 * Stop before asking the model to improvise repeated searches.
 */
function noExecutableDiscoveryPath(state: RestaurantTaskState, now: string): boolean {
  if (state.failure?.code === "GOOGLE_LOCATION_UNRESOLVED" && state.candidates.length === 0) return true;
  if (state.failure?.code === "GOOGLE_NETWORK_FAILED" && state.candidates.length === 0) return true;
  if (state.sourceReadState?.googlePlacesSearchBudget !== "EXHAUSTED") return false;
  if (state.candidates.length === 0) return true;
  // Google exhaustion does not decide whether the task can progress.  A
  // candidate may already be displayable, or it may still have a lawful fact
  // or availability observation. Ask the same invariant guard used by
  // routed actions rather than inferring exhaustion from historical checks.
  if (state.factRefreshRequestedCandidateIds?.length) return false;
  const assessment = assessRestaurantRead(state, now);
  if (assessment.presentation.some((item) => item.eligible) || /^(MODEL_CALL_RESERVE|IMMEDIATE_SOURCES_CLOSED)/.test(assessment.endReadReason ?? "")) return false;
  return state.candidates.every((candidate) => {
    const candidateIds = [candidate.restaurant.id];
    return validateRestaurantAction(state, { type: "INVESTIGATE_CANDIDATE_FACTS", candidateIds }, now).status !== "ALLOWED"
      && validateRestaurantAction(state, { type: "CHECK_AVAILABILITY", candidateIds }, now).status !== "ALLOWED";
  });
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
  private readonly onStateUpdated: ((taskId: string) => Promise<void> | void) | undefined;
  private readonly remainingModelCalls: RestaurantAgentLoopOptions["remainingModelCalls"];

  constructor(
    private readonly runtime: RestaurantAgentLoopRuntime,
    private readonly decision: RestaurantAgentDecisionPort,
    private readonly router: RestaurantExecutionRouter,
    private readonly trajectories: RestaurantAgentTrajectoryStore,
    private readonly clock: RuntimeClock,
    options: RestaurantAgentLoopOptions,
    createId: IdFactory = (prefix) => `${prefix}:${randomUUID()}`,
  ) {
    this.maxSteps = options.maxSteps;
    this.maxRejectedActions = options.maxRejectedActions;
    this.timeoutMs = options.timeoutMs;
    this.createId = createId;
    this.onStateUpdated = options.onStateUpdated;
    this.remainingModelCalls = options.remainingModelCalls;
  }

  async run(taskId: string, signal?: AbortSignal, readDeadlineAt?: Date): Promise<RestaurantAgentLoopResult> {
    this.router.beginReadRun();
    try {
      return await this.runWithinReadBudget(taskId, signal, readDeadlineAt);
    } finally {
      this.router.endReadRun();
    }
  }

  private async runWithinReadBudget(taskId: string, signal?: AbortSignal, readDeadlineAt?: Date): Promise<RestaurantAgentLoopResult> {
    const priorSteps = await this.trajectories.list(taskId);
    let stepNumber = priorSteps.length;
    let rejectedActions = 0;
    let lastRejection: { code: string; reason: string } | undefined;
    let lastRejectedAction: string | undefined;
    const startedAt = this.clock.now().valueOf();
    const deadlineAt = new Date(Math.min(startedAt + this.timeoutMs, readDeadlineAt?.valueOf() ?? Number.POSITIVE_INFINITY));
    const openDeliveryWindow = async (current: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>) => {
      const now = this.clock.now();
      const remainingMs = deadlineAt.valueOf() - now.valueOf();
      const remainingCalls = this.remainingModelCalls?.(taskId);
      const callReserve = remainingCalls !== undefined && Number.isSafeInteger(remainingCalls)
        && remainingCalls >= 0 && remainingCalls <= 4;
      const oldWindow = current.domainState.defaultBatchDeliveryWindow;
      if ((callReserve || this.timeoutMs >= 90_000 && remainingMs <= 45_000)
        && (!oldWindow || Date.parse(oldWindow.deadlineAt) < now.valueOf()) && remainingMs >= 0
        && defaultBatchDeliveryCandidateIds(current.domainState, now.toISOString()).length > 0) {
        const deliveryDeadline = new Date(Math.min(deadlineAt.valueOf(), now.valueOf() + 45_000));
        return (await this.dispatch(current, { type: "DEFAULT_BATCH_DELIVERY_WINDOW_OPENED", deadlineAt: deliveryDeadline.toISOString() }, "SYSTEM")).snapshot;
      }
      if (callReserve && remainingMs >= 0 && current.domainState.phase === "SEARCHING"
        && !assessRestaurantRead(current.domainState, now.toISOString()).presentation.some(item => item.eligible)
        && (!current.domainState.readEndWindow || Date.parse(current.domainState.readEndWindow.deadlineAt) < now.valueOf())) {
        return (await this.dispatch(current, { type: "READ_END_WINDOW_OPENED", deadlineAt: new Date(Math.min(deadlineAt.valueOf(), now.valueOf() + 45_000)).toISOString() }, "SYSTEM")).snapshot;
      }
      return current;
    };
    const recentExecutionHistory: Array<{ type: string; detail: string }> = priorSteps.slice(-12).map((step) => ({
      type: step.stepOutcome,
      detail: step.stepOutcome === "EXECUTION_FAILURE"
        ? step.observation?.type ?? "Provider read failed"
        : step.observation?.detail ?? step.actionValidation?.status ?? "No observation",
    }));

    for (let step = 0; step < this.maxSteps; step += 1) {
      let snapshot = await this.runtime.snapshot(taskId);
      if (signal?.aborted) return this.cancel(snapshot, taskId, stepNumber, signal);
      if (terminal(snapshot.domainState)) return { status: "TERMINAL", steps: step };
      if (waitingForUser(snapshot.domainState)) return { status: "WAITING_USER", steps: step };
      snapshot = await openDeliveryWindow(snapshot);
      const readBudget = { ...this.router.readBudgetStatus(), remainingModelCalls: this.remainingModelCalls?.(taskId) };
      if (restaurantReadBudgetExhausted(snapshot.domainState, readBudget) || noExecutableDiscoveryPath(snapshot.domainState, this.clock.now().toISOString())) {
        stepNumber += 1;
        const completed = await this.terminate(
          snapshot,
          this.base(taskId, stepNumber, snapshot),
          "NO_PROGRESS",
          restaurantReadBudgetExhausted(snapshot.domainState, readBudget)
            ? `${snapshot.domainState.failure?.code ?? (readBudget.browserModelBudgetExhausted ? "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" : "MODEL_CALL_BUDGET_EXHAUSTED")}: no executable model-backed read path remains`
            : snapshot.domainState.failure?.code === "GOOGLE_LOCATION_UNRESOLVED"
            ? "The named location could not be resolved to coordinates by the available source; no result may claim nearby compliance"
            : snapshot.domainState.failure?.code === "GOOGLE_NETWORK_FAILED"
            ? "Google discovery failed at the network boundary before any candidate was observed; repeating the unchanged search cannot establish nearby results"
            : "The local per-run Google request budget is exhausted and no candidate has a remaining lawful fact path; no valid read action remains",
        );
        return { status: completed ? "TERMINAL" : "NO_PROGRESS", steps: step };
      }
      if (this.timedOut(deadlineAt)) {
        stepNumber += 1;
        const completed = await this.terminate(snapshot, this.base(taskId, stepNumber, snapshot), "TIMEOUT", `Agent loop exceeded ${this.timeoutMs}ms`);
        return { status: completed ? "TERMINAL" : "TIMEOUT", steps: step };
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
      snapshot = await this.runtime.snapshot(taskId);
      let base = this.base(taskId, stepNumber, snapshot, context);

      if (signal?.aborted) return this.abort(snapshot, taskId, step + 1, base, signal);

      if (this.timedOut(deadlineAt)) {
        const completed = await this.terminate(
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
        return { status: completed ? "TERMINAL" : "TIMEOUT", steps: step + 1 };
      }
      snapshot = await openDeliveryWindow(snapshot);
      base = this.base(taskId, stepNumber, snapshot, context);

      if (decision.status !== "PROPOSED") {
        if (decision.status === "MODEL_FAILURE" && decision.errorCode === "MODEL_CALL_BUDGET_EXHAUSTED") {
          const completed = await this.terminate(snapshot, base, "STEP_LIMIT", "MODEL_CALL_BUDGET_EXHAUSTED: the bounded investigation used its shared model-call budget");
          return { status: completed ? "TERMINAL" : "STEP_LIMIT", steps: step + 1 };
        }
        const reason = decision.status === "MODEL_FAILURE"
          ? `Model decision failed: ${decision.errorCode}`
          : `Model action was invalid: ${decision.errors.join("; ")}`;
        const code = decision.status === "MODEL_FAILURE" ? decision.errorCode : "AGENT_DECISION_FAILED";
        const after = await this.dispatch(snapshot, { type: "AGENT_DECISION_FAILED", code, reason }, "SYSTEM");
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

      const verdict = validateRestaurantAction(snapshot.domainState, decision.action, this.clock.now().toISOString(), { ...this.router.readBudgetStatus(), remainingModelCalls: this.remainingModelCalls?.(taskId) });
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
          const completed = await this.terminate(
            current,
            this.base(taskId, stepNumber, current),
            "REJECTION_LIMIT",
            repeated
              ? `Agent repeated the same rejected action after ${verdict.code}; corrective action was required`
              : `Agent exceeded ${this.maxRejectedActions} rejected actions without an executed action, request change, or new source observation; last rejection: ${verdict.code}`,
          );
          return { status: completed ? "TERMINAL" : "REJECTION_LIMIT", steps: step + 1 };
        }
        continue;
      }

      let execution;
      const readAction = decision.action.type === "SEARCH_RESTAURANTS" || decision.action.type === "INVESTIGATE_CANDIDATE_FACTS"
        || decision.action.type === "CHECK_AVAILABILITY";
      const reserveMs = deadlineAt.valueOf() - this.clock.now().valueOf() - 45_000;
      const preserveDelivery = this.timeoutMs >= 90_000 && readAction && reserveMs > 0
        && defaultBatchDeliveryCandidateIds(snapshot.domainState, this.clock.now().toISOString()).length > 0;
      const readController = preserveDelivery ? new AbortController() : undefined;
      let reserveReached = false;
      const onParentAbort = () => readController?.abort(signal?.reason);
      if (readController && signal) signal.addEventListener("abort", onParentAbort, { once: true });
      const reserveTimer = readController ? setTimeout(() => {
        reserveReached = true;
        readController.abort(Object.assign(new Error("Default result delivery reserve reached"), {code:"DELIVERY_RESERVE_REACHED"}));
      }, reserveMs) : undefined;
      const recordDeliveryReserve = async () => {
        const detail = "DELIVERY_RESERVE_REACHED: source read stopped before the reserved result-delivery window";
        const observationType = decision.action.type === "CHECK_AVAILABILITY" ? "AVAILABILITY_UNKNOWN"
          : decision.action.type === "INVESTIGATE_CANDIDATE_FACTS" ? "CANDIDATE_FACTS_UNKNOWN" : "DISCOVERY_FAILED";
        await this.trajectories.append({ ...base, agentAction: decision.action, modelAttempt: decision.modelAttempt,
          actionValidation: verdict, observation: { type: observationType, detail },
          stateVersionAfter: snapshot.version, stateHashAfter: stateHash(snapshot.domainState), stepOutcome: "EXECUTION_FAILURE" });
        recentExecutionHistory.push({ type: "DELIVERY_RESERVE_REACHED", detail });
      };
      try {
        execution = await this.router.execute(
          decision.action,
          snapshot.domainState,
          this.clock.now().toISOString(),
          snapshot.runId + ":investigation:" + String(snapshot.domainState.investigationRevision ?? 0),
          readController?.signal ?? signal,
          readAction ? {
            remaining: () => this.remainingModelCalls?.(taskId),
            qualified: () => defaultBatchDeliveryCandidateIds(snapshot.domainState, this.clock.now().toISOString()).length > 0
              || !assessRestaurantRead(snapshot.domainState, this.clock.now().toISOString()).presentation.some(item => item.eligible),
          } : undefined,
        );
      } catch (error) {
        if (reserveReached && !signal?.aborted) {
          await recordDeliveryReserve();
          continue;
        }
        if (signal?.aborted) return this.abort(snapshot, taskId, step + 1, base, signal);
        const reason = error instanceof Error ? error.message : "Restaurant action execution failed";
        const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
          ? restaurantFailureCode(error.code, "AGENT_EXECUTION_FAILED") : "AGENT_EXECUTION_FAILED";
        if (code === "MODEL_CALL_BUDGET_EXHAUSTED" || code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED") {
          const completed = await this.terminate(snapshot, base, "STEP_LIMIT", `${code}: ${reason}`, { agentAction: decision.action, modelAttempt: decision.modelAttempt, actionValidation: verdict });
          return { status: completed ? "TERMINAL" : "STEP_LIMIT", steps: step + 1 };
        }
        const after = await this.dispatch(snapshot, { type: "AGENT_EXECUTION_FAILED", code, reason }, "SYSTEM");
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
      } finally {
        if (reserveTimer) clearTimeout(reserveTimer);
        if (signal) signal.removeEventListener("abort", onParentAbort);
      }

      if (reserveReached && !signal?.aborted) await recordDeliveryReserve();
      // A returned Router event contains checkpointed completed outlets even if the reserve fired.
      if (signal?.aborted) return this.abort(snapshot, taskId, step + 1, base, signal);

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
      if (execution.failure) {
        rejectedActions += 1;
        if (rejectedActions >= this.maxRejectedActions) {
          stepNumber += 1;
          const completed = await this.terminate(after.snapshot, this.base(taskId, stepNumber, after.snapshot), "NO_PROGRESS", `No new successful observation in ${rejectedActions} steps; last failure: ${execution.failure.code}`);
          return { status: completed ? "TERMINAL" : "NO_PROGRESS", steps: step + 1 };
        }
      } else {
        lastRejection = undefined;
        lastRejectedAction = undefined;
        rejectedActions = 0;
      }
    }

    const snapshot = await this.runtime.snapshot(taskId);
    stepNumber += 1;
    const completed = await this.terminate(
      snapshot,
      this.base(taskId, stepNumber, snapshot),
      "STEP_LIMIT",
      `Agent loop reached its ${this.maxSteps} step limit`,
    );
    return { status: completed ? "TERMINAL" : "STEP_LIMIT", steps: this.maxSteps };
  }

  /** Called by the application orchestrator after a mandatory Policy/Commit/Verify chain completes. */
  async resumeAfterMandatoryCommandChain(taskId: string): Promise<RestaurantAgentLoopResult | undefined> {
    const snapshot = await this.runtime.snapshot(taskId);
    return snapshot.domainState.phase === "SELECTION_REQUIRED"
      ? this.run(taskId)
      : undefined;
  }

  private async cancel(
    snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,
    taskId: string,
    stepNumber: number,
    signal: AbortSignal,
  ): Promise<RestaurantAgentLoopResult> {
    if (terminal(snapshot.domainState)) return { status: "TERMINAL", steps: stepNumber };
    const nextStep = stepNumber + 1;
    return this.abort(snapshot, taskId, nextStep, this.base(taskId, nextStep, snapshot), signal);
  }

  private async abort(
    snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,
    _taskId: string,
    steps: number,
    base: TrajectoryBase,
    signal: AbortSignal,
  ): Promise<RestaurantAgentLoopResult> {
    if (isRunDeadline(signal)) {
      const completed = await this.terminate(snapshot, base, "TIMEOUT", cancellationReason(signal));
      return { status: completed ? "TERMINAL" : "TIMEOUT", steps };
    }
    await this.terminate(snapshot, base, "CANCELLED", cancellationReason(signal));
    return { status: "CANCELLED", steps };
  }

  private timedOut(deadlineAt: Date): boolean {
    return this.clock.now().valueOf() >= deadlineAt.valueOf();
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
  ): Promise<boolean> {
    // Presentation retains the ordinary Validator, Router and Reducer rules.
    // A system-owned no-result stop is a different event, not an Agent END_READ.
    const state = snapshot.domainState;
    let current = snapshot;
    let presentationGap = "";
    if (!restaurantReadStopIsSystem(termination, state.failure?.code)) {
      const now = this.clock.now().toISOString();
      const eligible = assessRestaurantRead(state, now).presentation.filter(item => item.eligible).map(item => item.candidateId);
      const shortBatch = defaultBatchDeliveryCandidateIds(state, now);
      if (eligible.length) {
        if (shortBatch.length && (!state.defaultBatchDeliveryWindow || Date.parse(state.defaultBatchDeliveryWindow.deadlineAt) < Date.parse(now))) {
          current = (await this.dispatch(current, { type: "DEFAULT_BATCH_DELIVERY_WINDOW_OPENED", deadlineAt: new Date(this.clock.now().valueOf() + 45_000).toISOString() }, "SYSTEM")).snapshot;
        }
        // Validate against time sampled AFTER the persisted window was opened.
        const presentationTime = this.clock.now().toISOString();
        const action = { type: "PRESENT_RESULTS" as const, candidateIds: shortBatch.length ? shortBatch : eligible };
        const validation = validateRestaurantAction(current.domainState, action, presentationTime);
        if (validation.status === "ALLOWED") {
          const execution = await this.router.execute(action, current.domainState, presentationTime);
          if (execution.event?.type !== "RESULTS_PRESENTED" || !execution.observation) throw new Error("Validated presentation did not produce its required event");
          const after = await this.dispatch(current, execution.event, "SYSTEM");
          const context = projectRestaurantAgentContext(current.domainState, presentationTime);
          await this.trajectories.append({ ...base, ...extra, decisionContext: context,
            contextSchemaVersion: context.schemaVersion, agentAction: action, actionValidation: validation,
            observation: execution.observation, causalRefs: mergeCausalRefs(base.causalRefs, after.causalRefs),
            stateVersionAfter: after.snapshot.version, stateHashAfter: stateHash(after.snapshot.domainState), stepOutcome: "TERMINAL" });
          return true;
        }
        presentationGap = `; presentation was not permitted: ${validation.status === "REJECTED" ? validation.code : validation.status}`;
      }
    }
    const after = await this.dispatch(current, { type: "AGENT_LOOP_TERMINATED", termination, reasonCode: this.remainingModelCalls?.(snapshot.id) === 0 ? "MODEL_CALL_BUDGET_EXHAUSTED" : this.router.readBudgetStatus().browserModelBudgetExhausted ? "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" : state.failure?.code ?? `AGENT_LOOP_${termination}`, reason: reason + presentationGap }, "SYSTEM");
    const completed = after.snapshot.domainState.phase === "NO_VERIFIED_RESULT";
    const summary = after.snapshot.domainState.noVerifiedResult;
    await this.trajectories.append({
      ...base, ...extra,
      ...(completed && summary ? { observation: { type: "READ_ENDED" as const,
        detail: `AGENT_LOOP_${termination}: ${reason}`, candidateIds: summary.investigatedCandidateIds,
        unresolvedCandidateIds: summary.unresolvedCandidateIds, termination: summary.termination } } : {}),
      causalRefs: mergeCausalRefs(base.causalRefs, after.causalRefs),
      stateVersionAfter: after.snapshot.version, stateHashAfter: stateHash(after.snapshot.domainState),
      stepOutcome: completed ? "TERMINAL" : termination,
    });
    return completed;
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
    // Persistence is authoritative; a disconnected UI observer must not make
    // a completed source read fail or alter its outcome.
    try { await this.onStateUpdated?.(snapshot.id); } catch { /* notification is best-effort */ }
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
