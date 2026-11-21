import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { StaleTaskVersionError } from "./persistent-restaurant-agent.js";
import { startWorkspaceFixture } from "../harness/workspace-fixture-server.js";

type Host=Awaited<ReturnType<typeof startWorkspaceFixture>>;
const userId="workspace-user";
async function create(host:Host){
  await host.application.store.upsertUser({id:userId,displayName:"Fixture"},host.clock.now().toISOString());
  return host.application.createCase(userId,"Dinner for two in Tokyo","preparation-initial");
}
async function settled(host:Host,caseId:string){
  const until=Date.now()+10_000;
  while(Date.now()<until){const v=await host.application.getCase(userId,caseId);if(!v.restaurant.progress.active)return v;await delay(10);}
  throw new Error("Fixture read did not finish in 10 seconds");
}
function latch(){let release!:()=>void;const promise=new Promise<void>(r=>release=r);return{promise,release};}

test("stale same-Case refresh, batch and location requests never cancel an active read",{timeout:20_000},async()=>{
  const host=await startWorkspaceFixture({staged:true});
  try{
    const initial=await create(host);await host.waitForCheck();
    const v=await host.application.getCase(userId,initial.case.caseId);
    assert.equal(v.restaurant.progress.active,true);assert.ok(host.providerCalls.length);
    const input={userId,caseId:v.case.caseId,expectedVersion:v.case.taskVersion-1,requestId:"stale"};
    await assert.rejects(host.application.refreshAvailability({...input,requestId:"stale-refresh"}),StaleTaskVersionError);
    await assert.rejects(host.application.requestAnotherBatch({...input,requestId:"stale-batch"}),StaleTaskVersionError);
    await assert.rejects(host.application.recordLocation({...input,requestId:"stale-location",latitude:35.6,longitude:139.7}),StaleTaskVersionError);
    assert.equal(host.providerCalls.at(-1)?.aborted,false);
    assert.equal((await host.application.getCase(userId,v.case.caseId)).restaurant.progress.active,true);
    host.release();assert.equal((await settled(host,v.case.caseId)).case.phase,"PRESENT_RESULTS");
  }finally{host.release();await host.close();}
});

for(const kind of ["refresh","batch","location"] as const)test(`preparing ${kind}: concurrent getCase cannot fail the persisted preparation gap before read registration`,{timeout:25_000},async()=>{
  const host=await startWorkspaceFixture(),entered=latch(),release=latch();
  const append=host.application.store.appendMessage.bind(host.application.store);
  let pending:Promise<unknown>|undefined;
  try{
    const created=await create(host);let v=await settled(host,created.case.caseId);assert.equal(v.case.phase,"PRESENT_RESULTS");
    if(kind==="location"){
      await host.application.submitMessage({userId,conversationId:v.case.conversationId,expectedVersion:v.case.taskVersion,requestId:"nearby",message:"Change Tokyo to nearby"});
      v=await settled(host,v.case.caseId);assert.equal(v.restaurant.intentDraft?.area?.query,"nearby");
    }
    host.application.store.appendMessage=async input=>{if(input.requestId===`user:preparing-${kind}`){entered.release();await release.promise;}return append(input);};
    const input={userId,caseId:v.case.caseId,requestId:`preparing-${kind}`,expectedVersion:v.case.taskVersion};
    pending=kind==="refresh"?host.application.refreshAvailability(input):kind==="batch"?host.application.requestAnotherBatch(input):host.application.recordLocation({...input,latitude:35.6,longitude:139.7});
    await Promise.race([entered.promise,pending.then(()=>{throw new Error("Did not enter persisted preparation gap");})]);
    const during=await host.application.getCase(userId,v.case.caseId);
    assert.equal(during.case.phase,kind==="location"?"UNDERSTANDING":"SEARCHING");assert.equal(during.restaurant.progress.active,true,"preparation is an active read lifecycle");
    assert.notEqual(during.restaurant.readStatus.kind,"OTHER_FAILURE");
    release.release();await pending;const after=await settled(host,v.case.caseId);assert.notEqual(after.case.phase,"FAILED");
    const artifact=await host.application.exportReadArtifact(v.case.caseId);assert.doesNotMatch(JSON.stringify(artifact),/process interrupted|process was interrupted/i);
  }finally{release.release();await pending?.catch(()=>{});host.application.store.appendMessage=append;await host.close();}
});

