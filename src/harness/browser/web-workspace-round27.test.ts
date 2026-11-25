import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium,type Page} from 'playwright-core';
import type {RestaurantCaseView} from '../../application/agent-workspace.js';
import type {RestaurantReadEvidence} from '../../domains/restaurant/contracts.js';
import type {RestaurantSemanticProposal} from '../../domains/restaurant/semantic-proposal.js';
import {datedWorkspaceRequest, startWorkspaceFixture} from '../workspace-fixture-server.js';
import {questionRowFixture} from '../question-row-fixture.js';

type Host=Awaited<ReturnType<typeof startWorkspaceFixture>>;

for(const output of ['CONFIRM','EMPTY','RAW_MISMATCH','CORRECT'] as const)for(const width of [390,1440])test(`Round27 DATE: ${width} structured date editor ${output} never reads the wrong date`,{timeout:35000},async()=>{
 const seed='Find a table for two in Tokyo on 2026-11-26 at 18:00',edit='Change Thu, Nov 26 to 2026-11-28';
 const semanticMessages:string[]=[];const host=await startWorkspaceFixture({semanticProposal(message):RestaurantSemanticProposal{
  semanticMessages.push(message);
  if(message===seed)return{schemaVersion:'4',facts:[
   {field:'TARGET',operation:'ASSERT',value:{kind:'TARGET',goal:'AVAILABILITY',query:'dinner in Tokyo',selectionScope:'OPEN_ENDED',goalBasis:{type:'BOOKING_WORDING',reason:'User requests a table',quotes:['Find a table']}}},
   {field:'DATE',operation:'ASSERT',value:{kind:'DATE',value:'2026-11-26',raw:'2026-11-26'}},
   {field:'TIME_WINDOW',operation:'ASSERT',value:{kind:'TIME_WINDOW',earliest:'18:00',latest:'18:00',raw:'18:00'}},
   {field:'PARTY_SIZE',operation:'ASSERT',value:{kind:'PARTY_SIZE',value:2}},
   {field:'AREA',operation:'ASSERT',value:{kind:'AREA',query:'Tokyo'}},
  ]};
  assert.equal(message,edit);return{schemaVersion:'4',facts:output==='CONFIRM'?[{field:'DATE',operation:'CONFIRM'}]:output==='EMPTY'?[]:[{field:'DATE',operation:'CORRECT',value:{kind:'DATE',value:output==='RAW_MISMATCH'?'2026-11-27':'2026-11-28',raw:output==='RAW_MISMATCH'?'2026-11-27':'2026-11-28'}}]};
 }});
 host.clock.advance(Date.parse('2026-11-24T10:00:00+09:00')-host.clock.now().valueOf());
 const browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'}),errors:string[]=[];
 await context.route('**/*',route=>new URL(route.request().url()).origin===host.baseUrl?route.continue():route.abort());const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>errors.push(error.message));
 try{
  await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('#message').fill(seed);const created=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/api/cases'));await page.locator('#send').click();const response=await created;assert.equal(response.status(),201);const id=((await response.json()).view as RestaurantCaseView).case.caseId;
  await settled(host,id,1);await page.locator('#candidate-panel').waitFor();const before=host.providerCalls.length,searchBefore=host.searches.length,decisionsBefore=host.requests.filter(r=>r.purpose==='restaurant_agent_decide').length,semanticBefore=semanticMessages.length;assert.ok(before);
  let messagesPosted=0;page.on('request',request=>{if(request.method()==='POST'&&request.url().endsWith('/messages'))messagesPosted++;});
  await page.getByRole('button',{name:'Thu, Nov 26',exact:true}).click();await page.getByLabel('Edit Thu, Nov 26',{exact:true}).fill('2026-11-26');await page.getByRole('button',{name:'Save',exact:true}).click();await page.locator('.condition-editor').waitFor({state:'detached'});assert.equal(messagesPosted,0);assert.equal(semanticMessages.length,semanticBefore);assert.equal(host.providerCalls.length,before);
  await page.getByRole('button',{name:'Thu, Nov 26',exact:true}).click();await page.getByLabel('Edit Thu, Nov 26',{exact:true}).fill('2026-11-28');const posted=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/messages'));await page.getByRole('button',{name:'Save',exact:true}).click();const edited=await posted;
  assert.equal(edited.request().postDataJSON()?.message,edit);assert.equal(edited.status(),200);const view=await settled(host,id,2);const decisionCalls=host.requests.filter(r=>r.purpose==='restaurant_agent_decide').length-decisionsBefore,calls=host.providerCalls.slice(before);console.info(JSON.stringify({mode:'OFFLINE_BROWSER_DATE',output,width,phase:view.case.phase,date:view.restaurant.intentDraft?.date,readHandleIdle:!view.restaurant.sourceReadContext?.handleId,searchCalls:host.searches.length-searchBefore,decisionCalls,availabilityCalls:calls.length,availabilityDates:[...new Set(calls.map(c=>c.date))],semanticMessages,equivalentEditPosts:messagesPosted-1}));
  if(output==='CONFIRM'||output==='EMPTY'){assert.equal(view.case.phase,'NEEDS_INPUT');assert.ok(view.restaurant.clarificationQuestion);assert.equal(calls.length,0);assert.equal(host.searches.length,searchBefore);assert.equal(decisionCalls,0);await page.locator('#messages').waitFor();}
  else{assert.equal(view.case.phase,'PRESENT_RESULTS');assert.equal(view.restaurant.intentDraft?.date,'2026-11-28');assert.ok(calls.length);assert.ok(calls.every(call=>call.date==='2026-11-28'&&call.timeWindow.earliest==='18:00'));await page.getByRole('button',{name:'Sat, Nov 28',exact:true}).waitFor();}
  assert.deepEqual(errors,[]);await capture(page,`round27-date-${width}-structured-${output.toLowerCase()}`);
 }finally{await context.close();await browser.close();await host.close();}
});

