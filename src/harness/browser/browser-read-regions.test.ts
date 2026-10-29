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