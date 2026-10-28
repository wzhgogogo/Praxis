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
