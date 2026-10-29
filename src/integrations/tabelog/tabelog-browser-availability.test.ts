import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import { RESTAURANT_FAILURE_CLASSIFICATION } from "../../domains/restaurant/failure-codes.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { inspectTabelogEntity, prioritizeTabelogOutlets, resolveTabelogEntity } from "./tabelog-entity-resolver.js";
import { TabelogBrowserAvailability, tabelogAvailabilityCompletion } from "./tabelog-browser-availability.js";
import { parseTabelogSourceFieldQuotes, parseTabelogAvailabilitySlots, parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets } from "./tabelog-page-parser.js";
import { hasTabelogSelectedQuery, tabelogCapturedSlots, tabelogQueryControlsRestricted, tabelogRequestedDateState } from "./tabelog-query-controls.js";

const candidate = fixtureCandidates[0]!;

/** Source fixture with both the selected public query and an independently supplied inventory payload. */
function boundQueryFixture(snapshot: BrowserSnapshot, slots: readonly string[] = ["19:00"]): BrowserSnapshot {
  const outletId = snapshot.url.match(/\/(\d+)\/$/)?.[1];
  if (!outletId) return snapshot;
  return { ...snapshot, html: snapshot.html + '<div class="p-booking-calendar"><button class="is-selected" data-year="2026" data-month="8" data-day="5">5</button><fieldset><legend>Guests</legend><button aria-pressed="true" data-value="2">2</button></fieldset></div>',
    responses: [{ url: 'https://tabelog.com/en/booking/calendar/find_vacancy', status: 200, sequence: 1, observedAt: '2026-08-05T09:00:00Z',
      body: { base_date: {year:2026,month:8,day:5}, members:2, selection: Object.fromEntries(slots.map((time, index) => [index, { time, url: `/en/booking/form_course/new?rcd=${outletId}&member=2&visit_date=20260805&visit_time=${time.replace(':','')}` }])) } }] };
}

test("captured kf-h001 Sen after selecting the date still has no slot result and remains EXTRACTION_FAILED", async () => {
  const html = await readFile(new URL("../../harness/browser/fixtures/tabelog-sen-no-slots-20261010.html", import.meta.url), "utf8");
  const observed = JSON.parse(await readFile(new URL("../../harness/browser/fixtures/tabelog-sen-no-slots-20261010.snapshot.json", import.meta.url), "utf8"));
  const page: BrowserSnapshot = { url: observed.url, title: observed.title, text: observed.visibleText, html };
  const request = { date: "2026-10-22", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } };
  assert.equal(tabelogAvailabilityCompletion(page, request).complete, false);
  assert.equal(parseTabelogAvailabilitySlots(page, request).hasExplicitSlotUi, false);
  const sen = { ...candidate, restaurant: { ...candidate.restaurant, outletName: "Shibuya Sushi Sen", address: "1500002 Tokyo Shibuya Shibuya Tokyo ", sourceIds: { tabelog: "en/tokyo/A1303/A130301/13275802", tabelogNativeDetailUri: page.url } } };
  const session = new FixtureBrowserSession([page]);
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }).check({ ...request, candidateIds: [sen.restaurant.id], candidates: [sen], hardCriteria: [] }, new AbortController().signal);
  assert.equal(result.availabilityChecks[sen.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.metadata.failureCode, "EXTRACTION_FAILED");
});

test("three recorded Tabelog busy pages remain source-busy UNKNOWN after one waited retry, before identity", async () => {
  const root = new URL("./fixtures/availability/", import.meta.url);
  const manifest = JSON.parse(await readFile(new URL("p2-2-selection-20261019/followup/busy-inputs/manifest.json", root), "utf8"));
  for (const input of manifest.inputs) {
    const html = await readFile(new URL(input.snapshots[0].html, root), "utf8");
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const busy: BrowserSnapshot = { url: "https://tabelog.com/en/tokyo/A1303/A130301/13293469/", title, text: html.replace(/<[^>]+>/g, " "), html };
    const session = new FixtureBrowserSession([busy]);
    const listed = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: { googleWebsiteUri: "https://tabelog.com/tokyo/A1303/A130301/13293469/?utm_source=google#menu" } } };
    const diagnostics: unknown[] = [];
    const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00Z", 5, { onIdentityDiagnostic: row => { diagnostics.push(row); } }).check(
      { candidateIds: [listed.restaurant.id], candidates: [listed], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
    assert.equal(result.availabilityChecks[listed.restaurant.id]?.status, "UNKNOWN", input.run);
    assert.equal(result.availabilityChecks[listed.restaurant.id]?.reasonCode, "SOURCE_BUSY", input.run);
    assert.deepEqual(session.navigated, [busy.url, busy.url], "only one retry of the same normalized public outlet URL");
    assert.equal(result.evidence.some(e => e.kind === "ENTITY_MATCH" && e.entityMatch?.confidence === "HIGH"), false);
    assert.equal((diagnostics.at(-1) as {resolution:{reason:string}}).resolution.reason, "SOURCE_BUSY");
  }
});

test("Tabelog busy retry can recover a known feasible control without bypassing identity", async () => {
  const html = await readFile(new URL("./fixtures/availability/p2-2-selection-20261019/followup/busy-inputs/p20-h001-a1.snapshot-0033.html", import.meta.url), "utf8");
  const url = "https://tabelog.com/en/tokyo/A1303/A130301/13293469/";
  const busy = { url, title: "現在アクセスが集中しています [食べログ]", text: "", html };
  const good = { url, title: "Restaurant 1", text: "予約 人数 19:00", html: '<h1 class="restaurant-name">Restaurant 1</h1><p class="restaurant-address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>' };
  const listed = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: { googleWebsiteUri: "https://tabelog.com/tokyo/A1303/A130301/13293469/" } } };
  for (const conflict of [false, true]) {
    const session = new FixtureBrowserSession([busy, boundQueryFixture({ ...good, html: conflict ? good.html.replace("1-1 Shinjuku, Tokyo", "8-9 Shibuya, Tokyo") : good.html })]);
    const started = performance.now();
    const result = await new TabelogBrowserAvailability({ openSession: async () => session }).check({ candidateIds: [listed.restaurant.id], candidates: [listed], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
    assert.ok(performance.now() - started >= 900, "the source retry waits before its second navigation");
    assert.equal(result.availabilityChecks[listed.restaurant.id]?.status, conflict ? "UNKNOWN" : "AVAILABLE");
    assert.equal(session.navigated.slice(0, 2).every(value => value === url), true);
    if (!conflict) assert.ok(session.navigated.every(value => value === url), "recovery does not start name search or change the outlet");
  }
});

test("Tabelog source-busy delay cannot reset or outrun the existing provider deadline", async () => {
  const html = await readFile(new URL("./fixtures/availability/p2-2-selection-20261019/followup/busy-inputs/p20-h001-a1.snapshot-0033.html", import.meta.url), "utf8");
  const session = new FixtureBrowserSession([{ url: "https://tabelog.com/en/tokyo/A1303/A130301/13293469/", title: "現在アクセスが集中しています [食べログ]", text: "", html }]);
  const listed = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: { googleWebsiteUri: "https://tabelog.com/tokyo/A1303/A130301/13293469/" } } };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 10_000, maxElapsedMsPerProvider: 250, maxModelCallsTotal: 1, maxModelCallsPerCandidate: 1, maxOperationsPerCandidate: 24 });
  try {
    const result = await new TabelogBrowserAvailability(executor).check({ candidateIds: [listed.restaurant.id], candidates: [listed], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
    assert.equal(result.availabilityChecks[listed.restaurant.id]?.status, "UNKNOWN");
    assert.equal(result.availabilityChecks[listed.restaurant.id]?.reasonCode, "BROWSER_TIMEOUT");
    assert.equal(session.navigated.length, 1, "no retry is dispatched after the provider deadline");
    assert.equal(RESTAURANT_FAILURE_CLASSIFICATION.SOURCE_BUSY, "ENVIRONMENT");
  } finally { await executor.close(); }
});

