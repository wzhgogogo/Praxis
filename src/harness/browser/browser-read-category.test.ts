import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime, BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
import { BrowserReadRecording } from "../../eval/restaurant/agent-loop/runners/browser-read-recording.js";
import { url, identity, replayHar, replayHarPages, localFixture } from "./browser-read-test-fixtures.js";

test('P21 discovery uses DOM category links despite CSS and rejects foreign regions',async()=>{
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const {tabelogDiscoveryPack}=await import('../../integrations/restaurant-search/source-packs.js');
 const {restaurantSearchIntentFingerprint}=await import('../../domains/restaurant/contracts.js');
 const empty=await readFile(new URL('../../integrations/tabelog/fixtures/empty-kaiseki.html',import.meta.url),'utf8');
 const homepageFragment=await readFile(new URL('../../integrations/tabelog/fixtures/p21-region-homepage-categories.html',import.meta.url),'utf8');
 for(const mode of ['refine','reject','homepage','general','forged-general','cross-source-general','no-general','cancel-partial'] as const){
 const region=mode==='homepage'?'https://tabelog.com/en/tokyo/A1303/':'https://tabelog.com/en/tokyo/A1000/A100001/rstLst/';
 const category=mode==='homepage'?region+'rstLst/sushi/':region+'cuisine/';
 const observedCategory=mode==='homepage'?category+'?sw=omakase':category;const foreign='https://tabelog.com/en/tokyo/A2000/A200001/rstLst/cuisine/';
 const root='https://tabelog.com/en/tokyo/rstLst/';const keyword=region+'?sw=kaiseki';
 const outlet=(n:number)=>`https://tabelog.com/tokyo/A1000/A100001/${12345600+n}/`;
 const links=(count:number)=>Array.from({length:count},(_,i)=>`<article><a class="list-rst__rst-name-target" href="${outlet(i+1)}">Fixture venue ${i+1}</a></article>`).join('');
 const categories='<div style="display:none">'+(mode==='homepage'?homepageFragment:`<a href="${category}">Observed cuisine</a>`)+`</div><a href="${foreign}">Foreign category</a><a style="display:none" href="${mode==='homepage'?region+'rstLst/':region}hidden/">Hidden category</a>`;
  const directory=await mkdtemp(join(tmpdir(),'p21-retrieval-'));const harPath=join(directory,'discovery.har');const navigations:string[]=[];const requests:Array<{purpose:string;body:any}>=[];
  const dynamic=(html:string)=>'<title>Fixture results</title><div class="skeleton" aria-busy="true">Loading results</div><script>setTimeout(()=>{document.body.innerHTML='+JSON.stringify(html)+'},120)</script>';
  const pages:Record<string,string>={[root]:`<title>Directory</title><a href="${mode==='no-general'?keyword:region}">Fixture District</a>`,[region]:'<title>Region</title>'+links(mode==='general'?5:1)+categories,[keyword]:dynamic(empty+categories),[category]:dynamic(links(5)+categories)};
  for(let n=1;n<=5;n++)pages[outlet(n)]=`<title>Fixture venue ${n}</title><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:`Fixture venue ${n}`,address:'Fixture District, Tokyo',geo:{latitude:35,longitude:139}})}</script><h1>Fixture venue ${n}</h1><p class="rstinfo-table__address">Fixture District, Tokyo</p>`;
  await writeFile(harPath,replayHarPages(pages));
  const cancellation=new AbortController();
  const raw=new LocalPlaywrightChromium();
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{
    const session=await raw.openSession({...input,replayHarPath:harPath});
    return new Proxy(session,{get(target,key){if(key==='openLink')return async(...args:Parameters<NonNullable<typeof session.openLink>>)=>{navigations.push(args[1]!);return target.openLink!(...args);};if(key==='navigate')return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);if(mode==='cancel-partial'&&args[0]===outlet(2)){cancellation.abort(Object.assign(new Error('Local constructed reserve cancellation'),{code:'DELIVERY_RESERVE_REACHED'}));throw cancellation.signal.reason;}return target.navigate(...args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  }};
  const model:import('../../core/model/contracts.js').ModelGateway={complete:async request=>{
    const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);requests.push({purpose:request.purpose,body});let result:unknown;
    if(request.purpose==='restaurant_discovery_retrieval'){
      assert.ok(body.observation.categories.every((c:{url:string})=>c.url!==foreign),'foreign-region categories never reach the planner');
      assert.ok(body.observation.categories.some((c:{url:string})=>c.url===observedCategory),'CSS-hidden observed category remains a planning option');
      if(mode==='homepage')assert.ok(body.observation.categories.length>0,'observed region homepage categories reach the planner');
      if (body.current && ['general','forged-general','cross-source-general','no-general'].includes(mode)) {
        const options=body.observation.generalLists;
        if(mode==='general')assert.ok(options.some((item:{url:string})=>item.url===region),'previously observed regional list is a real option');
        if(mode==='no-general'){
          assert.deepEqual(options,[],'no inferred plain URL after entering directly through a keyword URL');
          assert.ok(!(request.outputSchema.jsonSchema as any).properties.choice.enum.includes('GENERAL'));
        }
        assert.ok(options.every((item:{url:string})=>new URL(item.url).origin==='https://tabelog.com'&&new URL(item.url).pathname!==new URL(foreign).pathname),'foreign regions never become general options');
        result={choice:'GENERAL',keyword:'',criterionRef:'',categoryUrl:'',generalRef:mode==='general'?options.find((item:{url:string})=>item.url===region).ref:mode==='cross-source-general'?'general:tablecheck:1':mode==='forged-general'?region:'',reason:'Explicit observed general-list control'};
      }else result=mode==='reject'?{choice:body.current?'KEEP':'CATEGORY',keyword:'',criterionRef:'',generalRef:'',categoryUrl:body.current?'':foreign,reason:'Challenge source scope'}
        :body.current?{choice:'CATEGORY',keyword:'',criterionRef:'',generalRef:'',categoryUrl:observedCategory,reason:'Explicit empty, use observed category'}:{choice:'KEYWORD',keyword:'kaiseki',criterionRef:'criterion:0',generalRef:'',categoryUrl:'',reason:'Short positive retrieval'};
    }else{
      const target=body.observation.targets.find((t:{label:string})=>t.label==='Fixture District');
      result=target?{action:'OPEN_LINK',targetRef:target.ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Observed region'}:{action:'WAIT',targetRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'Wait for current result'};
    }
    return {invocationId:'fixture',provider:'FIXTURE',model:'script',outputText:JSON.stringify(result),finishReason:'TOOL_CALLS',latencyMs:0};
  }};
  const intent:import('../../domains/restaurant/contracts.js').RestaurantSearchIntent={timezone:'Asia/Tokyo',area:{query:'Fixture District'},criteria:[{text:'kaiseki restaurant',polarity:'POSITIVE',strength:'HARD'}]};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:15,maxAutomaticBrowserMs:30000,packs:[tabelogDiscoveryPack]}, {model,browser:runtime,google:new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async()=>{throw Error('No external Google');}}),clock:{now:()=>new Date('2026-10-17T00:00:00Z')}});
  try{
    const result=await assembly.search.search({readRunId:'chromium-retrieval',intent,continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:35,longitude:139,radiusMeters:1000,label:'Fixture District',areaMatchBasis:'NAMED_PLACE_RADIUS'}}},AbortSignal.any([AbortSignal.timeout(30000),cancellation.signal]));
    assert.equal(result.candidates.length,['reject','forged-general','cross-source-general','no-general'].includes(mode)?0:mode==='cancel-partial'?1:5,JSON.stringify({metadata:result.metadata,navigations}));
    assert.equal(navigations.includes(foreign),false);assert.equal(navigations.some(u=>u.includes('/reserve')||u.includes('/booking')),false);
    if(mode==='cancel-partial'){
      assert.equal(navigations.filter(url=>/^https:\/\/tabelog.com\/tokyo\/.*\/123456\d+\/$/.test(url)).length,2);
      assert.equal(result.continuation?.exhausted,false);
      assert.equal(result.metadata.nativeDiscoveryFunnel?.sourceExhausted,'UNKNOWN');
      assert.equal(result.continuation?.sourceProgress?.detailAttempts,2);
      assert.deepEqual(result.metadata.reserveReached?.completedCandidateIds,result.candidates.map(candidate=>candidate.restaurant.id));
    }else if(['refine','homepage'].includes(mode)){
      assert.ok(navigations.indexOf(category)<navigations.indexOf(outlet(1)),'refinement precedes detail reads');
      assert.ok(requests.some(r=>r.body.observation?.explicitEmpty),'recorded real empty state is parsed after its loader disappears');
      assert.equal(result.metadata.nativeDiscoveryFunnel?.retrieval?.rewrites,1);
    }else if(mode==='general'){
      assert.equal(navigations.filter(url=>url===region).length,2,'one initial observation and one model-selected return; no synthesized list');
      const selection=result.metadata.nativeDiscoveryFunnel!.retrieval!.selection!;
      assert.ok(selection.generalRef?.startsWith('general:tabelog:'));
      assert.equal(result.metadata.nativeDiscoveryFunnel?.retrieval?.rewrites,1);
      assert.ok(navigations.lastIndexOf(region)<navigations.indexOf(outlet(1)));
    }else {
      assert.equal(result.metadata.nativeDiscoveryFunnel?.retrieval?.history.at(-1)?.selection.rejectionReason,mode==='reject'?'UNOBSERVED_OR_OUTSIDE_REGION_CATEGORY':'UNOBSERVED_GENERAL_LIST');
      assert.equal(result.metadata.nativeDiscoveryFunnel?.sourceExhausted,'UNKNOWN');
      assert.equal(navigations.filter(url=>url===region).length,mode==='no-general'?0:1,'rejected general/category never navigates to plain list');
    }
    assert.deepEqual(intent.criteria,[{text:'kaiseki restaurant',polarity:'POSITIVE',strength:'HARD'}]);
  }finally{await rm(directory,{recursive:true,force:true});}
 }
});
