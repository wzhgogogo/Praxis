import assert from 'node:assert/strict';import {test} from 'node:test';import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {localFixture} from './browser-read-test-fixtures.js';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import type {BrowserSession,BrowserSnapshot,BrowserPageControl} from '../../infrastructure/browser/browser-runtime.js';
import {tabelogQueryControlHints} from '../../integrations/tabelog/tabelog-query-controls.js';
import {tabelogAvailabilityCompletion} from '../../integrations/tabelog/tabelog-browser-availability.js';
import {parseTabelogAvailabilitySlots} from '../../integrations/tabelog/tabelog-page-parser.js';
const base=new URL('./fixtures/d02v-paging-recorded/',import.meta.url),data=JSON.parse(await readFile(new URL('manifest.json',base),'utf8'));
// Component replay: original DOM/JSON/action choices and elapsed operation costs.
// Serialized DOM has no listeners: each recorded action advances to its actual
// next snapshot. Chromium independently extracts controls; no website network.
for(const mode of ['ORIGINAL','ADVANCE']as const)test(`D02-V ${mode} Manten DOM/HAR/actions finish exact 8-person slot inside unchanged45s provider window`,{timeout:90000},async t=>{
 const origin='https://tabelog.com',url=origin+'/en/tokyo/A1319/A131902/13287727/',indices=[35,36,37,38,39,40];
 const rendered:BrowserSnapshot[]=[],controls:BrowserPageControl[][]=[];
 const pages:Record<string,string>={};
 for(const n of indices){const name='snapshot-'+String(n).padStart(4,'0')+'.html',html=await readFile(new URL(name,base),'utf8');assert.equal(createHash('sha256').update(html).digest('hex'),data.provenance.files[name]);pages['https://offline.test/frame'+n]='<meta http-equiv="Content-Security-Policy" content="script-src \'none\'; connect-src \'none\'; img-src \'none\'; style-src \'unsafe-inline\'">'+html;}
 const raw=await localFixture(pages).openSession({signal:new AbortController().signal});
 try{for(const [index,n]of indices.entries()){
  pages[url]=pages['https://offline.test/frame'+n]!;await raw.navigate(url,{waitUntil:'domcontentloaded'});const snapshot=await raw.snapshot();snapshot.url=url;snapshot.settlement='SETTLED';
  const responseIndex=index>=5?48:index>=2?47:undefined;snapshot.responses=responseIndex===undefined?[]:data.responses.filter((r:any)=>r.harEntryIndex<=responseIndex&&r.url.includes('rst_id=13287727')).map((r:any)=>({url:r.url,status:r.status,sequence:r.harEntryIndex,observedAt:'2026-11-11T00:00:00Z',body:r.body}));
  rendered.push(snapshot);const observed=await raw.observeControls!(tabelogQueryControlHints(snapshot));
  // Recorder strips empty URL fragments; restore only the exact href retained
  // by the original decision observation, never synthesize a destination.
  if(index<5){const row=data.decisions.find((r:any)=>r.sequence===[24,25,26,27,28][index]);const input=JSON.parse(row.messages.find((m:any)=>m.role==='user').content),action=JSON.parse(row.outputText);const target=input.observation.targets.find((v:any)=>v.ref===action.targetRef);if(target.href)for(const control of observed)if(control.kind===target.kind&&control.label===target.label)control.href=target.href;}
  controls.push(observed);
 }}finally{await raw.close();}
 const op=data.operations;const actionStarts=[391,407,426,442,458],postEnds=[400,416,435,451,0];
 const point=(sequence:number)=>op.find((e:any)=>e.sequence===sequence).lifecycle.providerElapsedMs;
 const pairs=actionStarts.map((start:number,i:number)=>{
  const started=op.findIndex((e:any)=>e.sequence===start),chunk=op.slice(started,i===4?op.findIndex((e:any)=>e.sequence===466)+1:op.findIndex((e:any)=>e.sequence===postEnds[i])+1);
  const duration=(name:string)=>{const a=chunk.find((e:any)=>e.event==='OPERATION_STARTED'&&e.operation===name),b=chunk.find((e:any)=>e.event==='OPERATION_FINISHED'&&e.operation===name);return a&&b?b.lifecycle.providerElapsedMs-a.lifecycle.providerElapsedMs:0;};
  return {action:duration(i===1||i===4?'CLICK_AUTHORITATIVE':'CLICK'),settle:duration('WAIT_FOR_SETTLED'),snapshot:duration('SNAPSHOT'),observe:i===4?point(451)-point(450):duration('OBSERVE_CONTROLS'),model:point(start)-(i===0?23603:point(postEnds[i-1]!))-(i===2?point(420)-point(419):0)};
 });
 t.mock.timers.enable({apis:['Date'],now:0});let elapsed=0,index=0,model=0,scans=0,snapshots=0,lastObserved=-1;const records:any[]=[];
 const spend=(ms:number)=>{elapsed+=ms;t.mock.timers.setTime(elapsed);};
 const session={metadata:{...raw.metadata,readNetworkBoundary:"INSTALLED"},async snapshot(){snapshots++;if(index>0)spend(pairs[index-1]!.snapshot);return structuredClone(rendered[index]!);},async observeControls(){scans++;if(index>0)spend(lastObserved===index?point(420)-point(419):pairs[index-1]!.observe);lastObserved=index;return structuredClone(controls[index]!);},async click(){spend(pairs[index]!.action);index++;},async waitForSettled(){spend(pairs[index-1]!.settle);return true;},async close(){}}as unknown as BrowserSession;
 const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:90000,maxElapsedMsPerCandidate:90000,maxElapsedMsPerProvider:45000,maxModelCallsPerCandidate:20,maxModelCallsTotal:20,maxOperationsPerCandidate:100,onDiagnostic:e=>records.push({event:e.event,detail:e.detail?.slice(0,450)}),modelDecision:{async decide(input){
  const sequences=mode==='ADVANCE'?[24,25,26,28]:[24,25,26,27,28];const original=data.decisions.find((r:any)=>r.sequence===sequences[model]);assert.ok(original,'no extra model decision permitted in recorded component');const payload=JSON.parse(original.messages.find((m:any)=>m.role==='user').content);const output=JSON.parse(original.outputText);const old=payload.observation.targets.find((a:any)=>a.ref===output.targetRef);assert.ok(old);const target=input.observation.targets.find(a=>a.kind===old.kind&&a.label===old.label&&a.controlGroupLabel===old.controlGroupLabel&&a.value===old.value);assert.ok(target,JSON.stringify({old,available:input.observation.targets.map(a=>({label:a.label,group:a.controlGroupLabel,value:a.value}))}));if(model===0)assert.equal(target.href,old.href,JSON.stringify({target,old,snapshot:input.observation.url}));const originalIndex=[24,25,26,27,28].indexOf(original.sequence);spend(pairs[originalIndex]!.model);model++;if(mode==='ADVANCE'&&original.sequence===26){assert.ok(target.controlGroupRef);return {type:'ADVANCE_TO_AUTHORITATIVE',targetRef:target.ref,field:'PARTY_SIZE',valueGroupRef:target.controlGroupRef,reason:'One recorded-model decision authorizes bounded observed advancement'};}return output.action==='CLICK_AUTHORITATIVE'?{type:'CLICK_AUTHORITATIVE',targetRef:target.ref,field:output.authoritativeField,reason:output.reason}:{type:'CLICK',targetRef:target.ref,reason:output.reason};
 }}});
 const signal=new AbortController().signal;executor.beginCandidate('recorded-Manten');executor.beginProvider('recorded-Manten','TABELOG','AVAILABILITY');await executor.acquire(signal,'TABELOG','AVAILABILITY');spend(23603);
 try{const result=await executor.runSkill({taskId:'recorded-Manten',source:'TABELOG',stage:'AVAILABILITY',signal,session,allowedOrigins:[origin],initialObservation:{snapshot:structuredClone(rendered[0]!),controls:structuredClone(controls[0]!)},goal:{outlet:{name:'Recorded Manten'},...data.request,hardCriteria:[]},objective:'Replay original date/guest actions; retain original completion.',controlHints:tabelogQueryControlHints,completion:s=>tabelogAvailabilityCompletion(s,data.request)});
  assert.equal(result.status,'COMPLETED',JSON.stringify({elapsed,index,scans,snapshots,records:records.slice(-6)}));assert.equal(model,mode==='ADVANCE'?4:5);assert.ok(elapsed<45000);assert.ok(parseTabelogAvailabilitySlots(result.snapshot,data.request).availableSlots.includes('20:30'));assert.equal(scans,5,'each action observes once; confirmed-date controls are not rescanned');t.diagnostic(JSON.stringify({mode:'RECORDED_COMPONENT',providerWindowMs:45000,elapsedMs:elapsed,models:model,avoidedModelLatencyMs:mode==='ADVANCE'?pairs[3]!.model:0,scans,snapshots,originalFinalCanceledScanAtMs:44493,originalProviderTimeoutMs:45000,timingNote:data.provenance.timingNote}));
 }finally{await executor.closeAll();}
});

