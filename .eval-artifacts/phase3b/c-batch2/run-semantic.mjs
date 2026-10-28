import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {RestaurantSemanticInterpreter} from '../../../src/domains/restaurant/semantic-interpreter.ts';
import {compileRestaurantSemanticProposal} from '../../../src/domains/restaurant/semantic-compiler.ts';
import {restaurantBookingTaskDefinition} from '../../../src/domains/restaurant/task-definition.ts';
import {InMemoryTaskRuntime} from '../../../src/core/task-runtime/in-memory-task-runtime.ts';
import {FakeClock} from '../../../src/harness/fake-clock.ts';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {restaurantSemanticRegressionProposalFor} from '../../../src/eval/restaurant/semantic/stage-oracles.ts';
import {scoreRestaurantSemanticTurn,evaluateRestaurantSemanticGoal} from '../../../src/eval/restaurant/semantic/scorer.ts';
import {root,load,save,cet,verify,charge,start,Stop,targetCheck,fragmentValid,checkBudget} from './controlled-io.mjs';

const input=load(`${root}/semantic-inputs.json`),annotations=load('src/eval/restaurant/semantic/cases/goal-boundary-annotations.json');
const hasBasis=x=>!!x&&typeof x==='object'&&(Object.hasOwn(x,'goalBasis')||Object.values(x).some(hasBasis));
function sessionRuntime(id,referenceTime){
  const clock=new FakeClock(referenceTime);let seq=0;const runtime=new InMemoryTaskRuntime(restaurantBookingTaskDefinition,clock,p=>`${p}:${++seq}`);
  runtime.createTask(id,{}, {runId:id});
  return {snapshot:()=>runtime.snapshot(id),dispatch(event){
    const before=runtime.snapshot(id),eventId=`event:${++seq}`;
    const result=runtime.dispatch({id:eventId,taskId:id,event,occurredAt:clock.now().toISOString(),trace:{schemaVersion:'1',runId:id,correlationId:eventId,actor:'MODEL'}},before.version);
    if(result.commands?.length||hasBasis(result.snapshot.domainState.intentDraft))throw new Stop('S0_AUTHORITY_BOUNDARY');
    if(event.patch?.target?.goal&&result.snapshot.domainState.intentDraft?.target?.goal!==event.patch.target.goal)throw new Stop('S0_GOAL_MUTATED_DOWNSTREAM');
    return result;
  }};
}
async function selfTest(){
  assert(targetCheck({query:'Sushi Dai',selectionScope:'SPECIFIC_OUTLET',goal:'AVAILABILITY'},{contains:'Sushi Dai',scope:'SPECIFIC_OUTLET',goal:'AVAILABILITY'}));
  assert(!targetCheck({query:'Restaurants in Tsukiji',selectionScope:'OPEN_ENDED',goal:'AVAILABILITY'},{contains:'Sushi Dai',scope:'SPECIFIC_OUTLET',goal:'AVAILABILITY'}));
  assert(fragmentValid({name:'Dengana Akabane'},{field:'name',start:0,end:7,fragment:'Dengana'}));
  assert(!fragmentValid({name:'Dengana Akabane'},{field:'name',start:0,end:7,fragment:'Sushi X'}));
  assert.throws(()=>checkBudget([{id:'phase3b-c-batch2-call-test',realModelCalls:100}],'realModelCalls'),/BUDGET/);
  assert.throws(()=>checkBudget([{id:'peer',evaluationPublicGET:40}],'evaluationPublicGET'),/BUDGET/);
  assert.equal(input.namedCases.length*input.namedRepetitions*2,24);
  assert.equal(input.developerSet.sessions.flatMap(s=>s.turns).length,15);
  assert.equal(load(`${root}/subjects.json`).subjects.reduce((n,s)=>n+(s.cohort==='NEW_PRIMARY'?2:1),0),31);
  console.log('PASS offline target-loss, fragment, budget and exact 39-turn plan controls;0 real calls');
}
async function execute(){
  const sourceCommit=start('semantic',['DEEPSEEK_API_KEY']);assert.equal(process.env.DEEPSEEK_MODEL,'deepseek-v4-flash');
  mkdirSync(`${root}/semantic/calls`,{recursive:true});mkdirSync(`${root}/semantic/rows`,{recursive:true});
  let active,fatal,callCount=0;const records=[];
  const provider=DeepSeekModelGateway.fromEnvironment(process.env,{observer:{observe(record){records.push(record);}}});
  const gateway={async complete(request){
    verify();if(callCount>=78)throw new Stop('SEMANTIC_PLAN_EXHAUSTED');
    const {entry,number}=charge('MODEL',{purpose:'SEMANTIC',sessionId:active.sessionId,turnId:active.turnId,sourceCommit});callCount++;
    const path=`${root}/semantic/calls/${String(number).padStart(3,'0')}`;active.callIds.push(entry.id);records.length=0;
    save(path+'.started.json',{atCET:cet(),request,ledgerId:entry.id},true);
    try{const response=await provider.complete(request);save(path+'.response.json',{atCET:cet(),response,providerRecords:records},true);return response;}
    catch(e){fatal=new Stop('INFRASTRUCTURE_MODEL_FAILURE',{code:e?.code??'UNKNOWN'});save(path+'.failure.json',{atCET:cet(),code:e?.code??'UNKNOWN',providerRecords:records},true);throw fatal;}
  }};
  const interpreter=new RestaurantSemanticInterpreter(gateway),rows=[];let stop;
  const sessions=[];
  for(const s of input.namedCases)for(let repetition=1;repetition<=3;repetition++)sessions.push({...s,id:`${s.id}-R${repetition}`,cohort:'NAMED',repetition});
  sessions.push(...input.developerSet.sessions.map(s=>({...s,referenceTime:s.referenceTime??input.developerSet.referenceTime,cohort:'DEVELOPMENT'})));
  try{
    for(const session of sessions){
      const runtime=sessionRuntime(session.id,session.referenceTime);
      for(const turn of session.turns){
        const before=runtime.snapshot().domainState.intentDraft;
        active={sessionId:session.id,turnId:turn.id,callIds:[]};
        const request={taskId:session.id,message:turn.message,referenceTime:session.referenceTime,timezone:'Asia/Tokyo',...(before?{currentDraft:before}:{})};
        const interpreted=await interpreter.interpret(request);let compilation,transition;
        if(fatal)throw fatal;
        if(interpreted.status==='MODEL_FAILURE')throw new Stop('INFRASTRUCTURE_OR_BUDGET_MODEL_FAILURE',{code:interpreted.errorCode??'UNKNOWN'});
        if(interpreted.status==='PROPOSED'){
          compilation=compileRestaurantSemanticProposal(interpreted.proposal,{referenceTime:session.referenceTime,timezone:'Asia/Tokyo'});
          transition=runtime.dispatch(compilation.status==='COMPILED'?{type:'SEMANTIC_PROPOSAL_COMPILED',patch:compilation.patch}:{type:'SEMANTIC_CONFLICT_RECORDED',conflict:compilation.conflict});
        }
        const draft=runtime.snapshot().domainState.intentDraft;
        let strictScore,goalEvaluation;
        if(session.cohort==='DEVELOPMENT'){
          const expectedProposal=restaurantSemanticRegressionProposalFor(turn.message);
          const expectedCompilation=compileRestaurantSemanticProposal(expectedProposal,{referenceTime:session.referenceTime,timezone:'Asia/Tokyo'});
          const annotation=annotations.turns.find(r=>r.turnId===turn.id);
          const expectation={category:annotation.category,message:turn.message,...(before?.target?{previousGoal:before.target.goal}:{})};
          strictScore=scoreRestaurantSemanticTurn({...(interpreted.status==='PROPOSED'?{actualProposal:interpreted.proposal}:{}),expectedProposal,
            ...(compilation?.status==='COMPILED'?{actualCompiledPatch:compilation.patch}:{}),...(expectedCompilation.status==='COMPILED'?{expectedCompiledPatch:expectedCompilation.patch}:{}),
            actualDraft:draft,expectedDraft:turn.expectedDraft,goalBoundary:expectation});
          goalEvaluation=evaluateRestaurantSemanticGoal({...(interpreted.status==='PROPOSED'?{proposal:interpreted.proposal}:{}),...(draft?.target?{actualGoal:draft.target.goal}:{}),expectation});
        }
        const requestedFieldDifferences=Object.entries(turn.expectedFields??{}).filter(([k,v])=>!isDeepStrictEqual(draft?.[k],v)).map(([field,expected])=>({field,expected,actual:draft?.[field]??null}));
        const row={logical:rows.length+1,cohort:session.cohort,sessionId:session.id,repetition:session.repetition??1,turnId:turn.id,input:request,
          interpreted,compilation,actualDraft:draft,commands:transition?.commands??[],gold:turn.expectedDraft??turn.target,
          evaluation:{...(turn.target?{target:targetCheck(draft?.target,turn.target)?'PASS':'FAIL'}:{}),requestedFieldDifferences,strictScore,goalEvaluation},callIds:active.callIds};
        rows.push(row);save(`${root}/semantic/rows/${String(rows.length).padStart(3,'0')}.json`,row,true);
        console.log(JSON.stringify({event:'semantic-turn',logical:rows.length,planned:39,turnId:turn.id,cohort:session.cohort,target:row.evaluation.target,strict:strictScore?.status,calls:callCount}));
      }
    }
    assert.equal(rows.length,39);verify();
  }catch(e){stop={code:e?.code??'INFRASTRUCTURE_RUNNER_FAILURE',detail:e?.detail??{type:e?.name??'UNKNOWN'}};}
  const summary={status:stop?'STOPPED':'COMPLETED',sourceCommit,finishedAtCET:cet(),newRealModelCalls:callCount,plannedLogicalTurns:39,completedLogicalTurns:rows.length,
    named:rows.filter(r=>r.cohort==='NAMED').map(r=>({session:r.sessionId,turnId:r.turnId,target:r.evaluation.target,requestedFieldDifferences:r.evaluation.requestedFieldDifferences})),
    development:rows.filter(r=>r.cohort==='DEVELOPMENT').map(r=>({turnId:r.turnId,...r.evaluation})),...(stop?{stop}:{})};
  save(`${root}/semantic/execution.json`,{...summary,rows},true);save(`${root}/semantic/summary.json`,summary,true);console.log(JSON.stringify({status:summary.status,logical:rows.length,calls:callCount,stop}));
}
if(process.argv.includes('--self-test'))await selfTest();else if(process.argv.includes('--execute'))await execute();else throw Error('Choose --self-test or --execute');
