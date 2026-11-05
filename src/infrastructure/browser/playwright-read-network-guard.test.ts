import assert from "node:assert/strict";
import { test } from "node:test";

import type { BrowserContext } from "playwright-core";

import type { BrowserReadNetworkPolicy } from "./browser-runtime.js";
import { PlaywrightReadNetworkGuard } from "./playwright-read-network-guard.js";
import { tableCheckPublicReadNetworkPolicy } from "../../integrations/tablecheck/tablecheck-public-query.js";
import { tabelogPublicReadNetworkPolicy } from "../../integrations/tabelog/tabelog-public-query.js";

const policy: BrowserReadNetworkPolicy = {
  documentOrigins: ["https://public.example"],
  staticResources: [{ origin: "https://assets.example", pathnamePrefix: "/public/", resourceTypes: ["script", "stylesheet"] }],
  dynamicReads: [
    { origin: "https://public.example", pathname: "/query", resourceTypes: ["fetch"], queryKeys: ["date", "party"] },
    { origin: "https://public.example", pathname: "/listing", resourceTypes: ["xhr"], queryKeyRules: { required: ["inbound_flag", "rst_id_list[]"], repeatable: ["rst_id_list[]"] } },
    { origin: "https://assets.example", pathnamePrefix: "/release/", resourceTypes: ["script"], queryKeyRules: { required: [], allowedPatterns: ["^rst-v1-[A-Za-z0-9._-]+$"] } },
    { origin: "https://public.example", pathname: "/calendar", resourceTypes: ["fetch"], methods: ["POST"], bodyFields: { locale: "string", num_people: "number", shop_id: "string", start_at: "number" } },
  ],
};

const fakePage = {};
function fakeContext(value: Record<string, unknown>): BrowserContext {
  // These unit ports only test the ordinary route's policy matching. Actual
  // redirects and CDP transport are exercised by the Chromium receiver suite.
  return { pages: () => [fakePage], newCDPSession: async () => ({ on: () => {}, send: async (method: string) => method === "Page.getFrameTree" ? { frameTree: { frame: { id: "fixture-top-frame" } } } : {} }), ...value } as unknown as BrowserContext;
}

function fakeRoute(input: { url: string; method?: string; type?: string; status?: number; contentType?: string; body?: string; fetchError?: Error; fetchDelayMs?: number; responseBody?: Uint8Array; responseHeaders?: Record<string, string> }) {
  const calls: string[] = [];
  const route = {
    request: () => ({ frame: () => ({ page: () => fakePage }), url: () => input.url, method: () => input.method ?? "GET", resourceType: () => input.type ?? "document", headerValue: async () => input.contentType ?? null, postData: () => input.body ?? null }),
    fetch: async (options: { maxRedirects: number; timeout: number }) => {
      calls.push(`fetch:${options.maxRedirects}:${options.timeout}`);
      if (input.fetchDelayMs !== undefined) {
        const elapsed = Math.min(input.fetchDelayMs, options.timeout);
        await new Promise<void>(resolve => setTimeout(resolve, elapsed));
        if (input.fetchDelayMs > options.timeout) throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
      }
      if (input.fetchError) throw input.fetchError;
      return { status: () => input.status ?? 200, body: async () => input.responseBody ?? new Uint8Array(), headers: () => input.responseHeaders ?? {} };
    },
    fulfill: async () => { calls.push("fulfill"); },
    abort: async () => { calls.push("abort"); },
    fallback: async () => { calls.push("fallback"); },
  };
  return { route, calls };
}

test("read network guard preserves the Executor source-read deadline beyond the action cap", async t => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard(policy);
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });
  const awaitFetch = async (calls: string[]) => {
    for (let turn = 0; turn < 50 && !calls.some(call => call.startsWith("fetch:")); turn++) await Promise.resolve();
    assert.ok(calls.some(call => call.startsWith("fetch:")), "the fake transport must start before advancing its clock");
  };
  guard.prepareNavigation("https://public.example/guide", 8_000);
  const document = fakeRoute({ url: "https://public.example/guide", type: "document" });
  await http(document.route);
  const delayedPublicScript = fakeRoute({ url: "https://assets.example/public/calendar.js", type: "script", fetchDelayMs: 6_000 });
  const startedAt = Date.now();
  const pending = http(delayedPublicScript.route);
  await awaitFetch(delayedPublicScript.calls);
  t.mock.timers.tick(6_000);
  await pending;
  assert.ok(Date.now() - startedAt >= 5_900, "the controlled public read clock advanced beyond the 5s action cap");
  assert.deepEqual(delayedPublicScript.calls, ["fetch:0:8000", "fulfill"]);

  let shortHttp: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const shortDeadline = new PlaywrightReadNetworkGuard(policy);
  await shortDeadline.install(fakeContext({ route: async (_pattern: string, handler: typeof shortHttp) => { shortHttp = handler; }, routeWebSocket: async () => {} }));
  shortDeadline.prepareNavigation("https://public.example/guide", 100);
  const shortDocument = fakeRoute({ url: "https://public.example/guide", type: "document" });
  await shortHttp(shortDocument.route);
  const exceeded = fakeRoute({ url: "https://assets.example/public/calendar.js", type: "script", fetchDelayMs: 250 });
  const expired = shortHttp(exceeded.route);
  await awaitFetch(exceeded.calls);
  t.mock.timers.tick(100);
  await expired;
  assert.deepEqual(exceeded.calls, ["fetch:0:100", "abort"]);
  assert.deepEqual(shortDeadline.snapshotDiagnostics().map(item => item.code), ["READ_TIMEOUT"]);
});

