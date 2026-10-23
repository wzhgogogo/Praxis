import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sequence} from './sequence.mjs';
const results=[];
for(const mode of ['NORMAL','ENV_RETRY','PRIOR_CASE_RETRY_EXHAUSTED','S0','CAPABILITY_NO_RETRY','COOLDOWN']){
 let t=Date.parse('2026-10-23T06:00:00Z'),draws=0,events=[];
 const plan={priorFinishedAt:new Date(t).toISOString(),hardDeadline:'2026-10-24T04:15:40.465Z',priorCaseRetries:mode==='PRIOR_CASE_RETRY_EXHAUSTED'?{case1:1}:{},maxNewReruns:4,runs:[{runId:'h-11',caseId:'case1'},{runId:'h-12',caseId:'case2'}]};
 const m=await sequence({plan,now:()=>t,sleep:async ms=>{t+=ms;},draw:()=>[120000,240000,180000][draws++%3],event:e=>events.push(e),attempt:async(run,n,q,c)=>{t+=10000;if(mode==='COOLDOWN'&&n===1&&run.runId==='h-11')c.fallback('SOURCE_BUSY',{});return {s0:mode==='S0',classification:(mode==='ENV_RETRY'||mode==='COOLDOWN')&&run.runId==='h-11'&&n===1||mode==='PRIOR_CASE_RETRY_EXHAUSTED'?'ENV_FAILURE':mode==='CAPABILITY_NO_RETRY'?'DEFERRED':'DEFERRED',cooldown:mode==='COOLDOWN'};}});
 const starts=events.filter(e=>e.type==='START');assert.ok(starts.every((e,i)=>!i||Date.parse(e.at)>=Date.parse(m.attempts[i-1].finishedAt)+120000));
 if(mode==='NORMAL'){assert.deepEqual(m.attempts.map(r=>r.queue),['A','B']);assert.equal(m.attempts.length,2);assert.deepEqual(events.filter(e=>e.type==='GAP_DRAW').map(e=>e.gapMs),[120000,240000]);}
 if(mode==='ENV_RETRY')assert.equal(m.totalReruns,1);
 if(mode==='PRIOR_CASE_RETRY_EXHAUSTED')assert.equal(m.stop.reason,'ENVIRONMENT_RETRY_EXHAUSTED');
 if(mode==='S0'){assert.equal(m.stop.reason,'S0_PRESENT');assert.equal(m.attempts.length,1);}
 if(mode==='CAPABILITY_NO_RETRY')assert.equal(m.totalReruns,0);
 if(mode==='COOLDOWN')assert.ok(Date.parse(starts[1].at)-Date.parse(m.attempts[0].finishedAt)>=900000);
 results.push({mode,status:'PASS'});
}
const output=process.argv[2];assert.ok(output);fs.writeFileSync(output,JSON.stringify({status:'PASS',results,network:0,models:0,productLive:0},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',controls:results.length,network:0,models:0}));
