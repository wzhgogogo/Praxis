import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir,writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium,type Page } from 'playwright-core';
import type { RestaurantCaseView } from '../../application/agent-workspace.js';
import { datedWorkspaceRequest, startWorkspaceFixture } from '../workspace-fixture-server.js';

type Host=Awaited<ReturnType<typeof startWorkspaceFixture>>;
async function shot(page:Page,name:string){const root=(name.startsWith('round29-')?process.env.PRAXIS_ROUND29_VISUAL_OUTPUT:undefined)??process.env.PRAXIS_WORKSPACE_VISUAL_OUTPUT;if(!root)return;await mkdir(root,{recursive:true});await page.evaluate(()=>document.fonts.ready.then(()=>undefined));await page.screenshot({path:join(root,name+'.png'),animations:'disabled'});}
async function signIn(page:Page,host:Host){await page.clock.install({time:host.clock.now()});await page.goto(host.baseUrl);await page.getByLabel('Access token',{exact:true}).fill('workspace-fixture');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('#home').waitFor();}
async function create(page:Page,message='Dinner in Tokyo'){await page.locator('#message').fill(datedWorkspaceRequest(message));const response=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/api/cases');await page.locator('#send').click();await response;await page.waitForFunction(()=>document.getElementById('card-counter')?.textContent==='1 of 3'&&document.getElementById('progress')?.hidden);const id=await page.locator('.case-link.active').getAttribute('data-case-id');assert.ok(id);return id;}
async function emit(page:Page,view:RestaurantCaseView){await page.evaluate(view=>{for(const stream of (window as unknown as {r23Streams:EventTarget[]}).r23Streams)stream.dispatchEvent(new MessageEvent('case',{data:JSON.stringify(view)}));},view);}
// UI projection fixture: real login, initial read, HTTP and Chromium; only the subsequent
// public view/SSE boundary is controlled. This does not claim a backend/answer-quality fix.
async function projection(width:number,run:(page:Page,view:RestaurantCaseView,host:Host,update:()=>Promise<void>)=>Promise<void>){
 const host=await startWorkspaceFixture({multiSlot:true,questions:true}),browser=await chromium.launch({headless:true,args:['--disable-background-networking']}),context=await browser.newContext({baseURL:host.baseUrl,viewport:{width,height:width<960?844:900},hasTouch:width<960,reducedMotion:'reduce',serviceWorkers:'block'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());const page=await context.newPage(),errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
 try{await signIn(page,host);const id=await create(page);const view=(await(await page.request.get('/api/cases/'+encodeURIComponent(id))).json()).view as RestaurantCaseView;host.disconnectStreams();
  await page.addInitScript({content:`window.r23Streams=[];window.EventSource=class extends EventTarget{static CONNECTING=0;static OPEN=1;static CLOSED=2;readyState=1;constructor(){super();window.r23Streams.push(this);queueMicrotask(()=>this.dispatchEvent(new Event('open')));}close(){this.readyState=2;}};`});
  await page.route('**/api/cases/*',r=>r.request().method()==='GET'&&new URL(r.request().url()).pathname==='/api/cases/'+encodeURIComponent(id)?r.fulfill({json:{view}}):r.continue());await page.reload();await page.locator('#candidate-panel').waitFor();
  await run(page,view,host,async()=>{view.case.taskVersion++;await emit(page,view);});assert.deepEqual(errors,[]);
 }finally{await context.close();await browser.close();await host.close();}
}
async function footerGeometry(page:Page,selector:string){await page.evaluate(()=>document.fonts.ready.then(()=>undefined));return page.locator(selector+' .citation-footer').evaluateAll(nodes=>nodes.map(node=>{const box=node.closest('#answer-sheet')??node.closest('#details')!;const bounds=box.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(node);const rects=[...range.getClientRects()].filter(r=>r.width>0),lines:number[]=[];for(const rect of rects)if(!lines.some(y=>Math.abs(y-rect.top)<2))lines.push(rect.top);return{text:node.textContent,lines:lines.length,inBounds:rects.every(r=>r.left>=bounds.left&&r.right<=bounds.right),noOverflow:box.scrollWidth<=box.clientWidth&&node.scrollWidth<=node.clientWidth};}));}

for(const width of [390,1440])test(`Round23 UI: R1 ${width} About placeholder follows outlet and preserves Adjust focus`,{timeout:35000},async()=>{
 await projection(width,async(page,view,_host,update)=>{
  await page.locator('#details-button').click();const first=await page.locator('#details-name').innerText();assert.equal(await page.locator('#message').getAttribute('placeholder'),'Ask about '+first);await page.locator('#message').focus();await page.locator('#details-name').click();assert.equal(await page.locator('#message').getAttribute('placeholder'),'Ask about '+first);
  const id=view.restaurant.presentedCandidateIds![0]!;view.restaurant.candidates.find(c=>c.restaurant.id===id)!.restaurant.outletName='Second outlet name';await update();assert.equal(await page.locator('#message').getAttribute('placeholder'),'Ask about Second outlet name');
  await shot(page,`round23-r1-${width}-about`);await page.locator('#details-back').click();assert.equal(await page.locator('#message').getAttribute('placeholder'),null);
  view.case.phase='NO_VERIFIED_RESULT';view.restaurant.readStatus.kind='NO_QUALIFIED_RESULTS';view.restaurant.readyCandidateIds=[];view.restaurant.presentedCandidateIds=[];await update();await page.locator('#empty-adjust').click();assert.equal(await page.locator('#message').getAttribute('placeholder'),'Try another area, time, or party size…');await update();assert.equal(await page.locator('#message').getAttribute('placeholder'),'Try another area, time, or party size…');await shot(page,`round23-r1-${width}-adjust`);await page.locator('#case-title').click();assert.equal(await page.locator('#message').getAttribute('placeholder'),null);await page.locator('#new-case').click();assert.equal(await page.locator('#message').getAttribute('placeholder'),null);
 });
});

test('Round23 UI: R3 removed names use verified human links and omit generic reason lines',{timeout:30000},async()=>{
 await projection(1440,async(page,view,_host,update)=>{
  view.restaurant.revisionDiff={fromRevision:1,toRevision:2,removed:[{candidateId:'maps',outletName:'Maps outlet',reasonCode:'NO_LONGER_MATCHES',sourceUrl:'https://www.google.com/maps/place/fixture'},{candidateId:'plain',outletName:'Plain outlet',reasonCode:'NO_LONGER_MATCHES'},{candidateId:'budget',outletName:'Budget outlet',reasonCode:'OVER_BUDGET',sourceUrl:'https://merchant.example/budget'},{candidateId:'time',outletName:'Time outlet',reasonCode:'NEW_TIME_MISMATCH'}],added:[{candidateId:'new',outletName:'New outlet'}]};await update();await page.locator('#revision-changes summary').click();
  const maps=page.locator('li[data-candidate-id="maps"]');assert.equal(await maps.locator('a').getAttribute('href'),'https://www.google.com/maps/place/fixture');assert.equal(await maps.locator('a').getAttribute('target'),'_blank');assert.equal(await maps.locator('a').getAttribute('rel'),'noopener noreferrer');assert.equal(await maps.locator('p').count(),0);assert.equal(await page.locator('li[data-candidate-id="plain"] a').count(),0);assert.equal(await page.locator('li[data-candidate-id="plain"] p').count(),0);assert.equal(await page.locator('li[data-candidate-id="budget"] p').innerText(),'Over budget');assert.equal(await page.locator('li[data-candidate-id="time"] p').innerText(),"Doesn't match the new time");await shot(page,'round23-r3-removed-links');
 });
});

for(const width of [390,1440])test(`Round23 R4 / Round29: ${width} About keeps detailed originals and structured terms`,{timeout:30000},async()=>{
 await projection(width,async(page,view,_host,update)=>{
  const id=view.restaurant.presentedCandidateIds![0]!,time='2026-11-21T08:04:00Z',later='2026-11-21T08:05:00Z',a='https://merchant.example/conditions',b='https://merchant.example/terms';
  const base=view.restaurant.readEvidence.find(f=>f.candidateId===id)!;assert.ok(base);
  view.restaurant.currentFactEvidence=[{...base,kind:'RESTAURANT_FACT',evidenceId:'condition-a',provider:'GOOGLE_PLACES',sourceUrl:a,observedAt:time,claims:{restaurantTypeFacts:['restaurant','food','point_of_interest','establishment','store','food_store','steak_house']},sourceFieldQuotes:[{field:'CATEGORY',quote:'Steak',sourceUrl:a}]},{...base,kind:'RESTAURANT_FACT',evidenceId:'terms-b',sourceUrl:b,observedAt:later,claims:{coursePriceYen:8000,cancellationTerms:'Cancellation costs 100%.'},sourceFieldQuotes:[]}];view.restaurant.readEvidence=[...view.restaurant.readEvidence,...view.restaurant.currentFactEvidence];
  const original='Private rooms are available for groups of two to six when booked in advance.';
  view.restaurant.conditionStates={[id]:[{criterionRef:'private',text:'Private room',polarity:'POSITIVE',strength:'HARD',status:'MET',explanation:'Original condition evidence',evidenceIds:['condition-a'],sources:[{field:'SOURCE_TEXT',quote:original,sourceUrl:a}]}]};await update();await page.locator('#details-button').click();
  assert.equal(await page.locator('.about-categories').count(),0);
  const originalQuote=page.locator('#details-content blockquote');
  assert.equal(await originalQuote.textContent(),original);
  assert.equal(await originalQuote.isVisible(),false);
  await page.locator('#details-content summary').click();
  assert.ok(await originalQuote.isVisible());
  assert.equal(await originalQuote.evaluate(node=>getComputedStyle(node).borderLeftColor),'rgb(61, 90, 254)');
  assert.match(await page.locator('#details-content').innerText(),/Course ¥8,000/);assert.match(await page.locator('#details-content').innerText(),/Cancellation costs 100%/);
  const links=page.locator('#details-content .citation-footer a');assert.deepEqual(await links.evaluateAll(nodes=>nodes.map(n=>(n as HTMLAnchorElement).href).sort()),[a,b].sort());assert.deepEqual(await page.locator('#details-content > section[data-source-id]').evaluateAll(nodes=>nodes.map(n=>JSON.parse(n.getAttribute('data-source-id')!)[1])),[time,later]);assert.match(await page.locator('#details-content').innerText(),/Checked Nov 21/);assert.match(await page.locator('#details-content').innerText(),/Checked Nov 21/);
  const term=page.locator('#details-content .about-commercial').filter({hasText:'Course ¥8,000'});assert.equal(await term.locator('.citation-footer a').getAttribute('href'),b);assert.equal(await term.locator('blockquote').count(),0);assert.equal(await page.locator('#details-content .citation-group').evaluateAll(nodes=>nodes.filter(n=>!n.querySelector('blockquote')).length),0);
  await shot(page,`round23-r4-${width}-terms-and-quotes`);
  view.restaurant.conditionStates={};view.restaurant.currentFactEvidence=[{...base,kind:'RESTAURANT_FACT',evidenceId:'course-only',sourceUrl:b,observedAt:later,claims:{coursePriceYen:8000},sourceFieldQuotes:[]}];await update();assert.equal(await page.locator('#details-content blockquote').count(),0);const only=page.locator('#details-content .about-commercial');assert.match(await only.innerText(),/Course ¥8,000/);assert.match(await only.innerText(),/Checked Nov 21/);assert.equal(await only.locator('.citation-footer a').getAttribute('href'),b);await shot(page,`round23-r4-${width}-course-only`);
  const policy='Same-day cancellations require the full course price.';
  const policySource='Reservations cancelled after midnight on the booking date will be charged 100% of the selected course price.';
  view.restaurant.currentFactEvidence=[{...base,kind:'RESTAURANT_FACT',evidenceId:'full-policy',sourceUrl:b,observedAt:later,
   claims:{cancellationTerms:policy,noShowTerms:'No-show fee applies.'},sourceFieldQuotes:[
    {field:'SOURCE_TEXT',quote:policy.toUpperCase(),sourceUrl:b},
    {field:'SOURCE_TEXT',quote:policySource,sourceUrl:b},
   ]}];
  await update();
  assert.deepEqual(await only.locator('.about-term').allTextContents(),[policy,'No-show fee applies.']);
  const quote=only.locator('blockquote');
  assert.deepEqual(await quote.allTextContents(),[policySource]);
  assert.equal(await quote.isVisible(),false);
  await only.locator('summary').click();
  assert.equal(await quote.innerText(),policySource);
  await quote.scrollIntoViewIfNeeded();
  await shot(page,`round29-${width}-about-policy`);
 });
});

for (const width of [390, 1440]) test('Round29 About '+width+': Refresh keeps one identical reading and distinct price snapshots', {timeout: 35_000}, async () => {
 await projection(width, async (page, view, _host, update) => {
  const id = view.restaurant.presentedCandidateIds![0]!;
  const base = view.restaurant.readEvidence.find(fact => fact.candidateId === id)!;
  const url = 'https://tabelog.com/en/tokyo/A1301/A130101/13123456/';
  const times = ['2026-11-25T05:00:00Z', '2026-11-26T05:00:00Z', '2026-11-27T05:00:00Z'];
  const policy = 'No-show fee applies.';
  const course = '全12品のおまかせ料理と飲み放題の詳細。季節の仕入れにより変更となります。';
  function reading(index: number, min: number, quote: string) {
   return {
    ...base, kind:'RESTAURANT_FACT' as const, provider:'TABELOG' as const,
    evidenceId:'about-refresh-'+index, sourceUrl:url, observedAt:times[index]!,
    claims:{coursePriceYen:8000, cancellationTerms:'Cancellation costs 100%.', noShowTerms:policy, listedCourseDetails:[course]},
    priceFacts:{schemaVersion:'restaurant-price-facts@1' as const, listedCoursePricesYen:[],
     dinnerBudgetRangeYen:{min,max:min+999,quote,sourceUrl:url},
     ...(index===2?{lunchBudgetRangeYen:{min:1500,max:1999,quote:'Lunch ¥1,500–¥1,999',sourceUrl:url}}:{})},
    sourceFieldQuotes:[
     {field:'PRICE' as const,quote,sourceUrl:url},
     {field:'COURSE_DESCRIPTION' as const,quote:course,sourceUrl:url},
     {field:'CATEGORY' as const,quote:'Sushi, Seafood',sourceUrl:url},
     {field:'SOURCE_TEXT' as const,quote:'Quiet',sourceUrl:url},
    ],
   };
  }
  const first = reading(0,4000,'Dinner ¥4,000–¥4,999');
  const identical = reading(1,4000,'  DINNER　¥4,000–¥4,999  ');
  identical.sourceFieldQuotes.reverse();
  const changed = reading(2,5000,'Dinner ¥5,000–¥5,999');
  function publish(...readings: typeof first[]) {
   view.restaurant.currentFactEvidence = readings;
   view.restaurant.readEvidence = [base,...readings];
   // Conditions after Refresh reference the newest observation, not both copies.
   const current = readings.at(-1)!;
   view.restaurant.conditionStates = {[id]: [{
    criterionRef:'quiet',text:'Quiet',polarity:'POSITIVE',strength:'HARD',status:'MET',explanation:'Source text supports quiet seating.',
    evidenceIds:[current.evidenceId],sources:[{field:'SOURCE_TEXT',quote:'Quiet',sourceUrl:url,evidenceId:current.evidenceId}],
   }]};
  }
  publish(first);
  await update();
  await page.locator('#details-button').click();
  await page.route('**/api/cases/*/refresh', async route => {
   assert.equal(route.request().method(),'POST');
   publish(first,identical);
   view.case.taskVersion++;
   await route.fulfill({json:{view}});
  });
  const response = page.waitForResponse(r=>r.url().endsWith('/refresh')&&r.request().method()==='POST');
  await page.locator('#refresh').click();
  assert.equal((await response).status(),200);
  const content = page.locator('#details-content'), rows = content.locator('section[data-source-id]');
  const readTimes = () => rows.evaluateAll(nodes => nodes.map(node => JSON.parse(node.getAttribute('data-source-id')!)[1]).sort());
  await page.waitForFunction(time=>Array.from(document.querySelectorAll('#details-content section')).some(n=>n.getAttribute('data-source-id')?.includes(time)),times[1]!);
  assert.deepEqual(await readTimes(),[times[1]],'identical Refresh snapshots must keep only the latest reading');
  assert.deepEqual(await rows.locator('.citation-footer').allTextContents(),['Tabelog ↗ · Checked Nov 26']);
  assert.match(await content.innerText(),/Dinner budget ¥4,000–¥4,999/);
  assert.match(await content.innerText(),/Course ¥8,000/);
  assert.match(await content.innerText(),/Cancellation costs 100%/);
  assert.match(await content.innerText(),/No-show fee applies/);
  assert.doesNotMatch(await content.textContent()??'',/Categories:|全12品|Lunch budget/);
  assert.equal(await content.locator('details').count(),0);
  assert.ok(Math.abs(await page.locator('#refresh').evaluate(button=>{
   const bounds=button.getBoundingClientRect(),content=document.querySelector('#details-content')!.getBoundingClientRect();
   return (bounds.left+bounds.right-content.left-content.right)/2;
  }))<1,'Refresh is centered');
  await page.locator('#refresh').scrollIntoViewIfNeeded();
  await shot(page,'round29-'+width+'-about-refresh');
  publish(first,identical,changed);
  await update();
  assert.deepEqual(await readTimes(),[times[1],times[2]]);
  assert.match(await rows.filter({hasText:'Checked Nov 26'}).innerText(),/¥4,000–¥4,999/);
  assert.match(await rows.filter({hasText:'Checked Nov 27'}).innerText(),/¥5,000–¥5,999[\s\S]*Lunch budget ¥1,500–¥1,999/);
  await page.locator('#refresh').scrollIntoViewIfNeeded();
  await shot(page,'round29-'+width+'-about-changed');
 });
});

const smokingAnswer='The page\'s "Non-smoking/smoking" field lists "Non smoking," so smoking is not indicated as permitted.';
for(const width of [390,1440])test(`Round23 UI: R5 ${width} Q&A-only smoking headers preserve prose and source times`,{timeout:40000},async()=>{
 await projection(width,async(page,view,_host,update)=>{
  const id=view.restaurant.presentedCandidateIds![0]!,url='https://tabelog.com/en/tokyo/A1301/A130101/13296659/',time='2026-11-21T08:04:43.343Z',later='2026-11-21T08:05:43.343Z';let texts=['Non-smoking/smoking','Non smoking'],different=false;
  const base=view.restaurant.readEvidence.find(f=>f.candidateId===id)!;view.restaurant.readEvidence.push({...base,kind:'RESTAURANT_FACT',evidenceId:'about-smoking-source',sourceUrl:url,observedAt:time});view.restaurant.conditionStates={[id]:[{criterionRef:'smoking',text:'Smoking policy',polarity:'POSITIVE',strength:'HARD',status:'MET',explanation:'Fixture',evidenceIds:['about-smoking-source'],sources:texts.map(quote=>({field:'SOURCE_TEXT',quote,sourceUrl:url}))}]};await update();await page.locator('#details-button').click();
  await page.route('**/api/cases/*/questions',async route=>{const input=route.request().postDataJSON() as {requestId:string;question:string};const q={requestId:input.requestId,question:input.question,candidateId:id,readRunId:view.restaurant.sourceReadContext!.runId,readStartedAt:time,deadlineAt:'2027-01-01T00:00:00Z',requestedAt:time,result:{status:'ANSWERED' as const,candidateId:id,answer:smokingAnswer,sensitiveCategory:'NONE' as const,confirmationRequired:false,citations:texts.map((text,i)=>({text,url,readAt:different&&i===1?later:time,identityEvidenceId:base.evidenceId})),checkedPages:[]}};view.restaurant.pageQuestion=q;view.restaurant.questionHistory.unshift(q);view.case.taskVersion++;await route.fulfill({json:{view}});});
  for(const variant of ['smoking','payment','different-time'] as const){texts=variant==='payment'?['Visa/Mastercard','Visa']:['Non-smoking/smoking','Non smoking'];different=variant==='different-time';await page.locator('#message').fill('Question '+variant);await page.locator('#send').click();await page.locator('#answer-sheet').waitFor();assert.equal(await page.locator('#message').getAttribute('placeholder'),'Ask about '+await page.locator('#details-name').innerText());
   assert.equal(await page.locator('#question-result > p').first().textContent(),smokingAnswer,'answer prose is byte-for-byte unchanged; only blockquotes are filtered');
   const expected=variant==='smoking'?['Non smoking']:texts;assert.deepEqual(await page.locator('#question-result blockquote').allTextContents(),expected);assert.deepEqual(await page.locator('#asked-result blockquote').allTextContents(),expected);await page.locator('#question-result summary').click();
   if(width===390)for(const row of await footerGeometry(page,'#question-result')){assert.equal(row.lines,1);assert.ok(row.inBounds&&row.noOverflow);assert.match(row.text!,/Checked Nov 21$/);}
   await shot(page,`round23-r5-${width}-${variant}-sheet`);await page.locator('#answer-close').click();await page.locator('#asked-result summary').click();
   if(width===390)for(const row of await footerGeometry(page,'#asked-result')){assert.equal(row.lines,1);assert.ok(row.inBounds&&row.noOverflow);assert.match(row.text!,/Checked Nov 21$/);}
   await shot(page,`round23-r5-${width}-${variant}-history`);
  }
  assert.equal(await page.locator('#details-content blockquote').count(),0,'short condition quotations use a compact footer');assert.equal(await page.locator('#asked-earlier blockquote').filter({hasText:'Non-smoking/smoking'}).count(),0,'earlier Q&A smoking group remains filtered');
  const handoff=view.restaurant.bookingHandoffs!.find(h=>h.candidateId===id)!;assert.ok(handoff);handoff.terms=[{label:'Smoking policy',citations:['Non-smoking/smoking','Non smoking'].map(text=>({text,url,readAt:time,identityEvidenceId:base.evidenceId}))}];await update();await page.locator('#details-back').click();await page.locator('#choose').click();await page.locator('#handoff').waitFor();assert.deepEqual(await page.locator('#handoff-terms blockquote').allTextContents(),['Non-smoking/smoking','Non smoking']);await shot(page,`round23-r5-${width}-handoff-control`);
 });
});

for(const size of [{width:360,height:800},{width:390,height:844},{width:1440,height:900}])test(`Round23 UI: R6 ${size.width} home title stays one physical centered line`,{timeout:25000},async()=>{
 const host=await startWorkspaceFixture(),browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:size,reducedMotion:'reduce'});
 try{await signIn(page,host);await page.evaluate(()=>document.fonts.ready.then(()=>undefined));const box=await page.locator('#home h1').evaluate(n=>{const range=document.createRange();range.selectNodeContents(n);const rects=[...range.getClientRects()].filter(r=>r.width>0),lines:number[]=[];for(const r of rects)if(!lines.some(y=>Math.abs(y-r.top)<2))lines.push(r.top);const l=Math.min(...rects.map(r=>r.left)),right=Math.max(...rects.map(r=>r.right));return{lines:lines.length,center:(l+right)/2,expectedCenter:(n.getBoundingClientRect().left+n.getBoundingClientRect().right)/2,width:innerWidth,inBounds:l>=0&&right<=innerWidth,noOverflow:document.documentElement.scrollWidth<=innerWidth};});assert.equal(box.lines,1);assert.ok(Math.abs(box.center-box.expectedCenter)<1);assert.ok(box.inBounds&&box.noOverflow);await shot(page,`round23-r6-${size.width}-home`);
 }finally{await browser.close();await host.close();}
});

