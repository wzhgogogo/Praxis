import assert from "node:assert/strict";
import test from "node:test";
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { parseTabelogAvailabilitySlots } from "./tabelog-page-parser.js";
import { tabelogRequestedDateState } from "./tabelog-query-controls.js";

const sourceUrl = "https://tabelog.com/tokyo/A1301/A130101/13123456/";
const request = { date: "2026-11-03", partySize: 2 };
function response(): NonNullable<BrowserSnapshot["responses"]>[number] {
  return { url: "https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=13123456&svd=20261103&svps=2", status: 200, sequence: 1, observedAt: "2026-10-29T02:00:00+01:00",
    body: { base_date: { year: 2026, month: 11, day: 3 }, members: 2, selection: [{ time: "19:00", url: "/en/booking/form_course/new?rcd=13123456&member=2&visit_date=20261103&visit_time=1900" }] } };
}
test("G3 slot claims require a data response, independent of private available/full classes", () => {
  for (const state of ["is-available", "full", "renamed-319"]) {
    const snapshot = { url: sourceUrl, title: "Response outlet", text: "予約 人数 19:00", html: `<button class="slot ${state}" data-time="19:00">19:00</button>` };
    assert.deepEqual(parseTabelogAvailabilitySlots(snapshot, request), { availableSlots: [], hasExplicitSlotUi: false }, "without a data response a private class is not stock");
    assert.deepEqual(parseTabelogAvailabilitySlots({ ...snapshot, responses: [response()] }, request), { availableSlots: ["19:00"], hasExplicitSlotUi: true }, "data response, not DOM class, establishes the bound slot");
    assert.deepEqual(parseTabelogAvailabilitySlots({ ...snapshot, responses: [response()] }, { ...request, partySize: 3 }), { availableSlots: [], hasExplicitSlotUi: false });
  }
});
test("G3 day state without a corresponding data response is UNKNOWN, including private FULL/CLOSED/PHONE hints", () => {
  for (const state of ["closed", "full", "tel", "enough"]) {
    const snapshot = { url: sourceUrl.replace("/tokyo/", "/en/tokyo/"), title: "Calendar", text: "Nov 2026 3",
      html: `<div class="p-booking-calendar"><table class="p-booking-calendar__calendar"><caption><em>Nov 2026</em></caption><tr><td><span class="p-booking-calendar__day-num p-booking-calendar__day-num--${state}">3</span></td></tr></table></div>` };
    assert.equal(tabelogRequestedDateState(snapshot, request.date), "UNOBSERVED", "without a data response day status is unknown");
    assert.equal(tabelogRequestedDateState({ ...snapshot, responses: [response()] }, request.date), "SELECTABLE");
    assert.equal(tabelogRequestedDateState({ ...snapshot, responses: [response()] }, "2026-11-04"), "UNOBSERVED");
  }
});
