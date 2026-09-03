import { createHash } from "node:crypto";

import type { RestaurantSearchPort } from "../../application/restaurant-execution-router.js";
import { groundGoogleDiscovery, type UntrustedGooglePlaceObservation } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantSearchRequest } from "../../domains/restaurant/contracts.js";
import { GooglePlacesClient } from "./google-places-client.js";
import { GooglePlacesError, type GooglePlacesRawPlace } from "./google-places-contracts.js";

function string(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function coordinates(place: GooglePlacesRawPlace): { latitude?: number; longitude?: number } | undefined {
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  return typeof latitude === "number" && typeof longitude === "number" ? { latitude, longitude } : undefined;
}

function rawObservation(place: GooglePlacesRawPlace): UntrustedGooglePlaceObservation {
  const placeId = string(place.id);
  const displayName = string(place.displayName?.text);
  const formattedAddress = string(place.formattedAddress);
  const location = coordinates(place);
  const primaryType = string(place.primaryType);
  const googleMapsUri = string(place.googleMapsUri);
  const nationalPhoneNumber = string(place.nationalPhoneNumber);
  return {
    ...(placeId ? { placeId } : {}),
    ...(displayName ? { displayName } : {}),
    ...(formattedAddress ? { formattedAddress } : {}),
    ...(location ? { location } : {}),
    ...(Array.isArray(place.types) && place.types.every((item) => typeof item === "string") ? { types: place.types as string[] } : {}),
    ...(primaryType ? { primaryType } : {}),
    ...(googleMapsUri ? { googleMapsUri } : {}),
    ...(nationalPhoneNumber ? { nationalPhoneNumber } : {}),
  };
}

/** Domain-safe query construction: only retrieval words vary; intent schedule remains untouched. */
export function buildGooglePlacesTextQuery(request: RestaurantSearchRequest): string {
  const hardPositive = request.intent.criteria
    .filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD")
    .map((criterion) => criterion.text);
  const target = request.intent.target?.query ? [request.intent.target.query] : [];
  const hint = request.retrievalHint?.trim() ? [request.retrievalHint.trim()] : [];
  const area = request.intent.area.query.trim().toLowerCase() === "nearby" ? [] : [request.intent.area.query];
  return [...target, ...hardPositive, "restaurant", "near", ...area, ...hint]
    .filter(Boolean)
    .join(" ");
}

export class GooglePlacesRestaurantSearch implements RestaurantSearchPort {
  readonly executionRoute = "STRUCTURED_ADAPTER" as const;
  private searchesPerformed = 0;

  constructor(
    private readonly client: GooglePlacesClient,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly maxResults = 10,
    private readonly options: {
      evaluationLocation?: { latitude: number; longitude: number; radiusMeters?: number };
      maxSearches?: number;
    } = {},
  ) {}

  async search(request: RestaurantSearchRequest, signal: AbortSignal) {
    if (this.searchesPerformed >= (this.options.maxSearches ?? Number.POSITIVE_INFINITY)) {
      throw new GooglePlacesError("GOOGLE_SEARCH_BUDGET_EXCEEDED", "Google Places search budget is exhausted for this diagnostic");
    }
    this.searchesPerformed += 1;
    const startedAt = Date.now();
    const textQuery = buildGooglePlacesTextQuery(request);
    const places = await this.client.textSearch({
      textQuery,
      pageSize: this.maxResults,
      ...(request.intent.area.query.trim().toLowerCase() === "nearby" && this.options.evaluationLocation
        ? { locationBias: this.options.evaluationLocation }
        : {}),
    }, signal);
    const observedAt = this.now();
    const requestFingerprint = createHash("sha256").update(JSON.stringify({ textQuery, area: request.intent.area })).digest("hex");
    const grounded = places.map((place) => groundGoogleDiscovery(rawObservation(place), {
      requestFingerprint,
      observedAt,
      areaQuery: request.intent.area.query,
    }));
    return {
      candidates: grounded.flatMap((result) => result.accepted ? [result.candidate] : []),
      evidence: grounded.flatMap((result) => result.accepted ? [result.evidence] : []),
      metadata: { provider: "GOOGLE_PLACES" as const, route: this.executionRoute, latencyMs: Date.now() - startedAt },
    };
  }
}
