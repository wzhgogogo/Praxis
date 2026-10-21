import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { CloudflareBrowserRun } from "../../infrastructure/browser/cloudflare-browser-run.js";
import { PlaywrightControlRegistry } from "../../infrastructure/browser/playwright-browser-controls.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import type { BrowserRuntime, BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { ModelBrowserReadActionDecision } from "../../infrastructure/browser/browser-action-decision.js";
import { inspectProbePage, runBrowserReadProbe } from "../../eval/restaurant/agent-loop/browser-read-probe.js";
import { BrowserReadRecording } from "../../eval/restaurant/agent-loop/runners/browser-read-recording.js";
import { traceBrowserRuntime } from "../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js";

import { resultRegionBusy } from "../../integrations/restaurant-search/result-region-busy.js";

const url = "https://www.tablecheck.com/en/fixture";
const identity = '<h1>Fixture restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a>';

function replayHar(url: string, html: string): string {
  return replayHarPages({ [url]: html });
}

function replayHarPages(pages: Record<string, string>): string {
  return JSON.stringify({ log: { version: "1.2", creator: { name: "Praxis fixture", version: "1" }, entries: Object.entries(pages).map(([url, html]) => ({
    startedDateTime: "2026-10-07T00:00:00.000Z",
    request: { method: "GET", url, httpVersion: "HTTP/1.1", headers: [], queryString: [], cookies: [], headersSize: -1, bodySize: -1 },
    response: { status: 200, statusText: "OK", httpVersion: "HTTP/1.1", headers: [{ name: "content-type", value: "text/html; charset=utf-8" }], cookies: [], content: { size: html.length, mimeType: "text/html", text: html }, redirectURL: "", headersSize: -1, bodySize: -1 },
    cache: {}, timings: { send: 0, wait: 0, receive: 0 },
  })) } });
}

