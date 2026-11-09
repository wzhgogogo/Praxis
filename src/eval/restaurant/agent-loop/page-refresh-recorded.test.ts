import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {parse} from 'parse5';
import {createLiveReadAssembly} from '../../../integrations/restaurant-search/live-read-assembly.js';
import {LIVE_READ_DEBUG_INVESTIGATION_BUDGET} from '../../../application/live-read-investigation-budget.js';
import type {RestaurantCandidate} from '../../../domains/restaurant/contracts.js';
import type {BrowserRuntime,BrowserSnapshot} from '../../../infrastructure/browser/browser-runtime.js';
import type {ModelGateway} from '../../../core/model/contracts.js';
// Real exposed DOM components, original bytes unchanged. Fresh settlement,
// clock, session and model response below are LOCAL_CONSTRUCTION. Not Live.
function visibleLines(html:string){
 const lines:string[]=[];
 const walk=(v:any)=>{if(['script','style','noscript','template'].includes(v.tagName))return;
  if(v.nodeName==='#text')lines.push(v.value);
  for(const child of v.childNodes??[])walk(child);
  if(['div','p','td','tr','h1','h2','h3','li','section','br'].includes(v.tagName))lines.push('\n');
 };walk(parse(html));return lines.join(' ').split('\n').map(s=>s.replace(/\s+/gu,' ').trim()).filter(Boolean).join('\n');
}
async function recorded(source:'D4'|'D8',stillPending=false,otherCurrentPage=false){
 const root=resolve(source==='D4'?'.eval-artifacts/phase3b/d4-d8-live-20261106/snapshot-fix-D4-runtime/runs/D4/D4':'.eval-artifacts/phase3b/d8-direct-outlet-live-20261109/live-runtime/runs/D8/D8');
 const run=source==='D4'?'g6-D4-1793957094537-0':'g6-D8-1794193392450-0',snapshot=source==='D4'?'0024':'0041';
 const original=JSON.parse(await readFile(join(root,'execution.result.json'),'utf8'));
 const candidate:RestaurantCandidate=structuredClone(original.view.restaurant.candidates.find((c:RestaurantCandidate)=>source==='D4'?c.restaurant.sourceIds.tabelog?.endsWith('13108466'):c.restaurant.id===original.view.restaurant.presentedCandidateIds[0]));assert.ok(candidate);
 if(source==='D8'){const bound=original.view.restaurant.readEvidence.find((e:any)=>e.kind==='ENTITY_MATCH'&&e.provider==='TABLECHECK'&&e.candidateId===candidate.restaurant.id&&e.entityMatch?.confidence==='HIGH');assert.ok(bound);candidate.restaurant.sourceIds={tablecheck:bound.sourceEntityId,tablecheckNativeGuideUri:bound.sourceUrl};}
 const html=await readFile(join(root,'recordings',run,'diagnostic',`snapshot-${snapshot}.html`),'utf8');
 const url=candidate.restaurant.sourceIds.tabelogNativeDetailUri??candidate.restaurant.sourceIds.tablecheckNativeGuideUri!;
 const stamp='2030-01-01T10:00:00.000Z',page:BrowserSnapshot={url,title:candidate.restaurant.outletName,text:visibleLines(html),html,settlement:'PENDING'};
 let refresh=false,waits=0,snapshots=0,models=0;const navigations:string[]=[];
 const runtime:BrowserRuntime={async openSession(input){let current=refresh&&otherCurrentPage?'about:blank':url;return {
  metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:stamp},
  async navigate(target){navigations.push(target);current=target;},async snapshot(){snapshots++;input.signal.throwIfAborted();return {...page,url:current};},
  async waitForSettled(){if(refresh){waits++;if(!stillPending)page.settlement='SETTLED';}return refresh&&!stillPending;},
  async observeControls(){return[];},async click(){throw Error('No interaction authorized');},async fill(){throw Error('No interaction authorized');},async select(){return[];},async waitFor(){},async screenshot(){return new Uint8Array();},async close(){},
 };}};
 const model:ModelGateway={async complete(request){models++;assert.equal(request.purpose,'restaurant_page_question');
  const docs=JSON.parse(request.messages[1]!.content).sourceDocuments as Array<{id:string;statements:Array<{id:string;text:string}>}>;
  const document=docs.find(d=>d.statements.some(s=>s.text==='Private rooms')),statement=document?.statements.find(s=>s.text==='Unavailable');
  const answer=source==='D4'?{status:'ANSWERED',answer:'Private rooms: Unavailable.',sensitiveCategory:'NONE',sourceConflict:false,
   citations:[{documentId:document!.id,statementId:document!.statements.find(s=>s.text==='Private rooms')!.id,quote:'Private rooms'},{documentId:document!.id,statementId:statement!.id,quote:statement!.text}]}
   :{status:'NOT_STATED',answer:null,sensitiveCategory:'NONE',sourceConflict:false,citations:[]};
  return {invocationId:'LOCAL_CONSTRUCTION',provider:'FIXTURE',model:'fixture',finishReason:'TOOL_CALLS',latencyMs:0,outputText:JSON.stringify(answer)};
 }};
 const assembly=createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET,{model,browser:runtime,google:{} as Parameters<typeof createLiveReadAssembly>[1]['google'],clock:{now:()=>new Date(stamp)}});
 const input={requestId:'recorded-refresh',question:source==='D4'?'Does this restaurant have a private room?':'What is the cancellation policy?',candidate,
  intent:{timezone:'Asia/Tokyo' as const,criteria:[]},readContext:{runId:'component:'+run,startedAt:stamp,deadlineAt:'2030-01-01T10:01:00.000Z'}};
 await assembly.facts.inspectFacts({candidateIds:[candidate.restaurant.id],candidates:[candidate],intent:input.intent,readRunId:input.readContext.runId},new AbortController().signal);
 assert.equal(assembly.questions.currentPages(input.readContext,candidate.restaurant.id)[0]?.snapshot.settlement,'PENDING');
 refresh=true;const before={snapshots,navigations:navigations.length};
 return {assembly,input,html,before,get waits(){return waits;},get snapshots(){return snapshots;},get models(){return models;},navigations};
}
test('D4 PRIVATE_ROOM recorded DOM: one current-page reobservation replaces incomplete capture and returns exact citations',async()=>{
 const f=await recorded('D4'),answer=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
 assert.equal(answer.status,'ANSWERED');if(answer.status==='ANSWERED'){assert.ok(answer.citations.some(c=>c.text==='Private rooms'));assert.ok(answer.citations.some(c=>c.text==='Unavailable'));}
 assert.equal(f.navigations.length,f.before.navigations);assert.equal(f.waits,1);assert.equal(f.models,1);assert.ok(f.snapshots-f.before.snapshots<=3);
});
test('D8 terms recorded DOM: one refresh captures a complete same-outlet page and missing policy stays NOT_STATED',async()=>{
 const f=await recorded('D8');await f.assembly.questions.captureBookingPages(f.input,new AbortController().signal);
 const pages=f.assembly.questions.currentPages(f.input.readContext,f.input.candidate.restaurant.id);
 const answer=await f.assembly.questions.answerBookingQuestion(f.input,pages,new AbortController().signal);
 assert.equal(answer.status,'NOT_STATED');assert.equal(f.waits,1);assert.equal(f.navigations.length,f.before.navigations);
});
test('real DOM with constructed still-PENDING refresh never reaches the answer model; changed current page opens only exact bound URL',async()=>{
 for(const source of ['D4','D8']as const){const f=await recorded(source,true,true),answer=await f.assembly.questions.answerQuestion(f.input,new AbortController().signal);
  assert.ok(answer.status==='UNVERIFIED'&&answer.reason==='INCOMPLETE_PAGE');assert.equal(f.models,0);assert.equal(f.waits,2,'One navigation sample plus one reobservation, no capture loop');assert.equal(f.navigations.length,f.before.navigations+1);
  assert.equal(f.navigations.at(-1),f.input.candidate.restaurant.sourceIds.tabelogNativeDetailUri??f.input.candidate.restaurant.sourceIds.tablecheckNativeGuideUri);
 }
});
