import { chromium, type Browser, type Page } from "playwright-core";

import type {
  BrowserEngine,
  BrowserEngineMode,
  BrowserPageControl,
  BrowserRuntime,
  BrowserSession,
  BrowserSessionMetadata,
  BrowserSnapshot,
} from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";
import { PlaywrightControlRegistry, waitForVisibleChange } from "./playwright-browser-controls.js";

export interface CloudflareBrowserRunConfig {
  accountId: string;
  apiToken: string;
  engineMode?: BrowserEngineMode;
  connectTimeoutMs?: number;
  connectOverCdp?: typeof chromium.connectOverCDP;
}

function required(value: string | undefined, variable: string): string {
  if (!value?.trim()) throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", `${variable} is required for Browser Run`);
  return value;
}

function endpoint(accountId: string, engine: BrowserEngine): string {
  const base = `wss://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/browser-run/devtools/browser`;
  return engine === "KITESURF" ? `${base}?browser=kitesurf` : base;
}

function candidateEngines(mode: BrowserEngineMode): BrowserEngine[] {
  switch (mode) {
    case "KITESURF_ONLY": return ["KITESURF"];
    case "CHROMIUM_ONLY": return ["CHROMIUM"];
    case "AUTO": return ["KITESURF", "CHROMIUM"];
  }
}

function fallbackEligible(error: unknown): boolean {
  return !(error instanceof BrowserRuntimeError && error.code === "BROWSER_ABORTED");
}

async function closeQuietly(browser: Browser): Promise<void> {
  try { await browser.close(); } catch { /* remote browser may already be closed */ }
}

class CloudflareBrowserSession implements BrowserSession {
  private closed = false;
  private readonly controls = new PlaywrightControlRegistry();
  readonly metadata: BrowserSessionMetadata;

  private constructor(private readonly browser: Browser, engine: BrowserEngine, private readonly page: Page) {
    this.metadata = {
      runtimeProvider: "CLOUDFLARE_BROWSER_RUN",
      engine,
      startedAt: new Date().toISOString(),
    };
  }

  static async create(browser: Browser, engine: BrowserEngine): Promise<CloudflareBrowserSession> {
    const context = browser.contexts()[0];
    if (!context) {
      await closeQuietly(browser);
      throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Browser Run did not create a browser context");
    }
    const page = context.pages()[0] ?? await context.newPage();
    return new CloudflareBrowserSession(browser, engine, page);
  }

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

  async observeControls(): Promise<BrowserPageControl[]> { return this.run(() => this.controls.observe(this.page)); }
  async click(target: string): Promise<void> {
    await this.run(async () => {
      const locator = this.controls.locator(target);
      // Only BrowserTaskExecutor passes opaque `dom:` references. Existing deterministic
      // adapter code keeps its explicit, code-owned locator capability.
      await (locator ?? this.page.locator(target)).click();
    });
  }
  async fill(target: string, value: string): Promise<void> { await this.run(() => this.page.locator(target).fill(value)); }
  async select(target: string, value: string): Promise<string[]> { return this.run(() => this.page.locator(target).selectOption(value)); }
  async waitFor(target: string, timeoutMs?: number): Promise<void> {
    await this.run(() => this.page.locator(target).waitFor(timeoutMs === undefined ? {} : { timeout: timeoutMs }));
  }
  async waitForChange(previous: Pick<BrowserSnapshot, "url" | "title" | "text">, timeoutMs = 2_500): Promise<boolean> {
    return this.run(() => waitForVisibleChange(this.page, previous, timeoutMs));
  }
  async screenshot(): Promise<Uint8Array> { return this.run(() => this.page.screenshot()); }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await closeQuietly(this.browser);
  }

  private async run<Value>(operation: () => Promise<Value>): Promise<Value> {
    if (this.closed) throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Browser session is closed");
    try {
      return await operation();
    } catch (error) {
      if (error instanceof BrowserRuntimeError) throw error;
      throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Browser Run operation failed", error);
    }
  }
}

export class CloudflareBrowserRun implements BrowserRuntime {
  private readonly mode: BrowserEngineMode;
  private readonly connectTimeoutMs: number;

  constructor(private readonly config: CloudflareBrowserRunConfig) {
    required(config.accountId, "CLOUDFLARE_ACCOUNT_ID");
    required(config.apiToken, "CLOUDFLARE_API_TOKEN");
    this.mode = config.engineMode ?? "AUTO";
    this.connectTimeoutMs = config.connectTimeoutMs ?? 12_000;
  }

  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): CloudflareBrowserRun {
    const configured = environment.PRAXIS_BROWSER_ENGINE;
    const engineMode: BrowserEngineMode = configured === "KITESURF" ? "KITESURF_ONLY"
      : configured === "CHROMIUM" ? "CHROMIUM_ONLY" : "AUTO";
    return new CloudflareBrowserRun({
      accountId: environment.CLOUDFLARE_ACCOUNT_ID ?? "",
      apiToken: environment.CLOUDFLARE_API_TOKEN ?? "",
      engineMode,
    });
  }

  async openSession(input: { signal: AbortSignal; engineMode?: BrowserEngineMode }): Promise<BrowserSession> {
    if (input.signal.aborted) throw new BrowserRuntimeError("BROWSER_ABORTED", "Browser session creation was aborted");
    const mode = input.engineMode ?? this.mode;
    let lastError: unknown;
    for (const engine of candidateEngines(mode)) {
      try {
        const browser = await (this.config.connectOverCdp ?? chromium.connectOverCDP)(endpoint(this.config.accountId, engine), {
          headers: { Authorization: `Bearer ${this.config.apiToken}` },
          timeout: this.connectTimeoutMs,
        });
        const session = await CloudflareBrowserSession.create(browser, engine);
        const onAbort = () => { void session.close(); };
        input.signal.addEventListener("abort", onAbort, { once: true });
        return session;
      } catch (error) {
        lastError = error;
        if (!fallbackEligible(error) || engine === "CHROMIUM" || mode !== "AUTO") break;
      }
    }
    throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Cloudflare Browser Run could not open a browser session", lastError);
  }
}
