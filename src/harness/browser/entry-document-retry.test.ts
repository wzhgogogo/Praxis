import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createG6LiveBrowser} from '../../eval/restaurant/agent-loop/g6/live-transports.js';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {traceBrowserRuntime} from '../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
import {BrowserReadRecording} from '../../eval/restaurant/agent-loop/runners/browser-read-recording.js';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

// Document NO_HEADERS and static IDLE_ABORT share the same single retry slot.
// Actual Chromium and local HTTP, no source network/model/credentials.
for(const mode of ['NO_HEADERS','ZERO_NODE_FETCH','HEADERS_ONLY','PARTIAL','HTTP403','HTTP500','GUARD_BLOCKED','NETWORK_ERROR','SECOND_TIMEOUT','CANCEL'] as const){
 test(`document zero-byte retry boundary: ${mode}`,{timeout:26_000},async()=>{
  let requests=0,firstClosedAt=0,secondStartedAt=0,resolveFirst=()=>{};
  const first=new Promise<void>(r=>{resolveFirst=r;});
  const server=createServer((q,s)=>{
   if(q.url!=='/detail?observed=one'){s.writeHead(404);s.end();return;}
   requests++;resolveFirst();
   if(requests===1){s.once('close',()=>{firstClosedAt=performance.now();});
    if(mode==='NETWORK_ERROR'){q.socket.destroy();return;}
    if(mode==='HTTP403'||mode==='HTTP500'){s.writeHead(mode==='HTTP403'?403:500,{'Content-Type':'text/html'});s.end('<body>Denied</body>');return;}
    if(mode==='PARTIAL'){s.writeHead(200,{'Content-Type':'text/html'});s.write('<html><body>partial');return;}
    if(mode==='HEADERS_ONLY'){s.writeHead(200,{'Content-Type':'text/html'});s.flushHeaders();}return;
   }
   secondStartedAt=performance.now();if(mode==='SECOND_TIMEOUT')return;
   s.writeHead(200,{'Content-Type':'text/html'});s.end('<html><body>Recovered same document</body></html>');
  });server.listen(0,'127.0.0.1');await once(server,'listening');
  const origin='http://127.0.0.1:'+(server.address() as import('node:net').AddressInfo).port,url=origin+'/detail?observed=one';
  const root=await mkdtemp(join(tmpdir(),'zero-document-'));const recording=new BrowserReadRecording({directory:root,runId:mode});
  const physicalCalls:unknown[]=[];const browser=mode==='NO_HEADERS'?createG6LiveBrowser({}, {googleFetch:transport=>transport,observeRequest:r=>{if(r.method==='GET'&&new URL(r.url).pathname==='/detail')physicalCalls.push(r);}}):new LocalPlaywrightChromium(mode==='ZERO_NODE_FETCH'?{admittedGetTransport:'NODE_FETCH'}:{});
  const runtime=traceBrowserRuntime(browser,'TABELOG',()=>0,recording.traceSink()),controller=new AbortController();
  const session=await runtime.openSession({signal:controller.signal,networkPolicy:{documentOrigins:[mode==='GUARD_BLOCKED'?origin+'/invalid':origin],genericPublicRead:true,staticResources:[],dynamicReads:[]}});
  try{
   if(mode!=='GUARD_BLOCKED')await session.prepareNavigation!(url,{timeoutMs:20_000});
   const started=performance.now();const navigation=session.navigate(url,{timeoutMs:20_000}).then(()=>true,()=>false);
   if(mode==='CANCEL'){await first;controller.abort();}
   const success=await navigation,events=session.entryNavigationEvents?.()??[];
   assert.equal(requests,['NO_HEADERS','ZERO_NODE_FETCH','SECOND_TIMEOUT'].includes(mode)?2:mode==='GUARD_BLOCKED'?0:1);
   if(mode==='NO_HEADERS')assert.equal(physicalCalls.length,2,'independent Live transport accounting retains each physical attempt');
   if(mode==='NO_HEADERS'||mode==='ZERO_NODE_FETCH'){
    assert.equal(success,true);assert.ok(firstClosedAt>0&&firstClosedAt<secondStartedAt,'original transport closed before second request');
    assert.match((await session.snapshot()).text,/Recovered same document/);
    assert.equal(events.filter(e=>e.event==='ZERO_BYTE_TIMEOUT').length,1);assert.equal(events.filter(e=>e.event==='STARTED').length,2);
    assert.ok(events.find(e=>e.event==='ZERO_BYTE_TIMEOUT')?.bytesObserved);assert.equal(events.find(e=>e.event==='ZERO_BYTE_TIMEOUT')?.receivedBodyBytes,0);
   }else if(mode==='HTTP403'||mode==='HTTP500'){assert.equal(success,true,'HTTP error remains its real response, never retried');assert.equal(events.filter(e=>e.retryCount===1).length,0);}
   else{assert.equal(success,false);assert.equal(events.filter(e=>e.event==='ZERO_BYTE_TIMEOUT').length,mode==='SECOND_TIMEOUT'?1:0);}
   assert.ok(performance.now()-started<20_750,'same20s total incl abort; never20+20');
   await session.close();const finished=await recording.finish();const saved=JSON.parse(await readFile(join(finished.path,'recording.json'),'utf8'));
   const recorded=saved.entries.filter((e:any)=>e.kind==='ENTRY_NAVIGATION').map((e:any)=>e.detail);
   assert.deepEqual(recorded,events,'both attempts preserved in recording');
   console.log('DOCUMENT_ATTEMPTS '+JSON.stringify({mode,requests,elapsedMs:performance.now()-started,events}));
  }finally{await session.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await rm(root,{recursive:true,force:true});}
 });
}
