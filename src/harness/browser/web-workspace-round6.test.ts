import assert from "node:assert/strict";
import test from "node:test";
import { mkdir,writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium,type Page } from "playwright-core";
import { startWorkspaceFixture } from "../workspace-fixture-server.js";
import { createPhotoSourceFixture } from "../restaurant-photo-fixtures.js";

type Host=Awaited<ReturnType<typeof startWorkspaceFixture>>;
async function open(page:Page,host:Host){
  page.setDefaultTimeout(10_000);await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);
  await page.getByLabel("Access token",{exact:true}).fill("workspace-fixture");await page.getByRole("button",{name:"Sign in",exact:true}).click();
  await page.locator("#message").fill("Dinner in Tokyo");await page.locator("#send").click();
  await page.waitForFunction(()=>document.getElementById("card-counter")?.textContent==="1 of 3");
  const id=await page.locator(".case-link.active").getAttribute("data-case-id");return(await(await page.request.get("/api/cases/"+id)).json()).view;
}
// These tests control only the public projection/SSE boundary after a real local login/read.
// They do not alter persisted Case evidence, production state or model decisions.
async function projectionStream(page:Page){
  await page.addInitScript({content:`
    const streams=[];window.__projectionStreams=streams;
    class FixtureStream extends EventTarget{
      static CONNECTING=0;static OPEN=1;static CLOSED=2;readyState=1;
      constructor(url){super();streams.push(this);queueMicrotask(()=>this.dispatchEvent(new Event('open')));}
      close(){this.readyState=2;}
    }
    window.EventSource=FixtureStream;
  `});
}
async function emit(page:Page,view:unknown){await page.evaluate(view=>{for(const stream of (window as any).__projectionStreams??[])if(stream.readyState===1)stream.dispatchEvent(new MessageEvent("case",{data:JSON.stringify(view)}));},view);}
async function loaded(page:Page,id:string){await page.waitForFunction(id=>{const img=document.getElementById(id) as HTMLImageElement|null;return !!img?.complete&&img.naturalWidth>0;},id);}

for(const size of [{width:390,height:844},{width:1440,height:900}])test(`Round6 ${size.width}: Details and Handoff retain active reads, then leave failed or removed results`,{timeout:40_000},async()=>{
  const source=await createPhotoSourceFixture(),host=await startWorkspaceFixture({photoHttp:source.http,multiSlot:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size,baseURL:host.baseUrl});
  await context.route("**/*",r=>new URL(r.request().url()).hostname==="127.0.0.1"?r.continue():r.abort());const page=await context.newPage();
  try{
    const original=await open(page,host);host.disconnectStreams();let projected=structuredClone(original);
    await projectionStream(page);await page.route("**/api/cases/*",r=>r.request().method()==="GET"&&!r.request().url().endsWith("/events")?r.fulfill({json:{view:projected}}):r.continue());
    await page.reload();await page.locator("#details-button").click();await loaded(page,"detail-photo");
    assert.equal(await page.locator("#refresh").innerText(),"Refresh availability");
    await page.locator("#message").fill("Retain this draft");await page.locator("#detail-photo-open").click();await loaded(page,"large-photo");const photo=await page.locator("#large-photo").getAttribute("src");
    projected.case.phase="SEARCHING";projected.restaurant.progress.active=true;await emit(page,projected);
    assert.equal(await page.locator("#details").isVisible(),true);assert.equal(await page.locator("#photo-viewer").isVisible(),true);assert.equal(await page.locator("#large-photo").getAttribute("src"),photo);
    assert.equal(await page.locator("#refresh").isVisible(),false);assert.equal(await page.locator("#refresh").isDisabled(),true);assert.equal(await page.locator("#refresh").getAttribute("aria-busy"),"true");assert.equal(await page.locator("#details-refresh-status").innerText(),"Refreshing…");
    projected.case.phase="FAILED";projected.restaurant.progress.active=false;projected.restaurant.readStatus.kind="OTHER_FAILURE";projected.restaurant.presentedCandidateIds=[];projected.restaurant.readyCandidateIds=[];await emit(page,projected);
    await page.locator("#details").waitFor({state:"hidden"});assert.equal(await page.locator("#photo-viewer").isVisible(),false);assert.equal(await page.locator("#empty-message").innerText(),"Couldn't complete this search. Please try again.");assert.equal(await page.locator("#message").inputValue(),"Retain this draft");
    projected=structuredClone(original);await emit(page,projected);await page.locator("#choose").click();await page.locator("#handoff").waitFor({state:"visible"});
    projected.case.phase="SEARCHING";projected.restaurant.progress.active=true;await emit(page,projected);assert.equal(await page.locator("#handoff").isVisible(),true);
    projected.case.phase="PRESENT_RESULTS";projected.restaurant.progress.active=false;projected.restaurant.presentedCandidateIds=projected.restaurant.presentedCandidateIds.slice(1);await emit(page,projected);
    await page.locator("#handoff").waitFor({state:"hidden"});await page.locator("#candidate-panel").waitFor({state:"visible"});assert.equal(await page.locator("#restaurant-name").innerText(),projected.restaurant.candidates.find((c:any)=>c.restaurant.id===projected.restaurant.presentedCandidateIds[0]).restaurant.outletName);
    await page.locator("#details-button").click();projected.restaurant.presentedCandidateIds=[];projected.case.phase="NO_VERIFIED_RESULT";projected.restaurant.readStatus.kind="NO_QUALIFIED_RESULTS";await emit(page,projected);await page.locator("#details").waitFor({state:"hidden"});await page.locator("#empty-state").waitFor({state:"visible"});
  }finally{await context.close();await browser.close();await host.close();}
});

