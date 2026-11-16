import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {chromium} from 'playwright-core';
import {LocalPlaywrightChromium} from '../../../infrastructure/browser/local-playwright-chromium.js';
import {CloudflareBrowserRun} from '../../../infrastructure/browser/cloudflare-browser-run.js';
import type {BrowserRuntime,BrowserSession} from '../../../infrastructure/browser/browser-runtime.js';
import type {RestaurantCandidate} from '../../../domains/restaurant/contracts.js';

export const recordedUrl='https://www.tablecheck.com/en/nakamata-nodoguro-ginza?service_mode=dining&sort_by=relevance&venue_type=tc';
export const recordedQuote='Specializing in Nodoguro Ginza Nakamata';
export const privateRoomQuote='和モダンな店内には個室も備え、接待や会食、記念日など幅広いシーンでご利用いただけます。';
export const recordedAt='2026-11-16T05:00:00.000Z';
export const candidate:RestaurantCandidate={restaurant:{id:'recorded-main',outletName:recordedQuote,address:'東京都中央区銀座4-10-12 銀座サマリヤビルB1F',sourceIds:{tablecheck:'nakamata-nodoguro-ginza',tablecheckNativeGuideUri:recordedUrl},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};

// Preserved November9 snapshot5 + its actual CSS. No shop JSON was retained.
// All scripted interactions, delayed requests and inventory used by callers
// are LOCAL_CONSTRUCTION; never whole-website Replay or online stock evidence.
export async function recordedHtml(script='',prefix=''){
 const directory=new URL('../../fixtures/d8-direct-outlet-20261109/',import.meta.url);
 let html=await readFile(new URL('snapshot-0005.html',directory),'utf8');
 const provenance=JSON.parse(await readFile(new URL('snapshot-0005.html.provenance.json',directory),'utf8'));
 if(createHash('sha256').update(html).digest('hex')!==provenance.sha256)throw Error('Recorded DOM hash mismatch');
 const base='.eval-artifacts/phase3b/d8-direct-outlet-live-20261109/live-runtime/runs/D8/D8/recordings/g6-D8-1794193392450-0/';
 const manifest=JSON.parse(await readFile(base+'recording.json','utf8'));
 let css='';for(const row of manifest.stylesheets.slice(0,2)){const b=await readFile(base+row.file);if(createHash('sha256').update(b).digest('hex')!==row.sha256)throw Error('Recorded CSS hash mismatch');css+='\n'+b.toString();}
 html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,'');
 return html.replace('</head>','<style>'+css+'</style></head>').replace(/(<body\b[^>]*>)/i,'$1'+prefix).replace('</body>','<script>'+script+'</script></body>');
}

export async function recordedRuntime(html:string,options:{agedFetch?:boolean;kind?:'LOCAL'|'CLOUDFLARE';priorTextWait?:'quiet'|'changing'}={}){
 const sessions:BrowserSession[]=[],snapshots:Awaited<ReturnType<BrowserSession['snapshot']>>[]=[],controls:import('../../../infrastructure/browser/browser-runtime.js').BrowserPageControl[][]=[],scriptErrors:string[]=[],pages:import('playwright-core').Page[]=[],priorWaits:Array<{settled:boolean;visibleTextChanging:boolean|undefined;textChanged:boolean}>=[];let held:import('node:http').ServerResponse|undefined;
 const receiver=createServer((request,response)=>{response.setHeader('Access-Control-Allow-Origin','https://www.tablecheck.com');
  if(request.url?.startsWith('/v2/shops/')){held=response;return;}
  response.setHeader('Content-Type','text/html');response.end(html);
 });receiver.listen(0,'127.0.0.1');await once(receiver,'listening');const origin='http://127.0.0.1:'+((receiver.address() as import('node:net').AddressInfo).port);
 const browserType={async launch(options:Parameters<typeof chromium.launch>[0]){const browser=await chromium.launch(options),create=browser.newContext.bind(browser);browser.newContext=async opts=>{
  const context=await create(opts),route=context.route.bind(context);context.on('page',page=>{pages.push(page);page.on('pageerror',error=>scriptErrors.push(error.message));});
  context.route=(pattern,handler,opts)=>route(pattern,async(actual,request)=>{
   const wrapped=new Proxy(actual,{get(target,key){
    if(key==='fetch')return (opts:Parameters<typeof actual.fetch>[0])=>{const u=new URL(request.url());return target.fetch({...opts,url:origin+u.pathname+u.search});};
    // Static media/font reads stay entirely local too; admission still happens
    // in the actual Guard before it calls this transport boundary.
    if(key==='continue')return ()=>target.abort();
    const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
   }});return handler(wrapped,request);
  },opts);return context;
 };return browser;}};
 const raw:BrowserRuntime=options.kind==='CLOUDFLARE'?new CloudflareBrowserRun({accountId:'fixture',apiToken:'fixture',connectOverCdp:async()=>{const b=await browserType.launch({headless:true});await b.newContext();return b;}}):new LocalPlaywrightChromium({browserType,proxyServer:'http://127.0.0.1:9',directHosts:['127.0.0.1']});
 const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',async openSession(input){const session=await raw.openSession(input),navigate=session.navigate.bind(session),snapshot=session.snapshot.bind(session);
  session.navigate=async(url,opts)=>{await navigate(url,opts);if(options.agedFetch){const end=Date.now()+5000;while(!held&&Date.now()<end)await new Promise(r=>setTimeout(r,10));if(!held)throw Error('Constructed data request was not admitted');await new Promise(r=>setTimeout(r,3200));}};
  if(options.priorTextWait&&session.waitForSettled){const wait=session.waitForSettled.bind(session);let primed=false;session.waitForSettled=async(previous,timeout)=>{const before=primed?undefined:await pages.at(-1)!.locator('body').innerText();const settled=await wait(previous,primed?timeout:200);if(!primed){primed=true;priorWaits.push({settled,visibleTextChanging:session.settlementDiagnostics?.()?.visibleTextChanging,textChanged:before!==await pages.at(-1)!.locator('body').innerText()});if(options.priorTextWait==='quiet'){await pages.at(-1)!.evaluate(()=>clearInterval((window as unknown as {g1TextTimer:number}).g1TextTimer));await new Promise(r=>setTimeout(r,500));}}return settled;};}
  session.snapshot=async()=>{const page=await snapshot();const reported:typeof page=options.agedFetch?{...page,settlement:'SETTLED'}:page;snapshots.push(reported);return reported;};
  if(session.observeControls){const observe=session.observeControls.bind(session);session.observeControls=async hints=>{const value=await observe(hints);controls.push(value);return value;};}
  sessions.push(session);return session;
 }};
 return {runtime,snapshots,controls,scriptErrors,priorWaits,async close(){held?.destroy();await Promise.all(sessions.map(s=>s.close()));receiver.closeAllConnections();await new Promise<void>(r=>receiver.close(()=>r()));}};
}
