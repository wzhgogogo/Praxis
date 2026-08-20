export const GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

/** Kept explicit to constrain billing and prevent accidental raw-place retention. */
export const GOOGLE_PLACES_RESTAURANT_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.googleMapsUri",
].join(",");

export interface GooglePlacesTextSearchRequest {
  textQuery: string;
  pageSize: number;
  /** Explicit, runner-supplied location context for a user-authorized NEAR_USER read. */
  locationBias?: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
  };
}

export interface GooglePlacesRawPlace {
  id?: unknown;
  displayName?: { text?: unknown };
  formattedAddress?: unknown;
  location?: { latitude?: unknown; longitude?: unknown };
  types?: unknown;
  primaryType?: unknown;
  googleMapsUri?: unknown;
}

export interface GooglePlacesTextSearchResponse {
  places?: GooglePlacesRawPlace[];
}

export class GooglePlacesError extends Error {
  constructor(
    readonly code: "GOOGLE_SEARCH_FAILED" | "GOOGLE_TIMEOUT" | "GOOGLE_SEARCH_BUDGET_EXCEEDED" | "GOOGLE_MALFORMED_RESPONSE" | "GOOGLE_CONFIGURATION_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "GooglePlacesError";
  }
}
