// Eval-only public read replay and independent parser. No production parser import.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync,appendFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const hash=b=>createHash('sha256').update(b).digest('hex');
const isTableCheck=url=>{try{return /(^|\.)tablecheck\.(com|net)$/.test(new URL(url).hostname);}catch{return false;}};
const shape=(url,rule)=>url.origin===rule.origin&&(url.pathname===rule.pathname||rule.pathnamePattern&&new RegExp(rule.pathnamePattern).test(url.pathname));
export function reviewedTableCheckRequest(request,rules){
 if(!request.guardAdmitted||!isTableCheck(request.url)||!['GET','POST'].includes(request.method))return false;
 const url=new URL(request.url);
 // Recheck only a previously dispatched inventory request; discovery is not inventory.
 if(!/\/(?:availability_calendar_v2|available)$/.test(url.pathname))return false;
 return rules.some(rule=>{
  if(!shape(url,rule)||!rule.methods.includes(request.method)||!rule.resourceTypes.includes(request.resourceType))return false;
  const keys=[...url.searchParams.keys()],q=rule.queryKeyRules;
  if(q?!q.required.every(k=>keys.includes(k))||keys.some(k=>![...q.required,...(q.allowed??[]),...(q.repeatable??[])].includes(k))||keys.some(k=>keys.filter(v=>v===k).length>1&&!q.repeatable?.includes(k)):keys.length>0)return false;
  if(request.method==='GET')return true;
  try{const body=JSON.parse(request.body);return /^application\/json(?:;|$)/i.test(request.contentType)&&rule.bodyFields&&Object.keys(body).sort().join()===Object.keys(rule.bodyFields).sort().join()&&Object.entries(rule.bodyFields).every(([k,type])=>typeof body[k]===type);}catch{return false;}
 });
}
function slug(url){try{const p=new URL(url).pathname;return p.match(/^\/en\/shops\/([^/]+)\/(?:reserve|available)/)?.[1]??p.match(/^\/en\/([^/]+)(?:\/reserve\/landing)?\/?$/)?.[1];}catch{return typeof url==='string'?url.match(/^(?:shops\/)?([a-z0-9-]+)$/)?.[1]:undefined;}}
export function parseTableCheckRecheck(bytes,{candidateSlug,date,partySize,times}){
 let text=Buffer.from(bytes).toString('utf8');
 try{const data=JSON.parse(text);const strings=[];const walk=(v,depth=0)=>{if(depth>12)return;if(typeof v==='string'&&/<a\b/i.test(v))strings.push(v);else if(Array.isArray(v))v.forEach(x=>walk(x,depth+1));else if(v&&typeof v==='object')Object.values(v).forEach(x=>walk(x,depth+1));};walk(data);text=strings.join('\n');}catch{}
 // Only explicit, enabled same-outlet slot links carry time-level support.
 // Bare calendar date flags, status=success, failure/data:null and absent slots are UNKNOWN.
 text=text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<!--[\s\S]*?-->/g,'');
 if(/\bhidden\b|aria-hidden\s*=\s*["']true/i.test(text))return {status:'NOT_EVALUATED',reason:'Hidden markup cannot establish visible inventory',slots:[]};
 const slots=[];
 for(const a of text.matchAll(/<a\b([^>]*)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)){
  if(/\bdisabled\b|aria-disabled\s*=\s*["']true/i.test(a[1]+a[3]))continue;
  try{const u=new URL(a[2].replaceAll('&amp;','&'),'https://www.tablecheck.com'),q=u.searchParams,time=q.get('start_time'),label=a[4].replace(/<[^>]+>/g,'').trim();
   if(u.origin==='https://www.tablecheck.com'&&slug(u.href)===candidateSlug&&q.get('start_date')===date&&Number(q.get('num_people')??q.get('pax'))===partySize&&/^\d{2}:\d{2}$/.test(time??'')&&label===time)slots.push(time);
  }catch{}
 }
 return times.length&&times.every(t=>slots.includes(t))?{status:'SUPPORTED',slots,reason:'Explicit same-outlet/date/party enabled slot links support every displayed time'}:{status:'NOT_EVALUATED',slots,reason:'No independently established complete time-level inventory grammar; not evidence of no seats'};
}
export function saveTableCheckResponse(directory,record,bytes){
 mkdirSync(directory,{recursive:true});const id=`${Date.now()}-${saveTableCheckResponse.sequence++}`,bodyPath=resolve(directory,id+'.body.txt');
 writeFileSync(bodyPath,bytes,{flag:'wx'});const row={...record,bodyPath,sha256:hash(bytes),observedAt:new Date().toISOString()};
 const metadataPath=resolve(directory,id+'.metadata.json');writeFileSync(metadataPath,JSON.stringify(row,null,2),{flag:'wx'});appendFileSync(resolve(directory,'responses.jsonl'),JSON.stringify({...row,metadataPath})+'\n');return {...row,metadataPath};
}
saveTableCheckResponse.sequence=0;
export function installTableCheckResponseObserver(Guard,directory,reviewedBytes,{sourceMatches=isTableCheck}={}){
 const rules=JSON.parse(reviewedBytes),original=Guard.prototype.install;
 Guard.prototype.install=async function(context,...args){
  const guard=this,route=context.route;let contextUrl;
  context.route=function(pattern,handler,...options){return route.call(this,pattern,(routeObject,request)=>handler(new Proxy(routeObject,{get(target,key){
   if(key!=='fetch'){const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}
   return async fetchOptions=>{
    const req=target.request(),url=req.url();if(req.resourceType()==='document'&&sourceMatches(url))contextUrl=url;
    const last=guard.snapshotRequests().at(-1),u=new URL(url);
    const descriptor={url,method:req.method(),resourceType:req.resourceType(),body:req.postData()??undefined,contentType:req.headers()['content-type']??'',guardAdmitted:last?.outcome==='ADMITTED'&&last.method===req.method()&&last.origin===u.origin&&last.pathname===u.pathname};
    const replayable=reviewedTableCheckRequest(descriptor,rules)&&(!fetchOptions?.url||fetchOptions.url===url);
    const response=await target.fetch(fetchOptions);
    if(sourceMatches(url)&&/\/(?:availability_calendar_v2|available)$/.test(u.pathname)&&['document','xhr','fetch'].includes(req.resourceType())){
     // Only approved four-field public bodies are persisted. No cookies/auth headers.
     try{saveTableCheckResponse(directory,{contextUrl,url,method:req.method(),resourceType:req.resourceType(),status:response.status(),contentType:response.headers()['content-type']??'',request:replayable&&response.url()===url?descriptor:null,requestSha256:hash(JSON.stringify({url,method:req.method(),body:req.postData()??null})),replayable,reviewedReadsSha256:hash(reviewedBytes)},await response.body());}catch{mkdirSync(directory,{recursive:true});appendFileSync(resolve(directory,'capture-gaps.jsonl'),JSON.stringify({url,reason:'RAW_RESPONSE_CAPTURE_FAILED'})+'\n');}
    }
    return response;
   };
  }}),request),...options);};
  try{return await original.call(this,context,...args);}finally{context.route=route;}
 };
 return ()=>{Guard.prototype.install=original;};
}
export function sourceTableCheckRows(directory){const path=resolve(directory,'tablecheck-source/responses.jsonl');return existsSync(path)?readFileSync(path,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l)):[];}
export async function recheckTableCheck(candidate,artifact,directory,sourceDirectory,transport=fetch){
 const candidateSlug=slug(candidate.restaurant?.sourceIds?.tablecheck??candidate.restaurant?.sourceIds?.TABLECHECK),id=candidate.restaurant.id;
 const sources=sourceTableCheckRows(sourceDirectory).filter(row=>candidateSlug&&(slug(row.contextUrl)===candidateSlug||slug(row.url)===candidateSlug));
 // Save paths/SHA for every observed TableCheck response, even if outlet binding is missing.
 const rawEvidence=sourceTableCheckRows(sourceDirectory).map(r=>({bodyPath:r.bodyPath,metadataPath:r.metadataPath,sha256:r.sha256,url:r.url,contextUrl:r.contextUrl}));
 const rulePath=resolve('.eval-artifacts/checkpoint-c-live-20261020/reviewed-reads.json'),rules=JSON.parse(readFileSync(rulePath));
 const approved=sources.filter(r=>r.request&&r.reviewedReadsSha256===hash(readFileSync(rulePath))&&reviewedTableCheckRequest(r.request,rules));
 const row={candidateId:id,provider:'TABLECHECK',status:'NOT_EVALUATED',evidenceStrength:'RUN_TIME_RAW_ONLY',rawEvidence,reason:'No same-outlet Guard-reviewed inventory request to independently replay'};
 if(!approved.length)return row;
 const original=approved.at(-1);if(hash(readFileSync(original.bodyPath))!==original.sha256)throw Error('TABLECHECK_ORIGINAL_RESPONSE_SHA_MISMATCH');
 const req=original.request;
 try{
  const response=await transport(req.url,{method:req.method,...(req.method==='POST'?{body:req.body,headers:{'content-type':req.contentType}}:{}),redirect:'error',credentials:'omit',signal:AbortSignal.timeout(20000)});
  const observed=saveTableCheckResponse(directory,{url:req.url,method:req.method,status:response.status,request:req,replayedFrom:original.metadataPath,originalResponseSha256:original.sha256,requestSha256:original.requestSha256},Buffer.from(await response.arrayBuffer()));
  const semantic=artifact.materializedCase.semantic,offers=(artifact.finalSnapshot.domainState.availability[id]??[]).filter(o=>o.source==='TABLECHECK');
  const times=offers.map(o=>new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(o.dateTime)));
  const parsed=response.status===200?parseTableCheckRecheck(readFileSync(observed.bodyPath),{candidateSlug,date:semantic.date.value,partySize:semantic.party_size,times}):{status:'NOT_EVALUATED',reason:'Independent recheck HTTP failure',slots:[]};
  return {...row,status:parsed.status,evidenceStrength:'INDEPENDENT_POST_RUN_RECHECK',reason:parsed.reason,parsed,recheck:observed,originalRequestSha256:original.requestSha256};
 }catch(error){return {...row,evidenceStrength:'POST_RUN_RECHECK_FAILED',reason:error.name,originalRequestSha256:original.requestSha256};}
}
export function applyTableCheckReview(evaluation,rows){
 const tablecheck=rows.filter(r=>r.provider==='TABLECHECK');if(!tablecheck.length)return evaluation;
 const assessed=tablecheck.every(r=>r.status==='SUPPORTED');
 const result=structuredClone(evaluation);result.outerTableCheckReview={version:'checkpoint-c-tablecheck-review@1',rows,allIndependentlySupported:assessed};
 if(!assessed&&result.severity.S0_DECLARATION.status!=='PRESENT')result.severity.S0_DECLARATION={status:'NOT_EVALUATED',reasons:['TableCheck claim requires independent recheck or reviewer inspection of frozen run-time raw paths/SHA'],evidenceRefs:tablecheck.flatMap(r=>[...(r.rawEvidence??[]).map(x=>x.metadataPath),...(r.recheck?[r.recheck.metadataPath]:[])])};
 const parts=[result.severity.S0_DECLARATION,result.severity.S0_BOUNDARY];
 result.severity.S0={status:parts.some(p=>p.status==='PRESENT')?'PRESENT':parts.some(p=>p.status==='NOT_EVALUATED')?'NOT_EVALUATED':'ABSENT',reasons:parts.flatMap(p=>p.reasons),evidenceRefs:parts.flatMap(p=>p.evidenceRefs)};
 return result;
}
