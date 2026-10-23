import assert from 'node:assert/strict';
// Single controller owns scheduling. Workers receive only their isolated queue directory.
export async function schedule({plan,attempt,verify=()=>{},event=()=>{},receipt=()=>{},now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
 const start=now(),queues={A:[],B:[]},ready={A:start,B:start+plan.queues.staggerMs},rows=[],active=new Map(),caseRetries=new Map();
 plan.runs.forEach((r,i)=>queues[i%2?'B':'A'].push({run:r,number:1}));
 let sequential=false,stop=null,totalReruns=0,cooldownUntil=0,launches=0;
 function fallback(reason,detail){if(!sequential){sequential=true;event({type:'SEQUENTIAL_FALLBACK',at:new Date(now()).toISOString(),reason,detail});}if(['SOURCE_CHALLENGE','SOURCE_HTTP_403_503_429','SOURCE_BUSY','DEEPSEEK_RATE_LIMIT'].includes(reason))cooldownUntil=Math.max(cooldownUntil,now()+plan.cooldownMs);}
 function halt(reason){if(!stop){stop={reason,at:new Date(now()).toISOString()};event({type:'STOP_BATCH',...stop});for(const work of active.values())work.abort.abort(reason);}}
 function launch(q){
  try{verify();}catch(error){halt(error.message);return;}
  const job=queues[q].shift(),started=now(),abort=new AbortController();launches++;assert.ok(launches<=plan.runs.length+plan.maxTotalReruns,'RESERVED_ATTEMPT_BUDGET');
  const work={...job,q,abort};active.set(q,work);event({type:'START',queue:q,runId:job.run.runId,attempt:job.number,at:new Date(started).toISOString(),mode:sequential?'SEQUENTIAL':'PARALLEL'});
  work.promise=Promise.resolve().then(()=>attempt(job.run,job.number,q,{signal:abort.signal,fallback})).then(row=>{
   const finished=now(),record={run:job.run,attempt:job.number,queue:q,startedAt:new Date(started).toISOString(),finishedAt:new Date(finished).toISOString(),...row};rows.push(record);receipt(q,record);ready[q]=finished+plan.minGapMs;
   event({type:'FINISH',queue:q,runId:job.run.runId,attempt:job.number,at:record.finishedAt,modelCallsCharged:record.modelCallsCharged,formalRunStarted:record.formalRunStarted});
   if(row.s0)halt('S0_PRESENT');
   else if(row.fatal)halt('ORCHESTRATOR_ATTEMPT_FAILURE');
   else if(!stop&&row.classification==='ENV_FAILURE'){
    const used=caseRetries.get(job.run.caseId)??0;
    if(used>=plan.maxRerunsPerCase||totalReruns>=plan.maxTotalReruns)halt('ENVIRONMENT_RETRY_EXHAUSTED');
    else{caseRetries.set(job.run.caseId,used+1);totalReruns++;queues[q].unshift({...job,number:job.number+1});ready[q]=Math.max(ready[q],row.cooldown?finished+plan.cooldownMs:0);}
   }
  }).catch(error=>halt('ORCHESTRATOR_ERROR:'+error.message)).finally(()=>active.delete(q));
 }
 while(active.size||queues.A.length||queues.B.length){
  if(!stop){try{assert.ok(now()+plan.ceilings.timeoutMs<Date.parse(plan.hardDeadline),'WITNESS_DEADLINE');}catch(error){halt(error.message);}}
  if(!stop&&now()>=cooldownUntil){
   if(sequential){if(!active.size){const q=['A','B'].filter(q=>queues[q].length).sort((a,b)=>queues[a][0].run.runId.localeCompare(queues[b][0].run.runId))[0];if(q&&now()>=Math.max(ready[q],...rows.map(r=>Date.parse(r.finishedAt)+plan.minGapMs)))launch(q);}}
   else for(const q of ['A','B'])if(!active.has(q)&&queues[q].length&&now()>=ready[q]&&active.size<2)launch(q);
  }
  if(stop&&!active.size)break;
  await sleep(1000);
 }
 return {schema:'phase2c-execution-deferred@1',status:'AWAITING_INDEPENDENT_WORDING_REVIEW',evaluation:'DEFERRED',planned:18,attempts:rows.sort((a,b)=>a.startedAt.localeCompare(b.startedAt)),totalReruns,stop,sequentialFallback:sequential,plannedRuns:plan.runs.map(run=>({run,status:rows.some(r=>r.run.runId===run.runId)?'RECORDED':'NOT_REACHED'}))};
}
