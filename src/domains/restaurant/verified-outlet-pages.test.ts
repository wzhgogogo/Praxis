import assert from 'node:assert/strict';import test from 'node:test';import {readFile} from 'node:fs/promises';
import {verifiedOutletPagesForAvailability} from './named-outlet-resolution.js';
import type{RestaurantTaskState}from'./contracts.js';
const state=async()=>JSON.parse(await readFile(new URL('./fixtures/d8-direct-outlet-state-20261109.json',import.meta.url),'utf8')) as RestaurantTaskState;
test('availability source page is projected only for HIGH and uniquely resolved identity',async()=>{
 const s=await state(),id=s.selectedCandidateId!;
 assert.equal(verifiedOutletPagesForAvailability(s,[id]).filter(p=>p.provider==='TABLECHECK').length,1);
 const low=structuredClone(s);for(const e of low.readEvidence)if(e.provider==='TABLECHECK'&&e.entityMatch)e.entityMatch.confidence='LOW';
 assert.equal(verifiedOutletPagesForAvailability(low,[id]).some(p=>p.provider==='TABLECHECK'),false);
 const ambiguous=structuredClone(s),other=structuredClone(s.candidates.find(c=>c.restaurant.id===id)!);other.restaurant.id='different-peer';ambiguous.candidates.push(other);
 ambiguous.readEvidence.push(...s.readEvidence.filter(e=>e.candidateId===id).map(e=>({...structuredClone(e),evidenceId:e.evidenceId+':peer',candidateId:other.restaurant.id})));
 assert.equal(verifiedOutletPagesForAvailability(ambiguous,[id]).length,0);
 const conflict=structuredClone(s),original=s.readEvidence.find(e=>e.provider==='TABLECHECK'&&e.entityMatch?.confidence==='HIGH')!;
 conflict.readEvidence.push({...structuredClone(original),evidenceId:'different-entity',sourceEntityId:'different-branch'});
 assert.equal(verifiedOutletPagesForAvailability(conflict,[id]).some(p=>p.provider==='TABLECHECK'),false);
});
