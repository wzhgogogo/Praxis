import { createHash } from "node:crypto";

import type { ActionProposal } from "../../core/policy/contracts.js";
import type {
  TaskContext,
  TaskDefinition,
  TaskLifecycleState,
  TransitionResult,
} from "../../core/task-runtime/contracts.js";
import type {
  RestaurantAvailabilityCheck,
  AvailabilityOffer,
  RestaurantBookingSelection,
  RestaurantCommand,
  RestaurantEvent,
  RestaurantAgentLoopTermination,
  RestaurantOutcome,
  RestaurantPhase,
  RestaurantTaskState,
} from "./contracts.js";
import { applyRestaurantIntentPatch } from "./intent-state.js";
import { restaurantIntentPatchHasChanges } from "./semantic-compiler.js";
import { validateRestaurantAction } from "./action-validator.js";

function requirePhase(state: Readonly<RestaurantTaskState>, allowed: RestaurantPhase[], eventType: string) {
  if (!allowed.includes(state.phase)) {
    throw new Error(`Event ${eventType} is invalid while restaurant task is ${state.phase}`);
  }
}

function requireSemanticMutablePhase(state: Readonly<RestaurantTaskState>, eventType: string): void {
  requirePhase(
    state,
    ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED", "AWAITING_AUTHORIZATION", "PRESENT_RESULTS", "FAILED"],
    eventType,
  );
}

function resetForSemanticUpdate(
  state: Readonly<RestaurantTaskState>,
  intentDraft: RestaurantTaskState["intentDraft"],
): RestaurantTaskState {
  const {
    intent: _intent,
    candidates: _candidates,
    availability: _availability,
    availabilityChecks: _availabilityChecks,
    factChecks: _factChecks,
    readEvidence: _readEvidence,
    selectedCandidateId: _selectedCandidateId,
    selectedOfferId: _selectedOfferId,
    presentedResults: _presentedResults,
    pendingUserQuestion: _pendingUserQuestion,
    proposal: _proposal,
    authorization: _authorization,
    semanticConflict: _semanticConflict,
    failure: _failure,
    refreshRequestedCandidateIds: _refreshRequestedCandidateIds,
    factRefreshRequestedCandidateIds: _factRefreshRequestedCandidateIds,
    sourceReadState: _sourceReadState,
    ...remaining
  } = state;
  return {
    ...remaining,
    phase: "UNDERSTANDING",
    investigationRevision: (state.investigationRevision ?? 0) + 1,
    ...(intentDraft ? { intentDraft } : {}),
    candidates: [],
    availability: {},
    availabilityChecks: {},
    factChecks: {},
    readEvidence: [],
  };
}

