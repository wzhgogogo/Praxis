import fs from 'node:fs';import assert from 'node:assert/strict';
import {createFreeze,git,sha} from '../freeze.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022',state=JSON.parse(fs.readFileSync(`${dir}/step3-verification.json`));
assert.equal(state.status,'STOPPED_SOURCE_HTTP_FAILURE');assert.equal(state.phase2bExitLive.started,0);
const prior=JSON.parse(fs.readFileSync(`${dir}/certification-freezes/partial-registration.json`));
const extra=[...Object.keys(prior.files),...git('ls-files',dir).split('\n').filter(p=>p&&!p.endsWith('/source-clock.json')),
 'docs/STATUS.md','docs/history/DEVLOG.md','docs/history/TEST-LOG.md','docs/history/monthly/2026-10-index.md','docs/history/monthly/2026-10.md','docs/AGENT-WEB-OPERATION-PHASE-2-PLAYBOOK.md'];
const ledger=JSON.parse(fs.readFileSync(`${dir}/ledger-after-step3.json`));for(const r of ledger.sources){assert.equal(sha(fs.readFileSync(r.path)),r.sha256);extra.push(r.path);}
const output=`${dir}/stopped-audit-freeze.json`,m=createFreeze(output,extra);m.purpose='STOPPED_AT_STEP3_SOURCE_HTTP400; AUDIT_SNAPSHOT_ONLY_NOT_LIVE_AUTHORIZATION';m.productionBase=git('rev-parse','HEAD');m.liveAuthorization='NONE';m.phase2bExitLiveStarted=0;m.failedStep=3;m.modelCallLimit=5000;m.modelCallsCharged=ledger.totalModelCalls;m.partialRegistrationFreezeSha256=state.freezeSha256;
fs.writeFileSync(output,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({commit:m.commit,files:Object.keys(m.files).length,sha256:sha(fs.readFileSync(output)),liveAuthorization:m.liveAuthorization}));
