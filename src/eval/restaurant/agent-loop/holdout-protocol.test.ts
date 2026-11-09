import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import type {RestaurantCaseView} from '../../../application/agent-workspace.js';
import {validatePrivateManifest,holdoutHash,holdoutConditionMet,privateInputRedactor,type PrivateHoldoutManifest,type HoldoutCondition} from './holdout-protocol.js';
import {runPrivateHoldout} from './g6/holdout-runner.js';
import type {G6Case} from './g6/runner.js';
// LOCAL_CONSTRUCTION: unrelated to any private held-out case.
const original='# Fictional control only\n---\nrequest: Find Fiction Harbor on {DATE}.\nfollowup: Ask about the room.\n';
const commitment={fileSha256:holdoutHash(original),cases:[{id:'fiction-a',sha256:holdoutHash('request: Find Fiction Harbor on {DATE}.\nfollowup: Ask about the room.\n')}]};
const manifest:PrivateHoldoutManifest={schema:'phase3b-private-run-manifest@1',cases:[{id:'fiction-a',fillings:{'{DATE}':'2030-12-01'},request:'Find Fiction Harbor on 2030-12-01.',followups:[{id:'room',kind:'PAGE_QUESTION',text:'Ask about the room.',condition:{type:'PRESENTED_ANY'}}],oracle:{request:{dates:['2030-12-01']},pages:[]},witness:{provider:'TABELOG',candidateId:'fiction',name:'Fiction Harbor',sourceEntityId:'10000001',date:'2030-12-01',time:'19:00',partySize:2,detailUrl:'https://tabelog.com/en/tokyo/A0000/A000000/10000001/',identityText:['Fiction Harbor']}}]};
const bytes=(v:unknown)=>Buffer.from(JSON.stringify(v));
test('private manifest is verified against exact original, dates, turn substrings and ID order, with hash-only audit',()=>{
 const r=validatePrivateManifest(Buffer.from(original),commitment,bytes(manifest));assert.equal(r.manifest.cases[0]!.request,manifest.cases[0]!.request);
 const audit=JSON.stringify(r.audit);assert.ok(!audit.includes('Fiction Harbor'));assert.ok(audit.includes('2030-12-01'));assert.equal(r.audit.manifestSHA256,holdoutHash(bytes(manifest)));assert.equal(r.audit.cases[0]!.sha256,commitment.cases[0]!.sha256);assert.equal(r.audit.cases[0]!.runSHA256,holdoutHash(JSON.stringify(manifest.cases[0])));
 for(const change of ['ORIGINAL','ID','DATE','TURN','PLACEHOLDER']as const){const m=structuredClone(manifest),raw=change==='ORIGINAL'?original+'\n':original;
  if(change==='ID')m.cases[0]!.id='wrong';if(change==='DATE')m.cases[0]!.fillings['{DATE}']='2030-12-02';
  if(change==='TURN')m.cases[0]!.followups[0]!.text='Uncommitted new request';if(change==='PLACEHOLDER')m.cases[0]!.fillings={'{WRONG}':'2030-12-01'};
  assert.throws(()=>validatePrivateManifest(Buffer.from(raw),commitment,bytes(m)),/HOLDOUT_/);
 }
 const duplicateRules=structuredClone(manifest);Object.assign(duplicateRules.cases[0]!.oracle,{reviewedReadRules:[]});assert.throws(()=>validatePrivateManifest(Buffer.from(original),commitment,bytes(duplicateRules)),/HOLDOUT_MANIFEST_READ_RULES_FORBIDDEN/);
 const redact=privateInputRedactor([manifest.cases[0]!.request]);const output=JSON.stringify(redact({messages:[{role:'user',content:'private request'}],request:manifest.cases[0]!.request,wrapped:JSON.stringify({request:manifest.cases[0]!.request})}));
 assert.ok(!output.includes('Find Fiction Harbor'));assert.ok(!output.includes('private request'));assert.ok(output.includes('SHA256'));
 const conversation=redact({messages:[{role:'USER',content:manifest.cases[0]!.request},{role:'ASSISTANT',content:'Public source result shown.'}]})as {messages:Array<{role:string;content:string}>};assert.ok(Array.isArray(conversation.messages));assert.equal(conversation.messages[1]!.content,'Public source result shown.');assert.ok(!conversation.messages[0]!.content.includes('Find Fiction Harbor'));
});
test('all four follow-up conditions use structured results, with both satisfied and unsatisfied controls',()=>{
 const view={case:{phase:'PRESENT_RESULTS'},restaurant:{presentedCandidateIds:['a'],missingRequiredFields:[],candidates:[{restaurant:{id:'a',sourceIds:{tablecheck:'local-merchant'}}}],availabilityChecks:{a:{status:'AVAILABLE'}},availability:{a:[{source:'TABLECHECK',dateTime:'2030-12-01T19:00:00',partySize:2}]}}}as unknown as RestaurantCaseView;
 const conditions:HoldoutCondition[]=[{type:'PRESENTED_ANY'},{type:'PRESENTED_WITH_SLOT'},{type:'TARGET_PRESENTED_WITH_SLOT',target:{provider:'TABLECHECK',sourceEntityId:'local-merchant'},time:'19:00'}];
 for(const c of conditions){assert.equal(holdoutConditionMet(view,c),true);assert.equal(holdoutConditionMet({...view,restaurant:{...view.restaurant,presentedCandidateIds:[]}},c),false);}
 assert.equal(holdoutConditionMet(view,{type:'TARGET_PRESENTED_WITH_SLOT',target:{provider:'TABLECHECK',sourceEntityId:'other'}}),false);
 assert.equal(holdoutConditionMet(view,{type:'TARGET_PRESENTED_WITH_SLOT',target:{provider:'TABLECHECK',sourceEntityId:'local-merchant'},time:'20:00'}),false);
 assert.equal(holdoutConditionMet({...view,restaurant:{...view.restaurant,availabilityChecks:{}}},{type:'PRESENTED_WITH_SLOT'}),false);
 assert.equal(holdoutConditionMet({...view,restaurant:{...view.restaurant,availabilityChecks:{a:{status:'AVAILABLE',expiresAt:'2000-01-01',checkedAt:'1999-12-31',evidenceIds:[]}}}},{type:'PRESENTED_WITH_SLOT'}),false);
 const c:HoldoutCondition={type:'ASKED_FOR_DATE'};assert.equal(holdoutConditionMet(view,c),false);
 const asked={...view,case:{...view.case,phase:'NEEDS_INPUT' as const},restaurant:{...view.restaurant,missingRequiredFields:['date']}};assert.equal(holdoutConditionMet(asked,c),true);
 assert.equal(holdoutConditionMet({...asked,restaurant:{...asked.restaurant,missingRequiredFields:['partySize']}},c),false);
});
test('offline schedule cancels before Live on health failure, immediately stops S0, and schedules exactly three serial repetitions',async()=>{
 const base=resolve('.eval-artifacts');await mkdir(base,{recursive:true});
 for(const mode of ['HEALTH_FAIL','S0','PASS']as const){const dir=await mkdtemp(join(base,'fictional-holdout-')),budgetPath=join(dir,'budget.json');let active=0,started=0;
  await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:126,fullLive:22,realModelCalls:2500,environmentReruns:4},cumulative:{evaluationPublicGET:0,fullLive:0,realModelCalls:849,environmentReruns:0,restaurantWebsiteRequests:0}}));
  try{const result=await runPrivateHoldout(manifest,{manifestSHA256:holdoutHash(bytes(manifest)),originalSHA256:holdoutHash(original),sourceSHA:holdoutHash('fictional-source')},join(dir,'runs'),{g6:{budgetPath,witnessFetch:async()=>{throw Error('Not used');},transports:async()=>{throw Error('Not used');}},wait:async()=>{},health:async(_spec,beforeGET)=>{await beforeGET('tablecheck',1);return {passed:mode!=='HEALTH_FAIL',observations:[]};},execute:async(pack,_deps,out)=>{
   assert.equal(active,0);active++;started++;assert.equal(pack.recording.googleResponses,true);const path=join(out,pack.cases[0]!.id);await mkdir(path,{recursive:true});
   const evaluation={verdict:{s0:mode==='S0'?1:0,stopBatch:mode==='S0'}};await writeFile(join(path,'evaluation.json'),JSON.stringify(evaluation));active--;
   return {schemaVersion:'phase3b-g6-batch@1',serial:true,witnessGETs:1,stopReason:mode==='S0'?'S0_STOP':null,slots:[{id:pack.cases[0]!.id,status:'EVALUATED',path}]};
  }});
  assert.equal(started,mode==='HEALTH_FAIL'?0:mode==='S0'?1:3);assert.equal(result.stopReason,mode==='HEALTH_FAIL'?'NETWORK_HEALTH_FAILED':mode==='S0'?'S0_STOP':null);
  const audit=await readFile(join(dir,'runs/input-hashes.json'),'utf8');assert.ok(!audit.includes('Fiction Harbor'));
  const budget=JSON.parse(await readFile(budgetPath,'utf8'));assert.equal(budget.cumulative.fullLive,0,'The fake execution seam never spends Live');
  }finally{await rm(dir,{recursive:true,force:true});}
 }
});

