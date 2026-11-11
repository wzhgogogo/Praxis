import {randomInt} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validatePrivateManifest,holdoutHash} from '../holdout-protocol.js';
import {verifyHoldoutCommitment,type HoldoutCommitment} from '../holdout-commitment.js';
import {certifyPrivateHoldout} from './holdout-certify.js';
import {runPrivateHoldout,holdoutExecutionPlan} from './holdout-runner.js';
import {runHealthOnly} from './health-only.js';
import {restaurantDiscoveryPacks} from '../../../../integrations/restaurant-search/source-packs.js';
import {checkHoldoutNetwork} from './holdout-health.js';
import {liveG6Dependencies,createG6LiveBrowser} from './live-transports.js';
export function parseHoldoutReviews(args:string[]){
 const reviews:Array<{key:string;file:string}>=[];
 for(let i=0;i<args.length;i++)if(args[i]==='--review'){
  const key=args[i+1],file=args[i+2];if(!args.includes('--resume')||!key||key.startsWith('--')||!file||file.startsWith('--')||reviews.some(r=>r.key===key))throw Error('HOLDOUT_REVIEW_ARGUMENTS_INVALID');
  reviews.push({key,file});i+=2;
 }
 return reviews;
}
/** Importing/--validate-only never starts Chromium or constructs API clients. */
export async function main(args:string[]){
 const flag=(name:string)=>{const i=args.indexOf(name);if(i<0||!args[i+1])throw Error('MISSING_ARGUMENT');return args[i+1]!;};
 const healthOnly=args.includes('--health-only');
 if(!healthOnly&&['--rounds','--interval-minutes','--health-output','--tabelog-url'].some(f=>args.includes(f)))throw Error('HEALTH_ONLY_ARGUMENT_MODE_INVALID');
 if(healthOnly){
  if(['--original','--manifest','--manifest-sha256','--commitment','--resume','--review','--certify-only','--cases','--repetitions','--output','--validate-only'].some(f=>args.includes(f)))throw Error('HEALTH_ONLY_ARGUMENT_MODE_INVALID');
  if(process.env.PRAXIS_RUN_HEALTH_ONLY!=='1'||!process.execArgv.some(a=>a.startsWith('--env-file')))throw Error('HEALTH_ONLY_AUTHORIZATION_AND_ENV_FILE_REQUIRED');
  const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();if(sourceSHA!==flag('--source-sha')||execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
  const result=await runHealthOnly({sourceSHA,directory:resolve(flag('--health-output')),budgetPath:resolve(flag('--budget')),rounds:Number(flag('--rounds')),intervalMinutes:Number(flag('--interval-minutes')),tabelogUrl:args.includes('--tabelog-url')?flag('--tabelog-url'):restaurantDiscoveryPacks.find(p=>p.meta.id==='tabelog')!.browser!.startupUrl!},{browser:createG6LiveBrowser(process.env)});
  console.log(JSON.stringify({status:'HEALTH_ONLY_COMPLETE',GETs:result.GETs,models:0,Live:0,rounds:result.rounds.length}));return;
 }
 const certifyOnly=args.includes('--certify-only');
 if(certifyOnly&&['--resume','--output','--review','--validate-only'].some(f=>args.includes(f))||!certifyOnly&&args.includes('--certify-output'))throw Error('HOLDOUT_CERTIFICATION_MODE_CONFLICT');
 if(args.indexOf('--cases')!==args.lastIndexOf('--cases'))throw Error('HOLDOUT_CERTIFICATION_CASES_MODE_INVALID');
 const caseIds=args.includes('--cases')?flag('--cases').split(','):undefined;
 const repetitions=args.includes('--repetitions')?Number(flag('--repetitions')):undefined;
 if(args.indexOf('--repetitions')!==args.lastIndexOf('--repetitions')||certifyOnly&&repetitions!==undefined
   ||repetitions!==undefined&&(!/^[1-3]$/.test(flag('--repetitions'))))throw Error('HOLDOUT_RUN_SELECTION_INVALID');
 const selection={...(caseIds?{caseIds}:{}),...(repetitions!==undefined?{repetitions}:{})};
 const reviews=parseHoldoutReviews(args);
 if(args.includes('--resume')&&args.includes('--output'))throw Error('HOLDOUT_OUTPUT_MODE_CONFLICT');
 const originalPath=resolve(flag('--original')),manifestPath=resolve(flag('--manifest'));
 for(const path of [originalPath,manifestPath]){const r=relative(process.cwd(),path);if(!r.startsWith('..'))throw Error('PRIVATE_INPUT_MUST_STAY_OUTSIDE_REPOSITORY');}
 const commitmentPath=args.includes('--commitment')?resolve(flag('--commitment')):new URL('../../../../../.eval-artifacts/phase3b-holdout/commitment.json',import.meta.url);
 const commitmentBytes=await readFile(commitmentPath),commitment=JSON.parse(commitmentBytes.toString())as HoldoutCommitment;
 const original=await readFile(originalPath);verifyHoldoutCommitment(original,commitment);
 const manifestBytes=await readFile(manifestPath);
 if(holdoutHash(manifestBytes)!==flag('--manifest-sha256'))throw Error('HOLDOUT_MANIFEST_SHA_MISMATCH');
 const checked=validatePrivateManifest(original,commitment,manifestBytes);
 Object.assign(checked.audit,{commitmentSHA256:holdoutHash(commitmentBytes)},certifyOnly?{}:holdoutExecutionPlan(checked.manifest,selection).audit);
 if(args.includes('--validate-only')){console.log(JSON.stringify(checked.audit));return;}
 if(process.env.PRAXIS_RUN_HOLDOUT_LIVE!=='1'||!process.execArgv.some(a=>a.startsWith('--env-file')))throw Error('HELDOUT_AUTHORIZATION_AND_ENV_FILE_REQUIRED');
 const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(sourceSHA!==flag('--source-sha')||execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
 // User approved 2026-11-10: R2 limits models2800 / GET220 / Live36 / environment4.
 const budgetPath=resolve(flag('--budget')),ledger=JSON.parse(await readFile(budgetPath,'utf8'));
 if(ledger.status!=='APPROVED_FOR_EXECUTION'||!Number.isSafeInteger(ledger.cumulative?.realModelCalls)||ledger.cumulative.realModelCalls<849||ledger.limits?.realModelCalls!==2800||ledger.limits?.evaluationPublicGET!==220||ledger.limits?.fullLive!==36||ledger.limits?.environmentReruns!==4)throw Error('HELDOUT_BUDGET_SCOPE_MISMATCH');
 if(certifyOnly){
  const result=await certifyPrivateHoldout(checked.manifest,{...checked.audit,sourceSHA},resolve(flag('--certify-output')),{budgetPath,fetch,
   ...(caseIds?{caseIds}:{}),ownCredentials:[process.env.GOOGLE_MAPS_API_KEY??'',process.env.DEEPSEEK_API_KEY??'']});
  console.log(JSON.stringify({status:'CERTIFIED_ONLY',GETs:result.GETs,models:0,fullLive:0}));return;
 }
 const dependencies=liveG6Dependencies(process.env,budgetPath);
 const result=await runPrivateHoldout(checked.manifest,{...checked.audit,sourceSHA},resolve(flag(args.includes('--resume')?'--resume':'--output')),{g6:dependencies,
  startDelayMs:()=>randomInt(120_000,240_001),
  health:(spec,beforeGET)=>checkHoldoutNetwork({browser:createG6LiveBrowser(process.env),tabelogDetailUrl:spec.witness!.detailUrl,beforeGET})},{resume:args.includes('--resume'),...(reviews.length?{reviews}:{}),...selection});
 console.log(JSON.stringify({status:result.stopReason?'STOPPED':'COMPLETED',stopReason:result.stopReason,attempts:result.receipts.length,pendingReviewCount:result.pendingReviewCount??0,passRateReportable:result.passRateReportable??false,batchStatus:result.status??null}));
 if(result.stopReason)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main(process.argv.slice(2)).catch(()=>{console.error('Held-out refused or stopped. Private inputs and credentials omitted. Inspect the hash audit and structured run evidence.');process.exitCode=1;});
