// Certification inputs only, after opening the committed exit set. Never product/Prompt input.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {certifySavedWitnesses} from '../../phase2b-exit-pipeline-20261022/witnesses.mjs';
const dir='.eval-artifacts/checkpoint-c-live-20261020/phase2b-continuation-20261022';
const sha=b=>createHash('sha256').update(b).digest('hex'),get=p=>JSON.parse(fs.readFileSync(p)),ref=p=>({path:p,sha256:sha(fs.readFileSync(p))});
const search=get(`${dir}/holdout-inputs/witness-search-plan.json`),discoveryPath=`${dir}/witnesses/discovery/discovery.json`,discovery=get(discoveryPath);
const choices={
 '01':['public-details-04/detail-01-1','public-details-04/detail-01-2','public-details-04/detail-01-3'],
 '02':['public-pages-01/moheji-hanare','public-pages-01/okoge','public-pages-01/moheji-hanare-no-hanare'],
 '03':['public-pages-01/maen','public-merchants-05/merchant-03-2'],
 '04':['public-pages-01/thai999','public-merchants-05/merchant-04-1','public-merchants-05/merchant-04-2'],
 '05':['public-details-04/detail-05-1','public-merchants-05/merchant-05-2','public-merchants-05/merchant-05-3'],
 '06':['public-pages-01/odenbar','public-merchants-05/merchant-06-1','public-merchants-05/merchant-06-2'],
};
const reviewPath=`${dir}/witness-hard-source-review.json`;
const review={schema:'phase2b-witness-source-review@1',status:'EVALUATION_SIDE_SOURCE_ADJUDICATION_NOT_HUMAN_REVIEW',reviewer:'Codex evaluation-side inspection of saved merchant fields; no model/API adjudication',authority:'User-approved continuous step 3; negative HARD requires explicit merchant business-format evidence. No witness or product outcome implied.',sourceBinding:ref(`${dir}/phase2b-source-binding.json`),rules:{identity:'Exact same-source canonical restaurant ID, business JSON-LD name/address/geo; unique political-area center captured before merchant selection; radius <=800m.',cuisine:'Literal merchant category, not directory label, name or review. Tabelog Monjyayaki is the merchant category transliteration for monjayaki; Okonomiyaki alone would not support it.',budget:'Merchant dinner price range, retaining the raw Dinner-labelled fragment and requiring its upper bound <= the requested numeric maximum under the existing price policy.',negativeFormat:'Explicit table seating/table seats/tables in merchant Seats or Private rooms field supports seated restaurant format rather than a standing-only soba counter. Generic seat count, name, missing standing keyword, reviews or cuisine alone do not qualify.'},excludedCandidates:[],entries:[],network:0,models:0};
const variants=search.variants.map(v=>{
 const found=discovery.variants.find(x=>x.caseId===v.caseId);assert.equal(found.centerObservations.places.length,1,'UNIQUE_OFFICIAL_CENTER_REQUIRED');
 const place=found.centerObservations.places[0];assert.ok(place.types.includes('political'));assert.ok(place.types.includes('sublocality_level_2'));assert.equal(found.centerObservations.observation.status,200);
 const center={...place.location,radiusMeters:800,sourcePlaceId:place.id,sourceName:place.displayName.text,sourceRef:ref(discoveryPath),sourceRequestSha256:found.centerObservations.observation.sha256};
 const witnesses=choices[v.caseId.slice(-2)].map(stem=>{
  const profilePath=`${dir}/source-reads/${stem}.source.json`,profile=get(profilePath),pageRef=ref(profilePath);
  assert.equal(profile.caseId,v.caseId);assert.equal(profile.canonical,profile.url);
  const businesses=profile.evidence.jsonLd.map(b=>{assert.equal(sha(b.raw),b.sha256);return JSON.parse(b.raw);}).filter(b=>b['@id']===profile.url);assert.equal(businesses.length,1);
  const business=businesses[0],category=profile.sourceFragments.find(f=>f.role==='CATEGORY');assert.ok(category);const rst=profile.url.match(/(\d{8})\/$/)?.[1];assert.ok(rst);
  const hardCriteria=v.merchantRequirements.map(c=>{
   let fragment,role,priceEvidence,rule;
   if(c.polarity==='NEGATIVE'){
    fragment=profile.sourceFragments.find(f=>f.role==='MERCHANT_SEATING'&&/\btable seating\b|\btable seats\b|\bseats at tables\b/i.test(f.text));assert.ok(fragment,'EXPLICIT_TABLE_FORMAT_REQUIRED');role='MERCHANT_SEATING';rule='EXPLICIT_MERCHANT_TABLE_SEATING';
   }else if(/yen/i.test(c.value)){
    const dinner=profile.budgetSourceFragments.find(f=>/aria-label="Dinner"/.test(f.raw));assert.ok(dinner,'DINNER_PRICE_SOURCE_REQUIRED');
    const prices=[...dinner.text.matchAll(/JPY\s*([\d,]+)/g)].map(m=>Number(m[1].replaceAll(',','')));assert.equal(prices.length,2);const cap=Number(c.value.match(/[\d,]+/)[0].replaceAll(',',''));assert.ok(prices[1]<=cap);
    fragment=profile.sourceFragments.find(f=>f.role==='MERCHANT_AVERAGE_PRICE'&&f.text.includes(dinner.text));assert.ok(fragment);role='MERCHANT_AVERAGE_PRICE_DINNER';priceEvidence={quote:dinner.text,rawFragmentSha256:dinner.sha256,meal:'DINNER',min:prices[0],max:prices[1],requestedMax:cap,currency:'JPY'};rule='SAVED_MERCHANT_DINNER_RANGE_WITHIN_CAP';
   }else{
    const expected=c.value==='monjayaki'?'Monjyayaki':c.value;assert.ok(category.text.toLowerCase().includes(expected.toLowerCase()),'LITERAL_MERCHANT_CATEGORY_REQUIRED');fragment=category;role='CATEGORY';rule=c.value==='monjayaki'?'SOURCE_TRANSLITERATION_MONJYAYAKI':'LITERAL_MERCHANT_CATEGORY';
   }
   assert.equal(sha(fragment.raw),fragment.sha256);const quote=priceEvidence?.quote??fragment.text;
   review.entries.push({caseId:v.caseId,rst_id:rst,outletName:business.name,criterion:c,role,quote,rawFragmentSha256:fragment.sha256,pageSource:pageRef,rule,...(priceEvidence?{priceEvidence}:{})});
   return {...c,status:'SUPPORTED',role,quote,evidenceRefs:[pageRef],...(priceEvidence?{priceEvidence}:{}),...(c.polarity==='NEGATIVE'?{adjudication:{rule,path:reviewPath}}:{})};
  });
  return {rst_id:rst,outletName:business.name,sourceUrl:profile.url,pageSource:pageRef,hardCriteria};
 });
 return {...v,variantId:v.caseId,center,witnesses};
});
for(const path of fs.readdirSync(`${dir}/source-reads`,{recursive:true}).filter(x=>x.endsWith('.source.json'))){const p=`${dir}/source-reads/${path}`,r=get(p);if(r.kind!=='MERCHANT'||variants.some(v=>v.witnesses.some(w=>w.pageSource.path===p)))continue;review.excludedCandidates.push({caseId:r.caseId,source:ref(p),reason:r.caseId.endsWith('03')?'French not explicit in saved merchant fields; directory/Bistro/Italian does not establish French.':'No explicit table-seating business-format quote in captured merchant fields; a seat count alone is insufficient.'});}
fs.writeFileSync(reviewPath,JSON.stringify(review,null,2)+'\n',{flag:'wx'});const authority=ref(reviewPath);
for(const v of variants)for(const w of v.witnesses)for(const h of w.hardCriteria)if(h.adjudication)h.adjudication.sha256=authority.sha256;
const plan={schema:'phase2b-witness-plan@1',status:'PREREGISTERED_MERCHANT_HARD_ONLY_NOT_CERTIFIED',sourceRules:search.sourceRules,reviewAuthority:authority,variants,models:0};
const planPath=`${dir}/witness-plan.json`;fs.writeFileSync(planPath,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
const validated=certifySavedWitnesses(plan,[]);assert.ok(validated.variants.every(v=>v.candidates.every(c=>c.classification==='PENDING_INVENTORY')));
fs.writeFileSync(`${dir}/witness-plan-source-validation.json`,JSON.stringify({status:'SOURCE_INPUTS_VALIDATED_NOT_CERTIFIED',caseCounts:variants.map(v=>({caseId:v.caseId,candidates:v.witnesses.length})),witnessPlan:ref(planPath),reviewAuthority:authority,network:0,models:0},null,2)+'\n',{flag:'wx'});
const job={id:'inventory-06',approvedBy:'USER_EXISTING_CONSECUTIVE_AUTHORIZATION',witnessPlanPath:planPath,witnessPlanSha256:sha(fs.readFileSync(planPath)),requests:variants.flatMap(v=>v.witnesses.map(w=>({id:`inventory-${v.caseId.slice(-2)}-${w.rst_id}`,caseId:v.caseId,kind:'INVENTORY',rst_id:w.rst_id}))),scope:'Four parameters from the frozen case and preregistered merchant; no forms, slots, date or party modifications.'};
fs.writeFileSync(`${dir}/source-jobs/inventory-06.json`,JSON.stringify(job,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PREREGISTERED_NOT_CERTIFIED',merchantCounts:variants.map(v=>v.witnesses.length),requests:job.requests.length,models:0}));