test("read network guard admits only prepared public documents and exact source read rules", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  let webSocket: (socket: { close(): void }) => void = () => assert.fail("websocket handler missing");
  const guard = new PlaywrightReadNetworkGuard(policy);
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async (_pattern: string, handler: typeof webSocket) => { webSocket = handler; } }));

  guard.prepareNavigation("https://public.example/guide", 700);
  const document = fakeRoute({ url: "https://public.example/guide", type: "document" });
  await http(document.route);
  assert.deepEqual(document.calls, ["fetch:0:700", "fulfill"]);
  const repeatedDocument = fakeRoute({ url: "https://public.example/guide", type: "document" });
  await http(repeatedDocument.route);
  assert.deepEqual(repeatedDocument.calls, ["abort"], "a document admission is consumed after one navigation");

  const dynamic = fakeRoute({ url: "https://public.example/query?party=2&date=2026-10-08", type: "fetch" });
  await http(dynamic.route);
  assert.deepEqual(dynamic.calls, ["fetch:0:700", "fulfill"]);
  guard.prepareObservedNavigation("https://official.example/menu", 650);
  const observedOfficialDocument = fakeRoute({ url: "https://official.example/menu", type: "document" });
  await http(observedOfficialDocument.route);
  assert.deepEqual(observedOfficialDocument.calls, ["fetch:0:650", "fulfill"]);
  const unpreparedOfficialDocument = fakeRoute({ url: "https://official.example/menu", type: "document" });
  await http(unpreparedOfficialDocument.route);
  assert.deepEqual(unpreparedOfficialDocument.calls, ["abort"], "an external page needs a fresh Executor-observed admission");
  const repeatedPublicIds = fakeRoute({ url: "https://public.example/listing?inbound_flag=1&rst_id_list%5B%5D=one&rst_id_list%5B%5D=two", type: "xhr" });
  await http(repeatedPublicIds.route);
  assert.deepEqual(repeatedPublicIds.calls, ["fetch:0:650", "fulfill"]);
  const extraListingField = fakeRoute({ url: "https://public.example/listing?inbound_flag=1&rst_id_list%5B%5D=one&unexpected=1", type: "xhr" });
  await http(extraListingField.route);
  assert.deepEqual(extraListingField.calls, ["abort"]);
  const releaseAsset = fakeRoute({ url: "https://assets.example/release/app.js?rst-v1-202610061514-c97bceb", type: "script" });
  await http(releaseAsset.route);
  assert.deepEqual(releaseAsset.calls, ["fetch:0:650", "fulfill"]);

  const unknownGet = fakeRoute({ url: "https://public.example/account", type: "fetch" });
  await http(unknownGet.route);
  assert.deepEqual(unknownGet.calls, ["abort"]);
  const dynamicChild = fakeRoute({ url: "https://public.example/query/cancel?party=2&date=2026-10-08", type: "fetch" });
  await http(dynamicChild.route);
  assert.deepEqual(dynamicChild.calls, ["abort"], "a dynamic endpoint does not inherit a prefix admission");
  const post = fakeRoute({ url: "https://public.example/query?party=2&date=2026-10-08", method: "POST", type: "fetch" });
  await http(post.route);
  assert.deepEqual(post.calls, ["abort"]);
  const calendar = fakeRoute({ url: "https://public.example/calendar", method: "POST", type: "fetch", contentType: "application/json", body: '{"locale":"en","start_at":1,"shop_id":"x","num_people":2}' });
  await http(calendar.route);
  assert.deepEqual(calendar.calls, ["fetch:0:650", "fulfill"]);
  const calendarExtra = fakeRoute({ url: "https://public.example/calendar", method: "POST", type: "fetch", contentType: "application/json", body: '{"locale":"en","start_at":1,"shop_id":"x","num_people":2,"unknown":"x"}' });
  await http(calendarExtra.route);
  assert.deepEqual(calendarExtra.calls, ["abort"]);
  const calendarNested = fakeRoute({ url: "https://public.example/calendar", method: "POST", type: "fetch", contentType: "application/json", body: '{"locale":"en","start_at":1,"shop_id":{"unknown":"x"},"num_people":2}' });
  await http(calendarNested.route);
  assert.deepEqual(calendarNested.calls, ["abort"]);
  const calendarArray = fakeRoute({ url: "https://public.example/calendar", method: "POST", type: "fetch", contentType: "application/json", body: '{"locale":"en","start_at":1,"shop_id":"x","num_people":[2]}' });
  await http(calendarArray.route);
  assert.deepEqual(calendarArray.calls, ["abort"]);
  const calendarNull = fakeRoute({ url: "https://public.example/calendar", method: "POST", type: "fetch", contentType: "application/json", body: '{"locale":"en","start_at":1,"shop_id":null,"num_people":2}' });
  await http(calendarNull.route);
  assert.deepEqual(calendarNull.calls, ["abort"]);
  guard.prepareNavigation("https://public.example/guide");
  const redirect = fakeRoute({ url: "https://public.example/guide", type: "document", status: 302 });
  await http(redirect.route);
  assert.deepEqual(redirect.calls, ["fetch:0:650", "abort"]);
  const failedRead = fakeRoute({ url: "https://public.example/query?party=2&date=2026-10-08", type: "fetch", fetchError: new Error("socket closed") });
  await http(failedRead.route);
  assert.deepEqual(failedRead.calls, ["fetch:0:650", "abort"]);
  const timeoutRead = fakeRoute({ url: "https://public.example/query?party=2&date=2026-10-08", type: "fetch", fetchError: Object.assign(new Error("timed out"), { name: "TimeoutError" }) });
  await http(timeoutRead.route);
  assert.deepEqual(timeoutRead.calls, ["fetch:0:650", "abort"]);
  assert.deepEqual(guard.snapshotDiagnostics().map(({ code, origin, pathname }) => ({ code, origin, pathname })), [
    { code: "BLOCKED_ENDPOINT", origin: "https://public.example", pathname: "/guide" },
    { code: "BLOCKED_ENDPOINT", origin: "https://official.example", pathname: "/menu" },
    { code: "BLOCKED_FIELDS", origin: "https://public.example", pathname: "/listing" },
    { code: "BLOCKED_ENDPOINT", origin: "https://public.example", pathname: "/account" },
    { code: "BLOCKED_ENDPOINT", origin: "https://public.example", pathname: "/query/cancel" },
    { code: "BLOCKED_METHOD", origin: "https://public.example", pathname: "/query" },
    { code: "BLOCKED_FIELDS", origin: "https://public.example", pathname: "/calendar" },
    { code: "BLOCKED_FIELDS", origin: "https://public.example", pathname: "/calendar" },
    { code: "BLOCKED_FIELDS", origin: "https://public.example", pathname: "/calendar" },
    { code: "BLOCKED_FIELDS", origin: "https://public.example", pathname: "/calendar" },
    { code: "BLOCKED_REDIRECT", origin: "https://public.example", pathname: "/guide" },
    { code: "READ_REQUEST_FAILED", origin: "https://public.example", pathname: "/query" },
    { code: "READ_TIMEOUT", origin: "https://public.example", pathname: "/query" },
  ]);
  let socketClosed = false;
  webSocket({ close: () => { socketClosed = true; } });
  assert.equal(socketClosed, true);
});

