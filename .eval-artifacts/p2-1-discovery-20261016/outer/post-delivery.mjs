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
// A post-run plan, not a claim that the registered inventory is still current.
// Only pre-registered outlets and the unchanged materialized request may bind it.
export function zeroDeliveryWitnessChecks(artifact,registry){
 const domain=artifact?.finalSnapshot?.domainState;
 if(!domain)return{status:'SKIP_MISSING_RESULT',plans:[]};
 const presented=domain.presentedResults?.candidateIds;
 if(presented&&!Array.isArray(presented))return{status:'BLOCKED_DELIVERY_RECORD',plans:[]};
 if(presented?.length)return{status:'SKIP_DELIVERED',plans:[]};
 const id=artifact.materializedCase?.id;
 const entries=registry?.variants?.filter(entry=>entry.variantId===id)??[];
 if(!entries.length)return{status:'SKIP_NO_REGISTERED_WITNESS',plans:[]};
 if(entries.length!==1)return{status:'BLOCKED_AMBIGUOUS_REGISTRATION',plans:[]};
 const entry=entries[0],semantic=artifact.materializedCase?.semantic;
 const date=entry.request?.match(/\b\d{4}-\d{2}-\d{2}\b/)?.[0];
 const time=entry.request?.match(/\b\d{2}:\d{2}\b/)?.[0];
 const party=entry.request?.match(/\bx(\d+)\b/)?.[1];
 if(!date||!time||!party||semantic?.date?.value!==date||semantic?.time?.value!==time||String(semantic?.party_size)!==party)
  return{status:'BLOCKED_REGISTERED_REQUEST_MISMATCH',variantId:id,plans:[]};
 if(!Array.isArray(entry.witnesses)||!entry.witnesses.length)return{status:'BLOCKED_EMPTY_REGISTRATION',variantId:id,plans:[]};
 const plans=[];
 for(const witness of entry.witnesses){
  let url;try{url=new URL(witness.sourceUrl)}catch{return{status:'BLOCKED_UNAPPROVED_WITNESS',variantId:id,plans:[]}}
  const rst_id=url.pathname.match(/^\/en\/[a-z]+\/(?:A\d+\/)+(\d{8})\/(?:party\/)?$/)?.[1];
  if(witness.bookingSource!=='TABELOG'||url.origin!=='https://tabelog.com'||!rst_id||url.search||url.hash)
   return{status:'BLOCKED_UNAPPROVED_WITNESS',variantId:id,plans:[]};
  if(!plans.some(plan=>plan.parameters.rst_id===rst_id))plans.push({name:witness.outletName,parameters:{rst_id,svd:date.replaceAll('-',''),svps:party,svt:time.replace(':','')}});
 }
 return{status:'READ_PENDING',variantId:id,plans};
}
export async function verifyDeliveries(artifact,directory,transport=fetch,registry){
 const witnessPlan=zeroDeliveryWitnessChecks(artifact,registry),witnessRaw=[];
 if(witnessPlan.status==='READ_PENDING'){
  for(const plan of witnessPlan.plans){const {item}=await captureVacancy(plan.parameters,directory,plan.parameters.rst_id,transport);witnessRaw.push({name:plan.name,...item});}
  const witnessManifestPath=resolve(directory,'manifest.json');
  await writeFile(witnessManifestPath,JSON.stringify({mode:'POST_RUN_REGISTERED_WITNESS_GET',variantId:witnessPlan.variantId,requests:witnessRaw.length,rows:witnessRaw},null,2),{flag:'wx'});
  return{rows:[],stop:null,witnessPlan,witnessRaw,witnessManifestPath};
 }
 if(witnessPlan.status.startsWith('BLOCKED'))return{rows:[],stop:{code:witnessPlan.status},witnessPlan,witnessRaw};
 if(witnessPlan.status!=='SKIP_DELIVERED')return{rows:[],stop:null,witnessPlan,witnessRaw};
 const plans=deliveryChecks(artifact);const rows=[];let stop=null;
 for(const plan of plans){if(plan.status!=='TABELOG_READ_PENDING'){rows.push(plan);continue;}
  const {item,body}=await captureVacancy(plan.parameters,directory,plan.parameters.rst_id,transport);const comparison=item.status===200?selectionComparison(body,plan.displayedTimes):{status:'SELECTION_UNOBSERVED',missingTimes:null};rows.push({...plan,raw:item,comparison});
  if(comparison.status!=='DISPLAYED_TIMES_PRESENT'){stop={code:comparison.status,candidateId:plan.candidateId,missingTimes:comparison.missingTimes,interpretation:'NONE; stop and independent review required'};break;}
 }
 return{rows,stop,witnessPlan,witnessRaw};
}
