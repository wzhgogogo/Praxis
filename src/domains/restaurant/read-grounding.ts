import { createHash } from "node:crypto";

import type {
  AvailabilityOffer,
  RestaurantAvailabilityCheck,
  RestaurantAvailabilityRequest,
  RestaurantCandidate,
  RestaurantReadEvidence,
} from "./contracts.js";
import { availabilityFreshnessWindow, isDisplayFresh } from "./availability-freshness.js";

export interface UntrustedGooglePlaceObservation {
  placeId?: string;
  displayName?: string;
  formattedAddress?: string;
  addressComponents?: Array<{ longText: string; shortText?: string; types: string[] }>;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  googleMapsUri?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: string[];
}

export interface UntrustedProviderAvailabilityObservation {
  candidateId: string;
  sourceEntityId?: string;
  sourceUrl?: string;
  observedAt: string;
  /** Only an explicit provider deadline may be carried into booking-policy expiry. */
  sourceExpiresAt?: string;
  entityMatch: { confidence: "HIGH" | "MEDIUM" | "LOW"; matchedBy: string[] };
  requestedDate?: string;
  requestedPartySize?: number;
  visibleSlots?: string[];
  verifiedHardCriteria?: string[];
  pageState:
    | "AVAILABLE"
    | "NO_MATCHING_SLOT"
    | "SOURCE_UNSUPPORTED"
    | "BOT_CHALLENGE"
    | "UNEXPECTED_PAGE"
    | "EXTRACTION_FAILED";
  excerpt?: string;
  failureCode?: string;
}

export type UntrustedTabelogAvailabilityObservation = UntrustedProviderAvailabilityObservation;
export type UntrustedTableCheckAvailabilityObservation = UntrustedProviderAvailabilityObservation;

export type GroundedGoogleDiscovery =
  | { accepted: true; candidate: RestaurantCandidate; evidence: RestaurantReadEvidence; additionalEvidence: RestaurantReadEvidence[] }
  | { accepted: false; reasonCode: string };

