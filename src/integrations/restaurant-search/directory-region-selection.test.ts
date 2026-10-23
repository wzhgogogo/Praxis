const fixtureRetrieval={decide:async()=>({accepted:true,keyword:"omakase",criterionRef:"criterion:0",reason:"Scripted retrieval control."})};
import assert from 'node:assert/strict';
import test from 'node:test';
import { BrowserRuntimeError } from '../../infrastructure/browser/browser-runtime-errors.js';
import type { BrowserReadActionDecisionPort } from '../../infrastructure/browser/browser-action-decision.js';
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from '../../infrastructure/browser/browser-runtime.js';
import { GooglePlacesClient } from '../google/google-places-client.js';
import { GooglePlacesRestaurantSearch } from '../google/google-places-restaurant-search.js';
import { NativeRestaurantSearch, directoryEntryReplacementAllowed, observedDirectoryOutletReference } from './native-restaurant-search.js';
import { tabelogDiscoveryPack } from './source-packs.js';
import type { RestaurantSearchContinuation, RestaurantSearchIntent } from '../../domains/restaurant/contracts.js';

const root = 'https://tabelog.com/en/tokyo/rstLst/';
const first = 'https://tabelog.com/en/tokyo/A1303/A130301/rstLst/';
const second = 'https://tabelog.com/en/tokyo/A1304/A130401/rstLst/';
const now = '2026-10-10T00:00:00.000Z';
const intent: RestaurantSearchIntent = { timezone:'Asia/Tokyo', target:{goal:'RECOMMENDATION',query:'restaurants'}, area:{query:'nearby',radiusMeters:1000,coordinates:{latitude:35.66,longitude:139.70,observedAt:now,source:'EVALUATION'}},criteria:[] };
function fixture(outside = true, missing = false, named = false, navigationFailure?: BrowserRuntimeError) {
  const navigations:string[]=[];let selections=0;
  const runtime:BrowserRuntime={openSession:async()=>{
    let page:BrowserSnapshot={url:root,title:'',text:'',html:''};
    const session:BrowserSession={metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now},
      navigate:async(url)=>{navigations.push(url);if(url===first&&navigationFailure)throw navigationFailure;let html='';
        if(url===root) html=`<a href="${first}">${named?"Ueno":"First region"}</a><a href="${second}">${named?"Asakusa":"Second region"}</a>`;
        else if(url===first || url===second) html=Array.from({length:5},(_,n)=>{const id=(url===first?100:200)+n;return `<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/${id}/">Outlet ${id}</a>`;}).join('') + (named && url===first?`<a href="${second}">Asakusa</a>`:'');
        else {const id=new URL(url).pathname.match(/\/(\d+)\/$/)![1]!;const name=`Outlet ${id}`,address='Tokyo';const point=outside&&Number(id)<200?{latitude:35.9,longitude:139.9}:{latitude:35.66,longitude:139.70};html=`<script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name,address,...(missing?{}:{geo:point})})}</script><h1>${name}</h1><p class="rstinfo-table__address">${address}</p>`;}
        page={url,title:'Restaurants',text:html.replace(/<[^>]*>/g,' '),html};},
      snapshot:async()=>page,observeControls:async()=>[...page.html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m,n)=>({id:String(n),stableKey:m[1]!,kind:'LINK' as const,role:'link',label:m[2]!,href:new URL(m[1]!,page.url).href,visible:true,disabled:false})),
      click:async()=>{throw new Error('No click permitted');},fill:async()=>{throw new Error('No fill needed');},select:async()=>[],waitFor:async()=>{},waitForSettled:async()=>true,screenshot:async()=>new Uint8Array(),close:async()=>{}};return session;
  }};
  const decision:BrowserReadActionDecisionPort={decide:async(input)=>{selections++;const target=input.observation.targets.find(t=>t.href===(selections===1?first:second))!;return {type:'OPEN_LINK',targetRef:target.ref,reason:'Choose observed region'};}};
  const google=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:'fixture-only',fetchImplementation:async()=>{throw new Error('No extra location request');}}));
  const native=new NativeRestaurantSearch(runtime, google, fixtureRetrieval, ()=>now, undefined, decision, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 }, undefined, [tabelogDiscoveryPack]);
  return {native,navigations,get selections(){return selections;}};
}
test('directory Agent uses observed references; a proved wrong first entry is replaced once without resetting progress',async()=>{
 const f=fixture();const a=await f.native.search({intent},new AbortController().signal);const region=a.continuation!.sourceProgress!.directoryRegion!;
 assert.equal(a.candidates.length,0);assert.equal(region.first.url,first);assert.match(region.first.targetRef,/observation:\d+:target:\d+/);assert.equal(region.firstFive.length,5);assert.equal(directoryEntryReplacementAllowed(region),true);assert.equal(a.continuation!.exhausted,false);
 const b=await f.native.search({intent,continuation:a.continuation!},new AbortController().signal);
 assert.equal(b.candidates.length,5);assert.equal(b.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,10);assert.equal(b.continuation!.pagesRead,4);assert.ok(b.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!>=a.continuation!.sourceProgress!.elapsedMs!);assert.equal(b.metadata.nativeDiscoveryFunnel!.directoryRegion!.replacement!.url,second);assert.equal(directoryEntryReplacementAllowed(b.metadata.nativeDiscoveryFunnel!.directoryRegion),false);assert.equal(f.selections,2);
});
test('unknown coordinates do not establish a wrong entry and cannot admit candidates',async()=>{
 const f=fixture(false,true);const a=await f.native.search({intent},new AbortController().signal);assert.equal(a.candidates.length,0);assert.ok(a.metadata.nativeDiscoveryFunnel!.directoryRegion!.firstFive.every(x=>x.outcome==='UNKNOWN'));assert.equal(directoryEntryReplacementAllowed(a.metadata.nativeDiscoveryFunnel!.directoryRegion),false);assert.equal(f.selections,1);
});
test('only four proved outside among exactly five allow one replacement; spent deadline stays spent',async()=>{
 const region={first:{url:first,observedOn:root,targetRef:'observation:1:target:1'},firstFive:Array.from({length:5},(_,n)=>({sourceEntityId:String(n),sourceUrl:first,outcome:n<4?'OUTSIDE_RADIUS' as const:'UNKNOWN' as const}))};
 assert.equal(directoryEntryReplacementAllowed(region),true);assert.equal(directoryEntryReplacementAllowed({...region,firstFive:region.firstFive.slice(0,4)}),false);assert.equal(directoryEntryReplacementAllowed({...region,firstFive:region.firstFive.map((x,n)=>n===3?{...x,outcome:'UNKNOWN' as const}:x)}),false);assert.equal(directoryEntryReplacementAllowed({...region,replacement:{url:second,observedOn:root,targetRef:'observation:2:target:2'}}),false);
 const f=fixture();const continuation:RestaurantSearchContinuation={intentFingerprint:JSON.stringify(intent),usedPageTokens:[],pagesRead:2,exhausted:false,sourceProgress:{sourceId:'tabelog',inspectedSourceIds:[],detailAttempts:5,pagesRead:2,elapsedMs:90000,pendingSourceIds:[],directoryRegion:region}};
 const result=await f.native.search({intent,continuation},new AbortController().signal);assert.equal(f.navigations.length,0);assert.equal(result.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,5);assert.ok(result.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!>=90000);
 const capped=fixture();
 const pageLimited=await capped.native.search({intent,continuation:{...continuation,sourceProgress:{...continuation.sourceProgress!,elapsedMs:0,retrieval:{rewrites:0,regionPages:4,retrievalPages:1,history:[]}}}},new AbortController().signal);
 assert.equal(capped.navigations.length,0,'a resumed request must not open a fifth region page');
 assert.equal(pageLimited.metadata.failureCode,'READ_BUDGET_EXCEEDED');
});


