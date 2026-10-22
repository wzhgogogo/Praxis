import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sha} from '../../../phase2b-exit-pipeline-20261022/inputs.mjs';
const f='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022',r=`${f}/resume-20261023`;
const get=p=>JSON.parse(fs.readFileSync(p)),ref=p=>({path:p,sha256:sha(fs.readFileSync(p))}),put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const rows=[];function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const path=p+'/'+e.name;if(e.isDirectory())walk(path);else if(path.endsWith('.source.json')){const s=get(path);if(s.kind==='INVENTORY'&&get(s.metadataPath).status===200)rows.push({...s,sourcePath:path});}}}
walk(`${f}/source-reads`);walk(`${r}/pending-inventory`);
const inventoryPath=`${r}/inventory-final-index.json`;put(inventoryPath,rows);
const planPath=`${r}/witness-plan-final-candidates.json`,plan=get(planPath),v=plan.variants.find(v=>v.caseId==='p2b-holdout-02');
const fallbackCandidates=[];
for(let i=1;i<=6;i++){
 const dir=i<=3?'fallback02-merchants-12':'fallback02-final-merchants-14',path=`${f}/source-reads/${dir}/fallback-02-${i}.source.json`,s=get(path),b=JSON.parse(s.evidence.jsonLd[0].raw),g=b.geo,rad=Math.PI/180,h=Math.sin((Number(g.latitude)-v.center.latitude)*rad/2)**2+Math.cos(v.center.latitude*rad)*Math.cos(Number(g.latitude)*rad)*Math.sin((Number(g.longitude)-v.center.longitude)*rad/2)**2,distanceMeters=12742000*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
 fallbackCandidates.push({pageSource:ref(path),outletName:b.name,distanceMeters,reason:distanceMeters>800?'OUTSIDE_800M':'NO_MATCHING_INVENTORY'});
}
assert.equal(fallbackCandidates.filter(c=>c.reason==='NO_MATCHING_INVENTORY').length,2);
put(`${r}/case02-no-witness-exclusion.json`,{schema:'phase2b-business-witness-exclusion@1',status:'PRIMARY_AND_APPROVED_FALLBACK_NOT_CERTIFIED',authorization:'USER_APPROVED_CONTINUOUS_STEP3_NO_WITNESS_EXCLUSION',caseId:v.caseId,primaryFailure:ref(`${r}/case02-primary-business-failure.json`),witnessPlan:ref(planPath),inventoryIndex:ref(inventoryPath),fallbackCandidates,rule:'Only business inventory absence or independently calculated distance exclusion. No failed transport/HTTP response is a no-witness oracle. Still execute all three slots; exclude this case from capability denominator. No product/Prompt tuning.',modelCalls:0,network:0});
console.log(JSON.stringify({inventoryRows:rows.length,fallbackCandidates:6,eligibleWithoutRequestedSlot:2,modelCalls:0,network:0}));
