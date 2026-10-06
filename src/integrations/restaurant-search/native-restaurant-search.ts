import { createHash } from "node:crypto";

import type { RestaurantSearchPort } from "../../application/restaurant-execution-router.js";
import { restaurantSearchIntentFingerprint, type RestaurantCandidate, type RestaurantReadEvidence, type RestaurantSearchRead, type RestaurantSearchRequest } from "../../domains/restaurant/contracts.js";
import { googleDiscoveryGeoDiagnostics } from "../../domains/restaurant/read-grounding.js";
import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserExecutionBudget, BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { GooglePlacesRestaurantSearch } from "../google/google-places-restaurant-search.js";
import { hasBotChallenge, parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets } from "../tabelog/tabelog-page-parser.js";
import { hasTableCheckBotChallenge, hasTableCheckDiscoveryNoResult, inspectTableCheckPageUnavailable, parseTableCheckDiscoveryOutletUrls, parseTableCheckOutletIdentityWithEvidence } from "../tablecheck/tablecheck-page-parser.js";

type Location = NonNullable<NonNullable<RestaurantSearchRequest["continuation"]>["locationContext"]>;
type Source = "TABELOG" | "TABLECHECK";
type NativeSourceProgress = NonNullable<RestaurantSearchRequest["continuation"]>["nativeSourceProgress"] extends infer Progress
  ? NonNullable<Progress> : never;
type PendingSourceEntry = NonNullable<NativeSourceProgress["pendingSourceEntries"]>[number];
/** One read chunk.  It is not a statement that the source has been exhausted. */
const NATIVE_DETAIL_BATCH_CAP = 5;
/** Keep the second source and final presentation within the existing run budget. */
const NATIVE_DETAIL_SOURCE_CAP = 10;
/** A chunk reopens the source list only to recover its persisted observed entrance set. */
const NATIVE_LISTING_PAGE_CHUNK_CAP: Record<Source, number> = { TABELOG: 3, TABLECHECK: 1 };
const NATIVE_LISTING_PAGE_CAP: Record<Source, number> = {
  TABELOG: NATIVE_LISTING_PAGE_CHUNK_CAP.TABELOG * Math.ceil(NATIVE_DETAIL_SOURCE_CAP / NATIVE_DETAIL_BATCH_CAP),
  TABLECHECK: NATIVE_LISTING_PAGE_CHUNK_CAP.TABLECHECK * Math.ceil(NATIVE_DETAIL_SOURCE_CAP / NATIVE_DETAIL_BATCH_CAP),
};
/** A cumulative source ceiling within the shared read-run budget. */
const NATIVE_SOURCE_ELAPSED_CAP_MS = 90_000;

function taskLevelFailure(error: unknown, signal: AbortSignal): boolean {
  return signal.aborted || (error !== null && typeof error === "object" && "code" in error && (
    error.code === "BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED" || error.code === "MODEL_CALL_BUDGET_EXHAUSTED"
    || error.code === "BROWSER_RUNTIME_UNAVAILABLE" || error.code === "BROWSER_ABORTED"
  ));
}

function candidateFailureCode(error: unknown, source: Source): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return typeof code === "string" && /^[A-Z][A-Z0-9_]{0,63}$/.test(code) ? code : `${source}_DETAIL_FAILED`;
}

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function rawSourceLinks(page: BrowserSnapshot, source: Source): number {
  const links = new Set<string>();
  for (const match of page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    try {
      const url = new URL((match[1] ?? "").replaceAll("&amp;", "&"), page.url);
      const path = url.pathname;
      if (source === "TABELOG"
        ? url.origin === "https://tabelog.com" && /^\/(?:en\/)?tokyo\/A\d+\/A\d+\/\d+\/?$/.test(path)
        : url.origin === "https://www.tablecheck.com" && /^\/(?:en|ja)\/(?!japan\/|shops\/)[^/]+\/?$/.test(path)) {
        links.add(`${url.origin}${path.replace(/\/$/, "")}`);
      }
    } catch { /* An invalid source link is not an outlet. */ }
  }
  return links.size;
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
  source: Source,
  priorProgress: NativeSourceProgress | undefined,
): PendingSourceEntry[] {
  if (priorProgress?.source !== source) return [];
  const entries = priorProgress.pendingSourceEntries ?? priorProgress.pendingSourceIds.map((sourceEntityId) => ({
    sourceEntityId,
    sourceUrl: "",
    observedAt: "",
  }));
  return entries.filter((entry) => {
    try {
      const url = new URL(entry.sourceUrl);
      return source === "TABELOG" ? url.origin === "https://tabelog.com" : url.origin === "https://www.tablecheck.com";
    } catch {
      return false;
    }
  });
}

