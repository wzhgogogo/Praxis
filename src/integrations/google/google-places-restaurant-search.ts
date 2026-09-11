import { createHash } from "node:crypto";

import type { RestaurantCandidateFactPort, RestaurantSearchPort } from "../../application/restaurant-execution-router.js";
import { groundGoogleDiscovery, type UntrustedGooglePlaceObservation } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantCandidateFactRequest, RestaurantSearchRequest } from "../../domains/restaurant/contracts.js";
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
  const websiteUri = string(place.websiteUri);
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
    ...(websiteUri ? { websiteUri } : {}),
    ...(nationalPhoneNumber ? { nationalPhoneNumber } : {}),
    ...(regularOpeningHours ? { regularOpeningHours } : {}),
  };
}

/** Domain-safe query construction: only retrieval words vary; intent schedule remains untouched. */
export function buildGooglePlacesTextQuery(request: RestaurantSearchRequest): string {
  // Discovery is not condition verification.  The target and optional retrieval
  // hint are owned by the Agent; the full authoritative criteria remain in the
  // request for later grounding instead of being mechanically repeated here.
  const target = request.intent.target?.query ? [request.intent.target.query] : [];
  const hint = request.retrievalHint?.trim() ? [request.retrievalHint.trim()] : [];
  const area = request.intent.area.query.trim().toLowerCase() === "nearby" ? [] : [request.intent.area.query];
  return [...target, "restaurant", ...area, ...hint]
    .filter(Boolean)
    .join(" ");
}

const NAMED_PLACE_NEARBY_RADIUS_METERS = 1_000;

function namedNearbyQuery(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLocaleLowerCase("en-US") === "nearby") return undefined;
  // The semantic contract deliberately keeps AREA as faithful user language.
  // These relation words select coordinate evaluation; they are never aliases
  // between station and administrative-area names.
  if (!/(?:\bnear\b|nearby|附近|周辺|周边)/iu.test(trimmed)) return undefined;
  return trimmed
    .replace(/(?:\bnear\b|nearby|附近|周辺|周边)/giu, " ")
    .replace(/^[\s,，]+|[\s,，]+$/gu, "")
    .trim() || undefined;
}

function sameNamedLocation(value: string, query: string): boolean {
  return normalizedLocationName(value) === normalizedLocationName(query);
}

