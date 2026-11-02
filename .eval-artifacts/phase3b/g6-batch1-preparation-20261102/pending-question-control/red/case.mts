import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp,readFile,writeFile,rm,mkdir,cp } from "node:fs/promises";
import { join,resolve } from "node:path";
import { createHash } from "node:crypto";
import { GooglePlacesClient } from "file:///Users/wangzhour/.codex/worktrees/phase3a-prime-f3-guard/Praxis-Zhixing/src/integrations/google/google-places-client.ts";
import { g6Fixture } from "file:///Users/wangzhour/.codex/worktrees/phase3a-prime-f3-guard/Praxis-Zhixing/src/eval/restaurant/agent-loop/g6/fixtures.ts";
import { runG6Batch,loadG6Pack,type G6Pack } from "file:///private/tmp/praxis-g6-pending-question-red/old-runner.mts";

/** LOCAL_CONSTRUCTION: same controlled public source as the full assembly cases. */
test("G6 serial Runner obtains G1 pages through Live assembly, records all channels, checks each slot and stops before the next slot on independent S0",async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const output=await mkdtemp(join(root,"g6-runner-control-"));
  const f=await g6Fixture(),id="praxis:restaurant:bd287442c716ac7439273cc9",s=f.source;
  const counter=join(output,"budget.json");await writeFile(counter,JSON.stringify({entries:[],limits:{evaluationPublicGET:20},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0}}));
  let active=0,maxActive=0,slot=0,clock=Date.parse(s.referenceTime);const requests:Array<{url:string;at:number;init?:RequestInit}>=[];
  const spec={witness:{candidateId:id,name:s.outlet.name,address:s.outlet.address,provider:"TABELOG",sourceEntityId:"13123456",date:s.date,time:s.time,partySize:2,detailUrl:s.pageUrl,identityText:[s.outlet.name,s.outlet.address]},request:s.initialRequest,followups:[{id:"room",trigger:"DISPLAYED_RESULTS" as const,kind:"PAGE_QUESTION" as const,text:s.question},{id:"no-date-question",trigger:"ASKED_FOR_DATE" as const,kind:"MESSAGE" as const,text:"November 11, 2026."}],
    oracle:{request:{dates:[s.date],partySize:2,time:s.time},pages:[{ref:"merchant",candidateId:id,url:s.pageUrl,name:s.outlet.name,address:s.outlet.address,merchantText:s.merchantQuote,observedLinks:[]}],questions:[{candidateId:id,expected:"ANSWERED" as const,approvedAnswers:[s.merchantQuote],sensitiveCategory:"NONE"}]}};
  const pack:G6Pack={schemaVersion:"phase3b-g6-pack@1",mode:"FIXTURE",recording:{browser:true,decisions:true,googleResponses:true},cases:[{id:"good",...spec},{id:"slot-gone",...spec},{id:"must-not-start",...spec}]};
  try{
    const result=await runG6Batch(pack,{budgetPath:counter,now:()=>clock,wait:async ms=>{clock+=ms;},witnessFetch:async(url,init)=>{
      requests.push({url:String(url),at:clock,...(init?{init}:{})});if(!String(url).includes("find_vacancy"))return new Response(f.html,{status:200});const body=structuredClone(s.vacancy.body) as {selection:unknown[]};if(slot===2)body.selection=[];
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
    assert.equal(requests.length,4,"One pre-run detail/vacancy certificate reused within24h; every delivered slot rechecked without cache");for(let i=1;i<requests.length;i++)assert.ok(requests[i]!.at-requests[i-1]!.at>=5000);for(const r of requests){assert.equal(r.init?.credentials,"omit");assert.equal(r.init?.redirect,"manual");assert.equal(new URL(r.url).hostname,"tabelog.com");if(r.url.includes("find_vacancy"))assert.deepEqual([...new URL(r.url).searchParams.keys()].sort(),["rst_id","svd","svps","svt"]);}
    const ledger=JSON.parse(await readFile(counter,"utf8"));assert.equal(ledger.cumulative.evaluationPublicGET,4);assert.equal(ledger.entries.length,4);
  }finally{if(process.env.PRAXIS_G6_CAPTURE_DIR)await cp(output,join(process.env.PRAXIS_G6_CAPTURE_DIR,"RUNNER_FIXTURE"),{recursive:true,errorOnExist:true,force:false});await rm(output,{recursive:true,force:true});}
});

test("G6 frozen pack refuses changed bytes before constructing any source transport",async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-pack-control-"));
  try{const path=join(dir,"pack.json"),raw=JSON.stringify({schemaVersion:"phase3b-g6-pack@1"});await writeFile(path,raw);
    await assert.rejects(loadG6Pack(path,"0".repeat(64)),/SHA mismatch/u);await assert.rejects(loadG6Pack(path,createHash("sha256").update(raw).digest("hex")),/incomplete/u);
  }finally{await rm(dir,{recursive:true,force:true});}
});

