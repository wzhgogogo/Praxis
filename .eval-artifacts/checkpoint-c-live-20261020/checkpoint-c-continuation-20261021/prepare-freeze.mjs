// Freeze committed continuation inputs; never starts model/source/Live activity.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createFreeze,sha} from '../freeze.mjs';
import {loadResume} from '../resume.mjs';
import {checkStageBudget,gateWitness} from '../policy.mjs';
import {executionRuns} from '../run-selection.mjs';
const b='.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-continuation-20261021';
const old='.eval-artifacts/checkpoint-c-live-20261020/checkpoint-c-rerun-20261021';
const get=p=>JSON.parse(readFileSync(p));
const write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const config=get(b+'/resume.json'),ledger=get(b+'/ledger-before.json'),prior=get(config.priorFreezePath);
const extras=new Set([...Object.keys(prior.files),config.priorFreezePath,config.priorManifestPath,config.registryPath,b+'/resume.json',b+'/authorization.json',b+'/ledger-before.json',b+'/plan.md',b+'/prior-freeze-verification.json',b+'/offline-validation.json',b+'/offline-controls.log',old+'/live-results/started.json',old+'/live-results/finish.json']);
for(const row of ledger.sources)extras.add(row.path);
for(const p of config.priorReports){const row=get(p);extras.add(p);extras.add(relative(process.cwd(),resolve(row.evaluationPath)));extras.add(p.replace('/run-report.json','/finish.json'));if(row.artifact)extras.add(relative(process.cwd(),resolve(row.artifact)));}
const frozen=createFreeze(b+'/live-freeze.json',[...extras]);
const freezeSha256=sha(readFileSync(b+'/live-freeze.json'));
const plan=get('.eval-artifacts/checkpoint-c-live-20261020/plan.json');
const resume=loadResume(b+'/resume.json',frozen,plan),runs=executionRuns(plan,{resume});
for(const run of runs)gateWitness(get(config.registryPath),run.caseId,Date.now(),plan.ceilings.timeoutMs);
const budget=checkStageBudget(ledger,plan);
for(const source of ledger.sources)if(frozen.files[source.path]!==source.sha256)throw Error('LEDGER_NOT_FROZEN');
write(b+'/live-user-approval.json',{action:'CHECKPOINT_C_RESUME',approvedBy:'USER',source:b+'/authorization.json',authorizingMessage:config.authorizingMessage,freezeSha256,resumeSha256:sha(readFileSync(b+'/resume.json')),registrySha256:sha(readFileSync(config.registryPath)),validUntil:config.hardDeadline,extraUserDirectedEntry:config.extraAttempt,preserveAllPriorRetryCharges:true,noRunIds:true});
const command=['/opt/homebrew/bin/node','--env-file=/Users/wangzhour/Desktop/Wang/Git/Praxis-Zhixing/.env','--import','tsx','.eval-artifacts/checkpoint-c-live-20261020/outer.ts','--mode','LIVE_READ_ONLY','--freeze',b+'/live-freeze.json','--output',b+'/live-results','--approval',b+'/live-user-approval.json','--registry',config.registryPath,'--ledger',b+'/ledger-before.json','--resume',b+'/resume.json'];
write(b+'/launch.json',{command,cwd:process.cwd(),provider:'DEEPSEEK',model:'deepseek-v4-flash',freezeSha256,priorFreezeSha256:config.priorFreezeSha256,remainingRuns:runs.map(r=>r.runId),carriedAttempts:resume.rows.length,caseRetries:Object.fromEntries(resume.caseRetries),totalRerunsIncludingExplicitEntry:resume.totalReruns,hardDeadline:config.hardDeadline,budget,unchangedEvaluator:'restaurant-hybrid-read-diagnostic-evaluator@31',unchangedRubric:'restaurant-hybrid-read-diagnostic-rubric@27'});
console.log(JSON.stringify({status:'READY',freezeSha256,files:Object.keys(frozen.files).length,remaining:runs.map(r=>r.runId),models:0,sourceRequests:0,budget}));
