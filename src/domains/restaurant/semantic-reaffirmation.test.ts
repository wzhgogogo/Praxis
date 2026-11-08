import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {restaurantBookingTaskDefinition as definition} from './task-definition.js';
import type {RestaurantEvent} from './contracts.js';

for(const mode of ['SAME','SAME_EXPIRED','DATE','TIME','PARTY','NAME'] as const)test(`D8 actual state projection + semantic reaffirmation: ${mode}`,async()=>{
 const f=JSON.parse(await readFile(new URL('./fixtures/d8-positive-followup-20261108.json',import.meta.url),'utf8'));
 const first=f.prefix[0],ctx={taskId:first.taskId,runId:first.trace.runId,now:first.occurredAt,createId:(p:string)=>p+':component'};
 const state=structuredClone(f.initialStateProjection);
 assert.equal(state.phase,'PRESENT_RESULTS');const event=structuredClone(f.followup.event);
 if(mode==='DATE')event.patch.date='2026-11-12';if(mode==='TIME')event.patch.timeWindow={earliest:'21:00',latest:'21:00'};if(mode==='PARTY')event.patch.partySize=3;if(mode==='NAME')event.patch.target.query+=' Hanare';
 const now=mode==='SAME_EXPIRED'?new Date(Date.parse(f.followup.occurredAt)+20*60_000).toISOString():f.followup.occurredAt;
 const next=definition.transition(state,event,{...ctx,now}).state;
 if(mode==='SAME')assert.deepEqual(next,state,'The actual unchanged TARGET must not reset identity, freshness or inventory');
 else{assert.equal(next.phase,'UNDERSTANDING');assert.deepEqual(next.candidates,[]);assert.deepEqual(next.availability,{});assert.deepEqual(next.readEvidence,[]);}
});
