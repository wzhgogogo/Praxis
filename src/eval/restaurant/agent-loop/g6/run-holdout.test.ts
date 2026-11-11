import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseHoldoutReviews} from './run-holdout.js';
test('repeated --review retains every independently keyed annotation file',()=>{
 const args=['--resume','fictional-output'];for(let i=0;i<7;i++)args.push('--review','fixture-'+i,'/external/review-'+i+'.json');
 assert.deepEqual(parseHoldoutReviews(args),Array.from({length:7},(_,i)=>({key:'fixture-'+i,file:'/external/review-'+i+'.json'})));
 for(const bad of [['--review','x','f'],['--resume','r','--review','x'],['--resume','r','--review','x','--other'],['--resume','r','--review','x','f','--review','x','g']])assert.throws(()=>parseHoldoutReviews(bad),/HOLDOUT_REVIEW_ARGUMENTS_INVALID/);
});
