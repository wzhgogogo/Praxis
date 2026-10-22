import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const base='.eval-artifacts/checkpoint-c-live-20261020',source=`${base}/holdout-exit-20261022/continuation-20261022`,dir=`${source}/evaluation-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const reviewPath=`${source}/wording-review.md`,reviewBytes=await fs.readFile(reviewPath),reviewSha256=sha(reviewBytes);
assert.equal(sha(execFileSync('git',['show',`dfdb175b:${reviewPath}`])),reviewSha256);
const reviewRef=`${reviewPath}#sha256=${reviewSha256}`;
const pending=await read(`${source}/pending-criterion-wordings.json`),ledger=await read(`${source}/resource-ledger.json`);
assert.equal(pending.entries.length,9);
const originals=[],decisions=[],inputs=[],budget=[],projections=[],views=[];
await fs.mkdir(`${dir}/views`,{recursive:true});
for(const entry of pending.entries){
 const bytes=await fs.readFile(entry.artifactPath);assert.equal(sha(bytes),entry.artifactSha256);const a=JSON.parse(bytes),criteria=a.finalSnapshot.domainState.intentDraft.criteria;
 const run=ledger.attempts.find(row=>row.artifactSha256===entry.artifactSha256)?.run;assert.ok(run);
 assert.ok(['h-02','h-04','h-05','h-08','h-10','h-11','h-14','h-16','h-17'].includes(run.runId));
 const accepted=[];
 for(const pair of entry.candidateWordingPairs){
  const g=a.materializedCase.semantic.criteria[pair.goldIndex],s=criteria[pair.actualIndex];
  assert.equal(sha(g.value??g.text),pair.goldTextSha256);assert.equal(sha(s.text??s.value),pair.actualTextSha256);
  const decision=pair.goldIndex===0&&pair.actualIndex===0?'EQUIVALENT':run.runId==='h-11'&&pair.goldIndex===1&&pair.actualIndex===1?'NOT_EQUIVALENT_SOFT_SEMANTIC_DEVIATION':'INVALID_CROSS_PAIR';
  decisions.push({runId:run.runId,artifactSha256:entry.artifactSha256,...pair,decision,reviewRef});
  if(decision==='EQUIVALENT')accepted.push({goldIndex:pair.goldIndex,actualIndex:pair.actualIndex,semanticId:`reviewed:${run.runId}:criterion:${pair.goldIndex}`,goldTextSha256:pair.goldTextSha256,actualTextSha256:pair.actualTextSha256,refs:[reviewRef]});
 }
 assert.equal(accepted.length,1);originals.push({runId:run.runId,artifactSha256:entry.artifactSha256,pairs:accepted});
}
assert.equal(decisions.length,15);assert.equal(decisions.filter(r=>r.decision==='EQUIVALENT').length,9);
assert.equal(decisions.filter(r=>r.decision==='INVALID_CROSS_PAIR').length,5);
assert.equal(decisions.filter(r=>r.decision==='NOT_EQUIVALENT_SOFT_SEMANTIC_DEVIATION').length,1);
const registry=entries=>({schema:'artifact-criterion-correspondence@1',status:'frozen regression; artifact-specific independent review',rule:'Only dfdb175b-approved equivalent pairs. Exact original artifact and both wording hashes required. No synonyms, cross-pairs or 6000 budget equivalence.',entries});
await put(`${dir}/criterion-correspondences.json`,registry(originals));
await put(`${dir}/wording-decisions.json`,{schema:'holdout-wording-decisions@1',reviewPath,reviewSha256,decisions});

