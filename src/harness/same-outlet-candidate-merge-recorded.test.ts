import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {mergeDiscoveryCandidates} from '../integrations/restaurant-search/native-restaurant-search.js';
import type {RestaurantCandidate,RestaurantReadEvidence} from '../domains/restaurant/contracts.js';
const root=new URL('./browser/fixtures/same-outlet-merge-recorded/',import.meta.url);
const provenance=JSON.parse(await readFile(new URL('provenance.json',root),'utf8'));
async function fixture(name:string){const bytes=await readFile(new URL(name,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),provenance.files[name]);return JSON.parse(bytes.toString());}
const recorded=await fixture('d02v-r1.json');
const native:RestaurantCandidate=recorded.primary[0];
const google:RestaurantCandidate=recorded.supplement.find((c:RestaurantCandidate)=>c.restaurant.sourceIds.phone===native.restaurant.sourceIds.phone);
assert.ok(google);
// Real candidate/detail projection and original HIGH bindings, not full website JS replay.
test('D02V-r1 verified same-source identity collapses the Google alias before inventory',()=>{
 const merged=mergeDiscoveryCandidates([native],[google],recorded.verifiedEvidence);
 assert.equal(merged.candidates.length,1);
 assert.equal(merged.aliases.get(google.restaurant.id),native.restaurant.id);
 assert.equal(merged.candidates[0]!.restaurant.sourceIds.googlePlaces,google.restaurant.sourceIds.googlePlaces);
 assert.equal(merged.candidates[0]!.restaurant.sourceIds.tabelogNativeDetailUri,native.restaurant.sourceIds.tabelogNativeDetailUri);
});
for(const mode of ['UNVERIFIED','LOW','DIFFERENT','CONFLICT'] as const)test(`identity merge fails closed: ${mode}`,()=>{
 const same=structuredClone(google);same.restaurant.outletName=native.restaurant.outletName;same.restaurant.address=native.restaurant.address;
 let evidence:RestaurantReadEvidence[]=structuredClone(recorded.verifiedEvidence);
 if(mode==='UNVERIFIED')evidence=[];
 if(mode==='LOW')for(const e of evidence)if(e.candidateId===google.restaurant.id)e.entityMatch={confidence:'LOW',matchedBy:[]};
 if(mode==='DIFFERENT')for(const e of evidence)if(e.candidateId===google.restaurant.id&&e.provider===recorded.verifiedEvidence.find((v:RestaurantReadEvidence)=>v.candidateId===native.restaurant.id)?.provider)e.sourceEntityId+='-different';
 if(mode==='CONFLICT'){const e=evidence.find(e=>e.candidateId===google.restaurant.id&&e.kind==='ENTITY_MATCH')!;evidence.push({...e,evidenceId:e.evidenceId+':conflict',sourceEntityId:e.sourceEntityId+'-conflict'});}
 assert.equal(mergeDiscoveryCandidates([native],[same],evidence).candidates.length,2);
});
for(const name of ['03-r1','03-r2','07-r1','07-r3'])test(`${name} recorded candidate pool keeps the original delivered outlets`,async t=>{
 const f=await fixture(name+'.json'),candidates=f.candidates as RestaurantCandidate[],evidence=f.evidence as RestaurantReadEvidence[];
 const merged=mergeDiscoveryCandidates(candidates.slice(0,1),candidates.slice(1),evidence);
 for(const [alias,canonical] of merged.aliases){
  const a=evidence.filter(e=>e.candidateId===alias&&e.entityMatch?.confidence==='HIGH');
  const b=evidence.filter(e=>e.candidateId===canonical&&e.entityMatch?.confidence==='HIGH');
  assert.ok(a.some(x=>b.some(y=>x.provider===y.provider&&x.sourceEntityId&&x.sourceEntityId===y.sourceEntityId)),`${alias} cannot merge without recorded shared identity`);
 }
 for(const id of f.presentedCandidateIds){
  const canonical=merged.aliases.get(id)??id;assert.ok(merged.candidates.some(c=>c.restaurant.id===canonical));
  if(canonical!==id){const original=evidence.filter(e=>e.candidateId===id&&e.entityMatch?.confidence==='HIGH');assert.ok(original.some(x=>evidence.some(y=>y.candidateId===canonical&&x.provider===y.provider&&x.sourceEntityId===y.sourceEntityId)));}
 }
 assert.equal(new Set(merged.candidates.map(c=>c.restaurant.id)).size,merged.candidates.length);
 t.diagnostic(JSON.stringify({case:name,before:candidates.length,after:merged.candidates.length,aliases:[...merged.aliases],delivered:f.presentedCandidateIds,mode:"RECORDED_CANDIDATE_COMPONENT",realCalls:0}));
});

