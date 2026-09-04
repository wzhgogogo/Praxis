import assert from "node:assert/strict";
import { test } from "node:test";

import { browserRuntimeFromEnvironment } from "./browser-runtime-factory.js";
import { CloudflareBrowserRun } from "./cloudflare-browser-run.js";
import { LocalPlaywrightChromium } from "./local-playwright-chromium.js";

test("LOCAL_CHROMIUM selects the local runtime without requiring or constructing Cloudflare configuration", () => {
  const runtime = browserRuntimeFromEnvironment({ PRAXIS_BROWSER_ENGINE: "LOCAL_CHROMIUM" });
  assert.ok(runtime instanceof LocalPlaywrightChromium);
});

test("AUTO, KITESURF, and CHROMIUM preserve Cloudflare runtime selection", () => {
  for (const engine of [undefined, "AUTO", "KITESURF", "CHROMIUM"] as const) {
    const runtime = browserRuntimeFromEnvironment({
      ...(engine ? { PRAXIS_BROWSER_ENGINE: engine } : {}),
      CLOUDFLARE_ACCOUNT_ID: "account",
      CLOUDFLARE_API_TOKEN: "token",
    });
    assert.ok(runtime instanceof CloudflareBrowserRun);
  }
});
