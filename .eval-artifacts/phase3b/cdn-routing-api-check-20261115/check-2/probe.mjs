import{readFile,writeFile}from'node:fs/promises';import{dirname,join}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const root=dirname(fileURLToPath(import.meta.url)),source='/private/tmp/praxis-premerge-scope-main-20261115';
const sha=v=>createHash('sha256').update(v).digest('hex');
const git=(...args)=>execFileSync('git',['--no-optional-locks','-C',source,...args],{encoding:'utf8'}).trim();
if(git('rev-parse','HEAD')!=='a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d'||git('status','--porcelain'))throw Error('Frozen clean source required');
if(!process.execArgv.some(x=>x.startsWith('--env-file=')))throw Error('Env-file required');
const load=name=>import(pathToFileURL(join(source,'src',name)));
const {createG6LiveBrowser}=await load('eval/restaurant/agent-loop/g6/live-transports.ts');
const {chargeG6}=await load('eval/restaurant/agent-loop/g6/budget.ts');
const {discoveryPackNetworkPolicy,restaurantDiscoveryPacks}=await load('integrations/restaurant-search/source-packs.ts');
const policy=discoveryPackNetworkPolicy(),url=restaurantDiscoveryPacks.find(p=>p.meta.id==='tablecheck').browser.startupUrl;
const controller=new AbortController(),requests=[],observations=[];let resolve;
const result=new Promise(r=>resolve=r);
const timer=setTimeout(()=>{resolve({status:null,reason:'ENTRY_20S_NO_CATALOG_RESPONSE'});controller.abort();},20_000);
let session;
try{
 await chargeG6('/private/tmp/praxis-category-guidance-live-evidence/.eval-artifacts/phase3b/cdn-routing-api-check-20261115/active-budget.json','catalog-probe:'+Date.now(),'evaluationPublicGET','User2026-11-15: one guarded browser page read to observe current catalog status; no model/Live');
 const browser=createG6LiveBrowser(process.env,{observeRequest:r=>requests.push(r)});
 session=await browser.openSession({signal:controller.signal,networkPolicy:policy,recordResponse:r=>{
  const u=new URL(r.url);
  if(u.pathname==='/catalog.json'&&u.hostname.includes('tablecheck.net')){
   const row={url:r.url,method:r.method,resourceType:r.resourceType,status:r.status,bodyBytes:r.body.byteLength,bodySHA256:sha(r.body),at:new Date().toISOString()};
   observations.push(row);resolve(row);
  }
 }});
 await session.prepareNavigation(url,{timeoutMs:20_000});
 void session.navigate(url,{waitUntil:'domcontentloaded'}).catch(()=>{});
 const observed=await result;
 await writeFile(join(root,'result.json'),JSON.stringify({sourceSHA:git('rev-parse','HEAD'),entry:url,observed,observations,requests,conditionForD8:observed.status===200,modelCalls:0,fullLive:0},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({observed,runD8:observed.status===200}));
}finally{clearTimeout(timer);controller.abort();await session?.close();}
