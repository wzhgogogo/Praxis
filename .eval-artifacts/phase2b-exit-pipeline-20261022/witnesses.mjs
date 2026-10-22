// Evaluation-side source observations; never product eligibility or model judgments.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {binding,busyPage,pageEvidence} from '../checkpoint-c-live-20261020/certify-witnesses.mjs';
import {sourceFragments} from '../checkpoint-c-live-20261020/holdout-exit-20261022/source-fragments.mjs';
import {sha} from './inputs.mjs';
const get=p=>JSON.parse(readFileSync(p));
const ref=p=>({path:p,sha256:sha(readFileSync(p))});
export const SOURCE_RULES={radiusMeters:800,minGapMs:30000,cooldownMs:900000,transportRetryMs:120000,maxRetries:1,validForMs:86400000,maxCandidatePagesPerPlace:6,targetWitnesses:3};
export function witnessSearchPlan(cases){
 return {schema:'phase2b-witness-search@1',sourceRules:SOURCE_RULES,variants:cases.map(c=>({caseId:c.id,place:c.semantic.location.value,date:c.semantic.date.value,earliest:c.semantic.time.value??c.semantic.time.start,latest:c.semantic.time.value??c.semantic.time.end,partySize:c.semantic.party_size,merchantRequirements:c.semantic.criteria.filter(x=>x.strength==='HARD'),centerQuery:c.semantic.location.value+', Tokyo, Japan',searchQuery:`${c.semantic.location.value}, Tokyo, Japan ${c.semantic.criteria.filter(x=>x.strength==='HARD'&&x.polarity==='POSITIVE').map(x=>x.value).join(' ')} restaurant`}))};
}
export function sourceReadBoundary(url,options){
 const u=new URL(url),method=options.method??'GET';
 if(u.protocol!=='https:'||u.username||u.password||u.hash)throw Error('READ_ONLY_SOURCE_REQUIRED');
 if(u.origin==='https://places.googleapis.com'&&u.pathname==='/v1/places:searchText'&&method==='POST')return;
 if(method==='GET'&&u.origin==='https://tabelog.com'&&(/^\/en\/tokyo\/(?:A\d+\/){2}\d{8}\/$/.test(u.pathname)||u.pathname==='/en/booking/calendar/find_vacancy/')){
  if(u.pathname.includes('find_vacancy')){assert.deepEqual([...u.searchParams.keys()].sort(),['rst_id','svd','svps','svt']);assert.match(u.searchParams.get('rst_id'),/^\d{8}$/);assert.match(u.searchParams.get('svd'),/^\d{8}$/);assert.match(u.searchParams.get('svt'),/^\d{4}$/);assert.match(u.searchParams.get('svps'),/^\d+$/);}
  else assert.equal(u.search,'');return;
 }
 throw Error('READ_ONLY_SOURCE_REQUIRED');
}
// Same source clock for merchant pages and inventory; no redirects or cookies.
export function sourceReader({transport,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms)),record=()=>{},initialFinishedByOrigin={}}){
 assert.equal(typeof transport,'function','EXPLICIT_TRANSPORT_REQUIRED');const finished=new Map(Object.entries(initialFinishedByOrigin));for(const t of finished.values())assert.ok(Number.isFinite(t),'SOURCE_CLOCK_INVALID');let count=0;
 async function wait(until){while(now()<until)await sleep(Math.min(30000,until-now()));}
 return async(url,options={method:'GET'})=>{
  sourceReadBoundary(url,options);const origin=new URL(url).origin;
  for(let attempt=1;attempt<=2;attempt++){
   await wait((finished.get(origin)??-Infinity)+SOURCE_RULES.minGapMs);const requestedAt=new Date(now()).toISOString();
   let response,bytes,error;count++;
   try{response=await transport(url,{...options,credentials:'omit',redirect:'error',signal:AbortSignal.timeout(20000)});bytes=Buffer.from(await response.arrayBuffer());}catch(e){error={name:e.name,message:e.message};}
   finished.set(origin,now());const item={url,method:options.method??'GET',attempt,requestNumber:count,requestedAt,finishedAt:new Date(now()).toISOString(),status:response?.status??null,sha256:bytes?sha(bytes):null,error};await record(item,bytes);
   const cooldown=response&&([403,429,503].includes(response.status)||busyPage(bytes?.toString()??''));
   if(error&&response)throw Error('SOURCE_RESPONSE_READ_FAILURE');
   if(error||cooldown){if(attempt===2)throw Error(cooldown?'SOURCE_COOLDOWN_RETRY_EXHAUSTED':'SOURCE_TRANSPORT_RETRY_EXHAUSTED');await wait(now()+(cooldown?SOURCE_RULES.cooldownMs:SOURCE_RULES.transportRetryMs));continue;}
   assert.equal(response.status,200,'SOURCE_HTTP_FAILURE');return {item,bytes,body:bytes.toString('utf8')};
  }
 };
}
export async function discoverWitnesses(searchPlan,read,googleKey){
 const rows=[];
 for(const v of searchPlan.variants){
  const query=async textQuery=>{const r=await read('https://places.googleapis.com/v1/places:searchText',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':googleKey,'X-Goog-FieldMask':'places.id,places.displayName,places.location,places.formattedAddress,places.types,places.websiteUri'},body:JSON.stringify({textQuery,pageSize:10})});return {places:JSON.parse(r.body).places??[],observation:r.item};};
  const center=await query(v.centerQuery),candidates=await query(v.searchQuery);
  rows.push({...v,centerObservations:center,candidateObservations:candidates,merchantJobs:candidates.places.filter(p=>{try{sourceReadBoundary(p.websiteUri,{method:'GET'});return true;}catch{return false;}}).slice(0,6).map(p=>({kind:'MERCHANT',caseId:v.caseId,url:p.websiteUri,sourcePlaceId:p.id})),status:'PENDING_INDEPENDENT_CENTER_AND_HARD_REVIEW'});
 }
 return {schema:'phase2b-witness-discovery@1',variants:rows,modelCalls:0};
}
export async function captureWitnessJobs(jobs,read){
 const rows=[];
 for(const job of jobs){assert.ok(['MERCHANT','INVENTORY'].includes(job.kind));const r=await read(job.url,{method:'GET'});
  rows.push({...job,metadata:r.item,...(job.kind==='MERCHANT'?{evidence:pageEvidence(r.body,{hardEvidence:[]}),sourceFragments:sourceFragments(r.body)}:{rawInventory:JSON.parse(r.body)})});
 }
 return rows;
}
function distance(a,b){const r=Math.PI/180,h=Math.sin((Number(b.latitude)-a.latitude)*r/2)**2+Math.cos(a.latitude*r)*Math.cos(Number(b.latitude)*r)*Math.sin((Number(b.longitude)-a.longitude)*r/2)**2;return 12742000*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
export function certifySavedWitnesses(plan,inventoryRows){
 const variants=plan.variants.map(v=>{
  assert.equal(v.center.radiusMeters,800);assert.ok(Number.isFinite(v.center.latitude)&&Number.isFinite(v.center.longitude));
  const authority=plan.reviewAuthority;if(authority)assert.equal(sha(readFileSync(authority.path)),authority.sha256,'WITNESS_REVIEW_SHA');
  const candidates=v.witnesses.map(w=>{
   assert.equal(sha(readFileSync(w.pageSource.path)),w.pageSource.sha256,'MERCHANT_SOURCE_SHA');const profile=get(w.pageSource.path),meta=get(profile.metadataPath);assert.equal(meta.status,200);assert.equal(meta.sha256,profile.responseSha256);assert.equal(meta.url,w.sourceUrl);sourceReadBoundary(w.sourceUrl,{method:'GET'});
   const business=profile.evidence.jsonLd.map(b=>{assert.equal(sha(b.raw),b.sha256);return JSON.parse(b.raw);}).find(b=>b['@id']===w.sourceUrl&&b.name===w.outletName);
   assert.ok(business&&business.address&&business.geo,'INDEPENDENT_BUSINESS_IDENTITY_REQUIRED');const meters=distance(v.center,business.geo);assert.ok(Number.isFinite(meters)&&meters<=800,'WITNESS_OUTSIDE_800M');
   assert.equal(w.hardCriteria.length,v.merchantRequirements.length);
   for(const c of v.merchantRequirements){
    const supported=w.hardCriteria.filter(h=>h.value===c.value&&h.polarity===c.polarity&&h.strength===c.strength&&h.status==='SUPPORTED');assert.equal(supported.length,1,'HARD_SUPPORT_REQUIRED');const h=supported[0];assert.ok(['CATEGORY','MENU','MERCHANT_AVERAGE_PRICE_DINNER','MERCHANT_FAMILY_POLICY','MERCHANT_SEATING'].includes(h.role),'MERCHANT_EXPLICIT_ROLE_REQUIRED');
    assert.ok(h.evidenceRefs?.length&&h.quote,'MERCHANT_QUOTE_REQUIRED');
    for(const r of h.evidenceRefs){assert.equal(r.path,w.pageSource.path,'HARD_MUST_BIND_SAME_MERCHANT');assert.equal(sha(readFileSync(r.path)),r.sha256);const source=get(r.path),fragments=[...(source.sourceFragments??[]),...(source.categorySourceFragments??[])];assert.ok(fragments.some(f=>f.text.includes(h.quote)&&sha(f.raw)===f.sha256),'RAW_MERCHANT_QUOTE_REQUIRED');}
    if(c.polarity==='NEGATIVE'){assert.ok(h.adjudication?.rule&&h.adjudication?.path,'NEGATIVE_HARD_REVIEW_REQUIRED');assert.equal(sha(readFileSync(h.adjudication.path)),h.adjudication.sha256,'NEGATIVE_HARD_REVIEW_SHA');}
   }
   const inv=inventoryRows.filter(i=>i.caseId===v.caseId&&i.rst_id===w.rst_id).sort((a,b)=>a.observedAt.localeCompare(b.observedAt)).at(-1);
   if(!inv)return {...w,classification:'PENDING_INVENTORY'};
   const bytes=readFileSync(inv.bodyPath),im=get(inv.metadataPath);assert.equal(sha(bytes),inv.responseSha256);assert.equal(im.sha256,inv.responseSha256);assert.equal(im.status,200);sourceReadBoundary(im.url,{method:'GET'});
   const u=new URL(im.url);assert.deepEqual(Object.fromEntries(u.searchParams),{rst_id:w.rst_id,svd:v.date.replaceAll('-',''),svps:String(v.partySize),svt:v.earliest.replace(':','')});
   const slots=binding(JSON.parse(bytes),w.rst_id,v),times=[Date.parse(meta.requestedAt),Date.parse(im.requestedAt)];assert.ok(times.every(Number.isFinite));
   return {...w,distanceMeters:meters,matchingSlots:slots,classification:slots.length?'KNOWN_FEASIBLE_SUPPORTED':'NOT_CERTIFIED_NO_MATCHING_INVENTORY',certifiedAt:new Date(Math.min(...times)).toISOString(),validUntil:new Date(Math.min(...times)+86400000).toISOString(),observationRefs:[ref(w.pageSource.path),ref(inv.bodyPath),ref(inv.metadataPath)]};
  });
  const witnesses=candidates.filter(w=>w.classification==='KNOWN_FEASIBLE_SUPPORTED'),start=witnesses.length?Math.min(...witnesses.map(w=>Date.parse(w.certifiedAt))):null;
  return {...v,variantId:v.caseId,candidates,witnesses,certifiedWitnesses:witnesses,classification:witnesses.length?'KNOWN_FEASIBLE_SUPPORTED':'NOT_CERTIFIED',certifiedAt:start===null?null:new Date(start).toISOString(),validUntil:start===null?null:new Date(start+86400000).toISOString()};
 });
 const earliest=variants.every(v=>v.witnesses.length)?Math.min(...variants.map(v=>Date.parse(v.certifiedAt))):null;
 return {schema:'phase2b-witness-registry@1',status:earliest===null?'STOPPED_WITNESS_GATE':'ALL_SIX_WITNESSES_CERTIFIED',variants,earliestWitnessObservedAt:earliest===null?null:new Date(earliest).toISOString(),validUntil:earliest===null?null:new Date(earliest+86400000).toISOString(),network:0,models:0};
}
