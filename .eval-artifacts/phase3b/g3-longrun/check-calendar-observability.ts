import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { chromium, type Page, type ElementHandle } from "playwright-core";
import { renamePrivateMarkers } from "../../../src/eval/restaurant/dom-change/mutation.js";
import { tabelogRequestedDateState } from "../../../src/integrations/tabelog/tabelog-query-controls.js";

// Diagnostic only. It does not change a fixture, baseline, production parser or
// model response. Compare actual public text/ARIA/pixels before a class-only
// counterfactual and before/after the existing frozen private-marker mutation.
const sha = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const manifestPath = "src/harness/browser/fixtures/dom-change/manifest.json";
const baselinePath = "src/harness/browser/fixtures/dom-change/baseline.json";
const manifestBytes = await readFile(manifestPath), baselineBytes = await readFile(baselinePath);
const manifest = JSON.parse(manifestBytes.toString()), baseline = JSON.parse(baselineBytes.toString());
const browser = await chromium.launch({ headless: true });
let blockedRequests = 0;
const cases: unknown[] = [];
async function snapshot(page: Page, sourceUrl: string) {
  return { url: sourceUrl, title: await page.title(), html: await page.content(), text: await page.locator("body").innerText(), settlement: "SETTLED" as const };
}
async function publicState(page: Page, cell: ElementHandle) {
  return {
    bodyTextSha256: sha(await page.locator("body").innerText()),
    bodyAriaSha256: sha(await page.locator("body").ariaSnapshot()),
    cellPixelsSha256: sha(await cell.screenshot({ animations: "disabled" })),
    cell: await cell.evaluate(node => ({
      text: (node as HTMLElement).innerText,
      descendants: [node, ...node.querySelectorAll("*")].map(element => ({
        tag: element.tagName, text: (element as HTMLElement).innerText,
        publicAttributes: Object.fromEntries(["role", "title", "aria-label", "aria-selected", "aria-pressed", "aria-checked", "aria-current", "disabled", "tabindex"].map(name => [name, element.getAttribute(name)])),
        style: Object.fromEntries(["color", "background-color", "background-image", "font-weight", "text-decoration-line", "cursor", "display", "visibility"].map(name => [name, getComputedStyle(element).getPropertyValue(name)])),
        before: getComputedStyle(element, "::before").content,
        after: getComputedStyle(element, "::after").content,
      })),
    })),
  };
}
try {
  const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
  await context.route("**/*", route => { blockedRequests++; return route.abort(); });
  const page = await context.newPage();
  for (const spec of manifest.pages.filter((p: { site: string; kind: string }) => p.site === "TABELOG" && p.kind === "CALENDAR")) {
    const stored = await readFile(spec.path); assert.equal(sha(stored), spec.sha256);
    const html = gunzipSync(stored).toString();
    const reference = baseline.cases.find((row: { id: string }) => row.id === spec.id)!;
    const dates = spec.id.endsWith("teppen") ? ["2026-09-29", "2026-09-28", "2026-09-30"] : ["2026-10-01"];
    for (const date of dates) {
      await page.setContent(html, { waitUntil: "load" });
      // The same visibility-only shim that G2 declares. No calendar status CSS.
      await page.addStyleTag({ content: ".is-hidden{display:none}" });
      const [year, month, day] = date.split("-").map(Number);
      const caption = `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][month! - 1]} ${year}`;
      const handle = await page.evaluateHandle(({ caption, day }) => {
        const table = [...document.querySelectorAll("table")].find(table => table.caption?.textContent?.trim() === caption && (table as HTMLElement).checkVisibility());
        return table && [...table.querySelectorAll("td")].find(cell => cell.innerText.trim() === String(day));
      }, { caption, day });
      const cell = handle.asElement(); assert.ok(cell, "saved visible calendar day is required for this diagnostic");
      const before = await publicState(page, cell);
      const legacyBefore = tabelogRequestedDateState(await snapshot(page, spec.sourceUrl), date);
      const originalClass = await cell.evaluate(node => {
        const leaf = [...node.querySelectorAll("*")].find(element => !element.children.length && element.textContent?.trim() === (node as HTMLElement).innerText.trim());
        if (!leaf) throw new Error("Missing visible day leaf");
        const original = leaf!.className;
        leaf!.className = original.includes("--full") ? original.replace("--full", "--closed")
          : original.replace(/--(?:closed|tel)/u, "--full");
        return original;
      });
      const changed = await publicState(page, cell);
      const legacyCounterfactual = tabelogRequestedDateState(await snapshot(page, spec.sourceUrl), date);
      assert.notEqual(legacyBefore, legacyCounterfactual, "old status parser changes solely from a private class");
      assert.deepEqual(changed, before, "public text, accessible tree, styles and pixels must remain identical");
      await cell.evaluate((node, value) => {
        const leaf = [...node.querySelectorAll("*")].find(element => !element.children.length && element.textContent?.trim() === (node as HTMLElement).innerText.trim())!;
        leaf.className = value;
      }, originalClass);
      const mutation = await renamePrivateMarkers(page, manifest.seed + ":" + spec.id);
      assert.equal(mutation.integrity.valid, true);
      const renamed = await publicState(page, cell);
      // ARIA snapshots include fragment hrefs. A renames their private ids while
      // preserving targets; compare cell semantics/pixels and body text here.
      assert.deepEqual({ ...renamed, bodyAriaSha256: before.bodyAriaSha256 }, before, "the frozen mutation preserves public cell semantics and pixels");
      cases.push({ id: spec.id, date, baselineReference: reference.referenceFacts["day:" + date],
        legacyBefore, legacyCounterfactual, legacyAfterPrivateRename: tabelogRequestedDateState(await snapshot(page, spec.sourceUrl), date),
        publicState: before, publicStateCounterfactualIdentical: true, publicCellPrivateRenameIdentical: true,
        bodyAriaSha256AfterPrivateRename: renamed.bodyAriaSha256,
        inlineCalendarStatusStyles: [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu)].some(match => /p-booking-calendar/u.test(match[1]!)),
        conclusion: "Frozen day status distinguishes private classes with identical available public observations. A source-visible status quotation is not supplied by this saved input." });
    }
  }
} finally { await browser.close(); }
const result = { mode: "OFFLINE_REAL_CHROMIUM_PUBLIC_OBSERVABILITY_COUNTERFACTUAL", sourceTransportCalls: 0, realModelCalls: 0, blockedRequests,
  manifestSha256: sha(manifestBytes), baselineSha256: sha(baselineBytes), inputAndBaselineModified: false, cases };
await writeFile(process.argv[2]!, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ cases: cases.length, publicObservationsIdentical: true, oldClassStatusChanges: true, sourceTransportCalls: 0 }));
