import assert from 'node:assert/strict';
import test from 'node:test';
import {applyRestaurantIntentPatch,missingBlockingFields} from './intent-state.js';
import type {RestaurantIntentDraft} from './contracts.js';
const omakase={text:'omakase',polarity:'POSITIVE' as const,strength:'HARD' as const};
const draft:RestaurantIntentDraft={schemaVersion:'3',timezone:'Asia/Tokyo',target:{goal:'RECOMMENDATION',selectionScope:'OPEN_ENDED',query:'omakase restaurant in Ginza',requestedResultCount:3},area:{query:'Ginza'},criteria:[omakase]};
test('Round20 removing a criterion cleans inherited query and preserves the target contract',()=>{
 const next=applyRestaurantIntentPatch(draft,{schemaVersion:'3',removeCriteria:[omakase]});
 assert.deepEqual(next.target,{...draft.target,query:'restaurant in Ginza'});assert.deepEqual(next.criteria,[]);
 assert.deepEqual(missingBlockingFields(next),['date','timeWindow','partySize']);
});
test('Round20 area and criterion replacement retain unrevoked cafe intent',()=>{
 const cafe={...draft,target:{...draft.target!,query:'quiet café in Ginza'},criteria:[{...omakase,text:'quiet'}]};
 const area=applyRestaurantIntentPatch(cafe,{schemaVersion:'3',area:{query:'Shibuya'}});assert.equal(area.target?.query,'quiet café in Shibuya');
 const changed=applyRestaurantIntentPatch(cafe,{schemaVersion:'3',replaceCriteria:[{...omakase,text:'dessert'}]});assert.equal(changed.target?.query,'café dessert in Ginza');
 const added=applyRestaurantIntentPatch(cafe,{schemaVersion:'3',addCriteria:[{...omakase,text:'serves beer'}]});assert.equal(added.target?.query,'quiet café serves beer in Ginza');
 assert.equal(applyRestaurantIntentPatch(cafe,{schemaVersion:'3',area:{query:'Ginza'}}).target?.query,cafe.target.query);
});
test('Round20 target overrides, explicit clear and named outlets never get query maintenance',()=>{
 for(const patch of [{schemaVersion:'3' as const,target:null,removeCriteria:[omakase]},{schemaVersion:'3' as const,target:{...draft.target!,query:'explicit target'},removeCriteria:[omakase]}])assert.deepEqual(applyRestaurantIntentPatch(draft,patch).target,patch.target??undefined);
 const named={...draft,target:{...draft.target!,selectionScope:'SPECIFIC_OUTLET' as const,query:'Omakase Ginza'}};
 assert.deepEqual(applyRestaurantIntentPatch(named,{schemaVersion:'3',removeCriteria:[omakase],area:{query:'Shibuya'}}).target,named.target);
 const next=applyRestaurantIntentPatch({...draft,target:{...draft.target!,query:'omakase in Ginza'}},{schemaVersion:'3',removeCriteria:[omakase],area:null});assert.equal(next.target?.query,'restaurant');
});

test('Round20 inherited query removal treats criterion punctuation literally',()=>{
 const item={...omakase,text:'a+b'};const current={...draft,target:{...draft.target!,query:'a+b restaurant in Ginza'},criteria:[item]};
 assert.equal(applyRestaurantIntentPatch(current,{schemaVersion:'3',removeCriteria:[item]}).target?.query,'restaurant in Ginza');
});

