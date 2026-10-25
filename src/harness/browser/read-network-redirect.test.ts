import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { PlaywrightReadNetworkGuard } from "../../infrastructure/browser/playwright-read-network-guard.js";

test("H003 TableCheck reservation forms stay unreachable even through a reviewed rule or redirect", async () => {
  const { tableCheckPublicReadNetworkPolicy } = await import("../../integrations/tablecheck/tablecheck-public-query.js");
  const arrivals: string[] = [];
  const server = createServer((request, response) => {
    const path = new URL(request.url!, `http://${request.headers.host}`).pathname;
    arrivals.push(path);
    if (path === "/jump") { response.writeHead(302, { location: "/en/shops/fixture/reserve?start_date=2026-11-05&pax=10" }); response.end(); return; }
    response.setHeader("content-type", "text/html");
    response.end(path.includes("reserve")
      ? '<form id="new_reservation" method="post" action="/reserve/create"><input name="reservation[name]"><input name="reservation[phone]"><input name="reservation[email]"></form>'
      : '<h1>Public TableCheck guide</h1>');
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: "block" });
    const guard = new PlaywrightReadNetworkGuard({ ...tableCheckPublicReadNetworkPolicy, documentOrigins: [origin], genericPublicRead: true,
      prohibitedPaths: tableCheckPublicReadNetworkPolicy.prohibitedPaths!.map(rule => ({ ...rule, hostname: "127.0.0.1" })),
      // Challenge the permanent deny with the historical broader GET exception.
      dynamicReads: [{ origin, pathnamePrefix: "/en/shops/", methods: ["GET", "HEAD"], resourceTypes: ["document", "fetch"],
        queryKeyRules: { required: [], allowed: ["start_date", "pax"] } }] });
    await guard.install(context);
    const page = await context.newPage(); await guard.preparePage(context, page);
    guard.prepareNavigation(origin + "/en/fixture");
    await page.goto(origin + "/en/fixture");
    assert.match(await page.locator("body").innerText(), /Public TableCheck guide/);
    for (const path of ["/en/shops/fixture/reserve?start_date=2026-11-05&pax=10", "/en/shops/fixture/reserve/next", "/en/shops/fixture/reserve/calendar", "/en/shops/fixture/%72eserve"]) {
      await page.goto(origin + path, { timeout: 3_000 }).catch(() => {});
      assert.equal(arrivals.some(p => decodeURIComponent(p).split("/").includes("reserve")), false, JSON.stringify(arrivals));
      assert.throws(() => guard.prepareNavigation(origin + path), /prohibited|sensitive/);
      assert.throws(() => guard.prepareObservedNavigation(origin + path), /prohibited|sensitive/);
    }
    guard.prepareNavigation(origin + "/jump");
    await page.goto(origin + "/jump", { timeout: 3_000 }).catch(() => {});
    assert.equal(arrivals.some(p => decodeURIComponent(p).split("/").includes("reserve")), false, JSON.stringify(arrivals));
    assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"));
  } finally {
    await browser.close(); server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

test('P21 source preflight retains a6.5s result under the production navigation budget', async () => {
  const {LocalPlaywrightChromium}=await import('../../infrastructure/browser/local-playwright-chromium.js');
  const {runSourceDataPreflight}=await import('../../eval/restaurant/agent-loop/source-data-preflight.js');
  const {TABLECHECK_PUBLIC_SEARCH_ORIGIN}=await import('../../integrations/tablecheck/tablecheck-public-query.js');
  const {mkdtemp,readFile,rm}=await import('node:fs/promises');
  const {join}=await import('node:path');const {tmpdir}=await import('node:os');
  const directory=await mkdtemp(join(tmpdir(),'preflight-delay-'));
  let received=0;const timers=new Set<ReturnType<typeof setTimeout>>();
  const server=createServer((request,response)=>{
    if(request.url==='/data'){
      received++;assert.equal(request.method,'GET');
      const timer=setTimeout(()=>{timers.delete(timer);if(!response.destroyed){response.setHeader('content-type','application/json');response.end(JSON.stringify({root:{children:[{id:'fixture',source:'public-shop',fields:{name:'Venue'}}]}}));}},6500);timers.add(timer);
    }else{response.setHeader('content-type','text/html');response.end('<script>fetch("/data").catch(()=>{})</script><body>Public result fixture</body>');}
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();assert.ok(address&&typeof address!=='string');const origin=`http://127.0.0.1:${address.port}`;
  // Replace only the public source URL/HTTP fixture; keep real Chromium, Guard,
  // production response counter, preflight timing and final classification.
  const open=LocalPlaywrightChromium.prototype.openSession;
  LocalPlaywrightChromium.prototype.openSession=async function(input){
    const session=await open.call(this,{...input,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[
      {origin,pathname:'/',methods:['GET'],resourceTypes:['document'],queryKeys:[]},
      {origin,pathname:'/data',methods:['GET'],resourceTypes:['fetch'],queryKeys:[]}]},
      recordResponse:r=>input.recordResponse?.({...r,url:new URL(r.url).pathname==='/data'?TABLECHECK_PUBLIC_SEARCH_ORIGIN+'/search/':r.url})});
    const navigate=session.navigate.bind(session),prepare=session.prepareNavigation?.bind(session);
    session.navigate=(_url,options)=>navigate(origin+'/',options);
    session.prepareNavigation=(_url,options)=>prepare?.(origin+'/',options)??Promise.resolve();
    return session;
  };
  try{
    await runSourceDataPreflight({sourceIds:['tablecheck'],environment:{PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM'},artifactDirectory:directory}).catch(()=>{});
    const result=JSON.parse(await readFile(join(directory,'source-data-preflight.json'),'utf8'));
    assert.equal(received,1);
    assert.equal(result.attempts[0].count,1,JSON.stringify(result.attempts[0]));
    assert.equal(result.classification,'READY');
    assert.equal(result.attempts[0].responseStatus,200);
  }finally{
    LocalPlaywrightChromium.prototype.openSession=open;for(const t of timers)clearTimeout(t);
    server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));
    await rm(directory,{recursive:true,force:true});
  }
});

test("E1 outer body observer captures real Chromium POST bytes independently of Guard admission", async () => {
  const module = new URL("../../eval/restaurant/agent-loop/post-body-audit.mjs", import.meta.url).href;
  const { installReviewedPostObserver, postBodyStop, recordedPostMatches } = await import(module);
  const received: Buffer[] = [];
  const server = createServer(async (request, response) => {
    if (request.method === "POST") {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      received.push(Buffer.concat(chunks));
      // Reproduce receiver latency beyond the former 3s transport deadline.
      if (received.length === 1) await new Promise(resolve => setTimeout(resolve, 3_250));
      response.setHeader("content-type", "application/json"); response.end('{"observed":true}');
    } else { response.setHeader("content-type", "text/html"); response.end("<h1>Offline POST observation</h1>"); }
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  // Independent public-query grammar: the fixture must not depend on eval artifacts.
  const postRule = { origin, pathname: "/v2/hub/availability_calendar_v2", resourceTypes: ["fetch"], methods: ["POST"],
    bodyFields: { locale: "string", start_at: "string", shop_id: "string", num_people: "string" } } as const;
  const reviewedBytes = Buffer.from(JSON.stringify([postRule]));
  const rows: any[] = [];
  const restore = installReviewedPostObserver(PlaywrightReadNetworkGuard, reviewedBytes, (entry: any) => rows.push(entry));
  let browser: import("playwright-core").Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ serviceWorkers: "block" });
    await context.grantPermissions(["local-network-access"], { origin });
    // A deliberately broader TEST_ONLY source rule challenges the OUTER
    // checker: production Guard code is unchanged and is not the audit oracle.
    // Local constructed timing: Network calls this a Fetch while the Fetch
    // interceptor reports XHR. Defer only the Guard's Network cache callback.
    const typeEvents: Array<{ event: string; type: string }> = [];
    const openCdp = context.newCDPSession.bind(context);
    context.newCDPSession = async (...args) => {
      const cdp = await openCdp(...args), on = cdp.on.bind(cdp);
      cdp.on = ((event: string, listener: (...params: any[]) => void) => on(event as any, (value: any) => {
        const endpoint = value.request?.url?.includes(postRule.pathname);
        if (endpoint && event === "Network.requestWillBeSent") {
          typeEvents.push({ event, type: value.type }); setTimeout(() => listener(value), 80);
        } else {
          if (endpoint && event === "Fetch.requestPaused") typeEvents.push({ event, type: value.resourceType });
          listener(value);
        }
      })) as typeof cdp.on;
      return cdp;
    };
    const guard = new PlaywrightReadNetworkGuard({ documentOrigins: [origin], genericPublicRead: true, staticResources: [], dynamicReads: [postRule,
      { ...postRule, bodyFields: { ...postRule.bodyFields, email: "string" } }] }, 15_000);
    await guard.install(context);
    const page = await context.newPage(); await guard.preparePage(context, page); guard.prepareNavigation(origin + "/");
    await page.goto(origin + "/", { timeout: 15_000 });
    const normal = '{ "locale":"en", "start_at":"2026-10-16", "shop_id":"TEST_ONLY", "num_people":"2" }';
    const wrong = '{"locale":"en","start_at":"2026-10-16","shop_id":"TEST_ONLY","num_people":"2","email":"NEVER_SAVE_THIS_VALUE"}';
    for (const body of [normal, wrong]) {
      const reached = await page.evaluate(async ({ path, body }) => {
        try { return (await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body })).ok; }
        catch { return false; }
      }, { path: postRule.pathname, body });
      console.log("E1 type observations", JSON.stringify(typeEvents));
      assert.equal(reached, true, "E1 reviewed POST must reach receiver when CDP falls back from Network Fetch to Fetch XHR");
    }
    assert.ok(typeEvents.some(row => row.event === "Network.requestWillBeSent" && row.type === "Fetch"));
    assert.ok(typeEvents.some(row => row.event === "Fetch.requestPaused" && row.type === "XHR"));
    assert.equal(received.length, 2, "independent local receiver must observe both actual request bodies");
    assert.deepEqual(received.map(bytes => bytes.toString()), [normal, wrong]);
    assert.deepEqual(rows.map(row => row.detail.status), ["MATCH", "MISMATCH"]);
    for (const [index, row] of rows.entries()) assert.equal(row.detail.bodyObservation.bodySha256, createHash("sha256").update(received[index]!).digest("hex"));
    assert.notEqual(rows[0].detail.outerRequestId, rows[1].detail.outerRequestId, "later POST cannot borrow earlier body inspection");
    assert.equal(postBodyStop(rows[0], reviewedBytes), null);
    assert.equal(postBodyStop(rows[1], reviewedBytes).code, "REVIEWED_POST_BODY_MISMATCH");
    const requests = (guard.snapshotRequests() as any[]).filter(row => row.outcome === "ADMITTED" && row.method === "POST");
    assert.equal(requests.length, 2);
    assert.equal(recordedPostMatches(requests[0], reviewedBytes), true);
    assert.equal(recordedPostMatches(requests[1], reviewedBytes), false);
    assert.ok(!JSON.stringify(rows).includes("NEVER_SAVE_THIS_VALUE"));
    assert.ok(!JSON.stringify(requests).includes("NEVER_SAVE_THIS_VALUE"));
  } finally {
    restore(); await browser?.close();
    await new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); });
  }
});

