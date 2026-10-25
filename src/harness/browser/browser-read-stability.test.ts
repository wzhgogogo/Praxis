import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { BrowserTaskExecutor, type BrowserExecutionDiagnostic } from "../../infrastructure/browser/browser-task-executor.js";
import type { BrowserRuntime, BrowserSession } from "../../infrastructure/browser/browser-runtime.js";
import { resultRegionBusy } from "../../integrations/restaurant-search/result-region-busy.js";
import { url, replayHar, localFixture } from "./browser-read-test-fixtures.js";

test("C3 settles delayed date results before asking the model and never completes from stale loading stock", async () => {
  for (const timeout of [false,true]) {
    const directory=await mkdtemp(join(tmpdir(),"settle-fixture-"));
    const origin="https://settle.example", target=origin+"/calendar";
    const html=`<title>Fixture</title><button id="date">Date 2026-10-23</button><div id="result"></div><script>
      date.onclick=()=>{result.innerHTML='<div class="loader" aria-busy="true">Loading</div><p>OLD_AVAILABLE</p>';
      ${timeout ? "" : "setTimeout(()=>{result.innerHTML='<fieldset><legend>Guests</legend><button id=guests>Guests 10</button></fieldset>';document.querySelector('#guests').onclick=()=>{document.querySelector('#guests').setAttribute('aria-pressed','true');result.insertAdjacentHTML('beforeend','<p>CURRENT_AVAILABLE</p>')};},650);"}}
    </script>`;
    const har=join(directory,"source.har");await writeFile(har,replayHar(target,html));
    const raw=new LocalPlaywrightChromium();const runtime:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",openSession:input=>raw.openSession({...input,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]},replayHarPath:har})};
    let calls=0, pendingHint=false;
    const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxModelCallsPerCandidate:4,maxOperationsPerCandidate:40,maxElapsedMsPerCandidate:20_000,modelDecision:{async decide(value){calls++;if(calls===1)return {type:"CLICK_AUTHORITATIVE",field:"DATE",targetRef:value.observation.targets.find(x=>x.label==='Date 2026-10-23')!.ref,reason:"Select requested date"};pendingHint=value.progress.includes('still loading');const guests=value.observation.targets.find(x=>x.label==='Guests 10');return guests?{type:"CLICK_AUTHORITATIVE",field:"PARTY_SIZE",targetRef:guests.ref,reason:"Select requested party"}:{type:"REQUEST_HUMAN_HELP",reason:"Loading has not settled"};}}});
    const signal=new AbortController().signal;const session=await executor.acquire(signal,"FIXTURE","AVAILABILITY");
    try {
      await executor.navigate({session,signal,source:"FIXTURE",stage:"AVAILABILITY",allowedOrigins:[origin],url:target});
      const result=await executor.runSkill({taskId:"settle",session,signal,source:"FIXTURE",stage:"AVAILABILITY",allowedOrigins:[origin],goal:{outlet:{name:"Fixture"},date:"2026-10-23",partySize:10,hardCriteria:[]},objective:"Select date and guests",completion:snapshot=>({complete: /CURRENT_AVAILABLE|OLD_AVAILABLE/.test(snapshot.text),reason:"Select party after date loads", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: resultRegionBusy(snapshot.html, /\bresult\b/, /carousel|suggestions/) })});
      assert.equal(result.status,timeout?"REQUESTED_HUMAN_HELP":"COMPLETED");
      assert.equal(calls,2);
      if(timeout)assert.equal(pendingHint,true);
    } finally {await executor.close();await rm(directory,{recursive:true,force:true});}
  }
});

