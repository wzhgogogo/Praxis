import fs from 'node:fs';import {resolve} from 'node:path';import {spawn,execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {nextDecision,blockedMethods} from './control.mjs';
import {postCheck} from '../../checkpoint-c-live-20261020/post-check.mjs';
import {selectionComparison} from '../../p2-1-discovery-20261016/outer/post-delivery.mjs';
import {auditReadOnlyTrace,parseReviewedReads} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-network.ts';
const base='.eval-artifacts/phase2c-holdout/diagnostic-after-guard-fix-20261023',get=p=>JSON.parse(fs.readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex'),put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),lines=p=>fs.existsSync(p)?fs.readFileSync(p,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];
const n=Number(process.argv[2]);assert.ok(n===1||n===2);const plan=get(base+'/plan.json'),freeze=get(base+'/freeze-continuation.json');for(const [p,h] of Object.entries(freeze.files))assert.equal(sha(fs.readFileSync(p)),h,'FROZEN_CHANGED:'+p);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'','WORKTREE_DIRTY');
assert.ok(Date.now()+1_180_000<Date.parse(plan.deadline),'INSUFFICIENT_WITNESS_TIME');
if(n===2){const before=get(base+'/attempt-1/summary.json');const first=before.artifactPath?get(before.artifactPath):null; const boundedTimeout=!!first&&before.formalRunStarted&&before.artifactSha256===sha(fs.readFileSync(before.artifactPath))&&first.status==='FAILED'&&first.stage==='AGENT_LOOP'&&first.failureCode==='RUN_DEADLINE_EXCEEDED'&&before.resourceUsage?.elapsedMs>=500000&&before.resourceUsage.elapsedMs<=505000&&!before.nearDefect&&!before.killed&&!before.postError&&!before.postStop&&before.boundaryStatus==='ABSENT'; assert.ok(before.next==='CAPABILITY_NO_DELIVERY_SECOND_ALLOWED'||boundedTimeout,'SECOND_REQUIRES_APPROVED_CAPABILITY_FAILURE');assert.ok(Date.now()-Date.parse(before.finishedAt)>=plan.minGapMs);}
const directory=resolve(base,`attempt-${n}`);fs.mkdirSync(directory);
const ledger=get(plan.ledgerPath);assert.ok(ledger.totalModelCalls+100<=5000&&ledger.totalFullLiveRuns+2<=100);
const env={...process.env,CHECKPOINT_C_ATTEMPT:directory,CHECKPOINT_C_MODE:'LIVE_READ_ONLY',CHECKPOINT_C_REVIEWED_READS:resolve('.eval-artifacts/tablecheck-guard-preflight-20261023/reviewed-reads.json'),CHECKPOINT_C_DEFER_EVALUATION:'1',PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_LIVE_MODEL_EVAL:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PRAXIS_GOOGLE_API_PROXY_SERVER:'',PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER:'',PRAXIS_LOCAL_CHROMIUM_INTERACTIVE:'0',PRAXIS_EVAL_ALLOW_BROWSER_MANUAL_INTERVENTION:'0'};delete env.PRAXIS_EVAL_USER_LAT;delete env.PRAXIS_EVAL_USER_LNG;
const args=['--import','tsx',resolve(base,'child-entry.ts'),'--case-source',plan.runnerInput,'--case',plan.caseId,'--timeout-ms','500000','--max-model-calls','50','--max-google-requests','38','--record-decisions','--record-browser','--no-proxy'];
const startedAt=new Date().toISOString();put(directory+'/started.json',{label:plan.label,run:n,startedAt,mainline:plan.freezeMain,freezeSha256:sha(fs.readFileSync(base+'/freeze-continuation.json')),command:{node:process.execPath,args},evaluation:'DEFERRED',original18Contribution:0});
const out=fs.openSync(directory+'/stdout.txt','wx'),err=fs.openSync(directory+'/stderr.txt','wx'),child=spawn(process.execPath,args,{env,stdio:['ignore',out,err],detached:true});let killed=null,formalAt;
const terminate=reason=>{if(killed)return;killed=reason;try{process.kill(-child.pid,'SIGTERM');}catch{}setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},3000).unref();};
const monitor=setInterval(()=>{
 try{
  if(Date.now()+1000>=Date.parse(plan.deadline))return terminate('WITNESS_DEADLINE');
  const runner=directory+'/runner';if(!formalAt&&fs.existsSync(runner)){const p=fs.readdirSync(runner).find(p=>p.endsWith('.started.json'));if(p)formalAt=Date.parse(get(runner+'/'+p).startedAt??startedAt);}
  if(formalAt&&Date.now()-formalAt>505000)return terminate('FORMAL_DEADLINE_CLEANUP_GRACE');
  if(!formalAt&&Date.now()-Date.parse(startedAt)>680000)return terminate('PREFLIGHT_DEADLINE');
  const observations=lines(directory+'/outer-observations.jsonl');if(observations.some(r=>r.kind==='SAFETY_STOP'))return terminate('SAFETY_STOP');
  // Health has its own approved three attempts and five-minute waits. A formal
  // source failure stops this diagnostic; it never triggers an extra Live.
  if(formalAt&&(observations.some(r=>r.kind==='COOLDOWN_SIGNAL')||lines(directory+'/parallel-signals.jsonl').length))return terminate('FORMAL_ENVIRONMENT_FAILURE');
 }catch(error){terminate('OUTER_OBSERVATION_ERROR');}
},200);
let exit;try{exit=await new Promise((ok,bad)=>{child.on('error',bad);child.on('exit',(code,signal)=>ok({code,signal}));});}finally{clearInterval(monitor);fs.closeSync(out);fs.closeSync(err);}
const runner=directory+'/runner',paths=fs.existsSync(runner)?fs.readdirSync(runner).filter(p=>p.endsWith('.result.json')):[];assert.ok(paths.length<=1);const artifactPath=paths.length?runner+'/'+paths[0]:null,artifact=artifactPath?get(artifactPath):null;
const models=lines(directory+'/provider-calls.jsonl').filter(r=>r.event==='START').length;assert.ok(models<=50);if(artifact)assert.equal(models,artifact.resourceUsage.modelCallsStarted);
const trace=[...(artifact?.diagnostics?.browserTrace??[]),...lines(directory+'/outer-observations.jsonl')],reviewedPath=env.CHECKPOINT_C_REVIEWED_READS,boundary=auditReadOnlyTrace(trace,[],!!exit.signal,parseReviewedReads(fs.readFileSync(reviewedPath),reviewedPath));put(directory+'/boundary-only.json',boundary);
let post=null,postError=null,postStop=false;
if(artifact&&boundary.status!=='PRESENT'&&killed!=='SAFETY_STOP'){
 try{post=await postCheck(artifact,get(plan.registryPath),directory+'/post-run',async(url,options)=>{
  assert.equal(options?.method??'GET','GET','DIAGNOSTIC_POST_GET_ONLY');const u=new URL(url);assert.equal(u.origin,'https://tabelog.com');assert.equal(u.pathname,'/en/booking/calendar/find_vacancy/');assert.deepEqual([...u.searchParams.keys()].sort(),['rst_id','svd','svps','svt']);return fetch(url,{...options,signal:AbortSignal.timeout(20000)});
 });for(const row of post.rows){if(row.raw){row.comparison=row.raw.status===200?selectionComparison(fs.readFileSync(row.raw.bodyPath,'utf8'),row.displayedTimes??[]):{status:'SELECTION_UNOBSERVED'};if(row.displayedTimes?.length&&row.comparison.status!=='DISPLAYED_TIMES_PRESENT')postStop=true;}}put(directory+'/post-verification.json',post);
 }catch(error){postError=error.message;put(directory+'/post-error.json',{reason:postError});}
}
const d=artifact?.finalSnapshot?.domainState,delivered=d?.presentedResults?.candidateIds?.length??0,healthPath=directory+'/source-health/source-health.json',health=fs.existsSync(healthPath)?get(healthPath):null;
const near=/Native search requires an observed coordinate context/i.test((artifact?JSON.stringify(artifact):'')+fs.readFileSync(directory+'/stderr.txt','utf8'));
const environment=health?.classification==='ENV_FAILURE'||killed==='FORMAL_ENVIRONMENT_FAILURE'||!!postError||artifact?.failureCode==='ENV_FAILURE';
const systemFailure=!!exit.signal&&!['FORMAL_DEADLINE_CLEANUP_GRACE'].includes(killed)||!!d?.failure&&/PROVIDER|UNCAUGHT|AUTHORIZATION|OUTCOME_UNKNOWN/.test(d.failure.code??'');
const next=nextDecision({near,environment,safety:boundary.status==='PRESENT'||killed==='SAFETY_STOP'||postStop,delivered,artifact:!!artifact,terminalPhase:d?.phase,systemFailure,modelCalls:models});
const networkPaths=[];const np='.eval-artifacts/live-preflight';if(fs.existsSync(np))for(const p of fs.readdirSync(np).filter(p=>p.endsWith('.result.json'))){const q=resolve(np,p),j=get(q);if(Date.parse(j.startedAt??0)>=Date.parse(startedAt))networkPaths.push(q);}
const sourcePreflight=directory+'/source-preflight/source-data-preflight.json';const preflightGoogle=(fs.existsSync(sourcePreflight)?get(sourcePreflight).googleRequests??0:0)+networkPaths.reduce((s,p)=>s+(get(p).attempts??[]).filter(a=>a.target==='GOOGLE').length,0);
const summary={label:plan.label,run:n,caseId:plan.caseId,startedAt,finishedAt:new Date().toISOString(),mainline:plan.freezeMain,exit,killed,formalRunStarted:!!formalAt,artifactPath,artifactSha256:artifactPath?sha(fs.readFileSync(artifactPath)):null,phase:d?.phase??null,deliveryCount:delivered,nearDefect:near,capabilityFailureForContinuationOnly:next==='CAPABILITY_NO_DELIVERY_SECOND_ALLOWED',next,evaluation:'DEFERRED_PENDING_INDEPENDENT_WORDING_REVIEW',original18Contribution:0,modelCalls:models,Google:{formal:artifact?.resourceUsage?.googleRequests??null,preflight:preflightGoogle},resourceUsage:artifact?.resourceUsage??null,sourceHealth:healthPath,networkPreflightPaths:networkPaths,postError,postStop,blockedMethod:blockedMethods(artifact),boundaryStatus:boundary.status};put(directory+'/summary.json',summary);console.log(JSON.stringify(summary,null,2));
