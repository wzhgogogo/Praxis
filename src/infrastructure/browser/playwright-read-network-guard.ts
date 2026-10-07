import type { BrowserContext, Request, Route } from "playwright-core";

import type { BrowserReadNetworkObservation, BrowserReadNetworkPolicy, BrowserReadNetworkRequestRule } from "./browser-runtime.js";

type NetworkDiagnosticCode = "BLOCKED_ENDPOINT" | "BLOCKED_FIELDS" | "BLOCKED_METHOD" | "BLOCKED_REDIRECT" | "READ_REQUEST_FAILED" | "READ_TIMEOUT";
type NetworkDiagnostic = { code: NetworkDiagnosticCode; origin: string; pathname: string; method: string; resourceType: string; queryKeys: string[] };

function requestKey(value: string): string {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

async function allows(rule: BrowserReadNetworkRequestRule, request: Request, url: URL, method: string, resourceType: string): Promise<boolean> {
  if (url.origin !== rule.origin || (rule.pathname ? url.pathname !== rule.pathname : !rule.pathnamePrefix || !url.pathname.startsWith(rule.pathnamePrefix))) return false;
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
    && (rule.pathname ? url.pathname === rule.pathname : Boolean(rule.pathnamePrefix && url.pathname.startsWith(rule.pathnamePrefix)))
    && rule.resourceTypes.includes(resourceType as never);
}

/**
 * A deliberately small context boundary. Route.fetch with maxRedirects zero is
 * required because Playwright invokes ordinary routes only for the first URL
 * of a redirect chain.
 */
export class PlaywrightReadNetworkGuard {
  private readonly documents = new Set<string>();
  private readonly genericOrigins = new Set<string>();
  private readonly diagnostics: NetworkDiagnostic[] = [];
  private readonly requests: BrowserReadNetworkObservation[] = [];
  private requestTimeoutMs: number;

  constructor(private readonly policy: BrowserReadNetworkPolicy, requestTimeoutMs = 5_000, private readonly recordResponse?: (response: { url: string; method: string; status: number; contentType: string; body: Uint8Array; redirectLocation?: string }) => Promise<void> | void) { this.requestTimeoutMs = requestTimeoutMs; }

  async install(context: BrowserContext, options: { replay?: boolean } = {}): Promise<void> {
    await context.routeWebSocket("**/*", socket => socket.close());
    await context.route("**/*", route => this.handle(route, options.replay === true));
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
    if (!/^https?:$/i.test(url.protocol) || url.username || url.password) throw new Error("Browser read document credentials or protocol are not admitted");
    if (this.sensitiveGenericRead(url) && !this.matchesReviewedDocument(url)) throw new Error("Browser read sensitive document is not admitted");
  }

  /**
   * Route.fetch never follows redirects: every hop is admitted as a new
   * document request.  A target may proceed only when it meets the same
   * prepared-document constraints as an explicit navigation.
   */
  private admittedRedirectTarget(from: URL, location: string | undefined): URL | undefined {
    if (!location) return undefined;
    let target: URL;
    try { target = new URL(location, from); } catch { return undefined; }
    try { this.assertSafePreparedDocument(target); } catch { return undefined; }
    if (!this.policy.documentOrigins.includes(target.origin)
      && !(this.policy.genericPublicRead && this.genericOrigins.has(target.origin))) return undefined;
    return target;
  }

  /** A source rule may explicitly admit an otherwise sensitive-looking public query document. */
  private matchesReviewedDocument(url: URL): boolean {
    return [...this.policy.staticResources, ...this.policy.dynamicReads].some(rule => {
      if (url.origin !== rule.origin || (rule.pathname ? url.pathname !== rule.pathname : !rule.pathnamePrefix || !url.pathname.startsWith(rule.pathnamePrefix))) return false;
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
    const key = requestKey(url.toString());
    const document = type === "document" && (method === "GET" || method === "HEAD") && this.documents.delete(key);
    const rules = [...this.policy.staticResources, ...this.policy.dynamicReads];
    const sourceRule = (await Promise.all(rules
      .map(rule => allows(rule, request, url, method, type)))).some(Boolean);
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
        const target = this.admittedRedirectTarget(url, response.headers()["location"]);
        if (!target) { this.blocked("BLOCKED_REDIRECT", url, method, type); await route.abort("blockedbyclient"); return; }
        // Persist only the already-admitted, credential-free redirect target.
        // Replay then begins at the original prepared document instead of
        // silently replacing it with the final canonical page.
        if (this.recordResponse) {
          const contentType = response.headers()["content-type"] ?? "";
          await this.recordResponse({ url: url.toString(), method, status: response.status(), contentType, body: await response.body(), redirectLocation: target.toString() });
        }
        this.documents.add(requestKey(target.toString()));
        if (this.policy.genericPublicRead) this.genericOrigins.add(target.origin);
        await route.fulfill({ response });
        return;
      }
      if (this.recordResponse) {
        const contentType = response.headers()["content-type"] ?? "";
        await this.recordResponse({ url: url.toString(), method, status: response.status(), contentType, body: await response.body() });
      }
      await route.fulfill({ response });
    } catch (error) {
      const code = error instanceof Error && error.name === "TimeoutError" ? "READ_TIMEOUT" : "READ_REQUEST_FAILED";
      this.blocked(code, url, method, type);
      this.requests[this.requests.length - 1] = { outcome: code === "READ_TIMEOUT" ? "TIMED_OUT" : "FAILED", origin: url.origin, pathname: url.pathname, method, resourceType: type, queryKeys: [...new Set(url.searchParams.keys())].sort() };
      await route.abort("failed");
    }
  }

  /** ADR-0036 permits public GET/HEAD exploration, not sensitive endpoint or PII query shapes. */
  private sensitiveGenericRead(url: URL): boolean {
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
    if ([...url.searchParams.keys()].some(key => /(?:email|e-mail|phone|tel|address|name|password|passcode|token|secret|cookie|api_?key|card|payment|credit)/i.test(key))) return true;
    return [...url.searchParams].some(([key, value]) => /^(?:action|cmd|command|operation)$/i.test(key) && /^(?:cancel|delete|remove|confirm|purchase|pay|book|reserve)$/i.test(value));
  }
}
