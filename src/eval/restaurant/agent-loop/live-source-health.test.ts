import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {liveSourcePageIssue,runLiveSourceHealth,LIVE_SOURCE_HEALTH_RETRY_MS,LIVE_SOURCE_HEALTH_TIMEOUT_MS} from './live-source-health.js';
import {SourceDataPreflightError} from './source-data-preflight.js';
import {setTimeout as delay} from 'node:timers/promises';
import type {BrowserRuntime} from '../../../infrastructure/browser/browser-runtime.js';

test('health deadline accepts the last completed ready snapshot when the final snapshot is 220ms late',async()=>{
 const html=await readFile(new URL('./fixtures/health-deadline-listing.html',import.meta.url),'utf8');
 const directory=await mkdtemp(join(tmpdir(),'health-deadline-'));
 const calls:Array<{source:string;startedMs:number;finishedMs?:number}>=[];
 const transport=globalThis.fetch;let requests=0;
 globalThis.fetch=async()=>{requests++;throw Error('LOCAL_CONTROL_NETWORK_FORBIDDEN');};
 // F5's local construction: unchanged ready content, 1000ms fixture window,
 // 220ms extra snapshot latency after 800ms. No real source transport.
 const runtime={openSession:async(input:any)=>{
  let url='',started=performance.now();
  return {metadata:{readNetworkBoundary:'INSTALLED'},prepareNavigation:async()=>{},
   navigate:async(target:string)=>{url=target;started=performance.now();input.recordResponse?.({url,status:200,resourceType:'document',method:'GET',body:new Uint8Array()});},
   snapshot:async()=>{
    const elapsed=performance.now()-started,call={source:url,startedMs:elapsed} as typeof calls[number];calls.push(call);
    if(url.includes('tabelog')&&elapsed>=800)await delay(220);
    call.finishedMs=performance.now()-started;
    const content=url.includes('tabelog')?html:'<a href="https://www.tablecheck.com/en/fixture-venue">Fixture venue</a>';
    return {url,title:'Saved listing',text:content.replace(/<[^>]*>/g,' '),html:content};
   },close:async()=>{}};
 }} as unknown as BrowserRuntime;
 try{
  const result=await runLiveSourceHealth({environment:{},artifactDirectory:directory},{runtime,sleep:async()=>{},timeoutMs:1000});
  const artifact=JSON.parse(await readFile(result.artifactPath,'utf8'));
  assert.equal(artifact.classification,'READY','a late final snapshot must not override already observed ready content');
  assert.equal(artifact.attempts.length,1);assert.equal(requests,0);
  assert.ok(calls.some(call=>call.source.includes('tabelog')&&call.startedMs>=800),'the delayed final-snapshot construction was exercised');
  for(const observation of artifact.attempts[0].observations){
   assert.equal(observation.outcome,'HEALTHY');assert.equal(observation.reason,null);
   assert.ok(observation.snapshots.some((snapshot:any)=>snapshot.finishedAt!==null));
   for(const snapshot of observation.snapshots){
    assert.ok(Number.isFinite(Date.parse(snapshot.startedAt)));
    if(snapshot.finishedAt!==null)assert.ok(Date.parse(snapshot.finishedAt)>=Date.parse(snapshot.startedAt));
   }
  }
 }finally{globalThis.fetch=transport;await rm(directory,{recursive:true,force:true});}
});

test('health deadline keeps its hard bound and never infers readiness without a completed ready snapshot',async()=>{
 for(const mode of ['NO_SNAPSHOT','EMPTY_SNAPSHOT']){
  const directory=await mkdtemp(join(tmpdir(),'health-bounded-'));let closed=0;
  const runtime={openSession:async(input:any)=>({metadata:{readNetworkBoundary:'INSTALLED'},
   prepareNavigation:async()=>{},navigate:async(url:string)=>input.recordResponse?.({url,status:200,resourceType:'document'}),
   snapshot:async()=>{if(mode==='NO_SNAPSHOT')await new Promise<void>((_r,reject)=>input.signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));return {url:'https://tabelog.com/en/tokyo/A1301/',html:'<h1>Loading</h1>',text:'Loading',title:'Loading'};},
   close:async()=>{closed++;}})} as unknown as BrowserRuntime;
  try{
   const start=performance.now();
   await assert.rejects(runLiveSourceHealth({environment:{},artifactDirectory:directory},{runtime,timeoutMs:300,sleep:async()=>{}}),SourceDataPreflightError);
   assert.ok(performance.now()-start<2000,'three fixture windows must terminate without extending the deadline');
   assert.equal(closed,6);
   const artifact=JSON.parse(await readFile(join(directory,'source-health.json'),'utf8'));
   for(const attempt of artifact.attempts)for(const observation of attempt.observations){
    assert.equal(observation.outcome,'UNHEALTHY');
    assert.equal(observation.reason,mode==='NO_SNAPSHOT'?'CHECK_TIMEOUT':'RESULT_NOT_OBSERVED');
    assert.ok(observation.snapshots.length>0);
    if(mode==='NO_SNAPSHOT')assert.equal(observation.snapshots[0].finishedAt,null);
   }
  }finally{await rm(directory,{recursive:true,force:true});}
 }
});