test('Round23 UI: R7 mobile visualViewport simulation protects headings and long About scroll',{timeout:45000},async()=>{
 await projection(390,async(page,view,_host,update)=>{
  const original=structuredClone(view),id=view.restaurant.presentedCandidateIds![0]!;
  const keyboard=async(show:boolean)=>{await page.evaluate(show=>{const vv=window.visualViewport!;if(show){Object.defineProperty(vv,'height',{configurable:true,value:500});Object.defineProperty(vv,'offsetTop',{configurable:true,value:100});}else{delete (vv as unknown as Record<string,unknown>).height;delete (vv as unknown as Record<string,unknown>).offsetTop;}vv.dispatchEvent(new Event('resize'));},show);await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>r())));};
  for(const phase of ['CANDIDATES','STOPPED','NEEDS_INPUT','EMPTY','ABOUT'] as const){Object.assign(view,structuredClone(original));
   if(phase==='STOPPED'){view.case.phase='FAILED';view.case={...view.case,stopped:true};view.restaurant.progress.stopped=true;}
   if(phase==='NEEDS_INPUT'||phase==='EMPTY'){view.restaurant.readyCandidateIds=[];view.restaurant.presentedCandidateIds=[];view.restaurant.candidates=[];view.case.phase=phase==='NEEDS_INPUT'?'NEEDS_INPUT':'NO_VERIFIED_RESULT';view.restaurant.readStatus.kind=phase==='NEEDS_INPUT'?'PENDING':'NO_QUALIFIED_RESULTS';view.restaurant.clarificationQuestion='Which area?';}
   await update();if(phase==='ABOUT')await page.locator('#details-button').click();await page.locator('#case-workspace').evaluate(n=>n.scrollTop=0);await page.locator('#message').focus();await keyboard(true);
   const boxes=await page.evaluate(()=>{const vv=window.visualViewport!;return ['#topbar','#case-title','.workspace-conditions','#workspace-composer'].map(selector=>{const r=document.querySelector(selector)!.getBoundingClientRect();return{selector,top:r.top,bottom:r.bottom,from:vv.offsetTop,to:vv.offsetTop+vv.height};});});for(const b of boxes)assert.ok(b.top>=b.from-1&&b.bottom<=b.to+1,JSON.stringify({phase,...b}));await shot(page,`round23-r7-${phase.toLowerCase()}-keyboard`);await page.locator('#message').evaluate(n=>(n as HTMLElement).blur());await keyboard(false);if(phase==='ABOUT')await page.locator('#details-back').click();
  }
  Object.assign(view,structuredClone(original));
  const base=view.restaurant.readEvidence.find(f=>f.candidateId===id)!;
  const url='https://merchant.example/reservations';
  const policy=Array.from({length:42},(_,index)=>'Cancellation rule '+(index+1)+' applies to confirmed tables.').join('\n');
  view.restaurant.currentFactEvidence=[{...base,kind:'RESTAURANT_FACT',sourceUrl:url,claims:{cancellationTerms:'Cancellation fees may apply.'},
   sourceFieldQuotes:[{field:'SOURCE_TEXT',quote:policy,sourceUrl:url}]}];
  await update();
  await page.locator('#details-button').click();
  await page.locator('#details-content summary').click();
  const scroll=page.locator('#case-workspace');
  await scroll.evaluate(node=>node.scrollTop=350);
  const before=await scroll.evaluate(node=>node.scrollTop);
  assert.ok(before>300);
  await page.locator('#message').fill('Keep my unsent question');
  await keyboard(true);
  assert.equal(await scroll.evaluate(node=>node.scrollTop),before);
  await page.locator('#message').evaluate(node=>(node as HTMLElement).blur());
  await keyboard(false);
  assert.equal(await scroll.evaluate(node=>node.scrollTop),before);
  assert.equal(await page.locator('#message').inputValue(),'Keep my unsent question');
  await page.mouse.move(150,300);
  await page.mouse.wheel(0,160);
  await page.waitForFunction(y=>document.getElementById('case-workspace')!.scrollTop>y,before);
  await shot(page,'round23-r7-long-about-scroll');
 });
});

