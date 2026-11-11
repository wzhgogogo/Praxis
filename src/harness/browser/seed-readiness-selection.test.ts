import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {LocalPlaywrightChromium} from '../../infrastructure/browser/local-playwright-chromium.js';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import {tabelogQueryControlHints,TABELOG_VACANCY_RESPONSES} from '../../integrations/tabelog/tabelog-query-controls.js';
import {tabelogPublicReadNetworkPolicy} from '../../integrations/tabelog/tabelog-public-query.js';
import {tabelogAvailabilityCompletion} from '../../integrations/tabelog/tabelog-browser-availability.js';

// LOCAL_CONSTRUCTION: the recorded 07 carousel reveals one guest at a time.
// Its unobserved continuation to ten and December are constructed, never replayed inventory.
for(const mode of ['EXACT_RESPONSE','WRONG_PARTY','PENDING'] as const)test('seed readiness Chromium: month and guest pagination '+mode,{timeout:30_000},async()=>{
 const dir=await mkdtemp(join(tmpdir(),'praxis-seed-selection-')),har=join(dir,'fixture.har');
 const url='https://tabelog.com/en/tokyo/A1319/A131904/13231218/',date='2026-12-18';
 const responseUrl='https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=13231218&svd=20261218&svps=';
 const body=(party:number)=>JSON.stringify({base_date:{year:2026,month:12,day:18},members:party,selection:[{time:'20:30',url:'/en/booking/form_course/new?rcd=13231218&member='+party+'&visit_date=20261218&visit_time=2030'}]});
 const html=`<h1>LOCAL_CONSTRUCTION selection</h1><div class="p-booking-calendar"><table><caption id="month">Nov 2026</caption><tr><td id="day"></td></tr></table><button type="button" aria-label="Next month" onclick="document.getElementById('month').textContent='Dec 2026';document.getElementById('day').innerHTML='<button type=button data-year=2026 data-month=12 data-day=18 onclick=pickDate()>18</button>'">Next month</button><div class="p-booking-calendar__people-button-box" id="people"></div><button type="button" onclick="first++;render()">More guests</button><div id="result"></div></div><script>
 let first=1,party=2;function render(){document.getElementById('people').innerHTML=Array.from({length:6},(_,i)=>first+i).map(n=>'<button type="button" class="p-booking-calendar__people-button" onclick="pickGuests('+n+')">'+n+'</button>').join('');}
 async function read(){const response=await fetch('${responseUrl}'+party);await response.json();document.getElementById('result').textContent='Source result for '+party+' guests';}
 function pickDate(){read();}function pickGuests(n){party=n;read();}render();</script>`;
 const entries=Object.entries({[url]:html,[responseUrl+'2']:body(2),[responseUrl+'10']:body(mode==='WRONG_PARTY'?2:10)}).map(([target,text])=>({startedDateTime:'2026-11-11T02:30:00Z',request:{method:'GET',url:target,headers:[],queryString:[],cookies:[],httpVersion:'HTTP/1.1',headersSize:-1,bodySize:-1},response:{status:200,statusText:'OK',httpVersion:'HTTP/1.1',headers:[{name:'content-type',value:target===url?'text/html':'application/json'}],content:{text,mimeType:target===url?'text/html':'application/json',size:Buffer.byteLength(text)},cookies:[],redirectURL:'',headersSize:-1,bodySize:Buffer.byteLength(text)},cache:{},timings:{send:0,wait:0,receive:0}}));
 await writeFile(har,JSON.stringify({log:{version:'1.2',creator:{name:'LOCAL_CONSTRUCTION',version:'1'},entries}}));
 const raw=new LocalPlaywrightChromium();let clicks=0,dateClicks=0;const events:unknown[]=[];
 const executor=new BrowserTaskExecutor({readNetworkBoundaryCapability:'ISOLATED_CONTEXT',openSession:input=>raw.openSession({...input,replayHarPath:har})},{onDiagnostic:e=>{if(["REJECTED","POST_ACTION_VERIFIED","METHOD_INCOMPLETE"].includes(e.event))events.push({event:e.event,detail:e.detail});},maxAutomaticElapsedMs:20_000,maxModelCallsPerCandidate:10,maxModelCallsTotal:10,maxOperationsPerCandidate:60,modelDecision:{async decide(input){
   const targets=input.observation.targets;const ten=targets.find(t=>t.availableActions?.includes('CLICK_AUTHORITATIVE:PARTY_SIZE'));
   if(ten){clicks++;return {type:'CLICK_AUTHORITATIVE',targetRef:ten.ref,field:'PARTY_SIZE',reason:'Select the requested visible ten.'};}
   const day=targets.find(t=>t.availableActions?.includes('CLICK_AUTHORITATIVE:DATE'));
   if(day){dateClicks++;return{type:'CLICK_AUTHORITATIVE',targetRef:day.ref,field:'DATE',reason:'Select the requested visible date.'};}
   const more=targets.find(t=>t.label==='More guests'),month=targets.find(t=>t.label==='Next month');
   const next=dateClicks?more:month;if(next)return{type:'CLICK',targetRef:next.ref,reason:'Observe the next public controls.'};
   return {type:'REQUEST_HUMAN_HELP',reason:'No actionable requested controls.'};
 }}});
 const signal=new AbortController().signal;executor.beginCandidate('constructed');executor.beginProvider('constructed','TABELOG','AVAILABILITY');
 try{
  const session=await executor.acquire(signal,'TABELOG','AVAILABILITY',tabelogPublicReadNetworkPolicy);await session.captureResponses?.(TABELOG_VACANCY_RESPONSES);await executor.navigate({source:'TABELOG',stage:'AVAILABILITY',signal,session,url,allowedOrigins:['https://tabelog.com'],observed:true});
  const result=await executor.runSkill({taskId:'constructed',source:'TABELOG',stage:'AVAILABILITY',signal,session,allowedOrigins:['https://tabelog.com'],goal:{outlet:{name:'Constructed'},date,partySize:10,timeWindow:{earliest:'20:30',latest:'20:30'},hardCriteria:[]},objective:'Choose the requested month, date and guest count through observed controls.',controlHints:tabelogQueryControlHints,completion:page=>tabelogAvailabilityCompletion(mode==='PENDING'?{...page,settlement:'PENDING'}:page,{date,partySize:10,timeWindow:{earliest:'20:30',latest:'20:30'}})});
  if(mode==='EXACT_RESPONSE'){assert.equal(result.status,'COMPLETED',JSON.stringify({events,status:result.status,responses:result.snapshot.responses,diagnostics:result.snapshot.networkDiagnostics}));assert.equal(dateClicks,1,'source-confirmed date is not reselected while paging guests');assert.equal(clicks,1,'ten is chosen only when visible');assert.ok(result.snapshot.responses?.some(r=>(r.body as {members:number}).members===10));}
  else assert.notEqual(result.status,'COMPLETED','wrong-party response and PENDING never establish request selection');
 }finally{await executor.closeAll();await rm(dir,{recursive:true,force:true});}
});
