import type {CDPSession,Page} from 'playwright-core';
import type {BrowserEntryNavigationEvent} from './browser-runtime.js';
import type {NodeReadProgress} from './playwright-node-read-progress.js';

/** A prepared read-only document may retry once, on its exact URL, only after
 * an observed Node transport received neither headers nor body and timed out,
 * or an eligible successful static response stalled. Both share one retry slot. */
export class PlaywrightEntryNavigation {
 readonly events:BrowserEntryNavigationEvent[]=[];
 private active=false;
 private unsafe=false;
 private currentUrl='';
 private document:NodeReadProgress|undefined;
 private transportTimeout=false;
 private timedOut:((error:unknown)=>void)|undefined;
 private releaseTransport:()=>void=()=>{};
 private transportReleased:Promise<void>=Promise.resolve();
 private readonly pending=new Set<string>();
 private readonly statics=new Map<string,{status?:number;lastDataAt:number}>();
 constructor(private readonly page:Page,private readonly cdp:CDPSession,
  private readonly abortTransports:()=>void,private readonly prepareRetry:(url:string,remainingMs:number)=>void,
  private readonly setAttemptTimeout:(timeoutMs:number)=>void){
  cdp.on('Network.requestWillBeSent',e=>{if(!this.active)return;this.pending.add(e.requestId);if(!['GET','HEAD','OPTIONS'].includes(e.request.method)||e.redirectResponse)this.unsafe=true;});
  cdp.on('Network.responseReceived',e=>{if(this.active&&e.response.status>=400)this.unsafe=true;const r=this.statics.get(e.requestId);if(r){r.status=e.response.status;r.lastDataAt=performance.now();}});
  cdp.on('Network.dataReceived',e=>{const r=this.statics.get(e.requestId);if(r&&e.dataLength>0)r.lastDataAt=performance.now();});
  const finish=(e:{requestId:string})=>{this.pending.delete(e.requestId);this.statics.delete(e.requestId);};
  cdp.on('Network.loadingFinished',finish);cdp.on('Network.loadingFailed',finish);
 }
 eligible(id:string):void {if(this.active){this.statics.set(id,{lastDataAt:performance.now()});}}
 documentProgress(url:string,value:NodeReadProgress):void {if(this.active&&url===this.currentUrl){this.document={...value};if((value.status??0)>=400)this.unsafe=true;}}
 documentFailure(url:string,error:unknown):Promise<void>|void {
  if(!this.active||url!==this.currentUrl||!(error instanceof Error)||!/TimeoutError|Timeout .*exceeded|timed out/i.test(error.name+' '+error.message))return;
  this.transportTimeout=true;
  if(!this.unsafe&&this.document?.tracked&&this.document.status===undefined&&this.document.receivedBodyBytes===0&&!this.document.finished&&this.timedOut){
   // Keep the browser's paused route intact until Page.stopLoading. Failing it
   // first can swap to Chromium's error renderer and detach the CDP boundary.
   this.timedOut(error);return this.transportReleased;
  }
 }
 private documentProgressNow():NodeReadProgress|undefined{return this.document;}
 interaction():void {this.disallow();}
 disallow():void {if(this.active)this.unsafe=true;}
 responseStatus(status:number):void {if(status>=400)this.disallow();}
 async navigate(url:string,options:{waitUntil?:'domcontentloaded'|'load';timeoutMs?:number},initialAction?:(timeoutMs:number)=>Promise<void>):Promise<void>{
  // Health deliberately omits timeoutMs and retains its own10s cancellation.
  if(options.timeoutMs===undefined){await this.page.goto(url,{waitUntil:options.waitUntil??'domcontentloaded'});return;}
  const started=performance.now(),deadline=started+Math.min(20_000,options.timeoutMs);
  const remaining=()=>Math.max(0,Math.floor(deadline-performance.now()));let attempt:1|2=1;
  const record=(event:BrowserEntryNavigationEvent['event'],extra:Partial<BrowserEntryNavigationEvent>={})=>this.events.push({attempt,retryCount:attempt===1?0:1,event,elapsedMs:Math.round(performance.now()-started),
   ...(this.document?{receivedBodyBytes:this.document.receivedBodyBytes,bytesObserved:this.document.tracked,...(this.document.status===undefined?{}:{status:this.document.status})}:{}),...extra});
  this.active=true;this.currentUrl=url;this.unsafe=false;this.pending.clear();
  try{
   for(;;){
    this.document=undefined;this.transportTimeout=false;const attemptTimeoutMs=attempt===1?Math.min(10_000,remaining()):remaining();
    if(attemptTimeoutMs<=0)throw new Error('Document entry deadline exhausted');
    this.setAttemptTimeout(attemptTimeoutMs);
    if(attempt===2)this.prepareRetry(url,remaining());
    record('STARTED',{attemptTimeoutMs});
    this.transportReleased=new Promise(r=>{this.releaseTransport=r;});
    let idleTimer:ReturnType<typeof setInterval>|undefined;let idleAbort=false;
    const idle=new Promise<{error:unknown}>(resolve=>{if(attempt===1)idleTimer=setInterval(()=>{if(this.unsafe)return;for(const r of this.statics.values())if(r.status!==undefined&&r.status>=200&&r.status<300&&performance.now()-r.lastDataAt>=5000){idleAbort=true;resolve({error:Object.assign(new Error('Static response idle'),{name:'TimeoutError'})});return;}},50);});
    const timeoutSignal=new Promise<{error:unknown}>(r=>{this.timedOut=error=>r({error});});
    const waiter=new AbortController();
    const navigation=(attempt===1&&initialAction?initialAction(Math.max(1,remaining())):this.page.goto(url,{signal:waiter.signal,waitUntil:options.waitUntil??'domcontentloaded',timeout:Math.max(1,remaining())})).then(()=>({error:undefined}),error=>({error}));
    try{const outcome=await Promise.race([navigation,timeoutSignal,idle]);if(outcome.error)throw outcome.error;record('SUCCEEDED');return;}
    catch(error){
     const timeout=this.transportTimeout||error instanceof Error&&error.name==='TimeoutError';
     const document=this.documentProgressNow();
     const retry=attempt===1&&timeout&&!this.unsafe&&!this.page.isClosed()&&remaining()>0&&(idleAbort||document?.tracked===true&&document.status===undefined&&document.receivedBodyBytes===0&&!document.finished);
     record('FAILED');if(!retry)throw error;
     record(idleAbort?'IDLE_ABORT':'ZERO_BYTE_TIMEOUT',{resourceType:idleAbort?'static':'document'});
     // End Node transport AND native navigation before authorizing the second
     // request. Cleanup consumes the same20s total, never a fresh deadline.
     this.abortTransports();let timer:ReturnType<typeof setTimeout>|undefined;
     try{await Promise.race([this.cdp.send('Page.stopLoading'),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Document abort exceeded entry deadline')),Math.max(1,remaining()));})]);}finally{clearTimeout(timer);}
     this.releaseTransport();waiter.abort();
     while(this.pending.size&&remaining()>0&&!this.page.isClosed())await new Promise(r=>setTimeout(r,10));
     if(this.pending.size||remaining()<=0||this.page.isClosed()||this.unsafe)throw new Error('Document retry suppressed: original request did not safely terminate');
     await navigation;
     record('ABORTED');this.statics.clear();attempt=2;
    }finally{clearInterval(idleTimer);}
   }
  }finally{this.releaseTransport();this.timedOut=undefined;this.active=false;this.currentUrl='';this.pending.clear();this.statics.clear();}
 }
}
