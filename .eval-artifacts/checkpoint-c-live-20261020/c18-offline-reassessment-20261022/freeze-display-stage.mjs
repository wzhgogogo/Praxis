import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const stage=process.argv[2];assert.ok(['replay','evaluation','delivery'].includes(stage));
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/c18-offline-reassessment-20261022`,output=`${dir}/${stage==='delivery'?'delivery-freeze':`display-${stage}-freeze`}.json`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p)),files={};
const add=async p=>{p=path.relative(process.cwd(),path.resolve(p));files[p]=sha(await fs.readFile(p));};
const previous=await read(`${dir}/reassessment-freeze.json`);
for(const p of Object.keys(previous.files))if(!p.startsWith('src/')&&!p.startsWith('scripts/')&&!p.startsWith(dir+'/')&&!p.startsWith('docs/')){await add(p);assert.equal(files[p],previous.files[p],`Historical input changed: ${p}`);}
for(const p of execFileSync('git',['ls-files','src','scripts','docs','package.json','package-lock.json','tsconfig.json','tsconfig.build.json'],{encoding:'utf8'}).trim().split('\n').filter(Boolean))await add(p);
async function walk(p){for(const d of await fs.readdir(p,{withFileTypes:true})){const name=path.join(p,d.name);if(d.isDirectory())await walk(name);else if(name!==output)await add(name);}}
await walk(dir);
const manifest={schema:'c18-offline-display-stage-freeze@1',stage,status:'frozen regression; exposed deterministic counterfactual replay, not Clean or Live',codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),versions:{evaluator:'32',rubric:'28',restaurantState:'19',taskDefinition:'17',conditionStates:'3',factPrompt:'14',factResponseSchema:'4',browserPrompt:'19',browserContext:'2'},originalReassessmentFreezeSha256:sha(await fs.readFile(`${dir}/reassessment-freeze.json`)),rules:'No real model, website, Google or Live. All source metadata comes from exact saved HTML with recording/trace proof. No changed candidate selection, original Gold/intent/model choices/times/resources. Derived-only correspondence and HARD bindings cannot certify actual Live.',activity:{newModels:0,newWebsites:0,newGoogle:0,newLiveRuns:0},files:Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)))};
await fs.writeFile(output,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({stage,files:Object.keys(files).length,sha256:sha(await fs.readFile(output)),codeCommit:manifest.codeCommit}));
