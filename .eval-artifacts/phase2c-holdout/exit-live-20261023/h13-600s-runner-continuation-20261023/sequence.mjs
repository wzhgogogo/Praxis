import assert from 'node:assert/strict';
import {randomInt} from 'node:crypto';
export async function sequence({plan,attempt,verify=()=>{},receipt=()=>{},event=()=>{},now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms)),draw=()=>randomInt(120,241)*1000}){
 const rows=[],caseRetries=new Map(Object.entries(plan.priorCaseRetries));let lastFinish=Date.parse(plan.priorFinishedAt),reruns=0,stop=null,cooldownUntil=0;
 const until=async time=>{while(now()<time)await sleep(Math.min(1000,time-now()));};
 for(const run of plan.runs){let number=(run.initialAttempt??1)-1;
  while(true){
   const gapMs=draw();assert.ok(Number.isInteger(gapMs)&&gapMs>=120000&&gapMs<=240000,'RANDOM_GAP_OUTSIDE_USER_RANGE');
   event({type:'GAP_DRAW',runId:run.runId,nextAttempt:number+1,gapMs,after:new Date(lastFinish).toISOString(),notBefore:new Date(Math.max(lastFinish+gapMs,cooldownUntil,rows.length===0?Date.parse(plan.initialNotBefore??0)||0:0)).toISOString()});
   await until(Math.max(lastFinish+gapMs,cooldownUntil,rows.length===0?Date.parse(plan.initialNotBefore??0)||0:0));
   try{verify();assert.ok(now()+(run.timeoutMs??500000)<Date.parse(plan.hardDeadline),'WITNESS_DEADLINE');}catch(e){stop={reason:e.message};break;}
   number++;const startedAt=new Date(now()).toISOString(),queue=Number(run.runId.slice(2))%2?'A':'B';
   event({type:'START',runId:run.runId,attempt:number,queue,at:startedAt,mode:'SEQUENTIAL'});
   const row=await attempt(run,number,queue,{signal:new AbortController().signal,fallback:(reason,detail)=>{event({type:'SOURCE_OR_RESOURCE_SIGNAL',reason,detail,at:new Date(now()).toISOString()});if(reason!=='PARALLEL_RESOURCE_CONFLICT')cooldownUntil=Math.max(cooldownUntil,now()+900000);}});
   lastFinish=now();const record={run,authorization:run.explicitTimeoutRetry&&number===run.initialAttempt?'USER_EXPLICIT_TIMEOUT_RETRY':number>run.initialAttempt?'ENV_FAILURE_RETRY':'ORIGINAL_REMAINING_SLOT',attempt:number,queue,startedAt,finishedAt:new Date(lastFinish).toISOString(),gapMs,...row};rows.push(record);receipt(queue,record);event({type:'FINISH',runId:run.runId,attempt:number,queue,at:record.finishedAt,modelCallsCharged:row.modelCallsCharged,formalRunStarted:row.formalRunStarted});
   if(row.s0){stop={reason:'S0_PRESENT'};break;}if(row.fatal){stop={reason:'ORCHESTRATOR_ATTEMPT_FAILURE'};break;}
   if(row.classification!=='ENV_FAILURE')break;
   const used=caseRetries.get(run.caseId)??0;
   if(used>=1||reruns>=plan.maxNewReruns){stop={reason:'ENVIRONMENT_RETRY_EXHAUSTED'};break;}
   caseRetries.set(run.caseId,used+1);reruns++;if(row.cooldown)cooldownUntil=Math.max(cooldownUntil,lastFinish+900000);
  }
  if(stop)break;
 }
 return {schema:'phase2c-sequential-continuation@1',evaluation:'DEFERRED',attempts:rows,totalReruns:reruns,stop,plannedRuns:plan.runs.map(run=>({run,status:rows.some(r=>r.run.runId===run.runId)?'RECORDED':'NOT_REACHED'}))};
}
