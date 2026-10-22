import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {loadHardCriterionEvidence} from '../../../src/eval/restaurant/agent-loop/diagnostic-evaluator-hard.ts';
import {applyTableCheckReview} from '../tablecheck-post-review.mjs';
const base='.eval-artifacts/checkpoint-c-live-20261020',dir=`${base}/c18-offline-reassessment-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const put=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
let externalCalls=0;globalThis.fetch=()=>{externalCalls++;throw Error('OFFLINE_REASSESSMENT_NO_NETWORK_OR_MODEL');};
const freezeBytes=await fs.readFile(`${dir}/reassessment-freeze.json`),freeze=JSON.parse(freezeBytes),inputs=await read(`${dir}/c18-inputs.json`);
const verify=async()=>{for(const[p,h]of Object.entries(freeze.files))assert.equal(sha(await fs.readFile(p)),h,`INPUT_CHANGED:${p}`);};await verify();
await put(`${dir}/reassessment-started.json`,{mode:'OFFLINE_REEVALUATION_OF_SAVED_C18',at:new Date().toISOString(),freezeSha256:sha(freezeBytes),sourceCommit:freeze.codeCommit,source31Commit:freeze.evaluator31Commit,newModels:0,newWebsites:0,newLiveRuns:0});
async function version(root){
 const load=async name=>import(pathToFileURL(path.resolve(root,'src/eval/restaurant/agent-loop',name+'.ts')).href);
 const [e,g,w,n,c]=await Promise.all(['diagnostic-evaluator','diagnostic-evaluator-grounding','diagnostic-evaluator-witness','diagnostic-evaluator-network','criterion-correspondence'].map(load));
 return{evaluate:e.evaluateRestaurantHybridLiveArtifact,loadPost:g.loadPostDeliveryTabelogObservation,loadWitness:w.loadWitnessOracle,parseReads:n.parseReviewedReads,loadCorrespondences:c.loadCriterionCorrespondences};
}
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'c18-evaluator31-'));
try{
 const archive=execFileSync('git',['archive',freeze.evaluator31Commit,'src','package.json'],{maxBuffer:128*1024*1024});execFileSync('tar',['-x','-C',temporary],{input:archive});
 await fs.symlink(path.join(process.cwd(),'node_modules'),path.join(temporary,'node_modules'),'dir');await fs.symlink(path.join(process.cwd(),'.eval-artifacts'),path.join(temporary,'.eval-artifacts'),'dir');
 const versions={31:await version(temporary),32:await version(process.cwd())};
 const rows=[];for(const v of ['31','32']){
  const api=versions[v],out=`${dir}/evaluations-${v}`;await fs.mkdir(out);
  for(const row of inputs.runs){
   const bytes=await fs.readFile(row.artifactPath);assert.equal(sha(bytes),row.artifactSha256);const a=JSON.parse(bytes),post=await read(`${row.attempt}/post-run/post-check.json`),gaps=[];
   const postDelivery=[];for(const r of post.rows.filter(r=>r.raw?.status===200)){try{postDelivery.push(api.loadPost(r.raw.metadataPath,r.raw.bodyPath));}catch{gaps.push('Original successful post-response failed local SHA/parser verification');}}
   let witnessOracle;if(post.manifestPath){try{witnessOracle=api.loadWitness({manifestPath:post.manifestPath,registryPath:`${base}/checkpoint-c-rerun-20261021/registry.certified.json`,variantId:row.caseId,artifactSha256:row.artifactSha256});}catch{gaps.push('Original witness manifest failed local verification');}}
   let outer=[];try{outer=(await fs.readFile(`${row.attempt}/outer-observations.jsonl`,'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse);}catch(e){if(e.code!=='ENOENT')throw e;}
   const orchestration=(await read(`${row.attempt}/finish.json`)).orchestration;
   const reviewedPath=`${base}/reviewed-reads.json`,options={criterionCorrespondences:api.loadCorrespondences(path.resolve('src/eval/restaurant/agent-loop/cases/criterion-correspondences.json')),reviewedReads:api.parseReads(await fs.readFile(reviewedPath),path.resolve(reviewedPath)),postDeliveryTabelog:postDelivery,trace:[...(a.diagnostics?.browserTrace??[]),...outer],orchestration,...(witnessOracle?{witnessOracle}:{}),...(v==='32'?{hardEvidence:loadHardCriterionEvidence(`${dir}/hard-evidence.json`,row.artifactSha256)}:{})};
   const raw=api.evaluate(a,{path:path.resolve(row.artifactPath),sha256:row.artifactSha256},options),evaluation=applyTableCheckReview(raw,post.rows);
   assert.ok(evaluation.evaluatorVersion.endsWith('@'+v));assert.ok(evaluation.rubricVersion.endsWith(v==='31'?'@27':'@28'));
   const output=`${out}/${row.runId}.evaluation.json`;
   await put(output,{...evaluation,offlineReassessment:{mode:'OFFLINE_REEVALUATION_OF_SAVED_LIVE',sourceArtifact:row.artifactPath,sourceArtifactSha256:row.artifactSha256,inputFreezeSha256:sha(freezeBytes),newModels:0,newWebsites:0,newLiveRuns:0,postEvidenceGaps:gaps}});
   rows.push({runId:row.runId,version:v,path:output,sha256:sha(await fs.readFile(output)),outcome:evaluation.outcome.type});
   console.log(JSON.stringify({run:row.runId,evaluator:v,outcome:evaluation.outcome.type}));
  }
 }
 await put(`${dir}/automatic-reassessment-results.json`,{status:'AUTOMATIC_OUTPUTS_RETAINED_BEFORE_ORIGINAL_COMPARISON',freezeSha256:sha(freezeBytes),rows,newModels:0,newWebsites:0,newLiveRuns:0});
 const comparisons=[];for(const input of inputs.runs){
  const originalBytes=await fs.readFile(input.originalEvaluationPath);assert.equal(sha(originalBytes),input.originalEvaluationSha256);const original=JSON.parse(originalBytes);
  const variants=[];for(const v of ['31','32']){const row=rows.find(r=>r.runId===input.runId&&r.version===v),evaluation=await read(row.path);variants.push({...row,evaluation});}
  comparisons.push({run:input,original:{path:input.originalEvaluationPath,sha256:sha(originalBytes),evaluation:original},variants});
 }
 assert.equal(externalCalls,0);await verify();
 await put(`${dir}/three-way-comparison.json`,{mode:'OFFLINE_REEVALUATION_OF_SAVED_LIVE',status:'PENDING_INDEPENDENT_REVIEW',sourceC18Runs:18,newModels:0,newWebsites:0,newGoogle:0,newLiveRuns:0,freezeSha256:sha(freezeBytes),rows:comparisons});
 await put(`${dir}/reassessment-finished.json`,{status:'COMPLETED',at:new Date().toISOString(),savedRuns:18,newEvaluations:36,frozenFilesVerified:Object.keys(freeze.files).length,newModels:0,newWebsites:0,newGoogle:0,newLiveRuns:0,externalCalls});
}finally{await fs.rm(temporary,{recursive:true,force:true});}
