import {isBrowserReadPathProhibited} from "./browser-read-policy.js";
import type { BrowserContext, CDPSession, Page, Request, Route } from "playwright-core";

import type { BrowserReadCorsPreflightObservation, BrowserReadNetworkObservation, BrowserReadNetworkPolicy, BrowserReadNetworkRequestRule } from "./browser-runtime.js";

type NetworkDiagnosticCode = "BLOCKED_ENDPOINT" | "BLOCKED_FIELDS" | "BLOCKED_METHOD" | "BLOCKED_REDIRECT" | "READ_REQUEST_FAILED" | "READ_TIMEOUT";
type NetworkDiagnostic = { code: NetworkDiagnosticCode; origin: string; pathname: string; method: string; resourceType: string; queryKeys: string[] };

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

async function allows(rule: BrowserReadNetworkRequestRule, request: Pick<Request, "headerValue" | "postData">, url: URL, method: string, resourceType: string): Promise<boolean> {
  if (url.origin !== rule.origin || !matchesPath(rule, url)) return false;
  if (!rule.resourceTypes.includes(resourceType as never)) return false;
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
    && rule.resourceTypes.includes(resourceType as never);
}

/**
 * Ordinary routes guard the initial request. A second CDP Fetch interceptor
 * pauses native redirect requests before dispatch; Chromium retains URL,
 * relative-resource, method and cookie semantics instead of flattening a chain.
 */
export class PlaywrightReadNetworkGuard {
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
  private requestTimeoutMs: number;
  private readonly redirectSessions = new WeakMap<Page, Promise<void>>();
  private readonly redirectReady = new WeakSet<Page>();
  private readonly expectedRedirectTargets = new Map<string, { hops: number; started: number }>();
  private readonly popupBootstraps = new Set<string>();
  private readonly redirectTimers = new Set<ReturnType<typeof setTimeout>>();

  constructor(private readonly policy: BrowserReadNetworkPolicy, requestTimeoutMs = 5_000, private readonly recordResponse?: (response: { url: string; method: string; resourceType: string; status: number; contentType: string; body: Uint8Array; redirectLocation?: string }) => Promise<void> | void) { this.requestTimeoutMs = requestTimeoutMs; }