const latch=()=>{let release!:()=>void;const promise=new Promise<void>(r=>release=r);return{release,promise};};
async function until(read:()=>Promise<boolean>|boolean){const end=Date.now()+12000;while(!await read()){if(Date.now()>end)throw Error('Round27 boundary timeout');await new Promise(r=>setTimeout(r,10));}}
async function capture(page:Page,name:string){const round29=name.startsWith('round29-'),root=(round29?process.env.PRAXIS_ROUND29_VISUAL_OUTPUT:undefined)??process.env.PRAXIS_ROUND27_VISUAL_OUTPUT;if(root){await mkdir(root,{recursive:true});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:join(root,name+'.png'),animations:'disabled'});const observed=await page.evaluate(async()=>{const path='/assets/workspace/runtime.js';const {state}=await import(path);const [stop,composer,editor]=['#stop','#workspace-composer','.condition-editor'].map(selector=>{const n=document.querySelector(selector);if(!n)return null;const r=n.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right};});return{phase:state.view?.case.phase,effectivePhase:state.deferredView?.view.case.phase??state.view?.case.phase,sending:state.sending??false,researching:state.researching,progressHidden:document.getElementById('progress')!.hidden,emptyHidden:document.getElementById('empty-state')!.hidden,stop,composer,summary:[...document.querySelectorAll('#asked-history summary,#question-result summary')].map(n=>({top:n.getBoundingClientRect().top,sheetTop:document.getElementById('answer-sheet')!.getBoundingClientRect().top,open:(n.parentElement as HTMLDetailsElement).open})),editor};});await writeFile(join(root,name+'.json'),JSON.stringify({sha:(round29?process.env.PRAXIS_ROUND29_SHA:undefined)??process.env.PRAXIS_ROUND27_SHA??'UNFROZEN_DEVELOPMENT',viewport:page.viewportSize(),...observed},null,2)+'\n');}}
async function snapshot(page:Page){const id=(await page.locator('.case-link.active').getAttribute('data-case-id'))!;return(await(await page.request.get('/api/cases/'+encodeURIComponent(id))).json()).view as RestaurantCaseView;}
async function projection(page:Page,view:RestaurantCaseView){await page.evaluate(async view=>{const path='/assets/workspace/transport.js';const {closeStream,accept}=await import(path);closeStream();accept(view);},view);}
async function settled(host:Host,id:string,assistantCount=0){await until(async()=>{const view=await host.application.getCase('workspace-user',id);return !view.restaurant.progress.active&&!view.restaurant.sourceReadContext?.handleId&&view.conversation.messages.filter(message=>message.role==='ASSISTANT').length>=assistantCount;});return host.application.getCase('workspace-user',id);}
async function journey(width:number,options:Parameters<typeof startWorkspaceFixture>[0],ready:'card'|'empty'|'running',run:(page:Page,host:Host)=>Promise<void>,message=datedWorkspaceRequest('Dinner in Tokyo')){
 const host=await startWorkspaceFixture(options),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'}),errors:string[]=[];
 await context.route('**/*',route=>new URL(route.request().url()).origin===host.baseUrl?route.continue():route.abort());const page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 try{await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#home').waitFor();await page.locator('#message').fill(message);await page.locator('#send').click();
  if(ready==='card')await page.waitForFunction(()=>document.getElementById('card-counter')?.textContent==='1 of 3'&&document.getElementById('progress')?.hidden);
  else await page.locator(ready==='empty'?'#empty-state':'#stop').waitFor();
  await run(page,host);assert.deepEqual(errors,[]);
 }finally{await context.close();await browser.close();await host.close();}
}

