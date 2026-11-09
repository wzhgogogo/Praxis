import type {CDPSession, Page} from 'playwright-core';
import type {BrowserEntryNavigationEvent} from './browser-runtime.js';

/** Only the first, pre-interaction entry may be replayed. Network ids are CDP ids,
 * never paired with Playwright requests by URL or arrival order. */
export class PlaywrightEntryNavigation {
  readonly events:BrowserEntryNavigationEvent[]=[];
  private used=false;
  private active=false;
  private unsafe=false;
  private interacted=false;
  private readonly eligibleIds=new Set<string>();
  private readonly pending=new Map<string,{eligible:boolean;lastDataAt?:number;status?:number;resourceType?:string}>();
  constructor(private readonly page:Page,private readonly cdp:CDPSession,
    private readonly abortTransports:()=>void,private readonly prepareRetry:(url:string,remainingMs:number)=>void) {
    cdp.on('Network.requestWillBeSent',e=>{
      if(!this.active)return;
      if(!['GET','HEAD','OPTIONS'].includes(e.request.method))this.unsafe=true;
      this.pending.set(e.requestId,{eligible:this.eligibleIds.has(e.requestId)});
      if(e.redirectResponse&&e.redirectResponse.status>=400)this.unsafe=true;
    });
    cdp.on('Network.responseReceived',e=>{
      if(!this.active)return;
      if(e.response.status>=400)this.unsafe=true;
      const current=this.pending.get(e.requestId);
      if(current){current.status=e.response.status;current.lastDataAt=performance.now();current.resourceType=e.type.toLowerCase();}
    });
    cdp.on('Network.dataReceived',e=>{const current=this.pending.get(e.requestId);if(current&&e.dataLength>0)current.lastDataAt=performance.now();});
    const finish=(e:{requestId:string})=>{this.pending.delete(e.requestId);this.eligibleIds.delete(e.requestId);};
    cdp.on('Network.loadingFinished',finish);cdp.on('Network.loadingFailed',finish);
  }
  eligible(id:string):void {if(!this.active)return;this.eligibleIds.add(id);const request=this.pending.get(id);if(request)request.eligible=true;}
  interaction():void {this.interacted=true;this.disallow();}
  disallow():void {if(this.active)this.unsafe=true;}
  responseStatus(status:number):void {if(status>=400)this.disallow();}
  async navigate(url:string,options:{waitUntil?:'domcontentloaded'|'load';timeoutMs?:number}):Promise<void> {
    if(this.used||options.timeoutMs===undefined){this.used=true;return void await this.page.goto(url,{waitUntil:options.waitUntil??'domcontentloaded',...(options.timeoutMs===undefined?{}:{timeout:options.timeoutMs})});}
    this.used=true;
    const started=performance.now(),deadline=started+options.timeoutMs;
    const remaining=()=>Math.max(0,Math.floor(deadline-performance.now()));
    let attempt:1|2=1;
    const record=(event:BrowserEntryNavigationEvent['event'],extra:Partial<BrowserEntryNavigationEvent>={})=>{
      this.events.push({attempt,retryCount:attempt===1?0:1,event,elapsedMs:Math.round(performance.now()-started),...extra});
    };
    this.active=true;this.unsafe=this.interacted;this.pending.clear();this.eligibleIds.clear();
    try{
      for(;;){
        record('STARTED');
        let idleTimer:ReturnType<typeof setInterval>|undefined;
        const idle=new Promise<{kind:'IDLE';idleMs:number;status:number;resourceType:string}>(resolve=>{
          if(attempt!==1)return;
          idleTimer=setInterval(()=>{
            if(this.unsafe||this.page.isClosed()||remaining()<=0)return;
            for(const request of this.pending.values()){
              if(!request.eligible||request.status===undefined||request.status<200||request.status>=300||request.lastDataAt===undefined)continue;
              const idleMs=performance.now()-request.lastDataAt;
              if(idleMs>=5000){resolve({kind:'IDLE',idleMs:Math.floor(idleMs),status:request.status,resourceType:request.resourceType??'unknown'});return;}
            }
          },50);
        });
        const waiter=new AbortController();
        const navigation=this.page.goto(url,{signal:waiter.signal,waitUntil:options.waitUntil??'domcontentloaded',timeout:Math.max(1,remaining())})
          .then(()=>({kind:'DONE' as const}),error=>({kind:'ERROR' as const,error}));
        let outcome:Awaited<typeof navigation>|Awaited<typeof idle>;
        try{outcome=await Promise.race([navigation,idle]);}finally{clearInterval(idleTimer);}
        if(outcome.kind==='DONE'){record('SUCCEEDED');return;}
        if(outcome.kind==='ERROR'){record('FAILED');throw outcome.error;}
        // Recheck after the timer: a concurrent error or action must win over recovery.
        if(this.unsafe||remaining()<=0){const end=await navigation;record(end.kind==='DONE'?'SUCCEEDED':'FAILED');if(end.kind==='ERROR')throw end.error;return;}
        record('IDLE_ABORT',{idleMs:outcome.idleMs,status:outcome.status,resourceType:outcome.resourceType});
        this.abortTransports();
        let abortDeadline:ReturnType<typeof setTimeout>|undefined;
        try{await Promise.race([this.cdp.send('Page.stopLoading'),new Promise<never>((_,reject)=>{
          abortDeadline=setTimeout(()=>reject(new Error('Entry abort exceeded the original deadline')),Math.max(1,remaining()));
        })]);}finally{clearTimeout(abortDeadline);}
        waiter.abort();
        // Stopping a goto waiter alone does not close the old native response.
        // Require protocol terminal events for every old request before replay.
        while(this.pending.size&&remaining()>0&&!this.page.isClosed())await new Promise(r=>setTimeout(r,10));
        if(this.pending.size||remaining()<=0||this.page.isClosed())throw new Error('Entry abort did not settle within the original deadline');
        await navigation;
        record('ABORTED');
        if(this.unsafe)throw new Error('Entry retry suppressed by a concurrent interaction or error response');
        attempt=2;this.prepareRetry(url,remaining());
      }
    }catch(error){if(this.events.at(-1)?.event!=='FAILED')record('FAILED');throw error;}
    finally{this.active=false;this.pending.clear();this.eligibleIds.clear();}
  }
}
