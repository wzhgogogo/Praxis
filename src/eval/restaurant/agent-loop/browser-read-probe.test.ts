import assert from "node:assert/strict";
import { test } from "node:test";
import type { BrowserRuntime, BrowserSession } from "../../../infrastructure/browser/browser-runtime.js";
import { inspectProbePage, probeProvider, runBrowserReadProbe } from "./browser-read-probe.js";

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
