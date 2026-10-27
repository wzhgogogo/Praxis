import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { url } from "./browser-read-test-fixtures.js";

test("Web refresh replaces commercial terms and cites the displayed fact source", async () => {
  const { LOCAL_WORKSPACE_PAGE } = await import("../../web/local-workspace-page.js");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.clock.install({ time: new Date() });
  const old = { evidenceId: "old", candidateId: "a", kind: "RESTAURANT_FACT", sourceUrl: "https://source.example/old", claims: { coursePriceYen: 7500, noShowTerms: "No-show: old rule" } };
  const current = { ...old, evidenceId: "new", sourceUrl: "https://source.example/current", claims: { coursePriceYen: 8000, cancellationTerms: "Cancellation: current rule" } };
  const discoveryOnly = { ...old, candidateId: "b", provider: "GOOGLE_PLACES", sourceUrl: "https://maps.example/b", claims: { websiteUri: "https://venue.example" } };
  let refreshed = false;
  const view = () => ({
    mode: "FIXTURE", case: { caseId: "case", title: "Compare restaurants", status: "ACTIVE", phase: "PRESENT_RESULTS", taskVersion: refreshed ? 2 : 1 },
    conversation: { id: "conversation", messages: [] }, activities: [],
    restaurant: { intentDraft: { target: { goal: "AVAILABILITY" } }, missingRequiredFields: [], candidates: [{ restaurant: { id: "a", outletName: "Cafe A", address: "Tokyo" } }, { restaurant: { id: "b", outletName: "Discovery only", address: "Tokyo" } }], presentedCandidateIds: ["a"], availability: { a: [{ dateTime: "2026-09-18T19:00:00+09:00", source: "TABLECHECK", displayExpiresAt: new Date(Date.now() + (refreshed ? 600000 : -600000)).toISOString() }] }, availabilityChecks: { a: { status: "AVAILABLE", checkedAt: new Date(Date.now() - 600000).toISOString(), displayExpiresAt: new Date(Date.now() + (refreshed ? 600000 : -600000)).toISOString() } }, readEvidence: [old, current], currentFactEvidence: refreshed ? [current, discoveryOnly] : [old, discoveryOnly], conditionStates: { a: [
      { text: "Around ¥10,000 per person", status: refreshed ? "MET" : "NOT_MET", explanation: "Recorded course price; tax retained without conversion.", sources: [{ field: "PRICE", sourceUrl: current.sourceUrl, quote: refreshed ? "Dinner course ¥8,000" : "Dinner course ¥7,500" }] },
      { text: "Private room", status: "NOT_CHECKED", explanation: "No source evidence.", sources: [] },
    ] } },
  });
  try {
    await page.route("**/*", async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === "/") return route.fulfill({ contentType: "text/html", body: LOCAL_WORKSPACE_PAGE });
      if (path.endsWith("/events")) return route.abort();
      if (path.endsWith("/refresh")) refreshed = true;
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(path === "/api/cases" ? { cases: [view().case] } : path === "/api/session" ? { user: { id: "fixture" } } : { view: view() }) });
    });
    await page.goto("https://workspace.example/");
    await page.getByRole("button", { name: /Compare restaurants/ }).click();
    await page.getByText("No-show: old rule", { exact: false }).waitFor();
    assert.match(await page.locator("#artifact").innerText(), /Availability expired/);
    assert.doesNotMatch(await page.locator("#artifact").innerText(), /Evidence-grounded result/);
    assert.match(await page.locator("#artifact").innerText(), /Around ¥10,000 per person — not met/);
    assert.match(await page.locator("#artifact").innerText(), /Private room — not checked/);
    await page.getByRole("button", { name: "Refresh availability" }).click();
    await page.getByText("Cancellation: current rule", { exact: false }).waitFor();
    assert.equal(await page.locator(".candidate").count(), 1, "discovery-only Google facts must not appear as an investigated result");
    const text = await page.locator(".candidate").innerText();
    assert.match(text, /8,000/);
    assert.match(text, /Around ¥10,000 per person — met/);
    assert.match(text, /Observed price: Dinner course/);
    assert.doesNotMatch(text, /7,500|No-show: old rule/);
    assert.equal(await page.getByRole("link", { name: "Terms source" }).getAttribute("href"), current.sourceUrl);
    assert.match(text, /Evidence-grounded result/);
    await page.clock.fastForward(660_000);
    assert.match(await page.locator("#artifact").innerText(), /Availability expired/);
    assert.doesNotMatch(await page.locator("#artifact").innerText(), /Evidence-grounded result/);
  } finally { await browser.close(); }
});

// Source-specific form-contract checks were retired with the site UI permission functions.
// Generic guarded actions are covered through the shared Executor contract and the
// isolated Guard receiver; this local fixture deliberately remains unguarded.

// Live failure: paragraph dates were absent; numeric guest buttons were mistaken for days.
// Exercise source hints -> production Executor -> both Playwright sessions; inventory is NOT implied.

