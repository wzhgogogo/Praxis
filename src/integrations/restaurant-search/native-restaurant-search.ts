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
import { restaurantDiscoveryPacks, type DiscoverySourcePack } from "./source-packs.js";

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

export function sourceListingCompletion(pack: DiscoverySourcePack, current: BrowserSnapshot, _controls: readonly BrowserPageControl[], _expression: string) {
  const listing = pack.parseListing(current), empty = pack.browser!.isExplicitEmptyListing(current);
  return { complete: listing.outlets.length > 0 || empty, resultBusy: pack.browser!.resultBusy(current),
    reason: "Read stable source-owned public results; the observation model confirms their relevance.",
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
        sourceIds: input.source.browser!.candidateSourceIds(input.sourceId, input.sourceUrl),
        provenance: { outletName: evidenceId, address: evidenceId, sourceIds: evidenceId },
      },
      matchReasons: [`Source coordinates within ${input.location.radiusMeters} m of ${input.location.label}`],
      warnings: [], executionConfidence: "MEDIUM",
    },
    evidence,
  };
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
    candidates: RestaurantCandidate[]; evidence: RestaurantReadEvidence[];
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
    const rejected: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const candidateFailures: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const listings: NonNullable<NonNullable<RestaurantSearchRead["metadata"]["nativeDiscoveryFunnel"]>["listingObservations"]> = [];
    const visited = [...(previous?.visitedListingUrls ?? [])];
    const retrieval = structuredClone(previous?.retrieval ?? { rewrites: 0, regionPages: 0, retrievalPages: 0, history: [] });
    let pages = 0, detailAttempts = 0, raw = 0, parsed = 0, locatedListing = false;
    let nextNavigation: { detail: boolean; url?: string } | undefined;
    let stopped = false;
    const elapsed = () => elapsedBefore + Date.now() - startedAt;
    const sourceEnded = () => stopped && ![...known.values()].some(entry => !inspected.has(entry.sourceEntityId))
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
      sourceExhausted: "UNKNOWN", batchEnded: true, sourceEnded: sourceEnded(),
      progressionReason: source === "DIRECTORY" ? "FIRST_SOURCE_BATCH" : "FIRST_SOURCE_BATCH_ENDED", listingObservations: listings, retrieval,
    });
    const decision: BrowserReadActionDecisionPort | undefined = this.discoveryDecision ? {
      decide: async input => {
        const action = await this.discoveryDecision!.decide(input);
        nextNavigation = undefined;
        if (action.type === "OPEN_LINK") {
          const target = input.observation.targets.find(target => target.ref === action.targetRef);
          if (target?.href) nextNavigation = { url: target.href, detail: known.has(target.href) };
        }
        if (action.type === "CLICK") {
          const target = input.observation.targets.find(target => target.ref === action.targetRef);
          if (target?.formObservation && target.formMethod === "GET") nextNavigation = { detail: false };
        }
        return action;
      },
      takeLastWireRecord: () => this.discoveryDecision!.takeLastWireRecord?.(),
    } : undefined;
    const executor = new BrowserTaskExecutor(this.runtime, {
      ...this.discoveryLimits, maxElapsedMsPerCandidate: Math.max(1, Math.min(this.discoveryLimits.maxElapsedMsPerCandidate ?? Infinity, NATIVE_SOURCE_ELAPSED_CAP_MS - elapsedBefore)),
      ...(decision ? { modelDecision: decision } : {}), ...(this.browserBudget ? { budget: this.browserBudget } : {}),
      onDiagnostic: diagnostic => {
        if (diagnostic.event === "OPERATION_STARTED" && ["NAVIGATE", "OPEN_LINK", "SUBMIT_PUBLIC_QUERY"].includes(diagnostic.detail ?? "")) {
          if (nextNavigation?.detail) {
            if (detailAttempts >= NATIVE_DETAIL_BATCH_CAP || (previous?.detailAttempts ?? 0) + detailAttempts >= NATIVE_DETAIL_SOURCE_CAP) {
              throw Object.assign(Error("Detail read ceiling reached"), { code: "READ_BUDGET_EXCEEDED" });
            }
            detailAttempts++;
          } else {
            if ((previous?.pagesRead ?? 0) + pages >= NATIVE_LISTING_PAGE_CAP[source]
              || (locatedListing ? retrieval.retrievalPages >= 3 : retrieval.regionPages >= 4)) {
              throw Object.assign(Error("Source page ceiling reached"), { code: "READ_BUDGET_EXCEEDED" });
            }
            pages++; if (locatedListing) retrieval.retrievalPages++; else retrieval.regionPages++;
          }
        }
        this.onBrowserDiagnostic?.(diagnostic);
      },
    });
    executor.beginCandidate(`native-discovery:${source}`); executor.beginProvider(`native-discovery:${source}`, source, "DISCOVERY");
    let session: BrowserSession | undefined;
    try {
      if (elapsedBefore >= NATIVE_SOURCE_ELAPSED_CAP_MS || (previous?.detailAttempts ?? 0) >= NATIVE_DETAIL_SOURCE_CAP || (previous?.pagesRead ?? 0) >= NATIVE_LISTING_PAGE_CAP[source]) throw Object.assign(Error("Source read ceiling already reached"), {code:"READ_BUDGET_EXCEEDED"});
      if (!pack.browser?.startupUrl) throw Object.assign(Error("Source has no configured public start"), { code: "DISCOVERY_SOURCE_INCOMPLETE" });
      session = await executor.acquire(signal, source, "DISCOVERY", this.networkPolicy);
      await executor.start({ source, stage: "DISCOVERY", signal, session, allowedOrigins: pack.documentOrigins, url: pack.browser.startupUrl });
      const expression = query.keyword;
      const criterion = expression && request.intent.criteria.find(criterion => criterion.polarity === "POSITIVE" && criterion.strength === "HARD" && criterion.text.includes(expression));
      if (expression && !criterion) throw Object.assign(Error("Retrieval lacks a literal authoritative criterion"), { code: "DISCOVERY_SOURCE_INCOMPLETE" });
      const result = await executor.runSkill({ taskId: request.readRunId ?? `native-discovery:${source}`, source, stage: "DISCOVERY", signal, session,
        allowedOrigins: pack.documentOrigins, ...(pack.skillPath ? { sourceSkillPath: pack.skillPath } : {}),
        goal: { outlet: { name: request.intent.target?.query ?? "" }, location: { ...location, name: location.label },
          ...(expression ? { retrievalExpression: expression, retrievalSource: "CUISINE" as const } : {}),
          hardCriteria: request.intent.criteria.filter(criterion => criterion.polarity === "POSITIVE" && criterion.strength === "HARD").map(criterion => criterion.text) },
        objective: "Find restaurants for the authoritative request using only the current observed public controls and links. Read merchant identities and addresses. All results still require exact coordinate and source verification. Choose every next step from this page; do not invent URLs or an action sequence.",
        completion: page => {
          if (pack.browser!.hasChallenge(page) || pack.browser!.isPageUnavailable(page)) return { complete: false, reason: "Source is not readable; no inventory conclusion is possible." };
          const listing = pack.parseListing(page);
          raw = Math.max(raw, rawSourceLinks(page, pack)); parsed = Math.max(parsed, listing.outlets.length);
          if (listing.outlets.length) {
            if (!visited.includes(page.url)) {
              visited.push(page.url); listings.push({ sourceUrl: page.url, parsedOutlets: listing.outlets.length, ...(listing.nextPage ? { nextPageUrl: listing.nextPage } : {}) });
            }
            // This literal page text is a result check, never a link selector.
            locatedListing ||= normalized(page.text).includes(normalized(location.label));
            for (const outlet of listing.outlets) known.set(outlet.sourceUrl, pendingEntry(outlet.sourceEntityId, outlet.sourceUrl, this.now(), outlet));
          }
          const entry = known.get(page.url);
          if (entry && !attempted.has(page.url)) {
            attempted.add(page.url); inspected.add(entry.sourceEntityId);
            const identity = pack.browser!.parseDetailIdentity(page, { ...entry, outletName: entry.outletName ?? entry.sourceEntityId });
            const coordinates = identity && pageCoordinates(page, identity.outletName);
            if (!identity || !coordinates) rejected.push({ sourceUrl: page.url, reasonCode: identity ? "PAGE_COORDINATES_MISSING" : "PAGE_IDENTITY_MISSING" });
            else {
              const grounded = groundedNativeCandidate({ source: pack, sourceId: identity.sourceEntityId, sourceUrl: identity.sourceUrl,
                name: identity.outletName, address: identity.address!, coordinates, location, request, observedAt: this.now(),
                ...(entry.sourceCategories ? { sourceCategories: entry.sourceCategories } : {}) });
              if (grounded) admitted.set(grounded.candidate.restaurant.id, grounded);
              else rejected.push({ sourceUrl: page.url, reasonCode: "OUTSIDE_RADIUS" });
            }
          }
          const complete = admitted.size >= Math.min(NATIVE_DETAIL_BATCH_CAP, NATIVE_DETAIL_SOURCE_CAP - (previous?.detailAttempts ?? 0));
          return { complete, resultBusy: pack.browser!.resultBusy(page), resultKey: JSON.stringify([...admitted.keys()]),
            reason: `Source verified ${admitted.size} restaurants. Already inspected: ${JSON.stringify([...inspected])}. Rejected source pages: ${JSON.stringify(rejected)}. Continue from current observed links/controls within the remaining source limits, or request help if no supported path exists.` };
        },
      });
      stopped = result.status !== "COMPLETED";
      return { candidates: [...admitted.values()].map(item => item.candidate), evidence: [...admitted.values()].map(item => item.evidence), candidateFailures, progress: progress(), funnel: funnel() };
    } catch (error) {
      if (error && typeof error === "object") Object.assign(error, { nativeAccepted: [...admitted.values()], nativeProgress: progress(), nativeFunnel: funnel() });
      throw error;
    } finally { await executor.close(); }
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
    let batch: Awaited<ReturnType<NativeRestaurantSearch["batch"]>> = { candidates: [], evidence: [], candidateFailures: [],
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
        batch = {...batch, candidates: accepted.map(item => item.candidate), evidence: accepted.map(item => item.evidence)};
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
    return {
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
