import assert from "node:assert/strict";
import { test } from "node:test";
import type { RestaurantAvailabilityCheck, RestaurantCandidate, RestaurantEvent, RestaurantTaskState } from "../domains/restaurant/contracts.js";
import type { RecordedEventEnvelope } from "../core/task-runtime/contracts.js";
import { projectWorkspaceRead } from "./workspace-read-projection.js";

const now="2026-10-29T10:00:00.000Z";
const candidate=(id:string):RestaurantCandidate=>({restaurant:{id,outletName:id,address:"Fixture Tokyo",sourceIds:{},provenance:{outletName:"fixture",address:"fixture"}},matchReasons:[],warnings:[],executionConfidence:"HIGH"});
function state(checks:Record<string,RestaurantAvailabilityCheck>):RestaurantTaskState{return {schemaVersion:"25",phase:"NO_VERIFIED_RESULT",candidates:[candidate("a"),candidate("b")],availability:{},availabilityChecks:checks,readEvidence:[],searchRevision:1};}
const check=(outcome:"FAILED"|"UNKNOWN"|"UNAVAILABLE"|"AVAILABLE"):RestaurantAvailabilityCheck=>({status:outcome==="UNAVAILABLE"||outcome==="AVAILABLE"?outcome:"UNKNOWN",checkedAt:now,evidenceIds:[],sourceAttempts:[{source:"TABLECHECK",outcome}]});

test("Workspace source failure copy requires explicit failed attempts, never unknown, unavailable or unread candidates",()=>{
  const rows=[
    {label:"all failed",checks:{a:check("FAILED"),b:check("FAILED")},expected:"ALL_SOURCES_FAILED"},
    {label:"unknown source",checks:{a:check("FAILED"),b:check("UNKNOWN")},expected:"NO_QUALIFIED_RESULTS"},
    {label:"valid no-slot observation",checks:{a:check("UNAVAILABLE"),b:check("UNAVAILABLE")},expected:"NO_QUALIFIED_RESULTS"},
    {label:"unread candidate",checks:{a:check("FAILED")},expected:"NO_QUALIFIED_RESULTS"},
    {label:"successful check without optional attempt detail",checks:{a:check("FAILED"),b:{status:"AVAILABLE" as const,checkedAt:now,evidenceIds:[]}},expected:"NO_QUALIFIED_RESULTS"},
    {label:"unknown check without attempt detail",checks:{a:check("FAILED"),b:{status:"UNKNOWN" as const,checkedAt:now,evidenceIds:[]}},expected:"NO_QUALIFIED_RESULTS"},
  ];
  for(const row of rows)assert.equal(projectWorkspaceRead({state:state(row.checks),events:[],readyCandidateIds:[],openableCandidateIds:[],active:false,now}).readStatus.kind,row.expected,row.label);
  const partial=projectWorkspaceRead({state:state({a:check("FAILED"),b:check("AVAILABLE")}),events:[],readyCandidateIds:["b"],openableCandidateIds:["b"],active:false,now});
  assert.equal(partial.readStatus.kind,"RESULTS");assert.equal(partial.readStatus.partialSourceFailure,true);
});

test("Workspace interpretation copy uses the recorded model status, not failure prose",()=>{
  for(const status of ["MODEL_FAILURE","INVALID_MODEL_OUTPUT","INPUT_INVALID"] as const){
    const event:RecordedEventEnvelope<RestaurantEvent>={id:"semantic",taskId:"task",occurredAt:now,trace:{schemaVersion:"1",runId:"run",correlationId:"semantic",actor:"MODEL"},
      event:{type:"SEMANTIC_INTERPRETATION_FAILED",status,reason:"This text deliberately says MODEL_FAILURE for every control"}};
    const projection=projectWorkspaceRead({state:{...state({}),phase:"FAILED"},events:[event],readyCandidateIds:[],openableCandidateIds:[],active:false,now});
    assert.equal(projection.readStatus.kind,status==="MODEL_FAILURE"?"MODEL_FAILURE":"OTHER_FAILURE");
  }
});

