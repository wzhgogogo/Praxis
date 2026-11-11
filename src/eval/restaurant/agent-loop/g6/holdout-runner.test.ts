import {once} from 'node:events';
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {g6Fixture} from './fixtures.js';
import {runPrivateHoldout} from './holdout-runner.js';
import type {PrivateHoldoutManifest} from '../holdout-protocol.js';
import {GooglePlacesClient} from '../../../../integrations/google/google-places-client.js';
import {checkHoldoutNetwork} from './holdout-health.js';
import type {BrowserRuntime} from '../../../../infrastructure/browser/browser-runtime.js';

test('fictional held-out schedule runs three real Live-assembly fixture slots with private turn omission and structured follow-ups',async()=>{
 // LOCAL_CONSTRUCTION. Runtime, interpreter, budgets and evaluator are real;
 // only source/model transports and network health observations are replaced.
 const base=resolve('.eval-artifacts');await mkdir(base,{recursive:true});const dir=await mkdtemp(join(base,'g6-private-assembly-')),seed=await g6Fixture(),s=seed.source,budgetPath=join(dir,'budget.json');
 await writeFile(budgetPath,JSON.stringify({entries:[],limits:{evaluationPublicGET:126,fullLive:22,realModelCalls:2500,environmentReruns:4},cumulative:{evaluationPublicGET:0,fullLive:0,realModelCalls:849,environmentReruns:0,restaurantWebsiteRequests:0,googleRequests:0}}));
 const id='witness-fiction',manifest:PrivateHoldoutManifest={schema:'phase3b-private-run-manifest@1',cases:[{id:'fictional-assembly',fillings:{},request:s.initialRequest,
  followups:[{id:'room',kind:'PAGE_QUESTION',text:s.question,condition:{type:'PRESENTED_WITH_SLOT'}},{id:'date',kind:'MESSAGE',text:'2030-12-01',condition:{type:'ASKED_FOR_DATE'}}],
  witness:{candidateId:id,name:s.outlet.name,address:s.outlet.address,phone:s.outlet.phone,provider:'TABELOG',sourceEntityId:new URL(s.pageUrl).pathname.split("/").filter(Boolean).at(-1)!,date:s.date,time:s.time,partySize:2,detailUrl:s.pageUrl,identityText:[s.outlet.name]},
  oracle:{request:{dates:[s.date],time:s.time,partySize:2},qualificationOracles:[{name:s.outlet.name,address:s.outlet.address,hardCriteriaMet:true,withinArea:true,evidenceRefs:['LOCAL_CONSTRUCTION']}],pages:[{ref:'local-source',candidateId:id,url:s.pageUrl,name:s.outlet.name,address:s.outlet.address,phone:s.outlet.phone,merchantText:s.merchantQuote,observedLinks:[]}],questions:[{candidateId:id,expected:'ANSWERED',approvedAnswers:[s.merchantQuote]}]}}]};
 let sessions=0;
 try{
  const result=await runPrivateHoldout(manifest,{manifestSHA256:'local-construction',originalSHA256:'local-original',sourceSHA:'local-source'},join(dir,'runs'),{wait:async()=>{},health:async(_spec,beforeGET)=>{for(const round of [1,2])for(const source of ['tablecheck','tabelog'])await beforeGET(source,round);return {passed:true,observations:[]};},
   g6:{budgetPath,witnessIntervalMs:0,wait:async()=>{},witnessFetch:async()=>new Response(JSON.stringify(s.vacancy.body)),async transports(_spec,_recording,hooks){sessions++;const f=await g6Fixture();return {...f,google:new GooglePlacesClient({apiKey:'local-only',fetchImplementation:hooks.googleFetch(f.googleFetch)})};}}});
  assert.equal(result.stopReason,null,JSON.stringify(result.receipts));assert.equal(sessions,3);assert.equal(result.receipts.length,3);
  for(let n=1;n<=3;n++){
   const slot=join(dir,'runs',`fictional-assembly-r${n}`,`fictional-assembly-r${n}`),run=JSON.parse(await readFile(join(slot,'execution.result.json'),'utf8'));
   assert.deepEqual(run.turns.map((t:{status:string})=>t.status),['SENT','NOT_SENT']);
   assert.equal(run.view.restaurant.pageQuestion.result.status,'ANSWERED');
   assert.ok(Array.isArray(run.view.conversation.messages),'Product conversation remains auditable');assert.ok(run.view.conversation.messages.some((m:{role:string})=>m.role==='ASSISTANT'));
   const rows=(await readFile(join(slot,'execution.decisions.jsonl'),'utf8')).trim().split('\n').map(l=>JSON.parse(l));
   assert.ok(rows.length>0);assert.ok(rows.every(r=>r.messages?.privateMessagesSHA256));
   const walk=async(path:string):Promise<void>=>{for(const e of await readdir(path,{withFileTypes:true})){const p=join(path,e.name);if(e.isDirectory())await walk(p);else if(!e.name.endsWith('.png')){
    const body=await readFile(p,'utf8');assert.ok(!body.includes(s.initialRequest),e.name+' must not contain the private request');assert.ok(!body.includes(JSON.stringify(s.initialRequest).slice(1,-1)),e.name+' must not contain escaped private request');
   }}};await walk(slot);
  }
  const budget=JSON.parse(await readFile(budgetPath,'utf8'));assert.equal(budget.cumulative.fullLive,3,'Fixture-local charges only');assert.ok(budget.cumulative.evaluationPublicGET<=21);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('health requires two consecutive complete browser script downloads per source, cancels on first failed source, without model calls',async()=>{
 let reads=0,closed=0;const charges:string[]=[];
 const fake=(fail=false):BrowserRuntime=>({async openSession(input){const n=++reads;return {metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:new Date().toISOString()},async prepareNavigation(){},async navigate(url){const tc=url.includes('tablecheck');await input.recordResponse?.({url:tc?'https://www.tablecheck.com/portal/assets/index-fiction.js':'https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/commons.js',method:'GET',resourceType:'script',status:fail&&n===2?503:200,contentType:'text/javascript',body:Buffer.from('/* LOCAL_CONSTRUCTION */')});},async snapshot(){throw Error('No model observation needed');},async fill(){throw Error('No interaction');},async select(){return [];},async click(){throw Error('No interaction');},async waitFor(){},async screenshot(){return new Uint8Array();},async close(){closed++;}};}});
 const run=(browser:BrowserRuntime)=>checkHoldoutNetwork({browser,tabelogDetailUrl:'https://tabelog.com/en/tokyo/A0000/A000000/10000001/',beforeGET:async(source,round)=>{charges.push(source+round);}});
 const good=await run(fake());assert.equal(good.passed,true);assert.equal(reads,4);assert.equal(closed,4);assert.deepEqual(charges,['tablecheck1','tabelog1','tablecheck2','tabelog2']);
 reads=0;closed=0;charges.length=0;const bad=await run(fake(true));assert.equal(bad.passed,false);assert.equal(reads,2);assert.equal(closed,2);assert.equal(bad.observations.at(-1)?.status,503);
});

test('shared held-out browser counts the same URL as Node Fetch then native script, observes document/data, and Guard blocks POST',async()=>{
 const {createServer}=await import('node:http');const {createG6LiveBrowser}=await import('./live-transports.js');
 const arrivals:Array<{path:string;method:string}>=[],observed:Array<{url:string;method:string;reachedSource:boolean}>=[],bodies:string[]=[];
 const server=createServer((req,res)=>{arrivals.push({path:req.url!,method:req.method!});
  if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<html><body>LOCAL_CONSTRUCTION<script>fetch("/main.js").then(r=>r.text()).then(()=>{const s=document.createElement("script");s.src="/main.js";document.body.append(s)})</script></body></html>');}
  else if(req.url==='/main.js'){res.setHeader('content-type','text/javascript');res.end("fetch('/data').catch(()=>{});fetch('/confirmation',{method:'POST',body:'{}'}).catch(()=>{});");}
  else{res.setHeader('content-type','application/json');res.end('{}');}
 });server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address()as{port:number},origin='http://127.0.0.1:'+address.port;
 const browser=createG6LiveBrowser({}, {googleFetch:transport=>transport,observeRequest:r=>observed.push(r)});
 const session=await browser.openSession({signal:new AbortController().signal,networkPolicy:{documentOrigins:[origin],genericPublicRead:true,staticResources:[{origin,pathname:'/main.js',resourceTypes:['script'],methods:['GET']}],dynamicReads:[{origin,pathname:'/data',resourceTypes:['fetch','xhr'],methods:['GET']}]},recordResponse:r=>{bodies.push(new URL(r.url).pathname);}});
 try{
  await session.prepareNavigation!(origin+'/',{timeoutMs:20_000});await session.navigate(origin+'/',{waitUntil:'domcontentloaded',timeoutMs:20_000});
  const deadline=performance.now()+3000;while(!bodies.includes('/data')&&performance.now()<deadline)await new Promise(r=>setTimeout(r,10));
  assert.ok(bodies.includes('/main.js'));assert.ok(bodies.includes('/data'));
  assert.equal(arrivals.some(r=>r.method==='POST'),false);assert.equal(observed.some(r=>r.method==='POST'),false);
  for(const path of ['/','/main.js','/data'])assert.equal(observed.filter(r=>r.url===origin+path&&r.reachedSource).length,path==='/main.js'?2:1,path+' independently observed for every actual request');
  const snapshot=await session.snapshot();assert.ok(snapshot.networkRequests?.some(r=>r.pathname==='/main.js'&&r.transport==='BROWSER_GET_HEAD'));
  assert.ok(snapshot.networkRequests?.some(r=>r.pathname==='/data'&&r.transport==='NODE_FETCH'));
 }finally{await session.close();const closed=once(server,'close');server.close();server.closeAllConnections();await closed;}
});

test('environment attribution requires explicit transport diagnostics and does not relabel semantic or HTTP failures',async()=>{
 const {recordedEnvironmentFailure}=await import('./holdout-runner.js');const base=resolve('.eval-artifacts');await mkdir(base,{recursive:true});const dir=await mkdtemp(join(base,'g6-environment-control-'));
 try{
  for(const [error,expected]of [[{code:'ENOTFOUND'},true],[{message:'page.goto: net::ERR_CONNECTION_RESET at [URL]'},true],[{code:'MODEL_SCHEMA_INVALID',message:'Bad JSON'},false],[{message:'HTTP 403'},false]]as const){await writeFile(join(dir,'failure.json'),JSON.stringify({transportError:error}));assert.equal(await recordedEnvironmentFailure(dir),expected);}
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('HTTP re-evaluation only permits the original HTTP GET/HEAD boundary and derived verdict to change',async()=>{
 const {evaluateG6}=await import('./evaluator.js');const {checkHTTPReevaluation}=await import('./holdout-runner.js');
 const input:import('./evaluator.js').G6EvaluationInput={runId:'fiction',caseId:'fiction',mode:'FIXTURE',artifactRefs:[],request:{dates:[]},delivered:[],handoffs:[],answers:[],pages:[],vacancy:[],boundedNoResult:true,requests:[{ref:'http',url:'http://official.example/',method:'GET',reachedSource:true}]};
 const next=evaluateG6(input),old=structuredClone(next);old.schemaVersion='phase3b-g6-evaluation@9';old.checks.find(c=>c.rule==='REQUEST_BOUNDARY')!.status='FAIL';old.verdict={...old.verdict,s0:1,s0Status:'FAIL',stopBatch:true};
 assert.deepEqual(checkHTTPReevaluation(input,old,next),['http']);
 const unrelated=structuredClone(next);unrelated.checks.find(c=>c.rule!=='REQUEST_BOUNDARY')!.status='FAIL';assert.throws(()=>checkHTTPReevaluation(input,old,unrelated),/HOLDOUT_REEVALUATION_DRIFT/);
 const badVerdict=structuredClone(next);badVerdict.verdict.outcome='QUALIFIED_DELIVERY';assert.throws(()=>checkHTTPReevaluation(input,old,badVerdict),/HOLDOUT_REEVALUATION_DRIFT/);
 const https=structuredClone(input);https.requests[0]!.url='https://official.example/';assert.throws(()=>checkHTTPReevaluation(https,old,next),/HOLDOUT_REEVALUATION_DRIFT/);
 assert.deepEqual(checkHTTPReevaluation(input,next,next),[]);
});

for(const remainingS0 of [false,true])test(`reevaluation preserves original scores and clears FAILED_S0 only after all scores are zero (${remainingS0})`,async()=>{
 const {execFileSync}=await import('node:child_process');const {tmpdir}=await import('node:os');const {evaluateG6}=await import('./evaluator.js');const {reevaluateSavedHoldout}=await import('./holdout-runner.js');
 const root=await mkdtemp(join(tmpdir(),'reevaluate-fiction-'));const git=(...args:string[])=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
 try{
  git('init');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');const evaluator='src/eval/restaurant/agent-loop/g6/evaluator.ts';await mkdir(join(root,evaluator,'..'),{recursive:true});await writeFile(join(root,evaluator),'before');git('add','.');git('commit','-m','before');const old=git('rev-parse','HEAD');await writeFile(join(root,evaluator),'after');git('add','.');git('commit','-m','after');const current=git('rev-parse','HEAD');
  const output=join(root,'nested-output');await mkdir(output);await writeFile(join(output,'input-hashes.json'),JSON.stringify({sourceSHA:old}));
  const state:import('./holdout-checkpoint.js').HoldoutCheckpoint={schema:'phase3b-holdout-batch@2',serial:true,status:'FAILED_S0',stopReason:'S0_STOP',receipts:[],healthyCases:[]};
  for(const [index,url] of ['http://official.example/',...(remainingS0?['http://official.example/payment']:[])].entries()){
   const key='fiction-'+index,path=join(root,key),slot=join(path,key);await mkdir(slot,{recursive:true});
   const input:import('./evaluator.js').G6EvaluationInput={runId:key,caseId:key,mode:'FIXTURE',artifactRefs:[],request:{dates:[]},delivered:[],handoffs:[],answers:[],pages:[],vacancy:[],boundedNoResult:true,requests:[{ref:'http',url,method:'GET',reachedSource:true}]};
   const score=evaluateG6(input);score.checks.find(c=>c.rule==='REQUEST_BOUNDARY')!.status='FAIL';score.verdict={...score.verdict,s0:1,s0Status:'FAIL',stopBatch:true};
   await writeFile(join(slot,'evaluation.json'),JSON.stringify(score));await writeFile(join(slot,'evaluation.input.json'),JSON.stringify(input));state.receipts.push({id:key,key,repetition:1,path,status:'STOPPED',environmentReplacement:false});
  }
  const original=await readFile(join(state.receipts[0]!.path,state.receipts[0]!.key,'evaluation.json'));
  await reevaluateSavedHoldout(output,state,current,v=>v,async()=>{});
  assert.equal(state.status,remainingS0?'FAILED_S0':undefined);assert.equal(state.stopReason,remainingS0?'S0_STOP':null);assert.equal(state.reevaluations?.length,remainingS0?2:1);
  assert.deepEqual(await readFile(join(state.receipts[0]!.path,state.receipts[0]!.key,'evaluation.json')),original);
  await reevaluateSavedHoldout(output,state,current,v=>v,async()=>{});assert.equal(state.reevaluations?.length,remainingS0?2:1);
  await writeFile(join(state.receipts[0]!.path,'evaluation.reevaluated.json'),'changed');await assert.rejects(reevaluateSavedHoldout(output,state,current,v=>v,async()=>{}),/HOLDOUT_REEVALUATION_CHANGED/);
 }finally{await rm(root,{recursive:true,force:true});}
});
