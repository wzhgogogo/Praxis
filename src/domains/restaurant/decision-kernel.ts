import type { RestaurantDecision, RestaurantTaskState } from "./contracts.js";
import { completeRestaurantIntent } from "./intent-state.js";

/**
 * Pure, Domain-owned next-step selection. It consumes authoritative Restaurant state only;
 * a returned decision has no Tool or execution authority.
 */
export function decideRestaurantNext(state: Readonly<RestaurantTaskState>): RestaurantDecision {
  if (state.semanticConflict) {
    return { type: "NEED_REINTERPRETATION", conflict: structuredClone(state.semanticConflict) };
  }

  if (state.phase === "SEARCHING") {
    return state.candidates.length > 0
      ? { type: "PRESENT_CANDIDATES" }
      : { type: "NEED_ADJUSTMENT", reason: "No executable candidates were found" };
  }

  if (state.phase === "AWAITING_AUTHORIZATION") return { type: "PROPOSE_RESERVATION" };
  if (state.phase === "BOOKED_VERIFIED") return { type: "COMPLETE" };

  const intent = completeRestaurantIntent(state.intentDraft);
  if (!intent) {
    return {
      type: "ASK_USER",
      missingRequiredFields: [...(state.intentDraft?.missingRequiredFields ?? [
        "date",
        "timeWindow",
        "partySize",
        "area",
      ])],
    };
  }
  return { type: "SEARCH" };
}
