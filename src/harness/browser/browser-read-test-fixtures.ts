import { chromium } from "playwright-core";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { CloudflareBrowserRun } from "../../infrastructure/browser/cloudflare-browser-run.js";
import type { BrowserRuntime, BrowserSession, BrowserReadNetworkPolicy } from "../../infrastructure/browser/browser-runtime.js";

export const url = "https://www.tablecheck.com/en/fixture";
export const identity = '<h1>Fixture restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a>';

export function replayHar(url: string, html: string): string {
  return replayHarPages({ [url]: html });
}

export function replayHarPages(pages: Record<string, string>): string {
  return JSON.stringify({ log: { version: "1.2", creator: { name: "Praxis fixture", version: "1" }, entries: Object.entries(pages).map(([url, html]) => ({
    startedDateTime: "2026-10-07T00:00:00.000Z",
    request: { method: "GET", url, httpVersion: "HTTP/1.1", headers: [], queryString: [], cookies: [], headersSize: -1, bodySize: -1 },
    response: { status: 200, statusText: "OK", httpVersion: "HTTP/1.1", headers: [{ name: "content-type", value: html.startsWith("{") ? "application/json; charset=utf-8" : "text/html; charset=utf-8" }], cookies: [], content: { size: html.length, mimeType: html.startsWith("{") ? "application/json" : "text/html", text: html }, redirectURL: "", headersSize: -1, bodySize: -1 },
    cache: {}, timings: { send: 0, wait: 0, receive: 0 },
  })) } });
}

/** Constructed response corpus through the real local Guard; HAR misses abort. */
export async function guardedPages(pages:Record<string,string>,policy:BrowserReadNetworkPolicy){
  const directory=await mkdtemp(join(tmpdir(),"public-source-fixture-")),har=join(directory,"pages.har");
  await writeFile(har,replayHarPages(pages));const raw=new LocalPlaywrightChromium(),sessions:BrowserSession[]=[];
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",async openSession(input){const session=await raw.openSession({...input,networkPolicy:input.networkPolicy??policy,replayHarPath:har});sessions.push(session);return session;}};
  return {runtime,async close(){try{await Promise.all(sessions.map(session=>session.close()));}finally{await rm(directory,{recursive:true,force:true});}}};
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
        // Navigation can fail/retire the context before its request ever enters
        // this interceptor. Tie the delayed fixture's completion to that real
        // lifecycle as well, and release callbacks already waiting on the gate.
        let closed=false,finished=false;
        const finish=()=>{if(!finished&&delayedNavigation){finished=true;delayedNavigation.finished();}};
        const retired=new Promise<void>(resolve=>context.once("close",()=>{closed=true;finish();resolve();}));
        await context.route("**/*", async (route) => {
          if (route.request().url() === delayedNavigation?.url) {
            await Promise.race([delayedNavigation.release,retired]);
            if(closed)return;
            try { await route.fulfill({ contentType: "text/html; charset=utf-8", body: "<title>Late old page</title><h1>Old candidate</h1>" }); }
            catch { /* Closing the timed-out session may already have canceled the old request. */ }
            finally { finish(); }
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
