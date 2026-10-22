import fs from 'node:fs';
import {createFreeze,git,sha} from '../freeze.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022';
const prior=JSON.parse(fs.readFileSync(`${dir}/replay-freeze.json`));
const verified=JSON.parse(fs.readFileSync(`${dir}/step1-verification.json`));
if(verified.status!=='PASS')throw Error('STEP1_NOT_PASSED');
const output=`${dir}/quick-live-freeze.json`,m=createFreeze(output,[...Object.keys(prior.files),`${dir}/step1-verification.json`]);
m.purpose='PHASE2B_APPROVED_THREE_EXPOSED_LIVE_CHECKS; no exit-check denominator';m.productionBase=git('rev-parse','HEAD');m.hardDeadline='2026-10-23T06:41:36.126Z';m.modelCallCap=5000;m.step1FreezeSha256=sha(fs.readFileSync(`${dir}/replay-freeze.json`));
fs.writeFileSync(output,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({commit:m.commit,files:Object.keys(m.files).length,sha256:sha(fs.readFileSync(output)),hardDeadline:m.hardDeadline}));
