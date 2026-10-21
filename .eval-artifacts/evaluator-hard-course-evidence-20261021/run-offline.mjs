import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {evaluateFrozenCalibrationArtifact} from '../../src/eval/restaurant/agent-loop/runners/run-hybrid-artifact-evaluation.ts';
import {evaluateRestaurantHybridLiveArtifact} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts';
import {loadHardCriterionEvidence} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-hard.ts';
import {loadPostDeliveryTabelogObservation} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-grounding.ts';
import {loadWitnessOracle} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-witness.ts';
import {parseReviewedReads} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
import {applyTableCheckReview} from '../checkpoint-c-live-20261020/tablecheck-post-review.mjs';
const dir='.eval-artifacts/evaluator-hard-course-evidence-20261021',base='.eval-artifacts/checkpoint-c-live-20261020';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
globalThis.fetch=()=>{throw Error('OFFLINE_NO_EXTERNAL_NETWORK_OR_MODELS');};
const frozenBytes=await fs.readFile(`${dir}/freeze.json`),freeze=JSON.parse(frozenBytes);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
const manifestPath='.eval-artifacts/calibration-phase1-20261015/inputs/manifest.json',bytes=await fs.readFile(manifestPath),manifest=JSON.parse(bytes),rows=[];
assert.equal(manifest.entries.length,22);await fs.mkdir(`${dir}/calibration`);
for(const input of manifest.entries){const{evaluation,outputPath}=await evaluateFrozenCalibrationArtifact(manifestPath,input.runId,`${dir}/calibration/evaluations`,'.eval-artifacts/e1-evaluator-20261016/witness-inputs.json','.eval-artifacts/e1-evaluator-20261016/calibration-observations.rev2.json','.eval-artifacts/e1-evaluator-20261016/gold-corrections.json');rows.push({runId:input.runId,outputPath:path.relative(process.cwd(),outputPath),outputSha256:sha(await fs.readFile(outputPath)),outcome:evaluation.outcome.type,declaration:evaluation.severity.S0_DECLARATION.status,boundary:evaluation.severity.S0_BOUNDARY.status});}
await fs.writeFile(`${dir}/calibration/summary.json`,JSON.stringify({status:'AUTOMATIC_OUTPUTS_FROZEN_NOT_YET_COMPARED_TO_LABELS',codeCommit:freeze.codeCommit,manifest:{path:manifestPath,sha256:sha(bytes)},configuration:{path:`${dir}/freeze.json`,sha256:sha(frozenBytes)},models:0,websites:0,rows},null,2),{flag:'wx'});
const comparisons=[];await fs.mkdir(`${dir}/quick-reevaluations`);
for(const id of ['c-01','c-02','c-05']){
 const root=`${base}/continuous-retry-20261021/quick-live-results/${id}-attempt-1`,filename=(await fs.readdir(`${root}/runner`)).find(p=>p.endsWith('.result.json')),p=`${root}/runner/${filename}`,bytes=await fs.readFile(p),artifact=JSON.parse(bytes),post=await read(`${root}/post-run/post-check.json`);
 const postDelivery=post.rows.filter(r=>r.raw?.status===200).map(r=>loadPostDeliveryTabelogObservation(`${root}/post-run/${path.basename(r.raw.metadataPath)}`,`${root}/post-run/${path.basename(r.raw.bodyPath)}`));
 const originalPath=`${base}/criterion-presentation-20261021/quick-reevaluations/${id}.evaluation.31.json`,previous=await read(originalPath);
 const outer=existsSync(`${root}/outer-observations.jsonl`)?(await fs.readFile(`${root}/outer-observations.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse):[];
 const witnessOracle=loadWitnessOracle({manifestPath:`${root}/post-run/manifest.json`,registryPath:`${base}/witness-completion-20261020/registry.certified.json`,variantId:artifact.caseId,artifactSha256:sha(bytes)});
 const evaluation=evaluateRestaurantHybridLiveArtifact(artifact,{path:p,sha256:sha(bytes)},{reviewedReads:parseReviewedReads(await fs.readFile(`${base}/reviewed-reads.json`),`${base}/reviewed-reads.json`),postDeliveryTabelog:postDelivery,trace:[...(artifact.diagnostics?.browserTrace??[]),...outer],witnessOracle,hardEvidence:loadHardCriterionEvidence(`${dir}/hard-evidence.json`,sha(bytes))});
 const rated=applyTableCheckReview(evaluation,post.rows),outputPath=`${dir}/quick-reevaluations/${id}.evaluation.32.json`;
 await fs.writeFile(outputPath,JSON.stringify({...rated,referenceOnly:true,previousEvaluation:{path:originalPath,sha256:sha(await fs.readFile(originalPath))}},null,2),{flag:'wx'});
 comparisons.push({runId:id,originalArtifact:{path:p,sha256:sha(bytes)},previous:{path:originalPath,sha256:sha(await fs.readFile(originalPath)),evaluator:previous.evaluatorVersion,outcome:previous.outcome.type,conditions:previous.conditionStates,comparisons:previous.conditionStateComparisons},current:{path:outputPath,sha256:sha(await fs.readFile(outputPath)),evaluator:rated.evaluatorVersion,outcome:rated.outcome.type,conditions:rated.conditionStates,comparisons:rated.conditionStateComparisons,findings:rated.conditionEvidenceFindings,severity:rated.severity}});
}
await verify();await fs.writeFile(`${dir}/quick-comparison.json`,JSON.stringify({referenceOnly:true,originalQuickGate:'1/3 remains unchanged; reference-only offline reevaluation',newModels:0,newWebsites:0,rows:comparisons},null,2),{flag:'wx'});
await fs.writeFile(`${dir}/freeze-verification-after.json`,JSON.stringify({status:'PASS',freezeSha256:sha(frozenBytes),filesVerified:Object.keys(freeze.files).length,models:0,websites:0},null,2),{flag:'wx'});
console.log(JSON.stringify({calibration:22,quick:comparisons.map(r=>({run:r.runId,outcome:r.current.outcome,conditions:r.current.conditions.map(c=>c.criteria.map(x=>x.status))})),models:0,websites:0}));
