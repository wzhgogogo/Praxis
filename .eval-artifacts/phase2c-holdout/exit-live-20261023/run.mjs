import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolve} from 'node:path';
import {schedule} from './scheduler.mjs';
import {runAttempt} from './attempt.mjs';
import {verify} from './freeze.mjs';
import {sha} from '../../phase2b-exit-pipeline-20261022/inputs.mjs';
import {checkStageBudget} from '../../checkpoint-c-live-20261020/policy.mjs';
import {extractWordings} from '../../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/extract-wordings.ts';
const base='.eval-artifacts/phase2c-holdout/exit-live-20261023',get=p=>JSON.parse(fs.readFileSync(p)),put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const frozen=verify(base+'/live-freeze.json'),plan=get(base+'/plan.json'),registry=get(plan.registryPath),ledger=get(plan.ledgerPath),approval=get(base+'/authorization.json');
assert.equal(approval.approvedBy,'USER');assert.equal(approval.action,'PHASE2C_EXIT_18_TWO_QUEUES');assert.equal(approval.freezeSha256,frozen.sha256);assert.equal(approval.planSha256,sha(fs.readFileSync(base+'/plan.json')));assert.equal(approval.registrySha256,sha(fs.readFileSync(plan.registryPath)));assert.equal(plan.hardDeadline,registry.validUntil);
for(const r of ledger.sources)assert.equal(sha(fs.readFileSync(r.path)),r.sha256,'LEDGER_SOURCE_CHANGED');
assert.deepEqual(plan.onlyRetry,['ENV_FAILURE']);assert.equal(plan.maxTotalReruns,6);const budget=checkStageBudget(ledger,plan);assert.equal(budget.reservedModelCalls,1200);
const out=base+'/execution';fs.mkdirSync(out);for(const q of ['A','B'])fs.mkdirSync(out+'/'+q);
put(out+'/started.json',{at:new Date().toISOString(),freezeSha256:frozen.sha256,budget,approvalSha256:sha(fs.readFileSync(base+'/authorization.json')),evaluation:'DEFERRED'});
const manifest=await schedule({plan,verify:()=>{verify(base+'/live-freeze.json');assert.ok(Date.now()+500000<Date.parse(plan.hardDeadline));},event:r=>{fs.appendFileSync(out+'/scheduler-events.jsonl',JSON.stringify(r)+'\n');console.log(JSON.stringify(r));},receipt:(q,r)=>fs.appendFileSync(out+'/'+q+'/ledger.jsonl',JSON.stringify(r)+'\n'),attempt:async(run,number,queue,c)=>{
 try{return await runAttempt({run,number,queue,directory:out,runnerInput:plan.runnerInput,registry,freezeSha:frozen.sha256,...c});}
 catch(error){const dir=resolve(out,queue,`${run.runId}-attempt-${number}`),p=dir+'/provider-calls.jsonl',models=fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).length:0;put(dir+'/outer-error.json',{reason:error.message,classification:'ORCHESTRATION_INTERRUPTED'});const runner=dir+'/runner',paths=fs.existsSync(runner)?fs.readdirSync(runner).filter(p=>p.endsWith('.result.json')):[],artifactPath=paths.length===1?runner+'/'+paths[0]:null;return {artifactPath,artifactSha256:artifactPath?sha(fs.readFileSync(artifactPath)):null,formalRunStarted:fs.existsSync(runner),modelCallsCharged:models,s0:false,classification:'ORCHESTRATION_INTERRUPTED',fatal:true,directory:dir,googleRequests:null};}
}});
put(out+'/execution-manifest.json',manifest);
const models=manifest.attempts.reduce((n,r)=>n+r.modelCallsCharged,0),live=manifest.attempts.filter(r=>r.formalRunStarted).length;
ledger.phase2ModelCalls+=models;ledger.totalModelCalls+=models;ledger.totalFullLiveRuns+=live;ledger.environmentReruns+=manifest.totalReruns;
ledger.sources.push({path:out+'/execution-manifest.json',sha256:sha(fs.readFileSync(out+'/execution-manifest.json')),scope:'PHASE2',models,fullLiveRuns:live,environmentReruns:manifest.totalReruns});ledger.remaining={modelCalls:5000-ledger.totalModelCalls,fullLiveRuns:100-ledger.totalFullLiveRuns,environmentReruns:10-ledger.environmentReruns};assert.ok(Object.values(ledger.remaining).every(v=>v>=0));put(out+'/ledger-after.json',ledger);
// First freeze every raw output; only then inspect criterion strings for the blind packet.
const files=[];function walk(path){for(const e of fs.readdirSync(path,{withFileTypes:true})){const p=path+'/'+e.name;if(e.isDirectory())walk(p);else files.push(p);}}walk(out);
put(base+'/raw-output-freeze.json',{schema:'phase2c-raw-outputs@1',createdAt:new Date().toISOString(),liveFreezeSha256:frozen.sha256,files:Object.fromEntries(files.sort().map(p=>[p,sha(fs.readFileSync(p))]))});
const entries=[];for(const row of manifest.attempts){if(!row.artifactPath)continue;const bytes=fs.readFileSync(row.artifactPath);assert.equal(sha(bytes),row.artifactSha256);const pending=extractWordings(JSON.parse(bytes),row.artifactPath,row.artifactSha256);if(pending)entries.push(pending);}
const wording={schema:'holdout-pending-criterion-wordings@1',status:'PENDING_INDEPENDENT_WORDING_REVIEW',rule:'Only unmatched criterion wording, exact artifact/text SHA and zero-based indices. Cartesian pairs imply no equivalence. No capability results, scores, observed prices or condition states.',entries};
put(base+'/pending-wordings.json',wording);
const timing=manifest.attempts.map(r=>({runId:r.run.runId,attempt:r.attempt,queue:r.queue,startedAt:r.startedAt,finishedAt:r.finishedAt,productStartedAt:r.productStartedAt,productFinishedAt:r.productFinishedAt,productElapsedMs:r.productElapsedMs,modelCalls:r.modelCallsCharged,googleRequests:r.googleRequests,overlaps:manifest.attempts.filter(s=>s!==r&&Date.parse(s.startedAt)<Date.parse(r.finishedAt)&&Date.parse(s.finishedAt)>Date.parse(r.startedAt)).map(s=>({runId:s.run.runId,attempt:s.attempt,queue:s.queue}))}));
put(base+'/timing-and-resources.json',{evaluation:'DEFERRED',attempts:timing,totals:{fullLiveRuns:ledger.totalFullLiveRuns,models:ledger.totalModelCalls,environmentReruns:ledger.environmentReruns,liveGoogle:timing.reduce((n,r)=>n+r.googleRequests,0),witnessGoogle:11}});
console.log(JSON.stringify({status:'AWAITING_WORDING_REVIEW',recordedSlots:manifest.plannedRuns.filter(r=>r.status==='RECORDED').length,attempts:manifest.attempts.length,stop:manifest.stop,totals:{models:ledger.totalModelCalls,fullLive:ledger.totalFullLiveRuns,environmentReruns:ledger.environmentReruns},wordingSha256:sha(fs.readFileSync(base+'/pending-wordings.json'))}));
