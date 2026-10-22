// P2-3 offline calibration. Original22 inputs/Gold unchanged; freeze automatic
// outputs before the separate existing comparison tool reads reviewer labels.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { evaluateFrozenCalibrationArtifact } from '../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts';
const base = '.eval-artifacts/p2-3-conditions-20261019';
const output = `${base}/calibration`;
globalThis.fetch = () => { throw Error('P23_OFFLINE_NETWORK_FORBIDDEN'); };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const freezePath = `${base}/calibration-freeze.json`, freezeBytes = await fs.readFile(freezePath), freeze = JSON.parse(freezeBytes);
const verify = async () => { for (const [path, hash] of Object.entries(freeze.files)) if (sha(await fs.readFile(path)) !== hash) throw Error(`FROZEN_INPUT_OR_CODE_CHANGED:${path}`); };
await verify();
await fs.mkdir(output); // Never replace original or prior outputs.
const manifestPath = '.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json';
const bytes = await fs.readFile(manifestPath), manifest = JSON.parse(bytes);
if (manifest.entries.length !== 22) throw Error('Expected22 frozen rows');
const codeCommit = execFileSync('git', ['rev-parse','HEAD'], { encoding:'utf8' }).trim();
const rows = [];
for (const input of manifest.entries) {
  const {evaluation,outputPath} = await evaluateFrozenCalibrationArtifact(manifestPath,input.runId,`${output}/evaluations`,'.eval-artifacts/e1-evaluator-20261016/witness-inputs.json','.eval-artifacts/e1-evaluator-20261016/calibration-observations.rev2.json','.eval-artifacts/e1-evaluator-20261016/gold-corrections.json');
  rows.push({runId:input.runId,outputPath,outputSha256:sha(await fs.readFile(outputPath)),outcome:evaluation.outcome.type,declaration:evaluation.severity.S0_DECLARATION.status,boundary:evaluation.severity.S0_BOUNDARY.status});
}
await verify();
await fs.writeFile(`${output}/summary.json`,JSON.stringify({status:'AUTOMATIC_OUTPUTS_FROZEN_NOT_YET_COMPARED_TO_LABELS',codeCommit,manifest:{path:manifestPath,sha256:sha(bytes)},configuration:{path:freezePath,sha256:sha(freezeBytes)},models:0,live:0,externalNetwork:0,rows},null,2),{flag:'wx'});
console.log(JSON.stringify({rows:rows.length,models:0,network:0,output},null,2));
