// Review existing public developer D02 only; no private holdout contents.
import {mkdtemp,cp,copyFile,readFile,writeFile} from 'node:fs/promises';import {constants} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {createHash} from 'node:crypto';
import {reviewHoldoutAttempt} from '../../../src/eval/restaurant/agent-loop/g6/holdout-review.js';import type {HoldoutAttempt} from '../../../src/eval/restaurant/agent-loop/g6/holdout-checkpoint.js';
const slot=resolve('.eval-artifacts/phase3b/category-discovery-cost-20261110/runtime/D02/D02'),out=resolve('.eval-artifacts/phase3b/heldout-r2-preparation-20261110');
const review='/Users/wangzhour/Desktop/Wang/Git/review-D02-20261110.json';const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');const bytes=await readFile(review);
if(hash(bytes)!=='bacd63913c3d3c446e159bf4861bd11789110afa4f49dfec328817b4373c5c73')throw Error('D02_REVIEW_SHA_MISMATCH');
const tmp=await mkdtemp(join(tmpdir(),'praxis-D02-reviewed-recovery-')),key='D02';await cp(slot,join(tmp,key),{recursive:true});
// Recovery-2 is the already recorded valid evaluation, not a fabricated success.
for(const [source,dest]of [['evaluation.offline-recovery-2.json','evaluation.json'],['evaluation.offline-recovery-2.input.json','evaluation.input.json']])await copyFile(join(tmp,key,source!),join(tmp,key,dest!));
// Existing failure already contains the exact captured view/execution. The reader
// consumes its view under the canonical filename; bytes remain unchanged.
await copyFile(join(slot,'failure.json'),join(tmp,key,'execution.result.json'));
const attempt:HoldoutAttempt={id:'D02',key,repetition:1,path:tmp,status:'PENDING_REVIEW',environmentReplacement:false};
const result=await reviewHoldoutAttempt(attempt,{key,file:review},v=>v,()=>writeFile(join(out,'D02-review-receipt.json'),JSON.stringify(attempt,null,2)+'\n'));
for(const file of ['evaluation.supplement.json','evaluation.supplement.input.json'])await copyFile(join(tmp,key,file),join(slot,file),constants.COPYFILE_EXCL);
await writeFile(join(out,'D02-review-summary.json'),JSON.stringify({sourceEvaluation:'evaluation.offline-recovery-2.json',sourceSHA256:hash(await readFile(join(slot,'evaluation.offline-recovery-2.json'))),reviewSHA256:hash(bytes),verdict:result.verdict,rawFailureAndEarlierScoresPreserved:true,GET:0,models:0,Live:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result.verdict));
