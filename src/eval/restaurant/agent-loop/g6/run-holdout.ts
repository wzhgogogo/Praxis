import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validatePrivateManifest,holdoutHash} from '../holdout-protocol.js';
import {verifyHoldoutCommitment,type HoldoutCommitment} from '../holdout-commitment.js';
import {certifyPrivateHoldout} from './holdout-certify.js';
import {runPrivateHoldout} from './holdout-runner.js';
import {checkHoldoutNetwork} from './holdout-health.js';
import {liveG6Dependencies,createG6LiveBrowser} from './live-transports.js';
/** Importing/--validate-only never starts Chromium or constructs API clients. */
export async function main(args:string[]){
 const flag=(name:string)=>{const i=args.indexOf(name);if(i<0||!args[i+1])throw Error('MISSING_ARGUMENT');return args[i+1]!;};
 const certifyOnly=args.includes('--certify-only');
 if(certifyOnly&&['--resume','--output','--review','--validate-only'].some(f=>args.includes(f))||!certifyOnly&&args.includes('--certify-output'))throw Error('HOLDOUT_CERTIFICATION_MODE_CONFLICT');
 if(args.includes('--cases')&&!certifyOnly||args.indexOf('--cases')!==args.lastIndexOf('--cases'))throw Error('HOLDOUT_CERTIFICATION_CASES_MODE_INVALID');
 const caseIds=args.includes('--cases')?flag('--cases').split(','):undefined;
 const reviewIndex=args.indexOf('--review');
 if(reviewIndex>=0&&(!args.includes('--resume')||!args[reviewIndex+1]||!args[reviewIndex+2]||args[reviewIndex+2]!.startsWith('--')))throw Error('HOLDOUT_REVIEW_ARGUMENTS_INVALID');
 if(args.includes('--resume')&&args.includes('--output'))throw Error('HOLDOUT_OUTPUT_MODE_CONFLICT');
 const originalPath=resolve(flag('--original')),manifestPath=resolve(flag('--manifest'));
 for(const path of [originalPath,manifestPath]){const r=relative(process.cwd(),path);if(!r.startsWith('..'))throw Error('PRIVATE_INPUT_MUST_STAY_OUTSIDE_REPOSITORY');}
 const commitment=JSON.parse(await readFile(new URL('../../../../../.eval-artifacts/phase3b-holdout/commitment.json',import.meta.url),'utf8'))as HoldoutCommitment;
 const original=await readFile(originalPath);verifyHoldoutCommitment(original,commitment);
 const manifestBytes=await readFile(manifestPath);
 if(holdoutHash(manifestBytes)!==flag('--manifest-sha256'))throw Error('HOLDOUT_MANIFEST_SHA_MISMATCH');
 const checked=validatePrivateManifest(original,commitment,manifestBytes);
 if(args.includes('--validate-only')){console.log(JSON.stringify(checked.audit));return;}
 if(process.env.PRAXIS_RUN_HOLDOUT_LIVE!=='1'||!process.execArgv.some(a=>a.startsWith('--env-file')))throw Error('HELDOUT_AUTHORIZATION_AND_ENV_FILE_REQUIRED');
 const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(sourceSHA!==flag('--source-sha')||execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
 const budgetPath=resolve(flag('--budget')),ledger=JSON.parse(await readFile(budgetPath,'utf8'));
 if(ledger.status!=='APPROVED_FOR_EXECUTION'||!Number.isSafeInteger(ledger.cumulative?.realModelCalls)||ledger.cumulative.realModelCalls<849||ledger.limits?.realModelCalls!==2500||ledger.limits?.evaluationPublicGET!==126||ledger.limits?.fullLive!==22||ledger.limits?.environmentReruns!==4)throw Error('HELDOUT_BUDGET_SCOPE_MISMATCH');
 if(certifyOnly){
  const result=await certifyPrivateHoldout(checked.manifest,{...checked.audit,sourceSHA},resolve(flag('--certify-output')),{budgetPath,fetch,
   ...(caseIds?{caseIds}:{}),ownCredentials:[process.env.GOOGLE_MAPS_API_KEY??'',process.env.DEEPSEEK_API_KEY??'']});
  console.log(JSON.stringify({status:'CERTIFIED_ONLY',GETs:result.GETs,models:0,fullLive:0}));return;
 }
 const dependencies=liveG6Dependencies(process.env,budgetPath);
 const result=await runPrivateHoldout(checked.manifest,{...checked.audit,sourceSHA},resolve(flag(args.includes('--resume')?'--resume':'--output')),{g6:dependencies,
  health:(spec,beforeGET)=>checkHoldoutNetwork({browser:createG6LiveBrowser(process.env),tabelogDetailUrl:spec.witness!.detailUrl,beforeGET})},{resume:args.includes('--resume'),...(reviewIndex>=0?{review:{key:args[reviewIndex+1]!,file:args[reviewIndex+2]!}}:{})});
 console.log(JSON.stringify({status:result.stopReason?'STOPPED':'COMPLETED',stopReason:result.stopReason,attempts:result.receipts.length}));
 if(result.stopReason)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main(process.argv.slice(2)).catch(()=>{console.error('Held-out refused or stopped. Private inputs and credentials omitted. Inspect the hash audit and structured run evidence.');process.exitCode=1;});
