import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { chromium, type Page } from "playwright-core";
import { startWorkspaceFixture } from "../workspace-fixture-server.js";

// Actual Chromium -> HTTP/SSE -> application, interpreter/compiler, Router,
// Runtime and PGlite. Only model/source/question transports are fixed fixtures.
const sizes=[{name:"mobile",width:390,height:844},{name:"desktop",width:1280,height:900}];
async function start(page:Page,host:Awaited<ReturnType<typeof startWorkspaceFixture>>,message:string,count=3){
  page.setDefaultTimeout(10_000);await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);
  await page.getByLabel("Access token",{exact:true}).fill("workspace-fixture");await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await page.locator("#message").fill(message);await page.getByRole("button",{name:"Send",exact:true}).click();
  if(count>0)await ready(page,count);else await page.locator("#empty-state").waitFor({state:"visible"});
}
async function ready(page:Page,count=3){await page.waitForFunction(value=>document.getElementById("card-counter")?.textContent===value,"1 of "+count);await page.locator("#progress").waitFor({state:"hidden"});}
async function capture(page:Page,name:string){
  const folder=process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT;if(!folder)return;
  await mkdir(folder,{recursive:true});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
  await page.screenshot({path:join(folder,name+".png"),fullPage:false,animations:"disabled"});
}

