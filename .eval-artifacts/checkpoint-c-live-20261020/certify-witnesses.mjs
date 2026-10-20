// Prepared only. Capture needs explicit user authorization; finalize is offline independent review.
import {readFileSync,writeFileSync,mkdirSync,appendFileSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {parseArgs} from 'node:util';
import {consumeAuthorization} from './policy.mjs';
import {base,sha,verifyFreeze} from './freeze.mjs';
const get=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const plan=get(resolve(base,'witness-plan.json'));
function local(p){const r=relative(resolve(base),resolve(p));if(!r||r.startsWith('..'))throw Error('OUTPUT_OUTSIDE_BATCH');return resolve(p);}
export function binding(body,rst,v){
 const b=body?.base_date;const date=b?`${b.year}-${String(b.month).padStart(2,'0')}-${String(b.day).padStart(2,'0')}`:null;
 if(date!==v.date||body?.members!==v.partySize)return [];
 return Object.values(body.selection??{}).filter(s=>{try{const u=new URL(s.url,'https://tabelog.com');return s.time>=v.earliest&&s.time<=v.latest&&u.origin==='https://tabelog.com'&&u.searchParams.get('rcd')===rst&&u.searchParams.get('visit_date')===v.date.replaceAll('-','')&&u.searchParams.get('member')===String(v.partySize)&&u.searchParams.get('visit_time')===s.time.replace(':','');}catch{return false;}}).map(s=>s.time);
}
function business(html){const found=[];for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const q=[JSON.parse(m[1])];while(q.length){const o=q.shift();if(Array.isArray(o)){q.push(...o);continue;}if(!o||typeof o!=='object')continue;if(o['@graph'])q.push(o['@graph']);if([o['@type']].flat().some(t=>/Restaurant|FoodEstablishment/.test(t)))found.push({name:o.name,address:o.address,geo:o.geo,url:o.url,servesCuisine:o.servesCuisine});}}catch{}}return found;}
const norm=s=>String(s).normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const visible=s=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&quot;|&#34;/g,'"').replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
function distance(a,b){const r=Math.PI/180,p=a.latitude*r,q=Number(b.latitude)*r,h=Math.sin((q-p)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin((Number(b.longitude)-a.longitude)*r/2)**2;return 12742000*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
export function busyPage(body){return /アクセスが集中|ただいま[^。\n]{0,60}混み合|Search is unavailable right now|temporarily unavailable due to (?:high traffic|heavy traffic)/i.test(visible(body));}
// The source is the origin, not the URL: page, party page and vacancy share a clock.
// Sleep in bounded chunks so a 15-minute cooldown remains observable/interruption-safe.
export function pacedRead({transport=fetch,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms)),observe=()=>{},minGapMs=30000,cooldownMs=900000,transportRetryMs=120000}={}){
 let lastFinished=-Infinity,requests=0;
 async function waitUntil(time,reason){while(now()<time){observe({kind:'WAITING',reason,remainingMs:time-now()});await sleep(Math.min(30000,time-now()));}}
 return async function read(url,record){
  for(let attempt=1;attempt<=2;attempt++){
   await waitUntil(lastFinished+minGapMs,'SOURCE_GAP');
   const requestedAt=new Date(now()).toISOString();let response,bytes,error;
   requests++;observe({kind:'REQUEST_STARTED',requestNumber:requests,url:String(url),method:'GET',attempt,requestedAt});
   try{response=await transport(url,{method:'GET',redirect:'error',credentials:'omit',signal:AbortSignal.timeout(20000)});bytes=Buffer.from(await response.arrayBuffer());}catch(e){error={name:e.name,message:e.message};}
   lastFinished=now();const body=bytes?.toString('utf8')??'';
   const item={url:String(url),method:'GET',attempt,requestNumber:requests,requestedAt,finishedAt:new Date(lastFinished).toISOString(),status:response?.status??null,contentType:response?.headers.get('content-type')??null,sha256:bytes?sha(bytes):null,error};
   await record(item,bytes);observe({kind:'REQUEST_FINISHED',...item});
   if(error&&item.status===null){
    if(attempt===2)throw Error('SOURCE_TRANSPORT_RETRY_EXHAUSTED');
    await waitUntil(lastFinished+transportRetryMs,'SOURCE_TRANSPORT_RETRY');continue;
   }
   if([403,503,429].includes(item.status)||busyPage(body)){
    if(attempt===2)throw Error('SOURCE_COOLDOWN_RETRY_EXHAUSTED');
    await waitUntil(lastFinished+cooldownMs,'SOURCE_COOLDOWN');continue;
   }
   if(error)throw Error('SOURCE_RESPONSE_READ_FAILURE; HTTP status present, no transport-only retry');
   if(item.status!==200)throw Error('SOURCE_HTTP_FAILURE:'+item.status);
   return {item,body,bytes};
  }
 };
}

