import { publicPriceText, sourcePriceElements, quotedCoursePrice } from "../restaurant-availability/source-price-facts.js";
import { decodeHTML } from "entities";
import { tabelogCapturedSlots } from "./tabelog-query-controls.js";

export function tabelogSearchResultBusy(snapshot: BrowserSnapshot): boolean {
  return publicResultBusy(snapshot, /^(?:search results|restaurant results|restaurants|検索結果|レストラン一覧)$/iu);
}

export function tabelogAvailabilityResultBusy(snapshot: BrowserSnapshot): boolean {
  return publicResultBusy(snapshot, /^(?:availability|available times|reservation|reservations|booking|空席|空席確認|予約)$/iu);
}

/** Runtime rendering wins. DOM-only fixture inputs retain explicit public hidden semantics. */
function publicMarkup(snapshot: BrowserSnapshot): string {
  const stack: Array<{ name: string; hidden: boolean }> = [];
  let output = "", offset = 0;
  const html = (snapshot.visibleHtml ?? snapshot.html).replace(/<!--[\s\S]*?-->|<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  for (const token of html.matchAll(/<\/?([a-z][\w-]*)\b[^>]*>/gi)) {
    if (!stack.at(-1)?.hidden) output += html.slice(offset, token.index);
    const tag = token[0], name = token[1]!.toLowerCase();
    if (tag.startsWith("</")) {
      const index = stack.findLastIndex(node => node.name === name);
      if (!stack.at(-1)?.hidden) output += tag;
      if (index >= 0) stack.length = index;
    } else {
      const attributes = Object.fromEntries([...tag.slice(name.length + 1, -1).matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gu)]
        .map(match => [match[1]!.toLowerCase(), match[2] ?? match[3] ?? match[4] ?? ""]));
      const hidden = Boolean(stack.at(-1)?.hidden) || /^(?:nav|header|footer|aside)$/u.test(name)
        || Object.hasOwn(attributes, "hidden") || attributes["aria-hidden"] === "true"
        || /display\s*:\s*none|visibility\s*:\s*hidden/iu.test(attributes.style ?? "");
      if (!hidden) output += tag;
      if (!/^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/u.test(name) && !/\/\s*>$/u.test(tag)) stack.push({ name, hidden });
    }
    offset = token.index + tag.length;
  }
  return output + (stack.at(-1)?.hidden ? "" : html.slice(offset));
}

function publicResultBusy(snapshot: BrowserSnapshot, purpose: RegExp): boolean {
  const markup = publicMarkup(snapshot);
  return sourcePriceElements(markup, tag => /^<(?:main|section|article|div|form|table)\b/iu.test(tag)).some(region => {
    const tag = region.slice(0, region.indexOf(">") + 1);
    const label = tag.match(/aria-label\s*=\s*["']([^"']*)["']/iu)?.[1]
      ?? region.match(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/iu)?.[1];
    return label !== undefined && purpose.test(publicPriceText(label))
      && /aria-busy\s*=\s*["']true["']|role\s*=\s*["']progressbar["']/iu.test(region);
  });
}
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type {
  TabelogIdentityEvidenceSource,
  TabelogIdentityFieldDiagnostic,
  TabelogOutletIdentityExtraction,
  TabelogOutletObservation,
} from "./tabelog-contracts.js";
import { normalizeTabelogIdentity, normalizeTabelogPhone } from "./tabelog-entity-resolver.js";
import { readDetailIdentityFields, type WithDetailIdentity } from "../restaurant-identity/detail-identity-fields.js";

const TABELOG_URL = /^https:\/\/(?:www\.)?tabelog\.com\//i;

function excerpt(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, 600);
}

export function isTabelogUrl(url: string): boolean { return TABELOG_URL.test(url); }