test('Round23 UI: R9 progress distinguishes undefined zero positive and preview discovery',{timeout:30000},async()=>{
 await projection(390,async(page,view,_host,update)=>{
  view.case.phase='SEARCHING';view.restaurant.readyCandidateIds=[];view.restaurant.presentedCandidateIds=[];view.restaurant.candidates=[];view.restaurant.progress={active:true,stopped:false,stage:'FINDING'};view.restaurant.readStatus.kind='PENDING';
  for(const count of [undefined,0,3]){if(count===undefined)delete view.restaurant.progress.discoveredCount;else view.restaurant.progress.discoveredCount=count;await update();const stage=page.locator('#stages [data-stage="search"]');assert.equal(await stage.innerText(),count?'Places found':'Finding places');assert.equal(await stage.getAttribute('class'),count?'stage done':'stage current');assert.equal(await page.locator('#stages [data-stage="check"]').isVisible(),!!count);await shot(page,`round23-r9-discovery-${count??'undefined'}`);}
  await page.evaluate(async()=>{const runtime='/assets/workspace/runtime.js',views='/assets/workspace/views.js';const {state}=await import(runtime);state.preview={caseId:state.view.case.caseId,startedAt:performance.now(),phase:'checking',timer:0};const {renderProgress}=await import(views);renderProgress();});assert.equal(await page.locator('#stages [data-stage="search"]').innerText(),'Places found');assert.equal(await page.locator('#stages [data-stage="check"]').isVisible(),true);await shot(page,'round23-r9-preview-control');
 });
});

