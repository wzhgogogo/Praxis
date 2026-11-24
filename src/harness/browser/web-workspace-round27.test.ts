import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium,type Page} from 'playwright-core';
import type {RestaurantCaseView} from '../../application/agent-workspace.js';
import type {RestaurantReadEvidence} from '../../domains/restaurant/contracts.js';
import type {RestaurantSemanticProposal} from '../../domains/restaurant/semantic-proposal.js';
import {assessRestaurantConditions} from '../../domains/restaurant/condition-states.js';
import {startWorkspaceFixture} from '../workspace-fixture-server.js';
import {questionRowFixture} from '../question-row-fixture.js';

type Host=Awaited<ReturnType<typeof startWorkspaceFixture>>;
const latch=()=>{let release!:()=>void;const promise=new Promise<void>(r=>release=r);return{release,promise};};
async function until(read:()=>Promise<boolean>|boolean){const end=Date.now()+12000;while(!await read()){if(Date.now()>end)throw Error('Round27 boundary timeout');await new Promise(r=>setTimeout(r,10));}}
async function capture(page:Page,name:string){const root=process.env.PRAXIS_ROUND27_VISUAL_OUTPUT;if(root){await mkdir(root,{recursive:true});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:join(root,name+'.png'),animations:'disabled'});const observed=await page.evaluate(async()=>{const path='/assets/workspace/runtime.js';const {state}=await import(path);const [stop,composer,editor]=['#stop','#workspace-composer','.condition-editor'].map(selector=>{const n=document.querySelector(selector);if(!n)return null;const r=n.getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right};});return{phase:state.view?.case.phase,effectivePhase:state.deferredView?.view.case.phase??state.view?.case.phase,sending:state.sending??false,researching:state.researching,progressHidden:document.getElementById('progress')!.hidden,emptyHidden:document.getElementById('empty-state')!.hidden,stop,composer,summary:[...document.querySelectorAll('#asked-history summary,#question-result summary')].map(n=>({top:n.getBoundingClientRect().top,sheetTop:document.getElementById('answer-sheet')!.getBoundingClientRect().top,open:(n.parentElement as HTMLDetailsElement).open})),editor};});await writeFile(join(root,name+'.json'),JSON.stringify({sha:process.env.PRAXIS_ROUND27_SHA??'UNFROZEN_DEVELOPMENT',viewport:page.viewportSize(),...observed},null,2)+'\n');}}
async function snapshot(page:Page){const id=(await page.locator('.case-link.active').getAttribute('data-case-id'))!;return(await(await page.request.get('/api/cases/'+encodeURIComponent(id))).json()).view as RestaurantCaseView;}
async function projection(page:Page,view:RestaurantCaseView){await page.evaluate(async view=>{const path='/assets/workspace/transport.js';const {closeStream,accept}=await import(path);closeStream();accept(view);},view);}
async function settled(host:Host,id:string){await until(async()=>!(await host.application.getCase('workspace-user',id)).restaurant.progress.active);return host.application.getCase('workspace-user',id);}
async function journey(width:number,options:Parameters<typeof startWorkspaceFixture>[0],ready:'card'|'empty'|'running',run:(page:Page,host:Host)=>Promise<void>){
 const host=await startWorkspaceFixture(options),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'}),page=await context.newPage(),errors:string[]=[];
 await context.route('**/*',route=>new URL(route.request().url()).origin===host.baseUrl?route.continue():route.abort());page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 try{await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#home').waitFor();await page.locator('#message').fill('Dinner in Tokyo');await page.locator('#send').click();
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
  const summary=page.locator('#question-result summary');await summary.scrollIntoViewIfNeeded();const sheetAt=()=>summary.evaluate(n=>({top:n.getBoundingClientRect().top,sheet:document.getElementById('answer-sheet')!.getBoundingClientRect().top,tap:getComputedStyle(n).getPropertyValue('-webkit-tap-highlight-color')}));
  const before=await sheetAt();await capture(page,`round27-ui4-${width}-sheet-before`);await summary.click();const after=await sheetAt();assert.equal(after.top-after.sheet,before.top-before.sheet);assert.equal(after.tap,'rgba(0, 0, 0, 0)');await capture(page,`round27-ui4-${width}-sheet-after`);
  assert.deepEqual(await page.locator('#question-result blockquote').allTextContents(),['Private rooms: Available','For 2 people or more.']);await page.locator('#answer-close').click();
  const history=page.locator('#asked-history #asked-result summary');await history.scrollIntoViewIfNeeded();const first=await history.evaluate(n=>n.getBoundingClientRect().top);await capture(page,`round27-ui4-${width}-history-before`);await history.click();assert.equal(await history.evaluate(n=>n.getBoundingClientRect().top),first);await capture(page,`round27-ui4-${width}-history-after`);
 });
});

