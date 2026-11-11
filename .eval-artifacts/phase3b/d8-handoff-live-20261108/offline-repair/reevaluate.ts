import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=resolve('.eval-artifacts/phase3b/d8-handoff-live-20261108'),slot=resolve(root,'diagnostic-runtime/runs/D8/D8'),out=resolve(root,'offline-repair/sidecar-final');await mkdir(out,{recursive:true});
const {evaluateG6}=await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/g6/evaluator.ts')).href);
const {parseReviewedReads,auditReadOnlyTrace}=await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts')).href);
const {readDiagnosticTrace,readDiagnosticRun}=await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/diagnostic-evaluator-record.ts')).href);
const originalBytes=await readFile(resolve(slot,'evaluation.input.json')),originalResultBytes=await readFile(resolve(slot,'evaluation.json')),input=JSON.parse(originalBytes.toString()),original=JSON.parse(originalResultBytes.toString());
const hash=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex');
const rulesBytes=await readFile(resolve('src/eval/restaurant/agent-loop/cases/reviewed-public-reads.json'));
const reviewed=parseReviewedReads(rulesBytes,'independently transcribed approved text shapes; approval tablecheck-destination-20261107/reviewed-read-rules.json');
const approvedContract=await readFile(resolve('.eval-artifacts/phase3b/tablecheck-destination-20261107/reviewed-read-rules.json'));
input.reviewedReadRules=reviewed.rules.map((r:any,i:number)=>({ref:'corrected-literal:'+i,origin:r.origin,...(r.pathname?{pathname:r.pathname}:{}),...(r.pathnamePattern?{pathnamePattern:r.pathnamePattern}:{}),methods:r.methods,queryKeys:[...r.queryKeyRules?.required??[],...r.queryKeyRules?.allowed??[],...r.queryKeyRules?.repeatable??[]],requiredQueryKeys:r.queryKeyRules?.required??[],...(r.bodyFields?{bodyFields:r.bodyFields}:{}),...(r.corsPreflight?{corsPreflight:r.corsPreflight}:{})}));
const evaluation=evaluateG6(input),methods=evaluation.checks.filter((c:any)=>c.rule==='REQUEST_BOUNDARY');
const recBytes=await readFile(resolve(slot,'recordings/g6-D8-1794116420864-0/recording.json')),recording=JSON.parse(recBytes.toString()),trace=readDiagnosticTrace(recording.entries),execution=JSON.parse(await readFile(resolve(slot,'execution.result.json'),'utf8'));
const metadataOnly=recording.entries.filter((e:any)=>e.kind==='NETWORK_RESOURCE_TYPES');
assert.equal(metadataOnly.length,trace.issues.length);
for(const issue of trace.issues){const match=/^external\.trace\[(\d+)\]\.detail$/.exec(issue.path);assert.ok(match);const entry=recording.entries[Number(match[1])];assert.equal(entry.kind,'NETWORK_RESOURCE_TYPES');assert.ok(Array.isArray(entry.detail));assert.equal(issue.reason,'INVALID_TYPE');}
// Retain the raw decode report. These are duplicated CDP resource-label
// inventories, not dispatch evidence; project only this declared metadata kind.
const boundaryTrace=readDiagnosticTrace(recording.entries.filter((e:any)=>e.kind!=='NETWORK_RESOURCE_TYPES'));
const getTrace=boundaryTrace.entries.map((entry:any)=>({...entry,...(entry.networkRequests?{networkRequests:entry.networkRequests.filter((r:any)=>['GET','HEAD'].includes(r.method??''))}:{}),...(entry.detail?.networkRequests?{detail:{...entry.detail,networkRequests:entry.detail.networkRequests.filter((r:any)=>['GET','HEAD'].includes(r.method??''))}}:{})}));
const getHead=auditReadOnlyTrace(getTrace,[],false,reviewed,readDiagnosticRun(execution.execution).record.finalSnapshot?.domainState);
const result={status:'CORRECTED_OFFLINE_SIDECAR_ONLY; original Live outcome/score immutable; no new execution',provenance:{originalEvaluationSHA256:hash(originalResultBytes),originalInputSHA256:hash(originalBytes),rulesSHA256:reviewed.sha256,approvalContractSHA256:hash(approvedContract),recordingSHA256:hash(recBytes)},originalVerdict:original.verdict,correctedVerdict:evaluation.verdict,outerRequestBoundary:{checked:methods.length,passed:methods.filter((c:any)=>c.status==='PASS').length,failed:methods.filter((c:any)=>c.status!=='PASS')},traceDecodeIssues:trace.issues,decodeClassification:{metadataOnlyKind:"NETWORK_RESOURCE_TYPES",classified:metadataOnly.length,boundaryDecodeIssues:boundaryTrace.issues,excludedRequestEvidence:0},getHead,actualBoundaryViolationEstablished:methods.some((c:any)=>c.status==='FAIL')||getHead.status==='PRESENT',safeEvidenceComplete:boundaryTrace.issues.length===0&&methods.every((c:any)=>c.status==='PASS')&&getHead.status==='ABSENT',businessAcceptance:'NOT_EVALUATED: no positive witness; identity uniqueness and availability not completed'};
for(const [name,value]of [['evaluation.input.json',input],['evaluation.json',evaluation],['independent-boundary.json',result]])await writeFile(resolve(out,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
await writeFile(resolve(out,'reviewed-public-reads.json'),rulesBytes,{flag:'wx'});
assert.equal(hash(await readFile(resolve(slot,'evaluation.json'))),hash(originalResultBytes));assert.equal(hash(await readFile(resolve(slot,'evaluation.input.json'))),hash(originalBytes));
console.log(JSON.stringify(result,null,2));assert.equal(result.safeEvidenceComplete,true);
