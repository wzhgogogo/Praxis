import assert from "node:assert/strict";
import { test } from "node:test";
import { BrowserTaskExecutor } from "./browser-task-executor.js";

test("source-fact model calls share existing candidate/run budgets and cancellation",async()=>{
 const budget={totalModelCalls:0,maxModelCalls:2};
 const executor=new BrowserTaskExecutor({openSession:async()=>assert.fail("no page visit required for a cached source model read")},{maxAutomaticElapsedMs:10000,maxModelCallsPerCandidate:1,maxModelCallsTotal:2,maxOperationsPerCandidate:4,budget});
 let calls=0;const work=async()=>++calls,signal=new AbortController().signal;
 executor.beginCandidate("a");executor.beginProvider("a","TABELOG");
 assert.equal(await executor.readModel(signal,work),1);
 await assert.rejects(executor.readModel(signal,work),{code:"BROWSER_CANDIDATE_MODEL_BUDGET_EXCEEDED"});
 assert.equal(calls,1);assert.equal(budget.totalModelCalls,1);
 executor.beginCandidate("b");executor.beginProvider("b","TABLECHECK");assert.equal(await executor.readModel(signal,work),2);
 executor.beginCandidate("c");executor.beginProvider("c","TABELOG");await assert.rejects(executor.readModel(signal,work),{code:"BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED"});
 const abort=new AbortController();abort.abort();await assert.rejects(executor.readModel(abort.signal,work),{code:"BROWSER_ABORTED"});
 assert.equal(calls,2);assert.equal(budget.totalModelCalls,2);await executor.close();
});
