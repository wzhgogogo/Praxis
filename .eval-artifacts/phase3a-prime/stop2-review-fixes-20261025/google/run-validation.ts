import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir,readFile,writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createReplayFixture,executeReplayFixture,replayDelivery } from "../../../../src/harness/browser/fixtures/replay-scenario.js";
const root=resolve('.eval-artifacts/phase3a-prime/stop2-review-fixes-20261025/google'),mode=process.argv[2];
if(mode==='prepare'){
 const fixture=await createReplayFixture(resolve(root,'original'));
 const har=JSON.parse(Buffer.from(fixture.bundle.files['recording/replay.har']!,'base64').toString());
 const raw=JSON.stringify(har);assert.ok(!raw.includes('fixture-only'));assert.ok(!raw.includes('X-Goog-Api-Key'));
 const google=har.log.entries.filter((e:any)=>new URL(e.request.url).hostname.endsWith('googleapis.com'));assert.ok(google.length>0);
 assert.ok(google.every((e:any)=>e.request.headers.length===0&&e.request.postData?.text&&JSON.parse(e.response.content.text).places));
 await writeFile(resolve(root,'automatic-capture-proof.json'),JSON.stringify({manualHarAppend:false,googleEntries:google.length,containsFixtureApiKey:false,containsApiKeyHeader:false,capturedRequestBodiesPresent:true},null,2)+'\n');
 await writeFile(resolve(root,'bundle.json'),JSON.stringify(fixture.bundle));
 await writeFile(resolve(root,'expected-delivery.json'),JSON.stringify(replayDelivery(fixture.original.artifact),null,2)+'\n');
 const files=Object.fromEntries(['bundle.json','expected-delivery.json'].map(file=>[file,'']));
 for(const file of Object.keys(files))files[file]=createHash('sha256').update(await readFile(resolve(root,file))).digest('hex');
 await writeFile(resolve(root,'replay-input-freeze.json'),JSON.stringify({status:'frozen synthetic replay seed; no historical run copied',files},null,2)+'\n');
 console.log('PREPARED',files);
}else if(mode==='replay'){
 const freeze=JSON.parse(await readFile(resolve(root,'replay-input-freeze.json'),'utf8'));
 for(const [file,hash] of Object.entries(freeze.files))assert.equal(createHash('sha256').update(await readFile(resolve(root,file))).digest('hex'),hash);
 const output=resolve(root,'validation');await mkdir(output,{recursive:true});
 const bundle=JSON.parse(await readFile(resolve(root,'bundle.json'),'utf8')),expected=JSON.parse(await readFile(resolve(root,'expected-delivery.json'),'utf8'));
 const rows=[];
 for(const kind of ['complete','missing','partial','model-wiring'] as const){
  const start=performance.now(),result=await executeReplayFixture(bundle,kind,output);
  if(kind==='complete'||kind==='model-wiring'){
   assert.equal(result.summary.status,'COMPLETED');assert.deepEqual(replayDelivery(result.artifact),expected);
   assert.equal(result.evaluation.severity.S0_DECLARATION.status,'ABSENT');assert.equal(result.evaluation.severity.S0_BOUNDARY.status,'ABSENT');
  }else{
   assert.equal(result.summary.status,'REPLAY_INCOMPLETE');assert.ok(result.evaluation.findings.every((r:any)=>r.status==='NOT_EVALUATED'));
   if(kind==='partial'){assert.equal(result.summary.stop.snapshot,3);assert.equal(result.summary.consumedPages,2);}
  }
  assert.equal(result.evaluation.outcome.capabilityDenominator,'EXCLUDED');assert.equal(result.networkAttempts,0);assert.equal(result.realModelCalls,0);
  await writeFile(resolve(output,kind+'.json'),JSON.stringify(result,null,2)+'\n');
  rows.push({kind,elapsedSeconds:(performance.now()-start)/1000,status:result.summary.status,stop:result.summary.stop,consumedPages:result.summary.consumedPages,modelTransportCalls:result.summary.modelTransportCalls,realModelCalls:0,networkAttempts:0,networkPolicy:result.networkPolicy});
 }
 const stamp=new Date(Date.now()+3_600_000).toISOString().slice(0,19).replace('T',' ')+' CET';
 await writeFile(resolve(output,'summary.json'),JSON.stringify({status:'PASS',testedCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),finishedAt:stamp,timezone:'CET UTC+01:00',rows,realModelCalls:0,googleCalls:0,websiteCalls:0,liveRuns:0},null,2)+'\n');
 console.log('PASS',JSON.stringify(rows));
}else throw new Error('Usage: run-validation.ts prepare|replay');
