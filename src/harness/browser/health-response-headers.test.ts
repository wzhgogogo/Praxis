import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';

test('admitted Node document reports401 headers before a stalled body completes',{timeout:6000},async()=>{
 const server=createServer((_q,s)=>{s.writeHead(401,{'Content-Type':'text/html'});s.flushHeaders();});server.listen(0,'127.0.0.1');await once(server,'listening');
 const url='http://127.0.0.1:'+(server.address() as import('node:net').AddressInfo).port+'/',controller=new AbortController();let resolve!:(value:any)=>void;
 const headers=new Promise<any>(r=>{resolve=r;});let timer:ReturnType<typeof setTimeout>|undefined;
 const session=await new LocalPlaywrightChromium().openSession({signal:controller.signal,networkPolicy:{documentOrigins:[new URL(url).origin],staticResources:[],dynamicReads:[]},onResponseHeaders:resolve});
 try{
  await session.prepareNavigation!(url,{timeoutMs:20_000});const navigation=session.navigate(url).catch(()=>{});
  const value=await Promise.race([headers,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Document status waited for body')),2000);})]);
  assert.deepEqual(value,{url,resourceType:'document',status:401,mainDocument:true});controller.abort();await navigation;
 }finally{clearTimeout(timer);await session.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
