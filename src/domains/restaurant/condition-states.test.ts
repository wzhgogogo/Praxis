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
 const result=assessRestaurantConditions(intent,[fact([source("COURSE_TITLE","Lunch Omakase Course","LUNCH")])], "2026-10-21T00:00:00.000Z")[0]!;
 assert.equal(result.status,"MET");assert.equal(result.sources[0]?.quote,"Lunch Omakase Course");assert.equal((result.sources[0] as any).field,"COURSE_TITLE");assert.equal((result.sources[0] as any).meal,"LUNCH");assert.match(result.explanation,/not.*requested|requested.*not/i);
 const dinner=assessRestaurantConditions({...intent,criteria:[{...intent.criteria[0]!,text:"omakase course"}]},[fact([source("COURSE_TITLE","Lunch Omakase Course","LUNCH")],"omakase course")], "2026-10-21T00:00:00.000Z")[0]!;
 assert.equal(dinner.status,"NOT_CHECKED");
});

test("condition display does not let names or customer reviews discharge HARD even with model labels",()=>{
 for(const fields of [[source("NAME","Omakase House")],[source("CUSTOMER_REVIEW","Wonderful omakase course")],[]]){
  const f=fact(fields);const model:RestaurantReadEvidence={...f,evidenceId:"model",provider:"MODEL_JUDGMENT",claims:{verifiedHardCriteria:["omakase"],supportingEvidenceIds:[f.evidenceId]}};delete (model as any).sourceFieldQuotes;
  const result=assessRestaurantConditions(intent,[f,model], "2026-10-21T00:00:00.000Z")[0]!;assert.equal(result.status,"NOT_CHECKED");assert.ok(result.explanation.length>10);
 }
});

test("condition display requires current same-source field quotes and does not invent quotes from criterion text",()=>{
 const f=fact([source("CATEGORY","Omakase, Sushi")]);const result=assessRestaurantConditions(intent,[f], "2026-10-21T00:00:00.000Z")[0]!;
 assert.equal(result.status,"MET");assert.equal(result.sources[0]?.quote,"Omakase, Sushi");
 const wrong=fact([{...source("CATEGORY","Omakase, Sushi"),sourceUrl:url.replace("11111111","22222222")}]);assert.equal(assessRestaurantConditions(intent,[wrong], "2026-10-21T00:00:00.000Z")[0]!.status,"NOT_CHECKED");
 const absent=assessRestaurantConditions(intent,[{...f,sourceFieldQuotes:[]} as RestaurantReadEvidence], "2026-10-21T00:00:00.000Z")[0]!;assert.equal(absent.status,"NOT_CHECKED");assert.notEqual(absent.sources[0]?.quote,"omakase");
});

test("structured per-person cap has a HARD condition row with current quoted price, conflict and unknown states",()=>{
 const capped={...intent,budgetPerPerson:{max:8000,currency:"JPY" as const}};
 const priced=(amount?:number,meal:"DINNER"|"LUNCH"="DINNER"):RestaurantReadEvidence=>({...fact([source("CATEGORY","Omakase")]),...(amount===undefined?{}:{priceFacts:{schemaVersion:"restaurant-price-facts@1",listedCoursePricesYen:[{amount,kind:"MEAL",meal,tax:"INCLUDED",quote:`Dinner course JPY ${amount} including tax`,sourceUrl:url}]}})});
 const conditions=assessRestaurantConditions(capped,[priced(7000)], "2026-10-21T00:00:00.000Z");
 assert.equal(conditions.length,2,"a structured cap must not disappear outside intent.criteria");
 const budget=conditions[1]!;assert.equal(budget.criterionRef,"criterion:1");assert.equal(budget.strength,"HARD");assert.equal(budget.polarity,"POSITIVE");assert.equal(budget.status,"MET");
 assert.deepEqual(budget.sources,[{field:"PRICE",quote:"Dinner course JPY 7000 including tax",sourceUrl:url}]);
 assert.equal(assessRestaurantConditions(capped,[priced(9000)], "2026-10-21T00:00:00.000Z")[1]?.status,"NOT_MET");
 assert.equal(assessRestaurantConditions(capped,[priced()], "2026-10-21T00:00:00.000Z")[1]?.status,"NOT_CHECKED");
 assert.equal(assessRestaurantConditions(capped,[priced(2000,"LUNCH")], "2026-10-21T00:00:00.000Z")[1]?.status,"NOT_CHECKED","a lunch price cannot establish a dinner cap");
});