for (const kind of ["refresh","location"] as const) test(`old HTTP ${kind} cannot write or abort the replacement read at the cancellation boundary`,{timeout:20_000},async()=>{
  const host = await startWorkspaceFixture();
  const parked = latch(), release = latch();
  let old: Promise<Response> | undefined;
  try {
    const created = await create(host);
    let view = await settled(host,created.case.caseId);
    if (kind === "location") {
      await host.application.submitMessage({
        userId, conversationId:view.case.conversationId, expectedVersion:view.case.taskVersion,
        requestId:"nearby", message:"Change Tokyo to nearby",
      });
      view = await settled(host,created.case.caseId);
      assert.equal(view.restaurant.intentDraft?.area?.query,"nearby");
    } else {
      assert.equal(view.case.phase,"PRESENT_RESULTS");
    }
    const session = await fetch(host.baseUrl+"/api/session",{
      method:"POST", headers:{"content-type":"application/json"},body:JSON.stringify({accessToken:"workspace-fixture"}),
    });
    assert.equal(session.status,201);
    const cookie = session.headers.get("set-cookie")!.split(";")[0]!;
    const application = host.application as unknown as {
      cancelActiveRead(record:unknown, prior:unknown, reason:string):Promise<boolean>;
    };
    const cancel = application.cancelActiveRead.bind(application);
    application.cancelActiveRead = async (...args) => {
      application.cancelActiveRead = cancel;
      // Exercise replacement on both sides of the await that can yield to a newer request.
      if (kind === "location") {
        const replaced = await cancel(...args);
        parked.release();
        await release.promise;
        return replaced;
      }
      parked.release();
      await release.promise;
      return cancel(...args);
    };
    const input = {userId,caseId:view.case.caseId,expectedVersion:view.case.taskVersion};
    const before = await host.application.exportReadArtifact(view.case.caseId);
    old = fetch(host.baseUrl+`/api/cases/${encodeURIComponent(view.case.caseId)}/${kind}`,{
      method:"POST", headers:{cookie,"content-type":"application/json"},
      body:JSON.stringify({requestId:"old",taskVersion:view.case.taskVersion,...(kind==="location"?{latitude:35.1,longitude:139.1}:{})}),
    });
    await Promise.race([parked.promise,old.then(response=>{throw new Error(`Old request returned before parking: ${response.status}`);})]);
    host.hold();
    if (kind === "location") {
      await host.application.recordLocation({...input,requestId:"new",latitude:35.6,longitude:139.7});
    } else {
      await host.application.submitMessage({
        userId,conversationId:view.case.conversationId,expectedVersion:view.case.taskVersion,requestId:"new",message:"Make it three guests",
      });
    }
    await host.waitForCheck();
    const replacement = host.providerCalls.at(-1)!;
    assert.equal(replacement.completed,false);
    release.release();
    const response = await old;
    assert.equal(response.status,409,JSON.stringify(await response.json()));
    assert.equal(replacement.aborted,false);
    assert.equal((await host.application.getCase(userId,view.case.caseId)).restaurant.progress.active,true);
    type EventWithActor = {trace:{actor:string},event:{type:string}};
    const after = await host.application.exportReadArtifact(view.case.caseId);
    const delta = (after.events as EventWithActor[]).slice((before.events as EventWithActor[]).length);
    assert.deepEqual(delta.filter(event=>event.trace.actor==="USER").map(event=>event.event.type),["SEMANTIC_PROPOSAL_COMPILED"]);
    host.release();
    const settledView = await settled(host,view.case.caseId);
    assert.equal(settledView.case.phase,"PRESENT_RESULTS");
    if (kind === "location") assert.equal(settledView.restaurant.intentDraft?.area?.coordinates?.latitude,35.6);
    else assert.equal(settledView.restaurant.intentDraft?.partySize,3);
  } finally {
    release.release();
    host.release();
    await old?.catch(()=>{});
    await host.close();
  }
});