test("Round6: refresh labels use the whole presented batch, retry and goal rather than only the current outlet",{timeout:30_000},async()=>{
  const host=await startWorkspaceFixture({multiSlot:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl}),page=await context.newPage();
  await context.route("**/*",r=>new URL(r.request().url()).hostname==="127.0.0.1"?r.continue():r.abort());
  try{
    const original=await open(page,host);host.disconnectStreams();let projected=structuredClone(original);await projectionStream(page);await page.route("**/api/cases/*",r=>r.request().method()==="GET"&&!r.request().url().endsWith("/events")?r.fulfill({json:{view:projected}}):r.continue());await page.reload();await page.locator("#details-button").click();
    const [current,other]=projected.restaurant.presentedCandidateIds;projected.restaurant.intentDraft.target.goal="RECOMMENDATION";delete projected.restaurant.intentDraft.target.goalBasis;
    projected.restaurant.availability={};projected.restaurant.availabilityChecks={};projected.restaurant.readStatus.canRetry=false;await emit(page,projected);assert.equal(await page.locator("#refresh").innerText(),"Refresh details");
    projected.restaurant.availability[other]=original.restaurant.availability[other];await emit(page,projected);assert.equal(await page.locator("#refresh").innerText(),"Refresh availability","mixed batch: a different outlet has displayed inventory");assert.equal(projected.restaurant.availability[current],undefined);
    projected.restaurant.availability={};projected.restaurant.availabilityChecks[other]=original.restaurant.availabilityChecks[other];await emit(page,projected);assert.equal(await page.locator("#refresh").innerText(),"Refresh availability");
    projected.restaurant.availabilityChecks={};projected.restaurant.intentDraft.target.goal="AVAILABILITY";await emit(page,projected);assert.equal(await page.locator("#refresh").innerText(),"Refresh availability");
    projected.restaurant.intentDraft.target.goal="RECOMMENDATION";projected.restaurant.readStatus.canRetry=true;await emit(page,projected);assert.equal(await page.locator("#refresh").innerText(),"Refresh availability");
    projected.restaurant.progress.active=true;await emit(page,projected);assert.equal(await page.locator("#refresh").innerText(),"Refreshing…");assert.equal(await page.locator("#refresh").isDisabled(),true);
  }finally{await context.close();await browser.close();await host.close();}
});

