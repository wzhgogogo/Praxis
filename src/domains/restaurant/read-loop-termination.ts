import type { RestaurantAgentLoopTermination, RestaurantTaskState } from "./contracts.js";
import { assessRestaurantRead } from "./read-assessment.js";

// Explicit system failures. Candidate/page/search failures are investigation
// facts, not reasons to leave a bounded read without a user-facing result.
const systemFailureCodes = new Set([
  "CONFIGURATION", "INVALID_REQUEST", "TIMEOUT", "NETWORK", "PROVIDER_RATE_LIMITED", "PROVIDER_REJECTED", "MALFORMED_RESPONSE",
  "INSUFFICIENT_BALANCE", "AGENT_DECISION_FAILED", "AGENT_EXECUTION_FAILED", "SEMANTIC_INTERPRETATION_FAILED",
  "BROWSER_RUNTIME_UNAVAILABLE", "SIDE_EFFECT_UNCERTAIN", "OUTCOME_UNKNOWN", "ACTIVE_ATTEMPT_EXISTS",
  "AUTHORIZATION_MISSING", "AUTHORIZATION_PROPOSAL_MISMATCH", "AUTHORIZATION_SCOPE_UNSUPPORTED",
  "AUTHORIZATION_INVALID", "AUTHORIZATION_NOT_YET_VALID", "AUTHORIZATION_EXPIRED", "AUTHORIZATION_REVOKED",
]);

export function restaurantReadStopIsSystem(termination: RestaurantAgentLoopTermination, failureCode?: string): boolean {
  return termination === "CANCELLED" || termination === "EXECUTION_FAILURE"
    || systemFailureCodes.has(failureCode ?? "");
}

/** Projection of actual read records; neither exhaustiveness nor a global no-seat claim. */
export function restaurantUnverifiedReadSummary(state: Readonly<RestaurantTaskState>, now: string) {
  const assessment = assessRestaurantRead(state, now);
  const investigatedCandidateIds = state.candidates.filter(candidate => state.factChecks?.[candidate.restaurant.id]
    || state.availabilityChecks[candidate.restaurant.id]).map(candidate => candidate.restaurant.id);
  const reasons = state.candidates.map(candidate => {
    const id = candidate.restaurant.id, availability = state.availabilityChecks[id], facts = state.factChecks?.[id];
    return `${candidate.restaurant.outletName}: availability ${availability?.status ?? "NOT_CHECKED"} (${availability?.reasonCode ?? assessment.presentation.find(item => item.candidateId === id)?.recheckReason ?? "no request-bound slot established"}); facts ${facts?.status ?? "NOT_CHECKED"}${facts?.reasonCode ? ` (${facts.reasonCode})` : ""}`;
  });
  const boundedNativeGap = state.searchContinuation?.discoveryPlan && state.searchContinuation.exhausted
    ? [`The bounded discovery plan ended without a grounded result; wider source coverage was not evaluated${state.searchContinuation.lastFailureCode ? `; last source failure: ${state.searchContinuation.lastFailureCode}` : ""}`] : [];
  return { investigatedCandidateIds, unresolvedCandidateIds: assessment.unresolvedCandidateIds,
    remainingGaps: [...reasons, ...assessment.presentation.filter(item => !item.eligible).map(item => item.missingReason ?? `Candidate ${item.candidateId} is not displayable`), ...boundedNativeGap, ...(assessment.endReadReason ? [assessment.endReadReason] : [])] };
}