test("ordinary route records the initial redirect and rejects its unadmitted immediate target; Chromium owns hop coverage", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const recorded: Array<{ url: string; status: number; redirectLocation?: string }> = [];
  const guard = new PlaywrightReadNetworkGuard({ ...policy, genericPublicRead: true }, 5_000, response => {
    recorded.push({ url: response.url, status: response.status,
      ...(response.redirectLocation ? { redirectLocation: response.redirectLocation } : {}) });
  });
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));

  guard.prepareNavigation("https://public.example/guide", 700);
  const sameOrigin = fakeRoute({ url: "https://public.example/guide", type: "document", status: 301, responseHeaders: { location: "/public-index" } });
  await http(sameOrigin.route);
  assert.deepEqual(sameOrigin.calls, ["fetch:0:700", "fulfill"]);
  assert.deepEqual(recorded, [{ url: "https://public.example/guide", status: 301, redirectLocation: "https://public.example/public-index" }]);

  guard.prepareNavigation("https://public.example/guide", 700);
  const crossOrigin = fakeRoute({ url: "https://public.example/guide", type: "document", status: 302, responseHeaders: { location: "https://other.example/public-index" } });
  await http(crossOrigin.route);
  assert.deepEqual(crossOrigin.calls, ["fetch:0:700", "abort"]);
  guard.prepareNavigation("https://public.example/guide", 700);
  const sensitive = fakeRoute({ url: "https://public.example/guide", type: "document", status: 302, responseHeaders: { location: "/booking/calendar/cancel" } });
  await http(sensitive.route);
  assert.deepEqual(sensitive.calls, ["fetch:0:700", "abort"]);
  assert.deepEqual(guard.snapshotDiagnostics().map(item => item.code), ["BLOCKED_REDIRECT", "BLOCKED_REDIRECT"]);
});

