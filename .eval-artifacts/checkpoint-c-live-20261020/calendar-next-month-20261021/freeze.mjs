// Freeze code, exposed inputs, evaluation scripts and payloads before any eval.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex'),files={};
const add=async p=>{p=path.normalize(p);files[p]=sha(await fs.readFile(p));};
const walk=async p=>{for(const e of await fs.readdir(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory())await walk(f);else await add(f);}};
for(const p of execFileSync('git',['ls-files','src','package.json','package-lock.json','tsconfig.json','scripts/arch-check.ts'],{encoding:'utf8'}).trim().split('\n'))await add(p);
for(const name of ['inputs','prepared','url-parameter-audit'])await walk(`${dir}/${name}`);
for(const name of ['plan.md','prepare.mjs','freeze.mjs','run-calibration.mjs','run-model-replays.mjs','gates.json'])await add(`${dir}/${name}`);
// Reuse all unchanged original calibration/selection inputs and comparators.
// Source hashes deliberately freeze the current implementation, not old code.
for(const file of ['.eval-artifacts/checkpoint-c-p21c-integration-20261020/calibration-freeze.json','.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck/freeze.json']){
 const f=JSON.parse(await fs.readFile(file));
 for(const[p,h]of Object.entries(f.files))if(!p.startsWith('src/')){const b=await fs.readFile(p);if(sha(b)!==h)throw Error(`ORIGINAL_INPUT_CHANGED:${p}`);await add(p);}
}
// Include the browser skills (they are unchanged: V1 is not adopted).
for(const p of execFileSync('git',['ls-files','docs/skills'],{encoding:'utf8'}).trim().split('\n'))await add(p);
const freeze={schema:'calendar-next-month-freeze@1',createdAt:new Date().toISOString(),baseCommit:'a3f6b84519d1bfdff271b5f87d88fa34450d40d1',reviewCommit:'6d92882',status:'EXPOSED_DEVELOPMENT_OFFLINE_REPLAY',browserPrompt:'18',browserContext:'1 (first explicit version; previous context unversioned)',browserActionWire:'11',restaurantContext:'15',restaurantPrompt:'27',budgets:{maxModelCalls:74,calendar:69,selection:5,phaseBefore:1995,phaseLimit:4000,websiteRequests:0,live:0,automaticRetries:0},thresholds:{calendarMinimum:68,calendarTotal:69,selectionMinimum:5,selectionTotal:5,calibration:22,fiveGates:'ALL_PASS'},files};
await fs.writeFile(`${dir}/freeze.json`,JSON.stringify(freeze,null,2),{flag:'wx'});
console.log(JSON.stringify({files:Object.keys(files).length,freezeSha256:sha(await fs.readFile(`${dir}/freeze.json`)),budgets:freeze.budgets}));
