import {readFile,readdir,realpath,writeFile} from 'node:fs/promises';
import {join,relative,resolve,sep} from 'node:path';
import {holdoutHash} from '../holdout-protocol.js';
import {evaluateG6,type G6EvaluationInput,type G6Evaluation} from './evaluator.js';
import {supplementRecordedQualification} from './recorded-qualification.js';
import {readDiagnosticTrace,readDiagnosticRun} from '../diagnostic-evaluator-record.js';
import {auditReadOnlyTrace,parseReviewedReads} from '../diagnostic-evaluator-network.js';
import {readJSON,atomicJSON,type HoldoutAttempt} from './holdout-checkpoint.js';

/** Same annotation fields as the frozen D4/D8 inputs. Claims, request, raw
 * boundary, result and source text cannot be supplied by a reviewer file. */
export interface HoldoutReview {
 schema:'phase3b-holdout-review@1';attemptKey:string;
 annotations:Pick<G6EvaluationInput,'qualificationOracles'|'questions'|'priceOracles'>;
}
export interface HoldoutReviewOption {key:string;file:string;}
export async function externalReviewFile(file:string){
 const path=await realpath(resolve(file)),repo=await realpath(process.cwd()),r=relative(repo,path);
 if(!r.startsWith('..'+sep)&&r!=='..')throw Error('HOLDOUT_REVIEW_MUST_STAY_OUTSIDE_REPOSITORY');
 return path;
}
async function evidenceHash(slot:string):Promise<string>{
 const items:Array<[string,string]>=[];
 async function walk(dir:string){for(const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  if(item.name.startsWith('evaluation.supplement.')||item.name==='review-receipt.json')continue;
  const file=join(dir,item.name);if(item.isSymbolicLink())throw Error('HOLDOUT_REVIEW_EVIDENCE_SYMLINK');
  if(item.isDirectory())await walk(file);else if(item.isFile())items.push([relative(slot,file),holdoutHash(await readFile(file))]);
 }}await walk(slot);return holdoutHash(JSON.stringify(items));
}
/** Recompute provenance from recorded rows plus raw outer method/body/preflight
 * observations. The Guard outcome is dispatch evidence, never a safety oracle. */
