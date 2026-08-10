import { createHash } from "node:crypto";

import type { ActionProposal } from "../../core/policy/contracts.js";
import type {
  TaskContext,
  TaskDefinition,
  TaskLifecycleState,
  TransitionResult,
} from "../../core/task-runtime/contracts.js";
import type {
  ExecutableCandidate,
  RestaurantBookingIntent,
  RestaurantCommand,
  RestaurantEvent,
  RestaurantIntentDraft,
  RestaurantOutcome,
  RestaurantPhase,
  RestaurantTaskState,
} from "./contracts.js";

function completeIntent(draft: RestaurantIntentDraft): RestaurantBookingIntent | null {
  if (
    draft.missingRequiredFields.length > 0 ||
    !draft.date ||
    !draft.timeWindow ||
    !draft.partySize ||
    !draft.area
  ) {
    return null;
  }
  return {
    timezone: draft.timezone,
    date: draft.date,
    timeWindow: structuredClone(draft.timeWindow),
    partySize: draft.partySize,
    area: structuredClone(draft.area),
    cuisines: structuredClone(draft.cuisines),
    ...(draft.budgetPerPerson ? { budgetPerPerson: structuredClone(draft.budgetPerPerson) } : {}),
    hardConstraints: structuredClone(draft.hardConstraints),
    softPreferences: structuredClone(draft.softPreferences),
    missingRequiredFields: [],
  };
}

function requirePhase(state: Readonly<RestaurantTaskState>, allowed: RestaurantPhase[], eventType: string) {
  if (!allowed.includes(state.phase)) {
    throw new Error(`Event ${eventType} is invalid while restaurant task is ${state.phase}`);
  }
}

function selectedCandidate(state: Readonly<RestaurantTaskState>): ExecutableCandidate {
  const candidate = state.candidates.find(
    (item) => item.restaurant.id === state.selectedCandidateId,
  );
  if (!candidate) {
    throw new Error("Selected restaurant candidate is unavailable");
  }
  return candidate;
}

function requireAttemptMatches(
  state: Readonly<RestaurantTaskState>,
  attemptId: string,
  eventType: string,
): void {
  if (!state.activeAttemptId || state.activeAttemptId !== attemptId) {
    throw new Error(
      `Event ${eventType} attempt ${attemptId} does not match active attempt ${state.activeAttemptId ?? "none"}`,
    );
  }
}

function termsHash(candidate: ExecutableCandidate): string {
  const terms = JSON.stringify({
    restaurantId: candidate.restaurant.id,
    offerId: candidate.offer.id,
    dateTime: candidate.offer.dateTime,
    partySize: candidate.offer.partySize,
    seating: candidate.offer.seating ?? null,
    plan: candidate.offer.plan ?? null,
    price: candidate.offer.price ?? null,
    cancellationTerms: candidate.offer.cancellationTerms ?? null,
  });
  return createHash("sha256").update(terms).digest("hex");
}

function createProposal(taskId: string, candidate: ExecutableCandidate): ActionProposal {
  const proposal: ActionProposal = {
    id: `proposal:${taskId}:${candidate.offer.id}:${termsHash(candidate).slice(0, 16)}`,
    taskId,
    actionType: "BOOK",
    target: {
      type: "RESTAURANT_OUTLET",
      id: candidate.restaurant.id,
      counterparty: candidate.restaurant.outletName,
    },
    termsHash: termsHash(candidate),
    risk: "LOW",
    reversible: true,
  };

  if (candidate.offer.price) {
    proposal.amount = {
      value: candidate.offer.price.amount,
      currency: candidate.offer.price.currency,
    };
  }

  return proposal;
}

function returnToSelection(
  state: Readonly<RestaurantTaskState>,
  failure: RestaurantTaskState["failure"],
  lastExecutionResult?: RestaurantTaskState["lastExecutionResult"],
): RestaurantTaskState {
  const {
    activeAttemptId: _activeAttemptId,
    authorization: _authorization,
    proposal: _proposal,
    ...remaining
  } = state;
  return {
    ...remaining,
    phase: "SELECTION_REQUIRED",
    ...(lastExecutionResult ? { lastExecutionResult } : {}),
    ...(failure ? { failure } : {}),
  };
}

function lifecycleFor(phase: RestaurantPhase): TaskLifecycleState {
  switch (phase) {
    case "UNDERSTANDING":
      return "CREATED";
    case "SEARCHING":
    case "REVALIDATING":
    case "EXECUTING":
    case "VERIFYING":
      return "RUNNING";
    case "AWAITING_SELECTION":
    case "AWAITING_AUTHORIZATION":
    case "NEEDS_INPUT":
    case "SELECTION_REQUIRED":
      return "WAITING_USER";
    case "OUTCOME_UNKNOWN":
      return "NEEDS_ATTENTION";
    case "BOOKED_VERIFIED":
      return "SUCCEEDED";
    case "FAILED":
      return "FAILED";
  }
}

