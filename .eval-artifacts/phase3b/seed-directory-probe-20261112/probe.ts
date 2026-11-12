/** Frozen one-off diagnostic, not production behavior or an acceptance runner.
 * Source metadata in config was observed in prior public DOM. Only native
 * clicks/selectOption are used; evaluate callbacks only read DOM. No model.
 */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,type Page} from 'playwright-core';
import {LocalPlaywrightChromium} from '../../../src/infrastructure/browser/local-playwright-chromium.js';
import {localBrowserProxyFromEnvironment} from '../../../src/infrastructure/browser/local-browser-proxy.js';
import {BrowserTaskExecutor} from '../../../src/infrastructure/browser/browser-task-executor.js';
import {discoveryPackNetworkPolicy,tabelogDiscoveryPack} from '../../../src/integrations/restaurant-search/source-packs.js';
import {BrowserReadRecording} from '../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.js';
import type {BrowserSession} from '../../../src/infrastructure/browser/browser-runtime.js';
const root=dirname(fileURLToPath(import.meta.url)),config=JSON.parse(readFileSync(join(root,'config.json'),'utf8'));
const budgetPath=join(root,'active-budget-seed-probe-20261112.json'),budget=JSON.parse(readFileSync(budgetPath,'utf8'));
let page:Page;
const hash=(b:string|Buffer)=>createHash('sha256').update(b).digest('hex');
const git=(...args:string[])=>execFileSync('git',args,{encoding:'utf8'}).trim();
const freeze=process.argv[process.argv.indexOf('--freeze-sha')+1];
async function readDOMState(page:Page,fields:Record<string,string>){
 return page.evaluate((fields)=>{
  const form=[...document.forms].find(f=>Object.values(fields).every(name=>f.elements.namedItem(name)));
  const text={clean(s:string|null){return s?.replace(/\s+/g,' ').trim()??'';}};
  return {title:document.title,url:location.href,
   headings:[...document.getElementsByTagName('h1')].map(e=>text.clean(e.textContent)),
   breadcrumbs:[...document.getElementsByTagName('ol')].filter(e=>/breadcrumb/i.test(e.className)).map(e=>text.clean(e.textContent)),
   form:form?{method:form.method,action:form.action,fields:[...form.elements].map(e=>({tag:e.tagName,name:e.getAttribute('name'),type:e.getAttribute('type'),value:(e as HTMLInputElement).value,visible:(e as HTMLElement).getClientRects().length>0,options:e instanceof HTMLSelectElement?[...e.options].map(o=>({label:o.label,value:o.value,selected:o.selected,disabled:o.disabled})):undefined}))}:null};
 },fields);
}
if(process.argv.includes('--validate-only')){
 if(budget.limits.publicGET!==8||budget.limits.realModelCalls!==20||budget.limits.fullLive!==0||budget.limits.environmentReruns!==0)throw Error('BUDGET_CONTRACT');
 console.log(JSON.stringify({configSHA256:hash(readFileSync(join(root,'config.json'))),scriptSHA256:hash(readFileSync(fileURLToPath(import.meta.url))),budgetSHA256:hash(readFileSync(budgetPath)),modelCalls:0}));process.exit(0);
}
if(process.argv.includes('--offline-browser-check')){
 const b=await chromium.launch({headless:true});try{page=await b.newPage();await page.route('**/*',route=>route.abort());await page.setContent('<form method="get"><input name="svd" type="hidden" value="20261210"><select name="svps"><option value="8">8 people</option></select><select name="svt"><option value="2030">8:30 PM</option></select><span data-date="20261210">10</span></form>');const details=await readDOMState(page,config.observedFormFields);if(!details.form)throw Error('LOCAL_FORM_MISSING');const date=await visibleHandle('form-date');if(!date)throw Error('LOCAL_DATE_MISSING');await date.dispose();console.log('PASS: actual transpiled DOM callbacks in local Chromium;0 website GET,0 model');}finally{await b.close();}process.exit(0);
}
if(!freeze||git('rev-parse','HEAD')!==freeze||git('status','--porcelain')||git('diff',config.sourceSHA,'HEAD','--','src'))throw Error('FROZEN_CLEAN_SOURCE_REQUIRED');
if(!process.execArgv.some(x=>x.startsWith('--env-file'))||process.env.PRAXIS_RUN_DIRECTORY_PROBE!=='1')throw Error('EXPLICIT_PROBE_AND_ENV_FILE_REQUIRED');
if(budget.status!=='APPROVED_FOR_EXECUTION'||budget.cumulative.publicGET>=budget.limits.publicGET||hash(readFileSync(budgetPath))!==process.argv[process.argv.indexOf('--budget-sha')+1])throw Error('APPROVED_CURRENT_LEDGER_REQUIRED');
const outputName=process.argv[process.argv.indexOf('--output-directory')+1];if(!/^[a-z0-9-]+$/.test(outputName??''))throw Error('EXPLICIT_NEW_OUTPUT_REQUIRED');const output=join(root,outputName);if(existsSync(output))throw Error('NO_OVERWRITE_OR_IMPLICIT_RETRY');await mkdir(output);
const policy=discoveryPackNetworkPolicy([tabelogDiscoveryPack]);
const recorder=new BrowserReadRecording({directory:output,runId:'directory-probe',reviewedStaticResources:policy.staticResources,reviewedReads:policy.dynamicReads,ownCredentials:Object.entries(process.env).filter(([key,value])=>/API_KEY|SECRET|PASSWORD|TOKEN/.test(key)&&value&&value.length>=8).map(([,v])=>v!)});
const records:any[]=[],stages:any[]=[],rawRequests:any[]=[],scriptedDecisions:any[]=[];
let session:BrowserSession|undefined,lastGET=0,sequence=0,stopping=false,queue=Promise.resolve();
const record=(kind:string,detail:unknown)=>{records.push({sequence:++sequence,kind,detail});recorder.record(kind,detail);};
const charge=async(url:string)=>{
 const waited=Math.max(0,config.minimumGETIntervalMs-(Date.now()-lastGET));if(waited)await new Promise(r=>setTimeout(r,waited));
 if(budget.cumulative.publicGET>=budget.limits.publicGET){stopping=true;throw Error('PUBLIC_GET_BUDGET_EXHAUSTED');}
 lastGET=Date.now();budget.cumulative.publicGET++;
 budget.entries.push({id:'B:document:'+budget.cumulative.publicGET,publicGET:1,atUTC:new Date().toISOString(),urlSHA256:hash(url),note:'Charged document attempt before Guard admission; conservative includes blocked attempts'});
 writeFileSync(budgetPath,JSON.stringify(budget,null,2)+'\n');record('DOCUMENT_GET_CHARGED',{number:budget.cumulative.publicGET,url});
};
const runtime=new LocalPlaywrightChromium({...localBrowserProxyFromEnvironment(process.env),headless:true,browserType:{async launch(options){
 const browser=await chromium.launch(options),newContext=browser.newContext.bind(browser);
 browser.newContext=async options=>{
  const context=await newContext(options),route=context.route.bind(context),newPage=context.newPage.bind(context);
  context.newPage=async()=>{page=await newPage();return page;};
  context.route=(pattern,handler,options)=>route(pattern,async(actual,request)=>{
   if(request.method()!=='GET'){record('NON_GET_ABORTED',{method:request.method(),resourceType:request.resourceType()});await actual.abort('blockedbyclient');return;}
   if(request.isNavigationRequest()&&request.resourceType()==='document'){
    try{queue=queue.then(()=>charge(request.url()));await queue;}catch{await actual.abort('blockedbyclient');return;}
   }
   return handler(actual,request);
  },options);
  context.on('request',r=>rawRequests.push({method:r.method(),resourceType:r.resourceType(),urlSHA256:hash(r.url())}));
  return context;
 };return browser;
}}});
const available=()=>{if(stopping||budget.cumulative.publicGET>=budget.limits.publicGET)throw Error('PUBLIC_GET_BUDGET_EXHAUSTED');};
async function capture(label:string){
 if(!session)throw Error('NO_SESSION');await session.waitForSettled?.(await session.snapshot(),2000);
 const snapshot=await session.snapshot();recorder.recordSnapshot(snapshot);recorder.recordNetwork(snapshot.networkRequests??[]);
 if(session.screenshotLayoutOnly)await recorder.captureScreenshot(await session.screenshotLayoutOnly(),'LAYOUT_ONLY_CONTENT_MASKED');
 const controls=await session.observeControls!();record('CONTROLS',{label,controls});
 const details=await readDOMState(page,config.observedFormFields);
 const row={label,checkedAtUTC:new Date().toISOString(),snapshotIndex:stages.length+1,...details};stages.push(row);record('STAGE',row);return row;
}
async function nativeChoice(field:'PARTY_SIZE'|'TIME',name:string,expected:string){
 available();let calls=0;const diagnostics:any[]=[];
 const executor=new BrowserTaskExecutor(runtime,{maxAutomaticElapsedMs:45000,maxElapsedMsPerProvider:45000,maxModelCallsPerCandidate:3,maxModelCallsTotal:3,maxOperationsPerCandidate:40,onDiagnostic:e=>diagnostics.push(e),modelDecision:{async decide(input){
  calls++;const option=input.observation.targets.find(t=>t.kind==='OPTION'&&t.availableActions?.includes('CHOOSE_OPTION:'+field));
  const proposal=option?{type:'CHOOSE_OPTION' as const,field,targetRef:option.ref,reason:'Scripted probe chooses existing authoritative native option'}:{type:'REQUEST_HUMAN_HELP' as const,reason:'Current executor does not offer the requested native option'};
  scriptedDecisions.push({sequence:scriptedDecisions.length+1,phase:field,proposal,observation:input.observation});return proposal;
 }}});
 const result=await executor.runSkill({taskId:'B-native-select',source:'DIRECTORY',stage:'DISCOVERY',session:session!,signal:new AbortController().signal,allowedOrigins:policy.documentOrigins,goal:{outlet:{name:'Public directory probe'},...config.goal,hardCriteria:[]},objective:'Read-only native select capability diagnostic',completion:(_snapshot,controls=[])=>({complete:controls.some(c=>c.kind==='SELECT'&&c.structure?.name===name&&c.value===expected),reason:'Only verify this native select value; not inventory or delivery',resultKey:name+':'+expected,resultBusy:false})});
 record('NATIVE_SELECT_EXECUTOR',{field,name,expected,status:result.status,scriptedDecisionCount:calls,realModelCalls:0,diagnostics});return result.status==='COMPLETED';
}
async function visibleHandle(kind:'form-date'|'calendar-forward'|'category-trigger'|'category-link',text?:string){
 const handle=await page.evaluateHandle(({kind,text,c})=>{
  const form=[...document.forms].find(f=>Object.values(c.observedFormFields).every(name=>f.elements.namedItem(name as string)));
  const view={visible(e:Element){return !!(e as HTMLElement).getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden';}};
  if(kind==='form-date')return form?[...form.getElementsByTagName('span')].find(e=>e.getAttribute(c.recordedDateAttribute)===c.goal.date.replaceAll('-','')&&view.visible(e)):null;
  if(kind==='calendar-forward')return form?[...form.getElementsByTagName('button')].find(e=>e.classList.contains(c.recordedForwardClass)&&view.visible(e)&&!e.disabled):null;
  if(kind==='category-trigger'){const node=document.getElementById(c.recordedCategoryTriggerId);return node&&view.visible(node)?node:null;}
  const panel=document.getElementById(c.recordedCategoryPanelId);return panel?[...panel.getElementsByTagName('a')].find(e=>e.textContent?.replace(/\s+/g,' ').trim().toLowerCase()===text?.toLowerCase()&&view.visible(e)):null;
 },{kind,text,c:config});return handle.asElement();
}
async function openCategory(label:string){
 available();const trigger=await visibleHandle('category-trigger');if(trigger){await trigger.click({timeout:5000});await trigger.dispose();}
 await capture(label);
 const links=await page.evaluate(id=>{const p=document.getElementById(id);return p?[...p.getElementsByTagName('a')].map(e=>({label:e.textContent?.replace(/\s+/g,' ').trim(),href:e.href,visible:!!e.getClientRects().length})):[];},config.recordedCategoryPanelId);
 record('CATEGORY_LINKS',{label,links});return links;
}
async function clickObservedLink(label:string){
 available();const target=await visibleHandle('category-link',label);if(!target)return false;
 const href=await target.getAttribute('href');if(!href)throw Error('NO_OBSERVED_HREF');
 const destination=await target.evaluate(e=>(e as HTMLAnchorElement).href);record('OBSERVED_CATEGORY_LINK_CLICK',{label,destination});
 await session!.prepareObservedNavigation!(destination,{timeoutMs:20000});await target.click({timeout:20000});await target.dispose();return true;
}
const result:any={mode:config.mode,freezeSHA:freeze,sourceSHA:config.sourceSHA,startedAtUTC:new Date().toISOString(),questions:{nativeForm:{status:'NOT_COMPLETED'},cuisine:{status:'NOT_COMPLETED'},combined:{status:'NOT_TESTED'}},realModelCalls:0};
try{
 session=await runtime.openSession({signal:new AbortController().signal,networkPolicy:policy,recordResponse:r=>recorder.recordResponse(r)});
 await session.prepareNavigation!(config.entry,{timeoutMs:20000});await session.navigate(config.entry,{waitUntil:'domcontentloaded',timeoutMs:20000});
 await capture('entry');
 let ready=false;
 if(config.phase!=='CUISINE_CONTINUATION'){
 let dateSelected=false;
 for(let step=0;step<config.maximumCalendarUIActions;step++){
  available();const date=await visibleHandle('form-date');if(date){record('DATE_NATIVE_CLICK',{date:config.goal.date});await date.click({timeout:20000});await date.dispose();dateSelected=true;break;}
  const forward=await visibleHandle('calendar-forward');if(!forward)break;record('CALENDAR_NATIVE_ADVANCE',{step:step+1});await forward.click({timeout:5000});await forward.dispose();await capture('calendar-advance-'+(step+1));
 }
 await capture('after-date');
 const partySelected=await nativeChoice('PARTY_SIZE',config.observedFormFields.partySize,String(config.goal.partySize));await capture('after-party-select');
 const timeSelected=await nativeChoice('TIME',config.observedFormFields.time,config.goal.timeWindow.earliest.replace(':',''));const selected=await capture('after-time-select');
 const values=Object.fromEntries((selected.form?.fields??[]).filter((f:any)=>f.name).map((f:any)=>[f.name,f.value]));
 ready=dateSelected&&partySelected&&timeSelected&&values[config.observedFormFields.date]===config.goal.date.replaceAll('-','')&&values[config.observedFormFields.partySize]===String(config.goal.partySize)&&values[config.observedFormFields.time]===config.goal.timeWindow.earliest.replace(':','');
 result.questions.nativeForm={status:ready?'VALUES_SET':'NOT_ALL_REQUEST_VALUES_SET',dateSelected,partySelected,timeSelected,values,stage:selected.label};
 if(ready){
  available();const submits=(await session.observeControls!()).filter(c=>c.kind==='BUTTON'&&c.type==='submit'&&c.formMethod==='GET'&&c.formObservation&&c.visible&&!c.disabled);
  if(submits.length===1){record('OBSERVED_GET_FORM_SUBMIT',{method:selected.form.method,action:selected.form.action,target:submits[0]!.id});await session.click(submits[0]!.id,{timeoutMs:20000});await capture('native-form-submitted');result.questions.nativeForm.status='SUBMITTED';}
  else result.questions.nativeForm.status='NO_UNIQUE_OBSERVED_SUBMIT_CONTROL';
 }
 }else {result.questions.nativeForm={status:'PRIOR_RUN_SUBMITTED',evidence:'runtime-02/result.json'};ready=true;}
 let links=await openCategory('category-root'),found=false;const trail:string[]=[];
 for(let depth=0;depth<=config.categoryParentsToInspect.length;depth++){
  const exact=links.find((x:any)=>x.visible&&x.label?.toLowerCase()===config.criterion.toLowerCase());
  if(exact){if(await clickObservedLink(exact.label)){trail.push(exact.label);await capture('exact-cuisine-result');found=true;}break;}
  const parent=config.categoryParentsToInspect[depth];if(!parent||!links.some((x:any)=>x.visible&&x.label===parent))break;
  if(!await clickObservedLink(parent))break;trail.push(parent);await capture('category-level-'+(depth+1));links=await openCategory('category-panel-'+(depth+1));
 }
 result.questions.cuisine={status:found?'EXACT_CATEGORY_SELECTED':'NO_EXACT_CATEGORY_OBSERVED',trail,lastVisibleLinks:links.filter((x:any)=>x.visible)};
 result.questions.combined={status:found&&ready?'OBSERVE_FINAL_SCOPE_AND_PARAMETERS':'NOT_TESTED_PRECONDITIONS_NOT_BOTH_MET',finalStage:stages.at(-1)};
}catch(error){result.stopReason=error instanceof Error?error.message:'UNKNOWN_FAILURE';if(session)try{await capture('stopped');}catch{};record('PROBE_STOP',{reason:result.stopReason});}
finally{
 if(session){try{await session.flushRecordedResponses?.();}catch{};try{await session.close();}catch{}}
 result.finishedAtUTC=new Date().toISOString();result.consumption={...budget.cumulative};result.recording=await recorder.finish();
 await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');await writeFile(join(output,'stages.json'),JSON.stringify(stages,null,2)+'\n');await writeFile(join(output,'scripted-decisions.json'),JSON.stringify(scriptedDecisions,null,2)+'\n');await writeFile(join(output,'probe-events.json'),JSON.stringify(records,null,2)+'\n');await writeFile(join(output,'request-shapes.json'),JSON.stringify(rawRequests,null,2)+'\n');
 console.log(JSON.stringify({stopReason:result.stopReason,questions:result.questions,consumption:result.consumption,recording:result.recording}));
}
