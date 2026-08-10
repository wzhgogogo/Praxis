import { createHash, randomBytes, randomUUID } from "node:crypto";

import { DurableCommandWorker } from "../core/task-runtime/durable-command-worker.js";
import type {
  IdFactory,
  RecordedEventEnvelope,
  RuntimeClock,
  TaskSnapshot,
} from "../core/task-runtime/contracts.js";
import { StaleTaskVersionError } from "../core/task-runtime/errors.js";
import type {
  RestaurantCommand,
  RestaurantEvent,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { RestaurantIntentParser } from "../domains/restaurant/intent-parser.js";
import { restaurantBookingTaskDefinition } from "../domains/restaurant/task-definition.js";
import { FixtureModelGateway } from "../infrastructure/fixture/fixture-model-gateway.js";
import { FixtureRestaurantSearch } from "../infrastructure/fixture/fixture-restaurant-search.js";
import {
  type ConversationRecord,
  PostgresAgentWorkspaceStore,
} from "../infrastructure/postgres/postgres-agent-workspace-store.js";
import { PostgresCommandOutbox } from "../infrastructure/postgres/postgres-command-outbox.js";
import { PostgresTaskRuntime } from "../infrastructure/postgres/postgres-task-runtime.js";
import type { SqlDatabase } from "../infrastructure/postgres/sql-database.js";
import {
  AGENT_WORKSPACE_MODE,
  type ActivityItem,
  type AgentArtifact,
  type RestaurantCaseSummary,
  type RestaurantCaseView,
  type WorkspaceUser,
  caseStatus,
  pendingAction,
} from "./agent-workspace.js";

const REFERENCE_TIME = "2026-08-05T09:00:00+09:00";
const MAX_DRAINED_COMMANDS = 20;

type RestaurantRuntime = PostgresTaskRuntime<
  RestaurantTaskState,
  RestaurantEvent,
  RestaurantCommand,
  RestaurantOutcome
>;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function titleFor(message: string): string {
  const singleLine = message.trim().replace(/\s+/g, " ");
  return singleLine.length <= 72 ? singleLine : `${singleLine.slice(0, 69)}…`;
}

function eventActivity(
  caseId: string,
  event: RecordedEventEnvelope<RestaurantEvent>,
): ActivityItem {
  const display: ActivityItem["display"] = (() => {
    switch (event.event.type) {
      case "INTENT_PARSED":
        return {
          title: "Request understood",
          detail:
            event.event.draft.missingRequiredFields.length > 0
              ? `Waiting for ${event.event.draft.missingRequiredFields.join(", ")}.`
              : "The request contains all required search details.",
        };
      case "SEARCH_COMPLETED":
        return {
          title: "Fixture search completed",
          detail: `${event.event.candidates.length} deterministic candidates are ready.`,
        };
      case "SELECT_CANDIDATE":
        return { title: "Candidate selected", detail: event.event.candidateId };
      case "OFFER_REVALIDATED":
        return {
          title: "Fixture offer revalidated",
          detail: "No live availability lookup or reservation was performed.",
        };
      case "SEARCH_FAILED":
        return { title: "Search failed", detail: event.event.reason };
      case "OFFER_UNAVAILABLE":
        return { title: "Offer unavailable", detail: event.event.candidateId };
      case "AUTHORIZE":
      case "POLICY_APPROVED":
      case "POLICY_DENIED":
      case "COMMIT_SUCCEEDED":
      case "COMMIT_FAILED":
      case "COMMIT_UNCERTAIN":
      case "BOOKING_VERIFIED":
      case "BOOKING_ABSENT":
      case "VERIFICATION_INCONCLUSIVE":
        return {
          title: event.event.type.replaceAll("_", " ").toLowerCase(),
          detail: "Recorded by the authoritative task runtime.",
        };
    }
  })();
  return {
    activityId: `activity:${event.id}`,
    caseId,
    sourceRef: { kind: "EVENT", id: event.id },
    type: event.event.type,
    display,
    occurredAt: event.occurredAt,
  };
}

function assistantSummary(state: RestaurantTaskState): string {
  switch (state.phase) {
    case "NEEDS_INPUT":
      return `Please add: ${(state.intentDraft?.missingRequiredFields ?? []).join(", ")}.`;
    case "AWAITING_SELECTION":
      return `I found ${state.candidates.length} fixture candidates. Choose one to continue.`;
    case "AWAITING_AUTHORIZATION":
      return "The selected fixture offer was revalidated. Authorization and booking are not enabled in Stage 2B.";
    case "SELECTION_REQUIRED":
      return "The current candidate cannot continue. Please choose another fixture candidate.";
    default:
      return `The case is now ${state.phase.toLowerCase().replaceAll("_", " ")}.`;
  }
}

export class WorkspaceCaseNotFoundError extends Error {
  constructor() {
    super("Case not found");
    this.name = "WorkspaceCaseNotFoundError";
  }
}

export class WorkspaceAuthenticationError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "WorkspaceAuthenticationError";
  }
}

