import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {setTimeout as wait} from 'node:timers/promises';
import {chromium} from 'playwright-core';
import {LocalPlaywrightChromium} from '../../../src/infrastructure/browser/local-playwright-chromium.js';
import {tableCheckPublicReadNetworkPolicy} from '../../../src/integrations/tablecheck/tablecheck-public-query.js';
import {BrowserReadRecording} from '../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.js';
import {traceBrowserRuntime} from '../../../src/eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
import {chargeG6} from '../../../src/eval/restaurant/agent-loop/g6/budget.js';
import {normalizedTextKey} from '../../../src/core/text-key.js';
import {isBrowserReadPathProhibited} from '../../../src/infrastructure/browser/browser-read-policy.js';
const base='.eval-artifacts/phase3b/tablecheck-text-search-20261107';
const spec=JSON.parse(await readFile(base+'/probe-spec.json','utf8'));
const sha=(v:Uint8Array|string)=>createHash('sha256').update(v).digest('hex');
assert.equal(sha(await readFile(spec.baselineRecorderModule)),spec.baselineRecorderSHA256);
const {BrowserReadRecording:BaselineRecorder}=await import(pathToFileURL(spec.baselineRecorderModule).href);
if(process.argv.includes('--preflight')){console.log('Imports and original baseline recorder bytes PASS; no browser/network/files created.');process.exit(0);}
assert.equal(process.env.PRAXIS_TABLECHECK_TEXT_PROBE,'1');
const sourceSHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(sourceSHA,process.argv[2]);assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
const out=base+'/probe-runtime';await mkdir(out,{recursive:false});await writeFile(out+'/budget.json',await readFile(base+'/probe-budget-seed.json'),{flag:'wx'});
const cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
await writeFile(out+'/started.json',JSON.stringify({atCET:cet(),sourceSHA,spec,model:0,live:0},null,2),{flag:'wx'});
let phase='START',pageReads=0,lastReadAt=0,selectedDocumentCharged=false;const events:any[]=[],responses:any[]=[],snapshots:any[]=[];
const policy={...tableCheckPublicReadNetworkPolicy,genericPublicRead:true};
const recorder=new BrowserReadRecording({directory:out,runId:'recording',reviewedReads:policy.dynamicReads,reviewedStaticResources:policy.staticResources});
const oldRecorder=new BaselineRecorder({directory:out,runId:'baseline-recorder',reviewedReads:policy.dynamicReads,reviewedStaticResources:policy.staticResources});
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),spec.maximumMs);let session:any,outcome:any;
// Eval-only pause point: Guard decides admission first; no request is fabricated.
// Charge a selected new main-frame document before its first CDP continue, never for SPA Fetch.
const browserType={launch:async(options:any)=>{
 const browser=await chromium.launch(options);const create=browser.newContext.bind(browser);
 browser.newContext=async(options:any)=>{
  const context=await create(options),newCDP=context.newCDPSession.bind(context);
  context.newCDPSession=async(target:any)=>{
   const cdp=await newCDP(target),send=cdp.send.bind(cdp);const paused=new Map<string,any>();let rootFrame='';
   cdp.on('Fetch.requestPaused',event=>{paused.set(event.requestId,event);});
   cdp.send=(async(method:any,params:any)=>{
    const event=method==='Fetch.continueRequest'?paused.get(params.requestId):undefined;
    if(event&&event.resourceType==='Document'&&event.request.method==='GET'&&event.frameId===rootFrame&&phase==='SELECT_MATCH'&&!selectedDocumentCharged){
     await wait(Math.max(0,spec.minimumIntervalMs-(Date.now()-lastReadAt)),undefined,{signal:controller.signal});
     await chargeG6(out+'/budget.json','C-TC-TEXT:spare-document','evaluationPublicGET','Approved spare only after actual selected main-document navigation, charged before Guard continuation');
     selectedDocumentCharged=true;pageReads++;lastReadAt=Date.now();events.push({kind:'SPARE_DOCUMENT_PRECHARGED',detail:{atCET:cet(),pageReads}});
    }
    const result=await send(method,params);
    if(method==='Page.getFrameTree')rootFrame=(result as any).frameTree.frame.id;
    return result;
   }) as typeof cdp.send;return cdp;
  };return context;
 };return browser;
}};
const sink=recorder.traceSink();
const runtime=traceBrowserRuntime(new LocalPlaywrightChromium({headless:true,admittedGetTransport:'BROWSER_GET_HEAD',browserType}),'TABLECHECK',(kind,detail)=>{events.push({sequence:events.length+1,kind,detail});return events.length;},{...sink,
 recordSnapshot:(snapshot,clean)=>{snapshots.push({phase,urlSha256:sha(snapshot.url),htmlSha256:sha(snapshot.html),urlQueryKeys:[...new URL(snapshot.url).searchParams.keys()]});recorder.recordSnapshot(snapshot);oldRecorder.recordSnapshot(snapshot);},
 recordResponse:async response=>{const u=new URL(response.url);responses.push({phase,origin:u.origin,pathname:u.pathname,method:response.method,resourceType:response.resourceType,status:response.status,queryKeys:[...u.searchParams.keys()],bodyBytes:response.body.byteLength});await recorder.recordResponse(response);await oldRecorder.recordResponse(response);}
});
const pause=async()=>wait(5000,undefined,{signal:controller.signal});
function inspectValues(snapshot:any,initialCount:number){
 return (snapshot.networkRequests??[]).slice(initialCount).filter((r:any)=>r.pathname==='/search/'&&r.origin==='https://search-v4.production.ap-northeast-1.aws.tablecheck.net').flatMap((r:any)=>(r.queryValues??[]).filter((f:any)=>['OTHER','PREFIX_OF_AUTHORITATIVE_INPUT','SENSITIVE_FORMAT'].includes(f.valueClass)).map((f:any)=>({method:r.method,outcome:r.outcome,...f})));
}
try{
 session=await runtime.openSession({signal:controller.signal,networkPolicy:policy});assert.equal(session.metadata.readNetworkBoundary,'INSTALLED');session.beginReadScope?.();
 await chargeG6(out+'/budget.json','C-TC-TEXT:entry','evaluationPublicGET','User-approved remaining probe page, before initial navigation');pageReads++;lastReadAt=Date.now();
 phase='ENTRY';await session.prepareNavigation(spec.startUrl,{timeoutMs:20000});await session.navigate(spec.startUrl,{waitUntil:'domcontentloaded',timeoutMs:20000});await session.waitForSettled?.({url:'',title:'',text:''},5000);
 let snapshot=await session.snapshot(),controls=await session.observeControls();
 const destination=controls.filter((c:any)=>c.visible&&!c.disabled&&c.kind==='BUTTON'&&/\bDestination\b/i.test(c.label)&&c.formMethod!=='POST');assert.equal(destination.length,1,'Expected one current observed Destination button');
 phase='OPEN_DESTINATION';await session.click(destination[0].id,{timeoutMs:5000});snapshot=await session.snapshot();controls=await session.observeControls();
 const input=controls.filter((c:any)=>c.visible&&!c.disabled&&!c.readOnly&&c.kind==='INPUT'&&/\bDestination\b/i.test(c.label)&&c.formMethod!=='POST');assert.equal(input.length,1,'Expected one current observed Destination input');
 const beforeFill=(snapshot.networkRequests??[]).length;
 phase='FILL_FULL_NAME';await session.fill(input[0].id,spec.query,{timeoutMs:5000,inputSource:'SPECIFIC_OUTLET'});await pause();await session.waitForSettled?.(snapshot,5000);snapshot=await session.snapshot();controls=await session.observeControls();
 const violations=inspectValues(snapshot,beforeFill);
 const matches=controls.filter((c:any)=>c.visible&&!c.disabled&&c.kind!=='INPUT'&&c.formMethod!=='POST'&&normalizedTextKey(c.label).includes(normalizedTextKey(spec.query))&&(!c.href||!isBrowserReadPathProhibited(policy,c.href)));
 events.push({kind:'OBSERVED_QUERY_OPTIONS',detail:{count:matches.length,controls:matches.map((c:any)=>({id:c.id,label:c.label,kind:c.kind,href:c.href??null})),violations}});
 if(violations.length){outcome={status:'STOP_VALUE_CLASS',violations};}
 else if(matches.length!==1){outcome={status:'STOP_NO_UNIQUE_SUGGESTION',matches:matches.length};}
 else{
  phase='SELECT_MATCH';const target=matches[0];
  if(target.kind==='LINK'&&target.href){await session.prepareObservedNavigation(target.href,{timeoutMs:20000});await session.openLink(target.id,target.href,{timeoutMs:20000});}
  else await session.click(target.id,{timeoutMs:5000});
  await pause();await session.waitForSettled?.(snapshot,5000);snapshot=await session.snapshot();await session.observeControls();
  const later=inspectValues(snapshot,beforeFill);outcome={status:later.length?'STOP_VALUE_CLASS':'SELECTED_RESULT_OBSERVED',violations:later,selectedDocumentCharged,currentUrlSha256:sha(snapshot.url),currentQueryKeys:[...new URL(snapshot.url).searchParams.keys()]};
 }
}catch(error){outcome={status:'STOP_OPERATION_FAILURE',phase,error:{name:error instanceof Error?error.name:'Error',message:error instanceof Error?error.message:'Unknown'}};}
finally{
 clearTimeout(timer);await session?.flushRecordedResponses?.();await session?.close();const current=await recorder.finish(),baseline=await oldRecorder.finish();
 const receipt={atCET:cet(),sourceSHA,outcome,pageReadsCharged:pageReads,model:0,live:0,recording:current,baselineRecorder:baseline};
 await writeFile(out+'/events.json',JSON.stringify(events,null,2),{flag:'wx'});await writeFile(out+'/responses.json',JSON.stringify(responses,null,2),{flag:'wx'});await writeFile(out+'/snapshot-hashes.json',JSON.stringify(snapshots,null,2),{flag:'wx'});await writeFile(out+'/receipt.json',JSON.stringify(receipt,null,2),{flag:'wx'});console.log(JSON.stringify(receipt));
}