// Real transport oracle: a forbidden receiver must see zero requests. No model,
// external network, personal browser profile or manually re-entered route handler.
async function fixture(run: (input: {
  origin: string; other: string; arrivals: string[]; cookies: string[];
  guard: PlaywrightReadNetworkGuard; page: import("playwright-core").Page; context: import("playwright-core").BrowserContext;
  recorded: Array<{ url: string; status: number; redirectLocation?: string }>;
}) => Promise<void>, reviewedCss = false): Promise<void> {
  const arrivals: string[] = [], cookies: string[] = [];
  let other = "";
  const serve = (foreign: boolean) => (req: IncomingMessage, res: ServerResponse) => {
    // Keep CORS from hiding a receiver arrival before the Guard can be tested.
    res.setHeader("access-control-allow-origin", "*");
    const url = new URL(req.url!, `http://${req.headers.host}`);
    arrivals.push(`${foreign ? "B" : "A"}${url.pathname}`);
    if (foreign) {
      if (url.pathname === "/public/final.css") { res.setHeader("content-type", "text/css"); res.end('@import url("/private.css"); html{color:rgb(1,2,3)}'); return; }
      res.end("forbidden receiver"); return;
    }
    const redirect = (location: string) => { res.writeHead(302, { location }); res.end(); };
    if (url.pathname === "/cross") return redirect("/cross-hop");
    if (url.pathname === "/cross-hop") return redirect(`${other}/forbidden`);
    if (url.pathname === "/normalize") return redirect(`/normalize-hop?form=${url.searchParams.get("form")}`);
    if (url.pathname === "/normalize-hop") {
      const form = url.searchParams.get("form");
      const paths: Record<string, string> = {
        fragment: "/forbidden#section", dot: "/one/../forbidden", encodedDot: "/one/%2e%2e/forbidden",
        escaped: "/%66orbidden", queryEscape: "/forbidden?q=%2f", slash: "/one\\..\\forbidden",
        unicode: "/forbidden/%E6%B8%AC%E8%A9%A6", protocolRelative: "/forbidden",
      };
      return redirect((form === "protocolRelative" ? other.replace(/^http:/, "") : other) + paths[form!]);
    }
    if (url.pathname === "/sensitive") return redirect("/public-hop");
    if (url.pathname === "/public-hop") return redirect("/account/delete?action=confirm");
    if (url.pathname === "/safe") { res.setHeader("set-cookie", "read_probe=public; Path=/; SameSite=Lax"); return redirect("/safe-hop"); }
    if (url.pathname === "/safe-hop") return redirect("/result/final");
    if (url.pathname === "/result/final") {
      cookies.push(req.headers.cookie ?? ""); res.setHeader("content-type", "text/html");
      res.end('<h1>Public result</h1><a id="relative" href="next">Next</a>'); return;
    }
    if (url.pathname.startsWith("/loop/")) return redirect(url.pathname === "/loop/one" ? "/loop/two" : "/loop/one");
    if (url.pathname === "/asset") return redirect("/asset-hop");
    if (url.pathname === "/asset-hop") return redirect(`${other}/forbidden`);
    if (url.pathname === "/style-redirect") return redirect("/style-hop");
    if (url.pathname === "/style-hop") return redirect(`${other}/public/final.css`);
    if (url.pathname === "/worker.js") { res.setHeader("content-type", "application/javascript"); res.end("fetch('/asset').then(()=>postMessage('done')).catch(()=>postMessage('blocked'))"); return; }
    if (url.pathname === "/frame-page") { res.setHeader("content-type", "text/html"); res.end('<iframe src="/cross"></iframe>'); return; }
    res.setHeader("content-type", "text/html"); res.end("<h1>Public start</h1>");
  };
  const a = createServer(serve(false)), b = createServer(serve(true));
  await new Promise<void>(resolve => a.listen(0, "127.0.0.1", resolve));
  await new Promise<void>(resolve => b.listen(0, "127.0.0.1", resolve));
  const port = (server: typeof a) => { const addr = server.address(); if (!addr || typeof addr === "string") throw Error("local fixture did not bind"); return addr.port; };
  const origin = `http://127.0.0.1:${port(a)}`; other = `http://127.0.0.1:${port(b)}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: "block" });
  // The local receiver must remain reachable so Chromium's Local Network
  // Access protection cannot supply the safety assertion on the Guard's behalf.
  await context.grantPermissions(["local-network-access"], { origin });
  const recorded: Array<{ url: string; status: number; redirectLocation?: string }> = [];
  const guard = new PlaywrightReadNetworkGuard({ documentOrigins: [origin], genericPublicRead: true,
    staticResources: reviewedCss ? [{ origin: other, pathname: "/public/final.css", resourceTypes: ["stylesheet"] }] : [], dynamicReads: [] }, 2_000, value => { recorded.push(value); });
  try {
    await guard.install(context);
    const page = await context.newPage();
    await guard.preparePage(context, page);
    await run({ origin, other, arrivals, cookies, guard, page, context, recorded });
  } finally {
    await browser.close();
    await Promise.all([a, b].map(server => new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); })));
  }
}

for (const [name, path, forbidden] of [
  ["cross-origin", "/cross", "B/forbidden"],
  ["sensitive", "/sensitive", "A/account/delete"],
] as const) {
  test(`real Chromium rejects a second ${name} redirect before receiver arrival`, async () => fixture(async ({ origin, guard, page, arrivals }) => {
    guard.prepareNavigation(origin + path);
    await page.goto(origin + path, { timeout: 3_000 }).catch(() => {});
    assert.equal(arrivals.includes(forbidden), false, `forbidden receiver received ${forbidden}`);
    assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }));
  }));
}

test("real Chromium preserves allowed redirect URL, relative links, cookies and recording of every hop", async () => fixture(async ({ origin, guard, page, arrivals, cookies, recorded }) => {
  guard.prepareNavigation(origin + "/safe");
  await page.goto(origin + "/safe", { timeout: 3_000 });
  assert.equal(page.url(), origin + "/result/final");
  assert.equal(await page.locator("#relative").evaluate((el: HTMLAnchorElement) => el.href), origin + "/result/next");
  assert.deepEqual(cookies, ["read_probe=public"]);
  assert.deepEqual(arrivals.filter(x => x !== "A/favicon.ico"), ["A/safe", "A/safe-hop", "A/result/final"]);
  assert.deepEqual(recorded.map(x => new URL(x.url).pathname), ["/safe", "/safe-hop", "/result/final"]);
}));

for (const type of ["fetch", "xhr", "script", "stylesheet", "image"] as const) {
  test(`real Chromium checks every ${type} redirect before cross-origin dispatch`, async () => fixture(async ({ origin, guard, page, arrivals }) => {
    guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
    await page.evaluate(async kind => {
      if (kind === "fetch") { await fetch("/asset").catch(() => {}); return; }
      if (kind === "xhr") { await new Promise<void>(resolve => { const x = new XMLHttpRequest(); x.onloadend = () => resolve(); x.open("GET", "/asset"); x.send(); }); return; }
      await new Promise<void>(resolve => {
        const el = document.createElement(kind === "stylesheet" ? "link" : kind === "image" ? "img" : "script");
        el.onload = el.onerror = () => resolve();
        if (el instanceof HTMLLinkElement) { el.rel = "stylesheet"; el.href = "/asset"; }
        else (el as HTMLScriptElement | HTMLImageElement).src = "/asset";
        document.head.appendChild(el);
      });
    }, type);
    assert.equal(arrivals.includes("B/forbidden"), false, "cross-origin receiver must receive zero requests");
    assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }));
  }));
}

test("real Chromium redirect loops fail at the Guard hop bound", async () => fixture(async ({ origin, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/loop/one");
  await page.goto(origin + "/loop/one", { timeout: 3_000 }).catch(() => {});
  assert.ok(arrivals.filter(x => x.startsWith("A/loop/")).length <= 10, "Guard must bound redirects before Chromium's own limit");
  assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }));
}));

test("real Chromium protects popup navigation before its first redirect", async () => fixture(async ({ origin, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
  const popupPromise = page.waitForEvent("popup");
  await page.evaluate(url => { window.open(url); }, origin + "/cross");
  await popupPromise;
  for (let i = 0; i < 100 && !guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"); i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"));
  assert.equal(arrivals.includes("B/forbidden"), false);
}));

test("real Chromium protects iframe redirect chains", async () => fixture(async ({ origin, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/frame-page"); await page.goto(origin + "/frame-page");
  assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"));
  assert.equal(arrivals.includes("B/forbidden"), false);
}));

test("real Chromium preserves normal allowed popup redirect navigation", async () => fixture(async ({ origin, guard, page }) => {
  guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
  const popupPromise = page.waitForEvent("popup"); await page.evaluate(url => { window.open(url); }, origin + "/safe");
  const popup = await popupPromise;
  await popup.waitForURL(origin + "/result/final", { timeout: 3_000 });
  assert.equal(await popup.locator("h1").textContent(), "Public result");
  assert.equal(await popup.locator("#relative").evaluate((el: HTMLAnchorElement) => el.href), origin + "/result/next");
}));

test("real Chromium protects dedicated-worker fetch redirects", async () => fixture(async ({ origin, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
  const outcome = await page.evaluate(() => new Promise(resolve => {
    const worker = new Worker("/worker.js");
    const timer = setTimeout(() => { worker.terminate(); resolve("worker-timeout"); }, 2_000);
    worker.onmessage = event => { clearTimeout(timer); worker.terminate(); resolve(event.data); };
    worker.onerror = () => { clearTimeout(timer); worker.terminate(); resolve("worker-error"); };
  }));
  assert.equal(outcome, "blocked", JSON.stringify({ requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics(), arrivals }));
  assert.ok(arrivals.includes("A/worker.js"), "the allowed worker script must actually execute before its fetch is guarded");
  assert.ok(guard.snapshotRequests().some(row => row.pathname === "/worker.js" && row.resourceType === "script" && row.outcome === "ADMITTED"));
  assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"));
  assert.equal(arrivals.includes("B/forbidden"), false);
}));

test("reviewed stylesheet redirects preserve their URL without promoting the CDN to generic public reads", async () => fixture(async ({ origin, other, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
  await page.evaluate(() => new Promise<void>(resolve => { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/style-redirect"; link.onload = link.onerror = () => resolve(); document.head.appendChild(link); }));
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).color), "rgb(1, 2, 3)");
  assert.ok(arrivals.includes("B/public/final.css"));
  assert.equal(arrivals.includes("B/private.css"), false);
  assert.ok(guard.snapshotRequests().some(row => row.origin === other && row.pathname === "/private.css" && row.outcome === "BLOCKED"), "relative CSS import is resolved against the final CDN URL and remains rule-bound");
}, true));

test("T1 native redirect URL-normalization attempts keep forbidden receivers untouched", async t => {
  for (const form of ["fragment", "dot", "encodedDot", "escaped", "queryEscape", "slash", "unicode", "protocolRelative"]) await t.test(form, async () => fixture(async ({ origin, guard, page, arrivals }) => {
    guard.prepareNavigation(`${origin}/normalize?form=${form}`);
    await page.goto(`${origin}/normalize?form=${form}`, { timeout: 3_000 }).catch(() => {});
    assert.ok(arrivals.includes("A/normalize-hop"), "Chromium must actually follow the first allowed redirect");
    assert.equal(arrivals.filter(row => row.startsWith("B/")).length, 0, "normalization must never reach a forbidden receiver");
    assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"));
    t.diagnostic(JSON.stringify({ form, arrivals, forbiddenArrivals: 0, reproduction: "NOT_REPRODUCED" }));
  }));
});

for (const mode of ["origin", "method", "resource-type"] as const) test(`T1 CDP independently rejects an unrecognized paused ${mode} request`, async () => fixture(async ({ origin, other, context, guard, page, arrivals }) => {
  // Isolate the real CDP boundary. No fake route handler or injected CDP events:
  // remove the ordinary route so it cannot supply this layer's safety verdict.
  await context.unroute("**/*");
  guard.prepareNavigation(origin + "/page");
  await page.goto(origin + "/page", { timeout: 3_000 });
  assert.ok(arrivals.includes("A/page"), "a public allowed control must reach its real receiver");
  if (mode === "method") await page.evaluate(async () => { await fetch("/public-post", { method: "POST", body: "control" }).catch(() => {}); });
  else await page.goto(other + (mode === "resource-type" ? "/public/final.css" : "/forbidden"), { timeout: 3_000 }).catch(() => {});
  const forbidden = arrivals.filter(row => mode === "method" ? row === "A/public-post" : row.startsWith("B/"));
  assert.equal(forbidden.length, 0, `CDP must reject the unrecognized ${mode} request before receiver arrival`);
  assert.ok(guard.snapshotRequests().some(row => row.outcome === "BLOCKED"));
}, mode === "resource-type"));

test('TableCheck public search JSON reaches an independent receiver while writes, other paths and fields stay blocked', async () => {
  const {tableCheckPublicReadNetworkPolicy}=await import('../../integrations/tablecheck/tablecheck-public-query.js');
  const {BrowserReadRecording}=await import('../../eval/restaurant/agent-loop/runners/browser-read-recording.js');
  const {mkdtemp,readFile,rm}=await import('node:fs/promises');
  const {tmpdir}=await import('node:os');const {join}=await import('node:path');
  const source='https://search-v4.production.ap-northeast-1.aws.tablecheck.net';
  const arrivals:string[]=[];
  const api=createServer((request,response)=>{arrivals.push(`${request.method} ${request.url}`);response.setHeader('access-control-allow-origin','*');response.setHeader('content-type','application/json');response.end(JSON.stringify(request.url==='/catalog.json'?{locales:['en'],kinds:{restaurant:'Restaurant'}}:{root:{children:[{id:'fixture-one',source:'public-shop',fields:{id:'fixture-one'}}]}}));});
  const site=createServer((_request,response)=>{response.setHeader('content-type','text/html');response.end('<h1>Public search fixture</h1>');});
  for(const server of [api,site])await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const apiAddress=api.address(),siteAddress=site.address();assert.ok(apiAddress&&typeof apiAddress!=='string'&&siteAddress&&typeof siteAddress!=='string');
  const apiOrigin=`http://127.0.0.1:${apiAddress.port}`,origin=`http://127.0.0.1:${siteAddress.port}`;
  const reads=tableCheckPublicReadNetworkPolicy.dynamicReads.filter(rule=>rule.origin===source).map(rule=>({...rule,origin:apiOrigin}));
  const directory=await mkdtemp(join(tmpdir(),'tc-public-json-'));
  const recorder=new BrowserReadRecording({directory,runId:'fixture',reviewedReads:reads});
  let browser:import('playwright-core').Browser|undefined;
  try{
    browser=await chromium.launch({headless:true});const context=await browser.newContext({serviceWorkers:'block'});
    await context.grantPermissions(['local-network-access'],{origin});
    const guard=new PlaywrightReadNetworkGuard({documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:reads},5000,response=>recorder.recordResponse(response));
    await guard.install(context);const page=await context.newPage();await guard.preparePage(context,page);guard.prepareNavigation(origin+'/');await page.goto(origin+'/');
    const get=async(path:string,method='GET')=>page.evaluate(async({url,method})=>{try{const response=await fetch(url,{method});return response.ok;}catch{return false;}},{url:apiOrigin+path,method});
    assert.equal(await get('/catalog.json'),true,'observed exact public catalog GET must arrive');
    assert.equal(await get('/search/?queryProfile=public&hits=5'),true,'observed exact public search GET must arrive');
    for(const [path,method] of [['/catalog.json','POST'],['/catalog.json','HEAD'],['/catalog.json?token=never-send','GET'],['/search/?queryProfile=public&hits=5&email=never-send','GET'],['/search/?queryProfile=public&hits=5','POST'],['/other.json','GET']])assert.equal(await get(path!,method!),false);
    assert.deepEqual(arrivals,['GET /catalog.json','GET /search/?queryProfile=public&hits=5']);
    assert.equal(reads.every(rule=>rule.methods?.length===1&&rule.methods[0]==='GET'),true);
    recorder.recordSnapshot({url:page.url(),title:'Search',html:await page.content(),text:'Public search fixture',networkRequests:guard.snapshotRequests()});
    const recording=await recorder.finish();assert.equal(recording.replay.status,'REPLAYABLE');
    const har=JSON.parse(await readFile(join(recording.path,'replay.har'),'utf8'));
    const captured=har.log.entries.filter((entry:any)=>entry.request.url.startsWith(apiOrigin));
    assert.equal(captured.length,2);assert.ok(captured.some((entry:any)=>entry.request.url.endsWith('/search/?queryProfile=public&hits=5')));
  }finally{await browser?.close();for(const server of [api,site])await new Promise<void>(resolve=>{server.close(()=>resolve());server.closeAllConnections();});await rm(directory,{recursive:true,force:true});}
});