/** Source-owned congestion page, separate from CAPTCHA and outlet identity. */
export function hasTabelogSourceBusy(snapshot: BrowserSnapshot): boolean {
  return /現在アクセスが集中しています/.test(snapshot.title)
    || /現在アクセスが集中し、ページが表示されにくい状態/.test(`${snapshot.text} ${snapshot.html.replace(/<[^>]+>/g, " ")}`);
}

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
  const markup = publicMarkup(snapshot);
  const cards = sourcePriceElements(markup, tag => /^<(?:article|li)\b|\srole=["']listitem["']/iu.test(tag));
  const link = /<a[^>]+href=["']([^"'#?]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of markup.matchAll(link)) {
    const sourceUrl = absoluteTabelogUrl(match[1] ?? "", snapshot.url);
    const label = decodeHTML(publicPriceText(match[2] ?? ""));
    if (!sourceUrl || !/^https:\/\/(?:www\.)?tabelog\.com\/(?:en\/)?[^/]+\/A\d+\/A\d+\/\d+\/$/iu.test(sourceUrl)
      || !label || /^(?:photo(?:s)?|map|reviews?|reserve|book|view(?: details)?|写真|地図|口コミ|予約|\d+)$/iu.test(label)) continue;
    const entityId = sourceEntityId(sourceUrl);
    // The smallest semantic card must refer to only this outlet. Private data
    // attributes and a neighbouring card's address never establish identity.
    const card = cards.filter(card => card.includes(match[0])).sort((a, b) => a.length - b.length)[0];
    const ownCard = card && [...card.matchAll(link)].every(other => {
      const href = absoluteTabelogUrl(other[1] ?? "", snapshot.url);
      return !href || !/\/A\d+\/A\d+\/\d+\/$/u.test(href) || href === sourceUrl;
    }) ? card : undefined;
    const address = ownCard?.match(/<address\b[^>]*>([\s\S]*?)<\/address>/iu)?.[1];
    const phone = ownCard?.match(/<a\b[^>]*href=["']tel:([^"']+)["']/iu)?.[1];
    results.set(entityId, {
      sourceEntityId: entityId,
      sourceUrl,
      outletName: label,
      ...(address ? { address: decodeHTML(publicPriceText(address)) } : {}),
      ...(phone ? { phone: decodeHTML(phone) } : {}),
    });
  }
  return [...results.values()];
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
): TabelogOutletIdentityExtraction & { outlet: WithDetailIdentity<TabelogOutletObservation> } {
  const localBusiness = jsonLdObjects(snapshot.html).find((item) => typeof item.name === "string" && (item.address !== undefined || item.telephone !== undefined));
  const addressValue = localBusiness?.address;
  const address = typeof addressValue === "string" ? addressValue
    : addressValue && typeof addressValue === "object"
      ? ["postalCode", "addressRegion", "addressLocality", "streetAddress"].map((key) => (addressValue as Record<string, unknown>)[key]).filter((value): value is string => typeof value === "string").join(" ")
      : undefined;
  const phoneFromPage = firstPhone(snapshot.html);
  const jsonLdName = typeof localBusiness?.name === "string" && localBusiness.name.trim() ? localBusiness.name.trim() : undefined;
  const jsonLdPhone = typeof localBusiness?.telephone === "string" && localBusiness.telephone.trim() ? localBusiness.telephone.trim() : undefined;
  const postalCode = addressValue && typeof addressValue === "object" && "postalCode" in addressValue && typeof addressValue.postalCode === "string" ? addressValue.postalCode : undefined;
  const detailIdentity = readDetailIdentityFields(snapshot, jsonLdName, address, postalCode);
  const pageAddress = firstElementText(snapshot.html, /(?:class|id|itemprop)=["'][^"']*address[^"']*["']/i);
  const pageName = firstElementText(snapshot.html, /(?:class|id)=["'][^"']*(?:rstinfo|restaurant)[^"']*(?:name|title)[^"']*["']/i);
  const outletName = jsonLdName ?? pageName ?? fallback.outletName;
  const outletNameSource: TabelogIdentityEvidenceSource = jsonLdName ? "JSON_LD" : pageName ? "DOM" : "SEARCH_RESULT";
  const canonicalUrl = canonicalTabelogUrl(snapshot);
  const sourceUrl = canonicalUrl ?? fallback.sourceUrl;
  const resolvedAddress = detailIdentity?.address ?? address ?? pageAddress ?? fallback.address;
  const addressSource: TabelogIdentityEvidenceSource = detailIdentity?.address ? "DOM" : address ? "JSON_LD" : pageAddress ? "DOM" : fallback.address ? "SEARCH_RESULT" : "ABSENT";
  const detailPhone = detailIdentity?.phones.find(phone => phone.role === "STORE") ?? detailIdentity?.phones[0];
  const phone = detailPhone?.value ?? jsonLdPhone ?? phoneFromPage.value ?? fallback.phone;
  const phoneSource: TabelogIdentityEvidenceSource = detailPhone ? "DOM" : jsonLdPhone ? "JSON_LD" : phoneFromPage.value ? phoneFromPage.source : fallback.phone ? "SEARCH_RESULT" : "ABSENT";
  return {
    outlet: {
      ...fallback,
      sourceUrl,
      sourceEntityId: sourceEntityId(sourceUrl),
      outletName,
      ...(resolvedAddress ? { address: resolvedAddress } : {}),
      ...(phone ? { phone } : {}),
      ...(detailIdentity ? { detailIdentity: { ...detailIdentity, ...(canonicalUrl ? { canonicalUrl } : {}) } } : {}),
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
  return /予約|空席|予約する|reserve|availability|No available seats for \d+ guests/i.test(snapshot.text)
    && /<select|<input[^>]+type=["']date|party|人数|guests?/i.test(snapshot.html);
}

export interface TabelogSlotParse {
  availableSlots: string[];
  hasExplicitSlotUi: boolean;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Exact captured source data is required in either language; prose/classes are not inventory. */
export function parseTabelogAvailabilitySlots(snapshot: BrowserSnapshot, request?: { date: string; partySize: number }): TabelogSlotParse {
  // An unscoped page observation has no authority to claim inventory.
  return (request && tabelogCapturedSlots(snapshot, request.date, request.partySize)) ?? { availableSlots: [], hasExplicitSlotUi: false };
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

/** Prices from the same detail snapshot; no additional page or model read. */
export function parseTabelogPriceFacts(snapshot: BrowserSnapshot): import("../../domains/restaurant/price-facts.js").RestaurantPriceFacts | undefined {
  const facts: import("../../domains/restaurant/price-facts.js").RestaurantPriceFacts = { schemaVersion: "restaurant-price-facts@1", listedCoursePricesYen: [] };
  for (const block of sourcePriceElements(snapshot.html, tag => /class=["'][^"']*rdheader-budget__icon/.test(tag))) {
    const quote = publicPriceText(block);
    const amounts = [...quote.matchAll(/(?:JPY|¥)\s*([\d,]+)/g)].map(value => Number(value[1]!.replaceAll(",", "")));
    if (amounts.length !== 2 || amounts.some(value => !Number.isSafeInteger(value) || value < 0) || amounts[0]! > amounts[1]!) continue;
    const value = { min: amounts[0]!, max: amounts[1]!, quote, sourceUrl: snapshot.url };
    if (/aria-label=["']Dinner["']/i.test(block)) facts.dinnerBudgetRangeYen = value;
    if (/aria-label=["']Lunch["']/i.test(block)) facts.lunchBudgetRangeYen = value;
  }
  for (const block of sourcePriceElements(snapshot.html, tag => /class=["']rstdtl-course-list js-rstdtl-course-list["']/.test(tag))) {
    const quote = publicPriceText(block);
    const price = sourcePriceElements(block, tag => /class=["']rstdtl-course-list__price-num["']/.test(tag))[0];
    const amount = price && publicPriceText(price).match(/(?:JPY|¥)\s*([\d,]+)/)?.[1];
    const value = amount && quotedCoursePrice(quote, snapshot.url, Number(amount.replaceAll(",", "")));
    const title = sourcePriceElements(block, tag => /class=["']rstdtl-course-list__course-title-text["']/.test(tag))[0];
    const observed = snapshot.text.replace(/\s/g, "");
    if (value && title && observed.includes(publicPriceText(title).replace(/\s/g, "")) && observed.includes(publicPriceText(price!).replace(/\s/g, ""))) facts.listedCoursePricesYen.push(value);
  }
  return facts.dinnerBudgetRangeYen || facts.lunchBudgetRangeYen || facts.listedCoursePricesYen.length ? facts : undefined;
}


/** Field roles are read from this outlet's markup, never guessed from a quote. */
export function parseTabelogSourceFieldQuotes(snapshot: BrowserSnapshot): import("../../domains/restaurant/contracts.js").RestaurantSourceFieldQuote[] {
  type Quote = import("../../domains/restaurant/contracts.js").RestaurantSourceFieldQuote;
  const clean = (s: string) => publicPriceText(s).replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
  const hasClass = (tag: string, token: string) => (tag.match(/\sclass\s*=\s*(["'])([\s\S]*?)\1/i)?.[2] ?? "").split(/\s+/).includes(token);
  const output: Quote[] = [];
  const add = (field: Quote["field"], markup: string, meal: Quote["meal"] = "UNSPECIFIED") => {
    const quote = clean(markup); if (quote && quote.length <= 1600) output.push({ field, quote, sourceUrl: snapshot.url, meal });
  };
  for (const block of sourcePriceElements(snapshot.html, tag => hasClass(tag, "display-name"))) add("NAME", block);
  for (const block of sourcePriceElements(snapshot.html, tag => hasClass(tag, "rstdtl-rvw__title-target"))) add("CUSTOMER_REVIEW", block);
  let merchantHtml = snapshot.html;
  for (const block of sourcePriceElements(merchantHtml, tag => /^<(?:aside|nav)\b/i.test(tag) || /class=["'][^"']*(?:rstdtl-rvw|recommend|related|neighbor|is-hidden)[^"']*["']/i.test(tag)).sort((a, b) => b.length - a.length)) merchantHtml = merchantHtml.replace(block, "");
  for (const card of sourcePriceElements(merchantHtml, tag => hasClass(tag, "rstdtl-course-list"))) {
    const ownRoot = snapshot.url.match(/^(https?:\/\/[^/]+\/en\/[^/]+\/[^/]+\/[^/]+\/\d{8}\/)/)?.[1];
    if (ownRoot && [...card.matchAll(/href=["']([^"']*\/party\/[^"']*)["']/gi)].some(m => !m[1]!.startsWith(ownRoot + "party/"))) continue;
    const title = sourcePriceElements(card, tag => /^<span\b/i.test(tag) && hasClass(tag, "rstdtl-course-list__course-title-text"))[0] ?? "";
    const description = sourcePriceElements(card, tag => /^<p\b/i.test(tag) && hasClass(tag, "rstdtl-course-list__desc"))[0] ?? "";
    const titleText = clean(title), whole = clean(card);
    const meal: Quote["meal"] = /lunch|ランチ|昼食/i.test(titleText) ? "LUNCH" : /dinner|ディナー|夕食/i.test(titleText) ? "DINNER"
      : /lunch|ランチ|昼食/i.test(whole) && !/dinner|ディナー|夕食/i.test(whole) ? "LUNCH" : /dinner|ディナー|夕食/i.test(whole) && !/lunch|ランチ|昼食/i.test(whole) ? "DINNER" : "UNSPECIFIED";
    add("COURSE_TITLE", title, meal); add("COURSE_DESCRIPTION", description, meal);
  }
  for (const table of sourcePriceElements(merchantHtml, tag => /^<table\b/i.test(tag) && /class=["'][^"']*rstinfo-table[^"']*["']/i.test(tag)))
    for (const row of sourcePriceElements(table, tag => /^<tr\b/i.test(tag))) {
      const heading = row.match(/<th\b[^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? "";
      if (/^(?:Categories|Cuisine|Genre)$/i.test(clean(heading))) add("CATEGORY", row.match(/<td\b[^>]*>([\s\S]*?)<\/td>/i)?.[1] ?? "");
    }
  return output.slice(0, 32);
}
