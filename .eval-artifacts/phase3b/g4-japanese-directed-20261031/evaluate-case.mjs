// No source requests here: current product identity prefix consumes frozen bytes.
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
const R='.eval-artifacts/phase3b/g4-japanese-directed-20261031',load=p=>JSON.parse(readFileSync(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const inputs=load(R+'/inputs.json'),subject=inputs.cases.find(r=>r.id===process.argv.at(-1));assert(subject);
const old=load(subject.sourceExecutionPath),config=load(inputs.savedInputs),primary=new Map(old.requests.map(r=>[r.url,r]));
const corpus=load(config.corpus).responses,extra=config.extraSearches.map(p=>{const r=load(p);return {...r,url:load(r.bodyPath.replace(/\.body\.html$/,'.started.json')).url};});
const success=new Map();for(const row of [...corpus,...extra])if(row.bodyPath&&!row.failure&&!success.has(row.url))success.set(row.url,row);
const supplements=new Map(corpus.filter(r=>r.backfill).map(r=>[r.url,r]));
const state=load(R+'/state.json'),freshRows=state.results.filter(r=>r.subjectId===subject.id),fresh=new Map(freshRows.map(r=>[r.url,r]));
const candidate={restaurant:{id:'g4:'+subject.id,outletName:subject.subject.name,address:subject.subject.address,coordinates:subject.subject.coordinates,sourceIds:{googlePlaces:subject.googlePlaceId,phone:subject.subject.phone},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
let proposal;const captured=old.modelRecords[0]?.response;try{if(captured)proposal=JSON.parse(captured.outputText);}catch{}
let rawNamePath=subject.id==='nr-007'?R+'/requests/google-name.body.json':config.googleJapanese[subject.id];
globalThis.fetch=async()=>{throw Error('EVALUATION_NETWORK_FORBIDDEN');};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});let blocked=0;
await context.route('**/*',r=>{blocked++;return r.abort();});const page=await context.newPage();
let current,identityDone=false,diagnostic,identityReadCount,japaneseName;const reads=[],queries=[],uncertainties=[],environment=[],postIdentity=[],operations=[];
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
const executor=new BrowserTaskExecutor({openSession:async()=>({metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:now()},navigate:observe,
 async snapshot(){if(identityDone)throw err('IDENTITY_PREFIX_COMPLETE_NO_WORKFLOW_READ');assert(current);return current;},async close(){},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async click(){throw err('NO_ACTIONS_IN_IDENTITY_PREFIX');},async fill(){throw err('NO_ACTIONS_IN_IDENTITY_PREFIX');},async select(){throw err('NO_ACTIONS_IN_IDENTITY_PREFIX');}})},
 {maxAutomaticElapsedMs:60000,maxOperationsPerCandidate:24,maxModelCallsPerCandidate:0,maxModelCallsTotal:0,budget:{totalModelCalls:0,maxModelCalls:0},onDiagnostic:d=>operations.push(d)});
let read;
try{
 const provider=new TabelogBrowserAvailability(executor,now,5,{
  alternativeSearch:async()=>{if(!captured)uncertainties.push('UNRECORDED_FRAGMENT_PROPOSAL_NOT_AN_EMPTY_MODEL_RESPONSE');return locateNamedSourceFragment(candidate,proposal)?.query;},
  japaneseName:async()=>{
   if(!rawNamePath){uncertainties.push('UNRECORDED_JAPANESE_NAME');throw err('FROZEN_NAME_UNAVAILABLE');}
   const bytes=readFileSync(rawNamePath),client=new GooglePlacesClient({apiKey:'OFFLINE_SOURCE_VALIDATION',fetchImplementation:async(url,init)=>{assert.equal(new URL(url).searchParams.get('languageCode'),'ja');assert.equal(new Headers(init.headers).get('X-Goog-FieldMask'),'id,displayName');return new Response(bytes);}});
   japaneseName=await client.japaneseNamesForRun(new AbortController().signal)(subject.googlePlaceId);return japaneseName;
  },onIdentityDiagnostic:d=>{diagnostic=d;identityReadCount=reads.length;identityDone=true;}
 });
 read=await provider.check({candidateIds:[candidate.restaurant.id],candidates:[candidate],date:'1970-01-01',partySize:1,timeWindow:{earliest:'00:00',latest:'00:00'},hardCriteria:[]},new AbortController().signal);
}finally{await executor.close();await browser.close();}
const chosen=diagnostic?.resolution.confidence==='HIGH'?diagnostic.comparedOutlets.find(r=>r.sourceEntityId===diagnostic.resolution.bestSourceEntityId):undefined;
const prefix=identityReadCount===undefined?reads:reads.slice(0,identityReadCount),details=prefix.filter(r=>r.kind==='DETAIL').map((r,i)=>({...r,ordinal:i+1}));assert(details.length<=5);
const output={id:subject.id,mode:'FOUR_DIRECTED_PUBLIC_GETS_PLUS_FROZEN_PREFIX_REPLAY_NOT_FULL_LIVE',observedAcceptedUrl:chosen?.sourceUrl??null,diagnostic:diagnostic??null,
 queries,details,reads:prefix,uncertainties,environmentFailures:environment,postIdentity,operations,productionReason:diagnostic?.resolution.reason??read?.availabilityChecks[candidate.restaurant.id]?.reasonCode??null,
 thirdTermObserved:queries.some(q=>q.source==='JAPANESE'),japaneseOrigin:rawNamePath??null,fragmentOrigin:captured?'CAPTURED_MODEL_OUTPUT_REPLAY':'NOT_CAPTURED_NOT_FABRICATED',
 actualAcquiredDetails:freshRows.filter(r=>r.kind==='DETAIL'),modelCalls:0,sourceNetworkCalls:0,rendererBlockedRequests:blocked,inventoryEvaluation:'NOT_EVALUATED'};
mkdirSync(R+'/execution',{recursive:true});writeFileSync(R+'/execution/'+subject.id+'.json',JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({id:subject.id,observedAccepted:!!chosen,details:details.length,uncertainties,environmentFailures:environment}));
