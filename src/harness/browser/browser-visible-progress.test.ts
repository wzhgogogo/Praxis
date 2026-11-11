import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {test} from "node:test";
import {BrowserVisibleProgress, visibleProgressKey, visibleActionKey, filledAuthoritativeField} from "../../infrastructure/browser/browser-visible-progress.js";

test("recorded DIRECTORY components stop on second equivalent visible-state/action stall, despite changing refs/prose", async t => {
  for(const name of ["D01","p3b-holdout-01-r1-retry1","p3b-holdout-02-r2"]){
    const data=JSON.parse(await readFile(new URL(`./fixtures/discovery-visible-progress/${name}.json`,import.meta.url),"utf8"));
    const tracker=new BrowserVisibleProgress();let used=0;
    for(let i=0;i<data.rows.length-1;i++){
      const a=data.rows[i],b=data.rows[i+1];used++;
      if(a.unavailable||b.unavailable)continue;
      const state=visibleProgressKey(a.url,a.controls),after=visibleProgressKey(b.url,b.controls);
      const key=visibleActionKey(a.action,a.target??undefined,a.field);
      if(tracker.repeated(state,key)){if(tracker.noProgress())break;}
      else {tracker.executed(state,key);if(state===after && tracker.noProgress())break;}
    }
    t.diagnostic(JSON.stringify({run:name,oldCalls:data.rows.length,used,avoided:tracker.count>=2?data.rows.length-used:0,noProgress:tracker.count}));
    if(name.includes("01-r1")){assert.ok(data.rows.some((r:any)=>r.unavailable),"Missing original DOM is not fabricated");}
    else {assert.equal(tracker.count,2);assert.ok(used<data.rows.length);}
  }
});

test("changing controls through exact suggestion, outlet and date/party has no stall; hidden/opaque refs/prose aren't progress",()=>{
 const tracker=new BrowserVisibleProgress();
 const states=[['https://source.example/search',[{kind:'INPUT',label:'Destination',value:''}]],['https://source.example/search',[{kind:'INPUT',label:'Destination',value:'Outlet'},{kind:'BUTTON',label:'Outlet'}]],['https://source.example/outlet',[{kind:'BUTTON',label:'Date'}]],['https://source.example/outlet',[{kind:'BUTTON',label:'2026-11-11',selected:true}]],['https://source.example/outlet',[{kind:'BUTTON',label:'Guests 2',selected:true}]]] as const;
 for(let i=0;i<states.length-1;i++)assert.notEqual(visibleProgressKey(states[i]![0],states[i]![1]),visibleProgressKey(states[i+1]![0],states[i+1]![1]));
 assert.equal(tracker.count,0);
 assert.equal(visibleProgressKey('u',[{kind:'INPUT',label:'Location',value:'Area'}]),visibleProgressKey('u',[{kind:'INPUT',label:'Location',value:'Area'},{kind:'INPUT',label:'Hidden changing value',value:'42',visible:false}]));
 assert.equal(filledAuthoritativeField('Area',{LOCATION:'Area',RETRIEVAL:'Cuisine'}),'LOCATION');
 assert.equal(filledAuthoritativeField('',{LOCATION:'Area'}),undefined);
 assert.equal(filledAuthoritativeField('cleared by page',{LOCATION:'Area'}),undefined);
});

import {localFixture,guardedPages,url} from './browser-read-test-fixtures.js';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
test('executor closes a source after two no-effect actions, exposes factual stateChanged history and preserves filled inputs',async()=>{
 for(const mode of ['noop','fill'] as const){
  const html=`<title>Fixture</title>${mode==='noop'?'<button id="a">Inspect</button><button id="b">Expand</button>':'<form method="get"><input aria-label="Location, cuisine" type="text"><button type="submit">Search</button></form>'}`;
  const fixture=await guardedPages({[url]:html},{documentOrigins:['https://www.tablecheck.com'],genericPublicRead:true,staticResources:[],dynamicReads:[]});
  const runtime=fixture.runtime;
  let calls=0;let fills=0;const diagnostics:any[]=[];
  const executor=new BrowserTaskExecutor(runtime,{maxAutomaticElapsedMs:300_000,maxModelCallsTotal:10,maxModelCallsPerCandidate:8,maxOperationsPerCandidate:80,maxElapsedMsPerCandidate:20_000,onDiagnostic:d=>diagnostics.push(d),modelDecision:{async decide(input){
   calls++;
   if(mode==='noop'){
    if(calls===2)assert.equal(input.history.at(-1)?.stateChanged,false);
    return {type:'CLICK',targetRef:input.observation.targets.find(t=>t.label===(calls===1?'Inspect':'Expand'))!.ref,reason:'Observe action'};
   }
   const target=input.observation.targets.find(t=>t.kind==='INPUT')!;
   if(calls===1){assert.ok(target.availableActions?.includes('FILL_AUTHORITATIVE:LOCATION'));fills++;return {type:'FILL_AUTHORITATIVE',field:'LOCATION',targetRef:target.ref,reason:'Set location'};}
   assert.equal(target.value,'Fixture Area');assert.ok(!target.availableActions?.some(a=>a.startsWith('FILL_AUTHORITATIVE')));
   // A model can still propose an unavailable action: executor must enforce it.
   return calls===2?{type:'FILL_AUTHORITATIVE',field:'RETRIEVAL',targetRef:target.ref,reason:'Attempt overwrite'}:{type:'REQUEST_HUMAN_HELP',reason:'No distinct field observed'};
  }}});
  const signal=new AbortController().signal;const session=await executor.acquire(signal,'FIXTURE','DISCOVERY');
  try{await executor.navigate({observed:true,session,signal,source:'FIXTURE',stage:'DISCOVERY',allowedOrigins:['https://www.tablecheck.com'],url});
   const read=await executor.runSkill({taskId:'progress',source:'FIXTURE',stage:'DISCOVERY',signal,session,allowedOrigins:['https://www.tablecheck.com'],goal:{outlet:{name:'Fixture'},location:{name:'Fixture Area',latitude:35,longitude:139,radiusMeters:1000},retrievalExpression:'Fixture Cuisine',retrievalSource:'CUISINE',hardCriteria:[]},objective:'Use observed form',completion:()=>({complete:false,reason:'No result'})});
   if(mode==='noop'){assert.equal(read.reasonCode,'NO_PROGRESS');assert.equal(calls,2);assert.ok(diagnostics.some(d=>d.detail==='NO_PROGRESS'));}
   else {assert.equal(read.status,'NO_SAFE_ACTION');assert.equal(fills,1);assert.ok(diagnostics.some(d=>d.detail?.includes('AUTHORITATIVE_INPUT_PRESENT')));}
  }finally{await executor.close();await fixture.close();}
 }
});

test('real successful D8 exact suggestion and direct availability observations do not hit two stalls within either scope',async()=>{
 const data=JSON.parse(await readFile(new URL('./fixtures/discovery-visible-progress/D8.json',import.meta.url),'utf8'));
 for(const stage of ['DISCOVERY','AVAILABILITY']){
  const rows=data.rows.filter((r:any)=>r.stage===stage),tracker=new BrowserVisibleProgress();
  assert.ok(rows.length>=1);
  for(let i=0;i<rows.length-1;i++){
   const a=rows[i],b=rows[i+1],state=visibleProgressKey(a.url,a.controls),key=visibleActionKey(a.action,a.target??undefined,a.field);
   if(tracker.repeated(state,key)||state===visibleProgressKey(b.url,b.controls))assert.equal(tracker.noProgress(),false,`D8 ${stage} decision${a.sequence}`);
   tracker.executed(state,key);
  }
 }
});
