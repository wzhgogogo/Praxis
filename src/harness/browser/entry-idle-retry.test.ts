import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {traceBrowserRuntime} from '../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
import {BrowserReadRecording} from '../../eval/restaurant/agent-loop/runners/browser-read-recording.js';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';

test('entry aborts a successful stalled native response before its one reload, preserving both attempts in recording', {timeout:18000}, async()=>{
 const root=await mkdtemp(join(tmpdir(),'entry-retry-'));let requests=0,closedAt=0,secondAt=0,documents=0;
 const server=createServer((q,s)=>{s.setHeader('Content-Type',q.url==='/stall.css'?'text/css':'text/html');
  if(q.url==='/'){documents++;s.end('<!doctype html><head><link rel="stylesheet" href="/stall.css"><script defer src="/ready.js"></script></head><body>Recovered</body>');return;}
  if(q.url==='/ready.js'){s.setHeader('Content-Type','text/javascript');s.end('window.ready=true');return;}
  if(q.url==='/stall.css'){requests++;if(requests===1){s.writeHead(200);s.flushHeaders();s.write('/* first response */');s.once('close',()=>{closedAt=performance.now();});}else{secondAt=performance.now();s.end('body{color:green}');}return;}
  s.writeHead(404);s.end();
 });server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
 const statics=[{origin,pathname:'/stall.css',methods:['GET'] as const,resourceTypes:['stylesheet'] as const,queryKeys:[]},{origin,pathname:'/ready.js',methods:['GET'] as const,resourceTypes:['script'] as const,queryKeys:[]}];
 const recording=new BrowserReadRecording({directory:root,runId:'recovered',reviewedStaticResources:statics});
 const runtime=traceBrowserRuntime(new LocalPlaywrightChromium(),'TABLECHECK',()=>0,recording.traceSink());
 const session=await runtime.openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],staticResources:statics,dynamicReads:[]}});
 try{await session.prepareNavigation?.(origin+'/',{timeoutMs:10000});const start=performance.now();await session.navigate(origin+'/',{timeoutMs:10000});
  assert.equal(requests,2);assert.equal(documents,2);assert.ok(closedAt>0&&closedAt<secondAt,'old native response must close before the second request');assert.ok(performance.now()-start<10000);
  assert.equal((await session.snapshot()).text,'Recovered');await session.flushRecordedResponses?.();await session.close();
  const result=await recording.finish();const recorded=JSON.parse(await readFile(join(result.path,'recording.json'),'utf8'));
  const events=recorded.entries.filter((r:{kind:string})=>r.kind==='ENTRY_NAVIGATION').map((r:{detail:any})=>r.detail);
  assert.deepEqual(events.map((e:any)=>[e.attempt,e.retryCount,e.event]),[[1,0,'STARTED'],[1,0,'IDLE_ABORT'],[1,0,'ABORTED'],[2,1,'STARTED'],[2,1,'SUCCEEDED']]);
  assert.ok(events[1].idleMs>=5000);console.log('ENTRY_RECOVERY '+JSON.stringify({requests,documents,closedBeforeSecond:closedAt<secondAt,events}));
 }finally{await session.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await rm(root,{recursive:true,force:true});}
});

