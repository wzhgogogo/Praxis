import assert from "node:assert/strict";
import test from "node:test";
import type { BrowserCapturedResponse, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { inspectTabelogVacancyResponse } from "./tabelog-vacancy-response.js";

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
