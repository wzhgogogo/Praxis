import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

import type { BrowserRuntime, BrowserSession, BrowserSessionMetadata, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";

export interface LocalPlaywrightChromiumConfig {
  browserType?: Pick<typeof chromium, "launch">;
}

async function closeQuietly(value: { close(): Promise<void> } | undefined): Promise<void> {
  try { await value?.close(); } catch { /* cleanup must not hide the original failure */ }
}

class LocalPlaywrightChromiumSession implements BrowserSession {
  private closed = false;
  readonly metadata: BrowserSessionMetadata = {
    runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM",
    engine: "CHROMIUM",
    startedAt: new Date().toISOString(),
  };

  constructor(
    private readonly browser: Browser,
    private readonly context: BrowserContext,
    private readonly page: Page,
  ) {}

  async navigate(url: string, options: { waitUntil?: "domcontentloaded" | "load"; timeoutMs?: number } = {}): Promise<void> {
    await this.run(() => this.page.goto(url, {
      waitUntil: options.waitUntil ?? "domcontentloaded",
      ...(options.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
    }));
  }

  async snapshot(): Promise<BrowserSnapshot> {
    return this.run(async () => ({
      url: this.page.url(),
      html: await this.page.content(),
      text: await this.page.locator("body").innerText(),
      title: await this.page.title(),
    }));
  }

  async click(target: string): Promise<void> { await this.run(() => this.page.locator(target).click()); }
  async fill(target: string, value: string): Promise<void> { await this.run(() => this.page.locator(target).fill(value)); }
  async select(target: string, value: string): Promise<string[]> { return this.run(() => this.page.locator(target).selectOption(value)); }
  async waitFor(target: string, timeoutMs?: number): Promise<void> {
    await this.run(() => this.page.locator(target).waitFor(timeoutMs === undefined ? {} : { timeout: timeoutMs }));
  }
  async screenshot(): Promise<Uint8Array> { return this.run(() => this.page.screenshot()); }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await closeQuietly(this.page);
    await closeQuietly(this.context);
    await closeQuietly(this.browser);
  }

  private async run<Value>(operation: () => Promise<Value>): Promise<Value> {
    if (this.closed) throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Local Playwright Chromium session is closed");
    try {
      return await operation();
    } catch (error) {
      if (error instanceof BrowserRuntimeError) throw error;
      throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Local Playwright Chromium operation failed", error);
    }
  }
}

/** Development/eval-only local browser runtime. It never uses Cloudflare credentials or endpoints. */
export class LocalPlaywrightChromium implements BrowserRuntime {
  constructor(private readonly config: LocalPlaywrightChromiumConfig = {}) {}

  static fromEnvironment(_environment: NodeJS.ProcessEnv = process.env): LocalPlaywrightChromium {
    return new LocalPlaywrightChromium();
  }

  async openSession(input: { signal: AbortSignal }): Promise<BrowserSession> {
    if (input.signal.aborted) throw new BrowserRuntimeError("BROWSER_ABORTED", "Local browser session creation was aborted");
    let browser: Browser | undefined;
    let context: BrowserContext | undefined;
    let page: Page | undefined;
    try {
      browser = await (this.config.browserType ?? chromium).launch({ headless: true });
      context = await browser.newContext();
      page = await context.newPage();
      const session = new LocalPlaywrightChromiumSession(browser, context, page);
      input.signal.addEventListener("abort", () => { void session.close(); }, { once: true });
      return session;
    } catch (error) {
      await closeQuietly(page);
      await closeQuietly(context);
      await closeQuietly(browser);
      throw new BrowserRuntimeError(
        "BROWSER_RUNTIME_FAILED",
        "Local Playwright Chromium could not launch a browser; install a Playwright Chromium browser binary before using PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM",
        error,
      );
    }
  }
}
