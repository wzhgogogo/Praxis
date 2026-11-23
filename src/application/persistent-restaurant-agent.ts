import {canAskPageQuestion,canSettlePageQuestion,restaurantInvestigationReadRunId,restaurantReadyCandidateIds} from '../domains/restaurant/read-assessment.js';
import type { BookingHandoffView } from "../domains/restaurant/booking-handoff.js";
import type { BookingFeedbackAnswer, BookingFeedbackPrompt } from "../domains/restaurant/booking-feedback.js";
import { projectWorkspaceRead } from "./workspace-read-projection.js";
import { canContinueRestaurantRead, failedSourceRetryCandidateIds } from "../domains/restaurant/read-continuation.js";
import { RESTAURANT_PAGE_QUESTION_BUDGET, type RestaurantPageQuestionLimits } from "../domains/restaurant/page-question-limits.js";
import type { RestaurantPageQuestionPort, RestaurantPageAnswer } from "../domains/restaurant/page-question.js";
import type { ModelRunUsage } from "./run-bounded-model-gateway.js";
import { observedCandidateDistance } from "../domains/restaurant/candidate-read-observations.js";
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
  RestaurantReadExecutionMetadata,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { distinctDiscoveryResultCandidateIds, restaurantCurrentFactEvidence, restaurantPresentationEvidenceIds } from "../domains/restaurant/read-assessment.js";
import { restaurantIntentPatchHasChanges } from "../domains/restaurant/semantic-compiler.js";
import { restaurantBookingTaskDefinition } from "../domains/restaurant/task-definition.js";
import { applyRestaurantIntentPatch, missingBlockingFields, missingSearchFields } from "../domains/restaurant/intent-state.js";
import {namedOutletCandidateResolved} from "../domains/restaurant/named-outlet-resolution.js";
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
  type WorkspaceViewContext,
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
  type RestaurantPartySizeSupplementResolverPort,
  type RestaurantSemanticInterpreterPort,
} from "./restaurant-message-handler.js";
import { RestaurantAgentLoopCoordinator, type RestaurantAgentLoopOptions, type RestaurantAgentLoopResult } from "./restaurant-agent-loop.js";
import { bindUserBookingSelection, userBookingSelectionRequest, type UserBookingSelectionRequest } from "./restaurant-user-booking-selection.js";

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

/** Narrow local controls are intentionally recognized before semantic/model work. */
function isBrowseNextMessage(message: string): boolean {
  return /^(?:next(?:\s+(?:one|result))?|show\s+(?:me\s+)?the\s+next(?:\s+(?:one|result))?|下一家|下一个|左滑)$/iu.test(message.trim());
}

function isAnotherBatchMessage(message: string): boolean {
  return /^(?:another\s+(?:batch|set|three)|more\s+(?:options|restaurants)|换一批|再来一批|还有其他选择)$/iu.test(message.trim());
}

