import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {loadCommittedCases,materializeCases,runnerYaml,executionPlan,sha} from '../../phase2b-exit-pipeline-20261022/inputs.mjs';
export const base='.eval-artifacts/phase2c-holdout/exit-live-20261023';
const h='.eval-artifacts/phase2c-holdout',w=h+'/witness-certification-20261023';
const get=p=>JSON.parse(fs.readFileSync(p)),put=(n,v)=>fs.writeFileSync(base+'/'+n,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
for(const [p,hash] of Object.entries(get(w+'/certification-package.json').files))assert.equal(sha(fs.readFileSync(p)),hash,p);
const registry=get(w+'/registry.json');assert.equal(registry.status,'CERTIFIED_WITH_ONE_PREAPPROVED_EXCLUSION');
assert.deepEqual(registry.variants.map(v=>v.witnesses.length),[1,1,0,1,1,1]);
const cases=loadCommittedCases(fs.readFileSync(h+'/holdout.yaml'),get(h+'/commitment.json'));
const fallback=get(w+'/fallback-03.json'),dates=get(h+'/exit-dates.json');
assert.equal(fallback.caseId,'p2c-holdout-03');
const projection=materializeCases(cases,'2026-10-23T00:00:00+09:00',[{caseId:'p2c-holdout-03',place:'Kudanshita',classification:'PRIMARY_BUSINESS_WITNESS_NOT_CERTIFIED',reviewPath:w+'/fallback-03.json',reviewSha256:sha(fs.readFileSync(w+'/fallback-03.json'))}]);
for(const c of projection.cases){assert.equal(c.semantic.date.value,dates.cases[c.id].date);assert.equal(c.semantic.date.expression,dates.cases[c.id].content);}
fs.writeFileSync(base+'/runner-input.yaml',runnerYaml(projection.cases),{flag:'wx'});
put('input-transformation.json',{source:h+'/holdout.yaml',sourceSha256:sha(fs.readFileSync(h+'/holdout.yaml')),changes:projection.changes,network:0,models:0});
const ledgerSource='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/resume-20261023/exit-live/ledger-after.json';
const ledger=get(ledgerSource);assert.equal(ledger.totalModelCalls,3634);assert.equal(ledger.totalFullLiveRuns,72);assert.equal(ledger.environmentReruns,3);
for(const path of ['.eval-artifacts/phase2c-location-semantic-20261023/semantic/calls.jsonl','.eval-artifacts/phase2c-location-semantic-20261023/semantic-followup-220/calls.jsonl']){
 const models=fs.readFileSync(path,'utf8').trim().split('\n').length;assert.equal(models,path.includes('followup')?54:108);
 ledger.sources.push({path,sha256:sha(fs.readFileSync(path)),scope:'PHASE2',models,fullLiveRuns:0,environmentReruns:0});ledger.phase2ModelCalls+=models;ledger.totalModelCalls+=models;
}
ledger.remaining={modelCalls:5000-ledger.totalModelCalls,fullLiveRuns:100-ledger.totalFullLiveRuns,environmentReruns:10-ledger.environmentReruns};
put('ledger-before.json',ledger);
const plan={...executionPlan(projection.cases),schema:'phase2c-exit-execution@1',kind:'PHASE2C_EXIT_18',mode:'LIVE_READ_ONLY',maxTotalReruns:6,hardDeadline:registry.validUntil,runnerInput:base+'/runner-input.yaml',registryPath:w+'/registry.json',ledgerPath:base+'/ledger-before.json',evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',queues:{A:'ODD',B:'EVEN',maxConcurrent:2,staggerMs:90000},onlyRetry:['ENV_FAILURE'],parallelFallback:['SOURCE_CHALLENGE','SOURCE_HTTP_403_503_429','SOURCE_BUSY','DEEPSEEK_RATE_LIMIT','PARALLEL_RESOURCE_CONFLICT'],excludedFromCapability:['p2c-holdout-03']};
put('plan.json',plan);
const files=execFileSync('git',['ls-files','-z','src','web-skills','scripts','docs/skills','package.json','package-lock.json','tsconfig.json'],{maxBuffer:32e6}).toString().split('\0').filter(Boolean);
const differences=[];for(const p of files){const original=execFileSync('git',['show','8487a844:'+p],{maxBuffer:32e6});if(sha(original)!==sha(fs.readFileSync(p)))differences.push(p);}assert.deepEqual(differences,[]);
put('preflight-offline.json',{status:'PASS',mainline:'8487a844',productReference:'16e91940',productFiles:files.length,differences,sourcePackageSha256:sha(fs.readFileSync(w+'/certification-package.json')),witnesses:registry.variants.map(v=>({caseId:v.caseId,count:v.witnesses.length,usedPlace:v.usedPlace,fallbackUsed:v.fallbackUsed,capabilityDenominator:v.capabilityDenominator})),deadline:registry.validUntil,priorVerification:'.eval-artifacts/phase2c-merge-20261023/report.md',gates:'REUSED_UNCHANGED_APPROVED_PRODUCT',calendar:'69/69',selection:'5/5',calibration:'22/22',ledgerBefore:{models:ledger.totalModelCalls,live:ledger.totalFullLiveRuns,environmentReruns:ledger.environmentReruns},reserve:{attempts:24,models:1200,live:24,environmentReruns:6},originalCertificationAudit:'Historical no-product-change assertion against941ca9c1 predates approved merge; source package hashes verified unchanged here. No certification source or Gold changed.',network:0,models:0});
console.log(JSON.stringify({prepared:true,cases:6,witnesses:5,modelTotal:ledger.totalModelCalls,reserveModels:1200}));
