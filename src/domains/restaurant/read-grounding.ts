import { createHash } from "node:crypto";

import type {
  AvailabilityOffer,
  RestaurantAvailabilityCheck,
  RestaurantAvailabilityRequest,
  RestaurantCandidate,
  RestaurantReadEvidence,
  RestaurantReceptionMode,
  RestaurantServiceScope,
  RestaurantSearchIntent,
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
  /** A Google-provided website pointer. It is not itself an official-page fact. */
  websiteUri?: string;
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
  /** The single current source category whose facts and inventory were read. */
  serviceScope?: RestaurantServiceScope;
  visibleSlots?: string[];
  /** Source-observed complete course descriptions, not selected-plan availability. */
  listedCourseDetails?: string[];
  sourceFieldQuotes?: import("./contracts.js").RestaurantSourceFieldQuote[];
  priceFacts?: import("./price-facts.js").RestaurantPriceFacts | undefined;
  /** Explicit page-supported reception information; missing booking UI is not evidence of walk-in. */
  receptionMode?: RestaurantReceptionMode;
  /** A short page-derived walk-in statement when walk-in is explicitly supported. */
  walkInEvidence?: string;
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

export type GroundedGoogleDiscovery =
  | { accepted: true; candidate: RestaurantCandidate; evidence: RestaurantReadEvidence; additionalEvidence: RestaurantReadEvidence[] }
  | { accepted: false; reasonCode: string };

export interface GoogleDiscoveryGeoDiagnostics {
  sourceCoordinates?: { latitude: number; longitude: number };
  /** Unrounded value used by the exact-radius admission gate. */
  distanceMeters?: number;
}

export interface GoogleDiscoveryGroundingInput {
  timezone: RestaurantSearchIntent["timezone"];
  requestFingerprint: string;
  observedAt: string;
  areaQuery: string;
  evaluationLocation?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    label: string;
    areaMatchBasis?: "TASK_LOCATION_RADIUS" | "EVALUATION_LOCATION_RADIUS" | "NAMED_PLACE_RADIUS";
  };
  selectionScope?: "SPECIFIC_OUTLET" | "OPEN_ENDED";
  targetQuery?: string;
  criteria?: RestaurantSearchIntent["criteria"];
  requiredTypeCriteria?: string[];
  negativeCriteria?: string[];
  requestedDate?: string;
  requestedTimeWindow?: { earliest: string; latest: string };
  requestedTimeWindowBasis?: string;
}

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

const DINING_PRIMARY_TYPES = new Set([
  "cafe", "coffee_shop", "bakery", "bar", "pub", "brewpub", "wine_bar", "cocktail_bar",
  "bar_and_grill", "gastropub", "bistro", "diner", "steak_house", "deli", "tea_house",
  "sandwich_shop", "cafeteria", "food_court", "dessert_shop", "ice_cream_shop", "bagel_shop",
  "donut_shop", "juice_shop", "acai_shop", "meal_takeaway", "meal_delivery", "pizza_delivery", "izakaya",
]);

const LIGHT_FOOD_TYPES:Record<string,RegExp>={
 sandwich_shop:/sandwich|サンド/iu,dessert_shop:/dessert|sweet|デザート|スイーツ/iu,dessert_restaurant:/dessert|sweet|デザート|スイーツ/iu,
 snack_bar:/snack|light meal|軽食/iu,ice_cream_shop:/ice.?cream|gelato|アイス/iu,bagel_shop:/bagel|ベーグル/iu,
 donut_shop:/donut|doughnut|ドーナツ/iu,juice_shop:/juice|ジュース/iu,acai_shop:/acai|açaí|アサイー/iu,
 meal_takeaway:/take.?away|take.?out|to go|持ち帰り|テイクアウト/iu,meal_delivery:/delivery|配達|デリバリー/iu,pizza_delivery:/delivery|配達|デリバリー/iu,
};
const LIGHT_FOOD_CATEGORY_LABELS: Record<string, readonly string[]> = {
  sandwich_shop: ["sandwich", "サンドイッチ"],
  dessert_shop: ["dessert", "sweets", "sweet", "デザート", "スイーツ"],
  dessert_restaurant: ["dessert", "sweets", "sweet", "デザート", "スイーツ"],
  snack_bar: ["snack", "snack bar", "light meal", "軽食"],
  ice_cream_shop: ["ice cream", "gelato", "アイス"],
  bagel_shop: ["bagel", "ベーグル"],
  donut_shop: ["donut", "doughnut", "ドーナツ"],
  juice_shop: ["juice", "ジュース"],
  acai_shop: ["acai", "アサイー"],
  meal_takeaway: ["meal takeaway", "takeaway", "takeout", "take away", "take out", "to go", "持ち帰り", "テイクアウト"],
  meal_delivery: ["meal delivery", "delivery", "配達", "デリバリー"],
  pizza_delivery: ["pizza delivery", "delivery", "配達", "デリバリー"],
  cafe: ["cafe","カフェ"], coffee_shop:["coffee","coffee shop","コーヒー"], bakery:["bakery","パン屋"], tea_house:["tea house","tea","茶館"],
};

