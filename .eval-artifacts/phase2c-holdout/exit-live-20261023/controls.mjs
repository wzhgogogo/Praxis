import assert from 'node:assert/strict';
import fs from 'node:fs';
import {schedule} from './scheduler.mjs';
import {runAttempt} from './attempt.mjs';
const base='.eval-artifacts/phase2c-holdout/exit-live-20261023',get=p=>JSON.parse(fs.readFileSync(p));
const plan=get(base+'/plan.json');const results=[];
async function scenario(name,configure={}){
 let clock=Date.parse('2026-10-23T05:00:00Z'),events=[],receipts=[],pending=[],active=0,maxActive=0;
 const output=await schedule({plan:{...plan,...configure.plan},now:()=>clock,sleep:async ms=>{clock+=ms;await Promise.resolve();for(const t of pending.filter(t=>t.at<=clock)){pending=pending.filter(x=>x!==t);t.finish();}await Promise.resolve();},event:r=>events.push(r),receipt:(q,r)=>receipts.push([q,r]),verify:()=>{if(configure.reject)throw Error('FROZEN_FILE_CHANGED');},attempt:(run,n,q,c)=>new Promise(resolve=>{
  active++;maxActive=Math.max(active,maxActive);const finish=()=>{active--;resolve({s0:configure.s0&&run.runId==='h-01',classification:configure.env&&run.runId==='h-01'&&n===1?'ENV_FAILURE':configure.interrupted&&run.runId==='h-01'?'ORCHESTRATION_INTERRUPTED':'DEFERRED',modelCallsCharged:1,formalRunStarted:true});};
  if(configure.fallback&&run.runId==='h-01'&&n===1)c.fallback(configure.fallback,{});
  pending.push({at:clock+120000,finish});c.signal.addEventListener('abort',()=>{const t=pending.find(x=>x.finish===finish);if(t){pending=pending.filter(x=>x!==t);finish();}},{once:true});
 })});
 assert.ok(maxActive<=2);assert.ok(receipts.every(([q,r])=>Number(r.run.runId.slice(2))%2===(q==='A'?1:0)));
 if(!configure.s0&&!configure.reject&&configure.plan?.hardDeadline===undefined)assert.equal(new Set(output.attempts.map(r=>r.run.runId)).size,18);
 if(!configure.fallback&&!configure.s0&&!configure.reject&&!configure.plan){assert.equal(maxActive,2);const starts=events.filter(e=>e.type==='START');assert.equal(Date.parse(starts.find(e=>e.queue==='B').at)-Date.parse(starts[0].at),90000);}
 if(configure.fallback){assert.equal(output.sequentialFallback,true);const at=events.find(e=>e.type==='SEQUENTIAL_FALLBACK').at;for(const e of events.filter(e=>e.type==='START'&&e.at>at))assert.equal(e.mode,'SEQUENTIAL');}
 if(configure.env)assert.equal(output.totalReruns,1);if(configure.interrupted)assert.equal(output.totalReruns,0);if(configure.s0)assert.equal(output.stop.reason,'S0_PRESENT');if(configure.reject)assert.equal(output.attempts.length,0);
 results.push({name,status:'PASS',attempts:output.attempts.length,maxConcurrent:maxActive,totalReruns:output.totalReruns});
}
await scenario('two queues / stagger / odd-even / isolated receipts');
for(const reason of plan.parallelFallback)await scenario(reason,{fallback:reason,env:true});
await scenario('S0 stops remaining',{s0:true});await scenario('interrupted is not retryable',{interrupted:true});await scenario('frozen mismatch no launch',{reject:true});await scenario('expired witness no launch',{plan:{hardDeadline:'2026-10-23T04:00:00Z'}});
// Actual complete Runner composition with only its approved scripted transports; no external/model request.
const rehearsal=base+'/offline-rehearsal';fs.mkdirSync(rehearsal);fs.mkdirSync(rehearsal+'/A');fs.mkdirSync(rehearsal+'/B');
const registry=get(plan.registryPath),rows=await Promise.all(['A','B'].map((queue,i)=>runAttempt({run:{runId:'offline-'+queue,caseId:'p2l-kf-h001-20261103'},number:1,queue,directory:rehearsal,runnerInput:'.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml',registry,freezeSha:'OFFLINE_CONFIGURATION_ONLY',signal:new AbortController().signal,fallback:()=>{throw Error('UNEXPECTED_FALLBACK');},offline:true})));
for(const r of rows){assert.ok(r.artifactPath,'FULL_RUNNER_ARTIFACT_REQUIRED');assert.equal(r.modelCallsCharged,0);assert.equal(r.s0,false);assert.equal(fs.existsSync(r.directory+'/network-denied.jsonl'),false);const artifact=get(r.artifactPath);assert.ok(artifact.finalSnapshot,'REAL_COMPOSITION_REQUIRED');}
assert.notEqual(rows[0].artifactPath,rows[1].artifactPath);results.push({name:'two actual full Runner scripted compositions and safety-only output; separate paths',status:'PASS',network:0,models:0,artifacts:rows.map(r=>r.artifactPath)});
fs.writeFileSync(base+'/offline-controls.json',JSON.stringify({status:'PASS',results,network:0,models:0,productLive:0},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',controls:results.length,models:0,network:0}));
