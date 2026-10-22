import fs from 'node:fs';
import {createFreeze,git,sha} from '../freeze.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022',input=process.argv[2],output=process.argv[3];
if(!input||!output)throw Error('INPUT_AND_OUTPUT_REQUIRED');
const passed=JSON.parse(fs.readFileSync(`${dir}/step2-verification.json`));if(passed.status!=='PASS')throw Error('STEP2_NOT_PASSED');
const extra=git('ls-files',dir,'.eval-artifacts/phase2b-holdout','.eval-artifacts/phase2b-exit-pipeline-20261022').split('\n').filter(p=>p&&!/\/(?:gates|calibration|replays|views|evaluations|live-checks|offline-rehearsal(?:-final)?)\//.test(p)&&!p.endsWith('/source-clock.json')&&!p.endsWith('/source-reads/observations.jsonl'));
extra.push(input,`${dir}/live-checks/ledger-after.json`);
const ledger=JSON.parse(fs.readFileSync(`${dir}/live-checks/ledger-after.json`));for(const row of ledger.sources){if(sha(fs.readFileSync(row.path))!==row.sha256)throw Error('LEDGER_SOURCE_DRIFT');extra.push(row.path);}
const m=createFreeze(output,extra);m.purpose='PHASE2B_USER_APPROVED_ZERO_MODEL_WITNESS_CERTIFICATION';m.productionBase=git('rev-parse','HEAD');m.inputPath=input;m.inputSha256=sha(fs.readFileSync(input));m.modelCalls=0;
fs.writeFileSync(output,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({commit:m.commit,files:Object.keys(m.files).length,sha256:sha(fs.readFileSync(output)),inputSha256:m.inputSha256}));
