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
  for(const outcome of ['ADMITTED','BLOCKED'])assert.ok(snapshot.networkRequests?.some(r=>r.outcome===outcome&&r.queryValues?.some(f=>f.key==='q'&&f.valueClass==='EQUALS_AUTHORITATIVE_INPUT')),outcome);
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
 assert.deepEqual(Object.keys(observed[0]!),['key','valueClass']);
 assert.equal(JSON.stringify(observed).includes('Blue Restaurant'),false);
});
