import {createLiveReadAssembly} from "../../integrations/restaurant-search/live-read-assembly.js";
import {LIVE_READ_DEBUG_INVESTIGATION_BUDGET} from "../../application/live-read-investigation-budget.js";
import {GooglePlacesClient} from "../../integrations/google/google-places-client.js";
import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {LocalPlaywrightChromium} from "../../infrastructure/browser/local-playwright-chromium.js";
import {BrowserTaskExecutor} from "../../infrastructure/browser/browser-task-executor.js";
import type {BrowserRuntime,BrowserSession} from "../../infrastructure/browser/browser-runtime.js";
import {TableCheckBrowserAvailability} from "../../integrations/tablecheck/tablecheck-browser-availability.js";
import {tableCheckPublicReadNetworkPolicy} from "../../integrations/tablecheck/tablecheck-public-query.js";
import {NativeSourceFactRead} from "../../integrations/restaurant-facts/native-source-facts.js";
import {tabelogQueryControlHints} from "../../integrations/tabelog/tabelog-query-controls.js";

const guide="https://www.tablecheck.com/en/window-fixture";
const identity='<h1>Window fixture</h1><p class="address">1-1 Fixture Street</p><a href="tel:03-1111-2222">Call</a>';
const candidate={restaurant:{id:"tablecheck:window-fixture",outletName:"Window fixture",address:"1-1 Fixture Street",sourceIds:{tablecheck:"window-fixture",tablecheckNativeGuideUri:guide},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH" as const};
const request={candidateIds:[candidate.restaurant.id],candidates:[candidate],date:"2026-11-06",partySize:6,timeWindow:{earliest:"18:00",latest:"20:00"},hardCriteria:[]};
async function fixture(html:string, source=guide, extraPages:Record<string,string>={}){
 const directory=await mkdtemp(join(tmpdir(),"praxis-group-window-")),har=join(directory,"source.har");
 await writeFile(har,JSON.stringify({log:{version:"1.2",creator:{name:"offline-group-window",version:"1"},entries:Object.entries({[source]:html,...extraPages}).map(([url,body])=>({startedDateTime:"2026-10-22T00:00:00Z",request:{method:"GET",url,headers:[],queryString:[],cookies:[],httpVersion:"HTTP/1.1",headersSize:-1,bodySize:-1},response:{status:200,statusText:"OK",httpVersion:"HTTP/1.1",headers:[{name:"content-type",value:body.startsWith('{')?"application/json":"text/html"}],content:{text:body,mimeType:body.startsWith('{')?"application/json":"text/html",size:Buffer.byteLength(body)},cookies:[],redirectURL:"",headersSize:-1,bodySize:Buffer.byteLength(body)},cache:{},timings:{send:0,wait:0,receive:0}}))}}));
 const raw=new LocalPlaywrightChromium(),navigations:string[]=[],sessions:BrowserSession[]=[];
 const runtime:BrowserRuntime={readNetworkBoundaryCapability:"ISOLATED_CONTEXT",async openSession(input){
  const session=await raw.openSession({...input,replayHarPath:har});sessions.push(session);
  const navigate=session.navigate.bind(session);session.navigate=async(url,options)=>{navigations.push(url);return navigate(url,options);};return session;
 }};
 return{runtime,navigations,async close(){await Promise.all(sessions.map(s=>s.close()));await rm(directory,{recursive:true,force:true});}};
}
function widget(mode:"available"|"all-empty"|"wrong-party"){
 const times=["18:00","18:17","18:43","19:11","19:53","20:05"];
 return identity+`<div data-testid="Venue Availability"><form><button data-testid="day" data-date="2026-11-6" aria-selected="true">6</button><div data-testid="Venue Pax Select" id="pax-6"></div><div data-testid="Venue Time Select" id="time-18:00"></div><div id="result"><span data-testid="Venue Unavailable Msg">We could not find a table on Nov 6th for the selected mealtime</span></div></form></div><label>Time<select id="clock" onchange="update(this.value)">${times.map((t,i)=>`<option value="${t}" ${i===0?'selected':''} ${t==='18:17'?'disabled':''}>${t}</option>`).join('')}</select></label><script>
 function update(time){document.querySelector('[data-testid="Venue Time Select"]').id='time-'+time;
 ${mode==='wrong-party'?`document.querySelector('[data-testid="Venue Pax Select"]').id='pax-5';`:''}
 document.getElementById('result').innerHTML=${mode==='available'?`'<a href="/en/shops/window-fixture/reserve?start_date=2026-11-06&amp;num_people=6&amp;start_time='+time+'">'+time+'</a>'`:`'<span data-testid="Venue Unavailable Msg">We could not find a table on Nov 6th for the selected mealtime</span>'`};}
 </script>`;
}
for(const mode of ["available","all-empty","wrong-party"] as const)test(`group-window Chromium: ${mode} keeps exact request and explicit coverage`,async()=>{
 const f=await fixture(widget(mode));
 let modelTransportCalls=0,googleCalls=0;
 const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxGoogleRequests:40},{browser:f.runtime,clock:{now:()=>new Date("2026-10-22T00:00:00Z")},
  model:{async complete(){modelTransportCalls++;return{invocationId:"group-window-scripted",provider:"FIXTURE",model:"scripted",outputText:JSON.stringify({action:"REQUEST_HUMAN_HELP",targetRef:"",authoritativeField:"NONE",requestedState:"NONE",reason:"A different party is selected; no current request result"}),finishReason:"TOOL_CALLS" as const,latencyMs:0};}},
  google:new GooglePlacesClient({apiKey:"fixture-only",fetchImplementation:async()=>{googleCalls++;throw Error("Native outlet must not issue a Google request");}})});
 try{
 const result=await assembly.availability.check(request,new AbortController().signal);
 assert.equal(modelTransportCalls,mode === "wrong-party" ? 1 : 0);assert.equal(googleCalls,0);assert.equal(assembly.browserBudget.totalModelCalls,modelTransportCalls);
 const check=result.availabilityChecks[candidate.restaurant.id]!;
 assert.equal(check.status,mode==='available'?"AVAILABLE":"UNKNOWN",JSON.stringify(result));
 assert.equal(f.navigations.some(url=>url.includes('/reserve')),false);
 const coverage=check.timeWindowCoverage!;assert.ok(coverage);assert.deepEqual(coverage.requestedWindow,request.timeWindow);
 assert.equal(coverage.covered[0]!.earliest,"18:00");assert.ok(coverage.uncovered.length);
 assert.equal(coverage.covered.some(p=>p.earliest==='18:17'||p.earliest==='20:05'),false,"disabled/outside-window time cannot be queried");
 if(mode==='available'){assert.equal(result.offers[0]!.dateTime,"2026-11-06T18:43:00+09:00");assert.equal(coverage.stopReason,"RESULT_FOUND");}
 if(mode==='all-empty'){assert.equal(result.metadata.failureCode,undefined,"a completed partial source observation is not a provider failure");assert.equal(coverage.covered.length,4);assert.equal(coverage.stopReason,"TIME_QUERY_LIMIT");assert.equal(check.reasonCode,"SELECTED_MEALTIME_EMPTY");assert.equal(result.offers.length,0);}
 if(mode==='wrong-party'){assert.equal(coverage.covered.length,1,"wrong-party new result is never added to covered scope");assert.equal(result.offers.length,0);}
 }finally{await f.close();}
});

