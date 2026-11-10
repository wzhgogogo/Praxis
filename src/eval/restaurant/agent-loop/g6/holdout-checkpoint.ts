import {readFile,writeFile,rename,realpath,open,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {holdoutHash} from '../holdout-protocol.js';
export interface HoldoutRunAudit {originalSHA256:string;manifestSHA256:string;sourceSHA:string;[key:string]:unknown;}
export interface HoldoutAttempt {id:string;repetition:number;key:string;path:string;finishedAtMs?:number;startSpacing?:{delayMs:number;waitedMs:number;previousFinishedAtMs:number};status:'STARTED'|'CANCELLED_BEFORE_LIVE'|'EVALUATED'|'EVALUATED_BY_REVIEW'|'ENVIRONMENT_FAILURE'|'INTERRUPTED'|'STOPPED'|'PENDING_REVIEW';environmentReplacement:boolean;certificationMode?:"STANDARD_G6"|"NO_POSITIVE_WITNESS_DIAGNOSTIC";witnessExists?:boolean|null;environmentChargeId?:string;evaluationSHA256?:string;review?:{file:string;sha256:string;evidenceSHA256:string;evaluationSHA256?:string};}
export interface HoldoutCheckpoint {sourceSHAHistory?:Array<{sourceSHA:string;attemptKeys:string[]}>;schema:'phase3b-holdout-batch@2';serial:true;status?:'FAILED_S0';pendingReviewCount?:number;passRateReportable?:boolean;stopReason:string|null;witnessPolicies?:Array<{id:string;policy:'ALLOW_KNOWN_UNAVAILABLE'|'POSITIVE_REQUIRED'}>;receipts:HoldoutAttempt[];healthyCases:string[];budgetCheckpoint?:{entries:number;sha256:string;cumulative:Record<string,number>};}
export async function readJSON<T>(path:string):Promise<T|undefined>{
 try{return JSON.parse(await readFile(path,'utf8'))as T;}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return;throw Error('HOLDOUT_SAVED_EVIDENCE_INVALID');}
}
export async function atomicJSON(path:string,value:unknown){
 const temporary=path+'.'+randomUUID()+'.tmp';await writeFile(temporary,JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});await rename(temporary,path);
}
/** One live orchestrator per directory. A dead process's lock can be reclaimed;
 * a live/unknown process cannot be treated as an interrupted attempt. */
export async function holdoutLock(root:string,name="run.lock"){
 const path=join(root,name),token=randomUUID();
 const prior=await readJSON<{pid:number;token:string}>(path);
 if(prior){let alive=true;try{process.kill(prior.pid,0);}catch(e){if((e as NodeJS.ErrnoException).code==='ESRCH')alive=false;}
  if(alive)throw Error('HOLDOUT_ALREADY_RUNNING');await unlink(path);
 }
 const handle=await open(path,'wx',0o600);try{await handle.writeFile(JSON.stringify({pid:process.pid,token}));}finally{await handle.close();}
 return async()=>{const current=await readJSON<{token:string}>(path);if(current?.token===token)await unlink(path);};
}
export async function bindHoldoutLedger(path:string,resume:boolean,root:string){
 const canonicalPath=await realpath(path),ledger=await readJSON<{ledgerId?:string;heldoutOutputRoot?:string;entries:unknown[];cumulative:Record<string,number>}>(canonicalPath);
 if(!ledger)throw Error('HOLDOUT_LEDGER_MISSING');
 if(ledger.heldoutOutputRoot&&ledger.heldoutOutputRoot!==root)throw Error('HOLDOUT_LEDGER_ALREADY_BOUND');
 if(!ledger.heldoutOutputRoot){if(resume)throw Error('HOLDOUT_LEDGER_MISMATCH');ledger.heldoutOutputRoot=root;await atomicJSON(canonicalPath,ledger);}
 if(!ledger.ledgerId){if(resume)throw Error('HOLDOUT_LEDGER_MISMATCH');ledger.ledgerId=randomUUID();await atomicJSON(canonicalPath,ledger);}
 return {path:canonicalPath,ledgerId:ledger.ledgerId};
}
const activeCheckpointSources=new WeakMap<HoldoutCheckpoint,string>();
/** User 2026-11-10: only health-window/checkpoint implementation, their tests,
 * and explanatory artifacts may cross the frozen SHA boundary. Git is the oracle. */
