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
  try{await executor.navigate({session,signal,source:'DIRECTORY',stage:'DISCOVERY',allowedOrigins:policy.documentOrigins,url:pageUrl});const result=await executor.runSkill({taskId:'location-fixture',session,signal,source:'DIRECTORY',stage:'DISCOVERY',allowedOrigins:policy.documentOrigins,goal:{outlet:{name:'Restaurants'},location:{latitude:35.66,longitude:139.7,radiusMeters:1000,...(name?{name}:{})},hardCriteria:[]},objective:'Select the public area',completion:snapshot=>({complete:snapshot.text.includes('Location selected: Ebisu Station'),resultBusy:false,resultKey:snapshot.text,reason:'Observe the exact selected location'})});assert.equal(result.status,name?'COMPLETED':'REQUESTED_HUMAN_HELP');assert.equal(calls,1);assert.equal(result.controls.find(c=>c.label==='Location address')?.value,'');}finally{await executor.close();}
 }}finally{await rm(directory,{recursive:true,force:true});}
});



test('P21 discovery uses DOM category links despite CSS and rejects foreign regions',async()=>{
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const {tabelogDiscoveryPack}=await import('../../integrations/restaurant-search/source-packs.js');
 const {restaurantSearchIntentFingerprint}=await import('../../domains/restaurant/contracts.js');
 const empty=await readFile(new URL('../../integrations/tabelog/fixtures/empty-kaiseki.html',import.meta.url),'utf8');
 const homepageFragment=await readFile(new URL('../../integrations/tabelog/fixtures/p21-region-homepage-categories.html',import.meta.url),'utf8');
 for(const mode of ['refine','reject','homepage'] as const){
 const region=mode==='homepage'?'https://tabelog.com/en/tokyo/A1303/':'https://tabelog.com/en/tokyo/A1000/A100001/rstLst/';
 const category=mode==='homepage'?region+'rstLst/sushi/':region+'cuisine/';
 const observedCategory=mode==='homepage'?category+'?sw=omakase':category;const foreign='https://tabelog.com/en/tokyo/A2000/A200001/rstLst/cuisine/';
 const root='https://tabelog.com/en/tokyo/rstLst/';const keyword=region+'?sw=kaiseki';
 const outlet=(n:number)=>`https://tabelog.com/tokyo/A1000/A100001/${12345600+n}/`;
 const links=(count:number)=>Array.from({length:count},(_,i)=>`<article><a class="list-rst__rst-name-target" href="${outlet(i+1)}">Fixture venue ${i+1}</a></article>`).join('');
 const categories='<div style="display:none">'+(mode==='homepage'?homepageFragment:`<a href="${category}">Observed cuisine</a>`)+`</div><a href="${foreign}">Foreign category</a><a style="display:none" href="${mode==='homepage'?region+'rstLst/':region}hidden/">Hidden category</a>`;
  const directory=await mkdtemp(join(tmpdir(),'p21-retrieval-'));const harPath=join(directory,'discovery.har');const navigations:string[]=[];const requests:Array<{purpose:string;body:any}>=[];
  const dynamic=(html:string)=>'<title>Fixture results</title><div class="skeleton" aria-busy="true">Loading results</div><script>setTimeout(()=>{document.body.innerHTML='+JSON.stringify(html)+'},120)</script>';
  const pages:Record<string,string>={[root]:`<title>Directory</title><a href="${region}">Fixture District</a>`,[region]:'<title>Region</title>'+links(1)+categories,[keyword]:dynamic(empty+categories),[category]:dynamic(links(5)+categories)};
  for(let n=1;n<=5;n++)pages[outlet(n)]=`<title>Fixture venue ${n}</title><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:`Fixture venue ${n}`,address:'Fixture District, Tokyo',geo:{latitude:35,longitude:139}})}</script><h1>Fixture venue ${n}</h1><p class="rstinfo-table__address">Fixture District, Tokyo</p>`;
  await writeFile(harPath,replayHarPages(pages));
  const raw=new LocalPlaywrightChromium();
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{
    const session=await raw.openSession({...input,replayHarPath:harPath});
    return new Proxy(session,{get(target,key){if(key==='openLink')return async(...args:Parameters<NonNullable<typeof session.openLink>>)=>{navigations.push(args[1]!);return target.openLink!(...args);};if(key==='navigate')return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);return target.navigate(...args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  }};
  const model:import('../../core/model/contracts.js').ModelGateway={complete:async request=>{
    const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);requests.push({purpose:request.purpose,body});let result:unknown;
    if(request.purpose==='restaurant_discovery_retrieval'){
      assert.ok(body.observation.categories.every((c:{url:string})=>c.url!==foreign),'foreign-region categories never reach the planner');
      assert.ok(body.observation.categories.some((c:{url:string})=>c.url===observedCategory),'CSS-hidden observed category remains a planning option');
      if(mode==='homepage')assert.ok(body.observation.categories.length>0,'observed region homepage categories reach the planner');
      result=mode==='reject'?{choice:body.current?'KEEP':'CATEGORY',keyword:'',criterionRef:'',categoryUrl:body.current?'':foreign,reason:'Challenge source scope'}
        :body.current?{choice:'CATEGORY',keyword:'',criterionRef:'',categoryUrl:observedCategory,reason:'Explicit empty, use observed category'}:{choice:'KEYWORD',keyword:'kaiseki',criterionRef:'criterion:0',categoryUrl:'',reason:'Short positive retrieval'};
    }else{
      const target=body.observation.targets.find((t:{label:string})=>t.label==='Fixture District');
      result=target?{action:'OPEN_LINK',targetRef:target.ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Observed region'}:{action:'WAIT',targetRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'Wait for current result'};
    }
    return {invocationId:'fixture',provider:'FIXTURE',model:'script',outputText:JSON.stringify(result),finishReason:'TOOL_CALLS',latencyMs:0};
  }};
  const intent:import('../../domains/restaurant/contracts.js').RestaurantSearchIntent={timezone:'Asia/Tokyo',area:{query:'Fixture District'},criteria:[{text:'kaiseki restaurant',polarity:'POSITIVE',strength:'HARD'}]};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxModelCalls:15,maxAutomaticBrowserMs:30000,packs:[tabelogDiscoveryPack]}, {model,browser:runtime,google:new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async()=>{throw Error('No external Google');}}),clock:{now:()=>new Date('2026-10-17T00:00:00Z')}});
  try{
    const result=await assembly.search.search({readRunId:'chromium-retrieval',intent,continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:35,longitude:139,radiusMeters:1000,label:'Fixture District',areaMatchBasis:'NAMED_PLACE_RADIUS'}}},AbortSignal.timeout(30000));
    assert.equal(result.candidates.length,mode==='reject'?1:5,JSON.stringify({metadata:result.metadata,navigations}));
    assert.equal(navigations.includes(foreign),false);assert.equal(navigations.some(u=>u.includes('/reserve')||u.includes('/booking')),false);
    if(mode!=='reject'){
      assert.ok(navigations.indexOf(category)<navigations.indexOf(outlet(1)),'refinement precedes detail reads');
      assert.ok(requests.some(r=>r.body.observation?.explicitEmpty),'recorded real empty state is parsed after its loader disappears');
      assert.equal(result.metadata.nativeDiscoveryFunnel?.retrieval?.rewrites,1);
    }else assert.equal(result.metadata.nativeDiscoveryFunnel?.retrieval?.selection?.rejectionReason,'UNOBSERVED_OR_OUTSIDE_REGION_CATEGORY');
    assert.deepEqual(intent.criteria,[{text:'kaiseki restaurant',polarity:'POSITIVE',strength:'HARD'}]);
  }finally{await rm(directory,{recursive:true,force:true});}
 }
});

