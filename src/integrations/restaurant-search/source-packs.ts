import type { ModelGateway } from "../../core/model/contracts.js";
import type { DiscoveryPackMetadata, DiscoveryQuery } from "../../domains/restaurant/discovery-planner.js";
import type { GroundedAvailability, UntrustedProviderAvailabilityObservation } from "../../domains/restaurant/read-grounding.js";
import { groundTabelogAvailability, groundTableCheckAvailability } from "../../domains/restaurant/read-grounding.js";
import type { RestaurantAvailabilityRequest, RestaurantCandidate, RestaurantOutlet, RestaurantReadEvidenceProvider, RestaurantReadEvidence } from "../../domains/restaurant/contracts.js";
import type { BrowserPageControl, BrowserReadNetworkPolicy, BrowserReadNetworkRequestRule, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { tabelogPublicReadNetworkPolicy } from "../tabelog/tabelog-public-query.js";
import { tableCheckPublicReadNetworkPolicy } from "../tablecheck/tablecheck-public-query.js";
import { hasTabelogSourceBusy, hasBotChallenge, parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets, tabelogSearchResultBusy } from "../tabelog/tabelog-page-parser.js";
import { hasTableCheckBotChallenge, hasTableCheckDiscoveryNoResult, tableCheckSearchResultBusy, inspectTableCheckPageUnavailable, parseTableCheckDiscoveryOutletUrls, parseTableCheckOutletIdentityWithEvidence } from "../tablecheck/tablecheck-page-parser.js";
import { inspectTabelogEntity } from "../tabelog/tabelog-entity-resolver.js";
import { inspectTableCheckEntity } from "../tablecheck/tablecheck-entity-resolver.js";
import { TableCheckBrowserAvailability, TableCheckEntryLedger } from "../tablecheck/tablecheck-browser-availability.js";
import type { TableCheckIdentityDiagnostic, TableCheckUserInterventionHandler } from "../tablecheck/tablecheck-contracts.js";
import { TabelogBrowserAvailability } from "../tabelog/tabelog-browser-availability.js";
import type { TabelogIdentityDiagnostic, TabelogUserInterventionHandler } from "../tabelog/tabelog-contracts.js";
import type { RestaurantAvailabilityProvider } from "../restaurant-availability/contracts.js";
import type { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { NamedSourceAlternative } from "./named-source-query.js";
import type { GooglePlacesSourceName } from "../google/google-places-contracts.js";

export interface SourcePackAvailabilityProviderContext {
  executor: BrowserTaskExecutor;
  /** Internal G4 fact read; never a persisted request or an inventory conclusion. */
  identityOnly?:boolean;
  /** Authoritative SPECIFIC_OUTLET wording, used only to retrieve identity. */
  targetQuery?:string;
  sourceFactsModel?: ModelGateway;
  now?: () => string;
  maxBrowserSessions?: number;
  maxCandidateMatches?: number;
  alternativeSearch?: NamedSourceAlternative;
  japaneseName?: (candidate: RestaurantCandidate, signal: AbortSignal) => Promise<GooglePlacesSourceName>;
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
  startupUrl?: string;
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
  /** Reuse this source's ordinary identity gate on already captured details; never performs I/O. */
  resolveDetailIdentity(candidate:RestaurantCandidate, outlets:readonly SourcePackListingOutlet[]):NonNullable<RestaurantReadEvidence["entityMatch"]> & {outlet?:SourcePackListingOutlet};

}
export interface DiscoverySourcePack {
  meta: DiscoveryPackMetadata;
  documentOrigins: readonly string[];
  /** Retain an otherwise suppressed resource only after ordinary Guard admission. */
  retainedResources?: readonly BrowserReadNetworkRequestRule[];
  staticResources: readonly BrowserReadNetworkRequestRule[];
  reviewedReads: readonly BrowserReadNetworkRequestRule[];
  /** Recording-only public SPA document projections; never network admission. */
  publicDocumentRoutes?: readonly BrowserReadNetworkRequestRule[];
  skillPath?: string;
  /** Source-owned availability binding reused by its existing adapter and resolver. */
  availability?: {
    /** Auditable label. The registry intentionally does not constrain future provider labels. */
    provider: string;
    /** Source-owned routing preference for an already grounded candidate. */
    candidateBinding(candidate: RestaurantOutlet): "EXCLUSIVE" | "PREFERRED" | "NEUTRAL" | "INAPPLICABLE";
    /** Advisory path cost only; never identity, HARD or inventory evidence. */
    candidatePath(candidate: RestaurantOutlet): "DIRECT_SOURCE_PAGE" | "NAME_RESOLUTION" | "NONE";
    /** Stable default order among otherwise neutral current providers. */
    availabilityPriority: number;
    /** Area candidates skip NAME_RESOLUTION; existing bound outlet paths and named requests are unchanged. */
    areaEvidenceRequired?: {notEvidencedReason: 'TABLECHECK_NOT_EVIDENCED'};
    /** Public source congestion, not an identity failure or bot challenge. */
    sourceBusy?: { matches(page: BrowserSnapshot): boolean; retryDelayMs: number };
    /** Construct this Pack's existing availability adapter for one shared read run. */
    createProvider(context: SourcePackAvailabilityProviderContext): RestaurantAvailabilityProvider;
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

function tabelogAvailabilityBinding(candidate: RestaurantOutlet): "EXCLUSIVE" | "PREFERRED" | "NEUTRAL" | "INAPPLICABLE" {
  if (candidate.sourceIds.tabelogNativeDetailUri) return candidate.sourceIds.tablecheckNativeGuideUri ? "INAPPLICABLE" : "EXCLUSIVE";
  return websiteOrigin(candidate) === "tabelog.com" || websiteOrigin(candidate) === "www.tabelog.com" ? "PREFERRED" : "NEUTRAL";
}

function tableCheckAvailabilityBinding(candidate: RestaurantOutlet): "EXCLUSIVE" | "PREFERRED" | "NEUTRAL" | "INAPPLICABLE" {
  if (candidate.sourceIds.tablecheckNativeGuideUri) return candidate.sourceIds.tabelogNativeDetailUri ? "INAPPLICABLE" : "EXCLUSIVE";
  return websiteOrigin(candidate) === "tablecheck.com" || websiteOrigin(candidate) === "www.tablecheck.com" ? "PREFERRED" : "NEUTRAL";
}

function isTabelogOutletUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port
      && url.hostname === "tabelog.com"
      && /^\/(?:[a-z]{2}\/)?[a-z-]+\/A\d+\/A\d+\/\d+(?:\/|$)/.test(url.pathname);
  } catch { return false; }
}

/** Preserve the numeric outlet and region path; locale/query/subpage are not identity. */
export function normalizeTabelogOutletUrl(value: string): string | undefined {
  if (!isTabelogOutletUrl(value)) return undefined;
  const path = new URL(value).pathname.match(/^\/(?:[a-z]{2}\/)?([a-z-]+\/A\d+\/A\d+\/\d+)(?:\/|$)/)?.[1];
  return path ? `https://tabelog.com/en/${path}/` : undefined;
}

function isTableCheckOutletUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port
      && url.hostname === "www.tablecheck.com"
      && /^\/(?:en|ja)\/(?:shops\/)?(?!japan(?:\/|$)|search(?:\/|$)|login(?:\/|$))[a-z0-9][a-z0-9-]+(?:\/(?:reserve(?:\/.*)?)?)?\/?$/.test(url.pathname);
  } catch { return false; }
}

