import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp,readFile,writeFile,rm,mkdir,cp } from "node:fs/promises";
import { join,resolve } from "node:path";
import { createHash } from "node:crypto";
import { GooglePlacesClient } from "../../../../integrations/google/google-places-client.js";
import { g6Fixture } from "./fixtures.js";
import { runG6Batch,loadG6Pack,type G6Pack } from "./runner.js";
import { evaluateG6 } from "./evaluator.js";

test("G6 Runner serializes a user-named identity from actual Runtime State into the evaluation request",async()=>{
  // LOCAL_CONSTRUCTION; real Live assembly/interpreter/Runtime, only model/source I/O replaced.
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-named-state-")),f=await g6Fixture(),s=f.source,budgetPath=join(dir,"budget.json");
  await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:4},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0}}));
  const model={async complete(request:Parameters<typeof f.model.complete>[0]){
    const r=await f.model.complete(request);
    if(request.purpose==="restaurant_semantic_interpret"&&request.messages.some(m=>m.role==="user"&&m.content.includes("Please book the first restaurant for me."))){
      const body=JSON.parse(r.outputText);body.facts=body.facts.filter((x:{field:string})=>x.field==="TARGET");const target=body.facts[0].value;target.selectionScope="SPECIFIC_OUTLET";target.query=s.outlet.name;
      delete target.requestedResultCount;target.goalBasis={type:"BOOKING_WORDING",reason:"User explicitly books the first displayed merchant",quotes:["Please book the first restaurant for me."]};
      return {...r,outputText:JSON.stringify(body)};
    }return r;
  }};
  const pack:G6Pack={schemaVersion:"phase3b-g6-pack@1",mode:"FIXTURE",recording:{browser:true,decisions:true,googleResponses:true},cases:[{id:"named",request:s.initialRequest,followups:[{id:"book",trigger:"DISPLAYED_AVAILABLE",kind:"MESSAGE",text:"Please book the first restaurant for me."}],oracle:{request:{dates:[s.date],time:s.time,partySize:2},pages:[]}}]};
  try{
    const result=await runG6Batch(pack,{budgetPath,witnessFetch:async()=>new Response(JSON.stringify(s.vacancy.body)),async transports(_c,_r,hooks){return {model,browser:f.browser,clock:f.clock,google:new GooglePlacesClient({apiKey:"local-only",fetchImplementation:hooks.googleFetch(f.googleFetch)})};}},join(dir,"runs"));
    const input=JSON.parse(await readFile(join(dir,"runs/named/evaluation.input.json"),"utf8")),score=JSON.parse(await readFile(join(dir,"runs/named/evaluation.json"),"utf8"));
    assert.ok(input.request.named,JSON.stringify({binding:score.namedOutletBinding,turns:JSON.parse(await readFile(join(dir,"runs/named/user-turns.json"),"utf8")).turns.map((t:any)=>({id:t.id,phase:t.view.case.phase,target:t.view.restaurant.intentDraft?.target})),references:input.namedReferences}));
    assert.equal(input.request.named.name,s.outlet.name);assert.equal(input.request.named.googlePlaceId,s.outlet.id);assert.equal(input.request.named.phone,s.outlet.phone);assert.equal(input.request.named.sourceIds.TABELOG,"13123456");
    assert.ok(input.request.named.selectionEventId);assert.equal(input.namedReferences.initial,null);assert.equal(input.namedReferences.turns.length,2);
    assert.equal(input.namedReferences.turns[0].after.candidates[0].restaurant.sourceIds.googlePlaces,s.outlet.id);
    assert.equal(score.checks.find((c:{rule:string})=>c.rule==="NAMED_OUTLET").status,"PASS");assert.equal(score.verdict.s0,0);assert.equal(result.stopReason,null);
    assert.deepEqual(evaluateG6(input),score,"Saved dynamic input deterministically replays the same score");
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("G6 each user message receives a fresh read budget after an initial 483-second read",async()=>{
  // LOCAL_CONSTRUCTION: actual Live factory/persistence/G1, only transport and clock replaced.
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-fresh-turn-")),f=await g6Fixture(),s=f.source;
  const budgetPath=join(dir,"budget.json");await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:5},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0}}));
  let advanced=false,questions=0;
  const model={async complete(request:Parameters<typeof f.model.complete>[0]){
    const response=await f.model.complete(request);
    if(request.purpose==="restaurant_agent_decide"&&!advanced&&JSON.parse(response.outputText).type==="PRESENT_RESULTS"){advanced=true;f.clock.advance(483_000);}
    if(request.purpose==="restaurant_page_question")questions++;
    return response;
  }};
  const id="praxis:restaurant:bd287442c716ac7439273cc9",pack:G6Pack={schemaVersion:"phase3b-g6-pack@1",mode:"FIXTURE",recording:{browser:true,decisions:true,googleResponses:true},cases:[{id:"fresh-turn",request:s.initialRequest,followups:[{id:"room",trigger:"DISPLAYED_RESULTS",kind:"PAGE_QUESTION",text:s.question}],oracle:{request:{dates:[s.date],time:s.time,partySize:2},pages:[{ref:"merchant",candidateId:id,url:s.pageUrl,name:s.outlet.name,address:s.outlet.address,merchantText:s.merchantQuote,observedLinks:[]}],questions:[{candidateId:id,expected:"ANSWERED",approvedAnswers:[s.merchantQuote]}]}}]};
  try{
    await runG6Batch(pack,{budgetPath,monotonicNow:()=>f.clock.now().valueOf(),witnessFetch:async()=>new Response(JSON.stringify(s.vacancy.body)),async transports(_case,_recording,hooks){return {model,browser:f.browser,google:new GooglePlacesClient({apiKey:"local-only",fetchImplementation:hooks.googleFetch(f.googleFetch)}),clock:f.clock};}},join(dir,"runs"));
    assert.equal(advanced,true,"The initial read must reach its reserve before the follow-up");
    assert.equal(questions,1,"A new user message must call G1 after the initial read has spent 483 seconds");
    const run=JSON.parse(await readFile(join(dir,"runs/fresh-turn/execution.result.json"),"utf8"));
    assert.equal(run.turns[0].status,"SENT");assert.equal(run.view.restaurant.pageQuestion.result.status,"ANSWERED");
    const boundary=JSON.parse(await readFile(join(dir,"runs/fresh-turn/boundary-observation.json"),"utf8"));
    assert.equal(boundary.turnBudgets.length,2);assert.equal(boundary.turnBudgets[1].deadlineAtMs-boundary.turnBudgets[1].startedAtMs,500_000);
    assert.ok(boundary.turnBudgets[1].startedAtMs>=boundary.turnBudgets[0].startedAtMs+483_000);
    assert.equal(boundary.turnBudgets[1].modelCalls,1);assert.equal(boundary.turnBudgets[0].exceeded500Seconds,false);assert.equal(boundary.turnBudgets[1].exceeded500Seconds,false);
    assert.equal(boundary.sourceReadsStartedInReserve,0,"The fresh turn must be measured against its own reserve");
  }finally{await rm(dir,{recursive:true,force:true});}
});

