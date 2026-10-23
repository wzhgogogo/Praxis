import fs from 'node:fs';
import assert from 'node:assert/strict';
import {RestaurantExecutionRouter} from '../../src/application/restaurant-execution-router.ts';
import {restaurantBookingTaskDefinition as definition} from '../../src/domains/restaurant/task-definition.ts';
import {restaurantCurrentFactEvidence} from '../../src/domains/restaurant/read-assessment.ts';
import {sha,verifyFreeze} from '../checkpoint-c-live-20261020/freeze.mjs';
const d='.eval-artifacts/near-and-condition-display-20261023',manifest=JSON.parse(fs.readFileSync(`${d}/inputs/manifest.json`)),f=verifyFreeze(`${d}/replay-freeze.json`),rows=[],expected={'h-02':['13093277','13018986','13271031'],'h-08':['13271031']};
let sourceCalls=0;const noRead=async()=>{sourceCalls++;throw Error('NO_NETWORK_OR_MODELS');},router=new RestaurantExecutionRouter({executionRoute:'STRUCTURED_ADAPTER',search:noRead},{executionRoute:'STRUCTURED_ADAPTER',check:noRead},{structuredReadTimeoutMs:1000,browserReadTimeoutMs:1000});
for(const input of manifest.runs){
 const bytes=fs.readFileSync(input.projectionPath);assert.equal(sha(bytes),input.projectionSha256);const a=JSON.parse(bytes),ctx=now=>({taskId:a.runId,runId:a.runId,now,createId:p=>p});let state=definition.create({},ctx(a.startedAt));
 for(const e of a.events){if(e.event.type==='RESULTS_PRESENTED')break;state=definition.transition(state,e.event,ctx(e.occurredAt)).state;}
 const before=a.originalPresentation;let after=null;
 if(before){const r=await router.execute({type:'PRESENT_RESULTS',candidateIds:before.candidateIds},state,before.presentedAt);assert.equal(r.event.type,'RESULTS_PRESENTED');after=definition.transition(state,r.event,ctx(before.presentedAt)).state.presentedResults;}
 const changes=[];if(expected[input.runId]){
  const restore=structuredClone(after);
  for(const id of after.candidateIds){assert.ok(expected[input.runId].includes(id.split('/').at(-1)));const old=before.conditionStates[id][0],updated=after.conditionStates[id][0];assert.equal(old.status,'NOT_CHECKED');assert.equal(updated.status,'MET');assert.equal(updated.criterionRef,'criterion:0');const currentFacts=restaurantCurrentFactEvidence(state,id);changes.push({candidateId:id,criterionRef:updated.criterionRef,before:old,after:updated,currentSourceEvidenceIds:currentFacts.map(f=>f.evidenceId),modelSupport:currentFacts.filter(f=>f.provider==='MODEL_JUDGMENT').map(f=>({evidenceId:f.evidenceId,claims:f.claims})),reason:'Generic trailing food descriptor previously remained in the literal cuisine key; current same-outlet merchant field was already cited. No evidence lifecycle or quote invented.'});restore.conditionStates[id][0]=old;}
  assert.deepEqual(restore,before,'ONLY_FOUR_CONDITION_ROWS_MAY_CHANGE');
 }else assert.deepEqual(after,before,'OTHER_PRESENTATION_CHANGED');
 const comparison=a.originalEvaluation.conditionStateComparisons.map(old=>{
  const shown=after.conditionStates[old.candidateId].find(q=>q.criterionRef===old.criterionRef);assert.ok(shown);const change=changes.find(c=>c.candidateId===old.candidateId&&c.criterionRef===old.criterionRef);
  if(change){assert.equal(old.assessment,'MISSED_KNOWN_CONDITION');assert.equal(old.independent,'MET');assert.equal(shown.status,old.independent);return {...old,displayed:shown.status,assessment:'CONSISTENT',assessmentMethod:'Current Router→Reducer display matches unchanged previously frozen independent @33 truth; not a rescored Live outcome'};}
  assert.equal(shown.status,old.displayed);return {...old,assessmentMethod:'Display unchanged; original independent @33 assessment retained'};
 });
 rows.push({runId:input.runId,original:{commit:manifest.sourceCommit,path:input.originalPath,sha256:input.originalSha256},projection:{path:input.projectionPath,sha256:input.projectionSha256},before,after,changes,displayUnchanged:changes.length===0,comparisons:comparison,originalOutcomeUnchanged:a.originalEvaluation.outcome,newModelCalls:0,sourceCalls:0});
}
assert.equal(rows.length,11);assert.equal(rows.flatMap(r=>r.changes).length,4);assert.equal(rows.filter(r=>r.displayUnchanged).length,9);assert.equal(sourceCalls,0);verifyFreeze(`${d}/replay-freeze.json`);
const counter=items=>Object.fromEntries([...new Set(items)].sort().map(k=>[k,items.filter(x=>x===k).length]));
const summary={schema:'near-condition-display-replay@1',status:'PASS',mode:'SAVED_EVENTS_CURRENT_ROUTER_REDUCER_WITH_FROZEN_INDEPENDENT_CONDITION_TRUTH',sourceCommit:manifest.sourceCommit,freezeSha256:f.manifestSha256,sourceRuns:11,changedCuisineRows:4,otherDisplaysIdentical:9,beforeAssessments:counter(rows.flatMap(r=>r.comparisons.map(c=>rows.find(x=>x.runId===r.runId).changes.some(x=>x.candidateId===c.candidateId&&x.criterionRef===c.criterionRef)?'MISSED_KNOWN_CONDITION':c.assessment))),afterAssessments:counter(rows.flatMap(r=>r.comparisons.map(c=>c.assessment))),rows,newModelCalls:0,newWebsiteRequests:0,newGoogleRequests:0,newLive:0,sourceCalls,limitations:['Counterfactual offline display only, not a new Live or historical qualification change.','Independent @33 truth from immutable source HTML evaluation is reused; no claim of new stock/source observations.','h12 extra UNSPECIFIED evaluation limitation, no-witness cases and earlier timeout adjudications are unchanged.']};
fs.writeFileSync(`${d}/display-replay.json`,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',runs:11,changed:4,unchanged:9,before:summary.beforeAssessments,after:summary.afterAssessments,newModels:0,sourceCalls}));