test('P21b production discovery checks search filters, falls back once, and records only read hints',async()=>{
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const {tabelogDiscoveryPack,tableCheckDiscoveryPack}=await import('../../integrations/restaurant-search/source-packs.js');
 const {restaurantSearchIntentFingerprint}=await import('../../domains/restaurant/contracts.js');
 for(const pack of [tabelogDiscoveryPack,tableCheckDiscoveryPack])for(const mode of ['applied','mismatch','empty','recommendation','wide','missing','homepage'] as const){
  if(mode==='homepage'&&!pack.browser!.directory)continue;
  const directory=await mkdtemp(join(tmpdir(),'p21b-search-'));const harPath=join(directory,'search.har');
  const isDirectory=!!pack.browser!.directory;
  const root=isDirectory?'https://tabelog.com/en/tokyo/rstLst/':pack.buildQuery({category:'restaurant',positiveCriteria:[],location:{latitude:35,longitude:139,radiusMeters:1000,label:'Fixture District',areaMatchBasis:'NAMED_PLACE_RADIUS'}}).url;
  const observed='https://tabelog.com/en/tokyo/A1000/A100001/rstLst/';
  const base=isDirectory?(mode==='homepage'?'https://tabelog.com/en/tokyo/A1000/A100001/':observed):root;
  const applied=isDirectory&&(mode==='applied'||mode==='homepage');
  const filtered=new URL(mode==='homepage'?observed:base);
  for(const [k,v] of Object.entries(isDirectory?{vac_net:'1',svd:'20261027',svt:'1900',svps:'2'}:{date:'2026-10-27',time:'19:00',num_people:'2',availability_mode:'same_meal_time'}))filtered.searchParams.set(k,v);
  const outlet=(n:number)=>isDirectory?`https://tabelog.com/tokyo/A1000/A100001/${12345600+n}/`:`https://www.tablecheck.com/en/fixture-venue-${n}`;
  const cards=(start:number)=>Array.from({length:5},(_,i)=>`<article><a ${isDirectory?'class="list-rst__rst-name-target"':''} href="${outlet(start+i)}">Fixture venue ${start+i}</a><span>19:00</span></article>`).join('');
  const selected=isDirectory?`<div><span class="js-list-sidebar-cal-date calendar__day is-current" data-date="20261027">27</span><select name="svps" aria-label="Guests"><option value="${mode==='mismatch'?3:2}" selected>Guests</option></select><select name="svt" aria-label="Time"><option value="1900" selected>19:00</option></select></div>`:`<button data-testid="Date Field">Date Oct 27, 2026 7:00 PM</button><button data-testid="Guests Field">Guests ${mode==='mismatch'?3:2} guests</button>`;
  const pages:Record<string,string>={[root]:isDirectory?`<title>Regions</title><a href="${observed}">Fixture District</a>`:'<title>Unfiltered</title>'+cards(1),[base]:'<title>Unfiltered</title>'+cards(1),[filtered.toString()]:'<title>Filtered</title>'+selected+(mode==='empty'?'No restaurants found':cards(6))};
  for(let n=1;n<=10;n++)pages[outlet(n)]=`<title>Fixture venue ${n}</title><h1>Fixture venue ${n}</h1><p class="${isDirectory?'rstinfo-table__address':'address'}">Fixture District, Tokyo</p><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:`Fixture venue ${n}`,address:'Fixture District, Tokyo',geo:{latitude:35,longitude:139}})}</script>`;
  const har=JSON.parse(replayHarPages(pages));
  if(mode==='homepage')har.log.entries.push({startedDateTime:'2026-10-07T00:00:00Z',request:{method:'GET',url:observed,httpVersion:'HTTP/1.1',headers:[],queryString:[],cookies:[],headersSize:-1,bodySize:-1},response:{status:302,statusText:'Found',httpVersion:'HTTP/1.1',headers:[{name:'location',value:base}],cookies:[],content:{size:0,mimeType:'text/html',text:''},redirectURL:base,headersSize:-1,bodySize:-1},cache:{},timings:{send:0,wait:0,receive:0}});
  await writeFile(harPath,JSON.stringify(har));const navigations:string[]=[];const snapshots:import('../../infrastructure/browser/browser-runtime.js').BrowserSnapshot[]=[];const raw=new LocalPlaywrightChromium();
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{const session=await raw.openSession({...input,replayHarPath:harPath});return new Proxy(session,{get(target,key){if(key==='navigate')return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);return target.navigate(...args);};if(key==='snapshot')return async()=>{const snapshot=await target.snapshot();snapshots.push(snapshot);return snapshot;};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});}};
  const model:import('../../core/model/contracts.js').ModelGateway={complete:async request=>{assert.equal(request.purpose,'browser_read_decide','no keyword planner without positive HARD');const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);const ref=body.observation.targets.find((t:{label:string})=>t.label==='Fixture District')?.ref;assert.ok(ref,'only region selection is scripted');return {invocationId:'region',provider:'FIXTURE',model:'script',outputText:JSON.stringify({action:'OPEN_LINK',targetRef:ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Observed region'}),finishReason:'TOOL_CALLS',latencyMs:0};}};
  const intent:import('../../domains/restaurant/contracts.js').RestaurantSearchIntent={timezone:'Asia/Tokyo',area:{query:'Fixture District'},target:{goal:mode==='recommendation'?'RECOMMENDATION':'AVAILABILITY',query:'dinner'},date:'2026-10-27',partySize:2,timeWindow:{earliest:'19:00',latest:mode==='wide'?'21:00':'19:00'},criteria:[]};
  // Recommendation can still use this controlled Pack; production ordering
  // excludes reservation-only sources before any browser work.
  const effectivePack=mode==='recommendation'?{...pack,meta:{...pack.meta,reservationOnly:false}}:pack;
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxAutomaticBrowserMs:30000,packs:[effectivePack]},{model,browser:runtime,google:new GooglePlacesClient({apiKey:'fixture',fetchImplementation:async()=>{throw Error('No external API');}}),clock:{now:()=>new Date('2026-10-19T00:00:00Z')}});
  try{
   if(mode==='missing')delete intent.partySize;
   const before=structuredClone(intent);
   const read=await assembly.search.search({intent,readRunId:'search-hints',continuation:{intentFingerprint:restaurantSearchIntentFingerprint(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:{latitude:35,longitude:139,radiusMeters:1000,label:'Fixture District',areaMatchBasis:'NAMED_PLACE_RADIUS'}}},AbortSignal.timeout(30000));
   assert.equal(navigations.includes(filtered.toString()),isDirectory&&!['recommendation','wide','missing'].includes(mode),JSON.stringify({mode,pack:pack.meta.id,navigations,metadata:read.metadata}));
   const selectedIds=read.candidates.map(c=>c.restaurant.sourceIds[isDirectory?'tabelog':'tablecheck']);
   assert.equal(read.metadata.nativeDiscoveryFunnel?.searchAvailabilityHint?.status,!isDirectory?'SKIPPED':applied?'APPLIED':['mismatch','empty'].includes(mode)?'FALLBACK':'SKIPPED');
   if(!isDirectory)assert.equal(read.metadata.nativeDiscoveryFunnel?.searchAvailabilityHint?.reason,mode==='recommendation'?'NOT_AVAILABILITY':'FILTER_TRANSPORT_NOT_REVIEWED');
   assert.ok((read.metadata.nativeDiscoveryFunnel?.pagesRead??0)<=(isDirectory?7:3));
   assert.equal(selectedIds.length,5);assert.deepEqual(selectedIds,Array.from({length:5},(_,i)=>isDirectory?'tokyo/A1000/A100001/'+(12345600+(applied?6:1)+i):'fixture-venue-'+((applied?6:1)+i)));
   if(applied)assert.ok(!navigations.includes(outlet(1)),'unfiltered cards are not mixed into a verified filtered batch');
   if(isDirectory&&(mode==='empty'||mode==='mismatch'))assert.ok(navigations.lastIndexOf(base)>navigations.indexOf(filtered.toString()),'one unfiltered fallback follows rejected hint');
   assert.ok(!navigations.some(value=>/\/reserve|\/booking|\/confirm|\/payment/.test(value)));assert.deepEqual(intent,before);
   assert.ok(!read.evidence.some(e=>e.kind==='AVAILABILITY'),'card times never create availability evidence');
   const recording=new BrowserReadRecording({directory,runId:'hint-recorder',reviewedReads:pack.reviewedReads});
   for(const snapshot of snapshots)recording.recordSnapshot(snapshot);
   const manifest=await recording.finish();
   if(isDirectory&&!['recommendation','wide','missing'].includes(mode))assert.ok((await readFile(join(manifest.path,'recording.json'),'utf8')).includes(isDirectory?'vac_net=1':'availability_mode=same_meal_time'),'recorder retains reviewed filter parameters');
  }finally{await rm(directory,{recursive:true,force:true});}
 }
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

test('P21c recorded regional links reach six controlled development results through the production assembly',async()=>{
 const {gunzipSync}=await import('node:zlib');
 const {createLiveReadAssembly}=await import('../../integrations/restaurant-search/live-read-assembly.js');
 const {LIVE_READ_DEBUG_INVESTIGATION_BUDGET}=await import('../../application/live-read-investigation-budget.js');
 const {GooglePlacesClient}=await import('../../integrations/google/google-places-client.js');
 const {tabelogDiscoveryPack,googlePlacesDiscoveryPack}=await import('../../integrations/restaurant-search/source-packs.js');
 const records=JSON.parse(gunzipSync(await readFile(new URL('../../../.eval-artifacts/p2-1c-region-20261020/recordings.json.gz',import.meta.url))).toString());
 const gold=JSON.parse(await readFile(new URL('../../../.eval-artifacts/p2-1c-region-20261020/inputs.json',import.meta.url),'utf8')).expectedTopRegionByCase;
 const results=[];
 for(const caseId of Object.keys(gold)){
  const record=records.find((r:any)=>r.group==='checkpoint-b-corrected-20261019'&&r.caseId===caseId);
  const referenceCase=/kagurazaka|nakameguro/.test(caseId);
  const sourceRoot='https://tabelog.com/en/tokyo/rstLst/';
  const rootInput=record.regionDecisions[0].input;
  const projectedLinks=(input:any)=>input.observation.targets.filter((t:any)=>t.kind==='LINK'&&t.href&&t.availableActions.includes('OPEN_LINK')).map((t:any)=>`<a href="${t.href.replaceAll('&','&amp;')}">${t.label.replaceAll('&','&amp;').replaceAll('<','&lt;')}</a>`).join('');
  const route=referenceCase?[`https://tabelog.com/en/tokyo/${gold[caseId]}/`]:record.regionDecisions.flatMap((d:any)=>{
   const a=JSON.parse(d.outputText),t=d.input.observation.targets.find((t:any)=>t.ref===a.targetRef);
   return a.action==='OPEN_LINK'&&t?.href&&tabelogDiscoveryPack.browser!.directory!.isRegionEntrance(t.href)?[t.href]:[];
  });
  const end=route.at(-1)!;assert.ok(end);
  const detail=`https://tabelog.com/tokyo/${gold[caseId]}/${gold[caseId]}01/13999999/`;
  const pages:Record<string,string>={[sourceRoot]:'<title>Projected observed region links</title>'+projectedLinks(rootInput)};
  for(const decision of record.regionDecisions.slice(1))pages[decision.input.observation.url]='<title>Projected observed region links</title>'+projectedLinks(decision.input);
  pages[end]=`<title>Controlled known-feasible result</title><a class="list-rst__rst-name-target" href="${detail}">Controlled venue</a>`;
  pages[detail]=`<title>Controlled venue</title><script type="application/ld+json">${JSON.stringify({'@type':'Restaurant',name:'Controlled venue',address:'Tokyo',geo:{latitude:record.location.latitude,longitude:record.location.longitude}})}</script>`;
  const folder=await mkdtemp(join(tmpdir(),'p21c-offline-')),harPath=join(folder,'region.har');
  await writeFile(harPath,replayHarPages(pages));
  const raw=new LocalPlaywrightChromium();let googleCalls=0,modelCalls=0;const modelInputs:any[]=[];const pagesObserved:string[]=[];const navigations:string[]=[];
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:async input=>{
   const session=await raw.openSession({...input,replayHarPath:harPath});
   return new Proxy(session,{get(target,key){if(key==='snapshot')return async()=>{const page=await target.snapshot();pagesObserved.push(page.url);return page;};if(key==='navigate')return async(...args:Parameters<typeof session.navigate>)=>{navigations.push(args[0]);return target.navigate(...args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
  }};
  const model:import('../../core/model/contracts.js').ModelGateway={complete:async request=>{
   modelCalls++;assert.equal(request.purpose,'browser_read_decide','region-only controlled variant has no positive HARD keyword');
   const body=JSON.parse(request.messages.find(m=>m.role==='user')!.content);
   modelInputs.push({purpose:request.purpose,observation:body.observation});
   const href=route.find((url:string)=>body.observation.targets.some((t:any)=>t.href===url&&t.availableActions.includes('OPEN_LINK')));
   const target=body.observation.targets.find((t:any)=>t.href===href);assert.ok(target,'the recorded/independently expected next entrance is executable');
   if(referenceCase)assert.ok(body.observation.targets.filter((t:any)=>t.availableActions.includes('OPEN_LINK')).every((t:any)=>t.href===href||t.href===body.observation.url),'unsupported first-region guesses are removed');
   route.splice(route.indexOf(href),1);
   return {invocationId:'offline-region',provider:'FIXTURE',model:'scripted',finishReason:'TOOL_CALLS',latencyMs:0,outputText:JSON.stringify({action:'OPEN_LINK',targetRef:target.ref,authoritativeField:'NONE',requestedState:'NONE',reason:'Use the current observed supported region'})};
  }};
  const google=new GooglePlacesClient({apiKey:'fixture-only',fetchImplementation:async()=>{
   googleCalls++;
   const candidates=record.googleBatch.detail.read.candidates;
   const projected=referenceCase?candidates.filter((c:any)=>c.restaurant.sourceIds.googleWebsiteUri?.includes('tabelog.com/')):candidates.slice(0,20);
   return new Response(JSON.stringify({places:projected.map((c:any)=>({id:c.restaurant.sourceIds.googlePlaces,displayName:{text:c.restaurant.outletName},formattedAddress:c.restaurant.address,location:{latitude:c.restaurant.coordinates.lat,longitude:c.restaurant.coordinates.lng},websiteUri:c.restaurant.sourceIds.googleWebsiteUri,types:['restaurant'],businessStatus:'OPERATIONAL'}))}),{status:200});
  }});
  const intent:import('../../domains/restaurant/contracts.js').RestaurantSearchIntent={timezone:'Asia/Tokyo',target:{goal:'RECOMMENDATION',query:'restaurants'},area:{query:rootInput.goal.outlet.address},criteria:[]};
  const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxGoogleRequests:40,maxBrowserModelCallsPerCandidate:6,maxBrowserOperationsPerCandidate:24,packs:[tabelogDiscoveryPack,googlePlacesDiscoveryPack]}, {model,browser:runtime,google,clock:{now:()=>new Date('2026-10-20T00:00:00Z')}});
  try{
   const read=await assembly.search.search({readRunId:`p21c-${caseId}`,intent,continuation:{intentFingerprint:JSON.stringify(intent),usedPageTokens:[],pagesRead:0,exhausted:false,locationContext:record.location}},AbortSignal.timeout(90000));
   results.push({caseId,variant:'Recorded region inputs, no criteria/date/party; projected links + recorded Google pointers + synthetic detail',navigations,pagesObserved,modelInputs,modelCalls,googleCalls,read});
   assert.equal(read.candidates.length,1,JSON.stringify({caseId,metadata:read.metadata,navigations,modelInputs}));
   assert.ok(read.metadata.nativeDiscoveryFunnel!.directoryRegion!.first.url.includes(`/${gold[caseId]}/`));
   assert.ok(read.metadata.nativeDiscoveryFunnel!.sourceElapsedMs!<90000);assert.ok(read.metadata.nativeDiscoveryFunnel!.retrieval!.regionPages<=4);assert.ok(modelCalls<=6);
   if(referenceCase)assert.equal(googleCalls,1);
   if(caseId.includes('h001')||caseId.includes('h005')||caseId.includes('kichijoji'))assert.equal(googleCalls,0,'a named or unnamed-coordinate route needs no new Google wait');
  }finally{await rm(folder,{recursive:true,force:true});}
 }
 const outputDirectory=await mkdtemp(join(tmpdir(),'p21c-results-'));
 try { await writeFile(join(outputDirectory,'region-composition-results.json'),JSON.stringify({mode:'LOCAL_CHROMIUM_HAR_FIXTURE_WITH_SCRIPTED_MODEL',realModelCalls:0,externalNetworkCalls:0,results},null,2)+'\n'); }
 finally { await rm(outputDirectory,{recursive:true,force:true}); }
});

// Local-constructed G3 pages: observed D1 hrefs, synthetic lists/JSON-LD.
// Real Chromium + production assembly/wire/Executor; no current website Replay.
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
