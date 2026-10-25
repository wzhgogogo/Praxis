import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import type {BrowserRuntime,BrowserSnapshot} from '../../../infrastructure/browser/browser-runtime.js';
import {browserRuntimeFromEnvironment} from '../../../infrastructure/browser/browser-runtime-factory.js';
import {restaurantPublicReadNetworkPolicy} from '../../../integrations/restaurant-availability/public-browser-read-network-policy.js';
import {restaurantDiscoveryPacks} from '../../../integrations/restaurant-search/source-packs.js';
import {SOURCE_REACHABILITY_CHECKS,SourceDataPreflightError} from './source-data-preflight.js';

export const LIVE_SOURCE_HEALTH_TIMEOUT_MS=10_000;
export const LIVE_SOURCE_HEALTH_RETRY_MS=300_000;
const checks=SOURCE_REACHABILITY_CHECKS.filter((c):c is Extract<typeof c,{url:string}>=>'url' in c);
type Check=typeof checks[number];
export interface LiveSourceHealthObservation {
 sourceId:string;url:string;outcome:'HEALTHY'|'UNHEALTHY';reason:string|null;httpStatus:number|null;
 finalUrl?:string;readNetworkBoundary?:string;elapsedMs?:number;networkDiagnostics?:BrowserSnapshot['networkDiagnostics'];
 snapshots?:Array<{startedAt:string;finishedAt:string|null}>;
}
interface Dependencies {
 runtime?:BrowserRuntime;
 observe?:(check:Check)=>Promise<LiveSourceHealthObservation>;
 sleep?:(ms:number)=>Promise<void>;
 /** Local Fixture only; actual Runner always uses the fixed ten-second limit. */
 timeoutMs?:number;
}

/** Eval health observation only; never a restaurant availability or qualification fact. */
export function liveSourcePageIssue(sourceId:string,page:BrowserSnapshot,status:number|null):string|null {
 if(status===403)return 'HTTP_403';
 if(status!==null&&status>=400)return 'HTTP_ERROR';
 const pack=restaurantDiscoveryPacks.find(p=>p.meta.id===sourceId)!;
 if(pack.browser!.hasChallenge(page))return 'VERIFICATION_PAGE';
 if(pack.availability?.sourceBusy?.matches(page)||pack.browser!.isPageUnavailable(page)
   ||/Search is unavailable right now|temporarily unavailable|please try again later/i.test(page.text))return 'BUSY_PAGE';
 return null;
}

