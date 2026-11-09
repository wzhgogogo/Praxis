import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
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
 /** Local-construction seam only; Live CLI always uses ordinary runG6Batch. */
 execute?:typeof runG6Batch;
 now?:()=>number;wait?:(ms:number)=>Promise<void>;
}
/** Exactly three attempts per committed case, serial and no automatic retries.
 * Health failures cancel before Live. Post-health source failures are counted
 * against the four environment failures, then stop for review. */
export async function runPrivateHoldout(manifest:PrivateHoldoutManifest,audit:unknown,directory:string,deps:HoldoutDependencies){
 const privacy=privateInputRedactor(manifest.cases.flatMap(c=>[c.request,...c.followups.map(f=>f.text)]));
 const serialize=(value:unknown)=>JSON.stringify(privacy(value),null,2);
 const root=resolve(directory);await mkdir(root,{recursive:true});
 await writeFile(join(root,'input-hashes.json'),JSON.stringify(audit,null,2)+'\n',{flag:'wx',mode:0o600});
 const receipts:Array<{id:string;repetition:number;status:string;evaluation?:unknown}>=[];
 let stopReason:string|null=null,lastGET=-Infinity;
 const now=deps.now??Date.now,wait=deps.wait??(ms=>new Promise(r=>setTimeout(r,ms)));
 outer:for(const item of manifest.cases)for(const repetition of [1,2,3]){
  const key=`${item.id}-r${repetition}`,directory=join(root,key);await mkdir(directory,{recursive:false});
  const spec:G6Case={id:key,request:item.request,oracle:item.oracle,witness:item.witness,followups:item.followups.map(f=>({id:f.id,kind:f.kind,text:f.text,trigger:f.condition.type==='PRESENTED_ANY'?'DISPLAYED_RESULTS':f.condition.type==='PRESENTED_WITH_SLOT'?'DISPLAYED_AVAILABLE':f.condition.type,...(f.condition.type==='TARGET_PRESENTED_WITH_SLOT'?{target:f.condition.target,...(f.condition.time?{time:f.condition.time}:{})}:{}),...(f.allowOtherOutlets?{allowOtherOutlets:true}:{})}))};
  const beforeHealthGET=async(source:string,round:number)=>{
   const remaining=5000-(now()-lastGET);if(remaining>0)await wait(remaining);
   await chargeG6(deps.g6.budgetPath,`${key}:HEALTH:${round}:${source}`,'evaluationPublicGET','User approved 2026-11-09: browser health, one source page, no Live/model');lastGET=now();
  };
  const health=await deps.health(spec,beforeHealthGET);await writeFile(join(directory,'network-health.json'),JSON.stringify(health,null,2)+'\n',{flag:'wx'});
  if(!health.passed){receipts.push({id:item.id,repetition,status:'CANCELLED_BEFORE_LIVE'});stopReason='NETWORK_HEALTH_FAILED';break outer;}
  // No source/model transport is constructed before commitment/manifest checks.
  const pack:G6Pack={schemaVersion:'phase3b-g6-pack@1',mode:'LIVE_READ',recording:{browser:true,decisions:true,googleResponses:true},cases:[spec]};
  const remaining=5000-(now()-lastGET);if(remaining>0)await wait(remaining);
  const batch=await (deps.execute??runG6Batch)(pack,{...deps.g6,maximumWitnessGETs:3,witnessDetailRead:false,
   artifactTransform:privateInputRedactor([item.request,...item.followups.map(f=>f.text)])},directory);
  const slot=batch.slots[0];let evaluation:unknown;
  if(slot){try{evaluation=JSON.parse(await readFile(join(slot.path,'evaluation.json'),'utf8'));}catch{/* Missing independent evidence stops, never becomes a pass. */}}
  receipts.push({id:item.id,repetition,status:slot?.status??'FAILED',...(evaluation?{evaluation}:{})});
  await writeFile(join(root,'batch.json'),serialize({serial:true,receipts,stopReason:batch.stopReason})+'\n');
  const verdict=(evaluation as {verdict?:{qualified?:boolean;s0:number;stopBatch:boolean}}|undefined)?.verdict;
  if(!verdict?.s0&&(!evaluation||verdict?.qualified===false)&&slot&&await recordedEnvironmentFailure(slot.path)){
   await chargeG6(deps.g6.budgetPath,key+':ENVIRONMENT_FAILURE','environmentReruns','Explicit transport failure after passing health; stopped, no automatic replacement Live');
   stopReason='ENVIRONMENT_FAILURE_AFTER_HEALTH';break outer;
  }
  if(batch.stopReason){stopReason=privacy(batch.stopReason) as string;break outer;}
  if(!evaluation){stopReason='INDEPENDENT_EVALUATION_MISSING';break outer;}
  if(!verdict||verdict.s0||verdict.stopBatch){stopReason=verdict?.s0?'S0_STOP':'INDEPENDENT_EVIDENCE_REVIEW_REQUIRED';break outer;}
  lastGET=now();
 }
 const result={schema:'phase3b-holdout-batch@1',serial:true,stopReason,receipts};
 await writeFile(join(root,'batch.json'),serialize(result)+'\n');return result;
}