test("Tabelog entity resolver is outlet-safe and rejects ambiguous branch matches", () => {
  const exact = resolveTabelogEntity(candidate, [{ sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/x/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo" }]);
  const ambiguous = resolveTabelogEntity(candidate, [
    { sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/x/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo" },
    { sourceEntityId: "y", sourceUrl: "https://tabelog.com/tokyo/A1304/y/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo" },
  ]);
  assert.equal(exact.confidence, "HIGH");
  assert.notEqual(ambiguous.confidence, "HIGH");
});

test("Tabelog accepts complete reordered address components but rejects an incomplete source address", () => {
  const reordered = resolveTabelogEntity(candidate, [{ sourceEntityId: "reordered", sourceUrl: "https://tabelog.com/tokyo/A1304/reordered/", outletName: "Restaurant 1", address: "Tokyo, Shinjuku, 1-1" }]);
  const incomplete = resolveTabelogEntity(candidate, [{ sourceEntityId: "incomplete", sourceUrl: "https://tabelog.com/tokyo/A1304/incomplete/", outletName: "Restaurant 1", address: "1-1 Shinjuku" }]);
  assert.equal(reordered.confidence, "HIGH");
  assert.equal(incomplete.confidence, "MEDIUM");
});

test("Tabelog does not turn identical but insufficient abbreviated addresses into outlet proof", () => {
  const abbreviatedCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, address: "1-1 Shinjuku" },
  };
  const resolution = resolveTabelogEntity(abbreviatedCandidate, [{
    sourceEntityId: "abbreviated", sourceUrl: "https://tabelog.com/tokyo/A1304/abbreviated/", outletName: "Restaurant 1", address: "1-1 Shinjuku",
  }]);
  assert.equal(resolution.confidence, "MEDIUM");
});

test("Tabelog entity inspection retains phone conflict diagnostics without rejecting complete same-outlet proof", () => {
  const phoneCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, googlePlaces: "google-restaurant-1", phone: "03-1111-2222" } },
  };
  const inspection = inspectTabelogEntity(phoneCandidate, [{
    sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/x/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo", phone: "03-9999-8888",
  }]);
  assert.equal(inspection.resolution.confidence, "HIGH");
  assert.deepEqual(resolveTabelogEntity(phoneCandidate, [{
    sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/x/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo", phone: "03-9999-8888",
  }]), inspection.resolution);
  assert.equal(inspection.diagnostic.google.phone.normalizedValue, "0311112222");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.phone.normalizedValue, "0399998888");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.phone, "CONFLICT");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.outletName, "MATCH");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.address, "MATCH");
  assert.equal(inspection.diagnostic.resolution.reason, "HIGH_NAME_AND_ADDRESS");
});

test("Tabelog blocks HIGH identity for a stated floor conflict or a shared phone at a distinct branch", () => {
  const scoped = {
    ...candidate,
    restaurant: { ...candidate.restaurant, outletName: "Sushi Hajime", address: "〒150-0002 東京都渋谷区渋谷3-15-5 B1F", sourceIds: { ...candidate.restaurant.sourceIds, phone: "03-6419-7621" } },
  };
  for (const outlet of [
    { sourceEntityId: "floor", sourceUrl: "https://tabelog.com/tokyo/floor/", outletName: "Sushi Hajime", address: "〒150-0002 東京都渋谷区渋谷3-15-5 1F", phone: "03-6419-7621" },
    { sourceEntityId: "branch", sourceUrl: "https://tabelog.com/tokyo/branch/", outletName: "Sushi Hajime", address: "〒106-0032 東京都港区六本木6-1-5 1F", phone: "03-6419-7621" },
  ]) {
    const inspection = inspectTabelogEntity(scoped, [outlet]);
    assert.notEqual(inspection.resolution.confidence, "HIGH");
    assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.address, "CONFLICT");
  }
  assert.equal(inspectTabelogEntity({ ...scoped, restaurant: { ...scoped.restaurant, address: "〒150-0002 1F" } }, [{
    sourceEntityId: "incomplete", sourceUrl: "https://tabelog.com/tokyo/incomplete/", outletName: "Sushi Hajime", address: "1500002 1F",
  }]).diagnostic.comparedOutlets[0]?.comparison.address, "INSUFFICIENT");
});

test("Tabelog shares the Japanese basement and Latin B1F identity normalization", () => {
  const scoped = {
    ...candidate,
    restaurant: {
      ...candidate.restaurant,
      outletName: "Shibuya Namikibashi Sushi Hajime",
      address: "Japan, 〒150-0002 Tokyo, Shibuya, 3-chōme−15−５ グリームビル 地下1階",
      sourceIds: { ...candidate.restaurant.sourceIds, phone: "+81364197621" },
    },
  };
  const inspection = inspectTabelogEntity(scoped, [{
    sourceEntityId: "historical-hajime",
    sourceUrl: "https://tabelog.com/tokyo/historical-hajime/",
    outletName: "Namikibashi Sushihajime",
    address: "150-0002 Tokyo Shibuya 3-15-5 Shibuya Gleam Bldg. B1F",
  }]);
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.address, "MATCH");
  assert.equal(inspection.diagnostic.resolution.confidence, "HIGH");
  assert.equal(inspection.diagnostic.resolution.reason, "HIGH_NAME_AND_ADDRESS");
});

test("Tabelog relative search links are enriched with page identity before an exact phone creates a HIGH outlet match", () => {
  const phoneCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, outletName: "Sushisho Isseki Sancho", address: "東京都渋谷区丸山町5-11", sourceIds: { ...candidate.restaurant.sourceIds, phone: "03-6427-8577" } },
  };
  const search = parseTabelogSearchOutlets({
    url: "https://tabelog.com/en/rstLst/?sw=Sushisho", title: "search", text: "Sushisho", html: [
      '<a href="/">Tabelog home</a>',
      '<a class="list-rst__rvw-count-target" href="/en/tokyo/A1303/A130301/132590/dtlrvwlst/">253</a>',
      '<a class="list-rst__image-target" href="/en/tokyo/A1303/A130301/132590/">Photo</a>',
      '<a class="list-rst__rst-name-target" href="/tokyo/A1303/A130301/132590/">Sushisho Isseki Sancho</a>',
    ].join(""),
  });
  assert.equal(search.length, 1);
  assert.equal(search[0]?.sourceUrl, "https://tabelog.com/tokyo/A1303/A130301/132590/");
  const extraction = parseTabelogOutletIdentityWithEvidence({
    url: search[0]!.sourceUrl, title: "鮨 尚充", text: "鮨 尚充 03-6427-8577 東京都渋谷区丸山町5-11", html: [
      '<link rel="canonical" href="/tokyo/A1303/A130301/132590/">',
      '<p class="rstinfo-table__address">東京都渋谷区丸山町5-11</p>',
      '<a href="tel:+81-3-6427-8577">+81-3-6427-8577</a>',
    ].join(""),
  }, search[0]!);
  const enriched = extraction.outlet;
  assert.equal(enriched.phone, "+81-3-6427-8577");
  assert.equal(enriched.address, "東京都渋谷区丸山町5-11");
  assert.equal(enriched.sourceEntityId, "tokyo/A1303/A130301/132590");
  assert.equal(extraction.canonicalUrl, "https://tabelog.com/tokyo/A1303/A130301/132590/");
  assert.equal(extraction.fields.address.source, "DOM");
  assert.equal(extraction.fields.phone.source, "TEL_LINK");
  assert.equal(extraction.fields.phone.normalizedValue, "0364278577");
  assert.deepEqual(resolveTabelogEntity(phoneCandidate, [enriched]), {
    confidence: "HIGH", outlet: enriched, matchedBy: ["EXACT_PHONE"],
  });
});

test("Tabelog parser reports every observed outlet; the native batch owns the detail cap", () => {
  const html = Array.from({ length: 6 }, (_, index) => {
    const id = 900 + index;
    return `<article><a class="list-rst__rst-name-target" href="/en/tokyo/A1303/A130301/${id}/">Outlet ${id}</a><address>Tokyo ${id}</address></article>`;
  }).join("");
  const outlets = parseTabelogSearchOutlets({ url: "https://tabelog.com/en/tokyo/rstLst/?sw=omakase", title: "Search", text: "Restaurants", html });
  assert.equal(outlets.length, 6, "parser output must not silently become the five-detail batch");
});

