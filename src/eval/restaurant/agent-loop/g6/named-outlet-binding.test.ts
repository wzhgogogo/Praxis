import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { evaluateG6,type G6EvaluationInput } from "./evaluator.js";
import type { G6NamedState,G6NamedTurn } from "./named-outlet-binding.js";

test("G6 D6 captured authority binds first outlet across the party reply and rejects one wrong-presentation incident",async()=>{
  const root=resolve(".eval-artifacts/phase3b/g6-development-live/d6-turn-budgets/runs/D6");
  const expected={"evaluation.input.json":"63b3e3e40fe632b8d7e9e301b9d94d6b993654ac22b4f6d14fa168e899ecf684","evaluation.json":"6baf2a219053c109a4506c71fba248bfe1cee6882c0e925fb343321bb47a39a8","execution.result.json":"96251a4856989cce102d61d3316c03ae03bad95b7837d2a603e9f6e86f11260d","user-turns.json":"204fc2d409822a67f403b0639d2c0fe99fc09947f6eb9d49a989fab4a5562416"};
  const values:Record<string,any>={};for(const [name,sha]of Object.entries(expected)){const bytes=await readFile(root+"/"+name);assert.equal(createHash("sha256").update(bytes).digest("hex"),sha);values[name]=JSON.parse(bytes.toString());}
  const input=values["evaluation.input.json"] as G6EvaluationInput,events=values["execution.result.json"].execution.events,turns=values["user-turns.json"].turns;
  const choice=events.findIndex((e:any)=>e.event.userBookingSelection?.candidateId),party=events.findIndex((e:any,i:number)=>i>choice&&e.event.type==="SEMANTIC_PROPOSAL_COMPILED");
  const states:G6NamedState[]=turns.map((t:any):G6NamedState=>({candidates:t.view.restaurant.candidates,intentDraft:t.view.restaurant.intentDraft,readEvidence:t.view.restaurant.readEvidence}));
  const selected=events[choice].event.userBookingSelection.candidateId,original=states[0]!.candidates.find(c=>c.restaurant.id===selected)!.restaurant;
  // Original saved authoritative projection, cross-checked against accepted
  // discovery events. No reducer reimplementation or invented website response.
  const accepted=events.slice(0,choice).flatMap((e:any)=>e.event.type==="SEARCH_COMPLETED"?e.event.candidates:[]).find((c:any)=>c.restaurant.id===selected).restaurant;
  for(const field of ["id","outletName","address"] as const)assert.equal(original[field],accepted[field]);
  assert.equal(original.sourceIds.googlePlaces,accepted.sourceIds.googlePlaces);assert.equal(original.sourceIds.phone,accepted.sourceIds.phone);
  input.namedReferences={initial:null,turns:[
    {turnId:"INITIAL",userMessage:turns[0].message,before:{candidates:[]},after:states[0]!,events:events.slice(0,choice)},
    {turnId:"book-recommendation",userMessage:turns[1].message,before:states[0]!,after:states[1]!,events:events.slice(choice,party)},
    {turnId:"supply-party",userMessage:turns[2].message,before:states[1]!,after:states[2]!,events:events.slice(party)},
  ]};
  const result=evaluateG6(input);
  assert.equal(result.verdict.s0,1,"Five substituted merchants in this one presentation are one S0 incident");
  assert.equal(result.verdict.s0Status,"FAIL");assert.equal(result.verdict.stopBatch,true);
  assert.equal(result.checks.filter(c=>c.rule==="NAMED_OUTLET"&&c.status==="FAIL").length,1);
  assert.equal(result.namedOutletBinding.named?.candidateId,selected);
  assert.equal(result.namedOutletBinding.named?.googlePlaceId,"ChIJwUnGVR2TGGARNAEaZNumYhQ");
  assert.equal(result.namedOutletBinding.named?.phone,"03-3598-2992");
  input.request.named=result.namedOutletBinding.named!;
  assert.equal(evaluateG6(input).verdict.s0,1,"Serializing the final named request must not retroactively constrain the initial open recommendation");
});