function categoryLabel(value: string): string {
  return normalized(value.normalize("NFKD").replace(/\p{M}/gu, "").replace(/[_-]+/g, " "))
    .replace(/^(?:no|not|without|avoid)\s+/, "")
    .replace(/\s+(?:restaurants?|cuisines?|shops?|places?|stores?|dining type)$/, "")
    .replace(/\bsandwiches\b/g, "sandwich").replace(/\bbakeries\b/g, "bakery")
    .replace(/\b(\w{3,})s\b/g, "$1");
}

/** Match whole category labels, never a shared word in a quality/degree condition. */
function excludesCategory(criterion: string, type: string): boolean {
  const labels = [type, ...(LIGHT_FOOD_CATEGORY_LABELS[type] ?? [])].map(categoryLabel);
  return criterion.split("/").some(value => labels.includes(categoryLabel(value)));
}

function usableRestaurant(place:UntrustedGooglePlaceObservation,input:GoogleDiscoveryGroundingInput):boolean{
 const normalizeType=(type:string)=>type.trim().toLowerCase().replace(/[\s-]+/g,'_');
 const primary=place.primaryType===undefined?undefined:normalizeType(place.primaryType),types=[...new Set([...(primary?[primary]:[]),...(place.types??[]).map(normalizeType)])];
 const isDining=(type:string)=>type==='restaurant'||type.endsWith('_restaurant')||DINING_PRIMARY_TYPES.has(type);
 const negative = [...(input.negativeCriteria ?? []), ...(input.criteria ?? []).filter(c => c.polarity === 'NEGATIVE' && c.strength === 'HARD').map(c => c.text)];
 const target = (input.targetQuery ?? '').replace(/\b(?:no|not|without|avoid)\b[^,;.!?]*?(?=,|;|\bbut\b|\bspecifically\b|$)/giu, ' ');
 const positive=[target,...(input.requiredTypeCriteria??[]),...(input.criteria??[]).filter(c=>c.polarity==='POSITIVE').map(c=>c.text)].join(' ');
 const requested=(pattern:RegExp)=>pattern.test(positive);
 const specific=input.selectionScope==='SPECIFIC_OUTLET';
 const restricted=types.filter(t=>LIGHT_FOOD_TYPES[t]);
 if(types.some(type => LIGHT_FOOD_CATEGORY_LABELS[type] && negative.some(criterion => excludesCategory(criterion,type))))return false;
 if (restricted.some(type => negative.some(criterion => excludesCategory(criterion, type)))) return false;
 if(primary&&LIGHT_FOOD_TYPES[primary])return specific||requested(LIGHT_FOOD_TYPES[primary]!);
 const lightIntent=/caf[eé]|coffee|dessert|sweet|sandwich|baker|pastr|カフェ|喫茶|デザート|サンド|パン/iu;
 const evening=/(?:EVENING|DINNER)/i.test(input.requestedTimeWindowBasis??'')||!!input.requestedTimeWindow&&input.requestedTimeWindow.earliest>='17:00';
 const cafe=(primary==='cafe'||primary==='coffee_shop'||!primary&&types.some(t=>t==='cafe'||t==='coffee_shop'));
 if(cafe&&restricted.length&&evening&&!specific){
  if(!requested(lightIntent))return false;
 }
 if(primary!==undefined)return isDining(primary);
 const substantial=types.some(t=>isDining(t)&&!['restaurant','cafe','coffee_shop','bakery','tea_house'].includes(t)&&!LIGHT_FOOD_TYPES[t]);
 if(restricted.length&&!substantial&&!specific){
  if(!restricted.some(t=>requested(LIGHT_FOOD_TYPES[t]!))&&!(cafe&&requested(lightIntent)))return false;
 }
 return types.some(type=>type==='food'||isDining(type));
}

