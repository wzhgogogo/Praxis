// Evaluation-side extraction from the merchant page already being read. No extra request or product policy.
import {createHash} from 'node:crypto';
export function publicBookingRead(html,sourceUrl){
 const source=new URL(sourceUrl),rst=source.pathname.match(/\/(\d{8})\/$/)?.[1];
 const attr=(raw,key)=>raw.match(new RegExp(`\\b${key}=["']([^"']*)["']`,'i'))?.[1]?.replaceAll('&amp;','&');
 const tags=[...html.matchAll(/<[a-z][^>]*\bdata-booking-enabled=["'][^"']*["'][^>]*>/gi)];
 const rows=tags.flatMap(m=>{const raw=m[0],id=attr(raw,'data-rst-id'),enabled=attr(raw,'data-booking-enabled'),value=attr(raw,'data-fetch-url');if(id!==rst||enabled!=='1'||!value)return [];try{const u=new URL(value,source);if(u.origin!==source.origin||u.pathname!=='/en/booking/calendar/find_vacancy/'||u.search||u.hash)return [];return [{rst_id:id,url:u.href,enabled:true,raw,rawSha256:createHash('sha256').update(raw).digest('hex'),htmlCharacterOffset:m.index}];}catch{return [];}});
 const unique=rows.filter((r,i)=>rows.findIndex(q=>q.rst_id===r.rst_id&&q.url===r.url)===i);
 return unique.length===1?{status:'SOURCE_BOUND_READ_EXPOSED',...unique[0]}:{status:'NOT_EXPOSED_OR_NOT_UNIQUELY_BOUND',sourceUrl,rule:'No inference about other reservation channels; do not manufacture this merchant API from an unrelated restaurant ID.'};
}
