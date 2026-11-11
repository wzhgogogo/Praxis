/** User 2026-11-11: exposed development invocations only. Separate one-case
 * batches record missing qualification/G1 annotations separately. Scores stay
 * immutable; S0/environment/unknown failures still stop. No product changes. */
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomInt} from 'node:crypto';
import {holdoutHash} from '../holdout-protocol.js';
import {frozenHoldoutReadRules,recordedEnvironmentFailure} from './holdout-runner.js';
import {runG6Batch,type G6Case} from './runner.js';
import {liveG6Dependencies,createG6LiveBrowser} from './live-transports.js';
import {checkHoldoutNetwork} from './holdout-health.js';
import {createWitnessReader,type WitnessReceipt} from './witness.js';
import {chargeG6} from './budget.js';
import {sanitizePublicJson} from '../runners/browser-read-recording.js';
import {GooglePlacesHarCapture} from '../runners/google-places-recording.js';
import type {G6Evaluation} from './evaluator.js';
export function developmentReviewOnly(e:G6Evaluation){
 const missing=e.checks.filter(c=>c.status!=='PASS');
 return e.verdict.s0===0&&missing.length>0&&missing.every(c=>
  (c.rule==='COMPLETE_REQUEST_QUALIFICATION'&&c.reviewReason==='INDEPENDENT_QUALIFICATION_ANNOTATION_MISSING'&&(c.status==='NOT_EVALUATED'||c.status==='QUOTE_VERIFIED_MEANING_PENDING_REVIEW'))
  ||c.rule==='G1_NOT_STATED'&&c.status==='NOT_EVALUATED');
}
/** User2026-11-11: the new prior batch may contain only the two 07 checks;
 * the reviewed 03 checks remain in the original immutable development batch. */
export function seedPriorReviewed(prior:{status?:string;receipts:Array<{key:string;status:string}>}){
 const reviewed03=prior.receipts.some(r=>r.key==='p3b-holdout-03-r2'&&r.status==='EVALUATED_BY_REVIEW');
 const only07=prior.receipts.length===2&&['p3b-holdout-07-r1','p3b-holdout-07-r2'].every(key=>prior.receipts.some(r=>r.key===key&&['EVALUATED','EVALUATED_BY_REVIEW','PENDING_REVIEW'].includes(r.status)));
 return prior.status!=='FAILED_S0'&&(reviewed03||only07);
}
export function d02vSpec(id:string):G6Case{return {id,request:'Looking for a robatayaki place near Nakano for 8 people on Thursday, December 10 at 8:30 PM.',followups:[],
 oracle:{request:{dates:['2026-12-10'],time:'20:30',partySize:8,requiresIndependentQualification:true},pages:[],qualificationOracles:[]},
 witness:{candidateId:'witness-D02V',name:'Nakano Robata Sumika',provider:'TABELOG',sourceEntityId:'13309182',date:'2026-12-10',time:'20:30',partySize:8,
 detailUrl:'https://tabelog.com/en/tokyo/A1319/A131902/13309182/',identityText:['Sumika']}};}
