import assert from "node:assert/strict";
import test from "node:test";
import { chromium } from "playwright-core";
import { renamePrivateMarkers } from "../../eval/restaurant/dom-change/mutation.js";

test("G2 extends the F3 class-only mutation to every id and private data attribute", async () => {
  // Local construction, not website replay. Public name/value/ARIA are fixed.
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
    await context.route("**/*", route => route.abort());
    const page = await context.newPage();
    await page.setContent('<style>#private-field{color:rgb(1,2,3)}.private-card{display:block}[data-testid="Search Input"]{background:rgb(4,5,6)}</style><label for="private-field">Search restaurants</label><input id="private-field" class="private-card" data-testid="Search Input" data-private-owner="source" name="search_text" value="sushi" aria-label="Search restaurants"><div id="private-status">Ready</div>');
    const value = await renamePrivateMarkers(page, "phase3b-g2-seed-1");
    assert.equal(await page.locator('[id="private-field"]').count(), 0, "the old private id must not survive the mutation");
    assert.equal(await page.locator("[data-testid], [data-private-owner]").count(), 0, "all private data names must change");
    assert.equal(Object.keys(value.mapping.ids).length, 2);
    assert.equal(Object.keys(value.mapping.dataAttributes).length, 2);
    assert.equal(await page.locator('[name="search_text"]').inputValue(), "sushi");
    assert.equal(await page.getByLabel("Search restaurants").count(), 1);
  } finally { await browser.close(); }
});

test("G2 rule two rewrites all bound ID references, leaves dangling/script references and preserves CSS", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
    await context.route("**/*", route => route.abort());
    const page = await context.newPage();
    const html = `<style>#field\\:one{color:rgb(1,2,3)}[data-testid="Search Input"]{background:rgb(4,5,6)}a[href="#target"]{color:rgb(7,8,9)}</style>
      <span id="title">Public label</span><span id="target">Public description</span>
      <label for="field:one">Search restaurants</label><input id="field:one" data-testid="Search Input" name="search_text" value="sushi" aria-labelledby="title" aria-describedby="target absent" aria-controls="target" aria-owns="target" aria-activedescendant="target" aria-flowto="target absent" aria-details="target" aria-errormessage="target">
      <a href="#target">Read description</a><a href="#absent">Dangling</a><a href="https://other.example/#target">Other page</a>
      <svg><defs><clipPath id="clip"><rect width="2" height="2" /></clipPath></defs><rect clip-path="url(#clip)" style="filter:url('#clip')"/><use href="#clip" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#clip"/></svg>
      <script>globalThis.pageScriptRan=true;document.getElementById("target").textContent="must not execute";</script>`;
    await page.setContent(html);
    const first = await renamePrivateMarkers(page, "stable-seed");
    assert.equal(first.integrity.valid, true, JSON.stringify(first.integrity));
    assert.equal(first.references.length, 11, "include each multi-valued token and label target");
    assert.ok(first.references.every(ref => ref.before.target === ref.after?.target));
    assert.equal(await page.locator('input[name="search_text"]').getAttribute("aria-describedby"), first.mapping.ids.target + " absent");
    assert.equal(await page.locator("label").evaluate(label => (label as HTMLLabelElement).control?.getAttribute("name")), "search_text");
    assert.deepEqual(await page.locator('input[name="search_text"]').evaluate(node => [getComputedStyle(node).color, getComputedStyle(node).backgroundColor]), ["rgb(1, 2, 3)", "rgb(4, 5, 6)"]);
    assert.equal(await page.getByText("Read description", { exact: true }).evaluate(node => getComputedStyle(node).color), "rgb(7, 8, 9)");
    assert.equal(await page.getByText("Read description", { exact: true }).getAttribute("href"), "#" + first.mapping.ids.target);
    assert.equal(await page.getByText("Other page", { exact: true }).getAttribute("href"), "https://other.example/#target");
    assert.equal(await page.getByText("Dangling", { exact: true }).getAttribute("href"), "#absent");
    assert.equal(await page.locator("svg > rect").getAttribute("clip-path"), "url(#" + first.mapping.ids.clip + ")");
    assert.equal(await page.locator("use").getAttribute("href"), "#" + first.mapping.ids.clip);
    assert.equal(await page.locator("use").evaluate(node => node.getAttributeNS("http://www.w3.org/1999/xlink", "href")), "#" + first.mapping.ids.clip);
    assert.ok(first.danglingReferences.some(ref => ref.token === "absent"));
    assert.equal(first.scriptReferences.some(ref => ref.id === "target" && ref.line === 1), true);
    assert.equal(await page.evaluate(() => "pageScriptRan" in globalThis), false);
    assert.match(await page.locator("script").textContent() ?? "", /getElementById\("target"\)/);
    const firstHtml = await page.content();
    await page.setContent(html);
    const second = await renamePrivateMarkers(page, "stable-seed");
    assert.deepEqual(second.mapping, first.mapping);
    assert.equal(await page.content(), firstHtml);
    await page.setContent(html);
    const other = await renamePrivateMarkers(page, "other-seed");
    assert.notDeepEqual(other.mapping.ids, first.mapping.ids);
    assert.equal(other.integrity.valid, true);
  } finally { await browser.close(); }
});
