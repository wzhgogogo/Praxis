// Compare independently maintained literal audit input with the reviewed runtime
// surface. Never generate an approval from Guard or its ADMITTED outcomes.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const {discoveryPackNetworkPolicy}=await import(pathToFileURL(resolve('src/integrations/restaurant-search/source-packs.ts')).href);
const {parseReviewedReads}=await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts')).href);
const bytes=await readFile(resolve('src/eval/restaurant/agent-loop/cases/reviewed-public-reads.json')),literal=parseReviewedReads(bytes,'independent literal audit catalog');
const key=(v:string[])=>[...new Set(v)].sort().join('|');
const coverage=discoveryPackNetworkPolicy().dynamicReads.map((r:any)=>{
 const matches=literal.rules.filter((a:any)=>a.origin===r.origin&&(
  r.pathname&&(a.pathname===r.pathname||a.pathnamePattern&&new RegExp(a.pathnamePattern).test(r.pathname))
  ||r.pathnamePrefix&&a.pathnamePattern==='^'+r.pathnamePrefix+'.*$'
  ||r.pathnamePattern&&a.pathnamePattern===r.pathnamePattern)
  &&(r.methods??['GET','HEAD']).every((m:string)=>a.methods.includes(m))
  &&r.resourceTypes.every((t:string)=>a.resourceTypes.includes(t))
  &&key(a.queryKeyRules?.required??[])===key(r.queryKeyRules?.required??r.queryKeys??[])
  &&key(a.queryKeyRules?.allowed??[])===key(r.queryKeyRules?.allowed??[])
  &&key(a.queryKeyRules?.repeatable??[])===key(r.queryKeyRules?.repeatable??[])
  &&(!r.corsPreflight||a.corsPreflight&&a.corsPreflight.requestOrigin===r.corsPreflight.requestOrigin&&key(a.corsPreflight.requestedHeaderNames)===key(r.corsPreflight.requestedHeaderNames)));
 assert.ok(matches.length,`Independent frozen catalog missing reviewed contract: ${r.origin} ${r.pathname??r.pathnamePrefix??r.pathnamePattern}`);
 return{origin:r.origin,path:r.pathname??r.pathnamePrefix??r.pathnamePattern,matchedLiteralRules:matches.length};
});
assert.equal(coverage.length,20);assert.equal(coverage.filter((r:any)=>r.path==='/search/').length,5);
const result={status:'PASS',policyContractCount:coverage.length,literalRuleCount:literal.rules.length,literalSHA256:createHash('sha256').update(bytes).digest('hex'),coverage,source:'Independently handwritten literal rules; comparison only, never production-generated approval',values:'Approved text equality/destination/locale value contracts remain independently recorded in tablecheck-destination-20261107/reviewed-read-rules.json and shop approval; this catalog is method/path/query-shape/preflight projection'};
await writeFile(resolve('.eval-artifacts/phase3b/d8-b1-closeout-20261108/approved-contract-coverage.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,contracts:coverage.length,literalRules:literal.rules.length}));
