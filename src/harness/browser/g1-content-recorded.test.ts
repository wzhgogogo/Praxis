import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {ModelGateway} from '../../core/model/contracts.js';
import {createLiveReadAssembly} from '../../integrations/restaurant-search/live-read-assembly.js';
import {LIVE_READ_DEBUG_INVESTIGATION_BUDGET} from '../../application/live-read-investigation-budget.js';
import {recordedHtml,recordedRuntime,recordedUrl,recordedQuote,recordedAt,candidate} from './fixtures/recorded-g1-query.js';

const cases = (['stable','thirteenth-body','aged-fetch','changing-body'] as const).flatMap(mode => [false,true].map(refresh => ({mode,refresh,kind:'LOCAL' as const})));
const cloudflareCases = (['stable','aged-fetch'] as const).flatMap(mode => [false,true].map(refresh => ({mode,refresh,kind:'CLOUDFLARE' as const})));
for(const {mode,refresh,kind} of [...cases,...cloudflareCases])test(`G1 ${kind} recorded DOM/CSS ${mode}, ${refresh?'reobservePageOnce':'initial capture'} uses current body evidence`,{timeout:20000},async()=>{
 const prefix=mode==='thirteenth-body'?Array.from({length:12},()=>'<span class="skeleton" style="display:block;width:8px;height:8px;opacity:0"></span>').join('')+'<p aria-busy="true">Merchant terms are loading</p>':'';
 const script=mode==='aged-fetch'?"fetch('https://production.tablecheck.com/v2/shops/fixture-content?locale=en').catch(()=>{})":mode==='changing-body'?"const p=document.createElement('p');document.body.append(p);setInterval(()=>p.textContent='Merchant update '+Date.now(),100)":'';
 const fixture=await recordedRuntime(await recordedHtml(script,prefix),{agedFetch:mode==='aged-fetch',kind});let modelCalls=0;
 const model:ModelGateway={async complete(request){modelCalls++;assert.equal(request.purpose,'restaurant_page_question');const docs=JSON.parse(request.messages[1]!.content).sourceDocuments;const doc=docs.find((d:any)=>d.statements.some((s:any)=>s.text===recordedQuote));assert.ok(doc,'Original recorded merchant heading must be in the complete document');const row=doc.statements.find((s:any)=>s.text===recordedQuote);
  return {invocationId:'LOCAL_CONSTRUCTION',provider:'FIXTURE',model:'fixture',latencyMs:0,finishReason:'TOOL_CALLS',outputText:JSON.stringify({status:'ANSWERED',answer:recordedQuote+'.',sensitiveCategory:'NONE',sourceConflict:false,citations:[{documentId:doc.id,statementId:row.id,quote:row.text}]})};}};
 const assembly=createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET,{model,browser:fixture.runtime,google:{} as Parameters<typeof createLiveReadAssembly>[1]['google'],clock:{now:()=>new Date(recordedAt)}});
 const input={requestId:'recorded-body',candidate:structuredClone(candidate),question:'What is the restaurant name?',intent:{timezone:'Asia/Tokyo' as const,criteria:[]},readContext:{runId:'body:'+mode+':'+refresh,startedAt:recordedAt,deadlineAt:'2030-01-01T00:00:00.000Z'}};
 try{
  // Direct capture-only exercises both acquisition paths; subsequent answer
  // uses the actual retained native page, never hand-assembled HIGH evidence.
  await assembly.facts.inspectFacts({candidateIds:[candidate.restaurant.id],candidates:[input.candidate],intent:input.intent,readRunId:input.readContext.runId,capturePagesOnly:true,...(refresh?{reobservePageOnce:true as const}:{})},new AbortController().signal);
  const pages=assembly.questions.currentPages(input.readContext,candidate.restaurant.id);assert.ok(pages.length,'Identity-bound page must be retained even if incomplete');
  if(mode==='aged-fetch'){assert.ok(fixture.snapshots.some(s=>s.settlement==='SETTLED'&&s.settlementDiagnostics?.blockingDataRequests===0&&(s.settlementDiagnostics.pendingByType.fetch??0)>0&&s.settlementDiagnostics.oldestPendingMs>=3000));}
  if(mode==='thirteenth-body')assert.ok(fixture.snapshots.some(s=>s.settlementDiagnostics?.busySelectors.length===12&&!s.settlementDiagnostics.busySelectors.includes('[aria-busy="true"]')&&s.settlementDiagnostics.contentBusySelectors?.includes('[aria-busy="true"]')),'Filter all DOM blockers before the diagnostic cap');
  if(mode==='stable'){
   assert.ok(fixture.snapshots.some(s=>s.settlementDiagnostics?.busySelectors.length===9),'Original opaque map marker plus eight faded images remain generic blockers');
   const answer=await assembly.questions.answerBookingQuestion(input,pages,new AbortController().signal);assert.equal(answer.status,'ANSWERED',JSON.stringify({answer,pages:pages.map(p=>({settlement:p.snapshot.settlement,diagnostics:p.snapshot.settlementDiagnostics}))}));assert.equal(modelCalls,1);assert.ok(answer.status==='ANSWERED'&&answer.citations.some(c=>c.text===recordedQuote));
  }else{const answer=await assembly.questions.answerBookingQuestion(input,pages,new AbortController().signal);assert.ok(answer.status==='UNVERIFIED'&&answer.reason==='INCOMPLETE_PAGE',JSON.stringify(answer));assert.equal(modelCalls,0);}
 }finally{await fixture.close();}
});
