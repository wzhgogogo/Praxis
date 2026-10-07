import assert from "node:assert/strict";
import { test } from "node:test";

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

function fakeRoute(input: { url: string; method?: string; type?: string; status?: number; contentType?: string; body?: string; fetchError?: Error; fetchDelayMs?: number }) {
  const calls: string[] = [];
  const route = {
    request: () => ({ url: () => input.url, method: () => input.method ?? "GET", resourceType: () => input.type ?? "document", headerValue: async () => input.contentType ?? null, postData: () => input.body ?? null }),
    fetch: async (options: { maxRedirects: number; timeout: number }) => {
      calls.push(`fetch:${options.maxRedirects}:${options.timeout}`);
      if (input.fetchDelayMs !== undefined) {
        const elapsed = Math.min(input.fetchDelayMs, options.timeout);
        await new Promise<void>(resolve => setTimeout(resolve, elapsed));
        if (input.fetchDelayMs > options.timeout) throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
      }
      if (input.fetchError) throw input.fetchError;
      return { status: () => input.status ?? 200 };
    },
    fulfill: async () => { calls.push("fulfill"); },
    abort: async () => { calls.push("abort"); },
  };
  return { route, calls };
}

test("read network guard preserves the Executor source-read deadline beyond the action cap", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard(policy);
  await guard.install({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} } as any);
  guard.prepareNavigation("https://public.example/guide", 8_000);
  const document = fakeRoute({ url: "https://public.example/guide", type: "document" });
  await http(document.route);
  const delayedPublicScript = fakeRoute({ url: "https://assets.example/public/calendar.js", type: "script", fetchDelayMs: 6_000 });
  const startedAt = Date.now();
  await http(delayedPublicScript.route);
  assert.ok(Date.now() - startedAt >= 5_900, "the controlled public read actually waited beyond the 5s action cap");
  assert.deepEqual(delayedPublicScript.calls, ["fetch:0:8000", "fulfill"]);

  let shortHttp: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const shortDeadline = new PlaywrightReadNetworkGuard(policy);
  await shortDeadline.install({ route: async (_pattern: string, handler: typeof shortHttp) => { shortHttp = handler; }, routeWebSocket: async () => {} } as any);
  shortDeadline.prepareNavigation("https://public.example/guide", 100);
  const shortDocument = fakeRoute({ url: "https://public.example/guide", type: "document" });
  await shortHttp(shortDocument.route);
  const exceeded = fakeRoute({ url: "https://assets.example/public/calendar.js", type: "script", fetchDelayMs: 250 });
  await shortHttp(exceeded.route);
  assert.deepEqual(exceeded.calls, ["fetch:0:100", "abort"]);
  assert.deepEqual(shortDeadline.snapshotDiagnostics().map(item => item.code), ["READ_TIMEOUT"]);
});

test("read network guard admits only prepared public documents and exact source read rules", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  let webSocket: (socket: { close(): void }) => void = () => assert.fail("websocket handler missing");
  const guard = new PlaywrightReadNetworkGuard(policy);
  await guard.install({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async (_pattern: string, handler: typeof webSocket) => { webSocket = handler; } } as any);

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

test("TableCheck calendar admission requires the captured four-string public schema", async () => {
  let http: (route: any) => Promise<void> = async () => assert.fail("route handler missing");
  const guard = new PlaywrightReadNetworkGuard(tableCheckPublicReadNetworkPolicy);
  await guard.install({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} } as any);
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
  await guard.install({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} } as any);
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
  await guard.install({ route: async (_pattern: string, handler: typeof http) => { http = handler; }, routeWebSocket: async () => {} } as any);
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
