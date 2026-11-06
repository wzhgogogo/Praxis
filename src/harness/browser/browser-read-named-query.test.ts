import assert from "node:assert/strict";
import test from "node:test";
import {readFile,mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {chromium} from "playwright-core";
import {LocalPlaywrightChromium} from "../../infrastructure/browser/local-playwright-chromium.js";
import {BrowserTaskExecutor} from "../../infrastructure/browser/browser-task-executor.js";
import {discoveryPackNetworkPolicy} from "../../integrations/restaurant-search/source-packs.js";
import {tabelogNameSearchCompletion} from "../../integrations/tabelog/tabelog-browser-availability.js";
import {loadReplayRecording,recordedResponse} from "../../eval/restaurant/agent-loop/runners/replay-read-recording.js";

const root=".eval-artifacts/phase3b/d4-d8-live-20261106/D8-runtime/runs/D8/D8";

// Component Replay: original source documents/scripts and real Chromium/Guard;
// fixture COMPLETE tests the new result-list contract, not model performance.
test("D8 real unnamed search box and script-populated hidden query reach a guarded bound list",{timeout:90000},async()=>{
 const directory=await mkdtemp(join(tmpdir(),"d8-query-receipt-"));
 const recording=await loadReplayRecording(join(root,"recordings/g6-D8-1793957744540-0"),join(directory,"source.har"));
 const decisions=(await readFile(join(root,"execution.decisions.jsonl"),"utf8")).trim().split("\n").map(line=>JSON.parse(line));
 const originals=decisions.filter(row=>row.sequence===7||row.sequence===8);
 assert.equal(originals.length,2);
 const missing:string[]=[];
 const runtime=new LocalPlaywrightChromium({proxyServer:"http://127.0.0.1:9",browserType:{async launch(options){
  const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
  browser.newContext=async options=>{
   const context=await newContext(options),route=context.route.bind(context),newPage=context.newPage.bind(context);
   context.newPage=async()=>{const page=await newPage();await page.clock.install({time:new Date(originals[0].startedAt)});return page;};
   context.route=(pattern,handler,options)=>route(pattern,async(actual,request)=>{
    const wrapped=new Proxy(actual,{get(target,key){
     if(key==="fetch")return async()=>{
      const entry=recordedResponse(recording,request.url(),request.method(),request.postData()??undefined);
      if(!entry){missing.push(new URL(request.url()).origin+new URL(request.url()).pathname);throw Error("RECORDED_RESPONSE_MISSING");}
      return {status:()=>entry.response.status,headers:()=>Object.fromEntries(entry.response.headers.map((h:any)=>[h.name,h.value])),body:async()=>Buffer.from(entry.response.content.text,entry.response.content.encoding==="base64"?"base64":"utf8")};
     }
     if(key==="fulfill")return async(options:any)=>options.response?target.fulfill({status:options.response.status(),headers:options.response.headers(),body:await options.response.body()}):target.fulfill(options);
     const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;
    }});return handler(wrapped,request);
   },options);return context;
  };return browser;
 }}});
 let step=0;
 const executor=new BrowserTaskExecutor(runtime,{maxAutomaticElapsedMs:60000,maxModelCallsPerCandidate:5,maxModelCallsTotal:5,maxOperationsPerCandidate:60,
  modelDecision:{async decide(input){
   const original=originals[step++];
   if(!original)return {type:"COMPLETE",reason:"Fixture asks code to verify the captured query result list; adapter identity is a later step"};
   const context=JSON.parse(original.messages.find((m:any)=>m.role==="user").content),wire=JSON.parse(original.outputText);
   const from=context.observation.targets.find((target:any)=>target.ref===wire.targetRef);
   const matches=input.observation.targets.filter(target=>["kind","role","label","type"].every(key=>(target as any)[key]===(from as any)[key]));
   assert.equal(matches.length,1,"Original action has one observed semantic target");
   return wire.action==="FILL_AUTHORITATIVE"?{type:"FILL_AUTHORITATIVE",field:"RETRIEVAL",targetRef:matches[0]!.ref,reason:wire.reason}:{type:"CLICK",targetRef:matches[0]!.ref,reason:wire.reason};
  }}});
 try{
  const signal=new AbortController().signal,session=await executor.acquire(signal,"TABELOG","DISCOVERY",discoveryPackNetworkPolicy());
  const result=await executor.search({source:"TABELOG",signal,session,allowedOrigins:["https://tabelog.com"],url:"https://tabelog.com/en/",query:"Nakamata",completion:tabelogNameSearchCompletion});
  const receipt=result.snapshot.networkRequests?.find(row=>row.formSubmission?.fields.some(field=>field.key==="sw"));
  assert.ok(receipt,"Source scripts and unchanged Guard produce a hidden-field receipt before the absent HAR result response");
  // Original result HTML is NOT_REPLAYABLE. Do not invent a response. This
  // second component replays actual recorded text/links with the source parser
  // replaced. It proves query binding, not downstream adapter identity.
  const contexts=[7,8,9].map(sequence=>JSON.parse(decisions.find(row=>row.sequence===sequence).messages.find((m:any)=>m.role==="user").content));
  let frame=0,action=0;
  const pages=await Promise.all(["snapshot-0007.html","snapshot-0008.html"].map(file=>readFile(join(root,"recordings/g6-D8-1793957744540-0",file),"utf8")));
  const observedSession={metadata:session.metadata,
   async navigate(){frame=0;},async snapshot(){const observation=contexts[frame].observation;return {url:observation.url,title:observation.title,text:observation.visibleText,html:pages[frame]??"",networkRequests:frame===2?[receipt]:[]};},
   async observeControls(){return contexts[frame].observation.targets.map((target:any)=>({...target,id:target.ref,stableKey:target.ref,visible:true,disabled:false}));},
   async fill(){frame=1;},async click(){frame=2;},async select(){return [];},async screenshot(){return new Uint8Array();},async close(){},async waitFor(){},async waitForSettled(){return true;},
  };
  const component=new BrowserTaskExecutor({openSession:async()=>observedSession},{maxAutomaticElapsedMs:10000,maxModelCallsPerCandidate:5,maxModelCallsTotal:5,maxOperationsPerCandidate:50,
   modelDecision:{async decide(input){
    const original=originals[action++];if(!original)return {type:"COMPLETE",reason:"Fixture completion at the actual recorded result LIST"};
    const wire=JSON.parse(original.outputText),originalContext=JSON.parse(original.messages.find((m:any)=>m.role==="user").content),from=originalContext.observation.targets.find((t:any)=>t.ref===wire.targetRef);
    const target=input.observation.targets.find(t=>t.kind===from.kind&&t.label===from.label)!;
    return wire.action==="FILL_AUTHORITATIVE"?{type:"FILL_AUTHORITATIVE",field:"RETRIEVAL",targetRef:target.ref,reason:wire.reason}:{type:"CLICK",targetRef:target.ref,reason:wire.reason};
   }}});
  try{
   await component.acquire(signal,"TABELOG","DISCOVERY",discoveryPackNetworkPolicy());
   const bound=await component.search({source:"TABELOG",signal,session:observedSession,allowedOrigins:["https://tabelog.com"],url:"https://tabelog.com/en/",query:"Nakamata",
    completion:()=>({complete:frame===2,resultKey:String(frame),resultBusy:false,resultUrls:contexts[2].observation.targets.filter((t:any)=>t.kind==="LINK"&&t.href?.includes("13186922")).map((t:any)=>t.href),reason:"Actual recorded list observation; original HTML was not saved"})});
   assert.equal(bound.status,"COMPLETED",bound.reasonCode);
   assert.ok(contexts[2].observation.targets.some((t:any)=>t.href?.includes("13186922")),"Actual W2 link observed on the list");
  }finally{await component.closeAll();}
 }finally{await executor.closeAll();await rm(directory,{recursive:true,force:true});}
});
