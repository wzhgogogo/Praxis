import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {tableCheckPublicReadNetworkPolicy as current} from '../../src/integrations/tablecheck/tablecheck-public-query.ts';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temporary=await fs.mkdtemp(join(tmpdir(),'tc-policy-baseline-'));
const baselineSource=execFileSync('git',['show','8487a844:src/integrations/tablecheck/tablecheck-public-query.ts']);
await fs.writeFile(join(temporary,'policy.ts'),baselineSource);
const {tableCheckPublicReadNetworkPolicy:before}=await import(pathToFileURL(join(temporary,'policy.ts')).href);
await fs.rm(temporary,{recursive:true,force:true});
const dir='.eval-artifacts/tablecheck-guard-preflight-20261023';
const strip=policy=>structuredClone(policy);
const old=strip(before),next=strip(current);
for(const policy of [old,next])for(const r of [...policy.staticResources,...policy.dynamicReads])delete r.corsPreflight;
const search=next.dynamicReads.find(r=>r.pathname==='/search/');search.queryKeyRules.required=['queryProfile','hits'];search.queryKeyRules.allowed=search.queryKeyRules.allowed.filter(k=>k!=='hits');
assert.deepEqual(next,old,'No endpoint/origin/resource/method/query grammar change except hits optional and GET-bound CORS');
assert.deepEqual(current.prohibitedPaths,before.prohibitedPaths);
for(const r of [...current.staticResources,...current.dynamicReads].filter(r=>r.corsPreflight)){
 assert.ok((r.methods??['GET','HEAD']).includes('GET'));assert.ok(r.resourceTypes.some(t=>['fetch','xhr'].includes(t)));assert.equal(r.corsPreflight.requestOrigin,'https://www.tablecheck.com');assert.deepEqual(r.corsPreflight.requestedHeaderNames,['x-api-key']);
}
const original=execFileSync('git',['show','8487a844:src/integrations/tablecheck/tablecheck-public-query.ts']);
assert.deepEqual(baselineSource,original);
await fs.writeFile(`${dir}/policy-scope.json`,JSON.stringify({status:'PASS',baseline:'8487a844',baselineSourceSha256:createHash('sha256').update(original).digest('hex'),newOrigins:[],newPaths:[],newMethods:[],prohibitedPathsUnchanged:true,allowedChanges:['V4 hits required to optional','GET-bound browser CORS metadata on existing TableCheck fetch/xhr GET reads'],outsideTableCheckSourceExceptions:0},null,2)+'\n',{flag:'wx'});
console.log('Policy scope PASS: only hits optional/CORS metadata; reserve/origin/path/method unchanged');