test('a named request continues through an unrelated parent menu before admitting child-list details',async()=>{
 const f=fixture(false,false,true);const namedIntent={...intent,area:{query:'near Asakusa',radiusMeters:1000}};
 const continuation:RestaurantSearchContinuation={intentFingerprint:JSON.stringify(namedIntent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:35.66,longitude:139.70,radiusMeters:1000,label:'Asakusa',areaMatchBasis:'NAMED_PLACE_RADIUS'}};
 const result=await f.native.search({intent:namedIntent,continuation},new AbortController().signal);
 assert.equal(result.candidates.length,5);assert.equal(result.metadata.nativeDiscoveryFunnel!.directoryRegion!.first.url,second);assert.equal(result.metadata.nativeDiscoveryFunnel!.directoryRegion!.replacement,undefined);assert.equal(f.navigations.some(url=>/\/10\d\/$/.test(url)),false,'parent details must not be inspected before the observed child entrance');
});


test('directory navigation timeout retains its runtime code rather than claiming no observed region',async()=>{
 const f=fixture(false,false,false,new BrowserRuntimeError('BROWSER_TIMEOUT','Fixture navigation deadline'));
 const result=await f.native.search({intent},new AbortController().signal);
 assert.equal(result.metadata.failureCode,'BROWSER_TIMEOUT');assert.equal(result.candidates.length,0);
});

