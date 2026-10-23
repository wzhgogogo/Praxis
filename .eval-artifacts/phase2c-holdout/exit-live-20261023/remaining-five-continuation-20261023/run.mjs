import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolve} from 'node:path';
import {sequence} from '../h13-600s-runner-continuation-20261023/sequence.mjs';
import {runAttempt} from '../timeout-retry-continuation-20261023/attempt.mjs';
import {verify} from '../freeze.mjs';
import {sha} from '../../../phase2b-exit-pipeline-20261022/inputs.mjs';
import {extractWordings} from '../../../checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/extract-wordings.ts';
const old='.eval-artifacts/phase2c-holdout/exit-live-20261023',base=old+'/remaining-five-continuation-20261023',get=p=>JSON.parse(fs.readFileSync(p)),put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const f=verify(base+'/live-freeze.json'),plan=get(base+'/plan.json'),ledger=get(plan.ledgerPath),prior=get(plan.priorManifest),registry=get(plan.registryPath),approval=get(base+'/authorization.json');
assert.equal(approval.approvedBy,'USER');assert.equal(approval.freezeSha256,f.sha256);assert.equal(approval.planSha256,sha(fs.readFileSync(base+'/plan.json')));assert.equal(approval.registrySha256,sha(fs.readFileSync(plan.registryPath)));
assert.deepEqual(plan.runs.map(r=>r.runId),['h-14','h-15','h-16','h-17','h-18']);assert.equal(plan.sequentialOnly,true);assert.deepEqual(plan.onlyRetry,['ENV_FAILURE']);assert.equal(plan.cooldownMs,900000);
for(const s of ledger.sources)assert.equal(sha(fs.readFileSync(s.path)),s.sha256,'LEDGER_SOURCE_CHANGED');
assert.ok(ledger.totalModelCalls+(plan.runs.length+plan.maxNewReruns)*50<=5000);assert.ok(ledger.totalFullLiveRuns+plan.runs.length+plan.maxNewReruns<=100);assert.ok(ledger.environmentReruns+plan.maxNewReruns<=10);
const out=base+'/execution';fs.mkdirSync(out);for(const q of ['A','B'])fs.mkdirSync(out+'/'+q);
put(out+'/started.json',{at:new Date().toISOString(),freezeSha256:f.sha256,previousFreezeSha256:sha(fs.readFileSync(old+'/live-freeze.json')),evaluation:'DEFERRED',planned:plan.runs.length});
const manifest=await sequence({plan,verify:()=>{verify(base+'/live-freeze.json');assert.ok(Date.now()+500000<Date.parse(plan.hardDeadline));},event:e=>{fs.appendFileSync(out+'/scheduler-events.jsonl',JSON.stringify(e)+'\n');console.log(JSON.stringify(e));},receipt:(q,r)=>fs.appendFileSync(out+'/'+q+'/ledger.jsonl',JSON.stringify(r)+'\n'),attempt:async(run,number,queue,c)=>{
 try{return await runAttempt({run,number,queue,directory:out,runnerInput:plan.runnerInput,registry,freezeSha:f.sha256,...c});}
 catch(error){const dir=resolve(out,queue,`${run.runId}-attempt-${number}`),p=dir+'/provider-calls.jsonl',models=fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).length:0;put(dir+'/outer-error.json',{reason:error.message,classification:'ORCHESTRATION_INTERRUPTED'});const runner=dir+'/runner',paths=fs.existsSync(runner)?fs.readdirSync(runner).filter(p=>p.endsWith('.result.json')):[],artifactPath=paths.length===1?runner+'/'+paths[0]:null;return {artifactPath,artifactSha256:artifactPath?sha(fs.readFileSync(artifactPath)):null,formalRunStarted:fs.existsSync(runner),modelCallsCharged:models,s0:false,classification:'ORCHESTRATION_INTERRUPTED',fatal:true,directory:dir,googleRequests:null};}
}});
put(out+'/execution-manifest.json',manifest);
const models=manifest.attempts.reduce((n,r)=>n+r.modelCallsCharged,0),live=manifest.attempts.filter(r=>r.formalRunStarted).length;ledger.phase2ModelCalls+=models;ledger.totalModelCalls+=models;ledger.totalFullLiveRuns+=live;ledger.environmentReruns+=manifest.totalReruns;ledger.sources.push({path:out+'/execution-manifest.json',sha256:sha(fs.readFileSync(out+'/execution-manifest.json')),scope:'PHASE2',models,fullLiveRuns:live,environmentReruns:manifest.totalReruns});ledger.remaining={modelCalls:5000-ledger.totalModelCalls,fullLiveRuns:100-ledger.totalFullLiveRuns,environmentReruns:10-ledger.environmentReruns};assert.ok(Object.values(ledger.remaining).every(v=>v>=0));put(out+'/ledger-after.json',ledger);
console.log(JSON.stringify({status:'EXECUTION_COMPLETE_EVALUATION_DEFERRED',attempts:manifest.attempts.length,stop:manifest.stop,models:ledger.totalModelCalls,fullLive:ledger.totalFullLiveRuns,environmentReruns:ledger.environmentReruns}));
