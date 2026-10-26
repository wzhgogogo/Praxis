import type { RestaurantTaskState } from "./contracts.js";

/** ADR0045: the reserve belongs to the existing whole-read deadline. */
export const RESTAURANT_READ_CONCLUSION_RESERVE_MS = 20_000;
/** Bounded cancellation settlement, leaving the reserve for a conclusion. */
export const RESTAURANT_READ_CANCEL_SETTLE_MS = 2_000;
export const RESTAURANT_READ_ADMISSION_MS = {
  SEARCH_RESTAURANTS: 65_154,
  INVESTIGATE_CANDIDATE_FACTS: 50_383.5,
  CHECK_AVAILABILITY: 66_453,
} as const;

export function restaurantReserveCancelled(signal?: AbortSignal): boolean {
  const reason: unknown = signal?.reason;
  return signal?.aborted === true && reason !== null && typeof reason === "object"
    && "code" in reason && reason.code === "DELIVERY_RESERVE_REACHED";
}

/** Two seconds for persisted projection/closing after a bounded root decision. */
export const RESTAURANT_READ_FINALIZE_ALLOWANCE_MS = 2_000;
export function restaurantReadActionFits(type: string, remainingMs?: number): boolean {
  const minimum = RESTAURANT_READ_ADMISSION_MS[type as keyof typeof RESTAURANT_READ_ADMISSION_MS];
  return minimum === undefined || remainingMs === undefined || Number.isFinite(remainingMs) && remainingMs >= minimum;
}
export function restaurantReadClosing(state: Readonly<RestaurantTaskState>, now: string): boolean {
  const window = state.readEndWindow, instant = Date.parse(now);
  return !!window && instant >= Date.parse(window.openedAt) && instant <= Date.parse(window.deadlineAt);
}
