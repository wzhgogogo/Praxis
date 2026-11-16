import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {RestaurantCaseView} from '../../application/agent-workspace.js';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import {createLiveReadAssembly} from '../../integrations/restaurant-search/live-read-assembly.js';
import {LIVE_READ_DEBUG_INVESTIGATION_BUDGET} from '../../application/live-read-investigation-budget.js';
import type {BrowserReadDecisionInput} from '../../infrastructure/browser/browser-action-decision.js';
import type {ModelGateway} from '../../core/model/contracts.js';
import {restaurantBookingTaskDefinition} from '../../domains/restaurant/task-definition.js';
import {completeRestaurantIntent} from '../../domains/restaurant/intent-state.js';
import {presentBookingHandoff} from '../../domains/restaurant/booking-handoff.js';
import {recordedHtml,recordedRuntime,recordedUrl,recordedAt,candidate} from './fixtures/recorded-g1-query.js';

// Recorded DOM supplies actual merchant/header + untouched readonly inputs,
// their compact displays and aria-live logs. Source widget query/date/result
// updates below are explicitly constructed HTML inventory, not retained shop
// JSON or proof of real four-person stock. No input.value assignment occurs.
for(const mode of ['party','time','wrong-time','wrong-party']as const)test(`TableCheck recorded-control component ${mode} binds only its actual query and B1`,{timeout:45000},async()=>{
 const party=mode.includes('party')?4:2,wide=mode.includes('time'),wrong=mode.startsWith('wrong');
 const script=`const guests=[...document.querySelectorAll('input[role="combobox"]')].find(n=>n.getAttribute('aria-label')==='Any party size');
 const clock=[...document.querySelectorAll('input[role="combobox"]')].find(n=>n.getAttribute('aria-label')==='Time');
 const pax=document.getElementById('pax-2'),time=document.getElementById('time-19:00'),form=pax.closest('form');
 const day=document.createElement('button');day.type='button';day.setAttribute('data-testid','day');day.setAttribute('data-date','2026-11-18');day.setAttribute('aria-selected','true');day.textContent='18';
 const result=document.createElement('div');form.replaceChildren(day,pax,time,result);let size=2,current='19:00';
 const draw=()=>{result.replaceChildren();if(${JSON.stringify(wide)}&&current==='19:00'){const empty=document.createElement('p');empty.setAttribute('data-testid','Venue Unavailable Msg');empty.textContent='We could not find a table on Nov 18th for the selected mealtime';result.append(empty);}
 else{const link=document.createElement('a');link.href='https://www.tablecheck.com/en/nakamata-nodoguro-ginza/reserve/landing?start_date=2026-11-18&num_people='+size+'&start_time='+encodeURIComponent(current);link.textContent=current;result.append(link);}};draw();
 const install=(owner,field,top)=>{const display=owner.previousElementSibling;owner.onkeydown=event=>{if(event.key!=='ArrowDown')return;owner.setAttribute('aria-expanded','true');const id='options-'+field+'-'+top;owner.setAttribute('aria-controls',id);const list=document.createElement('div');list.id=id;list.setAttribute('role','listbox');list.style.cssText='position:fixed;left:20px;top:200px;width:200px;background:white;z-index:10000';const option=document.createElement('div');option.setAttribute('role','option');option.textContent=field==='PARTY_SIZE'?'4 guests':top?'20:00':'20:30';list.append(option);document.body.append(list);
 option.onclick=()=>{owner.setAttribute('aria-expanded','false');list.hidden=true;display.textContent=option.textContent;if(top)return;
 if(field==='PARTY_SIZE'){size=4;pax.id='pax-'+size;}else{current='20:30';time.id='time-'+current;}draw();};};};
 install(guests,'PARTY_SIZE',false);install(clock,'TIME',false);
 ${wrong?`const unrelatedContainer=(${wide?'clock':'guests'}).parentElement.cloneNode(true);const extraHeader=document.createElement('header');extraHeader.append(unrelatedContainer);document.body.prepend(extraHeader);const unrelatedControl=unrelatedContainer.querySelector('input');unrelatedControl.id='unrelated-query';unrelatedControl.name='unrelated-query';unrelatedControl.setAttribute('aria-expanded','false');install(unrelatedControl,'${wide?'TIME':'PARTY_SIZE'}',true);`:''}`;
 const f=await recordedRuntime(await recordedHtml(script));const currentCandidate=structuredClone(candidate);const guide=new URL(recordedUrl);guide.search='';currentCandidate.restaurant.sourceIds.tablecheckNativeGuideUri=guide.href;
 const request={candidateIds:[candidate.restaurant.id],candidates:[currentCandidate],selectionScope:'SPECIFIC_OUTLET' as const,date:'2026-11-18',partySize:party,timeWindow:wide?{earliest:'18:30',latest:'21:00'}:{earliest:'19:00',latest:'19:00'},hardCriteria:[]};
 const confirmations:string[]=[];const advances:Array<string|undefined>=[];let calls=0,advanceCalls=0;const observed:Array<unknown>=[];
 const model:ModelGateway={async complete(modelRequest){
  assert.equal(modelRequest.purpose,'browser_read_decide');const input=JSON.parse(modelRequest.messages.find(m=>m.role==='user')!.content) as BrowserReadDecisionInput;
  const decide=()=>{
  calls++;observed.push({purpose:input.objective.slice(0,90),progress:input.progress});const advancing=input.objective.includes('Already checked times:');if(advancing)advanceCalls++;
  const field=wide?'TIME':'PARTY_SIZE',label=wide?'Time':'Any party size',option=wide?(wrong?'20:00':'20:30'):'4 guests';
  if(calls===1)return {type:'CLICK',targetRef:input.observation.targets.filter(t=>t.role==='combobox'&&t.label===label)[0]!.ref,reason:wrong?'Adversarial choice of the observed unrelated top control':'Choose the observed store query control'};
  if(calls===2){observed.push({targets:input.observation.targets.filter(t=>t.kind==='OPTION'||t.role==='combobox')});const target=input.observation.targets.find(t=>t.label===option&&t.availableActions?.includes('CHOOSE_OPTION:'+field));assert.ok(target,JSON.stringify({option,targets:input.observation.targets}));return {type:'CHOOSE_OPTION',field,targetRef:target.ref,reason:'Select the requested observed option'};}
  return wrong?{type:'REQUEST_HUMAN_HELP',reason:'The bound shop query did not follow the other control'}:{type:'COMPLETE',reason:'The actual source query followed the confirmed selection'};
};const choice=decide();
  return {invocationId:'LOCAL_CONSTRUCTION',provider:'FIXTURE',model:'fixture',latencyMs:0,finishReason:'TOOL_CALLS',outputText:JSON.stringify({action:choice.type,targetRef:'targetRef'in choice?choice.targetRef:'',valueGroupRef:'',authoritativeField:'field'in choice?choice.field:'NONE',requestedState:'NONE',reason:choice.reason})};
 }};
 const assembly=createLiveReadAssembly(LIVE_READ_DEBUG_INVESTIGATION_BUDGET,{model,browser:f.runtime,google:{} as Parameters<typeof createLiveReadAssembly>[1]['google'],clock:{now:()=>new Date(recordedAt)},currentTaskId:()=> 'recorded-control-task'});
 const skills:unknown[]=[];const originalSkill=BrowserTaskExecutor.prototype.runSkill;BrowserTaskExecutor.prototype.runSkill=async function(...args){const prior=args[0].onOptionConfirmed;args[0]={...args[0],onOptionConfirmed:(field,label)=>{confirmations.push(field+':'+label);prior?.(field,label);}};const value=await originalSkill.apply(this,args);skills.push({status:value.status,reasonCode:value.reasonCode});return value;};
 const original=BrowserTaskExecutor.prototype.advanceAvailabilityTime;BrowserTaskExecutor.prototype.advanceAvailabilityTime=async function(...args){const value=await original.apply(this,args);advances.push(value);return value;};
 try{const read=await assembly.availability.check(request,new AbortController().signal);assert.deepEqual(f.scriptErrors,[],'No fixture script failure may masquerade as a safe rejection');const check=read.availabilityChecks[candidate.restaurant.id]!;
 assert.equal(check.status==='AVAILABLE',!wrong,JSON.stringify({mode,calls,advances,check,metadata:read.metadata}));
 if(wide){assert.ok(advanceCalls>0,JSON.stringify({mode,check,observed}));assert.deepEqual(advances,wrong?[undefined]:['20:30']);}
 const intentDraft={schemaVersion:'3' as const,timezone:'Asia/Tokyo' as const,target:{goal:'AVAILABILITY' as const,selectionScope:'SPECIFIC_OUTLET' as const,query:candidate.restaurant.outletName},date:request.date,partySize:party,timeWindow:request.timeWindow,criteria:[]};
 const initial={...restaurantBookingTaskDefinition.create({}, {taskId:'recorded-control-task',runId:'component',now:recordedAt,createId:(p:string)=>p}),phase:'SEARCHING' as const,intentDraft,candidates:[currentCandidate]};
 const state=restaurantBookingTaskDefinition.transition(initial,{type:'AVAILABILITY_CHECKED',request,offers:read.offers,availabilityChecks:read.availabilityChecks,evidence:read.evidence,metadata:read.metadata},{taskId:'recorded-control-task',runId:'component',now:recordedAt,createId:p=>p}).state;
 const view={case:{rootTaskId:'recorded-control-task'},restaurant:state} as unknown as RestaurantCaseView;
 const prepared=assembly.bookingHandoffs.readPrepared(view);assert.equal(prepared.length,wrong?0:1,JSON.stringify({mode,intent:completeRestaurantIntent(intentDraft),check,offers:read.offers,evidence:read.evidence.map(e=>({kind:e.kind,provider:e.provider,url:e.sourceUrl,confidence:e.entityMatch?.confidence,claims:e.claims})),lastUrl:f.snapshots.at(-1)?.url}));
 if(!wrong){const offer=read.offers[0]!;const handoff=presentBookingHandoff(prepared[0]!,{candidate:currentCandidate,offer,check:state.availabilityChecks[candidate.restaurant.id]!,request:completeRestaurantIntent(intentDraft)!,evidence:read.evidence,now:recordedAt});assert.ok(handoff);const url=new URL(handoff.url);assert.equal(url.searchParams.get('num_people'),String(party));assert.equal(url.searchParams.get('start_date'),request.date);assert.equal(url.searchParams.get('start_time'),wide?'20:30':'19:00');}
 else{assert.ok(f.controls.some(controls=>controls.some(c=>c.structure?.name==='unrelated-query'&&c.selectionReadback?.menuClosed&&c.selectionReadback.displayText===(wide?'20:00':'4 guests'))&&controls.some(c=>c.role==='combobox'&&c.structure?.name!=='unrelated-query'&&c.selectionReadback?.displayText===(wide?'19:00':'2 guests'))),JSON.stringify({reason:'The unrelated control really closed and read back its new value while the store stayed unchanged',calls,check,metadata:read.metadata,observed,skills,confirmations,controls:f.controls.map(row=>row.filter(c=>c.role==='combobox').map(c=>({name:c.structure?.name,label:c.label,proof:c.selectionReadback})))} ));assert.ok(confirmations.includes(wide?'TIME:20:00':'PARTY_SIZE:4 guests'),'Wrong top control passed actual option readback before query binding rejected it');assert.equal(read.offers.length,0);assert.ok(!check.timeWindowCoverage?.covered.some(p=>p.earliest==='20:00'),'Unrelated top time can never count as coverage');}
 const values=f.snapshots.flatMap(s=>(s.interactiveState??'').split('\n').filter(Boolean).map(line=>JSON.parse(line))).filter(c=>c.tag==='INPUT'&&c.role==='combobox');assert.ok(values.length&&values.every(v=>v.value===''));
 }finally{BrowserTaskExecutor.prototype.advanceAvailabilityTime=original;BrowserTaskExecutor.prototype.runSkill=originalSkill;await f.close();}
});
