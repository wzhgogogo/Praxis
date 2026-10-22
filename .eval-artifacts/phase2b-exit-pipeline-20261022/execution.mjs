import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,openSync,closeSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {gateWitness,nextAction,checkStageBudget,consumeAuthorization,PHASE2_MODEL_CALL_LIMIT} from '../checkpoint-c-live-20261020/policy.mjs';
import {verifyFreeze} from '../checkpoint-c-live-20261020/freeze.mjs';
import {evaluateSafetyOnly} from '../checkpoint-c-live-20261020/evaluate-report.ts';
import {postCheck} from '../checkpoint-c-live-20261020/post-check.mjs';
import {postReadTransport} from '../checkpoint-c-live-20261020/holdout-deferred.mjs';
import {extractWordings} from '../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/extract-wordings.ts';
import {sha} from './inputs.mjs';
export const base='.eval-artifacts/phase2b-exit-pipeline-20261022';
const checkpoint='.eval-artifacts/checkpoint-c-live-20261020';
export const readJson=p=>JSON.parse(readFileSync(p));
export const writeJson=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
export function verifyPlan(plan){
 const checks=plan.kind==='PHASE2B_LIVE_CHECK_3',count=checks?3:18;
 assert.deepEqual(plan.ceilings,{decisionTimeoutMs:30000,timeoutMs:500000,maxModelCalls:50,maxGoogleRequests:40});
 assert.equal(plan.deferEvaluation,true);assert.equal(plan.runs.length,count);assert.equal(plan.minGapMs,300000);assert.equal(plan.cooldownMs,900000);assert.equal(plan.maxRerunsPerCase,1);assert.equal(plan.maxTotalReruns,checks?2:4);
 assert.equal(new Set(plan.runs.map(r=>r.runId)).size,count);assert.equal(new Set(plan.runs.map(r=>r.caseId)).size,checks?2:6);
 if(checks){assert.equal(plan.runs[0].caseId,plan.runs[2].caseId);assert.deepEqual(plan.runs.map(r=>r.repeat),[1,1,2]);}
 else for(const id of new Set(plan.runs.map(r=>r.caseId)))assert.deepEqual(plan.runs.filter(r=>r.caseId===id).map(r=>r.repeat),[1,2,3]);
 for(let i=1;i<count;i++)assert.notEqual(plan.runs[i].caseId,plan.runs[i-1].caseId,'ADJACENT_SAME_CASE');
}
export async function executePlan({plan,registry,directory,attempt,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms)),verify=()=>{},retryAllowance=plan.maxTotalReruns}){
 verifyPlan(plan);mkdirSync(directory,{recursive:false});const rows=[],caseRetries=new Map();let retries=0,lastFinish=-Infinity,stop=null;
 for(const run of plan.runs){let number=0;
  while(true){
   while(now()<lastFinish+plan.minGapMs)await sleep(Math.min(30000,lastFinish+plan.minGapMs-now()));
   try{verify();}catch(e){stop={action:'STOP_BATCH',reason:'FROZEN_CONFIGURATION_OR_AUTHORIZATION_CHANGED',detail:e.message};break;}
   try{gateWitness(registry,run.caseId,now(),500000);}catch(e){stop={action:'STOP_BATCH',reason:'WITNESS_EXPIRED_OR_NOT_CERTIFIED',detail:e.message};break;}
   const startedAt=new Date(now()).toISOString();number++;const row=await attempt(run,number,directory);
   lastFinish=now();rows.push({run,attempt:number,startedAt,finishedAt:new Date(lastFinish).toISOString(),...row});
   const action=nextAction({s0:row.s0===true,cooldown:row.cooldown===true,classification:row.classification??'DEFERRED',caseReruns:caseRetries.get(run.caseId)??0,totalReruns:retries},{...plan,maxTotalReruns:Math.min(plan.maxTotalReruns,retryAllowance)});
   writeJson(resolve(directory,`${run.runId}-attempt-${number}.receipt.json`),rows.at(-1));
   if(action.action==='STOP_BATCH'){stop=action;break;}
   if(action.action==='RETRY'){caseRetries.set(run.caseId,(caseRetries.get(run.caseId)??0)+1);retries++;while(now()<lastFinish+action.waitMs)await sleep(Math.min(30000,lastFinish+action.waitMs-now()));continue;}
   break;
  }
  if(stop)break;
 }
 const manifest={schema:'phase2b-execution-deferred@1',status:'AWAITING_INDEPENDENT_WORDING_REVIEW',mode:plan.mode,planned:plan.runs.length,recordedSlots:new Set(rows.map(r=>r.run.runId)).size,attempts:rows,totalReruns:retries,stop,evaluation:'DEFERRED',newModelCalls:plan.mode==='OFFLINE_SAVED_REPLAY'?0:rows.reduce((n,r)=>n+(r.modelCallsCharged??50),0),newWebsiteRequests:plan.mode==='OFFLINE_SAVED_REPLAY'?0:'RECORDED_PER_ATTEMPT',liveDenominator:plan.mode==='OFFLINE_SAVED_REPLAY'?0:rows.filter(r=>r.formalRunStarted).length};
 writeJson(resolve(directory,'execution-manifest.json'),manifest);return manifest;
}
export function extractPending(manifest,budgets=[]){
 const entries=[],structuredBindings=[];
 for(const row of manifest.attempts){
  if(!row.artifactPath)continue;const bytes=readFileSync(row.artifactPath);assert.equal(sha(bytes),row.artifactSha256,'ORIGINAL_ARTIFACT_CHANGED');const a=JSON.parse(bytes);
  const pending=extractWordings(a,row.artifactPath,row.artifactSha256);
  const gold=a.materializedCase?.semantic?.criteria??[],intent=a.finalSnapshot?.domainState?.intentDraft;
  const bound=[];
  for(const binding of budgets.filter(b=>b.caseId===a.materializedCase.id)){
   assert.equal(sha(readFileSync(binding.reviewPath)),binding.reviewSha256,'BUDGET_REVIEW_SHA');
   const g=gold[binding.goldIndex];assert.ok(g);assert.equal(g.strength,binding.strength);assert.equal(g.polarity,binding.polarity);
   assert.equal(sha(g.value),binding.goldTextSha256,'BUDGET_GOLD_BINDING');
   const actual=intent?.budgetPerPerson,matched=actual!==undefined&&JSON.stringify(Object.keys(actual).sort())===JSON.stringify(Object.keys(binding.expected).sort())&&Object.entries(binding.expected).every(([k,v])=>actual[k]===v);
   structuredBindings.push({artifactSha256:row.artifactSha256,goldIndex:binding.goldIndex,expected:binding.expected,actual:actual??null,status:matched?'STRUCTURED_FIELDS_MATCH':'STRUCTURED_FIELDS_MISSING_OR_DIFFERENT',reviewPath:binding.reviewPath,reviewSha256:binding.reviewSha256,rule:'Correspondence only: does not prove price evidence, request fidelity, disclosure or delivery.'});
   // Numeric fields are compared regardless of wording; an inequality is a field failure, never a synonym question.
   bound.push(binding.goldIndex);
  }
  if(pending){pending.unmatchedRequestCriteria=pending.unmatchedRequestCriteria.filter(g=>!bound.includes(g.index));pending.candidateWordingPairs=pending.candidateWordingPairs.filter(p=>!bound.includes(p.goldIndex));if(pending.unmatchedRequestCriteria.length||pending.unmatchedProductCriteria.length)entries.push(pending);}
 }
 return {pending:{schema:'holdout-pending-criterion-wordings@1',status:'PENDING_INDEPENDENT_WORDING_REVIEW',rule:'Only unmatched wording and exact original SHA/index pairs. No run results, grades, prices, condition states, witness classifications or delivery fields.',entries},structuredBindings};
}
export function requireWordingReview(pending,review){
 assert.equal(review.status,'APPROVED_BY_INDEPENDENT_REVIEWER','REVIEW_STATUS_REQUIRED');
 assert.equal(review.pendingSha256,sha(JSON.stringify(pending)),'REVIEW_PENDING_SHA');assert.equal(sha(readFileSync(review.reviewPath)),review.reviewSha256,'WORDING_REVIEW_SHA');
 const accepted=[];
 for(const e of pending.entries)for(const pair of e.candidateWordingPairs){
  const matches=review.decisions.filter(d=>d.artifactSha256===e.artifactSha256&&d.goldIndex===pair.goldIndex&&d.actualIndex===pair.actualIndex&&d.goldTextSha256===pair.goldTextSha256&&d.actualTextSha256===pair.actualTextSha256);
  assert.equal(matches.length,1,'AWAITING_INDEPENDENT_WORDING_REVIEW');const d=matches[0];assert.ok(['EQUIVALENT','NOT_EQUIVALENT','NOT_EQUIVALENT_SOFT_SEMANTIC_DEVIATION','INVALID_CROSS_PAIR'].includes(d.decision));
  if(d.decision==='EQUIVALENT')accepted.push({...d,refs:[`${review.reviewPath}#sha256=${review.reviewSha256}`]});
 }
 return accepted;
}
export async function evaluateReviewed({pending,review,manifest,evaluate,directory}){
 const correspondences=requireWordingReview(pending,review);mkdirSync(directory,{recursive:false});const rows=[];
 for(const r of manifest.attempts){const bytes=r.artifactPath?readFileSync(r.artifactPath):undefined;if(bytes)assert.equal(sha(bytes),r.artifactSha256);const result=await evaluate(r,correspondences.filter(p=>p.artifactSha256===r.artifactSha256));writeJson(resolve(directory,r.run.runId+`-attempt-${r.attempt}.evaluation.json`),result);rows.push({run:r.run,artifactSha256:r.artifactSha256});}
 return rows;
}
// Existing Runner/Guard/recording and independent safety/post-read path; no alternative product implementation.
export async function liveAttempt(run,number,directory,runnerInput,registry,freezeSha){
 const dir=resolve(directory,`${run.runId}-attempt-${number}`);mkdirSync(dir);const out=openSync(resolve(dir,'stdout.txt'),'wx'),err=openSync(resolve(dir,'stderr.txt'),'wx');
 const env={...process.env,CHECKPOINT_C_MODE:'LIVE_READ_ONLY',CHECKPOINT_C_ATTEMPT:dir,CHECKPOINT_C_REVIEWED_READS:resolve(checkpoint,'reviewed-reads.json'),CHECKPOINT_C_DEFER_EVALUATION:'1',PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_LIVE_MODEL_EVAL:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PRAXIS_GOOGLE_API_PROXY_SERVER:'',PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER:''};
 const child=spawn(process.execPath,['--import','tsx',resolve(checkpoint,'child-entry.ts'),'--case-source',runnerInput,'--case',run.caseId,'--timeout-ms','500000','--max-model-calls','50','--max-google-requests','38','--record-decisions','--record-browser'],{env,stdio:['ignore',out,err]});
 let killed;const terminate=reason=>{if(!killed){killed=reason;child.kill('SIGTERM');}};
 const timer=setTimeout(()=>terminate('OUTER_DEADLINE'),500000),hard=setTimeout(()=>child.kill('SIGKILL'),502000);
 const monitor=setInterval(()=>{const p=resolve(dir,'outer-observations.jsonl');if(!existsSync(p))return;const rows=readFileSync(p,'utf8').trim().split('\n').filter(Boolean).flatMap(line=>{try{return [JSON.parse(line)];}catch{return [];}});if(rows.some(r=>r.kind==='SAFETY_STOP'))terminate('SAFETY_STOP');else if(rows.some(r=>r.kind==='COOLDOWN_SIGNAL'))terminate('COOLDOWN_SIGNAL');},50);
 let exit;try{exit=await new Promise((res,rej)=>{child.on('error',rej);child.on('exit',(code,signal)=>res({code,signal}));});}finally{clearTimeout(timer);clearTimeout(hard);clearInterval(monitor);closeSync(out);closeSync(err);}
 const paths=existsSync(resolve(dir,'runner'))?readdirSync(resolve(dir,'runner')).filter(p=>p.endsWith('.result.json')):[];assert.ok(paths.length<=1);const artifactPath=paths.length?resolve(dir,'runner',paths[0]):undefined;
 const interruption={...(exit.signal?{interruption:{status:'INTERRUPTED_BY_OUTER',reason:killed}}:{}),finish:{exitCode:exit,formalRunStarted:!!artifactPath||existsSync(resolve(dir,'runner')),preflight:{status:existsSync(resolve(dir,'source-preflight/source-data-preflight.json'))&&readJson(resolve(dir,'source-preflight/source-data-preflight.json')).classification!=='ENV_FAILURE'?'PASSED':'FAILED'}},refs:[resolve(dir,'finish.json')]};writeJson(resolve(dir,'finish.json'),{exit,killed,orchestration:interruption});
 let safety=evaluateSafetyOnly({resultPath:artifactPath,directory:dir,run,mode:'LIVE_READ_ONLY',freezeSha256:freezeSha,interruption,outputStem:'safety'});
 let cooldown=killed==='COOLDOWN_SIGNAL';
 if(artifactPath&&safety.evaluation.severity.S0.status!=='PRESENT'){
  const post=postReadTransport(resolve(dir,'post-transport'));try{await postCheck(readJson(artifactPath),registry,resolve(dir,'post-run'),post.read);safety=evaluateSafetyOnly({resultPath:artifactPath,directory:dir,run,mode:'LIVE_READ_ONLY',registryPath:undefined,postPath:resolve(dir,'post-run/post-check.json'),freezeSha256:freezeSha,interruption,outputStem:'post-safety'});}catch(e){writeJson(resolve(dir,'post-error.json'),{reason:e.message});}cooldown ||= post.state.cooldownExhausted;
 }
 return {artifactPath:artifactPath??null,artifactSha256:artifactPath?sha(readFileSync(artifactPath)):null,formalRunStarted:interruption.finish.formalRunStarted,modelCallsCharged:artifactPath?readJson(artifactPath).resourceUsage?.modelCallsStarted??50:interruption.finish.formalRunStarted?50:0,s0:safety.evaluation.severity.S0.status==='PRESENT',cooldown,classification:safety.summary.retryClassification};
}
export async function authorizeLive({freezePath,approvalPath,planPath,ledgerPath,registryPath,runnerInput,directory}){
 const frozen=verifyFreeze(freezePath),approval=readJson(approvalPath),plan=readJson(planPath),registry=readJson(registryPath),ledger=readJson(ledgerPath);verifyPlan(plan);
 for(const p of [planPath,ledgerPath,registryPath,runnerInput,approvalPath])if(p!==approvalPath)assert.equal(frozen.files[relative(process.cwd(),resolve(p))],sha(readFileSync(p)),'LIVE_INPUT_NOT_FROZEN');
 assert.equal(approval.action,plan.kind==='PHASE2B_LIVE_CHECK_3'?'PHASE2B_LIVE_CHECK_3':'PHASE2B_EXIT_18');assert.equal(approval.approvedBy,'USER');assert.equal(approval.freezeSha256,frozen.manifestSha256);assert.equal(approval.planSha256,sha(readFileSync(planPath)));assert.equal(approval.registrySha256,sha(readFileSync(registryPath)));assert.ok(Date.parse(approval.validUntil)>Date.now());
 for(const source of ledger.sources)assert.equal(frozen.files[source.path],sha(readFileSync(source.path)),'LEDGER_SOURCE_NOT_FROZEN');const budget=checkStageBudget(ledger,plan);
 await consumeAuthorization(base,sha(readFileSync(approvalPath)),{action:approval.action,directory,freezeSha256:frozen.manifestSha256});
 const manifest=await executePlan({plan:{...plan,mode:'LIVE_READ_ONLY'},registry,directory,retryAllowance:budget.reservedRetries,verify:()=>{verifyFreeze(freezePath);assert.ok(Date.parse(approval.validUntil)>Date.now(),'LIVE_AUTHORIZATION_EXPIRED');},attempt:(run,n,dir)=>liveAttempt(run,n,dir,runnerInput,registry,frozen.manifestSha256)});
 const models=manifest.newModelCalls,full=manifest.attempts.filter(r=>r.formalRunStarted).length,resourcePath=relative(process.cwd(),resolve(directory,'execution-manifest.json'));
 ledger.phase2ModelCalls+=models;ledger.totalModelCalls+=models;ledger.totalFullLiveRuns+=full;ledger.environmentReruns+=manifest.totalReruns;ledger.sources.push({path:resourcePath,sha256:sha(readFileSync(resourcePath)),scope:'PHASE2',models,fullLiveRuns:full,environmentReruns:manifest.totalReruns});ledger.remaining={modelCalls:PHASE2_MODEL_CALL_LIMIT-ledger.totalModelCalls,fullLiveRuns:100-ledger.totalFullLiveRuns,environmentReruns:10-ledger.environmentReruns};assert.ok(Object.values(ledger.remaining).every(v=>v>=0),'GLOBAL_BUDGET_EXCEEDED');writeJson(resolve(directory,'ledger-after.json'),ledger);return manifest;
}
