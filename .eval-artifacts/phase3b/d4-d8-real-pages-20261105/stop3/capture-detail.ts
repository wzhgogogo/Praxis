// Authorized zero-model component probes; all website I/O goes through current Guard.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium,type BrowserContext,type Request,type Route} from 'playwright-core';
import {LocalPlaywrightChromium} from '../../../../src/infrastructure/browser/local-playwright-chromium.js';
import {PlaywrightReadNetworkGuard} from '../../../../src/infrastructure/browser/playwright-read-network-guard.js';
import {browserTransportError} from '../../../../src/infrastructure/browser/browser-runtime-errors.js';
import {tableCheckPublicReadNetworkPolicy} from '../../../../src/integrations/tablecheck/tablecheck-public-query.js';
import {tabelogPublicReadNetworkPolicy} from '../../../../src/integrations/tabelog/tabelog-public-query.js';
import {BrowserReadRecording} from '../../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.js';
import {traceBrowserRuntime,safeRecord,safeUrl} from '../../../../src/eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
const root=new URL('../',import.meta.url),mode=process.argv[2];
assert.ok(['D4-FIRST-DETAIL'].includes(mode!));
const sha=(b:Buffer)=>createHash('sha256').update(b).digest('hex');
const freeze=JSON.parse(await readFile(new URL('stop3/detail-inputs.json',root),'utf8'));
for(const [path,expected]of Object.entries(freeze.files))assert.equal(sha(await readFile(path)),expected,`FROZEN_CHANGED:${path}`);
const cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
const stamp=()=>({atCET:cet(),monotonicMs:performance.now()});
const ledgerUrl=new URL('budget-C.json',root),base=JSON.parse(await readFile(new URL('budget-baseline.json',root),'utf8'));
let booking=Promise.resolve(),pageReads=0;
async function book(url:string){let id='';booking=booking.then(async()=>{
 const ledger=JSON.parse(await readFile(ledgerUrl,'utf8'));
 assert.ok(ledger.entries.length<15,'PROBE_PAGE_LIMIT');assert.ok(ledger.entries.filter((r:any)=>r.probe.startsWith('D4-CAPTURE')).length<6,'D4_CAPTURE_READ_LIMIT');
 assert.ok(base.cumulative.evaluationPublicGET+ledger.entries.length+1<=440,'GLOBAL_GET_LIMIT');
 const prior=ledger.entries.at(-1);if(prior){const wait=5000-(Date.now()-prior.startedAtEpochMs);if(wait>0)await new Promise(r=>setTimeout(r,wait));}
 id=`phase3b-C-real-pages-20261105-${ledger.entries.length+1}`;
 ledger.entries.push({id,probe:mode,timeCET:cet(),startedAtEpochMs:Date.now(),url:safeUrl(url),evaluationPublicGET:1,fullLive:0,realModelCalls:0,googleRequests:0,environmentReruns:0,restaurantWebsiteRequests:0,status:'BOOKED_BEFORE_GUARD_FETCH'});
 await writeFile(ledgerUrl,JSON.stringify(ledger,null,2)+'\n');pageReads++;
});await booking;return id;}
const directory=new URL(`stop3/recordings/${mode}/`,root);await mkdir(directory,{recursive:true});
const trace:any[]=[],paired:any[]=[],decisions:any[]=[];const pending=new Set<Request>();let activeGuard:PlaywrightReadNetworkGuard|undefined;
const originalInstall=PlaywrightReadNetworkGuard.prototype.install;
PlaywrightReadNetworkGuard.prototype.install=async function(...args){activeGuard=this;return originalInstall.apply(this,args)};
const publicPolicy=mode!.startsWith('TC-')?tableCheckPublicReadNetworkPolicy:tabelogPublicReadNetworkPolicy;
// Native discovery uses generic public reads; retain all source revocations/shape rules.
const policy={...publicPolicy,genericPublicRead:true};
const recorder=new BrowserReadRecording({directory:new URL('./',directory).pathname,runId:'source',reviewedStaticResources:policy.staticResources,reviewedReads:policy.dynamicReads});
const signal=new AbortController();
const transportIds=new WeakMap<Request,string>();let counter=0;
const id=(request:Request)=>{let value=transportIds.get(request);if(!value){value=`${mode}:request:${++counter}`;transportIds.set(request,value)}return value};
// Extra diagnostic pairs use the exact same Playwright Request object, not URL/order joins.
const browserType={async launch(options:any){const browser=await chromium.launch(options),create=browser.newContext.bind(browser);
 browser.newContext=async(options:any)=>{const context=await create(options);decorate(context);return context};return browser}};
