import {readFileSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {resolve,relative} from 'node:path';
import {createFreeze,sha} from '../freeze.mjs';import {loadResume} from '../resume.mjs';import {executionRuns} from '../run-selection.mjs';import {checkStageBudget,gateWitness} from '../policy.mjs';
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/c17-environment-retry-20261022`,offline=process.argv[2]==='offline';
const read=p=>JSON.parse(readFileSync(p)),put=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'}),config=read(`${dir}/resume.json`),ledger=read(`${dir}/ledger-before.json`);
const refs=new Set([`${dir}/resume.json`,`${dir}/ledger-before.json`,`${dir}/authorization.json`,`${dir}/plan.md`,config.priorManifestPath,config.priorInputsPath,config.acceptanceGatesPath,config.acceptanceDisplayGatePath,config.reviewPath,config.registryPath,`${base}/c18-bidirectional-acceptance-20261022/delivery-freeze.json`,`${base}/checkpoint-c-continuation-20261021/independent-review.md`,`${dir}/offline-controls.log`,`${dir}/evidence-controls.log`,`${dir}/outer-typecheck-final.log`]);
for(const p of Object.keys(read(config.priorManifestPath).files))refs.add(p);
for(const s of ledger.sources)refs.add(s.path);
const registry=read(config.registryPath);for(const v of registry.variants)for(const w of v.witnesses)for(const r of w.observationRefs??[])refs.add(relative(process.cwd(),resolve(r.path)));
for(const p of execFileSync('git',['ls-files','-z',dir],{encoding:'utf8',maxBuffer:32*1024*1024}).split('\0').filter(Boolean))refs.add(p);
for(const p of refs)readFileSync(p);
const output=`${dir}/${offline?'offline':'live'}-freeze.json`,manifest=createFreeze(output,[...refs]),freezeSha256=sha(readFileSync(output));
const plan=read(`${base}/plan.json`),resume=loadResume(`${dir}/resume.json`,manifest,plan),runs=executionRuns(plan,{resume});
const budget=checkStageBudget(ledger,{...plan,runs,maxTotalReruns:0});if(budget.remaining.environmentReruns<1)throw Error('ENV_RETRY_BUDGET_EXHAUSTED');
if(!offline){for(const run of runs)gateWitness(registry,run.caseId,Date.now(),500000);if(Date.now()+500000>=Date.parse(config.hardDeadline))throw Error('C17_DEADLINE');
 put(`${dir}/live-user-approval.json`,{action:'CHECKPOINT_C_RESUME',approvedBy:'USER',source:`${dir}/authorization.json`,freezeSha256,resumeSha256:sha(readFileSync(`${dir}/resume.json`)),registrySha256:sha(readFileSync(config.registryPath)),validUntil:config.hardDeadline,formalEnvironmentRetry:1,formalRunIds:['c-17'],noAdditionalFormalRetry:true});
 put(`${dir}/launch.json`,{command:['/opt/homebrew/bin/node','--env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env','--import','tsx',`${base}/outer.ts`,'--mode','LIVE_READ_ONLY','--freeze',output,'--output',`${dir}/live-results`,'--approval',`${dir}/live-user-approval.json`,'--registry',config.registryPath,'--ledger',`${dir}/ledger-before.json`,'--resume',`${dir}/resume.json`],cwd:process.cwd(),freezeSha256,budget,runIds:['c-17'],evaluator:plan.evaluator,rubric:plan.rubric,deadline:config.hardDeadline});
}
console.log(JSON.stringify({status:offline?'OFFLINE_READY':'LIVE_READY',freezeSha256,files:Object.keys(manifest.files).length,runs:runs.map(r=>r.runId),budget,modelCalls:0,sourceRequests:0}));
