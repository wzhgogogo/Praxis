// Frozen, read-only component measurement. No model, .env, clicks, forms or automatic retry.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm,symlink} from 'node:fs/promises';
import {execFileSync,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {chromium} from 'playwright-core';
import {decodeHTML} from 'entities';
import {LocalPlaywrightChromium as BranchRuntime} from '../../../src/infrastructure/browser/local-playwright-chromium.js';
import {PlaywrightReadNetworkGuard as BranchGuard} from '../../../src/infrastructure/browser/playwright-read-network-guard.js';
import {tabelogPublicReadNetworkPolicy} from '../../../src/integrations/tabelog/tabelog-public-query.js';
const call=promisify(execFile),root=new URL('./',import.meta.url),ledger=new URL('../budget.json',root);
const phase=process.argv[2];assert.ok(['fixture','http','main','branch'].includes(phase!));
const fixture=phase==='fixture',freeze=JSON.parse(await readFile(new URL('./freeze.json',root),'utf8'));
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const hash=(x:string|Buffer)=>createHash('sha256').update(x).digest('hex');
for(const [file,expected] of Object.entries(freeze.inputs))assert.equal(hash(await readFile(file)),expected,`FROZEN_INPUT_CHANGED:${file}`);
const stamp=()=>new Date().toLocaleString('sv-SE',{timeZone:'Europe/Vienna'}).replace(' ','T')+'+01:00';
const cleanUrl=(value:string)=>{try{const u=new URL(value);u.search='';u.hash='';u.username='';u.password='';return u.toString()}catch{return '[INVALID_URL]'}};
const errorText=(e:unknown)=>(e instanceof Error?e.message:String(e)).replace(/https?:\/\/[^\s"<>]+/g,'[URL]');
const temp=await mkdtemp(join(tmpdir(),'w1-timeline-'));
await writeFile(join(temp,'package.json'),'{"type":"module"}');await symlink(resolve('node_modules'),join(temp,'node_modules'),'dir');
for(const [file,expected] of Object.entries(freeze.mainFiles)){
 let raw=execFileSync('git',['show',`${freeze.mainRevision}:${file}`],{encoding:'utf8'});assert.equal(hash(raw),expected,`MAIN_SOURCE_CHANGED:${file}`);
 if(file.endsWith('playwright-read-network-guard.ts')||file.endsWith('local-playwright-chromium.ts'))raw=raw.replace(/from "(\.\/[^\"]+)\.js"/g,(_m,spec)=>{
  const target=spec==='./playwright-read-network-guard'?join(temp,'src/infrastructure/browser/playwright-read-network-guard.ts'):resolve('src/infrastructure/browser',spec+'.ts');
  return `from ${JSON.stringify(pathToFileURL(target).href)}`;
 });
 const out=join(temp,file);await mkdir(dirname(out),{recursive:true});await writeFile(out,raw);
}
const {traceBrowserRuntime,safeRecord}=await import(pathToFileURL(join(temp,'src/eval/restaurant/agent-loop/runners/browser-case-slice-evidence.ts')).href);
const {LocalPlaywrightChromium:MainRuntime}=await import(pathToFileURL(join(temp,'src/infrastructure/browser/local-playwright-chromium.ts')).href);
const {PlaywrightReadNetworkGuard:MainGuard}=await import(pathToFileURL(join(temp,'src/infrastructure/browser/playwright-read-network-guard.ts')).href);
let activeGuard:any;
for(const C of [MainGuard,BranchGuard]){const original=C.prototype.install;C.prototype.install=async function(...args:any[]){activeGuard=this;return original.apply(this,args)}}
let fixtureServer:ReturnType<typeof createServer>|undefined;
let url=freeze.url;
if(fixture){fixtureServer=createServer((req,res)=>{const path=req.url!;if(path==='/'){res.setHeader('content-type','text/html');res.end('<title>W1 fixture</title><h1>Essential fixture</h1><script src="/required.js"></script><img src="/image.png">');}else if(path==='/required.js'){res.setHeader('content-type','text/javascript');res.end("fetch('/data').then(r=>r.json()).then(()=>document.body.dataset.ready='yes')");}else if(path==='/data'){res.setHeader('content-type','application/json');res.end('{"ok":true}');}else{res.setHeader('content-type','image/png');res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jDP0AAAAASUVORK5CYII=','base64'));}});await new Promise<void>(r=>fixtureServer!.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${(fixtureServer.address() as any).port}/`}
const proxy=fixture?undefined:freeze.proxy;
const flags=(title:string,text:string)=>({busy:/現在アクセスが集中しています/.test(title)||/現在アクセスが集中し、ページが表示されにくい状態/.test(text),challenge:/captcha|verify you are human|access denied|unusual traffic|robot|just a moment/i.test(title+'\n'+text)});
async function httpRead(){
 const file=join(temp,'http-body'),start=performance.now();let output='',failure:any=null;
 try{const r=await call('curl',['--disable','--silent','--show-error','--retry','0','--max-redirs','0','--max-time','20',...(proxy?['--proxy',proxy]:[]),'--output',file,'--write-out','%{json}',url],{maxBuffer:2000000});output=r.stdout}catch(e:any){output=e.stdout??'';failure={exitCode:e.code??null,message:errorText(e.stderr??e)}}
 let meta:any={};try{meta=JSON.parse(output)}catch{}
 const body=await readFile(file).catch(()=>Buffer.from('')),html=body.toString('utf8'),title=decodeHTML(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'').replace(/\s+/g,' ').trim();
 const text=decodeHTML(html.replace(/<(?:script|style)\b[^>]*>[\s\S]*?<\/(?:script|style)>/gi,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ');
 await rm(file,{force:true});
 return {kind:'HTTP',url,startedAndEndedClock:'curl transfer clock; time_starttransfer is first response byte (proxy path)',document:{firstByteMs:meta.time_starttransfer==null?null:meta.time_starttransfer*1000,endMs:meta.time_total==null?null:meta.time_total*1000,status:meta.http_code??null,httpVersion:meta.http_version??null,bytes:body.length},wallMs:performance.now()-start,title,...flags(title,text),bodySha256:hash(body),navigationEndReason:failure?'HTTP_FAILED':'COMPLETED',failure,websiteAdmitted:1};
}
async function browserRead(mode:'main'|'branch'){
 const events:any[]=[];let page:any,protocol:any,dcl:any=null,load:any=null,navAt:number|null=null,navError:any=null,loadError:any=null,metadata:any=null;
 const controller=new AbortController();const record=(kind:string,detail:unknown)=>{events.push({sequence:events.length+1,kind,detail:safeRecord(detail)});return events.length};
 const browserType={async launch(options:any){const b=await chromium.launch(options),create=b.newContext.bind(b);b.newContext=async(opts:any)=>{const c=await create(opts);c.on('page',p=>{
  page=p;p.on('domcontentloaded',()=>{if(navAt!==null)dcl={observedMonotonicMs:performance.now(),elapsedMs:performance.now()-navAt,...(dcl??{})}});p.on('load',()=>{if(navAt!==null)load={observedMonotonicMs:performance.now(),elapsedMs:performance.now()-navAt,...(load??{})}});
  protocol=(async()=>{const cd=await c.newCDPSession(p);cd.on('Page.domContentEventFired',e=>{if(navAt!==null)dcl={...(dcl??{}),browserTimestamp:e.timestamp}});cd.on('Page.loadEventFired',e=>{if(navAt!==null)load={...(load??{}),browserTimestamp:e.timestamp}});await cd.send('Page.enable')})();
 });return c};return b}};
 const runtime=new (mode==='main'?MainRuntime:BranchRuntime)({browserType,headless:true,...(proxy?{proxyServer:proxy}:{})});
 const traced=traceBrowserRuntime(runtime,'TABELOG',record,undefined,{remainingBudgetMs:()=>navAt===null?20000:Math.max(0,20000-(performance.now()-navAt))});
 const policy=fixture?{documentOrigins:[new URL(url).origin],genericPublicRead:true,staticResources:[],dynamicReads:[]}:tabelogPublicReadNetworkPolicy;
 let session:any;let payload:any={title:null,text:'',scripts:[]};let inspectionError:any=null;
 try{
  session=await traced.openSession({signal:controller.signal,networkPolicy:policy});metadata=session.metadata;await protocol;
  await session.prepareNavigation(url,{timeoutMs:20000});navAt=performance.now();
  try{await session.navigate(url,{waitUntil:'domcontentloaded',timeoutMs:20000})}catch(e){navError=errorText(e)}
  if(!navError){const remaining=Math.max(1,20000-(performance.now()-navAt));try{await page.waitForLoadState('load',{timeout:remaining})}catch(e){loadError=errorText(e)}}
  // Capture even after goto timeout. This is a local inspection, not another page access.
  let timer:any;const inspection=page.evaluate(()=>({title:document.title,text:document.body?.innerText??'',scripts:[...document.scripts].map(s=>({src:s.src,async:s.async,defer:s.defer,type:s.type,inHead:document.head.contains(s)}))}));
  try{payload=await Promise.race([inspection,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('INSPECTION_500MS_LIMIT')),500)})])}catch(e){inspectionError=errorText(e);void inspection.catch(()=>{})}finally{clearTimeout(timer)}
  if(fixture)await page.waitForFunction(()=>document.body.dataset.ready==='yes',undefined,{timeout:1000});
 }catch(e){navError??=errorText(e)}
 const cut={atCET:stamp(),monotonicMs:performance.now(),elapsedMs:navAt===null?null:performance.now()-navAt};
 const beforeClose=structuredClone(events),beforeGuard=activeGuard?.snapshotRequests()??[];
 await session?.close().catch(()=>{});controller.abort();
 const allGuard=activeGuard?.snapshotRequests()??[];
 const scripts=(payload.scripts??[]).map((s:any)=>({...s,src:s.src?cleanUrl(s.src):'',srcSha256:hash(s.src)}));
 return {kind:'BROWSER',configuration:mode,url,metadata,navigationStartMonotonicMs:navAt,documentClock:'A browser CDP timestamps; Guard route.fetch separate transport',dcl,load,navigationEndReason:navError?'NAVIGATION_FAILED_OR_TIMEOUT':loadError?'DCL_COMPLETE_LOAD_OBSERVATION_TIMEOUT':'COMPLETED',navError,loadError,inspectionError,title:payload.title,...(payload.title===null?{busy:null,challenge:null}:flags(payload.title,payload.text)),bodyTextLength:payload.text.length,bodyTextSha256:hash(payload.text),scripts,captureCutoff:cut,traceBeforeClose:beforeClose,trace:structuredClone(events),guardBeforeClose:beforeGuard,guardAfterClose:allGuard,websiteAdmitted:allGuard.filter((r:any)=>r.outcome==='ADMITTED').length};
}
async function book(mode:string,index:number){
 const b=JSON.parse(await readFile(ledger,'utf8')),id=`phase3b-B-w1-timeline-${mode}-${index}-20261104`;
 if(b.entries.some((e:any)=>e.id===id))return null;
 const own=b.entries.filter((e:any)=>e.batchId===freeze.batchId);assert.ok(own.length<8,'BATCH_LIMIT');assert.ok(b.cumulative.evaluationPublicGET+1<=b.limits.evaluationPublicGET,'GLOBAL_LIMIT');
 const latest=own.at(-1);if(latest){const after=(latest.completedAtEpochMs??latest.startedAtEpochMs+20000)+10000;const wait=after-Date.now();if(wait>0)await new Promise(r=>setTimeout(r,wait))}
 // Reload immediately before atomic single-process append, preserving other IDs.
 const current=JSON.parse(await readFile(ledger,'utf8'));assert.ok(!current.entries.some((e:any)=>e.id===id));
 current.entries.push({id,batchId:freeze.batchId,conversation:'B',timeCET:stamp(),startedAtEpochMs:Date.now(),mode:'W1_REQUEST_TIMELINE_'+mode.toUpperCase(),url:freeze.url,fullLive:0,realModelCalls:0,googleRequests:0,environmentReruns:0,evaluationPublicGET:1,restaurantWebsiteRequests:0,status:'BOOKED_BEFORE_DISPATCH'});
 current.cumulative.evaluationPublicGET++;await writeFile(ledger,JSON.stringify(current,null,2)+'\n');return id;
}
try{
 const modes=fixture?['http','main','branch']:[phase!];
 for(const mode of modes)for(let i=1;i<=(fixture?1:mode==='http'?2:3);i++){
  const id=fixture?`fixture-${mode}`:await book(mode,i);if(!id){console.log('ALREADY_SPENT_NO_RETRY',mode,i);continue}
  const startedAtCET=stamp(),result=mode==='http'?await httpRead():await browserRead(mode as any);
  const row={id,sha,fixture,mainRevision:freeze.mainRevision,startedAtCET,completedAtCET:stamp(),...result};
  await writeFile(new URL(`./${id}.json`,root),JSON.stringify(row,null,2)+'\n');
  if(!fixture){const b=JSON.parse(await readFile(ledger,'utf8')),entry=b.entries.find((e:any)=>e.id===id);entry.restaurantWebsiteRequests=result.websiteAdmitted;entry.completedAtEpochMs=Date.now();entry.status='COMPLETED_ATTEMPT';b.cumulative.restaurantWebsiteRequests+=result.websiteAdmitted;await writeFile(ledger,JSON.stringify(b,null,2)+'\n')}
  if(fixture&&mode!=='http'){assert.equal(result.title,'W1 fixture');assert.ok(result.dcl?.browserTimestamp);assert.ok(result.trace.some((e:any)=>e.kind==='NETWORK_REQUEST_START'));assert.ok(result.trace.some((e:any)=>e.kind==='NETWORK_RESPONSE_HEADERS'));assert.ok(result.trace.some((e:any)=>e.kind==='GUARD_TRANSPORT_END'));assert.ok(result.trace.some((e:any)=>e.kind==='NAVIGATION_END'));assert.equal(result.navError,null)}
  console.log(JSON.stringify({id,navigationEndReason:result.navigationEndReason,title:result.title,dcl:(result as any).dcl??null,load:(result as any).load??null,websiteAdmitted:result.websiteAdmitted}));
 }
}finally{if(fixtureServer){fixtureServer.closeAllConnections();await new Promise<void>(r=>fixtureServer!.close(()=>r()))}await rm(temp,{recursive:true,force:true})}
