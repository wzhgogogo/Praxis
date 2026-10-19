// One user-authorized network preflight. The stopped checkpoint ledger is immutable.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const sha = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const plan = await read(resolve(root, 'plan.json'));
const freeze = await read(resolve(root, 'freeze.json'));
for (const [path, expected] of Object.entries(freeze.files)) assert.equal(await sha(path), expected, path);
const previous = await read(plan.previousFreeze);
for (const [path, expected] of Object.entries(previous.files)) assert.equal(await sha(path), expected, path);
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], {cwd:plan.worktree, encoding:'utf8'}).trim(), plan.productionHead);
assert.equal(execFileSync('git', ['status', '--porcelain'], {cwd:plan.worktree, encoding:'utf8'}).trim(), '');
assert.equal(await sha(plan.stoppedLedger), plan.stoppedLedgerSha256);
assert(process.argv.includes('--no-proxy'), '--no-proxy required');
assert(process.argv.slice(2).every(arg => ['--no-proxy', '--plan-only'].includes(arg)));
if (process.argv.includes('--plan-only')) {
  console.log(JSON.stringify({mode:'PLAN_ONLY', notBefore:plan.notBefore, network:0, modelCalls:0,
    formalProbes:0, previousFreezeFiles:Object.keys(previous.files).length, ledgerPreserved:true}));
  process.exit(0);
}
assert(Date.now() >= Date.parse(plan.notBefore), 'USER_WAIT_NOT_ELAPSED');
assert(Date.now() <= Date.parse(plan.latestStart), 'RECHECK_WINDOW_EXPIRED');
const directory = resolve(root, 'attempt-1');
await mkdir(directory); // Atomic one-shot claim; an interrupted attempt is never retried implicitly.
const startedAt = new Date().toISOString();
await writeFile(resolve(directory, 'started.json'), JSON.stringify({startedAt, productionHead:plan.productionHead,
  scope:plan.scope, oldStopPreserved:true}, null, 2)+'\n', {flag:'wx'});
let outcome = 'FAILED', failureCode = null;
try {
  const {resolveEffectiveLiveNetworkConfiguration, environmentWithEffectiveLiveNetwork} =
    await import(pathToFileURL(resolve(plan.worktree, 'src/eval/restaurant/agent-loop/live-preflight.ts')).href);
  const {runDiscoveryProbePreflight} =
    await import(pathToFileURL(resolve(plan.worktree, 'src/eval/restaurant/agent-loop/discovery-probe.ts')).href);
  const network = resolveEffectiveLiveNetworkConfiguration(process.env);
  assert.equal(network.proxyMode, 'DISABLED_BY_CLI');
  await runDiscoveryProbePreflight({environment:environmentWithEffectiveLiveNetwork(process.env, network),
    network, artifactDirectory:directory});
  outcome = 'PASSED';
} catch (error) {
  failureCode = error.code ?? error.name ?? 'PREFLIGHT_ERROR';
}
assert.equal(await sha(plan.stoppedLedger), plan.stoppedLedgerSha256);
const artifacts = {};
for (const name of await readdir(directory)) artifacts[name] = await sha(resolve(directory, name));
const summary = {mode:'USER_APPROVED_NETWORK_PREFLIGHT_RECHECK', startedAt,
  finishedAt:new Date().toISOString(), outcome, failureCode, modelCalls:0, googleDiscoveryRequests:0,
  formalProbes:0, fullLive:0, sourceDataPreflight:'NOT_RUN', checkpointStopUnchanged:true,
  automaticRetryAllowed:false, artifacts};
await writeFile(resolve(directory, 'summary.json'), JSON.stringify(summary, null, 2)+'\n', {flag:'wx'});
console.log(JSON.stringify(summary));
if (outcome !== 'PASSED') process.exitCode = 2;
