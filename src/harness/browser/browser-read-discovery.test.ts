import {ModelBrowserReadActionDecision} from "../../infrastructure/browser/browser-action-decision.js";
import {scriptedBrowserObservation} from "../fixtures/restaurant-observation-model.js";
import {discoveryPackNetworkPolicy,tabelogDiscoveryPack,tableCheckDiscoveryPack} from "../../integrations/restaurant-search/source-packs.js";
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
import { url, identity, replayHar, replayHarPages, localFixture, guardedPages } from "./browser-read-test-fixtures.js";

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
  const pack=platform==='TABELOG'?tabelogDiscoveryPack:tableCheckDiscoveryPack,policy=discoveryPackNetworkPolicy([pack]);const startup=pack.browser!.startupUrl!;
  const result=new URL(platform==='TABELOG'?'https://tabelog.com/en/tokyo/rstLst/':startup);result.searchParams.set('q',subject.name);const searches=[result.toString()];
  const queryForm=(value:string)=>`<form method="get" action="${result.pathname}"><label>Restaurant<input name="q" type="search" value="${value}"></label><button>Search</button></form>`;
  const html=`<title>Fixture Restaurant</title><h1>Fixture Restaurant</h1><p class="address">1-1 Tokyo Fixture Street</p><a href="tel:03-1111-2222">Phone</a><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:subject.name,address:subject.address,telephone:subject.phone})}</script>${platform==='TABELOG'?'<p>Availability</p><select name="party_size"><option value="1">1</option></select><select name="date"><option value="1970-01-01">1970-01-01</option></select>':'<a href="https://www.tablecheck.com/en/shops/fixture/reserve">Reserve</a>'}`;
  const pages:Record<string,string>={[detail]:html,[startup]:queryForm('')};for(const search of searches)pages[search]=queryForm(subject.name)+`<a class="list-rst__rst-name-target" href="${detail}">Fixture Restaurant</a>`;
  const actions:string[]=[],fixture=await guardedPages(pages,policy);
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:async input=>{
   const session=await fixture.runtime.openSession(input);
   return new Proxy(session,{get(target,key){
    const value=Reflect.get(target,key);
    if(typeof value!=='function')return value;
    return (...args:unknown[])=>{if(['select','fill','click'].includes(String(key)))actions.push(String(key));return value.apply(target,args);};
   }});
  }};
  try{const artifact=await runNameResolutionMethodA('chromium',platform,subject,{mode:'OFFLINE_FIXTURE',runtime,networkPolicy:policy,decision:new ModelBrowserReadActionDecision({complete:async request=>scriptedBrowserObservation(request)!}),signal:new AbortController().signal});
  assert.equal(artifact.observation.accepted,true,JSON.stringify(artifact.observation));
  assert.equal(artifact.observation.rawSelectedPageUrl,detail);assert.equal(artifact.observation.modelCalls,3);
  assert.equal(artifact.pages.some(p=>p.url.includes('/reserve')),false);assert.equal(artifact.boundary.availabilityEvaluated,false);assert.deepEqual(actions,['fill','click'],'Only the observed name query is operated; no date/party/time control after HIGH identity');}finally{await fixture.close();}
 }
});


test('F5 current observation rejects three out-of-radius details and retains both in-radius candidates',async()=>{
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const center={latitude:35.7799638,longitude:139.723053},root='https://tabelog.com/en/',list='https://tabelog.com/en/tokyo/A1323/A132305/rstLst/';
 const detail=(id:number)=>`https://tabelog.com/en/tokyo/A1323/A132305/${13000000+id}/`;
 const pages:Record<string,string>={[root]:`<a href="${list}">Akabane</a>`,[list]:`<h1>Akabane</h1>`+[1,2,3,4,5].map(id=>`<a href="${detail(id)}">Constructed venue ${id}</a>`).join('')};
 for(const id of [1,2,3,4,5])pages[detail(id)]=`<h1>Constructed venue ${id}</h1><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:`Constructed venue ${id}`,address:'Tokyo',geo:id<4?{latitude:35.75,longitude:139.70}:center})}</script>`;
 const f=await guardedPages(pages,discoveryPackNetworkPolicy([tabelogDiscoveryPack]));let decisions=0;
 const model:import('../../core/model/contracts.js').ModelGateway={async complete(request){decisions++;assert.equal(request.purpose,'browser_read_decide');const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content),target=body.observation.targets.find((t:{label:string})=>t.label==='Akabane');return{invocationId:'f5-current',provider:'FIXTURE',model:'observed-source',finishReason:'TOOL_CALLS',latencyMs:0,outputText:JSON.stringify(target?{action:'OPEN_LINK',targetRef:target.ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Observed requested district'}:{action:'COMPLETE',targetRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'Verify the observed source list'})};}};
 const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,packs:[tabelogDiscoveryPack]},{browser:f.runtime,model,google:new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async()=>{throw Error('No external Google');}}),clock:{now:()=>new Date('2026-10-24T00:00:00Z')}});
 const intent={timezone:'Asia/Tokyo' as const,target:{goal:'RECOMMENDATION' as const,query:'restaurants'},area:{query:'near Akabane',radiusMeters:1000},criteria:[]};
 try{const read=await assembly.search.search({intent,readRunId:'f5-current',continuation:{intentFingerprint:JSON.stringify(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{...center,radiusMeters:1000,label:'Akabane',areaMatchBasis:'NAMED_PLACE_RADIUS'}}},AbortSignal.timeout(30000));
  assert.equal(read.candidates.length,2,JSON.stringify(read.metadata));assert.equal(read.metadata.nativeDiscoveryFunnel?.sourceDetailAttempts,5);
  assert.equal(read.metadata.nativeDiscoveryFunnel?.rejected.filter(r=>r.reasonCode==='OUTSIDE_EXACT_RADIUS').length,3);
  assert.deepEqual(read.candidates.map(c=>c.restaurant.outletName),['Constructed venue 4','Constructed venue 5']);assert.equal(decisions,2);
 }finally{await f.close();}
});
