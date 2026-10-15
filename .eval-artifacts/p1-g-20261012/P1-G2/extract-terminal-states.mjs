// Artifact-only extraction: no model, browser or network access.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {restaurantBookingTaskDefinition as definition} from '../../../src/domains/restaurant/task-definition.ts';
import {assessRestaurantRead} from '../../../src/domains/restaurant/read-assessment.ts';
import {validateRestaurantAction} from '../../../src/domains/restaurant/action-validator.ts';
import {restaurantAvailabilityRequestFingerprint,restaurantSearchIntentFingerprint} from '../../../src/domains/restaurant/contracts.ts';
import {RestaurantExecutionRouter} from '../../../src/application/restaurant-execution-router.ts';
const paths=[
 '/Users/wangzhour/.codex/worktrees/p1f-part-a-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-11T20-51-39-041Z-2e7d16f6-1c88-438f-ab51-f988c058492c.result.json',
 '/Users/wangzhour/.codex/worktrees/p1-g-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-12T07-11-53-308Z-c8e5fbf5-e7be-4f5a-a439-fc2dd79512ff.result.json',
];
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const router=new RestaurantExecutionRouter({async search(){throw Error('NO_NETWORK')}},{async check(){throw Error('NO_NETWORK')}});
async function diagnose(state,now,openedAt){
 const context={taskId:'fixture',runId:'fixture',now:openedAt,createId:p=>p};
 const assessment=assessRestaurantRead(state,now);
 const opened=definition.transition(state,{type:'READ_END_WINDOW_OPENED',deadlineAt:new Date(Date.parse(now)+45000).toISOString()},context).state;
 const verdict=validateRestaurantAction(opened,{type:'END_READ'},now);
 const execution=await router.execute({type:'END_READ'},opened,now);
 return {phase:state.phase,failureCode:state.failure?.code??null,phaseAllowed:['UNDERSTANDING','SEARCHING','SELECTION_REQUIRED'].includes(state.phase),oldFailureAllowed:!state.failure||['GOOGLE_LOCATION_UNRESOLVED','GOOGLE_LOCAL_REQUEST_BUDGET_EXCEEDED'].includes(state.failure.code),eligibleCount:assessment.presentation.filter(x=>x.eligible).length,checkableCount:assessment.checkableCandidateIds.length,endReadValidation:verdict,routerEvent:execution.event?.type??null};
}
function sanitize(state){
 const aliases=new Map();const alias=v=>{if(!aliases.has(v))aliases.set(v,`redacted-${aliases.size+1}`);return aliases.get(v)};
 const ids=new Set([...state.candidates.map(c=>c.restaurant.id),...state.readEvidence.map(e=>e.evidenceId)]);
 const enumKeys=new Set(['phase','status','code','reasonCode','failureCode','polarity','strength','goal','selectionScope','basis','partySizeSource','executionConfidence','source','outcome','sourceProvider','receptionMode','kind','provider','locationResolutionSource','areaMatchBasis','confidence','matchedBy','observationKind','inventoryStatus','field']);
 const scrub=(v,key='')=>{
  if(typeof v==='string')return (enumKeys.has(key)&&/^[A-Z][A-Z0-9_]*$/.test(v))||(key==='schemaVersion'&&/^\d+$/.test(v))||/^\d{4}-\d\d-\d\d(?:T[\d:.]+Z)?$/.test(v)||/^\d\d:\d\d$/.test(v)||['Asia/Tokyo','tabelog','tablecheck','google-places'].includes(v)?v:alias(v);
  if(typeof v==='number'&&['latitude','longitude','lat','lng'].includes(key))return 0;
  if(Array.isArray(v))return v.map(x=>scrub(x,key));
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[ids.has(k)?alias(k):k,scrub(x,k)]));
  return v;
 };
 const clean=scrub(state);
 if(clean.intent){for(const c of Object.values(clean.availabilityChecks))if(c.requestFingerprint)c.requestFingerprint=restaurantAvailabilityRequestFingerprint(clean.intent);if(clean.searchContinuation)clean.searchContinuation.intentFingerprint=restaurantSearchIntentFingerprint(clean.intent)}
 return clean;
}
const output=[];
for(const [i,path]of paths.entries()){
 const bytes=await readFile(path);const artifact=JSON.parse(bytes);const last=artifact.trajectories.at(-1);const now=last.occurredAt;
 let state=definition.create({}, {taskId:'fixture',runId:'fixture',now,createId:p=>p});
 for(const entry of artifact.events.slice(0,last.stateVersionBefore))state=definition.transition(state,entry.event,{taskId:entry.taskId,runId:entry.trace.runId,now:entry.occurredAt,createId:p=>p}).state;
 assert.equal(hash(state),last.stateHashBefore,'reconstructed state must match exact trajectory hash');
 // The coordinator samples `now` BEFORE dispatching the reserve event. The
 // runtime records its openedAt later. A fixed test clock had hidden this.
 const openedAt=artifact.events.find(e=>e.event.type==='READ_END_WINDOW_OPENED')?.occurredAt??new Date(Date.parse(now)+2).toISOString();
 const diagnosis=await diagnose(state,now,openedAt);const sanitized=sanitize(state);const sanitizedDiagnosis=await diagnose(sanitized,now,openedAt);
 assert.equal(sanitizedDiagnosis.phase,diagnosis.phase);assert.equal(sanitizedDiagnosis.failureCode,diagnosis.failureCode);assert.equal(sanitizedDiagnosis.eligibleCount,diagnosis.eligibleCount);assert.equal(sanitizedDiagnosis.checkableCount,diagnosis.checkableCount);assert.equal(sanitizedDiagnosis.endReadValidation.status,diagnosis.endReadValidation.status);assert.equal(sanitizedDiagnosis.endReadValidation.code,diagnosis.endReadValidation.code);
 const item={name:i?'P1-G-h001':'P1-F-B-h001',now,termination:'REJECTION_LIMIT',reason:'Repeated rejected availability action: AVAILABILITY_ALREADY_CHECKED',source:{path,sha256:createHash('sha256').update(bytes).digest('hex'),stateVersionBefore:last.stateVersionBefore,trajectoryStateHash:last.stateHashBefore,reconstruction:'Exact event-prefix replay; hash verified',openedAtBasis:i?'Recorded READ_END_WINDOW_OPENED timestamp':'Advancing-clock reproduction on exact state; old run predates reserve fix'},diagnosis,state:sanitized};output.push(item);
 console.log(JSON.stringify({name:item.name,stateVersionBefore:last.stateVersionBefore,hashMatched:true,diagnosis}));
}
await mkdir('src/application/fixtures',{recursive:true});
await writeFile('src/application/fixtures/p1-g2-h001-terminal-states.json',JSON.stringify({evidenceStatus:'exposed development evidence; sanitized structure/code fixture; no page text',states:output},null,2));