for(const mode of ['HTTP403','HTTP500','NO_HEADERS','STEADY','POST','INTERACTION','SECOND_STALL','CANCEL','ENTRY_ONLY','NODE_ABORT'] as const){
 test(`entry retry boundary: ${mode}`,{timeout:18000},async()=>{
  let cssRequests=0,documents=0,posts=0,oldDataClosedAt=0,secondCssAt=0,resolveCss:()=>void=()=>{};
  const cssStarted=new Promise<void>(r=>{resolveCss=r;});const timers=new Set<ReturnType<typeof setInterval>>();
  const server=createServer((q,s)=>{
   if(q.method==='POST'){posts++;s.end();return;}
   if(q.url==='/'){documents++;s.setHeader('Content-Type','text/html');s.end(`<!doctype html><head>${mode==='HTTP403'||mode==='HTTP500'?'<script defer src="/status.js"></script>':''}${mode==='POST'?'<script>fetch("/write",{method:"POST"}).catch(()=>{})</script>':''}${mode==='NODE_ABORT'?'<script>fetch("/data").catch(()=>{})</script>':''}<link rel="stylesheet" href="/stall.css"><script defer src="/ready.js"></script></head><body>Ready</body>`);return;}
   if(q.url==='/ready.js'||q.url==='/status.js'){s.setHeader('Content-Type','text/javascript');s.writeHead(q.url==='/status.js'?(mode==='HTTP403'?403:500):200);s.end('window.ready=true');return;}
   if(q.url==='/data'){s.setHeader('Content-Type','application/json');if(documents===1){s.write('{"partial":');s.once('close',()=>{oldDataClosedAt=performance.now();});}else s.end('{}');return;}
   if(q.url==='/stall.css'){
    cssRequests++;if(cssRequests===2)secondCssAt=performance.now();resolveCss();s.setHeader('Content-Type','text/css');
    if(mode==='ENTRY_ONLY'&&cssRequests===1||mode==='NODE_ABORT'&&cssRequests===2){s.end('body{color:green}');return;}
    if(mode==='NO_HEADERS')return;
    s.writeHead(200);s.flushHeaders();s.write('/* initial response */');
    if(mode==='STEADY'){let ticks=0;const timer=setInterval(()=>{s.write('/*'+'a'.repeat(16384)+'*/');if(++ticks===13){clearInterval(timer);timers.delete(timer);s.end();}},500);timers.add(timer);s.once('close',()=>{clearInterval(timer);timers.delete(timer);});}return;
   }
   s.writeHead(404);s.end();
  });server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
  const events:Array<{kind:string;detail:any}>=[];
  const runtime=traceBrowserRuntime(new LocalPlaywrightChromium(),'TABELOG',(kind,detail)=>{events.push({kind,detail});return events.length;});
  const controller=new AbortController(),session=await runtime.openSession({signal:controller.signal,networkPolicy:{documentOrigins:[origin],staticResources:[{origin,pathname:'/stall.css',methods:['GET'],resourceTypes:['stylesheet'],queryKeys:[]},{origin,pathnamePrefix:'/',methods:['GET'],resourceTypes:['script'],queryKeys:[]}],dynamicReads:[{origin,pathname:'/data',resourceTypes:['fetch'],methods:['GET'],queryKeys:[]}]}});
  let completed=false,failure:unknown;
  try{
   const timeoutMs=mode==='CANCEL'?8000:mode==='NODE_ABORT'?10000:8000;
   await session.prepareNavigation?.(origin+'/',{timeoutMs});const start=performance.now();
   const navigation=session.navigate(origin+'/',{timeoutMs}).then(()=>{completed=true;},e=>{failure=e;});
   await Promise.race([cssStarted,new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('CSS request not observed')),2000))]);
   if(mode==='CANCEL')controller.abort();
   if(mode==='INTERACTION')await session.pressEscape?.();
   await navigation;
   if(mode==='ENTRY_ONLY'){
    assert.equal(completed,true);completed=false;
    await session.prepareNavigation?.(origin+'/',{timeoutMs:6000});await session.navigate(origin+'/',{timeoutMs:6000}).then(()=>{completed=true;},e=>{failure=e;});
   }
   const attempts=events.filter(e=>e.kind==='ENTRY_NAVIGATION').map(e=>e.detail);
   if(mode==='STEADY'){assert.equal(completed,true);assert.equal(cssRequests,1);assert.deepEqual(attempts.map(e=>e.event),['STARTED','SUCCEEDED']);}
   else if(mode==='NODE_ABORT'){assert.equal(completed,true);assert.equal(cssRequests,2);assert.ok(oldDataClosedAt>0&&oldDataClosedAt<secondCssAt,'Node transfer must also terminate before reloading');}
   else {assert.ok(failure,'must retain actual failure');assert.equal(completed,false);assert.equal(cssRequests,mode==='SECOND_STALL'||mode==='ENTRY_ONLY'?2:1);}
   assert.equal(posts,0,'Guard must still reject POST');
   if(mode==='POST'){const snapshot=await session.snapshot().catch(()=>undefined);assert.ok(snapshot?.networkRequests?.some(r=>r.method==='POST'&&r.outcome==='BLOCKED'),'the POST must actually be attempted and rejected');}
   assert.equal(documents,mode==='SECOND_STALL'||mode==='ENTRY_ONLY'||mode==='NODE_ABORT'?2:1);
   assert.equal(attempts.filter(e=>e.event==='IDLE_ABORT').length,mode==='SECOND_STALL'||mode==='NODE_ABORT'?1:0);
   assert.ok(performance.now()-start<(mode==='ENTRY_ONLY'?9000:timeoutMs+1500),'one shared navigation budget, not a fresh budget per attempt');
   console.log('ENTRY_BOUNDARY '+JSON.stringify({mode,cssRequests,documents,posts,completed,elapsedMs:Math.round(performance.now()-start),attempts}));
  }finally{for(const timer of timers)clearInterval(timer);await session.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
 });
}
