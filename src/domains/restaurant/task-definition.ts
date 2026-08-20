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

function requirePhase(state: Readonly<RestaurantTaskState>, allowed: RestaurantPhase[], eventType: string) {
  if (!allowed.includes(state.phase)) {
    throw new Error(`Event ${eventType} is invalid while restaurant task is ${state.phase}`);
  }
}

function requireSemanticMutablePhase(state: Readonly<RestaurantTaskState>, eventType: string): void {
  requirePhase(
    state,
    ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED", "AWAITING_AUTHORIZATION"],
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
    readEvidence: _readEvidence,
    selectedCandidateId: _selectedCandidateId,
    selectedOfferId: _selectedOfferId,
    pendingUserQuestion: _pendingUserQuestion,
    proposal: _proposal,
    authorization: _authorization,
    semanticConflict: _semanticConflict,
    failure: _failure,
    ...remaining
  } = state;
  return {
    ...remaining,
    phase: "UNDERSTANDING",
    ...(intentDraft ? { intentDraft } : {}),
    candidates: [],
    availability: {},
    availabilityChecks: {},
    readEvidence: [],
  };
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
    case "FAILED": return "FAILED";
  }
}

function terminationQuestion(termination: RestaurantAgentLoopTermination): string {
  switch (termination) {
    case "TIMEOUT":
      return "I reached the time limit while evaluating safe options. Please clarify how you would like to proceed.";
    case "STEP_LIMIT":
      return "I reached the maximum number of safe planning steps. Please clarify how you would like to proceed.";
    case "REJECTION_LIMIT":
      return "I could not find a valid next action after several rejected proposals. Please clarify how you would like to proceed.";
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
      return {
        state: {
          ...state,
          phase: "NEEDS_INPUT",
          pendingUserQuestion: { question: "I could not determine a safe next step. Please clarify how you would like to proceed." },
          failure: { code: "AGENT_DECISION_FAILED", message: event.reason },
        },
        commands: [],
      };
    case "AGENT_EXECUTION_FAILED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      return {
        state: {
          ...state,
          phase: "NEEDS_INPUT",
          pendingUserQuestion: { question: "I could not safely execute that step. Please clarify how you would like to proceed." },
          failure: { code: "AGENT_EXECUTION_FAILED", message: event.reason },
        },
        commands: [],
      };
    case "AGENT_LOOP_TERMINATED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      return {
        state: {
          ...state,
          phase: "NEEDS_INPUT",
          pendingUserQuestion: { question: terminationQuestion(event.termination) },
          failure: { code: `AGENT_LOOP_${event.termination}`, message: event.reason },
        },
        commands: [],
      };
    case "SEARCH_COMPLETED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      {
        const {
          selectedCandidateId: _selectedCandidateId,
          selectedOfferId: _selectedOfferId,
          pendingUserQuestion: _pendingUserQuestion,
          failure: _failure,
          ...remaining
        } = state;
      return {
        state: {
          ...remaining,
          phase: "SEARCHING",
          intent: structuredClone(event.request.intent),
          candidates: event.candidates.slice(0, 3).map((candidate) => structuredClone(candidate)),
          availability: {},
          availabilityChecks: {},
          readEvidence: event.evidence.map((item) => structuredClone(item)),
          searchRevision: state.searchRevision + 1,
        },
        commands: [],
      };
      }
    case "SEARCH_FAILED":
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT", "SEARCHING", "SELECTION_REQUIRED"], event.type);
      return {
        state: { ...state, phase: "SEARCHING", failure: { code: "SEARCH_FAILED", message: event.reason } },
        commands: [],
      };
    case "AVAILABILITY_FAILED":
      requirePhase(state, ["SEARCHING", "SELECTION_REQUIRED"], event.type);
      return {
        state: { ...state, phase: "SEARCHING", failure: { code: "AVAILABILITY_FAILED", message: event.reason } },
        commands: [],
      };
    case "AVAILABILITY_CHECKED": {
      requirePhase(state, ["SEARCHING", "SELECTION_REQUIRED"], event.type);
      ensureAvailabilityObservation(event.request, event.offers, event.availabilityChecks);
      const availability = structuredClone(state.availability);
      const availabilityChecks = structuredClone(state.availabilityChecks);
      for (const candidateId of event.request.candidateIds) {
        availability[candidateId] = event.offers
          .filter((offer) => offer.restaurantId === candidateId)
          .map((offer) => structuredClone(offer));
        availabilityChecks[candidateId] = structuredClone(event.availabilityChecks[candidateId]!);
      }
      {
        const { failure: _failure, ...remaining } = state;
        return {
          state: {
            ...remaining,
            phase: "SEARCHING",
            availability,
            availabilityChecks,
            readEvidence: [...state.readEvidence, ...event.evidence.map((item) => structuredClone(item))],
          },
          commands: [],
        };
      }
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
  }
}

export const restaurantBookingTaskDefinition: TaskDefinition<RestaurantTaskState, RestaurantEvent, RestaurantCommand, RestaurantOutcome> = {
  type: "restaurant.booking",
  version: "9",
  create() {
    return {
      schemaVersion: "9",
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
    if (state.phase === "OUTCOME_UNKNOWN" && state.activeAttemptId) return { status: "OUTCOME_UNKNOWN", attemptId: state.activeAttemptId };
    if (state.phase === "FAILED" && state.failure) return { status: "FAILED", reason: state.failure.message };
    return null;
  },
};
