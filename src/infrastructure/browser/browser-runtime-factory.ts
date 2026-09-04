import type { BrowserRuntime } from "./browser-runtime.js";
import { CloudflareBrowserRun } from "./cloudflare-browser-run.js";
import { LocalPlaywrightChromium } from "./local-playwright-chromium.js";

export type PraxisBrowserEngineSelection = "AUTO" | "KITESURF" | "CHROMIUM" | "LOCAL_CHROMIUM";

/** Selects a development/eval BrowserRuntime without exposing provider choice to Domain code. */
export function browserRuntimeFromEnvironment(environment: NodeJS.ProcessEnv = process.env): BrowserRuntime {
  return environment.PRAXIS_BROWSER_ENGINE === "LOCAL_CHROMIUM"
    ? LocalPlaywrightChromium.fromEnvironment(environment)
    : CloudflareBrowserRun.fromEnvironment(environment);
}
