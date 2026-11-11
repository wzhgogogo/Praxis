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
const root=new URL('./',import.meta.url),mode=process.argv[2];assert.ok(['old-production','observed-get'].includes(mode!));
const temp=await mkdtemp(join(tmpdir(),'d4-real-replay-'));
let guard:PlaywrightReadNetworkGuard|undefined;const install=PlaywrightReadNetworkGuard.prototype.install;
PlaywrightReadNetworkGuard.prototype.install=async function(...args){guard=this;return install.apply(this,args)};
const stops:any[]=[],diagnostics:any[]=[],actions:any[]=[],requests:any[]=[],pageErrors:any[]=[];
const launch=chromium.launch;chromium.launch=async function(options){const b=await launch.call(this,options),create=b.newContext.bind(b);b.newContext=async(options)=>{const c=await create(options);c.on('request',r=>{const u=new URL(r.url());requests.push({method:r.method(),url:safeUrl(r.url()),queryKeys:[...u.searchParams.keys()]})});c.on('page',p=>p.on('pageerror',e=>pageErrors.push(browserTransportError(e))));return c};return b};
let executor:BrowserTaskExecutor|undefined,session:any;
try{
 const recording=await loadReplayRecording(resolve(new URL('recordings/D4-CAPTURE-GET/source/',root).pathname),join(temp,'source.har'));
 const replay=createRecordedBrowser(recording,stop=>stops.push(stop));
 const signal=new AbortController().signal,policy={...tabelogPublicReadNetworkPolicy,genericPublicRead:true};
 const saved=JSON.parse(await readFile('src/integrations/restaurant-search/fixtures/location-suggestions/d4-menu.json','utf8'));
 const location={...saved.goal.location,name:'Akabane'};
 executor=new BrowserTaskExecutor(replay.browser,{maxAutomaticElapsedMs:500000,maxElapsedMsPerProvider:45000,maxElapsedMsPerCandidate:90000,maxOperationsPerCandidate:80,maxModelCallsPerCandidate:1,maxModelCallsTotal:1,onDiagnostic:d=>diagnostics.push(d)});
 session=await executor.acquire(signal,'TABELOG','DISCOVERY',policy);
 const input={source:'TABELOG',stage:'DISCOVERY' as const,signal,session,allowedOrigins:['https://tabelog.com'],taskId:'D4-real-capture-replay',goal:{outlet:{name:'kushikatsu'},location,hardCriteria:[]},objective:'Observe the exact Tokyo place and public GET result',completion:()=>({complete:false as const,reason:'Source result still required'})};
 await executor.navigate({...input,url:'https://tabelog.com/en/',timeoutMs:20000});
 if(mode==='old-production'){
  const result=await executor.selectLocationSuggestion({...input,matchesSuggestion:t=>locationSuggestionMatches(t,location)&&(t.kind!=='LINK'||Boolean(t.href&&tabelogDiscoveryPack.browser!.directory!.isRegionEntrance(t.href)))});
  await writeFile(new URL('d4-real-old-result.json',root),JSON.stringify({mode,sourceRecordingSha256:recording.sha256,result,stops,diagnostics,realCalls:0},null,2)+'\n');
  assert.equal(result.status,'SELECTED','Real Akabane choice must lead beyond the former rejecting filter');
 }else{
  let page=await session.snapshot(),controls=await session.observeControls();
  const inputs=controls.filter((c:any)=>c.visible&&!c.disabled&&c.kind==='INPUT'&&/location|area|station/i.test(c.label));assert.equal(inputs.length,1);
  await session.fill(inputs[0].id,'Akabane',{timeoutMs:5000});await session.waitForSettled(page);page=await session.snapshot();controls=await session.observeControls();
  const choices=controls.filter((c:any)=>c.kind==='LINK'&&c.visible&&!c.disabled&&locationSuggestionMatches(c,location));assert.equal(choices.length,1);
  actions.push({action:'CLICK_OBSERVED_PLACE',label:choices[0].label,href:choices[0].href});await session.click(choices[0].id,{timeoutMs:5000});await session.waitForSettled(page);page=await session.snapshot();controls=await session.observeControls();
  const normalize=(x:string)=>x.normalize('NFKC').trim().replace(/\s+/gu,' ');
  const owners=[...new Set(controls.filter((c:any)=>c.formObservation?.visibleLines.some((line:string)=>normalize(line)===normalize(choices[0].label))).map((c:any)=>c.formObservation.owner))];assert.equal(owners.length,1);
  const search=controls.filter((c:any)=>c.kind==='BUTTON'&&c.label==='Search'&&c.formMethod==='GET'&&c.formObservation?.owner===owners[0]);assert.equal(search.length,1);
  actions.push({action:'CLICK_OBSERVED_SEARCH',type:search[0].type,method:search[0].formMethod});
  let error:unknown;try{await session.click(search[0].id,{timeoutMs:20000});await session.waitForSettled(page)}catch(e){error=browserTransportError(e)}
  const until=performance.now()+2000;while(performance.now()<until&&!guard!.snapshotDiagnostics().some(x=>x.pathname==='/en/rstLst/')&&!stops.length&&!pageErrors.length)await new Promise(r=>setTimeout(r,20));
  await writeFile(new URL('d4-real-get-observation.json',root),JSON.stringify({actions,requests,pageErrors,error,stops,guard:guard!.snapshotDiagnostics()},null,2)+'\n');
  const rejected=guard!.snapshotDiagnostics().find(x=>x.pathname==='/en/rstLst/'&&x.code==='BLOCKED_ENDPOINT');
  assert.ok(rejected?.queryKeys.includes('genre_name'),'Actual recorded source JS sends a public genre_name key rejected by unchanged Guard');
  assert.equal(guard!.snapshotRequests().some(x=>x.pathname==='/en/rstLst/'&&x.outcome==='ADMITTED'),false);
  assert.equal(stops.length,0,'Not a missing-HAR failure: Guard rejects before a network/HAR lookup');
  const out={mode,sourceRecordingSha256:recording.sha256,actions,rejected,error,stops,realCalls:0,status:'REAL_REPLAY_REPRODUCES_CURRENT_GUARD_BLOCK'};
  await writeFile(new URL('d4-real-get-block.json',root),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
 }
}finally{await executor?.close();await rm(temp,{recursive:true,force:true});}
