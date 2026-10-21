import fs from 'node:fs';
import {createFreeze,sha,base} from '../freeze.mjs';
const dir=base+'/checkpoint-c-rerun-20261021',stage=process.argv[2];
if(!['certification','live'].includes(stage))throw Error('STAGE_REQUIRED');
const ledger=JSON.parse(fs.readFileSync(dir+'/ledger-before.json'));
const extra=[dir+'/audit-witnesses.py',dir+'/execution-authorization.json',dir+'/plan.md',dir+'/ledger-before.json',dir+'/merge-readiness.json',dir+'/outer-controls.log',...ledger.sources.map(s=>s.path)];
if(stage==='live'){
 const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
 extra.push(...walk(dir+'/witness-capture'),dir+'/source-review.json',dir+'/capture-audit.json',dir+'/registry.certified.json',dir+'/certification-freeze.json',dir+'/offline-rehearsal/finish.json');
}
const output=dir+'/'+stage+'-freeze.json',f=createFreeze(output,extra);
console.log(JSON.stringify({stage,commit:f.commit,files:Object.keys(f.files).length,sha256:sha(fs.readFileSync(output))}));
