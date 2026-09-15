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
type GoogleRequestKind = "namedPlaceResolution" | "discovery" | "placeDetails";
type GoogleRequestUsage = {
  limit: number;
  total: number;
  namedPlaceResolution: number;
  discovery: number;
  placeDetails: number;
};

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
  const normalizedValue = normalizedLocationName(value);
  const normalizedQuery = normalizedLocationName(query);
  // Text-search rank, a returned address, and arbitrary name suffixes do not
  // establish that a place is the landmark the user named.  Source-provided
  // language/alias correspondence is required before we broaden this beyond
  // normalized public display-name equality.
  return normalizedValue.length > 0 && normalizedValue === normalizedQuery;
}

function normalizedLocationName(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function namedLocationObservation(place: GooglePlacesRawPlace): string {
  const name = string(place.displayName?.text) ?? "missing-name";
  const address = string(place.formattedAddress) ?? "missing-address";
  const types = Array.isArray(place.types) && place.types.every((item) => typeof item === "string")
    ? place.types.join(",")
    : "missing-types";
  const placeId = string(place.id) ?? "missing-place-id";
  const point = coordinates(place);
  const coordinate = point ? `${point.latitude},${point.longitude}` : "missing-coordinates";
  return `name=${JSON.stringify(name)} address=${JSON.stringify(address)} types=${JSON.stringify(types)} placeId=${JSON.stringify(placeId)} coordinate=${JSON.stringify(coordinate)}`;
}

export class GooglePlacesRestaurantSearch implements RestaurantSearchPort, RestaurantCandidateFactPort {
  readonly executionRoute = "STRUCTURED_ADAPTER" as const;
  /** One local workspace composes providers once, so counters must be keyed by
   * the persistent task run rather than accidentally shared by every user. */
  private readonly requestsPerformed = new Map<string, Omit<GoogleRequestUsage, "limit" | "total">>();

  constructor(
    private readonly client: GooglePlacesClient,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly maxResults = 10,
    private readonly options: {
      evaluationLocation?: { latitude: number; longitude: number; radiusMeters?: number; label?: string };
      /** Shared per-run ceiling across named-place resolution, discovery, and Details. */
      maxRequests?: number;
    } = {},
  ) {}

  private requestCounts(runId: string | undefined): Omit<GoogleRequestUsage, "limit" | "total"> {
    return this.requestsPerformed.get(runId ?? "unscoped") ?? {
      namedPlaceResolution: 0,
      discovery: 0,
      placeDetails: 0,
    };
  }

  private consumeRequest(runId: string | undefined, kind: GoogleRequestKind): void {
    const key = runId ?? "unscoped";
    const counts = this.requestCounts(key);
    this.requestsPerformed.set(key, { ...counts, [kind]: counts[kind] + 1 });
  }

  private hasBudget(runId: string | undefined): boolean {
    const counts = this.requestCounts(runId);
    return counts.namedPlaceResolution + counts.discovery + counts.placeDetails < (this.options.maxRequests ?? Number.POSITIVE_INFINITY);
  }

  /** Read-only accounting for the Router trajectory and exported run artifact. */
  googleRequestUsage(readRunId: string | undefined): GoogleRequestUsage {
    const counts = this.requestCounts(readRunId);
    return {
      limit: this.options.maxRequests ?? Number.POSITIVE_INFINITY,
      total: counts.namedPlaceResolution + counts.discovery + counts.placeDetails,
      ...counts,
    };
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
      throw new GooglePlacesError("GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", "The local per-run Google request budget is exhausted before named-place resolution");
    }
    this.consumeRequest(request.readRunId, "namedPlaceResolution");
    // Named-place resolution is one bounded source request, but it must see
    // enough ranked observations to distinguish a genuine ambiguity from a
    // harmless display-name variant. It shares the same run budget as every
    // other Google read.
    const places = await this.client.textSearch({ textQuery: query, pageSize: Math.max(10, this.maxResults) }, signal);
    const exactMatches = places.filter((item) => {
      const label = string(item.displayName?.text); const point = coordinates(item);
      return point !== undefined && label !== undefined && sameNamedLocation(label, query);
    });
    const sourceObservations = places.map(namedLocationObservation).join("; ") || "no returned places";
    if (exactMatches.length > 1) {
      throw new GooglePlacesError("GOOGLE_LOCATION_AMBIGUOUS", `Google Places returned multiple coordinate-bearing matches for the named location ${JSON.stringify(query)}. Observations: ${sourceObservations}`);
    }
    // Text-search relevance is not location identity.  In particular, never
    // turn the first unrelated result into the user's named landmark just
    // because the exact name lookup returned nothing.
    const place = exactMatches[0];
    const placeId = place && string(place.id);
    const label = place && string(place.displayName?.text);
    const resolved = place && coordinates(place);
    if (!placeId || !label || !resolved) {
      throw new GooglePlacesError("GOOGLE_LOCATION_UNRESOLVED", `Google Places could not resolve coordinates for the named location ${JSON.stringify(query)}. Observations: ${sourceObservations}`);
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
      throw new GooglePlacesError("GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", "The local per-run Google request budget is exhausted before discovery");
    }
    const startedAt = Date.now();
    const textQuery = buildGooglePlacesTextQuery(request);
    const taskLocation = request.intent.area.coordinates;
    const namedLocation = taskLocation ? {} : await this.resolveNamedNearbyLocation(request, signal);
    if (!this.hasBudget(request.readRunId)) {
      throw new GooglePlacesError("GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", "The local per-run Google request budget is exhausted before restaurant discovery");
    }
    this.consumeRequest(request.readRunId, "discovery");
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
      metadata: {
        provider: "GOOGLE_PLACES" as const,
        route: this.executionRoute,
        latencyMs: Date.now() - startedAt,
        googleRequests: this.googleRequestUsage(request.readRunId),
      },
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
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" };
        exhausted = true;
        continue;
      }
      const placeId = candidate.restaurant.sourceIds.googlePlaces;
      if (!placeId) {
        factChecks[candidate.restaurant.id] = { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "GOOGLE_PLACE_ID_MISSING" };
        continue;
      }
      this.consumeRequest(request.readRunId, "placeDetails");
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
        googleRequests: this.googleRequestUsage(request.readRunId),
        ...(exhausted ? { failureCode: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" } : {}),
      },
    };
  }
}
