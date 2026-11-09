import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {certifyPrivateHoldout} from './g6/holdout-certify.js';
import {holdoutHash,type PrivateHoldoutManifest} from './holdout-protocol.js';
import {main} from './g6/run-holdout.js';
// LOCAL_CONSTRUCTION manifest/response/clock/ledger. Real witness parser and
// transport-shaped GET recorder; no product sessions, browser or API client.
const privateTurn='LOCAL_CONSTRUCTION private request text';
const body={base_date:{year:2030,month:1,day:1},members:2,selection:[{time:'19:00',url:'https://tabelog.com/en/booking/form_course/new?visit_time=1900&member=2&rcd=10000001&visit_date=20300101'}]};
function manifest(count=4):PrivateHoldoutManifest{return {schema:'phase3b-private-run-manifest@1',cases:Array.from({length:count},(_,i)=>({id:'fictional-'+i,fillings:{},request:privateTurn,followups:[],oracle:{request:{dates:['2030-01-01']},pages:[]},witness:{candidateId:'local',name:'Fictional merchant',provider:'TABELOG',sourceEntityId:'10000001',date:'2030-01-01',time:'19:00',partySize:2,detailUrl:'https://tabelog.com/en/tokyo/A0000/A000000/10000001/',identityText:['Fictional merchant']}}))};}
async function fixture(){const base=resolve('.eval-artifacts');await mkdir(base,{recursive:true});const root=await mkdtemp(join(base,'fictional-certify-')),budgetPath=join(root,'budget.json');
 await writeFile(budgetPath,JSON.stringify({status:'APPROVED_FOR_EXECUTION',entries:[],limits:{evaluationPublicGET:126,fullLive:22,realModelCalls:2500,environmentReruns:4},cumulative:{evaluationPublicGET:0,fullLive:0,realModelCalls:849,environmentReruns:0,restaurantWebsiteRequests:0}}));
 return {root,budgetPath,async ledger(){return JSON.parse(await readFile(budgetPath,'utf8'));},async close(){await rm(root,{recursive:true,force:true});}};
}
const audit={originalSHA256:holdoutHash('fictional original'),manifestSHA256:holdoutHash('fictional manifest'),sourceSHA:holdoutHash('fictional source')};
test('certify-only records available, unavailable, failure and later success with one charged vacancy GET each, no formal binding or private turn',async()=>{
 const f=await fixture();try{
  let clock=Date.now(),requests=0;const starts:number[]=[],bodies:string[]=[];
  const result=await certifyPrivateHoldout(manifest(),audit,join(f.root,'certificates'),{budgetPath:f.budgetPath,now:()=>clock,wait:async ms=>{clock+=ms;},fetch:async(url,init)=>{
   starts.push(clock);requests++;assert.equal(init?.method,'GET');assert.equal(init?.redirect,'manual');assert.equal(init?.credentials,'omit');assert.equal(new URL(String(url)).pathname,'/en/booking/calendar/find_vacancy');
   if(requests===3)throw Error(privateTurn+': no retry');
   const raw=JSON.stringify({...body,selection:requests===2?[]:body.selection,comment:privateTurn},null,2);bodies.push(raw);return new Response(raw);
  }});
  assert.equal(requests,4);assert.equal(result.GETs,4);assert.deepEqual(result.results.map(r=>r.exists),[true,false,null,true]);assert.equal(result.results[2]!.responseSHA256,null);
  assert.equal(result.results[0]!.responseSHA256,holdoutHash(bodies[0]!));assert.ok(starts.slice(1).every((n,i)=>n-starts[i]!>=5000));
  const first=result.results[0]!,clean=await readFile(join(f.root,'certificates',first.bodyRef!),'utf8');assert.equal(first.recording,'SAVED');assert.ok(!clean.includes(privateTurn));assert.ok(clean.includes('PRIVATE_TURN_SHA256'));
  const ledger=await f.ledger();assert.equal(ledger.cumulative.evaluationPublicGET,4);assert.equal(ledger.cumulative.fullLive,0);assert.equal(ledger.cumulative.realModelCalls,849);
  assert.equal(ledger.ledgerId,undefined);assert.equal(ledger.heldoutOutputRoot,undefined);assert.equal((await readdir(join(f.root,'certificates'))).includes('input-hashes.json'),false);
  const walk=async(path:string)=>{for(const e of await readdir(path,{withFileTypes:true})){const p=join(path,e.name);if(e.isDirectory())await walk(p);else assert.ok(!(await readFile(p,'utf8')).includes(privateTurn),e.name);}};await walk(join(f.root,'certificates'));
 }finally{await f.close();}
});
test('certification twelve-GET cap follows the same ledger across changed manifests and output directories, within GET126',async()=>{
 const f=await fixture();try{
  let requests=0;const deps={budgetPath:f.budgetPath,wait:async(_ms:number)=>{},fetch:async()=>{requests++;return new Response(JSON.stringify(body));}};
  await certifyPrivateHoldout(manifest(6),audit,join(f.root,'first'),deps);
  const second=manifest(6);second.cases[0]!.witness.time='19:30';
  await certifyPrivateHoldout(second,{...audit,manifestSHA256:holdoutHash(JSON.stringify(second))},join(f.root,'backup'),deps);
  assert.equal(requests,12);assert.equal((await f.ledger()).cumulative.evaluationPublicGET,12);
  await assert.rejects(certifyPrivateHoldout(manifest(1),audit,join(f.root,'third'),deps),/HOLDOUT_CERTIFICATION_GET_LIMIT/);assert.equal(requests,12);
  assert.equal((await f.ledger()).heldoutOutputRoot,undefined);
 }finally{await f.close();}
});
test('non-200, unknown JSON and unsafe response recording stay observable without retries, unsafe bodies never reach disk',async()=>{
 const f=await fixture();try{
  const credential='LOCAL_CONSTRUCTION-owned-secret',m=manifest(4);let requests=0;
  const result=await certifyPrivateHoldout(m,audit,join(f.root,'results'),{budgetPath:f.budgetPath,wait:async()=>{},ownCredentials:[credential],fetch:async()=>{
   requests++;return requests===1?new Response('{"error":"unavailable"}',{status:503}):requests===2?new Response('{"changed":true}'):requests===3?new Response(JSON.stringify({...body,email:'person@example.test'})):new Response(JSON.stringify({...body,note:credential}));
  }});
  assert.equal(requests,4);assert.deepEqual(result.results.map(r=>r.exists),[null,null,true,true]);assert.equal(result.results[0]!.status,503);assert.ok(result.results[0]!.responseSHA256);
  for(const n of [2,3]){assert.equal(result.results[n]!.recording,'OMITTED');assert.equal(result.results[n]!.bodyRef,null);}
  const walk=async(path:string)=>{for(const e of await readdir(path,{withFileTypes:true})){const p=join(path,e.name);if(e.isDirectory())await walk(p);else{const text=await readFile(p,'utf8');assert.ok(!text.includes(credential));assert.ok(!text.includes('person@example.test'));}}};await walk(join(f.root,'results'));
  assert.equal((await f.ledger()).cumulative.evaluationPublicGET,4);
 }finally{await f.close();}
});
test('certify-only CLI rejects incompatible formal modes before reading private inputs or constructing clients',async()=>{
 for(const mode of ['--resume','--output','--review','--validate-only'])await assert.rejects(main(['--certify-only',mode,'unused']),/HOLDOUT_CERTIFICATION_MODE_CONFLICT/);
 await assert.rejects(main(['--certify-output','unused']),/HOLDOUT_CERTIFICATION_MODE_CONFLICT/);
});
