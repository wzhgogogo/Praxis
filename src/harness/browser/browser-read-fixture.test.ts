import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { BrowserTaskExecutor } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserReadActionDecisionPort } from "../../infrastructure/browser/browser-action-decision.js";
import { inspectProbePage, runBrowserReadProbe } from "../../eval/restaurant/agent-loop/browser-read-probe.js";

const url = "https://www.tablecheck.com/en/fixture";
const identity = '<h1>Fixture restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a>';

/** Real Chromium, wholly intercepted local HTML; all other network requests are aborted. */
function localFixture(html: string) {
  return new LocalPlaywrightChromium({ browserType: {
    async launch(options) {
      const browser = await chromium.launch(options);
      const createContext = browser.newContext.bind(browser);
      browser.newContext = async (contextOptions) => {
        const context = await createContext(contextOptions);
        await context.route("**/*", (route) => route.request().url() === url
          ? route.fulfill({ contentType: "text/html", body: html }) : route.abort());
        return context;
      };
      return browser;
    },
  } });
}

test("real browser waits for the requested page update instead of reporting stale slots", async () => {
  const runtime = localFixture(`${identity}
    <div id="availability" data-selected-date="2026-09-06" data-pax="2"><button class="time-slot" data-available="true" data-time="19:00">19:00</button></div>
    <script>setTimeout(() => { const panel = document.getElementById('availability'); panel.dataset.selectedDate='2026-09-07'; panel.innerHTML='<button class="time-slot" data-available="true" data-time="20:00">20:00</button>'; panel.dataset.ready='true'; }, 250);</script>`);
  const result = await runBrowserReadProbe(runtime, { url, readySelector: '#availability[data-ready="true"]', schedule: { date: "2026-09-07", partySize: 2 } });
  assert.equal(result.pageState, "CONTENT_OBSERVED");
  assert.ok("slotsDetected" in result);
  assert.deepEqual(result.slotsDetected, ["20:00"]);
  assert.equal(result.requestSelection, "OBSERVED_MATCH");
  assert.equal(result.controlOperation, "NOT_ATTEMPTED");
  assert.equal(result.availabilityConclusion, "NOT_ESTABLISHED");
});

test("explicit fixture takeover changes the same page and rechecks identity", async () => {
  const runtime = localFixture(`<title>Just a moment...</title><button id="human">Continue fixture</button>
    <script>document.getElementById('human').onclick=()=>{document.title='Restaurant'; document.body.innerHTML=${JSON.stringify(identity)};};</script>`);
  const session = await runtime.openSession({ signal: new AbortController().signal });
  try {
    await session.navigate(url);
    const sessionId = session.metadata.sessionId;
    assert.equal(inspectProbePage({ url }, await session.snapshot()).pageState, "BOT_CHALLENGE");
    // This simulates a human only on the local Fixture; it never operates a website challenge.
    await session.click("#human");
    await session.waitFor("h1", 1_000);
    const result = inspectProbePage({ url, expectedCandidate: {
      restaurant: { id: "other", outletName: "Another restaurant", address: "Another address", sourceIds: { phone: "03-9999-9999" }, provenance: {} },
      matchReasons: [], warnings: [], executionConfidence: "LOW",
    } }, await session.snapshot());
    assert.equal(session.metadata.sessionId, sessionId);
    assert.equal(result.pageState, "CONTENT_OBSERVED");
    assert.ok("identity" in result);
    assert.notEqual(result.identity.confidence, "HIGH");
    assert.equal(result.availabilityConclusion, "NOT_ESTABLISHED");
  } finally { await session.close(); }
});

test("a requested ready marker that never appears fails within the probe deadline", async () => {
  const session = await localFixture(identity).openSession({ signal: new AbortController().signal });
  try {
    await assert.rejects(runBrowserReadProbe({ openSession: async () => session }, { url, readySelector: "#never-ready", timeoutMs: 1_500 }), { code: "BROWSER_TIMEOUT" });
  } finally { await session.close(); }
});

