import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {loadResume} from './resume.mjs';
import {base,sha} from './freeze.mjs';
import {nextAction} from './policy.mjs';
const plan=JSON.parse(readFileSync(base+'/plan.json','utf8'));
const configPath=base+'/resume-20261021/resume.json';
function fixture(change:(c:any,files:any,dir:string)=>void=()=>{}){
 const dir=mkdtempSync(base+'/resume-control-');
 const config=JSON.parse(readFileSync(configPath,'utf8'));
 const names=[...config.priorReports,config.priorDirectory+'/finish.json',...['1','2'].map(n=>config.priorDirectory+`/c-03-attempt-${n}/finish.json`)];
 const files=Object.fromEntries(names.map(p=>[p,sha(readFileSync(p))]));
 change(config,files,dir);const path=dir+'/resume.json';writeFileSync(path,JSON.stringify(config));files[path]=sha(readFileSync(path));
 return {dir,path,frozen:{files}};
}
test('resume preserves completed samples, starts only c-03, charges the explicit retry and keeps H005 exhausted',()=>{
 const f=fixture();try{const r=loadResume(f.path,f.frozen,plan);assert.equal(r.rows.length,4);assert.equal(r.runs.length,16);assert.deepEqual(r.runs,plan.runs.slice(2));assert.equal(r.attemptCounts['c-03']+1,3);assert.equal(r.caseRetries.get('p2l-kf-h005-20261105'),1);assert.equal(r.totalReruns,2);assert.equal(nextAction({classification:'ENV_FAILURE',caseReruns:r.caseRetries.get('p2l-kf-h005-20261105'),totalReruns:r.totalReruns},plan).action,'STOP_BATCH');assert.equal(nextAction({classification:'ENV_FAILURE',caseReruns:0,totalReruns:r.totalReruns},plan).action,'RETRY');}finally{rmSync(f.dir,{recursive:true});}
});
test('resume cannot bypass a prior S0, extend the deadline, or turn a started formal attempt into a preflight exception',()=>{
 for(const kind of ['S0','DEADLINE','FORMAL']){
  const f=fixture((c,files,dir)=>{
   if(kind==='DEADLINE'){c.hardDeadline='2026-10-22T12:26:00Z';return;}
   const old=kind==='S0'?c.priorReports[0]:c.priorDirectory+'/c-03-attempt-2/finish.json';
   const value=JSON.parse(readFileSync(old,'utf8'));
   if(kind==='S0')value.layers.severity.S0_DECLARATION.status='PRESENT';else value.orchestration.finish.formalRunStarted=true;
   if(kind==='S0'){const path=dir+'/prior.json';writeFileSync(path,JSON.stringify(value));files[path]=sha(readFileSync(path));c.priorReports[0]=path;}
   else{const previous=dir+'/prior';mkdirSync(previous+'/c-03-attempt-2',{recursive:true});mkdirSync(previous+'/c-03-attempt-1',{recursive:true});for(const suffix of ['/finish.json','/c-03-attempt-1/finish.json','/c-03-attempt-2/finish.json']){const p=previous+suffix;writeFileSync(p,suffix.includes('attempt-2')?JSON.stringify(value):readFileSync(c.priorDirectory+suffix));files[p]=sha(readFileSync(p));}c.priorDirectory=previous;}
  });
  try{assert.throws(()=>loadResume(f.path,f.frozen,plan),kind==='S0'?/S0_CANNOT_RESUME/:kind==='DEADLINE'?/RESUME_CANNOT_EXTEND_DEADLINE/:/EXTRA_ATTEMPT_ONLY_FOR_PRE_RUN_ENV_FAILURE/);}finally{rmSync(f.dir,{recursive:true});}
 }
});
test('unfrozen prior evidence is rejected before any transport',()=>{const f=fixture();try{delete f.frozen.files[JSON.parse(readFileSync(f.path,'utf8')).priorReports[0]];assert.throws(()=>loadResume(f.path,f.frozen,plan),/RESUME_EVIDENCE_NOT_FROZEN/);}finally{rmSync(f.dir,{recursive:true});}});
