import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {localFixture} from './browser-read-test-fixtures.js';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import type {BrowserSession} from '../../infrastructure/browser/browser-runtime.js';
import {tabelogQueryControlHints} from '../../integrations/tabelog/tabelog-query-controls.js';
import {tabelogAvailabilityCompletion} from '../../integrations/tabelog/tabelog-browser-availability.js';
import {cases,recordedPartyPage} from '../../integrations/tabelog/fixtures/party-response-recorded/fixture.js';
const folder=new URL('../../integrations/tabelog/fixtures/party-response-recorded/',import.meta.url);
for(const meta of cases)test(`recorded party progress releases the unchanged executor to the calendar: ${meta.id}`,{timeout:60000},async t=>{
 const reply=await recordedPartyPage(meta),before=await readFile(new URL(meta.dom.before.file,folder),'utf8');assert.equal(createHash('sha256').update(before).digest('hex'),meta.dom.before.sha256);
 const csp='<meta http-equiv="Content-Security-Policy" content="script-src \'none\'; connect-src \'none\'; img-src \'none\'; style-src \'unsafe-inline\'">';
 const pages={[meta.pageURL]:csp+before},raw=await localFixture(pages).openSession({signal:new AbortController().signal});await raw.navigate(meta.pageURL,{waitUntil:'domcontentloaded'});
 let after=false,calls=0,calendarClicks=0;const events:any[]=[];const inputs:any[]=[];
 // Real DOM and real native clicks; stripped source listeners are replaced at
 // the transport boundary only with the original recorded post-click DOM/HAR.
 // There is no captured next-month state in this run. Stop after native month
 // navigation; do not construct a December page or assert availability.
 const session={...raw,metadata:{...raw.metadata,readNetworkBoundary:'INSTALLED'},
  async snapshot(){return{...await raw.snapshot(),responses:after?reply.responses:[],settlement:'SETTLED'};},
  async observeControls(){const controls=await raw.observeControls!(tabelogQueryControlHints(reply));for(const c of controls)if(c.kind===meta.calendarAdvance.kind&&c.label===meta.calendarAdvance.label&&meta.calendarAdvance.href)c.href=meta.calendarAdvance.href;return controls;},
  async click(id:string){await raw.click(id);if(!after){after=true;pages[meta.pageURL]=csp+reply.html;await raw.navigate(meta.pageURL,{waitUntil:'domcontentloaded'});}else calendarClicks++;},
  async waitForSettled(){return true;},close:()=>raw.close()} as unknown as BrowserSession;
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:45000,maxOperationsPerCandidate:60,maxModelCallsPerCandidate:3,maxModelCallsTotal:3,onDiagnostic:e=>events.push(e),modelDecision:{async decide(input){calls++;inputs.push({calls,progress:input.progress,advance:input.observation.targets.filter(v=>v.label===meta.calendarAdvance.label).map(v=>({kind:v.kind,actions:v.availableActions,href:v.href}))});
  if(calls===1){const target=input.observation.targets.find(v=>v.availableActions?.includes('CLICK_AUTHORITATIVE:PARTY_SIZE'));assert.ok(target);return{type:'CLICK_AUTHORITATIVE',targetRef:target.ref,field:'PARTY_SIZE',reason:'Original recorded authoritative guest selection'};}
  assert.doesNotMatch(input.progress,/PARTY_SIZE_NOT_CONFIRMED/);
  if(calls===2){assert.match(input.progress,/date/);const target=input.observation.targets.find(v=>v.kind===meta.calendarAdvance.kind&&v.label===meta.calendarAdvance.label);assert.ok(target);assert.ok(target.availableActions?.includes('CLICK'));return{type:'CLICK',targetRef:target.ref,reason:'Continue the remaining calendar field through the observed control'};}
  return{type:'REQUEST_HUMAN_HELP',reason:'Component stops at recorded calendar handoff; no future-date response available'};
 }}});
 try{const result=await executor.runSkill({taskId:'recorded-party-progress',source:'TABELOG',stage:'AVAILABILITY',signal:new AbortController().signal,session,allowedOrigins:[new URL(meta.pageURL).origin],goal:meta.goal,objective:'Apply the requested settings using the observed controls',controlHints:tabelogQueryControlHints,completion:page=>tabelogAvailabilityCompletion(page,meta.goal)});
  assert.equal(result.status,'REQUESTED_HUMAN_HELP',JSON.stringify(inputs));assert.equal(calendarClicks,1);assert.equal(calls,3);assert.ok(!events.some(v=>v.detail==='PARTY_SIZE_NOT_CONFIRMED'));t.diagnostic(JSON.stringify({mode:'RECORDED_COMPONENT',originalRepeatedPartyDecisions:meta.id==='outlet-a'?5:3,afterPartyNextDecision:'CALENDAR',liveOrCompleteDateClaim:false,realCalls:0}));
 }finally{await executor.closeAll();await raw.close();}
});
