import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

import type { BrowserActionWireRecord } from "../../../../infrastructure/browser/browser-action-decision.js";
import type { BrowserReadNetworkObservation, BrowserReadNetworkRequestRule, BrowserSnapshot } from "../../../../infrastructure/browser/browser-runtime.js";
import type { BrowserTraceRecordingSink } from "./browser-case-slice-evidence.js";
import { safeRecord } from "./browser-case-slice-evidence.js";
import { restaurantDiscoveryPacks } from "../../../../integrations/restaurant-search/source-packs.js";
import { GooglePlacesHarCapture } from "./google-places-recording.js";

export interface BrowserReadRecordingEntry { sequence: number; kind: string; detail: unknown; }
export const BROWSER_READ_RECORDING_SCHEMA_VERSION = "browser-read-recording@6";
type ReplayFailure = "NO_CAPTURED_PUBLIC_DOCUMENT" | "UNSAFE_DOCUMENT" | "CHALLENGE_DOCUMENT" | "DOCUMENT_SIZE_LIMIT" | "UNSAFE_REDIRECT" | "UNCAPTURED_DYNAMIC_RESPONSE" | "UNCAPTURED_STATIC_DEPENDENCY";
type Replay = { status: "REPLAYABLE" | "PARTIALLY_REPLAYABLE"; reason: "SANITIZED_NETWORK_AND_DOM_CAPTURE"; harPath: string }
  | { status: "NOT_REPLAYABLE"; reason: ReplayFailure };
export interface RecordingPage {
  snapshot: number; url?: string; status: "REPLAYABLE" | "NOT_REPLAYABLE";
  reason: ReplayFailure | "SANITIZED_NETWORK_AND_DOM_CAPTURE";
  diagnostic: { status: "SAVED"; file: string } | { status: "OMITTED"; reason: ReplayFailure };
}
export interface BrowserReadRecordingResult { path: string; screenshot: "LAYOUT_ONLY_CONTENT_MASKED" | "NOT_CAPTURED_NO_SANITIZER"; replay: Replay; pages: RecordingPage[]; }
export interface BrowserReadRecordingOptions {
  directory: string; runId: string;
  /**
   * Public JavaScript may be replayed only when the source Pack already
   * admitted its origin, path grammar and cache-buster keys. Guard-admitted
   * stylesheets use the existing bounded public-code safety checks. The recorder
   * receives no headers, cookies or request body, and does not alter code.
  */
  reviewedStaticResources?: readonly BrowserReadNetworkRequestRule[];
  /** Pack-owned public document/query grammar retained for faithful Replay. */
  reviewedReads?: readonly BrowserReadNetworkRequestRule[];
  /** Eval-owned credentials, checked on raw inputs before any URL masking. */
  ownCredentials?: readonly string[];
}

