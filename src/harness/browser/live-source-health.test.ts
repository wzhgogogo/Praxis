import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createServer} from 'node:http';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import type {BrowserRuntime} from '../../infrastructure/browser/browser-runtime.js';
import {runLiveSourceHealth,type LiveSourceHealthClock} from '../../eval/restaurant/agent-loop/live-source-health.js';
import {chromium,type Page} from 'playwright-core';
import {SourceDataPreflightError} from '../../eval/restaurant/agent-loop/source-data-preflight.js';

interface FixtureClock extends LiveSourceHealthClock{advance(ms:number):void;}
function fixtureClock():FixtureClock{
 let now=Date.parse('2026-10-26T00:00:00Z'),timer:{at:number;finish:()=>void}|undefined;
 const advance=(ms:number)=>{now+=ms;if(timer&&now>=timer.at){const finish=timer.finish;timer=undefined;finish();}};
 return {
  advance,now:()=>now,
  deadline:(ms,finish)=>{timer={at:now+ms,finish};return()=>{timer=undefined;};},
  sleep:async(ms,signal)=>{advance(ms);signal.throwIfAborted();},
 };
}

test('Live source health uses real Guard and observes a busy error arriving after visible results; 403/challenge never start a Live',async()=>{
 let mode='healthy';const arrivals:string[]=[];let delayedSnapshots=0,visibleBeforeBusy=0;
 const clocks=new Map<string,FixtureClock>();
 const server=createServer((req,res)=>{
  arrivals.push(req.method+' '+req.url);assert.equal(req.method,'GET');res.setHeader('content-type','text/html');
  if(req.url?.startsWith('/en/japan/search')){
   if(mode==='forbidden'){res.writeHead(403);res.end('<h1>Forbidden</h1>');return;}
   if(mode==='challenge'){res.end('<h1>Verify you are human</h1>');return;}
   res.end('<h1>Search</h1><a href="https://www.tablecheck.com/en/fixture-venue">Fixture venue</a>'+(mode==='busy-after-results'?'<script>setTimeout(()=>document.body.append("Search is unavailable right now. Please try again."),300)</script>':''));return;
  }
  res.end('<h1>Search</h1><a class="list-rst__rst-name-target" data-address="1-1 Fixture Street" href="https://tabelog.com/en/tokyo/A1301/A130101/99999999/">Fixture venue</a>');
 });
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const a=server.address();assert.ok(a&&typeof a!=='string');const origin=`http://127.0.0.1:${a.port}`;
 const seenPolicies:string[]=[];
 // Replace only endpoint transport origin with a local receiver; preserve the
 // production policy's exact paths/fields/methods, permanent deny and real Guard.
 const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',async openSession(input){
  let page:Page|undefined;
  const raw=new LocalPlaywrightChromium({browserType:{async launch(options){
   const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
   browser.newContext=async options=>{
    const context=await newContext(options),newPage=context.newPage.bind(context);
    context.newPage=async()=>{
     page=await newPage();
     await page.clock.install({time:new Date('2026-10-26T00:00:00Z')});
     await page.clock.pauseAt(new Date('2026-10-26T01:00:00Z'));
     return page;
    };return context;
   };return browser;
  }}});
  assert.ok(input.networkPolicy?.prohibitedPaths?.some(r=>r.pathSegment==='reserve'));
  const mapRule=(rule:NonNullable<typeof input.networkPolicy>['dynamicReads'][number])=>({...rule,origin,...(rule.corsPreflight?{corsPreflight:{...rule.corsPreflight,requestOrigin:origin}}:{})});
  const policy={...input.networkPolicy!,documentOrigins:[origin],prohibitedPaths:input.networkPolicy!.prohibitedPaths!.map(r=>({...r,hostname:'127.0.0.1'})),staticResources:input.networkPolicy!.staticResources.map(mapRule),dynamicReads:input.networkPolicy!.dynamicReads.map(mapRule)};
  const session=await raw.openSession({...input,networkPolicy:policy});assert.equal(session.metadata.readNetworkBoundary,'INSTALLED');seenPolicies.push(session.metadata.readNetworkBoundary!);
  const close=session.close.bind(session);let closing:Promise<void>|undefined;session.close=()=>closing??=close();
  let sourceUrl='',busyAdvanced=false;const local=(url:string)=>{sourceUrl=url;const u=new URL(url);return origin+u.pathname+u.search;};
  const prepare=session.prepareNavigation!.bind(session),navigate=session.navigate.bind(session),snapshot=session.snapshot.bind(session);
  session.prepareNavigation=(url,options)=>prepare(local(url),options);session.navigate=(url,options)=>navigate(local(url),options);
  session.snapshot=async()=>{
   const clock=clocks.get(sourceUrl.includes('tabelog')?'tabelog':'tablecheck');assert.ok(clock,'every source uses its own injected clock');
   const observed=await snapshot();
   if(mode==='slow-last-snapshot'&&sourceUrl.includes('tabelog')&&clock.now()>=Date.parse('2026-10-26T00:00:00Z')+800){
    // The real read has completed, but its delivery crosses the logical window.
    // Previous complete observations must survive the deadline/abort race.
    delayedSnapshots++;clock.advance(220);await Promise.resolve();
   }
   if(mode==='busy-after-results'&&sourceUrl.includes('tablecheck')&&!busyAdvanced){
    assert.ok(observed.text.includes('Fixture venue'));
    assert.equal(observed.text.includes('Search is unavailable right now'),false,'first real snapshot precedes the busy timer');
    visibleBeforeBusy++;await page!.clock.runFor(300);busyAdvanced=true;
   }
   return {...observed,url:sourceUrl};
  };return session;
 }};
 try{
  for(mode of ['healthy','slow-last-snapshot','busy-after-results','forbidden','challenge']){
   const dir=await mkdtemp(join(tmpdir(),'live-health-fixture-'));const waits:number[]=[];let formalRuns=0;
   try{
    const healthy=['healthy','slow-last-snapshot'].includes(mode);
    // CPU/browser startup cannot consume an observation window. The late-read
    // control explicitly crosses it after earlier real snapshots completed.
    const work=async()=>{await runLiveSourceHealth({environment:{},artifactDirectory:dir},{runtime,timeoutMs:mode==='slow-last-snapshot'?1000:4_000,clock:sourceId=>{const clock=fixtureClock();clocks.set(sourceId,clock);return clock;},sleep:async ms=>{waits.push(ms);}});formalRuns++;};
    if(healthy)await assert.doesNotReject(work,mode);else await assert.rejects(work(),SourceDataPreflightError);
    const result=JSON.parse(await readFile(join(dir,'source-health.json'),'utf8'));assert.equal(formalRuns,healthy?1:0);assert.equal(result.liveRuns,0);assert.equal(result.modelCalls,0);assert.equal(result.googleRequests,0);
    assert.equal(result.classification,healthy?'READY':'ENV_FAILURE');assert.deepEqual(waits,healthy?[]:[300_000,300_000],mode);
    if(!healthy)assert.ok(result.attempts.every((r:any)=>r.observations.find((o:any)=>o.sourceId==='tablecheck').reason===(mode==='forbidden'?'HTTP_403':mode==='challenge'?'VERIFICATION_PAGE':'BUSY_PAGE')));
    for(const attempt of result.attempts)for(const observation of attempt.observations){
     for(const timing of observation.snapshots){assert.ok(Number.isFinite(Date.parse(timing.startedAt)));if(timing.finishedAt!==null)assert.ok(Date.parse(timing.finishedAt)>=Date.parse(timing.startedAt));}
    }
    if(mode==='slow-last-snapshot'){
     assert.ok(delayedSnapshots>0,'real Chromium exercised the late-snapshot control');
     const source=result.attempts[0].observations.find((o:any)=>o.sourceId==='tabelog');
     assert.ok(source.snapshots.some((row:any)=>row.finishedAt!==null),'a completed ready observation preceded the deadline');
     assert.equal(source.snapshots.at(-1).finishedAt,null,'the deadline froze evidence before the late read delivered');
     assert.ok(source.elapsedMs>=1000&&source.elapsedMs<1100,'logical window crossed without waiting for slow wall-clock work');
    }
   }finally{await rm(dir,{recursive:true,force:true});}
  }
  assert.equal(visibleBeforeBusy,3,'every busy attempt first observed real visible results');
  assert.ok(seenPolicies.length>=8);assert.ok(arrivals.every(s=>!s.includes('/reserve')));
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
