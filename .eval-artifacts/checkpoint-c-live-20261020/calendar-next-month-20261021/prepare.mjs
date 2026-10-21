// Offline request preparation. All source assets are fulfilled from saved bytes.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {BrowserTaskExecutor} from '../../../src/infrastructure/browser/browser-task-executor.ts';
import {PlaywrightControlRegistry} from '../../../src/infrastructure/browser/playwright-browser-controls.ts';
import {ModelBrowserReadActionDecision} from '../../../src/infrastructure/browser/browser-action-decision.ts';
import {restaurantDiscoveryPacks} from '../../../src/integrations/restaurant-search/source-packs.ts';
import {tabelogQueryControlHints} from '../../../src/integrations/tabelog/tabelog-query-controls.ts';
import {buildRestaurantAgentDecisionSystemPrompt} from '../../../src/domains/restaurant/agent-decision.ts';
const dir='.eval-artifacts/checkpoint-c-live-20261020/calendar-next-month-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex');
globalThis.fetch=()=>{throw Error('OFFLINE_PREPARATION_NO_FETCH');};
const seeds=(await fs.readFile(`${dir}/inputs/seeds.jsonl`,'utf8')).trim().split('\n').map(JSON.parse);
const oracle=JSON.parse(await fs.readFile(`${dir}/inputs/oracle.json`));
if(seeds.length!==69||oracle.answers.length!==69)throw Error('SAME_69_REQUIRED');
await fs.mkdir(`${dir}/prepared`);
const browser=await chromium.launch({channel:'chrome',headless:true});
const rows=[];
try{for(const seed of seeds){
 const answer=oracle.answers.find(a=>a.id===seed.id);
 const htmlPath=`${dir}/inputs/saved/${answer.htmlPath}`,html=await fs.readFile(htmlPath);
 if(sha(html)!==answer.htmlSha256)throw Error('HTML_PROVENANCE_CHANGED');
 const original=JSON.parse(seed.captured.messages.find(m=>m.role==='user').content);
 // The historical HTML sanitizer dropped URL fragments. Restore only the
 // two calendar anchors' exact hrefs from the original captured observation;
 // otherwise the saved same-page '#' click becomes an OPEN_LINK navigation.
 // No label/group/month is injected. Keep both byte hashes and this audit.
 const restoredHrefs=[];
 const renderedHtml=html.toString().replace(/<a\b[^>]*>/g,tag=>{
  const ref=tag.includes('calendar-navi-target--next')?answer.expectedRef:tag.includes('calendar-navi-target--prev')?answer.calendarPreviousRefs[0]:null;
  if(!ref)return tag;
  const t=original.observation.targets.find(t=>t.ref===ref);
  if(!t?.href?.endsWith('#')||t.href.slice(0,-1)!==original.observation.url)throw Error('NO_CAPTURED_FRAGMENT_PROVENANCE');
  restoredHrefs.push({originalRef:ref,href:t.href,reason:'Saved HTML sanitizer removed fragment; original observation retained it'});
  return tag.replace(/href="[^"]*"/,`href="${t.href}"`);
 });
 const styles=JSON.parse(await fs.readFile(path.join(path.dirname(htmlPath),'stylesheets.json')));
 const resources=new Map();
 for(const s of styles.stylesheets){const b=await fs.readFile(path.join(path.dirname(htmlPath),s.file));if(sha(b)!==s.sha256)throw Error('CSS_PROVENANCE_CHANGED');resources.set(s.url,b);}
 const context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block',viewport:{width:1280,height:720}});
 const registry=new PlaywrightControlRegistry();let controls=[],rebuilt,request;const localRoutes={document:0,stylesheet:0,aborted:0};
 try{
  const page=await context.newPage();
  await context.routeWebSocket('**/*',socket=>socket.close());
  await context.route('**/*',async route=>{
   const r=route.request();
   if(r.resourceType()==='document'&&r.isNavigationRequest()&&r.frame()===page.mainFrame()&&r.url()===original.observation.url){localRoutes.document++;return route.fulfill({status:200,contentType:'text/html',body:renderedHtml});}
   if(r.resourceType()==='stylesheet'&&resources.has(r.url())){localRoutes.stylesheet++;return route.fulfill({status:200,contentType:'text/css',body:resources.get(r.url())});}
   localRoutes.aborted++;return route.abort();
  });
  await page.goto(original.observation.url,{waitUntil:'load'});
  const snapshot=async()=>({url:original.observation.url,title:await page.title(),html:await page.content(),text:await page.locator('body').innerText()});
  const noAction=async()=>{throw Error('STATIC_REPLAY_NO_ACTION');};
  const session={metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:new Date().toISOString(),...(original.observation.pageActions?.includes('PRESS_ESCAPE')?{readNetworkBoundary:'INSTALLED'}:{})},snapshot,
   observeControls:async hints=>(controls=await registry.observe(page,hints)),navigate:noAction,click:noAction,fill:noAction,select:noAction,waitFor:async()=>{},screenshot:async()=>new Uint8Array(),pressEscape:noAction,close:async()=>{}};
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:300000,maxModelCallsPerCandidate:6,maxModelCallsTotal:12,maxOperationsPerCandidate:24,modelDecision:{async decide(value){
   // Preserve the captured decision context/history. Only the DOM observation
   // and the current production prompt/skills are rebuilt; no oracle is passed.
   rebuilt={...value,progress:original.progress,history:original.history??[]};
   return {type:'REQUEST_HUMAN_HELP',reason:'Offline production input capture only'};
  }}});
  executor.beginProvider(original.goal.outlet.name,original.source,original.stage);
  await executor.runSkill({taskId:original.taskId??seed.id,source:original.source,stage:original.stage,session,signal:new AbortController().signal,
   allowedOrigins:[new URL(original.observation.url).origin],goal:original.goal,objective:original.objective,methodReason:original.progress,
   ...(original.source==='TABELOG'?{controlHints:tabelogQueryControlHints}:{}),
   sourceSkillPath:restaurantDiscoveryPacks.find(p=>p.browser?.provider===original.source)?.skillPath,
   completion:()=>({complete:false,reason:original.progress})});
  if(!rebuilt)throw Error('NO_PRODUCTION_OBSERVATION');
  // Independent DOM oracle: the saved calendar anchor, never a positional Next
  // or the production group's/label's classification. Bind by element identity.
  const expected=page.locator('a.p-booking-calendar__calendar-navi-target--next');
  if(await expected.count()!==1||!(await expected.textContent()).includes('Next month'))throw Error('DOM_ORACLE_AMBIGUOUS');
  const expectedNode=await expected.elementHandle();const eligible=controls.filter(c=>c.visible&&!c.blockedByActiveLayer&&(!c.observationOnly||c.calendarDate!==undefined)&&(c.kind!=='LINK'||c.href!==undefined));
  let ordinal=0,expectedRef,binding;
  for(const c of eligible){ordinal++;if(c.kind==='LINK'&&c.structure?.classes.includes('p-booking-calendar__calendar-navi-target--next')){
    const node=await registry.target(c.id);if(await node.evaluate((a,b)=>a===b,expectedNode)){expectedRef=`observation:${rebuilt.observation.revision}:target:${ordinal}`;binding={controlId:c.id,stableKey:c.stableKey,outerHTML:await node.evaluate(n=>n.outerHTML)};}
   }if(c.kind==='SELECT'&&!c.disabled)ordinal+=(c.options??[]).length;}
  const target=rebuilt.observation.targets.find(t=>t.ref===expectedRef);
  if(!target||target.kind!=='LINK'||target.label!=='Next month'||target.controlGroupLabel!=='Calendar'||!target.availableActions.includes('CLICK')||rebuilt.observation.displayedCalendarMonth?.month!==10)throw Error(`PRODUCTION_V3_PREFLIGHT:${seed.id}:${JSON.stringify({target,month:rebuilt.observation.displayedCalendarMonth})}`);
  const capture=new ModelBrowserReadActionDecision({complete:async r=>{request=r;return {invocationId:'offline',provider:'FIXTURE',model:'offline',outputText:JSON.stringify({action:'REQUEST_HUMAN_HELP',targetRef:'',authoritativeField:'NONE',requestedState:'NONE',reason:'Offline request capture'}),finishReason:'TOOL_CALLS',latencyMs:0};}});
  await capture.decide(rebuilt);
  const row={id:seed.id,originalSequence:seed.sequence,htmlPath,htmlSha256:sha(html),renderedHtmlSha256:sha(renderedHtml),restoredHrefs,requestSha256:sha(JSON.stringify(request)),request,input:rebuilt,expected:{action:'CLICK',targetRef:expectedRef,originalRef:answer.expectedRef,rule:answer.rule,binding},localRoutes,sourceRequests:0,modelCalls:0};
  await fs.writeFile(`${dir}/prepared/${seed.id}.json`,JSON.stringify(row,null,2),{flag:'wx'});rows.push({id:row.id,requestSha256:row.requestSha256,expectedRef,targets:rebuilt.observation.targets.length,month:rebuilt.observation.displayedCalendarMonth,localRoutes});
  await executor.close();
 }finally{await registry.dispose();await context.close();}
 if(rows.length%10===0)console.log(JSON.stringify({prepared:rows.length,total:69}));
}}finally{await browser.close();}
// Selection context/contract did not change. Require the prepared requests'
// system prompt to equal the current production builder before reuse.
const selection=JSON.parse(await fs.readFile('.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck/prepared-inputs.json'));
const approved=JSON.parse(await fs.readFile('.eval-artifacts/checkpoint-c-integration-20261020/selection-recheck/prepared-requests.json'));
for(const s of selection){const r=approved.find(r=>r.seedId===s.id);if(!r||r.requestSha256!==s.requestSha256||sha(JSON.stringify(r.request))!==s.requestSha256||r.request.messages.find(m=>m.role==='system').content!==buildRestaurantAgentDecisionSystemPrompt())throw Error('SELECTION_PRODUCTION_PROMPT_MISMATCH');s.request=r.request;}
await fs.writeFile(`${dir}/prepared/selection.json`,JSON.stringify(selection,null,2),{flag:'wx'});
await fs.writeFile(`${dir}/prepared/summary.json`,JSON.stringify({schema:'calendar-production-rebuild@1',status:'PREPARED_NO_MODELS',websiteRequests:0,modelCalls:0,calendarCount:rows.length,selectionCount:selection.length,rows},null,2),{flag:'wx'});
console.log(JSON.stringify({status:'PREPARED_NO_MODELS',calendar:rows.length,selection:selection.length}));