for(const width of [390,1440])test(`Round27 UI: UI-1 ${width} pending question Stop shares status row and cancels its active read`,{timeout:35000},async()=>{
 const release=latch();
 await journey(width,{questions:{beforeAnswer:async(_input,signal)=>{await Promise.race([release.promise,new Promise<void>(resolve=>signal.addEventListener('abort',()=>resolve(),{once:true}))]);}}},'card',async(page,host)=>{
  try{await page.locator('#details-button').click();await page.locator('#message').fill('Does this place require a card?');await page.locator('#send').click();await page.locator('#question-stop').waitFor();
   const view=await snapshot(page);assert.ok(view.restaurant.progress.active);assert.ok(!view.restaurant.pageQuestion?.result);
   const metrics=await page.locator('#question-stop').evaluate(button=>{const status=document.querySelector('#asked-pending [role=status]')!,a=status.getBoundingClientRect(),b=button.getBoundingClientRect(),s=getComputedStyle(button);return{statusCenter:(a.top+a.bottom)/2,stopCenter:(b.top+b.bottom)/2,statusRight:a.right,stopLeft:b.left,background:s.backgroundColor,decoration:s.textDecorationLine,height:b.height};});
   assert.ok(Math.abs(metrics.statusCenter-metrics.stopCenter)<1,JSON.stringify(metrics));assert.ok(metrics.stopLeft>metrics.statusRight);assert.equal(metrics.background,'rgba(0, 0, 0, 0)');assert.match(metrics.decoration,/underline/);assert.ok(metrics.height>=32);await capture(page,`round27-ui1-${width}-pending-stop`);
   const response=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith('/run'));await page.locator('#question-stop').click();const stopped=await response;assert.equal(stopped.status(),200);const payload=await stopped.json();assert.equal(payload.view.restaurant.progress.active,false);assert.equal(JSON.parse(stopped.request().postData()!).handleId,view.restaurant.sourceReadContext?.handleId);assert.equal(payload.view.restaurant.pageQuestion.result.reason,'CANCELLED');
  }finally{release.release();}
 });
});

for(const width of [390,1440])test(`Round27 UI: UI-4 ${width} Source history absolute top and sheet relative top stay fixed`,{timeout:35000},async()=>{
 await journey(width,{questions:{beforeAnswer:async()=>{},answer:input=>questionRowFixture(input.candidate,'same-row')}},'card',async(page)=>{
  await page.locator('#details-button').click();await page.locator('#message').fill('Does this restaurant have private rooms?');await page.locator('#send').click();await page.locator('#answer-sheet').waitFor();await page.evaluate(()=>document.fonts.ready);
  const summary=page.locator('#question-result summary');await summary.scrollIntoViewIfNeeded();const sheetAt=()=>summary.evaluate(n=>({top:n.getBoundingClientRect().top,sheet:document.getElementById('answer-sheet')!.getBoundingClientRect().top,left:n.getBoundingClientRect().left,tap:getComputedStyle(n).getPropertyValue('-webkit-tap-highlight-color')}));
  const before=await sheetAt();await capture(page,`round27-ui4-${width}-sheet-before`);await summary.click();const after=await sheetAt();assert.equal(after.top-after.sheet,before.top-before.sheet);assert.equal(after.left,before.left);assert.equal(after.tap,'rgba(0, 0, 0, 0)');await capture(page,`round27-ui4-${width}-sheet-after`);
  assert.deepEqual(await page.locator('#question-result blockquote').allTextContents(),['Private rooms: Available','For 2 people or more.']);await page.locator('#answer-close').click();
  const history=page.locator('#asked-history #asked-result summary');await history.scrollIntoViewIfNeeded();const coordinates=()=>history.evaluate(n=>{const r=n.getBoundingClientRect();return {top:r.top,left:r.left};});const first=await coordinates();await capture(page,`round27-ui4-${width}-history-before`);await history.click();assert.deepEqual(await coordinates(),first);await capture(page,`round27-ui4-${width}-history-after`);
 });
});

