import assert from "node:assert/strict";
import test from "node:test";
import { localFixture } from "./browser-read-test-fixtures.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import { TabelogBrowserAvailability } from "../../integrations/tabelog/tabelog-browser-availability.js";

test("G3 real Chromium passive vacancy capture surfaces changed JSON without losing same-outlet identity", async () => {
  // Only the source HTTP transport is a local fixture. Real runtime capture,
  // Executor, native identity, Adapter and grounding participate. Guard's
  // isolated admission is unchanged and covered by its existing receiver tests.
  const sourceUrl = "https://tabelog.com/en/tokyo/A1301/A130101/13123456/";
  const endpoint = "https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=13123456&svd=20261103&svps=2";
  const candidate = { restaurant: { id: "chromium-response", outletName: "Response Fixture", address: "1-1 Ginza, Tokyo", sourceIds: { tabelog: "tokyo/A1301/A130101/13123456", tabelogNativeDetailUri: sourceUrl }, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  const html = `<title>Response Fixture</title><link rel="canonical" href="${sourceUrl}"><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: candidate.restaurant.outletName, address: candidate.restaurant.address })}</script>
    <h1>Response Fixture</h1><p>Availability</p><select name="party"><option value="2" selected>2 guests</option></select><select name="date"><option value="2026-11-03" selected>2026-11-03</option></select>
    <div class="p-booking-calendar"><button aria-selected="true" data-year="2026" data-month="11" data-day="3">3</button><fieldset><legend>Guests</legend><button aria-pressed="true">2</button></fieldset></div>
    <script>fetch(${JSON.stringify(endpoint)}).then(r=>r.json()).then(()=>document.body.dataset.loaded='true')</script>`;
  for (const malformed of [false, true]) {
    const body = { base_date: { year: 2026, month: 11, day: 3 }, members: 2, selection: malformed ? "changed-layout" : { 0: { time: "19:00", url: "/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261103&visit_time=1900" } } };
    const diagnostics: BrowserExecutionDiagnostic[] = [];
    const executor = new BrowserTaskExecutor(localFixture({ [sourceUrl]: html, [endpoint]: JSON.stringify(body) }), { maxAutomaticElapsedMs: 30_000,
      maxOperationsPerCandidate: 24, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, onDiagnostic: value => diagnostics.push(value) });
    try {
      const result = await new TabelogBrowserAvailability(executor).check({ candidateIds: [candidate.restaurant.id], candidates: [candidate], date: "2026-11-03", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, AbortSignal.timeout(30_000));
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, malformed ? "UNKNOWN" : "AVAILABLE");
      if (malformed) {
        assert.equal(result.metadata.failureCode, "SOURCE_STRUCTURE_CHANGED", "real captured JSON drift must reach the final result");
        assert.equal(result.offers.length, 0);
        assert.ok(diagnostics.some(row => String(row.event) === "SOURCE_STRUCTURE_CHANGED"));
      } else assert.equal(result.offers[0]?.dateTime, "2026-11-03T19:00:00+09:00");
      assert.ok(result.evidence.some(row => row.kind === "ENTITY_MATCH" && row.entityMatch?.confidence === "HIGH"));
    } finally { await executor.close(); }
  }
});
