// Offline evidence seal for a stopped batch. This never authorizes Live.
import fs from 'node:fs';
import {createFreeze,git,sha} from '../freeze.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022';
const prior='.eval-artifacts/checkpoint-c-live-20261020/c17-timeout-retry-20261022';
const ledger=JSON.parse(fs.readFileSync(dir+'/ledger-after.json'));
const extra=[
 ...git('ls-files',dir,'.eval-artifacts/phase2-holdout').split('\n').filter(Boolean),
 ...ledger.sources.map(s=>s.path),
 ...['live-freeze.json','delivery-freeze.json','gates.json','result.json','checkpoint-c-gate.json','four-layer-report.md','ledger-after.json','timeout-comparison.json'].map(f=>prior+'/'+f),
 'docs/STATUS.md','docs/history/DEVLOG.md','docs/history/TEST-LOG.md','docs/history/monthly/2026-10-index.md','docs/history/monthly/2026-10.md'
];
const output=dir+'/delivery-freeze.json',manifest=createFreeze(output,extra);
manifest.purpose='STOPPED_EXIT_WITNESS_EVIDENCE_REVIEW_ONLY; NOT A LIVE START AUTHORIZATION';
manifest.status='STOPPED_WITNESS_GATE_FAILED_NOT_LIVE_READY';
manifest.holdoutLiveRunsStarted=0;manifest.failedCase='p2-holdout-05';
fs.writeFileSync(output,JSON.stringify(manifest,null,2)+'\n');
const hash=sha(fs.readFileSync(output));
fs.writeFileSync(dir+'/delivery-freeze.sha256',hash+'  delivery-freeze.json\n',{flag:'wx'});
console.log(JSON.stringify({files:Object.keys(manifest.files).length,sha256:hash,status:manifest.status,network:0,models:0}));
