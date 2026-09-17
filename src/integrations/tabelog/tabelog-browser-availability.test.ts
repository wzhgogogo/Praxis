import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserRuntimeError } from "../../infrastructure/browser/browser-runtime-errors.js";
import { inspectTabelogEntity, resolveTabelogEntity } from "./tabelog-entity-resolver.js";
import { TabelogBrowserAvailability } from "./tabelog-browser-availability.js";
import { parseTabelogAvailabilitySlots, parseTabelogOutletIdentityWithEvidence, parseTabelogSearchOutlets } from "./tabelog-page-parser.js";

const candidate = fixtureCandidates[0]!;

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

test("Tabelog slot parser ignores prose times and trusts only explicit available controls", () => {
  const prose = parseTabelogAvailabilitySlots({ url: "https://tabelog.com/x/", title: "x", text: "Dinner starts at 19:00", html: "<p>営業時間 19:00</p>" });
  const controls = parseTabelogAvailabilitySlots({ url: "https://tabelog.com/x/", title: "x", text: "", html: '<button class="slot is-available" data-time="19:00">19:00</button><button class="slot full" data-time="19:30">19:30</button>' });
  assert.deepEqual(prose, { availableSlots: [], hasExplicitSlotUi: false });
  assert.deepEqual(controls, { availableSlots: ["19:00"], hasExplicitSlotUi: true });
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
    html: '<a href="https://tabelog.com/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>',
  };

  private readonly detail: BrowserSnapshot = {
    url: "https://tabelog.com/tokyo/A1304/A130401/123/",
    title: "Restaurant 1",
    text: "Restaurant 1 予約 人数 19:00",
    html: '<select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>',
  };

  async navigate(url: string): Promise<void> {
    this.navigated.push(url);
    if (url.includes("/tokyo/")) this.current = this.detail;
  }
  async snapshot(): Promise<BrowserSnapshot> { return structuredClone(this.current); }
  async click(): Promise<void> {}
  async fill(): Promise<void> {}
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closed = true; }
  clearChallenge(): void { this.current = this.search; }
}

test("Tabelog executor grounds a deterministic browser observation and never submits", async () => {
  const pages: BrowserSnapshot[] = [
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant", title: "search", text: "Restaurant 1", html: '<a href="https://tabelog.com/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button><div class="genre">yakiniku</div>' },
  ];
  const session = new FixtureBrowserSession(pages);
  const browser: BrowserRuntime = { openSession: async () => session };
  const adapter = new TabelogBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z");
  const result = await adapter.check({ candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] }, new AbortController().signal);
  assert.equal(session.navigated[0], "https://tabelog.com/en/rstLst/?sw=Restaurant%201");
  assert.equal(result.metadata.route, "GENERIC_BROWSER");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(result.offers.length, 1);
  assert.equal(session.clicks, 0);
  assert.equal(session.fills, 0);
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
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button>' },
  ]);
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z").check(
    { candidateIds: [listedCandidate.restaurant.id], candidates: [listedCandidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] }, new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[listedCandidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(session.navigated[0], "https://tabelog.com/tokyo/A1304/A130401/123/");
  assert.equal(session.navigated.some((url) => url.includes("/rstLst/")), false);
});

test("Tabelog keeps an immediate non-slot UNKNOWN rather than treating a nearby source slot as unavailable", async () => {
  const session = new FixtureBrowserSession([
    { url: "https://tabelog.com/en/rstLst/?sw=Restaurant", title: "search", text: "Restaurant 1", html: '<a href="https://tabelog.com/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 12:00 12:30", html: '<h1>Restaurant 1</h1><p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="12:00">12:00</button><button class="slot is-available" data-time="12:30">12:30</button>' },
  ]);
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:30.000Z").check({
    candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: { earliest: "12:08", latest: "12:08" }, partySize: 2, hardCriteria: ["yakiniku"],
    immediateAvailability: { validUntil: "2026-08-05T09:01:00.000Z", sourceSlotPolicy: "EXACT_ONLY" },
  }, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "IMMEDIATE_SLOT_NOT_OFFERED");
  assert.equal(result.offers.length, 0);
});

