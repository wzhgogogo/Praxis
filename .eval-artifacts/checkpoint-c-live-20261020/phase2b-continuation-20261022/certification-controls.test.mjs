// Offline synthetic controls; no holdout text, network or model calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sourceFragments} from './source-fragments.mjs';
import {certifySavedWitnesses} from '../../phase2b-exit-pipeline-20261022/witnesses.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
globalThis.fetch=()=>{throw Error('OFFLINE_CONTROL_NETWORK_FORBIDDEN');};
function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'phase2b-certification-control-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const put=(name,value)=>{const p=path.join(dir,name);fs.writeFileSync(p,JSON.stringify(value));return p;};
 const url='https://tabelog.com/en/tokyo/A1000/A100001/12345678/',at='2026-11-01T00:00:00.000Z';
 const html='<table><tr><th>Categories</th><td>Soba</td></tr><tr><th>Number of seats</th><td>12 seats (8 table seats, 4 counter seats)</td></tr></table>';
 const business=JSON.stringify({'@type':'Restaurant','@id':url,name:'Synthetic fixture merchant',address:{streetAddress:'Synthetic only'},geo:{latitude:35,longitude:139}});
 const metadata=put('page.metadata.json',{fixture:'OFFLINE_SYNTHETIC',status:200,url,sha256:sha(html),requestedAt:at});
 const source=put('page.source.json',{fixture:'OFFLINE_SYNTHETIC',metadataPath:metadata,responseSha256:sha(html),evidence:{jsonLd:[{raw:business,sha256:sha(business)}]},sourceFragments:sourceFragments(html)});
 const review=put('source-review.json',{status:'OFFLINE_SYNTHETIC',rule:'Explicit merchant table seating supports seated restaurant format; a seat count alone is insufficient.'});
 const pageRef={path:source,sha256:sha(fs.readFileSync(source))};
 const requirements=[{value:'soba',strength:'HARD',polarity:'POSITIVE'},{value:'standing counter',strength:'HARD',polarity:'NEGATIVE'}];
 const hardCriteria=requirements.map((r,i)=>({...r,status:'SUPPORTED',role:i?'MERCHANT_SEATING':'CATEGORY',quote:i?'8 table seats':'Soba',evidenceRefs:[pageRef],...(i?{adjudication:{rule:'EXPLICIT_TABLE_SEATING',path:review,sha256:sha(fs.readFileSync(review))}}:{})}));
 const plan={variants:[{caseId:'synthetic',center:{latitude:35,longitude:139,radiusMeters:800},date:'2026-11-09',earliest:'19:00',latest:'19:00',partySize:3,merchantRequirements:requirements,witnesses:[{rst_id:'12345678',outletName:'Synthetic fixture merchant',sourceUrl:url,pageSource:pageRef,hardCriteria}]}]};
 const invUrl='https://tabelog.com/en/booking/calendar/find_vacancy/?rst_id=12345678&svd=20261109&svps=3&svt=1900';
 const body={base_date:{year:2026,month:11,day:9},members:3,selection:{a:{time:'19:00',url:'https://tabelog.com/booking/?rcd=12345678&visit_date=20261109&member=3&visit_time=1900'}}};
 const bodyPath=put('inventory.body.json',body),metadataPath=put('inventory.metadata.json',{status:200,url:invUrl,sha256:sha(fs.readFileSync(bodyPath)),requestedAt:at});
 const inventory=[{caseId:'synthetic',rst_id:'12345678',observedAt:at,bodyPath,metadataPath,responseSha256:sha(fs.readFileSync(bodyPath))}];
 return {plan,inventory,source,body,put};
}
test('merchant seating extraction excludes review and hidden rows',()=>{
 const good='<table><tr><th>Number of seats</th><td>8 table seats</td></tr></table>';
 const rows=sourceFragments(good+'<aside class="review">'+good+'</aside><div hidden>'+good+'</div>');
 assert.equal(rows.filter(r=>r.role==='MERCHANT_SEATING').length,1);assert.equal(rows[0].text,'Number of seats 8 table seats');
});
test('explicit seated format retains same-merchant raw quote and exact inventory binding',t=>{
 const f=fixture(t),r=certifySavedWitnesses(f.plan,f.inventory);assert.equal(r.variants[0].witnesses[0].classification,'KNOWN_FEASIBLE_SUPPORTED');assert.deepEqual(r.variants[0].witnesses[0].matchingSlots,['19:00']);
});
test('negative condition still requires a bound source adjudication',t=>{
 const f=fixture(t);delete f.plan.variants[0].witnesses[0].hardCriteria[1].adjudication;assert.throws(()=>certifySavedWitnesses(f.plan,f.inventory),/NEGATIVE_HARD_REVIEW_REQUIRED/);
});
test('invented seating quotation is rejected',t=>{
 const f=fixture(t);f.plan.variants[0].witnesses[0].hardCriteria[1].quote='All tables are private rooms';assert.throws(()=>certifySavedWitnesses(f.plan,f.inventory),/RAW_MERCHANT_QUOTE_REQUIRED/);
});
test('wrong party or restaurant in the inventory is not certified',t=>{
 for(const change of [b=>{b.members=4;},b=>{b.selection.a.url=b.selection.a.url.replace('rcd=12345678','rcd=87654321');}]){
  const f=fixture(t);change(f.body);fs.writeFileSync(f.inventory[0].bodyPath,JSON.stringify(f.body));const hash=sha(fs.readFileSync(f.inventory[0].bodyPath));const m=JSON.parse(fs.readFileSync(f.inventory[0].metadataPath));m.sha256=hash;fs.writeFileSync(f.inventory[0].metadataPath,JSON.stringify(m));f.inventory[0].responseSha256=hash;
  assert.equal(certifySavedWitnesses(f.plan,f.inventory).variants[0].witnesses.length,0);
 }
});
test('merchant outside 800 metres is rejected',t=>{
 const f=fixture(t);f.plan.variants[0].center.latitude+=1;assert.throws(()=>certifySavedWitnesses(f.plan,f.inventory),/WITNESS_OUTSIDE_800M/);
});
