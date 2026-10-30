import assert from "node:assert/strict";
import test from "node:test";
import { localFixture } from "./browser-read-test-fixtures.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import { TabelogBrowserAvailability } from "../../integrations/tabelog/tabelog-browser-availability.js";

test("G3 real Chromium Agent reveals public renamed results and retains same-branch grounding", async () => {
  // Start at the production Adapter: only source HTTP and model transport are
  // replaced. Native control observation, Validator, action effects, identity,
  // captured JSON and final grounding remain real. No Live/model quality claim.
  const detail = "https://tabelog.com/en/tokyo/A1301/A130101/13123456/";
  const endpoint = "https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=13123456&svd=20261103&svps=2";
  const sourceId = "public-list-fixture";
  const candidate = { restaurant: { id: sourceId, outletName: "Public Restaurant", address: "1-1 Ginza, Tokyo", sourceIds: { phone: "03-1111-2222" }, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  const search = "https://tabelog.com/en/tokyo/rstLst/?sw=Public%20Restaurant";
  for (const otherBranch of [false, true]) {
    let decisions = 0;
    const searchHtml = `<h1>Restaurants</h1><button onclick="this.hidden=true;document.querySelector('section').hidden=false">Show restaurants</button>
      <section hidden aria-label="Search results"><article><h2><a class="renamed-319" href="${detail}">Public Restaurant</a></h2><address>1-1 Ginza, Tokyo</address></article></section>`;
    const detailHtml = `<title>Public Restaurant</title><link rel="canonical" href="${detail}"><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: candidate.restaurant.outletName, address: otherBranch ? "9-9 Shibuya, Tokyo" : candidate.restaurant.address, telephone: otherBranch ? "03-9999-8888" : candidate.restaurant.sourceIds.phone })}</script>
      <h1>Public Restaurant</h1><p>Availability</p><select name="party"><option selected value="2">2 guests</option></select><select name="date"><option selected value="2026-11-03">2026-11-03</option></select>
      <div class="p-booking-calendar"><button aria-selected="true" data-year="2026" data-month="11" data-day="3">3</button><fieldset><legend>Guests</legend><button aria-pressed="true">2</button></fieldset></div><script>fetch(${JSON.stringify(endpoint)}).then(r=>r.json())</script>`;
    const executor = new BrowserTaskExecutor(localFixture({ [search]: searchHtml, [detail]: detailHtml, [endpoint]: JSON.stringify({ base_date: { year: 2026, month: 11, day: 3 }, members: 2, selection: [{ time: "19:00", url: "/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261103&visit_time=1900" }] }) }), {
      maxAutomaticElapsedMs: 30_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,
      modelDecision: { async decide(input) {
        decisions++;
        const target = input.observation.targets.find(row => row.label === "Show restaurants");
        assert.ok(target, "Agent acts on a current visible label, never a private selector");
        return { type: "CLICK", targetRef: target.ref, reason: "Read the observed restaurant results" };
      } },
    });
    try {
      const result = await new TabelogBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [sourceId], date: "2026-11-03", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, AbortSignal.timeout(30_000));
      assert.equal(result.availabilityChecks[sourceId]?.status, otherBranch ? "UNKNOWN" : "AVAILABLE", "renamed public result must reach the same-outlet availability path");
      assert.equal(result.offers.length, otherBranch ? 0 : 1);
      assert.ok(decisions >= 1, "Agent must reveal the initially hidden public results through an observed action");
    } finally { await executor.close(); }
  }
});
