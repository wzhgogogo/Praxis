import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium,type Page} from 'playwright-core';
import type {RestaurantCaseView} from '../../application/agent-workspace.js';
import type {RestaurantReadEvidence} from '../../domains/restaurant/contracts.js';
import {assessRestaurantConditions} from '../../domains/restaurant/condition-states.js';
import {startWorkspaceFixture} from '../workspace-fixture-server.js';
import {googlePhotoRecoveryFixture} from '../google-photo-recovery-fixture.js';
import {createPhotoSourceFixture} from '../restaurant-photo-fixtures.js';
import {questionRowFixture} from '../question-row-fixture.js';
let journeySequence=0;
type Host=Awaited<ReturnType<typeof startWorkspaceFixture>>;
async function capture(page:Page,name:string){const root=process.env.PRAXIS_ROUND25_VISUAL_OUTPUT??process.env.PRAXIS_ROUND8_VISUAL_OUTPUT??process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT;if(root){await mkdir(root,{recursive:true});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:join(root,name+'.png'),animations:'disabled'});}}
async function loaded(page:Page,id:string){await page.waitForFunction(id=>{const img=document.querySelector<HTMLImageElement>(id);return img?.complete&&img.naturalWidth>0;},id);}
async function journey(width:number,options:Parameters<typeof startWorkspaceFixture>[0],run:(page:Page,host:Host,view:RestaurantCaseView)=>Promise<void>){
 let signedIn=false;const ordinal=++journeySequence,host=await startWorkspaceFixture(options),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'}),page=await context.newPage(),errors:string[]=[],consoleErrors:string[]=[],httpErrors:Array<{url:string;status:number;expectedStartup?:boolean}>=[];
 await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status(),...(!signedIn&&r.status()===401&&r.request().method()==='GET'&&new URL(r.url()).pathname==='/api/session'?{expectedStartup:true}:{})});});page.setDefaultTimeout(10000);
 await page.addInitScript(()=>{const Native=window.EventSource;Object.assign(window,{r25Streams:[]});window.EventSource=class extends Native{constructor(url:string|URL,init?:EventSourceInit){super(url,init);(window as unknown as {r25Streams:EventSource[]}).r25Streams.push(this);}};});
 try{await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#home').waitFor();signedIn=true;await page.locator('#message').fill('Dinner in Tokyo');await page.locator('#send').click();await page.waitForFunction(()=>document.getElementById('card-counter')?.textContent==='1 of 3'&&document.getElementById('progress')?.hidden);
  const id=(await page.locator('.case-link.active').getAttribute('data-case-id'))!,view=(await(await page.request.get('/api/cases/'+encodeURIComponent(id))).json()).view as RestaurantCaseView;
  await run(page,host,view);assert.deepEqual(errors,[]);assert.ok(consoleErrors.every(message=>message.startsWith('Failed to load resource:')),JSON.stringify(consoleErrors));assert.deepEqual(httpErrors.filter(row=>!row.expectedStartup&&(row.status!==503||!row.url.includes('/photos/'))),[]);const root=process.env.PRAXIS_ROUND25_VISUAL_OUTPUT;if(root)await writeFile(join(root,`round25-browser-${ordinal}-${width}.json`),JSON.stringify({appErrors:errors,consoleErrors,httpErrors,expectedTransportFailures:consoleErrors.length>0||httpErrors.length>0,nonLocalRequests:'context aborted'},null,2)+'\n');
 }finally{await context.close();await browser.close();await host.close();}
}
async function accept(page:Page,view:RestaurantCaseView){view.case.taskVersion++;await page.evaluate(async view=>{const path='/assets/workspace/transport.js';const {accept}=await import(path);accept(view);},view);}
for(const width of [390,1440])for(const mode of ['same-row','crossed','repeated','legacy'] as const)test(`Round25 UI: V3 ${width} source-table ${mode} reaches persisted Q&A sheet and history`,{timeout:35000},async()=>{
 await journey(width,{questions:{beforeAnswer:async()=>{},answer:input=>questionRowFixture(input.candidate,mode)}},async(page,host,view)=>{
  await page.locator('#details-button').click();await page.locator('#message').fill('Does this restaurant have private rooms?');await page.locator('#send').click();await page.locator('#answer-sheet').waitFor();await page.locator('#question-result summary').click();
  const expected=mode==='same-row'?['Private rooms: Available','For 2 people or more.']:mode==='crossed'?['Private rooms','Unavailable']:['Private rooms','Available','For 2 people or more.'];
  assert.deepEqual(await page.locator('#question-result blockquote').allTextContents(),expected);assert.equal(await page.locator('#question-result > p').first().innerText(),'The page lists private-room information. Please check the quoted rows.');
  assert.equal(await page.locator('#question-result .citation-footer').innerText(),'Tabelog ↗ · Checked Nov 21');
  assert.deepEqual(JSON.parse((await page.locator('#question-result .citation-group').getAttribute('data-source-id'))!),['https://tabelog.com/en/tokyo/fixture/','2026-11-21T08:04:00Z']);
  await capture(page,`round25-v3-${width}-${mode}-sheet`);await page.locator('#answer-close').click();await page.locator('#asked-result summary').click();assert.deepEqual(await page.locator('#asked-result blockquote').allTextContents(),expected);await capture(page,`round25-v3-${width}-${mode}-history`);
  const stored=await host.application.getCase('workspace-user',view.case.caseId);assert.equal(stored.restaurant.questionHistory[0]!.result!.status,'ANSWERED');
 });
});
for(const width of [390,1440])test(`Round25 UI: R5 V1 V2 V4 ${width} precise weak source identity and compact theme`,{timeout:35000},async()=>{
 await journey(width,{multiSlot:true},async(page,_host,view)=>{
  const id=view.restaurant.presentedCandidateIds![0]!,url='https://www.tabelog.com/fixture/';
  for(const via of ['indirect','direct','legacy'] as const){
   const merchant:RestaurantReadEvidence={evidenceId:'weak-merchant',kind:'RESTAURANT_FACT',provider:'TABELOG',candidateId:id,sourceUrl:url,observedAt:'2026-11-21T08:05:00Z',requestFingerprint:'weak',claims:via==='direct'?{verifiedHardCriteria:['quiet']}:{},sourceFieldQuotes:[{field:'SOURCE_TEXT',quote:'Small dining room.',sourceUrl:url}]};
   const judgment:RestaurantReadEvidence={...merchant,evidenceId:'weak-judgment',provider:'MODEL_JUDGMENT',sourceFieldQuotes:[],claims:{verifiedHardCriteria:['quiet'],supportingEvidenceIds:[merchant.evidenceId]}};
   const earlier={...merchant,evidenceId:'older-merchant',observedAt:'2026-11-21T08:04:00Z'},facts=via==='direct'?[merchant]:[merchant,judgment];
   const conditions=assessRestaurantConditions({criteria:[{text:'quiet',polarity:'POSITIVE',strength:'SOFT'}]},facts);
   if(via==='legacy'){for(const row of conditions){row.evidenceIds.push(earlier.evidenceId);for(const source of row.sources)delete source.evidenceId;}}
   view.restaurant.readEvidence.push(earlier,...facts);view.restaurant.currentFactEvidence=facts;view.restaurant.conditionStates={[id]:conditions};await accept(page,view);if(via==='indirect')await page.locator('#details-button').click();
   const source=page.locator('#details-content > section').filter({has:page.locator('blockquote',{hasText:'Small dining room.'})});
   assert.deepEqual(JSON.parse((await source.getAttribute('data-source-id'))!),[url,via==='legacy'?null:merchant.observedAt]);assert.equal(await source.locator('.citation-footer').innerText(),via==='legacy'?'Tabelog ↗':'Tabelog ↗ · Checked Nov 21');await capture(page,`round25-r5-${width}-${via}`);
  }
  const steak:RestaurantReadEvidence={...view.restaurant.currentFactEvidence[0]!,evidenceId:'steak',provider:'TABELOG',claims:{restaurantTypeFacts:['Steak']},sourceFieldQuotes:[{field:'CATEGORY',quote:'Steak',sourceUrl:url}]};view.restaurant.readEvidence.push(steak);view.restaurant.currentFactEvidence=[steak];view.restaurant.conditionStates={[id]:assessRestaurantConditions({criteria:[{text:'Steak',polarity:'POSITIVE',strength:'SOFT'}]},[steak])};await accept(page,view);
  assert.equal(await page.locator('#details-content blockquote').count(),0);assert.equal(await page.locator('#details-content > section .citation-footer').innerText(),'Tabelog ↗ · Checked Nov 21');assert.equal(await page.locator('#details-content .condition-status').evaluate(n=>getComputedStyle(n).color),'rgb(61, 90, 254)');await capture(page,`round25-v1-${width}-compact-steak`);
  await page.locator('#details-back').click();view.restaurant.shortlistCandidateIds=[id];await accept(page,view);assert.equal(await page.locator('#bookmark svg').evaluate(n=>getComputedStyle(n).fill),'rgb(61, 90, 254)');assert.equal(await page.locator('#details-button').evaluate(n=>getComputedStyle(n).color),'rgb(61, 90, 254)');await capture(page,`round25-v4-${width}-card-blue`);
 });
});
for(const height of [500,360])test(`Round25 UI: M1 M3 390 Chinese clarification keyboard height ${height}`,{timeout:35000},async()=>{
 await journey(390,{},async(page,_host,view)=>{
  view.case.title='在东京安排安静且适合聊天的团队聚餐，需要方便抵达并进一步确认日期、人数和饮食条件';view.case.phase='NEEDS_INPUT';view.restaurant.readyCandidateIds=[];delete view.restaurant.presentedCandidateIds;view.restaurant.candidates=[];view.restaurant.progress.active=false;view.restaurant.readStatus.kind='PENDING';view.restaurant.clarificationQuestion='请告诉我您希望在哪个区域用餐？\n也可以提供附近的车站或地址。\n我们会根据您的条件继续查找合适的餐厅。';if(view.restaurant.intentDraft)view.restaurant.intentDraft.criteria=Array.from({length:10},(_,i)=>({text:'需要安静且方便交谈的环境 '+i,strength:'SOFT',polarity:'POSITIVE'}));await accept(page,view);assert.ok(await page.locator('#request-conditions button').count()>=10);assert.equal(await page.locator('#request-conditions').evaluate(n=>n.scrollWidth>n.clientWidth),true);
  await page.locator('#message').fill('保留这段尚未发送的中文草稿。\n希望大家都可以方便抵达。\n还需要适合聊天的座位。');await page.locator('#message').focus();
  await page.evaluate(height=>{Object.defineProperty(window.visualViewport!,'height',{configurable:true,value:height});window.visualViewport!.dispatchEvent(new Event('resize'));},height);await page.clock.runFor(80);
  const metrics=await page.locator('#messages').evaluate(n=>({bottom:n.getBoundingClientRect().bottom,composer:document.getElementById('workspace-composer')!.getBoundingClientRect().top,font:getComputedStyle(document.getElementById('message')!).fontSize,overflow:document.documentElement.scrollWidth>innerWidth}));assert.ok(parseFloat(metrics.font)>=16);assert.ok(!metrics.overflow);assert.ok(metrics.bottom<metrics.composer,JSON.stringify(metrics));
  await capture(page,`round25-m1-390-keyboard-${height}`);const scroll=await page.locator('#case-workspace').evaluate(n=>n.scrollTop);if(height===360)assert.ok(scroll>0);await page.mouse.move(150,170);await page.mouse.wheel(0,-160);if(scroll>0)await page.waitForFunction(y=>document.getElementById('case-workspace')!.scrollTop<y,scroll);const userScroll=await page.locator('#case-workspace').evaluate(n=>n.scrollTop);assert.ok(userScroll<=scroll);await page.evaluate(()=>window.visualViewport!.dispatchEvent(new Event('scroll')));await page.clock.runFor(200);assert.equal(await page.locator('#case-workspace').evaluate(n=>n.scrollTop),userScroll);await capture(page,`round25-m1-390-review-scroll-${height}`);
  await page.locator('#message').evaluate(n=>n.blur());await page.evaluate(()=>{delete (window.visualViewport as unknown as Record<string,unknown>).height;window.visualViewport!.dispatchEvent(new Event('resize'));document.getElementById('reconnecting')!.hidden=false;});
  await page.locator('#case-workspace').evaluate(n=>n.scrollTop=0);const gap=await page.locator('#reconnecting').evaluate(n=>({top:n.getBoundingClientRect().top-document.getElementById('topbar')!.getBoundingClientRect().bottom,bottom:document.querySelector('.workspace-head')!.getBoundingClientRect().top-n.getBoundingClientRect().bottom}));assert.ok(Math.abs(gap.top-gap.bottom)<3,JSON.stringify(gap));await capture(page,`round25-m3-390-reconnecting-${height}`);
 });
});
for(const mode of ['list','transient','persistent','local-interruption'] as const)test(`Round25 UI: M2 390 current album recovers through real proxy ${mode}`,{timeout:45000},async()=>{
 const google=await googlePhotoRecoveryFixture(mode==='persistent'?'persistent':mode==='transient'?'transient':mode==='local-interruption'?'normal':'404'),website=await createPhotoSourceFixture();
 await journey(390,{photoGoogle:google.transport,photoHttp:website.http},async(page,host,view)=>{
  await loaded(page,'#cover-image');let listCalls=0;
  if(mode==='list')await page.route('**/photos?scope=gallery',route=>{listCalls++;return listCalls===1?route.abort('failed'):route.continue();});
  const statuses:number[]=[];page.on('response',r=>{if(r.url().includes('/photos/'))statuses.push(r.status());});
  await page.locator('#details-button').click();
  if(mode==='list'){for(let n=0;n<50&&listCalls===0;n++)await new Promise(r=>setTimeout(r,10));assert.equal(listCalls,1);}
  else {await page.waitForFunction(()=>document.getElementById('detail-photo-counter')?.textContent==='1 of 8');
   if(mode==='local-interruption'){
    const id=view.restaurant.presentedCandidateIds![0]!,gallery=await(await page.request.get(`/api/cases/${encodeURIComponent(view.case.caseId)}/candidates/${encodeURIComponent(id)}/photos?scope=gallery`)).json();let interrupted=false;
    await page.route('**/photos/*/content',async route=>{if(!interrupted&&route.request().method()==='GET'&&route.request().url().includes('/'+gallery.photos[1].id+'/content')){interrupted=true;const response=await route.fetch();assert.equal(response.status(),200);await route.abort('failed');}else await route.continue();});
   }
   const head=page.waitForResponse(r=>r.request().method()==='HEAD'&&r.url().includes('/content'));await page.locator('#detail-photo-next').click();assert.equal((await head).status(),mode==='local-interruption'?200:503);assert.equal(await page.locator('#detail-photo-counter').innerText(),'2 of 8');}
  // Actual local SSE disconnect/reopen, not a render-only replacement.
  const reconnect=page.waitForResponse(r=>r.url().includes('/events')&&r.status()===200);host.disconnectStreams();await reconnect;
  if(mode==='list'){await page.waitForFunction(()=>document.getElementById('detail-photo-counter')?.textContent==='1 of 8');assert.equal(listCalls,2);}
  else if(mode==='transient'||mode==='local-interruption'){await loaded(page,'#detail-photo');assert.equal(await page.locator('#detail-photo-counter').innerText(),'2 of 8');for(let n=2;n<8;n++){await page.locator('#detail-photo-next').click();await loaded(page,'#detail-photo');assert.equal(await page.locator('#detail-photo-counter').innerText(),`${n+1} of 8`);}}
  else {for(let n=0;n<2;n++){await page.evaluate(()=>{for(const stream of (window as unknown as {r25Streams:EventSource[]}).r25Streams)if(stream.readyState===1)stream.dispatchEvent(new Event('open'));});await new Promise(r=>setTimeout(r,100));}const calls=google.calls.length;for(let n=0;n<5;n++)await page.evaluate(()=>{for(const stream of (window as unknown as {r25Streams:EventSource[]}).r25Streams)if(stream.readyState===1)stream.dispatchEvent(new Event('open'));});await new Promise(r=>setTimeout(r,150));assert.equal(google.calls.length,calls);assert.ok(google.calls.filter(u=>u.includes('/media')||u.includes('googleusercontent')).length<=20);}
  const id=view.restaurant.presentedCandidateIds![0]!,result=await(await page.request.get(`/api/cases/${encodeURIComponent(view.case.caseId)}/candidates/${encodeURIComponent(id)}/photos?scope=gallery`)).json();assert.equal(result.photos.length,8);assert.equal(result.requests.googleDetails,1);if(mode==='transient')assert.equal(result.requests.googleMedia,18);if(mode==='local-interruption')assert.equal(result.requests.googleMedia,16);await capture(page,`round25-m2-390-${mode}-after-reconnect`);
  const root=process.env.PRAXIS_ROUND25_VISUAL_OUTPUT;if(root)await writeFile(join(root,`round25-m2-${mode}.json`),JSON.stringify({statuses,calls:google.calls,result},null,2));
 });
});