export function resumeOperations(witnessPlan,priorCapture,priorRegistry){
 const operations=[];
 for(const v of witnessPlan.variants)for(const w of v.witnesses){
  const rst_id=new URL(w.sourceUrl).pathname.match(/(\d{8})\/$/)?.[1];
  let previous=priorCapture.variants.find(x=>x.caseId===v.caseId)?.observedWitnesses.find(x=>x.rst_id===rst_id);
  const registration=priorRegistry.variants.find(x=>x.caseId===v.caseId)?.witnesses.find(x=>x.rst_id===rst_id);
  let action=registration?.classification==='KNOWN_FEASIBLE_SUPPORTED'?'PRESERVE':registration?.classification==='NOT_CERTIFIED_RAW_HARD_EVIDENCE_GAP'?'REFRESH_HARD_PAGE_ONLY':'CAPTURE',previousCaseId;
  if(action==='CAPTURE'){
   const samePage=priorRegistry.variants.find(x=>x.witnesses.some(y=>y.classification==='KNOWN_FEASIBLE_SUPPORTED'&&y.sourceUrl===w.sourceUrl));
   if(samePage){action='REUSE_PAGE_CAPTURE_INVENTORY';previousCaseId=samePage.caseId;previous=priorCapture.variants.find(x=>x.caseId===previousCaseId)?.observedWitnesses.find(x=>x.rst_id===rst_id);}
  }
  if(action!=='CAPTURE'&&!previous)throw Error('RESUME_SOURCE_ROW_MISSING');
  if(action==='REFRESH_HARD_PAGE_ONLY'&&w.hardEvidence.some(h=>h.url&&h.url!==w.sourceUrl))throw Error('HARD_ONLY_REQUEST_NOT_PREREGISTERED');
  operations.push({caseId:v.caseId,rst_id,action,...(previousCaseId?{previousCaseId}:{}),previous});
 }
 return operations;
}

// Exact source fragments retain the relevant raw business evidence without copying
// unrelated customer reviews, user handles, tracking scripts or response cookies.
export function pageEvidence(html,w){
 const jsonLd=[];
 for(const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{const value=JSON.parse(match[1]);if(/Restaurant|FoodEstablishment/.test(JSON.stringify(value['@type']))&&!/"(?:author|review)"\s*:/.test(match[1]))jsonLd.push({raw:match[1],sha256:sha(Buffer.from(match[1])),htmlCharacterOffset:match.index});}catch{}
 }
 const text=visible(html),quotes=w.hardEvidence.map(h=>({criterion:h.criterion,preregisteredQuote:h.quote,found:norm(text).includes(norm(h.quote))}));
 const fields=business(html);
 // Store exact minimal HTML around preregistered evidence if literal bytes occur.
 const rawQuotes=w.hardEvidence.flatMap(h=>{
  const variants=[h.quote,...['&quot;','&#34;','&#x22;'].map(q=>h.quote.replaceAll('"',q)),h.quote.replaceAll("'",'&#39;')];
  for(const quote of variants){const at=html.toLowerCase().indexOf(quote.toLowerCase());if(at>=0)return [{criterion:h.criterion,htmlCharacterOffset:at,raw:html.slice(at,at+quote.length)}];}
  return [];
 });
 return {businesses:fields,jsonLd,rawQuotes,hardQuoteObservations:quotes,privacy:'Only raw business JSON-LD without personal fields, preregistered quote bytes and source business fields; no full customer-review HTML/cookies retained.'};
}

