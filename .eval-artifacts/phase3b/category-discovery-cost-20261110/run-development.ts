// Frozen development orchestration only. No private held-out inputs or runner.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {loadG6Pack,runG6Batch} from '../../../src/eval/restaurant/agent-loop/g6/runner.js';
import {createG6LiveBrowser,liveG6Dependencies} from '../../../src/eval/restaurant/agent-loop/g6/live-transports.js';
import {checkHoldoutNetwork} from '../../../src/eval/restaurant/agent-loop/g6/holdout-health.js';
import {chargeG6} from '../../../src/eval/restaurant/agent-loop/g6/budget.js';
const root=resolve('.eval-artifacts/phase3b/category-discovery-cost-20261110'),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const flag=(name:string)=>{const i=process.argv.indexOf(name);if(i<0||!process.argv[i+1])throw Error('Missing '+name);return process.argv[i+1]!;};
const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(sourceSHA!==flag('--source-sha')||execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
const plan=JSON.parse(await readFile(join(root,'input-hashes.json'),'utf8'));
for(const [p,h]of Object.entries(plan.files))if(hash(await readFile(join(root,p)))!==h)throw Error('FROZEN_INPUT_MISMATCH');
if(process.argv.includes('--validate-only')){console.log(JSON.stringify({valid:true,sourceSHA,sourceGET:0,models:0,Live:0}));process.exit(0);}
if(process.env.PRAXIS_RUN_DEVELOPMENT_LIVE!=='1'||!process.execArgv.some(x=>x.startsWith('--env-file')))throw Error('AUTHORIZATION_AND_ENV_FILE_REQUIRED');
const runtime=join(root,'runtime');await mkdir(runtime,{recursive:false});
const originalLedger=await readFile(flag('--budget-parent')),parent=JSON.parse(originalLedger.toString());
if(hash(originalLedger)!==plan.parentLedgerSHA256||parent.cumulative.fullLive!==10||parent.cumulative.evaluationPublicGET!==73||parent.cumulative.realModelCalls!==1332)throw Error('BUDGET_PARENT_CHANGED');
const ledger=join(runtime,'budget-development.json');parent.limits.fullLive=26;parent.authorization='User 2026-11-10 three-blocker repair: D01/D02 one Live each, GET<=14, per-turn50; limits26/126/2500 unchanged; no further Live.';parent.parentLedgerSHA256=hash(originalLedger);parent.scope="D01/D02 development only; inherited10 Live/73 GET/1332 models; original425 preserved";
await writeFile(ledger,JSON.stringify(parent,null,2)+'\n',{flag:'wx'});
let lastGET=-Infinity;const pace=async()=>{const delay=5000-(Date.now()-lastGET);if(delay>0)await new Promise(r=>setTimeout(r,delay));lastGET=Date.now();};
const receipts:unknown[]=[];let stopReason:string|undefined;
for(const id of ['D01','D02']){
 const packBytes=await readFile(join(root,id+'-pack.json')),pack=await loadG6Pack(join(root,id+'-pack.json'),hash(packBytes));
 const health=await checkHoldoutNetwork({browser:createG6LiveBrowser(process.env),tabelogDetailUrl:pack.cases[0]!.witness!.detailUrl,beforeGET:async(source,round)=>{await pace();await chargeG6(ledger,sourceSHA+':'+id+':HEALTH:'+source+':'+round,'evaluationPublicGET','User-approved development health; source scripts two rounds,10s cutoff, no Live.');}});
 await writeFile(join(runtime,id+'-network-health.json'),JSON.stringify(health,null,2)+'\n',{flag:'wx'});
 if(!health.passed){stopReason='HEALTH_FAILED';receipts.push({id,status:'CANCELLED_BEFORE_LIVE'});break;}
 const deps=liveG6Dependencies(process.env,ledger),transport=deps.witnessFetch;
 deps.witnessFetch=async(url,init)=>{await pace();return transport(url,init);};
 const batch=await runG6Batch(pack,{...deps,witnessDetailRead:false,maximumWitnessGETs:3},join(runtime,id));
 receipts.push({id,batch});await writeFile(join(runtime,'batch.json'),JSON.stringify({sourceSHA,receipts,stopReason:batch.stopReason??null},null,2)+'\n');
 // Keep independent-evidence stops observable. No retries or manual intervention.
 if(batch.stopReason){stopReason=batch.stopReason;break;}
}
await writeFile(join(runtime,'batch.json'),JSON.stringify({sourceSHA,receipts,stopReason:stopReason??null},null,2)+'\n');
console.log(JSON.stringify({sourceSHA,receipts,stopReason:stopReason??null}));
