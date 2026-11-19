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
    await page.locator("#details").waitFor({state:"hidden"});assert.equal(await page.locator("#photo-viewer").isVisible(),false);assert.equal(await page.locator("#messages").innerText(),"Couldn't complete this search. Please try again.");assert.equal(await page.locator("#message").inputValue(),"Retain this draft");
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
  await context.route("**/*",r=>new URL(r.request().url()).hostname==="127.0.0.1"?r.continue():r.abort());
  try{
    const projected=await open(page,host),id=projected.restaurant.presentedCandidateIds[0];host.disconnectStreams();await projectionStream(page);
    projected.restaurant.conditionStates={[id]:[{text:"serves beer",status:"MET",strength:"HARD",polarity:"POSITIVE",evidenceIds:["fixture-menu"],sources:[{field:"SOURCE_TEXT",quote:"We serve beer with our meals.",sourceUrl:"https://venue.example/menu"}]},{text:"quiet seating",status:"NOT_CHECKED",strength:"SOFT",polarity:"POSITIVE",evidenceIds:[],sources:[]},{text:"outdoor seats",status:"NOT_MET",strength:"SOFT",polarity:"POSITIVE",evidenceIds:[],sources:[]}]};
    projected.restaurant.candidates.forEach((c:any)=>c.matchReasons=[]);
    if(!available){projected.restaurant.availability={};projected.restaurant.availabilityChecks={};projected.restaurant.intentDraft.target.goal="RECOMMENDATION";delete projected.restaurant.intentDraft.target.goalBasis;}
    await page.route("**/api/cases/*",r=>r.request().method()==="GET"&&!r.request().url().endsWith("/events")?r.fulfill({json:{view:projected}}):r.continue());await page.reload();await page.locator("#candidate-panel").waitFor({state:"visible"});
    assert.deepEqual(await page.locator("#delivery-conditions .condition-name").allTextContents(),["Serves beer","Quiet seating","Outdoor seats"]);assert.deepEqual(await page.locator("#delivery-conditions .condition-status").allTextContents(),["Confirmed","Unverified","Not a match"]);
    assert.doesNotMatch(await page.locator("#delivery-conditions").innerText(),/—|not checked|not met|·/);
    const metrics=await page.locator("#delivery-conditions").evaluate(node=>{const style=getComputedStyle(node);const buttonGap=document.getElementById("choose")!.getBoundingClientRect().top-node.getBoundingClientRect().bottom;return{buttonGap,font:style.fontSize,line:style.lineHeight,margin:style.marginTop,gap:style.rowGap,rows:[...node.querySelectorAll(".condition-row")].map(row=>{const style=getComputedStyle(row),name=row.querySelector(".condition-name")!,status=row.querySelector(".condition-status")!,a=name.getBoundingClientRect(),b=status.getBoundingClientRect();return{display:style.display,align:style.alignItems,justify:style.justifyContent,gap:style.columnGap,color:getComputedStyle(name).color,status:getComputedStyle(status).color,right:b.right-row.getBoundingClientRect().right,distance:b.left-a.right};})};});
    assert.ok(metrics.buttonGap>=12, `Expected 12px between conditions and booking, got ${metrics.buttonGap}px`);
    assert.equal(metrics.font,"13px");assert.equal(metrics.margin,"8px");assert.equal(metrics.gap,"6px");assert.ok(Math.abs(parseFloat(metrics.line)-18.85)<0.1);for(const row of metrics.rows){assert.equal(row.display,"flex");assert.equal(row.align,"baseline");assert.equal(row.justify,"space-between");assert.equal(row.gap,"12px");assert.equal(row.color,"rgb(21, 23, 43)");assert.equal(row.status,"rgb(95, 98, 117)");assert.ok(Math.abs(row.right)<1&&row.distance>=12);}
    assert.equal(await page.locator("#recommendation").isVisible(),false);
    const availability=await page.locator("#availability").evaluate(n=>{const s=getComputedStyle(n),before=getComputedStyle(n,"::before");return{text:n.textContent,font:s.fontSize,weight:s.fontWeight,color:s.color,before:before.content};});
    if(available){assert.match(availability.text!,/^Available Mon, Nov 2$/);assert.equal(availability.font,"15px");assert.equal(availability.weight,"600");assert.equal(availability.color,"rgb(21, 23, 43)");assert.equal(await page.locator(".slot-time").first().evaluate(n=>getComputedStyle(n).borderRadius),"8px");}
    else{assert.equal(availability.text,"Availability not checked");assert.equal(availability.font,"13px");assert.equal(availability.weight,"500");assert.equal(availability.color,"rgb(95, 98, 117)");assert.ok(["none","normal"].includes(availability.before));assert.equal(await page.locator("#delivery-slots").isVisible(),false);}
    const output=process.env.PRAXIS_ROUND6_VISUAL_OUTPUT;if(output){await mkdir(output,{recursive:true});const name=`style1-${size.width}x${size.height}-${available?"available":"not-checked"}`;await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.locator("#case-title").click();await page.screenshot({path:join(output,name+".png"),animations:"disabled"});await writeFile(join(output,name+".json"),JSON.stringify({viewport:size,kind:available?"available":"not-checked",source:"controlled public projection after actual local HTTP Fixture read",metrics,availability,errors},null,2)+"\n");}
    await page.locator("#details-button").click();assert.deepEqual(await page.locator("#details-content .condition-status").allTextContents(),["Confirmed","Unverified","Not a match"]);assert.deepEqual(errors,[]);
  }finally{await context.close();await browser.close();await host.close();}
});
