import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import { withBookingHandoffs } from "../../application/restaurant-booking-handoff.js";
import type { BookingHandoffContext } from "../../domains/restaurant/booking-handoff.js";
import { restaurantAvailabilityRequestFingerprint, type RestaurantAvailabilityRead, type RestaurantAvailabilityRequest } from "../../domains/restaurant/contracts.js";
import type { BrowserPageControl, BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";
import { TableCheckBookingHandoffReader } from "./tablecheck-booking-handoff-reader.js";

const entrance = "https://www.tablecheck.com/en/shops/fixture-sushi/reserve";
function link(href = entrance, extra: Partial<BrowserPageControl> = {}): BrowserPageControl {
  return { id: "link:1", stableKey: "link:1", kind: "LINK", role: "link", label: "Reserve", href, visible: true, disabled: false, ...extra };
}
function fixture() {
  // Component context only; the unchanged A test proves the persistent whole composition.
  const c: BookingHandoffContext = JSON.parse(readFileSync(new URL("../../domains/restaurant/fixtures/booking-handoff/source.json", import.meta.url), "utf8")).context;
  c.candidate.restaurant.sourceIds = { tablecheck: "fixture-sushi" };
  c.offer.source = "TABLECHECK"; c.check.sourceProvider = "TABLECHECK";
  c.check.requestFingerprint = restaurantAvailabilityRequestFingerprint(c.request);
  for (const e of c.evidence) { e.provider = "TABLECHECK"; e.sourceEntityId = "fixture-sushi"; e.sourceUrl = entrance; }
  return c;
}
function environment() {
  let root: string | undefined = "root:A", controls = [link()], now = fixture().now;
  const calls = { open: 0, snapshot: 0, controls: 0, navigation: 0 };
  const runtime: BrowserRuntime = { async openSession() {
    calls.open++;
    return { metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: now },
      async snapshot() { calls.snapshot++; return { url: entrance, title: "Unit source", text: "Reserve", html: "" }; },
      async observeControls() { calls.controls++; return controls; },
      async navigate() { calls.navigation++; assert.fail("The cache must never navigate"); },
      async click() { assert.fail("No action"); }, async fill() { assert.fail("No action"); }, async select() { assert.fail("No action"); },
      async waitFor() {}, async screenshot() { return new Uint8Array(); }, async close() {},
    };
  } };
  const reader = new TableCheckBookingHandoffReader(runtime, () => root, () => now);
  async function capture(c = fixture(), observed = [link()]) {
    controls = observed;
    const id = c.candidate.restaurant.id;
    const request: RestaurantAvailabilityRequest = { candidateIds: [id], candidates: [c.candidate], date: c.request.date, partySize: c.request.partySize, timeWindow: c.request.timeWindow, hardCriteria: [] };
    const read: RestaurantAvailabilityRead = { offers: [c.offer], availabilityChecks: { [id]: c.check }, evidence: [...c.evidence],
      metadata: { provider: "TABLECHECK", route: "GENERIC_BROWSER", latencyMs: 0 } };
    await reader.capture(request, new AbortController().signal, async () => {
      const s = await reader.runtime.openSession({ signal: new AbortController().signal });
      await s.snapshot(); await s.observeControls!(); await s.close(); return read;
    });
    // Deliberate unit projection stub, never an injected artifact in the A whole-chain test.
    return { case: { rootTaskId: root }, restaurant: { intentDraft: c.request, candidates: [c.candidate],
      availability: { [id]: [c.offer] }, availabilityChecks: { [id]: c.check }, readEvidence: c.evidence } } as unknown as RestaurantCaseView;
  }
  return { reader, capture, calls, root: (value: string | undefined) => { root = value; }, now: (value: string) => { now = value; } };
}

