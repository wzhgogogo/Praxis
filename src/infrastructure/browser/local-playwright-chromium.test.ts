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
      PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION: manual,
    });
    const session = await runtime.openSession({ signal: new AbortController().signal });
    await session.close();
    assert.deepEqual(launches.at(-1), expected, `interactive=${interactive}, manual=${manual}`);
  }
  assert.deepEqual(counts, { page: 4, context: 4, browser: 3 });
  for (const interactive of ["0", "1"]) {
    const runtime = LocalPlaywrightChromium.fromEnvironment({
      PRAXIS_LOCAL_CHROMIUM_INTERACTIVE: interactive,
      PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION: interactive,
      PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER: "http://127.0.0.1:10808",
    });
    const session = await runtime.openSession({ signal: new AbortController().signal });
    await session.close();
    assert.deepEqual(launches.at(-1), {
      headless: interactive === "0",
      proxy: { server: "http://127.0.0.1:10808" },
      ...(interactive === "1" ? { userDataDir: resolve(".eval-artifacts", "local-chromium-profile") } : {}),
    });
  }
});

test("Local Playwright Chromium maps launch failures into the fail-closed BrowserRuntime error", async () => {
  const runtime = new LocalPlaywrightChromium({ browserType: { launch: async () => { throw new Error("browser binary missing"); } } });
  await assert.rejects(
    runtime.openSession({ signal: new AbortController().signal }),
    (error: unknown) => error instanceof BrowserRuntimeError && error.code === "BROWSER_RUNTIME_UNAVAILABLE" && /install a Playwright Chromium browser binary/.test(error.message),
  );
});

test("Local Playwright Chromium installs HAR replay before the Guard and refuses replay without that boundary", async () => {
  const calls: string[] = [];
  const page = {
    goto: async () => null, content: async () => "<main>Replay</main>", locator: () => ({ innerText: async () => "Replay", click: async () => {}, fill: async () => {}, selectOption: async () => [], waitFor: async () => {} }),
    title: async () => "Replay", screenshot: async () => new Uint8Array(), url: () => "https://replay.example/guide", close: async () => {}, keyboard: { press: async () => {} },
  };
  const context = {
    newPage: async () => page,
    routeFromHAR: async (_path: string, options: { notFound: string }) => { calls.push(`har:${options.notFound}`); },
    routeWebSocket: async () => { calls.push("websocket"); },
    route: async () => { calls.push("guard-route"); },
    close: async () => {},
  };
  const runtime = new LocalPlaywrightChromium({ browserType: { launch: async () => ({ newContext: async () => context, close: async () => {} }) as never } });
  const policy = { documentOrigins: ["https://replay.example"], genericPublicRead: true, staticResources: [], dynamicReads: [] } as const;
  await assert.rejects(runtime.openSession({ signal: new AbortController().signal, replayHarPath: "/tmp/replay.har" }), BrowserRuntimeError);
  const session = await runtime.openSession({ signal: new AbortController().signal, networkPolicy: policy, replayHarPath: "/tmp/replay.har" });
  assert.deepEqual(calls, ["har:abort", "websocket", "guard-route"]);
  assert.equal(session.metadata.readNetworkBoundary, "INSTALLED");
  await session.close();
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

test("layout-only screenshot is a PNG and leaves observed controls unchanged", async () => {
  const runtime = new LocalPlaywrightChromium();
  const session = await runtime.openSession({ signal: new AbortController().signal });
  try {
    await session.navigate("data:text/html,<button id=keep type=button>Keep</button><input value=private>");
    const before = await session.observeControls?.();
    const png = await session.screenshotLayoutOnly?.();
    const after = await session.observeControls?.();
    assert.ok(png && png[0] === 137 && png[1] === 80 && png[2] === 78 && png[3] === 71);
    assert.deepEqual(after?.map(item => [item.kind, item.label, item.value]), before?.map(item => [item.kind, item.label, item.value]));
  } finally { await session.close(); }
});