function transition(
  state: Readonly<RestaurantTaskState>,
  event: Readonly<RestaurantEvent>,
  context: TaskContext,
): TransitionResult<RestaurantTaskState, RestaurantCommand> {
  switch (event.type) {
    case "INTENT_PARSED": {
      requirePhase(state, ["UNDERSTANDING", "NEEDS_INPUT"], event.type);
      const intent = completeIntent(event.draft);
      if (!intent) {
        return {
          state: {
            ...state,
            phase: "NEEDS_INPUT",
            intentDraft: structuredClone(event.draft),
          },
          commands: [],
        };
      }
      const searchRevision = state.searchRevision + 1;
      return {
        state: {
          ...state,
          phase: "SEARCHING",
          intentDraft: structuredClone(event.draft),
          intent,
          searchRevision,
        },
        commands: [
          {
            type: "SEARCH_RESTAURANTS",
            category: "READ",
            idempotencyKey: `${context.taskId}:search:${searchRevision}`,
            intent,
            searchRevision,
          },
        ],
      };
    }

    case "SEARCH_COMPLETED":
      requirePhase(state, ["SEARCHING"], event.type);
      return {
        state: {
          ...state,
          phase: event.candidates.length > 0 ? "AWAITING_SELECTION" : "SELECTION_REQUIRED",
          candidates: event.candidates.slice(0, 3),
          ...(event.candidates.length === 0
            ? { failure: { code: "NO_CANDIDATES", message: "No executable candidates were found" } }
            : {}),
        },
        commands: [],
      };

    case "SEARCH_FAILED":
      requirePhase(state, ["SEARCHING"], event.type);
      return {
        state: {
          ...state,
          phase: "FAILED",
          failure: { code: "SEARCH_FAILED", message: event.reason },
        },
        commands: [],
      };

    case "SELECT_CANDIDATE": {
      requirePhase(state, ["AWAITING_SELECTION", "SELECTION_REQUIRED"], event.type);
      const candidate = state.candidates.find(
        (item) => item.restaurant.id === event.candidateId,
      );
      if (!candidate) {
        throw new Error(`Candidate not found: ${event.candidateId}`);
      }
      return {
        state: {
          ...state,
          phase: "REVALIDATING",
          selectedCandidateId: event.candidateId,
        },
        commands: [
          {
            type: "REVALIDATE_OFFER",
            category: "READ",
            idempotencyKey: `${context.taskId}:revalidate:${candidate.offer.id}`,
            candidate,
          },
        ],
      };
    }

    case "OFFER_REVALIDATED": {
      requirePhase(state, ["REVALIDATING"], event.type);
      if (event.candidate.restaurant.id !== state.selectedCandidateId) {
        throw new Error("Revalidated offer does not match the selected candidate");
      }
      const candidates = state.candidates.map((candidate) =>
        candidate.restaurant.id === event.candidate.restaurant.id ? event.candidate : candidate,
      );
      return {
        state: {
          ...state,
          phase: "AWAITING_AUTHORIZATION",
          candidates,
          proposal: createProposal(context.taskId, event.candidate),
        },
        commands: [],
      };
    }

    case "OFFER_UNAVAILABLE":
      requirePhase(state, ["REVALIDATING"], event.type);
      return {
        state: returnToSelection(state, {
          code: "OFFER_UNAVAILABLE",
          message: `Offer for ${event.candidateId} is no longer available`,
        }),
        commands: [],
      };

    case "AUTHORIZE": {
      requirePhase(state, ["AWAITING_AUTHORIZATION"], event.type);
      if (!state.proposal) {
        throw new Error("Cannot authorize without an action proposal");
      }
      const candidate = selectedCandidate(state);
      return {
        state: { ...state, authorization: event.authorization },
        commands: [
          {
            type: "EVALUATE_BOOKING_POLICY",
            category: "POLICY",
            idempotencyKey: `${context.taskId}:policy:${state.proposal.id}:${event.authorization.id}`,
            proposal: state.proposal,
            authorization: event.authorization,
            offerExpiresAt: candidate.offer.expiresAt,
          },
        ],
      };
    }

    case "POLICY_APPROVED": {
      requirePhase(state, ["AWAITING_AUTHORIZATION"], event.type);
      if (!state.proposal || !state.authorization) {
        throw new Error("Policy approval requires proposal and authorization");
      }
      const candidate = selectedCandidate(state);
      const attemptId = context.createId("attempt");
      return {
        state: { ...state, phase: "EXECUTING", activeAttemptId: attemptId },
        commands: [
          {
            type: "COMMIT_BOOKING",
            category: "EXTERNAL_WRITE",
            idempotencyKey: `${context.taskId}:commit:${state.proposal.id}`,
            attemptId,
            proposal: state.proposal,
            authorization: state.authorization,
            candidate,
          },
        ],
      };
    }

    case "POLICY_DENIED":
      requirePhase(state, ["AWAITING_AUTHORIZATION"], event.type);
      return {
        state: {
          ...state,
          failure: { code: event.code, message: "Policy rejected the booking action" },
        },
        commands: [],
      };

    case "COMMIT_SUCCEEDED": {
      requirePhase(state, ["EXECUTING"], event.type);
      requireAttemptMatches(state, event.result.attemptId, event.type);
      const candidate = selectedCandidate(state);
      return {
        state: {
          ...state,
          phase: "VERIFYING",
          activeAttemptId: event.result.attemptId,
          lastExecutionResult: event.result,
        },
        commands: [
          {
            type: "VERIFY_BOOKING",
            category: "VERIFY",
            idempotencyKey: `${context.taskId}:verify:${event.result.attemptId}`,
            attemptId: event.result.attemptId,
            candidate,
            executionResult: event.result,
          },
        ],
      };
    }

    case "COMMIT_FAILED":
      requirePhase(state, ["EXECUTING"], event.type);
      requireAttemptMatches(state, event.result.attemptId, event.type);
      return {
        state: returnToSelection(
          state,
          { code: "COMMIT_FAILED", message: event.result.reason },
          event.result,
        ),
        commands: [],
      };

    case "COMMIT_UNCERTAIN": {
      requirePhase(state, ["EXECUTING"], event.type);
      requireAttemptMatches(state, event.result.attemptId, event.type);
      const candidate = selectedCandidate(state);
      return {
        state: {
          ...state,
          phase: "OUTCOME_UNKNOWN",
          activeAttemptId: event.result.attemptId,
          lastExecutionResult: event.result,
          failure: { code: "SIDE_EFFECT_UNCERTAIN", message: event.result.reason },
        },
        commands: [
          {
            type: "VERIFY_BOOKING",
            category: "VERIFY",
            idempotencyKey: `${context.taskId}:verify:${event.result.attemptId}`,
            attemptId: event.result.attemptId,
            candidate,
            executionResult: event.result,
          },
        ],
      };
    }

    case "BOOKING_VERIFIED":
      requirePhase(state, ["VERIFYING", "OUTCOME_UNKNOWN"], event.type);
      requireAttemptMatches(state, event.evidence.attemptId, event.type);
      return {
        state: {
          ...state,
          phase: "BOOKED_VERIFIED",
          evidence: event.evidence,
          reservation: {
            providerReference: event.evidence.claims.providerReference,
            restaurantId: event.evidence.claims.restaurantId,
            dateTime: event.evidence.claims.dateTime,
            partySize: event.evidence.claims.partySize,
          },
        },
        commands: [],
      };

    case "BOOKING_ABSENT":
      requirePhase(state, ["VERIFYING", "OUTCOME_UNKNOWN"], event.type);
      return {
        state: returnToSelection(
          state,
          {
            code: "BOOKING_ABSENT",
            message: `Provider confirmed no booking at ${event.checkedAt}`,
          },
          state.lastExecutionResult,
        ),
        commands: [],
      };

    case "VERIFICATION_INCONCLUSIVE":
      requirePhase(state, ["VERIFYING", "OUTCOME_UNKNOWN"], event.type);
      return {
        state: {
          ...state,
          phase: "OUTCOME_UNKNOWN",
          ...(event.evidence ? { evidence: event.evidence } : {}),
          failure: {
            code: "OUTCOME_UNKNOWN",
            message: "Booking result could not be verified",
          },
        },
        commands: [],
      };
  }
}

export const restaurantBookingTaskDefinition: TaskDefinition<
  RestaurantTaskState,
  RestaurantEvent,
  RestaurantCommand,
  RestaurantOutcome
> = {
  type: "restaurant.booking",
  version: "3",
  create() {
    return {
      schemaVersion: "3",
      phase: "UNDERSTANDING",
      candidates: [],
      searchRevision: 0,
    };
  },
  transition,
  getLifecycleState(state) {
    return lifecycleFor(state.phase);
  },
  evaluateOutcome(state) {
    if (state.phase === "BOOKED_VERIFIED" && state.reservation) {
      return { status: "BOOKED_VERIFIED", reservation: state.reservation };
    }
    if (state.phase === "OUTCOME_UNKNOWN" && state.activeAttemptId) {
      return { status: "OUTCOME_UNKNOWN", attemptId: state.activeAttemptId };
    }
    if (state.phase === "FAILED" && state.failure) {
      return { status: "FAILED", reason: state.failure.message };
    }
    return null;
  },
};
