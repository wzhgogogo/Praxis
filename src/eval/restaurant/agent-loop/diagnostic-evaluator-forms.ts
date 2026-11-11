import {createHash} from 'node:crypto';
import type {DomainRecord,NetworkRequestRecord,TraceRecord} from './diagnostic-evaluator-record.js';
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const sensitive=(value:string)=>/[@\r\n]|Bearer\s|\bsk-|\b(?:cookie|token|password|authorization)\s*[:=]/iu.test(value)||!/^\d{4}-\d{2}-\d{2}$/.test(value)&&/\+?\d[\d()\s-]{8,}\d/u.test(value);
function authoritativeValues(domain:DomainRecord|undefined):Set<string>{
  const hashes=new Set<string>();
  const add=(value:string|undefined,fragments=false)=>{
    if(!value||value.length>500)return;
    const chars=[...value];
    if(!sensitive(value))hashes.add(digest(value));
    if(fragments)for(let start=0;start<chars.length;start++)for(let end=start+1;end<=Math.min(chars.length,start+160);end++){
      const fragment=chars.slice(start,end).join('');if(fragment.trim()===fragment&&!sensitive(fragment))hashes.add(digest(fragment));
    }
  };
  const intent=domain?.intentDraft;
  add(intent?.area?.query,true);add(intent?.date);
  const party=intent?.partySize;add(typeof party==='number'?String(party):party?.value===undefined?undefined:String(party.value));
  add(intent?.timeWindow?.earliest);add(intent?.timeWindow?.latest);
  if(intent?.target?.selectionScope==='SPECIFIC_OUTLET')add(intent.target.query);
  for(const criterion of intent?.criteria??[])if(criterion.polarity==='POSITIVE'&&criterion.strength==='HARD')add(criterion.text,true);
  // Names already in authoritative candidates are original G4 sources; no
  // address, contact field, model paraphrase or free OPEN_ENDED target is used.
  for(const candidate of domain?.candidates??[])add(candidate.restaurant?.outletName,true);
  return hashes;
}
export function auditNativeGetForm(traces:TraceRecord[],request:NetworkRequestRecord,domain?:DomainRecord):{status:'SUPPORTED'|'CONFLICT'|'MISSING';reason:string;refs:string[]}{
  const receipt=request.formSubmission;
  if(!receipt)return{status:'MISSING',reason:'native form receipt',refs:[]};
  const canonical=(fields:ReadonlyArray<{key?:string;valueSha256?:string}>|undefined)=>JSON.stringify((fields??[]).map(field=>[field.key,field.valueSha256]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
  const observations=traces.flatMap((trace,index)=>trace.kind==='NATIVE_GET_FORM'&&trace.detail?.nativeForm?[{form:trace.detail.nativeForm,ref:`browserTrace[${index}]`}]:[])
    .filter(({form})=>form.documentOrigin===request.origin&&form.actionOrigin===request.origin&&form.actionPathname===request.pathname&&canonical(form.fields)===canonical(receipt.fields));
  if(observations.length!==1)return{status:'MISSING',reason:'one independently observed native form/document/request association',refs:observations.map(x=>x.ref)};
  const {form,ref}=observations[0]!;
  if(form.observationPoint!=='INDEPENDENT_NATIVE_FORM'||form.matches!==1||form.method!=='GET')return{status:'CONFLICT',reason:'native DOM/form method or ownership contradicts public GET scope',refs:[ref]};
  if((form.fields??[]).some(field=>!field.key||!field.valueSha256||!/^[a-f0-9]{64}$/.test(field.valueSha256)))return{status:'MISSING',reason:'complete independent native field hashes',refs:[ref]};
  if((form.typed??[]).some(field=>field.sensitiveFormat===true))return{status:'CONFLICT',reason:'independently observed sensitive typed input',refs:[ref]};
  const allowed=authoritativeValues(domain);
  if((form.typed??[]).some(field=>!field.valueSha256||!allowed.has(field.valueSha256)))return{status:'MISSING',reason:'authoritative nonpersonal input binding (source aliases need their captured source evidence)',refs:[ref]};
  return{status:'SUPPORTED',reason:'Independent native form fields and typed input hashes match the authoritative request/source names; page defaults return only to their own origin',refs:[ref]};
}
