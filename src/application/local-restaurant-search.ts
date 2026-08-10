import { StaleTaskVersionError } from "../core/task-runtime/errors.js";
import type { CommandEnvelope, TaskSnapshot } from "../core/task-runtime/contracts.js";
import { InMemoryTaskRuntime } from "../core/task-runtime/in-memory-task-runtime.js";
import { RestaurantIntentParser } from "../domains/restaurant/intent-parser.js";
import { restaurantBookingTaskDefinition } from "../domains/restaurant/task-definition.js";
import type {
  ExecutableCandidate,
  RestaurantCommand,
  RestaurantEvent,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { FixtureModelGateway } from "../infrastructure/fixture/fixture-model-gateway.js";
import { FixtureRestaurantSearch } from "../infrastructure/fixture/fixture-restaurant-search.js";

export const LOCAL_FIXTURE_MODE = "FIXTURE" as const;

export interface LocalRestaurantTaskView {
  mode: typeof LOCAL_FIXTURE_MODE;
  taskId: string;
  taskVersion: number;
  phase: RestaurantTaskState["phase"];
  missingRequiredFields: string[];
  candidates: ExecutableCandidate[];
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
    missingRequiredFields: [...(snapshot.domainState.intentDraft?.missingRequiredFields ?? [])],
    candidates: structuredClone(snapshot.domainState.candidates),
    ...(snapshot.domainState.selectedCandidateId
      ? { selectedCandidateId: snapshot.domainState.selectedCandidateId }
      : {}),
    note:
      "Fixture mode only. No real model, availability check, authorization, or reservation is performed.",
  };
}

export class LocalRestaurantSearchApplication {
  private readonly runtime: LocalRuntime;
  private readonly parser = new RestaurantIntentParser(new FixtureModelGateway());
  private readonly search = new FixtureRestaurantSearch();
  private readonly taskIds = new Set<string>();
  private sequence = 0;

  constructor() {
    this.runtime = new InMemoryTaskRuntime(
      restaurantBookingTaskDefinition,
      { now: () => new Date("2026-08-05T09:00:00.000Z") },
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
    const parsed = await this.parser.parse({
      taskId,
      message,
      referenceTime: "2026-08-05T09:00:00+09:00",
      timezone: "Asia/Tokyo",
    });
    if (parsed.status !== "PARSED") {
      throw new Error(`Fixture parser did not produce an intent: ${parsed.status}`);
    }
    const result = this.runtime.dispatch(
      this.userEvent(taskId, { type: "INTENT_PARSED", draft: parsed.draft }),
      expectedVersion,
    );
    await this.drainReadCommands(result.commands);
    return view(this.requireTask(taskId));
  }

  async selectCandidate(
    taskId: string,
    candidateId: string,
    expectedVersion: number,
  ): Promise<LocalRestaurantTaskView> {
    const result = this.runtime.dispatch(
      this.userEvent(taskId, { type: "SELECT_CANDIDATE", candidateId }),
      expectedVersion,
    );
    await this.drainReadCommands(result.commands);
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

  private async drainReadCommands(initial: CommandEnvelope<RestaurantCommand>[]): Promise<void> {
    const queue = [...initial];
    while (queue.length > 0) {
      const command = queue.shift();
      if (!command) {
        continue;
      }
      let event: RestaurantEvent;
      switch (command.command.type) {
        case "SEARCH_RESTAURANTS":
          event = {
            type: "SEARCH_COMPLETED",
            candidates: await this.search.search(command.command.intent),
          };
          break;
        case "REVALIDATE_OFFER":
          event = {
            type: "OFFER_REVALIDATED",
            candidate: await this.search.revalidate(command.command.candidate),
          };
          break;
        default:
          throw new Error(`Stage 2A cannot execute ${command.command.type}`);
      }
      const eventId = `event:${++this.sequence}`;
      const result = this.runtime.dispatch({
        id: eventId,
        taskId: command.taskId,
        event,
        occurredAt: "2026-08-05T09:00:00.000Z",
        trace: {
          schemaVersion: "1",
          runId: command.trace.runId,
          correlationId: command.trace.correlationId,
          causationId: command.id,
          actor: "ADAPTER",
        },
      });
      queue.push(...result.commands);
    }
  }
}