test("cached another-batch skips the cross-source copy of a delivered restaurant and preserves original-batch refresh",{timeout:20_000},async()=>{
  const host=await startWorkspaceFixture({cachedCrossSourceDuplicate:true});
  try{
    const initial=await create(host);
    let view=await settled(host,initial.case.caseId);
    assert.equal(view.case.phase,"PRESENT_RESULTS");
    const first=view.restaurant.presentedCandidateIds;
    assert.equal(first?.length,3);
    assert.ok(view.restaurant.readyCandidateIds.includes("fixture-cache-alias"));
    assert.equal(view.restaurant.readyCandidateIds.length,7);

    const originalReadCount=host.providerCalls.length;
    const scope={userId,caseId:view.case.caseId,expectedVersion:view.case.taskVersion,requestId:"refresh-first"};
    await host.application.refreshAvailability(scope);
    view=await settled(host,view.case.caseId);
    assert.deepEqual(view.restaurant.presentedCandidateIds,first);
    assert.deepEqual(host.providerCalls.slice(originalReadCount).map(call=>call.candidateId),first);

    const readsAfterRefresh=host.providerCalls.length;
    view=await host.application.requestAnotherBatch({...scope,expectedVersion:view.case.taskVersion,requestId:"cached-next"});
    assert.equal(view.case.phase,"PRESENT_RESULTS");
    assert.deepEqual(view.restaurant.presentedCandidateIds,["fixture-cache-0","fixture-cache-1","fixture-cache-2"]);
    assert.equal(host.providerCalls.length,readsAfterRefresh);
    assert.equal(host.searches.length,1);
  }finally{await host.close();}
});

test("Exhausted third batch cannot project the six delivered outlets or their cross-source alias", { timeout: 20_000 }, async () => {
  const host = await startWorkspaceFixture({ cachedCrossSourceDuplicate: { newCandidates: 3 } });
  try {
    const created = await create(host);
    const first = await settled(host, created.case.caseId);
    const scope = { userId, caseId: created.case.caseId };
    assert.equal(first.restaurant.presentedCandidateIds?.length, 3);
    assert.equal(first.restaurant.readyCandidateIds.length, 7);
    const savedId = first.restaurant.presentedCandidateIds![0]!;
    const saved = await host.application.setShortlist({ ...scope, expectedVersion: first.case.taskVersion,
      requestId: "save-in-first", candidateId: savedId, shortlisted: true });
    const second = await host.application.requestAnotherBatch({ ...scope, expectedVersion: saved.case.taskVersion, requestId: "second" });
    assert.deepEqual(second.restaurant.presentedCandidateIds, ["fixture-cache-0", "fixture-cache-1", "fixture-cache-2"]);
    await host.application.requestAnotherBatch({ ...scope, expectedVersion: second.case.taskVersion, requestId: "third" });
    const exhausted = await settled(host, scope.caseId);
    assert.equal(exhausted.case.phase, "NO_VERIFIED_RESULT");
    assert.equal(exhausted.restaurant.readStatus.kind, "NO_QUALIFIED_RESULTS");
    assert.deepEqual(exhausted.restaurant.readyCandidateIds, []);
    assert.equal(exhausted.restaurant.presentedCandidateIds, undefined);
    assert.equal(exhausted.restaurant.conditionStates, undefined);
    assert.deepEqual(exhausted.restaurant.bookingHandoffs ?? [], []);
    assert.deepEqual(exhausted.restaurant.savedCandidates, [{ candidateId: savedId, outletName: "Fixture Sushi", current: false }]);
    assert.equal(host.searches.length, 1);
    assert.equal(host.providerCalls.length, 7);
    const artifact = await host.application.exportReadArtifact(scope.caseId);
    const events = artifact.events as Array<{ event: { type: string } }>;
    assert.equal(events.at(-1)?.event.type, "READ_ENDED_NO_VERIFIED_RESULT");
  } finally { await host.close(); }
});

