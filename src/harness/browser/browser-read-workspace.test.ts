import { workspaceAsset } from "../../web/workspace-assets.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { LOCAL_WORKSPACE_PAGE } from "../../web/local-workspace-page.js";

// UI projection regressions complement the real HTTP/SSE/PGlite suite in web-workspace.test.ts.
test("Web refresh replaces commercial terms and cites the displayed fact source",async()=>{
  const browser=await chromium.launch({headless:true}),page=await browser.newPage();
  await page.clock.install({time:new Date()});
  const old={evidenceId:"old",candidateId:"a",kind:"RESTAURANT_FACT",provider:"TABELOG",observedAt:new Date().toISOString(),sourceUrl:"https://source.example/old",claims:{coursePriceYen:7500,noShowTerms:"No-show: old rule"}};
  const current={...old,evidenceId:"new",sourceUrl:"https://source.example/current",claims:{coursePriceYen:8000,cancellationTerms:"Cancellation: current rule"}};
  const discoveryOnly={...old,candidateId:"b",provider:"GOOGLE_PLACES",sourceUrl:"https://maps.example/b",claims:{websiteUri:"https://venue.example"}};
  let refreshed=false;
  const view=()=>({
    mode:"FIXTURE",case:{caseId:"case",title:"Compare restaurants",status:"ACTIVE",phase:"PRESENT_RESULTS",taskVersion:refreshed?2:1},
    conversation:{id:"conversation",messages:[]},activities:[],
    restaurant:{requirementRevision:1,savedCandidates:[],questionHistory:[],readStatus:{kind:"RESULTS",partialSourceFailure:false,canContinue:false,canRetry:false},intentDraft:{target:{goal:"AVAILABILITY"}},missingRequiredFields:[],searchRevision:1,readyCandidateIds:["a"],progress:{active:false,stopped:false},
      candidates:[{restaurant:{id:"a",outletName:"Cafe A",address:"Tokyo"}},{restaurant:{id:"b",outletName:"Discovery only",address:"Tokyo"}}],
      presentedCandidateIds:["a"],availability:{a:[{dateTime:"2026-09-18T19:00:00+09:00",source:"TABLECHECK",displayExpiresAt:new Date(Date.now()+(refreshed?600000:-600000)).toISOString()}]},
      availabilityChecks:{a:{status:"AVAILABLE",checkedAt:new Date(Date.now()-600000).toISOString(),displayExpiresAt:new Date(Date.now()+(refreshed?600000:-600000)).toISOString()}},
      readEvidence:[old,current],currentFactEvidence:refreshed?[current,discoveryOnly]:[old,discoveryOnly],conditionStates:{a:[
        {text:"Around ¥10,000 per person",status:refreshed?"MET":"NOT_MET",explanation:"Recorded course price; tax retained without conversion.",sources:[{field:"PRICE",sourceUrl:current.sourceUrl,quote:refreshed?"Dinner course ¥8,000":"Dinner course ¥7,500"}]},
        {text:"Private room",status:"NOT_CHECKED",explanation:"No source evidence.",sources:[]},
      ]}},
  });
  try{
    await page.route("**/*",async route=>{
      const path=new URL(route.request().url()).pathname;
      const script=workspaceAsset(path);if(script!==undefined)return route.fulfill({contentType:"text/javascript",body:script});
      if(path==="/")return route.fulfill({contentType:"text/html",body:LOCAL_WORKSPACE_PAGE});
      if(path.endsWith("/events")||path.startsWith("/assets/"))return route.abort();
      if(path.endsWith("/refresh"))refreshed=true;
      return route.fulfill({json:path==="/api/cases"?{cases:[view().case]}:path==="/api/session"?{user:{id:"fixture"}}:{view:view()}});
    });
    await page.goto("https://workspace.example/");
    await page.getByRole("button",{name:/Compare restaurants/}).click();
    await page.locator("#candidate-panel").waitFor({state:"visible"});
    assert.match(await page.locator("#availability-status").innerText(),/Expired/);
    await page.locator("#details-button").click();
    await page.getByText("No-show: old rule",{exact:false}).waitFor();
    assert.match(await page.locator("#details-content").innerText(),/Around ¥10,000 per person\s*Not a match/);
    assert.match(await page.locator("#details-content").innerText(),/Private room\s*Unverified/);
    await page.getByRole("button",{name:"Refresh availability",exact:true}).click();
    await page.getByText("Cancellation: current rule",{exact:false}).waitFor();
    const details=page.locator("#details-content");
    const price=details.locator("details").filter({has:page.getByText("Observed price:",{exact:true})});
    assert.equal(await price.getAttribute("open"),null);
    assert.equal(await price.locator("blockquote").isVisible(),false);
    await price.locator("summary").click();
    const text=await details.innerText();
    assert.match(text,/8,000/);assert.match(text,/Around ¥10,000 per person\s*Confirmed/);assert.match(text,/Observed price:\s*Dinner course/);
    assert.doesNotMatch(text,/7,500|No-show: old rule|Discovery only/);
    assert.equal(await page.locator(".citation-footer a").first().getAttribute("href"),current.sourceUrl);
    await page.locator("#details-back").click();
    assert.equal(await page.locator("#card-counter").innerText(),"1 of 1","discovery-only facts cannot become a result");
    assert.match(await page.locator("#availability-status").innerText(),/Sep 18/);
    await page.clock.fastForward(660_000);
    assert.match(await page.locator("#availability-status").innerText(),/Expired/);
  }finally{await browser.close();}
});

