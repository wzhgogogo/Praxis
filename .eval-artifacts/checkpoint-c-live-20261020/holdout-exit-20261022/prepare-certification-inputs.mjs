// Offline, evaluation-side preregistration; not a model or a source request.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{createHash}from'node:crypto';
const dir='.eval-artifacts/checkpoint-c-live-20261020/holdout-exit-20261022',sha=b=>createHash('sha256').update(b).digest('hex'),get=p=>JSON.parse(fs.readFileSync(p)),plan=get(dir+'/witness-search-plan.json'),centers=get(dir+'/centers.json').rows;
const selected=[
 ['p2-holdout-01','merchant-job-01/ueno-13128870','Yakitori (Grilled chicken skewers)'],
 ['p2-holdout-01','merchant-job-01/ueno-13191933','Yakitori (Grilled chicken skewers)'],
 ['p2-holdout-01','merchant-job-01/ueno-13290563','Yakitori (Grilled chicken skewers)'],
 ['p2-holdout-02','source-job-02/jiyugaoka-13277826-detail','Italian'],
 ['p2-holdout-02','source-job-02/jiyugaoka-13133431-detail','Italian'],
 ['p2-holdout-03','merchant-job-01/akasaka-13126018','Shabu shabu (Japanese hotpot)'],
 ['p2-holdout-03','merchant-job-01/akasaka-13015193','Shabu shabu (Japanese hotpot)'],
 ['p2-holdout-03','merchant-job-01/akasaka-13169764','Shabu shabu (Japanese hotpot)'],
 ['p2-holdout-04','source-job-02/ningyocho-13022072','Unagi (Eel)'],
 ['p2-holdout-04','source-job-03/ningyocho-13291679','Unagi (Eel)'],
 ['p2-holdout-04','source-job-03/ningyocho-13003026','Unagi (Eel)'],
 ['p2-holdout-06','source-job-03/shimokitazawa-13037445','Izakaya (Japanese style tavern)'],
 ['p2-holdout-06','source-job-03/shimokitazawa-13270698','Izakaya (Japanese style tavern)'],
 ['p2-holdout-06','source-job-03/shimokitazawa-13289461','Izakaya (Japanese style tavern)']
];
function distance(a,b){const r=Math.PI/180,h=Math.sin((b.latitude-a.latitude)*r/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin((b.longitude-a.longitude)*r/2)**2;return 12742000*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
const variants=plan.variants.map(v=>({...v,variantId:v.caseId,center:centers.find(c=>c.caseId===v.caseId).center,witnesses:[],status:v.caseId==='p2-holdout-05'?'NEGATIVE_HARD_REVIEW_PENDING':'PENDING_INVENTORY'}));
for(const[caseId,stem,category]of selected){
 const pagePath=dir+'/source-reads/'+stem+'.source.json',pageBytes=fs.readFileSync(pagePath),page=JSON.parse(pageBytes),variant=variants.find(v=>v.caseId===caseId),raw=page.evidence.jsonLd.map(j=>JSON.parse(j.raw)).find(b=>b['@id']===page.url),rst_id=new URL(page.url).pathname.match(/(\d{8})\/$/)?.[1];
 assert.ok(raw&&rst_id&&page.canonical===page.url);assert.equal(raw.name,page.evidence.businesses[0].name);
 const meters=distance(variant.center,raw.geo);assert.ok(meters<=800,'WITNESS_OUTSIDE_FROZEN_CENTER');
 const categoryField=page.merchantFields.find(f=>f.field==='CATEGORY'&&f.quote.includes(category));assert.ok(categoryField);
 const fragments=[...(page.categorySourceFragments??[]),...(page.sourceFragments??[]).filter(f=>f.role==='CATEGORY')];assert.ok(fragments.some(f=>f.text.includes(category)&&sha(Buffer.from(f.raw))===f.sha256));
 const ref={path:pagePath,sha256:sha(pageBytes),responseSha256:page.responseSha256,metadataPath:page.metadataPath};
 const hard=variant.merchantRequirements.map((criterion,i)=>{
  if(i===0)return{...criterion,status:'SUPPORTED',quote:category,role:'CATEGORY',evidenceRefs:[ref]};
  assert.equal(caseId,'p2-holdout-02');assert.equal(criterion.polarity,'POSITIVE');assert.ok(/8,000/.test(criterion.value));
  const row=page.sourceFragments.find(f=>f.role==='MERCHANT_AVERAGE_PRICE'),dinner=row?.raw.match(/<p\b[^>]*>[\s\S]*?aria-label="Dinner"[\s\S]*?<em>([^<]+)<\/em>[\s\S]*?<\/p>/)?.[1];assert.ok(dinner);
  const amounts=[...dinner.matchAll(/\d[\d,]*/g)].map(m=>Number(m[0].replaceAll(',','')));assert.ok(amounts.length===2&&Math.max(...amounts)<8000);assert.equal(sha(Buffer.from(row.raw)),row.sha256);
  return{...criterion,status:'SUPPORTED',quote:dinner,role:'MERCHANT_AVERAGE_PRICE_DINNER',sourceFragmentSha256:row.sha256,evidenceRefs:[ref],interpretation:'Published merchant dinner budget upper bound is below the unchanged per-person limit; not a customer review or lunch price.'};
 });
 variant.witnesses.push({rst_id,outletName:raw.name,sourceUrl:page.url,bookingSource:'TABELOG',distanceMeters:meters,address:raw.address,pageSource:ref,hardCriteria:hard,hardEvidence:hard.map(h=>({criterion:h.value,quote:h.quote,evidenceRefs:h.evidenceRefs})),classification:'PENDING_CURRENT_INVENTORY'});
}
const out=dir+'/witness-plan.primary.json';fs.writeFileSync(out,JSON.stringify({status:'FROZEN_MERCHANT_SUPPORT_PENDING_INVENTORY',reviewedBy:'CODEX_EVALUATION_SIDE',independentOfProduction:true,sourcePlanSha256:sha(fs.readFileSync(dir+'/witness-search-plan.json')),modelCalls:0,variants},null,2)+'\n',{flag:'wx'});
const initial=variants.filter(v=>['p2-holdout-01','p2-holdout-02','p2-holdout-03','p2-holdout-04'].includes(v.caseId));
fs.writeFileSync(dir+'/inventory-job-01.json',JSON.stringify({id:'inventory-job-01',approvedBy:'USER_EXISTING_CONSECUTIVE_AUTHORIZATION',witnessPlanPath:out,witnessPlanSha256:sha(fs.readFileSync(out)),requests:initial.flatMap(v=>v.witnesses.map(w=>({id:v.caseId+'-'+w.rst_id,caseId:v.caseId,kind:'INVENTORY',rst_id:w.rst_id})))},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'OFFLINE_PREREGISTERED',inventoryRequests:initial.reduce((n,v)=>n+v.witnesses.length,0),modelCalls:0,network:0,pendingCase:'p2-holdout-05'}));