for(const width of [390,1440])test(`Round29 UI: ${width} neutral text and compact About category provenance`,{timeout:35000},async()=>{
 await journey(width,{},'card',async(page)=>{
  const view=await snapshot(page),id=view.restaurant.presentedCandidateIds![0]!,url='https://tabelog.com/en/tokyo/A1301/A130101/13123456/';
  const original='Sushi, Seafood, Izakaya (Japanese style tavern)';
  const merchant:RestaurantReadEvidence={evidenceId:'round28-category',kind:'RESTAURANT_FACT',provider:'TABELOG',candidateId:id,sourceEntityId:'13123456',sourceUrl:url,observedAt:'2026-11-21T08:05:00Z',requestFingerprint:'fixture',claims:{restaurantTypeFacts:['Izakaya']},sourceFieldQuotes:[{field:'CATEGORY',quote:original,sourceUrl:url}]};
  view.restaurant.readEvidence.push(merchant);view.restaurant.currentFactEvidence=[merchant];
  const condition={criterionRef:'izakaya',text:'Izakaya',polarity:'POSITIVE' as const,strength:'SOFT' as const,status:'MET' as const,explanation:'Fixture source category',evidenceIds:[merchant.evidenceId],sources:[{field:'CATEGORY' as const,quote:original,sourceUrl:url,evidenceId:merchant.evidenceId}]};
  view.restaurant.conditionStates={[id]:[condition]};view.restaurant.shortlistCandidateIds=[id];view.case.taskVersion++;
  await projection(page,view);
  const color=await page.locator('#delivery-conditions .condition-status').evaluate(n=>{const css=getComputedStyle(n);return{color:css.color,weight:css.fontWeight,bg:css.backgroundColor};});
  assert.deepEqual(color,{color:'rgb(95, 98, 117)',weight:'500',bg:'rgba(0, 0, 0, 0)'});
  assert.equal(await page.locator('#details-button').evaluate(n=>getComputedStyle(n).color),'rgb(21, 23, 43)');
  assert.equal(await page.locator('#bookmark svg').evaluate(n=>getComputedStyle(n).fill),'rgb(61, 90, 254)');
  await capture(page,`round28-${width}-neutral-card`);
  await page.locator('#details-button').click();
  const content=page.locator('#details-content');
  assert.match(await content.innerText(),/Izakaya\s+Confirmed/);
  assert.equal(await content.locator('.about-categories, details').count(),0);
  assert.doesNotMatch(await content.textContent()??'',/Sushi, Seafood/);
  assert.equal(await content.locator('.citation-footer').innerText(),'Tabelog ↗ · Checked Nov 21');
  assert.equal(await content.locator('a').evaluate(n=>getComputedStyle(n).color),'rgb(95, 98, 117)');
  await capture(page,`round29-${width}-about-category-condition`);
  const steak={...merchant,evidenceId:'steak',claims:{restaurantTypeFacts:['Steak']},sourceFieldQuotes:[{field:'CATEGORY' as const,quote:'Steak',sourceUrl:url}]};
  view.restaurant.currentFactEvidence=[steak];view.restaurant.readEvidence.push(steak);
  view.restaurant.conditionStates[id]=[{...condition,text:'Quiet',sources:[{field:'SOURCE_TEXT',quote:'Quiet',sourceUrl:url,evidenceId:steak.evidenceId}],evidenceIds:[steak.evidenceId]}];
  view.case.taskVersion++;await projection(page,view);
  assert.equal(await content.locator('summary').count(),0);
  assert.equal(await content.locator('.citation-footer').innerText(),'Tabelog ↗ · Checked Nov 21');
  assert.equal(await page.locator('.about-categories').count(),0);
  await capture(page,`round28-${width}-about-footer-only`);
 });
});

for(const width of [390,1440])test(`Round27 UI: UI-3 ${width} pure facts hide refresh; recommendation slots and availability keep it`,{timeout:35000},async()=>{
 await journey(width,{multiSlot:true},'card',async(page,host)=>{
  const original=await snapshot(page),view=structuredClone(original);assert.ok(view.restaurant.intentDraft?.target);view.restaurant.intentDraft.target.goal='RECOMMENDATION';view.restaurant.availability={};view.restaurant.availabilityChecks={};view.restaurant.readStatus.canRetry=false;view.case.taskVersion++;
  await projection(page,view);await page.locator('#details-button').click();assert.equal(await page.locator('#refresh').isVisible(),false);await capture(page,`round27-ui3-${width}-pure-facts`);
  view.restaurant.availability=structuredClone(original.restaurant.availability);view.case.taskVersion++;await projection(page,view);assert.equal(await page.locator('#refresh').isVisible(),true);assert.equal(await page.locator('#refresh').innerText(),'Refresh availability');
  // Restore actual authority before the real availability-refresh POST.
  await page.evaluate(async view=>{const path='/assets/workspace/runtime.js';const {state}=await import(path);state.view=null;const transport='/assets/workspace/transport.js';const {accept,openStream}=await import(transport);accept(view);openStream(view.case.caseId,state.nav);},original);
  const before=host.providerCalls.length,response=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/refresh'));await page.locator('#refresh').click();assert.equal((await response).status(),200);await settled(host,original.case.caseId);await page.waitForFunction(()=>!document.getElementById('refresh')!.hidden&&document.getElementById('refresh')!.textContent==='Refresh availability');assert.ok(host.providerCalls.length>before);await capture(page,`round27-ui3-${width}-availability-refreshed`);
 });
});

