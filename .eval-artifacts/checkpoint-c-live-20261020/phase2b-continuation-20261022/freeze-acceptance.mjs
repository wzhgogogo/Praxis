import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createFreeze,git,sha} from '../freeze.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022';
const priorManifests=[
 '.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022/evaluation-freeze.json',
 '.eval-artifacts/group-window-fix-20261022/delivery-freeze.json',
];
const approvedMutable=new Set(['.eval-artifacts/checkpoint-c-live-20261020/policy.mjs','.eval-artifacts/checkpoint-c-live-20261020/tablecheck-review.test.ts']);
const extra=new Set(),preserved=[];
for(const p of priorManifests){
 const bytes=fs.readFileSync(p),m=JSON.parse(bytes);let checked=0;
 for(const[name,hash]of Object.entries(m.files)){
  extra.add(name);
  if(name==='.eval-artifacts/group-window-fix-20261022/independent-review.md'){
   const approved=git('show',`98cc7994:${name}`)+'\n';
   assert.equal(fs.readFileSync(name,'utf8'),approved,'Approved review does not match98cc7994');
   continue;
  }
  if(/^(?:src|scripts|docs|web|web-skills)\//.test(name)||/^package(?:-lock)?\.json$|^tsconfig/.test(name)||approvedMutable.has(name))continue;
  assert.equal(sha(fs.readFileSync(name)),hash,`Historical input changed:${name}`);checked++;
 }
 preserved.push({path:p,sha256:sha(bytes),unchangedHistoricalFiles:checked});
}
for(const root of [dir,'.eval-artifacts/phase2b-exit-pipeline-20261022'])for(const p of git('ls-files',root).split('\n').filter(Boolean)){
 if(p.startsWith(dir+'/gates/'))continue;extra.add(p);
}
const ledger=JSON.parse(fs.readFileSync(`${dir}/ledger-before.json`));assert.equal(ledger.limits.modelCalls,5000);assert.equal(ledger.totalModelCalls,3280);
for(const source of ledger.sources){assert.equal(sha(fs.readFileSync(source.path)),source.sha256);extra.add(source.path);}
const output=`${dir}/replay-freeze.json`,m=createFreeze(output,[...extra]);m.codeCommit=m.commit;m.purpose='PHASE2B_MERGE_ACCEPTANCE_OFFLINE; cached identical real-model responses, no new models/websites/Live';m.preservedHistoricalInputs=preserved;m.approvedBudgetUpdate='06703ba1: fixed cumulative model cap5000; only current executable policy/tests changed, no historical ledger changed';
fs.writeFileSync(output,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({commit:m.commit,files:Object.keys(m.files).length,sha256:sha(fs.readFileSync(output)),preserved}));
