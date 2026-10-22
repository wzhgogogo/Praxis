// One attempt per point. No paid retries; failures consume the 74-call budget.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {ModelBrowserReadActionDecision} from '../../../src/infrastructure/browser/browser-action-decision.ts';
import {normalizeRestaurantAgentActionStrictWire} from '../../../src/domains/restaurant/agent-action.ts';
import {assessSelectionReplay} from '../../../src/eval/restaurant/agent-loop/selection-replay-assessment.ts';
const dir='.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex');
const freezeBytes=await fs.readFile(`${dir}/freeze.json`),freeze=JSON.parse(freezeBytes);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))if(sha(await fs.readFile(p))!==h)throw Error(`FROZEN_CHANGED:${p}`);};await verify();
execFileSync('git',['diff','--exit-code','HEAD','--','src','docs/skills',`${dir}/prepared`,`${dir}/inputs`,`${dir}/*.mjs`],{stdio:'pipe'});
const calibration=JSON.parse(await fs.readFile(`${dir}/calibration-comparison/comparison.json`));
if(calibration.status!=='PASS'||calibration.outcomeMatches!==22)throw Error('CALIBRATION_NOT_PASSED');
const before=JSON.parse(await fs.readFile(`${dir}/inputs/ledger-before.json`));
if(before.totalModelCalls!==2069||before.remaining.modelCalls<74||before.totalModelCalls+74>before.limits.modelCalls)throw Error('PHASE2_BUDGET');
const summary=JSON.parse(await fs.readFile(`${dir}/prepared/summary.json`));
const selection=JSON.parse(await fs.readFile(`${dir}/prepared/selection.json`));
if(summary.calendarCount!==69||selection.length!==5)throw Error('FIXED_SAMPLE_REQUIRED');
await fs.mkdir(`${dir}/model-results`); // No overwrite or resume means no duplicate API calls.
const codeCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const ledger={schema:'calendar-fix-model-ledger@1',codeCommit,freezeSha256:sha(freezeBytes),maxCalls:74,calendarPlanned:69,selectionPlanned:5,websiteRequests:0,googleRequests:0,fullLiveRuns:0,automaticRetries:0,calls:[]};
const originalFetch=globalThis.fetch;
globalThis.fetch=(url,init)=>{const u=new URL(String(url));if(u.origin!=='https://api.deepseek.com'||!['/beta/chat/completions','/chat/completions'].includes(u.pathname)||init?.method!=='POST')throw Error('ONLY_APPROVED_MODEL_ENDPOINT');return originalFetch(url,{...init,redirect:'error'});};
const gateway=DeepSeekModelGateway.fromEnvironment(process.env);
const saveLedger=()=>fs.writeFile(`${dir}/model-ledger.json`,JSON.stringify(ledger,null,2));
const results=[];
async function invoke(kind,id,request,input,expected,selectionInput){
 if(ledger.calls.length>=74||ledger.calls.some(c=>c.id===id))throw Error('CALL_BUDGET_OR_DUPLICATE');
 const call={kind,id,startedAt:new Date().toISOString(),requestSha256:sha(JSON.stringify(request)),status:'STARTED'};
 ledger.calls.push(call);await saveLedger();let response,action,error=null;
 const started=performance.now();
 try{
  if(kind==='CALENDAR'){
   action=await new ModelBrowserReadActionDecision({complete:async actual=>{if(sha(JSON.stringify(actual))!==call.requestSha256)throw Error('PRODUCTION_REQUEST_CHANGED');response=await gateway.complete(actual);return response;}}).decide(input);
  }else{
   response=await gateway.complete(request);if(response.finishReason!=='TOOL_CALLS')throw Error('MODEL_FINISH_REJECTED');
   const decoded=normalizeRestaurantAgentActionStrictWire(JSON.parse(response.outputText));if(!decoded.valid)throw Error('AGENT_OUTPUT_REJECTED');action=decoded.value;
  }
  call.status='SUCCEEDED';
 }catch(e){error=e.code??e.message??'MODEL_REPLAY_FAILED';call.status='FAILED';}
 Object.assign(call,{finishedAt:new Date().toISOString(),wallMs:performance.now()-started,latencyMs:response?.latencyMs,model:response?.model,usage:response?.usage,error});await saveLedger();
 const verdict=kind==='CALENDAR'?{acceptable:action?.type===expected.action&&action?.targetRef===expected.targetRef,expected,actualTarget:input.observation.targets.find(t=>t.ref===action?.targetRef)}:
  (action?assessSelectionReplay(action,selectionInput.context,selectionInput.outlets,selectionInput.annotation,selectionInput.rules,1000):{verdict:'NO_ACTION',reasons:[error]});
 const acceptable=kind==='CALENDAR'?verdict.acceptable:verdict.verdict==='ACCEPTABLE';
 const result={kind,id,codeCommit,freezeSha256:ledger.freezeSha256,call,action,rawResponse:response,verdict,acceptable};
 await fs.writeFile(`${dir}/model-results/${id}.json`,JSON.stringify(result,null,2),{flag:'wx'});results.push(result);
 console.log(JSON.stringify({kind,id,status:call.status,acceptable,calls:ledger.calls.length,wallMs:Math.round(call.wallMs)}));
}
for(const row of summary.rows){const p=JSON.parse(await fs.readFile(`${dir}/prepared/${row.id}.json`));if(sha(JSON.stringify(p.request))!==p.requestSha256)throw Error('PREPARED_REQUEST_CHANGED');await invoke('CALENDAR',p.id,p.request,p.input,p.expected);}
for(const s of selection)await invoke('SELECTION',s.id,s.request,null,null,s);
await verify();
const calendar=results.filter(r=>r.kind==='CALENDAR'),selected=results.filter(r=>r.kind==='SELECTION');
const metric=rows=>({planned:rows.length,attempted:rows.length,succeeded:rows.filter(r=>r.call.status==='SUCCEEDED').length,passed:rows.filter(r=>r.acceptable).length,failedIds:rows.filter(r=>!r.acceptable).map(r=>r.id),meanWallMs:rows.reduce((s,r)=>s+r.call.wallMs,0)/rows.length,meanModelLatencyMs:rows.reduce((s,r)=>s+(r.call.latencyMs??0),0)/rows.length,inputTokens:rows.reduce((s,r)=>s+(r.call.usage?.inputTokens??0),0),outputTokens:rows.reduce((s,r)=>s+(r.call.usage?.outputTokens??0),0),reasoningTokens:rows.reduce((s,r)=>s+(r.call.usage?.reasoningTokens??0),0)});
const after=structuredClone(before);after.phase2ModelCalls+=ledger.calls.length;after.totalModelCalls+=ledger.calls.length;after.remaining.modelCalls-=ledger.calls.length;after.subtotals.calendarSelectedStateFix={modelRequests:ledger.calls.length,fullLiveRuns:0,sourceRequests:0};after.accountingNotes.push('Selected state fix: same69 production decisions + five selection decisions; all requests count, zero automatic retries.');
await fs.writeFile(`${dir}/phase2-ledger-after.json`,JSON.stringify(after,null,2),{flag:'wx'});
const output={schema:'calendar-fix-model-summary@1',codeCommit,freezeSha256:ledger.freezeSha256,calendar:metric(calendar),selection:metric(selected),gate:calendar.filter(r=>r.acceptable).length>=68&&selected.every(r=>r.acceptable)?'PASS':'FAIL',modelCalls:ledger.calls.length,websites:0,google:0,live:0};
await fs.writeFile(`${dir}/model-summary.json`,JSON.stringify(output,null,2),{flag:'wx'});console.log(JSON.stringify(output));
