import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";
import { createEvalPacingCoordinator } from "../../eval/restaurant/agent-loop/runners/eval-pacing.js";

test("two Chromium runs count20 static resources each but pace only documents",{timeout:20_000},async t=>{
 const hits:Array<{path:string;at:number}>=[];
 const server=createServer((request,response)=>{
  hits.push({path:request.url!,at:Date.now()});
  if(request.url!.endsWith("/doc")){
   response.setHeader("content-type","text/html");
   const prefix=request.url!.replace(/\/doc$/,'');
   const assets=Array.from({length:20},(_,i)=>i%2?`<script src="${prefix}/asset-${i}.js"></script>`:`<link rel="stylesheet" href="${prefix}/asset-${i}.css">`).join('');
   setTimeout(()=>response.end(`<link rel="icon" href="data:,">${assets}<h1>Public fixture</h1>`),100);
  }else{response.setHeader("content-type",request.url!.endsWith('.css')?"text/css":"application/javascript");response.end(request.url!.endsWith('.css')?"h1{color:blue}":"document.documentElement.dataset.loaded='yes';");}
 });
 await new Promise<void>(resolve=>server.listen(0,"127.0.0.1",resolve));
 const origin=`http://127.0.0.1:${(server.address() as {port:number}).port}`,coordinator=await createEvalPacingCoordinator({minimumIntervalMs:40});
 const children=["a","b"].map(id=>{
  const child=fork(fileURLToPath(new URL('./fixtures/pacing-static-child.ts',import.meta.url)),[JSON.stringify(coordinator.endpoint),id,origin],{execArgv:["--import",fileURLToPath(new URL('../../../scripts/test-filesystem-guard.mjs',import.meta.url)),"--import","tsx"],silent:true});
  const messages:any[]=[];const errors:Buffer[]=[];child.on('message',m=>messages.push(m));child.stderr!.on('data',d=>errors.push(d));
  const closed=new Promise<void>(resolve=>child.once('close',()=>resolve()));return {id,child,messages,closed,errors};
 });
 const until=async(check:()=>boolean,reason:string)=>{const deadline=Date.now()+15_000;while(!check()&&Date.now()<deadline)await delay(5);assert.ok(check(),reason+JSON.stringify(children.map(c=>({messages:c.messages,error:Buffer.concat(c.errors).toString()}))));};
 try{
  await until(()=>children.every(c=>c.messages.some(m=>m.stage==='ENTERED')),'two real processes entered');
  for(const c of children)c.child.send('start');
  await until(()=>children.every(c=>c.messages.some(m=>m.stage==='DONE'||m.stage==='ERROR')),'both pages finish');
  for(const c of children){
   const done=c.messages.find(m=>m.stage==='DONE');assert.ok(done,JSON.stringify(c.messages));
   assert.equal(hits.filter(h=>h.path.startsWith('/'+c.id+'/')).length,21);
   assert.deepEqual(Object.keys(done.usage),[origin]);assert.equal(done.usage[origin].requests,21,'all source requests are counted');
   assert.equal(done.leases,1,'static resources must never acquire a pacing lease');
   assert.match(done.text,/Public fixture/);
  }
  const documents=hits.filter(h=>h.path.endsWith('/doc'));assert.equal(documents.length,2);assert.ok(documents[1]!.at-documents[0]!.at>=40);
  assert.equal(coordinator.snapshot().heldLeases,0);
  t.diagnostic(JSON.stringify({documentTimestamps:documents,sourceHits:hits.length,perRun:children.map(c=>c.messages.find(m=>m.stage==='DONE'))}));
 }finally{for(const c of children)c.child.kill('SIGKILL');await Promise.all(children.map(c=>c.closed));await coordinator.close();server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
