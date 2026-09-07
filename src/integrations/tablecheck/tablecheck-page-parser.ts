import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import type {
  TableCheckIdentityEvidenceSource,
  TableCheckIdentityField,
  TableCheckOutletIdentityExtraction,
  TableCheckOutletObservation,
} from "./tablecheck-contracts.js";

const TABLECHECK_URL = /^https:\/\/(?:www\.)?tablecheck\.com\//i;

export function normalizeTableCheckIdentity(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase("ja-JP").replace(/[\s\-‐‑–—()（）・,，.。]/g, "");
}

export function normalizeTableCheckPhone(value: string | undefined): string {
  const raw = (value ?? "").normalize("NFKC").trim();
  const digits = raw.replace(/\D/g, "");
  // Google normally returns Japan's domestic leading zero while public JSON-LD
  // commonly uses +81. Canonicalize only an explicit international prefix.
  return /^(?:\+|00)81(?:[\s().-]*\d)/.test(raw) && digits.startsWith("81")
    ? `0${digits.slice(2).replace(/^0+/, "")}`
    : digits;
}

export function isTableCheckUrl(value: string): boolean { return TABLECHECK_URL.test(value); }

export function hasTableCheckBotChallenge(snapshot: BrowserSnapshot): boolean {
  return /captcha|verify you are human|access denied|unusual traffic|robot|just a moment/i.test(`${snapshot.title}\n${snapshot.text}`);
}

export interface TableCheckPageUnavailableInspection {
  pageUnavailable: boolean;
  /** Exact title or primary-heading evidence only; arbitrary result text is never an error-page signal. */
  matchedSignals: Array<{ source: "TITLE" | "PRIMARY_HEADING"; value: string }>;
}

const TABLECHECK_ERROR_DOCUMENT = /^(?:(?:error|http error)\s*)?(?:403\s*(?:forbidden)?|404\s*(?:not found)?|410\s*(?:gone)?|429\s*(?:too many requests)?|500\s*(?:internal server error)?|502\s*(?:bad gateway)?|503\s*(?:service unavailable)?|forbidden|not found|service unavailable)(?:\s*[-|:].*)?$/i;

function primaryHeading(snapshot: BrowserSnapshot): string | undefined {
  return plainText(snapshot.html.match(/<h1\b[^>]*>([\s\S]{0,500}?)<\/h1>/i)?.[1] ?? "") || undefined;
}

/**
 * A public error document has no outlet identity and must not be parsed as one.
 * Error classification deliberately excludes arbitrary page text: result counts, reviews,
 * and restaurant copy can contain status-looking numbers or phrases such as "not found".
 */
export function inspectTableCheckPageUnavailable(snapshot: BrowserSnapshot): TableCheckPageUnavailableInspection {
  const signals = [
    { source: "TITLE" as const, value: snapshot.title.trim() },
    { source: "PRIMARY_HEADING" as const, value: primaryHeading(snapshot) ?? "" },
  ].filter((signal) => signal.value.length > 0 && TABLECHECK_ERROR_DOCUMENT.test(signal.value));
  return { pageUnavailable: signals.length > 0, matchedSignals: signals };
}

export function hasTableCheckPageUnavailable(snapshot: BrowserSnapshot): boolean {
  return inspectTableCheckPageUnavailable(snapshot).pageUnavailable;
}

function absoluteTableCheckUrl(value: string, baseUrl: string): string | undefined {
  try {
    const url = new URL(value.replaceAll("&amp;", "&"), baseUrl);
    url.hash = "";
    return isTableCheckUrl(url.toString()) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function stableSourceEntityId(url: string): string {
  try {
    const value = new URL(url);
    return value.pathname.replace(/^\/(?:en|ja)\//, "").replace(/\/reserve(?:\/landing)?\/?$/, "").replace(/^\/+|\/+$/g, "");
  } catch {
    return "unknown";
  }
}

function plainText(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function firstElementText(html: string, marker: RegExp): string | undefined {
  const element = new RegExp(`<(?<tag>[a-z0-9]+)[^>]*${marker.source}[^>]*>(?<content>[\\s\\S]{0,2400}?)<\\/\\k<tag>>`, marker.flags.replace("g", ""));
  const value = html.match(element)?.groups?.content;
  const text = value ? plainText(value) : undefined;
  return text || undefined;
}

function firstHeadingText(html: string): string | undefined {
  const value = html.match(/<h1[^>]*>([\s\S]{0,2400}?)<\/h1>/i)?.[1];
  const text = value ? plainText(value) : undefined;
  return text || undefined;
}

function jsonLdObjects(html: string): Record<string, unknown>[] {
  const values: Record<string, unknown>[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1] ?? "") as unknown;
      const queue: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const current = queue.shift();
        if (!current || typeof current !== "object" || Array.isArray(current)) continue;
        values.push(current as Record<string, unknown>);
        const graph = (current as Record<string, unknown>)["@graph"];
        if (Array.isArray(graph)) queue.push(...graph);
      }
    } catch { /* malformed public markup remains absent */ }
  }
  return values;
}

