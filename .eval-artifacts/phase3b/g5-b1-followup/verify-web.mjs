import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {LOCAL_WORKSPACE_PAGE} from '../../../src/web/local-workspace-page.ts';
import {prepareBookingHandoff} from '../../../src/domains/restaurant/booking-handoff.ts';
import {withBookingHandoffs} from '../../../src/application/restaurant-booking-handoff.ts';
import {tableCheckRequestedReservationUrl} from '../../../src/integrations/tablecheck/tablecheck-page-parser.ts';
const root=new URL('./',import.meta.url);
const raw=JSON.parse(await readFile(new URL('../../../src/domains/restaurant/fixtures/booking-handoff/source.json',root),'utf8'));
const records=[],unexpected=[],errors=[];
const browser=await chromium.launch({headless:true});
try {
 for(const provider of ['TABELOG','TABLECHECK']) {
  const input=structuredClone(raw);
  if(provider==='TABELOG'){
   const terms=input.source.terms,japanese=structuredClone(terms.cancellation);
   const url='https://tabelog.com/tokyo/A1301/A130101/13123456/',quote='前日キャンセルは50％、当日は100％です。';
   japanese.answer='Cancellation costs 50% the day before and 100% on the day.';
   japanese.citations=[{...japanese.citations[0],url,text:quote}];japanese.checkedPages=[{url,readAt:input.context.now}];
   terms.pages.push({...terms.pages[0],url,text:quote});terms.cancellationConflict={japanese,english:structuredClone(terms.cancellation)};
  }else{
   const entrance='https://www.tablecheck.com/en/shops/fixture-sushi/reserve';
   input.context.candidate.restaurant.sourceIds={tablecheck:'fixture-sushi'};
   input.context.offer.source=provider;input.context.check.sourceProvider=provider;
   input.context.evidence.forEach(e=>{e.provider=provider;e.sourceEntityId='fixture-sushi';});
   input.source={...input.source,provider,linkBasis:'VERIFIED_PARAMETERS',sourceEntityId:'fixture-sushi',observedEntranceUrl:entrance,
    url:tableCheckRequestedReservationUrl({kind:'LINKED_PAGE',url:entrance},'2026-11-02',2,{earliest:'19:00',latest:'19:00'})};delete input.source.terms;
  }
  const ctx=input.context,prepared=prepareBookingHandoff(input.source,ctx);assert.ok(prepared);
  const base={mode:'FIXTURE',case:{caseId:'b1-fixture',title:'B1 offline follow-up',status:'ACTIVE',phase:'SEARCHING',taskVersion:1},conversation:{id:'fixture-conversation',messages:[]},activities:[],artifacts:[],note:'Synthetic offline only',restaurant:{intentDraft:ctx.request,missingRequiredFields:[],candidates:[ctx.candidate],availability:{[ctx.candidate.restaurant.id]:[ctx.offer]},availabilityChecks:{[ctx.candidate.restaurant.id]:ctx.check},readEvidence:ctx.evidence,currentFactEvidence:[]}};
  const view=withBookingHandoffs(base,[prepared],ctx.now);
  const context=await browser.newContext({viewport:{width:1120,height:900}}),page=await context.newPage();
  let departed=false,claimed=false,claimQuestions=0;const answers=[],sourceNavigations=[];
  page.on('pageerror',error=>errors.push(String(error)));await page.clock.install({time:new Date(ctx.now)});
  await context.route('**/*',route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!=='https://b1-workspace.invalid'){
    if(departed&&url.toString()===input.source.url){sourceNavigations.push(url.toString());return route.fulfill({contentType:'text/html',body:'<title>Controlled source fixture</title><p>No real booking or website request.</p>'});}
    unexpected.push(url.toString());return route.abort();
   }
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:LOCAL_WORKSPACE_PAGE});
   if(url.pathname.endsWith('/events'))return route.abort();
   if(url.pathname==='/api/session')return route.fulfill({json:{user:{id:'fixture-owner'}}});
   if(url.pathname==='/api/cases')return route.fulfill({json:{cases:[view.case]}});
   if(url.pathname.endsWith('/booking-departures')){
    const body=request.postDataJSON();assert.equal(body.offerId,ctx.offer.id);assert.equal(body.candidateId,'fixture:outlet');assert.equal('url' in body,false);
    departed=true;return route.fulfill({json:{departure:{id:'departure:ui',provenance:'USER_REPORTED'},url:input.source.url}});
   }
   if(url.pathname.endsWith('/booking-feedback/claim')){
    if(!departed||claimed)return route.fulfill({json:{prompt:null}});
    claimed=true;claimQuestions++;return route.fulfill({json:{prompt:{departure:{id:'departure:ui'},question:'Did you get the booking?',options:['YES','NO','SKIP']}}});
   }
   if(url.pathname.endsWith('/booking-feedback')){answers.push(request.postDataJSON());return route.fulfill({json:{departure:{id:'departure:ui',provenance:'USER_REPORTED',answer:answers.at(-1).answer}}});}
   return route.fulfill({json:{view}});
  });
  await page.goto('https://b1-workspace.invalid/');
  const label=provider==='TABELOG'?'Book on Tabelog':'Book on TableCheck';
  const direct=page.getByRole('link',{name:label,exact:true});await direct.waitFor({timeout:5000});
  const section=page.locator('.booking-handoff'),text=await section.innerText();
  assert.equal(await direct.getAttribute('href'),input.source.url);assert.equal(sourceNavigations.length,0,'there is no automatic link verification visit');
  assert.doesNotMatch(text,/\bselected\b|\bbooked\b/i);assert.equal(await section.locator('.booking-hint').count(),1);
  if(provider==='TABELOG'){
   assert.match(text,/Cancellation terms differ between the Japanese and English pages/);
   assert.match(text,/前日キャンセルは50％、当日は100％です。/);assert.match(text,/Japanese page: Cancellation costs 50%/);
   assert.match(text,/English page: Same-day cancellation costs 100%/);assert.match(text,/Confirm cancellation terms on the website/);
   assert.match(text,/System usage fee: ¥440 per guest/);await section.getByText('Platform fee source',{exact:true}).click();
   assert.equal(await section.getByRole('link',{name:/Tabelog English help/}).getAttribute('href'),'https://tabelog.com/en/help');
   await section.getByText('Platform fee source',{exact:true}).click();
  }else{assert.match(text,/Check date and guests/);assert.match(input.source.url,/start_time=19%3A00/);assert.doesNotMatch(text,/440|Cancellation terms differ/);}
  await page.screenshot({path:new URL('web-'+provider.toLowerCase()+'-desktop.png',root).pathname,fullPage:true});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:new URL('web-'+provider.toLowerCase()+'-mobile.png',root).pathname,fullPage:true});
  const popupPromise=page.waitForEvent('popup');await direct.click();const popup=await popupPromise;
  await popup.waitForURL(input.source.url,{timeout:5000});assert.equal(sourceNavigations.length,1);
  await popup.close();await page.bringToFront();await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.getByText('Did you get the booking?',{exact:true}).waitFor({timeout:5000});
  await page.screenshot({path:new URL('web-'+provider.toLowerCase()+'-feedback.png',root).pathname,fullPage:true});
  const choice=provider==='TABELOG'?'Yes':'Skip';await page.getByRole('button',{name:choice,exact:true}).click();
  await page.getByText('Thanks — saved as your report.',{exact:true}).waitFor();
  assert.deepEqual(answers,[{departureId:'departure:ui',answer:provider==='TABELOG'?'YES':'SKIP'}]);
  await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('pageshow'));});
  await page.reload();await page.getByRole('link',{name:label,exact:true}).waitFor();assert.equal(await page.getByText('Did you get the booking?',{exact:true}).count(),0);
  records.push({provider,text,url:input.source.url,sourceSelection:view.restaurant.bookingHandoffs[0].sourceSelection,claimQuestions,answers,sourceNavigations,overflow:false});
  await page.clock.fastForward(600_001);assert.equal(await page.locator('.booking-handoff').count(),0);
  await context.close();
 }
 assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
 await writeFile(new URL('web.execution.json',root),JSON.stringify({mode:'LOCAL_CHROMIUM_WITH_REPLACED_NETWORK_IO',records,unexpectedExternalRequests:unexpected,pageErrors:errors,realSourceRequests:0,realModelCalls:0},null,2)+'\n');
 console.log(JSON.stringify({providers:records.length,realSourceRequests:0,errors:errors.length}));
}finally{await browser.close();}
