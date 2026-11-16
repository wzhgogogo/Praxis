import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {ModelBrowserReadActionDecision} from '../../infrastructure/browser/browser-action-decision.js';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import {discoveryPackNetworkPolicy} from '../../integrations/restaurant-search/source-packs.js';
import {tableCheckNameSearchCompletion} from '../../integrations/tablecheck/tablecheck-browser-availability.js';
import type {BrowserReadDecisionInput} from '../../infrastructure/browser/browser-action-decision.js';
import {guardedPages} from './browser-read-test-fixtures.js';

test('recorded November 16 search panel exposes every visible suggestion and Search to the browser decision', async () => {
  // Byte-for-byte Header Search Bar from fc3f65c6's diagnostic/snapshot-0004.html.
  const html = await readFile(new URL('./fixtures/recorded-closeout/tablecheck-suggestions.html', import.meta.url), 'utf8');
  assert.equal(createHash('sha256').update(html).digest('hex'), '924f5ade8a1ae2cd404869d1acc9d5189c5f746335f6d1d76eeb6e5517e03709');
  const policy = discoveryPackNetworkPolicy();
  const url = policy.startupDocuments!.find(value => new URL(value).origin === 'https://www.tablecheck.com')!;
  const fixture = await guardedPages({[url]: html}, policy);
  let decision: BrowserReadDecisionInput | undefined;
  const executor = new BrowserTaskExecutor(fixture.runtime, {maxAutomaticElapsedMs: 30000,
    maxModelCallsPerCandidate: 1, maxModelCallsTotal: 1, maxOperationsPerCandidate: 20, modelDecision: {async decide(input) {
    decision = input;
    return {type: 'REQUEST_HUMAN_HELP', reason: 'Stop after capturing the model input'};
  }}});
  try {
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, 'TABLECHECK', 'DISCOVERY', policy);
    const query = 'Specializing in Nodoguro Ginza Nakamata';
    await executor.search({source: 'TABLECHECK', signal, session, url, allowedOrigins: [new URL(url).origin],
      query, querySource: 'SPECIFIC_OUTLET', completion: page => tableCheckNameSearchCompletion(page, query)});
    assert.ok(decision);
    const offered = decision.observation.targets.filter(t => t.role === 'option');
    assert.equal(html.match(/role="option"/g)?.length, 13);
    assert.ok(offered.every(t => t.kind === 'BUTTON' && !t.ownerRef && t.availableActions?.includes('CLICK')));
    // The corresponding CONTROLS event (sequence 469) contains these eight.
    assert.deepEqual(offered.map(t => t.label), [
      query + ', Ginza · Izakaya (Japanese Tavern)',
      query + ' Kiwami, Ginza · Sushi',
      query + ' Hanare, Ginza · Japanese',
      'Sakana no Nakamata Ginza, Ginza · Sake & Shochu Bar',
      'Nodoguro no Nakamata Shinbashi, Shinbashi · Sake & Shochu Bar',
      'IN, Haramachida · Italian',
      'Sumibi Genshiyaki to Kuramoto Shochu no Mise Nodoguro no Nakamata Tsukiji, Tsukiji · Izakaya (Japanese Tavern)',
      'GINZA BRIO, Ginza · Yoshoku (Japanese-style Western)',
    ]);
    assert.ok(decision.observation.targets.some(t => t.label === 'Search' && t.availableActions?.includes('CLICK')));
  } finally {
    await executor.closeAll();
    await fixture.close();
  }
});

