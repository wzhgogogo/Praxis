import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {evaluateRestaurantHybridLiveArtifact as evaluate} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts';
import {loadPostDeliveryTabelogObservation as loadPost} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-grounding.ts';
import {loadWitnessOracle} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-witness.ts';
import {parseReviewedReads} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
import {loadCriterionCorrespondences} from '../../../src/eval/restaurant/agent-loop/criterion-correspondence.ts';
import {loadHardCriterionEvidence} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-hard.ts';
import {applyTableCheckReview} from '../tablecheck-post-review.mjs';
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/c18-bidirectional-acceptance-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
let externalCalls=0;globalThis.fetch=()=>{externalCalls++;throw Error('OFFLINE_DISPLAY_EVALUATION_NO_NETWORK_OR_MODEL');};
const freezeBytes=await fs.readFile(`${dir}/display-evaluation-freeze.json`),freeze=JSON.parse(freezeBytes);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
const lineage=await read(`${dir}/display-replay-lineage.json`),rows=[];
const correspondences=loadCriterionCorrespondences(path.resolve(`${dir}/display-derived-correspondences.json`)),reviewedPath=`${base}/reviewed-reads.json`,reviewedReads=parseReviewedReads(await fs.readFile(reviewedPath),path.resolve(reviewedPath));
await fs.mkdir(`${dir}/display-evaluations-33`);
for(const row of lineage.rows){
 const previousDir=`${base}/c18-offline-reassessment-20261022`;
 const before=await read(`${previousDir}/${row.replayStatus==='ROUTER_REDUCER_COMPLETED'?'display-evaluations-32':'evaluations-32'}/${row.runId}.evaluation.json`);
 if(row.replayStatus!=='ROUTER_REDUCER_COMPLETED'){rows.push({runId:row.runId,caseId:row.caseId,replayStatus:row.replayStatus,originalArtifactSha256:row.artifactSha256,beforeEvaluation:before,afterEvaluation:null,conditionChanges:[],reason:row.reason});continue;}
 const bytes=await fs.readFile(row.derivedArtifactPath);assert.equal(sha(bytes),row.derivedArtifactSha256);const artifact=JSON.parse(bytes),post=await read(`${row.attempt}/post-run/post-check.json`);
 const postDelivery=post.rows.filter(r=>r.raw?.status===200).map(r=>loadPost(r.raw.metadataPath,r.raw.bodyPath));
 const witnessOracle=post.manifestPath?loadWitnessOracle({manifestPath:post.manifestPath,registryPath:`${base}/checkpoint-c-rerun-20261021/registry.certified.json`,variantId:row.caseId,artifactSha256:row.derivedArtifactSha256}):undefined;
 let outer=[];try{outer=(await fs.readFile(`${row.attempt}/outer-observations.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(e){if(e.code!=='ENOENT')throw e;}
 const options={criterionCorrespondences:correspondences,reviewedReads,postDeliveryTabelog:postDelivery,trace:[...(artifact.diagnostics?.browserTrace??[]),...outer],orchestration:(await read(`${row.attempt}/finish.json`)).orchestration,...(witnessOracle?{witnessOracle}:{}),hardEvidence:loadHardCriterionEvidence(`${dir}/display-derived-hard-evidence.json`,row.derivedArtifactSha256)};
 const evaluation=applyTableCheckReview(evaluate(artifact,{path:path.resolve(row.derivedArtifactPath),sha256:row.derivedArtifactSha256},options),post.rows);
 const output=`${dir}/display-evaluations-33/${row.runId}.evaluation.json`;
 await put(output,{...evaluation,offlineDisplayReplay:{mode:'COUNTERFACTUAL_DISPLAY_ONLY_NOT_LIVE',sourceOriginalArtifact:row.artifactPath,sourceOriginalSha256:row.artifactSha256,derivedSha256:row.derivedArtifactSha256,lineagePath:`${dir}/display-replay-lineage.json`,evaluationFreezeSha256:sha(freezeBytes),newModels:0,newWebsites:0,newLiveRuns:0}});
 const comparisons=evaluation.conditionStateComparisons.map(after=>{
  const prior=before.conditionStateComparisons.find(c=>c.candidateId===after.candidateId&&c.criterionRef===after.criterionRef&&c.text===after.text);assert.ok(prior,'all current @32 criteria must retain identity');
  return{candidateId:after.candidateId,criterionRef:after.criterionRef,text:after.text,before:prior,after,change:`${prior.assessment} -> ${after.assessment}`};
 });
 assert.equal(comparisons.length,before.conditionStateComparisons.length);
 rows.push({runId:row.runId,caseId:row.caseId,replayStatus:row.replayStatus,originalArtifactSha256:row.artifactSha256,derivedArtifactSha256:row.derivedArtifactSha256,outputPath:output,outputSha256:sha(await fs.readFile(output)),beforeEvaluation:before,afterEvaluation:evaluation,conditionChanges:comparisons});
 console.log(JSON.stringify({run:row.runId,outcome:evaluation.outcome.type,comparisons:comparisons.map(x=>x.change)}));
}
assert.equal(externalCalls,0);await verify();
const comparisons=rows.flatMap(r=>r.conditionChanges??[]);
const tempura=[['c-06','13320287'],['c-10','13320287'],['c-10','13282321'],['c-14','13192886']].map(([runId,id])=>{const r=rows.find(r=>r.runId===runId);const c=r.conditionChanges.find(c=>c.candidateId.endsWith('/'+id)&&c.text==='tempura');assert.ok(c);return{runId,id,...c};});
const utou=['c-05','c-09','c-13'].map(runId=>{const r=rows.find(r=>r.runId===runId);const c=r.conditionChanges.find(c=>c.candidateId.endsWith('/13300814')&&c.criterionRef==='criterion:0');assert.ok(c);return{runId,...c};});
const unsupported=comparisons.filter(c=>c.after.assessment==='S1_UNSUPPORTED'),missed=comparisons.filter(c=>c.after.assessment==='MISSED_KNOWN_CONDITION'),external=comparisons.filter(c=>c.after.assessment==='PRODUCT_UNKNOWN_EXTERNAL_SUPPORT');
const gate={status:[...tempura,...utou].every(c=>c.after.assessment==='CONSISTENT')&&unsupported.length===0&&missed.length===0?'PASS':'FAIL',tempura,utou,unsupported:unsupported.length,missed:missed.length,externalSupport:external.length,newModels:0,newWebsites:0,newLiveRuns:0};
await put(`${dir}/display-gate.json`,gate);
assert.equal(gate.status,'PASS','Four tempura and three Utou conditions consistent; no new unsupported or missed. External support is separate.');
await put(`${dir}/display-evaluation-comparison.json`,{status:'PENDING_INDEPENDENT_REVIEW',mode:'COUNTERFACTUAL_DISPLAY_ONLY_NOT_LIVE',freezeSha256:sha(freezeBytes),rows,newModels:0,newWebsites:0,newLiveRuns:0,externalCalls});
await put(`${dir}/display-evaluation-finished.json`,{status:'COMPLETED',at:new Date().toISOString(),newEvaluations:13,notApplicable:5,externalCalls,newModels:0,newWebsites:0,newLiveRuns:0,frozenFilesVerified:Object.keys(freeze.files).length,freezeSha256:sha(freezeBytes)});