for(const operation of ['retry','more','capsule-save','capsule-remove'] as const)test(`Round27 UI: UI-5 390 delayed ${operation} hides empty immediately and failure restores controls`,{timeout:35000},async()=>{
 await journey(390,operation==='more'?{continuation:'search'}:{outcome:operation==='retry'?'all-sources-failed':'empty'},'empty',async(page)=>{
  let release=latch(),parked=false;
  try{
   if(operation==='capsule-remove'){const view=await snapshot(page);view.restaurant.intentDraft!.criteria.push({text:'quiet',strength:'SOFT',polarity:'POSITIVE'});view.case.taskVersion++;await projection(page,view);}
   const endpoint=operation==='retry'?'/refresh':operation==='more'?'/another-batch':'/messages';
   await page.route('**/api/**',async route=>{if(route.request().method()==='POST'&&route.request().url().endsWith(endpoint)){parked=true;await release.promise;await route.fulfill({status:500,json:{error:'Expected Round27 delayed request failure'}});}else await route.continue();});
   const original={adjust:await page.locator('#empty-adjust').isVisible(),more:await page.locator('#empty-more').isVisible(),retry:await page.locator('#empty-retry').isVisible()};
   if(operation==='retry')await page.locator('#empty-retry').click();else if(operation==='more')await page.locator('#empty-more').click();else if(operation==='capsule-save'){await page.getByRole('button',{name:'2 guests',exact:true}).click();await page.locator('.condition-editor input').fill('3');await page.getByRole('button',{name:'Save',exact:true}).click();}else{await page.getByRole('button',{name:'quiet',exact:true}).click();await page.getByRole('button',{name:'Remove quiet',exact:true}).click();}
   await until(()=>parked);assert.equal(await page.locator('#empty-state').isVisible(),false);if(operation.startsWith('capsule'))assert.equal(await page.evaluate(async()=>{const path='/assets/workspace/runtime.js';return(await import(path)).state.sending;}),false);await capture(page,`round27-ui5-390-${operation}-inflight`);
   release.release();await page.locator('#error').waitFor();await page.locator('#empty-state').waitFor();for(const [key,visible]of Object.entries(original)){assert.equal(await page.locator('#empty-'+key).isVisible(),visible,key);if(visible)assert.equal(await page.locator('#empty-'+key).isDisabled(),false,key);}if(operation.startsWith('capsule'))assert.equal(await page.locator('.condition-editor .editor-save').isDisabled(),false);await capture(page,`round27-ui5-390-${operation}-failed-restored`);
  }finally{release.release();}
 });
});

test('Round27 UI: UI-5 390 SSE-first deferred running snapshot removes prior empty card before HTTP', {timeout:35000},async()=>{
 const search=latch(),http=latch();let hold=false,parked=false;
 await journey(390,{continuation:'search',beforeSearch:async signal=>{if(hold)await Promise.race([search.promise,new Promise<void>(r=>signal.addEventListener('abort',()=>r(),{once:true}))]);}},'empty',async(page)=>{
  try{hold=true;await page.route('**/api/cases/*/another-batch',async route=>{const response=await route.fetch();parked=true;await http.promise;await route.fulfill({response});});await page.locator('#empty-more').click();await until(()=>parked);
   await page.waitForFunction(async()=>{const path='/assets/workspace/runtime.js';const {state}=await import(path);return state.deferredView?.view.restaurant.progress.active;});assert.equal(await page.locator('#progress').isVisible(),true);assert.equal(await page.locator('#empty-state').isVisible(),false);await capture(page,'round27-ui5-390-sse-first-deferred');
  }finally{search.release();http.release();}
 });
});

