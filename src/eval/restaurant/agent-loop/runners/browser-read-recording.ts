import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

import type { BrowserActionWireRecord } from "../../../../infrastructure/browser/browser-action-decision.js";
import type { BrowserReadNetworkObservation, BrowserReadNetworkRequestRule, BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";
import type { BrowserTraceRecordingSink } from "./browser-case-slice-evidence.js";
import { safeRecord, safeString } from "./browser-case-slice-evidence.js";

export interface BrowserReadRecordingEntry { sequence: number; kind: string; detail: unknown; }
type Replay = { status: "REPLAYABLE"; reason: "SANITIZED_NETWORK_AND_DOM_CAPTURE"; harPath: string }
  | { status: "NOT_REPLAYABLE"; reason: "NO_CAPTURED_PUBLIC_DOCUMENT" | "UNSAFE_DOCUMENT" | "UNSAFE_REDIRECT" | "UNCAPTURED_DYNAMIC_RESPONSE" | "UNCAPTURED_STATIC_DEPENDENCY" };
export interface BrowserReadRecordingResult { path: string; screenshot: "LAYOUT_ONLY_CONTENT_MASKED" | "NOT_CAPTURED_NO_SANITIZER"; replay: Replay; }
export interface BrowserReadRecordingOptions {
  directory: string; runId: string;
  /**
   * Public static code may be replayed only when the source Pack already
   * admitted its origin, path grammar and cache-buster keys.  The recorder
   * receives no headers, cookies or request body, and does not alter code.
  */
  reviewedStaticResources?: readonly BrowserReadNetworkRequestRule[];
  /** Pack-owned public document/query grammar retained for faithful Replay. */
  reviewedReads?: readonly BrowserReadNetworkRequestRule[];
}

/** Writes only sanitised public documents and admitted public read responses. */
export class BrowserReadRecording {
  private readonly entries: BrowserReadRecordingEntry[] = [];
  private readonly documents = new Map<string, string>();
  private readonly documentSnapshots: Array<{ snapshot: number; url: string; html: string }> = [];
  private readonly responses = new Map<string, { method: "GET" | "HEAD"; status: number; mimeType: string; text: string; redirectLocation?: string }>();
  private readonly dynamicPaths = new Set<string>();
  /** Admitted external scripts can create the observed dynamic DOM; a final snapshot cannot replace them in replay. */
  private readonly requiredStaticScriptPaths = new Set<string>();
  private readonly uncapturedResponsePaths = new Set<string>();
  private readonly screenshotImages: Array<{ file: string; png: Uint8Array }> = [];
  private snapshotCount = 0;
  private readonly screenshots: Array<{ snapshot: number; status: "LAYOUT_ONLY_CONTENT_MASKED" | "OMITTED_UNSAFE_NO_LAYOUT_SANITIZER"; file?: string }> = [];
  private replayFailure: "UNSAFE_DOCUMENT" | "UNSAFE_REDIRECT" | "UNCAPTURED_DYNAMIC_RESPONSE" | "UNCAPTURED_STATIC_DEPENDENCY" | undefined;
  private finished = false;
  constructor(private readonly options: BrowserReadRecordingOptions) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(options.runId)) throw new Error("Browser recording runId must be a safe artifact identifier");
  }
  record(kind: string, detail: unknown): void {
    if (this.finished) throw new Error("Browser recording is already finalized");
    this.entries.push({ sequence: this.entries.length + 1, kind, detail: safeRecordingDetail(detail) });
  }
  recordWire(wire: BrowserActionWireRecord): void { this.record("MODEL_WIRE", wire); }
  traceSink(): BrowserTraceRecordingSink { return { record: (kind, detail) => this.record(kind, detail), recordSnapshot: (snapshot) => this.recordSnapshot(snapshot), recordResponse: response => this.recordResponse(response), captureScreenshot: (png, disposition) => this.captureScreenshot(png, disposition) }; }
  /** Lets a runner retain its single canonical trace while supplying captured documents to this recorder. */
  snapshotSink(): BrowserTraceRecordingSink { return { record: () => undefined, recordSnapshot: snapshot => this.recordSnapshot(snapshot), recordResponse: response => this.recordResponse(response), captureScreenshot: (png, disposition) => this.captureScreenshot(png, disposition) }; }
  recordNetwork(requests: readonly BrowserReadNetworkObservation[]): void { this.record("NETWORK", requests.map(item => ({ outcome: item.outcome, origin: item.origin, pathname: item.pathname, method: item.method, resourceType: item.resourceType, queryKeys: [...item.queryKeys] }))); }
  async recordResponse(response: { url: string; method: string; status: number; contentType: string; body: Uint8Array; redirectLocation?: string }): Promise<void> {
    if (this.finished) throw new Error("Browser recording is already finalized");
    const url = safeReplayUrl(response.url, this.options.reviewedStaticResources, this.options.reviewedReads);
    const mimeType = response.contentType.split(";", 1)[0]?.toLowerCase() ?? "";
    if (!url || !/^(?:GET|HEAD)$/.test(response.method)) { this.uncapturedResponsePaths.add(responsePath(response.url)); return; }
    let text: string;
    try { text = new TextDecoder("utf-8", { fatal: true }).decode(response.body); }
    catch { this.uncapturedResponsePaths.add(responsePath(response.url)); return; }
    const redirectLocation = response.redirectLocation
      ? safeReplayUrl(response.redirectLocation, this.options.reviewedStaticResources, this.options.reviewedReads)
      : undefined;
    if (response.redirectLocation && !redirectLocation) { this.replayFailure ??= "UNSAFE_REDIRECT"; return; }
    // A public redirect's response body is not needed to faithfully preserve
    // navigation. Keep its approved status and Location even when it is empty.
    const isRecordedRedirect = response.status >= 300 && response.status < 400 && Boolean(redirectLocation);
    const sanitized = isRecordedRedirect ? "" : mimeType.includes("json") ? sanitizePublicJson(text)
      : /^(?:text\/(?:html|plain)|application\/(?:xhtml\+xml))$/.test(mimeType) ? sanitizePublicHtml(text, response.url, this.options.reviewedStaticResources, this.options.reviewedReads)
      : /^(?:application|text)\/(?:javascript|ecmascript)$/.test(mimeType)
        ? (reviewedStaticScriptUrl(response.url, this.options.reviewedStaticResources) && safeReviewedPublicScript(text, response.body.byteLength) ? text : undefined)
      : mimeType === "text/css" ? (safeReplayCss(text) ? text : undefined)
      : undefined;
    if (sanitized === undefined) { this.uncapturedResponsePaths.add(responsePath(response.url)); return; }
    this.responses.set(url, {
      method: response.method as "GET" | "HEAD",
      status: response.status,
      mimeType,
      text: sanitized,
      ...(redirectLocation ? { redirectLocation } : {}),
    });
  }
  recordSnapshot(snapshot: BrowserSnapshot): void {
    if (this.finished) throw new Error("Browser recording is already finalized");
    this.snapshotCount += 1;
    const requests = snapshot.networkRequests ?? [];
    this.recordNetwork(requests);
    for (const item of requests) if (item.outcome === "ADMITTED" && /^(?:xhr|fetch)$/i.test(item.resourceType)) {
      const path = observedRequestPath(item.origin, item.pathname);
      if (path) this.dynamicPaths.add(path); else this.replayFailure ??= "UNCAPTURED_DYNAMIC_RESPONSE";
    }
    // Runtime imports do not need a top-level `<script src>` in the observed
    // DOM. Every admitted script is therefore a replay dependency, including
    // public CDN scripts whose cache-buster URL is intentionally not written.
    for (const item of requests) if (item.outcome === "ADMITTED" && item.resourceType === "script") {
      const path = observedRequestPath(item.origin, item.pathname);
      if (path) this.requiredStaticScriptPaths.add(path); else this.replayFailure ??= "UNCAPTURED_STATIC_DEPENDENCY";
    }
    const url = safeReplayUrl(snapshot.url, this.options.reviewedStaticResources, this.options.reviewedReads);
    const html = sanitizePublicHtml(snapshot.html, snapshot.url, this.options.reviewedStaticResources, this.options.reviewedReads);
    if (!url || !html) { this.replayFailure ??= "UNSAFE_DOCUMENT"; return; }
    this.documents.set(url, html);
    this.documentSnapshots.push({ snapshot: this.snapshotCount, url, html });
  }
  async captureScreenshot(png: Uint8Array, disposition?: "LAYOUT_ONLY_CONTENT_MASKED"): Promise<void> {
    if (this.finished) throw new Error("Browser recording is already finalized");
    if (disposition !== "LAYOUT_ONLY_CONTENT_MASKED" || !png.length) {
      this.screenshots.push({ snapshot: this.snapshotCount, status: "OMITTED_UNSAFE_NO_LAYOUT_SANITIZER" });
      return;
    }
    const file = `screenshot-${String(this.screenshotImages.length + 1).padStart(4, "0")}.png`;
    this.screenshotImages.push({ file, png });
    this.screenshots.push({ snapshot: this.snapshotCount, status: "LAYOUT_ONLY_CONTENT_MASKED", file });
  }
  async finish(): Promise<BrowserReadRecordingResult> {
    if (this.finished) throw new Error("Browser recording is already finalized"); this.finished = true;
    const root = resolve(this.options.directory); const path = resolve(root, this.options.runId);
    if (relative(root, path).startsWith("..")) throw new Error("Browser recording path escapes its artifact root");
    await mkdir(path, { recursive: true });
    let screenshot: BrowserReadRecordingResult["screenshot"] = "NOT_CAPTURED_NO_SANITIZER";
    for (const image of this.screenshotImages) await writeFile(resolve(path, image.file), image.png, { flag: "wx" });
    for (const snapshot of this.documentSnapshots) await writeFile(resolve(path, `snapshot-${String(snapshot.snapshot).padStart(4, "0")}.html`), snapshot.html, { flag: "wx" });
    if (this.screenshotImages.length) screenshot = "LAYOUT_ONLY_CONTENT_MASKED";
    let replay: Replay;
    if ([...this.dynamicPaths].some(path => this.uncapturedResponsePaths.has(path) || ![...this.responses.keys()].some(url => responsePath(url) === path))) this.replayFailure ??= "UNCAPTURED_DYNAMIC_RESPONSE";
    if ([...this.requiredStaticScriptPaths].some(path => this.uncapturedResponsePaths.has(path) || ![...this.responses.keys()].some(url => responsePath(url) === path))) this.replayFailure ??= "UNCAPTURED_STATIC_DEPENDENCY";
    if (this.replayFailure) replay = { status: "NOT_REPLAYABLE", reason: this.replayFailure };
    else if (!this.documents.size) replay = { status: "NOT_REPLAYABLE", reason: "NO_CAPTURED_PUBLIC_DOCUMENT" };
    else { const harPath = resolve(path, "replay.har"); await writeFile(harPath, JSON.stringify(sanitizedHar(this.documents, this.responses), null, 2), { flag: "wx" }); replay = { status: "REPLAYABLE", reason: "SANITIZED_NETWORK_AND_DOM_CAPTURE", harPath }; }
    const recording = { schemaVersion: "browser-read-recording@2", status: "RECORDED", entries: this.entries, documents: this.documentSnapshots.map(snapshot => ({ snapshot: snapshot.snapshot, url: snapshot.url, file: `snapshot-${String(snapshot.snapshot).padStart(4, "0")}.html` })), screenshot, screenshots: this.screenshots, replay: replay.status === "REPLAYABLE" ? { ...replay, harPath: "replay.har" } : replay, contentSha256: createHash("sha256").update(JSON.stringify(this.entries)).digest("hex") };
    await writeFile(resolve(path, "recording.json"), JSON.stringify(recording, null, 2), { flag: "wx" }); return { path, screenshot, replay };
  }
}
const safeQueryKeys = new Set(["date", "time", "num_people", "start_date", "start_time", "pax", "party", "guests", "visit_date", "visit_time", "member", "svd", "svps", "svt", "rst_id", "plan_id", "seat_only", "exclude_unavailable_time", "availability_format", "availability_mode"]);
const MAX_REVIEWED_STATIC_SCRIPT_BYTES = 2_500_000;
/** The renewed Tabelog source pages measured at most 311KB after load. */
const MAX_PUBLIC_DOCUMENT_BYTES = 400_000;
function responsePath(value: string): string { try { const url = new URL(value); return `${url.origin}${url.pathname}`; } catch { return "INVALID"; } }
function observedRequestPath(origin: string, pathname: string): string | undefined {
  try {
    const url = new URL(pathname, origin);
    return /^https?:$/i.test(url.protocol) && !url.username && !url.password ? responsePath(url.toString()) : undefined;
  } catch { return undefined; }
}
function staticRuleMatchesUrl(rule: BrowserReadNetworkRequestRule, url: URL): boolean {
  if (url.origin !== rule.origin || (rule.pathname ? url.pathname !== rule.pathname : !rule.pathnamePrefix || !url.pathname.startsWith(rule.pathnamePrefix))) return false;
  if (!rule.resourceTypes.includes("script")) return false;
  const counts = new Map<string, number>(); for (const key of url.searchParams.keys()) counts.set(key, (counts.get(key) ?? 0) + 1);
  const required = new Set(rule.queryKeyRules?.required ?? rule.queryKeys ?? []);
  const allowed = new Set(rule.queryKeyRules?.allowed ?? []);
  const repeatable = new Set(rule.queryKeyRules?.repeatable ?? []);
  const patterns = (rule.queryKeyRules?.allowedPatterns ?? []).map(pattern => new RegExp(pattern));
  return ![...required].some(key => !counts.has(key))
    && [...counts].every(([key, count]) => (required.has(key) || allowed.has(key) || repeatable.has(key) || patterns.some(pattern => pattern.test(key)))
      && (count === 1 || repeatable.has(key)));
}
function reviewedStaticScriptUrl(value: string, staticResources: readonly BrowserReadNetworkRequestRule[] | undefined): boolean {
  try { const url = new URL(value); return !url.username && !url.password && (staticResources ?? []).some(rule => staticRuleMatchesUrl(rule, url)); } catch { return false; }
}
function reviewedPublicReadUrl(value: string, reviewedReads: readonly BrowserReadNetworkRequestRule[] | undefined): boolean {
  try {
    const url = new URL(value);
    return !url.username && !url.password && (reviewedReads ?? []).some((rule) => {
      if (url.origin !== rule.origin || (rule.pathname ? url.pathname !== rule.pathname : !rule.pathnamePrefix || !url.pathname.startsWith(rule.pathnamePrefix))) return false;
      const counts = new Map<string, number>(); for (const key of url.searchParams.keys()) counts.set(key, (counts.get(key) ?? 0) + 1);
      const required = new Set(rule.queryKeyRules?.required ?? rule.queryKeys ?? []);
      const allowed = new Set(rule.queryKeyRules?.allowed ?? []);
      const repeatable = new Set(rule.queryKeyRules?.repeatable ?? []);
      const patterns = (rule.queryKeyRules?.allowedPatterns ?? []).map(pattern => new RegExp(pattern));
      return ![...required].some(key => !counts.has(key))
        && [...counts].every(([key, count]) => (required.has(key) || allowed.has(key) || repeatable.has(key) || patterns.some(pattern => pattern.test(key)))
          && (count === 1 || repeatable.has(key)));
    });
  } catch { return false; }
}
function safeReplayUrl(value: string, staticResources?: readonly BrowserReadNetworkRequestRule[], reviewedReads?: readonly BrowserReadNetworkRequestRule[]): string | undefined { try { const u = new URL(value); const protocolAllowed = u.protocol === "https:" || (u.protocol === "http:" && /^(?:127\.0\.0\.1|localhost|::1)$/.test(u.hostname)); if (!protocolAllowed || u.username || u.password || (![...u.searchParams.keys()].every(key => safeQueryKeys.has(key)) && !reviewedStaticScriptUrl(u.toString(), staticResources) && !reviewedPublicReadUrl(u.toString(), reviewedReads))) return undefined; u.hash = ""; return u.toString(); } catch { return undefined; } }
function sanitizePublicHtml(html: string, sourceUrl: string, staticResources?: readonly BrowserReadNetworkRequestRule[], reviewedReads?: readonly BrowserReadNetworkRequestRule[]): string | undefined {
  if (html.length > MAX_PUBLIC_DOCUMENT_BYTES) return undefined;
  const preservedJsonLd: string[] = [];
  let result = html.replace(/<!--[\s\S]*?-->|<(template|iframe|object|embed|svg)\b[\s\S]*?<\/\1\s*>/gi, "")
  result = result.replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (whole, css) => safeReplayCss(css) ? whole : "");
  result = result.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (whole, attrs, script) => {
    const src = String(attrs).match(/\bsrc=(['"])([^'"]+)\1/i)?.[2];
    if (src) return reviewedStaticScriptUrl(new URL(src.replace(/&amp;/gi, "&"), sourceUrl).toString(), staticResources) ? whole : "";
    if (/\btype=(['"])application\/ld\+json\1/i.test(String(attrs))) {
      const sanitized = sanitizePublicJsonLd(script);
      if (sanitized === undefined) return "";
      const marker = `__PRAXIS_SANITIZED_JSON_LD_${preservedJsonLd.length}__`;
      preservedJsonLd.push(sanitized);
      return `<script${attrs}>${marker}</script>`;
    }
    return safeReplayScript(script) ? whole : "";
  });
  // A DOM snapshot may contain hidden auth/challenge elements. Remove the
  // whole element before any artifact exists; keep public date/party/time fields.
  const sensitiveValue = String.raw`(?:csrf|token|password|turnstile|recaptcha|session|authorization|cookie)`;
  // Attribute markers can occur on a useful public container. Remove only
  // the marker there; form fields and meta/textarea token carriers are removed
  // as complete elements so their hidden value never reaches an artifact.
  result = result.replace(new RegExp(String.raw`\sdata-[\w:-]*${sensitiveValue}[\w:-]*\s*=\s*(["'])[^"']*\1`, "gi"), "");
  const sensitiveNamedCarrier = String.raw`(?:name|id|autocomplete)\s*=\s*["'][^'"]*${sensitiveValue}[^'"]*["']`;
  result = result.replace(new RegExp(String.raw`<(?:input|meta|link)\b(?=[^>]*${sensitiveNamedCarrier})[^>]*>`, "gi"), "");
  result = result.replace(new RegExp(String.raw`<(textarea|select|button)\b(?=[^>]*${sensitiveNamedCarrier})[^>]*>[\s\S]*?<\/\1\s*>`, "gi"), "");
  // Form actions are document requests too.  Keep a Pack-reviewed public
  // search action only under the same grammar used for the document URL;
  // unknown actions still make the document unavailable for Replay.
  const forms = sanitizeReplayForms(result, sourceUrl, staticResources, reviewedReads);
  if (forms === undefined) return undefined;
  result = forms;
  result = result.replace(/\s(?:autocomplete|on\w+)=(["'])[^"']*\1/gi, "");
  // The final text scrub must not mutate a reviewed public static URL. A
  // release cache-buster can look like a telephone number to the generic
  // PII pattern, but changing it makes the recorded document request a URL
  // that neither the Guard nor HAR can match. Keep it only after the Pack
  // rule validated its origin/path/key grammar; all other attributes remain
  // subject to the usual URL and text sanitization.
  const preservedStaticUrls: string[] = [];
  result = result.replace(/\s(href|src)=(["'])([^"']*)\2/gi, (_all, name, _q, value) => { try {
    const url = new URL(value.replace(/&amp;/gi, "&"), sourceUrl);
    const safe = safeReplayUrl(url.toString(), staticResources, reviewedReads);
    const sameDocumentOrigin = new URL(safe ?? sourceUrl).origin === new URL(sourceUrl).origin;
    const approvedStaticScript = name.toLowerCase() === "src" && reviewedStaticScriptUrl(url.toString(), staticResources);
    if (!safe || (!sameDocumentOrigin && !approvedStaticScript)) return "";
    if (approvedStaticScript) {
      const marker = `__PRAXIS_REVIEWED_STATIC_${preservedStaticUrls.length}__`;
      preservedStaticUrls.push(safe);
      return ` ${name}="${marker}"`;
    }
    return ` ${name}="${safe}"`;
  } catch { return ""; } });
  result = result.replace(/\b(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?!\d{4}-\d{2}-\d{2})\+?\d[\d()\s-]{8,}\d)\b/gi, "[REDACTED]");
  result = preservedStaticUrls.reduce((current, value, index) => current.replaceAll(`__PRAXIS_REVIEWED_STATIC_${index}__`, value), result);
  return preservedJsonLd.reduce((current, value, index) => current.replaceAll(`__PRAXIS_SANITIZED_JSON_LD_${index}__`, value), result);
}

/**
 * JSON-LD is structured public restaurant metadata.  Preserve numeric geo
 * values exactly so the production exact-radius gate can parse them on
 * Replay, while replacing only sensitive values before the artifact exists.
 */
function sanitizePublicJsonLd(script: string): string | undefined {
  try {
    const scrub = (value: unknown, key = "", depth = 0): unknown => {
      if (depth > 32) throw new Error("JSON-LD nesting is too deep");
      // Field identity wins over value type: a numeric session id or
      // telephone is still sensitive.  Public GeoCoordinates use their own
      // non-sensitive field names and retain their numeric precision.
      if (sensitiveJsonLdKey(key)) return "[REDACTED]";
      if (value === null || typeof value === "boolean" || typeof value === "number") return value;
      if (typeof value === "string") return redactPublicText(value);
      if (Array.isArray(value)) {
        if (value.length > 1_000) throw new Error("JSON-LD array is too large");
        return value.map((item) => scrub(item, key, depth + 1));
      }
      if (!value || typeof value !== "object") throw new Error("JSON-LD value is unsupported");
      const entries = Object.entries(value);
      if (entries.length > 1_000) throw new Error("JSON-LD object is too large");
      return Object.fromEntries(entries.map(([name, item]) => [name, scrub(item, name, depth + 1)]));
    };
    return JSON.stringify(scrub(JSON.parse(script)));
  } catch { return undefined; }
}

function sensitiveJsonLdKey(key: string): boolean {
  return sensitiveKey(key) || /(?:telephone|phone|email|contact)/i.test(key);
}

function redactPublicText(value: string): string {
  return value.replace(/\b(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?!\d{4}-\d{2}-\d{2})\+?\d[\d()\s-]{8,}\d)\b/gi, "[REDACTED]");
}
function sanitizeReplayForms(
  html: string,
  sourceUrl: string,
  staticResources?: readonly BrowserReadNetworkRequestRule[],
  reviewedReads?: readonly BrowserReadNetworkRequestRule[],
): string | undefined {
  let unsafe = false;
  const result = html.replace(/<form\b([^>]*)>/gi, (_whole, attrs) => {
    const sanitized = sanitizeReplayForm(attrs, sourceUrl, staticResources, reviewedReads);
    if (sanitized === undefined) unsafe = true;
    return sanitized ?? "<form>";
  });
  return unsafe ? undefined : result;
}
function sanitizeReplayForm(
  attrs: string,
  sourceUrl: string,
  staticResources?: readonly BrowserReadNetworkRequestRule[],
  reviewedReads?: readonly BrowserReadNetworkRequestRule[],
): string | undefined {
  const method = attrs.match(/\bmethod\s*=\s*(["'])([^"']+)\1/i)?.[2]?.trim().toLowerCase();
  const action = attrs.match(/\baction\s*=\s*(["'])([^"']*)\1/i)?.[2];
  let safeAction: string | undefined;
  if (action) {
    try {
      const resolved = safeReplayUrl(
        new URL(action.replace(/&amp;/gi, "&"), sourceUrl).toString(),
        staticResources,
        reviewedReads,
      );
      if (!resolved || new URL(resolved).origin !== new URL(sourceUrl).origin) return undefined;
      safeAction = resolved;
    }
    catch { return undefined; }
  }
  // Preserve all ordinary structural attributes, including id/class/data used
  // by public scripts and form ownership. The Guard still blocks a replayed
  // non-GET submission; recording must never relabel it as GET.
  let preserved = attrs.replace(/\s(?:action|method)\s*=\s*(["'])[^"']*\1/gi, "");
  if (method) preserved += ` method="${method}"`;
  if (safeAction) preserved += ` action="${safeAction}"`;
  return `<form${preserved}>`;
}
function safeReplayCss(css: string): boolean {
  return css.length <= 20_000 && !/(?:url\s*\(|@import|expression\s*\(|behavior\s*:|token|secret|cookie)/i.test(css);
}
function safeReplayScript(script: string): boolean {
  return script.length <= 8_000
    && !/(?:cookie|token|secret|password|csrf|authorization|localStorage|sessionStorage|document\.write|eval\s*\(|Function\s*\(|fetch\s*\(\s*["']https?:\/\/)/i.test(script)
    && !/\b(?:form\.submit|location\s*=|window\.open)\b/i.test(script);
}
/** Reviewed CDN JavaScript is public code, not a user/session capture. Preserve it byte-for-byte for Replay. */
function safeReviewedPublicScript(script: string, originalByteLength: number): boolean {
  // The Pack-approved CDN response is retained byte-for-byte only if it is
  // valid bounded UTF-8 public code and has no literal credential material.
  // References to browser cookie/token APIs are normal library code and do
  // not constitute a captured session value.
  return script.length > 0
    && originalByteLength <= MAX_REVIEWED_STATIC_SCRIPT_BYTES
    && Buffer.byteLength(script) === originalByteLength
    && !/\u0000/.test(script)
    && !/(?:\bBearer\s+[A-Za-z0-9._~-]{8,}|\bsk-[A-Za-z0-9_-]{8,})/i.test(script);
}
function sanitizePublicJson(text: string): string | undefined {
  if (text.length > 200_000) return undefined;
  try { const value = JSON.parse(text); const clean = (item: unknown, key = ""): unknown => {
    if (/(?:cookie|token|secret|password|csrf|authorization|email|phone|address|name)/i.test(key)) throw new Error("sensitive key");
    if (item === null || typeof item === "boolean" || typeof item === "number") return item;
    const isoDateOrTime = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(item as string);
    if (typeof item === "string" && item.length <= 160 && !/(?:@|Bearer\s|sk-)/i.test(item) && (isoDateOrTime || !/\+?\d[\d()\s-]{8,}\d/.test(item))) return item;
    if (Array.isArray(item) && item.length <= 100) return item.map(value => clean(value, key));
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([name, value]) => [name, clean(value, name)]));
    throw new Error("unsafe value");
  }; return JSON.stringify(clean(value)); } catch { return undefined; }
}
function sanitizedHar(documents: ReadonlyMap<string, string>, responses: ReadonlyMap<string, { method: "GET" | "HEAD"; status: number; mimeType: string; text: string; redirectLocation?: string }>) { const entries: Array<[string, string | { method: "GET" | "HEAD"; status: number; mimeType: string; text: string; redirectLocation?: string }]> = [...documents].filter(([url]) => !responses.has(url)); entries.push(...responses); return { log: { version: "1.2", creator: { name: "Praxis sanitized browser recorder", version: "1" }, entries: entries.map(([url, item]) => { const html = typeof item === "string" ? item : item.text; const mimeType = typeof item === "string" ? "text/html" : item.mimeType; const method = typeof item === "string" ? "GET" : item.method; const status = typeof item === "string" ? 200 : item.status; const redirectLocation = typeof item === "string" ? undefined : item.redirectLocation; return ({ startedDateTime: "1970-01-01T00:00:00.000Z", time: 0, request: { method, url, httpVersion: "HTTP/1.1", headers: [], queryString: [], cookies: [], headersSize: -1, bodySize: -1 }, response: { status, statusText: status === 200 ? "OK" : "RECORDED", httpVersion: "HTTP/1.1", headers: [{ name: "content-type", value: `${mimeType}; charset=utf-8` }, ...(redirectLocation ? [{ name: "location", value: redirectLocation }] : [])], cookies: [], content: { size: Buffer.byteLength(html), mimeType, text: html }, redirectURL: redirectLocation ?? "", headersSize: -1, bodySize: Buffer.byteLength(html) }, cache: {}, timings: { send: 0, wait: 0, receive: 0 } }); }) } }; }
function sensitiveKey(key: string): boolean { return /(?:cookie|authorization|api[_-]?key|access[_-]?token|csrf|session[_-]?id|secret|password)/i.test(key); }
function safeRecordingDetail(value: unknown): unknown { if (Array.isArray(value)) return value.map(safeRecordingDetail); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !sensitiveKey(key)).map(([key, item]) => [key, safeRecordingDetail(item)])); return safeRecord(value); }
