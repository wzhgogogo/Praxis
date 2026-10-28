import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {BrowserTaskExecutor} from '../../../src/infrastructure/browser/browser-task-executor.ts';
import {TabelogBrowserAvailability} from '../../../src/integrations/tabelog/tabelog-browser-availability.ts';
import {ModelNamedSourceQuery} from '../../../src/integrations/restaurant-search/named-source-query.ts';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';

const artifactRoot='.eval-artifacts/phase3b/g4-e2e-continuation',root=process.argv.includes('--self-test')?artifactRoot+'/self-test':artifactRoot,ledgerPath='.eval-artifacts/phase3b/budget.json';
const load=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
function save(p,value){const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');for(const key of ['DEEPSEEK_API_KEY','GOOGLE_MAPS_API_KEY'])if(process.env[key]&&bytes.includes(Buffer.from(process.env[key])))throw Error('SECRET_RECORDING_REFUSED');writeFileSync(p,bytes,{flag:'wx'});}
const counts=entries=>Object.fromEntries(['fullLive','realModelCalls','environmentReruns','evaluationPublicGET','googleRequests','restaurantWebsiteRequests'].map(k=>[k,entries.reduce((n,e)=>n+(e[k]??(k==='evaluationPublicGET'?e.publicGET:0)??0),0)]));
const failure=code=>Object.assign(Error(code),{code});
const originalPrefix='phase3b-c-g4-e2e-',continuationPrefix='phase3b-c-g4-cont-';
const benchmarkEntries=entries=>entries.filter(e=>e.id.startsWith(originalPrefix)||e.id.startsWith(continuationPrefix));
function allowedChargeNumber(l,kind,subjectId){
 const key=kind==='GET'?'evaluationPublicGET':'realModelCalls',prior=benchmarkEntries(l.entries),rows=l.entries.filter(e=>e.id.startsWith(continuationPrefix)&&e.kind===kind),n=rows.length+1;
 if((kind==='GET'&&n>112)||(kind==='MODEL'&&prior.filter(e=>e.kind==='MODEL').length>=40)||counts(l.entries)[key]>=(kind==='GET'?257:1000))throw failure('BUDGET_EXHAUSTED');
 if(kind==='MODEL')assert(!prior.some(e=>e.kind==='MODEL'&&e.subjectId===subjectId),'One real fragment call per subject across all attempts');
 assert.equal(l.limits.evaluationPublicGET,257);
 return n;
}
function charge(kind,subjectId){
 const l=load(ledgerPath),n=allowedChargeNumber(l,kind,subjectId);
 const id=`${continuationPrefix}${kind.toLowerCase()}-${String(n).padStart(3,'0')}`;
 l.entries.push({id,conversation:'C',batch:'G4_E2E_CONTINUATION',kind,subjectId,startedAtCET:cet(),fullLive:0,realModelCalls:kind==='MODEL'?1:0,evaluationPublicGET:kind==='GET'?1:0,restaurantWebsiteRequests:kind==='GET'?1:0,googleRequests:0,environmentReruns:0});l.cumulative=counts(l.entries);l.asOfCET=cet();writeFileSync(ledgerPath+'.g4-tmp',JSON.stringify(l,null,2)+'\n');renameSync(ledgerPath+'.g4-tmp',ledgerPath);return id;
}
function cachedModelRecord(subjectId,request){
 const cached=load(`${artifactRoot}/replay-models.json`)[subjectId];if(!cached)return null;
 assert.equal(sha(readFileSync(cached.sourcePath)),cached.sourceSha256);assert.deepEqual(request,cached.record.request,'Replay requires identical original model input');
 return {replayed:true,originLedgerId:cached.record.ledgerId,sourcePath:cached.sourcePath,sourceSha256:cached.sourceSha256,request,response:cached.record.response};
}
let lastFinished=0,networkStreak=0,caseEnvironment,globalStop,identityDone=false,activeId,current,requests=[],modelRecords=[];
const verify=()=>{for(const f of load(`${artifactRoot}/freeze.json`).files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);};
async function get(url,renderer){
 if(identityDone)throw failure('IDENTITY_COMPLETE');if(caseEnvironment)throw failure('CASE_ENVIRONMENT_FAILED');if(globalStop)throw failure(globalStop);
 const u=new URL(url);assert.equal(u.origin,'https://tabelog.com');assert(!/\/(?:reserve|booking|checkout|payment|cancel)(?:\/|$)/i.test(u.pathname));
 const ms=lastFinished+30000-Date.now();if(ms>0)await new Promise(r=>setTimeout(r,ms));verify();
 let id;try{id=charge('GET',activeId);}catch(e){globalStop=e.code;throw e;}
 const prefix=`${root}/responses/${id}`,began=Date.now();save(prefix+'.started.json',{url,method:'GET',redirect:'manual',cookie:false,retries:0,atCET:cet(),ledgerId:id});
 let meta={ledgerId:id,url,kind:u.pathname.includes('/rstLst/')?'SEARCH':'DETAIL',query:u.searchParams.get('sw'),startedAtCET:cet()};
 try{
  const response=await fetch(url,{redirect:'manual',credentials:'omit',headers:{'Accept-Encoding':'identity'},signal:AbortSignal.timeout(20000)});
  const bytes=Buffer.from(await response.arrayBuffer());writeFileSync(prefix+'.html',bytes,{flag:'wx'});Object.assign(meta,{httpStatus:response.status,contentType:response.headers.get('content-type'),contentEncoding:response.headers.get('content-encoding'),location:response.headers.get('location'),bodyPath:prefix+'.html',sha256:sha(bytes)});networkStreak=0;
  if(response.status!==200)throw failure('SOURCE_HTTP_OR_REDIRECT');if(!/text\/html/i.test(meta.contentType??''))throw failure('SOURCE_STRUCTURE_CHANGED');
  await renderer.setContent(bytes.toString('utf8'),{waitUntil:'domcontentloaded'});const text=await renderer.locator('body').innerText();
  if(/現在アクセスが集中|verify you are human|unusual traffic|access denied|just a moment|ロボットではない/i.test(text))throw failure('SOURCE_BUSY_OR_CHALLENGE');
  current={url,title:await renderer.title(),text,html:bytes.toString('utf8')};return current;
 }catch(error){const code=typeof error.code==='string'?error.code:(error.name==='TimeoutError'?'SOURCE_TIMEOUT':'SOURCE_NETWORK_FAILED');meta.failure={code,type:error.name??'UNKNOWN'};caseEnvironment=code;
  if(['SOURCE_TIMEOUT','SOURCE_NETWORK_FAILED'].includes(code)){networkStreak++;if(networkStreak>=3)globalStop='THREE_CONSECUTIVE_NETWORK_FAILURES';}
  throw failure(code);
 }finally{lastFinished=Date.now();meta.finishedAtCET=cet();meta.elapsedMs=lastFinished-began;requests.push(meta);save(prefix+'.json',meta);console.log(JSON.stringify({event:'GET',subjectId:activeId,ledgerId:id,status:meta.httpStatus,failure:meta.failure,networkStreak,elapsedMs:meta.elapsedMs}));}
}
async function execute(){
 assert(process.argv.includes('--execute'));assert(!existsSync(`${root}/started.json`),'No rerun/retry');assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');verify();
 assert(process.env.DEEPSEEK_API_KEY?.trim());assert.equal(process.env.DEEPSEEK_MODEL,'deepseek-v4-flash');console.log('已加载');
 const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();save(`${root}/started.json`,{sourceCommit,productionCommit:load(`${root}/inputs.json`).productionCommit,startedAtCET:cet(),mode:'EVALUATION_PUBLIC_GET_IDENTITY_PREFIX',freezeSha256:sha(readFileSync(`${artifactRoot}/freeze.json`)),credentialStatus:'已加载',fileHandling:'未独立读取文件'});
 const browser=await chromium.launch({headless:true}),context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});let blocked=0;await context.route('**/*',route=>{blocked++;return route.abort();});const renderer=await context.newPage();
 const gateway=DeepSeekModelGateway.fromEnvironment(),rows=load(`${root}/inputs.json`).rows,completed=[];
 try{for(const subject of rows){
  if(globalStop)break;activeId=subject.id;identityDone=false;caseEnvironment=undefined;current=undefined;requests=[];modelRecords=[];const diagnostics=[],trace=[],start=cet();let read,error;
  const candidate={restaurant:{id:`g4:${subject.id}`,outletName:subject.subject.name,address:subject.subject.address,coordinates:subject.subject.coordinates,sourceIds:{googlePlaces:subject.googlePlaceId,phone:subject.subject.phone},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
  const model={async complete(request){if(caseEnvironment)throw failure('CASE_ENVIRONMENT_FAILED');assert.equal(request.purpose,'restaurant_named_source_query');assert.equal(modelRecords.length,0);const replay=cachedModelRecord(activeId,request);if(replay){modelRecords.push(replay);return replay.response;}const ledgerId=charge('MODEL',activeId);let record={ledgerId,replayed:false,request};try{record.response=await gateway.complete(request);return record.response;}catch(e){record.failure={code:e.code??'MODEL_FAILED'};globalStop='MODEL_INFRASTRUCTURE_FAILURE';throw e;}finally{modelRecords.push(record);}}};
  const budget={totalModelCalls:0,maxModelCalls:1},planner=new ModelNamedSourceQuery(model,budget);
  const session={metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',sessionId:'eval-http-static-dom',startedAt:start},
    async navigate(url){return get(url,renderer);},async snapshot(){if(identityDone)throw failure('IDENTITY_COMPLETE');if(caseEnvironment)throw failure('CASE_ENVIRONMENT_FAILED');return current;},
    async captureResponses(){},async close(){},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},
    async fill(){throw failure('IDENTITY_ONLY_NO_ACTION');},async select(){throw failure('IDENTITY_ONLY_NO_ACTION');},async click(){throw failure('IDENTITY_ONLY_NO_ACTION');}};
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:600000,maxOperationsPerCandidate:24,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,budget,onDiagnostic:d=>trace.push(d)});
  const provider=new TabelogBrowserAvailability(executor,undefined,5,{alternativeSearch:async(c,s)=>{if(caseEnvironment||globalStop)throw failure(caseEnvironment??globalStop);return planner.alternative(c,s);},onIdentityDiagnostic:d=>{diagnostics.push(d);if(d.resolution.confidence==='HIGH')identityDone=true;}});
  try{read=await provider.check({candidateIds:[candidate.restaurant.id],candidates:[candidate],date:'1970-01-01',partySize:1,timeWindow:{earliest:'00:00',latest:'00:00'},hardCriteria:[]},new AbortController().signal);}catch(e){error={code:e.code??'PRODUCTION_PREFIX_FAILED'};}finally{await executor.close();}
  const high=diagnostics.find(d=>d.resolution.confidence==='HIGH'),selected=high?.comparedOutlets.find(o=>o.sourceEntityId===high.resolution.bestSourceEntityId);
  const execution={id:subject.id,cohort:subject.cohort,attemptKind:subject.attemptKind,startedAtCET:start,finishedAtCET:cet(),mode:'PUBLIC_GET_WITH_OFFLINE_JS_DISABLED_DOM',requests,modelRecords,diagnostics,trace,
    status:caseEnvironment?'ENVIRONMENT_FAILURE':globalStop?'INTERRUPTED':selected?'ACCEPTED':'NOT_ACCEPTED',environmentFailure:caseEnvironment??null,stop:globalStop??null,acceptedUrl:selected?.sourceUrl??null,
    productionReason:diagnostics.at(-1)?.resolution.reason??read?.availabilityChecks[candidate.restaurant.id]?.reasonCode??error?.code??null,
    bounds:{searches:requests.filter(r=>r.kind==='SEARCH').length,details:requests.filter(r=>r.kind==='DETAIL').length,model:modelRecords.length,realModelCalls:modelRecords.filter(r=>!r.replayed).length,replayedModelResponses:modelRecords.filter(r=>r.replayed).length,inventoryEvaluated:false,google:0,live:0}};
  assert(execution.bounds.searches<=2&&execution.bounds.details<=5&&execution.bounds.model<=1);save(`${root}/execution/${subject.id}.json`,execution);
  const evaluation=JSON.parse(execFileSync('python3',['-B',`${root}/score.py`,'--one',`${root}/execution/${subject.id}.json`],{encoding:'utf8'}));completed.push({id:subject.id,status:evaluation.verdict});console.log(JSON.stringify({event:'CASE',id:subject.id,verdict:evaluation.verdict,reason:execution.productionReason,counts:execution.bounds}));
  if(evaluation.verdict==='WRONG_ACCEPTED'){globalStop='S0_WRONG_OUTLET';break;}
  save(`${root}/progress-${String(completed.length).padStart(2,'0')}.json`,{completed,stop:globalStop??null});
 }}finally{await browser.close();save(`${root}/execution-summary.json`,{sourceCommit,planned:rows.length,completed,stop:globalStop??null,finishedAtCET:cet(),blockedRendererRequests:blocked,rendererSourceNetworkRequests:0});}
}
if(process.argv.includes('--execute'))await execute();
if(process.argv.includes('--self-test')){
 const base=load(ledgerPath);assert.equal(allowedChargeNumber(base,'GET','fixture'),1);assert.throws(()=>allowedChargeNumber(base,'MODEL','nr-001'));
 const getLimit=structuredClone(base);for(let i=0;i<112;i++)getLimit.entries.push({id:continuationPrefix+'fixture-get-'+i,kind:'GET',evaluationPublicGET:1});assert.throws(()=>allowedChargeNumber(getLimit,'GET','fixture'),{code:'BUDGET_EXHAUSTED'});
 const modelLimit=structuredClone(base);for(let i=0;i<26;i++)modelLimit.entries.push({id:continuationPrefix+'fixture-model-'+i,kind:'MODEL',subjectId:'fixture-'+i,realModelCalls:1});assert.throws(()=>allowedChargeNumber(modelLimit,'MODEL','fixture-new'),{code:'BUDGET_EXHAUSTED'});
 const sharedLimit=structuredClone(base);sharedLimit.entries.push({id:'other-conversation-fixture',evaluationPublicGET:112});assert.throws(()=>allowedChargeNumber(sharedLimit,'GET','fixture'),{code:'BUDGET_EXHAUSTED'});
 const r=load(`${artifactRoot}/replay-models.json`)['nr-001'];assert(cachedModelRecord('nr-001',r.record.request).replayed);assert.equal(cachedModelRecord('nr-004',r.record.request),null);assert.throws(()=>cachedModelRecord('nr-001',{...r.record.request,taskId:'changed'}));
 assert.deepEqual(load(ledgerPath),base);
 const originalFetch=globalThis.fetch,originalNow=Date.now,originalCharge=charge;let virtual=Date.now(),calls=0,charged=0;
 Date.now=()=>virtual+=31000;charge=()=>{charged++;return `fixture-${charged}`;};activeId='self-test';
 mkdirSync(`${root}/responses`,{recursive:true});
 try{
  globalThis.fetch=async()=>{calls++;throw new DOMException('fixture timeout','TimeoutError');};
  for(let i=0;i<3;i++){
   caseEnvironment=undefined;
   await assert.rejects(get('https://tabelog.com/en/tokyo/rstLst/?sw=fixture',null),{code:'SOURCE_TIMEOUT'});
   await assert.rejects(get('https://tabelog.com/en/tokyo/rstLst/?sw=fixture',null),{code:'CASE_ENVIRONMENT_FAILED'});
  }
  assert.equal(calls,3);assert.equal(charged,3);assert.equal(networkStreak,3);assert.equal(globalStop,'THREE_CONSECUTIVE_NETWORK_FAILURES');
  identityDone=true;await assert.rejects(get('https://tabelog.com/en/tokyo/A1/A2/11111111/',null),{code:'IDENTITY_COMPLETE'});assert.equal(calls,3);
  console.log('PASS simulated timeout(code23), no retry,3-network stop, identity boundary;0 real calls');
 }finally{globalThis.fetch=originalFetch;Date.now=originalNow;charge=originalCharge;}
}