export interface GroundedAvailability {
  offers: AvailabilityOffer[];
  check: RestaurantAvailabilityCheck;
  evidence: RestaurantReadEvidence[];
  candidateFactUpdate?: { candidateId: string; matchReasons: string[]; evidenceIds: string[] };
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function evidenceId(kind: string, value: unknown): string {
  return `evidence:restaurant:${kind}:${fingerprint(value).slice(0, 24)}`;
}

function stableCandidateId(placeId: string): string {
  return `praxis:restaurant:${createHash("sha256").update(placeId).digest("hex").slice(0, 24)}`;
}

function usableRestaurant(place: UntrustedGooglePlaceObservation): boolean {
  const types = new Set([...(place.types ?? []), ...(place.primaryType ? [place.primaryType] : [])]);
  return types.has("restaurant") || types.has("cafe") || types.has("food");
}

function normalized(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function requestedAreaName(areaQuery: string): string | undefined {
  const match = areaQuery.trim().match(/^near\s+(.+)$/i);
  const value = (match?.[1] ?? areaQuery).trim();
  return value ? value : undefined;
}

function matchingAddressComponent(
  observation: UntrustedGooglePlaceObservation,
  areaQuery: string,
): { longText: string; types: string[] } | undefined {
  const requested = requestedAreaName(areaQuery);
  if (!requested) return undefined;
  const target = normalized(requested);
  return observation.addressComponents?.find((component) =>
    component.types.some((type) => type === "locality" || type.startsWith("sublocality") || type.startsWith("administrative_area")) &&
    (normalized(component.longText) === target || (component.shortText !== undefined && normalized(component.shortText) === target)),
  );
}

function supportedTypeCriteria(types: string[] | undefined, criteria: string[] | undefined): string[] {
  const sourceTypes = new Set((types ?? []).map((value) => normalized(value.replace(/_/g, " "))));
  return (criteria ?? []).filter((criterion) => sourceTypes.has(normalized(criterion)));
}

/** Provider type labels are retained as source facts, never inferred from a name or query. */
function sourceRestaurantTypeFacts(observation: UntrustedGooglePlaceObservation): string[] {
  return [...new Set([...(observation.types ?? []), ...(observation.primaryType ? [observation.primaryType] : [])]
    .map((value) => normalized(value.replace(/_/g, " ")))
    .filter(Boolean))];
}

/** A generic, source-bound judgment for explicitly type-scoped exclusions.
 * It never treats missing words as proof: a concrete Google primary type must
 * either overlap the avoided type/cuisine or identify a different main type. */
function negativeTypeFacts(
  primaryType: string | undefined,
  criteria: string[] | undefined,
): { verified: string[]; violated: string[]; judgments: string[] } {
  const normalizedPrimary = primaryType ? normalized(primaryType.replace(/_/g, " ")) : undefined;
  if (!normalizedPrimary || ["restaurant", "cafe", "food"].includes(normalizedPrimary)) {
    return { verified: [], violated: [], judgments: [] };
  }
  const primaryTerms = new Set(normalizedPrimary.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  const typeScoped = (criteria ?? []).filter((criterion) => /\b(restaurant|cuisine|dining type)\b/i.test(criterion));
  const result = { verified: [] as string[], violated: [] as string[], judgments: [] as string[] };
  for (const criterion of typeScoped) {
    const criterionTerms = normalized(criterion).split(/[^\p{L}\p{N}]+/u).filter((term) => term.length > 2 && !["restaurant", "cuisine", "dining", "type"].includes(term));
    if (criterionTerms.length === 0) continue;
    const overlaps = criterionTerms.some((term) => primaryTerms.has(term));
    if (overlaps) result.violated.push(criterion);
    else result.verified.push(criterion);
    result.judgments.push(`${criterion}<=primaryType:${normalizedPrimary}`);
  }
  return result;
}

function minutes(value: string): number | undefined {
  const matched = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!matched) return undefined;
  let hour = Number(matched[1]);
  const minute = Number(matched[2] ?? "0");
  const suffix = matched[3]?.toUpperCase();
  if (hour > 23 || minute > 59) return undefined;
  if (suffix) {
    if (hour < 1 || hour > 12) return undefined;
    if (hour === 12) hour = 0;
    if (suffix === "PM") hour += 12;
  }
  return hour * 60 + minute;
}

function hhmm(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

/** Parses only the source's explicit weekly interval notation; unparseable text is unknown. */
function openingHoursForRequest(
  descriptions: string[] | undefined,
  date: string | undefined,
  timeWindow: { earliest: string; latest: string } | undefined,
): { matches: boolean; window?: string[] } | undefined {
  if (!descriptions || !date || !timeWindow) return undefined;
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Tokyo" })
    .format(new Date(`${date}T12:00:00+09:00`));
  const entry = descriptions.find((item) => normalized(item).startsWith(`${normalized(day)}:`));
  if (!entry) return undefined;
  if (/open\s*24\s*hours/i.test(entry)) return { matches: true, window: [timeWindow.earliest, timeWindow.latest] };
  if (/closed/i.test(entry)) return { matches: false };
  const requestedStart = minutes(timeWindow.earliest);
  const requestedEnd = minutes(timeWindow.latest);
  if (requestedStart === undefined || requestedEnd === undefined || requestedEnd < requestedStart) return undefined;
  const intervals = [...entry.matchAll(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/gi)]
    .flatMap((match) => {
      const start = minutes(match[1]!); const end = minutes(match[2]!);
      return start === undefined || end === undefined || end <= start ? [] : [[start, end] as const];
    });
  const matching = intervals.find(([start, end]) => start <= requestedEnd && end >= requestedStart);
  return matching ? { matches: true, window: [hhmm(Math.max(matching[0], requestedStart)), hhmm(Math.min(matching[1], requestedEnd))] } : { matches: false };
}

/**
 * Converts the minimal Google response into a candidate only when the returned
 * structural facts support it. Retrieval relevance never becomes a cuisine claim.
 */
export function groundGoogleDiscovery(
  observation: UntrustedGooglePlaceObservation,
  input: { requestFingerprint: string; observedAt: string; areaQuery: string; evaluationLocation?: { latitude: number; longitude: number; radiusMeters: number; label: string; areaMatchBasis?: "TASK_LOCATION_RADIUS" | "EVALUATION_LOCATION_RADIUS" }; requiredTypeCriteria?: string[]; negativeCriteria?: string[]; requestedDate?: string; requestedTimeWindow?: { earliest: string; latest: string } },
): GroundedGoogleDiscovery {
  if (!observation.placeId?.trim()) return { accepted: false, reasonCode: "GOOGLE_PLACE_ID_MISSING" };
  if (!observation.displayName?.trim()) return { accepted: false, reasonCode: "GOOGLE_NAME_MISSING" };
  if (!observation.formattedAddress?.trim()) return { accepted: false, reasonCode: "GOOGLE_ADDRESS_MISSING" };
  if (!usableRestaurant(observation)) return { accepted: false, reasonCode: "GOOGLE_PLACE_TYPE_UNUSABLE" };
  const areaComponent = matchingAddressComponent(observation, input.areaQuery);
  const latitude = observation.location?.latitude;
  const longitude = observation.location?.longitude;
  const distanceMeters = input.evaluationLocation && latitude !== undefined && longitude !== undefined
    ? Math.round(111_320 * Math.hypot(latitude - input.evaluationLocation.latitude, (longitude - input.evaluationLocation.longitude) * Math.cos(input.evaluationLocation.latitude * Math.PI / 180)))
    : undefined;
  const locationMatch = distanceMeters !== undefined && input.evaluationLocation !== undefined && distanceMeters <= input.evaluationLocation.radiusMeters;
  const areaMatch = areaComponent !== undefined || locationMatch;
  const candidateId = stableCandidateId(observation.placeId);
  const evidence: RestaurantReadEvidence = {
    evidenceId: evidenceId("google-discovery", { placeId: observation.placeId, observedAt: input.observedAt }),
    kind: "DISCOVERY",
    provider: "GOOGLE_PLACES",
    candidateId,
    sourceEntityId: observation.placeId,
    ...(observation.googleMapsUri ? { sourceUrl: observation.googleMapsUri } : {}),
    observedAt: input.observedAt,
    requestFingerprint: input.requestFingerprint,
    claims: {
      placeId: observation.placeId,
      outletName: observation.displayName,
      address: observation.formattedAddress,
      types: [...(observation.types ?? [])],
      areaQuery: input.areaQuery,
      areaMatch,
      ...(areaComponent ? {
        areaMatchBasis: "GOOGLE_ADDRESS_COMPONENT",
        matchedAddressComponent: areaComponent.longText,
        matchedAddressComponentTypes: [...areaComponent.types],
      } : {}),
      ...(locationMatch ? { areaMatchBasis: input.evaluationLocation!.areaMatchBasis ?? "EVALUATION_LOCATION_RADIUS", evaluationLocationLabel: input.evaluationLocation!.label, distanceMeters: distanceMeters! } : {}),
      ...(observation.primaryType ? { primaryType: observation.primaryType } : {}),
      ...(observation.regularOpeningHours ? { regularOpeningHours: [...observation.regularOpeningHours] } : {}),
    },
  };
  const entityEvidence: RestaurantReadEvidence = {
    evidenceId: evidenceId("google-entity", { placeId: observation.placeId, observedAt: input.observedAt }),
    kind: "ENTITY_MATCH",
    provider: "GOOGLE_PLACES",
    candidateId,
    sourceEntityId: observation.placeId,
    ...(observation.googleMapsUri ? { sourceUrl: observation.googleMapsUri } : {}),
    observedAt: input.observedAt,
    requestFingerprint: input.requestFingerprint,
    claims: { placeId: observation.placeId, outletName: observation.displayName, address: observation.formattedAddress },
    entityMatch: { confidence: "HIGH", matchedBy: ["GOOGLE_PLACE_ID"] },
  };
  const restaurantTypeFacts = sourceRestaurantTypeFacts(observation);
  const verifiedHardCriteria = supportedTypeCriteria(restaurantTypeFacts, input.requiredTypeCriteria);
  const negativeTypes = negativeTypeFacts(observation.primaryType, input.negativeCriteria);
  const openingHours = openingHoursForRequest(observation.regularOpeningHours, input.requestedDate, input.requestedTimeWindow);
  const facts: RestaurantReadEvidence[] = restaurantTypeFacts.length || openingHours !== undefined ? [{
    evidenceId: evidenceId("google-facts", { placeId: observation.placeId, observedAt: input.observedAt, verifiedHardCriteria, openingHours }),
    kind: "RESTAURANT_FACT",
    provider: "GOOGLE_PLACES",
    candidateId,
    sourceEntityId: observation.placeId,
    ...(observation.googleMapsUri ? { sourceUrl: observation.googleMapsUri } : {}),
    observedAt: input.observedAt,
    requestFingerprint: input.requestFingerprint,
    claims: {
      ...(verifiedHardCriteria.length ? { verifiedHardCriteria } : {}),
      ...(negativeTypes.verified.length ? { verifiedNegativeCriteria: negativeTypes.verified } : {}),
      ...(negativeTypes.violated.length ? { violatedNegativeCriteria: negativeTypes.violated } : {}),
      ...(negativeTypes.judgments.length ? { negativeCriterionJudgments: negativeTypes.judgments } : {}),
      restaurantTypeFacts,
      ...(observation.regularOpeningHours ? { regularOpeningHours: [...observation.regularOpeningHours] } : {}),
      ...(openingHours ? { openingHoursMatch: openingHours.matches, ...(openingHours.window ? { openingHoursMatchedWindow: openingHours.window } : {}) } : {}),
    },
  }] : [];
  return {
    accepted: true,
    candidate: {
      restaurant: {
        id: candidateId,
        outletName: observation.displayName.trim(),
        sourceIds: { googlePlaces: observation.placeId, ...(observation.nationalPhoneNumber ? { phone: observation.nationalPhoneNumber } : {}) },
        address: observation.formattedAddress.trim(),
        ...(observation.location?.latitude !== undefined && observation.location.longitude !== undefined
          ? { coordinates: { lat: observation.location.latitude, lng: observation.location.longitude } }
          : {}),
        provenance: { outletName: evidence.evidenceId, address: evidence.evidenceId, sourceIds: evidence.evidenceId },
      },
      matchReasons: areaMatch ? [`Address explicitly matches requested area: ${input.areaQuery}`] : [],
      warnings: areaMatch ? [] : [`Requested area ${input.areaQuery} is not explicitly supported by this discovery result.`],
      executionConfidence: "LOW",
    },
    evidence,
    additionalEvidence: [entityEvidence, ...facts],
  };
}

function checkForFailure(
  observation: UntrustedTabelogAvailabilityObservation,
): RestaurantAvailabilityCheck {
  const checkedAt = observation.observedAt;
  // A browser session failure occurs before Tabelog identity evidence exists.
  // Do not mislabel that infrastructure failure as an outlet mismatch.
  if (observation.pageState === "EXTRACTION_FAILED" && (
    observation.failureCode === "BROWSER_RUNTIME_FAILED" || observation.failureCode === "BROWSER_TIMEOUT"
  )) {
    return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: observation.failureCode };
  }
  // A bot challenge is an observed page-level failure, not an outlet identity claim.
  if (observation.pageState === "BOT_CHALLENGE") {
    return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "BOT_CHALLENGE" };
  }
  // A provider-declared unavailable page precedes outlet comparison; it may be
  // safely followed by another availability source.
  if (observation.pageState === "SOURCE_UNSUPPORTED") {
    return { status: "SOURCE_UNSUPPORTED", checkedAt, evidenceIds: [], reasonCode: observation.failureCode ?? "SOURCE_UNSUPPORTED" };
  }
  if (observation.entityMatch.confidence !== "HIGH") {
    // TableCheck discovery has provider-specific, fail-closed outcomes that must
    // remain observable instead of being collapsed into a generic identity result.
    const tableCheckFailure = observation.failureCode?.startsWith("TABLECHECK_") ? observation.failureCode : undefined;
    return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: tableCheckFailure ?? "ENTITY_MATCH_UNCERTAIN" };
  }
  switch (observation.pageState) {
    case "NO_MATCHING_SLOT": return { status: "UNAVAILABLE", checkedAt, evidenceIds: [] };
    case "UNEXPECTED_PAGE": return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "UNEXPECTED_PAGE" };
    case "EXTRACTION_FAILED": return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: observation.failureCode ?? "EXTRACTION_FAILED" };
    case "AVAILABLE": return { status: "AVAILABLE", checkedAt, evidenceIds: [] };
  }
}

