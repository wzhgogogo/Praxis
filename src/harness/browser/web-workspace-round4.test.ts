import assert from 'node:assert/strict';
import test from 'node:test';
import { chromium, type Page } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { startWorkspaceFixture } from '../workspace-fixture-server.js';
const sizes=[{width:390,height:844},{width:1280,height:900}];
async function ready(page:Page,count=3){await page.waitForFunction(count=>document.getElementById('card-counter')?.textContent==='1 of '+count,count);await page.locator('#progress').waitFor({state:'hidden'});}
async function open(page:Page,host:Awaited<ReturnType<typeof startWorkspaceFixture>>,empty=false){
 page.setDefaultTimeout(10_000);await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);
 await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.locator('#message').fill('Dinner in Tokyo');await page.locator('#send').click();
 if(empty)await page.locator('#empty-state').waitFor({state:'visible'});else await ready(page);
}
async function view(page:Page){const id=await page.locator('.case-link.active').getAttribute('data-case-id');return (await(await page.request.get('/api/cases/'+encodeURIComponent(id!))).json()).view;}
async function shot(page:Page,name:string){if(!process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT)return;await mkdir(process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT,{recursive:true});await page.screenshot({path:join(process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT,name+'.png')});}
for(const size of sizes)test('Round5 '+size.width+': failed existing-Case submit restores card controls, current clarification and an emptied draft',{timeout:30_000},async()=>{
 const host=await startWorkspaceFixture({multiSlot:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size});
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());const page=await context.newPage();let release=()=>{};
 try{await open(page,host);const projected=await view(page);host.disconnectStreams();
  // A retained qualified card beside a current clarification, using only the read-projection boundary.
  projected.case.phase='NEEDS_INPUT';projected.restaurant.clarificationQuestion='Which area should I use for this change?';
  await page.route('**/api/cases/*/events',r=>r.fulfill({status:200,contentType:'text/event-stream',body:': projection fixture\n\n'}));
  await page.route(host.baseUrl+'/api/cases/'+encodeURIComponent(projected.case.caseId),r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({view:projected})}));
  await page.reload();await page.locator('#messages').waitFor({state:'visible'});
  const slots=page.locator('#delivery-slots .slot-time');assert.equal(await slots.count(),2);assert.equal(await page.locator('#choose').isEnabled(),true);
  const gate=new Promise<void>(r=>{release=r;});await page.route('**/api/conversations/*/messages',async r=>{await gate;await r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Controlled submit failure'})});});
  const draft='Change this existing plan';await page.locator('#message').fill(draft);const sent=page.waitForRequest(r=>r.method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));await page.locator('#send').click();await sent;
  assert.equal(await page.locator('#choose').isDisabled(),true);for(const slot of await slots.all())assert.equal(await slot.isDisabled(),true);
  assert.equal(await page.locator('#messages').isVisible(),false);await page.locator('#message').fill('');release();
  await page.locator('#error').waitFor({state:'visible'});assert.match(await page.locator('#error').innerText(),/Controlled submit failure/);
  assert.equal(await page.locator('#choose').isEnabled(),true);for(const slot of await slots.all())assert.equal(await slot.isEnabled(),true);
  assert.equal(await page.locator('#messages').isVisible(),true);assert.equal(await page.locator('#messages').innerText(),projected.restaurant.clarificationQuestion);
  assert.equal(await page.locator('#message').inputValue(),draft);assert.equal(await page.locator('#send').getAttribute('aria-busy'),'false');await shot(page,'round5-'+size.width+'-failed-submit-restored');
 }finally{release();await context.close();await browser.close();await host.close();}
});
for(const size of sizes){
 test('Round4 '+size.width+': expired Saved opens the exact presented card and refreshes before booking',{timeout:45_000},async()=>{
  const host=await startWorkspaceFixture({sourceValidityMs:60_000}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size});
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());const page=await context.newPage();let refreshes=0;
  page.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname.endsWith('/refresh'))refreshes++;});
  try{await open(page,host);await page.locator('#next').click();const name=await page.locator('#restaurant-name').innerText();await page.locator('#bookmark').click();await page.waitForFunction(()=>document.getElementById('bookmark')?.getAttribute('aria-pressed')==='true');
   const before=await view(page),id=before.restaurant.presentedCandidateIds[1];const ttl=Math.max(...Object.values(before.restaurant.availabilityChecks).map((c:any)=>Date.parse(c.displayExpiresAt)))-host.clock.now().valueOf()+100;
   host.clock.advance(ttl);await page.clock.fastForward(ttl);await page.reload();await page.locator('#restaurant-name').waitFor();
   const expired=await view(page);assert.ok(expired.restaurant.presentedCandidateIds.includes(id));assert.ok(!expired.restaurant.readyCandidateIds.includes(id));
   await page.locator('#saved').click();const row=page.locator('#saved-list button[data-candidate-id="'+id+'"]');assert.equal(await row.isEnabled(),true);await row.click();assert.equal(await page.locator('#restaurant-name').innerText(),name);
   await page.locator('#choose').click();await page.locator('#handoff').waitFor({state:'visible'});assert.equal(await page.locator('#handoff-name').innerText(),name);assert.equal(refreshes,1);await shot(page,'round4-'+size.width+'-saved-expired');
  }finally{await context.close();await browser.close();await host.close();}
 });
 test('Round4 '+size.width+': interrupted revision hides old answers, syncs title and never infers Saved removal',{timeout:45_000},async()=>{
  const host=await startWorkspaceFixture({questions:true,revisionCuisine:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size});
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());const page=await context.newPage();let release=()=>{};
  try{await open(page,host);await page.locator('#bookmark').click();await page.waitForFunction(()=>document.getElementById('bookmark')?.getAttribute('aria-pressed')==='true');await page.locator('#details-button').click();await page.locator('#message').fill('Does this place require a card?');await page.locator('#send').click();await page.locator('#answer-sheet').waitFor({state:'visible'});await page.locator('#answer-dismiss').click();await page.locator('#details-back').click();
   host.hold();const gate=new Promise<void>(r=>{release=r;});await page.route('**/api/conversations/*/messages',async r=>{await gate;await r.continue();});
   await page.locator('#message').fill('Make it three guests and tempura');const sent=page.waitForRequest(r=>new URL(r.url()).pathname.endsWith('/messages'));await page.locator('#send').click();await sent;
   assert.equal(await page.locator('#messages').isVisible(),false);assert.equal(await page.locator('#messages').textContent(),'');
   const geometry=await page.locator('#send').evaluate(button=>{const rect=button.getBoundingClientRect(),style=getComputedStyle(button,'::after');return {dx:button.clientLeft+parseFloat(style.left)+parseFloat(style.width)/2-rect.width/2,dy:button.clientTop+parseFloat(style.top)+parseFloat(style.height)/2-rect.height/2,box:style.boxSizing};});assert.equal(geometry.box,'border-box');assert.ok(Math.abs(geometry.dx)<1&&Math.abs(geometry.dy)<1,JSON.stringify(geometry));
   release();await host.waitForCheck();await page.waitForFunction(()=>document.getElementById('case-title')?.textContent?.includes('3 guests'));assert.match(await page.locator('#case-title').innerText(),/Tempura/);assert.doesNotMatch(await page.locator('#case-title').innerText(),/sushi/i);assert.equal(await page.locator('#case-title').innerText(),await page.locator('.case-link.active span').innerText());
   await page.locator('#stop').click();await page.waitForFunction(()=>document.getElementById('messages')?.textContent==='Search stopped.');const stopped=await view(page);assert.deepEqual(stopped.restaurant.revisionDiff?.removed??[],[]);assert.equal(stopped.restaurant.savedCandidates[0].reasonCode,undefined);
   await page.locator('#saved').click();for(const id of ['progress','empty-state','understanding-error','partial-source-note','messages'])assert.equal(await page.locator('#'+id).isVisible(),false,id);assert.doesNotMatch(await page.locator('#saved-list').innerText(),/No longer matches/);
   host.release();await page.reload();await page.locator('#saved-panel').waitFor({state:'visible'});const current=await view(page);const listed=(await(await page.request.get('/api/cases')).json()).cases.find((c:any)=>c.caseId===current.case.caseId);assert.equal(listed.title,current.case.title);assert.equal(await page.locator('#case-title').getAttribute('title'),current.case.title);await shot(page,'round4-'+size.width+'-stopped-saved');
  }finally{release();host.release();await context.close();await browser.close();await host.close();}
 });
 test('Round4 '+size.width+': About keeps timed condition evidence and one Source for all answer citations',{timeout:30_000},async()=>{
  const host=await startWorkspaceFixture({questions:true,questionCitations:true,revisionScenario:'structured'}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size});
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());const page=await context.newPage();
  try{await open(page,host);assert.equal(await page.locator('#delivery-conditions a').count(),0);assert.doesNotMatch(await page.locator('#delivery-conditions').textContent()||'',/Checked/);await page.locator('#details-button').click();
   await page.locator('#message').fill('Does this place require a card?');await page.locator('#send').click();await page.locator('#answer-sheet').waitFor({state:'visible'});
   for(const selector of ['#question-result','#asked-result']){assert.equal(await page.locator(selector+' details').count(),1);assert.equal(await page.locator(selector+' blockquote').count(),3);assert.equal(await page.locator(selector+' a').count(),3);assert.equal(await page.locator(selector+' .citation-group').count(),3);assert.equal((await page.locator(selector).textContent()||'').match(/Checked/g)?.length,3);}
   assert.equal(await page.locator('#asked-history h3').textContent(),'Q&A');await page.locator('#answer-dismiss').click();await page.locator('#details-back').click();await page.locator('#message').fill('Make it three guests');await page.locator('#send').click();await ready(page,2);assert.equal((await view(page)).restaurant.intentDraft.partySize,3);await page.locator('#details-button').click();
   assert.ok(await page.locator('#details-content [data-source-id]').count()>0);assert.match(await page.locator('#details-content').innerText(),/Dinner course ¥5000/);assert.match(await page.locator('#details-content').innerText(),/Checked Thu, Oct 29 · 19:00 JST/);for(const id of ['progress','empty-state','understanding-error','partial-source-note','messages'])assert.equal(await page.locator('#'+id).isVisible(),false,id);await shot(page,'round4-'+size.width+'-about-sources');
  }finally{await context.close();await browser.close();await host.close();}
 });
 test('Round4 '+size.width+': exhausted empty state has a full-width Adjust with transient focus guidance',{timeout:25_000},async()=>{
  const host=await startWorkspaceFixture({outcome:'empty'}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
  await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  try{await open(page,host,true);assert.equal(await page.locator('#empty-message').innerText(),"Couldn't confirm a matching place this time. Try adjusting the area, time, or party size.");const button=await page.locator('#empty-adjust').boundingBox(),actions=await page.locator('.empty-actions').boundingBox();assert.ok(button&&actions&&Math.abs(button.width-actions.width)<1);
   await page.locator('#empty-adjust').click();assert.match((await page.locator('#message').getAttribute('placeholder'))!,/Try another area/);assert.equal(await page.locator('#message').evaluate(n=>n===document.activeElement),true);await page.locator('#case-title').click();assert.equal(await page.locator('#message').getAttribute('placeholder'),null);await shot(page,'round4-'+size.width+'-empty-adjust');
  }finally{await context.close();await browser.close();await host.close();}
 });
}

