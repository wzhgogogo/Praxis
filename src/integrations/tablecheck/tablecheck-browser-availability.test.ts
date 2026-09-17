import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { TableCheckBrowserAvailability, TableCheckEntryLedger } from "./tablecheck-browser-availability.js";
import { inspectTableCheckEntity } from "./tablecheck-entity-resolver.js";
import {
  inspectTableCheckPageUnavailable,
  hasTableCheckSelectedRequest,
  parseTableCheckAvailabilitySlots,
  parseTableCheckControlAvailability,
  parseTableCheckDiscoveryOutletUrls,
  parseTableCheckOutletIdentityWithEvidence,
  resolveTableCheckReservationTarget,
  tableCheckDiscoveryUrl,
  tableCheckRequestedReservationUrl,
} from "./tablecheck-page-parser.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";

const candidate = {
  ...fixtureCandidates[0]!,
  restaurant: {
    ...fixtureCandidates[0]!.restaurant,
    outletName: "Restaurant 1",
    sourceIds: { ...fixtureCandidates[0]!.restaurant.sourceIds, phone: "03-1111-2222" },
  },
};

test("TableCheck binds a request only to explicit complete date and party control state", () => {
  const snapshot: BrowserSnapshot = {
    url: "https://www.tablecheck.com/en/restaurant1",
    title: "Restaurant 1",
    html: '<div data-selected-date="2026-09-07" data-pax="2"></div>',
    text: "Restaurant 1 Book a table Sep 7th September 2026 Sun Mon Tue Wed Thu Fri Sat 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 2 guests 19:00 Find more availability",
  };
  assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-07", 2), true);
  assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-08", 2), false);
  assert.equal(hasTableCheckSelectedRequest({ ...snapshot, html: '<div data-selected-date="2025-09-07" data-pax="2"></div>' }, "2026-09-07", 2), false);
  assert.equal(hasTableCheckSelectedRequest({ ...snapshot, html: '<div data-selected-date="2026-09-07" data-pax="3"></div>' }, "2026-09-07", 2), false);
  assert.equal(hasTableCheckSelectedRequest({ ...snapshot, html: '<div data-selected-date="2026-09-07"></div><div data-pax="2"></div>' }, "2026-09-07", 2), false);
});

test("TableCheck recognizes its explicit public no-table widget state but not ordinary restaurant prose", () => {
  const noTable: BrowserSnapshot = {
    url: "https://www.tablecheck.com/en/restaurant1", title: "Restaurant 1", html: '<section data-availability-state="empty"></section>',
    text: "Book a table Sep 7th September 2026 2 guests We could not find a table on Sep 7th for the selected mealtime, please try again with another time or day",
  };
  assert.deepEqual(parseTableCheckAvailabilitySlots(noTable), { availableSlots: [], hasExplicitSlotUi: true, explicitlyEmpty: true, queryComplete: true });
  assert.deepEqual(parseTableCheckAvailabilitySlots({ ...noTable, html: "", text: "Restaurant reviews say we could not find a table last year." }), { availableSlots: [], hasExplicitSlotUi: false, explicitlyEmpty: false, queryComplete: false });
});

test("TableCheck does not treat a partial or stale slot list as a completed query result", () => {
  const partial: BrowserSnapshot = {
    url: "https://www.tablecheck.com/en/restaurant1", title: "Restaurant 1",
    html: '<div data-selected-date="2026-09-07" data-pax="2"></div><button class="time-slot is-available" data-time="19:00">19:00</button>',
    text: "Restaurant 1 19:00",
  };
  assert.equal(hasTableCheckSelectedRequest(partial, "2026-09-07", 2), true);
  assert.deepEqual(parseTableCheckAvailabilitySlots(partial), {
    availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: false,
  });
});

test("TableCheck binds a public slot result only when its reservation link carries the exact request", () => {
  const snapshot: BrowserSnapshot = {
    url: "https://www.tablecheck.com/en/restaurant1", title: "Restaurant 1", text: "19:00 19:30",
    html: [
      '<a href="/en/shops/restaurant1/reserve?start_date=2026-09-07&start_time=19:00&num_people=2">19:00</a>',
      '<a href="/en/shops/restaurant1/reserve?start_date=2025-09-07&start_time=19:30&num_people=2">19:30</a>',
      '<a href="/en/shops/other-branch/reserve?start_date=2026-09-07&start_time=19:15&num_people=2">19:15</a>',
    ].join(""),
  };
  assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-07", 2), true);
  assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-07", 3), false);
  assert.deepEqual(parseTableCheckAvailabilitySlots(snapshot, { date: "2026-09-07", partySize: 2 }), {
    availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: true,
  });
  assert.equal(parseTableCheckAvailabilitySlots(snapshot, { date: "2026-09-07", partySize: 2, timeWindow: {earliest:"18:00",latest:"18:30"} }).queryComplete, false,
    "links for another mealtime do not complete the requested availability window");
});

