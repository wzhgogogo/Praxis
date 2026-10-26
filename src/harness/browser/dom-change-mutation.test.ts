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
