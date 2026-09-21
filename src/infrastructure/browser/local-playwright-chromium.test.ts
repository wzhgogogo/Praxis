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
  const snapshot = await session.snapshot();
  const { pageId, ...page } = snapshot;
  assert.deepEqual(page, {
    url: "https://example.com/", html: "<html><body>Example Domain</body></html>", text: "Example Domain", title: "Example Domain", responses: [],
  });
  assert.equal(pageId, "page:1");
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
    (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_RUNTIME_UNAVAILABLE" && /install a Playwright Chromium browser binary/.test(error.message),
  );
});

test("passive query capture invalidates old stock at request time and rejects late responses", async () => {
  const { EventEmitter } = await import("node:events");
  const { PlaywrightResponseObserver } = await import("./playwright-response-observer.js");
  const page = new EventEmitter() as unknown as import("playwright-core").Page;
  const observer = new PlaywrightResponseObserver();
  observer.configure(page, [{ origin: "https://tabelog.com", pathname: "/vacancy" }]);
  const request = () => ({ method: () => "GET", url: () => "https://tabelog.com/vacancy" });
  const response = (req: ReturnType<typeof request>, body: Promise<string>) => ({ request: () => req, headers: () => ({ "content-type": "application/json" }), text: () => body, url: req.url, status: () => 200 });
  const emit = page as unknown as InstanceType<typeof EventEmitter>;
  const initial = request(); emit.emit("request", initial); emit.emit("response", response(initial, Promise.resolve('{"slot":"19:00"}')));
  assert.equal((await observer.snapshot(page)).length, 1);
  let finishOld!: (body: string) => void;
  const older = request(); emit.emit("request", older); emit.emit("response", response(older, new Promise(resolve => { finishOld = resolve; })));
  const current = request(); emit.emit("request", current);
  finishOld('{"slot":"stale"}');
  assert.deepEqual(await observer.snapshot(page), [], "a newly requested query cannot reuse the old result");
  emit.emit("response", response(current, Promise.resolve('{"slot":"18:45"}')));
  assert.deepEqual((await observer.snapshot(page)).map(item => item.body), [{ slot: "18:45" }]);
});
