import assert from "node:assert/strict";
import { mkdtemp,rm,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {createServer} from "node:http";
import type {BrowserSession} from "../../infrastructure/browser/browser-runtime.js";
import {loadReplayRecording,createRecordedBrowser} from "../../eval/restaurant/agent-loop/runners/replay-read-recording.js";
import { createReplayFixture,executeReplayFixture,replayDelivery } from "./fixtures/replay-scenario.js";

test("recorded decisions reproduce nonempty candidates and delivery under OS-denied network",{timeout:45_000},async t=>{
 const root=await mkdtemp(join(tmpdir(),"praxis-replay-complete-"));
 try{
  const {bundle,original}=await createReplayFixture(root),result=await executeReplayFixture(bundle,"complete");
  assert.equal(result.summary.status,"COMPLETED",JSON.stringify(result.summary));assert.ok(replayDelivery(original.artifact).shown.length>0);
  assert.deepEqual(replayDelivery(result.artifact),replayDelivery(original.artifact));assert.equal(result.fixtureModelCalls,0);
  assert.equal(result.artifact.mode,"REPLAY");assert.equal(result.evaluation.executionSource,"REPLAY");assert.equal(result.evaluation.outcome.capabilityDenominator,"EXCLUDED");
  assert.equal(result.evaluation.severity.S0_DECLARATION.status,"ABSENT");assert.equal(result.evaluation.severity.S0_BOUNDARY.status,"ABSENT");
  t.diagnostic(JSON.stringify({summary:result.summary,delivery:replayDelivery(result.artifact),networkPolicy:result.networkPolicy}));
 }finally{await rm(root,{recursive:true,force:true});}
});
for(const mode of ["missing","partial","model-wiring"] as const)test(`replay ${mode} preserves source/progress and model boundaries`,{timeout:45_000},async t=>{
 const root=await mkdtemp(join(tmpdir(),"praxis-replay-control-"));
 try{
  const {bundle,original}=await createReplayFixture(root),result=await executeReplayFixture(bundle,mode);
  assert.equal(result.evaluation.outcome.capabilityDenominator,"EXCLUDED");
  if(mode==="model-wiring"){
   assert.equal(result.summary.status,"COMPLETED");assert.ok(result.fixtureModelCalls>0);assert.equal(result.fixtureModelCalls,result.summary.modelTransportCalls);assert.deepEqual(replayDelivery(result.artifact),replayDelivery(original.artifact));
  }else{
   assert.equal(result.summary.status,"REPLAY_INCOMPLETE");assert.equal(result.evaluation.replayStatus,"REPLAY_INCOMPLETE");assert.ok(result.evaluation.findings.every((row:any)=>row.status==="NOT_EVALUATED"));
   assert.equal(result.summary.stop.reason,mode==="missing"?"MISSING_STRUCTURED_RESPONSE":"UNCAPTURED_STATIC_DEPENDENCY");
   if(mode==="partial"){assert.equal(result.summary.stop.snapshot,3);assert.equal(result.summary.consumedPages,2);}
  }
  t.diagnostic(JSON.stringify({mode,summary:result.summary,networkPolicy:result.networkPolicy,realModelCalls:result.realModelCalls}));
 }finally{await rm(root,{recursive:true,force:true});}
});

async function redirectedReplayInput(root: string, origin: string, kind: 'qualified' | 'unqualified' | 'missing-hop' | 'cycle', unrecorded?: 'blocked' | 'admitted') {
 const final=origin+'/final',first=origin+'/first',middle=origin+'/middle';
 const html='<html><head><title>Recorded final</title></head><body><h1>Qualified recorded final</h1>'+(unrecorded?`<script>fetch('/not-recorded',{method:'${unrecorded==='blocked'?'POST':'GET'}'}).catch(()=>{});</script>`:'')+'</body></html>';
 const entry=(url:string,status:number,location?:string)=>({startedDateTime:'1970-01-01T00:00:00.000Z',time:0,request:{method:'GET',url,httpVersion:'HTTP/1.1',headers:[],queryString:[],cookies:[],headersSize:-1,bodySize:-1},response:{status,statusText:status===200?'OK':'RECORDED',httpVersion:'HTTP/1.1',headers:[{name:'content-type',value:'text/html'},...(location?[{name:'location',value:location}]:[])],cookies:[],content:{mimeType:'text/html',text:status===200?html:'',size:status===200?Buffer.byteLength(html):0},redirectURL:location??'',headersSize:-1,bodySize:-1},cache:{},timings:{send:0,wait:0,receive:0}});
 const entries=[entry(first,301,kind==='qualified'||kind==='unqualified'?final:middle),...(kind==='cycle'?[entry(middle,302,first)]:[]),entry(final,200)];
 await writeFile(join(root,'snapshot-0001.html'),html);
 await writeFile(join(root,'recording.json'),JSON.stringify({pages:[{snapshot:1,url:final,status:kind==='unqualified'?'NOT_REPLAYABLE':'REPLAYABLE',reason:kind==='unqualified'?'UNCAPTURED_STATIC_DEPENDENCY':'SANITIZED_NETWORK_AND_DOM_CAPTURE'}],documents:[{snapshot:1,url:final,file:'snapshot-0001.html'}],replay:{harPath:'replay.har'}}));
 await writeFile(join(root,'replay.har'),JSON.stringify({log:{version:'1.2',creator:{name:'minimal synthetic redirect fixture',version:'1'},entries}}));
 return {first,final,recording:await loadReplayRecording(root,join(root,'filtered.har'))};
}

test('recorded document redirects reach the qualified final snapshot through real Chromium and Guard',async()=>{
 const root=await mkdtemp(join(tmpdir(),'replay-redirect-'));let arrivals=0;
 const server=createServer((_request,response)=>{arrivals++;response.end('NETWORK_MUST_NOT_BE_USED');});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address!=='string');
 let session:BrowserSession|undefined;
 try{
  const origin=`http://127.0.0.1:${address.port}`,{first,final,recording}=await redirectedReplayInput(root,origin,'qualified');
  const stops:unknown[]=[],replay=createRecordedBrowser(recording,reason=>stops.push(reason));
  session=await replay.browser.openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]}});
  assert.equal(session.metadata.readNetworkBoundary,'INSTALLED');
  await session.prepareNavigation!(first);
  let navigationError:unknown;try{await session.navigate(first);}catch(error){navigationError=error;}
  assert.deepEqual(stops,[],'a recorded301 to a qualified final document must not be rejected before snapshot1');
  assert.equal(navigationError,undefined,'the actual HAR redirect must finish through the unchanged Guard');
  const snapshot=await session.snapshot();assert.equal(snapshot.url,final);assert.match(snapshot.text,/Qualified recorded final/);
  assert.equal(replay.consumedPages(),1);assert.equal(arrivals,0,'original receiver must remain untouched');
  assert.ok(recording.entries.some(entry=>entry.request.url===first&&entry.response.status===301),'retain the original recorded redirect, never synthesize a200');
 }finally{await session?.close();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(root,{recursive:true,force:true});}
});

