import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseAllDocuments} from 'yaml';
const base='.eval-artifacts/checkpoint-c-live-20261020',source=`${base}/holdout-exit-20261022/continuation-20261022`,previous=`${source}/evaluation-20261022`,dir=`${previous}/case05-reassessment-20261022`;
const sha=b=>createHash('sha256').update(b).digest('hex'),read=async p=>JSON.parse(await fs.readFile(p));
const reviewPath=`${previous}/independent-review.md`,reviewBytes=await fs.readFile(reviewPath),reviewSha256=sha(reviewBytes);
assert.equal(sha(execFileSync('git',['show',`19941c4e:${reviewPath}`])),reviewSha256);
const goldPath='.eval-artifacts/phase2-holdout/holdout.yaml',goldBytes=await fs.readFile(goldPath);
assert.equal(sha(goldBytes),'cb0efa949f21fc0c19c7a6fd48e6a51c1848bb722c795b0ccd51213c43ecb98e');
const documents=parseAllDocuments(goldBytes.toString(),{uniqueKeys:true});assert.ok(documents.every(d=>!d.errors.length));
const gold=documents.map(d=>d.toJS()).find(d=>d?.id==='p2-holdout-05');assert.ok(gold);
const oldInputs=await read(`${previous}/inputs.json`),rows=[];
for(const input of oldInputs.runs.filter(r=>r.run.caseId==='p2-holdout-05')){
 const bytes=await fs.readFile(input.originalArtifactPath);assert.equal(sha(bytes),input.originalArtifactSha256);const a=JSON.parse(bytes),originalCase=a.materializedCase;
 const originalValue=originalCase.acceptance.required_claims[1];assert.deepEqual(originalValue,gold.acceptance.required_claims[1]);
 assert.ok(originalValue&&typeof originalValue==='object'&&!Array.isArray(originalValue));
 const keys=Object.keys(originalValue);assert.equal(keys.length,1);const key=keys[0],value=originalValue[key];assert.equal(typeof value,'string');
 const recovered=`${key}: ${value}`;assert.deepEqual({[recovered.slice(0,key.length)]:recovered.slice(key.length+2)},originalValue);
 const corrected=structuredClone(originalCase);corrected.acceptance.required_claims[1]=recovered;
 const restored=structuredClone(corrected);restored.acceptance.required_claims[1]=originalValue;assert.deepEqual(restored,originalCase);
 rows.push({...input,previousEvaluationPath:`${previous}/evaluations-33/${input.run.runId}.evaluation.json`,previousEvaluationSha256:sha(await fs.readFile(`${previous}/evaluations-33/${input.run.runId}.evaluation.json`)),
  correction:{artifactSha256:input.originalArtifactSha256,rev1Sha256:sha(JSON.stringify(originalCase)),rev2Sha256:sha(JSON.stringify(corrected)),refs:[`${reviewPath}#sha256=${reviewSha256}`,`${dir}/inputs.json#original-artifact-sha256=${input.originalArtifactSha256}`],materializedCase:corrected},
  recovery:{pointer:'/materializedCase/acceptance/required_claims/1',before:originalValue,after:recovered,keyLength:key.length,roundTrip:'PASS',onlyDifference:'single-key object restored to verbatim key + colon-space + string value; semantic criteria and acceptance contents unchanged'}});
}
assert.deepEqual(rows.map(r=>r.run.runId),['h-05','h-11','h-17']);
await fs.writeFile(`${dir}/inputs.json`,JSON.stringify({schema:'holdout-approved-lossless-format-recovery@1',status:'frozen regression; original artifact scoped',reviewPath,reviewSha256,goldPath,goldSha256:sha(goldBytes),previousInputPath:`${previous}/inputs.json`,rows},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({artifacts:rows.length,roundTrip:'PASS',onlyField:'/materializedCase/acceptance/required_claims/1',goldSha256Unchanged:sha(goldBytes),newModels:0,newWebsites:0,newLive:0}));
