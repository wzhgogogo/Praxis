import type { DiscoveryPackMetadata, DiscoveryQuery } from "../../domains/restaurant/discovery-planner.js";
import type { GroundedAvailability, UntrustedProviderAvailabilityObservation } from "../../domains/restaurant/read-grounding.js";
import { groundTabelogAvailability, groundTableCheckAvailability } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantAvailabilityRequest, RestaurantCandidate, RestaurantOutlet, RestaurantReadEvidenceProvider } from "../../domains/restaurant/contracts.js";
import type { BrowserPageControl, BrowserReadNetworkPolicy, BrowserReadNetworkRequestRule, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { tabelogPublicReadNetworkPolicy } from "../tabelog/tabelog-public-query.js";
import { tableCheckPublicReadNetworkPolicy } from "../tablecheck/tablecheck-public-query.js";
import { tableCheckRequestedReservationUrl, type TableCheckReservationTarget } from "../tablecheck/tablecheck-page-parser.js";
import { hasBotChallenge, parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets, tabelogSearchResultBusy } from "../tabelog/tabelog-page-parser.js";
import { hasTableCheckBotChallenge, hasTableCheckDiscoveryNoResult, tableCheckSearchResultBusy, inspectTableCheckPageUnavailable, parseTableCheckDiscoveryOutletUrls, parseTableCheckOutletIdentityWithEvidence } from "../tablecheck/tablecheck-page-parser.js";
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
  sourceCategories?: string[];
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
  countRawLinks(snapshot: BrowserSnapshot): number;
  acceptsDetailUrl(url: string): boolean;
  candidateSourceIds(sourceEntityId: string, detailUrl: string): Record<string, string>;
  sourceEntityIdForUrl(url: string): string | undefined;
  hasChallenge(snapshot: BrowserSnapshot): boolean;
  isPageUnavailable(snapshot: BrowserSnapshot): boolean;
  isExplicitEmptyListing(snapshot: BrowserSnapshot): boolean;
  resultBusy(snapshot: BrowserSnapshot): boolean;
  retrievalExpression(url:string):string|undefined;
  parseDetailIdentity(snapshot: BrowserSnapshot, fallback: SourcePackListingOutlet): SourcePackListingOutlet | undefined;
  /** Search hints never grant availability evidence or qualification. */
  searchAvailability?: {disabledReason: string} | {
    withRequest(url: string, request: {date:string;time:string;partySize:number}, observedListingUrl?: string): string | undefined;
    observe(snapshot: BrowserSnapshot, controls: readonly BrowserPageControl[]): {date?:string;time?:string;partySize?:number};
  };
  directory?: {
    listingRoot(url: string): string | undefined;
    isRegionEntrance(url: string): boolean;
    links(page: BrowserSnapshot): Array<{ url: string; label: string; attributes: string; category: boolean }>;
    /** Pack-owned URL grammar for a bounded listing retrieval expression. */
    withRetrievalExpression(url: string, expression: string): string;
    withoutRetrievalExpression(url: string): string;
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
    return url.origin === "https://tabelog.com" ? index >= 0 ? `${url.origin}${url.pathname.slice(0, index + 1)}` : /^\/en\/[^/]+\/(?:A\d+|C\d+|R\d+)(?:\/(?:A\d+|C\d+|R\d+))*\/$/.test(url.pathname) ? `${url.origin}${url.pathname}` : undefined : undefined;
  } catch { return undefined; }
}

