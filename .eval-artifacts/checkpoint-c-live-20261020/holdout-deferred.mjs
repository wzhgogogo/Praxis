import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';import {resolve,relative} from 'node:path';import assert from 'node:assert/strict';import {base,sha} from './freeze.mjs';import {busyPage} from './certify-witnesses.mjs';
export function loadHoldoutPlan(path,frozen){
 const bytes=readFileSync(path),p=JSON.parse(bytes);assert.equal(frozen.files[relative(process.cwd(),resolve(path))],sha(bytes),'HOLDOUT_PLAN_NOT_FROZEN');
 assert.equal(p.kind,'PHASE2_EXIT_HOLDOUT_18');assert.equal(p.deferEvaluation,true);assert.equal(p.evaluator,'restaurant-hybrid-read-diagnostic-evaluator@33');assert.equal(p.rubric,'restaurant-hybrid-read-diagnostic-rubric@29');
 assert.deepEqual(p.ceilings,{timeoutMs:500000,maxModelCalls:50,maxGoogleRequests:40});assert.equal(p.minGapMs,300000);assert.equal(p.cooldownMs,900000);assert.equal(p.maxRerunsPerCase,1);assert.equal(p.maxTotalReruns,4);
 assert.equal(p.runs.length,18);assert.equal(new Set(p.runs.map(r=>r.runId)).size,18);assert.equal(new Set(p.runs.map(r=>r.caseId)).size,6);
 for(let n=1;n<=6;n++){const id=`p2-holdout-${String(n).padStart(2,'0')}`;assert.deepEqual(p.runs.filter(r=>r.caseId===id).map(r=>r.repeat),[1,2,3]);}
 p.runs.forEach((r,i)=>{assert.equal(r.runId,`h-${String(i+1).padStart(2,'0')}`);if(i)assert.notEqual(r.caseId,p.runs[i-1].caseId);});
 assert.ok(Number.isFinite(Date.parse(p.hardDeadline)));assert.equal(frozen.files[p.runnerInput],sha(readFileSync(p.runnerInput)),'HOLDOUT_INPUT_NOT_FROZEN');
 for(const r of p.authorityRefs)assert.equal(frozen.files[r.path],r.sha256);return p;
}
export function writeDeferredManifest(directory,plan,rows,mode,stop,totalReruns){
 const result={schema:'holdout-execution-deferred@1',status:'AWAITING_WORDING_ADJUDICATION_NO_CAPABILITY_EVALUATION',mode,evaluator:plan.evaluator,rubric:plan.rubric,hardDeadline:plan.hardDeadline,planned:18,recordedAttempts:rows.length,totalReruns,stop,plannedRuns:plan.runs.map(run=>({run,status:rows.some(r=>r.run.runId===run.runId)?'RECORDED':'NOT_REACHED'})),attempts:rows};
 writeFileSync(resolve(directory,'execution-manifest.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});return result;
}
// The independent GET/Guard-reviewed recheck obeys the same source cooldown as the browser.
export function postReadTransport(directory,{transport=fetch,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms))}={}){
 mkdirSync(directory,{recursive:true});let sequence=0;const state={cooldownExhausted:false};
 const read=async(url,options)=>{
  const id=++sequence;
  for(let attempt=1;attempt<=2;attempt++){
   const at=now(),response=await transport(url,{...options,signal:AbortSignal.timeout(20000)}),bytes=Buffer.from(await response.arrayBuffer());
   const cooldown=[403,503,429].includes(response.status)||busyPage(bytes.toString('utf8'));
   const bodyPath=resolve(directory,`${id}-attempt-${attempt}.body.txt`);writeFileSync(bodyPath,bytes,{flag:'wx'});appendFileSync(resolve(directory,'reads.jsonl'),JSON.stringify({url:String(url),method:options?.method??'GET',requestedAt:new Date(at).toISOString(),finishedAt:new Date(now()).toISOString(),attempt,status:response.status,bodyPath,sha256:sha(bytes),cooldown})+'\n');
   if(!cooldown)return new Response(bytes,{status:response.status,headers:response.headers});
   if(attempt===2){state.cooldownExhausted=true;throw Error('POST_SOURCE_COOLDOWN_RETRY_EXHAUSTED');}
   const until=now()+900000;while(now()<until)await sleep(Math.min(30000,until-now()));
  }
 };
 return {read,state};
}
