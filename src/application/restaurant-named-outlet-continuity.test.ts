import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {bookingTermsComposition} from "./fixtures/booking-terms-composition.js";
import {namedOutletCandidateResolved,sameNamedOutletIdentity} from "../domains/restaurant/named-outlet-resolution.js";
import {userBookingSelectionRequest} from "./restaurant-user-booking-selection.js";
import {completeRestaurantSearchIntent} from "../domains/restaurant/intent-state.js";

type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
const input=async()=>JSON.parse(await readFile(new URL("./fixtures/named-outlet-continuity/inputs.json",import.meta.url),"utf8"));
async function capture(f:Fixture,label:string){const a=await f.artifact();if(process.env.PRAXIS_NAMED_CONTINUITY_CAPTURE==="1")console.log("NAMED_CONTINUITY_RAW "+Buffer.from(JSON.stringify({label,...a})).toString("base64"));return a;}

test("D6 actual five unrelated source candidates never resolve a specific Ito request merely because AREA is present",async()=>{
  const data=await input();assert.equal(data.thirdOriginalNameState.intentDraft.target.query,"Ito Akabane");assert.ok(data.thirdOriginalNameState.intentDraft.area);
  assert.equal(data.thirdOriginalNameState.candidates.length,5);
  const outcomes=[];
  for(const candidate of data.thirdOriginalNameState.candidates){
    assert.notEqual(candidate.restaurant.sourceIds.googlePlaces,"ChIJwUnGVR2TGGARNAEaZNumYhQ");
    const resolved=namedOutletCandidateResolved(data.thirdOriginalNameState,candidate.restaurant.id);outcomes.push({id:candidate.restaurant.id,name:candidate.restaurant.outletName,resolved});assert.equal(resolved,false,candidate.restaurant.outletName);
  }
  if(process.env.PRAXIS_NAMED_CONTINUITY_CAPTURE==="1")console.log("NAMED_GUARD_RAW "+Buffer.from(JSON.stringify({requestedName:"Ito Akabane",outcomes})).toString("base64"));
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
    assert.ok(Array.isArray(a.execution.events));const reference=userBookingSelectionRequest(a.execution.events);assert.equal(reference?.reference?.restaurant.sourceIds.googlePlaces,"ChIJwUnGVR2TGGARNAEaZNumYhQ");
    assert.ok(reference?.candidateId,"The original semantic event retained its user-bound reference");
    assert.equal(result.restaurant.bookingHandoffs?.length,1);assert.equal(result.restaurant.bookingHandoffs![0]!.candidateId,result.restaurant.selectedCandidateId);assert.equal(result.restaurant.bookingHandoffs![0]!.terms.length,2);
    const semantic=f.requests.filter(q=>q.request.purpose==="restaurant_semantic_interpret");
    for(const [i,n] of [1,9,12].entries())assert.equal(semantic[i]!.response.outputText,await readFile(new URL(`./fixtures/named-outlet-continuity/decision-${String(n).padStart(2,"0")}.original.json`,import.meta.url),"utf8"));
    const rawBad=await readFile(new URL("./fixtures/named-outlet-continuity/decision-23.original.json",import.meta.url),"utf8");assert.ok(f.requests.some(q=>q.response.outputText===rawBad),"Actual five-store PRESENT_RESULTS was proposed unchanged");
    assert.ok(Array.isArray(a.execution.events));assert.ok(!a.execution.events.some(e=>e.event.type==="BOOKING_PROPOSED"));
  }finally{await f.close();}
});