function directoryListingLinks(page: BrowserSnapshot): Array<{ url: string; label: string; attributes: string; category: boolean }> {
  const homepage = regionalDirectoryHomepage(page.url);
  const root = directoryListingRoot(page.url) ?? (homepage ? `${new URL(homepage).pathname}rstLst/` : undefined);
  return [...page.html.matchAll(/<a\b([^>]*\bhref=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/a>/gi)].flatMap((match) => {
    try {
      const url = new URL(match[2]!.replaceAll("&amp;", "&"), page.url);
      const label = match[3]!.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      return root && url.origin === "https://tabelog.com" && url.pathname.startsWith(root)
        ? [{ url: url.toString(), label, attributes: match[1]!, category: /^\D[^/]*\/$/.test(url.pathname.slice(root.length)) }] : [];
    } catch { return []; }
  });
}

/** Retain only category-labelled text inside one observed outlet card, never neighbouring cards. */
function listingCategories(snapshot: BrowserSnapshot, sourceUrl: string, knownUrls: readonly string[]): string[] {
  const result = new Set<string>();
  const stack: Array<{ tag: string; start: number; attributes: string }> = [];
  for (const token of snapshot.html.matchAll(/<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<\/?([a-z][\w-]*)\b([^>]*)>/gi)) {
    const text = token[0], tag = token[1]?.toLowerCase();
    if (!tag) continue;
    if (!text.startsWith('</')) {
      if (!['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'].includes(tag) && !text.endsWith('/>')) stack.push({tag,start:token.index,attributes:token[2]??''});
      continue;
    }
    const index = stack.map(node => node.tag).lastIndexOf(tag);
    if (index < 0) continue;
    const node = stack[index]!; stack.length = index;
    if (!['li','article','section'].includes(tag) && !/(?:card|list-rst)/i.test(node.attributes)) continue;
    const card = snapshot.html.slice(node.start, token.index+text.length);
    const observed = new Set([...card.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].flatMap(match => {
      try { const url = new URL(match[1]!.replaceAll('&amp;', '&'), snapshot.url); url.search = ''; url.hash = ''; return knownUrls.includes(url.toString()) ? [url.toString()] : []; } catch {return [];}
    }));
    if (observed.size !== 1 || !observed.has(sourceUrl)) continue;
    for (const category of card.matchAll(/<([a-z][\w-]*)\b([^>]*(?:class|data-category|data-cuisine)=["'][^"']*(?:cuisine|genre|category)[^"']*["'][^>]*)>([\s\S]{0,2000}?)<\/\1>/gi)) {
      if (/hidden|aria-hidden=["']true|display\s*:\s*none/i.test(category[2]??'')) continue;
      const value=(category[3]??'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
      if (value && value.length <= 240) result.add(value);
    }
  }
  return [...result].slice(0, 12);
}

function tabelogListing(snapshot: BrowserSnapshot): SourcePackListing {
  const root = new URL(snapshot.url);
  const prefix = root.pathname.includes("/rstLst/") ? root.pathname.slice(0, root.pathname.indexOf("/rstLst/") + "/rstLst/".length) : undefined;
  const parsed = parseTabelogSearchOutlets(snapshot);
  const outlets = parsed.map(outlet => ({...outlet, sourceCategories:listingCategories(snapshot,outlet.sourceUrl,parsed.map(item=>item.sourceUrl))}));
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
  return { outlets: outlets.map(outlet=>({...outlet,sourceCategories:listingCategories(snapshot,outlet.sourceUrl,outlets.map(item=>item.sourceUrl))})) };
}

function websiteOrigin(candidate: RestaurantOutlet): string | undefined {
  try { return candidate.sourceIds.googleWebsiteUri ? new URL(candidate.sourceIds.googleWebsiteUri).hostname.toLowerCase() : undefined; } catch { return undefined; }
}

function observedSelect(controls: readonly BrowserPageControl[], name: string): string | undefined {
  const matches=controls.filter(control=>control.visible && control.kind==='SELECT' && control.structure?.name===name);
  return matches.length===1 ? matches[0]!.value : undefined;
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
    searchAvailability: {
      withRequest(value,request,observedListingUrl) {
        const url=new URL(value);
        if(url.origin!=='https://tabelog.com'||!/[03]0$/.test(request.time))return undefined;
        if(!directoryListingRoot(value)) {
          const root=observedListingUrl && directoryListingRoot(observedListingUrl);
          if(!root || regionalDirectoryHomepage(observedListingUrl!)!==`${url.origin}${url.pathname}`)return undefined;
          url.pathname=root;
        }
        for(const [key,value] of Object.entries({vac_net:'1',svd:request.date.replaceAll('-',''),svt:request.time.replace(':',''),svps:String(request.partySize)}))url.searchParams.set(key,value);
        return url.toString();
      },
      observe(snapshot,controls) {
        const dates=[...snapshot.html.matchAll(/<span\b[^>]*>/gi)].map(m=>m[0]).filter(tag=>/\bclass=["'][^"']*\bjs-list-sidebar-cal-date\b[^"']*["']/.test(tag)&&/\bclass=["'][^"']*\bis-current\b[^"']*["']/.test(tag)).map(tag=>tag.match(/\bdata-date=["'](\d{8})["']/)?.[1]);
        const date=dates.length===1?dates[0]?.replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3'):undefined;
        const party=observedSelect(controls,'svps'),clock=observedSelect(controls,'svt');
        return {...(date?{date}:{}),...(party?{partySize:Number(party)}:{}),...(clock&&/^\d{4}$/.test(clock)?{time:clock.slice(0,2)+':'+clock.slice(2)}:{})};
      },
    },
    retrievalExpression: value=>new URL(value).searchParams.get("sw")??undefined,
    flow: "DIRECTORY", provider: "TABELOG",
    countRawLinks: rawTabelogLinks,
    acceptsDetailUrl: (value) => { try { return new URL(value).origin === "https://tabelog.com"; } catch { return false; } },
    candidateSourceIds: (sourceEntityId, detailUrl) => ({ tabelog: sourceEntityId, tabelogNativeDetailUri: detailUrl, discoverySourceId: "tabelog", discoveryDetailUri: detailUrl }),
    sourceEntityIdForUrl: (value) => { try { return new URL(value).pathname.replace(/^\/+|\/+$/g, "") || undefined; } catch { return undefined; } },
    hasChallenge: hasBotChallenge,
    isPageUnavailable: () => false,
    resultBusy: tabelogSearchResultBusy,
    isExplicitEmptyListing: (snapshot) => /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(snapshot.text),
    parseDetailIdentity(snapshot, fallback) {
      const extracted = parseTabelogOutletIdentityWithEvidence(snapshot, fallback);
      const outlet = extracted.outlet;
      if (!outlet.address || extracted.fields.outletName.source === "SEARCH_RESULT" || extracted.fields.address.source === "SEARCH_RESULT" || extracted.fields.address.source === "ABSENT" || outlet.sourceEntityId !== fallback.sourceEntityId) return undefined;
      return outlet;
    },
    directory: {
      listingRoot: directoryListingRoot,
      isRegionEntrance(value) { try { const url = new URL(value); return url.origin === "https://tabelog.com" && /^\/en\/[^/]+\/(?:A\d+|C\d+|R\d+)(?:\/(?:A\d+|C\d+|R\d+))*\/(?:rstLst\/)?$/.test(url.pathname); } catch { return false; } },
      links: directoryListingLinks,
      withRetrievalExpression(value, expression) { const url = new URL(value); url.searchParams.set("sw", expression); return url.toString(); },
      withoutRetrievalExpression(value) { const url = new URL(value); url.searchParams.delete("sw"); return url.toString(); },
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
    return {
      url: "https://tabelog.com/en/tokyo/rstLst/",
      retrievalExpression: query.keyword ?? "",
      areaEntrance: "OBSERVE_SOURCE_REGION",
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
    searchAvailability: {disabledReason:'FILTER_TRANSPORT_NOT_REVIEWED'},
    retrievalExpression: value=>new URL(value).searchParams.get("search_text")??undefined,
    flow: "VENUE_SEARCH", provider: "TABLECHECK",
    countRawLinks: rawTableCheckLinks,
    acceptsDetailUrl: (value) => { try { return new URL(value).origin === "https://www.tablecheck.com"; } catch { return false; } },
    candidateSourceIds: (sourceEntityId, detailUrl) => ({ tablecheck: sourceEntityId, tablecheckNativeGuideUri: detailUrl, discoverySourceId: "tablecheck", discoveryDetailUri: detailUrl }),
    sourceEntityIdForUrl: (value) => { try { return new URL(value).pathname.replace(/^\/(?:en|ja)\//, "").replace(/\/reserve(?:\/landing)?\/?$/, "").replace(/^\/+|\/+$/g, "") || undefined; } catch { return undefined; } },
    hasChallenge: hasTableCheckBotChallenge,
    isPageUnavailable: (snapshot) => inspectTableCheckPageUnavailable(snapshot).pageUnavailable,
    resultBusy: tableCheckSearchResultBusy,
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
