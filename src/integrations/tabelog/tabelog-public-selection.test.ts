import assert from "node:assert/strict";
import { test } from "node:test";
import type { BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { hasTabelogSelectedQuery, tabelogCapturedSlots } from "./tabelog-query-controls.js";
import { inspectTabelogVacancyResponse } from "./tabelog-vacancy-response.js";
const url = "https://tabelog.com/en/tokyo/A1301/A130101/123/";
const date = "2026-11-03";
const response = { url: "https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=123&svd=20261103&svps=2", status: 200, sequence: 1, observedAt: "2026-10-29T09:00:00Z",
  body: { base_date: { year: 2026, month: 11, day: 3 }, members: 2, selection: [{ time: "19:00", url: "/en/booking/form_course/new?rcd=123&member=2&visit_date=20261103&visit_time=1900" }] } };
const snapshot = (html: string, responses: BrowserSnapshot["responses"] = []): BrowserSnapshot => ({ url, title: "Constructed public selection", text: "Public calendar", html, responses });
const native = '<label for="day">Date</label><input id="day" type="date" value="2026-11-03"><label for="people">Guests</label><select id="people"><option value="2" selected>2 guests</option></select>';
const aria = '<table><caption>Nov 2026</caption><tr><td><span aria-current="date">3</span></td></tr></table><fieldset><legend>Guests</legend><button aria-pressed="true">2</button></fieldset>';

test("Tabelog query confirmation uses public native or ARIA values and rejects public contradictions", () => {
  for (const html of [native, aria, '<label>Date<input type="date" value="2026-11-03"></label><label>Guests<select><option selected value="2">2 guests</option></select></label>']) {
    assert.equal(hasTabelogSelectedQuery(snapshot(html), date, 2), true);
    assert.equal(hasTabelogSelectedQuery(snapshot(html), date, 3), false);
    assert.equal(hasTabelogSelectedQuery(snapshot(html), "2026-11-04", 2), false);
    assert.equal(hasTabelogSelectedQuery(snapshot(html.replace('>2</button>', '>3</button>').replace('value="2"', 'value="3"')), date, 2), false);
  }
  for (const html of [native.replace('2026-11-03', '2026-11-04'), aria.replace('>2</button>', '>3</button>')]) {
    assert.equal(hasTabelogSelectedQuery(snapshot(html, [response]), date, 2), false, "public contradictory state invalidates an earlier matching response");
    assert.equal(tabelogCapturedSlots(snapshot(html, [response]), date, 2), undefined);
  }
});

test("Tabelog class-only state is unknown; a precisely bound response works without private markers", () => {
  const privateHtml = '<div class="p-booking-calendar"><p class="is-current" data-year="2026" data-month="11" data-day="3">3</p><button class="p-booking-calendar__people-button is-active">2</button></div>';
  assert.equal(hasTabelogSelectedQuery(snapshot(privateHtml), date, 2), false);
  for (const html of [privateHtml, '<main>Read calendar response</main>']) {
    assert.equal(hasTabelogSelectedQuery(snapshot(html, [response]), date, 2), true);
    assert.deepEqual(tabelogCapturedSlots(snapshot(html, [response]), date, 2), { availableSlots: ["19:00"], hasExplicitSlotUi: true });
  }
  assert.deepEqual(inspectTabelogVacancyResponse(snapshot("", [response]), date, 2), { status: "OBSERVED", availableSlots: ["19:00"], hasExplicitSlotUi: true }, "C-facing response output format stays unchanged");
  assert.equal(hasTabelogSelectedQuery(snapshot("", [response]), date, 3), false);
});
