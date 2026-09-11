import { createHash, randomBytes, randomUUID } from "node:crypto";

import type {
  IdFactory,
  RecordedEventEnvelope,
  RuntimeClock,
  TaskSnapshot,
} from "../core/task-runtime/contracts.js";
import { StaleTaskVersionError } from "../core/task-runtime/errors.js";
import type {
  RestaurantAgentDecisionPort,
} from "../domains/restaurant/agent-decision.js";
import type {
  RestaurantCommand,
  RestaurantEvent,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { restaurantBookingTaskDefinition } from "../domains/restaurant/task-definition.js";
import { missingBlockingFields, missingSearchFields } from "../domains/restaurant/intent-state.js";
import {
  type ConversationRecord,
  PostgresAgentWorkspaceStore,
} from "../infrastructure/postgres/postgres-agent-workspace-store.js";
import { PostgresTaskRuntime } from "../infrastructure/postgres/postgres-task-runtime.js";
import {
  PostgresRestaurantAgentTrajectoryStore,
  type RestaurantAgentTrajectoryStep,
} from "../infrastructure/postgres/restaurant-agent-trajectory-store.js";
import type { SqlDatabase } from "../infrastructure/postgres/sql-database.js";
import {
  type AgentWorkspaceMode,
  type ActivityItem,
  type AgentArtifact,
  type RestaurantCaseSummary,
  type RestaurantCaseView,
  type WorkspaceUser,
  caseStatus,
  pendingAction,
} from "./agent-workspace.js";
import {
  RestaurantExecutionRouter,
  type RestaurantAvailabilityPort,
  type RestaurantCandidateFactPort,
  type RestaurantSearchPort,
  type RestaurantExecutionRouterOptions,
} from "./restaurant-execution-router.js";
import {
  restaurantEventForMessage,
  type RestaurantSemanticInterpreterPort,
} from "./restaurant-message-handler.js";
import { RestaurantAgentLoopCoordinator, type RestaurantAgentLoopOptions } from "./restaurant-agent-loop.js";

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
      case "SEMANTIC_PROPOSAL_COMPILED":
        return {
          title: "Request updated",
          detail: "A validated semantic proposal was compiled into the Restaurant state path.",
        };
      case "SEMANTIC_CONFLICT_RECORDED":
        return { title: "Clarification needed", detail: event.event.conflict.message };
      case "AGENT_ASKED_USER":
        return { title: "Agent asks for input", detail: event.event.question };
      case "AGENT_DECISION_FAILED":
        return { title: "Agent model decision failed", detail: event.event.reason };
      case "AGENT_EXECUTION_FAILED":
        return { title: "Agent execution failed", detail: event.event.reason };
      case "AGENT_LOOP_TERMINATED":
        return { title: "Agent loop stopped", detail: `${event.event.termination}: ${event.event.reason}` };
      case "CANDIDATE_FACTS_REFRESH_REQUESTED":
        return { title: "Refresh recommendation facts", detail: `${event.event.candidateIds.length} displayed candidate(s) will be re-read.` };
      case "SEARCH_COMPLETED":
        return {
          title: "Restaurant search completed",
          detail: `${event.event.candidates.length} discovery candidate(s) are ready for evidence checks.`,
        };
      case "CANDIDATE_SELECTED":
        return { title: "Candidate selected", detail: event.event.candidateId };
      case "AVAILABILITY_CHECKED":
        return {
          title: "Availability checked",
          detail: `${event.event.offers.length} evidence-grounded availability offer(s) were observed.`,
        };
      case "AVAILABILITY_REFRESH_REQUESTED":
        return { title: "Availability refresh requested", detail: "Previously presented candidates will be rechecked read-only." };
      case "RESULTS_PRESENTED":
        return {
          title: "Read-only results presented",
          detail: `${event.event.candidateIds.length} evidence-grounded result(s) are ready.`,
        };
      case "SEARCH_FAILED":
        return { title: "Search failed", detail: event.event.reason };
      case "AVAILABILITY_FAILED":
        return { title: "Availability check failed", detail: event.event.reason };
      case "BOOKING_PROPOSED":
        return { title: "Authorization requested", detail: "A deterministic booking proposal is ready." };
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
      default:
        return {
          title: "Recorded event",
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
      if (state.pendingUserQuestion) return state.pendingUserQuestion.question;
      if (state.semanticConflict) {
        return "I found conflicting details in that message. Please clarify the restaurant, date, time, party size, or area you want to keep.";
      }
      return `Please add: ${(state.intentDraft?.target?.goal === "AVAILABILITY"
        ? missingBlockingFields(state.intentDraft ?? {})
        : missingSearchFields(state.intentDraft ?? {})).join(", ")}.`;
    case "AWAITING_AUTHORIZATION":
      return state.proposal
        ? `A booking proposal for ${state.proposal.target.counterparty ?? state.proposal.target.id} is ready. Your one-time authorization is required before any booking attempt.`
        : "A booking proposal is awaiting authorization.";
    case "SELECTION_REQUIRED":
      return "The current candidate cannot continue. The Agent will evaluate another safe option.";
    case "FAILED":
      {
        const resultKind = state.intentDraft?.target?.goal === "RECOMMENDATION"
          ? "evidence-grounded recommendation"
          : "verified availability result";
      return state.failure
        ? `The read-only investigation stopped: ${state.failure.message} No ${resultKind} was presented.`
        : `The read-only investigation stopped. No ${resultKind} was presented.`;
      }
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
  semanticInterpreter: RestaurantSemanticInterpreterPort;
  agentDecision: RestaurantAgentDecisionPort;
  restaurantSearch: RestaurantSearchPort;
  restaurantAvailability: RestaurantAvailabilityPort;
  restaurantFacts?: RestaurantCandidateFactPort;
  workspaceMode?: AgentWorkspaceMode;
  executionRouterOptions?: RestaurantExecutionRouterOptions;
  /** Local Live composition may need a longer read-only loop than Fixture workflows. */
  agentLoopOptions?: RestaurantAgentLoopOptions;
}

export class PersistentRestaurantAgentApplication {
  readonly store: PostgresAgentWorkspaceStore;
  private readonly runtime: RestaurantRuntime;
  private readonly interpreter: RestaurantSemanticInterpreterPort;
  private readonly agentLoop: RestaurantAgentLoopCoordinator;
  private readonly trajectories: PostgresRestaurantAgentTrajectoryStore;
  private readonly clock: RuntimeClock;
  private readonly createId: IdFactory;
  private readonly workspaceMode: AgentWorkspaceMode;

  constructor(options: PersistentRestaurantAgentOptions) {
    this.clock = options.clock ?? { now: () => new Date() };
    this.createId = options.createId ?? ((prefix) => `${prefix}:${randomUUID()}`);
    this.workspaceMode = options.workspaceMode ?? "FIXTURE";
    this.interpreter = options.semanticInterpreter;
    this.store = new PostgresAgentWorkspaceStore(options.database);
    this.runtime = new PostgresTaskRuntime(
      options.database,
      restaurantBookingTaskDefinition,
      this.clock,
      this.createId,
    );
    this.trajectories = new PostgresRestaurantAgentTrajectoryStore(options.database);
    this.agentLoop = new RestaurantAgentLoopCoordinator(
      this.runtime,
      options.agentDecision,
      new RestaurantExecutionRouter(options.restaurantSearch, options.restaurantAvailability, options.executionRouterOptions, options.restaurantFacts),
      this.trajectories,
      this.clock,
      options.agentLoopOptions,
      this.createId,
    );
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

  async getCase(userId: string, caseId: string): Promise<RestaurantCaseView> {
    return this.project(await this.requireCase(userId, caseId));
  }

  /** A user-visible refresh reopens displayed availability or recommendation facts, never booking. */
  async refreshAvailability(input: {
    userId: string;
    caseId: string;
    requestId: string;
    expectedVersion: number;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    const candidateIds = snapshot.domainState.presentedResults?.candidateIds;
    if (!candidateIds?.length) throw new Error("Refresh requires currently presented read-only results");
    const factOnly = snapshot.domainState.intentDraft?.target?.goal === "RECOMMENDATION";
    await this.runtime.dispatch(
      this.userEvent(snapshot, input.requestId, factOnly
        ? { type: "CANDIDATE_FACTS_REFRESH_REQUESTED", candidateIds: [...candidateIds] }
        : { type: "AVAILABILITY_REFRESH_REQUESTED", candidateIds: [...candidateIds] }),
      input.expectedVersion,
    );
    await this.store.appendMessage({
      id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`,
      conversationId: record.id,
      role: "USER",
      content: factOnly ? "Refresh recommendation facts" : "Refresh availability",
      requestId: `user:${input.requestId}`,
      createdAt: this.clock.now().toISOString(),
    });
    await this.agentLoop.run(record.rootTaskId);
    await this.appendAssistant(record, input.requestId);
    return this.project(record);
  }

  /** A browser-supplied, one-shot location is user input, not a server lookup. */
  async recordLocation(input: {
    userId: string; caseId: string; requestId: string; expectedVersion: number;
    latitude: number; longitude: number; accuracyMeters?: number;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    const area = snapshot.domainState.intentDraft?.area;
    if (!area) throw new Error("Location can be recorded after a location request is understood");
    if (area.query.trim().toLocaleLowerCase("en-US") !== "nearby") {
      throw new Error("Device location is accepted only for a nearby request; enter a place name to change an explicit area");
    }
    const now = this.clock.now().toISOString();
    await this.runtime.dispatch(this.userEvent(snapshot, input.requestId, {
      type: "SEMANTIC_PROPOSAL_COMPILED",
      patch: { schemaVersion: "3", area: { ...area, coordinates: { latitude: input.latitude, longitude: input.longitude, ...(input.accuracyMeters !== undefined ? { accuracyMeters: input.accuracyMeters } : {}), observedAt: now, source: "DEVICE" } } },
    }), input.expectedVersion);
    await this.store.appendMessage({ id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`, conversationId: record.id, role: "USER", content: "Device location shared for this search", requestId: `user:${input.requestId}`, createdAt: now });
    await this.agentLoop.run(record.rootTaskId);
    await this.appendAssistant(record, input.requestId);
    return this.project(record);
  }

  async listCases(userId: string): Promise<RestaurantCaseSummary[]> {
    const records = await this.store.listConversationsForUser(userId);
    return Promise.all(records.map(async (record) => (await this.project(record)).case));
  }

  async listAgentTrajectory(userId: string, caseId: string): Promise<RestaurantAgentTrajectoryStep[]> {
    const record = await this.requireCase(userId, caseId);
    return this.trajectories.list(record.rootTaskId);
  }

  private async applyMessage(
    record: ConversationRecord,
    message: string,
    requestId: string,
    expectedVersion: number,
  ): Promise<void> {
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    const event = await restaurantEventForMessage(this.interpreter, {
      taskId: record.rootTaskId,
      message,
      referenceTime: this.clock.now().toISOString(),
      timezone: "Asia/Tokyo",
      ...(snapshot.domainState.intentDraft
        ? { currentDraft: snapshot.domainState.intentDraft }
        : {}),
    });
    await this.runtime.dispatch(
      this.userEvent(snapshot, requestId, event),
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
    await this.agentLoop.run(record.rootTaskId);
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
        data: { candidates: structuredClone(state.candidates), availability: structuredClone(state.availability) },
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
      mode: this.workspaceMode,
      case: summary,
      conversation: { id: record.id, messages },
      restaurant: {
        ...(state.intentDraft ? { intentDraft: structuredClone(state.intentDraft) } : {}),
        missingRequiredFields: missingBlockingFields(state.intentDraft ?? {}),
        candidates: structuredClone(state.candidates),
        availability: structuredClone(state.availability),
        availabilityChecks: structuredClone(state.availabilityChecks),
        readEvidence: structuredClone(state.readEvidence),
        ...(state.presentedResults ? { presentedCandidateIds: [...state.presentedResults.candidateIds] } : {}),
        ...(state.selectedCandidateId ? { selectedCandidateId: state.selectedCandidateId } : {}),
      },
      artifacts,
      activities: events.map((event) => eventActivity(snapshot.id, event)),
      note: this.workspaceMode === "FIXTURE"
        ? "Fixture mode only. No real model, live availability, authorization, notification, or reservation is performed."
        : "Live read-only mode. Results require current source evidence; no authorization, booking, payment, cancellation, or personal-data submission is available.",
    };
  }
}

export { StaleTaskVersionError };
