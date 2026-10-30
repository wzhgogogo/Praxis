import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
import {GooglePlacesClient} from '../../../src/integrations/google/google-places-client.ts';
import {tabelogDiscoveryPack} from '../../../src/integrations/restaurant-search/source-packs.ts';
import {simulateNamedRetrieval} from '../../../src/eval/restaurant/search-fixture/named-retrieval-simulation.ts';

const root='.eval-artifacts/phase3b/g4-japanese-prep',load=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
for(const f of load(root+'/freeze.json').files)assert.equal(hash(readFileSync(f.path)),f.sha256,f.path);
assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
assert(!existsSync(root+'/simulation-summary.json'));
globalThis.fetch=async()=>{throw Error('SOURCE_NETWORK_FORBIDDEN_IN_SIMULATION');};
const config=load(root+'/inputs.json'),corpus=load(config.corpus).responses;
const extras=config.extraSearches.map(path=>{
 const row=load(path),body=row.bodyPath;
 const started=load(body.replace(/\.body\.html$/,'.started.json'));
 return {...row,url:started.url};
});
const byUrl=new Map();
for(const row of [...corpus,...extras])if(row.bodyPath&&!row.failure&&!byUrl.has(row.url))byUrl.set(row.url,row);
const supplements=new Map(corpus.filter(row=>row.backfill).map(row=>[row.url,row]));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
let blocked=0;
await context.route('**/*',route=>{blocked++;return route.abort();});
const page=await context.newPage(),completed=[];
const searchBindings=new Map();
try{for(const subject of config.rows){
 const old=load(subject.sourceExecutionPath),primary=new Map(old.requests.map(r=>[r.url,r])),reads=[];
 const candidate={restaurant:{id:`g4:${subject.id}`,outletName:subject.subject.name,address:subject.subject.address,coordinates:subject.subject.coordinates,
   sourceIds:{googlePlaces:subject.googlePlaceId,phone:subject.subject.phone},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
 let japaneseName;
 const rawPath=config.googleJapanese[subject.id];
 if(rawPath){
  const raw=load(rawPath);
  const client=new GooglePlacesClient({apiKey:'OFFLINE_FIXTURE',fetchImplementation:async(url,init)=>{
   assert.equal(new URL(url).searchParams.get('languageCode'),'ja');assert.equal(init.headers['X-Goog-FieldMask'],'id,displayName');
   return new Response(JSON.stringify(raw));
  }});
  japaneseName=await client.japaneseNamesForRun(new AbortController().signal)(subject.googlePlaceId);
 }
 let proposal;const record=old.modelRecords[0];
 if(record?.response)try{proposal=JSON.parse(record.response.outputText);}catch{/* Captured invalid JSON is rejected by the production fragment checker. */}
 async function saved(url,kind,query){
  const extra=kind==='SEARCH'?extras.find(r=>r.subjectId===subject.id&&r.query===query):undefined;
  const r=primary.get(url)??supplements.get(url)??extra??byUrl.get(url);
  if(!r?.bodyPath||r.failure){const problem=r?.failure?'RECORDED_NETWORK_FAILURE':'MISSING_SAVED_PAGE';reads.push({url,kind,query,problem});return {problem};}
  const bytes=readFileSync(r.bodyPath);assert.equal(hash(bytes),r.sha256);
  if(kind==='SEARCH'){
   const key=r.sha256+'|'+query;let binding=searchBindings.get(key);
   if(!binding){binding=JSON.parse(execFileSync('python3',['-B',root+'/inspect-search.py',r.bodyPath,r.url,query],{encoding:'utf8'}));searchBindings.set(key,binding);}
   if(!binding.queryVisible||!binding.structureVerified){reads.push({url,kind,query,problem:'SEARCH_STRUCTURE_OR_QUERY_UNBOUND'});return {problem:'SEARCH_STRUCTURE_OR_QUERY_UNBOUND'};}
  }
  await page.setContent(bytes.toString('utf8'),{waitUntil:'domcontentloaded'});
  reads.push({url,kind,query,bodyPath:r.bodyPath,sha256:r.sha256,originLedgerId:r.ledgerId??null,realGET:0});
  return {page:{url,title:await page.title(),text:await page.locator('body').innerText(),html:bytes.toString('utf8')}};
 }
 const result=await simulateNamedRetrieval({candidate,fragmentRecorded:!!record?.response,fragmentProposal:proposal,japaneseRecorded:!!rawPath,
  ...(japaneseName?{japaneseName}:{}),
  readSearch:query=>saved(tabelogDiscoveryPack.availability.buildRequestUrl({candidate:candidate.restaurant,request:{date:'1970-01-01',partySize:1,timeWindow:{earliest:'00:00',latest:'00:00'}},outletName:query}),'SEARCH',query),
  readDetail:outlet=>saved(outlet.sourceUrl,'DETAIL',null)});
 assert(result.bounds.details<=5&&result.bounds.searches<=3);
 const row={...result,id:subject.id,key:subject.key,view:subject.view,cohort:subject.cohort,sourceExecutionPath:subject.sourceExecutionPath,reads,
  fragmentOrigin:record?{prompt:record.request?.promptVersion??null,mode:'FROZEN_RESPONSE_REPLAY_NOT_MODEL_QUALITY'}:{mode:'NOT_CAPTURED'},
  japaneseOrigin:rawPath??null};
 save(`${root}/execution/${subject.key}.json`,row);
 const verdict=JSON.parse(execFileSync('python3',['-B',root+'/score-simulation.py','--one',`${root}/execution/${subject.key}.json`],{encoding:'utf8'}));
 completed.push({key:subject.key,status:verdict.verdict});
 console.log(JSON.stringify(completed.at(-1)));
 if(verdict.verdict==='WRONG_ACCEPTED')throw Error('S0_WRONG_OUTLET_STOP');
}}finally{await browser.close();save(root+'/simulation-summary.json',{configurationCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),mode:'OFFLINE_4_PLUS_1_NOT_PRODUCT_PATH',completed,rendererBlockedRequests:blocked,sourceTransportCalls:0,newGoogle:0,newModel:0,newPublicGET:0,live:0});}
