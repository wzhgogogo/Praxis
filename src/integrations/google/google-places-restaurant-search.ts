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

function addressComponents(place: GooglePlacesRawPlace): UntrustedGooglePlaceObservation["addressComponents"] {
  if (!Array.isArray(place.addressComponents)) return undefined;
  const components = place.addressComponents.flatMap((component) => {
    if (!component || typeof component !== "object" || Array.isArray(component)) return [];
    const value = component as Record<string, unknown>;
    const longText = string(value.longText);
    const shortText = string(value.shortText);
    const types = Array.isArray(value.types) && value.types.every((item) => typeof item === "string")
      ? value.types as string[]
      : undefined;
    return longText && types ? [{ longText, ...(shortText ? { shortText } : {}), types }] : [];
  });
  return components.length ? components : undefined;
}

function rawObservation(place: GooglePlacesRawPlace): UntrustedGooglePlaceObservation {
  const placeId = string(place.id);
  const displayName = string(place.displayName?.text);
  const formattedAddress = string(place.formattedAddress);
  const components = addressComponents(place);
  const location = coordinates(place);
  const primaryType = string(place.primaryType);
  const googleMapsUri = string(place.googleMapsUri);
  const nationalPhoneNumber = string(place.nationalPhoneNumber);
  const regularOpeningHours = Array.isArray(place.regularOpeningHours?.weekdayDescriptions) && place.regularOpeningHours.weekdayDescriptions.every((item) => typeof item === "string")
    ? place.regularOpeningHours.weekdayDescriptions as string[] : undefined;
  return {
    ...(placeId ? { placeId } : {}),
    ...(displayName ? { displayName } : {}),
    ...(formattedAddress ? { formattedAddress } : {}),
    ...(components ? { addressComponents: components } : {}),
    ...(location ? { location } : {}),
    ...(Array.isArray(place.types) && place.types.every((item) => typeof item === "string") ? { types: place.types as string[] } : {}),
    ...(primaryType ? { primaryType } : {}),
    ...(googleMapsUri ? { googleMapsUri } : {}),
    ...(nationalPhoneNumber ? { nationalPhoneNumber } : {}),
    ...(regularOpeningHours ? { regularOpeningHours } : {}),
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
      evaluationLocation?: { latitude: number; longitude: number; radiusMeters?: number; label?: string };
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
    const taskLocation = request.intent.area.coordinates;
    const locationContext = taskLocation
      ? { latitude: taskLocation.latitude, longitude: taskLocation.longitude, radiusMeters: request.intent.area.radiusMeters ?? 3_000, label: request.intent.area.query, areaMatchBasis: "TASK_LOCATION_RADIUS" as const }
      : request.intent.area.query.trim().toLowerCase() === "nearby" && this.options.evaluationLocation
        ? { latitude: this.options.evaluationLocation.latitude, longitude: this.options.evaluationLocation.longitude, radiusMeters: this.options.evaluationLocation.radiusMeters ?? 3_000, label: this.options.evaluationLocation.label ?? "explicit evaluation location", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" as const }
        : undefined;
    const places = await this.client.textSearch({
      textQuery,
      pageSize: this.maxResults,
      ...(locationContext
        ? { locationBias: locationContext }
        : {}),
    }, signal);
    const observedAt = this.now();
    const requestFingerprint = createHash("sha256").update(JSON.stringify({ textQuery, area: request.intent.area })).digest("hex");
    const grounded = places.map((place) => groundGoogleDiscovery(rawObservation(place), {
      requestFingerprint,
      observedAt,
      areaQuery: request.intent.area.query,
      requiredTypeCriteria: request.intent.criteria
        .filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD")
        .map((criterion) => criterion.text),
      negativeTypeCriteria: request.intent.criteria
        .filter((criterion) => criterion.polarity === "NEGATIVE" && criterion.strength === "HARD" && criterion.typeExclusionTerms?.length)
        .map((criterion) => ({ text: criterion.text, typeExclusionTerms: criterion.typeExclusionTerms! })),
      requestedDate: request.intent.date,
      requestedTimeWindow: request.intent.timeWindow,
      ...(locationContext ? { evaluationLocation: locationContext } : {}),
    }));
    return {
      candidates: grounded.flatMap((result) => result.accepted ? [result.candidate] : []),
      evidence: grounded.flatMap((result) => result.accepted ? [result.evidence, ...result.additionalEvidence] : []),
      metadata: { provider: "GOOGLE_PLACES" as const, route: this.executionRoute, latencyMs: Date.now() - startedAt },
    };
  }
}
