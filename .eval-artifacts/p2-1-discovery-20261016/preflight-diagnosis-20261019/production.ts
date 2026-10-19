import {writeFile,readFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {LocalPlaywrightChromium} from '../../../src/infrastructure/browser/local-playwright-chromium.js';
import {runSourceDataPreflight} from '../../../src/eval/restaurant/agent-loop/source-data-preflight.js';
import {resolveEffectiveLiveNetworkConfiguration,environmentWithEffectiveLiveNetwork} from '../../../src/eval/restaurant/agent-loop/live-preflight.js';
import {observeTableCheckSearchCount} from '../../../src/integrations/tablecheck/tablecheck-public-query.js';
const directory='.eval-artifacts/p2-1-discovery-20261016/preflight-diagnosis-20261019/production';
await mkdir(directory,{recursive:false});
const network=resolveEffectiveLiveNetworkConfiguration(process.env);
const env=environmentWithEffectiveLiveNetwork({...process.env,PRAXIS_BROWSER_ENGINE:'LOCAL_CHROMIUM'},network);
const rows:any[]=[];let page:any=null;const start=Date.now();
await writeFile(`${directory}/diagnosis.started.json`,JSON.stringify({startedAt:new Date().toISOString(),
 scriptSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),
 proxyMode:network.proxyMode,explicitBrowserProxy:!!env.PRAXIS_LOCAL_CHROMIUM_PROXY_SERVER,
 models:0,google:0,formalRuns:0},null,2),{flag:'wx'});
const original=LocalPlaywrightChromium.prototype.openSession;
LocalPlaywrightChromium.prototype.openSession=async function(input){
 const session=await original.call(this,{...input,recordResponse:async response=>{
   const u=new URL(response.url);rows.push({atMs:Date.now()-start,origin:u.origin,pathname:u.pathname,
    method:response.method,status:response.status,resourceType:response.resourceType,
    contentType:response.contentType,bytes:response.body.byteLength,
    count:observeTableCheckSearchCount(response)??null});
   await input.recordResponse?.(response);
 }});
 const close=session.close.bind(session);
 session.close=async()=>{
   try{const s=await session.snapshot();page={url:s.url,title:s.title,
    textExcerpt:s.text.slice(0,500),networkDiagnostics:s.networkDiagnostics??[],networkRequests:s.networkRequests??[]};}catch{}
   await close();
 };
 return session;
};
let outcome:any;
try{outcome=await runSourceDataPreflight({sourceIds:['tablecheck'],environment:env,artifactDirectory:directory});}
catch(e:any){outcome={code:e.code,name:e.name,sourceIds:e.sourceIds};}
finally{LocalPlaywrightChromium.prototype.openSession=original;}
const result={outcome,elapsedMs:Date.now()-start,responses:rows,page,models:0,google:0,formalRuns:0};
await writeFile(`${directory}/diagnosis.json`,JSON.stringify(result,null,2),{flag:'wx'});
console.log(JSON.stringify({outcome,elapsedMs:result.elapsedMs,
 searchResponses:rows.filter(r=>r.pathname==='/search/'),networkDiagnostics:page?.networkDiagnostics},null,2));