function healthOnlySourceTransition(root:string,previous:string,current:string){
 try{
  if(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()!==current)return false;
  execFileSync('git',['merge-base','--is-ancestor',previous,current],{cwd:root,stdio:'pipe'});
  const paths=execFileSync('git',['diff','--name-only','-z',previous,current],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
  const files=new Set(['holdout-health.ts','holdout-checkpoint.ts','holdout-health.test.ts','holdout-checkpoint.test.ts'].map(f=>'src/eval/restaurant/agent-loop/g6/'+f));
  return paths.length>0&&paths.every(p=>files.has(p)||p.startsWith('.eval-artifacts/')&&/\.(?:md|json|log|txt)$/u.test(p));
 }catch{return false;}
}
export async function checkResumeIdentity(root:string,audit:HoldoutRunAudit,budget:{path:string;ledgerId:string}){
 const saved=await readJSON<HoldoutRunAudit&{budget:{path:string;ledgerId:string}}>(join(root,'input-hashes.json'));
 if(!saved||['originalSHA256','manifestSHA256','commitmentSHA256'].some(k=>saved[k]!==audit[k])||(saved.sourceSHA!==audit.sourceSHA&&!healthOnlySourceTransition(root,saved.sourceSHA,audit.sourceSHA))||saved.budget?.path!==budget.path||saved.budget?.ledgerId!==budget.ledgerId)throw Error('HOLDOUT_RESUME_INPUT_MISMATCH');
 const state=await readJSON<HoldoutCheckpoint>(join(root,'batch.json'));if(!state||state.schema!=='phase3b-holdout-batch@2')throw Error('HOLDOUT_RESUME_CHECKPOINT_MISSING');
 const ledger=(await readJSON<{entries:unknown[];cumulative:Record<string,number>}>(budget.path))!;
 const snapshot=state.budgetCheckpoint;
 if(snapshot&&(ledger.entries.length<snapshot.entries||holdoutHash(JSON.stringify(ledger.entries.slice(0,snapshot.entries)))!==snapshot.sha256||Object.entries(snapshot.cumulative).some(([k,n])=>!(ledger.cumulative[k]!>=n))))throw Error('HOLDOUT_LEDGER_ROLLED_BACK');
 if(!state.sourceSHAHistory)state.sourceSHAHistory=[{sourceSHA:saved.sourceSHA,attemptKeys:state.receipts.map(a=>a.key)}];
 activeCheckpointSources.set(state,audit.sourceSHA);
 return state;
}
export async function saveHoldoutCheckpoint(root:string,state:HoldoutCheckpoint,budgetPath:string,transform:(v:unknown)=>unknown){
 const ledger=(await readJSON<{entries:unknown[];cumulative:Record<string,number>}>(budgetPath))!;
 const activeSource=activeCheckpointSources.get(state)??(await readJSON<HoldoutRunAudit>(join(root,'input-hashes.json')))?.sourceSHA;
 if(activeSource){
  state.sourceSHAHistory??=[];
  let record=state.sourceSHAHistory.find(h=>h.sourceSHA===activeSource);
  if(!record){record={sourceSHA:activeSource,attemptKeys:[]};state.sourceSHAHistory.push(record);}
  const assigned=new Set(state.sourceSHAHistory.flatMap(h=>h.attemptKeys));
  record.attemptKeys.push(...state.receipts.filter(a=>!assigned.has(a.key)).map(a=>a.key));
 }
 state.pendingReviewCount=state.receipts.filter(r=>r.status==='PENDING_REVIEW').length;state.passRateReportable=state.pendingReviewCount===0&&state.status!=='FAILED_S0'&&state.stopReason===null;
 state.budgetCheckpoint={entries:ledger.entries.length,sha256:holdoutHash(JSON.stringify(ledger.entries)),cumulative:{...ledger.cumulative}};
 await atomicJSON(join(root,'batch.json'),transform(state));
}
export async function holdoutLiveCharged(budgetPath:string,key:string){
 const ledger=(await readJSON<{entries:Array<{id:string;fullLive?:number}>}>(budgetPath))!;
 const prefix='g6-'+key+'-';
 return ledger.entries.some(e=>e.fullLive===1&&e.id.startsWith(prefix)&&/^\d+-\d+:LIVE$/u.test(e.id.slice(prefix.length)));
}
