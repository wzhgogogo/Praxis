import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { RestaurantCaseView } from "../../../application/agent-workspace.js";
import { runG6DevelopmentPreflight, type G6QuestionFixture } from "./g6-development-preflight.js";

test("G6 B1 ordinary composition carries its admitted G1 cancellation quote onto the same-channel handoff",async()=>{
  // LOCAL_CONSTRUCTION: only external source/model I/O and the user's question
  // change. Keep the actual Live factory, question acquisition/verification,
  // persistent Runtime and both source-link creation/display checks. Never
  // inject BookingHandoffTerms, pages, prepared links or accepted evidence.
  const fixture=JSON.parse(await readFile(new URL("./cases/g6-development/cancellation-question.json",import.meta.url),"utf8")) as G6QuestionFixture;
  const directory=await mkdtemp(join(tmpdir(),"g6-b1-terms-composition-"));
  try{
    await runG6DevelopmentPreflight(directory,"P4",0,"TABELOG",fixture);
    const record=JSON.parse(await readFile(join(directory,"preflight.json"),"utf8")) as {after:RestaurantCaseView;requests:Array<{request:{purpose:string}}>};
    const view=record.after,answer=view.restaurant.pageQuestion?.result;
    assert.equal(answer?.status,"ANSWERED","Actual G1 acquisition and admitted answer must precede the B1 assertion");
    assert.ok(answer?.status==="ANSWERED");
    assert.equal(record.requests.filter(r=>r.request.purpose==="restaurant_page_question").length,1);
    assert.equal(answer.answer,fixture.answer);
    assert.equal(answer.citations[0]?.text,fixture.merchantQuote);
    const handoff=view.restaurant.bookingHandoffs?.find(h=>h.candidateId===answer.candidateId);
    assert.ok(handoff,"Ordinary source-to-handoff positive must still exist");
    assert.equal(handoff.provider,"TABELOG");
    assert.ok(handoff.terms.some(term=>term.label===fixture.answer
      && term.citations.some(c=>c.text===fixture.merchantQuote
        && c.url===answer.citations[0]!.url&&c.readAt===answer.citations[0]!.readAt
        && c.identityEvidenceId===answer.citations[0]!.identityEvidenceId)),
    "B1 must carry the already admitted same-outlet same-channel G1 cancellation answer and source quote");
  }catch(error){
    const raw=await readFile(join(directory,"preflight.json"),"utf8");
    if(process.env.PRAXIS_G6_COMPOSITION_CAPTURE==="1")console.log("G6_TERMS_COMPOSITION_RAW "+Buffer.from(raw).toString("base64"));
    throw error;
  }finally{await rm(directory,{recursive:true,force:true});}
});
