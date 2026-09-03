import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { resolveTabelogEntity } from "./tabelog-entity-resolver.js";
import { TabelogBrowserAvailability } from "./tabelog-browser-availability.js";
import { parseTabelogAvailabilitySlots, parseTabelogOutletIdentity, parseTabelogSearchOutlets } from "./tabelog-page-parser.js";

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

test("Tabelog entity resolver fails closed when an otherwise similar outlet has a conflicting known phone", () => {
  const phoneCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, phone: "03-1111-2222" } },
  };
  const resolved = resolveTabelogEntity(phoneCandidate, [{
    sourceEntityId: "x", sourceUrl: "https://tabelog.com/tokyo/A1304/x/", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo", phone: "03-9999-8888",
  }]);
  assert.notEqual(resolved.confidence, "HIGH");
});

test("Tabelog relative search links are enriched with page identity before an exact phone creates a HIGH outlet match", () => {
  const phoneCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, outletName: "Sushisho Isseki Sancho", sourceIds: { ...candidate.restaurant.sourceIds, phone: "03-6427-8577" } },
  };
  const search = parseTabelogSearchOutlets({
    url: "https://tabelog.com/rstLst/?sk=Sushisho", title: "search", text: "Sushisho", html: [
      '<a href="/">Tabelog home</a>',
      '<a class="list-rst__rst-name-target" href="/tokyo/A1303/A130301/132590/">Sushisho Isseki Sancho</a>',
    ].join(""),
  });
  assert.equal(search.length, 1);
  assert.equal(search[0]?.sourceUrl, "https://tabelog.com/tokyo/A1303/A130301/132590/");
  const enriched = parseTabelogOutletIdentity({
    url: search[0]!.sourceUrl, title: "鮨 尚充", text: "鮨 尚充 03-6427-8577 東京都渋谷区丸山町5-11", html: [
      '<link rel="canonical" href="/tokyo/A1303/A130301/132590/">',
      '<p class="rstinfo-table__address">東京都渋谷区丸山町5-11</p>',
      '<a href="tel:03-6427-8577">03-6427-8577</a>',
    ].join(""),
  }, search[0]!);
  assert.equal(enriched.phone, "03-6427-8577");
  assert.equal(enriched.address, "東京都渋谷区丸山町5-11");
  assert.equal(enriched.sourceEntityId, "tokyo/A1303/A130301/132590");
  assert.deepEqual(resolveTabelogEntity(phoneCandidate, [enriched]), {
    confidence: "HIGH", outlet: enriched, matchedBy: ["EXACT_PHONE"],
  });
});

test("Tabelog slot parser ignores prose times and trusts only explicit available controls", () => {
  const prose = parseTabelogAvailabilitySlots({ url: "https://tabelog.com/x/", title: "x", text: "Dinner starts at 19:00", html: "<p>営業時間 19:00</p>" });
  const controls = parseTabelogAvailabilitySlots({ url: "https://tabelog.com/x/", title: "x", text: "", html: '<button class="slot is-available" data-time="19:00">19:00</button><button class="slot full" data-time="19:30">19:30</button>' });
  assert.deepEqual(prose, { availableSlots: [], hasExplicitSlotUi: false });
  assert.deepEqual(controls, { availableSlots: ["19:00"], hasExplicitSlotUi: true });
});

class FixtureBrowserSession implements BrowserSession {
  readonly metadata = { runtimeProvider: "CLOUDFLARE_BROWSER_RUN" as const, engine: "KITESURF" as const, startedAt: "2026-08-05T09:00:00.000Z" };
  private current = -1;
  constructor(private readonly pages: BrowserSnapshot[]) {}
  async navigate(): Promise<void> { this.current = Math.min(this.current + 1, this.pages.length - 1); }
  async snapshot(): Promise<BrowserSnapshot> { return this.pages[this.current]!; }
  async click(): Promise<void> {}
  async fill(): Promise<void> {}
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> {}
}

test("Tabelog executor grounds a deterministic browser observation and never submits", async () => {
  const pages: BrowserSnapshot[] = [
    { url: "https://tabelog.com/rstLst/?sk=Restaurant", title: "search", text: "Restaurant 1", html: '<a href="https://tabelog.com/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "Restaurant 1", text: "予約 人数 19:00", html: '<select name="party"><option value="2">2</option></select><select name="date"><option value="2026-08-05">2026-08-05</option></select><button class="slot is-available" data-time="19:00">19:00</button><div class="genre">yakiniku</div>' },
  ];
  const browser: BrowserRuntime = { openSession: async () => new FixtureBrowserSession(pages) };
  const adapter = new TabelogBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z");
  const result = await adapter.check({ candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] }, new AbortController().signal);
  assert.equal(result.metadata.route, "GENERIC_BROWSER");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(result.offers.length, 1);
});

test("Tabelog bot challenge and external booking redirect remain non-available results", async () => {
  const makeRuntime = (text: string): BrowserRuntime => ({ openSession: async () => new FixtureBrowserSession([
    { url: "https://tabelog.com/rstLst/", title: "search", text: "Restaurant 1", html: '<a href="https://tabelog.com/tokyo/A1304/A130401/123/" data-address="1-1 Shinjuku, Tokyo">Restaurant 1</a>' },
    { url: "https://tabelog.com/tokyo/A1304/A130401/123/", title: "page", text, html: '<select name="party"></select><select name="date"></select>' },
  ]) });
  const input = { candidateIds: [candidate.restaurant.id], candidates: [candidate], date: fixtureIntent.date, timeWindow: fixtureIntent.timeWindow, partySize: 2, hardCriteria: ["yakiniku"] };
  const challenge = await new TabelogBrowserAvailability(makeRuntime("verify you are human"), () => "2026-08-05T09:00:00.000Z").check(input, new AbortController().signal);
  const redirect = await new TabelogBrowserAvailability(makeRuntime("reservation external TableCheck"), () => "2026-08-05T09:00:00.000Z").check(input, new AbortController().signal);
  assert.equal(challenge.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(redirect.availabilityChecks[candidate.restaurant.id]?.status, "SOURCE_UNSUPPORTED");
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
