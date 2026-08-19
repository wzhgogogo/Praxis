import type { ExecutionResult, SideEffectRecord } from "../core/execution/contracts.js";
import { SideEffectLedger } from "../core/execution/side-effect-ledger.js";
import { PolicyEngine } from "../core/policy/policy-engine.js";
import type { Authorization, PolicyDecision } from "../core/policy/contracts.js";
import type {
  CommandEnvelope,
  EventEnvelope,
  RecordedEventEnvelope,
  TaskSnapshot,
} from "../core/task-runtime/contracts.js";
import { InMemoryTaskRuntime } from "../core/task-runtime/in-memory-task-runtime.js";
import { RestaurantAgentLoopCoordinator } from "../application/restaurant-agent-loop.js";
import { RestaurantExecutionRouter } from "../application/restaurant-orchestration.js";
import { ScriptedRestaurantAgentDecisionPort } from "../domains/restaurant/agent-decision.js";
import type { RestaurantAgentAction } from "../domains/restaurant/agent-action.js";
import { verifyBookingCompletion } from "../domains/restaurant/booking-verifier.js";
import type {
  AvailabilityOffer,
  BookingProofBundle,
  RestaurantBookingIntent,
  RestaurantCandidate,
  RestaurantCommand,
  RestaurantEvent,
  RestaurantIntentPatch,
  RestaurantOutcome,
  RestaurantTaskState,
} from "../domains/restaurant/contracts.js";
import { restaurantBookingTaskDefinition } from "../domains/restaurant/task-definition.js";
import {
  InMemoryRestaurantAgentTrajectoryStore,
  type RestaurantAgentTrajectoryStep,
} from "../infrastructure/postgres/restaurant-agent-trajectory-store.js";
import {
  MockAvailabilityAdapter,
  MockBookingExecutor,
  MockBookingVerifier,
  MockRestaurantSearchAdapter,
  type MockCommitMode,
  type MockVerificationMode,
} from "../integrations/mock/restaurant-adapters.js";
import { FakeClock } from "./fake-clock.js";

export interface RestaurantHarnessFixture {
  candidates: RestaurantCandidate[];
  offers: AvailabilityOffer[];
  agentActions?: RestaurantAgentAction[];
  unavailableRestaurantIds?: ReadonlySet<string>;
  commitMode?: MockCommitMode;
  verificationMode?: MockVerificationMode;
  initialTime?: string;
}

export interface HarnessOracleAssertion { name: string; passed: boolean; details?: string }
export interface RestaurantHarnessPolicyRecord { commandId: string; proposalId: string; authorizationId: string; decision: PolicyDecision }

export interface RestaurantHarnessRunArtifact {
  schemaVersion: "2";
  mode: "mock";
  scenarioId?: string;
  runId: string;
  taskId: string;
  startedAt: string;
  generatedAt: string;
  fixture: { candidateIds: string[]; unavailableRestaurantIds: string[]; commitMode: MockCommitMode; verificationMode: MockVerificationMode; initialTime: string };
  events: RecordedEventEnvelope<RestaurantEvent>[];
  commands: CommandEnvelope<RestaurantCommand>[];
  trajectories: RestaurantAgentTrajectoryStep[];
  policyDecisions: RestaurantHarnessPolicyRecord[];
  authorizations: Authorization[];
  evidence: BookingProofBundle[];
  sideEffects: SideEffectRecord[];
  finalSnapshot: TaskSnapshot<RestaurantTaskState, RestaurantOutcome>;
  oracleAssertions: HarnessOracleAssertion[];
}

export class RestaurantHarness {
  readonly clock: FakeClock;
  readonly ledger = new SideEffectLedger();
  readonly runtime: InMemoryTaskRuntime<RestaurantTaskState, RestaurantEvent, RestaurantCommand, RestaurantOutcome>;
  readonly trajectories = new InMemoryRestaurantAgentTrajectoryStore();
  private readonly taskId = "task-restaurant-1";
  private readonly runId = "run:restaurant-harness-1";
  private readonly searchAdapter: MockRestaurantSearchAdapter;
  private readonly availabilityAdapter: MockAvailabilityAdapter;
  private readonly executor: MockBookingExecutor;
  private readonly verifier: MockBookingVerifier;
  private readonly policy = new PolicyEngine();
  private readonly policyDecisionRecords: RestaurantHarnessPolicyRecord[] = [];
  private readonly fixtureSummary: RestaurantHarnessRunArtifact["fixture"];
  private readonly fixture: RestaurantHarnessFixture;
  private sequence = 0;

