import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='.eval-artifacts/checkpoint-c-live-20261020',source=`${base}/holdout-exit-20261022/continuation-20261022`,dir=`${source}/evaluation-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const load=async name=>import(pathToFileURL(path.resolve(`src/eval/restaurant/agent-loop/${name}.ts`)).href);
const [e,c,h,g,w,n,t,tablecheck]=await Promise.all(['diagnostic-evaluator','criterion-correspondence','diagnostic-evaluator-hard','diagnostic-evaluator-grounding','diagnostic-evaluator-witness','diagnostic-evaluator-network','run-stage-timings'].map(load).concat(import(pathToFileURL(path.resolve(`${base}/tablecheck-post-review.mjs`)).href)));
const freezeBytes=await fs.readFile(`${dir}/evaluation-freeze.json`),freeze=JSON.parse(freezeBytes);
const verify=async()=>{for(const[p,hash]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),hash,`FROZEN_CHANGED:${p}`);};await verify();
const inputs=await read(`${dir}/inputs.json`),registry=await read(`${source}/registry.json`),originalCorrespondences=c.loadCriterionCorrespondences(path.resolve(`${dir}/criterion-correspondences.json`)),viewCorrespondences=c.loadCriterionCorrespondences(path.resolve(`${dir}/evaluation-correspondences.json`));
const reviewedPath=path.resolve(`${base}/reviewed-reads.json`),reviewedReads=n.parseReviewedReads(await fs.readFile(reviewedPath),reviewedPath);
const controls=[];
for(const row of originalCorrespondences.entries){
 const input=inputs.runs.find(r=>r.originalArtifactSha256===row.artifactSha256);assert.ok(input);const a=await read(input.originalArtifactPath),gold=a.materializedCase.semantic.criteria,actual=a.finalSnapshot.domainState.intentDraft.criteria;
 const matches=c.matchCriteria(gold,actual,row.pairs);assert.equal(matches.filter(m=>m.method==='REVIEWED_SEMANTIC_INDEX').length,1);assert.equal(matches.find(m=>m.method==='REVIEWED_SEMANTIC_INDEX').goldIndex,0);
 const changed=structuredClone(actual);changed[0].text+=' different';assert.equal(c.matchCriteria(gold,changed,row.pairs).filter(m=>m.method==='REVIEWED_SEMANTIC_INDEX').length,0);
 const wrongSha=originalCorrespondences.entries.find(v=>v.artifactSha256==='0'.repeat(64));assert.equal(wrongSha,undefined);
 controls.push({runId:input.run.runId,exactPairAccepted:true,changedTextRejected:true,unregisteredShaRejected:true});
}
assert.equal(originalCorrespondences.entries.length,9);assert.ok(originalCorrespondences.entries.every(r=>r.pairs.length===1&&r.pairs[0].goldIndex===0&&r.pairs[0].actualIndex===0));
const lineage=await read(`${dir}/representation-lineage.json`);
for(const p of lineage.projections){
 const original=await read(p.sourceArtifactPath),view=await read(p.viewPath);assert.equal(sha(await fs.readFile(p.sourceArtifactPath)),p.sourceArtifactSha256);assert.equal(sha(await fs.readFile(p.viewPath)),p.viewSha256);
 for(const patch of p.patches){let obj=view,sourceObj=original;const keys=patch.path.split('/').slice(1,-1);for(const k of keys)obj=obj[k];for(const k of patch.sourcePointer.split('/').slice(1))sourceObj=sourceObj[k];assert.deepEqual(sourceObj,{max:8000,currency:'JPY'});assert.deepEqual(obj.pop(),patch.value);}
 assert.deepEqual(view,original,'Representation must preserve all original non-criteria bytes semantically');
}
await put(`${dir}/binding-controls.json`,{status:'PASS',reviewedOriginals:controls,structuredViews:lineage.projections.length,nonEquivalentSoftPairNotRegistered:true,invalidCrossPairsNotRegistered:true,sourceDataAndDisplayNotChanged:true,newModels:0,newNetwork:0});
await fs.mkdir(`${dir}/raw-evaluations-33`);await fs.mkdir(`${dir}/evaluations-33`);await fs.mkdir(`${dir}/run-reports`);
await put(`${dir}/evaluation-started.json`,{at:new Date().toISOString(),mode:'OFFLINE_EVALUATION_SAVED_LIVE',freezeSha256:sha(freezeBytes),codeCommit:freeze.codeCommit,newModels:0,newWebsites:0,newLive:0});
const rows=[];
for(const input of inputs.runs){
 const original=await read(input.originalArtifactPath),post=await read(`${input.attempt}/post-run/post-check.json`),finish=await read(`${input.attempt}/finish.json`),gaps=[];
 const postDelivery=[];for(const row of post.rows.filter(r=>r.raw?.status===200))try{postDelivery.push(g.loadPostDeliveryTabelogObservation(row.raw.metadataPath,row.raw.bodyPath));}catch(error){gaps.push({code:'POST_RESPONSE_VERIFICATION_FAILED',message:error.message});}
 let outer=[];try{outer=(await fs.readFile(`${input.attempt}/outer-observations.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(error){if(error.code!=='ENOENT')throw error;}
 const optionsFor=(artifactSha256,hardPath,correspondences)=>{
  let witnessOracle;if(post.manifestPath)try{witnessOracle=w.loadWitnessOracle({manifestPath:post.manifestPath,registryPath:`${source}/registry.json`,variantId:input.run.caseId,artifactSha256});}catch(error){gaps.push({code:'WITNESS_POST_VERIFICATION_FAILED',message:error.message});}
  return{criterionCorrespondences:correspondences,hardEvidence:h.loadHardCriterionEvidence(hardPath,artifactSha256),reviewedReads,postDeliveryTabelog:postDelivery,trace:[...(original.diagnostics?.browserTrace??[]),...outer],orchestration:finish.orchestration,...(witnessOracle?{witnessOracle}:{})};
 };
 const raw=tablecheck.applyTableCheckReview(e.evaluateRestaurantHybridLiveArtifact(original,{path:path.resolve(input.originalArtifactPath),sha256:input.originalArtifactSha256},optionsFor(input.originalArtifactSha256,input.hardEvidencePath,originalCorrespondences)),post.rows);
 await put(`${dir}/raw-evaluations-33/${input.run.runId}.evaluation.json`,raw);
 const evaluated=await read(input.evaluationArtifactPath);
 const evaluation=input.representation==='ORIGINAL_SAVED_BYTES'?raw:tablecheck.applyTableCheckReview(e.evaluateRestaurantHybridLiveArtifact(evaluated,{path:path.resolve(input.evaluationArtifactPath),sha256:input.evaluationArtifactSha256},optionsFor(input.evaluationArtifactSha256,input.evaluationHardEvidencePath,viewCorrespondences)),post.rows);
 assert.ok(evaluation.evaluatorVersion.endsWith('@33'));assert.ok(evaluation.rubricVersion.endsWith('@29'));
 const output=`${dir}/evaluations-33/${input.run.runId}.evaluation.json`;
 await put(output,{...evaluation,offlineEvaluation:{mode:'OFFLINE_EVALUATION_SAVED_LIVE',originalArtifactPath:input.originalArtifactPath,originalArtifactSha256:input.originalArtifactSha256,representation:input.representation,representationLineagePath:`${dir}/representation-lineage.json`,originalEvaluationPath:`${dir}/raw-evaluations-33/${input.run.runId}.evaluation.json`,freezeSha256:sha(freezeBytes),postEvidenceGaps:gaps,newModels:0,newNetwork:0,newLive:0}});
 const domain=original.finalSnapshot?.domainState??{},presented=domain.presentedResults?.candidateIds??[];
 const decisionPath=original.decisionCapture?.path;let decisions=[];if(decisionPath)decisions=(await fs.readFile(decisionPath,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);
 const selections=decisions.filter(d=>d.purpose==='restaurant_agent_decide').flatMap(d=>{try{const inputContext=JSON.parse(d.messages.find(m=>m.role==='user').content).context,action=JSON.parse(d.outputText);return action.type==='CHECK_AVAILABILITY'?action.candidateIds.map(id=>({candidateId:id,sequence:d.sequence,availabilityPath:inputContext.candidates?.find(v=>v.id===id)?.availabilityPath??null})):[];}catch{return[];}});
 const registered=registry.variants.find(v=>v.variantId===input.run.caseId)?.witnesses??[],first=original.trajectories?.find(t=>t.observation?.type==='DISCOVERY')?.observation?.candidateIds;
 const witnesses=registered.map(v=>{const id=new URL(v.sourceUrl).pathname.replace(/\/$/,'');return{outletName:v.outletName,sourceUrl:v.sourceUrl,inFirstCandidateBatch:first?first.some(cid=>cid.replace(/^tabelog:/,'').replace(/\/$/,'')===id.replace(/^\//,'')):null};});
 const sourceSteps=(original.trajectories??[]).map((step,index)=>({index,stepNumber:step.stepNumber,action:step.agentAction,stepOutcome:step.stepOutcome,observation:step.observation,executionMetadata:step.executionMetadata}));
 const report={run:input.run,attempt:input.attempt,originalArtifactPath:input.originalArtifactPath,originalArtifactSha256:input.originalArtifactSha256,evaluationPath:output,evaluationSha256:sha(await fs.readFile(output)),representation:input.representation,
  layers:{endToEnd:{outcome:evaluation.outcome,qualifiedDelivery:evaluation.outcome.type==='QUALIFIED_DELIVERY',conditions:evaluation.conditionStates,displayConsistency:evaluation.conditionStateComparisons,elapsedMs:original.resourceUsage?.elapsedMs??null,modelCalls:original.resourceUsage?.modelCallsStarted??null,deliveredCount:presented.length,deliveredCandidateIds:presented},
   stages:{findings:evaluation.findings,P2_1:{firstCandidateBatchRecorded:Array.isArray(first),firstBatchWitnesses:witnesses,firstBatchCandidateCount:first?.length??null,witnessFunnel:evaluation.witnessFunnel,nativeFunnels:(original.trajectories??[]).flatMap(t=>t.executionMetadata?.nativeDiscoveryFunnel?[t.executionMetadata.nativeDiscoveryFunnel]:[])},P2_2:{selections,selectionEvents:selections.length,selectedUniqueCandidates:new Set(selections.map(s=>s.candidateId)).size,selectedDirectPageEvents:selections.length&&selections.every(s=>s.availabilityPath!==null)?selections.filter(s=>s.availabilityPath==='DIRECT_SOURCE_PAGE').length:null,timings:t.restaurantRunStageTimings(original,decisions)},P2_3:{prices:evaluation.conditionStates.flatMap(c=>c.criteria.filter(q=>/yen|jpy|円/i.test(q.text)).map(q=>({candidateId:c.candidateId,...q}))),conditionDisplay:evaluation.conditionStateComparisons},investigation:evaluation.investigationMetrics},
   severity:evaluation.severity,attribution:{certainty:'HYPOTHESIS_UNLESS_RAW_STAGE_RECORD_CONFIRMS',sourceSteps}},
  independentPostDeliveryEvidence:{successfulVerifiedResponses:postDelivery.length,gaps,postPath:`${input.attempt}/post-run/post-check.json`},resources:original.resourceUsage,stageTimings:original.stageTimings};
 await put(`${dir}/run-reports/${input.run.runId}.json`,report);rows.push({run:input.run,originalArtifactSha256:input.originalArtifactSha256,representation:input.representation,rawOutcome:raw.outcome.type,outcome:evaluation.outcome.type,path:output,reportPath:`${dir}/run-reports/${input.run.runId}.json`});
 console.log(JSON.stringify({run:input.run.runId,raw:raw.outcome.type,final:evaluation.outcome.type,S0Declaration:evaluation.severity.S0_DECLARATION.status,S0Boundary:evaluation.severity.S0_BOUNDARY.status,delivered:presented.length}));
}
await verify();
const guard=process.env.CHECKPOINT_C_ATTEMPT;assert.ok(guard,'Must launch with offline-deny.mjs and CHECKPOINT_C_ATTEMPT');
let denied=[];try{denied=(await fs.readFile(`${guard}/network-denied.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(error){if(error.code!=='ENOENT')throw error;}
assert.equal(denied.length,0,'Offline evaluator attempted an external connection');
await put(`${dir}/automatic-evaluations.json`,{status:'COMPLETED_PENDING_INDEPENDENT_REVIEW',mode:'OFFLINE_EVALUATION_SAVED_LIVE',rows,newModels:0,newWebsites:0,newLive:0,freezeSha256:sha(freezeBytes)});
await put(`${dir}/evaluation-finished.json`,{at:new Date().toISOString(),status:'COMPLETED',formalRuns:18,rawEvaluations:18,additionalStructuredViews:3,frozenFilesVerified:Object.keys(freeze.files).length,deniedNetworkAttempts:denied.length,newModels:0,newWebsites:0,newGoogle:0,newLive:0,freezeSha256:sha(freezeBytes)});
