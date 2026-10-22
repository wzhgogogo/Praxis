import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {loadResume} from './resume.mjs';
import {base,sha} from './freeze.mjs';
import {nextAction,checkStageBudget} from './policy.mjs';
import {executionRuns} from './run-selection.mjs';
const dir=base+'/c17-timeout-retry-20261022',read=(p:string)=>JSON.parse(readFileSync(p,'utf8')),plan=read(base+'/plan.json');
function fixture(change:(c:any)=>void=()=>{}){
 const folder=mkdtempSync(base+'/resume-control-'),config=read(dir+'/resume.json');change(config);
 const path=folder+'/resume.json';writeFileSync(path,JSON.stringify(config));
 const refs=[path,config.lastManifestPath,config.lastReportPath,config.lastFinishPath,config.registryPath,config.priorManifestPath,config.priorInputsPath,config.acceptanceGatesPath,config.acceptanceDisplayGatePath,config.reviewPath,config.originalPostCheckPath,config.originalFailureMetadataPath,config.priorFinishPath,...config.priorReports];
 for(const p of [...config.priorReports,config.lastReportPath]){const r=read(p);refs.push(r.artifact,r.evaluationPath);}
 const frozen={files:Object.fromEntries(refs.map(p=>[relative(process.cwd(),resolve(p)),sha(readFileSync(p))]))};return{folder,path,frozen};
}
test('user-granted timeout retry selects c17 attempt3 once, preserves 19 prior records and charges',()=>{
 const f=fixture();try{const r=loadResume(f.path,f.frozen,plan);assert.equal(r.rows.length,19);assert.deepEqual(executionRuns(plan,{resume:r}),[plan.runs[16]]);assert.deepEqual(executionRuns(plan,{}),plan.runs);assert.equal(r.attemptCounts['c-17']+1,3);assert.equal(r.caseRetries.get(plan.runs[16].caseId),2);assert.equal(r.totalReruns,4);assert.equal(nextAction({classification:'ENV_FAILURE',caseReruns:1,totalReruns:r.totalReruns},plan).action,'STOP_BATCH');const b=checkStageBudget(read(dir+'/ledger-before.json'),{...plan,runs:r.runs,maxTotalReruns:0});assert.equal(b.reservedRuns,1);assert.equal(b.reservedModelCalls,50);assert.equal(b.reservedRetries,0);}finally{rmSync(f.folder,{recursive:true});}
});
test('unapproved slot, deadline extension, missing/duplicate originals and review changes are rejected',()=>{
 for(const kind of ['SLOT','DEADLINE','MISSING','DUPLICATE','REVIEW']){const f=fixture(c=>{if(kind==='SLOT')c.resumeFromRunId='c-03';if(kind==='DEADLINE')c.hardDeadline='2026-10-23T12:23:00.000Z';if(kind==='MISSING')c.priorReports.pop();if(kind==='DUPLICATE')c.priorReports[0]=c.priorReports[1];if(kind==='REVIEW')c.reviewSha256='0'.repeat(64);});try{assert.throws(()=>loadResume(f.path,f.frozen,plan),kind==='SLOT'?/INVALID_RESUME/:kind==='DEADLINE'?/CANNOT_EXTEND/:kind==='REVIEW'?/REVIEW_MISMATCH/:/UNEXPECTED_PRIOR/);}finally{rmSync(f.folder,{recursive:true});}}
});
test('unfrozen original error evidence cannot authorize retry',()=>{const f=fixture();try{const c=read(f.path);delete f.frozen.files[c.originalFailureMetadataPath];assert.throws(()=>loadResume(f.path,f.frozen,plan),/RESUME_EVIDENCE_NOT_FROZEN/);}finally{rmSync(f.folder,{recursive:true});}});
