import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {validatePrivateManifest,holdoutHash} from '../holdout-protocol.js';
import type {HoldoutCommitment} from '../holdout-commitment.js';
import {runPrivateHoldout} from './holdout-runner.js';
import {checkHoldoutNetwork} from './holdout-health.js';
import {liveG6Dependencies,createG6LiveBrowser} from './live-transports.js';
/** Importing/--validate-only never starts Chromium or constructs API clients. */
export async function main(args:string[]){
 const flag=(name:string)=>{const i=args.indexOf(name);if(i<0||!args[i+1])throw Error('MISSING_ARGUMENT');return args[i+1]!;};
 const originalPath=resolve(flag('--original')),manifestPath=resolve(flag('--manifest'));
 for(const path of [originalPath,manifestPath]){const r=relative(process.cwd(),path);if(!r.startsWith('..'))throw Error('PRIVATE_INPUT_MUST_STAY_OUTSIDE_REPOSITORY');}
 const original=await readFile(originalPath),manifestBytes=await readFile(manifestPath);
 if(holdoutHash(manifestBytes)!==flag('--manifest-sha256'))throw Error('HOLDOUT_MANIFEST_SHA_MISMATCH');
 const commitment=JSON.parse(await readFile(new URL('../../../../../.eval-artifacts/phase3b-holdout/commitment.json',import.meta.url),'utf8'))as HoldoutCommitment;
 const checked=validatePrivateManifest(original,commitment,manifestBytes);
 if(args.includes('--validate-only')){console.log(JSON.stringify(checked.audit));return;}
 if(process.env.PRAXIS_RUN_HOLDOUT_LIVE!=='1'||!process.execArgv.some(a=>a.startsWith('--env-file')))throw Error('HELDOUT_AUTHORIZATION_AND_ENV_FILE_REQUIRED');
 const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 if(sourceSHA!==flag('--source-sha')||execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
 const budgetPath=resolve(flag('--budget')),ledger=JSON.parse(await readFile(budgetPath,'utf8'));
 if(ledger.status!=='APPROVED_FOR_EXECUTION'||!Number.isSafeInteger(ledger.cumulative?.realModelCalls)||ledger.cumulative.realModelCalls<849||ledger.limits?.realModelCalls!==2500||ledger.limits?.evaluationPublicGET!==126||ledger.limits?.fullLive!==18||ledger.limits?.environmentReruns!==4)throw Error('HELDOUT_BUDGET_SCOPE_MISMATCH');
 // Independently transcribed approved contracts; no generation from Guard policy.
 const rules=JSON.parse(await readFile(new URL('../../../../../.eval-artifacts/phase3b/d8-direct-outlet-live-20261109/D8-pack.json',import.meta.url),'utf8')).cases[0].oracle.reviewedReadRules;
 if(rules.length!==21)throw Error('FROZEN_READ_CONTRACTS_MISSING');
 for(const c of checked.manifest.cases){if(JSON.stringify(c.oracle.reviewedReadRules)!==JSON.stringify(rules))throw Error('HOLDOUT_READ_CONTRACTS_MISMATCH');}
 const dependencies=liveG6Dependencies(process.env,budgetPath);
 const result=await runPrivateHoldout(checked.manifest,{...checked.audit,sourceSHA},resolve(flag('--output')),{g6:dependencies,
  health:(spec,beforeGET)=>checkHoldoutNetwork({browser:createG6LiveBrowser(process.env),tabelogDetailUrl:spec.witness!.detailUrl,beforeGET})});
 console.log(JSON.stringify({status:result.stopReason?'STOPPED':'COMPLETED',stopReason:result.stopReason,attempts:result.receipts.length}));
 if(result.stopReason)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main(process.argv.slice(2)).catch(()=>{console.error('Held-out refused or stopped. Private inputs and credentials omitted. Inspect the hash audit and structured run evidence.');process.exitCode=1;});
