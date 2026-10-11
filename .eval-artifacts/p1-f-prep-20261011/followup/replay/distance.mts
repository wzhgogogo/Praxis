import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {DeepSeekModelGateway} from '../../../../src/infrastructure/deepseek/deepseek-model-gateway.ts';
import {observedCandidateDistance} from '../../../../src/domains/restaurant/agent-context.ts';
import {acceptableReplayAction,capturedReplayAction,validateReplayMatchFields} from '../../../../src/eval/restaurant/agent-loop/runners/run-decision-replay.ts';
const dir=resolve('.eval-artifacts/p1-f-prep-20261011/followup/replay');
const seedsRaw=await readFile('.eval-artifacts/phase1-replay/seeds.v6.json','utf8');const seeds=JSON.parse(seedsRaw).seeds.filter(s=>/0129|0130|0131|0132/.test(s.seedId));
const audit=JSON.parse(await readFile('.eval-artifacts/p1-f-prep-20261011/distance/payload-audit.json','utf8'));const requests=[];
for(const seed of seeds){
 if(!audit.some(a=>a.seedId===seed.seedId))throw Error('Not authorized audit seed');for(const label of seed.acceptableActions)validateReplayMatchFields(label);
 const captured=(await readFile(seed.origin.runArtifact,'utf8')).trim().split('\n').map(JSON.parse).find(r=>r.sequence===seed.origin.decisionIndex);
 const state=JSON.parse(await readFile(seed.origin.runArtifact.replace('.decisions.jsonl','.result.json'),'utf8')).finalSnapshot.domainState;
 for(const mode of ['ORIGINAL','INJECTED_DISTANCE_ONLY']){
  const messages=mode==='ORIGINAL'?captured.messages:captured.messages.map(m=>{if(m.role!=='user')return m;const data=JSON.parse(m.content);data.context.candidates=data.context.candidates.map(c=>({...c,...observedCandidateDistance(state.readEvidence,c.id,captured.startedAt??data.context.now)}));return {...m,content:JSON.stringify(data)};});
  const request={taskId:`distance:${seed.seedId}:${mode}`,purpose:captured.purpose,promptVersion:mode==='ORIGINAL'?captured.promptVersion:captured.promptVersion+'+distance-only@1',messages,outputSchema:captured.outputSchema,responseFormat:captured.responseFormat,timeoutMs:30000,fallback:'FAIL_CLOSED',...(captured.maxOutputTokens==null?{}:{maxOutputTokens:captured.maxOutputTokens}),...(captured.temperature==null?{}:{temperature:captured.temperature}),...(captured.thinking==null?{}:{thinking:captured.thinking})};
  requests.push({seed,mode,capturedAction:capturedReplayAction(seed,captured),captured,request,distanceCount:JSON.parse(messages.find(m=>m.role==='user').content).context.candidates.filter(c=>c.distanceObservation).length});
 }
}
await writeFile(resolve(dir,'distance-prepared-requests.json'),JSON.stringify({source:'prior distance/replay.mts, identical audited payload construction; ORIGINAL mode is the same audited unmodified messages',seedHash:createHash('sha256').update(seedsRaw).digest('hex'),requests},null,2),{flag:'wx'});
console.log('prepared',requests.map(r=>({id:r.seed.seedId,mode:r.mode,distanceCount:r.distanceCount})));
if(process.env.RUN_MODEL!=='1')process.exit(0);
const model=DeepSeekModelGateway.fromEnvironment();let calls=0;const results=[];
for(const row of requests){
 calls++;let response,error,action;try{response=await model.complete(row.request);action=capturedReplayAction(row.seed,{...row.captured,outputText:response.outputText});}catch(e){error=String(e);}
 const accepted=action?row.seed.acceptableActions.some(label=>acceptableReplayAction(action,label)):false;
 const result={seedId:row.seed.seedId,mode:row.mode,request:row.request,response,error,action,accepted,capturedAction:row.capturedAction,distanceCount:row.distanceCount};results.push(result);
 await writeFile(resolve(dir,`${row.seed.seedId}-${row.mode}.json`),JSON.stringify(result,null,2),{flag:'wx'});
 await writeFile(resolve(dir,'distance-summary.json'),JSON.stringify({status:'EXPOSED_DEVELOPMENT_REPLAY_NOT_CLEAN_BASELINE',calls,googleRequests:0,seedHash:createHash('sha256').update(seedsRaw).digest('hex'),results:results.map(({request,response,...r})=>r)},null,2));console.log(row.seed.seedId,row.mode,accepted);
}