for(const size of [{width:390,height:844},{width:768,height:1024},{width:1440,height:900}])for(const available of [true,false])test(`Round6 Style1 ${size.width}x${size.height} ${available?"available":"not-checked"}: aligned condition rows and clean availability`,{timeout:30_000},async()=>{
  const host=await startWorkspaceFixture({multiSlot:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
  const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error"&&!m.text().includes("401 (Unauthorized)"))errors.push(m.text());});page.on("response",r=>{if(r.status()>=400&&!(r.status()===401&&new URL(r.url()).pathname==="/api/session"))errors.push(r.status()+" "+new URL(r.url()).pathname);});
  page.on("requestfailed",r=>{const reason=r.failure()?.errorText;if(reason&&reason!=="net::ERR_ABORTED")errors.push(reason+" "+new URL(r.url()).pathname);});
  await context.route("**/*",r=>new URL(r.request().url()).hostname==="127.0.0.1"?r.continue():r.abort());
  try{
    const projected=await open(page,host),id=projected.restaurant.presentedCandidateIds[0];host.disconnectStreams();await projectionStream(page);
    projected.restaurant.conditionStates={[id]:[{text:"serves beer",status:"MET",strength:"HARD",polarity:"POSITIVE",evidenceIds:["fixture-menu"],sources:[{field:"SOURCE_TEXT",quote:"We serve beer with our meals.",sourceUrl:"https://venue.example/menu"}]},{text:"quiet seating",status:"NOT_CHECKED",strength:"SOFT",polarity:"POSITIVE",evidenceIds:[],sources:[]},{text:"outdoor seats",status:"NOT_MET",strength:"SOFT",polarity:"POSITIVE",evidenceIds:[],sources:[]}]};
    projected.restaurant.candidates.forEach((c:any)=>c.matchReasons=[]);
    if(!available){projected.restaurant.availability={};projected.restaurant.availabilityChecks={};projected.restaurant.intentDraft.target.goal="RECOMMENDATION";delete projected.restaurant.intentDraft.target.goalBasis;}
    await page.route("**/api/cases/*",r=>r.request().method()==="GET"&&!r.request().url().endsWith("/events")?r.fulfill({json:{view:projected}}):r.continue());await page.reload();await page.locator("#candidate-panel").waitFor({state:"visible"});
    assert.deepEqual(await page.locator("#delivery-conditions .condition-name").allTextContents(),["Serves beer","Outdoor seats"]);assert.deepEqual(await page.locator("#delivery-conditions .condition-status").allTextContents(),["Confirmed","Not a match"]);
    assert.doesNotMatch(await page.locator("#delivery-conditions").innerText(),/—|not checked|not met|·/);
    const metrics=await page.locator("#delivery-conditions").evaluate(node=>{const style=getComputedStyle(node);const buttonGap=document.getElementById("choose")!.getBoundingClientRect().top-node.getBoundingClientRect().bottom;return{buttonGap,font:style.fontSize,line:style.lineHeight,margin:style.marginTop,gap:style.rowGap,rows:[...node.querySelectorAll(".condition-row")].map(row=>{const style=getComputedStyle(row),name=row.querySelector(".condition-name")!,status=row.querySelector(".condition-status")!,a=name.getBoundingClientRect(),b=status.getBoundingClientRect();return{display:style.display,align:style.alignItems,justify:style.justifyContent,gap:style.columnGap,color:getComputedStyle(name).color,status:getComputedStyle(status).color,statusText:status.textContent,distance:b.left-a.right,rightGap:node.getBoundingClientRect().right-b.right};})};});
    assert.ok(metrics.buttonGap>=12, `Expected 12px between conditions and booking, got ${metrics.buttonGap}px`);
    assert.equal(metrics.font,"13px");assert.equal(metrics.margin,"10px");assert.equal(metrics.gap,"6px");assert.ok(Math.abs(parseFloat(metrics.line)-18.85)<0.1);for(const row of metrics.rows){assert.equal(row.display,"flex");assert.equal(row.align,"baseline");assert.equal(row.justify,"space-between");assert.equal(row.gap,"12px");assert.equal(row.color,"rgb(21, 23, 43)");assert.equal(row.status,row.statusText==='Confirmed'?"rgb(61, 90, 254)":"rgb(95, 98, 117)");assert.ok(row.distance>=12);assert.ok(Math.abs(row.rightGap)<1);}
    assert.equal(await page.locator("#recommendation").isVisible(),false);
    const availability=await page.locator("#availability-status").evaluate(n=>{const s=getComputedStyle(n),before=getComputedStyle(n,"::before");return{text:n.textContent,font:s.fontSize,weight:s.fontWeight,color:s.color,before:before.content};});
    if(available){assert.match(availability.text!,/^Mon, Nov 2$/);assert.equal(availability.font,"13px");assert.equal(availability.weight,"600");assert.equal(availability.color,"rgb(21, 23, 43)");assert.equal(await page.locator(".slot-time").first().evaluate(n=>getComputedStyle(n).borderRadius),"8px");}
    else{assert.equal(availability.text,"Not checked");assert.equal(availability.font,"13px");assert.equal(availability.weight,"500");assert.equal(availability.color,"rgb(95, 98, 117)");assert.ok(["none","normal"].includes(availability.before));assert.equal(await page.locator("#delivery-slots").isVisible(),false);}
    const output=process.env.PRAXIS_ROUND6_VISUAL_OUTPUT;
    const name=`style1-${size.width}x${size.height}-${available?"available":"not-checked"}`;
    const cardConditions=await page.locator("#delivery-conditions .condition-status").allTextContents();
    if(output){
      await mkdir(output,{recursive:true});
      await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
      await page.locator("#case-title").click();
      await page.screenshot({path:join(output,name+".png"),animations:"disabled"});
    }
    await page.locator("#details-button").click();
    const detailConditions=await page.locator("#details-content .condition-status").allTextContents();
    assert.deepEqual(detailConditions,["Confirmed","Unverified","Not a match"]);
    await page.locator("#details-back").click();
    projected.restaurant.conditionStates[id][1].strength="HARD";
    await emit(page,projected);
    assert.deepEqual(await page.locator("#delivery-conditions .condition-status").allTextContents(),["Confirmed","Unverified","Not a match"]);
    assert.deepEqual(errors,[]);
    if(output)await writeFile(join(output,name+".json"),JSON.stringify({
      viewport:size,kind:available?"available":"not-checked",source:"controlled public projection after actual local HTTP Fixture read",
      metrics,availability,cardConditions,detailConditions,hardUnverifiedVisible:true,errors,
    },null,2)+"\n");
  }finally{await context.close();await browser.close();await host.close();}
});

async function captureRound8(page:Page,name:string){
  const output=process.env.PRAXIS_ROUND8_VISUAL_OUTPUT;
  if(!output)return;
  await mkdir(output,{recursive:true});
  await page.evaluate(()=>document.fonts.ready.then(()=>undefined));
  await page.screenshot({path:join(output,name+".png"),animations:"disabled"});
}

test("Round8 UI: real Stop retains About and never offers an unavailable refresh", {timeout:30_000}, async()=>{
  const sourceValidityMs=5*60_000;
  const host=await startWorkspaceFixture({staged:true,sourceValidityMs});
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({baseURL:host.baseUrl,viewport:{width:390,height:844}});
  await context.route("**/*",r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());
  const page=await context.newPage();
  let shortlistPosts=0,refreshPosts=0;
  page.on("request",r=>{
    if(r.method()!=="POST")return;
    if(r.url().endsWith("/shortlist"))shortlistPosts++;
    if(r.url().endsWith("/refresh"))refreshPosts++;
  });
  try{
    await page.clock.install({time:host.clock.now()});
    await page.goto(host.baseUrl);
    await page.getByLabel("Access token",{exact:true}).fill("workspace-fixture");
    await page.getByRole("button",{name:"Sign in",exact:true}).click();
    await page.locator("#message").fill("Dinner in Tokyo");
    await page.locator("#send").click();
    await host.waitForCheck();
    await page.locator("#progress.has-card").waitFor();
    assert.match(await page.locator("#stages").innerText(),/^Looking for more options\s*·\s*1 checked$/);
    assert.equal(await page.locator(".case-link.active small").textContent(),"In progress");
    assert.equal(await page.locator("#stop").innerText(),"Stop searching");
    const stages=await page.locator("#stages").boundingBox(),stop=await page.locator("#stop").boundingBox();
    assert.ok(stages&&stop&&stop.x-stages.x-stages.width<=20&&Math.abs(stop.y-stages.y)<8);
    await captureRound8(page,"has-card-searching");
    const stopped=page.waitForResponse(r=>r.request().method()==="DELETE"&&r.url().endsWith("/run"));
    await page.locator("#stop").click();
    assert.equal((await stopped).status(),200);
    await page.waitForFunction(()=>document.querySelector(".case-link.active small")?.textContent==="Stopped");
    assert.equal(await page.locator("#bookmark").isDisabled(),true);
    await page.locator("#bookmark").evaluate(node=>node.dispatchEvent(new MouseEvent("click",{bubbles:true})));
    await page.locator("#details-button").click();
    await page.locator("#details").waitFor();
    assert.equal(await page.locator("#details-name").innerText(),"Fixture Sushi");
    await page.locator("#details-back").click();
    await page.locator("#candidate-panel").waitFor();
    assert.equal(await page.locator("#bookmark").isDisabled(),true);
    assert.equal(shortlistPosts,0);
    assert.equal(await page.locator("#messages").innerText(),"Search stopped.");
    assert.equal(await page.locator("#case-workspace").evaluate(node=>node.scrollTop),0);
    const message=await page.locator("#messages").boundingBox(),composer=await page.locator("#workspace-composer").boundingBox();
    assert.ok(message&&composer&&message.y>=0&&message.y+message.height<=composer.y,
      `Search stopped must fit above the composer without scrolling: ${JSON.stringify({message,composer})}`);
    await captureRound8(page,"stopped-ready-card");

    await page.locator("#choose").click();
    await page.locator("#departure").waitFor();
    assert.match(await page.locator("#departure").getAttribute("href")??"",/^https:/);
    host.clock.advance(sourceValidityMs+1000);
    await page.clock.fastForward(sourceValidityMs+1000);
    assert.equal(await page.locator("#handoff").isVisible(),true);
    assert.equal(await page.locator("#departure").isVisible(),false,"Stopped Handoff must hide the expired refresh link");
    assert.equal(await page.locator("#handoff-unavailable").isVisible(),true);
    assert.equal(await page.locator("#direct-source").isVisible(),true);
    assert.equal(await page.locator("#handoff-unavailable").innerText(),
      "No current booking handoff is available. You can check the source website.");
    await page.locator("#departure").evaluate(node=>node.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})));
    await page.locator("#handoff-back").click();
    assert.equal(await page.locator("#availability-status").innerText(),"Expired");
    assert.equal(await page.locator("#choose").isDisabled(),true);
    await page.locator("#choose").evaluate(node=>node.dispatchEvent(new MouseEvent("click",{bubbles:true})));
    assert.equal(await page.locator("#handoff").isVisible(),false);
    assert.equal(refreshPosts,0);
  }finally{host.release();await context.close();await browser.close();await host.close();}
});