test("Searching and stopped next batch keep new verified outlets while excluding delivered outlets and their alias", { timeout: 20_000 }, async () => {
  const pool: { newCandidates: number; beforeDecision?: () => Promise<void> } = { newCandidates: 2 };
  const host = await startWorkspaceFixture({ cachedCrossSourceDuplicate: pool });
  const entered = latch(), release = latch();
  try {
    const created = await create(host);
    const first = await settled(host, created.case.caseId);
    assert.equal(first.restaurant.presentedCandidateIds?.length, 3);
    assert.ok(first.restaurant.readyCandidateIds.includes("fixture-cache-alias"));
    pool.beforeDecision = async () => { entered.release(); await release.promise; };
    await host.application.requestAnotherBatch({ userId, caseId: first.case.caseId, expectedVersion: first.case.taskVersion, requestId: "next-for-stop" });
    await entered.promise;
    const during = await host.application.getCase(userId, first.case.caseId);
    assert.equal(during.case.phase, "SEARCHING");
    assert.equal(during.restaurant.progress.active, true);
    assert.deepEqual(during.restaurant.readyCandidateIds, ["fixture-cache-0", "fixture-cache-1"]);
    const stopped = await host.application.cancelCase(userId, first.case.caseId, {readRunId:during.restaurant.sourceReadContext!.runId,expectedVersion:during.case.taskVersion});
    assert.equal(stopped.case.phase, "FAILED");
    assert.equal(stopped.restaurant.progress.stopped, true);
    assert.deepEqual(stopped.restaurant.readyCandidateIds, during.restaurant.readyCandidateIds);
  } finally { release.release(); await host.close(); }
});

test("Round15 Stop during preparation cancels before any new source call",async()=>{
 const host=await startWorkspaceFixture(),entered=latch(),release=latch();
 const append=host.application.store.appendMessage.bind(host.application.store);
 let pending:Promise<unknown>|undefined;
 try{
  const first=await create(host),view=await settled(host,first.case.caseId),calls=host.providerCalls.length;
  host.application.store.appendMessage=async input=>{if(input.requestId==="user:stop-preparing"){entered.release();await release.promise;}return append(input);};
  pending=host.application.refreshAvailability({userId,caseId:view.case.caseId,expectedVersion:view.case.taskVersion,requestId:"stop-preparing"});
  await entered.promise;
  const current=await host.application.getCase(userId,view.case.caseId);
  const stopped=await host.application.cancelCase(userId,view.case.caseId,{readRunId:current.restaurant.sourceReadContext!.runId,expectedVersion:current.case.taskVersion});
  assert.equal(stopped.restaurant.progress.stopped,true);
  release.release();await pending;
  assert.equal(host.providerCalls.length,calls);
  assert.equal((await settled(host,view.case.caseId)).restaurant.progress.stopped,true);
 }finally{release.release();await pending;await host.close();}
});

test("Round15 Stop keeps CANCELLED after a concurrent shortlist advances the version",async()=>{
 const host=await startWorkspaceFixture({staged:true});
 try{
  const first=await create(host);await host.waitForCheck();
  const view=await host.application.getCase(userId,first.case.caseId);
  await host.application.setShortlist({userId,caseId:view.case.caseId,candidateId:view.restaurant.candidates[0]!.restaurant.id,shortlisted:true,expectedVersion:view.case.taskVersion,requestId:"save-before-stop"});
  const stopped=await host.application.cancelCase(userId,view.case.caseId,{readRunId:view.restaurant.sourceReadContext!.runId,expectedVersion:view.case.taskVersion});
  assert.equal(stopped.restaurant.progress.stopped,true);
  assert.equal(stopped.case.stopped,true);
 }finally{host.release();await host.close();}
});


test("Round16 Stop retries CANCELLED when shortlist races between snapshot and dispatch", {timeout:20_000}, async()=>{
 const host=await startWorkspaceFixture({staged:true});
 try {
  const first=await create(host);await host.waitForCheck();
  const v=await host.application.getCase(userId,first.case.caseId);
  type Runtime=import("./persistent-restaurant-agent.js").PersistentRestaurantAgentApplication["runtime"];
  const runtime=(host.application as unknown as {runtime:Runtime}).runtime;
  const dispatch=runtime.dispatch.bind(runtime);let races=0;
  runtime.dispatch=async(envelope,version)=>{
   if(envelope.event.type==="AGENT_LOOP_TERMINATED"&&envelope.event.termination==="CANCELLED"&&races<2){
    races++;
    const current=await host.application.getCase(userId,v.case.caseId);
    await host.application.setShortlist({userId,caseId:v.case.caseId,candidateId:v.restaurant.candidates[0]!.restaurant.id,shortlisted:races===1,expectedVersion:current.case.taskVersion,requestId:"stop-race-"+races});
   }
   return dispatch(envelope,version);
  };
  const stopped=await host.application.cancelCase(userId,v.case.caseId,{readRunId:v.restaurant.sourceReadContext!.runId,expectedVersion:v.case.taskVersion});
  assert.equal(races,2);assert.equal(stopped.case.stopped,true);assert.equal(stopped.restaurant.progress.stopped,true);

 } finally {host.release();await host.close();}
});

