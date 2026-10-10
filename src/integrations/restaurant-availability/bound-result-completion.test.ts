import assert from "node:assert/strict";
import { test } from "node:test";
import type { BrowserSession, BrowserSnapshot } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserTaskExecutor, type BrowserCompletionAssessment } from "../../infrastructure/browser/browser-task-executor.js";
import { tabelogAvailabilityCompletion, tabelogNameSearchCompletion } from "../tabelog/tabelog-browser-availability.js";
import { tableCheckNameSearchCompletion } from "../tablecheck/tablecheck-browser-availability.js";

import { sourceListingCompletion } from "../restaurant-search/native-restaurant-search.js";
import { tabelogDiscoveryPack, tableCheckDiscoveryPack } from "../restaurant-search/source-packs.js";

const request = { date: "2026-10-21", partySize: 4, timeWindow: { earliest: "18:00", latest: "18:00" } };
const cases: Array<{ name: string; source: "TABELOG" | "TABLECHECK"; url: string; html: string; scope: string; unrelated: string; change: [string,string]; completion(page: BrowserSnapshot): BrowserCompletionAssessment }> = [
  { name: "Tabelog name search", source: "TABELOG", url: "https://tabelog.com/en/tokyo/rstLst/?sw=Sen", scope: "result-list", html: '<a class="list-rst__rst-name-target" href="/en/tokyo/A1303/A130301/13275802/">Sen</a>', unrelated: '<div class="list-rst__calendar-loader"></div><div class="list-rst__image skeleton"></div>', change: ["13275802","13305528"], completion: tabelogNameSearchCompletion },
  { name: "TableCheck name search", source: "TABLECHECK", url: "https://www.tablecheck.com/en/japan/search?search_text=Sen", scope: "search-results", html: '<a href="/en/sen">Sen</a>', unrelated: '<div class="ExploreSidePicSkeletonImage skeleton"></div><div class="AvailabilitySkeleton skeleton"></div>', change: ["/en/sen","/en/teppen"], completion: page => tableCheckNameSearchCompletion(page, "Sen") },
  { name: "Tabelog availability", source: "TABELOG", url: "https://tabelog.com/en/tokyo/A1303/A130301/13275802/", scope: "p-booking-calendar", html: '<p class="js-calendar-day-target is-selectable is-current" data-year="2026" data-month="10" data-day="21">21</p><button class="js-people-button is-active">4</button><input class="js-people-hidden-value" value="4"><button class="slot is-available" data-time="18:00">18:00</button>', unrelated: '<div class="p-booking-calendar__calendar skeleton"></div><div class="recommendation skeleton"></div>', change: ["18:00","19:00"], completion: page => tabelogAvailabilityCompletion(page, request) },
];

for (const item of cases.slice(0, 2)) cases.push({ ...item, name: item.source + " native listing", completion: page => sourceListingCompletion(item.source === "TABELOG" ? tabelogDiscoveryPack : tableCheckDiscoveryPack, page, [], "") });

async function read(item: typeof cases[number], pages: BrowserSnapshot[]) {
  let index = 0;
  const session: BrowserSession = {
    metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", sessionId: "fixture:bound-result", startedAt: "2026-10-10T00:00:00Z" },
    navigate: async () => {}, snapshot: async () => structuredClone(pages[index++ % pages.length]!), observeControls: async () => [],
    click: async () => { throw Error("Fixture prohibits actions"); }, fill: async () => { throw Error("Fixture prohibits actions"); }, select: async () => [], waitFor: async () => {}, screenshot: async () => new Uint8Array(), close: async () => {},
  };
  const executor = new BrowserTaskExecutor({ openSession: async () => session });
  try { return await executor.runSkill({ taskId: item.name, session, signal: new AbortController().signal, source: item.source, stage: item.name.includes("availability") ? "AVAILABILITY" : "DISCOVERY", allowedOrigins: [new URL(item.url).origin], goal: { outlet: { name: "Sen" }, ...request, hardCriteria: [] }, objective: "Read a bound result", completion: item.completion }); }
  finally { await executor.close(); }
}
for (const item of cases) {
  const page = (html: string): BrowserSnapshot => ({ url: item.url, html, title: item.name, text: "Sen 18:00", settlement: "PENDING", settlementDiagnostics: { url: item.url, pendingByType: {}, oldestPendingMs: 0, blockingDataRequests: 0, busySelectors: [".unrelated.skeleton"], visibleTextChanging: true } });
  const ready = `<div class="${item.scope}">${item.html}${item.unrelated}</div>`;
  test(`${item.name}: displayed bound result completes despite unrelated calendar/image loaders`, async () => {
    assert.equal(item.completion({ ...page(ready), settlement: "SETTLED" }).resultBusy, false);
    const result = await read(item, [page(ready), page(ready)]);
    assert.equal(result.status, "COMPLETED"); assert.equal(result.snapshot.settlement, "SETTLED");
  });
  test(`${item.name}: a result-region skeleton keeps even old parsed results pending`, async () => {
    const loading = `<div class="${item.scope} skeleton">${item.html}</div>`;
    assert.equal(item.completion({ ...page(loading), settlement: "SETTLED" }).resultBusy, true);
    const result = await read(item, [page(loading)]);
    assert.notEqual(result.status, "COMPLETED"); assert.equal(result.snapshot.settlement, "PENDING");
  });
  test(`${item.name}: changed bound results between snapshots stay pending`, async () => {
    const changed = ready.replaceAll(...item.change);
    assert.notEqual(item.completion({ ...page(ready), settlement: "SETTLED" }).resultKey, item.completion({ ...page(changed), settlement: "SETTLED" }).resultKey);
    const result = await read(item, [page(ready), page(changed)]);
    assert.notEqual(result.status, "COMPLETED"); assert.equal(result.snapshot.settlement, "PENDING");
  });
}
