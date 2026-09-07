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

test("Tabelog entity inspection retains the normalized comparison and explicit non-HIGH reason", () => {
  const phoneCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, googlePlaces: "google-restaurant-1", phone: "03-1111-2222" } },
  };
  const inspection = inspectTabelogEntity(phoneCandidate, [{
    sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/x/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo", phone: "03-9999-8888",
  }]);
  assert.equal(inspection.resolution.confidence, "LOW");
  assert.deepEqual(resolveTabelogEntity(phoneCandidate, [{
    sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/x/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo", phone: "03-9999-8888",
  }]), inspection.resolution);
  assert.equal(inspection.diagnostic.google.phone.normalizedValue, "0311112222");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.phone.normalizedValue, "0399998888");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.phone, "CONFLICT");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.outletName, "MATCH");
  assert.equal(inspection.diagnostic.comparedOutlets[0]?.comparison.address, "MATCH");
  assert.equal(inspection.diagnostic.resolution.reason, "KNOWN_PHONE_CONFLICT");
});

test("Tabelog relative search links are enriched with page identity before an exact phone creates a HIGH outlet match", () => {
  const phoneCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, outletName: "Sushisho Isseki Sancho", sourceIds: { ...candidate.restaurant.sourceIds, phone: "03-6427-8577" } },
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
        '<p class="rstinfo-table__address">1-1 Shinjuku, Tokyo</p>',
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
  assert.equal(diagnostic.comparedOutlets[0]?.comparison.address, "MATCH");
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
