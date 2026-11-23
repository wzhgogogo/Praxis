import assert from 'node:assert/strict';
import test from 'node:test';
import {fixtureIntent} from '../../harness/restaurant-fixtures.js';
import {applyRestaurantIntentPatch} from '../../domains/restaurant/intent-state.js';
import {GooglePlacesClient} from './google-places-client.js';
import {GooglePlacesRestaurantSearch} from './google-places-restaurant-search.js';
const now='2026-11-21T08:00:00Z',signal=()=>new AbortController().signal;
const coordinates={latitude:35.6,longitude:139.7,observedAt:now,source:'MANUAL_PLACE' as const};
const age={id:'age3-test',displayName:{text:'Age.3 GINZA'},formattedAddress:'Ginza, Tokyo',location:{latitude:35.6,longitude:139.7},primaryType:'cafe',types:['cafe','dessert_restaurant','snack_bar','sandwich_shop','meal_takeaway','restaurant']};
const target=(query:string,selectionScope:'OPEN_ENDED'|'SPECIFIC_OUTLET'='OPEN_ENDED')=>({goal:'RECOMMENDATION' as const,selectionScope,query});
function adapter(wires:string[],place?:typeof age){return new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async(_url,init)=>{if(init?.method==='POST')wires.push(JSON.parse(String(init.body)).textQuery);return new Response(JSON.stringify(init?.method==='POST'?{places:place?[place]:[]}:place??{}));}}),()=>now,10,{maxRequests:16});}
for(const [query,want] of [
 ...['','.','!','?'].map(p=>['dinner in Ginza, preferably without overly sweet desserts'+p,false] as const),
 ...['without outdoor seating I would like a dessert café in Ginza','no parking required and looking for a dessert café in Ginza','not too sweet, but specifically looking for a dessert café in Ginza','nothing too sweet, please find a dessert café in Ginza','a dessert café in Ginza without outdoor seating'].map(q=>[q,true] as const),
])test('Round24 B5 Google search and inspectFacts agree for '+query,async()=>{
 const api=adapter([],age),intent={...fixtureIntent,target:target(query),timeWindow:{earliest:'19:00',latest:'20:00'},area:{query:'Ginza',coordinates},criteria:[{text:want?'outdoor seating':'overly sweet desserts',polarity:'NEGATIVE' as const,strength:'SOFT' as const}]};
 const punctuation=query.match(/[.!?]$/)?.[0]??'';
 const named=await api.search({intent:{...intent,target:target('Age.3 GINZA'+punctuation,'SPECIFIC_OUTLET')},readRunId:'named'},signal());assert.equal(named.candidates.length,1);
 const ordinary=await api.search({intent,readRunId:'ordinary'},signal()),candidateIds=named.candidates.map(c=>c.restaurant.id),facts=await api.inspectFacts({intent,candidateIds,candidates:named.candidates,readRunId:'details'},signal()),checked=facts.factChecks[candidateIds[0]!]!;
 const namedFacts=await api.inspectFacts({intent:{...intent,target:target('Age.3 GINZA'+punctuation,'SPECIFIC_OUTLET')},candidateIds,candidates:named.candidates,readRunId:'named-details'},signal());assert.equal(namedFacts.factChecks[candidateIds[0]!]!.status,'COMPLETED');
 assert.equal(ordinary.candidates.length,want?1:0);assert.equal(checked.status,want?'COMPLETED':'UNKNOWN');if(!want)assert.equal(checked.reasonCode,'GOOGLE_PLACE_TYPE_UNUSABLE');
});
for(const query of ['café with outdoor seating, beer and wine in Ginza','café with outdoor seating and beer in Ginza','銀座にある寿司店','銀座周辺の寿司店','銀座付近の寿司店','銀座の寿司店 東銀座駅近く'])test('Round24 B4 revised query reaches the production Google wire: '+query,async()=>{
 const japanese=query.includes('銀座'),beer={text:'serves beer',polarity:'POSITIVE' as const,strength:'HARD' as const};
 const draft={schemaVersion:'3' as const,timezone:'Asia/Tokyo' as const,target:target(query),area:{query:japanese?'銀座':'Ginza'},criteria:japanese?[]:[beer]};
 const next=applyRestaurantIntentPatch(draft,japanese?{schemaVersion:'3',area:{query:'渋谷'}}:{schemaVersion:'3',removeCriteria:[beer]}),wires:string[]=[];
 await adapter(wires).search({intent:{...fixtureIntent,target:next.target!,criteria:next.criteria,area:{...next.area!,coordinates}},readRunId:'edit'},signal());assert.ok(wires[0]);
 if(japanese){assert.doesNotMatch(wires[0]!.replaceAll('東銀座駅',''),/銀座/);assert.match(wires[0]!,/寿司店/);assert.match(wires[0]!,/渋谷/);if(query.includes('東銀座駅'))assert.match(wires[0]!,/東銀座駅/);}
 else{assert.doesNotMatch(wires[0]!,/beer/i);assert.match(wires[0]!,/café/);assert.match(wires[0]!,/outdoor seating/);if(query.includes('wine'))assert.match(wires[0]!,/wine/);}
});
