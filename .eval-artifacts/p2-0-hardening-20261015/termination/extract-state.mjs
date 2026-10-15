import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import {restaurantBookingTaskDefinition as definition} from '../../../src/domains/restaurant/task-definition.ts';
import {restaurantAvailabilityRequestFingerprint,restaurantSearchIntentFingerprint} from '../../../src/domains/restaurant/contracts.ts';
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

const path='/Users/wangzhour/.codex/worktrees/p1-g2-live/Praxis-Zhixing/.eval-artifacts/restaurant-hybrid-live-read/2026-10-15T08-00-36-360Z-d808d9f3-cedd-4c2e-aa43-bc70362ef61d.result.json';
const bytes=await readFile(path); const artifact=JSON.parse(bytes); const target=artifact.trajectories.find(s=>s.stepNumber===7);
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
let state=definition.create({}, {taskId:'fixture',runId:'fixture',now:target.occurredAt,createId:p=>p});
for(const entry of artifact.events.slice(0,target.stateVersionBefore)) state=definition.transition(state,entry.event,{taskId:entry.taskId,runId:entry.trace.runId,now:entry.occurredAt,createId:p=>p}).state;
assert.equal(hash(state),target.stateHashBefore);
const item={name:'P1-G2-h001-after-step-6',now:target.occurredAt,reason:'Shared browser model budget exhausted',source:{path,sha256:hash(bytes.toString()),rawSha256:createHash('sha256').update(bytes).digest('hex'),stateVersionBefore:target.stateVersionBefore,trajectoryStateHash:target.stateHashBefore,reconstruction:'Exact event-prefix replay; hash verified'},state:sanitize(state)};
await writeFile('src/application/fixtures/p2-0-h001-exhausted-state.json',JSON.stringify(item,null,2));
console.log(JSON.stringify({source:item.source,phase:state.phase,failure:state.failure?.code,candidates:state.candidates.length}));
