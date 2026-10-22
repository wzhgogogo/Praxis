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