test("workspace New case survives a late initial case-list response", async () => {
  const { LOCAL_WORKSPACE_PAGE } = await import('../../web/local-workspace-page.js');
  const browser = await chromium.launch({headless:true});
  let release!: () => void;
  const pending = new Promise<void>(resolve => {release = resolve});
  let oldCaseRequests = 0;
  try {
    const page = await browser.newPage();
    await page.route('https://workspace.test/**',async route => {
      const path = new URL(route.request().url()).pathname;
      if(path === '/') return route.fulfill({contentType:'text/html',body:LOCAL_WORKSPACE_PAGE});
      if(path === '/api/cases') {
        await pending;
        return route.fulfill({json:{cases:[{caseId:'old-case',title:'Old case',status:'COMPLETED',phase:'PRESENT_RESULTS'}]}});
      }
      if(path === '/api/cases/old-case') oldCaseRequests++;
      return route.fulfill({json:{}});
    });
    await page.goto('https://workspace.test/');
    await page.locator('#workspace').waitFor({state:'visible'});
    await page.locator('#new-case').click();
    const response = page.waitForResponse(r=>r.url()==='https://workspace.test/api/cases');
    release(); await response;
    await page.locator('.case-link').waitFor();
    await page.waitForTimeout(100);
    assert.equal(oldCaseRequests,0,'a late list must not select a case after the user chose New case');
    assert.equal(await page.locator('#case-title').innerText(),'Start a case');
  } finally {release();await browser.close()}
});

test("G1 Web asks only for the displayed outlet and renders quoted answers, absence and sensitive notice", async () => {
  const {LOCAL_WORKSPACE_PAGE}=await import('../../web/local-workspace-page.js');
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const readAt='2026-10-27T16:00:00+01:00';
  let version=1;
  let answer:Record<string,unknown>|undefined;
  let questionText='';
  let variant:'answered'|'absence'|'sensitive'='answered';
  const submitted:Record<string,unknown>[]=[];
  const view=()=>({mode:'FIXTURE',case:{caseId:'case',title:'Restaurant follow-up',status:'NEEDS_YOU',phase:'PRESENT_RESULTS',taskVersion:version},
    conversation:{id:'conversation',messages:[]},activities:[],restaurant:{intentDraft:{target:{goal:'RECOMMENDATION'}},missingRequiredFields:[],
      candidates:[{restaurant:{id:'a',outletName:'Merchant Cafe',address:'Tokyo'}}],presentedCandidateIds:['a'],availability:{},availabilityChecks:{},readEvidence:[],currentFactEvidence:[],
      ...(answer?{pageQuestion:{candidateId:'a',question:questionText,result:answer}}:{})}});
  try {
    await page.route('**/*',async route=>{
      const path=new URL(route.request().url()).pathname;
      if(path==='/')return route.fulfill({contentType:'text/html',body:LOCAL_WORKSPACE_PAGE});
      if(path.endsWith('/events'))return route.abort();
      if(path==='/api/cases/case/questions') {
        const body=route.request().postDataJSON();submitted.push(body);questionText=body.question;version++;
        answer=variant==='absence'?{status:'NOT_STATED',answer:null,sensitiveCategory:'NONE',confirmationRequired:false,citations:[],checkedPages:[{url:'https://merchant.example/a',readAt}]}
          :{status:'ANSWERED',answer:variant==='sensitive'?'The page describes its access arrangements.':'They accept Visa and MasterCard.',sensitiveCategory:variant==='sensitive'?'ACCESSIBILITY':'NONE',confirmationRequired:variant==='sensitive',citations:[{text:variant==='sensitive'?'車椅子でのご来店はご相談ください。':'カード可（VISA、Master）',url:'https://merchant.example/a',readAt}],checkedPages:[{url:'https://merchant.example/a',readAt}]};
      }
      return route.fulfill({json:path==='/api/cases'?{cases:[view().case]}:path==='/api/session'?{user:{id:'fixture'}}:{view:view()}});
    });
    await page.goto('https://workspace.example/');
    const ask=async(text:string)=>{
      await page.getByRole('textbox',{name:'Question about Merchant Cafe'}).fill(text);
      await page.getByRole('button',{name:'Ask restaurant question'}).click();
      await page.getByRole('heading',{name:text,exact:true}).waitFor();
    };
    await ask('Do they take credit cards?');
    assert.deepEqual(Object.keys(submitted[0]!).sort(),['candidateId','question','requestId','taskVersion']);
    assert.equal(submitted[0]!.candidateId,'a');assert.equal(submitted[0]!.taskVersion,1);
    assert.equal(await page.locator('.page-answer blockquote').innerText(),'カード可（VISA、Master）');
    assert.equal(await page.getByRole('link',{name:'Source page',exact:true}).getAttribute('href'),'https://merchant.example/a');
    assert.match(await page.locator('.page-answer').innerText(),/They accept Visa and MasterCard/);
    assert.match(await page.locator('.page-answer').innerText(),/Read at: 2026-10-27T16:00:00\+01:00/);
    assert.doesNotMatch(await page.locator('.page-answer').innerText(),/Please confirm/);
    if(process.env.PRAXIS_G1_VISUAL_OUTPUT)await page.screenshot({path:process.env.PRAXIS_G1_VISUAL_OUTPUT+'/g1-desktop.png',fullPage:true});
    variant='absence';await ask('Does the page list a taxi service?');
    assert.match(await page.locator('.page-answer').innerText(),/Not stated on the page/);
    assert.equal(await page.getByRole('link',{name:'Checked page',exact:true}).getAttribute('href'),'https://merchant.example/a');
    variant='sensitive';await page.setViewportSize({width:360,height:900});await ask('What does the page say about wheelchair access?');
    assert.match(await page.locator('.page-answer').innerText(),/Please confirm with the restaurant/);
    assert.equal(await page.locator('.page-answer blockquote').innerText(),'車椅子でのご来店はご相談ください。');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'phone layout must remain within the viewport');
    if(process.env.PRAXIS_G1_VISUAL_OUTPUT) {await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:process.env.PRAXIS_G1_VISUAL_OUTPUT+'/g1-mobile.png',fullPage:true});}
  } finally {await browser.close();}
});