test("guarded HAR replay drives the production executor offline and keeps missing requests off the network", async () => {
  const directory = await mkdtemp(join(tmpdir(), "praxis-browser-replay-"));
  const replayUrl = "https://replay.example/guide";
  const harPath = join(directory, "public-read.har");
  const html = `<title>Public search</title><input name="search_text" aria-label="Search venues"><label>Sushi <input type="radio" name="cuisine" value="sushi"></label><label>Counter <input type="checkbox"></label><input type="range" aria-label="Budget" min="0" max="2" value="0"><div role="region" aria-label="Filters" data-praxis-scroll-region style="height:20px;overflow:auto"><div style="height:300px">Public filters</div></div><button type="submit">Find availability</button><output id="result">Waiting</output><script>
    const result=document.querySelector('#result');
    document.querySelector('input[name=search_text]').oninput=()=>result.textContent='Search ready';
    document.querySelector('input[type=radio]').onchange=()=>result.textContent='Category ready';
    document.querySelector('input[type=checkbox]').onchange=()=>result.textContent='Filter ready';
    document.querySelector('input[type=range]').oninput=()=>result.textContent='Budget ready';
    document.querySelector('[role=region]').onscroll=()=>result.textContent='Region ready';
    document.querySelector('button').onclick=(event)=>{event.preventDefault();result.textContent='Result ready Sushi';};
  </script>`;
  await writeFile(harPath, replayHar(replayUrl, html));
  const raw = new LocalPlaywrightChromium();
  const policy = { documentOrigins: ["https://replay.example"], genericPublicRead: true, staticResources: [], dynamicReads: [] } as const;
  const runtime: BrowserRuntime = { readNetworkBoundaryCapability: "ISOLATED_CONTEXT", openSession: input => raw.openSession({ ...input, networkPolicy: policy, replayHarPath: harPath }) };
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12,  maxOperationsPerCandidate: 40, maxModelCallsPerCandidate: 8, modelDecision: { async decide(input) {
    const find = (label: string) => input.observation.targets.find(target => target.label === label)!;
    switch (++step) {
      case 1: return { type: "FILL_AUTHORITATIVE", targetRef: find("Search venues").ref, field: "RETRIEVAL", reason: "Use the observed public search input." };
      case 2: return { type: "SET_CHECKED", targetRef: find("Sushi").ref, checked: true, reason: "Apply the observed public filter." };
      case 3: return { type: "SET_CHECKED", targetRef: find("Counter").ref, checked: true, reason: "Apply the observed public filter." };
      case 4: return { type: "ADJUST_RANGE", targetRef: find("Budget").ref, direction: "INCREASE", reason: "Adjust the observed public range." };
      case 5: return { type: "SCROLL_REGION", targetRef: find("Filters").ref, direction: "DOWN", reason: "Read the observed public filter region." };
      default: return { type: "CLICK", targetRef: find("Find availability").ref, reason: "Run the observed public search." };
    }
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    await executor.navigate({ session, signal, source: "TABLECHECK", stage: "DISCOVERY", allowedOrigins: ["https://replay.example"], url: replayUrl });
    const result = await executor.runSkill({ taskId: "fixture:har-replay", session, signal, source: "TABLECHECK", stage: "DISCOVERY", allowedOrigins: ["https://replay.example"], goal: { outlet: { name: "Fixture" }, retrievalExpression: "omakase", hardCriteria: [] }, objective: "Read an offline public search result.", completion: snapshot => ({ complete: /Result ready Sushi/.test(snapshot.text), reason: "The replayed public result is not visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.equal(result.status, "COMPLETED", JSON.stringify(result));
    assert.equal(step, 6);
    await session.prepareNavigation?.("https://replay.example/missing", { timeoutMs: 500 });
    await assert.rejects(session.navigate("https://replay.example/missing", { timeoutMs: 500 }), /blocked|failed|route/i, "a Guard-admitted HAR miss must not use the network");
  } finally { await executor.close(); await rm(directory, { recursive: true, force: true }); }
});

test("recorded public documents replay through the production TableCheck availability Adapter without a network escape", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const directory = await mkdtemp(join(tmpdir(), "praxis-tablecheck-replay-"));
  const guide = "https://www.tablecheck.com/en/fixture";
  const requestUrl = "https://www.tablecheck.com/en/fixture?date=2026-10-08&time=19%3A00&num_people=2&availability_format=datetime&availability_mode=same_meal_time";
  const html = `<title>Fixture restaurant</title><h1>Fixture restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a>
    <div data-testid="Venue Availability" data-selected-date="2026-10-08" data-pax="2"><section data-availability-state="complete"><a href="/en/fixture/reserve?start_date=2026-10-08&amp;num_people=2&amp;start_time=19:00">19:00</a></section></div>`;
  // Recording receives observed source documents and only then writes its own
  // sanitized HAR. The Adapter below has no hand-authored HAR input.
  const recording = new BrowserReadRecording({ directory, runId: "tablecheck-capture" });
  recording.recordSnapshot({ url: guide, title: "Fixture restaurant", text: "Fixture restaurant", html });
  recording.recordSnapshot({ url: requestUrl, title: "Fixture restaurant", text: "Fixture restaurant", html });
  const captured = await recording.finish();
  assert.equal(captured.replay.status, "REPLAYABLE");
  if (captured.replay.status !== "REPLAYABLE") throw new Error("fixture recording must be replayable");
  const capturedHarPath = captured.replay.harPath;
  const raw = new LocalPlaywrightChromium();
  const policy = { documentOrigins: ["https://www.tablecheck.com"], genericPublicRead: true, staticResources: [], dynamicReads: [] } as const;
  const runtime: BrowserRuntime = {
    readNetworkBoundaryCapability: "ISOLATED_CONTEXT",
    openSession: input => raw.openSession({ ...input, networkPolicy: policy, replayHarPath: capturedHarPath }),
  };
  const candidate = {
    restaurant: {
      id: "tablecheck:fixture", outletName: "Fixture restaurant", address: "1-1 Tokyo Fixture Street",
      sourceIds: { tablecheck: "fixture", tablecheckNativeGuideUri: guide }, provenance: { fixture: "sanitized-har" },
    }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const,
  };
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  try {
    const result = await new TableCheckBrowserAvailability(executor, () => "2026-10-07T00:00:00.000Z", { networkPolicy: policy }).check({
      candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-10-08", partySize: 2,
      timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [],
    }, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(result));
    assert.deepEqual(result.offers.map(offer => offer.dateTime.slice(11, 16)), ["19:00"]);
  } finally {
    await executor.close();
    await rm(directory, { recursive: true, force: true });
  }
});



test("guarded dynamic TableCheck recording replays through the same production Adapter without receiver traffic", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  let arrivals = 0;
  const css = '@media(max-width:600px){.menu{overflow:auto}}:root{--asset:url(./unused.png)}';
  const receiver = createServer((request, response) => {
    const path = new URL(request.url ?? "/", `http://${request.headers.host}`).pathname;
    if (path === "/slots") { arrivals += 1; response.setHeader("content-type", "application/json"); response.end('{"available":true}'); return; }
    if (path === "/assets/reserve.css") { response.setHeader("content-type", "text/css"); response.end(css); return; }
    if (path === "/assets/app.js") { response.setHeader("content-type", "application/javascript"); response.end(`fetch('/slots').then(r=>r.json()).then(()=>document.querySelector('[data-testid="Venue Availability"]').innerHTML='<section data-availability-state="complete"><a href="/en/fixture/reserve?start_date=2026-10-08&num_people=2&start_time=19:00">19:00</a></section>')`); return; }
    response.setHeader("content-type", "text/html");
    response.end(`<link rel="stylesheet" href="https://www.tablecheck.com/assets/reserve.css?rst-v1-public"><title>Fixture restaurant</title><h1>Fixture restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability" data-selected-date="2026-10-08" data-pax="2"><span class="skeleton">Loading</span></div><script src="https://cdn.public.example/assets/app.js?rst-v1-public"></script>`);
  });
  await new Promise<void>(resolve => receiver.listen(0, "127.0.0.1", resolve));
  const address = receiver.address(); if (!address || typeof address === "string") throw new Error("fixture receiver did not bind");
  const transportOrigin = `http://127.0.0.1:${address.port}`;
  // The page and Guard retain the canonical production origin. Only the test
  // transport behind an admitted route.fetch is mapped to the receiver.
  const browserType = { async launch(options: Parameters<typeof chromium.launch>[0]) {
    const browser = await chromium.launch(options); const create = browser.newContext.bind(browser);
    browser.newContext = async contextOptions => {
      const context = await create(contextOptions); const route = context.route.bind(context);
      context.route = async (pattern, handler) => route(pattern, async original => {
        const wrapped = new Proxy(original, { get(target, property, receiverProxy) {
          if (property === "fetch") return async (options: Parameters<typeof original.fetch>[0] = {}) => {
            const source = new URL(original.request().url()); const mapped = new URL(source.pathname + source.search, transportOrigin).toString();
            return target.fetch({ ...options, url: mapped });
          };
          const value = Reflect.get(target, property, receiverProxy); return typeof value === "function" ? value.bind(target) : value;
        } });
        return handler(wrapped as typeof original, original.request());
      });
      return context;
    }; return browser;
  } };
  const guide = "https://www.tablecheck.com/en/fixture";
  const policy = { documentOrigins: ["https://www.tablecheck.com"], genericPublicRead: true,
    staticResources: [{ origin: "https://cdn.public.example", pathnamePrefix: "/assets/", resourceTypes: ["script"], queryKeyRules: { required: [], allowedPatterns: ["^rst-v1-[A-Za-z0-9._-]+$"] } }],
    dynamicReads: [{ origin: "https://www.tablecheck.com", pathname: "/slots", resourceTypes: ["fetch"], queryKeys: [] }] } as const;
  const directory = await mkdtemp(join(tmpdir(), "praxis-dynamic-recording-")); const recording = new BrowserReadRecording({ directory, runId: "dynamic", reviewedStaticResources: policy.staticResources });
  const sourceRaw = new LocalPlaywrightChromium({ browserType });
  const sourceRuntime: BrowserRuntime = { readNetworkBoundaryCapability: "ISOLATED_CONTEXT", openSession: input => sourceRaw.openSession({ ...input, networkPolicy: policy, recordResponse: response => recording.recordResponse(response) }) };
  const candidate = { restaurant: { id: "tablecheck:fixture", outletName: "Fixture restaurant", address: "1-1 Tokyo Fixture Street", sourceIds: { tablecheck: "fixture", tablecheckNativeGuideUri: guide }, provenance: { fixture: "guarded-dynamic-record" } }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  const request = { candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-10-08", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] };
  const sourceExecutor = new BrowserTaskExecutor(traceBrowserRuntime(sourceRuntime, "TABLECHECK", () => 0, recording.snapshotSink()), { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  try {
    const source = await new TableCheckBrowserAvailability(sourceExecutor, () => "2026-10-07T00:00:00.000Z", { networkPolicy: policy }).check(request, new AbortController().signal);
    assert.equal(source.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(source)); assert.ok(arrivals >= 1, "the guarded source task must consume its public dynamic response");
    const captured = await recording.finish(); assert.equal(captured.replay.status, "REPLAYABLE"); if (captured.replay.status !== "REPLAYABLE") throw new Error("public dynamic capture must replay");
    const manifest = JSON.parse(await readFile(join(captured.path, "recording.json"), "utf8"));
    assert.equal(manifest.stylesheets.length, 1, "capture follows the real Guard response callback for loaded CSS");
    assert.equal(manifest.stylesheets[0].url, "https://www.tablecheck.com/assets/reserve.css?rst-v1-public", "the stylesheet used only generic public GET admission, no reviewed static rule");
    assert.ok((await readFile(join(captured.path, "snapshot-0001.html"), "utf8")).includes(manifest.stylesheets[0].url));
    assert.equal(await readFile(join(captured.path, manifest.stylesheets[0].file), "utf8"), css);
    const capturedHarPath = captured.replay.harPath;
    const capturedHar = await readFile(capturedHarPath, "utf8");
    assert.match(capturedHar, /application\/javascript/);
    assert.match(capturedHar, /cdn\.public\.example\/assets\/app\.js/, "the initial recorded document retains the reviewed public CDN script reference");
    assert.match(capturedHar, /fetch\('\/slots'\)/, "the replay HAR retains the reviewed public script needed to consume slots");
    const beforeReplay = arrivals;
    const replayRaw = new LocalPlaywrightChromium(); const replayRuntime: BrowserRuntime = { readNetworkBoundaryCapability: "ISOLATED_CONTEXT", openSession: input => replayRaw.openSession({ ...input, networkPolicy: policy, replayHarPath: capturedHarPath }) };
    const replayTrace: unknown[] = [];
    const replayExecutor = new BrowserTaskExecutor(traceBrowserRuntime(replayRuntime, "TABLECHECK", (_kind, detail) => { replayTrace.push(detail); return replayTrace.length; }), { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
    try { const replay = await new TableCheckBrowserAvailability(replayExecutor, () => "2026-10-07T00:00:00.000Z", { networkPolicy: policy }).check(request, new AbortController().signal); assert.equal(replay.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(replay)); assert.equal(arrivals, beforeReplay, "replay consumes only recorded HAR responses"); assert.equal(replayTrace.some(detail => JSON.stringify(detail).includes('"pathname":"/slots"') && JSON.stringify(detail).includes('"outcome":"ADMITTED"')), true, "Replay must consume the recorded dynamic response"); }
    finally { await replayExecutor.close(); }
  } finally { await sourceExecutor.close(); await new Promise<void>(resolve => receiver.close(() => resolve())); await rm(directory, { recursive: true, force: true }); }
});

/** Match the documented exact-time guide serializer used by the production Adapter. */
function exactGuideAvailabilityUrl(sourceUrl: string, date: string, partySize: number, time: string): string {
  const value = new URL(sourceUrl);
  value.searchParams.set("date", date);
  value.searchParams.set("time", time);
  value.searchParams.set("num_people", String(partySize));
  value.searchParams.set("availability_format", "datetime");
  value.searchParams.set("availability_mode", "same_meal_time");
  return value.toString();
}

// Live H003 reached observed party controls but passed dom: references as CSS selectors.
// Exercise real Executor -> runtime -> DOM for both session implementations. The model
// and network are synthetic; the resulting date/party display is the independent oracle.
for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} applies authoritative date and party through observed DOM references`, async () => {
    const runtime = localFixture(`<title>Read-only availability</title>
      <select aria-label="Party size"><option value="2">2</option><option value="10">10</option></select>
      <input aria-label="Visit date" type="date" value="2026-09-07">
      <output id="result">2026-09-07 / 2</output>
      <script>for (const el of document.querySelectorAll('select,input')) el.oninput=()=>{
        document.querySelector('output').textContent=document.querySelector('input').value+' / '+document.querySelector('select').value;
      };</script>`, runtimeKind);
    let step = 0;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: {
      async decide(input) {
        const party = ++step === 1;
        const target = input.observation.targets.find((item) => item.label === (party ? "Party size" : "Visit date"));
        assert.ok(target);
        if (party) {
          assert.equal(target.value, "2", "the current select value is not inferred from the first option");
          assert.deepEqual(target.options, [
            { value: "2", label: "2", selected: true, disabled: false },
            { value: "10", label: "10", selected: false, disabled: false },
          ]);
        }
        const option = input.observation.targets.find(item => item.kind === "OPTION" && item.ownerRef === target.ref && item.label === "10");
        return party
          ? { type: "CHOOSE_OPTION", targetRef: option!.ref, field: "PARTY_SIZE", reason: "Apply the requested party." }
          : { type: "FILL_AUTHORITATIVE", targetRef: target.ref, field: "DATE", reason: "Apply the requested date." };
      },
    } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({
        taskId: "fixture:observed-inputs", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-18", partySize: 10, timeWindow: { earliest: "17:30", latest: "22:00" }, hardCriteria: [] },
        objective: "Apply the authoritative date and party size to a public availability query.",
        completion: (snapshot) => ({ complete: /2026-09-18 \/ 10/.test(snapshot.text), reason: "The complete requested parameters are not visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
      });
      assert.equal(result.status, "COMPLETED", JSON.stringify(result));
      assert.match(result.snapshot.text, /2026-09-18 \/ 10/);
    } finally { await executor.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} settles delayed visible query state`, async () => {
    const runtime = localFixture(`<title>Query state</title>
      <button id="trigger" type="button">Trigger visible update</button><button id="apply" type="button">Apply</button><select id="party"><option value="2" selected>2</option><option value="4">4</option></select>
      <p id="noise">Still loading</p><script>
        document.querySelector('#trigger').onclick=()=>window.setTimeout(()=>document.querySelector('#noise').textContent='Unrelated page message',20);
        document.querySelector('#apply').onclick=()=>window.setTimeout(()=>{
          const party=document.querySelector('#party');party.value='4';party.disabled=true;
        },20);
      </script>`, runtimeKind);
    const session = await runtime.openSession({ signal: new AbortController().signal });
    try {
      await session.navigate(url);
      const beforeNoise = await session.snapshot();
      assert.notEqual(beforeNoise.interactiveState, undefined);
      await session.click("#trigger");
      assert.equal(await session.waitForSettled!(beforeNoise, 700), true, "visible text wakes a fresh read but cannot itself accept a result");
      const beforeApply = await session.snapshot();
      assert.match(beforeApply.interactiveState ?? "", /"value":"2"/);
      assert.match(beforeApply.interactiveState ?? "", /"disabled":false/);
      await session.click("#apply");
      assert.equal(await session.waitForSettled!(beforeApply, 700), true, "a delayed selected value or disabled state wakes the bounded wait");
      const after = await session.snapshot();
      assert.match(after.interactiveState ?? "", /\"value\":\"4\"/);
      assert.match(after.interactiveState ?? "", /\"disabled\":true/);
    } finally { await session.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} settles hidden and property-only control mutations without treating either as inventory`, async () => {
    const runtime = localFixture(`<title>Wait projection</title>
      <input id="analytics" type="hidden" value="before"><input id="hidden-style" value="before" style="visibility:hidden">
      <button id="apply" type="button">Apply</button><input id="consent" type="checkbox" aria-label="Observed state"><script>
        window.setTimeout(()=>{document.querySelector('#analytics').value='after';document.querySelector('#hidden-style').value='after'},20);
        document.querySelector('#apply').onclick=()=>window.setTimeout(()=>{document.querySelector('#consent').checked=true},20);
      </script>`, runtimeKind);
    const session = await runtime.openSession({ signal: new AbortController().signal });
    try {
      await session.navigate(url);
      const beforeHidden = await session.snapshot();
      assert.equal(await session.waitForSettled!(beforeHidden, 80), false, "hidden analytics and visibility:hidden inputs are not query-state progress");
      const beforeChecked = await session.snapshot();
      assert.match(beforeChecked.interactiveState ?? "", /"checked":false/);
      await session.click("#apply");
      assert.equal(await session.waitForSettled!(beforeChecked, 700), true, "a visible checked property mutation wakes a fresh read");
      assert.match((await session.snapshot()).interactiveState ?? "", /\"checked\":true/);
    } finally { await session.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} recovers once from a visible header obstruction and re-observes before the next click`, async () => {
    const runtime = localFixture(`<title>Obstructed query</title>
      <style>#blocker{position:fixed;inset:0 auto auto 0;width:100%;height:90px;z-index:3;background:#fff}</style>
      <button id="apply" type="button" style="position:relative;z-index:1" onclick="document.querySelector('#result').textContent='Current availability 19:00'">Find availability</button>
      <header id="blocker"><strong>Search suggestions</strong></header><output id="result">Select the public query.</output>
      <script>addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelector('#blocker')?.remove()})</script>`, runtimeKind);
    const diagnostics: import("../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
    let decisions = 0;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
      onDiagnostic: event => diagnostics.push(event),
      modelDecision: { async decide(input) {
        decisions += 1;
        const action = input.observation.targets.find(target => target.label === "Find availability");
        assert.ok(action);
        return { type: "CLICK", targetRef: action.ref, reason: "Run the observed public query." };
      } },
    });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({
        taskId: `fixture:obstruction:${runtimeKind}`, source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Run the public availability query.",
        completion: snapshot => ({ complete: /Current availability 19:00/.test(snapshot.text), reason: "The current public result is not visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
      });
      assert.equal(result.status, "COMPLETED", JSON.stringify(result));
      assert.equal(decisions, 2, "the recovery must re-observe and obtain a fresh proposal");
      assert.ok(diagnostics.some(event => event.detail === "ACTION_OBSTRUCTED"));
      assert.ok(diagnostics.some(event => event.detail === "ACTION_OBSTRUCTION_RECOVERED:header"));
    } finally { await executor.close(); }
  });
}

for (const order of ["party-first", "date-first"] as const) test(`TableCheck real Chromium Adapter completes a dynamic scrollable guest query (${order}) within 24 operations`, async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.outletName = "Fixture restaurant";
  candidate.restaurant.address = "1-1 Tokyo Fixture Street";
  candidate.restaurant.sourceIds = { tablecheck: "fixture", tablecheckNativeGuideUri: url };
  const guestOptions = Array.from({ length: 11 }, (_, index) => {
    const count = index === 10 ? "10+" : String(index + 1);
    return `<div role="option" ${count === "10" ? 'onclick="selectGuest()"' : ""}>${count} ${count === "1" ? "guest" : "guests"}</div>`;
  }).join("");
  const runtime = localFixture(`<title>TableCheck query</title>${identity}
    <style>#guests{height:170px;overflow-y:auto}#guests [role=option]{height:26px}</style>
    <div data-testid="Venue Availability"><form method="post">
    <button id="next" type="button" onclick="nextMonth()">Next month</button>
    <button id="date" type="button" data-testid="day" data-date="2026-10-2" hidden onclick="selectDate()">Friday 2</button>
    <div data-testid="Venue Pax Select" id="pax-2"><button id="party" type="button" role="combobox" aria-controls="guests" aria-expanded="false" onclick="openParty()">Any party size</button>
    <div id="guests" role="listbox" aria-label="Guest choices" hidden>${guestOptions}</div></div>
    <input id="actual-date" type="hidden" value=""><input id="actual-pax" type="hidden" value="">
    <div data-testid="Venue Time Select" id="time-19:00"></div><div id="slots"></div><output id="selected">No selected request</output>
    <button type="submit">Book</button></form></div>
    <script>let dateSelected=false,guestSelected=false;function openParty(){const list=document.querySelector('#guests');list.hidden=false;document.querySelector('#party').setAttribute('aria-expanded','true')}
    function nextMonth(){document.querySelector('#date').hidden=false;document.querySelector('#next').hidden=true}
    function selectDate(){dateSelected=true;document.querySelector('#actual-date').value='2026-10-02';document.querySelector('#date').setAttribute('aria-selected','true');maybeResult()}
    function selectGuest(){guestSelected=true;document.querySelector('#actual-pax').value='10';document.querySelector('[data-testid="Venue Pax Select"]').id='pax-10';document.querySelector('#party').textContent='10 guests';document.querySelector('#party').setAttribute('aria-expanded','false');document.querySelector('#guests').hidden=true;maybeResult()}
    function maybeResult(){if(!dateSelected||!guestSelected)return;document.querySelector('#selected').textContent='2026-10-02 / 10 guests';const slot=document.createElement('a');slot.href='/en/shops/fixture/reserve?start_date=2026-10-02&pax=10&start_time=19:00';slot.textContent='19:00';document.querySelector('#slots').append(slot)}</script>`);
  const actions: string[] = [];
  const events: import("../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12,
    maxOperationsPerCandidate: 24,
    onDiagnostic: event => events.push(event),
    modelDecision: { async decide(input) {
      const targets = input.observation.targets;
      const party = targets.find(item => item.role === "combobox" && (item.label === "Any party size" || item.label === "10 guests"));
      const next = targets.find(item => item.label === "Next month");
      const date = targets.find(item => item.label === "Friday 2");
      const list = targets.find(item => item.role === "listbox" && item.scrollable);
      const ten = targets.find(item => item.label === "10 guests" && item.kind === "OPTION");
      const tenPlus = targets.find(item => item.label === "10+ guests");
      if (tenPlus) assert.equal(tenPlus.availableActions?.includes("CHOOSE_OPTION:PARTY_SIZE"), false, "10+ is not an exact party of ten");
      const selectDate = () => ({ type: "CLICK_AUTHORITATIVE" as const, targetRef: date!.ref, field: "DATE" as const, reason: "Select exact date." });
      const openParty = () => ({ type: "CLICK" as const, targetRef: party!.ref, reason: "Open the observed party choices." });
      const partyIsTen = party?.label === "10 guests";
      const nextMonth = () => ({ type: "CLICK" as const, targetRef: next!.ref, reason: "Reveal the next observed calendar month." });
      const chooseTen = () => {
        assert.equal(ten!.outsideViewport, true, "the requested option is exposed while clipped by the list");
        return { type: "CHOOSE_OPTION" as const, targetRef: ten!.ref, field: "PARTY_SIZE" as const, reason: "Select exactly ten guests; executor reveals it." };
      };
      if (order === "party-first") {
        if (!partyIsTen && party && !list && !ten) { actions.push("PARTY"); return openParty(); }
        if (next) { actions.push("NEXT"); return nextMonth(); }
        if (!partyIsTen && ten) { actions.push("TEN"); return chooseTen(); }
        assert.ok(date && !date.selected, "the exact date remains actionable after the selected party is confirmed");
        actions.push("DATE");
        return selectDate();
      }
      if (next) { actions.push("NEXT"); return nextMonth(); }
      if (date && !date.selected) { actions.push("DATE"); return selectDate(); }
      if (!partyIsTen && party && !list && !ten) { actions.push("PARTY"); return openParty(); }
      assert.ok(!partyIsTen && ten, "the exact option remains selectable in its existing owner list");
      actions.push("TEN");
      return chooseTen();
    } },
  });
  const signal = new AbortController().signal;
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({
      candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-10-02", partySize: 10,
      timeWindow: { earliest: "17:30", latest: "22:00" }, hardCriteria: [],
    }, signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify({ result, actions, events }));
    assert.equal(result.offers.length, 1);
    assert.equal(actions.includes("SCROLL"), false, "revealing an option consumes no model decision");
    assert.deepEqual(actions, order === "party-first"
      ? ["PARTY", "NEXT", "TEN", "DATE"]
      : ["NEXT", "DATE", "PARTY", "TEN"]);
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    const finalPage = await session.snapshot();
    assert.match(finalPage.text, /2026-10-02 \/ 10 guests/);
    assert.match(finalPage.html, /id="actual-date"[^>]*value="2026-10-02"/);
    assert.match(finalPage.html, /id="actual-pax"[^>]*value="10"/);
    assert.match(finalPage.html, /data-date="2026-10-2"[^>]*aria-selected="true"/);
    assert.match(finalPage.html, /id="pax-10"/);
    assert.match(finalPage.html, /href="\/en\/shops\/fixture\/reserve\?start_date=2026-10-02&amp;pax=10&amp;start_time=19:00"/);
    assert.equal(events.some(event => event.event === "BUDGET_EXHAUSTED"), false);
    assert.ok(events.filter(event => event.event === "OPERATION_STARTED").length <= 24);
  } finally { await executor.close(); }
});

test("native Tabelog detail uses real local Chromium controls before accepting its bound vacancy response", async () => {
  const { dynamicTabelogSourcePages, date, reference } = await import("../../eval/restaurant/agent-loop/native-fixed-source-pages.js");
  const { TabelogBrowserAvailability } = await import("../../integrations/tabelog/tabelog-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.id = "tabelog:en/tokyo/A1304/A130401/100";
  candidate.restaurant.outletName = "Native Dynamic Tabelog 100";
  candidate.restaurant.address = "Shibuya 100, Tokyo";
  candidate.restaurant.sourceIds = {
    tabelog: "en/tokyo/A1304/A130401/100",
    tabelogNativeDetailUri: "https://tabelog.com/en/tokyo/A1304/A130401/100/",
  };
  const actions: string[] = [];
  const executor = new BrowserTaskExecutor(dynamicTabelogSourcePages(), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    const dateTarget = input.observation.targets.find((target) => target.label === "Date 2026-08-19");
    const guestsTarget = input.observation.targets.find((target) => target.label === "Guests 2");
    if (dateTarget && !dateTarget.selected) {
      actions.push("DATE");
      return { type: "CLICK_AUTHORITATIVE" as const, targetRef: dateTarget.ref, field: "DATE" as const, reason: "Select the observed requested date." };
    }
    assert.ok(guestsTarget && !guestsTarget.selected, "the unselected exact party control is exposed after the date selection");
    actions.push("PARTY_SIZE");
    return { type: "CLICK_AUTHORITATIVE" as const, targetRef: guestsTarget.ref, field: "PARTY_SIZE" as const, reason: "Select the observed requested party size." };
  } } });
  const signal = new AbortController().signal;
  try {
    const read = await new TabelogBrowserAvailability(executor, () => reference.toISOString()).check({
      candidates: [candidate], candidateIds: [candidate.restaurant.id], date, partySize: 2,
      timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: ["omakase"],
    }, signal);
    const session = await executor.acquire(signal, "TABELOG", "AVAILABILITY");
    const page = await session.snapshot();
    assert.equal(read.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(read));
    assert.equal(read.offers.length, 1);
    assert.deepEqual(actions, ["DATE", "PARTY_SIZE"]);
    assert.equal(read.offers[0]?.dateTime, "2026-08-19T19:00:00+09:00");
    assert.match(page.html, /class="js-calendar-day-target is-selectable is-current"[^>]*data-year="2026"[^>]*data-month="8"[^>]*data-day="19"/);
    assert.match(page.html, /js-people-hidden-value" type="hidden" value="2"/);
    const vacancy = page.responses?.find((response) => response.url.includes("/en/booking/calendar/find_vacancy/"));
    assert.deepEqual(vacancy?.body, {
      base_date: { year: 2026, month: 8, day: 19 }, members: 2,
      selection: { 0: { time: "19:00", url: "/en/booking/form_course/new?rcd=100&member=2&visit_date=20260819&visit_time=1900" } },
    });
  } finally {
    await executor.close();
  }
});

for (const outcome of ["AVAILABLE", "UNAVAILABLE"] as const) {
test(`native dynamic Tabelog ${outcome} reaches formal H001 ${outcome === "AVAILABLE" ? "presentation" : "TableCheck continuation and no verified result"} with page-owned query evidence`, async () => {
  const { dynamicTabelogSourcePages, center, date, reference } = await import("../../eval/restaurant/agent-loop/native-fixed-source-pages.js");
  const { traceBrowserSession } = await import("../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js");
  const { GooglePlacesClient } = await import("../../integrations/google/google-places-client.js");
  const { GooglePlacesRestaurantSearch } = await import("../../integrations/google/google-places-restaurant-search.js");
  const { createLiveReadAssembly } = await import("../../integrations/restaurant-search/live-read-assembly.js");
  const { LIVE_READ_DEBUG_INVESTIGATION_BUDGET } = await import("../../application/live-read-investigation-budget.js");
  const { LiveBrowserAvailability } = await import("../../integrations/restaurant-availability/live-browser-availability.js");
  const { createHybridReadComposition } = await import("../../eval/restaurant/agent-loop/hybrid-read-composition.js");
  const { evaluateRestaurantHybridLiveArtifact } = await import("../../eval/restaurant/agent-loop/diagnostic-evaluator.js");
  const { loadFrozenLiveCases, RESTAURANT_READ_DEVELOPMENT_CASE_PATH } = await import("../../eval/restaurant/agent-loop/live-case-materializer.js");
  const trace: Array<{ sequence: number; at: string; kind: string; detail: unknown }> = [];
  const rawRuntime = dynamicTabelogSourcePages({ result: outcome });
  const runtime = { openSession: async (input: { signal: AbortSignal }) => traceBrowserSession(
    await rawRuntime.openSession(input), "TABELOG", (kind, detail) => { const sequence = trace.length + 1; trace.push({ sequence, at: reference.toISOString(), kind, detail }); return sequence; },
  ) };
  const reply = (outputText: string, purpose: string) => ({ invocationId: purpose, provider: "FIXTURE" as const, model: "scripted-formal-browser", outputText, finishReason: "TOOL_CALLS" as const, latencyMs: 0 });
  const browserActions: string[] = [];
  let modelCalls = 0;
  let availabilityReadFirst = false;
  const model: import("../../core/model/contracts.js").ModelGateway = { async complete(request) {
    assert.ok(++modelCalls <= 50, "the formal local composition retains its total model-call ceiling");
    if (request.purpose === "restaurant_discovery_retrieval") {
      const input = JSON.parse(request.messages.find(item => item.role === "user")!.content);
      return reply(JSON.stringify({ choice: input.current ? "KEEP" : "KEYWORD", keyword: input.current ? "" : "omakase", criterionRef: input.current ? "" : "criterion:0", categoryUrl: "", reason: "Controlled retrieval; preserve the current sparse source result." }), request.purpose);
    }
    if (request.purpose === "restaurant_semantic_interpret") return reply(JSON.stringify({ schemaVersion: "3", facts: [
      { field: "TARGET", operation: "ASSERT", value: { kind: "TARGET", goal: "AVAILABILITY", query: "omakase spot", selectionScope: "OPEN_ENDED" } },
      { field: "AREA", operation: "ASSERT", value: { kind: "AREA", query: "near Shibuya" } },
      { field: "DATE", operation: "ASSERT", value: { kind: "DATE", value: date, raw: "tonight" } },
      { field: "TIME_WINDOW", operation: "ASSERT", value: { kind: "TIME_WINDOW", earliest: "19:00", latest: "19:00", raw: "7 PM" } },
      { field: "PARTY_SIZE", operation: "ASSERT", value: { kind: "PARTY_SIZE", value: 2 } },
      { field: "CRITERION", operation: "ASSERT", value: { kind: "CRITERION", text: "omakase", strength: "HARD", polarity: "POSITIVE" } },
    ] }), request.purpose);
    if (request.purpose === "restaurant_fact_judgment") {
      const input = JSON.parse(request.messages.find(item => item.role === "user")!.content) as { sourceDocuments: Array<{ id: string; statements: Array<{ id: string; text: string }> }> };
      const selected = input.sourceDocuments.flatMap(document => document.statements.filter(item => /omakase course/i.test(item.text)).map(item => ({ documentId: document.id, statementIds: [item.id] })))[0];
      return reply(JSON.stringify({ sourceSelections: selected ? [selected] : [], judgments: selected ? [{ criterion: "omakase", outcome: "SUPPORTED", scope: "RESTAURANT_CATEGORY_TYPE", evidenceIds: [selected.documentId] }] : [] }), request.purpose);
    }
    if (request.purpose === "browser_read_decide") {
      const input = JSON.parse(request.messages.find(item => item.role === "user")!.content) as { observation: { targets: Array<{ ref: string; label: string; selected?: boolean; availableActions?: string[] }> } };
      const region = input.observation.targets.find(target => target.label === "Shibuya" && target.availableActions?.includes("OPEN_LINK"));
      if (region) return reply(JSON.stringify({ action: "OPEN_LINK", targetRef: region.ref, authoritativeField: "NONE", requestedState: "NONE", reason: "Select the observed region before reading its list." }), request.purpose);
      const dateTarget = input.observation.targets.find(target => target.label === "Date 2026-08-19" && !target.selected);
      const partyTarget = input.observation.targets.find(target => target.label === "Guests 2" && !target.selected);
      const target = dateTarget ?? partyTarget;
      assert.ok(target, "the browser model receives only the remaining observed authoritative control");
      browserActions.push(dateTarget ? "DATE" : "PARTY_SIZE");
      return reply(JSON.stringify({ action: "CLICK_AUTHORITATIVE", targetRef: target.ref, authoritativeField: dateTarget ? "DATE" : "PARTY_SIZE", requestedState: "NONE", reason: "Choose the observed requested query value." }), request.purpose);
    }
    if (request.purpose === "restaurant_agent_decide") {
      const context = (JSON.parse(request.messages.find(item => item.role === "user")!.content) as { context: {
        factInvestigableCandidateIds?: string[]; checkableCandidateIds?: string[]; presentation?: Array<{ candidateId: string; eligible: boolean }>;
        searchAvailability?: { available: boolean }; readCompletion?: { allowed: boolean };
      } }).context;
      const eligible = context.presentation?.filter(item => item.eligible).map(item => item.candidateId) ?? [];
      const action = (type: string, candidateIds: string[] = []) => ({ type, question: "", relatedFields: [], retrievalHint: "", candidateIds, candidateId: "", offerId: "", decisionSummary: "Use current evidence" });
      // The real model legally checked availability before it requested a
      // same-source fact read. Keep that ordering here so the later fact
      // observation must retire the former availability-read fact citation.
      if (outcome === "AVAILABLE" && !availabilityReadFirst && context.checkableCandidateIds?.length) {
        availabilityReadFirst = true;
        return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds)), request.purpose);
      }
      if (context.factInvestigableCandidateIds?.length) return reply(JSON.stringify(action("INVESTIGATE_CANDIDATE_FACTS", context.factInvestigableCandidateIds)), request.purpose);
      if (context.checkableCandidateIds?.length) return reply(JSON.stringify(action("CHECK_AVAILABILITY", context.checkableCandidateIds)), request.purpose);
      if (eligible.length) return reply(JSON.stringify(action("PRESENT_RESULTS", eligible)), request.purpose);
      if (context.searchAvailability?.available) return reply(JSON.stringify(action("SEARCH_RESTAURANTS")), request.purpose);
      if (context.readCompletion?.allowed) return reply(JSON.stringify(action("END_READ")), request.purpose);
      assert.fail(`No permitted formal agent action: ${JSON.stringify(context)}`);
    }
    assert.fail(`Unexpected fixture model purpose ${request.purpose}`);
  } };
  const google = new GooglePlacesClient({ apiKey: "fixture-only", fetchImplementation: async () => new Response(JSON.stringify({ places: [{ id: "shibuya", displayName: { text: "Shibuya" }, formattedAddress: "Shibuya, Tokyo", location: center, types: ["train_station"], addressComponents: [{ longText: "Tokyo", types: ["locality"] }] }] }), { status: 200 }) });
  const native = createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET, { google, browser: runtime, model, clock: { now: () => reference } });
  const taskId = `native-dynamic-tabelog-formal:${outcome}`;
  const composition = createHybridReadComposition({ taskId, runId: `run:${taskId}`, clock: { now: () => reference }, model, ...native });
  const frozen = (await loadFrozenLiveCases(RESTAURANT_READ_DEVELOPMENT_CASE_PATH)).find(item => item.id === "h001")!;
  const semantic = await composition.interpretAndDispatch({ taskId, message: String(frozen.content), referenceTime: frozen.reference_time, timezone: "Asia/Tokyo" });
  assert.equal(semantic.status, "PROPOSED");
  const loop = await composition.coordinator.run(taskId);
  const state = composition.runtime.snapshot(taskId).domainState;
  const candidateId = "tabelog:en/tokyo/A1304/A130401/100";
  assert.equal(state.availabilityChecks[candidateId]?.status, outcome, JSON.stringify(state));
  // The reducer's check is intentionally compact; the provider identity lives
  // on the accepted AVAILABILITY evidence it names, rather than on a duplicate
  // check field.
  const availabilityEvidence = state.readEvidence.find((item) => item.kind === "AVAILABILITY" && item.candidateId === candidateId);
  assert.equal(availabilityEvidence?.entityMatch?.confidence, "HIGH");
  assert.equal(state.factChecks?.[candidateId]?.status, "COMPLETED");
  const sourceFacts = state.readEvidence.filter((evidence) => evidence.candidateId === candidateId
    && evidence.kind === "RESTAURANT_FACT" && evidence.provider !== "MODEL_JUDGMENT");
  assert.ok(sourceFacts.length > 0);
  assert.ok(sourceFacts.every((evidence) => evidence.observedAt === reference.toISOString()),
    "native source facts use the controlled composition clock rather than wall time");
  assert.ok(state.candidates.find((candidate) => candidate.restaurant.id === candidateId)?.matchReasons
    .includes("Verified HARD criterion from source: omakase"));
  assert.deepEqual(browserActions, ["DATE", "PARTY_SIZE"], "request values must come from real observed DOM actions");
  const navigations = trace.filter(item => item.kind === "SESSION_CALL" && (item.detail as { method?: string }).method === "navigate")
    .map(item => (item.detail as { args: string[] }).args[0]!);
  assert.match(navigations[0]!, /^https:\/\/tabelog\.com\/en\/tokyo\/rstLst\//);
  const tableCheckSearches = navigations.filter(value => new URL(value).hostname === "www.tablecheck.com");
  if (outcome === "AVAILABLE") {
    assert.equal(state.phase, "PRESENT_RESULTS", JSON.stringify(state));
    assert.deepEqual(state.presentedResults?.candidateIds, [candidateId]);
    assert.deepEqual(tableCheckSearches, [], "the qualified first source delivers directly");
    const reads = composition.trajectories.steps.filter(step => step.actionValidation?.status === "ALLOWED"
      && (step.agentAction?.type === "CHECK_AVAILABILITY" || step.agentAction?.type === "INVESTIGATE_CANDIDATE_FACTS"));
    assert.deepEqual(reads.slice(0, 2).map(step => step.agentAction?.type), ["CHECK_AVAILABILITY", "INVESTIGATE_CANDIDATE_FACTS"]);
    const superseded = state.factChecks?.[candidateId]?.supersededEvidenceIds ?? [];
    assert.ok(superseded.some(id => id.includes("tabelog-hard-criteria")), "the later same-source fact read must retire the availability-read fact");
    const cited = new Set(state.presentedResults?.evidenceIds ?? []);
    assert.equal(superseded.some(id => cited.has(id)), false, "presentation must not revive a superseded availability-read fact");
    const currentFactIds = (state.factChecks?.[candidateId]?.evidenceIds ?? []).filter(id =>
      state.readEvidence.some(evidence => evidence.evidenceId === id && evidence.kind === "RESTAURANT_FACT"),
    );
    assert.ok(currentFactIds.length > 0 && currentFactIds.every(id => cited.has(id)), "presentation cites the latest same-source fact record");
    assert.equal(loop.status, "TERMINAL");
    const artifact = {
      schemaVersion: "1", mode: "SYNTHETIC_CONTROL", status: "SUCCEEDED", stage: "AGENT_LOOP", caseId: "h001", runId: `run:${taskId}`,
      materializedCase: frozen, semantic, finalSnapshot: composition.runtime.snapshot(taskId), trajectories: composition.trajectories.steps,
      events: composition.runtime.eventLog, loop, sourceEnvironment: { network: "OFFLINE_FIXED_TRANSPORT", browser: "LOCAL_CHROMIUM_DYNAMIC_FIXED_PAGE" },
      sourceTrace: { browserTrace: trace },
      runCeilings: native.runCeilings,
      resourceUsage: { elapsedMs: 1, modelCallsStarted: modelCalls, browserModelCalls: browserActions.length, agentDecisions: 0, googleRequests: { total: 1, namedPlaceResolution: 1, discovery: 0, placeDetails: 0, reverseAddressObservation: 0 } },
    };
    const encoded = JSON.stringify(artifact);
    const evaluation = evaluateRestaurantHybridLiveArtifact(artifact, { path: "dynamic-availability-first.execution.json", sha256: createHash("sha256").update(encoded).digest("hex") });
    assert.equal(evaluation.execution.taskProducedQualifiedResult, "YES", JSON.stringify(evaluation.findings));
  } else {
    assert.equal(state.phase, "NO_VERIFIED_RESULT", JSON.stringify(state));
    assert.equal(state.presentedResults, undefined);
    assert.equal(Object.values(state.availability).flat().length, 0);
    assert.equal(tableCheckSearches.length, 1, "Tabelog UNAVAILABLE causes one ordinary second-source query; unsupported TableCheck filters are skipped");
    assert.equal(new URL(tableCheckSearches[0]!).pathname, "/en/japan/search");
    assert.equal(state.searchContinuation?.exhausted, true);
    assert.match(state.noVerifiedResult?.remainingGaps.join(" ") ?? "", /bounded discovery plan/);
    const steps = composition.trajectories.steps;
    assert.equal(steps.some(step => step.agentAction?.type === "PRESENT_RESULTS"), false);
    const funnels = steps.flatMap(step => step.executionMetadata?.nativeDiscoveryFunnel ? [step.executionMetadata.nativeDiscoveryFunnel] : []);
    assert.deepEqual(funnels.map(funnel => ({ source: funnel.source, raw: funnel.rawSourceLinks,
      parsed: funnel.parsedOutlets, inspected: funnel.inspectedOutlets, accepted: funnel.accepted,
      rejected: funnel.rejected.length, deferred: funnel.deferredByBatchCap.length, exhausted: funnel.sourceExhausted })), [
      { source: "TABELOG", raw: 1, parsed: 1, inspected: 1, accepted: 1, rejected: 0, deferred: 0, exhausted: "UNKNOWN" },
      { source: "TABLECHECK", raw: 0, parsed: 0, inspected: 0, accepted: 0, rejected: 0, deferred: 0, exhausted: "UNKNOWN" },
    ]);
    assert.ok(steps.findIndex(step => step.executionMetadata?.provider === "TABLECHECK")
      > steps.findIndex(step => step.agentAction?.type === "CHECK_AVAILABILITY"), "source continuation follows the first-source availability read");
    assert.equal(steps.at(-1)?.agentAction?.type, "END_READ");
  }
  // The second-source snapshot is empty; retain the last first-source query observation as the oracle.
  const finalSnapshot = [...trace].reverse().find(item => {
    const snapshot = item.detail as { queryRegions?: unknown[]; responses?: Array<{ body?: { base_date?: unknown } }> };
    return item.kind === "SNAPSHOT" && (snapshot.queryRegions?.length ?? 0) > 0
      && snapshot.responses?.some(response => response.body?.base_date !== undefined);
  })?.detail as { queryRegions?: Array<{ markup: string }>; responses?: Array<{ body?: { base_date?: { year?: number; month?: number; day?: number }; members?: number; selection?: unknown[] } }> } | undefined;
  assert.ok(finalSnapshot?.queryRegions?.length, "the artifact-safe trace retains the provider booking region");
  assert.equal(finalSnapshot?.responses?.at(-1)?.body?.base_date?.day, 19);
  assert.equal(finalSnapshot?.responses?.at(-1)?.body?.members, 2);
  assert.match(finalSnapshot!.queryRegions![0]!.markup, /js-calendar-day-target is-selectable is-current[^>]*data-year="2026"[^>]*data-month="8"[^>]*data-day="19"/);
  assert.match(finalSnapshot!.queryRegions![0]!.markup, /js-people-button is-active[^>]*>2<\/button>/);
  if (outcome === "UNAVAILABLE") {
    const body = finalSnapshot?.responses?.at(-1)?.body;
    assert.deepEqual({ base_date: body?.base_date, members: body?.members }, {
      base_date: { year: 2026, month: 8, day: 19 }, members: 2,
    }, "empty vacancy responses still retain the final source query date and party");
    // The artifact sanitizer omits an empty selection array.  Its absence is
    // not stock proof; the provider page's explicit unavailable slot drives
    // the UNAVAILABLE outcome above.
    assert.equal("selection" in (body ?? {}), false);
  }
});
}

test("button name metadata does not replace visible time or Reserve safety label", async () => {
  const runtime = localFixture(`<button name="action" value="slot-20" type="button">20:00</button><button name="action" value="reserve" type="button">Reserve</button>`);
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    const time = input.observation.targets.find(target => target.label === "20:00");
    const reserve = input.observation.targets.find(target => target.label === "Reserve");
    assert.ok(time?.availableActions?.includes("CLICK"));
    assert.equal(reserve?.availableActions?.includes("CLICK"), false);
    assert.equal(reserve?.rejectionReason, "WRITE_PROHIBITED");
    return { type: "REQUEST_HUMAN_HELP", reason: "Read-only label audit complete" };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    await executor.runSkill({ taskId: "button-visible-label", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Audit public controls",
      completion: () => ({ complete: false, reason: "No availability" }) });
  } finally { await executor.close(); }
});

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} chooses a visible time option with an opaque native value and reads it back`, async () => {
    const runtime = localFixture(`<title>Public time query</title>
      <label for="arrival">Arrival time</label><select id="arrival" aria-label="Arrival time">
        <option value="">Choose time</option><option value="1763593200000">7:00 PM</option><option value="1763600400000">9:00 PM</option>
      </select><output id="selected">No time selected</output>
      <script>document.querySelector('select').onchange=event=>{document.body.dataset.selections=(document.body.dataset.selections||'')+event.target.value+';';document.querySelector('output').textContent=event.target.selectedOptions[0].textContent;if(event.target.value==='1763593200000'){const other=document.createElement('select');other.setAttribute('aria-label','Unrelated');document.body.prepend(other)}};</script>`, runtimeKind);
    const attempted: string[] = [];
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      const owner = input.observation.targets.find(target => target.kind === "SELECT" && target.label === "Arrival time");
      assert.ok(owner);
      const desired = input.observation.targets.find(target => target.kind === "OPTION" && target.ownerRef === owner.ref && target.label === (attempted.length ? "7:00 PM" : "9:00 PM"));
      assert.ok(desired);
      attempted.push(desired.label);
      return { type: "CHOOSE_OPTION", targetRef: desired.ref, field: "TIME", reason: "Choose the observed arrival time." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({
        taskId: "fixture:opaque-time", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"],
        goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-18", partySize: 2, timeWindow: { earliest: "18:30", latest: "19:30" }, hardCriteria: [] },
        objective: "Choose a requested public query time.",
        completion: (snapshot, controls) => ({ complete: /7:00 PM/.test(snapshot.text) && controls.some(control => control.kind === "SELECT" && control.value === "1763593200000"), reason: "The requested time is not selected.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
      });
      assert.equal(result.status, "COMPLETED");
      assert.deepEqual(attempted, ["9:00 PM", "7:00 PM"]);
      assert.equal(result.controls.find(control => control.kind === "SELECT" && control.label === "Arrival time")?.value, "1763593200000");
      // Read page effects independently of the Registry: a final correct value
      // must not conceal an earlier out-of-request selection.
      const actual = await session.snapshot();
      assert.match(actual.html, /data-selections="1763593200000;"/);
      assert.match(actual.html, /<output id="selected">7:00 PM<\/output>/);
    } finally { await executor.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} binds a button combobox to its own listbox option through the strict browser wire`, async () => {
    const runtime = localFixture(`<button type="button" role="combobox" aria-controls="arrival-list" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('arrival-list').hidden=false">Choose time</button>
      <ul id="arrival-list" role="listbox" hidden><li role="option" onclick="document.querySelector('button').setAttribute('aria-label','7:15 PM');document.querySelector('button').setAttribute('aria-expanded','false');document.getElementById('arrival-list').hidden=true;document.querySelector('output').textContent='Selection settled'">7:15 PM</li></ul><output>Waiting</output>`, runtimeKind);
    let calls = 0;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; label: string; ownerRef?: string; availableActions?: string[] }> } };
      calls += 1;
      if (calls === 1) assert.equal(payload.observation.targets.filter(target => target.label === "Arrival time").length, 1, "button combobox is observed once");
      const target = calls === 1 ? payload.observation.targets.find(item => item.kind === "BUTTON" && item.label === "Arrival time")
        : payload.observation.targets.find(item => item.kind === "OPTION" && item.label === "7:15 PM" && item.ownerRef);
      assert.ok(target);
      assert.ok(target.availableActions?.includes(calls === 1 ? "CLICK" : "CHOOSE_OPTION:TIME"));
      return { invocationId: `fixture:button-combobox:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : "CHOOSE_OPTION", targetRef: target.ref, authoritativeField: calls === 1 ? "NONE" : "TIME", requestedState: "NONE", reason: "Choose the observed query control" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "fixture:button-combobox", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
        objective: "Choose the observed arrival time.", completion: snapshot => ({ complete: /Selection settled/.test(snapshot.text), reason: "The choice has not settled.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(calls, 2);
      assert.equal(result.controls.find(control => control.role === "combobox")?.label, "7:15 PM");
    } finally { await executor.close(); }
  });
}

for (const initialTime of ["17:30", "19:00"] as const) {
  test(`empty input reads its own selected display and ${initialTime === "17:30" ? "confirms a changed option" : "avoids a duplicate choice"}`, async () => {
    const runtime = localFixture(`<div data-testid="Value Container" id="other-value"><div class="fixture-singleValue">19:00</div><input role="combobox" aria-label="Other time" aria-readonly="true" aria-expanded="false" value=""></div>
      <div>Nearby time: 19:00</div>
      <div data-testid="Value Container" id="time-value"><div class="fixture-singleValue">${initialTime}</div><div><input id="time-input" role="combobox" aria-label="Time" aria-readonly="true" aria-expanded="false" value="" onkeydown="if(event.key==='ArrowDown'){this.setAttribute('aria-expanded','true');this.setAttribute('aria-controls','time-options');document.getElementById('time-options').hidden=false}"></div></div>
      <div id="time-options" role="listbox" hidden><div role="option" onclick="document.querySelector('#time-value .fixture-singleValue').textContent='19:00';document.body.dataset.selectedTime='19:00';document.getElementById('time-input').setAttribute('aria-expanded','false');document.getElementById('time-input').removeAttribute('aria-controls');document.getElementById('time-options').hidden=true">19:00</div></div>
      <script>document.body.dataset.selectedTime='${initialTime}'</script>`, "LOCAL");
    let calls = 0;
    const seenValues: Array<string | undefined> = [];
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string; value?: string; ownerRef?: string }> } };
      calls += 1;
      const time = payload.observation.targets.find(target => target.role === "combobox" && target.label === "Time");
      seenValues.push(time?.value);
      const option = payload.observation.targets.find(target => target.kind === "OPTION" && target.label === "19:00" && target.ownerRef);
      const action = calls === 1 && time?.value === "19:00" ? "COMPLETE" : calls === 1 ? "CLICK" : option ? "CHOOSE_OPTION" : "REQUEST_HUMAN_HELP";
      return { invocationId: `fixture:proxy-time:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action, targetRef: action === "CLICK" ? time?.ref : action === "CHOOSE_OPTION" ? option?.ref : "", authoritativeField: action === "CHOOSE_OPTION" ? "TIME" : "NONE", requestedState: "NONE", reason: "Use the current bound time value" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const initialControls = await session.observeControls!();
      assert.equal(initialControls.find(control => control.role === "combobox" && control.label === "Time")?.value, initialTime);
      const result = await executor.runSkill({ taskId: `fixture:proxy-time:${initialTime}`, source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Confirm the currently selected time.", completion: snapshot => ({ complete: /data-selected-time="19:00"/.test(snapshot.html), reason: "The actual page state has not selected 19:00.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, "COMPLETED", JSON.stringify({ seenValues, controls: result.controls.filter(control => control.role === "combobox") }));
      if (initialTime === "17:30") {
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Time")?.value, "19:00", JSON.stringify(result.controls.filter(control => control.role === "combobox")));
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Time")?.controlledListboxId, undefined);
        assert.equal(result.controls.find(control => control.role === "combobox" && control.label === "Other time")?.value, "19:00");
        assert.deepEqual(seenValues, ["17:30", undefined]);
        assert.equal(calls, 2);
      } else {
        assert.equal(calls, 0, "the already selected page needs no redundant model action");
        assert.deepEqual(seenValues, []);
      }
      const settled = await session.snapshot();
      assert.match(settled.html, /data-selected-time="19:00"/);
      assert.match(settled.html, /id="time-input"[^>]*value=""/);
    } finally { await executor.close(); }
  });
}

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} keeps the observed option node when unrelated buttons arrive during model decision`, async () => {
    const runtime = localFixture(`<button id="arrival" type="button" role="combobox" aria-controls="choices" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('choices').hidden=false">Arrival time</button>
      <ul id="choices" role="listbox" hidden>${["17:30", "18:00", "18:30", "19:00"].map(time => `<li role="option" onclick="document.body.dataset.selections=(document.body.dataset.selections||'')+'${time};';document.getElementById('arrival').setAttribute('aria-label','${time}');document.getElementById('arrival').setAttribute('aria-expanded','false');document.getElementById('choices').hidden=true;document.querySelector('output').textContent='Selection settled'">${time}</li>`).join("")}</ul>
      <button id="shift" type="button" onclick="for(let i=0;i<3;i++){const b=document.createElement('button');b.type='button';b.textContent='Late page navigation '+i;document.body.prepend(b)}">Fixture layout change</button>
      <button id="style" type="button" onclick="[...document.querySelectorAll('[role=option]')].find(item=>item.textContent==='19:00').style.color='red'">Fixture style change</button><output>Waiting</output>`, runtimeKind);
    let calls = 0;
    let session!: Awaited<ReturnType<typeof runtime.openSession>>;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string }> } };
      calls += 1;
      if (calls > 2) return { invocationId: `fixture:shifted-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: "REQUEST_HUMAN_HELP", targetRef: "", authoritativeField: "NONE", requestedState: "NONE", reason: "The selected time did not match." }) };
      const target = payload.observation.targets.find(item => calls === 1 ? item.role === "combobox" : item.kind === "OPTION" && item.label === "19:00");
      assert.ok(target);
      if (calls === 2) { await session.click("#shift"); await session.click("#style"); }
      return { invocationId: `fixture:shifted-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : "CHOOSE_OPTION", targetRef: target.ref, authoritativeField: calls === 1 ? "NONE" : "TIME", requestedState: "NONE", reason: "Choose the observed 19:00 option" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
    const signal = new AbortController().signal;
    session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "fixture:shifted-option", source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Choose the observed 19:00 time.", completion: snapshot => ({ complete: /Selection settled/.test(snapshot.text), reason: "No selected time.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.controls.find(control => control.role === "combobox")?.label, "19:00");
      assert.equal(result.status, "COMPLETED");
      assert.equal(calls, 2);
      assert.match((await session.snapshot()).html, /data-selections="19:00;"/, "the page actually received only the requested selection");
    } finally { await executor.close(); }
  });
}

for (const mutation of ["role-change", "replacement", "legal-replacement"] as const) {
  test(`changed observed option ${mutation} is rejected before execution`, async () => {
    const canRecover = mutation === "legal-replacement";
    const runtime = localFixture(`<button id="arrival" type="button" role="combobox" aria-controls="choices" aria-expanded="false" aria-label="Arrival time" onclick="this.setAttribute('aria-expanded','true');document.getElementById('choices').hidden=false">Arrival time</button>
      <ul id="choices" role="listbox" hidden><li role="option" onclick="document.body.dataset.executed='yes';document.getElementById('arrival').setAttribute('aria-label','19:00')">19:00</li></ul>
      <button id="mutate" type="button" onclick="mutateOption()">Change control</button>
      <script>function mutateOption(){const option=document.querySelector('[role=option]');${canRecover ? "option.replaceWith(option.cloneNode(true))" : mutation === "replacement" ? "const next=document.createElement('button');next.type='submit';next.textContent='19:00';next.onclick=()=>document.body.dataset.executed='yes';option.replaceWith(next)" : "option.setAttribute('role','button');option.setAttribute('type','submit')"}}</script>`, "LOCAL");
    let calls = 0;
    const rejections: string[] = [];
    let session!: Awaited<ReturnType<typeof runtime.openSession>>;
    const decision = new ModelBrowserReadActionDecision({ async complete(request) {
      const payload = JSON.parse(request.messages[1]!.content) as { observation: { targets: Array<{ ref: string; kind: string; role: string; label: string }> } };
      calls += 1;
      const target = payload.observation.targets.find(item => calls === 1 ? item.role === "combobox" : item.kind === "OPTION" && item.label === "19:00");
      if (calls === 2) await session.click("#mutate");
      const chooseOption = calls === 2 || (canRecover && calls === 3);
      return { invocationId: `fixture:stale-option:${calls}`, provider: "FIXTURE", model: "fixture", finishReason: "TOOL_CALLS" as const, latencyMs: 0,
        outputText: JSON.stringify({ action: calls === 1 ? "CLICK" : chooseOption ? "CHOOSE_OPTION" : "REQUEST_HUMAN_HELP", targetRef: calls === 1 || chooseOption ? target?.ref : "", authoritativeField: chooseOption ? "TIME" : "NONE", requestedState: "NONE", reason: "Use only the currently observed option" }) };
    } });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision, maxModelCallsPerCandidate: 3,
      onDiagnostic: item => { if (item.event === "REJECTED") rejections.push(item.detail ?? ""); } });
    const signal = new AbortController().signal;
    session = await executor.acquire(signal, "WEBSITE", "FACTS");
    try {
      await executor.navigate({ source: "WEBSITE", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: `fixture:stale-option:${mutation}`, source: "WEBSITE", stage: "FACTS", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
        objective: "Choose the observed 19:00 time.", completion: snapshot => ({ complete: snapshot.html.includes('data-executed="yes"'), reason: "No selected time.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, canRecover ? "COMPLETED" : "REQUESTED_HUMAN_HELP");
      assert.equal(calls, 3);
      assert.ok(rejections.some(detail => detail.includes("Observed target changed or detached")), "the old observed node is rejected before a fresh decision");
      if (canRecover) {
        assert.match(result.snapshot.html, /data-executed="yes"/);
        assert.equal(result.controls.find(control => control.role === "combobox")?.label, "19:00");
      } else assert.doesNotMatch(result.snapshot.html, /data-executed="yes"/);
    } finally { await executor.close(); }
  });
}

test("a visible option from another listbox cannot be claimed by the expanded combobox", async () => {
  const runtime = localFixture(`<input role="combobox" aria-readonly="true" aria-controls="expected" aria-expanded="true" aria-label="Arrival time">
    <div id="expected" role="listbox"><div role="option">6:00 PM</div></div>
    <div id="unrelated" role="listbox"><div role="option" onclick="document.body.dataset.foreign='clicked'">7:00 PM</div></div>`);
  const diagnostics: string[] = [];
  let calls = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: item => { if (item.event === "REJECTED") diagnostics.push(item.detail ?? ""); }, modelDecision: {
    async decide(input) {
      if (++calls > 1) return { type: "REQUEST_HUMAN_HELP", reason: "No bound option remains." };
      const foreign = input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM");
      assert.equal(foreign, undefined, "noncurrent list options are excluded from the action inventory");
      return { type: "CHOOSE_OPTION", targetRef: "observation:1:target:999", field: "TIME", reason: "Try an unobserved option." };
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:wrong-owner", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Select a bound public query time.", completion: () => ({ complete: false, reason: "No selection confirmed." }) });
    assert.equal(result.status, "NO_SAFE_ACTION");
    assert.ok(diagnostics.some(detail => detail === "STALE_OR_UNKNOWN_TARGET_REF"));
    assert.doesNotMatch(result.snapshot.html, /data-foreign="clicked"/);
  } finally { await executor.close(); }
});

for (const variant of ["disabled", "unchanged", "complete"] as const) {
  test(`native option ${variant} cannot be signed off as a selected time`, async () => {
    const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose</option><option value="opaque" ${variant === "disabled" ? "disabled" : ""}>7:00 PM</option></select><output>Waiting</output>
      <script>document.querySelector('select').onchange=event=>{ ${variant !== "disabled" ? "event.target.value='';document.querySelector('output').textContent='Inventory ready';" : ""} };</script>`);
    const diagnostics: string[] = [];
    let calls = 0;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: item => { if (item.event === "REJECTED" || item.detail === "OPTION_VALUE_NOT_CONFIRMED") diagnostics.push(item.detail ?? ""); }, modelDecision: {
      async decide(input) {
        if (++calls > 1) return variant === "complete"
          ? { type: "COMPLETE", reason: "The independent result changed." }
          : { type: "REQUEST_HUMAN_HELP", reason: "Selection did not persist." };
        const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM");
        if (variant === "disabled") assert.equal(option, undefined, "disabled native options are excluded from the action inventory");
        else assert.ok(option);
        return { type: "CHOOSE_OPTION", targetRef: option?.ref ?? "observation:1:target:999", field: "TIME", reason: "Try the observed time." };
      },
    } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: `fixture:${variant}`, source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
        objective: "Select a public query time.", completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No result yet.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, variant === "complete" || variant === "disabled" ? "NO_SAFE_ACTION" : "REQUESTED_HUMAN_HELP");
      assert.ok(diagnostics.some(detail => variant === "disabled" ? detail === "STALE_OR_UNKNOWN_TARGET_REF" : detail === "OPTION_VALUE_NOT_CONFIRMED"));
      assert.notEqual(result.controls.find(control => control.kind === "SELECT")?.value, "opaque");
    } finally { await executor.close(); }
  });
}

