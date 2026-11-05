// Offline actual-source Replay: ordinary persistent G6/Live assembly; fixed model
// transport only, original semantic bytes and qualified HAR/Google bytes. No
// fabricated pages, accepted evidence, business-port overrides or live fallback.
import assert from 'node:assert/strict';
import type {ModelGateway} from '../../../../core/model/contracts.js';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {LocalPlaywrightChromium} from '../../../../infrastructure/browser/local-playwright-chromium.js';
import {chromium} from 'playwright-core';
import {loadReplayRecording,recordedResponse} from '../../../../eval/restaurant/agent-loop/runners/replay-read-recording.js';
import {createG6Session,G6_USER} from '../../../../eval/restaurant/agent-loop/g6/session.js';
import {GooglePlacesClient} from '../../../../integrations/google/google-places-client.js';
import {tabelogDiscoveryPack,googlePlacesDiscoveryPack} from '../../../../integrations/restaurant-search/source-packs.js';
import {safeUrl} from '../../../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
const root=new URL('../../../../../.eval-artifacts/phase3b/d4-d8-real-pages-20261105/stop3/',import.meta.url),id=process.argv[2];assert.ok(['D4','D8'].includes(id!));
const folder=await mkdtemp(join(tmpdir(),'whole-real-replay-'));
const calls:any[]=[],stops:any[]=[],browserActions:any[]=[],diagnostics:any[]=[],sessions:any[]=[];
let session:Awaited<ReturnType<typeof createG6Session>>|undefined;
const original=JSON.parse(await readFile(new URL(`source-inputs/${id}-execution.result.json`,root),'utf8'));
const turns=JSON.parse(await readFile(new URL(`source-inputs/${id}-user-turns.json`,root),'utf8'));
const oldModels=(await readFile(new URL(`source-inputs/${id}-execution.decisions.jsonl`,root),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
const firstSemantic=oldModels.find(r=>r.purpose==='restaurant_semantic_interpret');
const start=performance.now(),epoch=Date.parse(firstSemantic.startedAt),clock={now:()=>new Date(epoch+performance.now()-start)};
const recordings=[];
for(const path of id==='D4'?['recordings/D4-FIRST-DETAIL/source','recordings/D4-RETRIEVAL-OBSERVED/source','recordings/D4-CAPTURE-APPROVED/source','../stop2/recordings/W1-NODE/source','source-inputs/D4']:['../recordings/B-TABELOG/source','source-inputs/D8']){
 recordings.push(await loadReplayRecording(resolve(new URL(path+'/',root).pathname),join(folder,`qualified-${recordings.length}.har`)));
}
const allowed=new Set(recordings.flatMap(r=>[...r.allowed])),seen=new Set<string>(),entries:any[]=[];
for(const r of recordings)for(const e of r.entries){const key=JSON.stringify([e.request.url,e.request.method,e.request.postData?.text??'']);if(!seen.has(key)){seen.add(key);entries.push(e);}}
const merged={...recordings[0]!,allowed,entries};
const har=join(folder,'source.har');await writeFile(har,JSON.stringify({log:{version:'1.2',creator:{name:'actual qualified recording union',version:'1'},entries}}));
const runtime=new LocalPlaywrightChromium({proxyServer:'http://127.0.0.1:9',browserType:{async launch(options){
 const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
 browser.newContext=async options=>{const context=await newContext(options),fromHar=context.routeFromHAR.bind(context);
  context.routeFromHAR=async(...args)=>{await fromHar(...args);await context.route('**/*',async route=>{
   const q=route.request(),url=q.url();
   const reason=q.resourceType()==='document'&&!allowed.has(url)?'DOCUMENT_NOT_QUALIFIED':!recordedResponse(merged,url,q.method(),q.postData()??undefined)?'MISSING_RESPONSE':undefined;
   if(reason){stops.push({reason,url:safeUrl(url),queryKeys:[...new URL(url).searchParams.keys()],method:q.method(),type:q.resourceType()});await route.abort('blockedbyclient');if(q.resourceType()==='document')void context.close().catch(()=>{});}else await route.fallback();
  });};return context;};return browser;}}});
const browser={readNetworkBoundaryCapability:runtime.readNetworkBoundaryCapability,async openSession(input:any){const raw=await runtime.openSession({...input,replayHarPath:har});sessions.push(raw);return new Proxy(raw,{get(target,key){const value=Reflect.get(target,key,target);if(typeof value!=='function')return value;return async(...args:any[])=>{if(['prepareNavigation','prepareObservedNavigation','navigate','openLink','fill','click','select'].includes(String(key)))browserActions.push({method:String(key),args:args.slice(0,2)});const result=await value.apply(target,args);if(key==='snapshot'&&!allowed.has(result.url))throw Error('UNQUALIFIED_SNAPSHOT');return result;};}});}};
const google=new GooglePlacesClient({apiKey:'OFFLINE_NO_SECRET',fetchImplementation:async(url,init)=>{
 const e=recordedResponse(merged,String(url),init?.method??'GET',init?.body);
 if(!e){stops.push({reason:'MISSING_GOOGLE_RESPONSE',url:safeUrl(String(url)),body:init?.body});throw Error('OFFLINE_MISSING_GOOGLE_RESPONSE');}
 return new Response(e.response.content.text,{status:e.response.status,headers:{'content-type':e.response.content.mimeType}});
}});
const strict=(type:string,ids:string[]=[])=>({type,question:'',relatedFields:[],retrievalHint:'',candidateIds:ids,candidateId:'',offerId:'',decisionSummary:'Deterministic Replay model transport; no inferred source facts.'});
let agentSteps=0; const openedDetails=new Set<string>(); let resultList:string|undefined;
const model:ModelGateway={async complete(request:any){let payload:any;try{payload=JSON.parse(request.messages.find((m:any)=>m.role==='user').content)}catch{payload={}}let body:any;
 if(request.purpose==='restaurant_semantic_interpret')body=JSON.parse(firstSemantic.outputText);
 else if(request.purpose==='restaurant_discovery_retrieval')body=payload.current?{choice:'KEEP',keyword:'',criterionRef:'',generalRef:'',categoryUrl:'',reason:'Replay keeps observed query'}:JSON.parse(oldModels.find(r=>r.purpose===request.purpose)?.outputText??'null');
 else if(request.purpose==='restaurant_named_source_query')body=JSON.parse(oldModels.find(r=>r.purpose===request.purpose&&String(request.messages[1]?.content).includes(JSON.parse(r.outputText).fragment))?.outputText??oldModels.find(r=>r.purpose===request.purpose)?.outputText??'null');
 else if(request.purpose==='restaurant_agent_decide'){
  agentSteps++;const c=payload.context,a=c.legalActions;
  if(a.presentResults?.length)body=strict('PRESENT_RESULTS',a.presentResults);
  else if(a.investigateCandidateFacts?.length)body=strict('INVESTIGATE_CANDIDATE_FACTS',a.investigateCandidateFacts.slice(0,3));
  else if(a.checkAvailability?.length)body=strict('CHECK_AVAILABILITY',a.checkAvailability.slice(0,1));
  else if(a.search&&agentSteps<=3)body=strict('SEARCH_RESTAURANTS');
  else if(a.endRead)body={...strict('END_READ'),decisionSummary:'Saved source coverage did not establish a current deliverable result.'};
  else body={...strict('ASK_USER'),question:'The saved sources do not establish a unique current result. Which outlet do you mean?',relatedFields:['target.query']};
 }else if(request.purpose==='browser_read_decide'){
  const ts=payload.observation.targets, current=payload.observation.url;
  // Controlled model transport, not production action logic. Every ref below
  // must be present in the current DOM from a qualified real source recording.
  const fixtureAction=(action:string,target:any,field='NONE')=>({action,targetRef:target?.ref??'',authoritativeField:field,requestedState:'NONE',reason:'Offline model transport chooses a current observed control; production chooses no action sequence.'});
  const prior=calls.filter(c=>c.request.purpose==='browser_read_decide').map(c=>JSON.parse(c.response.outputText));
  const location=ts.find((t:any)=>t.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'));
  const station=ts.filter((t:any)=>t.label.normalize('NFKC')==='Akabane Sta.(Tokyo)'&&t.availableActions?.includes('CLICK'));
  const submit=ts.find((t:any)=>t.formObservation&&t.formMethod==='GET'&&/^Search$/iu.test(t.label)&&t.availableActions?.includes('CLICK'));
  const bound=ts.flatMap((t:any)=>(t.availableActions??[]).filter((a:string)=>/^(?:CLICK_AUTHORITATIVE|FILL_AUTHORITATIVE|CHOOSE_OPTION):(?:DATE|PARTY_SIZE)$/.test(a)).map((a:string)=>({target:t,action:a.split(':')[0],field:a.split(':')[1]})))[0];
  const retrieval=ts.find((t:any)=>t.availableActions?.includes('FILL_AUTHORITATIVE:RETRIEVAL'));
  const merchant=ts.filter((t:any)=>t.availableActions?.includes('OPEN_LINK')&&(/\/(?:13273370|13108466)\//u.test(t.href??''))&&!openedDetails.has(t.href));
  const back=resultList&&ts.find((t:any)=>t.href===resultList&&t.availableActions?.includes('OPEN_LINK'));
  if(merchant.length)resultList=current;
  if(bound)body=fixtureAction(bound.action,bound.target,bound.field);
  else if(merchant.length){openedDetails.add(merchant[0].href);body=fixtureAction('OPEN_LINK',merchant[0]);}
  else if(back)body=fixtureAction('OPEN_LINK',back);
  else if(location&&!prior.some(a=>a.action==='FILL_AUTHORITATIVE'&&a.authoritativeField==='LOCATION'))body=fixtureAction('FILL_AUTHORITATIVE',location,'LOCATION');
  else if(station.length===1)body=fixtureAction('CLICK',station[0]);
  else if(retrieval&&!prior.some(a=>a.action==='FILL_AUTHORITATIVE'&&a.authoritativeField==='RETRIEVAL'))body=fixtureAction('FILL_AUTHORITATIVE',retrieval,'RETRIEVAL');
  else if(submit)body=fixtureAction('CLICK',submit);
  else body=fixtureAction('REQUEST_HUMAN_HELP',undefined);
 }else if(request.purpose==='restaurant_source_facts'){
  const quote=payload.sourceDocument.statements.find((s:any)=>/^Categories\s+Kushi-age \(Deep-fried skewers\)/u.test(s.text));
  body={selections:quote?[{firstStatementId:quote.id,lastStatementId:quote.id,role:'CATEGORY',priceStatementId:''}]:[]};
 }else if(request.purpose==='restaurant_fact_judgment'){
  // Fixed-model Replay interpretation of a complete merchant category field;
  // not an assertion that the real model made this judgment.
  const doc=payload.sourceDocuments?.find((d:any)=>d.statements?.some((s:any)=>s.text==='Kushi-age (Deep-fried skewers)'));
  const quote=doc?.statements.find((s:any)=>s.text==='Kushi-age (Deep-fried skewers)');
  body={sourceSelections:quote?[{documentId:doc.id,statementIds:[quote.id]}]:[],judgments:quote?[{criterion:'kushikatsu',outcome:'SUPPORTED',scope:'RESTAURANT_CATEGORY_TYPE',evidenceIds:[doc.id]}]:[]};
 }
 else if(request.purpose==='restaurant_page_question')body={status:'NOT_STATED',answer:null,citations:[],sensitiveCategory:'NONE',sourceConflict:false};
 else throw Error('UNFROZEN_MODEL_PURPOSE:'+request.purpose);
 const response={invocationId:'offline:'+calls.length,provider:'FIXTURE' as const,model:'deterministic-replay',latencyMs:0,outputText:request.purpose==='restaurant_semantic_interpret'?firstSemantic.outputText:JSON.stringify(body),finishReason:request.purpose==='restaurant_semantic_interpret'?firstSemantic.finishReason:'TOOL_CALLS'};calls.push({request,response});return response;
}};
let view:any,error:any,artifact:any;
try{
 session=await createG6Session({model,google,browser,clock,packs:[googlePlacesDiscoveryPack,tabelogDiscoveryPack],onBrowserDiagnostic:d=>diagnostics.push(d)});
 const created=await session.finished(()=>session!.application.createCase(G6_USER,turns.turns[0].message,`real-replay-${id}`));
 view=await session.view(created.case.caseId);artifact=await session.application.exportReadArtifact(created.case.caseId);
}catch(e){error=e instanceof Error?{name:e.name,message:e.message}:String(e)}
finally{
 await session?.close();for(const s of sessions)await s.close().catch(()=>{});
 await writeFile(new URL(`../../observed-read-provenance-20261105/${id}-current-observation-replay.json`,root),JSON.stringify({mode:'REPLAY_REAL_SOURCE_CURRENT_OBSERVATION_FIXED_MODEL',missingResources:'ABORT_WITHOUT_NETWORK_FALLBACK; required document gaps close context; absent dynamic responses remain explicit fidelity gaps and cannot create evidence',inputCommit:'1d88ba11',message:turns.turns[0].message,semanticBytesUnchanged:true,realModelCalls:0,realGoogleCalls:0,realWebsiteReads:0,sourceRecordings:recordings.map(r=>({sha256:r.sha256,harSha256:r.harSha256})),view,error,artifact,stops,browserActions,diagnostics,calls},null,2)+'\n');
 console.log(JSON.stringify({id,phase:view?.case.phase,presented:view?.restaurant.presentedCandidateIds,stops,error,offlineCalls:calls.length,elapsedMs:performance.now()-start}));
 await rm(folder,{recursive:true,force:true});
}
