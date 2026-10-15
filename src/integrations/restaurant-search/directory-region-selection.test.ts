import assert from 'node:assert/strict';
import test from 'node:test';
import { BrowserRuntimeError } from '../../infrastructure/browser/browser-runtime-errors.js';
import type { BrowserReadActionDecisionPort } from '../../infrastructure/browser/browser-action-decision.js';
import type { BrowserRuntime, BrowserSession, BrowserSnapshot } from '../../infrastructure/browser/browser-runtime.js';
import { GooglePlacesClient } from '../google/google-places-client.js';
import { GooglePlacesRestaurantSearch } from '../google/google-places-restaurant-search.js';
import { NativeRestaurantSearch, directoryEntryReplacementAllowed } from './native-restaurant-search.js';
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
  const native=new NativeRestaurantSearch(runtime, google, ()=>now, undefined, decision, undefined, undefined, { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 }, undefined, [tabelogDiscoveryPack]);
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
