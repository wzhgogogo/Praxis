import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ModelBrowserReadActionDecision} from '../../../src/infrastructure/browser/browser-action-decision.ts';
import {normalizeRestaurantAgentActionStrictWire} from '../../../src/domains/restaurant/agent-action.ts';
import {assessSelectionReplay} from '../../../src/eval/restaurant/agent-loop/selection-replay-assessment.ts';
const dir='.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021',prior='.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
globalThis.fetch=()=>{throw Error('CACHED_RESPONSE_REPLAY_NO_NETWORK');};
const freezeBytes=await fs.readFile(`${dir}/freeze.json`),freeze=JSON.parse(freezeBytes);for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`FROZEN_CHANGED:${p}`);
const comparison=await read(`${dir}/request-comparison.json`),calendar=[],selection=[];
for(const row of comparison.calendar){const p=await read(row.sourcePath),responsePath=`${prior}/model-results/${p.id}.json`,bytes=await fs.readFile(responsePath),before=JSON.parse(bytes);
 assert.equal(before.call.requestSha256,p.requestSha256);assert.equal(before.call.status,'SUCCEEDED');
 const action=await new ModelBrowserReadActionDecision({complete:async request=>{assert.equal(sha(JSON.stringify(request)),p.requestSha256);return before.rawResponse;}}).decide(p.input);
 const acceptable=action.type===p.expected.action&&action.targetRef===p.expected.targetRef;
 calendar.push({id:p.id,acceptable,action,requestSha256:p.requestSha256,recordedResponse:{path:responsePath,sha256:sha(bytes)},expected:p.expected,mode:'EXACT_REQUEST_CACHED_REAL_MODEL_RESPONSE',newModelCalls:0});
}
for(const input of await read(`${dir}/selection/prepared-inputs.json`)){const sourcePath=`.eval-artifacts/checkpoint-c-live-20261020/calendar-selected-state-20261021/model-results/${input.id}.json`,bytes=await fs.readFile(sourcePath),before=JSON.parse(bytes);assert.equal(before.call.requestSha256,input.requestSha256);const decoded=normalizeRestaurantAgentActionStrictWire(JSON.parse(before.rawResponse.outputText));assert.ok(decoded.valid);
 const assessment=assessSelectionReplay(decoded.value,input.context,input.outlets,input.annotation,input.rules,1000);
 selection.push({id:input.id,assessment,requestSha256:input.requestSha256,recordedResponse:{path:sourcePath,sha256:sha(bytes)},mode:'EXACT_REQUEST_CACHED_REAL_MODEL_RESPONSE',newModelCalls:0});
}
const result={schema:'criterion-presentation-regression@1',mode:'OFFLINE_EXACT_REQUEST_CACHED_REAL_MODEL_RESPONSE',freezeSha256:sha(freezeBytes),newModelCalls:0,websites:0,calendar:{passed:calendar.filter(r=>r.acceptable).length,total:69,required:68,rows:calendar},selection:{passed:selection.filter(r=>r.assessment.verdict==='ACCEPTABLE').length,total:5,rows:selection}};
result.status=result.calendar.passed>=68&&result.selection.passed===5?'PASS':'FAIL';
await fs.writeFile(`${dir}/regression-results.json`,JSON.stringify(result,null,2),{flag:'wx'});assert.equal(result.status,'PASS');console.log(JSON.stringify({status:result.status,calendar:result.calendar.passed,selection:result.selection.passed,newModelCalls:0}));
