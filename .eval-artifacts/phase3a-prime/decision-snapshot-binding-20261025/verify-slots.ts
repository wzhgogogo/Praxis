import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHybridDecisionCapture} from '../../../src/eval/restaurant/agent-loop/runners/run-hybrid-live-read.js';
import {BrowserReadRecording} from '../../../src/eval/restaurant/agent-loop/runners/browser-read-recording.js';
import type {ModelRequest} from '../../../src/core/model/contracts.js';
const here=dirname(fileURLToPath(import.meta.url)),output=resolve(process.argv[2]!);
assert.ok(output.startsWith(here+'/'));await mkdir(output,{recursive:false});const results=[];
for(const slot of [1,2,3]){
 const original=JSON.parse(await readFile(resolve(here,'inputs',`slot-${slot}-decision.json`),'utf8'));
 const recording=new BrowserReadRecording({directory:output,runId:`slot-${slot}-no-dom`});
 const capture=createHybridDecisionCapture(resolve(output,`slot-${slot}.result.json`),recording);
 const request:ModelRequest={taskId:`offline-slot-${slot}`,purpose:original.purpose,promptVersion:original.promptVersion,messages:original.messages,outputSchema:original.outputSchema,responseFormat:original.responseFormat,timeoutMs:1000,fallback:'FAIL_CLOSED'};
 await capture.complete(request,async()=>({invocationId:'offline-capture',provider:'FIXTURE',model:'no-model-transport',outputText:original.outputText,finishReason:original.finishReason,latencyMs:0}));
 const metadata=await capture.finish(),row=JSON.parse((await readFile(metadata.path,'utf8')).trim());
 assert.deepEqual(metadata.errors,[]);assert.deepEqual(row.messages,original.messages);
 assert.equal(row.browser.recordingSnapshot,null);assert.equal(row.browser.observationKind,'SOURCE_FLOW_ENTRANCE_SELECTION');
 const context=JSON.parse(original.messages.find((message:any)=>message.role==='user').content);
 assert.equal(row.browser.sourceFlow.flowId,context.regionCorrection.flowId);assert.equal(row.browser.sourceFlow.entrances.length,context.regionCorrection.entrances.length);
 const saved=await recording.finish();const manifest=JSON.parse(await readFile(resolve(saved.path,'recording.json'),'utf8'));
 assert.equal(manifest.documents.length,0,'no DOM is invented for this decision');
 results.push({slot,originalSequence:original.sequence,metadata,binding:row.browser,modelTransportCalls:0,recordedDomDocuments:0});
}
await writeFile(resolve(output,'verification.json'),JSON.stringify({status:'PASS',contamination:'PROMPT_AND_RESULT_EXPOSED',results},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PASS',slots:results.length,realCalls:0}));
