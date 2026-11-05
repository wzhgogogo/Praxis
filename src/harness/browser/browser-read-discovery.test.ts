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

test('P1-D Chromium observes LOCATION binding and fills exactly the resolved name, excluding personal address and nameless requests',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'praxis-location-'));const pageUrl='https://directory.example/areas';const harPath=join(directory,'location.har');
 await writeFile(harPath,replayHar(pageUrl,'<title>Areas</title><input type="search" name="location" aria-label="Area or station"><input name="customer_address" aria-label="Location address"><output id="result">Choose location</output><script>document.querySelector("[name=location]").oninput=e=>document.querySelector("#result").textContent="Location selected: "+e.target.value</script>'));
 try{for(const name of ['Ebisu Station',undefined]){
  const raw=new LocalPlaywrightChromium();const policy={documentOrigins:['https://directory.example'],genericPublicRead:true,staticResources:[],dynamicReads:[]} as const;
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:input=>raw.openSession({...input,networkPolicy:policy,replayHarPath:harPath})};let calls=0;
  const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, modelDecision:{decide:async input=>{calls++;const area=input.observation.targets.find(t=>t.label==='Area or station')!,address=input.observation.targets.find(t=>t.label==='Location address')!;assert.ok(!address.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'));assert.equal(area.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION')??false,name!==undefined);return name?{type:'FILL_AUTHORITATIVE',field:'LOCATION',targetRef:area.ref,reason:'Apply exact name'}:{type:'REQUEST_HUMAN_HELP',reason:'No authoritative name'};}}});
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'DIRECTORY','DISCOVERY',policy);
  try{await executor.navigate({ observed: true,session,signal,source:'DIRECTORY',stage:'DISCOVERY',allowedOrigins:policy.documentOrigins,url:pageUrl});const result=await executor.runSkill({taskId:'location-fixture',session,signal,source:'DIRECTORY',stage:'DISCOVERY',allowedOrigins:policy.documentOrigins,goal:{outlet:{name:'Restaurants'},location:{latitude:35.66,longitude:139.7,radiusMeters:1000,...(name?{name}:{})},hardCriteria:[]},objective:'Select the public area',completion:snapshot=>({complete:snapshot.text.includes('Location selected: Ebisu Station'),resultBusy:false,resultKey:snapshot.text,reason:'Observe the exact selected location'})});assert.equal(result.status,name?'COMPLETED':'REQUESTED_HUMAN_HELP');assert.equal(calls,1);assert.equal(result.controls.find(c=>c.label==='Location address')?.value,'');}finally{await executor.close();}
 }}finally{await rm(directory,{recursive:true,force:true});}
});




test('P21b guarded search filters reject unaudited parameters under the production generic-read policy',async()=>{
 const {tabelogDiscoveryPack,tableCheckDiscoveryPack,discoveryPackNetworkPolicy}=await import('../../integrations/restaurant-search/source-packs.js');
 for(const pack of [tabelogDiscoveryPack,tableCheckDiscoveryPack]){
  const directory=await mkdtemp(join(tmpdir(),'p21b-network-'));const harPath=join(directory,'search.har');
  const good=pack.meta.id==='tabelog'?'https://tabelog.com/en/tokyo/A1303/rstLst/?vac_net=1&svd=20261027&svt=1900&svps=2':'https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35&geo_longitude=139&geo_distance=1km&auto_geolocate=false&date=2026-10-27&time=19%3A00&num_people=2&availability_mode=same_meal_time';
  const bad=good+'&unreviewed=1';await writeFile(harPath,replayHarPages({[good]:'<title>Public results</title>',[bad]:'<title>Unaudited field</title>'}));
  const session=await new LocalPlaywrightChromium().openSession({signal:AbortSignal.timeout(10000),networkPolicy:discoveryPackNetworkPolicy([pack]),replayHarPath:harPath});
  try{
   await session.prepareNavigation?.(good,{timeoutMs:10_000});await session.navigate(good,{timeoutMs:10_000});
   await assert.rejects(async()=>{await session.prepareNavigation?.(bad,{timeoutMs:10_000});await session.navigate(bad,{timeoutMs:10_000});},/admitted|blocked|failed/i);
  }finally{await session.close();await rm(directory,{recursive:true,force:true});}
 }
});

test('name-resolution benchmark uses the production prefix on Chromium and stops before any reservation navigation',async()=>{
 const {runNameResolutionMethodA}=await import('../../eval/restaurant/agent-loop/name-resolution-method-a.js');
 const subject={name:'Fixture Restaurant',address:'1-1 Tokyo Fixture Street',phone:'03-1111-2222',coordinates:{lat:35.66,lng:139.7}};
 for(const platform of ['TABELOG','TABLECHECK'] as const){
  const detail=platform==='TABELOG'?'https://tabelog.com/tokyo/A1303/A130301/12345/':'https://www.tablecheck.com/en/fixture';
  const searches=platform==='TABELOG'?['https://tabelog.com/en/tokyo/rstLst/?sw=Fixture%20Restaurant']:['https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&search_text=Fixture+Restaurant&geo_latitude=35.66&geo_longitude=139.7&geo_distance=5km&auto_geolocate=false'];
  const html=`<title>Fixture Restaurant</title><h1>Fixture Restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:subject.name,address:subject.address,telephone:subject.phone})}</script>${platform==='TABELOG'?'<p>Availability</p><select name="party_size"><option value="1">1</option></select><select name="date"><option value="1970-01-01">1970-01-01</option></select>':'<a href="https://www.tablecheck.com/en/shops/fixture/reserve">Reserve</a>'}`;
  const pages:Record<string,string>={[detail]:html};for(const search of searches)pages[search]=`<a class="list-rst__rst-name-target" href="${detail}">Fixture Restaurant</a>`;
  const actions:string[]=[],fixture=localFixture(pages);
  const runtime:BrowserRuntime={openSession:async input=>{
   const session=await fixture.openSession(input);
   return new Proxy(session,{get(target,key){
    const value=Reflect.get(target,key);
    if(typeof value!=='function')return value;
    return (...args:unknown[])=>{if(['select','fill','click'].includes(String(key)))actions.push(String(key));return value.apply(target,args);};
   }});
  }};
  const artifact=await runNameResolutionMethodA('chromium',platform,subject,{mode:'OFFLINE_FIXTURE',runtime,signal:new AbortController().signal});
  assert.equal(artifact.observation.accepted,true,JSON.stringify(artifact.observation));
  assert.equal(artifact.observation.rawSelectedPageUrl,detail);assert.equal(artifact.observation.modelCalls,0);
  assert.equal(artifact.pages.some(p=>p.url.includes('/reserve')),false);assert.equal(artifact.boundary.availabilityEvaluated,false);assert.deepEqual(actions,[],'No underlying request-control action after HIGH identity');
 }
});