test("an asynchronously applied option can complete after a later selected-value observation", async () => {
  const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose</option><option value="opaque">7:00 PM</option></select><output>Waiting</output>
    <button id="settle" type="button" onclick="document.querySelector('select').value='opaque';document.querySelector('output').textContent='Inventory ready / 7:00 PM';document.body.dataset.settled='yes'">Fixture release</button>
    <script>document.querySelector('select').onchange=event=>{event.target.value='';document.querySelector('output').textContent='Inventory ready';};</script>`);
  let calls = 0;
  let session!: Awaited<ReturnType<typeof runtime.openSession>>;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxModelCallsPerCandidate: 2, modelDecision: { async decide(input) {
    if (++calls > 1) {
      assert.equal(input.observation.targets.find(target => target.kind === "SELECT")?.options?.find(option => option.selected)?.value, "", "inventory readiness does not confirm the selected time");
      // Release only after the pending state was observed; no wall-clock race.
      await session.click("#settle");
      return { type: "WAIT", reason: "Wait for the selected value." };
    }
    return { type: "CHOOSE_OPTION", targetRef: input.observation.targets.find(target => target.kind === "OPTION" && target.label === "7:00 PM")!.ref, field: "TIME", reason: "Choose the observed time." };
  } } });
  const signal = new AbortController().signal;
  session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:async-option", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Observe the requested time after it settles.",
      completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No inventory result yet.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.ok((await session.snapshot()).html.includes('data-settled="yes"'), "completion requires actual selected-value settlement");
    assert.equal(result.status, "COMPLETED");
    assert.equal(calls, 2);
    assert.equal(result.controls.find(control => control.kind === "SELECT")?.value, "opaque");
  } finally { await executor.close(); }
});

test("an unconfirmed time choice cannot be replaced by a successful party choice", async () => {
  const runtime = localFixture(`<select aria-label="Arrival time"><option value="">Choose time</option><option value="time-opaque">7:00 PM</option></select>
    <select aria-label="Party size"><option value="2">2</option><option value="4">4 guests</option></select><output>Waiting</output>
    <script>document.querySelectorAll('select')[0].onchange=event=>{event.target.value='';document.querySelector('output').textContent='Inventory ready';};</script>`);
  let calls = 0;
  const diagnostics: string[] = [];
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  onDiagnostic: item => { if (item.event === "REJECTED") diagnostics.push(item.detail ?? ""); }, modelDecision: { async decide(input) {
    calls += 1;
    if (calls === 3) return { type: "COMPLETE", reason: "The result text changed." };
    const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === (calls === 1 ? "7:00 PM" : "4 guests"));
    assert.ok(option);
    return { type: "CHOOSE_OPTION", targetRef: option.ref, field: calls === 1 ? "TIME" : "PARTY_SIZE", reason: "Choose an observed request option." };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:cross-option", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, partySize: 4, timeWindow: { earliest: "19:00", latest: "19:30" }, hardCriteria: [] },
      objective: "Confirm both requested values.", completion: snapshot => ({ complete: /Inventory ready/.test(snapshot.text), reason: "No result yet.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.equal(result.status, "NO_SAFE_ACTION");
    assert.ok(diagnostics.some(detail => detail.includes("previous option is still unconfirmed")));
    assert.equal(result.controls.find(control => control.label === "Party size")?.value, "2");
  } finally { await executor.close(); }
});

/** Real Chromium, wholly intercepted local HTML; all other network requests are aborted. */
function localFixture(html: string | Record<string, string>, runtimeKind: "LOCAL" | "CLOUDFLARE_SESSION" = "LOCAL", delayedNavigation?: { url: string; release: Promise<void>; finished(): void }) {
  const pages = typeof html === "string" ? { [url]: html } : html;
  const browserType = {
    async launch(options: Parameters<typeof chromium.launch>[0]) {
      const browser = await chromium.launch(options);
      const createContext = browser.newContext.bind(browser);
      browser.newContext = async (contextOptions) => {
        const context = await createContext(contextOptions);
        await context.route("**/*", async (route) => {
          if (route.request().url() === delayedNavigation?.url) {
            await delayedNavigation.release;
            try { await route.fulfill({ contentType: "text/html; charset=utf-8", body: "<title>Late old page</title><h1>Old candidate</h1>" }); }
            catch { /* Closing the timed-out session may already have canceled the old request. */ }
            finally { delayedNavigation.finished(); }
            return;
          }
          const body = pages[route.request().url()];
          return body === undefined
            ? route.abort()
            : route.fulfill({ contentType: body.startsWith("{") ? "application/json; charset=utf-8" : "text/html; charset=utf-8", body });
        });
        return context;
      };
      return browser;
    },
  };
  const runtime: BrowserRuntime = runtimeKind === "CLOUDFLARE_SESSION"
    ? new CloudflareBrowserRun({
      accountId: "fixture", apiToken: "fixture", engineMode: "CHROMIUM_ONLY",
      // Replace only the remote connection; exercise the production Cloudflare session on local Chromium.
      connectOverCdp: async () => {
        const browser = await browserType.launch({ headless: true });
        await browser.newContext();
        return browser;
      },
    })
    : new LocalPlaywrightChromium({ browserType });
  // The fixture intercepts every request itself.  It is not a production
  // isolated context, so probe code must not install a second policy whose
  // route.fetch would bypass this fixture's controlled response map.
  return { openSession: (input: Parameters<BrowserRuntime["openSession"]>[0]) => runtime.openSession(input) };
}

// Controlled widget transcribed from c-01 Matsumoto snapshot47: the real month
// anchors contain hidden icon text; the two visible Next buttons page guests
// and times. Scripted source behavior is a Fixture, not current Tabelog stock.
test("Matsumoto month navigation escapes the guest Next loop through production observation", async () => {
  const venue = "https://tabelog.com/en/tokyo/A1303/A130301/13261619/";
  const runtime = localFixture({ [venue]: `<title>Matsumoto calendar fixture</title>
    <style>.calendar-icon{display:none}.calendar-navi a{display:inline-block;padding:12px}</style>
    <div class="calendar-widget"><div class="calendar-wrap"><div class="calendar-navi">
      <a href="#" onclick="event.preventDefault();setMonth()"><i class="calendar-icon">Next month</i></a></div>
      <table><caption>Oct 2026</caption><tbody><tr><td><button type="button" data-year="2026" data-month="10" data-day="21" onclick="selectDate()">21</button></td></tr></tbody></table></div>
      <div class="guest-select"><span class="select-title">Guests</span><button type="button" aria-label="Previous">Previous</button><button type="button">2</button>
      <button type="button" aria-label="Next" onclick="guestPages++;document.querySelector('#guest-page').textContent=guestPages">Next</button><output id="guest-page">0</output></div>
      <div class="time-select"><span class="select-title">Time</span><button type="button">7:00 PM</button><button type="button" aria-label="Next">Next</button></div></div>
    <output id="selected">No date selected</output><script>let guestPages=0;
    function setMonth(){document.querySelector('caption').textContent='Nov 2026';const day=document.querySelector('td button');day.textContent='3';day.dataset.month='11';day.dataset.day='3'}
    function selectDate(){document.querySelector('#selected').textContent='Selected 2026-11-03'}</script>` });
  const choices: string[] = [];
  const observed: unknown[] = [];
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 120_000, maxModelCallsPerCandidate: 6,
    maxModelCallsTotal: 6, maxOperationsPerCandidate: 60, modelDecision: { async decide(input) {
      observed.push({ month: input.observation.displayedCalendarMonth, controls: input.observation.targets.filter(t => /Next|month/.test(t.label)), progress: input.progress, history: input.history });
      const next = input.observation.targets.find(t => t.label === "Next month" && t.controlGroupLabel === "Calendar");
      const date = input.observation.targets.find(t => t.calendarDate === "2026-11-03");
      if (date) { choices.push("DATE"); return { type: "CLICK_AUTHORITATIVE", targetRef: date.ref, field: "DATE", reason: "Select the requested date." }; }
      if (next) {
        assert.deepEqual(input.observation.displayedCalendarMonth, { year: 2026, month: 10, caption: "Oct 2026", source: "DOM caption" });
        assert.ok(input.observation.targets.some(t => t.label === "Next" && t.controlGroupLabel === "Guests"));
        assert.ok(input.observation.targets.some(t => t.label === "Next" && t.controlGroupLabel === "Time"));
        choices.push("MONTH"); return { type: "CLICK", targetRef: next.ref, reason: "Advance the observed calendar." };
      }
      // Reproduces the original baseline's choice when the icon is unlabelled.
      const wrongNext = input.observation.targets.find(t => t.label === "Next")!;
      choices.push("GUEST_NEXT"); return { type: "CLICK", targetRef: wrongNext.ref, reason: "Attempt to advance November." };
    } } });
  const signal = new AbortController().signal;
  try {
    const session = await executor.acquire(signal, "TABELOG", "AVAILABILITY");
    await executor.navigate({ session, source: "TABELOG", stage: "AVAILABILITY", signal, allowedOrigins: [new URL(venue).origin], url: venue });
    const result = await executor.runSkill({ taskId: "matsumoto-month-fixture", session, source: "TABELOG", stage: "AVAILABILITY", signal,
      allowedOrigins: [new URL(venue).origin], goal: { outlet: { name: "Matsumoto" }, date: "2026-11-03", partySize: 2, hardCriteria: [] },
      objective: "Reach the requested November date", methodReason: "Calendar initially shows October",
      completion: snapshot => snapshot.text.includes("Selected 2026-11-03") ? { complete: true, reason: "Requested date selected", resultKey: "2026-11-03", resultBusy: false } : { complete: false, reason: "Requested date not yet selected" } });
    assert.equal(result.status, "COMPLETED", JSON.stringify({ status: result.status, choices, observed }));
    assert.deepEqual(choices, ["MONTH", "DATE"]);
    assert.match(result.snapshot!.text, /Nov 2026/);
    assert.match(result.snapshot!.html, /id="guest-page">0</);
  } finally { await executor.close(); }
});

test("Chromium labels public icon alternatives and leaves ambiguous calendar ownership unlabelled", async () => {
  const browser = await chromium.launch({ headless: true });
  const registry = new PlaywrightControlRegistry();
  try {
    const page = await browser.newPage();
    await page.route("**/*", route => route.abort());
    await page.setContent(`<style>a{display:inline-block;padding:10px}</style>
      <fieldset><legend>Public navigation</legend>
      <a href="#" aria-label="ARIA alternative"></a><a href="#" title="Title alternative"></a>
      <a href="#"><img alt="Image alternative" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"></a>
      <a href="#"><svg width="16" height="16"><title>Icon alternative</title></svg></a></fieldset>
      <div><a href="#" aria-label="Next month"></a><table><caption>Oct 2026</caption><tr><td>21</td></tr></table>
      <table><caption>Nov 2026</caption><tr><td>3</td></tr></table></div>`);
    const controls = await registry.observe(page);
    for (const label of ["ARIA alternative", "Title alternative", "Image alternative", "Icon alternative"]) {
      const control = controls.find(c => c.label === label);
      assert.ok(control, label);
      assert.equal(control.controlGroupLabel, "Public navigation");
    }
    const ambiguous = controls.find(c => c.label === "Next month")!;
    assert.equal(ambiguous.controlGroupLabel, "Unlabelled group");
    assert.equal(ambiguous.calendarMonth, undefined);
  } finally { await registry.dispose(); await browser.close(); }
});

test("calendar month postcondition ignores unrelated page changes and feeds NO_CHANGE back", async () => {
  const runtime = localFixture(`<div><a href="#" aria-label="Next month" onclick="event.preventDefault();document.querySelector('#noise').textContent='Unrelated update'">Next month</a>
    <table><caption>Oct 2026</caption><tbody><tr><td>21</td></tr></tbody></table></div><output id="noise">Initial text</output>`);
  let decisions = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 120_000, maxModelCallsPerCandidate: 3,
    maxModelCallsTotal: 3, maxOperationsPerCandidate: 36, modelDecision: { async decide(input) {
      if (++decisions === 1) return { type: "CLICK", targetRef: input.observation.targets.find(t => t.label === "Next month")!.ref, reason: "Advance month." };
      assert.match(input.progress, /CALENDAR_MONTH_UNCHANGED/);
      assert.equal(input.history.at(-1)?.outcome, "NO_CHANGE");
      assert.equal(input.history.at(-1)?.reason, "CALENDAR_MONTH_UNCHANGED");
      assert.equal(input.observation.displayedCalendarMonth?.month, 10);
      return { type: "REQUEST_HUMAN_HELP", reason: "The source calendar did not change." };
    } } });
  const signal = new AbortController().signal;
  try {
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    await executor.navigate({ session, source: "TABLECHECK", stage: "AVAILABILITY", signal, allowedOrigins: [new URL(url).origin], url });
    const result = await executor.runSkill({ taskId: "month-unchanged-fixture", session, source: "TABLECHECK", stage: "AVAILABILITY", signal,
      allowedOrigins: [new URL(url).origin], goal: { outlet: { name: "Fixture" }, date: "2026-11-03", hardCriteria: [] },
      objective: "Reach November", methodReason: "Reach requested month", completion: () => ({ complete: false, reason: "November not reached" }) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP");
    assert.equal(decisions, 2);
  } finally { await executor.close(); }
});

test("Chromium control observation discards only a handle confirmed disconnected between reads", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<button id="transient">Transient</button><button id="attached">Attached</button><button id="disabled" disabled>Disabled</button>');
    const registry = new PlaywrightControlRegistry();
    let removed = false;
    const observedPage = {
      locator(selector: string) {
        const locator = page.locator(selector);
        if (!selector.startsWith("button,")) return locator;
        return {
          elementHandles: async () => (await locator.elementHandles()).map((handle, index) => {
            if (index !== 0) return handle;
            const evaluate = handle.evaluate.bind(handle) as (...args: any[]) => Promise<unknown>;
            return new Proxy(handle, {
              get(target, property, receiver) {
                if (property === "evaluate") return async (...args: any[]) => {
                  const result = await evaluate(...args);
                  if (!removed) {
                    removed = true;
                    await page.locator("#transient").evaluate(element => element.remove());
                  }
                  return result;
                };
                const value = Reflect.get(target, property, receiver);
                return typeof value === "function" ? value.bind(target) : value;
              },
            });
          }),
        };
      },
      url: () => page.url(),
      evaluate: page.evaluate.bind(page),
    } as Parameters<PlaywrightControlRegistry["observe"]>[0];
    const controls = await registry.observe(observedPage);
    assert.equal(removed, true);
    assert.deepEqual(controls.map(control => [control.label, control.disabled]), [["Attached", false], ["Disabled", true]]);
  } finally { await browser.close(); }
});

test("Chromium control observation preserves an attached control-read failure", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<button id="attached">Attached</button>');
    const registry = new PlaywrightControlRegistry();
    const observedPage = {
      locator(selector: string) {
        const locator = page.locator(selector);
        if (!selector.startsWith("button,")) return locator;
        return {
          elementHandles: async () => (await locator.elementHandles()).map(handle => new Proxy(handle, {
            get(target, property, receiver) {
              if (property === "isVisible") return async () => { throw new Error("CONTROL_READ_FAILURE"); };
              const value = Reflect.get(target, property, receiver);
              return typeof value === "function" ? value.bind(target) : value;
            },
          })),
        };
      },
      url: () => page.url(),
      evaluate: page.evaluate.bind(page),
    } as Parameters<PlaywrightControlRegistry["observe"]>[0];
    await assert.rejects(registry.observe(observedPage), /CONTROL_READ_FAILURE/);
  } finally { await browser.close(); }
});

test("Chromium control signatures ignore presentation-only classes but reject value and owner changes", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<form id="first"><label><input id="choice" type="radio" name="category" value="sushi"> Sushi</label></form><form id="second"></form><button id="attribute-value" value="public-query">Open public query</button>`);
    const registry = new PlaywrightControlRegistry();
    try {
      const initial = await registry.observe(page);
      const first = initial.find(control => control.kind === "RADIO");
      assert.ok(first);
      assert.equal(initial.find(control => control.label === "Open public query")?.value, "public-query", "a non-native public value attribute remains observable");
      await page.locator("#choice").evaluate(element => {
        element.classList.add("hovered-by-page");
        (element as HTMLInputElement).form?.classList.add("transitioning-layout");
      });
      assert.ok(await registry.target(first.id), "presentational control and form class changes leave the observed semantic target actionable");

      await page.locator("#choice").evaluate(element => { (element as HTMLInputElement).value = "bar"; });
      await assert.rejects(registry.target(first.id), /Observed target changed/, "a changed public radio value invalidates its earlier target");

      const second = (await registry.observe(page)).find(control => control.kind === "RADIO");
      assert.ok(second);
      await page.locator("#choice").evaluate(element => element.setAttribute("form", "second"));
      await assert.rejects(registry.target(second.id), /Observed target changed/, "a changed native form owner invalidates its earlier target");
    } finally { await registry.dispose(); }
  } finally { await browser.close(); }
});