function decorate(context:BrowserContext){
 const route=context.route.bind(context);context.route=(pattern,handler,options)=>route(pattern,async(actual,request)=>{
  const wrapped=new Proxy(actual,{get(target,key){
   if(key==='fetch'||key==='continue')return async(options:any)=>{
    let bookId:string|undefined;
    if(request.resourceType()==='document'){
     assert.equal(request.method(),'GET');
     const u=new URL(request.url());
     if(u.pathname==='/en/rstLst/'){
      assert.equal(u.origin,'https://tabelog.com');
      assert.deepEqual([...u.searchParams.keys()].sort(),['LstAre','LstPrf','area_datatype','area_id','genre_name','pal','search_mode','station_id','sw','utf8'].sort(),'INDEPENDENT_TEN_KEY_REVIEW');
     }
     bookId=await book(request.url());
    }
    const leg=key==='fetch'?'NODE_FETCH':'BROWSER_CONTINUE';const begin=stamp();paired.push({kind:leg+'_START',id:id(request),url:safeUrl(request.url()),resourceType:request.resourceType(),...begin,...(bookId?{bookId}:{})});
    try{const response=await (key==='fetch'?target.fetch(options):target.continue(options));paired.push({kind:leg+'_END',id:id(request),status:response?.status?.()??null,elapsedMs:performance.now()-begin.monotonicMs,...stamp()});return response}
    catch(error){paired.push({kind:leg+'_FAILED',id:id(request),elapsedMs:performance.now()-begin.monotonicMs,error:browserTransportError(error),...stamp()});throw error}
   };
   const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});return handler(wrapped,request);
 },options);
 const terminal=(request:Request,outcome:string)=>{paired.push({kind:'BROWSER_TERMINAL',id:id(request),url:safeUrl(request.url()),resourceType:request.resourceType(),outcome,timing:request.timing(),failure:request.failure()?.errorText??null,...stamp()})};
 context.on('request',r=>pending.add(r));context.on('requestfinished',r=>{pending.delete(r);terminal(r,'FINISHED')});context.on('requestfailed',r=>{pending.delete(r);terminal(r,'FAILED')});
}
const responseMetadata:any[]=[];const capture=recorder.traceSink();const originalCapture=capture.recordResponse!;capture.recordResponse=async response=>{let keys:unknown;try{const body=JSON.parse(Buffer.from(response.body).toString());keys=Array.isArray(body)?[...new Set(body.flatMap((x:any)=>x&&typeof x==='object'?Object.keys(x):[]))]:body&&typeof body==='object'?Object.keys(body):typeof body}catch{}responseMetadata.push({url:safeUrl(response.url),status:response.status,contentType:response.contentType,bytes:response.body.byteLength,sha256:sha(Buffer.from(response.body)),keys});await originalCapture(response)};
const runtime=traceBrowserRuntime(new LocalPlaywrightChromium({browserType,headless:true,admittedGetTransport:mode!.endsWith('BROWSER')?'BROWSER_GET_HEAD':'NODE_FETCH'}),mode!.startsWith('TC-')?'TABLECHECK':'TABELOG',(kind,detail)=>{trace.push({sequence:trace.length+1,kind,detail:safeRecord(detail)});return trace.length},capture);
let session:Awaited<ReturnType<typeof runtime.openSession>>|undefined;
const recordDecision=(action:string,basis:unknown)=>{const row={sequence:decisions.length+1,actor:'DETERMINISTIC_READONLY_PROBE',model:false,action,basis:safeRecord(basis),...stamp()};decisions.push(row);recorder.record('PROBE_DECISION',row)};
async function snap(){const page=await session!.snapshot();const controls=await session!.observeControls!();return {page,controls};}
let result:any={mode,transport:mode!.endsWith('BROWSER')?'BROWSER_GET_HEAD':'NODE_FETCH',startedAtCET:cet(),policy:'USER_APPROVED_EXACT_TEN_KEY_SEARCH_PLUS_EXISTING_PUBLIC_READ',credentials:'NOT_LOADED',proxy:'NO_EXPLICIT_PROXY_DEFAULT_CHROMIUM_PATH',modelCalls:0,googleCalls:0};
try{
 const previous=JSON.parse(await readFile(ledgerUrl,'utf8')).entries.at(-1);if(previous){const delay=5000-(Date.now()-previous.startedAtEpochMs);if(delay>0)await new Promise(r=>setTimeout(r,delay));}
 session=await runtime.openSession({signal:signal.signal,networkPolicy:policy});
 assert.equal(session.metadata.readNetworkBoundary,'INSTALLED');
 const replay=JSON.parse(await readFile(new URL('stop3/D4-whole-replay-detail-gaps.json',root),'utf8')); const missing=replay.stops.find((x:any)=>x.reason==='DOCUMENT_NOT_QUALIFIED'&&/^\/en\/tokyo\/A[0-9]+\/A[0-9]+\/[0-9]+\/$/.test(new URL(x.url).pathname));assert.ok(missing); const url=missing.url;
 recordDecision('NAVIGATE_APPROVED_PUBLIC_PAGE',{url});
 assert.equal(new URL(url).origin,'https://tabelog.com');await session.prepareNavigation!(url,{timeoutMs:20000});
 const start=performance.now();let pageWindowEnd=start+20000;await session.navigate(url,{waitUntil:'domcontentloaded',timeoutMs:20000});result.navigationDclMs=performance.now()-start;
 const endAt=start+20000;let quietSince=performance.now();while(performance.now()<endAt){if(pending.size)quietSince=performance.now();if(!pending.size&&performance.now()-quietSince>=200)break;await new Promise(r=>setTimeout(r,50));}await session.flushRecordedResponses?.();result.responseDrain={pendingAtCutoff:pending.size,withinTwentySeconds:performance.now()<=endAt};
 let state=await snap();result.initial={url:safeUrl(state.page.url),title:state.page.title,controls:safeRecord(state.controls)};
 result.landing={url:safeUrl(state.page.url),title:state.page.title,controls:safeRecord(state.controls),textExcerpt:state.page.text.slice(0,2500)};recordDecision('OBSERVE_PUBLIC_RESULT_NO_BOOKING_OR_DATE_CONFIRMATION',result.landing);
 result.status='OBSERVED';
}catch(error){result.status='FAILED';result.error=browserTransportError(error);result.networkFailures=(error as any)?.networkFailures??[];
 if(session&&!session.isClosed?.())try{const state=await snap();result.afterFailure={url:safeUrl(state.page.url),title:state.page.title,controls:safeRecord(state.controls)}}catch(e){result.snapshotFailure=browserTransportError(e)}
}finally{
 result.cutoff=stamp();result.guardRequests=activeGuard?.snapshotRequests()??[];result.guardDiagnostics=activeGuard?.snapshotDiagnostics()??[];recorder.recordNetwork(result.guardRequests);
 await session?.close().catch(()=>{});signal.abort();await booking;
 result.recording=await recorder.finish();result.completedAtCET=cet();result.pageReads=pageReads;
 await writeFile(new URL('result.json',directory),JSON.stringify(safeRecord(result),null,2)+'\n');
 await writeFile(new URL('response-metadata.json',directory),JSON.stringify(responseMetadata,null,2)+'\n');
 await writeFile(new URL('timeline.json',directory),JSON.stringify(trace,null,2)+'\n');
 await writeFile(new URL('paired-timing.json',directory),JSON.stringify(paired,null,2)+'\n');
 await writeFile(new URL('decisions.json',directory),JSON.stringify(decisions,null,2)+'\n');
 await writeFile(new URL('google-capture.json',directory),JSON.stringify({enabled:true,requests:[],count:0,reason:'NO_GOOGLE_OR_MODEL_PORT_IN_PROBE'},null,2)+'\n');
 const ledger=JSON.parse(await readFile(ledgerUrl,'utf8'));const rows=ledger.entries.filter((r:any)=>r.probe===mode);let once=true;
 for(const row of rows){row.status='COMPLETED_ATTEMPT';row.completedAtCET=cet();if(once){row.restaurantWebsiteRequests=result.guardRequests.filter((r:any)=>r.outcome==='ADMITTED').length;once=false}}
 await writeFile(ledgerUrl,JSON.stringify(ledger,null,2)+'\n');
 console.log(JSON.stringify({mode,status:result.status,pageReads,initial:result.initial?.title,landing:result.landing?.url,error:result.error,networkErrors:result.guardDiagnostics.filter((r:any)=>r.error).map((r:any)=>({origin:r.origin,pathname:r.pathname,error:r.error})),recording:result.recording.replay}));
}
