import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp,mkdir,readFile,writeFile,rm } from "node:fs/promises";
import { resolve,join } from "node:path";
import { developmentPack,assertDevelopmentDates,W2_SOURCE_ID,W2_EXCLUDED_SOURCE_ID } from "./development-pack.js";
import { runG6Batch } from "./runner.js";
import { g6Fixture } from "./fixtures.js";
import { hasBoundedNoResultConclusion } from "./evaluator.js";
import { createWitnessReader } from "./witness.js";
import { chargeG6 } from "./budget.js";

const ledger={entries:[],limits:{evaluationPublicGET:20},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0}};
test("G6 development model ceiling remains 400 across slots and independent user turns",async()=>{
  // LOCAL_CONSTRUCTION ledger only; no model/network provider is used.
  const dir=await mkdtemp(join(resolve(".eval-artifacts"),"g6-development-model-cap-")),path=join(dir,"budget.json");
  try{
    await writeFile(path,JSON.stringify({entries:[{id:"g6-D1-historical:MODEL:1",realModelCalls:399}],limits:{realModelCalls:1600},cumulative:{realModelCalls:640}}));
    await chargeG6(path,"g6-D6-local:MODEL:1","realModelCalls","Local counter control",true);
    const before=await readFile(path,"utf8");
    await assert.rejects(chargeG6(path,"g6-D6-local:MODEL:2","realModelCalls","Must never transmit",true),/development.*400/iu);
    assert.equal(await readFile(path,"utf8"),before,"Rejected 401st call cannot mutate the ledger");
  }finally{await rm(dir,{recursive:true,force:true});}
});
test("G6 development freeze pins the reviewed W2 branch and original Wednesday, rejecting an expired date",()=>{
  const pack=developmentPack();assert.equal(pack.cases.length,8);assert.equal(pack.witnessGETLimit,20);
  for(const id of ["D2","D8"]){const w=pack.cases.find(c=>c.id===id)!.witness!;assert.equal(w.sourceEntityId,W2_SOURCE_ID);assert.equal(w.detailUrl,"https://tabelog.com/en/tokyo/A1301/A130101/13186922/");assert.notEqual(w.sourceEntityId,W2_EXCLUDED_SOURCE_ID);}
  assert.doesNotThrow(()=>assertDevelopmentDates("2026-11-03"));assert.doesNotThrow(()=>assertDevelopmentDates("2026-11-04"));assert.throws(()=>assertDevelopmentDates("2026-11-05"),/re-freeze/u);
});

test("G6 reviewed W2 detail-only receipt never becomes an availability witness or fabricated capability miss",async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-detail-only-"));
  const f=await g6Fixture("RESPONSE_MISSING"),w=developmentPack().cases[1]!.witness!,budgetPath=join(dir,"budget.json");await writeFile(budgetPath,JSON.stringify(ledger));let gets=0;
  const transport:typeof fetch=async(url)=>{gets++;assert.equal(String(url),w.detailUrl);return new Response(w.identityText.join("\n"));};
  try{
    const reader=createWitnessReader({directory:join(dir,"seed"),budgetPath,runId:"local-detail-seed",fetch:transport,now:()=>f.clock.now().valueOf()});
    await assert.rejects(reader.readDetail({...w,allowDetailOnlyCertificate:false},"BEFORE"),/requires availability/u);assert.equal(gets,0);
    const seed=await reader.readDetail(w,"BEFORE");assert.equal(seed.exists,null);assert.equal(seed.vacancy,undefined);
    const pack={...developmentPack(),mode:"FIXTURE" as const,witnessGETLimit:2,cases:[{id:"detail-only",request:f.request,followups:[],witness:w,oracle:{request:{dates:[f.source.date]},pages:[]}}]};
    const batch=await runG6Batch(pack,{budgetPath,initialWitnesses:[seed],initialWitnessGETs:1,witnessFetch:transport,now:()=>f.clock.now().valueOf(),transports:async()=>f},join(dir,"runs"));
    assert.equal(batch.slots[0]!.status,"EVALUATED");assert.equal(gets,2);assert.equal(batch.witnessGETs,2);
    const e=JSON.parse(await readFile(join(dir,"runs/detail-only/evaluation.json"),"utf8"));assert.equal(e.verdict.outcome,"HONEST_NO_RESULT");assert.equal(e.checks.some((c:{rule:string})=>c.rule==="NO_DELIVERY_WITNESS"),false);
    const input=JSON.parse(await readFile(join(dir,"runs/detail-only/evaluation.input.json"),"utf8"));assert.equal(input.witnesses,undefined);assert.deepEqual(input.vacancy,[]);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("G6 development GET ceiling rejects the next request before shared charge, source fetch or model call",async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-get-cap-")),budgetPath=join(dir,"budget.json");await writeFile(budgetPath,JSON.stringify(ledger));const f=await g6Fixture();let modelCalls=0,gets=0;
  try{
    const spec=developmentPack().cases[0]!;const batch=await runG6Batch({...developmentPack(),mode:"FIXTURE",witnessGETLimit:0,cases:[spec]},{budgetPath,async witnessFetch(){gets++;throw Error("Must never transmit");},transports:async()=>({...f,model:{async complete(r){modelCalls++;return f.model.complete(r);}}})},join(dir,"runs"));
    assert.equal(batch.slots[0]!.status,"FAILED");assert.match(batch.stopReason!,/ceiling/u);assert.equal(gets,0);assert.equal(modelCalls,0);assert.deepEqual(JSON.parse(await readFile(budgetPath,"utf8")).entries,[]);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("G6 no-result wording is scoped independently of the production phase",()=>{
  assert.equal(hasBoundedNoResultConclusion("This bounded read-only investigation found no result with evidence strong enough to present. It does not mean every restaurant is unavailable."),true);
  assert.equal(hasBoundedNoResultConclusion("There are no verified restaurants anywhere in Tokyo."),false);
  assert.equal(hasBoundedNoResultConclusion("This bounded investigation found a restaurant."),false);
});
