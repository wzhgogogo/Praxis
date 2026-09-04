import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
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
  return (value ?? "").replace(/\D/g, "");
}

export function isTableCheckUrl(value: string): boolean { return TABLECHECK_URL.test(value); }

export function hasTableCheckBotChallenge(snapshot: BrowserSnapshot): boolean {
  return /captcha|verify you are human|access denied|unusual traffic|robot|just a moment/i.test(`${snapshot.title}\n${snapshot.text}`);
}

/** A public error document has no outlet identity and must not be parsed as one. */
export function hasTableCheckPageUnavailable(snapshot: BrowserSnapshot): boolean {
  return /\b(?:403|404|410|429|500|502|503)\b|forbidden|not found|service unavailable/i.test(`${snapshot.title}\n${snapshot.text}`);
}

function absoluteTableCheckUrl(value: string, baseUrl: string): string | undefined {
  try {
    const url = new URL(value, baseUrl);
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

/** Candidate URL attempts are deterministic hints only; page identity is still mandatory. */
export function tableCheckGuideUrls(candidateName: string): string[] {
  const tokens = candidateName.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en-US").match(/[a-z0-9]+/g);
  if (!tokens?.length) return [];
  const slugs = [...new Set([tokens.join(""), tokens.join("-")])];
  return slugs.map((slug) => `https://www.tablecheck.com/en/${slug}`);
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

export function tableCheckReservationUrl(outletUrl: string, date: string, partySize: number): string | undefined {
  try {
    const url = new URL(outletUrl);
    if (!isTableCheckUrl(url.toString())) return undefined;
    if (!/\/reserve(?:\/landing)?\/?$/.test(url.pathname)) url.pathname = `${url.pathname.replace(/\/$/, "")}/reserve`;
    url.search = "";
    url.searchParams.set("start_date", date);
    url.searchParams.set("pax", String(partySize));
    return url.toString();
  } catch {
    return undefined;
  }
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
  return selectedSummary.test(snapshot.text);
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
  let hasExplicitSlotUi = false;
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
