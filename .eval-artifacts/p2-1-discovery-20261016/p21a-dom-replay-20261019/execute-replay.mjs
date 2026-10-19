// One fixed counterfactual decision per original page-planning input; no website access.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const batch = '.eval-artifacts/p2-1-discovery-20261016/p21a-dom-replay-20261019';
const load = p => JSON.parse(readFileSync(p, 'utf8'));
const save = (p, v, exclusive = false) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n', { flag: exclusive ? 'wx' : 'w' });
const sha = p => createHash('sha256').update(readFileSync(p)).digest('hex');
const freeze = load(`${batch}/replay-freeze.json`), audit = load(`${batch}/payload-audit.json`);
for (const [p, hash] of Object.entries({ ...freeze.files, ...audit.originalFiles })) assert.equal(sha(p), hash, `Frozen file changed: ${p}`);
const rows = load(`${batch}/prepared-requests.json`);
assert.equal(rows.length, 14);
const execute = process.argv.includes('--execute');
assert.ok(execute !== process.argv.includes('--dry-run'), 'Choose exactly --execute or --dry-run');
for (const row of rows) {
  assert.equal(row.request.purpose, 'restaurant_discovery_retrieval');
  assert.equal(row.request.promptVersion, 'restaurant-discovery-retrieval-prompt@3');
  assert.equal(row.request.timeoutMs, row.original.timeoutMs);
  assert.equal(row.request.messages.length, 2);
}
if (!execute) {
  console.log(JSON.stringify({ status: 'OFFLINE_DRY_RUN_PASS', requests: 14, models: 0, network: 0, frozenFiles: Object.keys(freeze.files).length }));
  process.exit(0);
}
const results = `${batch}/replay`;
assert.ok(!existsSync(`${results}/started.json`), 'This fixed batch was already started; no blind replay');
mkdirSync(results, { recursive: true });
save(`${results}/started.json`, { time: new Date().toISOString(), freezeSha256: sha(`${batch}/replay-freeze.json`) }, true);
const { DeepSeekModelGateway } = await import(pathToFileURL(join(process.cwd(), 'src/infrastructure/deepseek/deepseek-model-gateway.ts')).href);
const { validateDiscoveryRetrieval } = await import(pathToFileURL(join(process.cwd(), 'src/domains/restaurant/discovery-retrieval.ts')).href);
let calls = 0;
const gateway = DeepSeekModelGateway.fromEnvironment(process.env, { fetchImplementation: async (url, options) => {
  assert.equal(String(url), audit.destination);
  assert.equal(options.method, 'POST');
  return fetch(url, { ...options, redirect: 'error' });
} });
const outputs = [];
const origin = audit.budgetsOrigin;
for (const row of rows) {
  assert.ok(origin.models + calls < origin.modelLimit);
  const begin = Date.now();
  save(`${results}/${row.id}.started.json`, { time: new Date().toISOString(), id: row.id, requestSha256: createHash('sha256').update(JSON.stringify(row.request)).digest('hex') }, true);
  calls++;
  let output = { id: row.id, index: row.index, caseId: row.caseId, sequence: row.sourceSequence,
    originalProposal: JSON.parse(row.original.outputText), provenance: row.provenance, realModelCalls: 1 };
  try {
    const response = await gateway.complete(row.request);
    const proposal = JSON.parse(response.outputText);
    const body = JSON.parse(row.request.messages[1].content);
    const selection = validateDiscoveryRetrieval(proposal, row.intent, row.locationName, body.observation.categories.map(c => c.url));
    output = { ...output, status: 'SUCCEEDED', response, proposal, selection,
      relevantCategorySelected: selection.accepted && ['CATEGORY', 'COMBINED'].includes(proposal.choice)
        && row.relevantCategoryUrls.includes(proposal.categoryUrl) };
  } catch (error) {
    output = { ...output, status: 'FAILED', errorCode: error.code ?? 'INVALID_REPLAY_OUTPUT',
      providerStatus: error.providerStatus ?? null, relevantCategorySelected: false };
  }
  output.elapsedMs = Date.now() - begin;
  save(`${results}/${row.id}.json`, output, true);
  outputs.push(output);
  console.log(JSON.stringify({ id: row.id, status: output.status, choice: output.proposal?.choice,
    category: output.proposal?.categoryUrl, relevant: output.relevantCategorySelected, elapsedMs: output.elapsedMs }));
  save(`${results}/progress.json`, { calls, completed: outputs.length, cumulativeModels: origin.models + calls });
  if ([401, 402, 403].includes(output.providerStatus)) break;
}
const distinctCases = [...new Set(outputs.filter(o => o.relevantCategorySelected).map(o => o.caseId))];
const gate = outputs.length === rows.length && distinctCases.length >= audit.predeclaredGate.requiredDistinctCases;
save(`${results}/summary.json`, { status: outputs.length === rows.length ? 'COMPLETE' : 'STOPPED_PROVIDER_FAILURE',
  outputs, distinctRelevantCategoryCases: distinctCases, gate: gate ? 'PASS_ALLOW_A10' : 'FAIL_STOP_NO_A',
  realModelCalls: calls, successes: outputs.filter(o => o.status === 'SUCCEEDED').length,
  cumulativeModels: origin.models + calls, cumulativeGoogle: origin.google, cumulativeProbes: origin.probes,
  websiteRequests: 0, fullLive: 0, elapsedMs: outputs.reduce((n, o) => n + o.elapsedMs, 0) });
console.log(JSON.stringify({ gate, distinctCases, calls, cumulativeModels: origin.models + calls, websiteRequests: 0 }));
