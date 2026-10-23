import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { CloudflareBrowserRun } from "../../infrastructure/browser/cloudflare-browser-run.js";
import type { BrowserRuntime } from "../../infrastructure/browser/browser-runtime.js";

export const url = "https://www.tablecheck.com/en/fixture";
export const identity = '<h1>Fixture restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a>';

export function replayHar(url: string, html: string): string {
  return replayHarPages({ [url]: html });
}

export function replayHarPages(pages: Record<string, string>): string {
  return JSON.stringify({ log: { version: "1.2", creator: { name: "Praxis fixture", version: "1" }, entries: Object.entries(pages).map(([url, html]) => ({
    startedDateTime: "2026-10-07T00:00:00.000Z",
    request: { method: "GET", url, httpVersion: "HTTP/1.1", headers: [], queryString: [], cookies: [], headersSize: -1, bodySize: -1 },
    response: { status: 200, statusText: "OK", httpVersion: "HTTP/1.1", headers: [{ name: "content-type", value: "text/html; charset=utf-8" }], cookies: [], content: { size: html.length, mimeType: "text/html", text: html }, redirectURL: "", headersSize: -1, bodySize: -1 },
    cache: {}, timings: { send: 0, wait: 0, receive: 0 },
  })) } });
}

export function exactGuideAvailabilityUrl(sourceUrl: string, date: string, partySize: number, time: string): string {
  const value = new URL(sourceUrl);
  value.searchParams.set("date", date);
  value.searchParams.set("time", time);
  value.searchParams.set("num_people", String(partySize));
  value.searchParams.set("availability_format", "datetime");
  value.searchParams.set("availability_mode", "same_meal_time");
  return value.toString();
}

// Live H003 reached observed party controls but passed dom: references as CSS selectors.
// Exercise real Executor -> runtime -> DOM for both session implementations. The model
export function localFixture(html: string | Record<string, string>, runtimeKind: "LOCAL" | "CLOUDFLARE_SESSION" = "LOCAL", delayedNavigation?: { url: string; release: Promise<void>; finished(): void }) {
  const pages = typeof html === "string" ? { [url]: html } : html;
  const browserType = {
    async launch(options: Parameters<typeof chromium.launch>[0]) {
      const browser = await chromium.launch(options);
      const createContext = browser.newContext.bind(browser);
      browser.newContext = async (contextOptions) => {
        const context = await createContext(contextOptions);
        await context.route("**/*", async (route) => {
          if (route.request().url() === delayedNavigation?.url) {
            await delayedNavigation.release;
            try { await route.fulfill({ contentType: "text/html; charset=utf-8", body: "<title>Late old page</title><h1>Old candidate</h1>" }); }
            catch { /* Closing the timed-out session may already have canceled the old request. */ }
            finally { delayedNavigation.finished(); }
            return;
          }
          const body = pages[route.request().url()];
          return body === undefined
            ? route.abort()
            : route.fulfill({ contentType: body.startsWith("{") ? "application/json; charset=utf-8" : "text/html; charset=utf-8", body });
        });
        return context;
      };
      return browser;
    },
  };
  const runtime: BrowserRuntime = runtimeKind === "CLOUDFLARE_SESSION"
    ? new CloudflareBrowserRun({
      accountId: "fixture", apiToken: "fixture", engineMode: "CHROMIUM_ONLY",
      // Replace only the remote connection; exercise the production Cloudflare session on local Chromium.
      connectOverCdp: async () => {
        const browser = await browserType.launch({ headless: true });
        await browser.newContext();
        return browser;
      },
    })
    : new LocalPlaywrightChromium({ browserType });
  // The fixture intercepts every request itself.  It is not a production
  // isolated context, so probe code must not install a second policy whose
  // route.fetch would bypass this fixture's controlled response map.
  return { openSession: (input: Parameters<BrowserRuntime["openSession"]>[0]) => runtime.openSession(input) };
}

// Controlled widget transcribed from c-01 Matsumoto snapshot47: the real month
// anchors contain hidden icon text; the two visible Next buttons page guests
// and times. Scripted source behavior is a Fixture, not current Tabelog stock.
