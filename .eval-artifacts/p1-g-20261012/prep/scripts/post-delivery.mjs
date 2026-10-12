import{mkdir,writeFile}from'node:fs/promises';import{resolve}from'node:path';import{createHash}from'node:crypto';
export function deliveryChecks(artifact){
 const d=artifact.finalSnapshot?.domainState??{};const items=[];
 for(const id of d.presentedResults?.candidateIds??[]){
  const restaurant=d.candidates?.find(c=>c.restaurant.id===id)?.restaurant;
  const offers=d.availability?.[id]??[];
  const own=offers.filter(o=>o.source==='TABELOG');
  if(!own.length){items.push({candidateId:id,status:offers.some(o=>o.source==='TABLECHECK')?'TABLECHECK_RAW_TRACE_REVIEW':'NO_DISPLAYED_TABELOG_SLOT',restaurant});continue;}
  const bindings=own.map(o=>{const f=new Intl.DateTimeFormat('en-CA',{timeZone:o.timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(o.dateTime));const part=k=>f.find(p=>p.type===k)?.value;return{date:`${part('year')}${part('month')}${part('day')}`,party:String(o.partySize),time:`${part('hour')}:${part('minute')}`,offerId:o.id};});
  const groups=new Set(bindings.map(b=>`${b.date}:${b.party}`));if(groups.size!==1)throw Error('DISPLAYED_BINDING_AMBIGUOUS');
  const rst_id=restaurant?.sourceIds?.tabelog?.split('/').at(-1);if(!/^\d+$/.test(rst_id??''))throw Error('DISPLAYED_TABELOG_ID_MISSING');
  const first=bindings[0];items.push({candidateId:id,status:'TABELOG_READ_PENDING',restaurant,parameters:{rst_id,svd:first.date,svps:first.party,svt:first.time.replace(':','')},displayedTimes:[...new Set(bindings.map(b=>b.time))],offerIds:bindings.map(b=>b.offerId)});
 }
 return items;
}
export function selectionComparison(body,displayedTimes){
 try{const json=JSON.parse(body);if(!json.selection||typeof json.selection!=='object')return{status:'SELECTION_UNOBSERVED',missingTimes:null};const times=Object.values(json.selection).map(s=>s?.time).filter(t=>typeof t==='string');const missingTimes=displayedTimes.filter(t=>!times.includes(t));return{status:missingTimes.length?'DISPLAYED_TIME_NOT_IN_SELECTION':'DISPLAYED_TIMES_PRESENT',selectionTimes:times,missingTimes};}catch{return{status:'SELECTION_UNOBSERVED',missingTimes:null};}
}
export async function captureVacancy(parameters,directory,stem,transport=fetch){
 await mkdir(directory,{recursive:true});const url=new URL('https://tabelog.com/en/booking/calendar/find_vacancy/');for(const k of ['rst_id','svd','svps','svt']){if(typeof parameters[k]!=='string'||!/^\d+$/.test(parameters[k]))throw Error('INVALID_VACANCY_PARAMETER');url.searchParams.set(k,parameters[k]);}
 const item={method:'GET',url:url.toString(),parameters,requestedAt:new Date().toISOString()};let body;
 try{const response=await transport(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000)});const bytes=Buffer.from(await response.arrayBuffer());body=bytes.toString('utf8');item.status=response.status;item.contentType=response.headers.get('content-type');item.sha256=createHash('sha256').update(bytes).digest('hex');item.bodyPath=resolve(directory,`${stem}.body.txt`);await writeFile(item.bodyPath,bytes,{flag:'wx'});}catch(e){item.error=e.name;}
 item.finishedAt=new Date().toISOString();item.metadataPath=resolve(directory,`${stem}.metadata.json`);await writeFile(item.metadataPath,JSON.stringify(item,null,2),{flag:'wx'});return{item,body};
}
export async function verifyDeliveries(artifact,directory,transport=fetch){
 const plans=deliveryChecks(artifact);const rows=[];let stop=null;
 for(const plan of plans){if(plan.status!=='TABELOG_READ_PENDING'){rows.push(plan);continue;}
  const {item,body}=await captureVacancy(plan.parameters,directory,plan.parameters.rst_id,transport);const comparison=item.status===200?selectionComparison(body,plan.displayedTimes):{status:'SELECTION_UNOBSERVED',missingTimes:null};rows.push({...plan,raw:item,comparison});
  if(comparison.status!=='DISPLAYED_TIMES_PRESENT'){stop={code:comparison.status,candidateId:plan.candidateId,missingTimes:comparison.missingTimes,interpretation:'NONE; stop and independent review required'};break;}
 }
 return{rows,stop};
}