test("workspace New plan survives a late initial case-list response",async()=>{
  const browser=await chromium.launch({headless:true});
  let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});let oldCaseRequests=0;
  try{
    const page=await browser.newPage();
    await page.route("https://workspace.test/**",async route=>{
      const path=new URL(route.request().url()).pathname;
      const script=workspaceAsset(path);if(script!==undefined)return route.fulfill({contentType:"text/javascript",body:script});
      if(path==="/")return route.fulfill({contentType:"text/html",body:LOCAL_WORKSPACE_PAGE});
      if(path.startsWith("/assets/"))return route.abort();
      if(path==="/api/cases"){await pending;return route.fulfill({json:{cases:[{caseId:"old-case",title:"Old case",status:"COMPLETED",phase:"PRESENT_RESULTS"}]}});}
      if(path==="/api/cases/old-case")oldCaseRequests++;
      return route.fulfill({json:path==="/api/session"?{user:{id:"fixture"}}:{}});
    });
    await page.goto("https://workspace.test/");await page.locator("#app").waitFor({state:"visible"});
    await page.locator("#new-case").click();
    const response=page.waitForResponse(r=>r.url()==="https://workspace.test/api/cases");release();await response;
    await page.locator(".case-link").waitFor();
    assert.equal(oldCaseRequests,0);assert.equal(await page.locator("#home").isVisible(),true);
    assert.equal(await page.locator("#message").getAttribute("placeholder"),null);
  }finally{release();await browser.close();}
});

