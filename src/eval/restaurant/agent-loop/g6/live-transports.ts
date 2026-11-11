import {chromium,type BrowserContext,type Page} from 'playwright-core';
import {LocalPlaywrightChromium} from '../../../../infrastructure/browser/local-playwright-chromium.js';
import {localBrowserProxyFromEnvironment} from '../../../../infrastructure/browser/local-browser-proxy.js';
import {DeepSeekModelGateway} from '../../../../infrastructure/deepseek/deepseek-model-gateway.js';
import {createEvalGooglePlacesClient} from '../runners/google-places-recording.js';
import {observeOutgoingRequest} from './request-observation.js';
import type {G6RunnerDependencies,G6TransportHooks} from './runner.js';

/** Same isolated Chromium/Guard/static transport and local network split for
 * health and Live. CDP observes native responses; route.fetch observes Node I/O.
 * Neither observer can grant Guard admission. */
export function createG6LiveBrowser(environment:NodeJS.ProcessEnv,hooks?:G6TransportHooks){
 let sequence=0;
 return new LocalPlaywrightChromium({...localBrowserProxyFromEnvironment(environment),headless:true,browserType:{async launch(options){
  const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{
   const context=await newContext(options),route=context.route.bind(context),nodeReads=new Map<string,number>();
   const attached=new WeakMap<Page,Promise<void>>();
   const observe=(page:Page)=>{let ready=attached.get(page);if(ready)return ready;
    ready=observeNative(context,page,hooks,()=>++sequence,nodeReads);attached.set(page,ready);return ready;
   };
   context.on('page',page=>{void observe(page).catch(()=>context.close());});
   const newPage=context.newPage.bind(context);context.newPage=async()=>{const page=await newPage();await observe(page);return page;};
   context.route=(pattern,handler,options)=>route(pattern,async(actual,request)=>{
    const wrapped=new Proxy(actual,{get(target,key){
     if(key==='fetch')return async(options:Parameters<typeof actual.fetch>[0])=>{
      const key=request.method()+' '+request.url();nodeReads.set(key,(nodeReads.get(key)??0)+1);hooks?.observeRequest(await observeOutgoingRequest('g6-node:'+String(++sequence),request));
      return target.fetch(options);
     };
     const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
    }});return handler(wrapped,request);
   },options);return context;
  };return browser;
 }}});
}
async function observeNative(context:BrowserContext,page:Page,hooks:G6TransportHooks|undefined,next:()=>number,nodeReads:Map<string,number>){
 const cdp=await context.newCDPSession(page),pending=new Map<string,{key:string;row:Parameters<G6TransportHooks['observeRequest']>[0]}>();
 const finish=(id:string,response:boolean)=>{const r=pending.get(id);if(!r)return;pending.delete(id);
  const count=nodeReads.get(r.key)??0;if(count){if(count===1)nodeReads.delete(r.key);else nodeReads.set(r.key,count-1);}else if(response)hooks?.observeRequest(r.row);
 };
 cdp.on('Network.requestWillBeSent',e=>{
  if(e.redirectResponse)finish(e.requestId,true);
  let u:URL;try{u=new URL(e.request.url);if(!['http:','https:'].includes(u.protocol))return;}catch{return;}
  const h=Object.fromEntries(Object.entries(e.request.headers).map(([k,v])=>[k.toLowerCase(),String(v)]));
  pending.set(e.requestId,{key:e.request.method+' '+e.request.url,row:{ref:'g6-native:'+next(),url:u.origin+u.pathname,method:e.request.method,reachedSource:true,queryKeys:[...u.searchParams.keys()],...(e.request.method==='OPTIONS'?{preflight:{requestOrigin:h.origin??'',method:h['access-control-request-method']??'',headerNames:(h['access-control-request-headers']??'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean),bodyBytes:Buffer.byteLength(e.request.postData??'')}}:{})}});
 });
 cdp.on('Network.responseReceived',e=>finish(e.requestId,true));
 cdp.on('Network.loadingFailed',e=>finish(e.requestId,false));await cdp.send('Network.enable');
}
/** No env loader. Credentials are supplied only by an authorized --env-file. */
export function liveG6Dependencies(environment:NodeJS.ProcessEnv,budgetPath:string):G6RunnerDependencies{
 const apiKey=environment.GOOGLE_MAPS_API_KEY;if(!apiKey)throw Error('GOOGLE_MAPS_API_KEY must be configured on the server');
 const model=DeepSeekModelGateway.fromEnvironment(environment);
 return {budgetPath,witnessFetch:fetch,ownCredentials:[apiKey,environment.DEEPSEEK_API_KEY??''],async transports(_spec,_recording,hooks){
  const google=createEvalGooglePlacesClient({apiKey,timeoutMs:30_000,...(environment.PRAXIS_GOOGLE_API_PROXY_SERVER?{proxyServer:environment.PRAXIS_GOOGLE_API_PROXY_SERVER}:{})},hooks.googleFetch);
  return {model,google,browser:createG6LiveBrowser(environment,hooks),clock:{now:()=>new Date()}};
 }};
}