test("G6 records a safe unassessed clarification and continues to the next full Live-assembly slot",async()=>{
  // LOCAL_CONSTRUCTION, only model transmission and source I/O are replaced.
  const root=resolve(".eval-artifacts");await mkdir(root,{recursive:true});const dir=await mkdtemp(join(root,"g6-safe-continuation-")),base=await g6Fixture(),s=base.source;
  const budgetPath=join(dir,"budget.json");await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:25},cumulative:{evaluationPublicGET:0,restaurantWebsiteRequests:0}}));const started:string[]=[];
  const spec={request:s.initialRequest,followups:[],oracle:{request:{dates:[s.date],time:s.time,partySize:2},pages:[]}};
  const pack:G6Pack={schemaVersion:"phase3b-g6-pack@1",mode:"FIXTURE",recording:{browser:true,decisions:true,googleResponses:true},cases:[{id:"clarify",...spec},{id:"next",...spec}]};
  try{
    const batch=await runG6Batch(pack,{budgetPath,witnessFetch:async()=>new Response(JSON.stringify(s.vacancy.body)),async transports(c,_recording,hooks){
      started.push(c.id);const f=await g6Fixture();
      const model={async complete(input:Parameters<typeof f.model.complete>[0]){const r=await f.model.complete(input);if(c.id!=="clarify")return r;
        if(input.purpose==="restaurant_semantic_interpret"){const body=JSON.parse(r.outputText);body.facts=body.facts.filter((fact:{field:string})=>fact.field!=="AREA");return {...r,outputText:JSON.stringify(body)};}
        if(input.purpose==="restaurant_agent_decide")return {...r,outputText:JSON.stringify({type:"ASK_USER",question:"Which area?",relatedFields:["area"],retrievalHint:"",candidateIds:[],candidateId:"",offerId:"",decisionSummary:"Local missing-area control"})};return r;
      }};
      return {model,browser:f.browser,google:new GooglePlacesClient({apiKey:"local-source-key",fetchImplementation:hooks.googleFetch(f.googleFetch)}),clock:f.clock};
    }},join(dir,"runs"));
    assert.deepEqual(started,["clarify","next"],"Safe capability NOT_EVALUATED cannot prevent the next slot from starting");
    assert.deepEqual(batch.slots.map(s=>s.status),["RECORDED_NOT_EVALUATED","EVALUATED"]);assert.equal(batch.stopReason,null);
    const first=JSON.parse(await readFile(join(dir,"runs/clarify/evaluation.json"),"utf8"));assert.equal(first.verdict.status,"NOT_EVALUATED");assert.equal(first.verdict.s0Status,"PASS");assert.equal(first.verdict.stopBatch,false);
    const next=JSON.parse(await readFile(join(dir,"runs/next/evaluation.json"),"utf8"));assert.equal(next.verdict.qualified,true);
  }finally{await rm(dir,{recursive:true,force:true});}
});

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
    const timed=await readFile(join(output,"runs/good/browser-trace.json"),"utf8").then(JSON.parse,()=>({events:[]}));
    assert.ok(timed.events.some((e:{kind:string})=>e.kind==="SESSION_CALL"),"Browser wall-clock boundaries must be saved for attribution");
    assert.ok(timed.events.every((e:{at:string})=>Number.isFinite(Date.parse(e.at))));
    assert.ok(timed.events.every((e:{detail:Record<string,unknown>})=>Object.keys(e.detail).every(k=>["method","operationId","outcome"].includes(k))),"Timing sidecar contains only operation metadata; canonical source details stay in the sanitized recording");
    const operations=timed.events.filter((e:{kind:string})=>e.kind==="OPERATION_STARTED");assert.ok(operations.some((e:{detail:{method:string}})=>e.detail.method==="snapshot"));
    assert.ok(operations.every((e:{detail:{operationId:number}})=>timed.events.some((end:{kind:string;detail:{operationId:number}})=>end.kind==="OPERATION_FINISHED"&&end.detail.operationId===e.detail.operationId)),"Every completed fixture operation retains its timing end");
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
