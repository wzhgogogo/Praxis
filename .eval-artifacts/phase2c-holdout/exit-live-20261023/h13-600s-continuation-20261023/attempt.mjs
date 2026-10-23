import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import {resolve} from 'node:path';
import {sha} from '../../../phase2b-exit-pipeline-20261022/inputs.mjs';
import {evaluateSafetyOnly} from '../../../checkpoint-c-live-20261020/evaluate-report.ts';
import {postCheck} from '../../../checkpoint-c-live-20261020/post-check.mjs';
import {busyPage} from '../../../checkpoint-c-live-20261020/certify-witnesses.mjs';
import {timeoutForRun} from './limits.mjs';
import {stopChild} from './termination.mjs';
const base='.eval-artifacts/phase2c-holdout/exit-live-20261023',checkpoint='.eval-artifacts/checkpoint-c-live-20261020';
const json=p=>JSON.parse(fs.readFileSync(p)),write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const lines=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).flatMap(l=>{try{return [JSON.parse(l)];}catch{return [];}}):[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function runAttempt({run,number,queue,directory,runnerInput,registry,freezeSha,signal,fallback,offline=false}){
 const dir=resolve(directory,queue,`${run.runId}-attempt-${number}`);fs.mkdirSync(dir);
 const env=offline?{PATH:process.env.PATH,HOME:process.env.HOME,TMPDIR:process.env.TMPDIR,DEEPSEEK_API_KEY:'OFFLINE_PLACEHOLDER',GOOGLE_MAPS_API_KEY:'OFFLINE_PLACEHOLDER'}:{...process.env};
 Object.assign(env,{CHECKPOINT_C_MODE:offline?'OFFLINE_REHEARSAL':'LIVE_READ_ONLY',CHECKPOINT_C_ATTEMPT:dir,CHECKPOINT_C_REVIEWED_READS:resolve(checkpoint,'reviewed-reads.json'),CHECKPOINT_C_DEFER_EVALUATION:'1',PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_LIVE_MODEL_EVAL:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PRAXIS_GOOGLE_API_PROXY_SERVER:'',PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER:'',PRAXIS_LOCAL_CHROMIUM_INTERACTIVE:'0',PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION:'0'});
 delete env.PRAXIS_EVAL_USER_LAT;delete env.PRAXIS_EVAL_USER_LNG;
 const out=fs.openSync(resolve(dir,'stdout.txt'),'wx'),err=fs.openSync(resolve(dir,'stderr.txt'),'wx');
 const child=spawn(process.execPath,[...(offline?['--import',resolve(checkpoint,'offline-deny.mjs')]:[]),'--import','tsx',resolve(base,offline?'../../checkpoint-c-live-20261020/child-entry.ts':'child-entry.ts'),'--case-source',runnerInput,'--case',run.caseId,'--timeout-ms',String(timeoutForRun(run)),'--max-model-calls','50','--max-google-requests','38','--record-decisions',...(!offline?['--record-browser']:[])],{env,stdio:['ignore',out,err]});
 let killed,cooldown=false,parallelFailure=false;
 const terminate=reason=>{if(!killed){killed=reason;stopChild(child);}};
 const abort=()=>terminate('BATCH_SAFETY_OR_DEADLINE_STOP');signal?.addEventListener('abort',abort,{once:true});
 const deadline=setTimeout(()=>terminate('OUTER_DEADLINE'),timeoutForRun(run));
 const seen=new Set();
 const observe=()=>{
  const observed=lines(resolve(dir,'outer-observations.jsonl'));
  if(observed.some(r=>r.kind==='SAFETY_STOP'))terminate('SAFETY_STOP');
  if(/EADDRINUSE|SingletonLock|profile.*(?:in use|already)|EEXIST/i.test(fs.readFileSync(resolve(dir,'stderr.txt'),'utf8'))&&!parallelFailure){fallback('PARALLEL_RESOURCE_CONFLICT',{queue});parallelFailure=true;terminate('PARALLEL_FALLBACK_ENV_FAILURE');}
  for(const row of [...observed.filter(r=>r.kind==='COOLDOWN_SIGNAL').map(r=>({reason:'SOURCE_HTTP_403_503_429',...r})),...lines(resolve(dir,'parallel-signals.jsonl'))]){
   const key=JSON.stringify(row);if(seen.has(key))continue;seen.add(key);fallback(row.reason,row);parallelFailure=true;cooldown=row.reason!=='PARALLEL_RESOURCE_CONFLICT';terminate('PARALLEL_FALLBACK_ENV_FAILURE');
  }
 };
 const monitor=setInterval(observe,200);
 let exit;try{exit=await new Promise((res,rej)=>{child.on('error',rej);child.on('exit',(code,signal)=>res({code,signal}));});observe();}finally{clearInterval(monitor);clearTimeout(deadline);signal?.removeEventListener('abort',abort);fs.closeSync(out);fs.closeSync(err);}
 const results=fs.existsSync(resolve(dir,'runner'))?fs.readdirSync(resolve(dir,'runner')).filter(p=>p.endsWith('.result.json')):[];assert.ok(results.length<=1);
 const artifactPath=results.length?resolve(dir,'runner',results[0]):null,artifact=artifactPath?json(artifactPath):null;
 const formalRunStarted=!!artifactPath||fs.existsSync(resolve(dir,'runner'));
 const interruption={...(exit.signal?{interruption:{status:'INTERRUPTED_BY_OUTER',reason:killed}}:{}),finish:{exitCode:exit,formalRunStarted,preflight:{status:fs.existsSync(resolve(dir,'source-preflight/source-data-preflight.json'))&&json(resolve(dir,'source-preflight/source-data-preflight.json')).classification!=='ENV_FAILURE'?'PASSED':'FAILED'}},refs:[resolve(dir,'finish.json')]};
 write(resolve(dir,'finish.json'),{exit,killed,orchestration:interruption});
 let safety=evaluateSafetyOnly({resultPath:artifactPath,directory:dir,run,mode:offline?'OFFLINE_REHEARSAL':'LIVE_READ_ONLY',freezeSha256:freezeSha,interruption,outputStem:'safety'}),postFailure=false;
 if(!offline&&artifact&&safety.evaluation.severity.S0.status!=='PRESENT'&&!signal?.aborted&&!parallelFailure){
  const postdir=resolve(dir,'post-transport');fs.mkdirSync(postdir);let count=0;
  const transport=async(url,options)=>{
   const id=++count;for(let n=1;n<=2;n++){
    const requestedAt=new Date().toISOString();let r,bytes,error;
    try{r=await fetch(url,{...options,signal:AbortSignal.timeout(20000)});bytes=Buffer.from(await r.arrayBuffer());}catch(e){error=e.message;}
    const cooling=r&&([403,503,429].includes(r.status)||busyPage(bytes.toString('utf8')));
    const bodyPath=bytes?resolve(postdir,`${id}-attempt-${n}.body.txt`):null;if(bytes)fs.writeFileSync(bodyPath,bytes,{flag:'wx'});
    fs.appendFileSync(resolve(postdir,'reads.jsonl'),JSON.stringify({url:String(url),method:options?.method??'GET',requestedAt,finishedAt:new Date().toISOString(),attempt:n,status:r?.status??null,error:error??null,bodyPath,sha256:bytes?sha(bytes):null,cooldown:!!cooling})+'\n');
    if(cooling){cooldown=true;fallback('SOURCE_HTTP_403_503_429',{url:String(url),status:r.status});}
    if(r&&!cooling)return new Response(bytes,{status:r.status,headers:r.headers});
    if(n===2)throw Error(cooling?'POST_SOURCE_COOLDOWN_EXHAUSTED':'POST_TRANSPORT_RETRY_EXHAUSTED');
    const until=Date.now()+(cooling?900000:120000);while(Date.now()<until){if(signal?.aborted)throw Error('BATCH_STOPPED');await sleep(Math.min(1000,until-Date.now()));}
   }
  };
  try{await postCheck(artifact,registry,resolve(dir,'post-run'),transport);safety=evaluateSafetyOnly({resultPath:artifactPath,directory:dir,run,mode:'LIVE_READ_ONLY',postPath:resolve(dir,'post-run/post-check.json'),freezeSha256:freezeSha,interruption,outputStem:'post-safety'});}catch(error){postFailure=true;write(resolve(dir,'post-error.json'),{classification:'ENV_FAILURE',reason:error.message});}
 }
 const counted=lines(resolve(dir,'provider-calls.jsonl')).filter(r=>r.event==='START').length;
 if(artifact&&!offline)assert.equal(counted,artifact.resourceUsage.modelCallsStarted,'PROVIDER_CALL_LEDGER_MISMATCH');
 const modelCallsCharged=offline?0:artifact?.resourceUsage?.modelCallsStarted??counted;
 assert.ok(modelCallsCharged<=50);const s0=killed==='SAFETY_STOP'||safety.evaluation.severity.S0.status==='PRESENT';
 const networkDir=resolve(dir,'network-preflight'),networkGoogle=fs.existsSync(networkDir)?fs.readdirSync(networkDir).filter(p=>p.endsWith('.result.json')).reduce((n,p)=>n+(json(resolve(networkDir,p)).attempts??[]).filter(a=>a.target==='GOOGLE').length,0):0;
 return {artifactPath,artifactSha256:artifactPath?sha(fs.readFileSync(artifactPath)):null,formalRunStarted,modelCallsCharged,s0,cooldown,classification:parallelFailure||postFailure?'ENV_FAILURE':safety.summary.retryClassification,directory:dir,productStartedAt:artifact?.startedAt??null,productFinishedAt:artifact?.finishedAt??null,productElapsedMs:artifact?.resourceUsage?.elapsedMs??null,googleRequests:(artifact?.resourceUsage?.googleRequests?.total??0)+networkGoogle+(fs.existsSync(resolve(dir,'source-preflight/source-data-preflight.json'))?json(resolve(dir,'source-preflight/source-data-preflight.json')).googleRequests??0:0),postFailure,offline};
}
