import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { LocalPlaywrightChromium } from '../../src/infrastructure/browser/local-playwright-chromium.ts';
import { runBrowserReadProbe } from '../../src/eval/restaurant/agent-loop/browser-read-probe.ts';
import { captureRawPriceRegions } from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-prices.ts';

const base = '.eval-artifacts/p2-3-conditions-20261019';
const planPath = `${base}/aloft-capture-plan.json`;
const planBytes = await fs.readFile(planPath), plan = JSON.parse(planBytes);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
execFileSync('git', ['diff', '--exit-code', 'HEAD', '--', 'src', planPath, `${base}/capture-aloft.mjs`], { stdio: 'pipe' });
const codeCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const output = `${base}/aloft-public-capture`;
await fs.mkdir(output); // One attempt, preserve all outcomes.
const startedAt = new Date().toISOString(), snapshots = [];
let result, error;
try {
  result = await runBrowserReadProbe(new LocalPlaywrightChromium({ headless: true }), {
    url: plan.url, timeoutMs: plan.budget.timeoutMs, readySelector: plan.readySelector,
    controlObservation: { record: async snapshot => {
      const stem = `snapshot-${String(snapshots.length + 1).padStart(4, '0')}`;
      await fs.writeFile(`${output}/${stem}.html`, snapshot.html, { flag: 'wx' });
      await fs.writeFile(`${output}/${stem}.txt`, snapshot.text, { flag: 'wx' });
      const regions = captureRawPriceRegions(snapshot.html, snapshot.text);
      await fs.writeFile(`${output}/${stem}.price-regions.json`, JSON.stringify(regions, null, 2), { flag: 'wx' });
      snapshots.push({ stem, url: snapshot.url, title: snapshot.title, htmlSha256: sha(snapshot.html), textSha256: sha(snapshot.text), regions: regions.length,
        networkRequests: snapshot.networkRequests, networkDiagnostics: snapshot.networkDiagnostics });
    } },
  });
} catch (failure) {
  error = { name: failure?.name, code: failure?.code, message: failure?.message };
}
const summary = { status: error ? 'READ_FAILED' : 'PUBLIC_PAGE_CAPTURED_NOT_INVENTORY_VALIDATION', codeCommit,
  plan: { path: planPath, sha256: sha(planBytes) }, startedAt, completedAt: new Date().toISOString(),
  models: 0, googleRequests: 0, navigationAttempts: 1, reservationActions: 0, result, error, snapshots };
await fs.writeFile(`${output}/summary.json`, JSON.stringify(summary, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: summary.status, snapshots: snapshots.length, output, error }, null, 2));
if (error) process.exitCode = 1;
