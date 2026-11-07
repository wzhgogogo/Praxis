import {observeQueryValues,type BrowserQueryValueObservation} from "./browser-query-values.js";
import { browserTransportError, type BrowserTransportError } from "./browser-runtime-errors.js";
import {isBrowserReadPathProhibited} from "./browser-read-policy.js";
import { traceFormEvidence, PlaywrightObservedGetForms, type ObservedGetFormSubmission } from "./playwright-observed-get-forms.js";
import type { BrowserContext, CDPSession, Page, Request, Route } from "playwright-core";

import type { BrowserReadCorsPreflightObservation, BrowserReadNetworkObservation, BrowserReadResourceTypeObservation, BrowserReadNetworkPolicy, BrowserReadNetworkRequestRule } from "./browser-runtime.js";

type NetworkDiagnosticCode = "BLOCKED_ENDPOINT" | "BLOCKED_FIELDS" | "BLOCKED_METHOD" | "BLOCKED_REDIRECT" | "READ_REQUEST_FAILED" | "READ_TIMEOUT" | "RESOURCE_POLICY_BLOCKED";
type NetworkDiagnostic = { code: NetworkDiagnosticCode; origin: string; pathname: string; method: string; resourceType: string; queryKeys: string[]; error?: BrowserTransportError };

function requestKey(value: string): string {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

function matchesPath(rule: BrowserReadNetworkRequestRule, url: URL): boolean {
  if (rule.pathname !== undefined) return url.pathname === rule.pathname;
  if (rule.pathnamePattern !== undefined) {
    if (!rule.pathnamePattern.startsWith("^") || !rule.pathnamePattern.endsWith("$")) return false;
    return new RegExp(rule.pathnamePattern).test(url.pathname);
  }
  return Boolean(rule.pathnamePrefix && url.pathname.startsWith(rule.pathnamePrefix));
}

// fetch and XHR are the same page-script class; static/document/Other remain distinct.
function resourceTypeMatches(rule: BrowserReadNetworkRequestRule, type: string): boolean {
  return rule.resourceTypes.includes(type as never)
    || ["fetch", "xhr"].includes(type) && rule.resourceTypes.some(value => ["fetch", "xhr"].includes(value));
}

/** The observable endpoint/method/query projection, before a future POST body exists. */
function matchesReadProjection(rule: BrowserReadNetworkRequestRule, url: URL, method: string, resourceType: string): boolean {
  if (url.origin !== rule.origin || !matchesPath(rule, url)) return false;
  if (!resourceTypeMatches(rule, resourceType)) return false;
  if (!(rule.methods ?? ["GET", "HEAD"]).includes(method as "GET" | "HEAD" | "POST")) return false;
  const actual = [...url.searchParams.keys()];
  if (rule.queryKeyRules) {
    const required = new Set(rule.queryKeyRules.required);
    const allowed = new Set(rule.queryKeyRules.allowed ?? []);
    const repeatable = new Set(rule.queryKeyRules.repeatable ?? []);
    const patterns = (rule.queryKeyRules.allowedPatterns ?? []).map(value => new RegExp(value));
    const counts = new Map<string, number>();
    for (const key of actual) counts.set(key, (counts.get(key) ?? 0) + 1);
    if ([...required].some(key => !counts.has(key))) return false;
    if (actual.some(key => !required.has(key) && !allowed.has(key) && !repeatable.has(key) && !patterns.some(pattern => pattern.test(key)))) return false;
    if ([...counts].some(([key, count]) => count > 1 && !repeatable.has(key))) return false;
  } else {
    const expected = [...(rule.queryKeys ?? [])].sort();
    const sorted = [...actual].sort();
    if (sorted.length !== expected.length || !sorted.every((key, index) => key === expected[index])) return false;
  }
  return true;
}

function matchesQueryValues(rule:BrowserReadNetworkRequestRule,url:URL,fields:readonly BrowserQueryValueObservation[]):boolean {
  if(!rule.queryValueClasses)return true;
  if(fields.length!==[...url.searchParams].length || fields.some(field=>field.valueClass==="SENSITIVE_FORMAT"))return false;
  return fields.every(field=>!rule.queryValueClasses![field.queryKey] || rule.queryValueClasses![field.queryKey]!.includes(field.valueClass==="PAGE_OBSERVED_VALUE"?"OTHER":field.valueClass));
}
async function allows(rule: BrowserReadNetworkRequestRule, request: Pick<Request, "headerValue" | "postData">, url: URL, method: string, resourceType: string, fields:readonly BrowserQueryValueObservation[]): Promise<boolean> {
  if (!matchesReadProjection(rule, url, method, resourceType) || !matchesQueryValues(rule,url,fields)) return false;
  if (method !== "POST") return true;
  if (!rule.bodyFields || !/application\/json/i.test(await request.headerValue("content-type") ?? "")) return false;
  try {
    const body = JSON.parse(request.postData() ?? "") as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) return false;
    const fields = body as Record<string, unknown>;
    const keys = Object.keys(fields).sort();
    const expected = Object.keys(rule.bodyFields).sort();
    return keys.length === expected.length && keys.every((key, index) => key === expected[index]
      && typeof fields[key] === rule.bodyFields![key] && fields[key] !== null && !Array.isArray(fields[key]));
  } catch { return false; }
}

function matchesEndpoint(rule: BrowserReadNetworkRequestRule, url: URL, resourceType: string): boolean {
  return url.origin === rule.origin
    && matchesPath(rule, url)
    && resourceTypeMatches(rule, resourceType);
}

/**
 * Ordinary routes guard the initial request. A second CDP Fetch interceptor
 * pauses native redirect requests before dispatch; Chromium retains URL,
 * relative-resource, method and cookie semantics instead of flattening a chain.
 */