test('same-read parsed R1 details verify the Google alias through the unchanged source identity gate',async()=>{
 const {verifiedDiscoveryIdentities}=await import('../integrations/restaurant-search/native-restaurant-search.js');
 const {tabelogDiscoveryPack}=await import('../integrations/restaurant-search/source-packs.js');
 const proof=verifiedDiscoveryIdentities(tabelogDiscoveryPack,[native,google],recorded.details,recorded.searchEvidence);
 assert.equal(proof.length,2);
 assert.ok(proof.every(e=>e.entityMatch?.confidence==='HIGH'));
 assert.equal(proof[0]!.provider,proof[1]!.provider);
 assert.equal(proof[0]!.sourceEntityId,proof[1]!.sourceEntityId);
 assert.equal(mergeDiscoveryCandidates([native],[google],proof).candidates.length,1);
 assert.deepEqual(verifiedDiscoveryIdentities(tabelogDiscoveryPack,[native,google],recorded.details,[]),[],'unbound source identity data is not evidence');
});

test('R1 component: merged candidate dispatches one inventory read, one presented outlet and one B1',async()=>{
 const {verifiedDiscoveryIdentities}=await import('../integrations/restaurant-search/native-restaurant-search.js');
 const {tabelogDiscoveryPack}=await import('../integrations/restaurant-search/source-packs.js');
 const {RestaurantExecutionRouter}=await import('../application/restaurant-execution-router.js');
 const {restaurantBookingTaskDefinition}=await import('../domains/restaurant/task-definition.js');
 const proof=verifiedDiscoveryIdentities(tabelogDiscoveryPack,[native,google],recorded.details,recorded.searchEvidence);
 const merged=mergeDiscoveryCandidates([native],[google],proof);
 let state=structuredClone(recorded.state);state.phase='SEARCHING';state.candidates=merged.candidates;state.availability={};state.availabilityChecks={};state.readEvidence=state.readEvidence.filter((e:RestaurantReadEvidence)=>e.kind!=='AVAILABILITY');delete state.selectionSession;delete state.presentedResults;delete state.defaultBatchDeliveryWindow;delete state.pendingResultBatchTarget;
 // This component keeps the recorded completed fact checks. Source I/O is
 // replaced by the exact native availability observation, not new stock.
 const original=recorded.availability;let inventory=0;
 const router=new RestaurantExecutionRouter({executionRoute:'GENERIC_BROWSER',async search(){throw Error('No discovery detour');}},
  {executionRoute:'GENERIC_BROWSER',async check(request){inventory++;assert.deepEqual(request.candidateIds,[native.restaurant.id],'Google alias cannot reach name search/inventory');return{offers:original.offers.filter((o:any)=>o.restaurantId===native.restaurant.id),availabilityChecks:{[native.restaurant.id]:original.availabilityChecks[native.restaurant.id]},evidence:original.evidence.filter((e:RestaurantReadEvidence)=>e.candidateId===native.restaurant.id),metadata:original.metadata};}},
  {structuredReadTimeoutMs:45000,browserReadTimeoutMs:45000});
 const at=recorded.state.presentedResults.presentedAt; // recorded facts are already available; inventory remains fresh
 const context={taskId:'same-outlet-recorded-component',runId:'same-outlet-recorded-component',now:at,createId:(p:string)=>p};
 const checked=await router.execute({type:'CHECK_AVAILABILITY',candidateIds:merged.candidates.map(c=>c.restaurant.id)},state,at);
 assert.equal(checked.event?.type,'AVAILABILITY_CHECKED');state=restaurantBookingTaskDefinition.transition(state,checked.event!,context).state;
 const presented=await router.execute({type:'PRESENT_RESULTS',candidateIds:[native.restaurant.id]},state,at);
 state=restaurantBookingTaskDefinition.transition(state,presented.event!,context).state;
 assert.equal(inventory,1);assert.deepEqual(state.presentedResults.candidateIds,[native.restaurant.id]);
 const originalHandoffs=recorded.handoffs;assert.ok(originalHandoffs);
 const handoffs=Object.values(originalHandoffs).flat().filter((h:any)=>state.presentedResults.candidateIds.includes(h.candidateId));
 assert.equal(handoffs.length,1,'one canonical candidate exposes only its one source B1');
});

