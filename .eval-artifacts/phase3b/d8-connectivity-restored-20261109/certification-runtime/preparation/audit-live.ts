// Read-only independent sidecar. Raw execution/recordings/evaluation stay intact.
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [rootArgument,id]=process.argv.slice(2);assert.ok(rootArgument&&['D4','D8'].includes(id!));
const root=resolve(rootArgument),slot=join(root,'runs',id!,id!);
const {readDiagnosticTrace,readDiagnosticRun}=await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/diagnostic-evaluator-record.ts')).href);
const {auditReadOnlyTrace,parseReviewedReads}=await import(pathToFileURL(resolve('src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts')).href);
const rulesPath=resolve('.eval-artifacts/phase3b/d8-connectivity-restored-20261109/preparation/reviewed-public-reads.json');
const reviewed=parseReviewedReads(await readFile(rulesPath),rulesPath);
const execution=JSON.parse(await readFile(join(slot,'execution.result.json'),'utf8'));
const evaluation=JSON.parse(await readFile(join(slot,'evaluation.json'),'utf8'));
const input=JSON.parse(await readFile(join(slot,'evaluation.input.json'),'utf8'));
const entries:unknown[]=[],recordingRefs:Array<{path:string;sha256:string;status:unknown;replay:unknown}>=[];
for(const directory of await readdir(join(slot,'recordings'))){
 const path=join(slot,'recordings',directory,'recording.json'),bytes=await readFile(path),recording=JSON.parse(bytes.toString());
 entries.push(...recording.entries);recordingRefs.push({path,sha256:createHash('sha256').update(bytes).digest('hex'),status:recording.status,replay:recording.replay});
}
const rawTrace=readDiagnosticTrace(entries);
for(const issue of rawTrace.issues){const m=/^external\.trace\[(\d+)\]\.detail$/.exec(issue.path);assert.ok(m);const entry=entries[Number(m[1])] as any;assert.equal(entry.kind,'NETWORK_RESOURCE_TYPES');assert.ok(Array.isArray(entry.detail));assert.equal(issue.reason,'INVALID_TYPE');}
const trace=readDiagnosticTrace(entries.filter((entry:any)=>entry.kind!=='NETWORK_RESOURCE_TYPES'));assert.equal(trace.issues.length,0);
const domain=readDiagnosticRun(execution.execution).record.finalSnapshot?.domainState;
// POST/OPTIONS use the frozen G6 raw outer method/body/preflight audit. Do not
// pretend Guard NETWORK rows contain their absent raw-body observations.
const getTrace=trace.entries.map(entry=>({...entry,
 ...(entry.networkRequests?{networkRequests:entry.networkRequests.filter(row=>['GET','HEAD'].includes(row.method??''))}:{}),
 ...(entry.detail?.networkRequests?{detail:{...entry.detail,networkRequests:entry.detail.networkRequests.filter(row=>['GET','HEAD'].includes(row.method??''))}}:{})}));
const getHead=auditReadOnlyTrace(getTrace,[],false,reviewed,domain);
const methods=evaluation.checks.filter((check:{rule:string})=>check.rule==='REQUEST_BOUNDARY');
const methodSafe=methods.length===input.requests.filter((r:{reachedSource:boolean})=>r.reachedSource).length&&methods.every((check:{status:string})=>check.status==='PASS');
const safe=methodSafe&&getHead.status==='ABSENT'&&evaluation.verdict.stopBatch===false;
const result={scope:'METHOD/BODY/PREFLIGHT: frozen G6 raw outer evidence; GET/HEAD/provenance: independent diagnostic audit. Not a Guard verdict.',rulesSHA256:reviewed.sha256,recordingRefs,rawTraceDecodeIssues:rawTrace.issues,decodeClassification:{metadataOnlyKind:"NETWORK_RESOURCE_TYPES",classified:rawTrace.issues.length,excludedRequestEvidence:0},traceDecodeIssues:trace.issues,getHead,outerRequestBoundary:{checked:methods.length,passed:methods.filter((c:{status:string})=>c.status==='PASS').length,allPassed:methodSafe},originalG6Verdict:evaluation.verdict,combinedSafeToContinue:safe};
await writeFile(join(slot,'independent-boundary-sidecar.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({id,getHead:getHead.status,outerMethods:methodSafe,originalG6:evaluation.verdict,safe}));if(!safe)process.exitCode=2;