test("G1 Web asks only for the displayed outlet and renders quotes, absence and sensitive notice",async()=>{
  const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:900}});
  const readAt="2026-10-27T16:00:00+01:00";let version=1,answer:Record<string,unknown>|undefined,questionText="",questionRequestId="";
  let variant:"answered"|"absence"|"sensitive"="answered";const submitted:Record<string,unknown>[]=[],history:Record<string,unknown>[]=[];
  const view=()=>({mode:"FIXTURE",case:{caseId:"case",title:"Restaurant follow-up",status:"NEEDS_YOU",phase:"PRESENT_RESULTS",taskVersion:version},
    conversation:{id:"conversation",messages:[]},activities:[],restaurant:{requirementRevision:1,savedCandidates:[],questionHistory:history,readStatus:{kind:"RESULTS",partialSourceFailure:false,canContinue:false,canRetry:false},intentDraft:{target:{goal:"RECOMMENDATION"}},missingRequiredFields:[],
      searchRevision:1,readyCandidateIds:["a"],progress:{active:false,stopped:false},candidates:[{restaurant:{id:"a",outletName:"Merchant Cafe",address:"Tokyo"}}],
      presentedCandidateIds:["a"],availability:{},availabilityChecks:{},readEvidence:[],currentFactEvidence:[],
      ...(answer?{pageQuestion:{requestId:questionRequestId,candidateId:"a",question:questionText,result:answer}}:{})}});
  try{
    await page.route("**/*",async route=>{
      const path=new URL(route.request().url()).pathname;
      const script=workspaceAsset(path);if(script!==undefined)return route.fulfill({contentType:"text/javascript",body:script});
      if(path==="/")return route.fulfill({contentType:"text/html",body:LOCAL_WORKSPACE_PAGE});
      if(path.endsWith("/events")||path.startsWith("/assets/"))return route.abort();
      if(path==="/api/cases/case/questions"){
        const body=route.request().postDataJSON();submitted.push(body);questionText=body.question;questionRequestId=body.requestId;version++;
        answer=variant==="absence"?{status:"NOT_STATED",candidateId:"a",answer:null,sensitiveCategory:"NONE",confirmationRequired:false,citations:[],checkedPages:[{url:"https://merchant.example/a",readAt}]}
          :{status:"ANSWERED",candidateId:"a",answer:variant==="sensitive"?"The page describes its access arrangements.":"They accept Visa and MasterCard.",sensitiveCategory:variant==="sensitive"?"ACCESSIBILITY":"NONE",confirmationRequired:variant==="sensitive",citations:[{text:variant==="sensitive"?"車椅子でのご来店はご相談ください。":"カード可（VISA、Master）",url:"https://merchant.example/a",readAt,identityEvidenceId:"fixture-identity"}],checkedPages:[{url:"https://merchant.example/a",readAt}]};
        history.unshift({requestId:questionRequestId,candidateId:"a",question:questionText,result:answer});
      }
      return route.fulfill({json:path==="/api/cases"?{cases:[view().case]}:path==="/api/session"?{user:{id:"fixture"}}:{view:view()}});
    });
    await page.goto("https://workspace.example/");await page.getByRole("button",{name:/Restaurant follow-up/}).click();await page.locator("#details-button").click();
    assert.equal(await page.locator("#message").getAttribute("placeholder"),"Ask about Merchant Cafe");
    assert.equal(await page.locator("#details input, #details textarea").count(),0,"details must not own a second input");
    const ask=async(text:string)=>{
      await page.locator("#message").fill(text);
      await page.getByRole("button",{name:"Send",exact:true}).click();await page.locator("#answer-sheet").waitFor({state:"visible"});
      assert.equal(await page.locator("#message").inputValue(),"");
      assert.equal(await page.locator("#asked-question").innerText(),text);
      assert.equal(await page.locator("#answer-place").innerText(),"Merchant Cafe");
    };
    await ask("Do they take credit cards?");await page.locator("#question-result summary").click();
    assert.deepEqual(Object.keys(submitted[0]!).sort(),["candidateId","question","requestId","taskVersion"]);
    assert.equal(submitted[0]!.candidateId,"a");assert.equal(submitted[0]!.taskVersion,1);
    assert.equal(await page.locator("#question-result blockquote").innerText(),"カード可（VISA、Master）");
    assert.equal(await page.locator("#answer-sheet .citation-footer a").getAttribute("href"),"https://merchant.example/a");
    assert.match(await page.locator("#question-result").innerText(),/They accept Visa and MasterCard/);
    assert.match(await page.locator("#question-result").innerText(),/Checked Oct 28/);
    assert.doesNotMatch(await page.locator("#question-result").innerText(),/Please confirm/);
    await page.locator("#answer-dismiss").click();
    variant="absence";await ask("Does the page list a taxi service?");
    assert.match(await page.locator("#question-result").innerText(),/Not stated on the page/);
    await page.locator("#question-result summary").click();
    assert.equal(await page.locator("#answer-sheet .citation-footer a").getAttribute("href"),"https://merchant.example/a");
    await page.locator("#answer-dismiss").click();
    variant="sensitive";await page.setViewportSize({width:390,height:844});await ask("What does the page say about wheelchair access?");
    await page.locator("#question-result summary").click();
    assert.match(await page.locator("#question-result").innerText(),/Please confirm with the restaurant/);
    assert.equal(await page.locator("#question-result blockquote").innerText(),"車椅子でのご来店はご相談ください。");
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }finally{await browser.close();}
});
