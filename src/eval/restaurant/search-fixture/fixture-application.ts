import { StaleTaskVersionError } from "../../../core/task-runtime/errors.js";
import type { TaskSnapshot } from "../../../core/task-runtime/contracts.js";
import { InMemoryTaskRuntime } from "../../../core/task-runtime/in-memory-task-runtime.js";
import { RestaurantAgentLoopCoordinator } from "../../../application/restaurant-agent-loop.js";
import { RestaurantSemanticInterpreter } from "../../../domains/restaurant/semantic-interpreter.js";
import { RestaurantAgentDecision } from "../../../domains/restaurant/agent-decision.js";
import { restaurantBookingTaskDefinition } from "../../../domains/restaurant/task-definition.js";
import { missingBlockingFields } from "../../../domains/restaurant/intent-state.js";
import type {
  AvailabilityOffer,
  RestaurantCandidate,
  RestaurantCommand,
  RestaurantEvent,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../../../domains/restaurant/contracts.js";
import { FixtureModelGateway } from "../../../infrastructure/fixture/fixture-model-gateway.js";
import { FixtureRestaurantSearch } from "../../../infrastructure/fixture/fixture-restaurant-search.js";
import {
  RestaurantExecutionRouter,
} from "../../../application/restaurant-execution-router.js";
import { restaurantEventForMessage } from "../../../application/restaurant-message-handler.js";
import { InMemoryRestaurantAgentTrajectoryStore } from "../../../infrastructure/postgres/restaurant-agent-trajectory-store.js";

export const LOCAL_FIXTURE_MODE = "FIXTURE" as const;

export interface LocalRestaurantTaskView {
  mode: typeof LOCAL_FIXTURE_MODE;
  taskId: string;
  taskVersion: number;
  phase: RestaurantTaskState["phase"];
  missingRequiredFields: string[];
  candidates: RestaurantCandidate[];
  availability: Record<string, AvailabilityOffer[]>;
  selectedCandidateId?: string;
  note: string;
}

export class LocalRestaurantTaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Local restaurant task not found: ${taskId}`);
    this.name = "LocalRestaurantTaskNotFoundError";
  }
}

type LocalRuntime = InMemoryTaskRuntime<
  RestaurantTaskState,
  RestaurantEvent,
  RestaurantCommand,
  RestaurantOutcome
>;

function view(snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>): LocalRestaurantTaskView {
  return {
    mode: LOCAL_FIXTURE_MODE,
    taskId: snapshot.id,
    taskVersion: snapshot.version,
    phase: snapshot.domainState.phase,
    missingRequiredFields: missingBlockingFields(snapshot.domainState.intentDraft ?? {}),
    candidates: structuredClone(snapshot.domainState.candidates),
    availability: structuredClone(snapshot.domainState.availability),
    ...(snapshot.domainState.selectedCandidateId
      ? { selectedCandidateId: snapshot.domainState.selectedCandidateId }
      : {}),
    note:
      "Fixture mode only. No real model, availability check, authorization, or reservation is performed.",
  };
}

export class FixtureRestaurantSearchApplication {
  private readonly runtime: LocalRuntime;
  private readonly interpreter = new RestaurantSemanticInterpreter(new FixtureModelGateway());
  private readonly search = new FixtureRestaurantSearch();
  private readonly trajectory = new InMemoryRestaurantAgentTrajectoryStore();
  private readonly agentLoop: RestaurantAgentLoopCoordinator;
  private readonly taskIds = new Set<string>();
  private sequence = 0;

  constructor() {
    this.runtime = new InMemoryTaskRuntime(
      restaurantBookingTaskDefinition,
      { now: () => new Date("2026-08-05T09:00:00.000Z") },
      (prefix) => `${prefix}:${++this.sequence}`,
    );
    this.agentLoop = new RestaurantAgentLoopCoordinator(
      {
        snapshot: async (taskId) => this.runtime.snapshot(taskId),
        dispatch: async (envelope, expectedVersion) => this.runtime.dispatch(envelope, expectedVersion),
      },
      new RestaurantAgentDecision(new FixtureModelGateway()),
      new RestaurantExecutionRouter(this.search, this.search),
      this.trajectory,
      { now: () => new Date("2026-08-05T09:00:00.000Z") },
      {},
      (prefix) => `${prefix}:${++this.sequence}`,
    );
  }

  async createTask(message: string): Promise<LocalRestaurantTaskView> {
    const taskId = `local-restaurant:${++this.sequence}`;
    this.runtime.createTask(taskId, {}, { runId: `run:${taskId}` });
    this.taskIds.add(taskId);
    return this.submitMessage(taskId, message, 0);
  }

  async submitMessage(
    taskId: string,
    message: string,
    expectedVersion: number,
  ): Promise<LocalRestaurantTaskView> {
    const snapshot = this.requireTask(taskId);
    if (snapshot.version !== expectedVersion) {
      throw new StaleTaskVersionError(expectedVersion, snapshot.version);
    }
    const event = await restaurantEventForMessage(this.interpreter, {
      taskId,
      message,
      referenceTime: "2026-08-05T09:00:00+09:00",
      timezone: "Asia/Tokyo",
      ...(snapshot.domainState.intentDraft
        ? { currentDraft: snapshot.domainState.intentDraft }
        : {}),
    });
    this.runtime.dispatch(
      this.userEvent(taskId, event),
      expectedVersion,
    );
    await this.agentLoop.run(taskId);
    return view(this.requireTask(taskId));
  }

  getTask(taskId: string): LocalRestaurantTaskView {
    return view(this.requireTask(taskId));
  }

  private requireTask(taskId: string) {
    if (!this.taskIds.has(taskId)) {
      throw new LocalRestaurantTaskNotFoundError(taskId);
    }
    return this.runtime.snapshot(taskId);
  }

  private userEvent(taskId: string, event: RestaurantEvent) {
    const eventId = `event:${++this.sequence}`;
    const snapshot = this.requireTask(taskId);
    return {
      id: eventId,
      taskId,
      event,
      occurredAt: "2026-08-05T09:00:00.000Z",
      trace: {
        schemaVersion: "1" as const,
        runId: snapshot.runId,
        correlationId: eventId,
        actor: "USER" as const,
      },
    };
  }

}
