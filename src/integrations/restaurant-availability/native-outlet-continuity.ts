import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { hasBotChallenge } from "../tabelog/tabelog-page-parser.js";
import { hasTableCheckBotChallenge, hasTableCheckPageUnavailable } from "../tablecheck/tablecheck-page-parser.js";

export interface NativeOutletRef {
  provider: "TABELOG" | "TABLECHECK";
  sourceEntityId: string;
  sourceUrl: string;
}

export interface NativeOutletContinuity {
  confirmed: boolean;
  reason: "SAME_SOURCE_OUTLET" | "SOURCE_REF_INVALID" | "PROVIDER_CHANGED" | "OUTLET_CHANGED" | "BOT_CHALLENGE" | "PAGE_UNAVAILABLE" | "PAGE_IDENTITY_ABSENT";
  expectedSourceEntityId: string;
  observedSourceEntityId?: string;
}

function outletKey(provider: NativeOutletRef["provider"], value: string, isUrl: boolean): string | undefined {
  let path: string;
  try {
    const url = isUrl ? new URL(value) : undefined;
    if (url) {
      if (url.origin !== (provider === "TABELOG" ? "https://tabelog.com" : "https://www.tablecheck.com")) return undefined;
      path = url.pathname;
    } else path = value;
  } catch { return undefined; }
  const parts = path.replace(/^\/+|\/+$/g, "").split("/");
  if (provider === "TABELOG") {
    if (parts[0] === "en" || parts[0] === "ja") parts.shift();
    const id = parts.at(-1);
    return id && /^\d+$/.test(id) && parts.length === 4 && /^[a-z][a-z0-9-]*$/i.test(parts[0] ?? "")
      && /^A\d+$/.test(parts[1] ?? "") && /^A\d+$/.test(parts[2] ?? "")
      ? parts.join("/") : undefined;
  }
  if (parts[0] === "en" || parts[0] === "ja") parts.shift();
  if (parts.at(-1) === "reserve") parts.pop();
  return parts.length === 1 && /^[a-z0-9][a-z0-9-]*$/i.test(parts[0] ?? "") ? parts[0]!.toLowerCase() : undefined;
}

/** A native read carries the source outlet reference; it never rematches names or addresses. */
export function inspectNativeOutletContinuity(
  ref: NativeOutletRef,
  page: BrowserSnapshot,
  observed: { sourceEntityId: string; sourceUrl: string; canonicalUrl?: string | undefined; pageOwnedName: boolean; pageOwnedAddress: boolean },
): NativeOutletContinuity {
  const expected = outletKey(ref.provider, ref.sourceEntityId, false);
  const entrance = outletKey(ref.provider, ref.sourceUrl, true);
  const observedPage = outletKey(ref.provider, page.url, true);
  const observedId = outletKey(ref.provider, observed.sourceEntityId, false);
  const observedUrl = outletKey(ref.provider, observed.sourceUrl, true);
  const canonical = observed.canonicalUrl ? outletKey(ref.provider, observed.canonicalUrl, true) : undefined;
  const base = { expectedSourceEntityId: ref.sourceEntityId,
    ...(observedPage ? { observedSourceEntityId: observedPage } : {}) };
  if (!expected || !entrance || expected !== entrance) return { ...base, confirmed: false, reason: "SOURCE_REF_INVALID" };
  if (!observedPage) return { ...base, confirmed: false, reason: "PROVIDER_CHANGED" };
  if (ref.provider === "TABELOG" ? hasBotChallenge(page) : hasTableCheckBotChallenge(page)) {
    return { ...base, confirmed: false, reason: "BOT_CHALLENGE" };
  }
  if (hasTableCheckPageUnavailable(page) || /^(?:page unavailable|ページが見つかりません)$/i.test(page.title.trim())) {
    return { ...base, confirmed: false, reason: "PAGE_UNAVAILABLE" };
  }
  if (observedPage !== expected || observedId !== expected || observedUrl !== expected
    || (observed.canonicalUrl && canonical !== expected)) return { ...base, confirmed: false, reason: "OUTLET_CHANGED" };
  if (!observed.pageOwnedName && !observed.pageOwnedAddress) return { ...base, confirmed: false, reason: "PAGE_IDENTITY_ABSENT" };
  return { ...base, confirmed: true, reason: "SAME_SOURCE_OUTLET" };
}

/** A later inventory page may change language or query, but never outlet identity. */
export function sameNativeOutletUrl(provider: NativeOutletRef["provider"], expectedUrl: string, observedUrl: string): boolean {
  const expected = outletKey(provider, expectedUrl, true);
  return expected !== undefined && expected === outletKey(provider, observedUrl, true);
}
