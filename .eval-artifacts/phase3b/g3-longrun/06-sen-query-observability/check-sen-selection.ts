import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { chromium, type Page, type ElementHandle } from "playwright-core";
import { hasTabelogSelectedQuery } from "../../../../src/integrations/tabelog/tabelog-query-controls.js";
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const manifestBytes = await readFile("src/harness/browser/fixtures/dom-change/manifest.json");
const baselineBytes = await readFile("src/harness/browser/fixtures/dom-change/baseline.json");
const manifest = JSON.parse(manifestBytes.toString());
const spec = manifest.pages.find((row: { id: string }) => row.id === "tabelog-calendar-sen");
const reference = JSON.parse(baselineBytes.toString()).cases.find((row: { id: string }) => row.id === spec.id);
assert.equal(reference.referenceFacts.requestConfirmed, true);
const html = gunzipSync(await readFile(spec.path)).toString(); assert.equal(sha(html), spec.sha256);
async function snapshot(page: Page) { return { url: spec.sourceUrl, html: await page.content(), text: await page.locator("body").innerText(), title: await page.title() }; }
async function observed(page: Page, region: ElementHandle) {
  return { bodyTextSha256: sha(await page.locator("body").innerText()), bodyAriaSha256: sha(await page.locator("body").ariaSnapshot()),
    pixelsSha256: sha(await region.screenshot({ animations: "disabled" })),
    elements: await region.evaluate(node => [node, ...node.querySelectorAll("*")].map(element => {
      const style = getComputedStyle(element), before = getComputedStyle(element, "::before"), after = getComputedStyle(element, "::after");
      return { tag: element.tagName, text: (element as HTMLElement).innerText,
        publicAttributes: Object.fromEntries(["role", "title", "aria-label", "aria-selected", "aria-pressed", "aria-checked", "aria-current", "disabled", "tabindex"].map(name => [name, element.getAttribute(name)])),
        nativeValue: element instanceof HTMLInputElement || element instanceof HTMLSelectElement ? element.value : null,
        computedStyle: Object.fromEntries(Array.from(style).map(name => [name, style.getPropertyValue(name)])),
        before: Object.fromEntries(Array.from(before).map(name => [name, before.getPropertyValue(name)])),
        after: Object.fromEntries(Array.from(after).map(name => [name, after.getPropertyValue(name)])) };
    })) };
}
const browser = await chromium.launch({ headless: true, proxy: { server: "http://127.0.0.1:9" } });
let blockedRequests = 0;
const cases = [];
try {
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
  context.setDefaultTimeout(10_000); context.setDefaultNavigationTimeout(10_000);
  await context.route("**/*", route => { blockedRequests++; return route.abort(); });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => { const style = document.createElement("style"); style.textContent = ".is-hidden{display:none}"; document.head.append(style); });
  // Private selectors pin the controlled variable in this diagnostic only.
  // The independent public measurement excludes all class/data/testid values.
  const targets = [
    { axis: "selected date", selector: 'p[data-year="2026"][data-month="10"][data-day="22"].is-current', remove: "is-current", parent: true },
    { axis: "selected guests", selector: 'button.p-booking-calendar__people-button.is-active', remove: "is-active", parent: false },
  ];
  for (const axis of targets) {
    const target = await page.$(axis.selector); assert.ok(target);
    const region = axis.parent ? (await target.evaluateHandle(node => node.parentElement)).asElement()! : target;
    await region.scrollIntoViewIfNeeded();
    const before = await observed(page, region);
    const selectedBefore = hasTabelogSelectedQuery(await snapshot(page), spec.request.date, spec.request.partySize);
    const originalClass = await target.getAttribute("class"); assert.ok(originalClass);
    await target.evaluate((node, token) => node.classList.remove(token), axis.remove);
    const counterfactual = await observed(page, region);
    const selectedAfter = hasTabelogSelectedQuery(await snapshot(page), spec.request.date, spec.request.partySize);
    assert.equal(selectedBefore, true); assert.equal(selectedAfter, false);
    const identical = JSON.stringify(before) === JSON.stringify(counterfactual);
    await target.evaluate((node, value) => node.setAttribute("class", value), originalClass);
    await target.evaluate(node => node.setAttribute("aria-label", "Selected control: diagnostic positive measurement"));
    const positive = await observed(page, region);
    assert.notDeepEqual(positive, before, "public observation must detect an explicit accessible label change");
    await target.evaluate(node => node.removeAttribute("aria-label"));
    cases.push({ axis: axis.axis, selectedBefore, selectedAfter, publicStateIdentical: identical,
      before, counterfactual, positiveControlPublicDifferenceDetected: true });
    console.log(axis.axis, selectedBefore, "->", selectedAfter, "publicIdentical=" + identical);
  }
} finally { await browser.close(); }
const result = { mode: "OFFLINE_REAL_CHROMIUM_SELECTION_COUNTERFACTUAL", sourceTransportCalls: 0, realModelCalls: 0, blockedRequests,
  manifestSha256: sha(manifestBytes), baselineSha256: sha(baselineBytes), htmlSha256: sha(html), referenceRequestConfirmed: true,
  inputOrBaselineModified: false, allPrivateChangesPubliclyIndistinguishable: cases.every(row => row.publicStateIdentical), cases };
await writeFile(process.argv[2]!, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ complete: true, cases: cases.length, publicIdentical: result.allPrivateChangesPubliclyIndistinguishable, sourceTransportCalls: 0 }));