function canonicalUrl(snapshot: BrowserSnapshot): string | undefined {
  const value = snapshot.html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    ?? snapshot.html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1];
  return value ? absoluteTableCheckUrl(value, snapshot.url) : undefined;
}

function field(
  value: string | undefined,
  source: TableCheckIdentityEvidenceSource,
  normalize: (input: string | undefined) => string,
): TableCheckIdentityField {
  return value ? { value, normalizedValue: normalize(value), source } : { source: "ABSENT" };
}

function addressFromJsonLd(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const address = value as Record<string, unknown>;
  const parts = ["postalCode", "addressRegion", "addressLocality", "streetAddress"]
    .map((key) => address[key])
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  return parts.length ? parts.join(" ") : undefined;
}

function textAfterLabel(text: string, label: RegExp): string | undefined {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  const index = lines.findIndex((line) => label.test(line));
  return index >= 0 ? lines[index + 1] : undefined;
}

function phoneFromPage(snapshot: BrowserSnapshot): { value?: string; source: TableCheckIdentityEvidenceSource } {
  const tel = snapshot.html.match(/href=["']tel:([^"'?\s]+)/i)?.[1];
  if (tel) return { value: tel, source: "TEL_LINK" };
  const fromText = textAfterLabel(snapshot.text, /^(?:phone|telephone|電話番号)$/i);
  const value = fromText?.match(/(?:\+?81[-\s]?)?0?\d{1,4}[-\s]\d{2,4}[-\s]\d{3,4}/)?.[0];
  return value ? { value, source: "DOM" } : { source: "ABSENT" };
}

const TABLECHECK_DISCOVERY_EXCLUDED_SLUGS = new Set([
  "account", "auth-callback", "discover", "japan", "join", "landing", "lists", "login", "not-found", "policy", "promo", "search",
]);

function discoveryLinkText(value: string): string { return plainText(value); }

function isTableCheckVenueGuide(url: URL): boolean {
  const parts = url.pathname.split("/").filter(Boolean);
  return parts.length === 2
    && ["en", "ja"].includes(parts[0] ?? "")
    && !TABLECHECK_DISCOVERY_EXCLUDED_SLUGS.has(parts[1] ?? "");
}

function relatedDiscoveryName(candidateName: string, resultText: string): boolean {
  const candidate = normalizeTableCheckIdentity(candidateName);
  const result = normalizeTableCheckIdentity(resultText);
  return candidate.length >= 3 && result.length >= 3 && (result.includes(candidate) || candidate.includes(result));
}

/** The documented public venue search is discovery-only; it establishes no outlet identity by itself. */
export function tableCheckDiscoveryUrl(candidate: RestaurantCandidate): string {
  const url = new URL("https://www.tablecheck.com/en/japan/search");
  url.searchParams.set("service_mode", "dining");
  url.searchParams.set("sort_by", "relevance");
  url.searchParams.set("venue_type", "tc");
  url.searchParams.set("search_text", candidate.restaurant.outletName);
  const coordinates = candidate.restaurant.coordinates;
  if (coordinates) {
    url.searchParams.set("geo_latitude", String(coordinates.lat));
    url.searchParams.set("geo_longitude", String(coordinates.lng));
    url.searchParams.set("geo_distance", "5km");
    url.searchParams.set("auto_geolocate", "false");
  }
  return url.toString();
}

/** Extract public guide pages from TableCheck's rendered result cards, never reservation slot links. */
export function parseTableCheckDiscoveryOutletUrls(snapshot: BrowserSnapshot, candidateName: string): string[] {
  if (!isTableCheckUrl(snapshot.url)) return [];
  let pageUrl: URL;
  try { pageUrl = new URL(snapshot.url); } catch { return []; }
  if (!/^\/(?:en|ja)\/japan\/search\/?$/.test(pageUrl.pathname)) return [];
  const candidates = [...snapshot.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .flatMap((match) => {
      const url = absoluteTableCheckUrl(match[1] ?? "", snapshot.url);
      if (!url) return [];
      const parsed = new URL(url);
      return isTableCheckVenueGuide(parsed) ? [{ url: `${parsed.origin}${parsed.pathname}`, text: discoveryLinkText(match[2] ?? "") }] : [];
    });
  const unique = [...new Map(candidates.map((item) => [item.url, item])).values()];
  const related = unique.filter((item) => relatedDiscoveryName(candidateName, item.text));
  // Name relevance only limits public pages inspected; HIGH still requires detail-page identity evidence.
  return (related.length ? related : unique).slice(0, 5).map((item) => item.url);
}

export function hasTableCheckDiscoveryNoResult(snapshot: BrowserSnapshot): boolean {
  return /\b(?:no|0)\s+(?:venues?|results?)\s+(?:found|match(?:es)?)/i.test(snapshot.text);
}

export function parseTableCheckOutletIdentityWithEvidence(
  snapshot: BrowserSnapshot,
  fallbackUrl: string,
): TableCheckOutletIdentityExtraction | undefined {
  if (!isTableCheckUrl(snapshot.url)) return undefined;
  const localBusiness = jsonLdObjects(snapshot.html).find((item) =>
    typeof item.name === "string" && (item.address !== undefined || item.telephone !== undefined),
  );
  const jsonLdName = typeof localBusiness?.name === "string" && localBusiness.name.trim() ? localBusiness.name.trim() : undefined;
  const domName = firstHeadingText(snapshot.html) ?? firstElementText(snapshot.html, /(?:class|id)=["'][^"']*(?:restaurant|shop)[^"']*(?:name|title)[^"']*["']/i);
  const address = addressFromJsonLd(localBusiness?.address)
    ?? firstElementText(snapshot.html, /(?:class|id|itemprop)=["'][^"']*address[^"']*["']/i)
    ?? textAfterLabel(snapshot.text, /^(?:address|住所)$/i);
  const phone = phoneFromPage(snapshot);
  const canonical = canonicalUrl(snapshot);
  const sourceUrl = (canonical ?? fallbackUrl).replace(/\?.*$/, "");
  const outletName = jsonLdName ?? domName;
  if (!outletName) return undefined;
  return {
    outlet: {
      sourceEntityId: stableSourceEntityId(sourceUrl),
      sourceUrl,
      outletName,
      ...(address ? { address } : {}),
      ...(phone.value ? { phone: phone.value } : {}),
    },
    ...(canonical ? { canonicalUrl: canonical.replace(/\?.*$/, "") } : {}),
    fields: {
      outletName: field(outletName, jsonLdName ? "JSON_LD" : "DOM", normalizeTableCheckIdentity),
      address: field(address, localBusiness?.address !== undefined ? "JSON_LD" : address ? "DOM" : "ABSENT", normalizeTableCheckIdentity),
      phone: field(phone.value, phone.source, normalizeTableCheckPhone),
    },
  };
}

export interface TableCheckReservationTarget {
  kind: "EMBEDDED_AVAILABILITY" | "LINKED_PAGE";
  url: string;
}

/** Resolve the public reservation surface from rendered outlet-page structure; never derive a slug. */
export function resolveTableCheckReservationTarget(
  snapshot: BrowserSnapshot,
  outlet: TableCheckOutletObservation,
): TableCheckReservationTarget | undefined {
  if (/data-testid=["']Venue Availability["']/i.test(snapshot.html)) {
    return { kind: "EMBEDDED_AVAILABILITY", url: outlet.sourceUrl };
  }
  let outletUrl: URL;
  try { outletUrl = new URL(outlet.sourceUrl); } catch { return undefined; }
  for (const match of snapshot.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const link = absoluteTableCheckUrl(match[1] ?? "", snapshot.url);
    if (!link) continue;
    const target = new URL(link);
    if (target.pathname.startsWith(`${outletUrl.pathname.replace(/\/$/, "")}/reserve`)) {
      return { kind: "LINKED_PAGE", url: target.toString() };
    }
  }
  return undefined;
}

/** A linked public reservation page remains provider-owned; only the requested read parameters are set. */
export function tableCheckRequestedReservationUrl(target: TableCheckReservationTarget, date: string, partySize: number): string {
  if (target.kind === "EMBEDDED_AVAILABILITY") return target.url;
  const url = new URL(target.url);
  url.searchParams.set("start_date", date);
  url.searchParams.set("pax", String(partySize));
  return url.toString();
}

function selectedValue(html: string, names: string[]): string | undefined {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const data = html.match(new RegExp(`data-${escaped}=["']([^"']+)["']`, "i"))?.[1];
    if (data) return data;
    const input = html.match(new RegExp(`<input[^>]+(?:name|id)=["'][^"']*${escaped}[^"']*["'][^>]+value=["']([^"']+)["']`, "i"))?.[1];
    if (input) return input;
    const serialized = html.match(new RegExp(`["'](?:${escaped.replace(/-/g, "[-_]")}|${escaped.replace(/-/g, "")})["']\\s*[:=]\\s*["']?([^"',}&\\s]+)`, "i"))?.[1];
    if (serialized) return serialized;
  }
  return undefined;
}

export function hasTableCheckSelectedRequest(snapshot: BrowserSnapshot, date: string, partySize: number): boolean {
  const selectedDate = selectedValue(snapshot.html, ["selected-date", "start-date", "date"]);
  const selectedParty = selectedValue(snapshot.html, ["party-size", "pax", "guests", "party"]);
  if (selectedDate === date && selectedParty === String(partySize)) return true;
  const requested = new Date(`${date}T00:00:00Z`);
  const month = requested.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  const day = requested.getUTCDate();
  const selectedSummary = new RegExp(`(?:${partySize}\\s*(?:guest|guests|人))[^\\n]{0,80}(?:${month}\\.?\\s*${day}(?:st|nd|rd|th)?)|(?:${month}\\.?\\s*${day}(?:st|nd|rd|th)?)[^\\n]{0,80}(?:${partySize}\\s*(?:guest|guests|人))`, "i");
  if (selectedSummary.test(snapshot.text)) return true;
  // Current TableCheck guide pages place the selected date in the public "Book a table"
  // control, then render the full calendar before the selected party. This is a single
  // reservation-widget readback, not arbitrary restaurant prose.
  const widgetSummary = new RegExp(`book\\s+a\\s+table\\s+${month}\\.?\\s*${day}(?:st|nd|rd|th)?[\\s\\S]{0,360}?\\b${partySize}\\s*(?:guest|guests)\\b`, "i");
  return widgetSummary.test(snapshot.text);
}

export interface TableCheckSlotParse { availableSlots: string[]; hasExplicitSlotUi: boolean; }

function timeIn(value: string): string | undefined { return value.match(/\b([01]\d|2[0-3]):[0-5]\d\b/)?.[0]; }
function unavailable(value: string): boolean { return /disabled|aria-disabled=["']true|unavailable|sold[\s-]?out|full|満席|予約不可/i.test(value); }
function explicitAvailability(value: string): boolean {
  return /data-(?:available|bookable)=["']true|data-(?:status|state)=["']available|class=["'][^"']*(?:available|bookable)[^"']*["']/i.test(value);
}

/** A time is a slot only when the reservation UI explicitly marks it bookable. */
export function parseTableCheckAvailabilitySlots(snapshot: BrowserSnapshot): TableCheckSlotParse {
  const slots = new Set<string>();
  // The public TableCheck widget has an explicit empty-result state without emitting
  // individual disabled slot buttons. The caller separately verifies the current date
  // and party size before treating this state as UNAVAILABLE.
  let hasExplicitSlotUi = /we\s+could\s+not\s+find\s+a\s+table\s+on\s+.+?\s+for\s+the\s+selected\s+mealtime/i.test(snapshot.text);
  const element = /<(button|a)[^>]*?(?:data-(?:time|start-time|slot)|class=["'][^"']*(?:slot|time|availability)[^"']*)[^>]*>([\s\S]{0,500}?)<\/\1>/gi;
  for (const match of snapshot.html.matchAll(element)) {
    const whole = match[0] ?? "";
    const time = whole.match(/data-(?:time|start-time|slot)=["']([^"']+)["']/i)?.[1] ?? timeIn(`${whole} ${plainText(match[2] ?? "")}`);
    if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) continue;
    if (explicitAvailability(whole) || unavailable(whole)) hasExplicitSlotUi = true;
    if (explicitAvailability(whole) && !unavailable(whole)) slots.add(time);
  }
  return { availableSlots: [...slots].sort(), hasExplicitSlotUi };
}

function aliases(criterion: string): string[] {
  const normalized = criterion.trim().toLocaleLowerCase("en-US");
  return normalized === "omakase" ? ["omakase", "おまかせ", "お任せ"] : [normalized];
}

/** Only menu/course/cuisine-labelled provider text can ground a HARD criterion. */
export function parseTableCheckVerifiedHardCriteria(snapshot: BrowserSnapshot, hardCriteria: string[]): string[] {
  const sourceText = [...snapshot.html.matchAll(/<(?:section|div|article|h[1-6])[^>]*(?:class|id)=["'][^"']*(?:menu|course|cuisine|featured)[^"']*["'][^>]*>([\s\S]{0,2400}?)<\//gi)]
    .map((match) => plainText(match[1] ?? ""))
    .join(" ")
    .toLocaleLowerCase("ja-JP");
  return hardCriteria.filter((criterion) => aliases(criterion).some((alias) => sourceText.includes(alias.toLocaleLowerCase("ja-JP"))));
}

export function tableCheckPageExcerpt(snapshot: BrowserSnapshot): string {
  return snapshot.text.replace(/\s+/g, " ").trim().slice(0, 600);
}