/** Consult actual availability Packs, preserving candidate order and qualification. */
export function candidateAvailabilityPath(candidate: RestaurantOutlet, packs: readonly DiscoverySourcePack[] = restaurantDiscoveryPacks): "DIRECT_SOURCE_PAGE" | "NAME_RESOLUTION" | "NONE" {
  const paths = packs.flatMap(pack => pack.availability ? [pack.availability.candidatePath(candidate)] : []);
  return paths.includes("DIRECT_SOURCE_PAGE") ? "DIRECT_SOURCE_PAGE" : paths.includes("NAME_RESOLUTION") ? "NAME_RESOLUTION" : "NONE";
}

export const tabelogDiscoveryPack: DiscoverySourcePack = {
  meta: { id: "tabelog", capabilities: ["DISCOVERY", "FACTS", "AVAILABILITY"], reservationOnly: false, supportsGroups: false, supportsSameDay: true, basePriority: 30 },
  documentOrigins: ["https://tabelog.com"], staticResources: tabelogPublicReadNetworkPolicy.staticResources, reviewedReads: tabelogPublicReadNetworkPolicy.dynamicReads,
  skillPath: "web-skills/tabelog/SKILL.md",
  availability: {
    provider: "TABELOG",
    sourceBusy: { matches: hasTabelogSourceBusy, retryDelayMs: 1_000 },
    candidateBinding: tabelogAvailabilityBinding,
    candidatePath: candidate => tabelogAvailabilityBinding(candidate) === "INAPPLICABLE" ? "NONE"
      : [candidate.sourceIds.tabelogNativeDetailUri, candidate.sourceIds.googleWebsiteUri].some(isTabelogOutletUrl)
        ? "DIRECT_SOURCE_PAGE" : "NAME_RESOLUTION",
    availabilityPriority: 10,
    createProvider: (context) => new TabelogBrowserAvailability(context.executor, context.now, context.maxCandidateMatches, {
      ...(context.identityOnly?{identityOnly:true}:{}),
      ...(context.sourceFactsModel ? { sourceFactsModel: context.sourceFactsModel } : {}),
      ...(context.alternativeSearch ? { alternativeSearch: context.alternativeSearch } : {}),
      ...(context.japaneseName ? { japaneseName: context.japaneseName } : {}),
      ...(context.maxBrowserSessions !== undefined ? { maxBrowserSessions: context.maxBrowserSessions } : {}),
      ...(context.onTabelogIdentityDiagnostic ? { onIdentityDiagnostic: context.onTabelogIdentityDiagnostic } : {}),
      ...(context.onTabelogUserInterventionRequired ? { onUserInterventionRequired: context.onTabelogUserInterventionRequired } : {}),
      ...(context.networkPolicy ? { networkPolicy: context.networkPolicy } : {}),
    }),
    ground: (candidate, request, observation, now) => groundTabelogAvailability(candidate, request, observation, now),
  },
  browser: {
    startupUrl: tabelogPublicReadNetworkPolicy.startupDocuments![0]!,
    retrievalExpression: value => new URL(value).searchParams.get("sw") ?? undefined,
    flow: "DIRECTORY", provider: "TABELOG",
    countRawLinks: rawTabelogLinks,
    acceptsDetailUrl: (value) => { try { return new URL(value).origin === "https://tabelog.com"; } catch { return false; } },
    candidateSourceIds: (sourceEntityId, detailUrl) => ({ tabelog: sourceEntityId, tabelogNativeDetailUri: detailUrl, discoverySourceId: "tabelog", discoveryDetailUri: detailUrl }),
    sourceEntityIdForUrl: (value) => { try { return new URL(value).pathname.replace(/^\/+|\/+$/g, "") || undefined; } catch { return undefined; } },
    hasChallenge: hasBotChallenge,
    isPageUnavailable: () => false,
    resultBusy: tabelogSearchResultBusy,
    isExplicitEmptyListing: (snapshot) => /\b(?:no|0)\s+(?:restaurants?|results?)\s+(?:found|match(?:es)?)/i.test(snapshot.text),
    resolveDetailIdentity: (candidate, outlets) => inspectTabelogEntity(candidate, [...outlets]).resolution,
    parseDetailIdentity(snapshot, fallback) {
      const extracted = parseTabelogOutletIdentityWithEvidence(snapshot, fallback);
      const outlet = extracted.outlet;
      if (!outlet.address || extracted.fields.outletName.source === "SEARCH_RESULT" || extracted.fields.address.source === "SEARCH_RESULT" || extracted.fields.address.source === "ABSENT" || outlet.sourceEntityId !== fallback.sourceEntityId) return undefined;
      return outlet;
    },
  },
  buildQuery(query) {
    return {
      url: tabelogPublicReadNetworkPolicy.startupDocuments![0]!,
      retrievalExpression: query.keyword ?? "",
      areaEntrance: "OBSERVE_SOURCE_REGION",
    };
  },
  parseListing: tabelogListing,
};

