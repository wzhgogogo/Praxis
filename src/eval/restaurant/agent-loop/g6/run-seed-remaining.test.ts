import {test} from 'node:test';import assert from 'node:assert/strict';
import {developmentReviewOnly,d02vSpec} from './run-seed-remaining.js';
import type {G6Evaluation} from './evaluator.js';
test('development continuation preserves evaluation; only missing qualification/G1 may continue',()=>{
 const e={verdict:{s0:0},checks:[{rule:'COMPLETE_REQUEST_QUALIFICATION',status:'NOT_EVALUATED',reviewReason:'INDEPENDENT_QUALIFICATION_ANNOTATION_MISSING'},{rule:'G1_NOT_STATED',status:'NOT_EVALUATED'}]}as G6Evaluation;
 assert.equal(developmentReviewOnly(e),true);assert.equal(e.checks[1]!.status,'NOT_EVALUATED');
 assert.equal(developmentReviewOnly({...e,verdict:{...e.verdict,s0:1}}),false);
 assert.equal(developmentReviewOnly({...e,checks:[...e.checks,{rule:'REQUEST_BOUNDARY',status:'NOT_EVALUATED'}]}as G6Evaluation),false);
 assert.equal(developmentReviewOnly({...e,checks:[{rule:'G1_NOT_STATED',status:'FAIL'}]}as G6Evaluation),false);
});
test('public user D02-V definition remains exact',()=>{const s=d02vSpec('fixture');assert.equal(s.request,'Looking for a robatayaki place near Nakano for 8 people on Thursday, December 10 at 8:30 PM.');assert.deepEqual(s.oracle.request.dates,['2026-12-10']);assert.equal(s.oracle.request.partySize,8);assert.equal(s.oracle.request.time,'20:30');assert.equal(s.witness!.detailUrl,'https://tabelog.com/en/tokyo/A1319/A131902/13309182/');});
