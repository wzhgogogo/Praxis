import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';

for(const mode of ['NO_HEADERS','IDLE_ABORT'] as const)test(`blocked POST suppresses entry recovery: ${mode}`,{timeout:26000},async()=>{
 let documents=0,posts=0,started!:()=>void;const requested=new Promise<void>(r=>{started=r;});
 const server=createServer((q,s)=>{
  if(q.method==='POST'){posts++;s.end('UNEXPECTED');return;}
  s.setHeader('Content-Type',q.url==='/stall.css'?'text/css':'text/html');
  if(q.url==='/start'){s.end('<script>addEventListener("beforeunload",()=>fetch("/write",{method:"POST",keepalive:true}).catch(()=>{}))</script><body>Ready</body>');return;}
  if(q.url==='/ready.js'){s.setHeader('Content-Type','text/javascript');s.end('window.ready=true');return;}
  if(q.url==='/stall.css'){s.writeHead(200);s.flushHeaders();s.write('/* partial */');return;}
  documents++;started();if(mode==='NO_HEADERS')return;
  s.end('<script>fetch("/write",{method:"POST"}).catch(()=>{})</script><link rel="stylesheet" href="/stall.css"><script defer src="/ready.js"></script>');
 });server.listen(0,'127.0.0.1');await once(server,'listening');
 const origin='http://127.0.0.1:'+(server.address() as import('node:net').AddressInfo).port;
 const session=await new LocalPlaywrightChromium().openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],staticResources:[{origin,pathname:'/stall.css',methods:['GET'],resourceTypes:['stylesheet'],queryKeys:[]},{origin,pathname:'/ready.js',methods:['GET'],resourceTypes:['script'],queryKeys:[]}],dynamicReads:[]}});
 try{
  
  if(mode==='NO_HEADERS'){await session.prepareNavigation!(origin+'/start',{timeoutMs:20000});await session.navigate(origin+'/start',{timeoutMs:20000});}
  const before=session.entryNavigationEvents!().length;
  await session.prepareNavigation!(origin+'/pending',{timeoutMs:20000});const nav=session.navigate(origin+'/pending',{timeoutMs:20000}).then(()=>true,()=>false);
  await requested;
  await new Promise(r=>setTimeout(r,200));const page=await session.snapshot();console.log(JSON.stringify({mode,requests:page.networkRequests}));
  assert.equal(await nav,false);const events=session.entryNavigationEvents!().slice(before);
  assert.equal(documents,1);assert.equal(posts,0);assert.equal(events.filter(e=>e.event==='STARTED').length,1);
  assert.ok(!events.some(e=>e.event==='ZERO_BYTE_TIMEOUT'||e.event==='IDLE_ABORT'));
  assert.ok(page.networkRequests?.some(r=>r.outcome==='BLOCKED'&&r.method==='POST'&&r.pathname==='/write'));
 }finally{await session.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
