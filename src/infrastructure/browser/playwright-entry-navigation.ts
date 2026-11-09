import type {CDPSession,Page} from 'playwright-core';
import type {BrowserEntryNavigationEvent} from './browser-runtime.js';
import type {NodeReadProgress} from './playwright-node-read-progress.js';

/** A prepared read-only document may retry once, on its exact URL, only after
 * an observed Node transport received zero body bytes and timed out. */
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
 constructor(private readonly page:Page,private readonly cdp:CDPSession,
  private readonly abortTransports:()=>void,private readonly prepareRetry:(url:string,remainingMs:number)=>void,
  private readonly setAttemptTimeout:(timeoutMs:number)=>void){
  cdp.on('Network.requestWillBeSent',e=>{if(!this.active)return;this.pending.add(e.requestId);if(!['GET','HEAD','OPTIONS'].includes(e.request.method)||e.redirectResponse)this.unsafe=true;});
  const finish=(e:{requestId:string})=>this.pending.delete(e.requestId);
  cdp.on('Network.loadingFinished',finish);cdp.on('Network.loadingFailed',finish);
 }
 documentProgress(url:string,value:NodeReadProgress):void {if(this.active&&url===this.currentUrl){this.document={...value};if((value.status??0)>=400)this.unsafe=true;}}
 documentFailure(url:string,error:unknown):Promise<void>|void {
  if(!this.active||url!==this.currentUrl||!(error instanceof Error)||!/TimeoutError|Timeout .*exceeded|timed out/i.test(error.name+' '+error.message))return;
  this.transportTimeout=true;
  if(!this.unsafe&&this.document?.tracked&&this.document.receivedBodyBytes===0&&!this.document.finished&&this.timedOut){
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
    this.document=undefined;this.transportTimeout=false;const attemptTimeoutMs=Math.min(10_000,remaining());
    if(attemptTimeoutMs<=0)throw new Error('Document entry deadline exhausted');
    this.setAttemptTimeout(attemptTimeoutMs);
    if(attempt===2)this.prepareRetry(url,attemptTimeoutMs);
    record('STARTED',{attemptTimeoutMs});
    this.transportReleased=new Promise(r=>{this.releaseTransport=r;});
    const timeoutSignal=new Promise<{error:unknown}>(r=>{this.timedOut=error=>r({error});});
    const navigation=(attempt===1&&initialAction?initialAction(Math.max(1,remaining())):this.page.goto(url,{waitUntil:options.waitUntil??'domcontentloaded',timeout:Math.max(1,remaining())})).then(()=>({error:undefined}),error=>({error}));
    try{const outcome=await Promise.race([navigation,timeoutSignal]);if(outcome.error)throw outcome.error;record('SUCCEEDED');return;}
    catch(error){
     const timeout=this.transportTimeout||error instanceof Error&&error.name==='TimeoutError';
     const document=this.documentProgressNow();
     const retry=attempt===1&&timeout&&!this.unsafe&&!this.page.isClosed()&&remaining()>0&&document?.tracked===true&&document.receivedBodyBytes===0&&!document.finished;
     record('FAILED');if(!retry)throw error;
     record('ZERO_BYTE_TIMEOUT',{resourceType:'document'});
     // End Node transport AND native navigation before authorizing the second
     // request. Cleanup consumes the same20s total, never a fresh deadline.
     this.abortTransports();let timer:ReturnType<typeof setTimeout>|undefined;
     try{await Promise.race([this.cdp.send('Page.stopLoading'),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Document abort exceeded entry deadline')),Math.max(1,remaining()));})]);}finally{clearTimeout(timer);}
     this.releaseTransport();
     while(this.pending.size&&remaining()>0&&!this.page.isClosed())await new Promise(r=>setTimeout(r,10));
     if(this.pending.size||remaining()<=0||this.page.isClosed()||this.unsafe)throw new Error('Document retry suppressed: original request did not safely terminate');
     await navigation;
     record('ABORTED');attempt=2;
    }
   }
  }finally{this.releaseTransport();this.timedOut=undefined;this.active=false;this.currentUrl='';this.pending.clear();}
 }
}