function normalized(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

function requestedAreaName(areaQuery: string): string | undefined {
  const match = areaQuery.trim().match(/^near\s+(.+)$/i);
  const value = (match?.[1] ?? areaQuery).trim();
  return value ? value : undefined;
}

/** Shares the exact distance calculation used for coordinate-backed admission diagnostics. */
export function googleDiscoveryGeoDiagnostics(
  observation: UntrustedGooglePlaceObservation,
  input: Pick<GoogleDiscoveryGroundingInput, "evaluationLocation">,
): GoogleDiscoveryGeoDiagnostics {
  const latitude = observation.location?.latitude;
  const longitude = observation.location?.longitude;
  const sourceCoordinates = typeof latitude === "number" && typeof longitude === "number"
    ? { latitude, longitude }
    : undefined;
  if (!input.evaluationLocation || !sourceCoordinates) return { ...(sourceCoordinates ? { sourceCoordinates } : {}) };
  return {
    sourceCoordinates,
    distanceMeters: 111_320 * Math.hypot(
      sourceCoordinates.latitude - input.evaluationLocation.latitude,
      (sourceCoordinates.longitude - input.evaluationLocation.longitude) * Math.cos(input.evaluationLocation.latitude * Math.PI / 180),
    ),
  };
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

/**
 * An observed Google type can establish an explicit conflict, but cannot prove
 * that a restaurant satisfies a negative cuisine/type constraint.  In
 * particular, "japanese_restaurant" does not prove "not hot pot", and a
 * missing term never proves a negative.  A positive exclusion judgment needs
 * an applicable, identity-bound source fact instead.
 */
function negativeTypeConflicts(
  types: string[] | undefined,
  primaryType: string | undefined,
  criteria: string[] | undefined,
): { verified: string[]; violated: string[]; judgments: string[] } {
  const normalizedPrimary = primaryType ? normalized(primaryType.replace(/_/g, " ")) : undefined;
  const sourceTypes = [...new Set([...(types ?? []), ...(primaryType ? [primaryType] : [])]
    .map((value) => normalized(value.replace(/_/g, " ")))
    .filter((value) => value && !["restaurant", "cafe", "food"].includes(value)))];
  const result = { verified: [] as string[], violated: [] as string[], judgments: [] as string[] };
  for (const criterion of criteria ?? []) {
    const matchingType = sourceTypes.find(type =>
      (/\b(?:restaurants?|cuisines?|dining type)\b/i.test(criterion) || LIGHT_FOOD_TYPES[type.replace(/ /g, "_")])
        && excludesCategory(criterion, type.replace(/ /g, "_")));
    if (matchingType) {
      result.violated.push(criterion);
      result.judgments.push(`${criterion}<=${matchingType === normalizedPrimary ? "primaryType" : "types"}:${matchingType}`);
    }
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
export function openingHoursForRequest(
  descriptions: string[] | undefined,
  date: string | undefined,
  timeWindow: { earliest: string; latest: string } | undefined,
  timezone: string,
  timeWindowBasis?: string,
): { matches: boolean; window?: string[]; noWindow?: boolean } | undefined {
  if (!descriptions || !date || !timeWindow) return undefined;
  const day = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone })
    .format(new Date(`${date}T12:00:00+09:00`));
  const entry = descriptions.find((item) => normalized(item).startsWith(`${normalized(day)}:`));
  if (!entry) return undefined;
  if (/open\s*24\s*hours/i.test(entry)) return { matches: true, window: [timeWindow.earliest, timeWindow.latest] };
  const previousDay = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: timezone }).format(new Date(new Date(`${date}T12:00:00+09:00`).valueOf() - 86_400_000));
  const previous = descriptions.find(item => normalized(item).startsWith(`${normalized(previousDay)}:`)) ?? "";
  const priorOverlap = [...previous.matchAll(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/gi)].some(match => {
    const start = minutes(match[1]!), end = minutes(match[2]!), requested = minutes(timeWindow.earliest);
    return start !== undefined && end !== undefined && requested !== undefined && end < start && end > requested;
  });
  if (/^(?:closed(?: today| all day)?|not open)\.?$/i.test(entry.slice(entry.indexOf(":") + 1).trim())) return { matches: false, noWindow: !priorOverlap };
  const requestedStart = minutes(timeWindow.earliest);
  const requestedEnd = minutes(timeWindow.latest);
  if (requestedStart === undefined || requestedEnd === undefined || requestedEnd < requestedStart) return undefined;
  const intervals = [...entry.matchAll(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/gi)]
    .flatMap((match) => {
      const start = minutes(match[1]!); const end = minutes(match[2]!);
      if (start === undefined || end === undefined || end === start) return [];
      // A weekly interval may cross midnight.  The current request window is
      // same-day, so retain the late-day part and never invent next-day hours.
      return [[start, end > start ? end : end + 24 * 60] as const];
    });
  // Closing time is exclusive: a 21:00 close does not support a 21:00 visit.
  // One explicit interval must cover the requested window; adjacent split
  // periods cannot be fused into an invented continuous opening.
  if (!intervals.length) return undefined;
  const daypart = /^(?:DAYPART:EVENING|DAYPART:AFTERNOON|DAYPART:AFTER_WORK(?:_BROAD_WINDOW)?)$/.test(timeWindowBasis ?? "");
  const matching = intervals.find(([start, end]) => daypart
    ? Math.max(start, requestedStart) < Math.min(end, requestedEnd)
    : start <= requestedStart && end > requestedEnd);
  return matching ? { matches: true, window: daypart
    ? [hhmm(Math.max(matching[0], requestedStart)), hhmm(Math.min(matching[1], requestedEnd))]
    : [hhmm(requestedStart), hhmm(requestedEnd)], noWindow: false }
    : { matches: false, noWindow: !priorOverlap && !intervals.some(([start, end]) => start <= requestedEnd && end > requestedStart) };
}