test("Chromium projects an owned default-method submit as GET without classifying bare or POST submits as public GET", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(`<form id="public-search"><button id="default-get" type="submit">Search</button><button id="override-post" type="submit" formmethod="post">Post search</button></form><button id="bare" type="submit">Bare submit</button>`);
    const registry = new PlaywrightControlRegistry();
    try {
      const controls = await registry.observe(page);
      assert.equal(controls.find(control => control.label === "Search")?.formMethod, "GET");
      assert.equal(controls.find(control => control.label === "Post search")?.formMethod, "POST");
      assert.equal(controls.find(control => control.label === "Bare submit")?.formMethod, undefined);
      assert.equal(controls.find(control => control.label === "Bare submit")?.value, undefined, "a non-value button does not acquire a synthetic empty value");
    } finally { await registry.dispose(); }
  } finally { await browser.close(); }
});

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} projects TableCheck search wrapper as combobox and only its native input as fillable`, async () => {
    const saved = readFileSync(new URL("./fixtures/tablecheck-search-control-20260929.html", import.meta.url), "utf8");
    const runtime = localFixture(saved, runtimeKind);
    let projected = false;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      const wrapper = input.observation.targets.find(target => target.role === "combobox" && target.kind === "BUTTON");
      const field = input.observation.targets.find(target => target.label === "Sushi tonight for 2 in Ginza" && target.kind === "INPUT");
      assert.ok(wrapper?.availableActions?.includes("CLICK"));
      assert.equal(wrapper!.availableActions?.some(action => action.startsWith("FILL")), false);
      assert.equal(field?.availableActions?.some(action => action.startsWith("FILL")), false, "no unbound free-text model fill");
      projected = true;
      return { type: "REQUEST_HUMAN_HELP", reason: "No code-bound search text is supplied" };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await session.navigate(url);
      const controls = await session.observeControls!();
      const outer = controls.find(control => control.structure?.tag === "DIV" && control.role === "combobox");
      const inner = controls.find(control => control.structure?.tag === "INPUT" && control.structure.name === "search_text");
      assert.equal(outer?.kind, "BUTTON");
      assert.equal(outer?.value, "", "a combobox may project its single observed native input value");
      assert.equal(inner?.kind, "INPUT");
      assert.equal(inner?.label, "Sushi tonight for 2 in Ginza");
      assert.equal(inner?.value, "", "an observed empty native search property remains distinct from an absent value");
      await assert.rejects(session.fill(outer!.id, "Sushi"));
      await session.fill(inner!.id, "Sushi");
      assert.equal((await session.observeControls!()).find(control => control.structure?.name === "search_text")?.value, "Sushi");
      await executor.runSkill({ taskId: "saved-search-control", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, hardCriteria: [] }, objective: "Inspect the search field",
        completion: () => ({ complete: false, reason: "No query result" }) });
      assert.equal(projected, true);
    } finally { await executor.close(); }
  });

  test(`${runtimeKind} completes an exact bound search suggestion without clicking its covered background control`, async () => {
    const query = "vegetarian restaurants near Central Station";
    const saved = readFileSync(new URL("./fixtures/tablecheck-search-control-20260929.html", import.meta.url), "utf8");
    // Synthetic interaction around the saved wrapper and the Oct 7 observed
    // listbox/quoted query option shape; this is not a saved-response Replay.
    const runtime = localFixture(`${saved}
      <style>[role=combobox]{height:40px}#background{position:absolute;top:60px;left:10px;width:400px;height:40px}
      [role=listbox]{position:absolute;top:50px;left:0;width:450px;height:150px;background:white;z-index:2}
      [role=option]{height:50px}</style>
      <button id="background" type="button">Find availability</button>
      <div id="search-suggestions" role="listbox" hidden>
        <div role="option" aria-selected="false" aria-label='"${query}"' id="exact">Search for: "${query}"</div>
        <div role="option" aria-selected="false">Nearby</div>
      </div><output></output><script>
      const wrapper=document.querySelector('[role=combobox]'), field=wrapper.querySelector('input'), list=document.querySelector('[role=listbox]');
      field.value=${JSON.stringify(query)};
      wrapper.onclick=()=>{wrapper.setAttribute('aria-expanded','true');list.hidden=false};
      document.querySelector('#background').onclick=()=>{document.querySelector('output').textContent='WRONG_BACKGROUND_ACTION'};
      document.querySelector('#exact').onclick=()=>{wrapper.setAttribute('aria-expanded','false');list.hidden=true;
        document.querySelector('output').innerHTML='<a href="/en/public-result">Public result for '+field.value+'</a>'};
      </script>`, runtimeKind);
    let decisions = 0;
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      decisions++;
      const option = input.observation.targets.find(target => target.kind === "OPTION" && target.label === `"${query}"`);
      if (!option) {
        const wrapper = input.observation.targets.find(target => target.role === "combobox");
        assert.ok(wrapper?.availableActions?.includes("CLICK"));
        return { type: "CLICK", targetRef: wrapper!.ref, reason: "Open the public query suggestions." };
      }
      assert.ok(option.availableActions?.includes("CHOOSE_OPTION:RETRIEVAL"), "the exact bound retrieval option must be actionable");
      assert.equal(input.observation.targets.some(target => target.label === "Find availability"), false, "the listbox-covered background control is not an action target");
      assert.equal(input.observation.targets.find(target => target.label === "Nearby")?.availableActions?.includes("CHOOSE_OPTION:RETRIEVAL"), false, "a different suggestion cannot replace the bound query");
      assert.equal(input.observation.targets.find(target => target.label === "Search")?.availableActions?.includes("CLICK"), false, "query selection grants no general submit permission");
      if (decisions === 2) return { type: "CHOOSE_OPTION", targetRef: input.observation.targets.find(target => target.label === "Nearby")!.ref, field: "RETRIEVAL", reason: "Counterexample: attempt an unrelated suggestion." };
      assert.match(input.progress, /label conflicts with the authoritative request/);
      return { type: "CHOOSE_OPTION", targetRef: option.ref, field: "RETRIEVAL", reason: "Submit the exact observed query suggestion." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "bound-search-suggestion", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Public search" }, retrievalExpression: query, hardCriteria: [] }, objective: "Find public result links for the bound query",
        completion: snapshot => ({ complete: snapshot.text.includes(`Public result for ${query}`), reason: "No result link observed", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(decisions, 3);
      assert.equal(result.controls.find(control => control.role === "combobox")?.value, query);
      assert.equal(result.controls.find(control => control.role === "combobox")?.expanded, false);
      assert.equal(result.snapshot.text.includes("WRONG_BACKGROUND_ACTION"), false);
    } finally { await executor.close(); }
  });

  for (const offset of [0, 1400]) test(`${runtimeKind} opens an observed covered public result at offset ${offset}`, async () => {
    const detail = "https://www.tablecheck.com/en/ginza-iwa?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.65860374437126&geo_longitude=139.74541383382513&search_text=omakase+ginza";
    const savedCard = readFileSync(new URL("./fixtures/tablecheck-ginza-card-20260929.html", import.meta.url), "utf8");
    const runtime = localFixture({
      [url]: savedCard.replace("</style>", `</style><div style="height:${offset}px"></div>`),
      [detail]: "<title>Ginza iwa</title><h1>Ginza iwa detail</h1>",
    }, runtimeKind);
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      const link = input.observation.targets.find(target => target.label === "Ginza iwa");
      assert.ok(link?.availableActions?.includes("OPEN_LINK"));
      return { type: "OPEN_LINK", targetRef: link!.ref, reason: "Open observed public result." };
    } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    try {
      await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      const result = await executor.runSkill({ taskId: "covered-link", source: "TABLECHECK", stage: "DISCOVERY", session, signal,
        allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Ginza iwa" }, hardCriteria: [] }, objective: "Open a public result",
        completion: snapshot => ({ complete: snapshot.url === detail && snapshot.text.includes("Ginza iwa detail"), reason: "Detail not observed", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
      assert.equal(result.status, "COMPLETED");
      assert.equal(result.snapshot.url, detail);
    } finally { await executor.close(); }
  });
}

test("Tabelog category discovery expands observed links and removes the keyword within the same area", async () => {
  const areaRoot = "https://tabelog.com/en/tokyo/A1303/A130301/rstLst/";
  const keywordUrl = `${areaRoot}?sw=omakase`;
  const categoryWithKeyword = `${areaRoot}sushi/?sw=omakase`;
  const categoryUrl = `${areaRoot}sushi/`;
  const runtime = localFixture({
    [keywordUrl]: `<title>Keyword results</title><h1>Shibuya restaurant search</h1>
      <h2>Search by category</h2><a class="list-sidebar__item-target" href="#" id="js-leftnavi-genre-anchor"><span class="list-sidebar__item-title">All</span></a>
      <nav id="categories" hidden><a href="${categoryWithKeyword}">Sushi</a></nav>
      <p>One keyword result</p><script>
      document.querySelector('#js-leftnavi-genre-anchor').onclick=event=>{event.preventDefault();document.querySelector('#categories').hidden=false};
      </script>`,
    [categoryWithKeyword]: `<title>Filtered category results</title><h1>Shibuya Sushi</h1>
      <p>Keyword: omakase</p><a href="${categoryUrl}">Remove keyword omakase</a><p>One keyword result</p>`,
    [categoryUrl]: `<title>Category results</title><h1>Shibuya Sushi</h1><p>Expanded category results</p>
      <a class="list-rst__rst-name-target" href="/en/tokyo/A1303/A130301/13000001/">New public restaurant</a>`,
  });
  const visited: string[] = [];
  let categoryControlActions: string[] | undefined;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    visited.push(input.observation.url);
    assert.deepEqual(input.goal.hardCriteria, ["omakase"], "retrieval navigation does not rewrite the HARD criterion");
    let label: string;
    if (visited.length === 1) {
      assert.equal(input.observation.targets.some(target => target.label === "Sushi"), false, "a hidden category is not an observed target");
      label = "All";
    } else if (visited.length === 2) {
      assert.equal(input.observation.url, keywordUrl, "opening category navigation keeps the current result page");
      label = "Sushi";
    } else {
      assert.equal(input.observation.url, categoryWithKeyword, "the observed category link first retains the keyword");
      label = "Remove keyword omakase";
    }
    const target = input.observation.targets.find(item => item.label === label);
    assert.ok(target);
    if (label === "All") {
      categoryControlActions = target.availableActions;
      return { type: "CLICK", targetRef: target.ref, reason: "Expand the observed Search by category control." };
    }
    assert.ok(target.availableActions?.includes("OPEN_LINK"));
    assert.equal(target.availableActions?.includes("CLICK"), false, "a category URL is still public navigation, not a same-page control");
    return { type: "OPEN_LINK", targetRef: target.ref, reason: "Follow the observed public category navigation." };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABELOG", "DISCOVERY");
  try {
    await executor.navigate({ source: "TABELOG", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://tabelog.com"], url: keywordUrl });
    const result = await executor.runSkill({ taskId: "observed-category-discovery", source: "TABELOG", stage: "DISCOVERY", session, signal,
      allowedOrigins: ["https://tabelog.com"], goal: { outlet: { name: "omakase", address: "Shibuya" }, hardCriteria: ["omakase"] },
      objective: "Use an observed related category and remove the keyword while keeping the same area.",
      completion: snapshot => ({ complete: snapshot.url === categoryUrl && snapshot.text.includes("Expanded category results"), reason: "The current category list still needs to be observed without the keyword.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.deepEqual(categoryControlActions, ["CLICK"], "the fragment UI control exposes its actual click action");
    assert.equal(result.status, "COMPLETED");
    assert.deepEqual(visited, [keywordUrl, keywordUrl, categoryWithKeyword]);
    assert.equal(new URL(result.snapshot.url).pathname, new URL(categoryUrl).pathname);
    assert.equal(result.snapshot.url.startsWith(areaRoot), true);
    assert.equal(new URL(result.snapshot.url).searchParams.has("sw"), false);
    assert.equal(result.snapshot.title, "Category results");
    assert.ok(result.controls.some(control => control.kind === "LINK" && control.label === "New public restaurant"));
  } finally { await executor.close(); }
});

test("saved Tabelog calendar keeps hidden future dates and disabled guests out of ready state", async () => {
  const { tabelogQueryControlHints, tabelogQueryControlsRestricted, tabelogRequestedDateState } = await import("../../integrations/tabelog/tabelog-query-controls.js");
  const { traceBrowserSession, safeRecord } = await import("../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js");
  const sourceUrl = "https://tabelog.com/en/tokyo/A1303/A130301/13308491/";
  const saved = readFileSync(new URL("./fixtures/tabelog-teppen-calendar-20260929.html", import.meta.url), "utf8");
  const runtime = localFixture({ [sourceUrl]: `<style>.is-hidden{display:none}</style>${saved}` });
  const session = await runtime.openSession({ signal: new AbortController().signal });
  const trace: Array<{ sequence: number; kind: string; detail: unknown }> = [];
  const observed = traceBrowserSession(session, "TABELOG", (kind, detail) => {
    const sequence = trace.length + 1;
    trace.push({ sequence, kind, detail: safeRecord(detail) });
    return sequence;
  });
  try {
    await observed.navigate(sourceUrl);
    const snapshot = await observed.snapshot();
    const controls = await observed.observeControls!(tabelogQueryControlHints(snapshot));
    assert.equal(controls.some(control => control.label.startsWith("Date ")), false);
    assert.equal(controls.filter(control => /^Guests \d+$/.test(control.label)).every(control => control.disabled), true);
    assert.equal(tabelogQueryControlsRestricted(snapshot, controls, 2), true);
    assert.equal(tabelogQueryControlsRestricted(snapshot, controls, 10), false);
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-28"), "FULL");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-29"), "PHONE_ONLY");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-09-30"), "CLOSED");
    assert.equal(tabelogRequestedDateState(snapshot, "2026-10-01"), "UNOBSERVED", "hidden future month is not the current query surface");
    const snapshotRecord = trace.find(event => event.kind === "SNAPSHOT")!;
    const region = (snapshotRecord.detail as { queryRegions: Array<{ markup: string; computedVisibility: string }> }).queryRegions[0]!;
    assert.match(region.markup, /p-booking-calendar__day-num--closed">30<\/span>/);
    assert.equal(region.computedVisibility, "UNKNOWN");
    const controlsRecord = trace.find(event => event.kind === "CONTROLS")!;
    assert.equal((controlsRecord.detail as { totalObserved: number }).totalObserved, controls.length);
    assert.equal((controlsRecord.detail as { controls: unknown[] }).controls.length, controls.length);
    assert.equal((controlsRecord.detail as { snapshotSequence: number }).snapshotSequence, snapshotRecord.sequence);
    assert.equal(await observed.waitForSettled!(snapshot, 500), true, "restricted ready state may be settled without offering a requested guest control");
  } finally { await session.close(); }
});

test("real Chromium recovers a Tabelog busy page once and still grounds the exact request", async () => {
  const { TabelogBrowserAvailability } = await import("../../integrations/tabelog/tabelog-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const sourceUrl = "https://tabelog.com/en/tokyo/A1303/A130301/13293469/";
  const pages = { [sourceUrl]: await readFile(new URL("../../../.eval-artifacts/p2-2-selection-20261019/followup/busy-inputs/p20-h001-a1.snapshot-0033.html", import.meta.url), "utf8") };
  const good = '<title>Restaurant 1</title><h1 class="restaurant-name">Restaurant 1</h1><p class="restaurant-address">1-1 Shinjuku, Tokyo</p><p>予約 人数</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>';
  const raw = localFixture(pages), arrivals: Array<{url:string;at:number}> = [], diagnostics: BrowserExecutionDiagnostic[] = [];
  const runtime: BrowserRuntime = { async openSession(input) {
    const session = await raw.openSession(input);
    return new Proxy(session, { get(target, key) {
      if (key === "navigate") return async (...args: Parameters<typeof session.navigate>) => { arrivals.push({url:args[0],at:performance.now()}); if (arrivals.length === 2) pages[sourceUrl] = good; return target.navigate(...args); };
      const value = Reflect.get(target,key,target); return typeof value === "function" ? value.bind(target) : value;
    } });
  } };
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 15_000, maxOperationsPerCandidate: 24, maxModelCallsTotal: 1, maxModelCallsPerCandidate: 1, onDiagnostic: row => { diagnostics.push(row); } });
  const candidate = structuredClone(fixtureCandidates[0]!);candidate.restaurant.sourceIds = { googleWebsiteUri: "https://tabelog.com/tokyo/A1303/A130301/13293469/" };
  try {
    const result = await new TabelogBrowserAvailability(executor).check({ candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-08-05",partySize:2,timeWindow:{earliest:"19:00",latest:"19:00"},hardCriteria:[] }, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"AVAILABLE",JSON.stringify(result));
    assert.equal(result.offers[0]?.partySize,2);assert.equal(result.offers[0]?.dateTime.slice(0,16),"2026-08-05T19:00");
    assert.ok(arrivals.every(row=>row.url===sourceUrl));assert.ok(arrivals[1]!.at-arrivals[0]!.at>=1_000);
    assert.equal(diagnostics.filter(row=>row.event==="OPERATION_STARTED"&&row.detail==="WAIT_FOR_SOURCE_RETRY").length,1);
    assert.equal(diagnostics.filter(row=>row.event==="MODEL_DECISION_STARTED").length,0);
  } finally { await executor.close(); }
});

test("Tabelog Adapter consumes loading-to-restricted calendar without model action or timeout", async () => {
  const { TabelogBrowserAvailability } = await import("../../integrations/tabelog/tabelog-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://tabelog.com/en/tokyo/A1301/A130103/13292459/";
  const searchUrl = "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201";
  const calendarUrl = "https://tabelog.com/fixture-calendar";
  const saved = readFileSync(new URL("./fixtures/tabelog-teppen-calendar-20260929.html", import.meta.url), "utf8");
  const loading = `<style>.is-hidden{display:none}</style><h1>Restaurant 1</h1><p>1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">Phone</a><div class="p-booking-calendar">Reserve Guests — Loading calendar</div>
    <script>setTimeout(async()=>{document.querySelector('.p-booking-calendar').outerHTML=await(await fetch('/fixture-calendar')).text()},150)</script>`;
  const executor = new BrowserTaskExecutor(localFixture({
    [searchUrl]: `<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`,
    [sourceUrl]: loading, [calendarUrl]: saved.replace(/<a\b[^>]*>[\s\S]*?<\/a\s*>/gi, ""),
  }), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide() { assert.fail("restricted current query must not start the model loop"); } } });
  try {
    const result = await new TabelogBrowserAvailability(executor).check({
      candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-09-30", partySize: 2,
      timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [],
    }, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABELOG_REQUEST_DATE_CLOSED_ON_CALENDAR");
    assert.equal(result.offers.length, 0);
  } finally { await executor.close(); }
});

for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} retires a real Chromium session after a delayed failed navigation`, async () => {
    const failedUrl = "https://www.tablecheck.com/en/delayed-failure";
    let releaseOld!: () => void;
    let oldFinished!: () => void;
    const release = new Promise<void>(resolve => { releaseOld = resolve; });
    const finished = new Promise<void>(resolve => { oldFinished = resolve; });
    const runtime = localFixture({ [url]: "<title>Fresh page</title><h1>New candidate</h1>" }, runtimeKind, { url: failedUrl, release, finished: oldFinished });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
    const signal = new AbortController().signal;
    executor.beginCandidate("failed");
    const failedSession = await executor.acquire(signal, "TABLECHECK", "IDENTITY");
    await assert.rejects(
      executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", session: failedSession, signal, allowedOrigins: ["https://www.tablecheck.com"], url: failedUrl, timeoutMs: 30 }),
      { code: "BROWSER_TIMEOUT" },
    );
    executor.beginCandidate("next");
    const freshSession = await executor.acquire(signal, "TABLECHECK", "IDENTITY");
    try {
      assert.notEqual(freshSession, failedSession);
      await executor.navigate({ source: "TABLECHECK", stage: "IDENTITY", session: freshSession, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
      assert.match((await executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", session: freshSession, signal })).text, /New candidate/);
      releaseOld();
      await finished;
      assert.match((await executor.snapshot({ source: "TABLECHECK", stage: "IDENTITY", session: freshSession, signal })).text, /New candidate/);
    } finally { await executor.close(); }
  });
}

test("real browser waits for the requested page update instead of reporting stale slots", async () => {
  const runtime = localFixture(`${identity}
    <div id="availability" data-selected-date="2026-09-06" data-pax="2"><button class="time-slot" data-available="true" data-time="19:00">19:00</button></div>
    <script>setTimeout(() => { const panel = document.getElementById('availability'); panel.dataset.selectedDate='2026-09-07'; panel.innerHTML='<button class="time-slot" data-available="true" data-time="20:00">20:00</button>'; panel.dataset.ready='true'; }, 250);</script>`);
  const result = await runBrowserReadProbe(runtime, { url, readySelector: '#availability[data-ready="true"]', schedule: { date: "2026-09-07", partySize: 2 } });
  assert.equal(result.pageState, "CONTENT_OBSERVED");
  assert.ok("slotsDetected" in result);
  assert.deepEqual(result.slotsDetected, ["20:00"]);
  assert.equal(result.requestSelection, "OBSERVED_MATCH");
  assert.equal(result.controlOperation, "NOT_ATTEMPTED");
  assert.equal(result.availabilityConclusion, "NOT_ESTABLISHED");
});

test("explicit fixture takeover changes the same page and rechecks identity", async () => {
  const runtime = localFixture(`<title>Just a moment...</title><button id="human">Continue fixture</button>
    <script>document.getElementById('human').onclick=()=>{document.title='Restaurant'; document.body.innerHTML=${JSON.stringify(identity)};};</script>`);
  const session = await runtime.openSession({ signal: new AbortController().signal });
  try {
    await session.navigate(url);
    const sessionId = session.metadata.sessionId;
    assert.equal(inspectProbePage({ url }, await session.snapshot()).pageState, "BOT_CHALLENGE");
    // This simulates a human only on the local Fixture; it never operates a website challenge.
    await session.click("#human");
    await session.waitFor("h1", 1_000);
    const result = inspectProbePage({ url, expectedCandidate: {
      restaurant: { id: "other", outletName: "Another restaurant", address: "Another address", sourceIds: { phone: "03-9999-9999" }, provenance: {} },
      matchReasons: [], warnings: [], executionConfidence: "LOW",
    } }, await session.snapshot());
    assert.equal(session.metadata.sessionId, sessionId);
    assert.equal(result.pageState, "CONTENT_OBSERVED");
    assert.ok("identity" in result);
    assert.notEqual(result.identity.confidence, "HIGH");
    assert.equal(result.availabilityConclusion, "NOT_ESTABLISHED");
  } finally { await session.close(); }
});

test("a requested ready marker that never appears fails within the probe deadline", async () => {
  const session = await localFixture(identity).openSession({ signal: new AbortController().signal });
  try {
    await assert.rejects(runBrowserReadProbe({ openSession: async () => session }, { url, readySelector: "#never-ready", timeoutMs: 1_500 }), { code: "BROWSER_TIMEOUT" });
  } finally { await session.close(); }
});

test("generic controlled browser path completes a local read-only page task without a site-specific adapter method", async () => {
  const runtime = localFixture(`<title>Search</title><button id="show" data-praxis-read-only="true">Show results</button>
    <main id="result">Loading</main><script>document.getElementById('show').onclick=()=>{document.title='Results'; document.getElementById('result').textContent='Sushi Inase';};</script>`);
  let step = 0;
  const decision: BrowserReadActionDecisionPort = {
    async decide(input) {
      step += 1;
      if (step === 1) {
        const target = input.observation.targets.find((item) => item.label === "Show results");
        assert.ok(target, "model only receives observed target references");
        return { type: "CLICK", targetRef: target.ref, reason: "reveal read-only search results" };
      }
      return { type: "COMPLETE", reason: "results are visible for deterministic parsing" };
    },
  };
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
  const session = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal: new AbortController().signal, allowedOrigins: ["https://www.tablecheck.com"], url });
  const result = await executor.runSkill({
      taskId: "fixture:generic-browser",
      source: "TABLECHECK",
      stage: "DISCOVERY",
      session,
      signal: new AbortController().signal,
      allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Show local public search results.",
      completion: (snapshot) => ({ complete: /Sushi Inase/.test(snapshot.text), reason: "The local public result is not yet visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.snapshot.title, "Results");
    assert.match(result.snapshot.text, /Sushi Inase/);
  } finally {
    await executor.close();
  }
});

test("an observed public target-blank link switches the same session to a new page before reading its terms", async () => {
  const termsUrl = "https://www.tablecheck.com/en/fixture/terms";
  const runtime = localFixture({
    [url]: `<title>Fixture restaurant</title><a href="${termsUrl}" target="_blank">Read public cancellation terms</a>`,
    [termsUrl]: "<title>Public terms</title><main>Cancellation: free until noon. No-show fee: not stated.</main>",
  });
  let decisions = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: {
    async decide(input) {
      decisions += 1;
      if (decisions === 1) {
        const link = input.observation.targets.find((target) => target.label === "Read public cancellation terms");
        assert.ok(link);
        return { type: "OPEN_LINK", targetRef: link.ref, reason: "Read the observed public terms page." };
      }
      assert.equal(input.observation.url, termsUrl, "the next decision must observe the popup page, not the parent");
      return { type: "COMPLETE", reason: "Public terms are visible for deterministic source parsing." };
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "FACTS");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "FACTS", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const parent = await session.snapshot();
    const result = await executor.runSkill({
      taskId: "fixture:public-popup-terms", source: "TABLECHECK", stage: "FACTS", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture Restaurant" }, hardCriteria: [] },
      objective: "Read an observed public terms page without login or booking.",
      completion: (snapshot) => ({ complete: /Cancellation: free until noon/.test(snapshot.text), reason: "The public terms page is not yet visible.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.snapshot.url, termsUrl);
    assert.notEqual(result.snapshot.pageId, parent.pageId, "the active page identity must change within the same session");
    assert.equal(decisions, 1, "completion runs after the post-link snapshot; no stale parent decision is allowed");
  } finally { await executor.close(); }
});

test("real DOM observation exposes an unlabelled-id role button and calendar navigation without permitting submission", async () => {
  const runtime = localFixture(`<title>Calendar</title><div role="button" tabindex="0" aria-label="Next month">›</div><main>August</main>
    <script>
      document.querySelector('[role=button]').onclick=()=>{document.body.innerHTML='<button data-date="2026-09-07" aria-label="September 7, 2026">7</button><main>September</main>'; document.querySelector('button').onclick=()=>{document.title='Availability Results'; document.body.innerHTML='<div data-selected-date="2026-09-07" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>';};};
    </script>`);
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: {
    async decide(input) {
      step += 1;
      if (step === 1) {
        const next = input.observation.targets.find((target) => target.role === "button" && target.label === "Next month");
        assert.ok(next);
        return { type: "CLICK", targetRef: next.ref, reason: "show the requested calendar month" };
      }
      const day = input.observation.targets.find((target) => target.value === "2026-09-07");
      assert.ok(day);
      return { type: "CLICK_AUTHORITATIVE", targetRef: day.ref, field: "DATE", reason: "select the Router-bound date" };
    },
  } });
  const session = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal: new AbortController().signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({
      taskId: "fixture:calendar", source: "TABLECHECK", stage: "AVAILABILITY", session, signal: new AbortController().signal,
      allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Select the verified date and wait for the public slot result.",
      completion: (snapshot) => ({ complete: snapshot.title === "Availability Results", reason: "The public result is not ready.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(step, 2);
  } finally { await executor.close(); }
});

test("an active language dialog blocks background calendar actions until the dialog is closed", async () => {
  const runtime = localFixture(`<title>Calendar</title>
    <button data-date="2026-09-07" aria-label="September 7, 2026">7</button>
    <dialog open aria-modal="true" aria-label="Language" style="position:fixed"><button id="continue" type="button">Continue in English</button></dialog>
    <script>
      document.getElementById('continue').onclick=()=>document.querySelector('dialog').remove();
      document.querySelector('[data-date]').onclick=()=>{document.title='Selected date'; document.body.dataset.selected='2026-09-07';};
    </script>`);
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: {
    async decide(input) {
      step += 1;
      if (step === 1) {
        assert.equal(input.observation.targets.some((target) => target.value === "2026-09-07"), false, "background calendar remains observed state but is not an operable target under a modal");
        const dialog = input.observation.targets.find((target) => target.label === "Continue in English");
        assert.ok(dialog);
        return { type: "CLICK", targetRef: dialog.ref, reason: "Close the observed language dialog." };
      }
      const date = input.observation.targets.find((target) => target.value === "2026-09-07");
      assert.ok(date);
      return { type: "CLICK_AUTHORITATIVE", targetRef: date.ref, field: "DATE", reason: "Select the Router-bound date after the modal closes." };
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({
      taskId: "fixture:modal-calendar", source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Close only the active public language dialog, then select the authoritative date.",
      completion: (snapshot) => ({ complete: snapshot.title === "Selected date", reason: "The exact date is not visibly selected.", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(step, 2);
  } finally { await executor.close(); }
});

test("shared executor keeps unguarded public filters unavailable", async () => {
  const searchUrl = "https://www.tablecheck.com/en/japan/search";
  const runtime = localFixture({ [searchUrl]: `<title>Filters</title><form method="get">
    <input id="sushi" type="checkbox" aria-label="Sushi">
    <div id="minimum" role="slider" tabindex="0" aria-label="Minimum budget" aria-valuemin="0" aria-valuemax="50000" aria-valuenow="5000" aria-valuetext="JPY 5,000" style="width:100px;height:20px"></div>
    <div id="maximum" role="slider" tabindex="0" aria-label="Maximum budget" aria-valuemin="0" aria-valuemax="50000" aria-valuenow="20000" aria-valuetext="JPY 20,000" style="width:100px;height:20px"></div>
    <div id="filters" role="dialog" aria-label="Filters" data-praxis-scroll-region style="height:20px;overflow:auto"><div style="height:1000px">Long public filter details</div></div>
    <button id="update" type="button">Update filters</button><button id="reopen" type="button">Open filters</button><button id="reset" type="button">Reset filters</button><output id="result">pending</output></form>
    <script>
      const filters=document.getElementById('filters');
      filters.onscroll=()=>filters.dataset.scrolled='true';
      const result=document.getElementById('result');
      for (const id of ['minimum','maximum']) document.getElementById(id).onkeydown=(event)=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;const element=event.currentTarget;const next=Number(element.getAttribute('aria-valuenow'))+(event.key==='ArrowRight'?1000:-1000);element.setAttribute('aria-valuenow',String(next));element.setAttribute('aria-valuetext','JPY '+next.toLocaleString('en-US'));};
      document.getElementById('update').onclick=()=>{document.title='Filtered'; result.dataset.applied='sushi='+document.getElementById('sushi').checked+';minimumBudget='+document.getElementById('minimum').getAttribute('aria-valuenow')+';maximumBudget='+document.getElementById('maximum').getAttribute('aria-valuenow')+';scrolled='+Boolean(filters.dataset.scrolled); result.textContent=result.dataset.applied;};
      document.getElementById('reopen').onclick=()=>{filters.dataset.reopened='true'; result.textContent='filters reopened;'+(result.dataset.applied||'');};
      document.getElementById('reset').onclick=()=>{document.getElementById('sushi').checked=false;for(const [id,value] of [['minimum',5000],['maximum',20000]]){const element=document.getElementById(id);element.setAttribute('aria-valuenow',String(value));element.setAttribute('aria-valuetext','JPY '+value.toLocaleString('en-US'));}result.textContent=(result.dataset.applied||'')+';reopened='+Boolean(filters.dataset.reopened)+';reset=sushi:'+document.getElementById('sushi').checked+',minimum:'+document.getElementById('minimum').getAttribute('aria-valuenow')+',maximum:'+document.getElementById('maximum').getAttribute('aria-valuenow');};
    </script>` });
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12,
    // This scenario deliberately exercises eight read-only control transitions.
    // Keep the production default unchanged; the fixture needs room to observe
    // each post-condition rather than shortcutting the interaction.
    maxOperationsPerCandidate: 52,
    maxModelCallsPerCandidate: 10,
    modelDecision: {
    async decide(input) {
      step += 1;
      const find = (label: string) => {
        const target = input.observation.targets.find((item) => item.label === label);
        assert.ok(target, `expected observed ${label}`);
        return target;
      };
      if (step === 1) {
        const sushi = find("Sushi");
        assert.deepEqual(sushi.availableActions, [], "a local fixture without an installed boundary must retain the narrow action policy");
        return { type: "REQUEST_HUMAN_HELP", reason: "No installed read boundary permits public query controls." };
      }
      throw new Error("unexpected extra model decision");
    },
  } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url: searchUrl });
    const result = await executor.runSkill({
      taskId: "fixture:filters", source: "TABLECHECK", stage: "DISCOVERY", session, signal, allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, hardCriteria: [] }, objective: "Read a public filtered result without booking.",
      completion: () => ({ complete: false, reason: "No guarded action should run." }),
    });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP", JSON.stringify(result));
    assert.equal(step, 1);
  } finally { await executor.close(); }
});

// Real production observation, with native and ARIA-backed slider states. No model/network.
test("slider observations follow native properties and ARIA state in both directions", async () => {
  const runtime = localFixture(`<input type="range" aria-label="Native" min="0" max="15" value="15">
    <div role="slider" aria-label="Budget upper" tabindex="0" style="width:100px;height:20px"
      aria-valuemin="0" aria-valuemax="15" aria-valuenow="10"
      onkeydown="this.setAttribute('aria-valuenow',Number(this.getAttribute('aria-valuenow'))+(event.key==='ArrowRight'?1:-1))"></div>`);
  const session = await runtime.openSession({ signal: new AbortController().signal });
  try {
    await session.navigate(url);
    for (const [label, initial] of [["Native", 15], ["Budget upper", 10]] as const) {
      for (const [key, expected] of [["ArrowLeft", initial - 1], ["ArrowRight", initial]] as const) {
        const control = (await session.observeControls!()).find(c => c.label === label)!;
        assert.deepEqual([control.min, control.max], ["0", "15"]);
        await session.press!(control.id, key);
        const after = (await session.observeControls!()).find(c => c.label === label)!;
        assert.equal(after.value, String(expected));
      }
    }
  } finally { await session.close(); }
});

// Actual strict-wire Decision -> Executor -> Chromium. An unsafe model proposal must
// not become consent even when it names a valid current observed checkbox.
test("a model cannot consent by setting an unclassified checkbox", async () => {
  const runtime = localFixture(`<title>Not accepted</title><input type="checkbox"
    aria-label="利用規約に同意する" onchange="document.title='TERMS_ACCEPTED'">`);
  let calls = 0;
  const decision = new ModelBrowserReadActionDecision({ async complete(request) {
    const context = JSON.parse(request.messages[1]!.content);
    const target = context.observation.targets.find((t: { kind: string }) => t.kind === "CHECKBOX");
    const action = ++calls === 1 && target
      ? { action: "SET_CHECKED", targetRef: target.ref, requestedState: "CHECKED" }
      : { action: "REQUEST_HUMAN_HELP", targetRef: "", requestedState: "NONE" };
    return { invocationId: "fixture-consent", provider: "FIXTURE", model: "fixture", outputText: JSON.stringify({ ...action, authoritativeField: "NONE", reason: "Page asks to agree" }), finishReason: "TOOL_CALLS", latencyMs: 1 };
  } });
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: decision });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    await executor.runSkill({ taskId: "fixture:no-consent", source: "TABLECHECK", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, hardCriteria: [] },
      objective: "Read only; never accept terms", completion: () => ({ complete: false, reason: "No public result" }) });
    assert.equal((await session.snapshot()).title, "Not accepted");
    assert.equal((await session.observeControls!()).find(c => c.kind === "CHECKBOX")?.checked, false);
    assert.equal(calls, 2, "strict-wire model proposal actually reached the executor");
  } finally { await executor.close(); }
});

// Visible fixed/nested layers must exclude background and parent controls; hidden
// dialogs must not capture the registry once the active layers are dismissed.
test("nested and hidden dialogs preserve only the active layer's targets", async () => {
  const runtime = localFixture(`<button aria-label="Background">Background</button>
    <div id="outer" role="dialog" aria-modal="true" style="position:fixed;inset:10px">
      <button aria-label="Outer close" onclick="document.getElementById('outer').remove()">Outer close</button>
      <div id="inner" role="dialog" aria-modal="true" style="position:fixed;inset:30px">
        <button aria-label="Inner close" onclick="document.getElementById('inner').remove()">Inner close</button>
      </div>
    </div><div role="dialog" aria-modal="true" style="display:none"><button>Hidden</button></div>`);
  const session = await runtime.openSession({ signal: new AbortController().signal });
  try {
    await session.navigate(url);
    const controls = () => session.observeControls!();
    let observed = await controls();
    assert.equal(observed.find(c => c.label === "Background")?.blockedByActiveLayer, true);
    assert.equal(observed.find(c => c.label === "Outer close" && c.kind === "BUTTON")?.blockedByActiveLayer, true);
    await session.click(observed.find(c => c.label === "Inner close" && c.kind === "BUTTON")!.id);
    observed = await controls();
    assert.equal(observed.find(c => c.label === "Background")?.blockedByActiveLayer, true);
    const outer = observed.find(c => c.label === "Outer close" && c.kind === "BUTTON")!;
    assert.notEqual(outer.blockedByActiveLayer, true);
    await session.click(outer.id);
    observed = await controls();
    assert.notEqual(observed.find(c => c.label === "Background")?.blockedByActiveLayer, true);
  } finally { await session.close(); }
});

// Production Web HTML with HTTP responses replaced. The API's current-fact field
// is the display contract; retained history must never be used as its fallback.
test("Web refresh replaces commercial terms and cites the displayed fact source", async () => {
  const { LOCAL_WORKSPACE_PAGE } = await import("../../web/local-workspace-page.js");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.clock.install({ time: new Date() });
  const old = { evidenceId: "old", candidateId: "a", kind: "RESTAURANT_FACT", sourceUrl: "https://source.example/old", claims: { coursePriceYen: 7500, noShowTerms: "No-show: old rule" } };
  const current = { ...old, evidenceId: "new", sourceUrl: "https://source.example/current", claims: { coursePriceYen: 8000, cancellationTerms: "Cancellation: current rule" } };
  const discoveryOnly = { ...old, candidateId: "b", provider: "GOOGLE_PLACES", sourceUrl: "https://maps.example/b", claims: { websiteUri: "https://venue.example" } };
  let refreshed = false;
  const view = () => ({
    mode: "FIXTURE", case: { caseId: "case", title: "Compare restaurants", status: "ACTIVE", phase: "PRESENT_RESULTS", taskVersion: refreshed ? 2 : 1 },
    conversation: { id: "conversation", messages: [] }, activities: [],
    restaurant: { intentDraft: { target: { goal: "AVAILABILITY" } }, missingRequiredFields: [], candidates: [{ restaurant: { id: "a", outletName: "Cafe A", address: "Tokyo" } }, { restaurant: { id: "b", outletName: "Discovery only", address: "Tokyo" } }], presentedCandidateIds: ["a"], availability: { a: [{ dateTime: "2026-09-18T19:00:00+09:00", source: "TABLECHECK", displayExpiresAt: new Date(Date.now() + (refreshed ? 600000 : -600000)).toISOString() }] }, availabilityChecks: { a: { status: "AVAILABLE", checkedAt: new Date(Date.now() - 600000).toISOString(), displayExpiresAt: new Date(Date.now() + (refreshed ? 600000 : -600000)).toISOString() } }, readEvidence: [old, current], currentFactEvidence: refreshed ? [current, discoveryOnly] : [old, discoveryOnly], conditionStates: { a: [
      { text: "Around ¥10,000 per person", status: refreshed ? "MET" : "NOT_MET", explanation: "Recorded course price; tax retained without conversion.", sources: [{ sourceUrl: current.sourceUrl, quote: refreshed ? "Dinner course ¥8,000" : "Dinner course ¥7,500" }] },
      { text: "Private room", status: "NOT_CHECKED", explanation: "No source evidence.", sources: [] },
    ] } },
  });
  try {
    await page.route("**/*", async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/") return route.fulfill({ contentType: "text/html", body: LOCAL_WORKSPACE_PAGE });
      if (path.endsWith("/events")) return route.abort();
      if (path.endsWith("/refresh")) refreshed = true;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(path === "/api/cases" ? { cases: [view().case] } : path === "/api/session" ? { user: { id: "fixture" } } : { view: view() }) });
    });
    await page.goto("https://workspace.example/");
    await page.getByRole("button", { name: /Compare restaurants/ }).click();
    await page.getByText("No-show: old rule", { exact: false }).waitFor();
    assert.match(await page.locator("#artifact").innerText(), /Availability expired/);
    assert.doesNotMatch(await page.locator("#artifact").innerText(), /Evidence-grounded result/);
    assert.match(await page.locator("#artifact").innerText(), /Around ¥10,000 per person — not met/);
    assert.match(await page.locator("#artifact").innerText(), /Private room — not checked/);
    await page.getByRole("button", { name: "Refresh availability" }).click();
    await page.getByText("Cancellation: current rule", { exact: false }).waitFor();
    assert.equal(await page.locator(".candidate").count(), 1, "discovery-only Google facts must not appear as an investigated result");
    const text = await page.locator(".candidate").innerText();
    assert.match(text, /8,000/);
    assert.match(text, /Around ¥10,000 per person — met/);
    assert.doesNotMatch(text, /7,500|No-show: old rule/);
    assert.equal(await page.getByRole("link", { name: "Terms source" }).getAttribute("href"), current.sourceUrl);
    assert.match(text, /Evidence-grounded result/);
    await page.clock.fastForward(660_000);
    assert.match(await page.locator("#artifact").innerText(), /Availability expired/);
    assert.doesNotMatch(await page.locator("#artifact").innerText(), /Evidence-grounded result/);
  } finally { await browser.close(); }
});

// Source-specific form-contract checks were retired with the site UI permission functions.
// Generic guarded actions are covered through the shared Executor contract and the
// isolated Guard receiver; this local fixture deliberately remains unguarded.

// Live failure: paragraph dates were absent; numeric guest buttons were mistaken for days.
// Exercise source hints -> production Executor -> both Playwright sessions; inventory is NOT implied.
for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} selects Tabelog paragraph dates and labelled guests without treating time options as slots`, async () => {
    const { tabelogQueryControlHints, hasTabelogSelectedQuery } = await import("../../integrations/tabelog/tabelog-query-controls.js");
    const { parseTabelogAvailabilitySlots } = await import("../../integrations/tabelog/tabelog-page-parser.js");
    const sourceUrl = "https://tabelog.com/en/tokyo/A1301/A130103/13292459/";
    const html = `<h1>Restaurant 1</h1><p>1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">Phone</a><p>Reserve Guests</p><div class="p-booking-calendar" style="display:none">
      <p class="js-calendar-day-target is-selectable is-current" data-year="2026" data-month="9" data-day="17">17</p>
      <p class="js-calendar-day-target is-selectable" data-year="2026" data-month="9" data-day="20">20</p>
      <button type="button" class="js-people-button is-active">2</button><button type="button" class="js-people-button">4</button>
      <input type="hidden" class="js-people-hidden-value" value="2">
      <button data-state="disabled" data-date="2026-9-16" type="button">Disabled date</button>
      <button class="js-time-button" type="button">7:00 PM</button>
      </div><a href="https://social.example/restaurant">Official website</a>
      <script>
      setTimeout(()=>document.querySelector('.p-booking-calendar').style.display='block',150);
      document.querySelectorAll('.js-calendar-day-target').forEach(el=>el.onclick=()=>{document.querySelector('.is-current').classList.remove('is-current');el.classList.add('is-current')});
      document.querySelectorAll('.js-people-button').forEach(el=>el.onclick=()=>{document.querySelector('.is-active').classList.remove('is-active');el.classList.add('is-active');document.querySelector('input').value=el.textContent});
      </script>`;
    let calls = 0;
    const searchUrl = "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201";
    const searchHtml = `<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`;
    const executor = new BrowserTaskExecutor(localFixture({[sourceUrl]:html,[searchUrl]:searchHtml}, runtimeKind), { maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
      const disabledDate = input.observation.targets.find(target=>target.label === "Disabled date");
      assert.equal(disabledDate?.disabled, true);
      assert.deepEqual(disabledDate?.availableActions, []);
      assert.equal(disabledDate?.rejectionReason, "DISABLED");
      assert.ok(!input.observation.targets.some(target=>target.label.includes("7:00 PM")), "booking time buttons are evidence-only, not model actions");
      const field = ++calls === 1 ? "DATE" as const : "PARTY_SIZE" as const;
      const label = field === "DATE" ? "Date 2026-09-20" : "Guests 4";
      const target = input.observation.targets.find(target=>target.label === label);
      assert.ok(target, label);
      assert.equal(input.observation.targets.filter(target=>target.label === "Guests 4").length, 1);
      return { type: "CLICK_AUTHORITATIVE", field, targetRef: target.ref, reason: "Apply exact request" };
    } }, maxModelCallsPerCandidate: 2 });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "TABELOG", "AVAILABILITY");
    try {
      const { fixtureCandidates } = await import("../restaurant-fixtures.js");
      const { TabelogBrowserAvailability } = await import("../../integrations/tabelog/tabelog-browser-availability.js");
      const candidate = structuredClone(fixtureCandidates[0]!);
      candidate.restaurant.sourceIds.phone = "03-1111-2222";
      const result = await new TabelogBrowserAvailability(executor).check({
        candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-09-20",partySize:4,
        timeWindow:{earliest:"18:30",latest:"19:30"},hardCriteria:[],
      },signal);
      const snapshot = await session.snapshot();
      assert.equal(hasTabelogSelectedQuery(snapshot,"2026-09-20",4),true);
      assert.equal(hasTabelogSelectedQuery(snapshot,"2026-09-17",2),false);
      assert.deepEqual(parseTabelogAvailabilitySlots(snapshot),{availableSlots:[],hasExplicitSlotUi:false});
      assert.equal(result.offers.length,0,"query options alone cannot establish inventory");
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode,"EXTRACTION_FAILED");
      assert.equal(calls,2,"production Adapter must reach the shared model loop");
    } finally { await executor.close(); }
  });
}

// The real guide's skeleton and disabled selected day formerly triggered a pointless model click.
// Production Adapter must wait, bind date/party/time, and return UNAVAILABLE without model inference.
test("TableCheck waits for its guide result and grounds exact-query empty availability", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://www.tablecheck.com/en/restaurant1";
  const html = '<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"><form><button type="button" data-testid="day" data-date="2026-9-16" aria-selected="true" data-state="disabled">16</button><div data-testid="Venue Pax Select" id="pax-2"></div><div data-testid="Venue Time Select" id="time-19:00"></div><span class="skeleton"></span></form></div><script>setTimeout(()=>{document.querySelector(".skeleton").outerHTML=\'<span data-testid="Venue Unavailable Msg">We could not find a table on Sep 16th for the selected mealtime</span>\'},200)</script>';
  const searchUrl = tableCheckDiscoveryUrl(candidate);
  const requestedUrl = exactGuideAvailabilityUrl(sourceUrl, "2026-09-16", 2, "19:00");
  const executor = new BrowserTaskExecutor(localFixture({
    [searchUrl]: `<a href="${sourceUrl}">Restaurant 1</a>`,
    [sourceUrl]: html,
    [requestedUrl]: html,
  }), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide() { assert.fail("ready explicit empty result should need no model"); } } });
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-09-16",partySize:2,timeWindow:{earliest:"19:00",latest:"19:00"},hardCriteria:[]},new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"UNAVAILABLE",JSON.stringify(result));
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode,"NO_MATCHING_SLOT");
    assert.equal(result.offers.length,0);
  } finally { await executor.close(); }
});

test("real Chromium TableCheck source observation crosses the retired 30s provider window but completes inside 45s", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://www.tablecheck.com/en/restaurant1";
  const resultLink = "/en/shops/restaurant1/reserve?start_date=2026-09-16&num_people=2&start_time=19:00";
  const requestedSourceUrl = exactGuideAvailabilityUrl(sourceUrl, "2026-09-16", 2, "19:00");
  const delayedPage = `<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"><form><input name="reservation[start_date]" value="2026-09-16"><select name="reservation[num_people_adult]"><option value="2" selected>2</option></select></form><span class="skeleton"></span><div id="result"></div></div><script>setTimeout(()=>{document.querySelector('.skeleton').remove();const link=document.createElement('a');link.href='${resultLink}';link.textContent='19:00';document.querySelector('#result').append(link)},100)</script>`;
  const delayedSourceObservation = (runtime: BrowserRuntime): BrowserRuntime => ({
    async openSession(input) {
      const raw = await runtime.openSession(input);
      let delayNextSourceSnapshot = false;
      let cancelDelay: (() => void) | undefined;
      const session = Object.create(raw) as BrowserSession;
      session.navigate = async (target, options) => {
        await raw.navigate(target, options);
        // The production Adapter now navigates through the exact guide query
        // before its first availability snapshot.  Delay that source read,
        // not the earlier identity guide navigation.
        delayNextSourceSnapshot = target === requestedSourceUrl;
      };
      session.snapshot = async () => {
        if (delayNextSourceSnapshot) {
          delayNextSourceSnapshot = false;
          await new Promise<void>((resolve, reject) => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            const finish = () => {
              if (timer) clearTimeout(timer);
              input.signal.removeEventListener("abort", onAbort);
              cancelDelay = undefined;
            };
            const onAbort = () => {
              finish();
              reject(new Error("parent aborted delayed source observation"));
            };
            cancelDelay = () => {
              finish();
              reject(new Error("source observation closed"));
            };
            timer = setTimeout(() => {
              finish();
              resolve();
            }, 31_000);
            input.signal.addEventListener("abort", onAbort, { once: true });
          });
        }
        return raw.snapshot();
      };
      session.close = async () => {
        cancelDelay?.();
        await raw.close();
      };
      return session;
    },
  });
  const run = async (providerBudgetMs: number) => {
    const diagnostics: import("../../infrastructure/browser/browser-task-executor.js").BrowserExecutionDiagnostic[] = [];
    const startedAt = Date.now();
    const executor = new BrowserTaskExecutor(delayedSourceObservation(localFixture({
      [tableCheckDiscoveryUrl(candidate)]: `<a href="${sourceUrl}">Restaurant 1</a>`,
      [sourceUrl]: delayedPage,
      [requestedSourceUrl]: delayedPage,
    })), {maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxElapsedMsPerCandidate: 60_000, maxElapsedMsPerProvider: providerBudgetMs, maxAutomaticElapsedMs: 60_000,
      onDiagnostic: diagnostic => diagnostics.push(diagnostic) });
    try {
      const result = await new TableCheckBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id],
        date: "2026-09-16", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, new AbortController().signal);
      return { result, elapsedMs: Date.now() - startedAt, diagnostics };
    } finally { await executor.close(); }
  };
  const retiredWindow = await run(30_000);
  assert.equal(retiredWindow.result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN", JSON.stringify(retiredWindow.result));
  assert.ok(retiredWindow.elapsedMs >= 29_000, `the retired provider deadline must cut off the delayed source read, elapsed ${retiredWindow.elapsedMs}ms`);
  assert.ok(retiredWindow.diagnostics.some(item => item.event === "OPERATION_FAILED" && item.lifecycle.failureCode === "BROWSER_TIMEOUT"), JSON.stringify(retiredWindow.diagnostics));
  const extendedWindow = await run(45_000);
  assert.equal(extendedWindow.result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(extendedWindow.result));
  assert.ok(extendedWindow.elapsedMs >= 30_000, `the extended provider window must retain the delayed source observation, elapsed ${extendedWindow.elapsedMs}ms`);
  assert.ok(extendedWindow.diagnostics.some(item => item.event === "OPERATION_FINISHED" && item.detail === "SNAPSHOT"), JSON.stringify(extendedWindow.diagnostics));
  assert.equal(extendedWindow.result.offers.length, 1, "the current post-update slot is grounded through the production Adapter");
});

