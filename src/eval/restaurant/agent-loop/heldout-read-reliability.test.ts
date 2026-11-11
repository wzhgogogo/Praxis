import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {AvailabilitySourceResolver} from '../../../integrations/restaurant-availability/availability-source-resolver.js';
import {restaurantDiscoveryPacks} from '../../../integrations/restaurant-search/source-packs.js';
import type {RestaurantAvailabilityRequest} from '../../../domains/restaurant/contracts.js';
import type {RestaurantAvailabilityProvider} from '../../../integrations/restaurant-availability/contracts.js';

test('exposed01/02 recorded area candidates omit unevidenced TableCheck and retain the recorded avoided-cost denominator',async()=>{
 const f=JSON.parse(await readFile(new URL('./fixtures/heldout-read-reliability/recorded-routing.json',import.meta.url),'utf8'));
 for(const run of f.runs){let ms=0,models=0;
  for(const item of run.items){
   const calls:string[]=[];
   const bindings=restaurantDiscoveryPacks.flatMap(pack=>pack.availability?[{pack,provider:{provider:pack.availability.provider,executionRoute:'GENERIC_BROWSER',async check(request:RestaurantAvailabilityRequest){calls.push(pack.availability!.provider);return{offers:[],evidence:[],availabilityChecks:{[request.candidateIds[0]!]:{status:'UNKNOWN',checkedAt:run.readStartedAt,evidenceIds:[],reasonCode:'LOCAL_CONSTRUCTION_NO_INVENTORY'}},metadata:{provider:pack.availability!.provider,route:'GENERIC_BROWSER',latencyMs:0}};}} as RestaurantAvailabilityProvider}]:[]);
   // Only request date/party/window are LOCAL_CONSTRUCTION; no held-out turn.
   const request:RestaurantAvailabilityRequest={candidateIds:[item.candidate.restaurant.id],candidates:[item.candidate],selectionScope:'OPEN_ENDED',date:'2030-01-01',timeWindow:{earliest:'19:00',latest:'19:00'},partySize:2,hardCriteria:[]};
   const read=await new AvailabilitySourceResolver(bindings,{}).check(request,new AbortController().signal);
   assert.ok(!calls.includes('TABLECHECK'),run.id+' '+item.candidate.restaurant.outletName);
   assert.ok(read.metadata.skippedSources?.some(a=>a.provider==='TABLECHECK'&&a.reason==='TABLECHECK_NOT_EVIDENCED'));
   assert.ok(!read.metadata.providerAttempts?.some(a=>a.provider==='TABLECHECK'&&a.outcome==='PROVIDER_FAILURE'));
   ms+=item.providerFinished.lifecycle.providerElapsedMs;models+=item.providerFinished.lifecycle.providerModelCalls;
  }
  assert.equal(ms,run.estimatedAvoidedProviderMs);assert.equal(models,run.estimatedAvoidedModelCalls);
 }
});

// LOCAL_CONSTRUCTION evaluator input: a skipped source remains diagnostic data,
// and cannot become a failure or a phantom provider attempt in evaluation.
test('diagnostic evaluator does not score TABLECHECK_NOT_EVIDENCED as a failure',async()=>{
 const {readDiagnosticRun}=await import('./diagnostic-evaluator-record.js');
 const {measureInvestigationProgress}=await import('./diagnostic-evaluator-progress.js');
 const raw={trajectories:Array.from({length:4},(_,i)=>({stepNumber:i+1,stepOutcome:'EXECUTED',action:{type:'CHECK_AVAILABILITY'},observation:{type:'AVAILABILITY',candidateIds:['candidate-'+i]},executionMetadata:{provider:'TABELOG',providerAttempts:[{candidateId:'candidate-'+i,provider:'TABELOG',outcome:'SUCCESS'}],skippedSources:[{candidateId:'candidate-'+i,provider:'TABLECHECK',reason:'TABLECHECK_NOT_EVIDENCED'}]}}))};
 const {record}=readDiagnosticRun(raw);
 assert.equal(record.trajectories?.[0]?.executionMetadata?.skippedSources?.[0]?.reason,'TABLECHECK_NOT_EVIDENCED');
 assert.ok(record.trajectories?.every(t=>t.executionMetadata?.providerAttempts?.length===1));
 const result=measureInvestigationProgress(record);
 assert.deepEqual(result.sameFailureRuns,[]);assert.deepEqual(result.violations,[]);
});
