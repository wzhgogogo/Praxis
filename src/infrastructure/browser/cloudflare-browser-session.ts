import { observePageImages } from "./observe-page-images.js";
import { chromium, type Browser, type BrowserContext, type Page, type ConnectOverCDPOptions } from "playwright-core";

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
import { PlaywrightControlRegistry, waitForPageSettled, pageBusyDiagnostics, interactiveState, activateObservedControl, observedLinkCovered } from "./playwright-browser-controls.js";

const INTERACTIVE_ACTION_TIMEOUT_MS = 5_000;

function actionTimeout(options: BrowserActionOptions): number {
  return options.timeoutMs ?? INTERACTIVE_ACTION_TIMEOUT_MS;
}

async function closeQuietly(value: { close(): Promise<void> } | undefined): Promise<void> {
  try { await value?.close(); } catch { /* remote browser may already be closed */ }
}

/** Shared connector retains Playwright's receiver; the production worker owns it. */
export const connectRemoteBrowser = (endpoint:string,options?:ConnectOverCDPOptions) => chromium.connectOverCDP(endpoint,options);

export class CloudflareBrowserSession implements BrowserSession {
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

  static async create(browser: Browser, engine: BrowserEngine, networkPolicy?: BrowserReadNetworkPolicy, recordResponse?: (response: { url: string; method: string; resourceType: string; status: number; contentType: string; body: Uint8Array; redirectLocation?: string }) => Promise<void> | void): Promise<CloudflareBrowserSession> {
    let context: BrowserContext | undefined;
    try {
      context = networkPolicy ? await browser.newContext({ serviceWorkers: "block" }) : browser.contexts()[0];
      if (!context) throw new BrowserRuntimeError("BROWSER_RUNTIME_FAILED", "Browser Run did not create a browser context");
      const networkGuard = networkPolicy ? new PlaywrightReadNetworkGuard(networkPolicy, 5_000, recordResponse,"REVIEWED_STATIC_BROWSER") : undefined;
      if (networkGuard) await networkGuard.install(context);
      const page = networkPolicy ? await context.newPage() : context.pages()[0] ?? await context.newPage();
      if (networkGuard) await networkGuard.preparePage(context, page);
      return new CloudflareBrowserSession(browser, engine, page, networkGuard);
    } catch (error) {
      await closeQuietly(context);
      await closeQuietly(browser);
      throw error;
    }
  }

  entryNavigationEvents() {return this.networkGuard?.entryNavigationEvents(this.page)??[];}

  async navigate(url: string, options: { waitUntil?: "domcontentloaded" | "load"; timeoutMs?: number } = {}): Promise<void> {
    await this.run(() => {
      this.responses.reset();
      if(this.networkGuard)return this.networkGuard.navigateEntry(this.page,url,options);
      return this.page.goto(url, {
      waitUntil: options.waitUntil ?? "domcontentloaded",
      ...(options.timeoutMs !== undefined ? { timeout: options.timeoutMs } : {}),
      }).then(()=>undefined);
    });
  }

  beginReadScope():void { this.networkGuard?.forms.beginReadScope(this.page); }

  async prepareNavigation(url: string, options: BrowserActionOptions = {}): Promise<void> { this.networkGuard?.prepareNavigation(url, options.timeoutMs); }
  async prepareObservedNavigation(url: string, options: BrowserActionOptions = {}): Promise<void> { this.networkGuard?.prepareObservedNavigation(url, options.timeoutMs); }

  async captureResponses(rules: readonly BrowserResponseRule[]): Promise<void> { this.responses.configure(this.page, rules); }

  private lastSettlement = true;
  private lastSettlementDiagnostic?: import("./browser-runtime.js").BrowserSettlementDiagnostics;
  settlementDiagnostics() { return this.lastSettlementDiagnostic; }

  async snapshot(): Promise<BrowserSnapshot> {
    return this.run(async () => {
      // Compare this snapshot's own endpoints, never the last wait's flag.
      // G1 separately proves the 500ms window between fresh snapshots.
      const textBefore = await this.page.locator("body").innerText();
      const state = await interactiveState(this.page).catch(() => undefined);
      const busy = await pageBusyDiagnostics(this.page);
      const snapshot:BrowserSnapshot = {
        settlement: this.lastSettlement ? "SETTLED" : "PENDING",
        ...(this.lastSettlementDiagnostic || this.networkGuard ? { settlementDiagnostics: { pendingByType: {}, oldestPendingMs: 0, blockingDataRequests: 0, visibleTextChanging: false, ...this.lastSettlementDiagnostic, url: this.page.url(), ...busy } } : {}),
        url: this.page.url(),
        html: await this.page.content(),
        images: await observePageImages(this.page),
        text: await this.page.locator("body").innerText(),
        title: await this.page.title(),
        ...(state === undefined ? {} : { interactiveState: state }),
        pageId: this.pageId(this.page),
        responses: await this.responses.snapshot(this.page),
        ...(this.networkGuard?.snapshotDiagnostics().length ? { networkDiagnostics: this.networkGuard.snapshotDiagnostics() } : {}),
        ...(this.networkGuard?.snapshotRequests().length ? { networkRequests: this.networkGuard.snapshotRequests() } : {}),
        ...(this.networkGuard?.snapshotResourceTypes().length ? { networkResourceTypes: this.networkGuard.snapshotResourceTypes() } : {}),
      };
      if (snapshot.settlementDiagnostics) snapshot.settlementDiagnostics.visibleTextChanging = textBefore !== snapshot.text;
      const activity = this.networkGuard?.settlementActivity();
      if (activity && snapshot.settlementDiagnostics) Object.assign(snapshot.settlementDiagnostics, {
        pendingByType: activity.pendingByType, oldestPendingMs: activity.oldestPendingMs, blockingDataRequests: activity.pending,
      });
      this.networkGuard?.forms.observePageText(this.page,snapshot.text);
      return snapshot;
    });
  }