for(const row of ledger.attempts.filter(r=>r.formalRunStarted)){
 const bytes=await fs.readFile(row.artifactPath);assert.equal(sha(bytes),row.artifactSha256);
 const a=JSON.parse(bytes),attempt=path.dirname(path.dirname(row.artifactPath)),runId=row.run.runId;
 const input={...row,attempt,originalArtifactPath:row.artifactPath,originalArtifactSha256:row.artifactSha256,evaluationArtifactPath:row.artifactPath,evaluationArtifactSha256:row.artifactSha256,representation:'ORIGINAL_SAVED_BYTES',hardEvidencePath:`${attempt}/independent.hard-evidence.json`};
 if(row.run.caseId==='p2-holdout-02'){
  const domain=a.finalSnapshot.domainState,criterion=a.materializedCase.semantic.criteria[1];
  assert.equal(criterion.value,'under 8,000 yen per person');assert.equal(criterion.strength,'HARD');assert.equal(criterion.polarity,'POSITIVE');
  const factIndex=a.semantic.proposal.facts.findIndex(f=>f.field==='BUDGET_PER_PERSON');assert.ok(factIndex>=0);
  assert.deepEqual(a.semantic.proposal.facts[factIndex].value,{kind:'BUDGET_PER_PERSON',max:8000,currency:'JPY'});
  for(const intent of [domain.intentDraft,domain.intent])assert.deepEqual(intent.budgetPerPerson,{max:8000,currency:'JPY'});
  const priceRecords=[];
  function priceFields(value,pointer){
   if(Array.isArray(value)){value.forEach((v,i)=>priceFields(v,`${pointer}/${i}`));return;}
   if(!value||typeof value!=='object')return;
   for(const[k,v]of Object.entries(value)){
    if(/price|budget|commercial/i.test(k))priceRecords.push({pointer:`${pointer}/${k}`,value:v});
    else if(!['browserTrace','domainState','semantic','materializedCase','content','messages'].includes(k))priceFields(v,`${pointer}/${k}`);
   }
  }
  priceFields(domain.readEvidence,'/finalSnapshot/domainState/readEvidence');
  const rawPriceRegions=(a.diagnostics?.browserTrace??[]).flatMap((t,i)=>t.detail?.priceRegions?.length?[{pointer:`/diagnostics/browserTrace/${i}/detail/priceRegions`,sequence:t.sequence,sourceUrl:t.detail.url,regions:t.detail.priceRegions}]:[]);
  const displayed=Object.entries(domain.presentedResults?.conditionStates??{}).map(([candidateId,rows])=>({candidateId,budgetRows:rows.filter(v=>/yen|jpy|budget|price/i.test(v.text))}));
  const audit={runId,artifactPath:row.artifactPath,artifactSha256:row.artifactSha256,goldIndex:1,status:'PRESERVED_STRUCTURED_BUDGET_NOT_LOST_HARD',reviewRef,
   evidence:[{pointer:`/semantic/proposal/facts/${factIndex}`,value:a.semantic.proposal.facts[factIndex]},...['intentDraft','intent'].map(k=>({pointer:`/finalSnapshot/domainState/${k}/budgetPerPerson`,value:domain[k].budgetPerPerson}))],
   priceRecords,rawPriceRegions,displayed,priceCheckConclusion:'PRICE_DATA_AND_CONDITION_CHECK_ARE_SEPARATE; no budget condition display row exists. Inspect priceRecords and rawPriceRegions; they do not create a product budget judgment.',
   limitations:['max stores a numeric ceiling but no explicit exclusive-under operator. @33 uses its existing numeric interval policy; no boundary rule is changed.','The structured budget has no criterionRef and is omitted from the product condition display. A retained field is not a verified merchant price or displayed disclosure.']};
  budget.push(audit);
  const view=structuredClone(a),patches=[];
  const add=(intent,pointer)=>{
   if(!intent)return;
   assert.deepEqual(intent.budgetPerPerson,{max:8000,currency:'JPY'},`No projection without original same budget: ${pointer}`);
   assert.equal(intent.criteria.length,1);assert.deepEqual(intent.criteria,domain.intentDraft.criteria);
   const addition={text:criterion.value,polarity:criterion.polarity,strength:criterion.strength};
   patches.push({op:'add',path:`${pointer}/criteria/1`,value:addition,sourcePointer:`${pointer}/budgetPerPerson`,sourceValue:intent.budgetPerPerson,goldIndex:1,reviewRef});intent.criteria.push(addition);
  };
  add(view.finalSnapshot.domainState.intentDraft,'/finalSnapshot/domainState/intentDraft');add(view.finalSnapshot.domainState.intent,'/finalSnapshot/domainState/intent');
  view.trajectories.forEach((t,i)=>{for(const k of ['intentDraft','intent'])add(t.decisionContext?.[k],`/trajectories/${i}/decisionContext/${k}`);});
  const restored=structuredClone(view);
  for(const patch of patches){const keys=patch.path.split('/').slice(1,-1);let obj=restored;for(const k of keys)obj=obj[k];assert.deepEqual(obj.pop(),patch.value);}
  assert.deepEqual(restored,a,'Only the documented criteria representation additions are permitted');
  const viewPath=`${dir}/views/${runId}.evaluation-view.json`;await put(viewPath,view);const viewSha256=sha(await fs.readFile(viewPath));
  projections.push({runId,sourceArtifactPath:row.artifactPath,sourceArtifactSha256:row.artifactSha256,viewPath,viewSha256,patches,rule:'Existing same-request structured budget projected only into intent criteria for @33; no source, Gold, display, timing, or resource field is changed.'});
  const original=originals.find(v=>v.artifactSha256===row.artifactSha256);assert.ok(original);
  views.push({runId,artifactSha256:viewSha256,pairs:[...original.pairs,{goldIndex:1,actualIndex:1,semanticId:`structured:${runId}:budgetPerPerson`,goldTextSha256:sha(criterion.value),actualTextSha256:sha(criterion.value),refs:[reviewRef,`${dir}/budget-structure-audit.json#original-sha256=${row.artifactSha256}:goldIndex=1`]}]});
  const hard=await read(input.hardEvidencePath),oldDir=path.dirname(input.hardEvidencePath),newDir=path.resolve(dir);
  assert.equal(hard.runs.length,1);assert.equal(hard.runs[0].artifactSha256,row.artifactSha256);hard.runs[0].artifactSha256=viewSha256;
  for(const snapshot of hard.runs[0].snapshots)for(const k of ['path','recordingPath'])if(snapshot[k])snapshot[k]=path.relative(newDir,path.resolve(oldDir,snapshot[k]));
  assert.equal(hard.runs[0].witnesses.length,0,'No new witness/manual hard truth is added to a view');
  const hardPath=`${dir}/${runId}.view-hard-evidence.json`;await put(hardPath,hard);
  Object.assign(input,{evaluationArtifactPath:viewPath,evaluationArtifactSha256:viewSha256,representation:'STRUCTURED_BUDGET_REPRESENTATION_VIEW',evaluationHardEvidencePath:hardPath});
 }
 inputs.push(input);
}
assert.equal(inputs.length,18);
await put(`${dir}/budget-structure-audit.json`,{schema:'artifact-structured-criterion-binding@1',status:'frozen regression; original artifact scoped structured correspondence',reviewRef,entries:budget});
await put(`${dir}/representation-lineage.json`,{schema:'holdout-evaluation-representation@1',status:'frozen regression; no counterfactual source/claim changes',projections});
await put(`${dir}/evaluation-correspondences.json`,registry([...originals,...views]));
await put(`${dir}/inputs.json`,{schema:'holdout-offline-evaluation-inputs@1',evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',sourceFreezePath:`${source}/live-freeze.json`,sourceFreezeSha256:sha(await fs.readFile(`${source}/live-freeze.json`)),reviewPath,reviewSha256,runs:inputs,preflightOnlyAttempts:ledger.attempts.filter(r=>!r.formalRunStarted)});
console.log(JSON.stringify({originals:18,reviewedOriginals:9,equivalentPairs:9,deniedPairs:6,structuredBudgets:budget.length,representationViews:projections.length,newModels:0,newWebsites:0,newLive:0}));
