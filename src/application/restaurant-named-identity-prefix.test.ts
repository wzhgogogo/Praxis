import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {bookingTermsComposition} from "./fixtures/booking-terms-composition.js";

// Actual assembly and persistent Runtime with original D2 semantic/Google
// data. Detail pages and inventory are explicitly constructed source I/O.
for(const mode of ["ONE","NONE","TWO"] as const)test(`D2 identity-only investigation covers the first three of five possible outlets: ${mode}`,async()=>{
  const data=JSON.parse(await readFile(new URL("./fixtures/named-identity-terms/d2/input.json",import.meta.url),"utf8"));
  const f=await bookingTermsComposition({savedD2Identity:mode});
  try{
    const view=await f.initial();const a=await f.artifact();
    if(process.env.PRAXIS_NAMED_PREFIX_CAPTURE==="1")console.log("NAMED_PREFIX_RAW "+Buffer.from(JSON.stringify({label:mode,...a})).toString("base64"));
    assert.equal(view.restaurant.candidates.length,5,"Original Google response has seven places, of which five pass the unchanged possible-name filter");
    assert.deepEqual(view.restaurant.candidates.map(c=>c.restaurant.sourceIds.googlePlaces),data.candidates.map((c:{restaurant:{sourceIds:{googlePlaces:string}}})=>c.restaurant.sourceIds.googlePlaces));
    const first=view.restaurant.candidates.slice(0,3).map(c=>c.restaurant.id);
    const events=a.execution.events as Array<{event:{type:string;request?:{candidateIds:string[]};evidence?:Array<{kind:string;provider:string;candidateId:string;entityMatch?:{confidence:string}}>}}>;
    const investigations=events.filter(e=>e.event.type==="CANDIDATE_FACTS_CHECKED");
    const identities=[...new Set(investigations.flatMap(e=>e.event.evidence??[]).filter(e=>e.kind==="ENTITY_MATCH"&&["TABELOG","TABLECHECK"].includes(e.provider)&&e.entityMatch?.confidence==="HIGH").map(e=>e.candidateId))];
    assert.deepEqual(identities,first,"Three source identities must be read; neither unread candidates nor availability can stand in for that work");
    const checks=events.filter(e=>e.event.type==="AVAILABILITY_CHECKED");
    if(mode==="ONE"){
      assert.equal(view.case.phase,"PRESENT_RESULTS");assert.deepEqual(view.restaurant.presentedCandidateIds,[first[0]]);
      assert.equal(checks.length,1);assert.deepEqual(checks[0]!.event.request!.candidateIds,[first[0]]);
      assert.ok(events.indexOf(checks[0]!)>events.indexOf(investigations.at(-1)!));
    }else{
      assert.equal(view.case.phase,"NEEDS_INPUT");assert.equal(checks.length,0);
      assert.equal(view.restaurant.selectedCandidateId,undefined);assert.deepEqual(view.restaurant.bookingHandoffs,[]);
    }
    assert.equal(a.realCalls,0);
  }finally{await f.close();}
});
