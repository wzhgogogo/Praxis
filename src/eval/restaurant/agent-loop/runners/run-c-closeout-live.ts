import {localBrowserProxyFromEnvironment} from "../../../../infrastructure/browser/local-browser-proxy.js";
// User-approved D4/D8 branch verification. Real business capabilities come
// only from the ordinary G6 / createLiveReadAssembly composition.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {chromium} from 'playwright-core';
import {DeepSeekModelGateway} from '../../../../infrastructure/deepseek/deepseek-model-gateway.js';
import {LocalPlaywrightChromium} from '../../../../infrastructure/browser/local-playwright-chromium.js';
import {browserTransportError} from '../../../../infrastructure/browser/browser-runtime-errors.js';
import {createEvalGooglePlacesClient} from './google-places-recording.js';
import {discoveryPackNetworkPolicy} from '../../../../integrations/restaurant-search/source-packs.js';
import {runG6Batch,loadG6Pack,type G6TransportHooks} from '../g6/runner.js';
import {runG6SourceReadCheck,installSourceReadPageLimit} from '../g6/source-read-check.js';
import {normalizedTextKey} from '../../../../core/text-key.js';
import {chargeG6} from '../g6/budget.js';
import {observeOutgoingRequest} from '../g6/request-observation.js';
import {BrowserReadRecording} from './browser-read-recording.js';
import {traceBrowserRuntime,safeRecord,safeUrl} from './browser-case-slice-evidence.js';

