import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {captureHardEvidence} from '../hard-evidence-capture.mjs';
import {loadHardCriterionEvidence} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-hard.ts';
import {sha,base} from '../freeze.mjs';
const inputs=JSON.parse(fs.readFileSync(`${base}/c18-bidirectional-acceptance-20261022/c18-inputs.json`)),r=inputs.runs.find(r=>r.runId==='c-17'),bytes=fs.readFileSync(r.artifactPath),artifact=JSON.parse(bytes);assert.equal(sha(bytes),r.artifactSha256);
const dir=fs.mkdtempSync(`${base}/capture-control-`);
try{
 fs.symlinkSync(path.resolve(r.attempt,'recordings'),path.resolve(dir,'recordings'),'dir');
 const p=captureHardEvidence({artifact,artifactSha256:r.artifactSha256,directory:path.resolve(dir),registryPath:`${base}/checkpoint-c-rerun-20261021/registry.certified.json`,stem:'green'}),loaded=loadHardCriterionEvidence(p,r.artifactSha256);
 assert.ok(loaded.snapshots.length>0);assert.equal(loaded.artifactSha256,r.artifactSha256);
 const bad=structuredClone(artifact);bad.diagnostics.browserTrace.filter(t=>t.kind==='SNAPSHOT').forEach(t=>t.detail.htmlSha256='0'.repeat(64));
 assert.throws(()=>captureHardEvidence({artifact:bad,artifactSha256:r.artifactSha256,directory:path.resolve(dir),stem:'red'}),/HARD_SNAPSHOT_EXECUTION_BINDING_MISMATCH/);
 console.log(JSON.stringify({status:'PASS',savedSnapshotBindings:loaded.snapshots.length,wrongRuntimeHashRejected:true,models:0,websites:0}));
}finally{fs.rmSync(dir,{recursive:true});}
