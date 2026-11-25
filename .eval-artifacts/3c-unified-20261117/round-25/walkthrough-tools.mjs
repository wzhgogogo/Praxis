import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const artifact = name => fileURLToPath(new URL("history/"+name, import.meta.url));
export const git = (...args) => execFileSync("git", ["--no-optional-locks", ...args], { encoding: "utf8" }).trim();
export const control = () => {
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  return { ready, release };
};
export async function until(read, description, timeout = 12_000) {
  const deadline = Date.now() + timeout;
  do {
    const result = await read();
    if (result) return result;
    await delay(40);
  } while (Date.now() < deadline);
  assert.fail("Timed out waiting for " + description);
}

export const apiCase = id => "/api/cases/" + encodeURIComponent(id);
export async function stateOf(host, id) {
  return host.application.getCase("workspace-user", id);
}
export function responseOf(page, method, suffix, trigger) {
  return Promise.all([
    page.waitForResponse(r => r.request().method() === method && new URL(r.url()).pathname.endsWith(suffix)),
    trigger(),
  ]).then(([response]) => response);
}

export async function walk(group, inputs) {
  const head = git("rev-parse", "HEAD");
  const source = git("rev-parse", "HEAD:src");
  if (process.env.PRAXIS_REVIEW_EXPECT_SOURCE) assert.equal(source, process.env.PRAXIS_REVIEW_EXPECT_SOURCE);
  assert.equal(git("status", "--porcelain"), "");
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-background-networking", "--no-proxy-server", "--host-resolver-rules=MAP praxis-continue.test 127.0.0.1"],
  });
  const evidence = [];
  try {
    for (const input of inputs) {
      const { name, width, start, scenario, plain = false, grantedLocation = false } = input;
      const height = width === 390 ? 844 : 900;
      const touch = width === 390;
      const receipt = { name, width, height, touch, plain, actions: [], errors: [], offlineDestinations: [] };
      const host = await start();
      const origin = plain ? host.baseUrl.replace("127.0.0.1", "praxis-continue.test") : host.baseUrl;
      const context = await browser.newContext({
        viewport: { width, height },
        hasTouch: touch, isMobile: touch, locale: "en-US", reducedMotion: "reduce", serviceWorkers: "block",
        ...(grantedLocation ? { geolocation: { latitude: 35.668, longitude: 139.767, accuracy: 18 } } : {}),
      });
      if (grantedLocation) await context.grantPermissions(["geolocation"], { origin });
      await context.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        if (url.hostname === "www.tablecheck.com" && route.request().isNavigationRequest()) {
          receipt.offlineDestinations.push(url.href);
          return route.fulfill({ status: 200, contentType: "text/html", body: "<title>Offline fixture source</title><p>Offline fixture source</p>" });
        }
        return route.abort("blockedbyclient");
      });
      function ui(page, tab = "main") {
        page.setDefaultTimeout(12_000);
        page.on("pageerror", error => receipt.errors.push({ tab, message: error.message }));
        const field = page.locator("#message");
        const visible = selector => page.locator(selector).waitFor({ state: "visible" });
        const click = async (target, name) => {
          const locator = typeof target === "string" ? page.locator(target) : target;
          const label = name ?? await locator.evaluate(node => node.getAttribute("aria-label") || node.innerText.trim() || node.id);
          receipt.actions.push({ tab, action: touch ? "tap" : "click", label });
          await (touch ? locator.tap() : locator.click());
        };
        const image = step => page.screenshot({ path: artifact(name + "-" + width + "-" + step + ".png"), animations: "disabled" });
        const send = async (text, suffix = "/messages") => {
          receipt.actions.push({ tab, action: "type", text });
          await field.fill(text);
          return responseOf(page, "POST", suffix, () => click("#send"));
        };
        const active = id => page.waitForFunction(value => document.querySelector(".case-link.active")?.dataset.caseId === value, id);
        const ready = async (n = 3) => {
          await page.waitForFunction(value => document.getElementById("card-counter")?.textContent === "1 of " + value && document.getElementById("progress")?.hidden, n);
        };
        const create = async (text, n = 3) => {
          const res = await send(text, "/api/cases");
          assert.equal(res.status(), 201);
          const view = (await res.json()).view;
          await active(view.case.caseId);
          if (n) await ready(n);
          return view.case.caseId;
        };
        const select = async id => {
          if (width < 960 && !(await page.locator("#plans").getAttribute("class") ?? "").split(/\s+/).includes("open")) await click("#menu");
          await click(page.locator('.case-link[data-case-id="' + id + '"]'));
          await active(id);
        };
        const open = async () => {
          await page.clock.install({ time: host.clock.now() });
          await page.goto(origin);
        };
        return { page, click, image, field, visible, create, send, select, active, ready, open };
      }
      const main = ui(await context.newPage());
      try {
        await main.open();
        await main.page.getByLabel("Access token", { exact: true }).fill("workspace-fixture");
        await main.click(main.page.getByRole("button", { name: "Sign in", exact: true }));
        await main.visible("#home");
        const pending = scenario({ main, context, host, receipt, origin, secondary: async () => {
          const other = ui(await context.newPage(), "second");
          await other.open();
          await other.visible("#app");
          return other;
        } });
        receipt.outcome = await pending;
        assert.deepEqual(receipt.errors, []);
        receipt.completed = true;
      } catch (error) {
        receipt.failure = error.stack ?? String(error);
        await main.image("unresolved").catch(() => {});
      } finally {
        host.release?.();
        await context.close();
        await host.close();
      }
      evidence.push(receipt);
      console.log(JSON.stringify({ name, width, completed: receipt.completed ?? false, outcome: receipt.outcome, failure: receipt.failure }));
      await writeFile(artifact(group + ".json"), JSON.stringify({ group, head, source, receipts: evidence }, null, 2) + "\n");
    }
  } finally {
    await browser.close();
    assert.equal(git("rev-parse", "HEAD"), head);
    assert.equal(git("status", "--porcelain"), "");
  }
  if (evidence.some(receipt => !receipt.completed)) process.exitCode = 1;
}