test('Round27 UI: UI-6 390 keyboard exposes Stop and cancels the paused current read with stopped true',{timeout:35000},async()=>{
 const gate=latch();let entered=false;
 await journey(390,{beforeSearch:async signal=>{entered=true;await Promise.race([gate.promise,new Promise<void>(resolve=>signal.addEventListener('abort',()=>resolve(),{once:true}))]);}},'running',async(page)=>{
  try{await until(()=>entered);const view=await snapshot(page);assert.ok(view.restaurant.progress.active);assert.ok(view.restaurant.sourceReadContext?.handleId);await page.locator('#message').fill('Keep this unsent draft');await page.locator('#message').focus();await page.evaluate(()=>{Object.defineProperty(window.visualViewport!,'height',{configurable:true,value:360});window.visualViewport!.dispatchEvent(new Event('resize'));});await page.clock.runFor(100);
   const rect=await page.locator('#stop').evaluate(n=>{const r=n.getBoundingClientRect();return{top:r.top,bottom:r.bottom,height:window.visualViewport!.height,composer:document.getElementById('workspace-composer')!.getBoundingClientRect().top};});assert.ok(rect.top>=0&&rect.bottom<=rect.height&&rect.bottom<rect.composer,JSON.stringify(rect));await capture(page,'round27-ui6-390-keyboard-stop');
   const response=page.waitForResponse(r=>r.request().method()==='DELETE'&&r.url().endsWith('/run'));await page.locator('#stop').click();const stopped=await response;assert.equal(stopped.status(),200);const payload=await stopped.json();assert.equal(payload.view.case.stopped,true);assert.equal(JSON.parse(stopped.request().postData()!).handleId,view.restaurant.sourceReadContext?.handleId);assert.equal(payload.view.restaurant.progress.stopped,true);assert.equal(payload.view.restaurant.progress.active,false);assert.equal(await page.locator('#message').inputValue(),'Keep this unsent draft');
  }finally{gate.release();}
 });
});

for (const width of [390, 1440]) test('Round29 alert '+width+': Stop clears a prior failed Stop and preserves the draft',{timeout:35000},async()=>{
 const gate=latch();
 await journey(width,{beforeSearch:async signal=>{
  await Promise.race([gate.promise,new Promise<void>(resolve=>signal.addEventListener('abort',()=>resolve(),{once:true}))]);
 }},'running',async(page)=>{
  try{
   const rejected='Could not stop this read. Try again.';
   let attempts=0;
   await page.route('**/api/cases/*/run',route=>{
    if(route.request().method()!=='DELETE'||++attempts!==1)return route.continue();
    return route.fulfill({status:503,json:{error:rejected}});
   });
   const stop=page.locator('#stop'), error=page.locator('#error');
   await page.locator('#message').fill('Keep my draft');
   await stop.click();
   await error.getByText(rejected,{exact:true}).waitFor();
   await stop.click();
   await page.getByText('Search stopped.',{exact:true}).waitFor();
   assert.equal(attempts,2);
   assert.equal(await error.isVisible(),false,'the successful Stop removes the prior error');
   assert.equal(await error.textContent(),'');
   assert.equal(await page.locator('#message').inputValue(),'Keep my draft');
   // Expose the alert alongside the actual stopped message to measure the CSS state.
   const layout=await error.evaluate(node=>{
    const alert=node as HTMLElement, message=document.getElementById('messages')!;
    alert.hidden=false;
    alert.textContent='A later request could not be completed.';
    const a=alert.getBoundingClientRect(),m=message.getBoundingClientRect(),css=getComputedStyle(alert);
    return {left:a.left,right:a.right,messageLeft:m.left,messageRight:m.right,gap:a.top-m.bottom,
     margin:css.margin,background:css.backgroundColor,padding:css.padding,radius:css.borderRadius,color:css.color,fontSize:css.fontSize};
   });
   assert.deepEqual([layout.left,layout.right],[layout.messageLeft,layout.messageRight]);
   assert.equal(layout.gap,8);
   assert.deepEqual([layout.margin,layout.background,layout.padding,layout.radius,layout.color,layout.fontSize],
    ['8px 0px 0px','rgb(245, 246, 249)','10px 14px','12px','rgb(95, 98, 117)','13px']);
   await error.scrollIntoViewIfNeeded();
   await capture(page,'round29-'+width+'-alert-layout');
   await error.evaluate(node=>{node.textContent='';(node as HTMLElement).hidden=true;});
   await capture(page,'round29-'+width+'-stop-cleared');
  }finally{gate.release();}
 });
});

