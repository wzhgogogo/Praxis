import{readFileSync,writeFileSync}from"node:fs";
import assert from"node:assert/strict";
import{fileURLToPath}from"node:url";
import{resolve}from"node:path";
import{isDeepStrictEqual}from"node:util";
import{evaluateRestaurantSemanticGoal}from"../../src/eval/restaurant/semantic/scorer.ts";
import{restaurantSemanticGoalAnnotation}from"../../src/eval/restaurant/semantic/goal-boundary.ts";
const root=process.cwd(),folder=fileURLToPath(new URL(".",import.meta.url)),output=resolve(folder,"execution");
const load=p=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
const dataset=load("src/eval/restaurant/semantic/cases/restaurant-semantic-regression.gold5.json");
const oldInputs=load(".eval-artifacts/phase3b/c-batch2/semantic-inputs.json");
const baseline=load(".eval-artifacts/phase3b/c-batch2/semantic/posthoc-evaluation.json");
const prior=Array.from({length:15},(_,i)=>load(".eval-artifacts/phase3b/c-batch2/semantic/rows/"+String(i+25).padStart(3,"0")+".json"));
function compare(result){
const rows=[],regressions=[];
for(const session of dataset.sessions)for(const [index,turn]of session.turns.entries()){
  const old=prior.find(x=>x.turnId===turn.id),current=result.turns.find(x=>x.turnId===turn.id),corrected=baseline.rows.find(x=>x.cohort==="DEVELOPMENT"&&x.turnId===turn.id);
  const oldInput=oldInputs.developerSet.sessions.flatMap(s=>s.turns).find(t=>t.id===turn.id);
  if(!isDeepStrictEqual(oldInput,turn))throw Error("Baseline input differs: "+turn.id);
  const comparable=index===0;
  const fact=(proposal,field)=>proposal?.facts.find(f=>f.field===field&&f.operation!=="RETRACT")?.value;
  const target=fact(current.proposal,"TARGET");
  let goal=current.goalBoundary;
  // Early strict-oracle rejection leaves no authoritative Draft. Evaluate only the
  // saved first-turn TARGET proposal with the existing scorer, and label it as such.
  if(!goal&&comparable&&current.proposal){
    const annotation=restaurantSemanticGoalAnnotation(turn.message,turn.id,session.id);
    goal=evaluateRestaurantSemanticGoal({proposal:current.proposal,...(target?.goal?{actualGoal:target.goal}:{}),expectation:{...annotation,message:turn.message}});
  }
  const changes=[];
  if(old.evaluation.strictScore.status==="PASS"&&current.status!=="PASS")changes.push("STRICT_PASS_LOST");
  if(comparable&&old.interpreted.status==="PROPOSED"&&current.modelStatus&&current.modelStatus!=="PROPOSED")changes.push("MODEL_OR_CONTRACT_FAILURE");
  if(comparable&&corrected.goal.status==="SATISFIED"&&goal?.status==="NOT_SATISFIED")changes.push("GOAL_REGRESSION");
  if(comparable&&current.proposal){
    const expected=turn.expectedDraft.partySize;
    const party=fact(current.proposal,"PARTY_SIZE");
    if(expected!==undefined&&old.actualDraft?.partySize===expected&&party?.kind==="PARTY_SIZE"&&typeof party.value==="number"&&party.value!==expected)changes.push("PARTY_SIZE_REGRESSION");
  }
  if(changes.length)regressions.push({turnId:turn.id,changes});
  rows.push({turnId:turn.id,inputAndGoldEqual:true,sameInitialContext:comparable,baselineStrict:corrected.strictScore.status,baselineFirstFailure:corrected.strictScore.firstFailureStage,baselineGoal:corrected.goal.status,baselineRequestedValueDifferenceCount:corrected.requestedValueDifferences.length,currentStrict:current.status,currentFirstFailure:current.firstFailureStage??null,currentModel:current.modelStatus??"NOT_REACHED",currentGoal:goal?.status??"NOT_EVALUATED",goalEvidence:current.goalBoundary?"AUTHORITATIVE_DRAFT":goal?"FIRST_TURN_PROPOSAL":"NOT_EVALUATED",changes});
}
const comparison={classification:"EXPOSED_DEVELOPMENT_SINGLE_DIAGNOSTIC",baselineCommit:"a31ad5f127b5b032560e3066869a0e35ce09f9c8",baselinePrompt:"v26",currentPrompt:"v28",officialSummary:result.summary,rows,regressions,status:regressions.length?"STOP_NEW_REGRESSION":"NO_NEW_REGRESSION_DETECTED_WITH_LIMITED_COMPARABILITY",limitations:["v26 custom runner continued all turns after strict failure; current official runner blocks later turns","State/TaskDefinition changed between v26 baseline and current branch; downstream comparisons are limited","No viewing context is sent by this regression; contextual instruction quality is not measured","No product delivery or independent S0 source-claim evaluation"]};
return comparison;
}
let comparison;
if(process.argv.includes("--self-test")){
 const control={summary:{},turns:prior.map(row=>({turnId:row.turnId,status:row.evaluation.strictScore.status,firstFailureStage:row.evaluation.strictScore.firstFailureStage,modelStatus:row.interpreted.status,proposal:row.interpreted.proposal,goalBoundary:row.evaluation.goalEvaluation}))};
 assert.equal(compare(control).regressions.length,0);
 const broken=structuredClone(control);const turn=broken.turns.find(row=>row.turnId==="SR01-T01");turn.proposal.facts.find(f=>f.field==="PARTY_SIZE").value.value=3;
 assert.ok(compare(broken).regressions.some(row=>row.turnId==="SR01-T01"&&row.changes.includes("PARTY_SIZE_REGRESSION")));
 console.log("PASS: unchanged v26 control and independently known 2-to-3 party regression; zero real calls");process.exit(0);
}
const result=JSON.parse(readFileSync(resolve(output,"result.json"),"utf8")).report;
comparison=compare(result);
writeFileSync(resolve(output,"comparison.json"),JSON.stringify(comparison,null,2)+"\n",{flag:"wx"});
console.log(JSON.stringify({status:comparison.status,regressions:comparison.regressions,rows:comparison.rows.length,officialSummary:result.summary}));
