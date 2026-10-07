import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

import type { BrowserActionWireRecord } from "../../../../infrastructure/browser/browser-action-decision.js";
import type { BrowserReadNetworkObservation, BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";
import type { BrowserTraceRecordingSink } from "./browser-case-slice-evidence.js";
import { safeRecord, safeString } from "./browser-case-slice-evidence.js";

export interface BrowserReadRecordingEntry { sequence: number; kind: string; detail: unknown; }
type Replay = { status: "REPLAYABLE"; reason: "SANITIZED_NETWORK_AND_DOM_CAPTURE"; harPath: string }
  | { status: "NOT_REPLAYABLE"; reason: "NO_CAPTURED_PUBLIC_DOCUMENT" | "UNSAFE_DOCUMENT" | "UNCAPTURED_DYNAMIC_RESPONSE" };
export interface BrowserReadRecordingResult { path: string; screenshot: "LAYOUT_ONLY_CONTENT_MASKED" | "NOT_CAPTURED_NO_SANITIZER"; replay: Replay; }
export interface BrowserReadRecordingOptions {
  directory: string; runId: string;
}

/** Writes only sanitised public documents and admitted public read responses. */
export class BrowserReadRecording {
  private readonly entries: BrowserReadRecordingEntry[] = [];
  private readonly documents = new Map<string, string>();
  private readonly documentSnapshots: Array<{ snapshot: number; url: string; html: string }> = [];
  private readonly responses = new Map<string, { method: "GET" | "HEAD"; status: number; mimeType: string; text: string }>();
  private readonly dynamicPaths = new Set<string>();
  private readonly uncapturedResponsePaths = new Set<string>();
  private readonly screenshotImages: Array<{ file: string; png: Uint8Array }> = [];
  private snapshotCount = 0;
  private readonly screenshots: Array<{ snapshot: number; status: "LAYOUT_ONLY_CONTENT_MASKED" | "OMITTED_UNSAFE_NO_LAYOUT_SANITIZER"; file?: string }> = [];
  private replayFailure: "UNSAFE_DOCUMENT" | "UNCAPTURED_DYNAMIC_RESPONSE" | undefined;
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
  async recordResponse(response: { url: string; method: string; status: number; contentType: string; body: Uint8Array }): Promise<void> {
    if (this.finished) throw new Error("Browser recording is already finalized");
    const url = safeReplayUrl(response.url);
    const mimeType = response.contentType.split(";", 1)[0]?.toLowerCase() ?? "";
    if (!url || !/^(?:GET|HEAD)$/.test(response.method)) { this.uncapturedResponsePaths.add(responsePath(response.url)); return; }
    const text = new TextDecoder().decode(response.body);
    const sanitized = mimeType.includes("json") ? sanitizePublicJson(text)
      : /^(?:text\/(?:html|plain)|application\/(?:xhtml\+xml))$/.test(mimeType) ? sanitizePublicHtml(text, response.url)
      : /^(?:application|text)\/(?:javascript|ecmascript)$/.test(mimeType) ? (safeReplayScript(text) ? text : undefined)
      : mimeType === "text/css" ? (safeReplayCss(text) ? text : undefined)
      : undefined;
    if (!sanitized) { this.uncapturedResponsePaths.add(responsePath(response.url)); return; }
    this.responses.set(url, { method: response.method as "GET" | "HEAD", status: response.status, mimeType, text: sanitized });
  }
  recordSnapshot(snapshot: BrowserSnapshot): void {
    if (this.finished) throw new Error("Browser recording is already finalized");
    this.snapshotCount += 1;
    const requests = snapshot.networkRequests ?? [];
    this.recordNetwork(requests);
    for (const item of requests) if (item.outcome === "ADMITTED" && /^(?:xhr|fetch)$/i.test(item.resourceType)) { if (/^https:\/\//.test(item.origin)) this.dynamicPaths.add(`${item.origin}${item.pathname}`); else this.replayFailure ??= "UNCAPTURED_DYNAMIC_RESPONSE"; }
    const url = safeReplayUrl(snapshot.url);
    const html = sanitizePublicHtml(snapshot.html, snapshot.url);
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
    if (this.replayFailure) replay = { status: "NOT_REPLAYABLE", reason: this.replayFailure };
    else if (!this.documents.size) replay = { status: "NOT_REPLAYABLE", reason: "NO_CAPTURED_PUBLIC_DOCUMENT" };
    else { const harPath = resolve(path, "replay.har"); await writeFile(harPath, JSON.stringify(sanitizedHar(this.documents, this.responses), null, 2), { flag: "wx" }); replay = { status: "REPLAYABLE", reason: "SANITIZED_NETWORK_AND_DOM_CAPTURE", harPath }; }
    const recording = { schemaVersion: "browser-read-recording@2", status: "RECORDED", entries: this.entries, documents: this.documentSnapshots.map(snapshot => ({ snapshot: snapshot.snapshot, url: snapshot.url, file: `snapshot-${String(snapshot.snapshot).padStart(4, "0")}.html` })), screenshot, screenshots: this.screenshots, replay: replay.status === "REPLAYABLE" ? { ...replay, harPath: "replay.har" } : replay, contentSha256: createHash("sha256").update(JSON.stringify(this.entries)).digest("hex") };
    await writeFile(resolve(path, "recording.json"), JSON.stringify(recording, null, 2), { flag: "wx" }); return { path, screenshot, replay };
  }
}
const safeQueryKeys = new Set(["date", "time", "num_people", "start_date", "start_time", "pax", "party", "guests", "visit_date", "visit_time", "member", "svd", "svps", "svt", "rst_id", "plan_id", "seat_only", "exclude_unavailable_time", "availability_format", "availability_mode"]);
function responsePath(value: string): string { try { const url = new URL(value); return `${url.origin}${url.pathname}`; } catch { return "INVALID"; } }
function safeReplayUrl(value: string): string | undefined { try { const u = new URL(value); const protocolAllowed = u.protocol === "https:" || (u.protocol === "http:" && /^(?:127\.0\.0\.1|localhost|::1)$/.test(u.hostname)); if (!protocolAllowed || u.username || u.password || [...u.searchParams.keys()].some(key => !safeQueryKeys.has(key))) return undefined; u.hash = ""; return u.toString(); } catch { return undefined; } }
function sanitizePublicHtml(html: string, sourceUrl: string): string | undefined {
  if (html.length > 200_000) return undefined;
  let result = html.replace(/<!--[\s\S]*?-->|<(template|iframe|object|embed|svg)\b[\s\S]*?<\/\1\s*>/gi, "")
  result = result.replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (whole, css) => safeReplayCss(css) ? whole : "");
  result = result.replace(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi, (whole, script) => safeReplayScript(script) ? whole : "");
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
  const forms = sanitizeReplayForms(result, sourceUrl);
  if (forms === undefined) return undefined;
  result = forms;
  result = result.replace(/\s(?:autocomplete|on\w+)=(["'])[^"']*\1/gi, "");
  result = result.replace(/\s(href|src)=(["'])([^"']*)\2/gi, (_all, name, _q, value) => { try { const url = new URL(value.replace(/&amp;/gi, "&"), sourceUrl); const safe = safeReplayUrl(url.toString()); return safe && new URL(safe).origin === new URL(sourceUrl).origin ? ` ${name}="${safe}"` : ""; } catch { return ""; } });
  return result.replace(/\b(?:Bearer\s+\S+|sk-[A-Za-z0-9_-]{8,}|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?!\d{4}-\d{2}-\d{2})\+?\d[\d()\s-]{8,}\d)\b/gi, "[REDACTED]");
}
function sanitizeReplayForms(html: string, sourceUrl: string): string | undefined {
  let unsafe = false;
  const result = html.replace(/<form\b([^>]*)>/gi, (_whole, attrs) => {
    const sanitized = sanitizeReplayForm(attrs, sourceUrl);
    if (sanitized === undefined) unsafe = true;
    return sanitized ?? "<form>";
  });
  return unsafe ? undefined : result;
}
function sanitizeReplayForm(attrs: string, sourceUrl: string): string | undefined {
  const method = attrs.match(/\bmethod\s*=\s*(["'])([^"']+)\1/i)?.[2]?.trim().toLowerCase();
  const action = attrs.match(/\baction\s*=\s*(["'])([^"']*)\1/i)?.[2];
  let safeAction: string | undefined;
  if (action) {
    try { const resolved = safeReplayUrl(new URL(action.replace(/&amp;/gi, "&"), sourceUrl).toString()); if (!resolved || new URL(resolved).origin !== new URL(sourceUrl).origin) return undefined; safeAction = resolved; }
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
function sanitizedHar(documents: ReadonlyMap<string, string>, responses: ReadonlyMap<string, { method: "GET" | "HEAD"; status: number; mimeType: string; text: string }>) { const entries: Array<[string, string | { method: "GET" | "HEAD"; status: number; mimeType: string; text: string }]> = [...documents].filter(([url]) => !responses.has(url)); entries.push(...responses); return { log: { version: "1.2", creator: { name: "Praxis sanitized browser recorder", version: "1" }, entries: entries.map(([url, item]) => { const html = typeof item === "string" ? item : item.text; const mimeType = typeof item === "string" ? "text/html" : item.mimeType; const method = typeof item === "string" ? "GET" : item.method; const status = typeof item === "string" ? 200 : item.status; return ({ startedDateTime: "1970-01-01T00:00:00.000Z", time: 0, request: { method, url, httpVersion: "HTTP/1.1", headers: [], queryString: [], cookies: [], headersSize: -1, bodySize: -1 }, response: { status, statusText: status === 200 ? "OK" : "RECORDED", httpVersion: "HTTP/1.1", headers: [{ name: "content-type", value: `${mimeType}; charset=utf-8` }], cookies: [], content: { size: Buffer.byteLength(html), mimeType, text: html }, redirectURL: "", headersSize: -1, bodySize: Buffer.byteLength(html) }, cache: {}, timings: { send: 0, wait: 0, receive: 0 } }); }) } }; }
function sensitiveKey(key: string): boolean { return /(?:cookie|authorization|api[_-]?key|access[_-]?token|csrf|session[_-]?id|secret|password)/i.test(key); }
function safeRecordingDetail(value: unknown): unknown { if (Array.isArray(value)) return value.map(safeRecordingDetail); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([key]) => !sensitiveKey(key)).map(([key, item]) => [key, safeRecordingDetail(item)])); return safeRecord(value); }