test("soft budget strength and its upper-bound versus around meaning stay separate",()=>{
 const price:RestaurantReadEvidence={...fact([]),priceFacts:{schemaVersion:"restaurant-price-facts@1",listedCoursePricesYen:[{amount:6500,kind:"MEAL",meal:"DINNER",tax:"INCLUDED",quote:"Dinner course JPY 6500",sourceUrl:url}]}};
 const row=(text:string,strength:"SOFT"|"HARD")=>assessRestaurantConditions({...intent,criteria:[{text,strength,polarity:"POSITIVE"}]},[price], "2026-10-21T00:00:00.000Z")[0]!;
 assert.equal(row("around 6000 yen per person","SOFT").status,"MET");
 const ideally=row("ideally under 6000 yen per person","SOFT");assert.equal(ideally.status,"NOT_MET");assert.equal(ideally.strength,"SOFT");
 for(const text of ["under 6000 yen per person","at most 6000 yen per person","max 6000 yen per person"])assert.equal(row(text,"HARD").status,"NOT_MET",text);
 const separate=assessRestaurantConditions({...intent,criteria:[{text:"ideally under 6000 yen per person",strength:"SOFT",polarity:"POSITIVE"}],budgetPerPerson:{max:8000,currency:"JPY"}},[price], "2026-10-21T00:00:00.000Z");
 assert.deepEqual(separate.map(r=>[r.strength,r.status]),[["SOFT","NOT_MET"],["HARD","MET"]],"an independently stated firm cap must not be merged into a soft target");
});

test("a generic food descriptor uses the same explicit merchant category without broadening cuisine qualifiers",()=>{
 const criteria=[{text:"regional food",strength:"HARD" as const,polarity:"POSITIVE" as const}];
 const current=fact([source("CATEGORY","Regional, Noodles")],"regional food");
 const shown=assessRestaurantConditions({...intent,criteria},[current], "2026-10-21T00:00:00.000Z")[0]!;
 assert.equal(shown.status,"MET");
 assert.deepEqual(shown.sources,[source("CATEGORY","Regional, Noodles")],"display the actual merchant field, never a quote assembled from the request");
 for(const field of ["NAME","CUSTOMER_REVIEW"]){
  assert.equal(assessRestaurantConditions({...intent,criteria},[fact([source(field,"Regional")],"regional food")], "2026-10-21T00:00:00.000Z")[0]?.status,"NOT_CHECKED");
 }
 assert.equal(assessRestaurantConditions({...intent,criteria:[{...criteria[0]!,text:"northern regional food"}]},[fact([source("CATEGORY","Regional")],"northern regional food")], "2026-10-21T00:00:00.000Z")[0]?.status,"NOT_CHECKED","all cuisine qualifiers still require source text");
 assert.equal(assessRestaurantConditions({...intent,criteria},[fact([source("CATEGORY","No regional food offered")],"regional food")], "2026-10-21T00:00:00.000Z")[0]?.status,"NOT_CHECKED");
});


