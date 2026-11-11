import assert from "node:assert/strict";
import {once} from "node:events";
import type {AddressInfo} from "node:net";
import test from "node:test";
import type {RestaurantCaseView} from "./agent-workspace.js";
import {PilotSessionService} from "./persistent-restaurant-agent.js";
import {withBookingHandoffs} from "./restaurant-booking-handoff.js";
import {createLocalWebServer} from "../server/local-web-server.js";
import {bookingTermsComposition,cancellationAnswer} from "./fixtures/booking-terms-composition.js";

type Fixture=Awaited<ReturnType<typeof bookingTermsComposition>>;
async function capture(f:Fixture,label:string,detail:unknown={}) {
  const artifact=await f.artifact();
  if(process.env.PRAXIS_B1_VISIBILITY_CAPTURE==="1")console.log("B1_VISIBILITY_RAW "+Buffer.from(JSON.stringify({label,detail,...artifact})).toString("base64"));
  return artifact;
}
async function http(f:Fixture) {
  const server=createLocalWebServer({application:f.app,readAssembly:f.assembly,
    sessions:new PilotSessionService(f.app.store,[{id:"terms-user",displayName:"Fixture",accessToken:"visibility-fixture"}],f.clock)});
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const base=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const response=await fetch(base+"/api/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accessToken:"visibility-fixture"})});
  assert.equal(response.status,201);
  const cookie=response.headers.get("set-cookie")!.split(";",1)[0]!;
  return {
    async get(view:RestaurantCaseView):Promise<RestaurantCaseView>{const r=await fetch(base+`/api/cases/${view.case.caseId}`,{headers:{cookie}});assert.equal(r.status,200);return (await r.json() as {view:RestaurantCaseView}).view;},
    async depart(view:RestaurantCaseView,candidateId:string,offerId:string){
      const r=await fetch(base+`/api/cases/${view.case.caseId}/booking-departures`,{method:"POST",headers:{cookie,"content-type":"application/json"},body:JSON.stringify({candidateId,offerId,requestId:"unqualified-departure",taskVersion:view.case.taskVersion})});
      return {status:r.status,body:await r.json() as Record<string,unknown>};
    },
    async close(){const done=once(server,"close");server.close();server.closeAllConnections();await done;},
  };
}

test("B1 ordinary composition withholds a bound source handoff after HARD remains unknown and the read ends without results",async()=>{
  const f=await bookingTermsComposition({unverifiedHard:true});
  try{
    const view=await f.initial(),artifact=await capture(f,"HARD_UNKNOWN");
    assert.equal(view.case.phase,"NO_VERIFIED_RESULT");
    assert.deepEqual(view.restaurant.readyCandidateIds,[]);assert.equal(view.restaurant.presentedCandidateIds,undefined);
    assert.ok(view.restaurant.intentDraft?.criteria?.some(c=>c.text==="kushikatsu"&&c.strength==="HARD"));
    assert.equal(artifact.prepared.length,1,"The real bound vacancy-response cache remains reusable");
    const source=artifact.prepared[0]!.source;
    assert.equal(view.restaurant.availabilityChecks[source.candidateId]?.status,"AVAILABLE");
    assert.ok(JSON.stringify(f.source.vacancy.body).includes(source.url),"Only the actual source form_course URL was cached");
    assert.deepEqual(view.restaurant.bookingHandoffs,[],"An unqualified hidden outlet has no outward B1 handoff");
    assert.equal(f.requests.filter(r=>r.request.purpose==="restaurant_page_question").length,0);
  }finally{await f.close();}
});

test("B1 ordinary HTTP rejects departure for the unshown HARD-unknown outlet despite its reusable source cache",async()=>{
  const f=await bookingTermsComposition({unverifiedHard:true});let server:Awaited<ReturnType<typeof http>>|undefined;
  try{
    const view=await f.initial();server=await http(f);
    const shown=await server.get(view),prepared=f.assembly.bookingHandoffs.readPrepared(view)[0]!;
    const departure=await server.depart(shown,prepared.source.candidateId,prepared.source.offerId);
    await capture(f,"HIDDEN_HTTP",{httpView:shown,departure});
    assert.equal(view.case.phase,"NO_VERIFIED_RESULT");
    assert.equal(departure.status,400);assert.match(String(departure.body.error),/No current verified source handoff/);
    assert.equal(departure.body.url,undefined);assert.deepEqual(shown.restaurant.bookingHandoffs,[]);
    assert.equal(f.assembly.bookingHandoffs.readPrepared(view).length,1);
  }finally{await server?.close();await f.close();}
});

test("B1 ordinary composition retains SEARCHING-ready, presented and user-selected handoffs and terms from the same cache",async()=>{
  let entered!:()=>void,release!:()=>void;
  const ready=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r);
  const f=await bookingTermsComposition({beforePresent:async()=>{entered();await gate;}});
  let pending:ReturnType<Fixture["initial"]>|undefined,server:Awaited<ReturnType<typeof http>>|undefined;
  try{
    pending=f.initial();await ready;const running=await f.project();server=await http(f);
    const early=await server.get(running);await capture(f,"SEARCHING_READY",{httpView:early});
    assert.equal(early.case.phase,"SEARCHING");assert.equal(early.restaurant.presentedCandidateIds,undefined);
    const h=early.restaurant.bookingHandoffs?.[0];assert.ok(h);assert.ok(early.restaurant.readyCandidateIds.includes(h.candidateId));
    release();const presented=await pending;
    assert.equal(presented.case.phase,"PRESENT_RESULTS");assert.ok(presented.restaurant.presentedCandidateIds?.includes(h.candidateId));
    assert.equal(presented.restaurant.bookingHandoffs?.[0]?.url,h.url);await capture(f,"PRESENTED");
    const selected=await f.select();assert.equal(selected.restaurant.selectedCandidateId,h.candidateId);
    assert.deepEqual(selected.restaurant.bookingHandoffs?.[0]?.terms.map(t=>t.label),[cancellationAnswer,"Card required"]);
    assert.equal(f.requests.filter(r=>r.request.purpose==="restaurant_page_question").length,2);
    await capture(f,"SELECTED_PRESENTED");
  }finally{release();if(pending)await pending;await server?.close();await f.close();}
});

