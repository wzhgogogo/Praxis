// Diagnostic Replay of real captured public bytes. No source HTML or results synthesized.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright-core';
import {safeUrl} from '../../../../src/eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
import {loadReplayRecording,createRecordedBrowser} from '../../../../src/eval/restaurant/agent-loop/runners/replay-read-recording.js';
import {BrowserTaskExecutor} from '../../../../src/infrastructure/browser/browser-task-executor.js';
import {PlaywrightReadNetworkGuard} from '../../../../src/infrastructure/browser/playwright-read-network-guard.js';
import {tabelogPublicReadNetworkPolicy} from '../../../../src/integrations/tabelog/tabelog-public-query.js';
import {tabelogDiscoveryPack} from '../../../../src/integrations/restaurant-search/source-packs.js';
import {locationSuggestionMatches} from '../../../../src/integrations/restaurant-search/location-suggestions.js';
import {browserTransportError} from '../../../../src/infrastructure/browser/browser-runtime-errors.js';
const root=new URL('./',import.meta.url),mode='production';
const temp=await mkdtemp(join(tmpdir(),'d4-real-replay-'));
let guard:PlaywrightReadNetworkGuard|undefined;const install=PlaywrightReadNetworkGuard.prototype.install;
PlaywrightReadNetworkGuard.prototype.install=async function(...args){guard=this;return install.apply(this,args)};
const stops:any[]=[],diagnostics:any[]=[],actions:any[]=[],requests:any[]=[],pageErrors:any[]=[];
const launch=chromium.launch;chromium.launch=async function(options){const b=await launch.call(this,options),create=b.newContext.bind(b);b.newContext=async(options)=>{const c=await create(options);c.on('request',r=>{const u=new URL(r.url());requests.push({method:r.method(),url:safeUrl(r.url()),queryKeys:[...u.searchParams.keys()]})});c.on('page',p=>p.on('pageerror',e=>pageErrors.push(browserTransportError(e))));return c};return b};
let executor:BrowserTaskExecutor|undefined,session:any;
try{
 const recording=await loadReplayRecording(resolve(new URL('recordings/D4-CAPTURE-APPROVED/source/',root).pathname),join(temp,'source.har'));
 const replay=createRecordedBrowser(recording,stop=>stops.push(stop));
 const signal=new AbortController().signal,policy={...tabelogPublicReadNetworkPolicy,genericPublicRead:true};
 const saved=JSON.parse(await readFile('src/integrations/restaurant-search/fixtures/location-suggestions/d4-menu.json','utf8'));
 const location={...saved.goal.location,name:'Akabane'};
 executor=new BrowserTaskExecutor(replay.browser,{maxAutomaticElapsedMs:500000,maxElapsedMsPerProvider:45000,maxElapsedMsPerCandidate:90000,maxOperationsPerCandidate:80,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,onDiagnostic:d=>diagnostics.push(d)});
 session=await executor.acquire(signal,'TABELOG','DISCOVERY',policy);
 const input={source:'TABELOG',stage:'DISCOVERY' as const,signal,session,allowedOrigins:['https://tabelog.com'],taskId:'D4-real-capture-replay',goal:{outlet:{name:'kushikatsu'},location,hardCriteria:[]},objective:'Observe the exact Tokyo place and public GET result',completion:()=>({complete:false as const,reason:'Source result still required'})};
 await executor.navigate({...input,url:'https://tabelog.com/en/',timeoutMs:20000});
 {
  const result=await executor.selectLocationSuggestion({...input,matchesSuggestion:t=>{const matches=locationSuggestionMatches(t,location);if(/akabane/i.test(t.label))actions.push({target:t,matches});return matches;}});
  await writeFile(new URL('d4-real-old-result.json',root),JSON.stringify({mode,sourceRecordingSha256:recording.sha256,result,stops,diagnostics,actions,realCalls:0},null,2)+'\n');
  assert.equal(result.status,'SELECTED','Real Akabane choice must lead beyond the former rejecting filter');
  assert.equal(result.snapshot.title,'Best Restaurants near Akabane Sta. | Tabelog');
  assert.ok(result.snapshot.text.includes('Akabane Sta.800m'));
  assert.equal(stops.length,0);
  console.log(JSON.stringify({status:result.status,title:result.snapshot.title,url:result.snapshot.url,stops,realCalls:0}));
 }

}finally{await executor?.close();await rm(temp,{recursive:true,force:true});}
