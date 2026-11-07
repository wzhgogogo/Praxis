import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {sourceReadSuggestionOptions} from './source-read-check.js';

const root=resolve('.eval-artifacts/phase3b/tablecheck-destination-20261107');
// Exposed source2026-11-07 frozen93965f14. Component controls/DOM/HTTP metadata only;
// no website, model or synthetic response; does not establish post-selection routing or identity.
test('real TableCheck observation chooses the sole exact full-name action, excluding branches and listbox',async()=>{
 const spec=JSON.parse(await readFile(root+'/source-read-spec.json','utf8'));
 const recording=JSON.parse(await readFile(root+'/runtime/source-read/recording/recording.json','utf8'));
 const controls=recording.entries.filter((e:any)=>e.kind==='CONTROLS').at(-1).detail.controls;
 const html=await readFile(root+'/runtime/source-read/recording/diagnostic/snapshot-0003.html','utf8');assert.ok(html.includes(spec.query));
 const options=sourceReadSuggestionOptions(controls,spec.query,{documentOrigins:[],staticResources:[],dynamicReads:[]});
 assert.equal(options.length,1);assert.equal(options[0]?.kind,'BUTTON');assert.equal(options[0]?.role,'option');assert.equal(options[0]?.label,spec.query);
});

test('recorded destination is admitted with authoritative name while full Replay privacy gaps remain explicit',async()=>{
 const spec=JSON.parse(await readFile(root+'/source-read-spec.json','utf8'));
 const recording=JSON.parse(await readFile(root+'/runtime/source-read/recording/recording.json','utf8'));
 const requests=recording.entries.filter((e:any)=>e.kind==='NETWORK').flatMap((e:any)=>e.detail);
 const named=requests.find((r:any)=>r.method==='GET'&&r.outcome==='ADMITTED'&&r.queryKeys.includes('name'));
 assert.equal(named.queryValues.find((f:any)=>f.queryKey==='destination').valueClass,'NAMESPACED_TOKEN');assert.equal(named.queryValues.find((f:any)=>f.queryKey==='name').valueClass,'EQUALS_AUTHORITATIVE_INPUT');
 const wire=JSON.parse(await readFile(root+'/runtime/source-read/header-names.json','utf8'));
 const authorityHash=createHash('sha256').update(spec.query.normalize('NFKC').trim().toLowerCase()).digest('hex');
 for(const key of ['q','name']){const request=wire.find((r:any)=>r.pathname==='/search/'&&r.queryKeys.includes(key));assert.equal(request.status,200);assert.equal(request.queryValueHashes.find((f:any)=>f.key===key).normalizedValueSha256,authorityHash);}
 assert.equal(recording.replay.status,'NOT_REPLAYABLE');assert.equal(recording.replay.reason,'UNCAPTURED_DYNAMIC_RESPONSE');
 assert.ok(recording.entries.some((e:any)=>e.kind==='RESPONSE_OMITTED'&&e.detail.pathname==='/catalog.json'&&e.detail.reason==='JSON_SENSITIVE_KEY'));
 assert.ok(recording.entries.some((e:any)=>e.kind==='RESPONSE_OMITTED'&&e.detail.reason==='JSON_SIZE_LIMIT'));
 assert.equal(recording.componentCapture.scope,'SANITIZED_NON_DOCUMENT_RESPONSES_ONLY');assert.ok((await stat(root+'/runtime/source-read/recording/'+recording.componentCapture.harPath)).size>0);
});
