const fixtureRetrieval={decide:async(input?:{current?:unknown})=>input?.current?{accepted:true,keep:true,reason:"Retain current observed query."}:{accepted:true,keyword:"omakase",criterionRef:"criterion:0",reason:"Scripted retrieval control."}};
import assert from 'node:assert/strict';
import test from 'node:test';
import { BrowserTaskExecutor } from '../../infrastructure/browser/browser-task-executor.js';
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
function fixture(outside = true, missing = false, named = false, navigationFailure?: BrowserRuntimeError, normalName?: string, normalPoint?: {latitude:number;longitude:number}) {
  const navigations:string[]=[];let selections=0;
  const runtime:BrowserRuntime={openSession:async()=>{
    let page:BrowserSnapshot={url:root,title:'',text:'',html:''};
    const session:BrowserSession={metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now},
      navigate:async(url)=>{navigations.push(url);if(url===first&&navigationFailure)throw navigationFailure;let html='';
        if(url===root) html=`<a href="${first}">${normalName??(named?"Ueno":"First region")}</a><a href="${second}">${named?"Asakusa":"Second region"}</a>`;
        else if(url===first || url===second) html=Array.from({length:5},(_,n)=>{const id=(url===first?100:200)+n;return `<a class="list-rst__rst-name-target" href="/tokyo/A1304/A130401/${id}/">Outlet ${id}</a>`;}).join('') + (named && url===first?`<a href="${second}">Asakusa</a>`:'');
        else {const id=new URL(url).pathname.match(/\/(\d+)\/$/)![1]!;const name=`Outlet ${id}`,address='Tokyo';const point=outside&&Number(id)<200?{latitude:35.9,longitude:139.9}:(normalPoint??{latitude:35.66,longitude:139.70});html=`<script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name,address,...(missing?{}:{geo:point})})}</script><h1>${name}</h1><p class="rstinfo-table__address">${address}</p>`;}
        page={url,title:'Restaurants',text:html.replace(/<[^>]*>/g,' '),html};},
      snapshot:async()=>page,observeControls:async()=>[...page.html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m,n)=>({id:String(n),stableKey:m[1]!,kind:'LINK' as const,role:'link',label:m[2]!,href:new URL(m[1]!,page.url).href,visible:true,disabled:false})),
      click:async()=>{throw new Error('No click permitted');},fill:async()=>{throw new Error('No fill needed');},select:async()=>[],waitFor:async()=>{},waitForSettled:async()=>true,screenshot:async()=>new Uint8Array(),close:async()=>{}};return session;
  }};
  const decision:BrowserReadActionDecisionPort={decide:async(input)=>{selections++;if(input.regionCorrection)return {type:'SELECT_REGION_ENTRANCE',targetRef:input.regionCorrection.entrances.find(entry=>entry.href===second)!.ref,reason:'Choose retained observed region'};const target=input.observation.targets.find(t=>t.href===(selections===1?first:second))!;return {type:'OPEN_LINK',targetRef:target.ref,reason:'Choose observed region'};}};
  const google=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:'fixture-only',fetchImplementation:async()=>{throw new Error('No extra location request');}}));
  const native=new NativeRestaurantSearch(runtime, google, fixtureRetrieval, ()=>now, undefined, decision, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 80 }, undefined, [tabelogDiscoveryPack]);
  return {native,navigations,get selections(){return selections;}};
}
test('directory Agent uses observed references; a proved wrong first entry is replaced once without resetting progress',async()=>{
 const f=fixture();const read=await f.native.search({intent},new AbortController().signal);const region=read.continuation!.sourceProgress!.directoryRegion!;
 assert.equal(region.first.url,first);assert.match(region.first.targetRef,/observation:\d+:target:\d+/);assert.equal(region.samples.length,5);
 assert.equal(read.candidates.length,5);assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,10);assert.equal(read.continuation!.pagesRead,3);assert.equal(region.replacement!.url,second);assert.equal(directoryEntryReplacementAllowed(region),false);assert.equal(f.selections,2);
});
test('unknown coordinates do not establish a wrong entry and cannot admit candidates',async()=>{
 const f=fixture(false,true);const a=await f.native.search({intent},new AbortController().signal);assert.equal(a.candidates.length,0);assert.ok(a.metadata.nativeDiscoveryFunnel!.directoryRegion!.samples.every(x=>x.outcome==='UNKNOWN'));assert.equal(directoryEntryReplacementAllowed(a.metadata.nativeDiscoveryFunnel!.directoryRegion),false);assert.equal(f.selections,1);
});
test('only four proved outside among exactly five allow one replacement; spent deadline stays spent',async()=>{
 const region={first:{url:first,observedOn:root,targetRef:'observation:1:target:1'},samples:Array.from({length:5},(_,n)=>({sourceEntityId:String(n),sourceUrl:first,outcome:n<4?'OUTSIDE_RADIUS' as const:'UNKNOWN' as const}))};
 assert.equal(directoryEntryReplacementAllowed(region),true);assert.equal(directoryEntryReplacementAllowed({...region,samples:region.samples.slice(0,4)}),false);assert.equal(directoryEntryReplacementAllowed({...region,samples:region.samples.map((x,n)=>n===3?{...x,outcome:'UNKNOWN' as const}:x)}),false);assert.equal(directoryEntryReplacementAllowed({...region,replacement:{url:second,observedOn:root,targetRef:'observation:2:target:2'}}),false);
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
function linkedRegionFixture(caseId:string, rogue=false, failedRead=false, hard=false, localName?:string) {
 const record=structuredClone(recordedRegions.find(r=>r.group==='checkpoint-b-corrected-20261019'&&r.caseId===caseId)!);
 if(localName)record.location={...recordedRegions.find(r=>r.caseId.includes('kichijoji'))!.location,label:localName,areaMatchBasis:'NAMED_PLACE_RADIUS'};
 const references=record.googleBatch!.detail.read;
 const navigations:string[]=[];const googleKeywords:Array<string|undefined>=[];let googleCalls=0, decisions=0, planningCalls=0;
 const requested=localName??record.location.label;
 // Only the test's independent expected pages supply this table. Production
 // receives the unchanged recorded Google links and observed root links.
 const observedLocal=localName?[...regionFragment('root').matchAll(/href="([^"]+)"[^>]*>([^<]*)</g)].find(match=>match[2]!.includes('Kichijoji'))?.[1]:undefined;
 if(localName)assert.ok(observedLocal,'local Kichijoji uses its actual observed root entrance');
 const expected=observedLocal?new URL(observedLocal).pathname.split('/')[3]!:caseId.includes('kagurazaka')?'A1309':'A1317';
 const good=`https://tabelog.com/en/tokyo/${expected}/`;
 const wrong=caseId.includes('kagurazaka')?capturedParent:'https://tabelog.com/en/tokyo/A1316/';
 const outlet=`${good}${expected}01/13999999/`;
 if(localName){
  // Explicit local-constructed routing hint at the saved Kichijoji circle;
  // historical Google evidence is not reused as current identity/availability.
  const candidate=structuredClone(references.candidates[0]!);
  candidate.restaurant.coordinates={lat:record.location.latitude,lng:record.location.longitude};
  candidate.restaurant.sourceIds.googleWebsiteUri=outlet;
  references.candidates=[candidate];
 }
 let page:BrowserSnapshot={url:capturedRoot,title:'Regions',text:'',html:''};
 const runtime:BrowserRuntime={openSession:async()=>({
  metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now},
  navigate:async(url)=>{navigations.push(url);const current=url.includes('/tokyo/rstLst/')?capturedRoot:url;
   const path=new URL(current);path.search='';
   const html=path.href===capturedRoot?(localName?`<a href="${good}">Observed parent</a><a href="${wrong}">Unsupported parent</a>`:regionFragment('root')):path.href===good?`<a class="list-rst__rst-name-target" href="${outlet}">Controlled result</a>`:current===outlet?`<script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:'Controlled result',address:'Tokyo',geo:{latitude:record.location.latitude,longitude:record.location.longitude}})}</script>`:'';
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
 const planner={decide:async(input:Parameters<import("./discovery-retrieval-planner.js").DiscoveryRetrievalPlanner["decide"]>[0])=>{planningCalls++;return fixtureRetrieval.decide(input);}};
 const native=new NativeRestaurantSearch(runtime,google,planner,()=>now,undefined,decision,undefined,undefined,{maxAutomaticElapsedMs:300_000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24},undefined,[tabelogDiscoveryPack,googlePlacesDiscoveryPack]);
 const inputIntent={...intent,area:{query:`near ${requested}`,radiusMeters:1000},...(hard?{criteria:[{text:'omakase',polarity:'POSITIVE' as const,strength:'HARD' as const}]}:{})};
 const request={intent:inputIntent,readRunId:`region-${caseId}`,continuation:{intentFingerprint:JSON.stringify(inputIntent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{...record.location,label:requested}}};
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

// Local-constructed R1 control. Region labels/hrefs are projected from exposed
// D1 decisions5–10 @3ec38584; HTML and JSON-LD are synthetic, not website Replay.
const d1Root='https://tabelog.com/en/tokyo/';
const d1Parent='https://tabelog.com/en/tokyo/A1322/';
const d1Child='https://tabelog.com/en/tokyo/A1322/A132201/';
const d1Alternate='https://tabelog.com/en/tokyo/A1323/';
const akabanePoint={latitude:35.7799638,longitude:139.723053};
type LocalPoint = {latitude:number|string|null;longitude:number|string|null} | null;
const southwest={latitude:35.75,longitude:139.70};
function provisionalFixture(options: {points?:LocalPoint[]; replacementPoints?:LocalPoint[]; noAlternate?:boolean; invalidRef?:string; onNavigate?:(url:string)=>void; onCorrection?:()=>void; budget?:{totalModelCalls:number;maxModelCalls:number}} = {}) {
 const navigations:string[]=[];let steps=0,corrections=0;
 const contexts:Parameters<BrowserReadActionDecisionPort['decide']>[0][]=[];
 const points=options.points??[akabanePoint,akabanePoint], replacements=options.replacementPoints??[akabanePoint,akabanePoint];
 const details=new Map<string,{name:string;point:LocalPoint}>();
 const list=(replacement:boolean)=>{
  const values=replacement?replacements:points;
  return values.map((point,n)=>{const href=(replacement?'https://tabelog.com/en/tokyo/A1323/A132301/':d1Child)+(13000000+(replacement?100:0)+n+1)+'/';const name=(replacement?'Replacement':'Local')+' Outlet '+(n+1);details.set(href,{name,point});return `<a class="list-rst__rst-name-target" href="${href}">${name}</a>`;}).join('');
 };
 const runtime:BrowserRuntime={openSession:async()=>{
  let page:BrowserSnapshot={url:'about:blank',title:'Local constructed',text:'',html:''};
  return {
   metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now},
   navigate:async(url)=>{
    navigations.push(url);options.onNavigate?.(url);const actual=url===root?d1Root:url;const path=new URL(actual);const plain=path.origin+path.pathname;let html='';
    if(plain===d1Root)html=`<a href="${d1Parent}">Itabashi &amp; Along Tobu Railway Line</a>`+(options.noAlternate?'':`<a href="${d1Alternate}">Sugamo</a>`);
    else if(plain===d1Parent)html=`<a href="${d1Child}">Kita-Ikebukuro &amp; Itabashi St. Area</a>`;
    else if(plain===d1Child)html=list(false);
    else if(plain===d1Alternate)html=list(true);
    else {const detail=details.get(plain);assert.ok(detail,'local input did not define this page: '+plain);html=`<h1>${detail.name}</h1><p class="rstinfo-table__address">Tokyo</p><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:detail.name,address:'Tokyo',...(detail.point?{geo:detail.point}:{})})}</script>`;}
    page={url:actual,title:'Local constructed D1 control',text:html.replace(/<[^>]*>/g,' '),html};
   },
   snapshot:async()=>page,
   observeControls:async()=>[...page.html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map((m,n)=>({id:String(n),stableKey:m[1]!,kind:'LINK' as const,role:'link',label:m[2]!.replaceAll('&amp;','&'),href:m[1]!,visible:true,disabled:false})),
   click:async()=>{throw Error('No local click');},fill:async()=>{throw Error('No local fill');},select:async()=>[],waitFor:async()=>{},waitForSettled:async()=>true,screenshot:async()=>new Uint8Array(),close:async()=>{},
  };
 }};
 const decision:BrowserReadActionDecisionPort={decide:async input=>{
  contexts.push(structuredClone(input));
  if(input.regionCorrection){corrections++;options.onCorrection?.();const ref=options.invalidRef??input.regionCorrection.entrances.find(e=>e.href===d1Alternate)!.ref;return {type:'SELECT_REGION_ENTRANCE',targetRef:ref,reason:'Choose supplied observed entrance'};}
  steps++;const href=steps===1?d1Parent:steps===2?d1Child:undefined;
  if(href){const target=input.observation.targets.find(t=>t.href===href)!;return {type:'OPEN_LINK',targetRef:target.ref,reason:'D1 observed entrance'};}
  return steps===3?{type:'COMPLETE',reason:'Observed local list'}:{type:'REQUEST_HUMAN_HELP',reason:'Bounded old-predicate control'};
 }};
 const client=new GooglePlacesClient({apiKey:'fixture-only',fetchImplementation:async()=>{throw Error('No network');}});
 const google=new GooglePlacesRestaurantSearch(client);
 const native=new NativeRestaurantSearch(runtime,google,fixtureRetrieval,()=>now,undefined,decision,options.budget,undefined,{maxAutomaticElapsedMs:500_000,maxModelCallsPerCandidate:12,maxModelCallsTotal:50,maxOperationsPerCandidate:80},undefined,[tabelogDiscoveryPack]);
 const namedIntent={...intent,area:{query:'near Akabane',radiusMeters:1000}};
 const request={intent:namedIntent,continuation:{intentFingerprint:JSON.stringify(namedIntent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{...akabanePoint,radiusMeters:1000,label:'Akabane',areaMatchBasis:'NAMED_PLACE_RADIUS' as const}}};
 return {native,request,navigations,runtime,client,decision,contexts,get corrections(){return corrections;}};
}
test('R1 D1 unbound observed entrance reaches detail sampling before a place label or pointer is available',async()=>{
 const f=provisionalFixture();const result=await f.native.search(f.request,new AbortController().signal);
 assert.ok(result.metadata.nativeDiscoveryFunnel!.inspectedOutlets>0,'R1: namedEntrance must not prevent all coordinate sampling');
});


test('G1/G3 D1 second-level provisional samples replace once in four region pages with immutable directional feedback and no restore',async()=>{
 const budget={totalModelCalls:20,maxModelCalls:50};const f=provisionalFixture({points:[southwest,southwest,southwest],budget});
 const second=await f.native.search(f.request,new AbortController().signal);
 assert.equal(second.continuation!.sourceProgress!.directoryRegion!.provisional,true);
 assert.equal(second.continuation!.sourceProgress!.directoryRegion!.samples.length,2);
 assert.equal(directoryEntryReplacementAllowed(second.continuation!.sourceProgress!.directoryRegion),false);
 assert.equal(second.candidates.length,2);assert.equal(second.metadata.nativeDiscoveryFunnel!.retrieval!.regionPages,4);assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,4);
 assert.equal(f.corrections,1);assert.equal(f.navigations.filter(url=>url===root||url===d1Root||url===d1Parent||url===d1Child).length,3,'no menu/list restoration navigation');
 assert.equal(f.navigations.filter(url=>url===d1Alternate).length,1);assert.equal(budget.totalModelCalls,23,'shared prior20 plus two region choices and one correction');
 const context=f.contexts.find(input=>input.regionCorrection)!.regionCorrection!;
 assert.equal(context.samples.length,2);assert.ok(context.samples.every(sample=>sample.distanceMeters!>1000&&sample.direction==='SW'&&sample.bearingDegrees!>200&&sample.bearingDegrees!<230));
 assert.equal(context.entrances.find(entry=>entry.href===d1Alternate)!.observedOn,d1Root);
 assert.equal(context.remainingBudget.details,8);assert.equal(context.remainingBudget.regionPages,1);
 assert.match(second.metadata.nativeDiscoveryFunnel!.directoryRegion!.replacement!.targetRef,/^observation:/);
 assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceExhausted,'UNKNOWN');
});

test('C1/C2 local mixed and missing coordinates only count valid samples and never replace an in-radius entrance',async()=>{
 for(const points of [[akabanePoint,southwest],[southwest,akabanePoint],[null,southwest,null,southwest],[{latitude:null,longitude:null},southwest,{latitude:"",longitude:""},southwest],[{latitude:999,longitude:0},southwest,akabanePoint]] as LocalPoint[][]){
  const f=provisionalFixture({points});const read=await f.native.search(f.request,new AbortController().signal);const region=read.metadata.nativeDiscoveryFunnel!.directoryRegion!;
  const within=points.some(point=>point?.latitude===akabanePoint.latitude&&point?.longitude===akabanePoint.longitude);
  assert.equal(region.verified===true,within);assert.equal(directoryEntryReplacementAllowed(region),false);
  assert.equal(f.corrections,within?0:1);assert.equal(region.samples.length,points.length);
  assert.equal(read.candidates.length,within?1:2);assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,points.length+(within?0:2));
 }
});

test('A3 no observed alternate ends UNKNOWN immediately without asking the model or restoring a menu',async()=>{
 const budget={totalModelCalls:20,maxModelCalls:50};const f=provisionalFixture({points:[southwest,southwest],noAlternate:true,budget});
 const read=await f.native.search(f.request,new AbortController().signal);
 assert.equal(read.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,'NO_OBSERVED_REPLACEMENT_ENTRANCE');assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceEnded,true);assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceExhausted,'UNKNOWN');assert.equal(f.corrections,0);assert.equal(budget.totalModelCalls,22);
});

test('A3/G2 correct-area edge misclassification uses only one correction and retains previously admitted candidates and cumulative budget',async()=>{
 // Independent local oracle: correct region includes the circle edge; the four outside samples are not proof the whole region is wrong.
 for(const noAlternate of [false,true]) {
 const budget={totalModelCalls:20,maxModelCalls:50};const f=provisionalFixture({points:[akabanePoint,southwest,southwest,southwest,southwest],replacementPoints:[southwest,southwest,southwest],noAlternate,budget});
 const read=await f.native.search(f.request,new AbortController().signal);
 assert.equal(read.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,noAlternate?'NO_OBSERVED_REPLACEMENT_ENTRANCE':'REPLACEMENT_SAMPLES_OUTSIDE_RADIUS');assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceEnded,true);assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,noAlternate?5:7);
 assert.equal(f.corrections,noAlternate?0:1);assert.equal(read.candidates.length,1,'same-call correction cannot revoke the admitted candidate, even when selection fails');
 assert.equal(budget.totalModelCalls,noAlternate?22:23);assert.equal(read.metadata.nativeDiscoveryFunnel!.retrieval!.regionPages,noAlternate?3:4);
 }
});

test('X3 retained entrance selection rejects set-external, foreign-flow and invented href refs before navigation',async()=>{
 for(const invalidRef of ['region:outside:0','https://www.tablecheck.com/en/japan/search','region:foreign-flow:0',d1Alternate+'R3470/']){
  const budget={totalModelCalls:20,maxModelCalls:50};const f=provisionalFixture({points:[southwest,southwest],invalidRef,budget});
  const second=await f.native.search(f.request,new AbortController().signal);
  assert.equal(second.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,'INVALID_OBSERVED_ENTRANCE_SELECTION');assert.equal(f.navigations.includes(d1Alternate),false);assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceEnded,true);assert.equal(budget.totalModelCalls,23);
  assert.ok(f.contexts.find(input=>input.regionCorrection)!.regionCorrection!.entrances.every(entry=>entry.sourceId==='tabelog'));
 }
});

