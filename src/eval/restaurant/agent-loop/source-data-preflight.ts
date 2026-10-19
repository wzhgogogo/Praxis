import { observeTableCheckSearchCount, TABLECHECK_PUBLIC_SEARCH_ORIGIN } from '../../../integrations/tablecheck/tablecheck-public-query.js';
import type { BrowserSnapshot } from '../../../infrastructure/browser/browser-runtime.js';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserRuntimeFromEnvironment } from '../../../infrastructure/browser/browser-runtime-factory.js';
import { GooglePlacesClient } from '../../../integrations/google/google-places-client.js';
import { restaurantDiscoveryPacks } from '../../../integrations/restaurant-search/source-packs.js';

/** Eval-owned, frozen known-region controls; never user discovery or eligibility inputs. */
export const SOURCE_REACHABILITY_CHECKS = [
  {sourceId:'tabelog',url:'https://tabelog.com/en/tokyo/A1301/rstLst/'},
  {sourceId:'tablecheck',url:'https://www.tablecheck.com/en/japan/search?service_mode=dining&sort_by=relevance&venue_type=tc&geo_latitude=35.67123&geo_longitude=139.765&geo_distance=1km&auto_geolocate=false&search_text=Ginza'},
  {sourceId:'google-places',textQuery:'restaurants near Ginza, Tokyo'},
] as const;
type Check = typeof SOURCE_REACHABILITY_CHECKS[number];
export class SourceDataPreflightError extends Error {
  readonly code='ENV_FAILURE';
  constructor(readonly sourceIds: string[], readonly artifactPath: string) {super(`ENV_FAILURE: source data unavailable: ${sourceIds.join(', ')}`);}
}
export function preflightSourceIds(goal: string | undefined): string[] {
  return restaurantDiscoveryPacks.filter(p=>p.meta.capabilities.includes('DISCOVERY') && (goal!=='RECOMMENDATION'||!p.meta.reservationOnly)).map(p=>p.meta.id);
}
export interface SourceDataObservation {
  count: number | null;
  responseStatus: number | null;
  reason: 'EMPTY_RESULT' | 'NO_RESPONSE' | null;
  detail?: string;
  networkDiagnostics?: BrowserSnapshot['networkDiagnostics'];
}
async function readKnownRegion(check: Check, signal: AbortSignal, environment: NodeJS.ProcessEnv): Promise<SourceDataObservation> {
  if ('textQuery' in check) {
    const count=(await GooglePlacesClient.fromEnvironment(environment).textSearch({textQuery:check.textQuery,pageSize:1},signal)).length;
    return {count,responseStatus:null,reason:count>0?null:'EMPTY_RESULT'};
  }
  const pack=restaurantDiscoveryPacks.find(p=>p.meta.id===check.sourceId)!;
  let count:number|undefined, responseStatus:number|null=null, detail:string|undefined;
  let networkDiagnostics:BrowserSnapshot['networkDiagnostics'];
  const session=await browserRuntimeFromEnvironment(environment).openSession({signal,recordResponse:response=>{
    const url=new URL(response.url);
    if(check.sourceId==='tablecheck'){
      if(url.origin!==TABLECHECK_PUBLIC_SEARCH_ORIGIN||url.pathname!=='/search/'||response.method!=='GET')return;
      const observed=observeTableCheckSearchCount(response);
      if(observed!==undefined){count=Math.max(count??0,observed);responseStatus=response.status;}
      else if(count===undefined)responseStatus=response.status;
    }else if(response.resourceType==='document')responseStatus=response.status;
  },networkPolicy:{genericPublicRead:true,documentOrigins:pack.documentOrigins,staticResources:pack.staticResources,dynamicReads:pack.reviewedReads}});
  try {
    if(session.metadata.readNetworkBoundary!=='INSTALLED') throw Error('READ_BOUNDARY_REQUIRED');
    // Same first-batch navigation/request budget as NativeRestaurantSearch.
    // page.goto alone does not update the Guard's per-request deadline.
    const navigation={timeoutMs:35_000};
    await session.prepareNavigation?.(check.url,navigation);
    await session.navigate(check.url,{waitUntil:'domcontentloaded',...navigation});
    if(check.sourceId==='tablecheck'){
      const deadline=Date.now()+20_000;
      while(!signal.aborted&&Date.now()<deadline&&!(count!==undefined&&count>0))await new Promise(resolve=>setTimeout(resolve,100));
      if(signal.aborted)detail='TIMEOUT';
    }else{
      const before=await session.snapshot();
      await session.waitForSettled?.(before,1500);
      const page=await session.snapshot();
      if(pack.browser!.resultBusy(page)||pack.browser!.hasChallenge(page))detail='RESULT_UNOBSERVED';
      else if(responseStatus!==null&&responseStatus>=200&&responseStatus<300)count=pack.parseListing(page).outlets.length;
    }
  }catch{detail=signal.aborted?'TIMEOUT':'BROWSER_READ_FAILED';}
  finally{
    if(!(count!==undefined&&count>0)){
      try{networkDiagnostics=(await session.snapshot()).networkDiagnostics;}catch{}
    }
    await session.close();
  }
  if(count!==undefined)return {count,responseStatus,reason:count>0?null:'EMPTY_RESULT',networkDiagnostics};
  return {count:null,responseStatus,reason:'NO_RESPONSE',detail:detail??
    (networkDiagnostics?.some(d=>d.code==='READ_TIMEOUT')?'TIMEOUT':responseStatus!==null&&responseStatus!==200?'HTTP_STATUS':'NO_VALID_SEARCH_RESPONSE'),networkDiagnostics};
}
/** No models; one known-region read per planned source. Never retry or start the run on failure. */
export async function runSourceDataPreflight(input:{sourceIds:readonly string[];environment:NodeJS.ProcessEnv;artifactDirectory:string;timeoutMs?:number},
  dependencies:{read?:(check:Check,signal:AbortSignal)=>Promise<SourceDataObservation>}={}) {
  const attempts=[];
  for(const sourceId of [...new Set(input.sourceIds)]) {
    const check=SOURCE_REACHABILITY_CHECKS.find(c=>c.sourceId===sourceId);
    if(!check)throw Error(`UNCONFIGURED_SOURCE_PREFLIGHT: ${sourceId}`);
    const controller=new AbortController(),started=Date.now();let timer:ReturnType<typeof setTimeout>|undefined;
    let observed:SourceDataObservation;
    try {
      observed=await Promise.race([dependencies.read?dependencies.read(check,controller.signal):readKnownRegion(check,controller.signal,input.environment),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('TIMEOUT'));},input.timeoutMs??35_000);})]);
    }catch{observed={count:null,responseStatus:null,reason:'NO_RESPONSE',detail:controller.signal.aborted?'TIMEOUT':'READ_FAILED'};}
    finally{if(timer)clearTimeout(timer);controller.abort();}
    const countsTowardStop=observed.reason!==null&&(observed.responseStatus!==null||observed.detail==='TIMEOUT');
    attempts.push({sourceId,check,...observed,elapsedMs:Date.now()-started,outcome:observed.reason?'FAILED':'NONEMPTY',countsTowardStop});
  }
  const failed=attempts.filter(a=>a.outcome==='FAILED').map(a=>a.sourceId);
  const artifactPath=resolve(input.artifactDirectory,'source-data-preflight.json');
  await writeFile(artifactPath,JSON.stringify({version:'source-data-preflight@2',classification:failed.length?'ENV_FAILURE':'READY',generationModelCalls:0,googleRequests:attempts.some(a=>a.sourceId==='google-places')?1:0,attempts},null,2),{flag:'wx'});
  if(failed.length)throw new SourceDataPreflightError(failed,artifactPath);
  return {artifactPath,attempts};
}