test('native search production wiring verifies the supplementary Google identity before returning candidates',async()=>{
 const {NativeRestaurantSearch}=await import('../integrations/restaurant-search/native-restaurant-search.js');
 const {tabelogDiscoveryPack,googlePlacesDiscoveryPack,discoveryPackNetworkPolicy}=await import('../integrations/restaurant-search/source-packs.js');
 const {GooglePlacesClient}=await import('../integrations/google/google-places-client.js');
 const {GooglePlacesRestaurantSearch}=await import('../integrations/google/google-places-restaurant-search.js');
 const {independentVisibleText}=await import('../eval/restaurant/agent-loop/g6/source-document.js');
 const folder=new URL('./browser/fixtures/seed-discovery-settle-recorded/',import.meta.url);
 const list=await readFile(new URL('d02v-r1-nakano-list.html',folder),'utf8'),detail=await readFile(new URL('d02v-snapshot-0006.html',root),'utf8'),locationBody=await readFile(new URL('nakano-google-location.json',folder),'utf8');
 const listing='https://tabelog.com/en/tokyo/A1319/A131902/',detailURL=native.restaurant.sourceIds.tabelogNativeDetailUri!,home=tabelogDiscoveryPack.browser!.startupUrl!;let current=home;
 // Saved DOM + actual candidate projections substitute source transport.
 // Other detail URLs deliberately have no fixture; no HTTP request is sent.
 const session:import('../infrastructure/browser/browser-runtime.js').BrowserSession={metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:'2026-11-12T03:54:00Z',readNetworkBoundary:'INSTALLED'},async navigate(url){if(url!==home&&url!==listing&&url!==detailURL)throw Error('No saved detail response');current=url;},async snapshot(){const html=current===listing?list:current===detailURL?detail:`<a href="${listing}">Observed directory</a>`;return{url:current,title:'Component source transport',html,text:independentVisibleText(html),settlement:'SETTLED'};},async observeControls(){return current===home?[{id:'directory',stableKey:'directory',kind:'LINK',role:'link',label:'Observed directory',href:listing,visible:true,disabled:false}]:[];},async waitForSettled(){return true;},async click(){throw Error('No scripted source UI');},async fill(){throw Error('No scripted source form');},async select(){return[];},async waitFor(){},async screenshot(){return new Uint8Array();},async close(){}};
 let requests=0;
 const googleBody=await readFile(new URL('d02v-google-response.json',root),'utf8');
 const googleSource=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:'offline',fetchImplementation:async()=>new Response(requests++===0?locationBody:googleBody)}),()=> '2026-11-12T03:54:00Z',10,{maxRequests:5});
 const packs=[tabelogDiscoveryPack,googlePlacesDiscoveryPack];
 const search=new NativeRestaurantSearch({readNetworkBoundaryCapability:'ISOLATED_CONTEXT',async openSession(){return session;}},googleSource,{async decide(){return{accepted:true,keyword:'robatayaki',criterionRef:'criterion:0',reason:'Recorded development criterion'};}},()=> '2026-11-12T03:54:00Z',undefined,{async decide(input){return current===home?{type:'OPEN_LINK',targetRef:input.observation.targets[0]!.ref,reason:'Observed component directory'}:{type:'COMPLETE',reason:'Recorded directory list'};}},undefined,undefined,{maxAutomaticElapsedMs:300000,maxModelCallsPerCandidate:4,maxModelCallsTotal:8,maxOperationsPerCandidate:70},discoveryPackNetworkPolicy(packs),packs);
 const result=await search.search({readRunId:'same-outlet-recorded-wiring',intent:recorded.state.intentDraft},new AbortController().signal);
 const canonical=result.candidates.find(c=>c.restaurant.id===native.restaurant.id);assert.ok(canonical,JSON.stringify(result.metadata));
 assert.equal(canonical.restaurant.sourceIds.googlePlaces,google.restaurant.sourceIds.googlePlaces,JSON.stringify({metadata:result.metadata,candidates:result.candidates.map(c=>c.restaurant),identities:result.evidence.filter(e=>e.kind==='ENTITY_MATCH')}));
 assert.equal(result.candidates.some(c=>c.restaurant.id===google.restaurant.id),false,'Google alias cannot be dispatched for a second lookup');
 assert.ok(result.evidence.some(e=>e.candidateId===native.restaurant.id&&e.claims.mergedCandidateId===google.restaurant.id),'original corroborating Google identity remains auditable');
});
