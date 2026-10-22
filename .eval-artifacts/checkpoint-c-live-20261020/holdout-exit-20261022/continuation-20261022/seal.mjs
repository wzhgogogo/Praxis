import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createFreeze,sha} from '../../freeze.mjs';
const d='.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022',out=d+'/continuation-20261022',output=process.argv[2];if(!output||!output.startsWith(out+'/'))throw Error('CONTINUATION_SEAL_OUTPUT_REQUIRED');
const ledger=JSON.parse(fs.readFileSync(out+'/ledger-before.json')),files=execFileSync('git',['ls-files',d,'.eval-artifacts/phase2-holdout'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
for(const r of [...ledger.sources,...(ledger.priorStageSafety?.refs??[])])files.push(r.path);
files.push('.eval-artifacts/checkpoint-c-live-20261020/c17-timeout-retry-20261022/gates.json');
const m=createFreeze(output,files);console.log(JSON.stringify({freezeSha256:sha(fs.readFileSync(output)),commit:m.commit,files:Object.keys(m.files).length,evaluator:'33',rubric:'29',network:0,models:0}));
