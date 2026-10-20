// Actual Chromium/Guard boundary; localhost only, no provider/model.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {PlaywrightReadNetworkGuard} from '../../src/infrastructure/browser/playwright-read-network-guard.ts';
import {installTableCheckResponseObserver,sourceTableCheckRows} from './tablecheck-post-review.mjs';
test('passive outer recorder preserves actual Chromium response bytes without changing request or retaining headers',async()=>{
 const directory=mkdtempSync('.eval-artifacts/checkpoint-c-live-20261020/tc-browser-control-');
 const payload=Buffer.from('{"status":"failure","data":null}'),received:Buffer[]=[];
 const server=createServer(async(req,res)=>{if(req.method==='POST'){const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));received.push(Buffer.concat(chunks));res.setHeader('content-type','application/json');res.setHeader('set-cookie','NEVER_PERSIST_THIS_HEADER');res.end(payload);}else{res.setHeader('content-type','text/html');res.end('<h1>Local Fixture</h1>');}});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const address=server.address();assert.ok(address&&typeof address!=='string');const origin=`http://127.0.0.1:${address.port}`;
 const rule={origin,pathname:'/v2/hub/availability_calendar_v2',methods:['POST'] as const,resourceTypes:['fetch'] as const,bodyFields:{locale:'string',start_at:'string',shop_id:'string',num_people:'string'} as const};
 const restore=installTableCheckResponseObserver(PlaywrightReadNetworkGuard,resolve(directory,'tablecheck-source'),Buffer.from(JSON.stringify([rule])),{sourceMatches:url=>new URL(url).origin===origin});
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({serviceWorkers:'block'});const guard=new PlaywrightReadNetworkGuard({documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[rule]},5000);await guard.install(context);
  const page=await context.newPage();await guard.preparePage(context,page);guard.prepareNavigation(origin+'/');await page.goto(origin+'/');
  const body='{ "locale":"en", "start_at":"2026-11-05", "shop_id":"TEST_ONLY", "num_people":"3" }';
  await page.evaluate(async body=>{await fetch('/v2/hub/availability_calendar_v2',{method:'POST',headers:{'content-type':'application/json'},body}).then(r=>r.text());},body);
  const row=sourceTableCheckRows(directory).find(r=>r.method==='POST');assert.ok(row);assert.equal(received.length,1);assert.equal(received[0].toString(),body);assert.deepEqual(readFileSync(row.bodyPath),payload);assert.equal(row.sha256,createHash('sha256').update(payload).digest('hex'));assert.equal(JSON.stringify(row).includes('NEVER_PERSIST_THIS_HEADER'),false);
 }finally{restore();await browser.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));rmSync(directory,{recursive:true});}
});