test("Round16 first semantic preparation Stop cancels with zero source calls", {timeout:20_000}, async()=>{
 const entered=latch(),release=latch();
 const host=await startWorkspaceFixture({beforeSemantic:async()=>{entered.release();await release.promise;}});
 let pending:ReturnType<typeof create>|undefined;
 try {
  pending=create(host);await entered.promise;
  const cases=await host.application.listCases(userId);const id=cases[0]!.caseId;
  const v=await host.application.getCase(userId,id);
  const stopped=await host.application.cancelCase(userId,id,{readRunId:v.restaurant.sourceReadContext!.runId,expectedVersion:v.case.taskVersion});
  assert.equal(stopped.case.stopped,true);
  release.release();await pending;
  assert.equal(host.searches.length,0);assert.equal(host.providerCalls.length,0);
  const after=await settled(host,id);assert.equal(after.case.phase,"FAILED");assert.equal(after.case.stopped,true);
 } finally {release.release();await pending?.catch(()=>{});await host.close();}
});

test("Round16 old prepared refresh never claims replacement preparation handle", {timeout:20_000}, async()=>{
 const host=await startWorkspaceFixture(),oldEntered=latch(),newEntered=latch(),oldRelease=latch(),newRelease=latch();
 const append=host.application.store.appendMessage.bind(host.application.store);
 let old:Promise<unknown>|undefined,replacement:Promise<unknown>|undefined;
 try {
  const first=await create(host),v=await settled(host,first.case.caseId),calls=host.providerCalls.length;
  host.application.store.appendMessage=async input=>{
   if(input.requestId==="user:old-owner"){oldEntered.release();await oldRelease.promise;}
   if(input.requestId==="user:new-owner"){newEntered.release();await newRelease.promise;}
   return append(input);
  };
  old=host.application.refreshAvailability({userId,caseId:v.case.caseId,expectedVersion:v.case.taskVersion,requestId:"old-owner"});await oldEntered.promise;
  const during=await host.application.getCase(userId,v.case.caseId);
  replacement=host.application.submitMessage({userId,conversationId:v.case.conversationId,message:"Make it three guests",expectedVersion:during.case.taskVersion,requestId:"new-owner"});await newEntered.promise;
  oldRelease.release();await old;await delay(50);
  assert.equal(host.providerCalls.length,calls,"old request cannot start the replacement's sources");
  const latest=await host.application.getCase(userId,v.case.caseId);
  await host.application.cancelCase(userId,v.case.caseId,{readRunId:latest.restaurant.sourceReadContext!.runId,expectedVersion:latest.case.taskVersion});
  newRelease.release();await replacement;
  assert.equal(host.providerCalls.length,calls);assert.equal((await settled(host,v.case.caseId)).case.stopped,true);
 } finally {oldRelease.release();newRelease.release();await Promise.allSettled([old,replacement]);await host.close();}
});

