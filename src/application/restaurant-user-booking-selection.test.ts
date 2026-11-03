import assert from "node:assert/strict";
import test from "node:test";
import {readFile} from "node:fs/promises";
import type {RecordedEventEnvelope} from "../core/task-runtime/contracts.js";
import type {RestaurantEvent,RestaurantTaskState} from "../domains/restaurant/contracts.js";
import type {RestaurantAgentTrajectoryStep} from "../infrastructure/postgres/restaurant-agent-trajectory-store.js";
import type {ModelResponse} from "../core/model/contracts.js";
import {bookingTermsComposition,cancellationAnswer} from "./fixtures/booking-terms-composition.js";

type Execution={events:RecordedEventEnvelope<RestaurantEvent>[];trajectories:RestaurantAgentTrajectoryStep[];finalSnapshot:{domainState:RestaurantTaskState}};
const execution=(a:{execution:unknown})=>a.execution as Execution;
type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
async function replay(id:"P1-0-8"|"P2-0-10"):Promise<ModelResponse>{
  const raw=JSON.parse(await readFile(new URL("./fixtures/user-booking-selection/"+id+".json",import.meta.url),"utf8"));
  assert.equal(JSON.parse(raw.response.outputText).type,"PRESENT_RESULTS");
  return raw.response;
}
async function capture(f:Fixture,label:string){
  const artifact=await f.artifact();
  if(process.env.PRAXIS_USER_SELECTION_CAPTURE==="1")console.log("USER_SELECTION_RAW "+Buffer.from(JSON.stringify({label,...artifact})).toString("base64"));
  return artifact;
}
function noBooking(artifact:Awaited<ReturnType<Fixture["artifact"]>>){
  const events=execution(artifact).events;
  assert.ok(!events.some(e=>e.event.type==="BOOKING_PROPOSED"||e.event.type==="AUTHORIZE"||e.event.type==="COMMIT_SUCCEEDED"));
  assert.ok(artifact.sourceCalls.every(c=>!/(?:form_course|yoyaku|payment|confirm|checkout|account)/.test(new URL(c.url).pathname)));
}
async function bounded(p:Promise<void>){let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([p,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("Source prefix was not reached")),5000);})]);}finally{if(timer)clearTimeout(timer);}}

test("User booking wording records a choice when A's real P1-0-8 only presents the outlet",async()=>{
  const response=await replay("P1-0-8"),f=await bookingTermsComposition({selectionReplay:{response}});
  try{
    const initial=await f.initial();assert.equal(initial.restaurant.selectedCandidateId,undefined);
    const view=await f.select(),handoff=view.restaurant.bookingHandoffs?.[0];assert.ok(handoff,"B1 link exists even on the original failing path");
    assert.ok(f.requests.some(r=>r.turn==="SELECTED"&&r.response.outputText===response.outputText),"Replay the original PRESENT_RESULTS bytes unchanged");
    const artifact=await capture(f,"P1-0-8");noBooking(artifact);
    assert.equal(view.restaurant.selectedCandidateId,handoff.candidateId,"Accepted user booking request must record the uniquely matched outlet without an Agent selection");
    assert.deepEqual(handoff.terms.map(t=>t.label),[cancellationAnswer,"Card required"]);
    assert.equal(f.requests.filter(r=>r.turn==="SELECTED"&&r.request.purpose==="restaurant_page_question").length,2,"Same two optional G1 questions; choice adds no model call");
    const selected=execution(artifact).events.filter(e=>e.event.type==="CANDIDATE_SELECTED");
    assert.equal(selected.length,1);assert.equal(selected[0]!.trace.actor,"USER");
    const trajectory=execution(artifact).trajectories.find(t=>t.observation?.type==="CANDIDATE_SELECTED"&&t.observation.detail.includes("USER_MESSAGE"));
    assert.ok(trajectory);assert.equal(trajectory.agentAction,undefined);assert.equal(trajectory.modelAttempt,undefined);
    assert.ok(!JSON.stringify(execution(artifact).finalSnapshot.domainState).includes("goalBasis"));
  }finally{await f.close();}
});

