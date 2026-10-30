import type { BrowserCapturedResponse } from "../../infrastructure/browser/browser-runtime.js";
import { inspectTabelogVacancyResponse } from "./tabelog-vacancy-response.js";
import assert from "node:assert/strict";
import test from "node:test";
import type { RestaurantAvailabilityRequest, RestaurantCandidate } from "../../domains/restaurant/contracts.js";
import type { BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { TabelogBrowserAvailability } from "./tabelog-browser-availability.js";

// Constructed public source protocol; no historical run, network or model.
const now = "2026-10-28T18:00:00+01:00";
const sourceUrl = "https://tabelog.com/en/tokyo/A1301/A130101/13123456/";
const endpoint = "https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=13123456&svd=20261103&svps=2";
const candidate: RestaurantCandidate = { restaurant: { id: "response-fixture", outletName: "Response Fixture", address: "1-1 Ginza, Tokyo",
  sourceIds: { tabelog: "tokyo/A1301/A130101/13123456", tabelogNativeDetailUri: sourceUrl }, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" };
const request: RestaurantAvailabilityRequest = { candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-11-03", partySize: 2,
  timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] };
function body() { return { base_date: { year: 2026, month: 11, day: 3 }, members: 2,
  selection: { 0: { time: "19:00", url: "/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261103&visit_time=1900" } } }; }
function page(value: unknown = body(), responseUrl = endpoint, status = 200): BrowserSnapshot {
  return { url: sourceUrl, title: "Response Fixture", text: "Response Fixture Availability Guests 2 19:00",
    html: `<link rel="canonical" href="${sourceUrl}"><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: candidate.restaurant.outletName, address: candidate.restaurant.address })}</script>
      <select name="party"><option value="2" selected>2 guests</option></select><select name="date"><option value="2026-11-03" selected>2026-11-03</option></select>
      <div class="p-booking-calendar"><button aria-selected="true" data-year="2026" data-month="11" data-day="3">3</button><fieldset><legend>Guests</legend><button aria-pressed="true">2</button></fieldset></div>`,
    responses: [{ url: responseUrl, status, sequence: 1, observedAt: now, body: value }] };
}
async function read(snapshot: BrowserSnapshot) {
  const diagnostics: BrowserExecutionDiagnostic[] = [];
  const session: BrowserSession = { metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: now },
    async navigate() {}, async snapshot() { return snapshot; }, async click() { assert.fail("no booking or slot click"); }, async fill() {},
    async select(_selector, value) { return [value]; }, async waitFor() {}, async waitForSettled() { return true; }, async screenshot() { return new Uint8Array(); }, async close() {} };
  const executor = new BrowserTaskExecutor({ openSession: async () => session }, { maxAutomaticElapsedMs: 30_000, maxOperationsPerCandidate: 24,
    maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, onDiagnostic: row => diagnostics.push(row) });
  try { return { result: await new TabelogBrowserAvailability(executor, () => now).check(request, new AbortController().signal), diagnostics }; }
  finally { await executor.close(); }
}

test("G3 vacancy schema drift is observable UNKNOWN, retaining outlet identity and never an offer", async t => {
  const changes: Array<[string, unknown]> = [
    ["missing base date", { members: 2, selection: body().selection }],
    ["changed member type", { ...body(), members: "2" }],
    ["changed selection shape", { ...body(), selection: "new-layout" }],
    ["changed row URL type", { ...body(), selection: [{ time: "19:00", url: { path: "/new-layout" } }] }],
  ];
  for (const [name, malformed] of changes) await t.test(name, async () => {
    const { result, diagnostics } = await read(page(malformed));
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, "UNKNOWN");
    assert.equal(result.offers.length, 0);
    assert.equal(result.availabilityChecks[candidate.restaurant.id]?.reasonCode, "SOURCE_STRUCTURE_CHANGED", "schema drift must have its own visible reason");
    assert.equal(result.metadata.failureCode, "SOURCE_STRUCTURE_CHANGED");
    assert.ok(result.evidence.some(row => row.kind === "ENTITY_MATCH" && row.entityMatch?.confidence === "HIGH"), "a source format failure cannot invalidate the verified outlet");
    const issue = diagnostics.find(row => String(row.event) === "SOURCE_STRUCTURE_CHANGED");
    assert.ok(issue, "emit a source-structure diagnostic through the real executor");
    assert.equal(issue.url, sourceUrl);
    assert.match(issue.detail ?? "", /expected|actual/u);
  });
});

test("G3 vacancy response keeps the exact source binding and latest-response rule", async () => {
  const good = await read(page());
  assert.equal(good.result.availabilityChecks[candidate.restaurant.id]?.status, "AVAILABLE");
  assert.equal(good.result.offers[0]?.dateTime, "2026-11-03T19:00:00+09:00");
  assert.ok(!good.diagnostics.some(row => String(row.event) === "SOURCE_STRUCTURE_CHANGED"));
  for (const changed of [
    { ...body(), members: 3 }, { ...body(), base_date: { year: 2026, month: 11, day: 4 } },
    { ...body(), selection: [{ ...body().selection[0], url: body().selection[0].url.replace("13123456", "99999999") }] },
    { ...body(), selection: [{ ...body().selection[0], time: "19:30" }] },
  ]) {
    const result = await read(page(changed));
    assert.equal(result.result.offers.length, 0, "wrong outlet/date/party/time must never be rescued by visible options");
  }
  const latest = page({ ...body(), selection: "changed" });
  latest.responses!.unshift({ ...page().responses![0]!, sequence: 0 });
  const result = await read(latest);
  assert.equal(result.result.offers.length, 0, "do not fall back to an older successful response");
  assert.equal(result.result.metadata.failureCode, "SOURCE_STRUCTURE_CHANGED");
});

