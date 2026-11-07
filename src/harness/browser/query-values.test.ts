import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {observeQueryValues} from '../../infrastructure/browser/browser-query-values.js';

// Real Chromium receiver: value categories cannot change pre-existing admission.
test('query classification is observational, tracks a successful current fill and forgets old read authority',async()=>{
 const arrivals:string[]=[];
 const server=createServer((request,response)=>{
  const url=new URL(request.url!,'http://localhost');
  if(url.pathname==='/'){response.setHeader('Content-Type','text/html');response.end(`<body><input aria-label="Public keyword"><button onclick="search()">Search</button><script>function search(){const q=encodeURIComponent(document.querySelector('input').value);fetch('/query?q='+q);fetch('/blocked?q='+q);}document.querySelector('input').addEventListener('input',search);</script></body>`);}
  else {arrivals.push(url.pathname);response.end('ok');}
 });server.listen(0,'127.0.0.1');await once(server,'listening');
 const origin=`http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
 const runtime=new LocalPlaywrightChromium();const signal=new AbortController().signal;
 const session=await runtime.openSession({signal,networkPolicy:{documentOrigins:[origin],staticResources:[],dynamicReads:[{origin,pathname:'/query',methods:['GET'],resourceTypes:['fetch'],queryKeys:['q']}]}});
 try{
  session.beginReadScope?.();await session.prepareNavigation?.(origin+'/');await session.navigate(origin+'/');await session.snapshot();
  let controls=await session.observeControls!();const input=controls.find(c=>c.label==='Public keyword')!;
  await session.fill(input.id,'Blue Restaurant',{inputSource:'SPECIFIC_OUTLET'});await session.waitForSettled?.({url:origin+'/',title:'',text:''},2000);
  let snapshot=await session.snapshot();
  for(const outcome of ['ADMITTED','BLOCKED'])assert.ok(snapshot.networkRequests?.some(r=>r.outcome===outcome&&r.queryValues?.some(f=>f.queryKey==='q'&&f.valueClass==='EQUALS_AUTHORITATIVE_INPUT')),outcome);
  assert.deepEqual(arrivals,['/query'],'Only the original admitted endpoint reaches the receiver');
  session.beginReadScope?.();controls=await session.observeControls!();await session.click(controls.find(c=>c.label==='Search')!.id);await session.waitForSettled?.(snapshot,2000);snapshot=await session.snapshot();
  const latest=snapshot.networkRequests?.filter(r=>r.pathname==='/query'&&r.outcome==='ADMITTED').at(-1);
  assert.equal(latest?.queryValues?.[0]?.valueClass,'OTHER','A previous read fill is no longer authority');
  assert.deepEqual(arrivals,['/query','/query'],'The recorder does not restrict ordinary admission');
 }finally{await session.close();server.close();await once(server,'close');}
});

test('query categories redact all values and use the existing sensitive-format rejection first',()=>{
 const url=new URL('https://public.example/search');
 for(const [key,value] of Object.entries({same:'Ｂｌｕｅ   Restaurant',prefix:'Blue Rest',count:'12',token:'en_US-2',phone:'+81 90 1234 5678',email:'someone@example.com',credential:'token=private',other:'unrelated person'}))url.searchParams.set(key,value);
 const observed=observeQueryValues(url,['Blue Restaurant']);
 assert.deepEqual(observed.map(r=>r.valueClass),['EQUALS_AUTHORITATIVE_INPUT','PREFIX_OF_AUTHORITATIVE_INPUT','NUMERIC','SHORT_TOKEN','SENSITIVE_FORMAT','SENSITIVE_FORMAT','SENSITIVE_FORMAT','OTHER']);
 assert.deepEqual(Object.keys(observed[0]!),['queryKey','valueClass']);
 assert.equal(JSON.stringify(observed).includes('Blue Restaurant'),false);
});

test('real Chromium CORS preflights share exact text-value contracts while non-preflight Other remains refused',async()=>{
 const {tableCheckPublicSearchReads}=await import('../../integrations/tablecheck/tablecheck-public-query.js');
 const received:Array<{method:string;keys:string[];q:string|null}>=[];let documentOrigin='';
 const api=createServer((request,response)=>{
  const u=new URL(request.url!,'http://localhost');received.push({method:request.method!,keys:[...u.searchParams.keys()].sort(),q:u.searchParams.get('q')??u.searchParams.get('name')});
  response.setHeader('Access-Control-Allow-Origin',documentOrigin);response.setHeader('Access-Control-Allow-Headers','x-api-key');response.setHeader('Access-Control-Allow-Methods','GET');response.end('{}');
 });api.listen(0,'127.0.0.1');await once(api,'listening');const apiOrigin=`http://127.0.0.1:${(api.address() as import('node:net').AddressInfo).port}`;
 const source=createServer((_request,response)=>{response.setHeader('Content-Type','text/html');response.end(`<body><input aria-label="Public keyword"><button onclick="search()">Search</button><script>function search(){const q=document.querySelector('input').value;for(const fields of [{country:'jp',hits:'10',queryProfile:'destination'},{country:'jp',hits:'10',kind:'shop',queryProfile:'destination'},{country:'jp',hits:'10',q,queryProfile:'destination'},{destination:'jp',hits:'10',name:q,queryProfile:'destination'},{country:'jp',hits:'10',q:q.slice(0,4),queryProfile:'destination'},{country:'jp',hits:'10',q,queryProfile:'destination',extra:'x'}])fetch('${apiOrigin}/search/?'+new URLSearchParams(fields),{headers:{'x-api-key':'public-fixture'}}).catch(()=>{});}document.querySelector('input').addEventListener('input',search);</script></body>`);});
 source.listen(0,'127.0.0.1');await once(source,'listening');documentOrigin=`http://127.0.0.1:${(source.address() as import('node:net').AddressInfo).port}`;
 const session=await new LocalPlaywrightChromium({admittedGetTransport:'BROWSER_GET_HEAD'}).openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[documentOrigin],staticResources:[],dynamicReads:tableCheckPublicSearchReads.map(r=>({...r,origin:apiOrigin,...(r.corsPreflight?{corsPreflight:{...r.corsPreflight,requestOrigin:documentOrigin}}:{})}))}});
 try{
  session.beginReadScope?.();await session.prepareNavigation?.(documentOrigin+'/');await session.navigate(documentOrigin+'/');const controls=await session.observeControls!();
  await session.fill(controls.find(c=>c.label==='Public keyword')!.id,'Blue Restaurant',{inputSource:'SPECIFIC_OUTLET'});await session.waitForSettled?.({url:documentOrigin+'/',title:'',text:''},3000);
  const snapshot=await session.snapshot();const actual=received.filter(r=>r.method==='GET');assert.equal(actual.length,4,JSON.stringify(received));
  assert.deepEqual(actual.map(r=>r.keys).sort(),[['country','hits','queryProfile'],['country','hits','kind','queryProfile'],['country','hits','q','queryProfile'],['destination','hits','name','queryProfile']].sort());
  assert.equal(actual.filter(r=>r.q==='Blue Restaurant').length,2);assert.ok(!received.some(r=>r.q==='Blue'),'Prefix preflight never reaches the independent receiver');
  assert.ok(snapshot.networkRequests?.some(r=>r.method==='OPTIONS'&&r.outcome==='ADMITTED'&&r.corsPreflight?.requestedMethod==='GET'));
  session.beginReadScope?.();const current=await session.observeControls!();await session.click(current.find(c=>c.label==='Search')!.id);await session.waitForSettled?.(snapshot,3000);
  assert.equal(received.filter(r=>r.method==='GET'&&r.q==='Blue Restaurant').length,2,'No old-read authoritative text request reaches the receiver');
 }finally{await session.close();source.close();api.close();await Promise.all([once(source,'close'),once(api,'close')]);}
});