export class PlaywrightReadNetworkGuard {
  readonly forms = new PlaywrightObservedGetForms();
  private readonly queryObservations=new WeakMap<URL,BrowserQueryValueObservation[]>();
  private readonly requestQueryObservations=new WeakMap<Request,BrowserQueryValueObservation[]>();
  private recordNativeFailure(request:Request,error:unknown):void {
    const url=new URL(request.url()),observed=this.requestQueryObservations.get(request);
    if(observed)this.queryObservations.set(url,observed);
    this.blocked("READ_REQUEST_FAILED",url,request.method(),request.resourceType(),error);
  }
  private async inspectQuery(url:URL,page:Page|undefined):Promise<void> {
    const inputs=url.search&&page?await this.forms.authoritativeInputs(page):[];
    this.queryObservations.set(url,observeQueryValues(url,inputs,page?this.forms.observedPageValueHashes(page):new Set()));
  }
  private queryMetadata(url:URL) {return {queryValues:this.queryObservations.get(url)??observeQueryValues(url,[])};}

  private readonly formAdmissions = new WeakMap<Page, Map<string, { evidence: ObservedGetFormSubmission; startedAt: number }>>();
  private readonly popupForms = new Map<string, Promise<{ evidence?: ObservedGetFormSubmission; startedAt: number; opener: Page } | undefined>>();
  private readonly preparedPopups = new WeakSet<Page>();
  private readonly blockedPopupForms = new WeakMap<Page, string>();
  private async observedSubmission(page: Page, url: URL): Promise<ObservedGetFormSubmission | undefined> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([this.forms.submission(page, url).catch(() => undefined),
        new Promise<undefined>(resolve => { timer = setTimeout(() => resolve(undefined), this.requestTimeoutMs); })]);
    } finally { if (timer) clearTimeout(timer); }
  }
  private async observedPopupSubmission(page: Page, url: URL, windowName: string): Promise<{ evidence?: ObservedGetFormSubmission } | undefined> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([this.forms.popupSubmission(page, url, windowName).catch(() => ({})),
        new Promise<{}>(resolve => { timer = setTimeout(() => resolve({}), this.requestTimeoutMs); })]);
    } finally { if (timer) clearTimeout(timer); }
  }
  private context?: BrowserContext;
  private readonly nativeRequests = new WeakSet<Request>();
  private readonly nativeTimers = new WeakMap<Request, ReturnType<typeof setTimeout>>();
  private readonly recordingTasks = new Set<Promise<void>>();
  /** Records are observational and never confer network permission. */
  async flushRecordedResponses(): Promise<void> { await Promise.allSettled([...this.recordingTasks]); }
  private nativeRequest(request: Request): boolean {
    for (let current: Request | null = request, hops = 0; current && hops < 11; current = current.redirectedFrom(), hops++) {
      if (this.nativeRequests.has(current)) return true;
    }
    return false;
  }
  private captureNativeResponse(response: import("playwright-core").Response): void {
    if (!this.recordResponse || !this.nativeRequest(response.request())) return;
    const task = (async () => {
      const request = response.request(), url = new URL(response.url()), method = request.method(), type = request.resourceType();
      const headers = response.headers(), status = response.status();
      const location = headers.location ? new URL(headers.location, url) : undefined;
      const allowedLocation = location && await this.admitsRedirectRequest(location, request, method, type);
      const body = method === "HEAD" || status === 204 || status === 304 || status >= 300 && status < 400 ? new Uint8Array() : await response.body();
      await this.recordResponse!({ url: url.toString(), method, resourceType: type, status, contentType: headers["content-type"] ?? "", body,
        ...(allowedLocation ? { redirectLocation: location!.toString() } : {}) });
    })();
    this.recordingTasks.add(task);
    void task.catch(error => {
      if (!this.context?.pages().some(page => !page.isClosed())) return;
      const request = response.request();
      this.recordNativeFailure(request,error);
      void this.context?.close().catch(() => {});
    }).finally(() => this.recordingTasks.delete(task));
  }
  private readonly pending = new Map<Request, number>();
  private activityRevision = 0;
  settlementActivity(): { pending: number; revision: number; pendingByType: Record<string, number>; oldestPendingMs: number } {
    let pending = 0, oldestPendingMs = 0;
    const pendingByType: Record<string, number> = {};
    for (const [request, started] of this.pending) {
      const age = Date.now() - started, type = request.resourceType();
      pendingByType[type] = (pendingByType[type] ?? 0) + 1;
      oldestPendingMs = Math.max(oldestPendingMs, age);
      if (["document", "xhr", "fetch"].includes(type) && age < 3_000) pending++;
    }
    return { pending, revision: this.activityRevision, pendingByType, oldestPendingMs };
  }
  private readonly documents = new Set<string>();
  private readonly genericOrigins = new Set<string>();
  private readonly diagnostics: NetworkDiagnostic[] = [];
  private readonly requests: BrowserReadNetworkObservation[] = [];
  // CDP and Playwright facts are separate observations, never paired by URL/order.
  private readonly resourceTypes: BrowserReadResourceTypeObservation[] = [];
  private requestTimeoutMs: number;
  private readonly redirectSessions = new WeakMap<Page, Promise<void>>();
  private readonly redirectReady = new WeakSet<Page>();
  private readonly expectedRedirectTargets = new Map<string, { hops: number; started: number }>();
  private readonly popupBootstraps = new Set<string>();
  private readonly redirectTimers = new Set<ReturnType<typeof setTimeout>>();

  constructor(private readonly policy: BrowserReadNetworkPolicy, requestTimeoutMs = 5_000, private readonly recordResponse?: (response: { url: string; method: string; resourceType: string; status: number; contentType: string; body: Uint8Array; redirectLocation?: string }) => Promise<void> | void, private readonly admittedGetTransport: "NODE_FETCH" | "BROWSER_GET_HEAD" = "NODE_FETCH") { this.requestTimeoutMs = requestTimeoutMs; }

  async install(context: BrowserContext, options: { replay?: boolean } = {}): Promise<void> {
    this.context = context;
    if (this.admittedGetTransport === "BROWSER_GET_HEAD" && !options.replay) {
      context.on("response", response => this.captureNativeResponse(response));
      context.on("requestfinished", request => {
        const timer = this.nativeTimers.get(request); if (timer) { clearTimeout(timer); this.redirectTimers.delete(timer); }
      });
      context.on("requestfailed", request => {
        const timer = this.nativeTimers.get(request); if (timer) { clearTimeout(timer); this.redirectTimers.delete(timer); }
        if (this.nativeRequest(request) && request.failure()) this.recordNativeFailure(request,new Error(request.failure()!.errorText));
      });
    }
    context.on?.("close", () => { for (const timer of this.redirectTimers) clearTimeout(timer); this.redirectTimers.clear(); });
    context.on?.("page", page => {
      const bootstrap = this.popupBootstraps.delete(requestKey(page.url()));
      const url = page.url();
      void this.preparePopupForm(page, url).then(() => this.preparePage(context, page, options.replay === true))
        .then(async () => { if (bootstrap) await page.goto(url, { timeout: this.requestTimeoutMs }).catch(() => {}); })
        .catch(() => context.close().catch(() => {}));
    });
    context.on?.("request", request => { this.pending.set(request, Date.now()); if (["document", "xhr", "fetch"].includes(request.resourceType())) this.activityRevision++; });
    const finished = (request: Request) => { if (this.pending.delete(request) && ["document", "xhr", "fetch"].includes(request.resourceType())) this.activityRevision++; };
    context.on?.("requestfinished", finished);
    context.on?.("requestfailed", finished);
    await context.routeWebSocket("**/*", socket => socket.close());
    await context.route("**/*", async route => {
      const request = route.request();
      let page: Page;
      try { page = request.frame().page(); } catch {
        // Chromium may pause a popup before Playwright exposes its Frame/Page.
        // Commit an empty local bootstrap, never a source response, so its page
        // can be protected before the original GET is issued exactly once.
        if (request.isNavigationRequest() && request.method() === "GET") {
          if (!await this.preparePopupForm(undefined, request.url())) {
            this.blocked("BLOCKED_FIELDS", new URL(request.url()), request.method(), request.resourceType());
            await route.abort("blockedbyclient"); return;
          }
          this.popupBootstraps.add(requestKey(request.url()));
          await route.fulfill({ status: 200, contentType: "text/html", body: '<body aria-busy="true"></body>' });
        } else await route.abort("blockedbyclient");
        return;
      }
      const ready = this.redirectReady.has(page);
      if (!await this.preparePopupForm(page, request.url())) {
        this.blocked("BLOCKED_FIELDS", new URL(request.url()), request.method(), request.resourceType());
        await route.abort("blockedbyclient"); return;
      }
      await this.installRedirectProtection(context, page, options.replay === true);
      if (!ready) {
        // A popup's first loader can exist before a page CDP session. Abort it
        // before dispatch, then start a fresh guarded loader. Explicit runtime
        // pages are prepared before navigation and never take this branch.
        await route.abort("blockedbyclient");
        if (request.isNavigationRequest() && request.method() === "GET") {
          void request.frame().goto(request.url(), { timeout: this.requestTimeoutMs }).catch(() => {});
        }
        return;
      }
      await this.handle(route, options.replay === true);
    });
    for (const page of context.pages()) await this.preparePage(context, page, options.replay === true);
  }

  async preparePage(context: BrowserContext, page: Page, replay = false): Promise<void> {
    return this.installRedirectProtection(context, page, replay);
  }

  private async preparePopupForm(page: Page | undefined, value: string): Promise<boolean> {
    if (page && this.preparedPopups.has(page)) return this.blockedPopupForms.get(page) !== requestKey(value);
    const pending = this.popupForms.get(requestKey(value));
    if (!pending) return true;
    const opener = page ? await page.opener() : undefined;
    if (page && !opener) return true;
    const form = await pending;
    if (form && page && opener !== form.opener) return true;
    if (page) {
      this.preparedPopups.add(page);
      this.popupForms.delete(requestKey(value));
    }
    if (!form) return true; // Ordinary link/window navigation keeps its old policy.
    if (!form.evidence) { if (page) this.blockedPopupForms.set(page, requestKey(value)); return false; }
    if (page) {
      const receipts = this.formAdmissions.get(page) ?? new Map();
      receipts.set(requestKey(value), { evidence: form.evidence, startedAt: form.startedAt });
      this.formAdmissions.set(page, receipts);
    }
    return true;
  }

  private async installRedirectProtection(context: BrowserContext, page: Page, replay: boolean): Promise<void> {
    const existing = this.redirectSessions.get(page);
    if (existing) return existing;
    const installing = this.attachRedirectProtection(context, page, replay).then(() => { this.redirectReady.add(page); });
    this.redirectSessions.set(page, installing);
    return installing;
  }

  private async attachRedirectProtection(context: BrowserContext, page: Page, replay: boolean): Promise<void> {
    const session = await context.newCDPSession(page);
    await session.send("Page.enable");
    const rootFrameId = (await session.send("Page.getFrameTree")).frameTree.frame.id;
    session.on("Page.frameNavigated",event=>{if(event.frame.id===rootFrameId)this.forms.clearObservedPageValues(page);});
    session.on("Page.windowOpen", event => {
      const startedAt = Date.now();
      this.popupForms.set(requestKey(event.url), this.observedPopupSubmission(page, new URL(event.url), event.windowName)
        .then(form => form ? { ...form, startedAt, opener: page } : undefined).catch(() => ({ startedAt, opener: page })));
    });
    // Child targets (OOPIFs and dedicated workers) have their own CDP sessions.
    // Keep them paused until the same interception is installed. This private
    // wire adapter only transports CDP; it never makes an admission decision.
    type Send = CDPSession["send"];
    type On = (method: string, handler: (params: any) => void) => void;
    let sequence = 0;
    const configure = async (send: Send, on: On): Promise<void> => {
      const formNavigations = new Map<string, { evidence: Promise<ObservedGetFormSubmission | undefined>; startedAt: number }>();
      on("Page.frameRequestedNavigation", event => {
        if (event.reason !== "formSubmissionGet" && event.reason !== "formSubmissionPost") return;
        const key = `${event.frameId}|${requestKey(event.url)}`;
        // Only the observed active document can own a form receipt. An iframe,
        // popup or unobserved native form cannot borrow a top-page observation.
        formNavigations.set(key, { startedAt: Date.now(), evidence: event.reason === "formSubmissionGet" && event.frameId === rootFrameId
          ? this.observedSubmission(page, new URL(event.url)) : Promise.resolve(undefined) });
      });
      // Fetch can label a worker script "Other". Use the same Network type
      // that Playwright's ordinary request boundary uses, keyed by networkId.
      const networkTypes = new Map<string, string>();
      const nativeNetworkTimers = new Map<string, ReturnType<typeof setTimeout>>();
      const finishNative = (id: string) => { const timer = nativeNetworkTimers.get(id); if (timer) { clearTimeout(timer); this.redirectTimers.delete(timer); nativeNetworkTimers.delete(id); } };
      on("Network.requestWillBeSent", event => { if (event.type) networkTypes.set(event.requestId, event.type); });
      on("Network.loadingFinished", event => { networkTypes.delete(event.requestId); finishNative(event.requestId); });
      on("Network.loadingFailed", event => { networkTypes.delete(event.requestId); finishNative(event.requestId); });
      const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
      const childEvents = new Map<string, Map<string, (params: any) => void>>();
      on("Target.receivedMessageFromTarget", event => {
        const value = JSON.parse(event.message);
        if (value.id !== undefined) {
          const promise = pending.get(value.id); pending.delete(value.id);
          if (value.error) promise?.reject(new Error(value.error.message)); else promise?.resolve(value.result);
        } else childEvents.get(event.sessionId)?.get(value.method)?.(value.params);
      });
      on("Target.attachedToTarget", event => {
        const handlers = new Map<string, (params: any) => void>(); childEvents.set(event.sessionId, handlers);
        const childSend: Send = (method, params) => new Promise((resolve, reject) => {
          const id = ++sequence; pending.set(id, { resolve, reject });
          void send("Target.sendMessageToTarget", { sessionId: event.sessionId, message: JSON.stringify({ id, method, params: params ?? {} }) }).catch(reject);
        });
        // Dedicated-worker URL loaders use the owner frame's Fetch domain;
        // worker CDP targets themselves do not expose Fetch.enable.
        const setup = event.targetInfo.type === "worker"
          ? Promise.resolve() : configure(childSend, (method, handler) => { handlers.set(method, handler); });
        void setup
          .then(() => childSend("Runtime.runIfWaitingForDebugger"))
          .catch(() => context.close().catch(() => {}));
      });
      const chains = new Map<string, { hops: number; started: number }>();
      const redirected = new Map<string, { url: URL; method: string; type: string; timer: ReturnType<typeof setTimeout> }>();
      on("Fetch.requestPaused", event => {
        const process = async () => {
          const url = new URL(event.request.url), method = event.request.method;
          await this.inspectQuery(url,page);
          const network = networkTypes.get(event.networkId);
          const type = String(network ?? event.resourceType).toLowerCase();
          const resourceTypeDetails = { selectedFrom: network ? "NETWORK" as const : "FETCH" as const,
            ...(network ? { network } : {}), fetch: String(event.resourceType) };
          this.resourceTypes.push({ origin: url.origin, pathname: url.pathname, method, resourceType: type, resourceTypeDetails });
          const request = { headerValue: async (name: string) => Object.entries(event.request.headers as Record<string, string>).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? null, postData: () => event.request.postData ?? (event.request.hasPostData ? "BODY_UNAVAILABLE" : null) };
          if (event.responseStatusCode !== undefined) {
            const entry = redirected.get(event.requestId);
            if (!entry) { await send("Fetch.continueResponse", { requestId: event.requestId }); return; }
            try {
              const headers: Record<string, string> = Object.fromEntries((event.responseHeaders ?? []).map((h: { name: string; value: string }) => [h.name.toLowerCase(), h.value]));
              const status = event.responseStatusCode as number;
              const location = headers.location ? new URL(headers.location, url) : undefined;
              const nextMethod = status === 303 && method !== "HEAD" || [301, 302].includes(status) && method === "POST" ? "GET" : method;
              const targetAdmitted = method !== "OPTIONS" && location && await this.admitsRedirectRequest(location, request, nextMethod, type);
              const body = this.admittedGetTransport === "BROWSER_GET_HEAD" && ["GET", "HEAD"].includes(method) || !this.recordResponse || status >= 300 && status < 400 || method === "HEAD" || status === 204
                ? new Uint8Array() : await send("Fetch.getResponseBody", { requestId: event.requestId }).then(value => Buffer.from(value.body, value.base64Encoded ? "base64" : "utf8"));
              if (!(this.admittedGetTransport === "BROWSER_GET_HEAD" && ["GET", "HEAD"].includes(method))) await this.recordResponse?.({ url: url.toString(), method, resourceType: type, status, contentType: headers["content-type"] ?? "", body,
                ...(location && targetAdmitted ? { redirectLocation: location.toString() } : {}) });
              if (location && [301, 302, 303, 307, 308].includes(status)) {
                if (!targetAdmitted) {
                  this.blocked("BLOCKED_REDIRECT", location, nextMethod, type);
                  await send("Fetch.failRequest", { requestId: event.requestId, errorReason: "BlockedByClient" }); return;
                }
                const chain = chains.get(event.requestId)!;
                this.expectedRedirectTargets.set(requestKey(location.toString()), { hops: chain.hops + 1, started: chain.started });
              }
              await send("Fetch.continueResponse", { requestId: event.requestId });
            } finally { if (!(this.admittedGetTransport === "BROWSER_GET_HEAD" && ["GET", "HEAD"].includes(method))) { clearTimeout(entry.timer); this.redirectTimers.delete(entry.timer); } redirected.delete(event.requestId); }
            return;
          }
          const expected = this.expectedRedirectTargets.get(requestKey(url.toString()));
          this.expectedRedirectTargets.delete(requestKey(url.toString()));
          const isRedirect = Boolean(event.redirectedRequestId) || Boolean(expected);
          // Redirect metadata is only for chain accounting, never authority.
          // Chromium-native redirects may bypass Playwright's ordinary route;
          // a missing marker or normalized target must not bypass this policy.
          // Origin, Sec-Fetch-* and Access-Control-Request-* are browser-reserved
          // headers: page JS cannot forge them. Read the actual paused request,
          // not a timing-dependent Network initiator event or a model assertion.
          const corsPreflight = method === "OPTIONS"
            ? { initiator: "BROWSER_PREFLIGHT" as const, secFetchMode: await request.headerValue("sec-fetch-mode") ?? "", requestOrigin: await request.headerValue("origin") ?? "",
                requestedMethod: await request.headerValue("access-control-request-method") ?? "",
                requestedHeaderNames: (await request.headerValue("access-control-request-headers") ?? "").split(",").map(name => name.trim().toLowerCase()).filter(Boolean),
                bodyBytes: Buffer.byteLength(request.postData() ?? "") } : undefined;
          const formKey = `${event.frameId}|${requestKey(url.toString())}`;
          const formNavigation = !isRedirect ? formNavigations.get(formKey) : undefined;
          formNavigations.delete(formKey);
          const inherited = !isRedirect && event.frameId === rootFrameId ? this.formAdmissions.get(page)?.get(requestKey(url.toString())) : undefined;
          const formSubmission = formNavigation ? await traceFormEvidence("GUARD_EVIDENCE", () => formNavigation.evidence) : inherited?.evidence;
          const formAdmitted = Boolean(formSubmission && method === "GET" && type === "document"
            && !this.prohibitedRead(url) && !this.sensitiveWorkflow(url) && !url.username && !url.password
            && (this.policy.documentOrigins.includes(url.origin) || this.policy.genericPublicRead && this.genericOrigins.has(url.origin)));
          const admitted = formNavigation || inherited ? formAdmitted : method === "OPTIONS"
            ? !isRedirect && !replay && await this.admitsPreflight(url, type, corsPreflight)
            : await this.admitsRedirectRequest(url, request, method, type);
          if (!admitted) {
            this.blocked(isRedirect ? "BLOCKED_REDIRECT" : ["GET", "HEAD"].includes(method) ? "BLOCKED_ENDPOINT" : "BLOCKED_METHOD", url, method, type);
            await send("Fetch.failRequest", { requestId: event.requestId, errorReason: "BlockedByClient" }); return;
          }
          if (this.suppressResource(url, method, type)) {
            this.resourcePolicyBlocked(url, method, type, "FETCH");
            await send("Fetch.failRequest", { requestId: event.requestId, errorReason: "BlockedByClient" }); return;
          }
          if (formAdmitted && formSubmission) {
            const receipts = this.formAdmissions.get(page) ?? new Map<string, { evidence: ObservedGetFormSubmission; startedAt: number }>();
            receipts.set(requestKey(url.toString()), { evidence: formSubmission, startedAt: formNavigation?.startedAt ?? inherited!.startedAt });
            this.formAdmissions.set(page, receipts);
          }
          const previous = event.redirectedRequestId ? chains.get(event.redirectedRequestId) : undefined;
          chains.set(event.requestId, expected ?? { hops: previous ? previous.hops + 1 : isRedirect ? 1 : 0, started: previous?.started ?? Date.now() });
          // An admitted unrecognized/initial request also traverses the normal route.
          if (!isRedirect && method !== "OPTIONS") { await send("Fetch.continueRequest", { requestId: event.requestId }); return; }
          const chain = chains.get(event.requestId)!;
          // HAR never gets a live-network fallback for a redirect it did not
          // fulfill itself. Every request that reaches this branch is native.
          if (replay || chain.hops >= 10 || Date.now() - chain.started >= this.requestTimeoutMs) {
            this.blocked("BLOCKED_REDIRECT", url, method, type);
            await send("Fetch.failRequest", { requestId: event.requestId, errorReason: "BlockedByClient" }); return;
          }
          this.requests.push({ outcome: "ADMITTED", origin: url.origin, pathname: url.pathname, method, resourceType: type, queryKeys: [...new Set(url.searchParams.keys())].sort(), ...this.queryMetadata(url), ...(corsPreflight ? { corsPreflight } : {}) });
          const timer = setTimeout(() => {
            this.redirectTimers.delete(timer);
            this.blocked("READ_TIMEOUT", url, method, type, Object.assign(new Error("Guard redirect read timed out"), { name: "TimeoutError" }));
            if (this.admittedGetTransport === "BROWSER_GET_HEAD" && ["GET", "HEAD"].includes(method)) void context.close().catch(() => {});
            else void send("Fetch.failRequest", { requestId: event.requestId, errorReason: "TimedOut" }).catch(() => {});
          }, Math.max(1, this.requestTimeoutMs - (Date.now() - chain.started)));
          timer.unref(); this.redirectTimers.add(timer); redirected.set(event.requestId, { url, method, type, timer });
          if (this.admittedGetTransport === "BROWSER_GET_HEAD" && ["GET", "HEAD"].includes(method) && event.networkId) nativeNetworkTimers.set(event.networkId, timer);
          await send("Fetch.continueRequest", { requestId: event.requestId, interceptResponse: true });
        };
        void process().catch(async error => { this.blocked("READ_REQUEST_FAILED", new URL(event.request.url), event.request.method, String(event.resourceType).toLowerCase(), error); await send("Fetch.failRequest", { requestId: event.requestId, errorReason: "Failed" }).catch(() => {}); });
      });
      await send("Network.enable");
      await send("Page.enable").catch(() => {});
      await send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
      await send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: false });
    };
    await configure(session.send.bind(session), (method, handler) => { session.on(method as any, handler); });
  }

  private async admitsPreflight(url: URL, type: string, facts?: BrowserReadCorsPreflightObservation): Promise<boolean> {
    if (this.prohibitedRead(url) || url.username || url.password || !/^https?:$/.test(url.protocol)
      || !facts || facts.secFetchMode !== "cors" || !["GET", "HEAD", "POST"].includes(facts.requestedMethod) || facts.bodyBytes !== 0) return false;
    for (const rule of [...this.policy.staticResources, ...this.policy.dynamicReads]) {
      const cors = rule.corsPreflight;
      if (!cors || facts.requestedMethod === "POST" && !rule.bodyFields || facts.requestOrigin !== cors?.requestOrigin
        || facts.requestedHeaderNames.some(name => !name || !cors.requestedHeaderNames.includes(name))) continue;
      // Only the approved actual read's projection is available now. Its full
      // body is checked separately when the actual POST reaches this boundary.
      if (matchesReadProjection(rule, url, facts.requestedMethod, "fetch") && matchesQueryValues(rule,url,this.queryMetadata(url).queryValues)) return true;
    }
    return false;
  }

  private async admitsRedirectRequest(url: URL, request: Pick<Request, "headerValue" | "postData">, method: string, type: string): Promise<boolean> {
    if (this.prohibitedRead(url) || url.username || url.password || !/^https?:$/.test(url.protocol)) return false;
    const sourceRule = (await Promise.all([...this.policy.staticResources, ...this.policy.dynamicReads].map(rule => allows(rule, request, url, method, type,this.queryMetadata(url).queryValues)))).some(Boolean);
    if (type === "document" && ["GET", "HEAD"].includes(method) && (!this.sensitiveGenericRead(url) || sourceRule)
      && (this.policy.documentOrigins.includes(url.origin) || this.policy.genericPublicRead && this.genericOrigins.has(url.origin))) return true;
    if (sourceRule) return true;
    return this.policy.genericPublicRead === true && this.genericOrigins.has(url.origin) && ["GET", "HEAD"].includes(method)
      && ["document", "script", "stylesheet", "font", "image", "media", "xhr", "fetch"].includes(type) && !this.sensitiveGenericRead(url);
  }

  prepareNavigation(value: string, timeoutMs?: number): void {
    const url = new URL(value);
    this.assertSafePreparedDocument(url);
    if (!this.policy.documentOrigins.includes(url.origin) && !this.policy.genericPublicRead) throw new Error("Browser read document origin is not source-admitted");
    if (timeoutMs !== undefined) this.requestTimeoutMs = Math.max(1, timeoutMs);
    this.documents.add(requestKey(url.toString()));
    if (this.policy.genericPublicRead) this.genericOrigins.add(url.origin);
  }

  /** Executor has already bound this URL to a fresh observed link and source-owned origin allowlist. */
  prepareObservedNavigation(value: string, timeoutMs?: number): void {
    const url = new URL(value);
    this.assertSafePreparedDocument(url);
    if (!/^https?:$/i.test(url.protocol)) throw new Error("Browser read document protocol is not admitted");
    if (timeoutMs !== undefined) this.requestTimeoutMs = Math.max(1, timeoutMs);
    this.documents.add(requestKey(url.toString()));
    if (this.policy.genericPublicRead) this.genericOrigins.add(url.origin);
  }

  private assertSafePreparedDocument(url: URL): void {
    if (this.prohibitedRead(url)) throw new Error("Browser read prohibited source workflow");
    if (!/^https?:$/i.test(url.protocol) || url.username || url.password) throw new Error("Browser read document credentials or protocol are not admitted");
    if (this.sensitiveGenericRead(url) && !this.matchesReviewedDocument(url)) throw new Error("Browser read sensitive document is not admitted");
  }

  /** A source rule may explicitly admit an otherwise sensitive-looking public query document. */
  private matchesReviewedDocument(url: URL): boolean {
    return [...this.policy.staticResources, ...this.policy.dynamicReads].some(rule => {
      if (url.origin !== rule.origin || !matchesPath(rule, url)) return false;
      if (!((rule.methods ?? ["GET", "HEAD"]).includes("GET"))) return false;
      const counts = new Map<string, number>(); for (const key of url.searchParams.keys()) counts.set(key, (counts.get(key) ?? 0) + 1);
      if (rule.queryKeyRules) {
        const required = new Set(rule.queryKeyRules.required), allowed = new Set(rule.queryKeyRules.allowed ?? []), repeatable = new Set(rule.queryKeyRules.repeatable ?? []), patterns = (rule.queryKeyRules.allowedPatterns ?? []).map(value => new RegExp(value));
        return ![...required].some(key => !counts.has(key)) && ![...counts].some(([key, count]) => (!required.has(key) && !allowed.has(key) && !repeatable.has(key) && !patterns.some(pattern => pattern.test(key))) || (count > 1 && !repeatable.has(key)));
      }
      const expected = [...(rule.queryKeys ?? [])].sort(), actual = [...counts.keys()].sort();
      return expected.length === actual.length && expected.every((key, index) => key === actual[index]) && [...counts.values()].every(count => count === 1);
    });
  }

  snapshotDiagnostics(): NetworkDiagnostic[] { return [...this.diagnostics]; }
  snapshotRequests(): BrowserReadNetworkObservation[] { return [...this.requests]; }
  snapshotResourceTypes(): BrowserReadResourceTypeObservation[] { return [...this.resourceTypes]; }

  private blocked(code: NetworkDiagnosticCode, url: URL, method: string, resourceType: string, error?: unknown): void {
    const request = { origin: url.origin, pathname: url.pathname, method, resourceType, queryKeys: [...new Set(url.searchParams.keys())].sort(), ...this.queryMetadata(url), ...(error === undefined ? {} : { error: browserTransportError(error) }) };
    this.diagnostics.push({ code, ...request });
    this.requests.push({ outcome: code === "BLOCKED_REDIRECT" ? "REDIRECT_BLOCKED" : code === "READ_REQUEST_FAILED" ? "FAILED" : code === "READ_TIMEOUT" ? "TIMED_OUT" : "BLOCKED", ...request });
  }

  /** Suppression is evaluated only after admission; an exception cannot grant permission. */
  private suppressResource(url: URL, method: string, type: string): boolean {
    return ["image", "media", "font"].includes(type)
      && !(this.policy.retainedResources ?? []).some(rule => matchesReadProjection(rule, url, method, type));
  }

  private resourcePolicyBlocked(url: URL, method: string, type: string, selectedFrom: "PLAYWRIGHT" | "FETCH"): void {
    this.blocked("RESOURCE_POLICY_BLOCKED", url, method, type);
    // Recorder preserves protocol details and excludes BLOCKED requests from missing dependencies.
    this.requests[this.requests.length - 1]!.resourceTypeDetails = {
      selectedFrom, ...(selectedFrom === "PLAYWRIGHT" ? { playwright: type } : { fetch: type }), policyBlock: "NONESSENTIAL_RESOURCE",
    };
  }

  private async handle(route: Route, replay: boolean): Promise<void> {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    let requestPage:Page|undefined;try{requestPage=request.frame().page();}catch{ /* Unowned requests have no fill authority. */ }
    await this.inspectQuery(url,requestPage);
    this.requestQueryObservations.set(request,this.queryMetadata(url).queryValues);
    const type = request.resourceType();
    if (this.prohibitedRead(url)) {
      this.blocked("BLOCKED_ENDPOINT", url, method, type);
      await route.abort("blockedbyclient");
      return;
    }
    const key = requestKey(url.toString());
    let formSubmission: ObservedGetFormSubmission | undefined;
    let formStartedAt: number | undefined;
    if (type === "document" && method === "GET") {
      try {
        if (!request.isNavigationRequest()) throw new Error("Not a navigation");
        const page = request.frame().page();
        if (request.frame() === page.mainFrame()) {
          const receipt = this.formAdmissions.get(page)?.get(key);
          formSubmission = receipt?.evidence; formStartedAt = receipt?.startedAt;
          this.formAdmissions.get(page)?.delete(key);
        }
      } catch { /* Unobserved frames do not receive form permission. */ }
    }
    const observedForm = Boolean(formSubmission && !this.sensitiveWorkflow(url));
    const remainingRequestMs = formStartedAt === undefined ? this.requestTimeoutMs : this.requestTimeoutMs - (Date.now() - formStartedAt);
    if (remainingRequestMs <= 0) {
      this.blocked("READ_TIMEOUT", url, method, type);
      await route.abort("timedout"); return;
    }
    const preparedDocument = type === "document" && (method === "GET" || method === "HEAD") && this.documents.delete(key);
    const rules = [...this.policy.staticResources, ...this.policy.dynamicReads];
    const sourceRule = (await Promise.all(rules
      .map(rule => allows(rule, request, url, method, type,this.queryMetadata(url).queryValues)))).some(Boolean);
    const document = preparedDocument && (!this.sensitiveGenericRead(url) || sourceRule);
    const genericRead = this.policy.genericPublicRead === true
      && this.genericOrigins.has(url.origin)
      && (method === "GET" || method === "HEAD")
      && ["document", "script", "stylesheet", "font", "image", "media", "xhr", "fetch"].includes(type)
      && !this.sensitiveGenericRead(url);
    if (!observedForm && !document && !sourceRule && !genericRead) {
      const endpointKnown = rules.some(rule => matchesEndpoint(rule, url, type));
      this.blocked(endpointKnown
        ? ((method !== "GET" && method !== "HEAD" && !rules.some(rule => matchesEndpoint(rule, url, type) && (rule.methods ?? ["GET", "HEAD"]).includes(method as "GET" | "HEAD" | "POST"))) ? "BLOCKED_METHOD" : "BLOCKED_FIELDS")
        : "BLOCKED_ENDPOINT", url, method, type);
      await route.abort("blockedbyclient");
      return;
    }
    if (this.suppressResource(url, method, type)) {
      this.resourcePolicyBlocked(url, method, type, "PLAYWRIGHT");
      await route.abort("blockedbyclient");
      return;
    }
    // HAR routing is installed before this boundary. Falling through only after
    // admission preserves the same policy in replay and lets routeFromHAR abort
    // every missing entry without a route.fetch network escape.
    if (replay) {
      this.requests.push({ outcome: "ADMITTED", origin: url.origin, pathname: url.pathname, method, resourceType: type, resourceTypeDetails: { selectedFrom: "PLAYWRIGHT", playwright: type }, queryKeys: [...new Set(url.searchParams.keys())].sort(), ...this.queryMetadata(url), ...(formSubmission ? { formSubmission } : {}) });
      await route.fallback();
      return;
    }
    try {
      this.requests.push({ outcome: "ADMITTED", origin: url.origin, pathname: url.pathname, method, resourceType: type, resourceTypeDetails: { selectedFrom: "PLAYWRIGHT", playwright: type }, queryKeys: [...new Set(url.searchParams.keys())].sort(), ...this.queryMetadata(url), ...(formSubmission ? { formSubmission } : {}) });
      if (this.admittedGetTransport === "BROWSER_GET_HEAD" && ["GET", "HEAD"].includes(method)) {
        this.nativeRequests.add(request);
        // A native request has no Route.abort capability after continue(). Keep
        // the same transport deadline and fail closed by retiring this context.
        const timer = setTimeout(() => {
          this.redirectTimers.delete(timer);
          this.blocked("READ_TIMEOUT", url, method, type, Object.assign(new Error("Native browser read timed out"), { name: "TimeoutError" }));
          void this.context?.close().catch(() => {});
        }, remainingRequestMs);
        timer.unref(); this.nativeTimers.set(request, timer); this.redirectTimers.add(timer);
        await route.continue();
        return;
      }
      const response = await route.fetch({ maxRedirects: 0, timeout: remainingRequestMs });
      if (response.status() >= 300 && response.status() < 400) {
        let target: URL | undefined;
        try { if (response.headers()["location"]) target = new URL(response.headers()["location"]!, url); } catch { /* rejected below */ }
        const nextMethod = response.status() === 303 && method !== "HEAD" || [301, 302].includes(response.status()) && method === "POST" ? "GET" : method;
        if (!target || !await this.admitsRedirectRequest(target, request, nextMethod, type)) { this.blocked("BLOCKED_REDIRECT", target ?? url, nextMethod, type); await route.abort("blockedbyclient"); return; }
        // Persist only the already-admitted, credential-free redirect target.
        // Replay then begins at the original prepared document instead of
        // silently replacing it with the final canonical page.
        if (this.recordResponse) {
          const contentType = response.headers()["content-type"] ?? "";
          await this.recordResponse({ url: url.toString(), method, resourceType: type, status: response.status(), contentType, body: await response.body(), redirectLocation: target.toString() });
        }
        if (type === "document") this.documents.add(requestKey(target.toString()));
        this.expectedRedirectTargets.set(requestKey(target.toString()), { hops: 1, started: Date.now() });
        if (type === "document" && this.policy.genericPublicRead) this.genericOrigins.add(target.origin);
        await route.fulfill({ response });
        return;
      }
      if (this.recordResponse) {
        const contentType = response.headers()["content-type"] ?? "";
        await this.recordResponse({ url: url.toString(), method, resourceType: type, status: response.status(), contentType, body: await response.body() });
      }
      await route.fulfill({ response });
    } catch (error) {
      const code = error instanceof Error && error.name === "TimeoutError" ? "READ_TIMEOUT" : "READ_REQUEST_FAILED";
      this.blocked(code, url, method, type, error);
      this.requests[this.requests.length - 1] = { outcome: code === "READ_TIMEOUT" ? "TIMED_OUT" : "FAILED", error: browserTransportError(error), origin: url.origin, pathname: url.pathname, method, resourceType: type, resourceTypeDetails: { selectedFrom: "PLAYWRIGHT", playwright: type }, queryKeys: [...new Set(url.searchParams.keys())].sort(), ...this.queryMetadata(url) };
      await route.abort("failed");
    }
  }

  /** An explicit source revocation cannot be reopened by a reviewed read rule. */
  private prohibitedRead(url: URL): boolean {
    return isBrowserReadPathProhibited(this.policy, url);
  }

  /** ADR-0036 permits public GET/HEAD exploration, not sensitive endpoint or PII query shapes. */
  private sensitiveGenericRead(url: URL): boolean {
    if(this.policy.dynamicReads.some(rule=>url.origin===rule.origin&&matchesPath(rule,url)
      &&rule.strictQueryKeys?.some(key=>url.searchParams.has(key))))return true;
    return this.sensitiveWorkflow(url) || [...url.searchParams.keys()].some(key => /(?:email|e-mail|phone|tel|address|name|password|passcode|token|secret|cookie|api_?key|card|payment|credit)/i.test(key));
  }

  private sensitiveWorkflow(url: URL): boolean {
    const path = url.pathname.toLowerCase();
    // Explicit sensitive segments always win, including below a public
    // calendar namespace. Only the booking/reserve container itself gets the
    // narrow public-query exception below.
    if (/(?:^|\/)(?:login|signin|sign-in|account|checkout|payment|purchase|cancel|delete|confirm)(?:\/|$)/.test(path)) return true;
    // A booking namespace can still expose public calendars and vacancy lists.
    // Keep those read-shaped descendants in Generic GET admission; other
    // booking/reserve descendants remain fail-closed.
    const publicQueryNamespace = /\/(?:booking|reserve)\/(?:calendar|availability|vacancy|status|search|list)(?:\/|$)/.test(path);
    if (!publicQueryNamespace && /(?:^|\/)(?:booking|reserve)(?:\/|$)/.test(path)) return true;
    return [...url.searchParams].some(([key, value]) => /^(?:action|cmd|command|operation)$/i.test(key) && /^(?:cancel|delete|remove|confirm|purchase|pay|book|reserve)$/i.test(value));
  }
}