async function independentBoundary(slot:string,input:G6EvaluationInput){
 const outer=await readJSON<{runId:string;complete:boolean;requests:G6EvaluationInput['requests']}>(join(slot,'outer-requests.json'));
 if(!outer?.complete||outer.runId!==input.runId||!Array.isArray(outer.requests))throw Error('HOLDOUT_REVIEW_BOUNDARY_EVIDENCE_MISSING');
 const raw:unknown[]=[];
 for(const directory of await readdir(join(slot,'recordings'))){const recording=await readJSON<{entries:unknown[]}>(join(slot,'recordings',directory,'recording.json'));if(!recording||!Array.isArray(recording.entries))throw Error('HOLDOUT_REVIEW_BOUNDARY_EVIDENCE_MISSING');raw.push(...recording.entries);}
 // The sidecar classifies only the known metadata-only diagnostic kind.
 const trace=readDiagnosticTrace(raw.filter(e=>(e as {kind?:string}).kind!=='NETWORK_RESOURCE_TYPES'));
 if(trace.issues.length)throw Error('HOLDOUT_REVIEW_BOUNDARY_EVIDENCE_MISSING');
 const rulesURL=new URL('../../../../../.eval-artifacts/phase3b/d8-direct-outlet-live-20261109/preparation/reviewed-public-reads.json',import.meta.url);
 const reviewed=parseReviewedReads(await readFile(rulesURL),rulesURL.pathname);
 const failure=await readJSON<{execution?:unknown}>(join(slot,'failure.json'));
 const domain=failure?.execution?readDiagnosticRun(failure.execution).record.finalSnapshot?.domainState:undefined;
 const gets=trace.entries.map(e=>({...e,...(e.networkRequests?{networkRequests:e.networkRequests.filter(r=>['GET','HEAD'].includes(r.method??''))}:{}),
  ...(e.detail?.networkRequests?{detail:{...e.detail,networkRequests:e.detail.networkRequests.filter(r=>['GET','HEAD'].includes(r.method??''))}}:{})}));
 const provenance=auditReadOnlyTrace(gets,[],false,reviewed,domain);
 const methods=evaluateG6({...input,requests:outer.requests}).checks.filter(c=>c.rule==='REQUEST_BOUNDARY');
 const safe=provenance.status==='ABSENT'&&methods.length===outer.requests.filter(r=>r.reachedSource).length&&methods.every(c=>c.status==='PASS');
 return {safe,provenance,methods,rulesSHA256:reviewed.sha256,requests:outer.requests};
}
export async function checkSavedReview(attempt:HoldoutAttempt){
 if(!attempt.review)return;
 const r=attempt.review,slot=join(attempt.path,attempt.key);
 if(holdoutHash(await readFile(r.file))!==r.sha256)throw Error('HOLDOUT_REVIEW_FILE_CHANGED');
 if(await evidenceHash(slot)!==r.evidenceSHA256)throw Error('HOLDOUT_REVIEW_EVIDENCE_CHANGED');
 const file=join(slot,'evaluation.supplement.json'),result=await readJSON<G6Evaluation>(file);
 if(!result)return;
 if(!r.evaluationSHA256)throw Error('HOLDOUT_REVIEW_EVALUATION_UNBOUND');
 if(holdoutHash(await readFile(file))!==r.evaluationSHA256)throw Error('HOLDOUT_REVIEW_EVALUATION_CHANGED');
 return result;
}
export async function reviewHoldoutAttempt(attempt:HoldoutAttempt,option:HoldoutReviewOption,transform:(v:unknown)=>unknown,save:()=>Promise<void>){
 const file=await externalReviewFile(option.file),bytes=await readFile(file),sha256=holdoutHash(bytes),slot=join(attempt.path,attempt.key);
 if(attempt.review&&(attempt.review.sha256!==sha256||attempt.review.file!==file))throw Error('HOLDOUT_REVIEW_FILE_CHANGED');
 const document=JSON.parse(bytes.toString())as HoldoutReview;
 if(document.schema!=='phase3b-holdout-review@1'||document.attemptKey!==attempt.key||Object.keys(document).some(k=>!['schema','attemptKey','annotations'].includes(k))
  ||!document.annotations||typeof document.annotations!=='object'||Array.isArray(document.annotations)||Object.keys(document.annotations).some(k=>!['qualificationOracles','questions','priceOracles'].includes(k)))throw Error('HOLDOUT_REVIEW_INVALID');
 if(!attempt.review){attempt.review={file,sha256,evidenceSHA256:await evidenceHash(slot)};await save();}
 const finish=async(evaluation:G6Evaluation)=>{
  // A late review updates the entire development G6 batch, including slots
  // completed after this one. The immutable original evaluation is untouched.
  const path=join(attempt.path,'batch.json'),batch=await readJSON<{schemaVersion:string;status?:string;stopReason:string|null;pendingReviewCount?:number;passRateReportable?:boolean;slots:Array<{id:string;status:string}>}>(path);
  if(batch?.schemaVersion==='phase3b-g6-batch@1'){
   if(evaluation.verdict.s0){batch.status='FAILED_S0';batch.stopReason='S0_STOP';}
   else if(!evaluation.verdict.stopBatch&&evaluation.verdict.status==='EVALUATED'){const slot=batch.slots.find(r=>r.id===attempt.key);if(slot)slot.status='EVALUATED_BY_REVIEW';if(batch.stopReason==='INDEPENDENT_EVIDENCE_REVIEW_REQUIRED'&&!batch.slots.some(r=>r.status==='STOPPED'))batch.stopReason=null;}
   batch.pendingReviewCount=batch.slots.filter(r=>r.status==='PENDING_REVIEW').length;batch.passRateReportable=batch.pendingReviewCount===0&&batch.status!=='FAILED_S0'&&!batch.stopReason&&batch.slots.every(r=>['EVALUATED','EVALUATED_BY_REVIEW'].includes(r.status));await atomicJSON(path,transform(batch));
  }
  return evaluation;
 };
 const prior=await checkSavedReview(attempt);if(prior)return finish(prior);
 const original=await readJSON<G6Evaluation>(join(slot,'evaluation.json'));
 if(original?.verdict.s0)throw Error('HOLDOUT_S0_RESUME_FORBIDDEN');
 let input=await readJSON<G6EvaluationInput>(join(slot,original?'evaluation.input.json':'failure.evaluation.input.json'));
 if(!input)throw Error('HOLDOUT_REVIEW_RECORDED_INPUT_MISSING');
 if(!original){
  const failureBytes=await readFile(join(slot,'failure.json'));
  input.executionFailure={ref:'failure.json',sha256:holdoutHash(failureBytes)};
  const boundary=await independentBoundary(slot,input);
  await atomicJSON(join(slot,'evaluation.supplement.boundary.json'),transform(boundary));
  if(!boundary.safe)throw Error('HOLDOUT_REVIEW_BOUNDARY_NOT_CLEAR');
  input.requests=boundary.requests;
 }
 // Re-extract page identities/slots/links from original recorded bytes, never
 // from product HIGH, AVAILABLE or reviewer-written source text.
 input=(await supplementRecordedQualification(slot,input)).input;
 Object.assign(input,document.annotations);
 const evaluation=evaluateG6(input);
 await atomicJSON(join(slot,'evaluation.supplement.input.json'),transform(input));
 const output=join(slot,'evaluation.supplement.json'),outputBytes=JSON.stringify(transform(evaluation),null,2)+'\n';
 attempt.review.evaluationSHA256=holdoutHash(outputBytes);await save();
 await writeFile(output,outputBytes,{flag:'wx',mode:0o600});
 return finish(evaluation);
}
