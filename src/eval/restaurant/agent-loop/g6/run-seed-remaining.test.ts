import {test} from 'node:test';import assert from 'node:assert/strict';
import {developmentReviewOnly,d02vSpec,seedInvocation} from './run-seed-remaining.js';
import type {G6Evaluation} from './evaluator.js';
test('development continuation preserves evaluation; only missing qualification/G1 may continue',()=>{
 const e={verdict:{s0:0},checks:[{rule:'COMPLETE_REQUEST_QUALIFICATION',status:'NOT_EVALUATED',reviewReason:'INDEPENDENT_QUALIFICATION_ANNOTATION_MISSING'},{rule:'G1_NOT_STATED',status:'NOT_EVALUATED'}]}as G6Evaluation;
 assert.equal(developmentReviewOnly(e),true);assert.equal(e.checks[1]!.status,'NOT_EVALUATED');
 assert.equal(developmentReviewOnly({...e,verdict:{...e.verdict,s0:1}}),false);
 assert.equal(developmentReviewOnly({...e,checks:[...e.checks,{rule:'REQUEST_BOUNDARY',status:'NOT_EVALUATED'}]}as G6Evaluation),false);
 assert.equal(developmentReviewOnly({...e,checks:[{rule:'G1_NOT_STATED',status:'FAIL'}]}as G6Evaluation),false);
});
test('public user D02-V definition remains exact',()=>{const s=d02vSpec('fixture');assert.equal(s.request,'Looking for a robatayaki place near Nakano for 8 people on Thursday, December 10 at 8:30 PM.');assert.deepEqual(s.oracle.request.dates,['2026-12-10']);assert.equal(s.oracle.request.partySize,8);assert.equal(s.oracle.request.time,'20:30');assert.equal(s.witness!.detailUrl,'https://tabelog.com/en/tokyo/A1319/A131902/13309182/');});

test('same D02V-r1 after failed witness/health keeps old ledger rows and charges unique invocation IDs',async()=>{
 const {mkdtemp,writeFile,readFile,rm}=await import('node:fs/promises');const {join}=await import('node:path');const {tmpdir}=await import('node:os');const {chargeG6}=await import('./budget.js');
 const directory=await mkdtemp(join(tmpdir(),'praxis-seed-attempt-')),path=join(directory,'ledger.json');
 const old=[{id:'seed:D02V-r1:HEALTH:tablecheck:1',evaluationPublicGET:1,recordedAtUTC:'2030-01-01T00:00:20Z'},{id:'seed:D02V-r1:1:GET:1',evaluationPublicGET:1,recordedAtUTC:'2030-01-01T00:00:10Z'}];
 try{
  await writeFile(path,JSON.stringify({entries:old,limits:{evaluationPublicGET:20},cumulative:{evaluationPublicGET:2}}));
  for(const at of [Date.parse('2030-01-01T00:03:00Z'),Date.parse('2030-01-01T00:06:00Z')]){
   const invocation=seedInvocation('D02V-r1',old,0,at);assert.equal(invocation.attemptId,'seed:D02V-r1:'+at);
   assert.equal(invocation.previousFinishedAtMs,Date.parse('2030-01-01T00:00:20Z'));
   await chargeG6(path,invocation.attemptId+':GET:1','evaluationPublicGET','fictional witness');
   await chargeG6(path,invocation.attemptId+':HEALTH:tablecheck:1','evaluationPublicGET','fictional health');
  }
  const result=JSON.parse(await readFile(path,'utf8'));assert.deepEqual(result.entries.slice(0,2),old);assert.equal(result.cumulative.evaluationPublicGET,6);assert.equal(new Set(result.entries.map((e:{id:string})=>e.id)).size,6);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('spacing includes latest ledger timestamp even without a development receipt',()=>{
 const latest=Date.parse('2030-01-01T00:05:00Z'),old=latest-300000;
 assert.equal(seedInvocation('D02V-r1',[{recordedAtUTC:'invalid'},{recordedAtUTC:new Date(latest).toISOString()}],old,latest+1).previousFinishedAtMs,latest);
 assert.equal(seedInvocation('D02V-r2',[{recordedAtUTC:new Date(old).toISOString()}],latest,latest+1).previousFinishedAtMs,latest);
});
