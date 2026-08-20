import assert from "node:assert/strict";
import { test } from "node:test";

import { CloudflareBrowserRun } from "./cloudflare-browser-run.js";

function fakeBrowser(onClose: () => void) {
  const page = {
    goto: async () => null,
    content: async () => "<html><body>ok</body></html>",
    locator: () => ({ innerText: async () => "ok", click: async () => {}, fill: async () => {}, selectOption: async () => {}, waitFor: async () => {} }),
    title: async () => "ok",
    screenshot: async () => new Uint8Array(),
    url: () => "https://example.test",
  };
  return {
    contexts: () => [{ pages: () => [page], newPage: async () => page }],
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