// Projected real region links; the optional location-search/result transition
// below is a synthetic control, not a claim that this control was recorded.
import {readFileSync} from 'node:fs';
const regionFragment = (name:string) => readFileSync(new URL(`./fixtures/p2-2-selection-20261019/followup/region-inputs/${name}.html`,import.meta.url),'utf8');
const capturedRoot='https://tabelog.com/en/tokyo/';
const capturedParent='https://tabelog.com/en/tokyo/A1304/';
const capturedChild='https://tabelog.com/en/tokyo/A1304/A130401/';
function regionRecoveryFixture(locationSearch:boolean, rogue=false) {
 const navigations:string[]=[];let decisions=0, blocked=false, filled='',submitted=false;
 const resultUrl='https://tabelog.com/en/tokyo/A1309/A130905/rstLst/';
 const outletUrl='https://tabelog.com/en/tokyo/A1309/A130905/13000001/';
 let page:BrowserSnapshot={url:capturedRoot,title:'Regions',text:'',html:''};
 const update=(url:string)=>{
  let html=url===capturedRoot?regionFragment('root'):url===capturedParent?regionFragment('parent'):url===capturedChild?regionFragment('child'):url===resultUrl?`<a class="list-rst__rst-name-target" href="${outletUrl}">Controlled restaurant</a>`:`<script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:'Controlled restaurant',address:'Tokyo',geo:{latitude:35.66,longitude:139.70}})}</script>`;
  if(locationSearch&&url===capturedParent)html+='<input aria-label="Station or area"><button>Search</button><a class="list-rst__rst-name-target" href="https://tabelog.com/en/tokyo/A1304/A130401/13000002/">Previous broad result</a>';
  page={url,title:'Regions',text:html.replace(/<[^>]*>/g,' '),html};
 };
 const runtime:BrowserRuntime={openSession:async()=>({
  metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now,readNetworkBoundary:'INSTALLED'},
  navigate:async(url)=>{navigations.push(url);update(url.includes('/tokyo/rstLst/')?capturedRoot:url);},snapshot:async()=>page,
  observeControls:async()=>[
   ...[...page.html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m,n)=>({id:String(n),stableKey:m[1]!,kind:'LINK' as const,role:'link',label:m[2]!.replaceAll('&amp;','&'),href:m[1]!.replaceAll('&amp;','&'),visible:true,disabled:false})),
   ...(locationSearch && (page.url===capturedParent||page.url===resultUrl)?[{id:'area',stableKey:'area',kind:'INPUT' as const,role:'textbox',label:'Station or area',type:'search',structure:{tag:'INPUT',name:'location',classes:[],dialogLabel:'',formClass:'',sliderCount:0},value:filled,visible:true,disabled:false},{id:'search',stableKey:'search',kind:'BUTTON' as const,role:'button',label:'Search',visible:true,disabled:false}]:[])
  ],
  fill:async(id,value)=>{assert.equal(id,'area');filled=value;},click:async(id)=>{assert.equal(id,'search');submitted=true;update(resultUrl);},select:async()=>[],waitFor:async()=>{},waitForSettled:async()=>true,screenshot:async()=>new Uint8Array(),close:async()=>{},
 })};
 const decision:BrowserReadActionDecisionPort={decide:async(input)=>{
  decisions++;
  if(decisions===1)return {type:'OPEN_LINK',targetRef:input.observation.targets.find(t=>t.href===capturedParent)!.ref,reason:'Captured broad parent'};
  if(locationSearch){
   if(decisions===2)return {type:'FILL_AUTHORITATIVE',targetRef:input.observation.targets.find(t=>t.label==='Station or area')!.ref,field:'LOCATION',reason:'Use exact request location'};
   if(decisions===3){assert.equal(submitted,false);return {type:'CLICK',targetRef:input.observation.targets.find(t=>t.label==='Search')!.ref,reason:'Apply observed public location search'};}
   return {type:'REQUEST_HUMAN_HELP',reason:'No further scripted step'};
  }
  if(decisions===2)return {type:'OPEN_LINK',targetRef:input.observation.targets.find(t=>t.href===capturedChild)!.ref,reason:'Captured child'};
  if(decisions===3){
   const parent=input.observation.targets.find(t=>t.href?.includes('/A1304/rstLst/'))!;
   blocked=!parent.availableActions?.includes('OPEN_LINK');
   return rogue?{type:'OPEN_LINK',targetRef:parent.ref,reason:'Synthetic attempt to bypass blocked edge'}:{type:'REQUEST_HUMAN_HELP',reason:'Captured route has no verified next entrance'};
  }
  return {type:'REQUEST_HUMAN_HELP',reason:'Stop after one rejected proposal'};
 }};
 const google=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async()=>{throw Error('No network');}}));
 const native=new NativeRestaurantSearch(runtime,google,fixtureRetrieval,()=>now,undefined,decision,undefined,undefined,{maxAutomaticElapsedMs:300_000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24},undefined,[tabelogDiscoveryPack]);
 const namedIntent={...intent,area:{query:'near Kagurazaka',radiusMeters:1000}};
 const request={intent:namedIntent,continuation:{intentFingerprint:JSON.stringify(namedIntent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:35.66,longitude:139.70,radiusMeters:1000,label:'Kagurazaka',areaMatchBasis:'NAMED_PLACE_RADIUS' as const}}};
 return {native,request,navigations,get blocked(){return blocked;},get decisions(){return decisions;},get filled(){return filled;},get submitted(){return submitted;}};
}
test('captured Kagurazaka region loop cannot reopen an already visited parent, even with listing query aliases',async()=>{
 for(const rogue of [false,true]){
  const f=regionRecoveryFixture(false,rogue);const result=await f.native.search(f.request,new AbortController().signal);
  assert.equal(f.blocked,true,'the previously visited parent must not be offered again');
  assert.equal(f.navigations.filter(url=>url.includes('/A1304/rstLst/')).length,0,'a model cannot bypass the narrowed action scope');
  assert.equal(result.candidates.length,0);assert.equal(result.metadata.nativeDiscoveryFunnel!.inspectedOutlets,0);
  assert.ok(f.decisions<=4);assert.ok(result.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90_000);
 }
});
test('a confirmed authoritative location search replaces a previous broad region without accepting the filled old page',async()=>{
 const f=regionRecoveryFixture(true);const result=await f.native.search(f.request,new AbortController().signal);
 assert.equal(f.filled,'Kagurazaka');assert.equal(f.submitted,true,'fill alone cannot accept the previous broad page');
 assert.equal(f.navigations.some(url=>url.endsWith('/13000002/')),false,'old broad-result cards must never reach detail investigation');
 assert.equal(result.candidates.length,1,'the known-feasible exact-location result must survive prior broad-region state');
 assert.equal(result.metadata.nativeDiscoveryFunnel!.directoryRegion!.first.url,'https://tabelog.com/en/tokyo/A1309/A130905/rstLst/');
 assert.equal(f.decisions,3);assert.ok(result.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90_000);
});

