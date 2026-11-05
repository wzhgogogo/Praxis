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
import {GooglePlacesClient} from '../../../../integrations/google/google-places-client.js';
import {discoveryPackNetworkPolicy} from '../../../../integrations/restaurant-search/source-packs.js';
import {runG6Batch,loadG6Pack,type G6TransportHooks} from '../g6/runner.js';
import {chargeG6} from '../g6/budget.js';
import {BrowserReadRecording} from './browser-read-recording.js';
import {traceBrowserRuntime,safeRecord,safeUrl} from './browser-case-slice-evidence.js';

const [mode,rootArgument,expectedSHA]=process.argv.slice(2);
assert.ok(mode&&['TC','D4','D8'].includes(mode));assert.ok(rootArgument&&expectedSHA);
assert.equal(process.env.PRAXIS_RUN_C_CLOSEOUT_LIVE,'1','Network execution must be explicitly enabled after the frozen gates');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),expectedSHA);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'','Tracked inputs must remain unchanged');
const root=resolve(rootArgument),ledger=join(root,'budget-C-live.json');
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const stamp=()=>new Date(Date.now()+3_600_000).toISOString().replace('Z','+01:00');
const policy=discoveryPackNetworkPolicy();
let sequence=0;
function browser(hooks?:G6TransportHooks,probe=false){
 return new LocalPlaywrightChromium({headless:true,browserType:{async launch(options){
  const launched=await chromium.launch(options),newContext=launched.newContext.bind(launched);
  launched.newContext=async options=>{
   const context=await newContext(options),route=context.route.bind(context);
   context.route=(pattern,handler,options)=>route(pattern,async(actual,request)=>{
    const wrapped=new Proxy(actual,{get(target,key){
     if(key==='fetch')return async(options:Parameters<typeof actual.fetch>[0])=>{
      const row={ref:'C-source:'+String(++sequence),url:request.url(),method:request.method(),reachedSource:false,queryKeys:[...new URL(request.url()).searchParams.keys()]};
      hooks?.observeRequest(row);
      const response=await target.fetch(options);row.reachedSource=true;
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
if(mode==='TC'){
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
 const connectivity=JSON.parse(await readFile(join(root,'connectivity/result.json'),'utf8'));
 assert.equal(connectivity.reachable,true,'No Live begins without the approved connectivity check');
 assert.equal(process.env.DEEPSEEK_MODEL,'deepseek-v4-flash');
 assert.ok(process.env.DEEPSEEK_API_KEY&&process.env.GOOGLE_MAPS_API_KEY,'Server credentials must be loaded by Node --env-file (values are never printed)');
 const ownCredentials=[process.env.DEEPSEEK_API_KEY,process.env.GOOGLE_MAPS_API_KEY];
 const packPath=join(root,mode+'-pack.json'),bytes=await readFile(packPath),pack=await loadG6Pack(packPath,sha(bytes));
 assert.equal(pack.mode,'LIVE_READ');assert.equal(pack.cases.length,1);assert.equal(pack.cases[0]!.id,mode);
 const dependencies={budgetPath:ledger,ownCredentials,witnessFetch:fetch,async transports(_spec:unknown,_recording:BrowserReadRecording,hooks:G6TransportHooks){
  return{model:DeepSeekModelGateway.fromEnvironment(process.env),browser:browser(hooks),clock:{now:()=>new Date()},
   google:new GooglePlacesClient({apiKey:process.env.GOOGLE_MAPS_API_KEY!,fetchImplementation:hooks.googleFetch(fetch),timeoutMs:30_000,...(process.env.PRAXIS_GOOGLE_API_PROXY_SERVER?{proxyServer:process.env.PRAXIS_GOOGLE_API_PROXY_SERVER}:{})})};
 }};
 const outcome=await runG6Batch(pack,dependencies,join(root,'runs',mode));
 await writeFile(join(root,mode+'-receipt.json'),JSON.stringify({sourceSHA:expectedSHA,inputSHA:sha(bytes),atCET:stamp(),credentials:'LOADED_IN_NODE_PROCESS_ONLY',outcome},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({mode,outcome}));
}
