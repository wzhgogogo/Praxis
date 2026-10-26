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
