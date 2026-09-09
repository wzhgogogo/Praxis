import assert from "node:assert/strict";
import { test } from "node:test";

import { fixtureCandidates, fixtureIntent } from "../../harness/restaurant-fixtures.js";
import type { BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { TableCheckBrowserAvailability } from "./tablecheck-browser-availability.js";
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
    ].join(""),
  };
  assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-07", 2), true);
  assert.equal(hasTableCheckSelectedRequest(snapshot, "2026-09-07", 3), false);
  assert.deepEqual(parseTableCheckAvailabilitySlots(snapshot, { date: "2026-09-07", partySize: 2 }), {
    availableSlots: ["19:00"], hasExplicitSlotUi: true, explicitlyEmpty: false, queryComplete: true,
  });
});

test("TableCheck reads the same exact request binding from live DOM controls when hydration omits it from HTML", () => {
  assert.deepEqual(parseTableCheckControlAvailability([
    { id: "slot", stableKey: "slot", kind: "LINK", role: "link", label: "19:00", href: "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2026-09-07&start_time=19:00&num_people=2", disabled: false, visible: true },
    { id: "stale", stableKey: "stale", kind: "LINK", role: "link", label: "19:30", href: "https://www.tablecheck.com/en/shops/restaurant1/reserve?start_date=2025-09-07&start_time=19:30&num_people=2", disabled: false, visible: true },
  ], "2026-09-07", 2), {
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
