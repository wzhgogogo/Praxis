import{readFile,writeFile}from'node:fs/promises';import{dirname,join}from'node:path';import{fileURLToPath,pathToFileURL}from'node:url';import{execFileSync}from'node:child_process';import{createHash}from'node:crypto';
const root=dirname(fileURLToPath(import.meta.url)),source='/private/tmp/praxis-premerge-scope-main-20261115',budget=join(root,'active-budget.json');
const git=(...a)=>execFileSync('git',['--no-optional-locks','-C',source,...a],{encoding:'utf8'}).trim();
if(git('rev-parse','HEAD')!=='a66a2edcb2ffe8e3eaa42f4c0e79680382539c9d'||git('status','--porcelain'))throw Error('Frozen clean source required');
const load=n=>import(pathToFileURL(join(source,'src',n)));
const {createG6LiveBrowser}=await load('eval/restaurant/agent-loop/g6/live-transports.ts');
const {chargeG6}=await load('eval/restaurant/agent-loop/g6/budget.ts');
const {discoveryPackNetworkPolicy}=await load('integrations/restaurant-search/source-packs.ts');
const {browserTransportError}=await load('infrastructure/browser/browser-runtime-errors.ts');
const output=[],navigationErrors=[];let active,session;
const browser=createG6LiveBrowser(process.env);
const classify=(url,type)=>{
 const u=new URL(url);
 if(type==='document')return 'document';
 if(u.hostname==='tblg.k-img.com'&&u.pathname.endsWith('/commons.js'))return 'commons.js';
 if(u.hostname==='www.tablecheck.com'&&/^\/portal\/assets\/index-[^/]+\.js$/.test(u.pathname))return 'main.js';
 if(u.hostname.includes('tablecheck.net')&&u.pathname==='/catalog.json')return 'catalog';
 if(u.hostname==='production.tablecheck.com'&&u.pathname==='/v2/geolocation')return 'geolocation';
 if(u.hostname==='production.tablecheck.com'&&u.pathname==='/v2/shops/nakamata-nodoguro-ginza')return 'shop';
};
const check=()=>{
 if(!active)return;
 const ok=key=>active.responses.some(r=>r.key===key&&r.status>=200&&r.status<300&&r.bytes>0);
 if(active.required.every(ok))active.finish('PASS');
};
async function runStage(name,url,required,fresh){
 if(fresh){await session?.close();session=undefined;}
 const controller=new AbortController(),start=performance.now();
 let done=false,resolve,timer;
 const result=new Promise(r=>resolve=r);
 const stage={name,url,required,startedAt:new Date().toISOString(),headers:[],responses:[],errors:[],finish(reason){if(done)return;done=true;resolve({name,reason,passed:reason==='PASS',elapsedMs:performance.now()-start,headers:stage.headers,responses:stage.responses,errors:stage.errors});}};
 active=stage;
 timer=setTimeout(()=>stage.finish('WINDOW_20S_EXPIRED'),20_000);
 try{
  await chargeG6(budget,'path-check:'+name+':'+Date.now(),'evaluationPublicGET','User2026-11-15: one read-only page, original Guard, no Live/model');
  if(!session)session=await browser.openSession({signal:controller.signal,networkPolicy:discoveryPackNetworkPolicy(),onResponseHeaders:r=>{
   if(!active)return;const key=classify(r.url,r.resourceType);if(key)active.headers.push({key,status:r.status,url:new URL(r.url).origin+new URL(r.url).pathname});
  },recordResponse:r=>{
   if(!active)return;const key=classify(r.url,r.resourceType);if(!key)return;
   active.responses.push({key,status:r.status,url:new URL(r.url).origin+new URL(r.url).pathname,bytes:r.body.byteLength,sha256:createHash('sha256').update(r.body).digest('hex'),at:new Date().toISOString()});check();
  }});
  if(fresh)await session.prepareNavigation(url,{timeoutMs:20_000});else await session.prepareObservedNavigation(url,{timeoutMs:20_000});
  void session.navigate(url,{waitUntil:'domcontentloaded'}).catch(e=>{if(!done){stage.errors.push(browserTransportError(e));stage.finish('NAVIGATION_ERROR');}});
  const value=await result;
  try{const snap=await session.snapshot();value.page={url:snap.url,title:snap.title,settlement:snap.settlement};}catch{}
  output.push(value);
  console.log(JSON.stringify({name,passed:value.passed,reason:value.reason,elapsedMs:value.elapsedMs,statuses:value.responses.map(r=>[r.key,r.status])}));
  return value;
 }finally{clearTimeout(timer);active=undefined;}
}
try{
 await runStage('TABELOG','https://tabelog.com/en/',['document','commons.js'],true);
 const tc=await runStage('TABLECHECK_SEARCH','https://www.tablecheck.com/en/japan/search',['document','main.js','catalog','geolocation'],true);
 if(!session.isClosed?.())await runStage('TABLECHECK_SHOP','https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc',['document','shop'],false);
 else output.push({name:'TABLECHECK_SHOP',passed:false,reason:'PRIOR_CONTEXT_CLOSED'});
}finally{
 await session?.close();
 await writeFile(join(root,'result.json'),JSON.stringify({sourceSHA:git('rev-parse','HEAD'),observations:output,calls:{fullLive:0,realModelCalls:0},note:'One observation per path, not full booking or stability acceptance'},null,2)+'\n',{flag:'wx'});
}
