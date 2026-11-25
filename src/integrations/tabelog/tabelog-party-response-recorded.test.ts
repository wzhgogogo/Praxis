import assert from 'node:assert/strict';
import test from 'node:test';
import type {BrowserSnapshot} from '../../infrastructure/browser/browser-runtime.js';
import {tabelogAvailabilityCompletion} from './tabelog-browser-availability.js';
import {hasTabelogSelectedQuery,tabelogCapturedSlots} from './tabelog-query-controls.js';
import {cases,recordedPartyPage} from "./fixtures/party-response-recorded/fixture.js";
for(const meta of cases)test(`recorded independent party receipt: ${meta.id}`,async()=>{
 const page=await recordedPartyPage(meta),a=tabelogAvailabilityCompletion(page,meta.goal);
 assert.equal(a.complete,false);assert.deepEqual(a.confirmedFields,['PARTY_SIZE']);assert.match(a.reason,/date/i);
 assert.equal(hasTabelogSelectedQuery(page,meta.goal.date,meta.goal.partySize),false);assert.equal(tabelogCapturedSlots(page,meta.goal.date,meta.goal.partySize),undefined);
 // LOCAL_CONSTRUCTION counterexample: same actual reply with no slots; a
 // query-setting receipt is distinct from availability for the requested date.
 const empty=structuredClone(page);(empty.responses![0]!.body as any).selection={};
 assert.deepEqual(tabelogAvailabilityCompletion(empty,meta.goal).confirmedFields,['PARTY_SIZE']);
 assert.equal(tabelogAvailabilityCompletion(empty,meta.goal).complete,false);
});

test('party progress rejects contradictory, malformed, pending and stale observations',async()=>{
 const {observedTabelogResponsePartySize}=await import('./tabelog-vacancy-response.js');
 const original=await recordedPartyPage(cases[0]);
 const mutations:Array<[string,(s:BrowserSnapshot)=>void]>=[
  ['request party',s=>{s.responses![0]!.url=s.responses![0]!.url.replace('svps=8','svps=2');}],
  ['body party',s=>{(s.responses![0]!.body as any).members=2;}],
  ['duplicate request party',s=>{s.responses![0]!.url+='&svps=8';}],
  ['wrong outlet',s=>{s.responses![0]!.url=s.responses![0]!.url.replace('rst_id=13309182','rst_id=99999999');}],
  ['bad selection',s=>{(s.responses![0]!.body as any).selection='broken';}],
  ['bad row',s=>{(s.responses![0]!.body as any).selection=[{url:1,time:'19:00'}];}],
  ['invalid day',s=>{(s.responses![0]!.body as any).base_date.day=0;}],
  ['invalid month',s=>{(s.responses![0]!.body as any).base_date.month=13;}],
  ['pending',s=>{s.settlement='PENDING';}],
  ['wrong page',s=>{s.url='https://public.example/outlet';}],
  ['failed response',s=>{s.responses![0]!.status=500;}],
  ['visible native conflict',s=>{s.html='<label>Guests<select><option selected value="2">2 guests</option></select></label>';}],
  ['visible aria conflict',s=>{s.html='<fieldset><legend>Guests</legend><button aria-pressed="true">2</button></fieldset>';}],
  ['latest invalid response',s=>{const latest=structuredClone(s.responses![0]!);latest.sequence++;latest.status=500;s.responses!.push(latest);}],
 ];
 for(const [label,change]of mutations){const page=structuredClone(original);change(page);assert.equal(observedTabelogResponsePartySize(page,8),'UNOBSERVED',label);assert.equal(tabelogAvailabilityCompletion(page,cases[0].goal).complete,false,label);}
 for(const html of ['<div hidden><label>Guests<select><option selected value="2">2 guests</option></select></label></div>','<fieldset aria-hidden="true"><legend>Guests</legend><button aria-pressed="true">2</button></fieldset>']){
  assert.equal(observedTabelogResponsePartySize({...original,html},8),'SELECTABLE','hidden choices do not contradict the observed query');
 }
});


test('party progress stays independent of the visible date and never becomes inventory',async()=>{
 const {observedTabelogResponsePartySize}=await import('./tabelog-vacancy-response.js');
 const original=await recordedPartyPage(cases[0]);
 for(const selection of [{},[]]){
  const page=structuredClone(original);(page.responses![0]!.body as any).selection=selection;
  page.html='<label>Date<input type="date" value="2026-12-10"></label><label>Guests<select><option selected value="8">8 guests</option></select></label>';
  assert.equal(observedTabelogResponsePartySize(page,8),'SELECTABLE');
  assert.deepEqual(tabelogAvailabilityCompletion(page,cases[0].goal).confirmedFields,['PARTY_SIZE']);
  assert.equal(tabelogAvailabilityCompletion(page,cases[0].goal).complete,false);
  assert.equal(tabelogCapturedSlots(page,cases[0].goal.date,8),undefined);
 }
});
