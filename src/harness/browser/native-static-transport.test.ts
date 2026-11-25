import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {BrowserReadRecording} from '../../eval/restaurant/agent-loop/runners/browser-read-recording.js';

const digest=(data:Uint8Array|string)=>createHash('sha256').update(data).digest('hex');

test('reviewed static default preserves admission and recording while documents data and authority URLs stay Node',async()=>{
 const root=await mkdtemp(join(tmpdir(),'native-static-'));
 const font=await readFile('node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2');
 const script='window.fixtureLoaded=true;window.fixtureConfig={api_key:"opaque-fixture-credential"};';
 const rows:Array<{pathname:string;term:string|null}>=[];let documentOrigin='';
 const api=createServer((request,response)=>{const u=new URL(request.url!,'http://localhost');rows.push({pathname:u.pathname,term:u.searchParams.get('term')});response.setHeader('Access-Control-Allow-Origin',documentOrigin);response.setHeader('Access-Control-Allow-Headers','x-api-key');response.setHeader('Access-Control-Allow-Methods','GET');response.setHeader('Content-Type','application/json');response.end('{}');});api.listen(0,'127.0.0.1');await once(api,'listening');const apiOrigin=`http://127.0.0.1:${(api.address() as import('node:net').AddressInfo).port}`;
 const server=createServer((request,response)=>{const url=new URL(request.url!,'http://localhost');rows.push({pathname:url.pathname,term:url.searchParams.get('term')});
  if(url.pathname==='/'){response.setHeader('Content-Type','text/html');response.end(`<body>Public fixture<input aria-label="Query" oninput="for(const term of [this.value,this.value.slice(0,4)]){const s=document.createElement('script');s.src='/user.js?term='+encodeURIComponent(term);document.body.append(s)}"><button onclick="fetch('${apiOrigin}/data',{headers:{'x-api-key':'public-fixture'}});const x=new XMLHttpRequest();x.open('GET','/xhr');x.send();fetch('/post',{method:'POST'})">Read</button><script src="/assets/app.js"></script><script src="/dynamic-only.js"></script><script src="/denied.js"></script><script src="/assets/forbidden/direct.js"></script><script src="/assets/redirect.js"></script><script src="/assets/redirect-ok.js"></script><link rel="stylesheet" href="/assets/site.css"><img src="/assets/pixel.png"></body>`);return;}
  if(url.pathname==='/assets/redirect.js'){response.writeHead(302,{location:'/assets/forbidden/target.js'});response.end();return;}
  if(url.pathname==='/assets/redirect-ok.js'){response.writeHead(302,{location:'/assets/child.js'});response.end();return;}
  if(url.pathname==='/assets/site.css'){response.setHeader('Content-Type','text/css');response.end(`@font-face{font-family:Fixture;src:url('/assets/font.woff2')}body{font-family:Fixture;color:rgb(1,2,3)}`);return;}
  if(url.pathname==='/assets/font.woff2'){response.setHeader('Content-Type','font/woff2');response.end(font);return;}
  if(url.pathname==='/assets/pixel.png'){response.setHeader('Content-Type','image/png');response.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jN1sAAAAASUVORK5CYII=','base64'));return;}
  response.setHeader('Content-Type',url.pathname.endsWith('.js')?'application/javascript':'application/json');response.end(url.pathname.endsWith('.js')?script:'{}');
 });server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
 documentOrigin=origin;
 const statics=[{origin,pathnamePrefix:'/assets/',methods:['GET','HEAD'] as const,resourceTypes:['script','stylesheet','font','image'] as const,queryKeys:[]},{origin,pathname:'/user.js',methods:['GET'] as const,resourceTypes:['script'] as const,queryKeys:['term']}];
 const policy={documentOrigins:[origin],staticResources:statics,retainedResources:statics,prohibitedPaths:[{hostname:'127.0.0.1',pathSegment:'forbidden'}],dynamicReads:[{origin:apiOrigin,pathname:'/data',methods:['GET'] as const,resourceTypes:['fetch'] as const,queryKeys:[],corsPreflight:{requestOrigin:origin,requestedHeaderNames:['x-api-key']}},...['/data','/xhr'].map(pathname=>({origin,pathname,methods:['GET'] as const,resourceTypes:['fetch','xhr'] as const,queryKeys:[]})),{origin,pathname:'/dynamic-only.js',methods:['GET'] as const,resourceTypes:['script'] as const,queryKeys:[]}]};
 const bodyHashes:Record<string,string>={};
 try{
  for(const profile of ['DEFAULT','NODE_FETCH'] as const){
   rows.length=0;const wire:Array<{pathname:string;term:string|null;method:string;type:string;transport:string}>=[];
   const browserType={async launch(options:any){const b=await chromium.launch(options),create=b.newContext.bind(b);b.newContext=async opts=>{const c=await create(opts),route=c.route.bind(c);c.route=(pattern,handler,options)=>route(pattern,async(actual,request)=>{const wrapped=new Proxy(actual,{get(target,key){if(key==='fetch'||key==='continue')return async(...args:any[])=>{const u=new URL(request.url());wire.push({pathname:u.pathname,term:u.searchParams.get('term'),method:request.method(),type:request.resourceType(),transport:key==='fetch'?'NODE_FETCH':'BROWSER_GET_HEAD'});return (target[key] as Function).apply(target,args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});return handler(wrapped,request);},options);return c;};return b;}};
   const recorder=new BrowserReadRecording({directory:root,runId:profile,reviewedReads:policy.dynamicReads,reviewedStaticResources:statics});
   const captured:Array<{pathname:string;hash:string}>=[];
   const session=await new LocalPlaywrightChromium({browserType,...(profile==='NODE_FETCH'?{admittedGetTransport:profile}:{})}).openSession({signal:new AbortController().signal,networkPolicy:policy,recordResponse:async r=>{captured.push({pathname:new URL(r.url).pathname,hash:digest(r.body)});await recorder.recordResponse(r);}});
   try{
    session.beginReadScope?.();await session.prepareNavigation?.(origin+'/',{timeoutMs:20000});await session.navigate(origin+'/',{waitUntil:'domcontentloaded',timeoutMs:20000});let controls=await session.observeControls!();
    await session.fill(controls.find(c=>c.label==='Query')!.id,'BlueRestaurant',{inputSource:'SPECIFIC_OUTLET'});controls=await session.observeControls!();await session.click(controls.find(c=>c.label==='Read')!.id);await session.waitForSettled?.({url:origin+'/',title:'',text:''},3000);await session.flushRecordedResponses?.();const snapshot=await session.snapshot();
    assert.equal(wire.find(r=>r.pathname==='/assets/app.js')?.transport,profile==='DEFAULT'?'BROWSER_GET_HEAD':'NODE_FETCH');
    assert.equal(wire.find(r=>r.pathname==='/assets/site.css')?.transport,profile==='DEFAULT'?'BROWSER_GET_HEAD':'NODE_FETCH');
    for(const pathname of ['/assets/font.woff2','/assets/pixel.png'])assert.equal(wire.find(r=>r.pathname===pathname)?.transport,profile==='DEFAULT'?'BROWSER_GET_HEAD':'NODE_FETCH',pathname);
    for(const pathname of ['/','/data','/xhr','/dynamic-only.js','/user.js']){assert.ok(wire.some(r=>r.pathname===pathname),pathname);assert.ok(wire.filter(r=>r.pathname===pathname).every(r=>r.transport==='NODE_FETCH'),pathname);}
    assert.ok(snapshot.networkRequests?.some(r=>r.method==='OPTIONS'&&r.outcome==='ADMITTED'));
    assert.equal(wire.filter(r=>r.pathname==='/user.js').length,2);assert.ok(!rows.some(r=>r.pathname.includes('forbidden')||r.pathname==='/denied.js'||r.pathname==='/post'));
    const observed=snapshot.networkRequests?.find(r=>r.pathname==='/assets/app.js'&&r.outcome==='ADMITTED') as any;assert.deepEqual(observed.admissionRule,{collection:'staticResources',index:0});
    assert.ok(snapshot.networkRequests?.some(r=>r.pathname==='/assets/forbidden/direct.js'&&r.outcome==='BLOCKED'));
    assert.ok(snapshot.networkRequests?.some(r=>r.pathname==='/assets/forbidden/target.js'&&r.outcome==='REDIRECT_BLOCKED'));
    assert.ok(snapshot.networkRequests?.some(r=>r.pathname==='/denied.js'&&r.outcome==='BLOCKED'));
    assert.ok(snapshot.networkRequests?.some(r=>r.pathname==='/post'&&r.outcome==='BLOCKED'));
    const authority=snapshot.networkRequests?.filter(r=>r.pathname==='/user.js'&&r.outcome==='ADMITTED')??[];assert.deepEqual(authority.map(r=>r.queryValues?.[0]?.valueClass).sort(),['EQUALS_AUTHORITATIVE_INPUT','PREFIX_OF_AUTHORITATIVE_INPUT']);assert.ok(authority.every(r=>r.transport==='NODE_FETCH'));
    assert.ok(captured.some(r=>r.pathname==='/assets/font.woff2'&&r.hash===digest(font)));
    assert.ok(captured.some(r=>r.pathname==='/assets/child.js'&&r.hash===digest(script)),'admitted redirected native body still reaches Recorder');assert.ok(captured.some(r=>r.pathname==='/assets/app.js'&&r.hash===digest(script)));assert.ok(captured.some(r=>r.pathname==='/assets/site.css'));
   }finally{await session.close();}
   const result=await recorder.finish();const manifest=JSON.parse(await readFile(join(result.path,'recording.json'),'utf8'));const harPath=result.replay.status!=='NOT_REPLAYABLE'?result.replay.harPath:join(result.path,manifest.componentCapture.harPath);const har=JSON.parse(await readFile(harPath,'utf8'));
   const body=har.log.entries.find((e:any)=>new URL(e.request.url).pathname==='/assets/app.js').response.content.text;
   assert.equal(Buffer.byteLength(body),Buffer.byteLength(script));assert.ok(!body.includes('opaque-fixture-credential'));bodyHashes[profile]=digest(body);bodyHashes[profile+':css']=digest(har.log.entries.find((e:any)=>new URL(e.request.url).pathname==='/assets/site.css').response.content.text);
  }
  assert.equal(bodyHashes.DEFAULT,bodyHashes.NODE_FETCH);assert.equal(bodyHashes['DEFAULT:css'],bodyHashes['NODE_FETCH:css']);
 }finally{server.close();server.closeAllConnections();api.close();api.closeAllConnections();await Promise.all([once(server,'close'),once(api,'close')]);await rm(root,{recursive:true,force:true});}
});

test('10MB local public script reports native and Node DCL/body arrival without a speed threshold',async()=>{
 const size=10_284_255,prefix='window.largeFixture=true;/*',script=prefix+'x'.repeat(size-Buffer.byteLength(prefix)-2)+'*/';
 const server=createServer((request,response)=>{if(request.url==='/large.js'){response.setHeader('Content-Type','application/javascript');response.end(script);}else{response.setHeader('Content-Type','text/html');response.end('<body>Public<script src="/large.js"></script></body>');}});server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;const measurements:any[]=[];
 try{for(const profile of ['NODE_FETCH','DEFAULT'] as const){let bodyAt=0,bytes=0;const s=await new LocalPlaywrightChromium(profile==='NODE_FETCH'?{admittedGetTransport:'NODE_FETCH'}:{}).openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],staticResources:[{origin,pathname:'/large.js',resourceTypes:['script'],methods:['GET'],queryKeys:[]}],dynamicReads:[]},recordResponse:r=>{if(new URL(r.url).pathname==='/large.js'){bodyAt=performance.now();bytes=r.body.byteLength;assert.equal(digest(r.body),digest(script));}}});
  try{const start=performance.now();await s.prepareNavigation?.(origin+'/',{timeoutMs:20000});await s.navigate(origin+'/',{waitUntil:'domcontentloaded',timeoutMs:20000});const dclMs=performance.now()-start;await s.flushRecordedResponses?.();assert.equal(bytes,size);const observation=(await s.snapshot()).networkRequests?.find(r=>r.pathname==='/large.js'&&r.outcome==='ADMITTED');assert.equal(observation?.transport,profile==='DEFAULT'?'BROWSER_GET_HEAD':'NODE_FETCH');measurements.push({profile,transport:observation.transport,bytes,dclMs,bodyAvailableMs:bodyAt-start});}finally{await s.close();}}
  console.log('STATIC_10MB_TIMING '+JSON.stringify(measurements));
 }finally{server.close();server.closeAllConnections();await once(server,'close');}
});


