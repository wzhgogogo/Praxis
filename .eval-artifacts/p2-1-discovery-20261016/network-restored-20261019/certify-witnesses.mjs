// Independent eval-only certification; no production eligibility/Guard oracle or model.
import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import{resolve,relative}from'node:path';
import{captureVacancy}from'../outer/post-delivery.mjs';
const base=resolve('.eval-artifacts/p2-1-discovery-20261016'),plan=JSON.parse(await readFile(resolve(base,'witness-certification-plan.json')));
const sha=b=>createHash('sha256').update(b).digest('hex');
const text=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&quot;|&#34;/g,'"').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function businessData(html){const records=[];for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const q=[JSON.parse(m[1])];while(q.length){const obj=q.shift();if(Array.isArray(obj)){q.push(...obj);continue}if(!obj||typeof obj!=='object')continue;if(obj['@graph'])q.push(obj['@graph']);if([obj['@type']].flat().some(t=>/Restaurant|FoodEstablishment/.test(t)))records.push({name:obj.name,url:obj.url,geo:obj.geo,address:obj.address,servesCuisine:obj.servesCuisine});}}catch{}}return records;}
function distance(a,b){const r=Math.PI/180,p=a.latitude*r,q=Number(b.latitude)*r,h=Math.sin((q-p)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin((Number(b.longitude)-a.longitude)*r/2)**2;return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
const output=resolve(base,'network-restored-20261019');
const dir=resolve(output,'witness-certification');await mkdir(dir,{recursive:false});
const startedAt=new Date().toISOString(),variants=[];let gets=0;
await writeFile(resolve(dir,'started.json'),JSON.stringify({startedAt,mode:'READ_ONLY_WITNESS_CERTIFICATION',planSha256:sha(await readFile(resolve(base,'witness-certification-plan.json'))),models:0,redirects:'error',retries:0},null,2),{flag:'wx'});
for(const variant of plan.variants){
 const rows=[],current=resolve(dir,variant.caseId);await mkdir(current);
 for(const prior of variant.witnesses){
  const source=new URL(prior.sourceUrl);if(source.origin!=='https://tabelog.com'||source.search||source.hash||!/\d{8}\/$/.test(source.pathname))throw Error('UNAPPROVED_WITNESS_URL');
  const rst=source.pathname.match(/(\d{8})\/$/)[1];
  const observation={sourceUrl:source.toString(),requestedAt:new Date().toISOString(),method:'GET'};let html='',status=null;
  try{gets++;const response=await fetch(source,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000)});const bytes=Buffer.from(await response.arrayBuffer());status=response.status;html=bytes.toString('utf8');observation.status=status;observation.sourceBodySha256=sha(bytes);observation.sourceBytes=bytes.length;}catch(e){observation.error=e.name;}
  let visible=text(html);const businesses=businessData(html),business=businesses.find(b=>norm(b.name??'')===norm(prior.outletName))??(businesses.length===1?businesses[0]:undefined);
  const hardObservations=[];
  for(const expected of prior.hardEvidence??[]){
   let found=norm(visible).includes(norm(expected.quote));let quoteSource=source.toString();
   if(!found&&expected.url&&expected.url!==source.toString()){
    const u=new URL(expected.url);if(u.origin!==source.origin||!u.pathname.startsWith(source.pathname)||!u.pathname.endsWith('/party/')||u.search||u.hash)throw Error('UNAPPROVED_HARD_EVIDENCE_PAGE');
    const extra={method:'GET',sourceUrl:u.toString(),requestedAt:new Date().toISOString()};
    try{gets++;const r=await fetch(u,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000)});const bytes=Buffer.from(await r.arrayBuffer());extra.status=r.status;extra.sourceBodySha256=sha(bytes);extra.sourceBytes=bytes.length;found=r.status===200&&norm(text(bytes.toString('utf8'))).includes(norm(expected.quote));quoteSource=u.toString();}catch(e){extra.error=e.name;}
    extra.finishedAt=new Date().toISOString();observation.supplementalRead=extra;
   }
   hardObservations.push({criterion:expected.criterion,registeredQuote:expected.quote,matchMethod:'NFKD letter/digit text sequence; ignores layout punctuation only',found,sourceUrl:quoteSource});
  }
  const geo=business?.geo;const distanceMeters=geo&&Number.isFinite(Number(geo.latitude))&&Number.isFinite(Number(geo.longitude))?distance(variant.center,geo):null;
  observation.finishedAt=new Date().toISOString();observation.businesses=businesses;observation.hardObservations=hardObservations;observation.distanceMeters=distanceMeters;
  observation.privacy='Only restaurant JSON-LD business fields and pre-registered exact business quotes retained; full page/reviews/profile data not saved. Source body hash is not a saved full-page replay.';
  await writeFile(resolve(current,rst+'.page-observation.json'),JSON.stringify(observation,null,2),{flag:'wx'});
  gets++;const {item,body}=await captureVacancy({rst_id:rst,svd:variant.date.replaceAll('-',''),svps:String(variant.partySize),svt:variant.time.replace(':','')},current,rst);
  let slots=[];try{slots=Object.values(JSON.parse(body).selection??{}).map(v=>v?.time).filter(t=>typeof t==='string')}catch{}
  const supported=status===200&&distanceMeters!==null&&distanceMeters<=variant.center.radiusMeters&&hardObservations.length>0&&hardObservations.every(h=>h.found)&&item.status===200&&slots.includes(variant.time);
  const row={sourceId:'tabelog',sourceEntityId:source.pathname.replace(/^\/+|\/+$/g,''),outletName:prior.outletName,sourceUrl:source.toString(),rst_id:rst,distanceMeters,hardObservations,inventory:{status:item.status??null,selectionTimes:slots,parameters:item.parameters,requestedAt:item.requestedAt,finishedAt:item.finishedAt,sha256:item.sha256,bodyPath:relative(base,item.bodyPath??current)},classification:supported?'KNOWN_FEASIBLE_SUPPORTED':'NOT_CERTIFIED',reason:{pageHttp:status,exactCoordinatesObserved:distanceMeters!==null,inRadius:distanceMeters!==null&&distanceMeters<=variant.center.radiusMeters,hardQuotesObserved:hardObservations.every(h=>h.found),requestedSlotObserved:slots.includes(variant.time)}};
  rows.push(row);console.log(JSON.stringify({caseId:variant.caseId,name:prior.outletName,status:item.status,classification:row.classification,reason:row.reason}));
 }
 const certifiedAt=new Date().toISOString();variants.push({caseId:variant.caseId,request:`${variant.date} ${variant.time} x${variant.partySize}`,certifiedAt,validUntil:new Date(Date.parse(certifiedAt)+86400000).toISOString(),center:variant.center,allRegisteredWitnesses:rows,witnesses:rows.filter(r=>r.classification==='KNOWN_FEASIBLE_SUPPORTED')});
 await writeFile(resolve(dir,'progress.json'),JSON.stringify({startedAt,variants,gets,models:0},null,2));
}
const output={status:variants.every(v=>v.witnesses.length)?'ALL_CASES_HAVE_CERTIFIED_WITNESSES':'BLOCKED_MISSING_CERTIFIED_WITNESS',startedAt,finishedAt:new Date().toISOString(),variants,gets,models:0,google:0,formalLiveRuns:0,method:'Pre-registered identity/HARD semantics, current public business data + exact registered quotes + independently parsed coordinates/radius + four-parameter current inventory GET. No full HTML or user profiles retained. NOT_CERTIFIED is missing or contrary evidence, not a claim of no seats.'};
await writeFile(resolve(output,'witnesses.certified.json'),JSON.stringify(output,null,2)+'\n',{flag:'wx'});console.log(output.status);
