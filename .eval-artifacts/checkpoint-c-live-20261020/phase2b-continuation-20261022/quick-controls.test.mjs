import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {executePlan,verifyPlan} from '../../phase2b-exit-pipeline-20261022/execution.mjs';
const plan={kind:'PHASE2B_LIVE_CHECK_3',deferEvaluation:true,mode:'OFFLINE_SAVED_REPLAY',ceilings:{decisionTimeoutMs:30000,timeoutMs:500000,maxModelCalls:50,maxGoogleRequests:40},minGapMs:300000,cooldownMs:900000,maxRerunsPerCase:1,maxTotalReruns:2,runs:[{runId:'q-01',caseId:'old-03',repeat:1},{runId:'q-02',caseId:'old-01',repeat:1},{runId:'q-03',caseId:'old-03',repeat:2}]};
const start=Date.parse('2026-10-22T10:00:00Z'),registry={validUntil:new Date(start+86400000).toISOString(),variants:['old-03','old-01'].map(variantId=>({variantId,classification:'KNOWN_FEASIBLE_SUPPORTED',certifiedAt:new Date(start-1000).toISOString(),validUntil:new Date(start+86400000).toISOString(),witnesses:[{}],certifiedWitnesses:[{}]}))};
async function run(attempt,reg=registry){const dir=mkdtempSync(join(tmpdir(),'phase2b-quick-'));let clock=start;const starts=[];try{return await executePlan({plan,registry:reg,directory:join(dir,'runs'),now:()=>clock,sleep:async ms=>{clock+=ms;},attempt:async(...args)=>{starts.push(clock);return attempt(...args);}}).then(manifest=>({manifest,starts}));}finally{rmSync(dir,{recursive:true});}}
test('approved quick plan runs exactly its three ordered slots and keeps five-minute gaps',async()=>{
 const ids=[],r=await run(async slot=>{ids.push(slot.runId);return{classification:'DEFERRED',s0:false,formalRunStarted:true};});
 assert.deepEqual(ids,['q-01','q-02','q-03']);assert.equal(r.manifest.planned,3);assert.equal(r.manifest.recordedSlots,3);assert.equal(r.manifest.newModelCalls,0);assert.equal(r.manifest.liveDenominator,0);
 assert.ok(r.starts.slice(1).every((at,i)=>at-r.starts[i]>=300000));
});
test('quick controls retain positive-S0 and witness-expiry stop, and only whitelist environment reruns',async()=>{
 const stopped=await run(async()=>({s0:true,classification:'DEFERRED'}));assert.equal(stopped.manifest.recordedSlots,1);assert.equal(stopped.manifest.stop.action,'STOP_BATCH');
 const expired=await run(async()=>{throw Error('MUST_NOT_RUN');},{...registry,validUntil:new Date(start).toISOString()});assert.equal(expired.manifest.recordedSlots,0);assert.equal(expired.manifest.stop.reason,'WITNESS_EXPIRED_OR_NOT_CERTIFIED');
 let n=0;const env=await run(async()=>({s0:false,classification:++n<=2?'ENV_FAILURE':'DEFERRED'}));assert.equal(env.manifest.totalReruns,1);assert.equal(env.manifest.stop.reason,'RETRY_EXHAUSTED');
 const miss=await run(async()=>({s0:false,classification:'CAPABILITY_MISS'}));assert.equal(miss.manifest.attempts.length,3);assert.equal(miss.manifest.totalReruns,0);
});
test('quick plan rejects duplicate IDs, wrong order/count and altered individual-run limits',()=>{
 for(const change of [p=>{p.runs[1].runId=p.runs[0].runId;},p=>p.runs.pop(),p=>{p.runs[1].caseId=p.runs[0].caseId;},p=>{p.ceilings.timeoutMs++;}]){const p=structuredClone(plan);change(p);assert.throws(()=>verifyPlan(p));}
});
