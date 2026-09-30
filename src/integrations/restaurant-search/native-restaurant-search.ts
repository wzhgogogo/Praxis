import { createHash } from "node:crypto";

import type { RestaurantSearchPort } from "../../application/restaurant-execution-router.js";
import { restaurantSearchIntentFingerprint, type RestaurantCandidate, type RestaurantReadEvidence, type RestaurantSearchRead, type RestaurantSearchRequest } from "../../domains/restaurant/contracts.js";
import { googleDiscoveryGeoDiagnostics } from "../../domains/restaurant/read-grounding.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { GooglePlacesRestaurantSearch } from "../google/google-places-restaurant-search.js";
import { hasBotChallenge, parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets } from "../tabelog/tabelog-page-parser.js";
import { hasTableCheckBotChallenge, hasTableCheckDiscoveryNoResult, inspectTableCheckPageUnavailable, parseTableCheckDiscoveryOutletUrls, parseTableCheckOutletIdentityWithEvidence } from "../tablecheck/tablecheck-page-parser.js";

type Location = NonNullable<NonNullable<RestaurantSearchRequest["continuation"]>["locationContext"]>;
type Source = "TABELOG" | "TABLECHECK";

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

  private async batch(source: Source, request: RestaurantSearchRequest, location: Location, signal: AbortSignal) {
    let session: BrowserSession | undefined = await this.runtime.openSession({ signal });
    const admitted = new Map<string, { candidate: RestaurantCandidate; evidence: RestaurantReadEvidence }>();
    const candidateFailures: Array<{ sourceUrl: string; reasonCode: string }> = [];
    const rejected: Array<{ sourceUrl: string; reasonCode: string }> = [];
    let raw = 0;
    let parsed = 0;
    let batchLimitReached = false;
    let sourceExhausted: boolean | "UNKNOWN" = "UNKNOWN";
    let listingPagesRead = 0;
    const funnel = (failed = false) => ({ source, rawSourceLinks: raw, parsedOutlets: parsed, newOutlets: parsed, rejected, accepted: admitted.size,
      pagesRead: listingPagesRead, batchLimitReached, sourceExhausted, batchEnded: true,
      progressionReason: failed ? "SOURCE_FAILURE" as const : source === "TABELOG" ? "FIRST_SOURCE_BATCH" as const : "FIRST_SOURCE_BATCH_ENDED" as const });
    try {
      if (source === "TABELOG") {
        const keyword = request.intent.criteria.find((item) => item.polarity === "POSITIVE" && item.strength === "HARD")?.text
          ?? request.intent.target?.query ?? "restaurant";
        const url = new URL("https://tabelog.com/en/tokyo/rstLst/");
        url.searchParams.set("sw", keyword);
        await session.navigate(url.toString(), { timeoutMs: 35_000 });
        let page = await session.snapshot();
        listingPagesRead += 1;
        raw = rawSourceLinks(page, source);
        if (hasBotChallenge(page)) throw Object.assign(new Error("Tabelog source challenge"), { code: "TABELOG_BOT_CHALLENGE" });
        const label = areaLabel(request.intent.area.query);
        for (let level = 0; level < 2; level += 1) {
          const region = observedTabelogRegion(page, label);
          if (!region || region === page.url) break;
          await session.navigate(region, { timeoutMs: 25_000 });
          page = await session.snapshot();
          listingPagesRead += 1;
          raw = rawSourceLinks(page, source);
          if (hasBotChallenge(page)) throw Object.assign(new Error("Tabelog source challenge"), { code: "TABELOG_BOT_CHALLENGE" });
          if (normalized(page.url).includes(normalized(label)) && parseTabelogSearchOutlets(page).length) break;
        }
        const outlets = parseTabelogSearchOutlets(page);
        raw = rawSourceLinks(page, source);
        parsed = outlets.length;
        batchLimitReached = outlets.length >= 5;
        sourceExhausted = /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(page.text) ? true : "UNKNOWN";
        for (const outlet of outlets) {
          if (signal.aborted) throw Object.assign(new Error("Native search aborted"), { code: "BROWSER_ABORTED" });
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
            await session.navigate(outlet.sourceUrl, { timeoutMs: 30_000 });
            const detail = await session.snapshot();
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
        await session.navigate(url.toString(), { timeoutMs: 35_000 });
        let page = await session.snapshot();
        listingPagesRead += 1;
        raw = rawSourceLinks(page, source);
        let links = parseTableCheckDiscoveryOutletUrls(page, "");
        if (!links.length && !hasTableCheckDiscoveryNoResult(page) && !inspectTableCheckPageUnavailable(page).pageUnavailable) {
          await session.waitFor('a[href*="search_text="]', 10_000).catch(() => undefined);
          page = await session.snapshot();
          raw = rawSourceLinks(page, source);
          links = parseTableCheckDiscoveryOutletUrls(page, "");
        }
        parsed = links.length;
        if (hasTableCheckBotChallenge(page) || inspectTableCheckPageUnavailable(page).pageUnavailable) {
          throw Object.assign(new Error("TableCheck search page unavailable"), { code: "TABLECHECK_PAGE_UNAVAILABLE" });
        }
        if (!links.length && !hasTableCheckDiscoveryNoResult(page)) {
          throw Object.assign(new Error("TableCheck native results were not observed"), { code: "TABLECHECK_DISCOVERY_INCOMPLETE" });
        }
        raw = rawSourceLinks(page, source);
        parsed = links.length;
        batchLimitReached = links.length >= 5;
        sourceExhausted = hasTableCheckDiscoveryNoResult(page) ? true : "UNKNOWN";
        for (const link of links) {
          if (signal.aborted) throw Object.assign(new Error("Native search aborted"), { code: "BROWSER_ABORTED" });
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
            await session.navigate(link, { timeoutMs: 30_000 });
            const detail = await session.snapshot();
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
      return { candidates: [...admitted.values()].map((item) => item.candidate), evidence: [...admitted.values()].map((item) => item.evidence), candidateFailures,
        funnel: funnel() };
    } catch (error) {
      if (error && typeof error === "object") Object.assign(error, { nativeFunnel: funnel(true) });
      throw error;
    } finally {
      if (session) await session.close();
    }
  }

  async search(request: RestaurantSearchRequest, signal: AbortSignal): Promise<RestaurantSearchRead> {
    const startedAt = Date.now();
    const { location, localityEvidence } = await this.location(request, signal);
    const source: Source = request.continuation?.nativeStage === "TABELOG_DONE" ? "TABLECHECK" : "TABELOG";
    if (request.continuation?.nativeStage === "TABLECHECK_DONE") throw new Error("Native source batches are exhausted");
    let batch: Awaited<ReturnType<NativeRestaurantSearch["batch"]>> = { candidates: [], evidence: [], candidateFailures: [],
      funnel: { source, rawSourceLinks: 0, parsedOutlets: 0, newOutlets: 0, rejected: [], accepted: 0,
        pagesRead: 0, batchLimitReached: false, sourceExhausted: "UNKNOWN", batchEnded: true,
        progressionReason: source === "TABELOG" ? "FIRST_SOURCE_BATCH" : "FIRST_SOURCE_BATCH_ENDED" } };
    let failureCode: string | undefined;
    try {
      batch = await this.batch(source, request, location, signal);
    } catch (error) {
      if (taskLevelFailure(error, signal)) throw error;
      if (error && typeof error === "object" && "nativeFunnel" in error && error.nativeFunnel) {
        batch = { ...batch, funnel: error.nativeFunnel as typeof batch.funnel };
      }
      failureCode = error && typeof error === "object" && "code" in error && typeof error.code === "string"
        ? error.code : `${source}_NATIVE_DISCOVERY_FAILED`;
    }
    return {
      candidates: batch.candidates,
      evidence: [...(localityEvidence ? [localityEvidence] : []), ...batch.evidence],
      continuation: {
        intentFingerprint: restaurantSearchIntentFingerprint(request.intent),
        nativeStage: source === "TABELOG" ? "TABELOG_DONE" : "TABLECHECK_DONE",
        usedPageTokens: [], pagesRead: source === "TABELOG" ? 1 : 2,
        exhausted: source === "TABLECHECK",
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
