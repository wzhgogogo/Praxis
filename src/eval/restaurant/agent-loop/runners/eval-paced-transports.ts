import { chromium, type BrowserContext, type Route } from "playwright-core";
import { discoveryPackNetworkPolicy } from "../../../../integrations/restaurant-search/source-packs.js";
import { GOOGLE_PLACES_DETAILS_URL, GOOGLE_PLACES_NEARBY_SEARCH_URL, GOOGLE_PLACES_TEXT_SEARCH_URL } from "../../../../integrations/google/google-places-contracts.js";
import type { EvalPacingClient } from "./eval-pacing.js";

/** Process-local eval transport decoration; original Guard handlers still admit every request. */
export function installEvalPacingTransports(client: EvalPacingClient, sourceOrigins?: readonly string[]) {
  const policy = discoveryPackNetworkPolicy();
  const origins = new Set(sourceOrigins ?? [...policy.documentOrigins, ...policy.staticResources.map(r => r.origin), ...policy.dynamicReads.map(r => r.origin), ...[GOOGLE_PLACES_DETAILS_URL, GOOGLE_PLACES_NEARBY_SEARCH_URL, GOOGLE_PLACES_TEXT_SEARCH_URL].map(url => new URL(url).origin)]);
  const originalFetch = globalThis.fetch, originalLaunch = chromium.launch;
  globalThis.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    return origins.has(new URL(url).origin) ? client.request(url, () => originalFetch(input, init)) : originalFetch(input, init);
  };
  const decorateContext = (context: BrowserContext) => {
    const route = context.route.bind(context), newCDPSession = context.newCDPSession.bind(context);
    context.route = (url, handler, options) => route(url, async (actual, request) => {
      const wrapped = new Proxy(actual, { get(target, property) {
        if (property === "fetch") return (options: Parameters<Route["fetch"]>[0]) => client.request(request.url(), () => target.fetch(options));
        const value = Reflect.get(target, property);return typeof value === "function" ? value.bind(target) : value;
      } });
      return handler(wrapped, request);
    }, options);
    context.newCDPSession = async page => {
      const session = await newCDPSession(page), send = session.send.bind(session);
      const paused = new Map<string, string>(), leases = new Map<string, () => Promise<void>>();
      const key = (scope: string, requestId: string) => `${scope}:${requestId}`;
      const observe = (method: string, params: any, scope = "") => {
        if (method !== "Fetch.requestPaused") return;
        const id = key(scope, params.requestId);
        if (params.responseStatusCode !== undefined || params.responseErrorReason !== undefined) { const release = leases.get(id);leases.delete(id);if (release) void release().catch(() => {}); }
        else paused.set(id, params.request.url);
      };
      session.on("Fetch.requestPaused", event => observe("Fetch.requestPaused", event));
      session.on("Target.receivedMessageFromTarget", event => { const wire = JSON.parse(event.message);observe(wire.method, wire.params, event.sessionId); });
      const beforeSend = async (method: string, params: any, scope = "") => {
        if (method === "Target.sendMessageToTarget") { const wire = JSON.parse(params.message);await beforeSend(wire.method, wire.params, params.sessionId);return; }
        const id = key(scope, params?.requestId);
        // Ordinary initial requests continue to the Guard's route.fetch. Only
        // admitted native redirects/preflights reach interceptResponse:true.
        if (method === "Fetch.continueRequest" && params?.interceptResponse === true) {
          const url = paused.get(id);if (!url) throw new Error("EVAL_PACING_NATIVE_REQUEST_NOT_OBSERVED");
          leases.set(id, await client.acquire(url));paused.delete(id);
        }
        if (method === "Fetch.failRequest") { const release = leases.get(id);leases.delete(id);if (release) await release(); }
      };
      session.send = (async (method: any, params: any) => { await beforeSend(method, params);return send(method, params); }) as typeof session.send;
      context.once("close", () => { for (const release of leases.values()) void release().catch(() => {});leases.clear();paused.clear(); });
      return session;
    };
    return context;
  };
  chromium.launch = async options => {
    const browser = await originalLaunch.call(chromium, options), newContext = browser.newContext.bind(browser);
    browser.newContext = async options => decorateContext(await newContext(options));return browser;
  };
  return () => { globalThis.fetch = originalFetch;chromium.launch = originalLaunch; };
}
