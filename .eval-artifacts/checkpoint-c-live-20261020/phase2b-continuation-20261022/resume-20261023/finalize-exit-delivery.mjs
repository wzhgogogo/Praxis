// Administrative integrity and wording extraction only. No capability evaluator.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {verifyFreeze,sha} from '../../freeze.mjs';
import {loadCommittedCases} from '../../../phase2b-exit-pipeline-20261022/inputs.mjs';
const f='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022',r=`${f}/resume-20261023`,d=`${r}/exit-live`,get=p=>JSON.parse(fs.readFileSync(p)),ref=p=>({path:p,sha256:sha(fs.readFileSync(p))}),put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const frozen=verifyFreeze(`${r}/live-freeze.json`),manifest=get(`${d}/execution-manifest.json`),plan=get(`${r}/holdout-inputs-fallback/plan.json`),ledger=get(`${d}/ledger-after.json`),pending=get(`${d}/pending-wordings.json`),registry=get(`${r}/registry-final.json`);
assert.equal(loadCommittedCases(fs.readFileSync('.eval-artifacts/phase2b-holdout/holdout.yaml'),get('.eval-artifacts/phase2b-holdout/commitment.json')).length,6);
assert.equal(manifest.stop,null);assert.equal(manifest.recordedSlots,18);assert.equal(manifest.attempts.length,18);assert.equal(manifest.totalReruns,0);assert.equal(manifest.evaluation,'DEFERRED');assert.equal(manifest.mode,'LIVE_READ_ONLY');assert.equal(manifest.liveDenominator,18);
assert.deepEqual(manifest.attempts.map(a=>a.run),plan.runs);assert.equal(manifest.newModelCalls,294);
const artifactRefs=[];const bySha=new Map();
for(let i=0;i<manifest.attempts.length;i++){
 const row=manifest.attempts[i];assert.ok(row.formalRunStarted);assert.equal(sha(fs.readFileSync(row.artifactPath)),row.artifactSha256,'ORIGINAL_ARTIFACT_SHA');
 const a=get(row.artifactPath);assert.equal(a.materializedCase.id,row.run.caseId);assert.equal(row.modelCallsCharged,a.resourceUsage.modelCallsStarted);assert.ok(row.modelCallsCharged<=50);
 assert.ok(Date.parse(row.finishedAt)<Date.parse(registry.validUntil),'WITNESS_DEADLINE');
 if(i)assert.ok(Date.parse(row.startedAt)-Date.parse(manifest.attempts[i-1].finishedAt)>=300000,'MINIMUM_RUN_GAP');
 bySha.set(row.artifactSha256,a);artifactRefs.push({runId:row.run.runId,attempt:row.attempt,...ref(row.artifactPath)});
}
for(const s of ledger.sources)assert.equal(sha(fs.readFileSync(s.path)),s.sha256,'LEDGER_SOURCE_SHA');
assert.equal(ledger.totalModelCalls,3634);assert.equal(ledger.totalFullLiveRuns,72);assert.equal(ledger.environmentReruns,3);assert.equal(ledger.totalModelCalls,ledger.phase2ModelCalls+ledger.priorPhaseModelCalls);
assert.equal(ledger.sources.filter(s=>s.scope==='PHASE2').reduce((n,s)=>n+s.models,0),ledger.phase2ModelCalls);assert.equal(ledger.sources.reduce((n,s)=>n+s.fullLiveRuns,0),72);assert.equal(ledger.sources.reduce((n,s)=>n+(s.environmentReruns??0),0),3);
const exactKeys=(o,required,optional=[])=>{assert.deepEqual(Object.keys(o).filter(k=>!optional.includes(k)).sort(),[...required].sort());};
exactKeys(pending,['schema','status','rule','entries']);assert.equal(pending.status,'PENDING_INDEPENDENT_WORDING_REVIEW');
for(const e of pending.entries){
 exactKeys(e,['artifactPath','artifactSha256','caseId','unmatchedRequestCriteria','unmatchedProductCriteria','candidateWordingPairs']);assert.equal(sha(fs.readFileSync(e.artifactPath)),e.artifactSha256);const a=bySha.get(e.artifactSha256);assert.ok(a);assert.equal(e.caseId,a.materializedCase.id);
 for(const [list,criteria]of [[e.unmatchedRequestCriteria,a.materializedCase.semantic.criteria],[e.unmatchedProductCriteria,a.finalSnapshot?.domainState?.intentDraft?.criteria??[]]])for(const c of list){exactKeys(c,['index','text','polarity','strength'],['criterionRef','semanticId']);const actual=criteria[c.index];assert.equal(c.text,actual.text??actual.value);assert.equal(c.polarity,actual.polarity);assert.equal(c.strength,actual.strength);}
 for(const p of e.candidateWordingPairs){
  exactKeys(p,['goldIndex','actualIndex','goldText','actualText','goldPolarity','actualPolarity','goldStrength','actualStrength','goldTextSha256','actualTextSha256']);assert.equal(sha(p.goldText),p.goldTextSha256);assert.equal(sha(p.actualText),p.actualTextSha256);
  assert.equal(p.goldText,a.materializedCase.semantic.criteria[p.goldIndex].value);assert.equal(p.actualText,a.finalSnapshot.domainState.intentDraft.criteria[p.actualIndex].text);
 }
}
const text=JSON.stringify(pending);assert.ok(!/QUALIFIED_DELIVERY|CAPABILITY_MISS|presentedResults|conditionStates|matchingSlots|S1_UNSUPPORTED|MISSED_KNOWN_CONDITION/.test(text));
const files=[];function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const q=p+'/'+e.name;if(e.isDirectory())walk(q);else if(e.isFile())files.push({...ref(q),bytes:fs.statSync(q).size});}}walk(d);
assert.equal(files.filter(x=>/\.evaluation\.json$|\.raw-evaluator\.json$|batch-report\.json$|run-report\.json$/.test(x.path)).length,0,'CAPABILITY_EVALUATION_MUST_REMAIN_DEFERRED');
assert.equal(execFileSync('git',['diff','--name-only',frozen.productionBase,'--','src','web-skills','scripts','package.json','package-lock.json'],{encoding:'utf8'}),'','NO_PRODUCT_TUNING_AFTER_HOLDOUT_OPEN');
verifyFreeze(`${r}/live-freeze.json`);
put(`${r}/execution-integrity.json`,{schema:'phase2b-deferred-delivery-integrity@1',status:'INTEGRITY_VERIFIED_AWAITING_WORDING_REVIEW',freezeSha256:frozen.manifestSha256,frozenFilesVerified:Object.keys(frozen.files).length,sourceCommitmentUnchanged:true,exactPlanOrder:true,recordedSlots:18,recordedAttempts:18,rawArtifactsVerified:artifactRefs,allFinishToNextStartGapsAtLeastMs:300000,finishedAt:manifest.attempts.at(-1).finishedAt,hardDeadline:registry.validUntil,newModelCalls:294,newFullLiveRuns:18,newEnvironmentReruns:0,ledger:ref(`${d}/ledger-after.json`),pending:ref(`${d}/pending-wordings.json`),wordingArtifacts:pending.entries.length,candidateWordingPairs:pending.entries.reduce((n,e)=>n+e.candidateWordingPairs.length,0),capabilityEvaluationFiles:0,capabilityEvaluation:'DEFERRED',rule:'Integrity/resource metadata only. No delivery outcome, score, condition assessment, timing performance report, witness funnel or attribution is produced.'});
put(`${r}/exit-evidence-manifest.json`,{schema:'phase2b-deferred-execution-evidence@1',freezeSha256:frozen.manifestSha256,exposureStart:ref(`${r}/exposure-start.json`),files,rule:'Immutable raw execution and safety evidence retained. Capability evaluation and exit decisions await independent wording review.'});
const esc=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' '),lines=['# 待复核的条件措辞','',`仅措辞，未附运行结果、评分、条件核对或库存结论。${pending.entries.length}份产物涉及未对应措辞，候选笛卡尔配对共${pending.entries.reduce((n,e)=>n+e.candidateWordingPairs.length,0)}条；配对只是问题，不表示等价或身份成立。编号均从0开始，只适用于指定原始产物SHA。`,'','权威机器包：[pending-wordings.json](pending-wordings.json)。原始措辞、强度和极性逐字保留，等待复核者判定；本次不写入任何对应。',''];
for(const e of pending.entries){lines.push(`## ${e.caseId}`,'',`产物SHA-256：\`${e.artifactSha256}\``,'');for(const [label,items]of [['请求中未对应条件',e.unmatchedRequestCriteria],['产品中未对应条件',e.unmatchedProductCriteria]]){lines.push(label+'：','');for(const c of items)lines.push(`- [${c.index}] ${esc(c.text)} (${c.polarity}, ${c.strength})`);if(!items.length)lines.push('（空）');lines.push('');}if(e.candidateWordingPairs.length){lines.push('| 请求编号与原文 | 产品编号与原文 |','| --- | --- |');for(const p of e.candidateWordingPairs)lines.push(`| [${p.goldIndex}] ${esc(p.goldText)} | [${p.actualIndex}] ${esc(p.actualText)} |`);lines.push('');}}
fs.writeFileSync(`${d}/pending-wordings.md`,lines.join('\n')+'\n',{flag:'wx'});
console.log(JSON.stringify({recordedSlots:18,rawResults:18,pendingArtifacts:pending.entries.length,candidateWordingPairs:pending.entries.reduce((n,e)=>n+e.candidateWordingPairs.length,0),freezeSha256:frozen.manifestSha256,evaluation:'DEFERRED'}));
