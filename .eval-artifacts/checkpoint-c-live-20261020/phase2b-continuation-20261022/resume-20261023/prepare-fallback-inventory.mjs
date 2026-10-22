import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sha} from '../../../phase2b-exit-pipeline-20261022/inputs.mjs';
const f='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022',r=`${f}/resume-20261023`;
const get=p=>JSON.parse(fs.readFileSync(p)),ref=p=>({path:p,sha256:sha(fs.readFileSync(p))});
const put=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const discoveryPath=`${r}/fallback02-discovery/discovery.json`,d=get(discoveryPath).variants[0];
assert.equal(d.caseId,'p2b-holdout-02');assert.equal(d.centerObservations.places.length,1);
const center=d.centerObservations.places[0];assert.equal(center.displayName.text,'Kachidoki');assert.ok(center.types.includes('political'));
const plan=get(`${r}/witness-plan-after-user-skip.json`),v=plan.variants.find(v=>v.caseId===d.caseId);
Object.assign(v,{place:d.place,centerQuery:d.centerQuery,searchQuery:d.searchQuery,center:{...center.location,radiusMeters:800,sourcePlaceId:center.id,sourceName:center.displayName.text,sourceRef:ref(discoveryPath),sourceRequestSha256:d.centerObservations.observation.sha256},witnesses:[]});
const review={schema:'phase2b-witness-source-review@1',status:'EVALUATION_SIDE_SOURCE_ADJUDICATION_NOT_HUMAN_REVIEW',authority:'User-approved listed fallback only after saved primary three merchants had no requested inventory; original criteria and date unchanged.',originalSourceReview:ref(`${f}/witness-hard-source-review.json`),primaryFailure:ref(`${r}/case02-primary-business-failure.json`),userSkip:ref(`${r}/user-skip-kawakami.json`),entries:[],excludedCandidates:[],models:0,network:0};
for(let i=1;i<=3;i++){
 const path=`${f}/source-reads/fallback02-merchants-12/fallback-02-${i}.source.json`,s=get(path),b=JSON.parse(s.evidence.jsonLd.find(x=>JSON.parse(x.raw)['@id']===s.url).raw),g=b.geo,rad=Math.PI/180,h=Math.sin((Number(g.latitude)-v.center.latitude)*rad/2)**2+Math.cos(v.center.latitude*rad)*Math.cos(Number(g.latitude)*rad)*Math.sin((Number(g.longitude)-v.center.longitude)*rad/2)**2,meters=12742000*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
 if(meters>800){review.excludedCandidates.push({pageSource:ref(path),outletName:b.name,distanceMeters:meters,reason:'WITNESS_OUTSIDE_800M'});continue;}
 assert.equal(s.publicBookingRead.status,'SOURCE_BOUND_READ_EXPOSED');const fragment=s.categorySourceFragments.find(x=>/\bMonjyayaki\b/.test(x.text));assert.ok(fragment);assert.equal(sha(fragment.raw),fragment.sha256);
 const criterion=v.merchantRequirements[0];assert.equal(criterion.value,'monjayaki');
 const w={rst_id:s.publicBookingRead.rst_id,outletName:b.name,sourceUrl:s.url,pageSource:ref(path),hardCriteria:[{...criterion,status:'SUPPORTED',role:'CATEGORY',quote:fragment.text,evidenceRefs:[ref(path)]}]};v.witnesses.push(w);
 review.entries.push({caseId:v.caseId,rst_id:w.rst_id,outletName:w.outletName,criterion,role:'CATEGORY',quote:fragment.text,rawFragmentSha256:fragment.sha256,pageSource:ref(path),distanceMeters:meters,rule:'SOURCE_TRANSLITERATION_MONJYAYAKI',publicBookingRead:s.publicBookingRead});
}
assert.equal(v.witnesses.length,2);const reviewPath=`${r}/fallback02-hard-source-review.json`;put(reviewPath,review);plan.reviewAuthority=ref(reviewPath);
const planPath=`${r}/witness-plan-final-candidates.json`;put(planPath,plan);
put(`${f}/source-jobs/fallback02-inventory-13.json`,{id:'fallback02-inventory-13',approvedBy:'USER_EXISTING_CONSECUTIVE_AUTHORIZATION',witnessPlanPath:planPath,witnessPlanSha256:sha(fs.readFileSync(planPath)),requests:v.witnesses.map(w=>({id:`fallback-inventory-02-${w.rst_id}`,caseId:v.caseId,kind:'INVENTORY',rst_id:w.rst_id,publicReadSource:w.pageSource,sourceExposedRead:w.sourceUrl}))});
console.log(JSON.stringify({eligible:v.witnesses.map(w=>w.rst_id),excluded:review.excludedCandidates.length,modelCalls:0,network:0}));