async function observe(check:Check,runtime:BrowserRuntime,timeoutMs:number):Promise<LiveSourceHealthObservation>{
 const started=Date.now(),controller=new AbortController();let session:Awaited<ReturnType<BrowserRuntime['openSession']>>|undefined;
 let httpStatus:number|null=null,failedStatus:number|null=null;
 let page:BrowserSnapshot|undefined,readyFromPage=false;
 const snapshots:NonNullable<LiveSourceHealthObservation['snapshots']>=[];
 const base={sourceId:check.sourceId,url:check.url};
 const observation=(failure?:string):LiveSourceHealthObservation=>{
  const status=failedStatus??httpStatus;
  const reason=failure??(page?liveSourcePageIssue(check.sourceId,page,status)
   ??(status!==null&&status>=200&&status<300&&readyFromPage?null:'RESULT_NOT_OBSERVED'):'CHECK_TIMEOUT');
  return {...base,outcome:reason?'UNHEALTHY':'HEALTHY',reason,httpStatus:status,
   ...(page?{finalUrl:page.url,networkDiagnostics:page.networkDiagnostics}:{}),
   ...(session?.metadata.readNetworkBoundary?{readNetworkBoundary:session.metadata.readNetworkBoundary}:{}),
   elapsedMs:Date.now()-started,snapshots:structuredClone(snapshots)};
 };
 // The hard deadline settles from completed observations before aborting any
 // in-flight snapshot. A late snapshot cannot turn known ready content into a
 // timeout, and it cannot extend the observation window or overwrite its result.
 let timer:ReturnType<typeof setTimeout>;
 const deadline=new Promise<LiveSourceHealthObservation>(resolve=>{timer=setTimeout(()=>{
  resolve(observation());controller.abort();
 },timeoutMs);});
 try{
  return await Promise.race([(async()=>{
   session=await runtime.openSession({signal:controller.signal,networkPolicy:restaurantPublicReadNetworkPolicy,recordResponse:r=>{
    if(r.resourceType==='document')httpStatus=r.status;
    if(['document','xhr','fetch'].includes(r.resourceType)&&(r.status===403||r.status>=500))failedStatus=r.status;
   }});
   if(controller.signal.aborted){await session.close();throw Error('SOURCE_CHECK_TIMEOUT');}
   if(session.metadata.readNetworkBoundary!=='INSTALLED')throw Error('READ_BOUNDARY_REQUIRED');
   await session.prepareNavigation?.(check.url,{timeoutMs});
   await session.navigate(check.url,{waitUntil:'domcontentloaded',timeoutMs});
   const pack=restaurantDiscoveryPacks.find(p=>p.meta.id===check.sourceId)!;
   while(!controller.signal.aborted){
    const timing={startedAt:new Date().toISOString(),finishedAt:null as string|null};snapshots.push(timing);
    let next:BrowserSnapshot;
    try{next=await session.snapshot();}catch(error){if(!controller.signal.aborted)timing.finishedAt=new Date().toISOString();throw error;}
    if(controller.signal.aborted)throw Error('SOURCE_CHECK_TIMEOUT');
    timing.finishedAt=new Date().toISOString();page=next;
    const reason=liveSourcePageIssue(check.sourceId,page,failedStatus??httpStatus);
    if(reason)return observation(reason);
    // Evaluate every completed snapshot, retaining the full window to detect
    // later busy/challenge/HTTP failures instead of accepting the first card.
    readyFromPage=Boolean(pack.parseListing(page).outlets.length>0||pack.browser!.isExplicitEmptyListing?.(page));
    await delay(Math.min(100,Math.max(1,timeoutMs-(Date.now()-started))),undefined,{signal:controller.signal});
   }
   throw Error('SOURCE_CHECK_TIMEOUT');
  })(),deadline]);
 }catch{
  return observation(controller.signal.aborted?'CHECK_TIMEOUT':'BROWSER_READ_FAILED');
 }finally{clearTimeout(timer!);controller.abort();await session?.close();}
}

/** Three pre-run checks at most, five minutes apart. No model, Google, or formal Live work. */
export async function runLiveSourceHealth(input:{environment:NodeJS.ProcessEnv;artifactDirectory:string},dependencies:Dependencies={}){
 await mkdir(input.artifactDirectory,{recursive:true});
 const attempts=[];const runtime=dependencies.observe?undefined:dependencies.runtime??browserRuntimeFromEnvironment(input.environment);
 for(let attempt=1;attempt<=3;attempt++){
  const startedAt=new Date().toISOString();
  const observations=await Promise.all(checks.map(check=>dependencies.observe?dependencies.observe(check):observe(check,runtime!,dependencies.timeoutMs??LIVE_SOURCE_HEALTH_TIMEOUT_MS)));
  const failed=observations.filter(o=>o.outcome==='UNHEALTHY');
  attempts.push({attempt,startedAt,finishedAt:new Date().toISOString(),observations});
  await writeFile(resolve(input.artifactDirectory,`attempt-${attempt}.json`),JSON.stringify(attempts.at(-1),null,2)+'\n',{flag:'wx'});
  if(!failed.length||attempt===3){
   const artifactPath=resolve(input.artifactDirectory,'source-health.json');
   await writeFile(artifactPath,JSON.stringify({version:'live-source-health@1',classification:failed.length?'ENV_FAILURE':'READY',formalRunStarted:false,modelCalls:0,googleRequests:0,liveRuns:0,retryDelayMs:LIVE_SOURCE_HEALTH_RETRY_MS,attempts},null,2)+'\n',{flag:'wx'});
   if(failed.length)throw new SourceDataPreflightError(failed.map(o=>o.sourceId),artifactPath);
   return {artifactPath,attempts};
  }
  await (dependencies.sleep??delay)(LIVE_SOURCE_HEALTH_RETRY_MS);
 }
 throw Error('Unreachable source-health attempt limit');
}
