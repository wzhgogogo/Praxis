import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {evaluateFrozenCalibrationArtifact} from '../../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts';
import {evaluateRestaurantHybridLiveArtifact} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts';
import {loadPostDeliveryTabelogObservation} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-grounding.ts';
import {parseReviewedReads} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
import {loadWitnessOracle} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-witness.ts';
import {applyTableCheckReview} from '../tablecheck-post-review.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021';
const previous='.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const freezeBytes=await fs.readFile(`${dir}/freeze.json`),freeze=JSON.parse(freezeBytes),commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
globalThis.fetch=()=>{throw Error('OFFLINE_NO_NETWORK_OR_MODEL');};
const manifestPath='.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json',manifestBytes=await fs.readFile(manifestPath),manifest=JSON.parse(manifestBytes),rows=[];
assert.equal(manifest.entries.length,22);
await fs.mkdir(`${dir}/calibration`);
for(const input of manifest.entries){
 const {evaluation,outputPath}=await evaluateFrozenCalibrationArtifact(manifestPath,input.runId,`${dir}/calibration/evaluations`,'.eval-artifacts/e1-evaluator-20261016/witness-inputs.json','.eval-artifacts/e1-evaluator-20261016/calibration-observations.rev2.json','.eval-artifacts/e1-evaluator-20261016/gold-corrections.json');
 rows.push({runId:input.runId,outputPath,outputSha256:sha(await fs.readFile(outputPath)),outcome:evaluation.outcome.type,declaration:evaluation.severity.S0_DECLARATION.status,boundary:evaluation.severity.S0_BOUNDARY.status});
}
await fs.writeFile(`${dir}/calibration/summary.json`,JSON.stringify({status:'AUTOMATIC_OUTPUTS_FROZEN_NOT_YET_COMPARED_TO_LABELS',codeCommit:commit,manifest:{path:manifestPath,sha256:sha(manifestBytes)},configuration:{path:`${dir}/freeze.json`,sha256:sha(freezeBytes)},models:0,websites:0,rows},null,2),{flag:'wx'});
console.log(JSON.stringify({calibration:22,status:'OUTPUTS_FROZEN_BEFORE_LABEL_COMPARISON'}));
const comparisons=[],oldMissing=[];
await fs.mkdir(`${dir}/quick-reevaluations`);
for(const id of ['c-01','c-02','c-05']){
 const root=`${previous}/quick-live-results/${id}-attempt-1`,runner=`${root}/runner`,filename=(await fs.readdir(runner)).find(p=>p.endsWith('.result.json'));
 const p=`${runner}/${filename}`,bytes=await fs.readFile(p),artifact=JSON.parse(bytes),oldPath=`${root}/independent.evaluation.json`,oldBytes=await fs.readFile(oldPath),old=JSON.parse(oldBytes),post=await read(`${root}/post-run/post-check.json`);
 const postDelivery=post.rows.filter(r=>r.raw?.status===200).map(r=>loadPostDeliveryTabelogObservation(`${root}/post-run/${path.basename(r.raw.metadataPath)}`,`${root}/post-run/${path.basename(r.raw.bodyPath)}`));
 const outer=existsSync(`${root}/outer-observations.jsonl`)?(await fs.readFile(`${root}/outer-observations.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse):[];
 const oldFreeze=await read(`${previous}/quick-live-freeze.json`);
 const registryPath=Object.keys(oldFreeze.files).find(p=>p.endsWith('/witness-completion-20261020/registry.certified.json'));
 const witnessOracle=registryPath?loadWitnessOracle({manifestPath:`${root}/post-run/manifest.json`,registryPath,variantId:artifact.caseId,artifactSha256:sha(bytes)}):undefined;
 const evaluation=evaluateRestaurantHybridLiveArtifact(artifact,{path:p,sha256:sha(bytes)},{reviewedReads:parseReviewedReads(await fs.readFile('.eval-artifacts/checkpoint-c-live-20261020/reviewed-reads.json'),'.eval-artifacts/checkpoint-c-live-20261020/reviewed-reads.json'),postDeliveryTabelog:postDelivery,trace:[...(artifact.diagnostics?.browserTrace??[]),...outer],...(witnessOracle?{witnessOracle}:{})});
 const rated=applyTableCheckReview(evaluation,post.rows),out=`${dir}/quick-reevaluations/${id}.evaluation.31.json`;
 await fs.writeFile(out,JSON.stringify({...rated,referenceOnly:true,originalEvaluation:{path:oldPath,sha256:sha(oldBytes)}},null,2),{flag:'wx'});
 const missing=old.conditionStateComparisons.filter(r=>r.assessment==='HISTORICAL_DISPLAY_NOT_RECORDED');
 for(const row of missing){const replacement=rated.conditionStateComparisons.find(r=>r.candidateId===row.candidateId&&r.text===row.text);assert.ok(replacement&&replacement.displayed!=='NOT_RECORDED');oldMissing.push({runId:id,old:row,new:replacement});}
 comparisons.push({runId:id,artifact:{path:p,sha256:sha(bytes)},original:{path:oldPath,sha256:sha(oldBytes),evaluator:old.evaluatorVersion,outcome:old.outcome,severity:old.severity,conditions:old.conditionStates,display:old.conditionStateComparisons},reevaluation:{path:out,sha256:sha(await fs.readFile(out)),evaluator:rated.evaluatorVersion,outcome:rated.outcome,severity:rated.severity,findings:rated.findings,conditions:rated.conditionStates,display:rated.conditionStateComparisons},elapsedMs:artifact.resourceUsage.elapsedMs,modelCalls:artifact.resourceUsage.modelCallsStarted,delivered:artifact.finalSnapshot.domainState.presentedResults.candidateIds.length});
 assert.equal(sha(await fs.readFile(p)),sha(bytes));assert.equal(sha(await fs.readFile(oldPath)),sha(oldBytes));
 console.log(JSON.stringify({runId:id,old:old.outcome.type,new:rated.outcome.type,oldMissing:missing.length,newMissing:rated.conditionStateComparisons.filter(r=>r.displayed==='NOT_RECORDED').length}));
}
assert.equal(oldMissing.length,8);
await fs.writeFile(`${dir}/quick-comparison.json`,JSON.stringify({referenceOnly:true,originalQuickGate:'1/3; NOT_PASSED retained; no gate supplementation',models:0,websites:0,rows:comparisons,originalEightMissingRows:oldMissing},null,2),{flag:'wx'});
await verify();