test('redirect qualification cannot promote an unqualified final page, missing hop or cycle',async()=>{
 for(const kind of ['unqualified','missing-hop','cycle'] as const){
  const root=await mkdtemp(join(tmpdir(),'replay-redirect-bound-'));
  try{const {first,recording}=await redirectedReplayInput(root,'https://replay.example',kind);assert.equal(recording.allowed.has(first),false,kind);}
  finally{await rm(root,{recursive:true,force:true});}
 }
});

test('replay checks missing responses after Guard admission, retaining denial and missing-entry boundaries',async()=>{
 for(const mode of ['blocked','admitted'] as const){
  const root=await mkdtemp(join(tmpdir(),'replay-admission-'));let session:BrowserSession|undefined;
  try{
   const origin='https://replay.example',{first,recording}=await redirectedReplayInput(root,origin,'qualified',mode);
   const stops:Array<{reason:string}>=[],replay=createRecordedBrowser(recording,reason=>stops.push(reason));
   session=await replay.browser.openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]}});
   await session.prepareNavigation!(first);
   await session.navigate(first).catch(()=>{});
   let snapshot:Awaited<ReturnType<BrowserSession['snapshot']>>|undefined,snapshotError:unknown;
   try{snapshot=await session.snapshot();}catch(error){snapshotError=error;}
   if(mode==='blocked'){
    assert.deepEqual(stops,[],'a Guard-denied telemetry request is not a missing admitted recording');
    assert.equal(snapshotError,undefined);assert.equal(replay.consumedPages(),1);
    assert.ok(snapshot?.networkRequests?.some(row=>row.method==='POST'&&row.pathname==='/not-recorded'&&row.outcome==='BLOCKED'),'the unchanged Guard must actually deny the POST');
   }else assert.deepEqual(stops.map(row=>row.reason),['MISSING_RESPONSE'],'an admitted missing GET must still fail closed');
  }finally{await session?.close();await rm(root,{recursive:true,force:true});}
 }
});