test("Round8 UI: SSE switches the idle card to the eligible outlet and removes stale cards on empty results", {timeout:30_000}, async()=>{
  const host=await startWorkspaceFixture({multiSlot:true});
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({baseURL:host.baseUrl,viewport:{width:390,height:844}});
  await context.route("**/*",r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());
  const page=await context.newPage();
  try{
    const view=await open(page,host);host.disconnectStreams();
    const [a,b]=view.restaurant.presentedCandidateIds;
    view.case.phase="SELECTION_REQUIRED";
    view.restaurant.readyCandidateIds=[a];
    await projectionStream(page);
    await page.route(host.baseUrl+"/api/cases/"+encodeURIComponent(view.case.caseId),r=>r.fulfill({json:{view}}));
    await page.reload();
    await page.locator("#candidate-panel").waitFor();
    assert.equal(await page.locator("#candidate-card").getAttribute("data-candidate-id"),a);
    await page.locator("#delivery-slots .slot-time").nth(1).click();
    view.case.taskVersion++;
    view.restaurant.readyCandidateIds=[b];
    await emit(page,view);
    assert.equal(await page.locator("#candidate-card").getAttribute("data-candidate-id"),b);
    assert.equal(await page.locator("#choose").isEnabled(),true);
    const offer=await page.evaluate(async()=>{const {state}=await import(String("/assets/workspace/runtime.js"));return state.ui.selectedSlot;});
    assert.equal(offer,undefined,"the previous restaurant selection cannot select a time on the new card");
    for(const [phase,kind] of [["NO_VERIFIED_RESULT","NO_QUALIFIED_RESULTS"],["FAILED","OTHER_FAILURE"]]){
      view.case.taskVersion++;
      view.case.phase=phase;view.restaurant.readStatus.kind=kind;view.restaurant.readyCandidateIds=[];
      assert.ok(view.restaurant.candidates.some((c:any)=>c.restaurant.id===a));
      await emit(page,view);
      assert.equal(await page.locator("#candidate-panel").isVisible(),false);
      assert.equal(await page.locator("#empty-state").isVisible(),true);
      assert.equal(await page.locator("#messages").isVisible(),false);
    }
  }finally{await context.close();await browser.close();await host.close();}
});