for(const askedField of ["date","partySize"] as const)test(`G6 Runner authoritative pending question controls date reply: asked ${askedField}`,async()=>{
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-pending-question-"));
  const f=await g6Fixture(),s=f.source,budgetPath=join(dir,"budget.json");await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:4},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0}}));
  let semantics=0,sourceBeforeReply=false;
  const model={async complete(request:Parameters<typeof f.model.complete>[0]){
    if(request.purpose==="restaurant_semantic_interpret"){
      const original=await f.model.complete(request),body=JSON.parse(original.outputText);semantics++;
      body.facts=body.facts.filter((fact:{field:string})=>semantics===1?fact.field!=="DATE":fact.field==="DATE");return {...original,outputText:JSON.stringify(body)};
    }
    if(request.purpose==="restaurant_agent_decide"){
      const context=JSON.parse(request.messages.find(m=>m.role==="user")!.content).context;
      if(context.missingBlockingFields.includes("date"))return {invocationId:"pending-field-control",provider:"FIXTURE" as const,model:"pending-field-control",latencyMs:0,finishReason:"TOOL_CALLS" as const,outputText:JSON.stringify({type:"ASK_USER",question:askedField==="date"?"Which date would you like?":"How many people?",relatedFields:[askedField],retrievalHint:"",candidateIds:[],candidateId:"",offerId:"",decisionSummary:"Local pending-field control"})};
    }
    return f.model.complete(request);
  }};
  const pack:G6Pack={schemaVersion:"phase3b-g6-pack@1",mode:"FIXTURE",recording:{browser:true,decisions:true,googleResponses:true},cases:[{id:"undated",request:"I'd like to book a restaurant in Shibuya at 7 PM sometime next week, for two people.",followups:[{id:"give-date",trigger:"ASKED_FOR_DATE",kind:"MESSAGE",text:"November 11, 2026."}],oracle:{request:{dates:[s.date],partySize:2,time:s.time},pages:[]}}]};
  try{
    await runG6Batch(pack,{budgetPath,witnessFetch:async()=>new Response(JSON.stringify(s.vacancy.body)),async transports(_case,_recording,hooks){
      const google=new GooglePlacesClient({apiKey:"local-source-key",fetchImplementation:hooks.googleFetch(async(url,init)=>{if(semantics<2)sourceBeforeReply=true;return f.googleFetch(url,init);})});return {model,google,browser:f.browser,clock:f.clock};
    }},join(dir,"runs"));
    const path=join(dir,"runs/undated"),execution=await readFile(join(path,"execution.result.json"),"utf8").then(JSON.parse);
    assert.equal(execution.turns[0].status,askedField==="date"?"SENT":"NOT_SENT","Missing date plus an old/unrelated ASK_USER does not authorize an automatic date reply");
    assert.equal(semantics,askedField==="date"?2:1);assert.equal(sourceBeforeReply,false);
    if(askedField==="date")assert.equal(execution.view.case.phase,"PRESENT_RESULTS");
    else assert.equal(execution.view.restaurant.intentDraft.date,undefined);
  }finally{await rm(dir,{recursive:true,force:true});}
});
