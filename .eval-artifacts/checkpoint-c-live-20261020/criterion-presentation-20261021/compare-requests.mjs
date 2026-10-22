import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const dir='.eval-artifacts/checkpoint-c-live-20261020/criterion-presentation-20261021',prior='.eval-artifacts/checkpoint-c-live-20261020/tabelog-query-binding-20261021';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const summary=await read(`${dir}/prepared/summary.json`),rows=[];
assert.equal(summary.rows.length,69);
for(const row of summary.rows){const p=`${dir}/prepared/${row.id}.json`,beforePath=`${prior}/prepared/${row.id}.json`,current=await read(p),beforeBytes=await fs.readFile(beforePath),before=JSON.parse(beforeBytes);
 assert.deepEqual(current.request,before.request,`CHANGED_CALENDAR_REQUEST:${row.id}`);assert.deepEqual(current.input,before.input,`CHANGED_CALENDAR_INPUT:${row.id}`);assert.deepEqual(current.expected,before.expected);
 rows.push({id:row.id,currentRequestSha256:current.requestSha256,sourcePath:beforePath,sourceSha256:sha(beforeBytes),sameRequest:true,sameInput:true,sameOracle:true,referenceAudit:current.referenceAudit,sourceRequests:0,modelCalls:0});
}
const selected=await read(`${dir}/selection/prepared-inputs.json`),old=await read(`${prior}/prepared/selection.json`),selection=[];
assert.equal(selected.length,5);
for(const input of selected){const before=old.find(row=>row.id===input.id);assert.deepEqual(input.request,before.request,`CHANGED_SELECTION_REQUEST:${input.id}`);assert.deepEqual(input.context,before.context);selection.push({id:input.id,requestSha256:input.requestSha256,sameRequest:true,reconstruction:input.reconstruction});}
await fs.writeFile(`${dir}/request-comparison.json`,JSON.stringify({status:'EXACT_SAME_REQUESTS',calendar:rows,selection,sourceRequests:0,newModelCalls:0,reason:'Current DOM observation/prompt and current Reducer/Context requests exactly equal the accepted requests. Reuse frozen real-model responses; no inference about new Live behavior.'},null,2),{flag:'wx'});
// Exact bytes already exist at each SHA-verified sourcePath. Preserve the new
// reconstruction audit rather than duplicating 69 identical large requests.
for(const row of summary.rows)await fs.rm(`${dir}/prepared/${row.id}.json`);
await fs.rm(`${dir}/prepared/selection.json`);
console.log(JSON.stringify({calendar:69,selection:5,changedRequests:0,modelCalls:0,websites:0}));
