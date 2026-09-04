import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { TableCheckBrowserAvailability } from "./tablecheck-browser-availability.js";
import { inspectTableCheckEntity } from "./tablecheck-entity-resolver.js";
import {
  parseTableCheckAvailabilitySlots,
  parseTableCheckOutletIdentityWithEvidence,
  tableCheckGuideUrls,
  tableCheckReservationUrl,
} from "./tablecheck-page-parser.js";

const candidate = {
  ...fixtureCandidates[0]!,
  restaurant: {
    ...fixtureCandidates[0]!.restaurant,
    outletName: "Restaurant 1",
    sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" },
  },
};

class FixtureBrowserSession implements BrowserSession {
  readonly metadata = { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM" as const, engine: "CHROMIUM" as const, startedAt: "2026-08-05T09:00:00.000Z" };
  readonly navigations: string[] = [];
  clicks = 0;
  fills = 0;
  closed = false;
  private current = -1;

  constructor(private readonly pages: BrowserSnapshot[]) {}

  async navigate(url: string): Promise<void> { this.navigations.push(url); this.current = Math.min(this.current + 1, this.pages.length - 1); }
  async snapshot(): Promise<BrowserSnapshot> { return this.pages[this.current]!; }
  async click(): Promise<void> { this.clicks += 1; }
  async fill(): Promise<void> { this.fills += 1; }
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async screenshot(): Promise<Uint8Array> { return new Uint8Array(); }
  async close(): Promise<void> { this.closed = true; }
}

const request = {
  candidateIds: [candidate.restaurant.id],
  candidates: [candidate],
  date: fixtureIntent.date,
  timeWindow: fixtureIntent.timeWindow,
  partySize: fixtureIntent.partySize,
  hardCriteria: ["omakase"],
};

test("TableCheck deterministic guide attempts and reservation URL are read-only hints", () => {
  assert.deepEqual(tableCheckGuideUrls("Sushi Inase"), [
    "https://www.tablecheck.com/en/sushiinase",
    "https://www.tablecheck.com/en/sushi-inase",
  ]);
  assert.equal(
    tableCheckReservationUrl("https://www.tablecheck.com/en/sushiinase", "2026-08-05", 2),
    "https://www.tablecheck.com/en/sushiinase/reserve?start_date=2026-08-05&pax=2",
  );
});

test("TableCheck identity uses exact phone or name and full address, never name alone", () => {
  const snapshot: BrowserSnapshot = {
    url: "https://www.tablecheck.com/en/restaurant1",
    title: "Restaurant 1",
    text: "Restaurant 1\nAddress\n1-1 Shinjuku, Tokyo\nPhone\n03-1111-2222",
    html: [
      '<link rel="canonical" href="/en/restaurant1">',
      '<h1>Restaurant 1</h1>',
      '<p class="address">1-1 Shinjuku, Tokyo</p>',
      '<a href="tel:03-1111-2222">03-1111-2222</a>',
    ].join(""),
  };
  const extraction = parseTableCheckOutletIdentityWithEvidence(snapshot, snapshot.url);
  assert.ok(extraction);
  assert.equal(extraction.fields.address.source, "DOM");
  assert.equal(extraction.fields.phone.source, "TEL_LINK");
  assert.equal(inspectTableCheckEntity(candidate, extraction.outlet).resolution.confidence, "HIGH");
  const { address: _address, phone: _phone, ...nameOnly } = extraction.outlet;
  assert.notEqual(inspectTableCheckEntity(candidate, nameOnly).resolution.confidence, "HIGH");
});

test("TableCheck slot parser ignores prose and accepts only explicitly bookable time controls", () => {
  const prose = parseTableCheckAvailabilitySlots({ url: "https://www.tablecheck.com/en/x/reserve", title: "x", text: "Dinner 19:00", html: "<p>Serving begins at 19:00</p>" });
  const controls = parseTableCheckAvailabilitySlots({
    url: "https://www.tablecheck.com/en/x/reserve", title: "x", text: "", html: [
      '<button class="time-slot is-available" data-time="19:00">19:00</button>',
      '<button class="time-slot" data-time="19:30" aria-disabled="true">19:30</button>',
    ].join(""),
  });
  assert.deepEqual(prose, { availableSlots: [], hasExplicitSlotUi: false });
  assert.deepEqual(controls, { availableSlots: ["19:00"], hasExplicitSlotUi: true });
});

test("TableCheck executor grounds same-outlet identity, requested schedule and explicit slots without booking actions", async () => {
  const session = new FixtureBrowserSession([
    {
      url: "https://www.tablecheck.com/en/restaurant1",
      title: "Restaurant 1 - TableCheck",
      text: "Restaurant 1\nAddress\n1-1 Shinjuku, Tokyo\nPhone\n03-1111-2222",
      html: [
        '<link rel="canonical" href="/en/restaurant1">',
        '<h1>Restaurant 1</h1>',
        '<p class="address">1-1 Shinjuku, Tokyo</p>',
        '<a href="tel:03-1111-2222">03-1111-2222</a>',
      ].join(""),
    },
    {
      url: "https://www.tablecheck.com/en/restaurant1/reserve/landing",
      title: "Restaurant 1 reservation",
      text: "Restaurant 1 2 guest 2026-08-05 19:00 Omakase course",
      html: [
        '<div data-selected-date="2026-08-05" data-pax="2"></div>',
        '<section class="featured-menu">Omakase course</section>',
        '<button class="time-slot is-available" data-time="19:00">19:00</button>',
      ].join(""),
    },
  ]);
  const browser: BrowserRuntime = { openSession: async () => session };
  const result = await new TableCheckBrowserAvailability(browser, () => "2026-08-05T09:00:00.000Z").check(request, new AbortController().signal);
  assert.equal(result.metadata.provider, "TABLECHECK");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(result.offers[0]?.source, "TABLECHECK");
  assert.deepEqual(result.evidence.map((item) => item.kind), ["ENTITY_MATCH", "RESTAURANT_FACT", "AVAILABILITY"]);
  assert.equal(result.evidence.every((item) => item.provider === "TABLECHECK"), true);
  assert.equal(session.navigations.length, 2);
  assert.equal(session.navigations[1]?.includes("start_date=2026-08-05&pax=2"), true);
  assert.equal(session.clicks, 0);
  assert.equal(session.fills, 0);
  assert.equal(session.closed, true);
});

test("TableCheck rejects a same-name page with a conflicting known phone before reading availability", async () => {
  const session = new FixtureBrowserSession([{
    url: "https://www.tablecheck.com/en/restaurant1",
    title: "Restaurant 1 - TableCheck",
    text: "Restaurant 1\nAddress\n1-1 Shinjuku, Tokyo\nPhone\n03-9999-8888",
    html: '<h1>Restaurant 1</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-9999-8888">03-9999-8888</a>',
  }]);
  const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z").check(request, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "ENTITY_MATCH_UNCERTAIN");
  assert.equal(result.offers.length, 0);
  assert.equal(session.navigations.length, 2);
  assert.equal(session.clicks, 0);
});

test("TableCheck public 403 documents are provider-page failures, not outlet identity failures", async () => {
  const diagnostics: unknown[] = [];
  const session = new FixtureBrowserSession([{
    url: "https://www.tablecheck.com/en/restaurant1",
    title: "403 Forbidden",
    text: "403 Forbidden",
    html: "<h1>403 Forbidden</h1>",
  }]);
  const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z", {
    onIdentityDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(request, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "SOURCE_UNSUPPORTED");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_PAGE_UNAVAILABLE");
  const diagnostic = diagnostics[0] as { resolution: { reason: string }; attemptedPages: Array<{ pageUnavailable?: boolean; extracted?: unknown }> };
  assert.equal(diagnostic.resolution.reason, "TABLECHECK_PAGE_UNAVAILABLE");
  assert.equal(diagnostic.attemptedPages.every((page) => page.pageUnavailable === true && page.extracted === undefined), true);
});
