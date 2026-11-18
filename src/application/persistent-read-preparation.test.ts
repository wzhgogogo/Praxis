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
