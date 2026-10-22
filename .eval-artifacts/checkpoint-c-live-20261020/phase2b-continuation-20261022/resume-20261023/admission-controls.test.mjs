import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {gateWitness} from '../../policy.mjs';
import {gatePhase2bWitness} from '../../../phase2b-exit-pipeline-20261022/witness-admission.mjs';
import {executePlan} from '../../../phase2b-exit-pipeline-20261022/execution.mjs';
import {sha} from '../../../phase2b-exit-pipeline-20261022/inputs.mjs';
const r='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023',get=p=>JSON.parse(fs.readFileSync(p));
const registry=get(`${r}/registry-final.json`),id=registry.variants.find(v=>v.noWitnessExclusion).variantId;
const start=Date.parse(registry.earliestWitnessObservedAt)+3600000;
globalThis.fetch=()=>{throw Error('OFFLINE_NETWORK_FORBIDDEN');};
test('red/green: legacy witness gate rejects business exclusion; exact approved source-bound admission accepts it',()=>{
 assert.throws(()=>gateWitness(registry,id,start,500000),/VALID_WITNESS_REQUIRED/);
 assert.equal(gatePhase2bWitness(registry,id,start,500000).capabilityDenominator,false);
 const ordinary=registry.variants.find(v=>v.witnesses.length);assert.deepEqual(gatePhase2bWitness(registry,ordinary.variantId,start,500000),gateWitness(registry,ordinary.variantId,start,500000));
});
test('missing/tampered exclusion, expiry and extended deadline remain red',()=>{
 for(const mutate of [v=>delete v.noWitnessExclusion,v=>v.noWitnessExclusion.sha256='0'.repeat(64),v=>v.capabilityDenominator=true]){
  const copy=structuredClone(registry);mutate(copy.variants.find(v=>v.variantId===id));assert.throws(()=>gatePhase2bWitness(copy,id,start,500000));
 }
 assert.throws(()=>gatePhase2bWitness(registry,id,Date.parse(registry.validUntil),500000));
 const extended=structuredClone(registry);extended.validUntil=new Date(Date.parse(registry.validUntil)+1).toISOString();assert.throws(()=>gatePhase2bWitness(extended,id,start,500000),/EXCLUSION_CANNOT_EXTEND/);
});
test('HTTP failure, response date mismatch and incorrect distance disposition cannot become business exclusions',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'phase2b-exclusion-red-'));
 const put=(name,v)=>{const p=path.join(tmp,name);fs.writeFileSync(p,JSON.stringify(v));return {path:p,sha256:sha(fs.readFileSync(p))};};
 try{
  for(const [label,alter,expected]of [
   ['http',p=>{const m=get(p.evidence[0].observationRefs[2].path);m.status=400;p.evidence[0].observationRefs[2]=put('bad-http.json',m);},/NETWORK_FAILURE_IS_NOT_BUSINESS_EXCLUSION/],
   ['date',p=>{const raw=get(p.evidence[0].observationRefs[1].path);raw.base_date.day++;const rr=put('bad-date.json',raw),m=get(p.evidence[0].observationRefs[2].path);m.sha256=rr.sha256;p.evidence[0].observationRefs[1]=rr;p.evidence[0].observationRefs[2]=put('bad-date-meta.json',m);},/EXCLUSION_RESPONSE_DATE_MUST_MATCH/]
  ]){
   const copy=structuredClone(registry),row=copy.variants.find(v=>v.variantId===id),e=get(row.noWitnessExclusion.path),p=get(e.primaryFailure.path);alter(p);e.primaryFailure=put(label+'-primary.json',p);row.noWitnessExclusion=put(label+'-exclusion.json',e);assert.throws(()=>gatePhase2bWitness(copy,id,start,500000),expected);
  }
  const copy=structuredClone(registry),row=copy.variants.find(v=>v.variantId===id),e=get(row.noWitnessExclusion.path);e.fallbackCandidates[0].reason='OUTSIDE_800M';row.noWitnessExclusion=put('distance-exclusion.json',e);assert.throws(()=>gatePhase2bWitness(copy,id,start,500000));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('offline outer reaches exactly 18 ordered slots including excluded case; five-minute gaps and immediate S0 stop preserved',async()=>{
 const plan=get(`${r}/holdout-inputs-fallback/plan.json`),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'phase2b-admission-rehearsal-'));let time=start;const called=[];
 try{
  const manifest=await executePlan({plan:{...plan,mode:'OFFLINE_SAVED_REPLAY'},registry,directory:path.join(tmp,'all'),now:()=>time,sleep:async ms=>{time+=ms;},attempt:async run=>{called.push(run.runId);time+=1;return {classification:'DEFERRED',formalRunStarted:false,modelCallsCharged:0};}});
  assert.deepEqual(called,plan.runs.map(r=>r.runId));assert.equal(manifest.recordedSlots,18);assert.equal(manifest.stop,null);assert.equal(manifest.newModelCalls,0);assert.equal(manifest.liveDenominator,0);assert.equal(manifest.attempts.filter(r=>r.run.caseId===id).length,3);
  for(let i=1;i<manifest.attempts.length;i++)assert.ok(Date.parse(manifest.attempts[i].startedAt)-Date.parse(manifest.attempts[i-1].finishedAt)>=300000);
  time=start;const stopped=await executePlan({plan:{...plan,mode:'OFFLINE_SAVED_REPLAY'},registry,directory:path.join(tmp,'s0'),now:()=>time,sleep:async ms=>{time+=ms;},attempt:async()=>({classification:'DEFERRED',s0:true,formalRunStarted:false,modelCallsCharged:0})});assert.equal(stopped.recordedSlots,1);assert.equal(stopped.stop.reason,'S0');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
