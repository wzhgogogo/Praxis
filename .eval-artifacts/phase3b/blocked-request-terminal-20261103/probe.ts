// Offline component diagnosis. No source network/model/env access. Run sequentially, no gates in parallel.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {PlaywrightReadNetworkGuard as BranchGuard} from '../../../src/infrastructure/browser/playwright-read-network-guard.js';
const root=new URL('./',import.meta.url),freeze=JSON.parse(await readFile(new URL('./freeze.json',root),'utf8'));
const hash=(s:string|Buffer)=>createHash('sha256').update(s).digest('hex');
for(const [file,expected] of Object.entries(freeze.inputs))assert.equal(hash(await readFile(file)),expected,`INPUT_CHANGED:${file}`);
const mainSource=execFileSync('git',['show',`${freeze.mainRevision}:src/infrastructure/browser/playwright-read-network-guard.ts`],{encoding:'utf8'});
assert.equal(hash(mainSource),freeze.mainGuardSha256);
const temp=await mkdtemp(join(tmpdir(),'guard-terminal-'));
await writeFile(join(temp,'package.json'),'{"type":"module"}');
// Import relocation only, raw main bytes verified above. No duplicated old implementation kept in repository.
await writeFile(join(temp,'main-guard.ts'),mainSource.replace('from "./browser-read-policy.js"',`from ${JSON.stringify(pathToFileURL(resolve('src/infrastructure/browser/browser-read-policy.ts')).href)}`));
const MainGuard=(await import(pathToFileURL(join(temp,'main-guard.ts')).href)).PlaywrightReadNetworkGuard;
let other='';let receivers:any[]=[];
const serve=(foreign:boolean)=>(req:any,res:any)=>{
 const path=new URL(req.url,'http://fixture').pathname;receivers.push({server:foreign?'B':'A',path,atMs:performance.now()});
 if(path.endsWith('/page')){
  const script=path.startsWith('/native/')?'/native-start.js':path.startsWith('/direct/')?'/direct-start.js':`${other}/third-party.js`;
  res.setHeader('content-type','text/html');res.end(`<head><link rel="icon" href="data:,"><script src="${script}"></script><link rel="stylesheet" href="/required.css"><script src="/required.js"></script></head><body><h1>Essential content</h1>${Array.from({length:path.startsWith('/burst/')?38:4},(_,i)=>`<img src="/image-${i}.png">`).join('')}<script>const x=new XMLHttpRequest();x.onload=()=>{document.body.dataset.data=JSON.parse(x.responseText).value};x.open('GET','/data');x.send()</script></body>`);return;
 }
 if(path==='/direct-start.js'){res.writeHead(302,{location:other+'/third-party.js'});res.end();return}
 if(path==='/native-start.js'){res.writeHead(302,{location:'/native-middle.js'});res.end();return}
 if(path==='/native-middle.js'){res.writeHead(302,{location:other+'/third-party.js'});res.end();return}
 if(path.endsWith('.js')){setTimeout(()=>{res.setHeader('content-type','text/javascript');res.end('document.documentElement.dataset.required="READY";')},30);return}
 if(path==='/required.css'){res.setHeader('content-type','text/css');res.end('h1{color:rgb(0,128,0)}');return}
 if(path==='/data'){res.setHeader('content-type','application/json');res.end('{"value":"READY"}');return}
 if(path.endsWith('.png')){setTimeout(()=>{res.setHeader('content-type','image/png');res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jDP0AAAAASUVORK5CYII=','base64'))},60);return}
 res.writeHead(404);res.end();
};
const a=createServer(serve(false)),b=createServer(serve(true));
for(const server of [a,b])await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${(a.address() as any).port}`;other=`http://127.0.0.1:${(b.address() as any).port}`;
const browser=await chromium.launch({headless:true});const rows:any[]=[];const failures:string[]=[];
async function run(mode:'control'|'main'|'branch',path:string,isolatedRoute=false,dropFail=false,repeat=0){
 receivers=[];
 const context=await browser.newContext({serviceWorkers:'block'});await context.grantPermissions(['local-network-access'],{origin});
 const pw:any[]=[],cdp:any[]=[],pauses:any[]=[],commands:any[]=[],routeActions:any[]=[];
 const pwMap=new Map<any,any>(),network=new Map<string,any>();let sessions=0;
 const start=performance.now();const now=()=>performance.now()-start;
 context.on('request',r=>{const row={id:pw.length+1,url:r.url(),type:r.resourceType(),startMs:now(),endMs:null as number|null,status:null as number|null,error:null as string|null};pw.push(row);pwMap.set(r,row)});
 context.on('requestfinished',r=>{const row=pwMap.get(r);if(row){row.endMs=now();row.outcome='FINISHED'}});
 context.on('requestfailed',r=>{const row=pwMap.get(r);if(row){row.endMs=now();row.outcome='FAILED';row.error=r.failure()?.errorText}});
 context.on('response',r=>{const row=pwMap.get(r.request());if(row)row.status=r.status()});
 const route=context.route.bind(context);context.route=async(pattern:any,handler:any)=>route(pattern,async raw=>handler(new Proxy(raw,{get(target,key){
  const member=Reflect.get(target,key);if(['abort','continue','fulfill','fallback'].includes(String(key)))return async(...args:any[])=>{const row={method:String(key),url:target.request().url(),startMs:now(),argument:typeof args[0]==='string'?args[0]:null,endMs:null as number|null};routeActions.push(row);try{return await member.apply(target,args)}finally{row.endMs=now()}};
  return typeof member==='function'?member.bind(target):member;
 }})));
 const open=context.newCDPSession.bind(context);context.newCDPSession=async(...args:any[])=>{
  const s=await open(...args as [any]),session=++sessions;
  s.on('Network.requestWillBeSent',e=>{const key=`${session}:${e.requestId}`;const old=network.get(key);if(old&&old.endMs===null&&e.redirectResponse){old.endMs=now();old.outcome='REDIRECT';old.status=e.redirectResponse.status;old.protocolEnd=e.timestamp}
   const row={key,url:e.request.url,type:e.type,startMs:now(),protocolStart:e.timestamp,endMs:null as number|null,protocolEnd:null as number|null,status:null as number|null,outcome:'PENDING',error:null as string|null};cdp.push(row);network.set(key,row)});
  s.on('Network.responseReceived',e=>{const row=network.get(`${session}:${e.requestId}`);if(row){row.status=e.response.status;row.responseHeadersMs=now()}});
  s.on('Network.loadingFinished',e=>{const row=network.get(`${session}:${e.requestId}`);if(row){row.endMs=now();row.protocolEnd=e.timestamp;row.outcome='FINISHED'}});
  s.on('Network.loadingFailed',e=>{const row=network.get(`${session}:${e.requestId}`);if(row){row.endMs=now();row.protocolEnd=e.timestamp;row.outcome='FAILED';row.error=e.errorText;row.blockedReason=e.blockedReason??null}});
  s.on('Fetch.requestPaused',e=>pauses.push({session,id:e.requestId,url:e.request.url,type:e.resourceType,networkId:e.networkId??null,redirectedRequestId:e.redirectedRequestId??null,responseStatus:e.responseStatusCode??null,atMs:now()}));
  const send=s.send.bind(s);s.send=async(method:any,params:any)=>{
   const row={session,method,id:params?.requestId??null,atMs:now(),doneMs:null as number|null,error:null as string|null,errorReason:params?.errorReason??null,interceptResponse:params?.interceptResponse??null,dropped:false};commands.push(row);
   if(isolatedRoute&&method==='Fetch.enable'){row.dropped=true;row.doneMs=now();return {} as any}
   if(dropFail&&method==='Fetch.failRequest'){row.dropped=true;row.doneMs=now();return {} as any}
   try{return await send(method,params)}catch(e){row.error=String(e);throw e}finally{row.doneMs=now()}
  };return s;
 };
 const page=await context.newPage();let guard:any;
 if(mode!=='control'){
  const C=mode==='main'?MainGuard:BranchGuard;guard=new C({documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]});
  await guard.install(context);await guard.preparePage(context,page);guard.prepareNavigation(origin+path);
 }else{const c=await context.newCDPSession(page);await c.send('Network.enable')}
 let dclMs:number|null=null,loadMs:number|null=null,error:string|null=null;
 page.once('domcontentloaded',()=>{dclMs=now()});page.once('load',()=>{loadMs=now()});
 const navStartMs=now();try{await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:2000});await page.waitForLoadState('load',{timeout:2000});await page.waitForFunction(()=>document.body?.dataset.data==='READY',undefined,{timeout:2000})}catch(e){error=e instanceof Error?e.message:String(e)}
 await page.waitForTimeout(100);
 const snapshotAtMs=now();const evidence=error?null:await page.locator('h1').innerText();
 const required=error?false:await page.evaluate(()=>document.documentElement.dataset.required==='READY'&&document.body.dataset.data==='READY'&&getComputedStyle(document.querySelector('h1')!).color==='rgb(0, 128, 0)');
 const blocked=guard?.snapshotRequests().filter((r:any)=>['BLOCKED','REDIRECT_BLOCKED'].includes(r.outcome))??[];
 const unanswered=pauses.filter(p=>!commands.some(c=>c.session===p.session&&c.id===p.id&&c.atMs>=p.atMs&&['Fetch.failRequest','Fetch.continueRequest','Fetch.continueResponse','Fetch.fulfillRequest'].includes(c.method)&&!c.dropped&&c.doneMs!==null&&c.error===null));
 const filter=(r:any)=>r.url.startsWith(origin)||r.url.startsWith(other);
 const pendingCdp=cdp.filter(r=>filter(r)&&r.endMs===null),pendingPw=pw.filter(r=>filter(r)&&r.endMs===null);
 const row={mode,path,isolatedRoute,dropFail,repeat,navStartMs,dclMs,loadMs,dclElapsedMs:dclMs===null?null:dclMs-navStartMs,loadElapsedMs:loadMs===null?null:loadMs-navStartMs,snapshotAtMs,error,evidence,required,receivers:[...receivers].map(r=>({...r,atMs:r.atMs-start})),blocked,unanswered,pendingCdp,pendingPw,pw,cdp,pauses,commands,routeActions};
 rows.push(row);await context.close();
 if(dropFail){if(!error||dclMs!==null||unanswered.length===0||pendingCdp.length===0)failures.push('HANG_ORACLE_DID_NOT_DETECT_DROPPED_FAIL');}
 else{
  if(error||!required||evidence!=='Essential content'||unanswered.length||pendingCdp.length||pendingPw.length)failures.push(`${mode}:${path}:${isolatedRoute}:REQUEST_NOT_TERMINAL_OR_CONTENT_MISSING`);
  if((row.dclElapsedMs??Infinity)>=1000||(row.loadElapsedMs??Infinity)>=1500)failures.push(`${mode}:${path}:SLOW_LOCAL_COMPLETION`);
  if(mode!=='control'&&row.receivers.some(r=>r.server==='B'))failures.push(`${mode}:DENIED_ORIGIN_REACHED_RECEIVER`);
  if(mode==='control'&&!row.receivers.some(r=>r.server==='B'))failures.push('CONTROL_CANNOT_REACH_OTHER_ORIGIN');
  for(const r of cdp.filter(r=>r.outcome==='FAILED'&&filter(r)))if(r.protocolEnd!==null&&(r.protocolEnd-r.protocolStart)*1000>=1000)failures.push(`${mode}:DENIAL_NOT_PROMPT:${r.url}`);
 }
 console.log(JSON.stringify({mode,path,isolatedRoute,dropFail,repeat,dclElapsedMs:row.dclElapsedMs,loadElapsedMs:row.loadElapsedMs,pendingCdp:pendingCdp.length,pendingPw:pendingPw.length,unanswered:unanswered.length,blocked:blocked.length,error:error?.split('\n')[0]??null}));
}
try{
 for(let i=0;i<3;i++)for(const mode of ['control','main','branch'] as const)await run(mode,'/normal/page',false,false,i);
 for(const mode of ['main','branch'] as const)await run(mode,'/normal/page',true);
 for(const mode of ['control','main','branch'] as const)await run(mode,'/native/page');
 for(const mode of ['control','main','branch'] as const)await run(mode,'/direct/page');
 for(const mode of ['control','main','branch'] as const)await run(mode,'/burst/page');
 // Counterfactual check: intentionally acknowledge, but never send, Fetch.failRequest.
 // This must stall the parser/DCL and leave a live request pending before cleanup.
 await run('branch','/normal/page',false,true);
 await writeFile(new URL('./results.json',root),JSON.stringify({sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),timezone:'Europe/Vienna CET UTC+01:00',atCET:new Date().toLocaleString('sv-SE',{timeZone:'Europe/Vienna'}),mode:'REAL_CHROMIUM_LOCAL_OFFLINE_COMPONENT',budget:{website:0,GET:0,model:0},mainRevision:freeze.mainRevision,failures,rows},null,2)+'\n');
 assert.deepEqual(failures,[]);
}finally{await browser.close();for(const s of [a,b])s.closeAllConnections();await Promise.all([a,b].map(s=>new Promise<void>(r=>s.close(()=>r()))));await rm(temp,{recursive:true,force:true})}
