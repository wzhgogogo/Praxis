import {Worker} from 'node:worker_threads';
import type {BrowserSession,BrowserSessionMetadata} from './browser-runtime.js';
import {BrowserRuntimeError,browserTransportError,type BrowserRuntimeFailureCode} from './browser-runtime-errors.js';
import type {RemoteStart,RemoteMethod,RemoteState,Reply,Recording} from './cloudflare-session-protocol.js';
type Methods=Required<Pick<BrowserSession,RemoteMethod>>;
/** One remote CDP connection per worker. Fatal Playwright assertions never enter the HTTP host. */
export class IsolatedCloudflareSession implements BrowserSession {
 private readonly worker:Worker;private sequence=0;private failure:BrowserRuntimeError|undefined;private state:RemoteState={closed:false,entries:[]};
 private readonly pending=new Map<number,{resolve:(value:unknown)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
 private readonly ready:Promise<void>;private readonly abort:()=>void;metadata!:BrowserSessionMetadata;
 private constructor(config:RemoteStart,private signal:AbortSignal,record?:Recording){
  const source=import.meta.url.endsWith('.ts');
  const bootstrap=`const {workerData}=require('node:worker_threads');(async()=>{if(workerData.source){const {register}=await import(workerData.tsx);register();}await import(workerData.module);})()`;
  this.worker=new Worker(bootstrap,{eval:true,execArgv:[],workerData:{...config,record:!!record,source,module:new URL(source?'./cloudflare-browser-worker.ts':'./cloudflare-browser-worker.js',import.meta.url).href,...(source?{tsx:import.meta.resolve('tsx/esm/api')}:{})}});
  this.ready=new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>this.fail(new BrowserRuntimeError('BROWSER_TIMEOUT','Remote browser initialization timed out')),config.timeoutMs+5000);this.worker.once('error',error=>{clearTimeout(timer);reject(new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','Remote browser worker failed',browserTransportError(error)));});this.worker.once('exit',()=>{clearTimeout(timer);if(!this.metadata)reject(this.failure??new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','Remote browser worker exited'));});
   this.worker.on('message',(message:Reply)=>{
    if(message.kind==='ready'){clearTimeout(timer);this.metadata=message.metadata;resolve();return;}
    if(message.kind==='record'){void Promise.resolve().then(()=>record?.(message.value)).then(()=>this.worker.postMessage({kind:'recorded',id:message.id}),()=>this.worker.postMessage({kind:'recorded',id:message.id,failed:true}));return;}
    this.state=message.state;const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);clearTimeout(pending.timer);if(message.error)pending.reject(new BrowserRuntimeError(message.error.code as BrowserRuntimeFailureCode,message.error.message,message.error.detail));else pending.resolve(message.value);
   });
  });
  this.worker.on('error',error=>this.fail(new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','Remote browser worker failed',browserTransportError(error))));this.worker.on('exit',()=>{if(!this.state.closed)this.fail(new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','Remote browser worker exited'));});
  this.abort=()=>this.fail(new BrowserRuntimeError('BROWSER_ABORTED','Remote browser session aborted'));signal.addEventListener('abort',this.abort,{once:true});if(signal.aborted)this.abort();
 }
 static async open(config:RemoteStart,signal:AbortSignal,record?:Recording){const session=new IsolatedCloudflareSession(config,signal,record);try{await session.ready;return session;}catch(error){await session.close();throw error;}}
 private fail(error:BrowserRuntimeError){if(this.failure)return;this.failure=error;this.state.closed=true;this.signal.removeEventListener('abort',this.abort);for(const request of this.pending.values()){clearTimeout(request.timer);request.reject(error);}this.pending.clear();void this.worker.terminate();}
 private async call<K extends RemoteMethod>(method:K,args:Parameters<Methods[K]>):Promise<Awaited<ReturnType<Methods[K]>>>{if(this.failure)throw this.failure;const id=++this.sequence;const timeout=args.find(arg=>typeof arg==='object'&&arg!==null&&'timeoutMs'in arg) as {timeoutMs?:number}|undefined;return new Promise<Awaited<ReturnType<Methods[K]>>>((resolve,reject)=>{const timer=setTimeout(()=>this.fail(new BrowserRuntimeError('BROWSER_TIMEOUT','Remote browser operation timed out')),(timeout?.timeoutMs??30000)+2000);this.pending.set(id,{resolve:value=>resolve(value as Awaited<ReturnType<Methods[K]>>),reject,timer});this.worker.postMessage({kind:'call',id,method,args});});}
 entryNavigationEvents(){return this.state.entries;}
 settlementDiagnostics(){return this.state.settlement;}
 isClosed(){return this.state.closed;}
 beginReadScope(){void this.call('beginReadScope',[]).catch(error=>this.fail(error as BrowserRuntimeError));}
 async close(){if(!this.state.closed){try{await Promise.race([this.call('close',[]),new Promise<void>(resolve=>{const timer=setTimeout(resolve,1000);timer.unref();})]);}catch{/* damaged worker already retired */}}this.fail(new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','Remote browser session closed'));await this.worker.terminate();}
 navigate(...args:Parameters<Methods['navigate']>){return this.call('navigate',args);}
 prepareNavigation(...args:Parameters<Methods['prepareNavigation']>){return this.call('prepareNavigation',args);}
 prepareObservedNavigation(...args:Parameters<Methods['prepareObservedNavigation']>){return this.call('prepareObservedNavigation',args);}
 snapshot(...args:Parameters<Methods['snapshot']>){return this.call('snapshot',args);}
 flushRecordedResponses(...args:Parameters<Methods['flushRecordedResponses']>){return this.call('flushRecordedResponses',args);}
 captureResponses(...args:Parameters<Methods['captureResponses']>){return this.call('captureResponses',args);}
 observeControls(...args:Parameters<Methods['observeControls']>){return this.call('observeControls',args);}
 click(...args:Parameters<Methods['click']>){return this.call('click',args);}
 openLink(...args:Parameters<Methods['openLink']>){return this.call('openLink',args);}
 fill(...args:Parameters<Methods['fill']>){return this.call('fill',args);}
 select(...args:Parameters<Methods['select']>){return this.call('select',args);}
 setChecked(...args:Parameters<Methods['setChecked']>){return this.call('setChecked',args);}
 press(...args:Parameters<Methods['press']>){return this.call('press',args);}
 pressEscape(...args:Parameters<Methods['pressEscape']>){return this.call('pressEscape',args);}
 scroll(...args:Parameters<Methods['scroll']>){return this.call('scroll',args);}
 dismissTransientObstruction(...args:Parameters<Methods['dismissTransientObstruction']>){return this.call('dismissTransientObstruction',args);}
 waitFor(...args:Parameters<Methods['waitFor']>){return this.call('waitFor',args);}
 waitForSettled(...args:Parameters<Methods['waitForSettled']>){return this.call('waitForSettled',args);}
 screenshot(...args:Parameters<Methods['screenshot']>){return this.call('screenshot',args);}
 screenshotLayoutOnly(...args:Parameters<Methods['screenshotLayoutOnly']>){return this.call('screenshotLayoutOnly',args);}
}
