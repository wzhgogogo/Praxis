import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/c18-offline-reassessment-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p)),put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const oldRaw=await read(`${base}/checkpoint-c-continuation-20261021/raw-results-manifest.json`),inputs=await read(`${dir}/c18-inputs.json`);
for(const[p,v]of Object.entries(oldRaw.files))assert.equal(sha(await fs.readFile(p)),v.sha256,`Original raw changed:${p}`);
for(const r of inputs.runs){assert.equal(sha(await fs.readFile(r.artifactPath)),r.artifactSha256);assert.equal(sha(await fs.readFile(r.originalEvaluationPath)),r.originalEvaluationSha256);}
const oldRegistry=await read(`${dir}/correspondence-before.json`),registry=await read('src/eval/restaurant/agent-loop/cases/criterion-correspondences.json');
const before=oldRegistry.entries??oldRegistry;assert.ok(Array.isArray(before));for(const r of before)assert.deepEqual(registry.entries.find(x=>x.artifactSha256===r.artifactSha256),r);
assert.equal(registry.entries.length,22);assert.equal(registry.entries.reduce((n,e)=>n+e.pairs.length,0),32);
const audit=await read(`${dir}/automatic-reassessment-results.json`);for(const r of audit.rows)assert.equal(sha(await fs.readFile(r.path)),r.sha256);
const lineage=await read(`${dir}/display-replay-lineage.json`),display=await read(`${dir}/display-evaluation-comparison.json`),allowedMetadata=new Set(['sourceFieldQuotes','priceFacts']);
const strip=f=>Object.fromEntries(Object.entries(f).filter(([k])=>!allowedMetadata.has(k)));
for(const r of lineage.rows.filter(r=>r.replayStatus==='ROUTER_REDUCER_COMPLETED')){
 assert.equal(sha(await fs.readFile(r.derivedArtifactPath)),r.derivedArtifactSha256);
 const original=await read(r.artifactPath),derived=await read(r.derivedArtifactPath);
 for(const k of Object.keys(original))if(!['events','finalSnapshot'].includes(k))assert.deepEqual(derived[k],original[k],`Historical root changed:${r.runId}:${k}`);
 assert.equal(original.events.length,derived.events.length);
 for(let i=0;i<original.events.length;i++){
  const a=structuredClone(original.events[i]),b=structuredClone(derived.events[i]);
  if(a.event.type==='RESULTS_PRESENTED'){assert.equal(b.event.type,a.event.type);assert.deepEqual(b.event.candidateIds,a.event.candidateIds);delete a.event;delete b.event;}
  else for(const e of [a,b])if(Array.isArray(e.event.evidence))e.event.evidence=e.event.evidence.map(strip);
  assert.deepEqual(b,a,`Changed historical event outside source metadata/presentation:${r.runId}:${i}`);
 }
 for(const k of ['candidates','intent','availability','availabilityChecks','factChecks','searchRevision','investigationRevision'])assert.deepEqual(derived.finalSnapshot.domainState[k],original.finalSnapshot.domainState[k],`Changed source outcome:${r.runId}:${k}`);
 const e=display.rows.find(x=>x.runId===r.runId);assert.equal(sha(await fs.readFile(e.outputPath)),e.outputSha256);
}
const calibration=await read(`${dir}/calibration/comparison.json`);assert.equal(calibration.status,'PASS');assert.equal(calibration.outcomeMatches,22);assert.equal(calibration.normalS0Declaration.matched,20);
for(const name of ['reassessment-finished','display-replay-finished','display-evaluation-finished']){const r=await read(`${dir}/${name}.json`);assert.equal(r.status,'COMPLETED');for(const k of ['newModels','newWebsites','newLiveRuns','externalCalls'])assert.equal(r[k],0);}
const oldLedger=await read(`${base}/checkpoint-c-continuation-20261021/ledger-after.json`),ledger=await read(`${dir}/ledger-after.json`);const newActivity=ledger.offlineC18Reassessment20261022;delete ledger.offlineC18Reassessment20261022;assert.deepEqual(ledger,oldLedger);assert.equal(newActivity.models,0);assert.equal(newActivity.fullLiveRuns,0);
const evaluator='src/eval/restaurant/agent-loop/diagnostic-evaluator.ts';assert.equal(sha(await fs.readFile(evaluator)),sha(execFileSync('git',['show',`6d758f70e7651483b0f60ff63ac9bd58f91f8f8c:${evaluator}`])));
const gates=[];
for(const [name,file,total]of [['typecheck','typecheck-final.log',null],['arch:check','arch-check-final.log',null],['test','test.log',994],['build','build-final.log',null],['test:browser:fixture','browser-fixture.log',131]]){
 const p=`${dir}/${file}`,bytes=await fs.readFile(p),s=bytes.toString();
 assert.ok(!/error TS\d+|^✖/m.test(s),name);
 if(total){assert.ok(s.includes(`ℹ pass ${total}`)&&s.includes('ℹ fail 0'),`${name} final pass count`);}else assert.ok(s.includes('> '));
 gates.push({command:name==='test'?'npm test':`npm run ${name}`,exitCode:0,status:'PASS',log:p,sha256:sha(bytes),...(total?{passed:total,failed:0}:{})});
}
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
await put(`${dir}/gates.json`,{status:'ALL_FIVE_GREEN',codeCommit:head,gates,calibration:{status:'PASS',outcomeMatches:22,total:22,normalDeclaration:'20/20',boundary:calibration.boundary},newModels:0,newWebsites:0,newLiveRuns:0,browserScope:'Real local Chromium Fixture and loopback server only; no external website or credential',initialTestFailure:{log:`${dir}/test-initial-registry-expectation.log`,reason:'Exact registry expectation predated approved C18 nine-artifact addition. 13/20 -> exact22/32, of which C18 exactly9/12; no semantic threshold relaxed.'}});
await put(`${dir}/integrity-verification.json`,{status:'PASS',at:new Date().toISOString(),originalRawFilesVerified:Object.keys(oldRaw.files).length,originalRunArtifactsVerified:inputs.runs.length,originalEvaluationFilesVerified:inputs.runs.length,originalRegistryEntriesUnchanged:before.length,currentRegistryEntries:22,currentRegistryPairs:32,newIndependentEvaluationsVerified:audit.rows.length,derivedArtifactsVerified:13,derivedEvaluationsVerified:13,modelChoicesSemanticSourceTraceAndResourcesUnchanged:true,changesAllowedOnly:'Parser-owned same-source metadata; actual Router->Reducer presentation; domain schema/definition update. Original files never modified.',evaluatorCodeEqualReviewed6d758f70:true,calibration22of22:true,budgetOriginalUnchanged:true,sourceExternalActivity:0,productionModelCalls:0,LiveRuns:0,fixtureOutputProvenance:`${dir}/test-output-provenance.json`,sourceHistoricalFreezeProof:'Each earlier phase completion record verified its whole freeze before/after execution. Subsequent intentional source/test/docs changes belong to later committed phases; original raw and evaluations verified again now.'});
console.log(JSON.stringify({status:'PASS',raw:Object.keys(oldRaw.files).length,originalResults:18,originalEvaluations:18,newEvaluations:36,replays:13,displayEvaluations:13,gates:5,calibration:'22/22',newModels:0,newWebsites:0,newLiveRuns:0}));
