import{readFile,writeFile}from'node:fs/promises';import{join,dirname}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
import{chromium}from'playwright-core';
const root=dirname(fileURLToPath(import.meta.url)),source='/private/tmp/praxis-premerge-scope-main-20261115';
const git=(...a)=>execFileSync('git',['--no-optional-locks','-C',source,...a],{encoding:'utf8'}).trim();
const manifest=JSON.parse(await readFile(join(root,'manifest.json'),'utf8'));
if(git('rev-parse','HEAD')!==manifest.sourceSHA||git('status','--porcelain'))throw Error('Frozen clean source required');
const load=n=>import(pathToFileURL(join(source,'src',n)));
const {createG6LiveBrowser}=await load('eval/restaurant/agent-loop/g6/live-transports.ts');
const {chargeG6}=await load('eval/restaurant/agent-loop/g6/budget.ts');
const {discoveryPackNetworkPolicy}=await load('integrations/restaurant-search/source-packs.ts');
const {browserTransportError}=await load('infrastructure/browser/browser-runtime-errors.ts');
let page;
const launch=chromium.launch.bind(chromium);
chromium.launch=async options=>{
 const browser=await launch(options),create=browser.newContext.bind(browser);
 browser.newContext=async opts=>{const context=await create(opts);context.on('page',p=>{page=p;});return context;};
 return browser;
};
// Passive page-handle capture only. The official factory installs every Guard
// and proxy boundary as usual. All explicit fetches below pass through it.
const responses=[],results=[],sources=[],skipped=[];
let last=0;
const pace=async()=>{const delay=5000-(Date.now()-last);if(delay>0)await new Promise(r=>setTimeout(r,delay));};
const save=async()=>writeFile(join(root,'result.json'),JSON.stringify({sourceSHA:manifest.sourceSHA,sources,results,skipped,responses,missingRawParameters:manifest.notRawReplayable,fullLive:0,realModelCalls:0,scope:'HTTP connectivity on captured public GET URLs; not full product or inventory acceptance'},null,2)+'\n');
for(const site of ['TABELOG','TABLECHECK']){
 let session;
 const controller=new AbortController(),entry=site==='TABELOG'?'https://tabelog.com/en/':'https://www.tablecheck.com/en/japan/search';
 const browser=createG6LiveBrowser(process.env);
 try{
  await pace();await chargeG6(join(root,'active-budget.json'),site+':ENTRY:'+Date.now(),'evaluationPublicGET','User: explicit two-source endpoint sweep; guarded public entry');last=Date.now();
  const at=performance.now();
  session=await browser.openSession({signal:controller.signal,networkPolicy:discoveryPackNetworkPolicy(),recordResponse:r=>{
   const u=new URL(r.url);responses.push({source:site,urlSHA256:createHash('sha256').update(new URL(r.url).href).digest('hex'),origin:u.origin,pathname:u.pathname,queryKeys:[...u.searchParams.keys()],type:r.resourceType,status:r.status,bytes:r.body.byteLength,bodySHA256:createHash('sha256').update(r.body).digest('hex'),at:new Date().toISOString()});
  }});
  if(session.metadata.readNetworkBoundary!=='INSTALLED')throw Error('Guard not installed');
  await session.prepareNavigation(entry,{timeoutMs:20_000});
  try{await session.navigate(entry,{waitUntil:'domcontentloaded'});sources.push({site,entry,loaded:true,elapsedMs:performance.now()-at});}
  catch(error){sources.push({site,entry,loaded:false,error:browserTransportError(error),elapsedMs:performance.now()-at});}
  for(const c of manifest.checks.filter(c=>c.source===site)){
   if(session.isClosed?.()){skipped.push({id:c.id,reason:'SOURCE_CONTEXT_CLOSED'});continue;}
   const hash=createHash('sha256').update(new URL(c.url).href).digest('hex');
   const native=responses.find(r=>r.urlSHA256===hash&&r.status>=200&&r.status<300);
   if(native){results.push({id:c.id,url:c.url,mode:'NATURALLY_OBSERVED',status:native.status,bytes:native.bytes});await save();continue;}
   await pace();await chargeG6(join(root,'active-budget.json'),site+':'+c.id+':'+Date.now(),'evaluationPublicGET','User endpoint sweep: one captured public GET, no retry');last=Date.now();
   const start=performance.now(),before=responses.length;
   let outcome;
   try{outcome=await page.evaluate(async url=>{
    try{const response=await fetch(url,{method:'GET',credentials:'omit',redirect:'manual',signal:AbortSignal.timeout(20_000)});const body=await response.arrayBuffer();return{browserStatus:response.status,bytes:body.byteLength,responseType:response.type};}
    catch(error){return{browserError:error?.name??'FetchError'};}
   },c.url);}catch(error){outcome={transportError:browserTransportError(error)};}
   const actual=responses.slice(before).find(r=>r.urlSHA256===hash);
   const row={id:c.id,url:c.url,mode:'CAPTURED_URL_GET_THROUGH_EXISTING_GUARD',...outcome,status:actual?.status??outcome.browserStatus??null,bytes:actual?.bytes??outcome.bytes,elapsedMs:performance.now()-start};
   if(row.status===null||row.status===0){
    try{const snap=await session.snapshot();row.guardObservations=(snap.networkRequests??[]).filter(r=>r.pathname===new URL(c.url).pathname).slice(-3);}catch{}
   }
   results.push(row);console.log(JSON.stringify({id:c.id,source:site,path:new URL(c.url).pathname,status:row.status,elapsedMs:row.elapsedMs,error:row.browserError??row.transportError?.code}));await save();
  }
 }catch(error){sources.push({site,error:browserTransportError(error)});}
 finally{controller.abort();await session?.close();await save();}
}
