import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {bookingTermsComposition} from "./fixtures/booking-terms-composition.js";

type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
const input=()=>readFile(new URL("./fixtures/named-outlet-without-area/d3-semantic.original.json",import.meta.url),"utf8");
async function capture(f:Fixture,label:string){
  const a=await f.artifact();
  if(process.env.PRAXIS_NAMED_AREA_CAPTURE==="1")console.log("NAMED_AREA_RAW "+Buffer.from(JSON.stringify({label,...a})).toString("base64"));
  return a;
}
test("D3 original semantic bytes through ordinary composition find the unique named outlet without inventing AREA, then show B1 and terms",async()=>{
  const outputText=await input(),f=await bookingTermsComposition({namedWithoutArea:{outputText}});
  try{
    const v=await f.initial(),a=await capture(f,"D3_UNIQUE");
    assert.equal(f.requests.find(q=>q.request.purpose==="restaurant_semantic_interpret")!.response.outputText,outputText);
    assert.equal(v.restaurant.intentDraft?.area,undefined,"No source or service-scope address becomes user AREA");
    assert.equal(v.case.phase,"PRESENT_RESULTS");
    assert.equal(v.restaurant.presentedCandidateIds?.length,1);
    assert.ok(v.restaurant.bookingHandoffs?.length);assert.equal(v.restaurant.bookingHandoffs![0]!.url,f.source.vacancy.body.selection[0].url);
    assert.ok(v.restaurant.readEvidence.some(e=>e.kind==="DISCOVERY"&&e.claims.locationBasis==="NAMED_OUTLET_RESOLUTION"));
    assert.equal(v.restaurant.candidates[0]!.distanceObservation,undefined,"No invented center/radius distance");
    assert.equal(v.restaurant.bookingHandoffs![0]!.terms.length,2);
    assert.ok(f.requests.some(q=>q.request.purpose==="restaurant_agent_decide"&&JSON.parse(q.response.outputText).type==="SEARCH_RESTAURANTS"));
    assert.ok(!(a.execution as {events:Array<{event:{type:string}}>}).events.some(e=>e.event.type==="BOOKING_PROPOSED"));
    const later=await f.area();await capture(f,"USER_AREA");
    assert.equal(later.restaurant.intentDraft?.area?.query,"Akabane");assert.equal(later.case.phase,"PRESENT_RESULTS");
    assert.ok(later.restaurant.bookingHandoffs?.length);assert.ok(!later.restaurant.readEvidence.some(e=>e.claims.locationBasis==="NAMED_OUTLET_RESOLUTION"));
  }finally{await f.close();}
});

test("a named-outlet lookup with two matching branches asks the user before availability, selection or B1",async()=>{
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:await input(),scenario:"AMBIGUOUS"}});
  try{const v=await f.initial();await capture(f,"AMBIGUOUS");
    assert.equal(v.restaurant.candidates.length,2);assert.equal(v.case.phase,"NEEDS_INPUT");
    assert.equal(v.restaurant.selectedCandidateId,undefined);assert.deepEqual(v.restaurant.availabilityChecks,{});assert.deepEqual(v.restaurant.bookingHandoffs,[]);
    assert.equal(f.sourceCalls.filter(c=>c.kind==="BROWSER_NAVIGATE").length,0);
    assert.match(v.conversation.messages.at(-1)!.content,/branch|area/i);
  }finally{await f.close();}
});

test("OPEN_ENDED still asks for a missing area without starting discovery",async()=>{
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:await input(),openEnded:true}});
  try{const v=await f.initial();await capture(f,"OPEN_NO_AREA");assert.equal(v.case.phase,"NEEDS_INPUT");assert.ok(v.restaurant.missingRequiredFields.includes("area"));assert.equal(f.sourceCalls.length,0);assert.deepEqual(v.restaurant.bookingHandoffs,[]);}
  finally{await f.close();}
});

for(const scenario of ["MISSING","UNRELATED"] as const)test(`named outlet ${scenario} ends honestly without substituting another shop`,async()=>{
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:await input(),scenario}});
  try{const v=await f.initial();await capture(f,scenario);assert.equal(v.case.phase,"NO_VERIFIED_RESULT");assert.deepEqual(v.restaurant.presentedCandidateIds,undefined);assert.deepEqual(v.restaurant.bookingHandoffs,[]);assert.equal(v.restaurant.selectedCandidateId,undefined);assert.equal(f.sourceCalls.filter(c=>c.kind==="BROWSER_NAVIGATE").length,0);}
  finally{await f.close();}
});

test("a different branch with a similar name remains a clarification instead of an assumed match",async()=>{
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:await input(),scenario:"BRANCH"}});
  try{const v=await f.initial();await capture(f,"OTHER_BRANCH");assert.equal(v.case.phase,"NEEDS_INPUT");assert.ok(f.sourceCalls.length);assert.equal(v.restaurant.selectedCandidateId,undefined);assert.deepEqual(v.restaurant.availabilityChecks,{});assert.deepEqual(v.restaurant.bookingHandoffs,[]);}
  finally{await f.close();}
});