  constructor(fixture: RestaurantHarnessFixture) {
    this.fixture = fixture;
    const initialTime = fixture.initialTime ?? "2026-08-05T09:00:00.000Z";
    const commitMode = fixture.commitMode ?? "SUCCESS";
    const verificationMode = fixture.verificationMode ?? "CONFIRMED";
    this.clock = new FakeClock(initialTime);
    this.fixtureSummary = { candidateIds: fixture.candidates.map((candidate) => candidate.restaurant.id), unavailableRestaurantIds: [...(fixture.unavailableRestaurantIds ?? new Set())], commitMode, verificationMode, initialTime };
    this.searchAdapter = new MockRestaurantSearchAdapter(fixture.candidates);
    this.availabilityAdapter = new MockAvailabilityAdapter(fixture.offers, fixture.unavailableRestaurantIds);
    this.executor = new MockBookingExecutor(this.ledger, commitMode);
    this.verifier = new MockBookingVerifier(verificationMode);
    this.runtime = new InMemoryTaskRuntime(restaurantBookingTaskDefinition, this.clock, (prefix) => `${prefix}-${++this.sequence}`);
  }

  async start(intent: RestaurantBookingIntent) {
    this.runtime.createTask(this.taskId, {}, { runId: this.runId });
    const patch: RestaurantIntentPatch = {
      schemaVersion: "3",
      ...(intent.target ? { target: structuredClone(intent.target) } : {}),
      date: intent.date,
      timeWindow: structuredClone(intent.timeWindow),
      partySize: intent.partySize,
      area: { query: intent.area.query },
      ...(intent.budgetPerPerson ? { budgetPerPerson: structuredClone(intent.budgetPerPerson) } : {}),
      ...(intent.criteria.length ? { addCriteria: structuredClone(intent.criteria) } : {}),
    };
    await this.send({ type: "SEMANTIC_PROPOSAL_COMPILED", patch });
    const firstCandidate = this.fixture.candidates[0];
    const firstOffer = firstCandidate
      ? this.fixture.offers.find((offer) => offer.restaurantId === firstCandidate.restaurant.id)
      : undefined;
    const actions = this.fixture.agentActions ?? (firstCandidate && firstOffer ? [
      { type: "SEARCH_RESTAURANTS", request: { intent } },
      { type: "CHECK_AVAILABILITY", request: { candidateIds: this.fixture.candidates.slice(0, 3).map((candidate) => candidate.restaurant.id), date: intent.date, timeWindow: intent.timeWindow, partySize: intent.partySize } },
      { type: "SELECT_CANDIDATE", candidateId: firstCandidate.restaurant.id, offerId: firstOffer.id },
      { type: "BOOK_RESERVATION", candidateId: firstCandidate.restaurant.id, offerId: firstOffer.id },
    ] satisfies RestaurantAgentAction[] : [{ type: "ASK_USER", question: "No fixture candidate is available." }]);
    const coordinator = new RestaurantAgentLoopCoordinator(
      { snapshot: async (taskId) => this.runtime.snapshot(taskId), dispatch: async (envelope, expectedVersion) => this.runtime.dispatch(envelope, expectedVersion) },
      new ScriptedRestaurantAgentDecisionPort(actions),
      new RestaurantExecutionRouter(this.searchAdapter, this.availabilityAdapter),
      this.trajectories,
      this.clock,
      {},
      (prefix) => `${prefix}-${++this.sequence}`,
    );
    await coordinator.run(this.taskId);
    return this.snapshot();
  }

  async authorizeCurrent(ttlMilliseconds = 5 * 60 * 1_000) {
    const state = this.snapshot().domainState;
    if (!state.proposal) throw new Error("No current proposal to authorize");
    const approvedAt = this.clock.now();
    const authorization: Authorization = { id: `authorization:${state.proposal.id}`, proposalId: state.proposal.id, scope: "ONE_TIME", approvedAt: approvedAt.toISOString(), expiresAt: new Date(approvedAt.valueOf() + ttlMilliseconds).toISOString() };
    await this.send({ type: "AUTHORIZE", authorization });
    return this.snapshot();
  }

  async send(event: RestaurantEvent, eventId = this.nextId("event")): Promise<void> {
    const snapshot = this.snapshotOrNull();
    const envelope: EventEnvelope<RestaurantEvent> = { id: eventId, taskId: this.taskId, event, occurredAt: this.clock.now().toISOString(), trace: { schemaVersion: "1", runId: this.runId, correlationId: eventId, actor: "USER" } };
    const result = this.runtime.dispatch(envelope, snapshot?.version);
    await this.drain(result.commands);
  }

  snapshot() { return this.runtime.snapshot(this.taskId); }
  countCommands(type: RestaurantCommand["type"]): number { return this.runtime.commandLog.filter((item) => item.command.type === type).length; }