test("TableCheck handles multiple current search links and reads only the identity-bound outlet", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const searchUrl = tableCheckDiscoveryUrl(candidate);
  const query = new URL(searchUrl).searchParams.get("search_text")!;
  const correctUrl = "https://www.tablecheck.com/en/restaurant1";
  const otherUrl = "https://www.tablecheck.com/en/other-restaurant";
  const correctSearchUrl = `${correctUrl}?search_text=${encodeURIComponent(query)}`;
  const requestedUrl = exactGuideAvailabilityUrl(correctUrl, "2026-09-16", 2, "19:00");
  const resultHtml = `<a href="${otherUrl}?search_text=${encodeURIComponent(query)}">Other Restaurant</a><a href="${correctSearchUrl}">Restaurant 1</a>`;
  const correctHtml = '<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability" data-selected-date="2026-09-16" data-pax="2"><section data-availability-state="complete"><a href="/en/shops/restaurant1/reserve?start_date=2026-09-16&num_people=2&start_time=19:00">19:00</a></section></div>';
  const executor = new BrowserTaskExecutor(localFixture({
    [searchUrl]: resultHtml,
    [otherUrl]: '<h1>Other Restaurant</h1><a href="tel:03-9999-8888">Phone</a>',
    [correctUrl]: correctHtml,
    [correctSearchUrl]: correctHtml,
    [requestedUrl]: correctHtml,
  }), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide() { assert.fail("known feasible guide requires no browser model action"); } } });
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id],
      date: "2026-09-16", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE", JSON.stringify(result));
    assert.equal(result.offers.length, 1);
  } finally { await executor.close(); }
});

