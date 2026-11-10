import type {RestaurantTaskState} from './contracts.js';
import {restaurantCurrentFactEvidence} from './read-assessment.js';

/** Ordering only: literal source leads never discharge a semantic HARD condition. */
export function restaurantCandidateReadPriority(state:Readonly<RestaurantTaskState>,id:string):number{
 const criteria=(state.intentDraft?.criteria??state.intent?.criteria??[]).filter(c=>c.strength==='HARD'&&c.polarity==='POSITIVE');
 const key=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const facts=restaurantCurrentFactEvidence(state,id);
 if(criteria.length&&criteria.every(c=>facts.some(e=>Array.isArray(e.claims.verifiedHardCriteria)&&e.claims.verifiedHardCriteria.some(v=>typeof v==='string'&&key(v)===key(c.text)))))return 0;
 const discovery=state.readEvidence.filter(e=>e.candidateId===id&&e.kind==='DISCOVERY');
 const categories=[...facts.flatMap(e=>e.entityMatch?.confidence==='HIGH'?(e.sourceFieldQuotes??[]).filter(q=>q.field==='CATEGORY'&&q.sourceUrl===e.sourceUrl).map(q=>q.quote):[]),...discovery.flatMap(e=>[e.claims.primaryType,...(Array.isArray(e.claims.types)?e.claims.types:[]),...(Array.isArray(e.claims.sourceCategories)?e.claims.sourceCategories:[])].filter((v):v is string=>typeof v==='string'))];
 if(criteria.length&&criteria.every(c=>categories.some(q=>(' '+key(q)+' ').includes(' '+key(c.text)+' '))))return 1;
 return discovery.some(e=>e.claims.discoveryScopeStatus==='OBSERVED')?2:3;
}
