// Full 18-slot pipeline rehearsal, replaying saved exposed artifacts; never a new product run.
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {verifyFreeze} from '../checkpoint-c-live-20261020/freeze.mjs';
import {parseCriterionCorrespondences} from '../../src/eval/restaurant/agent-loop/criterion-correspondence.ts';
import {evaluateRestaurantHybridLiveArtifact} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator.ts';
import {loadHardCriterionEvidence} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-hard.ts';
import {parseReviewedReads} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
import {base,readJson,writeJson,executePlan,extractPending,evaluateReviewed} from './execution.mjs';
import {sha} from './inputs.mjs';
import {discoverWitnesses,captureWitnessJobs,sourceReader} from './witnesses.mjs';
const freezePath=process.argv[2];assert.ok(freezePath,'FROZEN_CONFIG_REQUIRED');const frozen=verifyFreeze(freezePath);
assert.equal(process.env.CHECKPOINT_C_ATTEMPT,resolve(base),'OFFLINE_DENY_LOG_MUST_BIND_OWN_DIRECTORY');assert.ok(!existsSync(base+'/network-denied.jsonl'));
const sources=readJson(base+'/rehearsal-sources.json'),plan=readJson(base+'/rehearsal-inputs/plan.json'),registry=readJson(base+'/rehearsal-registry.json');
let time=Date.parse('2026-10-22T08:25:00Z');const sleeps=[];const directory=resolve(base,'offline-rehearsal');
const manifest=await executePlan({plan:{...plan,mode:'OFFLINE_SAVED_REPLAY'},registry,directory,now:()=>time,sleep:async(ms)=>{sleeps.push(ms);time+=ms;},verify:()=>verifyFreeze(freezePath),attempt:async(run)=>{
 const r=sources.runs.find(r=>r.run.runId===run.runId);assert.equal(r.run.caseId,run.caseId);const bytes=readFileSync(r.artifactPath);assert.equal(sha(bytes),r.artifactSha256);const a=JSON.parse(bytes);time+=1;
 return {artifactPath:r.artifactPath,artifactSha256:r.artifactSha256,historicalElapsedMs:a.resourceUsage.elapsedMs,historicalModelCalls:a.resourceUsage.modelCallsStarted,classification:'DEFERRED',modelCallsCharged:0,formalRunStarted:false};
}});
assert.equal(manifest.recordedSlots,18);assert.equal(manifest.attempts.length,18);assert.equal(manifest.newModelCalls,0);assert.equal(manifest.liveDenominator,0);assert.equal(manifest.stop,null);
const pack=extractPending(manifest,readJson(sources.oldBudgetBindings));writeJson(resolve(directory,'pending-wordings.json'),pack.pending);writeJson(resolve(directory,'structured-budget-bindings.json'),pack.structuredBindings);
assert.ok(!JSON.stringify(pack.pending).match(/QUALIFIED_DELIVERY|CAPABILITY_MISS|presentedResults|conditionStates|finalSnapshot|matchingSlots/));
const oldReview=readJson(sources.oldWordings),review={status:'APPROVED_BY_INDEPENDENT_REVIEWER',pendingSha256:sha(JSON.stringify(pack.pending)),reviewPath:oldReview.reviewPath,reviewSha256:oldReview.reviewSha256,decisions:oldReview.decisions};
writeJson(resolve(directory,'old-review-projection.json'),review); // Previously approved decisions only; no synthetic new reviewer decisions.
let evaluations=0;await assert.rejects(()=>evaluateReviewed({pending:pack.pending,review:{...review,decisions:[]},manifest,directory:resolve(directory,'must-not-exist'),evaluate:()=>{evaluations++;}}),/AWAITING_INDEPENDENT_WORDING_REVIEW/);assert.equal(evaluations,0);assert.ok(!existsSync(resolve(directory,'must-not-exist')));
const historical=readJson('.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/inputs.json');
const recovery=readJson(sources.recoveryPath),reviewedPath='.eval-artifacts/checkpoint-c-live-20261020/reviewed-reads.json',reviewedReads=parseReviewedReads(readFileSync(reviewedPath),reviewedPath);
await evaluateReviewed({pending:pack.pending,review,manifest,directory:resolve(directory,'evaluations'),evaluate:async(r,pairs)=>{
 const input=historical.runs.find(i=>i.run.runId===r.run.runId);assert.ok(input);assert.equal(input.originalArtifactSha256,r.artifactSha256);
 const criterionCorrespondences=parseCriterionCorrespondences(JSON.stringify({schema:'artifact-criterion-correspondence@1',status:'old exposed independently reviewed',rule:'Original SHA and exact wording hashes',entries:[{runId:r.run.runId,artifactSha256:r.artifactSha256,pairs:pairs.map(p=>({goldIndex:p.goldIndex,actualIndex:p.actualIndex,semanticId:`reviewed:${p.goldIndex}`,goldTextSha256:p.goldTextSha256,actualTextSha256:p.actualTextSha256,refs:p.refs}))}]}),'old-approved-wording-review');
 const goldCorrection=recovery.rows.find(x=>x.originalArtifactSha256===r.artifactSha256)?.correction;
 evaluations++;return evaluateRestaurantHybridLiveArtifact(readJson(r.artifactPath),{path:r.artifactPath,sha256:r.artifactSha256},{criterionCorrespondences,reviewedReads,hardEvidence:loadHardCriterionEvidence(input.hardEvidencePath,r.artifactSha256),...(goldCorrection?{goldCorrection}:{})});
}});assert.equal(evaluations,18);
// Discovery/capture transport seam: real saved public Google/merchant/inventory bytes, not invented website HTML.
const centers='.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/centers',centerBytes=readFileSync(centers+'/p2-holdout-04.attempt-1.body.json');
let reads=0,clock=0;const fixtureRead=sourceReader({now:()=>clock,sleep:async(ms)=>{clock+=ms;},transport:async()=>{reads++;return new Response(centerBytes,{status:200});}});
const search=readJson(base+'/rehearsal-inputs/witness-search-plan.json');const discovered=await discoverWitnesses(search,fixtureRead,'OFFLINE_PLACEHOLDER');assert.equal(discovered.variants.length,6);assert.equal(reads,12);
// This exercises only the IO seam; repeated saved center response does not certify the other five locations.
const inv=readJson(sources.oldInventoryIndex).find(r=>r.caseId==='p2-holdout-04'),invBytes=readFileSync(inv.bodyPath);const capture=await captureWitnessJobs([{kind:'INVENTORY',caseId:inv.caseId,url:inv.url}],async()=>({item:{status:200,sha256:sha(invBytes)},body:invBytes.toString()}));assert.equal(capture.length,1);
const originalOverruns=manifest.attempts.filter(r=>r.historicalElapsedMs>500000).map(r=>({runId:r.run.runId,historicalElapsedMs:r.historicalElapsedMs}));
const summary={status:'PASS_PIPELINE_REHEARSAL_ONLY',mode:'OFFLINE_SAVED_REPLAY',freezeSha256:frozen.manifestSha256,frozenCommit:frozen.commit,originalRawCommitmentRejectedBeforeMaterialization:true,approvedExposedRecovery:true,datesAndRunnerCases:6,sixWitnessCases:registry.variants.map(v=>({caseId:v.caseId,count:v.witnesses.length})),plannedSlots:18,completedSlots:18,sameCaseAdjacent:false,virtualSourceWaitMs:sleeps.reduce((a,b)=>a+b,0),reviewEntries:pack.pending.entries.length,candidateWordingPairs:pack.pending.entries.reduce((n,e)=>n+e.candidateWordingPairs.length,0),budgetStructuredBindings:pack.structuredBindings.map(b=>({artifactSha256:b.artifactSha256,status:b.status})),evaluationBeforeReview:0,evaluationAfterOldIndependentReview:evaluations,originalOverrunsPreserved:originalOverruns,evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',capabilityAndExits:'NOT_ASSESSED_BY_THIS_REHEARSAL; original execution evidence and limitations preserved; no budget price/display upgrade',newHoldoutOpened:false,newModels:0,newWebsiteRequests:0,newLive:0,offlineDiscoveryTransportReads:reads,liveDenominator:0};
assert.ok(!existsSync(base+'/network-denied.jsonl'));verifyFreeze(freezePath);writeJson(resolve(directory,'verification.json'),summary);console.log(JSON.stringify(summary));