test("ADR-0036 permits prepared same-origin public GET reads but keeps sensitive and cross-origin reads outside the boundary", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard({ ...policy, genericPublicRead: true });
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  guard.prepareNavigation("https://public.example/guide", 700);
  const document = fakeRoute({ url: "https://public.example/guide", type: "document" });
  await http(document.route);
  const publicRead = fakeRoute({ url: "https://public.example/public-menu?section=dinner", type: "fetch" });
  await http(publicRead.route);
  assert.deepEqual(publicRead.calls, ["fetch:0:700", "fulfill"]);
  const publicSearchDocument = fakeRoute({ url: "https://public.example/search?query=omakase", type: "document" });
  await http(publicSearchDocument.route);
  assert.deepEqual(publicSearchDocument.calls, ["fetch:0:700", "fulfill"], "a guarded public GET form navigation is a same-origin document read");
  const sensitivePath = fakeRoute({ url: "https://public.example/account", type: "fetch" });
  const sensitiveQuery = fakeRoute({ url: "https://public.example/public-menu?email=guest@example.test", type: "fetch" });
  const crossOrigin = fakeRoute({ url: "https://other.example/public-menu", type: "fetch" });
  await http(sensitivePath.route);
  await http(sensitiveQuery.route);
  await http(crossOrigin.route);
  assert.deepEqual(sensitivePath.calls, ["abort"]);
  assert.deepEqual(sensitiveQuery.calls, ["abort"]);
  assert.deepEqual(crossOrigin.calls, ["abort"]);
  assert.deepEqual(guard.snapshotDiagnostics().map(item => item.code), ["BLOCKED_ENDPOINT", "BLOCKED_ENDPOINT", "BLOCKED_ENDPOINT"]);
});

test("replay applies the same admission before falling through to a HAR and never route-fetches", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard({ ...policy, genericPublicRead: true });
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }), { replay: true });
  guard.prepareNavigation("https://public.example/guide", 700);
  const document = fakeRoute({ url: "https://public.example/guide", type: "document" });
  const read = fakeRoute({ url: "https://public.example/public-menu", type: "fetch" });
  const forbidden = fakeRoute({ url: "https://public.example/account", type: "fetch" });
  await http(document.route);
  await http(read.route);
  await http(forbidden.route);
  assert.deepEqual(document.calls, ["fallback"]);
  assert.deepEqual(read.calls, ["fallback"]);
  assert.deepEqual(forbidden.calls, ["abort"]);
});

test("TableCheck calendar admission requires the captured four-string public schema", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard(tableCheckPublicReadNetworkPolicy);
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  const accepted = fakeRoute({
    url: "https://production.tablecheck.com/v2/hub/availability_calendar_v2", method: "POST", type: "fetch", contentType: "application/json",
    body: '{"locale":"en","start_at":"1791367200","shop_id":"public-shop","num_people":"2"}',
  });
  await http(accepted.route);
  assert.deepEqual(accepted.calls, ["fetch:0:5000", "fulfill"]);
  const wrongPrimitive = fakeRoute({
    url: "https://production.tablecheck.com/v2/hub/availability_calendar_v2", method: "POST", type: "fetch", contentType: "application/json",
    body: '{"locale":"en","start_at":1791367200,"shop_id":"public-shop","num_people":"2"}',
  });
  await http(wrongPrimitive.route);
  assert.deepEqual(wrongPrimitive.calls, ["abort"]);
  assert.deepEqual(guard.snapshotDiagnostics().map((item) => item.code), ["BLOCKED_FIELDS"]);
});

