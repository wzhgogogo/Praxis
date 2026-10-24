import assert from "node:assert/strict";
import { mkdtemp,rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createReplayFixture,executeReplayFixture,replayDelivery } from "./fixtures/replay-scenario.js";

test("recorded decisions reproduce nonempty candidates and delivery under OS-denied network",{timeout:45_000},async t=>{
 const root=await mkdtemp(join(tmpdir(),"praxis-replay-complete-"));
 try{
  const {bundle,original}=await createReplayFixture(root),result=await executeReplayFixture(bundle,"complete");
  assert.equal(result.summary.status,"COMPLETED",JSON.stringify(result.summary));assert.ok(replayDelivery(original.artifact).shown.length>0);
  assert.deepEqual(replayDelivery(result.artifact),replayDelivery(original.artifact));assert.equal(result.fixtureModelCalls,0);
  assert.equal(result.artifact.mode,"REPLAY");assert.equal(result.evaluation.executionSource,"REPLAY");assert.equal(result.evaluation.outcome.capabilityDenominator,"EXCLUDED");
  assert.equal(result.evaluation.severity.S0_DECLARATION.status,"ABSENT");assert.equal(result.evaluation.severity.S0_BOUNDARY.status,"ABSENT");
  t.diagnostic(JSON.stringify({summary:result.summary,delivery:replayDelivery(result.artifact),networkPolicy:result.networkPolicy}));
 }finally{await rm(root,{recursive:true,force:true});}
});
for(const mode of ["missing","partial","model-wiring"] as const)test(`replay ${mode} preserves source/progress and model boundaries`,{timeout:45_000},async t=>{
 const root=await mkdtemp(join(tmpdir(),"praxis-replay-control-"));
 try{
  const {bundle,original}=await createReplayFixture(root),result=await executeReplayFixture(bundle,mode);
  assert.equal(result.evaluation.outcome.capabilityDenominator,"EXCLUDED");
  if(mode==="model-wiring"){
   assert.equal(result.summary.status,"COMPLETED");assert.ok(result.fixtureModelCalls>0);assert.equal(result.fixtureModelCalls,result.summary.modelTransportCalls);assert.deepEqual(replayDelivery(result.artifact),replayDelivery(original.artifact));
  }else{
   assert.equal(result.summary.status,"REPLAY_INCOMPLETE");assert.equal(result.evaluation.replayStatus,"REPLAY_INCOMPLETE");assert.ok(result.evaluation.findings.every((row:any)=>row.status==="NOT_EVALUATED"));
   assert.equal(result.summary.stop.reason,mode==="missing"?"MISSING_STRUCTURED_RESPONSE":"UNCAPTURED_STATIC_DEPENDENCY");
   if(mode==="partial"){assert.equal(result.summary.stop.snapshot,3);assert.equal(result.summary.consumedPages,2);}
  }
  t.diagnostic(JSON.stringify({mode,summary:result.summary,networkPolicy:result.networkPolicy,realModelCalls:result.realModelCalls}));
 }finally{await rm(root,{recursive:true,force:true});}
});