test("Tabelog identity parser extracts JSON-LD identity field provenance", () => {
  const extraction = parseTabelogOutletIdentityWithEvidence({
    url: "https://tabelog.com/tokyo/A1304/A130401/123/",
    title: "Restaurant 1",
    text: "Restaurant 1",
    html: '<script type="application/ld+json">{"@type":"Restaurant","name":"Restaurant 1","telephone":"03-1111-2222","address":{"postalCode":"160-0022","addressRegion":"Tokyo","addressLocality":"Shinjuku","streetAddress":"1-1"}}</script>',
  }, { sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/123/", outletName: "fallback" });
  assert.equal(extraction.fields.outletName.source, "JSON_LD");
  assert.equal(extraction.fields.address.source, "JSON_LD");
  assert.equal(extraction.fields.phone.source, "JSON_LD");
  assert.equal(extraction.fields.phone.normalizedValue, "0311112222");
});

test("Tabelog slot parser ignores prose and class-only controls without a bound response", () => {
  const prose = parseTabelogAvailabilitySlots({ url: "https://tabelog.com/x/", title: "x", text: "Dinner starts at 19:00", html: "<p>営業時間 19:00</p>" }, { date: "2026-08-05", partySize: 2 });
  const controls = parseTabelogAvailabilitySlots({ url: "https://tabelog.com/x/", title: "x", text: "", html: '<button class="slot is-available" data-time="19:00">19:00</button><button class="slot full" data-time="19:30">19:30</button>' }, { date: "2026-08-05", partySize: 2 });
  assert.deepEqual(prose, { availableSlots: [], hasExplicitSlotUi: false });
  assert.deepEqual(controls, { availableSlots: [], hasExplicitSlotUi: false });
});

test("Tabelog control restriction is observable but private day states and hidden projections remain unknown", () => {
  const closedDate = "2026-08-05";
  const calendar = (content: string, notice = "No available seats for 2 guests.") => ({
    url: "https://tabelog.com/en/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: notice,
    html: `<div class="p-booking-calendar"><table class="p-booking-calendar__calendar"><caption><em>Aug 2026</em></caption><tbody><tr><td>${content}</td></tr></tbody></table></div>`,
  });
  const closed = calendar('<span class="p-booking-calendar__day-num p-booking-calendar__day-num--closed">5</span>');
  assert.equal(tabelogRequestedDateState(closed, closedDate), "UNOBSERVED");
  assert.equal(tabelogQueryControlsRestricted(closed, [{ label: "Guests 2", disabled: true }], 2), true);

  const loading = { ...closed, text: "Loading calendar availability" };
  assert.equal(tabelogQueryControlsRestricted(loading, [{ label: "Guests 2", disabled: true }], 2), false,
    "a disabled control during loading remains recoverable rather than a date restriction");

  const visibleClosedWithHiddenFuture = {
    ...closed,
    html: `${closed.html}<div class="p-booking-calendar is-hidden"><table class="p-booking-calendar__calendar"><caption><em>Aug 2026</em></caption><tbody><tr><td><p class="js-calendar-day-target is-selectable" data-year="2026" data-month="8" data-day="5"></p><span class="p-booking-calendar__day-num">5</span></td></tr></tbody></table></div>`,
  };
  assert.equal(tabelogRequestedDateState(visibleClosedWithHiddenFuture, closedDate), "UNOBSERVED",
    "neither visible nor hidden private classes establish a business day state");

  const selectable = calendar('<p class="js-calendar-day-target is-selectable" data-year="2026" data-month="8" data-day="5"></p><span class="p-booking-calendar__day-num">5</span>');
  assert.equal(tabelogRequestedDateState(selectable, closedDate), "UNOBSERVED");
});

class FixtureBrowserSession implements BrowserSession {
  readonly metadata = { runtimeProvider: "CLOUDFLARE_BROWSER_RUN" as const, engine: "KITESURF" as const, startedAt: "2026-08-05T09:00:00.000Z" };
  readonly navigated: string[] = [];
  clicks = 0;
  fills = 0;
  private current = -1;
  constructor(private readonly pages: BrowserSnapshot[]) {}
  async navigate(url: string): Promise<void> { this.navigated.push(url); this.current = Math.min(this.current + 1, this.pages.length - 1); }
  async snapshot(): Promise<BrowserSnapshot> { return this.pages[this.current]!; }
  async click(): Promise<void> { this.clicks += 1; }
  async fill(): Promise<void> { this.fills += 1; }
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async waitForSettled(): Promise<boolean> { return true; }
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> {}
}

class ChallengeResumeSession implements BrowserSession {
  readonly metadata = {
    runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const,
    engine: "CHROMIUM" as const,
    sessionId: "local:persistent-eval-session",
    startedAt: "2026-08-05T09:00:00.000Z",
  };
  readonly navigated: string[] = [];
  closed = false;
  private current: BrowserSnapshot = {
    url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201",
    title: "Just a moment...",
    text: "Just a moment...",
    html: "",
  };

  private readonly search: BrowserSnapshot = {
    url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201",
    title: "Tabelog search",
    text: "Restaurant 1",
    html: '<article><a href="https://tabelog.com/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article>',
  };

  private readonly detail: BrowserSnapshot = boundQueryFixture({
    url: "https://tabelog.com/tokyo/A1304/A130401/123/",
    title: "Restaurant 1",
    text: "Restaurant 1 予約 人数 19:00",
    html: '<select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>',
  });

  async navigate(url: string): Promise<void> {
    this.navigated.push(url);
    if (url.includes("/A1304/")) this.current = this.detail;
  }
  async snapshot(): Promise<BrowserSnapshot> { return structuredClone(this.current); }
  async click(): Promise<void> {}
  async fill(): Promise<void> {}
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async waitForSettled(): Promise<boolean> { return true; }
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closed = true; }
  clearChallenge(): void { this.current = this.search; }
}

test("Tabelog executor grounds a deterministic browser observation and never submits", async () => {
  const pages: BrowserSnapshot[] = [
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant", title: "search", text: "Restaurant 1", html: '<article><a href="https://tabelog.com/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button><div class="genre">yakiniku</div>' },
  ];
  const session = new FixtureBrowserSession(pages.map(snapshot => boundQueryFixture(snapshot)));
  const browser: BrowserRuntime = { openSession: async () => session };
  const adapter = new TabelogBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z");
  const result = await adapter.check({ candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] }, new AbortController().signal);
  assert.equal(session.navigated[0], "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201");
  assert.equal(result.metadata.route, "GENERIC_BROWSER");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(result.offers.length, 1);
  assert.equal(session.clicks, 0);
  assert.equal(session.fills, 0);
});