test("TableCheck form waits past old inventory until a current same-outlet slot link appears", async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const guide = "https://www.tablecheck.com/en/restaurant1";
  const reserve = "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2026-09-16&pax=2";
  const link = "/en/shops/restaurant1/reserve?start_date=2026-09-16&pax=2&start_time=19:00";
  const guideHtml = `<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"></div><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", "@id": guide, acceptsReservations: reserve.split("?")[0] })}</script>`;
  const formHtml = `<h1>Restaurant 1</h1><form><input name="reservation[start_date]" value="2026-09-16"><select name="reservation[num_people_adult]"><option value="2" selected>2</option></select></form><section data-availability-state="complete" data-date="2026-09-15" data-pax="4"><button class="time-slot is-available" data-time="19:00">19:00</button></section><div id="fresh"></div><script>setTimeout(()=>{const a=document.createElement('a');a.href='${link}';a.textContent='19:00';document.getElementById('fresh').appendChild(a)},200)</script>`;
  let modelDecisionCalls = 0;
  const executor = new BrowserTaskExecutor(localFixture({
    [tableCheckDiscoveryUrl(candidate)]: `<a href="${guide}">Restaurant 1</a>`, [guide]: guideHtml, [reserve]: formHtml,
  }), { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    modelDecisionCalls += 1;
    assert.equal(input.observation.url, reserve, "wait only for the selected reservation form");
    assert.equal(modelDecisionCalls, 1, "one bounded wait suffices for the controlled update");
    return { type: "WAIT", reason: "Wait for the selected request's result to load" };
  } } });
  const signal = new AbortController().signal;
  try {
    const result = await new TableCheckBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id],
      date: "2026-09-16", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, signal);
    const session = await executor.acquire(signal, "TABLECHECK", "AVAILABILITY");
    const finalPage = await session.snapshot();
    assert.equal(modelDecisionCalls, 0, "navigation settles the current result without spending a model WAIT");
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
    assert.match(finalPage.html, /start_time=19:00/, "the current request link arrived before availability was accepted");
    assert.match(finalPage.html, /data-date="2026-09-15"/, "old inventory remained on the page but was not accepted");
  } finally { await executor.close(); }
});

// Regression from the live 4-person failure: disabled selected day is evidence,
// and ARIA combobox/options must be operable without allowing booking submission.
for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
 test(`${runtimeKind} TableCheck changes guests through a read-only ARIA combobox without repeating the selected date`, async () => {
  const { TableCheckBrowserAvailability } = await import("../../integrations/tablecheck/tablecheck-browser-availability.js");
  const { fixtureCandidates } = await import("../restaurant-fixtures.js");
  const { tableCheckDiscoveryUrl } = await import("../../integrations/tablecheck/tablecheck-page-parser.js");
  const candidate = structuredClone(fixtureCandidates[0]!);
  candidate.restaurant.sourceIds.phone = "03-1111-2222";
  const sourceUrl = "https://www.tablecheck.com/en/restaurant1";
  const html = `<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"><form method="post">
    <button type="button">Sep 19th</button><button type="button" data-testid="day" data-date="2026-9-19" aria-selected="true" disabled>19</button>
    <div data-testid="Venue Pax Select" id="pax-2"><input role="combobox" aria-controls="guests" aria-readonly="true" aria-label="Any party size" aria-expanded="false" style="pointer-events:none" onkeydown="if(event.key==='ArrowDown')openList(this,'guests')"></div>
    <div id="guests" role="listbox" hidden><div role="option" onclick="document.querySelector('#pax-2 input').value='4 guests';document.querySelector('#pax-2').id='pax-4';finishChoice()">4 guests</div></div>
    <div data-testid="Venue Time Select" id="time-20:00"><div data-testid="Value Container"><div class="fixture-singleValue">20:00</div><div><input role="combobox" aria-readonly="true" aria-label="Time" aria-expanded="false" value="" style="pointer-events:none" onkeydown="if(event.key==='ArrowDown')openList(this,'times')"></div></div></div>
    <div id="times" role="listbox" hidden><div role="option" onclick="document.getElementById('time-20:00').querySelector('.fixture-singleValue').textContent='19:00';document.getElementById('time-20:00').id='time-19:00';finishChoice()">19:00</div><div role="option" onclick="document.body.dataset.outside='changed';finishChoice()">20:00</div></div>
    <div id="result"></div><button type="submit">Book</button></form></div>
    <script>function openList(input,id){document.getElementById(id).hidden=false;input.setAttribute('aria-expanded','true');input.setAttribute('aria-controls',id)}
    function finishChoice(){document.querySelectorAll('[role=listbox]').forEach(e=>e.hidden=true);document.querySelectorAll('[role=combobox]').forEach(e=>{e.setAttribute('aria-expanded','false');e.removeAttribute('aria-controls')});const time=document.querySelector('[data-testid="Venue Time Select"]').id.slice(5);document.querySelector('#result').innerHTML='<a href="/en/shops/restaurant1/reserve?start_date=2026-09-19&pax=4&start_time='+time+'">'+time+'</a>'}</script>`;
  let calls=0;const diagnostics:string[]=[];
  const executor = new BrowserTaskExecutor(localFixture({[tableCheckDiscoveryUrl(candidate)]:`<a href="${sourceUrl}">Restaurant 1</a>`,[sourceUrl]:html},runtimeKind),{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate:80,onDiagnostic:d=>{if(d.event==="REJECTED"||d.event==="MODEL_ACTION"||d.event==="METHOD_INCOMPLETE"||d.event==="POST_ACTION_VERIFIED")diagnostics.push(`${d.event}: ${d.detail??""}`)},modelDecision:{async decide(input){
    calls++;
    assert.ok(!input.observation.targets.some(t=>t.label==='Sep 19th'),"selected disabled calendar day must prevent repeated date trigger clicks");
    if(calls===2 || calls>=4) assert.ok(!input.observation.targets.some(t=>t.role==='combobox'&&t.label===(calls===2?'Any party size':'Time')), 'an already open list must not invite another open action');
    const label=calls===1?'Any party size':calls===2?'4 guests':calls===3?'Time':calls===6?'19:00':'20:00';
    const target=input.observation.targets.find(t=>t.label===label&&t.role===(calls===1||calls===3?'combobox':'option'));
    assert.ok(target);assert.equal(target.kind,calls===1||calls===3?'BUTTON':'OPTION');
    return calls===1||calls===3||calls===5?{type:'CLICK',targetRef:target.ref,reason:'Open choices or test rejected out-of-window click'}:{type:'CHOOSE_OPTION',field:calls===2?'PARTY_SIZE':'TIME',targetRef:target.ref,reason:'Select observed authoritative query choice'};
  }}});
  try {
    const signal=new AbortController().signal;
    const result=await new TableCheckBrowserAvailability(executor).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:'2026-09-19',partySize:4,timeWindow:{earliest:'18:30',latest:'19:30'},hardCriteria:[]},signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,'AVAILABLE',JSON.stringify({result,calls,diagnostics}));
    assert.equal(result.offers.length,1);assert.equal(calls,6);
    const session=await executor.acquire(signal,'TABLECHECK','AVAILABILITY');
    const selectedControls = await session.observeControls!();
    assert.equal(selectedControls.find(control=>control.role==='combobox'&&control.label==='Any party size')?.value,'4 guests');
    assert.equal(selectedControls.find(control=>control.role==='combobox'&&control.label==='Time')?.value,'19:00');
    assert.equal(selectedControls.find(control=>control.role==='combobox'&&control.label==='Time')?.controlledListboxId,undefined);
    assert.match((await session.snapshot()).html, /aria-label="Time"[^>]*value=""/, "the production Adapter consumed the proxy display while input.value remained empty");
    assert.ok(!(await session.snapshot()).html.includes('data-outside="changed"'),'neither authoritative nor generic clicks may select outside the allowed time window');
  } finally {await executor.close();}
});
}


for (const runtimeKind of ["LOCAL", "CLOUDFLARE_SESSION"] as const) {
  test(`${runtimeKind} Tabelog Adapter grounds passive exact-query responses and clears them on navigation`, async () => {
    const {TabelogBrowserAvailability}=await import("../../integrations/tabelog/tabelog-browser-availability.js");
    const {fixtureCandidates}=await import("../restaurant-fixtures.js");
    const candidate=structuredClone(fixtureCandidates[0]!);candidate.restaurant.sourceIds.phone="03-1111-2222";
    const sourceUrl="https://tabelog.com/en/tokyo/A1301/A130103/13292459/";
    const endpoint="https://tabelog.com/en/booking/calendar/find_vacancy/";
    const html=`<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><p>Reserve Guests</p>
      <div class="rstdtl-course-list js-rstdtl-course-list"><span class="rstdtl-course-list__course-title-text">Seasonal lunch course</span><p class="rstdtl-course-list__desc">Lunch only, 11:30 to 14:00.</p><del>JPY 9,000</del><span class="rstdtl-course-list__price-num">JPY<em>8,000</em><span>（Price including tax）per person</span></span><dl class="rstdtl-course-list__course-rule"><dt>Number of people</dt><dd>2 - 4</dd></dl></div>
      <div class="p-booking-calendar">
      <p class="js-calendar-day-target is-selectable is-current" data-year="2026" data-month="9" data-day="17">17</p>
      <p class="js-calendar-day-target is-selectable" data-year="2026" data-month="9" data-day="20">20</p>
      <button type="button" class="js-people-button is-active">2</button><button type="button" class="js-people-button">4</button>
      <input type="hidden" class="js-people-hidden-value" value="2"></div>
      <script>function query(){fetch('/en/booking/calendar/find_vacancy/?member='+document.querySelector('input').value);fetch('/unrelated.json')}
      document.querySelectorAll('.js-calendar-day-target').forEach(el=>el.onclick=()=>{document.querySelector('.is-current').classList.remove('is-current');el.classList.add('is-current');query()});
      document.querySelectorAll('.js-people-button').forEach(el=>el.onclick=()=>{document.querySelector('.is-active').classList.remove('is-active');el.classList.add('is-active');document.querySelector('input').value=el.textContent;query()});</script>`;
    const payload=(members:number,time:string)=>JSON.stringify({base_date:{year:2026,month:9,day:20},members,selection:{0:{time,url:`/en/booking/form_course/new?rcd=13292459&member=${members}&visit_date=20260920&visit_time=${time.replace(':','')}`}}});
    const pages={ [sourceUrl]:html,"https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201":`<a class="list-rst__rst-name-target" href="${sourceUrl}" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>`,[endpoint+"?member=2"]:payload(2,"19:00"),[endpoint+"?member=4"]:payload(4,"18:45"),"https://tabelog.com/unrelated.json":JSON.stringify({private:"must not capture"}) };
    let calls=0;
    const executor=new BrowserTaskExecutor(localFixture(pages,runtimeKind),{ maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(input){const field=++calls===1?"DATE" as const:"PARTY_SIZE" as const;if(calls===2)assert.ok(!input.observation.targets.some(t=>t.label==="Date 2026-09-20"), "selected date is evidence, not a repeat action");const target=input.observation.targets.find(t=>t.label===(field==="DATE"?"Date 2026-09-20":"Guests 4"));assert.ok(target);return {type:"CLICK_AUTHORITATIVE",field,targetRef:target.ref,reason:"Exact query"}}},maxModelCallsPerCandidate:2});
    const signal=new AbortController().signal;
    try{
      const result=await new TabelogBrowserAvailability(executor).check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:"2026-09-20",partySize:4,timeWindow:{earliest:"18:30",latest:"19:30"},hardCriteria:[]},signal);
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status,"AVAILABLE",JSON.stringify(result));
      assert.equal(result.offers.length,1);assert.match(result.offers[0]!.dateTime,/T18:45/);
      const listed = result.evidence.find(item => item.kind === "RESTAURANT_FACT")?.claims;
      assert.deepEqual(listed?.listedCourseDetails, ["Seasonal lunch course — JPY 8,000 （Price including tax）per person; Number of people 2 - 4. Lunch only, 11:30 to 14:00."]);
      assert.equal(listed?.coursePriceYen, undefined, "a listed lunch course is not the dinner offer price");
      assert.equal(result.offers[0]!.price, undefined);
      const session=await executor.acquire(signal,"TABELOG","AVAILABILITY");
      const snapshot=await session.snapshot();assert.ok(snapshot.responses?.length);assert.ok(snapshot.responses.every(r=>r.url.startsWith(endpoint)));
      await session.navigate(sourceUrl);assert.deepEqual((await session.snapshot()).responses,[]);
    }finally{await executor.close()}
  });
}

