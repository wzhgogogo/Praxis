import {NativeFormObserver} from './native-form-observer.js';
import {AsyncLocalStorage} from 'node:async_hooks';
import {createHash} from 'node:crypto';
import {chromium,type BrowserContext,type Page,type Request} from 'playwright-core';

type RecordEvent=(kind:string,detail:unknown)=>void;
interface Scope {record:RecordEvent;remaining?:()=>number|undefined;signal:AbortSignal;id:string;}
const scopes=new AsyncLocalStorage<Scope>();
const decorated=new WeakSet<BrowserContext>();
let sequence=0;
const stamp=()=>({at:new Date().toISOString(),monotonicMs:performance.now()});
const urlFields=(value:string)=>{let url='[INVALID_URL]';try{const u=new URL(value);u.search='';u.hash='';u.username='';u.password='';url=/^https?:$/u.test(u.protocol)?u.toString():'[NON_HTTP]';}catch{}return {url,urlSha256:createHash('sha256').update(value).digest('hex')};};
const hooks=new WeakSet<Function>();

/** Eval-only launch hook. Async scope binds concurrent opens to their own sink;
 * it never changes launch arguments, routing decisions, timeouts or responses. */
export function withRequestTimeline<T>(scope:Omit<Scope,'id'>,open:()=>Promise<T>):Promise<T>{
 if(!hooks.has(chromium.launch)){
  const original=chromium.launch;
  const launch:typeof chromium.launch=async options=>{
   const capture=scopes.getStore(),browser=await original.call(chromium,options);
   if(capture){const create=browser.newContext.bind(browser);browser.newContext=async options=>{const context=await create(options);await attach(context,capture);return context;};}
   return browser;
  };
  hooks.add(launch);chromium.launch=launch;
 }
 return scopes.run({...scope,id:`capture:${++sequence}`},open);
}