test("Round8 UI: the original request and later reply appear beside the current clarification and hide in other states", {timeout:30_000}, async()=>{
  const host=await startWorkspaceFixture();
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({baseURL:host.baseUrl,viewport:{width:390,height:844}});
  await context.route("**/*",r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());
  const page=await context.newPage();
  try{
    const initial=await open(page,host);host.disconnectStreams();
    const view=structuredClone(initial);
    view.case.phase="NEEDS_INPUT";view.case.status="NEEDS_YOU";
    view.restaurant.readStatus.kind="PENDING";
    view.restaurant.readyCandidateIds=[];
    view.restaurant.clarificationQuestion="Which day works for you?";
    view.conversation.messages.push({role:"ASSISTANT",content:"Historical answer must not appear"});
    await projectionStream(page);
    await page.route(host.baseUrl+"/api/cases/"+encodeURIComponent(view.case.caseId),r=>r.fulfill({json:{view}}));
    await page.reload();
    await page.locator("#messages").waitFor();
    assert.equal(await page.locator("#clarification-reply").innerText(),"Dinner in Tokyo");
    assert.equal(await page.locator("#messages").innerText(),view.restaurant.clarificationQuestion);
    assert.doesNotMatch(await page.locator("#case-workspace").innerText(),/historical answer/i);
    await captureRound8(page,"clarification-first");
    const reply="Around 7pm, please";
    await page.route("**/api/conversations/*/messages",async r=>{
      assert.equal(r.request().postDataJSON().message,reply);
      view.case.taskVersion++;
      view.conversation.messages.push({role:"USER",content:reply},{role:"ASSISTANT",content:"Second historical answer must not appear"});
      await r.fulfill({json:{view}});
    });
    await page.locator("#message").fill(reply);
    await page.locator("#send").click();
    await page.locator("#clarification-reply").waitFor();
    assert.equal(await page.locator("#clarification-reply").innerText(),reply);
    assert.equal(await page.locator("#messages").innerText(),view.restaurant.clarificationQuestion);
    assert.equal(await page.locator("#message").inputValue(),"");
    assert.doesNotMatch(await page.locator("#case-workspace").innerText(),/historical answer/i);
    await captureRound8(page,"clarification-reply");
    await page.locator("#saved").click();
    assert.equal(await page.locator("#clarification-reply").isVisible(),false);
    await page.locator("#saved-back").click();
    assert.equal(await page.locator("#clarification-reply").isVisible(),true);
    await emit(page,{...view,case:{...view.case,phase:"SEARCHING",status:"ACTIVE",taskVersion:view.case.taskVersion+1},
      restaurant:{...view.restaurant,progress:{active:true,stopped:false}}});
    assert.equal(await page.locator("#clarification-reply").isVisible(),false);
    await emit(page,{...initial,case:{...initial.case,taskVersion:view.case.taskVersion+2},conversation:view.conversation});
    assert.equal(await page.locator("#candidate-panel").isVisible(),true);
    assert.equal(await page.locator("#clarification-reply").isVisible(),false);
  }finally{await context.close();await browser.close();await host.close();}
});

test("Round8 UI: case list orders initial, new, and SSE-updated cases without replacing the focused row", {timeout:35_000}, async()=>{
  const host=await startWorkspaceFixture();
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({baseURL:host.baseUrl,viewport:{width:1440,height:900}});
  await context.route("**/*",r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());
  const page=await context.newPage();
  try{
    const first=await open(page,host);
    const firstId=first.case.caseId as string;
    host.clock.advance(1000);
    await page.locator("#new-case").click();
    await page.locator("#message").fill("Dinner on my next visit");
    await page.locator("#send").click();
    await page.waitForFunction(firstId=>{
      const row=document.querySelector<HTMLElement>(".case-link.active");
      return !!row&&row.dataset.caseId!==firstId&&row.querySelector("small")?.textContent==="Ready";
    },firstId);
    const secondId=(await page.locator(".case-link.active").getAttribute("data-case-id"))!;
    const order=()=>page.locator("#case-list .case-link").evaluateAll(rows=>rows.map(row=>(row as HTMLElement).dataset.caseId));
    assert.deepEqual(await order(),[secondId,firstId]);
    const {cases}=await(await page.request.get("/api/cases")).json();
    assert.deepEqual(cases.map((s:{caseId:string})=>s.caseId),[secondId,firstId]);
    // Exercise all user-visible labels with controlled case summaries. The two
    // real Cases still use their ordinary local HTTP and SSE routes.
    const controls=[
      {caseId:"z-clarification",title:"Unfinished dinner",phase:"NEEDS_INPUT",status:"NEEDS_YOU",label:"Needs details"},
      {caseId:"a-progress",title:"Dinner in Ginza",phase:"SEARCHING",status:"ACTIVE",label:"In progress"},
      {caseId:"empty",title:"Dinner with a terrace",phase:"NO_VERIFIED_RESULT",status:"COMPLETED",label:"No verified results"},
      {caseId:"stopped",title:"Dinner near the station",phase:"FAILED",status:"COMPLETED",stopped:true,label:"Stopped"},
      {caseId:"failed",title:"Dinner after work",phase:"FAILED",status:"COMPLETED",label:"Failed"},
    ];
    const oldTime=new Date(Date.parse(first.case.updatedAt)-1000).toISOString();
    const extra=controls.map(({label,...summary})=>({...first.case,...summary,updatedAt:oldTime}));
    await page.route(host.baseUrl+"/api/cases",r=>r.request().method()==="GET"?r.fulfill({json:{cases:[...cases,...extra].reverse()}}):r.continue());
    await page.reload();
    await page.waitForFunction(()=>document.querySelectorAll("#case-list .case-link").length===7);
    const controlOrder=controls.map(s=>s.caseId).sort((a,b)=>a.localeCompare(b));
    assert.deepEqual(await order(),[secondId,firstId,...controlOrder]);
    for(const {caseId,label} of controls)assert.equal(await page.locator(`[data-case-id="${caseId}"] small`).innerText(),label);
    const firstRow=page.locator(`.case-link[data-case-id="${firstId}"]`);
    assert.equal(await firstRow.locator("small").innerText(),"Ready");
    await firstRow.click();
    await page.waitForFunction(firstId=>document.querySelector<HTMLElement>(".case-link.active")?.dataset.caseId===firstId,firstId);
    // Wait for the real stream before advancing the older Case.
    const started=Date.now();
    while(host.activeStreamCount()!==1&&Date.now()-started<5000)await new Promise(resolve=>setTimeout(resolve,10));
    assert.equal(host.activeStreamCount(),1);
    const row=await firstRow.elementHandle();
    await firstRow.focus();
    host.clock.advance(1000);
    const current=await host.application.getCase("workspace-user",firstId);
    await host.application.setShortlist({userId:"workspace-user",caseId:firstId,candidateId:current.restaurant.presentedCandidateIds![0]!,
      expectedVersion:current.case.taskVersion,requestId:"round8-sidebar",shortlisted:true});
    await page.waitForFunction(firstId=>document.querySelector<HTMLElement>("#case-list .case-link")?.dataset.caseId===firstId,firstId);
    assert.deepEqual(await order(),[firstId,secondId,...controlOrder]);
    assert.equal(await firstRow.evaluate((node,original)=>node===original&&document.activeElement===node,row),true);
    assert.deepEqual((await(await page.request.get("/api/cases")).json()).cases.map((s:{caseId:string})=>s.caseId),[firstId,secondId]);
    await captureRound8(page,"sidebar-order-and-status");
  }finally{await context.close();await browser.close();await host.close();}
});

