import assert from "node:assert/strict";
import test from "node:test";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantPageQuestionRequest } from "../../domains/restaurant/page-question.js";
import { RestaurantPageQuestionReader } from "./page-question-reader.js";
import { RESTAURANT_PAGE_QUESTION_BUDGET } from "../../domains/restaurant/page-question-limits.js";

test("fresh question reads own independent model and browser counters, with no completed search context",async()=>{
  const searchBudget={totalModelCalls:7,maxModelCalls:8};
  let calls=0;const scopes:object[]=[];
  const model:ModelGateway={async complete(){calls++;return {invocationId:String(calls),provider:"FIXTURE",model:"fixture",outputText:"{}",finishReason:"STOP",latencyMs:0};}};
  const reader=new RestaurantPageQuestionReader(model,(_observe,scope,scopedModel)=>({executionRoute:"GENERIC_BROWSER",async inspectFacts(){
    assert.ok(scope,"question has its own browser counter");assert.ok(scopedModel,"question model is bounded");
    assert.equal(scope.totalModelCalls,0);assert.equal(scope.maxModelCalls,3);scopes.push(scope);
    for(let n=0;n<4;n++)await scopedModel.complete({taskId:"fixture",purpose:"fixture",promptVersion:"1",messages:[],responseFormat:"TEXT",outputSchema:{name:"fixture",version:"1"},timeoutMs:8000,fallback:"FAIL_CLOSED"});
    throw new Error("fourth model call must not return");
  }}),()=>"2026-10-28T02:00:00Z",500_000,searchBudget);
  const input:RestaurantPageQuestionRequest={requestId:"q1",question:"Do they take cards?",candidate:{restaurant:{id:"a",outletName:"Merchant",address:"Tokyo",sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH"},
    intent:{timezone:"Asia/Tokyo",target:{goal:"RECOMMENDATION",query:"merchant"},area:{query:"Tokyo"},criteria:[]},readContext:{runId:"run",startedAt:"2026-10-27T15:59:00Z",deadlineAt:"2026-10-28T02:01:00Z"}};
  for(const requestId of ["q1","q2"]){const result=await reader.answerQuestion({...input,requestId},new AbortController().signal);assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED","each question stops at its own model ceiling");}
  assert.equal(calls,6);assert.notEqual(scopes[0],scopes[1]);
  assert.deepEqual(searchBudget,{totalModelCalls:7,maxModelCalls:8},"the original search budget is not borrowed or overwritten");
});

test("question deadline actively cancels a pending read, without cancelling the next question",async()=>{
  assert.equal(RESTAURANT_PAGE_QUESTION_BUDGET.maxElapsedMs,60_000);
  let cancelled=false,reads=0;
  const model:ModelGateway={async complete(){throw new Error("no pages: no model call");}};
  const reader=new RestaurantPageQuestionReader(model,()=>({executionRoute:"GENERIC_BROWSER",async inspectFacts(_input,signal){
    reads++;
    if(reads===1){await new Promise<void>(resolve=>{if(signal.aborted)resolve();else signal.addEventListener("abort",()=>resolve(),{once:true});});cancelled=signal.aborted;signal.throwIfAborted();}
    return {evidence:[],factChecks:{},metadata:{provider:"RESTAURANT_WEBSITE",route:"GENERIC_BROWSER",latencyMs:0}};
  }}),()=>"2026-10-28T02:00:00Z",500_000,undefined,{...RESTAURANT_PAGE_QUESTION_BUDGET,maxElapsedMs:20});
  const input:RestaurantPageQuestionRequest={requestId:"slow",question:"Do they take cards?",candidate:{restaurant:{id:"a",outletName:"Merchant",address:"Tokyo",sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH"},
    intent:{timezone:"Asia/Tokyo",target:{goal:"RECOMMENDATION",query:"merchant"},area:{query:"Tokyo"},criteria:[]},readContext:{runId:"run",startedAt:"2026-10-27T15:59:00Z",deadlineAt:"2026-10-28T02:01:00Z"}};
  const result=await reader.answerQuestion(input,new AbortController().signal);
  assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED","expired read is unverified");assert.equal(cancelled,true);
  const next=await reader.answerQuestion({...input,requestId:"next"},new AbortController().signal);
  assert.ok(next.status==="UNVERIFIED"&&next.reason==="NO_BOUND_PAGE","the next question starts a fresh live scope");assert.equal(reads,2);
});