test("group-window Chromium: forbidden entry is not attempted by availability or repeated FACTS",async()=>{
 const f=await fixture(identity+'<a href="/en/shops/window-fixture/reserve">Book a table</a>');
 try{
 const read=await new TableCheckBrowserAvailability(f.runtime,()=>"2026-10-22T00:00:00Z",{networkPolicy:tableCheckPublicReadNetworkPolicy}).check(request,new AbortController().signal);
 assert.equal(read.availabilityChecks[candidate.restaurant.id]!.status,"SOURCE_UNSUPPORTED");assert.equal(read.offers.length,0);
 const facts=new NativeSourceFactRead({maxAutomaticElapsedMs:30000,maxModelCallsPerCandidate:4,maxModelCallsTotal:8,maxOperationsPerCandidate:40},f.runtime,{async judge(){return{evidence:[]};}},()=>"2026-10-22T00:00:00Z",undefined,undefined,undefined,tableCheckPublicReadNetworkPolicy);
 for(let repeat=0;repeat<2;repeat++){
 const result=await facts.inspectFacts({candidateIds:request.candidateIds,candidates:request.candidates,intent:{timezone:"Asia/Tokyo",area:{query:"fixture"},criteria:[{text:"source fact",polarity:"POSITIVE",strength:"HARD"}]}},new AbortController().signal);
 assert.equal(result.factChecks[candidate.restaurant.id]!.reasonCode,"SOURCE_UNSUPPORTED");
 }
 assert.deepEqual(f.navigations,[guide,guide,guide],"only identity-grounded guide is read, never the prohibited workflow");
 }finally{await f.close();}
});

