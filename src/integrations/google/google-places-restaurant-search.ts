import {restaurantReserveCancelled} from "../../domains/restaurant/read-time-reserve.js";
import {generalDiscoveryCategory} from "../../domains/restaurant/discovery-planner.js";
import { restaurantFailureCode, type RestaurantFailureCode } from "../../domains/restaurant/failure-codes.js";
import { DEFAULT_NEARBY_RADIUS_METERS } from "../../core/location/nearby.js";
import { createHash } from "node:crypto";

import type { RestaurantCandidateFactPort, RestaurantSearchPort } from "../../application/restaurant-execution-router.js";
import { googleDiscoveryGeoDiagnostics, groundGoogleDiscovery, type GoogleDiscoveryGroundingInput, type UntrustedGooglePlaceObservation } from "../../domains/restaurant/read-grounding.js";
import { restaurantSearchIntentFingerprint, type RestaurantCandidate, type RestaurantReadEvidence, type RestaurantCandidateFactRequest, type RestaurantSearchContinuation, type RestaurantSearchRead, type RestaurantSearchRequest } from "../../domains/restaurant/contracts.js";
import { GooglePlacesClient } from "./google-places-client.js";
import { GooglePlacesError, type GooglePlacesRawPlace, type GooglePlacesSourceName,type GooglePlacesTextSearchPage } from "./google-places-contracts.js";
import {outletNameKey,type NamedOutletReference} from "../../domains/restaurant/named-outlet-resolution.js";

