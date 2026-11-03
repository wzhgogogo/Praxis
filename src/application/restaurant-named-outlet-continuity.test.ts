import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {bookingTermsComposition} from "./fixtures/booking-terms-composition.js";
import {namedOutletCandidateResolved} from "../domains/restaurant/named-outlet-resolution.js";

type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
const input=async()=>JSON.parse(await readFile(new URL("./fixtures/named-outlet-continuity/inputs.json",import.meta.url),"utf8"));
async function capture(f:Fixture,label:string){const a=await f.artifact();if(process.env.PRAXIS_NAMED_CONTINUITY_CAPTURE==="1")console.log("NAMED_CONTINUITY_RAW "+Buffer.from(JSON.stringify({label,...a})).toString("base64"));return a;}

test("D6 actual five unrelated source candidates never resolve a specific Ito request merely because AREA is present",async()=>{
  const data=await input();assert.equal(data.thirdOriginalNameState.intentDraft.target.query,"Ito Akabane");assert.ok(data.thirdOriginalNameState.intentDraft.area);
  assert.equal(data.thirdOriginalNameState.candidates.length,5);
  for(const candidate of data.thirdOriginalNameState.candidates){
    assert.notEqual(candidate.restaurant.sourceIds.googlePlaces,"ChIJwUnGVR2TGGARNAEaZNumYhQ");
    assert.equal(namedOutletCandidateResolved(data.thirdOriginalNameState,candidate.restaurant.id),false,candidate.restaurant.outletName);
  }
});

for(const scenario of ["EXACT","RENAMED"] as const)test(`D6 original semantics and decisions keep the user-selected identity after party reset: ${scenario}`,async()=>{
  const f=await bookingTermsComposition({continuity:scenario}),data=await input();
  try{
    const first=await f.initial();await capture(f,scenario+"_INITIAL");
    assert.equal(first.case.phase,"PRESENT_RESULTS","Replay precondition: real three displayed Google IDs");assert.deepEqual(first.restaurant.presentedCandidateIds,data.originalPresentedIds);
    const booked=await f.select();await capture(f,scenario+"_BOOK");assert.equal(booked.case.phase,"NEEDS_INPUT");assert.equal(booked.restaurant.intentDraft?.target?.query,"Ito Akabane");
    const result=await f.party();const a=await capture(f,scenario+"_PARTY");
    assert.equal(result.case.phase,"PRESENT_RESULTS");assert.equal(result.restaurant.presentedCandidateIds?.length,1);
    const selected=result.restaurant.candidates.find(c=>c.restaurant.id===result.restaurant.selectedCandidateId);assert.equal(selected?.restaurant.sourceIds.googlePlaces,"ChIJwUnGVR2TGGARNAEaZNumYhQ");
    assert.equal(result.restaurant.bookingHandoffs?.length,1);assert.equal(result.restaurant.bookingHandoffs![0]!.candidateId,result.restaurant.selectedCandidateId);assert.equal(result.restaurant.bookingHandoffs![0]!.terms.length,2);
    const semantic=f.requests.filter(q=>q.request.purpose==="restaurant_semantic_interpret");
    for(const [i,n] of [1,9,12].entries())assert.equal(semantic[i]!.response.outputText,await readFile(new URL(`./fixtures/named-outlet-continuity/decision-${String(n).padStart(2,"0")}.original.json`,import.meta.url),"utf8"));
    const rawBad=await readFile(new URL("./fixtures/named-outlet-continuity/decision-23.original.json",import.meta.url),"utf8");assert.ok(f.requests.some(q=>q.response.outputText===rawBad),"Actual five-store PRESENT_RESULTS was proposed unchanged");
    assert.ok(Array.isArray(a.execution.events));assert.ok(!a.execution.events.some(e=>e.event.type==="BOOKING_PROPOSED"));
  }finally{await f.close();}
});

for(const scenario of ["MISSING","NO_SLOT"] as const)test(`D6 named outlet does not silently switch to other shops: ${scenario}`,async()=>{
  const f=await bookingTermsComposition({continuity:scenario});
  try{
    const first=await f.initial();await capture(f,scenario+"_INITIAL");assert.equal(first.case.phase,"PRESENT_RESULTS","Replay source precondition");
    await f.select();const result=await f.party();await capture(f,scenario+"_PARTY");assert.deepEqual(result.restaurant.bookingHandoffs,[]);assert.equal(result.restaurant.presentedCandidateIds,undefined);
    assert.equal(result.restaurant.intentDraft?.target?.query,"Ito Akabane");
    assert.equal(result.case.phase,"NO_VERIFIED_RESULT");assert.match(result.conversation.messages.at(-1)!.content,/Ito Akabane/i);
  }finally{await f.close();}
});

test("a fresh named request with AREA and two matching outlets asks instead of inventing a user choice",async()=>{
  const f=await bookingTermsComposition({continuity:"AMBIGUOUS"});
  try{const result=await f.initial();await capture(f,"FRESH_AMBIGUOUS");assert.equal(result.case.phase,"NEEDS_INPUT");assert.equal(result.restaurant.selectedCandidateId,undefined);assert.deepEqual(result.restaurant.bookingHandoffs,[]);assert.equal(result.restaurant.presentedCandidateIds,undefined);assert.deepEqual(result.restaurant.availabilityChecks,{});}
  finally{await f.close();}
});
