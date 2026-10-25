import assert from 'node:assert/strict';
import test from 'node:test';
import type {RestaurantSearchIntent} from './contracts.js';
import {positiveDiscoveryCriteria,validateDiscoveryRetrieval} from './discovery-retrieval.js';
const intent:RestaurantSearchIntent={timezone:'Asia/Tokyo',area:{query:'near Fixture District'},target:{goal:'AVAILABILITY',query:'dinner'},criteria:[{text:'local food',polarity:'POSITIVE',strength:'HARD'},{text:'fast food',polarity:'NEGATIVE',strength:'HARD'},{text:'around 10000 yen',polarity:'POSITIVE',strength:'SOFT'}]};
const wire={choice:'KEYWORD',keyword:'regional cuisine',criterionRef:'criterion:0',generalRef:'',categoryUrl:'',reason:'Use the positive criterion'};
test('Agent retrieval validates format and observed category scope without deciding qualification',()=>{
 assert.deepEqual(positiveDiscoveryCriteria(intent).map(c=>[c.criterionRef,c.text,c.strength]),[['criterion:0','local food','HARD'],['criterion:2','around 10000 yen','SOFT']]);
 assert.equal(validateDiscoveryRetrieval(wire,intent,'Fixture District',[]).accepted,true);
 for(const patch of [{keyword:'one two three four'},{keyword:'dinner 2'},{keyword:'District,'},{keyword:'tomorrow'},{keyword:'Saturday'},{keyword:'budget'},{keyword:'fast food'},{keyword:'not vegan'},{criterionRef:'criterion:1'},{criterionRef:'criterion:2'}])assert.equal(validateDiscoveryRetrieval({...wire,...patch},intent,'Fixture District',[]).accepted,false,JSON.stringify(patch));
 const category={choice:'CATEGORY',keyword:'',criterionRef:'',generalRef:'',categoryUrl:'https://directory.test/region/category/',reason:'Observed category'};
 assert.equal(validateDiscoveryRetrieval(category,intent,'Fixture District',[category.categoryUrl]).accepted,true);
 assert.equal(validateDiscoveryRetrieval(category,intent,'Fixture District',[]).rejectionReason,'UNOBSERVED_OR_OUTSIDE_REGION_CATEGORY');
 assert.equal(validateDiscoveryRetrieval({...category,choice:'GENERAL',generalRef:'',categoryUrl:''},intent,'Fixture District',[]).accepted,true);
 const observed={parsedCount:0,rewrites:1,generalListRefs:['general:tabelog:1']};
 const general={...category,choice:'GENERAL',categoryUrl:'',generalRef:'general:tabelog:1'};
 assert.equal(validateDiscoveryRetrieval(general,intent,'Fixture District',[],observed).generalRef,'general:tabelog:1');
 for(const generalRef of ['',category.categoryUrl,'general:tablecheck:1','general:tabelog:other'])assert.equal(validateDiscoveryRetrieval({...general,generalRef},intent,'Fixture District',[],observed).rejectionReason,'UNOBSERVED_GENERAL_LIST');
 assert.equal(validateDiscoveryRetrieval({...general,href:category.categoryUrl},intent,'Fixture District',[],observed).rejectionReason,'INVALID_PROPOSAL');
 const {generalRef: oldMissing,...oldWire}=wire;
 assert.equal(validateDiscoveryRetrieval(oldWire,intent,'Fixture District',[]).rejectionReason,'INVALID_PROPOSAL','old output shape is retired');
 assert.deepEqual(intent.criteria[0],{text:'local food',polarity:'POSITIVE',strength:'HARD'},'retrieval is not evidence or eligibility mutation');
});
test('only positive HARD criteria can supply KEYWORD/COMBINED; other strengths can select observed categories',()=>{
 for(const strength of ['SOFT','UNSPECIFIED'] as const){
  const request={...intent,criteria:[{text:'good for a first date',polarity:'POSITIVE' as const,strength}]};
  for(const choice of ['KEYWORD','COMBINED'])assert.equal(validateDiscoveryRetrieval({...wire,choice,keyword:'first date',generalRef:'',categoryUrl:choice==='COMBINED'?'https://directory.test/region/category/':''},request,'Fixture District',['https://directory.test/region/category/']).rejectionReason,'NON_RETRIEVABLE_CRITERION');
  assert.equal(validateDiscoveryRetrieval({choice:'CATEGORY',keyword:'',criterionRef:'criterion:0',generalRef:'',categoryUrl:'https://directory.test/region/category/',reason:'Observed category suits preference'},request,'Fixture District',['https://directory.test/region/category/']).accepted,true);
 }
});
