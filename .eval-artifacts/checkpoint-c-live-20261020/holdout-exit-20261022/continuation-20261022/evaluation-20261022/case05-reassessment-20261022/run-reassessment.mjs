import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='.eval-artifacts/checkpoint-c-live-20261020',source=`${base}/holdout-exit-20261022/continuation-20261022`,previous=`${source}/evaluation-20261022`,dir=`${previous}/case05-reassessment-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const load=async name=>import(pathToFileURL(path.resolve(`src/eval/restaurant/agent-loop/${name}.ts`)).href);
const[e,c,h,g,w,n,decoder,tc]=await Promise.all(['diagnostic-evaluator','criterion-correspondence','diagnostic-evaluator-hard','diagnostic-evaluator-grounding','diagnostic-evaluator-witness','diagnostic-evaluator-network','diagnostic-evaluator-record'].map(load).concat(import(pathToFileURL(path.resolve(`${base}/tablecheck-post-review.mjs`)).href)));
const freezeBytes=await fs.readFile(`${dir}/evaluation-freeze.json`),freeze=JSON.parse(freezeBytes);
const verify=async()=>{for(const[p,hash]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),hash,`FROZEN_CHANGED:${p}`);};await verify();
const inputs=await read(`${dir}/inputs.json`),correspondences=c.loadCriterionCorrespondences(path.resolve(`${previous}/criterion-correspondences.json`));
const reviewedPath=path.resolve(`${base}/reviewed-reads.json`),reviewedReads=n.parseReviewedReads(await fs.readFile(reviewedPath),reviewedPath);
await fs.mkdir(`${dir}/evaluations-33`);
await put(`${dir}/started.json`,{at:new Date().toISOString(),mode:'OFFLINE_APPROVED_LOSSLESS_INPUT_RECOVERY',freezeSha256:sha(freezeBytes),newModels:0,newWebsites:0,newLive:0});
const rows=[];
for(const input of inputs.rows){
 const bytes=await fs.readFile(input.originalArtifactPath);assert.equal(sha(bytes),input.originalArtifactSha256);const original=JSON.parse(bytes),correction=input.correction;
 const beforeCase=original.materializedCase,afterCase=correction.materializedCase,pointer='/materializedCase/acceptance/required_claims/1';
 assert.equal(sha(JSON.stringify(beforeCase)),correction.rev1Sha256);assert.equal(sha(JSON.stringify(afterCase)),correction.rev2Sha256);
 const beforeValue=beforeCase.acceptance.required_claims[1],afterValue=afterCase.acceptance.required_claims[1],key=Object.keys(beforeValue)[0];
 assert.equal(Object.keys(beforeValue).length,1);assert.equal(afterValue,`${key}: ${beforeValue[key]}`);
 assert.deepEqual({[afterValue.slice(0,key.length)]:afterValue.slice(key.length+2)},beforeValue);
 const restored=structuredClone(afterCase);restored.acceptance.required_claims[1]=beforeValue;assert.deepEqual(restored,beforeCase,'Only the approved field type may differ');
 const oldDecoded=decoder.readDiagnosticRun(original),newDecoded=decoder.readDiagnosticRun({...original,materializedCase:afterCase});
 const issuePath='materializedCase.acceptance.required_claims[1]';assert.ok(oldDecoded.issues.some(v=>v.path===issuePath&&v.reason==='INVALID_TYPE'));assert.ok(!newDecoded.issues.some(v=>v.path===issuePath));
 const post=await read(`${input.attempt}/post-run/post-check.json`),finish=await read(`${input.attempt}/finish.json`),gaps=[],postDelivery=[];
 for(const row of post.rows.filter(r=>r.raw?.status===200))try{postDelivery.push(g.loadPostDeliveryTabelogObservation(row.raw.metadataPath,row.raw.bodyPath));}catch(error){gaps.push({code:'POST_RESPONSE_VERIFICATION_FAILED',message:error.message});}
 let witnessOracle;if(post.manifestPath)try{witnessOracle=w.loadWitnessOracle({manifestPath:post.manifestPath,registryPath:`${source}/registry.json`,variantId:input.run.caseId,artifactSha256:input.originalArtifactSha256});}catch(error){gaps.push({code:'WITNESS_POST_VERIFICATION_FAILED',message:error.message});}
 let outer=[];try{outer=(await fs.readFile(`${input.attempt}/outer-observations.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(error){if(error.code!=='ENOENT')throw error;}
 const options={goldCorrection:correction,criterionCorrespondences:correspondences,hardEvidence:h.loadHardCriterionEvidence(input.hardEvidencePath,input.originalArtifactSha256),reviewedReads,postDeliveryTabelog:postDelivery,trace:[...(original.diagnostics?.browserTrace??[]),...outer],orchestration:finish.orchestration,...(witnessOracle?{witnessOracle}:{})};
 const evaluation=tc.applyTableCheckReview(e.evaluateRestaurantHybridLiveArtifact(original,{path:path.resolve(input.originalArtifactPath),sha256:input.originalArtifactSha256},options),post.rows);
 assert.ok(evaluation.evaluatorVersion.endsWith('@33'));assert.ok(evaluation.rubricVersion.endsWith('@29'));
 assert.ok(!evaluation.recordReadIssues.some(v=>v.path===issuePath));
 const output=`${dir}/evaluations-33/${input.run.runId}.evaluation.json`;
 await put(output,{...evaluation,losslessFormatRecovery:{mode:'OFFLINE_APPROVED_LOSSLESS_INPUT_RECOVERY',originalArtifactPath:input.originalArtifactPath,originalArtifactSha256:input.originalArtifactSha256,pointer,reviewPath:inputs.reviewPath,reviewSha256:inputs.reviewSha256,inputsPath:`${dir}/inputs.json`,freezeSha256:sha(freezeBytes),postEvidenceGaps:gaps,newModels:0,newWebsites:0,newLive:0}});
 // Baseline outcome is loaded only after the new automatic evaluation is saved.
 const oldBytes=await fs.readFile(input.previousEvaluationPath);assert.equal(sha(oldBytes),input.previousEvaluationSha256);const beforeEvaluation=JSON.parse(oldBytes);
 assert.equal(beforeEvaluation.outcome.type,'NOT_EVALUATED');
 assert.deepEqual(evaluation.conditionStates,beforeEvaluation.conditionStates,'Semantic/source condition judgments must not change from a metadata type recovery');
 assert.deepEqual(evaluation.conditionStateComparisons,beforeEvaluation.conditionStateComparisons,'No display or wording correspondence is changed');
 rows.push({run:input.run,originalArtifactPath:input.originalArtifactPath,originalArtifactSha256:input.originalArtifactSha256,previousEvaluationPath:input.previousEvaluationPath,previousEvaluationSha256:input.previousEvaluationSha256,before:beforeEvaluation.outcome,after:evaluation.outcome,evaluationPath:output,evaluationSha256:sha(await fs.readFile(output)),controls:{singleKeyStringValue:true,reversible:true,onlyApprovedFieldChanged:true,originalDecoderRejectsObject:true,correctedDecoderAcceptsString:true,conditionAndDisplayStatesUnchanged:true}});
 console.log(JSON.stringify({run:input.run.runId,before:beforeEvaluation.outcome.type,after:evaluation.outcome.type,S0Declaration:evaluation.severity.S0_DECLARATION.status,S0Boundary:evaluation.severity.S0_BOUNDARY.status}));
}
assert.equal(rows.length,3);await verify();
const guard=process.env.CHECKPOINT_C_ATTEMPT;assert.ok(guard,'Launch under offline-deny.mjs');
try{const denied=(await fs.readFile(`${guard}/network-denied.jsonl`,'utf8')).trim();assert.equal(denied,'','No attempted network access allowed');}catch(error){if(error.code!=='ENOENT')throw error;}
await put(`${dir}/comparison.json`,{status:'COMPLETED_PENDING_INDEPENDENT_REVIEW',evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',freezeSha256:sha(freezeBytes),rows,newModels:0,newWebsites:0,newLive:0});
await put(`${dir}/finished.json`,{at:new Date().toISOString(),status:'COMPLETED',newEvaluations:3,newLive:0,newModels:0,newWebsites:0,networkAttempts:0,frozenFilesVerified:Object.keys(freeze.files).length,freezeSha256:sha(freezeBytes)});
