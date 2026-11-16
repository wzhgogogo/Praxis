/** Frozen development outer orchestration only. Production assembly and all
 * decisions, Guard contracts, completion rules and limits come from the frozen source branch. */
import {readFile,writeFile,mkdir,appendFile} from 'node:fs/promises';
import {resolve,join,dirname,relative} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash,randomInt} from 'node:crypto';
const sha=(s:string|Uint8Array)=>createHash('sha256').update(s).digest('hex');
const script=fileURLToPath(import.meta.url),root=dirname(script),configPath=resolve(process.argv[2]??'');
const json=async(p:string)=>JSON.parse(await readFile(p,'utf8'));
const save=async(p:string,v:unknown)=>writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
let output:string|undefined;
async function main(){
 const frozen=await json(join(root,'configuration-hashes.json'));
 for(const [name,expected] of Object.entries(frozen.files)){if(sha(await readFile(join(root,name)))!==expected)throw Error('FROZEN_CONFIGURATION_MISMATCH');}
 if(!['d02v','d8'].some(name=>join(root,name,'config.json')===configPath))throw Error('UNAUTHORIZED_CONFIGURATION');
 const c=await json(configPath),git=(...args:string[])=>execFileSync('git',['-C',c.sourceRoot,...args],{encoding:'utf8'}).trim();
 if(git('rev-parse','HEAD')!==c.sourceSHA||git('branch','--show-current')!==c.sourceBranch||git('status','--porcelain'))throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
 const artifactRelative=relative(resolve(c.evidenceRoot,'.eval-artifacts'),resolve(c.output));
 if(git('diff',c.sourceCodeSHA,c.sourceSHA,'--','src','web-skills'))throw Error('FROZEN_SOURCE_CODE_MISMATCH');
 if(resolve(process.cwd())!==resolve(c.evidenceRoot)||!artifactRelative||artifactRelative.startsWith('..'))throw Error('OUTPUT_ARTIFACT_ROOT_MISMATCH');
 if(process.env.PRAXIS_RUN_SEED_REMAINING!=='1'||!process.execArgv.some(a=>a.startsWith('--env-file=')))throw Error('AUTHORIZATION_AND_ENV_FILE_REQUIRED');
 if(sha(await readFile(c.environmentFile))!==frozen.envFileSHA256)throw Error('ENV_FILE_CHANGED');
 const load=(name:string)=>import(pathToFileURL(join(c.sourceRoot,'src/eval/restaurant/agent-loop/g6',name)).href);
 const {d02vSpec,developmentReviewOnly,seedInvocation}=await load('run-seed-remaining.ts');
 const {runG6Batch}=await load('runner.ts'),{liveG6Dependencies,createG6LiveBrowser}=await load('live-transports.ts');
 const {frozenHoldoutReadRules,recordedEnvironmentFailure}=await load('holdout-runner.ts');
 const {checkHoldoutNetwork}=await load('holdout-health.ts'),{createWitnessReader}=await load('witness.ts'),{chargeG6}=await load('budget.ts');
 const {sanitizePublicJson}=await import(pathToFileURL(join(c.sourceRoot,'src/eval/restaurant/agent-loop/runners/browser-read-recording.ts')).href);
 const {GooglePlacesHarCapture}=await import(pathToFileURL(join(c.sourceRoot,'src/eval/restaurant/agent-loop/runners/google-places-recording.ts')).href);
 const ledger=await json(c.budget),limits={fullLive:1,evaluationPublicGET:8,realModelCalls:50,environmentReruns:0};
 if(ledger.status!=='APPROVED_FOR_EXECUTION'||JSON.stringify(ledger.limits)!==JSON.stringify(limits)||ledger.cumulative.fullLive>=1||ledger.cumulative.evaluationPublicGET+7>8||ledger.cumulative.realModelCalls+50>50)throw Error('NEW_AUTHORIZED_BUDGET_INSUFFICIENT');
 if(!['fullLive','evaluationPublicGET','realModelCalls','environmentReruns','googleRequests','restaurantWebsiteRequests'].every(key=>Number.isSafeInteger(ledger.cumulative[key])&&ledger.cumulative[key]===0))throw Error('NEW_AUTHORIZED_BUDGET_INSUFFICIENT');
 const specs=await json(join(dirname(configPath),'specs.json'));
 if(!Array.isArray(specs)||specs.length<1||specs.length>2||specs.some(s=>s.id!==c.id))throw Error('FROZEN_CASE_MISMATCH');
 const rules=await frozenHoldoutReadRules();for(const s of specs){if(sha(JSON.stringify(s.oracle.reviewedReadRules))!==sha(JSON.stringify(rules)))throw Error('FROZEN_CASE_MISMATCH');}
 let spec=specs[0];
 let previous=c.previousFinishedAtMs??0;
 if(c.previousOutput){const p=await json(join(c.previousOutput,'development-receipt.json'));if(p.verdict?.s0||['S0_STOP','ENVIRONMENT_FAILURE_AFTER_HEALTH','INDEPENDENT_EVALUATION_MISSING','INDEPENDENT_EVIDENCE_REVIEW_REQUIRED'].includes(p.stopReason)||p.sourceSHA!==c.sourceSHA)throw Error('PREVIOUS_STOP_OR_MISMATCH');previous=p.finishedAtMs;}
 const invocation=seedInvocation(c.mode,ledger.entries,previous);output=c.output;await mkdir(output,{recursive:false});
 const delayMs=randomInt(c.spacingMs.minimum,c.spacingMs.maximum+1),waitedMs=Math.max(0,delayMs-(Date.now()-invocation.previousFinishedAtMs));
 await save(join(output,'input-hashes.json'),{sourceSHA:c.sourceSHA,configSHA256:sha(await readFile(configPath)),orchestrationSHA256:sha(await readFile(script)),caseSHA256:sha(JSON.stringify(spec)),reviewedReadRulesSHA256:sha(JSON.stringify(spec.oracle.reviewedReadRules)),attemptId:invocation.attemptId});
 await save(join(output,'start-spacing.json'),{delayMs,waitedMs,previousFinishedAtMs:invocation.previousFinishedAtMs});
 console.log(JSON.stringify({mode:c.mode,stage:'SPACING',waitedMs}));
 if(waitedMs)await new Promise(r=>setTimeout(r,waitedMs));
 const deps=liveG6Dependencies(process.env,c.budget),timing={last:Math.max(-Infinity,...ledger.entries.filter((e:any)=>e.evaluationPublicGET===1).map((e:any)=>Date.parse(e.recordedAtUTC)).filter(Number.isFinite))};
 const pace=async()=>{const ms=5000-(Date.now()-timing.last);if(ms>0)await new Promise(r=>setTimeout(r,ms));timing.last=Date.now();};
 console.log(JSON.stringify({mode:c.mode,stage:'WITNESS'}));
 const capture=new GooglePlacesHarCapture(()=>{});capture.registerCredentials(deps.ownCredentials??[]);
 const witness=createWitnessReader({directory:join(output,'certification'),budgetPath:c.budget,runId:invocation.attemptId,fetch:deps.witnessFetch,requestTiming:timing,
  sanitizeResponse:(text:string)=>{if(!capture.accept(text,'RESPONSE')||capture.rejectsRecording)return;return sanitizePublicJson(text);}});
 let certificate;const certificates=[];
 for(const choice of specs){const result=await witness.read(choice.witness,'BEFORE',false);certificates.push(result);await save(join(output,'certificate-'+certificates.length+'.json'),result);if(result.exists===true){spec=choice;certificate=result;break;}}
 if(!certificate)throw Error('WITNESS_NOT_AVAILABLE');
 await save(join(output,'certified-selection.json'),{spec,certificate,preRunWitnessGETs:certificates.length});
 console.log(JSON.stringify({mode:c.mode,stage:'HEALTH'}));
 const health=await checkHoldoutNetwork({browser:createG6LiveBrowser(process.env),tabelogDetailUrl:spec.witness.detailUrl,beforeGET:async(source:string,round:number)=>{await pace();await chargeG6(c.budget,invocation.attemptId+':HEALTH:'+source+':'+round,'evaluationPublicGET','User2026-11-16: one D8 after G1 closeout main freeze; existing60s window');}});
 await save(join(output,'network-health.json'),health);if(!health.passed)throw Error('NETWORK_HEALTH_FAILED');
 // Observation only: code/status metadata, no raw provider error text; never
 // issue a replacement call, alter a model request, or swallow its failure.
 const originalTransports=deps.transports;
 deps.transports=async(...args:any[])=>{
  const t=await originalTransports(...args),originalModel=t.model;
  return {...t,model:{async complete(request:any){
   try{return await originalModel.complete(request);}catch(error){
    try{
     const e=error as {code?:string;providerStatus?:number;providerError?:{code?:string;type?:string;message?:string}};
     const data={atUTC:new Date().toISOString(),purpose:request.purpose,schemaVersion:request.outputSchema.version,errorCode:e.code??'UNKNOWN',providerStatus:Number.isInteger(e.providerStatus)?e.providerStatus:null};
     const safe=sanitizePublicJson(JSON.stringify(data));
     if(safe&&capture.accept(safe,'RESPONSE')&&!capture.rejectsRecording)await appendFile(join(output!,'provider-failures.jsonl'),safe+'\n');
    }catch{/* Auxiliary diagnostics must never change the original result. */}
    throw error;
   }
  }}};
 };
 const fetch=deps.witnessFetch;deps.witnessFetch=async(...args:any[])=>{await pace();return fetch(...args);};
 console.log(JSON.stringify({mode:c.mode,stage:'LIVE'}));
 const batch=await runG6Batch({schemaVersion:'phase3b-g6-pack@1',mode:'LIVE_READ',recording:c.recording,cases:[spec]},
  {...deps,witnessDetailRead:false,maximumWitnessGETs:certificates.length+2,initialWitnesses:[certificate],initialWitnessGETs:certificates.length},join(output,'runtime'));
 const slot=join(output,'runtime',c.id),e=await json(join(slot,'evaluation.json')).catch(()=>null),environment=await recordedEnvironmentFailure(slot),reviewOnly=!!e&&developmentReviewOnly(e);
 const delivered=await json(join(slot,'evaluation.input.json')).then((v:any)=>v.delivered.length).catch(()=>null);
 const stop=e?.verdict.s0?'S0_STOP':environment?'ENVIRONMENT_FAILURE_AFTER_HEALTH':!e?'INDEPENDENT_EVALUATION_MISSING':e.verdict.stopBatch&&!reviewOnly?'INDEPENDENT_EVIDENCE_REVIEW_REQUIRED':null;
 const receipt={wallFinishedAtUTC:new Date().toISOString(),selectedDate:spec.witness.date,deliveredCount:delivered,sourceSHA:c.sourceSHA,mode:c.mode,attemptId:invocation.attemptId,finishedAtMs:Date.now(),originalBatch:batch,developmentStatus:reviewOnly?'PENDING_REVIEW':e?.verdict.status??'MISSING',evaluationUnchanged:true,stopReason:stop,verdict:e?.verdict??null};
 await save(join(output,'development-receipt.json'),receipt);console.log(JSON.stringify(receipt));if(stop)process.exitCode=1;
}
main().catch(async error=>{const known=['FROZEN_SOURCE_CODE_MISMATCH','OUTPUT_ARTIFACT_ROOT_MISMATCH','FROZEN_CONFIGURATION_MISMATCH','UNAUTHORIZED_CONFIGURATION','FROZEN_CLEAN_SOURCE_REQUIRED','AUTHORIZATION_AND_ENV_FILE_REQUIRED','ENV_FILE_CHANGED','NEW_AUTHORIZED_BUDGET_INSUFFICIENT','FROZEN_CASE_MISMATCH','PREVIOUS_STOP_OR_MISMATCH','WITNESS_NOT_AVAILABLE','NETWORK_HEALTH_FAILED'];const message=error instanceof Error?error.message:'';const code=known.includes(message)?message:'UNCLASSIFIED_OUTER_EXCEPTION';if(output)await save(join(output,'outer-failure.json'),{code,at:new Date().toISOString(),retry:false}).catch(()=>{});console.error(JSON.stringify({status:'STOPPED',code}));process.exitCode=1;});