test("Tabelog calendar reads admit only the captured public GET grammars", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard(tabelogPublicReadNetworkPolicy);
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  const accepted = fakeRoute({
    url: "https://tabelog.com/en/booking/calendar/initial_vacancy?exclude_unavailable_time=true&rst_id=public-outlet",
    type: "fetch",
  });
  await http(accepted.route);
  assert.deepEqual(accepted.calls, ["fetch:0:5000", "fulfill"]);
  const dateStatus = fakeRoute({
    url: "https://tabelog.com/en/booking/calendar/find_vacancy_date_with_status/?rst_id=public-outlet&seat_only=false",
    type: "xhr",
  });
  const members = fakeRoute({
    url: "https://tabelog.com/en/booking/calendar/find_vacancy_member_by_date/?rst_id=public-outlet&svd=20261008&plan_id=public-plan",
    type: "xhr",
  });
  const vacancy = fakeRoute({
    url: "https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=public-outlet&svd=20261008&svps=2&svt=1900&exclude_unavailable_time=true",
    type: "xhr",
  });
  await http(dateStatus.route);
  await http(members.route);
  await http(vacancy.route);
  assert.deepEqual(dateStatus.calls, ["fetch:0:5000", "fulfill"]);
  assert.deepEqual(members.calls, ["fetch:0:5000", "fulfill"]);
  assert.deepEqual(vacancy.calls, ["fetch:0:5000", "fulfill"]);
  const missingField = fakeRoute({
    url: "https://tabelog.com/en/booking/calendar/find_vacancy_member_by_date/?rst_id=public-outlet",
    type: "xhr",
  });
  await http(missingField.route);
  const extraField = fakeRoute({
    url: "https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=public-outlet&svd=20261008&svps=2&unexpected=1",
    type: "xhr",
  });
  await http(extraField.route);
  const repeatedField = fakeRoute({
    url: "https://tabelog.com/en/booking/calendar/initial_vacancy?rst_id=public-outlet&rst_id=other",
    type: "fetch",
  });
  await http(repeatedField.route);
  assert.deepEqual(missingField.calls, ["abort"]);
  assert.deepEqual(extraField.calls, ["abort"]);
  assert.deepEqual(repeatedField.calls, ["abort"]);
  assert.deepEqual(guard.snapshotDiagnostics().map(item => item.code), ["BLOCKED_FIELDS", "BLOCKED_FIELDS", "BLOCKED_FIELDS"]);
});

test("TableCheck search prerequisites admit only the observed geolocation and autocomplete grammars", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard(tableCheckPublicReadNetworkPolicy);
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  const geolocation = fakeRoute({ url: "https://production.tablecheck.com/v2/geolocation", type: "fetch" });
  await http(geolocation.route);
  assert.deepEqual(geolocation.calls, ["fetch:0:5000", "fulfill"]);
  const autocomplete = fakeRoute({ url: "https://production.tablecheck.com/v2/autocomplete?locale=en&shop_universe_id=jp&text=omakase", type: "fetch" });
  await http(autocomplete.route);
  assert.deepEqual(autocomplete.calls, ["fetch:0:5000", "fulfill"]);
  const incompleteAutocomplete = fakeRoute({ url: "https://production.tablecheck.com/v2/autocomplete?locale=en&text=omakase", type: "fetch" });
  await http(incompleteAutocomplete.route);
  const sourceSearch = fakeRoute({ url: "https://search-api.ai.ingress.production.tablecheck.com/ai_search?service_mode=dining&sort_by=relevance&venue_type=tc&search_text=omakase&geo_latitude=35.658&geo_longitude=139.701&geo_distance=5km&auto_geolocate=false&shop_universe_id=jp&include_ids=one&cuisines%5B%5D=sushi&search_after=next", type: "fetch" });
  await http(sourceSearch.route);
  const multipleCuisineSearch = fakeRoute({ url: "https://search-api.ai.ingress.production.tablecheck.com/ai_search?shop_universe_id=jp&include_ids=one&cuisines%5B%5D=sushi&cuisines%5B%5D=kaiseki&budget_dinner_avg_min=4&budget_dinner_avg_max=10", type: "fetch" });
  await http(multipleCuisineSearch.route);
  const partialSourceSearch = fakeRoute({ url: "https://search-api.ai.ingress.production.tablecheck.com/ai_search?shop_universe_id=jp&include_ids=one", type: "fetch" });
  await http(partialSourceSearch.route);
  const sourceShopSearch = fakeRoute({ url: "https://production.tablecheck.com/v2/shop_search?shop_universe_id=jp&include_ids=one&search_text=omakase", type: "fetch" });
  await http(sourceShopSearch.route);
  const unreviewedSearch = fakeRoute({ url: "https://search-api.ai.ingress.production.tablecheck.com/ai_search?service_mode=dining&sort_by=relevance&venue_type=tc&search_text=omakase&geo_latitude=35.658&geo_longitude=139.701&geo_distance=5km&auto_geolocate=false&unknown=value", type: "fetch" });
  await http(unreviewedSearch.route);
  assert.deepEqual(incompleteAutocomplete.calls, ["abort"]);
  assert.deepEqual(sourceSearch.calls, ["fetch:0:5000", "fulfill"]);
  assert.deepEqual(multipleCuisineSearch.calls, ["fetch:0:5000", "fulfill"], "observed cuisine multi-select and budget query fields remain read-only grammar");
  assert.deepEqual(partialSourceSearch.calls, ["fetch:0:5000", "fulfill"], "the public source conditionally omits builder fields");
  assert.deepEqual(sourceShopSearch.calls, ["fetch:0:5000", "fulfill"], "the public non-AI search shares the reviewed grammar");
  assert.deepEqual(unreviewedSearch.calls, ["abort"]);
  assert.deepEqual(guard.snapshotDiagnostics().map(item => item.code), ["BLOCKED_FIELDS", "BLOCKED_FIELDS"]);
});

