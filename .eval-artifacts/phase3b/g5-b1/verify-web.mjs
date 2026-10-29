import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {LOCAL_WORKSPACE_PAGE} from '../../../src/web/local-workspace-page.ts';
import {prepareBookingHandoff} from '../../../src/domains/restaurant/booking-handoff.ts';
import {withBookingHandoffs} from '../../../src/application/restaurant-booking-handoff.ts';
import {tableCheckRequestedReservationUrl} from '../../../src/integrations/tablecheck/tablecheck-page-parser.ts';
const root=new URL('./',import.meta.url), baseline=process.argv.includes('--baseline');
const raw=JSON.parse(await readFile(new URL('../../../src/domains/restaurant/fixtures/booking-handoff/source.json',root),'utf8'));
const html=baseline ? await readFile(new URL('inputs/baseline.html',root),'utf8') : LOCAL_WORKSPACE_PAGE;
const records=[],unexpected=[],errors=[];
const browser=await chromium.launch({headless:true});
try {
 for(const provider of ['TABELOG','TABLECHECK']) {
  const input=structuredClone(raw);
  if(provider==='TABLECHECK') {
   const entrance='https://www.tablecheck.com/en/shops/fixture-sushi/reserve';
   input.context.candidate.restaurant.sourceIds={tablecheck:'fixture-sushi'};
   input.context.offer.source=provider;input.context.check.sourceProvider=provider;
   input.context.evidence.forEach(e=>{e.provider=provider;e.sourceEntityId='fixture-sushi';});
   input.source={...input.source,provider,linkBasis:'VERIFIED_PARAMETERS',sourceEntityId:'fixture-sushi',observedEntranceUrl:entrance,
    url:tableCheckRequestedReservationUrl({kind:'LINKED_PAGE',url:entrance},'2026-11-02',2,{earliest:'19:00',latest:'19:00'})};
   delete input.source.terms;
  }
  const ctx=input.context,prepared=prepareBookingHandoff(input.source,ctx);assert.ok(prepared);
  const base={mode:'FIXTURE',case:{caseId:'b1-fixture',title:'B1 offline handoff',status:'ACTIVE',phase:'SEARCHING',taskVersion:1},conversation:{id:'fixture-conversation',messages:[]},activities:[],artifacts:[],note:'Synthetic offline only',restaurant:{intentDraft:ctx.request,missingRequiredFields:[],candidates:[ctx.candidate],availability:{[ctx.candidate.restaurant.id]:[ctx.offer]},availabilityChecks:{[ctx.candidate.restaurant.id]:ctx.check},readEvidence:ctx.evidence,currentFactEvidence:[]}};
  let view=withBookingHandoffs(base,[prepared],ctx.now);
  const recommendation={...base,restaurant:{...base.restaurant,intentDraft:{...ctx.request,target:{goal:'RECOMMENDATION',query:'Fixture Sushi'}}}};
  assert.equal(withBookingHandoffs(recommendation,[prepared],ctx.now).restaurant.bookingHandoffs.length,1,'a recommendation with current bound availability may also depart');
  const page=await browser.newPage({viewport:{width:1120,height:900}});
  page.on('pageerror',error=>errors.push(String(error)));
  await page.clock.install({time:new Date(ctx.now)});
  await page.route('**/*',route=>{
   const url=new URL(route.request().url());
   if(url.origin!=='https://b1-workspace.invalid'){unexpected.push(url.toString());return route.abort();}
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:html});
   if(url.pathname.endsWith('/events'))return route.abort();
   if(url.pathname==='/api/session')return route.fulfill({json:{user:{id:'fixture-owner'}}});
   if(url.pathname==='/api/cases')return route.fulfill({json:{cases:[view.case]}});
   if(url.pathname.endsWith('/refresh'))view=withBookingHandoffs({...base,restaurant:{...base.restaurant,availabilityChecks:{[ctx.candidate.restaurant.id]:{...ctx.check,status:'UNKNOWN'}}}},[prepared],ctx.now);
   return route.fulfill({json:{view}});
  });
  await page.goto('https://b1-workspace.invalid/');
  const label=provider==='TABELOG'?'Book on Tabelog':'Book on TableCheck';
  await page.getByRole('heading',{name:'Fixture Sushi',exact:true}).waitFor({timeout:5000});
  if(baseline){console.log(JSON.stringify({baselineCandidate:await page.locator('.candidate').innerText(),expectedMissingAction:label}));await page.screenshot({path:new URL('web-baseline-red.png',root).pathname,fullPage:true});}
  await page.getByRole('link',{name:label,exact:true}).waitFor({timeout:5000});
  const section=page.locator('.booking-handoff');
  const text=await section.innerText();
  assert.equal(await page.getByRole('link',{name:label,exact:true}).getAttribute('href'),input.source.url);
  assert.equal(view.case.phase,'SEARCHING','departure must not wait for comparison completion');
  assert.doesNotMatch(text,/\bselected\b|\bbooked\b/i);
  assert.equal(await section.locator('.booking-hint').count(),1);
  if(provider==='TABELOG'){assert.match(text,/Pick Omakase Nigiri ¥9,800/);assert.match(text,/Cancellations on the day cost 100%\./);assert.match(text,/Card required/);}
  else {assert.match(text,/Check date and guests/);assert.doesNotMatch(text,/Card required|No card needed|May require a card|Cancellation|440/);}
  const links=await section.locator('a').evaluateAll(items=>items.map(item=>({text:item.textContent,url:item.href,rel:item.rel})));
  const desktopOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.screenshot({path:new URL('web-'+provider.toLowerCase()+'-desktop.png',root).pathname,fullPage:true});
  await page.setViewportSize({width:390,height:844});
  const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(desktopOverflow,false);assert.equal(mobileOverflow,false);
  await page.screenshot({path:new URL('web-'+provider.toLowerCase()+'-mobile.png',root).pathname,fullPage:true});
  records.push({provider,text,links,comparisonComplete:false,desktopOverflow,mobileOverflow,sourceSelection:view.restaurant.bookingHandoffs[0].sourceSelection});
  await page.clock.fastForward(600_001);
  assert.equal(await page.locator('.booking-handoff').count(),0,'a held browser view must remove an expired handoff');
  await page.close();
 }
 assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);
 await writeFile(new URL('web.execution.json',root),JSON.stringify({mode:'SYNTHETIC_LOCAL_CHROMIUM',baseline,records,unexpectedExternalRequests:unexpected,pageErrors:errors,newRealCalls:0},null,2)+'\n');
 console.log(JSON.stringify({mode:'SYNTHETIC_LOCAL_CHROMIUM',providers:records.length,unexpectedExternalRequests:unexpected.length,realCalls:0}));
} finally {await browser.close();}