test("generic controlled browser path completes a local read-only page task without a site-specific adapter method", async () => {
  const runtime = localFixture(`<title>Search</title><button id="show" data-praxis-read-only="true">Show results</button>
    <main id="result">Loading</main><script>document.getElementById('show').onclick=()=>{document.title='Results'; document.getElementById('result').textContent='Sushi Inase';};</script>`);
  let step = 0;
  const decision: BrowserReadActionDecisionPort = {
    async decide(input) {
      step += 1;
      if (step === 1) {
        const target = input.observation.targets.find((item) => item.label === "Show results");
        assert.ok(target, "model only receives observed target references");
        return { type: "CLICK", targetRef: target.ref, reason: "reveal read-only search results" };
      }
      return { type: "COMPLETE", reason: "results are visible for deterministic parsing" };
    },
  };
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: decision });
  const session = await executor.acquire(new AbortController().signal, "TABLECHECK", "DISCOVERY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "DISCOVERY", session, signal: new AbortController().signal, allowedOrigins: ["https://www.tablecheck.com"], url });
  const result = await executor.runSkill({
      taskId: "fixture:generic-browser",
      source: "TABLECHECK",
      stage: "DISCOVERY",
      session,
      signal: new AbortController().signal,
      allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Show local public search results.",
      completion: (snapshot) => ({ complete: /Sushi Inase/.test(snapshot.text), reason: "The local public result is not yet visible." }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(result.snapshot.title, "Results");
    assert.match(result.snapshot.text, /Sushi Inase/);
  } finally {
    await executor.close();
  }
});

test("real DOM observation exposes an unlabelled-id role button and calendar navigation without permitting submission", async () => {
  const runtime = localFixture(`<title>Calendar</title><div role="button" tabindex="0" aria-label="Next month">›</div><main>August</main>
    <script>
      document.querySelector('[role=button]').onclick=()=>{document.body.innerHTML='<button data-date="2026-09-07" aria-label="September 7, 2026">7</button><main>September</main>'; document.querySelector('button').onclick=()=>{document.title='Availability Results'; document.body.innerHTML='<div data-selected-date="2026-09-07" data-pax="2"></div><section data-availability-state="complete"><button class="time-slot is-available" data-time="19:00">19:00</button></section>';};};
    </script>`);
  let step = 0;
  const executor = new BrowserTaskExecutor(runtime, { modelDecision: {
    async decide(input) {
      step += 1;
      if (step === 1) {
        const next = input.observation.targets.find((target) => target.role === "button" && target.label === "Next month");
        assert.ok(next);
        return { type: "CLICK", targetRef: next.ref, reason: "show the requested calendar month" };
      }
      const day = input.observation.targets.find((target) => target.value === "2026-09-07");
      assert.ok(day);
      return { type: "CLICK_AUTHORITATIVE", targetRef: day.ref, field: "DATE", reason: "select the Router-bound date" };
    },
  } });
  const session = await executor.acquire(new AbortController().signal, "TABLECHECK", "AVAILABILITY");
  try {
    await executor.navigate({ source: "TABLECHECK", stage: "AVAILABILITY", session, signal: new AbortController().signal, allowedOrigins: ["https://www.tablecheck.com"], url });
    const result = await executor.runSkill({
      taskId: "fixture:calendar", source: "TABLECHECK", stage: "AVAILABILITY", session, signal: new AbortController().signal,
      allowedOrigins: ["https://www.tablecheck.com"],
      goal: { outlet: { name: "Fixture Restaurant" }, date: "2026-09-07", partySize: 2, timeWindow: { earliest: "19:00", latest: "19:00" }, hardCriteria: [] },
      objective: "Select the verified date and wait for the public slot result.",
      completion: (snapshot) => ({ complete: snapshot.title === "Availability Results", reason: "The public result is not ready." }),
    });
    assert.equal(result.status, "COMPLETED");
    assert.equal(step, 2);
  } finally { await executor.close(); }
});
