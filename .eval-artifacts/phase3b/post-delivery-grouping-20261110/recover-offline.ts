// Existing public recordings only. No live transports; originals never overwritten.
import {readFile,writeFile,mkdtemp,cp,copyFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {constants} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {evaluateG6} from '../../../src/eval/restaurant/agent-loop/g6/evaluator.js';
import {reviewHoldoutAttempt} from '../../../src/eval/restaurant/agent-loop/g6/holdout-review.js';
import type {HoldoutAttempt} from '../../../src/eval/restaurant/agent-loop/g6/holdout-checkpoint.js';
const root=resolve('.eval-artifacts/phase3b/category-discovery-cost-20261110/runtime'),report=resolve('.eval-artifacts/phase3b/post-delivery-grouping-20261110');
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const reviewFile='/Users/wangzhour/Desktop/Wang/Git/review-D01-20261110.json';
if(hash(await readFile(reviewFile))!=='072ddab54056a3581b1ed7aef20ec08bae5be08ead3506a2ee751ca382641502')throw Error('REVIEW_HASH_MISMATCH');
// Reviewer declared a namespaced attempt key. Bind it to a byte-identical
// temporary copy of this D01 evidence, without editing the supplied review.
const reviewKey='D01-20261110',staging=await mkdtemp(join(tmpdir(),'praxis-d01-review-'));
await cp(join(root,'D01','D01'),join(staging,reviewKey),{recursive:true,errorOnExist:true});
const attempt:HoldoutAttempt={id:'D01',repetition:1,key:reviewKey,path:staging,status:'PENDING_REVIEW',environmentReplacement:false};
const first=await reviewHoldoutAttempt(attempt,{key:reviewKey,file:reviewFile},v=>v,()=>writeFile(join(report,'D01-review-receipt.json'),JSON.stringify(attempt,null,2)+'\n'));
for(const file of ['evaluation.supplement.json','evaluation.supplement.input.json'])await copyFile(join(staging,reviewKey,file),join(root,'D01','D01',file),constants.COPYFILE_EXCL);
const slot=join(root,'D02','D02'),bytes=await readFile(join(slot,'failure.evaluation.input.json')),input=JSON.parse(bytes.toString());
// Retain all product claims and both original AFTER records. Re-read the recorded
// body bytes and metadata to reject any mismatch before evaluation.
const refs=[];
for(const item of input.vacancy.filter((v:any)=>v.phase==='AFTER')){
 const body=await readFile(item.ref),metadata=JSON.parse(await readFile(item.ref+'.json','utf8'));
 if(hash(body)!==metadata.sha256||metadata.url!==item.url||JSON.stringify(JSON.parse(body.toString()))!==JSON.stringify(item.body))throw Error('RECORDED_POST_RESPONSE_MISMATCH');refs.push({ref:item.ref,sha256:hash(body),url:item.url});
}
if(refs.length!==2)throw Error('EXACTLY_TWO_RECORDED_POST_RESPONSES_EXPECTED');
const result=evaluateG6(input);
await writeFile(join(slot,'evaluation.offline-recovery.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
await writeFile(join(report,'recovery-provenance.json'),JSON.stringify({sourceInput:join(slot,'failure.evaluation.input.json'),sourceSHA256:hash(bytes),responseRefs:refs,noNewReads:true,noChangedClaims:true,newGET:0,newModels:0,newLive:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({D01:first.verdict,D02:result.verdict,notPassed:result.checks.filter(c=>c.status!=='PASS')},null,2));