test("group-window Chromium: disabled exact party stops without clicking or changing the count",async()=>{
 const f=await fixture('<div class="p-booking-calendar"><div class="p-booking-calendar__select"><p>Guests</p><div role="group" aria-label="Guests" class="p-booking-calendar__people-button-box"><button type="button" class="p-booking-calendar__people-button is-selected" data-value="2">2</button><button type="button" class="p-booking-calendar__people-button is-disabled" data-value="10" disabled>10</button></div></div></div>');
 let decisions=0;const executor=new BrowserTaskExecutor(f.runtime,{maxAutomaticElapsedMs:20000,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,maxOperationsPerCandidate:30,modelDecision:{async decide(){decisions++;return{type:"REQUEST_HUMAN_HELP",reason:"unexpected"};}}});
 try{
 const session=await executor.acquire(new AbortController().signal,"FIXTURE","AVAILABILITY",tableCheckPublicReadNetworkPolicy);
 await executor.navigate({source:"FIXTURE",stage:"AVAILABILITY",session,signal:new AbortController().signal,allowedOrigins:[new URL(guide).origin],url:guide});
 const result=await executor.runSkill({taskId:"disabled-ten",source:"FIXTURE",stage:"AVAILABILITY",session,signal:new AbortController().signal,allowedOrigins:[new URL(guide).origin],goal:{outlet:{name:"Fixture",address:"Fixture"},partySize:10,hardCriteria:[]},objective:"Read exact party",controlHints:tabelogQueryControlHints,completion:()=>({complete:false,reason:"Exact party unselected"})});
 assert.equal(result.reasonCode,"PARTY_SIZE_NOT_SELECTABLE",JSON.stringify(result.controls));assert.equal(decisions,0);
 assert.match((await session.snapshot()).html,/is-selected[^>]*data-value="2"/);
 }finally{await executor.close();await f.close();}
});

test("mixed clock alternatives pass through the Live assembly with installed Guard and exact query binding",async()=>{
 const source="https://tabelog.com/en/tokyo/A1301/A130103/13292459/",endpoint="https://tabelog.com/en/booking/calendar/find_vacancy";
 const native={restaurant:{id:"tabelog:en/tokyo/A1301/A130103/13292459",outletName:"Window fixture",address:"1-1 Fixture Street",sourceIds:{tabelog:"en/tokyo/A1301/A130103/13292459",tabelogNativeDetailUri:source,phone:"03-1111-2222"},provenance:{}},matchReasons:[],warnings:[],executionConfidence:"HIGH" as const};
 const html=identity+`<p>Reserve Guests</p><div class="p-booking-calendar"><button class="p-booking-calendar__day is-selected" data-year="2026" data-month="11" data-day="3">3</button><fieldset><legend>Guests</legend><button aria-pressed="true" data-value="3">3</button></fieldset></div><script>fetch('${endpoint}').then(r=>r.json())</script>`;
 const slot=(time:string)=>({time,url:`/en/booking/form_course/new?rcd=13292459&member=3&visit_date=20261103&visit_time=${time.replace(':','')}`});
 const body=JSON.stringify({base_date:{year:2026,month:11,day:3},members:3,selection:[slot('19:00'),slot('24:00'),slot('25:15')]});
 const f=await fixture(html,source,{[endpoint]:body});let modelCalls=0,googleCalls=0;
 const assembly=createLiveReadAssembly({...LIVE_READ_DEBUG_INVESTIGATION_BUDGET,maxGoogleRequests:40},{browser:f.runtime,clock:{now:()=>new Date("2026-10-23T00:00:00Z")},model:{async complete(){modelCalls++;throw Error('Already-selected bound inventory must not need a decision');}},google:new GooglePlacesClient({apiKey:'fixture-only',fetchImplementation:async()=>{googleCalls++;throw Error('No Google in native replay');}})});
 try{
 const result=await assembly.availability.check({candidateIds:[native.restaurant.id],candidates:[native],date:'2026-11-03',partySize:3,timeWindow:{earliest:'19:00',latest:'19:00'},hardCriteria:[]},new AbortController().signal);
 assert.equal(result.availabilityChecks[native.restaurant.id]?.status,'AVAILABLE',JSON.stringify(result));
 assert.equal(result.offers.length,1);assert.equal(result.offers[0]!.dateTime,'2026-11-03T19:00:00+09:00');
 assert.equal((result.metadata?.browser as {readNetworkBoundary?:string}|undefined)?.readNetworkBoundary,'INSTALLED');
 assert.equal(modelCalls,0);assert.equal(googleCalls,0);
 assert.ok(f.navigations.every(u=>!u.includes('/booking/form_course/')),'no booking navigation');
 }finally{await f.close();}
});