// Independent source records + controlled details: this checks routing and the
// original budget, not current inventory or a real model's new decisions.
import {gunzipSync} from 'node:zlib';
import {googlePlacesDiscoveryPack} from './source-packs.js';
import type {RestaurantSearchRead} from '../../domains/restaurant/contracts.js';
const recordedRegions = JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/p2-1c-region-20261020/recordings.json.gz',import.meta.url))).toString()) as Array<{
 caseId:string;group:string;location:NonNullable<RestaurantSearchContinuation['locationContext']>;
 googleBatch?:{detail:{read:RestaurantSearchRead}};
}>;
function linkedRegionFixture(caseId:string, rogue=false, failedRead=false, hard=false) {
 const record=recordedRegions.find(r=>r.group==='checkpoint-b-corrected-20261019'&&r.caseId===caseId)!;
 const references=record.googleBatch!.detail.read;
 const navigations:string[]=[];const googleKeywords:Array<string|undefined>=[];let googleCalls=0, decisions=0, planningCalls=0;
 const requested=record.location.label;
 // Only the test's independent expected pages supply this table. Production
 // receives the unchanged recorded Google links and observed root links.
 const expected=caseId.includes('kagurazaka')?'A1309':'A1317';
 const good=`https://tabelog.com/en/tokyo/${expected}/`;
 const wrong=caseId.includes('kagurazaka')?capturedParent:'https://tabelog.com/en/tokyo/A1316/';
 const outlet=`${good}${expected}01/13999999/`;
 let page:BrowserSnapshot={url:capturedRoot,title:'Regions',text:'',html:''};
 const runtime:BrowserRuntime={openSession:async()=>({
  metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now},
  navigate:async(url)=>{navigations.push(url);const current=url.includes('/tokyo/rstLst/')?capturedRoot:url;
   const path=new URL(current);path.search='';
   const html=path.href===capturedRoot?regionFragment('root'):path.href===good?`<a class="list-rst__rst-name-target" href="${outlet}">Controlled result</a>`:current===outlet?`<script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:'Controlled result',address:'Tokyo',geo:{latitude:record.location.latitude,longitude:record.location.longitude}})}</script>`:'';
   page={url:current,title:'Observed regions',text:html.replace(/<[^>]*>/g,' '),html};},snapshot:async()=>page,
  observeControls:async()=>[...page.html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m,n)=>({id:String(n),stableKey:m[1]!,kind:'LINK' as const,role:'link',label:m[2]!.replaceAll('&amp;','&'),href:m[1]!,visible:true,disabled:false})),
  click:async()=>{throw Error('No click');},fill:async()=>{throw Error('No invented input');},select:async()=>[],waitFor:async()=>{},waitForSettled:async()=>true,screenshot:async()=>new Uint8Array(),close:async()=>{},
 })};
 const decision:BrowserReadActionDecisionPort={decide:async input=>{
  decisions++;
  if(failedRead)return {type:'REQUEST_HUMAN_HELP',reason:'No observed region evidence in the controlled source'};
  const incorrect=input.observation.targets.find(t=>t.href===wrong)!;
  if(rogue)return {type:'OPEN_LINK',targetRef:incorrect.ref,reason:'Synthetic bypass of unsupported region'};
  assert.equal(incorrect.availableActions?.includes('OPEN_LINK'),false,'an administrative/name-similar guess must not remain executable');
  const supported=input.observation.targets.find(t=>t.href===good)!;
  assert.ok(supported.availableActions?.includes('OPEN_LINK'),'the observed matching entrance remains reachable');
  return {type:'OPEN_LINK',targetRef:supported.ref,reason:'Observed same-origin outlet supports this region'};
 }};
 const google=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async()=>{throw Error('No network');}}));
 google.search=async request=>{googleCalls++;googleKeywords.push(request.discoveryQuery?.keyword);if(failedRead)throw Object.assign(Error('Controlled provider failure'),{code:'GOOGLE_NETWORK_FAILED'});return {...structuredClone(references),continuation:{...structuredClone(references.continuation!),intentFingerprint:JSON.stringify(request.intent)}};};
 const planner={decide:async()=>{planningCalls++;return fixtureRetrieval.decide();}};
 const native=new NativeRestaurantSearch(runtime,google,planner,()=>now,undefined,decision,undefined,undefined,{maxAutomaticElapsedMs:300_000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24},undefined,[tabelogDiscoveryPack,googlePlacesDiscoveryPack]);
 const inputIntent={...intent,area:{query:`near ${requested}`,radiusMeters:1000},...(hard?{criteria:[{text:'omakase',polarity:'POSITIVE' as const,strength:'HARD' as const}]}:{})};
 const request={intent:inputIntent,readRunId:`region-${caseId}`,continuation:{intentFingerprint:JSON.stringify(inputIntent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:record.location}};
 return {native,request,navigations,good,wrong,references,googleKeywords,get googleCalls(){return googleCalls;},get decisions(){return decisions;},get planningCalls(){return planningCalls;}};
}
test('recorded Kagurazaka and Nakameguro links constrain the first region and reach a controlled result within the unchanged budget',async()=>{
 for(const caseId of ['p2-kagurazaka-kaiseki-20261029','p2-nakameguro-yakiniku-20261030']){
  const f=linkedRegionFixture(caseId);const result=await f.native.search(f.request,new AbortController().signal);
  assert.equal(result.candidates.length,1,'a known-feasible regional result must be obtained, not just refused safely');
  assert.equal(result.metadata.nativeDiscoveryFunnel!.directoryRegion!.first.url,f.good);
  assert.equal(f.navigations.includes(f.wrong),false);
  assert.equal(f.googleCalls,1);assert.equal(f.decisions,1);assert.ok(result.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90_000);
  const next=await f.native.search({...f.request,continuation:JSON.parse(JSON.stringify(result.continuation))},new AbortController().signal);
  assert.equal(f.googleCalls,1,'the original Google stage consumes the saved read, including after a serialized continuation');
  assert.equal(next.candidates.length,f.references.candidates.length);
 }
});
test('an action bypassing observed outlet region evidence cannot navigate to the wrong region',async()=>{
 const f=linkedRegionFixture('p2-kagurazaka-kaiseki-20261029',true);
 const result=await f.native.search(f.request,new AbortController().signal);
 assert.equal(f.navigations.includes(f.wrong),false);assert.equal(result.candidates.length,0);
});