test("Tabelog bot challenge and external booking redirect remain non-available results", async () => {
  const makeRuntime = (text: string): BrowserRuntime => ({ openSession: async () => new FixtureBrowserSession([
    { url: "https://tabelog.com/en/rstLst/", title: "search", text: "Restaurant 1", html: '<a href="https://tabelog.com/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>' },
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
  assert.equal(diagnostic.search.requestedUrl, "https://tabelog.com/en/rstLst/?sw=Restaurant%201");
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
  const browser: BrowserRuntime = { openSession: async () => new FixtureBrowserSession([{
    url: "https://tabelog.com/en/rstLst/?sw=Restaurant+1&__cf_chl_rt_tk=ephemeral-token",
    title: "Just a moment...",
    text: "Just a moment...",
    html: "",
  }]) };
  const result = await new TabelogBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z", 5, {
    onIdentityDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(
    { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] },
    new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "BOT_CHALLENGE");
  const diagnostic = diagnostics[0] as { search: { finalUrl: string }; resolution: { reason: string }; comparedOutlets: unknown[] };
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
  const html='<div class="p-booking-calendar"><p class="js-calendar-day-target is-current" data-year="2026" data-month="9" data-day="20"></p><button class="js-people-button is-active">4</button><input class="js-people-hidden-value" value="4"></div>';
  const body={base_date:{year:2026,month:9,day:20},members:4,selection:{0:{time:"19:00",url:"/en/booking/form_course/new?rcd=13292459&member=4&visit_date=20260920&visit_time=1900"}}};
  const response={url:"https://tabelog.com/en/booking/calendar/find_vacancy/",status:200,sequence:1,observedAt:"2026-09-16T10:00:00Z",body};
  const snapshot={url:"https://tabelog.com/en/tokyo/A1301/A130103/13292459/",title:"Restaurant",text:"7:00 PM",html,responses:[response]};
  assert.deepEqual(tabelogCapturedSlots(snapshot,"2026-09-20",4),{availableSlots:["19:00"],hasExplicitSlotUi:true});
  for(const changed of [
    {...body,members:2}, {...body,base_date:{year:2026,month:9,day:21}},
    {...body,selection:{0:{...body.selection[0],url:body.selection[0].url.replace("13292459","99999999")}}},
    {...body,selection:{0:{...body.selection[0],time:"19:30"}}}, {...body,selection:{}},
  ]) assert.equal(tabelogCapturedSlots({...snapshot,responses:[{...response,body:changed}]},"2026-09-20",4),undefined);
  assert.equal(tabelogCapturedSlots({...snapshot,html:html.replace('value="4"','value="2"')},"2026-09-20",4),undefined);
  assert.equal(tabelogCapturedSlots({...snapshot,responses:[{...response,status:503}]},"2026-09-20",4),undefined);
});

test("Tabelog discovery uses a phone-bound website heading when the translated Google name has no results", async () => {
  // Real Adapter/grounding, only browser transport replaced. Retrieval alias is not identity evidence.
  const localized = { ...candidate, restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, phone: "03-1111-2222", googleWebsiteUri: "https://restaurant.example/" } } };
  for (const matchingPhone of [true, false]) {
    const session = new FixtureBrowserSession([
      { url: "https://tabelog.com/en/rstLst/?sw=Restaurant%201", title: "search", text: "No restaurants match Restaurant 1", html: "" },
      { url: "https://restaurant.example/", title: "Restaurant", text: `食堂一 ${matchingPhone ? "03-1111-2222" : "03-9999-8888"}`, html: `<h1>食堂一</h1><a href="tel:${matchingPhone ? "03-1111-2222" : "03-9999-8888"}">Call</a>` },
      { url: "https://tabelog.com/en/rstLst/?sw=食堂一", title: "search", text: "Restaurant 1", html: '<a href="https://tabelog.com/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>' },
      { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数", html: '<a href="tel:03-1111-2222">Call</a><select name="party"></select><select name="date"></select><button class="slot is-available" data-time="19:00">19:00</button>' },
    ]);
    const result = await new TabelogBrowserAvailability({ openSession: async () => session }).check({ candidateIds: [localized.restaurant.id], candidates: [localized], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
    assert.equal(result.offers.length, matchingPhone ? 1 : 0);
    assert.equal(session.navigated.length, matchingPhone ? 4 : 2);
    if (matchingPhone) assert.equal(new URL(session.navigated[2]!).searchParams.get("sw"), "食堂一");
  }
});

test("Tabelog applies availability controls on the resolved outlet after inspecting other branches", async () => {
  const selected: BrowserSnapshot = { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数", html: '<select name="party"></select><select name="date"></select><button class="slot is-available" data-time="19:00">19:00</button>' };
  const session = new FixtureBrowserSession([
    { url: "https://tabelog.com/en/rstLst/", title: "search", text: "", html: '<a href="https://tabelog.com/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a><a href="https://tabelog.com/tokyo/A1304/A130401/999/" data-address="9-9 Shibuya, Tokyo">Other branch</a>' },
    selected,
    { url: "https://tabelog.com/tokyo/A1304/A130401/999/", title: "Other", text: "Other branch", html: '<h1>Other branch</h1>' },
    selected,
  ]);
  const result = await new TabelogBrowserAvailability({ openSession: async () => session }).check({ candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: [] }, new AbortController().signal);
  assert.equal(result.offers.length, 1);
  assert.equal(session.navigated.at(-1), selected.url);
});
