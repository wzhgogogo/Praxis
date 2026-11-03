import assert from 'node:assert/strict';
import test from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {BrowserReadRecording} from '../../eval/restaurant/agent-loop/runners/browser-read-recording.js';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {traceBrowserRuntime} from '../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';

test('Live trace records real request chronology, navigation budgets and query hashes without changing Guard', {timeout:30000},async t=>{
 let release!:()=>void;const held=new Promise<void>(r=>release=r);let scriptSeen!:()=>void;const scriptReady=new Promise<void>(r=>scriptSeen=r);let posts=0;let blockedSeen!:()=>void;const blockedReady=new Promise<void>(r=>blockedSeen=r);let cancelSeen!:()=>void;const cancelReady=new Promise<void>(r=>cancelSeen=r);
 const server=createServer((req,res)=>{if(req.method==='POST')posts++;
  if(req.url?.startsWith('/slow.js')){scriptSeen();void held.then(()=>res.end('window.loaded=true'));return;}
  if(req.url?.startsWith('/hung'))return;
  if(req.url?.startsWith('/aborted-document')){cancelSeen();return;}
  if(req.url?.startsWith('/redirect')){res.writeHead(302,{location:'/page?q=two'});res.end();return;}
  if(req.url?.startsWith('/page')){res.setHeader('content-type','text/html');res.end('<script src="/slow.js"></script><body>public</body><script>fetch("/write",{method:"POST",body:"fixture-secret-body"}).catch(()=>{})</script>');return;}
  res.end('blocked');});
 t.after(async()=>{release();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));});
 server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');const origin=`http://127.0.0.1:${address.port}`;
 const directory=await mkdtemp(join(tmpdir(),'request-timeline-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const recorder=new BrowserReadRecording({directory,runId:'local-timeline'});
 const rows:Array<{kind:string;detail:any}>=[];const abort=new AbortController();
 const runtime=traceBrowserRuntime(new LocalPlaywrightChromium(), 'TABELOG',(kind,detail)=>{rows.push({kind,detail});const d=detail as any;if(kind==='NETWORK_REQUEST_END'&&d.url?.endsWith('/write')&&d.blocked)blockedSeen();return rows.length;},recorder.traceSink(),{remainingBudgetMs:()=>4242});
 const session=await runtime.openSession({signal:abort.signal,networkPolicy:{documentOrigins:[origin],staticResources:[{origin,pathname:'/slow.js',resourceTypes:['script']}],dynamicReads:[]}});
 t.after(async()=>{abort.abort();await session.close();});
 try{
  await session.prepareNavigation?.(origin+'/page?q=private-one',{timeoutMs:5000});
  const navigation=session.navigate(origin+'/page?q=private-one',{waitUntil:'load',timeoutMs:5000});await Promise.race([scriptReady,navigation]);release();await navigation;
  await session.prepareNavigation?.(origin+'/redirect?q=private-two',{timeoutMs:5000});
  await session.navigate(origin+'/redirect?q=private-two',{waitUntil:'domcontentloaded',timeoutMs:5000});
  await session.prepareNavigation?.(origin+'/page?q=private-one',{timeoutMs:5000});
  await session.navigate(origin+'/page?q=private-one',{waitUntil:'domcontentloaded',timeoutMs:5000});
  await session.prepareNavigation?.(origin+'/hung?q=private-three',{timeoutMs:1000});
  await assert.rejects(session.navigate(origin+'/hung?q=private-three',{waitUntil:'load',timeoutMs:1000}));
  const starts=rows.filter(r=>r.kind==='NETWORK_REQUEST_START');assert.ok(starts.length>=4,'existing trace lacks per-request chronology');
  await blockedReady;
  const navs=rows.filter(r=>r.kind==='NAVIGATION_START'&&r.detail.method==='GOTO').map(r=>r.detail);
  assert.ok(navs.every(n=>n.remainingReadBudgetMs===4242&&n.configuredTimeoutMs>0));
  assert.equal(navs[0].waitUntil,'load');assert.equal(navs[1].waitUntil,'domcontentloaded');
  assert.equal(navs[0].urlSha256,navs[2].urlSha256,'same complete URL compares equal');
  const pages=starts.map(r=>r.detail).filter(r=>r.url===origin+'/page');
  assert.ok(new Set(pages.map(r=>r.urlSha256)).size>=2,'same path with changed query stays distinguishable');
  assert.equal(navs[0].urlSha256,createHash('sha256').update(origin+'/page?q=private-one').digest('hex'));
  const ends=rows.filter(r=>r.kind==='NAVIGATION_END').map(r=>r.detail);assert.ok(ends.some(n=>n.endReason==='TIMEOUT'));
  assert.ok(rows.some(r=>r.kind==='NETWORK_REQUEST_END'&&r.detail.outcome==='REDIRECT'&&r.detail.status===302));
  const script=rows.find(r=>r.kind==='NETWORK_REQUEST_END'&&r.detail.url.endsWith('/slow.js'))!.detail;
  assert.equal(script.status,200);assert.equal(script.navigationId,navs[0].navigationId);
  assert.ok(script.elapsedMs>0&&script.endedMonotonicMs>=script.startedMonotonicMs);assert.ok(script.browserElapsedMs>0&&Date.parse(script.browserEndedAt)>=Date.parse(script.browserStartedAt));
  assert.ok(rows.some(r=>r.kind==='NETWORK_RESPONSE_HEADERS'&&r.detail.requestId===script.requestId));
  await session.prepareNavigation?.(origin+'/aborted-document?q=private-four',{timeoutMs:30000});
  const pending=session.navigate(origin+'/aborted-document?q=private-four',{timeoutMs:30000});
  const rejected=assert.rejects(pending);await cancelReady;abort.abort();await rejected;
  assert.ok(rows.some(r=>r.kind==='NAVIGATION_END'&&r.detail.endReason==='CANCELLED'));
  assert.ok(!JSON.stringify(rows).match(/private-one|private-two|private-three|private-four|fixture-secret-body/));
 }finally{release();await session.close();}
 // Concurrent opens must not write another run's requests into this recorder.
 const parallel=await Promise.all([1,2].map(async index=>{
  const own:Array<{kind:string;detail:any}>=[],controller=new AbortController();
  const traced=traceBrowserRuntime(new LocalPlaywrightChromium(),'TABELOG',(kind,detail)=>{own.push({kind,detail});return own.length;},undefined,{remainingBudgetMs:()=>index*1000});
  const opened=await traced.openSession({signal:controller.signal,networkPolicy:{documentOrigins:[origin],staticResources:[{origin,pathname:'/slow.js',resourceTypes:['script']}],dynamicReads:[]}});
  t.after(async()=>{controller.abort();await opened.close();});
  const url=origin+'/page?q=parallel-'+index;
  try{await opened.prepareNavigation?.(url,{timeoutMs:5000});await opened.navigate(url,{timeoutMs:5000,waitUntil:'load'});}
  finally{await opened.close();}
  const nav=own.find(r=>r.kind==='NAVIGATION_START'&&r.detail.method==='GOTO')!.detail;
  assert.equal(nav.remainingReadBudgetMs,index*1000);assert.equal(nav.urlSha256,createHash('sha256').update(url).digest('hex'));
  assert.ok(own.filter(r=>r.kind==='NETWORK_REQUEST_START').every(r=>r.detail.navigationId===nav.navigationId));
  return nav.navigationId;
 }));
 assert.notEqual(parallel[0],parallel[1]);
 const result=await recorder.finish();const stored=await readFile(join(result.path,'recording.json'),'utf8');
 assert.ok(stored.includes('NETWORK_REQUEST_START')&&stored.includes('NAVIGATION_END'));assert.ok(!stored.match(/private-one|private-two|private-three|private-four|fixture-secret-body/));
 const baseline=new BrowserReadRecording({directory,runId:'baseline'});assert.deepEqual(result.replay,(await baseline.finish()).replay,'metadata does not change replay admission');
 assert.equal(posts,0);
 const starts=rows.filter(r=>r.kind==='NETWORK_REQUEST_START');const ends=rows.filter(r=>r.kind==='NETWORK_REQUEST_END');assert.equal(new Set(starts.map(r=>r.detail.requestId)).size,starts.length);assert.ok(starts.every(s=>ends.some(e=>e.detail.requestId===s.detail.requestId)));
 for(const e of ends){assert.ok(e.detail.endedMonotonicMs>=e.detail.startedMonotonicMs);assert.ok(['boolean'].includes(typeof e.detail.blocked));}
 t.diagnostic(JSON.stringify({requests:starts.length,navigations:rows.filter(r=>r.kind==='NAVIGATION_START').length,blocked:ends.filter(e=>e.detail.blocked).length}));
});
