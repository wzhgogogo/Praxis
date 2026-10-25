// Evaluation-only observers. Does not alter Prompt, Task State, Guard or source selection.
import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
import {resolve} from 'node:path';
import {LocalPlaywrightChromium} from '../../../src/infrastructure/browser/local-playwright-chromium.js';
import {runHybridLiveRead} from '../../../src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.js';
if(process.argv.includes('--check')){console.log(JSON.stringify({status:'CHILD_IMPORTS_PASS',requests:0,models:0}));process.exit(0);}
const directory=process.env.F5_SLOT_DIRECTORY;
if(!directory)throw Error('F5_SLOT_DIRECTORY_REQUIRED');
const file=resolve(directory,'transport-events.jsonl');let models=0,google=0,healthRetries=0,browserResponses=0;
const write=(row:unknown)=>fs.appendFileSync(file,JSON.stringify({at:new Date().toISOString(),...row as object})+'\n');
const original=globalThis.fetch;
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.toString():input.url);
 const method=init?.method??(input instanceof Request?input.method:'GET');
 const model=method==='POST'&&url.pathname.endsWith('/chat/completions');
 const places=/(^|\.)(googleapis\.com)$/.test(url.hostname);
 if(model&&models>=50)throw Object.assign(Error('Model transport ceiling'),{code:'MODEL_CALL_BUDGET_EXHAUSTED'});
 if(places&&google>=40)throw Object.assign(Error('Google transport ceiling'),{code:'GOOGLE_PLACES_BUDGET_EXHAUSTED'});
 if(model)models++;if(places)google++;
 const started=Date.now();write({event:'START',kind:model?'MODEL':places?'GOOGLE':'NODE_READ',origin:url.origin,path:url.pathname,method,models,google});
 try{const response=await original(input,init);write({event:'FINISH',kind:model?'MODEL':places?'GOOGLE':'NODE_READ',origin:url.origin,path:url.pathname,status:response.status,elapsedMs:Date.now()-started});return response;}
 catch(error){write({event:'FAILED',kind:model?'MODEL':places?'GOOGLE':'NODE_READ',origin:url.origin,path:url.pathname,elapsedMs:Date.now()-started});throw error;}
};
const open=LocalPlaywrightChromium.prototype.openSession;
LocalPlaywrightChromium.prototype.openSession=async function(input){
 const callback=input.recordResponse;
 return open.call(this,{...input,recordResponse:r=>{
  browserResponses++;const u=new URL(r.url);write({event:'BROWSER_RESPONSE',origin:u.origin,path:u.pathname,method:r.method,status:r.status,resourceType:r.resourceType});callback?.(r);
 }});
};
let errorCode:string|null=null;
try{
 await runHybridLiveRead({sleep:async ms=>{
  if(healthRetries>=Number(process.env.F5_ENV_RETRIES_REMAINING??0))throw Object.assign(Error('Environment allowance exhausted'),{code:'F5_ENV_RETRY_LIMIT'});
  healthRetries++;write({event:'HEALTH_RETRY',healthRetries,delayMs:ms});await delay(ms);
 }});
}catch(error){errorCode=error&&typeof error==='object'&&'code'in error?String(error.code):'RUNNER_FAILED';write({event:'RUNNER_EXIT_ERROR',errorCode});process.exitCode=1;}
finally{
 fs.writeFileSync(resolve(directory,'transport-usage.json'),JSON.stringify({modelCallsStarted:models,googleRequests:google,healthRetries,browserResponses,errorCode},null,2)+'\n');
}
