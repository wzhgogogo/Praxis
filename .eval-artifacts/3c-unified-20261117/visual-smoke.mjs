import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {startWorkspaceFixture} from '../../src/harness/workspace-fixture-server.ts';
import {createGooglePhotoFixture,LONG_PHOTO_CREDIT} from '../../src/harness/google-photo-fixtures.ts';
import {createPhotoSourceFixture} from '../../src/harness/restaurant-photo-fixtures.ts';
const batch=new URL('./',import.meta.url),out=new URL((process.env.PRAXIS_VISUAL_SUBDIR||'round-4/visual')+'/',batch);await mkdir(out,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results=[];
const sizes=[{name:'mobile',width:390,height:844},{name:'desktop',width:1440,height:900},{name:'breakpoint',width:960,height:900}];
const scenarios=process.env.PRAXIS_VISUAL_DEVELOPMENT?['google']:['google','google-long-cover','cover-download-fails','cover-decode-fails','no-id','partial-gallery','both-fail'];
for(const size of sizes)for(const scenario of scenarios){
 if(size.name==='breakpoint'&&!scenario.startsWith('google'))continue;
 const isGoogle=scenario.startsWith('google');
 const google=await createGooglePhotoFixture(scenario==='no-id'?'google':scenario==='both-fail'?'cover-decode-fails':isGoogle?'google':scenario,scenario==='google-long-cover'),source=await createPhotoSourceFixture(scenario==='both-fail'?'bad-image':'normal');
 const host=await startWorkspaceFixture({multiSlot:true,questions:true,naturalRecommendation:true,photoHttp:source.http,...(scenario==='no-id'?{}:{photoGoogle:google.transport}),photoLongAddress:isGoogle});host.hold();
 const browser=await chromium.launch({headless:true,args:['--disable-background-networking']}),context=await browser.newContext({viewport:{width:size.width,height:size.height},serviceWorkers:'block'});
 const record={sha,size,scenario,mode:'LOCAL_CHROMIUM_HTTP_SSE_FIXTURE',http:[],sse:[],console:[],errors:[],externalBlocked:[],posts:[],checks:{}};
 await context.route('**/*',route=>{const r=route.request();if(new URL(r.url()).origin===host.baseUrl)return route.continue();record.externalBlocked.push({url:r.url(),method:r.method(),navigation:r.isNavigationRequest()});return route.abort('blockedbyclient');});
 context.on('request',r=>{if(new URL(r.url()).origin===host.baseUrl&&r.method()==='POST'&&!r.url().endsWith('/session'))record.posts.push({path:new URL(r.url()).pathname,body:r.postDataJSON()});});
 context.on('response',r=>record.http.push({path:new URL(r.url()).pathname,status:r.status(),method:r.request().method()}));
 const page=await context.newPage();page.setDefaultTimeout(15_000);const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');cdp.on('Network.eventSourceMessageReceived',e=>record.sse.push(e));
 page.on('console',m=>record.console.push({type:m.type(),text:m.text()}));page.on('pageerror',e=>record.errors.push(e.message));
 const shot=async label=>{await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:new URL(size.name+'-'+scenario+'-'+label+'.png',out).pathname,animations:'disabled'});};
 const ready=async()=>{await page.waitForFunction(()=>document.getElementById('card-counter')?.textContent==='1 of 3');await page.locator('#progress').waitFor({state:'hidden'});};
 const image=async id=>{await page.waitForFunction(id=>{const n=document.getElementById(id);return n?.complete&&n.naturalWidth>0;},id);};
 const view=async()=>{const id=await page.locator('.case-link.active').getAttribute('data-case-id');return(await(await context.request.get(host.baseUrl+'/api/cases/'+encodeURIComponent(id))).json()).view;};
 const clickable=async id=>{await page.locator('#'+id).scrollIntoViewIfNeeded();assert.equal(await page.locator('#'+id).evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return n.contains(hit)&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;}),true,id+' must be unobstructed');};
 try{
  await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  const coverResponse=page.waitForResponse(r=>r.url().includes('/photos?scope=cover'));await page.locator('#message').fill('Dinner for two');await page.locator('#send').click();await host.waitForCheck();await page.locator('#progress').waitFor({state:'visible'});for(let i=0;i<200&&!record.sse.length;i++)await new Promise(r=>setTimeout(r,10));assert.ok(record.sse.length);if(scenario==='google')await shot('progress');host.release();await ready();record.checks.loginSearchSse=true;
  const coverReply=await page.waitForFunction(()=>{const n=document.getElementById('cover-image'),p=document.getElementById('no-photo');return n?.naturalWidth>0||p&&!p.hidden&&document.getElementById('card-counter')?.textContent==='1 of 3';});await coverReply.dispose();
  if(scenario==='both-fail'){const unavailable=await(await coverResponse).json();assert.equal(unavailable.photos.length,0);assert.equal(await page.locator('#cover-open').isVisible(),false);record.checks.placeholder=true;}
  else{await image('cover-image');assert.equal(await page.locator('#no-photo').isVisible(),false);}
  let v=await view(),candidateId=await page.locator('#candidate-card').getAttribute('data-candidate-id');record.candidateId=candidateId;
  if(isGoogle){
   if(scenario==='google'){assert.match(await page.locator('#cover-photo-source').innerText(),/^Google Maps · Fixture photographer 1$/);assert.equal(await page.locator('#cover-photo-source').evaluate(n=>n.classList.contains('long')),false);}else{await page.waitForFunction(()=>document.getElementById('cover-photo-source')?.classList.contains('long'));assert.ok((await page.locator('#cover-photo-source').innerText()).includes(LONG_PHOTO_CREDIT));}
   const address=await page.locator('#key-facts .address-line').evaluate(n=>({text:n.textContent,height:n.getBoundingClientRect().height,line:parseFloat(getComputedStyle(n).lineHeight),clamp:getComputedStyle(n).webkitLineClamp}));
   assert.equal(address.clamp,'2');assert.ok(address.height<=address.line*2+1);assert.ok(address.text.includes('※')&&address.text.includes('【'));assert.doesNotMatch(address.text,/^Japan,|^〒/);assert.match(await page.locator('#key-facts').innerText(),/450 m away/);assert.match(await page.locator('#key-facts').innerText(),/¥5,000/);record.address={...address,raw:v.restaurant.candidates.find(c=>c.restaurant.id===candidateId).restaurant.address};
   await clickable('choose');await shot(scenario==='google'?'short-credit-address':'long-credit-address');
   record.checks.attributionAndAddress=true;
  }
  await page.locator('#message').fill('Keep my unsent draft');await page.getByRole('button',{name:'2 guests',exact:true}).click();const editor=page.getByRole('spinbutton',{name:'Edit 2 guests',exact:true});await editor.fill('3');
  const edit=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/messages'));await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await edit).status(),200);await ready();await page.getByRole('button',{name:'3 guests',exact:true}).waitFor();assert.equal(await page.locator('#message').inputValue(),'Keep my unsent draft');record.checks.inlineMessagesDraft=true;
  await page.locator('#details-button').click();assert.equal(await page.locator('#app input:visible,#app textarea:visible').count(),1);
  if(scenario!=='both-fail'){
   await image('detail-photo');await page.locator('#detail-photo-next').click();await image('detail-photo');
   if(isGoogle){await page.waitForFunction(()=>document.getElementById('detail-photo-source')?.classList.contains('long'));assert.equal(await page.locator('#detail-photo-source').evaluate(n=>n.scrollWidth<=n.clientWidth+1),true);assert.ok((await page.locator('#detail-photo-source').innerText()).includes(LONG_PHOTO_CREDIT));assert.match(await page.locator('#detail-photo-source').innerText(),/Google Maps.*Additional credited contributor/);assert.equal(await page.locator('#details-content p').first().textContent(),record.address.raw);}
   if(scenario==='partial-gallery'){
    await page.locator('#detail-photo-next').click();await page.waitForFunction(()=>document.getElementById('detail-photo-counter')?.textContent==='3 of 7');await image('detail-photo');assert.equal(await page.locator('#detail-photo-counter').innerText(),'3 of 7');record.checks.partialGallerySurvives=true;
   }
   await page.locator('#detail-photo-open').click();await page.locator('#photo-viewer').waitFor({state:'visible'});await image('large-photo');if(isGoogle){assert.ok((await page.locator('#photo-source').innerText()).includes(LONG_PHOTO_CREDIT));assert.match(await page.locator('#photo-source').innerText(),/Google Maps.*Additional credited contributor/);}await shot('viewer');await page.locator('#photo-close').click();await shot('about');record.checks.galleryAndViewer=true;
  }
  if(size.name!=='breakpoint'){
   await page.locator('#message').fill('Does this place require a card?');const question=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/questions'));await page.locator('#send').click();assert.equal((await question).status(),200);await page.locator('#answer-sheet').waitFor({state:'visible'});v=await view();const answer=v.restaurant.questionHistory.find(q=>q.candidateId===candidateId).result;assert.equal(answer.status,'ANSWERED');assert.equal(answer.candidateId,candidateId);assert.ok(answer.citations.length);assert.equal(host.questionRequests.length,1);record.answer=answer;record.checks.g1=true;if(scenario==='google'||scenario==='both-fail')await shot('g1');await page.locator('#answer-dismiss').click();
  }
  await page.locator('#details-back').click();await clickable('choose');await page.locator('#choose').click();
  const select=page.getByLabel('Booking time',{exact:true}),choices=await select.locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));assert.equal(choices.length,2);await select.selectOption(choices[1]);v=await view();const b1=v.restaurant.bookingHandoffs.find(h=>h.candidateId===candidateId&&h.offerId===choices[1]);assert.ok(b1);assert.equal(await page.locator('#departure').getAttribute('href'),b1.url);record.selected={candidateId,offerId:choices[1],b1};
  await page.reload();await page.locator('#handoff').waitFor({state:'visible'});assert.equal(await select.inputValue(),choices[1]);assert.equal(await page.locator('#departure').getAttribute('href'),b1.url);record.checks.secondSlotAndRestore=true;
  const departing=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname.endsWith('/booking-departures'));await clickable('departure');await page.locator('#departure').click();const response=await departing;assert.equal(response.status(),201);const receipt=await response.json();
  const persisted=await host.database.query('SELECT candidate_id, offer_id, provider FROM restaurant_booking_departures WHERE id=$1',[receipt.departure.id]);assert.deepEqual(persisted.rows.map(r=>[r.candidate_id,r.offer_id]),[[candidateId,choices[1]]]);record.departure={receipt,persisted:persisted.rows};
  for(let i=0;i<100&&!record.externalBlocked.some(r=>r.url===b1.url);i++)await new Promise(r=>setTimeout(r,20));assert.ok(record.externalBlocked.some(r=>r.url===b1.url&&r.method==='GET'));record.checks.b1PersistenceAndExternalBlocked=true;
  record.googleRequests=google.calls;record.websiteRequests=source.calls;assert.equal(record.errors.length,0);
  record.expectedHttp=record.http.filter(r=>r.status===401&&r.path==='/api/session'&&r.method==='GET'||scenario==='partial-gallery'&&r.status===410&&r.path.endsWith('/content'));
  const unexpected=record.http.filter(r=>r.status>=400&&!record.expectedHttp.includes(r));assert.deepEqual(unexpected,[]);
  const appErrors=record.console.filter(m=>m.type==='error'&&!/401 \(Unauthorized\)/.test(m.text)&&!(scenario==='partial-gallery'&&/410 \(Gone\)/.test(m.text)));assert.deepEqual(appErrors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);record.checks.noUnexpectedErrors=true;record.status='PASS';console.log(size.name+' '+scenario+' PASS');
 }catch(e){record.status='FAIL';record.failure=e.stack;await shot('failure').catch(()=>{});throw e;}
 finally{host.release();results.push(record);await writeFile(new URL(size.name+'-'+scenario+'.json',out),JSON.stringify(record,null,2));await writeFile(new URL('manifest.json',out),JSON.stringify(results.map(r=>({sha:r.sha,size:r.size,scenario:r.scenario,status:r.status,checks:r.checks,failure:r.failure})),null,2));await context.close();await browser.close();await host.close();}
}