/**
 * Ground one untrusted page observation. Only a HIGH outlet match, matching
 * schedule, visible qualifying slot and fresh timestamp can produce an offer.
 */
export function groundProviderAvailability(
  provider: Extract<RestaurantReadEvidence["provider"], "TABLECHECK" | "TABELOG">,
  candidate: RestaurantCandidate,
  request: RestaurantAvailabilityRequest,
  observation: UntrustedProviderAvailabilityObservation,
  now: string,
): GroundedAvailability {
  let check = checkForFailure(observation);
  if (observation.candidateId !== candidate.restaurant.id) {
    return { offers: [], check: { status: "UNKNOWN", checkedAt: observation.observedAt, evidenceIds: [], reasonCode: "ENTITY_MATCH_UNCERTAIN" }, evidence: [] };
  }
  if (observation.entityMatch.confidence !== "HIGH") return { offers: [], check, evidence: [] };
  if (observation.pageState !== "AVAILABLE" && observation.pageState !== "NO_MATCHING_SLOT") {
    return { offers: [], check, evidence: [] };
  }
  if (observation.requestedDate !== request.date || observation.requestedPartySize !== request.partySize) {
    return { offers: [], check: { status: "UNKNOWN", checkedAt: observation.observedAt, evidenceIds: [], reasonCode: "REQUEST_MISMATCH" }, evidence: [] };
  }
  const freshness = Number.isNaN(Date.parse(observation.observedAt))
    ? undefined
    : availabilityFreshnessWindow(observation.observedAt, observation.sourceExpiresAt);
  if (!freshness || !isDisplayFresh(freshness.displayExpiresAt, now)) {
    return { offers: [], check: { status: "UNKNOWN", checkedAt: observation.observedAt, evidenceIds: [], reasonCode: "STALE_OBSERVATION" }, evidence: [] };
  }
  const withinWindow = (observation.visibleSlots ?? []).filter((slot) =>
    /^\d{2}:\d{2}$/.test(slot) && slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest,
  );
  if (observation.pageState === "AVAILABLE" && withinWindow.length === 0) {
    return { offers: [], check: { status: "UNKNOWN", checkedAt: observation.observedAt, evidenceIds: [], reasonCode: "EXTRACTION_FAILED" }, evidence: [] };
  }
  const entityEvidence: RestaurantReadEvidence = {
    evidenceId: evidenceId(`${provider.toLocaleLowerCase("en-US")}-entity-match`, { candidateId: candidate.restaurant.id, sourceEntityId: observation.sourceEntityId, observedAt: observation.observedAt }),
    kind: "ENTITY_MATCH",
    provider,
    candidateId: candidate.restaurant.id,
    ...(observation.sourceEntityId ? { sourceEntityId: observation.sourceEntityId } : {}),
    ...(observation.sourceUrl ? { sourceUrl: observation.sourceUrl } : {}),
    observedAt: observation.observedAt,
    requestFingerprint: fingerprint({ candidateId: candidate.restaurant.id, sourceEntityId: observation.sourceEntityId }),
    claims: { outletName: candidate.restaurant.outletName },
    entityMatch: { confidence: "HIGH", matchedBy: [...observation.entityMatch.matchedBy] },
  };
  const factEvidence: RestaurantReadEvidence | undefined = observation.verifiedHardCriteria?.length ? {
    evidenceId: evidenceId(`${provider.toLocaleLowerCase("en-US")}-hard-criteria`, { candidateId: candidate.restaurant.id, observedAt: observation.observedAt, criteria: observation.verifiedHardCriteria }),
    kind: "RESTAURANT_FACT",
    provider,
    candidateId: candidate.restaurant.id,
    ...(observation.sourceEntityId ? { sourceEntityId: observation.sourceEntityId } : {}),
    ...(observation.sourceUrl ? { sourceUrl: observation.sourceUrl } : {}),
    observedAt: observation.observedAt,
    requestFingerprint: fingerprint({ candidateId: candidate.restaurant.id, criteria: observation.verifiedHardCriteria }),
    claims: { verifiedHardCriteria: [...observation.verifiedHardCriteria] },
    entityMatch: { confidence: "HIGH", matchedBy: [...observation.entityMatch.matchedBy] },
  } : undefined;
  const availabilityEvidence: RestaurantReadEvidence = {
    evidenceId: evidenceId(`${provider.toLocaleLowerCase("en-US")}-availability`, { candidateId: candidate.restaurant.id, sourceEntityId: observation.sourceEntityId, observedAt: observation.observedAt, slots: withinWindow }),
    kind: "AVAILABILITY",
    provider,
    candidateId: candidate.restaurant.id,
    ...(observation.sourceEntityId ? { sourceEntityId: observation.sourceEntityId } : {}),
    ...(observation.sourceUrl ? { sourceUrl: observation.sourceUrl } : {}),
    observedAt: observation.observedAt,
    displayExpiresAt: freshness.displayExpiresAt,
    ...(freshness.sourceExpiresAt ? { sourceExpiresAt: freshness.sourceExpiresAt } : {}),
    freshnessPolicyVersion: freshness.policyVersion,
    requestFingerprint: fingerprint(request),
    claims: { date: request.date, partySize: request.partySize, visibleSlots: withinWindow },
    entityMatch: { confidence: "HIGH", matchedBy: [...observation.entityMatch.matchedBy] },
    ...(observation.excerpt ? { artifactRef: { kind: "DOM_EXCERPT", reference: `sha256:${fingerprint(observation.excerpt)}` } } : {}),
  };
  const evidence = [entityEvidence, ...(factEvidence ? [factEvidence] : []), availabilityEvidence];
  check = {
    ...check,
    evidenceIds: evidence.map((item) => item.evidenceId),
    displayExpiresAt: freshness.displayExpiresAt,
    freshnessPolicyVersion: freshness.policyVersion,
    ...(freshness.sourceExpiresAt ? { expiresAt: freshness.sourceExpiresAt } : {}),
  };
  const candidateFactUpdate = factEvidence ? {
    candidateId: candidate.restaurant.id,
    matchReasons: observation.verifiedHardCriteria!.map((criterion) => `Verified HARD criterion from source: ${criterion}`),
    evidenceIds: [factEvidence.evidenceId],
  } : undefined;
  if (check.status !== "AVAILABLE") return { offers: [], check, evidence, ...(candidateFactUpdate ? { candidateFactUpdate } : {}) };
  // A read-only observation without a provider deadline is displayable, but it
  // cannot be reused as a booking-ready offer without the later mandated recheck.
  const expiresAt = freshness.sourceExpiresAt ?? observation.observedAt;
  return {
    offers: withinWindow.map((slot) => ({
      id: `offer:${provider.toLocaleLowerCase("en-US")}:${candidate.restaurant.id}:${request.date}:${slot}:${request.partySize}`,
      restaurantId: candidate.restaurant.id,
      source: provider,
      dateTime: `${request.date}T${slot}:00+09:00`,
      timezone: "Asia/Tokyo",
      partySize: request.partySize,
      bookingMode: "REQUEST",
      executionMode: "BROWSER",
      checkedAt: observation.observedAt,
      displayExpiresAt: freshness.displayExpiresAt,
      ...(freshness.sourceExpiresAt ? { sourceExpiresAt: freshness.sourceExpiresAt } : {}),
      bookingRecheckRequired: freshness.sourceExpiresAt === undefined,
      expiresAt,
    })),
    check,
    evidence,
    ...(candidateFactUpdate ? { candidateFactUpdate } : {}),
  };
}

export function groundTabelogAvailability(
  candidate: RestaurantCandidate,
  request: RestaurantAvailabilityRequest,
  observation: UntrustedTabelogAvailabilityObservation,
  now: string,
): GroundedAvailability {
  return groundProviderAvailability("TABELOG", candidate, request, observation, now);
}

export function groundTableCheckAvailability(
  candidate: RestaurantCandidate,
  request: RestaurantAvailabilityRequest,
  observation: UntrustedTableCheckAvailabilityObservation,
  now: string,
): GroundedAvailability {
  return groundProviderAvailability("TABLECHECK", candidate, request, observation, now);
}
