import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dir='.eval-artifacts/checkpoint-c-live-20261020/budget-condition-20261022',previous='.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022/continuation-20261022/evaluation-20261022';
const sha=b=>createHash('sha256').update(b).digest('hex'),prior=JSON.parse(await fs.readFile(`${previous}/evaluation-freeze.json`)),files={};
// Historical code hashes belong to their original run. Current code is frozen
// separately; saved observations/Gold/reviews must still equal the prior freeze.
for(const[p,h]of Object.entries(prior.files))if(!/^(?:src|scripts|docs|web|web-skills)\//.test(p)&&!/^package(?:-lock)?\.json$|^tsconfig/.test(p)){
 const actual=sha(await fs.readFile(p));assert.equal(actual,h,`Historical input changed:${p}`);files[p]=h;
}
for(const p of execFileSync('git',['ls-files','-z','src','scripts','web-skills','package.json','package-lock.json','tsconfig.json','tsconfig.build.json',dir],{encoding:'utf8'}).split('\0').filter(Boolean)){
 if(p.startsWith(dir+'/')&&!/\/(?:plan\.md|inputs\.json|h11-diagnosis\.json|[^/]+\.mjs)$/.test(p))continue;
 files[p]=sha(await fs.readFile(p));
}
assert.equal(execFileSync('git',['status','--porcelain','--untracked-files=no'],{encoding:'utf8'}),'','Commit code, inputs and experiment scripts before freeze');
const manifest={schema:'budget-condition-offline-freeze@1',status:'frozen regression; exposed holdout, not new Live',codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',previousInputFreezeSha256:sha(await fs.readFile(`${previous}/evaluation-freeze.json`)),
 scope:'Three saved case02 display replays and h11 report only. Historical source/Gold/reviews unchanged. New current code replaces historical code in this offline freeze.',newModels:0,newWebsites:0,newLive:0,
 files:Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b)))};
const p=`${dir}/replay-freeze.json`;await fs.writeFile(p,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:Object.keys(files).length,sha256:sha(await fs.readFile(p)),codeCommit:manifest.codeCommit}));
