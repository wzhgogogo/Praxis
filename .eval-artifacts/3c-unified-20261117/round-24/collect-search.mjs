import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fixtureIntent} from '../../../src/harness/restaurant-fixtures.ts';
import {applyRestaurantIntentPatch} from '../../../src/domains/restaurant/intent-state.ts';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {GooglePlacesRestaurantSearch} from '../../../src/integrations/google/google-places-restaurant-search.ts';
const now='2026-11-21T08:00:00Z',signal=new AbortController().signal;
const base={...fixtureIntent,timeWindow:{earliest:'19:00',latest:'20:00'},criteria:[]};
const coords={latitude:35.6,longitude:139.7,observedAt:now,source:'MANUAL_PLACE'};
const age={id:'age3-test',displayName:{text:'Age.3 GINZA'},formattedAddress:'Ginza, Tokyo',location:{latitude:35.6,longitude:139.7},primaryType:'cafe',types:['cafe','dessert_restaurant','snack_bar','sandwich_shop','meal_takeaway','restaurant']};
const out={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),query:[],filters:[],failed:[]};
function adapter(wires,place){return new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async(_url,init)=>{
  if(init?.method==='POST')wires.push(JSON.parse(String(init.body)).textQuery);
  return new Response(JSON.stringify(init?.method==='POST'?{places:place?[place]:[]}:place??{}));
}}),()=>now,10,{maxRequests:16});}
const target=query=>({goal:'RECOMMENDATION',selectionScope:'OPEN_ENDED',query});
for(const [query,lang] of [
  ['銀座の寿司店 東銀座駅近く','ja'],['銀座にある寿司店','ja'],['銀座周辺の寿司店','ja'],['銀座付近の寿司店','ja'],
  ['café with outdoor seating and beer in Ginza','en'],['café with outdoor seating, beer and wine in Ginza','en'],['café with outdoor seating, wine, and beer in Ginza','en']
]){
 const term={text:'serves beer',polarity:'POSITIVE',strength:'HARD'};
 const draft={schemaVersion:'3',timezone:'Asia/Tokyo',target:target(query),area:{query:lang==='ja'?'銀座':'Ginza'},criteria:lang==='ja'?[]:[term]};
 const patch=lang==='ja'?{schemaVersion:'3',area:{query:'渋谷'}}:{schemaVersion:'3',removeCriteria:[term]};
 const next=applyRestaurantIntentPatch(draft,patch);const wires=[];
 await adapter(wires,null).search({intent:{...base,target:next.target,criteria:next.criteria,area:{...next.area,coordinates:coords}},readRunId:'edit'},signal);
 assert.ok(wires.length&&wires[0]);
 const ok=lang==='ja'?!wires[0].replaceAll('東銀座駅','').includes('銀座')&&wires[0].includes('寿司店')&&wires[0].includes('渋谷'):!(/\bbeer\b/i.test(wires[0]))&&wires[0].includes('outdoor seating')&&(!query.includes('wine')||wires[0].includes('wine'));
 out.query.push({query,structuredArea:next.area.query,criteria:next.criteria.map(x=>x.text),target:next.target.query,google:wires[0],ok});if(!ok)out.failed.push(query);
}
for(const [query,pref,want] of [
 ['dinner in Ginza, preferably without overly sweet desserts','overly sweet desserts',false],
 ['dinner in Ginza, preferably without overly sweet desserts.','overly sweet desserts',false],
 ['dinner in Ginza, preferably without overly sweet desserts!','overly sweet desserts',false],
 ['dinner in Ginza, preferably without overly sweet desserts?','overly sweet desserts',false],
 ['not too sweet, but specifically looking for a dessert café in Ginza','too sweet',true],
 ['nothing too sweet, please find a dessert café in Ginza','too sweet',true],
 ['without outdoor seating I would like a dessert café in Ginza','outdoor seating',true],
 ['no parking required and looking for a dessert café in Ginza','parking',true],
 ['a dessert café in Ginza without outdoor seating','outdoor seating',true]
]){
 const api=adapter([],age);const intent={...base,target:target(query),area:{query:'Ginza',coordinates:coords},criteria:[{text:pref,strength:'SOFT',polarity:'NEGATIVE'}]};
 const specific={...intent,target:{...intent.target,selectionScope:'SPECIFIC_OUTLET',query:'Age.3 GINZA'+(query.match(/[.!?]$/)?.[0]??'')}};
 const named=await api.search({intent:specific,readRunId:'named'},signal);assert.equal(named.candidates.length,1);
 const ordinary=await api.search({intent,readRunId:'ordinary'},signal),ids=named.candidates.map(c=>c.restaurant.id);
 const detail=await api.inspectFacts({intent,candidateIds:ids,candidates:named.candidates,readRunId:'details'},signal);
 const namedDetail=await api.inspectFacts({intent:specific,candidateIds:ids,candidates:named.candidates,readRunId:'named-details'},signal);
 const fact=detail.factChecks[ids[0]],accepted=ordinary.candidates.length===1;
 const ok=accepted===want&&(fact.status==='COMPLETED')===want;
 out.filters.push({query,pref,want,ordinary:ordinary.candidates.length,named:named.candidates.length,namedDetail:namedDetail.factChecks[ids[0]].status,detail:fact.status,reason:fact.reasonCode??null,ok});if(!ok)out.failed.push(query);
}
writeFileSync(process.env.PRAXIS_ROUND24_OBSERVATIONS+'/search.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
// Assertions consume only these newly collected observations in a later process.