test('region evidence excludes foreign/malformed URLs, missing or invalid coordinates, and points beyond the original radius',()=>{
 const r=recordedRegions.find(r=>r.group==='checkpoint-b-corrected-20261019'&&r.caseId.includes('kagurazaka'))!;
 const source=r.googleBatch!.detail.read;
 const baseline=observedDirectoryOutletReference(tabelogDiscoveryPack,source,r.location)!;
 assert.ok(baseline);assert.ok(baseline.distanceMeters<=r.location.radiusMeters);
 const candidate=source.candidates.find(c=>c.restaurant.id===baseline.candidateId)!;
 for(const edit of [
  {sourceIds:{googleWebsiteUri:baseline.sourceUrl}}, {coordinates:{lat:NaN,lng:139}}, {coordinates:{lat:100,lng:139}},
  {coordinates:{lat:r.location.latitude+1,lng:r.location.longitude}},
  {sourceIds:{googleWebsiteUri:'https://unrelated.example/tokyo/A1309/A130905/12345678/'}},
  {sourceIds:{googleWebsiteUri:'https://tabelog.com/en/tokyo/A1309/'}},
 ]){
  const changed=structuredClone(candidate);
  if(!('coordinates' in edit)&&edit.sourceIds.googleWebsiteUri===baseline.sourceUrl)delete changed.restaurant.coordinates;
  else Object.assign(changed.restaurant,edit);
  assert.equal(observedDirectoryOutletReference(tabelogDiscoveryPack,{...source,candidates:[changed]},r.location),undefined);
 }
 const directory=tabelogDiscoveryPack.browser!.directory!;
 assert.equal(directory.containsObservedOutlet!('https://tabelog.com/en/tokyo/A1309/',baseline.sourceUrl),true);
 assert.equal(directory.containsObservedOutlet!('https://tabelog.com/en/tokyo/A1304/',baseline.sourceUrl),false);
 assert.equal(directory.containsObservedOutlet!('https://evil.example/en/tokyo/A1309/',baseline.sourceUrl),false);
});

