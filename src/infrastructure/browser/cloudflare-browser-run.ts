import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

import type {
  BrowserEngine,
  BrowserEngineMode,
  BrowserActionOptions,
  BrowserReadNetworkPolicy,
  BrowserResponseRule, BrowserControlHint, BrowserPageControl,
  BrowserRuntime,
  BrowserSession,
  BrowserSessionMetadata,
  BrowserSnapshot,
} from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";
import { PlaywrightReadNetworkGuard } from "./playwright-read-network-guard.js";
import { PlaywrightResponseObserver } from "./playwright-response-observer.js";
import { PlaywrightControlRegistry, waitForVisibleChange, interactiveState, activateObservedControl, observedLinkCovered } from "./playwright-browser-controls.js";

const INTERACTIVE_ACTION_TIMEOUT_MS = 5_000;

function actionTimeout(options: BrowserActionOptions): number {
  return options.timeoutMs ?? INTERACTIVE_ACTION_TIMEOUT_MS;
}

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

async function closeQuietly(value: { close(): Promise<void> } | undefined): Promise<void> {
  try { await value?.close(); } catch { /* remote browser may already be closed */ }
}

class CloudflareBrowserSession implements BrowserSession {
  private closed = false;
  private readonly controls = new PlaywrightControlRegistry();
  private readonly responses = new PlaywrightResponseObserver();
  private readonly pageIds = new Map<Page, string>();
  private pageSequence = 0;
  readonly metadata: BrowserSessionMetadata;

  private constructor(private readonly browser: Browser, engine: BrowserEngine, private page: Page, private readonly networkGuard?: PlaywrightReadNetworkGuard) {
    this.metadata = {
      runtimeProvider: "CLOUDFLARE_BROWSER_RUN",
      engine,
      startedAt: new Date().toISOString(),
      ...(networkGuard ? { readNetworkBoundary: "INSTALLED" } : {}),
    };
  }

  private pageId(page: Page): string {
    const existing = this.pageIds.get(page);
    if (existing) return existing;
    const created = `page:${++this.pageSequence}`;
    this.pageIds.set(page, created);
    return created;
  }

  static async create(browser: Browser, engine: BrowserEngine, networkPolicy?: BrowserReadNetworkPolicy, recordResponse?: (response: { url: string; method: string; status: number; contentType: string; body: Uint8Array }) => Promise<void> | void): Promise<CloudflareBrowserSession> {
    let context: BrowserContext | undefined;
    try {
      context = networkPolicy ? await browser.newContext({ serviceWorkers: "block" }) : browser.contexts()[0];
      if (!context) throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Browser Run did not create a browser context");
      const networkGuard = networkPolicy ? new PlaywrightReadNetworkGuard(networkPolicy, 5_000, recordResponse) : undefined;
      if (networkGuard) await networkGuard.install(context);
      const page = networkPolicy ? await context.newPage() : context.pages()[0] ?? await context.newPage();
      return new CloudflareBrowserSession(browser, engine, page, networkGuard);
    } catch (error) {
      await closeQuietly(context);
      await closeQuietly(browser);
      throw error;
    }
  }

