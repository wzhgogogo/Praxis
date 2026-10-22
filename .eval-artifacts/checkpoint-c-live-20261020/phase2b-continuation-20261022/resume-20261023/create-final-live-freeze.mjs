import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createFreeze,git,sha} from '../../freeze.mjs';
import {verifyPlan} from '../../../phase2b-exit-pipeline-20261022/execution.mjs';
import {gatePhase2bWitness} from '../../../phase2b-exit-pipeline-20261022/witness-admission.mjs';
import {checkStageBudget} from '../../policy.mjs';
const f='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022',r=`${f}/resume-20261023`,get=p=>JSON.parse(fs.readFileSync(p));
const plan=get(`${r}/holdout-inputs-fallback/plan.json`),registry=get(`${r}/registry-final.json`),ledger=get(`${r}/ledger-before-exit.json`),baseline=get(`${f}/step1-verification.json`);
assert.equal(get(`${r}/step3-verification.json`).status,'READY_TO_RUN_ALL_18_WITH_APPROVED_EXCLUSION');assert.equal(get(`${f}/step2-verification.json`).status,'PASS');verifyPlan(plan);checkStageBudget(ledger,plan);
assert.equal(git('diff','--name-only',baseline.frozenCodeCommit,'--','src','web-skills','scripts','package.json','package-lock.json'),'','NO_PRODUCT_OR_PROMPT_TUNING_AFTER_HOLDOUT_OPEN');
for(const v of registry.variants)gatePhase2bWitness(registry,v.variantId,Date.now(),500000);
const extra=git('ls-files',f,'.eval-artifacts/phase2b-exit-pipeline-20261022','.eval-artifacts/phase2b-holdout').split('\n').filter(p=>p&&!/\/(?:gates|calibration|replays|views|evaluations|live-checks|offline-rehearsal(?:-final)?)\//.test(p)&&!p.endsWith('/source-clock.json'));
extra.push(`${f}/live-checks/ledger-after.json`,...baseline.gates.map(g=>g.path));
for(const source of ledger.sources){assert.equal(sha(fs.readFileSync(source.path)),source.sha256,'LEDGER_SOURCE_DRIFT');extra.push(source.path);}
const output=`${r}/live-freeze.json`,m=createFreeze(output,extra);
Object.assign(m,{purpose:'USER_APPROVED_PHASE2B_EXIT_ALL_18; CAPABILITY_EVALUATION_DEFERRED_UNTIL_WORDING_REVIEW',productionBase:baseline.frozenCodeCommit,outerAdmission:'phase2b-business-witness-exclusion@1',modelCallCap:5000,evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',earliestWitnessObservedAt:registry.earliestWitnessObservedAt,hardDeadline:registry.validUntil,certifiedCases:registry.certifiedCaseCount,capabilityCases:registry.capabilityCaseCount,plannedCases:6,plannedSlots:18,capabilityEvaluation:'DEFERRED'});
fs.writeFileSync(output,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({commit:m.commit,files:Object.keys(m.files).length,sha256:sha(fs.readFileSync(output)),hardDeadline:m.hardDeadline}));