test("Round8 UI: a blocked booking popup cannot persist a departure or mark a return", {timeout:25_000}, async()=>{
  const host=await startWorkspaceFixture({multiSlot:true});
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({baseURL:host.baseUrl,viewport:{width:390,height:844}});
  await context.route("**/*",r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());
  const page=await context.newPage();
  let departurePosts=0;
  page.on("request",r=>{if(r.method()==="POST"&&r.url().endsWith("/booking-departures"))departurePosts++;});
  try{
    await open(page,host);
    await page.locator("#choose").click();
    await page.locator("#departure").waitFor();
    await page.evaluate(()=>{window.open=()=>null;});
    await page.locator("#departure").click();
    await page.locator("#error").waitFor();
    assert.equal(await page.locator("#error").innerText(),"Please allow this source tab to open.");
    assert.equal(departurePosts,0);
    assert.equal(await page.evaluate(()=>Object.keys(localStorage).some(key=>key.endsWith(":return"))),false);
    const rows=await host.database.query<{total:number}>("select count(*)::int as total from restaurant_booking_departures");
    assert.equal(rows.rows[0]?.total,0);
  }finally{await context.close();await browser.close();await host.close();}
});

async function round20Projection(page:Page,host:Host,view:import('../../application/agent-workspace.js').RestaurantCaseView){
 host.disconnectStreams();await projectionStream(page);
 await page.route('**/api/cases/*',route=>route.request().method()==='GET'&&new URL(route.request().url()).pathname==='/api/cases/'+encodeURIComponent(view.case.caseId)?route.fulfill({json:{view}}):route.continue());
 await page.reload();await page.locator('#candidate-panel').waitFor();
}
for(const size of [{width:390,height:844},{width:1440,height:900}])test(`Round20 UI: ${size.width} design rows, source equivalence, batch actions and revision summaries`,{timeout:35_000},async()=>{
 const host=await startWorkspaceFixture({multiSlot:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size,baseURL:host.baseUrl});
 await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());const page=await context.newPage();
 try{
  const original=await open(page,host) as import('../../application/agent-workspace.js').RestaurantCaseView,projected=structuredClone(original),id=projected.restaurant.presentedCandidateIds![0]!,c=projected.restaurant.candidates.find(c=>c.restaurant.id===id)!;
  await round20Projection(page,host,projected);
  c.restaurant.address='1000001 Tokyo, Chiyoda 1-2-3';c.matchReasons=[];
  projected.restaurant.conditionStates={[id]:[{text:'Serves beer',strength:'HARD',polarity:'POSITIVE',status:'MET',criterionRef:'criterion:0',sources:[],explanation:'Fixture',evidenceIds:[]}]};
  const base=original.restaurant.readEvidence[0]!;
  const google={...base,candidateId:id,kind:'RESTAURANT_FACT' as const,provider:'GOOGLE_PLACES' as const,sourceUrl:'https://maps.google.com/?q=fixture',claims:{restaurantTypeFacts:['izakaya','japanese_restaurant']}};
  const tabelog={...base,candidateId:id,kind:'RESTAURANT_FACT' as const,provider:'TABELOG' as const,sourceUrl:'https://tabelog.com/fixture',claims:{},sourceFieldQuotes:[{field:'CATEGORY' as const,quote:'Izakaya (Japanese style tavern)',sourceUrl:'https://tabelog.com/fixture'}]};
  projected.restaurant.currentFactEvidence=[google,tabelog];
  const update=async()=>{projected.case.taskVersion++;await emit(page,projected);};await update();
  assert.equal(await page.locator('#source-categories').isVisible(),false,'equivalent source categories are not a conflict');
  assert.equal(await page.locator('#key-facts .address-line').innerText(),'Tokyo, Chiyoda 1-2-3');
  assert.equal(await page.locator('#availability-status').innerText(),'Mon, Nov 2');
  const geometry=await page.evaluate(()=>{
   const availability=document.getElementById('availability')!,condition=document.querySelector('#delivery-conditions .condition-row')!,button=document.getElementById('choose')!,about=document.getElementById('details-button')!;
   return {availabilityJustify:getComputedStyle(availability).justifyContent,conditionJustify:getComputedStyle(condition).justifyContent,availabilityRight:availability.lastElementChild!.getBoundingClientRect().right,conditionRight:condition.lastElementChild!.getBoundingClientRect().right,aboutRight:about.getBoundingClientRect().right,gap:button.getBoundingClientRect().top-document.getElementById('delivery-conditions')!.getBoundingClientRect().bottom,margin:getComputedStyle(button).marginTop,bottom:getComputedStyle(button).marginBottom};
  });
  assert.equal(geometry.availabilityJustify,'space-between');assert.equal(geometry.conditionJustify,'space-between');assert.ok(Math.abs(geometry.availabilityRight-geometry.aboutRight)<1);assert.ok(Math.abs(geometry.conditionRight-geometry.aboutRight)<1);assert.equal(geometry.margin,'16px');assert.equal(geometry.bottom,'2px');assert.ok(geometry.gap>=16);
  await captureRound8(page,`round20-${size.width}-aligned-card`);
  projected.restaurant.progress={active:true,stopped:false,stage:'CHECKING'};await update();assert.equal(await page.locator('#card-counter').evaluate(n=>getComputedStyle(n).visibility),'hidden');assert.ok((await page.locator('#card-counter').boundingBox())!.width>=44);projected.restaurant.progress={active:false,stopped:false};
  projected.restaurant.currentFactEvidence=[google,{...tabelog,provider:'RESTAURANT_WEBSITE',sourceUrl:'https://www.k-daia.com/menu',sourceFieldQuotes:[{field:'CATEGORY',quote:'French house',sourceUrl:'https://www.k-daia.com/menu'}]}];await update();
  assert.deepEqual(await page.locator('#source-categories a').allTextContents(),['Google Maps ↗','k-daia.com ↗']);assert.doesNotMatch(await page.locator('#source-categories').innerText(),/RESTAURANT_WEBSITE|Source$/);
  const names=await page.evaluate(async()=>{const {sourceName}=await import(String('/assets/workspace/format.js'));return [sourceName('RESTAURANT_WEBSITE'),sourceName('RESTAURANT_WEBSITE','https://www.ginzano.jp/menu'),sourceName('NEW_PROVIDER'),sourceName('OTHER','https://www.tabelog.com/a'),sourceName('OTHER','https://tablecheck.com/a')];});assert.deepEqual(names,['Source page','ginzano.jp','New provider','Tabelog','TableCheck']);
  await captureRound8(page,`round20-${size.width}-source-domains`);await page.locator('#details-button').click();assert.equal(await page.locator('#details-content .about-address').innerText(),c.restaurant.address);assert.match(await page.locator('#evidence').innerText(),/ · Checked Oct 29$/);await captureRound8(page,`round20-${size.width}-about-layers`);await page.locator('#details-back').click();
  await page.locator('#next').click();await page.locator('#next').click();await page.locator('#next').click();await page.locator('#batch-end').waitFor();assert.equal(await page.locator('#end-saved').count(),0);
  const buttons=await page.locator('#end-options>button').evaluateAll(items=>items.map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));assert.equal(buttons.length,2);assert.ok(Math.abs(buttons[0]!.width-buttons[1]!.width)<1);assert.ok(buttons.every(b=>b.height>=48));assert.equal(await page.locator('#end-options').evaluate(n=>getComputedStyle(n).gap),'12px');await captureRound8(page,`round20-${size.width}-batch-actions`);
  await page.locator('#batch-back').click();
  const added=[1,2,3].map(i=>({candidateId:'new'+i,outletName:'New '+i})),removed=[1,2,3].map(i=>({candidateId:'old'+i,outletName:'Old '+i,reasonCode:'NO_LONGER_MATCHES' as const}));
  projected.restaurant.revisionDiff={fromRevision:1,toRevision:2,added,removed};await update();assert.match(await page.locator('#revision-changes summary').textContent()??'',/^3 new, 3 no longer match▾$/);await page.locator('#revision-changes summary').click();assert.equal(await page.locator('#removed-list li').count(),3);await captureRound8(page,`round20-${size.width}-revision-mixed`);
  projected.restaurant.revisionDiff={fromRevision:2,toRevision:3,added:[],removed:removed.slice(0,1)};await update();assert.equal(await page.locator('#revision-changes summary').textContent(),'1 no longer match▾');
  for(const count of [2,1]){projected.restaurant.revisionDiff={fromRevision:3,toRevision:4,added:added.slice(0,count),removed:[]};await update();assert.equal(await page.locator('#revision-changes summary').textContent(),count===1?'1 new place':'2 new places');await page.locator('#revision-changes summary').dispatchEvent('click');assert.equal(await page.locator('#revision-changes').evaluate(n=>(n as HTMLDetailsElement).open),false);}
  delete projected.restaurant.revisionDiff;await update();assert.equal(await page.locator('#revision-changes').textContent(),'');assert.equal(await page.locator('#removed-list li').count(),0);
 }finally{await context.close();await browser.close();await host.close();}
});
for(const size of [{width:390,height:844},{width:1440,height:900}])test(`Round20 UI: ${size.width} citation reading groups, About provenance and bilingual Handoff`,{timeout:35_000},async()=>{
 const host=await startWorkspaceFixture({questions:true,provider:"TABELOG",cancellationConflict:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:size,baseURL:host.baseUrl});
 await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());const page=await context.newPage();
 try{
  const original=await open(page,host) as import('../../application/agent-workspace.js').RestaurantCaseView,projected=structuredClone(original),id=projected.restaurant.presentedCandidateIds![0]!,time='2026-11-21T08:04:00Z',later='2026-11-21T08:05:00Z',url='https://www.k-daia.com/terms';
  await round20Projection(page,host,projected);
  const base=original.restaurant.readEvidence[0]!;projected.restaurant.conditionStates={[id]:[]};
  projected.restaurant.currentFactEvidence=[0,1].map(i=>({...base,evidenceId:'reading-'+i,candidateId:id,kind:'RESTAURANT_FACT',provider:'RESTAURANT_WEBSITE',sourceUrl:url,observedAt:time,claims:{listedCourseDetails:['Original terms '+i]}}));
  projected.case.taskVersion++;await emit(page,projected);await page.locator('#details-button').click();assert.equal(await page.locator('#details-content .citation-footer').count(),1);
  projected.restaurant.currentFactEvidence[1]!.observedAt=later;projected.case.taskVersion++;await emit(page,projected);assert.equal(await page.locator('#details-content .citation-footer').count(),2);assert.deepEqual(await page.locator('#details-content > section[data-source-id]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.getAttribute('data-source-id')!)[1])),[time,later]);assert.match(await page.locator('#details-content').innerText(),/Checked Nov 21/);assert.match(await page.locator('#details-content').innerText(),/Checked Nov 21/);
  let split=false;
  await page.route('**/api/cases/*/questions',async route=>{
   const input=route.request().postDataJSON() as {requestId:string;question:string};
   const q={requestId:input.requestId,question:input.question,candidateId:id,readRunId:projected.restaurant.sourceReadContext!.runId,readStartedAt:time,deadlineAt:'2026-11-21T08:10:00Z',requestedAt:time,result:{status:'ANSWERED' as const,candidateId:id,answer:'Fixture answer retains the original quotations.',sensitiveCategory:'NONE' as const,confirmationRequired:false,citations:[0,1,2].map(i=>({url,readAt:split&&i===2?later:time,text:'Original excerpt '+i,identityEvidenceId:base.evidenceId})),checkedPages:[]}};
   projected.restaurant.pageQuestion=q;projected.restaurant.questionHistory.unshift(q);projected.case.taskVersion++;await route.fulfill({json:{view:projected}});
  });
  for(const different of [false,true]){
   split=different;const question=different?'Compare the two reading times?':'What was read in this page visit?';await page.locator('#message').fill(question);await page.locator('#send').click();await page.locator('#answer-sheet').waitFor();assert.equal(await page.locator('#answer-question').innerText(),question);assert.equal(await page.locator('#answer-close').innerText(),'×');
   for(const selector of ['#question-result','#asked-result']){assert.equal(await page.locator(selector+' .citation-group').count(),different?2:1);assert.equal(await page.locator(selector+' blockquote').count(),3);assert.equal(await page.locator(selector+' .citation-footer').count(),different?2:1);assert.equal((await page.locator(selector).textContent()??'').match(/Checked/g)?.length,different?2:1);}
   await page.locator('#question-result summary').click();assert.equal(await page.locator('#answer-sheet').evaluate(n=>getComputedStyle(n).paddingBottom),'28px');assert.match(await page.locator('#question-result').innerText(),/k-daia\.com ↗ · Checked Nov 21/);if(different)assert.match(await page.locator('#question-result').innerText(),/Checked Nov 21/);
   if (size.width === 390) {
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    const footers = await page.locator('#question-result .citation-footer').evaluateAll(nodes => {
      const sheet = document.querySelector<HTMLElement>('#answer-sheet')!;
      const bounds = sheet.getBoundingClientRect();
      return nodes.map(node => {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()].filter(rect => rect.width > 0);
        const lines: number[] = [];
        for (const rect of rects) if (!lines.some(top => Math.abs(top - rect.top) < 2)) lines.push(rect.top);
        return {
          text: node.textContent, lines: lines.length,
          inBounds: rects.every(rect => rect.left >= bounds.left && rect.right <= bounds.right),
          noOverflow: sheet.scrollWidth <= sheet.clientWidth && node.scrollWidth <= node.clientWidth,
        };
      });
    });
    assert.deepEqual(footers, (different ? ['04','05'] : ['04']).map(minute => ({
      text: 'k-daia.com ↗ · Checked Nov 21',
      lines: 1, inBounds: true, noOverflow: true,
    })));
   }
   await captureRound8(page,`round20-${size.width}-${different?'different':'same'}-reading`);await page.locator('#answer-close').click();
  }
  await page.locator('#details-back').click();await page.locator('#choose').click();await page.locator('#handoff').waitFor();
  const h=projected.restaurant.bookingHandoffs!.find(h=>h.candidateId===id)!;assert.ok(h.cancellationNotice,"Tabelog bilingual conflict Fixture is required");for(const term of h.terms)for(const quote of term.citations){assert.ok((await page.locator('#handoff-terms').textContent())!.includes(quote.text));assert.ok((await page.locator('#handoff-terms').textContent())!.includes(term.label));}
  const conflict=page.locator('[data-kind="cancellation-conflict"]');assert.match(await conflict.innerText(),/English page:[\s\S]*Confirm cancellation terms on the website/);
  const expected=new Set(h.terms.flatMap(t=>t.citations.map(c=>JSON.stringify([c.url,c.readAt]))));assert.equal(await page.locator('#handoff-terms .citation-footer').count(),expected.size);await page.locator('#handoff-terms summary').click();await captureRound8(page,`round20-${size.width}-handoff-reading-groups`);
 }finally{await context.close();await browser.close();await host.close();}
});
