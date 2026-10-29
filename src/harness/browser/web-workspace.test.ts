import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { chromium, type Page } from "playwright-core";
import type { RestaurantCaseView } from "../../application/agent-workspace.js";
import type { RestaurantTaskState } from "../../domains/restaurant/contracts.js";
import { startWorkspaceFixture } from "../workspace-fixture-server.js";

// Real browser -> HTTP/SSE -> application, interpreter/compiler, Router, reducer and PGlite.
// Only model and source transports are synthetic. This is not a model or live-site evaluation.
const sizes=[{name:"mobile",width:390,height:844},{name:"desktop",width:1280,height:900}];
async function capture(page:Page,name:string,scrollTarget?:string){
  const folder=process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT;if(!folder)return;
  await mkdir(folder,{recursive:true});await page.evaluate(()=>{window.scrollTo(0,0);return document.fonts.ready.then(()=>undefined);});
  await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished)));
  if(scrollTarget)await page.locator(scrollTarget).scrollIntoViewIfNeeded();
  await page.screenshot({path:join(folder,name+".png"),fullPage:false});
}
async function createPlan(page:Page,message:string){
  await page.locator("#message").fill(message);
  const reply=page.waitForResponse(r=>new URL(r.url()).pathname==="/api/cases"&&r.request().method()==="POST");
  await page.locator("#send").click();const response=await reply;assert.equal(response.status(),201);
  return (await response.json()).view as RestaurantCaseView;
}
async function current(page:Page,id:string):Promise<RestaurantCaseView>{
  const response=await page.request.get("/api/cases/"+encodeURIComponent(id));assert.equal(response.status(),200);
  return (await response.json()).view;
}
async function ready(page:Page){
  await page.waitForFunction(()=>document.getElementById("card-counter")?.textContent==="1 of 3");
  await page.locator("#progress").waitFor({state:"hidden"});
}
async function signIn(page:Page,baseUrl:string,time:Date){
  page.setDefaultTimeout(10_000);
  await page.clock.install({time});await page.goto(baseUrl);
  await page.getByLabel("Access token",{exact:true}).fill("workspace-fixture");
  await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await page.getByRole("heading",{name:"What do you want to plan?",exact:true}).waitFor();
}
async function openPlan(page:Page,id:string){
  const menu=page.locator("#menu");if(await menu.isVisible())await menu.click();
  await page.locator('.case-link[data-case-id="'+id+'"]').click();
  await page.waitForFunction(id=>document.querySelector('.case-link.active')?.getAttribute('data-case-id')===id,id);
}
async function noSelection(host:Awaited<ReturnType<typeof startWorkspaceFixture>>,id:string){
  const artifact=await host.application.exportReadArtifact(id);
  const snapshot=artifact.finalSnapshot as {domainState:RestaurantTaskState};
  assert.equal(snapshot.domainState.selectedCandidateId,undefined);
  assert.equal(snapshot.domainState.selectedOfferId,undefined);
  assert.doesNotMatch(JSON.stringify(artifact.events),/"CANDIDATE_SELECTED"|"BOOKING_COMMITTED"|"AUTHORIZATION_GRANTED"/);
}

