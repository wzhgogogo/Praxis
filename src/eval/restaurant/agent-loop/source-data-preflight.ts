import { observeTableCheckSearchCount } from '../../../integrations/tablecheck/tablecheck-public-query.js';
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
async function readKnownRegion(check: Check, signal: AbortSignal, environment: NodeJS.ProcessEnv): Promise<number> {
  if ('textQuery' in check) return (await GooglePlacesClient.fromEnvironment(environment).textSearch({textQuery:check.textQuery,pageSize:1},signal)).length;
  const pack=restaurantDiscoveryPacks.find(p=>p.meta.id===check.sourceId)!;
  let searchCount:number|undefined;
  const session=await browserRuntimeFromEnvironment(environment).openSession({signal,...(check.sourceId==='tablecheck'?{recordResponse:(response:Parameters<typeof observeTableCheckSearchCount>[0])=>{const count=observeTableCheckSearchCount(response);if(count!==undefined)searchCount=Math.max(searchCount??0,count);}}:{}),networkPolicy:{genericPublicRead:true,documentOrigins:pack.documentOrigins,staticResources:pack.staticResources,dynamicReads:pack.reviewedReads}});
  try {
    if(session.metadata.readNetworkBoundary!=='INSTALLED') throw Error('READ_BOUNDARY_REQUIRED');
    await session.navigate(check.url,{waitUntil:'domcontentloaded',timeoutMs:30_000});
    if(check.sourceId==='tablecheck'){
      const deadline=Date.now()+20_000;
      while(!signal.aborted&&Date.now()<deadline&&!(searchCount!==undefined&&searchCount>0))await new Promise(resolve=>setTimeout(resolve,100));
      if(signal.aborted)throw Error('TIMEOUT');
      return searchCount??0;
    }
    const before=await session.snapshot();
    await session.waitForSettled?.(before,1500);
    const page=await session.snapshot();
    if(pack.browser!.resultBusy(page)||pack.browser!.hasChallenge(page)) return 0;
    return pack.parseListing(page).outlets.length;
  } finally {await session.close();}
}
/** No models; one known-region read per planned source. Never retry or start the run on failure. */
export async function runSourceDataPreflight(input:{sourceIds:readonly string[];environment:NodeJS.ProcessEnv;artifactDirectory:string;timeoutMs?:number},
  dependencies:{read?:(check:Check,signal:AbortSignal)=>Promise<number>}={}) {
  const attempts=[];
  for(const sourceId of [...new Set(input.sourceIds)]) {
    const check=SOURCE_REACHABILITY_CHECKS.find(c=>c.sourceId===sourceId);
    if(!check)throw Error(`UNCONFIGURED_SOURCE_PREFLIGHT: ${sourceId}`);
    const controller=new AbortController(),started=Date.now();let timer:ReturnType<typeof setTimeout>|undefined;
    let count:number|undefined,reason:string|undefined;
    try {
      count=await Promise.race([dependencies.read?dependencies.read(check,controller.signal):readKnownRegion(check,controller.signal,input.environment),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('TIMEOUT'));},input.timeoutMs??35_000);})]);
      if(!Number.isSafeInteger(count)||count<=0)reason='EMPTY_RESULT';
    }catch(error){reason=controller.signal.aborted?'TIMEOUT':'READ_FAILED';}
    finally{if(timer)clearTimeout(timer);controller.abort();}
    attempts.push({sourceId,check,count:count??null,elapsedMs:Date.now()-started,outcome:reason?'FAILED':'NONEMPTY',reason:reason??null});
  }
  const failed=attempts.filter(a=>a.outcome==='FAILED').map(a=>a.sourceId);
  const artifactPath=resolve(input.artifactDirectory,'source-data-preflight.json');
  await writeFile(artifactPath,JSON.stringify({version:'source-data-preflight@1',classification:failed.length?'ENV_FAILURE':'READY',generationModelCalls:0,googleRequests:attempts.some(a=>a.sourceId==='google-places')?1:0,attempts},null,2),{flag:'wx'});
  if(failed.length)throw new SourceDataPreflightError(failed,artifactPath);
  return {artifactPath,attempts};
}
