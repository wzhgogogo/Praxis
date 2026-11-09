import assert from "node:assert/strict";
import test from "node:test";
import {createHash} from "node:crypto";
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

// All actual settled/detail observations from the diagnostic, including repeated
// SPA frames, are frozen regression inputs; no unrecorded response is supplied.
test("D8 actual snapshots 5–17 retain canonical source name through the unchanged unique-outlet check",async()=>{
 const fixture=new URL("./fixtures/d8-spa-name-20261108/",import.meta.url),f=JSON.parse(await readFile(new URL("input.json",fixture),"utf8"));
 assert.equal(f.snapshots.length,13);
 for(const recorded of f.snapshots){
  const bytes=await readFile(new URL(recorded.file,fixture));assert.equal(createHash("sha256").update(bytes).digest("hex"),recorded.sha256);
  const state=structuredClone(f.state) as RestaurantTaskState,id=state.candidates[0]!.restaurant.id,identity=state.readEvidence.find(e=>e.provider==="TABLECHECK"&&e.kind==="ENTITY_MATCH"&&e.candidateId===id)!;
  const page:BrowserSnapshot={...f.page,html:bytes.toString(),text:bytes.toString().replace(/<[^>]*>/g," ")};
  const names=new ObservedOutletNames({openSession:async()=>({snapshot:async()=>page} as BrowserSession)} as BrowserRuntime);
  const result=await names.capture(async()=>{await(await names.runtime.openSession({} as Parameters<BrowserRuntime["openSession"]>[0])).snapshot();return {evidence:[identity]};});
  state.readEvidence=state.readEvidence.filter(e=>e.evidenceId!==identity.evidenceId).concat(result.evidence);
  assert.equal(namedOutletCandidateResolved(state,id),true,recorded.file);
 }
});

for(const confidence of ['HIGH','LOW'] as const)test(`source-page availability links require identity and keep only reviewed origins/public queries: ${confidence}`,async()=>{
 const {tableCheckDiscoveryPack}=await import('../restaurant-search/source-packs.js'),origin=tableCheckDiscoveryPack.documentOrigins[0]!,url=origin+'/en/current-outlet';
 const page:BrowserSnapshot={url:'https://merchant.example/about',title:'Merchant',text:'Merchant',html:`<a href="${url}">Reserve</a><a href="${url}?token=opaque">Private</a><a href="${url}?email=a@example.com">Personal</a><a href="https://unrelated.example/en/current-outlet">Other</a><div hidden><a href="${origin}/en/hidden-outlet">Hidden</a></div>`};
 const names=new ObservedOutletNames({openSession:async()=>({snapshot:async()=>page} as BrowserSession)},tableCheckDiscoveryPack.documentOrigins);
 const result=await names.capture(async()=>{await(await names.runtime.openSession({signal:new AbortController().signal})).snapshot();return {evidence:[{evidenceId:'source-page',kind:'ENTITY_MATCH' as const,provider:'RESTAURANT_WEBSITE' as const,candidateId:'merchant',sourceEntityId:'merchant-entity',sourceUrl:page.url,observedAt:'2030-01-01T00:00:00Z',requestFingerprint:'fixture',entityMatch:{confidence,matchedBy:['fixture']},claims:{}}]};});
 assert.deepEqual((result.evidence[0]!.claims as Record<string,unknown>).observedSourceLinks,confidence==='HIGH'?[url]:undefined);
});
