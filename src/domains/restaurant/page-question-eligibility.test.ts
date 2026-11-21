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
