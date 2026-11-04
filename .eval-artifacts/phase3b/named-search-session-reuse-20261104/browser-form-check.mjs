// Local receiver only. Production Chromium, Guard, control registry and Executor;
// constructed DOM, not current website availability or a Live request.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {writeFile} from 'node:fs/promises';
import {LocalPlaywrightChromium} from '../../../src/infrastructure/browser/local-playwright-chromium.ts';
import {BrowserTaskExecutor} from '../../../src/infrastructure/browser/browser-task-executor.ts';

const received=[],diagnostics=[];
const server=createServer((req,res)=>{
  received.push({method:req.method,url:req.url});
  const u=new URL(req.url,'http://local.invalid'),q=u.searchParams.get('q')??'';
  res.setHeader('content-type','text/html; charset=utf-8');
  res.end(`<title>Search</title><main><p>Current result: ${q}</p><form aria-label="Restaurant search" method="get" action="/search"><input aria-label="Restaurant search" type="search" name="q" value="${q}"><button type="submit" class="arbitrary-${received.length}" data-testid="changed-${received.length}">Search</button></form></main><script>document.querySelector('input').addEventListener('input',()=>{const b=document.querySelector('button');b.replaceWith(b.cloneNode(true));});</script>`);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const executor=new BrowserTaskExecutor(new LocalPlaywrightChromium(),{reuseSourceSessions:true,maxModelCallsPerCandidate:2,maxModelCallsTotal:2,maxOperationsPerCandidate:30,maxAutomaticElapsedMs:60_000,onDiagnostic:d=>diagnostics.push(d)});
const signal=new AbortController().signal;
try{
  for(const query of ['Alpha','Beta','Gamma']){
    executor.beginCandidate(query);executor.beginProvider(query,'FIXTURE');
    const session=await executor.acquire(signal,'FIXTURE','DISCOVERY',{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]});
    await executor.search({source:'FIXTURE',signal,allowedOrigins:[origin],session,url:origin+'/search?q='+query,query});
    const page=await executor.snapshot({source:'FIXTURE',stage:'DISCOVERY',signal,session});
    assert.equal(new URL(page.url).searchParams.get('q'),query);assert.match(page.text,new RegExp('Current result: '+query));
    executor.endReadScope();
  }
  assert.equal(diagnostics.filter(d=>d.event==='SESSION_OPENED').length,1);
  assert.equal(diagnostics.filter(d=>d.event==='OPERATION_STARTED'&&d.detail==='NAVIGATE').length,1);
  assert.equal(diagnostics.filter(d=>d.event==='OPERATION_STARTED'&&d.detail==='SUBMIT_PUBLIC_QUERY').length,2);
  assert.ok(received.every(r=>r.method==='GET'));
  assert.deepEqual(received.filter(r=>r.url.startsWith('/search?')).map(r=>new URL(r.url,origin).searchParams.get('q')),['Alpha','Beta','Gamma']);
  await writeFile(new URL('./browser-form-result.json',import.meta.url),JSON.stringify({mode:'LOCAL_CHROMIUM_CONSTRUCTED_FIXTURE',externalCalls:0,queries:['Alpha','Beta','Gamma'],sessionOpens:1,entranceNavigations:1,observedSubmissions:2,received,diagnostics},null,2)+'\n');
  console.log('PASS: one real guarded Chromium session, one entrance navigation, two observed submissions, replaced DOM refs, GET only');
}finally{await executor.closeAll();await new Promise(resolve=>server.close(resolve));}
