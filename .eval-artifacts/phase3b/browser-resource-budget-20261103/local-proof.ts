// Component diagnostic only: three synthetic public-page shapes, no live network/model.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {PlaywrightReadNetworkGuard} from '../../../src/infrastructure/browser/playwright-read-network-guard.js';
import {BrowserReadRecording} from '../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.js';
const output=new URL('./local-proof.json',import.meta.url);
const root=await mkdtemp(join(tmpdir(),'resource-policy-proof-'));
const received:string[]=[];
const content={tabelog:'Same outlet: 2026-11-06, 2 guests, 19:00 available',tablecheck:'Same outlet: menu JPY 8000',merchant:'Same outlet: Credit cards accepted'};
const server=createServer(async(req,res)=>{
 const path=req.url!;received.push(path);
 const kind=path.split('/')[1] as keyof typeof content;
 if(path.endsWith('/')){res.setHeader('content-type','text/html');res.end(`<title>${kind} fixture</title><h1>Same outlet</h1><p id="answer">Loading</p><link rel="stylesheet" href="/${kind}/public.css"><script defer src="/${kind}/public.js"></script>${Array.from({length:20},(_,i)=>`<img src="/${kind}/image-${i}.png">`).join('')}<audio preload="auto" src="/${kind}/sample.wav"></audio>`);return}
 if(path.endsWith('public.js')){res.setHeader('content-type','text/javascript');res.end(`fetch('/${kind}/data').then(r=>r.json()).then(v=>document.getElementById('answer').textContent=v.date?v.text.replace('Same outlet: ','Same outlet: '+v.date+', '):v.text)`);return}
 if(path.endsWith('/data')){res.setHeader('content-type','application/json');res.end(JSON.stringify(kind==='tabelog'?{text:content[kind].replace('2026-11-06, ',''),date:'2026-11-06'}:{text:content[kind]}));return}
 if(path.endsWith('.css')){res.setHeader('content-type','text/css');res.end(`@font-face{font-family:proof;src:url('/${kind}/font.woff')}body{font-family:proof;color:rgb(0,128,0)}`);return}
 await new Promise(r=>setTimeout(r,700));
 if(res.destroyed)return;
 res.setHeader('content-type',path.endsWith('.png')?'image/png':path.endsWith('.woff')?'font/woff':'audio/wav');
 res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jDP0AAAAASUVORK5CYII=','base64'));
});
await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${(server.address() as any).port}`;
const rule={origin,pathnamePrefix:'/',resourceTypes:['script','stylesheet','image','font','media'] as const};
const browser=await chromium.launch({headless:true});const results:any[]=[];
try{
 for(const kind of Object.keys(content) as Array<keyof typeof content>){
  for(const retain of [true,false]){
   const before=received.length;const pageContext=await browser.newContext({serviceWorkers:'block'});const page=await pageContext.newPage();
   const recording=new BrowserReadRecording({directory:root,runId:`${kind}-${retain}`,reviewedStaticResources:[rule]});
   const guard=new PlaywrightReadNetworkGuard({documentOrigins:[origin],genericPublicRead:true,staticResources:[rule],dynamicReads:[],retainedResources:retain?[rule]:[]},5000,r=>recording.recordResponse(r));
   await guard.install(pageContext);await guard.preparePage(pageContext,page);const url=`${origin}/${kind}/`;guard.prepareNavigation(url);
   const start=performance.now();await page.goto(url,{waitUntil:'domcontentloaded',timeout:10000});const dclMs=performance.now()-start;
   await page.waitForFunction(text=>document.getElementById('answer')?.textContent===text,content[kind],{timeout:10000});
   const contentMs=performance.now()-start;
   assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).color),'rgb(0, 128, 0)');
   await page.waitForLoadState('load',{timeout:10000});await page.evaluate(()=>document.fonts.ready);const loadMs=performance.now()-start;
   const requests=guard.snapshotRequests();const blocked=requests.filter(r=>r.resourceTypeDetails?.policyBlock==='NONESSENTIAL_RESOURCE');
   assert.equal(blocked.length>0,!retain);assert.equal(received.slice(before).some(p=>/image-|font\.woff|sample\.wav/.test(p)),retain);
   assert.ok(requests.some(r=>r.outcome==='ADMITTED'&&r.resourceType==='script'));assert.ok(requests.some(r=>r.outcome==='ADMITTED'&&['fetch','xhr'].includes(r.resourceType)));
   recording.recordSnapshot({url,title:kind,html:await page.content(),text:await page.locator('body').innerText(),networkRequests:requests});
   const saved=await recording.finish();const raw=JSON.parse(await readFile(join(saved.path,'recording.json'),'utf8'));
   const markers=raw.entries.filter((e:any)=>e.kind==='NETWORK').flatMap((e:any)=>e.detail).filter((r:any)=>r.resourceTypeDetails?.policyBlock==='NONESSENTIAL_RESOURCE');
   assert.equal(markers.length,blocked.length);assert.equal(saved.pages[0]?.status,'REPLAYABLE',JSON.stringify({pages:saved.pages,entries:raw.entries.filter((e:any)=>e.kind!=='NETWORK')}));
   results.push({kind,retainedOptionalResources:retain,dclMs,contentMs,loadMs,receiverRequests:received.length-before,guardAdmitted:requests.filter(r=>r.outcome==='ADMITTED').length,policyBlocked:blocked.length,recordingMarkers:markers.length,replayable:saved.pages[0]?.status,requiredText:content[kind]});
   await pageContext.close();
  }
 }
 await writeFile(output,JSON.stringify({sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'REAL_CHROMIUM_LOCAL_SYNTHETIC_COMPONENT_DIAGNOSTIC',results},null,2)+'\n');console.log(JSON.stringify(results));
}finally{await browser.close();server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));await rm(root,{recursive:true,force:true})}
