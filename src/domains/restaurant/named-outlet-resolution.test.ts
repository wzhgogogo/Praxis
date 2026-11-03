import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {namedOutletCandidateResolved,namedOutletCandidateCanInvestigate} from "./named-outlet-resolution.js";
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
