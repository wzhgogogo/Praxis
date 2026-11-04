import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import type {RestaurantTaskState} from "./contracts.js";
import {namedOutletCandidateResolved,namedOutletIdentityPrefix} from "./named-outlet-resolution.js";

type State=Pick<RestaurantTaskState,"intentDraft"|"candidates"|"readEvidence">;
async function original():Promise<State>{return JSON.parse(await readFile(new URL("./fixtures/d8-resolution-20261104.json",import.meta.url),"utf8"));}
for(const mode of ["D8_ORIGINAL","UNKNOWN_GOOGLE_EQUAL","UNKNOWN_JAPANESE_EQUAL","FOREIGN_PLACE_NAME","UNKNOWN_AFTER_PREFIX_EQUAL","TWO_BOUND_EQUAL","NO_HIGH_EXACT"] as const){
  test(`D8 unique verified source name with remaining known names: ${mode}`,async()=>{
    const state=await original(),query=state.intentDraft!.target!.query,first=state.candidates[0]!.restaurant.id,third=state.candidates[2]!.restaurant;
    assert.equal(query,"Specializing in Nodoguro Ginza Nakamata");
    assert.equal(state.candidates.length,5);assert.equal(namedOutletIdentityPrefix(state).length,3);
    if(mode==="UNKNOWN_GOOGLE_EQUAL")third.outletName=query;
    if(mode==="UNKNOWN_AFTER_PREFIX_EQUAL")state.candidates[3]!.restaurant.outletName=query;
    if(mode==="UNKNOWN_JAPANESE_EQUAL"||mode==="FOREIGN_PLACE_NAME"){
      const google=structuredClone(state.readEvidence.find(e=>e.candidateId===third.id&&e.kind==="ENTITY_MATCH"&&e.provider==="GOOGLE_PLACES")!);
      google.evidenceId+="-counterfactual-ja";google.claims.outletName=query;google.claims.languageCode="ja";
      if(mode==="FOREIGN_PLACE_NAME")google.sourceEntityId="different-google-place";
      state.readEvidence.push(google);
    }
    if(mode==="TWO_BOUND_EQUAL"){
      const id=state.candidates[1]!.restaurant.id;
      state.readEvidence.find(e=>e.candidateId===id&&e.provider==="TABLECHECK"&&e.kind==="ENTITY_MATCH")!.claims.observedOutletName=query;
    }
    if(mode==="NO_HIGH_EXACT")for(const e of state.readEvidence)if(e.candidateId===first&&e.provider==="TABLECHECK"&&e.entityMatch)e.entityMatch.confidence="LOW";
    const expected=mode==="D8_ORIGINAL"||mode==="FOREIGN_PLACE_NAME";
    assert.equal(namedOutletCandidateResolved(state,first),expected);
    assert.ok(state.candidates.slice(1).every(c=>!namedOutletCandidateResolved(state,c.restaurant.id)),"No other candidate becomes a substitute");
    if(process.env.PRAXIS_D8_RESOLUTION_CAPTURE==="1")console.log("D8_RESOLUTION_RESULT "+JSON.stringify({mode,query,resolved:namedOutletCandidateResolved(state,first),expected}));
  });
}
