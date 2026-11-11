import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import type {BrowserRuntime,BrowserSession} from '../../infrastructure/browser/browser-runtime.js';
import {TableCheckBookingHandoffReader} from './tablecheck-booking-handoff-reader.js';
import {completeRestaurantIntent} from '../../domains/restaurant/intent-state.js';
import {withBookingHandoffs} from '../../application/restaurant-booking-handoff.js';

// Actual controls + recorded initial domain projection. Only the runtime tap,
// clock and return envelope are component I/O projections, not HTTP/model data.
for(const mode of ['BOUND','UNKNOWN','LOW','HIDDEN','OTHER_SHOP','STALE','WRONG_TIME'] as const)test(`D8 exact observed entrance with independently grounded inventory: ${mode}`,async()=>{
 const f=JSON.parse(await readFile(new URL('./fixtures/d8-positive-b1-20261108.json',import.meta.url),'utf8')),v=f.view,id=v.restaurant.selectedCandidateId,request=completeRestaurantIntent(v.restaurant.intentDraft)!;
 const e=v.restaurant.readEvidence.find((e:any)=>e.kind==='AVAILABILITY'&&e.candidateId===id),controls=structuredClone(f.controls);
 if(mode==='UNKNOWN')v.restaurant.availabilityChecks[id].status='UNKNOWN';if(mode==='LOW')e.entityMatch.confidence='LOW';
 for(const c of controls){if(mode==='HIDDEN')c.visible=false;if(c.href?.includes('/reserve')){if(mode==='OTHER_SHOP')c.href=c.href.replace('nakamata-nodoguro-ginza','different-outlet');if(mode==='WRONG_TIME')c.href+='?start_time=21%3A00';}}
 const now=mode==='STALE'?e.displayExpiresAt:e.observedAt;
 const reader=new TableCheckBookingHandoffReader({openSession:async()=>({snapshot:async()=>({url:f.pageUrl,title:'recorded controls',html:'',text:'',settlement:f.settlement}),observeControls:async()=>controls} as BrowserSession)} as BrowserRuntime,()=>v.case.rootTaskId,()=>now);
 await reader.capture({candidateIds:[id],candidates:v.restaurant.candidates,date:request.date,timeWindow:request.timeWindow,partySize:request.partySize,hardCriteria:[]},new AbortController().signal,async()=>{
  const s=await reader.runtime.openSession({signal:new AbortController().signal});await s.snapshot();await s.observeControls!();
  return{offers:v.restaurant.availability[id],availabilityChecks:v.restaurant.availabilityChecks,evidence:v.restaurant.readEvidence,metadata:{provider:'TABLECHECK',route:'GENERIC_BROWSER',latencyMs:0}};
 });
 const prepared=reader.readPrepared(v),shown=withBookingHandoffs(v,prepared,now).restaurant.bookingHandoffs??[];
 assert.equal(shown.length,mode==='BOUND'?1:0);
 if(mode==='BOUND'){const url=new URL(shown[0]!.url);assert.equal(url.origin+url.pathname,'https://www.tablecheck.com/en/nakamata-nodoguro-ginza/reserve/landing');assert.deepEqual(Object.fromEntries(url.searchParams),{start_date:'2026-11-11',num_people:'2',start_time:'20:30'});assert.deepEqual(shown[0]!.terms,[],'Pending document is not a G1 terms answer');}
});
