import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
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