test("TableCheck public list continuation admits its observed GET grammar only", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard(tableCheckPublicReadNetworkPolicy);
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  const publicLists = fakeRoute({
    url: "https://production.tablecheck.com/v2/hub/public_shop_lists?limit=8&sort_by=score&shop_ids%5B%5D=one&shop_ids%5B%5D=two&shop_ids%5B%5D=three",
    type: "fetch",
  });
  await http(publicLists.route);
  assert.deepEqual(publicLists.calls, ["fetch:0:5000", "fulfill"]);

  const missingSort = fakeRoute({
    url: "https://production.tablecheck.com/v2/hub/public_shop_lists?limit=8&shop_ids%5B%5D=one",
    type: "fetch",
  });
  const repeatedLimit = fakeRoute({
    url: "https://production.tablecheck.com/v2/hub/public_shop_lists?limit=8&limit=9&sort_by=score",
    type: "fetch",
  });
  const extra = fakeRoute({
    url: "https://production.tablecheck.com/v2/hub/public_shop_lists?limit=8&sort_by=score&follow=true",
    type: "fetch",
  });
  await http(missingSort.route);
  await http(repeatedLimit.route);
  await http(extra.route);
  assert.deepEqual(missingSort.calls, ["abort"]);
  assert.deepEqual(repeatedLimit.calls, ["abort"]);
  assert.deepEqual(extra.calls, ["abort"]);
  assert.deepEqual(guard.snapshotDiagnostics().map(item => item.code), ["BLOCKED_FIELDS", "BLOCKED_FIELDS", "BLOCKED_FIELDS"]);
});

test("prepared documents cannot bypass credential, sensitive-path, or sensitive-query admission", () => {
  const guard = new PlaywrightReadNetworkGuard({ ...policy, genericPublicRead: true });
  assert.throws(() => guard.prepareNavigation("https://user:pass@public.example/guide"), /credentials/);
  assert.throws(() => guard.prepareNavigation("https://public.example/cancel?date=2026-10-08"), /sensitive/);
  assert.throws(() => guard.prepareObservedNavigation("https://public.example/guide?token=opaque"), /sensitive/);
});

test("generic public reads block explicit destructive query values but keep an exact reviewed public query document", () => {
  const reviewed: BrowserReadNetworkPolicy = { ...policy, genericPublicRead: true, dynamicReads: [...policy.dynamicReads, { origin: "https://public.example", pathname: "/reserve/public-query", resourceTypes: ["fetch"], queryKeys: ["date", "party"] }] };
  const guard = new PlaywrightReadNetworkGuard(reviewed);
  assert.throws(() => guard.prepareNavigation("https://public.example/public/operation?action=cancel"), /sensitive/);
  guard.prepareNavigation("https://public.example/reserve/public-query?date=2026-10-08&party=2");
});

test("generic public GET admits a calendar query namespace but not a booking action", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const genericTabelog: BrowserReadNetworkPolicy = {
    documentOrigins: ["https://tabelog.example"], staticResources: [], dynamicReads: [], genericPublicRead: true,
  };
  const guard = new PlaywrightReadNetworkGuard(genericTabelog);
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  guard.prepareNavigation("https://tabelog.example/en/fixture");
  const document = fakeRoute({ url: "https://tabelog.example/en/fixture", type: "document" });
  const calendar = fakeRoute({ url: "https://tabelog.example/en/booking/calendar/initial_vacancy?exclude_unavailable_time=true&rst_id=public-outlet", type: "fetch" });
  const action = fakeRoute({ url: "https://tabelog.example/en/booking/confirm?rst_id=public-outlet", type: "fetch" });
  const nestedCancel = fakeRoute({ url: "https://tabelog.example/en/booking/calendar/cancel?rst_id=public-outlet", type: "fetch" });
  const nestedConfirm = fakeRoute({ url: "https://tabelog.example/en/booking/calendar/confirm?rst_id=public-outlet", type: "fetch" });
  const accountPrefix = fakeRoute({ url: "https://tabelog.example/en/account/booking/calendar/initial_vacancy?rst_id=public-outlet", type: "fetch" });
  const destructiveQuery = fakeRoute({ url: "https://tabelog.example/en/booking/calendar/initial_vacancy?action=cancel&rst_id=public-outlet", type: "fetch" });
  await http(document.route);
  await http(calendar.route);
  await http(action.route);
  await http(nestedCancel.route);
  await http(nestedConfirm.route);
  await http(accountPrefix.route);
  await http(destructiveQuery.route);
  assert.deepEqual(calendar.calls, ["fetch:0:5000", "fulfill"]);
  assert.deepEqual(action.calls, ["abort"]);
  assert.deepEqual(nestedCancel.calls, ["abort"]);
  assert.deepEqual(nestedConfirm.calls, ["abort"]);
  assert.deepEqual(accountPrefix.calls, ["abort"]);
  assert.deepEqual(destructiveQuery.calls, ["abort"]);
  assert.deepEqual(guard.snapshotDiagnostics().map(item => item.code), ["BLOCKED_ENDPOINT", "BLOCKED_ENDPOINT", "BLOCKED_ENDPOINT", "BLOCKED_ENDPOINT", "BLOCKED_ENDPOINT"]);
});


