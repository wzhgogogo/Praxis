import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createFreeze,git,sha} from '../checkpoint-c-live-20261020/freeze.mjs';
const d='.eval-artifacts/near-and-condition-display-20261023',extra=git('ls-files',d,'.eval-artifacts/phase2c-merge-20261023').split('\n').filter(p=>p&&!p.startsWith(`${d}/gates/`)&&!p.startsWith(`${d}/red/`)&&!p.startsWith(`${d}/green/`));
assert.equal(git('status','--porcelain','--untracked-files=no'),'','COMMIT_BEFORE_FORMAL_REPLAY');
const prior=JSON.parse(fs.readFileSync('.eval-artifacts/phase2c-merge-20261023/replay-freeze.json'));
const m=createFreeze(`${d}/replay-freeze.json`,[...extra,...Object.keys(prior.files)]);Object.assign(m,{productionBase:git('rev-parse','HEAD'),purpose:'OFFLINE_11_SAVED_EVENT_REPLAYS_AND_69_5_CACHED_RESPONSE_REGRESSION; NO_NEW_MODELS_WEBSITES_LIVE',sourceHoldoutCommit:'1a2e7c12e15e8f8475e8bff00faffcbe926906fa',newModels:0,newWebsites:0,newLive:0});fs.writeFileSync(`${d}/replay-freeze.json`,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({commit:m.commit,files:Object.keys(m.files).length,sha256:sha(fs.readFileSync(`${d}/replay-freeze.json`))}));
