import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { PlaywrightReadNetworkGuard } from "../../infrastructure/browser/playwright-read-network-guard.js";

// Real transport oracle: a forbidden receiver must see zero requests. No model,
// external network, personal browser profile or manually re-entered route handler.
async function fixture(run: (input: {
  origin: string; other: string; arrivals: string[]; cookies: string[];
  guard: PlaywrightReadNetworkGuard; page: import("playwright-core").Page;
  recorded: Array<{ url: string; status: number; redirectLocation?: string }>;
}) => Promise<void>, reviewedCss = false): Promise<void> {
  const arrivals: string[] = [], cookies: string[] = [];
  let other = "";
  const serve = (foreign: boolean) => (req: IncomingMessage, res: ServerResponse) => {
    // Keep CORS from hiding a receiver arrival before the Guard can be tested.
    res.setHeader("access-control-allow-origin", "*");
    const url = new URL(req.url!, `http://${req.headers.host}`);
    arrivals.push(`${foreign ? "B" : "A"}${url.pathname}`);
    if (foreign) {
      if (url.pathname === "/public/final.css") { res.setHeader("content-type", "text/css"); res.end('@import url("/private.css"); html{color:rgb(1,2,3)}'); return; }
      res.end("forbidden receiver"); return;
    }
    const redirect = (location: string) => { res.writeHead(302, { location }); res.end(); };
    if (url.pathname === "/cross") return redirect("/cross-hop");
    if (url.pathname === "/cross-hop") return redirect(`${other}/forbidden`);
    if (url.pathname === "/sensitive") return redirect("/public-hop");
    if (url.pathname === "/public-hop") return redirect("/account/delete?action=confirm");
    if (url.pathname === "/safe") { res.setHeader("set-cookie", "read_probe=public; Path=/; SameSite=Lax"); return redirect("/safe-hop"); }
    if (url.pathname === "/safe-hop") return redirect("/result/final");
    if (url.pathname === "/result/final") {
      cookies.push(req.headers.cookie ?? ""); res.setHeader("content-type", "text/html");
      res.end('<h1>Public result</h1><a id="relative" href="next">Next</a>'); return;
    }
    if (url.pathname.startsWith("/loop/")) return redirect(url.pathname === "/loop/one" ? "/loop/two" : "/loop/one");
    if (url.pathname === "/asset") return redirect("/asset-hop");
    if (url.pathname === "/asset-hop") return redirect(`${other}/forbidden`);
    if (url.pathname === "/style-redirect") return redirect("/style-hop");
    if (url.pathname === "/style-hop") return redirect(`${other}/public/final.css`);
    if (url.pathname === "/worker.js") { res.setHeader("content-type", "application/javascript"); res.end("fetch('/asset').then(()=>postMessage('done')).catch(()=>postMessage('blocked'))"); return; }
    if (url.pathname === "/frame-page") { res.setHeader("content-type", "text/html"); res.end('<iframe src="/cross"></iframe>'); return; }
    res.setHeader("content-type", "text/html"); res.end("<h1>Public start</h1>");
  };
  const a = createServer(serve(false)), b = createServer(serve(true));
  await new Promise<void>(resolve => a.listen(0, "127.0.0.1", resolve));
  await new Promise<void>(resolve => b.listen(0, "127.0.0.1", resolve));
  const port = (server: typeof a) => { const addr = server.address(); if (!addr || typeof addr === "string") throw Error("local fixture did not bind"); return addr.port; };
  const origin = `http://127.0.0.1:${port(a)}`; other = `http://127.0.0.1:${port(b)}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ serviceWorkers: "block" });
  // The local receiver must remain reachable so Chromium's Local Network
  // Access protection cannot supply the safety assertion on the Guard's behalf.
  await context.grantPermissions(["local-network-access"], { origin });
  const recorded: Array<{ url: string; status: number; redirectLocation?: string }> = [];
  const guard = new PlaywrightReadNetworkGuard({ documentOrigins: [origin], genericPublicRead: true,
    staticResources: reviewedCss ? [{ origin: other, pathname: "/public/final.css", resourceTypes: ["stylesheet"] }] : [], dynamicReads: [] }, 2_000, value => { recorded.push(value); });
  try {
    await guard.install(context);
    const page = await context.newPage();
    await guard.preparePage(context, page);
    await run({ origin, other, arrivals, cookies, guard, page, recorded });
  } finally {
    await browser.close();
    await Promise.all([a, b].map(server => new Promise<void>(resolve => server.close(() => resolve()))));
  }
}

for (const [name, path, forbidden] of [
  ["cross-origin", "/cross", "B/forbidden"],
  ["sensitive", "/sensitive", "A/account/delete"],
] as const) {
  test(`real Chromium rejects a second ${name} redirect before receiver arrival`, async () => fixture(async ({ origin, guard, page, arrivals }) => {
    guard.prepareNavigation(origin + path);
    await page.goto(origin + path, { timeout: 3_000 }).catch(() => {});
    assert.equal(arrivals.includes(forbidden), false, `forbidden receiver received ${forbidden}`);
    assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }));
  }));
}

test("real Chromium preserves allowed redirect URL, relative links, cookies and recording of every hop", async () => fixture(async ({ origin, guard, page, arrivals, cookies, recorded }) => {
  guard.prepareNavigation(origin + "/safe");
  await page.goto(origin + "/safe", { timeout: 3_000 });
  assert.equal(page.url(), origin + "/result/final");
  assert.equal(await page.locator("#relative").evaluate((el: HTMLAnchorElement) => el.href), origin + "/result/next");
  assert.deepEqual(cookies, ["read_probe=public"]);
  assert.deepEqual(arrivals.filter(x => x !== "A/favicon.ico"), ["A/safe", "A/safe-hop", "A/result/final"]);
  assert.deepEqual(recorded.map(x => new URL(x.url).pathname), ["/safe", "/safe-hop", "/result/final"]);
}));

for (const type of ["fetch", "xhr", "script", "stylesheet", "image"] as const) {
  test(`real Chromium checks every ${type} redirect before cross-origin dispatch`, async () => fixture(async ({ origin, guard, page, arrivals }) => {
    guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
    await page.evaluate(async kind => {
      if (kind === "fetch") { await fetch("/asset").catch(() => {}); return; }
      if (kind === "xhr") { await new Promise<void>(resolve => { const x = new XMLHttpRequest(); x.onloadend = () => resolve(); x.open("GET", "/asset"); x.send(); }); return; }
      await new Promise<void>(resolve => {
        const el = document.createElement(kind === "stylesheet" ? "link" : kind === "image" ? "img" : "script");
        el.onload = el.onerror = () => resolve();
        if (el instanceof HTMLLinkElement) { el.rel = "stylesheet"; el.href = "/asset"; }
        else (el as HTMLScriptElement | HTMLImageElement).src = "/asset";
        document.head.appendChild(el);
      });
    }, type);
    assert.equal(arrivals.includes("B/forbidden"), false, "cross-origin receiver must receive zero requests");
    assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }));
  }));
}

test("real Chromium redirect loops fail at the Guard hop bound", async () => fixture(async ({ origin, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/loop/one");
  await page.goto(origin + "/loop/one", { timeout: 3_000 }).catch(() => {});
  assert.ok(arrivals.filter(x => x.startsWith("A/loop/")).length <= 10, "Guard must bound redirects before Chromium's own limit");
  assert.ok(guard.snapshotRequests().some(row => row.outcome === "REDIRECT_BLOCKED"), JSON.stringify({ arrivals, requests: guard.snapshotRequests(), diagnostics: guard.snapshotDiagnostics() }));
}));

test("real Chromium protects popup navigation before its first redirect", async () => fixture(async ({ origin, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
  const popupPromise = page.waitForEvent("popup");
  await page.evaluate(url => { window.open(url); }, origin + "/cross");
  await popupPromise;
  for (let i = 0; i < 100 && !guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"); i++) await new Promise(resolve => setTimeout(resolve, 10));
  assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"));
  assert.equal(arrivals.includes("B/forbidden"), false);
}));

test("real Chromium protects iframe redirect chains", async () => fixture(async ({ origin, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/frame-page"); await page.goto(origin + "/frame-page");
  assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"));
  assert.equal(arrivals.includes("B/forbidden"), false);
}));

test("real Chromium preserves normal allowed popup redirect navigation", async () => fixture(async ({ origin, guard, page }) => {
  guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
  const popupPromise = page.waitForEvent("popup"); await page.evaluate(url => { window.open(url); }, origin + "/safe");
  const popup = await popupPromise;
  await popup.waitForURL(origin + "/result/final", { timeout: 3_000 });
  assert.equal(await popup.locator("h1").textContent(), "Public result");
  assert.equal(await popup.locator("#relative").evaluate((el: HTMLAnchorElement) => el.href), origin + "/result/next");
}));

test("real Chromium protects dedicated-worker fetch redirects", async () => fixture(async ({ origin, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
  await page.evaluate(() => new Promise(resolve => { const worker = new Worker("/worker.js"); worker.onmessage = event => { worker.terminate(); resolve(event.data); }; }));
  assert.ok(guard.snapshotRequests().some(r => r.outcome === "REDIRECT_BLOCKED"));
  assert.equal(arrivals.includes("B/forbidden"), false);
}));

test("reviewed stylesheet redirects preserve their URL without promoting the CDN to generic public reads", async () => fixture(async ({ origin, other, guard, page, arrivals }) => {
  guard.prepareNavigation(origin + "/page"); await page.goto(origin + "/page");
  await page.evaluate(() => new Promise<void>(resolve => { const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/style-redirect"; link.onload = link.onerror = () => resolve(); document.head.appendChild(link); }));
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).color), "rgb(1, 2, 3)");
  assert.ok(arrivals.includes("B/public/final.css"));
  assert.equal(arrivals.includes("B/private.css"), false);
  assert.ok(guard.snapshotRequests().some(row => row.origin === other && row.pathname === "/private.css" && row.outcome === "BLOCKED"), "relative CSS import is resolved against the final CDN URL and remains rule-bound");
}, true));