// Unit projection contract; the browser regression below exercises real reducer retention.
const initialPatch: import("../domains/restaurant/contracts.js").RestaurantIntentPatch = {
  schemaVersion:"3",date:"2026-11-02",timeWindow:{earliest:"19:00",latest:"19:30"},partySize:2,partySizeSource:"EXPLICIT",area:{query:"Tokyo"},
};
const initialDraft: import("../domains/restaurant/contracts.js").RestaurantIntentDraft = {
  schemaVersion:"3",timezone:"Asia/Tokyo",date:"2026-11-02",timeWindow:{earliest:"19:00",latest:"19:30"},partySize:2,partySizeSource:"EXPLICIT",area:{query:"Tokyo"},criteria:[],
};
function history(events: RestaurantEvent[]):RecordedEventEnvelope<RestaurantEvent>[] {
  return events.map((event,index)=>({id:'event:'+index,taskId:'task',occurredAt:now,trace:{schemaVersion:'1',runId:'run:'+index,correlationId:'event:'+index,actor:'SYSTEM'},event}));
}
const presented=(candidateIds:string[]):RestaurantEvent=>({type:'RESULTS_PRESENTED',candidateIds,evidenceIds:[]});
const compiled=(patch:typeof initialPatch):RestaurantEvent=>({type:'SEMANTIC_PROPOSAL_COMPILED',patch});
test('Workspace first delivery after NEEDS_INPUT has no revision diff; real empty prior revision remains the baseline',()=>{
  const first=history([compiled({schemaVersion:'3',replaceCriteria:[]}),{type:'AGENT_ASKED_USER',question:'Which area?',relatedFields:['area']},compiled(initialPatch),presented(['a','b'])]);
  const input={state:{...state({}),candidates:['a','b','c','d','e'].map(candidate),phase:'PRESENT_RESULTS' as const,intentDraft:initialDraft},events:first,readyCandidateIds:['a','b'],openableCandidateIds:['a','b'],active:false,now};
  assert.equal(projectWorkspaceRead(input).revisionDiff,undefined,'no earlier delivered batch exists');
  const realEmpty=history([compiled(initialPatch),presented(['a','b']),compiled({schemaVersion:'3',partySize:3}),compiled({schemaVersion:'3',partySize:4}),presented(['c'])]);
  const later=projectWorkspaceRead({...input,state:{...input.state,intentDraft:{...initialDraft,partySize:4}},events:realEmpty,readyCandidateIds:['c'],openableCandidateIds:['c']});
  assert.deepEqual(later.revisionDiff,{fromRevision:2,toRevision:3,removed:[],added:[{candidateId:'c',outletName:'c'}]},'the immediate real empty revision is not skipped');
  const added=projectWorkspaceRead({...input,events:history([compiled(initialPatch),presented(['a','b']),compiled({schemaVersion:'3',partySize:3}),presented(['a','b','c','d','e'])]),readyCandidateIds:['a','b','c','d','e'],openableCandidateIds:['a','b','c','d','e']});
  assert.equal(added.revisionDiff?.removed.length,0);assert.equal(added.revisionDiff?.added.length,3);
});
for(const [label,patch] of Object.entries({
  area:{schemaVersion:'3',area:{query:'Tokyo'}},date:{schemaVersion:'3',date:'2026-11-02'},
  time:{schemaVersion:'3',timeWindow:{earliest:'19:00',latest:'19:30'}},
  guests:{schemaVersion:'3',partySize:2,partySizeSource:'EXPLICIT'},collection:{schemaVersion:'3',replaceCriteria:[]},
}) as Array<[string,typeof initialPatch]>) test('Workspace equivalent '+label+' patch cannot remove retained presented restaurants',()=>{
  const current={...state({}),phase:'PRESENT_RESULTS' as const,intentDraft:initialDraft,candidates:['a','b','c'].map(candidate)};
  const events=history([compiled(initialPatch),presented(['a','b','c']),compiled(patch)]);
  const projection=projectWorkspaceRead({state:current,events,readyCandidateIds:['a','b','c'],openableCandidateIds:['a','b','c'],active:false,now});
  assert.deepEqual(projection.revisionDiff?.removed??[],[],'retained cards are not removed by an equivalent nonempty patch');
  assert.equal(projection.requirementRevision,1);assert.equal(projection.revisionDiff,undefined);
});
test('Workspace reaffirmation retains the last real revision diff instead of opening an empty group',()=>{
  const events=history([compiled(initialPatch),presented(['a','b','c']),compiled({schemaVersion:'3',partySize:3}),presented(['a','c','d']),compiled({schemaVersion:'3',partySize:3})]);
  const projection=projectWorkspaceRead({state:{...state({}),phase:'PRESENT_RESULTS',intentDraft:{...initialDraft,partySize:3},candidates:['a','b','c','d'].map(candidate)},events,readyCandidateIds:['a','c','d'],openableCandidateIds:['a','c','d'],active:false,now});
  assert.deepEqual(projection.revisionDiff,{fromRevision:1,toRevision:2,removed:[{candidateId:'b',outletName:'b',reasonCode:'NO_LONGER_MATCHES'}],added:[{candidateId:'d',outletName:'d'}]});
  assert.equal(projection.requirementRevision,2);
});
test('Workspace real changed requirements with no results still remove the prior batch',()=>{
  const events=history([compiled(initialPatch),presented(['a','b','c']),compiled({schemaVersion:'3',partySize:3})]);
  const projection=projectWorkspaceRead({state:{...state({}),intentDraft:{...initialDraft,partySize:3}},events,readyCandidateIds:[],openableCandidateIds:[],active:false,now});
  assert.equal(projection.requirementRevision,2);assert.deepEqual(projection.revisionDiff?.removed.map(r=>r.candidateId),['a','b','c']);
});

