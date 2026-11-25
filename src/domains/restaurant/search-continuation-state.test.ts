import assert from 'node:assert/strict';
import test from 'node:test';
import {restaurantBookingTaskDefinition} from './task-definition.js';
import {fixtureIntent,fixtureCandidates} from '../../harness/restaurant-fixtures.js';
import type {RestaurantTaskState} from './contracts.js';

test('same request after key-reordered persistence retains checked candidates through an empty late discovery batch; changed party resets',()=>{
 const ctx={taskId:'continuation',runId:'continuation',now:'2026-11-10T03:00:00Z',createId:(p:string)=>p};
 const state:RestaurantTaskState={schemaVersion:'25',phase:'SEARCHING',intent:Object.fromEntries(Object.entries(fixtureIntent).reverse()) as typeof fixtureIntent,candidates:structuredClone(fixtureCandidates),availability:{},availabilityChecks:{[fixtureCandidates[0]!.restaurant.id]:{status:'UNKNOWN',checkedAt:ctx.now,evidenceIds:[],reasonCode:'AVAILABILITY_RESULT_UNOBSERVED'}},readEvidence:[],searchRevision:2};
 for(const changed of [false,true]){
  const intent={...fixtureIntent,...(changed?{partySize:fixtureIntent.partySize+1}:{})};
  const next=restaurantBookingTaskDefinition.transition(state,{type:'SEARCH_COMPLETED',request:{intent},candidates:[],evidence:[],metadata:{provider:"TABELOG",route:"GENERIC_BROWSER",latencyMs:0}},ctx).state;
  assert.equal(next.candidates.length,changed?0:state.candidates.length);
  assert.deepEqual(next.availabilityChecks,changed?{}:state.availabilityChecks);
 }
});
