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

export function detectExternalReservationRedirect(snapshot: BrowserSnapshot): boolean {
  return /(?:reservation|reserve|booking)[^\n]{0,120}(?:external|redirect|tablecheck|hotpepper)/i.test(snapshot.text)
    || /href=["']https?:\/\/(?![^"']*tabelog\.com)[^"']+["']/i.test(snapshot.html);
}

export function hasReservationControls(snapshot: BrowserSnapshot): boolean {
  return /予約|空席|予約する|reserve|availability/i.test(snapshot.text)
    && /<select|<input[^>]+type=["']date|party|人数|guests?/i.test(snapshot.html);
}

export function parseVisibleTimeSlots(snapshot: BrowserSnapshot): string[] {
  return [...new Set([...`${snapshot.text}\n${snapshot.html}`.matchAll(/\b([01]\d|2[0-3]):[0-5]\d\b/g)].map((match) => match[0]!))].sort();
}

export function pageExcerpt(snapshot: BrowserSnapshot): string { return excerpt(snapshot.text); }