async function attach(context:BrowserContext,scope:Scope){
 if(decorated.has(context))return;decorated.add(context);
 // A finalized trace may reject late close events. Diagnostics must never
 // become execution/Guard authority or change the original operation result.
 const emit:RecordEvent=(kind,detail)=>{try{scope.record(kind,detail);}catch{}};let pageSequence=0,navSequence=0,transportSequence=0;
 let contextTimeout=30_000,contextNavigationTimeout:number|undefined;
 const setTimeout=context.setDefaultTimeout.bind(context),setNavigationTimeout=context.setDefaultNavigationTimeout.bind(context);
 context.setDefaultTimeout=ms=>{contextTimeout=ms;setTimeout(ms);};context.setDefaultNavigationTimeout=ms=>{contextNavigationTimeout=ms;setNavigationTimeout(ms);};
 const ready=new WeakMap<Page,Promise<void>>();
 const pageState=new WeakMap<Page,{id:string;active:string|undefined;latest:string|undefined}>();
 const transports=new WeakMap<Request,string>();
 const formObservers=new WeakMap<Page,NativeFormObserver>();
 const nativeFormRequests=new WeakMap<Page,Set<string>>();
 const activeTransports=new Map<string,{base:Record<string,unknown>;start:ReturnType<typeof stamp>}>();
 const cancelTransports=(reason:string)=>{for(const [id,{base,start}]of activeTransports){activeTransports.delete(id);const end=stamp();emit('GUARD_TRANSPORT_END',{...base,startedAt:start.at,endedAt:end.at,elapsedMs:end.monotonicMs-start.monotonicMs,status:null,outcome:'CANCELLED',endReason:reason,endObservation:'LIFECYCLE_CANCELLATION_NOT_WIRE_FINISH'});}};
 const abortTransports=()=>cancelTransports('READ_ABORT_OBSERVED');scope.signal.addEventListener('abort',abortTransports,{once:true});context.once('close',()=>{cancelTransports('CONTEXT_CLOSED');scope.signal.removeEventListener('abort',abortTransports);});
 const requestTransport=(r:Request)=>{let id=transports.get(r);if(!id){id=`${scope.id}:transport:${++transportSequence}`;transports.set(r,id);}return id;};
 // A route.fetch is an independent Node transport leg, not joined to a CDP
 // request by URL/order. This captures when Guard obtains a source response.
 const route=context.route.bind(context);
 context.route=(pattern,handler,options)=>route(pattern,async(actual,request)=>{
  if(request.resourceType()==='document'){
    let page:Page|undefined;try{page=request.frame().page();}catch{}
    const key=urlFields(request.url()).urlSha256;
    if(page&&nativeFormRequests.get(page)?.delete(key)){
      const evidence=await formObservers.get(page)?.capture(page,request.url()).catch(()=>undefined);
      emit('NATIVE_GET_FORM',{pageId:pageState.get(page)?.id??null,...urlFields(request.url()),nativeReason:'formSubmissionGet',...(evidence?{nativeForm:evidence}:{}),...stamp()});
    }
  }
  const wrapped=new Proxy(actual,{get(target,key){
   if(key==='fetch')return async(options:Parameters<typeof actual.fetch>[0])=>{
    const start=stamp(),id=requestTransport(request);let page:Page|undefined;try{page=request.frame().page();}catch{}
    const base={transportId:id,pageId:page?pageState.get(page)?.id:null,navigationId:page?pageState.get(page)?.active??pageState.get(page)?.latest??null:null,navigationAssociation:'CURRENT_PAGE_UNVERIFIED',...urlFields(options?.url??request.url()),method:options?.method??request.method(),resourceType:request.resourceType(),observationPoint:'GUARD_ROUTE_FETCH'};
    activeTransports.set(id,{base,start});
    emit('GUARD_TRANSPORT_START',{...base,...start});
    try{const response=await target.fetch(options),end=stamp(),active=activeTransports.delete(id);emit(active?'GUARD_TRANSPORT_END':'GUARD_TRANSPORT_LATE_END',{...base,startedAt:start.at,endedAt:end.at,startedMonotonicMs:start.monotonicMs,endedMonotonicMs:end.monotonicMs,elapsedMs:end.monotonicMs-start.monotonicMs,status:response.status(),outcome:'RESPONSE_AVAILABLE'});return response;}
    catch(error){const end=stamp(),active=activeTransports.delete(id);emit(active?'GUARD_TRANSPORT_END':'GUARD_TRANSPORT_LATE_END',{...base,startedAt:start.at,endedAt:end.at,elapsedMs:end.monotonicMs-start.monotonicMs,status:null,outcome:scope.signal.aborted?'CANCELLED':'FAILED',errorName:error instanceof Error?error.name:'UnknownError'});throw error;}
   };
   if(key==='continue')return async(...args:Parameters<typeof actual.continue>)=>{let page:Page|undefined;try{page=request.frame().page();}catch{}emit('GUARD_NATIVE_CONTINUE',{transportId:requestTransport(request),pageId:page?pageState.get(page)?.id:null,...urlFields(request.url()),method:request.method(),resourceType:request.resourceType(),observationPoint:'GUARD_ROUTE_CONTINUE',...stamp()});return target.continue(...args);};
   if(key==='abort')return async(...args:Parameters<typeof actual.abort>)=>{emit('GUARD_ROUTE_BLOCK',{transportId:requestTransport(request),...urlFields(request.url()),reason:args[0]??'failed',...stamp()});return target.abort(...args);};
   const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});return handler(wrapped,request);
 },options);
 const observe=async(page:Page)=>{
  const state={id:`${scope.id}:page:${++pageSequence}`,active:undefined as string|undefined,latest:undefined as string|undefined};pageState.set(page,state);
  let pageTimeout:number|undefined,pageNavigationTimeout:number|undefined;
  const setTimeout=page.setDefaultTimeout.bind(page),setNavigationTimeout=page.setDefaultNavigationTimeout.bind(page);
  page.setDefaultTimeout=ms=>{pageTimeout=ms;setTimeout(ms);};page.setDefaultNavigationTimeout=ms=>{pageNavigationTimeout=ms;setNavigationTimeout(ms);};
  const cdp=await context.newCDPSession(page);
  await cdp.send('Page.enable');
  const frame=(await cdp.send('Page.getFrameTree')).frameTree.frame.id;
  const forms=new NativeFormObserver(cdp,frame);formObservers.set(page,forms);
  const observeForms=()=>forms.observe(page).catch(()=>{});
  page.on('domcontentloaded',()=>{void observeForms();});
  cdp.on('Page.frameRequestedNavigation',event=>{
    if(event.frameId!==frame||event.reason!=='formSubmissionGet')return;
    const urls=nativeFormRequests.get(page)??new Set<string>();urls.add(urlFields(event.url).urlSha256);nativeFormRequests.set(page,urls);
  });

  type Row={requestId:string;navigationId:string|null;navigationAssociation:string;loaderId:string;frameId:string|null;url:string;urlSha256:string;method:string;resourceType:string;startedAt:string;startedMonotonicMs:number;status:number|null;blocked:boolean;blockReason:string|null;implicit:boolean;browserStartedAt:string;browserTimestamp:number;redirectedFromRequestId:string|null;};
  const rows=new Map<string,Row>(),loaders=new Map<string,string>();let requestSequence=0;
  const end=(key:string,outcome:string,reason:string|null=null,browserTimestamp?:number)=>{const row=rows.get(key);if(!row)return;rows.delete(key);const at=stamp();emit('NETWORK_REQUEST_END',{...row,pageId:state.id,endedAt:at.at,endedMonotonicMs:at.monotonicMs,elapsedMs:at.monotonicMs-row.startedMonotonicMs,browserEndedAt:browserTimestamp===undefined?null:new Date(Date.parse(row.browserStartedAt)+(browserTimestamp-row.browserTimestamp)*1000).toISOString(),browserElapsedMs:browserTimestamp===undefined?null:(browserTimestamp-row.browserTimestamp)*1000,browserEndTimestamp:browserTimestamp??null,endObservation:browserTimestamp===undefined?'LIFECYCLE_CANCELLATION_NOT_WIRE_FINISH':'CDP_NETWORK_TERMINAL',outcome,endReason:reason});if(row.implicit&&outcome!=='REDIRECT')emit('NAVIGATION_END',{navigationId:row.navigationId,pageId:state.id,endedAt:at.at,elapsedMs:at.monotonicMs-row.startedMonotonicMs,endReason:outcome,observationPoint:'DOCUMENT_NETWORK_ONLY'});};
  const cancelled=()=>{for(const key of [...rows.keys()])end(key,'CANCELLED','READ_ABORT_OBSERVED');};
  scope.signal.addEventListener('abort',cancelled,{once:true});page.once('close',()=>scope.signal.removeEventListener('abort',cancelled));
  cdp.on('Network.requestWillBeSent',event=>{
   const previous=rows.get(event.requestId);
   if(previous&&event.redirectResponse){previous.status=event.redirectResponse.status;end(event.requestId,'REDIRECT',null,event.timestamp);}
   let navigationId=previous?.navigationId??loaders.get(event.loaderId)??state.active??state.latest??null;
   let implicit=previous?.implicit??false;
   if(event.type==='Document'){
    if(!previous&&!state.active){navigationId=`${scope.id}:navigation:${++navSequence}`;implicit=true;emit('NAVIGATION_START',{navigationId,pageId:state.id,...urlFields(event.request.url),remainingReadBudgetMs:scope.remaining?.()??null,configuredTimeoutMs:null,waitUntil:'NOT_REQUESTED',method:'IMPLICIT_DOCUMENT',...stamp()});}
    if(navigationId)loaders.set(event.loaderId,navigationId);state.latest=navigationId??undefined;
   }
   const at=stamp(),row:Row={requestId:`${state.id}:request:${++requestSequence}`,navigationId,navigationAssociation:previous?'REDIRECT_REQUEST_ID':loaders.has(event.loaderId)?'DOCUMENT_LOADER':state.active?'ACTIVE_GOTO':'LAST_PAGE_NAVIGATION_UNVERIFIED',loaderId:event.loaderId,frameId:event.frameId??null,...urlFields(event.request.url),method:event.request.method,resourceType:event.type??'Other',startedAt:at.at,startedMonotonicMs:at.monotonicMs,status:null,blocked:false,blockReason:null,implicit,browserStartedAt:new Date(event.wallTime*1000).toISOString(),browserTimestamp:event.timestamp,redirectedFromRequestId:previous?.requestId??null};rows.set(event.requestId,row);
   emit('NETWORK_REQUEST_START',{...row,pageId:state.id,cdpRequestId:event.requestId,cdpTimestamp:event.timestamp,observationPoint:'BROWSER_CDP'});
   if(scope.signal.aborted)end(event.requestId,'CANCELLED','READ_ABORT_OBSERVED');
  });
  cdp.on('Network.responseReceived',event=>{const row=rows.get(event.requestId);if(row){row.status=event.response.status;emit('NETWORK_RESPONSE_HEADERS',{requestId:row.requestId,navigationId:row.navigationId,status:row.status,corsFacts:(()=>{const headers=Object.fromEntries(Object.entries(event.response.headers??{}).map(([k,v])=>[k.toLowerCase(),String(v)]));let expected='';try{expected=new URL(page.url()).origin;}catch{}const origin=headers['access-control-allow-origin'];return {allowOrigin:origin===undefined?'ABSENT':origin===expected?'EXPECTED_ORIGIN':origin==='*'?'WILDCARD':'OTHER',allowsCredentials:headers['access-control-allow-credentials']==='true'};})(),...stamp(),cdpTimestamp:event.timestamp,browserHeadersAt:new Date(Date.parse(row.browserStartedAt)+(event.timestamp-row.browserTimestamp)*1000).toISOString(),observationPoint:'BROWSER_CDP_NOT_ORIGIN_WIRE'});}});
  cdp.on('Network.loadingFinished',e=>end(e.requestId,'FINISHED',null,e.timestamp));
  cdp.on('Network.loadingFailed',e=>{const row=rows.get(e.requestId);if(row&&e.corsErrorStatus)emit('NETWORK_CORS_ERROR',{requestId:row.requestId,corsError:/^[A-Za-z0-9_]{1,100}$/.test(e.corsErrorStatus.corsError)?e.corsErrorStatus.corsError:'UNRECOGNIZED',...stamp()});if(row){row.blocked=Boolean(e.blockedReason)||/BLOCKED_BY_CLIENT/u.test(e.errorText);row.blockReason=e.blockedReason??(row.blocked?'ERR_BLOCKED_BY_CLIENT':null);}end(e.requestId,e.canceled?'CANCELLED':'FAILED',e.blockedReason??e.errorText,e.timestamp);});
  const close=()=>{for(const key of [...rows.keys()])end(key,'CANCELLED','PAGE_OR_CONTEXT_CLOSED');};page.once('close',close);context.once('close',close);
  const go=page.goto.bind(page);
  page.goto=async(url,options)=>{
   const id=`${scope.id}:navigation:${++navSequence}`,start=stamp();state.active=id;state.latest=id;
   emit('NAVIGATION_START',{navigationId:id,pageId:state.id,...urlFields(url),method:'GOTO',remainingReadBudgetMs:scope.remaining?.()??null,navigationAllowanceMs:options?.timeout??null,configuredTimeoutMs:options?.timeout??pageNavigationTimeout??pageTimeout??contextNavigationTimeout??contextTimeout,timeoutSource:options?.timeout===undefined?'OBSERVED_DEFAULTS_PLAYWRIGHT_30000_BASE':'EXPLICIT',waitUntil:options?.waitUntil??'load',...start});
   let reason='COMPLETED';
   try{const result=await go(url,options);await observeForms();return result;}catch(error){reason=scope.signal.aborted?'CANCELLED':error instanceof Error&&error.name==='TimeoutError'?'TIMEOUT':page.isClosed()?'PAGE_CLOSED':'FAILED';throw error;}
   finally{const at=stamp();emit('NAVIGATION_END',{navigationId:id,pageId:state.id,startedAt:start.at,endedAt:at.at,startedMonotonicMs:start.monotonicMs,endedMonotonicMs:at.monotonicMs,elapsedMs:at.monotonicMs-start.monotonicMs,endReason:reason});if(state.active===id)state.active=undefined;}
  };
  await observeForms();
  await cdp.send('Network.enable');
  emit('REQUEST_TIMELINE_READY',{pageId:state.id,observationPoint:'BROWSER_CDP_AND_GUARD_ROUTE',...stamp()});
 };
 const prepare=(page:Page)=>{let task=ready.get(page);if(!task){task=observe(page);ready.set(page,task);}return task;};
 const create=context.newPage.bind(context);context.newPage=async()=>{const page=await create();await prepare(page);return page;};
 context.on('page',page=>{void prepare(page).catch(error=>emit('REQUEST_TIMELINE_UNAVAILABLE',{errorName:error instanceof Error?error.name:'UnknownError'}));});
 for(const page of context.pages())await prepare(page);
}