export const tableCheckDiscoveryPack: DiscoverySourcePack = {
  meta: { id: "tablecheck", capabilities: ["DISCOVERY", "FACTS", "AVAILABILITY"], reservationOnly: true, supportsGroups: true, supportsSameDay: true, basePriority: 20 },
  documentOrigins: ["https://www.tablecheck.com"], staticResources: tableCheckPublicReadNetworkPolicy.staticResources, reviewedReads: tableCheckPublicReadNetworkPolicy.dynamicReads,
  publicDocumentRoutes: [{
    origin: "https://www.tablecheck.com", resourceTypes: ["document"],
    pathnamePattern: "^/(?:en|ja)/(?![0-9-]{10,}$)(?!(?:not-found|404|error|login|signin|account|checkout|payment|purchase|cancel|delete|confirm|booking|reserve|form|submit)$)[a-z0-9]+(?:-[a-z0-9]+)*$",
    queryKeyRules: { required: [], allowed: ["service_mode", "sort_by", "venue_type"] },
    queryValueClasses: {service_mode:["SHORT_TOKEN"],sort_by:["SHORT_TOKEN"],venue_type:["SHORT_TOKEN"]},
  }],
  skillPath: "web-skills/tablecheck/SKILL.md",
  availability: {
    provider: "TABLECHECK",
    areaEvidenceRequired: {notEvidencedReason:'TABLECHECK_NOT_EVIDENCED'},
    candidateBinding: tableCheckAvailabilityBinding,
    candidatePath: candidate => tableCheckAvailabilityBinding(candidate) === "INAPPLICABLE" ? "NONE"
      : [candidate.sourceIds.tablecheckNativeGuideUri, candidate.sourceIds.googleListedTableCheckUri, candidate.sourceIds.googleWebsiteUri].some(isTableCheckOutletUrl)
        ? "DIRECT_SOURCE_PAGE" : "NAME_RESOLUTION",
    availabilityPriority: 20,
    createProvider: (context) => new TableCheckBrowserAvailability(context.executor, context.now, {
      ...(context.identityOnly?{identityOnly:true}:{}),
      ...(context.targetQuery?{targetQuery:context.targetQuery}:{}),
      ...(context.sourceFactsModel ? { sourceFactsModel: context.sourceFactsModel } : {}),
      ...(context.alternativeSearch ? { alternativeSearch: context.alternativeSearch } : {}),
      ...(context.maxCandidateMatches !== undefined ? { maxCandidateMatches: context.maxCandidateMatches } : {}),
      ...(context.maxBrowserSessions !== undefined ? { maxBrowserSessions: context.maxBrowserSessions } : {}),
      entryLedger: context.tableCheckEntryLedger,
      ...(context.onTableCheckIdentityDiagnostic ? { onIdentityDiagnostic: context.onTableCheckIdentityDiagnostic } : {}),
      ...(context.onTableCheckUserInterventionRequired ? { onUserInterventionRequired: context.onTableCheckUserInterventionRequired } : {}),
      ...(context.networkPolicy ? { networkPolicy: context.networkPolicy } : {}),
    }),
    ground: (candidate, request, observation, now) => groundTableCheckAvailability(candidate, request, observation, now),
  },
  browser: {
    startupUrl: tableCheckPublicReadNetworkPolicy.startupDocuments![0]!,
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
    resolveDetailIdentity(candidate, outlets) {
      const matches=outlets.map(outlet=>inspectTableCheckEntity(candidate,outlet).resolution).filter(result=>result.confidence==="HIGH");
      return matches.length===1 ? matches[0]! : {confidence:"LOW",matchedBy:[]};
    },
    parseDetailIdentity(snapshot, fallback) {
      const extracted = parseTableCheckOutletIdentityWithEvidence(snapshot, fallback.sourceUrl);
      const outlet = extracted?.outlet;
      if (!outlet || !outlet.address || extracted.fields.outletName.source === "ABSENT" || extracted.fields.address.source === "ABSENT") return undefined;
      return outlet;
    },
  },
  buildQuery(query) {
    return { url: tableCheckPublicReadNetworkPolicy.startupDocuments![0]!, retrievalExpression: query.keyword ?? "", areaEntrance: "OBSERVE_SOURCE_REGION" };

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
    startupDocuments: packs.flatMap(pack => pack.browser?.startupUrl ? [pack.browser.startupUrl] : []),
    documentOrigins: packs.flatMap((pack) => pack.documentOrigins),
    retainedResources: packs.flatMap((pack) => pack.retainedResources ?? []),
    staticResources: packs.flatMap((pack) => pack.staticResources),
    dynamicReads: packs.flatMap((pack) => pack.reviewedReads),
    genericPublicRead: true,
  };
}
