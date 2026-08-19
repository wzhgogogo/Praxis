import { createHash, randomUUID } from "node:crypto";

import type {
  DispatchResult,
  EventEnvelope,
  IdFactory,
  RuntimeClock,
  TaskSnapshot,
} from "../core/task-runtime/contracts.js";
import type { RestaurantAgentDecisionPort } from "../domains/restaurant/agent-decision.js";
import { validateRestaurantAction } from "../domains/restaurant/decision-kernel.js";
import type {
  RestaurantCommand,
  RestaurantEvent,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { RESTAURANT_AGENT_CAPABILITIES } from "../domains/restaurant/restaurant-capabilities.js";
import type { RestaurantAgentTrajectoryStore } from "../infrastructure/postgres/restaurant-agent-trajectory-store.js";
import { RestaurantExecutionRouter } from "./restaurant-orchestration.js";

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
}

export type RestaurantAgentLoopResult =
  | { status: "WAITING_USER"; steps: number }
  | { status: "TERMINAL"; steps: number }
  | { status: "STEP_LIMIT"; steps: number }
  | { status: "MODEL_FAILURE"; steps: number };

function stateHash(state: RestaurantTaskState): string {
  return createHash("sha256").update(JSON.stringify(state)).digest("hex");
}

function waitingForUser(state: RestaurantTaskState): boolean {
  return state.phase === "AWAITING_AUTHORIZATION" ||
    (state.phase === "NEEDS_INPUT" && state.pendingUserQuestion !== undefined);
}

function terminal(state: RestaurantTaskState): boolean {
  return state.phase === "BOOKED_VERIFIED" || state.phase === "OUTCOME_UNKNOWN" || state.phase === "FAILED";
}

