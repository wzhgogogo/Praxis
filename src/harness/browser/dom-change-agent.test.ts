import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright-core";
import { renamePrivateMarkers } from "../../eval/restaurant/dom-change/mutation.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import { localFixture, url } from "./browser-read-test-fixtures.js";

test("G2 constructed normal control uses observed labels after every private marker changes", async () => {
  // Local construction, never called website replay. Only UI transport and model
  // decision are scripted; actual observations, actions and completion are used.
  const original = `<title>Public fixture</title><style>#private-search{display:block}.private-result{color:black}</style>
    <h1 id="private-search">Public fixture</h1>
    <a id="private-result" class="private-result" data-testid="Result Link" data-private-owner="source" href="https://www.tablecheck.com/en/public-result">Read restaurant</a>`;
  const browser = await chromium.launch({ headless: true });
  let renamed: string;
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
    await context.route("**/*", route => route.abort());
    const page = await context.newPage(); await page.setContent(original);
    const mapping = await renamePrivateMarkers(page, "agent-normal-control");
    assert.equal(mapping.integrity.valid, true);
    renamed = await page.content();
  } finally { await browser.close(); }
  for (const [variant, html] of [["original", original], ["renamed", renamed]] as const) {
    const actions: string[] = [];
    const resultUrl = "https://www.tablecheck.com/en/public-result";
    const runtime = localFixture({ [url]: html, [resultUrl]: "<h1>Source-backed fixture restaurant</h1>" });
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 30_000, maxModelCallsPerCandidate: 4, maxModelCallsTotal: 4, maxOperationsPerCandidate: 12,
      modelDecision: { async decide(input) {
        const target = input.observation.targets.find(target => target.label === "Read restaurant"); assert.ok(target);
        assert.ok(target.availableActions?.includes("OPEN_LINK"));
        actions.push("OPEN_LINK"); return { type: "OPEN_LINK", targetRef: target.ref, reason: "Read the observed public restaurant link" };
      } } });
    const signal = AbortSignal.timeout(30_000);
    try {
      const session = await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
      await executor.navigate({ session, signal, source: "TABLECHECK", stage: "DISCOVERY", allowedOrigins: [new URL(url).origin], url });
      const result = await executor.runSkill({ taskId: "g2:" + variant, session, signal, source: "TABLECHECK", stage: "DISCOVERY", allowedOrigins: [new URL(url).origin],
        goal: { outlet: { name: "Public fixture" }, hardCriteria: [] }, objective: "Read the public result",
        completion: snapshot => ({ complete: snapshot.url === resultUrl && snapshot.text.includes("Source-backed fixture restaurant"), resultBusy: false, resultKey: snapshot.text, reason: "Use the actual visible public result" }) });
      assert.equal(result.status, "COMPLETED", JSON.stringify(result));
      assert.deepEqual(actions, ["OPEN_LINK"]);
    } finally { await executor.close(); }
  }
});


test("G2 public selection is observable but only a bound source response confirms the request", async () => {
  // Local construction, not a captured website replay. UI selected state and
  // independently bound response evidence are different assertions.
  const { PlaywrightControlRegistry } = await import("../../infrastructure/browser/playwright-browser-controls.js");
  const { observeDomChangePage } = await import("../../eval/restaurant/dom-change/run.js");
  const sourceUrl = "https://tabelog.com/en/tokyo/A1303/A130301/13275802/";
  const spec = { id: "constructed-public-calendar", site: "TABELOG" as const, kind: "CALENDAR" as const,
    path: "LOCAL_CONSTRUCTED", sha256: "LOCAL_CONSTRUCTED", provenancePath: "LOCAL_CONSTRUCTED", sourceUrl, dates: [],
    request: { date: "2026-10-22", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" } } };
  const html = '<section class="p-booking-calendar"><button aria-label="Date 2026-10-22" data-year="2026" data-month="10" data-day="22" aria-selected="true">22</button><fieldset><legend>Guests</legend><button aria-label="Guests 2" aria-pressed="true">2</button></fieldset></section>';
  const browser = await chromium.launch({ headless: true });
  const registry = new PlaywrightControlRegistry();
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
    await context.route("**/*", route => route.abort());
    const page = await context.newPage(); await page.setContent(html);
    const snapshot = { url: sourceUrl, title: "Constructed public selection", text: await page.locator("body").innerText(), html: await page.content() };
    const labels = ["Date 2026-10-22", "Guests 2"];
    const selected = (await registry.observe(page)).filter(control => labels.includes(control.label));
    assert.equal(selected.length, 2);
    assert.ok(selected.every(control => control.visible && control.selected === true), "explicit ARIA state must be observed");
    assert.equal(observeDomChangePage(spec, snapshot, selected).facts.requestConfirmed ?? null, null,
      "selected DOM without a same-read response cannot confirm date and party");
    const response = { url: "https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=13275802&svd=20261022&svps=2&svt=1900",
      status: 200, observedAt: "2026-10-22T00:00:00Z", sequence: 1,
      body: { base_date: { year: 2026, month: 10, day: 22 }, members: 2,
        selection: [{ time: "19:00", url: "https://tabelog.com/en/booking/form_course/new?rcd=13275802&member=2&visit_date=20261022&visit_time=1900" }] } };
    const confirmed = observeDomChangePage(spec, { ...snapshot, responses: [response] }, selected).facts;
    assert.equal(confirmed.requestConfirmed, true, "a genuinely bound response remains a positive");
    assert.deepEqual(confirmed.availability, { status: "AVAILABLE", slots: ["19:00"] });
    for (const body of [{ ...response.body, members: 4 }, { ...response.body, base_date: { year: 2026, month: 10, day: 21 } }]) {
      const facts = observeDomChangePage(spec, { ...snapshot, responses: [{ ...response, body }] }, selected).facts;
      assert.equal(facts.requestConfirmed ?? null, null, "other date or party response is unknown");
      assert.equal(facts.availability, undefined);
    }
    const mapping = await renamePrivateMarkers(page, "public-selection-control");
    assert.equal(mapping.integrity.valid, true);
    const renamed = (await registry.observe(page)).filter(control => labels.includes(control.label));
    assert.equal(renamed.length, 2); assert.ok(renamed.every(control => control.selected === true));
    await page.locator("button").evaluateAll(buttons => buttons.forEach(button => { button.removeAttribute("aria-selected"); button.removeAttribute("aria-pressed"); }));
    const unselected = (await registry.observe(page)).filter(control => labels.includes(control.label));
    assert.equal(unselected.length, 2); assert.ok(unselected.every(control => control.selected !== true), "removing public state returns the UI to unknown");
    const noState = { ...snapshot, html: await page.content() };
    assert.equal(observeDomChangePage(spec, noState, unselected).facts.requestConfirmed ?? null, null);
  } finally { await registry.dispose(); await browser.close(); }
});
