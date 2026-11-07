import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {traceBrowserRuntime} from '../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
import {runG6SourceReadCheck,installSourceReadPageLimit} from '../../eval/restaurant/agent-loop/g6/source-read-check.js';

for(const catalogStatus of [503,200])test(`Live source-read path gates authoritative text on browser catalog${catalogStatus}`,async()=>{
 const arrivals:Array<{path:string;queryKeys:string[]}>=[];const query='Public Named Outlet';
 const server=createServer((request,response)=>{
  const url=new URL(request.url!,'http://localhost');arrivals.push({path:url.pathname,queryKeys:[...url.searchParams.keys()]});
  if(url.pathname==='/catalog.json'){response.statusCode=catalogStatus;response.setHeader('Content-Type','application/json');response.end('{}');return;}
  if(url.pathname==='/search/'){response.setHeader('Content-Type','application/json');response.end('[]');return;}
  response.setHeader('Content-Type','text/html');response.end(`<body><button onclick="document.getElementById('destination').hidden=false">Destination</button><input hidden id="destination" aria-label="Destination" oninput="fetch('/search/?q='+encodeURIComponent(this.value));fetch('/search/?lat=1234567890&service_mode=public%20dining');fetch('/search/?destination=Visible%20region%2C%20station.&name='+encodeURIComponent(this.value))"><script>fetch('/catalog.json')</script></body>`);
 });server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
 let catalogResolve!:(ok:boolean)=>void;const catalogTerminal=new Promise<boolean>(resolve=>{catalogResolve=resolve;});
 const events:any[]=[],browser=traceBrowserRuntime(new LocalPlaywrightChromium(),'TABLECHECK',(kind,detail)=>{
  const row=detail as any;if(kind==='NETWORK_REQUEST_END'&&new URL(row.url).pathname==='/catalog.json')catalogResolve(row.status===200&&row.outcome==='FINISHED');return 1;
 });
 const policy={documentOrigins:[origin],staticResources:[],dynamicReads:[{origin,pathname:'/catalog.json',methods:['GET'] as const,resourceTypes:['fetch','xhr'] as const,queryKeys:[]},{origin,pathname:'/search/',methods:['GET'] as const,resourceTypes:['fetch','xhr'] as const,queryKeys:['lat','service_mode']},{origin,pathname:'/search/',methods:['GET'] as const,resourceTypes:['fetch','xhr'] as const,queryKeys:['q'],queryValueClasses:{q:['EQUALS_AUTHORITATIVE_INPUT'] as const}},{origin,pathname:'/search/',methods:['GET'] as const,resourceTypes:['fetch','xhr'] as const,queryKeys:['destination','name'],queryValueClasses:{destination:['SHORT_TOKEN','NUMERIC'] as const,name:['EQUALS_AUTHORITATIVE_INPUT'] as const}}]};
 let charged=0;try{
  const result=await runG6SourceReadCheck({browser,policy,spec:{startUrl:origin+'/',query,minimumIntervalMs:1},signal:new AbortController().signal,catalogTerminal,beforeEntry:async()=>{charged++;},phase:()=>{},record:(kind,detail)=>events.push({kind,detail})});
  assert.equal(charged,1);
  if(catalogStatus!==200){assert.equal(result.status,'STOP_CATALOG_NOT_200');assert.equal(arrivals.filter(r=>r.path==='/search/').length,0);}
  else{assert.equal(result.status,'STOP_VALUE_REVIEW');assert.ok(events.some(e=>e.detail.violations.some((v:any)=>v.queryKey==='destination'&&v.valueClass==='OTHER')));assert.deepEqual(events.flatMap(e=>e.detail.violations).map((v:any)=>v.queryKey),['destination']);assert.deepEqual(arrivals.filter(r=>r.path==='/search/').map(r=>r.queryKeys).sort((a,b)=>a.join().localeCompare(b.join())),[['lat','service_mode'],['q']]);}
 }finally{server.close();server.closeAllConnections();await once(server,'close');}
});


test('selected-shop document is stopped by the real CDP boundary before receiver transmission',async()=>{
 const {chromium}=await import('playwright-core');let shopArrivals=0,phase='',blocked=false;
 const server=createServer((request,response)=>{const u=new URL(request.url!,'http://localhost');if(u.pathname==='/shop')shopArrivals++;response.setHeader('Content-Type',u.pathname==='/'?'text/html':'application/json');response.end(u.pathname==='/'?`<button onclick="document.querySelector('input').hidden=false">Destination</button><input hidden aria-label="Destination" oninput="document.querySelector('a').hidden=false"><a hidden href="/shop">Public Named Outlet</a>`:'{}');});
 server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${(server.address() as import('node:net').AddressInfo).port}`;
 const browser=new LocalPlaywrightChromium({browserType:{async launch(options){const b=await chromium.launch(options),create=b.newContext.bind(b);b.newContext=async options=>{const c=await create(options);installSourceReadPageLimit(c,()=>phase,()=>{blocked=true;});return c;};return b;}}});
 try{await runG6SourceReadCheck({browser,policy:{documentOrigins:[origin],staticResources:[],dynamicReads:[]},spec:{startUrl:origin+'/',query:'Public Named Outlet',minimumIntervalMs:1},signal:new AbortController().signal,beforeEntry:async()=>{},catalogTerminal:Promise.resolve(true),phase:value=>{phase=value;},record:()=>{}});assert.equal(blocked,true);assert.equal(shopArrivals,0);}
 finally{server.close();server.closeAllConnections();await once(server,'close');}
});