for(const size of sizes){
  test("Workspace "+size.name+": progressive card, saved isolation, preserved position, current reference and B1 return",{timeout:60_000},async()=>{
    const host=await startWorkspaceFixture({staged:true});
    const browser=await chromium.launch({headless:true});
    const context=await browser.newContext({baseURL:host.baseUrl,viewport:{width:size.width,height:size.height}});
    const page=await context.newPage(),errors:string[]=[],writes:Array<{path:string;body:Record<string,unknown>}>=[];
    let destinationRequests=0;
    page.on("pageerror",e=>errors.push(e.message));
    page.on("request",r=>{if(r.method()==="POST")writes.push({path:new URL(r.url()).pathname,body:r.postDataJSON()});});
    // A departure is observed in a local receiver; no browser request reaches a real source.
    await context.route("https://www.tablecheck.com/**",route=>{destinationRequests++;return route.fulfill({contentType:"text/html",body:"<h1>Fixture destination</h1>"});});
    try{
      await signIn(page,host.baseUrl,host.clock.now());await capture(page,size.name+"-home");
      const plan=await createPlan(page,"Dinner with friends");
      await host.waitForCheck();
      await page.getByRole("heading",{name:"Fixture Sushi",exact:true}).waitFor();
      assert.equal(await page.locator("#card-counter").innerText(),"1 of 1","first outlet is visible while the second source is still held");
      assert.match(await page.locator("#stages").innerText(),/Checking availability 1 of 3/);
      assert.equal((await current(page,plan.case.caseId)).restaurant.progress.discoveredCount,3);
      assert.equal(host.providerCalls[1]?.completed,false);
      await capture(page,size.name+"-searching");
      await page.locator("#bookmark").click();
      await page.getByRole("button",{name:"Saved 1",exact:true}).waitFor();
      await page.locator("#message").fill("Keep this unsent adjustment");
      const card=await page.locator("#candidate-card").elementHandle();
      host.release();await ready(page);
      assert.equal(await page.locator("#message").inputValue(),"Keep this unsent adjustment");
      assert.equal(await page.locator("#restaurant-name").innerText(),"Fixture Sushi");
      assert.equal(await page.locator("#candidate-card").evaluate((node,old)=>node===old,card),true,"SSE must retain the card DOM");
      await capture(page,size.name+"-candidate");
      await page.locator("#next").click();
      const second=await page.locator("#candidate-card").getAttribute("data-candidate-id");
      assert.equal(second,"fixture-restaurant-2");
      await page.locator("#details-button").click();await capture(page,size.name+"-details");
      await page.reload();await page.locator("#details").waitFor({state:"visible"});
      assert.equal(await page.locator("#details-name").innerText(),"Fixture Yakiniku Shinjuku 2");
      await page.locator("#details-back").click();
      assert.equal(await page.locator("#candidate-card").getAttribute("data-candidate-id"),second);
      await page.locator("#saved").click();await capture(page,size.name+"-saved");
      await page.locator("#saved-back").click();
      assert.equal(await page.locator("#candidate-card").getAttribute("data-candidate-id"),second);
      await page.locator("#previous").click();
      const mutationsBefore=writes.length;await page.locator("#choose").click();
      assert.equal(writes.length,mutationsBefore,"Choose this opens preparation without submitting any request");
      await page.locator("#departure").waitFor({state:"visible"});
      assert.equal(destinationRequests,0);await noSelection(host,plan.case.caseId);
      assert.match(await page.locator("#handoff").innerText(),/Omakase Nigiri ¥9,800[\s\S]*Same-day cancellation costs 100%[\s\S]*Card required/);
      assert.equal(await page.locator("#selection-hint").innerText(),"Pick Omakase Nigiri ¥9,800");
      assert.equal(await page.locator("#verification-hint").innerText(),"Check date and guests");
      const departureText=await page.locator("#departure").innerText();
      assert.match(departureText,/Continue on TableCheck[\s\S]*2 guests filled in/);
      assert.doesNotMatch(departureText+" "+await page.locator("#selection-hint").innerText()+" "+await page.locator("#verification-hint").innerText(),/\bselected\b|\bbooked\b/i);
      const quote=page.locator("#handoff-terms details").first();await quote.locator("summary").click();
      // A real persisted shortlist update emits SSE while the current source disclosure stays open.
      const latest=await current(page,plan.case.caseId);
      const saveReply=await page.request.post("/api/cases/"+encodeURIComponent(plan.case.caseId)+"/shortlist",{data:{candidateId:second,shortlisted:true,taskVersion:latest.case.taskVersion,requestId:"expand-"+size.name}});
      assert.equal(saveReply.status(),200);await page.getByRole("button",{name:"Saved 2",exact:true}).waitFor();
      assert.equal(await quote.getAttribute("open"),"");await quote.locator("summary").click();
      await capture(page,size.name+"-handoff");
      const popupPromise=page.waitForEvent("popup");await page.locator("#departure").click();const popup=await popupPromise;
      await popup.getByRole("heading",{name:"Fixture destination",exact:true}).waitFor();
      assert.equal(destinationRequests,1);await popup.close();await page.bringToFront();
      // Chromium headless focus is explicit, using the real window focus event consumed by the client.
      await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
      await page.getByText("Did you get the booking?",{exact:true}).waitFor();await capture(page,size.name+"-feedback");
      await page.getByRole("button",{name:"Not yet",exact:true}).click();
      await page.locator("#feedback").waitFor({state:"hidden"});
      await page.reload();await page.locator("#handoff").waitFor({state:"visible"});
      await page.evaluate(()=>window.dispatchEvent(new Event("focus")));
      assert.equal(await page.locator("#feedback").isVisible(),false,"a claimed prompt never reappears after reload");
      await page.locator("#new-case").click();
      const other=await createPlan(page,"A second plan");await ready(page);
      assert.equal(await page.locator("#saved").innerText(),"Saved 0");
      await page.locator("#bookmark").click();await page.getByRole("button",{name:"Saved 1",exact:true}).waitFor();
      assert.equal((await current(page,plan.case.caseId)).restaurant.shortlistCandidateIds?.length,2);
      assert.equal((await current(page,other.case.caseId)).restaurant.shortlistCandidateIds?.length,1);
      await openPlan(page,plan.case.caseId);
      assert.equal(await page.locator("#saved").innerText(),"Saved 2");
      if(size.name==="mobile"){await page.locator("#menu").click();await capture(page,"mobile-drawer");await page.locator("#menu").click();}
      await page.locator("#handoff-back").click();await page.locator("#next").click();
      const viewedId=await page.locator("#candidate-card").getAttribute("data-candidate-id");
      await page.locator("#message").fill("Check this one");
      const messageReply=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith("/messages")&&r.request().method()==="POST");
      await page.locator("#send").click();assert.equal((await messageReply).status(),200);await ready(page);
      const sent=writes.filter(w=>w.path.endsWith("/messages")).at(-1)!;
      assert.deepEqual(sent.body.viewContext,{view:"CANDIDATES",candidateId:viewedId,comparedCandidateIds:[]});
      const interpretation=host.requests.filter(r=>r.purpose==="restaurant_semantic_interpret").at(-1)!;
      assert.match(interpretation.messages[0]!.content,/"candidate":\{"id":"fixture-restaurant-2","outletName":"Fixture Yakiniku Shinjuku 2"/);
      const resolved=await current(page,plan.case.caseId);
      assert.equal(resolved.restaurant.intentDraft?.target?.query,"Fixture Yakiniku Shinjuku 2");
      await noSelection(host,plan.case.caseId);
      // A forged reference is rejected before cancelling work or calling a model.
      const calls=host.requests.length;
      for(const bad of [
        {view:"CANDIDATES",candidateId:"outside-this-case",comparedCandidateIds:[]},
        {view:"CANDIDATES",candidateId:viewedId,comparedCandidateIds:["outside-this-case"]},
        {view:"SAVED",candidateId:viewedId,comparedCandidateIds:[]},
      ]){
        const response=await page.request.post("/api/conversations/"+encodeURIComponent(resolved.conversation.id)+"/messages",{data:{message:"this one",requestId:crypto.randomUUID(),taskVersion:resolved.case.taskVersion,viewContext:bad}});
        assert.equal(response.status(),400);
      }
      assert.equal(host.requests.length,calls);
      assert.deepEqual(errors,[]);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }finally{host.release();await context.close();await browser.close();await host.close();}
  });

  test("Workspace "+size.name+": stop and request revision discard late source responses",{timeout:45_000},async()=>{
    const host=await startWorkspaceFixture({staged:true}),browser=await chromium.launch({headless:true});
    const page=await browser.newPage({baseURL:host.baseUrl,viewport:{width:size.width,height:size.height}});
    try{
      await signIn(page,host.baseUrl,host.clock.now());
      const stopped=await createPlan(page,"Dinner to stop");await host.waitForCheck();
      await page.getByRole("heading",{name:"Fixture Sushi",exact:true}).waitFor();
      const stopReply=page.waitForResponse(r=>r.request().method()==="DELETE"&&r.url().endsWith("/run"));
      await page.locator("#stop").click();assert.equal((await stopReply).status(),200);
      await page.locator("#progress").waitFor({state:"hidden"});assert.match(await page.locator("#messages").innerText(),/Search stopped/);
      host.release();await assertEventually(()=>host.providerCalls[1]!.completed);
      assert.equal(host.providerCalls[1]!.aborted,true);
      const stoppedView=await current(page,stopped.case.caseId);
      assert.deepEqual(stoppedView.restaurant.readyCandidateIds,["fixture:outlet"]);
      assert.equal(stoppedView.restaurant.progress.active,false);
      assert.equal(await page.locator("#card-counter").innerText(),"1 of 1");await capture(page,size.name+"-stopped");
      await page.locator("#new-case").click();host.hold();
      const edited=await createPlan(page,"Dinner to adjust");await host.waitForCheck();
      await page.getByRole("heading",{name:"Fixture Sushi",exact:true}).waitFor();
      const oldCall=host.providerCalls.at(-1)!;
      await page.locator("#message").fill("Change to three guests");
      const editReply=page.waitForResponse(r=>r.request().method()==="POST"&&r.url().endsWith("/messages"));
      await page.locator("#send").click();assert.equal((await editReply).status(),200);
      await assertEventually(()=>oldCall.aborted);
      host.release();await ready(page);await assertEventually(()=>oldCall.completed);
      const view=await current(page,edited.case.caseId);
      assert.equal(view.restaurant.intentDraft?.partySize,3);
      assert.ok(view.restaurant.requestRevision>edited.restaurant.requestRevision);
      const offers=Object.values(view.restaurant.availability).flat();
      assert.equal(offers.length,3);assert.ok(offers.every(o=>o.partySize===3),"old two-guest offers must not enter the new revision");
      assert.equal(view.restaurant.progress.active,false);
      assert.deepEqual(view.restaurant.readyCandidateIds,["fixture:outlet","fixture-restaurant-2","fixture-restaurant-3"]);
      await noSelection(host,edited.case.caseId);
    }finally{host.release();await browser.close();await host.close();}
  });
}
test("Workspace B1 shows cancellation conflict beside terms and the evidenced Tabelog fee",{timeout:20_000},async()=>{
  const host=await startWorkspaceFixture({provider:"TABELOG",cancellationConflict:true});
  const browser=await chromium.launch({headless:true}),page=await browser.newPage({baseURL:host.baseUrl,viewport:{width:390,height:844}});
  try{
    await signIn(page,host.baseUrl,host.clock.now());await createPlan(page,"Dinner and booking terms");await ready(page);
    await page.locator("#choose").click();await page.locator("#departure").waitFor({state:"visible"});
    const conflict=page.locator('[data-kind="cancellation-conflict"]');
    assert.match(await conflict.innerText(),/English page: Same-day cancellation costs 100%[\s\S]*Cancellation terms differ[\s\S]*Confirm cancellation terms on the website/);
    assert.match(await page.locator("#handoff-terms").innerText(),/Japanese page: Cancellation costs 50%[\s\S]*System usage fee: ¥440 per guest/);
    assert.equal(await page.locator("#selection-hint").innerText(),"Pick Omakase Nigiri ¥9,800");
    assert.equal(await page.locator("#verification-hint").isVisible(),false);
    assert.doesNotMatch(await page.locator("#selection-hint").innerText(),/cancellation|selected|booked/i);
    await capture(page,"mobile-cancellation-conflict");
    await capture(page,"mobile-cancellation-actions","#departure");
  }finally{await browser.close();await host.close();}
});

async function assertEventually(predicate:()=>boolean){
  const deadline=Date.now()+5_000;
  while(!predicate()){if(Date.now()>deadline)assert.fail("fixture source transition did not complete");await new Promise(resolve=>setTimeout(resolve,10));}
}