  async observeControls(hints?: readonly BrowserControlHint[]): Promise<BrowserPageControl[]> { return this.run(async()=>{const controls=await this.controls.observe(this.page,hints);await this.networkGuard?.forms.observe(this.page);this.networkGuard?.forms.observePageControls(this.page,controls);return controls;}); }
  async click(target: string, options: BrowserActionOptions = {}): Promise<void> {
    this.networkGuard?.entryInteraction(this.page);
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
    this.networkGuard?.entryInteraction(this.page);
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
  async fill(target: string, value: string, options: BrowserActionOptions = {}): Promise<void> {
    this.networkGuard?.entryInteraction(this.page); await this.run(async () => {
    const element=await this.controls.target(target)??await this.page.locator(target).elementHandle();
    if(!element)throw new Error("Observed input is no longer available");
    if(this.networkGuard)await this.networkGuard.forms.fill(this.page,element,value,options.inputSource!,()=>element.fill(value,{timeout:actionTimeout(options)}));
    else await element.fill(value,{timeout:actionTimeout(options)});
  }); }
  async select(target: string, value: string, options: BrowserActionOptions = {}): Promise<string[]> {
    this.networkGuard?.entryInteraction(this.page); return this.run(async () => (await this.controls.target(target) ?? this.page.locator(target)).selectOption(value, { timeout: actionTimeout(options) })); }
  async setChecked(target: string, checked: boolean, options: BrowserActionOptions = {}): Promise<void> {
    this.networkGuard?.entryInteraction(this.page); await this.run(async () => { if (await this.controls.setChecked(target, checked, actionTimeout(options))) return; await this.page.locator(target).setChecked(checked, { timeout: actionTimeout(options) }); }); }
  async press(target: string, key: "ArrowLeft" | "ArrowRight", options: BrowserActionOptions = {}): Promise<void> {
    this.networkGuard?.entryInteraction(this.page); await this.run(async () => (await this.controls.target(target) ?? this.page.locator(target)).press(key, { timeout: actionTimeout(options) })); }
  async pressEscape(_options: BrowserActionOptions = {}): Promise<void> {
    this.networkGuard?.entryInteraction(this.page); await this.run(() => this.page.keyboard.press("Escape")); }
  async scroll(target: string, deltaY: number, options: BrowserActionOptions = {}): Promise<void> {
    this.networkGuard?.entryInteraction(this.page);
    await this.run(async () => {
      const observed = await this.controls.target(target);
      if (observed) await observed.evaluate((element, delta) => (element as HTMLElement).scrollBy(0, delta), deltaY);
      else await this.page.locator(target).evaluate((element, delta) => (element as HTMLElement).scrollBy(0, delta), deltaY);
    });
  }
  async dismissTransientObstruction(target: string, options: BrowserActionOptions = {}): Promise<{ occluder: string }> {
    this.networkGuard?.entryInteraction(this.page);
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
  async waitForSettled(previous: Pick<BrowserSnapshot, "url" | "title" | "text" | "interactiveState">, timeoutMs = 4_000): Promise<boolean> {
    this.lastSettlement = await this.run(() => waitForPageSettled(this.page, previous, timeoutMs, () => this.networkGuard?.settlementActivity() ?? { pending: 0, revision: 0 }, value => { this.lastSettlementDiagnostic = value; }));
    return this.lastSettlement;
  }
  async screenshot(): Promise<Uint8Array> { return this.run(() => this.page.screenshot()); }
  async screenshotLayoutOnly(): Promise<Uint8Array> {
    return this.run(async () => {
      const mask = await this.page.addStyleTag({ content: `*,*::before,*::after{color:transparent!important;text-shadow:none!important;background-image:none!important;caret-color:transparent!important}input,textarea,select,option{color:transparent!important;-webkit-text-fill-color:transparent!important}img,video,canvas,iframe,svg,picture{visibility:hidden!important}` });
      try { return await this.page.screenshot(); } finally { await mask.evaluate(element => element.parentNode?.removeChild(element)).catch(() => undefined); }
    });
  }

  isClosed(): boolean { return this.closed || this.page.isClosed() || !this.browser.isConnected(); }

  async flushRecordedResponses():Promise<void>{await this.networkGuard?.flushRecordedResponses();}

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await this.controls.dispose();
    await closeQuietly(this.browser);
    await this.networkGuard?.flushRecordedResponses();
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

