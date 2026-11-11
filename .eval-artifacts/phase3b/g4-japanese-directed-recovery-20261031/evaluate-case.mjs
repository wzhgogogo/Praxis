// Recovery copy only. Original runner/failure evidence are immutable.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
import {BrowserTaskExecutor} from '../../../src/infrastructure/browser/browser-task-executor.ts';
import {BrowserRuntimeError} from '../../../src/infrastructure/browser/browser-runtime-errors.ts';
import {TabelogBrowserAvailability} from '../../../src/integrations/tabelog/tabelog-browser-availability.ts';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {locateNamedSourceFragment} from '../../../src/integrations/restaurant-search/named-source-query.ts';
import {parseTabelogSearchOutlets} from '../../../src/integrations/tabelog/tabelog-page-parser.ts';

const R='.eval-artifacts/phase3b/g4-japanese-directed-20261031';
const S='.eval-artifacts/phase3b/g4-japanese-directed-recovery-20261031';
const load=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
function zeroModelBudget(){
 let attempts=0;
 const budget={maxModelCalls:1,get totalModelCalls(){return 0;},set totalModelCalls(value){if(value!==0){attempts++;throw Error('MODEL_ATTEMPT_FORBIDDEN');}}};
 return {budget,assertZero(){assert.equal(attempts,0,'MODEL_ATTEMPT_FORBIDDEN');assert.equal(budget.totalModelCalls,0);},attempts:()=>attempts};
}
if(process.argv.includes('--guard-self-check')){
 const guard=zeroModelBudget();guard.assertZero();
 assert.equal(guard.budget.maxModelCalls,1);
 assert.throws(()=>{guard.budget.totalModelCalls++;},/MODEL_ATTEMPT_FORBIDDEN/);
 assert.equal(guard.budget.totalModelCalls,0);assert.equal(guard.attempts(),1);
 assert.throws(()=>guard.assertZero(),/MODEL_ATTEMPT_FORBIDDEN/);
 console.log(JSON.stringify({mode:'PURE_LOCAL_MODEL_ATTEMPT_GUARD',status:'PASS',modelPortInjected:false,sourceNetworkCalls:0,modelCalls:0}));
 process.exit(0);
}
for(const f of load(S+'/freeze.json').files)assert.equal(sha(readFileSync(f.path)),f.sha256,f.path);
const inputs=load(R+'/inputs.json'),subject=inputs.cases.find(r=>r.id===process.argv.at(-1));assert(subject);
const old=load(subject.sourceExecutionPath),config=load(inputs.savedInputs),primary=new Map(old.requests.map(r=>[r.url,r]));
const corpus=load(config.corpus).responses,extra=config.extraSearches.map(p=>{const r=load(p);return {...r,url:load(r.bodyPath.replace(/\.body\.html$/,'.started.json')).url};});
const success=new Map();for(const row of [...corpus,...extra])if(row.bodyPath&&!row.failure&&!success.has(row.url))success.set(row.url,row);
const supplements=new Map(corpus.filter(r=>r.backfill).map(r=>[r.url,r]));
const freshRows=[...load(R+'/state.json').results,...load(S+'/state.json').results].filter(r=>r.subjectId===subject.id),fresh=new Map(freshRows.map(r=>[r.url,r]));
const candidate={restaurant:{id:'g4:'+subject.id,outletName:subject.subject.name,address:subject.subject.address,coordinates:subject.subject.coordinates,sourceIds:{googlePlaces:subject.googlePlaceId,phone:subject.subject.phone},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
let proposal;const captured=old.modelRecords[0]?.response;try{if(captured)proposal=JSON.parse(captured.outputText);}catch{}
const rawNamePath=subject.id==='nr-007'?R+'/requests/google-name.body.json':config.googleJapanese[subject.id];
const guard=zeroModelBudget();let fetchAttempts=0,blocked=0,browser,context,page,executor,browserClosed=false;
const checkpoints=[];
function assertZero(phase){guard.assertZero();assert.equal(fetchAttempts,0,'UNEXPECTED_EVALUATION_FETCH');checkpoints.push({phase,modelCalls:guard.budget.totalModelCalls,modelAttempts:guard.attempts(),sourceNetworkCalls:0});}
globalThis.fetch=async()=>{fetchAttempts++;throw Error('EVALUATION_NETWORK_FORBIDDEN');};
let current,identityDone=false,diagnostic,identityReadCount,japaneseName,read;
const reads=[],queries=[],uncertainties=[],environment=[],postIdentity=[],operations=[];
const now=()=>new Date().toISOString(),err=code=>new BrowserRuntimeError('BROWSER_RUNTIME_FAILED',code);
async function observe(url){
 if(identityDone)throw err('IDENTITY_PREFIX_COMPLETE_NO_WORKFLOW_READ');
 const query=new URL(url).searchParams.get('sw'),kind=query===null?'DETAIL':'SEARCH';
 const extraRow=kind==='SEARCH'?extra.find(r=>r.subjectId===subject.id&&r.query===query):undefined;
 const row=fresh.get(url)??primary.get(url)??supplements.get(url)??extraRow??success.get(url);
 const fromFresh=fresh.has(url);
 if(!row?.bodyPath||row.failure||row.bodyComplete===false){const problem=row?.failure??'MISSING_SAVED_PAGE';reads.push({url,kind,query,problem,origin:fromFresh?'DIRECTED_GET':'FROZEN_REPLAY'});environment.push(problem);throw err('SOURCE_ENVIRONMENT_OR_INPUT_FAILURE');}
 const bytes=readFileSync(row.bodyPath);assert.equal(sha(bytes),row.sha256);
 await page.setContent(bytes.toString('utf8'),{waitUntil:'domcontentloaded'});
 const snapshot={url,title:await page.title(),text:await page.locator('body').innerText(),html:bytes.toString('utf8')};
 if(kind==='SEARCH'){
  const check=JSON.parse(execFileSync('python3',['-B','.eval-artifacts/phase3b/g4-japanese-wiring/inspect-search.py',row.bodyPath,url,query],{encoding:'utf8'}));
  if(!check.queryVisible||!check.structureVerified){uncertainties.push('SOURCE_STRUCTURE_OR_QUERY_UNBOUND');throw err('SOURCE_STRUCTURE_CHANGED');}
  const fragment=locateNamedSourceFragment(candidate,proposal)?.query;
  const source=query===candidate.restaurant.outletName?'ORIGINAL':query===fragment?'FRAGMENT':query===japaneseName?.text?'JAPANESE':'UNBOUND';assert.notEqual(source,'UNBOUND');
  queries.push({query,source,languageCode:source==='JAPANESE'?japaneseName.languageCode:null,url,bodyPath:row.bodyPath,sha256:row.sha256,origin:fromFresh?'DIRECTED_GET':'FROZEN_REPLAY',ordered:parseTabelogSearchOutlets(snapshot)});
 }
 reads.push({url,kind,query,bodyPath:row.bodyPath,sha256:row.sha256,origin:fromFresh?'DIRECTED_GET':'FROZEN_REPLAY'});current=snapshot;
}
try{
 browser=await chromium.launch({headless:true});
 context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
 await context.route('**/*',r=>{blocked++;return r.abort();});page=await context.newPage();
 executor=new BrowserTaskExecutor({openSession:async()=>({metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now()},navigate:observe,
  async snapshot(){if(identityDone)throw err('IDENTITY_PREFIX_COMPLETE_NO_WORKFLOW_READ');assert(current);return current;},async close(){},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async click(){throw err('NO_ACTIONS_IN_IDENTITY_PREFIX');},async fill(){throw err('NO_ACTIONS_IN_IDENTITY_PREFIX');},async select(){throw err('NO_ACTIONS_IN_IDENTITY_PREFIX');}})},
  {maxAutomaticElapsedMs:60000,maxOperationsPerCandidate:24,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,budget:guard.budget,onDiagnostic:d=>operations.push(d)});
 // No modelDecision, sourceFactsModel or other model port is injected.
 const provider=new TabelogBrowserAvailability(executor,now,5,{
  alternativeSearch:async()=>{if(!captured)uncertainties.push('UNRECORDED_FRAGMENT_PROPOSAL_NOT_AN_EMPTY_MODEL_RESPONSE');return locateNamedSourceFragment(candidate,proposal)?.query;},
  japaneseName:async()=>{
   if(!rawNamePath){uncertainties.push('UNRECORDED_JAPANESE_NAME');throw err('FROZEN_NAME_UNAVAILABLE');}
   const bytes=readFileSync(rawNamePath),client=new GooglePlacesClient({apiKey:'OFFLINE_SOURCE_VALIDATION',fetchImplementation:async(url,init)=>{assert.equal(new URL(url).searchParams.get('languageCode'),'ja');assert.equal(new Headers(init.headers).get('X-Goog-FieldMask'),'id,displayName');return new Response(bytes);}});
   japaneseName=await client.japaneseNamesForRun(new AbortController().signal)(subject.googlePlaceId);return japaneseName;
  },onIdentityDiagnostic:d=>{diagnostic=d;identityReadCount=reads.length;identityDone=true;}
 });
 assertZero('BEFORE_CHECK');
 read=await provider.check({candidateIds:[candidate.restaurant.id],candidates:[candidate],date:'1970-01-01',partySize:1,timeWindow:{earliest:'00:00',latest:'00:00'},hardCriteria:[]},new AbortController().signal);
}finally{
 try{if(executor)await executor.close();}
 finally{try{if(browser){await browser.close();browserClosed=true;}}finally{assertZero('FINALLY');}}
}
const chosen=diagnostic?.resolution.confidence==='HIGH'?diagnostic.comparedOutlets.find(r=>r.sourceEntityId===diagnostic.resolution.bestSourceEntityId):undefined;
const prefix=identityReadCount===undefined?reads:reads.slice(0,identityReadCount),details=[];
let discoveryQuery=null;for(const r of prefix){if(r.kind==='SEARCH')discoveryQuery=r.query;else details.push({...r,discoveryQuery,ordinal:details.length+1});}assert(details.length<=5);
assertZero('BEFORE_SAVE');assert(browserClosed);
const output={id:subject.id,mode:'FOUR_DIRECTED_PUBLIC_GETS_PLUS_FROZEN_PREFIX_REPLAY_NOT_FULL_LIVE',observedAcceptedUrl:chosen?.sourceUrl??null,diagnostic:diagnostic??null,
 queries,details,reads:prefix,uncertainties,environmentFailures:environment,postIdentity,operations,productionReason:diagnostic?.resolution.reason??read?.availabilityChecks[candidate.restaurant.id]?.reasonCode??null,
 thirdTermObserved:queries.some(q=>q.source==='JAPANESE'),japaneseOrigin:rawNamePath??null,fragmentOrigin:captured?'CAPTURED_MODEL_OUTPUT_REPLAY':'NOT_CAPTURED_NOT_FABRICATED',
 actualAcquiredDetails:freshRows.filter(r=>r.kind==='DETAIL'),modelCalls:guard.budget.totalModelCalls,modelAttempts:guard.attempts(),modelPortInjected:false,sourceNetworkCalls:0,unexpectedFetchAttempts:fetchAttempts,
 guardCheckpoints:checkpoints,internalLimits:{maxModelCallsPerCandidate:1,maxModelCallsTotal:1,sharedMaxModelCalls:1},browserClosed,rendererBlockedRequests:blocked,inventoryEvaluation:'NOT_EVALUATED'};
mkdirSync(S+'/execution',{recursive:true});writeFileSync(S+'/execution/'+subject.id+'.json',JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({id:subject.id,observedAccepted:!!chosen,details:details.length,uncertainties,environmentFailures:environment,modelCalls:guard.budget.totalModelCalls,sourceNetworkCalls:0,browserClosed}));
