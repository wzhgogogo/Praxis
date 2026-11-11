import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(process.cwd()+'/package.json');
const {chromium}=require('playwright-core');
const {PlaywrightReadNetworkGuard}=await import(process.cwd()+'/src/infrastructure/browser/playwright-read-network-guard.ts');
const events=[];const record=(kind,facts)=>events.push({ms:Date.now()-start,kind,...facts});const start=Date.now();
const server=createServer((req,res)=>{record('RECEIVER',{path:new URL(req.url,'http://a').pathname});res.setHeader('content-type','text/html');res.end('<form action="/result" method="get" target="_blank"><input name="q"><button>Go</button></form>');});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
try{const context=await browser.newContext({serviceWorkers:'block'});const cdp=context.newCDPSession.bind(context);let seq=0;
context.newCDPSession=async page=>{const s=await cdp(page),id=++seq;for(const name of ['Page.frameRequestedNavigation','Page.frameScheduledNavigation','Page.windowOpen','Fetch.requestPaused'])s.on(name,e=>record(name,{session:id,reason:e.reason,disposition:e.disposition,frame:e.frameId,path:e.url?new URL(e.url).pathname:e.request?.url?new URL(e.request.url).pathname:undefined}));return s;};
context.on('page',()=>record('PAGE',{}));context.on('requestfailed',r=>record('FAILED',{path:new URL(r.url()).pathname,error:r.failure()?.errorText}));context.on('requestfinished',r=>record('FINISHED',{path:new URL(r.url()).pathname}));
const guard=new PlaywrightReadNetworkGuard({documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]});await guard.install(context);
const page=await context.newPage();await guard.preparePage(context,page);guard.prepareNavigation(origin+'/');await page.goto(origin+'/');await guard.forms.observe(page);await page.locator('input').fill('FICTIONAL Customer Contact');await page.locator('button').click();
await new Promise(r=>setTimeout(r,1500));record('GUARD',{requests:guard.snapshotRequests(),diagnostics:guard.snapshotDiagnostics()});console.log(JSON.stringify(events,null,2));
}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
