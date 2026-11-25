import assert from 'node:assert/strict';import test from 'node:test';import {readFile} from 'node:fs/promises';
import {independentVacancy,type G6Delivered,type G6Vacancy} from './evaluator.js';
const source=JSON.parse(await readFile(new URL('./fixtures/extended-calendar/source.json',import.meta.url),'utf8'));
const meta=JSON.parse(await readFile(new URL('./fixtures/extended-calendar/source-meta.json',import.meta.url),'utf8'));
const expected:G6Delivered={candidateId:'recorded-07',provider:'TABELOG',sourceEntityId:new URL(meta.url).searchParams.get('rst_id')!,name:'Recorded public witness',date:'2026-11-18',time:'19:00',partySize:10};
test('recorded07 preserves service-day hours and converts them to dated JST labels without shifting the requested date',()=>{
 const raw=JSON.stringify(source),read=independentVacancy({ref:'original-recording',phase:'BEFORE',url:meta.url,candidateId:expected.candidateId,body:source},expected);
 assert.equal(read.known,true);assert.ok(read.slots.includes('19:00'));assert.ok(!read.slots.includes('00:00')&&!read.slots.includes('00:30'));
 assert.deepEqual(read.datedSlots?.find(s=>s.rawTime==='24:30'),{serviceDate:'2026-11-18',rawTime:'24:30',date:'2026-11-19',time:'00:30'});
 assert.deepEqual(read.datedSlots?.find(s=>s.rawTime==='27:00'),{serviceDate:'2026-11-18',rawTime:'27:00',date:'2026-11-19',time:'03:00'});
 assert.equal(JSON.stringify(source),raw,'Original source response is not rewritten');
});
function local(date:string,time:string){const [year,month,day]=date.split('-').map(Number);const target={...expected,date,time:'00:30'};const url=new URL(meta.url);url.searchParams.set('svd',date.replaceAll('-',''));url.searchParams.set('svt','0030');const value:G6Vacancy={ref:'LOCAL_CONSTRUCTION',phase:'BEFORE',candidateId:target.candidateId,url:url.href,body:{base_date:{year,month,day},members:10,selection:[{time,url:'/source-original'}]}};return {read:independentVacancy(value,target),value,target};}
for(const [date,next]of [['2026-01-31','2026-02-01'],['2026-12-31','2027-01-01'],['2028-02-28','2028-02-29'],['2026-02-28','2026-03-01']])test(`dated calendar rollover ${date}`,()=>{const {read}=local(date!,'24:30');assert.equal(read.known,true);assert.equal(read.datedSlots?.[0]?.date,next);assert.equal(read.datedSlots?.[0]?.time,'00:30');assert.deepEqual(read.slots,[],'Next-day00:30 never proves same-day00:30');});
for(const time of ['24:60','-1:30','24:3','abc','100:00'])test(`malformed calendar time still rejected: ${time}`,()=>assert.equal(local('2026-11-18',time).read.known,false));
test('standard slots unchanged; wrong date/party/merchant binding still rejected',()=>{
 const {read,value,target}=local('2026-11-18','00:30');assert.equal(read.known,true);assert.deepEqual(read.slots,['00:30']);
 for(const bad of [{...target,date:'2026-11-19'},{...target,partySize:2},{...target,sourceEntityId:'99999999'}])assert.equal(independentVacancy(value,bad).known,false);
 assert.equal(local('2026-02-30','24:30').read.known,false);
});