/** Writes only sanitised public documents and admitted public read responses. */
export class BrowserReadRecording {
  private readonly entries: BrowserReadRecordingEntry[] = [];
  private readonly google = new GooglePlacesHarCapture(detail => {
    this.entries.push({ sequence: this.entries.length + 1, kind: "GOOGLE_CAPTURE_REJECTED", detail });
  });
  private readonly stylesheets = new Map<string, string>();
  /** Recording-only exact URLs; these never change the Runtime or Guard policy. */
  private readonly loadedStylesheetRules: BrowserReadNetworkRequestRule[] = [];
  private readonly documentOrigins=new Set<string>();
  private readonly documents = new Map<string, string>();
  private readonly documentSnapshots: Array<{ snapshot: number; url?: string; html?: string; failure?: ReplayFailure; requests: readonly BrowserReadNetworkObservation[] }> = [];
  private readonly responses = new Map<string, { method: "GET" | "HEAD"; status: number; mimeType: string; text: string; redirectLocation?: string }>();
  private readonly unsafeRedirectPaths = new Set<string>();
  private readonly uncapturedResponsePaths = new Set<string>();
  private readonly screenshotImages: Array<{ file: string; png: Uint8Array }> = [];
  private snapshotCount = 0;
  private readonly screenshots: Array<{ snapshot: number; status: "LAYOUT_ONLY_CONTENT_MASKED" | "OMITTED_UNSAFE_NO_LAYOUT_SANITIZER"; file?: string }> = [];
  private finished = false;
  constructor(private readonly options: BrowserReadRecordingOptions) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(options.runId)) throw new Error("Browser recording runId must be a safe artifact identifier");
    this.google.registerCredentials(options.ownCredentials ?? []);
  }
  record(kind: string, detail: unknown): void {
    if (this.finished) throw new Error("Browser recording is already finalized");
    this.google.observeOwnCredentials(detail);
    this.entries.push({ sequence: this.entries.length + 1, kind, detail: safeRecordingDetail(detail) });
  }
  recordWire(wire: BrowserActionWireRecord): void { this.record("MODEL_WIRE", wire); }
  captureGoogleFetch(transport: typeof fetch): typeof fetch { return this.google.wrap(transport); }
  traceSink(): BrowserTraceRecordingSink { return { record: (kind, detail) => this.record(kind, detail), recordSnapshot: (snapshot) => this.recordSnapshot(snapshot), recordResponse: response => this.recordResponse(response), captureScreenshot: (png, disposition) => this.captureScreenshot(png, disposition) }; }
  /** Lets a runner retain its single canonical trace while supplying captured documents to this recorder. */
  snapshotSink(): BrowserTraceRecordingSink { return { record: () => undefined, recordSnapshot: snapshot => this.recordSnapshot(snapshot), recordResponse: response => this.recordResponse(response), captureScreenshot: (png, disposition) => this.captureScreenshot(png, disposition) }; }
  recordNetwork(requests: readonly BrowserReadNetworkObservation[]): void { this.record("NETWORK", requests.map(item => ({ outcome: item.outcome, origin: item.origin, pathname: item.pathname, method: item.method, resourceType: item.resourceType, queryKeys: [...item.queryKeys], ...(item.queryValues ? {queryValues:structuredClone(item.queryValues)} : {}), ...(item.error ? { error: item.error } : {}), ...(item.resourceTypeDetails ? { resourceTypeDetails: { ...item.resourceTypeDetails } } : {}), ...(item.outerRequestId ? { outerRequestId: item.outerRequestId } : {}), ...(item.formSubmission ? { formSubmission: structuredClone(item.formSubmission) } : {}), ...(item.bodyObservation ? { bodyObservation: structuredClone(item.bodyObservation) } : {}), ...(item.corsPreflight ? { corsPreflight: { ...item.corsPreflight, requestedHeaderNames: [...item.corsPreflight.requestedHeaderNames] } } : {}) }))); }
  async recordResponse(response: { url: string; method: string; resourceType: string; status: number; contentType: string; body: Uint8Array; redirectLocation?: string }): Promise<void> {
    if (this.finished) throw new Error("Browser recording is already finalized");
    this.google.observeOwnCredentials([response.url,response.redirectLocation]);
    const mimeType = response.contentType.split(";", 1)[0]?.toLowerCase() ?? "";
    // This callback receives only responses already admitted by the Guard.
    // Resource kind must still agree with MIME; a CSS-looking fetch is not a stylesheet.
    const stylesheetRule = response.resourceType === "stylesheet" && mimeType === "text/css"
      ? publicStylesheetRecordingRule(response.url) : undefined;
    const staticResources = [...(this.options.reviewedStaticResources ?? []), ...(stylesheetRule ? [stylesheetRule] : [])];
    const url = safeReplayUrl(response.url, staticResources, this.options.reviewedReads);
    if (!url || !/^(?:GET|HEAD)$/.test(response.method)) { this.uncapturedResponsePaths.add(responsePath(response.url)); return; }
    if(response.resourceType==="document"&&response.status>=200&&response.status<300&&/^(?:text\/html|application\/xhtml\+xml)$/.test(mimeType))this.documentOrigins.add(new URL(response.url).origin);
    let text: string;
    // Keep a CSS UTF-8 BOM as content so the existing byte-length/hash check remains exact.
    try { text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: Boolean(stylesheetRule) }).decode(response.body); }
    catch { this.uncapturedResponsePaths.add(responsePath(response.url)); return; }
    this.google.observeOwnCredentials(text);
    const redirectLocation = response.redirectLocation
      ? safeReplayUrl(response.redirectLocation, this.options.reviewedStaticResources, this.options.reviewedReads)
      : undefined;
    if (response.redirectLocation && !redirectLocation) { this.unsafeRedirectPaths.add(responsePath(response.url)); return; }
    // A public redirect's response body is not needed to faithfully preserve
    // navigation. Keep its approved status and Location even when it is empty.
    const isRecordedRedirect = response.status >= 300 && response.status < 400 && Boolean(redirectLocation);
    const publicSourceScript=response.resourceType==="script"&&(reviewedStaticScriptUrl(response.url,this.options.reviewedStaticResources)||this.documentOrigins.has(new URL(response.url).origin));
    const sanitized = isRecordedRedirect ? "" : mimeType.includes("json") ? (tabelogSuggestionRecordingUrl(response.url) ? sanitizeTabelogSuggestions(text) : sanitizePublicJson(text))
      : /^(?:text\/(?:html|plain)|application\/(?:xhtml\+xml))$/.test(mimeType) ? sanitizePublicHtml(text, response.url, this.options.reviewedStaticResources, this.options.reviewedReads)
      : /^(?:application|text)\/(?:javascript|ecmascript)$/.test(mimeType)
        ? (publicSourceScript ? sanitizePublicSourceScript(text,response.body.byteLength) : reviewedStaticScriptUrl(response.url,this.options.reviewedStaticResources)&&safePublicStaticCode(text,response.body.byteLength)?text:undefined)
      : mimeType === "text/css" ? (stylesheetRule && safePublicStaticCode(text, response.body.byteLength) ? text : undefined)
      : undefined;
    if (sanitized === undefined || !this.google.accept([url,sanitized,redirectLocation])) { this.uncapturedResponsePaths.add(responsePath(response.url)); return; }
    if (stylesheetRule && response.status === 200) {
      if (!this.stylesheets.has(url)) this.loadedStylesheetRules.push(stylesheetRule);
      this.stylesheets.set(url, sanitized);
    }
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
    this.google.observeOwnCredentials([snapshot.url,snapshot.html,snapshot.text]);
    this.snapshotCount += 1;
    const requests = snapshot.networkRequests ?? [];
    this.recordNetwork(requests);
    if (snapshot.networkResourceTypes?.length) this.record("NETWORK_RESOURCE_TYPES", snapshot.networkResourceTypes);
    const url = safeReplayUrl(snapshot.url, this.options.reviewedStaticResources, this.options.reviewedReads);
    const challenge = restaurantDiscoveryPacks.some(pack => pack.documentOrigins.some(origin => { try { return new URL(snapshot.url).origin === origin; } catch { return false; } }) && pack.browser?.hasChallenge(snapshot));
    const sanitized = sanitizePublicHtml(snapshot.html, snapshot.url, [...(this.options.reviewedStaticResources ?? []), ...this.loadedStylesheetRules], this.options.reviewedReads);
    const html = sanitized !== undefined && this.google.accept(sanitized) ? sanitized : undefined;
    this.record("DOCUMENT_SANITIZATION",{urlAccepted:Boolean(url),documentAccepted:Boolean(html),inputBytes:Buffer.byteLength(snapshot.html),queryKeys:[...new Set(new URL(snapshot.url).searchParams.keys())].sort(),reason:!url?"UNREVIEWED_DOCUMENT_QUERY_SHAPE":!html?"DOCUMENT_PRIVACY_OR_SIZE":"SANITIZED"});
    this.documentSnapshots.push({ snapshot: this.snapshotCount, ...(url ? { url } : {}), ...(url && html && !challenge ? { html } : {}),
      ...(challenge ? { failure: "CHALLENGE_DOCUMENT" as const } : !url || !html ? { failure: Buffer.byteLength(snapshot.html) > MAX_PUBLIC_DOCUMENT_BYTES ? "DOCUMENT_SIZE_LIMIT" as const : "UNSAFE_DOCUMENT" as const } : {}), requests: structuredClone(requests) });
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
    this.google.close();
    // Entry-local failures may not poison the remaining recording. Own leaks
    // are remembered even if the ordinary redactor already removed the text.
    const entries = this.entries.splice(0);
    for (const entry of entries) if (this.google.accept(entry)) this.entries.push({...entry,sequence:this.entries.length+1});
    const root = resolve(this.options.directory); const path = resolve(root, this.options.runId);
    if (relative(root, path).startsWith("..")) throw new Error("Browser recording path escapes its artifact root");
    await mkdir(path, { recursive: true });
    let screenshot: BrowserReadRecordingResult["screenshot"] = "NOT_CAPTURED_NO_SANITIZER";
    let pages: RecordingPage[] = this.documentSnapshots.map(page => {
      let failure = page.failure;
      const admitted = page.requests.filter(item => item.outcome === "ADMITTED");
      if (page.url && this.unsafeRedirectPaths.has(responsePath(page.url)) || admitted.some(item => this.unsafeRedirectPaths.has(observedRequestPath(item.origin, item.pathname) ?? "INVALID"))) failure ??= "UNSAFE_REDIRECT";
      for (const request of admitted) {
        const dependency = /^(?:xhr|fetch)$/i.test(request.resourceType) ? "UNCAPTURED_DYNAMIC_RESPONSE" : ["script", "stylesheet"].includes(request.resourceType) ? "UNCAPTURED_STATIC_DEPENDENCY" : undefined;
        const requestPath = observedRequestPath(request.origin, request.pathname);
        if (request.method === "OPTIONS") failure ??= "UNCAPTURED_DYNAMIC_RESPONSE";
        if (dependency && (!requestPath || this.uncapturedResponsePaths.has(requestPath) || ![...this.responses.keys()].some(url => responsePath(url) === requestPath))) failure ??= dependency;
      }
      return { snapshot: page.snapshot, ...(page.url ? { url: page.url } : {}), status: failure ? "NOT_REPLAYABLE" : "REPLAYABLE", reason: failure ?? "SANITIZED_NETWORK_AND_DOM_CAPTURE",
        diagnostic: page.html ? { status: "SAVED", file: `diagnostic/snapshot-${String(page.snapshot).padStart(4, "0")}.html` }
          : { status: "OMITTED", reason: page.failure ?? "UNSAFE_DOCUMENT" } };
    });
    let qualified = this.documentSnapshots.filter((_, index) => pages[index]!.status === "REPLAYABLE");
    for (const snapshot of qualified) {
      this.documents.set(snapshot.url!, snapshot.html!);
    }
    if (this.screenshotImages.length) screenshot = "LAYOUT_ONLY_CONTENT_MASKED";
    let replay: Replay;
    if (!qualified.length) replay = { status: "NOT_REPLAYABLE", reason: pages[0]?.reason as ReplayFailure ?? "NO_CAPTURED_PUBLIC_DOCUMENT" };
    else replay = { status: qualified.length === pages.length ? "REPLAYABLE" : "PARTIALLY_REPLAYABLE", reason: "SANITIZED_NETWORK_AND_DOM_CAPTURE", harPath: resolve(path, "replay.har") };
    if (!this.google.rejectsRecording && (qualified.length || this.google.entries.length)) {
      // Never resurrect a rejected document through its response body. Safe
      // non-document dependencies and redirects remain available to good pages.
      const responses = new Map([...this.responses].filter(([url, response]) => !/html/.test(response.mimeType) || this.documents.has(url) || response.redirectLocation && this.documents.has(response.redirectLocation)));
      const harPath = resolve(path, "replay.har");
      const har = sanitizedHar(this.documents, responses);
      const completeHar = { ...har, log: { ...har.log, entries: [...har.log.entries, ...this.google.entries] } };
      if (!await this.google.writeHar(harPath, completeHar)) replay = { status: "NOT_REPLAYABLE", reason: "UNSAFE_DOCUMENT" };
    }
    if (this.google.rejectsRecording) {
      replay = {status:"NOT_REPLAYABLE",reason:"UNSAFE_DOCUMENT"};qualified = [];
      pages = pages.map(page => ({snapshot:page.snapshot,status:"NOT_REPLAYABLE",reason:"UNSAFE_DOCUMENT",diagnostic:{status:"OMITTED",reason:"UNSAFE_DOCUMENT"}}));
      this.documents.clear();this.stylesheets.clear();this.screenshotImages.length=0;this.screenshots.length=0;
      screenshot="NOT_CAPTURED_NO_SANITIZER";
      this.entries.splice(0,this.entries.length,{sequence:1,kind:"RECORDING_REJECTED",detail:{reason:"OWN_CREDENTIAL"}});
    }
    // No content file is published before the own-credential checks and both
    // HAR scans succeed. Diagnostic DOM stays outside the replay collection.
    for (const [index, snapshot] of this.documentSnapshots.entries()) {
      const diagnostic = pages[index]!.diagnostic;
      if (diagnostic.status !== "SAVED") continue;
      await mkdir(resolve(path, "diagnostic"), { recursive: true });
      await writeFile(resolve(path, diagnostic.file), snapshot.html!, { flag: "wx" });
    }
    for (const snapshot of qualified) await writeFile(resolve(path, `snapshot-${String(snapshot.snapshot).padStart(4, "0")}.html`), snapshot.html!, {flag:"wx"});
    for (const image of this.screenshotImages) await writeFile(resolve(path, image.file), image.png, {flag:"wx"});
    const stylesheets: Array<{ url: string; file: string; sha256: string; bytes: number }> = [];
    for (const [url, css] of this.stylesheets) {
      const file = `stylesheet-${String(stylesheets.length + 1).padStart(4, "0")}.css`;
      await writeFile(resolve(path, file), css, { flag: "wx" });
      stylesheets.push({ url, file, sha256: createHash("sha256").update(css).digest("hex"), bytes: Buffer.byteLength(css) });
    }
    const recording = { schemaVersion: BROWSER_READ_RECORDING_SCHEMA_VERSION, stylesheets, status: "RECORDED", entries: this.entries, pages, documents: qualified.map(snapshot => ({ snapshot: snapshot.snapshot, url: snapshot.url, file: `snapshot-${String(snapshot.snapshot).padStart(4, "0")}.html` })), screenshot, screenshots: this.screenshots, replay: replay.status !== "NOT_REPLAYABLE" ? { ...replay, harPath: "replay.har" } : replay, contentSha256: createHash("sha256").update(JSON.stringify(this.entries)).digest("hex") };
    await writeFile(resolve(path, "recording.json"), JSON.stringify(recording, null, 2), { flag: "wx" }); return { path, screenshot, replay, pages };
  }
}
const safeQueryKeys = new Set(["date", "time", "num_people", "start_date", "start_time", "pax", "party", "guests", "visit_date", "visit_time", "member", "vac_net", "svd", "svps", "svt", "rst_id", "plan_id", "seat_only", "exclude_unavailable_time", "availability_format", "availability_mode"]);
const MAX_PUBLIC_STATIC_CODE_BYTES = 2_500_000;
/** Measured Tabelog 410-430KB and TableCheck 464-743KB public pages. */
const MAX_PUBLIC_DOCUMENT_BYTES = 1_000_000;
/** Exact admitted stylesheet metadata can retain cache-busters, never credential or PII query fields. */
function publicStylesheetRecordingRule(value: string): BrowserReadNetworkRequestRule | undefined {
  try {
    const url = new URL(value);
    if (url.username || url.password || [...url.searchParams].some(([key, value]) => sensitiveKey(key)
      || /(?:email|e-mail|phone|tel|address|name|token|card|credit)/i.test(key)
      || /(?:\bBearer\s+|\bsk-[A-Za-z0-9_-]{8,})/i.test(value))) return undefined;
    return { origin: url.origin, pathname: url.pathname, resourceTypes: ["stylesheet"],
      queryKeyRules: { required: [...new Set(url.searchParams.keys())], repeatable: [...new Set(url.searchParams.keys())] } };
  } catch { return undefined; }
}
function responsePath(value: string): string { try { const url = new URL(value); return `${url.origin}${url.pathname}`; } catch { return "INVALID"; } }
function observedRequestPath(origin: string, pathname: string): string | undefined {
  try {
    const url = new URL(pathname, origin);
    return /^https?:$/i.test(url.protocol) && !url.username && !url.password ? responsePath(url.toString()) : undefined;
  } catch { return undefined; }
}
function staticRuleMatchesUrl(rule: BrowserReadNetworkRequestRule, url: URL, resourceType: "script" | "stylesheet" = "script"): boolean {
  if (url.origin !== rule.origin || (rule.pathname ? url.pathname !== rule.pathname : !rule.pathnamePrefix || !url.pathname.startsWith(rule.pathnamePrefix))) return false;
  if (!rule.resourceTypes.includes(resourceType)) return false;
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
function reviewedStaticStylesheetUrl(value: string, staticResources: readonly BrowserReadNetworkRequestRule[] | undefined): boolean {
  try { const url = new URL(value); return !url.username && !url.password && (staticResources ?? []).some(rule => staticRuleMatchesUrl(rule, url, "stylesheet")); } catch { return false; }
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
/** Observed public suggestion response; recording permission only, never network authority. */
function tabelogSuggestionRecordingUrl(value: string): boolean {
  try {
    const url = new URL(value), keyword = url.searchParams.get("keyword");
    return url.origin === "https://tabelog.com" && url.pathname === "/en/suggest/keyword_suggest" && !url.username && !url.password
      && [...url.searchParams.keys()].length === 1 && keyword !== null && keyword.length > 0 && keyword.length <= 160
      && !/[@\r\n]|Bearer\s|sk-|\+?\d[\d()\s-]{8,}\d/i.test(keyword);
  } catch { return false; }
}
function sanitizeTabelogSuggestions(text: string): string | undefined {
  if (Buffer.byteLength(text) > 200_000) return undefined;
  try {
    const rows: unknown = JSON.parse(text);
    if (!Array.isArray(rows) || rows.length > 100) return undefined;
    const publicFields = new Set(["name", "sub_name", "datatype", "id_in_datatype", "site_name", "exact_match", "url", "pal", "LstPrf", "LstAre", "station_id", "area_codes"]);
    for (const row of rows) {
      if (!row || typeof row !== "object" || Array.isArray(row) || typeof row.name !== "string" || typeof row.datatype !== "string") return undefined;
      for (const [field, value] of Object.entries(row)) {
        if (!publicFields.has(field)) return undefined;
        if (value === null || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) continue;
        if (typeof value !== "string" || value.length > 1000 || /[@\r\n]|Bearer\s|sk-|\+?\d[\d()\s-]{8,}\d/i.test(value)) return undefined;
        if (field === "url") { const url = new URL(value, "https://tabelog.com"); if (url.origin !== "https://tabelog.com" || url.username || url.password || /(?:^|\/)(?:yoyaku|booking|reserve|account|login|confirm|payment)(?:\/|$)/i.test(url.pathname) || url.search || url.hash) return undefined; }
      }
    }
    return text;
  } catch { return undefined; }
}
/** A history route can omit network-required defaults. Recording it never
 * grants a request: keep only declared public document fields, no sensitive values. */
function publicDocumentRouteUrl(url:URL,reads:readonly BrowserReadNetworkRequestRule[]|undefined):boolean {
 return (reads??[]).some(rule=>{
  if(!rule.resourceTypes.includes("document")||rule.origin!==url.origin||rule.pathname!==url.pathname)return false;
  const allowed=new Set([...(rule.queryKeys??[]),...(rule.queryKeyRules?.required??[]),...(rule.queryKeyRules?.allowed??[]),...(rule.queryKeyRules?.repeatable??[])]);
  const counts=new Map<string,number>();for(const key of url.searchParams.keys())counts.set(key,(counts.get(key)??0)+1);
  return [...counts].every(([key,count])=>allowed.has(key)&&(count===1||rule.queryKeyRules?.repeatable?.includes(key)))
   &&[...url.searchParams].every(([key,value])=>!sensitiveKey(key)&&!/(?:@|Bearer\s|\bsk-|(?:token|password|cookie|authorization)\s*[:=])/i.test(value)
    && (/^\d{4}-\d{2}-\d{2}$/.test(value)||!/\+?\d[\d()\s-]{8,}\d/.test(value)));
 });
}
function safeReplayUrl(value: string, staticResources?: readonly BrowserReadNetworkRequestRule[], reviewedReads?: readonly BrowserReadNetworkRequestRule[]): string | undefined { try { const u = new URL(value); const protocolAllowed = u.protocol === "https:" || (u.protocol === "http:" && /^(?:127\.0\.0\.1|localhost|::1)$/.test(u.hostname)); if (!protocolAllowed || u.username || u.password || (!tabelogSuggestionRecordingUrl(value) && ![...u.searchParams.keys()].every(key => safeQueryKeys.has(key)) && !reviewedStaticScriptUrl(u.toString(), staticResources) && !reviewedStaticStylesheetUrl(u.toString(), staticResources) && !reviewedPublicReadUrl(u.toString(), reviewedReads) && !publicDocumentRouteUrl(u,reviewedReads))) return undefined; u.hash = ""; return u.toString(); } catch { return undefined; } }
/** Public third-party asset credentials are not replay permissions. Mask their
 * values before either diagnostic or replay HTML can be published. */
function redactThirdPartyUrlCredentials(html: string, sourceUrl: string): string {
  const credentialQuery = /^(?:key|api[_-]?key|x-goog-api-key|signature|client(?:[_-]?id)?|token|access[_-]?token|auth|authorization|secret|password|credential)$/i;
  const redact = (value: string): string => {
    const decoded = value.replace(/&amp;/gi,"&").replace(/&#(?:x([0-9a-f]+)|(\d+));?/gi, (_all,hex,decimal) => {
      const code = parseInt(hex ?? decimal,hex ? 16 : 10);return code <= 0x10ffff ? String.fromCodePoint(code) : "";
    });
    // Split only at a new absolute URL, preserving commas inside map queries.
    return decoded.split(/,(?=\s*(?:https?:)?\/\/)/i).map(candidate => {
      const match = candidate.match(/^(\s*)((?:https?:)?\/\/\S+)([\s\S]*)$/i);
      if (!match) return candidate;
      try {
        const url = new URL(match[2]!,sourceUrl);
        if (url.origin === new URL(sourceUrl).origin || !/^https?:$/.test(url.protocol)) return candidate;
        let changed = false;
        const fields = [...url.searchParams].map(([key,value]) => {if (!credentialQuery.test(key)) return [key,value];changed = true;return [key,"REDACTED"];});
        if (!changed) return candidate;
        url.search = new URLSearchParams(fields as Array<[string,string]>).toString();
        return match[1]+url.toString()+match[3];
      } catch { return candidate; }
    }).join(",");
  };
  return html.replace(/<[a-z][^>]*>/gi, tag => tag.replace(/(\s(?:src|href|srcset|imagesrcset|poster|background|cite|longdesc|action|formaction|xlink:href|data-(?:[\w:-]+-)?(?:src|srcset|href|url)))\s*=\s*("[^"]*"|'[^']*'|[^\s"'<>`]+)/gi, (whole,name,quoted) => {
    const quote = /^["']/.test(quoted) ? quoted[0] : "",value = quote ? quoted.slice(1,-1) : quoted;
    const sanitized = redact(value);
    return sanitized === value ? whole : `${name}=${quote}${sanitized.replace(/&/g,"&amp;")}${quote}`;
  }));
}
function sanitizePublicHtml(html: string, sourceUrl: string, staticResources?: readonly BrowserReadNetworkRequestRule[], reviewedReads?: readonly BrowserReadNetworkRequestRule[]): string | undefined {
  if (Buffer.byteLength(html) > MAX_PUBLIC_DOCUMENT_BYTES) return undefined;
  const preservedJsonLd: string[] = [];
  const ownScriptUrls=new Set<string>();
  let result = redactThirdPartyUrlCredentials(html,sourceUrl).replace(/<!--[\s\S]*?-->|<(template|iframe|object|embed|svg)\b[\s\S]*?<\/\1\s*>/gi, "")
  result = result.replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (whole, css) => safeReplayCss(css) ? whole : "");
  result = result.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (whole, attrs, script) => {
    const src = String(attrs).match(/\bsrc=(['"])([^'"]+)\1/i)?.[2];
    if(src){const url=new URL(src.replace(/&amp;/gi,"&"),sourceUrl).toString();const own=new URL(url).origin===new URL(sourceUrl).origin&&Boolean(safeReplayUrl(url,staticResources,reviewedReads));if(own)ownScriptUrls.add(url);return own||reviewedStaticScriptUrl(url,staticResources)?whole:"";}
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
  const sensitiveValue = String.raw`(?:csrf|token|password|turnstile|recaptcha|session|authorization|cookie|api[_-]?key|secret|private[_-]?key)`;
  // Attribute markers can occur on a useful public container. Remove only
  // the marker there; form fields and meta/textarea token carriers are removed
  // as complete elements so their hidden value never reaches an artifact.
  result = result.replace(new RegExp(String.raw`\sdata-[\w:-]*${sensitiveValue}[\w:-]*\s*=\s*(["'])[^"']*\1`, "gi"), "");
  const sensitiveNamedCarrier = String.raw`(?:name|id|autocomplete)\s*=\s*["'][^'"]*${sensitiveValue}[^'"]*["']`;
  result = result.replace(new RegExp(String.raw`<(?:input|meta|link)\b(?=[^>]*${sensitiveNamedCarrier})[^>]*>`, "gi"), "");
  result = result.replace(new RegExp(String.raw`<(textarea|select|button)\b(?=[^>]*${sensitiveNamedCarrier})[^>]*>[\s\S]*?<\/\1\s*>`, "gi"), "");
  // Form actions are document requests too.  Keep a Pack-reviewed public
  // search action only under the same grammar used for the document URL;
  // unknown actions are removed without changing the method or form structure.
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
    const approvedStaticScript = name.toLowerCase() === "src" && (reviewedStaticScriptUrl(url.toString(), staticResources)||ownScriptUrls.has(url.toString()))
      || name.toLowerCase() === "href" && reviewedStaticStylesheetUrl(url.toString(), staticResources);
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
  const result = html.replace(/<form\b([^>]*)>/gi, (_whole, attrs) => {
    const sanitized = sanitizeReplayForm(attrs, sourceUrl, staticResources, reviewedReads);
    return sanitized;
  });
  return result;
}
function sanitizeReplayForm(
  attrs: string,
  sourceUrl: string,
  staticResources?: readonly BrowserReadNetworkRequestRule[],
  reviewedReads?: readonly BrowserReadNetworkRequestRule[],
): string {
  const methodParts = attrs.match(/(?:^|\s)method\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+))/i);
  const actionParts = attrs.match(/(?:^|\s)action\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+))/i);
  const method = (methodParts?.[1] ?? methodParts?.[2] ?? methodParts?.[3])?.trim().toLowerCase();
  const action = actionParts?.[1] ?? actionParts?.[2] ?? actionParts?.[3];
  let safeAction: string | undefined;
  if (action) {
    try {
      // Recording preserves the observed native same-origin GET destination.
      // This is transport fidelity, not request admission: runtime provenance,
      // forbidden paths and Guard/CDP still decide every serialized request.
      const destination = new URL(action.replace(/&amp;/gi, "&"), sourceUrl);
      const publicFormEndpoint = !destination.search && !destination.hash && !destination.username && !destination.password
        && !/(?:^|\/)(?:booking|yoyaku|reserve|review|confirm|payment|checkout|login|signin|account|cancel)(?:\/|$)/i.test(destination.pathname);
      const resolved = safeReplayUrl(
        destination.toString(),
        staticResources,
        reviewedReads,
      );
      if ((!method || method === "get") && destination.origin === new URL(sourceUrl).origin) {
        if (publicFormEndpoint) safeAction = destination.toString();
        else if (resolved && reviewedPublicReadUrl(resolved, reviewedReads)) safeAction = resolved;
      }
    }
    catch { /* Omit an unreviewed or malformed action destination. */ }
  }
  // Preserve all ordinary structural attributes, including id/class/data used
  // by public scripts and form ownership. The Guard still blocks a replayed
  // non-GET submission; recording must never relabel it as GET.
  let preserved = attrs.replace(/\s(?:action|method)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'<>]+)/gi, "");
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
/** Only Guard-admitted source/reviewed public JavaScript gets the user-approved cap.
 * ASCII replacement preserves code-unit/byte length and quote/newline structure. */
function sanitizePublicSourceScript(script:string,originalByteLength:number):string|undefined {
  if(!script.length||originalByteLength>12_000_000||Buffer.byteLength(script)!==originalByteLength||/\u0000/.test(script))return undefined;
  const fieldMasked=script.replace(/((?:["']?(?:api[_-]?key|x-api-key|access[_-]?token|token|authorization|cookie|session[_-]?id|secret|password|private[_-]?key)["']?)\s*[:=]\s*)("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')/gi,(_all,prefix,literal)=>prefix+literal[0]+literal.slice(1,-1).replace(/\\\r?\n|[^\r\n]/g,(value:string)=>value.startsWith("\\")&&/[\r\n]/.test(value)?value:"x".repeat(Buffer.byteLength(value)))+literal.at(-1));
  const masked=fieldMasked.replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----|\bAIza[0-9A-Za-z_-]{30,}|\bAKIA[A-Z0-9]{16}|\bBearer\s+[A-Za-z0-9._~-]{8,}|\bsk-[A-Za-z0-9_-]{8,}/gi,value=>value.replace(/[^\r\n]/g,"x"));
  return Buffer.byteLength(masked)===originalByteLength?masked:undefined;
}
function safePublicStaticCode(script: string, originalByteLength: number): boolean {
  // The admitted public static response is retained byte-for-byte only if it is
  // valid bounded UTF-8 public code and has no literal credential material.
  // References to browser cookie/token APIs are normal library code and do
  // not constitute a captured session value.
  return script.length > 0
    && originalByteLength <= MAX_PUBLIC_STATIC_CODE_BYTES
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
function safeRecordingDetail(value: unknown, key = ""): unknown { if (Array.isArray(value)) return value.map(item => safeRecordingDetail(item)); if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([name]) => !sensitiveKey(name)).map(([name, item]) => [name, safeRecordingDetail(item, name)])); return safeRecord(value, key === "requestOrigin" ? key : ""); }
