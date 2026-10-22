import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {planDiscoverySources,advanceDiscoveryPlan} from '../../src/domains/restaurant/discovery-planner.ts';
import {restaurantDiscoveryPacks} from '../../src/integrations/restaurant-search/source-packs.ts';
import {TableCheckBrowserAvailability} from '../../src/integrations/tablecheck/tablecheck-browser-availability.ts';
import {tableCheckPublicReadNetworkPolicy} from '../../src/integrations/tablecheck/tablecheck-public-query.ts';
import {tabelogAvailabilityCompletion} from '../../src/integrations/tabelog/tabelog-browser-availability.ts';
import {tabelogQueryControlHints} from '../../src/integrations/tabelog/tabelog-query-controls.ts';
import {BrowserTaskExecutor} from '../../src/infrastructure/browser/browser-task-executor.ts';
import {BrowserRuntimeError} from '../../src/infrastructure/browser/browser-runtime-errors.ts';
import {isBrowserReadPathProhibited} from '../../src/infrastructure/browser/browser-read-policy.ts';
const dir='.eval-artifacts/group-window-fix-20261022',sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
let external=0;globalThis.fetch=()=>{external++;throw Error('OFFLINE_ONLY');};
const freeze=await read(`${dir}/freeze.json`);const verify=async()=>{for(const [p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
const input=await read(`${dir}/replay-inputs.json`),rows=[];
function mock(page,controls){
 const navigations=[],attempts=[];let followupActions=0;
 const runtime={async openSession({networkPolicy}){return{metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:'2026-10-22T00:00:00Z',readNetworkBoundary:'INSTALLED'},
 async prepareNavigation(url){attempts.push(url);if(isBrowserReadPathProhibited(networkPolicy,url))throw Error('PROHIBITED_PREPARE');},
 async navigate(url){navigations.push(url);assert.equal(new URL(url).pathname,new URL(page.url).pathname,'only the recorded guide exists in this replay');},
 async snapshot(){return structuredClone(page);},async observeControls(){return structuredClone(controls);},async captureResponses(){},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){},
 async click(){followupActions++;throw new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','SAVED_FOLLOWUP_OBSERVATION_MISSING');},async select(){followupActions++;throw new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','SAVED_FOLLOWUP_OBSERVATION_MISSING');},async fill(){throw Error('NO_FILL_IN_REPLAY');}};}};
 return{runtime,navigations,attempts,followups:()=>followupActions};
}
for(const run of input.runs){
 const raw=await read(run.source.path),state=raw.finalSnapshot.domainState,recording=await read(run.recording);
 const snapshots=recording.entries.filter(e=>e.kind==='SNAPSHOT'),base=path.dirname(run.recording);
 async function observed(doc){
  const meta=snapshots[doc.snapshot-1],bytes=await fs.readFile(path.join(base,doc.file));assert.equal(meta.detail.url,doc.url);
  const identical=new Set(snapshots.filter(s=>s.detail.htmlSha256===meta.detail.htmlSha256&&s.detail.url===doc.url).map(s=>s.sequence));
  const cs=recording.entries.find(e=>e.kind==='CONTROLS'&&identical.has(e.detail.snapshotSequence));
  const html=bytes.toString(),text=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return{page:{url:doc.url,title:meta.detail.title,html,text,responses:meta.detail.responses??[],settlement:'SETTLED'},controls:cs?.detail.controls??[],provenance:{htmlPath:path.join(base,doc.file),htmlSha256:sha(bytes),snapshot:doc.snapshot,runtimeHtmlSha256:meta.detail.htmlSha256,controlsSequence:cs?.sequence??null,visibleText:'STRUCTURED_HTML_RECONSTRUCTION; not a fresh visible-page observation'}};
 }
 const request={...run.request,candidateIds:[],candidates:[],hardCriteria:[]};
 let plan=planDiscoverySources(state.intent,state.searchContinuation.locationContext,restaurantDiscoveryPacks.map(p=>p.meta),raw.startedAt);
 assert.equal(plan.entries[0].sourceId,'tabelog');
 const projected=[],consumed=new Map();
 for(let limit=0;limit<12&&plan.entries[plan.cursor];limit++){
  const entry=plan.entries[plan.cursor],n=consumed.get(entry.sourceId)??0;
  const saved=run.searchReads.filter(r=>r.source?.toLowerCase().replace('google_places','google-places')===entry.sourceId)[n];
  if(!saved){projected.push({source:entry.sourceId,batch:n+1,status:'BLOCKED_BY_RECORDING_GAP',reason:'This source response was never read in the original run. No empty list or witness admission is fabricated.'});break;}
  projected.push({source:entry.sourceId,batch:n+1,status:'RECORDED_BATCH_BOUNDARY_REPLAY',candidateIds:saved.candidateIds,pendingDetails:saved.pendingDetails,sourceEnded:saved.funnel.sourceEnded});
  consumed.set(entry.sourceId,n+1);plan=advanceDiscoveryPlan(plan,saved.funnel.sourceEnded);
 }
 const restricted=[];
 for(const id of [...new Set(run.operationFailures.filter(f=>/prohibited source workflow/.test(f.message)).map(f=>f.candidateId))]){
  const candidate=state.candidates.find(c=>c.restaurant.id===id),url=candidate?.restaurant.sourceIds.tablecheckNativeGuideUri;
  if(!candidate||!url){restricted.push({candidateId:id,status:'NOT_EVALUATED_MISSING_GUIDE'});continue;}
  const doc=recording.documents.filter(d=>d.url===url).at(-1);assert.ok(doc);
  const o=await observed(doc),f=mock(o.page,o.controls),result=await new TableCheckBrowserAvailability(f.runtime,()=>raw.startedAt,{networkPolicy:tableCheckPublicReadNetworkPolicy}).check({...request,candidateIds:[id],candidates:[candidate]},new AbortController().signal);
  const check=result.availabilityChecks[id];assert.equal(check.status,'SOURCE_UNSUPPORTED',JSON.stringify({id,check}));assert.equal(f.attempts.some(url=>isBrowserReadPathProhibited(tableCheckPublicReadNetworkPolicy,url)),false);
  restricted.push({candidateId:id,check,navigations:f.navigations,provenance:o.provenance});
 }
 let timeReplay={status:'NOT_REACHED_IN_ORIGINAL_RUN'};
 const point=run.confirmedPartySnapshots.find(u=>u.candidateId.startsWith('tablecheck:')&&u.emptyMessagePrefix);
 if(point){
  const candidate=state.candidates.find(c=>c.restaurant.id===point.candidateId),doc=recording.documents.find(d=>d.snapshot===point.snapshot),o=await observed(doc),f=mock(o.page,o.controls);
  const executor=new BrowserTaskExecutor(f.runtime,{maxAutomaticElapsedMs:30000,maxModelCallsPerCandidate:6,maxModelCallsTotal:6,maxOperationsPerCandidate:120});
  try{const result=await new TableCheckBrowserAvailability(executor,()=>raw.startedAt,{networkPolicy:tableCheckPublicReadNetworkPolicy}).check({...request,candidateIds:[point.candidateId],candidates:[candidate]},new AbortController().signal);
   const check=result.availabilityChecks[point.candidateId];assert.equal(check.status,'UNKNOWN');assert.ok(check.timeWindowCoverage?.covered.length===1,JSON.stringify(check));assert.ok(check.timeWindowCoverage.uncovered.length);assert.equal(result.offers.length,0);
   timeReplay={status:'PASS_PARTIAL_SCOPE_ONLY',candidateId:point.candidateId,check,followupActions:f.followups(),provenance:o.provenance,limitation:'Only this bound point is recorded; later menu/result transitions are absent. Unknown portions stay unknown. Synthetic local Chromium independently proves the continuation mechanism.'};
  }finally{await executor.close();}
 }
 let partyReplay={status:'NOT_REACHED_NO_TABELOG_DISABLED_REQUESTED_PARTY'};
 const disabled=run.uiSnapshots.find(u=>u.guestButtons?.some(b=>Number(b.label)===run.request.partySize&&b.disabled));
 if(disabled){
  const doc=recording.documents.find(d=>d.snapshot===disabled.snapshot),o=await observed(doc);assert.ok(o.controls.length,'exact recorded controls required');
  const candidate=state.candidates.find(c=>c.restaurant.id===disabled.candidateId),f=mock(o.page,o.controls);let models=0;
  const executor=new BrowserTaskExecutor(f.runtime,{maxAutomaticElapsedMs:30000,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,maxOperationsPerCandidate:30,modelDecision:{async decide(){models++;return{type:'REQUEST_HUMAN_HELP',reason:'No new model in saved replay'};}}});
  try{const session=await f.runtime.openSession({}),result=await executor.runSkill({taskId:run.id,source:'TABELOG',stage:'AVAILABILITY',session,signal:new AbortController().signal,allowedOrigins:[new URL(o.page.url).origin],goal:{outlet:{name:candidate.restaurant.outletName,address:candidate.restaurant.address},...run.request,hardCriteria:[]},objective:'Apply exact request',controlHints:tabelogQueryControlHints,completion:page=>tabelogAvailabilityCompletion(page,run.request)});
   assert.equal(result.reasonCode,'PARTY_SIZE_NOT_SELECTABLE',JSON.stringify({controls:o.controls,result}));assert.equal(models,0);assert.equal(f.followups(),0);
   partyReplay={status:'PASS_DISABLED_PARTY_UNKNOWN',candidateId:disabled.candidateId,reasonCode:result.reasonCode,modelDecisions:models,actions:0,provenance:o.provenance};
  }finally{await executor.close();}
 }
 rows.push({id:run.id,originalSearchOrder:run.searchReads.map(r=>r.source),newFirstSource:'tabelog',earlierTabelogAttempt:true,projectedBatchOrder:projected,schedulingScope:'Current production Planner at saved batch boundary. First source attempt changes; absent source responses and new Agent choices are NOT_EVALUATED, not a new full task replay.',restricted,timeReplay,partyReplay,originalModels:raw.modelInvocations.length,newModels:0,newWebsites:0,newLive:0});
 console.log(JSON.stringify({id:run.id,newFirstSource:'tabelog',restricted:restricted.length,time:timeReplay.status,party:partyReplay.status}));
}
await verify();assert.equal(external,0);
await fs.writeFile(`${dir}/saved-replay-results.json`,JSON.stringify({schema:'group-window-saved-replay@1',mode:'OFFLINE_COMPONENT_SAVED_HTML_CONTROLS_AND_BATCH_BOUNDARIES',rows,newModels:0,externalRequests:external,newLive:0,fullTaskOutcome:'NOT_EVALUATED',safety:'No external dispatch in replay; production network permission is independently covered by local Chromium controls, not proven by this mock metadata.'},null,2)+'\n',{flag:'wx'});