  async navigate(url: string, options: { waitUntil?: "domcontentloaded" | "load"; timeoutMs?: number } = {}): Promise<void> {
    await this.run(() => {
      this.responses.reset();
      return this.page.goto(url, {
      waitUntil: options.waitUntil ?? "domcontentloaded",
      ...(options.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
      });
    });
  }

  async prepareNavigation(url: string, options: BrowserActionOptions = {}): Promise<void> { this.networkGuard?.prepareNavigation(url, options.timeoutMs); }
  async prepareObservedNavigation(url: string, options: BrowserActionOptions = {}): Promise<void> { this.networkGuard?.prepareObservedNavigation(url, options.timeoutMs); }

  async captureResponses(rules: readonly BrowserResponseRule[]): Promise<void> { this.responses.configure(this.page, rules); }

  async snapshot(): Promise<BrowserSnapshot> {
    return this.run(async () => {
      const state = await interactiveState(this.page).catch(() => undefined);
      return {
        url: this.page.url(),
        html: await this.page.content(),
        text: await this.page.locator("body").innerText(),
        title: await this.page.title(),
        ...(state === undefined ? {} : { interactiveState: state }),
        pageId: this.pageId(this.page),
        responses: await this.responses.snapshot(this.page),
        ...(this.networkGuard?.snapshotDiagnostics().length ? { networkDiagnostics: this.networkGuard.snapshotDiagnostics() } : {}),
        ...(this.networkGuard?.snapshotRequests().length ? { networkRequests: this.networkGuard.snapshotRequests() } : {}),
      };
    });
  }

  async observeControls(hints?: readonly BrowserControlHint[]): Promise<BrowserPageControl[]> { return this.run(() => this.controls.observe(this.page, hints)); }
  async click(target: string, options: BrowserActionOptions = {}): Promise<void> {
    await this.run(async () => {
      const timeout = actionTimeout(options);
      const locator = await this.controls.target(target);
      // Only BrowserTaskExecutor passes opaque `dom:` references. Existing deterministic
      // adapter code keeps its explicit, code-owned locator capability.
      if (locator) await activateObservedControl(locator, timeout);
      else await this.page.locator(target).click({ timeout });
    });
  }
  async openLink(target: string, observedHref?: string, options: BrowserActionOptions = {}): Promise<void> {
    await this.run(async () => {
      const timeout = actionTimeout(options);
      const locator = await this.controls.target(target);
      if (!locator) throw new Error("Observed link reference is no longer available");
      if (observedHref && await observedLinkCovered(locator, observedHref, timeout)) {
        this.responses.reset();
        await this.page.goto(observedHref, { waitUntil: "domcontentloaded", timeout });
        return;
      }
      const opener = this.page;
      const popup = opener.waitForEvent("popup", { timeout: Math.min(1_000, timeout) }).catch(() => undefined);
      await locator.click({ timeout });
      const next = await popup;
      if (!next) return;
      this.page = next;
      this.pageId(next);
      await next.waitForLoadState("domcontentloaded", { timeout: Math.min(2_500, timeout) }).catch(() => undefined);
    });
  }
  async fill(target: string, value: string, options: BrowserActionOptions = {}): Promise<void> { await this.run(async () => (await this.controls.target(target) ?? this.page.locator(target)).fill(value, { timeout: actionTimeout(options) })); }
  async select(target: string, value: string, options: BrowserActionOptions = {}): Promise<string[]> { return this.run(async () => (await this.controls.target(target) ?? this.page.locator(target)).selectOption(value, { timeout: actionTimeout(options) })); }
  async setChecked(target: string, checked: boolean, options: BrowserActionOptions = {}): Promise<void> { await this.run(async () => { if (await this.controls.setChecked(target, checked, actionTimeout(options))) return; await this.page.locator(target).setChecked(checked, { timeout: actionTimeout(options) }); }); }
  async press(target: string, key: "ArrowLeft" | "ArrowRight", options: BrowserActionOptions = {}): Promise<void> { await this.run(async () => (await this.controls.target(target) ?? this.page.locator(target)).press(key, { timeout: actionTimeout(options) })); }
  async pressEscape(_options: BrowserActionOptions = {}): Promise<void> { await this.run(() => this.page.keyboard.press("Escape")); }
  async scroll(target: string, deltaY: number, options: BrowserActionOptions = {}): Promise<void> {
    await this.run(async () => {
      const observed = await this.controls.target(target);
      if (observed) await observed.evaluate((element, delta) => (element as HTMLElement).scrollBy(0, delta), deltaY);
      else await this.page.locator(target).evaluate((element, delta) => (element as HTMLElement).scrollBy(0, delta), deltaY);
    });
  }
  async dismissTransientObstruction(target: string, options: BrowserActionOptions = {}): Promise<{ occluder: string }> {
    return this.run(async () => {
      void actionTimeout(options);
      const observed = await this.controls.target(target);
      if (!observed) throw new BrowserRuntimeError("BROWSER_STALE_TARGET", "Observed target changed before obstruction recovery");
      const occluder = await observed.evaluate(node => {
        const rect = node.getBoundingClientRect();
        const hit = rect.width && rect.height ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
        if (!hit || node.contains(hit)) return "UNKNOWN";
        const role = hit.getAttribute("role");
        return `${hit.tagName.toLowerCase()}${role ? `[role=${role.slice(0, 32)}]` : ""}`;
      });
      await this.page.keyboard.press("Escape");
      await this.page.evaluate(() => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && active !== document.body) active.blur();
      });
      return { occluder };
    });
  }
  async waitFor(target: string, timeoutMs?: number): Promise<void> {
    await this.run(() => this.page.locator(target).waitFor(timeoutMs === undefined ? {} : { timeout: timeoutMs }));
  }
  async waitForChange(previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">, timeoutMs = 2_500): Promise<boolean> {
    return this.run(() => waitForVisibleChange(this.page, previous, timeoutMs));
  }
  async screenshot(): Promise<Uint8Array> { return this.run(() => this.page.screenshot()); }
  async screenshotLayoutOnly(): Promise<Uint8Array> {
    return this.run(async () => {
      const mask = await this.page.addStyleTag({ content: `*,*::before,*::after{color:transparent!important;text-shadow:none!important;background-image:none!important;caret-color:transparent!important}input,textarea,select,option{color:transparent!important;-webkit-text-fill-color:transparent!important}img,video,canvas,iframe,svg,picture{visibility:hidden!important}` });
      try { return await this.page.screenshot(); } finally { await mask.evaluate(element => element.parentNode?.removeChild(element)).catch(() => undefined); }
    });
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.controls.dispose();
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
  readonly readNetworkBoundaryCapability = "ISOLATED_CONTEXT" as const;
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

  async openSession(input: { signal: AbortSignal; engineMode?: BrowserEngineMode; networkPolicy?: BrowserReadNetworkPolicy; recordResponse?: (response: { url: string; method: string; status: number; contentType: string; body: Uint8Array }) => Promise<void> | void; replayHarPath?: string }): Promise<BrowserSession> {
    if (input.signal.aborted) throw new BrowserRuntimeError("BROWSER_ABORTED", "Browser session creation was aborted");
    // routeFromHAR is a local Playwright capability.  A remote CDP session
    // cannot promise that a missing replay entry stays off the remote network,
    // so reject instead of silently opening a live Cloudflare page.
    if (input.replayHarPath) {
      throw new BrowserRuntimeError("BROWSER_RUNTIME_UNAVAILABLE", "Cloudflare Browser Run does not support isolated HAR replay");
    }
    const mode = input.engineMode ?? this.mode;
    let lastError: unknown;
    for (const engine of candidateEngines(mode)) {
      try {
        // `connectOverCDP` is a BrowserType method. Calling an extracted
        // default function loses its Playwright receiver; injected tests keep
        // their explicit callback contract.
        const browser = this.config.connectOverCdp
          ? await this.config.connectOverCdp(endpoint(this.config.accountId, engine), {
              headers: { Authorization: `Bearer ${this.config.apiToken}` },
              timeout: this.connectTimeoutMs,
            })
          : await chromium.connectOverCDP(endpoint(this.config.accountId, engine), {
          headers: { Authorization: `Bearer ${this.config.apiToken}` },
          timeout: this.connectTimeoutMs,
        });
        const session = await CloudflareBrowserSession.create(browser, engine, input.networkPolicy, input.recordResponse);
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