test("TableCheck reads the same exact request binding from live DOM controls when hydration omits it from HTML", () => {
  assert.deepEqual(parseTableCheckControlAvailability([
    { id: "slot", stableKey: "slot", kind: "LINK", role: "link", label: "19:00", href: "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2026-09-07&start_time=19:00&num_people=2", disabled: false, visible: true },
    { id: "stale", stableKey: "stale", kind: "LINK", role: "link", label: "19:30", href: "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2025-09-07&start_time=19:30&num_people=2", disabled: false, visible: true },
    { id: "other", stableKey: "other", kind: "LINK", role: "link", label: "19:15", href: "https://www.tablecheck.com/en/shops/other-branch/reserve?start_date=2026-09-07&start_time=19:15&num_people=2", disabled: false, visible: true },
  ], "2026-09-07", 2, "https://www.tablecheck.com/en/restaurant1", {earliest:"19:00",latest:"19:00"}), {
    availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: true,
  });
});

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
  async observeControls(): Promise<BrowserPageControl[]> {
    const page = this.pages[this.current]!;
    const controls: BrowserPageControl[] = [];
    for (const match of page.html.matchAll(/<(a|button|input|select)\b([^>]*)>([^<]*)/gi)) {
      const tag = match[1]!.toLowerCase(); const attrs = match[2] ?? ""; const label = (match[3] ?? attrs.match(/aria-label=["']([^"']+)/i)?.[1] ?? "").trim();
      const value = attrs.match(/(?:data-date|data-value|value)=["']([^"']+)/i)?.[1]; const href = attrs.match(/href=["']([^"']+)/i)?.[1]; const type = attrs.match(/type=["']([^"']+)/i)?.[1];
      controls.push({ id: `fixture:${this.current}:${controls.length}`, stableKey: `${tag}|${attrs}`, kind: tag === "a" ? "LINK" : tag === "select" ? "SELECT" : tag === "input" ? "INPUT" : "BUTTON", role: tag === "a" ? "link" : tag === "button" ? "button" : tag, label, ...(value ? { value } : {}), ...(href ? { href: new URL(href, page.url).toString() } : {}), ...(attrs.match(/formmethod=["']post/i) ? { formMethod: "POST" as const } : attrs.match(/formmethod=["']get/i) ? { formMethod: "GET" as const } : {}), ...(type ? { type } : {}), disabled: /disabled|aria-disabled=["']true/i.test(attrs), visible: true });
    }
    return controls;
  }
  async click(): Promise<void> { this.clicks += 1; this.current = Math.min(this.current + 1, this.pages.length - 1); }
  async fill(): Promise<void> { this.fills += 1; }
  async select(_target: string, value: string): Promise<string[]> { return [value]; }
  async waitFor(): Promise<void> {}
  async waitForChange(): Promise<boolean> { return true; }
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

test("TableCheck discovers public guide pages by restaurant name and coordinates, never by slug guessing", () => {
  const searchCandidate = { ...candidate, restaurant: { ...candidate.restaurant, outletName: "Sushi Inase", coordinates: { lat: 35.6555319, lng: 139.705986 } } };
  const url = new URL(tableCheckDiscoveryUrl(searchCandidate));
  assert.equal(url.pathname, "/en/japan/search");
  assert.equal(url.searchParams.get("search_text"), "Sushi Inase");
  assert.equal(url.searchParams.get("geo_latitude"), "35.6555319");
  const snapshot: BrowserSnapshot = {
    url: url.toString(), title: "Map Search - Japan", text: "50+ venues found",
    html: [
      '<a href="/en/sushiinase?search_text=Sushi+Inase">Sushi Inase</a>',
      '<a href="/en/sushiinase-shinjuku?search_text=Sushi+Inase">Shinjuku Sushi Inase</a>',
      '<a href="/en/sushiinase/reserve/landing?start_date=2026-08-06">9/6</a>',
    ].join(""),
  };
  assert.deepEqual(parseTableCheckDiscoveryOutletUrls(snapshot, "Sushi Inase"), [
    "https://www.tablecheck.com/en/sushiinase",
    "https://www.tablecheck.com/en/sushiinase-shinjuku",
  ]);
});

test("TableCheck resolves a real linked reservation page and only sets read parameters", () => {
  const outlet = { sourceEntityId: "restaurant1", sourceUrl: "https://www.tablecheck.com/en/restaurant1", outletName: "Restaurant 1" };
  const target = resolveTableCheckReservationTarget({
    url: outlet.sourceUrl, title: "Restaurant 1", text: "Book a table",
    html: '<a href="/en/restaurant1/reserve/landing?utm_source=tablecheck_portal">Book a table</a>',
  }, outlet);
  assert.deepEqual(target, { kind: "LINKED_PAGE", url: "https://www.tablecheck.com/en/restaurant1/reserve/landing?utm_source=tablecheck_portal" });
  assert.equal(
    tableCheckRequestedReservationUrl(target!, "2026-08-05", 2),
    "https://www.tablecheck.com/en/restaurant1/reserve/landing?utm_source=tablecheck_portal&start_date=2026-08-05&pax=2",
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
      '<a href="tel:+81-3-1111-2222">+81-3-1111-2222</a>',
    ].join(""),
  };
  const extraction = parseTableCheckOutletIdentityWithEvidence(snapshot, snapshot.url);
  assert.ok(extraction);
  assert.equal(extraction.fields.address.source, "DOM");
  assert.equal(extraction.fields.phone.source, "TEL_LINK");
  assert.equal(extraction.fields.phone.normalizedValue, "0311112222");
  assert.equal(inspectTableCheckEntity(candidate, extraction.outlet).resolution.confidence, "HIGH");
  const { phone: _knownPhone, ...withoutPhone } = extraction.outlet;
  assert.equal(inspectTableCheckEntity(candidate, withoutPhone).resolution.confidence, "HIGH");
  const { address: _address, phone: _phone, ...nameOnly } = extraction.outlet;
  assert.notEqual(inspectTableCheckEntity(candidate, nameOnly).resolution.confidence, "HIGH");
});

test("TableCheck keeps phone disagreement diagnostic but accepts a complete same outlet and rejects a branch", () => {
  const sameOutlet = inspectTableCheckEntity(candidate, {
    sourceEntityId: "same", sourceUrl: "https://www.tablecheck.com/en/restaurant1", outletName: "Restaurant 1", address: "1-1 Shinjuku, Tokyo", phone: "03-9999-8888",
  });
  const otherBranch = inspectTableCheckEntity(candidate, {
    sourceEntityId: "other", sourceUrl: "https://www.tablecheck.com/en/restaurant1-annex", outletName: "Restaurant 1", address: "1-2 Shinjuku, Tokyo", phone: "03-9999-8888",
  });
  assert.equal(sameOutlet.resolution.confidence, "HIGH");
  assert.equal(sameOutlet.comparison.phone, "CONFLICT");
  assert.equal(otherBranch.resolution.confidence, "MEDIUM");
  assert.equal(otherBranch.comparison.address, "CONFLICT");
});

test("TableCheck blocks HIGH identity for a stated floor conflict or a shared phone at a distinct branch", () => {
  const scoped = {
    ...candidate,
    restaurant: { ...candidate.restaurant, outletName: "Sushi Hajime", address: "〒150-0002 東京都渋谷区渋谷3-15-5 B1F", sourceIds: { ...candidate.restaurant.sourceIds, phone: "03-6419-7621" } },
  };
  for (const outlet of [
    { sourceEntityId: "floor", sourceUrl: "https://www.tablecheck.com/en/floor", outletName: "Sushi Hajime", address: "〒150-0002 東京都渋谷区渋谷3-15-5 1F", phone: "03-6419-7621" },
    { sourceEntityId: "branch", sourceUrl: "https://www.tablecheck.com/en/branch", outletName: "Sushi Hajime", address: "〒106-0032 東京都港区六本木6-1-5 1F", phone: "03-6419-7621" },
  ]) {
    const inspection = inspectTableCheckEntity(scoped, outlet);
    assert.notEqual(inspection.resolution.confidence, "HIGH");
    assert.equal(inspection.comparison.address, "CONFLICT");
  }
  assert.equal(inspectTableCheckEntity({ ...scoped, restaurant: { ...scoped.restaurant, address: "〒150-0002 1F" } }, {
    sourceEntityId: "incomplete", sourceUrl: "https://www.tablecheck.com/en/incomplete", outletName: "Sushi Hajime", address: "1500002 1F",
  }).comparison.address, "INSUFFICIENT");
});

test("TableCheck treats historical Japanese and Latin floor forms as the same stated unit", () => {
  // Historical extracted address/name fields, not a page replay. Deliberately
  // omit source phones: HIGH must come from the address rule being wired in.
  const historicalPairs = [
    {
      outletName: "Sushi Inase",
      googleAddress: "Japan, 〒150-0002 Tokyo, Shibuya, 3-chōme−15−５ 地下1階",
      sourceAddress: "150-0002 Tokyo Shibuya 3-15-5 Shibuya Gleam Bldg. B1F",
    },
    {
      outletName: "Shibuya Namikibashi Sushi Hajime",
      googleAddress: "Japan, 〒150-0002 Tokyo, Shibuya, 3-chōme−15−５ グリームビル 地下1階",
      sourceAddress: "150-0002 Tokyo Shibuya 3-15-5 Shibuya Gleam Bldg. B1F",
      sourceName: "Namikibashi Sushihajime",
    },
    {
      outletName: "Sushi Teppen(Shibuya)",
      googleAddress: "Japan, 〒150-0042 Tokyo, Shibuya, Udagawachō, 42−４ ワイリービル 2階",
      sourceAddress: "150-0042 Tokyo Shibuya Udagawa-cho 42-4 Building 2F",
      sourceName: "Sushi Teppen",
    },
    {
      outletName: "Shibuya Sushi Labo",
      googleAddress: "Japan, 〒150-0002 Tokyo, Shibuya, 1-chōme−6−４ 1階",
      sourceAddress: "150-0002 Tokyo Shibuya-ku 1-6-4 Shibuya Seiko Building 1F",
      sourceName: "Shibuya Sushi Lab",
    },
    {
      outletName: "Sushisho Isseki Sancho",
      googleAddress: "Japan, 〒150-0044 Tokyo, Shibuya, Maruyamachō, 5−１１ 2F",
      sourceAddress: "150-0044 Tokyo Shibuya Ward 5-11, Maruyama-cho 2F",
      sourceName: "Sushisho Issekisancho",
    },
    {
      outletName: "Matsue Shibuya Scramble Square Store",
      googleAddress: "Japan, 〒150-6101 Tokyo, Shibuya, 2-chōme−24−１２ スクランブルスクエア 12F",
      sourceAddress: "150-6101 Tokyo Shibuya-ku 2-24-12 Shibuya 12F, SHIBUYA SCRAMBLE SQUARE,",
      sourceName: "Matsue Shibuya Scramble Square",
    },
    {
      outletName: "Shibuya Sushi Ajuuta",
      googleAddress: "Japan, 〒150-0042 Tokyo, Shibuya, Udagawachō, 37−１５ ARISTO渋谷 B1F",
      sourceAddress: "150-0042 Tokyo Shibuya 37-15 Udagawa-cho ARISTO Shibuya B1F",
      sourceName: "Ajuuta",
    },
  ];
  for (const [index, pair] of historicalPairs.entries()) {
    const scoped = {
      ...candidate,
      restaurant: {
        ...candidate.restaurant,
        id: `historical-floor-${index}`,
        outletName: pair.outletName,
        address: pair.googleAddress,
        sourceIds: { ...candidate.restaurant.sourceIds },
      },
    };
    const inspection = inspectTableCheckEntity(scoped, {
      sourceEntityId: `historical-${index}`,
      sourceUrl: `https://www.tablecheck.com/en/historical-${index}`,
      outletName: pair.sourceName ?? pair.outletName,
      address: pair.sourceAddress,
    });
    assert.equal(inspection.comparison.address, "MATCH", pair.outletName);
    assert.equal(inspection.resolution.confidence, "HIGH", pair.outletName);
    assert.equal(inspection.reason, "HIGH_NAME_AND_ADDRESS", pair.outletName);
  }
  const missingUnit = inspectTableCheckEntity({
    ...candidate,
    restaurant: {
      ...candidate.restaurant,
      outletName: "Sushi Inase",
      address: historicalPairs[0]!.googleAddress,
      sourceIds: { ...candidate.restaurant.sourceIds },
    },
  }, {
    sourceEntityId: "historical-no-unit",
    sourceUrl: "https://www.tablecheck.com/en/historical-no-unit",
    outletName: "Sushi Inase",
    address: "150-0002 Tokyo Shibuya 3-15-5 Shibuya Gleam Bldg.",
  });
  assert.equal(missingUnit.comparison.address, "MATCH", "a missing unit is not an invented floor conflict");
  assert.equal(missingUnit.resolution.confidence, "HIGH");
});

test("TableCheck accepts cross-script complete addresses only with matching postal and unit sequence", () => {
  const internationalCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, address: "Japan 〒160-0022 Tokyo Shinjuku 1-1 2F" },
  };
  const sameOutlet = inspectTableCheckEntity(internationalCandidate, {
    sourceEntityId: "same", sourceUrl: "https://www.tablecheck.com/en/restaurant1", outletName: "Restaurant 1", address: "〒1600022 東京都新宿区 1-1 2Ｆ",
  });
  const sameMallOtherFloor = inspectTableCheckEntity(internationalCandidate, {
    sourceEntityId: "other-floor", sourceUrl: "https://www.tablecheck.com/en/restaurant1-3f", outletName: "Restaurant 1", address: "〒160-0022 東京都新宿区 1-1 3F",
  });
  assert.equal(sameOutlet.resolution.confidence, "HIGH");
  assert.equal(sameMallOtherFloor.resolution.confidence, "MEDIUM");
});

test("TableCheck slot parser ignores prose and accepts only explicitly bookable time controls", () => {
  const prose = parseTableCheckAvailabilitySlots({ url: "https://www.tablecheck.com/en/x/reserve", title: "x", text: "Dinner 19:00", html: "<p>Serving begins at 19:00</p>" });
  const controls = parseTableCheckAvailabilitySlots({
    url: "https://www.tablecheck.com/en/x/reserve", title: "x", text: "", html: [
      '<button class="time-slot is-available" data-time="19:00">19:00</button>',
      '<button class="time-slot" data-time="19:30" aria-disabled="true">19:30</button>',
    ].join(""),
  });
  assert.deepEqual(prose, { availableSlots: [], hasExplicitSlotUi: false, explicitlyEmpty: false, queryComplete: false });
  assert.deepEqual(controls, { availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: false });
});

function discoveryPage(...links: Array<{ href: string; text: string }>): BrowserSnapshot {
  return {
    url: "https://www.tablecheck.com/en/japan/search?search_text=Restaurant+1", title: "Map Search - Japan", text: "50+ venues found",
    html: links.map((link) => `<a href="${link.href}">${link.text}</a>`).join(""),
  };
}

function matchingOutletPage(url = "https://www.tablecheck.com/en/restaurant1"): BrowserSnapshot {
  return {
    url,
    title: "Restaurant 1 - TableCheck",
    text: "Restaurant 1\nAddress\n1-1 Shinjuku, Tokyo\nPhone\n03-1111-2222",
    html: [
      '<link rel="canonical" href="/en/restaurant1">',
      '<h1>Restaurant 1</h1>',
      '<p class="address">1-1 Shinjuku, Tokyo</p>',
      '<a href="tel:03-1111-2222">03-1111-2222</a>',
      '<a href="/en/restaurant1/reserve/landing?utm_source=tablecheck_portal">Book a table</a>',
    ].join(""),
  };
}

test("TableCheck executor grounds a discovered same-outlet page and real linked reservation page without booking actions", async () => {
  const session = new FixtureBrowserSession([
    discoveryPage({ href: "/en/restaurant1?search_text=Restaurant+1", text: "Restaurant 1" }),
    matchingOutletPage(),
    {
      url: "https://www.tablecheck.com/en/restaurant1/reserve/landing",
      title: "Restaurant 1 reservation",
      text: "Restaurant 1 2 guest 2026-08-05 19:00 Omakase course",
      html: [
        '<div data-selected-date="2026-08-05" data-pax="2"></div>',
        '<section class="featured-menu">Omakase course</section>',
        '<section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>',
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
  assert.equal(session.navigations.length, 3);
  assert.equal(session.navigations[0]?.includes("/en/japan/search?"), true);
  assert.equal(session.navigations[1], "https://www.tablecheck.com/en/restaurant1");
  assert.equal(session.navigations[2]?.includes("start_date=2026-08-05&pax=2"), true);
  assert.equal(session.clicks, 0);
  assert.equal(session.fills, 0);
  assert.equal(session.closed, true);
});

test("TableCheck reads a Google-listed merchant page through the same identity gate before using discovery results", async () => {
  const listedCandidate = {
    ...candidate,
    restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, googleWebsiteUri: "https://www.tablecheck.com/en/restaurant1?campaign=google" } },
  };
  const session = new FixtureBrowserSession([
    matchingOutletPage(),
    matchingOutletPage(),
    {
      url: "https://www.tablecheck.com/en/restaurant1/reserve/landing", title: "Restaurant 1 reservation", text: "Restaurant 1 2 guest 2026-08-05 19:00",
      html: '<div data-selected-date="2026-08-05" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>',
    },
  ]);
  const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z").check(
    { ...request, candidateIds: [listedCandidate.restaurant.id], candidates: [listedCandidate] }, new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[listedCandidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(session.navigations[0], "https://www.tablecheck.com/en/restaurant1");
  assert.equal(session.navigations.some((url) => url.includes("/japan/search")), false);
});

test("TableCheck validates each Google link field so Maps or an invalid lead cannot hide a public merchant website", async () => {
  for (const sourceIds of [
    {
      googleMapsUri: "https://www.google.com/maps/search/?api=1&query_place_id=abc",
      googleWebsiteUri: "https://www.tablecheck.com/en/restaurant1?campaign=google",
    },
    {
      googleListedTableCheckUri: "https://example.invalid/not-tablecheck",
      googleMapsUri: "https://www.google.com/maps/search/?api=1&query_place_id=abc",
      googleWebsiteUri: "https://www.tablecheck.com/en/restaurant1?campaign=google",
    },
  ]) {
    const listedCandidate = {
      ...candidate,
      restaurant: { ...candidate.restaurant, sourceIds: { ...candidate.restaurant.sourceIds, ...sourceIds } },
    };
    const session = new FixtureBrowserSession([
      matchingOutletPage(),
      matchingOutletPage(),
      {
        url: "https://www.tablecheck.com/en/restaurant1/reserve/landing", title: "Restaurant 1 reservation", text: "Restaurant 1 2 guest 2026-08-05 19:00",
        html: '<div data-selected-date="2026-08-05" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>',
      },
    ]);
    const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z").check(
      { ...request, candidateIds: [listedCandidate.restaurant.id], candidates: [listedCandidate] }, new AbortController().signal,
    );
    assert.equal(result.availabilityChecks[listedCandidate.restaurant.id]?.status, "AVAILABLE");
    assert.equal(session.navigations[0], "https://www.tablecheck.com/en/restaurant1");
    assert.equal(session.navigations.some((url) => url.includes("/japan/search")), false);
  }
});

test("TableCheck keeps an immediate non-slot UNKNOWN rather than treating nearby cards as no matching table", async () => {
  const session = new FixtureBrowserSession([
    discoveryPage({ href: "/en/restaurant1?search_text=Restaurant+1", text: "Restaurant 1" }),
    matchingOutletPage(),
    {
      url: "https://www.tablecheck.com/en/restaurant1/reserve/landing", title: "Restaurant 1 reservation", text: "Restaurant 1 2 guest 2026-08-05 12:00 12:30",
      html: '<div data-selected-date="2026-08-05" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="12:00">12:00</button><button class="time-slot is-available" data-time="12:30">12:30</button></section>',
    },
  ]);
  const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:30.000Z").check({
    ...request, timeWindow: { earliest: "12:08", latest: "12:08" },
    immediateAvailability: { validUntil: "2026-08-05T09:01:00.000Z", sourceSlotPolicy: "EXACT_ONLY" },
  }, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "IMMEDIATE_SLOT_NOT_OFFERED");
  assert.equal(result.offers.length, 0);
});

test("TableCheck reuses a verified outlet entry only after independently matching a second candidate", async () => {
  const alias = { ...candidate, restaurant: { ...candidate.restaurant, id: "fixture-restaurant-1-alias" } };
  const reservation = {
    url: "https://www.tablecheck.com/en/restaurant1/reserve/landing", title: "Restaurant 1 reservation", text: "Restaurant 1 2 guest 2026-08-05 19:00",
    html: '<div data-selected-date="2026-08-05" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>',
  };
  const first = new FixtureBrowserSession([discoveryPage({ href: "/en/restaurant1?search_text=Restaurant+1", text: "Restaurant 1" }), matchingOutletPage(), reservation]);
  const second = new FixtureBrowserSession([discoveryPage(), matchingOutletPage(), reservation]);
  let opens = 0;
  const result = await new TableCheckBrowserAvailability({ openSession: async () => [first, second][opens++]! }, () => "2026-08-05T09:00:00.000Z", { entryLedger: new TableCheckEntryLedger() }).check(
    { ...request, candidateIds: [candidate.restaurant.id, alias.restaurant.id], candidates: [candidate, alias] }, new AbortController().signal,
  );
  assert.equal(result.availabilityChecks[alias.restaurant.id]?.status, "AVAILABLE");
  assert.equal(second.navigations[1], "https://www.tablecheck.com/en/restaurant1");
  assert.notEqual(result.evidence.find((item) => item.candidateId === alias.restaurant.id && item.kind === "AVAILABILITY")?.candidateId, candidate.restaurant.id);
});

test("TableCheck does not let an unrelated run entry suppress the current candidate's required discovery", async () => {
  const ledger = new TableCheckEntryLedger();
  ledger.observe("https://www.tablecheck.com/en/previous-matsue");
  const session = new FixtureBrowserSession([
    { url: "https://www.tablecheck.com/en/japan/search?search_text=Restaurant+1", title: "Map Search", text: "Search restaurants", html: '<button id="show" data-praxis-read-only="true">Show results</button>' },
    discoveryPage({ href: "/en/restaurant1?search_text=Restaurant+1", text: "Restaurant 1" }),
    matchingOutletPage(),
    { url: "https://www.tablecheck.com/en/restaurant1/reserve/landing", title: "Restaurant 1 reservation", text: "Restaurant 1 2 guest 2026-08-05 19:00", html: '<div data-selected-date="2026-08-05" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>' },
  ]);
  let modelCalls = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    modelDecision: { async decide(input) {
      modelCalls += 1;
      const target = input.observation.targets.find((item) => item.label === "Show results");
      assert.ok(target);
      return { type: "CLICK", targetRef: target.ref, reason: "Reveal current candidate's observed public results." };
    } },
  });
  try {
    const result = await new TableCheckBrowserAvailability(executor, () => "2026-08-05T09:00:00.000Z", { entryLedger: ledger }).check(request, new AbortController().signal);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
    assert.equal(modelCalls, 1);
    assert.equal(session.navigations.includes("https://www.tablecheck.com/en/previous-matsue"), false);
  } finally {
    await executor.close();
  }
});

