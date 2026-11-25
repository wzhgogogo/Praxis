import assert from 'node:assert/strict';
import test from 'node:test';
import {canAskPageQuestion} from './read-assessment.js';
import type {RestaurantTaskState} from './contracts.js';
test('Round20 page questions permit only presented or explicitly stopped openable outlets',()=>{
 const state:RestaurantTaskState={schemaVersion:'25',phase:'PRESENT_RESULTS',candidates:[],availability:{},availabilityChecks:{},readEvidence:[],searchRevision:0};
 for(const phase of ['FAILED','NO_VERIFIED_RESULT','OUTCOME_UNKNOWN'] as const){
  for(const code of ['AGENT_LOOP_CANCELLED','SEMANTIC_INTERPRETATION_FAILED','AGENT_EXECUTION_FAILED'] as const){
   const current={...state,phase,failure:{code,message:'test'}};
   assert.equal(canAskPageQuestion(current,'a',['a']),phase==='FAILED'&&code==='AGENT_LOOP_CANCELLED');
   assert.equal(canAskPageQuestion(current,'a',[]),false);
  }
 }
 assert.equal(canAskPageQuestion(state,'a',['a']),false,'ready alone is not the presented batch');
});

test("Round21 settlement requires the original accepted identity and leaves the question deadline binding",async()=>{
 const {canSettlePageQuestion,restaurantInvestigationReadRunId}=await import("./read-assessment.js");
 const {validateRestaurantAction}=await import("./action-validator.js");
 const id="a",runId="actual-task-run:investigation:2";
 const q={candidateId:id,question:"Is a card required?",requestId:"q",readRunId:runId,readStartedAt:"2026-11-21T08:00:00Z",requestedAt:"2026-11-21T08:00:00Z",deadlineAt:"2026-11-21T08:00:10Z"};
 const state:RestaurantTaskState={schemaVersion:"25",phase:"FAILED",failure:{code:"AGENT_LOOP_CANCELLED",message:"Stopped"},
   investigationRevision:2,candidates:[{restaurant:{id,outletName:"Fixture",address:"Tokyo",sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH"}],availability:{},availabilityChecks:{},readEvidence:[],searchRevision:0,pageQuestion:q};
 assert.equal(canAskPageQuestion(state,id,[]),false);
 assert.equal(canSettlePageQuestion(state,q,restaurantInvestigationReadRunId(state,"actual-task-run")),true);
 assert.equal(canSettlePageQuestion(state,q,"old-task-run:investigation:2"),false);
 assert.equal(canSettlePageQuestion({...state,investigationRevision:3},q,runId),false);
 assert.equal(canSettlePageQuestion(state,{...q,requestId:"old-question"},runId),false);
 assert.equal(canSettlePageQuestion({...state,candidates:[]},q,runId),false);
 assert.equal(validateRestaurantAction(state,{type:"ANSWER_PAGE_QUESTION"},"2026-11-21T08:00:10Z",{},runId).status,"REJECTED");
 assert.equal(validateRestaurantAction(state,{type:"ANSWER_PAGE_QUESTION"},"2026-11-21T08:00:09Z",{remainingModelCalls:0},runId).status,"REJECTED");
 assert.equal(validateRestaurantAction(state,{type:"ANSWER_PAGE_QUESTION"},"2026-11-21T08:00:09Z",{},runId).status,"ALLOWED");
});
