import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { HERE, ROOT, SPEC, sha, loadInputs, readJson, writeJson, runExperiment, verifyFreeze } from './experiment.mjs';

export function compatibleInit(init, variant) {
  if (variant !== 'V2') return init;
  const body = JSON.parse(init.body);
  if (body.tool_choice?.function?.name !== 'browser_read_action' || body.thinking?.type !== 'enabled'
    || body.tools.length !== 1 || body.tools[0].function.strict !== true) throw new Error('UNEXPECTED_V2_PAYLOAD');
  body.tool_choice = 'auto';
  return { ...init, body: JSON.stringify(body) };
}

export async function priorAndRemaining() {
  const original = resolve(HERE, 'model-replay');
  const files = (await readdir(resolve(original, 'results'))).filter(f => !f.endsWith('.provider.json'));
  const rows = await Promise.all(files.map(f => readJson(resolve(original, 'results', f))));
  if (rows.length !== 3 || rows.filter(r => r.response).length !== 2
    || rows.find(r => r.variant === 'V2')?.error?.providerStatus !== 400) throw new Error('UNEXPECTED_PRIOR_ATTEMPTS');
  const successful = new Set(rows.filter(r => r.response).map(r => r.id));
  const tasks = (await readJson(resolve(HERE, 'schedule.json'))).filter(t => !successful.has(t.id));
  if (tasks.length !== 274) throw new Error('RESUME_COUNT_MISMATCH');
  return { rows, tasks, priorCalls: rows.length };
}

export async function verifyCompatibilityFreeze() {
  const bytes = await readFile(resolve(HERE, 'compat-freeze.json'));
  const manifest = JSON.parse(bytes);
  for (const f of manifest.files) if (sha(await readFile(resolve(ROOT, f.path))) !== f.sha256) throw new Error(`COMPAT_FREEZE_MISMATCH:${f.path}`);
  return { sha256: sha(bytes), files: manifest.files.length };
}

async function freezeCompatibility() {
  await verifyFreeze();
  const prior = await priorAndRemaining();
  const input = await loadInputs();
  // Use the Gateway's exact frozen request-body receipts to verify wire change,
  // and reuse the already frozen high-level request hashes for unstarted calls.
  await writeJson(resolve(HERE, 'compat-schedule.json'), { priorCalls: prior.priorCalls, totalPlannedApiRequests: 277,
    actualWireOverride: { variant: 'V2', field: 'tool_choice', value: 'auto' }, tasks: prior.tasks });
  const files = new Map((await readJson(resolve(HERE, 'freeze.json'))).files.map(f => [f.path, f]));
  const add = async path => files.set(path, { path, sha256: sha(await readFile(resolve(ROOT, path))) });
  for (const name of ['freeze.json', 'compatibility-plan.md', 'compat-resume.mjs', 'compat-resume.test.mjs', 'compat-controls.json', 'compat-schedule.json', 'aggregate.mjs', 'phase2-ledger-interim.json']) await add(`${HERE.slice(ROOT.length + 1)}/${name}`);
  const addTree = async path => { for (const f of await readdir(path, { withFileTypes: true })) {
    const next = resolve(path, f.name); if (f.isDirectory()) await addTree(next); else await add(next.slice(ROOT.length + 1));
  } };
  await addTree(resolve(HERE, 'model-replay'));
  await writeJson(resolve(HERE, 'compat-freeze.json'), { schema: 'checkpoint-c-calendar-compat-freeze@1',
    baselineModelCalls: SPEC.baselineModelCalls, alreadyAttempted: prior.priorCalls, remainingPlanned: prior.tasks.length,
    wholeExperimentApiLimit: SPEC.hardCallLimit, seeds: input.seeds.length,
    files: [...files.values()].sort((a, b) => a.path.localeCompare(b.path)) });
  return verifyCompatibilityFreeze();
}

async function runCompatibility() {
  const freeze = await verifyCompatibilityFreeze();
  await verifyFreeze();
  const input = await loadInputs(), prior = await priorAndRemaining();
  if (execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' }).trim()) throw new Error('WORKTREE_NOT_CLEAN');
  const committedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  const directory = resolve(HERE, 'model-replay-compat-auto');
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('UNSCOPED_NETWORK_DISABLED'); };
  let additionalRequests = 0;
  const summary = await runExperiment({ directory, mode: 'REAL_MODEL_REPLAY', input, tasks: prior.tasks,
    freeze, committedSha, providerFetch: async (url, init, task) => {
      if (prior.priorCalls + additionalRequests >= SPEC.hardCallLimit
        || SPEC.baselineModelCalls + prior.priorCalls + additionalRequests >= SPEC.phaseModelLimit) throw new Error('CUMULATIVE_BUDGET_EXHAUSTED');
      additionalRequests++;
      const wire = compatibleInit(init, task.variant);
      await writeJson(resolve(directory, 'attempts', `${task.id}.actual-transport.json`), {
        endpoint: String(url), method: wire.method, gatewayBodySha256: sha(init.body),
        actualBodySha256: sha(wire.body), toolChoice: task.variant === 'V2' ? 'auto' : 'NAMED_FUNCTION',
        cumulativeApiAttempt: prior.priorCalls + additionalRequests,
      });
      return nativeFetch(url, wire);
    } });
  const verified = await verifyCompatibilityFreeze();
  await writeJson(resolve(directory, 'compat-freeze-after.json'), verified);
  console.log(JSON.stringify({ finished: true, newRequests: summary.actualModelCalls,
    wholeExperimentRequests: prior.priorCalls + summary.actualModelCalls, stopped: summary.stopped }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--freeze') console.log(JSON.stringify(await freezeCompatibility()));
  else if (process.argv[2] === '--run') await runCompatibility();
  else throw new Error('EXPECTED_--freeze_OR_--run');
}
