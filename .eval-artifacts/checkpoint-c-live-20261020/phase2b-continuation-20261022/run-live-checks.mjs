import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {authorizeLive} from '../../phase2b-exit-pipeline-20261022/execution.mjs';
import {evaluateAttempt} from '../evaluate-report.ts';
import {verifyFreeze,sha} from '../freeze.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022',read=p=>JSON.parse(fs.readFileSync(p));
const put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const freezePath=process.argv[2],approvalPath=process.argv[3];assert.ok(freezePath&&approvalPath);
const first=read(`${dir}/step1-verification.json`);assert.equal(first.status,'PASS');assert.equal(first.calendar.passed,69);assert.equal(first.selection.passed,5);assert.equal(first.calibration.passed,22);assert.equal(first.budgetRows.passed,5);assert.ok(first.gates.every(g=>g.status==='PASS'));
const frozen=verifyFreeze(freezePath),planPath=`${dir}/quick-plan.json`,plan=read(planPath),directory=path.resolve(dir,'live-checks');
assert.equal(frozen.files[`${dir}/step1-verification.json`],sha(fs.readFileSync(`${dir}/step1-verification.json`)));
const manifest=await authorizeLive({freezePath,approvalPath,planPath,ledgerPath:`${dir}/ledger-before.json`,registryPath:plan.registryPath,runnerInput:plan.runnerInput,directory});
const registry=read(plan.registryPath),reports=[];
for(const row of manifest.attempts){
 const attemptDir=path.resolve(directory,`${row.run.runId}-attempt-${row.attempt}`),finish=read(path.join(attemptDir,'finish.json'));
 const postPath=path.join(attemptDir,'post-run/post-check.json');
 const evaluated=evaluateAttempt({resultPath:row.artifactPath,directory:attemptDir,run:row.run,mode:'LIVE_READ_ONLY',registryPath:plan.registryPath,
  ...(fs.existsSync(postPath)?{postPath}:{}),freezeSha256:frozen.manifestSha256,interruption:finish.orchestration,outputStem:'complete'});
 const artifact=row.artifactPath?read(row.artifactPath):null,domain=artifact?.finalSnapshot?.domainState;
 const trace=artifact?.diagnostics?.browserTrace??[],native=[];
 for(const t of trace.filter(t=>t.kind==='SNAPSHOT')){try{const url=new URL(t.detail?.url);const source=url.hostname==='tabelog.com'?'TABELOG':url.hostname.endsWith('tablecheck.com')?'TABLECHECK':null;if(source)native.push({source,url:url.href,sequence:t.sequence,at:t.at});}catch{}}
 const witnesses=registry.variants.find(v=>v.variantId===row.run.caseId)?.witnesses??[];
 const entered=witnesses.map(w=>({outletName:w.outletName,sourceUrl:w.sourceUrl,enteredCandidates:(domain?.candidates??[]).some(c=>Object.entries(c.restaurant.sourceIds??{}).some(([key,value])=>key.toLowerCase()==='tabelog'&&String(value).replace(/\/$/,'').split('/').at(-1)===new URL(w.sourceUrl).pathname.replace(/\/$/,'').split('/').at(-1)))}));
 const coverages=[];
 function walk(value,pointer){if(!value||typeof value!=='object')return;if(Array.isArray(value)){value.forEach((v,i)=>walk(v,`${pointer}/${i}`));return;}for(const[k,v]of Object.entries(value)){if(k==='timeWindowCoverage')coverages.push({pointer:`${pointer}/${k}`,value:v});else if(!['messages','html','text','content','body'].includes(k))walk(v,`${pointer}/${k}`);}}
 if(artifact)walk(artifact,'');
 const resources=artifact?.resourceUsage,reported=evaluated.summary.layers.endToEnd;
 reports.push({run:row.run,attempt:row.attempt,artifactPath:row.artifactPath,artifactSha256:row.artifactSha256,evaluationPath:evaluated.summary.evaluationPath,
  outcome:evaluated.evaluation.outcome,firstObservedNativeSource:native[0]??null,reachedTabelogFirst:native[0]?.source==='TABELOG',tabelogPagesObserved:native.filter(p=>p.source==='TABELOG'),
  firstScheduledNativeSource:(artifact?.trajectories??[]).map(t=>t.executionMetadata?.nativeDiscoveryFunnel?.source).find(Boolean)??null,
  witnesses:entered,requestedWindow:domain?.intentDraft?.timeWindow??null,timeWindowCoverage:coverages,availabilityChecks:domain?.availabilityChecks??null,
  deliveredTimes:Object.fromEntries(Object.entries(domain?.availability??{}).map(([id,offers])=>[id,offers.map(o=>o.dateTime)])),
  elapsedMs:resources?.elapsedMs??null,modelCalls:resources?.modelCallsStarted??null,totalGoogleRequests:reported.totalGoogleRequests,
  resourcesWithinCeilings:!!resources&&resources.elapsedMs<=500000&&resources.modelCallsStarted<=50&&(reported.totalGoogleRequests??Infinity)<=40,
  severity:evaluated.evaluation.severity,reportPath:path.join(attemptDir,'complete.run-report.json')});
}
const finals=plan.runs.map(r=>reports.filter(x=>x.run.runId===r.runId).at(-1)).filter(Boolean),group=finals.filter(r=>r.run.caseId==='p2-holdout-03'),control=finals.find(r=>r.run.caseId==='p2-holdout-01');
const conditions={allThreeReached:finals.length===3,noPositiveS0:reports.every(r=>r.severity.S0.status!=='PRESENT'),groupQualifiedAtLeastOne:group.filter(r=>r.outcome.type==='QUALIFIED_DELIVERY').length>=1,controlQualified:control?.outcome.type==='QUALIFIED_DELIVERY',withinExistingWitnessWindow:manifest.attempts.every(r=>Date.parse(r.finishedAt)<Date.parse(plan.hardDeadline)),allFormalRunsWithinCeilings:reports.filter(r=>r.artifactPath).every(r=>r.resourcesWithinCeilings),notStopped:manifest.stop===null};
const passed=Object.values(conditions).every(Boolean);
verifyFreeze(freezePath);put(path.join(directory,'gate-summary.json'),{schema:'phase2b-three-live-checks@1',status:passed?'PASS':'STOPPED_FAILED_GATE',freezeSha256:frozen.manifestSha256,scope:'Three exposed Live checks; full-Live budget only, zero exit-check denominator',conditions,reports,ledgerPath:path.join(directory,'ledger-after.json'),next:passed?'STEP3_AUTHORIZED':'STOP_WAIT_REVIEW'});
console.log(JSON.stringify({stage:'LIVE_CHECKS_FINISHED',status:passed?'PASS':'STOPPED_FAILED_GATE',conditions}));
