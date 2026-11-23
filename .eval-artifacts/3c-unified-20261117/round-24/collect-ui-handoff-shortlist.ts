import {assert,test,collect} from './observation-recorder.ts';

import {readFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {once} from 'node:events';
import {chromium,type Page} from 'playwright-core';
import type {ModelGateway,ModelResponse} from '../../../src/core/model/contracts.js';
import {bookingTermsComposition} from '../../../src/application/fixtures/booking-terms-composition.js';
import {PilotSessionService} from '../../../src/application/persistent-restaurant-agent.js';
import {createLocalWebServer} from '../../../src/server/local-web-server.js';
import {startWorkspaceFixture} from '../../../src/harness/workspace-fixture-server.js';

const latch=()=>{let release!:()=>void;const promise=new Promise<void>(r=>{release=r;});return{release,promise};};
async function until(read:()=>Promise<boolean>|boolean){const deadline=Date.now()+12000;while(!await read()){if(Date.now()>deadline)throw Error('Round24 Fixture boundary timeout');await new Promise(r=>setTimeout(r,15));}}
async function capture(page:Page,name:string){const root=process.env.PRAXIS_ROUND24_VISUAL_OUTPUT??process.env.PRAXIS_ROUND8_VISUAL_OUTPUT??process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT;if(!root)return;await mkdir(root,{recursive:true});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.locator('body').evaluate(n=>({html:n.innerHTML})).then(async data=>{const {writeFile}=await import('node:fs/promises');await writeFile(join(process.env.PRAXIS_ROUND24_OBSERVATIONS!,name+'.dom.json'),JSON.stringify(data));});await page.screenshot({path:join(root,name+'.png'),animations:'disabled'});}
async function login(page:Page,baseUrl:string,clock:{now():Date}){await page.clock.install({time:clock.now()});await page.goto(baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#app').waitFor();}
async function select(page:Page,id:string,width:number){if(width<960&&!(await page.locator('#plans').getAttribute('class')??'').split(/\s+/).includes('open'))await page.locator('#menu').click();await page.locator('.case-link[data-case-id="'+id+'"]').click();await page.waitForFunction(id=>document.querySelector('.case-link.active')?.getAttribute('data-case-id')===id,id);}
async function termsHost(){
 const {response}=JSON.parse(await readFile(new URL('../../../src/application/fixtures/user-booking-selection/P1-0-8.json',import.meta.url),'utf8')) as {response:ModelResponse};
 const f=await bookingTermsComposition({selectionReplay:{response}});try{
 const initial=await f.initial(),selected=await f.select();assert.ok(selected.restaurant.selectedCandidateId);assert.equal(selected.restaurant.bookingHandoffs![0]!.terms.length,2);
 const provider=(f.counted as unknown as {delegate:ModelGateway}).delegate,complete=provider.complete.bind(provider);
 provider.complete=async request=>{const response=await complete(request);if(request.purpose==='restaurant_semantic_interpret'&&request.messages.some(m=>m.role==='user'&&m.content.includes('Change 19:00 to')))return{...response,outputText:JSON.stringify({schemaVersion:'4',facts:[{field:'TIME_WINDOW',operation:'CORRECT',value:{kind:'TIME_WINDOW',earliest:'19:00',latest:'19:30',raw:'19:00–19:30'}}]})};return response;};
 const server=createLocalWebServer({application:f.app,sessions:new PilotSessionService(f.app.store,[{accessToken:'workspace-fixture',id:'terms-user',displayName:'Fixture'}],f.clock),readAssembly:f.assembly});server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert.ok(address&&typeof address!=='string');
 return{f,id:initial.case.caseId,selected:selected.restaurant.selectedCandidateId,clock:f.clock,baseUrl:'http://127.0.0.1:'+address.port,async close(){const closed=once(server,'close');server.close();server.closeAllConnections();await closed;await f.close();}};
 }catch(error){await f.close();throw error;}
}

for(const width of [390,1440])for(const pending of [false,true])test(`Round24 UI: B1 ${width} pending=${pending} condition edit retains selected outlet and two handoff terms`,{timeout:45000},async()=>{
 const host=await termsHost(),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'}),a=await context.newPage(),b=await context.newPage(),release=latch();
 await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());const append=host.f.app.store.appendMessage.bind(host.f.app.store);let question:Promise<import('playwright-core').Response>|undefined,parked=false;
 try{a.setDefaultTimeout(10000);b.setDefaultTimeout(10000);await login(a,host.baseUrl,host.clock);await select(a,host.id,width);await b.clock.install({time:host.clock.now()});await b.goto(host.baseUrl);await b.locator('#app').waitFor();await select(b,host.id,width);
  if(pending){host.f.app.store.appendMessage=async input=>{if(input.content==='Does this restaurant require a credit card?'){parked=true;await release.promise;}return append(input);};await a.locator('#details-button').click();question=a.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/questions'));await a.locator('#message').fill('Does this restaurant require a credit card?');await a.locator('#send').click();await until(()=>parked);}
  await b.locator('#request-conditions').getByRole('button',{name:'19:00',exact:true}).click();await b.locator('#request-conditions input[type=time]').nth(1).fill('19:30');const edit=b.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/messages'));await b.getByRole('button',{name:'Save',exact:true}).click();assert.equal((await edit).status(),200);release.release();if(question)assert.equal((await question).status(),200);
  await until(async()=>{const v=await host.f.project();return v.case.phase==='PRESENT_RESULTS'&&!v.restaurant.progress.active&&v.restaurant.intentDraft?.timeWindow?.latest==='19:30';});await b.reload();await b.locator('#candidate-panel').waitFor();const v=await host.f.project();assert.equal(v.restaurant.selectedCandidateId,host.selected);assert.equal(v.restaurant.bookingHandoffs![0]!.terms.length,2);
  await b.getByRole('button',{name:/^Time 19:00 on /}).click();await b.locator('#choose').click();await b.locator('#handoff').waitFor();const text=await b.locator('#handoff-terms').innerText();assert.match(text,/100%/);assert.match(text,/Card required/);await capture(b,`round24-b1-${width}-${pending?'pending':'control'}-terms`);
 }finally{release.release();await question?.catch(()=>{});host.f.app.store.appendMessage=append;await context.close();await browser.close();await host.close();}
});

for(const width of [390,1440])for(const changes of [1,2])test(`Round24 UI: B3 ${width} answer survives ${changes} concurrent shortlist changes after reload`,{timeout:45000},async()=>{
 const host=await startWorkspaceFixture({questions:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'}),a=await context.newPage(),b=await context.newPage(),release=latch();
 await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());type Runtime=typeof host.application['runtime'];const runtime=(host.application as unknown as {runtime:Runtime}).runtime,dispatch=runtime.dispatch.bind(runtime);let requestId='',question:Promise<import('playwright-core').Response>|undefined;
 try{a.setDefaultTimeout(10000);b.setDefaultTimeout(10000);await login(a,host.baseUrl,host.clock);await a.locator('#message').fill('Dinner in Tokyo');await a.locator('#send').click();await a.waitForFunction(()=>document.getElementById('card-counter')?.textContent==='1 of 3'&&document.getElementById('progress')?.hidden);const id=(await a.locator('.case-link.active').getAttribute('data-case-id'))!;
  await b.clock.install({time:host.clock.now()});await b.goto(host.baseUrl);await b.locator('#app').waitFor();await select(b,id,width);
  runtime.dispatch=async(envelope,version)=>{if(!requestId&&envelope.event.type==='PAGE_QUESTION_COMPLETED'&&envelope.event.result.status==='ANSWERED'){requestId=envelope.event.requestId;await release.promise;}return dispatch(envelope,version);};await a.locator('#details-button').click();question=a.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/questions'));await a.locator('#message').fill('Does this place require a card?');await a.locator('#send').click();await until(()=>!!requestId);
  for(let i=0;i<changes;i++){await b.reload();await b.locator('#candidate-panel').waitFor();const save=b.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith('/shortlist'));await b.locator('#bookmark').click();assert.equal((await save).status(),200);}
  release.release();assert.equal((await question).status(),200);await until(async()=>{const response=await a.request.get('/api/cases/'+id);const value=await response.json();return !!value.view.restaurant.questionHistory.find((q:{requestId:string;result?:unknown})=>q.requestId===requestId&&q.result);});await a.reload();await a.locator('#details').waitFor();const view=(await(await a.request.get('/api/cases/'+id)).json()).view;
  assert.equal(view.restaurant.shortlistCandidateIds.length,changes===1?1:0);const completions=(await runtime.listEvents(id)).filter(row=>row.event.type==='PAGE_QUESTION_COMPLETED'&&row.event.requestId===requestId);assert.equal(completions.length,1);assert.equal(view.restaurant.questionHistory.find((q:{requestId:string})=>q.requestId===requestId).result.status,'ANSWERED');assert.match(await a.locator('#asked-result').innerText(),/card/i);await capture(a,`round24-b3-${width}-${changes}-changes-answered`);
 }finally{release.release();await question?.catch(()=>{});runtime.dispatch=dispatch;await context.close();await browser.close();await host.close();}
});

await collect('ui-handoff-shortlist');