test("workspace New case survives a late initial case-list response", async () => {
  const { LOCAL_WORKSPACE_PAGE } = await import('../../web/local-workspace-page.js');
  const browser = await chromium.launch({headless:true});
  let release!: () => void;
  const pending = new Promise<void>(resolve => {release = resolve});
  let oldCaseRequests = 0;
  try {
    const page = await browser.newPage();
    await page.route('https://workspace.test/**',async route => {
      const path = new URL(route.request().url()).pathname;
      if(path === '/') return route.fulfill({contentType:'text/html',body:LOCAL_WORKSPACE_PAGE});
      if(path === '/api/cases') {
        await pending;
        return route.fulfill({json:{cases:[{caseId:'old-case',title:'Old case',status:'COMPLETED',phase:'PRESENT_RESULTS'}]}});
      }
      if(path === '/api/cases/old-case') oldCaseRequests++;
      return route.fulfill({json:{}});
    });
    await page.goto('https://workspace.test/');
    await page.locator('#workspace').waitFor({state:'visible'});
    await page.locator('#new-case').click();
    const response = page.waitForResponse(r=>r.url()==='https://workspace.test/api/cases');
    release(); await response;
    await page.locator('.case-link').waitFor();
    await page.waitForTimeout(100);
    assert.equal(oldCaseRequests,0,'a late list must not select a case after the user chose New case');
    assert.equal(await page.locator('#case-title').innerText(),'Start a case');
  } finally {release();await browser.close()}
});

for (const field of ["PARTY_SIZE", "TIME"] as const) test(`C5a one choice reveals a clipped ${field} option inside its current list`, async () => {
  const expected = field === "PARTY_SIZE" ? "10 guests" : "19:00";
  const choices = field === "PARTY_SIZE" ? Array.from({ length: 12 }, (_, i) => `${i + 1} guests`) : ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];
  const runtime = localFixture(`<style>#choices{height:80px;width:220px;overflow:auto}[role=option]{height:30px}</style>
    <button role="combobox" aria-label="${field}" aria-expanded="true" aria-controls="choices">${field}</button>
    <div id="choices" role="listbox">${choices.map(choice => `<div role="option" onclick="document.querySelector('button').setAttribute('aria-label','${choice}');document.querySelector('button').setAttribute('aria-expanded','false');document.querySelector('#choices').hidden=true;document.body.dataset.choice='${choice}'">${choice}</div>`).join("")}</div>`);
  let calls = 0;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    calls++;
    const choice = input.observation.targets.find(target => target.kind === "OPTION" && target.label === expected);
    assert.ok(choice, "clipped requested option must be offered");
    assert.equal(choice.outsideViewport, true);
    assert.deepEqual(choice.availableActions, [`CHOOSE_OPTION:${field}`]);
    return { type: "CHOOSE_OPTION", targetRef: choice.ref, field, reason: "Choose the current requested option; executor owns scrolling" };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "FIXTURE", "AVAILABILITY");
  try {
    await executor.navigate({ session, signal, source: "FIXTURE", stage: "AVAILABILITY", allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:clipped-choice", source: "FIXTURE", stage: "AVAILABILITY", session, signal,
      allowedOrigins: ["https://www.tablecheck.com"], goal: { outlet: { name: "Fixture" }, partySize: 10, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Select one observed query option", completion: snapshot => ({ complete: snapshot.html.includes(`data-choice="${expected}"`), reason: "Choice not observed", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: false }) });
    assert.equal(result.status, "COMPLETED"); assert.equal(calls, 1);
    assert.match(result.snapshot.html, new RegExp(`data-choice="${expected}"`));
  } finally { await executor.close(); }
});

test("C5a excludes disabled, occluded and noncurrent list options", async () => {
  const runtime = localFixture(`<style>#current{position:relative;width:220px;height:150px}[role=option]{height:30px}.cover{position:absolute;left:0;top:30px;width:220px;height:30px;background:white;z-index:3}</style>
    <button role="combobox" aria-label="Guests" aria-expanded="true" aria-controls="current">Guests</button>
    <div id="current" role="listbox"><div role="option" aria-disabled="true">10 guests</div><div role="option">11 guests</div><div class="cover">Obscuring layer</div><div role="option">9 guests</div></div>
    <div id="other" role="listbox"><div role="option">12 guests</div></div>`);
  let calls = 0; let observed: unknown;
  const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  modelDecision: { async decide(input) {
    calls++; observed = input.observation.targets;
    for (const label of ["10 guests", "11 guests", "12 guests"]) assert.equal(input.observation.targets.some(target => target.kind === "OPTION" && target.label === label), false, label);
    assert.equal(input.observation.targets.some(target => target.label === "9 guests"), true, "an unrelated enabled choice remains observed");
    return { type: "REQUEST_HUMAN_HELP", reason: "Requested choice is not actionable" };
  } } });
  const signal = new AbortController().signal;
  const session = await executor.acquire(signal, "FIXTURE", "AVAILABILITY");
  try {
    await executor.navigate({ session, signal, source: "FIXTURE", stage: "AVAILABILITY", allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({ taskId: "fixture:choice-boundary", source: "FIXTURE", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture" }, partySize: 10, hardCriteria: [] }, objective: "Observe safe choices", completion: () => ({ complete: false, reason: "Requested choice absent" }) });
    assert.equal(result.status, "REQUESTED_HUMAN_HELP", JSON.stringify(observed)); assert.equal(calls, 1);
  } finally { await executor.close(); }
});

test("C3 settles delayed date results before asking the model and never completes from stale loading stock", async () => {
  for (const timeout of [false,true]) {
    const directory=await mkdtemp(join(tmpdir(),"settle-fixture-"));
    const origin="https://settle.example", target=origin+"/calendar";
    const html=`<title>Fixture</title><button id="date">Date 2026-10-23</button><div id="result"></div><script>
      date.onclick=()=>{result.innerHTML='<div class="loader" aria-busy="true">Loading</div><p>OLD_AVAILABLE</p>';
      ${timeout ? "" : "setTimeout(()=>{result.innerHTML='<button id=guests>Guests 10</button>';document.querySelector('#guests').onclick=()=>result.textContent='CURRENT_AVAILABLE';},650);"}}
    </script>`;
    const har=join(directory,"source.har");await writeFile(har,replayHar(target,html));
    const raw=new LocalPlaywrightChromium();const runtime:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:input=>raw.openSession({...input,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]},replayHarPath:har})};
    let calls=0, pendingHint=false;
    const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxModelCallsPerCandidate:4,maxOperationsPerCandidate:40,maxElapsedMsPerCandidate:8000,modelDecision:{async decide(value){calls++;if(calls===1)return {type:"CLICK_AUTHORITATIVE",field:"DATE",targetRef:value.observation.targets.find(x=>x.label==='Date 2026-10-23')!.ref,reason:"Select requested date"};pendingHint=value.progress.includes('still loading');const guests=value.observation.targets.find(x=>x.label==='Guests 10');return guests?{type:"CLICK_AUTHORITATIVE",field:"PARTY_SIZE",targetRef:guests.ref,reason:"Select requested party"}:{type:"REQUEST_HUMAN_HELP",reason:"Loading has not settled"};}}});
    const signal=new AbortController().signal;const session=await executor.acquire(signal,"FIXTURE","AVAILABILITY");
    try {
      await executor.navigate({session,signal,source:"FIXTURE",stage:"AVAILABILITY",allowedOrigins:[origin],url:target});
      const result=await executor.runSkill({taskId:"settle",session,signal,source:"FIXTURE",stage:"AVAILABILITY",allowedOrigins:[origin],goal:{outlet:{name:"Fixture"},date:"2026-10-23",partySize:10,hardCriteria:[]},objective:"Select date and guests",completion:snapshot=>({complete: /CURRENT_AVAILABLE|OLD_AVAILABLE/.test(snapshot.text),reason:"Select party after date loads", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: resultRegionBusy(snapshot.html, /\bresult\b/, /carousel|suggestions/) })});
      assert.equal(result.status,timeout?"REQUESTED_HUMAN_HELP":"COMPLETED");
      assert.equal(calls,2);
      if(timeout)assert.equal(pendingHint,true);
    } finally {await executor.close();await rm(directory,{recursive:true,force:true});}
  }
});

test("C3 visible-state fallback settles attribute-only carousel and rejects changing text or skeleton", async () => {
  for (const mode of ["carousel", "text", "skeleton"] as const) {
    const runtime = localFixture(`<title>Stable-result Fixture</title><div id="result">CURRENT_RESULT${mode === "skeleton" ? '<div class="skeleton">Loading</div>' : ''}</div><button>Guests 2</button><aside id="carousel">Carousel</aside><script>
      let n=0;setInterval(()=>{${mode === "text" ? "result.textContent+=' batch '+(++n);" : "carousel.setAttribute('data-frame',String(++n));"}},150);
    </script>`);
    const diagnostics: BrowserExecutionDiagnostic[] = [];
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxElapsedMsPerCandidate: 10_000, onDiagnostic: d => diagnostics.push(d), modelDecision: { async decide() { return { type: "REQUEST_HUMAN_HELP", reason: "Pending Fixture must not complete" }; } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "FIXTURE", "AVAILABILITY");
    try {
      await executor.navigate({ session, signal, source: "FIXTURE", stage: "AVAILABILITY", allowedOrigins: ["https://www.tablecheck.com"], url });
      const read = await executor.runSkill({ taskId: `settle:${mode}`, source: "FIXTURE", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], goal: {outlet:{name:"Fixture"},partySize:2,hardCriteria:[]}, objective:"Read current result", completion:snapshot=>({complete:snapshot.text.includes("CURRENT_RESULT"),reason:"Current result missing", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: resultRegionBusy(snapshot.html, /\bresult\b/, /carousel|suggestions/) }) });
      assert.equal(read.status, mode === "carousel" ? "COMPLETED" : "REQUESTED_HUMAN_HELP", mode);
      assert.equal(read.snapshot.settlement, mode === "carousel" ? "SETTLED" : "PENDING", mode);
      const waits = diagnostics.filter(d => d.event === "ASYNC_WAIT");
      assert.ok(waits.length > 0);
      assert.ok(waits.every(d => (d.waitMs ?? 0) >= 300));
      assert.equal(waits.some(d => d.detail === "PAGE_STILL_LOADING_WITHIN_BOUND"), mode !== "carousel");
    } finally { await executor.close(); }
  }
});

test("C4 blocks repeated toggle state but allows the same Next control on changed pages", async () => {
  for (const mode of ["toggle", "pagination"] as const) {
    const runtime=localFixture(`<title>Navigation Fixture</title><button id="next" aria-expanded="false">${mode==='toggle'?'Filters':'Next'}</button><output id="result">${mode==='toggle'?'Closed':'Page 0'}</output><script>let clicks=0;next.onclick=()=>{clicks++;${mode==='toggle'?"next.setAttribute('aria-expanded',String(clicks%2===1));result.textContent=clicks%2?'Open':'Closed';":"result.textContent='Page '+clicks;"}}</script>`);
    let calls=0;const history: import("../../infrastructure/browser/browser-action-decision.js").BrowserReadHistoryStep[][]=[];
    const diagnostics:BrowserExecutionDiagnostic[]=[];
    const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxModelCallsPerCandidate:6,maxOperationsPerCandidate:100,maxElapsedMsPerCandidate:15000,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(value){calls++;history.push(value.history);return {type:"CLICK",targetRef:value.observation.targets.find(x=>x.label===(mode==='toggle'?'Filters':'Next'))!.ref,reason:"Advance current navigation"};}}});
    const signal=new AbortController().signal;const session=await executor.acquire(signal,"FIXTURE","DISCOVERY");
    try{
      await executor.navigate({session,signal,source:"FIXTURE",stage:"DISCOVERY",allowedOrigins:["https://www.tablecheck.com"],url});
      const read=await executor.runSkill({taskId:`repeat:${mode}`,session,signal,source:"FIXTURE",stage:"DISCOVERY",allowedOrigins:["https://www.tablecheck.com"],goal:{outlet:{name:"Fixture"},hardCriteria:[]},objective:"Advance public navigation",completion:s=>({complete:mode==='pagination'&&s.text.includes('Page 3'),reason:"Keep advancing", resultKey: JSON.stringify([s.url, s.text, s.interactiveState]), resultBusy: false })});
      assert.equal(read.status,mode==='toggle'?"NO_SAFE_ACTION":"COMPLETED");
      const repeats=diagnostics.filter(d=>d.detail==='REPEATED_FROM_SAME_STATE');
      assert.equal(repeats.length,mode==='toggle'?2:0,mode);
      assert.equal(calls,mode==='toggle'?4:3);
      if(mode==='toggle'){
        assert.match(read.snapshot.text,/Filters\s*Closed/);
        assert.equal(history[3]!.at(-1)?.reason,'REPEATED_FROM_SAME_STATE');
      }
    }finally{await executor.close();}
  }
});


test("C3b rotating suggestions accept identical bound results but changing results and skeleton remain pending", async () => {
  for (const mode of ["suggestions", "append", "skeleton", "unrelated-skeleton"] as const) {
    const diagnostics: BrowserExecutionDiagnostic[] = [];
    const runtime=localFixture(`<title>Result fixture</title><section id="result">Venue A${mode==='skeleton'?'<div class="skeleton">Loading</div>':''}</section><aside id="suggestions">Suggestion 0</aside>${mode==='unrelated-skeleton'?'<div class="image skeleton">Loading</div>':''}<script>let n=0;setInterval(()=>{suggestions.textContent='Suggestion '+(++n);${mode==='append'?"result.textContent+=' Venue '+n;":''}},120)</script>`);
    const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, maxElapsedMsPerCandidate:12000,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(){return {type:"REQUEST_HUMAN_HELP",reason:"Incomplete current result"};}}});
    const signal=new AbortController().signal;const session=await executor.acquire(signal,"FIXTURE","DISCOVERY");
    try {
      await executor.navigate({session,signal,source:"FIXTURE",stage:"DISCOVERY",allowedOrigins:["https://www.tablecheck.com"],url});
      const read=await executor.runSkill({taskId:"bound-result",session,signal,source:"FIXTURE",stage:"DISCOVERY",allowedOrigins:["https://www.tablecheck.com"],goal:{outlet:{name:"Fixture"},hardCriteria:[]},objective:"Read result set",completion:s=>({complete:s.text.includes("Venue A"),reason:"Missing venues",resultKey:s.html.match(/<section id="result">([^<]*)/)?.[1] ?? "", resultBusy: resultRegionBusy(s.html, /\bresult\b/, /carousel|suggestions/) })});
      assert.equal(read.status,(mode==='suggestions'||mode==='unrelated-skeleton')?"COMPLETED":"REQUESTED_HUMAN_HELP",mode);
      assert.equal(read.snapshot.settlement,(mode==='suggestions'||mode==='unrelated-skeleton')?"SETTLED":"PENDING",mode);
      assert.ok(diagnostics.filter(d=>d.event==='ASYNC_WAIT').every(d=>d.url===url),"navigation wait uses actual URL");
    } finally {await executor.close();}
  }
});


test("C3b Chromium ignores an outstanding image once data has completed", async () => {
  const sockets=new Set<import("node:net").Socket>();
  const server=createServer((request,response)=>{
    if(request.url==='/image'){return;}
    response.setHeader('content-type','text/html');response.end('<title>Data ready</title><p>CURRENT_RESULT</p><img src="/image">');
  });
  server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();assert.ok(address&&typeof address!=='string');
  const origin=`http://127.0.0.1:${address.port}`;
  const executor=new BrowserTaskExecutor(new LocalPlaywrightChromium(), { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','DISCOVERY',{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]});
  try{
    const started=Date.now();
    await executor.navigate({session,signal,source:'FIXTURE',stage:'DISCOVERY',allowedOrigins:[origin],url:origin});
    const snapshot=await executor.snapshot({session,signal,source:'FIXTURE',stage:'DISCOVERY'});
    assert.equal(snapshot.settlement,'SETTLED');assert.ok(Date.now()-started<1500);
    assert.equal(snapshot.settlementDiagnostics?.pendingByType.image,1);
    assert.equal(snapshot.settlementDiagnostics?.blockingDataRequests,0);
  }finally{await executor.close();for(const socket of sockets)socket.destroy();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});


test("C2a recorded unavailable calendar dates are observed and cannot drift to other days", async () => {
  const {tabelogQueryControlHints}=await import("../../integrations/tabelog/tabelog-query-controls.js");
  for(const [name,date,sourceUrl] of [["yuu","2026-10-24","https://tabelog.com/en/tokyo/A1301/A130101/13291436/"],["labo","2026-10-22","https://tabelog.com/en/tokyo/A1303/A130301/13284556/"]]){
    const html=await readFile(new URL(`./fixtures/calendar-${name}-20261010.html`,import.meta.url),'utf8');
    let calls=0;
    const executor=new BrowserTaskExecutor(localFixture({[sourceUrl!]:html}),{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(value){calls++;
      const requested=value.observation.targets.find(t=>t.value===date);
      assert.ok(requested,"the recorded unavailable day must be an observed target");
      assert.equal(requested.rejectionReason,"DATE_NOT_SELECTABLE");assert.deepEqual(requested.availableActions,[]);
      const other=value.observation.targets.find(t=>/^Date 2026-10-/.test(t.label)&&t.value!==date&&!t.disabled);
      assert.ok(other);assert.ok(!other.availableActions?.includes("CLICK"),"another date cannot be a generic click");
      return {type:"CLICK",targetRef:other.ref,reason:"Counterexample tries another day"};
    }}});
    const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','AVAILABILITY');
    try{
      await executor.navigate({session,signal,source:'FIXTURE',stage:'AVAILABILITY',allowedOrigins:['https://tabelog.com'],url:sourceUrl!});
      const read=await executor.runSkill({taskId:'calendar',session,signal,source:'FIXTURE',stage:'AVAILABILITY',allowedOrigins:['https://tabelog.com'],goal:{outlet:{name:'Recorded outlet'},date:date!,partySize:2,hardCriteria:[]},objective:'Read exact requested date',controlHints:tabelogQueryControlHints,completion:()=>({complete:false,reason:'Requested date cannot be selected'})});
      assert.equal(read.status,'NO_SAFE_ACTION');assert.equal(read.reasonCode,'DATE_NOT_SELECTABLE');assert.ok(calls>=1&&calls<=2);
    }finally{await executor.close();}
  }
});

test("C2a selectable requested date retains authoritative click and blocks an ordinary other-date click", async () => {
  const html='<table><caption>October 2026</caption><tr><td><button onclick="this.textContent=\'Selected\'">24</button></td><td><button>25</button></td></tr></table>';
  const executor=new BrowserTaskExecutor(localFixture(html),{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{async decide(value){
    const requested=value.observation.targets.find(t=>t.value==='2026-10-24')!;
    assert.ok(requested.availableActions?.includes('CLICK_AUTHORITATIVE:DATE'));
    const other=value.observation.targets.find(t=>t.value==='2026-10-25')!;assert.deepEqual(other.availableActions,[]);
    return {type:'CLICK_AUTHORITATIVE',field:'DATE',targetRef:requested.ref,reason:'Select current requested date'};
  }}});
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','AVAILABILITY');
  try{await executor.navigate({session,signal,source:'FIXTURE',stage:'AVAILABILITY',allowedOrigins:['https://www.tablecheck.com'],url});
    const read=await executor.runSkill({taskId:'selectable',session,signal,source:'FIXTURE',stage:'AVAILABILITY',allowedOrigins:['https://www.tablecheck.com'],goal:{outlet:{name:'Fixture'},date:'2026-10-24',hardCriteria:[]},objective:'Select date',completion:s=>({complete:s.text.includes('Selected'),reason:'Date not selected', resultKey: JSON.stringify([s.url, s.text, s.interactiveState]), resultBusy: false })});assert.equal(read.status,'COMPLETED');
  }finally{await executor.close();}
});

test('P1-D Chromium observes LOCATION binding and fills exactly the resolved name, excluding personal address and nameless requests',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'praxis-location-'));const pageUrl='https://directory.example/areas';const harPath=join(directory,'location.har');
 await writeFile(harPath,replayHar(pageUrl,'<title>Areas</title><input type="search" name="location" aria-label="Area or station"><input name="customer_address" aria-label="Location address"><output id="result">Choose location</output><script>document.querySelector("[name=location]").oninput=e=>document.querySelector("#result").textContent="Location selected: "+e.target.value</script>'));
 try{for(const name of ['Ebisu Station',undefined]){
  const raw=new LocalPlaywrightChromium();const policy={documentOrigins:['https://directory.example'],genericPublicRead:true,staticResources:[],dynamicReads:[]} as const;
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:input=>raw.openSession({...input,networkPolicy:policy,replayHarPath:harPath})};let calls=0;
  const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{decide:async input=>{calls++;const area=input.observation.targets.find(t=>t.label==='Area or station')!,address=input.observation.targets.find(t=>t.label==='Location address')!;assert.ok(!address.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'));assert.equal(area.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION')??false,name!==undefined);return name?{type:'FILL_AUTHORITATIVE',field:'LOCATION',targetRef:area.ref,reason:'Apply exact name'}:{type:'REQUEST_HUMAN_HELP',reason:'No authoritative name'};}}});
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'DIRECTORY','DISCOVERY',policy);
  try{await executor.navigate({session,signal,source:'DIRECTORY',stage:'DISCOVERY',allowedOrigins:policy.documentOrigins,url:pageUrl});const result=await executor.runSkill({taskId:'location-fixture',session,signal,source:'DIRECTORY',stage:'DISCOVERY',allowedOrigins:policy.documentOrigins,goal:{outlet:{name:'Restaurants'},location:{latitude:35.66,longitude:139.7,radiusMeters:1000,...(name?{name}:{})},hardCriteria:[]},objective:'Select the public area',completion:snapshot=>({complete:snapshot.text.includes('Location selected: Ebisu Station'),resultBusy:false,resultKey:snapshot.text,reason:'Observe the exact selected location'})});assert.equal(result.status,name?'COMPLETED':'REQUESTED_HUMAN_HELP');assert.equal(calls,1);assert.equal(result.controls.find(c=>c.label==='Location address')?.value,'');}finally{await executor.close();}
 }}finally{await rm(directory,{recursive:true,force:true});}
});


