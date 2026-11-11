import {execFileSync} from 'node:child_process';
import {evaluateG6,type G6Evaluation,type G6EvaluationInput} from './evaluator.js';
import {supplementRecordedQualification} from './recorded-qualification.js';
import {reviewHoldoutAttempt,checkSavedReview,externalReviewFile,type HoldoutReview,type HoldoutReviewOption} from './holdout-review.js';
import {holdoutHash} from '../holdout-protocol.js';
import {holdoutLock,bindHoldoutLedger,checkResumeIdentity,readJSON,saveHoldoutCheckpoint,holdoutLiveCharged,type HoldoutRunAudit,type HoldoutAttempt,type HoldoutCheckpoint} from './holdout-checkpoint.js';
import {mkdir,readFile,writeFile,realpath,readdir} from 'node:fs/promises';
import {join,resolve,relative} from 'node:path';
import type {PrivateHoldoutManifest} from '../holdout-protocol.js';
import {privateInputRedactor} from '../holdout-protocol.js';
import {runG6Batch,type G6Case,type G6Pack,type G6RunnerDependencies} from './runner.js';
import {chargeG6} from './budget.js';
import type {HoldoutHealthObservation} from './holdout-health.js';

/** Explicit transport diagnostics only. Semantic/schema failures, 4xx/5xx and
 * safety-evidence omissions do not become environmental retries. */
