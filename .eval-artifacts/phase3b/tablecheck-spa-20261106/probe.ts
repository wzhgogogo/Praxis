import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {setTimeout as wait} from 'node:timers/promises';
import {LocalPlaywrightChromiumRuntime} from '../../../src/infrastructure/browser/local-playwright-chromium.js';
import {tableCheckPublicReadNetworkPolicy} from '../../../src/integrations/tablecheck/tablecheck-public-query.js';
import {BrowserReadRecording} from '../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.js';
import {traceBrowserRuntime} from '../../../src/eval/restaurant/agent-loop/runners/browser-case-slice-evidence.js';
import {chargeG6} from '../../../src/eval/restaurant/agent-loop/g6/budget.js';
import {normalizedTextKey} from '../../../src/core/text-key.js';
import {isBrowserReadPathProhibited} from '../../../src/infrastructure/browser/browser-read-policy.js';
const base='.eval-artifacts/phase3b/tablecheck-spa-20261106';
const spec=JSON.parse(await readFile(base+'/spec.json','utf8'));const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();assert.equal(sha,process.argv[2]);assert.equal(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),'');
assert.equal(process.env.PRAXIS_TABLECHECK_SPA_PROBE,'1');const out=base+'/runtime';await mkdir(out,{recursive:false});
await writeFile(out+'/budget.json',await readFile(base+'/budget-seed.json'),{flag:'wx'});
const cet=()=>new Date(Date.now()+3600000).toISOString().replace('Z','+01:00');
await writeFile(out+'/started.json',JSON.stringify({atCET:cet(),sourceSHA:sha,spec,model:0,live:0,maximumPageReads:2},null,2));
const policy={...tableCheckPublicReadNetworkPolicy,genericPublicRead:true};
const recorder=new BrowserReadRecording({directory:out,runId:'recording',reviewedStaticResources:policy.staticResources,reviewedReads:policy.dynamicReads});
const events:any[]=[];const responses:any[]=[];const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
let step='START',pages=0;const control=new AbortController();const timer=setTimeout(()=>control.abort(),120000);let session:any;
const sink=recorder.traceSink();
const runtime=traceBrowserRuntime(new LocalPlaywrightChromiumRuntime({headless:true,admittedGetTransport:'BROWSER_GET_HEAD'}),'TABLECHECK',(kind,detail)=>{events.push({sequence:events.length+1,kind,detail});return events.length;},{...sink,recordResponse:async r=>{const u=new URL(r.url);responses.push({step,origin:u.origin,pathname:u.pathname,method:r.method,resourceType:r.resourceType,status:r.status,queryFields:[...u.searchParams].map(([key,value])=>({key,valueSha256:hash(value),normalizedValueSha256:hash(normalizedTextKey(value))}))});await recorder.recordResponse(r);}});
try{
 session=await runtime.openSession({signal:control.signal,networkPolicy:policy});assert.equal(session.metadata.readNetworkBoundary,'INSTALLED');
 await chargeG6(out+'/budget.json','C-TC-SPA:page-1','evaluationPublicGET','Authorized SPA probe page1, no model/Live');pages++;
 step='ENTRY';await session.prepareNavigation(spec.startUrl,{timeoutMs:20000});await session.navigate(spec.startUrl,{waitUntil:'domcontentloaded',timeoutMs:20000});await session.waitForSettled?.({url:'',title:'',text:''},5000);
 let snapshot=await session.snapshot();let controls=await session.observeControls();
 const button=controls.filter((c:any)=>c.visible&&!c.disabled&&c.kind==='BUTTON'&&/\bDestination\b/i.test(c.label)&&c.formMethod!=='POST');assert.equal(button.length,1,'Expected one observed Destination control');
 step='OPEN_DESTINATION';await session.click(button[0].id,{timeoutMs:5000});snapshot=await session.snapshot();controls=await session.observeControls();
 const inputs=controls.filter((c:any)=>c.visible&&!c.disabled&&!c.readOnly&&c.kind==='INPUT'&&/\bDestination\b/i.test(c.label)&&c.formMethod!=='POST');assert.equal(inputs.length,1,'Expected one observed Destination input');
 step='FILL_FULL_NAME';await session.fill(inputs[0].id,spec.query,{timeoutMs:5000,inputSource:'SPECIFIC_OUTLET'});await wait(5000,{signal:control.signal});await session.waitForSettled?.(snapshot,5000);snapshot=await session.snapshot();controls=await session.observeControls();
 const matches=controls.filter((c:any)=>c.visible&&!c.disabled&&c.kind!=='INPUT'&&c.formMethod!=='POST'&&normalizedTextKey(c.label).includes(normalizedTextKey(spec.query))&&(!c.href||!isBrowserReadPathProhibited(policy,c.href)));
 events.push({kind:'SUGGESTION_MATCHES',detail:{count:matches.length,controls:matches.map((c:any)=>({id:c.id,label:c.label,kind:c.kind,href:c.href??null}))}});
 if(matches.length===1){
  await chargeG6(out+'/budget.json','C-TC-SPA:page-2','evaluationPublicGET','Authorized SPA probe page2 or selected-result route; >=5 seconds since page1');pages++;
  step='SELECT_MATCH';const target=matches[0];if(target.kind==='LINK'&&target.href){await session.prepareObservedNavigation(target.href,{timeoutMs:20000});await session.openLink(target.id,target.href,{timeoutMs:20000});}else await session.click(target.id,{timeoutMs:5000});
  await wait(5000,{signal:control.signal});await session.waitForSettled?.(snapshot,5000);await session.snapshot();await session.observeControls();
 }
 await writeFile(out+'/outcome.json',JSON.stringify({atCET:cet(),sourceSHA:sha,status:matches.length===1?'OBSERVED_SELECTED_RESULT':'NO_UNIQUE_FULL_NAME_SUGGESTION',pageReadsCharged:pages,model:0,live:0},null,2),{flag:'wx'});
}catch(error){await writeFile(out+'/outcome.json',JSON.stringify({atCET:cet(),sourceSHA:sha,status:'PROBE_STOPPED',step,pageReadsCharged:pages,error:{name:error instanceof Error?error.name:'Error',message:error instanceof Error?error.message:'Unknown'}},null,2),{flag:'wx'});}
finally{clearTimeout(timer);await session?.flushRecordedResponses?.();await session?.close();await writeFile(out+'/events.json',JSON.stringify(events,null,2));await writeFile(out+'/responses.json',JSON.stringify(responses,null,2));const recording=await recorder.finish();console.log(JSON.stringify({recording,outcome:JSON.parse(await readFile(out+'/outcome.json','utf8'))}));}
