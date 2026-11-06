// Focused diagnostic Replay, not a product acceptance runner. Original D4
// documents, scripts, dynamic bodies and decisions only; no live fallback.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {channel} from 'node:diagnostics_channel';
import {chromium} from 'playwright-core';
import {LocalPlaywrightChromium} from '../../../../infrastructure/browser/local-playwright-chromium.js';
import {discoveryPackNetworkPolicy} from '../../../../integrations/restaurant-search/source-packs.js';
import {withRequestTimeline} from './browser-request-timeline.js';
import {safeRecord,safeUrl} from './browser-case-slice-evidence.js';
const [folder,output,transport='RECORDED_FETCH',competition='NONE']=process.argv.slice(2);assert.ok(folder&&output);
assert.ok(['RECORDED_FETCH','HAR_FALLBACK'].includes(transport));
assert.ok(['NONE','SNAPSHOT'].includes(competition));
const root=resolve(folder),recording=JSON.parse(await readFile(join(root,'recording.json'),'utf8'));
const har=JSON.parse(await readFile(join(root,'replay.har'),'utf8'));
const originalDocument=process.env.D4_REPLAY_DOCUMENT;
if(originalDocument){assert.ok(['snapshot-0001.html','snapshot-0002.html'].includes(originalDocument));har.log.entries.find((e:any)=>e.request.url==='https://tabelog.com/en/').response.content.text=await readFile(join(root,originalDocument),'utf8');}
const decisions=(await readFile(join(root,'../../execution.decisions.jsonl'),'utf8')).trim().split('\n').map(x=>JSON.parse(x));
const steps=decisions.filter(d=>d.sequence===4||d.sequence===5).map(d=>({decision:JSON.parse(d.outputText),context:JSON.parse(d.messages.find((m:any)=>m.role==='user').content),latencyMs:d.latencyMs}));
const trace:any[]=[],misses:any[]=[],fetches:any[]=[],browserErrors:any[]=[];
const emit=(kind:string,detail:unknown)=>trace.push({kind,detail:safeRecord(detail),at:performance.now()});
let competingSnapshot:Promise<void>|undefined;
const competitionResult:{startedAt?:number;finishedAt?:number;outcome?:string;error?:unknown}={};
const listener=(value:unknown)=>{
 emit('FORM_EVIDENCE',value);
 const event=value as {stage?:string;phase?:string};
 if(competition==='SNAPSHOT'&&!competingSnapshot&&event.stage==='SUBMISSION_SNAPSHOT'&&event.phase==='START'){
  competitionResult.startedAt=performance.now();
  competingSnapshot=session!.snapshot().then(()=>{competitionResult.outcome='COMPLETED';},error=>{competitionResult.outcome='FAILED';competitionResult.error=safeRecord(error instanceof Error?{name:error.name,message:error.message,cause:error.cause instanceof Error?{name:error.cause.name,message:error.cause.message}:error.cause}:error);}).finally(()=>{competitionResult.finishedAt=performance.now();});
 }
};channel('praxis.browser.form-evidence').subscribe(listener);
const temp=await mkdtemp(join(tmpdir(),'d4-search-stall-'));
const runtime=new LocalPlaywrightChromium({proxyServer:'http://127.0.0.1:9',browserType:{async launch(options){
 const browser=await chromium.launch(options),create=browser.newContext.bind(browser);
 browser.newContext=async options=>{
  const context=await create(options);context.on('page',page=>page.on('pageerror',error=>browserErrors.push({name:error.name,message:error.message.slice(0,240)})));
  const install=context.route.bind(context);
  context.route=(pattern,handler,options)=>install(pattern,async(actual,request)=>{
   const find=()=>har.log.entries.find((e:any)=>e.request.url===request.url()&&e.request.method===request.method()&&(e.request.postData?.text??'')===(request.postData()??''));
   const wrapped=new Proxy(actual,{get(target,key){if(key==='fulfill')return async(options:any)=>{const response=options.response;if(response)return target.fulfill({status:response.status(),headers:response.headers(),body:await response.body()});return target.fulfill(options);};if(key==='fetch')return async()=>{
    const e=find();fetches.push({url:safeUrl(request.url()),method:request.method(),found:Boolean(e)});
    if(!e){misses.push({method:request.method(),url:safeUrl(request.url()),queryKeys:[...new URL(request.url()).searchParams.keys()]});throw Error('RECORDED_RESPONSE_MISSING');}
    const headers=Object.fromEntries(e.response.headers.map((h:any)=>[h.name,h.value]));
    return{status:()=>e.response.status,headers:()=>headers,body:async()=>Buffer.from(e.response.content.text,e.response.content.encoding==='base64'?'base64':'utf8')};
   };const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
   return handler(wrapped,request);
  },options);return context;
 };return browser;
}}});
let session:Awaited<ReturnType<typeof runtime.openSession>>|undefined,error:unknown,guardRequests:unknown;
try{
 session=await withRequestTimeline({signal:new AbortController().signal,record:emit},()=>runtime.openSession({signal:new AbortController().signal,networkPolicy:discoveryPackNetworkPolicy(),...(transport==='HAR_FALLBACK'?{replayHarPath:join(root,'replay.har')}:{})}));
 await session.prepareNavigation!('https://tabelog.com/en/',{timeoutMs:20_000});await session.navigate('https://tabelog.com/en/',{waitUntil:'domcontentloaded',timeoutMs:20_000});
 for(const {decision,context,latencyMs} of steps){
  const target=context.observation.targets.find((t:any)=>t.ref===decision.targetRef);assert.ok(target);
  const controls=await session.observeControls!();emit('OBSERVED_CONTROLS',{controls:controls.map(c=>({id:c.id,label:c.label,kind:c.kind,readOnly:c.readOnly})),target});const matches=controls.filter(c=>c.label===target.label&&c.kind===target.kind);
  assert.equal(matches.length,1,'Original recorded target must uniquely match current observed public control');
  assert.ok(Number.isFinite(latencyMs)&&latencyMs>=0);await new Promise(resolve=>setTimeout(resolve,latencyMs));emit('ORIGINAL_ACTION',{action:decision.action,label:target.label,field:decision.authoritativeField});
  if(decision.action==='FILL_AUTHORITATIVE'){const before=await session.snapshot();await session.fill(matches[0]!.id,context.goal.retrievalExpression,{inputSource:context.goal.retrievalSource});await session.waitForSettled?.(before,2000);await session.snapshot();}
  else await session.click(matches[0]!.id,{timeoutMs:20_000});
 }
}catch(e){error=safeRecord(e instanceof Error?{name:e.name,message:e.message,cause:e.cause}:e);}
finally{guardRequests=await session?.snapshot().then(snapshot=>snapshot.networkRequests).catch(()=>undefined);await session?.close();await competingSnapshot;channel('praxis.browser.form-evidence').unsubscribe(listener);await rm(temp,{recursive:true,force:true});}
await writeFile(output,JSON.stringify({mode:'COMPONENT_REAL_RECORDING_REPLAY',transport,competition,competitionResult,originalDocument,error,guardRequests,trace,fetches,misses,browserErrors},null,2)+'\n');
console.log(JSON.stringify({transport,error,fetches:fetches.length,misses:misses.length}));