test("TableCheck continues in one session when the standard method is incomplete and accepts slots only after model actions visibly confirm date and party", async () => {
  const session = new FixtureBrowserSession([
    discoveryPage({ href: "/en/restaurant1?search_text=Restaurant+1", text: "Restaurant 1" }),
    {
      url: "https://www.tablecheck.com/en/restaurant1", title: "Restaurant 1 availability", text: "Restaurant 1 Choose party size",
      html: '<div data-testid="Venue Availability"></div><h1>Restaurant 1</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">03-1111-2222</a><button id="party" data-praxis-read-only="true">2 guests</button>',
    },
    {
      url: "https://www.tablecheck.com/en/restaurant1", title: "Restaurant 1 availability", text: "Restaurant 1 Choose date",
      html: '<div data-testid="Venue Availability"></div><h1>Restaurant 1</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">03-1111-2222</a><button id="date" data-praxis-read-only="true">2026-08-05</button>',
    },
    {
      url: "https://www.tablecheck.com/en/restaurant1", title: "Restaurant 1 availability", text: "Restaurant 1 2 guests Aug 5 2026",
      html: '<div data-testid="Venue Availability" data-selected-date="2026-08-05" data-pax="2"></div><h1>Restaurant 1</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">03-1111-2222</a><section class="featured-menu">Omakase course</section><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>',
    },
  ]);
  let modelCalls = 0;
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    modelDecision: {
      async decide(input) {
        modelCalls += 1;
        assert.match(input.skills.generic, /re-observe/);
        assert.match(input.skills.source, /TableCheck/);
        const wanted = modelCalls === 1 ? "2 guests" : "2026-08-05";
        const target = input.observation.targets.find((item) => item.label === wanted);
        assert.ok(target);
        return { type: "CLICK", targetRef: target.ref, reason: `Set authoritative ${modelCalls === 1 ? "party" : "date"} through observed control` };
      },
    },
  });
  const result = await new TableCheckBrowserAvailability(executor, () => "2026-08-05T09:00:00.000Z").check(request, new AbortController().signal);
  assert.equal(modelCalls, 2);
  assert.equal(session.clicks, 2);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.match(result.offers[0]?.dateTime ?? "", /T19:00/);
  await executor.close();
});

