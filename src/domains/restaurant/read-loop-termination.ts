import type { RestaurantAgentLoopTermination, RestaurantTaskState } from "./contracts.js";
import { assessRestaurantRead } from "./read-assessment.js";

import { RESTAURANT_FAILURE_CLASSIFICATION, type RestaurantFailureCode } from "./failure-codes.js";

export function restaurantReadStopIsSystem(termination: RestaurantAgentLoopTermination, failureCode?: RestaurantFailureCode): boolean {
  const terminations = { TIMEOUT: false, STEP_LIMIT: false, REJECTION_LIMIT: false, EXECUTION_FAILURE: true, NO_PROGRESS: false, CANCELLED: true } satisfies Record<RestaurantAgentLoopTermination, boolean>;
  return terminations[termination] || failureCode !== undefined && RESTAURANT_FAILURE_CLASSIFICATION[failureCode] !== "BUSINESS";
}

/** Projection of actual read records; neither exhaustiveness nor a global no-seat claim. */
export function restaurantUnverifiedReadSummary(state: Readonly<RestaurantTaskState>, now: string) {
  const assessment = assessRestaurantRead(state, now);
  const investigatedCandidateIds = state.candidates.filter(candidate => state.factChecks?.[candidate.restaurant.id]
    || state.availabilityChecks[candidate.restaurant.id]).map(candidate => candidate.restaurant.id);
  const reasons = state.candidates.map(candidate => {
    const id = candidate.restaurant.id, availability = state.availabilityChecks[id], facts = state.factChecks?.[id];
    return `${candidate.restaurant.outletName}: availability ${availability?.status ?? "NOT_CHECKED"} (${availability?.reasonCode ?? assessment.presentation.find(item => item.candidateId === id)?.recheckReason ?? (availability?.status === "AVAILABLE" ? "source reported AVAILABLE; see current offers and evidence" : "no request-bound slot established")}); facts ${facts?.status ?? "NOT_CHECKED"}${facts?.reasonCode ? ` (${facts.reasonCode})` : ""}`;
  });
  const boundedNativeGap = state.searchContinuation?.discoveryPlan && state.searchContinuation.exhausted
    ? [`The bounded discovery plan ended without a grounded result; wider source coverage was not evaluated${state.searchContinuation.lastFailureCode ? `; last source failure: ${state.searchContinuation.lastFailureCode}` : ""}`] : [];
  return { investigatedCandidateIds, unresolvedCandidateIds: assessment.unresolvedCandidateIds,
    remainingGaps: [...reasons, ...assessment.presentation.filter(item => !item.eligible).map(item => item.missingReason ?? `Candidate ${item.candidateId} is not displayable`), ...boundedNativeGap, ...(assessment.endReadReason ? [assessment.endReadReason] : [])] };
}
