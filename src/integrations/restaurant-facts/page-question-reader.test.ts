import assert from "node:assert/strict";
import test from "node:test";
import type { ModelGateway } from "../../core/model/contracts.js";
import type { RestaurantPageQuestionRequest } from "../../domains/restaurant/page-question.js";
import { RestaurantPageQuestionReader } from "./page-question-reader.js";
import { RESTAURANT_PAGE_QUESTION_BUDGET } from "../../domains/restaurant/page-question-limits.js";

test("fresh question reads own independent model and browser counters, with no completed search context",async()=>{
  const searchBudget={totalModelCalls:7,maxModelCalls:8};
  let calls=0;const scopes:object[]=[];
  const model:ModelGateway={async complete(){calls++;return {invocationId:String(calls),provider:"FIXTURE",model:"fixture",outputText:"{}",finishReason:"STOP",latencyMs:0};}};
  const reader=new RestaurantPageQuestionReader(model,(_observe,scope,scopedModel)=>({executionRoute:"GENERIC_BROWSER",async inspectFacts(){
    assert.ok(scope,"question has its own browser counter");assert.ok(scopedModel,"question model is bounded");
    assert.equal(scope.totalModelCalls,0);assert.equal(scope.maxModelCalls,3);scopes.push(scope);
    for(let n=0;n<4;n++)await scopedModel.complete({taskId:"fixture",purpose:"fixture",promptVersion:"1",messages:[],responseFormat:"TEXT",outputSchema:{name:"fixture",version:"1"},timeoutMs:8000,fallback:"FAIL_CLOSED"});
    throw new Error("fourth model call must not return");
  }}),()=>"2026-10-28T02:00:00Z",500_000,searchBudget);
  const input:RestaurantPageQuestionRequest={requestId:"q1",question:"Do they take cards?",candidate:{restaurant:{id:"a",outletName:"Merchant",address:"Tokyo",sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH"},
    intent:{timezone:"Asia/Tokyo",target:{goal:"RECOMMENDATION",query:"merchant"},area:{query:"Tokyo"},criteria:[]},readContext:{runId:"run",startedAt:"2026-10-27T15:59:00Z",deadlineAt:"2026-10-28T02:01:00Z"}};
  for(const requestId of ["q1","q2"]){const result=await reader.answerQuestion({...input,requestId},new AbortController().signal);assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED","each question stops at its own model ceiling");}
  assert.equal(calls,6);assert.notEqual(scopes[0],scopes[1]);
  assert.deepEqual(searchBudget,{totalModelCalls:7,maxModelCalls:8},"the original search budget is not borrowed or overwritten");
});

test("question deadline actively cancels a pending read, without cancelling the next question",async()=>{
  assert.equal(RESTAURANT_PAGE_QUESTION_BUDGET.maxElapsedMs,60_000);
  let cancelled=false,reads=0;
  const model:ModelGateway={async complete(){throw new Error("no pages: no model call");}};
  const reader=new RestaurantPageQuestionReader(model,()=>({executionRoute:"GENERIC_BROWSER",async inspectFacts(_input,signal){
    reads++;
    if(reads===1){await new Promise<void>(resolve=>{if(signal.aborted)resolve();else signal.addEventListener("abort",()=>resolve(),{once:true});});cancelled=signal.aborted;signal.throwIfAborted();}
    return {evidence:[],factChecks:{},metadata:{provider:"RESTAURANT_WEBSITE",route:"GENERIC_BROWSER",latencyMs:0}};
  }}),()=>"2026-10-28T02:00:00Z",500_000,undefined,{...RESTAURANT_PAGE_QUESTION_BUDGET,maxElapsedMs:20});
  const input:RestaurantPageQuestionRequest={requestId:"slow",question:"Do they take cards?",candidate:{restaurant:{id:"a",outletName:"Merchant",address:"Tokyo",sourceIds:{},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH"},
    intent:{timezone:"Asia/Tokyo",target:{goal:"RECOMMENDATION",query:"merchant"},area:{query:"Tokyo"},criteria:[]},readContext:{runId:"run",startedAt:"2026-10-27T15:59:00Z",deadlineAt:"2026-10-28T02:01:00Z"}};
  const result=await reader.answerQuestion(input,new AbortController().signal);
  assert.ok(result.status==="UNVERIFIED"&&result.reason==="BUDGET_EXHAUSTED","expired read is unverified");assert.equal(cancelled,true);
  const next=await reader.answerQuestion({...input,requestId:"next"},new AbortController().signal);
  assert.ok(next.status==="UNVERIFIED"&&next.reason==="NO_BOUND_PAGE","the next question starts a fresh live scope");assert.equal(reads,2);
});

test("recorded R2-03 HIGH availability page supplies G1 instead of the Google Japanese website",async()=>{
  const {readFile}=await import('node:fs/promises');const {ObservedOutletNames}=await import('../restaurant-identity/observed-outlet-names.js');
  const fixture=JSON.parse(await readFile('src/harness/fixtures/seed-readiness/g1-english-page.json','utf8'));const html=await readFile('src/harness/fixtures/seed-readiness/g1-english-detail.html','utf8');
  const identity=fixture.identity,now=()=>new Date(Date.parse(identity.observedAt)+1000).toISOString();let reads=0,modelCalls=0;
  const model:ModelGateway={async complete(){modelCalls++;return {invocationId:'constructed-answer',provider:'FIXTURE',model:'fixture',outputText:JSON.stringify({status:'NOT_STATED',answer:null,citations:[],sensitiveCategory:'NONE',sourceConflict:false}),finishReason:'TOOL_CALLS',latencyMs:0};}};
  const reader=new RestaurantPageQuestionReader(model,()=>({executionRoute:'GENERIC_BROWSER',async inspectFacts(){reads++;return {evidence:[],factChecks:{},metadata:{provider:'RESTAURANT_WEBSITE',route:'GENERIC_BROWSER',latencyMs:0}};}}),now);
  const page={url:fixture.page.url,title:'Recorded English outlet',text:fixture.page.merchantText,html,settlement:'SETTLED' as const};
  const names=new ObservedOutletNames({openSession:async()=>({snapshot:async()=>page} as never)},now);
  const runId='recorded-availability';
  await names.capture(async()=>{const session=await names.runtime.openSession({signal:new AbortController().signal});await session.snapshot();return {evidence:[identity]};},{readRunId:runId,observe:p=>reader.retainBoundPage(p)});
  const input:RestaurantPageQuestionRequest={requestId:'constructed-question',question:'Does the page describe an outside-cake policy?',candidate:{restaurant:{id:identity.candidateId,outletName:fixture.delivered.name,address:fixture.delivered.address,sourceIds:{googleWebsiteUri:'https://tabelog.com/tokyo/A1304/A130401/13321661/'},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'HIGH'},intent:{timezone:'Asia/Tokyo',target:{goal:'AVAILABILITY',query:fixture.delivered.name},criteria:[]},readContext:{runId,startedAt:identity.observedAt,deadlineAt:new Date(Date.parse(now())+60000).toISOString()}};
  const answer=await reader.answerQuestion(input,new AbortController().signal);
  assert.equal(answer.status,'NOT_STATED',JSON.stringify({answer,reads,modelCalls,cached:reader.currentPages(input.readContext,identity.candidateId).length}));assert.equal(reads,0,'already HIGH-bound English page requires no Japanese website read');assert.equal(modelCalls,1);assert.equal(answer.checkedPages[0]?.url,page.url);
});

test('production assembly retains recorded availability page for G1 even when Google website points to Japanese',async()=>{
  const {readFile}=await import('node:fs/promises');const {createLiveReadAssembly}=await import('../restaurant-search/live-read-assembly.js');
  const {GooglePlacesClient}=await import('../google/google-places-client.js');const {tabelogDiscoveryPack}=await import('../restaurant-search/source-packs.js');
  const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
  const recorded=JSON.parse(await readFile('src/harness/fixtures/seed-readiness/g1-english-page.json','utf8'));
  const response=JSON.parse(await readFile('src/harness/fixtures/seed-readiness/g1-vacancy-response.json','utf8'));
  const html=await readFile('src/harness/fixtures/seed-readiness/g1-english-detail.html','utf8');
  const at=recorded.identity.observedAt,seen:string[]=[];
  const candidate={restaurant:{id:recorded.identity.candidateId,outletName:recorded.delivered.name,address:recorded.delivered.address,
    sourceIds:{googleWebsiteUri:'https://tabelog.com/tokyo/A1304/A130401/13321661/',tabelog:recorded.identity.sourceEntityId,tabelogNativeDetailUri:recorded.page.url},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'HIGH' as const};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs:[tabelogDiscoveryPack]},
    {clock:{now:()=>new Date(at)},google:new GooglePlacesClient({apiKey:'fixture-only',fetchImplementation:async()=>{throw Error('No external Google read');}}),
      model:{async complete(request){const isQuestion=request.purpose==='restaurant_page_question';return {invocationId:'constructed-component',provider:'FIXTURE',model:'fixture',finishReason:'TOOL_CALLS',latencyMs:0,outputText:JSON.stringify(isQuestion?{status:'NOT_STATED',answer:null,citations:[],sensitiveCategory:'NONE',sourceConflict:false}:{action:'COMPLETE',targetRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'LOCAL_CONSTRUCTION: captured public inventory'})};}},
      browser:{readNetworkBoundaryCapability:'ISOLATED_CONTEXT',async openSession(){return {metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:at,readNetworkBoundary:'INSTALLED'},async navigate(url){seen.push(url);},async snapshot(){return{url:recorded.page.url,title:'Recorded outlet',text:recorded.page.merchantText,html,settlement:'SETTLED',responses:[response]};},async observeControls(){return[];},async click(){},async fill(){},async select(){return[];},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};}}});
  const signal=new AbortController().signal,runId='assembly-recorded-run';assembly.availability.beginReadRun();
  try{const read=await assembly.availability.check({selectionScope:'SPECIFIC_OUTLET',candidateIds:[candidate.restaurant.id],candidates:[candidate],date:'2026-11-22',timeWindow:{earliest:'12:30',latest:'12:30'},partySize:3,hardCriteria:[]},signal,runId);
    assert.equal(read.availabilityChecks[candidate.restaurant.id]?.status,'AVAILABLE');
    assert.ok(read.evidence.some(e=>e.kind==='ENTITY_MATCH'&&e.entityMatch?.confidence==='HIGH'));
    const before=seen.length;
    const answer=await assembly.questions.answerQuestion({requestId:'constructed-question',question:'Does the page describe an outside-cake policy?',candidate,intent:{timezone:'Asia/Tokyo',criteria:[]},readContext:{runId,startedAt:at,deadlineAt:new Date(Date.parse(at)+60000).toISOString()}},signal);
    assert.equal(answer.status,'NOT_STATED',JSON.stringify(answer));assert.equal(seen.length,before,'same-run bound English page needs no new read');assert.equal(answer.checkedPages[0]?.url,recorded.page.url);
  }finally{await assembly.availability.endReadRun();}
});

test('availability page cache rejects LOW, ambiguous, stale-run and mismatched entities; PENDING refresh uses exact bound URL once',async()=>{
  const {readFile}=await import('node:fs/promises');const {ObservedOutletNames}=await import('../restaurant-identity/observed-outlet-names.js');
  const f=JSON.parse(await readFile('src/harness/fixtures/seed-readiness/g1-english-page.json','utf8')),html=await readFile('src/harness/fixtures/seed-readiness/g1-english-detail.html','utf8');
  const at=f.identity.observedAt,runId='same-run';
  for(const mode of ['LOW','AMBIGUOUS','OTHER_ENTITY','OTHER_RUN','PENDING'] as const){
    let reads=0,models=0;const reader=new RestaurantPageQuestionReader({async complete(){models++;throw Error('Unverified page must not reach model');}},observe=>({executionRoute:'GENERIC_BROWSER',async inspectFacts(input){reads++;if(mode==='PENDING')assert.equal(input.candidates[0]?.restaurant.sourceIds.tabelogNativeDetailUri,f.page.url,'refresh uses exact HIGH-bound English URL');return{evidence:[],factChecks:{},metadata:{provider:'RESTAURANT_WEBSITE',route:'GENERIC_BROWSER',latencyMs:0}};}}),()=>at);
    const page={url:f.page.url,title:'Recorded source',text:f.page.merchantText,html,settlement:mode==='PENDING'?'PENDING' as const:'SETTLED' as const};
    const identity=structuredClone(f.identity);if(mode==='LOW')identity.entityMatch.confidence='LOW';if(mode==='OTHER_ENTITY')identity.sourceEntityId='different-entity';
    const names=new ObservedOutletNames({openSession:async()=>({snapshot:async()=>page} as never)},()=>at);
    await names.capture(async()=>{await(await names.runtime.openSession({signal:new AbortController().signal})).snapshot();return{evidence:mode==='AMBIGUOUS'?[identity,{...identity,evidenceId:'conflict',sourceEntityId:'different-entity'}]:[identity]};},{readRunId:mode==='OTHER_RUN'?'prior-run':runId,observe:p=>reader.retainBoundPage(p)});
    const answer=await reader.answerQuestion({requestId:mode,question:'Does the page describe an outside-cake policy?',candidate:{restaurant:{id:identity.candidateId,outletName:f.delivered.name,address:f.delivered.address,sourceIds:{googleWebsiteUri:'https://tabelog.com/tokyo/A1304/A130401/13321661/'},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'HIGH'},intent:{timezone:'Asia/Tokyo',criteria:[]},readContext:{runId,startedAt:at,deadlineAt:new Date(Date.parse(at)+60000).toISOString()}},new AbortController().signal);
    assert.equal(answer.status,'UNVERIFIED',mode);assert.equal(models,0,mode);assert.equal(reads,1,mode+' never loops acquisition');
    if(mode==='PENDING')assert.ok(answer.status==='UNVERIFIED'&&answer.reason==='INCOMPLETE_PAGE');
  }
});
