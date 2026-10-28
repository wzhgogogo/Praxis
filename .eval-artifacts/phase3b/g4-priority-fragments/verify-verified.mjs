import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const root='.eval-artifacts/phase3b/g4-priority-fragments',sha=b=>createHash('sha256').update(b).digest('hex');
const frozen=JSON.parse(readFileSync(root+'/verified-freeze.json','utf8'));
for(const f of frozen.files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);
for(const p of ['src/integrations/tabelog/tabelog-entity-resolver.ts','src/integrations/restaurant-availability/outlet-identity.ts']){
 const baseline=execFileSync('git',['show',`fae69b48:${p}`],{encoding:'utf8'}),current=readFileSync(p,'utf8');
 // Original identity declarations close at column zero; compare their exact
 // source spans. No dependency on an unavailable compiler reflection API.
 const functions=text=>new Map([...text.matchAll(/^(?:export )?function (\w+)\(/gm)].map(m=>{const end=text.indexOf('\n}',m.index);assert(end>m.index,m[1]);return [m[1],text.slice(m.index,end+2)];}));
 const old=functions(baseline),now=functions(current);for(const [name,text] of old)assert.equal(now.get(name),text,p+'#'+name);
}
for(const p of ['src/integrations/tabelog/tabelog-page-parser.ts','src/integrations/tabelog/tabelog-query-controls.ts','src/integrations/tablecheck/tablecheck-page-parser.ts']){
 try{const before=execFileSync('git',['show',`fae69b48:${p}`],{encoding:'utf8',stdio:['ignore','pipe','ignore']});assert.equal(readFileSync(p,'utf8'),before,p);}catch(e){if(e.code==='ENOENT')throw e;if(p.includes('tablecheck-page-parser')&&!frozen.files.some(f=>f.path===p))continue;throw e;}
}
const ledger=JSON.parse(readFileSync('.eval-artifacts/phase3b/budget.json','utf8')),old=JSON.parse(execFileSync('git',['show','fae69b48:.eval-artifacts/phase3b/budget.json'],{encoding:'utf8'}));
assert.deepEqual(ledger.entries.slice(0,old.entries.length),old.entries);assert.equal(new Set(ledger.entries.map(e=>e.id)).size,ledger.entries.length);
for(const key of Object.keys(ledger.cumulative))assert.equal(ledger.cumulative[key],ledger.entries.reduce((n,e)=>n+(e[key]??(key==='evaluationPublicGET'?e.publicGET:0)??0),0),key);
const current=ledger.entries.filter(e=>e.id.startsWith('phase3b-c-g4-priority-model-'));assert(current.length<=10);assert.equal(ledger.cumulative.evaluationPublicGET,old.cumulative.evaluationPublicGET);assert.equal(ledger.cumulative.googleRequests,old.cumulative.googleRequests);assert.equal(ledger.cumulative.fullLive,old.cumulative.fullLive);
console.log(JSON.stringify({status:'PASS',frozenSHA:frozen.files.length,allOriginalIdentityFunctionsUnchanged:true,originalLedgerPreserved:true,newRealModel:current.length,newGET:0,google:0,live:0}));