function string(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** Similarity only retains clarification choices; it never qualifies a name. */
function possibleNamedOutlet(query:string,name:string):boolean {
  const key=outletNameKey(query),other=outletNameKey(name);
  if(key===other||key.includes(other)||other.includes(key))return true;
  const grams=(text:string)=>new Set(Array.from({length:Math.max(0,text.length-1)},(_,i)=>text.slice(i,i+2)));
  const a=grams(key),b=grams(other);return 2*[...a].filter(g=>b.has(g)).length/Math.max(1,a.size+b.size)>=0.5;
}

function addressLocalities(observation:UntrustedGooglePlaceObservation):string[]{
  return (observation.addressComponents??[]).filter(c=>c.types.some(t=>t==="locality"||t.startsWith("sublocality")||t.startsWith("administrative_area_level_")))
    .flatMap(c=>[c.longText,...(c.shortText?[c.shortText]:[])]);
}

function inTokyo(observation:UntrustedGooglePlaceObservation):boolean {
  const prefectures=observation.addressComponents?.filter(c=>c.types.includes("administrative_area_level_1"));
  return prefectures?.length?prefectures.some(c=>/^(?:tokyo(?:to)?|東京都)$/iu.test(c.longText.normalize("NFKC")))
    :/東京都|(?:^|[\s,])Tokyo(?:[\s,]|$)/iu.test(observation.formattedAddress??"");
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
  if (request.discoveryQuery?.keyword) {
    // The Agent retrieval proposal has been validated against a positive criterion.
    // Do not reintroduce the full task sentence (date, party, exclusions) as
    // a Places text query.
    return `${request.discoveryQuery.keyword} ${request.discoveryQuery.location.label}`.trim();
  }
  if(request.discoveryQuery)return `${request.discoveryQuery.category} ${request.discoveryQuery.location.label}`.trim();
  const area=request.intent.area?.query.trim().toLowerCase()==='nearby'?'':request.intent.area?.query??'';
  if(request.discoveryRetrieval)return `${request.discoveryRetrieval.keyword??generalDiscoveryCategory(request.intent)} ${area}`.trim();
  return [request.intent.target?.query,'restaurant',area,request.retrievalHint?.trim()].filter(Boolean).join(' ');
}

export const NAMED_PLACE_NEARBY_RADIUS_METERS = DEFAULT_NEARBY_RADIUS_METERS;
/** A soft search bias is not authority. 100 km distinguishes another regional
 * place from a local nearby request without encoding any city/country boundary. */
export const MAX_NAMED_LOCATION_CONTEXT_DISTANCE_METERS = 100_000;

function geographicLocation(place: GooglePlacesRawPlace): boolean {
  const types = Array.isArray(place.types) ? place.types : [];
  return types.some(type => typeof type === "string" && (type.startsWith("sublocality") || type.startsWith("administrative_area")
    || ["colloquial_area", "neighborhood", "locality", "country", "subway_station", "transit_station", "train_station", "bus_station", "airport", "park"].includes(type)));
}
type GoogleRequestKind = "namedPlaceResolution" | "discovery" | "placeDetails" | "reverseAddressObservation";
type GoogleRequestUsage = {
  limit: number;
  total: number;
  namedPlaceResolution: number;
  discovery: number;
  placeDetails: number;
  reverseAddressObservation: number;
};

function namedNearbyQuery(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLocaleLowerCase("en-US") === "nearby") return undefined;
  // AREA names a place independently of whether its relation word survived
  // semantic interpretation. Strip existing relation wording when present;
  // only the unanchored "nearby" request needs a separate coordinate context.
  return trimmed
    .replace(/(?:\bnear\b|nearby|附近|周辺|周边)/giu, " ")
    .replace(/^[\s,，]+|[\s,，]+$/gu, "")
    .trim() || undefined;
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

/**
 * A bounded public projection for a failed named-place resolution.  It lets a
 * source-stage artifact explain the geographic rank/type/distance decision for the
 * response without retaining provider headers, raw result bodies, phones, or
 * website links.  It is diagnostic evidence only and never selects a place.
 */
export type PublicNamedLocationObservation = {
  placeId?: string;
  displayName?: string;
  types: string[];
  addressComponents: Array<{ longText: string; shortText?: string; types: string[] }>;
  coordinates?: { latitude: number; longitude: number };
};

function publicNamedLocationObservations(places: readonly GooglePlacesRawPlace[]): PublicNamedLocationObservation[] {
  return places.slice(0, 20).map((place) => {
    const point = coordinates(place);
    const components = addressComponents(place) ?? [];
    const types = Array.isArray(place.types) ? place.types.filter((value): value is string => typeof value === "string").slice(0, 20) : [];
    const placeId = string(place.id);
    const displayName = string(place.displayName?.text);
    return {
      ...(placeId ? { placeId } : {}),
      ...(displayName ? { displayName } : {}),
      types,
      addressComponents: components.slice(0, 20).map((component) => ({
        longText: component.longText,
        ...(component.shortText ? { shortText: component.shortText } : {}),
        types: component.types.slice(0, 12),
      })),
      ...(point?.latitude !== undefined && point.longitude !== undefined ? { coordinates: { latitude: point.latitude, longitude: point.longitude } } : {}),
    };
  });
}

function namedLocationResolutionError(
  code: "GOOGLE_LOCATION_UNRESOLVED" | "GOOGLE_LOCATION_AMBIGUOUS",
  message: string,
  places: readonly GooglePlacesRawPlace[],
): GooglePlacesError & { publicLocationObservations: PublicNamedLocationObservation[] } {
  return Object.assign(new GooglePlacesError(code, message), { publicLocationObservations: publicNamedLocationObservations(places) });
}

/** Google Text Search restricts by rectangle; grounding retains the exact circular radius gate. */
function geographicRectangle(location: { latitude: number; longitude: number; radiusMeters: number }) {
  const latitudeDelta = location.radiusMeters / 111_320;
  const longitudeDelta = location.radiusMeters / Math.max(1, 111_320 * Math.cos(location.latitude * Math.PI / 180));
  return {
    low: { latitude: location.latitude - latitudeDelta, longitude: location.longitude - longitudeDelta },
    high: { latitude: location.latitude + latitudeDelta, longitude: location.longitude + longitudeDelta },
  };
}

export class GooglePlacesRestaurantSearch implements RestaurantSearchPort, RestaurantCandidateFactPort {
  readonly executionRoute = "STRUCTURED_ADAPTER" as const;
  /** One local workspace composes providers once, so counters must be keyed by
   * the persistent task run rather than accidentally shared by every user. */
  private readonly requestsPerformed = new Map<string, Omit<GoogleRequestUsage, "limit" | "total">>();
  private readonly japaneseNames = new Map<string, Map<string, Promise<GooglePlacesSourceName>>>();

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
      reverseAddressObservation: 0,
    };
  }

  private consumeRequest(runId: string | undefined, kind: GoogleRequestKind): void {
    const key = runId ?? "unscoped";
    const counts = this.requestCounts(key);
    this.requestsPerformed.set(key, { ...counts, [kind]: counts[kind] + 1 });
  }

  private hasBudget(runId: string | undefined): boolean {
    const counts = this.requestCounts(runId);
    return counts.namedPlaceResolution + counts.discovery + counts.placeDetails + counts.reverseAddressObservation < (this.options.maxRequests ?? Number.POSITIVE_INFINITY);
  }

  /** Read-only accounting for the Router trajectory and exported run artifact. */
  googleRequestUsage(readRunId: string | undefined): GoogleRequestUsage {
    const counts = this.requestCounts(readRunId);
    return {
      limit: this.options.maxRequests ?? Number.POSITIVE_INFINITY,
      total: counts.namedPlaceResolution + counts.discovery + counts.placeDetails + counts.reverseAddressObservation,
      ...counts,
    };
  }

  /** Source-owned name only, never identity proof. Both source consumers share
   * this adapter/run cache and the existing Details request ceiling. */
  japaneseName(placeId: string, readRunId: string | undefined, signal: AbortSignal): Promise<GooglePlacesSourceName> {
    if (signal.aborted) return Promise.reject(signal.reason);
    const id = placeId.replace(/^places\//, "").trim(), key = readRunId ?? "unscoped";
    if (!id) return Promise.reject(new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google source name requires a place ID"));
    const names = this.japaneseNames.get(key) ?? new Map<string, Promise<GooglePlacesSourceName>>();
    this.japaneseNames.set(key, names);
    let read = names.get(id);
    if (!read) {
      read = (async () => {
        if (!this.hasBudget(readRunId)) throw new GooglePlacesError("GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", "Google request ceiling before Japanese source name");
        this.consumeRequest(readRunId, "placeDetails");
        return this.client.japaneseNamesForRun(signal)(id);
      })();
      names.set(id, read);
    }
    return read;
  }

  /** Reuse source results already read by this run; this does not issue a request. */
  async observedSourceNames(candidates:readonly RestaurantCandidate[],readRunId:string|undefined):Promise<RestaurantReadEvidence[]>{
    const names=this.japaneseNames.get(readRunId??"unscoped"),evidence:RestaurantReadEvidence[]=[];
    for(const candidate of candidates){
      const id=candidate.restaurant.sourceIds.googlePlaces,read=id?names?.get(id):undefined;
      const name=await read?.catch(()=>undefined);
      if(!id||!name||name.placeId!==id||!name.text.trim())continue;
      evidence.push({evidenceId:`evidence:restaurant:google-source-name:${createHash("sha256").update(JSON.stringify([readRunId,id,name])).digest("hex").slice(0,24)}`,
        candidateId:candidate.restaurant.id,kind:"ENTITY_MATCH",provider:"GOOGLE_PLACES",sourceEntityId:id,
        sourceUrl:`https://places.googleapis.com/v1/places/${id}?languageCode=ja`,observedAt:this.now(),
        requestFingerprint:JSON.stringify({placeId:id,languageCode:"ja"}),
        claims:{placeId:id,outletName:name.text,sourceNameLanguage:name.languageCode??"UNSPECIFIED"},entityMatch:{confidence:"HIGH",matchedBy:["GOOGLE_PLACE_ID"]}});
    }
    return evidence;
  }

  private async namedJapaneseAliases(query:string,places:readonly GooglePlacesRawPlace[],readRunId:string|undefined,signal:AbortSignal):Promise<Map<string,string>>{
    const names=new Map<string,string>();
    if(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(query))for(const place of places.slice(0,this.maxResults)){
      const id=string(place.id);
      if(!id||!inTokyo(rawObservation(place))||possibleNamedOutlet(query,string(place.displayName?.text)??""))continue;
      const name=await this.japaneseName(id,readRunId,signal);names.set(id,name.text);
    }
    return names;
  }

  private readonly addressObservations = new Map<string, { point: string; read: Promise<{ addressComponents?: Array<{ longText: string; shortText?: string; types: string[] }>; addressObservation: import("../../domains/restaurant/contracts.js").LocationAddressObservation }> }>();

  async observeCoordinateAddress(location: { latitude: number; longitude: number }, readRunId: string | undefined, signal: AbortSignal) {
    const key = readRunId ?? "unscoped", point = JSON.stringify([location.latitude, location.longitude]);
    const prior = this.addressObservations.get(key);
    const unavailable = (reasonCode: string) => ({ addressObservation: { source: "GOOGLE_GEOCODING", observedAt: this.now(), status: "UNAVAILABLE" as const, reasonCode } });
    if (prior) return prior.point === point ? prior.read : unavailable("ADDRESS_OBSERVATION_CONTEXT_CHANGED");
    const read = (async () => {
      try {
        if (!this.hasBudget(readRunId)) return unavailable("GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED");
        this.consumeRequest(readRunId, "reverseAddressObservation");
        const raw = await this.client.reverseAddress(location, signal);
        const components = addressComponents(raw);
        return components ? { addressComponents: components, addressObservation: { source: "GOOGLE_GEOCODING", observedAt: this.now(), status: "OBSERVED" as const } } : unavailable("GOOGLE_ADDRESS_UNOBSERVED");
      } catch (error) {
        if (signal.aborted) throw error;
        return unavailable(error instanceof GooglePlacesError ? error.code : "GOOGLE_NETWORK_FAILED");
      }
    })();
    this.addressObservations.set(key, { point, read });
    return read;
  }

  /**
   * A named nearby place is resolved once through the same bounded Google
   * capability as discovery.  Its coordinates are an observed source fact,
   * not an address-string alias or a hidden test coordinate.
   */
  async resolveNamedNearbyLocation(
    request: RestaurantSearchRequest,
    signal: AbortSignal,
  ): Promise<{ location?: { latitude: number; longitude: number; radiusMeters: number; label: string; areaMatchBasis: "NAMED_PLACE_RADIUS"; addressComponents?: Array<{ longText: string; shortText?: string; types: string[] }> }; evidence?: import("../../domains/restaurant/contracts.js").RestaurantReadEvidence; publicLocationObservation?: PublicNamedLocationObservation }> {
    if(!request.intent.area)return {};
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
    const pointContext = request.intent.area.coordinates ?? this.options.evaluationLocation;
    const context = pointContext ? { latitude: pointContext.latitude, longitude: pointContext.longitude, radiusMeters: request.intent.area.radiusMeters ?? this.options.evaluationLocation?.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS } : undefined;
    const places = await this.client.textSearch({ textQuery: query, pageSize: Math.max(10, this.maxResults), ...(context ? { locationBias: context } : {}) }, signal);
    const geographicMatches = places.filter(item => {
      const point = coordinates(item);
      return geographicLocation(item) && string(item.id) && string(item.displayName?.text)
        && point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
        && Math.abs(point.latitude!) <= 90 && Math.abs(point.longitude!) <= 180;
    });
    const sourceObservations = places.map(namedLocationObservation).join("; ") || "no returned places";
    // Search ranking, geographic type and coordinates are the source's location
    // correspondence. Nearby geographic representations are not ambiguities.
    // Compare only the leading three geographic results, using the existing
    // 100km regional-separation boundary rather than a spelling or city table.
    const leading = geographicMatches.slice(0, 3);
    for (let i = 0; i < leading.length; i++) for (let j = i + 1; j < leading.length; j++) {
      const first = coordinates(leading[i]!)!, second = coordinates(leading[j]!)!;
      const separation = googleDiscoveryGeoDiagnostics({ location: first }, { evaluationLocation: {
        latitude: second.latitude!, longitude: second.longitude!, radiusMeters: NAMED_PLACE_NEARBY_RADIUS_METERS, label: "ranked geographic observation",
      } }).distanceMeters;
      if (separation !== undefined && separation > MAX_NAMED_LOCATION_CONTEXT_DISTANCE_METERS) {
        throw namedLocationResolutionError("GOOGLE_LOCATION_AMBIGUOUS", `Leading geographic results are ${Math.round(separation)} meters apart, exceeding ${MAX_NAMED_LOCATION_CONTEXT_DISTANCE_METERS}. Observations: ${sourceObservations}`, places);
      }
    }
    const place = geographicMatches[0];
    const placeId = place && string(place.id);
    const label = place && string(place.displayName?.text);
    const resolved = place && coordinates(place);
    if (!placeId || !label || !resolved) {
      throw namedLocationResolutionError("GOOGLE_LOCATION_UNRESOLVED", `Google Places could not resolve coordinates for the named location ${JSON.stringify(query)}. Observations: ${sourceObservations}`, places);
    }
    const distance = context ? googleDiscoveryGeoDiagnostics({ location: resolved }, { evaluationLocation: { ...context, label: "bound location context" } }).distanceMeters : undefined;
    if (distance !== undefined && distance > MAX_NAMED_LOCATION_CONTEXT_DISTANCE_METERS) {
      throw namedLocationResolutionError("GOOGLE_LOCATION_AMBIGUOUS", `Named location is ${Math.round(distance)} meters from the bound context, exceeding ${MAX_NAMED_LOCATION_CONTEXT_DISTANCE_METERS}. Observations: ${sourceObservations}`, places);
    }
    const observedAt = this.now();
    const radiusMeters = request.intent.area.radiusMeters ?? NAMED_PLACE_NEARBY_RADIUS_METERS;
    const requestFingerprint = createHash("sha256").update(JSON.stringify({ namedLocation: query, placeId, radiusMeters })).digest("hex");
    return {
      location: { latitude: resolved.latitude!, longitude: resolved.longitude!, radiusMeters, label, areaMatchBasis: "NAMED_PLACE_RADIUS", ...(addressComponents(place) ? { addressComponents: addressComponents(place)! } : {}) },
      ...(publicNamedLocationObservations([place])[0] ? { publicLocationObservation: publicNamedLocationObservations([place])[0]! } : {}),
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
          locationNameExactMatch: label === query,
          resolvedPlaceTypes: publicNamedLocationObservations([place])[0]!.types,
          resolvedPlaceId: placeId,
          latitude: resolved.latitude!,
          longitude: resolved.longitude!,
          radiusMeters,
          locationResolutionSource: "GOOGLE_TEXT_SEARCH",
        },
      },
    };
  }

  /** Name lookup has no invented geographic center and no cuisine retrieval rewrite. */
  private async searchNamedOutlet(request:RestaurantSearchRequest,signal:AbortSignal,reference?:NamedOutletReference):Promise<RestaurantSearchRead> {
    const startedAt=Date.now(),query=request.intent.target!.query,observedAt=this.now();
    const area=request.intent.area;
    const namedLocation=area&&!area.coordinates&&!request.continuation?await this.resolveNamedNearbyLocation(request,signal):{};
    const locationContext=area?.coordinates?{latitude:area.coordinates.latitude,longitude:area.coordinates.longitude,radiusMeters:area.radiusMeters??DEFAULT_NEARBY_RADIUS_METERS,label:area.query,areaMatchBasis:"TASK_LOCATION_RADIUS" as const}
      :request.continuation?.locationContext??namedLocation.location;
    const textQuery=`${query} ${area?.query??"Tokyo"}`;
    const selectedId=reference?.restaurant.sourceIds.googlePlaces;
    const read=async(pageToken?:string)=>{
      if(!this.hasBudget(request.readRunId))throw new GooglePlacesError("GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED","Named-outlet lookup exhausted the enclosing Google budget");
      this.consumeRequest(request.readRunId,"discovery");
      return this.client.textSearchPage({textQuery,pageSize:20,...(pageToken?{pageToken}:{})},signal);
    };
    let first:GooglePlacesTextSearchPage;
    if(selectedId){
      if(!this.hasBudget(request.readRunId))throw new GooglePlacesError("GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED","Selected-outlet lookup exhausted the enclosing Google budget");
      this.consumeRequest(request.readRunId,"placeDetails");
      try{const place=await this.client.placeDetails(selectedId,signal);first={places:place.id===selectedId?[place]:[]};}
      catch(error){if(error instanceof GooglePlacesError&&error.status===404)first={places:[]};else throw error;}
    }else first=await read();
    const pages=[first];
    if(first.nextPageToken)pages.push(await read(first.nextPageToken));
    signal.throwIfAborted();
    const key=outletNameKey(query);
    // A Japanese user name can be compared to the source's Japanese name,
    // never to a model translation. Same cache/ceiling as both availability sources.
    const japanese=selectedId?new Map<string,string>():await this.namedJapaneseAliases(query,pages.flatMap(p=>p.places),request.readRunId,signal);
    const candidates=[...new Map(pages.flatMap(page=>page.places).map(place=>[place.id,place])).values()].flatMap(place=>{
      const o=rawObservation(place);
      if(!inTokyo(o)||!selectedId&&!possibleNamedOutlet(query,o.displayName??"")&&outletNameKey(japanese.get(o.placeId??"")??"")!==key)return [];
      const result=groundGoogleDiscovery(o,{timezone:request.intent.timezone,observedAt,requestFingerprint:restaurantSearchIntentFingerprint(request.intent),areaQuery:area?.query??"",...(locationContext?{evaluationLocation:locationContext}:{})});
      return result.accepted?[{...result,evidence:{...result.evidence,claims:{...result.evidence.claims,
        namedOutletLocalities:addressLocalities(o)}}}]:[];
    });
    const unique=candidates.length===1&&(Boolean(selectedId)||outletNameKey(candidates[0]!.candidate.restaurant.outletName)===key)&&!pages.at(-1)!.nextPageToken;
    const status=unique?"UNIQUE":"AMBIGUOUS";
    const accepted=candidates.slice(0,this.maxResults);
    const sourceNames=await this.observedSourceNames(accepted.map(r=>r.candidate),request.readRunId);
    return {candidates:accepted.map(r=>({...r.candidate,matchReasons:area?r.candidate.matchReasons:[`Location from named outlet resolution: ${r.candidate.restaurant.address}`],warnings:unique?[]:candidates.length===1?["Google lists this outlet under a different name."]:["Confirm which branch or area you mean; the outlet name is not uniquely resolved."]})),evidence:[...(namedLocation.evidence?[namedLocation.evidence]:[]),...accepted.flatMap(r=>{
      const {areaQuery:_area,areaMatch:_match,...claims}=r.evidence.claims as RestaurantReadEvidence["claims"];
      return [{...r.evidence,claims:{...(area?r.evidence.claims:claims),...(!area?{locationBasis:"NAMED_OUTLET_RESOLUTION"}:{}),namedOutletStatus:status,requestedOutletName:query,serviceArea:"Tokyo",namedOutletCandidateCount:candidates.length,namedOutletSearchComplete:!pages.at(-1)!.nextPageToken,
        ...(reference?{userSelectionEventId:reference.userEventId,...Object.fromEntries(["googlePlaces","tabelog","tablecheck"].flatMap(key=>reference.restaurant.sourceIds[key]?[[`selectedIdentity:${key}`,reference.restaurant.sourceIds[key]!]]:[]))}:{})}},...r.additionalEvidence,...sourceNames.filter(e=>e.candidateId===r.candidate.restaurant.id)];
    })],continuation:{intentFingerprint:restaurantSearchIntentFingerprint(request.intent),usedPageTokens:first.nextPageToken?[first.nextPageToken]:[],pagesRead:pages.length,exhausted:true,sourceRequestContext:{textQuery},...(locationContext?{locationContext}:{}),...(!unique&&accepted.length?{lastFailureCode:"ENTITY_MATCH_UNCERTAIN" as const}:{})},
      metadata:{provider:"GOOGLE_PLACES" as const,route:this.executionRoute,latencyMs:Date.now()-startedAt,googleRequests:this.googleRequestUsage(request.readRunId),
        googleGeoDiagnostics:{providerMode:"GOOGLE_TEXT_SEARCH",requestMode:"UNRESTRICTED",exactRadiusGate:"NOT_APPLICABLE",candidates:accepted.map(r=>({sourcePlaceId:r.candidate.restaurant.sourceIds.googlePlaces!,accepted:true,reasonCode:unique?"NAMED_OUTLET_UNIQUE":"NAMED_OUTLET_AMBIGUOUS"}))}}};
  }

  async search(request: RestaurantSearchRequest, signal: AbortSignal,reference?:NamedOutletReference): Promise<RestaurantSearchRead> {
    const startedAt = Date.now();
    const intentFingerprint = restaurantSearchIntentFingerprint(request.intent);
    if (request.continuation && request.continuation.intentFingerprint !== intentFingerprint) {
      throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google Places continuation does not belong to the authoritative restaurant intent");
    }
    if (request.continuation?.exhausted || !request.continuation?.nextPageToken && request.continuation) {
      return {
        candidates: [], evidence: [],
        continuation: structuredClone(request.continuation),
        metadata: { provider: "GOOGLE_PLACES" as const, route: this.executionRoute, latencyMs: Date.now() - startedAt, googleRequests: this.googleRequestUsage(request.readRunId) },
      };
    }
    if(request.intent.target?.selectionScope==="SPECIFIC_OUTLET"&&request.intent.target.query.trim())return this.searchNamedOutlet(request,signal,reference);
    if(!request.intent.area)throw new GooglePlacesError("GOOGLE_LOCATION_UNRESOLVED","Open-ended search requires a user area");
    const nearbyCategory = request.discoveryQuery?.keyword||request.discoveryRetrieval?.keyword ? undefined
      : request.discoveryQuery?.category ?? (request.discoveryRetrieval ? generalDiscoveryCategory(request.intent) : undefined);
    const usesNearbySearch = nearbyCategory !== undefined;
    // Google page tokens are bound to the original request.  The Agent may
    // change a retrieval hint only for a new search; a continuation must keep
    // the first page's query exactly, alongside its persisted geography.
    const textQuery = request.continuation?.sourceRequestContext?.textQuery ?? buildGooglePlacesTextQuery(request);
    const taskLocation = request.intent.area.coordinates;
    // A request-driven Discovery Pack has already resolved its source-plan
    // location before Google is reached. This is separate from a Google page
    // cursor, so it avoids repeating named-place Text Search between packs.
    const plannedLocation = request.discoveryQuery?.location;
    // A continuation reuses the original query/area exactly; it must not run
    // another named-place lookup whose result could drift between pages.
    const namedLocation = taskLocation || plannedLocation || request.continuation ? {} : await this.resolveNamedNearbyLocation(request, signal);
    const locationContext = plannedLocation
      ? { ...plannedLocation }
      : taskLocation
      ? { latitude: taskLocation.latitude, longitude: taskLocation.longitude, radiusMeters: request.intent.area.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS, label: request.intent.area.query, areaMatchBasis: "TASK_LOCATION_RADIUS" as const }
      : request.continuation?.locationContext ?? namedLocation.location ?? (request.intent.area.query.trim().toLowerCase() === "nearby" && this.options.evaluationLocation
        ? { latitude: this.options.evaluationLocation.latitude, longitude: this.options.evaluationLocation.longitude, radiusMeters: this.options.evaluationLocation.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS, label: this.options.evaluationLocation.label ?? "explicit evaluation location", areaMatchBasis: "EVALUATION_LOCATION_RADIUS" as const }
        : undefined);
    if (usesNearbySearch && !locationContext) {
      throw new GooglePlacesError("GOOGLE_LOCATION_UNRESOLVED", "Google Nearby Search requires the planner's resolved circle");
    }
    const firstPageToken = request.continuation?.nextPageToken;
    const usedPageTokens = [...(request.continuation?.usedPageTokens ?? [])];
    if (firstPageToken && usedPageTokens.includes(firstPageToken)) {
      return {
        candidates: [], evidence: [],
        continuation: { intentFingerprint, usedPageTokens, pagesRead: request.continuation?.pagesRead ?? 0, exhausted: true, lastFailureCode: "GOOGLE_PAGINATION_REPEATED_TOKEN" },
        metadata: { provider: "GOOGLE_PLACES" as const, route: this.executionRoute, latencyMs: Date.now() - startedAt, failureCode: "GOOGLE_PAGINATION_REPEATED_TOKEN", googleRequests: this.googleRequestUsage(request.readRunId) },
      };
    }
    const readPage = async (pageToken: string | undefined) => {
      if (!this.hasBudget(request.readRunId)) {
        throw new GooglePlacesError("GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED", "The local per-run Google request budget is exhausted before discovery");
      }
      this.consumeRequest(request.readRunId, "discovery");
      if (pageToken) usedPageTokens.push(pageToken);
      if (usesNearbySearch) {
        if (pageToken) throw new GooglePlacesError("GOOGLE_MALFORMED_RESPONSE", "Google Nearby Search does not accept a page cursor");
        return { places: await this.client.nearbySearch({
          includedTypes: [nearbyCategory],
          location: locationContext!,
          maxResultCount: 20,
        }, signal) };
      }
      return this.client.textSearchPage({
        textQuery,
        pageSize: 20,
        ...(pageToken ? { pageToken } : {}),
        ...(locationContext ? { locationRestriction: geographicRectangle(locationContext) } : {}),
      }, signal);
    };
    const first = await readPage(firstPageToken);
    if (signal.aborted) throw signal.reason;
    const pages = [first.places];
    let nextPageToken = first.nextPageToken;
    let lastFailureCode: RestaurantFailureCode | undefined;
    const observedAt = this.now();
    const requestFingerprint = createHash("sha256").update(JSON.stringify({ textQuery, nearbyCategory, area: request.intent.area })).digest("hex");
    const groundingInput: GoogleDiscoveryGroundingInput = {
      timezone: request.intent.timezone,
      requestFingerprint,
      observedAt,
      areaQuery: request.intent.area?.query??"",
      requiredTypeCriteria: request.intent.criteria
        .filter((criterion) => criterion.polarity === "POSITIVE" && criterion.strength === "HARD")
        .map((criterion) => criterion.text),
      negativeCriteria: request.intent.criteria
        .filter((criterion) => criterion.polarity === "NEGATIVE" && criterion.strength === "HARD")
        .map((criterion) => criterion.text),
      ...(request.intent.date ? { requestedDate: request.intent.date } : {}),
      ...(request.intent.timeWindow ? { requestedTimeWindow: request.intent.timeWindow } : {}),
      ...(locationContext ? { evaluationLocation: locationContext } : {}),
    };
    const groundPage = (places: typeof first.places) => places.map((place) => {
      const observation = rawObservation(place);
      const result = groundGoogleDiscovery(observation, groundingInput);
      return { result, observation, sourcePlaceId: observation.placeId, diagnostics: googleDiscoveryGeoDiagnostics(observation, groundingInput) };
    });
    const grounded = groundPage(first.places);
    // An initial read intentionally obtains at most two 20-result pages. A
    // later explicit replenishment consumes one durable cursor page at a time.
    if (!usesNearbySearch && !request.continuation && nextPageToken) {
      if (usedPageTokens.includes(nextPageToken)) {
        lastFailureCode = "GOOGLE_PAGINATION_REPEATED_TOKEN";
        nextPageToken = undefined;
      } else {
        try {
          const second = await readPage(nextPageToken);
          if (signal.aborted) throw signal.reason;
          pages.push(second.places);
          grounded.push(...groundPage(second.places));
          nextPageToken = second.nextPageToken;
          if (nextPageToken && usedPageTokens.includes(nextPageToken)) {
            lastFailureCode = "GOOGLE_PAGINATION_REPEATED_TOKEN";
            nextPageToken = undefined;
          }
        } catch (error) {
          // The first page is independently valid. Preserve it and make the
          // partial failure visible rather than discarding the whole search.
          lastFailureCode = error instanceof GooglePlacesError ? error.code : "GOOGLE_SECOND_PAGE_FAILED";
          nextPageToken = first.nextPageToken;
          if (usedPageTokens.at(-1) === first.nextPageToken) usedPageTokens.pop();
        }
      }
    }
    // Google may return an outlet again on the next page. Preserve only the
    // first grounded observation for each stable Domain outlet ID so the pool
    // cannot present one physical restaurant as two investigation targets.
    const structural = [...new Map(grounded.flatMap(({ result }) =>
      result.accepted ? [[result.candidate.restaurant.id, result] as const] : [],
    )).values()];
    const acceptedGrounded=structural;
    return {
      candidates: acceptedGrounded.map((result) => result.candidate),
      evidence: [...(namedLocation.evidence ? [namedLocation.evidence] : []), ...acceptedGrounded.flatMap((result) => [result.evidence, ...result.additionalEvidence]),
        ...await this.observedSourceNames(acceptedGrounded.map(r=>r.candidate),request.readRunId)],
      continuation: {
        intentFingerprint,
        ...(nextPageToken ? { nextPageToken } : {}),
        usedPageTokens,
        pagesRead: (request.continuation?.pagesRead ?? 0) + pages.length,
        exhausted: restaurantReserveCancelled(signal) ? false : !nextPageToken,
        ...(lastFailureCode ? { lastFailureCode } : {}),
        ...(locationContext ? { locationContext } : {}),
        sourceRequestContext: { textQuery: usesNearbySearch ? `nearby:${nearbyCategory}` : textQuery },
      } satisfies RestaurantSearchContinuation,
      metadata: {
        provider: "GOOGLE_PLACES" as const,
        route: this.executionRoute,
        latencyMs: Date.now() - startedAt,
        ...(lastFailureCode ? { failureCode: lastFailureCode } : {}),
        googleRequests: this.googleRequestUsage(request.readRunId),
        ...(restaurantReserveCancelled(signal) ? {reserveReached:{reason:'DELIVERY_TIME' as const,completedCandidateIds:acceptedGrounded.map(result=>result.candidate.restaurant.id)},failureCode:'DELIVERY_RESERVE_REACHED' as const} : {}),
        googleGeoDiagnostics: {
          providerMode: usesNearbySearch ? "GOOGLE_NEARBY_SEARCH" as const : "GOOGLE_TEXT_SEARCH" as const,
          requestMode: usesNearbySearch ? "LOCATION_RESTRICTION_CIRCLE" as const : locationContext ? "LOCATION_RESTRICTION_RECTANGLE" as const : "UNRESTRICTED" as const,
          exactRadiusGate: locationContext ? "ENFORCED" as const : "NOT_APPLICABLE" as const,
          ...(locationContext ? {
            center: { latitude: locationContext.latitude, longitude: locationContext.longitude },
            radiusMeters: locationContext.radiusMeters,
            areaMatchBasis: locationContext.areaMatchBasis,
          } : {}),
          candidates: grounded.map(({ result, sourcePlaceId, diagnostics }) => ({
            ...(sourcePlaceId ? { sourcePlaceId } : {}),
            ...(diagnostics.sourceCoordinates ? { sourceCoordinates: diagnostics.sourceCoordinates } : {}),
            ...(diagnostics.distanceMeters !== undefined ? { distanceMeters: diagnostics.distanceMeters } : {}),
            accepted: result.accepted,
            reasonCode: result.accepted ? "ACCEPTED" : result.reasonCode,
          })),
        },
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
        timezone: request.intent.timezone,
        requestFingerprint,
        observedAt: checkedAt,
        areaQuery: request.intent.area?.query??"",
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
        ...(exhausted ? { failureCode: "GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED" as const } : {}),
      },
    };
  }
}