function observedTabelogRegion(page: BrowserSnapshot, label: string): string | undefined {
  const target = normalized(label);
  if (!target) return undefined;
  const links = [...page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    const text = (match[2] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    try {
      const url = new URL((match[1] ?? "").replaceAll("&amp;", "&"), page.url);
      return url.origin === "https://tabelog.com" && url.pathname.includes("/rstLst/")
        ? [{ url: url.toString(), text: normalized(text) }] : [];
    } catch { return []; }
  });
  return (links.find((link) => link.text === target) ?? links.find((link) => link.text.includes(target)))?.url;
}

function tabelogListingRoot(value: string): string | undefined {
  const url = new URL(value);
  const index = url.pathname.indexOf("/rstLst/");
  return url.origin === "https://tabelog.com" && index >= 0 ? url.pathname.slice(0, index + "/rstLst/".length) : undefined;
}

function tabelogListingLinks(page: BrowserSnapshot) {
  const root = tabelogListingRoot(page.url);
  return [...page.html.matchAll(/<a\b([^>]*\bhref=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    try {
      const url = new URL(match[2]!.replaceAll("&amp;", "&"), page.url);
      const label = match[3]!.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return root && url.origin === "https://tabelog.com" && url.pathname.startsWith(root)
        ? [{ url: url.toString(), label, attributes: match[1]!, category: /^\D[^/]*\/$/.test(url.pathname.slice(root.length)) }] : [];
    } catch { return []; }
  });
}

function nextTabelogListing(page: BrowserSnapshot, visited: readonly string[]) {
  return tabelogListingLinks(page).find((link) => !visited.includes(link.url)
    && !/aria-disabled=["']true|\bis-disabled\b/i.test(link.attributes)
    && (/\brel=["']next["']/i.test(link.attributes) || /^(?:Next(?:\s+\d+)?|次へ|次の\d+件)$/i.test(link.label)));
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
  source: Source;
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
  const candidateId = `${input.source.toLocaleLowerCase("en-US")}:${input.sourceId}`;
  const evidenceId = `evidence:restaurant:native-discovery:${createHash("sha256").update(`${candidateId}:${input.observedAt}`).digest("hex").slice(0, 24)}`;
  const evidence: RestaurantReadEvidence = {
    evidenceId, kind: "DISCOVERY", provider: input.source, candidateId,
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
        sourceIds: input.source === "TABELOG"
          ? { tabelog: input.sourceId, tabelogNativeDetailUri: input.sourceUrl }
          : { tablecheck: input.sourceId, tablecheckNativeGuideUri: input.sourceUrl },
        provenance: { outletName: evidenceId, address: evidenceId, sourceIds: evidenceId },
      },
      matchReasons: [`Source coordinates within ${input.location.radiusMeters} m of ${input.location.label}`],
      warnings: [], executionConfidence: "MEDIUM",
    },
    evidence,
  };
}

/** Bounded native discovery chunks, in a fixed Tabelog then TableCheck order. */
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
    source: Source,
    request: RestaurantSearchRequest,
    location: Location,
    signal: AbortSignal,
    priorProgress?: NonNullable<RestaurantSearchRequest["continuation"]>["nativeSourceProgress"],
  ) {
    let session: BrowserSession | undefined;
    const batchStartedAt = Date.now();
    // Native discovery uses the same bounded Executor operations as the
    // availability adapters. Discovery decisions share their origin,
    // deadline and operation accounting instead of a separate browser loop.
    const admitted = new Map<string, { candidate: RestaurantCandidate; evidence: RestaurantReadEvidence }>();
    const candidateFailures: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const rejected: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const deferredByBatchCap: Array<{ sourceUrl: string; reasonCode: "DETAIL_BATCH_CAP" }> = [];
    const priorInspected = new Set(priorProgress?.source === source ? priorProgress.inspectedSourceIds : []);
    const sourceDetailAttemptsBefore = priorProgress?.source === source ? priorProgress.detailAttempts : 0;
    const sourcePagesBefore = priorProgress?.source === source ? priorProgress.pagesRead : 0;
    const sourceElapsedBefore = priorProgress?.source === source ? priorProgress.elapsedMs ?? 0 : 0;
    const sourceElapsedRemaining = Math.max(0, NATIVE_SOURCE_ELAPSED_CAP_MS - sourceElapsedBefore);
    const retainedEntries = retainedPendingEntries(source, priorProgress);
    let nextListing = priorProgress?.source === source ? priorProgress.nextListing : undefined;
    const visitedListingUrls = priorProgress?.source === source ? [...(priorProgress.visitedListingUrls ?? [])] : [];
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
    const allowedOrigins = source === "TABELOG" ? ["https://tabelog.com"] : ["https://www.tablecheck.com"];
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
      const next = nextTabelogListing(page, visitedListingUrls);
      nextListing = next ? { sourceUrl: next.url, observedOn: page.url, observedAt: this.now() } : undefined;
      const count = page.text.match(/\d+\s*[～〜–-]\s*\d+\s*[／/]\s*([\d,]+)/)?.[1];
      listingObservations.push({ sourceUrl: page.url, parsedOutlets: parseTabelogSearchOutlets(page).length,
        ...(count ? { resultCount: Number(count.replaceAll(",", "")) } : {}),
        ...(nextListing ? { nextPageUrl: nextListing.sourceUrl } : {}) });
    };
    // The cap governs further work; diagnostics must retain the actual elapsed
    // value so a source deadline cannot look like an unfinished healthy batch.
    const sourceElapsedMs = () => sourceElapsedBefore + (Date.now() - batchStartedAt);
    const funnel = (failed = false) => ({ source, rawSourceLinks: raw, parsedOutlets: parsed, inspectedOutlets: inspected,
      batchCap: NATIVE_DETAIL_BATCH_CAP, sourceDetailCap: NATIVE_DETAIL_SOURCE_CAP,
      sourceDetailAttempts: sourceDetailAttemptsBefore + inspected, deferredByBatchCap, rejected, accepted: admitted.size,
      sourcePageCap: NATIVE_LISTING_PAGE_CAP[source], sourceElapsedCapMs: NATIVE_SOURCE_ELAPSED_CAP_MS,
      sourceElapsedMs: sourceElapsedMs(), sourceTimeLimitReached,
      pagesRead: listingPagesRead, batchLimitReached, sourceExhausted, batchEnded: true, sourceEnded,
      progressionReason: failed ? "SOURCE_FAILURE" as const : source === "TABELOG" ? "FIRST_SOURCE_BATCH" as const : "FIRST_SOURCE_BATCH_ENDED" as const,
      listingObservations, ...(queryAdjustment ? { queryAdjustment } : {}) });
    try {
      if (sourceTimeLimitReached) {
        sourceEnded = true;
        return { candidates: [], evidence: [], candidateFailures,
          progress: { source, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore,
            pagesRead: sourcePagesBefore, elapsedMs: sourceElapsedBefore, visitedListingUrls,
            ...(nextListing ? { nextListing } : {}),
            pendingSourceEntries: [...new Map(pendingSourceEntries.map((entry) => [entry.sourceEntityId, entry])).values()],
            pendingSourceIds: [...new Set(pendingSourceEntries.map((entry) => entry.sourceEntityId))] },
          funnel: funnel() };
      }
      if (sourcePagesBefore >= NATIVE_LISTING_PAGE_CAP[source] && retainedEntries.length === 0) {
        sourceEnded = true;
        return { candidates: [], evidence: [], candidateFailures,
          progress: { source, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore,
            pagesRead: sourcePagesBefore, elapsedMs: sourceElapsedBefore, visitedListingUrls, pendingSourceEntries: [], pendingSourceIds: [] },
          funnel: funnel() };
      }
      // Session acquisition is source work.  Keeping it in the existing
      // Executor makes the source's remaining deadline apply before the
      // first listing navigation and to a replacement session alike.
      session = await executor.acquire(signal, source, "DISCOVERY");
      if (source === "TABELOG") {
        const retainedOutlets = retainedEntries.map((entry) => ({
          sourceEntityId: entry.sourceEntityId,
          sourceUrl: entry.sourceUrl,
          outletName: entry.outletName ?? entry.sourceEntityId,
          ...(entry.address ? { address: entry.address } : {}),
          ...(entry.phone ? { phone: entry.phone } : {}),
        }));
        let page: BrowserSnapshot | undefined;
        let observedOutlets: ReturnType<typeof parseTabelogSearchOutlets> = [];
        // A retained observed entrance is already a source-owned continuation.
        // Reopening a volatile list first can discard it or waste the source
        // budget before its detail page is ever inspected.
        if (retainedEntries.length === 0) {
        // Tabelog's verified listing contract takes the structured HARD term.
        // An Agent retrieval hint may be a full natural-language request with
        // date, party and place prose; it must not replace the source keyword.
        const keyword = request.intent.criteria.find((item) => item.polarity === "POSITIVE" && item.strength === "HARD")?.text
          ?? request.intent.target?.query ?? request.retrievalHint?.trim() ?? "restaurant";
        const continuingListing = nextListing;
        const url = new URL(continuingListing?.sourceUrl ?? "https://tabelog.com/en/tokyo/rstLst/");
        if (continuingListing && (url.origin !== "https://tabelog.com" || tabelogListingRoot(url.href) !== tabelogListingRoot(continuingListing.observedOn))) {
          throw Object.assign(new Error("Invalid observed listing continuation"), { code: "NATIVE_LISTING_CONTINUATION_INVALID" });
        }
        if (!continuingListing) url.searchParams.set("sw", keyword);
        const activeExpression = continuingListing ? url.searchParams.get("sw") ?? "" : keyword;
        await navigate(url.toString(), 35_000);
        page = await snapshot();
        listingPagesRead += 1;
        recordListing(page);
        raw = rawSourceLinks(page, source);
        if (hasBotChallenge(page)) throw Object.assign(new Error("Tabelog source challenge"), { code: "TABELOG_BOT_CHALLENGE" });
        const label = areaLabel(request.intent.area.query);
        for (let level = 0; !continuingListing && level < NATIVE_LISTING_PAGE_CHUNK_CAP.TABELOG - 1; level += 1) {
          const region = observedTabelogRegion(page, label);
          if (!region) break;
          // Area navigation is source-owned, but an observed region link may
          // omit the active text query. Preserve the authoritative retrieval
          // term rather than silently changing the result set mid-search.
          const regionUrl = new URL(region);
          regionUrl.hash = "";
          if (!regionUrl.searchParams.has("sw")) regionUrl.searchParams.set("sw", keyword);
          const currentUrl = new URL(page.url);
          currentUrl.hash = "";
          if (regionUrl.href === currentUrl.href) break;
          await navigate(regionUrl.toString(), 25_000);
          page = await snapshot();
          listingPagesRead += 1;
          recordListing(page);
          raw = rawSourceLinks(page, source);
          if (hasBotChallenge(page)) throw Object.assign(new Error("Tabelog source challenge"), { code: "TABELOG_BOT_CHALLENGE" });
          if (normalized(page.url).includes(normalized(label)) && parseTabelogSearchOutlets(page).length) break;
        }
        const listingComplete = (current: BrowserSnapshot, controls: readonly BrowserPageControl[] = []) => !discoveryQueryNeedsCurrentQuery(current, activeExpression, controls)
          && (parseTabelogSearchOutlets(current).length > 0 || /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(current.text));
        observedOutlets = parseTabelogSearchOutlets(page);
        // An explicit empty result is current only after the same observed
        // input/busy check.  Otherwise an old empty or card list can silently
        // end discovery before the bounded public retrieval is attempted.
        if (publicDiscoverySearchInput(page) || !listingComplete(page)) {
          const discovery = await executor.runSkill({
            taskId: `browser-read:native-discovery:${source}`,
            source,
            stage: "DISCOVERY",
            session: session!,
            signal,
            allowedOrigins,
            goal: { outlet: { name: keyword, address: request.intent.area.query }, retrievalExpression: activeExpression, hardCriteria: request.intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text) },
            objective: "Apply the current source search and reveal its public restaurant results for the authoritative area and retrieval terms. Do not submit a reservation.",
            methodReason: "The Tabelog listing has not yet produced a parsed public restaurant result or an explicit empty result.",
            completion: (current, controls) => ({ complete: listingComplete(current, controls), reason: "Reveal a current public restaurant result list or wait for an explicit empty listing state." }),
          });
          page = discovery.snapshot;
          if (discovery.status !== "COMPLETED" || !listingComplete(page, discovery.controls)) {
            throw Object.assign(new Error("Tabelog current public results were not observed"), { code: "TABELOG_DISCOVERY_INCOMPLETE" });
          }
          recordListing(page);
          observedOutlets = parseTabelogSearchOutlets(page);
        }
        // A source keyword is a retrieval expression, not the HARD fact gate.
        // When that list is sparse, use one observed category route to widen
        // discovery. The model selects the category; no cuisine mapping is coded.
        const categoryEntrance = tabelogListingLinks(page).some((link) => link.category || /js-leftnavi-genre-anchor/.test(link.attributes));
        if (!continuingListing && observedOutlets.length < NATIVE_DETAIL_BATCH_CAP && !nextListing && categoryEntrance && this.discoveryDecision) {
          const initialPage = page;
          const initialRoot = tabelogListingRoot(page.url)!;
          let lastUrl = page.url;
          pendingSourceEntries = observedOutlets.map((outlet) => pendingEntry(outlet.sourceEntityId, outlet.sourceUrl, this.now(), { outletName: outlet.outletName }));
          const adjusted = await executor.runSkill({
            taskId: `browser-read:native-discovery:${source}`, source, stage: "DISCOVERY", session: session!, signal, allowedOrigins,
            goal: { outlet: { name: keyword, address: request.intent.area.query }, hardCriteria: request.intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text) },
            objective: "The keyword list is sparse. Use an observed related category for broader restaurant discovery in the same area. Open Search by category if needed, choose the most relevant category, and remove the keyword using the site's own filter-removal link. This changes retrieval only: every candidate still needs separate HARD fact verification. Do not change area, dates or party size, or open restaurant details yet.",
            methodReason: "A short keyword result list does not establish source coverage. Follow one relevant source category and remove the old keyword filter.",
            completion: (current) => {
              if (current.url !== lastUrl) { listingPagesRead += 1; lastUrl = current.url; recordListing(current); }
              const currentUrl = new URL(current.url);
              const suffix = currentUrl.pathname.slice(initialRoot.length);
              const complete = tabelogListingRoot(current.url) === initialRoot && /^\D[^/]*\/$/.test(suffix)
                && !currentUrl.searchParams.has("sw") && !visibleDiscoveryQueryBusy(current) && parseTabelogSearchOutlets(current).length > 0;
              if (!complete && sourcePagesBefore + listingPagesRead >= NATIVE_LISTING_PAGE_CAP.TABELOG) {
                throw Object.assign(new Error("Native listing page ceiling reached"), { code: "NATIVE_LISTING_PAGE_LIMIT" });
              }
              return { complete, reason: "Observe a current related-category result list in the same area with the old keyword removed." };
            },
          });
          queryAdjustment = adjusted.status;
          page = adjusted.status === "COMPLETED" ? adjusted.snapshot : initialPage;
          observedOutlets = [...new Map([...observedOutlets, ...parseTabelogSearchOutlets(page)].map((outlet) => [outlet.sourceEntityId, outlet])).values()];
          recordListing(page);
        }
        }
        // Keep an observed detail entrance ahead of a newly rendered list. A
        // reordered list is not evidence that the earlier entrance vanished.
        const outlets = [...new Map([...retainedOutlets, ...observedOutlets].map((outlet) => [outlet.sourceEntityId, outlet])).values()];
        raw = page ? rawSourceLinks(page, source) : 0;
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
        sourceExhausted = pendingOutlets.length || nextListing ? false : page && !raw && /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(page.text) ? true : "UNKNOWN";
        deferredByBatchCap.push(...pendingOutlets.map((outlet) => ({ sourceUrl: outlet.sourceUrl, reasonCode: "DETAIL_BATCH_CAP" as const })));
        for (const outlet of chunk) {
          if (signal.aborted) throw Object.assign(new Error("Native search aborted"), { code: "BROWSER_ABORTED" });
          if (!session) {
            try { session = await executor.acquire(signal, source, "DISCOVERY"); }
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
            if (hasBotChallenge(detail)) { rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: "BOT_CHALLENGE" }); continue; }
            const extracted = parseTabelogOutletIdentityWithEvidence(detail, outlet);
            const point = pageCoordinates(detail, extracted.outlet.outletName);
            if (!point || !extracted.outlet.address || extracted.fields.outletName.source === "SEARCH_RESULT"
              || extracted.fields.address.source === "SEARCH_RESULT" || extracted.fields.address.source === "ABSENT"
              || extracted.outlet.sourceEntityId !== outlet.sourceEntityId) {
              rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: !point ? "PAGE_COORDINATES_MISSING" : extracted.outlet.sourceEntityId !== outlet.sourceEntityId ? "SOURCE_ID_CHANGED" : "PAGE_IDENTITY_MISSING" });
              continue;
            }
            const grounded = groundedNativeCandidate({ source, sourceId: outlet.sourceEntityId,
              sourceUrl: extracted.outlet.sourceUrl, name: extracted.outlet.outletName, address: extracted.outlet.address,
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
        // As with Tabelog, a persisted public detail entrance is sufficient to
        // continue the same source batch. Do not make it dependent on a fresh,
        // dynamically hydrated search listing.
        if (retainedEntries.length === 0) {
        const url = new URL("https://www.tablecheck.com/en/japan/search");
        url.searchParams.set("service_mode", "dining");
        url.searchParams.set("sort_by", "relevance");
        url.searchParams.set("venue_type", "tc");
        url.searchParams.set("geo_latitude", String(location.latitude));
        url.searchParams.set("geo_longitude", String(location.longitude));
        url.searchParams.set("geo_distance", "5km");
        url.searchParams.set("auto_geolocate", "false");
        const keyword = request.retrievalHint?.trim() || request.intent.criteria.find((item) => item.polarity === "POSITIVE" && item.strength === "HARD")?.text;
        if (keyword) url.searchParams.set("search_text", keyword);
        await navigate(url.toString(), 35_000);
        page = await snapshot();
        listingPagesRead += 1;
        raw = rawSourceLinks(page, source);
        links = parseTableCheckDiscoveryOutletUrls(page, "");
        // A missing legacy query parameter is not a loading signal. The
        // parser's current page state decides whether the shared skill needs
        // to wait or use an observed public search control.
        const expression = keyword ?? request.intent.target?.query ?? "restaurant";
        const listingComplete = (current: BrowserSnapshot, controls: readonly BrowserPageControl[] = []) => !discoveryQueryNeedsCurrentQuery(current, expression, controls)
          && (parseTableCheckDiscoveryOutletUrls(current, "").length > 0 || hasTableCheckDiscoveryNoResult(current));
        if ((publicDiscoverySearchInput(page) || !listingComplete(page)) && !inspectTableCheckPageUnavailable(page).pageUnavailable) {
          const discovery = await executor.runSkill({
            taskId: `browser-read:native-discovery:${source}`,
            source,
            stage: "DISCOVERY",
            session: session!,
            signal,
            allowedOrigins,
            goal: { outlet: { name: expression, address: request.intent.area.query }, retrievalExpression: expression, hardCriteria: request.intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text) },
            objective: "Apply the current TableCheck search and reveal public venue result cards for the authoritative area and retrieval terms. Do not submit a reservation.",
            methodReason: "The TableCheck listing has not yet produced a parsed public venue result or an explicit empty result.",
            completion: (current, controls) => ({ complete: listingComplete(current, controls), reason: "Reveal a current public venue result list or wait for an explicit empty listing state." }),
          });
          page = discovery.snapshot;
          if (discovery.status !== "COMPLETED" || !listingComplete(page, discovery.controls)) {
            throw Object.assign(new Error("TableCheck current public results were not observed"), { code: "TABLECHECK_DISCOVERY_INCOMPLETE" });
          }
          raw = rawSourceLinks(page, source);
          links = parseTableCheckDiscoveryOutletUrls(page, "");
        }
        }
        links = [...new Map(links.map((link) => [link, link])).values()];
        parsed = links.length;
        if (page && (hasTableCheckBotChallenge(page) || inspectTableCheckPageUnavailable(page).pageUnavailable)) {
          throw Object.assign(new Error("TableCheck search page unavailable"), { code: "TABLECHECK_PAGE_UNAVAILABLE" });
        }
        if (!links.length && (!page || !hasTableCheckDiscoveryNoResult(page))) {
          throw Object.assign(new Error("TableCheck native results were not observed"), { code: "TABLECHECK_DISCOVERY_INCOMPLETE" });
        }
        raw = page ? rawSourceLinks(page, source) : 0;
        parsed = links.length;
        const remainingDetailBudget = Math.max(0, NATIVE_DETAIL_SOURCE_CAP - sourceDetailAttemptsBefore);
        const sourceId = (link: string) => {
          const url = new URL(link);
          return url.pathname.replace(/^\/(?:en|ja)\//, "").replace(/\/$/, "");
        };
        const unseenLinks = links.filter((link) => !priorInspected.has(sourceId(link)));
        const chunk = unseenLinks.slice(0, Math.min(NATIVE_DETAIL_BATCH_CAP, remainingDetailBudget));
        const pendingLinks = unseenLinks.slice(chunk.length);
        // Persist all unattempted entries, including this chosen chunk, until
        // each detail navigation has actually started.
        pendingSourceEntries = unseenLinks.map((link) => pendingEntry(sourceId(link), link, this.now()));
        batchLimitReached = pendingLinks.length > 0 && remainingDetailBudget > chunk.length;
        // Keep chosen links in the continuation until their detail navigation
        // has actually started; see the parallel Tabelog branch above.
        sourceEnded = false;
        sourceExhausted = pendingLinks.length ? false : page && !raw && hasTableCheckDiscoveryNoResult(page) ? true : "UNKNOWN";
        deferredByBatchCap.push(...pendingLinks.map((sourceUrl) => ({ sourceUrl, reasonCode: "DETAIL_BATCH_CAP" as const })));
        for (const link of chunk) {
          if (signal.aborted) throw Object.assign(new Error("Native search aborted"), { code: "BROWSER_ABORTED" });
          if (!session) {
            try { session = await executor.acquire(signal, source, "DISCOVERY"); }
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
            if (hasTableCheckBotChallenge(detail) || inspectTableCheckPageUnavailable(detail).pageUnavailable) {
              rejected.push({ sourceUrl: link, reasonCode: hasTableCheckBotChallenge(detail) ? "BOT_CHALLENGE" : "PAGE_UNAVAILABLE" });
              continue;
            }
            const extracted = parseTableCheckOutletIdentityWithEvidence(detail, link);
            const point = extracted && pageCoordinates(detail, extracted.outlet.outletName);
            if (!extracted || !point || !extracted.outlet.address || extracted.fields.outletName.source === "ABSENT"
              || extracted.fields.address.source === "ABSENT") {
              rejected.push({ sourceUrl: link, reasonCode: !point ? "PAGE_COORDINATES_MISSING" : "PAGE_IDENTITY_MISSING" });
              continue;
            }
            const grounded = groundedNativeCandidate({ source, sourceId: extracted.outlet.sourceEntityId,
              sourceUrl: extracted.outlet.sourceUrl, name: extracted.outlet.outletName, address: extracted.outlet.address,
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
        progress: { source, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore + inspected,
          pagesRead: (priorProgress?.source === source ? priorProgress.pagesRead : 0) + listingPagesRead,
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
          source,
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
    const source: Source = request.continuation?.nativeStage === "TABELOG_DONE" ? "TABLECHECK" : "TABELOG";
    if (request.continuation?.nativeStage === "TABLECHECK_DONE") throw new Error("Native source batches are exhausted");
    let batch: Awaited<ReturnType<NativeRestaurantSearch["batch"]>> = { candidates: [], evidence: [], candidateFailures: [],
      progress: {
        source,
        inspectedSourceIds: request.continuation?.nativeSourceProgress?.source === source ? [...request.continuation.nativeSourceProgress.inspectedSourceIds] : [],
        detailAttempts: request.continuation?.nativeSourceProgress?.source === source ? request.continuation.nativeSourceProgress.detailAttempts : 0,
        pagesRead: request.continuation?.nativeSourceProgress?.source === source ? request.continuation.nativeSourceProgress.pagesRead : 0,
        elapsedMs: request.continuation?.nativeSourceProgress?.source === source ? request.continuation.nativeSourceProgress.elapsedMs ?? 0 : 0,
        visitedListingUrls: request.continuation?.nativeSourceProgress?.source === source ? [...(request.continuation.nativeSourceProgress.visitedListingUrls ?? [])] : [],
        pendingSourceEntries: retainedPendingEntries(source, request.continuation?.nativeSourceProgress),
        pendingSourceIds: request.continuation?.nativeSourceProgress?.source === source ? [...request.continuation.nativeSourceProgress.pendingSourceIds] : [],
      },
      funnel: { source, rawSourceLinks: 0, parsedOutlets: 0, inspectedOutlets: 0, batchCap: NATIVE_DETAIL_BATCH_CAP, sourceDetailCap: NATIVE_DETAIL_SOURCE_CAP, sourceDetailAttempts: 0, deferredByBatchCap: [], rejected: [], accepted: 0,
        sourcePageCap: NATIVE_LISTING_PAGE_CAP[source], sourceElapsedCapMs: NATIVE_SOURCE_ELAPSED_CAP_MS, sourceElapsedMs: 0, sourceTimeLimitReached: false,
        pagesRead: 0, batchLimitReached: false, sourceExhausted: "UNKNOWN", batchEnded: true, sourceEnded: true,
        progressionReason: source === "TABELOG" ? "FIRST_SOURCE_BATCH" : "FIRST_SOURCE_BATCH_ENDED", listingObservations: [] } };
    let failureCode: string | undefined;
    try {
      batch = await this.batch(source, request, location, signal, request.continuation?.nativeSourceProgress);
    } catch (error) {
      if (taskLevelFailure(error, signal)) throw error;
      if (error && typeof error === "object" && "nativeFunnel" in error && error.nativeFunnel) {
        // A source failure is not a completed empty batch.  If it still has
        // unstarted observed entrances, retain the source stage so the next
        // read consumes that queue rather than silently jumping to TableCheck.
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
    const nativeStage = source === "TABELOG"
      ? (sourceEnded ? "TABELOG_DONE" : undefined)
      : (sourceEnded ? "TABLECHECK_DONE" : "TABELOG_DONE");
    return {
      candidates: batch.candidates,
      evidence: [...(localityEvidence ? [localityEvidence] : []), ...batch.evidence],
      continuation: {
        intentFingerprint: restaurantSearchIntentFingerprint(request.intent),
        ...(nativeStage ? { nativeStage } : {}),
        nativeCurrentBatch: {
          source,
          candidateIds: batch.candidates.map((candidate) => candidate.restaurant.id),
        },
        usedPageTokens: [], pagesRead: (request.continuation?.pagesRead ?? 0) + batch.funnel.pagesRead,
        exhausted: source === "TABLECHECK" && sourceEnded,
        ...(!sourceEnded || failureCode ? { nativeSourceProgress: batch.progress } : {}),
        ...(failureCode ? { lastFailureCode: failureCode } : {}),
        locationContext: location,
      },
      metadata: { provider: source, route: this.executionRoute, latencyMs: Date.now() - startedAt,
        nativeDiscoveryFunnel: batch.funnel,
        ...(failureCode ? { failureCode } : {}),
        ...(batch.candidateFailures.length ? { candidateFailures: batch.candidateFailures, failureScope: "CANDIDATE" as const } : {}),
        googleRequests: this.locality.googleRequestUsage(request.readRunId),
      },
    };
  }
}
