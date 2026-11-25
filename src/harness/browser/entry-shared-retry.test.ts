import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';

// LOCAL_CONSTRUCTION: both permitted failure mechanisms compete for one slot.
for(const mode of ['IDLE_THEN_NO_HEADERS','NO_HEADERS_THEN_IDLE','IDLE_RECOVERS'] as const)test(`shared entry retry slot: ${mode}`,{timeout:26000},async()=>{
 let documents=0,scripts=0;const server=createServer((q,s)=>{
  if(q.url==='/ready.js'){s.setHeader('Content-Type','text/javascript');s.end('window.ready=true');return;}
  if(q.url==='/stall.css'){scripts++;s.writeHead(200,{'Content-Type':'text/css'});s.flushHeaders();s.write('/* partial */');return;}
  documents++;
  if(mode==='NO_HEADERS_THEN_IDLE'&&documents===1||mode==='IDLE_THEN_NO_HEADERS'&&documents===2)return;
  s.writeHead(200,{'Content-Type':'text/html'});
  s.end(mode==='IDLE_RECOVERS'&&documents===2?'<body>Recovered</body>':'<head><link rel="stylesheet" href="/stall.css"><script defer src="/ready.js"></script></head><body>Ready</body>');
 });server.listen(0,'127.0.0.1');await once(server,'listening');
 const origin='http://127.0.0.1:'+(server.address() as import('node:net').AddressInfo).port;
 const session=await new LocalPlaywrightChromium({admittedGetTransport:'REVIEWED_STATIC_BROWSER'}).openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],staticResources:[{origin,pathname:'/stall.css',methods:['GET'],resourceTypes:['stylesheet'],queryKeys:[]},{origin,pathname:'/ready.js',methods:['GET'],resourceTypes:['script'],queryKeys:[]}],dynamicReads:[]}});
 try{
  await session.prepareNavigation!(origin+'/',{timeoutMs:20000});const started=performance.now();
  const ok=await session.navigate(origin+'/',{timeoutMs:20000}).then(()=>true,()=>false);
  const events=session.entryNavigationEvents!();console.log(JSON.stringify({mode,documents,scripts,events}));
  assert.equal(ok,mode==='IDLE_RECOVERS');assert.equal(documents,2);assert.equal(scripts,1);
  assert.equal(events.filter(e=>e.event==='STARTED').length,2);
  assert.equal(events.filter(e=>e.event==='IDLE_ABORT'||e.event==='ZERO_BYTE_TIMEOUT').length,1);
  assert.equal(events.find(e=>e.event==='IDLE_ABORT'||e.event==='ZERO_BYTE_TIMEOUT')!.event,mode==='NO_HEADERS_THEN_IDLE'?'ZERO_BYTE_TIMEOUT':'IDLE_ABORT');
  assert.ok(performance.now()-started<20750,'abort and second load share20s');
 }finally{await session.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
