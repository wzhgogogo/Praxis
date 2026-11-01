import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { LocalPlaywrightChromium } from "../../infrastructure/browser/local-playwright-chromium.js";
import { pageQuestionRuntime } from "../../integrations/restaurant-facts/page-question-read-budget.js";

test("G1 question permits two document visits across sessions, blocks the third before network and preserves Guard", async () => {
  const received: string[] = [];
  const server = createServer((request, response) => {
    received.push(request.method+" "+request.url);
    response.setHeader("content-type", "text/html");
    response.end('<h1>Bound merchant</h1><a href="/two">Merchant details</a><script>fetch("/blocked",{method:"POST",body:"fixture"}).catch(()=>{});</script>');
  });
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const origin="http://127.0.0.1:"+(server.address() as AddressInfo).port;
  const raw=new LocalPlaywrightChromium();
  const visits={used:0,limit:2,exhausted:false};
  const runtime=pageQuestionRuntime(raw,visits);
  const input={signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[],dynamicReads:[]}};
  try {
    const session=await runtime.openSession(input);
    try {
    assert.equal(session.metadata.readNetworkBoundary,"INSTALLED");
    await session.prepareNavigation!(origin+"/one");await session.navigate(origin+"/one");
    const controls=await session.observeControls!();
    const link=controls.find(c=>c.kind==="LINK"&&c.label==="Merchant details");
    assert.ok(link,"the second page comes from an actually observed public link");
    await session.prepareObservedNavigation!(link.href!);await session.openLink!(link.id,link.href);
    const page=await session.snapshot();assert.equal(page.url,origin+"/two");
    assert.ok(page.networkRequests?.some(r=>r.outcome==="BLOCKED"&&r.method==="POST"),"the unchanged read Guard blocks the unreviewed write");
    await session.prepareNavigation!(origin+"/three");
    await assert.rejects(()=>session.navigate(origin+"/three"),{code:"QUESTION_PAGE_BUDGET_EXHAUSTED"});
    assert.equal(visits.used,2);assert.equal(visits.exhausted,true);
    const other=await runtime.openSession(input);
    try {await other.prepareNavigation!(origin+"/four");await assert.rejects(()=>other.navigate(origin+"/four"),{code:"QUESTION_PAGE_BUDGET_EXHAUSTED"});}
    finally {await other.close();}
    assert.deepEqual(received,["GET /one","GET /two"],"neither the third/fourth page nor the prohibited POST reached the local receiver");
    } finally {await session.close();}
  } finally {server.closeAllConnections();server.close();await once(server,"close");}
});

test("G1 fresh Google page capture keeps the real Guard ahead of an unreviewed checkout, with a public-page control", {timeout:30_000},async()=>{
  const { pageQuestionCaptureFixture, captureQuote }=await import("../../integrations/restaurant-facts/fixtures/page-question-capture.js");
  const received:string[]=[];let html="";
  const server=createServer((request,response)=>{received.push(request.method+" "+request.url);response.setHeader("content-type","text/html");response.end(html);});
  server.listen(0,"127.0.0.1");await once(server,"listening");
  const origin="http://127.0.0.1:"+(server.address() as AddressInfo).port;
  const raw=new LocalPlaywrightChromium();let installed=0;
  const runtime:import("../../infrastructure/browser/browser-runtime.js").BrowserRuntime={readNetworkBoundaryCapability:raw.readNetworkBoundaryCapability,async openSession(input){
    const session=await raw.openSession(input);assert.equal(session.metadata.readNetworkBoundary,"INSTALLED");installed++;return session;
  }};
  try {
    const blocked=pageQuestionCaptureFixture("GOOGLE",runtime,origin+"/checkout");html=blocked.page.html;
    const result=await blocked.assembly.questions.answerQuestion(blocked.input,new AbortController().signal);
    assert.equal(installed,1,"page-capture acquisition must reach the installed Guard, rather than stop at the original no-gap check");
    assert.equal(result.status,"UNVERIFIED");assert.deepEqual(result.checkedPages,[]);assert.deepEqual(blocked.seen.requests,[],"no question or fact model after Guard rejection");
    assert.deepEqual(received,[],"the prohibited document never reached the independent HTTP receiver");
    const permitted=pageQuestionCaptureFixture("GOOGLE",runtime,origin+"/merchant");html=permitted.page.html;
    const answered=await permitted.assembly.questions.answerQuestion(permitted.input,new AbortController().signal);
    assert.equal(answered.status,"ANSWERED","the same guarded acquisition can read a permitted merchant page");assert.ok(answered.status==="ANSWERED");
    assert.equal(answered.citations[0]?.text,captureQuote);assert.deepEqual(received,["GET /merchant"]);
  } finally {server.closeAllConnections();server.close();await once(server,"close");}
});
