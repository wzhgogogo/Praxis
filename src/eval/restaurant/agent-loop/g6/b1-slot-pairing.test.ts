import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {evaluateG6,type G6EvaluationInput} from './evaluator.js';
const times=['18:00','18:30','19:00','19:30','20:00'];
function fictional(withIds=true):G6EvaluationInput{
 const links=times.map(time=>'https://tabelog.com/en/booking/form_course/new?rcd=11111111&visit_date=20261119&visit_time='+time.replace(':','')+'&member=6');
 const body={base_date:{year:2026,month:11,day:19},members:6,selection:times.map((time,i)=>({time,url:links[i]}))};
 return {runId:'constructed',caseId:'five-slots',mode:'FIXTURE',artifactRefs:[],request:{dates:['2026-11-19'],partySize:6,timeWindow:{earliest:'18:00',latest:'20:00'}},delivered:times.map((time,i)=>({candidateId:'merchant',...(withIds?{offerId:'original-offer-'+i}:{}),provider:'TABELOG',sourceEntityId:'11111111',name:'Fictional merchant',address:'Fictional public address',date:'2026-11-19',time,partySize:6})),handoffs:links.map((url,i)=>({candidateId:'merchant',...(withIds?{offerId:'original-offer-'+i}:{}),provider:'TABELOG',url,directLabel:'Book on Tabelog',continueLabel:'Continue on Tabelog — date, time, 6 guests filled in'})),pages:[],answers:[],requests:[],qualificationOracles:[{name:'Fictional merchant',address:'Fictional public address',hardCriteriaMet:true,withinArea:true,evidenceRefs:['LOCAL_CONSTRUCTION']}],vacancy:[{ref:'original-calendar',phase:'SOURCE_CAPTURE',url:'https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=11111111&svd=20261119&svps=6&svt=1900&exclude_unavailable_time=1',candidateId:'merchant',body:structuredClone(body)},{ref:'post-calendar',phase:'AFTER',url:'https://tabelog.com/en/booking/calendar/find_vacancy?rst_id=11111111&svd=20261119&svps=6&svt=1800',candidateId:'merchant',body:structuredClone(body)}]};
}
for(const ids of [true,false])test(`five original B1s pair one-to-one with recorded offer IDs=${ids}`,()=>{
 const x=fictional(ids),r=evaluateG6(x);assert.equal(r.verdict.s0,0);assert.equal(r.verdict.qualified,true);assert.equal(r.checks.filter(c=>c.rule==='B1_SOURCE_URL'&&c.status==='PASS').length,5);assert.equal(r.checks.filter(c=>c.rule==='B1_LINK'&&c.status==='PASS').length,5);
});
for(const mode of ['WRONG_TIME','NOT_RETURNED','DUPLICATE','WRONG_OFFER','AMBIGUOUS'] as const)test(`five-slot B1 counterexample ${mode} stays S0`,()=>{
 const x=fictional(mode!=='AMBIGUOUS');
 if(mode==='WRONG_TIME')x.handoffs[1]!.url=x.handoffs[1]!.url.replace('1830','1845');
 if(mode==='NOT_RETURNED')(x.vacancy[0]!.body as {selection:unknown[]}).selection.splice(1,1);
 if(mode==='DUPLICATE')x.handoffs[1]={...x.handoffs[0]!};
 if(mode==='WRONG_OFFER')x.handoffs[1]!.offerId='unrecorded-offer';
 if(mode==='AMBIGUOUS')x.delivered.push({...x.delivered[0]!});
 const r=evaluateG6(x);assert.ok(r.verdict.s0>0);assert.equal(r.verdict.stopBatch,true);assert.ok(r.checks.some(c=>c.rule===(mode==='NOT_RETURNED'?'B1_SOURCE_URL':'B1_LINK')&&c.status==='FAIL'));
});
test('D01 and D8 real frozen inputs keep their original qualification and B1 conclusions',async()=>{
 const paths=['.eval-artifacts/phase3b/category-discovery-cost-20261110/runtime/D01/D01/evaluation.supplement','.eval-artifacts/phase3b/held-out-preparation-20261109/D8/evaluation.supplement'];
 for(const p of paths){const input=JSON.parse(await readFile(p+'.input.json','utf8')),prior=JSON.parse(await readFile(p+'.json','utf8'));const r=evaluateG6(input);assert.deepEqual(r.verdict,prior.verdict,p);assert.deepEqual(r.checks.filter(c=>c.rule.startsWith('B1_')),prior.checks.filter((c:{rule:string})=>c.rule.startsWith('B1_')),p);}
});
