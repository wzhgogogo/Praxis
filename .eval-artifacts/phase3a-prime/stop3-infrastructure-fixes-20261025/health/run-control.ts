import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import type {BrowserRuntime} from '../../../../src/infrastructure/browser/browser-runtime.js';
import {runLiveSourceHealth,LIVE_SOURCE_HEALTH_TIMEOUT_MS} from '../../../../src/eval/restaurant/agent-loop/live-source-health.js';

const root=resolve(process.argv[2]);
const html=await readFile(new URL('../../../../src/eval/restaurant/agent-loop/fixtures/health-deadline-listing.html',import.meta.url),'utf8');
let network=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{network++;throw Error('OFFLINE_CONTROL_NETWORK_FORBIDDEN');};
const outputs=[];
try{
 for(const slow of [false,true]){
  let delayed=0;
  const runtime={openSession:async(input:any)=>{let url='',start=performance.now();return {
   metadata:{readNetworkBoundary:'INSTALLED'},prepareNavigation:async()=>{},
   navigate:async(target:string)=>{url=target;start=performance.now();input.recordResponse?.({url,status:200,resourceType:'document'});},
   snapshot:async()=>{if(slow&&url.includes('tabelog')&&performance.now()-start>=800){delayed++;await delay(220);}
    const content=url.includes('tabelog')?html:'<a href="https://www.tablecheck.com/en/fixture-venue">Fixture venue</a>';
    return {url,title:'Saved listing',html:content,text:content.replace(/<[^>]*>/g,' ')};},close:async()=>{}};
  }} as unknown as BrowserRuntime;
  const result=await runLiveSourceHealth({environment:{},artifactDirectory:resolve(root,slow?'slow-last-snapshot':'fast-last-snapshot')},{runtime,timeoutMs:1000,sleep:async()=>{}});
  const artifact=JSON.parse(await readFile(result.artifactPath,'utf8'));
  assert.equal(artifact.classification,'READY');assert.equal(artifact.attempts.length,1);
  if(slow)assert.ok(delayed>0);
  outputs.push({mode:slow?'LAST_SNAPSHOT_220MS':'FAST_SNAPSHOT',artifactPath:slow?'slow-last-snapshot/source-health.json':'fast-last-snapshot/source-health.json',delayed,observations:artifact.attempts[0].observations});
 }
 assert.equal(network,0);assert.equal(LIVE_SOURCE_HEALTH_TIMEOUT_MS,10000);
}finally{globalThis.fetch=originalFetch;}
const result={status:'PASS',mode:'LOCAL_CONSTRUCTED_TIMING_CONTROL_NOT_LIVE',timezone:'CET UTC+1',fixtureTimeoutMs:1000,productionTimeoutMs:LIVE_SOURCE_HEALTH_TIMEOUT_MS,realCalls:{model:0,google:0,website:0,live:0,environmentRerun:0},network,outputs};
await writeFile(resolve(root,'control.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:result.status,network,realCalls:result.realCalls}));
