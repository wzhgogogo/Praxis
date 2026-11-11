import assert from "node:assert/strict";
import test from "node:test";
import {bookingTermsComposition} from "./fixtures/booking-terms-composition.js";

// Actual assembly/Runtime; original exposed D2 semantic/Google inputs, constructed
// source I/O reproducing D8's HIGH exact + HIGH different + UNKNOWN pattern.
// The separate D8 component replay retains D8's original authoritative fields.
test("ordinary assembly presents the sole identity-bound exact outlet despite a different-name unknown peer",async()=>{
  const f=await bookingTermsComposition({savedD2Identity:"ONE",unknownThirdIdentity:true});
  try{
    const view=await f.initial(),a=await f.artifact(),first=view.restaurant.candidates[0]!.restaurant.id;
    assert.equal(view.restaurant.candidates.length,5);
    const snapshot=a.execution.finalSnapshot as {domainState:{readEvidence:Array<{kind:string;provider:string;candidateId:string;entityMatch?:{confidence:string}}>}};
    const events=a.execution.events as Array<{event:{type:string;request?:{candidateIds:string[]}}}>;
    const identities=snapshot.domainState.readEvidence.filter(e=>e.kind==="ENTITY_MATCH"&&["TABELOG","TABLECHECK"].includes(e.provider)&&e.entityMatch?.confidence==="HIGH");
    assert.deepEqual([...new Set(identities.map((e:any)=>e.candidateId))],view.restaurant.candidates.slice(0,2).map(c=>c.restaurant.id));
    assert.equal(view.case.phase,"PRESENT_RESULTS");
    assert.deepEqual(view.restaurant.presentedCandidateIds,[first]);
    assert.ok(events.some(e=>e.event.type==="AVAILABILITY_CHECKED"&&e.event.request?.candidateIds.length===1&&e.event.request.candidateIds[0]===first));
    assert.equal(a.realCalls,0);
  }finally{await f.close();}
});
