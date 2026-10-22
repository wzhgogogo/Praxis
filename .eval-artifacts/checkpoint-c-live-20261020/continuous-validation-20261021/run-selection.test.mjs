import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {executionRuns} from '../run-selection.mjs';
const plan=JSON.parse(readFileSync('.eval-artifacts/checkpoint-c-live-20261020/plan.json','utf8'));
test('quick selection executes exactly the approved three original run objects in plan order',()=>{
 const original=JSON.stringify(plan);
 for(const offline of [false,true]){
  const selected=executionRuns(plan,{runIds:'c-05,c-01,c-02',offline});
  assert.deepEqual(selected.map(run=>run.runId),['c-01','c-02','c-05']);
  assert.deepEqual(selected.map(run=>run.caseId),['p2l-kf-h001-20261103','p2l-kf-h002-20261107','p2l-kagurazaka-kaiseki-20261105']);
  for(const run of selected)assert.equal(run,plan.runs.find(row=>row.runId===run.runId));
 }
 assert.equal(JSON.stringify(plan),original);
});
test('no parameter retains original 18-run Live, one-run rehearsal and historical resume branches',()=>{
 assert.equal(executionRuns(plan),plan.runs);
 assert.equal(executionRuns(plan,{offline:false}).length,18);
 assert.deepEqual(executionRuns(plan,{offline:true}),plan.runs.slice(0,1));
 const resume={runs:plan.runs.slice(2)};assert.equal(executionRuns(plan,{resume}),resume.runs);
});
test('unknown, duplicate, empty, nonapproved subset and resume combination fail before transport',()=>{
 for(const [runIds,error] of [['c-01,c-02,c-99',/UNKNOWN_RUN_ID/],['c-01,c-02,c-05,c-01',/DUPLICATE_RUN_ID/],['',/EMPTY_RUN_ID/],['c-01,,c-05',/EMPTY_RUN_ID/],['c-01,c-02,c-03',/ONLY_APPROVED/]])assert.throws(()=>executionRuns(plan,{runIds}),error);
 assert.throws(()=>executionRuns(plan,{runIds:'c-01,c-02,c-05',resume:{runs:[]}}),/CANNOT_COMBINE/);
});
