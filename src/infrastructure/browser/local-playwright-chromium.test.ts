import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { resolve } from "node:path";

import { BrowserRuntimeError } from "./browser-runtime-errors.js";
import { LocalPlaywrightChromium } from "./local-playwright-chromium.js";

function fakeBrowser(counts: { page: number; context: number; browser: number }) {
  const page = {
    goto: async () => null,
    content: async () => "<html><body>Example Domain</body></html>",
    locator: () => ({ innerText: async () => "Example Domain", click: async () => {}, fill: async () => {}, selectOption: async () => ["2"], waitFor: async () => {} }),
    title: async () => "Example Domain",
    screenshot: async () => new Uint8Array(),
    url: () => "https://example.com/",
    close: async () => { counts.page += 1; },
  };
  const context = {
    newPage: async () => page,
    close: async () => { counts.context += 1; },
  };
  return {
    newContext: async () => context,
    close: async () => { counts.browser += 1; },
  };
}

test("Local Playwright Chromium preserves the BrowserType method binding, exposes the BrowserSession contract, and closes page, context, and browser", async () => {
  const counts = { page: 0, context: 0, browser: 0 };
  let launchThis: unknown;
  const browserType = {
    async launch() {
      launchThis = this;
      return fakeBrowser(counts) as never;
    },
  };
  const runtime = new LocalPlaywrightChromium({ browserType });
  const session = await runtime.openSession({ signal: new AbortController().signal });
  await session.navigate("https://example.com");
  assert.deepEqual(await session.snapshot(), {
    url: "https://example.com/", html: "<html><body>Example Domain</body></html>", text: "Example Domain", title: "Example Domain",
  });
  assert.equal(session.metadata.runtimeProvider, "LOCAL_PLAYWRIGHT_CHROMIUM");
  assert.equal(session.metadata.engine, "CHROMIUM");
  assert.match(session.metadata.sessionId ?? "", /^local:/);
  await session.close();
  await session.close();
  assert.equal(launchThis, browserType);
  assert.deepEqual(counts, { page: 1, context: 1, browser: 1 });
});

test("environment gates keep ordinary profiles temporary and enable persistence only with both eval switches", async (t) => {
  const counts = { page: 0, context: 0, browser: 0 };
  const launches: Array<{ headless?: boolean; userDataDir?: string }> = [];
  t.mock.method(chromium, "launch", async (options: { headless?: boolean }) => {
    launches.push(options);
    return fakeBrowser(counts);
  });
  t.mock.method(chromium, "launchPersistentContext", async (userDataDir: string, options: { headless?: boolean }) => {
    launches.push({ ...options, userDataDir });
    return fakeBrowser(counts).newContext();
  });
  for (const [interactive, manual, expected] of [
    ["0", "0", { headless: true }],
    ["0", "1", { headless: true }],
    ["1", "0", { headless: false }],
    ["1", "1", { headless: false, userDataDir: resolve(".eval-artifacts", "local-chromium-profile") }],
  ] as const) {
    const runtime = LocalPlaywrightChromium.fromEnvironment({
      PRAXIS_LOCAL_CHROMIUM_INTERACTIVE: interactive,
      PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION: manual,
    });
    const session = await runtime.openSession({ signal: new AbortController().signal });
    await session.close();
    assert.deepEqual(launches.at(-1), expected, `interactive=${interactive}, manual=${manual}`);
  }
  assert.deepEqual(counts, { page: 4, context: 4, browser: 3 });
});

test("Local Playwright Chromium maps launch failures into the fail-closed BrowserRuntime error", async () => {
  const runtime = new LocalPlaywrightChromium({ browserType: { launch: async () => { throw new Error("browser binary missing"); } } });
  await assert.rejects(
    runtime.openSession({ signal: new AbortController().signal }),
    (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_RUNTIME_FAILED" && /install a Playwright Chromium browser binary/.test(error.message),
  );
});