test('A3 source90 deadline after sampling is not reset by a correction or source handoff',async t=>{
 let clock=200_000;t.mock.method(Date,'now',()=>clock);const budget={totalModelCalls:20,maxModelCalls:50};
 const f=provisionalFixture({points:[southwest,southwest],budget,onCorrection:()=>{clock+=90_000;}});
 const read=await f.native.search(f.request,new AbortController().signal);
 assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceTimeLimitReached,true);assert.equal(read.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,'SOURCE_BUDGET_EXHAUSTED');assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,2);assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceElapsedMs,90_000);assert.equal(budget.totalModelCalls,23);assert.equal(f.navigations.includes(d1Alternate),false);
});

// N1/N2/N4 reuse the existing behavior builder; HTML/details are local constructed.
test('N1 N2 N4 named Shibuya Kagurazaka Higashi-Ginza controls retain original page and detail counts',async()=>{
 for(const [name,caseKey] of [['Shibuya','h001'],['Kagurazaka','kagurazaka'],['Higashi-Ginza','h005']]) {
  const point=recordedRegions.find(r=>r.caseId.includes(caseKey!))!.location;
  const f=fixture(false,false,false,undefined,name,point);const namedIntent={...intent,area:{query:`near ${name}`,radiusMeters:1000}};
  const result=await f.native.search({intent:namedIntent,continuation:{intentFingerprint:JSON.stringify(namedIntent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:point.latitude,longitude:point.longitude,radiusMeters:1000,label:name!,areaMatchBasis:'NAMED_PLACE_RADIUS'}}},new AbortController().signal);
  const region=result.metadata.nativeDiscoveryFunnel!.directoryRegion!;
  assert.equal(region.provisional,false);assert.equal(region.replacement,undefined);assert.equal(f.selections,1);
  assert.equal(result.candidates.length,5);assert.equal(result.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,5);assert.equal(result.metadata.nativeDiscoveryFunnel!.retrieval!.regionPages,2);assert.equal(f.navigations.length,7,'baseline two region pages plus five details');
 }
});

