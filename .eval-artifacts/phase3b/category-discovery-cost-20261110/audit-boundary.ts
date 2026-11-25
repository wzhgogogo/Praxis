// Offline independent boundary sidecar; does not supplement or replace evaluations.
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {readDiagnosticTrace,readDiagnosticRun} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-record.js';
import {auditReadOnlyTrace,parseReviewedReads} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.js';
import {evaluateG6} from '../../../src/eval/restaurant/agent-loop/g6/evaluator.js';
const root='.eval-artifacts/phase3b/category-discovery-cost-20261110';
const rulesPath='.eval-artifacts/phase3b/d8-direct-outlet-live-20261109/preparation/reviewed-public-reads.json';
const rules=parseReviewedReads(await readFile(rulesPath),rulesPath);
const results=[];
for(const id of ['D01','D02']){
 const slot=join(root,'runtime',id,id),input=JSON.parse(await readFile(join(slot,id==='D01'?'evaluation.input.json':'failure.evaluation.input.json'),'utf8'));
 const outer=JSON.parse(await readFile(join(slot,'outer-requests.json'),'utf8'));
 if(!outer.complete||outer.runId!==input.runId)throw Error('BOUNDARY_EVIDENCE_INCOMPLETE');
 const rows=[];for(const rec of await readdir(join(slot,'recordings')))rows.push(...JSON.parse(await readFile(join(slot,'recordings',rec,'recording.json'),'utf8')).entries);
 const trace=readDiagnosticTrace(rows.filter(e=>e.kind!=='NETWORK_RESOURCE_TYPES'));if(trace.issues.length)throw Error('TRACE_INCOMPLETE');
 const gets=trace.entries.map(e=>({...e,...(e.networkRequests?{networkRequests:e.networkRequests.filter(r=>['GET','HEAD'].includes(r.method??''))}:{}),...(e.detail?.networkRequests?{detail:{...e.detail,networkRequests:e.detail.networkRequests.filter(r=>['GET','HEAD'].includes(r.method??''))}}:{})}));
 const result=JSON.parse(await readFile(join(slot,id==='D01'?'execution.result.json':'failure.json'),'utf8'));
 const provenance=auditReadOnlyTrace(gets,[],false,rules,readDiagnosticRun(result.execution).record.finalSnapshot?.domainState);
 const checks=evaluateG6({...input,requests:outer.requests}).checks.filter(c=>c.rule==='REQUEST_BOUNDARY');
 results.push({id,scope:'BOUNDARY_ONLY_NOT_SUPPLEMENTAL_EVALUATION',safe:provenance.status==='ABSENT'&&checks.length===outer.requests.filter((r:any)=>r.reachedSource).length&&checks.every(c=>c.status==='PASS'),provenance,rulesSHA256:rules.sha256,methodCheckCount:checks.length,methodFailures:checks.filter(c=>c.status!=='PASS')});
}
await writeFile(join(root,'independent-boundary.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({provenance,...r})=>({...r,provenance:provenance.status})),null,2));
