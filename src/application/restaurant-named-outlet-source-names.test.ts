import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
import {bookingTermsComposition} from "./fixtures/booking-terms-composition.js";
import {namedOutletContainment,outletNameContains} from "../domains/restaurant/named-outlet-resolution.js";

const original=()=>readFile(new URL("./fixtures/named-outlet-without-area/d3-semantic.original.json",import.meta.url),"utf8");
const google=async()=>JSON.parse(await readFile(new URL("./fixtures/named-outlet-without-area/d1-google-place.json",import.meta.url),"utf8"));
type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
async function capture(f:Fixture,label:string){const a=await f.artifact();if(process.env.PRAXIS_NAMED_SOURCE_CAPTURE==="1")console.log("NAMED_SOURCE_RAW "+Buffer.from(JSON.stringify({label,...a})).toString("base64"));return a;}

test("D1 original Google short name and D3 original semantic bytes resolve Dengana by identity, then present B1",async()=>{
  const outputText=await original(),place=await google(),f=await bookingTermsComposition({namedWithoutArea:{outputText,sourceNames:{google:place}}});
  try{const v=await f.initial();const a=await capture(f,"D1_D3");
    assert.equal(f.requests.find(r=>r.request.purpose==="restaurant_semantic_interpret")!.response.outputText,outputText);
    assert.equal(v.restaurant.candidates[0]!.restaurant.outletName,"Dengana Akabane");
    assert.equal(v.restaurant.intentDraft?.area,undefined);assert.equal(v.case.phase,"PRESENT_RESULTS");
    assert.equal(v.restaurant.presentedCandidateIds?.length,1);assert.equal(v.restaurant.selectedCandidateId,v.restaurant.presentedCandidateIds![0]);
    assert.ok(v.restaurant.readEvidence.some(e=>e.provider==="TABELOG"&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.confidence==="HIGH"));
    assert.equal(v.restaurant.bookingHandoffs?.length,1);assert.equal(v.restaurant.bookingHandoffs![0]!.url,f.source.vacancy.body.selection[0].url);
    assert.equal(v.restaurant.bookingHandoffs![0]!.terms.length,2);
    assert.ok(Array.isArray(a.execution.events));assert.ok(!a.execution.events.some(e=>e.event.type==="BOOKING_PROPOSED"));
  }finally{await f.close();}
});

test("an identity-confirmed Tabelog full page name resolves even when Google name alone cannot justify the extra words",async()=>{
  const place={...await google(),displayName:{text:"Kushi Katsu"}};
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:await original(),sourceNames:{google:place}}});
  try{const v=await f.initial();await capture(f,"SOURCE_FULL_NAME");
    assert.equal(v.case.phase,"PRESENT_RESULTS");assert.equal(v.restaurant.presentedCandidateIds?.length,1);assert.ok(v.restaurant.bookingHandoffs?.length);
    assert.ok(v.restaurant.readEvidence.some(e=>e.provider==="TABELOG"&&e.kind==="ENTITY_MATCH"&&e.entityMatch?.matchedBy.includes("EXACT_PHONE")));
  }finally{await f.close();}
});

test("a sole containing name cannot supply unquoted cuisine or branch words after identity",async()=>{
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:await original(),sourceNames:{google:await google(),pageName:"Dengana Akabane"}}});
  try{const v=await f.initial();await capture(f,"CONTAINMENT_ONLY");assert.equal(v.case.phase,"NEEDS_INPUT");assert.deepEqual(v.restaurant.bookingHandoffs,[]);assert.equal(v.restaurant.selectedCandidateId,undefined);}
  finally{await f.close();}
});

test("two containment candidates ask instead of choosing a branch",async()=>{
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:await original(),sourceNames:{google:await google(),twoCandidates:true}}});
  try{const v=await f.initial();await capture(f,"TWO_CONTAINED");assert.equal(v.restaurant.candidates.length,2);assert.equal(v.case.phase,"NEEDS_INPUT");assert.equal(v.restaurant.selectedCandidateId,undefined);assert.deepEqual(v.restaurant.availabilityChecks,{});assert.deepEqual(v.restaurant.bookingHandoffs,[]);}
  finally{await f.close();}
});

test("an extra locality absent from the outlet address remains ambiguous",async()=>{
  const body=JSON.parse(await original());body.facts.find((fact:{field:string})=>fact.field==="TARGET").value.query+=" Ginza";
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:JSON.stringify(body),sourceNames:{google:await google()}}});
  try{const v=await f.initial();await capture(f,"WRONG_LOCALITY");assert.equal(v.case.phase,"NEEDS_INPUT");assert.equal(v.restaurant.selectedCandidateId,undefined);assert.deepEqual(v.restaurant.bookingHandoffs,[]);assert.equal(v.restaurant.presentedCandidateIds,undefined);}
  finally{await f.close();}
});