for(const size of sizes){
  test("Workspace slice2 "+size.name+": one composer routes by view, keeps answers isolated, edits marked conditions and reaches another batch",{timeout:45_000},async()=>{
    const host=await startWorkspaceFixture({questions:true,inferredParty:true,extraCandidates:true});
    const browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    const posts:Array<{path:string;body:Record<string,unknown>}>=[];
    page.on("request",r=>{if(r.method()==="POST")posts.push({path:new URL(r.url()).pathname,body:r.postDataJSON()});});
    try{
      await start(page,host,"Dinner for two couples");
      assert.equal((await page.locator('#brand').innerText()).trim(),'Praxis');
      const title=await page.locator('#case-title').boundingBox(),chip=await page.locator('#request-conditions button').first().boundingBox(),name=await page.locator('#restaurant-name').boundingBox(),evidence=await page.locator('#evidence').boundingBox();
      assert.ok(title&&chip&&name&&evidence);
      for(const box of [chip,name,evidence])assert.ok(Math.abs(box.x-title.x)<1,'workspace content shares a left edge');

      assert.equal(await page.locator("#request-conditions").getByRole("button",{name:"4 guests?",exact:true}).count(),1);
      assert.equal(await page.locator("#request-conditions").getByRole("button",{name:"Mon, Nov 2",exact:true}).count(),1);
      await page.locator("#request-conditions").getByRole("button",{name:"4 guests?",exact:true}).click();
      assert.equal(await page.locator("#message").inputValue(),"");
      const inline=page.getByRole("textbox",{name:"Edit 4 guests",exact:true});assert.equal(await inline.inputValue(),"4 guests");
      assert.equal(await inline.evaluate(n=>n===document.activeElement),true);
      await capture(page,size.name+"-slice2-conditions");
      await inline.press("Escape");
      await page.locator("#bookmark").click();
      const card=await page.locator("#candidate-card").elementHandle(),first=await page.locator("#restaurant-name").innerText();
      await page.locator("#details-button").click();
      assert.equal(await page.locator("#message").getAttribute("placeholder"),"Ask about this place");
      assert.equal(await page.locator("#app input:visible, #app textarea:visible").count(),1);
      assert.equal(await page.locator("#question-form, #question-send").count(),0);
      const titleBefore=await page.locator("#details-name").boundingBox(),modelCalls=host.requests.length;
      const ask=async(question:string)=>{await page.locator("#message").fill(question);await page.getByRole("button",{name:"Send",exact:true}).click();await page.locator("#answer-sheet").waitFor({state:"visible"});assert.equal(await page.locator("#message").inputValue(),question);};
      await ask("Does this place require a card?");
      assert.equal(await page.locator("#answer-place").innerText(),first);
      assert.equal(host.questionRequests.length,1);assert.equal(host.requests.length,modelCalls,"routing to G1 cannot add semantic/Agent model work");
      assert.equal(await page.locator("#details-name").innerText(),first);
      const titleAfter=await page.locator("#details-name").boundingBox();assert.equal(titleAfter?.x,titleBefore?.x);assert.equal(titleAfter?.y,titleBefore?.y);
      assert.equal(await card!.evaluate(n=>n===document.getElementById("candidate-card")),true);
      assert.deepEqual(Object.keys(posts.find(p=>p.path.endsWith("/questions"))!.body).sort(),["candidateId","question","requestId","taskVersion"]);
      await capture(page,size.name+"-slice2-answer");
      await page.locator("#answer-backdrop").click({position:{x:8,y:8}});await page.locator("#answer-sheet").waitFor({state:"hidden"});
      assert.equal(await page.locator("#message").inputValue(),"Does this place require a card?");
      assert.equal(await page.locator("#asked-question").innerText(),"Does this place require a card?");
      await capture(page,size.name+"-slice2-you-asked");
      await page.locator("#details-back").click();assert.equal(await page.locator("#restaurant-name").innerText(),first);
      await page.locator("#next").click();const second=await page.locator("#restaurant-name").innerText();await page.locator("#details-button").click();
      assert.equal(await page.locator("#asked-history").isVisible(),false,"the previous outlet answer must not appear here");
      await ask("What does this other place say about cards?");assert.equal(await page.locator("#answer-place").innerText(),second);
      assert.notEqual(host.questionRequests[0]!.candidate.restaurant.id,host.questionRequests[1]!.candidate.restaurant.id);
      const handle=await page.locator("#answer-dismiss").boundingBox();assert.ok(handle);
      await page.mouse.move(handle.x+handle.width/2,handle.y+8);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2,handle.y+70,{steps:5});await page.mouse.up();
      await page.locator("#answer-sheet").waitFor({state:"hidden"});
      await page.locator("#details-back").click();await page.locator("#previous").click();await page.locator("#details-button").click();
      assert.equal(await page.locator("#asked-history").isVisible(),true);
      assert.equal(await page.locator("#asked-question").innerText(),"Does this place require a card?");
      await ask("Please confirm this place's card information");await page.locator("#answer-dismiss").click();
      assert.equal(await page.locator("#asked-question").innerText(),"Please confirm this place's card information");
      assert.match(await page.locator("#asked-earlier").innerText(),/Does this place require a card/);
      assert.doesNotMatch(await page.locator("#asked-history").innerText(),/What does this other place say/);
      await page.locator("#details-back").click();assert.equal(await page.locator("#message").getAttribute("placeholder"),"Adjust anything?");
      const questionCount=host.questionRequests.length;
      await page.locator("#message").fill("Make it three people");await page.getByRole("button",{name:"Send",exact:true}).click();await ready(page);
      assert.equal(host.questionRequests.length,questionCount);assert.equal(host.requests.filter(r=>r.purpose==="restaurant_semantic_interpret").length,2);
      assert.equal(await page.locator("#request-conditions").getByRole("button",{name:"3 guests",exact:true}).count(),1);
      assert.equal(await page.locator("#request-conditions").getByRole("button",{name:"3 guests?",exact:true}).count(),0);
      assert.ok(posts.some(p=>p.path.includes("/conversations/")&&p.path.endsWith("/messages")));
      const unchangedCase=await page.locator(".case-link.active").getAttribute("data-case-id");assert.ok(unchangedCase);
      const unchanged=(await(await page.request.get("/api/cases/"+encodeURIComponent(unchangedCase))).json()).view.restaurant.revisionDiff;
      assert.deepEqual([unchanged.removed.length,unchanged.added.length],[0,0],"the server confirms the candidate set is unchanged");
      assert.equal(await page.locator("#revision-changes").isVisible(),false,"hide the changes row when both counts are zero");
      assert.doesNotMatch(await page.locator("body").innerText(),/0 removed|0 added/);await capture(page,size.name+"-slice2-zero-changes");
      await page.locator("#next").click();await page.locator("#next").click();const last=await page.locator("#restaurant-name").innerText();
      await page.locator("#next").click();await page.getByRole("heading",{name:"Any of these work?",exact:true}).waitFor();
      assert.equal(await page.locator("#candidate-panel").isVisible(),false);assert.equal(await page.locator("#end-saved").getAttribute("aria-label"),"Saved 1");
      await page.locator("#end-saved").click();await page.locator("#saved-back").click();await page.locator("#batch-back").click();assert.equal(await page.locator("#restaurant-name").innerText(),last);
      await page.locator("#next").click();await page.locator("#end-adjust").click();assert.equal(await page.locator("#message").evaluate(n=>n===document.activeElement),true);
      await page.locator("#message").fill("Keep this draft while finding more");await capture(page,size.name+"-slice2-batch-end");
      const response=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith("/another-batch"));await page.locator("#find-more").click();assert.equal((await response).status(),200);
      await ready(page);assert.match(await page.locator("#restaurant-name").innerText(),/Fixture later restaurant/);
      assert.equal(await page.locator("#revision-changes").isVisible(),true,"a nonzero addition still shows the changes row");
      assert.deepEqual([await page.locator("#removed-count").innerText(),await page.locator("#added-count").innerText()],["0 removed","3 added"]);
      assert.equal(await page.locator("#message").inputValue(),"Keep this draft while finding more");
      assert.equal(posts.filter(p=>p.path.endsWith("/another-batch")).length,1);
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });

  test("Workspace slice2 "+size.name+": native SSE reconnect preserves the draft and expired handoff uses refresh",{timeout:30_000},async()=>{
    const host=await startWorkspaceFixture({sourceValidityMs:60_000}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    let departures=0,refreshes=0;page.on("request",r=>{const path=new URL(r.url()).pathname;if(path.endsWith("/booking-departures"))departures++;if(path.endsWith("/refresh"))refreshes++;});
    try{
      await start(page,host,"Dinner to reconnect");await page.locator("#message").fill("Keep this unsent text");
      const name=await page.locator("#restaurant-name").innerText();await eventually(()=>host.activeStreamCount()>0);host.disconnectStreams();await page.locator("#reconnecting").waitFor({state:"visible"});
      assert.equal(await page.locator("#reconnecting").innerText(),"Reconnecting…");assert.equal(await page.locator("#message").inputValue(),"Keep this unsent text");
      await capture(page,size.name+"-slice2-reconnecting");await page.locator("#reconnecting").waitFor({state:"hidden"});
      assert.equal(await page.locator("#restaurant-name").innerText(),name);assert.equal(await page.locator("#message").inputValue(),"Keep this unsent text");
      await page.locator("#choose").click();await page.locator("#departure").waitFor({state:"visible"});
      const caseId=await page.locator(".case-link.active").getAttribute("data-case-id");assert.ok(caseId);
      const view=(await (await page.request.get("/api/cases/"+encodeURIComponent(caseId))).json()).view;
      const untilExpiry=Math.min(...Object.values(view.restaurant.availabilityChecks).map((check:unknown)=>Date.parse((check as {displayExpiresAt:string}).displayExpiresAt)))-host.clock.now().valueOf()+100;
      host.clock.advance(untilExpiry);await page.clock.fastForward(untilExpiry);
      assert.equal(await page.locator("#departure-title").innerText(),"Check availability again");await capture(page,size.name+"-slice2-expired-handoff");
      await page.locator("#departure").click();await page.waitForFunction(()=>document.getElementById("departure-title")?.textContent?.startsWith("Continue on TableCheck"));
      assert.equal(refreshes,1);assert.equal(departures,0);assert.equal(await page.locator("#message").inputValue(),"Keep this unsent text");
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });
}

async function eventually(condition:()=>boolean){const deadline=Date.now()+5_000;while(!condition()){if(Date.now()>deadline)assert.fail("Native SSE connection did not open");await new Promise(resolve=>setTimeout(resolve,10));}}
async function failureDiagnostic(page:Page,host:Awaited<ReturnType<typeof startWorkspaceFixture>>){
  const id=await page.locator(".case-link.active").getAttribute("data-case-id");if(!id)return;
  const artifact=await host.application.exportReadArtifact(id),view=(await (await page.request.get("/api/cases/"+encodeURIComponent(id))).json()).view;
  console.log(JSON.stringify({slice2Failure:{phase:view.case.phase,progress:view.restaurant.progress,presented:view.restaurant.presentedCandidateIds,ready:view.restaurant.readyCandidateIds,readStatus:view.restaurant.readStatus,
    checks:Object.entries(view.restaurant.availabilityChecks).map(([id,check])=>({id,status:(check as {status:string}).status,reason:(check as {reasonCode?:string}).reasonCode})),
    events:(artifact.events as Array<{event:{type:string;candidateIds?:string[];reason?:string}}>).map(e=>e.event).filter(e=>["RESULTS_PRESENTED","NEXT_BATCH_REPLENISHMENT_REQUESTED","AVAILABILITY_FAILED","AGENT_LOOP_TERMINATED"].includes(e.type))}}));
}

for(const size of sizes)for(const scenario of ["structured","missing"] as const){
  test("Workspace slice2 "+size.name+": server revision differences and saved reasons "+scenario,{timeout:35_000},async()=>{
    const host=await startWorkspaceFixture({revisionScenario:scenario}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    try{
      await start(page,host,"Three dinner options");
      await page.locator("#next").click();const oldBudget=await page.locator("#restaurant-name").innerText();await page.locator("#bookmark").click();
      await page.locator("#next").click();const oldTime=await page.locator("#restaurant-name").innerText();await page.locator("#bookmark").click();
      await page.locator("#message").fill("For three people at 20:00 show two options under 10000 JPY");await page.getByRole("button",{name:"Send",exact:true}).click();
      await page.waitForFunction(()=>document.getElementById("card-counter")?.textContent==="1 of 2");await page.locator("#progress").waitFor({state:"hidden"});
      const caseId=await page.locator(".case-link.active").getAttribute("data-case-id");assert.ok(caseId);
      let view=(await (await page.request.get("/api/cases/"+encodeURIComponent(caseId))).json()).view;
      const expected=scenario==="structured"?["OVER_BUDGET","NEW_TIME_MISMATCH"]:["NO_LONGER_MATCHES","NO_LONGER_MATCHES"];
      assert.equal(view.restaurant.requirementRevision,2);assert.equal(view.restaurant.revisionDiff.fromRevision,1);assert.equal(view.restaurant.revisionDiff.toRevision,2);
      assert.deepEqual(view.restaurant.revisionDiff.removed.map((r:{outletName:string;reasonCode:string})=>[r.outletName,r.reasonCode]),[[oldBudget,expected[0]],[oldTime,expected[1]]]);
      assert.equal(view.restaurant.revisionDiff.added.length,1);assert.equal(view.restaurant.revisionDiff.added[0].outletName,"Fixture new option");
      assert.deepEqual(view.restaurant.savedCandidates.map((r:{outletName:string;reasonCode:string;current:boolean})=>[r.outletName,r.reasonCode,r.current]),[[oldBudget,expected[0],false],[oldTime,expected[1],false]]);
      assert.equal(await page.locator("#removed-count").innerText(),"2 removed");assert.equal(await page.locator("#added-count").innerText(),"1 added");
      await page.locator("#revision-changes summary").click();
      const reasons=await page.locator("#removed-list").innerText();assert.match(reasons,new RegExp(oldBudget));assert.match(reasons,new RegExp(oldTime));
      if(scenario==="structured"){assert.match(reasons,/Over budget/);assert.match(reasons,/Doesn't match the new time/);}else{assert.equal(await page.getByText("No longer matches",{exact:true}).count(),2);}
      await page.locator("#message").fill("Keep this note while the changes stay expanded");
      const repeated=await page.request.post("/api/cases/"+encodeURIComponent(caseId)+"/shortlist",{data:{candidateId:view.restaurant.savedCandidates[0].candidateId,shortlisted:true,taskVersion:view.case.taskVersion,requestId:crypto.randomUUID()}});assert.equal(repeated.status(),200);view=(await repeated.json()).view;
      assert.equal(view.restaurant.savedCandidates[0].reasonCode,expected[0],"reaffirming an existing saved item cannot erase its requirement-change reason");
      const current=view.restaurant.presentedCandidateIds[0];
      for(const shortlisted of [true,false]){
        const response=await page.request.post("/api/cases/"+encodeURIComponent(caseId)+"/shortlist",{data:{candidateId:current,shortlisted,taskVersion:view.case.taskVersion,requestId:crypto.randomUUID()}});assert.equal(response.status(),200);view=(await response.json()).view;
        await page.waitForFunction(count=>document.getElementById("saved-count")?.textContent===count,shortlisted?"3":"2");
        assert.equal(await page.locator("#revision-changes").getAttribute("open"),"");assert.equal(await page.locator("#message").inputValue(),"Keep this note while the changes stay expanded");
      }
      await capture(page,size.name+"-slice2-revision-"+scenario);
      await page.locator("#saved").click();const rows=page.locator("#saved-list .saved-row");assert.equal(await rows.count(),2);
      assert.equal(await rows.nth(0).isDisabled(),true);assert.equal(await rows.nth(1).isDisabled(),true);
      assert.match(await rows.nth(0).innerText(),new RegExp(oldBudget));assert.match(await rows.nth(1).innerText(),new RegExp(oldTime));
      await capture(page,size.name+"-slice2-saved-"+scenario);
      await page.reload();await page.locator("#saved-panel").waitFor({state:"visible"});assert.equal(await page.locator("#saved-list .saved-row").count(),2);
      assert.match(await page.locator("#saved-list").innerText(),new RegExp(oldBudget));assert.match(await page.locator("#saved-list").innerText(),new RegExp(oldTime));
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });
}

for(const size of sizes){
  for(const outcome of ["empty","all-sources-failed"] as const)test("Workspace slice2 "+size.name+": empty result copy is honest "+outcome,{timeout:25_000},async()=>{
    const host=await startWorkspaceFixture({outcome}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    try{
      await start(page,host,"Dinner to adjust",0);assert.equal(await page.locator("#empty-message").innerText(),outcome==="empty"?"Nothing matched yet.":"Couldn't reach the sources. Try again?");
      assert.doesNotMatch(await page.locator("body").innerText(),/no seats|no (?:restaurants|places) nearby/i);
      if(outcome==="empty"){
        await page.locator("#message").fill("Keep this adjustment draft");await page.locator("#empty-adjust").click();
        assert.equal(await page.locator("#message").evaluate(n=>n===document.activeElement),true);assert.equal(await page.locator("#message").inputValue(),"Keep this adjustment draft");
      }
      assert.equal(await page.locator("#empty-more").isVisible(),false,"exhausted or fully failed sources cannot offer continuation");
      await capture(page,size.name+"-slice2-"+outcome);
      if(outcome==="all-sources-failed"){
        const before=host.requests.filter(r=>r.purpose==="restaurant_semantic_interpret").length;
        host.recoverSources();const response=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith("/refresh"));await page.locator("#empty-retry").click();assert.equal((await response).status(),200);
        await ready(page);assert.equal(await page.locator("#empty-state").isVisible(),false);assert.equal(host.requests.filter(r=>r.purpose==="restaurant_semantic_interpret").length,before);
        assert.equal(host.providerCalls.length,6,"Try again refreshes the three failed outlets rather than using another-batch");await capture(page,size.name+"-slice2-retry-recovered");
      }
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });

  test("Workspace slice2 "+size.name+": semantic model failure retains the submitted text and current card, then accepts rephrasing",{timeout:25_000},async()=>{
    const bad="Unreadable fixture request",host=await startWorkspaceFixture({semanticFailureMessage:bad}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    try{
      await start(page,host,"Dinner with friends");await page.locator("#next").click();const card=await page.locator("#restaurant-name").innerText(),reads=host.providerCalls.length;
      await page.locator("#message").fill(bad);await page.getByRole("button",{name:"Send",exact:true}).click();await page.locator("#understanding-error").waitFor({state:"visible"});
      assert.equal(await page.locator("#understanding-error").innerText(),"Couldn't read that. Try rephrasing?");assert.equal(await page.locator("#message").inputValue(),bad);
      const notice=await page.locator("#understanding-error").boundingBox(),composer=await page.locator("#composer").boundingBox();assert.ok(notice&&composer&&notice.y>=0&&notice.y+notice.height<=composer.y,"the model-failure next step must be fully visible above the fixed composer");
      assert.equal(await page.locator("#restaurant-name").innerText(),card);assert.equal(host.providerCalls.length,reads);
      assert.equal(await page.locator("#messages").innerText(),"");await capture(page,size.name+"-slice2-model-failure");
      await page.locator("#message").fill("Make it three people");await page.getByRole("button",{name:"Send",exact:true}).click();await ready(page);
      assert.equal(await page.locator("#understanding-error").isVisible(),false);assert.equal(await page.locator("#message").inputValue(),"");
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });

  test("Workspace slice2 "+size.name+": partial source failure keeps qualified results and places the notice at the batch end",{timeout:25_000},async()=>{
    const host=await startWorkspaceFixture({outcome:"partial"}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    try{
      await start(page,host,"Two dinner options",2);assert.equal(await page.locator("#empty-state").isVisible(),false);assert.equal(await page.locator("#partial-source-note").isVisible(),false);
      await page.locator("#next").click();assert.equal(await page.locator("#partial-source-note").innerText(),"Some sources couldn't be checked.");assert.equal(await page.locator("#partial-source-note").isVisible(),true);
      assert.equal(await page.locator("#candidate-panel").isVisible(),true);assert.doesNotMatch(await page.locator("#partial-source-note").innerText(),/no seats|no restaurants nearby/i);
      await page.locator("#next").click();await page.locator("#batch-end").waitFor({state:"visible"});assert.equal(await page.locator("#partial-source-note").isVisible(),true);
      await capture(page,size.name+"-slice2-partial-source");
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });
}

for(const size of sizes)for(const continuation of ["pool","search"] as const){
  test("Workspace slice2 "+size.name+": empty continuation uses proven unread "+continuation+", is idempotent and never rereads rejected outlets",{timeout:30_000},async()=>{
    const host=await startWorkspaceFixture({continuation}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    const posts:Array<{path:string;body:Record<string,unknown>}>=[];page.on("request",r=>{if(r.method()==="POST")posts.push({path:new URL(r.url()).pathname,body:r.postDataJSON()});});
    try{
      await start(page,host,"Dinner with a bounded continuation",0);
      const id=await page.locator(".case-link.active").getAttribute("data-case-id");assert.ok(id);
      const initial=(await(await page.request.get("/api/cases/"+encodeURIComponent(id))).json()).view;
      assert.equal(initial.case.phase,"NO_VERIFIED_RESULT");assert.equal(initial.restaurant.readStatus.canContinue,true);assert.equal(initial.restaurant.readStatus.canRetry,false);
      assert.equal(host.providerCalls.length,1);const rejected=host.providerCalls[0]!.candidateId;
      if(continuation==="pool"){
        const stranger=await browser.newContext({baseURL:host.baseUrl});try{
          assert.equal((await stranger.request.post("/api/session",{data:{accessToken:"workspace-other"}})).status(),201);
          assert.equal((await stranger.request.post("/api/cases/"+encodeURIComponent(id)+"/another-batch",{data:{taskVersion:initial.case.taskVersion,requestId:crypto.randomUUID()}})).status(),404);
        }finally{await stranger.close();}
      }
      await page.locator("#message").fill("Keep this note through continuation");await capture(page,size.name+"-slice2-continue-"+continuation);
      const response=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith("/another-batch"));
      await page.locator("#empty-more").evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});assert.equal((await response).status(),200);
      await ready(page);assert.equal(posts.filter(p=>p.path.endsWith("/another-batch")).length,1);assert.equal(await page.locator("#message").inputValue(),"Keep this note through continuation");
      assert.equal(host.providerCalls.filter(call=>call.candidateId===rejected).length,1,"failed/unavailable outlets stay investigated");
      const current=(await(await page.request.get("/api/cases/"+encodeURIComponent(id))).json()).view;
      assert.deepEqual(current.restaurant.intentDraft,initial.restaurant.intentDraft);assert.equal(current.restaurant.requirementRevision,initial.restaurant.requirementRevision);
      assert.equal(host.searches.length,continuation==="pool"?1:2);
      if(continuation==="search"){assert.equal(host.searches[1]!.continuation?.nextPageToken,"workspace-next");assert.deepEqual(host.searches[1]!.intent,host.searches[0]!.intent);}
      const request=posts.find(p=>p.path.endsWith("/another-batch"))!,reads=host.providerCalls.length;
      assert.equal((await page.request.post(request.path,{data:request.body})).status(),200);assert.equal(host.providerCalls.length,reads);
      assert.equal((await page.request.post(request.path,{data:{...request.body,requestId:crypto.randomUUID()}})).status(),409);
      const artifact=await host.application.exportReadArtifact(id);assert.equal((artifact.events as Array<{event:{type:string}}>).filter(item=>item.event.type==="NEXT_BATCH_REPLENISHMENT_REQUESTED").length,1);
      await capture(page,size.name+"-slice2-continued-"+continuation);
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });
}

for(const size of sizes){
  test("Workspace slice2 "+size.name+": Stop during empty continuation discards the late source card",{timeout:30_000},async()=>{
    const host=await startWorkspaceFixture({continuation:"pool"}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
    try{
      await start(page,host,"Dinner to continue then stop",0);host.hold();await page.locator("#empty-more").click();await host.waitForCheck();
      const stopped=page.waitForResponse(r=>r.request().method()==="DELETE"&&new URL(r.url()).pathname.endsWith("/run"));await page.getByRole("button",{name:"Stop",exact:true}).click();
      await eventually(()=>host.providerCalls.some(call=>call.aborted));host.release();assert.equal((await stopped).status(),200);await page.locator("#progress").waitFor({state:"hidden"});
      const id=await page.locator(".case-link.active").getAttribute("data-case-id");assert.ok(id);const view=(await(await page.request.get("/api/cases/"+encodeURIComponent(id))).json()).view;
      assert.deepEqual(view.restaurant.readyCandidateIds,[]);assert.equal(await page.locator("#candidate-panel").isVisible(),false);assert.equal(host.providerCalls.length,2);
      await page.reload();await page.locator("#case-workspace").waitFor({state:"visible"});assert.equal(await page.locator("#candidate-panel").isVisible(),false);await capture(page,size.name+"-slice2-continuation-stopped");
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{host.release();await context.close();await browser.close();await host.close();}
  });
}

for(const size of sizes)test("Workspace 3c "+size.name+": each observed booking slot retains its own departure link",{timeout:30_000},async()=>{
 const host=await startWorkspaceFixture({multiSlot:true});
 const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await context.newPage();
 try{
  await start(page,host,"Dinner for two");
  assert.equal(await page.locator('#delivery-slots p').count(),1);
  assert.match(await page.locator('#availability').innerText(),/19:00/);
  await page.locator('#choose').click();const selector=page.getByLabel('Booking time',{exact:true});
  assert.equal(await selector.locator('option').count(),2);
  const initial=await page.locator('#departure').getAttribute('href');
  const choices=await selector.locator('option').evaluateAll(nodes=>nodes.map(n=>(n as HTMLOptionElement).value));
  await selector.selectOption(choices[1]!);
  const later=await page.locator('#departure').getAttribute('href');assert.notEqual(later,initial);
  assert.equal(await page.locator('#direct-source').isVisible(),false);
  assert.match(later!,/start_time=19%3A30/);
  await page.reload();await page.locator('#handoff').waitFor({state:'visible'});
  assert.equal(await page.locator('#departure').getAttribute('href'),later);
  await capture(page,size.name+'-3c-multiple-slots');
  await context.route('https://**/*',route=>route.abort());
  const outgoing=page.waitForRequest(r=>r.method()==='POST'&&r.url().endsWith('/booking-departures'));
  await page.locator('#departure').click();
  assert.equal((await outgoing).postDataJSON().offerId,choices[1]);

 }finally{await context.close();await browser.close();await host.close();}
});

for(const size of sizes)test('Workspace inline condition '+size.name+': capped local edit survives SSE and routes changes without touching composer',{timeout:45_000},async()=>{
 const host=await startWorkspaceFixture({questions:true});const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await context.newPage();
 try{
  await start(page,host,'Dinner for two');await page.locator('#message').fill('Keep my unsent question');
  await page.getByRole('button',{name:'2 guests',exact:true}).click();const editor=page.getByRole('textbox',{name:'Edit 2 guests',exact:true});
  assert.equal(await editor.getAttribute('maxlength'),'30');await editor.fill('x'.repeat(30));await editor.press('End');await page.keyboard.insertText('y');assert.equal((await editor.inputValue()).length,30);
  await editor.fill('3');const handle=await editor.elementHandle();await page.locator('#bookmark').click();await page.waitForFunction(()=>document.getElementById('saved-count')?.textContent==='1');
  assert.equal(await handle!.evaluate(n=>n===document.querySelector('.condition-editor input')),true);assert.equal(await editor.inputValue(),'3');
  await capture(page,size.name+'-inline-condition');await editor.press('Escape');assert.equal(await page.locator('#message').inputValue(),'Keep my unsent question');
  await page.locator('#details-button').click();await page.getByRole('button',{name:'2 guests',exact:true}).click();await editor.fill('3');
  const sent=page.waitForRequest(r=>r.method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));
  await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await sent).postDataJSON().message,'Change 2 guests to 3');
  await page.getByRole('button',{name:'3 guests',exact:true}).waitFor();assert.equal(host.questionRequests.length,0);assert.equal(await page.locator('#message').inputValue(),'Keep my unsent question');
  assert.equal(await page.locator('.condition-editor').count(),0);
 }finally{await context.close();await browser.close();await host.close();}
});
