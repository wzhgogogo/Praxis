import assert from "node:assert/strict";
import test from "node:test";
import { localFixture } from "./browser-read-test-fixtures.js";
import type { BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import { TabelogBrowserAvailability } from "../../integrations/tabelog/tabelog-browser-availability.js";

test("G3 real Chromium failed native accelerator returns to observed date and party controls", async () => {
  // Native selector failure is real Playwright selectOption behaviour, not a
  // fake session predicting a throw. Only HTTP/model transports are replaced.
  const detail = "https://tabelog.com/en/tokyo/A1301/A130101/13123456/";
  const endpoint = "https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=13123456&svd=20261103&svps=2";
  const candidate = { restaurant: { id: "control-fallback", outletName: "Control Fixture", address: "1-1 Ginza, Tokyo", sourceIds: { tabelog: "tokyo/A1301/A130101/13123456", tabelogNativeDetailUri: detail }, provenance: {} }, matchReasons: [], warnings: [], executionConfidence: "HIGH" as const };
  for (const responseParty of [2, 3]) {
    const html = `<title>Control Fixture</title><link rel="canonical" href="${detail}"><script type="application/ld+json">${JSON.stringify({ "@type": "Restaurant", name: candidate.restaurant.outletName, address: candidate.restaurant.address })}</script>
      <h1>Control Fixture</h1><h2>Availability</h2>
      <select hidden name="party"><option value="1">Old template</option></select><select hidden name="date"><option value="1970-01-01">Old template</option></select>
      <label>Date<input type="date" name="new-day" value="2026-11-02" onchange="update()"></label>
      <label>Guests<select name="new-count" onchange="update()"><option value="1" selected>1 guest</option><option value="2">2 guests</option></select></label>
      <div class="p-booking-calendar"><button aria-label="Current date" aria-selected="false" data-year="2026" data-month="11" data-day="3">3</button><fieldset><legend>Guests</legend><button aria-pressed="false">2</button></fieldset></div>
      <script>let sent=false;function update(){const date=document.querySelector('[name=new-day]').value,party=document.querySelector('[name=new-count]').value;
        document.querySelector('[aria-label="Current date"]').setAttribute('aria-selected',String(date==='2026-11-03'));
        document.querySelector('fieldset button').setAttribute('aria-pressed',String(party==='2'));
        if(date==='2026-11-03'&&party==='2'&&!sent){sent=true;fetch(${JSON.stringify(endpoint)}).then(r=>r.json())}}</script>`;
    const fixture = localFixture({ [detail]: html, [endpoint]: JSON.stringify({ base_date: { year: 2026, month: 11, day: 3 }, members: responseParty,
      selection: [{ time: "19:00", url: `/en/booking/form_course/new?rcd=13123456&member=${responseParty}&visit_date=20261103&visit_time=1900` }] }) });
    let session: BrowserSession | undefined;
    const decisions: string[] = [];
    const executor = new BrowserTaskExecutor({ async openSession(input) { return session = await fixture.openSession(input); } }, {
      maxAutomaticElapsedMs: 30_000, maxOperationsPerCandidate: 24, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12,
      modelDecision: { async decide(input) {
        const date = input.observation.targets.find(target => target.kind === "INPUT" && target.label === "Date");
        if (date && date.value !== "2026-11-03") { decisions.push("DATE"); return { type: "FILL_AUTHORITATIVE", field: "DATE", targetRef: date.ref, reason: "Set the observed Date control" }; }
        const party = input.observation.targets.find(target => target.kind === "OPTION" && target.label === "2 guests" && target.selected !== true);
        if (party) { decisions.push("PARTY_SIZE"); return { type: "CHOOSE_OPTION", field: "PARTY_SIZE", targetRef: party.ref, reason: "Set the observed Guests option" }; }
        return { type: "COMPLETE", reason: "Only the captured source response can confirm the result" };
      } },
    });
    try {
      const result = await new TabelogBrowserAvailability(executor).check({ candidates: [candidate], candidateIds: [candidate.restaurant.id], date: "2026-11-03", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] }, AbortSignal.timeout(30_000));
      assert.equal(result.availabilityChecks[candidate.restaurant.id]?.status, responseParty === 2 ? "AVAILABLE" : "UNKNOWN", "a failed native accelerator must fall back to observed public controls");
      assert.equal(result.offers.length, responseParty === 2 ? 1 : 0, "a successful control change cannot override a response for another party");
      assert.deepEqual(decisions, ["DATE", "PARTY_SIZE"], "actions use current labels and authoritative fields");
      const state = (await session!.snapshot()).interactiveState!.split("\n").map(line => JSON.parse(line));
      assert.equal(state.find(row => row.name === "new-day").value, "2026-11-03");
      assert.equal(state.find(row => row.name === "new-count").value, "2");
    } finally { await executor.close(); }
  }
});
