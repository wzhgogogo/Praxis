// Offline review of immutable copied source artifacts; no product/API transports.
import {readFile,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';import {join} from 'node:path';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {reviewHoldoutAttempt} from '../../../src/eval/restaurant/agent-loop/g6/holdout-review.ts';
const root=fileURLToPath(new URL('./07-r1-review/',import.meta.url)),key='p3b-holdout-07-r1',path=join(root,key),slot=join(path,key),original=await readFile(join(slot,'evaluation.json')),old=JSON.parse(original),annotation=JSON.parse(await readFile(join(root,'annotation-hash.json'),'utf8'));
assert.equal(createHash('sha256').update(await readFile(annotation.externalFile)).digest('hex'),annotation.sha256);
const attempt={id:'p3b-holdout-07',repetition:1,key,path,status:'PENDING_REVIEW',environmentReplacement:false};const save=()=>writeFile(join(root,'attempt-review-receipt.json'),JSON.stringify(attempt,null,2)+'\n');
const score=await reviewHoldoutAttempt(attempt,{key,file:annotation.externalFile},v=>v,save);assert.deepEqual(await readFile(join(slot,'evaluation.json')),original);
assert.equal(score.verdict.s0,0);assert.equal(score.verdict.qualified,true);assert.equal(score.verdict.outcome,'QUALIFIED_DELIVERY');assert.equal(score.verdict.stopBatch,false);
assert.deepEqual(score.checks.filter(c=>c.rule!=='COMPLETE_REQUEST_QUALIFICATION').map(c=>[c.rule,c.subject,c.status]),old.checks.filter(c=>c.rule!=='COMPLETE_REQUEST_QUALIFICATION').map(c=>[c.rule,c.subject,c.status]));
attempt.status='EVALUATED_BY_REVIEW';await save();console.log(JSON.stringify({verdict:score.verdict,annotationSHA256:annotation.sha256,originalEvaluationSHA256:createHash('sha256').update(original).digest('hex'),sourceEvidenceOnly:true}));