test("B1 projection boundary uses the phase-specific set and a selected ID cannot bypass it or start terms",async()=>{
  const f=await bookingTermsComposition();
  try{
    const ordinary=await f.initial(),prepared=f.assembly.bookingHandoffs.readPrepared(ordinary),id=prepared[0]!.source.candidateId;
    // Deliberately inconsistent DTOs exercise the projection boundary only;
    // the preceding whole-composition tests never inject State or evidence.
    const hidden=structuredClone(ordinary);hidden.restaurant.presentedCandidateIds=[];
    hidden.restaurant.selectedCandidateId=id;hidden.restaurant.intentDraft!.target!.selectionScope="SPECIFIC_OUTLET";
    const before=f.requests.length;
    await f.counted.run(hidden.case.rootTaskId,signal=>f.assembly.questions.readBookingTerms(hidden,new Date(f.clock.now().valueOf()+400_000).toISOString(),signal));
    const projected=withBookingHandoffs(hidden,prepared,f.clock.now().toISOString());
    const missing=structuredClone(hidden);delete missing.restaurant.presentedCandidateIds;
    const searching=structuredClone(hidden);searching.case.phase="SEARCHING";searching.restaurant.readyCandidateIds=[];searching.restaurant.presentedCandidateIds=[id];
    const stale=structuredClone(ordinary);delete stale.restaurant.intentDraft;
    const results=[projected,withBookingHandoffs(missing,prepared,f.clock.now().toISOString()),withBookingHandoffs(searching,prepared,f.clock.now().toISOString()),withBookingHandoffs(stale,prepared,f.clock.now().toISOString())];
    await capture(f,"BOUNDARY_ONLY",{inputs:[hidden,missing,searching,stale],results,modelCallsBefore:before,modelCallsAfter:f.requests.length});
    assert.equal(f.requests.length,before,"A selected but unpresented outlet must not start a G1 terms read");
    for(const view of results)assert.deepEqual(view.restaurant.bookingHandoffs,[]);
    assert.equal(f.assembly.bookingHandoffs.readPrepared(ordinary).length,1,"Projection never removes the prepared source cache");
  }finally{await f.close();}
});

test("B1 specific outlet projection refuses a different named target despite a valid shown source cache",async()=>{
  const f=await bookingTermsComposition();
  try{
    const ordinary=await f.initial(),prepared=f.assembly.bookingHandoffs.readPrepared(ordinary),id=prepared[0]!.source.candidateId;
    assert.equal(prepared.length,1);assert.ok(ordinary.restaurant.presentedCandidateIds?.includes(id));
    // Projection-only malformed DTO: real accepted cache/evidence stays unchanged.
    const other=structuredClone(ordinary);other.restaurant.intentDraft!.target={goal:"AVAILABILITY",selectionScope:"SPECIFIC_OUTLET",query:"Ito Akabane"};other.restaurant.selectedCandidateId=id;
    const before=f.requests.length;
    await f.counted.run(other.case.rootTaskId,signal=>f.assembly.questions.readBookingTerms(other,new Date(f.clock.now().valueOf()+400_000).toISOString(),signal));
    const projected=withBookingHandoffs(other,prepared,f.clock.now().toISOString());
    await capture(f,"WRONG_NAMED_TARGET",{input:other,projected,modelCallsBefore:before,modelCallsAfter:f.requests.length});
    assert.deepEqual(projected.restaurant.bookingHandoffs,[]);assert.equal(f.requests.length,before,"Terms cannot be read for a different named target");
    assert.equal(f.assembly.bookingHandoffs.readPrepared(ordinary).length,1,"Keep the same-shop valid cache");
  }finally{await f.close();}
});
