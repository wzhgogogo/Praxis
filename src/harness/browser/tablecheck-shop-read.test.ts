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
  let query = "Public Fixture Venue"; const slug = "fixture-venue2";
  const mainOrigin = "https://www.tablecheck.com", apiOrigin = "https://production.tablecheck.com";
  const forbiddenReads = [
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en&extra=1"},
    {url: apiOrigin + "/v2/shops/fixture-venue"},
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en&locale=ja"},
    {url: "https://production.tablecheck.com.attacker.invalid/v2/shops/fixture-venue?locale=en"},
    ...["fixture-venue/shop_memos", "fixture-venue/reserve", "fixture-venue%2Freserve", "login", "booking", "fixture_venue", "Fixture-venue", "fixture--venue", "-fixture", "fixture-", "090-1234-5678", ""].map(slug => ({url: apiOrigin + "/v2/shops/" + slug + "?locale=en"})),
    ...["person@example.com", "+81 90 1234 5678", "123", "Someone Person", "token=fixture", "sk-EN", query, "Public"].map(locale => ({url: apiOrigin + "/v2/shops/fixture-venue?locale=" + encodeURIComponent(locale)})),
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en", method:"HEAD"},
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en", method:"POST"},
    {url: apiOrigin + "/v2/hub/menu_items", method:"POST"},
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en", type:"script"},
    {url: apiOrigin + "/v2/shops/fixture-venue?locale=en", headers:{"x-api-key":"local-fixture"}},
  ];
  let heldShop:Promise<void>|undefined,shopStatus=200;
  const received: string[] = [], snapshots: import("../../infrastructure/browser/browser-runtime.js").BrowserSnapshot[] = [];
  const receiver = createServer(async (request, response) => {
    const url = new URL(request.url!, mainOrigin); received.push(url.pathname);
    response.setHeader("Access-Control-Allow-Origin", mainOrigin);
    if (url.pathname === "/v2/shops/" + slug || url.pathname === new URL(recordedURL).pathname) {
      await heldShop;response.statusCode=shopStatus;
      response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify({ shops: [{ _id: "fixture-public-id", slug, name_translations: [{locale:"en",translation:query}], locale:"en", address:"1-1 Fixture Street, Tokyo", phone:"03-1111-2222", stations:[], cuisines:[], geocode:{lat:35.1,lon:139.1}, service_modes:["dining"] }], menu_categories:[] })); return;
    }
    response.setHeader("Content-Type", "text/html");
    // LOCAL_CONSTRUCTION: listbox/option semantics mirror the captured public suggestions.
    response.end(`<body>
      <button onclick='for(const c of ${JSON.stringify(forbiddenReads)}){if(c.type){const s=document.createElement("script");s.src=c.url;document.body.append(s)}else fetch(c.url,{method:c.method||"GET",headers:c.headers||{}}).catch(()=>{})}'>Boundary requests</button>
      <button onclick="fetch('${recordedURL}').catch(()=>{})">Recorded request</button>
      <button onclick="document.querySelector('input').hidden=false">Destination</button>
      <input aria-label="Destination" hidden oninput="document.getElementById('option').hidden=false">
      <div role="listbox"><div role="option" tabindex="0" hidden id="option" onclick="loadFixture()">${query}</div></div>
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
      component.beginReadScope?.();
      await component.prepareNavigation!(mainOrigin + "/en/japan/search"); await component.navigate(mainOrigin + "/en/japan/search");
      const controls = await component.observeControls!(); await component.click(controls.find(c => c.label === "Recorded request")!.id);
      await component.waitForSettled?.({ url: mainOrigin + "/en/japan/search", title: "", text: "" }, 2000);
      const observedRead = await component.snapshot();
      assert.ok(received.includes(new URL(recordedURL).pathname), "The exact recorded request must reach the local receiver under the repaired contract");
      assert.ok(observedRead.networkRequests?.some(row => row.origin === apiOrigin && row.pathname === new URL(recordedURL).pathname && row.outcome === "ADMITTED"));
      const completed=observedRead.networkRequests?.find(row=>row.dynamicRead)?.dynamicRead;
      assert.ok(completed);assert.equal(completed.status,200);assert.equal(completed.pageId,observedRead.pageId);
      assert.equal(completed.fields[0]?.normalizedValueSha256,createHash("sha256").update("en").digest("hex"));
      let release!:()=>void;heldShop=new Promise<void>(resolve=>{release=resolve;});const before=received.length;
      let freshControls=await component.observeControls!();await component.click(freshControls.find(c=>c.label==="Recorded request")!.id);
      const deadline=Date.now()+2000;while(received.length===before&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,10));assert.ok(received.length>before);
      const afterStart=component.readBoundary!()!;const pending=await component.snapshot();
      assert.equal(pending.networkRequests?.filter(row=>row.dynamicRead).length,1,"An in-flight request is not a completed receipt");
      release();heldShop=undefined;await component.waitForSettled?.(pending,2000);
      const late=await component.snapshot(),lateReceipt=late.networkRequests?.filter(row=>row.dynamicRead).at(-1)?.dynamicRead;
      assert.ok(lateReceipt);assert.ok(lateReceipt.requestSequence<=afterStart.requestSequence,"Late response retains its pre-action start order");
      assert.equal(observedRead.networkRequests?.filter(row=>row.dynamicRead).length,1,"Old snapshots cannot acquire later receipts retroactively");
      component.beginReadScope?.();assert.notEqual(component.readBoundary!()?.readScopeId,lateReceipt.readScopeId);
      shopStatus=503;freshControls=await component.observeControls!();await component.click(freshControls.find(c=>c.label==="Recorded request")!.id);await component.waitForSettled?.(late,2000);
      const failed=await component.snapshot();assert.equal(failed.networkRequests?.filter(row=>row.dynamicRead).length,2,"HTTP failure produces no success receipt");shopStatus=200;

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
    for (const name of ["Public Fixture Venue", "En Dining Fixture", "En"]) {
    query = name; const beforeDetail = received.filter(path => path === "/v2/shops/" + slug).length;
    let charged = 0;
    const result = await runG6SourceReadCheck({ browser, policy: tableCheckPublicReadNetworkPolicy, spec: { startUrl: mainOrigin + "/en/japan/search", query, minimumIntervalMs: 1 }, signal: new AbortController().signal, beforeEntry: async () => { charged++; }, catalogTerminal: Promise.resolve(true), phase: () => {}, record: () => {} });
    assert.equal(charged, 1); assert.equal(result.phase, "SELECT_MATCH", JSON.stringify(result)); assert.equal(result.status, "SELECT_ACTION_COMPLETED");
    assert.equal(received.filter(path => path === "/v2/shops/" + slug).length, beforeDetail + 1, "Each current read must reach the receiver; an earlier success cannot stand in for this detail");
    const final = snapshots.at(-1)!; assert.equal(final.url, mainOrigin + "/en/" + slug);
    const identity = parseTableCheckOutletIdentityWithEvidence(final, final.url);
    assert.equal(identity?.outlet.outletName, query); assert.equal(identity?.outlet.address, "1-1 Fixture Street, Tokyo"); assert.equal(identity?.outlet.phone, "03-1111-2222");
    assert.ok(final.networkRequests?.some(row => row.origin === apiOrigin && row.pathname === "/v2/shops/" + slug && row.outcome === "ADMITTED"));
    assert.ok(final.networkRequests?.some(row=>row.dynamicRead?.pageId===final.pageId&&row.dynamicRead?.status===200));
    if (name.startsWith("En ")) assert.ok(final.networkRequests?.some(row => row.origin === apiOrigin && row.pathname === "/v2/shops/" + slug && row.outcome === "ADMITTED" && row.queryValues?.some(field => field.queryKey === "locale" && field.valueClass === "PREFIX_OF_AUTHORITATIVE_INPUT")), "Original provenance metadata remains truthful while the locale format independently admits en");
    if (name === "En") assert.ok(final.networkRequests?.some(row => row.origin === apiOrigin && row.pathname === "/v2/shops/" + slug && row.outcome === "ADMITTED" && row.queryValues?.some(field => field.queryKey === "locale" && field.valueClass === "EQUALS_AUTHORITATIVE_INPUT")), "An equal public restaurant name also cannot corrupt independent language validation");
    console.log("SHOP_FIXTURE_CHAIN " + JSON.stringify({ receiver: received, finalURL: final.url, parsedName: identity?.outlet.outletName, realSourceResponse: false }));
    }
    // Production adapter integration with LOCAL_CONSTRUCTION body; the identity
    // comparison remains independent of the exact-suggestion handoff itself.
    const {BrowserTaskExecutor}=await import("../../infrastructure/browser/browser-task-executor.js");
    const {TableCheckBrowserAvailability}=await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
    const {fixtureCandidates}=await import("../restaurant-fixtures.js");
    for(const conflict of [false,true]){
      query="Public Fixture Venue";const candidate=structuredClone(fixtureCandidates[0]!);
      candidate.restaurant.outletName=query;candidate.restaurant.address=conflict?"9-9 Other Street, Tokyo":"1-1 Fixture Street, Tokyo";
      candidate.restaurant.sourceIds={phone:conflict?"03-9999-8888":"03-1111-2222"};
      const before=received.length;
      const executor=new BrowserTaskExecutor(runtime,{maxAutomaticElapsedMs:20000,maxOperationsPerCandidate:100,maxModelCallsPerCandidate:6,maxModelCallsTotal:6,modelDecision:{async decide(input){
        const targets=input.observation.targets;
        if(!input.observation.url.includes("/japan/search"))return {type:"COMPLETE",reason:"Code checks settled source handoff"};
        const option=targets.find(t=>t.label===query);if(option)return {type:"CLICK",targetRef:option.ref,reason:"Unique exact observed suggestion"};
        const field=targets.find(t=>t.kind==="INPUT"&&t.label==="Destination");if(field)return {type:"FILL_AUTHORITATIVE",field:"RETRIEVAL",targetRef:field.ref,reason:"Accepted full name"};
        return {type:"CLICK",targetRef:targets.find(t=>t.label==="Destination")!.ref,reason:"Open source search"};
      }}});
      try{
        const result=await new TableCheckBrowserAvailability(executor,()=>"2026-11-08T00:00:00Z",{identityOnly:true,targetQuery:query,networkPolicy:tableCheckPublicReadNetworkPolicy}).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-11-11",partySize:2,timeWindow:{earliest:"19:00",latest:"19:00"},hardCriteria:[]},new AbortController().signal);
        const identity=result.evidence.find(e=>e.kind==="ENTITY_MATCH");
        assert.equal(identity?.entityMatch?.confidence==="HIGH",!conflict,JSON.stringify({conflict,result}));
        assert.deepEqual(received.slice(before),["/en/japan/search","/v2/shops/"+slug],"Source handoff is inspected without another document navigation");
      }finally{await executor.closeAll();}
    }
  } finally { receiver.closeAllConnections(); await new Promise<void>(resolve => receiver.close(() => resolve())); }
});
