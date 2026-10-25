import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {BrowserReadRecording} from '../../../eval/restaurant/agent-loop/runners/browser-read-recording.js';
import {loadReplayRecording,createRecordedBrowser,type ReplayStop} from '../../../eval/restaurant/agent-loop/runners/replay-read-recording.js';
import {LocalPlaywrightChromium} from '../../../infrastructure/browser/local-playwright-chromium.js';

/** Saved slot1 element + synthetic key and second-page capture gap; not Live. */
export async function runRecordingKeyScenario(root:string){
 const publicKey='AI'+'za'+'P'.repeat(35),signature='synthetic-public-signature',own='synthetic-fixture-owned-key';
 const template=await readFile(new URL('../../../eval/restaurant/agent-loop/fixtures/slot1-public-map.html',import.meta.url),'utf8');
 const html=template.replaceAll('__PUBLIC_MAP_KEY__',publicKey).replaceAll('__PUBLIC_SIGNATURE__',signature);
 let sourceRequests=0;
 const server=createServer((request,response)=>{
  sourceRequests++;assert.equal(request.method,'GET');
  response.setHeader('content-type',request.url==='/uncaptured.js'?'application/javascript':'text/html');
  response.end(request.url==='/uncaptured.js'?'document.body.dataset.loaded="public";':request.url==='/next'?'<h1>Later page</h1><script src="/uncaptured.js"></script>':html);
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 const staticResources=[{origin,pathname:'/uncaptured.js',resourceTypes:['script' as const]}];
 const policy={documentOrigins:[origin],genericPublicRead:true,staticResources,dynamicReads:[]};
 const controller=new AbortController();let googleCalls=0;
 try{
  const recorder=new BrowserReadRecording({directory:root,runId:'recording',ownCredentials:[own],reviewedStaticResources:staticResources});
  await recorder.captureGoogleFetch(async()=>{googleCalls++;return new Response('{"places":[]}',{headers:{'content-type':'application/json'}});})(
   'https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'X-Goog-Api-Key':own},body:'{"textQuery":"fixture"}'});
  const original=await new LocalPlaywrightChromium().openSession({signal:controller.signal,networkPolicy:policy,
   // Model the original F5 missing capture using the real admitted request;
   // the second page retains its DOM but cannot become replayable.
   recordResponse:response=>response.url===origin+'/uncaptured.js'?undefined:recorder.recordResponse(response)});
  try{
   for(const path of ['/map','/next']){await original.prepareNavigation?.(origin+path);await original.navigate(origin+path);recorder.recordSnapshot(await original.snapshot());}
  }finally{await original.close();}
  const recorded=await recorder.finish();assert.equal(recorded.replay.status,'PARTIALLY_REPLAYABLE');
  assert.deepEqual(recorded.pages.map(page=>page.status),['REPLAYABLE','NOT_REPLAYABLE']);
  assert.equal(recorded.pages[1]!.reason,'UNCAPTURED_STATIC_DEPENDENCY');
  const files:Record<string,string>={};
  async function scan(directory:string,prefix=''){
   for(const entry of await readdir(directory,{withFileTypes:true})){
    const path=join(directory,entry.name),relative=prefix+entry.name;
    if(entry.isDirectory()){await scan(path,relative+'/');continue;}
    const text=await readFile(path,'utf8');files[relative]=text;
    for(const key of [publicKey,signature,own])assert.ok(!text.includes(key),'recorded '+relative+' contains no credential literal');
    assert.doesNotMatch(text,/\bAIza[0-9A-Za-z_-]{30,}/);
   }
  }
  await scan(recorded.path);
  assert.match(files['diagnostic/snapshot-0001.html']!,/key=REDACTED/);
  assert.match(files['diagnostic/snapshot-0001.html']!,/signature=REDACTED/);
  const har=JSON.parse(files['replay.har']!);
  assert.ok(har.log.entries.some((entry:any)=>entry.request.url.includes('places.googleapis.com')));
  assert.ok(!har.log.entries.some((entry:any)=>entry.request.url===origin+'/next'));
  const originalRequests=sourceRequests;sourceRequests=0;
  const loaded=await loadReplayRecording(recorded.path,join(root,'filtered.har'));let stopped:ReplayStop|undefined;
  const replay=createRecordedBrowser(loaded,stop=>{stopped=stop;});
  const session=await replay.browser.openSession({signal:controller.signal,networkPolicy:policy});
  try{
   await session.prepareNavigation?.(origin+'/map');await session.navigate(origin+'/map');
   const page=await session.snapshot();assert.match(page.html,/key=REDACTED/);
   await session.prepareNavigation?.(origin+'/next');await assert.rejects(session.navigate(origin+'/next'),/REPLAY_INCOMPLETE/);
  }finally{await session.close();}
  assert.equal(replay.consumedPages(),1);assert.equal(sourceRequests,0);
  assert.equal(stopped?.snapshot,2);assert.equal(stopped?.reason,'UNCAPTURED_STATIC_DEPENDENCY');
  const result={status:'REPLAY_INCOMPLETE',executionSource:'REPLAY',liveCapabilityDenominator:'EXCLUDED',pages:recorded.pages,consumedPages:replay.consumedPages(),stop:stopped,
   originalLocalRequests:originalRequests,replaySourceRequests:sourceRequests,fixtureGoogleTransports:googleCalls,
   realCalls:{model:0,google:0,website:0,live:0,environmentRerun:0},recordingFiles:Object.keys(files),unreplayedQuality:'NOT_EVALUATED'};
  await writeFile(join(root,'summary.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  return result;
 }finally{controller.abort();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
}