test('native static body still triggers whole-recording own-credential rejection',async()=>{
 const root=await mkdtemp(join(tmpdir(),'native-static-owned-')),credential='owned-production-fixture-marker';
 const server=createServer((request,response)=>{response.setHeader('Content-Type',request.url==='/app.js'?'application/javascript':'text/html');response.end(request.url==='/app.js'?`window.config="${credential}";`:'<body>Public<script src="/app.js"></script></body>');});server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`,statics=[{origin,pathname:'/app.js',methods:['GET'] as const,resourceTypes:['script'] as const,queryKeys:[]}];
 const recorder=new BrowserReadRecording({directory:root,runId:'owned',reviewedStaticResources:statics,ownCredentials:[credential]});
 const session=await new LocalPlaywrightChromium().openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],staticResources:statics,dynamicReads:[]},recordResponse:r=>recorder.recordResponse(r)});
 try{await session.prepareNavigation?.(origin+'/');await session.navigate(origin+'/');await session.flushRecordedResponses?.();const snapshot=await session.snapshot();assert.equal(snapshot.networkRequests?.find(r=>r.pathname==='/app.js'&&r.outcome==='ADMITTED')?.transport,'BROWSER_GET_HEAD');recorder.recordSnapshot(snapshot);await session.close();const result=await recorder.finish();assert.deepEqual(result.replay,{status:'NOT_REPLAYABLE',reason:'UNSAFE_DOCUMENT'});const manifest=await readFile(join(result.path,'recording.json'),'utf8');assert.match(manifest,/OWN_CREDENTIAL/);assert.ok(!manifest.includes(credential));await assert.rejects(readFile(join(result.path,'components.har')));}
 finally{await session.close();server.close();server.closeAllConnections();await once(server,'close');await rm(root,{recursive:true,force:true});}
});
