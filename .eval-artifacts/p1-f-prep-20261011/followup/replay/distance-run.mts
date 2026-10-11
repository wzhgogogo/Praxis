import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import {createHash} from 'node:crypto';
import {DeepSeekModelGateway} from '../../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA} from '../../../../src/domains/restaurant/agent-action.ts';
import {validateModelRequest} from '../../../../src/core/model/contracts.ts';
import {acceptableReplayAction,capturedReplayAction} from '../../../../src/eval/restaurant/agent-loop/runners/run-decision-replay.ts';
const dir=resolve('.eval-artifacts/p1-f-prep-20261011/followup/replay');const raw=await readFile(resolve(dir,'distance-prepared-requests.json'),'utf8');const {requests,seedHash}=JSON.parse(raw);
if(requests.length!==8)throw Error('Distance ceiling');await writeFile(resolve(dir,'distance-start.json'),JSON.stringify({startedAt:new Date().toISOString(),provider:'repository configured DeepSeek API',authorizedBy:'human followup 2026-10-11',requests:8,sha256:createHash('sha256').update(raw).digest('hex')},null,2),{flag:'wx'});
for(const row of requests){row.request={...row.request,outputSchema:{...row.request.outputSchema,jsonSchema:RESTAURANT_AGENT_ACTION_STRICT_WIRE_JSON_SCHEMA}};const errors=validateModelRequest(row.request);if(errors.length)throw Error(errors.join(';'));}
const model=DeepSeekModelGateway.fromEnvironment();const results=[];let calls=0;
for(const row of requests){
 calls++;const startedAt=new Date().toISOString(),start=Date.now();let response,error,action;
 try{response=await model.complete(row.request);action=capturedReplayAction(row.seed,{...row.captured,outputText:response.outputText});}catch(e){error=String(e);}
 const accepted=action?row.seed.acceptableActions.some(label=>acceptableReplayAction(action,label)):false;
 const result={seedId:row.seed.seedId,mode:row.mode,request:row.request,response,error,action,accepted,capturedAction:row.capturedAction,distanceCount:row.distanceCount,startedAt,elapsedMs:Date.now()-start};results.push(result);
 await writeFile(resolve(dir,`${row.seed.seedId}-${row.mode}.json`),JSON.stringify(result,null,2),{flag:'wx'});
 await writeFile(resolve(dir,'distance-summary.json'),JSON.stringify({status:'EXPOSED_DEVELOPMENT_REPLAY_NOT_CLEAN_BASELINE',calls,googleRequests:0,seedHash,results:results.map(({request,response,...r})=>r)},null,2));console.log(row.seed.seedId,row.mode,accepted);
}