export async function recordedEnvironmentFailure(slot:string){
 const transportCode=(value:unknown):boolean=>{
  if(!value||typeof value!=='object')return false;const v=value as {code?:unknown;message?:unknown;cause?:unknown};
  return typeof v.code==='string'&&['ENOTFOUND','EAI_AGAIN','ECONNRESET','ETIMEDOUT','ECONNREFUSED'].includes(v.code)
   ||typeof v.message==='string'&&/net::ERR_(?:NAME_NOT_RESOLVED|CONNECTION_TIMED_OUT|CONNECTION_RESET|CONNECTION_REFUSED)\b/u.test(v.message)||transportCode(v.cause);
 };
 try{const f=JSON.parse(await readFile(join(slot,'failure.json'),'utf8'));if(transportCode(f.transportError))return true;}catch{/* no typed failure */}
 try{const t=JSON.parse(await readFile(join(slot,'browser-trace.json'),'utf8'))as {events:Array<{kind:string;detail?:{resourceType?:string;pathname?:string;outcome?:string;error?:unknown}}>};
  return t.events.some(e=>e.kind==='NETWORK_REQUEST_END'&&['FAILED','TIMED_OUT'].includes(e.detail?.outcome??'')
   &&(e.detail?.resourceType==='document'||e.detail?.resourceType==='script'&&/\/(?:index-[^/]+|commons)\.js$/u.test(e.detail.pathname??''))&&transportCode(e.detail?.error));
 }catch{return false;}
}
export interface HoldoutDependencies {
 g6:G6RunnerDependencies;
 health:(spec:G6Case,beforeGET:(source:string,round:number)=>Promise<void>)=>Promise<{passed:boolean;observations:HoldoutHealthObservation[]}>;
 execute?:typeof runG6Batch;
 now?:()=>number;wait?:(ms:number)=>Promise<void>;
 /** User2026-11-10: outer cooldown only; production operation deadlines unchanged. */
 startDelayMs?:()=>number;
}
export async function frozenHoldoutReadRules(){
 const pack=JSON.parse(await readFile(new URL('../../../../../.eval-artifacts/phase3b/d8-direct-outlet-live-20261109/D8-pack.json',import.meta.url),'utf8'))as G6Pack;
 const rules=pack.cases[0]?.oracle.reviewedReadRules;if(rules?.length!==21)throw Error('FROZEN_READ_CONTRACTS_MISSING');return rules;
}
/** Reject evaluator drift unrelated to the approved HTTP GET/HEAD correction. */
export function checkHTTPReevaluation(input:G6EvaluationInput,previous:G6Evaluation,next:G6Evaluation){
 if(previous.checks.length!==next.checks.length)throw Error('HOLDOUT_REEVALUATION_DRIFT');
 const changed:string[]=[];
 for(let i=0;i<previous.checks.length;i++){
  const a=previous.checks[i]!,b=next.checks[i]!;if(JSON.stringify(a)===JSON.stringify(b))continue;
  const request=input.requests.find(r=>r.ref===a.subject);let allowed=false;
  try{const u=new URL(request!.url);allowed=Boolean(request?.reachedSource&&['GET','HEAD'].includes(request.method)&&u.protocol==='http:'&&!u.username&&!u.password&&!u.port&&!u.hash&&!/^http:\/\/[^/?#]*:\d+(?:[/?#]|$)/iu.test(request.url));}catch{/* invalid stays rejected */}
  if(!allowed||a.rule!=='REQUEST_BOUNDARY'||a.status!=='FAIL'||b.status!=='PASS'||JSON.stringify({...a,status:'PASS'})!==JSON.stringify(b))throw Error('HOLDOUT_REEVALUATION_DRIFT');
  changed.push(a.subject);
 }
 if(!changed.length){if(JSON.stringify(previous.verdict)!==JSON.stringify(next.verdict))throw Error('HOLDOUT_REEVALUATION_DRIFT');}
 else{
  // Derive permitted verdict changes from the otherwise byte-identical checks.
  const checks=next.checks,safety=checks.filter(c=>c.severity==='S0'),s0=safety.filter(c=>c.status==='FAIL'),unknown=safety.some(c=>c.status==='NOT_EVALUATED');
  const pendingMeaning=checks.some(c=>c.status==='QUOTE_VERIFIED_MEANING_PENDING_REVIEW'),failed=checks.some(c=>c.status==='FAIL'),unboundedEnd=!input.delivered.length&&input.boundedNoResult!==true&&!input.executionFailure;
  const unresolved=checks.filter(c=>c.status!=='PASS'),pendingReview=!input.executionFailure&&input.delivered.length>0&&unresolved.length>0&&unresolved.every(c=>c.rule==='COMPLETE_REQUEST_QUALIFICATION'&&c.reviewReason==='INDEPENDENT_QUALIFICATION_ANNOTATION_MISSING'&&(c.status==='NOT_EVALUATED'||c.status==='QUOTE_VERIFIED_MEANING_PENDING_REVIEW'));
  const unassessed=unknown||unboundedEnd||pendingMeaning;
  const expected={status:pendingReview?'PENDING_REVIEW':unassessed?'NOT_EVALUATED':'EVALUATED',qualified:unassessed?null:!input.executionFailure&&!failed&&input.delivered.length>0,outcome:unassessed?null:input.executionFailure?'PLANNED_RUN_FAILED':input.delivered.length?(failed?'DELIVERED_UNQUALIFIED':'QUALIFIED_DELIVERY'):checks.some(c=>c.rule==='NO_DELIVERY_WITNESS'&&c.status==='FAIL')?'CAPABILITY_MISS':'HONEST_NO_RESULT',s0:s0.length,s0Status:s0.length?'FAIL':unknown||pendingReview?'NOT_EVALUATED':'PASS',stopBatch:s0.length>0||checks.some(c=>c.status==='NOT_EVALUATED')&&!pendingReview};
  if(next.verdict.s0!==previous.verdict.s0-changed.length||JSON.stringify(next.verdict)!==JSON.stringify(expected))throw Error('HOLDOUT_REEVALUATION_DRIFT');
 }
 return changed;
}
/** Immutable original inputs/scores; derived files live outside review-bound slots. */
export async function reevaluateSavedHoldout(root:string,state:HoldoutCheckpoint,sourceSHA:string,transform:(v:unknown)=>unknown,save:()=>Promise<void>){
 const saved=(await readJSON<HoldoutRunAudit>(join(root,'input-hashes.json')))!;
 if(saved.sourceSHA===sourceSHA)return;
 const changed=execFileSync('git',['diff','--name-only',saved.sourceSHA,sourceSHA,'--','src/eval/restaurant/agent-loop/g6/evaluator.ts'],{cwd:root,encoding:'utf8'}).trim();
 if(!changed)return;
 const evaluatorSHA256=holdoutHash(await readFile(new URL('./evaluator.ts',import.meta.url)));
 const pending:Array<{attempt:HoldoutAttempt;score:G6Evaluation;row:NonNullable<HoldoutCheckpoint['reevaluations']>[number]}> = [];
 for(const attempt of state.receipts){
  const slot=join(attempt.path,attempt.key),originalPath=join(slot,'evaluation.json'),original=await readJSON<G6Evaluation>(originalPath);if(!original)continue;
  const originalHash=holdoutHash(await readFile(originalPath));if(attempt.evaluationSHA256&&attempt.evaluationSHA256!==originalHash)throw Error('HOLDOUT_EVALUATION_CHANGED');
  const recorded=state.reevaluations?.find(r=>r.key===attempt.key);
  if(recorded){
   if(recorded.evaluatorSHA256!==evaluatorSHA256||holdoutHash(await readFile(join(attempt.path,'evaluation.reevaluated.json')))!==recorded.newSHA256||holdoutHash(await readFile(join(slot,attempt.review&&recorded.originalSHA256!==originalHash?'evaluation.supplement.input.json':'evaluation.input.json')))!==recorded.inputSHA256)throw Error('HOLDOUT_REEVALUATION_CHANGED');
   continue;
  }
  const review=await checkSavedReview(attempt),inputPath=join(slot,review?'evaluation.supplement.input.json':'evaluation.input.json'),inputBytes=await readFile(inputPath),input=JSON.parse(inputBytes.toString()) as G6EvaluationInput;
  const previous=review??original,next=evaluateG6(input),changedChecks=checkHTTPReevaluation(input,previous,next);
  const originalSHA256=review?attempt.review!.evaluationSHA256!:originalHash,newSHA256=holdoutHash(JSON.stringify(transform(next),null,2)+'\n');
  pending.push({attempt,score:next,row:{key:attempt.key,originalSHA256,newSHA256,inputSHA256:holdoutHash(inputBytes),evaluatorSHA256,changedChecks}});
 }
 for(const {attempt,score,row} of pending){await writeFile(join(attempt.path,'evaluation.reevaluated.json'),JSON.stringify(transform(score),null,2)+'\n',{flag:'wx',mode:0o600});(state.reevaluations??=[]).push(row);}
 const scores=await Promise.all((state.reevaluations??[]).map(r=>readJSON<G6Evaluation>(join(state.receipts.find(a=>a.key===r.key)!.path,'evaluation.reevaluated.json'))));
 if(scores.length&&scores.every(s=>s?.verdict.s0===0)&&state.reevaluations?.some(r=>r.changedChecks.length)){
  if(state.status==='FAILED_S0')delete state.status;
  if(state.stopReason==='S0_STOP')state.stopReason=null;
 }
 await save();
}
/** Special case: the immutable original S0 has already passed audited re-evaluation.
 * The review uses the same annotation contract and evidence hash as existing reviews. */
async function reviewReevaluatedHoldout(attempt:HoldoutAttempt,option:HoldoutReviewOption,transform:(v:unknown)=>unknown,save:()=>Promise<void>){
 const prior=await checkSavedReview(attempt);if(prior)return prior;
 const slot=join(attempt.path,attempt.key),effective=(await readJSON<G6Evaluation>(join(attempt.path,'evaluation.reevaluated.json')))!;
 if(!effective||effective.verdict.s0)throw Error('HOLDOUT_S0_RESUME_FORBIDDEN');
 const file=await externalReviewFile(option.file),bytes=await readFile(file),sha256=holdoutHash(bytes),document=JSON.parse(bytes.toString()) as HoldoutReview;
 if(attempt.review&&(attempt.review.file!==file||attempt.review.sha256!==sha256))throw Error('HOLDOUT_REVIEW_FILE_CHANGED');
 if(document.schema!=='phase3b-holdout-review@1'||document.attemptKey!==attempt.key||Object.keys(document).some(k=>!['schema','attemptKey','annotations'].includes(k))||!document.annotations||typeof document.annotations!=='object'||Array.isArray(document.annotations)||Object.keys(document.annotations).some(k=>!['qualificationOracles','questions','priceOracles'].includes(k)))throw Error('HOLDOUT_REVIEW_INVALID');
 const items:Array<[string,string]>=[];
 async function walk(dir:string){for(const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){if(item.name.startsWith('evaluation.supplement.')||item.name==='review-receipt.json')continue;const path=join(dir,item.name);if(item.isSymbolicLink())throw Error('HOLDOUT_REVIEW_EVIDENCE_SYMLINK');if(item.isDirectory())await walk(path);else if(item.isFile())items.push([relative(slot,path),holdoutHash(await readFile(path))]);}}
 await walk(slot);attempt.review??={file,sha256,evidenceSHA256:holdoutHash(JSON.stringify(items))};await save();
 const original=(await readJSON<G6EvaluationInput>(join(slot,'evaluation.input.json')))!;
 const input=(await supplementRecordedQualification(slot,original)).input;Object.assign(input,document.annotations);const score=evaluateG6(input);
 await writeFile(join(slot,'evaluation.supplement.input.json'),JSON.stringify(transform(input),null,2)+'\n',{flag:'wx',mode:0o600});
 const output=JSON.stringify(transform(score),null,2)+'\n';attempt.review.evaluationSHA256=holdoutHash(output);await save();await writeFile(join(slot,'evaluation.supplement.json'),output,{flag:'wx',mode:0o600});return score;
}

/** Serial immutable attempts. Resume reuses completed scores, not their Live.
 * Only explicit environmental failures authorize replacement attempts. */
export async function runPrivateHoldout(manifest:PrivateHoldoutManifest,audit:HoldoutRunAudit,directory:string,deps:HoldoutDependencies,options:{resume?:boolean;review?:HoldoutReviewOption;reviews?:HoldoutReviewOption[]}={}){
 if(manifest.cases.length*3>18||new Set(manifest.cases.map(c=>c.id)).size!==manifest.cases.length)throw Error('HOLDOUT_PLANNED_SLOT_LIMIT');
 if(manifest.cases.some(c=>Object.hasOwn(c.oracle,'reviewedReadRules')))throw Error('HOLDOUT_MANIFEST_READ_RULES_FORBIDDEN');
 const reviews=[...(options.review?[options.review]:[]),...(options.reviews??[])];
 if(new Set(reviews.map(r=>r.key)).size!==reviews.length)throw Error('HOLDOUT_REVIEW_ARGUMENTS_INVALID');
 if(reviews.length&&!options.resume)throw Error('HOLDOUT_REVIEW_REQUIRES_RESUME');
 const rules=await frozenHoldoutReadRules();await mkdir(resolve(directory),{recursive:true});const root=await realpath(resolve(directory)),unlock=await holdoutLock(root);
 const privacy=privateInputRedactor(manifest.cases.flatMap(c=>[c.request,...c.followups.map(f=>f.text)]));
 let state:HoldoutCheckpoint={schema:'phase3b-holdout-batch@2',serial:true,stopReason:null,witnessPolicies:manifest.cases.map(c=>({id:c.id,policy:c.witness.allowKnownUnavailableCertificate===true?'ALLOW_KNOWN_UNAVAILABLE':'POSITIVE_REQUIRED'})),receipts:[],healthyCases:[]};
 let bound=false,ledgerPath=deps.g6.budgetPath;
 try{
  if(!options.resume&&await readJSON(join(root,'input-hashes.json')))throw Error('HOLDOUT_RESUME_REQUIRED');
  const budget=await bindHoldoutLedger(deps.g6.budgetPath,options.resume??false,root);
  ledgerPath=budget.path;
  if(options.resume)state=await checkResumeIdentity(root,audit,budget);
  else await writeFile(join(root,'input-hashes.json'),JSON.stringify({...audit,budget},null,2)+'\n',{flag:'wx',mode:0o600});
  bound=true;const save=()=>saveHoldoutCheckpoint(root,state,budget.path,privacy);
  if(!options.resume)await save();
  if(options.resume)await reevaluateSavedHoldout(root,state,audit.sourceSHA,privacy,save);
  const recordCertification=async(attempt:HoldoutAttempt)=>{
   const slot=join(attempt.path,attempt.key);
   const value=await readJSON<{certificationMode?:HoldoutAttempt['certificationMode'];witnessExists?:boolean|null}>(join(slot,'execution.result.json'))
     ??await readJSON<{certificationMode?:HoldoutAttempt['certificationMode'];witnessExists?:boolean|null}>(join(slot,'failure.json'));
   if(value?.certificationMode)attempt.certificationMode=value.certificationMode;
   if(typeof value?.witnessExists==='boolean'||value?.witnessExists===null)attempt.witnessExists=value.witnessExists;
  };
  const evaluation=async(attempt:HoldoutAttempt)=>{
   const file=join(attempt.path,attempt.key,'evaluation.json'),value=await readJSON<{verdict:{s0:number;stopBatch:boolean;qualified?:boolean|null;status?:string}}>(file);
   if(value){const hash=holdoutHash(await readFile(file));if(attempt.evaluationSHA256&&hash!==attempt.evaluationSHA256)throw Error('HOLDOUT_EVALUATION_CHANGED');attempt.evaluationSHA256=hash;
    if(!value.verdict||!Number.isFinite(value.verdict.s0)||typeof value.verdict.stopBatch!=='boolean')throw Error('HOLDOUT_EVALUATION_INVALID');
   }const rerun=state.reevaluations?.find(r=>r.key===attempt.key);
   if(rerun){const file=join(attempt.path,'evaluation.reevaluated.json');if(holdoutHash(await readFile(file))!==rerun.newSHA256)throw Error('HOLDOUT_REEVALUATION_CHANGED');return (await readJSON<G6Evaluation>(file))!;}
   return value;
  };
  if(reviews.some(r=>!state.receipts.some(a=>a.key===r.key)))throw Error('HOLDOUT_REVIEW_ATTEMPT_UNKNOWN');
  // Recover an evaluation written just before an orchestrator interruption.
  // Any S0 found on disk blocks resume even when its checkpoint was not saved.
  for(const a of state.receipts){
   await recordCertification(a);
   const e=await evaluation(a);if(e?.verdict.s0){state.status='FAILED_S0';state.stopReason='S0_STOP';await save();throw Error('HOLDOUT_S0_RESUME_FORBIDDEN');}
   let reviewed=await checkSavedReview(a);
   const review=reviews.find(r=>r.key===a.key);
   if(review){
    if(e&&!e.verdict.stopBatch&&e.verdict.status!=='PENDING_REVIEW'&&a.status!=='EVALUATED_BY_REVIEW')throw Error('HOLDOUT_REVIEW_ATTEMPT_NOT_STOPPED');
    if(!e&&!await holdoutLiveCharged(budget.path,a.key))throw Error('HOLDOUT_REVIEW_ATTEMPT_NOT_CHARGED');
    reviewed=state.reevaluations?.some(r=>r.key===a.key)&&((await readJSON<G6Evaluation>(join(a.path,a.key,'evaluation.json')))?.verdict.s0??0)>0
     ?await reviewReevaluatedHoldout(a,review,privacy,save):await reviewHoldoutAttempt(a,review,privacy,save);
   }
   if(reviewed){
    if(reviewed.verdict.s0){state.status='FAILED_S0';state.stopReason='S0_STOP';await save();throw Error('HOLDOUT_S0_RESUME_FORBIDDEN');}
    if(reviewed.verdict.status==='PENDING_REVIEW'&&!reviewed.verdict.stopBatch){a.status='PENDING_REVIEW';continue;}
    if(reviewed.verdict.stopBatch||reviewed.verdict.status!=='EVALUATED')throw Error('HOLDOUT_INDEPENDENT_EVIDENCE_REVIEW_REQUIRED');
    a.status='EVALUATED_BY_REVIEW';continue;
   }
   const environmental=(!e||e.verdict.qualified===false)&&await recordedEnvironmentFailure(join(a.path,a.key));
   if(environmental||a.status==='ENVIRONMENT_FAILURE')a.status='ENVIRONMENT_FAILURE';
   else if(e)a.status=e.verdict.stopBatch?'STOPPED':e.verdict.status==='PENDING_REVIEW'?'PENDING_REVIEW':'EVALUATED';
   else if(await holdoutLiveCharged(budget.path,a.key))throw Error('HOLDOUT_CHARGED_ATTEMPT_NEEDS_REVIEW');
   else if(a.status==='STARTED')a.status='INTERRUPTED';
  }
  for(const a of state.receipts)if(!['EVALUATED','EVALUATED_BY_REVIEW','PENDING_REVIEW'].includes(a.status)&&!state.receipts.some(b=>b.id===a.id&&b.repetition===a.repetition&&['EVALUATED','EVALUATED_BY_REVIEW','PENDING_REVIEW'].includes(b.status)))state.healthyCases=state.healthyCases.filter(id=>id!==a.id);
  if(state.status==='FAILED_S0'||state.stopReason==='S0_STOP')throw Error('HOLDOUT_S0_RESUME_FORBIDDEN');
  if(state.receipts.some(a=>a.status==='STOPPED'))throw Error('HOLDOUT_INDEPENDENT_EVIDENCE_REVIEW_REQUIRED');
  state.stopReason=null;
  const now=deps.now??Date.now,wait=deps.wait??(ms=>new Promise(r=>setTimeout(r,ms)));
  const timingLedger=(await readJSON<{entries:Array<{evaluationPublicGET?:number;recordedAtUTC?:string}>}>(budget.path))!;
  let lastGET=Math.max(-Infinity,...timingLedger.entries.filter(e=>e.evaluationPublicGET===1).map(e=>Date.parse(e.recordedAtUTC??'')).filter(Number.isFinite));
  const interval=async()=>{const remaining=5000-(now()-lastGET);if(remaining>0)await wait(remaining);};
  outer:for(const item of manifest.cases){
   let healthy=state.healthyCases.includes(item.id);
   // Completed r1 proves that this case already passed health. A resumption
   // at a later slot performs health again after an interruption.
   for(const repetition of [1,2,3]){
    const prior=state.receipts.filter(a=>a.id===item.id&&a.repetition===repetition);
    if(prior.some(a=>['EVALUATED','EVALUATED_BY_REVIEW','PENDING_REVIEW'].includes(a.status)))continue;
    const previous=prior.at(-1),replacement=prior.some(a=>a.status==='ENVIRONMENT_FAILURE');
    const planKey=`${item.id}-r${repetition}`;
    const environmentIndex=state.receipts.filter(a=>a.id===item.id&&a.repetition===repetition&&a.environmentReplacement).length+1;
    const key=prior.length?replacement?`${planKey}-env${environmentIndex}`:`${planKey}-retry${prior.length}`:planKey;
    const reusableTicket=previous?.environmentChargeId&&!await holdoutLiveCharged(budget.path,previous.key)?previous.environmentChargeId:undefined;
    const environmentChargeId=replacement?(reusableTicket??key+':ENVIRONMENT_REPLACEMENT'):undefined;
    const ticketPaid=async()=>{const ledger=(await readJSON<{entries:Array<{id:string;environmentReruns?:number}>;cumulative:{environmentReruns:number};limits:{environmentReruns:number}}>(budget.path))!;return {paid:ledger.entries.some(e=>e.id===environmentChargeId&&e.environmentReruns===1),remaining:ledger.limits.environmentReruns-ledger.cumulative.environmentReruns};};
    if(replacement){const ticket=await ticketPaid();if(!ticket.paid&&ticket.remaining<=0)throw Error('HOLDOUT_ENVIRONMENT_RETRY_LIMIT');}
    const attempt:HoldoutAttempt={id:item.id,repetition,key,path:join(root,key),status:'STARTED',environmentReplacement:replacement,...(environmentChargeId?{environmentChargeId}:{})};
    state.receipts.push(attempt);await save();await mkdir(attempt.path,{recursive:false});
    const previousFinishedAtMs=Math.max(-Infinity,...state.receipts.filter(a=>a!==attempt&&a.finishedAtMs!==undefined).map(a=>a.finishedAtMs!));
    if(deps.startDelayMs&&Number.isFinite(previousFinishedAtMs)){
     const delayMs=deps.startDelayMs();if(!Number.isSafeInteger(delayMs)||delayMs<120_000||delayMs>240_000)throw Error('HOLDOUT_START_SPACING_INVALID');
     const waitMs=Math.max(0,previousFinishedAtMs+delayMs-now()),started=now();
     attempt.startSpacing={delayMs,waitedMs:0,previousFinishedAtMs};await save();
     if(waitMs>0)await wait(waitMs);
     attempt.startSpacing.waitedMs=now()-started;
     await writeFile(join(attempt.path,'start-spacing.json'),JSON.stringify(attempt.startSpacing,null,2)+'\n',{flag:'wx'});await save();
    }
    const spec:G6Case={id:key,request:item.request,oracle:{...structuredClone(item.oracle),reviewedReadRules:structuredClone(rules)},witness:item.witness,followups:item.followups.map(f=>({id:f.id,kind:f.kind,text:f.text,trigger:f.condition.type==='PRESENTED_ANY'?'DISPLAYED_RESULTS':f.condition.type==='PRESENTED_WITH_SLOT'?'DISPLAYED_AVAILABLE':f.condition.type,...(f.condition.type==='TARGET_PRESENTED_WITH_SLOT'?{target:f.condition.target,...(f.condition.time?{time:f.condition.time}:{})}:{}),...(f.allowOtherOutlets?{allowOtherOutlets:true}:{})}))};
    if(!healthy||previous){
     const health=await deps.health(spec,async(source,round)=>{await interval();await chargeG6(budget.path,`${key}:HEALTH:${round}:${source}`,'evaluationPublicGET','Held-out health per case/recovery, two rounds, no Live/model');lastGET=now();});
     await writeFile(join(attempt.path,'network-health.json'),JSON.stringify(health,null,2)+'\n',{flag:'wx'});
     if(!health.passed){state.healthyCases=state.healthyCases.filter(id=>id!==item.id);attempt.status='CANCELLED_BEFORE_LIVE';state.stopReason='NETWORK_HEALTH_FAILED';await save();break outer;}
     healthy=true;if(!state.healthyCases.includes(item.id))state.healthyCases.push(item.id);await save();
    }
    await interval();
    const pack:G6Pack={schemaVersion:'phase3b-g6-pack@1',mode:'LIVE_READ',recording:{browser:true,decisions:true,googleResponses:true},cases:[spec]};
    const batch=await (deps.execute??runG6Batch)(pack,{...deps.g6,budgetPath:budget.path,maximumWitnessGETs:3,witnessDetailRead:false,artifactTransform:privateInputRedactor([item.request,...item.followups.map(f=>f.text)]),beforeLive:async()=>{if(environmentChargeId&&!(await ticketPaid()).paid)await chargeG6(budget.path,environmentChargeId,'environmentReruns','Approved replacement Live after explicit environment failure; original retained');}},attempt.path);
    attempt.finishedAtMs=now();
    await recordCertification(attempt);
    const e=await evaluation(attempt);
    if(e?.verdict.s0){attempt.status='STOPPED';state.status='FAILED_S0';state.stopReason='S0_STOP';await save();break outer;}
    const environmental=(!e||e.verdict.qualified===false)&&await recordedEnvironmentFailure(join(attempt.path,key));
    if(environmental){state.healthyCases=state.healthyCases.filter(id=>id!==item.id);attempt.status='ENVIRONMENT_FAILURE';state.stopReason='ENVIRONMENT_FAILURE_AFTER_HEALTH';await save();break outer;}
    if(e){attempt.status=e.verdict.stopBatch?'STOPPED':e.verdict.status==='PENDING_REVIEW'?'PENDING_REVIEW':'EVALUATED';state.stopReason=e.verdict.stopBatch?'INDEPENDENT_EVIDENCE_REVIEW_REQUIRED':null;}
    else{attempt.status='INTERRUPTED';state.stopReason=privacy(batch.stopReason??'INDEPENDENT_EVALUATION_MISSING') as string;}
    await save();if(state.stopReason)break outer;lastGET=now();
   }
  }
  await save();return state;
 }catch(error){
  if(bound){state.stopReason=error instanceof Error&&/^HOLDOUT_[A-Z_]+$/u.test(error.message)?error.message:'HOLDOUT_RUN_INTERRUPTED';await saveHoldoutCheckpoint(root,state,ledgerPath,privacy);}
  throw error;
 }finally{await unlock();}
}