export function seedInvocation(mode:string,entries:readonly {recordedAtUTC?:string}[],previousFinishedAtMs:number,at=Date.now()){
 const latestLedgerAtMs=Math.max(0,...entries.map(e=>Date.parse(e.recordedAtUTC??'')).filter(Number.isFinite));
 return {attemptId:'seed:'+mode+':'+at,previousFinishedAtMs:Math.max(previousFinishedAtMs,latestLedgerAtMs)};
}
export async function main(args:string[]){
 const flag=(n:string)=>{const i=args.indexOf(n);if(i<0||!args[i+1])throw Error('MISSING_ARGUMENT');return args[i+1]!;};
 const mode=flag('--case');if(!['D02V-r1','D02V-r2'].includes(mode))throw Error('SEED_CASE_NOT_AUTHORIZED');
 const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(sourceSHA!==flag('--source-sha')||execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
 const rules=await frozenHoldoutReadRules(),spec=d02vSpec('dev-d02v-paging-'+mode.slice(-2));
 spec.oracle.reviewedReadRules=rules;
 const audit={sourceSHA,mode,caseSHA256:holdoutHash(JSON.stringify(spec)),reviewedReadRulesSHA256:holdoutHash(JSON.stringify(rules)),productBaseSHA:'ead289450092ccc30798b754d1e0771462bf08bd'};
 if(args.includes('--validate-only')){console.log(JSON.stringify(audit));return;}
 if(process.env.PRAXIS_RUN_SEED_REMAINING!=='1'||!process.execArgv.some(a=>a.startsWith('--env-file')))throw Error('AUTHORIZATION_AND_ENV_FILE_REQUIRED');
 const budgetPath=resolve(flag('--budget')),ledger=JSON.parse(await readFile(budgetPath,'utf8'));
 if(ledger.status!=='APPROVED_FOR_EXECUTION'||ledger.limits.fullLive!==40||ledger.limits.evaluationPublicGET!==220||ledger.limits.realModelCalls!==2800||ledger.limits.environmentReruns!==4||ledger.cumulative.fullLive>=40||ledger.cumulative.evaluationPublicGET+7>220||ledger.cumulative.realModelCalls+50>2800)throw Error('SEED_BUDGET_INSUFFICIENT');
 const priorRoot=resolve(flag('--prior-root')),prior=JSON.parse(await readFile(join(priorRoot,'batch.json'),'utf8'));
 if(!seedPriorReviewed(prior))throw Error('SEED_PRIOR_REVIEW_REQUIRED');
 for(const r of prior.receipts){const p=join(r.path,r.key),e=await readFile(join(p,'evaluation.json'),'utf8').then(t=>JSON.parse(t)).catch(()=>null);
  if(r.status==='ENVIRONMENT_FAILURE'||r.status==='CANCELLED_BEFORE_LIVE'||e?.verdict.s0)throw Error('SEED_PRIOR_STOP_OR_DUPLICATE');
  if(r.key.startsWith('p3b-holdout-07-')&&(!e||e.verdict.stopBatch&&!developmentReviewOnly(e)))throw Error('SEED_PRIOR_STOP_REQUIRES_REVIEW');
 }
 if(prior.receipts.filter((r:{key:string})=>r.key.startsWith('p3b-holdout-07-')).length!==2)throw Error('SEED_07_NOT_COMPLETE');
 let previousFinishedAtMs=Math.max(0,...prior.receipts.map((r:{finishedAtMs?:number})=>r.finishedAtMs??0));
 if(mode==='D02V-r2'){
  const previous=JSON.parse(await readFile(join(resolve(flag('--previous')),'development-receipt.json'),'utf8'));
  if(previous.mode!=='D02V-r1'||previous.sourceSHA!==sourceSHA||previous.stopReason)throw Error('SEED_PREVIOUS_STOP_OR_MISMATCH');
  previousFinishedAtMs=Math.max(previousFinishedAtMs,previous.finishedAtMs);
 }
 const invocation=seedInvocation(mode,ledger.entries,previousFinishedAtMs);
 const {attemptId}=invocation;previousFinishedAtMs=invocation.previousFinishedAtMs;
 const directory=resolve(flag('--output'));await mkdir(directory,{recursive:false});
 await writeFile(join(directory,'input-hashes.json'),JSON.stringify({...audit,attemptId},null,2)+'\n',{flag:'wx'});
 const delayMs=randomInt(120_000,240_001),waitedMs=Math.max(0,delayMs-(Date.now()-previousFinishedAtMs));
 await writeFile(join(directory,'start-spacing.json'),JSON.stringify({delayMs,waitedMs,previousFinishedAtMs})+'\n');
 if(waitedMs)await new Promise(r=>setTimeout(r,waitedMs));
 const deps=liveG6Dependencies(process.env,budgetPath),timing={last:Math.max(-Infinity,...ledger.entries.filter((e:{evaluationPublicGET?:number})=>e.evaluationPublicGET===1).map((e:{recordedAtUTC:string})=>Date.parse(e.recordedAtUTC)).filter(Number.isFinite))};
 const pace=async()=>{const ms=5000-(Date.now()-timing.last);if(ms>0)await new Promise(r=>setTimeout(r,ms));timing.last=Date.now();};
 const initialWitnesses:WitnessReceipt[]=[];
 {
  const capture=new GooglePlacesHarCapture(()=>{});capture.registerCredentials(deps.ownCredentials??[]);
  const reader=createWitnessReader({directory:join(directory,'certification'),budgetPath,runId:attemptId,fetch:deps.witnessFetch,requestTiming:timing,
   sanitizeResponse:text=>{if(!capture.accept(text,'RESPONSE')||capture.rejectsRecording)return;return sanitizePublicJson(text);}});
  const receipt=await reader.read(spec.witness!,'BEFORE',false);initialWitnesses.push(receipt);
  await writeFile(join(directory,'certified-selection.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
  if(receipt.exists!==true)throw Error('SEED_WITNESS_NOT_AVAILABLE');
 }
 const health=await checkHoldoutNetwork({browser:createG6LiveBrowser(process.env),tabelogDetailUrl:spec.witness!.detailUrl,beforeGET:async(source,round)=>{await pace();await chargeG6(budgetPath,attemptId+':HEALTH:'+source+':'+round,'evaluationPublicGET','User2026-11-11 development health, unchanged60s window');}});
 await writeFile(join(directory,'network-health.json'),JSON.stringify(health,null,2)+'\n',{flag:'wx'});
 if(!health.passed)throw Error('NETWORK_HEALTH_FAILED');
 const witnessFetch=deps.witnessFetch;deps.witnessFetch=async(...a)=>{await pace();return witnessFetch(...a);};
 const batch=await runG6Batch({schemaVersion:'phase3b-g6-pack@1',mode:'LIVE_READ',recording:{browser:true,decisions:true,googleResponses:true},cases:[spec]},
 {...deps,witnessDetailRead:false,maximumWitnessGETs:3,...(initialWitnesses.length?{initialWitnesses,initialWitnessGETs:1}:{})},join(directory,'runtime'));
 const slot=join(directory,'runtime',spec.id),e=await readFile(join(slot,'evaluation.json'),'utf8').then(t=>JSON.parse(t)as G6Evaluation).catch(()=>null);
 const environment=await recordedEnvironmentFailure(slot),reviewOnly=!!e&&developmentReviewOnly(e);
 const stop=e?.verdict.s0?'S0_STOP':environment?'ENVIRONMENT_FAILURE_AFTER_HEALTH':!e?'INDEPENDENT_EVALUATION_MISSING':e.verdict.stopBatch&&!reviewOnly?'INDEPENDENT_EVIDENCE_REVIEW_REQUIRED':null;
 const summary={sourceSHA,mode,attemptId,finishedAtMs:Date.now(),originalBatch:batch,developmentStatus:reviewOnly?'PENDING_REVIEW':e?.verdict.status??'MISSING',evaluationUnchanged:true,stopReason:stop,verdict:e?.verdict??null};
 await writeFile(join(directory,'development-receipt.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(summary));if(stop)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main(process.argv.slice(2)).catch(()=>{console.error('Seed development stopped. Inspect structured evidence; private input and credentials omitted.');process.exitCode=1;});