export interface PilotAccessEntry extends WorkspaceUser {
  accessToken: string;
}

export class PilotSessionService {
  private readonly accessByToken: Map<string, WorkspaceUser>;

  constructor(
    private readonly store: PostgresAgentWorkspaceStore,
    entries: PilotAccessEntry[],
    private readonly clock: RuntimeClock,
    private readonly sessionDurationMs = 7 * 24 * 60 * 60 * 1_000,
  ) {
    this.accessByToken = new Map(
      entries.map(({ accessToken, id, displayName }) => [accessToken, { id, displayName }]),
    );
  }

  async login(accessToken: string): Promise<{ sessionToken: string; user: WorkspaceUser }> {
    const user = this.accessByToken.get(accessToken);
    if (!user) throw new WorkspaceAuthenticationError("Invalid pilot access token");
    const now = this.clock.now();
    const sessionToken = randomBytes(32).toString("base64url");
    await this.store.upsertUser(user, now.toISOString());
    await this.store.createSession({
      tokenHash: hash(sessionToken),
      userId: user.id,
      expiresAt: new Date(now.valueOf() + this.sessionDurationMs).toISOString(),
      createdAt: now.toISOString(),
    });
    return { sessionToken, user };
  }

  authenticate(sessionToken: string | undefined): Promise<WorkspaceUser | null> {
    if (!sessionToken) return Promise.resolve(null);
    return this.store.findSessionUser(hash(sessionToken), this.clock.now().toISOString());
  }
}

export interface PersistentRestaurantAgentOptions {
  database: SqlDatabase;
  clock?: RuntimeClock;
  createId?: IdFactory;
}

export class PersistentRestaurantAgentApplication {
  readonly store: PostgresAgentWorkspaceStore;
  private readonly runtime: RestaurantRuntime;
  private readonly parser = new RestaurantIntentParser(new FixtureModelGateway());
  private readonly search = new FixtureRestaurantSearch();
  private readonly worker: DurableCommandWorker<RestaurantCommand, RestaurantEvent>;
  private readonly clock: RuntimeClock;
  private readonly createId: IdFactory;

  constructor(options: PersistentRestaurantAgentOptions) {
    this.clock = options.clock ?? { now: () => new Date() };
    this.createId = options.createId ?? ((prefix) => `${prefix}:${randomUUID()}`);
    this.store = new PostgresAgentWorkspaceStore(options.database);
    this.runtime = new PostgresTaskRuntime(
      options.database,
      restaurantBookingTaskDefinition,
      this.clock,
      this.createId,
    );
    this.worker = new DurableCommandWorker({
      queue: new PostgresCommandOutbox(options.database),
      runtime: this.runtime,
      clock: this.clock,
      leaseDurationMs: 30_000,
      retryDelayMs: 1_000,
    });
  }

