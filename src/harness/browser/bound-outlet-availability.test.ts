import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {guardedPages} from './browser-read-test-fixtures.js';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import {TableCheckBrowserAvailability} from '../../integrations/tablecheck/tablecheck-browser-availability.js';
import {discoveryPackNetworkPolicy} from '../../integrations/restaurant-search/source-packs.js';
import {parseTableCheckOutletIdentityWithEvidence} from '../../integrations/tablecheck/tablecheck-page-parser.js';
import type {RestaurantAvailabilityRequest} from '../../domains/restaurant/contracts.js';

const base=new URL('../fixtures/d8-direct-outlet-20261109/',import.meta.url);
const boundUrl='https://www.tablecheck.com/en/nakamata-nodoguro-ginza';
// Real sanitized DOM and decisions. HAR envelopes only are LOCAL_CONSTRUCTION;
// there is no shop JSON and this does not claim complete network Replay or availability.
for(const current of [true,false])test(`confirmed outlet availability starts at recorded date controls; alreadyCurrent=${current}`,async()=>{
 const candidate=JSON.parse(await readFile(new URL('candidate.json',base),'utf8'));
 const html=await readFile(new URL('snapshot-0044.html',base),'utf8'),loaded=boundUrl+'?service_mode=dining&sort_by=relevance&venue_type=tc';
 const f=await guardedPages({[boundUrl]:html,[loaded]:html},discoveryPackNetworkPolicy());
 const calls:Array<{stage:string;action:string}>=[],navigations:string[]=[];
 const executor=new BrowserTaskExecutor(f.runtime,{reuseSourceSessions:true,maxAutomaticElapsedMs:300000,maxModelCallsPerCandidate:4,maxModelCallsTotal:8,maxOperationsPerCandidate:30,
  modelDecision:{async decide(input){
   if(input.stage!=='AVAILABILITY'){calls.push({stage:input.stage,action:'REQUEST_HUMAN_HELP'});return {type:'REQUEST_HUMAN_HELP',reason:'Recorded search detour is forbidden by the confirmed outlet contract'};}
   const date=input.observation.targets.find(t=>t.availableActions?.includes('CLICK_AUTHORITATIVE:DATE'));
   if(date&&!calls.length){calls.push({stage:input.stage,action:'CLICK_AUTHORITATIVE:DATE'});return {type:'CLICK_AUTHORITATIVE',field:'DATE',targetRef:date.ref,reason:'Select the authoritative date on the recorded outlet widget'};}
   calls.push({stage:input.stage,action:'REQUEST_HUMAN_HELP'});return {type:'REQUEST_HUMAN_HELP',reason:'Source response is not captured; no fabricated availability'};
  }}});
 const signal=new AbortController().signal;
 try{
  const session=await executor.acquire(signal,'TABLECHECK','IDENTITY',discoveryPackNetworkPolicy());
  if(current)await executor.navigate({source:'TABLECHECK',stage:'IDENTITY',session,signal,allowedOrigins:['https://www.tablecheck.com'],url:loaded,observed:true});
  const navigate=session.navigate.bind(session);session.navigate=async(url,options)=>{navigations.push(url);await navigate(url,options);};
  const source=new TableCheckBrowserAvailability(executor,undefined,{networkPolicy:discoveryPackNetworkPolicy()});
  const request={candidateIds:[candidate.restaurant.id],candidates:[candidate],date:'2026-11-11',timeWindow:{earliest:'20:30',latest:'20:30'},partySize:2,hardCriteria:[],verifiedOutletPages:[{candidateId:candidate.restaurant.id,provider:'TABLECHECK',sourceUrl:boundUrl,sourceEntityId:'nakamata-nodoguro-ginza'}]} satisfies RestaurantAvailabilityRequest;
  await source.check(request,signal);
  assert.equal(calls[0]?.stage,'AVAILABILITY',JSON.stringify(calls));assert.equal(calls[0]?.action,'CLICK_AUTHORITATIVE:DATE',JSON.stringify(calls));
  assert.deepEqual(navigations,current?[]:[boundUrl]);
 }finally{await executor.close();await f.close();}
});

test('recorded twenty-page corpus retains outlet identity and the original search detour decisions',async()=>{
 const provenance=JSON.parse(await readFile(new URL('provenance.json',base),'utf8'));
 for(const file of provenance.files){const html=await readFile(new URL(file.file,base),'utf8');const parsed=parseTableCheckOutletIdentityWithEvidence({url:file.url,html,text:html.replace(/<[^>]*>/g,' '),title:'Recorded outlet'},boundUrl);assert.equal(parsed?.outlet.sourceEntityId,'nakamata-nodoguro-ginza');}
 const decisions=JSON.parse(await readFile(new URL('decisions.json',base),'utf8'));
 assert.equal(JSON.parse(decisions.find((d:any)=>d.sequence===28).outputText).action,'FILL_AUTHORITATIVE');assert.equal(JSON.parse(decisions.find((d:any)=>d.sequence===33).outputText).action,'CLICK_AUTHORITATIVE');
});