test("TableCheck continues in the same session from confirmed conditions to an explicitly marked slot UI", async () => {
  const session = new FixtureBrowserSession([
    discoveryPage({ href: "/en/restaurant1?search_text=Restaurant+1", text: "Restaurant 1" }),
    {
      url: "https://www.tablecheck.com/en/restaurant1", title: "Restaurant 1 availability",
      text: "Restaurant 1 Book a table Aug 5th August 2026 Sun Mon Tue Wed Thu Fri Sat 1 2 3 4 5 2 guests 19:00 Find more availability",
      html: '<div data-testid="Venue Availability"></div><h1>Restaurant 1</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">03-1111-2222</a><button id="more" formmethod="get">Find more availability</button>',
    },
    {
      url: "https://www.tablecheck.com/en/restaurant1", title: "Restaurant 1 availability",
      text: "Restaurant 1 Book a table Aug 5th 2 guests 19:00",
      html: '<div data-testid="Venue Availability" data-selected-date="2026-08-05" data-pax="2"></div><h1>Restaurant 1</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-1111-2222">03-1111-2222</a><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>',
    },
  ]);
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    modelDecision: {
      async decide(input) {
        const target = input.observation.targets.find((item) => item.label === "Find more availability");
        assert.ok(target);
        return { type: "CLICK", targetRef: target.ref, reason: "Reveal the public slot controls." };
      },
    },
  });
  const result = await new TableCheckBrowserAvailability(executor, () => "2026-08-05T09:00:00.000Z").check(request, new AbortController().signal);
  assert.equal(session.clicks, 1);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  await executor.close();
});

