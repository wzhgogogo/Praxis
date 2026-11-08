import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { tableCheckPublicReadNetworkPolicy } from "../../integrations/tablecheck/tablecheck-public-query.js";
import { parseTableCheckOutletIdentityWithEvidence } from "../../integrations/tablecheck/tablecheck-page-parser.js";
import { runG6SourceReadCheck } from "../../eval/restaurant/agent-loop/g6/source-read-check.js";

const recordingRoot = ".eval-artifacts/phase3b/tablecheck-direct-rerun-20261107/runtime/source-read";

// Real evidence supplies URL/method/query shape, never an invented response.
// The source-only fixture below supplies constructed data and is not Live/Replay.
test("TableCheck selection reads the recorded shop contract before a detail can appear", { timeout: 20000 }, async () => {
  const events = JSON.parse(await readFile(recordingRoot + "/events.json", "utf8"));
  const observed = events.find((row: any) => row.kind === "NETWORK_REQUEST_START" && row.detail.url.includes("/v2/shops/"));
  assert.ok(observed);
  const html = await readFile(recordingRoot + "/recording/diagnostic/snapshot-0001.html", "utf8");
  const locale = html.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1]; assert.equal(locale, "en");
  const recordedURL = observed.detail.url + "?locale=" + locale;
  assert.equal(createHash("sha256").update(recordedURL).digest("hex"), observed.detail.urlSha256, "Reconstruct the actual rejected URL, rather than invent a query value");
  const rejectedRecording = JSON.parse(await readFile(recordingRoot + "/recording/recording.json", "utf8"));
  assert.ok(rejectedRecording.entries.some((entry: any) => entry.kind === "NETWORK" && entry.detail.some((row: any) => row.pathname === new URL(recordedURL).pathname && row.outcome === "BLOCKED")));

  const har = JSON.parse(await readFile(recordingRoot + "/recording/components.har", "utf8"));
  const publicScript = har.log.entries.find((entry: any) => entry.request.url.endsWith("/portal/assets/index-KCcaxOlR.js")).response.content.text as string;
  const sourceRequest = publicScript.match(/\bV7e=(async\(e,n\)=>oi\.get\("v2\/shops\/"\.concat\(e,"\?"\)\.concat\(n\)\)\.json\(\))/)?.[1];
  const sourceSelect = publicScript.match(/\bEE=e=>\{[\s\S]*?select:(t=>\{[\s\S]*?\})\}\)\},nFn=/)?.[1];
  assert.ok(sourceRequest && sourceSelect, "Use the actual frozen request builder and response selector, without executing the complete sanitized bundle");
  const query = "Public Fixture Venue", slug = "fixture-venue2";
  const mainOrigin = "https://www.tablecheck.com", apiOrigin = "https://production.tablecheck.com";
  const forbiddenReads = [
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en&extra=1"},
    {url: apiOrigin + "/v2/shops/fixture-venue"},
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en&locale=ja"},
    {url: "https://production.tablecheck.com.attacker.invalid/v2/shops/fixture-venue?locale=en"},
    ...["fixture-venue/shop_memos", "fixture-venue/reserve", "fixture-venue%2Freserve", "login", "booking", "fixture_venue", "Fixture-venue", "fixture--venue", "-fixture", "fixture-", "090-1234-5678", ""].map(slug => ({url: apiOrigin + "/v2/shops/" + slug + "?locale=en"})),
    ...["person@example.com", "+81 90 1234 5678", "123", "Someone Person", "token=fixture", query, "Public"].map(locale => ({url: apiOrigin + "/v2/shops/fixture-venue?locale=" + encodeURIComponent(locale)})),
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en", method:"HEAD"},
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en", method:"POST"},
    {url: apiOrigin + "/v2/hub/menu_items", method:"POST"},
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en", type:"script"},
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en", headers:{"x-api-key":"local-fixture"}},
  ];
  const received: string[] = [], snapshots: import("../../infrastructure/browser/browser-runtime.js").BrowserSnapshot[] = [];
  const receiver = createServer((request, response) => {
    const url = new URL(request.url!, mainOrigin); received.push(url.pathname);
    response.setHeader("Access-Control-Allow-Origin", mainOrigin);
    if (url.pathname === "/v2/shops/" + slug || url.pathname === new URL(recordedURL).pathname) {
      response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify({ shops: [{ _id: "fixture-public-id", slug, name_translations: [{locale:"en",translation:query}], locale:"en", address:"1-1 Fixture Street, Tokyo", phone:"03-1111-2222", stations:[], cuisines:[], geocode:{lat:35.1,lon:139.1}, service_modes:["dining"] }], menu_categories:[] })); return;
    }
    response.setHeader("Content-Type", "text/html");
    response.end(`<body>
      <button onclick='for(const c of ${JSON.stringify(forbiddenReads)}){if(c.type){const s=document.createElement("script");s.src=c.url;document.body.append(s)}else fetch(c.url,{method:c.method||"GET",headers:c.headers||{}}).catch(()=>{})}'>Boundary requests</button>
      <button onclick="fetch('${recordedURL}').catch(()=>{})">Recorded request</button>
      <button onclick="document.querySelector('input').hidden=false">Destination</button>
      <input aria-label="Destination" hidden oninput="document.getElementById('option').hidden=false">
      <button hidden id="option" onclick="loadFixture()">${query}</button>
      <script>
      // Constructed transport/query dependencies; the two functions below are
      // unchanged excerpts from the recorded public client, not a fake recording.
      const n='en',le={japanese:{code:'ja'},chineseSimplified:{code:'zh-CN'},chineseTraditional:{code:'zh-TW'}},ze={};
      const UWn=()=>({}),o2=x=>x,Z8e=()=>false;
      const oi={get:path=>({json:async()=>{const r=await fetch('${apiOrigin}/'+path);if(!r.ok)throw Error('No detail');return r.json()}})};
      const readShop=${sourceRequest},selectShop=${sourceSelect};
      window.loadFixture=()=>readShop('${slug}',new URLSearchParams({locale:n}).toString()).then(selectShop).then(result=>{
        const d=result.shop;history.pushState({},'', '/en/${slug}');document.body.replaceChildren();
        const main=document.createElement('main'),h=document.createElement('h1'),p=document.createElement('p'),a=document.createElement('a');
        h.textContent=d.name_translations.find(t=>t.locale===n).translation;p.className='address';p.textContent=d.address;a.href='tel:'+d.phone;a.textContent='Phone';main.append(h,p,a);document.body.append(main);
      }).catch(()=>{history.pushState({},'', '/en/not-found');document.body.textContent='No fixture detail'});
      </script></body>`);
  }); receiver.listen(0, "127.0.0.1"); await once(receiver, "listening");
  const transportOrigin = `http://127.0.0.1:${(receiver.address() as import("node:net").AddressInfo).port}`;
  const runtime = new LocalPlaywrightChromium({ proxyServer: "http://127.0.0.1:9", directHosts: ["127.0.0.1"], browserType: {
    async launch(options) {
      const browser = await chromium.launch(options), create = browser.newContext.bind(browser);
      browser.newContext = async options => {
        const context = await create(options), route = context.route.bind(context);
        context.route = (pattern, handler, options) => route(pattern, async (actual, request) => {
          const wrapped = new Proxy(actual, { get(target, key) {
            if (key === "fetch") return async (options: Parameters<typeof actual.fetch>[0]) => { const url = new URL(request.url()); return target.fetch({ ...options, url: transportOrigin + url.pathname + url.search }); };
            const value = Reflect.get(target, key, target); return typeof value === "function" ? value.bind(target) : value;
          } }); return handler(wrapped, request);
        }, options); return context;
      }; return browser;
    },
  } });
  const browser = { async openSession(input: Parameters<typeof runtime.openSession>[0]) {
    const session = await runtime.openSession(input), snapshot = session.snapshot.bind(session);
    session.snapshot = async () => { const value = await snapshot(); snapshots.push(value); return value; }; return session;
  } };
  try {
    // First replay the exact recorded denied shape through the real browser Guard.
    const component = await runtime.openSession({ signal: new AbortController().signal, networkPolicy: tableCheckPublicReadNetworkPolicy });
    try {
      await component.prepareNavigation!(mainOrigin + "/en/japan/search"); await component.navigate(mainOrigin + "/en/japan/search");
      const controls = await component.observeControls!(); await component.click(controls.find(c => c.label === "Recorded request")!.id);
      await component.waitForSettled?.({ url: mainOrigin + "/en/japan/search", title: "", text: "" }, 2000);
      const observedRead = await component.snapshot();
      assert.ok(received.includes(new URL(recordedURL).pathname), "The exact recorded request must reach the local receiver under the repaired contract");
      assert.ok(observedRead.networkRequests?.some(row => row.origin === apiOrigin && row.pathname === new URL(recordedURL).pathname && row.outcome === "ADMITTED"));
    } finally { await component.close(); }
    const boundary = await runtime.openSession({ signal: new AbortController().signal, networkPolicy: tableCheckPublicReadNetworkPolicy });
    try {
      boundary.beginReadScope?.(); await boundary.prepareNavigation!(mainOrigin + "/en/japan/search"); await boundary.navigate(mainOrigin + "/en/japan/search");
      let controls = await boundary.observeControls!(); await boundary.click(controls.find(c => c.label === "Destination")!.id);
      controls = await boundary.observeControls!(); await boundary.fill(controls.find(c => c.label === "Destination" && c.kind === "INPUT")!.id, query, {inputSource:"SPECIFIC_OUTLET"});
      controls = await boundary.observeControls!(); const before = received.length;
      await boundary.click(controls.find(c => c.label === "Boundary requests")!.id); await boundary.waitForSettled?.({url:mainOrigin + "/en/japan/search", title:"", text:""}, 3000);
      assert.equal(received.length, before, "No malformed/method/type/field/preflight counterexample reaches the receiver");
      const stopped = await boundary.snapshot();
      assert.ok(stopped.networkRequests?.some(row => row.method === "OPTIONS" && row.outcome === "BLOCKED"));
      assert.ok(stopped.networkRequests?.some(row => row.method === "POST" && row.outcome === "BLOCKED"));
      assert.ok(stopped.networkRequests?.some(row => row.resourceType === "script" && row.outcome === "BLOCKED"));
    } finally {await boundary.close();}
    let charged = 0;
    const result = await runG6SourceReadCheck({ browser, policy: tableCheckPublicReadNetworkPolicy, spec: { startUrl: mainOrigin + "/en/japan/search", query, minimumIntervalMs: 1 }, signal: new AbortController().signal, beforeEntry: async () => { charged++; }, catalogTerminal: Promise.resolve(true), phase: () => {}, record: () => {} });
    assert.equal(charged, 1); assert.equal(result.phase, "SELECT_MATCH"); assert.equal(result.status, "SELECT_ACTION_COMPLETED");
    assert.ok(received.includes("/v2/shops/" + slug), "The detail GET must actually reach the receiver before the fixture can render any identity");
    const final = snapshots.at(-1)!; assert.equal(final.url, mainOrigin + "/en/" + slug);
    const identity = parseTableCheckOutletIdentityWithEvidence(final, final.url);
    assert.equal(identity?.outlet.outletName, query); assert.equal(identity?.outlet.address, "1-1 Fixture Street, Tokyo"); assert.equal(identity?.outlet.phone, "03-1111-2222");
    assert.ok(final.networkRequests?.some(row => row.origin === apiOrigin && row.pathname === "/v2/shops/" + slug && row.outcome === "ADMITTED"));
    console.log("SHOP_FIXTURE_CHAIN " + JSON.stringify({ receiver: received, finalURL: final.url, parsedName: identity?.outlet.outletName, realSourceResponse: false }));
  } finally { receiver.closeAllConnections(); await new Promise<void>(resolve => receiver.close(() => resolve())); }
});
