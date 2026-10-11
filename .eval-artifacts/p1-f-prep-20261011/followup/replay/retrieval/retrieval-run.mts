import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {DeepSeekModelGateway} from '../../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {validateModelRequest} from '../../../../src/core/model/contracts.ts';
import {decodeBrowserReadActionWire,BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA,BROWSER_ACTION_DECISION_SCHEMA} from '../../../../src/infrastructure/browser/browser-action-decision.ts';
const dir=resolve('.eval-artifacts/p1-f-prep-20261011/followup/replay');
const preparedPath=resolve('.eval-artifacts/p1-f-prep-20261011/retrieval-terms/prepared-requests.json');
const raw=await readFile(preparedPath,'utf8');const prepared=JSON.parse(raw);const requests=prepared.requests;
if(requests.length!==16||BROWSER_ACTION_DECISION_SCHEMA.version!=='12')throw Error('Frozen replay contract mismatch');
for(const row of requests){if(row.request.outputSchema.version!=='12')throw Error('Schema mismatch');const request={...row.request,outputSchema:{...row.request.outputSchema,jsonSchema:BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA}};const errors=validateModelRequest(request);if(errors.length)throw Error(errors.join(';'));}
await writeFile(resolve(dir,'retrieval-start.json'),JSON.stringify({startedAt:new Date().toISOString(),preparedPath,sha256:createHash('sha256').update(raw).digest('hex'),authorizedRequests:16,provider:'https://api.deepseek.com',branch:'codex/exp-retrieval-terms',transportMaterialization:'Existing Schema 12 strict wire schema; messages and all other saved fields unchanged'},null,2),{flag:'wx'});
const model=DeepSeekModelGateway.fromEnvironment();const results=[];let calls=0;
for(const row of requests){
 const request={...row.request,outputSchema:{...row.request.outputSchema,jsonSchema:BROWSER_ACTION_DECISION_STRICT_WIRE_JSON_SCHEMA}};
 const user=JSON.parse(request.messages.find(m=>m.role==='user').content);let response,newAction,error;const start=Date.now(),startedAt=new Date().toISOString();calls++;
 try{response=await model.complete(request);newAction=decodeBrowserReadActionWire(JSON.parse(response.outputText),new Set(user.observation.targets.map(t=>t.ref)));}catch(e){error=String(e);}
 const result={...row,request,response,newAction,error,startedAt,elapsedMs:Date.now()-start,term:newAction?.type==='REFINE_RETRIEVAL'?newAction.term:undefined,quotedOriginal:newAction?.type==='REPORT_NO_RESULTS'?newAction.reason:undefined,executorAcceptance:null,executorValidationStatus:'INCOMPLETE_ORIGINAL_DOM_SNAPSHOT',note:'Frozen messages; no implementer scoring; no website access. Original query binding, result regions and before/after snapshots unavailable.'};results.push(result);
 await writeFile(resolve(dir,`retrieval-${String(calls).padStart(2,'0')}.json`),JSON.stringify(result,null,2),{flag:'wx'});
 await writeFile(resolve(dir,'retrieval-summary.json'),JSON.stringify({status:'EXPOSED_DEVELOPMENT_REPLAY_PENDING_INDEPENDENT_LABEL',calls,googleRequests:0,results:results.map(({request,response,...r})=>r)},null,2));console.log(row.group,row.sequence,newAction?.type??'ERROR');
}