test('Round29 alert: leaving a stale Handoff without cards does not show a stale slot notice',{timeout:35000},async()=>{
 await journey(390,{multiSlot:true},'card',async(page)=>{
  await page.locator('#choose').click();
  await page.locator('#handoff').waitFor();
  const next=await snapshot(page);
  next.case.taskVersion++;
  next.case.phase='SEARCHING';
  next.restaurant.requirementRevision++;
  next.restaurant.progress={active:true,stopped:false,stage:'FINDING'};
  next.restaurant.readStatus.kind='PENDING';
  next.restaurant.presentedCandidateIds=[];
  next.restaurant.readyCandidateIds=[];
  next.restaurant.candidates=[];
  await projection(page,next);
  assert.equal(await page.locator('#handoff').isVisible(),false);
  assert.equal(await page.locator('#candidate-panel').isVisible(),false);
  assert.equal(await page.locator('#error').isVisible(),false);
  await capture(page,'round29-390-handoff-no-card');
 });
});

test('Round27 UI: UI-6 390 time and removable editors flow full-width without overlapping neighbors',{timeout:35000},async()=>{
 const semanticProposal=(message:string):RestaurantSemanticProposal|undefined=>message===datedWorkspaceRequest('Dinner in Tokyo')?{schemaVersion:'4',facts:[
  {field:'TARGET',operation:'ASSERT',value:{kind:'TARGET',goal:'AVAILABILITY',query:'dinner in Tokyo',selectionScope:'OPEN_ENDED',goalBasis:{type:'JUDGMENT',reason:'Fixture',quotes:[message]}}},
  {field:'DATE',operation:'ASSERT',value:{kind:'DATE',value:'2026-11-02',raw:'2026-11-02'}},{field:'TIME_WINDOW',operation:'ASSERT',value:{kind:'TIME_WINDOW',earliest:'19:00',latest:'19:30',raw:'19:00-19:30'}},{field:'PARTY_SIZE',operation:'ASSERT',value:{kind:'PARTY_SIZE',value:2}},{field:'AREA',operation:'ASSERT',value:{kind:'AREA',query:'Tokyo'}},{field:'CRITERION',operation:'ASSERT',value:{kind:'CRITERION',text:'quiet',polarity:'POSITIVE',strength:'SOFT'}},
 ]}:undefined;
 await journey(390,{semanticProposal},'card',async(page)=>{
  const check=async(name:string)=>{const metrics=await page.locator('.condition-editor').evaluate(form=>{const r=form.getBoundingClientRect(),neighbors=[...document.querySelectorAll('#request-conditions>button')].map(n=>n.getBoundingClientRect());return{left:r.left,right:r.right,position:getComputedStyle(form).position,inlineWidth:(form.parentElement as HTMLElement).style.width,inlineHeight:(form.parentElement as HTMLElement).style.height,overlap:neighbors.some(n=>Math.min(n.right,r.right)>Math.max(n.left,r.left)&&Math.min(n.bottom,r.bottom)>Math.max(n.top,r.top)),controls:[...form.querySelectorAll('input,button')].map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width};})};});assert.equal(metrics.position,'static');assert.equal(metrics.inlineWidth,'');assert.equal(metrics.inlineHeight,'');assert.ok(!metrics.overlap);assert.ok(metrics.left>=0&&metrics.right<=390);assert.ok(metrics.controls.every(r=>r.left>=0&&r.right<=390&&r.width>0),JSON.stringify(metrics));await capture(page,'round27-ui6-390-'+name);};
  await page.getByRole('button',{name:'19:00–19:30',exact:true}).click();await check('time-editor');await page.locator('.condition-editor input[type=time]').last().fill('20:00');const save=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/messages'));await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await save).status(),200);await page.getByRole('button',{name:'19:00–20:00',exact:true}).waitFor();await page.waitForFunction(()=>document.getElementById('progress')!.hidden);
  await page.getByRole('button',{name:'quiet',exact:true}).click();await check('removable-editor');await page.getByRole('button',{name:'Cancel condition change',exact:true}).click();await page.getByRole('button',{name:'quiet',exact:true}).click();const remove=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/messages'));await page.getByRole('button',{name:'Remove quiet',exact:true}).click();assert.equal((await remove).status(),200);await page.getByRole('button',{name:'quiet',exact:true}).waitFor({state:'hidden'});assert.ok(!(await snapshot(page)).restaurant.intentDraft?.criteria.some(c=>c.text==='quiet'));
 });
});

