import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {BrowserTaskExecutor} from '../../infrastructure/browser/browser-task-executor.js';
import type {BrowserRuntime,BrowserPageControl} from '../../infrastructure/browser/browser-runtime.js';
import {mergeDiscoveryCandidates} from './native-restaurant-search.js';
import {restaurantCandidateReadPriority} from '../../domains/restaurant/candidate-read-priority.js';
import type {RestaurantTaskState} from '../../domains/restaurant/contracts.js';
const fixture=JSON.parse(await readFile(new URL('./fixtures/d01-discovery-scope.json',import.meta.url),'utf8'));
for(const mode of ['CITED','NO_REFERENCE','STALE','HIDDEN'] as const)test(`D01 #8 recorded broad scope, local session component: ${mode}`,async()=>{
 const observed=fixture.observation;const western=observed.targets.find((t:any)=>t.label==='Western');assert.ok(western);assert.equal(fixture.originalAction.action,'COMPLETE');
 const controls:BrowserPageControl[]=observed.targets.map((t:any,i:number)=>({id:String(i),stableKey:String(i),kind:t.kind,role:t.role,label:t.label,href:t.href,visible:mode!=='HIDDEN'||t.label!=='Western',disabled:false}));
 const snapshot={url:observed.url,title:observed.title,text:observed.visibleText,html:'',settlement:'SETTLED' as const};
 const session={metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM' as const,engine:'CHROMIUM' as const,startedAt:'2026-11-10T00:00:00Z'},async snapshot(){return snapshot;},async observeControls(){return controls;},async navigate(){},async click(){},async fill(){},async select(){return[];},async waitFor(){},async waitForSettled(){return true;},async screenshot(){return new Uint8Array();},async close(){}};
 const runtime:BrowserRuntime={openSession:async()=>session};
 const executor=new BrowserTaskExecutor(runtime,{maxAutomaticElapsedMs:30000,maxOperationsPerCandidate:24,maxModelCallsPerCandidate:4,maxModelCallsTotal:4,modelDecision:{async decide(v){const ref=v.observation.targets.find(t=>t.label==='Western')?.ref;return {type:'COMPLETE',reason:'Local replacement cites actual recorded scope, never cuisine proof',...(mode==='NO_REFERENCE'?{}:{scopeRef:mode==='STALE'?'observation:old:target:0':(ref??'missing')})};}}});
 const result=await executor.runSkill({taskId:'recorded-scope',source:'DIRECTORY',stage:'DISCOVERY',session,signal:new AbortController().signal,allowedOrigins:[new URL(snapshot.url).origin],goal:{outlet:{name:'Search'},hardCriteria:['Spanish']},objective:'Read current list scope',requireModelConfirmation:true,completion:()=>({complete:true,resultBusy:false,resultKey:snapshot.url,reason:'Recorded list visible'})});
 assert.equal(result.status,'COMPLETED');assert.equal(result.scopeQuote?.text,mode==='CITED'?'Western':undefined);await executor.close();
});

test('D01 recorded native and Google batches coexist; conservative dedup and cited-category ranking',async()=>{
 const recorded=JSON.parse(await readFile(new URL('./fixtures/d01-discovery-pools.json',import.meta.url),'utf8'));
 const nativeEvent=recorded.native,googleEvent=recorded.google;
 const merged=mergeDiscoveryCandidates(nativeEvent.candidates,googleEvent.candidates);assert.equal(merged.candidates.length,9);assert.equal(merged.aliases.size,0,'Unproved cross-source identities stay distinct');
 const state={schemaVersion:"25",phase:"SEARCHING",availability:{},availabilityChecks:{},factChecks:{},searchRevision:0,intentDraft:recorded.intentDraft,candidates:merged.candidates,readEvidence:[...nativeEvent.evidence,...googleEvent.evidence]} as RestaurantTaskState;
 const order=[...merged.candidates].sort((a,b)=>restaurantCandidateReadPriority(state,a.restaurant.id)-restaurantCandidateReadPriority(state,b.restaurant.id));
 assert.ok(order.some(c=>c.restaurant.sourceIds.googlePlaces));assert.ok(order.some(c=>c.restaurant.sourceIds.tabelog));
 const supported=order.find(c=>restaurantCandidateReadPriority(state,c.restaurant.id)<=1);assert.ok(supported,'Recorded Google cuisine type leads native Western-only lists');assert.ok(supported.restaurant.sourceIds.googlePlaces);
 const one=structuredClone(merged.candidates[0]!);one.restaurant.sourceIds.phone='0312345678';const same=structuredClone(one);same.restaurant.id='other-source';
 assert.equal(mergeDiscoveryCandidates([one],[same]).candidates.length,1);same.restaurant.address+=' different floor';assert.equal(mergeDiscoveryCandidates([one],[same]).candidates.length,2);
});