function normalizedLocationName(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

export class GooglePlacesRestaurantSearch implements RestaurantSearchPort, RestaurantCandidateFactPort {
  readonly executionRoute = "STRUCTURED_ADAPTER" as const;
  /** One local workspace composes providers once, so counters must be keyed by
   * the persistent task run rather than accidentally shared by every user. */
  private readonly searchesPerformed = new Map<string, number>();

  constructor(
    private readonly client: GooglePlacesClient,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly maxResults = 10,
    private readonly options: {
      evaluationLocation?: { latitude: number; longitude: number; radiusMeters?: number; label?: string };
      maxSearches?: number;
    } = {},
  ) {}

  private searchesFor(runId: string | undefined): number {
    return this.searchesPerformed.get(runId ?? "unscoped") ?? 0;
  }

  private consumeSearch(runId: string | undefined): void {
    const key = runId ?? "unscoped";
    this.searchesPerformed.set(key, this.searchesFor(key) + 1);
  }

  private hasBudget(runId: string | undefined): boolean {
    return this.searchesFor(runId) < (this.options.maxSearches ?? Number.POSITIVE_INFINITY);
  }

  /**
   * A named nearby place is resolved once through the same bounded Google
   * capability as discovery.  Its coordinates are an observed source fact,
   * not an address-string alias or a hidden test coordinate.
   */
  private async resolveNamedNearbyLocation(
    request: RestaurantSearchRequest,
    signal: AbortSignal,
  ): Promise<{ location?: { latitude: number; longitude: number; radiusMeters: number; label: string; areaMatchBasis: "NAMED_PLACE_RADIUS" }; evidence?: import("../../domains/restaurant/contracts.js").RestaurantReadEvidence }> {
    const query = namedNearbyQuery(request.intent.area.query);
    if (!query) return {};
    if (!this.hasBudget(request.readRunId)) {
      throw new GooglePlacesError("GOOGLE_SEARCH_BUDGET_EXCEEDED", "Google Places budget is exhausted before named-place resolution");
    }
    this.consumeSearch(request.readRunId);
    const places = await this.client.textSearch({ textQuery: query, pageSize: 3 }, signal);
    const exactMatches = places.filter((item) => {
      const label = string(item.displayName?.text); const point = coordinates(item);
      return label !== undefined && point !== undefined && sameNamedLocation(label, query);
    });
    if (exactMatches.length > 1) {
      throw new GooglePlacesError("GOOGLE_LOCATION_AMBIGUOUS", `Google Places returned multiple coordinate-bearing matches for the named location ${query}`);
    }
    const place = exactMatches[0] ?? places[0];
    const placeId = place && string(place.id);
    const label = place && string(place.displayName?.text);
    const resolved = place && coordinates(place);
    if (!placeId || !label || !resolved) {
      throw new GooglePlacesError("GOOGLE_LOCATION_UNRESOLVED", `Google Places could not resolve coordinates for the named location ${query}`);
    }
    const observedAt = this.now();
    const radiusMeters = request.intent.area.radiusMeters ?? NAMED_PLACE_NEARBY_RADIUS_METERS;
    const requestFingerprint = createHash("sha256").update(JSON.stringify({ namedLocation: query, placeId, radiusMeters })).digest("hex");
    return {
      location: { latitude: resolved.latitude!, longitude: resolved.longitude!, radiusMeters, label, areaMatchBasis: "NAMED_PLACE_RADIUS" },
      evidence: {
        evidenceId: createHash("sha256").update(JSON.stringify({ namedLocation: placeId, observedAt, requestFingerprint })).digest("hex"),
        kind: "DISCOVERY",
        provider: "GOOGLE_PLACES",
        sourceEntityId: placeId,
        observedAt,
        requestFingerprint,
        claims: {
          locationResolutionQuery: query,
          resolvedPlaceName: label,
          resolvedPlaceId: placeId,
          latitude: resolved.latitude!,
          longitude: resolved.longitude!,
          radiusMeters,
          locationResolutionSource: "GOOGLE_TEXT_SEARCH",
        },
      },
    };
  }

  async search(request: RestaurantSearchRequest, signal: AbortSignal) {
    if (!this.hasBudget(request.readRunId)) {
      throw new GooglePlacesError("GOOGLE_SEARCH_BUDGET_EXCEEDED", "Google Places search budget is exhausted for this diagnostic");
    }
    const startedAt = Date.now();
    const textQuery = buildGooglePlacesTextQuery(request);
    const taskLocation = request.intent.area.coordinates;
    const namedLocation = taskLocation ? {} : await this.resolveNamedNearbyLocation(request, signal);
    if (!this.hasBudget(request.readRunId)) {
      throw new GooglePlacesError("GOOGLE_SEARCH_BUDGET_EXCEEDED", "Google Places budget is exhausted before restaurant discovery");
    }
    this.consumeSearch(request.readRunId);
    const locationContext = taskLocation
      ? { latitude: taskLocation.latitude, longitude: taskLocation.longitude, radiusMeters: request.intent.area.radiusMeters ?? 3_000, label: request.intent.area.query, areaMatchBasis: "TASK_LOCATION_RADIUS" as const }
      : namedLocation.location ?? (request.intent.area.query.trim().toLowerCase() === "nearby" && this.options.evaluationLocation
        ? { latitude: this.options.evaluationLocation.latitude, longitude: this.options.evaluationLocation.longitude, radiusMeters: this.options.evaluationLocation.radiusMeters ?? 3_000, label: this.options.evaluationLocation.label ?? "explicit evaluation location", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" as const }
        : undefined);
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
      negativeCriteria: request.intent.criteria
        .filter((criterion) => criterion.polarity === "NEGATIVE" && criterion.strength === "HARD")
        .map((criterion) => criterion.text),
      ...(request.intent.date ? { requestedDate: request.intent.date } : {}),
      ...(request.intent.timeWindow ? { requestedTimeWindow: request.intent.timeWindow } : {}),
      ...(locationContext ? { evaluationLocation: locationContext } : {}),
    }));
    return {
      candidates: grounded.flatMap((result) => result.accepted ? [result.candidate] : []),
      evidence: [...(namedLocation.evidence ? [namedLocation.evidence] : []), ...grounded.flatMap((result) => result.accepted ? [result.evidence, ...result.additionalEvidence] : [])],
      metadata: { provider: "GOOGLE_PLACES" as const, route: this.executionRoute, latencyMs: Date.now() - startedAt },
    };
  }

  /**
   * Re-read one known Google Place through its stable source ID. This is a
   * fact-only capability: it never changes the candidate pool or asserts a
   * slot, and it shares the same bounded Google-call counter as discovery.
   */
  async inspectFacts(request: RestaurantCandidateFactRequest, signal: AbortSignal) {
    const startedAt = Date.now();
    const evidence = [] as import("../../domains/restaurant/contracts.js").RestaurantReadEvidence[];
    const checkedAt = this.now();
    const factChecks: import("../../domains/restaurant/contracts.js").RestaurantCandidateFactRead["factChecks"] = {};
    let exhausted = false;
    for (const candidate of request.candidates) {
      if (!this.hasBudget(request.readRunId)) {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "GOOGLE_SEARCH_BUDGET_EXCEEDED" };
        exhausted = true;
        continue;
      }
      const placeId = candidate.restaurant.sourceIds.googlePlaces;
      if (!placeId) {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "GOOGLE_PLACE_ID_MISSING" };
        continue;
      }
      this.consumeSearch(request.readRunId);
      const matching = await this.client.placeDetails(placeId, signal);
      if (string(matching.id) !== placeId) {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "GOOGLE_PLACE_ID_MISMATCH" };
        continue;
      }
      const requestFingerprint = createHash("sha256").update(JSON.stringify({ factRead: placeId, intent: request.intent })).digest("hex");
      const grounded = groundGoogleDiscovery(rawObservation(matching), {
        requestFingerprint,
        observedAt: checkedAt,
        areaQuery: request.intent.area.query,
        requiredTypeCriteria: request.intent.criteria.filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD").map((criterion) => criterion.text),
        negativeCriteria: request.intent.criteria.filter((criterion) => criterion.polarity === "NEGATIVE" && criterion.strength === "HARD").map((criterion) => criterion.text),
        ...(request.intent.date ? { requestedDate: request.intent.date } : {}),
        ...(request.intent.timeWindow ? { requestedTimeWindow: request.intent.timeWindow } : {}),
      });
      if (!grounded.accepted || grounded.candidate.restaurant.id !== candidate.restaurant.id) {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "GOOGLE_CANDIDATE_MISMATCH" };
        continue;
      }
      const candidateEvidence = grounded.additionalEvidence.filter((item) => item.candidateId === candidate.restaurant.id);
      evidence.push(...candidateEvidence);
      factChecks[candidate.restaurant.id] = { status: "COMPLETED", checkedAt, evidenceIds: candidateEvidence.map((item) => item.evidenceId) };
    }
    return {
      evidence,
      factChecks,
      metadata: {
        provider: "GOOGLE_PLACES" as const,
        route: this.executionRoute,
        latencyMs: Date.now() - startedAt,
        ...(exhausted ? { failureCode: "GOOGLE_SEARCH_BUDGET_EXCEEDED" } : {}),
      },
    };
  }
}
