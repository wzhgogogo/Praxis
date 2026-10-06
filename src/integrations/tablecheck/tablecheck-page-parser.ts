import type { BrowserPageControl, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { RestaurantCandidate, RestaurantServiceScope } from "../../domains/restaurant/contracts.js";
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

/** Preserve source paragraph boundaries for later bounded document statements. */
function sourceText(value: string): string {
  return value
    .replace(/<(?:br\s*\/?|\/(?:address|article|aside|div|h[1-6]|li|main|p|section|tr|ul|ol))\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t\f\v]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function decodedAttribute(value: string): string {
  return value.replace(/&quot;/gi, '"').replace(/&#(?:x27|39);/gi, "'").replace(/&amp;/gi, "&");
}

function markupAttribute(markup: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = markup.match(new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  const value = found?.[1] ?? found?.[2] ?? found?.[3];
  return value === undefined ? undefined : decodedAttribute(value);
}

function menuCategoryValues(markup: string): string[] {
  const raw = markupAttribute(markup, "data-service-categories");
  if (!raw) return [];
  try {
    const values = JSON.parse(raw) as unknown;
    return Array.isArray(values) && values.every((value) => typeof value === "string" && value.trim())
      ? [...new Set(values.map((value) => value.trim()))]
      : [];
  } catch { return []; }
}

interface MenuMarkupNode {
  name: string;
  start: number;
  contentStart: number;
  menuContainer: boolean;
  categories: Set<string>;
}

function isMenuContainer(markup: string): boolean {
  const classes = (markupAttribute(markup, "class") ?? "").split(/\s+/).filter(Boolean);
  // `menu-item-data` is metadata inside the outer menu item; labels such as
  // `menu-item-title` and `menu-item-description` are siblings, not scopes.
  return classes.some((value) => value.toLowerCase() === "menu-item");
}

/** Remove markup that browsers do not expose as DOM menu content, preserving offsets. */
function tableCheckDomMarkup(html: string): string {
  const blank = (value: string) => value.replace(/[^\n\r]/g, " ");
  return html
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, blank);
}

function observedTableCheckServiceScopes(controls: readonly BrowserPageControl[]): Map<string, RestaurantServiceScope> {
  const scopes = new Map<string, RestaurantServiceScope>();
  for (const control of controls) {
    const field = control.structure?.name;
    const group = control.structure?.radioGroupKey;
    const value = control.value?.trim();
    const label = control.label.trim();
    if (control.kind !== "RADIO" || !control.visible || control.disabled || field !== "reservation[service_category]" || !group || !value || !label) continue;
    scopes.set(value, { field, group, value, label });
  }
  return scopes;
}

export interface TableCheckScopedMenuExcerpt {
  serviceScope: RestaurantServiceScope;
  /** Public text structurally contained by the category-tagged menu item. */
  text: string;
}

export interface TableCheckScopedMenuSourcePartition {
  scoped: TableCheckScopedMenuExcerpt[];
  /** Remaining visible page text after recognized category menu items are removed. */
  unscopedText: string;
}

/**
 * Reads public menu category data only when a category-tagged element is
 * structurally inside a menu item and names a visible observed radio value.
 * It is cited source text, never an availability result.
 */
export function parseTableCheckScopedMenuSourcePartition(
  snapshot: BrowserSnapshot,
  controls: readonly BrowserPageControl[],
): TableCheckScopedMenuSourcePartition {
  if (!isTableCheckUrl(snapshot.url)) return { scoped: [], unscopedText: sourceText(tableCheckDomMarkup(snapshot.html)) };
  const scopes = observedTableCheckServiceScopes(controls);
  if (!scopes.size) return { scoped: [], unscopedText: sourceText(tableCheckDomMarkup(snapshot.html)) };
  const html = tableCheckDomMarkup(snapshot.html);
  const nodes: MenuMarkupNode[] = [];
  const completed: Array<MenuMarkupNode & { end: number }> = [];
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  const tags = /<\s*(\/?)\s*([a-z][\w-]*)\b[^>]*>/gi;
  for (let match = tags.exec(html); match; match = tags.exec(html)) {
    const closing = match[1] === "/";
    const name = match[2]!.toLowerCase();
    const markup = match[0];
    if (!closing) {
      const categories = menuCategoryValues(markup);
      if (categories.length) {
        const owner = [...nodes].reverse().find((item) => item.menuContainer);
        if (owner) categories.forEach((value) => owner.categories.add(value));
      }
      if (!voidTags.has(name) && !/\/\s*>$/.test(markup)) {
        nodes.push({ name, start: match.index, contentStart: tags.lastIndex, menuContainer: isMenuContainer(markup), categories: new Set<string>() });
      }
      continue;
    }
    const index = nodes.map((node) => node.name).lastIndexOf(name);
    if (index < 0) continue;
    // A closing ancestor also closes any malformed unclosed descendants. Drop
    // those descendants rather than letting their categories leak into the
    // next sibling menu item.
    const [node] = nodes.splice(index, nodes.length - index);
    if (node?.menuContainer && node.categories.size) completed.push({ ...node, end: match.index });
  }
  const excerpts: TableCheckScopedMenuExcerpt[] = [];
  const scopedRanges: Array<{ start: number; end: number }> = [];
  const seen = new Set<string>();
  for (const item of completed) {
    const text = sourceText(html.slice(item.contentStart, item.end));
    if (!text) continue;
    let hasObservedScope = false;
    for (const value of item.categories) {
      const serviceScope = scopes.get(value);
      if (!serviceScope) continue;
      hasObservedScope = true;
      const fingerprint = `${serviceScope.field}\u0000${serviceScope.group}\u0000${serviceScope.value}\u0000${text}`;
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      excerpts.push({ serviceScope, text });
    }
    if (hasObservedScope) scopedRanges.push({ start: item.start, end: item.end });
  }
  let unscopedMarkup = html;
  for (const range of scopedRanges.sort((left, right) => right.start - left.start)) {
    unscopedMarkup = `${unscopedMarkup.slice(0, range.start)}${" ".repeat(range.end - range.start)}${unscopedMarkup.slice(range.end)}`;
  }
  return { scoped: excerpts, unscopedText: sourceText(unscopedMarkup) };
}

export function parseTableCheckScopedMenuExcerpts(
  snapshot: BrowserSnapshot,
  controls: readonly BrowserPageControl[],
): TableCheckScopedMenuExcerpt[] {
  return parseTableCheckScopedMenuSourcePartition(snapshot, controls).scoped;
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
  // Parsing reports the observed list; callers bound detail inspection separately.
  // HIGH still requires detail-page identity evidence.
  return (related.length ? related : unique).map((item) => item.url);
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
  let outletUrl: URL;
  try { outletUrl = new URL(outlet.sourceUrl); } catch { return undefined; }
  // A guide may publish its booking surface on /shops/ rather than beneath
  // the guide URL. Accept that route only when the guide's own Restaurant
  // record names this exact entity and explicitly supplies the target.
  const pageUrl = absoluteTableCheckUrl(snapshot.url, snapshot.url);
  if (pageUrl && new URL(pageUrl).origin === outletUrl.origin && new URL(pageUrl).pathname.replace(/\/$/, "") === outletUrl.pathname.replace(/\/$/, "")) {
    for (const entity of jsonLdObjects(snapshot.html)) {
      if (entity["@type"] !== "Restaurant") continue;
      const entityId = typeof entity["@id"] === "string" ? absoluteTableCheckUrl(entity["@id"], snapshot.url) : undefined;
      if (!entityId || new URL(entityId).origin !== outletUrl.origin || new URL(entityId).pathname.replace(/\/$/, "") !== outletUrl.pathname.replace(/\/$/, "")) continue;
      if (typeof entity.acceptsReservations !== "string") continue;
      const link = absoluteTableCheckUrl(entity.acceptsReservations, snapshot.url);
      if (!link) continue;
      const target = new URL(link);
      if (/^\/(?:en|ja)\/shops\/[^/]+\/reserve\/?$/.test(target.pathname)) {
        return { kind: "LINKED_PAGE", url: target.toString() };
      }
    }
  }
  if (/data-testid=["']Venue Availability["']/i.test(snapshot.html)) {
    return { kind: "EMBEDDED_AVAILABILITY", url: outlet.sourceUrl };
  }
  for (const match of snapshot.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    const link = absoluteTableCheckUrl(match[1] ?? "", snapshot.url);
    if (!link) continue;
    const target = new URL(link);
    if (target.pathname.startsWith(`${outletUrl.pathname.replace(/\/$/, "")}/reserve`)) {
      return { kind: "LINKED_PAGE", url: target.toString() };
    }
    // A guide and its public reservation page may use different route shapes.
    // The page itself is still allowed to provide that entrance when the
    // observed shops slug equals the source entity ID; this is a same-source
    // structural relation, not a name or URL guess.
    const shop = target.pathname.match(/^\/(?:en|ja)\/shops\/([^/]+)\/reserve\/?$/)?.[1];
    const sourceEntityId = outlet.sourceEntityId.replace(/^\/(?:en|ja)\//, "").replace(/^shops\//, "").replace(/\/$/, "");
    if (shop && shop === sourceEntityId) return { kind: "LINKED_PAGE", url: target.toString() };
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

function selectedAttribute(attrs: string, names: string[]): string | undefined {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const value = attrs.match(new RegExp(`\\bdata-${escaped}=["']([^"']+)["']`, "i"))?.[1];
    if (value) return value;
  }
  return undefined;
}

/**
 * The provider must expose one explicit current-request component. Combining a date
 * found in one unrelated control with a party size found elsewhere can bind stale
 * results to a new request, so page-wide value co-occurrence is deliberately invalid.
 */
/** Isolate the one source-owned availability widget, not unrelated page-wide values. */
function tableCheckGuideQuery(snapshot: BrowserSnapshot): { html: string; date: string; party: string; time: string } | undefined {
  const starts = [...snapshot.html.matchAll(/<div\b[^>]*data-testid=["']Venue Availability["'][^>]*>/gi)];
  if (starts.length !== 1) return undefined;
  const start = starts[0]!;
  const tail = snapshot.html.slice(start.index);
  let depth = 0;
  let html = "";
  for (const tag of tail.matchAll(/<\/?div\b[^>]*>/gi)) {
    depth += tag[0].startsWith("</") ? -1 : 1;
    if (depth === 0) { html = tail.slice(0, tag.index! + tag[0].length); break; }
  }
  if (!html || /class=["'][^"']*\bskeleton\b/.test(html)) return undefined;
  const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];
  const dates = [...html.matchAll(/<button\b[^>]*>/gi)].map(match => match[0])
    .filter(tag => attr(tag, "data-testid") === "day" && attr(tag, "aria-selected") === "true")
    .map(tag => attr(tag, "data-date"));
  const controls = [...html.matchAll(/<div\b[^>]*>/gi)].map(match => match[0]);
  const pax = controls.filter(tag => attr(tag, "data-testid") === "Venue Pax Select");
  const time = controls.filter(tag => attr(tag, "data-testid") === "Venue Time Select");
  const date = dates.length === 1 ? dates[0]?.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/) : undefined;
  const party = pax.length === 1 ? attr(pax[0]!, "id")?.match(/^pax-(\d+)$/)?.[1] : undefined;
  const clock = time.length === 1 ? attr(time[0]!, "id")?.match(/^time-([0-2]\d:[0-5]\d)$/)?.[1] : undefined;
  if (!date || !party || !clock) return undefined;
  return {html, date:`${date[1]}-${date[2]!.padStart(2,"0")}-${date[3]!.padStart(2,"0")}`,party,time:clock};
}

/** A booking form's HTML attributes can be stale after JavaScript changes its controls. */
function isReservationFormPage(snapshot: BrowserSnapshot): boolean {
  try {
    const url = new URL(snapshot.url);
    return TABLECHECK_URL.test(snapshot.url) && /^\/(?:(?:en|ja)\/)?shops\/[^/]+\/reserve\/?$/.test(url.pathname);
  } catch { return false; }
}

function reservationFormSelectedRequest(snapshot: BrowserSnapshot, date: string, partySize: number, controls: readonly BrowserPageControl[] | undefined): boolean {
  if (!controls) return false;
  const attribute = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1];
  let matchingForms = 0;
  for (const form of snapshot.html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/gi)) {
    const html = form[1] ?? "";
    const dateInputs = [...html.matchAll(/<input\b[^>]*>/gi)].map((item) => item[0])
      .filter((tag) => attribute(tag, "name") === "reservation[start_date]");
    const adultSelects = [...html.matchAll(/<select\b[^>]*>([\s\S]*?)<\/select>/gi)]
      .filter((item) => attribute(item[0], "name") === "reservation[num_people_adult]");
    if (dateInputs.length === 1 && adultSelects.length === 1) matchingForms += 1;
  }
  if (matchingForms !== 1) return false;
  const dates = controls.filter((item) => item.visible && !item.disabled && item.kind === "INPUT" && item.structure?.name === "reservation[start_date]");
  const adults = controls.filter((item) => item.visible && !item.disabled && item.kind === "SELECT" && item.structure?.name === "reservation[num_people_adult]");
  if (dates.length !== 1 || adults.length !== 1 || dates[0]!.value !== date || adults[0]!.value !== String(partySize)) return false;
  const selected = adults[0]!.options?.filter((option) => option.selected) ?? [];
  return selected.length === 1 && selected[0]!.value === String(partySize);
}

export function hasTableCheckSelectedRequest(snapshot: BrowserSnapshot, date: string, partySize: number, controls?: readonly BrowserPageControl[]): boolean {
  if (isReservationFormPage(snapshot)) return reservationFormSelectedRequest(snapshot, date, partySize, controls);
  const guide = tableCheckGuideQuery(snapshot);
  if (guide?.date === date && guide.party === String(partySize)) return true;
  for (const element of snapshot.html.matchAll(/<(?:form|section|div|main)[^>]*>/gi)) {
    const attrs = element[0] ?? "";
    const selectedDate = selectedAttribute(attrs, ["selected-date", "start-date", "date"]);
    const selectedParty = selectedAttribute(attrs, ["party-size", "pax", "guests", "party"]);
    if (selectedDate === date && selectedParty === String(partySize)) return true;
  }
  // TableCheck's public guide can render the current query only on its slot links.
  // An exact same-origin reservation-link parameter set is a structured result binding,
  // unlike a date/guest string found somewhere in page prose.
  return tableCheckReservationLinks(snapshot, date, partySize).length > 0;
}

export interface TableCheckSlotParse {
  availableSlots: string[];
  hasExplicitSlotUi: boolean;
  /** A result container explicitly reports that the current completed query has no matching table. */
  explicitlyEmpty: boolean;
  /** The provider marks the result set complete, not merely still loading or partially rendered. */
  queryComplete: boolean;
}

function timeIn(value: string): string | undefined { return value.match(/\b([01]\d|2[0-3]):[0-5]\d\b/)?.[0]; }
/**
 * Read disabled state from markup attributes, never from arbitrary card text
 * or a request URL. In particular `data-is-disabled="false"` remains an
 * enabled slot in the provider's historical markup.
 */
function disabledControlMarkup(value: string): boolean {
  // Native `disabled` is a Boolean attribute: any value, including an empty
  // string or `"false"`, leaves the element disabled. ARIA/data flags carry
  // an explicit Boolean value and therefore accept only true-like values.
  return /<[^>]*\sdisabled(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?(?=\s|\/?>)/i.test(value)
    || /<[^>]*\s(?:aria-disabled|data-(?:is-)?disabled)\s*=\s*(?:["'](?:true|disabled|1)["']|(?:true|disabled|1))(?=\s|\/?>)/i.test(value);
}

/**
 * Saved source markup can retain prior reservation cards under a hidden
 * container. Those descendants are not current public slots. Remove only the
 * hidden subtree so a visible sibling card in the same result region remains
 * observable.
 */
function visibleTableCheckMarkup(html: string): string {
  const hidden = /\bhidden\b|aria-hidden=["']true["']|\bis-hidden\b|display\s*:\s*none|visibility\s*:\s*hidden/i;
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  const stack: Array<{ tag: string; hidden: boolean }> = [];
  let visible = "";
  let cursor = 0;
  for (const match of html.matchAll(/<\/?([a-z][\w-]*)([^>]*)>/gi)) {
    const whole = match[0] ?? "";
    const tag = (match[1] ?? "").toLowerCase();
    const closing = /^<\//.test(whole);
    const parentHidden = stack.at(-1)?.hidden === true;
    if (!parentHidden) visible += html.slice(cursor, match.index);
    if (closing) {
      const entry = stack.pop();
      if (!entry?.hidden) visible += whole;
    } else {
      const entryHidden = parentHidden || hidden.test(match[2] ?? "");
      if (!entryHidden) visible += whole;
      if (!voidTags.has(tag) && !/\/\s*>$/.test(whole)) stack.push({ tag, hidden: entryHidden });
    }
    cursor = (match.index ?? cursor) + whole.length;
  }
  if (stack.at(-1)?.hidden !== true) visible += html.slice(cursor);
  return visible;
}
function unavailable(value: string): boolean { return disabledControlMarkup(value) || /\b(?:unavailable|sold[\s-]?out|full)\b|満席|予約不可/i.test(value); }
function explicitAvailability(value: string): boolean {
  return /data-(?:available|bookable)=["']true|data-(?:status|state)=["']available|class=["'][^"']*(?:available|bookable)[^"']*["']/i.test(value);
}

/** A time is a slot only when the reservation UI explicitly marks it bookable. */
export function parseTableCheckAvailabilitySlots(
  snapshot: BrowserSnapshot,
  request?: { date: string; partySize: number; timeWindow?: { earliest: string; latest: string } },
): TableCheckSlotParse {
  const visibleSnapshot = { ...snapshot, html: visibleTableCheckMarkup(snapshot.html) };
  const guide = tableCheckGuideQuery(visibleSnapshot);
  if (request && isReservationFormPage(visibleSnapshot)) {
    // Live form controls confirm what is selected; an older result container
    // can remain on the page until the new request finishes. Only the
    // existing same-outlet slot-link format binds stock to this request.
    const availableSlots = tableCheckReservationLinks(visibleSnapshot, request.date, request.partySize);
    // A complete list containing only other mealtimes, or an empty marker for
    // one selected mealtime, does not prove the whole requested window empty.
    const inWindow = availableSlots.some((time) => !request.timeWindow || time >= request.timeWindow.earliest && time <= request.timeWindow.latest);
    return { availableSlots, hasExplicitSlotUi: availableSlots.length > 0, explicitlyEmpty: false,
      queryComplete: inWindow };
  }
  // A message for one selected mealtime cannot prove an entire alternative-time window empty.
  if (request && guide?.date === request.date && guide.party === String(request.partySize)
    && request.timeWindow?.earliest === guide.time && request.timeWindow.latest === guide.time
    && /data-testid=["']Venue Unavailable Msg["']/.test(guide.html)
    && /We could not find a table on/.test(guide.html)) {
    return { availableSlots: [], hasExplicitSlotUi: true, explicitlyEmpty: true, queryComplete: true };
  }
  const slots = new Set<string>();
  let hasExplicitSlotUi = false;
  let explicitlyEmpty = false;
  let queryComplete = false;
  // The public guide enumerates half-hour timeslot cards. Only a ready,
  // request-bound widget with every requested card explicitly disabled can
  // establish an empty window; missing cards and nearby available times cannot.
  if (request?.timeWindow && guide?.date === request.date && guide.party === String(request.partySize)
    && guide.time >= request.timeWindow.earliest && guide.time <= request.timeWindow.latest) {
    const disabledTimes = new Set<string>();
    for (const match of guide.html.matchAll(/<a\b[^>]*data-testid=["']Venue Timeslot Btn["'][^>]*>[\s\S]*?<\/a>/gi)) {
      const card = match[0];
      if (!/aria-disabled=["']true["']/.test(card) || !/<button\b[^>]*\sdisabled(?:=["'][^"']*["'])?[\s>]/.test(card)) continue;
      const time = plainText(card);
      if (/^(?:[01]\d|2[0-3]):(?:00|30)$/.test(time)) disabledTimes.add(time);
    }
    const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
    const start = minutes(request.timeWindow.earliest);
    const end = minutes(request.timeWindow.latest);
    if (start <= end && start % 30 === 0 && end % 30 === 0) {
      const requestedTimes = Array.from({length: (end - start) / 30 + 1}, (_, index) => {
        const value = start + index * 30;
        return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
      });
      explicitlyEmpty = requestedTimes.every(time => disabledTimes.has(time));
      queryComplete = explicitlyEmpty;
      hasExplicitSlotUi = explicitlyEmpty;
    }
  }
  // A page-wide phrase or a stray time must never be treated as a query result. The
  // provider needs an explicit result-state element; the caller binds it to the current
  // request component before accepting the result.
  for (const match of visibleSnapshot.html.matchAll(/<(?:section|div|main)[^>]+(?:data-(?:availability|query|result)-(?:state|status)|aria-live)[^>]*>/gi)) {
    const attrs = match[0] ?? "";
    if (/data-(?:availability|query|result)-(?:state|status)=["'](?:empty|no[_-]?results|unavailable)["']/i.test(attrs)) {
      hasExplicitSlotUi = true;
      explicitlyEmpty = true;
      queryComplete = true;
    }
    if (/data-(?:availability|query|result)-(?:state|status)=["'](?:complete|ready|empty|no[_-]?results|unavailable)["']|data-availability-complete=["']true["']/i.test(attrs)) queryComplete = true;
  }
  const element = /<(button|a)[^>]*?(?:data-(?:time|start-time|slot)|class=["'][^"']*(?:slot|time|availability)[^"']*)[^>]*>([\s\S]{0,500}?)<\/\1>/gi;
  for (const match of visibleSnapshot.html.matchAll(element)) {
    const whole = match[0] ?? "";
    const time = whole.match(/data-(?:time|start-time|slot)=["']([^"']+)["']/i)?.[1] ?? timeIn(`${whole} ${plainText(match[2] ?? "")}`);
    if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) continue;
    if (explicitAvailability(whole) || unavailable(whole)) hasExplicitSlotUi = true;
    if (explicitAvailability(whole) && !unavailable(whole)) slots.add(time);
  }
  if (request) {
    const linkedSlots = tableCheckReservationLinks(visibleSnapshot, request.date, request.partySize);
    for (const slot of linkedSlots) slots.add(slot);
    // A public slot link includes the provider's exact request parameters and is a
    // completed result for that request. It is read as evidence only; never opened.
    if (linkedSlots.length > 0) {
      hasExplicitSlotUi = true;
      // A nearby mealtime is not proof that the requested window is empty.
      queryComplete ||= !request.timeWindow || linkedSlots.some(time => time >= request.timeWindow!.earliest && time <= request.timeWindow!.latest);
    }
  }
  return { availableSlots: [...slots].sort(), hasExplicitSlotUi, explicitlyEmpty, queryComplete };
}

/** A neighbouring restaurant's reservation link is never this outlet's stock. */
export function sameReservationOutlet(sourceUrl: string, link: URL): boolean {
  const expected = stableSourceEntityId(sourceUrl).replace(/^shops\//, "");
  // TableCheck publishes both the legacy /shops/<slug>/reserve path and the
  // guide-owned /<slug>/reserve[/landing] path. Both still have to name the
  // same observed outlet; URL shape alone is never an identity assertion.
  const actual = link.pathname.match(/^\/(?:en|ja)\/(?:shops\/)?([^/]+)\/reserve(?:\/landing)?\/?$/)?.[1];
  return expected !== "unknown" && actual === expected;
}

function tableCheckReservationLinks(snapshot: BrowserSnapshot, date: string, partySize: number): string[] {
  const slots = new Set<string>();
  for (const match of snapshot.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,2400}?)<\/a>/gi)) {
    const renderedCard = match[0] ?? "";
    // A request-shaped URL is only an inventory result while its rendered card
    // remains enabled and ready.  A disabled anchor or disabled child button
    // must not revive availability that the live control registry rejected.
    if (disabledControlMarkup(renderedCard) || /(?:\bskeleton\b|\bloading\b|aria-busy=["']true)/i.test(renderedCard)) continue;
    const href = absoluteTableCheckUrl(match[1] ?? "", snapshot.url);
    if (!href) continue;
    const url = new URL(href);
    if (!sameReservationOutlet(snapshot.url, url)) continue;
    const selectedDate = url.searchParams.get("start_date") ?? url.searchParams.get("date");
    const selectedParty = url.searchParams.get("num_people") ?? url.searchParams.get("pax") ?? url.searchParams.get("party_size");
    if (selectedDate !== date || selectedParty !== String(partySize)) continue;
    const time = url.searchParams.get("start_time") ?? timeIn(plainText(match[2] ?? ""));
    if (time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) slots.add(time);
  }
  return [...slots].sort();
}

/**
 * An enabled hydrated link cannot revive an exact request whose rendered
 * source card is explicitly disabled (including a disabled child button).
 */
export function hasTableCheckDisabledRequestMarkup(
  snapshot: BrowserSnapshot,
  date: string,
  partySize: number,
  timeWindow: { earliest: string; latest: string },
  availableSlots?: readonly string[],
): boolean {
  const visibleHtml = visibleTableCheckMarkup(snapshot.html);
  for (const match of visibleHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,2400}?)<\/a>/gi)) {
    const renderedCard = match[0] ?? "";
    if (!disabledControlMarkup(renderedCard)) continue;
    const href = absoluteTableCheckUrl(match[1] ?? "", snapshot.url);
    if (!href) continue;
    const url = new URL(href);
    if (!sameReservationOutlet(snapshot.url, url)) continue;
    const selectedDate = url.searchParams.get("start_date") ?? url.searchParams.get("date");
    const selectedParty = url.searchParams.get("num_people") ?? url.searchParams.get("pax") ?? url.searchParams.get("party_size");
    const time = url.searchParams.get("start_time") ?? timeIn(plainText(match[2] ?? ""));
    if (selectedDate === date && selectedParty === String(partySize) && time
      && time >= timeWindow.earliest && time <= timeWindow.latest
      && (availableSlots === undefined || availableSlots.includes(time))) return true;
  }
  return false;
}

/** Same public result evidence as the HTML parser, acquired from the live DOM only. */
export function parseTableCheckControlAvailability(
  controls: readonly BrowserPageControl[],
  date: string,
  partySize: number,
  sourceUrl: string,
  timeWindow: { earliest: string; latest: string },
): TableCheckSlotParse {
  const slots = new Set<string>();
  for (const control of controls) {
    if (control.kind !== "LINK" || !control.href || control.disabled) continue;
    let url: URL;
    try { url = new URL(control.href); } catch { continue; }
    if (!isTableCheckUrl(url.toString()) || !sameReservationOutlet(sourceUrl, url)) continue;
    const selectedDate = url.searchParams.get("start_date") ?? url.searchParams.get("date");
    const selectedParty = url.searchParams.get("num_people") ?? url.searchParams.get("pax") ?? url.searchParams.get("party_size");
    const time = url.searchParams.get("start_time") ?? timeIn(control.label);
    if (selectedDate === date && selectedParty === String(partySize) && time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) slots.add(time);
  }
  const availableSlots = [...slots].sort();
  return { availableSlots, hasExplicitSlotUi: availableSlots.length > 0, explicitlyEmpty: false, queryComplete: availableSlots.some(time => time >= timeWindow.earliest && time <= timeWindow.latest) };
}

/** A live disabled exact-request control vetoes a stale enabled HTML anchor. */
export function hasTableCheckDisabledRequestControl(
  controls: readonly BrowserPageControl[],
  date: string,
  partySize: number,
  sourceUrl: string,
  timeWindow: { earliest: string; latest: string },
  availableSlots?: readonly string[],
): boolean {
  return controls.some((control) => {
    if (control.kind !== "LINK" || !control.href || !control.disabled) return false;
    let url: URL;
    try { url = new URL(control.href); } catch { return false; }
    if (!isTableCheckUrl(url.toString()) || !sameReservationOutlet(sourceUrl, url)) return false;
    const selectedDate = url.searchParams.get("start_date") ?? url.searchParams.get("date");
    const selectedParty = url.searchParams.get("num_people") ?? url.searchParams.get("pax") ?? url.searchParams.get("party_size");
    const time = url.searchParams.get("start_time") ?? timeIn(control.label);
    return selectedDate === date && selectedParty === String(partySize) && time !== undefined
      && time >= timeWindow.earliest && time <= timeWindow.latest
      && (availableSlots === undefined || availableSlots.includes(time));
  });
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