test("TableCheck uses the one exact-phone outlet among multiple discovered same-name pages", async () => {
  const session = new FixtureBrowserSession([
    discoveryPage(
      { href: "/en/restaurant1-other?search_text=Restaurant+1", text: "Restaurant 1 Midtown" },
      { href: "/en/restaurant1?search_text=Restaurant+1", text: "Restaurant 1" },
    ),
    {
      url: "https://www.tablecheck.com/en/restaurant1-other",
      title: "Restaurant 1 Midtown - TableCheck",
      text: "Restaurant 1\nAddress\n1-1 Shinjuku, Tokyo\nPhone\n03-9999-8888",
      html: '<h1>Restaurant 1</h1><p class="address">1-1 Shinjuku, Tokyo</p><a href="tel:03-9999-8888">03-9999-8888</a>',
    },
    matchingOutletPage(),
    {
      url: "https://www.tablecheck.com/en/restaurant1/reserve/landing",
      title: "Restaurant 1 reservation",
      text: "Restaurant 1 2 guest 2026-08-05 19:00 Omakase course",
      html: '<div data-selected-date="2026-08-05" data-pax="2"></div><section class="featured-menu">Omakase course</section><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>',
    },
  ]);
  const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z").check(request, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.deepEqual(session.navigations.slice(1, 3), [
    "https://www.tablecheck.com/en/restaurant1-other",
    "https://www.tablecheck.com/en/restaurant1",
  ]);
});

