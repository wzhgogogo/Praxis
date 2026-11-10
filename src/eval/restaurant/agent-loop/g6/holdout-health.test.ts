import assert from 'node:assert/strict';
import {test} from 'node:test';
import type {BrowserRuntime,BrowserSession} from '../../../../infrastructure/browser/browser-runtime.js';
import {checkHoldoutNetwork} from './holdout-health.js';

// LOCAL_CONSTRUCTION. No source/model I/O; real timer boundaries are advanced
// with node:test's clock, not replaced by a configurable production deadline.
for(const mode of ['SUCCESS','SCRIPT_15S','SCRIPT_21S','DOCUMENT_401','SCRIPT_TIMEOUT','SESSION_OPEN','NAVIGATION_ERROR'] as const){
 test(`health phase diagnostics: ${mode}`,async t=>{
  t.mock.timers.enable({apis:['setTimeout']});let now=0,closed=0,charged=0;
  const browser:BrowserRuntime={async openSession(input){
   if(mode==='SESSION_OPEN')return new Promise<BrowserSession>(()=>{});
   return {metadata:{runtimeProvider:'LOCAL_PLAYWRIGHT_CHROMIUM',engine:'CHROMIUM',startedAt:'2030-01-01T00:00:00Z'},
    async prepareNavigation(){},async navigate(url){
     if(mode==='NAVIGATION_ERROR')throw Object.assign(new Error('Navigation failed at https://example.invalid/?token=secret'),{code:'ENOTFOUND'});
     input.onResponseHeaders?.({url,resourceType:'document',status:mode==='DOCUMENT_401'?401:200,mainDocument:true});
     if(mode==='SUCCESS'||mode==='SCRIPT_15S'||mode==='SCRIPT_21S')setTimeout(()=>{void input.recordResponse?.({url:url.includes('tablecheck')?'https://www.tablecheck.com/portal/assets/index-fiction.js':'https://tblg.k-img.com/javascripts/assets/pepper/restaurant-pc/commons.js',resourceType:'script',method:'GET',status:200,contentType:'text/javascript',body:Buffer.from('/* fictional */')});},mode==='SCRIPT_15S'?15000:mode==='SCRIPT_21S'?21000:5000);
    },async snapshot(){throw Error('Not used');},async click(){},async fill(){},async select(){return [];},async waitFor(){},async screenshot(){return new Uint8Array();},async close(){closed++;}} as BrowserSession;
  }};
  let settled=false;const pending=checkHoldoutNetwork({browser,tabelogDetailUrl:'https://tabelog.com/en/tokyo/A0000/A000000/10000001/',beforeGET:async()=>{charged++;},now:()=>now}).then(r=>{settled=true;return r;});
  const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};await flush();
  if(mode==='SUCCESS'||mode==='SCRIPT_15S'){for(let i=0;i<4;i++){const step=mode==='SCRIPT_15S'?15000:5000;now+=step;t.mock.timers.tick(step);await flush();}}
  else if(mode==='SCRIPT_21S'){now=20_000;t.mock.timers.tick(20_000);await flush();}
  else if(mode==='SCRIPT_TIMEOUT'||mode==='SESSION_OPEN'){now=20_000;t.mock.timers.tick(20_000);await flush();}
  else if(mode==='DOCUMENT_401'&&!settled){now=20_000;t.mock.timers.tick(20_000);await flush();}
  const result=await pending,observation:any=result.observations.at(-1);
  assert.equal(result.passed,mode==='SUCCESS'||mode==='SCRIPT_15S');assert.equal(charged,mode==='SUCCESS'||mode==='SCRIPT_15S'?4:1);
  assert.equal(closed,mode==='SESSION_OPEN'?0:charged);
  assert.equal(observation.phase,mode==='SESSION_OPEN'?'SESSION_OPEN':mode==='NAVIGATION_ERROR'?'NAVIGATE':mode==='DOCUMENT_401'?'NAVIGATE':'SCRIPT_WAIT');
  assert.equal(observation.elapsedMs,mode==='SUCCESS'?5000:mode==='SCRIPT_15S'?15000:mode==='SCRIPT_21S'||mode==='SCRIPT_TIMEOUT'||mode==='SESSION_OPEN'?20_000:0);
  assert.equal(observation.phaseElapsedMs,observation.elapsedMs);
  if(mode==='DOCUMENT_401')assert.equal(observation.documentStatus,401);
  assert.equal(observation.windowMs,20_000);
  if(mode==='SUCCESS'||mode==='SCRIPT_15S'){assert.equal(observation.documentStatus,200);assert.equal(observation.scriptStatus,200);}
  if(mode==='SCRIPT_TIMEOUT')assert.equal(observation.documentStatus,200);
  if(mode==='NAVIGATION_ERROR'){assert.equal(observation.navigationError.code,'ENOTFOUND');assert.ok(!JSON.stringify(observation).includes('secret'));}
 });
}

test('a session opened after the health cutoff closes without navigating',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let now=0,closed=0,navigations=0,deliver!:(s:BrowserSession)=>void;
 const browser:BrowserRuntime={openSession:()=>new Promise(r=>{deliver=r;})};
 const promise=checkHoldoutNetwork({browser,tabelogDetailUrl:'https://tabelog.com/en/tokyo/A0000/A000000/10000001/',beforeGET:async()=>{},now:()=>now});
 for(let i=0;i<10;i++)await Promise.resolve();now=20_000;t.mock.timers.tick(20_000);assert.equal((await promise).passed,false);
 deliver({async navigate(){navigations++;},async close(){closed++;}} as unknown as BrowserSession);
 for(let i=0;i<10;i++)await Promise.resolve();assert.equal(navigations,0);assert.equal(closed,1);
});