test('Workspace value equality includes party provenance: same count with a new source is a real revision',()=>{
  const events=history([compiled(initialPatch),presented(['a','b','c']),compiled({schemaVersion:'3',partySize:2,partySizeSource:'INFERRED_CLOSED_PARTY'})]);
  const projection=projectWorkspaceRead({state:{...state({}),intentDraft:{...initialDraft,partySizeSource:'INFERRED_CLOSED_PARTY'}},events,readyCandidateIds:[],openableCandidateIds:[],active:false,now});
  assert.equal(projection.requirementRevision,2);assert.equal(projection.revisionDiff?.removed.length,3);
});
for(const retainLocation of [true,false])test('Workspace replays an authoritative location binding before comparing a patch: retain='+retainLocation,()=>{
  const coordinates={latitude:35.6,longitude:139.7,observedAt:now,source:'EVALUATION' as const};
  const area={query:'nearby',coordinates:{...coordinates,source:'EVALUATION' as const}};
  const patch=retainLocation?{schemaVersion:'3' as const,area}:{schemaVersion:'3' as const,area:{query:'nearby'}};
  const events=history([compiled({...initialPatch,area:{query:'nearby'}}),{type:'EVALUATION_LOCATION_BOUND',coordinates},presented(['a','b','c']),compiled(patch)]);
  const projection=projectWorkspaceRead({state:{...state({}),phase:retainLocation?'PRESENT_RESULTS':'NO_VERIFIED_RESULT',intentDraft:{...initialDraft,area:patch.area}},events,readyCandidateIds:retainLocation?['a','b','c']:[],openableCandidateIds:retainLocation?['a','b','c']:[],active:false,now});
  assert.equal(projection.requirementRevision,retainLocation?1:2);assert.deepEqual(projection.revisionDiff?.removed.map(r=>r.candidateId)??[],retainLocation?[]:['a','b','c']);
});

test('Saved uses the supplied visible candidate set even after inventory expiry',()=>{
 const current={...state({a:check('AVAILABLE'),b:check('AVAILABLE')}),phase:'PRESENT_RESULTS' as const,selectionSession:{deliveredCandidateIds:[],viewedCandidateIds:[],shortlistCandidateIds:['a','b'],feedback:[]}};
 const view=projectWorkspaceRead({state:current,events:[],readyCandidateIds:['b'],openableCandidateIds:['a'],active:false,now});
 assert.deepEqual(view.savedCandidates.map(row=>[row.candidateId,row.current]),[['a',true],['b',false]]);
});
for(const phase of ['SEARCHING','FAILED','NO_VERIFIED_RESULT'] as const)for(const cancelled of [true,false])test('Incomplete revision never invents removal: '+phase+' cancelled='+cancelled,()=>{
 const events=history([compiled(initialPatch),presented(['a','b']),{type:'SHORTLIST_UPDATED',candidateId:'a',shortlisted:true},compiled({schemaVersion:'3',partySize:3}),...(cancelled?[{type:'AGENT_LOOP_TERMINATED' as const,termination:'CANCELLED' as const,reason:'User stopped'}]:[])]);
 const current={...state({a:check('FAILED'),b:check('FAILED')}),phase,intentDraft:{...initialDraft,partySize:3},selectionSession:{deliveredCandidateIds:[],viewedCandidateIds:[],shortlistCandidateIds:['a'],feedback:[]}};
 const view=projectWorkspaceRead({state:current,events,readyCandidateIds:[],openableCandidateIds:[],active:false,now});
 assert.equal(view.revisionDiff,undefined);assert.equal(view.savedCandidates[0]?.reasonCode,undefined);
});
