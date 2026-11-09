import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {supplementRecordedQualification} from './g6/recorded-qualification.js';
import {readIndependentSource,sourceAddressMatches} from './g6/source-document.js';
import {evaluateG6} from './g6/evaluator.js';
const root='.eval-artifacts/phase3b/';
test('real D8 and delivered D4 source recordings yield definite independent qualification without changing originals',async()=>{
 for(const [path,qualified,outcome]of [
  ['d8-direct-outlet-live-20261109/live-runtime/runs/D8/D8',true,'QUALIFIED_DELIVERY'],
  ['d4-d8-live-20261106/snapshot-fix-D4-runtime/runs/D4/D4',false,'DELIVERED_UNQUALIFIED'],
 ]as const){
  const file=root+path+'/evaluation.json',before=await readFile(file,'utf8'),old=JSON.parse(before),r=await supplementRecordedQualification(root+path);
  assert.equal(old.verdict.status,'NOT_EVALUATED');assert.equal(r.evaluation.verdict.status,'EVALUATED');
  assert.equal(r.evaluation.verdict.qualified,qualified);assert.equal(r.evaluation.verdict.outcome,outcome);assert.equal(r.evaluation.verdict.s0,0);assert.equal(r.evaluation.verdict.stopBatch,false);
  assert.equal(r.evaluation.checks.some(c=>c.rule==='QUALIFICATION_QUOTE'&&c.status==='NOT_EVALUATED'),false);
  assert.equal(await readFile(file,'utf8'),before);
  if(qualified){
   for(const mode of ['NO_GOLD_SOURCE','GOLD_OTHER_ENTITY','SOURCE_OTHER_CITY']){const invalid=structuredClone(r.input);
    if(mode==='NO_GOLD_SOURCE')for(const q of invalid.qualificationOracles??[])delete q.nativeIdentity;
    if(mode==='GOLD_OTHER_ENTITY')for(const q of invalid.qualificationOracles??[])if(q.nativeIdentity)q.nativeIdentity.sourceEntityId+='-other';
    if(mode==='SOURCE_OTHER_CITY')for(const p of invalid.pages)if(p.sourceIdentity)p.sourceIdentity.address=p.sourceIdentity.address.replace('Tokyo','Kyoto');
    assert.notEqual(evaluateG6(invalid).checks.find(c=>c.rule==='COMPLETE_REQUEST_QUALIFICATION')?.status,'PASS',mode);
   }
   assert.equal(r.evaluation.checks.find(c=>c.rule==='TABLECHECK_SLOT')?.status,'PASS');assert.equal(r.evaluation.checks.find(c=>c.rule==='B1_SOURCE_URL')?.status,'PASS');
   for(const change of ['OTHER_ENTITY','WRONG_DATE','WRONG_PARTY','NO_SLOT','OTHER_RUN']as const){
    const input=structuredClone(r.input);for(const p of input.pages){
     if(change==='OTHER_ENTITY'&&p.sourceIdentity)p.sourceIdentity.sourceEntityId+='-other';
     if(change==='WRONG_DATE'&&p.observedAvailability)p.observedAvailability.date='2099-01-01';
     if(change==='WRONG_PARTY'&&p.observedAvailability)p.observedAvailability.partySize=9;
     if(change==='NO_SLOT')delete p.observedAvailability;
     if(change==='OTHER_RUN')p.runId='other-run';
    }
    assert.notEqual(evaluateG6(input).checks.find(c=>c.rule==='TABLECHECK_SLOT')?.status,'PASS',change);
   }
  }else assert.equal(r.evaluation.checks.find(c=>c.rule==='G1_ANSWER')?.status,'FAIL','The real unanswered follow-up remains a capability failure');
 }
});
test('independent DOM parser rejects disabled/hidden slots, conflicting identities and another outlet JSON-LD',()=>{
 const url='https://www.tablecheck.com/en/local-fixture',identity={'@type':'Restaurant','@id':url,name:'Fictional Merchant',address:{streetAddress:'1-2-3 Fiction B1',addressLocality:'Local-ku',addressRegion:'Tokyo',postalCode:'1000000'}};
 const widget='<form><button data-date="2026-12-01" aria-selected="true">1</button><span>2 Guests</span><button>19:00</button><button disabled>19:30</button><div hidden><button>20:00</button></div></form>';
 const script=(v:unknown)=>'<script type="application/ld+json">'+JSON.stringify(v)+'</script>';
 const page={url,html:script(identity)+widget};const r=readIndependentSource(page);
 assert.deepEqual(r.widget,{date:'2026-12-01',partySize:2,slots:['19:00']});assert.equal(r.identity?.name,identity.name);
 assert.equal(readIndependentSource({...page,html:script({...identity,'@id':url+'-other'})+widget}).identity,undefined);
 assert.equal(readIndependentSource({...page,html:script([identity,{...identity,address:'9-9-9 Wrong'}])+widget}).identity,undefined);
 assert.equal(readIndependentSource({...page,html:script(identity)+widget.replace('>19:00',' disabled>19:00')}).widget,undefined);
 assert.equal(readIndependentSource({...page,html:script(identity)+widget.replace('<form>','<section>').replace('</form>','</section>')}).widget,undefined,'Unrelated page controls cannot form a booking scope');
 assert.equal(sourceAddressMatches(r.identity!,'9-2-3 Fiction B1 Tokyo Local'),false);
 assert.equal(sourceAddressMatches(r.identity!,'1-2-3 Fiction F1 Tokyo Local'),false);
 assert.equal(sourceAddressMatches(r.identity!,'1000000 1-2-3 Fiction B1 Local-ku Tokyo 1000000'),true);
});
