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
  | { accepted: true; candidate: RestaurantCandidate; evidence: RestaurantReadEvidence }
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

/**
 * Converts the minimal Google response into a candidate only when the returned
 * structural facts support it. Retrieval relevance never becomes a cuisine claim.
 */
export function groundGoogleDiscovery(
  observation: UntrustedGooglePlaceObservation,
  input: { requestFingerprint: string; observedAt: string; areaQuery: string },
): GroundedGoogleDiscovery {
  if (!observation.placeId?.trim()) return { accepted: false, reasonCode: "GOOGLE_PLACE_ID_MISSING" };
  if (!observation.displayName?.trim()) return { accepted: false, reasonCode: "GOOGLE_NAME_MISSING" };
  if (!observation.formattedAddress?.trim()) return { accepted: false, reasonCode: "GOOGLE_ADDRESS_MISSING" };
  if (!usableRestaurant(observation)) return { accepted: false, reasonCode: "GOOGLE_PLACE_TYPE_UNUSABLE" };
  const areaComponent = matchingAddressComponent(observation, input.areaQuery);
  const areaMatch = areaComponent !== undefined;
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
      ...(observation.primaryType ? { primaryType: observation.primaryType } : {}),
    },
  };
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