export interface UntrustedRestaurantWebsiteObservation {
  candidateId: string;
  sourceUrl: string;
  observedAt: string;
  entityMatch: { confidence: "HIGH" | "MEDIUM" | "LOW"; matchedBy: string[] };
  restaurantTypeFacts?: string[];
  /** Reader-owned public field/region roles, never model-authored provenance. */
  sourceFieldQuotes?: import("./contracts.js").RestaurantSourceFieldQuote[];
  regularOpeningHours?: string[];
  /**
   * Explicitly labelled public commercial terms.  These are deliberately
   * separate fields: a course price is not a private-room minimum, and a
   * cancellation rule is not a no-show rule.
   */
  publicCommercialTerms?: {
    listedCourseDetails?: string[];
    coursePriceYen?: number;
    coursePriceTax?: "INCLUDED" | "EXCLUDED" | "UNSPECIFIED";
    privateRoomMinimumYen?: number;
    cancellationTerms?: string;
    noShowTerms?: string;
  };
}

/**
 * Grounds structured website data only after a deterministic, candidate-bound
 * identity check.  A Google-listed URL is merely a pointer; it is not an
 * official-source assertion and visible prose is never promoted by a model.
 */
export function groundRestaurantWebsiteFacts(
  candidate: RestaurantCandidate,
  intent: Pick<RestaurantSearchIntent, "timezone" | "area" | "criteria" | "date" | "timeWindow" | "timeWindowBasis">,
  observation: UntrustedRestaurantWebsiteObservation,
): { evidence: RestaurantReadEvidence[]; status: "COMPLETED" | "UNKNOWN"; reasonCode?: string } {
  if (observation.candidateId !== candidate.restaurant.id || observation.entityMatch.confidence !== "HIGH") {
    return { evidence: [], status: "UNKNOWN", reasonCode: "WEBSITE_ENTITY_MATCH_UNCERTAIN" };
  }
  const sourceEntityId = `website:${fingerprint(observation.sourceUrl).slice(0, 24)}`;
  const entityEvidence: RestaurantReadEvidence = {
    evidenceId: evidenceId("website-entity", { candidateId: candidate.restaurant.id, sourceUrl: observation.sourceUrl, observedAt: observation.observedAt }),
    kind: "ENTITY_MATCH", provider: "RESTAURANT_WEBSITE", candidateId: candidate.restaurant.id, sourceEntityId, sourceUrl: observation.sourceUrl,
    observedAt: observation.observedAt, requestFingerprint: fingerprint({ candidateId: candidate.restaurant.id, sourceUrl: observation.sourceUrl }),
    claims: { observationKind: "PUBLIC_PAGE", outletName: candidate.restaurant.outletName, sourceAssociation: "GOOGLE_LISTED_WEBSITE_URI", officialWebsiteVerified: false },
    entityMatch: { confidence: "HIGH", matchedBy: [...observation.entityMatch.matchedBy] },
  };
  const types = [...new Set((observation.restaurantTypeFacts ?? []).map(normalized).filter(Boolean))];
  const positive = supportedTypeCriteria(types, intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text));
  const negative = negativeTypeConflicts(types, undefined, intent.criteria.filter((item) => item.polarity === "NEGATIVE" && item.strength === "HARD").map((item) => item.text));
  const openingHours = intent.date && intent.timeWindow
    ? openingHoursForRequest(observation.regularOpeningHours, intent.date, intent.timeWindow, intent.timezone, intent.timeWindowBasis)
    : undefined;
  const commercialTerms = observation.publicCommercialTerms;
  const facts: RestaurantReadEvidence[] = types.length || openingHours !== undefined || commercialTerms !== undefined ? [{
    evidenceId: evidenceId("website-facts", { candidateId: candidate.restaurant.id, sourceUrl: observation.sourceUrl, observedAt: observation.observedAt, types, openingHours, commercialTerms }),
    kind: "RESTAURANT_FACT", provider: "RESTAURANT_WEBSITE", candidateId: candidate.restaurant.id, sourceEntityId, sourceUrl: observation.sourceUrl,
    observedAt: observation.observedAt, requestFingerprint: fingerprint({ candidateId: candidate.restaurant.id, sourceUrl: observation.sourceUrl, intent }),
    ...(observation.sourceFieldQuotes?.length ? { sourceFieldQuotes: observation.sourceFieldQuotes.map(q => ({ ...q })) } : {}),
    claims: {
      observationKind: "PUBLIC_PAGE",
      restaurantTypeFacts: types,
      ...(positive.length ? { verifiedHardCriteria: positive } : {}),
      ...(negative.violated.length ? { violatedNegativeCriteria: negative.violated } : {}),
      ...(negative.judgments.length ? { negativeCriterionJudgments: negative.judgments } : {}),
      ...(observation.regularOpeningHours ? { regularOpeningHours: [...observation.regularOpeningHours] } : {}),
      ...(openingHours ? { openingHoursMatch: openingHours.matches, openingHoursNoWindow: openingHours.noWindow === true, openingHoursDate: intent.date!, openingHoursRequestedWindow: [intent.timeWindow!.earliest, intent.timeWindow!.latest], ...(openingHours.window ? { openingHoursMatchedWindow: openingHours.window } : {}) } : {}),
      ...(commercialTerms?.listedCourseDetails?.length ? { listedCourseDetails: commercialTerms.listedCourseDetails.filter(note => note.length <= 1600).slice(0, 3) } : {}),
      ...(commercialTerms?.coursePriceYen !== undefined ? { coursePriceYen: commercialTerms.coursePriceYen } : {}),
      ...(commercialTerms?.coursePriceTax ? { coursePriceTax: commercialTerms.coursePriceTax } : {}),
      ...(commercialTerms?.privateRoomMinimumYen !== undefined ? { privateRoomMinimumYen: commercialTerms.privateRoomMinimumYen } : {}),
      ...(commercialTerms?.cancellationTerms ? { cancellationTerms: commercialTerms.cancellationTerms } : {}),
      ...(commercialTerms?.noShowTerms ? { noShowTerms: commercialTerms.noShowTerms } : {}),
    }, entityMatch: { confidence: "HIGH", matchedBy: [...observation.entityMatch.matchedBy] },
  }] : [];
  return { evidence: [entityEvidence, ...facts], status: "COMPLETED" };
}

