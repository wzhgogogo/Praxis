// Proposal probe only: diagnostic DOM is not promoted to network Replay input.
import { readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";
const root = ".eval-artifacts/phase3b/replay-completion/";
const inputs = JSON.parse(await readFile(root + "dom-probe-inputs.json", "utf8")) as Array<{ snapshot: number; path: string; rawSha256: string; sourceUrl: string; originalReplayStatus: string }>;
const browser = await chromium.launch({ headless: true, proxy: { server: "http://127.0.0.1:9" } });
const rows = [];
try {
  for (const input of inputs) {
    const raw = gunzipSync(await readFile(input.path));
    if (createHash("sha256").update(raw).digest("hex") !== input.rawSha256) throw new Error("DOM source SHA mismatch");
    const context = await browser.newContext({ javaScriptEnabled: false, serviceWorkers: "block" });
    let blockedRequests = 0;
    await context.route("**/*", route => { blockedRequests++; return route.abort(); });
    try {
      const page = await context.newPage();
      await page.setContent(raw.toString(), { waitUntil: "domcontentloaded", timeout: 10_000 });
      rows.push({ snapshot: input.snapshot, originalReplayStatus: input.originalReplayStatus, rawSha256: input.rawSha256,
        textLength: (await page.locator("body").innerText()).length, observedLinks: await page.locator("a[href]").count(), observedControls: await page.locator("button,input,select,[role=button],[role=combobox]").count(),
        scriptsDisabled: true, blockedRequests, sourceTransportCalls: 0, interactionOrInventoryVerified: false });
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
const result = { mode: "OFFLINE_DIAGNOSTIC_DOM_PROPOSAL_ONLY", networkReplayQualificationChange: 0, originalInputsUnchanged: true, rows };
const index = process.argv.indexOf("--out"); if (index < 0 || !process.argv[index + 1]) throw new Error("Explicit --out required");
await writeFile(process.argv[index + 1]!, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(JSON.stringify({ pagesRead: rows.length, readablePages: rows.filter(row => row.textLength > 0).length, sourceTransportCalls: 0, networkReplayQualificationChange: 0 }));
