import type {G6Delivered} from './evaluator.js';
import {independentVacancy} from './evaluator.js';
import {canonicalOutletId} from './named-outlet-binding.js';
import type {WitnessReceipt} from './witness.js';
export interface PostDeliveryCheck {
 target:G6Delivered;slots:Array<{time:string;exists:boolean|null}>;
 status:'READ'|'NOT_EXECUTED';reason?:'POST_DELIVERY_GET_LIMIT';receipt?:WitnessReceipt;
}
/** One public calendar per source outlet/day/party; first displayed time is svt. */
export async function readPostDeliveryWitnesses(deliveries:readonly G6Delivered[],read:(first:G6Delivered)=>Promise<WitnessReceipt>):Promise<PostDeliveryCheck[]>{
 const groups=new Map<string,G6Delivered[]>();
 for(const d of deliveries.filter(d=>d.provider==='TABELOG')){
  const key=JSON.stringify([d.provider,canonicalOutletId('TABELOG',d.sourceEntityId),d.date,d.partySize]);
  const group=groups.get(key)??[];group.push(d);groups.set(key,group);
 }
 const results:PostDeliveryCheck[]=[];
 for(const group of groups.values()){
  const target=group[0]!,times=[...new Set(group.map(d=>d.time))];
  if(results.filter(r=>r.status==='READ').length>=2){results.push({target,status:'NOT_EXECUTED',reason:'POST_DELIVERY_GET_LIMIT',slots:times.map(time=>({time,exists:null}))});continue;}
  const receipt=await read(target),observed=receipt.vacancy?independentVacancy(receipt.vacancy,target):undefined;
  results.push({target,status:'READ',receipt,slots:times.map(time=>({time,exists:observed?.known?observed.slots.includes(time):null}))});
 }
 return results;
}
