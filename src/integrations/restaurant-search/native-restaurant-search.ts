import { createHash } from "node:crypto";

import type { RestaurantSearchPort } from "../../application/restaurant-execution-router.js";
import { restaurantSearchIntentFingerprint, type RestaurantCandidate, type RestaurantReadEvidence, type RestaurantSearchRead, type RestaurantSearchRequest } from "../../domains/restaurant/contracts.js";
import { advanceDiscoveryPlan, currentDiscoveryPlanEntry, planDiscoverySources, type DiscoveryPlan, type DiscoveryQuery } from "../../domains/restaurant/discovery-planner.js";
import { googleDiscoveryGeoDiagnostics } from "../../domains/restaurant/read-grounding.js";
import type { BrowserPageControl, BrowserReadNetworkPolicy, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserExecutionBudget, BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { GooglePlacesRestaurantSearch } from "../google/google-places-restaurant-search.js";
import { restaurantDiscoveryPacks, type DiscoverySourcePack } from "./source-packs.js";

type Location = NonNullable<NonNullable<RestaurantSearchRequest["continuation"]>["locationContext"]>;
type SourceFlow = "DIRECTORY" | "VENUE_SEARCH";
type NativeSourceProgress = NonNullable<RestaurantSearchRequest["continuation"]>["sourceProgress"] extends infer Progress
  ? NonNullable<Progress> : never;
type PendingSourceEntry = NonNullable<NativeSourceProgress["pendingSourceEntries"]>[number];
/** One read chunk.  It is not a statement that the source has been exhausted. */
const NATIVE_DETAIL_BATCH_CAP = 5;
/** Keep the second source and final presentation within the existing run budget. */
const NATIVE_DETAIL_SOURCE_CAP = 10;
/** A chunk reopens the source list only to recover its persisted observed entrance set. */
const NATIVE_LISTING_PAGE_CHUNK_CAP: Record<SourceFlow, number> = { DIRECTORY: 3, VENUE_SEARCH: 1 };
const NATIVE_LISTING_PAGE_CAP: Record<SourceFlow, number> = {
  DIRECTORY: NATIVE_LISTING_PAGE_CHUNK_CAP.DIRECTORY * Math.ceil(NATIVE_DETAIL_SOURCE_CAP / NATIVE_DETAIL_BATCH_CAP),
  VENUE_SEARCH: NATIVE_LISTING_PAGE_CHUNK_CAP.VENUE_SEARCH * Math.ceil(NATIVE_DETAIL_SOURCE_CAP / NATIVE_DETAIL_BATCH_CAP),
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

function areaLabel(value: string): string {
  return value.replace(/\b(?:near|nearby)\b|附近|周辺|周边/giu, " ").replace(/^[\s,，]+|[\s,，]+$/gu, "").trim();
}

/**
 * A nonempty card list may belong to a preceding query while the current
 * search is still loading. Only an observed public search input can bind that
 * intermediate page to the retrieval expression; its absence stays neutral.
 */
function publicDiscoverySearchInput(page: BrowserSnapshot): string | undefined {
  return page.html.match(/<input\b[^>]*(?:name|aria-label|placeholder)=["'][^"']*(?:search|keyword|venue|restaurant)[^"']*["'][^>]*>/i)?.[0];
}

/** A source-visible busy marker, excluding script/style and hidden shells, keeps old cards from becoming a current result. */
function visibleDiscoveryQueryBusy(page: BrowserSnapshot): boolean {
  const rendered = page.html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi, "");
  return [...rendered.matchAll(/<([a-z][\w-]*)([^>]*)>/gi)].some((match) => {
    const attributes = match[2] ?? "";
    const hidden = /\bhidden\b|aria-hidden=["']true["']|\bis-hidden\b|display\s*:\s*none|visibility\s*:\s*hidden/i.test(attributes);
    return !hidden && /aria-busy=["']true["']|data-(?:query|search|result)-(?:state|status)=["']loading["']/i.test(attributes);
  });
}

function discoveryQueryNeedsCurrentQuery(page: BrowserSnapshot, expression: string, controls: readonly BrowserPageControl[] = []): boolean {
  const liveSearch = controls.find((control) => control.kind === "INPUT" && control.visible
    && /(?:search|keyword|venue|restaurant|店名|検索)/i.test(`${control.label} ${control.structure?.name ?? ""}`));
  // DOM properties are authoritative over serialized markup: after a fill,
  // Chromium can retain the old value attribute while the observed input value
  // already represents the current public query.
  if (liveSearch) return liveSearch.value?.trim() !== expression || visibleDiscoveryQueryBusy(page);
  const input = publicDiscoverySearchInput(page);
  if (!input) return false;
  const value = input.match(/\bvalue=["']([^"']*)["']/i)?.[1]?.trim();
  return value !== expression || visibleDiscoveryQueryBusy(page);
}

function pendingEntry(
  sourceEntityId: string,
  sourceUrl: string,
  observedAt: string,
  fields: { outletName?: string; address?: string; phone?: string } = {},
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
      outletName: input.name, address: input.address, areaQuery: input.request.intent.area.query,
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
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly evaluationLocation?: { latitude: number; longitude: number; radiusMeters: number; label: string },
    private readonly discoveryDecision?: BrowserReadActionDecisionPort,
    private readonly browserBudget?: BrowserExecutionBudget,
    private readonly onBrowserDiagnostic?: (diagnostic: BrowserExecutionDiagnostic) => void,
    private readonly discoveryLimits?: { maxOperationsPerCandidate?: number },
    /** Actual compositions provide the source-owned isolated read policy. */
    private readonly networkPolicy?: BrowserReadNetworkPolicy,
    private readonly packs: readonly DiscoverySourcePack[] = restaurantDiscoveryPacks,
  ) {}

  googleRequestUsage(readRunId: string | undefined) { return this.locality.googleRequestUsage(readRunId); }

  private async location(request: RestaurantSearchRequest, signal: AbortSignal): Promise<{ location: Location; localityEvidence?: RestaurantReadEvidence }> {
    const area = request.intent.area;
    if (area.coordinates) return { location: {
      latitude: area.coordinates.latitude, longitude: area.coordinates.longitude,
      radiusMeters: area.radiusMeters ?? 3_000, label: area.query, areaMatchBasis: "TASK_LOCATION_RADIUS",
    } };
    if (request.continuation?.locationContext) return { location: request.continuation.locationContext };
    const named = await this.locality.resolveNamedNearbyLocation(request, signal);
    if (named.location) return { location: named.location, ...(named.evidence ? { localityEvidence: named.evidence } : {}) };
    if (area.query.trim().toLocaleLowerCase("en-US") === "nearby" && this.evaluationLocation) return { location: {
      ...this.evaluationLocation, label: this.evaluationLocation.label, areaMatchBasis: "EVALUATION_LOCATION_RADIUS",
    } };
    throw Object.assign(new Error("Native search requires an observed coordinate context for exact geography"), { code: "NATIVE_LOCATION_UNRESOLVED" });
  }

  private async batch(
    pack: DiscoverySourcePack,
    source: SourceFlow,
    request: RestaurantSearchRequest,
    location: Location,
    query: DiscoveryQuery,
    signal: AbortSignal,
    priorProgress?: NonNullable<RestaurantSearchRequest["continuation"]>["sourceProgress"],
  ) {
    const sourceSkillPath = pack.skillPath;
    let session: BrowserSession | undefined;
    const batchStartedAt = Date.now();
    // Native discovery uses the same bounded Executor operations as the
    // availability adapters. Discovery decisions share their origin,
    // deadline and operation accounting instead of a separate browser loop.
    const admitted = new Map<string, { candidate: RestaurantCandidate; evidence: RestaurantReadEvidence }>();
    const candidateFailures: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const rejected: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const deferredByBatchCap: Array<{ sourceUrl: string; reasonCode: "DETAIL_BATCH_CAP" }> = [];
    const priorInspected = new Set(priorProgress?.sourceId === pack.meta.id ? priorProgress.inspectedSourceIds : []);
    const sourceDetailAttemptsBefore = priorProgress?.sourceId === pack.meta.id ? priorProgress.detailAttempts : 0;
    const sourcePagesBefore = priorProgress?.sourceId === pack.meta.id ? priorProgress.pagesRead : 0;
    const sourceElapsedBefore = priorProgress?.sourceId === pack.meta.id ? priorProgress.elapsedMs ?? 0 : 0;
    const sourceElapsedRemaining = Math.max(0, NATIVE_SOURCE_ELAPSED_CAP_MS - sourceElapsedBefore);
    const retainedEntries = retainedPendingEntries(pack, priorProgress);
    let nextListing = priorProgress?.sourceId === pack.meta.id ? priorProgress.nextListing : undefined;
    const visitedListingUrls = priorProgress?.sourceId === pack.meta.id ? [...(priorProgress.visitedListingUrls ?? [])] : [];
    const listingObservations: Array<{ sourceUrl: string; parsedOutlets: number; resultCount?: number; nextPageUrl?: string }> = [];
    let queryAdjustment: string | undefined;
    let attemptingDetailSourceId: string | undefined;
    let detailNavigationStarted = false;
    const executor = new BrowserTaskExecutor(this.runtime, {
      maxElapsedMsPerCandidate: Math.max(1, sourceElapsedRemaining),
      ...(this.discoveryLimits?.maxOperationsPerCandidate !== undefined
        ? { maxOperationsPerCandidate: this.discoveryLimits.maxOperationsPerCandidate }
        : {}),
      ...(this.discoveryDecision ? { modelDecision: this.discoveryDecision } : {}),
      ...(this.browserBudget ? { budget: this.browserBudget } : {}),
      onDiagnostic: (diagnostic) => {
        // `operation` emits this only after its budget/deadline admission and
        // immediately before calling the runtime. It is therefore the narrow
        // boundary between a queued detail entrance and an attempted one.
        if (attemptingDetailSourceId && diagnostic.event === "OPERATION_STARTED" && diagnostic.detail === "NAVIGATE") {
          detailNavigationStarted = true;
        }
        this.onBrowserDiagnostic?.(diagnostic);
      },
    });
    executor.beginCandidate(`native-discovery:${source}`);
    const allowedOrigins = pack.documentOrigins;
    executor.beginProvider(`native-discovery:${source}`, source, "DISCOVERY");
    const navigate = async (url: string, timeoutMs: number) => executor.navigate({
      source, stage: "DISCOVERY", signal, allowedOrigins, session: session!, url, timeoutMs,
    });
    const snapshot = async () => executor.snapshot({ source, stage: "DISCOVERY", signal, session: session! });
    let inspectedSourceIds = [...priorInspected];
    let pendingSourceEntries: PendingSourceEntry[] = [...retainedEntries];
    let raw = 0;
    let parsed = 0;
    let inspected = 0;
    let batchLimitReached = false;
    let sourceEnded = false;
    let sourceTimeLimitReached = sourceElapsedRemaining === 0;
    let sourceExhausted: boolean | "UNKNOWN" = "UNKNOWN";
    let listingPagesRead = 0;
    const recordListing = (page: BrowserSnapshot) => {
      if (!visitedListingUrls.includes(page.url)) visitedListingUrls.push(page.url);
      const next = pack.parseListing(page).nextPage;
      nextListing = next && !visitedListingUrls.includes(next) ? { sourceUrl: next, observedOn: page.url, observedAt: this.now() } : undefined;
      const count = page.text.match(/\d+\s*[～〜–-]\s*\d+\s*[／/]\s*([\d,]+)/)?.[1];
      listingObservations.push({ sourceUrl: page.url, parsedOutlets: pack.parseListing(page).outlets.length,
        ...(count ? { resultCount: Number(count.replaceAll(",", "")) } : {}),
        ...(nextListing ? { nextPageUrl: nextListing.sourceUrl } : {}) });
    };
    // The cap governs further work; diagnostics must retain the actual elapsed
    // value so a source deadline cannot look like an unfinished healthy batch.
    const sourceElapsedMs = () => sourceElapsedBefore + (Date.now() - batchStartedAt);
    const funnel = (failed = false) => ({ source: pack.browser!.provider, rawSourceLinks: raw, parsedOutlets: parsed, inspectedOutlets: inspected,
      batchCap: NATIVE_DETAIL_BATCH_CAP, sourceDetailCap: NATIVE_DETAIL_SOURCE_CAP,
      sourceDetailAttempts: sourceDetailAttemptsBefore + inspected, deferredByBatchCap, rejected, accepted: admitted.size,
      sourcePageCap: NATIVE_LISTING_PAGE_CAP[source], sourceElapsedCapMs: NATIVE_SOURCE_ELAPSED_CAP_MS,
      sourceElapsedMs: sourceElapsedMs(), sourceTimeLimitReached,
      pagesRead: listingPagesRead, batchLimitReached, sourceExhausted, batchEnded: true, sourceEnded,
      progressionReason: failed ? "SOURCE_FAILURE" as const : source === "DIRECTORY" ? "FIRST_SOURCE_BATCH" as const : "FIRST_SOURCE_BATCH_ENDED" as const,
      listingObservations, ...(queryAdjustment ? { queryAdjustment } : {}) });
    try {
      if (sourceTimeLimitReached) {
        sourceEnded = true;
        return { candidates: [], evidence: [], candidateFailures,
          progress: { sourceId: pack.meta.id, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore,
            pagesRead: sourcePagesBefore, elapsedMs: sourceElapsedBefore, visitedListingUrls,
            ...(nextListing ? { nextListing } : {}),
            pendingSourceEntries: [...new Map(pendingSourceEntries.map((entry) => [entry.sourceEntityId, entry])).values()],
            pendingSourceIds: [...new Set(pendingSourceEntries.map((entry) => entry.sourceEntityId))] },
          funnel: funnel() };
      }
      if (sourcePagesBefore >= NATIVE_LISTING_PAGE_CAP[source] && retainedEntries.length === 0) {
        sourceEnded = true;
        return { candidates: [], evidence: [], candidateFailures,
          progress: { sourceId: pack.meta.id, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore,
            pagesRead: sourcePagesBefore, elapsedMs: sourceElapsedBefore, visitedListingUrls, pendingSourceEntries: [], pendingSourceIds: [] },
          funnel: funnel() };
      }
      // Session acquisition is source work.  Keeping it in the existing
      // Executor makes the source's remaining deadline apply before the
      // first listing navigation and to a replacement session alike.
      session = await executor.acquire(signal, source, "DISCOVERY", this.networkPolicy);
      if (source === "DIRECTORY") {
        const directory = pack.browser!.directory!;
        const retainedOutlets = retainedEntries.map((entry) => ({
          sourceEntityId: entry.sourceEntityId,
          sourceUrl: entry.sourceUrl,
          outletName: entry.outletName ?? entry.sourceEntityId,
          ...(entry.address ? { address: entry.address } : {}),
          ...(entry.phone ? { phone: entry.phone } : {}),
        }));
        let page: BrowserSnapshot | undefined;
        let observedOutlets: ReturnType<DiscoverySourcePack["parseListing"]>["outlets"] = [];
        // A retained observed entrance is already a source-owned continuation.
        // Reopening a volatile list first can discard it or waste the source
        // budget before its detail page is ever inspected.
        if (retainedEntries.length === 0) {
        // The pack's verified listing contract takes the structured HARD term.
        // An Agent retrieval hint may be a full natural-language request with
        // date, party and place prose; it must not replace the source keyword.
        // A pack may use the structured category for source selection, but only
        // a positive HARD term is safe to project into a public text field.
        const keyword = query.keyword ?? "";
        const continuingListing = nextListing;
        const url = new URL(continuingListing?.sourceUrl ?? pack.buildQuery(query).url);
        if (continuingListing && (!pack.browser!.acceptsDetailUrl(url.href) || directory.listingRoot(url.href) !== directory.listingRoot(continuingListing.observedOn))) {
          throw Object.assign(new Error("Invalid observed listing continuation"), { code: "NATIVE_LISTING_CONTINUATION_INVALID" });
        }
        const listingUrl = continuingListing ? url.toString() : keyword ? directory.withRetrievalExpression(url.toString(), keyword) : url.toString();
        const activeExpression = continuingListing ? directory.retrievalExpression(listingUrl) ?? "" : keyword;
        await navigate(listingUrl, 35_000);
        page = await snapshot();
        listingPagesRead += 1;
        recordListing(page);
        raw = rawSourceLinks(page, pack);
        if (pack.browser!.hasChallenge(page)) throw Object.assign(new Error("Discovery source challenge"), { code: "DISCOVERY_SOURCE_BOT_CHALLENGE" });
        const label = areaLabel(query.location.label);
        for (let level = 0; !continuingListing && level < NATIVE_LISTING_PAGE_CHUNK_CAP.DIRECTORY - 1; level += 1) {
          const region = directory.observedRegion(page, label);
          if (!region) break;
          // Area navigation is source-owned, but an observed region link may
          // omit the active text query. Preserve the authoritative retrieval
          // term rather than silently changing the result set mid-search.
          const regionUrl = new URL(region);
          regionUrl.hash = "";
          const regionWithExpression = directory.retrievalExpression(regionUrl.toString()) || !keyword ? regionUrl.toString()
            : directory.withRetrievalExpression(regionUrl.toString(), keyword);
          const currentUrl = new URL(page.url);
          currentUrl.hash = "";
          if (regionWithExpression === currentUrl.href) break;
          await navigate(regionWithExpression, 25_000);
          page = await snapshot();
          listingPagesRead += 1;
          recordListing(page);
          raw = rawSourceLinks(page, pack);
          if (pack.browser!.hasChallenge(page)) throw Object.assign(new Error("Discovery source challenge"), { code: "DISCOVERY_SOURCE_BOT_CHALLENGE" });
          if (normalized(page.url).includes(normalized(label)) && pack.parseListing(page).outlets.length) break;
        }
        const listingComplete = (current: BrowserSnapshot, controls: readonly BrowserPageControl[] = []) => !discoveryQueryNeedsCurrentQuery(current, activeExpression, controls)
          && (pack.parseListing(current).outlets.length > 0 || directory.isExplicitEmpty(current));
        observedOutlets = pack.parseListing(page).outlets;
        // An explicit empty result is current only after the same observed
        // input/busy check.  Otherwise an old empty or card list can silently
        // end discovery before the bounded public retrieval is attempted.
        if (publicDiscoverySearchInput(page) || !listingComplete(page)) {
          const discovery = await executor.runSkill({
            taskId: `browser-read:native-discovery:${source}`,
            source,
            ...(sourceSkillPath ? { sourceSkillPath } : {}),
            stage: "DISCOVERY",
            session: session!,
            signal,
            allowedOrigins,
            // A source-owned isolated read boundary may safely expose an
            // observed, non-sensitive query button. The executor still keeps
            // Router-bound fields and current opaque references authoritative.
            goal: { outlet: { name: keyword, address: request.intent.area.query }, retrievalExpression: activeExpression, hardCriteria: request.intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text) },
            objective: "Apply the current source search and reveal its public restaurant results for the authoritative area and retrieval terms. Do not submit a reservation.",
            methodReason: "The current source listing has not yet produced a parsed public restaurant result or an explicit empty result.",
            completion: (current, controls) => ({ complete: listingComplete(current, controls), reason: "Reveal a current public restaurant result list or wait for an explicit empty listing state." }),
          });
          page = discovery.snapshot;
          if (discovery.status !== "COMPLETED" || !listingComplete(page, discovery.controls)) {
            throw Object.assign(new Error("Current public directory results were not observed"), { code: "DISCOVERY_SOURCE_INCOMPLETE" });
          }
          recordListing(page);
          observedOutlets = pack.parseListing(page).outlets;
        }
        // A source keyword is a retrieval expression, not the HARD fact gate.
        // When that list is sparse, use one observed category route to widen
        // discovery. The model selects the category; no cuisine mapping is coded.
        const categoryEntrance = directory.links(page).some((link) => link.category || /js-leftnavi-genre-anchor/.test(link.attributes));
        if (!continuingListing && keyword && observedOutlets.length < NATIVE_DETAIL_BATCH_CAP && !nextListing && categoryEntrance && this.discoveryDecision) {
          const initialPage = page;
          const initialRoot = directory.listingRoot(page.url)!;
          let lastUrl = page.url;
          pendingSourceEntries = observedOutlets.map((outlet) => pendingEntry(outlet.sourceEntityId, outlet.sourceUrl, this.now(), { outletName: outlet.outletName }));
          const adjusted = await executor.runSkill({
            taskId: `browser-read:native-discovery:${source}`, source, ...(sourceSkillPath ? { sourceSkillPath } : {}), stage: "DISCOVERY", session: session!, signal, allowedOrigins,
            goal: { outlet: { name: keyword, address: request.intent.area.query }, hardCriteria: request.intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text) },
            objective: "The keyword list is sparse. Use an observed related category for broader restaurant discovery in the same area. Open Search by category if needed, choose the most relevant category, and remove the keyword using the site's own filter-removal link. This changes retrieval only: every candidate still needs separate HARD fact verification. Do not change area, dates or party size, or open restaurant details yet.",
            methodReason: "A short keyword result list does not establish source coverage. Follow one relevant source category and remove the old keyword filter.",
            completion: (current) => {
              if (current.url !== lastUrl) { listingPagesRead += 1; lastUrl = current.url; recordListing(current); }
              const currentUrl = new URL(current.url);
              const suffix = currentUrl.pathname.slice(initialRoot.length);
              const complete = directory.listingRoot(current.url) === initialRoot && /^\D[^/]*\/$/.test(suffix)
                && directory.retrievalExpression(current.url) === undefined && !visibleDiscoveryQueryBusy(current) && pack.parseListing(current).outlets.length > 0;
              if (!complete && sourcePagesBefore + listingPagesRead >= NATIVE_LISTING_PAGE_CAP.DIRECTORY) {
                throw Object.assign(new Error("Native listing page ceiling reached"), { code: "NATIVE_LISTING_PAGE_LIMIT" });
              }
              return { complete, reason: "Observe a current related-category result list in the same area with the old keyword removed." };
            },
          });
          queryAdjustment = adjusted.status;
          page = adjusted.status === "COMPLETED" ? adjusted.snapshot : initialPage;
          observedOutlets = [...new Map([...observedOutlets, ...pack.parseListing(page).outlets].map((outlet) => [outlet.sourceEntityId, outlet])).values()];
          recordListing(page);
        }
        }
        // Keep an observed detail entrance ahead of a newly rendered list. A
        // reordered list is not evidence that the earlier entrance vanished.
        const outlets = [...new Map([...retainedOutlets, ...observedOutlets].map((outlet) => [outlet.sourceEntityId, outlet])).values()];
        raw = page ? rawSourceLinks(page, pack) : 0;
        parsed = outlets.length;
        const remainingDetailBudget = Math.max(0, NATIVE_DETAIL_SOURCE_CAP - sourceDetailAttemptsBefore);
        const unseenOutlets = outlets.filter((outlet) => !priorInspected.has(outlet.sourceEntityId));
        const chunk = unseenOutlets.slice(0, Math.min(NATIVE_DETAIL_BATCH_CAP, remainingDetailBudget));
        const pendingOutlets = unseenOutlets.slice(chunk.length);
        // Keep the selected chunk persisted until each detail attempt actually
        // begins. A timeout/session failure halfway through this loop must not
        // silently discard the unstarted entries selected for this batch.
        pendingSourceEntries = unseenOutlets.map((outlet) => pendingEntry(
          outlet.sourceEntityId, outlet.sourceUrl, this.now(),
          { outletName: outlet.outletName, ...(outlet.address ? { address: outlet.address } : {}), ...(outlet.phone ? { phone: outlet.phone } : {}) },
        ));
        batchLimitReached = pendingOutlets.length > 0 && remainingDetailBudget > chunk.length;
        // This is only a provisional listing observation.  The source may end
        // only after the selected work has actually been attempted, because a
        // replacement-session failure leaves the unstarted part of this chunk
        // as the next continuation.
        sourceEnded = false;
        sourceExhausted = pendingOutlets.length || nextListing ? false : page && !raw && directory.isExplicitEmpty(page) ? true : "UNKNOWN";
        deferredByBatchCap.push(...pendingOutlets.map((outlet) => ({ sourceUrl: outlet.sourceUrl, reasonCode: "DETAIL_BATCH_CAP" as const })));
        for (const outlet of chunk) {
          if (signal.aborted) throw Object.assign(new Error("Native search aborted"), { code: "BROWSER_ABORTED" });
          if (!session) {
            try { session = await executor.acquire(signal, source, "DISCOVERY", this.networkPolicy); }
            catch (error) {
              if (taskLevelFailure(error, signal)) throw error;
              candidateFailures.push({ sourceUrl: outlet.sourceUrl, reasonCode: candidateFailureCode(error, source) });
              rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: "SESSION_OPEN_FAILED" });
              break;
            }
          }
          // Opening a session is not a detail attempt. A rejected executor
          // budget/deadline occurs before `OPERATION_STARTED`, so it also
          // leaves this observed entrance queued for the next continuation.
          attemptingDetailSourceId = outlet.sourceEntityId;
          detailNavigationStarted = false;
          let consumed = false;
          const consumeStartedDetail = () => {
            if (consumed || !detailNavigationStarted) return;
            consumed = true;
            inspected += 1;
            inspectedSourceIds.push(outlet.sourceEntityId);
            pendingSourceEntries = pendingSourceEntries.filter((entry) => entry.sourceEntityId !== outlet.sourceEntityId);
          };
          let detailObserved = false;
          try {
            await navigate(outlet.sourceUrl, 30_000);
            consumeStartedDetail();
            const detail = await snapshot();
            detailObserved = true;
            if (pack.browser!.hasChallenge(detail)) { rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: "BOT_CHALLENGE" }); continue; }
            const extracted = pack.browser!.parseDetailIdentity(detail, outlet);
            const point = extracted && pageCoordinates(detail, extracted.outletName);
            if (!extracted || !point) {
              rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: !point ? "PAGE_COORDINATES_MISSING" : "PAGE_IDENTITY_MISSING" });
              continue;
            }
            const grounded = groundedNativeCandidate({ source: pack, sourceId: extracted.sourceEntityId,
              sourceUrl: extracted.sourceUrl, name: extracted.outletName, address: extracted.address!,
              coordinates: point, location, request, observedAt: this.now() });
            if (grounded) {
              if (admitted.has(grounded.candidate.restaurant.id)) rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: "DUPLICATE_OUTLET" });
              else admitted.set(grounded.candidate.restaurant.id, grounded);
            } else rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: "OUTSIDE_EXACT_RADIUS" });
          } catch (error) {
            consumeStartedDetail();
            if (taskLevelFailure(error, signal)) throw error;
            candidateFailures.push({ sourceUrl: outlet.sourceUrl, reasonCode: candidateFailureCode(error, source) });
            rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: candidateFailureCode(error, source) });
            if (!detailObserved) {
              await executor.close("RUNTIME_FAILURE");
              session = undefined;
            }
          } finally {
            attemptingDetailSourceId = undefined;
          }
        }
      } else {
        let page: BrowserSnapshot | undefined;
        let links = retainedEntries.map((entry) => entry.sourceUrl);
        // As with the directory flow, a persisted public detail entrance is sufficient to
        // continue the same source batch. Do not make it dependent on a fresh,
        // dynamically hydrated search listing.
        if (retainedEntries.length === 0) {
        const url = new URL(pack.buildQuery(query).url);
        const keyword = query.keyword ?? "";
        await navigate(url.toString(), 35_000);
        page = await snapshot();
        listingPagesRead += 1;
        raw = rawSourceLinks(page, pack);
        links = pack.parseListing(page).outlets.map((outlet) => outlet.sourceUrl);
        // A missing search query parameter is not a loading signal. The
        // parser's current page state decides whether the shared skill needs
        // to wait or use an observed public search control.
        const expression = keyword;
        const listingComplete = (current: BrowserSnapshot, controls: readonly BrowserPageControl[] = []) => !discoveryQueryNeedsCurrentQuery(current, expression, controls)
          && (pack.parseListing(current).outlets.length > 0 || pack.browser!.isExplicitEmptyListing(current));
        if ((publicDiscoverySearchInput(page) || !listingComplete(page)) && !pack.browser!.isPageUnavailable(page)) {
          const discovery = await executor.runSkill({
            taskId: `browser-read:native-discovery:${source}`,
            source,
            ...(sourceSkillPath ? { sourceSkillPath } : {}),
            stage: "DISCOVERY",
            session: session!,
            signal,
            allowedOrigins,
            goal: { outlet: { name: expression, address: request.intent.area.query }, retrievalExpression: expression, hardCriteria: request.intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text) },
            objective: "Apply the current public source search and reveal venue result cards for the authoritative area and retrieval terms. Do not submit a reservation.",
            methodReason: "The current source listing has not yet produced a parsed public venue result or an explicit empty result.",
            completion: (current, controls) => ({ complete: listingComplete(current, controls), reason: "Reveal a current public venue result list or wait for an explicit empty listing state." }),
          });
          page = discovery.snapshot;
          if (discovery.status !== "COMPLETED" || !listingComplete(page, discovery.controls)) {
            throw Object.assign(new Error("Current public venue results were not observed"), { code: "DISCOVERY_SOURCE_INCOMPLETE" });
          }
          raw = rawSourceLinks(page, pack);
          links = pack.parseListing(page).outlets.map((outlet) => outlet.sourceUrl);
        }
        }
        links = [...new Map(links.map((link) => [link, link])).values()];
        parsed = links.length;
        if (page && (pack.browser!.hasChallenge(page) || pack.browser!.isPageUnavailable(page))) {
          throw Object.assign(new Error("Discovery search page unavailable"), { code: "DISCOVERY_SOURCE_PAGE_UNAVAILABLE" });
        }
        if (!links.length && (!page || !pack.browser!.isExplicitEmptyListing(page))) {
          throw Object.assign(new Error("Discovery source results were not observed"), { code: "DISCOVERY_SOURCE_INCOMPLETE" });
        }
        raw = page ? rawSourceLinks(page, pack) : 0;
        parsed = links.length;
        const remainingDetailBudget = Math.max(0, NATIVE_DETAIL_SOURCE_CAP - sourceDetailAttemptsBefore);
        const sourceId = (link: string) => pack.browser!.sourceEntityIdForUrl(link) ?? "unknown";
        const unseenLinks = links.filter((link) => !priorInspected.has(sourceId(link)));
        const chunk = unseenLinks.slice(0, Math.min(NATIVE_DETAIL_BATCH_CAP, remainingDetailBudget));
        const pendingLinks = unseenLinks.slice(chunk.length);
        // Persist all unattempted entries, including this chosen chunk, until
        // each detail navigation has actually started.
        pendingSourceEntries = unseenLinks.map((link) => pendingEntry(sourceId(link), link, this.now()));
        batchLimitReached = pendingLinks.length > 0 && remainingDetailBudget > chunk.length;
        // Keep chosen links in the continuation until their detail navigation
        // has actually started; see the parallel directory flow above.
        sourceEnded = false;
        sourceExhausted = pendingLinks.length ? false : page && !raw && pack.browser!.isExplicitEmptyListing(page) ? true : "UNKNOWN";
        deferredByBatchCap.push(...pendingLinks.map((sourceUrl) => ({ sourceUrl, reasonCode: "DETAIL_BATCH_CAP" as const })));
        for (const link of chunk) {
          if (signal.aborted) throw Object.assign(new Error("Native search aborted"), { code: "BROWSER_ABORTED" });
          if (!session) {
            try { session = await executor.acquire(signal, source, "DISCOVERY", this.networkPolicy); }
            catch (error) {
              if (taskLevelFailure(error, signal)) throw error;
              candidateFailures.push({ sourceUrl: link, reasonCode: candidateFailureCode(error, source) });
              rejected.push({ sourceUrl: link, reasonCode: "SESSION_OPEN_FAILED" });
              break;
            }
          }
          const entryId = sourceId(link);
          attemptingDetailSourceId = entryId;
          detailNavigationStarted = false;
          let consumed = false;
          const consumeStartedDetail = () => {
            if (consumed || !detailNavigationStarted) return;
            consumed = true;
            inspected += 1;
            inspectedSourceIds.push(entryId);
            pendingSourceEntries = pendingSourceEntries.filter((entry) => entry.sourceEntityId !== entryId);
          };
          let detailObserved = false;
          try {
            await navigate(link, 30_000);
            consumeStartedDetail();
            const detail = await snapshot();
            detailObserved = true;
            if (pack.browser!.hasChallenge(detail) || pack.browser!.isPageUnavailable(detail)) {
              rejected.push({ sourceUrl: link, reasonCode: pack.browser!.hasChallenge(detail) ? "BOT_CHALLENGE" : "PAGE_UNAVAILABLE" });
              continue;
            }
            const extracted = pack.browser!.parseDetailIdentity(detail, { sourceEntityId: entryId, sourceUrl: link, outletName: entryId });
            const point = extracted && pageCoordinates(detail, extracted.outletName);
            if (!extracted || !point) {
              rejected.push({ sourceUrl: link, reasonCode: !point ? "PAGE_COORDINATES_MISSING" : "PAGE_IDENTITY_MISSING" });
              continue;
            }
            const grounded = groundedNativeCandidate({ source: pack, sourceId: extracted.sourceEntityId,
              sourceUrl: extracted.sourceUrl, name: extracted.outletName, address: extracted.address!,
              coordinates: point, location, request, observedAt: this.now() });
            if (grounded) {
              if (admitted.has(grounded.candidate.restaurant.id)) rejected.push({ sourceUrl: link, reasonCode: "DUPLICATE_OUTLET" });
              else admitted.set(grounded.candidate.restaurant.id, grounded);
            } else rejected.push({ sourceUrl: link, reasonCode: "OUTSIDE_EXACT_RADIUS" });
          } catch (error) {
            consumeStartedDetail();
            if (taskLevelFailure(error, signal)) throw error;
            candidateFailures.push({ sourceUrl: link, reasonCode: candidateFailureCode(error, source) });
            rejected.push({ sourceUrl: link, reasonCode: candidateFailureCode(error, source) });
            if (!detailObserved) {
              await executor.close("RUNTIME_FAILURE");
              session = undefined;
            }
          } finally {
            attemptingDetailSourceId = undefined;
          }
        }
      }
      sourceTimeLimitReached = sourceElapsedMs() >= NATIVE_SOURCE_ELAPSED_CAP_MS;
      // A batch selection is not consumption.  Recompute after the loop so a
      // navigation/session interruption retains all entries it never began.
      sourceEnded = (pendingSourceEntries.length === 0 && (!nextListing || sourcePagesBefore + listingPagesRead >= NATIVE_LISTING_PAGE_CAP[source]))
        || sourceDetailAttemptsBefore + inspected >= NATIVE_DETAIL_SOURCE_CAP
        || sourceTimeLimitReached;
      return { candidates: [...admitted.values()].map((item) => item.candidate), evidence: [...admitted.values()].map((item) => item.evidence), candidateFailures,
        progress: { sourceId: pack.meta.id, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore + inspected,
          pagesRead: (priorProgress?.sourceId === pack.meta.id ? priorProgress.pagesRead : 0) + listingPagesRead,
          elapsedMs: sourceElapsedMs(),
          ...(nextListing ? { nextListing } : {}), visitedListingUrls,
          pendingSourceEntries: [...new Map(pendingSourceEntries.map((entry) => [entry.sourceEntityId, entry])).values()],
          pendingSourceIds: [...new Set(pendingSourceEntries.map((entry) => entry.sourceEntityId))] },
        funnel: funnel() };
    } catch (error) {
      // The Executor races session acquisition against the remaining source
      // window.  At a one-millisecond boundary its timeout can fire before a
      // wall-clock sample ticks over, but it is still the source deadline and
      // must retain the queue as such rather than look like a generic failure.
      const sourceDeadlineExceeded = error !== null && typeof error === "object" && "code" in error && error.code === "BROWSER_TIMEOUT";
      sourceTimeLimitReached = sourceDeadlineExceeded || sourceElapsedMs() >= NATIVE_SOURCE_ELAPSED_CAP_MS;
      if (sourceTimeLimitReached) sourceEnded = true;
      if (error && typeof error === "object") Object.assign(error, {
        nativeFunnel: funnel(true),
        nativeProgress: {
          sourceId: pack.meta.id,
          inspectedSourceIds: [...new Set(inspectedSourceIds)],
          detailAttempts: sourceDetailAttemptsBefore + inspected,
          pagesRead: sourcePagesBefore + listingPagesRead,
          elapsedMs: sourceElapsedMs(),
          ...(nextListing ? { nextListing } : {}), visitedListingUrls,
          pendingSourceEntries: [...new Map(pendingSourceEntries.map((entry) => [entry.sourceEntityId, entry])).values()],
          pendingSourceIds: [...new Set(pendingSourceEntries.map((entry) => entry.sourceEntityId))],
        },
      });
      throw error;
    } finally {
      await executor.close();
    }
  }

  async search(request: RestaurantSearchRequest, signal: AbortSignal): Promise<RestaurantSearchRead> {
    const startedAt = Date.now();
    const { location, localityEvidence } = await this.location(request, signal);
    const discoveryPlan: DiscoveryPlan = request.continuation?.discoveryPlan
      ?? planDiscoverySources(request.intent, location, this.packs.map((pack) => pack.meta), this.now());
    const entry = currentDiscoveryPlanEntry(discoveryPlan);
    if (!entry) throw Object.assign(new Error("Discovery source plan is exhausted"), { code: "DISCOVERY_PLAN_EXHAUSTED" });
    const pack = this.packs.find((candidate) => candidate.meta.id === entry.sourceId);
    const source = nativeSourceForPack(pack);
    if (!source) return this.searchGooglePack(request, signal, discoveryPlan, entry.sourceId, entry.query.keyword ?? entry.query.category, location);
    let batch: Awaited<ReturnType<NativeRestaurantSearch["batch"]>> = { candidates: [], evidence: [], candidateFailures: [],
      progress: {
        sourceId: entry.sourceId,
        inspectedSourceIds: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? [...request.continuation.sourceProgress.inspectedSourceIds] : [],
        detailAttempts: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? request.continuation.sourceProgress.detailAttempts : 0,
        pagesRead: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? request.continuation.sourceProgress.pagesRead : 0,
        elapsedMs: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? request.continuation.sourceProgress.elapsedMs ?? 0 : 0,
        visitedListingUrls: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? [...(request.continuation.sourceProgress.visitedListingUrls ?? [])] : [],
        pendingSourceEntries: pack ? retainedPendingEntries(pack, request.continuation?.sourceProgress) : [],
        pendingSourceIds: request.continuation?.sourceProgress?.sourceId === entry.sourceId ? [...request.continuation.sourceProgress.pendingSourceIds] : [],
      },
      funnel: { source: pack!.browser!.provider, rawSourceLinks: 0, parsedOutlets: 0, inspectedOutlets: 0, batchCap: NATIVE_DETAIL_BATCH_CAP, sourceDetailCap: NATIVE_DETAIL_SOURCE_CAP, sourceDetailAttempts: 0, deferredByBatchCap: [], rejected: [], accepted: 0,
        sourcePageCap: NATIVE_LISTING_PAGE_CAP[source], sourceElapsedCapMs: NATIVE_SOURCE_ELAPSED_CAP_MS, sourceElapsedMs: 0, sourceTimeLimitReached: false,
        pagesRead: 0, batchLimitReached: false, sourceExhausted: "UNKNOWN", batchEnded: true, sourceEnded: true,
        progressionReason: source === "DIRECTORY" ? "FIRST_SOURCE_BATCH" : "FIRST_SOURCE_BATCH_ENDED", listingObservations: [] } };
    let failureCode: string | undefined;
    try {
      batch = await this.batch(pack!, source, request, location, entry.query, signal, request.continuation?.sourceProgress);
    } catch (error) {
      if (taskLevelFailure(error, signal)) throw error;
      if (error && typeof error === "object" && "nativeFunnel" in error && error.nativeFunnel) {
        // A source failure is not a completed empty batch.  If it still has
        // unstarted observed entrances, retain the source stage so the next
        // read consumes that queue rather than silently skipping a plan entry.
        const nativeError = error as { nativeFunnel: typeof batch.funnel; nativeProgress?: typeof batch.progress };
        const failedFunnel = nativeError.nativeFunnel;
        const failedProgress = nativeError.nativeProgress;
        batch = { ...batch, funnel: { ...failedFunnel,
          sourceEnded: failedProgress
            ? failedProgress.pendingSourceEntries.length === 0
              || failedProgress.detailAttempts >= failedFunnel.sourceDetailCap
              || failedFunnel.sourceTimeLimitReached
            : failedFunnel.sourceEnded,
        } };
      }
      if (error && typeof error === "object" && "nativeProgress" in error && error.nativeProgress) {
        batch = { ...batch, progress: error.nativeProgress as typeof batch.progress };
      }
      failureCode = error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code : `${source}_NATIVE_DISCOVERY_FAILED`;
    }
    const sourceEnded = batch.funnel.sourceEnded;
    const nextPlan = sourceEnded ? advanceDiscoveryPlan(discoveryPlan) : discoveryPlan;
    return {
      candidates: batch.candidates,
      evidence: [...(localityEvidence ? [localityEvidence] : []), ...batch.evidence],
      continuation: {
        intentFingerprint: restaurantSearchIntentFingerprint(request.intent),
        discoveryPlan: nextPlan,
        currentDiscoveryBatch: {
          sourceId: entry.sourceId,
          candidateIds: batch.candidates.map((candidate) => candidate.restaurant.id),
        },
        usedPageTokens: [], pagesRead: (request.continuation?.pagesRead ?? 0) + batch.funnel.pagesRead,
        exhausted: sourceEnded && currentDiscoveryPlanEntry(nextPlan) === undefined,
        ...(!sourceEnded || failureCode ? { sourceProgress: batch.progress } : {}),
        ...(failureCode ? { lastFailureCode: failureCode } : {}),
        locationContext: location,
      },
      metadata: { provider: pack!.browser!.provider, route: this.executionRoute, latencyMs: Date.now() - startedAt,
        nativeDiscoveryFunnel: batch.funnel,
        ...(failureCode ? { failureCode } : {}),
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
    const read = await this.locality.search({ ...freshRequest, retrievalHint, discoveryQuery: plan.entries[plan.cursor]!.query, ...(continuation ? { continuation } : {}) }, signal);
    if (!read.continuation) throw Object.assign(new Error("Google discovery did not return a bounded cursor"), { code: "GOOGLE_MALFORMED_RESPONSE" });
    const googleContinuation = read.continuation;
    const sourceEnded = googleContinuation.exhausted;
    const nextPlan = sourceEnded ? advanceDiscoveryPlan(plan) : plan;
    const candidates = read.candidates.map((candidate) => ({
      ...candidate,
      restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, discoverySourceId: sourceId } },
    }));
    return {
      ...read,
      candidates,
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
