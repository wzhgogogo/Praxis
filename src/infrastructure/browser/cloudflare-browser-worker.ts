import {parentPort,workerData} from 'node:worker_threads';
import {chromium} from 'playwright-core';
import {CloudflareBrowserSession,connectRemoteBrowser} from './cloudflare-browser-session.js';
import {remoteMethods,type RemoteStart,type Call,type Recording} from './cloudflare-session-protocol.js';
import {browserTransportError} from './browser-runtime-errors.js';
const port=parentPort!;const config=workerData as RemoteStart;
let sequence=0;const records=new Map<number,{resolve:()=>void;reject:(error:Error)=>void}>();
const record:Recording=value=>new Promise<void>((resolve,reject)=>{const id=++sequence;records.set(id,{resolve,reject});port.postMessage({kind:'record',id,value});});
let queue=Promise.resolve();
port.on('message',(message:Call|{kind:'recorded';id:number;failed?:boolean})=>{
 if(message.kind==='recorded'){const pending=records.get(message.id);records.delete(message.id);if(message.failed)pending?.reject(Error('Recording callback failed'));else pending?.resolve();return;}
 if(message.kind!=='call'||!remoteMethods.includes(message.method))return;
 queue=queue.then(async()=>{try{const method=session[message.method] as (...args:unknown[])=>unknown;const value=await Reflect.apply(method,session,message.args);port.postMessage({kind:'reply',id:message.id,value,state:state()});}catch(error){port.postMessage({kind:'reply',id:message.id,error:{code:error&&typeof error==='object'&&'code'in error?String(error.code):'BROWSER_RUNTIME_FAILED',message:'Remote browser operation failed',detail:browserTransportError(error)},state:state()});}});
});
// Default worker uncaught-exception behavior is intentional: malformed protocol kills only this worker.
const browser=await connectRemoteBrowser(config.endpoint,{headers:{Authorization:'Bearer '+config.apiToken},timeout:config.timeoutMs});
const session=await CloudflareBrowserSession.create(browser,config.engine,config.networkPolicy,config.record?record:undefined);
const state=()=>({closed:session.isClosed(),entries:session.entryNavigationEvents(),...(session.settlementDiagnostics()?{settlement:session.settlementDiagnostics()}:{} )});
port.postMessage({kind:'ready',metadata:session.metadata});
