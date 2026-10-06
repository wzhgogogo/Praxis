import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { BrowserSession } from "../../../infrastructure/browser/browser-runtime.js";
import { startDiagnosticRun } from "../../shared/diagnostic-run.js";
import { safeRecord, snapshotRecord, traceBrowserSession } from "./runners/browser-case-slice-evidence.js";

test("browser case slice journal retains the saved Teppen query region without page secrets", async () => {
  const html = readFileSync(new URL("../../../harness/browser/fixtures/tabelog-teppen-calendar-20260929.html", import.meta.url), "utf8");
  const directory = await mkdtemp(join(tmpdir(), "praxis-browser-slice-evidence-"));
  try {
    const journal = await startDiagnosticRun(directory, { mode: "OFFLINE_SAVED_DOM" });
    const trace: Array<{ sequence: number; kind: string; detail: unknown }> = [];
    const record = (kind: string, detail: unknown) => { const sequence = trace.length + 1; trace.push({ sequence, kind, detail: safeRecord(detail) }); return sequence; };
    const session: BrowserSession = {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: new Date().toISOString() },
      navigate: async () => {},
      snapshot: async () => ({ url: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/?csrf_token=secret",
        title: "Saved Teppen calendar", text: "Reviewer Jane Doe; No available seats for 2 guests.", html,
        responses: [{ url: "https://tabelog.com/en/booking/calendar/find_vacancy/?token=secret", status: 200,
          observedAt: "2026-09-29T00:00:00Z", sequence: 1,
          body: { base_date: { year: 2026, month: 9, day: 30 }, members: 2,
            selection: { first: { time: "19:00", url: "/en/booking/form_course/new?rcd=13308491&member=2&visit_date=20260930&visit_time=1900&token=secret" } },
            profile: { name: "Jane Doe" } } }] }),
      observeControls: async () => [
        { id: "guest", stableKey: ".p-booking-calendar button.js-people-button", kind: "BUTTON", role: "button", label: "Guests 2", disabled: true, visible: true, selected: true },
        { id: "entry", stableKey: "a[href]|link|Online reservation", kind: "LINK", role: "link", label: "Online reservation", href: "https://tabelog.com/en/booking/calendar/", disabled: false, visible: true },
        { id: "review", stableKey: "a[href]|link|Jane Doe", kind: "LINK", role: "link", label: "Jane Doe", href: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/dtlrvwlst/B123/", disabled: false, visible: true },
      ],
      click: async () => {}, fill: async () => {}, select: async () => [], waitFor: async () => {}, waitForChange: async () => true, screenshot: async () => new Uint8Array(), close: async () => {},
    };
    const observed = traceBrowserSession(session, "TABELOG", record);
    await observed.navigate("https://tabelog.com/en/tokyo/A1303/A130301/13308491/");
    await observed.snapshot();
    await observed.observeControls?.();
    await observed.waitForChange?.({ url: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/?csrf_token=secret", title: "Private page", text: "Jane Doe private source text", interactiveState: "private" });
    const waitCall = trace.find(event => event.kind === "SESSION_CALL" && (event.detail as { method?: string }).method === "waitForChange")!;
    assert.doesNotMatch(JSON.stringify(waitCall.detail), /Jane Doe|private source text|csrf_token=secret/);
    assert.match(JSON.stringify(waitCall.detail), /sha256/);
    await journal.finish({ status: "SUCCEEDED", trace });
    const artifact = JSON.parse(await readFile(journal.resultPath, "utf8")) as { trace: Array<{ sequence: number; kind: string; detail: Record<string, unknown> }> };
    const snapshotEvent = artifact.trace.find(event => event.kind === "SNAPSHOT")!;
    const controlsEvent = artifact.trace.find(event => event.kind === "CONTROLS")!;
    const detail = snapshotEvent.detail as { url: string; queryRegions: Array<{ markup: string; truncated: boolean; ancestorMarkupHidden: boolean; computedVisibility: string }>;
      responses: Array<{ body: { base_date: { year: number; month: number; day: number }; members: number; selection: Array<{ time: string; link: { rcd: string; visit_time: string } }> } }> };
    assert.equal(detail.url, "https://tabelog.com/en/tokyo/A1303/A130301/13308491/");
    assert.equal(detail.queryRegions.length, 1);
    const region = detail.queryRegions[0]!;
    assert.equal(region.truncated, false);
    assert.match(region.markup, /<caption><em>Sep 2026<\/em><\/caption>/);
    assert.match(region.markup, /p-booking-calendar__day-num--closed">30<\/span>/);
    assert.match(region.markup, /js-people-button[^\"]*is-active[^\"]*is-disabled" disabled>2<\/button>/);
    assert.match(region.markup, /No available seats for 2 guests/);
    assert.doesNotMatch(region.markup, /href=|csrf|<script|<style|<textarea|<form/i);
    assert.equal(region.computedVisibility, "UNKNOWN");
    assert.equal(region.ancestorMarkupHidden, false);
    assert.equal(controlsEvent.detail.snapshotSequence, snapshotEvent.sequence);
    const controls = controlsEvent.detail.controls as Array<{ id: string; label: string }>;
    assert.deepEqual(controls.map(control => control.id), ["guest", "entry", "review"]);
    assert.equal(controls[1]!.label, "Online reservation");
    assert.equal(controls[2]!.label, "[REDACTED_PROFILE_LABEL]");
    assert.equal(detail.responses[0]!.body.selection[0]!.link.rcd, "13308491");
    assert.equal(detail.responses[0]!.body.selection[0]!.link.visit_time, "1900");
    assert.doesNotMatch(await readFile(journal.resultPath, "utf8"), /csrf_token=secret|token=secret|Jane Doe/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("browser case slice journal distinguishes loading and absent booking regions", () => {
  const loading = snapshotRecord({ url: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/", title: "Loading", text: "Loading", html: '<div class="p-booking-calendar"><div>Loading calendar</div></div>' });
  const absent = snapshotRecord({ url: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/", title: "Absent", text: "No widget", html: "<main>No widget</main>" });
  assert.deepEqual(loading.queryRegions, [{ markup: '<div class="p-booking-calendar"><div>Loading calendar</div></div>', truncated: false, ancestorMarkupHidden: false, computedVisibility: "UNKNOWN" }]);
  assert.deepEqual(absent.queryRegions, []);
  const hidden = snapshotRecord({ url: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/", title: "Hidden", text: "", html: '<div style="display:none"><div class="p-booking-calendar"><div aria-hidden="true"><p class="js-calendar-day-target" data-year="2026" data-month="10" data-day="1">1</p></div></div></div>' });
  assert.equal((hidden.queryRegions as Array<{ ancestorMarkupHidden: boolean }>)[0]!.ancestorMarkupHidden, true);
  assert.match((hidden.queryRegions as Array<{ markup: string }>)[0]!.markup, /aria-hidden="true" data-markup-hidden="true"/);
  const selected = snapshotRecord({ url: "https://tabelog.com/en/tokyo/A1303/A130301/13308491/", title: "Selected", text: "", html: '<div class="p-booking-calendar"><p class="js-calendar-day-target is-current" data-year="2026" data-month="9" data-day="30">30</p><button class="js-people-button is-active" disabled>2</button><input class="js-people-hidden-value" value="2"></div>' });
  assert.match((selected.queryRegions as Array<{ markup: string }>)[0]!.markup, /js-calendar-day-target is-current" data-year="2026" data-month="9" data-day="30"/);
  assert.match((selected.queryRegions as Array<{ markup: string }>)[0]!.markup, /js-people-hidden-value" value="2"/);
});

test("browser case slice journal retains a TableCheck availability region without retaining the page profile", () => {
  const record = snapshotRecord({
    url: "https://www.tablecheck.com/en/shops/example/reserve?start_date=2026-10-02&pax=2",
    title: "Example",
    text: "Book a table",
    html: '<main><section data-testid="Venue Availability"><fieldset><legend>Service category</legend><input type="radio" name="reservation[service_category]" value="public-sushi" checked></fieldset><div data-testid="Venue Pax Select"><button>2 guests</button></div><div data-testid="Venue Time Select"><a href="/en/shops/example/reserve?start_date=2026-10-02&amp;pax=2&amp;start_time=19:00"><button disabled>19:00</button></a></div></section><p>private profile text</p></main>',
  });
  const regions = record.queryRegions as Array<{ markup: string }>;
  assert.equal(regions.length, 1);
  assert.match(regions[0]!.markup, /data-testid="Venue Availability"/);
  assert.match(regions[0]!.markup, /data-testid="Venue Time Select"/);
  assert.doesNotMatch(regions[0]!.markup, /private profile text/);
  assert.match(regions[0]!.markup, /data-reservation-source="\/en\/shops\/example\/reserve" data-reservation-date="2026-10-02" data-reservation-party="2" data-reservation-time="19:00"/);
  assert.match(regions[0]!.markup, /<button disabled>19:00<\/button>/);
  assert.match(regions[0]!.markup, /name="reservation\[service_category\]" type="radio" value="public-sushi" checked/);
  assert.doesNotMatch(regions[0]!.markup, /href=|private profile text/);
});