test('F5 G3 Chromium follows four observed region pages and directly selects the retained entrance without restoring a menu',async()=>{
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const {tabelogDiscoveryPack}=await import('../../integrations/restaurant-search/source-packs.js');
 const center={latitude:35.7799638,longitude:139.723053};
 const root='https://tabelog.com/en/tokyo/rstLst/',parent='https://tabelog.com/en/tokyo/A1322/',child=parent+'A132201/',alternate='https://tabelog.com/en/tokyo/A1323/';
 const detail=(n:number)=>'https://tabelog.com/en/tokyo/A1322/A132201/'+(13000000+n)+'/';
 const list=(ids:number[])=>ids.map(id=>`<a class="list-rst__rst-name-target" href="${detail(id)}">Constructed venue ${id}</a>`).join('');
 const pages:Record<string,string>={[root]:`<a href="${parent}">Itabashi</a><a href="${alternate}">Sugamo</a>`,[parent]:`<a href="${child}">Itabashi ward</a>`,[child]:list([1,2,3]),[alternate]:list([4,5])};
 for(const id of [1,2,3,4,5])pages[detail(id)]=`<h1>Constructed venue ${id}</h1><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:`Constructed venue ${id}`,address:'Tokyo',geo:id<4?{latitude:35.75,longitude:139.70}:center})}</script>`;
 const folder=await mkdtemp(join(tmpdir(),'praxis-f5-g3-')),harPath=join(folder,'constructed.har');await writeFile(harPath,replayHarPages(pages));
 const raw=new LocalPlaywrightChromium();const navigations:string[]=[],corrections:any[]=[];let decisions=0;
 const browser:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{
  const session=await raw.openSession({...input,replayHarPath:harPath});
  return new Proxy(session,{get(target,key){if(key==='openLink')return async(...args:Parameters<NonNullable<typeof session.openLink>>)=>{navigations.push(args[1]!);return target.openLink!(...args);};if(key==='navigate')return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);return target.navigate(...args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
 }};
 const model:import('../../core/model/contracts.js').ModelGateway={complete:async request=>{
  decisions++;assert.equal(request.purpose,'browser_read_decide');const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);
  const correction=body.regionCorrection;if(correction)corrections.push(structuredClone(correction));
  const target=correction?correction.entrances.find((entry:any)=>entry.href===alternate):body.observation.targets.find((target:any)=>target.href===(body.observation.url===root?parent:child));assert.ok(target);
  return {invocationId:'local-f5',provider:'FIXTURE',model:'scripted',finishReason:'TOOL_CALLS',latencyMs:0,outputText:JSON.stringify({action:correction?'SELECT_REGION_ENTRANCE':'OPEN_LINK',targetRef:target.ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Choose supplied observed ref; no href'})};
 }};
 const google=new GooglePlacesClient({apiKey:'fixture-only',fetchImplementation:async()=>{throw Error('No external Google request');}});
 const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxBrowserOperationsPerCandidate:80,packs:[tabelogDiscoveryPack]}, {browser,model,google,clock:{now:()=>new Date('2026-10-24T00:00:00Z')}});
 const intent={timezone:'Asia/Tokyo' as const,target:{goal:'RECOMMENDATION' as const,query:'restaurants'},area:{query:'near Akabane',radiusMeters:1000},criteria:[]};
 const initial={intent,readRunId:'f5-local-chromium',continuation:{intentFingerprint:JSON.stringify(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{...center,radiusMeters:1000,label:'Akabane',areaMatchBasis:'NAMED_PLACE_RADIUS' as const}}};
 try {
  const second=await assembly.search.search(initial,AbortSignal.timeout(30000));
  assert.equal(second.candidates.length,2,JSON.stringify(second.metadata));assert.equal(second.metadata.nativeDiscoveryFunnel!.retrieval!.regionPages,4);assert.equal(second.metadata.nativeDiscoveryFunnel!.sourceDetailAttempts,4);
  assert.deepEqual(navigations.filter(url=>[root,parent,child,alternate].includes(url)),[root,parent,child,alternate]);assert.equal(corrections.length,1);assert.equal(decisions,3);
  assert.equal(corrections[0].entrances.find((entry:any)=>entry.href===alternate).observedOn,root);assert.ok(corrections[0].samples.every((sample:any)=>sample.direction==='SW'&&sample.distanceMeters>1000));assert.equal(corrections[0].remainingBudget.regionPages,1);
 } finally {await rm(folder,{recursive:true,force:true});}
});
