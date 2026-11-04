import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {namedOutletCandidateResolved,namedOutletCandidateCanInvestigate,namedOutletIdentityPrefix} from "./named-outlet-resolution.js";
import {validateRestaurantAction} from "./action-validator.js";
import type {RestaurantTaskState,RestaurantReadEvidence} from "./contracts.js";

const data=async()=>JSON.parse(await readFile(new URL("../../application/fixtures/named-identity-terms/d2/input.json",import.meta.url),"utf8"));
// Component evidence only: these explicit HIGH records test the name/scope
// predicate, never source extraction or identity acceptance.
function identity(state:RestaurantTaskState,i:number,name:string):RestaurantReadEvidence {
  return {evidenceId:"component:native:"+i,kind:"ENTITY_MATCH",provider:"TABELOG",candidateId:state.candidates[i]!.restaurant.id,
    sourceEntityId:String(13123456+i),sourceUrl:`https://tabelog.com/en/tokyo/A1301/A130101/${13123456+i}/`,observedAt:"2026-11-03T04:57:24.888Z",
    requestFingerprint:"component-only",claims:{observedOutletName:name},entityMatch:{confidence:"HIGH",matchedBy:["COMPONENT_ONLY"]}};
}
test("named prefix component waits for every prefix identity and ignores a full-name match outside its read scope",async()=>{
  const input=await data(),state=structuredClone(input.state) as RestaurantTaskState,query=state.intentDraft!.target!.query,first=state.candidates[0]!.restaurant.id;
  state.readEvidence.push(identity(state,0,query));
  assert.equal(namedOutletCandidateResolved(state,first),false,"One matching name cannot settle two unread peers");
  state.readEvidence.push(identity(state,1,"Other source branch 2"),identity(state,2,"Other source branch 3"));
  assert.equal(namedOutletCandidateResolved(state,first),true);
  state.readEvidence.push(identity(state,1,query));
  assert.equal(namedOutletCandidateResolved(state,first),false,"Two same source names remain ambiguous");
  const outside=structuredClone(input.state) as RestaurantTaskState;
  outside.readEvidence.push(...[0,1,2].map(i=>identity(outside,i,"Other source branch "+i)),identity(outside,3,query));
  assert.equal(namedOutletCandidateResolved(outside,outside.candidates[3]!.restaurant.id),false);
});
test("named prefix component permits only three identity fact reads, never an early availability action",async()=>{
  const input=await data(),state=structuredClone(input.state) as RestaurantTaskState;state.phase="SEARCHING";
  const first=state.candidates.slice(0,3).map(c=>c.restaurant.id);
  assert.deepEqual(state.candidates.filter(c=>namedOutletCandidateCanInvestigate(state,c.restaurant.id)).map(c=>c.restaurant.id),first);
  const now="2026-11-03T04:57:24.888Z";
  assert.equal(validateRestaurantAction(state,{type:"INVESTIGATE_CANDIDATE_FACTS",candidateIds:first},now).status,"ALLOWED");
  assert.equal(validateRestaurantAction(state,{type:"CHECK_AVAILABILITY",candidateIds:[first[0]!]},now).status,"REJECTED");
});

// Original D8 fields plus explicitly labelled counterfactual controls.
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
