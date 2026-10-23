import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = '.eval-artifacts/phase3a-prime/f2a', mode = process.argv[2];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await fs.readFile(`${root}/inputs/manifest.json`));
for (const [file, hash] of Object.entries(manifest.files)) assert.equal(sha(await fs.readFile(`${root}/inputs/${file}`)), hash);
let externalCalls = 0;
globalThis.fetch = () => { externalCalls++; throw Error('OFFLINE_ONLY'); };
const { evaluateRestaurantHybridLiveArtifact } = await import('../../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts');
const bytes = gunzipSync(await fs.readFile(`${root}/inputs/${manifest.h12.path}`));
assert.equal(sha(bytes), manifest.h12.originalSha256);
const evaluation = evaluateRestaurantHybridLiveArtifact(JSON.parse(bytes), { path: manifest.h12.originalPath, sha256: sha(bytes) });
const output = { commit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding:'utf8'}).trim(), timezone:'Europe/Vienna', evaluatedAt:new Date().toLocaleString('sv-SE',{timeZone:'Europe/Vienna'}), inputSha256:sha(bytes), externalCalls, evaluation };
assert.equal(externalCalls, 0);
await fs.mkdir(`${root}/evaluations`, {recursive:true});
await fs.writeFile(`${root}/evaluations/h-12.${mode}.json`, JSON.stringify(output,null,2)+'\n', {flag:'wx'});
if (mode === '34') {
  const old = JSON.parse(await fs.readFile(`${root}/evaluations/h-12.33.json`));
  const changes = [];
  function diff(a,b,path='') {
    if (JSON.stringify(a)===JSON.stringify(b)) return;
    if (!a || !b || typeof a!=='object' || typeof b!=='object' || Array.isArray(a)!==Array.isArray(b)) {changes.push({path,before:a,after:b});return;}
    for(const key of new Set([...Object.keys(a),...Object.keys(b)])) diff(a[key],b[key],path?`${path}.${key}`:key);
  }
  diff(old.evaluation,evaluation);
  await fs.writeFile(`${root}/evaluations/h-12.diff.json`,JSON.stringify({changes,externalCalls},null,2)+'\n',{flag:'wx'});
  assert.ok(changes.length>1);
  assert.ok(changes.every(row=>row.path==='evaluatorVersion'||row.path==='rubricVersion'||row.path.startsWith('findings.0.')), 'Only authoritative-conditions finding and evaluator/rubric identity may differ');
}
console.log(JSON.stringify({version:evaluation.evaluatorVersion,authority:evaluation.findings[0].status,outcome:evaluation.outcome.type,externalCalls}));
