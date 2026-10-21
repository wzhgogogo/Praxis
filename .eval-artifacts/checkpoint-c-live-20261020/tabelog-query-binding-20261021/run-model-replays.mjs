// Only the changed 69 browser decisions are paid calls. Unchanged selection
// requests reuse their exact recorded model outputs and current assessor.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {ModelBrowserReadActionDecision} from '../../../src/infrastructure/browser/browser-action-decision.ts';
import {normalizeRestaurantAgentActionStrictWire} from '../../../src/domains/restaurant/agent-action.ts';
import {assessSelectionReplay} from '../../../src/eval/restaurant/agent-loop/selection-replay-assessment.ts';
const dir='.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021';
const previous='.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex');
const freezeBytes=await fs.readFile(`${dir}/freeze.json`),freeze=JSON.parse(freezeBytes);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);};await verify();
execFileSync('git',['diff','--exit-code','HEAD','--','src','docs/skills',`${dir}/prepared`,`${dir}/inputs`,`${dir}/*.mjs`],{stdio:'pipe'});
const calibration=JSON.parse(await fs.readFile(`${dir}/calibration-comparison/comparison.json`));
assert.equal(calibration.status,'PASS');assert.equal(calibration.outcomeMatches,22);
const before=JSON.parse(await fs.readFile(`${dir}/inputs/ledger-before.json`));
assert.equal(before.totalModelCalls,2284);assert.ok(before.remaining.modelCalls>=69&&before.totalModelCalls+69<=before.limits.modelCalls);
assert.equal(before.sources.reduce((sum,source)=>sum+source.models,0),before.totalModelCalls);
const configuration=JSON.parse(await fs.readFile(`${dir}/inputs/model-configuration.json`));
assert.equal(process.env.DEEPSEEK_MODEL,configuration.model);
const summary=JSON.parse(await fs.readFile(`${dir}/prepared/summary.json`));assert.equal(summary.calendarCount,69);
const selection=JSON.parse(await fs.readFile(`${dir}/prepared/selection.json`)),priorSelection=JSON.parse(await fs.readFile(`${previous}/prepared/selection.json`));
assert.deepEqual(selection,priorSelection);assert.equal(selection.length,5);
const reused=[];
for(const input of selection){
 const sourcePath=`${previous}/model-results/${input.id}.json`,bytes=await fs.readFile(sourcePath),prior=JSON.parse(bytes);
 assert.equal(sha(JSON.stringify(input.request)),prior.call.requestSha256);assert.equal(prior.call.status,'SUCCEEDED');
 const decoded=normalizeRestaurantAgentActionStrictWire(JSON.parse(prior.rawResponse.outputText));assert.equal(decoded.valid,true);
 const assessment=assessSelectionReplay(decoded.value,input.context,input.outlets,input.annotation,input.rules,1000);
 assert.equal(assessment.verdict,'ACCEPTABLE');
 reused.push({id:input.id,mode:'CACHED_REAL_MODEL_RESPONSE_EXACT_SAME_REQUEST',requestSha256:input.requestSha256,sourcePath,sourceSha256:sha(bytes),assessment,modelCalls:0});
}
await fs.writeFile(`${dir}/selection-reuse.json`,JSON.stringify({status:'PASS',passed:5,total:5,modelCalls:0,rows:reused},null,2),{flag:'wx'});
await fs.mkdir(`${dir}/model-results`); // No resume/overwrite/retries.
const codeCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const ledger={schema:'tabelog-binding-model-ledger@1',codeCommit,freezeSha256:sha(freezeBytes),maxCalls:69,planned:69,sourceRequests:0,googleRequests:0,fullLiveRuns:0,automaticRetries:0,calls:[]};
const originalFetch=globalThis.fetch;
globalThis.fetch=(url,init)=>{const u=new URL(String(url));if(u.origin!=='https://api.deepseek.com'||!['/beta/chat/completions','/chat/completions'].includes(u.pathname)||init?.method!=='POST')throw Error('ONLY_APPROVED_MODEL_ENDPOINT');return originalFetch(url,{...init,redirect:'error'});};
const gateway=DeepSeekModelGateway.fromEnvironment(process.env);
const save=()=>fs.writeFile(`${dir}/model-ledger.json`,JSON.stringify(ledger,null,2));
const results=[];
for(const row of summary.rows){
 const p=JSON.parse(await fs.readFile(`${dir}/prepared/${row.id}.json`));assert.equal(sha(JSON.stringify(p.request)),p.requestSha256);
 assert.ok(ledger.calls.length<69&&!ledger.calls.some(c=>c.id===p.id));
 const call={id:p.id,startedAt:new Date().toISOString(),requestSha256:p.requestSha256,status:'STARTED'};
 ledger.calls.push(call);await save();const started=performance.now();let response,action,error=null;
 try{
  action=await new ModelBrowserReadActionDecision({complete:async request=>{assert.equal(sha(JSON.stringify(request)),call.requestSha256);response=await gateway.complete(request);return response;}}).decide(p.input);
  call.status='SUCCEEDED';
 }catch(e){error=e.code??e.message??'MODEL_REPLAY_FAILED';call.status='FAILED';}
 Object.assign(call,{finishedAt:new Date().toISOString(),wallMs:performance.now()-started,latencyMs:response?.latencyMs,model:response?.model,usage:response?.usage,error});await save();
 const acceptable=action?.type===p.expected.action&&action?.targetRef===p.expected.targetRef;
 const result={id:p.id,kind:'CALENDAR',codeCommit,freezeSha256:ledger.freezeSha256,call,action,rawResponse:response,expected:p.expected,acceptable};
 await fs.writeFile(`${dir}/model-results/${p.id}.json`,JSON.stringify(result,null,2),{flag:'wx'});results.push(result);
 console.log(JSON.stringify({id:p.id,calls:ledger.calls.length,acceptable,status:call.status,wallMs:Math.round(call.wallMs)}));
 if(results.filter(r=>!r.acceptable).length>1){console.log(JSON.stringify({stop:'THRESHOLD_UNREACHABLE',notReached:69-results.length}));break;}
}
await verify();
const passed=results.filter(r=>r.acceptable).length;
const after=structuredClone(before);after.phase2ModelCalls+=ledger.calls.length;after.totalModelCalls+=ledger.calls.length;after.remaining.modelCalls-=ledger.calls.length;
after.subtotals.tabelogQueryBindingFix={modelRequests:ledger.calls.length,selectionCachedResponses:5,sourceRequests:0,fullLiveRuns:0,environmentReruns:0};
after.currentAuthorization={scope:'OFFLINE_TABELOG_FIX_ONLY; prior Live sequence suspended pending independent review',historicalS0Retained:true};
after.accountingNotes.push('Tabelog binding repair: 69 changed browser-decision requests; no retries; unchanged five selection requests rescored from exact recorded model outputs, zero extra API calls.');
after.sources.push({path:`${dir}/model-ledger.json`,sha256:sha(await fs.readFile(`${dir}/model-ledger.json`)),models:ledger.calls.length,fullLiveRuns:0,scope:'PHASE2',cohort:'OFFLINE_TABELOG_QUERY_BINDING_REPAIR'});
assert.equal(after.sources.reduce((sum,source)=>sum+source.models,0),after.totalModelCalls);
await fs.writeFile(`${dir}/phase2-ledger-after.json`,JSON.stringify(after,null,2),{flag:'wx'});
const result={schema:'tabelog-binding-model-summary@1',codeCommit,freezeSha256:ledger.freezeSha256,calendar:{planned:69,attempted:results.length,passed,required:68,failedIds:results.filter(r=>!r.acceptable).map(r=>r.id),meanWallMs:results.reduce((s,r)=>s+r.call.wallMs,0)/results.length,inputTokens:results.reduce((s,r)=>s+(r.call.usage?.inputTokens??0),0),outputTokens:results.reduce((s,r)=>s+(r.call.usage?.outputTokens??0),0)},selection:{passed:5,total:5,newCalls:0,mode:'EXACT_INPUT_CACHED_MODEL_RESPONSE'},modelCalls:ledger.calls.length,sourceRequests:0,live:0,gate:passed>=68?'PASS':'FAIL'};
await fs.writeFile(`${dir}/model-summary.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify(result));
