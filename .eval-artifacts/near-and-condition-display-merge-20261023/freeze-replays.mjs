import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createFreeze,git,sha} from '../checkpoint-c-live-20261020/freeze.mjs';
const d='.eval-artifacts/near-and-condition-display-merge-20261023';
assert.equal(git('status','--porcelain','--untracked-files=no'),'','COMMIT_BEFORE_FORMAL_REPLAY');
const priors=['.eval-artifacts/tablecheck-guard-merge-20261023/replay-freeze.json','.eval-artifacts/near-and-condition-display-20261023/replay-freeze.json'];
const extra=new Set(git('ls-files',d).split('\n').filter(Boolean)),priorBindings=[],differences=[];
for(const p of priors){const b=fs.readFileSync(p),m=JSON.parse(b);priorBindings.push({path:p,sha256:sha(b)});extra.add(p);
 for(const [path,before] of Object.entries(m.files)){extra.add(path);const after=sha(fs.readFileSync(path));if(before!==after){
  assert.ok(path.startsWith('src/')||path.startsWith('scripts/')||path.startsWith('docs/')||/\.(ts|mjs)$/.test(path),`IMMUTABLE_INPUT_CHANGED:${path}`);
  differences.push({prior:p,path,before,after});
 }}
}
const m=createFreeze(`${d}/replay-freeze.json`,[...extra]);
Object.assign(m,{schema:'reviewed-near-display-merge-regression-freeze@1',productionBase:git('rev-parse','HEAD'),purpose:'MERGED_OFFLINE_CACHED_69_5_AND_CALIBRATION_22;NO_NEW_MODELS_WEBSITES_LIVE',priorBindings,reviewedMerge:git('rev-parse','09b5d353'),differences,newModels:0,newWebsites:0,newLive:0});
fs.writeFileSync(`${d}/replay-freeze.json`,JSON.stringify(m,null,2)+'\n');
console.log(JSON.stringify({files:Object.keys(m.files).length,sha256:sha(fs.readFileSync(`${d}/replay-freeze.json`)),priorDifferences:differences.map(x=>x.path)}));
