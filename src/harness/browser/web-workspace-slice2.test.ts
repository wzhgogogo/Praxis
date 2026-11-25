import assert from "node:assert/strict";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { chromium, type Page, type BrowserContext } from "playwright-core";
import { datedWorkspaceRequest, startWorkspaceFixture } from "../workspace-fixture-server.js";

// Actual Chromium -> HTTP/SSE -> application, interpreter/compiler, Router,
// Runtime and PGlite. Only model/source/question transports are fixed fixtures.
const sizes=[{name:"mobile",width:390,height:844},{name:"desktop",width:1280,height:900}];
async function tracedPage(context:BrowserContext){
  await context.tracing.start({screenshots:true,snapshots:true,sources:false});
  return context.newPage();
}
const diagnosed=new WeakSet<Page>();
async function start(page:Page,host:Awaited<ReturnType<typeof startWorkspaceFixture>>,message:string,count=3,checkEmpty=false){
  page.setDefaultTimeout(10_000);await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);
  await page.getByLabel("Access token",{exact:true}).fill("workspace-fixture");await page.getByRole("button",{name:"Sign in",exact:true}).click();
  if(checkEmpty){
    assert.equal(await page.locator('#message').getAttribute('placeholder'),null);assert.equal(await page.locator('#message').getAttribute('required'),null);assert.equal(await page.locator('#composer').evaluate(n=>(n as HTMLFormElement).noValidate),true);
    await page.locator('#message').evaluate(n=>{n.setAttribute('data-invalid','0');n.addEventListener('invalid',()=>n.setAttribute('data-invalid','1'));});
    let posts=0;const record=(r:import('playwright-core').Request)=>{if(r.method()==='POST')posts++;};page.on('request',record);await page.getByRole('button',{name:'Send',exact:true}).click();page.off('request',record);
    assert.equal(posts,0);assert.equal(await page.locator('#message').getAttribute('data-invalid'),'0');assert.equal(await page.locator('#error').isVisible(),false);
  }
  await page.locator("#message").fill(datedWorkspaceRequest(message));await page.getByRole("button",{name:"Send",exact:true}).click();
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
    const browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
    const posts:Array<{path:string;body:Record<string,unknown>}>=[];
    page.on("request",r=>{if(r.method()==="POST")posts.push({path:new URL(r.url()).pathname,body:r.postDataJSON()});});
    try{
      await start(page,host,"Dinner for two couples");
      assert.equal((await page.locator('#brand').innerText()).trim(),'Praxis');
      const title=await page.locator('#case-title').boundingBox(),chip=await page.locator('#request-conditions button').first().boundingBox(),name=await page.locator('#restaurant-name').boundingBox(),availability=await page.locator('#availability').boundingBox();
      assert.ok(title&&chip&&name&&availability);
      const cardBox=await page.locator('#candidate-card').boundingBox();assert.ok(cardBox);
      for(const box of [chip,cardBox])assert.ok(Math.abs(box.x-title.x)<1,'header, chips and card share an outer left edge');
      for(const box of [name,availability])assert.ok(Math.abs(box.x-cardBox.x-17)<1,'card content follows its 16px inset plus border');

      assert.equal(await page.locator("#request-conditions").getByRole("button",{name:"4 guests?",exact:true}).count(),1);
      assert.equal(await page.locator("#request-conditions").getByRole("button",{name:"Mon, Nov 2",exact:true}).count(),1);
      await page.locator("#request-conditions").getByRole("button",{name:"4 guests?",exact:true}).click();
      assert.equal(await page.locator("#message").inputValue(),"");
      const inline=page.getByRole("spinbutton",{name:"Edit 4 guests",exact:true});assert.equal(await inline.inputValue(),"4");
      assert.equal(await inline.evaluate(n=>n===document.activeElement),true);
      await capture(page,size.name+"-slice2-conditions");
      await inline.press("Escape");
      await page.locator("#bookmark").click();
      const card=await page.locator("#candidate-card").elementHandle(),first=await page.locator("#restaurant-name").innerText();
      await page.locator("#details-button").click();
      assert.equal(await page.locator("#message").getAttribute("placeholder"),"Ask about "+first);assert.equal(await page.locator("#message").getAttribute("aria-label"),"Restaurant question");
      assert.equal(await page.locator("#app input:visible, #app textarea:visible").count(),1);
      assert.equal(await page.locator("#question-form, #question-send").count(),0);
      const titleBefore=await page.locator("#details-name").boundingBox(),modelCalls=host.requests.length;
      const ask=async(question:string)=>{await page.locator("#message").fill(question);await page.getByRole("button",{name:"Send",exact:true}).click();await page.locator("#answer-sheet").waitFor({state:"visible"});assert.equal(await page.locator("#message").inputValue(),"");};
      await ask("Does this place require a card?");
      assert.equal(await page.locator("#answer-place").innerText(),first);
      assert.equal(host.questionRequests.length,1);assert.equal(host.requests.length,modelCalls,"routing to G1 cannot add semantic/Agent model work");
      assert.equal(await page.locator("#details-name").innerText(),first);
      const titleAfter=await page.locator("#details-name").boundingBox();assert.equal(titleAfter?.x,titleBefore?.x);assert.equal(titleAfter?.y,titleBefore?.y);
      assert.equal(await card!.evaluate(n=>n===document.getElementById("candidate-card")),true);
      assert.deepEqual(Object.keys(posts.find(p=>p.path.endsWith("/questions"))!.body).sort(),["candidateId","question","requestId","taskVersion"]);
      await capture(page,size.name+"-slice2-answer");
      await page.locator("#answer-backdrop").click({position:{x:8,y:8}});await page.locator("#answer-sheet").waitFor({state:"hidden"});
      assert.equal(await page.locator("#message").inputValue(),"");
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
      await page.locator("#details-back").click();assert.equal(await page.locator("#message").getAttribute("placeholder"),null);assert.equal(await page.locator("#message").getAttribute("aria-label"),"Plan message");
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
      assert.equal(await page.locator("#candidate-panel").isVisible(),false);assert.equal(await page.locator("#saved").getAttribute("aria-label"),"Saved 1");
      await page.locator("#saved").click();await page.locator("#saved-back").click();await page.locator("#batch-back").click();assert.equal(await page.locator("#restaurant-name").innerText(),last);
      await page.locator("#next").click();await page.locator("#end-adjust").click();assert.equal(await page.locator("#message").evaluate(n=>n===document.activeElement),true);
      await page.locator("#message").fill("Keep this draft while finding more");await capture(page,size.name+"-slice2-batch-end");
      const response=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith("/another-batch"));await page.locator("#find-more").click();assert.equal((await response).status(),200);
      await ready(page);assert.match(await page.locator("#restaurant-name").innerText(),/Fixture later restaurant/);
      assert.equal(await page.locator("#revision-changes").isVisible(),true,"a nonzero addition still shows the changes row");
      assert.equal(await page.locator("#removed-count").isVisible(),false);assert.equal(await page.locator("#added-count").innerText(),"3 new places");assert.equal(await page.locator("#removed-list").isVisible(),false);assert.equal(await page.locator("#revision-changes summary").getAttribute("aria-disabled"),"true");assert.equal(await page.locator("#revision-changes summary").getAttribute("tabindex"),"-1");await page.locator("#revision-changes summary").evaluate(node=>(node as HTMLElement).click());assert.equal(await page.locator("#revision-changes").evaluate(node=>(node as HTMLDetailsElement).open),false);
      assert.equal(await page.locator("#message").inputValue(),"Keep this draft while finding more");
      assert.equal(posts.filter(p=>p.path.endsWith("/another-batch")).length,1);
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });

  test("Workspace slice2 "+size.name+": native SSE reconnect preserves the draft and expired handoff uses refresh",{timeout:30_000},async()=>{
    const host=await startWorkspaceFixture({sourceValidityMs:60_000}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
    let departures=0,refreshes=0;page.on("request",r=>{const path=new URL(r.url()).pathname;if(path.endsWith("/booking-departures"))departures++;if(path.endsWith("/refresh"))refreshes++;});
    try{
      await start(page,host,"Dinner to reconnect");await page.locator("#message").fill("Keep this unsent text");
      const name=await page.locator("#restaurant-name").innerText();await eventually(()=>host.activeStreamCount()>0);host.disconnectStreams();await eventually(()=>host.activeStreamCount()===0);await eventually(()=>host.activeStreamCount()>0);await page.clock.fastForward(5000);assert.equal(await page.locator("#reconnecting").isVisible(),false,"a successful quick reconnect never shows the five-second banner");
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
  if(diagnosed.has(page))return;diagnosed.add(page);
  // mkdtemp registers this output root with test-filesystem-guard; no worktree artifacts.
  const directory=await mkdtemp(join(tmpdir(),'praxis-workspace-slice2-'));
  const screenshot=join(directory,'failure.png'),trace=join(directory,'trace.zip');
  const errors:string[]=[];
  try{await page.screenshot({path:screenshot,timeout:5000});}catch(error){errors.push(String(error));}
  try{await page.context().tracing.stop({path:trace});}catch(error){errors.push(String(error));}
  console.log('WORKSPACE_SLICE2_FAILURE_ARTIFACTS '+JSON.stringify({directory,screenshot,trace,errors}));
  try{
  const active=page.locator(".case-link.active");if(!await active.count())return;const id=await active.getAttribute("data-case-id");if(!id)return;
  const artifact=await host.application.exportReadArtifact(id),view=(await (await page.request.get(host.baseUrl+"/api/cases/"+encodeURIComponent(id))).json()).view;
  console.log(JSON.stringify({slice2Failure:{phase:view.case.phase,progress:view.restaurant.progress,presented:view.restaurant.presentedCandidateIds,ready:view.restaurant.readyCandidateIds,readStatus:view.restaurant.readStatus,
    checks:Object.entries(view.restaurant.availabilityChecks).map(([id,check])=>({id,status:(check as {status:string}).status,reason:(check as {reasonCode?:string}).reasonCode})),
    events:(artifact.events as Array<{event:{type:string;candidateIds?:string[];reason?:string}}>).map(e=>e.event).filter(e=>["RESULTS_PRESENTED","NEXT_BATCH_REPLENISHMENT_REQUESTED","AVAILABILITY_FAILED","AGENT_LOOP_TERMINATED"].includes(e.type))}}));
  }catch(error){console.log('WORKSPACE_SLICE2_DIAGNOSTIC_ERROR '+String(error));}
}

for(const size of sizes)for(const scenario of ["structured","missing"] as const){
  test("Workspace slice2 "+size.name+": server revision differences and saved reasons "+scenario,{timeout:35_000},async()=>{
    const host=await startWorkspaceFixture({revisionScenario:scenario}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
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
      assert.equal(await page.locator("#removed-count").innerText(),"2 no longer match");assert.equal(await page.locator("#added-count").innerText(),"1 new, ");
      await page.locator("#revision-changes summary").click();
      const reasons=await page.locator("#removed-list").innerText();assert.match(reasons,new RegExp(oldBudget));assert.match(reasons,new RegExp(oldTime));
      if(scenario==="structured"){assert.match(reasons,/Over budget/);assert.match(reasons,/Doesn't match the new time/);}else{assert.equal(await page.getByText("No longer matches",{exact:true}).count(),0);assert.equal(await page.locator("#removed-list li").count(),2);}
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
    const host=await startWorkspaceFixture({outcome}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
    try{
      await start(page,host,"Dinner to adjust",0);assert.equal(await page.locator("#empty-message").innerText(),outcome==="empty"?"Couldn't confirm a matching place this time. Try adjusting the area, time, or party size.":"Couldn't reach the sources. Try again?");
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

  test("Workspace slice2 "+size.name+": semantic model failure keeps the submitted text and hides the stale card, then accepts rephrasing",{timeout:25_000},async()=>{
    const bad="Unreadable fixture request",host=await startWorkspaceFixture({semanticFailureMessage:bad}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
    try{
      await start(page,host,"Dinner with friends");await page.locator("#next").click();const reads=host.providerCalls.length;
      const savedName=await page.locator("#restaurant-name").innerText();
      await page.locator("#bookmark").click();
      await page.getByRole("button",{name:"Saved 1",exact:true}).waitFor();
      await page.locator("#message").fill(bad);await page.getByRole("button",{name:"Send",exact:true}).click();await page.locator("#understanding-error").waitFor({state:"visible"});
      assert.equal(await page.locator("#understanding-error").innerText(),"Couldn't read that. Try rephrasing?");assert.equal(await page.locator("#message").inputValue(),bad);
      const notice=await page.locator("#understanding-error").boundingBox(),composer=await page.locator("#composer").boundingBox();assert.ok(notice&&composer&&notice.y>=0&&notice.y+notice.height<=composer.y,"the model-failure next step must be fully visible above the fixed composer");
      assert.equal(await page.locator("#candidate-panel").isVisible(),false);assert.equal(host.providerCalls.length,reads);
      assert.equal(await page.locator("#messages").innerText(),"");await capture(page,size.name+"-slice2-model-failure");
      await page.locator("#saved").click();
      const saved=page.locator("#saved-list .saved-row");
      assert.equal(await saved.count(),1);
      assert.equal(await saved.innerText(),savedName,"Saved retains the name without an arrow or mismatch claim");
      assert.equal(await saved.isDisabled(),true);
      await page.locator("#saved-back").click();
      await page.locator("#message").fill("Make it three people");await page.getByRole("button",{name:"Send",exact:true}).click();await ready(page);
      assert.equal(await page.locator("#understanding-error").isVisible(),false);assert.equal(await page.locator("#message").inputValue(),"");
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });

  test("Workspace slice2 "+size.name+": partial source failure keeps qualified results and places the notice at the batch end",{timeout:25_000},async()=>{
    const host=await startWorkspaceFixture({outcome:"partial"}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
    try{
      await start(page,host,"Two dinner options",2);assert.equal(await page.locator("#empty-state").isVisible(),false);assert.equal(await page.locator("#partial-source-note").isVisible(),false);
      await page.locator("#next").click();assert.equal(await page.locator("#partial-source-note").isVisible(),false);
      assert.equal(await page.locator("#candidate-panel").isVisible(),true);assert.doesNotMatch(await page.locator("#partial-source-note").innerText(),/no seats|no restaurants nearby/i);
      await page.locator("#next").click();await page.locator("#batch-end").waitFor({state:"visible"});assert.equal(await page.locator("#partial-source-note").isVisible(),true);assert.equal(await page.locator("#partial-source-note").innerText(),"Some sources couldn't be checked.");
      await capture(page,size.name+"-slice2-partial-source");
    }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
  });
}

for(const size of sizes)for(const continuation of ["pool","search"] as const){
  test("Workspace slice2 "+size.name+": empty continuation uses proven unread "+continuation+", is idempotent and never rereads rejected outlets",{timeout:30_000},async()=>{
    const host=await startWorkspaceFixture({continuation}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
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
    const host=await startWorkspaceFixture({continuation:"pool"}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
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
 const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);
 try{
  await start(page,host,"Dinner for two",3,true);
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.fonts.check('15px "DM Sans"')),true);
  for(const selector of ['#brand','#case-title','#request-conditions button','.case-link span','#restaurant-name','#choose','#details-button','#card-counter','#message','#profile-label','#handoff-slot']){
   const family=await page.locator(selector).first().evaluate(n=>getComputedStyle(n).fontFamily);
   assert.match(family,/^["']?DM Sans["']?,/,'all UI text and brand use DM Sans: '+selector);assert.doesNotMatch(family,/Geist/);
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('#availability-status').innerText(),'Mon, Nov 2');
  assert.deepEqual(await page.locator('.slot-options .slot-time').allTextContents(),['19:00','19:30']);
  assert.equal(await page.locator('.slot-options .muted').count(),0);
  for(const item of ['#new-case','#saved','#details-button'])assert.equal(await page.locator(item).evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
  assert.equal(await page.locator('#saved .saved-icon').count(),1);
  for(const item of ['.slot-time','#saved-count','#card-counter'])assert.equal(await page.locator(item).first().evaluate(n=>getComputedStyle(n).fontVariantNumeric),'tabular-nums');
  const name=await page.locator('#restaurant-name').boundingBox(),qa=await page.locator('#details-button').boundingBox(),footer=await page.locator('#card-actions').boundingBox(),choose=await page.locator('#choose').boundingBox(),pagination=await page.locator('#card-pagination').boundingBox();
  assert.ok(name&&qa&&footer&&choose&&pagination);assert.ok(footer.y>=choose.y+choose.height);assert.ok(qa.x>name.x+name.width);assert.ok(qa.y<=name.y+name.height&&qa.y+qa.height>=name.y);assert.ok(qa.height<44);assert.ok(await page.locator('#details-button').evaluate(e=>{const s=getComputedStyle(e,'::before');return e.getBoundingClientRect().height-parseFloat(s.top)-parseFloat(s.bottom)>=44;}));assert.ok(Math.abs(qa.x+qa.width-choose.x-choose.width)<1);assert.equal(await page.locator('#card-actions').locator('#details-button').count(),0);
  const laterTime=page.getByRole('button',{name:'Time 19:30 on Mon, Nov 2',exact:true});await laterTime.click();
  assert.equal(await laterTime.getAttribute('aria-pressed'),'true');assert.equal(await laterTime.evaluate(n=>n.matches(':focus-visible')),false);assert.equal(await page.locator('.slot-time[aria-pressed=true]').count(),1);
  const style=await laterTime.evaluate(n=>{const s=getComputedStyle(n);return {background:s.backgroundColor,color:s.color,radius:s.borderRadius,weight:s.fontWeight,shadow:s.boxShadow};});
  const selectedBackground=await page.evaluate(()=>{const probe=document.createElement('span');probe.style.background='color-mix(in srgb,#3D5AFE 16%,#fff)';document.body.append(probe);const value=getComputedStyle(probe).backgroundColor;probe.remove();return value;});
  assert.equal(style.background,selectedBackground);assert.equal(style.color,'rgb(21, 23, 43)');assert.equal(style.radius,'8px');assert.equal(style.weight,await page.locator('.slot-time[aria-pressed=false]').evaluate(n=>getComputedStyle(n).fontWeight));assert.equal(style.shadow,'none');
  await page.reload();await page.locator('#candidate-panel').waitFor();assert.equal(await laterTime.getAttribute('aria-pressed'),'true');
  await capture(page,size.name+'-card-slot-summary');
  await page.locator('#choose').click();const selector=page.getByLabel('Booking time',{exact:true});
  assert.equal(await selector.locator('option').count(),2);
  const initial=await page.locator('#departure').getAttribute('href');
  const choices=await selector.locator('option').evaluateAll(nodes=>nodes.map(n=>(n as HTMLOptionElement).value));
  await selector.selectOption(choices[0]!);
  const later=await page.locator('#departure').getAttribute('href');assert.notEqual(later,initial);
  assert.equal(await page.locator('#direct-source').isVisible(),false);
  assert.match(initial!,/start_time=19%3A30/);assert.match(later!,/start_time=19%3A00/);
  await page.reload();await page.locator('#handoff').waitFor({state:'visible'});
  assert.equal(await page.locator('#departure').getAttribute('href'),later);
  await capture(page,size.name+'-3c-multiple-slots');
  await context.route('https://**/*',route=>route.abort());
  const outgoing=page.waitForRequest(r=>r.method()==='POST'&&r.url().endsWith('/booking-departures'));
  await page.locator('#departure').click();
  assert.equal((await outgoing).postDataJSON().offerId,choices[0]);

 }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
});

for(const size of sizes)test('Workspace inline condition '+size.name+': capped local edit survives SSE and routes changes without touching composer',{timeout:45_000},async()=>{
 let release:()=>void=()=>{};
 const host=await startWorkspaceFixture({questions:true});const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);
 try{
  const original='dinner in ginza with FRIENDS and enough space to talk and a late start';
  await start(page,host,original);
  assert.equal(await page.locator('#case-title').textContent(),original.replace(/^d/,'D'));assert.equal(await page.locator('#case-title').getAttribute('title'),original);
  assert.equal(await page.locator('.case-link.active span').textContent(),original.replace(/^d/,'D'));assert.equal(await page.locator('.case-link.active').getAttribute('title'),original);
  for(const selector of ['#case-title','.case-link.active span'])assert.equal(await page.locator(selector).evaluate(n=>getComputedStyle(n).webkitLineClamp),'2');
  assert.equal(await page.locator('#saved-count').isVisible(),false);assert.equal(await page.locator('#saved-count').textContent(),'0');assert.equal(await page.locator('#saved').innerText(),'Saved');
  assert.equal(await page.locator('#saved-count').evaluate(n=>getComputedStyle(n).color),'rgb(95, 98, 117)');
  assert.equal(await page.locator('#choose').innerText(),"Let's book");assert.equal(await page.locator('#details-button').innerText(),'About ›');assert.equal(await page.locator('#evidence').isVisible(),false);
  await page.locator('#details-button').click();assert.match(await page.locator('#evidence').innerText(),/TableCheck · Checked Oct 29/);await page.locator('#details-back').click();
  const avatar=await page.locator('#profile-avatar').boundingBox();if(size.name==='desktop'){assert.ok(avatar);assert.equal(avatar.width,28);assert.equal(avatar.height,28);}assert.equal(await page.locator('#profile-label').textContent(),'Fixture account');
  // Dedicated HTTP error-path coverage keeps the editor open. The positive
  // four-field Save test below uses real HTTP/SSE and fixture transports, without routes.
  const cases=[{label:'Mon, Nov 2',type:'date',value:'2026-11-03',message:'Change Mon, Nov 2 to 2026-11-03'},
    {label:'19:00–19:30',type:'time',value:'19:15',message:'Change 19:00–19:30 to 19:15–19:45'}];
  for(const item of cases){
   await page.getByRole('button',{name:item.label,exact:true}).click();const field=page.getByLabel('Edit '+item.label,{exact:true});assert.equal(await field.getAttribute('type'),item.type);await field.fill(item.value);
   if(item.type==='time')await page.getByLabel('End time',{exact:true}).fill('19:45');
   let message='';await page.route('**/api/conversations/*/messages',async route=>{message=route.request().postDataJSON().message;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Controlled fixture failure'})});});
   const failed=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/messages'));await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await failed).status(),503);await page.waitForFunction(()=>document.querySelector('.editor-save')?.getAttribute('aria-busy')==='false');assert.equal(message,item.message);
   await page.unroute('**/api/conversations/*/messages');await page.getByRole('button',{name:'Cancel condition change',exact:true}).click();
  }
  await page.getByRole('button',{name:'Tokyo',exact:true}).click();const text=page.getByRole('textbox',{name:'Edit Tokyo',exact:true});assert.equal(await text.getAttribute('maxlength'),'30');await text.fill('x'.repeat(30));await text.press('End');await page.keyboard.insertText('y');assert.equal((await text.inputValue()).length,30);assert.equal(await page.locator('.condition-counter').count(),0);await text.press('Escape');

  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  // Compare footprints in the row's content coordinates: focusing may scroll the Case and chip strip.
  const before=await page.locator('#request-conditions').evaluate(n=>{const row=n.getBoundingClientRect();return Array.from(n.children).map(x=>{const r=x.getBoundingClientRect();return {x:r.x-row.x+n.scrollLeft,y:r.y-row.y,width:r.width,height:r.height};});});await page.locator('#message').fill('Keep my unsent question');
  await page.getByRole('button',{name:'2 guests',exact:true}).click();const editor=page.getByRole('spinbutton',{name:'Edit 2 guests',exact:true});
  const after=await page.locator('#request-conditions').evaluate(n=>{const row=n.getBoundingClientRect();return Array.from(n.children).map(x=>{const r=x.getBoundingClientRect();return {x:r.x-row.x+n.scrollLeft,y:r.y-row.y,width:r.width,height:r.height};});});
  assert.equal(after.length,before.length);
  if(size.width>=960){for(let i=0;i<before.length;i++)for(const key of ['x','y','width','height'] as const)assert.ok(Math.abs(after[i]![key]-before[i]![key])<1,'desktop editing preserves every pill footprint '+JSON.stringify({before,after}));}
  else{
   for(let i=0;i<before.length-1;i++)for(const key of ['x','y','width','height'] as const)assert.ok(Math.abs(after[i]![key]-before[i]![key])<1,'other mobile pills keep their footprint');
   const flow=after.at(-1)!;assert.ok(flow.y>=Math.max(...after.slice(0,-1).map(r=>r.y+r.height))+8);assert.ok(Math.abs(flow.x)<1);assert.ok(flow.height>=32);
   const metrics=await page.locator('.condition-editor').evaluate(form=>({position:getComputedStyle(form).position,anchorWidth:form.parentElement!.getBoundingClientRect().width,rowWidth:document.getElementById('request-conditions')!.getBoundingClientRect().width,inlineWidth:(form.parentElement as HTMLElement).style.width,controls:[...form.querySelectorAll('input,button')].map(n=>({left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right}))}));
   assert.equal(metrics.position,'static');assert.equal(metrics.inlineWidth,'');assert.ok(Math.abs(metrics.anchorWidth-metrics.rowWidth)<1);assert.ok(metrics.controls.every(r=>r.left>=0&&r.right<=size.width));
  }
  const overlay=await page.locator('.condition-editor').boundingBox(),row=await page.locator('#request-conditions').boundingBox();assert.ok(overlay&&row&&overlay.x>=row.x-1&&overlay.x+overlay.width<=row.x+row.width+1);
  assert.equal(await editor.getAttribute('type'),'number');assert.equal(await editor.getAttribute('min'),'1');await editor.fill('0');assert.equal(await page.getByRole('button',{name:'Save',exact:true}).isDisabled(),true);
  await editor.fill('3');const handle=await editor.elementHandle();
  // An external shortlist update exercises SSE without the new outside-click dismissal.
  const currentView=await activeView(page);const saved=await page.request.post(host.baseUrl+'/api/cases/'+encodeURIComponent(currentView.case.caseId)+'/shortlist',{data:{candidateId:currentView.restaurant.presentedCandidateIds![0],shortlisted:true,taskVersion:currentView.case.taskVersion,requestId:crypto.randomUUID()}});assert.equal(saved.status(),200);
  await page.waitForFunction(()=>document.getElementById('saved-count')?.textContent==='1');
  assert.equal(await handle!.evaluate(n=>n===document.querySelector('.condition-editor input')),true);assert.equal(await editor.inputValue(),'3');
  await capture(page,size.name+'-inline-condition');await editor.press('Escape');assert.equal(await page.locator('#message').inputValue(),'Keep my unsent question');
  await page.getByRole('button',{name:'2 guests',exact:true}).click();await page.getByRole('spinbutton',{name:'Edit 2 guests',exact:true}).fill('5');
  await page.locator('#case-title').click();assert.equal(await page.locator('.condition-editor').count(),0);assert.equal(await page.getByRole('button',{name:'2 guests',exact:true}).isVisible(),true);
  await page.getByRole('button',{name:'2 guests',exact:true}).click();await page.locator('.condition-edit-anchor').click({position:{x:1,y:1}});assert.equal(await page.locator('.condition-editor').count(),1,'anchor clicks keep editing');
  await page.locator('#saved').focus();await page.keyboard.press('Escape');assert.equal(await page.locator('.condition-editor').count(),0,'Escape closes an editor even when focus moved outside it');
  assert.equal(await page.locator('#message').inputValue(),'Keep my unsent question');

  await page.locator('#details-button').click();await page.getByRole('button',{name:'2 guests',exact:true}).click();await editor.fill('3');
  const gate=new Promise<void>(r=>{release=r;});await page.route('**/api/conversations/*/messages',async route=>{await gate;await route.continue();});
  const save=page.getByRole('button',{name:'Save',exact:true}),normal=await save.boundingBox();
  const sent=page.waitForRequest(r=>r.method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));
  await save.click();await page.waitForFunction(()=>document.querySelector('.condition-editor button[type=submit]')?.getAttribute('aria-busy')==='true');
  const pending=await save.boundingBox();assert.ok(normal&&pending&&normal.width===pending.width&&normal.height===pending.height);assert.equal(await save.isDisabled(),true);assert.equal(await page.locator('#message').inputValue(),'Keep my unsent question');
  await page.locator('#case-title').click();await page.locator('#message').focus();await page.keyboard.press('Escape');
  assert.equal(await page.locator('.condition-editor').count(),1,'outside click and global Escape cannot cancel an in-flight edit');assert.equal(await save.getAttribute('aria-busy'),'true');
  await capture(page,size.name+'-inline-pending');release();assert.equal((await sent).postDataJSON().message,'Change 2 guests to 3');
  await page.getByRole('button',{name:'3 guests',exact:true}).waitFor();assert.equal(host.questionRequests.length,0);assert.equal(await page.locator('#message').inputValue(),'Keep my unsent question');
  assert.equal(await page.locator('.condition-editor').count(),0);
 }catch(error){await failureDiagnostic(page,host);throw error;}finally{release();await context.close();await browser.close();await host.close();}
});

for(const size of sizes)test('Workspace booking refresh '+size.name+': stale browsing stays actionable and only fresh same-candidate evidence enters handoff',{timeout:45_000},async()=>{
 const host=await startWorkspaceFixture({sourceValidityMs:60_000,multiSlot:true,naturalRecommendation:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await tracedPage(context);
 let refreshes=0,departures=0;page.on('request',r=>{if(r.method()==='POST'){if(new URL(r.url()).pathname.endsWith('/refresh'))refreshes++;if(new URL(r.url()).pathname.endsWith('/booking-departures'))departures++;}});
 try{
  await start(page,host,'dinner in ginza');await page.getByRole('button',{name:'Time 19:30 on Mon, Nov 2',exact:true}).click();assert.equal(await page.locator('#recommendation').innerText(),'A good fit for your dinner plans in this area.');
  const id=await page.locator('.case-link.active').getAttribute('data-case-id'),path='/api/cases/'+encodeURIComponent(id!);
  const initial=(await(await page.request.get(path)).json()).view;
  const ttl=Math.min(...Object.values(initial.restaurant.availabilityChecks).map((v:unknown)=>Date.parse((v as {displayExpiresAt:string}).displayExpiresAt)))-host.clock.now().valueOf()+100;
  host.clock.advance(ttl);await page.clock.fastForward(ttl);
  assert.equal(await page.locator('#choose').isEnabled(),true);await capture(page,size.name+'-booking-stale');await page.locator('#message').fill('Keep draft');
  await page.route('**/refresh',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Sources unavailable'})}));
  await page.locator('#choose').click();await page.getByText('Sources unavailable',{exact:true}).waitFor();assert.equal(await page.locator('#handoff').isVisible(),false);assert.equal(refreshes,1);await page.unroute('**/refresh');
  await page.route('**/refresh',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({view:initial})}));
  await page.locator('#choose').click();await page.getByText("Availability couldn't be confirmed. Try again.",{exact:true}).waitFor();assert.equal(await page.locator('#handoff').isVisible(),false);assert.equal(refreshes,2);await page.unroute('**/refresh');
  host.hold();await page.locator('#choose').evaluate(b=>{(b as HTMLButtonElement).click();(b as HTMLButtonElement).click();});await host.waitForCheck();
  assert.equal(await page.locator('#choose').isDisabled(),true,await page.evaluate(async()=>{const {state}=await import(String("/assets/workspace/runtime.js"));return JSON.stringify({blocked:state.blocked,preparing:state.preparing,mode:state.ui.view});}));assert.equal(await page.locator('#choose').getAttribute('aria-busy'),'true');assert.equal(await page.locator('#handoff').isVisible(),false);host.release();
  await page.locator('#handoff').waitFor({state:'visible'});assert.equal(refreshes,3);assert.match((await page.locator('#departure').getAttribute('href'))!,/start_time=19%3A30/);assert.equal(departures,0);assert.equal(await page.locator('#message').inputValue(),'Keep draft');assert.equal(await page.locator('#handoff-name').innerText(),initial.restaurant.candidates[0].restaurant.outletName);await capture(page,size.name+'-booking-refreshed');
  const current=(await(await page.request.get(path)).json()).view;assert.equal(current.restaurant.selectedCandidateId,initial.restaurant.selectedCandidateId);
  // A newer visit must not be pulled back into preparation by a late refresh.
  await page.locator('#handoff-back').click();host.clock.advance(61_000);await page.clock.fastForward(61_000);host.hold();
  await page.locator('#choose').click();await host.waitForCheck();await page.locator('#new-case').click();host.release();
  await page.locator('#home').waitFor({state:'visible'});await eventually(()=>host.providerCalls.every(call=>call.completed||call.aborted));
  assert.equal(await page.locator('#handoff').isVisible(),false);assert.equal(await page.locator('#home').isVisible(),true);assert.equal(refreshes,4);assert.equal(departures,0);

 }catch(error){await failureDiagnostic(page,host);throw error;}finally{host.release();await context.close();await browser.close();await host.close();}
});

for(const size of sizes)test('Workspace selected slot '+size.name+': missing handoff and a refreshed different time never silently switch the choice',{timeout:35_000},async()=>{
 const options={multiSlot:true,sourceValidityMs:60_000};const host=await startWorkspaceFixture(options),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);
 try{
  await start(page,host,'Dinner with an explicit time choice');await page.getByRole('button',{name:'Time 19:30 on Mon, Nov 2',exact:true}).click();
  const caseId=await page.locator('.case-link.active').getAttribute('data-case-id'),view=(await(await page.request.get(host.baseUrl+'/api/cases/'+encodeURIComponent(caseId!))).json()).view;
  const candidateId=view.restaurant.presentedCandidateIds[0],offer=view.restaurant.availability[candidateId][1];assert.ok(offer);assert.equal(host.forgetPrepared(candidateId,offer.id),true);
  await page.reload();await page.locator('#candidate-panel').waitFor();await page.locator('#choose').click();await page.locator('#handoff').waitFor();
  assert.equal(await page.locator('#departure').isVisible(),false);assert.equal(await page.locator('#handoff-unavailable').isVisible(),true);assert.equal(await page.locator('#handoff-slot').isEnabled(),true);await capture(page,size.name+'-selected-link-missing');
  await page.locator('#handoff-back').click();const ttl=Math.min(...Object.values(view.restaurant.availabilityChecks).map((v:unknown)=>Date.parse((v as {displayExpiresAt:string}).displayExpiresAt)))-host.clock.now().valueOf()+100;host.clock.advance(ttl);await page.clock.fastForward(ttl);options.multiSlot=false;
  await page.locator('#choose').click();await page.getByText("Availability couldn't be confirmed. Try again.",{exact:true}).waitFor();
  assert.equal(await page.locator('#handoff').isVisible(),false);assert.deepEqual(await page.locator('.slot-time').allTextContents(),['19:00']);await capture(page,size.name+'-selected-time-changed');
  await page.getByRole('button',{name:'Time 19:00 on Mon, Nov 2',exact:true}).click();await page.locator('#choose').click();await page.locator('#handoff').waitFor();assert.match((await page.locator('#departure').getAttribute('href'))!,/start_time=19%3A00/);
  const current=(await(await page.request.get(host.baseUrl+'/api/cases/'+encodeURIComponent(caseId!))).json()).view;assert.equal(current.restaurant.selectedCandidateId,undefined);
 }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
});

async function activeView(page:Page):Promise<import('../../application/agent-workspace.js').RestaurantCaseView>{
 const id=await page.locator('.case-link.active').getAttribute('data-case-id');assert.ok(id);
 const response=await page.request.get(new URL('/api/cases/'+encodeURIComponent(id),page.url()).href);assert.equal(response.status(),200);return(await response.json()).view;
}
for(const size of sizes)test('Workspace equivalent intent '+size.name+': reaffirmation retains the batch without a phantom revision diff',{timeout:35_000},async()=>{
 const host=await startWorkspaceFixture(),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);
 try{
  await start(page,host,'Dinner with friends');await page.locator('#bookmark').click();await page.waitForFunction(()=>document.getElementById('saved-count')?.textContent==='1');
  const before=await activeView(page),artifact=await host.application.exportReadArtifact(before.case.caseId),reads=host.providerCalls.length;
  const presentations=(a:typeof artifact)=>(a.events as Array<{event:{type:string}}>).filter(e=>e.event.type==='RESULTS_PRESENTED').length;
  for(const message of ['Keep the same dinner conditions','Same dinner, please']){
   await page.locator('#message').fill(message);const reply=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));
   await page.locator('#send').click();assert.equal((await reply).status(),200);await page.waitForFunction(()=>(document.getElementById('message') as HTMLTextAreaElement).value==='');
   const after=await activeView(page),actual=await host.application.exportReadArtifact(before.case.caseId);
   assert.equal(after.case.phase,'PRESENT_RESULTS');assert.deepEqual(after.restaurant.intentDraft,before.restaurant.intentDraft);
   assert.deepEqual(after.restaurant.presentedCandidateIds,before.restaurant.presentedCandidateIds);assert.equal(presentations(actual),presentations(artifact),'the reducer retained presentation without another RESULTS_PRESENTED');
   assert.equal(host.providerCalls.length,reads,'reaffirmation cannot trigger source reads');
   const lastCompilation=(actual.events as Array<{event:{type:string;patch?:Record<string,unknown>}}>).findLast(e=>e.event.type==='SEMANTIC_PROPOSAL_COMPILED');assert.ok(lastCompilation?.event.patch&&Object.keys(lastCompilation.event.patch).length>1,'this is an equivalent nonempty patch, not an omitted proposal');
   assert.deepEqual(after.restaurant.revisionDiff?.removed??[],[],'equivalent intent must not remove the restaurants still on screen');
   assert.equal(after.restaurant.requirementRevision,before.restaurant.requirementRevision);assert.equal(await page.locator('#revision-changes').isVisible(),false);
   assert.equal(after.restaurant.savedCandidates[0]?.current,true);
  }
  await page.reload();await page.locator('#candidate-panel').waitFor();assert.equal(await page.locator('#revision-changes').isVisible(),false);
 }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
});

const unchangedEdits=[
 {kind:'area',label:'Tokyo',changed:'Ginza',restored:'Tokyo'},
 {kind:'date',label:'Mon, Nov 2',changed:'2026-11-03',restored:'2026-11-02'},
 {kind:'time',label:'19:00–19:30',changed:'20:00',restored:'19:00'},
 {kind:'guests',label:'2 guests',changed:'3',restored:'2.0'},
];
for(const size of sizes)for(const item of unchangedEdits)test('Workspace unchanged Save '+size.name+' '+item.kind+': equivalent native value cancels without a message',{timeout:25_000},async()=>{
 const host=await startWorkspaceFixture(),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);
 const messages:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'))messages.push(r.postDataJSON().message);});
 try{
  await start(page,host,'Dinner with friends');const before=await activeView(page),reads=host.providerCalls.length;
  await page.locator('#message').fill('Keep my unsent draft');await page.getByRole('button',{name:item.label,exact:true}).click();
  const field=page.getByLabel('Edit '+item.label,{exact:true});await field.fill(item.changed);await field.fill(item.restored);
  if(item.kind==='time'){await page.getByLabel('End time',{exact:true}).fill('20:30');await page.getByLabel('End time',{exact:true}).fill('19:30');}
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.locator('.condition-editor').waitFor({state:'detached'});
  assert.deepEqual(messages,[],'unchanged Save must not submit even for native controls');
  const after=await activeView(page);assert.equal(after.case.taskVersion,before.case.taskVersion);assert.equal(after.restaurant.requirementRevision,before.restaurant.requirementRevision);
  assert.equal(host.providerCalls.length,reads);assert.equal(await page.locator('#message').inputValue(),'Keep my unsent draft');
 }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
});

for(const size of sizes)test('Workspace inline Save end to end '+size.name+': area date time and guests reach the reducer, fresh sources and chips',{timeout:60_000},async()=>{
 const host=await startWorkspaceFixture({multiSlot:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);
 const sent:string[]=[];page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'))sent.push(r.postDataJSON().message);});
 try{
  await start(page,host,'Dinner with friends');await page.locator('#message').fill('Keep this unrelated draft');
  const steps=[
   {label:'Tokyo',value:'Ginza',chip:'Ginza',message:'Change Tokyo to Ginza',field:'area'},
   {label:'Mon, Nov 2',value:'2026-11-03',chip:'Tue, Nov 3',message:'Change Mon, Nov 2 to 2026-11-03',field:'date'},
   {label:'19:00–19:30',value:'20:00',end:'20:30',chip:'20:00–20:30',message:'Change 19:00–19:30 to 20:00–20:30',field:'time'},
   {label:'2 guests',value:'3',chip:'3 guests',message:'Change 2 guests to 3',field:'party'},
  ];
  for(const step of steps){
   const before=await activeView(page),reads=host.providerCalls.length,searches=host.searches.length;
   await page.getByRole('button',{name:step.label,exact:true}).click();await page.getByLabel('Edit '+step.label,{exact:true}).fill(step.value);
   if(step.end)await page.getByLabel('End time',{exact:true}).fill(step.end);
   const reply=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await reply).status(),200);
   await page.locator('.condition-editor').waitFor({state:'detached'});await ready(page);const after=await activeView(page),draft=after.restaurant.intentDraft!;
   assert.equal(draft.area?.query,'Ginza','the area edit is retained by all later messages');
   if(step.field!=='area')assert.equal(draft.date,'2026-11-03');
   if(step.field==='time'||step.field==='party')assert.deepEqual(draft.timeWindow,{earliest:'20:00',latest:'20:30'});
   if(step.field==='party')assert.equal(draft.partySize,3);
   assert.equal(sent.at(-1),step.message);assert.equal(after.restaurant.requirementRevision,before.restaurant.requirementRevision+1);
   assert.ok(host.searches.length>searches,'actual changed requirements restart discovery');assert.equal(host.providerCalls.length-reads,3,'all three results were checked under the new intent');
   const request=host.searches.at(-1)!.intent;assert.equal(request.area?.query,draft.area?.query);assert.equal(request.date,draft.date);assert.deepEqual(request.timeWindow,draft.timeWindow);assert.equal(request.partySize,draft.partySize);
   for(const read of host.providerCalls.slice(reads))assert.deepEqual({date:read.date,timeWindow:read.timeWindow,partySize:read.partySize},{date:draft.date,timeWindow:draft.timeWindow,partySize:draft.partySize});
   assert.deepEqual([after.restaurant.revisionDiff?.removed.length,after.restaurant.revisionDiff?.added.length],[0,0]);
   assert.equal(await page.getByRole('button',{name:step.chip,exact:true}).count(),1);assert.equal(await page.locator('#revision-changes').isVisible(),false);
   assert.equal(await page.locator('#message').inputValue(),'Keep this unrelated draft');
   const offers=after.restaurant.availability[after.restaurant.presentedCandidateIds![0]!]!;
   assert.ok(offers.length);assert.ok(offers.every(o=>o.dateTime.startsWith(draft.date!)&&o.partySize===draft.partySize));
  }
  assert.equal(sent.length,4);
  const beforeReaffirm=await activeView(page),readCount=host.providerCalls.length;
  await page.locator('#message').fill('Same dinner, please');const reaffirm=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));await page.locator('#send').click();assert.equal((await reaffirm).status(),200);await page.waitForFunction(()=>(document.getElementById('message') as HTMLTextAreaElement).value==='');
  const afterReaffirm=await activeView(page);assert.deepEqual(afterReaffirm.restaurant.intentDraft,beforeReaffirm.restaurant.intentDraft,'reaffirmation after edits must not restore the original fixture conditions');assert.equal(afterReaffirm.restaurant.requirementRevision,beforeReaffirm.restaurant.requirementRevision);assert.equal(host.providerCalls.length,readCount);assert.deepEqual(afterReaffirm.restaurant.revisionDiff,beforeReaffirm.restaurant.revisionDiff);
  await page.reload();await page.locator('#candidate-panel').waitFor();assert.equal(await page.getByRole('button',{name:'Ginza',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Tue, Nov 3',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'20:00–20:30',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'3 guests',exact:true}).count(),1);
 }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
});

for(const size of sizes)test('Workspace composer keyboard '+size.name+': Enter sends, IME and Shift+Enter do not, workspace height resets',{timeout:40_000},async()=>{
 const host=await startWorkspaceFixture({questions:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);let release=()=>{};
 try{
  page.setDefaultTimeout(10_000);await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#home').waitFor();
  const message=page.locator('#message'),height=()=>message.evaluate(e=>e.getBoundingClientRect().height);
  await message.fill('Line\n'.repeat(10));assert.equal(await height(),64,'home retains its default height');
  await page.locator('#composer').evaluate(e=>{e.setAttribute('data-submits','0');e.addEventListener('submit',()=>e.setAttribute('data-submits',String(Number(e.getAttribute('data-submits'))+1)));});
  await message.fill('Dinner for two');await message.dispatchEvent('compositionstart');await message.dispatchEvent('keydown',{key:'Enter',code:'Enter',isComposing:true});await message.dispatchEvent('compositionend');
  assert.equal(await page.locator('#composer').getAttribute('data-submits'),'0','IME Enter must not submit');
  await message.press('End');await message.press('Shift+Enter');assert.equal(await message.inputValue(),'Dinner for two\n');assert.equal(await page.locator('#composer').getAttribute('data-submits'),'0');
  const [created]=await Promise.all([page.waitForResponse(r=>new URL(r.url()).pathname==='/api/cases'&&r.request().method()==='POST'),(async()=>{await message.press('Enter');assert.equal(await page.locator('#composer').getAttribute('data-submits'),'1','Enter submits the home form');})()]);assert.equal(created.status(),201);await ready(page);assert.equal(await message.inputValue(),'');
  const oneLine=await height();await message.fill('Line\n'.repeat(3));assert.ok(await height()>oneLine);await message.fill('Line\n'.repeat(30));assert.equal(await height(),140);await message.fill('Short');assert.ok(Math.abs(await height()-oneLine)<1);
  await message.fill('Same dinner, please\n\n');const gate=new Promise<void>(resolve=>{release=resolve;});let posts=0;
  await page.route('**/api/conversations/*/messages',async route=>{posts++;await gate;await route.continue();});
  const posted=page.waitForRequest(r=>r.method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));await message.press('Enter');assert.equal((await posted).postDataJSON().message,'Same dinner, please');await page.waitForFunction(()=>document.querySelector('#send')?.getAttribute('aria-busy')==='true');
  await message.press('Enter');assert.equal(posts,1,'repeated Enter cannot duplicate the pending request');
  const updated=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));release();assert.equal((await updated).status(),200);await page.waitForFunction(()=>document.querySelector<HTMLTextAreaElement>('#message')?.value==='');assert.ok(Math.abs(await height()-oneLine)<1);await page.unroute('**/api/conversations/*/messages');
  await page.locator('#details-button').click();await message.fill('Is a credit card required?');const question=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/questions'));await message.press('Enter');assert.equal((await question).status(),200);await page.locator('#answer-sheet').waitFor();assert.equal(host.questionRequests.length,1);assert.equal(await message.inputValue(),'');await page.keyboard.press('Escape');await page.locator('#answer-sheet').waitFor({state:'hidden'});
  await message.fill('Line\n'.repeat(20));assert.equal(await height(),140);await page.locator('#new-case').click();await page.locator('#home').waitFor();assert.equal(await message.inputValue(),'');assert.equal(await height(),64);assert.equal(await message.evaluate(e=>(e as HTMLElement).style.height),'');
 }catch(error){await failureDiagnostic(page,host);throw error;}finally{release();await context.close();await browser.close();await host.close();}
});

for(const size of sizes)test('Workspace profile dismissal '+size.name+': one account label, outside/Escape close and Saved hides its own entry',{timeout:30_000},async()=>{
 const host=await startWorkspaceFixture(),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);
 try{
  await start(page,host,'Dinner for two');await page.locator('#bookmark').click();await page.waitForFunction(()=>document.getElementById('saved-count')?.textContent==='1');
  const mobile=size.name==='mobile',openSidebar=async()=>{if(mobile&&!await page.locator('#plans').isVisible())await page.locator('#menu').click();};
  await openSidebar();await page.locator('#profile > summary').click();assert.equal(await page.locator('#profile').getAttribute('open')!==null,true);assert.equal(await page.locator('#profile-name').isVisible(),false);assert.equal((await page.locator('#profile').innerText()).split('Fixture account').length-1,1);assert.equal(await page.locator('#logout').isVisible(),true);
  await page.locator('#plans-heading').click();assert.equal(await page.locator('#profile').getAttribute('open'),null);
  await page.locator('#profile > summary').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#profile').getAttribute('open'),null);
  if(mobile)assert.equal(await page.locator('#plans').isVisible(),false);
  await page.locator('#saved').click();await page.locator('#saved-panel').waitFor();assert.equal(await page.locator('#saved').isVisible(),false);assert.equal(await page.locator('#saved-list .saved-row').count(),1);await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#saved-panel').isVisible(),true);
  await page.locator('#saved-back').click();assert.equal(await page.locator('#saved').isVisible(),true);assert.equal(await page.locator('#saved').getAttribute('aria-label'),'Saved 1');
  await openSidebar();await page.locator('#profile > summary').click();await page.locator('#logout').click();await page.locator('#login').waitFor();
 }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
});

for(const size of sizes)test('Workspace card keyboard '+size.name+': arrows use pagination and respect editors, input, overlays, modifiers and batch end',{timeout:35_000},async()=>{
 const host=await startWorkspaceFixture({questions:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size}),page=await tracedPage(context);
 try{
  await start(page,host,'Dinner for two');const counter=page.locator('#card-counter');const unchanged=async()=>assert.equal(await counter.textContent(),'2 of 3');
  await page.locator('#next').focus();await page.keyboard.press('ArrowRight');await unchanged();
  await page.locator('#message').fill('Keep this draft');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowLeft');await unchanged();
  await page.locator('#next').focus();for(const modifier of [{ctrlKey:true},{metaKey:true},{altKey:true}]){await page.locator('#next').dispatchEvent('keydown',{key:'ArrowRight',...modifier});await unchanged();}
  await page.getByRole('button',{name:'Tokyo',exact:true}).click();await page.locator('#next').focus();await page.keyboard.press('ArrowRight');await unchanged();await page.keyboard.press('Escape');assert.equal(await page.locator('.condition-editor').count(),0);
  for(const kind of ['input','select','editable']){await page.evaluate(kind=>{const e=document.createElement(kind==='editable'?'div':kind);e.id='keyboard-editable';if(kind==='editable')e.contentEditable='true';if(kind==='select')e.append(document.createElement('option'));document.body.append(e);e.focus();},kind);await page.keyboard.press('ArrowLeft');await unchanged();await page.locator('#keyboard-editable').evaluate(e=>e.remove());}
  if(size.name==='mobile'){await page.locator('#menu').click();await page.keyboard.press('ArrowRight');await unchanged();await page.locator('#collapse-plans').click();}
  await page.locator('#details-button').click();await page.locator('#message').fill('Is a credit card required?');await page.locator('#send').click();await page.locator('#answer-sheet').waitFor();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#details').isVisible(),true);await page.keyboard.press('Escape');await page.locator('#details-back').click();await unchanged();
  await page.locator('#next').focus();await page.keyboard.press('ArrowRight');assert.equal(await counter.textContent(),'3 of 3');await page.keyboard.press('ArrowRight');await page.locator('#batch-end').waitFor();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#batch-end').isVisible(),true,'batch-end view cannot silently page backwards');
  await page.locator('#batch-back').click();await page.locator('#next').focus();await page.keyboard.press('ArrowLeft');await unchanged();await page.keyboard.press('ArrowLeft');assert.equal(await counter.textContent(),'1 of 3');await page.keyboard.press('ArrowLeft');assert.equal(await counter.textContent(),'1 of 3');
 }catch(error){await failureDiagnostic(page,host);throw error;}finally{await context.close();await browser.close();await host.close();}
});