// Real cross-origin browser fetches produce the OPTIONS; no test/client code
// sends OPTIONS or forges Access-Control-Request-* headers.
test("TableCheck browser preflight is tied to its reviewed GET or POST and rejects unknown methods, headers, paths and bodies", async () => {
  const { tableCheckPublicReadNetworkPolicy } = await import("../../integrations/tablecheck/tablecheck-public-query.js");
  const { BrowserReadRecording } = await import("../../eval/restaurant/agent-loop/runners/browser-read-recording.js");
  const { postBodyStop, installReviewedPostObserver, recordedPostMatches } = await import(new URL("../../eval/restaurant/agent-loop/post-body-audit.mjs", import.meta.url).href);
  const { mkdtemp, readFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os"); const { join } = await import("node:path");
  const savedRoot = '.eval-artifacts/tablecheck-guard-preflight-20261023/h14-inputs/';
  const saved = async (name:string) => JSON.parse(await readFile(savedRoot+name,'utf8'));
  const red = await saved('guarded-search.result.json'), green = await saved('counterfactual-search.result.json'), facet = await saved('facet-direct.result.json');
  const facetUrl = new URL(facet.url), facetBody = await readFile(savedRoot+'facet-direct.body.json','utf8');
  const facetKeys = [...facetUrl.searchParams.keys()].sort();
  assert.equal(facetKeys.length,7); assert.equal(facetKeys.includes('hits'),false);
  assert.ok(red.requests.some((r:any)=>r.method==='OPTIONS'&&r.outcome==='BLOCKED'&&JSON.stringify(r.queryKeys)===JSON.stringify(facetKeys)));
  assert.ok(green.requests.some((r:any)=>r.method==='GET'&&r.outcome==='ADMITTED'&&JSON.stringify(r.queryKeys)===JSON.stringify(facetKeys)));
  assert.match(await readFile(savedRoot+'guarded-search-visible.txt','utf8'),/Search is unavailable right now/);
  assert.match(await readFile(savedRoot+'counterfactual-search-visible.txt','utf8'),/Showing 1[–-]20 of 654/);
  const arrivals: Array<{ method: string; path: string; requestedMethod: string | undefined; headerNames: string | undefined; bytes: number }> = [];
  const api = createServer(async (request, response) => {
    let bytes = 0; for await (const chunk of request) bytes += chunk.length;
    arrivals.push({ method: request.method!, path: request.url!, requestedMethod: request.headers["access-control-request-method"] as string | undefined,
      headerNames: request.headers["access-control-request-headers"] as string | undefined, bytes });
    response.setHeader("access-control-allow-origin", "*");
    response.setHeader("access-control-allow-methods", "GET, POST, PUT");
    response.setHeader("access-control-allow-headers", "x-api-key, content-type, x-unreviewed");
    response.setHeader("access-control-max-age", "0");
    response.setHeader("content-type", "application/json");
    response.end(request.method === "OPTIONS" ? "" : request.url?.includes("queryProfile=venue-facet-cuisine") ? facetBody : '{"root":{"children":[{"id":"fixture-one","source":"public-shop","fields":{"id":"fixture-one"}}]}}');
  });
  const site = createServer((_request, response) => { response.setHeader("content-type", "text/html"); response.end("<h1>Public cross-origin search</h1>"); });
  for (const server of [api, site]) await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const apiAddress = api.address(), siteAddress = site.address(); assert.ok(apiAddress && typeof apiAddress !== "string" && siteAddress && typeof siteAddress !== "string");
  const apiOrigin = `http://127.0.0.1:${apiAddress.port}`, origin = `http://127.0.0.1:${siteAddress.port}`;
  const directory = await mkdtemp(join(tmpdir(), "tc-preflight-"));
  let browser: import("playwright-core").Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    for (const mode of ["get", "xhr", "missing-network-marker", "facet-no-hits", "catalog", "default-get", "static-get", "post", "extra-header", "other-path", "no-get-rule", "manual-options", "reserve", "reserve-child", "calendar-post", "calendar-xhr", "calendar-extra-field", "calendar-wrong-type", "calendar-missing-field", "calendar-extra-header", "calendar-put", "calendar-other-path", "calendar-query"] as const) {
      const context = await browser.newContext({ serviceWorkers: "block" });
      let restorePost: (() => void) | undefined;
      try {
        await context.grantPermissions(["local-network-access"], { origin });
        const reads = [...tableCheckPublicReadNetworkPolicy.dynamicReads,...tableCheckPublicReadNetworkPolicy.staticResources].map(rule => ({ ...rule, origin: apiOrigin,
          ...(rule.corsPreflight ? { corsPreflight: { ...rule.corsPreflight, requestOrigin: origin } } : {}),
          ...(mode === "no-get-rule" ? { methods: [] as const } : {}) }));
        if(mode==='reserve'||mode==='reserve-child') reads.push({origin:apiOrigin,pathnamePrefix:'/en/shops/',methods:['GET'],resourceTypes:['fetch'],queryKeys:[],corsPreflight:{requestOrigin:origin,requestedHeaderNames:['x-api-key']}});
        const calendar = mode.startsWith("calendar-");
        const bodyFields: Record<string, unknown> = { locale: "en", start_at: "2026-11-04", shop_id: "LOCAL_FIXTURE", num_people: "2" };
        if (mode === "calendar-extra-field") bodyFields.extra = "LOCAL_UNREVIEWED_FIELD";
        if (mode === "calendar-wrong-type") bodyFields.num_people = 2;
        if (mode === "calendar-missing-field") delete bodyFields.shop_id;
        const calendarBody = JSON.stringify(bodyFields);
        const target = calendar ? (mode === "calendar-other-path" ? "/v2/hub/unknown_calendar" : "/v2/hub/availability_calendar_v2") + (mode === "calendar-query" ? "?unreviewed=1" : "") : mode==='facet-no-hits' ? facetUrl.pathname+facetUrl.search : mode==='catalog'?'/catalog.json':mode==='default-get'?'/v2/geolocation':mode==='static-get'?'/common/fixture.json':mode==='reserve'?'/en/shops/fixture/reserve':mode==='reserve-child'?'/en/shops/fixture/reserve/calendar':(mode==='other-path'?'/other/':'/search/')+'?queryProfile=public&hits=5';
        const reviewed = Buffer.from(JSON.stringify(reads.map(rule => ({ ...rule, methods: rule.methods ?? ["GET", "HEAD"], queryKeyRules: rule.queryKeyRules ?? { required: rule.queryKeys ?? [] }, ...(rule.pathnamePrefix ? { pathnamePattern: "^" + rule.pathnamePrefix + ".*$" } : {}) }))));
        const outerRows: any[] = [];
        restorePost = installReviewedPostObserver(PlaywrightReadNetworkGuard, reviewed, (row: any) => outerRows.push(row));
        const recorder = new BrowserReadRecording({ directory, runId: mode, reviewedReads: reads });
        // A real Fetch pause can lack its Network initiator event. Remove only
        // that diagnostic stream on the Guard session; independent CDP below
        // still observes the real browser-generated preflight.
        const openCdp = context.newCDPSession.bind(context);
        if (mode === "missing-network-marker") context.newCDPSession = async (...args) => {
          const cdp = await openCdp(...args), send = cdp.send.bind(cdp);
          cdp.send = (async (method: any, params: any) => method === "Network.enable" ? {} : send(method, params)) as typeof cdp.send;
          return cdp;
        };
        const guard = new PlaywrightReadNetworkGuard({ documentOrigins: [origin], prohibitedPaths:[{hostname:"127.0.0.1",pathSegment:"reserve"}],staticResources: mode==="static-get"?reads:[], dynamicReads:mode==="static-get"?[]:reads }, 5_000, response => recorder.recordResponse(response));
        await guard.install(context); const page = await context.newPage(); await guard.preparePage(context, page); guard.prepareNavigation(origin + "/"); await page.goto(origin + "/");
        context.newCDPSession = openCdp;
        const metadata: unknown[] = []; const cdp = await context.newCDPSession(page);
        cdp.on("Network.requestWillBeSent", event => { if (event.request.method === "OPTIONS") metadata.push({ type: event.type, initiator: event.initiator.type }); }); await cdp.send("Network.enable");
        const before = arrivals.length;
        const ok = await page.evaluate(async ({ url, mode, calendar, calendarBody }) => {
          if (mode === "xhr" || mode === "calendar-xhr") return new Promise<boolean>(resolve => {
            const request = new XMLHttpRequest(); request.open(calendar ? "POST" : "GET", url);
            request.setRequestHeader(calendar ? "content-type" : "x-api-key", calendar ? "application/json" : "LOCAL_FIXTURE_ONLY"); request.timeout = 5_000;
            request.onload = () => resolve(request.status === 200); request.onerror = request.ontimeout = () => resolve(false); request.send(calendar ? calendarBody : undefined);
          });
          try { const response = await fetch(url, { method: mode === "calendar-put" ? "PUT" : calendar || mode === "post" ? "POST" : mode === "manual-options" ? "OPTIONS" : "GET",
            headers: calendar ? { "content-type": "application/json", ...(mode === "calendar-extra-header" ? { "x-unreviewed": "LOCAL_FIXTURE_ONLY" } : {}) }
              : mode === "manual-options" ? { "access-control-request-method": "GET", "access-control-request-headers": "x-api-key" } : { "x-api-key": "LOCAL_FIXTURE_ONLY", ...(mode === "extra-header" ? { "x-unreviewed": "LOCAL_FIXTURE_ONLY" } : {}) },
            ...(calendar ? { body: calendarBody } : {}) }); return response.ok; } catch { return false; }
        }, { url: apiOrigin + target, mode, calendar, calendarBody });
        console.log("preflight metadata", mode, JSON.stringify(metadata));
        assert.equal(ok, ["get", "xhr", "missing-network-marker", "facet-no-hits", "catalog", "default-get", "static-get", "calendar-post", "calendar-xhr"].includes(mode), `${mode}: browser GET handshake must reach receiver; disallowed requests must not`);
        if (["get", "xhr", "missing-network-marker", "facet-no-hits", "catalog", "default-get", "static-get", "calendar-post", "calendar-xhr"].includes(mode)) {
          // Playwright's existing interception locally fulfills genuine browser
          // preflights. The independent receiver must observe the resulting GET;
          // a synthetic server-side OPTIONS response is not our oracle.
          assert.deepEqual(metadata, [{ type: "Other", initiator: "preflight" }]);
          assert.deepEqual(arrivals.slice(before), [
            { method: calendar ? "POST" : "GET", path: target, requestedMethod: undefined, headerNames: undefined, bytes: calendar ? Buffer.byteLength(calendarBody) : 0 },
          ]);
          const preflight = guard.snapshotRequests().find(row => row.outcome === "ADMITTED" && row.method === "OPTIONS");
          assert.ok(preflight, "CDP-only browser handshake must be recorded, not silently bypassed");
          assert.deepEqual(preflight.corsPreflight, { initiator: "BROWSER_PREFLIGHT", secFetchMode: "cors", requestOrigin: origin, requestedMethod: calendar ? "POST" : "GET", requestedHeaderNames: [calendar ? "content-type" : "x-api-key"], bodyBytes: 0 });
          if (calendar) {
            assert.equal(outerRows.length, 1);
            assert.equal(outerRows[0].detail.status, "MATCH");
            assert.equal(recordedPostMatches(guard.snapshotRequests().find(row => row.method === "POST" && row.outcome === "ADMITTED"), reviewed), true);
          }
          assert.equal(postBodyStop({ kind: "NETWORK", detail: guard.snapshotRequests() }, reviewed), null, "independent outer observer accepts only the reviewed handshake");
          assert.ok(postBodyStop({ kind: "NETWORK", detail: [{ ...preflight, corsPreflight: { ...preflight.corsPreflight, requestedMethod: "PUT" } }] }, reviewed));
          const { snapshotRecord, safeRecord } = await import("../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js");
          const snapshot = { url: page.url(), title: "Search", html: await page.content(), text: "Public cross-origin search", networkRequests: guard.snapshotRequests() };
          const traced = safeRecord(snapshotRecord(snapshot)) as any;
          assert.deepEqual(traced.networkRequests.find((row: any) => row.method === "OPTIONS").corsPreflight, preflight.corsPreflight, "Live trace sanitization retains independent handshake facts");
          assert.equal(postBodyStop({ kind: "NETWORK", detail: traced.networkRequests }, reviewed), null);
          recorder.recordSnapshot(snapshot);
          const result = await recorder.finish(); const stored = JSON.parse(await readFile(join(result.path, "recording.json"), "utf8"));
          const storedRequest = stored.entries.flatMap((entry: any) => entry.kind === "NETWORK" ? entry.detail : []).find((request: any) => request.method === "OPTIONS");
          assert.deepEqual(storedRequest.corsPreflight, preflight.corsPreflight);
          assert.equal(postBodyStop({ kind: "NETWORK", detail: stored.entries.flatMap((entry: any) => entry.kind === "NETWORK" ? entry.detail : []) }, reviewed), null, "recording retains method, handshake and independent POST body binding");
          assert.equal(JSON.stringify(stored).includes("LOCAL_FIXTURE_ONLY"), false, "record no actual header values");
          assert.equal(result.replay.status, "NOT_REPLAYABLE", "CORS transport without faithful handshake capture cannot claim replayability");
        } else assert.equal(arrivals.length, before, `${mode}: no forbidden handshake or request reaches receiver`);
      } finally { restorePost?.(); await context.close(); }
    }
  } finally {
    await browser?.close(); for (const server of [api, site]) await new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); });
    await rm(directory, { recursive: true, force: true });
  }
});