const [mode,rootArgument,expectedSHA]=process.argv.slice(2);
assert.ok(mode&&['TC','TC_SEARCH','D4','D8'].includes(mode));assert.ok(rootArgument&&expectedSHA);
assert.equal(process.env.PRAXIS_RUN_C_CLOSEOUT_LIVE,'1','Network execution must be explicitly enabled after the frozen gates');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),expectedSHA);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'','Tracked inputs must remain unchanged');
const root=resolve(rootArgument),ledger=join(root,'budget-C-live.json');
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const stamp=()=>new Date(Date.now()+3_600_000).toISOString().replace('Z','+01:00');
const policy=discoveryPackNetworkPolicy();
const browserNetwork=localBrowserProxyFromEnvironment(process.env);
let sequence=0;
let sourceReadPhase='START',sourceReadPages=0;
let sourceReadBlockedDocument:Record<string,unknown>|undefined;
const sourceReadHeaders:Array<Record<string,unknown>>=[];
function browser(hooks?:G6TransportHooks,probe=false){
 return new LocalPlaywrightChromium({...browserNetwork,headless:true,browserType:{async launch(options){
  const launched=await chromium.launch(options),newContext=launched.newContext.bind(launched);
  launched.newContext=async options=>{
   const context=await newContext(options),route=context.route.bind(context);
   if(mode==='TC_SEARCH')installSourceReadPageLimit(context,()=>sourceReadPhase,request=>{sourceReadBlockedDocument=request;});
   const preflightReady=new WeakMap<import('playwright-core').Page,Promise<void>>();
   const observePreflight=(page:import('playwright-core').Page)=>{const prior=preflightReady.get(page);if(prior)return prior;const ready=(async()=>{
    const cdp=await context.newCDPSession(page),pending=new Map<string,import('../g6/evaluator.js').G6EvaluationInput['requests'][number]>();
    cdp.on('Network.requestWillBeSent',event=>{if(event.request.method!=='OPTIONS')return;
     const url=new URL(event.request.url),headers=Object.fromEntries(Object.entries(event.request.headers).map(([key,value])=>[key.toLowerCase(),String(value)]));
     const row={ref:'C-preflight:'+String(++sequence),url:url.origin+url.pathname,method:'OPTIONS',reachedSource:false,queryKeys:[...url.searchParams.keys()],preflight:{requestOrigin:headers.origin??'',method:headers['access-control-request-method']??'',headerNames:(headers['access-control-request-headers']??'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean),bodyBytes:Buffer.byteLength(event.request.postData??'')}};
     pending.set(event.requestId,row);hooks?.observeRequest(row);
    });
    cdp.on('Network.responseReceived',event=>{const row=pending.get(event.requestId);if(row){row.reachedSource=true;pending.delete(event.requestId);}});
    await cdp.send('Network.enable');
   })();preflightReady.set(page,ready);return ready;};
   context.on('page',page=>{void observePreflight(page).catch(()=>context.close());});
   const newPage=context.newPage.bind(context);context.newPage=async()=>{const page=await newPage();await observePreflight(page);return page;};
   context.route=(pattern,handler,options)=>route(pattern,async(actual,request)=>{
    const wrapped=new Proxy(actual,{get(target,key){
     if(key==='fetch')return async(options:Parameters<typeof actual.fetch>[0])=>{
      const row=await observeOutgoingRequest('C-source:'+String(++sequence),request);
      hooks?.observeRequest(row);
      const requestStartedAtMs=Date.now(),requestPhase=sourceReadPhase;
      const response=await target.fetch(options);
      if(mode==='TC_SEARCH'){const u=new URL(request.url());sourceReadHeaders.push({origin:u.origin,pathname:u.pathname,responseUrlSha256:createHash('sha256').update(request.url()).digest('hex'),method:request.method(),resourceType:request.resourceType(),queryKeys:[...u.searchParams.keys()],queryValueHashes:[...u.searchParams].map(([key,value])=>({key,normalizedValueSha256:createHash('sha256').update(normalizedTextKey(value)).digest('hex')})),requestPhase,requestStartedAtMs,responseAvailableAtMs:Date.now(),requestHeaderNames:Object.keys(await request.allHeaders()).sort(),responseHeaderNames:Object.keys(response.headers()).sort(),status:response.status()});}
      // The one-page connectivity check cannot follow a redirect into a
      // second public page. Live itself retains the unchanged Guard policy.
      if(probe&&request.resourceType()==='document'&&response.status()>=300&&response.status()<400)throw Error('CONNECTIVITY_REDIRECT_NOT_REQUESTED');
      return response;
     };
     const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
    }});return handler(wrapped,request);
   },options);return context;
  };return launched;
 }}});
}
if(mode==='TC_SEARCH'){
 const spec=JSON.parse(await readFile(join(root,'source-read-spec.json'),'utf8'));
 assert.equal(spec.minimumIntervalMs,5000);assert.equal(spec.maximumMs,120000);
 assert.equal(spec.models,0);assert.equal(spec.Live,0);assert.equal(spec.entryReads,1);assert.equal(spec.additionalDocumentReads,0);
 assert.ok(typeof spec.attemptId==='string'&&spec.attemptId.length>0);
 const sourceBudget=JSON.parse(await readFile(ledger,'utf8'));assert.ok(!sourceBudget.entries.some((row:{id:string})=>row.id===spec.attemptId+':entry'),'Attempt already charged');
 if(process.argv.includes('--validate-only')){console.log(JSON.stringify({mode,validated:true,network:0,models:0,uses:'original closeout browser factory and discoveryPackNetworkPolicy'}));process.exit(0);}
 const directory=join(root,'source-read');await mkdir(directory,{recursive:false});
 const ownCredentials=[process.env.DEEPSEEK_API_KEY??'',process.env.GOOGLE_MAPS_API_KEY??''].filter(Boolean);
 const recording=new BrowserReadRecording({directory,runId:'recording',reviewedReads:policy.dynamicReads,reviewedStaticResources:policy.staticResources,ownCredentials});
 const trace:Array<{sequence:number;kind:string;detail:unknown}>=[];let resolveCatalog!:(value:boolean)=>void;
 const catalogTerminal=new Promise<boolean>(resolve=>{resolveCatalog=resolve;});
 const runtime=traceBrowserRuntime(browser(undefined,true),'TABLECHECK',(kind,detail)=>{
  const fields=detail as Record<string,unknown>;
  if(kind==='NETWORK_REQUEST_END'&&typeof fields.url==='string'&&new URL(fields.url).hostname.startsWith('search-v4.')&&new URL(fields.url).pathname==='/catalog.json'&&fields.method==='GET')resolveCatalog(fields.status===200&&fields.outcome==='FINISHED');
  trace.push({sequence:trace.length+1,kind,detail:safeRecord(detail)});return trace.length;
 },recording.traceSink());
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),spec.maximumMs);
 await writeFile(join(directory,'started.json'),JSON.stringify({sourceSHA:expectedSHA,atCET:stamp(),spec,configuration:{factory:'run-c-closeout-live/browser (same D8 path)',headless:true,transport:'REVIEWED_STATIC_BROWSER default; document/data NODE_FETCH',proxy:browserNetwork.proxyServer?'CONFIGURED':'NOT_CONFIGURED',directHosts:browserNetwork.directHosts??[],context:{serviceWorkers:'block',userAgent:'DEFAULT',locale:'DEFAULT',timezoneId:'DEFAULT'},policy:'discoveryPackNetworkPolicy()',genericPublicRead:policy.genericPublicRead},model:0,Live:0},null,2)+'\n',{flag:'wx'});
 let result:unknown;
 try{result=await runG6SourceReadCheck({browser:runtime,policy,spec,signal:controller.signal,catalogTerminal,
  beforeEntry:async()=>{await chargeG6(ledger,spec.attemptId+':entry','evaluationPublicGET','Approved reviewed-static transport source entry through original Live path; user +1 GET464->465; no extra document, models or Live');sourceReadPages++;},
  phase:value=>{sourceReadPhase=value;trace.push({sequence:trace.length+1,kind:'SOURCE_READ_PHASE',detail:{phase:value,atMs:Date.now()}});},record:(kind,detail)=>{trace.push({sequence:trace.length+1,kind,detail:safeRecord(detail)});recording.record(kind,detail);}});
  if(sourceReadBlockedDocument)result={status:'STOP_NEW_DOCUMENT_REQUIRES_APPROVAL',attempt:result,request:sourceReadBlockedDocument};
 }finally{clearTimeout(timer);const captured=await recording.finish();await writeFile(join(directory,'receipt.json'),JSON.stringify({sourceSHA:expectedSHA,atCET:stamp(),result,pagesCharged:sourceReadPages,model:0,Live:0,recording:captured},null,2)+'\n',{flag:'wx'});await writeFile(join(directory,'events.json'),JSON.stringify(trace,null,2)+'\n',{flag:'wx'});await writeFile(join(directory,'header-names.json'),JSON.stringify(sourceReadHeaders,null,2)+'\n',{flag:'wx'});await writeFile(join(directory,'decisions.json'),'[]\n',{flag:'wx'});await writeFile(join(directory,'google-responses.json'),'[]\n',{flag:'wx'});}
 console.log(JSON.stringify({mode,result,pagesCharged:sourceReadPages,model:0,Live:0}));
}else if(mode==='TC'){
 const directory=join(root,'connectivity');await mkdir(directory,{recursive:false});
 const recording=new BrowserReadRecording({directory,runId:'tablecheck-connectivity',reviewedReads:policy.dynamicReads,reviewedStaticResources:policy.staticResources});
 const trace:Array<{kind:string;detail:unknown}>=[],runtime=traceBrowserRuntime(browser(undefined,true),'TABLECHECK',(kind,detail)=>{trace.push({kind,detail:safeRecord(detail)});return trace.length;},recording.traceSink());
 const controller=new AbortController();let session:Awaited<ReturnType<typeof runtime.openSession>>|undefined;
 const result:{startedAtCET:string;url:string;reachable:boolean;error?:unknown;landing?:unknown;recording?:unknown}={startedAtCET:stamp(),url:'https://www.tablecheck.com/en/japan/search',reachable:false};
 try{
  await chargeG6(ledger,'C-closeout:TC:GET','evaluationPublicGET','Approved one-page TableCheck connectivity check; current Guard, anonymous context, no model, no form action, no retry');
  session=await runtime.openSession({signal:controller.signal,networkPolicy:policy});
  await session.prepareNavigation!(result.url,{timeoutMs:20_000});
  await session.navigate(result.url,{waitUntil:'domcontentloaded',timeoutMs:20_000});
  const page=await session.snapshot();result.reachable=page.url===result.url&&!page.networkRequests?.some(r=>r.resourceType==='document'&&['FAILED','TIMED_OUT'].includes(r.outcome));
  result.landing={url:safeUrl(page.url),title:page.title};
 }catch(error){result.error=browserTransportError(error);}
 finally{
  await session?.close();result.recording=await recording.finish();
  await writeFile(join(directory,'result.json'),JSON.stringify({...result,finishedAtCET:stamp(),sourceSHA:expectedSHA,trace},null,2)+'\n',{flag:'wx'});
 }
 console.log(JSON.stringify({mode,reachable:result.reachable,error:result.error}));
 if(!result.reachable)process.exitCode=2;
}else{
 const connectivityRef=JSON.parse(await readFile(join(root,'preparation/connectivity-reference.json'),'utf8'));
 const connectivityRaw=await readFile(resolve(connectivityRef.path));assert.equal(sha(connectivityRaw),connectivityRef.sha256);
 const connectivity=JSON.parse(connectivityRaw.toString());
 assert.equal(connectivity.reachable,true,'No Live begins without the approved connectivity check');
 const packPath=join(root,mode+'-pack.json'),bytes=await readFile(packPath),pack=await loadG6Pack(packPath,sha(bytes));
 assert.equal(pack.mode,'LIVE_READ');assert.equal(pack.cases.length,1);assert.equal(pack.cases[0]!.id,mode);
 const review=JSON.parse(await readFile(join(root,'certification/reviewed.json'),'utf8')) as {reviewed:boolean;reviewer:string;identityChecks:Record<string,boolean>;packSHA256:Record<string,string>;rawFiles:Record<string,string>;certificates:import('../g6/witness.js').WitnessReceipt[]};
 assert.ok(review.reviewed&&review.reviewer&&['name','address','phone'].every(key=>review.identityChecks[key]));
 assert.equal(review.packSHA256[mode],sha(bytes),'Current independently certified pack binding');
 for(const [path,expected]of Object.entries(review.rawFiles))assert.equal(sha(await readFile(path)),expected);
 const target=pack.cases[0]!.witness;assert.ok(target,'Live requires a current independently qualified witness');
 const receipt=review.certificates.find(row=>row.target.sourceEntityId===target.sourceEntityId&&row.target.date===target.date&&row.target.time===target.time&&row.target.partySize===target.partySize);
 assert.ok(receipt?.exists===true&&receipt.detailRef&&receipt.detailSHA256&&receipt.vacancy);
 assert.ok(Date.now()-Date.parse(receipt.checkedAt)>=0&&Date.now()-Date.parse(receipt.checkedAt)<86400000,'Certificate outside24h');
 assert.equal(sha(await readFile(receipt.detailRef)),receipt.detailSHA256);
 assert.equal(sha(await readFile(receipt.vacancy.ref)),receipt.responseSHA256);
 assert.deepEqual(JSON.parse((await readFile(receipt.vacancy.ref)).toString()),receipt.vacancy.body);
 assert.ok(pack.cases[0]!.oracle.qualificationOracles?.length,'Empty pages alone do not certify delivery');
 if(process.argv.includes('--validate-only')){console.log(JSON.stringify({mode,validated:true,network:0,models:0,credentials:'NOT_LOADED'}));process.exit(0);}
 assert.equal(process.env.DEEPSEEK_MODEL,'deepseek-v4-flash');
 assert.ok(process.env.DEEPSEEK_API_KEY&&process.env.GOOGLE_MAPS_API_KEY,'Server credentials must be loaded by Node --env-file (values are never printed)');
 const ownCredentials=[process.env.DEEPSEEK_API_KEY,process.env.GOOGLE_MAPS_API_KEY];
 const dependencies={budgetPath:ledger,ownCredentials,initialWitnesses:review.certificates,witnessFetch:fetch,async transports(_spec:unknown,_recording:BrowserReadRecording,hooks:G6TransportHooks){
  const model=DeepSeekModelGateway.fromEnvironment(process.env,{observer:{async observe(record){
   const raw=JSON.stringify(record);if(ownCredentials.some(value=>value&&raw.includes(value)))return;
   const directory=join(root,'model-invocations');await mkdir(directory,{recursive:true});
   await writeFile(join(directory,record.invocationId+'.json'),raw+'\n',{flag:'wx'});
  }}});
  return{model,browser:browser(hooks),clock:{now:()=>new Date()},
   google:createEvalGooglePlacesClient({apiKey:process.env.GOOGLE_MAPS_API_KEY!,timeoutMs:30_000,...(process.env.PRAXIS_GOOGLE_API_PROXY_SERVER?{proxyServer:process.env.PRAXIS_GOOGLE_API_PROXY_SERVER}:{})},hooks.googleFetch)};
 }};
 const outcome=await runG6Batch(pack,dependencies,join(root,'runs',mode));
 await writeFile(join(root,mode+'-receipt.json'),JSON.stringify({sourceSHA:expectedSHA,inputSHA:sha(bytes),atCET:stamp(),credentials:'LOADED_IN_NODE_PROCESS_ONLY',outcome},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({mode,outcome}));
}
