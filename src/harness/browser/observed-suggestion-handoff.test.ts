import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import {discoveryPackNetworkPolicy} from '../../integrations/restaurant-search/source-packs.js';
import {tableCheckNameSearchCompletion} from '../../integrations/tablecheck/tablecheck-browser-availability.js';

// Component replay of actual options, request metadata and route continuity.
// Missing final HTML and the new receipt envelope are LOCAL_CONSTRUCTION, never original-body Replay.
test('recorded exact suggestion and completed same-page shop GET bind a generic source handoff',async()=>{
 const root='.eval-artifacts/phase3b/tablecheck-shop-validation-20261108/runtime/source-read';
 const events=JSON.parse(await readFile(root+'/events.json','utf8'));
 const pages=events.filter((r:any)=>r.kind==='SNAPSHOT').map((r:any)=>r.detail);
 const controls=events.filter((r:any)=>r.kind==='CONTROLS').map((r:any)=>r.detail.controls);
 const selected=events.find((r:any)=>r.kind==='OBSERVED_QUERY_OPTIONS').detail.options[0];
 const header=JSON.parse(await readFile(root+'/header-names.json','utf8')).find((r:any)=>r.pathname.startsWith('/v2/shops/'));
 const click=events.find((r:any)=>r.kind==='SOURCE_READ_PHASE'&&r.detail.phase==='SELECT_MATCH');
 const before=events.filter((r:any)=>r.kind==='NETWORK_REQUEST_START'&&r.sequence<click.sequence).length;
 const request=events.find((r:any)=>r.kind==='NETWORK_REQUEST_START'&&r.detail.urlSha256===header.responseUrlSha256);
 const seq=events.filter((r:any)=>r.kind==='NETWORK_REQUEST_START'&&r.sequence<=request.sequence).length;
 assert.ok(seq>before);assert.equal(header.status,200);assert.equal(new Set(pages.map((p:any)=>p.pageId)).size,1);
 for(const mode of ['BOUND','OLD','BLOCKED','FAILED','NO_RECEIPT','OTHER_SCOPE','OTHER_PAGE','NO_ROUTE','NOT_FOUND','SUFFIX','DUPLICATE','UNREVIEWED','CLICK_FAILED']){
  let frame=0,calls=0; const diagnostics:any[]=[];
  const receipt={readScopeId:'local-projection:1',pageId:pages[3].pageId,requestSequence:seq,startedAt:header.requestStartedAtMs,completedAt:header.responseAvailableAtMs,status:200,ruleIndex:discoveryPackNetworkPolicy().dynamicReads.findIndex(rule=>rule.origin===header.origin&&rule.pathnamePattern?.startsWith("^/v2/shops/")),fields:header.queryValueHashes};
  if(mode==='OLD')receipt.requestSequence=before;
  if(mode==='FAILED')receipt.status=503;
  if(mode==='OTHER_SCOPE')receipt.readScopeId='old-scope';
  if(mode==='OTHER_PAGE')receipt.pageId='other-page';
  const session:any={metadata:{provider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',requestedEngineMode:'CHROMIUM_ONLY',engineFallbackOccurred:false,readNetworkBoundary:'INSTALLED'},
   async navigate(){frame=0;},async prepareNavigation(){},beginReadScope(){},readBoundary(){return {readScopeId:'local-projection:1',pageId:pages[frame].pageId,requestSequence:before};},
   async snapshot(){const p=pages[frame];return {...p,html:frame===3?'<body><h1>LOCAL_CONSTRUCTION</h1></body>':'<body>Recorded control metadata</body>',text:'Recorded metadata frame '+frame,settlement:'SETTLED',url:frame===3&&mode==='NO_ROUTE'?pages[2].url:frame===3&&mode==='NOT_FOUND'?'https://www.tablecheck.com/en/not-found':p.url,
    networkRequests:frame===3?[{origin:header.origin,pathname:header.pathname,method:'GET',resourceType:'fetch',queryKeys:['locale'],outcome:mode==='BLOCKED'?'BLOCKED':'ADMITTED',...(mode==='NO_RECEIPT'?{}:{dynamicRead:{...receipt,...(mode==='UNREVIEWED'?{ruleIndex:-1}:{})}})}]:[]};},
   async observeControls(){const rows=controls[frame].map((c:any)=>({...c,stableKey:c.id,visible:true}));if(frame===2&&mode==='SUFFIX')rows.find((c:any)=>c.id===selected.id).label=selected.label+' Kiwami';if(frame===2&&mode==='DUPLICATE')rows.push({...rows.find((c:any)=>c.id===selected.id),id:'duplicate',stableKey:'duplicate'});return rows;},
   async click(){const wasOption=frame===2;frame=frame===0?1:3;if(wasOption&&mode==='CLICK_FAILED')throw Error('Constructed click failure');},async fill(){frame=2;},async select(){return [];},async screenshot(){return new Uint8Array();},async close(){},async waitForSettled(){return true;},
  };
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:10000,maxModelCallsPerCandidate:7,maxModelCallsTotal:7,maxOperationsPerCandidate:90,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(input){
   calls++;if(frame===0)return {type:'CLICK',targetRef:input.observation.targets.find(t=>t.kind==='BUTTON'&&t.label.startsWith('Destination'))!.ref,reason:'Recorded Destination opening'};
   if(frame===1)return {type:'FILL_AUTHORITATIVE',field:'RETRIEVAL',targetRef:input.observation.targets.find(t=>t.kind==='INPUT'&&t.label.includes('Destination'))!.ref,reason:'Recorded full-name fill'};
   if(frame===2){const target=input.observation.targets.find(t=>t.label===selected.label+(mode==='SUFFIX'?' Kiwami':''));if(!target)return {type:'REQUEST_HUMAN_HELP',reason:'No unique exact actionable source suggestion'};assert.ok(target.availableActions?.includes('CLICK'));return {type:'CLICK',targetRef:target.ref,reason:'Observed suggestion'};}
   return {type:'COMPLETE',reason:'Code verifies the observed handoff'};
  }}});
  try{
   const signal=new AbortController().signal;await executor.acquire(signal,'SOURCE','DISCOVERY',discoveryPackNetworkPolicy());
   const result=await executor.search({source:'SOURCE',signal,session,allowedOrigins:['https://www.tablecheck.com'],url:'https://www.tablecheck.com/en/japan/search',query:selected.label,completion:page=>tableCheckNameSearchCompletion(page,selected.label)});
   assert.equal(result.status==='COMPLETED',mode==='BOUND',JSON.stringify({mode,reason:result.reasonCode,status:result.status,frame,calls,diagnostics:diagnostics.filter(d=>['REJECTED','MODEL_DECISION_FAILED','METHOD_INCOMPLETE'].includes(d.event)).map(d=>({event:d.event,detail:d.detail}))}));
   if(mode==='BOUND'){assert.equal((result as any).sourceHandoff?.url,pages[3].url);assert.equal(calls,4,'Model COMPLETE follows actual source handoff; no identity decision is fabricated');}
  }finally{await executor.closeAll();}
 }
});
