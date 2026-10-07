import type { BrowserContext, Request, Route } from "playwright-core";

import type { BrowserReadNetworkPolicy, BrowserReadNetworkRequestRule } from "./browser-runtime.js";

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
  private readonly diagnostics: NetworkDiagnostic[] = [];
  private requestTimeoutMs: number;

  constructor(private readonly policy: BrowserReadNetworkPolicy, requestTimeoutMs = 5_000) { this.requestTimeoutMs = requestTimeoutMs; }

  async install(context: BrowserContext): Promise<void> {
    await context.routeWebSocket("**/*", socket => socket.close());
    await context.route("**/*", route => this.handle(route));
  }

  prepareNavigation(value: string, timeoutMs?: number): void {
    const url = new URL(value);
    if (!this.policy.documentOrigins.includes(url.origin)) throw new Error("Browser read document origin is not source-admitted");
    if (timeoutMs !== undefined) this.requestTimeoutMs = Math.max(1, timeoutMs);
    this.documents.add(requestKey(url.toString()));
  }

  /** Executor has already bound this URL to a fresh observed link and source-owned origin allowlist. */
  prepareObservedNavigation(value: string, timeoutMs?: number): void {
    const url = new URL(value);
    if (!/^https?:$/i.test(url.protocol)) throw new Error("Browser read document protocol is not admitted");
    if (timeoutMs !== undefined) this.requestTimeoutMs = Math.max(1, timeoutMs);
    this.documents.add(requestKey(url.toString()));
  }

  snapshotDiagnostics(): NetworkDiagnostic[] { return [...this.diagnostics]; }

  private blocked(code: NetworkDiagnosticCode, url: URL, method: string, resourceType: string): void {
    this.diagnostics.push({ code, origin: url.origin, pathname: url.pathname, method, resourceType, queryKeys: [...new Set(url.searchParams.keys())].sort() });
  }

  private async handle(route: Route): Promise<void> {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const type = request.resourceType();
    const key = requestKey(url.toString());
    const document = type === "document" && (method === "GET" || method === "HEAD") && this.documents.delete(key);
    const rules = [...this.policy.staticResources, ...this.policy.dynamicReads];
    const sourceRule = (await Promise.all(rules
      .map(rule => allows(rule, request, url, method, type)))).some(Boolean);
    if (!document && !sourceRule) {
      const endpointKnown = rules.some(rule => matchesEndpoint(rule, url, type));
      this.blocked(endpointKnown
        ? ((method !== "GET" && method !== "HEAD" && !rules.some(rule => matchesEndpoint(rule, url, type) && (rule.methods ?? ["GET", "HEAD"]).includes(method as "GET" | "HEAD" | "POST"))) ? "BLOCKED_METHOD" : "BLOCKED_FIELDS")
        : "BLOCKED_ENDPOINT", url, method, type);
      await route.abort("blockedbyclient");
      return;
    }
    try {
      const response = await route.fetch({ maxRedirects: 0, timeout: this.requestTimeoutMs });
      if (response.status() >= 300 && response.status() < 400) { this.blocked("BLOCKED_REDIRECT", url, method, type); await route.abort("blockedbyclient"); return; }
      await route.fulfill({ response });
    } catch (error) {
      this.blocked(error instanceof Error && error.name === "TimeoutError" ? "READ_TIMEOUT" : "READ_REQUEST_FAILED", url, method, type);
      await route.abort("failed");
    }
  }
}
