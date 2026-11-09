import type {RestaurantAvailabilityRequest} from '../../domains/restaurant/contracts.js';
import type {AvailabilitySourceBinding} from './availability-source-resolver.js';

/** Navigation cost gate only. Every entered page still uses normal identity,
 * Guard and inventory verification. No source host/domain list is duplicated. */
export function observedSourceEntrance(request:RestaurantAvailabilityRequest,binding:AvailabilitySourceBinding,observedAfter:string):string|undefined{
 const candidate=request.candidates[0]?.restaurant;if(!candidate)return;
 const current=(request.sourceEvidence??[]).filter(e=>e.candidateId===candidate.id&&Number.isFinite(Date.parse(e.observedAt))&&Date.parse(e.observedAt)>=Date.parse(observedAfter));
 const urls:string[]=[];
 for(const e of current){
  if(e.provider==='GOOGLE_PLACES'&&e.sourceEntityId===candidate.sourceIds.googlePlaces){
   if(e.evidenceId===candidate.provenance.sourceIds&&e.kind==='DISCOVERY'&&candidate.sourceIds.googleWebsiteUri)urls.push(candidate.sourceIds.googleWebsiteUri);
   if(typeof e.claims.websiteUri==='string'&&current.some(i=>i.kind==='ENTITY_MATCH'&&i.entityMatch?.confidence==='HIGH'&&i.sourceEntityId===e.sourceEntityId))urls.push(e.claims.websiteUri);
  }
  if(e.kind==='ENTITY_MATCH'&&e.entityMatch?.confidence==='HIGH'&&e.provider!=='MODEL_JUDGMENT'){
   if(e.provider===binding.provider.provider&&e.sourceUrl)urls.push(e.sourceUrl);
   if(Array.isArray(e.claims.observedSourceLinks))urls.push(...e.claims.observedSourceLinks);
  }
 }
 return urls.find(value=>{try{
  const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.port||!binding.pack.documentOrigins.includes(u.origin))return false;
  return binding.pack.availability?.candidatePath({...candidate,sourceIds:{googleWebsiteUri:value}})==='DIRECT_SOURCE_PAGE';
 }catch{return false;}});
}