test("only an explicit later OPEN_ENDED approval permits other nearby stores after Ito was not found",async()=>{
  const f=await bookingTermsComposition({continuity:"MISSING"});
  try{await f.initial();await f.select();const missing=await f.party();await capture(f,"ALLOW_OTHERS_BEFORE");assert.equal(missing.case.phase,"NO_VERIFIED_RESULT");assert.deepEqual(missing.restaurant.bookingHandoffs,[]);
    const allowed=await f.others();const a=await capture(f,"ALLOW_OTHERS_AFTER");assert.equal(allowed.restaurant.intentDraft?.target?.selectionScope,"OPEN_ENDED");assert.equal(allowed.case.phase,"PRESENT_RESULTS");
    assert.ok(allowed.restaurant.presentedCandidateIds?.length);for(const id of allowed.restaurant.presentedCandidateIds!)assert.notEqual(allowed.restaurant.candidates.find(c=>c.restaurant.id===id)!.restaurant.sourceIds.googlePlaces,"ChIJwUnGVR2TGGARNAEaZNumYhQ");
    assert.ok(Array.isArray(a.execution.events));assert.equal(userBookingSelectionRequest(a.execution.events),undefined,"The old named identity is cleared by the user-approved new target");
  }finally{await f.close();}
});

test("source identity survives a rebuilt candidate ID, while same name/phone and conflicting provider IDs never suffice",async()=>{
  const data=await input(),original=data.thirdOriginalNameState.candidates[0].restaurant;
  const reference={...original,sourceIds:{googlePlaces:"chosen-google-id",tabelog:"en/tokyo/A1323/A132305/13109596",phone:"03-3598-2992"}};
  assert.equal(sameNamedOutletIdentity({...reference,id:"rebuilt-id"},reference),true);
  assert.equal(sameNamedOutletIdentity({...reference,sourceIds:{...reference.sourceIds,googlePlaces:"other-google-id"}},reference),false);
  assert.equal(sameNamedOutletIdentity({...reference,sourceIds:{phone:reference.sourceIds.phone}},reference),false);
  assert.equal(sameNamedOutletIdentity({...reference,sourceIds:{...reference.sourceIds,tabelog:"tokyo/A1323/A132305/13109596"}},reference),true);
  assert.equal(sameNamedOutletIdentity({...reference,sourceIds:{...reference.sourceIds,tabelog:"tokyo/A1323/A132305/13109597"}},reference),false);
});

test("a source-native selected ID seeds only its old discovery, then requires new identity and slots; a new area cannot inherit old distance",async()=>{
  const data=await input(),state=data.thirdOriginalNameState,restaurant=state.candidates[0].restaurant;
  const f=await bookingTermsComposition(),signal=new AbortController().signal;
  try{
    const intent=completeRestaurantSearchIntent({...state.intentDraft,target:{...state.intentDraft.target,query:restaurant.outletName}});assert.ok(intent);
    const discovery=state.readEvidence.filter((e:{kind:string;candidateId?:string})=>e.kind==="DISCOVERY"&&e.candidateId===restaurant.id);
    assert.ok(discovery.length);const reference={restaurant,discovery,userEventId:"component:prior-user-selection"};
    const read=await f.assembly.search.search({intent,readRunId:"native-reference-component"},signal,reference);
    assert.equal(read.candidates.length,1);assert.equal(read.candidates[0]!.restaurant.sourceIds.tabelog,restaurant.sourceIds.tabelog);
    assert.ok(read.evidence.length);assert.ok(read.evidence.every(e=>e.kind==="DISCOVERY"&&e.claims.observationKind==="USER_SELECTION_REFERENCE"));
    assert.equal(read.evidence[0]!.observedAt,discovery[0].observedAt,"Cached discovery is never re-dated as a new page read");
    assert.equal(read.metadata.googleRequests?.total,0);assert.equal(f.sourceCalls.length,0);
    const moved=await f.assembly.search.search({intent:{...intent,area:{query:"Ginza"}},readRunId:"native-reference-component"},signal,reference);
    assert.equal(moved.evidence[0]!.claims.areaQuery,"Ginza");assert.equal(moved.evidence[0]!.claims.areaMatch,false);assert.equal(moved.evidence[0]!.claims.distanceMeters,undefined);
    assert.equal(f.sourceCalls.length,0,"Unchanged source identity does not authorize another store or a fabricated area");
    if(process.env.PRAXIS_NAMED_CONTINUITY_CAPTURE==="1")console.log("NAMED_NATIVE_REFERENCE_RAW "+Buffer.from(JSON.stringify({read,moved,reference,sourceCalls:f.sourceCalls})).toString("base64"));
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