async function main(){
const {values}=parseArgs({options:{action:{type:'string'},freeze:{type:'string'},approval:{type:'string'},output:{type:'string'},capture:{type:'string'},review:{type:'string'},resume:{type:'string'}}});
if(values.action==='capture'){
 if(!values.freeze||!values.approval||!values.output)throw Error('USER_APPROVAL_REQUIRED; this preparation task does not authorize certification');
 const frozen=verifyFreeze(values.freeze),approval=get(values.approval);
 if(approval.action!=='CERTIFY_CHECKPOINT_C_WITNESSES'||approval.approvedBy!=='USER'||approval.freezeSha256!==frozen.manifestSha256||approval.witnessPlanSha256!==sha(readFileSync(resolve(base,'witness-plan.json')))||!Number.isFinite(Date.parse(approval.validUntil))||Date.parse(approval.validUntil)<=Date.now()||approval.liveMustFinishWithinMs!==86400000||approval.minSourceGapMs!==30000||approval.cooldownMs!==900000||approval.cooldownRetries!==1||approval.transportRetryMs!==120000||approval.transportRetries!==1||approval.stopOnNov3CertificationFailure!==true)throw Error('INVALID_CERTIFICATION_AUTHORIZATION');
 let resume,operations;
 if(values.resume){
  resume=get(values.resume);
  for(const file of [values.resume,resume.sourceCapture.path,resume.sourceRegistry.path])if(frozen.files[relative(process.cwd(),resolve(file))]!==sha(readFileSync(file)))throw Error('RESUME_INPUT_NOT_FROZEN');
  if(approval.resumePlanSha256!==sha(readFileSync(values.resume))||sha(readFileSync(resume.sourceCapture.path))!==resume.sourceCapture.sha256||sha(readFileSync(resume.sourceRegistry.path))!==resume.sourceRegistry.sha256)throw Error('RESUME_INPUT_SHA_MISMATCH');
  operations=resumeOperations(plan,get(resume.sourceCapture.path),get(resume.sourceRegistry.path));
  if(JSON.stringify(operations.map(({previous,...op})=>op))!==JSON.stringify(resume.operations))throw Error('RESUME_OPERATIONS_CHANGED');
 }
 await consumeAuthorization(base,sha(readFileSync(values.approval)),{action:'CERTIFY_CHECKPOINT_C_WITNESSES',freezeSha256:frozen.manifestSha256});
 const directory=local(values.output);mkdirSync(directory,{recursive:false});
 write(resolve(directory,'started.json'),{at:new Date().toISOString(),action:'CERTIFICATION_CAPTURE',freezeSha256:frozen.manifestSha256,approvalSha256:sha(readFileSync(values.approval)),resumePlanSha256:values.resume?sha(readFileSync(values.resume)):null,models:0,minSourceGapMs:30000,cooldownMs:900000,cooldownRetries:1,transportRetryMs:120000,transportRetries:1});
 const variants=[];let stopped=null,gets=0;
 const read=pacedRead({observe:event=>{appendFileSync(resolve(directory,'events.jsonl'),JSON.stringify({...event,at:new Date().toISOString()})+'\n');console.log(JSON.stringify(event));}});
 const approvedPages=new Set(plan.variants.flatMap(v=>v.witnesses.flatMap(w=>[w.sourceUrl,...w.hardEvidence.map(h=>h.url).filter(Boolean)])));
 async function page(url,stem,d,w){const u=new URL(url);if(!approvedPages.has(u.href)||u.origin!=='https://tabelog.com'||u.search||u.hash||!/^\/en\/tokyo\/(?:A\d+\/)+\d{8}\/(?:party\/)?$/.test(u.pathname))throw Error('UNAPPROVED_WITNESS_GET');
  const result=await read(u,async(item,bytes)=>{gets++;const evidencePath=resolve(d,stem+`.attempt-${item.attempt}.source.json`);const evidence=bytes?pageEvidence(bytes.toString('utf8'),w):null;write(evidencePath,{...item,evidence});appendFileSync(resolve(directory,'requests.jsonl'),JSON.stringify({...item,evidencePath})+'\n');});
  return {o:{...result.item,sourcePath:resolve(d,stem+`.attempt-${result.item.attempt}.source.json`),observedAt:result.item.finishedAt,businesses:business(result.body)},html:result.body};}
 function previousRefs(v,row){
  const d=resolve(dirname(resume.sourceCapture.path),v.caseId),refs=[];
  for(const [stem,kind]of [[row.rst_id,'IDENTITY'],...row.hardObservations.map(h=>[row.rst_id+(h.url.endsWith('/party/')?'-party':''),'HARD'])]){
   const files=get(resolve(d,row.rst_id+'.page-observation.json'));
   const request=get(resolve(d,stem+`.attempt-${files.attempt??1}.source.json`));
   refs.push({kind,path:resolve(d,stem+`.attempt-${request.attempt}.source.json`),fileSha256:sha(readFileSync(resolve(d,stem+`.attempt-${request.attempt}.source.json`))),requestedAt:request.requestedAt,sourceResponseSha256:request.sha256});
  }
  refs.push({kind:'INVENTORY',path:row.inventory.bodyPath,fileSha256:row.inventory.sha256,requestedAt:row.inventory.requestedAt});
  for(const ref of refs)if(frozen.files[relative(process.cwd(),ref.path)]!==ref.fileSha256)throw Error('REUSED_WITNESS_SOURCE_NOT_FROZEN');
  return refs;
 }
 for(const v of plan.variants){
  const rows=[],d=resolve(directory,v.caseId);mkdirSync(d);
  for(const w of v.witnesses){
   try{
    const rst=new URL(w.sourceUrl).pathname.match(/(\d{8})\/$/)[1],operation=operations?.find(op=>op.caseId===v.caseId&&op.rst_id===rst);
    if(operation?.action==='PRESERVE'){
     const row={...operation.previous,observationRefs:previousRefs(v,operation.previous),reusedFromCapture:resume.sourceCapture};rows.push(row);
     const event={kind:'WITNESS_PRESERVED_NO_REQUEST',caseId:v.caseId,rst_id:rst,inventorySha256:row.inventory.sha256};appendFileSync(resolve(directory,'events.jsonl'),JSON.stringify(event)+'\n');console.log(JSON.stringify(event));continue;
    }
    let p;
    if(operation?.action==='REUSE_PAGE_CAPTURE_INVENTORY'){
     const previousDir=resolve(dirname(resume.sourceCapture.path),operation.previousCaseId),metadata=get(resolve(previousDir,rst+'.page-observation.json'));
     const sourcePath=resolve(previousDir,rst+`.attempt-${metadata.attempt}.source.json`),source=get(sourcePath);
     if(frozen.files[relative(process.cwd(),sourcePath)]!==sha(readFileSync(sourcePath)))throw Error('REUSED_PAGE_NOT_FROZEN');
     p={o:{...source,sourcePath,businesses:source.evidence.businesses},html:source.evidence.rawQuotes.map(q=>q.raw).join(' ')+' '+source.evidence.jsonLd.map(q=>q.raw).join(' ')};
     const event={kind:'WITNESS_PAGE_REUSED_NEW_INVENTORY_ONLY',caseId:v.caseId,rst_id:rst,fromCaseId:operation.previousCaseId};appendFileSync(resolve(directory,'events.jsonl'),JSON.stringify(event)+'\n');console.log(JSON.stringify(event));
    }else p=await page(w.sourceUrl,rst,d,w);
    const observationRefs=[{kind:'IDENTITY',path:p.o.sourcePath,fileSha256:sha(readFileSync(p.o.sourcePath)),requestedAt:p.o.requestedAt,sourceResponseSha256:p.o.sha256}];
    const company=p.o.businesses.find(b=>norm(b.name)===norm(w.outletName));
    const geo=company?.geo,meters=geo&&Number.isFinite(Number(geo.latitude))&&Number.isFinite(Number(geo.longitude))?distance(v.center,geo):null;
    const hard=[];
    for(const h of w.hardEvidence){let source=p;let url=w.sourceUrl;if(h.url&&h.url!==w.sourceUrl){if(!h.url.startsWith(w.sourceUrl)||!h.url.endsWith('/party/'))throw Error('UNAPPROVED_SUPPLEMENTAL_GET');source=await page(h.url,rst+'-party',d,w);url=h.url;}
     hard.push({criterion:h.criterion,quote:h.quote,found:norm(visible(source.html)).includes(norm(h.quote)),url,sourceSha256:source.o.sha256});observationRefs.push({kind:'HARD',path:source.o.sourcePath,fileSha256:sha(readFileSync(source.o.sourcePath)),requestedAt:source.o.requestedAt,sourceResponseSha256:source.o.sha256});}
    write(resolve(d,rst+'.page-observation.json'),{...p.o,identityMatched:!!company,distanceMeters:meters,hardObservations:hard,privacy:'Business fields and preregistered exact quotes only; full HTML is not retained.'});
    const parameters={rst_id:rst,svd:v.date.replaceAll('-',''),svps:String(v.partySize),svt:v.earliest.replace(':','')};
    const vacancyUrl=new URL('https://tabelog.com/en/booking/calendar/find_vacancy/');for(const k of ['rst_id','svd','svps','svt'])vacancyUrl.searchParams.set(k,parameters[k]);
    let item,body;
    if(operation?.action==='REFRESH_HARD_PAGE_ONLY'){
     item=operation.previous.inventory;body=readFileSync(item.bodyPath,'utf8');if(sha(readFileSync(item.bodyPath))!==item.sha256||frozen.files[relative(process.cwd(),resolve(item.bodyPath))]!==item.sha256)throw Error('REUSED_INVENTORY_SHA_MISMATCH');
    }else{
     const vacancy=await read(vacancyUrl,async(item,bytes)=>{gets++;const rawPath=resolve(d,rst+`.vacancy-attempt-${item.attempt}.body.txt`);if(bytes)writeFileSync(rawPath,bytes,{flag:'wx'});const metadataPath=resolve(d,rst+`.vacancy-attempt-${item.attempt}.metadata.json`);write(metadataPath,{...item,bodyPath:bytes?rawPath:null,parameters});appendFileSync(resolve(directory,'requests.jsonl'),JSON.stringify({...item,bodyPath:bytes?rawPath:null,metadataPath})+'\n');});
     item={...vacancy.item,parameters,bodyPath:resolve(d,rst+`.vacancy-attempt-${vacancy.item.attempt}.body.txt`)};body=vacancy.body;
    }
    observationRefs.push({kind:'INVENTORY',path:item.bodyPath,fileSha256:item.sha256,requestedAt:item.requestedAt});
    let slots=[];try{slots=binding(JSON.parse(body),rst,v);}catch{}
    rows.push({...w,rst_id:rst,identityMatched:!!company,address:company?.address??null,distanceMeters:meters,hardObservations:hard,inventory:item,matchingSlots:slots,observationRefs,reusedInventory:operation?.action==='REFRESH_HARD_PAGE_ONLY'?resume.sourceCapture:null,classification:'PENDING_INDEPENDENT_HARD_REVIEW'});
   }catch(error){stopped={caseId:v.caseId,message:error.message};break;}
  }
  variants.push({...v,observedWitnesses:rows});
  if(!stopped&&v.date==='2026-11-03'&&!rows.some(w=>w.identityMatched&&w.distanceMeters!==null&&w.distanceMeters<=1000&&w.matchingSlots.length>0&&w.hardObservations.every(h=>h.found)))stopped={caseId:v.caseId,message:'NOV_3_CERTIFICATION_FAILED; dates unchanged; user requested stop'};
  write(resolve(d,'case-capture.json'),{caseId:v.caseId,finishedAt:new Date().toISOString(),rows,stopped});
  if(stopped)break;
 }
 write(resolve(directory,'capture.json'),{mode:'LIVE_READ_ONLY_WITNESS_CAPTURE',finishedAt:new Date().toISOString(),freezeSha256:frozen.manifestSha256,witnessPlanSha256:sha(readFileSync(resolve(base,'witness-plan.json'))),resumePlanSha256:values.resume?sha(readFileSync(values.resume)):null,variants,gets,models:0,stopped});
 if(stopped)process.exitCode=2;
}else if(values.action==='finalize'){
 if(!values.capture||!values.review||!values.output)throw Error('--capture --review --output required');
 const capture=get(values.capture),review=get(values.review);
 if(review.captureSha256!==sha(readFileSync(values.capture))||!['INDEPENDENT_REVIEWER','CODEX_EVALUATION_SIDE'].includes(review.reviewedBy)||review.independentOfProduction!==true)throw Error('SOURCE_REVIEW_REQUIRED');
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
   if(!r||r.hardCriteria?.length!==required.length||!required.every(c=>r.hardCriteria.some(h=>h.value===c.value&&h.polarity===c.polarity&&['SUPPORTED','NOT_SUPPORTED','NOT_EVALUATED'].includes(h.status))))throw Error('CURRENT_HARD_REVIEW_INCOMPLETE');
   const raw=readFileSync(row.inventory.bodyPath);if(sha(raw)!==row.inventory.sha256)throw Error('RAW_SHA_MISMATCH');
   const slots=binding(JSON.parse(raw),row.rst_id,v);
   const supported=semantic&&row.inventory.status===200&&row.identityMatched&&row.distanceMeters!==null&&row.distanceMeters<=1000&&slots.length>0;
   witnesses.push({...row,hardReview:r,classification:supported?'KNOWN_FEASIBLE_SUPPORTED':'NOT_CERTIFIED'});
  }
  const observations=witnesses.flatMap(w=>w.observationRefs?.length?w.observationRefs.map(ref=>Date.parse(ref.requestedAt)):[Date.parse(w.inventory.requestedAt)]);
  if(!observations.every(Number.isFinite))throw Error('WITNESS_OBSERVATION_TIME_MISSING');
  const certifiedAt=new Date(Math.min(...observations)).toISOString();
  if(Date.now()-Date.parse(certifiedAt)>=86400000)throw Error('EXPIRED_CERTIFICATION');
  const certifiedWitnesses=witnesses.filter(w=>w.classification==='KNOWN_FEASIBLE_SUPPORTED');
  if(!certifiedWitnesses.length)throw Error(v.date==='2026-11-03'?'HOLIDAY_CERTIFICATION_FAILED: propose 2026-11-10 to user, freeze new input only after approval':'NO_CERTIFIED_WITNESS');
  variants.push({...v,request:`${v.date} ${v.earliest} x${v.partySize}; ${v.requestText}`,witnesses,certifiedWitnesses,classification:'KNOWN_FEASIBLE_SUPPORTED',certifiedAt,validUntil:new Date(Date.parse(certifiedAt)+86400000).toISOString()});
 }
 write(local(values.output),{status:'CURRENT_CERTIFIED_DEVELOPMENT_WITNESSES_PENDING_LIVE_FREEZE_REVIEW',certificationCompletedAt:new Date().toISOString(),reviewedBy:review.reviewedBy,externalReviewerAndUserLiveApproval:'PENDING',captureSha256:sha(readFileSync(values.capture)),reviewSha256:sha(readFileSync(values.review)),earliestWitnessObservedAt:new Date(Math.min(...variants.map(v=>Date.parse(v.certifiedAt)))).toISOString(),validUntil:new Date(Math.min(...variants.map(v=>Date.parse(v.validUntil)))).toISOString(),variants});
}else throw Error('--action capture|finalize required; no operation executed');
}
if(process.argv[1]&&resolve(process.argv[1])===resolve(new URL(import.meta.url).pathname))await main();