test('fictional manifest explicitly admits known-unavailable witness only with true; detail-only remains forbidden',()=>{
 const m=structuredClone(manifest);m.cases[0]!.witness.allowKnownUnavailableCertificate=true;
 const checked=validatePrivateManifest(Buffer.from(original),commitment,bytes(m));assert.equal(checked.manifest.cases[0]!.witness.allowKnownUnavailableCertificate,true);
 assert.equal(validatePrivateManifest(Buffer.from(original),commitment,bytes(manifest)).manifest.cases[0]!.witness.allowKnownUnavailableCertificate,undefined);
 m.cases[0]!.witness.allowDetailOnlyCertificate=true;assert.throws(()=>validatePrivateManifest(Buffer.from(original),commitment,bytes(m)),/HOLDOUT_MANIFEST_INVALID/);
 delete m.cases[0]!.witness.allowDetailOnlyCertificate;Object.assign(m.cases[0]!.witness,{allowKnownUnavailableCertificate:false});assert.throws(()=>validatePrivateManifest(Buffer.from(original),commitment,bytes(m)),/HOLDOUT_MANIFEST_INVALID/);
});

test('fictional held-out batch separates allowed negative policy from actual negative/positive certification modes',async()=>{
 const base=resolve('.eval-artifacts');await mkdir(base,{recursive:true});const dir=await mkdtemp(join(base,'fictional-negative-policy-')),budgetPath=join(dir,'budget.json'),m=structuredClone(manifest);m.cases[0]!.witness.allowKnownUnavailableCertificate=true;let n=0;
 await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:126,fullLive:22,realModelCalls:2500,environmentReruns:4},cumulative:{evaluationPublicGET:0,fullLive:0,realModelCalls:849,environmentReruns:0,restaurantWebsiteRequests:0}}));
 try{const result=await runPrivateHoldout(m,{manifestSHA256:holdoutHash(bytes(m)),originalSHA256:holdoutHash(original),sourceSHA:holdoutHash('fictional')},join(dir,'runs'),{g6:{budgetPath,witnessFetch:async()=>{throw Error('No network');},transports:async()=>{throw Error('No clients');}},wait:async()=>{},health:async()=>({passed:true,observations:[]}),execute:async(pack,_deps,out)=>{
  n++;const id=pack.cases[0]!.id,path=join(out,id);await mkdir(path);
  await writeFile(join(path,'execution.result.json'),JSON.stringify({certificationMode:n===1?'NO_POSITIVE_WITNESS_DIAGNOSTIC':'STANDARD_G6',witnessExists:n!==1}));
  await writeFile(join(path,'evaluation.json'),JSON.stringify({verdict:{s0:0,stopBatch:false}}));return {schemaVersion:'phase3b-g6-batch@1',serial:true,witnessGETs:0,stopReason:null,slots:[{id,status:'EVALUATED',path}]};
 }});assert.deepEqual(result.witnessPolicies,[{id:m.cases[0]!.id,policy:'ALLOW_KNOWN_UNAVAILABLE'}]);assert.equal(result.receipts.length,3);assert.equal(result.receipts[0]!.certificationMode,'NO_POSITIVE_WITNESS_DIAGNOSTIC');assert.equal(result.receipts[0]!.witnessExists,false);assert.equal(result.receipts[1]!.certificationMode,'STANDARD_G6');assert.equal(result.receipts[1]!.witnessExists,true);
 }finally{await rm(dir,{recursive:true,force:true});}
});
