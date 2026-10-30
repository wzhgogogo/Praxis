import { restaurantSearchIntentFingerprint, type RestaurantTaskState } from "./contracts.js";
import { completeRestaurantIntent, completeRestaurantSearchIntent } from "./intent-state.js";
import { assessRestaurantRead, immediateRequestWindowExpired, restaurantGoalRequiresAvailability } from "./read-assessment.js";
import { validateRestaurantAction } from "./action-validator.js";

/** Explicit source failures only; missing/unknown facts never prove all failed. */
export function allRestaurantSourcesFailed(state: Readonly<RestaurantTaskState>): boolean {
  const checks = [...Object.values(state.availabilityChecks), ...Object.values(state.factChecks ?? {})];
  return state.candidates.length > 0
    && !checks.some(check => check.status === "AVAILABLE" || check.status === "UNAVAILABLE" || check.status === "COMPLETED")
    && state.candidates.every(candidate => {
      const attempts = [...(state.availabilityChecks[candidate.restaurant.id]?.sourceAttempts ?? []), ...(state.factChecks?.[candidate.restaurant.id]?.sourceAttempts ?? [])];
      return attempts.length > 0 && attempts.every(attempt => attempt.outcome === "FAILED");
    });
}

function inputsReady(state: Readonly<RestaurantTaskState>, now: string): boolean {
  const intent = completeRestaurantSearchIntent(state.intentDraft);
  return !!intent && (!restaurantGoalRequiresAvailability(intent) || !!completeRestaurantIntent(state.intentDraft))
    && !immediateRequestWindowExpired(state, now) && !(state.pageQuestion && !state.pageQuestion.result);
}

/** Same-condition continuation keeps checks and observed cursors, including failures. */
export function canContinueRestaurantRead(state: Readonly<RestaurantTaskState>, now: string): boolean {
  if (state.phase !== "NO_VERIFIED_RESULT" || !inputsReady(state, now) || allRestaurantSourcesFailed(state)) return false;
  const { readEndWindow: _end, defaultBatchDeliveryWindow: _delivery, failure: _failure, ...remaining } = state;
  const resumed = { ...remaining, phase: "SEARCHING" as const, pendingResultBatchTarget: 3 };
  const assessment = assessRestaurantRead(resumed, now);
  const unread = new Set(state.candidates.filter(candidate => !state.availabilityChecks[candidate.restaurant.id] && !state.factChecks?.[candidate.restaurant.id]).map(candidate => candidate.restaurant.id));
  if (assessment.checkableCandidateIds.some(id => unread.has(id)) || assessment.factInvestigableCandidateIds.some(id => unread.has(id))) return true;
  const continuation = state.searchContinuation, intent = completeRestaurantSearchIntent(state.intentDraft)!;
  if (!continuation || continuation.exhausted || continuation.intentFingerprint !== restaurantSearchIntentFingerprint(intent)) return false;
  const observedWork = !!(continuation.nextPageToken && !continuation.usedPageTokens.includes(continuation.nextPageToken))
    || !!(continuation.discoveryPlan && continuation.discoveryPlan.cursor < continuation.discoveryPlan.entries.length)
    || !!continuation.sourceProgress?.pendingSourceEntries?.some(entry => !continuation.sourceProgress!.inspectedSourceIds.includes(entry.sourceEntityId))
    || !!continuation.sourceProgress?.pendingSourceIds.some(id => !continuation.sourceProgress!.inspectedSourceIds.includes(id))
    || !!(continuation.sourceProgress?.nextListing && !continuation.sourceProgress.visitedListingUrls?.includes(continuation.sourceProgress.nextListing.sourceUrl));
  return observedWork && validateRestaurantAction(resumed, { type: "SEARCH_RESTAURANTS" }, now).status === "ALLOWED";
}

/** Try again reuses refresh, separately from never-recheck continuation. */
export function failedSourceRetryCandidateIds(state: Readonly<RestaurantTaskState>, now: string): string[] {
  if (state.phase !== "NO_VERIFIED_RESULT" || !inputsReady(state, now) || !allRestaurantSourcesFailed(state)) return [];
  return state.candidates.map(candidate => candidate.restaurant.id);
}
