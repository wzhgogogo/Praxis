import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {checkResumeIdentity,saveHoldoutCheckpoint,type HoldoutCheckpoint} from './holdout-checkpoint.js';

// LOCAL_CONSTRUCTION, real Git repositories: no private or network inputs.
for(const change of ['health','checkpoint','test','evaluator','runner','cli','artifact','product','other-doc','artifact-code'] as const){
 test(`resume source transition uses actual Git diff: ${change}`,async()=>{
  const root=await mkdtemp(join(tmpdir(),'health-sha-'));
  const git=(...args:string[])=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
  const put=async(path:string,text:string)=>{await mkdir(join(root,path,'..'),{recursive:true});await writeFile(join(root,path),text);};
  try{
   git('init');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');
   await put('baseline.txt','baseline');git('add','.');git('commit','-m','baseline');const old=git('rev-parse','HEAD');
   const target={health:'src/eval/restaurant/agent-loop/g6/holdout-health.ts',checkpoint:'src/eval/restaurant/agent-loop/g6/holdout-checkpoint.ts',test:'src/eval/restaurant/agent-loop/g6/holdout-health.test.ts',evaluator:'src/eval/restaurant/agent-loop/g6/evaluator.ts',runner:'src/eval/restaurant/agent-loop/g6/holdout-runner.ts',cli:'src/eval/restaurant/agent-loop/g6/run-holdout.ts',artifact:'.eval-artifacts/health/report.md',product:'src/product.ts','other-doc':'docs/STATUS.md','artifact-code':'.eval-artifacts/health/run.ts'}[change];
   await put(target,'change');git('add','.');git('commit','-m','change');const current=git('rev-parse','HEAD');
   const audit={originalSHA256:'original',manifestSHA256:'manifest',commitmentSHA256:'commitment',sourceSHA:old};
   const budget={path:join(root,'ledger.json'),ledgerId:'same-ledger'};await writeFile(budget.path,JSON.stringify({entries:[],cumulative:{}}));
   await writeFile(join(root,'input-hashes.json'),JSON.stringify({...audit,budget}));
   const state:HoldoutCheckpoint={schema:'phase3b-holdout-batch@2',serial:true,stopReason:'NETWORK_HEALTH_FAILED',healthyCases:[],receipts:[{id:'fiction',repetition:1,key:'fiction-r1',path:root,status:'CANCELLED_BEFORE_LIVE',environmentReplacement:false}]};
   await writeFile(join(root,'batch.json'),JSON.stringify(state));
   const before=await readFile(join(root,'input-hashes.json'),'utf8');
   if(['product','other-doc','artifact-code'].includes(change)){
    await assert.rejects(checkResumeIdentity(root,{...audit,sourceSHA:current},budget),/HOLDOUT_RESUME_INPUT_MISMATCH/);return;
   }
   const resumed=await checkResumeIdentity(root,{...audit,sourceSHA:current},budget);
   resumed.receipts.push({id:'fiction',repetition:1,key:'fiction-r1-retry1',path:root,status:'STARTED',environmentReplacement:false});
   await saveHoldoutCheckpoint(root,resumed,budget.path,v=>v);
   const saved=JSON.parse(await readFile(join(root,'batch.json'),'utf8'));
   assert.deepEqual(saved.sourceSHAHistory,[{sourceSHA:old,attemptKeys:['fiction-r1']},{sourceSHA:current,attemptKeys:['fiction-r1-retry1']}]);
   assert.equal(await readFile(join(root,'input-hashes.json'),'utf8'),before);
   // Identity fields and a caller's invented source SHA cannot use the exception.
   await assert.rejects(checkResumeIdentity(root,{...audit,sourceSHA:current,manifestSHA256:'different'},budget),/HOLDOUT_RESUME_INPUT_MISMATCH/);
   await assert.rejects(checkResumeIdentity(root,{...audit,sourceSHA:'f'.repeat(40)},budget),/HOLDOUT_RESUME_INPUT_MISMATCH/);
   const again=await checkResumeIdentity(root,{...audit,sourceSHA:current},budget);await saveHoldoutCheckpoint(root,again,budget.path,v=>v);
   assert.deepEqual(again.sourceSHAHistory,saved.sourceSHAHistory);
  }finally{await rm(root,{recursive:true,force:true});}
 });
}
