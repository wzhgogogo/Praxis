import test from 'node:test';
import assert from 'node:assert/strict';
import {readPostDeliveryWitnesses} from './post-delivery-witness.js';
import {evaluateG6,independentVacancy,type G6Delivered,type G6Vacancy} from './evaluator.js';
import {witnessURL,type WitnessReceipt} from './witness.js';
const base:G6Delivered={candidateId:'first',provider:'TABELOG',sourceEntityId:'11111111',date:'2026-11-19',time:'18:00',partySize:6,name:'Fictional merchant'};
const times=['18:00','18:30','19:00','19:30','20:00'];
const response=(d:G6Delivered):G6Vacancy=>({ref:'constructed-response',phase:'AFTER',candidateId:d.candidateId,url:witnessURL(d),body:{base_date:{year:2026,month:11,day:19},members:6,selection:times.slice(0,4).map(time=>({time,url:'/source-observed-link'}))}});
for(const stores of [1,2,3])test(`fictional ${stores} stores, five displayed slots each: at most two grouped post GETs`,async()=>{
 const deliveries=Array.from({length:stores},(_,i)=>times.map(time=>({...base,candidateId:'merchant-'+i,sourceEntityId:String(11111111+i),time}))).flat();const requested:G6Delivered[]=[];
 const checks=await readPostDeliveryWitnesses(deliveries,async d=>{requested.push(d);return {kind:'AFTER',target:{...d,detailUrl:'https://tabelog.com/en/fictional/',identityText:[d.name]},checkedAt:'2026-11-10T00:00:00Z',exists:true,responseSHA256:'LOCAL_CONSTRUCTION',vacancy:response(d)} satisfies WitnessReceipt;});
 assert.equal(requested.length,Math.min(stores,2));assert.equal(checks.length,stores);
 for(const c of checks.slice(0,2)){assert.equal(c.status,'READ');assert.deepEqual(c.slots.map(s=>s.exists),[true,true,true,true,false]);assert.equal(c.receipt?.vacancy?.url,witnessURL(c.target));assert.equal(c.target.time,'18:00');}
 const evaluated=evaluateG6({runId:'constructed',caseId:'post',mode:'FIXTURE',artifactRefs:[],request:{dates:['2026-11-19'],partySize:6},delivered:deliveries,handoffs:[],answers:[],pages:[],requests:[],postDeliveryChecks:checks,vacancy:checks.flatMap(c=>c.receipt?.vacancy?[c.receipt.vacancy]:[])});
 const slots=evaluated.checks.filter(c=>c.rule==='POST_DELIVERY_SLOT');assert.equal(slots.length,5*stores);
 assert.equal(slots.filter(c=>c.status==='PASS').length,Math.min(stores,2)*4);
 if(stores===3)assert.ok(slots.filter(c=>c.subject==='merchant-2').every(c=>c.status==='NOT_EVALUATED'&&c.reason.includes('POST_DELIVERY_GET_LIMIT')));
 if(stores===3){assert.equal(checks[2]!.status,'NOT_EXECUTED');assert.equal(checks[2]!.reason,'POST_DELIVERY_GET_LIMIT');assert.ok(checks[2]!.slots.every(s=>s.exists===null));}
});
test('AFTER is a day/party calendar; certification and captured-source time binding stay strict',()=>{
 const r=response(base);assert.equal(independentVacancy(r,{...base,time:'19:30'}).known,true);
 assert.ok(!independentVacancy({...r,phase:'BEFORE'},{...base,time:'19:30'}).known);
 for(const changed of [{...base,sourceEntityId:'99999999'},{...base,date:'2026-11-20'},{...base,partySize:2}])assert.equal(independentVacancy(r,changed).known,false);
 const wrongTime=new URL(r.url);wrongTime.searchParams.set('svt','9999');assert.equal(independentVacancy({...r,url:wrongTime.href},base).known,false);
});
