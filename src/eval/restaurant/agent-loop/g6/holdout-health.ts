import type {BrowserRuntime,BrowserSession} from '../../../../infrastructure/browser/browser-runtime.js';
import {discoveryPackNetworkPolicy,restaurantDiscoveryPacks} from '../../../../integrations/restaurant-search/source-packs.js';
import {holdoutHash} from '../holdout-protocol.js';
export interface HoldoutHealthObservation {source:'tablecheck'|'tabelog';round:1|2;complete:boolean;elapsedMs:number;status?:number;responseSHA256?:string;}
/** Browser path only: isolated source pages under the unchanged Guard. The
 * 10-second health cutoff is external; product entry/provider limits stay put. */
export async function checkHoldoutNetwork(input:{browser:BrowserRuntime;tabelogDetailUrl:string;beforeGET:(source:string,round:number)=>Promise<void>;now?:()=>number}){
 const now=input.now??(()=>performance.now()),observations:HoldoutHealthObservation[]=[];
 const tc=restaurantDiscoveryPacks.find(p=>p.meta.id==='tablecheck')!.browser!.startupUrl!;
 for(const round of [1,2]as const)for(const source of ['tablecheck','tabelog']as const){
  await input.beforeGET(source,round);const controller=new AbortController();let session:BrowserSession|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  let start=now(),resolve!:(v:HoldoutHealthObservation)=>void;
  const result=new Promise<HoldoutHealthObservation>(r=>{resolve=r;});
  const failed=()=>resolve({source,round,complete:false,elapsedMs:now()-start});
  timer=setTimeout(()=>{controller.abort();failed();},10_000);
  try{
   session=await input.browser.openSession({signal:controller.signal,networkPolicy:discoveryPackNetworkPolicy(),recordResponse:r=>{
    const u=new URL(r.url),match=source==='tablecheck'?u.hostname==='www.tablecheck.com'&&/^\/portal\/assets\/index-[^/]+\.js$/u.test(u.pathname):u.hostname==='tblg.k-img.com'&&u.pathname.endsWith('/commons.js');
    if(r.resourceType==='script'&&match)resolve({source,round,complete:r.status>=200&&r.status<300&&r.body.byteLength>0&&now()-start<=10_000,elapsedMs:now()-start,status:r.status,responseSHA256:holdoutHash(r.body)});
   }});
   const url=source==='tablecheck'?tc:input.tabelogDetailUrl;
   await session.prepareNavigation!(url,{timeoutMs:20_000});
   // Omit goto timeout so the product's optional entry reload is not activated
   // by this health check. The independent 10s abort still bounds the whole read.
   void session.navigate(url,{waitUntil:'domcontentloaded'}).catch(failed);
   const observed=await result;observations.push(observed);if(!observed.complete)return {passed:false,observations};
  }catch{failed();observations.push(await result);return {passed:false,observations};}
  finally{clearTimeout(timer);controller.abort();await session?.close();}
 }
 return {passed:true,observations};
}
