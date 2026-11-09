import type {BrowserRuntime,BrowserSession} from '../../../../infrastructure/browser/browser-runtime.js';
import {discoveryPackNetworkPolicy,restaurantDiscoveryPacks} from '../../../../integrations/restaurant-search/source-packs.js';
import {browserTransportError,type BrowserTransportError} from '../../../../infrastructure/browser/browser-runtime-errors.js';
import {holdoutHash} from '../holdout-protocol.js';
export interface HoldoutHealthObservation {source:'tablecheck'|'tabelog';round:1|2;complete:boolean;elapsedMs:number;phase:'SESSION_OPEN'|'NAVIGATE'|'SCRIPT_WAIT';phaseElapsedMs:number;documentStatus?:number;scriptStatus?:number;navigationError?:BrowserTransportError;status?:number;responseSHA256?:string;}
/** Browser path only: isolated source pages under the unchanged Guard. The
 * 10-second health cutoff is external; product entry/provider limits stay put. */
export async function checkHoldoutNetwork(input:{browser:BrowserRuntime;tabelogDetailUrl:string;beforeGET:(source:string,round:number)=>Promise<void>;now?:()=>number}){
 const now=input.now??(()=>performance.now()),observations:HoldoutHealthObservation[]=[];
 const tc=restaurantDiscoveryPacks.find(p=>p.meta.id==='tablecheck')!.browser!.startupUrl!;
 for(const round of [1,2]as const)for(const source of ['tablecheck','tabelog']as const){
  await input.beforeGET(source,round);const controller=new AbortController();let session:BrowserSession|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  const start=now();let phase:HoldoutHealthObservation['phase']='SESSION_OPEN',phaseStart=start,documentStatus:number|undefined,scriptStatus:number|undefined,navigationError:BrowserTransportError|undefined;
  let resolve!:(v:HoldoutHealthObservation)=>void,done=false;
  const result=new Promise<HoldoutHealthObservation>(r=>{resolve=r;});
  const finish=(complete=false,extra:Partial<HoldoutHealthObservation>={})=>{if(done)return;done=true;resolve({source,round,complete,elapsedMs:now()-start,phase,phaseElapsedMs:now()-phaseStart,
   ...(documentStatus===undefined?{}:{documentStatus}),...(scriptStatus===undefined?{}:{scriptStatus}),...(navigationError?{navigationError}:{}),...extra});};
  const transition=(next:typeof phase)=>{if(phase!==next){phase=next;phaseStart=now();}};
  const matchesScript=(value:string)=>{const u=new URL(value);return source==='tablecheck'?u.hostname==='www.tablecheck.com'&&/^\/portal\/assets\/index-[^/]+\.js$/u.test(u.pathname):u.hostname==='tblg.k-img.com'&&u.pathname.endsWith('/commons.js');};
  timer=setTimeout(()=>{finish();controller.abort();},10_000);
  // Race the entire opening/navigation chain, not only the final script wait.
  // A late opening is retired on arrival and cannot navigate after cancellation.
  const operation=(async()=>{
   const opened=await input.browser.openSession({signal:controller.signal,networkPolicy:discoveryPackNetworkPolicy(),
    onResponseHeaders:r=>{if(done)return;if(r.mainDocument){documentStatus=r.status;if(r.status>=400){finish();controller.abort();}}
     else if(r.resourceType==='script'&&matchesScript(r.url)){scriptStatus=r.status;if(r.status>=400){finish(false,{status:r.status});controller.abort();}}},
    recordResponse:r=>{
     if(done)return;
     if(r.resourceType==='document'){documentStatus=r.status;if(r.status>=400){finish();controller.abort();return;}if(r.status>=200&&r.status<300)transition('SCRIPT_WAIT');}
     if(r.resourceType==='script'&&matchesScript(r.url)){scriptStatus=r.status;finish(r.status>=200&&r.status<300&&r.body.byteLength>0&&now()-start<=10_000,{status:r.status,responseSHA256:holdoutHash(r.body)});}
    }});
   if(controller.signal.aborted||done){await opened.close();return;}session=opened;transition('NAVIGATE');
   const url=source==='tablecheck'?tc:input.tabelogDetailUrl;
   await opened.prepareNavigation!(url,{timeoutMs:20_000});if(done)return;
   // No navigate timeout: this health-only path never activates entry retries.
   await opened.navigate(url,{waitUntil:'domcontentloaded'});if(!done)transition('SCRIPT_WAIT');
  })().catch(error=>{if(done)return;navigationError=browserTransportError(error);finish();});
  void operation;
  try{const observed=await result;observations.push(observed);if(!observed.complete)return {passed:false,observations};}
  finally{clearTimeout(timer);controller.abort();await session?.close();}
 }
 return {passed:true,observations};
}