test("TableCheck fails closed when discovered same-name branches have no HIGH identity evidence", async () => {
  const diagnostics: unknown[] = [];
  const session = new FixtureBrowserSession([
    discoveryPage(
      { href: "/en/restaurant1-east?search_text=Restaurant+1", text: "Restaurant 1 East" },
      { href: "/en/restaurant1-west?search_text=Restaurant+1", text: "Restaurant 1 West" },
    ),
    {
      url: "https://www.tablecheck.com/en/restaurant1-east",
      title: "Restaurant 1 East - TableCheck",
      text: "Restaurant 1",
      html: "<h1>Restaurant 1</h1>",
    },
    {
      url: "https://www.tablecheck.com/en/restaurant1-west",
      title: "Restaurant 1 West - TableCheck",
      text: "Restaurant 1",
      html: "<h1>Restaurant 1</h1>",
    },
  ]);
  const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z", {
    onIdentityDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(request, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_ENTITY_MATCH_UNCERTAIN");
  assert.equal(result.offers.length, 0);
  const diagnostic = diagnostics[0] as { discovery: { discoveredOutletUrls: string[] }; resolution: { reason: string } };
  assert.equal(diagnostic.discovery.discoveredOutletUrls.length, 2);
  assert.equal(diagnostic.resolution.reason, "TABLECHECK_ENTITY_MATCH_UNCERTAIN");
  assert.equal(session.clicks, 0);
});

test("TableCheck discovery distinguishes a public no-result page from parser failure", async () => {
  const diagnostics: unknown[] = [];
  const session = new FixtureBrowserSession([{
    url: "https://www.tablecheck.com/en/japan/search?search_text=Restaurant+1",
    title: "Map Search - Japan",
    text: "No venues found",
    html: "<main>No venues found</main>",
  }]);
  const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z", {
    onIdentityDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(request, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_DISCOVERY_NO_RESULT");
  const diagnostic = diagnostics[0] as { discovery: { status: string }; resolution: { reason: string } };
  assert.equal(diagnostic.discovery.status, "NO_RESULT");
  assert.equal(diagnostic.resolution.reason, "TABLECHECK_DISCOVERY_NO_RESULT");
});

test("TableCheck error-page classification does not treat normal result copy or numbers as an unavailable document", () => {
  const normal = inspectTableCheckPageUnavailable({
    url: "https://www.tablecheck.com/en/japan/search", title: "Map Search - Japan",
    text: "404 restaurants were reviewed; a venue was not found in one past search.",
    html: "<h1>Map Search - Japan</h1><p>404 restaurants were reviewed; a venue was not found in one past search.</p>",
  });
  assert.equal(normal.pageUnavailable, false);
  assert.deepEqual(normal.matchedSignals, []);
  const error = inspectTableCheckPageUnavailable({
    url: "https://www.tablecheck.com/en/japan/search", title: "404 Not Found",
    text: "Try again later", html: "<h1>404 Not Found</h1>",
  });
  assert.equal(error.pageUnavailable, true);
  assert.deepEqual(error.matchedSignals, [
    { source: "TITLE", value: "404 Not Found" },
    { source: "PRIMARY_HEADING", value: "404 Not Found" },
  ]);
});

test("TableCheck hands an extractable-search gap to the model in the same session and verifies the resulting observation", async () => {
  const session = new FixtureBrowserSession([
    {
      url: "https://www.tablecheck.com/en/japan/search?search_text=Restaurant+1", title: "Map Search - Japan", text: "Search restaurants",
      html: '<button id="show" data-praxis-read-only="true">Show results</button>',
    },
    discoveryPage({ href: "/en/restaurant1?search_text=Restaurant+1", text: "Restaurant 1" }),
    matchingOutletPage(),
    {
      url: "https://www.tablecheck.com/en/restaurant1/reserve/landing", title: "Restaurant 1 reservation",
      text: "Restaurant 1 2 guest 2026-08-05 19:00 Omakase course",
      html: '<div data-selected-date="2026-08-05" data-pax="2"></div><section class="featured-menu">Omakase course</section><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>',
    },
  ]);
  const diagnostics: BrowserExecutionDiagnostic[] = [];
  let decisions = 0;
  const modelDecision: BrowserReadActionDecisionPort = {
    async decide(input) {
      decisions += 1;
      if (decisions === 1) {
        const target = input.observation.targets.find((item) => item.label === "Show results");
        assert.ok(target);
        return { type: "CLICK", targetRef: target.ref, reason: "Reveal observed public results" };
      }
      return { type: "COMPLETE", reason: "A deterministic parser can inspect the observed result link" };
    },
  };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { modelDecision, onDiagnostic: (item) => diagnostics.push(item) });
  const result = await new TableCheckBrowserAvailability(executor, () => "2026-08-05T09:00:00.000Z").check(request, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(session.clicks, 1);
  assert.equal(diagnostics.filter((item) => item.event === "SESSION_OPENED").length, 1);
  const handoff = diagnostics.find((item) => item.event === "SKILL_STARTED");
  assert.equal(handoff?.detail, "TableCheck discovery has no extractable public outlet link yet.");
  assert.equal(handoff?.observation?.targets[0]?.label, "Show results");
  assert.match(diagnostics.find((item) => item.event === "MODEL_ACTION")?.detail ?? "", /CLICK/);
  assert.equal(diagnostics.some((item) => item.event === "POST_ACTION_VERIFIED"), true);
  await executor.close();
  assert.equal(session.closed, true);
});

test("TableCheck classifies exhausted recoverable discovery separately from an unavailable provider page", async () => {
  const session = new FixtureBrowserSession([{
    url: "https://www.tablecheck.com/en/japan/search?search_text=Restaurant+1", title: "Map Search - Japan", text: "Search restaurants", html: "<main>Search restaurants</main>",
  }]);
  const identityDiagnostics: unknown[] = [];
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, {
    modelDecision: { async decide() { return { type: "REQUEST_HUMAN_HELP", reason: "No observed public result target" }; } },
  });
  const result = await new TableCheckBrowserAvailability(executor, () => "2026-08-05T09:00:00.000Z", {
    onIdentityDiagnostic: (diagnostic) => identityDiagnostics.push(diagnostic),
  }).check(request, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_DISCOVERY_INCOMPLETE");
  const diagnostic = identityDiagnostics[0] as { discovery: { status: string; handoff?: { outcome: string } }; resolution: { reason: string } };
  assert.equal(diagnostic.discovery.status, "EXPLORATION_EXHAUSTED");
  assert.equal(diagnostic.discovery.handoff?.outcome, "REQUESTED_HUMAN_HELP");
  assert.equal(diagnostic.resolution.reason, "TABLECHECK_DISCOVERY_INCOMPLETE");
  await executor.close();
});

test("TableCheck discovery 403 documents are provider-page failures, not outlet identity failures", async () => {
  const diagnostics: unknown[] = [];
  const session = new FixtureBrowserSession([{
    url: "https://www.tablecheck.com/en/japan/search?search_text=Restaurant+1",
    title: "403 Forbidden",
    text: "403 Forbidden",
    html: "<h1>403 Forbidden</h1>",
  }]);
  const result = await new TableCheckBrowserAvailability({ openSession: async () => session }, () => "2026-08-05T09:00:00.000Z", {
    onIdentityDiagnostic: (diagnostic) => diagnostics.push(diagnostic),
  }).check(request, new AbortController().signal);
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "SOURCE_UNSUPPORTED");
  assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "TABLECHECK_PAGE_UNAVAILABLE");
  const diagnostic = diagnostics[0] as { discovery: { status: string }; resolution: { reason: string }; attemptedPages: Array<{ pageUnavailable?: boolean; extracted?: unknown }> };
  assert.equal(diagnostic.discovery.status, "PAGE_UNAVAILABLE");
  assert.equal(diagnostic.resolution.reason, "TABLECHECK_PAGE_UNAVAILABLE");
  assert.equal(diagnostic.attemptedPages.length, 0);
});

