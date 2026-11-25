import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium,type Page} from 'playwright-core';
import type {ModelGateway} from '../../core/model/contracts.js';
import type {RestaurantReadEvidence,RestaurantTaskState} from '../../domains/restaurant/contracts.js';
import {assessRestaurantConditions} from '../../domains/restaurant/condition-states.js';
import {readQuotedRestaurantSourceFacts,quotedRestaurantSourceEvidence,type RestaurantSourceFactsInput} from '../../integrations/restaurant-facts/model-source-facts.js';
import {datedWorkspaceRequest, startWorkspaceFixture} from '../workspace-fixture-server.js';

type Host=Awaited<ReturnType<typeof startWorkspaceFixture>>;
async function capture(page:Page,name:string){const root=(name.startsWith('round29-')?process.env.PRAXIS_ROUND29_VISUAL_OUTPUT:undefined)??process.env.PRAXIS_ROUND24_VISUAL_OUTPUT??process.env.PRAXIS_ROUND8_VISUAL_OUTPUT??process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT;if(!root)return;await mkdir(root,{recursive:true});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:join(root,name+'.png'),animations:'disabled'});}
// Controlled persisted-view fixture: the live local HTTP server and PGlite remain real.
// Only the historical snapshot is seeded; this does not claim semantic or source-fetch quality.
async function projected(width:number,run:(page:Page,host:Host,id:string,state:RestaurantTaskState,persist:()=>Promise<void>)=>Promise<void>){
 const host=await startWorkspaceFixture({multiSlot:true,questions:true}),browser=await chromium.launch({headless:true}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'}),page=await context.newPage();await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());page.setDefaultTimeout(10000);
 try{await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#message').fill(datedWorkspaceRequest('Dinner in Tokyo'));await page.locator('#send').click();await page.waitForFunction(()=>document.getElementById('card-counter')?.textContent==='1 of 3'&&document.getElementById('progress')?.hidden);const id=(await page.locator('.case-link.active').getAttribute('data-case-id'))!;
  type Runtime=Host['application']['runtime'];const runtime=(host.application as unknown as {runtime:Runtime}).runtime,state=structuredClone((await runtime.snapshot(id)).domainState);
  await run(page,host,id,state,async()=>{host.disconnectStreams();await host.database.query('UPDATE tasks SET domain_state = $1 WHERE id = $2',[JSON.stringify(state),id]);await page.reload();await page.locator('#candidate-panel').waitFor();await page.locator('#details-button').click();await page.locator('#details').waitFor();});
 }finally{await context.close();await browser.close();await host.close();}
}
const url='https://merchant.example/venue',times=['2026-11-21T08:04:00Z','2026-11-21T08:05:00Z'];
async function priceFact(outlet:RestaurantTaskState['candidates'][number],amount:number,time:string){
 const text='Dinner course: JPY '+amount+', tax included.';
 const input:RestaurantSourceFactsInput={candidate:outlet,identity:{evidenceId:'source-identity',kind:'ENTITY_MATCH',provider:'TABELOG',candidateId:outlet.restaurant.id,sourceEntityId:'venue',sourceUrl:url,observedAt:times[0]!,requestFingerprint:'fixture',claims:{outletName:outlet.restaurant.outletName},entityMatch:{confidence:'HIGH',matchedBy:['EXACT_NAME_AND_ADDRESS']}},page:{url,title:outlet.restaurant.outletName,text,html:'<main>'+text+'</main>',settlement:'SETTLED'},readAt:time};
 const model:ModelGateway={async complete(request){const rows=JSON.parse(request.messages[1]!.content).sourceDocument.statements as Array<{id:string;text:string}>;return{invocationId:'fixture',provider:'FIXTURE',model:'fixture',finishReason:'TOOL_CALLS',latencyMs:0,outputText:JSON.stringify({selections:[{firstStatementId:rows[0]!.id,lastStatementId:rows[0]!.id,role:'COURSE',priceStatementId:rows.find(s=>/JPY/.test(s.text))!.id}]})};}};
 const facts=await readQuotedRestaurantSourceFacts(model,input,()=>time,new AbortController().signal);assert.ok(facts);return {identity:input.identity,fact:quotedRestaurantSourceEvidence(input.identity,facts)!};
}
async function groups(page:Page){return page.locator('#details-content > section').evaluateAll(nodes=>nodes.map(node=>({key:JSON.parse(node.getAttribute('data-source-id')!) as [string,string|null],quotes:[...node.querySelectorAll('blockquote')].map(q=>({text:q.textContent!,label:q.previousElementSibling?.className==='citation-context'?q.previousElementSibling.textContent:null})),values:[...node.querySelectorAll('.about-term')].map(n=>n.textContent),footer:node.querySelector('.citation-footer')?.textContent,href:node.querySelector('a')?.getAttribute('href')})));}
for(const width of [390,1440])for(const legacy of [false,true])test(`Round24 UI: U1/U2 ${width} dual-price readings legacy=${legacy} survive real snapshot reload`,{timeout:35000},async()=>{
 await projected(width,async(page,_host,_id,state,persist)=>{
  const id=state.presentedResults!.candidateIds[0]!,outlet=state.candidates.find(c=>c.restaurant.id===id)!,pairs=await Promise.all([priceFact(outlet,7000,times[0]!),priceFact(outlet,8000,times[1]!)]),facts=pairs.map(p=>p.fact);
  state.readEvidence.push(pairs[0]!.identity,...facts);state.factChecks![id]={status:'COMPLETED',sourceProvider:'TABELOG',checkedAt:times[1]!,evidenceIds:facts.map(f=>f.evidenceId)};
  const conditions=assessRestaurantConditions({criteria:[],budgetPerPerson:{max:9000,currency:'JPY'},timeWindow:{earliest:'19:00',latest:'20:00'}},facts);assert.equal(conditions[0]!.sources.length,2);
  if(legacy)for(const condition of conditions)for(const quote of condition.sources)delete quote.evidenceId;
  state.presentedResults!.conditionStates[id]=conditions;await persist();const rows=await groups(page);
  const stamped = rows.filter(row => row.key[0] === url && row.key[1] !== null);
  assert.equal(stamped.length, 2, 'different prices retain separate readings of the same URL');
  for (const [i, amount] of ['¥7,000','¥8,000'].entries()) {
   const matches=stamped.filter(row=>row.values.includes('Course '+amount));
   assert.deepEqual(matches.map(row=>row.key[1]),[times[i]]);
   assert.equal(matches[0]!.href,url);
   assert.deepEqual(matches[0]!.quotes,[]);
  }
  const unknown = rows.find(row=>row.key[0]===url&&row.key[1]===null);
  if (legacy) {
   assert.ok(unknown);
   assert.equal(unknown.href,url);
   assert.equal(unknown.footer,'merchant.example ↗');
   assert.deepEqual(unknown.quotes,[]);
  } else assert.equal(unknown,undefined);
  await capture(page,`round24-u1-u2-${width}-${legacy?'legacy-unknown-time':'exact-price-times'}`);
 });
});
for(const width of [390,1440])for(const budget of [false,true])for(const provider of ['tabelog','website'] as const)test(`Round24 U2 / Round29: ${width} archived ${provider} menu budget=${budget} keeps structured prices and hides raw menu text`,{timeout:35000},async()=>{
 const input=JSON.parse(await readFile(new URL('./fixtures/round24-provenance/'+provider+'-menu.json',import.meta.url),'utf8')) as {fact:RestaurantReadEvidence;identity:RestaurantReadEvidence;matchingQuotes:string[]};
 await projected(width,async(page,host,caseId,state,persist)=>{
  const id=state.presentedResults!.candidateIds[0]!,fact={...input.fact,candidateId:id},identity={...input.identity,candidateId:id};state.readEvidence.push(identity,fact);state.factChecks![id]={status:'COMPLETED',sourceProvider:fact.provider as 'TABELOG'|'RESTAURANT_WEBSITE',checkedAt:fact.observedAt,evidenceIds:[fact.evidenceId]};
  state.presentedResults!.conditionStates[id]=budget?assessRestaurantConditions({criteria:[],budgetPerPerson:{max:9000,currency:'JPY'},timeWindow:{earliest:'19:00',latest:'20:00'}},[fact]):[];await persist();
  const content=page.locator('#details-content');
  const rendered=await content.textContent()??'';
  for(const quote of input.matchingQuotes)assert.ok(!rendered.includes(quote),quote);
  assert.equal(await content.locator('details, .about-categories').count(),0);
  const projected=await host.application.getCase('workspace-user',caseId);
  const retained=projected.restaurant.currentFactEvidence.find(item=>item.evidenceId===fact.evidenceId);
  assert.deepEqual(retained?.claims.listedCourseDetails,fact.claims.listedCourseDetails);
  assert.deepEqual(retained?.sourceFieldQuotes,fact.sourceFieldQuotes);
  if(provider==='website'){
   const row=(await groups(page)).find(row=>row.key[0]===fact.sourceUrl&&row.key[1]===fact.observedAt)!;
   assert.ok(row);
   assert.deepEqual(row.values,['Course ¥3,800','Course ¥5,500','Course ¥7,000']);
   assert.equal(row.href,fact.sourceUrl);
   assert.match(row.footer!,/ ↗ · Checked /);
  }else assert.equal(await content.locator('.about-term').count(),0);
  await capture(page,`round24-u2-${width}-${provider}-${budget?'budget':'no-budget'}`);
 });
});

test("Round28 follow-up / Round29: 390 About keeps a numeric course price and omits matching raw menu title", { timeout: 35_000 }, async () => {
 await projected(390, async (page, host, caseId, state, persist) => {
  const candidateId = state.presentedResults!.candidateIds[0]!;
  const input = JSON.parse(await readFile(new URL('./fixtures/round24-provenance/tabelog-menu.json', import.meta.url), 'utf8')) as { fact: RestaurantReadEvidence; identity: RestaurantReadEvidence };
  const title = "Chef's omakase";
  const fact = { ...input.fact, candidateId, claims: { coursePriceYen:8000, listedCourseDetails: [title] },
   sourceFieldQuotes: [{ field: 'COURSE_TITLE' as const, quote: title, sourceUrl: input.fact.sourceUrl! }] };
  state.readEvidence.push({ ...input.identity, candidateId }, fact);
  state.factChecks![candidateId] = { status: 'COMPLETED', sourceProvider: 'TABELOG', checkedAt: fact.observedAt, evidenceIds: [fact.evidenceId] };
  state.presentedResults!.conditionStates[candidateId] = [];
  await persist();
  const content=page.locator('#details-content');
  assert.deepEqual(await content.locator('.about-term').allTextContents(),['Course ¥8,000']);
  assert.equal(await content.locator('details').count(),0);
  assert.equal(await content.locator('.citation-footer a').getAttribute('href'),fact.sourceUrl);
  assert.ok(!(await content.textContent())?.includes(title));
  const view=await host.application.getCase('workspace-user',caseId);
  assert.deepEqual(view.restaurant.currentFactEvidence.find(item=>item.evidenceId===fact.evidenceId)?.claims.listedCourseDetails,[title]);
  await capture(page, 'round29-390-course-price');
 });
});

async function footerGeometry(page:Page,selector:string){await page.evaluate(()=>document.fonts.ready.then(()=>undefined));return page.locator(selector+' .citation-footer').evaluateAll(nodes=>nodes.map(node=>{const container=node.closest('#answer-sheet')??node.closest('#details')!,bounds=container.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(node);const rects=[...range.getClientRects()].filter(r=>r.width>0),lines:number[]=[];for(const rect of rects)if(!lines.some(y=>Math.abs(y-rect.top)<2))lines.push(rect.top);return{text:node.textContent,lines:lines.length,inBounds:rects.every(r=>r.left>=bounds.left&&r.right<=bounds.right),noOverflow:container.scrollWidth<=container.clientWidth&&node.scrollWidth<=node.clientWidth};}));}
for(const width of [390,1440])test(`Round24 UI: U5 ${width} recorded designated-smoking qualifier stays intact in sheet and About history`,{timeout:35000},async()=>{
 const html=await readFile(new URL('./fixtures/disabled-party-recorded/snapshot-0040.html',import.meta.url),'utf8');
 await projected(width,async(page,_host,id,state,persist)=>{
  const input=await page.evaluate(html=>{const doc=new DOMParser().parseFromString(html,'text/html'),header=[...doc.querySelectorAll('th')].find(n=>n.textContent?.trim()==='Non-smoking/smoking')!;return{pair:[header.textContent!.trim(),header.nextElementSibling!.querySelector('p')!.textContent!.trim()],url:doc.querySelector('link[rel=canonical]')!.getAttribute('href')!};},html);assert.equal(input.pair[1],'Designated smoking area (heated tobacco only)');
  const candidateId=state.presentedResults!.candidateIds[0]!,base=state.readEvidence.find(e=>e.candidateId===candidateId)!;state.readEvidence.push({...base,evidenceId:'smoking-source',sourceUrl:input.url,observedAt:times[0]!});state.presentedResults!.conditionStates[candidateId]=[{criterionRef:'smoking',text:'Smoking policy',polarity:'POSITIVE',strength:'HARD',status:'MET',explanation:'Recorded field projection',evidenceIds:['smoking-source'],sources:input.pair.map(quote=>({field:'SOURCE_TEXT',quote,sourceUrl:input.url,evidenceId:'smoking-source'}))}];await persist();
  const view=(await(await page.request.get('/api/cases/'+id)).json()).view as import('../../application/agent-workspace.js').RestaurantCaseView;const answer='The page\'s "Non-smoking/smoking" field says: '+input.pair[1];
  await page.route('**/api/cases/*/questions',async route=>{const body=route.request().postDataJSON() as {question:string;requestId:string};const q={requestId:body.requestId,question:body.question,candidateId,readRunId:view.restaurant.sourceReadContext!.runId,readStartedAt:times[0]!,deadlineAt:'2027-01-01T00:00:00Z',requestedAt:times[0]!,result:{status:'ANSWERED' as const,candidateId,answer,sensitiveCategory:'NONE' as const,confirmationRequired:false,citations:input.pair.map(text=>({text,url:input.url,readAt:times[0]!,identityEvidenceId:'smoking-source'})),checkedPages:[]}};view.restaurant.pageQuestion=q;view.restaurant.questionHistory.unshift(q);view.case.taskVersion++;await route.fulfill({json:{view}});});
  await page.locator('#message').fill('What is the smoking policy?');await page.locator('#send').click();await page.locator('#answer-sheet').waitFor();await page.locator('#question-result summary').click();assert.equal(await page.locator('#question-result > p').first().textContent(),answer);assert.deepEqual(await page.locator('#question-result blockquote').allTextContents(),[input.pair[1]]);if(width===390)for(const row of await footerGeometry(page,'#question-result')){assert.equal(row.lines,1);assert.ok(row.inBounds&&row.noOverflow);assert.match(row.text!,/Checked Nov 21$/);}await capture(page,`round24-u5-${width}-designated-smoking-sheet`);
  await page.locator('#answer-close').click();await page.locator('#asked-result summary').click();assert.equal(await page.locator('#asked-result > p').first().textContent(),answer);assert.deepEqual(await page.locator('#asked-result blockquote').allTextContents(),[input.pair[1]]);await page.locator('#details-content summary').click();assert.deepEqual(await page.locator('#details-content blockquote').allTextContents(),[input.pair[1]],'About expands only the materially longer qualifier');if(width===390)for(const row of await footerGeometry(page,'#asked-result')){assert.equal(row.lines,1);assert.ok(row.inBounds&&row.noOverflow);assert.match(row.text!,/Checked Nov 21$/);}await capture(page,`round24-u5-${width}-designated-smoking-history`);
 });
});
