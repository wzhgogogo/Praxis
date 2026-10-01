import { createHash } from "node:crypto";

import type { RestaurantSearchPort } from "../../application/restaurant-execution-router.js";
import { restaurantSearchIntentFingerprint, type RestaurantCandidate, type RestaurantReadEvidence, type RestaurantSearchRead, type RestaurantSearchRequest } from "../../domains/restaurant/contracts.js";
import { googleDiscoveryGeoDiagnostics } from "../../domains/restaurant/read-grounding.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
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
/** Leaves the 300s Case deadline room for the second source and presentation. */
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

/** One observed native batch per source, in a fixed Tabelog then TableCheck order. */
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
    // availability adapters.  This path has no model decision today, but a
    // future observed discovery action therefore cannot bypass origin,
    // deadline and operation accounting through a separate browser loop.
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
    const executor = new BrowserTaskExecutor(this.runtime, {
      maxElapsedMsPerCandidate: Math.max(1, sourceElapsedRemaining),
      ...(this.discoveryDecision ? { modelDecision: this.discoveryDecision } : {}),
      ...(this.browserBudget ? { budget: this.browserBudget } : {}),
      ...(this.onBrowserDiagnostic ? { onDiagnostic: this.onBrowserDiagnostic } : {}),
    });
    executor.beginCandidate(`native-discovery:${source}`);
    const allowedOrigins = source === "TABELOG" ? ["https://tabelog.com"] : ["https://www.tablecheck.com"];
    const navigate = async (url: string, timeoutMs: number) => executor.navigate({
      source, stage: "DISCOVERY", signal, allowedOrigins, session: session!, url, timeoutMs,
    });
    const snapshot = async () => executor.snapshot({ source, stage: "DISCOVERY", signal, session: session! });
    const waitFor = async (selector: string, timeoutMs: number) => executor.waitFor({ source, stage: "DISCOVERY", signal, session: session!, selector, timeoutMs });
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
    const sourceElapsedMs = () => Math.min(NATIVE_SOURCE_ELAPSED_CAP_MS, sourceElapsedBefore + (Date.now() - batchStartedAt));
    const funnel = (failed = false) => ({ source, rawSourceLinks: raw, parsedOutlets: parsed, inspectedOutlets: inspected,
      batchCap: NATIVE_DETAIL_BATCH_CAP, sourceDetailCap: NATIVE_DETAIL_SOURCE_CAP,
      sourceDetailAttempts: sourceDetailAttemptsBefore + inspected, deferredByBatchCap, rejected, accepted: admitted.size,
      sourcePageCap: NATIVE_LISTING_PAGE_CAP[source], sourceElapsedCapMs: NATIVE_SOURCE_ELAPSED_CAP_MS,
      sourceElapsedMs: sourceElapsedMs(), sourceTimeLimitReached,
      pagesRead: listingPagesRead, batchLimitReached, sourceExhausted, batchEnded: true, sourceEnded,
      progressionReason: failed ? "SOURCE_FAILURE" as const : source === "TABELOG" ? "FIRST_SOURCE_BATCH" as const : "FIRST_SOURCE_BATCH_ENDED" as const });
    try {
      if (sourceTimeLimitReached) {
        sourceEnded = true;
        return { candidates: [], evidence: [], candidateFailures,
          progress: { source, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore,
            pagesRead: sourcePagesBefore, elapsedMs: sourceElapsedBefore,
            pendingSourceEntries: [...new Map(pendingSourceEntries.map((entry) => [entry.sourceEntityId, entry])).values()],
            pendingSourceIds: [...new Set(pendingSourceEntries.map((entry) => entry.sourceEntityId))] },
          funnel: funnel() };
      }
      if (sourcePagesBefore >= NATIVE_LISTING_PAGE_CAP[source] && retainedEntries.length === 0) {
        sourceEnded = true;
        return { candidates: [], evidence: [], candidateFailures,
          progress: { source, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore,
            pagesRead: sourcePagesBefore, elapsedMs: sourceElapsedBefore, pendingSourceEntries: [], pendingSourceIds: [] },
          funnel: funnel() };
      }
      session = await this.runtime.openSession({ signal });
      if (source === "TABELOG") {
        const keyword = request.intent.criteria.find((item) => item.polarity === "POSITIVE" && item.strength === "HARD")?.text
          ?? request.intent.target?.query ?? "restaurant";
        const url = new URL("https://tabelog.com/en/tokyo/rstLst/");
        url.searchParams.set("sw", keyword);
        await navigate(url.toString(), 35_000);
        let page = await snapshot();
        listingPagesRead += 1;
        raw = rawSourceLinks(page, source);
        if (hasBotChallenge(page)) throw Object.assign(new Error("Tabelog source challenge"), { code: "TABELOG_BOT_CHALLENGE" });
        const label = areaLabel(request.intent.area.query);
        for (let level = 0; level < NATIVE_LISTING_PAGE_CHUNK_CAP.TABELOG - 1; level += 1) {
          const region = observedTabelogRegion(page, label);
          if (!region || region === page.url) break;
          // Area navigation is source-owned, but an observed region link may
          // omit the active text query. Preserve the authoritative retrieval
          // term rather than silently changing the result set mid-search.
          const regionUrl = new URL(region);
          if (!regionUrl.searchParams.has("sw")) regionUrl.searchParams.set("sw", keyword);
          await navigate(regionUrl.toString(), 25_000);
          page = await snapshot();
          listingPagesRead += 1;
          raw = rawSourceLinks(page, source);
          if (hasBotChallenge(page)) throw Object.assign(new Error("Tabelog source challenge"), { code: "TABELOG_BOT_CHALLENGE" });
          if (normalized(page.url).includes(normalized(label)) && parseTabelogSearchOutlets(page).length) break;
        }
        let observedOutlets = parseTabelogSearchOutlets(page);
        if (!observedOutlets.length && !/\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(page.text)) {
          const discovery = await executor.runSkill({
            taskId: `browser-read:native-discovery:${source}`,
            source,
            stage: "DISCOVERY",
            session: session!,
            signal,
            allowedOrigins,
            goal: { outlet: { name: keyword, address: request.intent.area.query }, hardCriteria: request.intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text) },
            objective: "Apply the current source search and reveal its public restaurant results for the authoritative area and retrieval terms. Do not submit a reservation.",
            methodReason: "The Tabelog listing has not yet produced a parsed public restaurant result or an explicit empty result.",
            completion: (current) => {
              const complete = parseTabelogSearchOutlets(current).length > 0
                || /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(current.text);
              return { complete, reason: "Reveal a current public restaurant result list or wait for an explicit empty listing state." };
            },
          });
          page = discovery.snapshot;
          observedOutlets = parseTabelogSearchOutlets(page);
        }
        const retainedOutlets = retainedEntries.map((entry) => ({
          sourceEntityId: entry.sourceEntityId,
          sourceUrl: entry.sourceUrl,
          outletName: entry.outletName ?? entry.sourceEntityId,
          ...(entry.address ? { address: entry.address } : {}),
          ...(entry.phone ? { phone: entry.phone } : {}),
        }));
        // Keep an observed detail entrance ahead of a newly rendered list. A
        // reordered list is not evidence that the earlier entrance vanished.
        const outlets = [...new Map([...retainedOutlets, ...observedOutlets].map((outlet) => [outlet.sourceEntityId, outlet])).values()];
        raw = rawSourceLinks(page, source);
        parsed = outlets.length;
        const remainingDetailBudget = Math.max(0, NATIVE_DETAIL_SOURCE_CAP - sourceDetailAttemptsBefore);
        const unseenOutlets = outlets.filter((outlet) => !priorInspected.has(outlet.sourceEntityId));
        const chunk = unseenOutlets.slice(0, Math.min(NATIVE_DETAIL_BATCH_CAP, remainingDetailBudget));
        const pendingOutlets = unseenOutlets.slice(chunk.length);
        pendingSourceEntries = pendingOutlets.map((outlet) => pendingEntry(
          outlet.sourceEntityId, outlet.sourceUrl, this.now(),
          { outletName: outlet.outletName, ...(outlet.address ? { address: outlet.address } : {}), ...(outlet.phone ? { phone: outlet.phone } : {}) },
        ));
        batchLimitReached = pendingOutlets.length > 0 && remainingDetailBudget > chunk.length;
        sourceEnded = pendingOutlets.length === 0 || remainingDetailBudget === 0 || chunk.length === remainingDetailBudget;
        sourceExhausted = pendingOutlets.length ? false : !raw && /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(page.text) ? true : "UNKNOWN";
        deferredByBatchCap.push(...pendingOutlets.map((outlet) => ({ sourceUrl: outlet.sourceUrl, reasonCode: "DETAIL_BATCH_CAP" as const })));
        for (const outlet of chunk) {
          if (signal.aborted) throw Object.assign(new Error("Native search aborted"), { code: "BROWSER_ABORTED" });
          inspected += 1;
          inspectedSourceIds.push(outlet.sourceEntityId);
          if (!session) {
            try { session = await this.runtime.openSession({ signal }); }
            catch (error) {
              if (taskLevelFailure(error, signal)) throw error;
              candidateFailures.push({ sourceUrl: outlet.sourceUrl, reasonCode: candidateFailureCode(error, source) });
              rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: "SESSION_OPEN_FAILED" });
              break;
            }
          }
          let detailObserved = false;
          try {
            await navigate(outlet.sourceUrl, 30_000);
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
            if (taskLevelFailure(error, signal)) throw error;
            candidateFailures.push({ sourceUrl: outlet.sourceUrl, reasonCode: candidateFailureCode(error, source) });
            rejected.push({ sourceUrl: outlet.sourceUrl, reasonCode: candidateFailureCode(error, source) });
            if (!detailObserved) {
              void session.close().catch(() => undefined);
              session = undefined;
            }
          }
        }
      } else {
        const url = new URL("https://www.tablecheck.com/en/japan/search");
        url.searchParams.set("service_mode", "dining");
        url.searchParams.set("sort_by", "relevance");
        url.searchParams.set("venue_type", "tc");
        url.searchParams.set("geo_latitude", String(location.latitude));
        url.searchParams.set("geo_longitude", String(location.longitude));
        url.searchParams.set("geo_distance", "5km");
        url.searchParams.set("auto_geolocate", "false");
        const keyword = request.intent.criteria.find((item) => item.polarity === "POSITIVE" && item.strength === "HARD")?.text;
        if (keyword) url.searchParams.set("search_text", keyword);
        await navigate(url.toString(), 35_000);
        let page = await snapshot();
        listingPagesRead += 1;
        raw = rawSourceLinks(page, source);
        let links = parseTableCheckDiscoveryOutletUrls(page, "");
        if (!links.length && !hasTableCheckDiscoveryNoResult(page) && !inspectTableCheckPageUnavailable(page).pageUnavailable) {
          await waitFor('a[href*="search_text="]', 10_000).catch(() => undefined);
          page = await snapshot();
          raw = rawSourceLinks(page, source);
          links = parseTableCheckDiscoveryOutletUrls(page, "");
        }
        if (!links.length && !hasTableCheckDiscoveryNoResult(page) && !inspectTableCheckPageUnavailable(page).pageUnavailable) {
          const discovery = await executor.runSkill({
            taskId: `browser-read:native-discovery:${source}`,
            source,
            stage: "DISCOVERY",
            session: session!,
            signal,
            allowedOrigins,
            goal: { outlet: { name: keyword ?? request.intent.target?.query ?? "restaurant", address: request.intent.area.query }, hardCriteria: request.intent.criteria.filter((item) => item.polarity === "POSITIVE" && item.strength === "HARD").map((item) => item.text) },
            objective: "Apply the current TableCheck search and reveal public venue result cards for the authoritative area and retrieval terms. Do not submit a reservation.",
            methodReason: "The TableCheck listing has not yet produced a parsed public venue result or an explicit empty result.",
            completion: (current) => {
              const complete = parseTableCheckDiscoveryOutletUrls(current, "").length > 0 || hasTableCheckDiscoveryNoResult(current);
              return { complete, reason: "Reveal a current public venue result list or wait for an explicit empty listing state." };
            },
          });
          page = discovery.snapshot;
          raw = rawSourceLinks(page, source);
          links = parseTableCheckDiscoveryOutletUrls(page, "");
        }
        const retainedLinks = retainedEntries.map((entry) => entry.sourceUrl);
        links = [...new Map([...retainedLinks, ...links].map((link) => [link, link])).values()];
        parsed = links.length;
        if (hasTableCheckBotChallenge(page) || inspectTableCheckPageUnavailable(page).pageUnavailable) {
          throw Object.assign(new Error("TableCheck search page unavailable"), { code: "TABLECHECK_PAGE_UNAVAILABLE" });
        }
        if (!links.length && !hasTableCheckDiscoveryNoResult(page)) {
          throw Object.assign(new Error("TableCheck native results were not observed"), { code: "TABLECHECK_DISCOVERY_INCOMPLETE" });
        }
        raw = rawSourceLinks(page, source);
        parsed = links.length;
        const remainingDetailBudget = Math.max(0, NATIVE_DETAIL_SOURCE_CAP - sourceDetailAttemptsBefore);
        const sourceId = (link: string) => {
          const url = new URL(link);
          return url.pathname.replace(/^\/(?:en|ja)\//, "").replace(/\/$/, "");
        };
        const unseenLinks = links.filter((link) => !priorInspected.has(sourceId(link)));
        const chunk = unseenLinks.slice(0, Math.min(NATIVE_DETAIL_BATCH_CAP, remainingDetailBudget));
        const pendingLinks = unseenLinks.slice(chunk.length);
        pendingSourceEntries = pendingLinks.map((link) => pendingEntry(sourceId(link), link, this.now()));
        batchLimitReached = pendingLinks.length > 0 && remainingDetailBudget > chunk.length;
        sourceEnded = pendingLinks.length === 0 || remainingDetailBudget === 0 || chunk.length === remainingDetailBudget;
        sourceExhausted = pendingLinks.length ? false : !raw && hasTableCheckDiscoveryNoResult(page) ? true : "UNKNOWN";
        deferredByBatchCap.push(...pendingLinks.map((sourceUrl) => ({ sourceUrl, reasonCode: "DETAIL_BATCH_CAP" as const })));
        for (const link of chunk) {
          if (signal.aborted) throw Object.assign(new Error("Native search aborted"), { code: "BROWSER_ABORTED" });
          inspected += 1;
          inspectedSourceIds.push(sourceId(link));
          if (!session) {
            try { session = await this.runtime.openSession({ signal }); }
            catch (error) {
              if (taskLevelFailure(error, signal)) throw error;
              candidateFailures.push({ sourceUrl: link, reasonCode: candidateFailureCode(error, source) });
              rejected.push({ sourceUrl: link, reasonCode: "SESSION_OPEN_FAILED" });
              break;
            }
          }
          let detailObserved = false;
          try {
            await navigate(link, 30_000);
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
            if (taskLevelFailure(error, signal)) throw error;
            candidateFailures.push({ sourceUrl: link, reasonCode: candidateFailureCode(error, source) });
            rejected.push({ sourceUrl: link, reasonCode: candidateFailureCode(error, source) });
            if (!detailObserved) {
              void session.close().catch(() => undefined);
              session = undefined;
            }
          }
        }
      }
      sourceTimeLimitReached = sourceElapsedMs() >= NATIVE_SOURCE_ELAPSED_CAP_MS;
      if (sourceTimeLimitReached) sourceEnded = true;
      return { candidates: [...admitted.values()].map((item) => item.candidate), evidence: [...admitted.values()].map((item) => item.evidence), candidateFailures,
        progress: { source, inspectedSourceIds: [...new Set(inspectedSourceIds)], detailAttempts: sourceDetailAttemptsBefore + inspected,
          pagesRead: (priorProgress?.source === source ? priorProgress.pagesRead : 0) + listingPagesRead,
          elapsedMs: sourceElapsedMs(),
          pendingSourceEntries: [...new Map(pendingSourceEntries.map((entry) => [entry.sourceEntityId, entry])).values()],
          pendingSourceIds: [...new Set(pendingSourceEntries.map((entry) => entry.sourceEntityId))] },
        funnel: funnel() };
    } catch (error) {
      if (error && typeof error === "object") Object.assign(error, {
        nativeFunnel: funnel(true),
        nativeProgress: {
          source,
          inspectedSourceIds: [...new Set(inspectedSourceIds)],
          detailAttempts: sourceDetailAttemptsBefore + inspected,
          pagesRead: sourcePagesBefore + listingPagesRead,
          elapsedMs: sourceElapsedMs(),
          pendingSourceEntries: [...new Map(pendingSourceEntries.map((entry) => [entry.sourceEntityId, entry])).values()],
          pendingSourceIds: [...new Set(pendingSourceEntries.map((entry) => entry.sourceEntityId))],
        },
      });
      throw error;
    } finally {
      if (session) await session.close();
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
        pendingSourceEntries: retainedPendingEntries(source, request.continuation?.nativeSourceProgress),
        pendingSourceIds: request.continuation?.nativeSourceProgress?.source === source ? [...request.continuation.nativeSourceProgress.pendingSourceIds] : [],
      },
      funnel: { source, rawSourceLinks: 0, parsedOutlets: 0, inspectedOutlets: 0, batchCap: NATIVE_DETAIL_BATCH_CAP, sourceDetailCap: NATIVE_DETAIL_SOURCE_CAP, sourceDetailAttempts: 0, deferredByBatchCap: [], rejected: [], accepted: 0,
        sourcePageCap: NATIVE_LISTING_PAGE_CAP[source], sourceElapsedCapMs: NATIVE_SOURCE_ELAPSED_CAP_MS, sourceElapsedMs: 0, sourceTimeLimitReached: false,
        pagesRead: 0, batchLimitReached: false, sourceExhausted: "UNKNOWN", batchEnded: true, sourceEnded: true,
        progressionReason: source === "TABELOG" ? "FIRST_SOURCE_BATCH" : "FIRST_SOURCE_BATCH_ENDED" } };
    let failureCode: string | undefined;
    try {
      batch = await this.batch(source, request, location, signal, request.continuation?.nativeSourceProgress);
    } catch (error) {
      if (taskLevelFailure(error, signal)) throw error;
      if (error && typeof error === "object" && "nativeFunnel" in error && error.nativeFunnel) {
        // A source-level parser/navigation failure is not a completed empty
        // batch and must not reopen the same source with zeroed progress.
        // Preserve its cursor for diagnosis while allowing the fixed source
        // sequence to move on (or finish with an explicit failure).
        batch = { ...batch, funnel: { ...(error.nativeFunnel as typeof batch.funnel), sourceEnded: true } };
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
