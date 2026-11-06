import {createHash} from "node:crypto";
import type {BrowserPageControl,BrowserReadNetworkObservation,BrowserRuntime,BrowserSession} from "../../infrastructure/browser/browser-runtime.js";

/** LOCAL_CONSTRUCTION only. A mock's actual observed GET click produces its
 * mock transport receipt. Never wrap a real browser or claim native safety. */
export function fixtureGetSession(session:BrowserSession):BrowserSession {
 let controls:BrowserPageControl[]=[],documentUrl:string|undefined,pendingOrigin:string|undefined;
 const receipts:BrowserReadNetworkObservation[]=[];
 return new Proxy(session,{get(target,key){
  if(key==="observeControls")return async()=>{controls=await target.observeControls?.()??[];return controls;};
  if(key==="click")return async(id:string,options:unknown)=>{
   const control=controls.find(control=>control.id===id);
   if(control?.formMethod==="GET"&&control.formObservation&&documentUrl&&session.metadata.readNetworkBoundary==="INSTALLED")pendingOrigin=new URL(documentUrl).origin;
   return target.click(id,options as Parameters<BrowserSession["click"]>[1]);
  };
  if(key==="snapshot")return async()=>{
   const page=await target.snapshot();documentUrl=page.url;
   if(pendingOrigin){
    const url=new URL(page.url);
    if(url.origin===pendingOrigin&&url.searchParams.size)receipts.push({outcome:"ADMITTED",origin:url.origin,pathname:url.pathname,method:"GET",resourceType:"document",queryKeys:[...url.searchParams.keys()],
     formSubmission:{documentOrigin:pendingOrigin,actionOrigin:url.origin,actionPathname:url.pathname,
      fields:[...url.searchParams].map(([key,value])=>({key,valueSha256:createHash("sha256").update(value).digest("hex"),source:"PAGE"}))}});
    pendingOrigin=undefined;
   }
   return {...page,...(receipts.length?{networkRequests:[...page.networkRequests??[],...receipts]}:{})};
  };
  const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;
 }});
}

export function fixtureGetRuntime(runtime:BrowserRuntime):BrowserRuntime {
 return {...runtime,openSession:async input=>fixtureGetSession(await runtime.openSession(input))};
}
