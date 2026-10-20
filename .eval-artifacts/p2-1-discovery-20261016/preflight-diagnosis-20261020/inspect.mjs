import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';

const base=dirname(fileURLToPath(import.meta.url)),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const plan=JSON.parse(await readFile(resolve(base,'plan.json'),'utf8'));
const freeze=JSON.parse(await readFile(resolve(base,'freeze.json'),'utf8'));
for(const [path,hash] of Object.entries(freeze.files))assert.equal(sha(await readFile(path)),hash,path);
const mode=process.argv[2];assert(plan.modes.includes(mode),'UNKNOWN_MODE');
assert(process.argv.includes('--no-proxy'),'NO_PROXY_REQUIRED');
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:plan.worktree,encoding:'utf8'}).trim(),plan.productionHead);
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:plan.worktree,encoding:'utf8'}).trim(),'');
if(process.argv.includes('--plan-only')){console.log(JSON.stringify({mode,network:0,models:0,googleApi:0,source:plan.productionHead,url:plan.url}));process.exit(0);}
const directory=resolve(base,mode);await mkdir(directory);
const started=Date.now(),at=()=>Date.now()-started,rows=[],hooks=[],snapshots=[],work=[];
let nextId=0,firstPositiveMs=null,firstPositiveCount=null,stop=null,page,session,browser,context,outcome;
const ids=new WeakMap(),id=r=>{if(!ids.has(r))ids.set(r,++nextId);return ids.get(r);};
const safe=url=>{const u=new URL(url);return{origin:u.origin,pathname:u.pathname,queryKeys:[...new Set(u.searchParams.keys())].sort()};};
const endpoint=url=>{try{return new URL(url).pathname;}catch{return '';}};
const fromSource=path=>import(pathToFileURL(resolve(plan.worktree,path)).href);
const {LocalPlaywrightChromium}=await fromSource('src/infrastructure/browser/local-playwright-chromium.ts');
const {runSourceDataPreflight,SOURCE_REACHABILITY_CHECKS}=await fromSource('src/eval/restaurant/agent-loop/source-data-preflight.ts');
const {tableCheckDiscoveryPack:pack}=await fromSource('src/integrations/restaurant-search/source-packs.ts');
const {observeTableCheckSearchCount,tableCheckPublicSearchReads}=await fromSource('src/integrations/tablecheck/tablecheck-public-query.ts');
assert.equal(SOURCE_REACHABILITY_CHECKS.find(r=>r.sourceId==='tablecheck').url,plan.url);
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),plan.totalMs);
const notePositive=(count)=>{if(count>0&&firstPositiveMs===null){firstPositiveMs=at();firstPositiveCount=count;}};
function observe(p){
  page=p;
  p.on('request',r=>rows.push({atMs:at(),event:'request',id:id(r),...safe(r.url()),method:r.method(),type:r.resourceType()}));
  p.on('requestfinished',r=>rows.push({atMs:at(),event:'finished',id:id(r),...safe(r.url())}));
  p.on('requestfailed',r=>rows.push({atMs:at(),event:'failed',id:id(r),...safe(r.url()),error:r.failure()?.errorText}));
  p.on('pageerror',e=>rows.push({atMs:at(),event:'pageerror',name:e.name,messageHash:sha(Buffer.from(e.message))}));
  p.on('framenavigated',frame=>{if(frame===p.mainFrame()&&/\/(?:reserve|checkout|payment|confirm|login|account)(?:\/|$)/i.test(endpoint(frame.url()))){stop='UNEXPECTED_NEXT_STEP';controller.abort();}});
  p.on('response',r=>{
    const request=r.request(),row={atMs:at(),event:'response',id:id(request),...safe(r.url()),method:request.method(),type:request.resourceType(),status:r.status(),contentType:r.headers()['content-type']??''};rows.push(row);
    if(!['GET','HEAD','OPTIONS'].includes(request.method())){stop='NON_READ_RESPONSE';controller.abort();}
    if(!['/search/','/catalog.json','/ai_search','/v2/shop_search'].includes(endpoint(r.url())))return;
    work.push((async()=>{try{const body=await r.body();row.bodyBytes=body.length;row.bodySha256=sha(body);row.count=observeTableCheckSearchCount({url:r.url(),method:request.method(),status:r.status(),contentType:row.contentType,body})??null;row.bodyAtMs=at();notePositive(row.count);}catch{row.bodyUnavailable=true;}})());
  });
}
async function snapshot(label){
  try{
    const s=session?await session.snapshot():{url:page.url(),title:await page.title(),html:await page.content(),text:await page.locator('body').innerText()};
    const row={label,atMs:at(),url:s.url,title:s.title,parsedOutlets:pack.parseListing(s).outlets.length,visibleTextExcerpt:s.text.slice(0,5000),htmlSha256:sha(Buffer.from(s.html)),networkDiagnostics:s.networkDiagnostics??[],networkRequests:s.networkRequests??[]};snapshots.push(row);return row;
  }catch{snapshots.push({label,atMs:at(),unavailable:true});}
}
await writeFile(resolve(directory,'started.json'),JSON.stringify({startedAt:new Date(started).toISOString(),mode,plan,scriptSha256:sha(await readFile(fileURLToPath(import.meta.url))),models:0,googleApi:0,formalProbes:0},null,2),{flag:'wx'});
const originalOpen=LocalPlaywrightChromium.prototype.openSession;
try{
  if(mode==='production'){
    LocalPlaywrightChromium.prototype.openSession=async function(input){
      session=await originalOpen.call(this,{...input,recordResponse:async r=>{const count=observeTableCheckSearchCount(r);hooks.push({atMs:at(),...safe(r.url),method:r.method,resourceType:r.resourceType,status:r.status,bytes:r.body.length,bodySha256:sha(r.body),count:count??null});notePositive(count);await input.recordResponse?.(r);}});
      observe(session.page);const close=session.close.bind(session);let captured=false;
      session.close=async()=>{if(!captured){captured=true;await snapshot('before-production-close');}await close();};return session;
    };
    try{outcome=await runSourceDataPreflight({sourceIds:['tablecheck'],environment:{...process.env,PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM',PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER:'',PRAXIS_LOCAL_CHROMIUM_INTERACTIVE:'0'},artifactDirectory:directory});}
    catch(e){outcome={code:e.code,name:e.name,sourceIds:e.sourceIds};}
  }else{
    if(mode==='guarded'){
      session=await new LocalPlaywrightChromium().openSession({signal:controller.signal,recordResponse:r=>{const count=observeTableCheckSearchCount(r);hooks.push({atMs:at(),...safe(r.url),method:r.method,resourceType:r.resourceType,status:r.status,bytes:r.body.length,count:count??null});notePositive(count);},networkPolicy:{genericPublicRead:true,documentOrigins:pack.documentOrigins,staticResources:pack.staticResources,dynamicReads:pack.reviewedReads}});observe(session.page);
    }else{
      browser=await chromium.launch({headless:true});context=await browser.newContext({serviceWorkers:'block'});
      await context.route('**/*',async route=>{
        const r=route.request(),u=new URL(r.url()),method=r.method();
        if(['GET','HEAD'].includes(method)&&!(/\/(?:reserve|checkout|payment|confirm|login|account)(?:\/|$)/i.test(u.pathname)&&r.resourceType()==='document'))return route.continue();
        const headers=await r.allHeaders(),requested=(headers['access-control-request-headers']??'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
        const getRule=tableCheckPublicSearchReads.some(rule=>rule.origin===u.origin&&rule.pathname===u.pathname&&rule.methods?.includes('GET')&&rule.corsPreflight);
        if(method==='OPTIONS'&&getRule&&headers['sec-fetch-mode']==='cors'&&headers.origin==='https://www.tablecheck.com'&&headers['access-control-request-method']==='GET'&&requested.every(k=>k==='x-api-key')&&!r.postData())return route.continue();
        rows.push({event:'read-only-filter-block',atMs:at(),...safe(r.url()),method,type:r.resourceType()});await route.abort('blockedbyclient');
      });page=await context.newPage();observe(page);controller.signal.addEventListener('abort',()=>{void browser.close();},{once:true});
    }
    const nav=Date.now();await session?.prepareNavigation(plan.url,{timeoutMs:plan.requestMs});
    if(session)await session.navigate(plan.url,{waitUntil:'domcontentloaded',timeoutMs:plan.requestMs});else await page.goto(plan.url,{waitUntil:'domcontentloaded',timeout:plan.requestMs});
    const navMs=Date.now()-nav,deadline=Date.now()+plan.observeMs;let milestone=false;
    while(!controller.signal.aborted&&Date.now()<deadline){
      if(firstPositiveMs!==null){const s=await snapshot('first-positive');if(s?.parsedOutlets>0)break;}
      if(!milestone&&Date.now()>=deadline-plan.observeMs+20000){milestone=true;await snapshot('after20s');}
      await new Promise(r=>setTimeout(r,100));
    }
    outcome={navigationCompleted:true,navigationMs:navMs,firstPositiveMs,firstPositiveCount};await snapshot('final');
    if(page&&!page.isClosed())await page.screenshot({path:resolve(directory,'page.png'),fullPage:false}).catch(()=>{});
  }
}catch(e){outcome={code:e.code??null,name:e.name};}
finally{
  LocalPlaywrightChromium.prototype.openSession=originalOpen;clearTimeout(timer);
  await session?.close().catch(()=>{});await context?.close().catch(()=>{});await browser?.close().catch(()=>{});
  await Promise.allSettled(work);
}
const result={mode,startedAt:new Date(started).toISOString(),finishedAt:new Date().toISOString(),elapsedMs:at(),outcome,firstPositiveMs,firstPositiveCount,stop,rows,hooks,snapshots,models:0,googleApi:0,formalProbes:0,clicks:0,scope:'Current read-only diagnostic; does not relabel historical failures or resume B.'};
await writeFile(resolve(directory,'result.json'),JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({mode,elapsedMs:result.elapsedMs,outcome,firstPositiveMs,firstPositiveCount,stop,snapshots:snapshots.map(({label,atMs,parsedOutlets})=>({label,atMs,parsedOutlets})),requestEvents:rows.length}));
if(stop)process.exitCode=2;
