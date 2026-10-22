// Evaluation-only admission for the user's explicit no-witness/fallback rule.
// It never supplies witnesses or changes product discovery, safety or scoring.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gateWitness} from '../checkpoint-c-live-20261020/policy.mjs';
import {binding} from '../checkpoint-c-live-20261020/certify-witnesses.mjs';
import {certifySavedWitnesses,sourceReadBoundary} from './witnesses.mjs';
import {sha} from './inputs.mjs';
const json=p=>JSON.parse(readFileSync(p));
const checked=r=>{assert.ok(r?.path&&r.sha256,'EXCLUSION_EVIDENCE_REQUIRED');assert.equal(sha(readFileSync(r.path)),r.sha256,'EXCLUSION_EVIDENCE_SHA');return json(r.path);};
function meters(a,b){const r=Math.PI/180,h=Math.sin((Number(b.latitude)-a.latitude)*r/2)**2+Math.cos(a.latitude*r)*Math.cos(Number(b.latitude)*r)*Math.sin((Number(b.longitude)-a.longitude)*r/2)**2;return 12742000*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
function noInventory(raw,meta,rst,v){
 assert.equal(meta.status,200,'NETWORK_FAILURE_IS_NOT_BUSINESS_EXCLUSION');sourceReadBoundary(meta.url,{method:'GET'});
 const u=new URL(meta.url);assert.deepEqual(Object.fromEntries(u.searchParams),{rst_id:rst,svd:v.date.replaceAll('-',''),svps:String(v.partySize),svt:v.earliest.replace(':','')});
 assert.equal(raw.members,v.partySize,'EXCLUSION_RESPONSE_PARTY_MUST_MATCH');assert.ok(raw.base_date,'EXCLUSION_RESPONSE_DATE_REQUIRED');
 assert.equal(`${raw.base_date.year}-${String(raw.base_date.month).padStart(2,'0')}-${String(raw.base_date.day).padStart(2,'0')}`,v.date,'EXCLUSION_RESPONSE_DATE_MUST_MATCH');
 assert.equal(binding(raw,rst,v).length,0,'FEASIBLE_WITNESS_MUST_NOT_BE_EXCLUDED');
}
export function gatePhase2bWitness(registry,caseId,now,horizonMs=0){
 const matches=registry.variants.filter(v=>v.variantId===caseId);assert.equal(matches.length,1,'UNIQUE_WITNESS_CASE_REQUIRED');const row=matches[0];
 if(!row.noWitnessExclusion)return gateWitness(registry,caseId,now,horizonMs);
 assert.equal(row.classification,'NO_WITNESS_EXCLUDED_FROM_CAPABILITY_DENOMINATOR');assert.equal(row.capabilityDenominator,false);assert.equal(row.witnesses.length,0);assert.equal(row.certifiedWitnesses.length,0);
 // Other certified cases still determine the common 24-hour deadline.
 const known=registry.variants.filter(v=>v.classification==='KNOWN_FEASIBLE_SUPPORTED');assert.ok(known.length);
 assert.equal(Date.parse(registry.validUntil),Math.min(...known.map(v=>Date.parse(v.validUntil))),'EXCLUSION_CANNOT_EXTEND_WITNESS_DEADLINE');
 for(const v of known)gateWitness(registry,v.variantId,now,horizonMs);
 const e=checked(row.noWitnessExclusion);assert.equal(e.schema,'phase2b-business-witness-exclusion@1');assert.equal(e.status,'PRIMARY_AND_APPROVED_FALLBACK_NOT_CERTIFIED');assert.equal(e.caseId,caseId);assert.equal(e.authorization,'USER_APPROVED_CONTINUOUS_STEP3_NO_WITNESS_EXCLUSION');
 const primary=checked(e.primaryFailure);assert.equal(primary.caseId,caseId);assert.equal(primary.status,'PRIMARY_BUSINESS_WITNESS_NOT_CERTIFIED');assert.equal(primary.fallback.place,row.place);
 const plan=checked(e.witnessPlan),inventory=checked(e.inventoryIndex),v=plan.variants.find(v=>v.caseId===caseId);assert.ok(v);assert.equal(v.place,row.place);assert.equal(v.center.radiusMeters,800);
 for(const candidate of primary.evidence){assert.equal(candidate.observationRefs.length,3);checked(candidate.observationRefs[0]);const raw=checked(candidate.observationRefs[1]),meta=checked(candidate.observationRefs[2]);assert.equal(meta.sha256,candidate.observationRefs[1].sha256);noInventory(raw,meta,candidate.rst_id,v);}
 assert.ok(primary.evidence.length>0&&primary.evidence.length<=6);
 const recertified=certifySavedWitnesses(plan,inventory).variants.find(v=>v.caseId===caseId);assert.ok(recertified);assert.equal(recertified.witnesses.length,0);assert.ok(recertified.candidates.length>0);
 assert.ok(e.fallbackCandidates.length>0&&e.fallbackCandidates.length<=6);const seen=new Set();
 for(const candidate of e.fallbackCandidates){
  const page=checked(candidate.pageSource),meta=json(page.metadataPath);assert.equal(meta.status,200,'NETWORK_FAILURE_IS_NOT_BUSINESS_EXCLUSION');assert.equal(meta.sha256,page.responseSha256);assert.equal(meta.url,page.url);sourceReadBoundary(page.url,{method:'GET'});
  const businesses=page.evidence.jsonLd.map(x=>{assert.equal(sha(x.raw),x.sha256);return JSON.parse(x.raw);}).filter(b=>b['@id']===page.url);assert.equal(businesses.length,1);const b=businesses[0];assert.ok(b.address&&b.geo);const rst=new URL(page.url).pathname.split('/').filter(Boolean).at(-1);assert.ok(!seen.has(rst));seen.add(rst);
  const distance=meters(v.center,b.geo);assert.ok(Number.isFinite(distance));
  if(distance>800){assert.equal(candidate.reason,'OUTSIDE_800M');continue;}
  assert.equal(candidate.reason,'NO_MATCHING_INVENTORY');assert.equal(page.publicBookingRead.status,'SOURCE_BOUND_READ_EXPOSED');assert.equal(page.publicBookingRead.rst_id,rst);
  const c=recertified.candidates.find(c=>c.rst_id===rst);assert.ok(c);assert.equal(c.classification,'NOT_CERTIFIED_NO_MATCHING_INVENTORY');
  const inv=inventory.filter(i=>i.caseId===caseId&&i.rst_id===rst).sort((a,b)=>a.observedAt.localeCompare(b.observedAt)).at(-1);assert.ok(inv);noInventory(json(inv.bodyPath),json(inv.metadataPath),rst,v);
 }
 assert.deepEqual(recertified.candidates.map(c=>c.rst_id).sort(),e.fallbackCandidates.filter(c=>c.reason==='NO_MATCHING_INVENTORY').map(c=>checked(c.pageSource).publicBookingRead.rst_id).sort());
 return row;
}