test('D02-V actual Sumika partial observation confirms date but cannot invent eight guests',{timeout:30000},async()=>{
 const url='https://tabelog.com/en/tokyo/A1319/A131902/13309182/',html=await readFile(new URL('snapshot-0016.html',base),'utf8');
 assert.equal(createHash('sha256').update(html).digest('hex'),data.provenance.files['snapshot-0016.html']);
 const session=await localFixture({[url]:'<meta http-equiv="Content-Security-Policy" content="script-src \'none\'; connect-src \'none\'; img-src \'none\'; style-src \'unsafe-inline\'">'+html}).openSession({signal:new AbortController().signal});
 try{await session.navigate(url,{waitUntil:'domcontentloaded'});const snapshot=await session.snapshot();snapshot.responses=data.responses.filter((r:any)=>r.url.includes('rst_id=13309182')).map((r:any)=>({url:r.url,status:r.status,sequence:r.harEntryIndex,observedAt:'2026-11-11T00:00:00Z',body:r.body}));const completion=tabelogAvailabilityCompletion(snapshot,data.request);assert.equal(completion.complete,false);assert.ok(completion.confirmedFields?.includes('DATE'));assert.ok(!completion.confirmedFields?.includes('PARTY_SIZE'));assert.deepEqual(parseTabelogAvailabilitySlots(snapshot,data.request).availableSlots,[]);}finally{await session.close();}
});
