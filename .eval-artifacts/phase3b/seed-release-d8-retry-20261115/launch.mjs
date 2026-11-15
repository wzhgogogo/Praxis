import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root = dirname(fileURLToPath(import.meta.url));
const configPath = join(root, 'd8', 'config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const due = Date.parse(config.notBeforeUTC);
if (!Number.isFinite(due)) throw new Error('Invalid requested start time');
console.log(JSON.stringify({ stage: 'WAITING_TEN_MINUTES', notBeforeUTC: config.notBeforeUTC }));
while (Date.now() < due) await new Promise(resolve => setTimeout(resolve, Math.min(30_000, due - Date.now())));
console.log(JSON.stringify({ stage: 'STARTING_ONE_D8_ATTEMPT', atUTC: new Date().toISOString() }));
const child = spawn(process.execPath, [
  '--env-file=' + config.environmentFile, '--import', 'tsx',
  join(root, 'run-smoke.ts'), configPath,
], {
  cwd: config.evidenceRoot,
  env: { ...process.env, PRAXIS_RUN_SEED_REMAINING: '1' },
  stdio: 'inherit',
});
child.once('error', () => { console.error(JSON.stringify({stage:'LAUNCH_FAILED'})); process.exitCode=1; });
child.once('exit', code => { process.exitCode = code ?? 1; });
