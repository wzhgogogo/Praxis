import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp,readFile,writeFile,rm,mkdir } from "node:fs/promises";
import { join,resolve } from "node:path";
import { createHash } from "node:crypto";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { g6Fixture } from "./fixtures.js";
import { runG6Batch,loadG6Pack,type G6Pack } from "./runner.js";

/** LOCAL_CONSTRUCTION: same controlled public source as the full assembly cases. */
test("G6 serial Runner obtains G1 pages through Live assembly, records all channels, checks each slot and stops before the next slot on independent S0",async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const output=await mkdtemp(join(root,"g6-runner-control-"));
  const f=await g6Fixture(),id="praxis:restaurant:bd287442c716ac7439273cc9",s=f.source;
  const counter=join(output,"budget.json");await writeFile(counter,JSON.stringify({entries:[],limits:{evaluationPublicGET:20},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0}}));
  let active=0,maxActive=0,slot=0,clock=Date.parse(s.referenceTime);const requests:Array<{url:string;at:number;init?:RequestInit}>=[];
  const spec={request:s.initialRequest,followups:[{id:"room",trigger:"DISPLAYED_AVAILABLE" as const,kind:"PAGE_QUESTION" as const,text:s.question},{id:"no-date-question",trigger:"ASKED_FOR_DATE" as const,kind:"MESSAGE" as const,text:"November 11, 2026."}],
    oracle:{request:{dates:[s.date],partySize:2,time:s.time},pages:[{ref:"merchant",candidateId:id,url:s.pageUrl,name:s.outlet.name,address:s.outlet.address,merchantText:s.merchantQuote,observedLinks:[]}],questions:[{candidateId:id,expected:"ANSWERED" as const,approvedAnswers:[s.merchantQuote],sensitiveCategory:"NONE"}]}};
  const pack:G6Pack={schemaVersion:"phase3b-g6-pack@1",mode:"FIXTURE",recording:{browser:true,decisions:true,googleResponses:true},cases:[{id:"good",...spec},{id:"slot-gone",...spec},{id:"must-not-start",...spec}]};
  try{
    const result=await runG6Batch(pack,{budgetPath:counter,now:()=>clock,wait:async ms=>{clock+=ms;},witnessFetch:async(url,init)=>{
      requests.push({url:String(url),at:clock,...(init?{init}:{})});const body=structuredClone(s.vacancy.body) as {selection:unknown[]};if(slot===2)body.selection=[];
      return new Response(JSON.stringify(body),{status:200});
    },async transports(_case,_recording,hooks){
      ++slot;++active;maxActive=Math.max(maxActive,active);const next=await g6Fixture();
      const google=new GooglePlacesClient({apiKey:"local-g6-source-key",fetchImplementation:hooks.googleFetch(next.googleFetch)});
      const browser={async openSession(input:Parameters<typeof next.browser.openSession>[0]){const original=await next.browser.openSession(input);return new Proxy(original,{get(target,key){if(key==="close")return async()=>{await target.close();active=0;};const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;}});}};
      return {model:next.model,google,browser,clock:next.clock};
    }},join(output,"runs"));
    assert.equal(maxActive,1);assert.equal(slot,2);assert.deepEqual(result.slots.map(s=>s.status),["EVALUATED","STOPPED","NOT_SENT"]);assert.equal(result.stopReason,"S0_STOP");
    const first=JSON.parse(await readFile(join(output,"runs/good/execution.result.json"),"utf8"));
    assert.equal(first.view.restaurant.pageQuestion.result.status,"ANSWERED");assert.equal(first.view.restaurant.pageQuestion.result.citations[0].text,s.merchantQuote);
    assert.deepEqual(first.turns.map((t:{status:string})=>t.status),["SENT","NOT_SENT"]);
    const evaluation=JSON.parse(await readFile(join(output,"runs/slot-gone/evaluation.json"),"utf8"));assert.ok(evaluation.checks.some((c:{rule:string;status:string})=>c.rule==="POST_DELIVERY_SLOT"&&c.status==="FAIL"));
    const observation=JSON.parse(await readFile(join(output,"runs/good/recording-observation.json"),"utf8"));assert.deepEqual(observation.recordingConfig,{browser:true,decisions:true,googleResponses:true});assert.ok(observation.totalPages>0);assert.equal(observation.pages.length,observation.totalPages);
    const recording=JSON.parse(await readFile(join(observation.recordingPath,"recording.json"),"utf8"));assert.equal(recording.status,"RECORDED");
    assert.ok(observation.decisions);const har=JSON.parse(await readFile(join(observation.recordingPath,"replay.har"),"utf8"));assert.ok(har.log.entries.some((e:{request:{url:string}})=>new URL(e.request.url).hostname==="places.googleapis.com"),"Google structured capture must be observable");
    assert.equal(requests.length,2);assert.ok(requests[1]!.at-requests[0]!.at>=5000);for(const r of requests){assert.equal(r.init?.credentials,"omit");assert.equal(r.init?.redirect,"manual");assert.equal(new URL(r.url).hostname,"tabelog.com");assert.deepEqual([...new URL(r.url).searchParams.keys()].sort(),["rst_id","svd","svps","svt"]);}
    const ledger=JSON.parse(await readFile(counter,"utf8"));assert.equal(ledger.cumulative.evaluationPublicGET,2);assert.equal(ledger.entries.length,2);
  }finally{await rm(output,{recursive:true,force:true});}
});

test("G6 frozen pack refuses changed bytes before constructing any source transport",async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-pack-control-"));
  try{const path=join(dir,"pack.json"),raw=JSON.stringify({schemaVersion:"phase3b-g6-pack@1"});await writeFile(path,raw);
    await assert.rejects(loadG6Pack(path,"0".repeat(64)),/SHA mismatch/u);await assert.rejects(loadG6Pack(path,createHash("sha256").update(raw).digest("hex")),/incomplete/u);
  }finally{await rm(dir,{recursive:true,force:true});}
});
