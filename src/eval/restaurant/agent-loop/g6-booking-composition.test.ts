import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runG6DevelopmentPreflight } from "./g6-development-preflight.js";

test("G6 B1 TableCheck whole read composition emits a same-shop filled-in handoff after real availability",async()=>{
  // This is a LOCAL_CONSTRUCTION, not website replay. Replace only the model
  // and source transports in the same Live read assembly/persistent application.
  // Never inject a prepared handoff, candidate, offer or accepted evidence.
  const directory=await mkdtemp(join(tmpdir(),"g6-tablecheck-composition-"));
  try{
    await runG6DevelopmentPreflight(directory,"P1",0,"TABLECHECK");
    const record=JSON.parse(await readFile(join(directory,"preflight.json"),"utf8"));
    const candidate=record.initial.restaurant.presentedCandidateIds[0];
    const handoff=record.initial.restaurant.bookingHandoffs.find((h:{candidateId:string})=>h.candidateId===candidate);
    assert.equal(handoff.provider,"TABLECHECK");
    assert.match(handoff.continueLabel,/filled in/u);
    assert.equal(handoff.verificationHint,"Check date and guests");
  }catch(error){
    // Emit the immutable real result before lifecycle cleanup on a product red.
    const raw=await readFile(join(directory,"preflight.json"),"utf8");
    if(process.env.PRAXIS_G6_COMPOSITION_CAPTURE==="1")console.log("G6_TABLECHECK_COMPOSITION_RAW "+Buffer.from(raw).toString("base64"));
    throw error;
  }finally{await rm(directory,{recursive:true,force:true});}
});
