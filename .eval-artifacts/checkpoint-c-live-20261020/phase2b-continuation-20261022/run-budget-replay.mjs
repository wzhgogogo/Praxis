import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/phase2b-continuation-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const load=async p=>import(pathToFileURL(path.resolve(p)).href);
const freezeBytes=await fs.readFile(`${dir}/replay-freeze.json`),freeze=JSON.parse(freezeBytes);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
const {RestaurantExecutionRouter}=await load('src/application/restaurant-execution-router.ts');
const {restaurantBookingTaskDefinition:definition}=await load('src/domains/restaurant/task-definition.ts');
const {restaurantCurrentFactEvidence}=await load('src/domains/restaurant/read-assessment.ts');
const [e,c,h,g,n,tablecheck]=await Promise.all(['diagnostic-evaluator','criterion-correspondence','diagnostic-evaluator-hard','diagnostic-evaluator-grounding','diagnostic-evaluator-network'].map(name=>load(`src/eval/restaurant/agent-loop/${name}.ts`)).concat(load(`${base}/tablecheck-post-review.mjs`)));
const inputs=await read(`${dir}/inputs.json`),previous=inputs.previousEvaluation;
const approved=await read(`${previous}/evaluation-correspondences.json`),rows=[],entries=[],lineage=[];
let sourceCalls=0;
const noRead=async()=>{sourceCalls++;throw Error('OFFLINE_PRESENTATION_MUST_NOT_READ_SOURCE');};
const router=new RestaurantExecutionRouter({executionRoute:'STRUCTURED_ADAPTER',search:noRead},{executionRoute:'STRUCTURED_ADAPTER',check:noRead},{structuredReadTimeoutMs:1000,browserReadTimeoutMs:1000});
for(const name of ['replays','views','evaluations'])await fs.mkdir(`${dir}/${name}`);
const reviewedPath=path.resolve(`${base}/reviewed-reads.json`),reviewedReads=n.parseReviewedReads(await fs.readFile(reviewedPath),reviewedPath);
for(const input of inputs.runs){
 const runId=input.run.runId,bytes=await fs.readFile(input.originalArtifactPath);assert.equal(sha(bytes),input.originalArtifactSha256);
 const original=JSON.parse(bytes),actual=original.finalSnapshot.domainState.presentedResults;
 const context=at=>({taskId:original.runId,runId:original.runId,now:at,createId:p=>p});
 let state=definition.create({},context(original.startedAt)),presentations=0;const replay=structuredClone(original);
 for(let i=0;i<original.events.length;i++){
  const envelope=original.events[i];let event=envelope.event;
  if(event.type==='RESULTS_PRESENTED'){
   presentations++;assert.equal(presentations,1);
   assert.deepEqual(state.intentDraft.budgetPerPerson,{max:8000,currency:'JPY'});assert.equal(state.intentDraft.criteria.length,1);
   const execution=await router.execute({type:'PRESENT_RESULTS',candidateIds:actual.candidateIds},state,envelope.occurredAt);
   assert.equal(execution.event?.type,'RESULTS_PRESENTED');event=execution.event;replay.events[i].event=event;
  }
  state=definition.transition(state,event,context(envelope.occurredAt)).state;
 }
 assert.equal(presentations,1);assert.deepEqual(state.presentedResults.candidateIds,actual.candidateIds);
 // State20 introduces scheduling checkpoints. Persist the current reconstructed
 // state separately; this experiment compares its presentation on immutable
 // historical observations, rather than claiming an old full Live was rerun.
 for(const key of ['intentDraft','intent','candidates','readEvidence','availability','availabilityChecks','factChecks'])
  assert.deepEqual(state[key],original.finalSnapshot.domainState[key],`Historical observation changed:${key}`);
 const currentStatePath=`${dir}/replays/${runId}.state20.json`;await put(currentStatePath,state);
 replay.finalSnapshot.domainState={...original.finalSnapshot.domainState,presentedResults:state.presentedResults};
 const replayPath=`${dir}/replays/${runId}.result.json`;await put(replayPath,replay);const replaySha256=sha(await fs.readFile(replayPath));
 const priorViewBytes=await fs.readFile(input.evaluationArtifactPath);assert.equal(sha(priorViewBytes),input.evaluationArtifactSha256);
 const view=JSON.parse(priorViewBytes);
 // @33's approved representation adds the existing structured cap to criteria.
 // It is evaluator input only; the production replay above retains the real intent.
 view.events=replay.events;view.finalSnapshot.domainState.presentedResults=state.presentedResults;
 const viewPath=`${dir}/views/${runId}.evaluation-view.json`;await put(viewPath,view);const viewSha256=sha(await fs.readFile(viewPath));
 const restored=structuredClone(view);restored.events=original.events;restored.finalSnapshot.domainState.presentedResults=actual;
 assert.deepEqual(restored,JSON.parse(priorViewBytes),'Only the actual Router event and Reducer presentation may change from the approved evaluation representation');
 const registered=approved.entries.find(row=>row.artifactSha256===input.evaluationArtifactSha256);assert.ok(registered);assert.equal(registered.pairs.length,2);
 entries.push({...registered,artifactSha256:viewSha256});
 const correspondencePath=`${dir}/${runId}.correspondences.json`;
 await put(correspondencePath,{...approved,entries:[entries.at(-1)]});
 const hard=await read(input.hardEvidencePath);assert.equal(hard.runs.length,1);assert.equal(hard.runs[0].artifactSha256,input.originalArtifactSha256);assert.equal(hard.runs[0].witnesses.length,0);
 hard.runs[0].artifactSha256=viewSha256;
 for(const snapshot of hard.runs[0].snapshots)for(const key of ['path','recordingPath'])if(snapshot[key])snapshot[key]=path.relative(path.resolve(dir),path.resolve(path.dirname(input.hardEvidencePath),snapshot[key]));
 const hardPath=`${dir}/${runId}.hard-evidence.json`;await put(hardPath,hard);
 const post=await read(`${input.attempt}/post-run/post-check.json`),finish=await read(`${input.attempt}/finish.json`);
 const postDeliveryTabelog=post.rows.filter(row=>row.raw?.status===200).map(row=>g.loadPostDeliveryTabelogObservation(row.raw.metadataPath,row.raw.bodyPath));
 let outer=[];try{outer=(await fs.readFile(`${input.attempt}/outer-observations.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(error){if(error.code!=='ENOENT')throw error;}
 const evaluation=tablecheck.applyTableCheckReview(e.evaluateRestaurantHybridLiveArtifact(view,{path:path.resolve(viewPath),sha256:viewSha256},{
  criterionCorrespondences:c.loadCriterionCorrespondences(path.resolve(correspondencePath)),hardEvidence:h.loadHardCriterionEvidence(hardPath,viewSha256),
  reviewedReads,postDeliveryTabelog,trace:[...(original.diagnostics?.browserTrace??[]),...outer],orchestration:finish.orchestration,
 }),post.rows);
 assert.ok(evaluation.evaluatorVersion.endsWith('@33'));assert.ok(evaluation.rubricVersion.endsWith('@29'));
 const evaluationPath=`${dir}/evaluations/${runId}.evaluation.json`;await put(evaluationPath,evaluation);
 assert.equal(sha(await fs.readFile(input.oraclePath)),input.oracleSha256);const oracle=await read(input.oraclePath);
 const budgets=[];
 for(const candidateId of actual.candidateIds){
  const displayed=state.presentedResults.conditionStates[candidateId].find(q=>q.criterionRef==='criterion:1');assert.ok(displayed);assert.equal(displayed.strength,'HARD');
  const independent=evaluation.conditionStates.find(r=>r.candidateId===candidateId).criteria.find(q=>q.goldIndex===1),prior=oracle.conditionStates.find(r=>r.candidateId===candidateId).criteria.find(q=>q.goldIndex===1);
  assert.equal(displayed.status,'MET');assert.equal(independent.status,displayed.status);assert.equal(independent.status,prior.status);assert.equal(independent.supportObservation,'PRODUCT_OBSERVED');
  const comparison=evaluation.conditionStateComparisons.find(r=>r.candidateId===candidateId&&r.criterionRef==='criterion:1');assert.equal(comparison.assessment,'CONSISTENT');
  assert.equal(actual.conditionStates[candidateId].some(q=>q.criterionRef==='criterion:1'),false);
  const facts=restaurantCurrentFactEvidence(state,candidateId);assert.ok(displayed.sources.length);
  for(const source of displayed.sources)assert.ok(facts.some(f=>f.sourceUrl===source.sourceUrl&&[
   f.priceFacts?.dinnerBudgetRangeYen?.quote,...(f.priceFacts?.listedCoursePricesYen.map(p=>p.quote)??[]),
  ].includes(source.quote)),'Budget display must retain existing current merchant price quotes');
  budgets.push({candidateId,outletName:state.candidates.find(c=>c.restaurant.id===candidateId).restaurant.outletName,criterionRef:displayed.criterionRef,
   originalDisplayed:'NOT_RECORDED',displayed,independent,comparison,originalComparison:oracle.conditionStateComparisons.find(q=>q.candidateId===candidateId&&q.criterionRef==='criterion:1')});
 }
 assert.equal(evaluation.conditionStateComparisons.some(q=>q.assessment==='S1_UNSUPPORTED'||q.assessment==='MISSED_KNOWN_CONDITION'),false);
 lineage.push({runId,currentStatePath,currentStateSha256:sha(await fs.readFile(currentStatePath)),stateVersion:state.schemaVersion,originalArtifactPath:input.originalArtifactPath,originalArtifactSha256:input.originalArtifactSha256,replayPath,replaySha256,viewPath,viewSha256,
  approvedRepresentationPath:input.evaluationArtifactPath,approvedRepresentationSha256:input.evaluationArtifactSha256,correspondencePath,hardPath,
  changed:['RESULTS_PRESENTED event from production Router','presentedResults from production Reducer'],preserved:['Gold','semantic proposal and original structured intent','all read evidence and price facts','source recordings and post-run responses','model choices','resource usage and elapsed time'],
  evaluationRepresentation:'Previously approved budgetPerPerson -> criteria representation only, with actual new display; no new semantic correspondence.'});
 rows.push({runId,originalArtifactSha256:input.originalArtifactSha256,replayPath,replaySha256,evaluationPath,evaluationSha256:sha(await fs.readFile(evaluationPath)),
  originalOutcome:oracle.outcome.type,replayOutcome:evaluation.outcome.type,scope:'Offline display replay only; not a new end-to-end or Live success',budgets,severity:evaluation.severity});
 console.log(JSON.stringify({runId,budgetRows:budgets.length,consistent:budgets.filter(b=>b.comparison.assessment==='CONSISTENT').length}));
}
await put(`${dir}/criterion-correspondences.json`,{...approved,entries});await put(`${dir}/lineage.json`,{schema:'budget-condition-display-replay-lineage@1',rows:lineage});
await verify();assert.equal(sourceCalls,0);
const guard=process.env.CHECKPOINT_C_ATTEMPT;assert.ok(guard,'Launch with offline-deny.mjs and CHECKPOINT_C_ATTEMPT');
let denied=[];try{denied=(await fs.readFile(`${guard}/network-denied.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(error){if(error.code!=='ENOENT')throw error;}
assert.equal(denied.length,0);assert.equal(rows.flatMap(r=>r.budgets).length,5);
await put(`${dir}/replay-summary.json`,{schema:'budget-condition-display-replay@1',status:'PASS',scope:'frozen regression; exposed holdout; offline counterfactual presentation, not new Live or original evaluation replacement',codeCommit:freeze.codeCommit,freezeSha256:sha(freezeBytes),
 evaluator:'restaurant-hybrid-read-diagnostic-evaluator@33',rubric:'restaurant-hybrid-read-diagnostic-rubric@29',budgetRows:5,budgetConsistent:5,rows,sourceCalls,deniedNetworkAttempts:denied.length,newModels:0,newWebsites:0,newLive:0});