function sameSearchIntent(left: RestaurantTaskState["intent"], right: RestaurantTaskState["intent"]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeCandidates(
  existing: RestaurantTaskState["candidates"],
  incoming: RestaurantTaskState["candidates"],
): RestaurantTaskState["candidates"] {
  const byId = new Map(existing.map((candidate) => [candidate.restaurant.id, structuredClone(candidate)]));
  for (const candidate of incoming) if (!byId.has(candidate.restaurant.id)) byId.set(candidate.restaurant.id, structuredClone(candidate));
  // Provider/loop budgets bound discovery.  A hidden pool truncation would
  // silently discard candidates while a larger availability budget appears
  // usable, so preserve every observed candidate for this task revision.
  return [...byId.values()];
}

function mergeEvidence(
  existing: RestaurantTaskState["readEvidence"],
  incoming: RestaurantTaskState["readEvidence"],
): RestaurantTaskState["readEvidence"] {
  const byId = new Map(existing.map((evidence) => [evidence.evidenceId, structuredClone(evidence)]));
  for (const evidence of incoming) byId.set(evidence.evidenceId, structuredClone(evidence));
  return [...byId.values()];
}

function selectedBooking(state: Readonly<RestaurantTaskState>): RestaurantBookingSelection {
  const candidate = state.candidates.find((item) => item.restaurant.id === state.selectedCandidateId);
  const offer = state.selectedCandidateId && state.selectedOfferId
    ? state.availability[state.selectedCandidateId]?.find((item) => item.id === state.selectedOfferId)
    : undefined;
  if (!candidate || !offer) throw new Error("Selected restaurant candidate and offer are unavailable");
  if (offer.restaurantId !== candidate.restaurant.id) throw new Error("Selected offer restaurant identity does not match candidate");
  return { candidate, offer };
}

function requireAttemptMatches(state: Readonly<RestaurantTaskState>, attemptId: string, eventType: string): void {
  if (!state.activeAttemptId || state.activeAttemptId !== attemptId) {
    throw new Error(
      `Event ${eventType} attempt ${attemptId} does not match active attempt ${state.activeAttemptId ?? "none"}`,
    );
  }
}

function termsHash(selection: RestaurantBookingSelection): string {
  const { candidate, offer } = selection;
  const terms = JSON.stringify({
    restaurantId: candidate.restaurant.id,
    offerId: offer.id,
    dateTime: offer.dateTime,
    partySize: offer.partySize,
    seating: offer.seating ?? null,
    plan: offer.plan ?? null,
    price: offer.price ?? null,
    cancellationTerms: offer.cancellationTerms ?? null,
  });
  return createHash("sha256").update(terms).digest("hex");
}

function createProposal(context: TaskContext, selection: RestaurantBookingSelection): ActionProposal {
  const { candidate, offer } = selection;
  const proposal: ActionProposal = {
    id: context.createId("proposal"),
    taskId: context.taskId,
    actionType: "BOOK",
    target: {
      type: "RESTAURANT_OUTLET",
      id: candidate.restaurant.id,
      counterparty: candidate.restaurant.outletName,
    },
    termsHash: termsHash(selection),
    risk: "LOW",
    reversible: true,
  };
  if (offer.price) proposal.amount = { value: offer.price.amount, currency: offer.price.currency };
  return proposal;
}

function returnToSelection(
  state: Readonly<RestaurantTaskState>,
  failure: NonNullable<RestaurantTaskState["failure"]>,
  lastExecutionResult?: RestaurantTaskState["lastExecutionResult"],
): RestaurantTaskState {
  const { activeAttemptId: _activeAttemptId, authorization: _authorization, proposal: _proposal, ...remaining } = state;
  return {
    ...remaining,
    phase: "SELECTION_REQUIRED",
    ...(lastExecutionResult ? { lastExecutionResult } : {}),
    failure,
  };
}

function lifecycleFor(phase: RestaurantPhase): TaskLifecycleState {
  switch (phase) {
    case "UNDERSTANDING": return "CREATED";
    case "SEARCHING":
    case "SELECTION_REQUIRED":
    case "EXECUTING":
    case "VERIFYING": return "RUNNING";
    case "AWAITING_AUTHORIZATION":
    case "NEEDS_INPUT": return "WAITING_USER";
    case "OUTCOME_UNKNOWN": return "NEEDS_ATTENTION";
    case "BOOKED_VERIFIED": return "SUCCEEDED";
    case "PRESENT_RESULTS": return "SUCCEEDED";
    case "FAILED": return "FAILED";
  }
}

function ensureAvailabilityObservation(
  request: Extract<RestaurantEvent, { type: "AVAILABILITY_CHECKED" }> ["request"],
  offers: AvailabilityOffer[],
  availabilityChecks: Record<string, RestaurantAvailabilityCheck>,
): void {
  for (const candidateId of request.candidateIds) {
    if (!availabilityChecks[candidateId]) {
      throw new Error(`Availability observation is missing a check result for ${candidateId}`);
    }
  }
  for (const offer of offers) {
    if (!request.candidateIds.includes(offer.restaurantId)) {
      throw new Error(`Availability observation includes unrequested candidate ${offer.restaurantId}`);
    }
    if (offer.partySize !== request.partySize || offer.dateTime.slice(0, 10) !== request.date) {
      throw new Error("Availability observation does not match its requested date or party size");
    }
    const time = offer.dateTime.slice(11, 16);
    if (time < request.timeWindow.earliest || time > request.timeWindow.latest) {
      throw new Error("Availability observation does not match its requested time window");
    }
    if (availabilityChecks[offer.restaurantId]?.status !== "AVAILABLE") {
      throw new Error("Availability offer requires an AVAILABLE availability check");
    }
  }
}

function transition(
  state: Readonly<RestaurantTaskState>,
  event: Readonly<RestaurantEvent>,
  context: TaskContext,
): TransitionResult<RestaurantTaskState, RestaurantCommand> {
  switch (event.type) {
    case "SEMANTIC_PROPOSAL_COMPILED": {
      requireSemanticMutablePhase(state, event.type);
      if (!restaurantIntentPatchHasChanges(event.patch)) return { state: structuredClone(state), commands: [] };
      return { state: resetForSemanticUpdate(state, applyRestaurantIntentPatch(state.intentDraft, event.patch)), commands: [] };
    }
    case "SEMANTIC_CONFLICT_RECORDED":
      requireSemanticMutablePhase(state, event.type);
      return {
        state: {
          ...resetForSemanticUpdate(state, state.intentDraft ? structuredClone(state.intentDraft) : undefined),
          phase: "NEEDS_INPUT",
          semanticConflict: structuredClone(event.conflict),
        },
        commands: [],
      };
    case "AGENT_ASKED_USER":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      return {
        state: { ...state, phase: "NEEDS_INPUT", pendingUserQuestion: { question: event.question, ...(event.relatedFields ? { relatedFields: [...event.relatedFields] } : {}) } },
        commands: [],
      };
    case "AGENT_DECISION_FAILED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      {
        const { pendingUserQuestion: _pendingUserQuestion, ...remaining } = state;
      return {
        state: {
          ...remaining,
          phase: "FAILED",
          failure: { code: "AGENT_DECISION_FAILED", message: event.reason },
        },
        commands: [],
      };
      }
    case "AGENT_EXECUTION_FAILED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      {
        const { pendingUserQuestion: _pendingUserQuestion, ...remaining } = state;
      return {
        state: {
          ...remaining,
          phase: "FAILED",
          failure: { code: "AGENT_EXECUTION_FAILED", message: event.reason },
        },
        commands: [],
      };
      }
    case "AGENT_LOOP_TERMINATED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      {
        const { pendingUserQuestion: _pendingUserQuestion, ...remaining } = state;
        return {
          state: {
            ...remaining,
            phase: "FAILED",
            failure: { code: `AGENT_LOOP_${event.termination}`, message: event.reason },
          },
          commands: [],
        };
      }
    case "SEARCH_COMPLETED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      {
        const {
          selectedCandidateId: _selectedCandidateId,
          selectedOfferId: _selectedOfferId,
          presentedResults: _presentedResults,
          pendingUserQuestion: _pendingUserQuestion,
          failure: _failure,
          ...remaining
        } = state;
      const continuation = sameSearchIntent(state.intent, event.request.intent);
      return {
        state: {
          ...remaining,
          phase: "SEARCHING",
          intent: structuredClone(event.request.intent),
          candidates: continuation ? mergeCandidates(state.candidates, event.candidates) : event.candidates.map((candidate) => structuredClone(candidate)),
          availability: continuation ? structuredClone(state.availability) : {},
          availabilityChecks: continuation ? structuredClone(state.availabilityChecks) : {},
          factChecks: continuation ? structuredClone(state.factChecks ?? {}) : {},
          readEvidence: continuation ? mergeEvidence(state.readEvidence, event.evidence) : event.evidence.map((item) => structuredClone(item)),
          searchRevision: state.searchRevision + 1,
        },
        commands: [],
      };
      }
    case "SEARCH_FAILED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      if (event.code === "GOOGLE_LOCATION_AMBIGUOUS") {
        return {
          state: {
            ...state,
            phase: "NEEDS_INPUT",
            pendingUserQuestion: { question: "That place name has multiple matching locations. Please enter its address, district, or a more specific station name." },
            failure: { code: event.code, message: event.reason },
          },
          commands: [],
        };
      }
      return {
        state: {
          ...state,
          phase: "SEARCHING",
          failure: { code: event.code ?? "SEARCH_FAILED", message: event.reason },
          ...(event.code === "GOOGLE_SEARCH_BUDGET_EXCEEDED"
            ? { sourceReadState: { ...(state.sourceReadState ?? { googlePlacesSearchBudget: "AVAILABLE" as const }), googlePlacesSearchBudget: "EXHAUSTED" as const } }
            : {}),
        },
        commands: [],
      };
    case "AVAILABILITY_FAILED":
      requirePhase(state, ["SEARCHING", "SELECTION_REQUIRED"], event.type);
      return {
        state: { ...state, phase: "SEARCHING", failure: { code: "AVAILABILITY_FAILED", message: event.reason } },
        commands: [],
      };
    case "CANDIDATE_FACTS_CHECKED": {
      requirePhase(state, ["SEARCHING", "SELECTION_REQUIRED"], event.type);
      if (!event.request.candidateIds.every((candidateId) => state.candidates.some((candidate) => candidate.restaurant.id === candidateId))) {
        throw new Error("Candidate fact observation references an unknown candidate");
      }
      if (!event.request.candidateIds.every((candidateId) => event.factChecks[candidateId] !== undefined)) {
        throw new Error("Candidate fact observation is missing a check result");
      }
      for (const candidateId of event.request.candidateIds) {
        const check = event.factChecks[candidateId]!;
        if (!check.evidenceIds.every((evidenceId) => event.evidence.some((evidence) => evidence.evidenceId === evidenceId && evidence.candidateId === candidateId))) {
          throw new Error("Candidate fact check must reference evidence from the same observation");
        }
      }
      const { failure: _failure, factRefreshRequestedCandidateIds: priorFactRefreshRequestedCandidateIds, ...remaining } = state;
      const refreshed = new Set(event.request.candidateIds);
      const remainingFactRefresh = priorFactRefreshRequestedCandidateIds?.filter((candidateId) => !refreshed.has(candidateId)) ?? [];
      return {
        state: {
          ...remaining,
          phase: "SEARCHING",
          factChecks: { ...(state.factChecks ?? {}), ...structuredClone(event.factChecks) },
          readEvidence: mergeEvidence(state.readEvidence, event.evidence),
          ...(remainingFactRefresh.length ? { factRefreshRequestedCandidateIds: remainingFactRefresh } : {}),
          ...(event.metadata.failureCode === "GOOGLE_SEARCH_BUDGET_EXCEEDED"
            ? {
                failure: { code: event.metadata.failureCode, message: "Google discovery budget is exhausted for this run" },
                sourceReadState: { ...(state.sourceReadState ?? { googlePlacesSearchBudget: "AVAILABLE" as const }), googlePlacesSearchBudget: "EXHAUSTED" as const },
              }
            : {}),
        },
        commands: [],
      };
    }
    case "AVAILABILITY_REFRESH_REQUESTED": {
      requirePhase(state, ["PRESENT_RESULTS"], event.type);
      if (!state.presentedResults || event.candidateIds.length === 0 || new Set(event.candidateIds).size !== event.candidateIds.length) {
        throw new Error("Availability refresh requires unique previously presented candidates");
      }
      if (!event.candidateIds.every((candidateId) => state.presentedResults!.candidateIds.includes(candidateId))) {
        throw new Error("Availability refresh is limited to previously presented candidates");
      }
      const { presentedResults: _presentedResults, failure: _failure, ...remaining } = state;
      return {
        state: { ...remaining, phase: "SEARCHING", refreshRequestedCandidateIds: [...event.candidateIds] },
        commands: [],
      };
    }
    case "CANDIDATE_FACTS_REFRESH_REQUESTED": {
      requirePhase(state, ["PRESENT_RESULTS"], event.type);
      if (!state.presentedResults || event.candidateIds.length === 0 || new Set(event.candidateIds).size !== event.candidateIds.length) {
        throw new Error("Recommendation refresh requires unique previously presented candidates");
      }
      if (!event.candidateIds.every((candidateId) => state.presentedResults!.candidateIds.includes(candidateId))) {
        throw new Error("Recommendation refresh is limited to previously presented candidates");
      }
      const { presentedResults: _presentedResults, failure: _failure, ...remaining } = state;
      return { state: { ...remaining, phase: "SEARCHING", factRefreshRequestedCandidateIds: [...event.candidateIds] }, commands: [] };
    }
    case "AVAILABILITY_CHECKED": {
      requirePhase(state, ["SEARCHING", "SELECTION_REQUIRED"], event.type);
      ensureAvailabilityObservation(event.request, event.offers, event.availabilityChecks);
      const availability = structuredClone(state.availability);
      const availabilityChecks = structuredClone(state.availabilityChecks);
      const candidates = structuredClone(state.candidates);
      for (const candidateId of event.request.candidateIds) {
        availability[candidateId] = event.offers
          .filter((offer) => offer.restaurantId === candidateId)
          .map((offer) => structuredClone(offer));
        availabilityChecks[candidateId] = structuredClone(event.availabilityChecks[candidateId]!);
      }
      for (const update of event.candidateFactUpdates ?? []) {
        const candidate = candidates.find((item) => item.restaurant.id === update.candidateId);
        if (!candidate) throw new Error(`Candidate fact update references unknown candidate ${update.candidateId}`);
        if (!update.evidenceIds.every((id) => event.evidence.some((evidence) => evidence.evidenceId === id && evidence.candidateId === update.candidateId))) {
          throw new Error("Candidate fact update must reference evidence from the same availability observation");
        }
        candidate.matchReasons = [...new Set([...candidate.matchReasons, ...update.matchReasons])];
      }
      {
        const { failure: _failure, refreshRequestedCandidateIds: priorRefreshRequestedCandidateIds, ...remaining } = state;
        const refreshed = new Set(event.request.candidateIds);
        const remainingRefresh = priorRefreshRequestedCandidateIds?.filter((candidateId) => !refreshed.has(candidateId)) ?? [];
        const evidence = event.evidence.map((item) => item.candidateId && event.request.recheck
          ? { ...item, supersedesEvidenceIds: [...event.request.recheck.previousEvidenceIds] }
          : structuredClone(item));
        return {
          state: {
            ...remaining,
            phase: "SEARCHING",
            availability,
            availabilityChecks,
            candidates,
            readEvidence: [...state.readEvidence, ...evidence],
            ...(remainingRefresh.length ? { refreshRequestedCandidateIds: remainingRefresh } : {}),
          },
          commands: [],
        };
      }
    }
    case "RESULTS_PRESENTED": {
      requirePhase(state, ["SEARCHING", "SELECTION_REQUIRED"], event.type);
      const validation = validateRestaurantAction(state, { type: "PRESENT_RESULTS", candidateIds: event.candidateIds }, context.now);
      if (validation.status !== "ALLOWED") {
        throw new Error(`Results presentation is not grounded: ${validation.status === "REJECTED" ? validation.reason : "authorization is not applicable"}`);
      }
      const availableEvidence = new Set(state.readEvidence.map((item) => item.evidenceId));
      if (event.evidenceIds.length === 0 || !event.evidenceIds.every((id) => availableEvidence.has(id))) {
        throw new Error("Results presentation must reference current authoritative evidence");
      }
      return {
        state: {
          ...state,
          phase: "PRESENT_RESULTS",
          presentedResults: { candidateIds: [...event.candidateIds], evidenceIds: [...event.evidenceIds], presentedAt: context.now },
        },
        commands: [],
      };
    }
    case "CANDIDATE_SELECTED": {
      requirePhase(state, ["SEARCHING", "SELECTION_REQUIRED"], event.type);
      const candidate = state.candidates.find((item) => item.restaurant.id === event.candidateId);
      if (!candidate) throw new Error(`Candidate not found: ${event.candidateId}`);
      if (event.offerId && !state.availability[event.candidateId]?.some((offer) => offer.id === event.offerId)) {
        throw new Error(`Offer not found for candidate: ${event.offerId}`);
      }
      const { selectedOfferId: _selectedOfferId, ...remaining } = state;
      return {
        state: { ...remaining, phase: "SEARCHING", selectedCandidateId: candidate.restaurant.id, ...(event.offerId ? { selectedOfferId: event.offerId } : {}) },
        commands: [],
      };
    }
    case "BOOKING_PROPOSED": {
      requirePhase(state, ["SEARCHING", "SELECTION_REQUIRED"], event.type);
      if (state.selectedCandidateId !== event.candidateId || state.selectedOfferId !== event.offerId) {
        throw new Error("Booking proposal requires the selected candidate and offer");
      }
      const selection = selectedBooking(state);
      return { state: { ...state, phase: "AWAITING_AUTHORIZATION", proposal: createProposal(context, selection) }, commands: [] };
    }
    case "AUTHORIZE": {
      requirePhase(state, ["AWAITING_AUTHORIZATION"], event.type);
      if (!state.proposal) throw new Error("Cannot authorize without an action proposal");
      if (event.authorization.proposalId !== state.proposal.id) {
        throw new Error("Authorization must bind the current booking proposal");
      }
      const selection = selectedBooking(state);
      return {
        state: { ...state, authorization: event.authorization },
        commands: [{ type: "EVALUATE_BOOKING_POLICY", category: "POLICY", idempotencyKey: `${context.taskId}:policy:${state.proposal.id}:${event.authorization.id}`, proposal: state.proposal, authorization: event.authorization, offerExpiresAt: selection.offer.expiresAt }],
      };
    }
    case "POLICY_APPROVED": {
      requirePhase(state, ["AWAITING_AUTHORIZATION"], event.type);
      if (!state.proposal || !state.authorization) throw new Error("Policy approval requires proposal and authorization");
      const selection = selectedBooking(state);
      const attemptId = context.createId("attempt");
      return {
        state: { ...state, phase: "EXECUTING", activeAttemptId: attemptId },
        commands: [{ type: "COMMIT_BOOKING", category: "EXTERNAL_WRITE", idempotencyKey: `${context.taskId}:commit:${state.proposal.id}`, attemptId, proposal: state.proposal, authorization: state.authorization, selection }],
      };
    }
    case "POLICY_DENIED":
      requirePhase(state, ["AWAITING_AUTHORIZATION"], event.type);
      return { state: { ...state, failure: { code: event.code, message: "Policy rejected the booking action" } }, commands: [] };
    case "COMMIT_SUCCEEDED": {
      requirePhase(state, ["EXECUTING"], event.type);
      requireAttemptMatches(state, event.result.attemptId, event.type);
      return {
        state: { ...state, phase: "VERIFYING", activeAttemptId: event.result.attemptId, lastExecutionResult: event.result },
        commands: [{ type: "VERIFY_BOOKING", category: "VERIFY", idempotencyKey: `${context.taskId}:verify:${event.result.attemptId}`, attemptId: event.result.attemptId, selection: selectedBooking(state), executionResult: event.result }],
      };
    }
    case "COMMIT_FAILED":
      requirePhase(state, ["EXECUTING"], event.type);
      requireAttemptMatches(state, event.result.attemptId, event.type);
      return { state: returnToSelection(state, { code: "COMMIT_FAILED", message: event.result.reason }, event.result), commands: [] };
    case "COMMIT_UNCERTAIN": {
      requirePhase(state, ["EXECUTING"], event.type);
      requireAttemptMatches(state, event.result.attemptId, event.type);
      return {
        state: { ...state, phase: "OUTCOME_UNKNOWN", activeAttemptId: event.result.attemptId, lastExecutionResult: event.result, failure: { code: "SIDE_EFFECT_UNCERTAIN", message: event.result.reason } },
        commands: [{ type: "VERIFY_BOOKING", category: "VERIFY", idempotencyKey: `${context.taskId}:verify:${event.result.attemptId}`, attemptId: event.result.attemptId, selection: selectedBooking(state), executionResult: event.result }],
      };
    }
    case "BOOKING_VERIFIED":
      requirePhase(state, ["VERIFYING", "OUTCOME_UNKNOWN"], event.type);
      requireAttemptMatches(state, event.evidence.attemptId, event.type);
      return { state: { ...state, phase: "BOOKED_VERIFIED", evidence: event.evidence, reservation: { providerReference: event.evidence.claims.providerReference, restaurantId: event.evidence.claims.restaurantId, dateTime: event.evidence.claims.dateTime, partySize: event.evidence.claims.partySize } }, commands: [] };
    case "BOOKING_ABSENT":
      requirePhase(state, ["VERIFYING", "OUTCOME_UNKNOWN"], event.type);
      return { state: returnToSelection(state, { code: "BOOKING_ABSENT", message: `Provider confirmed no booking at ${event.checkedAt}` }, state.lastExecutionResult), commands: [] };
    case "VERIFICATION_INCONCLUSIVE":
      requirePhase(state, ["VERIFYING", "OUTCOME_UNKNOWN"], event.type);
      return { state: { ...state, phase: "OUTCOME_UNKNOWN", ...(event.evidence ? { evidence: event.evidence } : {}), failure: { code: "OUTCOME_UNKNOWN", message: "Booking result could not be verified" } }, commands: [] };
    default:
      throw new Error(`Unsupported restaurant event: ${(event as { type: string }).type}`);
  }
}

export const restaurantBookingTaskDefinition: TaskDefinition<RestaurantTaskState, RestaurantEvent, RestaurantCommand, RestaurantOutcome> = {
  type: "restaurant.booking",
  version: "10",
  create() {
    return {
      schemaVersion: "10",
      phase: "UNDERSTANDING",
      candidates: [],
      availability: {},
      availabilityChecks: {},
      readEvidence: [],
      searchRevision: 0,
    };
  },
  transition,
  getLifecycleState(state) { return lifecycleFor(state.phase); },
  evaluateOutcome(state) {
    if (state.phase === "BOOKED_VERIFIED" && state.reservation) return { status: "BOOKED_VERIFIED", reservation: state.reservation };
    if (state.phase === "PRESENT_RESULTS" && state.presentedResults) return {
      status: "PRESENT_RESULTS",
      candidateIds: [...state.presentedResults.candidateIds],
      evidenceIds: [...state.presentedResults.evidenceIds],
    };
    if (state.phase === "OUTCOME_UNKNOWN" && state.activeAttemptId) return { status: "OUTCOME_UNKNOWN", attemptId: state.activeAttemptId };
    if (state.phase === "FAILED" && state.failure) return { status: "FAILED", reason: state.failure.message };
    return null;
  },
};
