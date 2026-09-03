import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { TabelogOutletObservation } from "./tabelog-contracts.js";

const TABELOG_URL = /^https:\/\/(?:www\.)?tabelog\.com\//i;

function excerpt(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, 600);
}

export function isTabelogUrl(url: string): boolean { return TABELOG_URL.test(url); }

export function hasBotChallenge(snapshot: BrowserSnapshot): boolean {
  return /captcha|verify you are human|access denied|unusual traffic|robot/i.test(`${snapshot.title}\n${snapshot.text}`);
}

export function parseTabelogSearchOutlets(snapshot: BrowserSnapshot): TabelogOutletObservation[] {
  const results = new Map<string, TabelogOutletObservation>();
  const link = /<a[^>]+href=["'](https?:\/\/(?:www\.)?tabelog\.com\/[^"'#?]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of snapshot.html.matchAll(link)) {
    const sourceUrl = match[1];
    const label = match[2]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!sourceUrl || !label || !isTabelogUrl(sourceUrl)) continue;
    const sourceEntityId = sourceUrl.replace(/^https:\/\/(?:www\.)?tabelog\.com\//i, "").replace(/\/$/, "");
    const tag = match[0] ?? "";
    const address = tag.match(/data-address=["']([^"']+)["']/i)?.[1];
    const phone = tag.match(/data-phone=["']([^"']+)["']/i)?.[1];
    results.set(sourceEntityId, {
      sourceEntityId,
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

/** Enriches a Tabelog result from the candidate page's structured identity data. */
export function parseTabelogOutletIdentity(snapshot: BrowserSnapshot, fallback: TabelogOutletObservation): TabelogOutletObservation {
  const localBusiness = jsonLdObjects(snapshot.html).find((item) => typeof item.name === "string" && (item.address !== undefined || item.telephone !== undefined));
  const addressValue = localBusiness?.address;
  const address = typeof addressValue === "string" ? addressValue
    : addressValue && typeof addressValue === "object"
      ? ["postalCode", "addressRegion", "addressLocality", "streetAddress"].map((key) => (addressValue as Record<string, unknown>)[key]).filter((value): value is string => typeof value === "string").join(" ")
      : undefined;
  const phone = typeof localBusiness?.telephone === "string" ? localBusiness.telephone : undefined;
  const outletName = typeof localBusiness?.name === "string" && localBusiness.name.trim() ? localBusiness.name.trim() : fallback.outletName;
  return { ...fallback, outletName, ...(address ? { address } : {}), ...(phone ? { phone } : {}) };
}

export function detectExternalReservationRedirect(snapshot: BrowserSnapshot): boolean {
  return /(?:reservation|reserve|booking)[^\n]{0,120}(?:external|redirect|tablecheck|hotpepper)/i.test(snapshot.text)
    || /href=["']https?:\/\/(?![^"']*tabelog\.com)[^"']+["']/i.test(snapshot.html);
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
export function parseTabelogAvailabilitySlots(snapshot: BrowserSnapshot): TabelogSlotParse {
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
