import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime, BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserReadRecording } from "../../eval/restaurant/agent-loop/runners/browser-read-recording.js";
import { traceBrowserRuntime } from "../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js";
import { url, replayHar } from "./browser-read-test-fixtures.js";

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