test("P2 user choice survives the party-only supplement; A's real P2-0-10 does not select or bypass availability",async()=>{
  let seen!:()=>void,release!:()=>void;const reached=new Promise<void>(r=>seen=r),gate=new Promise<void>(r=>release=r);
  const response=await replay("P2-0-10"),f=await bookingTermsComposition({selectionReplay:{response,path:"P2",beforeAvailability:async()=>{seen();await gate;}}});
  let pending:Promise<unknown>|undefined;
  try{
    const initial=await f.initial();assert.equal(initial.restaurant.intentDraft?.target?.goal,"RECOMMENDATION");
    const missing=await f.select();assert.equal(missing.case.phase,"NEEDS_INPUT");assert.equal(missing.restaurant.intentDraft?.partySize,undefined);assert.equal(missing.restaurant.bookingHandoffs?.length??0,0);
    pending=f.party();await bounded(reached);
    const unchecked=await f.project();assert.equal(unchecked.restaurant.bookingHandoffs?.length??0,0,"No link or terms before the current availability read");
    assert.equal(f.requests.filter(r=>r.request.purpose==="restaurant_page_question").length,0);
    release();await pending;
    const view=await f.project(),handoff=view.restaurant.bookingHandoffs?.[0];assert.ok(handoff);
    assert.ok(f.requests.some(r=>r.turn==="ADD_PARTY"&&r.response.outputText===response.outputText));
    const artifact=await capture(f,"P2-0-10");noBooking(artifact);
    assert.equal(view.restaurant.selectedCandidateId,handoff.candidateId,"Original accepted user choice is honored after the party reply and fresh identity resolution");
    assert.deepEqual(handoff.terms.map(t=>t.label),[cancellationAnswer,"Card required"]);
    assert.equal(f.requests.filter(r=>r.turn==="ADD_PARTY"&&r.request.purpose==="restaurant_page_question").length,2);
  }finally{release();if(pending)await pending;await f.close();}
});

for(const control of ["OPEN_ENDED","NON_BOOKING","AMBIGUOUS","PARTIAL"] as const)test(`User choice fails closed for ${control}`,async()=>{
  const response=await replay("P1-0-8");
  const f=await bookingTermsComposition({selectionReplay:{response,
    ...(control==="OPEN_ENDED"?{scope:"OPEN_ENDED"}:{}),...(control==="NON_BOOKING"?{basis:"JUDGMENT"}:{}),
    ...(control==="AMBIGUOUS"?{ambiguous:true}:{}),...(control==="PARTIAL"?{query:"G6"}:{})}});
  try{await f.initial();const view=await f.select();const artifact=await capture(f,control);noBooking(artifact);
    if(control==="AMBIGUOUS")assert.equal(execution(artifact).finalSnapshot.domainState.candidates.length,2,"Both same-name outlets actually reach the real resolver");
    assert.equal(view.restaurant.selectedCandidateId,undefined);
    if(control==="AMBIGUOUS"||control==="PARTIAL")assert.deepEqual(view.restaurant.bookingHandoffs,[],"Unresolved named outlets cannot project a ready handoff");
    else {assert.ok(view.restaurant.bookingHandoffs?.length,"The independent qualified handoff remains");assert.deepEqual(view.restaurant.bookingHandoffs![0]!.terms,[]);}
    assert.equal(f.requests.filter(r=>r.request.purpose==="restaurant_page_question").length,0);
  }finally{await f.close();}
});

test("An explicit G1 question and a Book-on departure do not create a user choice",async()=>{
  const f=await bookingTermsComposition({selectionReplay:{response:await replay("P1-0-8")}});
  try{const initial=await f.initial();const h=initial.restaurant.bookingHandoffs![0]!;
    await f.app.recordBookingDeparture({userId:"terms-user",caseId:initial.case.caseId,expectedVersion:initial.case.taskVersion,requestId:"departure-control",handoff:h});
    assert.equal((await f.project()).restaurant.selectedCandidateId,undefined);
    const question=await f.question();assert.equal(question.restaurant.pageQuestion?.result?.status,"ANSWERED");assert.equal(question.restaurant.selectedCandidateId,undefined);
    const artifact=await capture(f,"QUESTION_AND_DEPARTURE");noBooking(artifact);assert.equal(execution(artifact).events.filter(e=>e.event.type==="CANDIDATE_SELECTED").length,0);
  }finally{await f.close();}
});

test("A newly resolved named outlet is selected only through the current identity evidence",async()=>{
  const f=await bookingTermsComposition({selectionReplay:{response:await replay("P1-0-8"),path:"NAMED"}});
  try{const view=await f.initial(),h=view.restaurant.bookingHandoffs?.[0];assert.ok(h);
    const artifact=await capture(f,"NAMED");noBooking(artifact);
    assert.equal(view.restaurant.selectedCandidateId,h.candidateId);assert.equal(h.terms.length,2);
  }finally{await f.close();}
});

test("An Agent repeating the same user choice remains effective and idempotent",async()=>{
  const f=await bookingTermsComposition({selectionReplay:{response:await replay("P1-0-8"),duplicateAgentChoice:true}});
  try{await f.initial();const view=await f.select();const artifact=await capture(f,"DUPLICATE_AGENT_CHOICE");noBooking(artifact);
    assert.ok(view.restaurant.selectedCandidateId);assert.equal(view.restaurant.bookingHandoffs![0]!.terms.length,2);
    const user=execution(artifact).events.filter(e=>e.event.type==="CANDIDATE_SELECTED"&&e.trace.actor==="USER");assert.equal(user.length,1);
    const action=execution(artifact).trajectories.find(t=>t.agentAction?.type==="SELECT_CANDIDATE");assert.ok(action);assert.equal(action.stepOutcome,"EXECUTED");
    assert.equal(action.stateVersionBefore,action.stateVersionAfter,"Same candidate/offer repeat dispatches no duplicate State event");
  }finally{await f.close();}
});