test("public query permission requires the observed source dialog and control structure", async () => {
  const { permitsTableCheckQueryControl } = await import("./tablecheck-public-query.js");
  const snapshot = { url: "https://www.tablecheck.com/en/japan/search", title: "Search", text: "", html: "" };
  const control = { id: "observed", stableKey: "observed", kind: "CHECKBOX" as const, role: "checkbox", label: "Sushi", type: "checkbox", visible: true, disabled: false, structure: { tag: "INPUT", name: "cuisines", classes: ["checkbox"], dialogLabel: "Cuisine", formClass: "Form_f1pf9bb6", sliderCount: 0 } };
  assert.equal(permitsTableCheckQueryControl({ control, snapshot, action: "SET_CHECKED" }), true);
  const { structure: _structure, ...withoutStructure } = control;
  for (const rejected of [
    { ...control, structure: { ...control.structure, name: "consent" }, label: "利用規約に同意する" },
    { ...control, structure: { ...control.structure, dialogLabel: "Booking" } },
    withoutStructure,
    { ...control, blockedByActiveLayer: true },
  ]) assert.equal(permitsTableCheckQueryControl({ control: rejected, snapshot, action: "SET_CHECKED" }), false);
  assert.equal(permitsTableCheckQueryControl({ control, snapshot: { ...snapshot, url: "https://www.tablecheck.com/en/reserve" }, action: "SET_CHECKED" }), false);
});

