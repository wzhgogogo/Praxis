import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {DeepSeekModelGateway} from '../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {observedCandidateDistance} from '../../../src/domains/restaurant/agent-context.ts';
import {acceptableReplayAction,capturedReplayAction} from '../../../src/eval/restaurant/agent-loop/runners/run-decision-replay.ts';
const dir=resolve('.eval-artifacts/p1-f-prep-20261011/distance');const seeds=JSON.parse(await readFile('.eval-artifacts/phase1-replay/seeds.v6.json','utf8')).seeds.filter(s=>/0129|0130|0131|0132/.test(s.seedId));
const model=DeepSeekModelGateway.fromEnvironment();let calls=0;const results=[];
for(const seed of seeds){
 const captured=(await readFile(seed.origin.runArtifact,'utf8')).trim().split('\n').map(JSON.parse).find(r=>r.sequence===seed.origin.decisionIndex);
 const state=JSON.parse(await readFile(seed.origin.runArtifact.replace('.decisions.jsonl','.result.json'),'utf8')).finalSnapshot.domainState;
 const messages=captured.messages.map(m=>{if(m.role!=='user')return m;const data=JSON.parse(m.content);data.context.candidates=data.context.candidates.map(c=>({...c,...observedCandidateDistance(state.readEvidence,c.id,captured.startedAt??data.context.now)}));return {...m,content:JSON.stringify(data)};});
 const request={taskId:`distance:${seed.seedId}`,purpose:captured.purpose,promptVersion:captured.promptVersion+'+distance-only@1',messages,outputSchema:captured.outputSchema,responseFormat:captured.responseFormat,timeoutMs:30000,fallback:'FAIL_CLOSED',...(captured.maxOutputTokens==null?{}:{maxOutputTokens:captured.maxOutputTokens}),...(captured.temperature==null?{}:{temperature:captured.temperature}),...(captured.thinking==null?{}:{thinking:captured.thinking})};
 calls++;let response,error,action,accepted;try{response=await model.complete(request);action=capturedReplayAction(seed,{...captured,outputText:response.outputText});accepted=seed.acceptableActions.some(label=>acceptableReplayAction(action,label));}catch(e){error=String(e);accepted=false;}
 const row={seedId:seed.seedId,mode:'INJECTED_DISTANCE_ONLY',request,response,error,action,accepted,originalAction:capturedReplayAction(seed,captured),injectionFields:['context.candidates[].distanceObservation'],distanceCount:JSON.parse(messages.find(m=>m.role==='user').content).context.candidates.filter(c=>c.distanceObservation).length};results.push(row);await writeFile(resolve(dir,seed.seedId+'.json'),JSON.stringify(row,null,2));await writeFile(resolve(dir,'replay-summary.json'),JSON.stringify({calls,googleRequests:0,results:results.map(({request,response,...r})=>r)},null,2));console.log(seed.seedId,accepted,row.distanceCount);
}
