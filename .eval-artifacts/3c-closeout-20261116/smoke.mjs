import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {startWorkspaceFixture} from '../../src/harness/workspace-fixture-server.ts';
const dir=new URL('../3c-closeout-20261117/smoke/',import.meta.url);await mkdir(dir,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const results=[];
for(const size of [{name:'mobile',width:390,height:844},{name:'desktop',width:1280,height:900}]){
 const host=await startWorkspaceFixture({multiSlot:true,questions:true});host.hold();
 const browser=await chromium.launch({headless:true,args:['--disable-background-networking']});
 const context=await browser.newContext({viewport:{width:size.width,height:size.height},serviceWorkers:'block'});
 const record={sha,size,baseUrl:host.baseUrl,clock:host.clock.now().toISOString(),mode:'本地 Chromium 双尺寸 Fixture 联调',http:[],sse:[],console:[],errors:[],externalBlocked:[],requests:[],checks:{}};
 await context.route('**/*',route=>{
  const r=route.request(),u=new URL(r.url());
  if(u.origin===host.baseUrl)return route.continue();
  record.externalBlocked.push({url:r.url(),method:r.method(),navigation:r.isNavigationRequest()});return route.abort('blockedbyclient');
 });
 context.on('request',r=>{if(new URL(r.url()).origin===host.baseUrl)record.requests.push({method:r.method(),url:r.url(),...(r.method()==='POST'&&!r.url().endsWith('/session')?{body:r.postDataJSON()}: {})});});
 context.on('response',r=>record.http.push({url:r.url(),status:r.status(),method:r.request().method()}));
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
 cdp.on('Network.eventSourceMessageReceived',e=>record.sse.push(e));
 page.on('console',m=>record.console.push({type:m.type(),text:m.text()}));page.on('pageerror',e=>record.errors.push(e.message));
 const shot=async label=>{await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:new URL(size.name+'-'+label+'.png',dir).pathname,animations:'disabled'});};
 const ready=async()=>{await page.waitForFunction(()=>document.querySelector('#card-counter')?.textContent==='1 of 3');await page.locator('#progress').waitFor({state:'hidden'});};
 const view=async()=>{const id=await page.locator('.case-link.active').getAttribute('data-case-id');return (await (await page.request.get(host.baseUrl+'/api/cases/'+encodeURIComponent(id))).json()).view;};
 try{
  await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);
  await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('#message').fill('Dinner for two');await page.locator('#send').click();
  await host.waitForCheck();await page.locator('#progress').waitFor({state:'visible'});await shot('progress');
  assert.ok(record.sse.length>0,'actual SSE must arrive');record.checks.progressAndSse=true;
  host.release();await ready();await shot('results');
  assert.equal(await page.locator('#delivery-slots p').count(),1);assert.match(await page.locator('#availability').innerText(),/19:00/);
  await page.locator('#message').fill('Keep my unsent draft');await page.getByRole('button',{name:'2 guests',exact:true}).click();
  const editor=page.getByRole('textbox',{name:'Edit 2 guests',exact:true});await editor.fill('3');await shot('inline-edit');
  const sent=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));
  await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await sent).status(),200);
  await page.getByRole('button',{name:'3 guests',exact:true}).waitFor();await ready();
  assert.equal(await page.locator('#message').inputValue(),'Keep my unsent draft');assert.equal(host.questionRequests.length,0);record.checks.inlineMessagesAndDraft=true;
  let v=await view();const candidateId=await page.locator('#candidate-card').getAttribute('data-candidate-id');
  await page.locator('#details-button').click();assert.equal(await page.locator('#app input:visible, #app textarea:visible').count(),1);
  await page.locator('#message').fill('Does this place require a card?');const questionResponse=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/questions'));
  await page.locator('#send').click();assert.equal((await questionResponse).status(),200);await page.locator('#answer-sheet').waitFor({state:'visible'});
  assert.equal(host.questionRequests.at(-1).candidate.restaurant.id,candidateId);v=await view();
  const answer=v.restaurant.questionHistory.find(q=>q.candidateId===candidateId).result;
  assert.equal(answer.status,'ANSWERED');assert.equal(answer.candidateId,candidateId);assert.ok(answer.citations.length>0);
  record.answer=answer;await shot('g1-answer');record.checks.g1CandidateAndCitations=true;
  await page.locator('#answer-dismiss').click();await page.locator('#details-back').click();await page.locator('#choose').click();
  const selector=page.getByLabel('Booking time',{exact:true}),choices=await selector.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));assert.equal(choices.length,2);
  await selector.selectOption(choices[1]);v=await view();const b1=v.restaurant.bookingHandoffs.find(h=>h.candidateId===candidateId&&h.offerId===choices[1]);assert.ok(b1);
  assert.equal(await page.locator('#departure').getAttribute('href'),b1.url);record.selected={candidateId,offerId:choices[1],b1};
  await page.reload();await page.locator('#handoff').waitFor({state:'visible'});assert.equal(await selector.inputValue(),choices[1]);assert.equal(await page.locator('#departure').getAttribute('href'),b1.url);record.checks.secondSlotAndB1Reload=true;await shot('second-slot-restored');
  const departureResponse=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/booking-departures'));
  await page.locator('#departure').click();const response=await departureResponse;assert.equal(response.status(),201);const receipt=await response.json();
  assert.equal(receipt.url,b1.url);assert.equal(receipt.departure.candidateId,candidateId);assert.equal(receipt.departure.offerId,choices[1]);
  // Query the persisted SQL row independently of the HTTP response.
  const persisted=await host.application.store.database.query('SELECT candidate_id, offer_id, provider FROM restaurant_booking_departures WHERE id=$1',[receipt.departure.id]);
  assert.deepEqual(persisted.rows.map(r=>[r.candidate_id,r.offer_id]),[[candidateId,choices[1]]]);record.departure={receipt,persisted:persisted.rows};
  await page.waitForFunction(()=>true); // Only bounded follow-up below waits for navigation interception.
  for(let i=0;i<100&&!record.externalBlocked.some(r=>r.url===b1.url);i++)await new Promise(r=>setTimeout(r,20));
  assert.ok(record.externalBlocked.some(r=>r.url===b1.url&&r.method==='GET'));record.checks.departurePersistedAndExternalBlocked=true;
  const artifact=await host.application.exportReadArtifact(v.case.caseId);await writeFile(new URL(size.name+'-artifact.json',dir),JSON.stringify(artifact,null,2));
  assert.equal(record.errors.length,0);const unexpected=record.http.filter(r=>r.status>=400&&!(r.status===401&&new URL(r.url).pathname==='/api/session'&&r.method==='GET'));assert.deepEqual(unexpected,[]);
  const appErrors=record.console.filter(m=>m.type==='error'&&!m.text.includes('401 (Unauthorized)'));assert.deepEqual(appErrors,[]);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));record.checks.noAppErrorsAndLayout=true;record.status='PASS';
 }catch(e){record.status='FAIL';record.failure=e.stack;await shot('failure').catch(()=>{});throw e;}
 finally{results.push(record);await writeFile(new URL(size.name+'.json',dir),JSON.stringify(record,null,2));await writeFile(new URL('manifest.json',dir),JSON.stringify(results.map(r=>({sha:r.sha,size:r.size,status:r.status,checks:r.checks,failure:r.failure})),null,2));await context.close();await browser.close();await host.close();}
}
console.log(JSON.stringify(results.map(r=>({sha:r.sha,size:r.size,status:r.status,checks:r.checks}))));