  async install(context: BrowserContext, options: { replay?: boolean } = {}): Promise<void> {
    context.on?.("close", () => { for (const timer of this.redirectTimers) clearTimeout(timer); this.redirectTimers.clear(); });
    context.on?.("page", page => {
      const bootstrap = this.popupBootstraps.delete(requestKey(page.url()));
      const url = page.url();
      void this.preparePage(context, page, options.replay === true)
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
          this.popupBootstraps.add(requestKey(request.url()));
          await route.fulfill({ status: 200, contentType: "text/html", body: '<body aria-busy="true"></body>' });
        } else await route.abort("blockedbyclient");
        return;
      }
      const ready = this.redirectReady.has(page);
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

  private async installRedirectProtection(context: BrowserContext, page: Page, replay: boolean): Promise<void> {
    const existing = this.redirectSessions.get(page);
    if (existing) return existing;
    const installing = this.attachRedirectProtection(context, page, replay).then(() => { this.redirectReady.add(page); });
    this.redirectSessions.set(page, installing);
    return installing;
  }

  private async attachRedirectProtection(context: BrowserContext, page: Page, replay: boolean): Promise<void> {
    const session = await context.newCDPSession(page);
    // Child targets (OOPIFs and dedicated workers) have their own CDP sessions.
    // Keep them paused until the same interception is installed. This private
    // wire adapter only transports CDP; it never makes an admission decision.
    type Send = CDPSession["send"];
    type On = (method: string, handler: (params: any) => void) => void;
    let sequence = 0;
    const configure = async (send: Send, on: On): Promise<void> => {
      // Fetch can label a worker script "Other". Use the same Network type
      // that Playwright's ordinary request boundary uses, keyed by networkId.
      const networkTypes = new Map<string, string>();
      on("Network.requestWillBeSent", event => { if (event.type) networkTypes.set(event.requestId, event.type); });
      on("Network.loadingFinished", event => { networkTypes.delete(event.requestId); });
      on("Network.loadingFailed", event => { networkTypes.delete(event.requestId); });
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
          const type = String(networkTypes.get(event.networkId) ?? event.resourceType).toLowerCase();
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
              const body = !this.recordResponse || status >= 300 && status < 400 || method === "HEAD" || status === 204
                ? new Uint8Array() : await send("Fetch.getResponseBody", { requestId: event.requestId }).then(value => Buffer.from(value.body, value.base64Encoded ? "base64" : "utf8"));
              await this.recordResponse?.({ url: url.toString(), method, resourceType: type, status, contentType: headers["content-type"] ?? "", body,
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
            } finally { clearTimeout(entry.timer); this.redirectTimers.delete(entry.timer); redirected.delete(event.requestId); }
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
          const admitted = method === "OPTIONS"
            ? !isRedirect && !replay && await this.admitsPreflight(url, request, type, corsPreflight)
            : await this.admitsRedirectRequest(url, request, method, type);
          if (!admitted) {
            this.blocked(isRedirect ? "BLOCKED_REDIRECT" : ["GET", "HEAD"].includes(method) ? "BLOCKED_ENDPOINT" : "BLOCKED_METHOD", url, method, type);
            await send("Fetch.failRequest", { requestId: event.requestId, errorReason: "BlockedByClient" }); return;
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
          this.requests.push({ outcome: "ADMITTED", origin: url.origin, pathname: url.pathname, method, resourceType: type, queryKeys: [...new Set(url.searchParams.keys())].sort(), ...(corsPreflight ? { corsPreflight } : {}) });
          const timer = setTimeout(() => {
            this.redirectTimers.delete(timer);
            this.blocked("READ_TIMEOUT", url, method, type);
            void send("Fetch.failRequest", { requestId: event.requestId, errorReason: "TimedOut" }).catch(() => {});
          }, Math.max(1, this.requestTimeoutMs - (Date.now() - chain.started)));
          timer.unref(); this.redirectTimers.add(timer); redirected.set(event.requestId, { url, method, type, timer });
          await send("Fetch.continueRequest", { requestId: event.requestId, interceptResponse: true });
        };
        void process().catch(async () => { this.blocked("READ_REQUEST_FAILED", new URL(event.request.url), event.request.method, String(event.resourceType).toLowerCase()); await send("Fetch.failRequest", { requestId: event.requestId, errorReason: "Failed" }).catch(() => {}); });
      });
      await send("Network.enable");
      await send("Fetch.enable", { patterns: [{ urlPattern: "*", requestStage: "Request" }] });
      await send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: false });
    };
    await configure(session.send.bind(session), (method, handler) => { session.on(method as any, handler); });
  }

  private async admitsPreflight(url: URL, request: Pick<Request, "headerValue" | "postData">, type: string, facts?: BrowserReadCorsPreflightObservation): Promise<boolean> {
    if (this.prohibitedRead(url) || url.username || url.password || !/^https?:$/.test(url.protocol) || !["other", "fetch", "xhr"].includes(type)
      || !facts || facts.secFetchMode !== "cors" || facts.requestedMethod !== "GET" || facts.bodyBytes !== 0) return false;
    for (const rule of [...this.policy.staticResources, ...this.policy.dynamicReads]) {
      const cors = rule.corsPreflight;
      if (!cors || !(rule.methods ?? ["GET", "HEAD"]).includes("GET") || facts.requestOrigin !== cors.requestOrigin
        || facts.requestedHeaderNames.some(name => !name || !cors.requestedHeaderNames.includes(name))) continue;
      // Check the matching GET's full endpoint/query grammar, never invent an
      // OPTIONS-only rule or admit unrelated resource types/origins.
      for (const resource of ["fetch", "xhr"]) if (await allows(rule, request, url, "GET", resource)) return true;
    }
    return false;
  }

  private async admitsRedirectRequest(url: URL, request: Pick<Request, "headerValue" | "postData">, method: string, type: string): Promise<boolean> {
    if (this.prohibitedRead(url) || url.username || url.password || !/^https?:$/.test(url.protocol)) return false;
    const sourceRule = (await Promise.all([...this.policy.staticResources, ...this.policy.dynamicReads].map(rule => allows(rule, request, url, method, type)))).some(Boolean);
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

  private blocked(code: NetworkDiagnosticCode, url: URL, method: string, resourceType: string): void {
    const request = { origin: url.origin, pathname: url.pathname, method, resourceType, queryKeys: [...new Set(url.searchParams.keys())].sort() };
    this.diagnostics.push({ code, ...request });
    this.requests.push({ outcome: code === "BLOCKED_REDIRECT" ? "REDIRECT_BLOCKED" : "BLOCKED", ...request });
  }

  private async handle(route: Route, replay: boolean): Promise<void> {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const type = request.resourceType();
    if (this.prohibitedRead(url)) {
      this.blocked("BLOCKED_ENDPOINT", url, method, type);
      await route.abort("blockedbyclient");
      return;
    }
    const key = requestKey(url.toString());
    const preparedDocument = type === "document" && (method === "GET" || method === "HEAD") && this.documents.delete(key);
    const rules = [...this.policy.staticResources, ...this.policy.dynamicReads];
    const sourceRule = (await Promise.all(rules
      .map(rule => allows(rule, request, url, method, type)))).some(Boolean);
    const document = preparedDocument && (!this.sensitiveGenericRead(url) || sourceRule);
    const genericRead = this.policy.genericPublicRead === true
      && this.genericOrigins.has(url.origin)
      && (method === "GET" || method === "HEAD")
      && ["document", "script", "stylesheet", "font", "image", "media", "xhr", "fetch"].includes(type)
      && !this.sensitiveGenericRead(url);
    if (!document && !sourceRule && !genericRead) {
      const endpointKnown = rules.some(rule => matchesEndpoint(rule, url, type));
      this.blocked(endpointKnown
        ? ((method !== "GET" && method !== "HEAD" && !rules.some(rule => matchesEndpoint(rule, url, type) && (rule.methods ?? ["GET", "HEAD"]).includes(method as "GET" | "HEAD" | "POST"))) ? "BLOCKED_METHOD" : "BLOCKED_FIELDS")
        : "BLOCKED_ENDPOINT", url, method, type);
      await route.abort("blockedbyclient");
      return;
    }
    // HAR routing is installed before this boundary. Falling through only after
    // admission preserves the same policy in replay and lets routeFromHAR abort
    // every missing entry without a route.fetch network escape.
    if (replay) {
      this.requests.push({ outcome: "ADMITTED", origin: url.origin, pathname: url.pathname, method, resourceType: type, queryKeys: [...new Set(url.searchParams.keys())].sort() });
      await route.fallback();
      return;
    }
    try {
      this.requests.push({ outcome: "ADMITTED", origin: url.origin, pathname: url.pathname, method, resourceType: type, queryKeys: [...new Set(url.searchParams.keys())].sort() });
      const response = await route.fetch({ maxRedirects: 0, timeout: this.requestTimeoutMs });
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
      this.blocked(code, url, method, type);
      this.requests[this.requests.length - 1] = { outcome: code === "READ_TIMEOUT" ? "TIMED_OUT" : "FAILED", origin: url.origin, pathname: url.pathname, method, resourceType: type, queryKeys: [...new Set(url.searchParams.keys())].sort() };
      await route.abort("failed");
    }
  }

  /** An explicit source revocation cannot be reopened by a reviewed read rule. */
  private prohibitedRead(url: URL): boolean {
    return isBrowserReadPathProhibited(this.policy, url);
  }

  /** ADR-0036 permits public GET/HEAD exploration, not sensitive endpoint or PII query shapes. */
  private sensitiveGenericRead(url: URL): boolean {
    const path = url.pathname.toLowerCase();
    if(this.policy.dynamicReads.some(rule=>url.origin===rule.origin&&matchesPath(rule,url)
      &&rule.strictQueryKeys?.some(key=>url.searchParams.has(key))))return true;
    // Explicit sensitive segments always win, including below a public
    // calendar namespace. Only the booking/reserve container itself gets the
    // narrow public-query exception below.
    if (/(?:^|\/)(?:login|signin|sign-in|account|checkout|payment|purchase|cancel|delete|confirm)(?:\/|$)/.test(path)) return true;
    // A booking namespace can still expose public calendars and vacancy lists.
    // Keep those read-shaped descendants in Generic GET admission; other
    // booking/reserve descendants remain fail-closed.
    const publicQueryNamespace = /\/(?:booking|reserve)\/(?:calendar|availability|vacancy|status|search|list)(?:\/|$)/.test(path);
    if (!publicQueryNamespace && /(?:^|\/)(?:booking|reserve)(?:\/|$)/.test(path)) return true;
    if ([...url.searchParams.keys()].some(key => /(?:email|e-mail|phone|tel|address|name|password|passcode|token|secret|cookie|api_?key|card|payment|credit)/i.test(key))) return true;
    return [...url.searchParams].some(([key, value]) => /^(?:action|cmd|command|operation)$/i.test(key) && /^(?:cancel|delete|remove|confirm|purchase|pay|book|reserve)$/i.test(value));
  }
}
