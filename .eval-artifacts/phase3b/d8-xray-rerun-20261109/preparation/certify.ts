// Independent witness recertification only; no product Port/State override.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createWitnessReader} from '../../../../src/eval/restaurant/agent-loop/g6/witness.js';
import {publicGETError} from '../../../../src/eval/restaurant/agent-loop/g6/development-evidence.js';
const [argument,expectedSHA]=process.argv.slice(2),root=resolve(argument!);assert.ok(argument&&expectedSHA);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),expectedSHA);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
const hash=(value:Uint8Array)=>createHash('sha256').update(value).digest('hex');
const packRaw=await readFile(join(root,'D8-pack.json')),pack=JSON.parse(packRaw.toString());
assert.equal(pack.cases.length,1);const target=pack.cases[0].witness;
assert.equal(pack.cases[0].request,'Check whether Specializing in Nodoguro Ginza Nakamata has a table for two on November 11, 2026 at 8:30 PM.');
assert.equal(target.sourceEntityId,'13186922');assert.equal(target.date,'2026-11-11');assert.equal(target.time,'20:30');assert.equal(target.partySize,2);
const spec=JSON.parse(await readFile(join(root,'preparation/certification-spec.json'),'utf8'));
assert.equal(spec.packSHA256,hash(packRaw));
for(const [path,sha] of Object.entries(spec.historicalFiles))assert.equal(hash(await readFile(path)),sha);
const historicalDetail=await readFile(spec.detailRef);assert.equal(hash(historicalDetail),spec.detailSHA256);
assert.ok(target.identityText.every((text:string)=>historicalDetail.toString().includes(text)),'Accepted static identity bytes must retain their original strings');
const ledger=join(root,'budget-C-live.json'),before=JSON.parse(await readFile(ledger,'utf8'));
assert.equal(before.cumulative.evaluationPublicGET,372);assert.equal(before.sharedApprovedLimits.evaluationPublicGET,483);assert.equal(before.cumulative.fullLive,27);
if(process.argv.includes('--validate-only')){console.log(JSON.stringify({validated:true,network:0,models:0,Live:0,historicalIdentityRetainsOriginalDate:true}));process.exit(0);}
assert.equal(process.env.PRAXIS_RUN_C_D8_CERTIFY,'1');
const directory=join(root,'certification');await mkdir(directory,{recursive:false});let count=0;
const previous=before.entries.filter((entry:any)=>entry.evaluationPublicGET===1).at(-1)?.recordedAtUTC;
const reader=createWitnessReader({directory,budgetPath:ledger,runId:'C-D8-XRAY-RERUN-20261109-CERT',fetch,requestTiming:{last:previous?Date.parse(previous):-Infinity},beforeGET:()=>{assert.ok(count<1,'Only one certification GET authorized');count++;}});
await writeFile(join(directory,'started.json'),JSON.stringify({sourceSHA:expectedSHA,atUTC:new Date().toISOString(),plannedGET:1,models:0,Live:0,identityMaterial:spec.identityMaterial,originalRequestUnchanged:true},null,2)+'\n',{flag:'wx'});
try{
 const receipt=await reader.read(target,'BEFORE',false);receipt.detailRef=spec.detailRef;receipt.detailSHA256=spec.detailSHA256;
 const rawFiles={...spec.historicalFiles,[receipt.vacancy!.ref]:receipt.responseSHA256};
 const review={status:receipt.exists?'CURRENT_AVAILABILITY_RECERTIFIED_WITH_REVIEWED_STATIC_IDENTITY':'WITNESS_NO_LONGER_EXISTS_STOP',reviewed:receipt.exists===true,reviewer:'Codex independent public vacancy recheck; identity/qualification pairs were previously human reviewed, not claimed newly read',reviewedAtCET:new Date(Date.now()+3600000).toISOString().replace('Z','+01:00'),identityChecks:{name:true,address:true,phone:true},identityMaterial:spec.identityMaterial,publicGETAttempts:reader.count,packSHA256:{D8:hash(packRaw)},rawFiles,certificates:[receipt]};
 await writeFile(join(directory,'reviewed.json'),JSON.stringify(review,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({status:review.status,exists:receipt.exists,GET:reader.count,models:0,Live:0}));if(!receipt.exists)process.exitCode=2;
}catch(error){await writeFile(join(directory,'failure.json'),JSON.stringify({sourceSHA:expectedSHA,atUTC:new Date().toISOString(),GET:reader.count,error:publicGETError(error),noRetry:true,LiveStarted:false},null,2)+'\n',{flag:'wx'});throw error;}
