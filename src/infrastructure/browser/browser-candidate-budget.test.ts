import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { LIVE_READ_DEBUG_INVESTIGATION_BUDGET as budget } from "../../application/live-read-investigation-budget.js";
import { BrowserTaskExecutor } from "./browser-task-executor.js";
import type { BrowserSession } from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";

// Timing-only minimum fixture. No historical pages, invented identity or slot evidence.
const timing = JSON.parse(readFileSync(new URL("./fixtures/d6-candidate-budget-timing.json", import.meta.url), "utf8")) as {
  candidateId: string; providerSwitchMs: number; targetNavigationStartMs: number;
  targetNavigationFinishedMs: number; snapshotStartMs: number; reportedFailureMs: number;
  syntheticSnapshotWorkMs: number; targetUrl: string;
};
const limits = {
  maxAutomaticElapsedMs: budget.maxAutomaticBrowserMs,
  maxElapsedMsPerProvider: budget.maxProviderBrowserMs,
  maxModelCallsPerCandidate: budget.maxBrowserModelCallsPerCandidate,
  maxModelCallsTotal: budget.maxBrowserModelCallsTotal,
  maxOperationsPerCandidate: budget.maxBrowserOperationsPerCandidate,
};
const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

for (const control of ["legacy60", "productionDefault"] as const) {
  test(`D6 timing fixture ${control}: final snapshot is bounded by the candidate window`, async t => {
    t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 0 });
    const allowance = control === "legacy60" ? 60_000 : budget.maxCandidateBrowserMs;
    const page = { url: timing.targetUrl, title: "Local budget fixture", html: "<p>Synthetic local snapshot</p>", text: "Synthetic local snapshot" };
    let navigationTimeout = 0;
    const session: BrowserSession = {
      metadata: { runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM", engine: "CHROMIUM", sessionId: "fixture:d6-budget", startedAt: new Date(0).toISOString() },
      async navigate(_url, options) {
        navigationTimeout = options?.timeoutMs ?? 0;
        await delay(timing.targetNavigationFinishedMs - timing.targetNavigationStartMs);
      },
      async waitForSettled() {
        await delay(timing.snapshotStartMs - timing.targetNavigationFinishedMs);
        return false;
      },
      async snapshot() { await delay(timing.syntheticSnapshotWorkMs); return page; },
      async click() {}, async fill() {}, async select() { return []; }, async waitFor() {},
      async screenshot() { return new Uint8Array(); }, async close() {},
    };
    const executor = new BrowserTaskExecutor({ openSession: async () => session }, { ...limits, maxElapsedMsPerCandidate: allowance });
    const signal = new AbortController().signal;
    executor.beginProvider(timing.candidateId, "TABLECHECK");
    await executor.acquire(signal, "TABLECHECK", "DISCOVERY");
    // Earlier recorded work is elapsed cost, not reconstructed source behavior.
    t.mock.timers.setTime(timing.providerSwitchMs);
    executor.beginProvider(timing.candidateId, "TABELOG");
    t.mock.timers.setTime(timing.targetNavigationStartMs);
    const scoped = { source: "TABELOG", stage: "IDENTITY" as const, signal, session };
    const navigation = executor.navigate({ ...scoped, url: timing.targetUrl, observed:true, allowedOrigins: ["https://tabelog.com"] });
    await flush();
    t.mock.timers.tick(timing.targetNavigationFinishedMs - timing.targetNavigationStartMs);
    await flush();
    t.mock.timers.tick(timing.snapshotStartMs - timing.targetNavigationFinishedMs);
    await navigation;
    assert.equal(Date.now(), 59_982);
    assert.ok(navigationTimeout <= 20_000, "ordinary navigation cap stays20s");
    const snapshot = executor.snapshot(scoped).then(
      value => ({ status: "COMPLETED" as const, value }),
      error => ({ status: "FAILED" as const, error: error as unknown }),
    );
    await flush();
    t.mock.timers.tick(timing.syntheticSnapshotWorkMs);
    const result = await snapshot;
    assert.equal(Date.now(), timing.reportedFailureMs);
    if (control === "legacy60") {
      assert.equal(result.status, "FAILED");
      if (result.status === "FAILED") {
        assert.ok(result.error instanceof BrowserRuntimeError);
        assert.equal(result.error.code, "BROWSER_TIMEOUT");
        assert.equal(result.error.scope, "CANDIDATE");
      }
    } else {
      assert.equal(result.status, "COMPLETED", "the approved default must finish this local snapshot after60s");
      if (result.status === "COMPLETED") assert.equal(result.value.text, page.text);
    }
    assert.equal(navigationTimeout, control === "legacy60" ? 12_947 : 20_000);
    await executor.close();
  });
}

for (const scope of ["PROVIDER", "CANDIDATE", "RUN"] as const) {
  test(`candidate increase preserves ${scope} deadline exhaustion before a new read`, async t => {
    t.mock.timers.enable({ apis: ["Date"], now: 0 });
    const executor = new BrowserTaskExecutor({ openSession: async () => { throw Error("No session should open"); } },
      { ...limits, maxElapsedMsPerCandidate: budget.maxCandidateBrowserMs });
    executor.beginProvider("fixture:candidate", "TABLECHECK");
    if (scope === "PROVIDER") {
      t.mock.timers.setTime(timing.providerSwitchMs);
      executor.beginProvider("fixture:candidate", "TABELOG");
      t.mock.timers.setTime(timing.providerSwitchMs + 45_000);
    } else if (scope === "CANDIDATE") {
      t.mock.timers.setTime(60_000);
      executor.beginProvider("fixture:candidate", "TABELOG");
      t.mock.timers.setTime(90_000);
    } else {
      t.mock.timers.setTime(480_000);
      executor.beginProvider("fixture:new-candidate", "TABELOG");
      t.mock.timers.setTime(500_000);
    }
    await assert.rejects(executor.acquire(new AbortController().signal, "TABELOG", "IDENTITY"),
      error => error instanceof BrowserRuntimeError && error.code === "BROWSER_TIMEOUT" && error.scope === scope);
    await executor.close();
  });
}
