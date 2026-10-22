import assert from "node:assert/strict";
import test from "node:test";
import {assessRestaurantConditions} from "./condition-states.js";
import type {RestaurantReadEvidence} from "./contracts.js";
const url="https://tabelog.com/en/tokyo/A0000/A000000/11111111/";
const intent={criteria:[{text:"omakase",strength:"HARD" as const,polarity:"POSITIVE" as const}],timeWindow:{earliest:"19:00",latest:"19:00"}};
function fact(fields:unknown[],criterion="omakase"):RestaurantReadEvidence {
 return {evidenceId:"merchant",kind:"RESTAURANT_FACT",provider:"TABELOG",candidateId:"a",sourceUrl:url,observedAt:"2026-10-21T00:00:00Z",requestFingerprint:"source",claims:{verifiedHardCriteria:[criterion]},sourceFieldQuotes:fields} as RestaurantReadEvidence;
}
const source=(field:string,quote:string,meal="UNSPECIFIED")=>({field,quote,sourceUrl:url,meal});

test("condition display shows actual source field/quote and preserves lunch offering scope",()=>{
 const result=assessRestaurantConditions(intent,[fact([source("COURSE_TITLE","Lunch Omakase Course","LUNCH")])])[0]!;
 assert.equal(result.status,"MET");assert.equal(result.sources[0]?.quote,"Lunch Omakase Course");assert.equal((result.sources[0] as any).field,"COURSE_TITLE");assert.equal((result.sources[0] as any).meal,"LUNCH");assert.match(result.explanation,/not.*requested|requested.*not/i);
 const dinner=assessRestaurantConditions({...intent,criteria:[{...intent.criteria[0]!,text:"omakase course"}]},[fact([source("COURSE_TITLE","Lunch Omakase Course","LUNCH")],"omakase course")])[0]!;
 assert.equal(dinner.status,"NOT_CHECKED");
});

test("condition display does not let names or customer reviews discharge HARD even with model labels",()=>{
 for(const fields of [[source("NAME","Omakase House")],[source("CUSTOMER_REVIEW","Wonderful omakase course")],[]]){
  const f=fact(fields);const model:RestaurantReadEvidence={...f,evidenceId:"model",provider:"MODEL_JUDGMENT",claims:{verifiedHardCriteria:["omakase"],supportingEvidenceIds:[f.evidenceId]}};delete (model as any).sourceFieldQuotes;
  const result=assessRestaurantConditions(intent,[f,model])[0]!;assert.equal(result.status,"NOT_CHECKED");assert.ok(result.explanation.length>10);
 }
});

test("condition display requires current same-source field quotes and does not invent quotes from criterion text",()=>{
 const f=fact([source("CATEGORY","Omakase, Sushi")]);const result=assessRestaurantConditions(intent,[f])[0]!;
 assert.equal(result.status,"MET");assert.equal(result.sources[0]?.quote,"Omakase, Sushi");
 const wrong=fact([{...source("CATEGORY","Omakase, Sushi"),sourceUrl:url.replace("11111111","22222222")}]);assert.equal(assessRestaurantConditions(intent,[wrong])[0]!.status,"NOT_CHECKED");
 const absent=assessRestaurantConditions(intent,[{...f,sourceFieldQuotes:[]} as RestaurantReadEvidence])[0]!;assert.equal(absent.status,"NOT_CHECKED");assert.notEqual(absent.sources[0]?.quote,"omakase");
});

test("structured per-person cap has a HARD condition row with current quoted price, conflict and unknown states",()=>{
 const capped={...intent,budgetPerPerson:{max:8000,currency:"JPY" as const}};
 const priced=(amount?:number,meal:"DINNER"|"LUNCH"="DINNER"):RestaurantReadEvidence=>({...fact([source("CATEGORY","Omakase")]),...(amount===undefined?{}:{priceFacts:{schemaVersion:"restaurant-price-facts@1",listedCoursePricesYen:[{amount,kind:"MEAL",meal,tax:"INCLUDED",quote:`Dinner course JPY ${amount} including tax`,sourceUrl:url}]}})});
 const conditions=assessRestaurantConditions(capped,[priced(7000)]);
 assert.equal(conditions.length,2,"a structured cap must not disappear outside intent.criteria");
 const budget=conditions[1]!;assert.equal(budget.criterionRef,"criterion:1");assert.equal(budget.strength,"HARD");assert.equal(budget.polarity,"POSITIVE");assert.equal(budget.status,"MET");
 assert.deepEqual(budget.sources,[{field:"PRICE",quote:"Dinner course JPY 7000 including tax",sourceUrl:url}]);
 assert.equal(assessRestaurantConditions(capped,[priced(9000)])[1]?.status,"NOT_MET");
 assert.equal(assessRestaurantConditions(capped,[priced()])[1]?.status,"NOT_CHECKED");
 assert.equal(assessRestaurantConditions(capped,[priced(2000,"LUNCH")])[1]?.status,"NOT_CHECKED","a lunch price cannot establish a dinner cap");
});

test("soft budget strength and its upper-bound versus around meaning stay separate",()=>{
 const price:RestaurantReadEvidence={...fact([]),priceFacts:{schemaVersion:"restaurant-price-facts@1",listedCoursePricesYen:[{amount:6500,kind:"MEAL",meal:"DINNER",tax:"INCLUDED",quote:"Dinner course JPY 6500",sourceUrl:url}]}};
 const row=(text:string,strength:"SOFT"|"HARD")=>assessRestaurantConditions({...intent,criteria:[{text,strength,polarity:"POSITIVE"}]},[price])[0]!;
 assert.equal(row("around 6000 yen per person","SOFT").status,"MET");
 const ideally=row("ideally under 6000 yen per person","SOFT");assert.equal(ideally.status,"NOT_MET");assert.equal(ideally.strength,"SOFT");
 for(const text of ["under 6000 yen per person","at most 6000 yen per person","max 6000 yen per person"])assert.equal(row(text,"HARD").status,"NOT_MET",text);
 const separate=assessRestaurantConditions({...intent,criteria:[{text:"ideally under 6000 yen per person",strength:"SOFT",polarity:"POSITIVE"}],budgetPerPerson:{max:8000,currency:"JPY"}},[price]);
 assert.deepEqual(separate.map(r=>[r.strength,r.status]),[["SOFT","NOT_MET"],["HARD","MET"]],"an independently stated firm cap must not be merged into a soft target");
});
