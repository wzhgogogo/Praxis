import test from 'node:test';
import assert from 'node:assert/strict';
import {nextAction} from './policy.mjs';
const plan={minGapMs:300000,cooldownMs:900000,maxRerunsPerCase:1,maxTotalReruns:10};
test('unassessed TableCheck claim continues while S0 PRESENT still stops immediately',()=>{
 assert.equal(nextAction({classification:'QUALIFIED_DELIVERY',unknownSafety:true},plan).action,'CONTINUE');
 assert.equal(nextAction({s0:true,unknownSafety:true},plan).action,'STOP_BATCH');
});

import {readFileSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {reviewedTableCheckRequest,parseTableCheckRecheck,saveTableCheckResponse,recheckTableCheck,applyTableCheckReview} from './tablecheck-post-review.mjs';
import {checkStageBudget} from './policy.mjs';
const base='.eval-artifacts/checkpoint-c-live-20261020';
const rules=JSON.parse(readFileSync(base+'/reviewed-reads.json','utf8'));
const bytes=readFileSync(base+'/reviewed-reads.json');
const hash=(v:any)=>createHash('sha256').update(v).digest('hex');
const body='{ "locale":"en", "start_at":"2026-11-05", "shop_id":"PUBLIC_SHOP_ID", "num_people":"3" }';
const request={url:'https://production.tablecheck.com/v2/hub/availability_calendar_v2',method:'POST',resourceType:'fetch',contentType:'application/json',body,guardAdmitted:true};
const html='<a href="https://www.tablecheck.com/en/shops/kagurazaka-jin/reserve?start_date=2026-11-05&amp;start_time=19:30&amp;num_people=3">19:30</a>';
const expectation={candidateSlug:'kagurazaka-jin',date:'2026-11-05',partySize:3,times:['19:30']};
test('only actual Guard-admitted frozen public grammar can be independently replayed',()=>{
 assert.equal(reviewedTableCheckRequest(request,rules),true);
 for(const change of [{guardAdmitted:false},{body:JSON.stringify({...JSON.parse(body),email:'FORBIDDEN'})},{method:'DELETE'},{url:request.url+'?secret=1'}])assert.equal(reviewedTableCheckRequest({...request,...change},rules),false);
});
test('independent parser requires explicit same-outlet/date/party/time links; failure/null is unknown',()=>{
 assert.equal(parseTableCheckRecheck(Buffer.from(html),expectation).status,'SUPPORTED');
 for(const wrong of [html.replace('19:30</a>','18:00</a>'),html.replace('2026-11-05','2026-11-10'),html.replace('num_people=3','num_people=2'),'{"status":"failure","data":null}','{"status":"success","data":{"available":true}}'])assert.equal(parseTableCheckRecheck(Buffer.from(wrong),expectation).status,'NOT_EVALUATED');
});
test('approved replay retains identical method/URL/body and independent original/recheck raw SHAs',async()=>{
 const directory=mkdtempSync(base+'/tc-control-');try{
  const original=saveTableCheckResponse(resolve(directory,'tablecheck-source'),{contextUrl:'https://www.tablecheck.com/en/shops/kagurazaka-jin/reserve',url:request.url,request,replayable:true,requestSha256:hash(body),reviewedReadsSha256:hash(bytes)},Buffer.from('original response'));
  const candidate={restaurant:{id:'candidate',sourceIds:{tablecheck:'shops/kagurazaka-jin'}}};
  const artifact={materializedCase:{semantic:{date:{value:'2026-11-05'},party_size:3}},finalSnapshot:{domainState:{availability:{candidate:[{source:'TABLECHECK',dateTime:'2026-11-05T19:30:00+09:00'}]}}}};
  let calls=0;const row=await recheckTableCheck(candidate,artifact,resolve(directory,'post'),directory,async(url:any,init:any)=>{calls++;assert.equal(url,request.url);assert.equal(init.method,'POST');assert.equal(init.body,body);assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');return new Response(html,{status:200});});
  assert.equal(calls,1);assert.equal(row.status,'SUPPORTED');assert.ok('recheck' in row);assert.equal(row.rawEvidence[0].sha256,original.sha256);assert.equal(row.recheck.sha256,hash(Buffer.from(html)));assert.ok(existsSync(row.recheck.bodyPath));
 }finally{rmSync(directory,{recursive:true});}
});
test('unreviewed inventory makes no request, retains run-time raw refs, and cannot hide a positive S0',async()=>{
 const directory=mkdtempSync(base+'/tc-control-');try{
  const raw=saveTableCheckResponse(resolve(directory,'tablecheck-source'),{contextUrl:'https://www.tablecheck.com/en/shops/kagurazaka-jin/reserve',url:'https://www.tablecheck.com/en/shops/kagurazaka-jin/available',request:null},Buffer.from('original unreviewed response'));
  const row=await recheckTableCheck({restaurant:{id:'c',sourceIds:{tablecheck:'kagurazaka-jin'}}},{},resolve(directory,'post'),directory,async()=>{throw Error('MUST_NOT_FETCH');});
  assert.equal(row.status,'NOT_EVALUATED');assert.equal(row.evidenceStrength,'RUN_TIME_RAW_ONLY');assert.equal(row.rawEvidence[0].bodyPath,raw.bodyPath);assert.equal(row.rawEvidence[0].sha256,raw.sha256);
  const empty={status:'ABSENT',reasons:[],evidenceRefs:[]};const evaluation={severity:{S0_DECLARATION:empty,S0_BOUNDARY:empty,S0:empty}};
  const reviewed=applyTableCheckReview(evaluation,[row]);assert.equal(reviewed.severity.S0_DECLARATION.status,'NOT_EVALUATED');assert.equal(nextAction({unknownSafety:true},plan).action,'CONTINUE');
  evaluation.severity.S0_DECLARATION={...empty,status:'PRESENT'};assert.equal(applyTableCheckReview(evaluation,[row]).severity.S0.status,'PRESENT');
 }finally{rmSync(directory,{recursive:true});}
});
test('cumulative budget includes historical carry and every replay, and rejects insufficient or inconsistent ledgers',()=>{
 const ledger=JSON.parse(readFileSync(base+'/phase2-ledger.json','utf8')),runPlan=JSON.parse(readFileSync(base+'/plan.json','utf8'));
 assert.deepEqual([ledger.totalFullLiveRuns,ledger.phase2ModelCalls,ledger.priorPhaseModelCalls,ledger.totalModelCalls,ledger.environmentReruns],[2,469,1014,1483,0]);
 assert.deepEqual(checkStageBudget(ledger,runPlan).remaining,{fullLiveRuns:98,modelCalls:3517,environmentReruns:10});
 assert.throws(()=>checkStageBudget({...ledger,totalModelCalls:469},runPlan),/INVALID_STAGE_LEDGER/);
 const expensive=structuredClone(ledger);expensive.sources[0].models+=3000;expensive.phase2ModelCalls+=3000;expensive.totalModelCalls+=3000;assert.throws(()=>checkStageBudget(expensive,runPlan),/GLOBAL_BUDGET_NOT_AVAILABLE/);
});