test('Round23 UI: R2 native SSE debounce, replacement ownership and CLOSED sidebar sync',{timeout:45000},async()=>{
 const host=await startWorkspaceFixture(),browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:390,height:844},baseURL:host.baseUrl,reducedMotion:'reduce'});await context.route('**/*',r=>new URL(r.request().url()).origin===host.baseUrl?r.continue():r.abort());const page=await context.newPage();page.setDefaultTimeout(10000);
 type Tracked=EventSource&{errors:number};
 try{
  await page.addInitScript(()=>{const all:EventSource[]=[];(window as unknown as {r23Native:EventSource[]}).r23Native=all;const Native=window.EventSource;window.EventSource=class extends Native{errors=0;constructor(url:string|URL,options?:EventSourceInit){super(url,options);all.push(this);this.addEventListener('error',()=>{this.errors++;});}};});
  await signIn(page,host);const a=await create(page,'Dinner in Tokyo');await page.locator('#new-case').click();const b=await create(page,'Dinner for two in Osaka');
  const select=async(id:string)=>{if(!(await page.locator('#plans').getAttribute('class')??'').split(/\s+/).includes('open'))await page.locator('#menu').click();await page.locator('.case-link[data-case-id="'+id+'"]').click();await page.waitForFunction(id=>document.querySelector('.case-link.active')?.getAttribute('data-case-id')===id,id);};
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+1000));await page.route('**/events',r=>r.abort('connectionrefused'));
  const broken=async(id:string)=>{await select(id);await page.waitForFunction(()=>{const streams=(window as unknown as {r23Native:Array<EventSource&{errors:number}>}).r23Native;return streams.at(-1)!.readyState===EventSource.CONNECTING&&streams.at(-1)!.errors>0;});};
  const fire=async(which:'last'|'old',type:'open'|'error',closed=false)=>page.evaluate(({which,type,closed})=>{const all=(window as unknown as {r23Native:EventSource[]}).r23Native,stream=which==='old'?all.at(-2)!:all.at(-1)!;if(closed)stream.close();stream.dispatchEvent(new Event(type));},{which,type,closed});
  // A real native EventSource begins CONNECTING on a transport error; page clock
  // controls only our debounce, and dispatchEvent schedules explicit late events.
  await broken(a);assert.equal(await page.locator('#reconnecting').isVisible(),false);await page.clock.fastForward(4999);assert.equal(await page.locator('#reconnecting').isVisible(),false);await fire('last','open');await page.clock.fastForward(1);assert.equal(await page.locator('#reconnecting').isVisible(),false);await shot(page,'round23-r2-short-reconnect');
  await select(b);await broken(a);await page.clock.fastForward(3000);await fire('last','error');await page.clock.fastForward(1999);assert.equal(await page.locator('#reconnecting').isVisible(),false);await page.clock.fastForward(1);assert.equal(await page.locator('#reconnecting').isVisible(),true);assert.equal(await page.locator('#reconnecting').evaluate(n=>getComputedStyle(n).borderRadius),'999px');await shot(page,'round23-r2-five-second-pill');await fire('last','open');assert.equal(await page.locator('#reconnecting').isVisible(),false);
  await select(b);await broken(a);await page.clock.fastForward(4000);await broken(b);await page.clock.fastForward(1000);assert.equal(await page.locator('#reconnecting').isVisible(),false,'old timer cannot appear on another plan');await fire('old','open');await fire('old','error');await page.clock.fastForward(3999);assert.equal(await page.locator('#reconnecting').isVisible(),false);await page.clock.fastForward(1);assert.equal(await page.locator('#reconnecting').isVisible(),true,'late old events cannot erase the current timer');await shot(page,'round23-r2-replacement-ownership');
  await fire('last','error',true);assert.equal(await page.locator('#reconnecting').isVisible(),false);await page.clock.fastForward(6000);assert.equal(await page.locator('#reconnecting').isVisible(),false);await shot(page,'round23-r2-closed');
  await select(a);await broken(b);await page.clock.fastForward(4000);await fire('last','error',true);await page.clock.fastForward(2000);assert.equal(await page.locator('#reconnecting').isVisible(),false,'CLOSED clears a pending debounce before it can fire');
  const current=(await(await page.request.get('/api/cases/'+encodeURIComponent(b))).json()).view as RestaurantCaseView;current.case.status='ACTIVE';current.case.phase='SEARCHING';current.restaurant.progress.active=true;await page.route('**/api/cases/'+encodeURIComponent(b),r=>r.fulfill({json:{view:current}}));
  let listReads=0;const summaries=(await(await page.request.get('/api/cases')).json()).cases as RestaurantCaseView['case'][];const active=summaries.find(c=>c.caseId===a)!;active.status='ACTIVE';active.phase='SEARCHING';await page.route('**/api/cases',r=>{if(r.request().method()==='GET'){listReads++;return r.fulfill({json:{cases:summaries}});}return r.continue();});current.case.taskVersion++;await page.evaluate(view=>{const all=(window as unknown as {r23Native:EventSource[]}).r23Native;all.at(-1)!.dispatchEvent(new MessageEvent('case',{data:JSON.stringify(view)}));window.dispatchEvent(new Event('focus'));},current);await page.clock.runFor(1800);await page.waitForFunction(id=>document.querySelector('.case-link[data-case-id="'+id+'"] small')?.textContent==='In progress',a);const n=listReads;await page.clock.fastForward(1800);await page.waitForFunction(()=>document.querySelector('.case-link small')!==null);for(let i=0;i<20&&listReads===n;i++)await new Promise(r=>setTimeout(r,20));assert.ok(listReads>n,'CLOSED still schedules the sidebar background sync');
 }finally{await context.close();await browser.close();await host.close();}
});
