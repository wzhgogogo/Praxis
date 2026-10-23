import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createFreeze,git,sha} from '../../../checkpoint-c-live-20261020/freeze.mjs';
const h='.eval-artifacts/phase2c-holdout',d=`${h}/exit-live-20261023/evaluation-20261023`;
assert.equal(git('status','--porcelain','--untracked-files=no'),'','COMMIT_BEFORE_FREEZE');assert.equal(git('diff','--name-only','8487a844','--','src','scripts','web-skills','package.json','package-lock.json'),'','PRODUCT_AND_EVALUATOR_UNCHANGED');
const extras=git('ls-files',h).split('\n').filter(Boolean),m=createFreeze(`${d}/evaluation-freeze.json`,extras);Object.assign(m,{purpose:'OFFLINE_SAVED_LIVE_EVALUATION_ONLY; NO_MODEL_WEBSITE_LIVE',productionBase:'8487a844',evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',reviewCommit:'8a39273e',registrationShas:JSON.parse(fs.readFileSync(`${d}/registration-shas.json`)).files,newModels:0,newNetwork:0,newLive:0});fs.writeFileSync(`${d}/evaluation-freeze.json`,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({commit:m.commit,files:Object.keys(m.files).length,sha256:sha(fs.readFileSync(`${d}/evaluation-freeze.json`))}));
