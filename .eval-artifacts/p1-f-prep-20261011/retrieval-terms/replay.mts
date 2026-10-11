import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {decodeBrowserReadActionWire,BROWSER_ACTION_DECISION_SCHEMA} from '../../../src/infrastructure/browser/browser-action-decision.ts';
import {observedRetrievalTerm} from '../../../src/core/retrieval-term.ts';
const dir=resolve('.eval-artifacts/p1-f-prep-20261011/retrieval-terms');
const origins=[
 ['kf-h001 P1-E','/Users/wangzhour/.codex/worktrees/p1-e-early-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-09T13-10-13-804Z-10e4f743-60ba-40e2-b55e-0f5235bf8943.decisions.jsonl',24,28],
 ['kf-h005 P1-E','/Users/wangzhour/.codex/worktrees/p1-prelive-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-10T07-22-08-924Z-e20670f6-be89-4fb4-a170-2f8017964c23.decisions.jsonl',3,8],
 ['kf-h005 retest','/Users/wangzhour/.codex/worktrees/p1-d-kf-h005-retest/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-10T14-17-08-629Z-f91b4338-346a-414e-b566-4153016a1259.decisions.jsonl',3,7]
] as const;
const prepared=[];const results=[];let calls=0;
// PREPARE is network-free. RUN_MODEL requires the user's explicit DeepSeek destination approval.
const model=process.env.RUN_MODEL==='1'?DeepSeekModelGateway.fromEnvironment():undefined;
for(const [group,path,first,last] of origins){
 const raw=await readFile(path,'utf8');const rows=raw.trim().split('\n').map(JSON.parse);
 const htmlFiles=(await readdir(resolve(dirname(path),'recordings'),{recursive:true}).catch(()=>[])).filter(p=>String(p).endsWith('.html'));
 for(let sequence=first;sequence<=last;sequence++){
  const captured=rows.find(r=>r.sequence===sequence);if(!captured)throw new Error('Missing original decision');
  const originalUser=JSON.parse(captured.messages.find(m=>m.role==='user').content);
  if(captured.purpose!=='browser_read_decide')throw new Error('Unexpected Agent decision; retrievalHint injection must be separately specified');
  const messages=captured.messages.map(m=>{if(m.role!=='user')return m;const u=JSON.parse(m.content);u.observation.pageActions=[...new Set([...(u.observation.pageActions??[]),'REFINE_RETRIEVAL','REPORT_NO_RESULTS'])];return {...m,content:JSON.stringify(u)};});
  const request={taskId:`retrieval:${group}:${sequence}`,purpose:captured.purpose,promptVersion:captured.promptVersion+'+page-actions-only@1',messages,outputSchema:{...captured.outputSchema,...BROWSER_ACTION_DECISION_SCHEMA},responseFormat:captured.responseFormat,timeoutMs:30000,fallback:'FAIL_CLOSED',...(captured.maxOutputTokens==null?{}:{maxOutputTokens:captured.maxOutputTokens}),...(captured.temperature==null?{}:{temperature:captured.temperature}),...(captured.thinking==null?{}:{thinking:captured.thinking})};
  const injectedUser=JSON.parse(messages.find(m=>m.role==='user').content);injectedUser.observation.pageActions=originalUser.observation.pageActions;
  if(JSON.stringify(injectedUser)!==JSON.stringify(originalUser))throw new Error('Injection changed unapproved message fields');
  const snapshotNumber=String(captured.browser.recordingSnapshot).padStart(4,'0');const matchingHtml=htmlFiles.filter(f=>String(f).includes(`snapshot-${snapshotNumber}`));
  const row={group,sequence,origin:path,originSha256:createHash('sha256').update(raw).digest('hex'),originalAction:JSON.parse(captured.outputText),injectionFields:['observation.pageActions'],agentRetrievalHint:'NOT_APPLICABLE_BROWSER_DECISION',htmlCoverage:matchingHtml,request};prepared.push(row);
  if(!model)continue;if(calls>=20)throw new Error('Retrieval replay budget exceeded');calls++;
  let response,newAction,error;try{response=await model.complete(request);newAction=decodeBrowserReadActionWire(JSON.parse(response.outputText),new Set(originalUser.observation.targets.map(t=>t.ref)));}catch(e){error=String(e);}
  const expression=originalUser.goal.retrievalExpression??(group==='kf-h001 P1-E'?originalUser.goal.outlet.name:'local food');
  const termGate=newAction?.type==='REFINE_RETRIEVAL'?observedRetrievalTerm(newAction.term,expression)&&newAction.term!==expression:undefined;
  // Original snapshot regions/query bindings and before/after stability must be available before claiming executor acceptance.
  results.push({...row,response,newAction,error,termGate,executorAcceptance:null,executorValidationStatus:matchingHtml.length?'REQUIRES_RECORDED_QUERY_REGION_AND_STABILITY_VALIDATION':'INCOMPLETE_ORIGINAL_DOM_SNAPSHOT',note:'No implementer label; no website access'});
  await writeFile(resolve(dir,'replay-results.json'),JSON.stringify({calls,googleRequests:0,results},null,2));
 }
}
await writeFile(resolve(dir,'prepared-requests.json'),JSON.stringify({status:'EXPOSED_DEVELOPMENT_REPLAY_NOT_CLEAN_BASELINE',calls,requests:prepared},null,2));
const distributions={};for(const r of prepared){const key=r.group;distributions[key]??={original:{},new:{}};const action=r.originalAction.action;distributions[key].original[action]=(distributions[key].original[action]??0)+1;}for(const r of results){const action=r.newAction?.type??'ERROR';distributions[r.group].new[action]=(distributions[r.group].new[action]??0)+1;}
await writeFile(resolve(dir,'replay-summary.json'),JSON.stringify({status:model?'RUN_COMPLETE_NO_IMPLEMENTER_LABEL':'PENDING_EXPLICIT_DEEPSEEK_DESTINATION_APPROVAL',calls,preparedCount:prepared.length,googleRequests:0,distributions,results:results.map(({request,response,...r})=>r),domCoverage:prepared.map(({group,sequence,htmlCoverage})=>({group,sequence,htmlCoverage}))},null,2));
console.log(JSON.stringify({calls,prepared:prepared.length,distributions}));
