import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';
import {tabelogDiscoveryPack} from '../../../src/integrations/restaurant-search/source-packs.ts';
import {parseTabelogSearchOutlets} from '../../../src/integrations/tabelog/tabelog-page-parser.ts';
import {prioritizeTabelogOutlets} from '../../../src/integrations/tabelog/tabelog-entity-resolver.ts';
import {permittedURL} from './transport.mjs';
const R='.eval-artifacts/phase3b/g4-japanese-directed-20261031',load=p=>JSON.parse(readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex'),save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const inputs=load(R+'/inputs.json'),subject=inputs.cases.find(r=>r.id==='nr-007');
const candidate={restaurant:{id:'g4:nr-007',outletName:subject.subject.name,address:subject.subject.address,coordinates:subject.subject.coordinates,sourceIds:{googlePlaces:subject.googlePlaceId,phone:subject.subject.phone},provenance:{}},matchReasons:[],warnings:[],executionConfidence:'LOW'};
const mode=process.argv.at(-1),basis=paths=>paths.map(path=>({path,sha256:sha(path)}));
try{
 if(mode==='search'){
  const name=load(R+'/google-name.json');assert.equal(name.placeId,subject.googlePlaceId);assert(name.text.trim());
  const prior=load('.eval-artifacts/phase3b/g4-japanese-wiring/execution/main-nr-007.json');assert.equal(prior.details.length,0);assert(prior.searches.every(q=>q.ordered.length===0));
  const normalize=s=>s.normalize('NFKC').trim().toLowerCase();if(prior.searches.some(q=>normalize(q.query)===normalize(name.text)))throw Object.assign(Error('duplicate'),{code:'JAPANESE_NAME_DUPLICATES_EXISTING_QUERY'});
  const url=tabelogDiscoveryPack.availability.buildRequestUrl({candidate:candidate.restaurant,request:{date:'1970-01-01',partySize:1,timeWindow:{earliest:'00:00',latest:'00:00'}},outletName:name.text});
  assert(permittedURL('SEARCH',url,inputs.googleRequest.url));
  save(R+'/02-beef-search.manifest.json',{stage:'BEEF_SEARCH',basis:basis([R+'/google-name.json',name.rawBodyPath]),generatedBy:'tabelogDiscoveryPack.availability.buildRequestUrl / same production form as G4 E2E',sourceName:name.text,actualLanguageCode:name.languageCode,requests:[{id:'beef-search',subjectId:'nr-007',kind:'SEARCH',url,query:name.text,querySource:'SAME_PLACE_ID_GOOGLE_JA_FULL_NAME'}]});
 }else if(mode==='details'){
  const receipt=load(R+'/requests/beef-search.result.json');assert(!receipt.failure&&receipt.bodyComplete&&receipt.status===200);assert.equal(sha(receipt.bodyPath),receipt.sha256);
  const query=load(R+'/02-beef-search.manifest.json').sourceName;
  const oracle=JSON.parse(execFileSync('python3',['-B','.eval-artifacts/phase3b/g4-japanese-wiring/inspect-search.py',receipt.bodyPath,receipt.url,query],{encoding:'utf8'}));
  if(!oracle.queryVisible||!oracle.structureVerified)throw Object.assign(Error('changed'),{code:'SOURCE_SEARCH_STRUCTURE_OR_QUERY_CHANGED'});
  const browser=await chromium.launch({headless:true});let ordered,snapshot,blocked=0;
  try{const context=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});await context.route('**/*',r=>{blocked++;return r.abort();});const page=await context.newPage();const html=readFileSync(receipt.bodyPath,'utf8');await page.setContent(html,{waitUntil:'domcontentloaded'});snapshot={url:receipt.url,title:await page.title(),text:await page.locator('body').innerText(),html};ordered=prioritizeTabelogOutlets(candidate,parseTabelogSearchOutlets(snapshot));}finally{await browser.close();}
  const prefix=load('.eval-artifacts/phase3b/g4-japanese-wiring/execution/main-nr-007.json');assert.equal(prefix.details.length,0);
  const selected=ordered.slice(0,5);if(selected.some(o=>!permittedURL('DETAIL',o.sourceUrl,inputs.googleRequest.url)))throw Object.assign(Error('scope'),{code:'SELECTED_DETAIL_OUTSIDE_EN_SCOPE'});
  save(R+'/beef-selection.json',{sourcePage:receipt.bodyPath,sha256:receipt.sha256,query,source:'CURRENT_PUBLIC_FIRST_SCREEN',ordered,selected,detailCap:5,priorDetailsUsed:0,remaining:5,policy:'Existing production sort and4+1; no Gold read, no target ID injected',rendererBlockedRequests:blocked});
  save(R+'/03-beef-details.manifest.json',{stage:'BEEF_DETAILS',basis:basis([receipt.bodyPath,R+'/beef-selection.json']),generatedBy:'prioritizeTabelogOutlets + existing 4+1 (0 prior details; remaining5)',requests:selected.map((o,i)=>({id:'beef-detail-'+(i+1),subjectId:'nr-007',kind:'DETAIL',url:o.sourceUrl,selectionOrdinal:i+1}))});
 }else throw Error('unknown mode');
 console.log(JSON.stringify({status:'PLANNED_NOT_REQUESTED',mode}));
}catch(error){
 const path=R+'/state.json';if(existsSync(path)){const state=load(path);state.status='STOPPED';state.stop=error?.code??'SOURCE_DEPENDENT_PLANNING_FAILED';writeFileSync(path,JSON.stringify(state,null,2)+'\n');}
 console.log(JSON.stringify({status:'STOPPED',reason:error?.code??'SOURCE_DEPENDENT_PLANNING_FAILED'}));process.exitCode=2;
}
