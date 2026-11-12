import {parse, type DefaultTreeAdapterMap} from "parse5";
import {normalizedTextKey} from "../../core/text-key.js";
import {restaurantReserveCancelled} from "../../domains/restaurant/read-time-reserve.js";
import type {DiscoveryRetrievalPlanner} from "./discovery-retrieval-planner.js";
import { restaurantFailureCode, type RestaurantFailureCode } from "../../domains/restaurant/failure-codes.js";
import type { BrowserReadLimits } from "../../infrastructure/browser/browser-task-executor.js";
import { DEFAULT_NEARBY_RADIUS_METERS } from "../../core/location/nearby.js";
import { createHash, randomUUID } from "node:crypto";

import type { RestaurantSearchPort } from "../../application/restaurant-execution-router.js";
import { restaurantSearchIntentFingerprint, type RestaurantCandidate, type RestaurantReadEvidence, type RestaurantSearchRead, type RestaurantSearchRequest } from "../../domains/restaurant/contracts.js";
import { advanceDiscoveryPlan, currentDiscoveryPlanEntry, planDiscoverySources, type DiscoveryPlan, type DiscoveryQuery } from "../../domains/restaurant/discovery-planner.js";
import { googleDiscoveryGeoDiagnostics } from "../../domains/restaurant/read-grounding.js";
import type { BrowserPageControl, BrowserReadNetworkPolicy, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserExecutionBudget, BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { BrowserReadDecisionError, type BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { GooglePlacesRestaurantSearch } from "../google/google-places-restaurant-search.js";
import { restaurantDiscoveryPacks, type DiscoverySourcePack, type SourcePackListingOutlet } from "./source-packs.js";

type Location = NonNullable<NonNullable<RestaurantSearchRequest["continuation"]>["locationContext"]>;
type SourceFlow = "DIRECTORY" | "VENUE_SEARCH";
type NativeSourceProgress = NonNullable<RestaurantSearchRequest["continuation"]>["sourceProgress"] extends infer Progress
  ? NonNullable<Progress> : never;
type DirectoryRegion = NonNullable<NativeSourceProgress["directoryRegion"]>;
type PendingSourceEntry = NonNullable<NativeSourceProgress["pendingSourceEntries"]>[number];
/** One read chunk.  It is not a statement that the source has been exhausted. */
const NATIVE_DETAIL_BATCH_CAP = 5;
/** Keep the second source and final presentation within the existing run budget. */
const NATIVE_DETAIL_SOURCE_CAP = 10;
/** A chunk reopens the source list only to recover its persisted observed entrance set. */
const NATIVE_LISTING_PAGE_CAP: Record<SourceFlow, number> = {
  DIRECTORY: 7,
  VENUE_SEARCH: 3,
};
/** A cumulative source ceiling within the shared read-run budget. */
const NATIVE_SOURCE_ELAPSED_CAP_MS = 90_000;

function nativeSourceForPack(pack: DiscoverySourcePack | undefined): SourceFlow | undefined {
  return pack?.browser?.flow;
}

function rawSourceLinks(page: BrowserSnapshot, pack: DiscoverySourcePack): number {
  return pack.browser?.countRawLinks(page) ?? 0;
}

function taskLevelFailure(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error !== null && typeof error === "object" && "code" in error && (
    error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "MODEL_CALL_BUDGET_EXHAUSTED"
    || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "BROWSER_ABORTED"
  ));
}

function candidateFailureCode(error: unknown, source: string): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(code) ? code : `${source}_DETAIL_FAILED`;
}

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function pendingEntry(
  sourceEntityId: string,
  sourceUrl: string,
  observedAt: string,
  fields: { outletName?: string; address?: string; phone?: string; sourceCategories?: string[] } = {},
): PendingSourceEntry {
  return { sourceEntityId, sourceUrl, observedAt, ...fields };
}

function retainedPendingEntries(
  pack: DiscoverySourcePack,
  priorProgress: NativeSourceProgress | undefined,
): PendingSourceEntry[] {
  if (priorProgress?.sourceId !== pack.meta.id) return [];
  const entries = priorProgress.pendingSourceEntries ?? priorProgress.pendingSourceIds.map((sourceEntityId) => ({
    sourceEntityId,
    sourceUrl: "",
    observedAt: "",
  }));
  return entries.filter((entry) => {
    try {
      const url = new URL(entry.sourceUrl);
      return pack.browser?.acceptsDetailUrl(url.toString()) ?? false;
    } catch {
      return false;
    }
  });
}

export function sourceListingCompletion(pack: DiscoverySourcePack, current: BrowserSnapshot, _controls: readonly BrowserPageControl[], expression: string,
  location: { label: string; queryLabel?: string; addressComponents?: Array<{ longText: string; shortText?: string }> } | undefined) {
  const listing = pack.parseListing(current), empty = pack.browser!.isExplicitEmptyListing(current);
  const words = (text: string) => [...new Intl.Segmenter(undefined, { granularity: "word" }).segment(normalizedTextKey(text.normalize("NFKD").replace(/\p{M}/gu, "")))].filter(segment => segment.isWordLike).map(segment => segment.segment);
  const base = location ? words(location.label).join("") : "";
  const names = new Set([base, location?.queryLabel ? words(location.queryLabel).join("") : ""].filter(Boolean));
  // A component belongs to this place's name only when one of its own names
  // corresponds to the resolved display name. Do not accept its parent city or
  // country merely because it occurs in the same address response.
  for (const component of location?.addressComponents ?? []) {
    const aliases = [component.longText, component.shortText].filter((value): value is string => Boolean(value)).map(value => words(value).join(""));
    if (aliases.includes(base)) for (const alias of aliases) if (alias) names.add(alias);
  }
  const observed = words(current.text);
  const contains = (tokens:string[], name:string) => tokens.some((_,start)=>{
    let joined="";
    for(let end=start;end<tokens.length && joined.length<name.length;end++){
      joined+=tokens[end];if(joined===name)return true;
    }
    return false;
  });
  const locationBound = !location || [...names].some(name=>contains(observed,name));
  // The document title and visible primary headings describe the whole result
  // scope. Card text, input values and menu options cannot establish that scope.
  const headings: string[] = [];
  const text = (node: DefaultTreeAdapterMap["node"]): string => "value" in node ? node.value : "childNodes" in node ? node.childNodes.map(text).join(" ") : "";
  const visit = (node: DefaultTreeAdapterMap["node"]): void => {
    if ("tagName" in node && node.tagName === "h1") headings.push(text(node));
    else if ("childNodes" in node) for (const child of node.childNodes) visit(child);
  };
  if (current.visibleHtml) visit(parse(current.visibleHtml));
  const scope = words([current.title,...headings].join(" "));
  const query=pack.browser!.retrievalExpression(current.url),criterion=words(expression).join("");
  const retrievalBound=!criterion || (query!==undefined && contains(words(query),criterion)) || contains(scope,criterion);
  return { complete: locationBound && retrievalBound && (listing.outlets.length > 0 || empty), resultBusy: pack.browser!.resultBusy(current),
    reason: !locationBound ? "Requested location is not confirmed in visible result text; an input value does not establish location." : !retrievalBound ? "The source query, document title and visible primary heading do not confirm the retrieval expression for the whole list; card, menu and input text are not scope evidence." : "Read stable source-owned public results for the requested location.",
    resultKey: JSON.stringify([current.url, listing.outlets.map(outlet => outlet.sourceUrl).sort(), empty]) };
}

