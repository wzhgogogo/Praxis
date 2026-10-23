import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {sequence} from './sequence.mjs';
import {stopChild} from './termination.mjs';
import {timeoutForRun} from './limits.mjs';
const base='.eval-artifacts/phase2c-holdout/exit-live-20261023/h13-600s-continuation-20261023',original=JSON.parse(fs.readFileSync(base+'/plan.json')),results=[];
assert.deepEqual(original.runs.map(timeoutForRun),[600000,500000,500000,500000,500000,500000]);
for(const mode of ['ALL_TIMEOUTS_CONTINUE','NORMAL','ENV_RETRY','PRIOR_ENV_EXHAUSTED','S0','SOURCE_COOLDOWN']){
 let t=Date.parse(original.priorFinishedAt),events=[];const plan=structuredClone(original);
 const m=await sequence({plan,now:()=>t,sleep:async ms=>{t+=ms;},draw:()=>180000,event:e=>events.push(e),attempt:async(run,n,q,c)=>{t+=10000;const isFirstRemaining=run.runId==='h-14'&&n===1;if(mode==='SOURCE_COOLDOWN'&&isFirstRemaining)c.fallback('SOURCE_BUSY',{});return {s0:mode==='S0',formalRunStarted:true,modelCallsCharged:1,cooldown:mode==='SOURCE_COOLDOWN'&&isFirstRemaining,classification:mode==='PRIOR_ENV_EXHAUSTED'||(['ENV_RETRY','SOURCE_COOLDOWN'].includes(mode)&&isFirstRemaining)?'ENV_FAILURE':mode==='ALL_TIMEOUTS_CONTINUE'?'ORCHESTRATION_INTERRUPTED':'DEFERRED'};}});
 if(['ALL_TIMEOUTS_CONTINUE','NORMAL'].includes(mode)){assert.deepEqual(m.attempts.map(r=>r.run.runId),['h-13','h-14','h-15','h-16','h-17','h-18']);assert.deepEqual(m.attempts.map(r=>r.attempt),[2,1,1,1,1,1]);assert.equal(m.totalReruns,0);assert.equal(m.attempts.filter(r=>r.authorization==='USER_EXPLICIT_TIMEOUT_RETRY').length,1);}
 if(mode==='ENV_RETRY')assert.equal(m.totalReruns,1);
 if(mode==='PRIOR_ENV_EXHAUSTED'){assert.equal(m.stop.reason,'ENVIRONMENT_RETRY_EXHAUSTED');assert.equal(m.attempts.length,1);}
 if(mode==='S0'){assert.equal(m.stop.reason,'S0_PRESENT');assert.equal(m.attempts.length,1);}
 if(mode==='SOURCE_COOLDOWN'){const pair=m.attempts.filter(r=>r.run.runId==='h-14');assert.ok(Date.parse(pair[1].startedAt)-Date.parse(pair[0].finishedAt)>=900000);}
 const starts=events.filter(e=>e.type==='START');assert.ok(starts.every((r,i)=>!i||Date.parse(r.at)>=Date.parse(m.attempts[i-1].finishedAt)+120000));results.push({mode,status:'PASS'});
}
// Actual local child ignoresSIGTERM: old behavior fails the bounded-exit oracle; new helper kills it.
const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('READY');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','pipe']});await once(child.stdout,'data');let exited=false;child.once('exit',()=>{exited=true;});child.kill('SIGTERM');await new Promise(r=>setTimeout(r,100));assert.equal(exited,false,'RED_CONTROL_DID_NOT_REPRODUCE');const began=Date.now(),exit=once(child,'exit');stopChild(child);const [code,signal]=await exit;assert.equal(signal,'SIGKILL');assert.ok(Date.now()-began<1000);results.push({mode:'REAL_CHILD_SIGTERM_RED_SIGKILL_GREEN',status:'PASS',hardExitMs:Date.now()-began});
fs.writeFileSync(base+'/offline-controls.json',JSON.stringify({status:'PASS',results,network:0,models:0,productLive:0},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',controls:results.length,network:0,models:0}));
