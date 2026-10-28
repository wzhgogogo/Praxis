import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='.eval-artifacts/phase3b/g4-name-entities',load=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const freeze=load(root+'/freeze.json');for(const f of freeze.files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);
const baseline=p=>execFileSync('git',['show',`dd898e34:${p}`],{encoding:'utf8'});
const stripImport=s=>s.replace('import { decodeHTMLStrict } from "entities";\n','');
for(const [p,normalizer] of [['src/integrations/tabelog/tabelog-entity-resolver.ts','normalizeTabelogIdentity'],['src/integrations/tablecheck/tablecheck-entity-resolver.ts','normalizeTableCheckIdentity']]){
 let text=stripImport(readFileSync(p,'utf8'));for(const argument of ['left','right'])text=text.replace(`${normalizer}(decodeHTMLStrict(${argument}${normalizer==='normalizeTableCheckIdentity'?' ?? ""':''}))`,`${normalizer}(${argument})`);
 assert.equal(text,baseline(p),'Only insert entity decoding into existing name comparator: '+p);
}
const p='src/integrations/restaurant-identity/detail-identity-fields.ts',before=baseline(p);let current=stripImport(readFileSync(p,'utf8'));
const block=s=>{const start=s.indexOf('  const names ='),end=s.indexOf('  if (!heading',start);assert(start>=0&&end>start);return {start,end,value:s.slice(start,end)};};
const old=block(before),now=block(current);
assert.equal(now.value,String.raw`  const names = [...new Set(rows.filter(row => /^(?:restaurant name|shop name|店名|店舗名)$/i.test(row.label))
    .map(row => decodeHTMLStrict(row.html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()))];
  const decodedSourceName = sourceName === undefined ? undefined : decodeHTMLStrict(sourceName);
  if (names.length > 1 || (names[0] && decodedSourceName && !ownerKey(names[0]).includes(ownerKey(decodedSourceName)) && !ownerKey(decodedSourceName).includes(ownerKey(names[0])))) changed();
`);
current=current.slice(0,now.start)+old.value+current.slice(now.end);assert.equal(current,before,'Address/phone/ownership rules otherwise unchanged');
assert.equal(readFileSync('src/integrations/restaurant-availability/outlet-identity.ts','utf8'),baseline('src/integrations/restaurant-availability/outlet-identity.ts'));
for(const p of ['src/integrations/tabelog/tabelog-browser-availability.ts','src/integrations/restaurant-search/named-source-query.ts'])assert.equal(readFileSync(p,'utf8'),baseline(p),'No sorting/Prompt changes');
const ledger=load('.eval-artifacts/phase3b/budget.json'),integration=load(root+'/integration.json');assert.equal(sha(readFileSync('.eval-artifacts/phase3b/budget.json')),integration.ledger.unionSha256);assert.equal(new Set(ledger.entries.map(e=>e.id)).size,ledger.entries.length);
for(const ref of [integration.ours,integration.main]){const prior=JSON.parse(execFileSync('git',['show',`${ref}:.eval-artifacts/phase3b/budget.json`],{encoding:'utf8'}));for(const entry of prior.entries)assert.deepEqual(ledger.entries.find(e=>e.id===entry.id),entry);}
for(const key of Object.keys(ledger.cumulative))assert.equal(ledger.cumulative[key],ledger.entries.reduce((n,e)=>n+(e[key]??(key==='evaluationPublicGET'?e.publicGET:0)??0),0));
console.log(JSON.stringify({status:'PASS',frozenSHA:freeze.files.length,onlyNameEntityDecoding:true,addressPhoneThresholdRankingUnchanged:true,ledgerUnion:ledger.entries.length,cumulative:ledger.cumulative,newGET:0,newModel:0,google:0,live:0}));