test('a saved early source read cannot cross the authoritative request or runtime run',async()=>{
 const f=linkedRegionFixture('p2-kagurazaka-kaiseki-20261029');
 const result=await f.native.search(f.request,new AbortController().signal);
 await assert.rejects(f.native.search({...f.request,intent:{...f.request.intent,partySize:9},continuation:result.continuation!},new AbortController().signal),{code:'GOOGLE_MALFORMED_RESPONSE'});
 await assert.rejects(f.native.search({...f.request,readRunId:'different-run',continuation:result.continuation!},new AbortController().signal),{code:'GOOGLE_MALFORMED_RESPONSE'});
 assert.equal(f.googleCalls,1);
});

test('an early provider failure is reported at its original source stage without a second request',async()=>{
 const f=linkedRegionFixture('p2-kagurazaka-kaiseki-20261029',false,true);
 const first=await f.native.search(f.request,new AbortController().signal);
 const next=await f.native.search({...f.request,continuation:JSON.parse(JSON.stringify(first.continuation))},new AbortController().signal);
 assert.equal(f.googleCalls,1);assert.equal(next.candidates.length,0);assert.equal(next.metadata.failureCode,'GOOGLE_NETWORK_FAILED');
});

test('early region reference reading keeps the shared positive HARD retrieval and does not plan it twice',async()=>{
 const f=linkedRegionFixture('p2-kagurazaka-kaiseki-20261029',false,false,true);
 const first=await f.native.search(f.request,new AbortController().signal);
 assert.equal(first.candidates.length,1);assert.deepEqual(f.googleKeywords,['omakase']);
 const planningCalls=f.planningCalls;assert.ok(planningCalls>0);
 await f.native.search({...f.request,continuation:JSON.parse(JSON.stringify(first.continuation))},new AbortController().signal);
 assert.equal(f.googleCalls,1);assert.equal(f.planningCalls,planningCalls);
 assert.deepEqual(f.request.intent.criteria,[{text:'omakase',polarity:'POSITIVE',strength:'HARD'}]);
});