  createRunArtifact(input: { scenarioId?: string; oracleAssertions?: HarnessOracleAssertion[] } = {}): RestaurantHarnessRunArtifact {
    const snapshot = this.snapshot();
    const evidence = this.runtime.eventLog.flatMap((envelope) => envelope.event.type === "BOOKING_VERIFIED" ? [envelope.event.evidence] : envelope.event.type === "VERIFICATION_INCONCLUSIVE" && envelope.event.evidence ? [envelope.event.evidence] : []);
    const authorizations = this.runtime.eventLog.flatMap((envelope) => envelope.event.type === "AUTHORIZE" ? [envelope.event.authorization] : []);
    return { schemaVersion: "2", mode: "mock", ...(input.scenarioId ? { scenarioId: input.scenarioId } : {}), runId: snapshot.runId, taskId: snapshot.id, startedAt: snapshot.createdAt, generatedAt: this.clock.now().toISOString(), fixture: structuredClone(this.fixtureSummary), events: structuredClone(this.runtime.eventLog), commands: structuredClone(this.runtime.commandLog), trajectories: structuredClone(this.trajectories.steps), policyDecisions: structuredClone(this.policyDecisionRecords), authorizations: structuredClone(authorizations), evidence: structuredClone(evidence), sideEffects: structuredClone(this.ledger.records), finalSnapshot: structuredClone(snapshot), oracleAssertions: structuredClone(input.oracleAssertions ?? []) };
  }

  async replayLastCommit(): Promise<boolean> {
    const envelope = this.runtime.commandLog.findLast((item): item is CommandEnvelope<Extract<RestaurantCommand, { type: "COMMIT_BOOKING" }>> => item.command.type === "COMMIT_BOOKING");
    if (!envelope) throw new Error("No commit command is available to replay");
    const result = await this.executor.commit(envelope.taskId, envelope.command, this.clock.now().toISOString());
    return result.replayed;
  }

  private async drain(initial: CommandEnvelope<RestaurantCommand>[]): Promise<void> {
    const queue = [...initial];
    while (queue.length) {
      const envelope = queue.shift();
      if (!envelope) continue;
      const event = await this.execute(envelope);
      const eventId = this.nextId("event");
      const result = this.runtime.dispatch({ id: eventId, taskId: this.taskId, event, occurredAt: this.clock.now().toISOString(), trace: { schemaVersion: "1", runId: envelope.trace.runId, ...(envelope.trace.attemptId ? { attemptId: envelope.trace.attemptId } : {}), correlationId: envelope.trace.correlationId, causationId: envelope.id, actor: envelope.command.category === "POLICY" ? "POLICY" : "ADAPTER" } });
      queue.push(...result.commands);
    }
  }

  private async execute(envelope: CommandEnvelope<RestaurantCommand>): Promise<RestaurantEvent> {
    const command = envelope.command;
    switch (command.type) {
      case "EVALUATE_BOOKING_POLICY": {
        const state = this.snapshot().domainState;
        const decision = this.policy.evaluateCommit({ proposal: command.proposal, authorization: command.authorization, now: this.clock.now().toISOString(), taskAllowsCommit: state.phase === "AWAITING_AUTHORIZATION", offerHealthy: Date.parse(command.offerExpiresAt) > this.clock.now().valueOf(), hasActiveAttempt: state.activeAttemptId !== undefined, outcomeUnknown: state.phase === "OUTCOME_UNKNOWN" });
        this.policyDecisionRecords.push({ commandId: envelope.id, proposalId: command.proposal.id, authorizationId: command.authorization.id, decision: structuredClone(decision) });
        return decision.allowed ? { type: "POLICY_APPROVED" } : { type: "POLICY_DENIED", code: decision.code };
      }
      case "COMMIT_BOOKING": {
        const { result } = await this.executor.commit(envelope.taskId, command, this.clock.now().toISOString());
        return this.commitResultEvent(result);
      }
      case "VERIFY_BOOKING": {
        const observation = await this.verifier.collect(command.selection, command.executionResult, this.clock.now().toISOString());
        const result = verifyBookingCompletion({ selection: command.selection, executionResult: command.executionResult, observation });
        return result.status === "CONFIRMED" ? { type: "BOOKING_VERIFIED", evidence: result.evidence } : result.status === "ABSENT" ? { type: "BOOKING_ABSENT", checkedAt: result.checkedAt } : result.evidence ? { type: "VERIFICATION_INCONCLUSIVE", evidence: result.evidence } : { type: "VERIFICATION_INCONCLUSIVE" };
      }
    }
  }

  private commitResultEvent(result: ExecutionResult): RestaurantEvent {
    switch (result.status) {
      case "SUBMITTED": return { type: "COMMIT_SUCCEEDED", result };
      case "FAILED_BEFORE_SIDE_EFFECT": return { type: "COMMIT_FAILED", result };
      case "SIDE_EFFECT_UNCERTAIN": return { type: "COMMIT_UNCERTAIN", result };
    }
  }
  private snapshotOrNull() { try { return this.snapshot(); } catch { return null; } }
  private nextId(prefix: string): string { return `${prefix}-${++this.sequence}`; }
}