for(const width of [390,1440])test(`Round27 UI: UI-2 UI-7 ${width} restrained colors and rendered-category-only deduplication`,{timeout:35000},async()=>{
 await journey(width,{},'card',async(page)=>{
  const view=await snapshot(page),id=view.restaurant.presentedCandidateIds![0]!,url='https://tabelog.com/en/tokyo/A1301/A130101/13123456/';
  const merchant:RestaurantReadEvidence={evidenceId:'round27-category',kind:'RESTAURANT_FACT',provider:'TABELOG',candidateId:id,sourceEntityId:'13123456',sourceUrl:url,observedAt:'2026-11-21T08:05:00Z',requestFingerprint:'round27-fixture',claims:{restaurantTypeFacts:['Steak']},sourceFieldQuotes:[{field:'CATEGORY',quote:'Steak',sourceUrl:url}]};
  view.restaurant.readEvidence.push(merchant);view.restaurant.currentFactEvidence=[merchant];view.restaurant.conditionStates={[id]:assessRestaurantConditions({criteria:[{text:'Steak',polarity:'POSITIVE',strength:'SOFT'}]},[merchant])};view.restaurant.shortlistCandidateIds=[id];view.case.taskVersion++;
  await projection(page,view);const color=await page.locator('#delivery-conditions .condition-status').evaluate(n=>{const s=getComputedStyle(n);return{color:s.color,weight:s.fontWeight,bg:s.backgroundColor};});assert.deepEqual(color,{color:'rgb(54, 75, 138)',weight:'500',bg:'rgba(0, 0, 0, 0)'});assert.equal(await page.locator('#details-button').evaluate(n=>getComputedStyle(n).color),'rgb(21, 23, 43)');assert.equal(await page.locator('#bookmark svg').evaluate(n=>getComputedStyle(n).fill),'rgb(61, 90, 254)');await capture(page,`round27-ui2-${width}-card`);
  await page.locator('#details-button').click();
  // Projection-only UI oracle: keep the quoted category distinct from its condition label.
  view.restaurant.conditionStates[id]![0]!.text='Cuisine preference';view.case.taskVersion++;await projection(page,view);
  assert.equal(await page.locator('#details-content blockquote').count(),1);assert.equal(await page.locator('.about-categories').count(),0);assert.equal(await page.locator('#details-content a').evaluate(n=>getComputedStyle(n).color),'rgb(95, 98, 117)');assert.equal(await page.locator('#details-content blockquote').evaluate(n=>getComputedStyle(n).borderLeftColor),'rgb(61, 90, 254)');await capture(page,`round27-ui7-${width}-same-rendered-category`);
  const google:RestaurantReadEvidence={...merchant,evidenceId:'round27-google-category',provider:'GOOGLE_PLACES',sourceUrl:'https://maps.google.com/?cid=fixture0',claims:{restaurantTypeFacts:['Sushi']},sourceFieldQuotes:[]};view.restaurant.currentFactEvidence=[merchant,google];view.restaurant.readEvidence.push(google);view.case.taskVersion++;await projection(page,view);assert.match(await page.locator('.about-categories').innerText(),/Sushi.*Steak/);await capture(page,`round27-ui7-${width}-extra-google-category`);
  view.restaurant.currentFactEvidence=[merchant];view.restaurant.conditionStates[id]![0]!.text='Steak';view.case.taskVersion++;await projection(page,view);assert.equal(await page.locator('#details-content blockquote').count(),0);assert.equal(await page.locator('.about-categories').innerText(),'Categories: Steak');await capture(page,`round27-ui7-${width}-footer-only-category`);
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

test('Round27 UI: UI-6 390 time and removable editors flow full-width without overlapping neighbors',{timeout:35000},async()=>{
 const semanticProposal=(message:string):RestaurantSemanticProposal|undefined=>message==='Dinner in Tokyo'?{schemaVersion:'4',facts:[
  {field:'TARGET',operation:'ASSERT',value:{kind:'TARGET',goal:'AVAILABILITY',query:'dinner in Tokyo',selectionScope:'OPEN_ENDED',goalBasis:{type:'JUDGMENT',reason:'Fixture',quotes:[message]}}},
  {field:'DATE',operation:'ASSERT',value:{kind:'DATE',value:'2026-11-02',raw:'2026-11-02'}},{field:'TIME_WINDOW',operation:'ASSERT',value:{kind:'TIME_WINDOW',earliest:'19:00',latest:'19:30',raw:'19:00-19:30'}},{field:'PARTY_SIZE',operation:'ASSERT',value:{kind:'PARTY_SIZE',value:2}},{field:'AREA',operation:'ASSERT',value:{kind:'AREA',query:'Tokyo'}},{field:'CRITERION',operation:'ASSERT',value:{kind:'CRITERION',text:'quiet',polarity:'POSITIVE',strength:'SOFT'}},
 ]}:undefined;
 await journey(390,{semanticProposal},'card',async(page)=>{
  const check=async(name:string)=>{const metrics=await page.locator('.condition-editor').evaluate(form=>{const r=form.getBoundingClientRect(),neighbors=[...document.querySelectorAll('#request-conditions>button')].map(n=>n.getBoundingClientRect());return{left:r.left,right:r.right,position:getComputedStyle(form).position,inlineWidth:(form.parentElement as HTMLElement).style.width,inlineHeight:(form.parentElement as HTMLElement).style.height,overlap:neighbors.some(n=>Math.min(n.right,r.right)>Math.max(n.left,r.left)&&Math.min(n.bottom,r.bottom)>Math.max(n.top,r.top)),controls:[...form.querySelectorAll('input,button')].map(n=>{const r=n.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width};})};});assert.equal(metrics.position,'static');assert.equal(metrics.inlineWidth,'');assert.equal(metrics.inlineHeight,'');assert.ok(!metrics.overlap);assert.ok(metrics.left>=0&&metrics.right<=390);assert.ok(metrics.controls.every(r=>r.left>=0&&r.right<=390&&r.width>0),JSON.stringify(metrics));await capture(page,'round27-ui6-390-'+name);};
  await page.getByRole('button',{name:'19:00–19:30',exact:true}).click();await check('time-editor');await page.locator('.condition-editor input[type=time]').last().fill('20:00');const save=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/messages'));await page.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await save).status(),200);await page.getByRole('button',{name:'19:00–20:00',exact:true}).waitFor();await page.waitForFunction(()=>document.getElementById('progress')!.hidden);
  await page.getByRole('button',{name:'quiet',exact:true}).click();await check('removable-editor');await page.getByRole('button',{name:'Cancel condition change',exact:true}).click();await page.getByRole('button',{name:'quiet',exact:true}).click();const remove=page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/messages'));await page.getByRole('button',{name:'Remove quiet',exact:true}).click();assert.equal((await remove).status(),200);await page.getByRole('button',{name:'quiet',exact:true}).waitFor({state:'hidden'});assert.ok(!(await snapshot(page)).restaurant.intentDraft?.criteria.some(c=>c.text==='quiet'));
 });
});
