import type { Page, Request, Response } from "playwright-core";
import type { BrowserCapturedResponse, BrowserResponseRule } from "./browser-runtime.js";

/** Passive, opt-in GET JSON observation. Never stores headers/cookies or issues requests. */
export class PlaywrightResponseObserver {
  private page: Page | undefined;
  private rules: readonly BrowserResponseRule[] = [];
  private generation = 0;
  private sequence = 0;
  private requests = new WeakMap<Request, { generation: number; sequence: number }>();
  private pending = new Set<Promise<void>>();
  private records: BrowserCapturedResponse[] = [];
  private readonly onRequest = (request: Request) => {
    if (this.allowed(request)) {
      // A new query invalidates the preceding result immediately, before its
      // response arrives. A late older response must not restore stale stock.
      this.records = [];
      this.requests.set(request, { generation: this.generation, sequence: ++this.sequence });
    }
  };
  private readonly onResponse = (response: Response) => {
    const tracked = this.requests.get(response.request());
    if (!tracked || tracked.generation !== this.generation || !this.allowed(response.request())) return;
    const promise = this.record(response, tracked).finally(() => this.pending.delete(promise));
    this.pending.add(promise);
  };
  configure(page: Page, rules: readonly BrowserResponseRule[]): void {
    this.page?.off("request", this.onRequest);
    this.page?.off("response", this.onResponse);
    this.page = page;
    this.rules = rules.map(rule => ({ ...rule }));
    this.reset();
    page.on("request", this.onRequest);
    page.on("response", this.onResponse);
  }
  reset(): void { this.generation += 1; this.records = []; }
  private allowed(request: Request): boolean {
    if (request.method() !== "GET") return false;
    const url = new URL(request.url());
    return this.rules.some(rule => url.origin === rule.origin && url.pathname === rule.pathname);
  }
  private async record(response: Response, tracked: { generation: number; sequence: number }): Promise<void> {
    try {
      if (!/application\/json/i.test(response.headers()["content-type"] ?? "")) return;
      const text = await response.text();
      if (text.length > 131072 || tracked.generation !== this.generation || tracked.sequence !== this.sequence) return;
      const body: unknown = JSON.parse(text);
      this.records = [{ url: response.url(), status: response.status(), observedAt: new Date().toISOString(), sequence: tracked.sequence, body }];
    } catch { /* Failed/oversized/non-JSON responses cannot establish source evidence. */ }
  }
  async snapshot(page: Page): Promise<BrowserCapturedResponse[]> {
    if (page !== this.page) return [];
    await Promise.allSettled([...this.pending]);
    return structuredClone(this.records);
  }
}