  async createCase(
    userId: string,
    message: string,
    requestId: string,
  ): Promise<RestaurantCaseView> {
    const existing = await this.store.findConversationByCreateRequest(userId, requestId);
    if (existing) return this.project(existing);

    const stable = hash(`${userId}:${requestId}`).slice(0, 24);
    const taskId = `restaurant:${stable}`;
    const conversationId = `conversation:${stable}`;
    const now = this.clock.now().toISOString();
    try {
      await this.runtime.createTask(taskId, {}, { runId: `run:${taskId}` });
    } catch (error) {
      try {
        await this.runtime.snapshot(taskId);
      } catch {
        throw error;
      }
    }

    let record: ConversationRecord;
    try {
      record = await this.store.createConversation({
        id: conversationId,
        userId,
        rootTaskId: taskId,
        createRequestId: requestId,
        title: titleFor(message),
        now,
      });
    } catch (error) {
      const raced = await this.store.findConversationByCreateRequest(userId, requestId);
      if (!raced) throw error;
      return this.project(raced);
    }

    await this.applyMessage(record, message, requestId, 0);
    return this.project(record);
  }

  async submitMessage(input: {
    userId: string;
    conversationId: string;
    message: string;
    requestId: string;
    expectedVersion: number;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireConversation(input.userId, input.conversationId);
    await this.applyMessage(record, input.message, input.requestId, input.expectedVersion);
    return this.project(record);
  }

  async selectCandidate(input: {
    userId: string;
    caseId: string;
    candidateId: string;
    requestId: string;
    expectedVersion: number;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    await this.runtime.dispatch(
      this.userEvent(snapshot, input.requestId, {
        type: "SELECT_CANDIDATE",
        candidateId: input.candidateId,
      }),
      input.expectedVersion,
    );
    await this.drainReadCommands();
    await this.appendAssistant(record, input.requestId);
    return this.project(record);
  }

  async getCase(userId: string, caseId: string): Promise<RestaurantCaseView> {
    return this.project(await this.requireCase(userId, caseId));
  }

  async listCases(userId: string): Promise<RestaurantCaseSummary[]> {
    const records = await this.store.listConversationsForUser(userId);
    return Promise.all(records.map(async (record) => (await this.project(record)).case));
  }

  private async applyMessage(
    record: ConversationRecord,
    message: string,
    requestId: string,
    expectedVersion: number,
  ): Promise<void> {
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    const parsed = await this.parser.parse({
      taskId: record.rootTaskId,
      message,
      referenceTime: REFERENCE_TIME,
      timezone: "Asia/Tokyo",
    });
    if (parsed.status !== "PARSED") {
      throw new Error(`Fixture parser did not produce an intent: ${parsed.status}`);
    }
    await this.runtime.dispatch(
      this.userEvent(snapshot, requestId, { type: "INTENT_PARSED", draft: parsed.draft }),
      expectedVersion,
    );
    await this.store.appendMessage({
      id: `message:0:${hash(`${record.id}:${requestId}`).slice(0, 24)}`,
      conversationId: record.id,
      role: "USER",
      content: message,
      requestId: `user:${requestId}`,
      createdAt: this.clock.now().toISOString(),
    });
    await this.drainReadCommands();
    await this.appendAssistant(record, requestId);
  }

  private async appendAssistant(record: ConversationRecord, requestId: string): Promise<void> {
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    await this.store.appendMessage({
      id: `message:1:${hash(`${record.id}:${requestId}`).slice(0, 24)}`,
      conversationId: record.id,
      role: "ASSISTANT",
      content: assistantSummary(snapshot.domainState),
      requestId: `assistant:${requestId}`,
      createdAt: this.clock.now().toISOString(),
    });
  }

  private userEvent(
    snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,
    requestId: string,
    event: RestaurantEvent,
  ) {
    const id = `event:user:${hash(`${snapshot.id}:${requestId}`).slice(0, 32)}`;
    return {
      id,
      taskId: snapshot.id,
      event,
      occurredAt: this.clock.now().toISOString(),
      trace: {
        schemaVersion: "1" as const,
        runId: snapshot.runId,
        correlationId: id,
        actor: "USER" as const,
      },
    };
  }

  private async drainReadCommands(): Promise<void> {
    const workerId = this.createId("fixture-read-worker");
    for (let count = 0; count < MAX_DRAINED_COMMANDS; count += 1) {
      const result = await this.worker.runOnce(workerId, async (leased) => {
        switch (leased.command.type) {
          case "SEARCH_RESTAURANTS":
            return {
              event: {
                type: "SEARCH_COMPLETED",
                candidates: await this.search.search(leased.command.intent),
              },
              actor: "ADAPTER",
            };
          case "REVALIDATE_OFFER":
            return {
              event: {
                type: "OFFER_REVALIDATED",
                candidate: await this.search.revalidate(leased.command.candidate),
              },
              actor: "ADAPTER",
            };
          default:
            throw new Error(`Stage 2B fixture worker cannot execute ${leased.command.type}`);
        }
      });
      if (result.status === "IDLE") return;
      if (result.status !== "SUCCEEDED") {
        throw new Error(`Fixture command ${result.commandId} ended with ${result.status}`);
      }
    }
    throw new Error(`Fixture command drain exceeded ${MAX_DRAINED_COMMANDS} commands`);
  }

  private async requireConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationRecord> {
    const record = await this.store.findConversationForUser(userId, conversationId);
    if (!record) throw new WorkspaceCaseNotFoundError();
    return record;
  }

  private async requireCase(userId: string, caseId: string): Promise<ConversationRecord> {
    const record = await this.store.findConversationByTaskForUser(userId, caseId);
    if (!record) throw new WorkspaceCaseNotFoundError();
    return record;
  }

  private async project(record: ConversationRecord): Promise<RestaurantCaseView> {
    const [snapshot, messages, events] = await Promise.all([
      this.runtime.snapshot(record.rootTaskId),
      this.store.listMessages(record.id),
      this.runtime.listEvents(record.rootTaskId),
    ]);
    const state = snapshot.domainState;
    const action = pendingAction(state.phase);
    const summary: RestaurantCaseSummary = {
      caseId: record.rootTaskId,
      conversationId: record.id,
      rootTaskId: record.rootTaskId,
      title: record.title,
      status: caseStatus(snapshot.lifecycleState),
      phase: state.phase,
      taskVersion: snapshot.version,
      ...(action ? { pendingUserAction: action } : {}),
      updatedAt: snapshot.updatedAt,
    };
    const artifacts: AgentArtifact[] = [];
    if (state.candidates.length > 0) {
      artifacts.push({
        artifactId: `artifact:candidates:${snapshot.id}:${state.searchRevision}`,
        caseId: snapshot.id,
        domain: "restaurant",
        type: "CANDIDATES",
        sourceVersion: snapshot.version,
        data: { candidates: structuredClone(state.candidates) },
      });
    }
    if (state.phase === "AWAITING_AUTHORIZATION" && state.proposal) {
      artifacts.push({
        artifactId: `artifact:authorization:${state.proposal.id}`,
        caseId: snapshot.id,
        domain: "restaurant",
        type: "AUTHORIZATION_REQUEST",
        sourceVersion: snapshot.version,
        data: {
          proposal: {
            id: state.proposal.id,
            actionType: state.proposal.actionType,
            targetName: state.proposal.target.counterparty ?? state.proposal.target.id,
            termsHash: state.proposal.termsHash,
          },
          note: "Display only. Stage 2B does not accept authorization or perform booking.",
        },
      });
    }
    if (snapshot.outcome) {
      artifacts.push({
        artifactId: `artifact:outcome:${snapshot.id}:${snapshot.version}`,
        caseId: snapshot.id,
        domain: "restaurant",
        type: "OUTCOME",
        sourceVersion: snapshot.version,
        data: { outcome: structuredClone(snapshot.outcome) },
      });
    }
    return {
      mode: AGENT_WORKSPACE_MODE,
      case: summary,
      conversation: { id: record.id, messages },
      restaurant: {
        missingRequiredFields: [...(state.intentDraft?.missingRequiredFields ?? [])],
        candidates: structuredClone(state.candidates),
        ...(state.selectedCandidateId ? { selectedCandidateId: state.selectedCandidateId } : {}),
      },
      artifacts,
      activities: events.map((event) => eventActivity(snapshot.id, event)),
      note:
        "Fixture mode only. No real model, live availability, authorization, notification, or reservation is performed.",
    };
  }
}

export { StaleTaskVersionError };