test("C3 visible-state fallback settles attribute-only carousel and rejects changing text or skeleton", async () => {
  for (const mode of ["carousel", "text", "skeleton"] as const) {
    const runtime = localFixture(`<title>Stable-result Fixture</title><div id="result">CURRENT_RESULT${mode === "skeleton" ? '<div class="skeleton">Loading</div>' : ''}</div><button>Guests 2</button><aside id="carousel">Carousel</aside><script>
      let n=0;setInterval(()=>{${mode === "text" ? "result.textContent+=' batch '+(++n);" : "carousel.setAttribute('data-frame',String(++n));"}},150);
    </script>`);
    const diagnostics: BrowserExecutionDiagnostic[] = [];
    const executor = new BrowserTaskExecutor(runtime, { maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24,  maxElapsedMsPerCandidate: 20_000, onDiagnostic: d => diagnostics.push(d), modelDecision: { async decide() { return { type: "REQUEST_HUMAN_HELP", reason: "Pending Fixture must not complete" }; } } });
    const signal = new AbortController().signal;
    const session = await executor.acquire(signal, "FIXTURE", "AVAILABILITY");
    try {
      await executor.navigate({ session, signal, source: "FIXTURE", stage: "AVAILABILITY", allowedOrigins: ["https://www.tablecheck.com"], url });
      const read = await executor.runSkill({ taskId: `settle:${mode}`, source: "FIXTURE", stage: "AVAILABILITY", session, signal, allowedOrigins: ["https://www.tablecheck.com"], goal: {outlet:{name:"Fixture"},partySize:2,hardCriteria:[]}, objective:"Read current result", completion:snapshot=>({complete:snapshot.text.includes("CURRENT_RESULT"),reason:"Current result missing", resultKey: JSON.stringify([snapshot.url, snapshot.text, snapshot.interactiveState]), resultBusy: resultRegionBusy(snapshot.html, /\bresult\b/, /carousel|suggestions/) }) });
      assert.equal(read.status, mode === "carousel" ? "COMPLETED" : "REQUESTED_HUMAN_HELP", mode);
      assert.equal(read.snapshot.settlement, mode === "carousel" ? "SETTLED" : "PENDING", mode);
      const waits = diagnostics.filter(d => d.event === "ASYNC_WAIT");
      assert.ok(waits.length > 0);
      assert.ok(waits.every(d => (d.waitMs ?? 0) >= 300));
      assert.equal(waits.some(d => d.detail === "PAGE_STILL_LOADING_WITHIN_BOUND"), mode !== "carousel");
    } finally { await executor.close(); }
  }
});

test("C4 blocks repeated toggle state but allows the same Next control on changed pages", async () => {
  for (const mode of ["toggle", "pagination"] as const) {
    const runtime=localFixture(`<title>Navigation Fixture</title><button id="next" aria-expanded="false">${mode==='toggle'?'Filters':'Next'}</button><output id="result">${mode==='toggle'?'Closed':'Page 0'}</output><script>let clicks=0;next.onclick=()=>{clicks++;${mode==='toggle'?"next.setAttribute('aria-expanded',String(clicks%2===1));result.textContent=clicks%2?'Open':'Closed';":"result.textContent='Page '+clicks;"}}</script>`);
    let calls=0;const history: import("../../infrastructure/browser/browser-action-decision.js").BrowserReadHistoryStep[][]=[];
    const diagnostics:BrowserExecutionDiagnostic[]=[];
    const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsTotal: 12, maxModelCallsPerCandidate:6,maxOperationsPerCandidate:100,maxElapsedMsPerCandidate:15000,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(value){calls++;history.push(value.history);return {type:"CLICK",targetRef:value.observation.targets.find(x=>x.label===(mode==='toggle'?'Filters':'Next'))!.ref,reason:"Advance current navigation"};}}});
    const signal=new AbortController().signal;const session=await executor.acquire(signal,"FIXTURE","DISCOVERY");
    try{
      await executor.navigate({session,signal,source:"FIXTURE",stage:"DISCOVERY",allowedOrigins:["https://www.tablecheck.com"],url});
      const read=await executor.runSkill({taskId:`repeat:${mode}`,session,signal,source:"FIXTURE",stage:"DISCOVERY",allowedOrigins:["https://www.tablecheck.com"],goal:{outlet:{name:"Fixture"},hardCriteria:[]},objective:"Advance public navigation",completion:s=>({complete:mode==='pagination'&&s.text.includes('Page 3'),reason:"Keep advancing", resultKey: JSON.stringify([s.url, s.text, s.interactiveState]), resultBusy: false })});
      assert.equal(read.status,mode==='toggle'?"NO_SAFE_ACTION":"COMPLETED");
      const repeats=diagnostics.filter(d=>d.detail==='REPEATED_FROM_SAME_STATE');
      assert.equal(repeats.length,mode==='toggle'?2:0,mode);
      assert.equal(calls,mode==='toggle'?4:3);
      if(mode==='toggle'){
        assert.match(read.snapshot.text,/Filters\s*Closed/);
        assert.equal(history[3]!.at(-1)?.reason,'REPEATED_FROM_SAME_STATE');
      }
    }finally{await executor.close();}
  }
});


