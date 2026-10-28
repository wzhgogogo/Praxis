import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {compileRestaurantSemanticProposal} from '../../../src/domains/restaurant/semantic-compiler.ts';
import {restaurantSemanticRegressionProposalFor} from '../../../src/eval/restaurant/semantic/stage-oracles.ts';
import {restaurantSemanticGoalAnnotation} from '../../../src/eval/restaurant/semantic/goal-boundary.ts';
import {scoreRestaurantSemanticTurn,evaluateRestaurantSemanticGoal} from '../../../src/eval/restaurant/semantic/scorer.ts';
import {root,load,save,cet,targetCheck,hash} from './controlled-io.mjs';
import {readFileSync} from 'node:fs';

const execution=load(`${root}/semantic/execution.json`);
function diff(a,b,path=''){
  if(isDeepStrictEqual(a,b))return [];
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b))return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],path?`${path}.${k}`:k));
  return [{path,expected:a??null,actual:b??null}];
}
function projection(draft,gold){
  if(!draft)return null;
  const p={criteria:[...new Set(draft.criteria.map(c=>JSON.stringify({text:c.text.trim().toLowerCase(),polarity:c.polarity,strength:c.strength})))].sort()};
  for(const k of ['date','timeWindow','permittedAlternativeTimeWindow','partySize','area','budgetPerPerson'])if(Object.hasOwn(draft,k))p[k]=draft[k];
  if(gold.target){p.target={};for(const k of ['query','selectionScope','requestedResultCount'])if(Object.hasOwn(gold.target,k)&&draft.target?.[k]!==undefined)p.target[k]=draft.target[k];}
  return p;
}
const corrected=execution.rows.map(row=>{
  if(row.cohort==='NAMED')return {logical:row.logical,sessionId:row.sessionId,turnId:row.turnId,cohort:row.cohort,...row.evaluation};
  const expectation={...restaurantSemanticGoalAnnotation(row.input.message,row.turnId,row.sessionId),...(row.input.currentDraft?.target?{previousGoal:row.input.currentDraft.target.goal}:{})};
  const proposal=row.interpreted.status==='PROPOSED'?row.interpreted.proposal:undefined;
  const oracle=restaurantSemanticRegressionProposalFor(row.input.message);
  const expectedCompilation=compileRestaurantSemanticProposal(oracle,{referenceTime:row.input.referenceTime,timezone:row.input.timezone});
  const goal=evaluateRestaurantSemanticGoal({...(proposal?{proposal}:{}),...(row.actualDraft?.target?{actualGoal:row.actualDraft.target.goal}:{}),expectation});
  const score=scoreRestaurantSemanticTurn({...(proposal?{actualProposal:proposal}:{}),expectedProposal:oracle,
    ...(row.compilation?.status==='COMPILED'?{actualCompiledPatch:row.compilation.patch}:{}),...(expectedCompilation.status==='COMPILED'?{expectedCompiledPatch:expectedCompilation.patch}:{}),
    actualDraft:row.actualDraft,expectedDraft:row.gold,goalBoundary:expectation});
  return {logical:row.logical,sessionId:row.sessionId,turnId:row.turnId,cohort:row.cohort,expectation,goal,strictScore:score,
    requestedValueDifferences:diff(projection(row.gold,row.gold),projection(row.actualDraft,row.gold)),
    fullDraftDifferences:diff(row.gold,row.actualDraft),proposal:row.interpreted.proposal,compiledPatch:row.compilation?.patch,actualDraft:row.actualDraft};
});
const development=corrected.filter(r=>r.cohort==='DEVELOPMENT'),named=corrected.filter(r=>r.cohort==='NAMED');
// Three old outer evaluations omitted contextCarry mapping; recorded model and State were correct.
for(const id of ['SR01-T02','SR08-T02','SR09-T02']){
  const raw=execution.rows.find(r=>r.turnId===id),fixed=development.find(r=>r.turnId===id);
  assert.equal(raw.evaluation.goalEvaluation.status,'NOT_SATISFIED');assert.equal(fixed.expectation.category,'CONTEXT_CARRY');assert.equal(fixed.goal.status,'SATISFIED');
}
const result={schema:'phase3b-c-semantic-posthoc@1',evaluatedAtCET:cet(),executionSha256:hash(readFileSync(`${root}/semantic/execution.json`)),
  correction:'Outer run omitted annotation.contextCarry normalization for SR01/SR08/SR09 corrections. Existing annotation loader applied offline. Raw run retained; no model rerun or Gold/Scorer change.',
  newRealCalls:0,summary:{namedTurns:named.length,namedPassed:named.filter(r=>r.target==='PASS').length,
    developmentTurns:development.length,goalPassed:development.filter(r=>r.goal.status==='SATISFIED').length,strictPassed:development.filter(r=>r.strictScore.status==='PASS').length,
    requestedValuePassed:development.filter(r=>r.requestedValueDifferences.length===0).length},rows:corrected};
save(`${root}/semantic/posthoc-evaluation.json`,result,true);console.log(JSON.stringify(result.summary));