for(const size of sizes)test('Round4 '+size.width+': current state alone selects clarification/retry messages and suppresses historical answers',{timeout:30_000},async()=>{
 const host=await startWorkspaceFixture({questions:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:size}),page=await context.newPage();
 await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 try{await open(page,host);const original=await view(page);host.disconnectStreams();let projected=structuredClone(original);
  // Controlled read-projection fixtures over the real local HTTP session; no state or database is changed.
  projected.restaurant.candidates=[];projected.restaurant.readyCandidateIds=[];projected.restaurant.presentedCandidateIds=[];projected.restaurant.availability={};projected.restaurant.progress={active:true,stopped:false};projected.case.phase='SEARCHING';
  projected.conversation.messages.push({role:'ASSISTANT',content:'旧的单店回答 / internal diagnostic details deliberately retained in history'});
  await page.route('**/api/cases/*/events',r=>r.fulfill({status:200,contentType:'text/event-stream',body:': projection fixture\n\n'}));
  await page.route('**/api/cases/*',r=>r.request().method()==='GET'&&!r.request().url().endsWith('/events')?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({view:projected})}):r.continue());
  await page.reload();await page.locator('#progress').waitFor({state:'visible'});assert.equal(await page.locator('#messages').textContent(),'');assert.equal(await page.locator('#messages').isVisible(),false);
  projected.case.phase='NEEDS_INPUT';projected.restaurant.progress.active=false;projected.restaurant.clarificationQuestion='Which area would you like this time?';await page.reload();await page.locator('#messages').waitFor({state:'visible'});assert.equal(await page.locator('#messages').innerText(),projected.restaurant.clarificationQuestion);
  projected.case.phase='FAILED';projected.restaurant.readStatus.kind='OTHER_FAILURE';delete projected.restaurant.clarificationQuestion;await page.reload();await page.locator('#empty-state').waitFor({state:'visible'});assert.equal(await page.locator('#empty-message').innerText(),"Couldn't complete this search. Please try again.");await shot(page,'round4-'+size.width+'-retry-message');
 }finally{await context.close();await browser.close();await host.close();}
});