test("C3b rotating suggestions accept identical bound results but changing results and skeleton remain pending", async () => {
  for (const mode of ["suggestions", "append", "skeleton", "unrelated-skeleton"] as const) {
    const diagnostics: BrowserExecutionDiagnostic[] = [];
    const runtime=localFixture(`<title>Result fixture</title><section id="result">Venue A${mode==='skeleton'?'<div class="skeleton">Loading</div>':''}</section><aside id="suggestions">Suggestion 0</aside>${mode==='unrelated-skeleton'?'<div class="image skeleton">Loading</div>':''}<script>let n=0;setInterval(()=>{suggestions.textContent='Suggestion '+(++n);${mode==='append'?"result.textContent+=' Venue '+n;":''}},120)</script>`);
    const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, maxElapsedMsPerCandidate:20_000,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(){return {type:"REQUEST_HUMAN_HELP",reason:"Incomplete current result"};}}});
    const signal=new AbortController().signal;const session=await executor.acquire(signal,"FIXTURE","DISCOVERY");
    try {
      await executor.navigate({session,signal,source:"FIXTURE",stage:"DISCOVERY",allowedOrigins:["https://www.tablecheck.com"],url});
      const read=await executor.runSkill({taskId:"bound-result",session,signal,source:"FIXTURE",stage:"DISCOVERY",allowedOrigins:["https://www.tablecheck.com"],goal:{outlet:{name:"Fixture"},hardCriteria:[]},objective:"Read result set",completion:s=>({complete:s.text.includes("Venue A"),reason:"Missing venues",resultKey:s.html.match(/<section id="result">([^<]*)/)?.[1] ?? "", resultBusy: resultRegionBusy(s.html, /\bresult\b/, /carousel|suggestions/) })});
      assert.equal(read.status,(mode==='suggestions'||mode==='unrelated-skeleton')?"COMPLETED":"REQUESTED_HUMAN_HELP",mode);
      assert.equal(read.snapshot.settlement,(mode==='suggestions'||mode==='unrelated-skeleton')?"SETTLED":"PENDING",mode);
      assert.ok(diagnostics.filter(d=>d.event==='ASYNC_WAIT').every(d=>d.url===url),"navigation wait uses actual URL");
    } finally {await executor.close();}
  }
});