/** Only the current restaurant's JSON-LD geo can establish the exact area gate. */
function pageCoordinates(page: BrowserSnapshot, outletName: string): { latitude: number; longitude: number } | undefined {
  for (const match of page.html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const root = JSON.parse(match[1] ?? "") as unknown;
      const queue: unknown[] = Array.isArray(root) ? [...root] : [root];
      while (queue.length) {
        const value = queue.shift();
        if (!value || typeof value !== "object" || Array.isArray(value)) continue;
        const item = value as Record<string, unknown>;
        if (Array.isArray(item["@graph"])) queue.push(...item["@graph"]);
        if (typeof item.name !== "string" || normalized(item.name) !== normalized(outletName)) continue;
        const geo = item.geo;
        if (!geo || typeof geo !== "object" || Array.isArray(geo)) continue;
        const point = geo as Record<string, unknown>;
        const numericCoordinate = (value: unknown) => typeof value === "number" || typeof value === "string" && value.trim() !== "";
        if (!numericCoordinate(point.latitude) || !numericCoordinate(point.longitude)) continue;
        const latitude = Number(point.latitude);
        const longitude = Number(point.longitude);
        if (Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
          return { latitude, longitude };
        }
      }
    } catch { /* Untrusted source JSON is ignored, never repaired by guessing. */ }
  }
  return undefined;
}

function groundedNativeCandidate(input: {
  source: DiscoverySourcePack;
  sourceId: string;
  sourceCategories?: string[];
  listingScope?: {ref:string;text:string;url:string};
  phone?: string;
  sourceUrl: string;
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
  location: Location;
  request: RestaurantSearchRequest;
  observedAt: string;
}): { candidate: RestaurantCandidate; evidence: RestaurantReadEvidence } | undefined {
  const geo = googleDiscoveryGeoDiagnostics({ location: input.coordinates }, { evaluationLocation: input.location });
  if (geo.distanceMeters === undefined || geo.distanceMeters > input.location.radiusMeters) return undefined;
  const candidateId = `${input.source.meta.id}:${input.sourceId}`;
  const evidenceId = `evidence:restaurant:native-discovery:${createHash("sha256").update(`${candidateId}:${input.observedAt}`).digest("hex").slice(0, 24)}`;
  const evidence: RestaurantReadEvidence = {
    evidenceId, kind: "DISCOVERY", provider: input.source.browser!.provider, candidateId,
    sourceEntityId: input.sourceId, sourceUrl: input.sourceUrl, observedAt: input.observedAt,
    requestFingerprint: JSON.stringify({ intent: restaurantSearchIntentFingerprint(input.request.intent), location: input.location }),
    claims: {
      ...(input.sourceCategories?.length ? { sourceCategories: input.sourceCategories } : {}),
      discoveryScopeStatus:input.listingScope?"OBSERVED":"UNVERIFIED",
      ...(input.listingScope?{discoveryScopeRef:input.listingScope.ref,discoveryScopeText:input.listingScope.text,discoveryScopeUrl:input.listingScope.url}:{}),
      outletName: input.name, address: input.address, areaQuery: input.request.intent.area!.query,
      areaMatch: true, areaMatchBasis: input.location.areaMatchBasis,
      evaluationLocationLabel: input.location.label, distanceMeters: Math.round(geo.distanceMeters),
    },
  };
  return {
    candidate: {
      restaurant: {
        id: candidateId, outletName: input.name, address: input.address,
        coordinates: { lat: input.coordinates.latitude, lng: input.coordinates.longitude },
        sourceIds: {...input.source.browser!.candidateSourceIds(input.sourceId, input.sourceUrl),...(input.phone?{phone:input.phone}:{})},
        provenance: { outletName: evidenceId, address: evidenceId, sourceIds: evidenceId },
      },
      matchReasons: [`Source coordinates within ${input.location.radiusMeters} m of ${input.location.label}`],
      warnings: [], executionConfidence: "MEDIUM",
    },
    evidence,
  };
}

/** Same-read source identity checks against details already parsed by the pack.
 * A website pointer or a name is never itself a binding. */
export function verifiedDiscoveryIdentities(pack:DiscoverySourcePack,candidates:readonly RestaurantCandidate[],details:readonly SourcePackListingOutlet[],evidence:readonly RestaurantReadEvidence[]):RestaurantReadEvidence[]{
  if(!pack.browser)return [];
  const supported=details.filter(outlet=>evidence.some(e=>e.kind==="DISCOVERY"&&e.provider===pack.browser!.provider&&e.sourceEntityId===outlet.sourceEntityId&&e.sourceUrl===outlet.sourceUrl));
  return candidates.flatMap(candidate=>{
    const match=pack.browser!.resolveDetailIdentity(candidate,supported),outlet=match.outlet;
    if(match.confidence!=="HIGH"||!outlet)return [];
    const source=evidence.find(e=>e.kind==="DISCOVERY"&&e.provider===pack.browser!.provider&&e.sourceEntityId===outlet.sourceEntityId&&e.sourceUrl===outlet.sourceUrl)!;
    return [{...structuredClone(source),evidenceId:`evidence:restaurant:discovery-identity:${createHash("sha256").update(JSON.stringify({candidateId:candidate.restaurant.id,source:source.evidenceId})).digest("hex").slice(0,24)}`,
      candidateId:candidate.restaurant.id,kind:"ENTITY_MATCH" as const,entityMatch:{confidence:"HIGH" as const,matchedBy:[...match.matchedBy]},
      claims:{...source.claims,corroboratingCandidateId:source.candidateId??candidate.restaurant.id}}];
  });
}

