import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { availabilityPathInjectedRequest, capturedReplayAction } from '../../../src/eval/restaurant/agent-loop/runners/run-decision-replay.ts';
import { buildRestaurantAgentDecisionSystemPrompt } from '../../../src/domains/restaurant/agent-decision.ts';
import { projectRestaurantAgentContext } from '../../../src/domains/restaurant/agent-context.ts';
import { restaurantBookingTaskDefinition as definition } from '../../../src/domains/restaurant/task-definition.ts';
import { assessSelectionReplay } from '../../../src/eval/restaurant/agent-loop/selection-replay-assessment.ts';
const base='.eval-artifacts/p2-2-selection-20261019',dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022/calendar/selection';
globalThis.fetch=()=>{throw Error('OFFLINE_PREPARE_ONLY');};
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const files={},load=async p=>{const b=await fs.readFile(p);files[p]=sha(b);return b;};
const annotations=JSON.parse(await load(`${base}/seed-annotations.reviewer.json`)),contracts=JSON.parse(await load(`${base}/selection-contracts.json`));
const seeds=[...JSON.parse(await load('.eval-artifacts/phase1-replay/seeds.v7.json')).seeds,...JSON.parse(await load(`${base}/selection-seeds.pending.json`)).seeds];
const ids=['p1-seed-0133','p1-seed-0134','p22-selection-001','p22-selection-002','p22-selection-003'],inputs=[];
for(const id of ids){
 const seed=seeds.find(s=>s.seedId===id),annotation=annotations.annotations.find(a=>a.seedId===id&&a.labelStatus==='ANNOTATED'),rules=contracts.rules.filter(r=>r.seedId===id);
 if(!seed||!annotation||!annotation.acceptableActions.every(a=>rules.some(r=>r.type===a.type&&r.when===a.when)))throw Error('ANNOTATION_MISMATCH');
 const row=seed.origin?String(await load(seed.origin.runArtifact)).split('\n').filter(Boolean).map(JSON.parse).find(r=>r.sequence===seed.origin.decisionIndex):JSON.parse(await load(seed.decision));
 const artifact=JSON.parse(gunzipSync(await load(seed.origin?.resultArtifact??seed.originalResult)));
 const beforeContext=JSON.parse(row.messages.find(m=>m.role==='user').content).context;
 const matches=artifact.trajectories.filter(t=>t.decisionContext?.now===beforeContext.now);
 if(matches.length!==1)throw Error(`AMBIGUOUS_PRE_DECISION_STATE:${id}:${matches.length}`);
 const step=matches[0],events=artifact.events.slice(0,step.stateVersionBefore);
 let serial=0,state=definition.create({}, {taskId:step.taskId,runId:artifact.runId,now:artifact.startedAt,createId:p=>`capture:${p}:${++serial}`});
 for(const envelope of events)state=definition.transition(state,envelope.event,{taskId:step.taskId,runId:artifact.runId,now:envelope.occurredAt,createId:p=>`capture:${p}:${++serial}`}).state;
 const projected=projectRestaurantAgentContext(state,beforeContext.now);
 const observed=new Map();for(const e of events)if(e.event.type==='SEARCH_COMPLETED')for(const c of e.event.candidates)observed.set(c.restaurant.id,c.restaurant);
 const outlets=[...observed.values()].filter(o=>beforeContext.candidates.some(c=>c.id===o.id));
 const request=availabilityPathInjectedRequest({...seed,level:'AGENT'},row,outlets,state.readEvidence);
 request.messages=request.messages.map(m=>{
  if(m.role==='system')return {...m,content:buildRestaurantAgentDecisionSystemPrompt()};
  if(m.role!=='user')return m;
  const input=JSON.parse(m.content);input.context.candidates=input.context.candidates.map(c=>{
   const current=projected.candidates.find(x=>x.id===c.id);if(!current)throw Error(`MISSING_CANDIDATE:${id}:${c.id}`);
   return {...c,observedFacts:current.observedFacts,sourceAttempts:current.sourceAttempts};
  });return {...m,content:JSON.stringify(input)};
 });
 const context=JSON.parse(request.messages.find(m=>m.role==='user').content).context;
 if(context.schemaVersion!=='15')throw Error('REQUIRES_CONTEXT15');
 const beforeAction=capturedReplayAction({...seed,level:'AGENT'},row),before=assessSelectionReplay(beforeAction,beforeContext,outlets,annotation,rules,contracts.radiusMeters);
 if(before.verdict!==annotation.recordedActionVerdict)throw Error('BASELINE_LABEL_CHANGED');
 inputs.push({id,annotation,rules,request,context,outlets,beforeAction,before,requestSha256:sha(JSON.stringify(request)),reconstruction:{stateVersionBefore:step.stateVersionBefore,events:events.length,observedFactsCount:context.candidates.filter(c=>c.observedFacts.commercialNotes.length).length,priceFactsCount:state.readEvidence.filter(e=>e.priceFacts).length}});
}
await fs.mkdir(dir);
await fs.writeFile(`${dir}/prepared-inputs.json`,JSON.stringify(inputs,null,2),{flag:'wx'});
console.log(JSON.stringify({status:'PREPARED_FROM_CURRENT_REDUCER_AND_CONTEXT',count:inputs.length,models:0,websites:0}));
