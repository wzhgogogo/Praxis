import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { chromium, type Browser, type BrowserContext, type Page } from "playwright-core";

import type { BrowserActionOptions, BrowserReadNetworkPolicy, BrowserResponseRule, BrowserControlHint, BrowserPageControl, BrowserRuntime, BrowserSession, BrowserSessionMetadata, BrowserSnapshot } from "./browser-runtime.js";
import { BrowserRuntimeError } from "./browser-runtime-errors.js";
import { PlaywrightReadNetworkGuard } from "./playwright-read-network-guard.js";
import { PlaywrightResponseObserver } from "./playwright-response-observer.js";
import { PlaywrightControlRegistry, waitForVisibleChange, interactiveState, activateObservedControl, observedLinkCovered } from "./playwright-browser-controls.js";

const INTERACTIVE_ACTION_TIMEOUT_MS = 5_000;

function actionTimeout(options: BrowserActionOptions): number {
  return options.timeoutMs ?? INTERACTIVE_ACTION_TIMEOUT_MS;
}

export interface LocalPlaywrightChromiumConfig {
  browserType?: Pick<typeof chromium, "launch"> & Partial<Pick<typeof chromium, "launchPersistentContext">>;
  /** Defaults to headless; interactive eval explicitly opts into headed Chromium. */
  headless?: boolean;
  /** Explicit local/eval proxy; otherwise use Chromium's normal network path. */
  proxyServer?: string;
  /** A dedicated, gitignored eval profile makes cookies persist across local eval sessions. */
  userDataDir?: string;
}

async function closeQuietly(value: { close(): Promise<void> } | undefined): Promise<void> {
  try { await value?.close(); } catch { /* cleanup must not hide the original failure */ }
}

class LocalPlaywrightChromiumSession implements BrowserSession {
  private closed = false;
  private readonly controls = new PlaywrightControlRegistry();
  private readonly responses = new PlaywrightResponseObserver();
  private readonly pageIds = new Map<Page, string>();
  private pageSequence = 0;
  readonly metadata: BrowserSessionMetadata;

  constructor(
    private readonly browser: Browser | undefined,
    private readonly context: BrowserContext,
    private page: Page,
    private readonly contextOwnsBrowser: boolean,
    private readonly networkGuard?: PlaywrightReadNetworkGuard,
  ) {
    this.metadata = {
      runtimeProvider: "LOCAL_PLAYWRIGHT_CHROMIUM",
      engine: "CHROMIUM",
      sessionId: `local:${randomUUID()}`,
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
      // adapter and local-fixture code keeps its explicit, code-owned locator capability.
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
    await this.run(() => this.page.locator(target).first().waitFor(timeoutMs === undefined ? {} : { timeout: timeoutMs }));
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
    await closeQuietly(this.page);
    await closeQuietly(this.context);
    if (!this.contextOwnsBrowser) await closeQuietly(this.browser);
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
  readonly readNetworkBoundaryCapability = "ISOLATED_CONTEXT" as const;
  constructor(private readonly config: LocalPlaywrightChromiumConfig = {}) {}

  static fromEnvironment(environment: NodeJS.ProcessEnv = process.env): LocalPlaywrightChromium {
    const interactive = environment.PRAXIS_LOCAL_CHROMIUM_INTERACTIVE === "1";
    const persistent = interactive && environment.PRAXIS_EVAL_ALLOW_TABELOG_MANUAL_INTERVENTION === "1";
    return new LocalPlaywrightChromium({
      ...(environment.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER?.trim()
        ? { proxyServer: environment.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER.trim() }
        : {}),
      ...(interactive ? {
          headless: false,
          // This directory is gitignored and deliberately never points to a user Chrome profile.
          ...(persistent ? { userDataDir: resolve(".eval-artifacts", "local-chromium-profile") } : {}),
        } : {}),
    });
  }

  async openSession(input: { signal: AbortSignal; networkPolicy?: BrowserReadNetworkPolicy; recordResponse?: (response: { url: string; method: string; status: number; contentType: string; body: Uint8Array }) => Promise<void> | void; replayHarPath?: string }): Promise<BrowserSession> {
    if (input.signal.aborted) throw new BrowserRuntimeError("BROWSER_ABORTED", "Local browser session creation was aborted");
    let browser: Browser | undefined;
    let context: BrowserContext | undefined;
    let page: Page | undefined;
    let contextOwnsBrowser = false;
    try {
      if ((input.networkPolicy || input.replayHarPath) && this.config.userDataDir) {
        throw new BrowserRuntimeError("BROWSER_RUNTIME_UNAVAILABLE", "Guarded browser reads require a new isolated context, not a persistent profile");
      }
      if (input.replayHarPath && !input.networkPolicy) {
        throw new BrowserRuntimeError("BROWSER_RUNTIME_UNAVAILABLE", "Browser replay requires an installed read network boundary");
      }
      const browserType = this.config.browserType ?? chromium;
      const launchOptions = {
        headless: this.config.headless ?? true,
        ...(this.config.proxyServer ? { proxy: { server: this.config.proxyServer } } : {}),
      };
      if (this.config.userDataDir) {
        if (!browserType.launchPersistentContext) {
          throw new Error("The configured Playwright browser type does not support persistent contexts");
        }
        context = await browserType.launchPersistentContext(this.config.userDataDir, launchOptions);
        contextOwnsBrowser = true;
      } else {
        browser = await browserType.launch(launchOptions);
        context = await browser.newContext((input.networkPolicy || input.replayHarPath) ? { serviceWorkers: "block" } : {});
      }
      const networkGuard = input.networkPolicy ? new PlaywrightReadNetworkGuard(input.networkPolicy, 5_000, input.recordResponse) : undefined;
      if (input.replayHarPath) await context.routeFromHAR(input.replayHarPath, { notFound: "abort" });
      if (networkGuard) await networkGuard.install(context, { replay: input.replayHarPath !== undefined });
      page = await context.newPage();
      const session = new LocalPlaywrightChromiumSession(browser, context, page, contextOwnsBrowser, networkGuard);
      if (input.signal.aborted) {
        await session.close();
        throw new BrowserRuntimeError("BROWSER_ABORTED", "Local browser creation was aborted");
      }
      input.signal.addEventListener("abort", () => { void session.close(); }, { once: true });
      return session;
    } catch (error) {
      await closeQuietly(page);
      await closeQuietly(context);
      if (!contextOwnsBrowser) await closeQuietly(browser);
      if (error instanceof BrowserRuntimeError) throw error;
      throw new BrowserRuntimeError(
        "BROWSER_RUNTIME_UNAVAILABLE",
        "Local Playwright Chromium could not launch a browser; install a Playwright Chromium browser binary before using PRAXIS_BROWSER_ENGINE=LOCAL_CHROMIUM",
        error,
      );
    }
  }
}