test("G3 response URL cannot contradict its body and shape diagnostics never contain response values", async () => {
  const mismatch = await read(page(body(), endpoint.replace("rst_id=13123456", "rst_id=99999999")));
  assert.equal(mismatch.result.offers.length, 0, "request URL merchant contradicting the page is not bound evidence");
  const sentinel = "fixture-value-must-not-enter-diagnostics";
  const drift = await read(page({ base_date: { year: 2026, month: 11, day: 3 }, members: 2, selection: sentinel, debug: sentinel }));
  assert.equal(drift.result.metadata.failureCode, "SOURCE_STRUCTURE_CHANGED");
  const issues = drift.diagnostics.filter(row => String(row.event) === "SOURCE_STRUCTURE_CHANGED");
  assert.ok(issues.length > 0);
  assert.ok(!JSON.stringify(issues).includes(sentinel), "shape reports contain field/type names, never raw body values");
});

// Minimal local response, constructed 2026-10-30 from the audited find_vacancy
// contract. No copied historic run, website access or synthesized booking URL.
const date = "2026-11-03";
const pageUrl = "https://tabelog.com/en/tokyo/A1301/A130101/123/";
const links = [
  { time: "19:00", url: "/en/booking/form_course/new?visit_time=1900&rcd=123&member=2&visit_date=20261103&course_id=public%2fmenu+one" },
  { time: "19:30", url: "https://tabelog.com/en/booking/form_course/new?member=2&visit_date=20261103&visit_time=1930&rcd=123&course_id=other%2Fmenu" },
];
function response(selection: unknown = links): BrowserCapturedResponse {
  return { sequence: 9, url: "https://tabelog.com/en/booking/calendar/find_vacancy?svps=2&svd=20261103&rst_id=123", status: 200, observedAt: "2026-10-30T09:00:00Z",
    body: { base_date: { year: 2026, month: 11, day: 3 }, members: 2, selection } };
}
function snapshot(responses: BrowserCapturedResponse[]): BrowserSnapshot {
  return { url: pageUrl, title: "Local response control", html: "<main>Public calendar</main>", text: "Public calendar", responses };
}

test("Tabelog vacancy returns each verified original form_course link and its latest response provenance", () => {
  for (const selection of [links, { second: links[1], first: links[0] }]) {
    const current = response(selection);
    const older = { ...response([{ time: "18:00", url: "/en/booking/form_course/new?rcd=123&member=2&visit_date=20261103&visit_time=1800" }]), sequence: 8 };
    assert.deepEqual(inspectTabelogVacancyResponse(snapshot([current, older]), date, 2), {
      status: "OBSERVED", availableSlots: ["19:00", "19:30"], hasExplicitSlotUi: true,
      formCourseLinks: links,
      sourceResponse: { sequence: current.sequence, url: current.url, observedAt: current.observedAt },
    }, "validated response URLs retain their exact form, encoding and query order, without reconstruction");
  }
});

test("Tabelog vacancy exports no links for mismatched bindings, invalid targets or changed response shapes", () => {
  const valid = links[0]!;
  const cases = [
    ["outlet", { ...valid, url: valid.url.replace("rcd=123", "rcd=124") }, "UNKNOWN"],
    ["party", { ...valid, url: valid.url.replace("member=2", "member=3") }, "UNKNOWN"],
    ["date", { ...valid, url: valid.url.replace("visit_date=20261103", "visit_date=20261104") }, "UNKNOWN"],
    ["time", { ...valid, url: valid.url.replace("visit_time=1900", "visit_time=1930") }, "UNKNOWN"],
    ["origin", { ...valid, url: "https://tabelog.com.evil.example" + valid.url }, "UNKNOWN"],
    ["protocol", { ...valid, url: "http://tabelog.com" + valid.url }, "UNKNOWN"],
    ["path", { ...valid, url: valid.url.replace("/form_course/new?", "/form_course/other?") }, "UNKNOWN"],
    ["url-type", { ...valid, url: 123 }, "SOURCE_STRUCTURE_CHANGED"],
    ["time-type", { ...valid, time: null }, "SOURCE_STRUCTURE_CHANGED"],
    ["row-shape", null, "SOURCE_STRUCTURE_CHANGED"],
  ] as const;
  for (const [name, invalid, expected] of cases) {
    const result = inspectTabelogVacancyResponse(snapshot([response([links[1], invalid])]), date, 2);
    assert.equal(result.status, expected, name);
    assert.equal("formCourseLinks" in result, false, name + ": no qualified link may escape an invalid response");
  }
  const unsupported = { time: "25:00", url: "/en/booking/form_course/new?rcd=123&member=2&visit_date=20261103&visit_time=2500" };
  const current = response([valid, unsupported]);
  assert.deepEqual(inspectTabelogVacancyResponse(snapshot([current]), date, 2), {
    status: "OBSERVED", availableSlots: ["19:00"], hasExplicitSlotUi: true, formCourseLinks: [valid],
    sourceResponse: { sequence: current.sequence, url: current.url, observedAt: current.observedAt },
  }, "unsupported after-midnight clocks remain excluded under the original rule");
  assert.deepEqual(inspectTabelogVacancyResponse(snapshot([response([])]), date, 2), { status: "UNKNOWN" });
});