test("G6 explicit reviewed user consent permits other outlets; a model-only scope change cannot release the named identity",()=>{
  // LOCAL_CONSTRUCTION. Positive source/post evidence is real-shaped, all I/O absent.
  const first={id:"first",outletName:"First restaurant",sourceIds:{googlePlaces:"first-place",phone:"03-1111-1111"},address:"First address"};
  const other={id:"other",outletName:"Other restaurant",sourceIds:{googlePlaces:"other-place",phone:"03-2222-2222"},address:"Other address"};
  const turn:G6NamedTurn={turnId:"alternatives",userMessage:"Yes, please show other restaurants instead.",before:{candidates:[{restaurant:first}],intentDraft:{target:{selectionScope:"SPECIFIC_OUTLET"}}},after:{candidates:[{restaurant:other}],intentDraft:{target:{selectionScope:"OPEN_ENDED"}}},events:[{id:"consent",trace:{actor:"USER"},event:{type:"SEMANTIC_PROPOSAL_COMPILED",patch:{target:{selectionScope:"OPEN_ENDED"}}}},{id:"present",trace:{actor:"MODEL"},event:{type:"RESULTS_PRESENTED",candidateIds:["other"]}}],alternativeConsent:{quote:"please show other restaurants instead"}};
  const input:G6EvaluationInput={runId:"local-consent",caseId:"local-consent",mode:"FIXTURE",artifactRefs:["LOCAL_CONSTRUCTION"],request:{dates:["2026-11-11"],partySize:2,time:"19:00",named:{name:first.outletName,candidateId:first.id,googlePlaceId:"first-place",phone:first.sourceIds.phone,address:first.address}},delivered:[{candidateId:"other",name:other.outletName,address:other.address,phone:other.sourceIds.phone,provider:"TABELOG",sourceEntityId:"13123456",date:"2026-11-11",time:"19:00",partySize:2}],handoffs:[],answers:[],pages:[],vacancy:[{ref:"local-post",phase:"AFTER",candidateId:"other",url:"https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=13123456&svd=20261111&svps=2&svt=1900",body:{base_date:{year:2026,month:11,day:11},members:2,selection:[{time:"19:00"}]}}],requests:[],namedReferences:{initial:{name:first.outletName,candidateId:first.id,googlePlaceId:"first-place",phone:first.sourceIds.phone,address:first.address},turns:[turn]}};
  const positive=evaluateG6(input);assert.equal(positive.verdict.s0,0);assert.equal(positive.verdict.s0Status,"PASS");assert.equal(positive.verdict.stopBatch,false);
  const noConsent=structuredClone(input);delete noConsent.namedReferences!.turns[0]!.alternativeConsent;
  assert.equal(evaluateG6(noConsent).verdict.s0,1,"Model interpretation of an open scope is not independent consent");
  const late=structuredClone(input);late.namedReferences!.turns=[
    {...turn,turnId:"wrong-before-consent",userMessage:"Book the first restaurant.",after:{...turn.after,intentDraft:{target:{selectionScope:"SPECIFIC_OUTLET"}}},events:[turn.events[1]!]},
    {...turn,turnId:"later-consent",before:turn.after,events:[turn.events[0]!]},
  ];delete late.namedReferences!.turns[0]!.alternativeConsent;
  assert.equal(evaluateG6(late).verdict.s0,1,"Later consent cannot erase an earlier wrong presentation");
  const scoped=structuredClone(input);delete scoped.namedReferences;
  scoped.request.named={name:"Observed alias",sourceIds:{TABELOG:"en/tokyo/A1301/A130101/13123456"}};
  assert.equal(evaluateG6(scoped).verdict.s0,0,"A source shop identifier is a physical identity anchor across labels");
  scoped.request.named.googlePlaceId="expected-place";scoped.delivered[0]!.googlePlaceId="different-place";
  assert.equal(evaluateG6(scoped).verdict.s0,1,"Conflicting strong identifiers cannot be rescued by a matching source id");
});
