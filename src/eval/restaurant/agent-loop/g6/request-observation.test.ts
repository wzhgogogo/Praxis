import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash} from 'node:crypto';
import {observeOutgoingRequest} from './request-observation.js';
import {evaluateG6,type G6EvaluationInput} from './evaluator.js';
const approved={ref:'user-reviewed-20261106-calendar',origin:'https://production.tablecheck.com',pathname:'/v2/hub/availability_calendar_v2',methods:['POST'],queryKeys:[],bodyFields:{locale:'string',start_at:'string',shop_id:'string',num_people:'string'},corsPreflight:{requestOrigin:'https://www.tablecheck.com',requestedHeaderNames:['content-type']}};
const body={locale:'en',start_at:'2026-11-11',shop_id:'public-shop',num_people:'2'};
for(const variant of ['VALID','EXTRA_FIELD','WRONG_TYPE','WRONG_PATH','WRONG_METHOD','MISSING_BODY','MISSING_HASH','MISSING_CONTENT_TYPE','WRONG_PREFLIGHT'] as const)test(`outer raw request evidence is independently audited: ${variant}`,async()=>{
 const bytes=Buffer.from(JSON.stringify({...body,...(variant==='EXTRA_FIELD'?{contact:'Do not persist me'}:{}),...(variant==='WRONG_TYPE'?{num_people:2}:{})}));
 const row=await observeOutgoingRequest('outer',{
  url:()=>approved.origin+(variant==='WRONG_PATH'?'/account':approved.pathname),method:()=>variant==='WRONG_METHOD'?'PUT':'POST',postDataBuffer:()=>variant==='MISSING_BODY'?null:bytes,headerValue:async()=>variant==='MISSING_CONTENT_TYPE'?null:'application/json; charset=utf-8'});
 if(variant==='MISSING_HASH')delete row.bodySHA256;
 if(variant==='WRONG_PREFLIGHT'){row.method='OPTIONS';row.preflight={requestOrigin:'https://unrelated.example',method:'POST',headerNames:['content-type'],bodyBytes:0};}
 assert.equal(JSON.stringify(row).includes('Do not persist me'),false);assert.equal(JSON.stringify(row).includes('public-shop'),false);
 if(variant==='VALID')assert.equal(row.bodySHA256,createHash('sha256').update(bytes).digest('hex'));
 const input:G6EvaluationInput={runId:'outer',caseId:'outer',mode:'LIVE_READ',artifactRefs:[],request:{dates:[]},requests:[row],reviewedReadRules:[approved],delivered:[],handoffs:[],answers:[],pages:[],vacancy:[],boundedNoResult:true};
 const result=evaluateG6(input);assert.equal(result.checks.find(c=>c.rule==='REQUEST_BOUNDARY')?.status,variant==='VALID'?'PASS':'FAIL');
});
