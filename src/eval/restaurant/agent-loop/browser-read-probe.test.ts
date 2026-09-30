import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { BrowserRuntime, BrowserSession } from "../../../infrastructure/browser/browser-runtime.js";
import { tabelogQueryControlHints, TABELOG_VACANCY_RESPONSES } from "../../../integrations/tabelog/tabelog-query-controls.js";
import { startDiagnosticRun } from "../../shared/diagnostic-run.js";
import { inspectProbePage, probeProvider, runBrowserReadProbe } from "./browser-read-probe.js";
import { safeObservedControls, safeRecord, snapshotRecord } from "./runners/browser-case-slice-evidence.js";

test("source probe refuses credentials, lookalike hosts and unsupported schemes before navigation", () => {
  for (const url of ["https://tablecheck.com.evil.test/shop", "https://user:secret@tablecheck.com/shop", "http://tablecheck.com/shop", "https://tablecheck.com:8443/shop"]) {
    assert.throws(() => probeProvider(url));
  }
  assert.equal(probeProvider("https://www.tablecheck.com/en/shop"), "TABLECHECK");
});

test("challenge precedes content and a cross-source redirect cannot yield identity or slots", () => {
  const input = { url: "https://www.tablecheck.com/en/shop" };
  const page = { url: input.url, title: "Just a moment...", text: "", html: '<button data-available="true" data-time="19:00">19:00</button>' };
  assert.equal(inspectProbePage(input, page).pageState, "BOT_CHALLENGE");
  assert.equal(inspectProbePage(input, { ...page, url: "https://tabelog.com/shop" }).pageState, "UNEXPECTED_PAGE");
});

test("deadline includes session creation and late browser sessions are closed without navigation", async () => {
  let release: (session: BrowserSession) => void = () => {};
  let closed = false;
  let navigated = false;
  const runtime: BrowserRuntime = { openSession: () => new Promise((resolve) => { release = resolve; }) };
  const run = runBrowserReadProbe(runtime, { url: "https://tablecheck.com/en/shop", timeoutMs: 10 });
  await assert.rejects(run, { code: "BROWSER_TIMEOUT" });
  release({
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: new Date().toISOString() },
    close: async () => { closed = true; }, navigate: async () => { navigated = true; },
    snapshot: async () => ({ url: "", title: "", text: "", html: "" }),
    click: async () => {}, fill: async () => {}, select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(),
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(closed, true);
  assert.equal(navigated, false);
});

test("Tabelog read probe journals loading and settled saved Teppen query without an active inventory request", async () => {
  const url = "https://tabelog.com/en/tokyo/A1303/A130301/13308491/";
  const html = readFileSync(new URL("../../../harness/browser/fixtures/tabelog-teppen-calendar-20260929.html", import.meta.url), "utf8");
  const queryTrace: Array<Record<string, unknown>> = [];
  const directory = await mkdtemp(join(tmpdir(), "praxis-teppen-probe-"));
  let settled = false;
  let navigationCount = 0;
  let responseRules: unknown;
  const session: BrowserSession = {
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", startedAt: new Date().toISOString() },
    captureResponses: async rules => { responseRules = rules; },
    navigate: async () => { navigationCount++; },
    snapshot: async () => ({ url, title: "Sushi Teppen", text: settled ? "No available seats for 2 guests." : "Loading calendar",
      html: settled ? html : '<div class="p-booking-calendar">Loading calendar</div>' }),
    observeControls: async () => settled ? [{ id: "guest2", stableKey: ".p-booking-calendar button.js-people-button|button|Guests 2|2|1",
      kind: "BUTTON", role: "button", label: "Guests 2", value: "2", disabled: true, selected: true, visible: true }] : [],
    waitFor: async () => { settled = true; },
    click: async () => assert.fail("read probe must not click"), fill: async () => assert.fail("read probe must not fill"),
    select: async () => assert.fail("read probe must not select"), screenshot: async () => new Uint8Array(), close: async () => {},
  };
  try {
    const journal = await startDiagnosticRun(directory, { mode: "OFFLINE_SAVED_TEPPEN_PROBE" });
    const result = await runBrowserReadProbe({ openSession: async () => session }, {
      url, timeoutMs: 5000, readySelector: ".p-booking-calendar",
      queryObservation: { hints: tabelogQueryControlHints, responses: TABELOG_VACANCY_RESPONSES,
        record(snapshot, controls) { queryTrace.push({ snapshot: safeRecord(snapshotRecord(snapshot)), controls: safeObservedControls(controls) }); } },
    });
    await journal.finish({ status: "SUCCEEDED", result, queryTrace });
    const artifact = JSON.parse(await readFile(journal.resultPath, "utf8")) as { queryTrace: Array<{ snapshot: { queryRegions: Array<{ markup: string }> }; controls: Array<{ label: string; disabled: boolean }> }> };
    assert.equal(navigationCount, 1);
    assert.deepEqual(responseRules, TABELOG_VACANCY_RESPONSES);
    assert.equal(artifact.queryTrace.length, 2);
    assert.match(artifact.queryTrace[0]!.snapshot.queryRegions[0]!.markup, /Loading calendar/);
    assert.match(artifact.queryTrace[1]!.snapshot.queryRegions[0]!.markup, /day-num--closed">30/);
    assert.deepEqual(artifact.queryTrace[1]!.controls.map(control => [control.label, control.disabled]), [["Guests 2", true]]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
