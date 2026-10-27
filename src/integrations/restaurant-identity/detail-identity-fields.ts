import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { compareCompleteOutletAddress } from "../restaurant-availability/outlet-identity.js";

export interface DetailPhone {
  value: string;
  role: "STORE" | "RESERVATION";
  quote: string;
  label: string;
  sourceUrl: string;
}

/** Temporary page-read provenance, not a Domain/State or shared outlet contract. */
export interface DetailIdentityFields {
  sourceUrl: string;
  canonicalUrl?: string;
  phones: DetailPhone[];
  address?: string;
  addressQuote?: string;
  postalQuote?: string;
}
export type WithDetailIdentity<T> = T & { detailIdentity?: DetailIdentityFields };

function text(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"').replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex: string | undefined, decimal: string | undefined) => {
      const code = Number.parseInt(hex ?? decimal ?? "0", hex ? 16 : 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }).replace(/\s+/g, " ").trim();
}
const compact = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
const ownerKey = (value: string) => compact(value).toLocaleLowerCase("ja-JP").replace(/[\s()（）・,，.。-]/g, "");
function changed(): never {
  throw new BrowserRuntimeError("EXTRACTION_FAILED", "SOURCE_IDENTITY_STRUCTURE_CHANGED: public detail identity is ambiguous or conflicting");
}

/** Read visible, semantically labelled same-merchant rows; private markers have no role. */
export function readDetailIdentityFields(
  snapshot: BrowserSnapshot,
  sourceName: string | undefined,
  structuredAddress: string | undefined,
  postalCode: string | undefined,
): DetailIdentityFields | undefined {
  const html = snapshot.html.replace(/<!--[^]*?-->/g, "")
    .replace(/<(script|style|aside|footer|nav)\b[^>]*>[^]*?<\/\1\s*>/gi, "");
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([^]*?)<\/h\1\s*>/gi)];
  const information = headings.filter(h => /^(?:restaurant (?:information|info|details)|店舗(?:基本)?情報|店舗詳細|基本情報)$/i.test(text(h[2] ?? "")));
  if (information.length > 1) changed();
  let scope = html;
  const heading = information[0];
  if (heading) {
    const end = headings.find(h => h.index! > heading.index! && Number(h[1]) <= Number(heading[1]));
    scope = html.slice(heading.index! + heading[0].length, end?.index ?? html.length);
  } else {
    const main = [...html.matchAll(/<main\b[^>]*>([^]*?)<\/main\s*>/gi)];
    if (main.length > 1) changed();
    scope = main[0]?.[1] ?? html;
  }
  const rows = [
    ...[...scope.matchAll(/<tr\b[^>]*>([^]*?)<\/tr\s*>/gi)].flatMap(row => {
      const label = row[1]?.match(/<th\b[^>]*>([^]*?)<\/th\s*>/i)?.[1];
      const value = row[1]?.match(/<td\b[^>]*>([^]*?)<\/td\s*>/i)?.[1];
      return label !== undefined && value !== undefined ? [{ label: text(label), html: value }] : [];
    }),
    ...[...scope.matchAll(/<dt\b[^>]*>([^]*?)<\/dt\s*>\s*<dd\b[^>]*>([^]*?)<\/dd\s*>/gi)]
      .map(row => ({ label: text(row[1] ?? ""), html: row[2] ?? "" })),
  ];
  const names = [...new Set(rows.filter(row => /^(?:restaurant name|shop name|店名|店舗名)$/i.test(row.label)).map(row => text(row.html)))];
  if (names.length > 1 || (names[0] && sourceName && !ownerKey(names[0]).includes(ownerKey(sourceName)) && !ownerKey(sourceName).includes(ownerKey(names[0])))) changed();
  if (!heading && !names.length) return undefined;
  const visible = compact(snapshot.text);
  const addresses = [...new Set(rows.filter(row => /^(?:address|住所|所在地)$/i.test(row.label)).map(row => text(row.html.replace(/<a\b[^>]*>([^]*?)<\/a\s*>/gi,
    (anchor, label: string) => /^(?:show larger map|find nearby restaurants|地図|大きな地図を見る)$/i.test(text(label)) ? "" : anchor))))]
    .filter(value => value && visible.includes(compact(value)));
  if (addresses.length > 1) changed();
  const phones: DetailPhone[] = [];
  for (const row of rows) {
    if (!/^(?:phone(?: number)?|telephone|tel|電話番号|電話|お問い合わせ)(?:\s*\([^)]*\))?$|^(?:reservations?(?: and (?:availability|inquir(?:y|ies)))?|予約・お問い合わせ|予約専用電話)$/i.test(row.label)) continue;
    const role = /reserv|予約/i.test(row.label) ? "RESERVATION" as const : "STORE" as const;
    for (const match of text(row.html).matchAll(/(?:\+81[-\s]?)?(?:0?\d{1,4}[-\s]\d{2,4}[-\s]\d{3,4}|0\d{9,10})/g)) {
      const value = match[0];
      if (!visible.includes(compact(value)) || !visible.includes(compact(row.label))) continue;
      if (!phones.some(phone => phone.value === value && phone.role === role)) phones.push({ value, role, quote: value, label: row.label, sourceUrl: snapshot.url });
    }
  }
  const addressQuote = addresses[0];
  const address = addressQuote && postalCode && !addressQuote.replace(/\D/g, "").includes(postalCode.replace(/\D/g, ""))
    ? `${postalCode} ${addressQuote}` : addressQuote;
  if (address && structuredAddress && compareCompleteOutletAddress(structuredAddress, address) === "CONFLICT") changed();
  if (!address && !phones.length) return undefined;
  return { sourceUrl: snapshot.url, phones, ...(address ? { address, addressQuote: addressQuote! } : {}),
    ...(address && address !== addressQuote && postalCode ? { postalQuote: postalCode } : {}) };
}

/** A quoted second phone is equal evidence only when bound to this same outlet/read. */
export function detailPhones(outlet: WithDetailIdentity<{ sourceUrl: string }>): DetailPhone[] {
  const detail = outlet.detailIdentity;
  const key = (value: string) => { const url = new URL(value); return `${url.origin}${url.pathname.replace(/\/$/, "")}`; };
  if (!detail || key(detail.canonicalUrl ?? detail.sourceUrl) !== key(outlet.sourceUrl)) return [];
  return detail.phones.filter(phone => phone.sourceUrl === detail.sourceUrl && phone.quote.includes(phone.value));
}
export function plainOutlet<T extends { sourceUrl: string }>(outlet: WithDetailIdentity<T>): T {
  const { detailIdentity: _detail, ...standard } = outlet;
  return standard as T;
}