test('model full-page OPEN_LINK allows slow DOMContentLoaded and times out only within the remaining navigation budget',async()=>{
 for(const mode of ['slow','budget'] as const){
  const delays=new Set<ReturnType<typeof setTimeout>>();
  const server=createServer((request,response)=>{
   if(request.url==='/start'){response.end('<title>Fixture</title><a href="/next">Public result</a>');return;}
   const timer=setTimeout(()=>{delays.delete(timer);response.end('<title>Destination</title><h1>Loaded destination</h1>');},mode==='slow'?6500:5000);delays.add(timer);response.on('close',()=>{clearTimeout(timer);delays.delete(timer);});
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};const origin=`http://127.0.0.1:${address.port}`;
  const diagnostics:BrowserExecutionDiagnostic[]=[];let calls=0;
  const executor=new BrowserTaskExecutor(new LocalPlaywrightChromium(),{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, maxElapsedMsPerCandidate:mode==='slow'?15000:2000,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(input){calls++;return {type:'OPEN_LINK',targetRef:input.observation.targets.find(t=>t.label==='Public result')!.ref,reason:'Read observed public page'};}}});
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','DISCOVERY');
  try{
   await executor.navigate({source:'FIXTURE',stage:'DISCOVERY',session,signal,allowedOrigins:[origin],url:origin+'/start'});const started=Date.now();
   const reading=executor.runSkill({taskId:'slow-navigation',source:'FIXTURE',stage:'DISCOVERY',session,signal,allowedOrigins:[origin],goal:{outlet:{name:'Fixture'},hardCriteria:[]},objective:'Read public result',completion:page=>({complete:page.text.includes('Loaded destination'),resultKey:page.url,resultBusy:false,reason:'Observe destination document'})});
   if(mode==='slow'){const read=await reading;assert.equal(read.status,'COMPLETED');assert.ok(Date.now()-started>=6000);assert.equal(read.snapshot.url,origin+'/next');}
   else{await assert.rejects(reading,{code:'BROWSER_TIMEOUT'});assert.ok(Date.now()-started<5000);assert.ok(diagnostics.some(d=>d.event==='OPERATION_FAILED'&&d.lifecycle.failureCode==='BROWSER_TIMEOUT'));}
   assert.equal(calls,1);
  }finally{await executor.close();for(const timer of delays)clearTimeout(timer);server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
  assert.equal(diagnostics.filter(d=>d.event==='CLOSED').length,1,'the owned session closes once, including timeout');
 }
});

test('P21 discovery uses DOM category links despite CSS and rejects foreign regions',async()=>{
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const {tabelogDiscoveryPack}=await import('../../integrations/restaurant-search/source-packs.js');
 const {restaurantSearchIntentFingerprint}=await import('../../domains/restaurant/contracts.js');
 const empty=await readFile(new URL('../../integrations/tabelog/fixtures/empty-kaiseki.html',import.meta.url),'utf8');
 const homepageFragment=await readFile(new URL('../../integrations/tabelog/fixtures/p21-region-homepage-categories.html',import.meta.url),'utf8');
 for(const mode of ['refine','reject','homepage'] as const){
 const region=mode==='homepage'?'https://tabelog.com/en/tokyo/A1303/':'https://tabelog.com/en/tokyo/A1000/A100001/rstLst/';
 const category=mode==='homepage'?region+'rstLst/sushi/':region+'cuisine/';
 const observedCategory=mode==='homepage'?category+'?sw=omakase':category;const foreign='https://tabelog.com/en/tokyo/A2000/A200001/rstLst/cuisine/';
 const root='https://tabelog.com/en/tokyo/rstLst/';const keyword=region+'?sw=kaiseki';
 const outlet=(n:number)=>`https://tabelog.com/tokyo/A1000/A100001/${12345600+n}/`;
 const links=(count:number)=>Array.from({length:count},(_,i)=>`<article><a class="list-rst__rst-name-target" href="${outlet(i+1)}">Fixture venue ${i+1}</a></article>`).join('');
 const categories='<div style="display:none">'+(mode==='homepage'?homepageFragment:`<a href="${category}">Observed cuisine</a>`)+`</div><a href="${foreign}">Foreign category</a><a style="display:none" href="${mode==='homepage'?region+'rstLst/':region}hidden/">Hidden category</a>`;
  const directory=await mkdtemp(join(tmpdir(),'p21-retrieval-'));const harPath=join(directory,'discovery.har');const navigations:string[]=[];const requests:Array<{purpose:string;body:any}>=[];
  const dynamic=(html:string)=>'<title>Fixture results</title><div class="skeleton" aria-busy="true">Loading results</div><script>setTimeout(()=>{document.body.innerHTML='+JSON.stringify(html)+'},120)</script>';
  const pages:Record<string,string>={[root]:`<title>Directory</title><a href="${region}">Fixture District</a>`,[region]:'<title>Region</title>'+links(1)+categories,[keyword]:dynamic(empty+categories),[category]:dynamic(links(5)+categories)};
  for(let n=1;n<=5;n++)pages[outlet(n)]=`<title>Fixture venue ${n}</title><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:`Fixture venue ${n}`,address:'Fixture District, Tokyo',geo:{latitude:35,longitude:139}})}</script><h1>Fixture venue ${n}</h1><p class="rstinfo-table__address">Fixture District, Tokyo</p>`;
  await writeFile(harPath,replayHarPages(pages));
  const raw=new LocalPlaywrightChromium();
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{
    const session=await raw.openSession({...input,replayHarPath:harPath});
    return new Proxy(session,{get(target,key){if(key==='navigate')return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);return target.navigate(...args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  }};
  const model:import('../../core/model/contracts.js').ModelGateway={complete:async request=>{
    const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);requests.push({purpose:request.purpose,body});let result:unknown;
    if(request.purpose==='restaurant_discovery_retrieval'){
      assert.ok(body.observation.categories.every((c:{url:string})=>c.url!==foreign),'foreign-region categories never reach the planner');
      assert.ok(body.observation.categories.some((c:{url:string})=>c.url===observedCategory),'CSS-hidden observed category remains a planning option');
      if(mode==='homepage')assert.ok(body.observation.categories.length>0,'observed region homepage categories reach the planner');
      result=mode==='reject'?{choice:body.current?'KEEP':'CATEGORY',keyword:'',criterionRef:'',categoryUrl:body.current?'':foreign,reason:'Challenge source scope'}
        :body.current?{choice:'CATEGORY',keyword:'',criterionRef:'',categoryUrl:observedCategory,reason:'Explicit empty, use observed category'}:{choice:'KEYWORD',keyword:'kaiseki',criterionRef:'criterion:0',categoryUrl:'',reason:'Short positive retrieval'};
    }else{
      const target=body.observation.targets.find((t:{label:string})=>t.label==='Fixture District');
      result=target?{action:'OPEN_LINK',targetRef:target.ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Observed region'}:{action:'WAIT',targetRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'Wait for current result'};
    }
    return {invocationId:'fixture',provider:'FIXTURE',model:'script',outputText:JSON.stringify(result),finishReason:'TOOL_CALLS',latencyMs:0};
  }};
  const intent:import('../../domains/restaurant/contracts.js').RestaurantSearchIntent={timezone:'Asia/Tokyo',area:{query:'Fixture District'},criteria:[{text:'kaiseki restaurant',polarity:'POSITIVE',strength:'HARD'}]};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:15,maxAutomaticBrowserMs:30000,packs:[tabelogDiscoveryPack]}, {model,browser:runtime,google:new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async()=>{throw Error('No external Google');}}),clock:{now:()=>new Date('2026-10-17T00:00:00Z')}});
  try{
    const result=await assembly.search.search({readRunId:'chromium-retrieval',intent,continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:35,longitude:139,radiusMeters:1000,label:'Fixture District',areaMatchBasis:'NAMED_PLACE_RADIUS'}}},AbortSignal.timeout(30000));
    assert.equal(result.candidates.length,mode==='reject'?1:5,JSON.stringify({metadata:result.metadata,navigations}));
    assert.equal(navigations.includes(foreign),false);assert.equal(navigations.some(u=>u.includes('/reserve')||u.includes('/booking')),false);
    if(mode!=='reject'){
      assert.ok(navigations.indexOf(category)<navigations.indexOf(outlet(1)),'refinement precedes detail reads');
      assert.ok(requests.some(r=>r.body.observation?.explicitEmpty),'recorded real empty state is parsed after its loader disappears');
      assert.equal(result.metadata.nativeDiscoveryFunnel?.retrieval?.rewrites,1);
    }else assert.equal(result.metadata.nativeDiscoveryFunnel?.retrieval?.selection?.rejectionReason,'UNOBSERVED_OR_OUTSIDE_REGION_CATEGORY');
    assert.deepEqual(intent.criteria,[{text:'kaiseki restaurant',polarity:'POSITIVE',strength:'HARD'}]);
  }finally{await rm(directory,{recursive:true,force:true});}
 }
});

test('P21b production discovery checks search filters, falls back once, and records only read hints',async()=>{
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const {tabelogDiscoveryPack,tableCheckDiscoveryPack}=await import('../../integrations/restaurant-search/source-packs.js');
 const {restaurantSearchIntentFingerprint}=await import('../../domains/restaurant/contracts.js');
 for(const pack of [tabelogDiscoveryPack,tableCheckDiscoveryPack])for(const mode of ['applied','mismatch','empty','recommendation','wide','missing','homepage'] as const){
  if(mode==='homepage'&&!pack.browser!.directory)continue;
  const directory=await mkdtemp(join(tmpdir(),'p21b-search-'));const harPath=join(directory,'search.har');
  const isDirectory=!!pack.browser!.directory;
  const root=isDirectory?'https://tabelog.com/en/tokyo/rstLst/':pack.buildQuery({category:'restaurant',positiveCriteria:[],location:{latitude:35,longitude:139,radiusMeters:1000,label:'Fixture District',areaMatchBasis:'NAMED_PLACE_RADIUS'}}).url;
  const observed='https://tabelog.com/en/tokyo/A1000/A100001/rstLst/';
  const base=isDirectory?(mode==='homepage'?'https://tabelog.com/en/tokyo/A1000/A100001/':observed):root;
  const applied=isDirectory&&(mode==='applied'||mode==='homepage');
  const filtered=new URL(mode==='homepage'?observed:base);
  for(const [k,v] of Object.entries(isDirectory?{vac_net:'1',svd:'20261027',svt:'1900',svps:'2'}:{date:'2026-10-27',time:'19:00',num_people:'2',availability_mode:'same_meal_time'}))filtered.searchParams.set(k,v);
  const outlet=(n:number)=>isDirectory?`https://tabelog.com/tokyo/A1000/A100001/${12345600+n}/`:`https://www.tablecheck.com/en/fixture-venue-${n}`;
  const cards=(start:number)=>Array.from({length:5},(_,i)=>`<article><a ${isDirectory?'class="list-rst__rst-name-target"':''} href="${outlet(start+i)}">Fixture venue ${start+i}</a><span>19:00</span></article>`).join('');
  const selected=isDirectory?`<div><span class="js-list-sidebar-cal-date calendar__day is-current" data-date="20261027">27</span><select name="svps" aria-label="Guests"><option value="${mode==='mismatch'?3:2}" selected>Guests</option></select><select name="svt" aria-label="Time"><option value="1900" selected>19:00</option></select></div>`:`<button data-testid="Date Field">Date Oct 27, 2026 7:00 PM</button><button data-testid="Guests Field">Guests ${mode==='mismatch'?3:2} guests</button>`;
  const pages:Record<string,string>={[root]:isDirectory?`<title>Regions</title><a href="${observed}">Fixture District</a>`:'<title>Unfiltered</title>'+cards(1),[base]:'<title>Unfiltered</title>'+cards(1),[filtered.toString()]:'<title>Filtered</title>'+selected+(mode==='empty'?'No restaurants found':cards(6))};
  for(let n=1;n<=10;n++)pages[outlet(n)]=`<title>Fixture venue ${n}</title><h1>Fixture venue ${n}</h1><p class="${isDirectory?'rstinfo-table__address':'address'}">Fixture District, Tokyo</p><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:`Fixture venue ${n}`,address:'Fixture District, Tokyo',geo:{latitude:35,longitude:139}})}</script>`;
  const har=JSON.parse(replayHarPages(pages));
  if(mode==='homepage')har.log.entries.push({startedDateTime:'2026-10-07T00:00:00Z',request:{method:'GET',url:observed,httpVersion:'HTTP/1.1',headers:[],queryString:[],cookies:[],headersSize:-1,bodySize:-1},response:{status:302,statusText:'Found',httpVersion:'HTTP/1.1',headers:[{name:'location',value:base}],cookies:[],content:{size:0,mimeType:'text/html',text:''},redirectURL:base,headersSize:-1,bodySize:-1},cache:{},timings:{send:0,wait:0,receive:0}});
  await writeFile(harPath,JSON.stringify(har));const navigations:string[]=[];const snapshots:import('../../infrastructure/browser/browser-runtime.js').BrowserSnapshot[]=[];const raw=new LocalPlaywrightChromium();
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{const session=await raw.openSession({...input,replayHarPath:harPath});return new Proxy(session,{get(target,key){if(key==='navigate')return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);return target.navigate(...args);};if(key==='snapshot')return async()=>{const snapshot=await target.snapshot();snapshots.push(snapshot);return snapshot;};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});}};
  const model:import('../../core/model/contracts.js').ModelGateway={complete:async request=>{assert.equal(request.purpose,'browser_read_decide','no keyword planner without positive HARD');const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);const ref=body.observation.targets.find((t:{label:string})=>t.label==='Fixture District')?.ref;assert.ok(ref,'only region selection is scripted');return {invocationId:'region',provider:'FIXTURE',model:'script',outputText:JSON.stringify({action:'OPEN_LINK',targetRef:ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Observed region'}),finishReason:'TOOL_CALLS',latencyMs:0};}};
  const intent:import('../../domains/restaurant/contracts.js').RestaurantSearchIntent={timezone:'Asia/Tokyo',area:{query:'Fixture District'},target:{goal:mode==='recommendation'?'RECOMMENDATION':'AVAILABILITY',query:'dinner'},date:'2026-10-27',partySize:2,timeWindow:{earliest:'19:00',latest:mode==='wide'?'21:00':'19:00'},criteria:[]};
  // Recommendation can still use this controlled Pack; production ordering
  // excludes reservation-only sources before any browser work.
  const effectivePack=mode==='recommendation'?{...pack,meta:{...pack.meta,reservationOnly:false}}:pack;
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxAutomaticBrowserMs:30000,packs:[effectivePack]},{model,browser:runtime,google:new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async()=>{throw Error('No external API');}}),clock:{now:()=>new Date('2026-10-19T00:00:00Z')}});
  try{
   if(mode==='missing')delete intent.partySize;
   const before=structuredClone(intent);
   const read=await assembly.search.search({intent,readRunId:'search-hints',continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:35,longitude:139,radiusMeters:1000,label:'Fixture District',areaMatchBasis:'NAMED_PLACE_RADIUS'}}},AbortSignal.timeout(30000));
   assert.equal(navigations.includes(filtered.toString()),isDirectory&&!['recommendation','wide','missing'].includes(mode),JSON.stringify({mode,pack:pack.meta.id,navigations,metadata:read.metadata}));
   const selectedIds=read.candidates.map(c=>c.restaurant.sourceIds[isDirectory?'tabelog':'tablecheck']);
   assert.equal(read.metadata.nativeDiscoveryFunnel?.searchAvailabilityHint?.status,!isDirectory?'SKIPPED':applied?'APPLIED':['mismatch','empty'].includes(mode)?'FALLBACK':'SKIPPED');
   if(!isDirectory)assert.equal(read.metadata.nativeDiscoveryFunnel?.searchAvailabilityHint?.reason,mode==='recommendation'?'NOT_AVAILABILITY':'FILTER_TRANSPORT_NOT_REVIEWED');
   assert.ok((read.metadata.nativeDiscoveryFunnel?.pagesRead??0)<=(isDirectory?7:3));
   assert.equal(selectedIds.length,5);assert.deepEqual(selectedIds,Array.from({length:5},(_,i)=>isDirectory?'tokyo/A1000/A100001/'+(12345600+(applied?6:1)+i):'fixture-venue-'+((applied?6:1)+i)));
   if(applied)assert.ok(!navigations.includes(outlet(1)),'unfiltered cards are not mixed into a verified filtered batch');
   if(isDirectory&&(mode==='empty'||mode==='mismatch'))assert.ok(navigations.lastIndexOf(base)>navigations.indexOf(filtered.toString()),'one unfiltered fallback follows rejected hint');
   assert.ok(!navigations.some(value=>/\/reserve|\/booking|\/confirm|\/payment/.test(value)));assert.deepEqual(intent,before);
   assert.ok(!read.evidence.some(e=>e.kind==='AVAILABILITY'),'card times never create availability evidence');
   const recording=new BrowserReadRecording({directory,runId:'hint-recorder',reviewedReads:pack.reviewedReads});
   for(const snapshot of snapshots)recording.recordSnapshot(snapshot);
   const manifest=await recording.finish();
   if(isDirectory&&!['recommendation','wide','missing'].includes(mode))assert.ok((await readFile(join(manifest.path,'recording.json'),'utf8')).includes(isDirectory?'vac_net=1':'availability_mode=same_meal_time'),'recorder retains reviewed filter parameters');
  }finally{await rm(directory,{recursive:true,force:true});}
 }
});

test('P21b guarded search filters reject unaudited parameters under the production generic-read policy',async()=>{
 const {tabelogDiscoveryPack,tableCheckDiscoveryPack,discoveryPackNetworkPolicy}=await import('../../integrations/restaurant-search/source-packs.js');
 for(const pack of [tabelogDiscoveryPack,tableCheckDiscoveryPack]){
  const directory=await mkdtemp(join(tmpdir(),'p21b-network-'));const harPath=join(directory,'search.har');
  const good=pack.meta.id==='tabelog'?'https://tabelog.com/en/tokyo/A1303/rstLst/?vac_net=1&svd=20261027&svt=1900&svps=2':'https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35&geo_longitude=139&geo_distance=1km&auto_geolocate=false&date=2026-10-27&time=19%3A00&num_people=2&availability_mode=same_meal_time';
  const bad=good+'&unreviewed=1';await writeFile(harPath,replayHarPages({[good]:'<title>Public results</title>',[bad]:'<title>Unaudited field</title>'}));
  const session=await new LocalPlaywrightChromium().openSession({signal:AbortSignal.timeout(10000),networkPolicy:discoveryPackNetworkPolicy([pack]),replayHarPath:harPath});
  try{
   await session.prepareNavigation?.(good,{timeoutMs:2000});await session.navigate(good,{timeoutMs:2000});
   await assert.rejects(async()=>{await session.prepareNavigation?.(bad,{timeoutMs:2000});await session.navigate(bad,{timeoutMs:2000});},/admitted|blocked|failed/i);
  }finally{await session.close();await rm(directory,{recursive:true,force:true});}
 }
});

test('name-resolution benchmark uses the production prefix on Chromium and stops before any reservation navigation',async()=>{
 const {runNameResolutionMethodA}=await import('../../eval/restaurant/agent-loop/name-resolution-method-a.js');
 const subject={name:'Fixture Restaurant',address:'1-1 Tokyo Fixture Street',phone:'03-1111-2222',coordinates:{lat:35.66,lng:139.7}};
 for(const platform of ['TABELOG','TABLECHECK'] as const){
  const detail=platform==='TABELOG'?'https://tabelog.com/tokyo/A1303/A130301/12345/':'https://www.tablecheck.com/en/fixture';
  const searches=platform==='TABELOG'?['https://tabelog.com/en/tokyo/rstLst/?sw=Fixture%20Restaurant']:['https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&search_text=Fixture+Restaurant&geo_latitude=35.66&geo_longitude=139.7&geo_distance=5km&auto_geolocate=false'];
  const html=`<title>Fixture Restaurant</title><h1>Fixture Restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:subject.name,address:subject.address,telephone:subject.phone})}</script>${platform==='TABELOG'?'<p>Availability</p><select name="party_size"><option value="1">1</option></select><select name="date"><option value="1970-01-01">1970-01-01</option></select>':'<a href="https://www.tablecheck.com/en/shops/fixture/reserve">Reserve</a>'}`;
  const pages:Record<string,string>={[detail]:html};for(const search of searches)pages[search]=`<a class="list-rst__rst-name-target" href="${detail}">Fixture Restaurant</a>`;
  const actions:string[]=[],fixture=localFixture(pages);
  const runtime:BrowserRuntime={openSession:async input=>{
   const session=await fixture.openSession(input);
   return new Proxy(session,{get(target,key){
    const value=Reflect.get(target,key);
    if(typeof value!=='function')return value;
    return (...args:unknown[])=>{if(['select','fill','click'].includes(String(key)))actions.push(String(key));return value.apply(target,args);};
   }});
  }};
  const artifact=await runNameResolutionMethodA('chromium',platform,subject,{mode:'OFFLINE_FIXTURE',runtime,signal:new AbortController().signal});
  assert.equal(artifact.observation.accepted,true,JSON.stringify(artifact.observation));
  assert.equal(artifact.observation.rawSelectedPageUrl,detail);assert.equal(artifact.observation.modelCalls,0);
  assert.equal(artifact.pages.some(p=>p.url.includes('/reserve')),false);assert.equal(artifact.boundary.availabilityEvaluated,false);assert.deepEqual(actions,[],'No underlying request-control action after HIGH identity');
 }
});

test('P21c recorded regional links reach six controlled development results through the production assembly',async()=>{
 const {gunzipSync}=await import('node:zlib');
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const {tabelogDiscoveryPack,googlePlacesDiscoveryPack}=await import('../../integrations/restaurant-search/source-packs.js');
 const records=JSON.parse(gunzipSync(await readFile(new URL('../../../.eval-artifacts/p2-1c-region-20261020/recordings.json.gz',import.meta.url))).toString());
 const gold=JSON.parse(await readFile(new URL('../../../.eval-artifacts/p2-1c-region-20261020/inputs.json',import.meta.url),'utf8')).expectedTopRegionByCase;
 const results=[];
 for(const caseId of Object.keys(gold)){
  const record=records.find((r:any)=>r.group==='checkpoint-b-corrected-20261019'&&r.caseId===caseId);
  const referenceCase=/kagurazaka|nakameguro/.test(caseId);
  const sourceRoot='https://tabelog.com/en/tokyo/rstLst/';
  const rootInput=record.regionDecisions[0].input;
  const projectedLinks=(input:any)=>input.observation.targets.filter((t:any)=>t.kind==='LINK'&&t.href&&t.availableActions.includes('OPEN_LINK')).map((t:any)=>`<a href="${t.href.replaceAll('&','&amp;')}">${t.label.replaceAll('&','&amp;').replaceAll('<','&lt;')}</a>`).join('');
  const route=referenceCase?[`https://tabelog.com/en/tokyo/${gold[caseId]}/`]:record.regionDecisions.flatMap((d:any)=>{
   const a=JSON.parse(d.outputText),t=d.input.observation.targets.find((t:any)=>t.ref===a.targetRef);
   return a.action==='OPEN_LINK'&&t?.href&&tabelogDiscoveryPack.browser!.directory!.isRegionEntrance(t.href)?[t.href]:[];
  });
  const end=route.at(-1)!;assert.ok(end);
  const detail=`https://tabelog.com/tokyo/${gold[caseId]}/${gold[caseId]}01/13999999/`;
  const pages:Record<string,string>={[sourceRoot]:'<title>Projected observed region links</title>'+projectedLinks(rootInput)};
  for(const decision of record.regionDecisions.slice(1))pages[decision.input.observation.url]='<title>Projected observed region links</title>'+projectedLinks(decision.input);
  pages[end]=`<title>Controlled known-feasible result</title><a class="list-rst__rst-name-target" href="${detail}">Controlled venue</a>`;
  pages[detail]=`<title>Controlled venue</title><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:'Controlled venue',address:'Tokyo',geo:{latitude:record.location.latitude,longitude:record.location.longitude}})}</script>`;
  const folder=await mkdtemp(join(tmpdir(),'p21c-offline-')),harPath=join(folder,'region.har');
  await writeFile(harPath,replayHarPages(pages));
  const raw=new LocalPlaywrightChromium();let googleCalls=0,modelCalls=0;const modelInputs:any[]=[];const pagesObserved:string[]=[];const navigations:string[]=[];
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{
   const session=await raw.openSession({...input,replayHarPath:harPath});
   return new Proxy(session,{get(target,key){if(key==='snapshot')return async()=>{const page=await target.snapshot();pagesObserved.push(page.url);return page;};if(key==='navigate')return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);return target.navigate(...args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  }};
  const model:import('../../core/model/contracts.js').ModelGateway={complete:async request=>{
   modelCalls++;assert.equal(request.purpose,'browser_read_decide','region-only controlled variant has no positive HARD keyword');
   const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);
   modelInputs.push({purpose:request.purpose,observation:body.observation});
   const href=route.find((url:string)=>body.observation.targets.some((t:any)=>t.href===url&&t.availableActions.includes('OPEN_LINK')));
   const target=body.observation.targets.find((t:any)=>t.href===href);assert.ok(target,'the recorded/independently expected next entrance is executable');
   if(referenceCase)assert.ok(body.observation.targets.filter((t:any)=>t.availableActions.includes('OPEN_LINK')).every((t:any)=>t.href===href||t.href===body.observation.url),'unsupported first-region guesses are removed');
   route.splice(route.indexOf(href),1);
   return {invocationId:'offline-region',provider:'FIXTURE',model:'scripted',finishReason:'TOOL_CALLS',latencyMs:0,outputText:JSON.stringify({action:'OPEN_LINK',targetRef:target.ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Use the current observed supported region'})};
  }};
  const google=new GooglePlacesClient({apiKey:'fixture-only',fetchImplementation:async()=>{
   googleCalls++;
   const candidates=record.googleBatch.detail.read.candidates;
   const projected=referenceCase?candidates.filter((c:any)=>c.restaurant.sourceIds.googleWebsiteUri?.includes('tabelog.com/')):candidates.slice(0,20);
   return new Response(JSON.stringify({places:projected.map((c:any)=>({id:c.restaurant.sourceIds.googlePlaces,displayName:{text:c.restaurant.outletName},formattedAddress:c.restaurant.address,location:{latitude:c.restaurant.coordinates.lat,longitude:c.restaurant.coordinates.lng},websiteUri:c.restaurant.sourceIds.googleWebsiteUri,types:['restaurant'],businessStatus:'OPERATIONAL'}))}),{status:200});
  }});
  const intent:import('../../domains/restaurant/contracts.js').RestaurantSearchIntent={timezone:'Asia/Tokyo',target:{goal:'RECOMMENDATION',query:'restaurants'},area:{query:rootInput.goal.outlet.address},criteria:[]};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxGoogleRequests:40,maxBrowserModelCallsPerCandidate:6,maxBrowserOperationsPerCandidate:24,packs:[tabelogDiscoveryPack,googlePlacesDiscoveryPack]}, {model,browser:runtime,google,clock:{now:()=>new Date('2026-10-20T00:00:00Z')}});
  try{
   const read=await assembly.search.search({readRunId:`p21c-${caseId}`,intent,continuation:{intentFingerprint:JSON.stringify(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:record.location}},AbortSignal.timeout(90000));
   results.push({caseId,variant:'Recorded region inputs, no criteria/date/party; projected links + recorded Google pointers + synthetic detail',navigations,pagesObserved,modelInputs,modelCalls,googleCalls,read});
   assert.equal(read.candidates.length,1,JSON.stringify({caseId,metadata:read.metadata,navigations,modelInputs}));
   assert.ok(read.metadata.nativeDiscoveryFunnel!.directoryRegion!.first.url.includes(`/${gold[caseId]}/`));
   assert.ok(read.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90000);assert.ok(read.metadata.nativeDiscoveryFunnel!.retrieval!.regionPages<=4);assert.ok(modelCalls<=6);
   if(referenceCase)assert.equal(googleCalls,1);
   if(caseId.includes('h001')||caseId.includes('h005')||caseId.includes('kichijoji'))assert.equal(googleCalls,0,'a named or unnamed-coordinate route needs no new Google wait');
  }finally{await rm(folder,{recursive:true,force:true});}
 }
 await writeFile(new URL('../../../.eval-artifacts/checkpoint-c-p21c-integration-20261020/region-composition-results.json',import.meta.url),JSON.stringify({mode:'LOCAL_CHROMIUM_HAR_FIXTURE_WITH_SCRIPTED_MODEL',realModelCalls:0,externalNetworkCalls:0,results},null,2)+'\n');
});
