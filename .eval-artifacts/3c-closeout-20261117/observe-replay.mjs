// Read-only transport observers around the unchanged original replay runner.
import {writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium} from 'playwright-core';
import {GooglePlacesClient} from '../../src/integrations/google/google-places-client.ts';
import {runObservedSourceReplay} from '../../src/eval/restaurant/agent-loop/runners/run-observed-source-replay.ts';
const caseId=process.argv[2];if(!['D01','D02'].includes(caseId))throw Error('D01 or D02 required');
const dir=resolve('.eval-artifacts/3c-closeout-20261117/replay',caseId);await mkdir(dir,{recursive:true});
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const observed=[],began=performance.now();
const originalGoogle=GooglePlacesClient.prototype.requestJson;
GooglePlacesClient.prototype.requestJson=function(url,init,fieldMask,...rest){
 observed.push({kind:'GOOGLE_REQUEST',atMs:performance.now()-began,url,method:init.method,body:typeof init.body==='string'?init.body:null,fieldMask});
 return originalGoogle.call(this,url,init,fieldMask,...rest);
};
const launch=chromium.launch.bind(chromium);
chromium.launch=async function(...args){
 const browser=await launch(...args),newContext=browser.newContext.bind(browser);
 browser.newContext=async function(...args){
  const context=await newContext(...args);
  context.on('request',request=>observed.push({kind:'BROWSER_REQUEST',atMs:performance.now()-began,url:request.url(),method:request.method(),body:request.postData(),resourceType:request.resourceType()}));
  return context;
 };return browser;
};
let outcome,error;
try{
 outcome=await runObservedSourceReplay(resolve('.eval-artifacts/phase3b/category-discovery-cost-20261110/runtime',caseId,caseId),resolve(dir,'result.json'));
 console.log(JSON.stringify({caseId,sha,outcome}));
}catch(e){error={name:e.name,message:e.message,stack:e.stack};throw e;}
finally{await writeFile(resolve(dir,'observed-requests.json'),JSON.stringify({caseId,sha,sourceRunner:'src/eval/restaurant/agent-loop/runners/run-observed-source-replay.ts',targetedRecordedEntry:false,observationOnly:true,realExternalCalls:0,observed,outcome,error},null,2)+'\n',{flag:'wx'});}
