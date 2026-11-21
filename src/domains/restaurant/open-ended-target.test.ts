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
