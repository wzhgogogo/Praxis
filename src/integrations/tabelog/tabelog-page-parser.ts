import { tabelogCapturedSlots } from "./tabelog-query-controls.js";
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type {
  TabelogIdentityEvidenceSource,
  TabelogIdentityFieldDiagnostic,
  TabelogOutletIdentityExtraction,
  TabelogOutletObservation,
} from "./tabelog-contracts.js";
import { normalizeTabelogIdentity, normalizeTabelogPhone } from "./tabelog-entity-resolver.js";

const TABELOG_URL = /^https:\/\/(?:www\.)?tabelog\.com\//i;

function excerpt(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, 600);
}

export function isTabelogUrl(url: string): boolean { return TABELOG_URL.test(url); }

export function hasBotChallenge(snapshot: BrowserSnapshot): boolean {
  return /captcha|verify you are human|access denied|unusual traffic|robot|just a moment/i.test(`${snapshot.title}\n${snapshot.text}`);
}

function sourceEntityId(sourceUrl: string): string {
  return sourceUrl.replace(/^https:\/\/(?:www\.)?tabelog\.com\//i, "").replace(/\/$/, "");
}

function absoluteTabelogUrl(value: string, baseUrl: string): string | undefined {
  try {
    const url = new URL(value, baseUrl);
    url.hash = "";
    url.search = "";
    return isTabelogUrl(url.toString()) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function firstElementText(html: string, marker: RegExp): string | undefined {
  const element = new RegExp(`<(?<tag>[a-z0-9]+)[^>]*${marker.source}[^>]*>(?<content>[\\s\\S]{0,2000}?)<\\/\\k<tag>>`, marker.flags.replace("g", ""));
  const match = html.match(element);
  const value = match?.groups?.content?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return value || undefined;
}

function firstPhone(html: string): { value?: string; source: TabelogIdentityEvidenceSource } {
  const tel = html.match(/href=["']tel:([^"'?\s]+)/i)?.[1];
  if (tel) return { value: tel, source: "TEL_LINK" };
  const value = firstElementText(html, /(?:class|id)=["'][^"']*(?:tel|phone)[^"']*["']/i);
  return value ? { value, source: "DOM" } : { source: "ABSENT" };
}

function canonicalTabelogUrl(snapshot: BrowserSnapshot): string | undefined {
  const value = snapshot.html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    ?? snapshot.html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
  return value ? absoluteTabelogUrl(value, snapshot.url) : undefined;
}

export function parseTabelogSearchOutlets(snapshot: BrowserSnapshot): TabelogOutletObservation[] {
  const results = new Map<string, TabelogOutletObservation>();
  const link = /<a[^>]+href=["']([^"'#?]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of snapshot.html.matchAll(link)) {
    const sourceUrl = absoluteTabelogUrl(match[1] ?? "", snapshot.url);
    const label = match[2]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!sourceUrl || !label || !isTabelogUrl(sourceUrl)) continue;
    const tag = match[0] ?? "";
    if (!/data-(?:address|phone)=|class=["'][^"']*(?:rst-name|restaurant[^"']*(?:name|title))[^"']*["']/i.test(tag)) continue;
    const entityId = sourceEntityId(sourceUrl);
    const address = tag.match(/data-address=["']([^"']+)["']/i)?.[1];
    const phone = tag.match(/data-phone=["']([^"']+)["']/i)?.[1];
    results.set(entityId, {
      sourceEntityId: entityId,
      sourceUrl,
      outletName: label,
      ...(address ? { address } : {}),
      ...(phone ? { phone } : {}),
    });
  }
  return [...results.values()].slice(0, 5);
}

function jsonLdObjects(html: string): Record<string, unknown>[] {
  const values: Record<string, unknown>[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1] ?? "") as unknown;
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const current = queue.shift();
        if (!current || typeof current !== "object" || Array.isArray(current)) continue;
        values.push(current as Record<string, unknown>);
        const graph = (current as Record<string, unknown>)["@graph"];
        if (Array.isArray(graph)) queue.push(...graph);
      }
    } catch { /* provider markup is untrusted; absence stays unresolved */ }
  }
  return values;
}

function field(value: string | undefined, source: TabelogIdentityEvidenceSource, normalize: (value: string | undefined) => string): TabelogIdentityFieldDiagnostic {
  return value ? { value, normalizedValue: normalize(value), source } : { source: "ABSENT" };
}

/** Enriches a Tabelog result from the candidate page's structured identity data. */
export function parseTabelogOutletIdentityWithEvidence(
  snapshot: BrowserSnapshot,
  fallback: TabelogOutletObservation,
): TabelogOutletIdentityExtraction {
  const localBusiness = jsonLdObjects(snapshot.html).find((item) => typeof item.name === "string" && (item.address !== undefined || item.telephone !== undefined));
  const addressValue = localBusiness?.address;
  const address = typeof addressValue === "string" ? addressValue
    : addressValue && typeof addressValue === "object"
      ? ["postalCode", "addressRegion", "addressLocality", "streetAddress"].map((key) => (addressValue as Record<string, unknown>)[key]).filter((value): value is string => typeof value === "string").join(" ")
      : undefined;
  const phoneFromPage = firstPhone(snapshot.html);
  const jsonLdName = typeof localBusiness?.name === "string" && localBusiness.name.trim() ? localBusiness.name.trim() : undefined;
  const jsonLdPhone = typeof localBusiness?.telephone === "string" && localBusiness.telephone.trim() ? localBusiness.telephone.trim() : undefined;
  const pageAddress = firstElementText(snapshot.html, /(?:class|id|itemprop)=["'][^"']*address[^"']*["']/i);
  const pageName = firstElementText(snapshot.html, /(?:class|id)=["'][^"']*(?:rstinfo|restaurant)[^"']*(?:name|title)[^"']*["']/i);
  const outletName = jsonLdName ?? pageName ?? fallback.outletName;
  const outletNameSource: TabelogIdentityEvidenceSource = jsonLdName ? "JSON_LD" : pageName ? "DOM" : "SEARCH_RESULT";
  const canonicalUrl = canonicalTabelogUrl(snapshot);
  const sourceUrl = canonicalUrl ?? fallback.sourceUrl;
  const resolvedAddress = address ?? pageAddress ?? fallback.address;
  const addressSource: TabelogIdentityEvidenceSource = address ? "JSON_LD" : pageAddress ? "DOM" : fallback.address ? "SEARCH_RESULT" : "ABSENT";
  const phone = jsonLdPhone ?? phoneFromPage.value ?? fallback.phone;
  const phoneSource: TabelogIdentityEvidenceSource = jsonLdPhone ? "JSON_LD" : phoneFromPage.value ? phoneFromPage.source : fallback.phone ? "SEARCH_RESULT" : "ABSENT";
  return {
    outlet: {
      ...fallback,
      sourceUrl,
      sourceEntityId: sourceEntityId(sourceUrl),
      outletName,
      ...(resolvedAddress ? { address: resolvedAddress } : {}),
      ...(phone ? { phone } : {}),
    },
    ...(canonicalUrl ? { canonicalUrl } : {}),
    fields: {
      outletName: field(outletName, outletNameSource, normalizeTabelogIdentity),
      address: field(resolvedAddress, addressSource, normalizeTabelogIdentity),
      phone: field(phone, phoneSource, normalizeTabelogPhone),
    },
  };
}

export function parseTabelogOutletIdentity(snapshot: BrowserSnapshot, fallback: TabelogOutletObservation): TabelogOutletObservation {
  return parseTabelogOutletIdentityWithEvidence(snapshot, fallback).outlet;
}

export function detectExternalReservationRedirect(snapshot: BrowserSnapshot): boolean {
  // Ordinary website/social links do not establish an external booking boundary.
  for (const match of snapshot.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = stripTags(match[2] ?? "");
    if (!/予約|\b(?:reserve|reservation|book(?:ing)?(?: a table)?)\b/i.test(label)) continue;
    try {
      const url = new URL(match[1]!.replace(/&amp;/g, "&"), snapshot.url);
      if (url.protocol === "https:" && url.hostname !== "tabelog.com" && !url.hostname.endsWith(".tabelog.com")) return true;
    } catch { /* Invalid navigation is not evidence of an external provider. */ }
  }
  return false;
}

export function hasReservationControls(snapshot: BrowserSnapshot): boolean {
  return /予約|空席|予約する|reserve|availability/i.test(snapshot.text)
    && /<select|<input[^>]+type=["']date|party|人数|guests?/i.test(snapshot.html);
}

export interface TabelogSlotParse {
  availableSlots: string[];
  hasExplicitSlotUi: boolean;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function timeIn(value: string): string | undefined {
  return value.match(/\b([01]\d|2[0-3]):[0-5]\d\b/)?.[0];
}

function unavailable(value: string): boolean {
  return /sold[\s-]?out|unavailable|disabled|full|満席|受付終了|予約不可/i.test(value);
}

function available(value: string): boolean {
  return /is-available|available|vacancy|空席|予約可|reserve/i.test(value) && !unavailable(value);
}

/**
 * Extract only time controls carrying an explicit available/unavailable state.
 * A time appearing in ordinary prose, opening hours, or a header is never a slot.
 */
export function parseTabelogAvailabilitySlots(snapshot: BrowserSnapshot, request?: {date:string;partySize:number}): TabelogSlotParse {
  const captured = request ? tabelogCapturedSlots(snapshot, request.date, request.partySize) : undefined;
  if (captured) return captured;
  const slots = new Set<string>();
  let hasExplicitSlotUi = false;
  const element = /<(button|a|li|div)[^>]*?(?:data-(?:time|start-time)|class=["'][^"']*(?:slot|time|reserve|vacancy)[^"']*)[^>]*>([\s\S]{0,500}?)<\/\1>/gi;
  for (const match of snapshot.html.matchAll(element)) {
    const whole = match[0] ?? "";
    const content = `${whole} ${stripTags(match[2] ?? "")}`;
    const time = whole.match(/data-(?:time|start-time)=["']([^"']+)["']/i)?.[1] ?? timeIn(content);
    if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) continue;
    hasExplicitSlotUi = true;
    if (available(content)) slots.add(time);
  }
  return { availableSlots: [...slots].sort(), hasExplicitSlotUi };
}

function aliases(criterion: string): string[] {
  const normalized = criterion.trim().toLocaleLowerCase("en-US");
  return normalized === "omakase" ? ["omakase", "おまかせ", "お任せ"] : [normalized];
}

/** Only genre/course/menu-labelled source text can support a HARD criterion. */
export function parseTabelogVerifiedHardCriteria(snapshot: BrowserSnapshot, hardCriteria: string[]): string[] {
  const sourceText = [...snapshot.html.matchAll(/<(?:[^>]+)(?:class|id)=["'][^"']*(?:genre|category|course|menu|cuisine)[^"']*["'][^>]*>([\s\S]{0,800}?)<\//gi)]
    .map((match) => stripTags(match[1] ?? ""))
    .join(" ")
    .toLocaleLowerCase("ja-JP");
  return hardCriteria.filter((criterion) => aliases(criterion).some((alias) => sourceText.includes(alias.toLocaleLowerCase("ja-JP"))));
}

export function pageExcerpt(snapshot: BrowserSnapshot): string { return excerpt(snapshot.text); }

/** Listed course cards are facts, not a promise that a plan fits this sitting. */
export function parseTabelogListedCourses(snapshot: BrowserSnapshot): string[] {
  const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, entity => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " })[entity] ?? entity);
  const visible = snapshot.text.replace(/\s+/g, " ");
  return snapshot.html.split(/<div\b[^>]*class=["']rstdtl-course-list js-rstdtl-course-list["'][^>]*>/i).slice(1).flatMap(card => {
    const name = decode(stripTags(card.match(/<span\b[^>]*class=["']rstdtl-course-list__course-title-text["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ""));
    const description = decode(stripTags(card.match(/<p\b[^>]*class=["']rstdtl-course-list__desc["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? ""));
    const price = decode(stripTags(card.match(/<span\b[^>]*class=["']rstdtl-course-list__price-num["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ""));
    const party = stripTags(card.match(/<dl\b[^>]*class=["']rstdtl-course-list__course-rule["'][^>]*>([\s\S]*?)<\/dl>/i)?.[1] ?? "");
    // Require the named card and displayed price, preserving tax, group limits
    // and the whole description (including lunch-only restrictions). Never
    // take a crossed-out catalog price or collapse multiple plans to one price.
    if (!name || !price || !visible.includes(name) || !visible.replace(/\s/g, "").includes(price.replace(/\s/g, "")) || !/JPY\s*[\d,]+/.test(price)) return [];
    const note = `${name} — ${price}${party ? `; ${party}` : ""}${description ? `. ${description}` : ""}`;
    return note.length <= 1600 ? [note] : [];
  }).slice(0, 3);
}
