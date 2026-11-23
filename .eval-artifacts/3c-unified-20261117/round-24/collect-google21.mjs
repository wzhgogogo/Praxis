import {assert,collect} from './observation-recorder.ts';
import { writeFileSync } from 'node:fs';
import { fixtureIntent } from '../../../src/harness/restaurant-fixtures.ts';
import { GooglePlacesClient } from '../../../src/integrations/google/google-places-client.ts';
import { GooglePlacesRestaurantSearch } from '../../../src/integrations/google/google-places-restaurant-search.ts';

const date='2026-11-21T08:00:00Z';
const base={formattedAddress:'Ginza, Tokyo',location:{latitude:35.6,longitude:139.7}};
const age={...base,id:'age3-test',displayName:{text:'Age.3 GINZA'},primaryType:'cafe',types:['cafe','dessert_restaurant','snack_bar','sandwich_shop','meal_takeaway','restaurant']};
const dessert={...base,id:'dessert-fixture',displayName:{text:'Fixture Dessert Shop'},primaryType:'dessert_shop',types:['dessert_shop','food']};
const sandwich={...base,id:'sandwich-fixture',displayName:{text:'Fixture Sandwich Shop'},primaryType:'sandwich_shop',types:['sandwich_shop','food']};
const mixed={...dessert,id:'mixed-dessert',displayName:{text:'Mixed Restaurant'},primaryType:'restaurant',types:['restaurant','dessert_shop','food']};
const cafe={...dessert,id:'cafe-fixture',displayName:{text:'Fixture Café'},primaryType:'cafe',types:['cafe','food']};
const rows=[];
const scenarios=[
  ['general-dinner',age,'dinner in Ginza',null,false,true],
  ['negative-in-criteria-only',age,'dinner in Ginza',['overly sweet desserts','SOFT'],false,true],
  ['negative-also-in-query',age,'dinner in Ginza, preferably without overly sweet desserts',['overly sweet desserts','SOFT'],false,true],
  ['explicit-dessert-with-preference',age,'dessert café in Ginza, preferably without overly sweet desserts',['overly sweet desserts','SOFT'],true,true],
  ['hard-shops',dessert,'dessert shop in Ginza',['no dessert shops','HARD'],false,false],
  ['hard-places',dessert,'dessert shop in Ginza',['no dessert places','HARD'],false,false],
  ['hard-stores',dessert,'dessert shop in Ginza',['no dessert stores','HARD'],false,false],
  ['soft-places',dessert,'dessert shop in Ginza',['no dessert places','SOFT'],true,true],
  ['hard-sandwich-shops',sandwich,'sandwich shop in Ginza',['no sandwich shops','HARD'],false,false],
  ['hard-sandwiches',sandwich,'sandwich shop in Ginza',['no sandwiches','HARD'],false,false],
  ['mixed-general-control',mixed,'restaurant in Ginza',null,true,true],
  ['mixed-hard-shops',mixed,'restaurant in Ginza',['no dessert shops','HARD'],false,false],
  ['mixed-hard-places',mixed,'restaurant in Ginza',['no dessert places','HARD'],false,false],
  ['pure-cafe-control',cafe,'restaurant in Ginza',null,true,true],
  ['pure-cafe-hard',cafe,'restaurant in Ginza',['no cafés','HARD'],false,false],
];
const originalScenarioCount=scenarios.length;
scenarios.push(
 ['no-primary-dessert-places',{...dessert,primaryType:undefined},'dessert shop in Ginza',['no dessert places','HARD'],false,false],
 ['coffee-shops',{...cafe,primaryType:'coffee_shop',types:['coffee_shop','food']},'coffee shop in Ginza',['no coffee shops','HARD'],false,false],
 ['bakeries',{...cafe,primaryType:'bakery',types:['bakery','food']},'bakery in Ginza',['no bakeries','HARD'],false,false],
 ['tea-houses',{...cafe,primaryType:'tea_house',types:['tea_house','food']},'tea house in Ginza',['no tea houses','HARD'],false,false],
 ['negative-then-explicit',age,'not too sweet, but specifically looking for a dessert café',['too sweet','HARD'],true,true],
 ['hard-degree',age,'dessert café with no overly sweet desserts',['overly sweet desserts','HARD'],true,true],
);
for(const [name,place,query,criterion,expectOrdinary,expectNamed] of scenarios){
 const signal=new AbortController().signal;
 const calls=[];
 const client=new GooglePlacesClient({apiKey:'offline-fixture',fetchImplementation:async(url,init)=>{calls.push(init?.method??'GET');return new Response(JSON.stringify(init?.method==='POST'?{places:[place]}:place));}});
 const adapter=new GooglePlacesRestaurantSearch(client,()=>date,10,{maxRequests:15});
 const baseIntent={...fixtureIntent,area:{query:'Ginza',coordinates:{latitude:35.6,longitude:139.7,observedAt:date,source:'MANUAL_PLACE'}},timeWindow:{earliest:'19:00',latest:'20:00'},target:{goal:'RECOMMENDATION',selectionScope:'OPEN_ENDED',query},criteria:criterion?[{text:criterion[0],strength:criterion[1],polarity:'NEGATIVE'}]:[]};
 const namedIntent={...baseIntent,target:{...baseIntent.target,selectionScope:'SPECIFIC_OUTLET',query:place.displayName.text}};
 const seed=await adapter.search({intent:{...namedIntent,criteria:[]},readRunId:'seed'},signal);
 assert.equal(seed.candidates.length,1,'control candidate');
 const candidateIds=seed.candidates.map(c=>c.restaurant.id);
 const ordinary=await adapter.search({intent:baseIntent,readRunId:'ordinary'},signal);
 const named=await adapter.search({intent:namedIntent,readRunId:'named'},signal);
 const detail=async(intent,readRunId)=>{const facts=await adapter.inspectFacts({intent,candidateIds,candidates:seed.candidates,readRunId},signal);const f=facts.factChecks[candidateIds[0]];return {status:f.status,reason:f.reasonCode??null,facts:facts.evidence.filter(e=>e.kind==='RESTAURANT_FACT').length,violations:facts.evidence.flatMap(e=>e.claims.violatedNegativeCriteria??[])};};
 const ordinaryDetail=await detail(baseIntent,'ordinary-details'),namedDetail=await detail(namedIntent,'named-details');
 for(const [result,allowed] of [[ordinary,expectOrdinary],[named,expectNamed]]){
  if(allowed){
   assert.ok(result.evidence.some(e=>e.kind==='RESTAURANT_FACT'));
   assert.ok(result.evidence.every(e=>!e.claims.violatedNegativeCriteria?.length));
  }
 }
 for(const [details,allowed] of [[ordinaryDetail,expectOrdinary],[namedDetail,expectNamed]]){
  if(!allowed)assert.equal(details.reason,'GOOGLE_PLACE_TYPE_UNUSABLE');
  else {assert.ok(details.facts>0);assert.equal(details.violations.length,0);}
 }
 const observed={ordinary:ordinary.candidates.length,named:named.candidates.length,ordinaryDetail,namedDetail};
 const passed=observed.ordinary===Number(expectOrdinary)&&observed.named===Number(expectNamed)&&(ordinaryDetail.status==='COMPLETED')===expectOrdinary&&(namedDetail.status==='COMPLETED')===expectNamed;
 rows.push({name,place:place.displayName.text,query,criterion,expected:{ordinary:expectOrdinary,named:expectNamed},observed,passed,injectedTransportCalls:calls.length});
}
writeFileSync(process.env.PRAXIS_ROUND24_OBSERVATIONS+'/google21.json',JSON.stringify(rows,null,2)+'\n');
for(const r of rows) console.log(r.name,r.expected,JSON.stringify(r.observed),r.passed);
console.log('ORIGINAL',rows.slice(0,originalScenarioCount).filter(r=>r.passed).length,'/',originalScenarioCount,'ADDITIONAL',rows.slice(originalScenarioCount).filter(r=>r.passed).length,'/',rows.length-originalScenarioCount);



