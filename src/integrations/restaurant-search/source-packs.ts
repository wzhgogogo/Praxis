import type { DiscoveryPackMetadata, DiscoveryQuery } from "../../domains/restaurant/discovery-planner.js";
import type { GroundedAvailability, UntrustedProviderAvailabilityObservation } from "../../domains/restaurant/read-grounding.js";
import { groundTabelogAvailability, groundTableCheckAvailability } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantAvailabilityRequest, RestaurantCandidate, RestaurantOutlet, RestaurantReadEvidenceProvider } from "../../domains/restaurant/contracts.js";
import type { BrowserReadNetworkPolicy, BrowserReadNetworkRequestRule, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { tabelogPublicReadNetworkPolicy } from "../tabelog/tabelog-public-query.js";
import { tableCheckPublicReadNetworkPolicy } from "../tablecheck/tablecheck-public-query.js";
import { tableCheckRequestedReservationUrl, type TableCheckReservationTarget } from "../tablecheck/tablecheck-page-parser.js";
import { hasBotChallenge, parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets } from "../tabelog/tabelog-page-parser.js";
import { hasTableCheckBotChallenge, hasTableCheckDiscoveryNoResult, inspectTableCheckPageUnavailable, parseTableCheckDiscoveryOutletUrls, parseTableCheckOutletIdentityWithEvidence } from "../tablecheck/tablecheck-page-parser.js";
import { TableCheckBrowserAvailability, TableCheckEntryLedger } from "../tablecheck/tablecheck-browser-availability.js";
import type { TableCheckIdentityDiagnostic, TableCheckUserInterventionHandler } from "../tablecheck/tablecheck-contracts.js";
import { TabelogBrowserAvailability } from "../tabelog/tabelog-browser-availability.js";
import type { TabelogIdentityDiagnostic, TabelogUserInterventionHandler } from "../tabelog/tabelog-contracts.js";
import type { RestaurantAvailabilityProvider } from "../restaurant-availability/contracts.js";
import type { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";

export interface SourcePackAvailabilityProviderContext {
  executor: BrowserTaskExecutor;
  now?: () => string;
  maxBrowserSessions?: number;
  maxCandidateMatches?: number;
  networkPolicy?: BrowserReadNetworkPolicy;
  tableCheckEntryLedger: TableCheckEntryLedger;
  onTableCheckIdentityDiagnostic?: (diagnostic: TableCheckIdentityDiagnostic) => void;
  onTabelogIdentityDiagnostic?: (diagnostic: TabelogIdentityDiagnostic) => void;
  onTabelogUserInterventionRequired?: TabelogUserInterventionHandler;
  onTableCheckUserInterventionRequired?: TableCheckUserInterventionHandler;
}

export interface SourcePackListingOutlet {
  sourceEntityId: string;
  sourceUrl: string;
  /** A source-owned listing label; adapters replace it only with detail-page identity evidence. */
  outletName: string;
  address?: string;
  phone?: string;
}
export interface SourcePackListing { outlets: SourcePackListingOutlet[]; nextPage?: string; }
export interface SourcePackQuery {
  url: string;
  retrievalExpression: string;
  mode?: "TEXT" | "NEARBY";
  /** Whether this Pack's initial URL is already a source-observed area entrance. */
  areaEntrance: "SOURCE_OBSERVED" | "OBSERVE_SOURCE_REGION";
}
/**
 * Browser execution metadata belongs with a source pack.  The shared
 * discovery executor uses only these opaque capabilities; it never selects a
 * marketplace by name.
 */
export interface BrowserDiscoveryPackCapability {
  flow: "DIRECTORY" | "VENUE_SEARCH";
  provider: Exclude<RestaurantReadEvidenceProvider, "MODEL_JUDGMENT">;
  listingPageChunkCap: number;
  countRawLinks(snapshot: BrowserSnapshot): number;
  acceptsDetailUrl(url: string): boolean;
  candidateSourceIds(sourceEntityId: string, detailUrl: string): Record<string, string>;
  sourceEntityIdForUrl(url: string): string | undefined;
  hasChallenge(snapshot: BrowserSnapshot): boolean;
  isPageUnavailable(snapshot: BrowserSnapshot): boolean;
  isExplicitEmptyListing(snapshot: BrowserSnapshot): boolean;
  parseDetailIdentity(snapshot: BrowserSnapshot, fallback: SourcePackListingOutlet): SourcePackListingOutlet | undefined;
  directory?: {
    listingRoot(url: string): string | undefined;
    observedRegion(page: BrowserSnapshot, label: string): string | undefined;
    links(page: BrowserSnapshot): Array<{ url: string; label: string; attributes: string; category: boolean }>;
    /** Pack-owned URL grammar for a bounded listing retrieval expression. */
    withRetrievalExpression(url: string, expression: string): string;
    retrievalExpression(url: string): string | undefined;
    withoutRetrievalExpression(url: string): string;
    isExplicitEmpty(page: BrowserSnapshot): boolean;
    /** A source may canonicalize an observed regional listing to its regional homepage. */
    isSameObservedRegionHomepage?(observedListingUrl: string, currentUrl: string): boolean;
    /** A Pack may explicitly treat that same observed homepage as a usable current listing. */
    isObservedRegionHomepageListing?(page: BrowserSnapshot, observedListingUrl: string): boolean;
    /** A regional homepage is not a result list: only its own observed list link may restore listing work. */
    observedListingFromRegionHomepage?(page: BrowserSnapshot, observedListingUrl: string): string | undefined;
  };
}
export interface DiscoverySourcePack {
  meta: DiscoveryPackMetadata;
  documentOrigins: readonly string[];
  staticResources: readonly BrowserReadNetworkRequestRule[];
  reviewedReads: readonly BrowserReadNetworkRequestRule[];
  skillPath?: string;
  /** Source-owned availability binding reused by its existing adapter and resolver. */
  availability?: {
    /** Auditable label. The registry intentionally does not constrain future provider labels. */
    provider: string;
    /** Source-owned routing preference for an already grounded candidate. */
    candidateBinding(candidate: RestaurantOutlet): "EXCLUSIVE" | "PREFERRED" | "NEUTRAL" | "INAPPLICABLE";
    /** Stable default order among otherwise neutral current providers. */
    availabilityPriority: number;
    /** Construct this Pack's existing availability adapter for one shared read run. */
    createProvider(context: SourcePackAvailabilityProviderContext): RestaurantAvailabilityProvider;
    /**
     * A thin, source-owned URL builder. `target` is opaque to the shared
     * resolver: only the Pack that observed it may interpret its shape.
     */
    buildRequestUrl(input: { candidate: RestaurantOutlet; request: RestaurantAvailabilityRequest; target?: unknown; outletName?: string }): string | undefined;
    ground(candidate: RestaurantCandidate, request: RestaurantAvailabilityRequest, observation: UntrustedProviderAvailabilityObservation, now: string): GroundedAvailability;
  };
  browser?: BrowserDiscoveryPackCapability;
  buildQuery(query: DiscoveryQuery): SourcePackQuery;
  parseListing(snapshot: BrowserSnapshot): SourcePackListing;
}

function rawTabelogLinks(page: BrowserSnapshot): number {
  const links = new Set<string>();
  for (const match of page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    try {
      const url = new URL((match[1] ?? "").replaceAll("&amp;", "&"), page.url);
      if (url.origin === "https://tabelog.com" && /^\/(?:en\/)?tokyo\/A\d+\/A\d+\/\d+\/?$/.test(url.pathname)) links.add(`${url.origin}${url.pathname.replace(/\/$/, "")}`);
    } catch { /* Invalid links are not source outlets. */ }
  }
  return links.size;
}

function rawTableCheckLinks(page: BrowserSnapshot): number {
  const links = new Set<string>();
  for (const match of page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    try {
      const url = new URL((match[1] ?? "").replaceAll("&amp;", "&"), page.url);
      if (url.origin === "https://www.tablecheck.com" && /^\/(?:en|ja)\/(?!japan\/|shops\/)[^/]+\/?$/.test(url.pathname)) links.add(`${url.origin}${url.pathname.replace(/\/$/, "")}`);
    } catch { /* Invalid links are not source outlets. */ }
  }
  return links.size;
}

function compactDirectoryText(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function directoryListingRoot(value: string): string | undefined {
  try {
    const url = new URL(value);
    const index = url.pathname.indexOf("/rstLst/");
    return url.origin === "https://tabelog.com" && index >= 0 ? url.pathname.slice(0, index + "/rstLst/".length) : undefined;
  } catch { return undefined; }
}

function regionalDirectoryHomepage(value: string): string | undefined {
  try {
    const url = new URL(value);
    const marker = "/rstLst/";
    const index = url.pathname.indexOf(marker);
    return url.origin === "https://tabelog.com" && index >= 0 ? `${url.origin}${url.pathname.slice(0, index + 1)}` : undefined;
  } catch { return undefined; }
}

function directoryListingLinks(page: BrowserSnapshot): Array<{ url: string; label: string; attributes: string; category: boolean }> {
  const root = directoryListingRoot(page.url);
  return [...page.html.matchAll(/<a\b([^>]*\bhref=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    try {
      const url = new URL(match[2]!.replaceAll("&amp;", "&"), page.url);
      const label = match[3]!.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return root && url.origin === "https://tabelog.com" && url.pathname.startsWith(root)
        ? [{ url: url.toString(), label, attributes: match[1]!, category: /^\D[^/]*\/$/.test(url.pathname.slice(root.length)) }] : [];
    } catch { return []; }
  });
}

function observedDirectoryRegion(page: BrowserSnapshot, label: string): string | undefined {
  const target = compactDirectoryText(label);
  if (!target) return undefined;
  const links = [...page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    const text = (match[2] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    try {
      const url = new URL((match[1] ?? "").replaceAll("&amp;", "&"), page.url);
      const listingRoot = directoryListingRoot(url.toString());
      const homepage = listingRoot ? regionalDirectoryHomepage(url.toString()) : undefined;
      // A directory label must name its own non-national listing entrance.
      // Do not use a mention of an area within an arbitrary national/category
      // anchor as permission to reset the current source region.
      return url.origin === "https://tabelog.com" && listingRoot && homepage
        && homepage !== "https://tabelog.com/en/" && homepage !== "https://tabelog.com/en/tokyo/"
        ? [{ url: url.toString(), text: compactDirectoryText(text) }] : [];
    } catch { return []; }
  });
  return links.find((link) => link.text === target)?.url;
}

/** Tabelog's observed region root stays pack data, never a shared-core route. */
type TabelogObservedRegion = {
  labels: readonly string[];
  url: string;
  /** A typed geographic anchor can select a source partition without changing the user location. */
  anchor?: { latitude: number; longitude: number; maximumDistanceMeters: number };
};

const tabelogRegions: readonly TabelogObservedRegion[] = [
  // Source-observed regional entrances. `labels` are independently grounded
  // civic representations, never a fuzzy page-text match or nearest-region
  // heuristic. Exact candidate radius grounding remains downstream.
  { labels: ["shibuya"], url: "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/" },
  // Renewal round one observed this public Shinjuku City entrance and Google
  // supplied the matching LOCALITY/POLITICAL civic representation for
  // Shinjuku. It does not establish any station or establishment mapping.
  { labels: ["shinjuku", "shinjuku city"], url: "https://tabelog.com/en/tokyo/C13104/rstLst/" },
  // C0 observed this Ginza listing entrance. The renewed one-request Google
  // read located the Higashi-ginza station anchor in a typed Ginza
  // sublocality. This only selects an upstream source partition for the same
  // frozen anchor (or the evaluation point within 100m); it neither aliases a
  // station to a civic place nor expands the downstream candidate radius.
  { labels: [], url: "https://tabelog.com/en/tokyo/A1301/A130101/rstLst/", anchor: { latitude: 35.6697003, longitude: 139.7671399, maximumDistanceMeters: 100 } },
];

function distanceMeters(first: { latitude: number; longitude: number }, second: { latitude: number; longitude: number }): number {
  return 111_320 * Math.hypot(first.latitude - second.latitude, (first.longitude - second.longitude) * Math.cos(((first.latitude + second.latitude) / 2) * Math.PI / 180));
}

function tabelogRegion(query: DiscoveryQuery): string | undefined {
  const label = query.location.label.toLocaleLowerCase("en-US");
  const labelRegion = (query.location.areaMatchBasis === "TASK_LOCATION_RADIUS" || query.location.areaMatchBasis === "NAMED_PLACE_RADIUS")
    ? tabelogRegions.find((region) => region.labels.includes(label))
    : undefined;
  if (labelRegion) return labelRegion.url;
  // Pack-owned typed anchor relations are deliberately narrow. They map the
  // observed anchor to a source recall partition only; no local radius-filter
  // result becomes evidence that the source query covered the whole circle.
  return tabelogRegions.find((region) => region.anchor
    && distanceMeters(query.location, region.anchor) <= region.anchor.maximumDistanceMeters)?.url;
}

function tabelogListing(snapshot: BrowserSnapshot): SourcePackListing {
  const root = new URL(snapshot.url);
  const prefix = root.pathname.includes("/rstLst/") ? root.pathname.slice(0, root.pathname.indexOf("/rstLst/") + "/rstLst/".length) : undefined;
  const outlets = parseTabelogSearchOutlets(snapshot);
  const next = [...snapshot.html.matchAll(/<a\b([^>]*\b(?:href|rel)=["'][^"']+["'][^>]*)>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    const text = (match[2] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const href = (match[1] ?? "").match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (!href || /aria-disabled=["']true|\bis-disabled\b/i.test(match[1] ?? "") || !/\brel=["']next["']|^(?:Next|次へ)/i.test(`${match[1]} ${text}`)) return [];
    try {
      const url = new URL(href.replaceAll("&amp;", "&"), snapshot.url);
      return url.origin === root.origin && prefix && url.pathname.startsWith(prefix) ? [url.toString()] : [];
    } catch { return []; }
  })[0];
  return { outlets, ...(next ? { nextPage: next } : {}) };
}

function tableCheckListing(snapshot: BrowserSnapshot): SourcePackListing {
  const outlets = parseTableCheckDiscoveryOutletUrls(snapshot, "").flatMap((sourceUrl) => {
    try {
      const sourceEntityId = new URL(sourceUrl).pathname
        .replace(/^\/(?:en|ja)\//, "").replace(/\/reserve(?:\/landing)?\/?$/, "").replace(/^\/+|\/+$/g, "");
      return sourceEntityId ? [{ sourceEntityId, sourceUrl, outletName: sourceEntityId }] : [];
    } catch { return []; }
  });
  return { outlets };
}

function websiteOrigin(candidate: RestaurantOutlet): string | undefined {
  try { return candidate.sourceIds.googleWebsiteUri ? new URL(candidate.sourceIds.googleWebsiteUri).hostname.toLowerCase() : undefined; } catch { return undefined; }
}

function tabelogAvailabilityBinding(candidate: RestaurantOutlet): "EXCLUSIVE" | "PREFERRED" | "NEUTRAL" | "INAPPLICABLE" {
  if (candidate.sourceIds.tabelogNativeDetailUri) return candidate.sourceIds.tablecheckNativeGuideUri ? "INAPPLICABLE" : "EXCLUSIVE";
  return websiteOrigin(candidate) === "tabelog.com" || websiteOrigin(candidate) === "www.tabelog.com" ? "PREFERRED" : "NEUTRAL";
}

function tableCheckAvailabilityBinding(candidate: RestaurantOutlet): "EXCLUSIVE" | "PREFERRED" | "NEUTRAL" | "INAPPLICABLE" {
  if (candidate.sourceIds.tablecheckNativeGuideUri) return candidate.sourceIds.tabelogNativeDetailUri ? "INAPPLICABLE" : "EXCLUSIVE";
  return websiteOrigin(candidate) === "tablecheck.com" || websiteOrigin(candidate) === "www.tablecheck.com" ? "PREFERRED" : "NEUTRAL";
}

function tabelogAvailabilitySearchUrl(candidate: RestaurantOutlet, outletName = candidate.outletName): string {
  const region = /(?:\bTokyo\b|東京都)/i.test(candidate.address) ? "tokyo/" : "";
  return `https://tabelog.com/en/${region}rstLst/?sw=${encodeURIComponent(outletName)}`;
}

export const tabelogDiscoveryPack: DiscoverySourcePack = {
  meta: { id: "tabelog", capabilities: ["DISCOVERY", "FACTS", "AVAILABILITY"], reservationOnly: false, supportsGroups: false, supportsSameDay: true, basePriority: 30 },
  documentOrigins: ["https://tabelog.com"], staticResources: tabelogPublicReadNetworkPolicy.staticResources, reviewedReads: tabelogPublicReadNetworkPolicy.dynamicReads,
  skillPath: "web-skills/tabelog/SKILL.md",
  availability: {
    provider: "TABELOG",
    candidateBinding: tabelogAvailabilityBinding,
    availabilityPriority: 10,
    createProvider: (context) => new TabelogBrowserAvailability(context.executor, context.now, context.maxCandidateMatches, {
      ...(context.maxBrowserSessions !== undefined ? { maxBrowserSessions: context.maxBrowserSessions } : {}),
      ...(context.onTabelogIdentityDiagnostic ? { onIdentityDiagnostic: context.onTabelogIdentityDiagnostic } : {}),
      ...(context.onTabelogUserInterventionRequired ? { onUserInterventionRequired: context.onTabelogUserInterventionRequired } : {}),
      ...(context.networkPolicy ? { networkPolicy: context.networkPolicy } : {}),
    }),
    buildRequestUrl: ({ candidate, outletName }) => tabelogAvailabilitySearchUrl(candidate, outletName),
    ground: (candidate, request, observation, now) => groundTabelogAvailability(candidate, request, observation, now),
  },
  browser: {
    flow: "DIRECTORY", provider: "TABELOG", listingPageChunkCap: 3,
    countRawLinks: rawTabelogLinks,
    acceptsDetailUrl: (value) => { try { return new URL(value).origin === "https://tabelog.com"; } catch { return false; } },
    candidateSourceIds: (sourceEntityId, detailUrl) => ({ tabelog: sourceEntityId, tabelogNativeDetailUri: detailUrl, discoverySourceId: "tabelog", discoveryDetailUri: detailUrl }),
    sourceEntityIdForUrl: (value) => { try { return new URL(value).pathname.replace(/^\/+|\/+$/g, "") || undefined; } catch { return undefined; } },
    hasChallenge: hasBotChallenge,
    isPageUnavailable: () => false,
    isExplicitEmptyListing: (snapshot) => /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(snapshot.text),
    parseDetailIdentity(snapshot, fallback) {
      const extracted = parseTabelogOutletIdentityWithEvidence(snapshot, fallback);
      const outlet = extracted.outlet;
      if (!outlet.address || extracted.fields.outletName.source === "SEARCH_RESULT" || extracted.fields.address.source === "SEARCH_RESULT" || extracted.fields.address.source === "ABSENT" || outlet.sourceEntityId !== fallback.sourceEntityId) return undefined;
      return outlet;
    },
    directory: {
      listingRoot: directoryListingRoot,
      observedRegion: observedDirectoryRegion,
      links: directoryListingLinks,
      withRetrievalExpression(value, expression) { const url = new URL(value); url.searchParams.set("sw", expression); return url.toString(); },
      retrievalExpression(value) { try { return new URL(value).searchParams.get("sw") ?? undefined; } catch { return undefined; } },
      withoutRetrievalExpression(value) { const url = new URL(value); url.searchParams.delete("sw"); return url.toString(); },
      isExplicitEmpty: (page) => /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(page.text),
      isSameObservedRegionHomepage(observedListingUrl, currentUrl) {
        const expected = regionalDirectoryHomepage(observedListingUrl);
        try { const current = new URL(currentUrl); return expected === `${current.origin}${current.pathname}`; } catch { return false; }
      },
      isObservedRegionHomepageListing(page, observedListingUrl) {
        return this.isSameObservedRegionHomepage?.(observedListingUrl, page.url) === true
          && tabelogListing(page).outlets.length > 0;
      },
      observedListingFromRegionHomepage(page, observedListingUrl) {
        const expectedHomepage = regionalDirectoryHomepage(observedListingUrl);
        const expectedListingRoot = directoryListingRoot(observedListingUrl);
        if (!expectedHomepage || !expectedListingRoot) return undefined;
        return [...page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].flatMap((match) => {
          try {
            const url = new URL((match[1] ?? "").replaceAll("&amp;", "&"), page.url);
            // A homepage may expose subarea/category links before its own
            // unfiltered directory. Only the exact originally observed
            // listing root restores this query; a different prefix would
            // silently change the current region or retrieval scope.
            return url.origin === "https://tabelog.com" && `${url.origin}${url.pathname}`.startsWith(expectedHomepage)
              && url.pathname === expectedListingRoot && !url.search && !url.hash
              ? [url.toString()] : [];
          } catch { return []; }
        })[0];
      },
    },
  },
  buildQuery(query) {
    const observedRegion = tabelogRegion(query);
    return {
      url: observedRegion ?? "https://tabelog.com/en/tokyo/rstLst/",
      retrievalExpression: query.keyword ?? "",
      areaEntrance: observedRegion ? "SOURCE_OBSERVED" : "OBSERVE_SOURCE_REGION",
    };
  },
  parseListing: tabelogListing,
};

export const tableCheckDiscoveryPack: DiscoverySourcePack = {
  meta: { id: "tablecheck", capabilities: ["DISCOVERY", "FACTS", "AVAILABILITY"], reservationOnly: true, supportsGroups: true, supportsSameDay: true, basePriority: 20 },
  documentOrigins: ["https://www.tablecheck.com"], staticResources: tableCheckPublicReadNetworkPolicy.staticResources, reviewedReads: tableCheckPublicReadNetworkPolicy.dynamicReads,
  skillPath: "web-skills/tablecheck/SKILL.md",
  availability: {
    provider: "TABLECHECK",
    candidateBinding: tableCheckAvailabilityBinding,
    availabilityPriority: 20,
    createProvider: (context) => new TableCheckBrowserAvailability(context.executor, context.now, {
      ...(context.maxBrowserSessions !== undefined ? { maxBrowserSessions: context.maxBrowserSessions } : {}),
      entryLedger: context.tableCheckEntryLedger,
      ...(context.onTableCheckIdentityDiagnostic ? { onIdentityDiagnostic: context.onTableCheckIdentityDiagnostic } : {}),
      ...(context.onTableCheckUserInterventionRequired ? { onUserInterventionRequired: context.onTableCheckUserInterventionRequired } : {}),
      ...(context.networkPolicy ? { networkPolicy: context.networkPolicy } : {}),
    }),
    buildRequestUrl: ({ candidate: _candidate, request, target }) => {
      if (!target || typeof target !== "object") return undefined;
      return tableCheckRequestedReservationUrl(target as TableCheckReservationTarget, request.date, request.partySize, request.timeWindow);
    },
    ground: (candidate, request, observation, now) => groundTableCheckAvailability(candidate, request, observation, now),
  },
  browser: {
    flow: "VENUE_SEARCH", provider: "TABLECHECK", listingPageChunkCap: 1,
    countRawLinks: rawTableCheckLinks,
    acceptsDetailUrl: (value) => { try { return new URL(value).origin === "https://www.tablecheck.com"; } catch { return false; } },
    candidateSourceIds: (sourceEntityId, detailUrl) => ({ tablecheck: sourceEntityId, tablecheckNativeGuideUri: detailUrl, discoverySourceId: "tablecheck", discoveryDetailUri: detailUrl }),
    sourceEntityIdForUrl: (value) => { try { return new URL(value).pathname.replace(/^\/(?:en|ja)\//, "").replace(/\/reserve(?:\/landing)?\/?$/, "").replace(/^\/+|\/+$/g, "") || undefined; } catch { return undefined; } },
    hasChallenge: hasTableCheckBotChallenge,
    isPageUnavailable: (snapshot) => inspectTableCheckPageUnavailable(snapshot).pageUnavailable,
    isExplicitEmptyListing: hasTableCheckDiscoveryNoResult,
    parseDetailIdentity(snapshot, fallback) {
      const extracted = parseTableCheckOutletIdentityWithEvidence(snapshot, fallback.sourceUrl);
      const outlet = extracted?.outlet;
      if (!outlet || !outlet.address || extracted.fields.outletName.source === "ABSENT" || extracted.fields.address.source === "ABSENT") return undefined;
      return outlet;
    },
  },
  buildQuery(query) {
    const url = new URL("https://www.tablecheck.com/en/japan/search");
    url.searchParams.set("service_mode", "dining"); url.searchParams.set("sort_by", "relevance"); url.searchParams.set("venue_type", "tc");
    url.searchParams.set("geo_latitude", String(query.location.latitude)); url.searchParams.set("geo_longitude", String(query.location.longitude));
    // This is a source recall bound. Exact-radius admission remains in the
    // existing grounding path before any candidate is accepted.
    url.searchParams.set("geo_distance", `${Math.max(1, Math.ceil(query.location.radiusMeters / 1000))}km`); url.searchParams.set("auto_geolocate", "false");
    // Category stays structured for pack selection. Only a positive HARD term
    // becomes a public text-search expression.
    const expression = query.keyword ?? "";
    if (expression) url.searchParams.set("search_text", expression);
    return { url: url.toString(), retrievalExpression: expression, areaEntrance: "SOURCE_OBSERVED" };
  },
  parseListing: tableCheckListing,
};

/** Google remains a source-plan participant; its transport and grounding stay in its existing adapter. */
export const googlePlacesDiscoveryPack: DiscoverySourcePack = {
  // Nearby Search establishes category and circle support.  It does not
  // establish group-capacity support, so group requests keep the existing
  // booking-capable sources ahead of this discovery-only pack.
  meta: { id: "google-places", capabilities: ["DISCOVERY", "FACTS"], reservationOnly: false, supportsGroups: false, basePriority: 10 },
  documentOrigins: [], staticResources: [], reviewedReads: [],
  buildQuery(query) {
    // Nearby Search is the documented structured path when there is no
    // positive HARD retrieval term.  It preserves the actual circle/radius
    // rather than turning date, party, or an exclusion into prose.
    if (!query.keyword) return { url: "google-places:nearby-search", retrievalExpression: query.category, mode: "NEARBY", areaEntrance: "SOURCE_OBSERVED" };
    return { url: "google-places:text-search", retrievalExpression: `${query.keyword} ${query.location.label}`, mode: "TEXT", areaEntrance: "SOURCE_OBSERVED" };
  },
  parseListing() { return { outlets: [] }; },
};

export const restaurantDiscoveryPacks: readonly DiscoverySourcePack[] = [tabelogDiscoveryPack, tableCheckDiscoveryPack, googlePlacesDiscoveryPack];

export function discoveryPackById(id: string, packs: readonly DiscoverySourcePack[] = restaurantDiscoveryPacks): DiscoverySourcePack | undefined {
  return packs.find((pack) => pack.meta.id === id);
}

export function discoveryPackNetworkPolicy(packs: readonly DiscoverySourcePack[] = restaurantDiscoveryPacks): BrowserReadNetworkPolicy {
  return {
    documentOrigins: packs.flatMap((pack) => pack.documentOrigins),
    staticResources: packs.flatMap((pack) => pack.staticResources),
    dynamicReads: packs.flatMap((pack) => pack.reviewedReads),
    genericPublicRead: true,
  };
}