/**
 * Converts the minimal Google response into a candidate only when the returned
 * structural facts support it. Retrieval relevance never becomes a cuisine claim.
 */
export function groundGoogleDiscovery(
  observation: UntrustedGooglePlaceObservation,
  input: GoogleDiscoveryGroundingInput,
): GroundedGoogleDiscovery {
  if (!observation.placeId?.trim()) return { accepted: false, reasonCode: "GOOGLE_PLACE_ID_MISSING" };
  if (!observation.displayName?.trim()) return { accepted: false, reasonCode: "GOOGLE_NAME_MISSING" };
  if (!observation.formattedAddress?.trim()) return { accepted: false, reasonCode: "GOOGLE_ADDRESS_MISSING" };
  if (!usableRestaurant(observation,input)) return { accepted: false, reasonCode: "GOOGLE_PLACE_TYPE_UNUSABLE" };
  const areaComponent = matchingAddressComponent(observation, input.areaQuery);
  const geo = googleDiscoveryGeoDiagnostics(observation, input);
  const rawDistanceMeters = geo.distanceMeters;
  const locationMatch = rawDistanceMeters !== undefined && input.evaluationLocation !== undefined && rawDistanceMeters <= input.evaluationLocation.radiusMeters;
  const distanceMeters = rawDistanceMeters === undefined ? undefined : Math.round(rawDistanceMeters);
  const areaMatch = areaComponent !== undefined || locationMatch;
  // A coordinate-backed nearby request is an explicit hard geographic bound.
  // Address text may remain useful evidence, but cannot bypass a missing or
  // out-of-radius source coordinate.
  if (input.evaluationLocation && !geo.sourceCoordinates) {
    return { accepted: false, reasonCode: "GOOGLE_LOCATION_REQUIRED_FOR_RADIUS" };
  }
  if (input.evaluationLocation && !locationMatch) {
    return { accepted: false, reasonCode: "GOOGLE_OUTSIDE_REQUESTED_RADIUS" };
  }
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
  const negativeTypes = negativeTypeConflicts(observation.types, observation.primaryType, input.negativeCriteria);
  const openingHours = openingHoursForRequest(observation.regularOpeningHours, input.requestedDate, input.requestedTimeWindow, input.timezone, input.requestedTimeWindowBasis);
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
      ...(observation.websiteUri ? { websiteUri: observation.websiteUri } : {}),
      ...(openingHours ? { openingHoursMatch: openingHours.matches, ...(openingHours.window ? { openingHoursMatchedWindow: openingHours.window } : {}) } : {}),
    },
  }] : [];
  return {
    accepted: true,
    candidate: {
      restaurant: {
        id: candidateId,
        outletName: observation.displayName.trim(),
        sourceIds: {
          googlePlaces: observation.placeId,
          ...(observation.nationalPhoneNumber ? { phone: observation.nationalPhoneNumber } : {}),
          // This is an unverified discovery pointer.  It cannot by itself make
          // the URL an official source or ground a RestaurantFact.
          ...(observation.websiteUri ? { googleWebsiteUri: observation.websiteUri } : {}),
          // A Google-listed public URL remains merely a discovery pointer.
          // Provider adapters may accept it only after their own origin and
          // outlet-identity checks.
          ...(observation.googleMapsUri ? { googleMapsUri: observation.googleMapsUri } : {}),
        },
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

function receptionModeFor(observation: UntrustedProviderAvailabilityObservation): RestaurantReceptionMode {
  if (
    (observation.receptionMode === "WALK_IN_SUPPORTED" || observation.receptionMode === "RESERVATION_AND_WALK_IN_SUPPORTED") &&
    !observation.walkInEvidence?.trim()
  ) return "UNKNOWN";
  if (observation.receptionMode) return observation.receptionMode;
  return observation.pageState === "AVAILABLE" || observation.pageState === "NO_MATCHING_SLOT"
    ? "RESERVATION_SUPPORTED"
    : "UNKNOWN";
}

function checkForFailure(
  observation: UntrustedProviderAvailabilityObservation,
): RestaurantAvailabilityCheck {
  const checkedAt = observation.observedAt;
  // A browser session failure occurs before provider identity evidence exists.
  // Do not mislabel that infrastructure failure as an outlet mismatch.
  if (observation.pageState === "EXTRACTION_FAILED" && (
    observation.failureCode === "BROWSER_RUNTIME_FAILED" || observation.failureCode === "BROWSER_TIMEOUT"
      || observation.failureCode === "BROWSER_BUDGET_EXHAUSTED"
  )) {
    return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: observation.failureCode };
  }
  if (observation.pageState === "EXTRACTION_FAILED" && observation.failureCode === "SOURCE_BUSY") {
    return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "SOURCE_BUSY" };
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
    case "NO_MATCHING_SLOT": return observation.serviceScope
      ? { status: "UNKNOWN", receptionMode: receptionModeFor(observation), checkedAt, evidenceIds: [], reasonCode: "NO_MATCHING_SLOT_SCOPED", serviceScope: observation.serviceScope }
      : { status: "UNAVAILABLE", receptionMode: receptionModeFor(observation), checkedAt, evidenceIds: [], reasonCode: "NO_MATCHING_SLOT" };
    case "UNEXPECTED_PAGE": return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: "UNEXPECTED_PAGE" };
    case "EXTRACTION_FAILED": return { status: "UNKNOWN", checkedAt, evidenceIds: [], reasonCode: observation.failureCode ?? "EXTRACTION_FAILED" };
    case "AVAILABLE": return { status: "AVAILABLE", receptionMode: receptionModeFor(observation), checkedAt, evidenceIds: [] };
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
  // Identity and explicitly observed restaurant facts are independent from
  // whether a page yielded a usable slot. Preserve them for audit and for a
  // later fact recommendation; an UNKNOWN slot never turns into availability.
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
  const listedCourseDetails = (observation.listedCourseDetails ?? []).filter(note => note.trim() && note.length <= 1600).slice(0, 3);
  const sourceFieldQuotes = (observation.sourceFieldQuotes ?? []).filter(q => q.sourceUrl === observation.sourceUrl && q.quote.trim() && q.quote.length <= 1600);
  const factEvidence: RestaurantReadEvidence | undefined = observation.verifiedHardCriteria?.length || listedCourseDetails.length || observation.priceFacts || sourceFieldQuotes.length ? {
    evidenceId: evidenceId(`${provider.toLocaleLowerCase("en-US")}-hard-criteria`, { candidateId: candidate.restaurant.id, observedAt: observation.observedAt, criteria: observation.verifiedHardCriteria, listedCourseDetails, priceFacts: observation.priceFacts, sourceFieldQuotes }),
    kind: "RESTAURANT_FACT",
    provider,
    candidateId: candidate.restaurant.id,
    ...(observation.sourceEntityId ? { sourceEntityId: observation.sourceEntityId } : {}),
    ...(observation.sourceUrl ? { sourceUrl: observation.sourceUrl } : {}),
    observedAt: observation.observedAt,
    requestFingerprint: fingerprint({ candidateId: candidate.restaurant.id, criteria: observation.verifiedHardCriteria, listedCourseDetails, priceFacts: observation.priceFacts, sourceFieldQuotes }),
    claims: {
      verifiedHardCriteria: [...observation.verifiedHardCriteria ?? []],
      ...(listedCourseDetails.length ? { listedCourseDetails } : {}),
      ...(observation.serviceScope ? { serviceScopeField: observation.serviceScope.field, serviceScopeGroup: observation.serviceScope.group, serviceScopeValue: observation.serviceScope.value, serviceScopeLabel: observation.serviceScope.label } : {}),
    },
    ...(observation.priceFacts ? { priceFacts: structuredClone(observation.priceFacts) } : {}),
    ...(sourceFieldQuotes.length ? { sourceFieldQuotes: structuredClone(sourceFieldQuotes) } : {}),
    entityMatch: { confidence: "HIGH", matchedBy: [...observation.entityMatch.matchedBy] },
  } : undefined;
  const independentEvidence = [entityEvidence, ...(factEvidence ? [factEvidence] : [])];
  const candidateFactUpdate = factEvidence ? {
    candidateId: candidate.restaurant.id,
    matchReasons: (observation.verifiedHardCriteria ?? []).map((criterion) => `Verified HARD criterion from source: ${criterion}`),
    evidenceIds: [factEvidence.evidenceId],
  } : undefined;
  const withIndependentEvidence = (nextCheck: RestaurantAvailabilityCheck): GroundedAvailability => ({
    offers: [],
    check: { ...nextCheck, evidenceIds: independentEvidence.map((item) => item.evidenceId) },
    evidence: independentEvidence,
    ...(candidateFactUpdate ? { candidateFactUpdate } : {}),
  });
  if (observation.pageState !== "AVAILABLE" && observation.pageState !== "NO_MATCHING_SLOT") {
    return withIndependentEvidence(check);
  }
  if (observation.requestedDate !== request.date || observation.requestedPartySize !== request.partySize) {
    return withIndependentEvidence({ status: "UNKNOWN", checkedAt: observation.observedAt, evidenceIds: [], reasonCode: "REQUEST_MISMATCH" });
  }
  const freshness = Number.isNaN(Date.parse(observation.observedAt))
    ? undefined
    : availabilityFreshnessWindow(observation.observedAt, observation.sourceExpiresAt);
  if (!freshness || !isDisplayFresh(freshness.displayExpiresAt, now)) {
    return withIndependentEvidence({ status: "UNKNOWN", checkedAt: observation.observedAt, evidenceIds: [], reasonCode: "STALE_OBSERVATION" });
  }
  const withinWindow = (observation.visibleSlots ?? []).filter((slot) =>
    /^\d{2}:\d{2}$/.test(slot) && slot >= request.timeWindow.earliest && slot <= request.timeWindow.latest,
  );
  const originalWindow = request.requestedTimeWindow ?? request.timeWindow;
  if (observation.pageState === "AVAILABLE" && withinWindow.length === 0) {
    return withIndependentEvidence({ status: "UNKNOWN", checkedAt: observation.observedAt, evidenceIds: [], reasonCode: "EXTRACTION_FAILED" });
  }
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
    claims: {
      date: request.date,
      partySize: request.partySize,
      visibleSlots: withinWindow,
      ...(request.requestedTimeWindow ? { requestedTimeWindow: `${originalWindow.earliest}-${originalWindow.latest}` } : {}),
      inventoryStatus: check.status,
      receptionMode: receptionModeFor(observation),
      ...(observation.walkInEvidence?.trim() ? { walkInEvidence: observation.walkInEvidence.trim() } : {}),
      ...(observation.serviceScope ? { serviceScopeField: observation.serviceScope.field, serviceScopeGroup: observation.serviceScope.group, serviceScopeValue: observation.serviceScope.value, serviceScopeLabel: observation.serviceScope.label } : {}),
    },
    entityMatch: { confidence: "HIGH", matchedBy: [...observation.entityMatch.matchedBy] },
    ...(observation.excerpt ? { artifactRef: { kind: "DOM_EXCERPT", reference: `sha256:${fingerprint(observation.excerpt)}` } } : {}),
  };
  const evidence = [...independentEvidence, availabilityEvidence];
  check = {
    ...check,
    evidenceIds: evidence.map((item) => item.evidenceId),
    displayExpiresAt: freshness.displayExpiresAt,
    freshnessPolicyVersion: freshness.policyVersion,
    ...(freshness.sourceExpiresAt ? { expiresAt: freshness.sourceExpiresAt } : {}),
    ...(observation.serviceScope ? { serviceScope: observation.serviceScope } : {}),
  };
  if (check.status !== "AVAILABLE") return { offers: [], check, evidence, ...(candidateFactUpdate ? { candidateFactUpdate } : {}) };
  // A read-only observation without a provider deadline is displayable, but it
  // cannot be reused as a booking-ready offer without the later mandated recheck.
  const expiresAt = freshness.sourceExpiresAt ?? observation.observedAt;
  return {
    offers: withinWindow.map((slot) => ({
      id: `offer:${provider.toLocaleLowerCase("en-US")}:${candidate.restaurant.id}:${request.date}:${slot}:${request.partySize}${observation.serviceScope ? `:${fingerprint(observation.serviceScope).slice(0, 12)}` : ""}`,
      restaurantId: candidate.restaurant.id,
      source: provider,
      dateTime: `${request.date}T${slot}:00+09:00`,
      timezone: "Asia/Tokyo",
      partySize: request.partySize,
      ...(observation.serviceScope ? { serviceScope: observation.serviceScope } : {}),
      ...(request.requestedTimeWindow && (slot < originalWindow.earliest || slot > originalWindow.latest) ? { alternativeToRequestedTime: true } : {}),
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
  observation: UntrustedProviderAvailabilityObservation,
  now: string,
): GroundedAvailability {
  return groundProviderAvailability("TABELOG", candidate, request, observation, now);
}

export function groundTableCheckAvailability(
  candidate: RestaurantCandidate,
  request: RestaurantAvailabilityRequest,
  observation: UntrustedProviderAvailabilityObservation,
  now: string,
): GroundedAvailability {
  return groundProviderAvailability("TABLECHECK", candidate, request, observation, now);
}