test("Round21 local predicate edits preserve other conditions, outlet type and original spelling", () => {
  const beer = {...omakase, text:"serves beer"};
  for (const [query, expected] of [
    ["Find me a restaurant that serves beer", "Find me a restaurant in Shibuya"],
    ["sushi bar for lunch with beer in Ginza", "sushi bar for lunch in Shibuya"],
    ["café with outdoor seating and serving beer in Ginza", "café with outdoor seating in Shibuya"],
    ["café with beer and outdoor seating in Ginza", "café with outdoor seating in Shibuya"],
  ]) {
    const current = {...draft,target:{...draft.target!,query:query!},criteria:[beer]};
    const revised = applyRestaurantIntentPatch(current,{schemaVersion:"3",removeCriteria:[beer],area:{query:"Shibuya"}});
    assert.deepEqual(revised.target,{...draft.target,query:expected});
  }
  const beerQuery = {...draft,target:{...draft.target!,query:"Restaurants with beer in Ginza"},criteria:[beer]};
  assert.equal(applyRestaurantIntentPatch(beerQuery,{schemaVersion:"3",area:{query:"Shibuya"}}).target?.query,"Restaurants with beer in Shibuya");
  const quiet={...omakase,text:"quiet"},cafe={...omakase,text:"cafe"};
  const accented={...draft,target:{...draft.target!,query:"quiet café in Ginza"},criteria:[quiet,cafe]};
  assert.equal(applyRestaurantIntentPatch(accented,{schemaVersion:"3",removeCriteria:[quiet]}).target?.query,"café in Ginza");
  assert.equal(applyRestaurantIntentPatch(accented,{schemaVersion:"3",removeCriteria:[cafe]}).target?.query,"quiet in Ginza");
});

test("Round22 shared predicates and Japanese independent place tokens",()=>{
 const beer={...omakase,text:"serves beer"};
 for(const predicate of ["that has","has","having","with","that serves","serves","serving","that offers","offers","offering","featuring"]){
  for(const query of [`café ${predicate} beer and outdoor seating in Ginza`,`café ${predicate} outdoor seating and beer in Ginza`]){
   const state={...draft,target:{...draft.target!,query},criteria:[beer]};
   const result=applyRestaurantIntentPatch(state,{schemaVersion:"3",removeCriteria:[beer]});
   assert.equal(result.target?.query,`café ${predicate} outdoor seating in Ginza`,query);
  }
 }
 const sushi={...omakase,text:"寿司"};
 const state={...draft,target:{...draft.target!,query:"銀座の寿司店 東銀座駅近く"},area:{query:"銀座"},criteria:[sushi]};
 const changed=applyRestaurantIntentPatch(state,{schemaVersion:"3",area:{query:"渋谷"}});
 assert.doesNotMatch(changed.target!.query,/(^|\s)銀座/);
 assert.match(changed.target!.query,/東銀座駅近く/);
 assert.match(changed.target!.query,/寿司店.*渋谷/);
 const removed=applyRestaurantIntentPatch(state,{schemaVersion:"3",removeCriteria:[sushi]});
 assert.doesNotMatch(removed.target!.query,/寿司/);
 assert.match(removed.target!.query,/銀座/);
});

test('Round24 B4 revoking a comma-separated beer item preserves every other open-ended request',()=>{
 const beer={...omakase,text:'serves beer'},outdoor={...omakase,text:'outdoor seating'},wine={...omakase,text:'serves wine'};
 for(const query of ['café with outdoor seating, beer and wine in Ginza','café with outdoor seating, wine, and beer in Ginza','café with beer, outdoor seating and wine in Ginza']){
  const result=applyRestaurantIntentPatch({...draft,target:{...draft.target!,query},criteria:[outdoor,beer,wine]},{schemaVersion:'3',removeCriteria:[beer]});
  assert.doesNotMatch(result.target!.query,/\bbeer\b/i);for(const word of ['café','outdoor seating','wine','Ginza'])assert.ok(result.target!.query.includes(word),result.target!.query);assert.deepEqual(result.criteria,[outdoor,wine]);assert.equal(result.target!.goal,draft.target!.goal);assert.equal(result.target!.requestedResultCount,3);assert.doesNotMatch(result.target!.query,/,\s*(?:,|and\b|in\b)/i);
 }
});
for(const suffix of ['にある','周辺の','付近の'])test(`Round24 B4 area replacement removes standalone Japanese ${suffix}`,()=>{
 const next=applyRestaurantIntentPatch({...draft,target:{...draft.target!,query:'銀座'+suffix+'寿司店 東銀座駅近く'},area:{query:'銀座'}},{schemaVersion:'3',area:{query:'渋谷'}});
 assert.doesNotMatch(next.target!.query.replace('東銀座駅',''),/銀座/);assert.match(next.target!.query,/寿司店.*渋谷/);assert.match(next.target!.query,/東銀座駅/);assert.ok(!next.target!.query.startsWith(suffix));
});
