/** AUDIT ONLY. Local constructed timing and saved-page class transforms; no product edits or real calls. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {PlaywrightReadNetworkGuard} from '../../../src/infrastructure/browser/playwright-read-network-guard.ts';
import {LocalPlaywrightChromium} from '../../../src/infrastructure/browser/local-playwright-chromium.ts';
import {tabelogQueryControlHints,tabelogRequestedDateState,hasTabelogSelectedQuery} from '../../../src/integrations/tabelog/tabelog-query-controls.ts';
import {tabelogAvailabilityCompletion,tabelogNameSearchCompletion} from '../../../src/integrations/tabelog/tabelog-browser-availability.ts';
import {tableCheckNameSearchCompletion} from '../../../src/integrations/tablecheck/tablecheck-browser-availability.ts';
import {hasTableCheckSelectedRequest,parseTableCheckAvailabilitySlots} from '../../../src/integrations/tablecheck/tablecheck-page-parser.ts';
const here=new URL('./',import.meta.url),root=new URL('../../../',import.meta.url);
const input=JSON.parse(await readFile(new URL('probe-input.json',here),'utf8'));
await mkdir(new URL('observations/',here),{recursive:true});
const typeRows:any[]=[];
for(const spec of input.typeCases){
 const events:any[]=[];const received:any[]=[];let seq=0;
 const endpoint='/v2/hub/availability_calendar_v2';
 const server=createServer(async(req,res)=>{if(req.url?.startsWith(endpoint)){const bytes=[];for await(const c of req)bytes.push(Buffer.from(c));received.push({method:req.method,body:Buffer.concat(bytes).toString()});res.setHeader('content-type','application/json');res.end('{"read":true}');}else{res.setHeader('content-type','text/html');res.end('<h1>Constructed local public-read fixture</h1>');}});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address() as any;const origin=`http://127.0.0.1:${address.port}`;
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({serviceWorkers:'block'});await context.grantPermissions(['local-network-access'],{origin});
  const wrapped=new Proxy(context,{get(target,key){
   if(key==='newCDPSession')return async(...args:any[])=>{const session=await (target.newCDPSession as any)(...args);return new Proxy(session,{get(s,k){if(k==='on')return (method:string,handler:Function)=>{s.on(method as any,(event:any)=>{
    const relevant=event.request?.url?.includes(endpoint);const record=relevant?{sequence:++seq,method,requestId:event.requestId,networkId:event.networkId,type:event.type,resourceType:event.resourceType}:null;
    if(record)events.push({...record,phase:'RAW_RECEIVED'});
    const deliver=()=>{if(record)events.push({...record,sequence:++seq,phase:'DELIVERED_TO_GUARD'});handler(event);};
    if(relevant && method==='Network.requestWillBeSent' && spec.deferNetwork)setTimeout(deliver,80);else deliver();
   });return session;};const value=Reflect.get(s,k);return typeof value==='function'?value.bind(s):value;}});};
   const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;
  }});
  context.on('request',req=>{if(req.url().includes(endpoint))events.push({sequence:++seq,method:'PLAYWRIGHT_REQUEST',type:req.resourceType(),httpMethod:req.method()});});
  context.on('requestfailed',req=>{if(req.url().includes(endpoint))events.push({sequence:++seq,method:'PLAYWRIGHT_FAILED',type:req.resourceType(),failure:req.failure()});});
  const rule={origin,pathname:endpoint,resourceTypes:spec.types,methods:['POST'],bodyFields:{locale:'string',start_at:'string',shop_id:'string',num_people:'string'}};
  const guard=new PlaywrightReadNetworkGuard({documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[rule]} as any,5000);
  await guard.install(wrapped);const page=await context.newPage();await guard.preparePage(wrapped,page);guard.prepareNavigation(origin+'/');await page.goto(origin+'/',{timeout:5000});
  const body=JSON.stringify({locale:'en',start_at:'2026-10-26',shop_id:'LOCAL_CONSTRUCTED',num_people:'2',...(spec.extraField?{extra:'CONSTRUCTED_NON_PERSONAL_FIELD'}:{})});
  const outcome=await Promise.race([page.evaluate(async({path,body,type,method})=>{try{if(type==='fetch'){const r=await fetch(path,{method,headers:{'content-type':'application/json'},body});return {ok:r.ok};}return await new Promise(resolve=>{const x=new XMLHttpRequest();x.open(method,path);x.setRequestHeader('content-type','application/json');x.onload=()=>resolve({ok:x.status===200});x.onerror=()=>resolve({ok:false});x.send(body);});}catch(e){return{ok:false,error:String(e)}}},{path:endpoint,body,type:spec.type,method:spec.method}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('BOUNDED_LOCAL_PROBE_TIMEOUT')),7000))]);
  await new Promise(r=>setTimeout(r,120));
  typeRows.push({id:spec.id,inputOrigin:'LOCAL_CONSTRUCTED',policyControlOnly:spec.types.length===2,deferredGuardCallback:spec.deferNetwork,outcome,received,events,diagnostics:guard.snapshotDiagnostics(),guardRequests:guard.snapshotRequests()});
 }finally{await browser.close();await new Promise<void>(r=>server.close(()=>r()));}
}
await writeFile(new URL('observations/resource-types.json',here),JSON.stringify(typeRows,null,2)+'\n');
const classRows:any[]=[];
for(const spec of input.classCases){
 const body=await readFile(new URL(spec.file,root),'utf8');const variants:any={};
 for(const mode of ['original','renamed']){
  let page:any;const transforms:any[]=[];const requests:any[]=[];
  const browserType={async launch(options:any){const browser=await chromium.launch(options);const create=browser.newContext.bind(browser);browser.newContext=async(opts:any)=>{const c=await create(opts);c.on('page',p=>{page=p});await c.route('**/*',async route=>{const match=route.request().url()===spec.url;requests.push({kind:match?'FIXTURE_FULFILLED':'ABORTED_MISSING_FIXTURE',resourceType:route.request().resourceType()});if(match)await route.fulfill({contentType:'text/html; charset=utf-8',body:'<style>.is-hidden{display:none}</style>'+body});else await route.abort();});return c;};return browser;}};
  const runtime=new LocalPlaywrightChromium({browserType} as any);const session=await runtime.openSession({signal:new AbortController().signal});
  try{
   await session.navigate(spec.url);const before=await page.evaluate(()=>document.body.innerText);
   if(mode==='renamed')transforms.push(...await page.evaluate(()=>{
    const tokens=[...new Set([...document.querySelectorAll('[class]')].flatMap(e=>[...e.classList]))].sort();const map=new Map(tokens.map((s,i)=>[s,`f3_private_${i}`]));
    for(const style of document.querySelectorAll('style')){let text=style.textContent??'';for(const [old,next] of map){const escaped=old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');text=text.replace(new RegExp('\\.'+escaped+'(?![\\w-])','g'),'.'+next);}style.textContent=text;}
    for(const node of document.querySelectorAll('[class]'))node.setAttribute('class',[...node.classList].map(s=>map.get(s)??s).join(' '));
    return [...map].map(([old,next])=>({old,next}));
   }));
   const after=await page.evaluate(()=>document.body.innerText);assert.equal(after,before,'Class-only transform must preserve visible text');
   const snapshot=await session.snapshot();const controls=await session.observeControls!(spec.source==='TABELOG'?tabelogQueryControlHints(snapshot):[]);
   const observations={title:snapshot.title,visibleText:snapshot.text,controls:controls.map(c=>({kind:c.kind,label:c.label,value:c.value,selected:c.selected,disabled:c.disabled})),dateStates:spec.source==='TABELOG'?Object.fromEntries(input.dateStates.map((date:string)=>[date,tabelogRequestedDateState(snapshot,date)])):undefined,completion:spec.source==='TABELOG'?{name:tabelogNameSearchCompletion(snapshot),availability:input.availabilityRequests.map((request:any)=>({request,selected:hasTabelogSelectedQuery(snapshot,request.date,request.partySize),assessment:tabelogAvailabilityCompletion(snapshot,request)}))}:{name:tableCheckNameSearchCompletion(snapshot,'Ginza'),availability:input.availabilityRequests.map((request:any)=>({request,selected:hasTableCheckSelectedRequest(snapshot,request.date,request.partySize,controls),assessment:parseTableCheckAvailabilitySlots(snapshot,request)}))}};
   variants[mode]={observations,renamedTokens:transforms,network:requests,noExternalDispatch:true};
  }finally{await session.close();}
 }
 const a=variants.original.observations,b=variants.renamed.observations;classRows.push({fixture:spec.file,sourceUrl:spec.url,capturedOn:spec.capturedOn,evidenceType:'SAVED_PAGE_WITH_LOCAL_CLASS_MUTATION_NOT_WEBSITE_REPLAY',visibleTextInvariant:a.visibleText===b.visibleText,changed:Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])),variants});
}
await writeFile(new URL('observations/classes.json',here),JSON.stringify(classRows,null,2)+'\n');
console.log(JSON.stringify({resourceTypes:typeRows.map(r=>({id:r.id,outcome:r.outcome,arrivals:r.received.length,diagnostics:r.diagnostics})),classes:classRows.map(r=>({fixture:r.fixture,changed:r.changed,visibleTextInvariant:r.visibleTextInvariant}))}));
