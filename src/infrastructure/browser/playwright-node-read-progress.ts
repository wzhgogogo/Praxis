import {AsyncLocalStorage} from 'node:async_hooks';
import {channel} from 'node:diagnostics_channel';
import type {ClientRequest,IncomingMessage} from 'node:http';

export interface NodeReadProgress {tracked:boolean;receivedBodyBytes:number;status?:number;finished:boolean;}
interface Scope {url:URL;signal:AbortSignal;progress:NodeReadProgress;observe:(value:NodeReadProgress)=>void;}
const scopes=new AsyncLocalStorage<Scope>();

// Passive Node HTTP observations: no headers/body values are retained or
// altered. Async scope AND the actual ClientRequest identify one route.fetch;
// CDP request ids are never guessed from URLs or arrival order.
channel('http.client.request.start').subscribe(value=>{
 const scope=scopes.getStore(),request=(value as {request:ClientRequest}).request;
 if(!scope||request.method!=='GET'||request.getHeader('host')!==scope.url.host
  ||![scope.url.pathname+scope.url.search,scope.url.href].includes(request.path))return;
 const publish=()=>scope.observe({...scope.progress});
 scope.progress.tracked=true;publish();
 const abort=()=>request.destroy(Object.assign(new Error('Document transport aborted'),{name:'AbortError'}));
 if(scope.signal.aborted)abort();else scope.signal.addEventListener('abort',abort,{once:true});
 request.once('close',()=>scope.signal.removeEventListener('abort',abort));
 request.once('response',(response:IncomingMessage)=>{
  if(response.statusCode!==undefined)scope.progress.status=response.statusCode;publish();
  response.on('data',(chunk:Buffer)=>{scope.progress.receivedBodyBytes+=chunk.byteLength;publish();});
  response.once('end',()=>{scope.progress.finished=true;publish();});
 });
});

export function observeNodeRead<T>(url:URL,signal:AbortSignal,observe:Scope['observe'],operation:()=>Promise<T>):Promise<T>{
 return scopes.run({url,signal,observe,progress:{tracked:false,receivedBodyBytes:0,finished:false}},operation);
}