/** Bounded coordinator: only this layer turns an Agent proposal into a validated routed action. */
export class RestaurantAgentLoopCoordinator {
  private readonly maxSteps: number;
  private readonly maxRejectedActions: number;
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
    this.createId = createId;
  }

  async run(taskId: string): Promise<RestaurantAgentLoopResult> {
    const priorSteps = await this.trajectories.list(taskId);
    let stepNumber = priorSteps.length;
    let rejectedActions = 0;
    let lastRejection: { code: string; reason: string } | undefined;
    const recentExecutionHistory: Array<{ type: string; detail: string }> = priorSteps.slice(-12).map((step) => ({
      type: step.stepOutcome,
      detail: step.observation?.detail ?? step.kernelVerdict?.status ?? "No observation",
    }));

    for (let step = 0; step < this.maxSteps; step += 1) {
      const snapshot = await this.runtime.snapshot(taskId);
      if (terminal(snapshot.domainState)) return { status: "TERMINAL", steps: step };
      if (waitingForUser(snapshot.domainState)) return { status: "WAITING_USER", steps: step };

      const decision = await this.decision.decide({
        taskId,
        authoritativeState: snapshot.domainState,
        ...(snapshot.domainState.evidence ? { trustedEvidence: snapshot.domainState.evidence } : {}),
        recentExecutionHistory,
        capabilities: RESTAURANT_AGENT_CAPABILITIES,
        ...(lastRejection ? { lastRejection } : {}),
      });
      stepNumber += 1;
      const base = {
        id: `trajectory:${taskId}:${stepNumber}`,
        taskId,
        stepNumber,
        occurredAt: this.clock.now().toISOString(),
        stateVersionBefore: snapshot.version,
        stateHashBefore: stateHash(snapshot.domainState),
        evidenceRefs: snapshot.domainState.evidence ? [snapshot.domainState.evidence.evidenceId] : [],
        capabilities: RESTAURANT_AGENT_CAPABILITIES,
      };

      if (decision.status !== "PROPOSED") {
        const reason = decision.status === "MODEL_FAILURE"
          ? `Model decision failed: ${decision.errorCode}`
          : `Model action was invalid: ${decision.errors.join("; ")}`;
        const after = await this.dispatch(snapshot, { type: "AGENT_DECISION_FAILED", reason }, "SYSTEM");
        await this.trajectories.append({
          ...base,
          ...(decision.status === "INVALID_MODEL_OUTPUT" && decision.modelAttempt ? { modelAttempt: decision.modelAttempt } : {}),
          stateVersionAfter: after.version,
          stateHashAfter: stateHash(after.domainState),
          stepOutcome: "MODEL_FAILURE",
        });
        return { status: "MODEL_FAILURE", steps: step + 1 };
      }

      const verdict = validateRestaurantAction(snapshot.domainState, decision.action, this.clock.now().toISOString());
      if (verdict.status === "REJECTED") {
        rejectedActions += 1;
        lastRejection = { code: verdict.code, reason: verdict.reason };
        await this.trajectories.append({
          ...base,
          agentAction: decision.action,
          ...(decision.decisionSummary ? { decisionSummary: decision.decisionSummary } : {}),
          modelAttempt: decision.modelAttempt,
          kernelVerdict: verdict,
          stateVersionAfter: snapshot.version,
          stateHashAfter: stateHash(snapshot.domainState),
          stepOutcome: "REJECTED",
        });
        recentExecutionHistory.push({ type: verdict.code, detail: verdict.reason });
        if (rejectedActions >= this.maxRejectedActions) {
          await this.dispatch(snapshot, {
            type: "AGENT_DECISION_FAILED",
            reason: `Agent exceeded ${this.maxRejectedActions} rejected actions; last rejection: ${verdict.code}`,
          }, "SYSTEM");
          return { status: "MODEL_FAILURE", steps: step + 1 };
        }
        continue;
      }

      let execution;
      try {
        execution = await this.router.execute(decision.action, snapshot.domainState);
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Restaurant action execution failed";
        const after = await this.dispatch(snapshot, { type: "AGENT_DECISION_FAILED", reason }, "SYSTEM");
        await this.trajectories.append({
          ...base,
          agentAction: decision.action,
          ...(decision.decisionSummary ? { decisionSummary: decision.decisionSummary } : {}),
          modelAttempt: decision.modelAttempt,
          kernelVerdict: verdict,
          stateVersionAfter: after.version,
          stateHashAfter: stateHash(after.domainState),
          stepOutcome: "MODEL_FAILURE",
        });
        return { status: "MODEL_FAILURE", steps: step + 1 };
      }

      const after = execution.event
        ? await this.dispatch(snapshot, execution.event, execution.route === "FIXTURE_STRUCTURED" ? "ADAPTER" : "SYSTEM")
        : snapshot;
      const outcome = terminal(after.domainState)
        ? "TERMINAL"
        : waitingForUser(after.domainState)
          ? "WAITING_USER"
          : "EXECUTED";
      await this.trajectories.append({
        ...base,
        agentAction: decision.action,
        ...(decision.decisionSummary ? { decisionSummary: decision.decisionSummary } : {}),
        modelAttempt: decision.modelAttempt,
        kernelVerdict: verdict,
        executionRoute: execution.route,
        ...(execution.observation ? { observation: execution.observation } : {}),
        stateVersionAfter: after.version,
        stateHashAfter: stateHash(after.domainState),
        stepOutcome: outcome,
      });
      if (execution.observation) recentExecutionHistory.push(execution.observation);
      if (outcome === "TERMINAL") return { status: "TERMINAL", steps: step + 1 };
      if (outcome === "WAITING_USER") return { status: "WAITING_USER", steps: step + 1 };
      lastRejection = undefined;
      rejectedActions = 0;
    }
    return { status: "STEP_LIMIT", steps: this.maxSteps };
  }

  private async dispatch(
    snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,
    event: RestaurantEvent,
    actor: "SYSTEM" | "ADAPTER",
  ): Promise<TaskSnapshot<RestaurantTaskState, RestaurantOutcome>> {
    const id = this.createId("event:restaurant-agent");
    const result = await this.runtime.dispatch({
      id,
      taskId: snapshot.id,
      event,
      occurredAt: this.clock.now().toISOString(),
      trace: { schemaVersion: "1", runId: snapshot.runId, correlationId: id, actor },
    }, snapshot.version);
    return result.snapshot;
  }
}