test("guard supplies an admitted response to the in-memory recorder before fulfilling it", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const captured: Array<{ url: string; method: string; contentType: string; body: Uint8Array }> = [];
  const guard = new PlaywrightReadNetworkGuard(policy, 5_000, response => { captured.push(response); });
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  const response = fakeRoute({ url: "https://public.example/query?date=2026-10-08&party=2", type: "fetch", responseHeaders: { "content-type": "application/json" }, responseBody: new TextEncoder().encode('{"available":true}') });
  await http(response.route);
  assert.deepEqual(response.calls, ["fetch:0:5000", "fulfill"]);
  assert.equal(captured.length, 1); assert.equal(captured[0]!.contentType, "application/json");
});


test("TableCheck permanently rejects reserve documents and descendants, even with a reviewed rule", async () => {
  const { tableCheckRequestedReservationUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const generated = tableCheckRequestedReservationUrl({ kind: "LINKED_PAGE", url: "https://www.tablecheck.com/en/shops/fixture-shop/reserve" }, "2026-10-22", 10);
  const guard = new PlaywrightReadNetworkGuard({ ...tableCheckPublicReadNetworkPolicy, dynamicReads: [
    ...tableCheckPublicReadNetworkPolicy.dynamicReads,
    { origin: "https://www.tablecheck.com", pathnamePrefix: "/en/shops/", resourceTypes: ["document", "fetch"], methods: ["GET", "HEAD"],
      queryKeyRules: { required: [], allowed: ["start_date", "pax"] } },
  ] });
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  assert.throws(() => guard.prepareNavigation(generated), /prohibited/);
  assert.throws(() => guard.prepareObservedNavigation(generated), /prohibited/);
  const rejected = [
    { url: generated },
    { url: generated, method: "POST" },
    { url: generated, method: "HEAD" },
    { url: generated, type: "fetch" },
    { url: generated + "&start_time=19:00" },
    { url: generated + "&pax=2" },
    { url: generated.split("?")[0]! },
    { url: generated.replace("/reserve?", "/reserve/next?") },
    { url: generated.replace("/reserve?", "/reserve/confirm?") },
    { url: generated.replace("/reserve?", "/reserve/calendar?") },
    { url: generated.replace("/reserve?", "/%72eserve?") },
    { url: generated.replace("fixture-shop", "confirm") },
    { url: generated.replace("fixture-shop", "login") },
    { url: generated.replace("www.tablecheck.com", "other.example") },
  ];
  for (const shape of rejected) {
    const request = fakeRoute({ type: "document", ...shape });
    await http(request.route); assert.deepEqual(request.calls, ["abort"], JSON.stringify(shape));
    if (!shape.method && !shape.type) assert.throws(() => guard.prepareNavigation(shape.url));
  }
  const publicGuide = "https://www.tablecheck.com/en/fixture-shop";
  guard.prepareNavigation(publicGuide);
  const document = fakeRoute({ url: publicGuide, type: "document" });
  await http(document.route); assert.deepEqual(document.calls, ["fetch:0:5000", "fulfill"]);
  guard.prepareNavigation(publicGuide);
  const redirect = fakeRoute({ url: publicGuide, status: 302, responseHeaders: { location: "/en/shops/fixture-shop/reserve?start_date=2026-10-22&pax=10" } });
  await http(redirect.route); assert.deepEqual(redirect.calls, ["fetch:0:5000", "abort"]);
});

for (const retain of [false, true]) test(`TableCheck CDN admission and declarative retention remain separate (${retain})`, async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard({...tableCheckPublicReadNetworkPolicy, retainedResources: retain ? tableCheckPublicReadNetworkPolicy.staticResources : []});
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  for (let cdn = 0; cdn <= 3; cdn++) {
    for (const type of ["script", "stylesheet", "font", "image"]) {
      const url = `https://cdn${cdn}.tablecheck.com/assets/table_check/public-file`;
      const allowed = fakeRoute({ url, type });
      await http(allowed.route);
      assert.deepEqual(allowed.calls, !retain && ["font", "image"].includes(type) ? ["abort"] : ["fetch:0:5000", "fulfill"], `${cdn}/${type}`);
      for (const shape of [{ url, method: "POST" }, { url: url.replace("table_check/", "private/") }, { url, type: "fetch" }]) {
        const denied = fakeRoute({ type, ...shape });
        await http(denied.route); assert.deepEqual(denied.calls, ["abort"]);
      }
    }
  }
  for (const url of ["https://www.googletagmanager.com/gtm.js?id=public", "https://browser.sentry-cdn.com/bundle.min.js", "https://cdn4.tablecheck.com/assets/table_check/app.js"]) {
    const denied = fakeRoute({ url, type: "script" });
    await http(denied.route); assert.deepEqual(denied.calls, ["abort"]);
  }
});