test("TableCheck guide empty result is bound to one ready widget and exact selected request", () => {
  const html = '<div data-testid="Venue Availability"><form><button data-testid="day" data-date="2026-9-16" aria-selected="true" data-state="disabled">16</button><div data-testid="Venue Pax Select" id="pax-2"></div><div data-testid="Venue Time Select" id="time-19:00"></div><span data-testid="Venue Unavailable Msg">We could not find a table on Sep 16th for the selected mealtime</span></form></div>';
  const snapshot = {url:"https://www.tablecheck.com/en/sushiinase",title:"Sushi Inase",text:"",html};
  const query = {date:"2026-09-16",partySize:2,timeWindow:{earliest:"19:00",latest:"19:00"}};
  assert.equal(hasTableCheckSelectedRequest(snapshot,query.date,query.partySize),true);
  assert.equal(parseTableCheckAvailabilitySlots(snapshot,query).explicitlyEmpty,true);
  for (const input of [
    {...query,date:"2026-09-17"}, {...query,partySize:4}, {...query,timeWindow:{earliest:"18:30",latest:"19:30"}},
  ]) assert.equal(parseTableCheckAvailabilitySlots(snapshot,input).explicitlyEmpty,false);
  for (const changed of [html.replace('</form>','<span class="skeleton"></span></form>'),html+html,html.replace('<div data-testid="Venue Pax Select" id="pax-2"></div>','')+'<div data-testid="Venue Pax Select" id="pax-2"></div>']) {
    assert.equal(parseTableCheckAvailabilitySlots({...snapshot,html:changed},query).explicitlyEmpty,false);
  }
});

test("TableCheck independently verifies live control evidence after model handoff", async () => {
  for (const date of [request.date, "2099-01-01"]) {
    const session = new FixtureBrowserSession([
      discoveryPage({href:"/en/restaurant1",text:"Restaurant 1"}),
      {url:"https://www.tablecheck.com/en/restaurant1",title:"Restaurant 1",text:"Restaurant 1",html:'<h1>Restaurant 1</h1><a href="tel:03-1111-2222">Phone</a><div data-testid="Venue Availability"></div><div class="menu">omakase</div>'},
    ]);
    session.observeControls = async () => [{id:"slot",stableKey:"slot",kind:"LINK",role:"link",label:"19:00",href:`https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=${date}&pax=${request.partySize}&start_time=19:00`,visible:true,disabled:false}];
    const executor = new BrowserTaskExecutor({openSession:async()=>session},{modelDecision:{async decide(){return {type:"COMPLETE",reason:"Hand back observed controls for verification"}}}});
    try {
      const result = await new TableCheckBrowserAvailability(executor).check(request,new AbortController().signal);
      assert.equal(result.offers.length,date===request.date?1:0);
    } finally {await executor.close()}
  }
});

test("TableCheck disabled times cover only the ready widget's requested half-hour window", () => {
  const disabled = (time: string) => `<a data-testid="Venue Timeslot Btn" aria-disabled="true" href="/en/restaurant1"><button disabled="">${time}</button></a>`;
  const html = `<div data-testid="Venue Availability"><form><button data-testid="day" data-date="2026-9-19" aria-selected="true">19</button><div data-testid="Venue Pax Select" id="pax-4"></div><div data-testid="Venue Time Select" id="time-18:30"></div>${['18:30','19:00','19:30'].map(disabled).join('')}<a data-testid="Venue Timeslot Btn" href="https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2026-09-19&amp;num_people=4&amp;start_time=20:00">20:00</a></form></div>`;
  const snapshot = {url:'https://www.tablecheck.com/en/restaurant1',title:'Restaurant 1',text:'',html};
  const query = {date:'2026-09-19',partySize:4,timeWindow:{earliest:'18:30',latest:'19:30'}};
  const result = parseTableCheckAvailabilitySlots(snapshot,query);
  assert.equal(result.explicitlyEmpty,true);
  assert.equal(result.queryComplete,true);
  assert.deepEqual(result.availableSlots,['20:00']);
  for (const changed of [html.replace(disabled('19:00'),''),html.replace('pax-4','pax-2'),html.replace('2026-9-19','2026-9-18'),html.replace('</form>','<span class="skeleton"></span></form>'),html+html,html.replace('time-18:30','time-20:00')]) {
    assert.equal(parseTableCheckAvailabilitySlots({...snapshot,html:changed},query).explicitlyEmpty,false);
  }
  assert.equal(parseTableCheckAvailabilitySlots(snapshot,{...query,timeWindow:{earliest:'18:15',latest:'19:30'}}).explicitlyEmpty,false);
});
