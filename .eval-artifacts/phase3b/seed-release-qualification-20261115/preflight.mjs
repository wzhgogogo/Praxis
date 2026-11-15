import {readFile,writeFile,access,unlink} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import{createHash}from'node:crypto';
import{execFileSync}from'node:child_process';
import assert from'node:assert/strict';
const root=dirname(fileURLToPath(import.meta.url));
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const regression=await json(join(root,'regression.json'));
assert.equal(regression.gate,'PASS_ON_COMPARABLE_EVIDENCE');
for(const name of ['d02v','d8']){
 const c=await json(join(root,name,'config.json')),specs=await json(join(root,name,'specs.json'));
 const git=(...args)=>execFileSync('git',['--no-optional-locks','-C',c.sourceRoot,...args],{encoding:'utf8'}).trim();
 assert.equal(git('rev-parse','HEAD'),c.sourceSHA);assert.equal(git('status','--porcelain'),'');
 assert.equal(git('diff',c.sourceCodeSHA,c.sourceSHA,'--','src','web-skills'),'');
 const {d02vSpec}=await import(pathToFileURL(join(c.sourceRoot,'src/eval/restaurant/agent-loop/g6/run-seed-remaining.ts')));
 const {frozenHoldoutReadRules}=await import(pathToFileURL(join(c.sourceRoot,'src/eval/restaurant/agent-loop/g6/holdout-runner.ts')));
 const rules=await frozenHoldoutReadRules();assert.equal(rules.length,21);
 for(const spec of specs){assert.equal(spec.id,c.id);assert.deepEqual(spec.oracle.reviewedReadRules,rules);assert.ok(Date.parse(spec.witness.date)>Date.now());assert.equal(spec.followups.length,name==='d02v'?0:2);}
 if(name==='d02v'){const expected=d02vSpec(c.id);expected.oracle.reviewedReadRules=rules;assert.deepEqual(specs,[expected]);}
 const ledger=await json(c.budget);assert.deepEqual(ledger.limits,c.maximumBudget);assert.equal(ledger.cumulative.fullLive,0);
 assert.ok(!(await access(c.output).then(()=>true,()=>false)));
 const marker=join(root,name,'.offline-writable');await writeFile(marker,'offline',{flag:'wx'});await unlink(marker);
}
const files=['run-smoke.ts','preflight.mjs','plan.md','regression.json','compare.py','protection.py','protected-before.json',...['d02v','d8'].flatMap(k=>['config.json','specs.json','budget-before.json'].map(n=>k+'/'+n))];
const c=await json(join(root,'d02v/config.json'));
await writeFile(join(root,'configuration-hashes.json'),JSON.stringify({files:Object.fromEntries(await Promise.all(files.map(async name=>[name,hash(await readFile(join(root,name)))]))),envFileSHA256:hash(await readFile(c.environmentFile))},null,2)+'\n',{flag:'wx'});
await writeFile(join(root,'offline-preflight.json'),JSON.stringify({passed:true,sourceSHA:c.sourceSHA,plannedLive:2,readRules:21,newLedgers:2,credentialsReferencedByEnvFile:true,outputWritable:true,siteGET:0,modelCalls:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({passed:true,plannedLive:2,externalRequests:0}));

