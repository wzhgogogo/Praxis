import {spawn} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync,openSync,closeSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {parseArgs} from 'node:util';
import {base,verifyFreeze,sha} from './freeze.mjs';
import {gateWitness,nextAction,consumeAuthorization,checkStageBudget} from './policy.mjs';
import {evaluateAttempt,writeBatchReport} from './evaluate-report.ts';
import {postCheck} from './post-check.mjs';
import {loadResume} from './resume.mjs';
import {executionRuns} from './run-selection.mjs';
const {values}=parseArgs({options:{mode:{type:'string'},freeze:{type:'string'},output:{type:'string'},approval:{type:'string'},registry:{type:'string'},ledger:{type:'string'},resume:{type:'string'},'run-ids':{type:'string'}}});
if(!['OFFLINE_REHEARSAL','LIVE_READ_ONLY'].includes(values.mode??''))throw Error('--mode OFFLINE_REHEARSAL|LIVE_READ_ONLY required');
if(!values.freeze||!values.output)throw Error('--freeze --output required');
const mode=values.mode!,directory=resolve(values.output),inside=relative(resolve(base),directory);
if(!inside||inside.startsWith('..'))throw Error('OUTPUT_OUTSIDE_BATCH');
const frozen=verifyFreeze(values.freeze),plan=JSON.parse(readFileSync(resolve(base,'plan.json'),'utf8'));
const offline=mode==='OFFLINE_REHEARSAL';
if(offline&&values.resume)throw Error('LIVE_RESUME_ONLY');
const resume=values.resume?loadResume(values.resume,frozen,plan):undefined;
const quick=values['run-ids']!==undefined,runs=executionRuns(plan,{runIds:values['run-ids'],offline,resume});
const authorizationAction=quick?'CHECKPOINT_C_QUICK_VALIDATION':resume?'CHECKPOINT_C_RESUME':'CHECKPOINT_C_LIVE_18';
const ledgerPath=values.ledger??base+'/phase2-ledger.json';
const ledger=JSON.parse(readFileSync(ledgerPath,'utf8'));
const budget=checkStageBudget(ledger,plan);
for(const source of ledger.sources)if(frozen.files[source.path]!==source.sha256||sha(readFileSync(source.path))!==source.sha256)throw Error('FROZEN_LEDGER_EVIDENCE_MISMATCH');
if(!offline){
 if(!values.approval||!values.registry)throw Error('EXPLICIT_USER_APPROVAL_CERTIFIED_REGISTRY_AND_GLOBAL_BUDGET_LEDGER_REQUIRED');
 const approval=JSON.parse(readFileSync(values.approval,'utf8'));
 if(approval.action!==authorizationAction||approval.approvedBy!=='USER'||approval.freezeSha256!==frozen.manifestSha256||approval.registrySha256!==sha(readFileSync(values.registry))||!Number.isFinite(Date.parse(approval.validUntil))||Date.parse(approval.validUntil)<=Date.now()||resume&&approval.resumeSha256!==resume.sha256||quick&&JSON.stringify(approval.runIds)!==JSON.stringify(runs.map(run=>run.runId)))throw Error('INVALID_LIVE_APPROVAL');
 for(const p of [values.registry,ledgerPath])if(frozen.files[relative(process.cwd(),resolve(p))]!==sha(readFileSync(p)))throw Error('RUNTIME_INPUT_NOT_COMMITTED_AND_FROZEN:'+p);
 for(const ref of ledger.priorStageSafety?.refs??[])if(frozen.files[ref.path]!==ref.sha256||sha(readFileSync(ref.path))!==ref.sha256)throw Error('PRIOR_STAGE_SAFETY_EVIDENCE_NOT_FROZEN');
 plan.maxTotalReruns=resume?Math.min(plan.maxTotalReruns,resume.totalReruns+budget.reservedRetries):budget.reservedRetries;
}
if(!offline)await consumeAuthorization(base,sha(readFileSync(values.approval!)),{action:authorizationAction,freezeSha256:frozen.manifestSha256,...(resume?{resumeSha256:resume.sha256,priorDirectory:resume.config.priorDirectory}:{}),...(quick?{label:'快速验证',runIds:runs.map(run=>run.runId),checkpointC18Runs:0}:{}),directory});
mkdirSync(directory,{recursive:false});
const write=(p:string,v:any)=>writeFileSync(resolve(directory,p),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
write('started.json',{mode,at:new Date().toISOString(),freezeSha256:frozen.manifestSha256,commit:frozen.commit,ledgerPath,ledgerSha256:sha(readFileSync(ledgerPath)),budget,planned:runs.length,carriedAttempts:resume?.rows.length??0,...(resume?{resumeSha256:resume.sha256,priorDirectory:resume.config.priorDirectory,extraUserAuthorizedAttempt:resume.config.extraAttempt}:{}),...(quick?{label:'快速验证',runIds:runs.map(run=>run.runId),checkpointC18Runs:0}:{}),network:offline?0:'AUTHORIZED_LIVE',models:offline?0:'AUTHORIZED_LIVE'});
if(quick)write('scope.json',{label:'快速验证',runIds:runs.map(run=>run.runId),checkpointC18Runs:0,planned:3,reportTemplate:'Unchanged Checkpoint C reporting template; its 18-run exit denominator is not a quick-validation gate.'});
const rows:any[]=resume?[...resume.rows]:[],caseRetries:Map<string,number>=resume?resume.caseRetries:new Map();let totalReruns=resume?.totalReruns??0,lastFinish=resume?.lastFinish??0,stop:any=null;
async function waitUntil(time:number){while(Date.now()<time)await new Promise(r=>setTimeout(r,Math.min(1000,time-Date.now())));}
const registry=values.registry?JSON.parse(readFileSync(values.registry,'utf8')):undefined;
for(const run of runs){
 let attempt=(resume?.attemptCounts as Record<string,number>|undefined)?.[run.runId]??0;
 while(true){
  if(!offline)await waitUntil(lastFinish+plan.minGapMs);
  if(resume&&Date.now()+plan.ceilings.timeoutMs>=resume.hardDeadline){stop={action:'STOP_BATCH',reason:'HARD_DEADLINE_NOT_ENOUGH_TIME'};break;}
  verifyFreeze(values.freeze!);
  if(!offline)gateWitness(registry,run.caseId,Date.now(),plan.ceilings.timeoutMs); // must remain valid throughout run
  attempt++;const attemptDir=resolve(directory,run.runId+`-attempt-${attempt}`);mkdirSync(attemptDir);
  const env=offline?{PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',DEEPSEEK_API_KEY:'OFFLINE_PLACEHOLDER',GOOGLE_MAPS_API_KEY:'OFFLINE_PLACEHOLDER'}:{...process.env,PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM'};
  Object.assign(env,{CHECKPOINT_C_MODE:mode,CHECKPOINT_C_ATTEMPT:attemptDir,CHECKPOINT_C_REVIEWED_READS:resolve(base,'reviewed-reads.json'),PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_LIVE_MODEL_EVAL:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PRAXIS_GOOGLE_API_PROXY_SERVER:'',PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER:''});
  writeFileSync(resolve(attemptDir,'started.json'),JSON.stringify({run,attempt,at:new Date().toISOString(),freezeSha256:frozen.manifestSha256,mode},null,2),{flag:'wx'});
  const out=openSync(resolve(attemptDir,'runner.stdout.txt'),'wx'),err=openSync(resolve(attemptDir,'runner.stderr.txt'),'wx');
  const args=[...(offline?['--import',resolve(base,'offline-deny.mjs')]:[]),'--import','tsx',resolve(base,'child-entry.ts'),'--case-source',plan.runnerInput,'--case',run.caseId,'--timeout-ms','500000','--max-model-calls','50','--max-google-requests','38','--record-decisions',...(!offline?['--record-browser']:[])];
  const child=spawn(process.execPath,args,{env,stdio:['ignore',out,err]});
  let killed:string|undefined;const deadline=setTimeout(()=>{killed='OUTER_DEADLINE';child.kill('SIGTERM');},500000);
  const monitor=setInterval(()=>{
   const p=resolve(attemptDir,'outer-observations.jsonl');if(!existsSync(p)||killed)return;
   const logs=readFileSync(p,'utf8').trim().split('\n').filter(Boolean).flatMap(l=>{try{return [JSON.parse(l)];}catch{return [];}});
   if(logs.some(v=>v.kind==='SAFETY_STOP')){killed='SAFETY_STOP';child.kill('SIGTERM');}
   else if(logs.some(v=>v.kind==='COOLDOWN_SIGNAL')){killed='COOLDOWN_SIGNAL';child.kill('SIGTERM');}
  },50);
  const exit=await new Promise<any>((res,rej)=>{child.on('error',rej);child.on('exit',(code,signal)=>res({code,signal}));});
  clearTimeout(deadline);clearInterval(monitor);closeSync(out);closeSync(err);
  const results=existsSync(resolve(attemptDir,'runner'))?readdirSync(resolve(attemptDir,'runner')).filter(p=>p.endsWith('.result.json')):[];
  if(results.length>1)throw Error('AMBIGUOUS_RESULT');
  const resultPath=results.length?resolve(attemptDir,'runner',results[0]):undefined;
  const preflight=existsSync(resolve(attemptDir,'source-preflight/source-data-preflight.json'))?JSON.parse(readFileSync(resolve(attemptDir,'source-preflight/source-data-preflight.json'),'utf8')):undefined;
  const interruption={...(exit.signal?{interruption:{status:'INTERRUPTED_BY_OUTER',reason:killed}}:{}),finish:{exitCode:{code:exit.code,signal:exit.signal},formalRunStarted:!!resultPath||existsSync(resolve(attemptDir,'runner')),preflight:{status:preflight?.classification==='ENV_FAILURE'?'FAILED':preflight?'PASSED':'FAILED'}},refs:[resolve(attemptDir,'finish.json')]};
  writeFileSync(resolve(attemptDir,'finish.json'),JSON.stringify({at:new Date().toISOString(),exit,killed,orchestration:interruption,mode},null,2),{flag:'wx'});
  let postPath;
  if(!offline&&resultPath){
   const immediate=evaluateAttempt({resultPath,directory:attemptDir,run,mode,registryPath:undefined,postPath:undefined,freezeSha256:frozen.manifestSha256,interruption,outputStem:'pre-post-check'});
   if(immediate.evaluation.severity.S0.status==='PRESENT'){stop={action:'STOP_BATCH',reason:'S0_BEFORE_POST_READ'};rows.push(immediate.summary);break;}
   try{await postCheck(JSON.parse(readFileSync(resultPath,'utf8')),registry,resolve(attemptDir,'post-run'));postPath=resolve(attemptDir,'post-run/post-check.json');}catch{postPath=resolve(attemptDir,'post-check.failure.json');writeFileSync(postPath,JSON.stringify({rows:[{status:'NOT_EVALUATED',reason:'POST_RUN_RECHECK_FAILED; retain raw result for review, continue unless S0 PRESENT'}]}),{flag:'wx'});}}
  const {summary,evaluation}=evaluateAttempt({resultPath,directory:attemptDir,run,mode,registryPath:values.registry,postPath,freezeSha256:frozen.manifestSha256,interruption});
  rows.push(summary);lastFinish=Date.now();
  if(offline){if(existsSync(resolve(attemptDir,'network-denied.jsonl')))throw Error('OFFLINE_NETWORK_ATTEMPT');if(!resultPath||exit.code!==0)throw Error('REHEARSAL_RUNNER_FAILED');break;}
  const safety=[evaluation.severity.S0_DECLARATION,evaluation.severity.S0_BOUNDARY];
  const action=nextAction({s0:safety.some(s=>s.status==='PRESENT')||killed==='SAFETY_STOP',unknownSafety:safety.some(s=>s.status==='NOT_EVALUATED')||summary.independentPostDeliveryEvidenceComplete===false,cooldown:killed==='COOLDOWN_SIGNAL',classification:evaluation.outcome.type,caseReruns:caseRetries.get(run.caseId)??0,totalReruns},plan);
  if(action.action==='STOP_BATCH'){stop=action;break;}
  if(action.action==='RETRY'){caseRetries.set(run.caseId,(caseRetries.get(run.caseId)??0)+1);totalReruns++;await waitUntil(lastFinish+action.waitMs);continue;}
  break;
 }
 if(stop)break;
}
writeBatchReport(directory,plan,rows,mode,ledger);
if(quick){const report=resolve(directory,'report.md');writeFileSync(report,'# 快速验证（不计入检查点 C 的 18 次）\n\n本目录只记录 c-01、c-02、c-05；逐次评价和下方原报告模板保持不变，模板的 18 次退出条件不作为快速验证门槛。\n\n'+readFileSync(report,'utf8'));}
write('finish.json',{at:new Date().toISOString(),mode,stop,totalReruns,attempts:rows.length,network:offline?0:'SEE_RAW_RECORDS',realModels:offline?0:'SEE_RAW_RECORDS',status:stop?'STOPPED':'COMPLETED'});
console.log(JSON.stringify({mode,report:resolve(directory,'report.md'),attempts:rows.length,stop}));