test("C3b Chromium ignores an outstanding image once data has completed", async () => {
  const sockets=new Set<import("node:net").Socket>();
  const server=createServer((request,response)=>{
    if(request.url==='/image'){return;}
    response.setHeader('content-type','text/html');response.end('<title>Data ready</title><p>CURRENT_RESULT</p><img src="/image">');
  });
  server.on('connection',socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();assert.ok(address&&typeof address!=='string');
  const origin=`http://127.0.0.1:${address.port}`;
  const executor=new BrowserTaskExecutor(new LocalPlaywrightChromium(), { maxAutomaticElapsedMs: 300_000,  maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24 });
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','DISCOVERY',{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]});
  try{
    const started=Date.now();
    await executor.navigate({session,signal,source:'FIXTURE',stage:'DISCOVERY',allowedOrigins:[origin],url:origin});
    const snapshot=await executor.snapshot({session,signal,source:'FIXTURE',stage:'DISCOVERY'});
    assert.equal(snapshot.settlement,'SETTLED');assert.ok(Date.now()-started<5000);
    assert.equal(snapshot.settlementDiagnostics?.pendingByType.image,1);
    assert.equal(snapshot.settlementDiagnostics?.blockingDataRequests,0);
  }finally{await executor.close();for(const socket of sockets)socket.destroy();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});



test('model full-page OPEN_LINK allows slow DOMContentLoaded and times out only within the remaining navigation budget',{timeout:45_000},async t=>{
 for(const mode of ['slow','budget'] as const){
  // Real 6.5s navigation remains; a test clock controls the budget case.
  let clock=0;
  if(mode==='budget')t.mock.method(Date,'now',()=>clock);
  const delays=new Set<ReturnType<typeof setTimeout>>();
  const server=createServer((request,response)=>{
   if(request.url==='/start'){response.end('<title>Fixture</title><a href="/next">Public result</a>');return;}
   if(mode==='budget')return; // The source cannot finish before the navigation budget expires.
   const timer=setTimeout(()=>{delays.delete(timer);response.end('<title>Destination</title><h1>Loaded destination</h1>');},6500);delays.add(timer);response.on('close',()=>{clearTimeout(timer);delays.delete(timer);});
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};const origin=`http://127.0.0.1:${address.port}`;
  const diagnostics:BrowserExecutionDiagnostic[]=[];let calls=0;
  const navigationBudgets:number[]=[];
  const raw=new LocalPlaywrightChromium();
  const runtime:BrowserRuntime={readNetworkBoundaryCapability:'ISOLATED_CONTEXT',async openSession(input){
   const opened=await raw.openSession(input),openLink=opened.openLink!.bind(opened);
   opened.openLink=async(target,href,options)=>{navigationBudgets.push(options?.timeoutMs??-1);return openLink(target,href,options);};return opened;
  }};
  const executor=new BrowserTaskExecutor(runtime,{ maxAutomaticElapsedMs: 300_000, maxModelCallsPerCandidate: 6, maxModelCallsTotal: 12, maxOperationsPerCandidate: 24, maxElapsedMsPerCandidate:30_000,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(input){calls++;if(mode==='budget')clock=25_000;return {type:'OPEN_LINK',targetRef:input.observation.targets.find(t=>t.label==='Public result')!.ref,reason:'Read observed public page'};}}});
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','DISCOVERY');
  try{
   await executor.navigate({source:'FIXTURE',stage:'DISCOVERY',session,signal,allowedOrigins:[origin],url:origin+'/start'});const started=Date.now();
   if(mode==='budget')clock=1500; // Deterministic setup/load cost; no machine-speed dependency.
   const reading=executor.runSkill({taskId:'slow-navigation',source:'FIXTURE',stage:'DISCOVERY',session,signal,allowedOrigins:[origin],goal:{outlet:{name:'Fixture'},hardCriteria:[]},objective:'Read public result',completion:page=>({complete:page.text.includes('Loaded destination'),resultKey:page.url,resultBusy:false,reason:'Observe destination document'})});
   if(mode==='slow'){const read=await reading;assert.equal(read.status,'COMPLETED');assert.ok(Date.now()-started>=6000);assert.equal(read.snapshot.url,origin+'/next');}
   else{await assert.rejects(reading,{code:'BROWSER_TIMEOUT'});assert.deepEqual(navigationBudgets,[5000],'timeout must exercise OPEN_LINK with its remaining navigation budget, not expire during setup');assert.equal(clock,25_000,'the remaining budget is controlled independently of machine speed');assert.ok(diagnostics.some(d=>d.event==='OPERATION_FAILED'&&d.lifecycle.failureCode==='BROWSER_TIMEOUT'));}
   assert.equal(calls,1);
  }finally{await executor.close();for(const timer of delays)clearTimeout(timer);server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
  assert.equal(diagnostics.filter(d=>d.event==='CLOSED').length,1,'the owned session closes once, including timeout');
 }
});