/** Merge only equal verified provider identities; unknown/conflicting identities
 * stay separate. Keep primary navigation and every corroborating source ID. */
export function mergeDiscoveryCandidates(primary:RestaurantCandidate[],supplement:RestaurantCandidate[],evidence:readonly RestaurantReadEvidence[]){
  const candidates=structuredClone(primary),aliases=new Map<string,string>();
  const bindings=(id:string)=>evidence.filter(e=>(aliases.get(e.candidateId??"")??e.candidateId)===id&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH"&&e.sourceEntityId&&e.sourceUrl);
  const equal=(left:RestaurantReadEvidence,right:RestaurantReadEvidence)=>left.provider===right.provider&&left.sourceEntityId===right.sourceEntityId;
  const same=(left:string,right:string)=>{
    const a=bindings(left),b=bindings(right),all=[...a,...b];
    if(all.some(x=>all.some(y=>x.provider===y.provider&&!equal(x,y))))return false;
    return a.some(x=>b.some(y=>equal(x,y)));
  };
  for(const candidate of supplement){
    const duplicate=candidates.find(c=>c.restaurant.id===candidate.restaurant.id||same(c.restaurant.id,candidate.restaurant.id));
    if(duplicate){
      aliases.set(candidate.restaurant.id,duplicate.restaurant.id);
      duplicate.restaurant.sourceIds={...candidate.restaurant.sourceIds,...duplicate.restaurant.sourceIds};
      duplicate.matchReasons=[...new Set([...duplicate.matchReasons,...candidate.matchReasons])];
      duplicate.warnings=[...new Set([...duplicate.warnings,...candidate.warnings])];
      continue;
    }
    candidates.push(structuredClone(candidate));
  }return {candidates,aliases};
}

/** Bounded browser-source discovery chunks scheduled by the request-owned pack plan. */
export class NativeRestaurantSearch implements RestaurantSearchPort {
  readonly executionRoute = "GENERIC_BROWSER" as const;

  constructor(
    private readonly runtime: BrowserRuntime,
    private readonly locality: GooglePlacesRestaurantSearch,
    private readonly retrievalPlanner: DiscoveryRetrievalPlanner,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly evaluationLocation: { latitude: number; longitude: number; radiusMeters: number; label: string } | undefined,
    private readonly discoveryDecision: BrowserReadActionDecisionPort | undefined,
    private readonly browserBudget: BrowserExecutionBudget | undefined,
    private readonly onBrowserDiagnostic: ((diagnostic: BrowserExecutionDiagnostic) => void) | undefined,
    private readonly discoveryLimits: BrowserReadLimits,
    /** Actual compositions provide the source-owned isolated read policy. */
    private readonly networkPolicy?: BrowserReadNetworkPolicy,
    private readonly packs: readonly DiscoverySourcePack[] = restaurantDiscoveryPacks,
  ) {}

  googleRequestUsage(readRunId: string | undefined) { return this.locality.googleRequestUsage(readRunId); }

  private async location(request: RestaurantSearchRequest, signal: AbortSignal): Promise<{ location: Location; localityEvidence?: RestaurantReadEvidence }> {
    const area = request.intent.area;
    if(!area)throw Object.assign(new Error("Regional discovery requires a user area"),{code:"GOOGLE_LOCATION_UNRESOLVED"});
    if (area.coordinates) return { location: await this.withAddressObservation({
      latitude: area.coordinates.latitude, longitude: area.coordinates.longitude,
      radiusMeters: area.radiusMeters ?? DEFAULT_NEARBY_RADIUS_METERS, label: area.query, areaMatchBasis: "TASK_LOCATION_RADIUS",
    }, request, signal) };
    if (request.continuation?.locationContext) return { location: request.continuation.locationContext.areaMatchBasis === "NAMED_PLACE_RADIUS"
      ? request.continuation.locationContext : await this.withAddressObservation(request.continuation.locationContext, request, signal) };
    const named = await this.locality.resolveNamedNearbyLocation(request, signal);
    if (named.location) return { location: named.location, ...(named.evidence ? { localityEvidence: named.evidence } : {}) };
    if (area.query.trim().toLocaleLowerCase("en-US") === "nearby" && this.evaluationLocation) return { location: await this.withAddressObservation({
      ...this.evaluationLocation, label: this.evaluationLocation.label, areaMatchBasis: "EVALUATION_LOCATION_RADIUS",
    }, request, signal) };
    throw Object.assign(new Error("Native search requires an observed coordinate context for exact geography"), { code: "NATIVE_LOCATION_UNRESOLVED" });
  }

  private async withAddressObservation(location: Location, request: RestaurantSearchRequest, signal: AbortSignal): Promise<Location> {
    const prior = request.continuation?.locationContext;
    if (prior?.addressObservation && prior.latitude === location.latitude && prior.longitude === location.longitude) {
      return { ...location, ...(prior.addressComponents ? { addressComponents: prior.addressComponents } : {}), addressObservation: prior.addressObservation };
    }
    return { ...location, ...await this.locality.observeCoordinateAddress(location, request.readRunId, signal) };
  }

  private async batch(
    pack: DiscoverySourcePack, source: SourceFlow, request: RestaurantSearchRequest,
    location: Location, query: DiscoveryQuery, signal: AbortSignal,
    priorProgress?: NativeSourceProgress,
  ): Promise<{
    candidates: RestaurantCandidate[]; evidence: RestaurantReadEvidence[]; identities:SourcePackListingOutlet[];
    candidateFailures: Array<{ sourceUrl: string; reasonCode: string }>;
    progress: NativeSourceProgress & { pendingSourceEntries: PendingSourceEntry[]; visitedListingUrls: string[]; elapsedMs: number };
    funnel: NonNullable<RestaurantSearchRead["metadata"]["nativeDiscoveryFunnel"]>;
  }> {
    const previous = priorProgress?.sourceId === pack.meta.id ? priorProgress : undefined;
    const startedAt = Date.now(), elapsedBefore = previous?.elapsedMs ?? 0;
    const admitted = new Map<string, { candidate: RestaurantCandidate; evidence: RestaurantReadEvidence }>();
    const known = new Map((previous?.pendingSourceEntries ?? []).map(entry => [entry.sourceUrl, entry]));
    const inspected = new Set(previous?.inspectedSourceIds ?? []);
    const attempted = new Set<string>();
    const identities:SourcePackListingOutlet[]=[];
    const rejected: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const candidateFailures: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const listings: NonNullable<NonNullable<RestaurantSearchRead["metadata"]["nativeDiscoveryFunnel"]>["listingObservations"]> = [];
    const visited = [...(previous?.visitedListingUrls ?? [])];
    const submittedOwners = new Set<string>();
    // Continuation entries are retained only after this intent's source list
    // completed. Fresh source reads must establish their own query transition.
    let queriedThisRead = visited.length > 0, modelActionObserved = false;
    let initialDocument: string | undefined, initialFormReceipts: number | undefined;
    const retrieval = structuredClone(previous?.retrieval ?? { rewrites: 0, regionPages: 0, retrievalPages: 0, history: [] });
    let pages = 0, detailAttempts = 0, raw = 0, parsed = 0, locatedListing = false;
    let nextNavigation: { detail: boolean; url?: string } | undefined;
    let stopped = false, noProgress = false;
    const elapsed = () => elapsedBefore + Date.now() - startedAt;
    const sourceEnded = () => noProgress || stopped && ![...known.values()].some(entry => !inspected.has(entry.sourceEntityId))
      || elapsed() >= NATIVE_SOURCE_ELAPSED_CAP_MS || (previous?.detailAttempts ?? 0) + detailAttempts >= NATIVE_DETAIL_SOURCE_CAP
      || (previous?.pagesRead ?? 0) + pages >= NATIVE_LISTING_PAGE_CAP[source];
    const progress = () => ({ sourceId: pack.meta.id, inspectedSourceIds: [...inspected],
      detailAttempts: (previous?.detailAttempts ?? 0) + detailAttempts, pagesRead: (previous?.pagesRead ?? 0) + pages,
      elapsedMs: elapsed(), retrieval, visitedListingUrls: visited,
      pendingSourceEntries: [...known.values()].filter(entry => !inspected.has(entry.sourceEntityId)),
      pendingSourceIds: [...known.values()].filter(entry => !inspected.has(entry.sourceEntityId)).map(entry => entry.sourceEntityId) });
    const funnel = (): NonNullable<RestaurantSearchRead["metadata"]["nativeDiscoveryFunnel"]> => ({
      source: pack.browser!.provider, rawSourceLinks: raw, parsedOutlets: parsed, inspectedOutlets: detailAttempts,
      batchCap: NATIVE_DETAIL_BATCH_CAP, sourceDetailCap: NATIVE_DETAIL_SOURCE_CAP,
      sourceDetailAttempts: (previous?.detailAttempts ?? 0) + detailAttempts, sourcePageCap: NATIVE_LISTING_PAGE_CAP[source],
      sourceElapsedCapMs: NATIVE_SOURCE_ELAPSED_CAP_MS, sourceElapsedMs: elapsed(), sourceTimeLimitReached: elapsed() >= NATIVE_SOURCE_ELAPSED_CAP_MS,
      deferredByBatchCap: [...known.values()].filter(entry => !inspected.has(entry.sourceEntityId)).map(entry => ({ sourceUrl: entry.sourceUrl, reasonCode: "DETAIL_BATCH_CAP" })),
      rejected, accepted: admitted.size, pagesRead: pages, batchLimitReached: detailAttempts >= NATIVE_DETAIL_BATCH_CAP,
      // Finishing the retained links ends this bounded route, not the website's coverage.
      sourceExhausted: remainingEntries().length||nextListing ? false : "UNKNOWN", batchEnded: true, sourceEnded: sourceEnded(),
      progressionReason: noProgress ? "NO_PROGRESS" : source === "DIRECTORY" ? "FIRST_SOURCE_BATCH" : "FIRST_SOURCE_BATCH_ENDED", listingObservations: listings, retrieval,
    });
    let detailNavigation = false, paginationNavigation=false, nextListing = previous?.nextListing;
    const executor = new BrowserTaskExecutor(this.runtime, {
      ...this.discoveryLimits,
      maxElapsedMsPerCandidate: Math.max(1, Math.min(this.discoveryLimits.maxElapsedMsPerCandidate ?? Infinity, NATIVE_SOURCE_ELAPSED_CAP_MS-elapsedBefore)),
      ...(this.discoveryDecision ? {modelDecision:this.discoveryDecision} : {}),
      ...(this.browserBudget ? {budget:this.browserBudget} : {}),
      onDiagnostic: diagnostic => {
        if (diagnostic.event === "MODEL_ACTION") modelActionObserved = true;
        if (diagnostic.event === "OPERATION_STARTED" && ["NAVIGATE","OPEN_LINK","SUBMIT_PUBLIC_QUERY"].includes(diagnostic.detail ?? "") && !detailNavigation) {
          if ((previous?.pagesRead ?? 0)+pages >= NATIVE_LISTING_PAGE_CAP[source] || (!paginationNavigation&&(locatedListing ? retrieval.retrievalPages>=3 : retrieval.regionPages>=4))) throw Object.assign(Error("Source page ceiling reached"),{code:"READ_BUDGET_EXCEEDED"});
          pages++; if(!paginationNavigation){if(locatedListing)retrieval.retrievalPages++;else retrieval.regionPages++;}
        }
        this.onBrowserDiagnostic?.(diagnostic);
      },
    });
    executor.beginCandidate(`native-discovery:${source}`); executor.beginProvider(`native-discovery:${source}`,source,"DISCOVERY");
    const related = (entry:PendingSourceEntry) => Boolean(query.keyword && entry.sourceCategories?.some(category=>normalizedTextKey(category).includes(normalizedTextKey(query.keyword!))));
    // Source category text is an advisory order within the existing detail cap,
    // never HARD verification. Preserve source order among equally related cards.
    const remainingEntries = () => [...known.values()].filter(entry=>!inspected.has(entry.sourceEntityId)).sort((a,b)=>Number(related(b))-Number(related(a)));
    let session: BrowserSession | undefined;
    try {
      if(elapsedBefore>=NATIVE_SOURCE_ELAPSED_CAP_MS || (previous?.detailAttempts??0)>=NATIVE_DETAIL_SOURCE_CAP || (previous?.pagesRead??0)>=NATIVE_LISTING_PAGE_CAP[source]) throw Object.assign(Error("Source read ceiling already reached"),{code:"READ_BUDGET_EXCEEDED"});
      while(detailAttempts<NATIVE_DETAIL_BATCH_CAP && (previous?.detailAttempts??0)+detailAttempts<NATIVE_DETAIL_SOURCE_CAP){
        if(!remainingEntries().length){
          session=await executor.acquire(signal,source,"DISCOVERY",this.networkPolicy);
          if(nextListing){paginationNavigation=true;try{await executor.navigate({source,stage:"DISCOVERY",signal,session,allowedOrigins:pack.documentOrigins,url:nextListing.sourceUrl,observed:true});}finally{paginationNavigation=false;}nextListing=undefined;}
          else if(!visited.length){
            if(!pack.browser?.startupUrl)throw Object.assign(Error("Source has no configured public start"),{code:"DISCOVERY_SOURCE_INCOMPLETE"});
            await executor.start({source,stage:"DISCOVERY",signal,session,allowedOrigins:pack.documentOrigins,url:pack.browser.startupUrl});
          }else{stopped=true;break;}
          const expression=query.keyword;
          if(expression&&!request.intent.criteria.some(c=>c.polarity==="POSITIVE"&&c.strength==="HARD"&&c.text.includes(expression)))throw Object.assign(Error("Retrieval lacks a literal authoritative criterion"),{code:"DISCOVERY_SOURCE_INCOMPLETE"});
          const result=await executor.runSkill({taskId:request.readRunId??`native-discovery:${source}`,source,stage:"DISCOVERY",signal,session,allowedOrigins:pack.documentOrigins,
            ...(pack.skillPath?{sourceSkillPath:pack.skillPath}:{}),requireModelConfirmation:true,
            goal:{outlet:{name:request.intent.target?.query??""},location:{...location,name:location.label},...(expression?{retrievalExpression:expression,retrievalSource:"CUISINE" as const}:{}),hardCriteria:request.intent.criteria.filter(c=>c.polarity==="POSITIVE"&&c.strength==="HARD").map(c=>c.text)},
            objective:"Find the current public restaurant list for the authoritative location and criteria. Choose each page action from the observation; If the page offers a location setting, establish and confirm the authoritative location in visible page state before submitting. Complete only when the current list confirms the location and the retrieval expression has been applied to the whole result scope. A broad parent category or a matching merchant card does not establish that scope; continue using currently observed query controls or category links until the source query, document title or visible primary heading confirms it. Do not construct URLs. Source-provided merchant links will be read and independently checked for identity and exact distance.",
            onQuerySubmitted: owner => { submittedOwners.add(owner); },
            completion:(page,controls)=>{
              const document = new URL(page.url); document.hash = "";
              initialDocument ??= document.href;
              const receipts = (page.networkRequests ?? []).filter(request => request.outcome === "ADMITTED" && request.method === "GET"
                && request.resourceType === "document" && request.formSubmission && pack.documentOrigins.includes(request.formSubmission.actionOrigin)).length;
              initialFormReceipts ??= receipts;
              queriedThisRead ||= modelActionObserved && document.href !== initialDocument || submittedOwners.size > 0 && receipts > initialFormReceipts;
              raw=Math.max(raw,rawSourceLinks(page,pack));
              const current=pack.parseListing(page);
              if(current.outlets.length)locatedListing=true;
              const assessment = sourceListingCompletion(pack,page,controls,expression??"",location.areaMatchBasis === "NAMED_PLACE_RADIUS" ? location : undefined);
              return queriedThisRead ? assessment : { ...assessment, complete: false, reason: "No current guarded form submission or model-driven document departure; homepage cards and suggestions are not search results." };
            },
          });
          if(result.reasonCode === "NO_PROGRESS") { noProgress=true; stopped=true; break; }
          if(result.status!=="COMPLETED"){throw Object.assign(Error("No confirmed current source list"),{code:pack.parseListing(result.snapshot).outlets.length?"DISCOVERY_SOURCE_LOCATION_UNGROUNDED":"DISCOVERY_SOURCE_INCOMPLETE"});}
          const page=result.snapshot,listing=pack.parseListing(page);
          locatedListing=true;
          raw=Math.max(raw,rawSourceLinks(page,pack));parsed+=listing.outlets.length;
          if(!visited.includes(page.url))visited.push(page.url);
          listings.push({sourceUrl:page.url,parsedOutlets:listing.outlets.length,...(listing.nextPage?{nextPageUrl:listing.nextPage}:{})});
          nextListing=listing.nextPage?{sourceUrl:listing.nextPage,observedOn:page.url,observedAt:this.now()}:undefined;
          for(const outlet of listing.outlets)known.set(outlet.sourceUrl,{...pendingEntry(outlet.sourceEntityId,outlet.sourceUrl,this.now(),outlet),...(result.scopeQuote?{listingScope:result.scopeQuote}:{})});
          if(!remainingEntries().length){if(nextListing)continue;stopped=true;break;}
        }
        for(const entry of remainingEntries()){
          if(detailAttempts>=NATIVE_DETAIL_BATCH_CAP || (previous?.detailAttempts??0)+detailAttempts>=NATIVE_DETAIL_SOURCE_CAP)break;
          try{
            session=await executor.acquire(signal,source,"IDENTITY",this.networkPolicy);
            inspected.add(entry.sourceEntityId);detailAttempts++;
            detailNavigation=true;
            try{await executor.navigate({source,stage:"IDENTITY",signal,session,allowedOrigins:pack.documentOrigins,url:entry.sourceUrl,observed:true});}catch(error){await executor.close("RUNTIME_FAILURE");throw error;}finally{detailNavigation=false;}
            const page=await executor.snapshot({source,stage:"IDENTITY",signal,session});
            if(pack.browser!.hasChallenge(page)||pack.browser!.isPageUnavailable(page))throw Object.assign(Error("Source merchant page unavailable"),{code:"DISCOVERY_SOURCE_INCOMPLETE"});
            const identity=pack.browser!.parseDetailIdentity(page,{...entry,outletName:entry.outletName??entry.sourceEntityId});
            const coordinates=identity&&pageCoordinates(page,identity.outletName);
            if(!identity||!coordinates){rejected.push({sourceUrl:page.url,reasonCode:identity?"PAGE_COORDINATES_MISSING":"PAGE_IDENTITY_MISSING"});continue;}
            const grounded=groundedNativeCandidate({source:pack,sourceId:identity.sourceEntityId,sourceUrl:identity.sourceUrl,name:identity.outletName,address:identity.address!,coordinates,location,request,observedAt:this.now(),...(entry.sourceCategories?{sourceCategories:entry.sourceCategories}:{}),...(entry.listingScope?{listingScope:entry.listingScope}:{}),...(identity.phone?{phone:identity.phone}:{})});
            if(grounded){admitted.set(grounded.candidate.restaurant.id,grounded);identities.push(identity);}
            else rejected.push({sourceUrl:page.url,reasonCode:"OUTSIDE_EXACT_RADIUS"});
          }catch(error){
            if(taskLevelFailure(error,signal)||!inspected.has(entry.sourceEntityId))throw error;
            const reasonCode=candidateFailureCode(error,pack.browser!.provider);candidateFailures.push({sourceUrl:entry.sourceUrl,reasonCode});rejected.push({sourceUrl:entry.sourceUrl,reasonCode});
          }
        }
        if(!remainingEntries().length&&!nextListing){stopped=true;break;}
      }
      const resultProgress={...progress(),...(nextListing?{nextListing}:{})};
      const resultFunnel=funnel();resultFunnel.sourceEnded=sourceEnded()||stopped&&!nextListing&&!remainingEntries().length;
      return{identities,candidates:[...admitted.values()].map(item=>item.candidate),evidence:[...admitted.values()].map(item=>item.evidence),candidateFailures,progress:resultProgress,funnel:resultFunnel};
    }catch(error){
      if(error&&typeof error==="object")Object.assign(error,{nativeIdentities:identities,nativeAccepted:[...admitted.values()],nativeProgress:{...progress(),...(nextListing?{nextListing}:{})},nativeFunnel:{...funnel(),progressionReason:"SOURCE_FAILURE"}});
      throw error;
    }finally{await executor.close();}
  }

  async search(request: RestaurantSearchRequest, signal: AbortSignal): Promise<RestaurantSearchRead> {
    const startedAt = Date.now();
    if (request.continuation && request.continuation.intentFingerprint !== restaurantSearchIntentFingerprint(request.intent)) {
      throw Object.assign(Error("Discovery continuation belongs to a different request"), {code: "GOOGLE_MALFORMED_RESPONSE"});
    }
    const { location, localityEvidence } = await this.location(request, signal);
    const discoveryPlan: DiscoveryPlan = structuredClone(request.continuation?.discoveryPlan
      ?? planDiscoverySources(request.intent, location, this.packs.map((pack) => pack.meta), this.now()));
    const entry = currentDiscoveryPlanEntry(discoveryPlan);
    if (!entry) throw Object.assign(new Error("Discovery source plan is exhausted"), { code: "DISCOVERY_PLAN_EXHAUSTED" });
    const previous = request.continuation;
    const paused = previous?.deferredSources ?? [];
    const resumed = paused.find(item => item.progress.sourceId === entry.sourceId);
    const deferredSources = paused.filter(item => item.progress.sourceId !== entry.sourceId);
    if (previous?.sourceProgress && previous.sourceProgress.sourceId !== entry.sourceId) {
      deferredSources.push({progress: previous.sourceProgress, usedPageTokens: previous.usedPageTokens, pagesRead: previous.pagesRead,
        ...(previous.nextPageToken ? {nextPageToken: previous.nextPageToken} : {}),
        ...(previous.sourceRequestContext ? {sourceRequestContext: previous.sourceRequestContext} : {})});
    }
    if (previous && previous.sourceProgress?.sourceId !== entry.sourceId) {
      const {sourceProgress: _active, nextPageToken: _token, sourceRequestContext: _query, ...rest} = previous;
      request = {...request, continuation: {...rest, usedPageTokens: resumed?.usedPageTokens ?? [], pagesRead: resumed?.pagesRead ?? 0,
        ...(resumed ? {sourceProgress: resumed.progress, ...(resumed.nextPageToken ? {nextPageToken: resumed.nextPageToken} : {}),
          ...(resumed.sourceRequestContext ? {sourceRequestContext: resumed.sourceRequestContext} : {})} : {})}};
    }
    const pack = this.packs.find((candidate) => candidate.meta.id === entry.sourceId);
    const source = nativeSourceForPack(pack);
    const prepareTextRetrieval = async (timeoutMs: number) => {
      if (!discoveryPlan.textRetrieval) {
        discoveryPlan.textRetrieval = entry.query.positiveCriteria.length
          ? await this.retrievalPlanner.decide({taskId: request.readRunId ?? 'discovery', intent: request.intent, locationName: location.label, attemptedRetrievals: [], rewrites: 0, timeoutMs})
          : {accepted: true, reason: 'General retrieval: no positive criteria.'};
        for (const planned of discoveryPlan.entries.filter(e => nativeSourceForPack(this.packs.find(p => p.meta.id === e.sourceId)) !== 'DIRECTORY')) {
          if (discoveryPlan.textRetrieval.keyword) planned.query.keyword = discoveryPlan.textRetrieval.keyword;
        }
      }
    };
    let planningElapsedMs=0;
    if(!discoveryPlan.textRetrieval){
      const planningStarted=Date.now();
      await prepareTextRetrieval(NATIVE_SOURCE_ELAPSED_CAP_MS);
      planningElapsedMs=Date.now()-planningStarted;
    }
    if(discoveryPlan.textRetrieval?.keyword)entry.query.keyword=discoveryPlan.textRetrieval.keyword;
    if(source){
      const prior=request.continuation?.sourceProgress?.sourceId===entry.sourceId?request.continuation.sourceProgress:undefined;
      request={...request,continuation:{intentFingerprint:restaurantSearchIntentFingerprint(request.intent),usedPageTokens:[],pagesRead:0,exhausted:false,...request.continuation,
        sourceProgress:{sourceId:entry.sourceId,inspectedSourceIds:[],detailAttempts:0,pagesRead:0,pendingSourceIds:[],...prior,elapsedMs:(prior?.elapsedMs??0)+planningElapsedMs,
          retrieval:prior?.retrieval??{selection:discoveryPlan.textRetrieval!,rewrites:0,regionPages:0,retrievalPages:0,history:[]}}}};
    }
    if (!source) {
      const read = await this.searchGooglePack(request, signal, discoveryPlan, entry.sourceId, entry.query.keyword ?? entry.query.category, location);
      read.continuation!.deferredSources = deferredSources;
      return read;
    }
    let batch: Awaited<ReturnType<NativeRestaurantSearch["batch"]>> = { candidates: [], evidence: [], identities:[], candidateFailures: [],
      progress: {
        retrieval:request.continuation?.sourceProgress?.retrieval??{rewrites:0,regionPages:0,retrievalPages:0,history:[]},
        sourceId: entry.sourceId,
        inspectedSourceIds: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? [...request.continuation.sourceProgress.inspectedSourceIds] : [],
        detailAttempts: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? request.continuation.sourceProgress.detailAttempts : 0,
        pagesRead: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? request.continuation.sourceProgress.pagesRead : 0,
        elapsedMs: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? request.continuation.sourceProgress.elapsedMs ?? 0 : 0,
        visitedListingUrls: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? [...(request.continuation.sourceProgress.visitedListingUrls ?? [])] : [],
        pendingSourceEntries: pack ? retainedPendingEntries(pack, request.continuation?.sourceProgress) : [],
        pendingSourceIds: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? [...request.continuation.sourceProgress.pendingSourceIds] : [],
      },
      funnel: { source: pack!.browser!.provider, retrieval:{rewrites:0,regionPages:0,retrievalPages:0,history:[]}, rawSourceLinks: 0, parsedOutlets: 0, inspectedOutlets: 0, batchCap: NATIVE_DETAIL_BATCH_CAP, sourceDetailCap: NATIVE_DETAIL_SOURCE_CAP, sourceDetailAttempts: 0, deferredByBatchCap: [], rejected: [], accepted: 0,
        sourcePageCap: NATIVE_LISTING_PAGE_CAP[source], sourceElapsedCapMs: NATIVE_SOURCE_ELAPSED_CAP_MS, sourceElapsedMs: 0, sourceTimeLimitReached: false,
        pagesRead: 0, batchLimitReached: false, sourceExhausted: "UNKNOWN", batchEnded: true, sourceEnded: true,
        progressionReason: source === "DIRECTORY" ? "FIRST_SOURCE_BATCH" : "FIRST_SOURCE_BATCH_ENDED", listingObservations: [] } };
    let failureCode: RestaurantFailureCode | undefined;
    try {
      if (discoveryPlan.textRetrieval?.accepted === false) throw Object.assign(Error('Rejected shared retrieval; bounded UNKNOWN'), {code:'DISCOVERY_SOURCE_INCOMPLETE'});
      batch = await this.batch(pack!, source, request, location, entry.query, signal, request.continuation?.sourceProgress);
    } catch (error) {
      if (taskLevelFailure(error, signal) && !restaurantReserveCancelled(signal)) throw error;
      if (error && typeof error === "object" && "nativeFunnel" in error && error.nativeFunnel) {
        // A source failure is not a completed empty batch.  If it still has
        // unstarted observed entrances, retain the source stage so the next
        // read consumes that queue rather than silently skipping a plan entry.
        const nativeError = error as { nativeFunnel: typeof batch.funnel; nativeProgress?: typeof batch.progress };
        const failedFunnel = nativeError.nativeFunnel;
        const failedProgress = nativeError.nativeProgress;
        batch = { ...batch, funnel: { ...failedFunnel,
          sourceEnded: failedProgress
            ? !!failedProgress.directoryRegion?.stopReason
              || failedProgress.pendingSourceEntries.length === 0
              || failedProgress.detailAttempts >= failedFunnel.sourceDetailCap
              || !!failedFunnel.sourceTimeLimitReached
            : failedFunnel.sourceEnded,
        } };
      }
      if (error && typeof error === "object" && "nativeProgress" in error && error.nativeProgress) {
        batch = { ...batch, progress: error.nativeProgress as typeof batch.progress };
      }
      if (error && typeof error === "object" && "nativeAccepted" in error) {
        const accepted = error.nativeAccepted as Array<{candidate: RestaurantCandidate; evidence: RestaurantReadEvidence}>;
        batch = {...batch, candidates: accepted.map(item => item.candidate), evidence: accepted.map(item => item.evidence),identities:"nativeIdentities" in error?error.nativeIdentities as SourcePackListingOutlet[]:[]};
      }
      failureCode = error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? restaurantFailureCode(error.code, "SEARCH_FAILED") : restaurantFailureCode(`${source}_NATIVE_DISCOVERY_FAILED`, "SEARCH_FAILED");
    }
    if (restaurantReserveCancelled(signal)) {
      failureCode = 'DELIVERY_RESERVE_REACHED';
      batch.funnel = {...batch.funnel,sourceEnded:false,sourceExhausted:'UNKNOWN'};
      // A completed reference read is also source evidence, never a guessed outlet.
      const reference = discoveryPlan.regionReferenceRead?.read;
      if (reference) {
        batch.candidates = [...new Map([...batch.candidates,...reference.candidates].map(c=>[c.restaurant.id,c])).values()];
        batch.evidence = [...new Map([...batch.evidence,...reference.evidence].map(e=>[e.evidenceId,e])).values()];
      }
    }
    const sourceEnded = batch.funnel.sourceEnded;
    const nextPlan = advanceDiscoveryPlan(discoveryPlan, sourceEnded);
    const result:RestaurantSearchRead = {
      candidates: batch.candidates,
      evidence: [...(localityEvidence ? [localityEvidence] : []), ...batch.evidence],
      continuation: {
        intentFingerprint: restaurantSearchIntentFingerprint(request.intent),
        discoveryPlan: nextPlan,
        deferredSources,
        currentDiscoveryBatch: {
          sourceId: entry.sourceId,
          candidateIds: batch.candidates.map((candidate) => candidate.restaurant.id),
        },
        usedPageTokens: [], pagesRead: (request.continuation?.pagesRead ?? 0) + batch.funnel.pagesRead,
        exhausted: sourceEnded && currentDiscoveryPlanEntry(nextPlan) === undefined,
        sourceProgress: batch.progress,
        ...(failureCode ? { lastFailureCode: failureCode } : {}),
        locationContext: location,
      },
      metadata: { provider: pack!.browser!.provider, route: this.executionRoute, latencyMs: Date.now() - startedAt,
        nativeDiscoveryFunnel: batch.funnel,
        ...(failureCode ? { failureCode } : {}),
        ...(restaurantReserveCancelled(signal) ? {reserveReached:{reason:'DELIVERY_TIME' as const,completedCandidateIds:batch.candidates.map(c=>c.restaurant.id)}} : {}),
        ...(batch.candidateFailures.length ? { candidateFailures: batch.candidateFailures, failureScope: "CANDIDATE" as const } : {}),
        googleRequests: this.locality.googleRequestUsage(request.readRunId),
      },
    };
    const next=currentDiscoveryPlanEntry(nextPlan),structured=this.packs.find(p=>p.meta.id===next?.sourceId);
    if(request.intent.target?.selectionScope!=="SPECIFIC_OUTLET"&&next&&structured&&!structured.browser&&!signal.aborted){
      try{
        const extra=await this.search({...request,continuation:result.continuation!},signal);
        const identityEvidence=verifiedDiscoveryIdentities(pack!,[...result.candidates,...extra.candidates],batch.identities,result.evidence);
        const combinedEvidence=[...result.evidence,...extra.evidence,...identityEvidence];
        const merged=mergeDiscoveryCandidates(result.candidates,extra.candidates,combinedEvidence);
        return {...result,candidates:merged.candidates,evidence:combinedEvidence.map(e=>({...e,...(e.candidateId&&merged.aliases.has(e.candidateId)?{candidateId:merged.aliases.get(e.candidateId)!,claims:{...e.claims,mergedCandidateId:e.candidateId}}:{})})),
          ...(extra.continuation?{continuation:{...extra.continuation,...(extra.continuation.currentDiscoveryBatch?{currentDiscoveryBatch:{...extra.continuation.currentDiscoveryBatch,candidateIds:extra.continuation.currentDiscoveryBatch.candidateIds.filter(id=>!merged.aliases.has(id))}}:{})}}:{}),metadata:{...result.metadata,latencyMs:Date.now()-startedAt,googleRequests:this.locality.googleRequestUsage(request.readRunId),supplementaryDiscovery:{sourceId:next.sourceId,status:"COMPLETED",candidateCount:extra.candidates.length}}};
      }catch(error){
        if(taskLevelFailure(error,signal))throw error;
        return {...result,continuation:{...result.continuation!,discoveryPlan:advanceDiscoveryPlan(nextPlan,true)},metadata:{...result.metadata,googleRequests:this.locality.googleRequestUsage(request.readRunId),supplementaryDiscovery:{sourceId:next.sourceId,status:"INCOMPLETE",candidateCount:0,reason:restaurantFailureCode(error&&typeof error==="object"&&"code" in error?String(error.code):"SEARCH_FAILED","SEARCH_FAILED")}}};
      }
    }
    return result;
  }

  private async searchGooglePack(
    request: RestaurantSearchRequest,
    signal: AbortSignal,
    plan: DiscoveryPlan,
    sourceId: string,
    retrievalHint: string,
    location: Location,
  ): Promise<RestaurantSearchRead> {
    const startedAt = Date.now();
    const continuation = request.continuation?.sourceProgress?.sourceId === sourceId
      ? {
        intentFingerprint: restaurantSearchIntentFingerprint(request.intent),
        usedPageTokens: request.continuation.usedPageTokens,
        pagesRead: request.continuation.pagesRead,
        exhausted: false,
        ...(request.continuation.nextPageToken ? { nextPageToken: request.continuation.nextPageToken } : {}),
        ...(request.continuation.sourceRequestContext ? { sourceRequestContext: request.continuation.sourceRequestContext } : {}),
        locationContext: location,
      }
      : undefined;
    // A plan cursor is not a Google page cursor.  Forward a continuation only
    // when this pack itself produced it; otherwise Google would correctly see
    // an exhausted, tokenless foreign cursor and skip its first provider read.
    const { continuation: _priorContinuation, ...freshRequest } = request;
    const saved = plan.regionReferenceRead;
    if (saved && (saved.sourceId !== sourceId || saved.readRunId !== request.readRunId)) {
      throw Object.assign(Error('Saved source read belongs to a different source or run'), {code: 'GOOGLE_MALFORMED_RESPONSE'});
    }
    const read: RestaurantSearchRead = plan.textRetrieval?.accepted === false
      ? {candidates:[], evidence:[], continuation:{intentFingerprint:restaurantSearchIntentFingerprint(request.intent),usedPageTokens:continuation?.usedPageTokens??[],pagesRead:continuation?.pagesRead??0,exhausted:true,lastFailureCode:'DISCOVERY_SOURCE_INCOMPLETE'},
        metadata:{provider:'GOOGLE_PLACES',route:'STRUCTURED_ADAPTER',latencyMs:0,failureCode:'DISCOVERY_SOURCE_INCOMPLETE'}}
      : saved ? saved.read : await this.locality.search({ ...freshRequest, retrievalHint, discoveryQuery: plan.entries[plan.cursor]!.query, ...(continuation ? { continuation } : {}) }, signal);
    delete plan.regionReferenceRead;
    if (!read.continuation) throw Object.assign(new Error("Google discovery did not return a bounded cursor"), { code: "GOOGLE_MALFORMED_RESPONSE" });
    const googleContinuation = read.continuation;
    const sourceEnded = googleContinuation.exhausted;
    const nextPlan = advanceDiscoveryPlan(plan, sourceEnded);
    const candidates = read.candidates.map((candidate) => ({
      ...candidate,
      restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, discoverySourceId: sourceId } },
    }));
    return {
      ...read,
      candidates,
      metadata: {...read.metadata, latencyMs: Date.now() - startedAt, googleRequests: this.locality.googleRequestUsage(request.readRunId)},
      continuation: {
        ...googleContinuation,
        discoveryPlan: nextPlan,
        currentDiscoveryBatch: { sourceId, candidateIds: candidates.map((candidate) => candidate.restaurant.id) },
        exhausted: sourceEnded && currentDiscoveryPlanEntry(nextPlan) === undefined,
        ...(!sourceEnded ? { sourceProgress: { sourceId, inspectedSourceIds: [], detailAttempts: 0, pagesRead: googleContinuation.pagesRead, pendingSourceIds: [] } } : {}),
        locationContext: location,
      },
    };
  }
}
