// Reuse approved four-parameter transport. No booking links are opened.
import {captureVacancy,deliveryChecks} from '../p2-1-discovery-20261016/outer/post-delivery.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {recheckTableCheck} from './tablecheck-post-review.mjs';
export async function postCheck(artifact,registry,directory,transport=fetch){
 await mkdir(directory,{recursive:false});const rows=[],rawRows=[];
 const ids=artifact.finalSnapshot?.domainState?.presentedResults?.candidateIds??[];
 const v=registry.variants.find(v=>v.variantId===artifact.materializedCase.id);
 if(!v)throw Error('POST_REGISTERED_CASE_REQUIRED');
 const plans=ids.length?deliveryChecks(artifact):v.witnesses.map(w=>({status:'TABELOG_READ_PENDING',name:w.outletName,parameters:{rst_id:new URL(w.sourceUrl).pathname.match(/(\d{8})\/$/)[1],svd:v.date.replaceAll('-',''),svps:String(v.partySize),svt:v.earliest.replace(':','')},displayedTimes:[]}));
 for(const plan of plans){
  if(plan.status!=='TABELOG_READ_PENDING'){const candidate=artifact.finalSnapshot.domainState.candidates.find(c=>c.restaurant.id===plan.candidateId);rows.push(candidate?await recheckTableCheck(candidate,artifact,directory,resolve(directory,'..'),transport):{...plan,provider:'TABLECHECK',status:'NOT_EVALUATED',reason:'Missing displayed candidate'});continue;}
  const {item}=await captureVacancy(plan.parameters,directory,plan.parameters.rst_id,transport);
  const w=v.witnesses.find(w=>new URL(w.sourceUrl).pathname.includes(plan.parameters.rst_id));
  rows.push({...plan,raw:item});if(w)rawRows.push({name:w.outletName,...item});
 }
 // Preserve every registered witness in oracle even if a delivery used a different outlet.
 const manifestPath=resolve(directory,'manifest.json');
 await writeFile(manifestPath,JSON.stringify({rows:rawRows},null,2),{flag:'wx'});
 const result={rows,manifestPath};await writeFile(resolve(directory,'post-check.json'),JSON.stringify(result,null,2),{flag:'wx'});return result;
}
