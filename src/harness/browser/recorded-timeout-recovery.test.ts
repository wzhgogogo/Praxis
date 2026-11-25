import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {inspectTabelogVacancyResponse} from '../../integrations/tabelog/tabelog-vacancy-response.js';
import {parseTabelogOutletIdentityWithEvidence} from '../../integrations/tabelog/tabelog-page-parser.js';

// Actual timeout metadata + unchanged saved public DOM/JSON. The zero-body first
// attempt and successful second HTTP envelope are LOCAL_CONSTRUCTION. No claim
// that the historical Node response had zero bytes or actually retried.
for(const name of ['01-r1-retry1','01-r2','02-r1'])test(`recorded timeout component resumes source interpretation: ${name}`,{timeout:25_000},async()=>{
 const dir=new URL('./fixtures/recorded-timeout/',import.meta.url),f=JSON.parse(await readFile(new URL('provenance.json',dir),'utf8'));
 const input=f.cases.find((c:any)=>c.case===name),document=f.documents[input.document],html=await readFile(new URL(input.document+'.html',dir));
 assert.equal(createHash('sha256').update(html).digest('hex'),document.sha256);assert.equal(input.navigation.end.endReason,'TIMEOUT');assert.equal(input.historicalNodeBodyBytes,'UNKNOWN');
 assert.ok(input.navigation.end.elapsedMs>=19_900);
 const path=new URL(document.url).pathname;let attempts=0,closedAt=0,secondAt=0;
 const server=createServer((q,s)=>{
  if(q.url==='/start'){s.setHeader('Content-Type','text/html');s.end('<body><a href="'+path+'">Observed source link</a></body>');return;}
  assert.equal(q.url,path);attempts++;if(attempts===1){s.once('close',()=>{closedAt=performance.now();});return;}
  secondAt=performance.now();s.setHeader('Content-Type','text/html');s.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'");s.end(html);
 });server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+(server.address() as import('node:net').AddressInfo).port,url=origin+path;
 const session=await new LocalPlaywrightChromium().openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]}});
 try{
  if(name==='02-r1'){
   await session.prepareNavigation!(origin+'/start',{timeoutMs:20_000});await session.navigate(origin+'/start',{timeoutMs:20_000});
   const link=(await session.observeControls!()).find(c=>c.kind==='LINK'&&c.href===url)!;assert.ok(link);
   await session.prepareObservedNavigation!(url,{timeoutMs:20_000});await session.openLink!(link.id,url,{timeoutMs:20_000});
  }else{await session.prepareNavigation!(url,{timeoutMs:20_000});await session.navigate(url,{timeoutMs:20_000});}
  assert.equal(attempts,2);assert.ok(closedAt>0&&closedAt<secondAt);assert.ok(session.entryNavigationEvents!().some(e=>e.event==='ZERO_BYTE_TIMEOUT'));
  const snapshot=await session.snapshot();assert.equal(snapshot.url,url);
  if(input.document==='outlet'){
   const page={...snapshot,url:document.url};const identity=parseTabelogOutletIdentityWithEvidence(page,{sourceEntityId:'13198396',sourceUrl:document.url,outletName:''});assert.ok(identity?.outlet.outletName);
   const raw=await readFile(new URL('vacancy.json',dir));assert.equal(createHash('sha256').update(raw).digest('hex'),f.vacancy.sha256);
   const body=JSON.parse(raw.toString()),u=new URL(f.vacancy.url),date=u.searchParams.get('svd')!;const iso=date.slice(0,4)+'-'+date.slice(4,6)+'-'+date.slice(6,8);
   const observed=inspectTabelogVacancyResponse({...page,responses:[{url:f.vacancy.url,status:200,sequence:1,observedAt:'2026-11-09T00:00:00Z',body}]},iso,Number(u.searchParams.get('svps')));
   assert.equal(observed.status,'OBSERVED','saved source stock remains interpretable after recovery');
  }else assert.ok(snapshot.text.trim().length>0,'02-r1 was an observed directory, not an outlet');
 }finally{await session.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
