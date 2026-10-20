import test from 'node:test';
import assert from 'node:assert/strict';
import {pacedRead,binding,pageEvidence,resumeOperations,reviewedIdentity} from './certify-witnesses.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('all same-source page and inventory reads are at least 30 seconds after previous completion',async()=>{
 let time=0;const calls=[],records=[];
 const read=pacedRead({now:()=>time,sleep:async ms=>{assert.ok(ms<=30000);time+=ms;},transport:async(url,options)=>{calls.push({url:String(url),time,options});time+=25;return new Response('OK');}});
 for(const url of ['https://tabelog.com/en/tokyo/A1303/A130301/13261619/','https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=13261619&svd=20261103&svps=2&svt=1900'])await read(url,(item,bytes)=>records.push({item,body:bytes.toString()}));
 assert.deepEqual(calls.map(c=>c.time),[0,30025]);assert.equal(records.length,2);
 assert.ok(calls.every(c=>c.options.method==='GET'&&c.options.redirect==='error'&&c.options.credentials==='omit'));
});

test('busy/status failure waits 15 minutes exactly once, retains both responses, then stops if still failing',async()=>{
 for(const status of [403,503,429,200]){
  let time=0;const calls=[],records=[];const body=status===200?'Search is unavailable right now.':'blocked';
  const read=pacedRead({now:()=>time,sleep:async ms=>{assert.ok(ms<=30000);time+=ms;},transport:async()=>{calls.push(time);return new Response(body,{status});}});
  await assert.rejects(read('https://tabelog.com/approved', (item,bytes)=>records.push({item,body:bytes.toString()})),/SOURCE_COOLDOWN_RETRY_EXHAUSTED/);
  assert.deepEqual(calls,[0,900000]);assert.equal(records.length,2);assert.equal(records[0].body,body);
 }
 let time=0,calls=0;const read=pacedRead({now:()=>time,sleep:async ms=>{time+=ms;},transport:async()=>new Response(++calls===1?'busy':'OK',{status:calls===1?503:200})});
 assert.equal((await read('https://tabelog.com/approved',()=>{})).body,'OK');assert.equal(calls,2);assert.equal(time,900000);
});

test('inventory certification binds raw date, party, outlet and exact time without opening slot URLs',()=>{
 const v={date:'2026-11-03',partySize:2,earliest:'19:00',latest:'19:00'};
 const row={base_date:{year:2026,month:11,day:3},members:2,selection:{0:{time:'19:00',url:'/en/booking/form_course/new?rcd=13261619&member=2&visit_date=20261103&visit_time=1900'}}};
 assert.deepEqual(binding(row,'13261619',v),['19:00']);
 for(const changed of [{...v,date:'2026-11-10'},{...v,partySize:4},{...v,earliest:'18:00',latest:'18:00'}])assert.deepEqual(binding(row,'13261619',changed),[]);
 assert.deepEqual(binding(row,'99999999',v),[]);
});

test('source evidence retains entity-encoded HARD quote bytes, not only a found flag',()=>{
 const quote='We offer only the "Omakase Course."';
 const encoded='We offer only the &quot;Omakase Course.&quot;';
 const evidence=pageEvidence('<p>'+encoded+'</p>',{hardEvidence:[{criterion:'omakase',quote}]});
 assert.equal(evidence.hardQuoteObservations[0].found,true);
 assert.equal(evidence.rawQuotes[0]?.raw,encoded);
});

test('no-status transport failure waits two minutes, replays once unchanged and stops on a second failure',async()=>{
 for(const recover of [true,false]){
  let time=0;const calls=[],records=[];
  const read=pacedRead({now:()=>time,sleep:async ms=>{assert.ok(ms<=30000);time+=ms;},transport:async(url,options)=>{
   calls.push({time,url:String(url),method:options.method,redirect:options.redirect,credentials:options.credentials});
   if(calls.length===1||!recover)throw new TypeError('fetch failed');
   return new Response('OK');
  }});
  const operation=read('https://tabelog.com/approved',(item)=>records.push(item));
  if(recover)assert.equal((await operation).body,'OK');else await assert.rejects(operation,/SOURCE_TRANSPORT_RETRY_EXHAUSTED/);
  assert.deepEqual(calls.map(c=>c.time),[0,120000]);assert.deepEqual({...calls[0],time:0},{...calls[1],time:0});assert.equal(records.length,2);assert.equal(records[0].status,null);
 }
});

test('resume preserves the three supported witnesses and refreshes only the missing evidence',()=>{
 const root='.eval-artifacts/checkpoint-c-live-20261020',old=root+'/witness-certification-20261020';
 const read=p=>JSON.parse(readFileSync(p,'utf8'));
 const ops=resumeOperations(read(root+'/witness-plan.json'),read(old+'/capture/capture.json'),read(old+'/registry.pending.json'));
 assert.deepEqual(ops.filter(o=>o.action==='PRESERVE').map(o=>[o.caseId,o.rst_id]),[
  ['p2l-kf-h001-20261103','13275802'],['p2l-kf-h002-20261107','13305528'],['p2l-kf-h002-20261107','13296659']]);
 assert.deepEqual(ops.filter(o=>o.action==='REFRESH_HARD_PAGE_ONLY').map(o=>o.rst_id),['13261619']);
 assert.deepEqual(ops.filter(o=>o.action==='REUSE_PAGE_CAPTURE_INVENTORY').map(o=>[o.caseId,o.rst_id,o.previousCaseId]),[['p2l-kf-h005-20261105','13305528','p2l-kf-h002-20261107']]);
 assert.equal(ops.filter(o=>o.action==='CAPTURE').length,11);
 assert.equal(ops.reduce((n,o)=>n+({PRESERVE:0,REFRESH_HARD_PAGE_ONLY:1,REUSE_PAGE_CAPTURE_INVENTORY:1,CAPTURE:2}[o.action]),0),24);
});

test('source identity review resolves a translated name without accepting another canonical outlet',()=>{
 const path='.eval-artifacts/checkpoint-c-live-20261020/witness-resume-20261020/capture/p2l-kf-h003-20261106/13266155.attempt-1.source.json';
 const sha256=createHash('sha256').update(readFileSync(path)).digest('hex');
 const row={sourceUrl:'https://tabelog.com/en/tokyo/A1301/A130102/13266155/',identityMatched:false};
 const review={identityReview:{status:'SUPPORTED',currentSourceName:'Private rooms Izakaya Ginraku Chiyoda yuuraku chou ekimae ten',rationale:'Same canonical outlet ID and Ginraku/Yurakucho business identity; translated suffix changed.',evidenceRefs:[{path,sha256}]}};
 const variant={center:{latitude:35.6697,longitude:139.767,radiusMeters:1000}};
 assert.equal(reviewedIdentity(row,review,variant).matched,true);
 assert.equal(reviewedIdentity({...row,sourceUrl:row.sourceUrl.replace('13266155','99999999')},review,variant).matched,false);
 assert.equal(row.identityMatched,false);
});
