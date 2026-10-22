// Existing freeze engine; include all old exposed input evidence and this batch's executable configuration.
import {createFreeze,git,base as checkpoint} from '../checkpoint-c-live-20261020/freeze.mjs';
import {base} from './execution.mjs';
const output=process.argv[2];if(!output)throw Error('OUTPUT_REQUIRED');
const extra=git('ls-files',base,'.eval-artifacts/phase2-holdout','.eval-artifacts/phase2b-holdout').split('\n').filter(p=>p&&!p.includes('/gates/')&&!p.endsWith('/red.txt'));
const old=git('ls-files',checkpoint+'/holdout-exit-20261022').split('\n').filter(Boolean);
const m=createFreeze(output,[...extra,...old]);console.log(JSON.stringify({commit:m.commit,files:Object.keys(m.files).length,models:0,websites:0}));
