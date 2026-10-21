import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {loadResume} from './resume.mjs';
import {base,sha} from './freeze.mjs';
import {nextAction} from './policy.mjs';
import {executionRuns} from './run-selection.mjs';
const plan=JSON.parse(readFileSync(base+'/plan.json','utf8'));
const configPath=base+'/checkpoint-c-continuation-20261021/resume.json';
function fixture(change:(c:any,dir:string)=>void=()=>{}){
 const dir=mkdtempSync(base+'/resume-control-');
 const config=JSON.parse(readFileSync(configPath,'utf8'));
 const old=config.priorDirectory;config.priorDirectory=dir+'/prior';mkdirSync(config.priorDirectory);
 const names:string[]=[];
 const copy=(source:string,target:string)=>{mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,readFileSync(source));names.push(target);};
 for(const suffix of ['/started.json','/finish.json','/c-09-attempt-1/finish.json'])copy(old+suffix,config.priorDirectory+suffix);
 config.priorReports=config.priorReports.map((p:string)=>{
  const target=config.priorDirectory+p.slice(old.length),row=JSON.parse(readFileSync(p,'utf8'));
  const evaluation=target.replace('/run-report.json','/independent.evaluation.json');copy(row.evaluationPath,evaluation);row.evaluationPath=evaluation;
  mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});writeFileSync(target,JSON.stringify(row));names.push(target);return target;
 });
 change(config,dir);
 config.priorManifestPath=dir+'/manifest.json';writeFileSync(config.priorManifestPath,JSON.stringify({freezeSha256:config.priorFreezeSha256,files:Object.fromEntries(names.map(p=>[p,{sha256:sha(readFileSync(p))}]))}));
 names.push(config.priorManifestPath,config.registryPath,config.priorFreezePath);
 const files=Object.fromEntries(names.map(p=>[p,sha(readFileSync(p))]));
 const path=dir+'/resume.json';writeFileSync(path,JSON.stringify(config));files[path]=sha(readFileSync(path));
 return {dir,path,frozen:{files}};
}
test('current continuation carries all10 attempts and runs exactly c09-c18; original unselected18 is unchanged',()=>{
 const f=fixture();try{const r=loadResume(f.path,f.frozen,plan);assert.equal(r.rows.length,10);assert.deepEqual(executionRuns(plan,{resume:r}),plan.runs.slice(8));assert.deepEqual(executionRuns(plan,{}),plan.runs);assert.equal(r.runs.length,10);assert.equal(r.attemptCounts['c-09']+1,2);assert.equal(r.caseRetries.get('p2l-kagurazaka-kaiseki-20261105'),1);assert.equal(r.totalReruns,2);assert.equal(nextAction({classification:'ENV_FAILURE',caseReruns:r.caseRetries.get('p2l-kagurazaka-kaiseki-20261105'),totalReruns:r.totalReruns},plan).action,'STOP_BATCH');assert.equal(nextAction({classification:'ENV_FAILURE',caseReruns:0,totalReruns:r.totalReruns},plan).action,'RETRY');}finally{rmSync(f.dir,{recursive:true});}
});
test('prior summary or independent S0, witness deadline extension, and formal retry cannot be bypassed',()=>{
 for(const kind of ['S0','SIDECAR_S0','DEADLINE','FORMAL']){
  const f=fixture(c=>{
   if(kind==='DEADLINE'){c.hardDeadline='2026-10-23T12:23:38.769Z';return;}
   const path=kind==='S0'?c.priorReports[0]:kind==='SIDECAR_S0'?c.priorReports[0].replace('/run-report.json','/independent.evaluation.json'):c.priorDirectory+'/c-09-attempt-1/finish.json';
   const value=JSON.parse(readFileSync(path,'utf8'));
   if(kind==='S0')value.layers.severity.S0_DECLARATION.status='PRESENT';else if(kind==='SIDECAR_S0')value.severity.S0_BOUNDARY.status='PRESENT';else value.orchestration.finish.formalRunStarted=true;
   writeFileSync(path,JSON.stringify(value));
  });
  try{assert.throws(()=>loadResume(f.path,f.frozen,plan),kind.includes('S0')?/S0_CANNOT_RESUME/:kind==='DEADLINE'?/RESUME_CANNOT_EXTEND_DEADLINE/:/EXTRA_ATTEMPT_ONLY_FOR_PRE_RUN_ENV_FAILURE/);}finally{rmSync(f.dir,{recursive:true});}
 }
});
test('unfrozen prior evidence is rejected before any transport',()=>{const f=fixture();try{delete f.frozen.files[JSON.parse(readFileSync(f.path,'utf8')).priorReports[0]];assert.throws(()=>loadResume(f.path,f.frozen,plan),/RESUME_EVIDENCE_NOT_FROZEN/);}finally{rmSync(f.dir,{recursive:true});}});
test('missing or duplicate prior attempts and reset retry charge are rejected',()=>{
 for(const kind of ['MISSING','DUPLICATE','RESET']){const f=fixture(c=>{if(kind==='MISSING')c.priorReports.pop();else if(kind==='DUPLICATE')c.priorReports[1]=c.priorReports[0];else{const path=c.priorDirectory+'/finish.json',v=JSON.parse(readFileSync(path,'utf8'));v.totalReruns=0;writeFileSync(path,JSON.stringify(v));}});try{assert.throws(()=>loadResume(f.path,f.frozen,plan),kind==='RESET'?/RETRY_COUNT_MISMATCH/:/UNEXPECTED_PRIOR_ATTEMPTS/);}finally{rmSync(f.dir,{recursive:true});}}
});
test('even newly frozen prior data must match the original raw manifest',()=>{
 const f=fixture();try{const c=JSON.parse(readFileSync(f.path,'utf8')),p=c.priorReports[0],v=JSON.parse(readFileSync(p,'utf8'));v.layers.endToEnd.modelCalls=0;writeFileSync(p,JSON.stringify(v));f.frozen.files[p]=sha(readFileSync(p));assert.throws(()=>loadResume(f.path,f.frozen,plan),/PRIOR_RAW_EVIDENCE_CHANGED/);}finally{rmSync(f.dir,{recursive:true});}
});
