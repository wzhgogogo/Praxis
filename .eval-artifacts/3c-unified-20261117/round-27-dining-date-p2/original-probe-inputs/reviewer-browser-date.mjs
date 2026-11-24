import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from '/private/tmp/praxis-3c-unified/node_modules/playwright-core/index.mjs';
import {startWorkspaceFixture} from '/private/tmp/praxis-3c-unified/src/harness/workspace-fixture-server.ts';

const userId = 'workspace-user';
const initialDate = '2026-11-26';
const referenceTime = '2026-11-24T10:00:00+09:00';
const seed = 'Find a table for two in Tokyo on 2026-11-26 at 18:00';
const initialFacts = [
 {field:'TARGET', operation:'ASSERT', value:{kind:'TARGET', goal:'AVAILABILITY', query:'dinner in Tokyo', selectionScope:'OPEN_ENDED', goalBasis:{type:'BOOKING_WORDING',reason:'User requests a table',quotes:['Find a table']}}},
 {field:'DATE', operation:'ASSERT', value:{kind:'DATE',value:initialDate,raw:initialDate}},
 {field:'TIME_WINDOW', operation:'ASSERT', value:{kind:'TIME_WINDOW',earliest:'18:00',latest:'18:00',raw:'18:00'}},
 {field:'PARTY_SIZE', operation:'ASSERT', value:{kind:'PARTY_SIZE',value:2}},
 {field:'AREA', operation:'ASSERT', value:{kind:'AREA',query:'Tokyo'}},
];
const cases = [
 {width:390, name:'browser: repeated tomorrow confirms the selected dinner time', message:'不要明天中午，我们明天晚上7点去吃寿喜锅', expected:'2026-11-25', expectedChip:'Wed, Nov 25',
  facts:[{field:'DATE',operation:'CORRECT',value:{kind:'DATE',relativeDay:'TOMORROW',raw:'明天'}},{field:'TIME_WINDOW',operation:'CORRECT',value:{kind:'TIME_WINDOW',earliest:'19:00',latest:'19:00',raw:'晚上7点'}}]},
 {width:1440, name:'browser: explicit date editor ignores contradictory CONFIRM', dateEditor:true, message:'Change Thu, Nov 26 to 2026-11-28', expected:'2026-11-28', expectedChip:'Sat, Nov 28', facts:[{field:'DATE',operation:'CONFIRM'}]},
];

const waitForSettled = async (host, caseId) => {
 const until = Date.now() + 10000;
 while (Date.now() < until) {
  const view = await host.application.getCase(userId, caseId);
  if (!view.restaurant.progress.active) return view;
  await delay(20);
 }
 throw new Error('Restaurant read did not reach its final state');
};

const browser = await chromium.launch({headless:true});
try {
 for (const scenario of cases) {
  const host = await startWorkspaceFixture({semanticProposal(message) {
   if (message === seed) return {schemaVersion:'4',facts:structuredClone(initialFacts)};
   assert.equal(message, scenario.message);
   return {schemaVersion:'4',facts:structuredClone(scenario.facts)};
  }});
  const context = await browser.newContext({baseURL:host.baseUrl, viewport:{width:scenario.width,height:scenario.width===390?844:900}, hasTouch:scenario.width===390,reducedMotion:'reduce'});
  try {
   host.clock.advance(Date.parse(referenceTime) - host.clock.now().valueOf());
   await context.route('**/*',route=>new URL(route.request().url()).origin===host.baseUrl?route.continue():route.abort());
   const page=await context.newPage(), pageErrors=[];
   page.on('pageerror', error=>pageErrors.push(error.message));
   page.setDefaultTimeout(10000);
   await page.clock.install({time:host.clock.now()});
   await page.goto(host.baseUrl);
   await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');
   await page.getByRole('button',{name:'Sign in',exact:true}).click();
   const composer=page.locator('#message'), send=page.locator('#send');
   await composer.fill(seed);
   const created=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/api/cases'));
   await send.click();
   const seedReply=await created;
   assert.equal(seedReply.status(),201);
   const seedBody=await seedReply.json();
   const caseId=seedBody.view.case.caseId;
   const initial=await waitForSettled(host,caseId);
   assert.equal(initial.restaurant.intentDraft?.date,initialDate);
   await page.locator('#candidate-panel').waitFor();
   const start=host.providerCalls.length;
   assert.ok(start);
   const posted=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/messages'));
   if (scenario.dateEditor) {
    await page.getByRole('button',{name:'Thu, Nov 26',exact:true}).click();
    await page.getByLabel('Edit Thu, Nov 26',{exact:true}).fill(scenario.expected);
    await page.getByRole('button',{name:'Save',exact:true}).click();
   } else {
    await composer.fill(scenario.message);
    await send.click();
   }
   const response=await posted;
   assert.equal(response.request().postDataJSON()?.message,scenario.message);
   const end=await waitForSettled(host,caseId);
   const calls=host.providerCalls.slice(start);
   const dates=[...new Set(calls.map(call=>call.date))];
   const times=[...new Set(calls.map(call=>call.timeWindow.earliest))];
   const recordsNewDate=dates.length === 1 && dates[0] === scenario.expected && end.restaurant.intentDraft?.date===scenario.expected;
   const requestedDateVisible=()=>page.getByRole('button',{name:scenario.expectedChip,exact:true});
   const clarified=end.case.phase==='NEEDS_INPUT' && calls.length===0;
   let resultingUI=false;
   if(recordsNewDate) resultingUI=await requestedDateVisible().waitFor().then(()=>true);
   else if(clarified) resultingUI=await page.locator('#messages').waitFor().then(()=>true);
   assert.deepEqual(pageErrors,[]);
   console.log(JSON.stringify({case:scenario.name,width:scenario.width,message:scenario.message,expected:scenario.expected,phase:end.case.phase,
     dates,times,calls:calls.length,status:response.status(),resultingUI,pass:resultingUI&&
     (recordsNewDate&&(scenario.dateEditor||times.length===1&&times[0]==='19:00')||scenario.dateEditor&&clarified)}));
  } finally {
   await context.close();
   await host.close();
  }
 }
} finally {
 await browser.close();
}

