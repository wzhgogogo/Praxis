import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {sha} from '../../phase2b-exit-pipeline-20261022/inputs.mjs';
const base='.eval-artifacts/phase2c-holdout/exit-live-20261023',git=(...a)=>execFileSync('git',a,{maxBuffer:32e6}).toString().trim();
export function create(path){
 const all=git('ls-files','-z').split('\0').filter(Boolean),ledger=JSON.parse(fs.readFileSync(base+'/ledger-before.json'));
 const paths=all.filter(p=>/^(src\/|web-skills\/|scripts\/|docs\/skills\/|package(?:-lock)?\.json$|tsconfig.*\.json$)/.test(p)||p.startsWith('.eval-artifacts/phase2c-holdout/')||p.startsWith('.eval-artifacts/phase2b-exit-pipeline-20261022/')||p.startsWith('.eval-artifacts/checkpoint-c-live-20261020/')&&/\.(mjs|ts)$/.test(p));
 paths.push('.eval-artifacts/checkpoint-c-live-20261020/reviewed-reads.json','.eval-artifacts/checkpoint-c-live-20261020/runner-relocation.json','.eval-artifacts/checkpoint-c-live-20261020/runner-input.yaml');
 paths.push(...ledger.sources.map(s=>s.path));
 // The reused checkpoint modules also import these frozen eval-side helpers/inputs.
 paths.push(...all.filter(p=>p.startsWith('.eval-artifacts/p2-1-discovery-20261016/')&&/\.(mjs|ts)$/.test(p)));
 const dirty=new Set(git('diff','--name-only','HEAD').split('\n'));for(const p of paths){assert.ok(all.includes(p),'UNCOMMITTED:'+p);assert.ok(!dirty.has(p),'DIRTY:'+p);}
 const result={schema:'phase2c-live-freeze@1',createdAt:new Date().toISOString(),commit:git('rev-parse','HEAD'),branch:'codex/holdout-phase2c-exit',mainline:'8487a844',productReference:'16e91940',evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',purpose:'Two isolated queues, unchanged complete Runner and product, capability evaluation deferred',files:Object.fromEntries([...new Set(paths)].sort().map(p=>[p,sha(fs.readFileSync(p))]))};
 fs.writeFileSync(path,JSON.stringify(result,null,2)+'\n',{flag:'wx'});return {sha256:sha(fs.readFileSync(path)),files:Object.keys(result.files).length};
}
export function verify(path){const bytes=fs.readFileSync(path),f=JSON.parse(bytes);for(const [p,h] of Object.entries(f.files))assert.equal(sha(fs.readFileSync(p)),h,'FROZEN_FILE_CHANGED:'+p);return {...f,sha256:sha(bytes)};}
if(process.argv[1]?.endsWith('/freeze.mjs'))console.log(JSON.stringify(create(process.argv[2])));
