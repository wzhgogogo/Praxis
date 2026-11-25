import assert from 'node:assert/strict';import test from 'node:test';import {readFile} from 'node:fs/promises';
import {restaurantBookingTaskDefinition} from '../domains/restaurant/task-definition.js';
import {RestaurantExecutionRouter} from '../application/restaurant-execution-router.js';
import {SourceAwareFactRead} from '../integrations/restaurant-facts/native-source-facts.js';
import {ModelRestaurantFactJudgment} from '../integrations/restaurant-facts/model-fact-judgment.js';
import {projectRestaurantAgentContext} from '../domains/restaurant/agent-context.js';
import type {RestaurantTaskState,RestaurantEvent} from '../domains/restaurant/contracts.js';
const fixture=JSON.parse(await readFile(new URL('../eval/restaurant/agent-loop/fixtures/seed-root-causes/07-r2.json',import.meta.url),'utf8'));
test('07-r2 recorded batch: two supported AVAILABLE candidates survive third Google failure and remain presentable',async()=>{
 const search=fixture.events[1].event;
 let state:RestaurantTaskState={schemaVersion:'25',phase:'SEARCHING',intentDraft:fixture.trajectory.decisionContext.intentDraft,candidates:search.candidates,availability:{},availabilityChecks:{},readEvidence:search.evidence,searchRevision:0};
 const row=fixture.events[2];state=restaurantBookingTaskDefinition.transition(state,row.event,{taskId:'recorded-component',runId:'recorded-component',now:row.occurredAt,createId:p=>p}).state;
 const action=fixture.trajectory.agentAction,at=fixture.trajectory.occurredAt;let judged=0,google=0;
 const judge=new ModelRestaurantFactJudgment({async complete(){const r=fixture.recordedJudgments[judged++];return {invocationId:'recorded-'+r.sequence,provider:'FIXTURE',model:'RECORDED_JUDGMENT',outputText:r.outputText,finishReason:'TOOL_CALLS',latencyMs:0};}},()=>at,e=>(e.sourceFieldQuotes??[]).filter(q=>q.field==='CATEGORY').map(q=>q.quote));
 const fallback={executionRoute:'GENERIC_BROWSER' as const,async inspectFacts(){google++;throw Object.assign(new Error('Recorded third candidate transport failed'),{code:'GOOGLE_NETWORK_FAILED'});}};
 const facts=new SourceAwareFactRead(fallback,fallback,judge);
 const empty={evidence:[],metadata:{provider:'FIXTURE' as const,route:'STRUCTURED_ADAPTER' as const,latencyMs:0}};
 const router=new RestaurantExecutionRouter({executionRoute:'STRUCTURED_ADAPTER',async search(){return {...empty,candidates:[]};}},{executionRoute:'STRUCTURED_ADAPTER',async check(){return {...empty,offers:[],availabilityChecks:{}};}},{structuredReadTimeoutMs:8000,browserReadTimeoutMs:90000},facts);
 const result=await router.execute(action,state,at,'recorded-component');
 assert.equal(result.event?.type,'CANDIDATE_FACTS_CHECKED');if(result.event?.type!=='CANDIDATE_FACTS_CHECKED')throw Error('Missing fact event');
 assert.equal(judged,2);assert.equal(google,1);
 for(const id of action.candidateIds.slice(0,2)){assert.equal(result.event.factChecks[id]?.status,'COMPLETED');assert.ok(result.event.factChecks[id]!.evidenceIds.length);assert.ok(result.event.evidence.some(e=>e.candidateId===id&&e.kind==='RESTAURANT_FACT'));}
 assert.equal(result.event.factChecks[action.candidateIds[2]]?.status,'UNKNOWN');assert.equal(result.event.factChecks[action.candidateIds[2]]?.reasonCode,'GOOGLE_NETWORK_FAILED');
 state=restaurantBookingTaskDefinition.transition(state,result.event,{taskId:'recorded-component',runId:'recorded-component',now:at,createId:p=>p}).state;
 const context=projectRestaurantAgentContext(state,at);
 for(const id of action.candidateIds.slice(0,2))assert.ok(context.presentation.some(c=>c.candidateId===id&&c.eligible),JSON.stringify(context.presentation));
});
