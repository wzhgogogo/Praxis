import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {localFixture} from './browser-read-test-fixtures.js';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import type {BrowserSession,BrowserSnapshot} from '../../infrastructure/browser/browser-runtime.js';
import {tabelogQueryControlHints} from '../../integrations/tabelog/tabelog-query-controls.js';
import {tabelogAvailabilityCompletion} from '../../integrations/tabelog/tabelog-browser-availability.js';
import {parseTabelogAvailabilitySlots} from '../../integrations/tabelog/tabelog-page-parser.js';
const folder=new URL('../../integrations/tabelog/fixtures/terminal-observe-recorded/',import.meta.url);
const meta=JSON.parse(await readFile(new URL('manifest.json',folder),'utf8'));
const original=async(name:string)=>{const bytes=await readFile(new URL(name,folder));assert.equal(createHash('sha256').update(bytes).digest('hex'),meta.files[name]);return bytes.toString('utf8');};
// Actual 9856dc67 DOM32->33, HAR44->45 and decision33; no website network.
// LOCAL_CONSTRUCTION: sanitized DOM has no listeners, so a real native click
// swaps to the captured post-click DOM/response. The canceled final control
// scan is represented by a rejecting observer, not invented live timing.
test('recorded terminal vacancy completes before a canceled full-page control scan',{timeout:60000},async t=>{
 const before=await original('snapshot-0032.html'),after=await original('snapshot-0033.html');
 const replies=await Promise.all(meta.responses.map(async(r:any)=>({sequence:r.harEntryIndex,url:r.url,status:r.status,observedAt:r.observedAt,body:JSON.parse(await original(r.file))})));
 const csp='<meta http-equiv="Content-Security-Policy" content="script-src \'none\'; connect-src \'none\'; img-src \'none\'; style-src \'unsafe-inline\'">';
 const pages:Record<string,string>={[meta.pageURL]:csp+before};const raw=await localFixture(pages).openSession({signal:new AbortController().signal});
 let clicked=false,models=0,postScans=0;const records:any[]=[];
 try{
  await raw.navigate(meta.pageURL,{waitUntil:'domcontentloaded'});
  const capture=async():Promise<BrowserSnapshot>=>({...await raw.snapshot(),settlement:'SETTLED',responses:[replies[clicked?1:0]!]});
  const initial=await capture(),controls=await raw.observeControls!(tabelogQueryControlHints(initial));
  assert.equal(tabelogAvailabilityCompletion(initial,meta.request).complete,false);
  const session={metadata:{...raw.metadata,readNetworkBoundary:'INSTALLED'},snapshot:capture,
   async observeControls(){postScans++;throw Error('LOCAL_CONSTRUCTION: recorded terminal control scan canceled at provider deadline');},
   async click(id:string){await raw.click(id);clicked=true;pages[meta.pageURL]=csp+after;await raw.navigate(meta.pageURL,{waitUntil:'domcontentloaded'});},
   async waitForSettled(){return true;},close:()=>raw.close()}as unknown as BrowserSession;
  const executor=new BrowserTaskExecutor({openSession:async()=>session},{maxAutomaticElapsedMs:45000,maxElapsedMsPerProvider:45000,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,maxOperationsPerCandidate:12,onDiagnostic:e=>records.push(e),modelDecision:{async decide(input){models++;const target=input.observation.targets.find(v=>v.availableActions?.includes('CLICK_AUTHORITATIVE:PARTY_SIZE'));assert.ok(target,'exact recorded requested count is actionable');return{type:'CLICK_AUTHORITATIVE',targetRef:target.ref,field:'PARTY_SIZE',reason:'Original recorded authoritative count choice'};}}});
  try{
   const result=await executor.runSkill({taskId:'recorded-terminal',source:'TABELOG',stage:'AVAILABILITY',session,signal:new AbortController().signal,allowedOrigins:[new URL(meta.pageURL).origin],goal:{outlet:{name:'Recorded outlet'},...meta.request,hardCriteria:[]},objective:'Apply the requested query through observed controls',controlHints:tabelogQueryControlHints,initialObservation:{snapshot:initial,controls},completionUsesControls:false,completion:s=>tabelogAvailabilityCompletion(s,meta.request)});
   assert.equal(result.status,'COMPLETED');assert.equal(postScans,0);assert.equal(models,1);assert.deepEqual(result.controls,[]);assert.ok(parseTabelogAvailabilitySlots(result.snapshot,meta.request).availableSlots.includes('20:30'));assert.ok(!records.some(e=>e.detail==='PARTY_SIZE_NOT_CONFIRMED'));
   t.diagnostic(JSON.stringify({mode:'RECORDED_COMPONENT',originCommit:meta.recordingCommit,postControlScans:postScans,originalSnapshotAtMs:meta.timing.postSnapshotMs,originalCanceledScanMs:meta.timing.providerTimeoutMs-meta.timing.postSnapshotMs,modelDecisions:models,realModelCalls:0,live:false,note:meta.timing.note}));
  }finally{await executor.closeAll();}
 }finally{await raw.close();}
});
