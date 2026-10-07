import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";

import { CloudflareBrowserRun } from "./cloudflare-browser-run.js";

function fakeBrowser(onClose: () => void, options: { guardedContextError?: Error; routeError?: Error; onContextClose?: () => void } = {}) {
  const page = {
    goto: async () => null,
    content: async () => "<html><body>ok</body></html>",
    locator: () => ({ innerText: async () => "ok", click: async () => {}, fill: async () => {}, selectOption: async () => {}, waitFor: async () => {} }),
    title: async () => "ok",
    screenshot: async () => new Uint8Array(),
    url: () => "https://example.test",
  };
  const context = {
    pages: () => [page], newPage: async () => page,
    route: async () => { if (options.routeError) throw options.routeError; },
    routeWebSocket: async () => {}, close: async () => { options.onContextClose?.(); },
  };
  return {
    contexts: () => [context],
    newContext: async () => {
      if (options.guardedContextError) throw options.guardedContextError;
      return context;
    },
    close: async () => { onClose(); },
  };
}

test("Browser Run keeps Kitesurf on successful AUTO session creation", async () => {
  const endpoints: string[] = [];
  const runtime = new CloudflareBrowserRun({
    accountId: "account", apiToken: "token",
    connectOverCdp: async (endpoint) => { endpoints.push(String(endpoint)); return fakeBrowser(() => {}) as never; },
  });
  const session = await runtime.openSession({ signal: new AbortController().signal });
  assert.equal(session.metadata.engine, "KITESURF");
  assert.equal(endpoints.length, 1);
  assert.match(endpoints[0]!, /browser=kitesurf/);
  await session.close();
});

test("Browser Run preserves the Playwright receiver for its default CDP connector", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(chromium, "connectOverCDP");
  let receivedThis: unknown;
  Object.defineProperty(chromium, "connectOverCDP", {
    configurable: true,
    value: async function (this: unknown) {
      receivedThis = this;
      return fakeBrowser(() => {}) as never;
    },
  });
  try {
    const runtime = new CloudflareBrowserRun({ accountId: "account", apiToken: "token" });
    const session = await runtime.openSession({ signal: new AbortController().signal });
    assert.equal(receivedThis, chromium);
    await session.close();
  } finally {
    if (descriptor) Object.defineProperty(chromium, "connectOverCDP", descriptor);
    else delete (chromium as { connectOverCDP?: unknown }).connectOverCDP;
  }
});

test("Browser Run falls back once from Kitesurf to Chromium and does not loop", async () => {
  const endpoints: string[] = [];
  const runtime = new CloudflareBrowserRun({
    accountId: "account", apiToken: "token",
    connectOverCdp: async (endpoint) => {
      const url = String(endpoint);
      endpoints.push(url);
      if (url.includes("kitesurf")) throw new Error("Kitesurf compatibility failure");
      return fakeBrowser(() => {}) as never;
    },
  });
  const session = await runtime.openSession({ signal: new AbortController().signal });
  assert.equal(session.metadata.engine, "CHROMIUM");
  assert.equal(endpoints.length, 2);
  await session.close();
});

test("Browser Run returns a stable failure after both engines fail", async () => {
  let attempts = 0;
  const runtime = new CloudflareBrowserRun({
    accountId: "account", apiToken: "token",
    connectOverCdp: async () => { attempts += 1; throw new Error("remote unavailable"); },
  });
  await assert.rejects(runtime.openSession({ signal: new AbortController().signal }), /Cloudflare Browser Run could not open/);
  assert.equal(attempts, 2);
});

test("Browser Run closes a remote session after AbortSignal", async () => {
  let closed = 0;
  const runtime = new CloudflareBrowserRun({
    accountId: "account", apiToken: "token",
    connectOverCdp: async () => fakeBrowser(() => { closed += 1; }) as never,
  });
  const controller = new AbortController();
  await runtime.openSession({ signal: controller.signal });
  controller.abort();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(closed, 1);
});

test("Browser Run closes its remote browser when isolated guard setup fails", async () => {
  let closed = 0;
  let contextsClosed = 0;
  const runtime = new CloudflareBrowserRun({
    accountId: "account", apiToken: "token",
    connectOverCdp: async () => fakeBrowser(() => { closed += 1; }, { routeError: new Error("guard route unavailable"), onContextClose: () => { contextsClosed += 1; } }) as never,
  });
  await assert.rejects(
    runtime.openSession({ signal: new AbortController().signal, networkPolicy: { documentOrigins: ["https://public.example"], staticResources: [], dynamicReads: [] } }),
    /Cloudflare Browser Run could not open/,
  );
  assert.equal(closed, 2, "AUTO closes each connected engine after its isolated context fails");
  assert.equal(contextsClosed, 2, "guard setup does not leave isolated contexts behind");
});
