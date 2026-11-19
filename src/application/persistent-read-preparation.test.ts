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
