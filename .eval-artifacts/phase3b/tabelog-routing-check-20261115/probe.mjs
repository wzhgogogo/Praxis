import{readFile,writeFile}from'node:fs/promises';import{dirname,join}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const root=dirname(fileURLToPath(import.meta.url)),source='/private/tmp/praxis-premerge-scope-main-20261115';
const load=name=>import(pathToFileURL(join(source,'src',name)));
const git=(...a)=>execFileSync('git',['--no-optional-locks','-C',source,...a],{encoding:'utf8'}).trim();
if(git('rev-parse','HEAD')!=='a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d'||git('status','--porcelain'))throw Error('Dirty or changed source');
const {createG6LiveBrowser}=await load('eval/restaurant/agent-loop/g6/live-transports.ts');
const {chargeG6}=await load('eval/restaurant/agent-loop/g6/budget.ts');
const {discoveryPackNetworkPolicy}=await load('integrations/restaurant-search/source-packs.ts');
const controller=new AbortController(),start=performance.now(),observations=[];let finish,session;
const result=new Promise(resolve=>finish=resolve);
const timer=setTimeout(()=>{finish({passed:false,reason:'SCRIPT_NOT_COMPLETE_WITHIN_20S'});controller.abort();},20_000);
try{
 await chargeG6(join(root,'active-budget.json'),'tabelog-probe:'+Date.now(),'evaluationPublicGET','User2026-11-15: one read-only Tabelog routing and commons.js check, no Live/model');
 const browser=createG6LiveBrowser(process.env);
 session=await browser.openSession({signal:controller.signal,networkPolicy:discoveryPackNetworkPolicy(),recordResponse:r=>{
  const url=new URL(r.url);
  if(r.resourceType==='document'||url.hostname==='tblg.k-img.com'&&url.pathname.endsWith('/commons.js')){
   const observed={url:url.origin+url.pathname,status:r.status,type:r.resourceType,elapsedMs:performance.now()-start,bytes:r.body.byteLength,bodySHA256:createHash('sha256').update(r.body).digest('hex')};observations.push(observed);
   if(r.resourceType==='document'&&r.status>=400)finish({passed:false,reason:'DOCUMENT_HTTP_ERROR'});
   if(url.hostname==='tblg.k-img.com'&&url.pathname.endsWith('/commons.js'))finish({passed:r.status>=200&&r.status<300&&r.body.byteLength>0,reason:'SCRIPT_RESPONSE'});
  }
 }});
 const url='https://tabelog.com/en/';
 await session.prepareNavigation(url,{timeoutMs:20_000});
 void session.navigate(url,{waitUntil:'domcontentloaded'}).catch(()=>{});
 const outcome=await result;
 const observed={...outcome,observations,elapsedMs:performance.now()-start,sourceSHA:git('rev-parse','HEAD'),calls:{fullLive:0,evaluationPublicGET:1,realModelCalls:0}};
 await writeFile(join(root,'result.json'),JSON.stringify(observed,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(observed));
}finally{clearTimeout(timer);controller.abort();await session?.close();}