test("C3b settlement counts only short data requests and diagnoses all outstanding types", async () => {
  const listeners: Record<string, (request: any) => void> = {};
  const guard = new PlaywrightReadNetworkGuard(policy);
  await guard.install(fakeContext({ on: (event: string, fn: (request: any) => void) => { listeners[event] = fn; }, route: async () => {}, routeWebSocket: async () => {} }));
  const requests = ["document", "xhr", "fetch", "image", "stylesheet", "font", "media", "ping"].map(type => ({ resourceType: () => type }));
  const original = Date.now; let now = original();
  Date.now = () => now;
  try {
    requests.forEach(request => listeners.request!(request));
    assert.equal(guard.settlementActivity().pending, 3);
    requests.slice(0, 3).forEach(request => listeners.requestfinished!(request));
    assert.equal(guard.settlementActivity().pending, 0, "unfinished image/beacon cannot block data readiness");
    listeners.request!(requests[2]); now += 3_001;
    assert.equal(guard.settlementActivity().pending, 0, "long connection is diagnosed without blocking");
    assert.equal(guard.settlementActivity().pendingByType.fetch, 1);
    assert.equal(guard.settlementActivity().oldestPendingMs, 3_001);
  } finally { Date.now = original; }
});

test("default resource suppression blocks admitted images media fonts without suppressing CSS scripts or data", async () => {
 let http:(route:any)=>Promise<void>=async()=>assert.fail('handler');
 const guard=new PlaywrightReadNetworkGuard({...policy,genericPublicRead:true});
 await guard.install(fakeContext({route:async(_p:string,h:typeof http)=>{http=h},routeWebSocket:async()=>{}}));
 guard.prepareNavigation('https://public.example/guide');
 for(const type of ['image','media','font']){
  const r=fakeRoute({url:`https://public.example/${type}`,type});await http(r.route);
  assert.deepEqual(r.calls,['abort'],type);
  assert.equal(guard.snapshotRequests().at(-1)?.outcome,'BLOCKED');
 }
 for(const type of ['script','stylesheet','xhr','fetch']){const r=fakeRoute({url:`https://public.example/${type}`,type});await http(r.route);assert.ok(r.calls.some(c=>c.startsWith('fetch:')),type);}
});

test('resource retention cannot authorize an unreviewed origin or prohibited path',async()=>{
 let http:(route:any)=>Promise<void>=async()=>assert.fail('missing route');
 const guard=new PlaywrightReadNetworkGuard({...policy,genericPublicRead:true,prohibitedPaths:[{hostname:'public.example',pathSegment:'private'}],retainedResources:[
  {origin:'https://other.example',pathnamePrefix:'/',resourceTypes:['image']},
  {origin:'https://public.example',pathnamePrefix:'/',resourceTypes:['image']},
 ]});
 await guard.install(fakeContext({route:async(_p:string,h:typeof http)=>{http=h},routeWebSocket:async()=>{}}));guard.prepareNavigation('https://public.example/');
 for(const url of ['https://other.example/picture','https://public.example/private/picture']){
  const r=fakeRoute({url,type:'image'});await http(r.route);assert.deepEqual(r.calls,['abort']);
 }
 assert.ok(guard.snapshotDiagnostics().every(d=>d.code==='BLOCKED_ENDPOINT'));
});

test("read transport diagnostics retain failure cause without query values, headers or body", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard(policy);
  await guard.install(fakeContext({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} }));
  guard.prepareNavigation("https://public.example/guide?public=QUERY_PRIVATE", 20000);
  const cause = Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });
  const failure = new Error("apiRequestContext.fetch: socket hang up https://public.example/guide?public=QUERY_PRIVATE\nCall log:\nCookie: COOKIE_PRIVATE\nAuthorization: Bearer AUTH_PRIVATE\nbody: BODY_PRIVATE", { cause });
  await http(fakeRoute({ url: "https://public.example/guide?public=QUERY_PRIVATE", fetchError: failure }).route);
  const diagnostic = guard.snapshotDiagnostics()[0] as any;
  assert.equal(diagnostic.error?.name, "Error");
  assert.match(diagnostic.error?.message ?? "", /socket hang up/);
  assert.equal(diagnostic.error?.cause?.code, "ECONNRESET");
  assert.equal((guard.snapshotRequests().find(row => row.outcome === "FAILED") as any).error?.cause?.code, "ECONNRESET");
  assert.doesNotMatch(JSON.stringify(guard.snapshotDiagnostics()), /QUERY_PRIVATE|COOKIE_PRIVATE|AUTH_PRIVATE|BODY_PRIVATE/);
});
