// Prepared only. Capture needs explicit user authorization; finalize is offline independent review.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {parseArgs} from 'node:util';
import {captureVacancy} from '../p2-1-discovery-20261016/outer/post-delivery.mjs';
import {consumeAuthorization} from './policy.mjs';
import {base,sha,verifyFreeze} from './freeze.mjs';
const {values}=parseArgs({options:{action:{type:'string'},freeze:{type:'string'},approval:{type:'string'},output:{type:'string'},capture:{type:'string'},review:{type:'string'}}});
const get=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const plan=get(resolve(base,'witness-plan.json'));
function local(p){const r=relative(resolve(base),resolve(p));if(!r||r.startsWith('..'))throw Error('OUTPUT_OUTSIDE_BATCH');return resolve(p);}
function binding(body,rst,v){
 const b=body?.base_date;const date=b?`${b.year}-${String(b.month).padStart(2,'0')}-${String(b.day).padStart(2,'0')}`:null;
 if(date!==v.date||body?.members!==v.partySize)return [];
 return Object.values(body.selection??{}).filter(s=>{try{const u=new URL(s.url,'https://tabelog.com');return s.time>=v.earliest&&s.time<=v.latest&&u.origin==='https://tabelog.com'&&u.searchParams.get('rcd')===rst&&u.searchParams.get('visit_date')===v.date.replaceAll('-','')&&u.searchParams.get('member')===String(v.partySize)&&u.searchParams.get('visit_time')===s.time.replace(':','');}catch{return false;}}).map(s=>s.time);
}
function business(html){const found=[];for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const q=[JSON.parse(m[1])];while(q.length){const o=q.shift();if(Array.isArray(o)){q.push(...o);continue;}if(!o||typeof o!=='object')continue;if(o['@graph'])q.push(o['@graph']);if([o['@type']].flat().some(t=>/Restaurant|FoodEstablishment/.test(t)))found.push({name:o.name,address:o.address,geo:o.geo,url:o.url,servesCuisine:o.servesCuisine});}}catch{}}return found;}
const norm=s=>String(s).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const visible=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&quot;|&#34;/g,'"').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
function distance(a,b){const r=Math.PI/180,p=a.latitude*r,q=Number(b.latitude)*r,h=Math.sin((q-p)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin((Number(b.longitude)-a.longitude)*r/2)**2;return 12742000*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
if(values.action==='capture'){
 if(!values.freeze||!values.approval||!values.output)throw Error('USER_APPROVAL_REQUIRED; this preparation task does not authorize certification');
 const frozen=verifyFreeze(values.freeze),approval=get(values.approval);
 if(approval.action!=='CERTIFY_CHECKPOINT_C_WITNESSES'||approval.approvedBy!=='USER'||approval.freezeSha256!==frozen.manifestSha256||approval.witnessPlanSha256!==sha(readFileSync(resolve(base,'witness-plan.json')))||![approval.validUntil,approval.plannedLiveAt].every(t=>Number.isFinite(Date.parse(t)))||Date.parse(approval.validUntil)<=Date.now()||Date.parse(approval.plannedLiveAt)<Date.now()||Date.parse(approval.plannedLiveAt)-Date.now()>86400000)throw Error('CERTIFICATION_MUST_BE_APPROVED_WITHIN_24H_BEFORE_LIVE');
 await consumeAuthorization(base,sha(readFileSync(values.approval)),{action:'CERTIFY_CHECKPOINT_C_WITNESSES',freezeSha256:frozen.manifestSha256});
 const directory=local(values.output);mkdirSync(directory,{recursive:false});
 write(resolve(directory,'started.json'),{at:new Date().toISOString(),action:'CERTIFICATION_CAPTURE',freezeSha256:frozen.manifestSha256,models:0});
 const variants=[];let stopped=null,gets=0;
 async function page(url,stem){const u=new URL(url);if(u.origin!=='https://tabelog.com'||u.search||u.hash||!/^\/en\/tokyo\/(?:A\d+\/)+\d{8}\/(?:party\/)?$/.test(u.pathname))throw Error('UNAPPROVED_WITNESS_GET');gets++;const r=await fetch(u,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000)});const b=Buffer.from(await r.arrayBuffer()),html=b.toString('utf8');const o={url:u.href,method:'GET',status:r.status,sha256:sha(b),observedAt:new Date().toISOString(),businesses:business(html)};if([403,503,429].includes(r.status)||/アクセスが集中|ただいま[^。\n]{0,60}混み合|Search is unavailable right now|temporarily unavailable due to (?:high traffic|heavy traffic)/i.test(visible(html)))throw Error('COOLDOWN_REQUIRED; stop certification, wait 15min; one authorized retry only');return {o,html};}
 for(const v of plan.variants){
  const rows=[],d=resolve(directory,v.caseId);mkdirSync(d);
  for(const w of v.witnesses){
   try{
    const rst=new URL(w.sourceUrl).pathname.match(/(\d{8})\/$/)[1],p=await page(w.sourceUrl,rst);
    const company=p.o.businesses.find(b=>norm(b.name)===norm(w.outletName));
    const geo=company?.geo,meters=geo&&Number.isFinite(Number(geo.latitude))&&Number.isFinite(Number(geo.longitude))?distance(v.center,geo):null;
    const hard=[];
    for(const h of w.hardEvidence){let source=p;let url=w.sourceUrl;if(h.url&&h.url!==w.sourceUrl){if(!h.url.startsWith(w.sourceUrl)||!h.url.endsWith('/party/'))throw Error('UNAPPROVED_SUPPLEMENTAL_GET');source=await page(h.url,rst+'-party');url=h.url;}
     hard.push({criterion:h.criterion,quote:h.quote,found:norm(visible(source.html)).includes(norm(h.quote)),url,sourceSha256:source.o.sha256});}
    write(resolve(d,rst+'.page-observation.json'),{...p.o,identityMatched:!!company,distanceMeters:meters,hardObservations:hard,privacy:'Business fields and preregistered exact quotes only; full HTML is not retained.'});
    gets++;const {item,body}=await captureVacancy({rst_id:rst,svd:v.date.replaceAll('-',''),svps:String(v.partySize),svt:v.earliest.replace(':','')},d,rst);
    if([403,503,429].includes(item.status))throw Error('COOLDOWN_REQUIRED');
    let slots=[];try{slots=binding(JSON.parse(body),rst,v);}catch{}
    rows.push({...w,rst_id:rst,identityMatched:!!company,address:company?.address??null,distanceMeters:meters,hardObservations:hard,inventory:item,matchingSlots:slots,classification:'PENDING_INDEPENDENT_HARD_REVIEW'});
   }catch(error){stopped={caseId:v.caseId,message:error.message};break;}
  }
  variants.push({...v,observedWitnesses:rows});if(stopped)break;
 }
 write(resolve(directory,'capture.json'),{mode:'LIVE_READ_ONLY_WITNESS_CAPTURE',finishedAt:new Date().toISOString(),freezeSha256:frozen.manifestSha256,witnessPlanSha256:sha(readFileSync(resolve(base,'witness-plan.json'))),variants,gets,models:0,stopped});
 if(stopped)process.exitCode=2;
}else if(values.action==='finalize'){
 if(!values.capture||!values.review||!values.output)throw Error('--capture --review --output required');
 const capture=get(values.capture),review=get(values.review);
 if(review.captureSha256!==sha(readFileSync(values.capture))||review.reviewedBy!=='INDEPENDENT_REVIEWER')throw Error('INDEPENDENT_REVIEW_REQUIRED');
 if(capture.variants.length!==6||capture.stopped)throw Error('INCOMPLETE_CAPTURE; Nov 3 certification failure -> reviewer proposes Nov 10 and asks user again; never alter approved variants here');
 const variants=[];
 for(const expected of plan.variants){
  const v=capture.variants.find(v=>v.caseId===expected.caseId),witnesses=[];
  if(!v||v.observedWitnesses.length!==expected.witnesses.length)throw Error('REGISTERED_SET_CHANGED');
  for(const row of v.observedWitnesses){
   const r=review.witnesses.find(r=>r.caseId===v.caseId&&r.rst_id===row.rst_id);
   const required=v.criteria.filter(c=>c.strength==='HARD');
   // Review must explicitly bind every original HARD, including negative HARD, to current raw business evidence.
   const semantic=!!r&&r.hardCriteria?.length===required.length&&required.every(c=>r.hardCriteria.some(h=>h.value===c.value&&h.polarity===c.polarity&&h.status==='SUPPORTED'&&h.evidenceRefs?.length));
   if(!semantic)throw Error('CURRENT_HARD_SEMANTICS_NOT_CERTIFIED; missing keyword is not negative proof');
   const raw=readFileSync(row.inventory.bodyPath);if(sha(raw)!==row.inventory.sha256)throw Error('RAW_SHA_MISMATCH');
   const slots=binding(JSON.parse(raw),row.rst_id,v);
   const supported=row.inventory.status===200&&row.identityMatched&&row.distanceMeters!==null&&row.distanceMeters<=1000&&slots.length>0;
   witnesses.push({...row,hardReview:r,classification:supported?'KNOWN_FEASIBLE_SUPPORTED':'NOT_CERTIFIED'});
  }
  const certifiedAt=new Date(Math.min(...witnesses.map(w=>Date.parse(w.inventory.requestedAt)))).toISOString();
  if(Date.now()-Date.parse(certifiedAt)>=86400000)throw Error('EXPIRED_CERTIFICATION');
  const certifiedWitnesses=witnesses.filter(w=>w.classification==='KNOWN_FEASIBLE_SUPPORTED');
  if(!certifiedWitnesses.length)throw Error(v.date==='2026-11-03'?'HOLIDAY_CERTIFICATION_FAILED: propose 2026-11-10 to user, freeze new input only after approval':'NO_CERTIFIED_WITNESS');
  variants.push({...v,request:`${v.date} ${v.earliest} x${v.partySize}; ${v.requestText}`,witnesses,certifiedWitnesses,classification:'KNOWN_FEASIBLE_SUPPORTED',certifiedAt,validUntil:new Date(Date.parse(certifiedAt)+86400000).toISOString()});
 }
 write(local(values.output),{status:'CURRENT_CERTIFIED_DEVELOPMENT_WITNESSES',captureSha256:sha(readFileSync(values.capture)),reviewSha256:sha(readFileSync(values.review)),validUntil:new Date(Math.min(...variants.map(v=>Date.parse(v.validUntil)))).toISOString(),variants});
}else throw Error('--action capture|finalize required; no operation executed');
