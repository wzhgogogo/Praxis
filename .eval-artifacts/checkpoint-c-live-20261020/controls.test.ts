import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nextAction,gateWitness} from './policy.mjs';
import {httpSignal,busyQuote,checkpointCaseCohort} from './transports.ts';
import {parseReviewedReads} from '../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
import {dryRunReviewedPostAudit} from '../../src/eval/restaurant/agent-loop/post-body-audit.mjs';
import {loadFrozenLiveCases} from '../../src/eval/restaurant/agent-loop/live-case-materializer.ts';
import {base,sha} from './freeze.mjs';
const plan=JSON.parse(readFileSync(base+'/plan.json','utf8'));
test('approved bytes, independent literal 18-run roster and spacing',async()=>{
 assert.equal(sha(readFileSync(plan.source)),'910ba0fdf755392ab1d2a1b0c2da5f9fa8d66a32217c109e8eb5f3b3ee24e8b6');
 const cases=await loadFrozenLiveCases(plan.runnerInput);assert.equal(cases.length,6);for(const c of cases)assert.ok(await checkpointCaseCohort(c));
 const {parseAllDocuments}=await import('yaml');const originals=parseAllDocuments(readFileSync(plan.source,'utf8')).map(d=>d.toJS());
 assert.deepEqual(cases,originals.map(({role,derived_from,...c})=>c));
 const expected=['p2l-kf-h001-20261103','p2l-kf-h002-20261107','p2l-kf-h005-20261105','p2l-kf-h003-20261106','p2l-kagurazaka-kaiseki-20261105','p2l-kichijoji-tempura-20261103'];
 assert.equal(plan.runs.length,18);for(const id of expected)assert.equal(plan.runs.filter((r:any)=>r.caseId===id).length,3);
 for(let i=1;i<18;i++)assert.notEqual(plan.runs[i].caseId,plan.runs[i-1].caseId);
 assert.deepEqual(plan.ceilings,{timeoutMs:500000,maxModelCalls:50,maxGoogleRequests:40});
});
test('S0 stops before any retry; ordinary product failures cannot retry; environment limits apply across repetitions',()=>{
 assert.equal(nextAction({s0:true,cooldown:true,classification:'ENV_FAILURE'},plan).action,'STOP_BATCH');
 for(const classification of ['QUALIFIED_DELIVERY','CAPABILITY_MISS','INTERNAL_FAILURE','HONEST_NO_RESULT'])assert.equal(nextAction({classification},plan).action,'CONTINUE');
 for(const classification of ['ENV_FAILURE','ORCHESTRATION_INTERRUPTED']){
  assert.equal(nextAction({classification},plan).action,'RETRY');assert.equal(nextAction({classification,caseReruns:1},plan).action,'STOP_BATCH');assert.equal(nextAction({classification,totalReruns:10},plan).action,'STOP_BATCH');
 }
 assert.deepEqual(nextAction({cooldown:true,classification:'ENV_FAILURE'},plan),{action:'RETRY',waitMs:900000});
 assert.equal(nextAction({classification:'QUALIFIED_DELIVERY'},plan).waitMs,300000);
 assert.equal(nextAction({unknownSafety:true},plan).action,'CONTINUE');
 assert.equal(nextAction({cooldown:true,classification:'HONEST_NO_RESULT'},plan).action,'STOP_BATCH');
});
test('403/503/429 and observed busy pages are bounded cooldown signals',()=>{
 for(const status of [403,503,429])assert.equal(httpSignal(status),true);assert.equal(httpSignal(200),false);
 assert.ok(busyQuote('Search is unavailable right now. Please try again.'));assert.equal(busyQuote('No seats available'),null);
});
test('witness future/expired/uncertified rejected, current accepted',()=>{
 const now=Date.now(),row={variantId:'case',witnesses:[{}],certifiedWitnesses:[{}],classification:'KNOWN_FEASIBLE_SUPPORTED',certifiedAt:new Date(now-1000).toISOString(),validUntil:new Date(now+3600000).toISOString()};
 const registry={variants:[row],validUntil:row.validUntil};
 assert.equal(gateWitness(registry,'case',now),row);
 for(const change of [{certifiedAt:new Date(now+1).toISOString()},{validUntil:new Date(now-1).toISOString()},{classification:'PENDING'},{witnesses:[]},{certifiedWitnesses:[]},{certifiedAt:'invalid'},{validUntil:'invalid'}])assert.throws(()=>gateWitness({...registry,variants:[{...row,...change}]},'case',now));
 assert.throws(()=>gateWitness({...registry,validUntil:new Date(now+499999).toISOString()},'case',now,500000),/VALID_WITNESS_REQUIRED/);
});
test('frozen independent reviewed body grammar detects mutation',()=>{
 const bytes=readFileSync(base+'/reviewed-reads.json');parseReviewedReads(bytes,base+'/reviewed-reads.json');assert.equal(dryRunReviewedPostAudit(bytes).status,'PASS');
});

test('frozen SHA oracle rejects a changed digest without editing any production input',async()=>{
 const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {join}=await import('node:path');const {verifyFreeze}=await import('./freeze.mjs');
 const d=mkdtempSync(base+'/freeze-control-');try{const path=join(d,'manifest.json');writeFileSync(path,JSON.stringify({files:{[base+'/plan.json']:'0'.repeat(64)}}));assert.throws(()=>verifyFreeze(path),/FROZEN_FILE_CHANGED/);}finally{rmSync(d,{recursive:true});}
});

test('an approval cannot launch a duplicate batch with a new output path',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {consumeAuthorization}=await import('./policy.mjs');const d=mkdtempSync(base+'/approval-control-');
 try{await consumeAuthorization(d,'a'.repeat(64),{directory:'first'});await assert.rejects(consumeAuthorization(d,'a'.repeat(64),{directory:'second'}),/EEXIST/);}finally{rmSync(d,{recursive:true});}
});

test('failed independent post-run read preserves evaluation and reports an evidence gap',async()=>{
 const {mkdtempSync,readFileSync,writeFileSync,rmSync,readdirSync}=await import('node:fs');const {resolve}=await import('node:path');
 const {postCheck}=await import('./post-check.mjs');const {evaluateAttempt}=await import('./evaluate-report.ts');
 const root=resolve(base,'rehearsal-3/c-01-attempt-1/runner');const resultPath=resolve(root,readdirSync(root).find(p=>p.endsWith('.result.json'))!);const artifact=JSON.parse(readFileSync(resultPath,'utf8'));
 const dir=mkdtempSync(base+'/post-read-control-');const registry={variants:[{variantId:artifact.materializedCase.id,date:'2026-11-03',partySize:2,earliest:'19:00',witnesses:[{outletName:'Scripted witness',sourceUrl:'https://tabelog.com/en/tokyo/A1303/A130301/13261619/',hardEvidence:[]}]}]};
 try{const registryPath=resolve(dir,'registry.json');writeFileSync(registryPath,JSON.stringify(registry));const post=resolve(dir,'post');await postCheck(artifact,registry,post,async()=>{throw Error('SCRIPTED_TRANSPORT_FAILURE');});
 const evaluated=evaluateAttempt({resultPath,directory:dir,run:plan.runs[0],mode:'LIVE_READ_ONLY',registryPath,postPath:resolve(post,'post-check.json'),freezeSha256:'0'.repeat(64)});
 assert.equal(evaluated.summary.independentPostDeliveryEvidenceComplete,false);assert.ok(evaluated.summary.postEvidenceGaps.length);assert.ok(evaluated.evaluation.evaluatorVersion.endsWith('@31'));
 }finally{rmSync(dir,{recursive:true});}
});
