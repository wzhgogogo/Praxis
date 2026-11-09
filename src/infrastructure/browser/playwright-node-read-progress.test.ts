import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer,get} from 'node:http';
import {once} from 'node:events';
import {observeNodeRead,type NodeReadProgress} from './playwright-node-read-progress.js';

test('Node body observation counts unread buffered bytes without starting flow',{timeout:3000},async()=>{
 const server=createServer((_q,s)=>{s.writeHead(200,{'Set-Cookie':'fixture=only','Content-Type':'text/html'});s.write('buffered-body');});server.listen(0,'127.0.0.1');await once(server,'listening');
 const url=new URL('http://127.0.0.1:'+(server.address() as import('node:net').AddressInfo).port+'/'),controller=new AbortController();let progress:NodeReadProgress|undefined,flowing:boolean|null|undefined,readingComplete=false;
 const originalPushes:Buffer[]=[];
 try{
  await observeNodeRead(url,controller.signal,p=>{progress=p;},()=>new Promise<void>((resolve,reject)=>{
   const request=get(url,response=>{
    response.on('readable',()=>{
     if(readingComplete)return;readingComplete=true;flowing=response.readableFlowing;
     const body=response.read();originalPushes.push(body);resolve();
    });
   });request.once('error',reject);
  }));
  assert.equal(flowing,false,'observer must not introduce a data listener');
  assert.equal(Buffer.concat(originalPushes).toString(),'buffered-body','consumer receives unchanged bytes');
  assert.equal(progress?.receivedBodyBytes,Buffer.byteLength('buffered-body'));assert.equal(progress?.tracked,true);assert.equal(progress?.status,200);
 }finally{controller.abort();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
