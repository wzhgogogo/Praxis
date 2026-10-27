import assert from "node:assert/strict";
import test from "node:test";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantPageQuestionRequest } from "../../domains/restaurant/page-question.js";
import { RestaurantPageQuestionReader } from "./page-question-reader.js";

test("fresh question fact reads retain the original browser sub-budget after the outer reader closes",async()=>{
  const budget={totalModelCalls:7,maxModelCalls:8};
  let sourceCalls=0;
  const model:ModelGateway={async complete(){assert.fail("no source page means no answer model");}};
  const reader=new RestaurantPageQuestionReader(model,(_observe,scope)=>({executionRoute:"GENERIC_BROWSER",async inspectFacts(){
    assert.ok(scope);
    if(scope.totalModelCalls>=scope.maxModelCalls!)throw Object.assign(new Error("budget exhausted"),{code:"BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"});
    scope.totalModelCalls++;sourceCalls++;
    return {evidence:[],factChecks:{},metadata:{provider:"RESTAURANT_WEBSITE",route:"GENERIC_BROWSER",latencyMs:0}};
  }}),()=>"2026-10-27T16:00:00Z",500_000,budget);
  reader.finishReadRun("run");budget.totalModelCalls=0;
  const input:RestaurantPageQuestionRequest={requestId:"q",question:"Do they take cards?",candidate:{restaurant:{id:"a",outletName:"Merchant",address:"Tokyo",sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH"},
    intent:{timezone:"Asia/Tokyo",target:{goal:"RECOMMENDATION",query:"merchant"},area:{query:"Tokyo"},criteria:[]},readContext:{runId:"run",startedAt:"2026-10-27T15:59:00Z",deadlineAt:"2026-10-27T16:07:00Z"}};
  assert.equal((await reader.answerQuestion(input,new AbortController().signal)).status,"UNVERIFIED");
  const second=await reader.answerQuestion({...input,requestId:"q2"},new AbortController().signal);
  assert.ok(second.status==="UNVERIFIED"&&second.reason==="BUDGET_EXHAUSTED");
  assert.equal(sourceCalls,1,"one original browser call remained; a fresh question cannot reset it");
  assert.equal(budget.totalModelCalls,0,"another run's mutable counter is not restored or overwritten");
});
