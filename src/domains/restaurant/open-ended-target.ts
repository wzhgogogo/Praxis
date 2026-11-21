import type {RestaurantIntentDraft,RestaurantIntentPatch} from './contracts.js';
const normalize=(value:string)=>value.normalize('NFKC').trim().toLocaleLowerCase('en-US');
const escape=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function removeTerm(query:string,term:string,negative=false){
 const word=escape(term.normalize('NFKC').trim()).replace(/\s+/g,'\\s+');if(!word)return query;
 const boundary=/^[\x00-\x7F]+$/.test(term)?['(?<![\\p{L}\\p{N}])','(?![\\p{L}\\p{N}])']:['',''];
 return query.replace(new RegExp(boundary[0]+(negative?'(?:(?:no|not|without|avoid)\\s+)?':'')+word+boundary[1],'giu'),' ');
}
/** Pure maintenance of the inherited open-ended query; no model or name rewriting. */
export function maintainOpenEndedTargetQuery(current:RestaurantIntentDraft|undefined,next:RestaurantIntentDraft,patch:RestaurantIntentPatch):void{
 if(Object.hasOwn(patch,'target')||!current?.target||next.target?.selectionScope!=='OPEN_ENDED')return;
 if(!['area','removeCriteria','replaceCriteria','addCriteria'].some(key=>Object.hasOwn(patch,key)))return;
 const key=(item:RestaurantIntentDraft['criteria'][number])=>normalize(item.text)+'\0'+item.polarity;
 if(current.area?.query===next.area?.query&&JSON.stringify(current.criteria.map(key))===JSON.stringify(next.criteria.map(key)))return;
 let query=current.target.query.normalize('NFKC');
 const retained=new Set(next.criteria.map(key));
 for(const item of current.criteria)if(!retained.has(key(item)))query=removeTerm(query,item.text,item.polarity==='NEGATIVE');
 for(const item of next.criteria)if(item.polarity==='NEGATIVE')query=removeTerm(query,item.text,true);
 if(current.area?.query)query=removeTerm(query,current.area.query);
 query=query.replace(/\s+/g,' ').replace(/^\s*(?:find|show|recommend|look for|search for)\s+/i,'')
  .replace(/(?:\s+(?:in|near|around|at)|[,;:])\s*$/gi,'').trim();
 if(!query)query='restaurant';
 for(const item of next.criteria)if(item.polarity==='POSITIVE'&&!normalize(query).includes(normalize(item.text)))query+=' '+item.text.trim();
 if(next.area?.query)query+=' in '+next.area.query.trim();
 next.target={...next.target,query:query.trim()};
}
