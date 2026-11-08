import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import {ObservedOutletNames} from "./observed-outlet-names.js";
import type {BrowserRuntime,BrowserSession,BrowserSnapshot} from "../../infrastructure/browser/browser-runtime.js";
import type {RestaurantTaskState} from "../../domains/restaurant/contracts.js";
import {parseTableCheckOutletIdentityWithEvidence} from "../tablecheck/tablecheck-page-parser.js";
import {inspectTableCheckEntity} from "../tablecheck/tablecheck-entity-resolver.js";
import {namedOutletCandidateResolved} from "../../domains/restaurant/named-outlet-resolution.js";

// Actual retained DOM + Google candidates/native verdict. This component runtime
// only returns the saved page; no inventory or complete Replay claim.
for(const mode of ["BOUND","OTHER_URL","OTHER_ENTITY","OTHER_PAGE","LOW","MISSING_NAME","SUFFIX"] as const)test(`D8 recorded SPA name reaches unchanged unique-outlet predicate: ${mode}`,async()=>{
 const f=JSON.parse(await readFile(new URL("./fixtures/d8-spa-name-20261108/input.json",import.meta.url),"utf8")),state=f.state as RestaurantTaskState;
 const id=state.candidates[0]!.restaurant.id,original=state.readEvidence.find(e=>e.candidateId===id&&e.kind==="ENTITY_MATCH"&&e.provider==="TABLECHECK")!;
 let html=await readFile(new URL("./fixtures/d8-spa-name-20261108/snapshot-0006.html",import.meta.url),"utf8");
 if(mode==="MISSING_NAME")html="<main>No outlet identity is supplied</main>";
 if(mode==="SUFFIX")html=html.replaceAll(state.intentDraft!.target!.query,state.intentDraft!.target!.query+" Hanare");
 const page:BrowserSnapshot={...f.page,html,text:html.replace(/<[^>]*>/g," ")};
 if(mode==="OTHER_PAGE")page.url="https://www.tablecheck.com/en/other-outlet";
 const evidence=structuredClone(original);
 if(mode==="OTHER_URL")evidence.sourceUrl="https://www.tablecheck.com/en/other-outlet";
 if(mode==="OTHER_ENTITY")evidence.sourceEntityId="other-outlet";
 if(mode==="LOW")evidence.entityMatch!.confidence="LOW";
 if(mode==="BOUND"){
  const parsed=parseTableCheckOutletIdentityWithEvidence(page,page.url)!;
  assert.equal(inspectTableCheckEntity(state.candidates[0]!,parsed.outlet).resolution.confidence,"HIGH");
  assert.equal(parsed.outlet.outletName,state.intentDraft!.target!.query);
  assert.equal(namedOutletCandidateResolved(state,id),false,"original Live evidence lacked observed source name");
 }
 const names=new ObservedOutletNames({openSession:async()=>({snapshot:async()=>page} as BrowserSession)} as BrowserRuntime);
 const result=await names.capture(async()=>{await(await names.runtime.openSession({} as Parameters<BrowserRuntime["openSession"]>[0])).snapshot();return {evidence:[evidence]};});
 state.readEvidence=state.readEvidence.filter(e=>e.evidenceId!==original.evidenceId).concat(result.evidence);
 assert.equal(namedOutletCandidateResolved(state,id),mode==="BOUND");
 if(mode==="BOUND")assert.equal(result.evidence[0]!.claims.observedOutletName,state.intentDraft!.target!.query);
 else if(mode!=="SUFFIX")assert.equal(result.evidence[0]!.claims.observedOutletName,undefined);
});
