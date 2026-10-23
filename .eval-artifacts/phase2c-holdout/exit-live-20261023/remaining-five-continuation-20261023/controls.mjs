import assert from 'node:assert/strict';import fs from 'node:fs';
import {sequence} from '../h13-600s-runner-continuation-20261023/sequence.mjs';
const base='.eval-artifacts/phase2c-holdout/exit-live-20261023/remaining-five-continuation-20261023',original=JSON.parse(fs.readFileSync(base+'/plan.json')),results=[];
assert.deepEqual(original.runs.map(r=>r.runId),['h-14','h-15','h-16','h-17','h-18']);assert.ok(original.runs.every(r=>(r.timeoutMs??500000)===500000&&!r.explicitTimeoutRetry&&r.initialAttempt===1));
for(const mode of ['NORMAL','CAPABILITY_NO_RETRY','ENV_RETRY','PRIOR_ENV_EXHAUSTED','S0','SOURCE_COOLDOWN']){
 let t=Date.parse(original.priorFinishedAt),events=[],drawIndex=0;const plan=structuredClone(original);
 const m=await sequence({plan,now:()=>t,sleep:async ms=>{t+=ms;},draw:()=>[120000,240000,180000][drawIndex++%3],event:e=>events.push(e),attempt:async(run,n,q,c)=>{t+=10000;const first=run.runId==='h-14'&&n===1;if(mode==='SOURCE_COOLDOWN'&&first)c.fallback('SOURCE_BUSY',{});return {s0:mode==='S0',formalRunStarted:true,modelCallsCharged:1,cooldown:mode==='SOURCE_COOLDOWN'&&first,classification:(['ENV_RETRY','SOURCE_COOLDOWN'].includes(mode)&&first)||(mode==='PRIOR_ENV_EXHAUSTED'&&run.runId==='h-15')?'ENV_FAILURE':mode==='CAPABILITY_NO_RETRY'?'ORCHESTRATION_INTERRUPTED':'DEFERRED'};}});
 assert.ok(Date.parse(m.attempts[0].startedAt)>=Date.parse(plan.initialNotBefore));const starts=events.filter(e=>e.type==='START');assert.ok(starts.every((r,i)=>!i||Date.parse(r.at)>=Date.parse(m.attempts[i-1].finishedAt)+120000));
 if(['NORMAL','CAPABILITY_NO_RETRY'].includes(mode)){assert.deepEqual(m.attempts.map(r=>r.run.runId),['h-14','h-15','h-16','h-17','h-18']);assert.equal(m.totalReruns,0);assert.deepEqual(m.attempts.map(r=>r.gapMs),[120000,240000,180000,120000,240000]);}
 if(mode==='ENV_RETRY')assert.equal(m.totalReruns,1);
 if(mode==='PRIOR_ENV_EXHAUSTED'){assert.equal(m.stop.reason,'ENVIRONMENT_RETRY_EXHAUSTED');assert.equal(m.attempts.length,2);}
 if(mode==='S0'){assert.equal(m.stop.reason,'S0_PRESENT');assert.equal(m.attempts.length,1);}
 if(mode==='SOURCE_COOLDOWN'){assert.equal(m.totalReruns,1);assert.ok(Date.parse(m.attempts[1].startedAt)-Date.parse(m.attempts[0].finishedAt)>=900000);}
 results.push({mode,status:'PASS'});
}
const ledger=JSON.parse(fs.readFileSync(base+'/ledger-before.json'));assert.ok(ledger.totalModelCalls+9*50<=5000);assert.ok(ledger.totalFullLiveRuns+9<=100);assert.ok(ledger.environmentReruns+4<=10);
fs.writeFileSync(base+'/offline-controls.json',JSON.stringify({status:'PASS',results,reusedHardStopControl:'../timeout-retry-continuation-20261023/offline-controls.json',productChanges:0,network:0,models:0,productLive:0},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',controls:results.length,network:0,models:0,remainingModelCalls:5000-ledger.totalModelCalls}));