/** Preference-only feedback must not be routed through semantic condition edits. */
function selectionFeedback(message: string): string | undefined {
  const trimmed = message.trim();
  return /^(?:(?:(?:these|they|this(?:\s+one)?)\s+(?:are|is)\s+)?too\s+(?:expensive|pricey)|(?:这几家|这些)?太?贵了?|(?:これら|この店)?(?:は)?太貴です?)[.!。！]?$/iu.test(trimmed) ? trimmed : undefined;
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
      case "SEMANTIC_INTERPRETATION_FAILED":
        return { title: "Request interpretation failed", detail: event.event.reason };
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
      case "NEXT_BATCH_REPLENISHMENT_REQUESTED":
        return { title: "Another result batch requested", detail: `${event.event.targetCandidateCount} previously unshown qualified restaurant(s) are required.` };
      case "RESULT_VIEWED":
        return { title: "Result viewed", detail: event.event.candidateId };
      case "SHORTLIST_UPDATED":
        return { title: event.event.shortlisted ? "Added to shortlist" : "Removed from shortlist", detail: event.event.candidateId };
      case "SELECTION_FEEDBACK_RECORDED":
        return { title: "Selection feedback recorded", detail: "The preference will guide later comparison without changing conditions." };
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

function pageQuestionSummary(result: RestaurantPageAnswer): string {
  if (result.status === "UNVERIFIED") return "The page answer could not be verified.";
  return (result.status === "ANSWERED" ? result.answer : "Not stated on the page")
    + (result.confirmationRequired ? " Please confirm with the restaurant." : "");
}

function assistantSummary(state: RestaurantTaskState): string {
  const location = state.searchContinuation?.locationContext;
  const prefix = location?.areaMatchBasis === "NAMED_PLACE_RADIUS" ? `Searching around ${location.label}.\n` : "";
  return prefix + (() => {
  switch (state.phase) {
    case "NEEDS_INPUT":
      if (state.pendingUserQuestion) return state.pendingUserQuestion.question;
      if (state.semanticConflict) {
        return "I found conflicting details in that message. Please clarify the restaurant, date, time, party size, or area you want to keep.";
      }
      return `Please add: ${(state.intentDraft?.target?.goal === "AVAILABILITY"
        ? missingBlockingFields(state.intentDraft ?? {})
        : missingSearchFields(state.intentDraft ?? {})).join(", ")}.`;
    case "PRESENT_RESULTS": {
      const presented=new Set(state.presentedResults?.candidateIds??[]);
      const restaurants=state.candidates.filter(c=>presented.has(c.restaurant.id));
      return [`Found ${restaurants.length} restaurant${restaurants.length===1?"":"s"}.`,...restaurants.map(candidate=>{
        const slots=state.availability[candidate.restaurant.id]??[];
        const details=slots.map(slot=>{
          const local=new Intl.DateTimeFormat("en-CA",{timeZone:slot.timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(slot.dateTime));
          return `${local} for ${slot.partySize} guests`;
        });
        return `${candidate.restaurant.outletName}${details.length?": "+details.join("; "):""}.`;
      })].join("\n");
    }
    case "AWAITING_AUTHORIZATION":
      return state.proposal
        ? `A booking proposal for ${state.proposal.target.counterparty ?? state.proposal.target.id} is ready. Your one-time authorization is required before any booking attempt.`
        : "A booking proposal is awaiting authorization.";
    case "SELECTION_REQUIRED":
      return "The current candidate cannot continue. The Agent will evaluate another safe option.";
    case "NO_VERIFIED_RESULT":
      if(state.intentDraft?.target?.selectionScope==="SPECIFIC_OUTLET"){
        const draft=state.intentDraft;
        const visit=[draft.date,draft.timeWindow?`${draft.timeWindow.earliest}${draft.timeWindow.latest!==draft.timeWindow.earliest?`–${draft.timeWindow.latest}`:""}`:undefined,
          draft.partySize?`for ${draft.partySize} guests`:undefined].filter(Boolean).join(" ");
        return [`I couldn't verify ${draft.target!.goal==="AVAILABILITY"?"availability":"a result"} for ${draft.target!.query}${visit?` on ${visit}`:""}.`,
          ...(state.noVerifiedResult?.remainingGaps??[]),"Would you like me to look for other nearby restaurants?"].join("\n");
      }
      return ["This bounded read-only investigation found no result with evidence strong enough to present. It does not mean every restaurant is unavailable.", ...(state.noVerifiedResult?.remainingGaps ?? []), "You can refine the request to start a new investigation."].join("\n");
    case "FAILED":
      {
        const resultKind = state.intentDraft?.target?.goal === "RECOMMENDATION"
          ? "evidence-grounded recommendation"
          : "verified availability result";
      if (state.failure?.code === "AGENT_LOOP_CANCELLED") {
        return "This read-only investigation was cancelled. No result was presented; you can change the request and start a new investigation.";
      }
      return state.failure
        ? `The read-only investigation stopped: ${state.failure.message} No ${resultKind} was presented.`
        : `The read-only investigation stopped. No ${resultKind} was presented.`;
      }
    default:
      return "Your restaurant request has been updated.";
  }
  })();
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
  /** Optional, read-only inference after a primary semantic proposal lacks party size. */
  partySizeSupplementResolver?: RestaurantPartySizeSupplementResolverPort;
  agentDecision: RestaurantAgentDecisionPort;
  restaurantSearch: RestaurantSearchPort;
  restaurantAvailability: RestaurantAvailabilityPort;
  restaurantFacts?: RestaurantCandidateFactPort;
  restaurantQuestions?: RestaurantPageQuestionPort & Partial<import("./restaurant-booking-handoff.js").RestaurantBookingTermsRead>;
  pageQuestionLimits?: Readonly<RestaurantPageQuestionLimits>;
  workspaceMode?: AgentWorkspaceMode;
  executionRouterOptions: RestaurantExecutionRouterOptions;
  /** Local Live composition may need a longer read-only loop than Fixture workflows. */
  agentLoopOptions: RestaurantAgentLoopOptions;
  /** Explicit, caller-owned Live debugging limits included in exported Web artifacts only. */
  liveReadLimits?: Readonly<Record<string, number>>;
  /** Starts the whole read budget before semantic interpretation and preserves it through the asynchronous Agent loop. */
  modelRunBudget?: {
    run<T>(taskId: string, work: (signal: AbortSignal) => Promise<T>, deadlineAt?: number, publish?: boolean): Promise<T>;
    /** Keeps the parent read deadline alive while LIVE work continues after the HTTP mutation returns. */
    hold?(): () => void;
    /** Selects the committed edit as owner of exported usage, across overlapping contenders. */
    claim?(): void;
    usage(taskId: string): ModelRunUsage | undefined;
    publishedUsage?(taskId: string): ModelRunUsage | undefined;
    remainingCalls?(taskId: string): number | undefined;
  };
}

export type RestaurantCaseUpdateListener = (view: RestaurantCaseView) => void | Promise<void>;
export type RestaurantReadFinishedListener = (caseId: string) => void | Promise<void>;

interface ActiveRead {
  readonly handleId: string;
  committed: boolean;
  readonly semanticRequestId?: string;
  readonly questionRequestId?: string;
  readRunId: string;
  startedVersion: number;
  controller: AbortController;
  completion: Promise<void>;
  record: ConversationRecord;
  finish: () => void;
}

export class PersistentRestaurantAgentApplication {
  readonly store: PostgresAgentWorkspaceStore;
  private readonly runtime: RestaurantRuntime;
  private readonly committingReads = new Map<string, ActiveRead>();
  private readonly database: SqlDatabase;
  private readonly interpreter: RestaurantSemanticInterpreterPort;
  private readonly partySizeSupplementResolver: RestaurantPartySizeSupplementResolverPort | undefined;
  private readonly agentLoop: RestaurantAgentLoopCoordinator;
  private readonly trajectories: PostgresRestaurantAgentTrajectoryStore;
  private readonly clock: RuntimeClock;
  private readonly createId: IdFactory;
  private readonly workspaceMode: AgentWorkspaceMode;
  private readonly liveReadLimits: Readonly<Record<string, number>> | undefined;
  private readonly modelRunBudget: PersistentRestaurantAgentOptions["modelRunBudget"];
  private readonly pageQuestionLimits: Readonly<RestaurantPageQuestionLimits>;
  private readonly readTimeoutMs: number;
  private readonly bookingTerms: PersistentRestaurantAgentOptions["restaurantQuestions"];
  private readonly preparingHandles = new Map<string, ActiveRead>();
  private readonly activeReads = new Map<string, ActiveRead>();
  /** Current-process semantic work owns a task before the asynchronous loop exists. */
  private readonly preparingReads = new Map<string, number>();
  /** Narrow in-process guard for a duplicated HTTP delivery of one user message. */
  private readonly applyingUserMessages = new Map<string, Promise<unknown>>();
  private readonly updateListeners = new Set<RestaurantCaseUpdateListener>();
  private readonly readFinishedListeners = new Set<RestaurantReadFinishedListener>();

  constructor(options: PersistentRestaurantAgentOptions) {
    this.clock = options.clock ?? { now: () => new Date() };
    this.createId = options.createId ?? ((prefix) => `${prefix}:${randomUUID()}`);
    this.workspaceMode = options.workspaceMode ?? "FIXTURE";
    this.liveReadLimits = options.liveReadLimits;
    this.modelRunBudget = options.modelRunBudget;
    this.pageQuestionLimits = options.pageQuestionLimits ?? RESTAURANT_PAGE_QUESTION_BUDGET;
    this.readTimeoutMs = options.agentLoopOptions.timeoutMs;
    this.bookingTerms = options.restaurantQuestions;
    this.interpreter = options.semanticInterpreter;
    this.partySizeSupplementResolver = options.partySizeSupplementResolver;
    this.database = options.database;
    this.store = new PostgresAgentWorkspaceStore(options.database);
    this.runtime = new PostgresTaskRuntime(
      options.database,
      restaurantBookingTaskDefinition,
      this.clock,
      this.createId,
    );
    // A task row lock makes cancellation and the successor one persisted decision.
    const dispatch = this.runtime.dispatch.bind(this.runtime);
    this.runtime.dispatch = async (envelope, expectedVersion) => {
      const replacing = (envelope.event.type !== "SEMANTIC_PROPOSAL_COMPILED" || restaurantIntentPatchHasChanges(envelope.event.patch))
        && ["PAGE_QUESTION_REQUESTED", "SEMANTIC_PROPOSAL_COMPILED",
        "SEMANTIC_CONFLICT_RECORDED", "SEMANTIC_INTERPRETATION_FAILED"].includes(envelope.event.type);
      if (!replacing) return dispatch(envelope, expectedVersion);
      let replacedQuestion: {requestId:string;readRunId:string} | undefined;
      const result = await options.database.transaction(async transaction => {
        await transaction.query("SELECT id FROM tasks WHERE id = $1 FOR UPDATE", [envelope.taskId]);
        const database: SqlDatabase = {
          query: transaction.query.bind(transaction),
          transaction: async work => work(transaction),
        };
        const runtime = new PostgresTaskRuntime(database, restaurantBookingTaskDefinition, this.clock, this.createId);
        const current = await runtime.snapshot(envelope.taskId);
        const events = await runtime.listEvents(envelope.taskId);
        if (events.some(event => event.id === envelope.id)) return runtime.dispatch(envelope, current.version);
        const acceptsSystemProgress = envelope.event.type.startsWith("SEMANTIC_") || envelope.event.type === "PAGE_QUESTION_REQUESTED";
        if (expectedVersion !== undefined && (expectedVersion > current.version
          || expectedVersion !== current.version && (!acceptsSystemProgress
            || events.slice(expectedVersion).some(event => event.trace.actor === "USER")))) {
          throw new StaleTaskVersionError(expectedVersion, current.version);
        }
        const question = current.domainState.pageQuestion;
        let version = current.version;
        if (question) replacedQuestion = question;
        if (question && !question.result) {
          const completion = this.userEvent(current, "superseded-question:" + question.requestId, {
            type: "PAGE_QUESTION_COMPLETED", requestId: question.requestId, readRunId: question.readRunId,
            result: {status:"UNVERIFIED",candidateId:question.candidateId,reason:"CANCELLED",checkedPages:[]},
          });
          const settled = await runtime.dispatch({...completion,trace:{...completion.trace,actor:"SYSTEM"}}, version);
          version = settled.snapshot.version;

        }
        return runtime.dispatch(envelope, version);
      });
      const successor = this.committingReads.get(envelope.id);
      if (successor && !result.duplicateEvent) this.publishCommittedRead(successor, result.snapshot);
      if (replacedQuestion) {
        const handle = this.activeReads.get(envelope.taskId) ?? this.preparingHandles.get(envelope.taskId);
        if (handle?.questionRequestId === replacedQuestion.requestId && handle.readRunId === replacedQuestion.readRunId) {
          handle.controller.abort(new Error("The accepted question was superseded by a committed user operation."));
          if (this.preparingHandles.get(envelope.taskId) === handle) this.preparingHandles.delete(envelope.taskId);
          else await handle.completion;
        }
      }
      return result;
    };
    this.trajectories = new PostgresRestaurantAgentTrajectoryStore(options.database);
    const suppliedStateObserver = options.agentLoopOptions?.onStateUpdated;
    this.agentLoop = new RestaurantAgentLoopCoordinator(
      {
        snapshot: taskId => this.runtime.snapshot(taskId),
        listEvents: async taskId => this.runtime.listEvents(taskId),
        dispatch: async (envelope, expectedVersion) => {
          try { return await this.runtime.dispatch(envelope, expectedVersion); }
          catch (error) {
            // Saving a ready card must not invalidate an already-running read.
            // Reapply only its completed read/presentation event, once, after
            // proving every intervening transition was a shortlist edit.
            if (!(error instanceof StaleTaskVersionError) || expectedVersion === undefined
              || !["SEARCH_COMPLETED", "AVAILABILITY_CHECKED", "CANDIDATE_FACTS_CHECKED", "RESULTS_PRESENTED", "PAGE_QUESTION_COMPLETED"].includes(envelope.event.type)) throw error;
            return this.database.transaction(async transaction => {
              await transaction.query("SELECT id FROM tasks WHERE id = $1 FOR UPDATE", [envelope.taskId]);
              const runtime = new PostgresTaskRuntime({query:transaction.query.bind(transaction),transaction:async work=>work(transaction)},restaurantBookingTaskDefinition,this.clock,this.createId);
              const current = await runtime.snapshot(envelope.taskId);
              const intervening = (await runtime.listEvents(envelope.taskId)).slice(expectedVersion, current.version);
              if (current.runId !== envelope.trace.runId || !intervening.length
                || intervening.length !== current.version - expectedVersion
                || intervening.some(item => item.event.type !== "SHORTLIST_UPDATED")) throw error;
              if (envelope.event.type === "PAGE_QUESTION_COMPLETED") {
                const question=current.domainState.pageQuestion;
                if (!question || question.result || question.requestId!==envelope.event.requestId
                  || question.readRunId!==envelope.event.readRunId || question.candidateId!==envelope.event.result.candidateId) throw error;
              }
              return runtime.dispatch(envelope, current.version);
            });
          }
        },
      },
      options.agentDecision,
      new RestaurantExecutionRouter(options.restaurantSearch, options.restaurantAvailability, options.executionRouterOptions, options.restaurantFacts, options.restaurantQuestions),
      this.trajectories,
      this.clock,
      {
        ...options.agentLoopOptions,
        ...(options.modelRunBudget?.remainingCalls ? {
          remainingModelCalls: (taskId: string) => options.modelRunBudget!.remainingCalls!(taskId),
        } : {}),
        onStateUpdated: async (taskId) => {
          await suppliedStateObserver?.(taskId);
          const active = this.activeReads.get(taskId);
          if (active) await this.notifyCaseUpdate(active.record);
        },
      },
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

    // Register before publishing the conversation to list/get requests. Nested
    // and duplicate deliveries release only their own ownership reference.
    return this.withPreparingRead(taskId, async () => {
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
    });
  }

  /** Server adapters subscribe once; execution remains independent of HTTP/SSE. */
  subscribeCaseUpdates(listener: RestaurantCaseUpdateListener): () => void {
    this.updateListeners.add(listener);
    return () => this.updateListeners.delete(listener);
  }

  subscribeReadFinished(listener: RestaurantReadFinishedListener): () => void {
    this.readFinishedListeners.add(listener);
    return () => this.readFinishedListeners.delete(listener);
  }

  async submitMessage(input: {
    userId: string;
    conversationId: string;
    message: string;
    requestId: string;
    expectedVersion: number;
    viewContext?: WorkspaceViewContext;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireConversation(input.userId, input.conversationId);
    const key = `${record.rootTaskId}\u0000${input.requestId}`;
    const inFlight = this.applyingUserMessages.get(key);
    if (inFlight) {
      await inFlight;
      return this.project(record);
    }
    // Register the complete message path synchronously after authenticated
    // conversation lookup. A duplicate delivery can then join before any
    // version read, cancellation, interpreter, or supplement await.
    const work = this.submitMessageOnce(record, input);
    this.applyingUserMessages.set(key, work);
    try {
      return await work;
    } finally {
      this.applyingUserMessages.delete(key);
    }
  }

  private async submitMessageOnce(
    record: ConversationRecord,
    input: { userId: string; conversationId: string; message: string; requestId: string; expectedVersion: number; viewContext?: WorkspaceViewContext },
  ): Promise<RestaurantCaseView> {
    const priorActive = this.currentRead(record.rootTaskId, true);
    const beforeCancellation = await this.runtime.snapshot(record.rootTaskId);
    const events = await this.runtime.listEvents(record.rootTaskId);
    if (events.some(event => event.id === this.userEventId(record.rootTaskId, input.requestId))) return this.project(record);
    if (beforeCancellation.version < input.expectedVersion || events.slice(input.expectedVersion).some(event => event.trace.actor === "USER")) {
      throw new StaleTaskVersionError(input.expectedVersion, beforeCancellation.version);
    }
    const viewingContext = input.viewContext ? this.resolveViewingContext(beforeCancellation.domainState, input.viewContext) : undefined;
    if (beforeCancellation.domainState.phase === "PRESENT_RESULTS" && isBrowseNextMessage(input.message)) {
      return this.browseNextResult({
        userId: input.userId,
        caseId: record.rootTaskId,
        requestId: input.requestId,
        expectedVersion: input.expectedVersion,
        message: input.message,
      });
    }
    if (beforeCancellation.domainState.phase === "PRESENT_RESULTS" && isAnotherBatchMessage(input.message)) {
      return this.requestAnotherBatch({
        userId: input.userId,
        caseId: record.rootTaskId,
        requestId: input.requestId,
        expectedVersion: input.expectedVersion,
        message: input.message,
      });
    }
    const feedback = beforeCancellation.domainState.phase === "PRESENT_RESULTS" ? selectionFeedback(input.message) : undefined;
    if (feedback) {
      return this.recordSelectionFeedback({
        userId: input.userId,
        caseId: record.rootTaskId,
        requestId: input.requestId,
        expectedVersion: input.expectedVersion,
        feedback,
      });
    }
    const pendingQuestion = beforeCancellation.domainState.pageQuestion;
    if (pendingQuestion && !pendingQuestion.result) {
      return this.withPreparingRead(record.rootTaskId, async () => {
        // Keep the accepted question's handle until the successor transaction commits.
        const work=async (signal?:AbortSignal) => {
          const interpretedEvent = await restaurantEventForMessage(this.interpreter, {
            taskId: record.rootTaskId, message: input.message, referenceTime: this.clock.now().toISOString(),
            timezone: "Asia/Tokyo", ...(beforeCancellation.domainState.intentDraft ? {currentDraft:beforeCancellation.domainState.intentDraft} : {}),
            ...(viewingContext ? {viewingContext} : {}),
          }, this.partySizeSupplementResolver);
          const event=interpretedEvent.type==="SEMANTIC_PROPOSAL_COMPILED"
            ? bindUserBookingSelection(interpretedEvent,beforeCancellation.domainState):interpretedEvent;
          const sourced=event.type==="SEMANTIC_PROPOSAL_COMPILED"&&event.patch.partySizeSource
            ? {...event,partySizeSourceMessageRequestId:"user:"+input.requestId}:event;
          const envelope=this.userEvent(beforeCancellation,input.requestId,sourced);
          const replacing = !(event.type === "SEMANTIC_PROPOSAL_COMPILED" && !restaurantIntentPatchHasChanges(event.patch));
          const handle = replacing ? this.prepareRead(record, beforeCancellation, input.requestId, undefined, false) : undefined;
          if (handle) this.committingReads.set(envelope.id, handle);
          let result: Awaited<ReturnType<RestaurantRuntime['dispatch']>>;
          try { result = await this.runtime.dispatch(envelope, input.expectedVersion); }
          finally { this.committingReads.delete(envelope.id); }

          if (!result.duplicateEvent) {
            await this.store.appendMessage({
              id: "message:0:" + hash(record.id + ":" + input.requestId).slice(0,24), conversationId:record.id,
              role:"USER",content:input.message,requestId:"user:"+input.requestId,createdAt:this.clock.now().toISOString(),
            });
            if (result.snapshot.domainState.phase==="FAILED") {
              await this.notifyReadFinished(record.rootTaskId);
              await this.appendAssistant(record,input.requestId);
            } else if (result.snapshot.domainState.phase!=="NEEDS_INPUT"
              && !(event.type === "SEMANTIC_PROPOSAL_COMPILED" && !restaurantIntentPatchHasChanges(event.patch))) {
              await this.runAfterUserInput(record,input.requestId,result.snapshot,handle!,signal,undefined,
                userBookingSelectionRequest([...events,envelope]));
            }
            await this.notifyCaseUpdate(record);
          }
          return this.project(record);
        };
        return this.modelRunBudget ? this.modelRunBudget.run(record.rootTaskId,work,undefined,false):work();
      });
    }
    return this.withPreparingRead(record.rootTaskId, async () => {
      const validated = await this.cancelAndRecheck(record, input, priorActive,
        "The user changed the request, so the earlier read-only investigation was cancelled.");
      if (validated) await this.applyMessage(record, input.message, input.requestId, validated.version, viewingContext);
      return this.project(record);
    });
  }

  /** Explicit card follow-up: persistent identity, independently bounded work. */
  async askRestaurantQuestion(input: {userId:string;caseId:string;candidateId:string;question:string;requestId:string;expectedVersion:number}): Promise<RestaurantCaseView> {
    const submittedAt = this.clock.now();
    const record = await this.requireCase(input.userId,input.caseId);
    const key = "question:"+record.rootTaskId+"\\u0000"+input.requestId;
    const prior = this.applyingUserMessages.get(key);
    if (prior) { await prior; return this.project(record); }
    const work = async () => {
      const priorActive = this.currentRead(record.rootTaskId, true);
      const before = await this.runtime.snapshot(record.rootTaskId);
      const priorEvents = await this.runtime.listEvents(record.rootTaskId);
      if (priorEvents.some(event => event.id === this.userEventId(record.rootTaskId, input.requestId))) return;
      const scope = (state: RestaurantTaskState) =>
        canAskPageQuestion(state,input.candidateId,restaurantReadyCandidateIds(state,this.clock.now().toISOString()));
      if (before.version !== input.expectedVersion) throw new StaleTaskVersionError(input.expectedVersion, before.version);
      if (!scope(before.domainState) || !input.question.trim() || input.question.length > 2000)
        throw new Error("Question requires a displayed restaurant and 1–2000 characters");
      if (priorEvents.filter(event => event.event.type === "PAGE_QUESTION_REQUESTED").length >= this.pageQuestionLimits.maxQuestionsPerConversation)
        throw new Error("Restaurant question limit reached. Please start a new search.");
      const snapshot = await this.cancelAndRecheck(record, input, priorActive,
        "A newer displayed-restaurant question superseded the previous read", scope);
      if (!snapshot) return;
      const deadline = new Date(submittedAt.valueOf()+this.pageQuestionLimits.maxElapsedMs);
      const question = {requestId:input.requestId,question:input.question.trim(),candidateId:input.candidateId,
        readRunId:restaurantInvestigationReadRunId(snapshot.domainState, snapshot.runId),
        readStartedAt:snapshot.createdAt,deadlineAt:deadline.toISOString(),requestedAt:submittedAt.toISOString()};
      const result = await this.runtime.dispatch(this.userEvent(snapshot,input.requestId,{type:"PAGE_QUESTION_REQUESTED",question}),snapshot.version);
      if (result.duplicateEvent) return;
      // Admission may have committed before this continuation resumed. Serialize
      // registration with successors so an old question cannot claim their slot.
      const handle = await this.database.transaction(async transaction => {
        await transaction.query("SELECT id FROM tasks WHERE id = $1 FOR UPDATE", [record.rootTaskId]);
        const runtime = new PostgresTaskRuntime({
          query: transaction.query.bind(transaction), transaction: async work => work(transaction),
        }, restaurantBookingTaskDefinition, this.clock, this.createId);
        const current = await runtime.snapshot(record.rootTaskId);
        const pending = current.domainState.pageQuestion;
        if (!pending || pending.result || pending.requestId !== input.requestId
          || pending.readRunId !== question.readRunId || pending.candidateId !== input.candidateId) return;
        return this.prepareRead(record, result.snapshot, undefined, input.requestId);
      });
      await this.notifyCaseUpdate(record);
      await this.store.appendMessage({id:"message:0:"+hash(record.id+":"+input.requestId).slice(0,24),conversationId:record.id,
        role:"USER",content:input.question,requestId:"user:"+input.requestId,createdAt:this.clock.now().toISOString()});
      if (handle) await this.runAfterUserInput(record,input.requestId,result.snapshot,handle,undefined,deadline);
    };
    const pending = this.withPreparingRead(record.rootTaskId,work); this.applyingUserMessages.set(key,pending);
    try { await pending; } finally { this.applyingUserMessages.delete(key); }
    return this.project(record);
  }

  async recordBookingDeparture(input:{userId:string;caseId:string;expectedVersion:number;requestId:string;handoff:BookingHandoffView}) {
    await this.requireCase(input.userId,input.caseId);
    const snapshot=await this.runtime.snapshot(input.caseId);
    if(snapshot.version!==input.expectedVersion)throw new StaleTaskVersionError(input.expectedVersion,snapshot.version);
    const offer=snapshot.domainState.availability[input.handoff.candidateId]?.find(item=>item.id===input.handoff.offerId);
    if(!offer||offer.source!==input.handoff.provider)throw new Error("The handoff is no longer current");
    return this.store.recordBookingDeparture({userId:input.userId,caseId:input.caseId,expectedVersion:input.expectedVersion,
      requestId:input.requestId,candidateId:input.handoff.candidateId,offerId:input.handoff.offerId,provider:input.handoff.provider,now:this.clock.now().toISOString()});
  }
  async claimBookingFeedback(userId:string,caseId:string):Promise<BookingFeedbackPrompt|undefined> {
    await this.requireCase(userId,caseId);
    const departure=await this.store.claimBookingFeedback(userId,caseId,this.clock.now().toISOString());
    return departure ? {departure,question:"Did you get the booking?",options:["YES","NO","SKIP"]} : undefined;
  }
  async answerBookingFeedback(input:{userId:string;caseId:string;departureId:string;answer:BookingFeedbackAnswer}) {
    await this.requireCase(input.userId,input.caseId);
    if(!["YES","NO","SKIP"].includes(input.answer))throw new Error("Feedback must be Yes, No or Skip");
    return this.store.answerBookingFeedback({...input,now:this.clock.now().toISOString()});
  }

  async getCase(userId: string, caseId: string): Promise<RestaurantCaseView> {
    return this.project(await this.requireCase(userId, caseId));
  }

  /**
   * Advances only through the already-presented batch. It is a persisted user
   * event, so it survives reload and deliberately does not start model, Google,
   * browser, or reservation work.
   */
  async browseNextResult(input: {
    userId: string; caseId: string; requestId: string; expectedVersion: number; message?: string;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    if ((await this.runtime.listEvents(record.rootTaskId)).some(event => event.id === this.userEventId(record.rootTaskId, input.requestId))) return this.project(record);
    if (snapshot.version !== input.expectedVersion) throw new StaleTaskVersionError(input.expectedVersion, snapshot.version);
    const presented = snapshot.domainState.presentedResults?.candidateIds;
    if (snapshot.domainState.phase !== "PRESENT_RESULTS" || !presented?.length) {
      throw new Error("Browsing requires a currently presented restaurant result batch");
    }
    const viewed = new Set(snapshot.domainState.selectionSession?.viewedCandidateIds ?? []);
    const candidateId = presented.find((id) => !viewed.has(id));
    if (!candidateId) throw new Error("Every result in the current batch has already been viewed");
    const result = await this.runtime.dispatch(this.userEvent(snapshot, input.requestId, { type: "RESULT_VIEWED", candidateId }), input.expectedVersion);
    if (result.duplicateEvent) return this.project(record);
    await this.store.appendMessage({
      id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`,
      conversationId: record.id,
      role: "USER",
      content: input.message ?? "View next restaurant result",
      requestId: `user:${input.requestId}`,
      createdAt: this.clock.now().toISOString(),
    });
    await this.notifyCaseUpdate(record);
    return this.project(record);
  }

  /** Local shortlist management is deliberately separate from booking selection. */
  async setShortlist(input: {
    userId: string; caseId: string; candidateId: string; shortlisted: boolean; requestId: string; expectedVersion: number;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    if (snapshot.version !== input.expectedVersion) throw new StaleTaskVersionError(input.expectedVersion, snapshot.version);
    await this.runtime.dispatch(this.userEvent(snapshot, input.requestId, { type: "SHORTLIST_UPDATED", candidateId: input.candidateId, shortlisted: input.shortlisted }), input.expectedVersion);
    await this.store.appendMessage({
      id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`,
      conversationId: record.id,
      role: "USER",
      content: input.shortlisted ? `Add ${input.candidateId} to shortlist` : `Remove ${input.candidateId} from shortlist`,
      requestId: `user:${input.requestId}`,
      createdAt: this.clock.now().toISOString(),
    });
    await this.notifyCaseUpdate(record);
    return this.project(record);
  }

  /** Stores a preference without treating it as an evidenced fact or a condition change. */
  async recordSelectionFeedback(input: {
    userId: string; caseId: string; requestId: string; expectedVersion: number; feedback: string;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    if ((await this.runtime.listEvents(record.rootTaskId)).some(event => event.id === this.userEventId(record.rootTaskId, input.requestId))) return this.project(record);
    if (snapshot.version !== input.expectedVersion) throw new StaleTaskVersionError(input.expectedVersion, snapshot.version);
    const result = await this.runtime.dispatch(this.userEvent(snapshot, input.requestId, { type: "SELECTION_FEEDBACK_RECORDED", feedback: input.feedback }), input.expectedVersion);
    if (result.duplicateEvent) return this.project(record);
    await this.store.appendMessage({
      id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`,
      conversationId: record.id,
      role: "USER",
      content: input.feedback,
      requestId: `user:${input.requestId}`,
      createdAt: this.clock.now().toISOString(),
    });
    await this.notifyCaseUpdate(record);
    return this.project(record);
  }

  /**
   * A same-condition batch consumes only already-grounded, unshown results.
   * It deliberately avoids source reads while a complete next batch is already
   * grounded. When the queue is inadequate it records an explicit bounded
   * replenishment request, then the existing Agent loop may use only its
   * ordinary legal continuation/fact/availability actions.
   */
  async requestAnotherBatch(input: {
    userId: string; caseId: string; requestId: string; expectedVersion: number; message?: string;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const priorActive = this.currentRead(record.rootTaskId, true);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    const eventId = this.userEventId(record.rootTaskId, input.requestId);
    if ((await this.runtime.listEvents(record.rootTaskId)).some(event => event.id === eventId)) return this.project(record);
    if (snapshot.domainState.pageQuestion && !snapshot.domainState.pageQuestion.result) throw new Error("Finish or cancel the current restaurant question first");
    if (snapshot.version !== input.expectedVersion) throw new StaleTaskVersionError(input.expectedVersion, snapshot.version);
    const empty = snapshot.domainState.phase === "NO_VERIFIED_RESULT";
    if (empty ? !canContinueRestaurantRead(snapshot.domainState, this.clock.now().toISOString()) : snapshot.domainState.phase !== "PRESENT_RESULTS") throw new Error("Another batch requires presented results or proven unread work");
    const scope = (state: RestaurantTaskState) => JSON.stringify([
      state.phase, state.presentedResults?.candidateIds, state.selectionSession?.deliveredCandidateIds,
    ]);
    const originalScope = scope(snapshot.domainState);
    return this.withPreparingRead(record.rootTaskId, async () => {
      const validated = await this.cancelAndRecheck(record, input, priorActive, "A new result batch superseded the earlier read for this Case.",
        state => scope(state) === originalScope
          && (state.phase !== "NO_VERIFIED_RESULT" || canContinueRestaurantRead(state, this.clock.now().toISOString())));
      if (!validated) return this.project(record);
      if (validated.domainState.pageQuestion && !validated.domainState.pageQuestion.result) throw new Error("Finish or cancel the current restaurant question first");
      const delivered = validated.domainState.selectionSession?.deliveredCandidateIds ?? validated.domainState.presentedResults?.candidateIds ?? [];
      const unshownEligible = validated.domainState.candidates.map(candidate => candidate.restaurant.id)
        .filter(candidateId => !delivered.includes(candidateId)
          && restaurantPresentationEvidenceIds(validated.domainState, candidateId, this.clock.now().toISOString()) !== undefined);
      const candidates = distinctDiscoveryResultCandidateIds(validated.domainState, unshownEligible, delivered).slice(0, 3);
      if (candidates.length < 3) {
        const result = await this.runtime.dispatch(this.userEvent(validated, input.requestId, { type: "NEXT_BATCH_REPLENISHMENT_REQUESTED", targetCandidateCount: 3 }), validated.version);
        if (result.duplicateEvent) return this.project(record);
        const handle = this.prepareRead(record, result.snapshot);
        await this.store.appendMessage({
          id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`,
          conversationId: record.id,
          role: "USER",
          content: input.message ?? "Show another restaurant batch",
          requestId: `user:${input.requestId}`,
          createdAt: this.clock.now().toISOString(),
        });
        await this.runUserInitiatedRead(record, input.requestId, result.snapshot, handle);
        return this.project(record);
      }
      const evidenceIds = candidates.flatMap((candidateId) => restaurantPresentationEvidenceIds(validated.domainState, candidateId, this.clock.now().toISOString()) ?? []);
      const result = await this.runtime.dispatch(this.userEvent(validated, input.requestId, { type: "RESULTS_PRESENTED", candidateIds: candidates, evidenceIds }), validated.version);
      if (result.duplicateEvent) return this.project(record);
      await this.store.appendMessage({
        id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`,
        conversationId: record.id,
        role: "USER",
        content: input.message ?? "Show another restaurant batch",
        requestId: `user:${input.requestId}`,
        createdAt: this.clock.now().toISOString(),
      });
      await this.notifyCaseUpdate(record);
      return this.project(record);
    });
  }

  /** A user-visible refresh reopens displayed availability or recommendation facts, never booking. */
  async refreshAvailability(input: {
    userId: string;
    caseId: string;
    requestId: string;
    expectedVersion: number;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const priorActive = this.currentRead(record.rootTaskId, true);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    const eventId = this.userEventId(record.rootTaskId, input.requestId);
    if ((await this.runtime.listEvents(record.rootTaskId)).some(event => event.id === eventId)) return this.project(record);
    if (snapshot.domainState.pageQuestion && !snapshot.domainState.pageQuestion.result) throw new Error("Finish or cancel the current restaurant question first");
    if (snapshot.version !== input.expectedVersion) throw new StaleTaskVersionError(input.expectedVersion, snapshot.version);
    const target = (state: RestaurantTaskState) => {
      const retry = failedSourceRetryCandidateIds(state, this.clock.now().toISOString());
      const presented = state.phase === "PRESENT_RESULTS" ? state.presentedResults?.candidateIds : undefined;
      return { retry, presented };
    };
    const originalTarget = target(snapshot.domainState);
    const { retry, presented } = originalTarget;
    if (!retry.length && !presented?.length) throw new Error("Refresh requires currently presented read-only results");
    return this.withPreparingRead(record.rootTaskId, async () => {
      const validated = await this.cancelAndRecheck(record, input, priorActive, "A refresh superseded the earlier read for this Case.",
        state => JSON.stringify(target(state)) === JSON.stringify(originalTarget));
      if (!validated) return this.project(record);
      if (validated.domainState.pageQuestion && !validated.domainState.pageQuestion.result) throw new Error("Finish or cancel the current restaurant question first");
      const candidateIds = retry.length ? retry : presented!;
      const candidateIdsWithDisplayedSlots = candidateIds.filter((candidateId) =>
        (validated.domainState.availability[candidateId]?.length ?? 0) > 0 || validated.domainState.availabilityChecks[candidateId]?.status === "AVAILABLE",
      );
      // A recommendation is normally fact-only, but a previously displayed
      // live slot is an inventory claim and must be refreshed as inventory.
      // Other shown recommendation candidates retain their ordinary bounded fact
      // refresh rather than forcing an availability read without visit inputs.
      const refreshSlots = retry.length > 0 || candidateIdsWithDisplayedSlots.length > 0 || validated.domainState.intentDraft?.target?.goal === "AVAILABILITY";
      const result = await this.runtime.dispatch(
        this.userEvent(validated, input.requestId, refreshSlots
          ? { type: "AVAILABILITY_REFRESH_REQUESTED", candidateIds: retry.length ? retry : candidateIdsWithDisplayedSlots.length ? candidateIdsWithDisplayedSlots : candidateIds }
          : { type: "CANDIDATE_FACTS_REFRESH_REQUESTED", candidateIds: [...candidateIds] }),
        validated.version,
      );
      if (result.duplicateEvent) return this.project(record);
      const handle = this.prepareRead(record, result.snapshot);
      await this.store.appendMessage({
        id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`,
        conversationId: record.id,
        role: "USER",
        content: refreshSlots ? "Refresh displayed availability" : "Refresh recommendation facts",
        requestId: `user:${input.requestId}`,
        createdAt: this.clock.now().toISOString(),
      });
      await this.runUserInitiatedRead(record, input.requestId, result.snapshot, handle);
      return this.project(record);
    });
  }

  /** A browser-supplied, one-shot location is user input, not a server lookup. */
  async recordLocation(input: {
    userId: string; caseId: string; requestId: string; expectedVersion: number;
    latitude: number; longitude: number; accuracyMeters?: number;
  }): Promise<RestaurantCaseView> {
    const record = await this.requireCase(input.userId, input.caseId);
    const priorActive = this.currentRead(record.rootTaskId, true);
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    const eventId = this.userEventId(record.rootTaskId, input.requestId);
    if ((await this.runtime.listEvents(record.rootTaskId)).some(event => event.id === eventId)) return this.project(record);
    if (snapshot.domainState.pageQuestion && !snapshot.domainState.pageQuestion.result) throw new Error("Finish or cancel the current restaurant question first");
    if (snapshot.version !== input.expectedVersion) throw new StaleTaskVersionError(input.expectedVersion, snapshot.version);
    if (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90 || !Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180
      || input.accuracyMeters !== undefined && (!Number.isFinite(input.accuracyMeters) || input.accuracyMeters < 0)) throw new Error("Location requires valid coordinates");
    const originalArea = snapshot.domainState.intentDraft?.area;
    if (!originalArea) throw new Error("Location can be recorded after a location request is understood");
    if (originalArea.query.trim().toLocaleLowerCase("en-US") !== "nearby") {
      throw new Error("Device location is accepted only for a nearby request; enter a place name to change an explicit area");
    }
    const originalScope = JSON.stringify(originalArea);
    return this.withPreparingRead(record.rootTaskId, async () => {
      const validated = await this.cancelAndRecheck(record, input, priorActive, "New device location superseded the earlier read for this Case.",
        state => JSON.stringify(state.intentDraft?.area) === originalScope);
      if (!validated) return this.project(record);
      if (validated.domainState.pageQuestion && !validated.domainState.pageQuestion.result) throw new Error("Finish or cancel the current restaurant question first");
      const area = validated.domainState.intentDraft?.area;
      if (!area || area.query.trim().toLocaleLowerCase("en-US") !== "nearby") throw new Error("Device location is accepted only for a nearby request");
      const now = this.clock.now().toISOString();
      const result = await this.runtime.dispatch(this.userEvent(validated, input.requestId, {
        type: "SEMANTIC_PROPOSAL_COMPILED",
        patch: { schemaVersion: "3", area: { ...area, coordinates: { latitude: input.latitude, longitude: input.longitude, ...(input.accuracyMeters !== undefined ? { accuracyMeters: input.accuracyMeters } : {}), observedAt: now, source: "DEVICE" } } },
      }), validated.version);
      if (result.duplicateEvent) return this.project(record);
      const handle = this.prepareRead(record, result.snapshot);
      await this.store.appendMessage({ id: `message:0:${hash(`${record.id}:${input.requestId}`).slice(0, 24)}`, conversationId: record.id, role: "USER", content: "Device location shared for this search", requestId: `user:${input.requestId}`, createdAt: now });
      await this.runUserInitiatedRead(record, input.requestId, result.snapshot, handle);
      return this.project(record);
    });
  }

  async listCases(userId: string): Promise<RestaurantCaseSummary[]> {
    const records = await this.store.listConversationsForUser(userId);
    const summaries = await Promise.all(records.map(async record => (await this.project(record)).case));
    return summaries.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.caseId.localeCompare(b.caseId));
  }

  /** Cancels only the active read owned by this Case; it never touches an external booking flow. */
  async cancelCase(userId: string, caseId: string, expected: {readRunId: string; expectedVersion: number; handleId?: string}): Promise<RestaurantCaseView> {
    const record = await this.requireCase(userId, caseId);
    const active = this.currentRead(record.rootTaskId);
    if (!active) return this.project(record);
    // Preparation can persist a new investigation before its dispatch promise
    // hands the new identity back to the handle. The exact owner, observed
    // version and either request-owned or persisted identity must still match.
    const preparing = this.preparingHandles.get(record.rootTaskId) === active;
    const matchesPreparing = (current: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>) =>
      this.preparingHandles.get(record.rootTaskId) === active
      && (expected.handleId!==undefined ? active.handleId===expected.handleId
        : active.startedVersion<=expected.expectedVersion && expected.expectedVersion<=current.version
          && (expected.readRunId===active.readRunId || expected.readRunId===current.runId+":investigation:"+String(current.domainState.investigationRevision??0)));
    if(expected.handleId!==undefined){
      if(active.handleId!==expected.handleId){const current=await this.runtime.snapshot(record.rootTaskId);throw new StaleTaskVersionError(expected.expectedVersion,current.version);}
    } else if (preparing) {
      const current = await this.runtime.snapshot(record.rootTaskId);
      const activated = this.activeReads.get(record.rootTaskId) === active
        && active.readRunId === expected.readRunId && active.startedVersion <= expected.expectedVersion
        && expected.expectedVersion <= current.version;
      if (!matchesPreparing(current) && !activated) throw new StaleTaskVersionError(expected.expectedVersion, current.version);
    } else if (active.readRunId !== expected.readRunId || active.startedVersion > expected.expectedVersion) {
      const current = await this.runtime.snapshot(record.rootTaskId);
      throw new StaleTaskVersionError(expected.expectedVersion, current.version);
    }
    active.controller.abort(new Error("The user cancelled this read-only investigation."));
    if (preparing && this.preparingHandles.get(record.rootTaskId) === active) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const snapshot = await this.runtime.snapshot(record.rootTaskId);
        if (!matchesPreparing(snapshot))
          throw new StaleTaskVersionError(expected.expectedVersion, snapshot.version);
        const q = snapshot.domainState.pageQuestion;
        const event: RestaurantEvent = q && canSettlePageQuestion(snapshot.domainState, q, restaurantInvestigationReadRunId(snapshot.domainState, snapshot.runId))
          ? {type:"PAGE_QUESTION_COMPLETED",requestId:q.requestId,readRunId:q.readRunId,
              result:{status:"UNVERIFIED",candidateId:q.candidateId,reason:"CANCELLED",checkedPages:[]}}
          : {type:"AGENT_LOOP_TERMINATED",termination:"CANCELLED",reason:"The user cancelled this read-only investigation."};
        try {
          await this.runtime.dispatch(this.userEvent(snapshot, this.createId("stop"), event), snapshot.version);
          break;
        } catch (error) {
          if (!(error instanceof StaleTaskVersionError) || attempt === 3) throw error;
        }
      }
    } else await active.completion;
    return this.project(record);
  }

  /** Graceful local shutdown records a safe end state instead of leaving an invisible run. */
  async stopActiveReads(): Promise<void> {
    const active = [...this.activeReads.values()];
    for (const read of active) read.controller.abort(new Error("The local read service stopped before this investigation completed."));
    await Promise.all(active.map((read) => read.completion));
  }

  async listAgentTrajectory(userId: string, caseId: string): Promise<RestaurantAgentTrajectoryStep[]> {
    const record = await this.requireCase(userId, caseId);
    return this.trajectories.list(record.rootTaskId);
  }

  /** Safe, no-raw-message execution record for the existing deterministic evaluator. */
  async exportReadArtifact(caseId: string): Promise<Record<string, unknown> & { status: "SUCCEEDED" | "FAILED" | "CANCELLED" }> {
    const [snapshot, events, trajectories] = await Promise.all([
      this.runtime.snapshot(caseId),
      this.runtime.listEvents(caseId),
      this.trajectories.list(caseId),
    ]);
    const inputIntent = events
      .filter((event): event is RecordedEventEnvelope<Extract<RestaurantEvent, { type: "SEMANTIC_PROPOSAL_COMPILED" }>> => event.event.type === "SEMANTIC_PROPOSAL_COMPILED")
      .reduce<RestaurantTaskState["intentDraft"]>((current, event) => applyRestaurantIntentPatch(current, event.event.patch), undefined);
    const intent = inputIntent ?? snapshot.domainState.intentDraft;
    const semantic = intent ? {
      ...(intent.target ? { target: structuredClone(intent.target) } : {}),
      ...(intent.date ? { date: { value: intent.date } } : {}),
      ...(intent.partySize !== undefined ? { party_size: intent.partySize } : {}),
      ...(intent.partySizeSource ? { party_size_source: intent.partySizeSource } : {}),
      ...(intent.timeWindow ? { time: intent.timeWindow.earliest === intent.timeWindow.latest ? { value: intent.timeWindow.earliest } : { start: intent.timeWindow.earliest, end: intent.timeWindow.latest } } : {}),
      ...(intent.permittedAlternativeTimeWindow ? { permittedAlternativeTimeWindow: structuredClone(intent.permittedAlternativeTimeWindow) } : {}),
      ...(intent.area ? { location: { value: intent.area.query, relation: "NEAR" } } : {}),
      criteria: (intent.criteria ?? []).map((criterion) => ({ value: criterion.text, polarity: criterion.polarity, strength: criterion.strength })),
    } : undefined;
    const lastOutcome = trajectories.at(-1)?.stepOutcome;
    const loopStatus = snapshot.domainState.phase === "PRESENT_RESULTS" || snapshot.domainState.phase === "NO_VERIFIED_RESULT"
      ? "TERMINAL"
      : lastOutcome === "CANCELLED" ? "CANCELLED" : lastOutcome ?? "NOT_RECORDED";
    // A whole-read budget is started before semantic work and released when
    // the Live loop finishes. It is the only elapsed-time measure for that
    // run; a Case's lifetime may contain later user turns.
    const lifecycleElapsedMs = Math.max(0, Date.parse(snapshot.updatedAt) - Date.parse(snapshot.createdAt));
    const agentDecisions = trajectories.filter((step) => step.modelAttempt?.purpose === "restaurant_agent_decide").length;
    const googleRequests = trajectories.reduce<RestaurantReadExecutionMetadata["googleRequests"]>((latest, step) => {
      const usage = step.executionMetadata?.googleRequests;
      return usage && (!latest || usage.total >= latest.total) ? structuredClone(usage) : latest;
    }, undefined);
    const status = loopStatus === "CANCELLED" ? "CANCELLED" : ["PRESENT_RESULTS", "NO_VERIFIED_RESULT"].includes(snapshot.domainState.phase) ? "SUCCEEDED" : "FAILED";
    const modelUsage = this.modelRunBudget?.publishedUsage ? this.modelRunBudget.publishedUsage(caseId) : this.modelRunBudget?.usage(caseId);
    return {
      schemaVersion: "1",
      mode: "WEB_READ",
      caseId,
      runId: snapshot.runId,
      status,
      stage: "AGENT_LOOP",
      ...(semantic ? { materializedCase: { semantic } } : {}),
      requestMetadata: { sha256: hash(JSON.stringify(semantic ?? {})) },
      events,
      trajectories,
      finalSnapshot: snapshot,
      loop: { status: loopStatus },
      resourceUsage: { elapsedMs: modelUsage?.elapsedMs ?? lifecycleElapsedMs, agentDecisions, ...(googleRequests ? { googleRequests } : {}), ...(modelUsage ? { modelCallsStarted: modelUsage.calls } : {}) },
      resourceAccounting: { browserModelCalls: "UNKNOWN", cost: "UNKNOWN" },
      ...(this.bookingTerms?.readBookingTermsDiagnostics?{bookingTermsDiagnostics:this.bookingTerms.readBookingTermsDiagnostics(caseId)}:{}),
      ...(this.liveReadLimits ? { limits: structuredClone(this.liveReadLimits) } : {}),
      safety: { policy: "READ_ONLY_CODE_PATH", externalSideEffectCount: "NOT_MEASURED" },
    };
  }

  private resolveViewingContext(state: RestaurantTaskState, context: WorkspaceViewContext): import("../domains/restaurant/semantic-interpreter.js").RestaurantSemanticViewingContext {
    if (context.view === "HOME" && (context.candidateId || context.comparedCandidateIds.length)) throw new Error("Home has no restaurant reference");
    const outlet = (id: string) => {
      const candidate = state.candidates.find(item => item.restaurant.id === id);
      if (!candidate) throw new Error("Current view references a restaurant outside this Case");
      return {id, outletName:candidate.restaurant.outletName, address:candidate.restaurant.address};
    };
    return {view:context.view, ...(context.candidateId ? {candidate:outlet(context.candidateId)} : {}), comparedCandidates:context.comparedCandidateIds.map(outlet)};
  }

  private async applyMessage(
    record: ConversationRecord,
    message: string,
    requestId: string,
    expectedVersion: number,
    viewingContext?: import("../domains/restaurant/semantic-interpreter.js").RestaurantSemanticViewingContext,
  ): Promise<void> {
    await this.withPreparingRead(record.rootTaskId, async () => {
      const handle = this.prepareRead(record, await this.runtime.snapshot(record.rootTaskId),requestId);
      await this.notifyCaseUpdate(record);
      const work = (signal?: AbortSignal) => this.applyMessageOnce(record, message, requestId, expectedVersion, handle, signal, viewingContext);
      if (this.modelRunBudget) await this.modelRunBudget.run(record.rootTaskId, (signal) => work(signal), undefined, false);
      else await work();
    });
  }

  private async withPreparingRead<T>(taskId: string, work: () => Promise<T>): Promise<T> {
    this.preparingReads.set(taskId, (this.preparingReads.get(taskId) ?? 0) + 1);
    try {
      return await work();
    } finally {
      const remaining = this.preparingReads.get(taskId)! - 1;
      if (remaining === 0) {
        this.preparingReads.delete(taskId);
        const pending = this.preparingHandles.get(taskId);
        if (pending && !this.activeReads.has(taskId)) {
          this.preparingHandles.delete(taskId);
          pending.finish();
        }
      }
      else this.preparingReads.set(taskId, remaining);
    }
  }

  /**
   * Refresh, another-batch replenishment, and a newly supplied location each
   * begin a fresh Web investigation.  Unlike `applyMessage`, they have no
   * semantic wrapper already carrying the whole-read deadline, so create one
   * here before launching the asynchronous Agent loop.
   */
  private async runUserInitiatedRead(record: ConversationRecord, requestId: string, started: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>, handle: ActiveRead): Promise<void> {
    await this.withPreparingRead(record.rootTaskId, async () => {
      if (!this.modelRunBudget || this.activeReads.has(record.rootTaskId)) {
        await this.runAfterUserInput(record, requestId, started, handle);
        return;
      }
      await this.modelRunBudget.run(record.rootTaskId, (signal) => this.runAfterUserInput(record, requestId, started, handle, signal));
    });
  }

  private async applyMessageOnce(
    record: ConversationRecord,
    message: string,
    requestId: string,
    expectedVersion: number,
    handle: ActiveRead,
    runDeadlineSignal?: AbortSignal,
    viewingContext?: import("../domains/restaurant/semantic-interpreter.js").RestaurantSemanticViewingContext,
  ): Promise<void> {
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    const userEventId = this.userEventId(snapshot.id, requestId);
    // A retried HTTP request must not repeat an untrusted resolver call before
    // the runtime's ordinary event-id idempotency can take effect.
    const priorEvents = await this.runtime.listEvents(record.rootTaskId);
    if (priorEvents.some((recorded) => recorded.id === userEventId)) return;
    if (handle.controller.signal.aborted) return;
    if (this.preparingHandles.get(record.rootTaskId) !== handle)
      return this.rejectSupersededPreparation(record, handle, requestId, expectedVersion);
    const interpretedEvent = await restaurantEventForMessage(this.interpreter, {
      taskId: record.rootTaskId,
      message,
      referenceTime: this.clock.now().toISOString(),
      timezone: "Asia/Tokyo",
      ...(viewingContext ? {viewingContext} : {}),
      ...(snapshot.domainState.intentDraft
        ? { currentDraft: snapshot.domainState.intentDraft }
        : {}),
    }, this.partySizeSupplementResolver);
    if (handle.controller.signal.aborted) return;
    if (this.preparingHandles.get(record.rootTaskId) !== handle)
      return this.rejectSupersededPreparation(record, handle, requestId, expectedVersion);
    const event = interpretedEvent.type === "SEMANTIC_PROPOSAL_COMPILED"
      ? bindUserBookingSelection(interpretedEvent, snapshot.domainState) : interpretedEvent;
    const eventWithPartySource = event.type === "SEMANTIC_PROPOSAL_COMPILED" && event.patch.partySizeSource
      ? { ...event, partySizeSourceMessageRequestId: `user:${requestId}` }
      : event;
    const envelope = this.userEvent(snapshot, requestId, eventWithPartySource);
    let result: Awaited<ReturnType<RestaurantRuntime['dispatch']>>;
    try {result=await this.runtime.dispatch(envelope,expectedVersion);}
    catch(error){if(error instanceof StaleTaskVersionError&&handle.controller.signal.aborted)return;throw error;}
    if (handle.controller.signal.aborted) return;
    if (result.duplicateEvent) return;
    this.publishCommittedRead(handle, result.snapshot);
    await this.notifyCaseUpdate(record);
    if(handle.controller.signal.aborted)return;
    await this.store.appendMessage({
      id: `message:0:${hash(`${record.id}:${requestId}`).slice(0, 24)}`,
      conversationId: record.id,
      role: "USER",
      content: message,
      requestId: `user:${requestId}`,
      createdAt: this.clock.now().toISOString(),
    });
    const updated = await this.runtime.snapshot(record.rootTaskId);
    if (updated.domainState.phase === "FAILED") {
      await this.notifyReadFinished(record.rootTaskId);
      await this.appendAssistant(record, requestId);
      await this.notifyCaseUpdate(record);
      return;
    }
    await this.runAfterUserInput(record, requestId, result.snapshot, handle, runDeadlineSignal, undefined,
      userBookingSelectionRequest([...priorEvents, envelope]));
  }

  /** An already recorded request remains idempotent; an uncommitted loser is a conflict. */
  private async rejectSupersededPreparation(record: ConversationRecord, handle: ActiveRead, requestId: string, expectedVersion: number): Promise<void> {
    const events = await this.runtime.listEvents(record.rootTaskId);
    if (handle.controller.signal.aborted || events.some(event => event.id === this.userEventId(record.rootTaskId, requestId))) return;
    const current = await this.runtime.snapshot(record.rootTaskId);
    if (handle.controller.signal.aborted) return;
    throw new StaleTaskVersionError(expectedVersion, current.version);
  }

  private prepareRead(record: ConversationRecord, snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,semanticRequestId?:string, questionRequestId?:string, register = true): ActiveRead {
    let finish!: () => void;
    const handle: ActiveRead = {
      committed:!semanticRequestId, handleId:this.createId("read-handle"),...(semanticRequestId?{semanticRequestId}:{}), ...(questionRequestId?{questionRequestId}:{}), record, controller:new AbortController(), completion:new Promise<void>(resolve=>{finish=resolve;}),
      finish:()=>finish(), startedVersion:snapshot.version,
      readRunId:snapshot.runId+":investigation:"+String(snapshot.domainState.investigationRevision??0),
    };
    if (register) this.preparingHandles.set(record.rootTaskId,handle);
    return handle;
  }

  /** A committed successor outranks the previous worker while it drains. */
  private currentRead(taskId: string, committedOnly = false): ActiveRead | undefined {
    const active = this.activeReads.get(taskId), pending = this.preparingHandles.get(taskId);
    const preparing = committedOnly && !pending?.committed ? undefined : pending;
    return preparing && (!active || preparing.startedVersion > active.startedVersion) ? preparing : active;
  }

  private publishCommittedRead(handle: ActiveRead, snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>): void {
    handle.committed = true;
    handle.startedVersion = snapshot.version;
    handle.readRunId = restaurantInvestigationReadRunId(snapshot.domainState, snapshot.runId);
    const owner = this.currentRead(snapshot.id);
    if (!owner || owner.startedVersion <= handle.startedVersion) {
      this.preparingHandles.set(snapshot.id, handle);
      this.modelRunBudget?.claim?.();
    }
  }

  private async runAfterUserInput(record: ConversationRecord, requestId: string, started: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>, handle: ActiveRead, runDeadlineSignal?: AbortSignal, questionDeadline?: Date, userSelection?: UserBookingSelectionRequest): Promise<void> {
    if (handle.controller.signal.aborted) return;
    if (this.preparingHandles.get(record.rootTaskId) !== handle)
      return this.rejectSupersededPreparation(record, handle, requestId, started.version);
    // Map the enclosing wall-clock deadline to the Runtime clock once; semantic
    // work has already consumed part of this same read, including its reserve.
    const usage = this.modelRunBudget?.usage(record.rootTaskId);
    const clockNow = this.clock.now();
    const readDeadline = questionDeadline ?? new Date(clockNow.valueOf() + (usage ? Math.max(0,usage.deadlineAt-usage.startedAt-usage.elapsedMs) : this.readTimeoutMs));
    if (this.workspaceMode === "FIXTURE") {
      const read = async () => {
        const result = await this.agentLoop.run(record.rootTaskId, runDeadlineSignal, readDeadline, userSelection);
        if(!questionDeadline)await this.bookingTerms?.readBookingTerms?.(await this.project(record), readDeadline.toISOString(), runDeadlineSignal ?? new AbortController().signal);
        return result;
      };
      const result = await (questionDeadline ? read() : this.agentLoop.withReadRun(read, record.rootTaskId));
      await this.notifyReadFinished(record.rootTaskId, result);
      await this.appendAssistant(record, requestId);
      return;
    }
    const draining = this.activeReads.get(record.rootTaskId);
    if (draining) await draining.completion;
    if (handle.controller.signal.aborted || this.preparingHandles.get(record.rootTaskId) !== handle) return;
    // The web mutation returns before the live loop. Retain the enclosing
    // whole-read budget so semantic time and this asynchronous loop share one deadline.
    const releaseBudget = questionDeadline ? undefined : this.modelRunBudget?.hold?.();
    this.preparingHandles.delete(record.rootTaskId);
    const {controller, completion} = handle;
    if (controller.signal.aborted) { handle.finish(); releaseBudget?.(); return; }
    this.activeReads.set(record.rootTaskId, handle);
    void (async () => {
      try {
        const signal = runDeadlineSignal ? AbortSignal.any([controller.signal, runDeadlineSignal]) : controller.signal;
        const read = async () => {
          await this.agentLoop.run(record.rootTaskId, signal, readDeadline, userSelection);
          // Keep B1 enrichment in the same browser budget/session ownership as the loop.
          if(!questionDeadline)await this.bookingTerms?.readBookingTerms?.(await this.project(record), readDeadline.toISOString(), signal);
        };
        await (questionDeadline ? read() : this.agentLoop.withReadRun(read, record.rootTaskId));
      } catch (error) {
        await this.recordUnexpectedRunFailure(record, error);
      } finally {
        if (this.activeReads.get(record.rootTaskId) === handle) this.activeReads.delete(record.rootTaskId);
        try {
          await this.notifyReadFinished(record.rootTaskId);
          await this.appendAssistant(record, requestId);
          await this.notifyCaseUpdate(record);
        } finally {
          try { handle.finish(); } finally { releaseBudget?.(); }
        }
      }
    })();
  }

  private async cancelAndRecheck(
    record: ConversationRecord,
    input: { requestId: string; expectedVersion: number },
    priorActive: ActiveRead | undefined,
    reason: string,
    sameTarget?: (state: RestaurantTaskState) => boolean,
  ) {
    const taskId = record.rootTaskId;
    const replacement = () => {
      const active = this.currentRead(taskId, true);
      return active !== undefined && active !== priorActive;
    };
    const before = await this.runtime.snapshot(taskId);
    const priorEvents = await this.runtime.listEvents(taskId);
    if (priorEvents.some(event => event.id === this.userEventId(taskId, input.requestId))) return;
    if (before.version < input.expectedVersion
      || priorEvents.slice(input.expectedVersion).some(event => event.trace.actor === "USER")
      || sameTarget && !sameTarget(before.domainState)) {
      throw new StaleTaskVersionError(input.expectedVersion, before.version);
    }
    if (before.domainState.pageQuestion && !before.domainState.pageQuestion.result) return before;
    const replaced = await this.cancelActiveRead(record, priorActive, reason) || replacement();
    const snapshot = await this.runtime.snapshot(taskId);
    const events = await this.runtime.listEvents(taskId);
    if (events.some(event => event.id === this.userEventId(taskId, input.requestId))) return;
    if (replaced || replacement() || events.slice(input.expectedVersion).some(event => event.trace.actor === "USER")
      || (sameTarget && !sameTarget(snapshot.domainState))) {
      throw new StaleTaskVersionError(input.expectedVersion, snapshot.version);
    }
    return snapshot;
  }

  /** Cancel only the ActiveRead selected by preflight. Return true if it was replaced. */
  private async cancelActiveRead(record: ConversationRecord, priorActive: ActiveRead | undefined, reason: string): Promise<boolean> {
    const current = this.currentRead(record.rootTaskId, true);
    if (current && current !== priorActive) return true;
    if (current) {
      current.controller.abort(new Error(reason));
      if (this.activeReads.get(record.rootTaskId) === current) await current.completion;
    }
    return false;
  }

  private async recordUnexpectedRunFailure(record: ConversationRecord, error: unknown): Promise<void> {
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    if (["PRESENT_RESULTS", "NO_VERIFIED_RESULT", "FAILED", "OUTCOME_UNKNOWN", "BOOKED_VERIFIED"].includes(snapshot.domainState.phase)) return;
    const reason = error instanceof Error ? error.message : "The local read process failed unexpectedly";
    const id = this.createId("event:restaurant-agent-runtime");
    await this.runtime.dispatch({
      id,
      taskId: snapshot.id,
      event: { type: "AGENT_LOOP_TERMINATED", termination: "EXECUTION_FAILURE", reason },
      occurredAt: this.clock.now().toISOString(),
      trace: { schemaVersion: "1", runId: snapshot.runId, correlationId: id, actor: "SYSTEM" },
    }, snapshot.version);
  }

  private async notifyCaseUpdate(record: ConversationRecord): Promise<void> {
    const view = await this.project(record);
    await Promise.all([...this.updateListeners].map(async (listener) => {
      try { await listener(view); } catch { /* A disconnected UI must not affect the task. */ }
    }));
  }

  private async notifyReadFinished(caseId: string, _result?: RestaurantAgentLoopResult): Promise<void> {
    await Promise.all([...this.readFinishedListeners].map(async (listener) => {
      try { await listener(caseId); } catch { /* artifact diagnostics never alter execution state */ }
    }));
  }

  private async appendAssistant(record: ConversationRecord, requestId: string): Promise<void> {
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    await this.store.appendMessage({
      id: `message:1:${hash(`${record.id}:${requestId}`).slice(0, 24)}`,
      conversationId: record.id,
      role: "ASSISTANT",
      content: snapshot.domainState.pageQuestion?.requestId === requestId && snapshot.domainState.pageQuestion.result
        ? pageQuestionSummary(snapshot.domainState.pageQuestion.result) : assistantSummary(snapshot.domainState),
      requestId: `assistant:${requestId}`,
      createdAt: this.clock.now().toISOString(),
    });
  }

  private userEventId(taskId: string, requestId: string): string {
    return `event:user:${hash(`${taskId}:${requestId}`).slice(0, 32)}`;
  }

  private userEvent(
    snapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>,
    requestId: string,
    event: RestaurantEvent,
  ) {
    const id = this.userEventId(snapshot.id, requestId);
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
    await this.finishInterruptedLiveRead(record);
    const [snapshot, messages, events, bookingFeedbackAvailable] = await Promise.all([
      this.runtime.snapshot(record.rootTaskId),
      this.store.listMessages(record.id),
      this.runtime.listEvents(record.rootTaskId),
      this.store.hasUnpromptedBookingDeparture(record.id),
    ]);
    const state = snapshot.domainState;
    const requestStart = events.findLastIndex(item => item.event.type === "SEMANTIC_PROPOSAL_COMPILED");
    const requestEvents = events.slice(Math.max(0, requestStart));
    const checked = new Set(requestEvents.flatMap(item => item.event.type === "AVAILABILITY_CHECKED" ? item.event.request.candidateIds : []));
    const qualifiedCandidateIds = state.candidates.filter(candidate => restaurantPresentationEvidenceIds(state, candidate.restaurant.id, this.clock.now().toISOString()) !== undefined).map(candidate => candidate.restaurant.id);
    const readyCandidateIds=restaurantReadyCandidateIds(state,this.clock.now().toISOString(),qualifiedCandidateIds);
    const presentedCandidateIds=state.presentedResults?.candidateIds.filter(id=>namedOutletCandidateResolved(state,id));
    const readHandle=this.currentRead(record.rootTaskId);
    const semanticStart=readHandle?.semanticRequestId?events.findIndex(e=>e.id===this.userEventId(record.rootTaskId,readHandle.semanticRequestId!)):-1;
    const semanticPending=!!readHandle?.semanticRequestId&&semanticStart<0;
    const pendingQuestion=!!state.pageQuestion&&!state.pageQuestion.result;
    const reading=!!readHandle&&!readHandle.controller.signal.aborted&&(semanticPending||state.phase!=="NEEDS_INPUT"&&(this.activeReads.has(record.rootTaskId)||pendingQuestion||["UNDERSTANDING","SEARCHING","SELECTION_REQUIRED"].includes(state.phase)));
    const stage:RestaurantCaseView['restaurant']['progress']['stage']=!reading?undefined:semanticPending?'UNDERSTANDING'
      :readHandle?.semanticRequestId&&events[semanticStart]?.event.type==='SEMANTIC_PROPOSAL_COMPILED'&&!events.slice(semanticStart).some(e=>e.event.type==='SEARCH_COMPLETED')?'FINDING':'CHECKING';
    const workspaceRead = projectWorkspaceRead({ state, events, qualifiedCandidateIds, readyCandidateIds,
      openableCandidateIds: state.phase === "PRESENT_RESULTS" ? presentedCandidateIds ?? [] : readyCandidateIds,
      active: reading, now: this.clock.now().toISOString() });
    const draft = state.intentDraft;
    const revisedTitle = workspaceRead.requirementRevision > 1 && draft ? [
      ...draft.criteria.map(criterion => `${criterion.polarity === "NEGATIVE" ? "No " : ""}${criterion.text}`),
      draft.area?.query, draft.date,
      draft.timeWindow ? `${draft.timeWindow.earliest}${draft.timeWindow.latest !== draft.timeWindow.earliest ? "–" + draft.timeWindow.latest : ""}` : undefined,
      draft.partySize ? `${draft.partySize} guests` : undefined,
    ].filter(Boolean).join(" · ") : undefined;
    const action = state.pageQuestion && !state.pageQuestion.result ? undefined : pendingAction(state.phase);
    const summary: RestaurantCaseSummary = {
      caseId: record.rootTaskId,
      conversationId: record.id,
      rootTaskId: record.rootTaskId,
      title: revisedTitle || record.title,
      status: caseStatus(snapshot.lifecycleState),
      phase: state.phase,
      taskVersion: snapshot.version,
      ...(state.phase === "FAILED" && state.failure?.code === "AGENT_LOOP_CANCELLED" ? { stopped: true } : {}),
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
        data: { candidates: state.candidates.map(candidate => ({ ...structuredClone(candidate), ...observedCandidateDistance(state.readEvidence, candidate.restaurant.id, snapshot.updatedAt) })), availability: structuredClone(state.availability) },
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
        ...workspaceRead,
        ...(state.phase === "NEEDS_INPUT" ? { clarificationQuestion: assistantSummary(state) } : {}),
        ...(state.intentDraft ? { intentDraft: structuredClone(state.intentDraft) } : {}),
        ...(state.searchContinuation?.locationContext ? { searchLocation: structuredClone(state.searchContinuation.locationContext) } : {}),
        missingRequiredFields: missingBlockingFields(state.intentDraft ?? {}),
        searchRevision: state.searchRevision,
        readyCandidateIds,
        progress: {active:reading,...(stage?{stage}:{}), stopped:!pendingQuestion&&requestEvents.some(item => item.event.type === "AGENT_LOOP_TERMINATED" && item.event.termination === "CANCELLED"),
          ...(requestEvents.some(item => item.event.type === "SEARCH_COMPLETED") ? {discoveredCount:state.candidates.length} : {}),
          ...(checked.size ? {checkedCount:checked.size} : {})},
        bookingFeedbackAvailable,
        candidates: state.candidates.map(candidate => ({ ...structuredClone(candidate), ...observedCandidateDistance(state.readEvidence, candidate.restaurant.id, snapshot.updatedAt) })),
        availability: structuredClone(state.availability),
        availabilityChecks: structuredClone(state.availabilityChecks),
        readEvidence: structuredClone(state.readEvidence),
        currentFactEvidence: state.candidates.flatMap(candidate => structuredClone(restaurantCurrentFactEvidence(state, candidate.restaurant.id))),
        ...(state.phase !== "NO_VERIFIED_RESULT" && state.presentedResults ? { presentedCandidateIds: [...presentedCandidateIds!], conditionStates: structuredClone(Object.fromEntries(Object.entries(state.presentedResults.conditionStates).filter(([id])=>presentedCandidateIds!.includes(id)))) } : {}),
        ...(state.selectionSession ? {
          viewedCandidateIds: [...state.selectionSession.viewedCandidateIds],
          shortlistCandidateIds: [...state.selectionSession.shortlistCandidateIds],
          ...(state.selectionSession.feedback?.length ? { selectionFeedback: [...state.selectionSession.feedback] } : {}),
          ...(state.selectionSession.resultBatchTarget ? { resultBatchTarget: structuredClone(state.selectionSession.resultBatchTarget) } : {}),
        } : {}),
        ...(state.pageQuestion ? { pageQuestion: structuredClone(state.pageQuestion) } : {}),
        sourceReadContext: {runId:snapshot.runId+":investigation:"+String(state.investigationRevision??0),startedAt:snapshot.createdAt,
          ...(readHandle?{handleId:readHandle.handleId}:{})},
        ...(state.selectedCandidateId ? { selectedCandidateId: state.selectedCandidateId } : {}),
      },
      artifacts,
      activities: events.map((event) => eventActivity(snapshot.id, event)),
      note: this.workspaceMode === "FIXTURE"
        ? "Fixture mode only. No real model, live availability, authorization, notification, or reservation is performed."
        : "Live read-only mode. Results require current source evidence; no authorization, booking, payment, cancellation, or personal-data submission is available.",
    };
  }

  /** There is no durable queue: a process restart ends an orphaned in-flight read explicitly. */
  private async finishInterruptedLiveRead(record: ConversationRecord): Promise<void> {
    if (this.workspaceMode !== "LIVE_READ" || this.preparingReads.has(record.rootTaskId) || this.activeReads.has(record.rootTaskId)) return;
    const snapshot = await this.runtime.snapshot(record.rootTaskId);
    if (this.preparingReads.has(record.rootTaskId) || this.activeReads.has(record.rootTaskId)) return;
    const q = snapshot.domainState.pageQuestion;
    if (q && canSettlePageQuestion(snapshot.domainState, q, restaurantInvestigationReadRunId(snapshot.domainState, snapshot.runId))) {
      const id = this.createId("event:restaurant-question-interrupted");
      try {
        await this.runtime.dispatch({id,taskId:snapshot.id,event:{type:"PAGE_QUESTION_COMPLETED",requestId:q.requestId,readRunId:q.readRunId,
          result:{status:"UNVERIFIED",candidateId:q.candidateId,reason:"CANCELLED",checkedPages:[]}},occurredAt:this.clock.now().toISOString(),
          trace:{schemaVersion:"1",runId:snapshot.runId,correlationId:id,actor:"SYSTEM"}},snapshot.version);
      } catch (error) {
        if (!(error instanceof StaleTaskVersionError)) throw error;
      }
      return;
    }
    if (!["UNDERSTANDING", "SEARCHING", "SELECTION_REQUIRED"].includes(snapshot.domainState.phase)) return;
    const id = this.createId("event:restaurant-agent-interrupted");
    try {
      await this.runtime.dispatch({
        id,
        taskId: snapshot.id,
        event: {
          type: "AGENT_LOOP_TERMINATED",
          termination: "EXECUTION_FAILURE",
          reason: "The local read process stopped before this investigation completed. It was not resumed automatically.",
        },
        occurredAt: this.clock.now().toISOString(),
        trace: { schemaVersion: "1", runId: snapshot.runId, correlationId: id, actor: "SYSTEM" },
      }, snapshot.version);
    } catch (error) {
      if (!(error instanceof StaleTaskVersionError)) throw error;
    }
  }
}

export { StaleTaskVersionError };
