import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021';
const prior='.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex'),files={};
const add=async p=>{files[path.normalize(p)]=sha(await fs.readFile(p));};
const walk=async p=>{for(const e of await fs.readdir(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory())await walk(f);else await add(f);}};
execFileSync('git',['diff','--exit-code','HEAD','--','src',dir],{stdio:'pipe'});
for(const p of execFileSync('git',['ls-files','src','package.json','package-lock.json','tsconfig.json','tsconfig.build.json','scripts/arch-check.ts','docs/skills','web-skills'],{encoding:'utf8'}).trim().split('\n'))await add(p);
for(const p of ['inputs','prepared'])await walk(`${dir}/${p}`);
for(const name of await fs.readdir(dir))if(/\.(mjs|py)$/.test(name)||['plan.md','gates.json','independent-oracle.json','private-class-audit.json','before.json','before-browser.json','request-comparison.json'].includes(name))await add(`${dir}/${name}`);
const original=JSON.parse(await fs.readFile(`${prior}/freeze.json`));
for(const[p,h]of Object.entries(original.files))if(!p.startsWith('src/')&&!p.startsWith(`${prior}/inputs/ledger`)&&!p.startsWith(`${prior}/prepared/`)&&!p.startsWith(`${prior}/gates`)&&!/\.(mjs|py)$/.test(p)&&!p.startsWith('docs/')&&!p.startsWith('web-skills/')){
 const bytes=await fs.readFile(p);if(sha(bytes)!==h)throw Error(`ORIGINAL_INPUT_CHANGED:${p}`);await add(p);
}
await add(`${prior}/prepared/selection.json`);
const selection=JSON.parse(await fs.readFile(`${prior}/prepared/selection.json`));for(const s of selection)await add(`${prior}/model-results/${s.id}.json`);
await add('.eval-artifacts/e1-evaluator-20261016/compare-calibration.mjs');
const gates=JSON.parse(await fs.readFile(`${dir}/gates.json`));if(gates.status!=='PASS')throw Error('FIVE_GATES_REQUIRED');
const freeze={schema:'tabelog-query-binding-freeze@1',createdAt:new Date().toISOString(),codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),reviewCommit:'3d147882',mode:'EXPOSED_DEVELOPMENT_OFFLINE_REPLAY',browserPrompt:19,browserContext:2,browserActionWire:11,restaurantContext:15,restaurantPrompt:27,evaluator:30,rubric:26,budgets:{modelCalls:69,selectionNewCalls:0,phaseBefore:2284,phaseLimit:4000,sourceRequests:0,live:0,retries:0},thresholds:{calendar:68,calendarTotal:69,selection:5,calibration:22,fiveGates:'ALL_PASS'},files};
await fs.writeFile(`${dir}/freeze.json`,JSON.stringify(freeze,null,2),{flag:'wx'});
console.log(JSON.stringify({codeCommit:freeze.codeCommit,files:Object.keys(files).length,sha256:sha(await fs.readFile(`${dir}/freeze.json`))}));
