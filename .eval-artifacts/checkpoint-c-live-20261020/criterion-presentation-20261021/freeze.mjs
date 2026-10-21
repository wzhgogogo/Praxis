import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex');
const files={};
const add=async p=>{files[p]=sha(await fs.readFile(p));};
const tracked=execFileSync('git',['ls-files','src','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],{encoding:'utf8'}).trim().split('\n');
for(const p of tracked)await add(p);
for(const p of execFileSync('git',['ls-files',dir],{encoding:'utf8'}).trim().split('\n'))if(p)await add(p);
for(const base of ['.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021/prepared','.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021/model-results','.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/model-results','.eval-artifacts/calibration-phase1-20261015/inputs','.eval-artifacts/e1-evaluator-20261016']){
 for(const p of execFileSync('git',['ls-files',base],{encoding:'utf8'}).trim().split('\n'))if(p)await add(p);
}
for(const p of execFileSync('git',['ls-files','.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021'],{encoding:'utf8'}).trim().split('\n'))if(p&&!p.includes('/recordings/'))await add(p);
await add('.eval-artifacts/checkpoint-c-live-20261020/reviewed-reads.json');
await add('.eval-artifacts/checkpoint-c-live-20261020/witness-completion-20261020/registry.certified.json');
const previous=JSON.parse(await fs.readFile('.eval-artifacts/checkpoint-c-live-20261020/continuous-retry-20261021/quick-live-freeze.json'));
const postRunDocuments=['docs/STATUS.md','docs/history/DEVLOG.md','docs/history/TEST-LOG.md','docs/history/monthly/2026-10-index.md','docs/history/monthly/2026-10.md'];
for(const p of Object.keys(previous.files)){if(postRunDocuments.includes(p))continue;try{await add(p);}catch(error){if(error.code!=='ENOENT')throw error;}}
const freeze={schema:'criterion-presentation-offline-freeze@1',createdAt:new Date().toISOString(),codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),review:'66269d74',postRunDocuments,mode:'SAVED_ARTIFACT_REEVALUATION_AND_EXACT_REQUEST_CACHED_MODEL_RESPONSE',evaluator:31,rubric:27,conditionsSchema:2,prompts:{browser:19,browserContext:2,restaurant:27,restaurantContext:15,changed:false},budgets:{modelCalls:0,websites:0,google:0,fullLive:0,environmentReruns:0},thresholds:{calendar:68,total:69,selection:5,calibration:22,fiveGates:'ALL_GREEN'},files};
await fs.writeFile(`${dir}/freeze.json`,JSON.stringify(freeze,null,2),{flag:'wx'});
console.log(JSON.stringify({files:Object.keys(files).length,sha256:sha(await fs.readFile(`${dir}/freeze.json`)),codeCommit:freeze.codeCommit}));