test("quoted budget applicability keeps request-bound party, meal, weekday/date restrictions and unknowns", () => {
 const request = {...intent, criteria: [], partySize: 2, date: "2026-08-05", budgetPerPerson: {max: 8000, currency: "JPY" as const}};
 const priced = (suffix: string, amount = 7000): RestaurantReadEvidence => ({...fact([]), priceFacts: {
  schemaVersion: "restaurant-price-facts@1", listedCoursePricesYen: [{amount, kind: "MEAL", meal: "DINNER", tax: "INCLUDED", sourceUrl: url,
   quote: `Dinner course JPY ${amount} including tax. ${suffix}`.trim()}],
 }});
 const cases: Array<{name: string; clause: string; expected: "MET" | "NOT_MET" | "NOT_CHECKED"; partySize?: number; date?: string; amount?: number}> = [
  {name: "unrestricted", clause: "", expected: "MET"},
  {name: "too small for minimum", clause: "Available only for parties of 4 or more.", expected: "NOT_CHECKED"},
  {name: "minimum met", clause: "Available only for parties of 4 or more.", partySize: 4, expected: "MET"},
  {name: "above maximum", clause: "For up to 2 guests.", partySize: 4, expected: "NOT_CHECKED"},
  {name: "inclusive party range", clause: "Number of people 2 - 6", expected: "MET"},
  {name: "outside party range", clause: "Number of people 2 - 6", partySize: 7, expected: "NOT_CHECKED"},
  {name: "Japanese minimum", clause: "4名様以上限定", expected: "NOT_CHECKED"},
  {name: "Japanese range", clause: "利用人数2〜6名様", expected: "MET"},
  {name: "weekday inside range", clause: "Available Monday to Friday only.", expected: "MET"},
  {name: "weekday outside range", clause: "Available Monday to Friday only.", date: "2026-08-09", expected: "NOT_CHECKED"},
  {name: "Japanese weekday", clause: "水曜日限定", expected: "MET"},
  {name: "Japanese wrong weekday", clause: "火曜日限定", expected: "NOT_CHECKED"},
  {name: "date range inclusive", clause: "Valid from 2026-08-01 to 2026-08-05 only.", expected: "MET"},
  {name: "date range expired", clause: "Valid from 2026-07-01 to 2026-07-31 only.", expected: "NOT_CHECKED"},
  {name: "Japanese dates", clause: "利用期間2026年8月1日〜2026年8月31日限定", expected: "MET"},
  {name: "single date", clause: "Available on 2026-08-05 only.", expected: "MET"},
  {name: "single date outside", clause: "Available on 2026-08-06 only.", expected: "NOT_CHECKED"},
  {name: "invalid date", clause: "Valid on 2026-02-30 only.", expected: "NOT_CHECKED"},
  {name: "year absent", clause: "Available from August 1 through August 31 only.", expected: "NOT_CHECKED"},
  {name: "lunch only cannot prove dinner", clause: "Lunch only.", expected: "NOT_CHECKED"},
  {name: "Japanese lunch only", clause: "ランチ限定", expected: "NOT_CHECKED"},
  {name: "matching dinner", clause: "Dinner only.", expected: "MET"},
  {name: "excluded weekday", clause: "Not available on Wednesday.", expected: "NOT_CHECKED"},
  {name: "weekday exclusion checked", clause: "Not available on Tuesday.", expected: "MET"},
  {name: "unsupported spelled party", clause: "For four diners.", expected: "NOT_CHECKED"},
  {name: "day substring is not weekday", clause: "Salmon course.", expected: "MET"},
  {name: "membership cannot be verified", clause: "Members only.", expected: "NOT_CHECKED"},
  {name: "advance booking cannot be verified", clause: "Advance reservation required.", expected: "NOT_CHECKED"},
  {name: "holiday cannot be verified", clause: "Weekdays excluding public holidays only.", expected: "NOT_CHECKED"},
  {name: "all constraints apply", clause: "Number of people 2 - 6. Wednesday only. Valid from 2026-08-01 to 2026-08-31 only.", expected: "MET"},
  {name: "applicable over cap", clause: "For parties of 2 or more.", amount: 9000, expected: "NOT_MET"},
  {name: "inapplicable over cap stays unknown", clause: "For parties of 4 or more.", amount: 9000, expected: "NOT_CHECKED"},
  {name: "unverified over cap stays unknown", clause: "Members only.", amount: 9000, expected: "NOT_CHECKED"},
 ];
 for (const row of cases) {
  const current = {...request, ...(row.partySize ? {partySize: row.partySize} : {}), ...(row.date ? {date: row.date} : {})};
  const evidence = priced(row.clause, row.amount);
  const result = assessRestaurantConditions(current, [evidence], "2026-10-21T00:00:00.000Z")[0]!;
  assert.equal(result.status, row.expected, row.name);
  assert.equal(evidence.priceFacts!.listedCoursePricesYen[0]!.quote, `Dinner course JPY ${row.amount ?? 7000} including tax. ${row.clause}`.trim());
 }
 const {partySize: _party, ...withoutParty} = request;
 const {date: _date, ...withoutDate} = request;
 const {timeWindow: _window, ...withoutTime} = request;
 assert.equal(assessRestaurantConditions(withoutParty, [priced("For parties of 4 or more.")], "2026-10-21T00:00:00.000Z")[0]?.status, "NOT_CHECKED", "unknown party cannot establish applicability");
 assert.equal(assessRestaurantConditions(withoutDate, [priced("Wednesday only.")], "2026-10-21T00:00:00.000Z")[0]?.status, "NOT_CHECKED", "unknown date cannot establish weekday");
 assert.equal(assessRestaurantConditions(withoutTime, [priced("Dinner only.")], "2026-10-21T00:00:00.000Z")[0]?.status, "NOT_CHECKED", "unknown meal cannot establish a meal restriction");
 assert.equal(assessRestaurantConditions(withoutTime, [priced("")], "2026-10-21T00:00:00.000Z")[0]?.status, "NOT_CHECKED", "a meal-labelled price needs a requested meal");
 assert.equal(assessRestaurantConditions(request, [priced("For parties of 4 or more."), priced("")], "2026-10-21T00:00:00.000Z")[0]?.status, "MET", "an independent applicable price is retained");
 assert.equal(assessRestaurantConditions(request, [priced("For parties of 4 or more."), priced("", 9000)], "2026-10-21T00:00:00.000Z")[0]?.status, "NOT_MET", "the inapplicable cheap quote cannot override an applicable over-cap quote");
});