test('N3 local Kichijoji same-source pointer control keeps a nonmatching observed label and original budget',async()=>{
 const f=linkedRegionFixture('p2-kagurazaka-kaiseki-20261029',false,false,false,'Kichijoji');
 const read=await f.native.search(f.request,new AbortController().signal);const region=read.metadata.nativeDiscoveryFunnel!.directoryRegion!;
 assert.equal(read.candidates.length,1,JSON.stringify({metadata:read.metadata,nav:f.navigations}));assert.equal(region.provisional,false);assert.equal(region.replacement,undefined);assert.equal(region.first.url,f.good);assert.equal(f.decisions,1);assert.equal(f.googleCalls,1);assert.equal(read.metadata.nativeDiscoveryFunnel!.retrieval!.regionPages,2);assert.equal(read.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,1);assert.equal(f.navigations.length,3);
});

// Local-constructed cumulative-budget control; production handoff is separately
// exercised by F5 composition. Clock starts at run0, then200s/20calls are spent.
test('B1 all A3 endings retain the remaining500s/50call window at the next source',async t=>{
 let clock=0;t.mock.method(Date,'now',()=>clock);
 for(const mode of ['no-alternate','second-outside','correct-area-misclassified','source90']) {
  clock=0;const budget={totalModelCalls:20,maxModelCalls:50};let nextContext:any;
  const nextSource=new BrowserTaskExecutor({openSession:async()=>{throw Error('Data-only budget control');}},{maxAutomaticElapsedMs:500000,maxModelCallsPerCandidate:6,maxModelCallsTotal:50,maxOperationsPerCandidate:24,budget,modelDecision:{decide:async input=>{nextContext=input;return {type:'SELECT_REGION_ENTRANCE',targetRef:'region:next:0',reason:'Only supplied reference'};}}});
  clock=200000;
  const f=provisionalFixture({points:[southwest,southwest],replacementPoints:[southwest,southwest],noAlternate:mode==='no-alternate',budget,onNavigate:()=>{clock+=1000;},onCorrection:()=>{if(mode==='source90')clock+=90000;}});
  const read=await f.native.search(f.request,new AbortController().signal);
  const progress=read.metadata.nativeDiscoveryFunnel!;assert.equal(progress.sourceEnded,true);assert.equal(progress.sourceExhausted,'UNKNOWN');assert.ok(progress.sourceElapsedMs!>0);assert.equal(progress.sourceDetailAttempts,mode==='no-alternate'||mode==='source90'?2:4);
  const priorCalls=budget.totalModelCalls,remainingMs=500000-clock;
  const input={taskId:'same-run-next-source',source:'NEXT_SOURCE',stage:'DISCOVERY' as const,signal:new AbortController().signal,goal:{outlet:{name:'Restaurants'},hardCriteria:[]},regionCorrection:{sourceId:'next',flowId:'next-flow',replacementsUsed:0 as const,remainingBudget:{sourceMs:90000,details:10,regionPages:4,retrievalPages:3},entrances:[{ref:'region:next:0',sourceId:'next',flowId:'next-flow',href:'https://next.example/observed/',label:'Observed',observedOn:'https://next.example/',originalTargetRef:'observation:1:target:1',observationRevision:1}],samples:[]}};
  assert.equal((await nextSource.selectRegionEntrance(input)).status,'SELECTED');assert.equal(budget.totalModelCalls,priorCalls+1);
  assert.ok(nextContext.progress.includes(`remaining after this choice: ${50-priorCalls-1}`));assert.ok(nextContext.progress.includes(`window remaining: ${remainingMs} ms`));
  clock=500000;const stopped=await nextSource.selectRegionEntrance(input);assert.equal(stopped.status,'NO_SAFE_ACTION');assert.equal(budget.totalModelCalls,priorCalls+1,'spent run deadline cannot start another model call');
 }
});


test('X3 a whole saved collection cannot be replayed into another read run with the same intent',async()=>{
 for(const points of [[null,null,null,null,null,null,null]]) {
 const budget={totalModelCalls:20,maxModelCalls:50},f=provisionalFixture({points,budget});
 const first=await f.native.search({...f.request,readRunId:'task-one:run-one'},new AbortController().signal);
 assert.equal(first.continuation!.sourceProgress!.regionEntrances!.readRunId,'task-one:run-one');
 const previousVisits=f.navigations.length,previousCalls=budget.totalModelCalls;
 const second=await f.native.search({...f.request,readRunId:'task-two:run-two',continuation:JSON.parse(JSON.stringify(first.continuation))},new AbortController().signal);
 assert.equal(second.metadata.nativeDiscoveryFunnel!.directoryRegion!.stopReason,'INVALID_OBSERVED_ENTRANCE_SCOPE');assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceEnded,true,'terminal scope rejection must end source despite pending details');assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceExhausted,'UNKNOWN');
 assert.equal(f.navigations.length,previousVisits);assert.equal(budget.totalModelCalls,previousCalls);assert.equal(f.corrections,0);
 }
});