test("TableCheck B1 taps existing controls and serializes only the verified exact offer", async () => {
  const e = environment(), view = await e.capture(), prepared = e.reader.readPrepared(view);
  assert.equal(prepared.length, 1);
  const url = new URL(prepared[0]!.source.url);
  assert.equal(url.origin + url.pathname, entrance);
  assert.deepEqual(Object.fromEntries(url.searchParams), { start_date: "2026-11-02", num_people: "2", start_time: "19:00" });
  assert.ok(prepared[0]!.source.url.includes("19%3A00"));
  const before = { ...e.calls }, shown = withBookingHandoffs(view, prepared, fixture().now).restaurant.bookingHandoffs!;
  assert.equal(shown[0]!.verificationHint, "Check date and guests");
  assert.equal(shown[0]!.sourceSelection, "UNKNOWN"); assert.match(shown[0]!.continueLabel, /filled in/);
  assert.deepEqual(e.calls, before); assert.deepEqual(e.calls, { open: 1, snapshot: 1, controls: 1, navigation: 0 });
});

test("TableCheck B1 refuses mismatched and unobserved entrances while availability remains AVAILABLE", async t => {
  const ready = entrance + "?start_date=2026-11-02&start_time=19%3A00&num_people=2";
  const cases: Array<[string, BrowserPageControl[]]> = [
    ["wrong shop", [link(ready.replace("fixture-sushi", "other-shop"))]],
    ["wrong date", [link(ready.replace("2026-11-02", "2026-11-03"))]],
    ["wrong guests", [link(ready.replace("num_people=2", "num_people=3"))]],
    ["wrong exact slot", [link(ready.replace("19%3A00", "19%3A30"))]],
    ["wrong domain", [link(ready.replace("www.tablecheck.com", "tablecheck.com.evil.invalid"))]],
    ["review path", [link(ready.replace("/reserve?", "/reserve/review?"))]],
    ["payment path", [link(ready.replace("/reserve?", "/reserve/payment?"))]],
    ["account path", [link(ready.replace("/reserve?", "/account?"))]],
    ["ambiguous query", [link(ready + "&num_people=2")]],
    ["redirect query", [link(ready + "&redirect=https%3A%2F%2Fevil.invalid")]],
    ["missing link", []], ["hidden link", [link(ready, { visible: false })]], ["disabled link", [link(ready, { disabled: true })]],
  ];
  for (const [name, controls] of cases) await t.test(name, async () => {
    const e = environment(), view = await e.capture(fixture(), controls);
    assert.equal(view.restaurant.availabilityChecks["fixture:outlet"]!.status, "AVAILABLE");
    assert.deepEqual(e.reader.readPrepared(view), []);
    assert.deepEqual(withBookingHandoffs(view, e.reader.readPrepared(view), fixture().now).restaurant.bookingHandoffs, []);
    assert.equal(e.calls.navigation, 0);
  });
});

test("TableCheck B1 never turns a broad window without an exact available time into a link", async () => {
  const e = environment(), c = fixture();
  c.request.timeWindow = { earliest: "18:00", latest: "22:00" };
  c.check.requestFingerprint = restaurantAvailabilityRequestFingerprint(c.request);
  c.evidence.find(row => row.kind === "AVAILABILITY")!.claims.visibleSlots = [];
  const view = await e.capture(c); assert.deepEqual(e.reader.readPrepared(view), []);
});

test("TableCheck B1 keeps root scopes isolated, invalidates new reads and never fetches during projection", async () => {
  const e = environment(), a = await e.capture(fixture(), [link(entrance + "?utm_source=A")]);
  e.root("root:B"); const b = await e.capture(fixture(), [link(entrance + "?utm_source=B")]);
  const first = e.reader.readPrepared(a), second = e.reader.readPrepared(b);
  assert.equal(new URL(first[0]!.source.url).searchParams.get("utm_source"), "A");
  assert.equal(new URL(second[0]!.source.url).searchParams.get("utm_source"), "B");
  const changed = structuredClone(first); changed[0]!.source.url = changed[0]!.source.url.replace("num_people=2", "num_people=3");
  assert.deepEqual(withBookingHandoffs(a, changed, fixture().now).restaurant.bookingHandoffs, [], "the second server check still rejects a modified prepared object");
  e.root("root:A"); await e.capture(fixture(), []); assert.deepEqual(e.reader.readPrepared(a), []);
  assert.equal(e.reader.readPrepared(b).length, 1);
  const before = { ...e.calls }; e.now("2026-10-29T10:11:00.000Z"); assert.deepEqual(e.reader.readPrepared(b), []); assert.deepEqual(e.calls, before);
  e.root(undefined); const noRoot = await e.capture(); assert.deepEqual(e.reader.readPrepared(noRoot), []);
});
