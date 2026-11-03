import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {bookingTermsComposition} from "./fixtures/booking-terms-composition.js";

// Real assembly/Runtime/Compiler/Router/G4/G1 with original D3 semantic and
// presentation bytes. The availability preface is fixed I/O; fact pages are
// saved DOMs with exact original visible text, not current site inventory.
test("D3 saved pending fact page reaches G1 after bounded readiness and records why no unsupported booking terms are shown",async()=>{
  const f=await bookingTermsComposition({savedD3Terms:"PENDING"});
  try{
    const initial=await f.initial();assert.equal(initial.case.phase,"PRESENT_RESULTS");
    const view=await f.select();const artifact=await f.artifact();
    if(process.env.PRAXIS_SAVED_TERMS_CAPTURE==="1")console.log("SAVED_TERMS_RAW "+Buffer.from(JSON.stringify({label:"D3_PENDING",...artifact})).toString("base64"));
    assert.equal(view.case.phase,"PRESENT_RESULTS");assert.ok(view.restaurant.selectedCandidateId);
    assert.equal(view.restaurant.bookingHandoffs?.length,1,"Current bound B1 link is independent of the optional terms");
    const queries=f.requests.filter(q=>q.turn==="SELECTED"&&q.request.purpose==="restaurant_page_question");
    assert.equal(queries.length,2,"A navigation sample that is pending cannot silently prevent both G1 questions forever");
    assert.deepEqual(view.restaurant.bookingHandoffs![0]!.terms,[],"Credit-card payment acceptance does not prove a booking card requirement");
    const raw=JSON.parse(await readFile(new URL("./fixtures/named-identity-terms/page-23.json",import.meta.url),"utf8"));
    assert.equal(createHash("sha256").update(raw.text).digest("hex"),"72c6e47e94836288bd6e24a6c5d1f42598ecdda23f90725c5b80b54ab020580b");
    assert.ok(queries.every(q=>q.request.messages.some(m=>m.content.includes("Credit card accepted"))));
    const diagnostics=artifact.execution.bookingTermsDiagnostics as Array<{reason:string}>|undefined;
    assert.ok(diagnostics?.some(d=>d.reason==="NOT_STATED"),"Export records bounded omission instead of implying the source was never read");
  }finally{await f.close();}
});
