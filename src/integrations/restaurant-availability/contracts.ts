import type {
  RestaurantAvailabilityRead,
  RestaurantAvailabilityRequest,
  RestaurantExecutionRoute,
} from "../../domains/restaurant/contracts.js";

/** A Restaurant-only read port. Provider resolution and slot reads stay source-specific. */
export interface RestaurantAvailabilityProvider {
  readonly provider: "TABLECHECK" | "TABELOG";
  readonly executionRoute: Extract<RestaurantExecutionRoute, "GENERIC_BROWSER">;
  check(request: RestaurantAvailabilityRequest, signal: AbortSignal): Promise<RestaurantAvailabilityRead>;
}
