import assert from 'node:assert/strict';
import test from 'node:test';
import {ModelDiscoveryRetrievalPlanner,DISCOVERY_RETRIEVAL_PROMPT_VERSION} from './discovery-retrieval-planner.js';
import type {ModelRequest} from '../../core/model/contracts.js';
const input={taskId:'fixture',intent:{timezone:'Asia/Tokyo' as const,area:{query:'Fixture District'},criteria:[{text:'local food',polarity:'POSITIVE' as const,strength:'HARD' as const}]},locationName:'Fixture District',attemptedRetrievals:[],rewrites:0,timeoutMs:1234};
test('retrieval model uses a versioned strict proposal and shared budget including failures',async()=>{
 const requests:ModelRequest[]=[];const budget={totalModelCalls:0,maxModelCalls:1};
 const planner=new ModelDiscoveryRetrievalPlanner({complete:async r=>{requests.push(r);throw Object.assign(Error('provider rejected'),{code:'PROVIDER_REJECTED'});}},budget);
 await assert.rejects(planner.decide(input),{code:'PROVIDER_REJECTED'});assert.equal(budget.totalModelCalls,1);
 await assert.rejects(planner.decide(input),{code:'BROWSER_GLOBAL_MODEL_BUDGET_EXCEEDED'});assert.equal(requests.length,1);
 assert.equal(requests[0]!.promptVersion,DISCOVERY_RETRIEVAL_PROMPT_VERSION);assert.equal(requests[0]!.outputSchema.version,'1');assert.equal(requests[0]!.timeoutMs,1234);
 await assert.rejects(planner.decide({...input,timeoutMs:0}),{code:'BROWSER_TIMEOUT'});
});
test('an invalid model keyword falls back to general retrieval; no synthetic synonym repair',async()=>{
 const planner=new ModelDiscoveryRetrievalPlanner({complete:async()=>({invocationId:'fixture',provider:'FIXTURE',model:'script',outputText:JSON.stringify({choice:'KEYWORD',keyword:'Fixture 2',criterionRef:'criterion:0',categoryUrl:'',reason:'Bad proposal'}),finishReason:'STOP',latencyMs:0})});
 const result=await planner.decide(input);assert.equal(result.accepted,false);assert.equal(result.keyword,undefined);assert.equal(result.rejectionReason,'INVALID_KEYWORD');
});
test('no positive HARD skips shared text planning but keeps observed category selection',async()=>{
 let calls=0;const budget={totalModelCalls:0,maxModelCalls:1};
 const categoryUrl='https://directory.test/region/category/';
 const planner=new ModelDiscoveryRetrievalPlanner({complete:async()=>{calls++;return {invocationId:'category',provider:'FIXTURE',model:'script',outputText:JSON.stringify({choice:'CATEGORY',keyword:'',criterionRef:'criterion:0',categoryUrl,reason:'Observed category for preference'}),finishReason:'STOP',latencyMs:0};}},budget);
 const request={...input,intent:{...input.intent,criteria:[{text:'good for a first date',polarity:'POSITIVE' as const,strength:'UNSPECIFIED' as const}]}};
 assert.equal((await planner.decide(request)).keyword,undefined);assert.equal(calls,0);assert.equal(budget.totalModelCalls,0);
 assert.equal((await planner.decide({...request,observation:{url:'https://directory.test/region/',title:'List',text:'Category',parsedCount:0,explicitEmpty:true,categories:[{url:categoryUrl,label:'Observed category'}]}})).categoryUrl,categoryUrl);
 assert.equal(calls,1);assert.equal(budget.totalModelCalls,1);
});
