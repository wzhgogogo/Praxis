// Offline only. Freeze every automatic output before the separate comparison
// script is allowed to read labels. Never modifies an original run or old score.
import fs from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { evaluateFrozenCalibrationArtifact } from '../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts';

globalThis.fetch = () => { throw Error('E1_OFFLINE_NETWORK_FORBIDDEN'); };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const base = '.eval-artifacts/e1-evaluator-20261016';
const output = process.argv[2];
if (!output || relative(resolve(base), resolve(output)).startsWith('..') || resolve(output) === resolve(base)) throw Error('Pass a fresh calibration subdirectory');
const freezePath = `${base}/review-followup/config-freeze.json`, freezeBytes = await fs.readFile(freezePath), freeze = JSON.parse(freezeBytes);
const verify = async () => { for (const [path, expected] of Object.entries(freeze.files)) if (sha(await fs.readFile(path)) !== expected) throw Error(`FROZEN_INPUT_OR_CODE_CHANGED:${path}`); };
await verify();
await fs.mkdir(output); // refuse replacing a prior run
const manifestPath = '.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json';
const bytes = await fs.readFile(manifestPath), manifest = JSON.parse(bytes);
if (manifest.entries.length !== 22) throw Error('Unexpected input denominator');
const codeCommit = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const rows = [];
for (const input of manifest.entries) {
  const saved = await evaluateFrozenCalibrationArtifact(manifestPath, input.runId, `${output}/evaluations`, `${base}/witness-inputs.json`, `${base}/calibration-observations.rev2.json`, `${base}/gold-corrections.json`);
  const raw = await fs.readFile(saved.outputPath);
  rows.push({runId:input.runId, outputPath:relative(process.cwd(),saved.outputPath), outputSha256:sha(raw), outcome:saved.evaluation.outcome.type, declaration:saved.evaluation.severity.S0_DECLARATION.status, boundary:saved.evaluation.severity.S0_BOUNDARY.status});
}
await verify();
const summary = {status:'AUTOMATIC_OUTPUTS_FROZEN_NOT_YET_COMPARED_TO_LABELS',codeCommit,manifest:{path:manifestPath,sha256:sha(bytes)},configuration:{path:freezePath,sha256:sha(freezeBytes)},models:0,live:0,externalNetwork:0,rows};
await fs.writeFile(`${output}/summary.json`,JSON.stringify(summary,null,2),{flag:'wx'});
console.log(JSON.stringify(summary,null,2));
