import assert from "node:assert/strict";
import test from "node:test";
import { localFixture } from "./browser-read-test-fixtures.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import { TabelogBrowserAvailability } from "../../integrations/tabelog/tabelog-browser-availability.js";

test("G3 real Chromium Japanese outlet needs captured data response rather than a private slot class", async () => {
  const detail = "https://tabelog.com/tokyo/A1301/A130101/13123456/";
  const endpoint = "https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=13123456&svd=20261103&svps=2";
  const candidate = { restaurant: { id: "response-only", outletName: "Response Only", address: "1-1 Ginza, Tokyo", sourceIds: { tabelog: "tokyo/A1301/A130101/13123456", tabelogNativeDetailUri: detail }, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  for (const captured of [false, true]) {
    const html = `<title>Response Only</title><link rel="canonical" href="${detail}"><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: candidate.restaurant.outletName, address: candidate.restaurant.address })}</script>
      <h1>Response Only</h1><p>予約 人数 Availability</p><select name="party"><option value="2">2</option></select><select name="date"><option value="2026-11-03">2026-11-03</option></select>
      <button class="slot ${captured ? "renamed-319" : "is-available"}" data-time="19:00">19:00</button>${captured ? `<script>fetch(${JSON.stringify(endpoint)}).then(r=>r.json())</script>` : ""}`;
    const executor = new BrowserTaskExecutor(localFixture({ [detail]: html, [endpoint]: JSON.stringify({ base_date: { year: 2026, month: 11, day: 3 }, members: 2,
      selection: [{ time: "19:00", url: "/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261103&visit_time=1900" }] }) }), { maxAutomaticElapsedMs: 30_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
    try {
      const result = await new TabelogBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-11-03", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, AbortSignal.timeout(30_000));
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, captured ? "AVAILABLE" : "UNKNOWN", "data response is mandatory; class-only stock must not reach an offer");
      assert.equal(result.offers.length, captured ? 1 : 0);
      assert.ok(result.evidence.some(row => row.kind === "ENTITY_MATCH" && row.entityMatch?.confidence === "HIGH"));
    } finally { await executor.close(); }
  }
});