test('Live source health checks both sources and waits five minutes before each of at most three attempts',async()=>{
 for(const failedAttempts of [0,1,2,3]){
  const directory=await mkdtemp(join(tmpdir(),'live-source-health-'));let attempt=0,sourceCalls=0,formalRuns=0;const waits:number[]=[];
  try{
   const start=async()=>{const result=await runLiveSourceHealth({environment:{},artifactDirectory:directory},{observe:async check=>{
    if(check.sourceId==='tabelog')attempt++;
    sourceCalls++;return {sourceId:check.sourceId,url:check.url,outcome:attempt<=failedAttempts&&check.sourceId==='tablecheck'?'UNHEALTHY':'HEALTHY',reason:attempt<=failedAttempts&&check.sourceId==='tablecheck'?'BUSY_PAGE':null,httpStatus:200};
   },sleep:async ms=>{waits.push(ms);}});formalRuns++;return result;};
   if(failedAttempts===3)await assert.rejects(start(),e=>e instanceof SourceDataPreflightError&&e.code==='ENV_FAILURE'&&e.sourceIds.join()==='tablecheck');else await start();
   const expected=Math.min(failedAttempts+1,3);assert.equal(sourceCalls,expected*2);assert.deepEqual(waits,Array(expected-1).fill(300_000));assert.equal(formalRuns,failedAttempts===3?0:1);
   const result=JSON.parse(await readFile(join(directory,'source-health.json'),'utf8'));assert.equal(result.modelCalls,0);assert.equal(result.googleRequests,0);assert.equal(result.liveRuns,0);assert.equal(result.formalRunStarted,false);assert.equal(result.attempts.length,expected);
  }finally{await rm(directory,{recursive:true,force:true});}
 }
 assert.equal(LIVE_SOURCE_HEALTH_TIMEOUT_MS,10_000);assert.equal(LIVE_SOURCE_HEALTH_RETRY_MS,300_000);
});

test('Live source health rejects saved busy/challenge/403 pages and does not mistake numeric restaurant copy for an HTTP error',()=>{
 const page={url:'https://www.tablecheck.com/en/japan/search',title:'Search',html:'<h1>Search</h1>',text:'Showing restaurants'};
 assert.equal(liveSourcePageIssue('tablecheck',page,403),'HTTP_403');
 assert.equal(liveSourcePageIssue('tablecheck',{...page,text:'Search is unavailable right now. Please try again.'},200),'BUSY_PAGE');
 assert.equal(liveSourcePageIssue('tablecheck',{...page,text:'Verify you are human'},200),'VERIFICATION_PAGE');
 assert.equal(liveSourcePageIssue('tabelog',{...page,text:'現在アクセスが集中し、ページが表示されにくい状態'},200),'BUSY_PAGE');
 assert.equal(liveSourcePageIssue('tablecheck',{...page,text:'403 restaurants found; room 503'},200),null);
});

test('actual Hybrid Live Runner stops before provider calls or a formal run after three unhealthy source checks',async()=>{
 const {runHybridLiveRead}=await import('./runners/run-hybrid-live-read.js');
 const {dirname}=await import('node:path');
 const keys={PRAXIS_ALLOW_LIVE_RESTAURANT_READ:'1',PRAXIS_ALLOW_BROWSER_RUN:'1',PRAXIS_ALLOW_LIVE_MODEL_EVAL:'1',PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',DEEPSEEK_API_KEY:'FIXTURE_NOT_SENT',GOOGLE_MAPS_API_KEY:'FIXTURE_NOT_SENT'};
 const before=Object.fromEntries(Object.keys(keys).map(k=>[k,process.env[k]])),argv=process.argv,fetch=globalThis.fetch;let external=0,reads=0,artifactPath:string|undefined;const waits:number[]=[];
 try{
  Object.assign(process.env,keys);process.argv=['node','offline-runner-health','--case','h001','--no-proxy'];globalThis.fetch=async()=>{external++;throw Error('No provider/network work is allowed before healthy sources');};
  await assert.rejects(runHybridLiveRead({observe:async check=>{reads++;return {sourceId:check.sourceId,url:check.url,outcome:'UNHEALTHY',reason:'HTTP_403',httpStatus:403};},sleep:async ms=>{waits.push(ms);}}),(e:unknown)=>{if(e instanceof SourceDataPreflightError){artifactPath=e.artifactPath;return e.code==='ENV_FAILURE';}return false;});
  assert.equal(external,0);assert.equal(reads,6);assert.deepEqual(waits,[300_000,300_000]);assert.ok(artifactPath);
  const result=JSON.parse(await readFile(artifactPath,'utf8'));assert.equal(result.formalRunStarted,false);assert.equal(result.liveRuns,0);assert.equal(result.modelCalls,0);assert.equal(result.googleRequests,0);
 }finally{
  globalThis.fetch=fetch;process.argv=argv;
  for(const[k,v]of Object.entries(before)){if(v===undefined)delete process.env[k];else process.env[k]=v;}
  if(artifactPath)await rm(dirname(artifactPath),{recursive:true,force:true});
 }
});
