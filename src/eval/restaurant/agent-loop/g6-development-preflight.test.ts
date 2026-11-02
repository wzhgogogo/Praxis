import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runG6DevelopmentPreflight } from "./g6-development-preflight.js";
import { checkG6Development, type G6DevelopmentOracle, type G6DevelopmentRecord } from "./g6-development-checks.js";

for(const [path,variant,redCode] of [["P1",0,"WRONG_SELECTION"],["P1",1,"WRONG_SELECTION"],["P1",2,"WRONG_SELECTION"],["P2",0,"PREMATURE_HANDOFF"],["P3",0,"INVENTED_DATE"],["P4",0,"UNSUPPORTED_G1_CITATION"]] as const)
test(`G6 full read composition ${path} variant${variant}: real State transitions and controlled bad-output rejection`,async()=>{
  const directory=await mkdtemp(join(tmpdir(),"g6-composition-"));
  try{
    await runG6DevelopmentPreflight(directory,path,variant);
    const record=JSON.parse(await readFile(join(directory,"preflight.json"),"utf8")) as G6DevelopmentRecord;
    const oracle=JSON.parse(await readFile(new URL("./cases/g6-development/source.json",import.meta.url),"utf8")) as G6DevelopmentOracle;
    const good=checkG6Development(record,oracle);assert.deepEqual(good,{passed:true,findings:[]});
    // Local constructed counterexample only. Never mutate Runtime, original
    // source, or historical results to make a production behavior pass.
    const bad=structuredClone(record);
    if(path==="P1")bad.after.restaurant.selectedCandidateId="another-outlet";
    if(path==="P2"){
      const handoffs=bad.after.restaurant.bookingHandoffs;
      assert.ok(handoffs?.length,"Normal P2 must supply actual handoffs before constructing its premature-output counterexample");
      bad.missingParty!.restaurant.bookingHandoffs=structuredClone(handoffs);
    }
    if(path==="P3")bad.initial.restaurant.intentDraft!.date="2026-11-12";
    if(path==="P4"){
      const answer=bad.after.restaurant.pageQuestion!.result;assert.ok(answer?.status==="ANSWERED");
      answer.citations[0]!.text="A private room is guaranteed for every party.";
    }
    const red=checkG6Development(bad,oracle);assert.equal(red.passed,false);assert.ok(red.findings.some(f=>f.code===redCode));
  }finally{await rm(directory,{recursive:true,force:true});}
});
