import assert from "node:assert/strict";
import { test } from "node:test";

import type { ModelGateway, ModelRequest, ModelResponse } from "../../core/model/contracts.js";
import type { RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import type { BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { LiveBrowserAvailability } from "./live-browser-availability.js";
import { tableCheckDiscoveryUrl } from "../tablecheck/tablecheck-page-parser.js";

test("production composition shares one literal-fragment model proposal across both source searches", async () => {
  const subject = structuredClone(fixtureCandidates[0]!);
  Object.assign(subject.restaurant, { outletName: "Dengana Akabane", sourceIds: { googlePlaces: "same-google-place", phone: "03-1111-2222" } });
  const original = structuredClone(subject);
  const tcOriginal = tableCheckDiscoveryUrl(subject), tcAlternative = new URL(tcOriginal);
  tcAlternative.searchParams.set("search_text", "Dengana");
  const session = new Session([
    { url: tcOriginal, title: "Search", text: "No venues found", html: "No venues found" },
    { url: tcAlternative.toString(), title: "Search", text: "No venues found", html: "No venues found" },
    { url: "https://tabelog.com/en/tokyo/rstLst/?sw=Dengana%20Akabane", title: "Search", text: "No restaurants match", html: "No restaurants match" },
    { url: "https://tabelog.com/en/tokyo/rstLst/?sw=Dengana", title: "Search", text: "Dengana", html: '<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/123/">Dengana</a>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Dengana", text: "Dengana", html: `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: "Dengana", address: subject.restaurant.address, telephone: "03-1111-2222" })}</script>` },
  ]);
  const budget = { totalModelCalls: 0, maxModelCalls: 4 }; let calls = 0;
  const availability = new LiveBrowserAvailability({ openSession: async () => session }, { async complete(request) {
    calls++; assert.equal(request.purpose, "restaurant_named_source_query");
    assert.deepEqual(JSON.parse(request.messages[1]!.content), { name: subject.restaurant.outletName, address: subject.restaurant.address });
    return { invocationId: "fixture-query", provider: "FIXTURE", model: "fixture", outputText: '{"field":"name","fragment":"Dengana"}', finishReason: "TOOL_CALLS", latencyMs: 0 };
  } }, { browserBudget: budget, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 4, maxOperationsPerCandidate: 24, maxAutomaticElapsedMs: 30_000 });
  availability.beginReadRun();
  const result = await availability.check({ candidateIds: [subject.restaurant.id], candidates: [subject], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.deepEqual(session.openedPages.filter(url => url.includes("search") || url.includes("rstLst")).map(url => { const u = new URL(url); return u.searchParams.get("search_text") ?? u.searchParams.get("sw"); }), ["Dengana Akabane", "Dengana", "Dengana Akabane", "Dengana"]);
  assert.equal(calls, 1); assert.equal(budget.totalModelCalls, 1);
  assert.equal(result.offers.length, 0, "same-outlet identity alone is not inventory");
  assert.ok(result.evidence.some(e => e.entityMatch?.confidence === "HIGH"));
  assert.equal(session.closed, 1);
  assert.deepEqual(subject, original);
  availability.endReadRun();
});

class Session implements BrowserSession {
  readonly metadata = { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, sessionId: "local:shared-live-composition", startedAt: "2026-09-07T00:00:00.000Z" };
  openedPages: string[] = [];
  closed = 0;
  private page = -1;
  constructor(private readonly pages: BrowserSnapshot[]) {}
  async navigate(url: string): Promise<void> { this.openedPages.push(url); this.page = Math.min(this.page + 1, this.pages.length - 1); }
  async snapshot(): Promise<BrowserSnapshot> { return this.pages[this.page]!; }
  async click(): Promise<void> {}
  async fill(): Promise<void> {}
  async select(_selector: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async waitForSettled(): Promise<boolean> { return true; }
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closed += 1; }
}

const neverCalledModel: ModelGateway = {
  async complete(_request: ModelRequest): Promise<ModelResponse> { throw new Error("normal site methods should not invoke the browser model"); },
};

test("Live browser composition keeps TableCheck then Tabelog in one session and closes it after the chain", async () => {
  const candidate = fixtureCandidates[0]!;
  const request: RestaurantAvailabilityRequest = {
    candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date,
    timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: ["yakiniku"],
  };
  const session = new Session([
    { url: "https://www.tablecheck.com/en/japan/search", title: "Map Search", text: "No venues found", html: "<main>No venues found</main>" },
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201", title: "Tabelog search", text: "Restaurant 1", html: '<article><a href="/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button><div class="genre">yakiniku</div>' },
  ]);
  let opens = 0;
  const runtime: BrowserRuntime = { openSession: async () => { opens += 1; return session; } };
  const diagnostics: BrowserExecutionDiagnostic[] = [];
  const result = await new LiveBrowserAvailability(runtime, neverCalledModel, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
    onBrowserDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(request, new AbortController().signal);
  assert.equal(opens, 1);
  assert.equal(session.closed, 1);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.deepEqual(result.metadata.providerAttempts?.map((attempt) => attempt.provider), ["TABLECHECK", "TABELOG"]);
  assert.deepEqual(diagnostics.filter(item => item.event === "PROVIDER_STARTED").map(item => item.source), ["TABLECHECK", "TABELOG"]);
  assert.deepEqual(diagnostics.filter(item => item.event === "PROVIDER_FINISHED").map(item => item.lifecycle.outcome), ["FINISHED", "FINISHED"]);
  assert.ok(diagnostics.filter(item => item.event === "OPERATION_STARTED").every(item => item.lifecycle.candidateRuntimeOperations >= item.lifecycle.providerRuntimeOperations));
});

test("Live composition reuses a source-observed Hajime entrance across candidate batches, but re-identifies it", async () => {
  // Production composition starts at LiveBrowserAvailability; only browser and
  // model transports are fixtures. This catches a per-adapter cache that dies
  // between Agent batches, but does not claim anything about a live site.
  const teppen = {
    ...fixtureCandidates[0]!,
    restaurant: { ...fixtureCandidates[0]!.restaurant, id: "shibuya-sushi-teppen", outletName: "Shibuya Sushi Teppen", address: "1-1 Shinjuku, Tokyo", sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const hajime = {
    ...fixtureCandidates[0]!,
    restaurant: { ...fixtureCandidates[0]!.restaurant, id: "shibuya-namikibashi-sushi-hajime", outletName: "Shibuya Namikibashi Sushi Hajime", address: "1-1 Shinjuku, Tokyo", sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const hajimePage: BrowserSnapshot = {
    url: "https://www.tablecheck.com/en/sushihajime-shibuya", title: "Shibuya Namikibashi Sushi Hajime - TableCheck",
    text: "Shibuya Namikibashi Sushi Hajime\nAddress\n1-1 Shinjuku, Tokyo\nPhone\n03-1111-2222",
    html: '<h1>Shibuya Namikibashi Sushi Hajime</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">03-1111-2222</a><a href="/en/sushihajime-shibuya/reserve/landing">Book a table</a>',
  };
  const first = new Session([
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Shibuya+Sushi+Teppen", title: "Map Search", text: "venues", html: '<a href="/en/sushihajime-shibuya">Shibuya Namikibashi Sushi Hajime</a>' },
    hajimePage,
    { url: "https://tabelog.com/en/rstLst/?sw=Shibuya%20Sushi%20Teppen", title: "Just a moment...", text: "verify you are human", html: "" },
  ]);
  const second = new Session([
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Shibuya+Namikibashi+Sushi+Hajime", title: "Map Search", text: "No venues found", html: "<main>No venues found</main>" },
    hajimePage,
    { url: "https://www.tablecheck.com/en/sushihajime-shibuya/reserve/landing", title: "Hajime reservation", text: "2 guest 2026-08-05 19:00", html: '<div data-selected-date="2026-08-05" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>' },
  ]);
  let opens = 0;
  const runtime: BrowserRuntime = { openSession: async () => [first, second][opens++]! };
  const availability = new LiveBrowserAvailability(runtime, neverCalledModel, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const toRequest = (item: typeof teppen): RestaurantAvailabilityRequest => ({ candidateIds: [item.restaurant.id], candidates: [item], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: [] });
  availability.beginReadRun();
  await availability.check(toRequest(teppen), new AbortController().signal);
  const result = await availability.check(toRequest(hajime), new AbortController().signal);
  availability.endReadRun();
  assert.equal(result.availabilityChecks[hajime.restaurant.id]?.status, "AVAILABLE");
  assert.equal(second.openedPages[0]?.includes("/japan/search"), true, "current candidate still performs its own discovery");
  assert.equal(second.openedPages[1], "https://www.tablecheck.com/en/sushihajime-shibuya", "observed Teppen-page entrance is a later identity-gated hint");
});

test("Live composition clears observed TableCheck entrances when a read run ends", async () => {
  // Same production start point as the cross-batch test. A fresh read run must
  // not inherit Teppen's observed Hajime link, even when its own discovery is
  // explicitly empty.
  const teppen = {
    ...fixtureCandidates[0]!,
    restaurant: { ...fixtureCandidates[0]!.restaurant, id: "teppen-prior-run", outletName: "Shibuya Sushi Teppen", address: "1-1 Shinjuku, Tokyo", sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const hajime = {
    ...fixtureCandidates[0]!,
    restaurant: { ...fixtureCandidates[0]!.restaurant, id: "hajime-fresh-run", outletName: "Shibuya Namikibashi Sushi Hajime", address: "1-1 Shinjuku, Tokyo", sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const first = new Session([
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Shibuya+Sushi+Teppen", title: "Map Search", text: "venues", html: '<a href="/en/sushihajime-shibuya">Shibuya Namikibashi Sushi Hajime</a>' },
    { url: "https://www.tablecheck.com/en/sushihajime-shibuya", title: "Hajime", text: "Hajime", html: '<h1>Shibuya Namikibashi Sushi Hajime</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">Call</a>' },
    { url: "https://tabelog.com/en/rstLst/?sw=Shibuya%20Sushi%20Teppen", title: "Just a moment...", text: "verify you are human", html: "" },
  ]);
  const second = new Session([
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Shibuya+Namikibashi+Sushi+Hajime", title: "Map Search", text: "No venues found", html: "<main>No venues found</main>" },
    { url: "https://tabelog.com/en/rstLst/?sw=Shibuya%20Namikibashi%20Sushi%20Hajime", title: "Just a moment...", text: "verify you are human", html: "" },
  ]);
  let opens = 0;
  const runtime: BrowserRuntime = { openSession: async () => [first, second][opens++]! };
  const availability = new LiveBrowserAvailability(runtime, neverCalledModel, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const toRequest = (item: typeof teppen): RestaurantAvailabilityRequest => ({ candidateIds: [item.restaurant.id], candidates: [item], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: fixtureIntent.partySize, hardCriteria: [] });
  availability.beginReadRun();
  await availability.check(toRequest(teppen), new AbortController().signal);
  availability.endReadRun();
  availability.beginReadRun();
  const result = await availability.check(toRequest(hajime), new AbortController().signal);
  availability.endReadRun();
  assert.equal(result.availabilityChecks[hajime.restaurant.id]?.status, "UNKNOWN");
  assert.equal(second.openedPages.includes("https://www.tablecheck.com/en/sushihajime-shibuya"), false);
});