test("containment never overrules a source identity conflict",async()=>{
  const f=await bookingTermsComposition({namedWithoutArea:{outputText:await original(),sourceNames:{google:await google(),identityConflict:true}}});
  try{const v=await f.initial();await capture(f,"IDENTITY_CONFLICT");assert.notEqual(v.case.phase,"PRESENT_RESULTS");assert.equal(v.restaurant.selectedCandidateId,undefined);assert.deepEqual(v.restaurant.bookingHandoffs,[]);assert.equal(v.restaurant.presentedCandidateIds,undefined);assert.ok(f.sourceCalls.some(c=>c.kind==="BROWSER_NAVIGATE"),"The conflicting source was actually read");}
  finally{await f.close();}
});

test("literal locality evidence permits extra geography but a building word, unknown alias or word fragment does not",()=>{
  assert.equal(namedOutletContainment("Kushi Katsu Dengana Akabane ten","Dengana","Tokyo Kita City Akabane 1-15-1",["Akabane"]),false);
  assert.equal(namedOutletContainment("Kushi Katsu Dengana Akabane ten","Dengana","Tokyo Kita City Akabane 1-15-1",["Akabane"],["Kushi Katsu","ten"]),true);
  assert.equal(namedOutletContainment("Kushi Katsu Dengana Ginza ten","Dengana","Tokyo Kita City Akabane 1-15-1",["Akabane"]),false);
  assert.equal(namedOutletContainment("Dengana Secret","Dengana","Tokyo Akabane Secret Building 1F",["Akabane"]),false);
  assert.equal(namedOutletContainment("Dengana Secret","Dengana Akabane","Tokyo Akabane",["Akabane"]),false);
  assert.equal(outletNameContains("Senga Tokyo","Sen"),false);
});

test("TableCheck's identity-bound observed page name also resolves the different Google name",async()=>{
  const source=JSON.parse(await readFile(new URL("../eval/restaurant/agent-loop/cases/g6-development/source.json",import.meta.url),"utf8"));
  const place={...await google(),displayName:{text:"Kushi Katsu"},websiteUri:source.tablecheck.pageUrl};
  const f=await bookingTermsComposition({provider:"TABLECHECK",namedWithoutArea:{outputText:await original(),sourceNames:{google:place,twoCandidates:true,pageQuery:"?service_mode=dining&sort_by=relevance&venue_type=tc"}}});
  try{const v=await f.initial();await capture(f,"TABLECHECK_SOURCE_NAME");assert.equal(v.case.phase,"PRESENT_RESULTS");assert.equal(v.restaurant.bookingHandoffs?.[0]?.provider,"TABLECHECK");
    assert.ok(v.restaurant.readEvidence.some(e=>e.kind==="ENTITY_MATCH"&&e.provider==="TABLECHECK"&&e.claims.observedOutletName==="Kushi Katsu Dengana Akabane ten"&&e.entityMatch?.confidence==="HIGH"));
  }finally{await f.close();}
});

// LOCAL_CONSTRUCTION source stock/terms + actual persistent Live assembly.
// Tests the same-target semantic update's wiring, not model behavior or Live B1.
test("an unchanged named booking followup retains the current B1 without another search or stock investigation",async()=>{
 const source=JSON.parse(await readFile(new URL("../eval/restaurant/agent-loop/cases/g6-development/source.json",import.meta.url),"utf8"));
 const place={...await google(),displayName:{text:"Kushi Katsu"},websiteUri:source.tablecheck.pageUrl};
 const f=await bookingTermsComposition({provider:"TABLECHECK",namedWithoutArea:{outputText:await original(),reaffirmTargetOnSelection:true,sourceNames:{google:place}}});
 try{
  const first=await f.initial(),handoff=first.restaurant.bookingHandoffs![0]!;assert.ok(handoff);const before=f.requests.length;
  const next=await f.select();const later=f.requests.slice(before);
  assert.equal(later.some(r=>r.request.purpose==="restaurant_agent_decide"&&JSON.parse(r.response.outputText).type==="SEARCH_RESTAURANTS"),false);
  assert.equal(later.filter(r=>r.request.purpose==="browser_read_decide").length,0,"Source questions may read settled documents; inventory investigation must not restart");
  assert.equal(next.restaurant.bookingHandoffs?.[0]?.url,handoff.url);assert.equal(next.restaurant.bookingHandoffs?.[0]?.checkedAt,handoff.checkedAt);
  assert.equal(next.case.phase,"PRESENT_RESULTS");
 }finally{await f.close();}
});