test("Round16 About question preparing Stop returns HTTP 200 and zero question sources", {timeout:20_000}, async()=>{
 const host=await startWorkspaceFixture({questions:true}),entered=latch(),release=latch();
 const append=host.application.store.appendMessage.bind(host.application.store);let pending:Promise<unknown>|undefined;
 try {
  const first=await create(host),v=await settled(host,first.case.caseId);
  host.application.store.appendMessage=async input=>{if(input.requestId==="user:question-stop"){entered.release();await release.promise;}return append(input);};
  pending=host.application.askRestaurantQuestion({userId,caseId:v.case.caseId,candidateId:v.restaurant.presentedCandidateIds![0]!,expectedVersion:v.case.taskVersion,requestId:"question-stop",question:"Is there a private room?"});await entered.promise;
  const session=await fetch(host.baseUrl+"/api/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accessToken:"workspace-fixture"})});
  const current=await host.application.getCase(userId,v.case.caseId);
  const response=await fetch(host.baseUrl+`/api/cases/${encodeURIComponent(v.case.caseId)}/run`,{method:"DELETE",headers:{cookie:session.headers.get("set-cookie")!.split(";")[0]!,"content-type":"application/json"},body:JSON.stringify({readRunId:current.restaurant.sourceReadContext!.runId,taskVersion:current.case.taskVersion})});
  assert.equal(response.status,200,await response.text());
  release.release();await pending;
  const after=await settled(host,v.case.caseId);assert.equal(after.case.phase,"PRESENT_RESULTS");assert.equal(after.restaurant.pageQuestion?.result?.status,"UNVERIFIED");
  assert.equal(after.restaurant.pageQuestion?.result&&"reason" in after.restaurant.pageQuestion.result?after.restaurant.pageQuestion.result.reason:undefined,"CANCELLED");
  assert.equal(host.questionRequests.length,0);
 } finally {release.release();await pending?.catch(()=>{});await host.close();}
});


for(const kind of ["first","edit"] as const)test(`Round17 ${kind} semantic commit: current persisted read ID cancels before handle identity catches up`,{timeout:20_000},async()=>{
 const host=await startWorkspaceFixture(),entered=latch(),release=latch();
 type Runtime=import("./persistent-restaurant-agent.js").PersistentRestaurantAgentApplication["runtime"];
 const runtime=(host.application as unknown as {runtime:Runtime}).runtime;
 const dispatch=runtime.dispatch.bind(runtime),append=host.application.store.appendMessage.bind(host.application.store);
 let pending:Promise<unknown>|undefined,appends=0;
 try{
  let existing:Awaited<ReturnType<typeof settled>>|undefined;
  if(kind==="edit"){const first=await create(host);existing=await settled(host,first.case.caseId);}
  const requestId=kind==="first"?"preparation-initial":"semantic-commit-stop";
  host.application.store.appendMessage=async input=>{if(input.requestId==="user:"+requestId)appends++;return append(input);};
  let armed=true;
  runtime.dispatch=async(envelope,version)=>{
   const result=await dispatch(envelope,version);
   if(armed&&envelope.event.type==="SEMANTIC_PROPOSAL_COMPILED"){
    armed=false;entered.release();await release.promise;
   }
   return result;
  };
  const calls=host.providerCalls.length,searches=host.searches.length;
  pending=existing?host.application.submitMessage({userId,conversationId:existing.case.conversationId,expectedVersion:existing.case.taskVersion,requestId,message:"Change 2 guests to 3"}):create(host);
  await entered.promise;
  const id=existing?.case.caseId??(await host.application.listCases(userId))[0]!.caseId;
  const current=await host.application.getCase(userId,id);
  const handles=(host.application as unknown as {preparingHandles:Map<string,{readRunId:string;startedVersion:number}>}).preparingHandles;
  assert.notEqual(handles.get(id)!.readRunId,current.restaurant.sourceReadContext!.runId,"the test parks before the read ID handback");
  if(kind==="first")assert.equal(current.case.taskVersion,1);
  const session=await fetch(host.baseUrl+"/api/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accessToken:"workspace-fixture"})});
  const response=await fetch(host.baseUrl+`/api/cases/${encodeURIComponent(id)}/run`,{method:"DELETE",headers:{cookie:session.headers.get("set-cookie")!.split(";")[0]!,"content-type":"application/json"},body:JSON.stringify({readRunId:current.restaurant.sourceReadContext!.runId,taskVersion:current.case.taskVersion})});
  const body=await response.json() as {view?:import("./agent-workspace.js").RestaurantCaseView;error?:string};
  assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.view?.case.stopped,true);
  release.release();await pending;
  assert.equal(appends,0,"cancelled dispatch must not append the pending message or start source work");
  assert.equal(host.searches.length,searches);assert.equal(host.providerCalls.length,calls);
  assert.equal((await settled(host,id)).case.stopped,true);
 }finally{release.release();await pending?.catch(()=>{});runtime.dispatch=dispatch;host.application.store.appendMessage=append;await host.close();}
});

test("Round17 preparation becomes active during Stop identity re-read without a false conflict",{timeout:20_000},async()=>{
 const host=await startWorkspaceFixture({staged:true}),entered=latch(),release=latch();
 type Runtime=import("./persistent-restaurant-agent.js").PersistentRestaurantAgentApplication["runtime"];
 const runtime=(host.application as unknown as {runtime:Runtime}).runtime;
 const dispatch=runtime.dispatch.bind(runtime),snapshot=runtime.snapshot.bind(runtime);
 let pending:ReturnType<typeof create>|undefined;
 try{
  let commit=true;
  runtime.dispatch=async(envelope,version)=>{const result=await dispatch(envelope,version);if(commit&&envelope.event.type==="SEMANTIC_PROPOSAL_COMPILED"){commit=false;entered.release();await release.promise;}return result;};
  pending=create(host);await entered.promise;
  const id=(await host.application.listCases(userId))[0]!.caseId,current=await host.application.getCase(userId,id);
  let reading=true;
  runtime.snapshot=async taskId=>{const value=await snapshot(taskId);if(reading){reading=false;release.release();await host.waitForCheck();}return value;};
  const stopped=await host.application.cancelCase(userId,id,{readRunId:current.restaurant.sourceReadContext!.runId,expectedVersion:current.case.taskVersion});
  await pending;assert.equal(stopped.case.stopped,true);assert.equal(stopped.restaurant.progress.stopped,true);
  assert.equal(host.providerCalls.at(-1)?.aborted,true);
 }finally{release.release();host.release();runtime.snapshot=snapshot;await pending?.catch(()=>{});runtime.dispatch=dispatch;await host.close();}
});


test("Round18 preparation publication gap never advertises an unowned Stop",{timeout:20_000},async()=>{
 const published=latch(),publish=latch(),semantic=latch(),understand=latch();
 const host=await startWorkspaceFixture({beforeSemantic:async()=>{semantic.release();await understand.promise;}});
 const createConversation=host.application.store.createConversation.bind(host.application.store);let pending:ReturnType<typeof create>|undefined;
 try{
  host.application.store.createConversation=async input=>{const record=await createConversation(input);published.release();await publish.promise;return record;};
  pending=create(host);await published.promise;
  const id=(await host.application.listCases(userId))[0]!.caseId;
  const gap=await host.application.getCase(userId,id);
  assert.equal(gap.restaurant.progress.active,false,"a published Case without a handle cannot expose Stop");
  publish.release();await semantic.promise;
  const owned=await host.application.getCase(userId,id);
  assert.equal(owned.restaurant.progress.active,true);
  assert.equal(typeof (owned.restaurant.sourceReadContext as {handleId?:string}).handleId,"string");
  await host.application.cancelCase(userId,id,{readRunId:owned.restaurant.sourceReadContext!.runId,expectedVersion:owned.case.taskVersion});
  understand.release();await pending;assert.equal(host.searches.length,0);assert.equal(host.providerCalls.length,0);
 }finally{publish.release();understand.release();await pending?.catch(()=>{});await host.close();}
});

test("Round18 persisted semantic winner regains preparation from an uncommitted contender",{timeout:20_000},async()=>{
 const dispatching=latch(),write=latch(),contending=latch(),interpret=latch();
 const host=await startWorkspaceFixture({beforeSemantic:async text=>{if(text==="Change 2 guests to 4"){contending.release();await interpret.promise;}}});
 type Runtime=import("./persistent-restaurant-agent.js").PersistentRestaurantAgentApplication["runtime"];
 const runtime=(host.application as unknown as {runtime:Runtime}).runtime,dispatch=runtime.dispatch.bind(runtime);
 let winner:Promise<unknown>|undefined,loser:Promise<unknown>|undefined;
 try{
  const first=await create(host),v=await settled(host,first.case.caseId),calls=host.providerCalls.length;let hold=true;
  runtime.dispatch=async(envelope,version)=>{if(hold&&envelope.event.type==="SEMANTIC_PROPOSAL_COMPILED"){hold=false;dispatching.release();await write.promise;}return dispatch(envelope,version);};
  const input={userId,conversationId:v.case.conversationId,expectedVersion:v.case.taskVersion};
  winner=host.application.submitMessage({...input,requestId:"db-winner",message:"Change 2 guests to 3"});await dispatching.promise;
  loser=host.application.submitMessage({...input,requestId:"prepare-loser",message:"Change 2 guests to 4"});const loss=loser.then(()=>undefined,e=>e);
  await contending.promise;write.release();await winner;
  for(let i=0;i<100&&host.providerCalls.length===calls;i++)await delay(10);
  assert.ok(host.providerCalls.length>calls,"the committed winner must launch source work instead of becoming an orphan");
  interpret.release();assert.ok(await loss instanceof StaleTaskVersionError);
  const final=await settled(host,v.case.caseId);assert.equal(final.case.phase,"PRESENT_RESULTS");assert.equal(final.restaurant.intentDraft?.partySize,3);
 }finally{write.release();interpret.release();await Promise.allSettled([winner,loser]);runtime.dispatch=dispatch;await host.close();}
});

test("Round18 Stop wins semantic dispatch CAS without rejecting the cancelled input",{timeout:20_000},async()=>{
 const entered=latch(),write=latch(),host=await startWorkspaceFixture();
 type Runtime=import("./persistent-restaurant-agent.js").PersistentRestaurantAgentApplication["runtime"];
 const runtime=(host.application as unknown as {runtime:Runtime}).runtime,dispatch=runtime.dispatch.bind(runtime);let pending:ReturnType<typeof create>|undefined;
 try{
  let hold=true;runtime.dispatch=async(envelope,version)=>{if(hold&&envelope.event.type==="SEMANTIC_PROPOSAL_COMPILED"){hold=false;entered.release();await write.promise;}return dispatch(envelope,version);};
  pending=create(host);const outcome=pending.then(value=>({ok:true,value}),error=>({ok:false,error}));await entered.promise;
  const id=(await host.application.listCases(userId))[0]!.caseId,v=await host.application.getCase(userId,id);
  const stopped=await host.application.cancelCase(userId,id,{readRunId:v.restaurant.sourceReadContext!.runId,expectedVersion:v.case.taskVersion});assert.equal(stopped.case.stopped,true);
  write.release();const result=await outcome;assert.equal(result.ok,true,JSON.stringify(result));
  assert.equal(host.searches.length,0);assert.equal(host.providerCalls.length,0);assert.equal((await settled(host,id)).case.stopped,true);
 }finally{write.release();await pending?.catch(()=>{});runtime.dispatch=dispatch;await host.close();}
});

test("Round18 immutable handle cancels its active read after run ID and version advance",{timeout:20_000},async()=>{
 const entered=latch(),release=latch(),host=await startWorkspaceFixture({staged:true,beforeSemantic:async()=>{entered.release();await release.promise;}});
 let pending:ReturnType<typeof create>|undefined;
 try{
  pending=create(host);await entered.promise;
  const id=(await host.application.listCases(userId))[0]!.caseId,before=await host.application.getCase(userId,id);
  const handleId=before.restaurant.sourceReadContext!.handleId;assert.equal(typeof handleId,"string");
  release.release();await pending;await host.waitForCheck();
  const running=await host.application.getCase(userId,id);
  assert.equal(running.restaurant.sourceReadContext!.handleId,handleId);assert.notEqual(running.restaurant.sourceReadContext!.runId,before.restaurant.sourceReadContext!.runId);assert.ok(running.case.taskVersion>before.case.taskVersion);
  const session=await fetch(host.baseUrl+"/api/session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({accessToken:"workspace-fixture"})});
  const response=await fetch(host.baseUrl+`/api/cases/${encodeURIComponent(id)}/run`,{method:"DELETE",headers:{cookie:session.headers.get("set-cookie")!.split(";")[0]!,"content-type":"application/json"},body:JSON.stringify({readRunId:before.restaurant.sourceReadContext!.runId,taskVersion:before.case.taskVersion,handleId})});
  assert.equal(response.status,200,await response.text());assert.equal((await settled(host,id)).case.stopped,true);assert.equal(host.providerCalls.at(-1)?.aborted,true);
 }finally{release.release();host.release();await pending?.catch(()=>{});await host.close();}
});


test('Round20 illegal terminal Cases reject page questions without source calls',async()=>{
 for(const options of [{outcome:'empty' as const},{semanticFailureMessage:'Dinner for two in Tokyo'}]){
  const host=await startWorkspaceFixture({...options,questions:true});
  try{const first=await create(host),v=await settled(host,first.case.caseId);
   assert.ok(['NO_VERIFIED_RESULT','FAILED'].includes(v.case.phase));
   await assert.rejects(host.application.askRestaurantQuestion({userId,caseId:v.case.caseId,candidateId:v.restaurant.candidates[0]?.restaurant.id??'not-visible',requestId:'illegal-question',expectedVersion:v.case.taskVersion,question:'Is there a card requirement?'}),/displayed restaurant/);
   assert.equal(host.questionRequests.length,0);
  }finally{await host.close();}
 }
});
