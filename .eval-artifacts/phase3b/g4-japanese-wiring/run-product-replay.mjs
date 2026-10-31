// Production Tabelog identity prefix on frozen source bodies. No stock/Live claim.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {TabelogBrowserAvailability} from '../../../src/integrations/tabelog/tabelog-browser-availability.ts';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {GooglePlacesRestaurantSearch} from '../../../src/integrations/google/google-places-restaurant-search.ts';
import {GooglePlacesError} from '../../../src/integrations/google/google-places-contracts.ts';
import {BrowserRuntimeError} from '../../../src/infrastructure/browser/browser-runtime-errors.ts';
import {locateNamedSourceFragment} from '../../../src/integrations/restaurant-search/named-source-query.ts';
const root='.eval-artifacts/phase3b/g4-japanese-wiring',load=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
assert(!existsSync(root+'/product-summary.json'));
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
for(const f of load(root+'/freeze.json').files)assert.equal(hash(readFileSync(f.path)),f.sha256,f.path);
globalThis.fetch=async()=>{throw Error('NO_REAL_NETWORK_IN_PRODUCT_REPLAY');};
const config=load(root+'/inputs.json'),corpus=load(config.corpus).responses;
const extras=config.extraSearches.map(p=>{const row=load(p);return {...row,url:load(row.bodyPath.replace(/\.body\.html$/,'.started.json')).url};});
const byUrl=new Map();for(const row of [...corpus,...extras])if(row.bodyPath&&!row.failure&&!byUrl.has(row.url))byUrl.set(row.url,row);
const supplements=new Map(corpus.filter(r=>r.backfill).map(r=>[r.url,r]));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
await context.route('**/*',r=>r.abort());const renderer=await context.newPage(),completed=[];
try{for(const subject of config.rows){
 const old=load(subject.sourceExecutionPath),primary=new Map(old.requests.map(r=>[r.url,r])),reads=[],navigations=[],uncertainties=[],bindings=new Map();
 const candidate={restaurant:{id:`g4:${subject.id}`,outletName:subject.subject.name,address:subject.subject.address,coordinates:subject.subject.coordinates,
   sourceIds:{googlePlaces:subject.googlePlaceId,phone:subject.subject.phone},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
 const captured=old.modelRecords[0]?.response;let proposal;if(captured)try{proposal=JSON.parse(captured.outputText);}catch{}
 let snapshot,diagnostic,identityReadCount;const postIdentityIssues=[];
 async function observe(url){
  const query=new URL(url).searchParams.get('sw'),kind=query===null?'DETAIL':'SEARCH';
  const extra=kind==='SEARCH'?extras.find(r=>r.subjectId===subject.id&&r.query===query):undefined;
  const row=primary.get(url)??supplements.get(url)??extra??byUrl.get(url);
  if(!row?.bodyPath||row.failure){const problem=row?.failure?'RECORDED_NETWORK_FAILURE':'MISSING_SAVED_PAGE';(diagnostic?.resolution.confidence==='HIGH'?postIdentityIssues:uncertainties).push(`${kind}:${problem}`);reads.push({url,kind,query,problem});throw new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','Frozen observation unavailable');}
  const bytes=readFileSync(row.bodyPath);assert.equal(hash(bytes),row.sha256);
  if(kind==='SEARCH'){
   const key=row.sha256+'|'+query;let bound=bindings.get(key);
   if(!bound){bound=JSON.parse(execFileSync('python3',['-B',root+'/inspect-search.py',row.bodyPath,row.url,query],{encoding:'utf8'}));bindings.set(key,bound);}
   if(!bound.queryVisible||!bound.structureVerified){uncertainties.push('SEARCH_STRUCTURE_OR_QUERY_UNBOUND');reads.push({url,kind,query,problem:'SEARCH_STRUCTURE_OR_QUERY_UNBOUND'});throw new BrowserRuntimeError('BROWSER_RUNTIME_FAILED','Frozen search is unbound');}
  }
  await renderer.setContent(bytes.toString('utf8'),{waitUntil:'domcontentloaded'});
  reads.push({url,kind,query,bodyPath:row.bodyPath,sha256:row.sha256,realGET:0});
  return {url,title:await renderer.title(),text:await renderer.locator('body').innerText(),html:bytes.toString('utf8')};
 }
 const rawPath=config.googleJapanese[subject.id];
 const google=new GooglePlacesRestaurantSearch(new GooglePlacesClient({apiKey:'OFFLINE_FIXTURE',fetchImplementation:async(url,init)=>{
  assert.equal(new URL(url).searchParams.get('languageCode'),'ja');assert.equal(init.headers['X-Goog-FieldMask'],'id,displayName');
  assert(rawPath,'no missing Google response may enter the fixture transport');return new Response(JSON.stringify(load(rawPath)));
 }}),undefined,10,{maxRequests:1});
 const signal=new AbortController().signal;
 const session={metadata:{runtimeProvider:'CLOUDFLARE_BROWSER_RUN',engine:'KITESURF',startedAt:'2026-10-30T10:00:00Z'},
  async navigate(url){navigations.push(url);snapshot=await observe(url);},async snapshot(){assert(snapshot);return snapshot;},
  async select(_target,value){return [value];},async fill(){},async click(){},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};
 const adapter=new TabelogBrowserAvailability({openSession:async()=>session},()=> '2026-10-30T10:00:00Z',5,{
  alternativeSearch:async()=>{if(!captured)uncertainties.push('UNRECORDED_FRAGMENT_PROPOSAL');return locateNamedSourceFragment(candidate,proposal)?.query;},
  japaneseName:async()=>{if(!rawPath){uncertainties.push('UNRECORDED_JAPANESE_NAME');throw new GooglePlacesError('GOOGLE_NETWORK_FAILED','Frozen name unavailable');}return google.japaneseName(subject.googlePlaceId,subject.key,signal);},
  onIdentityDiagnostic:value=>{diagnostic=value;identityReadCount=reads.length;},
 });
 const read=await adapter.check({candidates:[candidate],candidateIds:[candidate.restaurant.id],date:'2026-11-03',partySize:2,timeWindow:{earliest:'19:00',latest:'19:30'},hardCriteria:[]},signal);
 const entity=read.evidence.find(e=>e.provider==='TABELOG'&&e.kind==='ENTITY_MATCH'&&e.entityMatch?.confidence==='HIGH');
 const prefixReads=identityReadCount===undefined?reads:reads.slice(0,identityReadCount);
 const uniqueDetails=[...new Map(prefixReads.filter(r=>r.kind==='DETAIL').map(r=>[r.url,r])).values()];
 // Only the identity prefix is scored. Subsequent calendar/control operations
 // remain untouched and ungraded, with no response-body invention.
 const searches=(diagnostic?.nameRetrieval?.queries??reads.filter(r=>r.kind==='SEARCH').map((r,i)=>({query:r.query,kind:i?'FRAGMENT':'ORIGINAL'}))).map(r=>({...r,ordered:[]}));
 const result={id:subject.id,key:subject.key,view:subject.view,cohort:subject.cohort,status:uncertainties.length?'NOT_EVALUATED':entity?'MATCH':'NO_MATCH',
  acceptedUrl:!uncertainties.length&&entity?entity.sourceUrl:null,searches,details:uniqueDetails.map(r=>({url:r.url,phase:'PRODUCTION_PREFIX',query:r.query,problem:r.problem})),
  reads:prefixReads,postIdentityReads:identityReadCount===undefined?[]:reads.slice(identityReadCount),postIdentityIssues,uncertainties,diagnostic:diagnostic??null,googleRequests:google.googleRequestUsage(subject.key),navigations,
  mode:'PRODUCTION_TABELOG_IDENTITY_PREFIX_ON_FROZEN_IO',availabilityEvaluation:'NOT_EVALUATED',sourceTransportCalls:0,realModel:0,realGoogle:0,realGET:0};
 assert(uniqueDetails.length<=5,'distinct candidate detail cap');save(`${root}/product-execution/${subject.key}.json`,result);
 const verdict=JSON.parse(execFileSync('python3',['-B',root+'/score-simulation.py','--one',`${root}/product-execution/${subject.key}.json`],{encoding:'utf8'}));
 completed.push({key:subject.key,verdict:verdict.verdict,old23:verdict.old23,focusThree:verdict.focusThree});console.log(JSON.stringify(completed.at(-1)));
 if(verdict.verdict==='WRONG_ACCEPTED')throw Error('S0_WRONG_OUTLET_STOP');
}}finally{await browser.close();save(root+'/product-summary.json',{configurationCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'PRODUCTION_IDENTITY_PREFIX_NOT_STOCK_OR_LIVE',completed,
 retainedOld23:completed.filter(r=>r.old23&&r.verdict==='CORRECT_ACCEPTED').length,retainedFocusThree:completed.filter(r=>r.focusThree&&r.verdict==='CORRECT_ACCEPTED').length,sourceTransportCalls:0,realModel:0,realGoogle:0,realGET:0});}