// Component replay of actual options, request metadata and route continuity.
// Missing final HTML and the new receipt envelope are LOCAL_CONSTRUCTION, never original-body Replay.
test('recorded exact suggestion and completed same-page shop GET bind a generic source handoff',async()=>{
 const root='.eval-artifacts/phase3b/tablecheck-shop-validation-20261108/runtime/source-read';
 const manifest=JSON.parse(await readFile(new URL('./fixtures/recorded-closeout/manifest.json',import.meta.url),'utf8'));
 for(const [file,hash]of Object.entries(manifest.components.TABLECHECK_SUGGESTION.files))assert.equal(createHash('sha256').update(await readFile(root+'/'+file)).digest('hex'),hash);
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
 for(const mode of ['BOUND','OLD','BLOCKED','FAILED','NO_RECEIPT','OTHER_SCOPE','OTHER_PAGE','NO_ROUTE','NOT_FOUND','SUFFIX','DUPLICATE','DUPLICATE_HIDDEN','DUPLICATE_DISABLED','DUPLICATE_OBSTRUCTED','DUPLICATE_OTHER_GROUP','UNREVIEWED','CLICK_FAILED','ORDINARY_BUTTON']){
  let frame=0,calls=0,selectionClicks=0; const diagnostics:any[]=[];
  let offeredSuggestions: string[] = [];
  const receipt={readScopeId:'local-projection:1',pageId:pages[3].pageId,requestSequence:seq,startedAt:header.requestStartedAtMs,completedAt:header.responseAvailableAtMs,status:200,ruleIndex:discoveryPackNetworkPolicy().dynamicReads.findIndex(rule=>rule.origin===header.origin&&rule.pathnamePattern?.startsWith("^/v2/shops/")),fields:header.queryValueHashes};
  if(mode==='OLD')receipt.requestSequence=before;
  if(mode==='FAILED')receipt.status=503;
  if(mode==='OTHER_SCOPE')receipt.readScopeId='old-scope';
  if(mode==='OTHER_PAGE')receipt.pageId='other-page';
  const session:any={metadata:{provider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',requestedEngineMode:'CHROMIUM_ONLY',engineFallbackOccurred:false,readNetworkBoundary:'INSTALLED'},
   async navigate(){frame=0;},async prepareNavigation(){},beginReadScope(){},readBoundary(){return {readScopeId:'local-projection:1',pageId:pages[frame].pageId,requestSequence:before};},
   async snapshot(){const p=pages[frame];return {...p,html:frame===3?'<body><h1>LOCAL_CONSTRUCTION</h1></body>':'<body>Recorded control metadata</body>',text:'Recorded metadata frame '+frame,settlement:'SETTLED',url:frame===3&&mode==='NO_ROUTE'?pages[2].url:frame===3&&mode==='NOT_FOUND'?'https://www.tablecheck.com/en/not-found':p.url,
    networkRequests:frame===3?[{origin:header.origin,pathname:header.pathname,method:'GET',resourceType:'fetch',queryKeys:['locale'],outcome:mode==='BLOCKED'?'BLOCKED':'ADMITTED',...(mode==='NO_RECEIPT'?{}:{dynamicRead:{...receipt,...(mode==='UNREVIEWED'?{ruleIndex:-1}:{})}})}]:[]};},
   async observeControls(){let rows=controls[frame].map((c:any)=>({...c,stableKey:c.id,visible:true}));if(frame===2&&mode==='SUFFIX')rows=rows.filter((c:any)=>c.id!==selected.id);
   if(frame===2&&mode.startsWith('DUPLICATE')){
    const duplicate={...rows.find((c:any)=>c.id===selected.id),id:'duplicate',stableKey:'duplicate'};
    if(mode==='DUPLICATE_HIDDEN')duplicate.visible=false;
    if(mode==='DUPLICATE_DISABLED')duplicate.disabled=true;
    if(mode==='DUPLICATE_OBSTRUCTED')duplicate.blockedByActiveLayer=true;
    if(mode==='DUPLICATE_OTHER_GROUP')duplicate.controlGroupKey='other-suggestion-list';
    rows.push(duplicate);
   }if(frame===2&&mode==='ORDINARY_BUTTON')Object.assign(rows.find((c:any)=>c.id===selected.id),{role:'button',observationOnly:false});return rows;},
   async click(){const wasOption=frame===2;if(wasOption)selectionClicks++;frame=frame===0?1:3;if(wasOption&&mode==='CLICK_FAILED')throw Error('Constructed click failure');},async fill(){frame=2;},async select(){return [];},async screenshot(){return new Uint8Array();},async close(){},async waitForSettled(){return true;},
  };
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:10000,maxModelCallsPerCandidate:7,maxModelCallsTotal:7,maxOperationsPerCandidate:90,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(input){
   const choose=()=>{
   calls++;if(frame===0)return {type:'CLICK',targetRef:input.observation.targets.find(t=>t.kind==='BUTTON'&&t.label.startsWith('Destination'))!.ref,reason:'Recorded Destination opening'};
   if(frame===1)return {type:'FILL_AUTHORITATIVE',field:'RETRIEVAL',targetRef:input.observation.targets.find(t=>t.kind==='INPUT'&&t.label.includes('Destination'))!.ref,reason:'Recorded full-name fill'};
   if(frame===2){
    const buttons=input.observation.targets.filter(t=>t.kind==='BUTTON'&&t.availableActions?.includes('CLICK'));
    offeredSuggestions=buttons.filter(t=>t.role==='option').map(t=>t.label);
    const matches=buttons.filter(t=>t.label===selected.label&&(mode==='ORDINARY_BUTTON'||t.role==='option'));
    if(matches.length!==1)return {type:'REQUEST_HUMAN_HELP',reason:'No unique suggestion for this outlet'};
    return {type:'CLICK',targetRef:matches[0]!.ref,reason:'Observed button'};
   }
   return {type:'COMPLETE',reason:'Code verifies the observed handoff'};
   };
   const action=choose();
   return new ModelBrowserReadActionDecision({async complete(){return {invocationId:'local-wire-'+calls,provider:'FIXTURE',model:'MODEL_SUBSTITUTE',outputText:JSON.stringify({action:action.type,targetRef:'targetRef' in action?action.targetRef:'',valueGroupRef:'',authoritativeField:'field' in action?action.field:'NONE',requestedState:'NONE',reason:action.reason}),finishReason:'TOOL_CALLS',latencyMs:0};}}).decide(input);
  }}});
  try{
   const signal=new AbortController().signal;await executor.acquire(signal,'SOURCE','DISCOVERY',discoveryPackNetworkPolicy());
   const result=await executor.search({source:'SOURCE',signal,session,allowedOrigins:['https://www.tablecheck.com'],url:'https://www.tablecheck.com/en/japan/search',query:selected.label,completion:page=>tableCheckNameSearchCompletion(page,selected.label)});
   assert.equal(result.status==='COMPLETED',['BOUND','DUPLICATE_HIDDEN','DUPLICATE_DISABLED','DUPLICATE_OBSTRUCTED'].includes(mode),JSON.stringify({mode,reason:result.reasonCode,status:result.status,frame,calls,diagnostics:diagnostics.filter(d=>['REJECTED','MODEL_DECISION_FAILED','METHOD_INCOMPLETE'].includes(d.event)).map(d=>({event:d.event,detail:d.detail}))}));
   if(['BOUND','DUPLICATE_HIDDEN','DUPLICATE_DISABLED','DUPLICATE_OBSTRUCTED'].includes(mode)){assert.equal((result as any).sourceHandoff?.url,pages[3].url);assert.equal(calls,4,'Model COMPLETE follows actual source handoff; no identity decision is fabricated');}
   else assert.equal(result.sourceHandoff,undefined,mode);
   if(mode==='SUFFIX'||mode==='DUPLICATE'||mode==='DUPLICATE_OTHER_GROUP'){
    assert.equal(offeredSuggestions.filter(label=>label===selected.label).length,mode==='DUPLICATE_OTHER_GROUP'?2:0);
    assert.ok(offeredSuggestions.includes(selected.label+' Kiwami'));
    assert.equal(selectionClicks,0);
    assert.equal(result.status,'REQUESTED_HUMAN_HELP');
   }
  }finally{await executor.closeAll();}
 }
});
