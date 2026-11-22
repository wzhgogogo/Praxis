import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { beerRequest, dinnerRequest, startHistoricalUserFixture } from "./historical-user-fixture.mjs";

const here = (name) => fileURLToPath(new URL(name, import.meta.url));
const git = (...args) => execFileSync("git", ["--no-optional-locks", ...args], { encoding: "utf8" }).trim();
const head = git("rev-parse", "HEAD");
const sourceTree = git("rev-parse", "HEAD:src");
assert.equal(sourceTree, "cc7e22ce8065698cfcca6ede2a95acb1f781349d");
assert.equal(git("status", "--porcelain", "--", "src"), "");

const browser = await chromium.launch({ headless: true, args: [
  "--disable-background-networking", "--no-proxy-server", "--host-resolver-rules=MAP praxis-walk.test 127.0.0.1",
] });
const runs = [];
const actions = [];

async function run(name, makeHost, { mobile = true, plainHttp = false } = {}, scenario) {
  const host = await makeHost();
  const url = plainHttp ? host.baseUrl.replace("127.0.0.1", "praxis-walk.test") : host.baseUrl;
  const context = await browser.newContext({
    baseURL: url, viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    hasTouch: mobile, isMobile: mobile, serviceWorkers: "block", reducedMotion: "reduce", locale: "en-US",
  });
  await context.route("**/*", route => new URL(route.request().url()).origin === url ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(8_000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const field = page.locator("#message");
  const click = async (target) => {
    const el = typeof target === "string" ? page.locator(target) : target;
    const label = await el.evaluate(node => node.getAttribute("aria-label") || node.innerText.trim() || node.id);
    actions.push({ name, input: mobile ? "tap" : "click", label });
    await (mobile ? el.tap() : el.click());
  };
  const picture = async (step) => {
    await page.screenshot({ path: here(name + "-" + step + ".png"), animations: "disabled" });
  };
  const visible = async (selector) => page.locator(selector).waitFor({ state: "visible" });
  const active = () => page.locator(".case-link.active").getAttribute("data-case-id");
  const read = async (caseId) => page.evaluate(async id => {
    const res = await fetch("/api/cases/" + encodeURIComponent(id));
    if (res.status !== 200) throw new Error("Case read returned " + res.status);
    return (await res.json()).view;
  }, caseId);
  const settled = async (id, accept = (view) => !view.restaurant.progress.active) => {
    for (let i = 0; i < 95; i++) {
      const view = await read(id);
      if (accept(view)) return view;
      await new Promise(resolve => setTimeout(resolve, 65));
    }
    throw new Error("Did not reach the expected Case state");
  };
  const send = async (text, suffix = "/messages") => {
    actions.push({ name, input: "text", text });
    const receipt = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname.endsWith(suffix));
    await field.fill(text);
    await click("#send");
    return receipt;
  };
  const create = async (text) => {
    const receipt = await send(text, "/api/cases");
    assert.equal(receipt.status(), 201);
    return (await receipt.json()).view.case.caseId;
  };
  const pickPlan = async id => {
    if (mobile) await click("#menu");
    await click(page.locator('.case-link[data-case-id="' + id + '"]'));
    await page.waitForFunction(id => document.querySelector(".case-link.active")?.dataset.caseId === id, id);
  };
  const waitResult = async (id, n = 3) => {
    const state = await settled(id, v => v.case.phase === "PRESENT_RESULTS" && !v.restaurant.progress.active && v.restaurant.presentedCandidateIds?.length === n);
    await page.waitForFunction(n => document.querySelector("#card-counter")?.textContent?.endsWith(" of " + n), n);
    return state;
  };
  const chip = (label) => page.locator("#request-conditions").getByRole("button", { name: label, exact: true });
  const editChip = async (label, value, newLabel) => {
    await click(chip(label));
    const reply = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/messages"));
    const editor = page.getByLabel("Edit " + label, { exact: true });
    await editor.fill(value);
    await click(page.getByRole("button", { name: "Save", exact: true }));
    const receipt = await reply;
    assert.equal(receipt.status(), 200);
    await chip(newLabel).waitFor();
    return receipt.request().postDataJSON().message;
  };
  try {
    await page.clock.install({ time: host.clock.now() });
    await page.goto(url);
    await page.getByLabel("Access token", { exact: true }).fill("workspace-fixture");
    await click(page.getByRole("button", { name: "Sign in", exact: true }));
    await visible("#home");
    const result = await scenario({ page, host, click, field, read, settled, send, create, pickPlan, waitResult, picture, editChip, visible, active });
    runs.push({ name, mobile, plainHttp, pageErrors: errors, ...result });
    console.log(JSON.stringify(runs.at(-1)));
  } catch (error) {
    await picture("unexpected-stop").catch(() => {});
    runs.push({ name, error: error instanceof Error ? error.message : String(error), pageErrors: errors });
    console.log(JSON.stringify(runs.at(-1)));
  } finally {
    host.release?.();
    await context.close();
    await host.close();
  }
}

const runHistorical = ({ mobile }) => async ({ page, host, click, field, create, send, settled, pickPlan, waitResult, picture, editChip, visible }) => {
  const a = await create(dinnerRequest);
  const initial = await waitResult(a);
  assert.equal(initial.restaurant.intentDraft.target.goal, "RECOMMENDATION");
  assert.equal(initial.restaurant.intentDraft.partySize, 6);
  const edits = [];
  for (const [label, value, after, fieldName, expected] of [
    ["6 guests", "7", "7 guests", "party", 7],
    ["Tokyo", "Osaka", "Osaka", "area", "Osaka"],
    ["Fri, Nov 20", "2026-12-09", "Wed, Dec 9", "date", "2026-12-09"],
  ]) {
    const message = await editChip(label, value, after);
    const view = await waitResult(a);
    const d = view.restaurant.intentDraft;
    assert.equal({ party: d.partySize, area: d.area.query, date: d.date }[fieldName], expected);
    edits.push({ message, date: d.date, area: d.area.query, partySize: d.partySize, result: view.restaurant.presentedCandidateIds });
  }
  await picture("01-osaka-date");
  const before = await waitResult(a);
  const searchCount = host.observed.searches.length;
  const reaffirmed = await send("Keep the same dinner conditions");
  assert.equal(reaffirmed.status(), 200);
  const unchanged = await waitResult(a);
  assert.deepEqual(unchanged.restaurant.presentedCandidateIds, before.restaurant.presentedCandidateIds);
  assert.equal(unchanged.restaurant.requirementRevision, before.restaurant.requirementRevision);
  assert.equal(host.observed.searches.length, searchCount);
  await click("#details-button");
  await visible("#details");
  await field.fill("Would a quieter table be possible?");
  const factCount = host.observed.factReads.length;
  const refreshLabel = await page.locator("#refresh").innerText();
  assert.equal(refreshLabel, "Refresh details");
  const refresh = page.waitForResponse(r => r.request().method() === "POST" && r.url().endsWith("/refresh"));
  await click("#refresh");
  assert.equal((await refresh).status(), 200);
  const refreshed = await settled(a, view => view.case.phase === "PRESENT_RESULTS" && !view.restaurant.progress.active);
  await visible("#details");
  assert.equal(await field.inputValue(), "Would a quieter table be possible?");
  assert.equal(host.observed.searches.length, searchCount);
  const rechecked = host.observed.factReads.slice(factCount).flatMap(item => item.ids);
  assert.deepEqual(new Set(rechecked), new Set(before.restaurant.presentedCandidateIds));
  assert.deepEqual(refreshed.restaurant.presentedCandidateIds, before.restaurant.presentedCandidateIds);
  assert.deepEqual(host.observed.availabilityReads, []);
  await picture("02-osaka-after-refresh");
  host.clock.advance(1000);
  await page.clock.fastForward(1000);
  await click("#new-case");
  const b = await create(beerRequest);
  await visible("#messages");
  const clarification = await page.locator("#messages").innerText();
  assert.equal(await page.locator("#clarification-reply").innerText(), beerRequest);
  await picture("03-beer-asks-for-area");
  assert.equal((await send("Shibuya")).status(), 200);
  const beer = await waitResult(b);
  assert.equal(await page.locator("#revision-changes").isVisible(), false);
  assert.equal(beer.restaurant.revisionDiff ?? null, null);
  assert.equal(await page.locator("#added-count").isVisible(), false);
  assert.equal(beer.restaurant.intentDraft.area.query, "Shibuya");
  assert.equal(beer.restaurant.presentedCandidateIds.includes("shibuya-generic-lounge"), false);
  assert.equal(await page.locator("#revision-changes").isVisible(), false);
  assert.equal(await page.locator("#availability-status").innerText(), "Not checked");
  await click("#details-button");
  await visible("#details");
  const sourceText = await page.locator("#details-content").innerText();
  assert.match(sourceText, /This restaurant serves beer with its meals/);
  await picture("04-beer-about");
  const sidebar = await page.locator(".case-link").allTextContents();
  assert.ok(sidebar[0].includes("Shibuya"));
  await pickPlan(a);
  await visible("#details");
  assert.equal(await field.inputValue(), "Would a quieter table be possible?");
  await picture("05-returned-to-osaka");
  return { edits, equivalentRevision: unchanged.restaurant.requirementRevision, refreshLabel, rechecked, refreshSearches: host.observed.searches.length - searchCount - 1,
    clarification, fakeFirstDeliveryDiff: false, beerDisplayed: beer.restaurant.presentedCandidateIds, sourceText, sidebar, noAvailabilityReads: host.observed.availabilityReads.length === 0, restoredOsakaDraft: await field.inputValue() };
};

try {
  await run("desktop-recorded-order", startHistoricalUserFixture, { mobile: false }, runHistorical({ mobile: false }));
  await run("phone-recorded-order", startHistoricalUserFixture, { mobile: true, plainHttp: true }, runHistorical({ mobile: true }));
} finally {
  await browser.close();
  await writeFile(here("manual-user-routes.json"), JSON.stringify({ head, sourceTree, sameSource: git("rev-parse", "HEAD:src") === sourceTree && git("status", "--porcelain", "--", "src") === "", runs, actions }, null, 2) + "\n");
}
if (runs.length !== 2 || runs.some(run => run.error || run.pageErrors.length)) process.exitCode = 1;
