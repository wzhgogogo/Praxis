import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {evaluateFrozenCalibrationArtifact} from '../../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts';
const dir='.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021';
globalThis.fetch=()=>{throw Error('CALIBRATION_OFFLINE_ONLY');};
const sha=b=>createHash('sha256').update(b).digest('hex');
const freezeBytes=await fs.readFile(`${dir}/freeze.json`),freeze=JSON.parse(freezeBytes);
for(const [p,h]of Object.entries(freeze.files))if(sha(await fs.readFile(p))!==h)throw Error(`FROZEN_CHANGED:${p}`);
const manifestPath='.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json',bytes=await fs.readFile(manifestPath),manifest=JSON.parse(bytes);
if(manifest.entries.length!==22)throw Error('ORIGINAL_22_REQUIRED');
const output=`${dir}/calibration`;await fs.mkdir(output);const rows=[];
for(const input of manifest.entries){
 const {evaluation,outputPath}=await evaluateFrozenCalibrationArtifact(manifestPath,input.runId,`${output}/evaluations`,'.eval-artifacts/e1-evaluator-20261016/witness-inputs.json','.eval-artifacts/e1-evaluator-20261016/calibration-observations.rev2.json','.eval-artifacts/e1-evaluator-20261016/gold-corrections.json');
 rows.push({runId:input.runId,outputPath,outputSha256:sha(await fs.readFile(outputPath)),outcome:evaluation.outcome.type,declaration:evaluation.severity.S0_DECLARATION.status,boundary:evaluation.severity.S0_BOUNDARY.status});
}
await fs.writeFile(`${output}/summary.json`,JSON.stringify({status:'AUTOMATIC_OUTPUTS_FROZEN_NOT_YET_COMPARED_TO_LABELS',codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),manifest:{path:manifestPath,sha256:sha(bytes)},configuration:{path:`${dir}/freeze.json`,sha256:sha(freezeBytes)},models:0,live:0,externalNetwork:0,rows},null,2),{flag:'wx'});
console.log(JSON.stringify({status:'AUTOMATIC_OUTPUTS_FROZEN',count:rows.length,models:0,websites:0}));
