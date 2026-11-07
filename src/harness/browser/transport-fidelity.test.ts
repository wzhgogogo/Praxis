import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright-core';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';

test('native, Guard route.fetch and Guard browser continuation preserve conditional-Origin CORS',async()=>{
 let origin='';let mode='';const received:Array<{mode:string;method:string;headerNames:string[];originMatched:boolean}>=[];
 const api=createServer((request,response)=>{
  const matched=request.headers.origin===origin;
  received.push({mode,method:request.method!,headerNames:Object.keys(request.headers).sort(),originMatched:matched});
  if(matched)response.setHeader('Access-Control-Allow-Origin',origin);
  response.setHeader('Access-Control-Allow-Headers','x-api-key');response.setHeader('Access-Control-Allow-Methods','GET');response.setHeader('Content-Type','application/json');
  response.end(JSON.stringify({headerNames:Object.keys(request.headers).sort(),originMatched:matched}));
 });api.listen(0,'127.0.0.1');await once(api,'listening');const apiOrigin=`http://127.0.0.1:${(api.address() as import('node:net').AddressInfo).port}`;
 const pageServer=createServer((_request,response)=>{response.setHeader('Content-Type','text/html');response.end(`<body><button onclick="fetch('${apiOrigin}/read',{headers:{'x-api-key':'public-fixture'}}).then(r=>r.json()).then(r=>{document.getElementById('result').textContent=JSON.stringify({cors:'PASS',...r})}).catch(e=>{document.getElementById('result').textContent=JSON.stringify({cors:'FAIL',error:e.name})})">Fetch</button><pre id="result">PENDING</pre></body>`);});
 pageServer.listen(0,'127.0.0.1');await once(pageServer,'listening');origin=`http://127.0.0.1:${(pageServer.address() as import('node:net').AddressInfo).port}`;
 const summaries:any[]=[];const browserHeaders:Array<{mode:string;method:string;names:string[]}>=[];
 const browserType={launch:async(options:any)=>{const browser=await chromium.launch(options);const create=browser.newContext.bind(browser);browser.newContext=async(options:any)=>{const context=await create(options),route=context.route.bind(context);context.route=(pattern:any,handler:any,options:any)=>route(pattern,async(actual,request)=>{if(request.url()===apiOrigin+'/read')browserHeaders.push({mode,method:request.method(),names:Object.keys(await request.allHeaders()).sort()});return handler(actual,request);},options);return context;};return browser;}};
 try{
  for(const transport of ['UNGUARDED_NATIVE','NODE_FETCH','BROWSER_GET_HEAD'] as const){
   mode=transport;const runtime=new LocalPlaywrightChromium(transport==='UNGUARDED_NATIVE'?{browserType}:{admittedGetTransport:transport,browserType});
   const policy={documentOrigins:[origin],staticResources:[],dynamicReads:[{origin:apiOrigin,pathname:'/read',resourceTypes:['fetch','xhr'] as const,methods:['GET'] as const,queryKeys:[],corsPreflight:{requestOrigin:origin,requestedHeaderNames:['x-api-key']}}]};
   const session=await runtime.openSession({signal:new AbortController().signal,...(transport==='UNGUARDED_NATIVE'?{}:{networkPolicy:policy})});
   try{
    await session.prepareNavigation?.(origin+'/');await session.navigate(origin+'/');const controls=await session.observeControls!();await session.click(controls.find(c=>c.label==='Fetch')!.id);await session.waitForSettled?.({url:origin+'/',title:'',text:''},3000);
    let body=(await session.snapshot()).text;
    // A bounded browser-owned element wait, not an unbounded polling loop.
    if(body.includes('PENDING')){await session.waitFor('#result:not(:text-is("PENDING"))',3000);body=(await session.snapshot()).text;}
    const result=JSON.parse(body.slice(body.indexOf('{')));const rows=received.filter(r=>r.mode===transport);const observed=browserHeaders.filter(r=>r.mode===transport&&r.method==='GET').at(-1);const actual=rows.find(r=>r.method==='GET');const missing=observed?.names.filter(name=>!actual?.headerNames.includes(name))??[];summaries.push({transport,cors:result.cors,receiver:rows,observedBrowserHeaderNames:observed?.names??null,missingHeaderNames:missing});
    assert.equal(result.cors,'PASS',JSON.stringify(summaries));assert.ok(rows.some(r=>r.method==='GET'&&r.originMatched));assert.equal(missing.length,0,JSON.stringify(summaries));
   }finally{await session.close();}
  }
  console.log('TRANSPORT_FIDELITY '+JSON.stringify({status:'NO_LOCAL_CORS_FAILURE_REPRODUCED',summaries}));
 }finally{pageServer.close();api.close();await Promise.all([once(pageServer,'close'),once(api,'close')]);}
});