test("Tabelog Tokyo discovery carries MARUNOUCHI BASE into outlet comparison without granting inventory", async () => {
  const tokyoCandidate = {
    ...candidate,
    restaurant: {
      ...candidate.restaurant,
      outletName: "MARUNOUCHI BASE",
      address: "1-3-4 Marunouchi, Chiyoda City, Tokyo",
      sourceIds: { ...candidate.restaurant.sourceIds, phone: "050-2018-8952" },
    },
  };
  const session = new FixtureBrowserSession([
    {
      url: "https://tabelog.com/en/tokyo/rstLst/?sw=MARUNOUCHI%20BASE",
      title: "Best Restaurants in Tokyo | Tabelog",
      text: "MARUNOUCHI BASE",
      html: '<a class="list-rst__rst-name-target" href="https://tabelog.com/en/tokyo/A1302/A130201/13251017/">MARUNOUCHI BASE</a>',
    },
    {
      url: "https://tabelog.com/en/tokyo/A1302/A130201/13251017/",
      title: "MARUNOUCHI BASE",
      text: "MARUNOUCHI BASE 1-3-4 Marunouchi, Chiyoda City, Tokyo",
      html: '<script type="application/ld+json">{"@type":"Restaurant","name":"MARUNOUCHI BASE","telephone":"050-2018-8952","address":{"streetAddress":"1-3-4 Marunouchi","addressLocality":"Chiyoda City","addressRegion":"Tokyo"}}</script>',
    },
  ]);
  const diagnostics: unknown[] = [];
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-09-24T00:00:00.000Z", 5, {
    onIdentityDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check({ candidateIds: [tokyoCandidate.restaurant.id], candidates: [tokyoCandidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.equal(session.navigated[0], "https://tabelog.com/en/tokyo/rstLst/?sw=MARUNOUCHI%20BASE");
  assert.equal(session.navigated.includes("https://tabelog.com/en/tokyo/A1302/A130201/13251017/"), true);
  assert.equal((diagnostics[0] as { resolution: { confidence: string } }).resolution.confidence, "HIGH");
  assert.notEqual(result.availabilityChecks[tokyoCandidate.restaurant.id]?.status, "AVAILABLE");
});

test("Tabelog reads a Google-listed merchant page through the identity gate before a wrong discovery branch", async () => {
  const listedCandidate = {
    ...candidate,
    restaurant: {
      ...candidate.restaurant,
      sourceIds: { ...candidate.restaurant.sourceIds, googleWebsiteUri: "https://tabelog.com/tokyo/A1304/A130401/123/?utm_source=google#menu" },
    },
  };
  const session = new FixtureBrowserSession([
    { url: "https://tabelog.com/en/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>' },
    { url: "https://tabelog.com/en/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>' },
  ].map(snapshot => boundQueryFixture(snapshot)));
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z").check(
    { candidateIds: [listedCandidate.restaurant.id], candidates: [listedCandidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] }, new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[listedCandidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(session.navigated[0], "https://tabelog.com/en/tokyo/A1304/A130401/123/");
  assert.equal(session.navigated.some((url) => url.includes("/rstLst/")), false);
});

test("Tabelog native result keeps its observed outlet ID and skips name search without self-matching a phone", async () => {
  const url = "https://tabelog.com/tokyo/A1304/A130401/123/";
  const native = { ...candidate, restaurant: { ...candidate.restaurant, id: "tabelog:tokyo/A1304/A130401/123",
    sourceIds: { tabelog: "tokyo/A1304/A130401/123", tabelogNativeDetailUri: url } } };
  const page: BrowserSnapshot = boundQueryFixture({ url, title: "Restaurant 1", text: "Restaurant 1 予約 人数 19:00", html:
    '<script type="application/ld+json">{"@type":"Restaurant","name":"Restaurant 1","address":{"streetAddress":"1-1 Shinjuku","addressRegion":"Tokyo"}}</script><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>' });
  const session = new FixtureBrowserSession([page, page]);
  const nativeDiagnostics: Array<{ nativeContinuity?: { confirmed: boolean; reason: string; observedSourceEntityId?: string } }> = [];
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z", 5,
    { onIdentityDiagnostic: (diagnostic) => nativeDiagnostics.push(diagnostic) })
    .check({ candidateIds: [native.restaurant.id], candidates: [native], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.equal(session.navigated.some((value) => value.includes("/rstLst/")), false);
  assert.equal(result.availabilityChecks[native.restaurant.id]?.status, "AVAILABLE");
  assert.equal(result.evidence.some((item) => item.kind === "ENTITY_MATCH" && item.entityMatch?.matchedBy.includes("NATIVE_SOURCE_ID_AND_DETAIL")), true);
  assert.deepEqual(nativeDiagnostics[0]?.nativeContinuity, { confirmed: true, reason: "SAME_SOURCE_OUTLET",
    expectedSourceEntityId: "tokyo/A1304/A130401/123", observedSourceEntityId: "tokyo/A1304/A130401/123" });
  const wrong = { ...native, restaurant: { ...native.restaurant, sourceIds: { ...native.restaurant.sourceIds, tabelog: "tokyo/other" } } };
  const wrongSession = new FixtureBrowserSession([page, page]);
  const bad = await new TabelogBrowserAvailability({ openSession: async () => wrongSession }, () => "2026-08-05T09:00:00.000Z")
    .check({ candidateIds: [wrong.restaurant.id], candidates: [wrong], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.equal(bad.offers.length, 0);
  assert.equal(wrongSession.navigated.some((value) => value.includes("/rstLst/")), false, "wrong native ID must not fall back to source-wide name search");
  const changedAddress = { ...native, restaurant: { ...native.restaurant, address: "2-2 Shinjuku, Tokyo" } };
  const changed = await new TabelogBrowserAvailability({ openSession: async () => new FixtureBrowserSession([page, page]) }, () => "2026-08-05T09:00:00.000Z")
    .check({ candidateIds: [native.restaurant.id], candidates: [changedAddress], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.equal(changed.availabilityChecks[native.restaurant.id]?.status, "AVAILABLE", "source-owned outlet continuity does not rematch address formatting");
  const otherOutletPage = { ...page, url: "https://tabelog.com/tokyo/A1304/A130401/456/" };
  const swapped = await new TabelogBrowserAvailability({ openSession: async () => new FixtureBrowserSession([otherOutletPage]) }, () => "2026-08-05T09:00:00.000Z")
    .check({ candidateIds: [native.restaurant.id], candidates: [native], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.equal(swapped.offers.length, 0, "a same-name page at a different source outlet ID cannot contribute inventory");
  const errorPage = { ...page, title: "404 Not Found" };
  const errored = await new TabelogBrowserAvailability({ openSession: async () => new FixtureBrowserSession([errorPage]) }, () => "2026-08-05T09:00:00.000Z")
    .check({ candidateIds: [native.restaurant.id], candidates: [native], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.equal(errored.offers.length, 0, "an error document at the same URL is not outlet continuity");
});

test("Tabelog keeps an immediate non-slot UNKNOWN rather than treating a nearby source slot as unavailable", async () => {
  const session = new FixtureBrowserSession([
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant", title: "search", text: "Restaurant 1", html: '<article><a href="https://tabelog.com/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 12:00 12:30", html: '<h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="12:00">12:00</button><button class="slot is-available" data-time="12:30">12:30</button>' },
  ].map(snapshot => boundQueryFixture(snapshot, ["12:00", "12:30"])));
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:30.000Z").check({
    candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: { earliest: "12:08", latest: "12:08" }, partySize: 2, hardCriteria: ["yakiniku"],
    immediateAvailability: { validUntil: "2026-08-05T09:01:00.000Z", sourceSlotPolicy: "EARLIEST_IN_WINDOW" },
  }, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "IMMEDIATE_SLOT_NOT_OFFERED");
  assert.equal(result.offers.length, 0);
});

test("Tabelog bot challenge and external booking redirect remain non-available results", async () => {
  const makeRuntime = (text: string): BrowserRuntime => ({ openSession: async () => new FixtureBrowserSession([
    { url: "https://tabelog.com/en/rstLst/", title: "search", text: "Restaurant 1", html: '<article><a href="https://tabelog.com/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "page", text, html: '<select name="party"></select><select name="date"></select>' },
  ]) });
  const input = { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] };
  const challenge = await new TabelogBrowserAvailability(makeRuntime("verify you are human"), () => "2026-08-05T09:00:00.000Z").check(input, new AbortController().signal);
  const justAMoment = await new TabelogBrowserAvailability(makeRuntime("Just a moment..."), () => "2026-08-05T09:00:00.000Z").check(input, new AbortController().signal);
  const redirect = await new TabelogBrowserAvailability(makeRuntime("reservation external TableCheck"), () => "2026-08-05T09:00:00.000Z").check(input, new AbortController().signal);
  assert.equal(challenge.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(justAMoment.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE");
  assert.equal(redirect.availabilityChecks[candidate.restaurant.id]?.status, "SOURCE_UNSUPPORTED");
});

test("Tabelog recovers one challenged canonical page through an observed alternate-language outlet", async () => {
  const session = new FixtureBrowserSession([
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant", title: "search", text: "Restaurant 1", html: '<article><a href="https://tabelog.com/en/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article>' },
    { url: "https://tabelog.com/en/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "Restaurant 1", html: '<link rel="canonical" href="/tokyo/A1304/A130401/123/"><h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Verify", text: "verify you are human", html: "" },
    { url: "https://tabelog.com/en/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "Restaurant 1 予約 人数 19:00", html: '<link rel="canonical" href="/en/tokyo/A1304/A130401/123/"><h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>' },
  ].map(snapshot => boundQueryFixture(snapshot)));
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z").check(
    { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] }, new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(session.navigated.filter((url) => url === "https://tabelog.com/en/tokyo/A1304/A130401/123/").length, 2);
  assert.equal(session.navigated.filter((url) => url === "https://tabelog.com/tokyo/A1304/A130401/123/").length, 1);
});

test("Tabelog rejects a challenged alternate that no longer proves the same outlet and keeps the earlier HIGH identity", async () => {
  const session = new FixtureBrowserSession([
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant", title: "search", text: "Restaurant 1", html: '<article><a href="https://tabelog.com/en/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article>' },
    { url: "https://tabelog.com/en/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "Restaurant 1", html: '<link rel="canonical" href="/tokyo/A1304/A130401/123/"><h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Verify", text: "Just a moment...", html: "" },
    { url: "https://tabelog.com/en/tokyo/A1304/A130401/123/", title: "Other Restaurant 1", text: "Restaurant 1", html: '<h1>Restaurant 1</h1><p class="rstinfo-table__address">1-2 Shinjuku, Tokyo</p>' },
  ]);
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z").check(
    { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] }, new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE");
  assert.equal(result.evidence.some((item) => item.kind === "ENTITY_MATCH" && item.entityMatch?.confidence === "HIGH"), true);
});

test("Tabelog pauses a challenged local session for explicit human intervention, then resumes the same page/session without an automated retry", async () => {
  const session = new ChallengeResumeSession();
  let intervention: {
    state: string;
    provider: string;
    stage: string;
    candidate: { id: string };
    requestedSchedule: { date: string; partySize: number };
    browser: { sessionId?: string };
  } | undefined;
  const result = await new TabelogBrowserAvailability(
    { openSession: async () => session },
    () => "2026-08-05T09:00:00.000Z",
    5,
    {
      onUserInterventionRequired: async (input) => {
        intervention = input;
        assert.equal(session.closed, false, "the browser must remain open while the human verifies the page");
        session.clearChallenge();
      },
    },
  ).check(
    { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] },
    new AbortController().signal,
  );
  assert.equal(intervention?.state, "USER_INTERVENTION_REQUIRED");
  assert.equal(intervention?.provider, "TABELOG");
  assert.equal(intervention?.stage, "SEARCH");
  assert.equal(intervention?.candidate.id, candidate.restaurant.id);
  assert.deepEqual(intervention?.requestedSchedule, { date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2 });
  assert.equal(intervention?.browser.sessionId, session.metadata.sessionId);
  assert.equal(result.metadata.browser?.sessionId, session.metadata.sessionId);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(session.navigated.filter((url) => url.includes("/rstLst/")).length, 1, "resume must not re-navigate or automatically retry the challenged search");
  assert.equal(session.closed, true, "the resumed read must cleanly close its session after completion");
});

test("Tabelog fails closed when the challenge remains after an explicit resume signal", async () => {
  const session = new ChallengeResumeSession();
  let pauses = 0;
  const result = await new TabelogBrowserAvailability(
    { openSession: async () => session },
    () => "2026-08-05T09:00:00.000Z",
    5,
    { onUserInterventionRequired: async () => { pauses += 1; } },
  ).check(
    { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] },
    new AbortController().signal,
  );
  assert.equal(pauses, 1);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE");
  assert.equal(session.navigated.length, 1, "a still-challenged page is not retried automatically");
  assert.equal(session.closed, true);
});

test("Tabelog browser session budget returns UNKNOWN rather than reusing or over-opening a session", async () => {
  const browser: BrowserRuntime = { openSession: async () => new FixtureBrowserSession([]) };
  const adapter = new TabelogBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z", 5, { maxBrowserSessions: 0 });
  const result = await adapter.check(
    { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] },
    new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "READ_BUDGET_EXCEEDED");
});

test("Tabelog browser startup failure remains observable and is not reported as an entity mismatch", async () => {
  const browser: BrowserRuntime = {
    openSession: async () => { throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "session unavailable"); },
  };
  const result = await new TabelogBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z").check(
    { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] },
    new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BROWSER_RUNTIME_FAILED");
  assert.equal(result.metadata.failureCode, "BROWSER_RUNTIME_FAILED");
});

test("Tabelog entity failure sends a sanitized search, detail, and comparison diagnostic to the eval sink", async () => {
  const phoneCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, googlePlaces: "google-restaurant-1", phone: "03-1111-2222" } },
  };
  const diagnostics: unknown[] = [];
  const browser: BrowserRuntime = { openSession: async () => new FixtureBrowserSession([
    {
      url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201",
      title: "Tabelog search",
      text: "Restaurant 1",
      html: '<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/123/">Restaurant 1</a>',
    },
    {
      url: "https://tabelog.com/tokyo/A1304/A130401/123/?from=search",
      title: "Restaurant 1 | Tabelog",
      text: "Restaurant 1",
      html: [
        '<link rel="canonical" href="/tokyo/A1304/A130401/123/">',
        '<p class="rstinfo-table__address">1-2 Shinjuku, Tokyo</p>',
        '<a href="tel:03-9999-8888">03-9999-8888</a>',
      ].join(""),
    },
  ]) };
  const result = await new TabelogBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z", 5, {
    onIdentityDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(
    { candidateIds: [phoneCandidate.restaurant.id], candidates: [phoneCandidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] },
    new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[phoneCandidate.restaurant.id]?.reasonCode, "ENTITY_MATCH_UNCERTAIN");
  const diagnostic = diagnostics[0] as {
    search: { requestedUrl: string; finalUrl: string; title: string };
    searchResults: Array<{ sourceUrl: string; outletName: string }>;
    details: Array<{ requestedUrl: string; finalUrl: string; canonicalUrl?: string; extracted?: { phone: { source: string } } }>;
    comparedOutlets: Array<{ comparison: { phone: string; address: string }; phone: { normalizedValue?: string } }>;
    resolution: { reason: string };
  };
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostic.search.requestedUrl, "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201");
  assert.equal(diagnostic.search.finalUrl, "https://tabelog.com/en/rstLst/?sw=Restaurant%201");
  assert.equal(diagnostic.search.title, "Tabelog search");
  assert.deepEqual(diagnostic.searchResults[0], {
    sourceEntityId: "tokyo/A1304/A130401/123",
    sourceUrl: "https://tabelog.com/tokyo/A1304/A130401/123/",
    outletName: "Restaurant 1",
  });
  assert.equal(diagnostic.details[0]?.requestedUrl, "https://tabelog.com/tokyo/A1304/A130401/123/");
  assert.equal(diagnostic.details[0]?.finalUrl, "https://tabelog.com/tokyo/A1304/A130401/123/");
  assert.equal(diagnostic.details[0]?.canonicalUrl, "https://tabelog.com/tokyo/A1304/A130401/123/");
  assert.equal(diagnostic.details[0]?.extracted?.phone.source, "TEL_LINK");
  assert.equal(diagnostic.comparedOutlets[0]?.phone.normalizedValue, "0399998888");
  assert.equal(diagnostic.comparedOutlets[0]?.comparison.phone, "CONFLICT");
  assert.equal(diagnostic.comparedOutlets[0]?.comparison.address, "CONFLICT");
  assert.equal(diagnostic.resolution.reason, "KNOWN_PHONE_CONFLICT");
});

test("Tabelog search challenge records its cause while removing transient challenge tokens", async () => {
  const diagnostics: unknown[] = [];
  const nonTokyoCandidate = { ...candidate, restaurant: { ...candidate.restaurant, address: "1-1 Umeda, Osaka" } };
  const browser: BrowserRuntime = { openSession: async () => new FixtureBrowserSession([{
    url: "https://tabelog.com/en/rstLst/?sw=Restaurant+1&__cf_chl_rt_tk=ephemeral-token",
    title: "Just a moment...",
    text: "Just a moment...",
    html: "",
  }]) };
  const result = await new TabelogBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z", 5, {
    onIdentityDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(
    { candidateIds: [nonTokyoCandidate.restaurant.id], candidates: [nonTokyoCandidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] },
    new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[nonTokyoCandidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE");
  const diagnostic = diagnostics[0] as { search: { requestedUrl: string; finalUrl: string }; resolution: { reason: string }; comparedOutlets: unknown[] };
  assert.equal(diagnostic.search.requestedUrl, "https://tabelog.com/en/rstLst/?sw=Restaurant%201");
  assert.equal(diagnostic.search.finalUrl, "https://tabelog.com/en/rstLst/?sw=Restaurant%201");
  assert.equal(diagnostic.search.finalUrl.includes("__cf_chl_rt_tk"), false);
  assert.equal(diagnostic.resolution.reason, "SEARCH_BOT_CHALLENGE");
  assert.deepEqual(diagnostic.comparedOutlets, []);
});


test("Tabelog external booking detection ignores unrelated links and requires a booking link", async () => {
  const { detectExternalReservationRedirect } = await import("./tabelog-page-parser.js");
  const snapshot = {url:"https://tabelog.com/en/tokyo/A1301/A130103/13292459/",title:"Restaurant",text:"Reservations and official website",html:'<a href="https://instagram.com/restaurant">Instagram</a><a href="https://restaurant.example">Official website</a>'};
  assert.equal(detectExternalReservationRedirect(snapshot),false);
  assert.equal(detectExternalReservationRedirect({...snapshot,html:'<a href="https://www.tablecheck.com/en/shops/shop/reserve">Reserve</a>'}),true);
  assert.equal(detectExternalReservationRedirect({...snapshot,html:'<a href="/en/booking/form_course/new">Reserve</a>'}),false);
});

test("Tabelog captured vacancy binds source merchant, date, party and time rather than visible options", async () => {
  const {tabelogCapturedSlots} = await import("./tabelog-query-controls.js");
  const html='<div class="p-booking-calendar"><p class="js-calendar-day-target is-current" data-year="2026" data-month="9" data-day="20"></p><fieldset><legend>Guests</legend><button class="js-people-button is-active">4</button><input type="hidden" class="js-people-hidden-value" value="4"></fieldset></div>';
  const body={base_date:{year:2026,month:9,day:20},members:4,selection:{0:{time:"19:00",url:"/en/booking/form_course/new?rcd=13292459&member=4&visit_date=20260920&visit_time=1900"}}};
  const response={url:"https://tabelog.com/en/booking/calendar/find_vacancy/",status:200,sequence:1,observedAt:"2026-09-16T10:00:00Z",body};
  const snapshot={url:"https://tabelog.com/en/tokyo/A1301/A130103/13292459/",title:"Restaurant",text:"7:00 PM",html,responses:[response]};
  assert.deepEqual(tabelogCapturedSlots(snapshot,"2026-09-20",4),{availableSlots:["19:00"],hasExplicitSlotUi:true});
  for(const changed of [
    {...body,members:2}, {...body,base_date:{year:2026,month:9,day:21}},
    {...body,selection:{0:{...body.selection[0],url:body.selection[0].url.replace("13292459","99999999")}}},
    {...body,selection:{0:{...body.selection[0],time:"19:30"}}}, {...body,selection:{}},
  ]) assert.equal(tabelogCapturedSlots({...snapshot,responses:[{...response,body:changed}]},"2026-09-20",4),undefined);
  assert.equal(tabelogCapturedSlots({...snapshot,html:'<label for="guests">Guests</label><input id="guests" type="number" value="2">'},"2026-09-20",4),undefined, 'a contradictory public native value invalidates the response');
  assert.equal(tabelogCapturedSlots({...snapshot,responses:[{...response,status:503}]},"2026-09-20",4),undefined);
});

test("Tabelog current public controls confirm selection without private hooks and reject contradictory inventory", () => {
  const html='<table><caption>Nov 2026</caption><tr><td><button aria-current="date">3</button></td></tr></table><fieldset><legend>Guests</legend><button value="2" aria-pressed="true">2</button></fieldset><button>7:00 PM</button>';
  const body={base_date:{year:2026,month:11,day:3},members:2,selection:{0:{time:'19:00',url:'/en/booking/form_course/new?rcd=13261619&member=2&visit_date=20261103&visit_time=1900'}}};
  const response={url:'https://tabelog.com/en/booking/calendar/find_vacancy',status:200,sequence:2,observedAt:'2026-10-21T07:03:00Z',body};
  const snapshot={url:'https://tabelog.com/en/tokyo/A1303/A130301/13261619/',title:'Matsumoto',text:'',html,responses:[response]};
  assert.equal(hasTabelogSelectedQuery(snapshot,'2026-11-03',2),true);
  assert.deepEqual(parseTabelogAvailabilitySlots(snapshot,{date:'2026-11-03',partySize:2}),{availableSlots:['19:00'],hasExplicitSlotUi:true});
  for (const changed of [html.replace('>3</button>','>4</button>'),html.replace('value="2"','value="3"'),html.replace('>2</button>','>3</button>'),html+'<label for="party">Guests</label><input id="party" type="number" value="3">']) {
    assert.equal(hasTabelogSelectedQuery({...snapshot,html:changed},'2026-11-03',2),false);
    assert.deepEqual(parseTabelogAvailabilitySlots({...snapshot,html:changed},{date:'2026-11-03',partySize:2}),{availableSlots:[],hasExplicitSlotUi:false});
  }
  for (const changed of [html.replace('aria-pressed="true"','aria-pressed="mixed"'),html.replace('aria-current="date"','aria-current="false"')]) {
    assert.equal(hasTabelogSelectedQuery({...snapshot,html:changed,responses:[]},'2026-11-03',2),false,'missing public confirmation needs a response');
  }
  for (const changed of [{...body,members:3},{...body,base_date:{year:2026,month:11,day:4}}, {...body,selection:{0:{...body.selection[0],url:body.selection[0].url.replace('13261619','99999999')}}}]) {
    const stale={...response,sequence:1};
    assert.equal(tabelogCapturedSlots({...snapshot,responses:[stale,{...response,body:changed}]},'2026-11-03',2),undefined,'a later contradictory response cannot fall back to earlier inventory');
    assert.deepEqual(parseTabelogAvailabilitySlots({...snapshot,responses:[{...response,body:changed}]},{date:'2026-11-03',partySize:2}),{availableSlots:[],hasExplicitSlotUi:false});
  }
  assert.equal(hasTabelogSelectedQuery({...snapshot,html:html+'<section hidden><table><caption>Nov 2026</caption><tr><td><button aria-current="date">4</button></td></tr></table></section>'},'2026-11-03',2),true);
});

test("all 19 saved quick-validation selections match the independent source oracle without fabricating missing responses", async () => {
  const root=new URL('./fixtures/availability/',import.meta.url),batch='checkpoint-c-live-20261020/tabelog-query-binding-20261021/';
  const manifest=JSON.parse(await readFile(new URL(batch+'inputs/manifest.json',root),'utf8'));
  const oracle=JSON.parse(await readFile(new URL(batch+'independent-oracle.json',root),'utf8'));
  assert.equal(manifest.rows.length,19);assert.equal(oracle.confirmed,17);
  for(const row of manifest.rows){
    const detail=JSON.parse(await readFile(new URL(row.snapshotPath,root),'utf8')).detail;
    const snapshot={url:detail.url,title:detail.title,text:'',html:await readFile(new URL(row.htmlPath,root),'utf8'),responses:detail.responses};
    const expected=oracle.rows.find((item:{id:string})=>item.id===row.id);
    assert.equal(hasTabelogSelectedQuery(snapshot,row.request.date,row.request.partySize),expected.selectedQuery,row.id);
    assert.deepEqual(parseTabelogAvailabilitySlots(snapshot,row.request),{availableSlots:[],hasExplicitSlotUi:false},row.id+' has no captured runtime response');
  }
});

test("Tabelog uses at most one validated Google-name fragment after an empty first screen, with original identity", async () => {
  const localized = { ...candidate, restaurant: { ...candidate.restaurant, outletName: "Restaurant 1 Tokyo", sourceIds: { googlePlaces: "same-place", phone: "03-1111-2222" } } };
  for (const matchingPhone of [true, false]) {
    let proposals = 0;
    let identity: unknown;
    const session = new FixtureBrowserSession([
      { url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201%20Tokyo", title: "search", text: "No restaurants were found that match your search criteria", html: "" },
      { url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201", title: "search", text: "Restaurant 1", html: '<a class="list-rst__rst-name-target" href="https://tabelog.com/tokyo/A1304/A130401/123/">Restaurant 1</a>' },
      { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数", html: `<a href="tel:${matchingPhone ? "03-1111-2222" : "03-9999-8888"}">Call</a><select name="party"></select><select name="date"></select><button class="slot is-available" data-time="19:00">19:00</button>` , responses: [{ url: "https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=123&svd=20260805&svps=2", status: 200, sequence: 1, observedAt: "2026-08-05T09:00:00Z", body: { base_date: { year: 2026, month: 8, day: 5 }, members: 2, selection: [{ time: "19:00", url: "/en/booking/form_course/new?rcd=123&member=2&visit_date=20260805&visit_time=1900" }] } }] },
    ]);
    const result = await new TabelogBrowserAvailability({ openSession: async () => session }, undefined, 5, {
      onIdentityDiagnostic: diagnostic => { identity = diagnostic; },
      alternativeSearch: async (original: typeof candidate) => { proposals++; assert.equal(original.restaurant.outletName, localized.restaurant.outletName); return "Restaurant 1"; },
    }).check({ candidateIds: [localized.restaurant.id], candidates: [localized], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
    assert.equal(proposals, 1);
    assert.equal(result.offers.length, matchingPhone ? 1 : 0, JSON.stringify({ checks: result.availabilityChecks, identity }));
    assert.equal(session.navigated.filter(url => url.includes("rstLst")).length, 2);
    assert.equal(new URL(session.navigated[1]!).searchParams.get("sw"), "Restaurant 1");
  }
});

test("Tabelog nonempty wrong first screen uses one alternative only within the shared detail cap", async () => {
  const subject = { ...candidate, restaurant: { ...candidate.restaurant, outletName: "Restaurant 1 Tokyo", sourceIds: { googlePlaces: "original-id", phone: "03-1111-2222" } } };
  for (const cap of [1, 2]) {
    let proposals = 0;
    const session = new FixtureBrowserSession([
      { url: "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201%20Tokyo", title: "Search", text: "Restaurant 1", html: '<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/111/">Restaurant 1</a>' },
      { url: "https://tabelog.com/tokyo/A1304/A130401/111/", title: "Wrong branch", text: "Wrong branch", html: '<script type="application/ld+json">{"@type":"Restaurant","name":"Restaurant 1","telephone":"03-1111-2222","address":"9-9 Shibuya, Tokyo"}</script>' },
      { url: "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201", title: "Search", text: "Restaurant 1", html: '<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/222/">Restaurant 1</a><a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/333/">Extra</a>' },
      { url: "https://tabelog.com/tokyo/A1304/A130401/222/", title: "Restaurant 1", text: "Restaurant 1", html: '<script type="application/ld+json">{"@type":"Restaurant","name":"Restaurant 1","telephone":"03-1111-2222","address":"1-1 Shinjuku, Tokyo"}</script>' },
    ]);
    const result = await new TabelogBrowserAvailability({ openSession: async () => session }, undefined, cap, {
      alternativeSearch: async original => { proposals++; assert.deepEqual(original, subject); return "Restaurant 1"; },
    }).check({ candidateIds: [subject.restaurant.id], candidates: [subject], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
    assert.equal(proposals, cap === 1 ? 0 : 1);
    assert.equal(session.navigated.filter(url => url.includes("rstLst")).length, cap === 1 ? 1 : 2);
    assert.equal(session.navigated.filter(url => !url.includes("rstLst")).length, cap);
    assert.ok(!session.navigated.some(url => url.endsWith("333/")), "alternative search does not reset detail allowance");
    assert.equal(result.offers.length, 0);
    assert.equal(result.evidence.some(item => item.entityMatch?.confidence === "HIGH"), cap === 2);
  }
});

test("Tabelog prioritizes the closest observed name before the five-detail cap without granting identity", async () => {
  const subject = structuredClone(candidate);
  subject.restaurant.sourceIds = { googlePlaces: "original-place", phone: "03-1111-2222" };
  const urls = Array.from({ length: 6 }, (_, i) => `https://tabelog.com/tokyo/A1304/A130401/${9100 + i}/`);
  const target = urls[5]!;
  const search = { url: "https://tabelog.com/en/tokyo/rstLst/?sw=Restaurant%201", title: "Search", text: "Restaurants", html: urls.map((url, i) => `<a class="list-rst__rst-name-target" href="${url}">${i === 5 ? subject.restaurant.outletName : `Unrelated Cafe ${i}`}</a>`).join("") };
  for (const conflict of [false, true]) {
    const session = new FixtureBrowserSession([]);
    let current = search;
    session.navigate = async url => {
      session.navigated.push(url);
      const matching = url === target;
      current = url.includes("rstLst") ? search : { url, title: "Detail", text: "Public restaurant identity", html: `<script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: matching ? subject.restaurant.outletName : "Other Cafe", telephone: matching ? "03-1111-2222" : "03-9999-8888", address: matching && !conflict ? subject.restaurant.address : "9-9 Shibuya, Tokyo" })}</script>` };
    };
    session.snapshot = async () => current;
    const result = await new TabelogBrowserAvailability({ openSession: async () => session }, undefined, 5).check({ candidateIds: [subject.restaurant.id], candidates: [subject], date: fixtureIntent.date, partySize: 2, timeWindow: fixtureIntent.timeWindow, hardCriteria: [] }, new AbortController().signal);
    const details = session.navigated.filter(url => !url.includes("rstLst"));
    assert.equal(details[0], target, "the sixth listed closest name must be inspected first");
    assert.equal(new Set(details).size, 5, "availability may reopen the matched outlet but cannot inspect a sixth candidate");
    assert.equal(result.evidence.some(e => e.entityMatch?.confidence === "HIGH"), !conflict, "ranking cannot override conflicting identity fields");
  }
});

test("detail priority uses observed locality then distance for equal names and preserves unobserved ties", () => {
  const subject = structuredClone(candidate);
  subject.restaurant.address = "東京都新宿区神楽坂3-1-43";
  subject.restaurant.coordinates = { lat: 35.7, lng: 139.74 };
  const outlet = (sourceEntityId: string, address?: string, coordinates?: { lat: number; lng: number }) => ({ sourceEntityId, sourceUrl: `https://tabelog.com/tokyo/A1304/A130401/${sourceEntityId}/`, outletName: subject.restaurant.outletName, ...(address ? { address } : {}), ...(coordinates ? { coordinates } : {}) });
  const rows = [outlet("other-area", "東京都中央区銀座3-1-43", { lat: 35.7, lng: 139.74 }), outlet("far", "東京都新宿区神楽坂3-1-43", { lat: 35.8, lng: 139.84 }), outlet("near", "東京都新宿区神楽坂3-1-43", { lat: 35.7001, lng: 139.7401 })];
  const before = structuredClone(rows);
  assert.deepEqual(prioritizeTabelogOutlets(subject, rows).map(o => o.sourceEntityId), ["near", "far", "other-area"]);
  assert.deepEqual(rows, before);
  const unknown = [outlet("first"), outlet("second")];
  assert.deepEqual(prioritizeTabelogOutlets(subject, unknown), unknown, "missing fields cannot invent a location or reorder a tie");
});

test("Tabelog applies availability controls on the resolved outlet after inspecting other branches", async () => {
  const selected: BrowserSnapshot = { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数", html: '<select name="party"></select><select name="date"></select><button class="slot is-available" data-time="19:00">19:00</button>' };
  const session = new FixtureBrowserSession([
    { url: "https://tabelog.com/en/rstLst/", title: "search", text: "", html: '<article><a href="https://tabelog.com/tokyo/A1304/A130401/123/">Restaurant 1</a><address>1-1 Shinjuku, Tokyo</address></article><article><a href="https://tabelog.com/tokyo/A1304/A130401/999/">Other branch</a><address>9-9 Shibuya, Tokyo</address></article>' },
    selected,
    { url: "https://tabelog.com/tokyo/A1304/A130401/999/", title: "Other", text: "Other branch", html: '<h1>Other branch</h1>' },
    selected,
  ].map(snapshot => boundQueryFixture(snapshot)));
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }).check({ candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.equal(result.offers.length, 1);
  assert.equal(session.navigated.at(-1), selected.url);
});

test("recorded source price fragments retain exact ranges, course values, tax and quotes", async () => {
  const { parseTabelogPriceFacts } = await import("./tabelog-page-parser.js");
  const { parseTableCheckPriceFacts } = await import("../tablecheck/tablecheck-page-parser.js");
  const expected = JSON.parse(await readFile(new URL("../../harness/browser/fixtures/restaurant-prices/expectations.json", import.meta.url), "utf8")).expected;
  const sourceUrls: Record<string, string> = {
    "ginza-sushi-sendou": "https://tabelog.com/en/tokyo/A1301/A130101/13295658/",
    "ginza-outlet-13292459": "https://tabelog.com/en/tokyo/A1301/A130103/13292459/",
    "ginza-outlet-13277198": "https://tabelog.com/en/tokyo/A1301/A130101/13277198/",
    "tablecheck-recorded-menu": "https://www.tablecheck.com/en/alaska-asahi",
  };
  for (const [name, url] of Object.entries(sourceUrls)) {
    const html = await readFile(new URL(`../../harness/browser/fixtures/restaurant-prices/${name}.html`, import.meta.url), "utf8");
    const text = html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    const snapshot = { url, html, text, title: name };
    const facts = name.startsWith("tablecheck") ? parseTableCheckPriceFacts(snapshot) : parseTabelogPriceFacts(snapshot);
    assert.ok(facts, name);
    assert.deepEqual(facts.listedCoursePricesYen.map(price => price.amount), expected[name].courses, name);
    if (expected[name].dinner) assert.deepEqual([facts.dinnerBudgetRangeYen?.min, facts.dinnerBudgetRangeYen?.max], expected[name].dinner);
    if (expected[name].lunch) assert.deepEqual([facts.lunchBudgetRangeYen?.min, facts.lunchBudgetRangeYen?.max], expected[name].lunch);
    assert.ok(facts.listedCoursePricesYen.every(price => price.sourceUrl === url && price.quote && price.tax === "INCLUDED"));
  }
  assert.equal(parseTabelogPriceFacts({ url: sourceUrls["ginza-sushi-sendou"]!, title: "No price", html: "<p>Contact us</p>", text: "Contact us" }), undefined);
});

test("Tabelog existing read grounds recorded course prices even when inventory is UNKNOWN", async () => {
  const url = "https://tabelog.com/en/tokyo/A1301/A130101/13295658/";
  const fragment = await readFile(new URL("../../harness/browser/fixtures/restaurant-prices/ginza-sushi-sendou.html", import.meta.url), "utf8");
  // Synthetic identity envelope, unchanged recorded price elements. This is
  // an Adapter composition control, not a replay of original website identity.
  const html = '<script type="application/ld+json">{"@type":"Restaurant","name":"Restaurant 1","address":{"streetAddress":"1-1 Shinjuku","addressRegion":"Tokyo"}}</script><h1>Restaurant 1</h1><p>1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">Phone</a>' + fragment;
  const page = { url, title: "Restaurant 1", html, text: html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim() };
  const native = structuredClone(candidate);
  native.restaurant.id = "tabelog:en/tokyo/A1301/A130101/13295658";
  native.restaurant.sourceIds = { tabelog: "en/tokyo/A1301/A130101/13295658", tabelogNativeDetailUri: url };
  const session = new FixtureBrowserSession([page]);
  const read = await new TabelogBrowserAvailability({ openSession: async () => session }).check({ candidates: [native], candidateIds: [native.restaurant.id], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  const prices = read.evidence.find(item => item.kind === "RESTAURANT_FACT")?.priceFacts;
  assert.equal(prices?.listedCoursePricesYen[0]?.amount, 9800, "the opened page's price must survive Adapter → grounding, without a new read");
  assert.equal(read.offers.length, 0, "listed prices do not establish inventory");
});


test("Tabelog field quotations retain merchant courses separately from names/reviews and reject neighboring courses", async () => {
  const url="https://tabelog.com/en/tokyo/A0000/A000000/11111111/";
  const card=(title:string,href=url+"party/1/")=>`<div class="rstdtl-course-list js-rstdtl-course-list"><a href="${href}"><span class="rstdtl-course-list__course-title-text">${title}</span></a><p class="rstdtl-course-list__desc">Dinner bookings handled separately</p></div>`;
  const html=`<h2 class="display-name">Omakase House</h2><div class="rstdtl-rvw"><a class="rstdtl-rvw__title-target">Wonderful Kaiseki</a>${card("Review Omakase Course")}</div><aside>${card("Neighbor Omakase")}</aside>${card("Lunch Omakase Course")}<div hidden>${card("Hidden Omakase")}</div><div aria-hidden="true">${card("Aria Hidden Omakase")}</div><div class="is-hidden">${card("Class Hidden Omakase")}</div>${card("Foreign Omakase",url.replace("11111111","22222222")+"party/1/")}<table class="rstinfo-table__table"><tr><th>Categories</th><td>Sushi, Japanese Cuisine</td></tr></table>`;
  const q=parseTabelogSourceFieldQuotes({url,title:"Source",text:"",html});
  assert.ok(q.some(q=>q.field==="NAME"&&q.quote==="Omakase House"));
  assert.ok(q.some(q=>q.field==="CUSTOMER_REVIEW"&&q.quote==="Wonderful Kaiseki"));
  assert.ok(q.some(q=>q.field==="COURSE_TITLE"&&q.quote==="Lunch Omakase Course"&&q.meal==="LUNCH"));
  assert.ok(q.some(q=>q.field==="CATEGORY"&&q.quote==="Sushi, Japanese Cuisine"));
  assert.ok(!q.some(q=>/Review Omakase|Neighbor Omakase|Foreign Omakase|Hidden Omakase/.test(q.quote)));
  const root=new URL("./fixtures/availability/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-results/c-05-attempt-1/recordings/hybrid-1792581432961/",import.meta.url);
  for(const [file,id,hasCourse] of [["snapshot-0033.html","13300814",true],["snapshot-0034.html","13048623",false]] as const){
    const actual=parseTabelogSourceFieldQuotes({url:`https://tabelog.com/en/tokyo/A1309/A130905/${id}/`,title:"Saved source",text:"",html:await readFile(new URL(file,root),"utf8")});
    assert.equal(actual.some(q=>q.field==="COURSE_TITLE"&&/Kaiseki/.test(q.quote)),hasCourse);
    if(!hasCourse)assert.ok(actual.some(q=>q.field==="CUSTOMER_REVIEW"&&q.quote==="A Flaw in the Spring Kaiseki Experience"));
  }
});


test("Tabelog field quotations match class tokens with reordered and extra classes without JS hooks", () => {
  const url = "https://tabelog.com/en/tokyo/A0000/A000000/11111111/";
  const expected = [
    { field: "NAME", quote: "Source Restaurant", sourceUrl: url, meal: "UNSPECIFIED" },
    { field: "CUSTOMER_REVIEW", quote: "Customer opinion", sourceUrl: url, meal: "UNSPECIFIED" },
    { field: "COURSE_TITLE", quote: "Lunch Omakase Course", sourceUrl: url, meal: "LUNCH" },
    { field: "COURSE_DESCRIPTION", quote: "Lunch course details", sourceUrl: url, meal: "LUNCH" },
  ];
  for (const classes of [
    { card: "js-rstdtl-course-list rstdtl-course-list", title: "emphasis rstdtl-course-list__course-title-text", description: "rstdtl-course-list__desc expanded", review: "highlight rstdtl-rvw__title-target", name: "display-name prominent" },
    { card: "extra rstdtl-course-list another", title: "rstdtl-course-list__course-title-text emphasis", description: "expanded rstdtl-course-list__desc", review: "rstdtl-rvw__title-target highlight", name: "prominent display-name" },
  ]) {
    const html = `<h2 class="${classes.name}">Source Restaurant</h2>
      <h2 class="display-name-suffix">Not a name field</h2>
      <a class="${classes.review}">Customer opinion</a>
      <div class="${classes.card}"><a href="${url}party/1/"><span class="${classes.title}">Lunch Omakase Course</span></a><p class="${classes.description}">Lunch course details</p></div>`;
    assert.deepEqual(parseTabelogSourceFieldQuotes({ url, title: "Source", text: "", html }), expected);
  }
});

test("bound vacancy collections keep supported clock alternatives and never infer stock from unsupported rows", async () => {
  const fixture=JSON.parse(await readFile(new URL('./fixtures/availability/phase2c-location-semantic-20261023/goya-followup/saved-inputs.json',import.meta.url),'utf8'));
  for(const row of fixture.rows){
    const {snapshot,request}=row;
    assert.equal(hasTabelogSelectedQuery(snapshot,request.date,request.partySize),true,row.id);
    const parsed=parseTabelogAvailabilitySlots(snapshot,request);
    assert.equal(parsed.hasExplicitSlotUi,true,row.id);
    assert.ok(parsed.availableSlots.includes('19:00'),row.id+' retains the independently bound requested slot');
    assert.ok(parsed.availableSlots.every((time:string)=>/^([01]\d|2[0-3]):[0-5]\d$/.test(time)));
    assert.equal(tabelogAvailabilityCompletion(snapshot,request).complete,true,row.id);
    const response=snapshot.responses.at(-1),body=response.body;
    const valid=Object.values(body.selection).find((r:any)=>r.time==='19:00') as {time:string;url:string};
    const unsupported=Object.values(body.selection).filter((r:any)=>!r.time);
    assert.equal(unsupported.length,13);
    const changed=(selection:unknown)=>({...snapshot,responses:[{...response,body:{...body,selection}}]});
    for(const selection of [unsupported,[],[{url:valid.url}],[{...valid,time:'19:30'}],[{...valid,url:valid.url.replace('visit_time=1900','visit_time=2400')}],[{...valid,url:valid.url.replace('member=3','member=4')}],[valid,{...valid,url:valid.url.replace('rcd=13320164','rcd=99999999')}],[valid,{url:valid.url}]]) {
      assert.deepEqual(parseTabelogAvailabilitySlots(changed(selection),request),{availableSlots:[],hasExplicitSlotUi:false},row.id+' ambiguous relevant rows remain UNKNOWN');
    }
    for(const altered of [{...body,members:4},{...body,base_date:{year:2026,month:11,day:4}}]) {
      const stale={...response,sequence:0};
      assert.equal(tabelogCapturedSlots({...snapshot,responses:[stale,{...response,body:altered}]},request.date,3),undefined,'never use stale inventory after a newer contradictory response');
    }
    assert.deepEqual(parseTabelogAvailabilitySlots({...snapshot,settlement:'PENDING'},request),{availableSlots:[],hasExplicitSlotUi:false});
  }
});
