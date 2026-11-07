import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {traceBrowserRuntime} from '../../eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
import {runG6SourceReadCheck} from '../../eval/restaurant/agent-loop/g6/source-read-check.js';

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