test('Round28 UI: one mobile tap switches from the date capsule to each neighboring editor',{timeout:35000},async()=>{
 const seed='Find a table for two in Shibuya on 2026-11-28 at 18:00 somewhere quiet';
 const semanticProposal=(message:string):RestaurantSemanticProposal|undefined=>message===seed?{schemaVersion:'4',facts:[
  {field:'TARGET',operation:'ASSERT',value:{kind:'TARGET',goal:'AVAILABILITY',query:'dinner in Shibuya',selectionScope:'OPEN_ENDED',goalBasis:{type:'BOOKING_WORDING',reason:'User requests a table',quotes:['Find a table']}}},
  {field:'DATE',operation:'ASSERT',value:{kind:'DATE',value:'2026-11-28',raw:'2026-11-28'}},
  {field:'TIME_WINDOW',operation:'ASSERT',value:{kind:'TIME_WINDOW',earliest:'18:00',latest:'18:00',raw:'18:00'}},
  {field:'PARTY_SIZE',operation:'ASSERT',value:{kind:'PARTY_SIZE',value:2}},
  {field:'AREA',operation:'ASSERT',value:{kind:'AREA',query:'Shibuya'}},
  {field:'CRITERION',operation:'ASSERT',value:{kind:'CRITERION',text:'quiet',polarity:'POSITIVE',strength:'SOFT'}},
 ]}:undefined;
 await journey(390,{semanticProposal},'card',async(page,host)=>{
  const capsule=(name:string)=>page.locator('#request-conditions').getByRole('button',{name,exact:true});
  const editor=page.locator('.condition-editor');
  const messageResponse=()=>page.waitForResponse(response=>response.request().method()==='POST'&&response.url().endsWith('/messages'));
  for(const name of ['Shibuya','18:00','2 guests','quiet']){
   await capsule('Sat, Nov 28').tap();
   assert.equal(await page.getByLabel('Edit Sat, Nov 28',{exact:true}).isVisible(),true);
   const layout=await editor.evaluate(form=>{
    const strip=document.getElementById('request-conditions')!;
    return {top:form.getBoundingClientRect().top,buttonBottom:Math.max(...Array.from(strip.querySelectorAll(':scope > button'),n=>n.getBoundingClientRect().bottom)),scrollLeft:strip.scrollLeft,snap:getComputedStyle(strip).scrollSnapType};
   });
   assert.equal(layout.snap,'none');
   assert.equal(layout.scrollLeft,0);
   assert.ok(layout.top>=layout.buttonBottom);
   await capsule(name).tap();
   assert.equal(await page.getByLabel('Edit '+name,{exact:true}).isVisible(),true);
   await capture(page,'round28-390-tap-'+name.replaceAll(/[^a-z0-9]/gi,'-').toLowerCase());
   if(name==='18:00'){
    await page.getByLabel('Edit 18:00',{exact:true}).fill('19:00');
    await page.getByLabel('End time',{exact:true}).fill('19:00');
    const response=messageResponse();await page.getByRole('button',{name:'Save',exact:true}).tap();assert.equal((await response).status(),200);
    const id=(await snapshot(page)).case.caseId;await settled(host,id,2);await capsule('19:00').waitFor();
   }else if(name==='quiet'){
    const response=messageResponse();await page.getByRole('button',{name:'Remove quiet',exact:true}).tap();assert.equal((await response).status(),200);
    const id=(await snapshot(page)).case.caseId;const final=await settled(host,id,3);assert.ok(!final.restaurant.intentDraft?.criteria.some(c=>c.text==='quiet'));
    await capsule('quiet').waitFor({state:'hidden'});
   }else{
    await page.getByRole('button',{name:'Cancel condition change',exact:true}).tap();
    await capsule(name).waitFor();
   }
   await editor.waitFor({state:'detached'});
  }
 },seed);
});

test('Round28 UI: failed revision renders MODEL_FAILURE before requesting the scroll',{timeout:35000},async()=>{
 await journey(390,{semanticFailureMessage:'Unreadable revision'},'card',async(page)=>{
  await page.evaluate(()=>{
   const error=document.getElementById('understanding-error')!;
   const scroll=error.scrollIntoView.bind(error);
   error.scrollIntoView=(options)=>{error.dataset.visibleAtScroll=String(!error.hidden&&error.getBoundingClientRect().height>0);scroll(options);};
  });
  await page.locator('#message').fill('Unreadable revision');await page.locator('#send').click();
  await page.locator('#understanding-error').waitFor();
  assert.equal(await page.locator('#understanding-error').getAttribute('data-visible-at-scroll'),'true');
  assert.equal(await page.locator('#message').inputValue(),'Unreadable revision');
  await capture(page,'round28-390-model-failure-visible-before-scroll');
 });
});
