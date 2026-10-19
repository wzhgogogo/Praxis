import {createServer} from 'node:http';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {LocalPlaywrightChromium} from '../../../src/infrastructure/browser/local-playwright-chromium.js';
const base='.eval-artifacts/p2-1-discovery-20261016/preflight-diagnosis-20261019';
const receiver:any[]=[];
const server=createServer((req,res)=>{
 if(req.url==='/data'){
  receiver.push({method:req.method,at:Date.now()});
  setTimeout(()=>{if(!res.destroyed){res.setHeader('content-type','application/json');res.end('{"results":[{"id":"fixture"}]}');}},6500);
 }else{res.setHeader('content-type','text/html');res.end('<body>loading<script>fetch("/data").then(r=>r.json()).then(()=>document.body.dataset.result="done").catch(()=>document.body.dataset.result="failed")</script>');}
});
await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
const address=server.address();if(!address||typeof address==='string')throw Error('fixture address');
const origin=`http://127.0.0.1:${address.port}`;const results:any[]=[];
try{
 for(const mode of ['preflight-default','explicit-navigation-budget']){
  const captured:any[]=[];const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),12000);
  const start=Date.now();
  const session=await new LocalPlaywrightChromium().openSession({signal:abort.signal,
   networkPolicy:{genericPublicRead:true,documentOrigins:[origin],staticResources:[],
    dynamicReads:[{origin,pathname:'/',methods:['GET'],resourceTypes:['document'],queryKeys:[]},
      {origin,pathname:'/data',methods:['GET'],resourceTypes:['fetch'],queryKeys:[]}]},
   recordResponse:r=>{if(new URL(r.url).pathname==='/data')captured.push({status:r.status,atMs:Date.now()-start,bytes:r.body.byteLength});}});
  try{
   if(mode==='explicit-navigation-budget')await session.prepareNavigation?.(origin,{timeoutMs:10000});
   await session.navigate(origin,{waitUntil:'domcontentloaded',timeoutMs:10000});
   await new Promise(r=>setTimeout(r,7200));
   const snapshot=await session.snapshot();
   const row={mode,captured,networkDiagnostics:snapshot.networkDiagnostics??[],networkRequests:snapshot.networkRequests??[],elapsedMs:Date.now()-start};
   results.push(row);
   if(mode==='preflight-default'){
    assert.equal(captured.length,0);
    assert.ok(row.networkDiagnostics.some(x=>x.pathname==='/data'&&['READ_TIMEOUT','READ_REQUEST_FAILED'].includes(x.code)));
   }else{assert.equal(captured.length,1);assert.equal(captured[0].status,200);}
  }finally{clearTimeout(timer);await session.close();}
 }
 assert.equal(receiver.length,2);assert.ok(receiver.every(x=>x.method==='GET'));
 await writeFile(`${base}/timeout-fixture.json`,JSON.stringify({status:'PASS',mode:'LOCAL_CHROMIUM_FIXTURE_ONLY',
  delayedResponseMs:6500,receiverRequests:receiver.length,results,realWebsiteRequests:0,models:0,google:0,
  scope:'Proves a5s Guard can discard a6.5s response despite20s caller polling; does not establish cause of unrecorded historical failures.'},null,2),{flag:'wx'});
 console.log(JSON.stringify({status:'PASS',results},null,2));
}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
