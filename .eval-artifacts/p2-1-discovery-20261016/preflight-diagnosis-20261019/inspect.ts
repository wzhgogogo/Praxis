import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { chromium, type Response } from 'playwright-core';
import { LocalPlaywrightChromium } from '../../../src/infrastructure/browser/local-playwright-chromium.js';
import { tableCheckDiscoveryPack } from '../../../src/integrations/restaurant-search/source-packs.js';
import { observeTableCheckSearchCount } from '../../../src/integrations/tablecheck/tablecheck-public-query.js';
import { SOURCE_REACHABILITY_CHECKS } from '../../../src/eval/restaurant/agent-loop/source-data-preflight.js';

const mode = process.argv[2];
if (!['exact', 'without-hook', 'prepared'].includes(mode!)) throw Error('Unknown diagnostic mode');
const base = '.eval-artifacts/p2-1-discovery-20261016/preflight-diagnosis-20261019';
const url = SOURCE_REACHABILITY_CHECKS.find(x => x.sourceId === 'tablecheck')!.url;
const startedAt = new Date().toISOString();
const rows: unknown[] = [], failed: unknown[] = [], hooked: unknown[] = [], work: Promise<unknown>[] = [];
let preflightCount: number | undefined;
const summary = (value: {url:string;method:string;status:number;contentType:string;body:Uint8Array}) => {
  const u = new URL(value.url);
  const count = observeTableCheckSearchCount(value);
  return { origin:u.origin, pathname:u.pathname, queryKeys:[...u.searchParams.keys()],
    method:value.method, status:value.status, contentType:value.contentType,
    bytes:value.body.byteLength, sha256:createHash('sha256').update(value.body).digest('hex'),
    count:count ?? null };
};
const interesting = (value:string) => /(^|\.)tablecheck\.(com|net)$/.test(new URL(value).hostname);
const runtime = new LocalPlaywrightChromium({ browserType:{launch:async options => {
  const browser = await chromium.launch(options);
  const original = browser.newContext.bind(browser);
  browser.newContext = async opts => {
    const context = await original(opts);
    context.on('page', page => {
      page.on('response', (response:Response) => {
        if (!interesting(response.url())) return;
        const u = new URL(response.url());
        const row:any = {origin:u.origin, pathname:u.pathname, method:response.request().method(),
          type:response.request().resourceType(), status:response.status(), contentType:response.headers()['content-type'] ?? ''};
        rows.push(row);
        if (u.pathname !== '/search/' && u.pathname !== '/catalog.json') return;
        work.push((async()=>{
          try { Object.assign(row, summary({url:response.url(),method:response.request().method(),
            status:response.status(),contentType:row.contentType,body:await response.body()})); }
          catch { row.bodyUnavailable = true; }
        })());
      });
      page.on('requestfailed', r => {
        if (!interesting(r.url())) return;
        const u = new URL(r.url()); failed.push({origin:u.origin,pathname:u.pathname,method:r.method(),
          type:r.resourceType(),failure:r.failure()?.errorText});
      });
    });
    return context;
  };
  return browser;
}}});
await writeFile(`${base}/${mode}.started.json`, JSON.stringify({mode,startedAt,url,
  scriptSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),
  models:0,google:0,clicks:0,scope:'One guarded read-only page, no formal probe or retry'},null,2),{flag:'wx'});
const signal = new AbortController(); const timer = setTimeout(()=>signal.abort(),45000);
let session:Awaited<ReturnType<typeof runtime.openSession>>|undefined;
let page:any=null, error:any=null, navigationMs:number|undefined;
try {
  session = await runtime.openSession({signal:signal.signal,
    ...(mode==='without-hook'?{}:{recordResponse: r => {
      if (!interesting(r.url)) return;
      const count=observeTableCheckSearchCount(r);
      if(count!==undefined) preflightCount=Math.max(preflightCount??0,count);
      hooked.push(summary(r));
    }}),
    networkPolicy:{genericPublicRead:true,documentOrigins:tableCheckDiscoveryPack.documentOrigins,
      staticResources:tableCheckDiscoveryPack.staticResources,dynamicReads:tableCheckDiscoveryPack.reviewedReads}});
  if(mode==='prepared')await session.prepareNavigation?.(url,{timeoutMs:30000});
  const start=Date.now();await session.navigate(url,{waitUntil:'domcontentloaded',timeoutMs:30000});navigationMs=Date.now()-start;
  const until=Date.now()+20000;
  while(!signal.signal.aborted&&Date.now()<until&&!(preflightCount!==undefined&&preflightCount>0)
    && !(mode==='without-hook'&&rows.some((x:any)=>x.pathname==='/search/'&&x.count>0)))
    await new Promise(r=>setTimeout(r,100));
  await Promise.race([Promise.allSettled(work),new Promise(r=>setTimeout(r,1000))]);
  const s=await session.snapshot();page={url:s.url,title:s.title,parsedOutlets:tableCheckDiscoveryPack.parseListing(s).outlets.length,
    resultBusy:tableCheckDiscoveryPack.browser!.resultBusy(s),visibleTextExcerpt:s.text.slice(0,500),
    networkDiagnostics:s.networkDiagnostics??[],networkRequests:s.networkRequests??[]};
}catch(e:any){error={code:e.code??null,name:e.name,message:String(e.message).slice(0,300)};}
finally{clearTimeout(timer);await session?.close();}
const result={mode,startedAt,finishedAt:new Date().toISOString(),url,navigationMs,error,
  preflightCount:preflightCount??null,rawResponses:rows,hookResponses:hooked,failed,page,models:0,google:0,clicks:0};
await writeFile(`${base}/${mode}.json`,JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({mode,error,navigationMs,preflightCount:preflightCount??null,
  parsedOutlets:page?.parsedOutlets,responseCount:rows.length,
  searchResponses:rows.filter((r:any)=>r.pathname==='/search/'),
  searchHookResponses:hooked.filter((r:any)=>r.pathname==='/search/'),
  failed,networkDiagnostics:page?.networkDiagnostics},null,2));
