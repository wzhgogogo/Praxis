import type { CaseSummary } from './view-contracts.js';
import { element, state } from "./runtime.js";
export function sourceName(value:string|undefined,sourceUrl?:string){
 let host='';try{const url=new URL(sourceUrl??'');if(['https:','http:'].includes(url.protocol))host=url.hostname.replace(/^www\./i,'');}catch{/* No observed source URL. */}
 if(value==='GOOGLE_PLACES')return 'Google Maps';
 if(value==='TABELOG'||host==='tabelog.com'||host.endsWith('.tabelog.com'))return 'Tabelog';
 if(value==='TABLECHECK'||host==='tablecheck.com'||host.endsWith('.tablecheck.com'))return 'TableCheck';
 if(value==='RESTAURANT_WEBSITE')return host||'Source page';
 if(value?.toUpperCase()==='FIXTURE')return 'Fixture';
 return value?displayTitle(value.toLocaleLowerCase('en-US').replace(/_+/g,' ')):'Source page';
}
export function safeLink(value:string|undefined){try{const u=new URL(value??'');return u.protocol==='https:'?u.href:null;}catch{return null;}}
export function link(label:string,url:string|undefined){const n=element('a',label);const href=safeLink(url);if(href){n.href=href;n.target='_blank';n.rel='noopener noreferrer';}return n;}
export function money(value:number){return '¥'+Number(value).toLocaleString('en-US');}
export function displayTime(value:string){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
export function displayDate(value:string){return new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',weekday:'short',month:'short',day:'numeric'}).format(new Date(value.length===10?value+'T12:00:00+09:00':value));}
export function readAt(value:string){return 'Checked '+new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',month:'short',day:'numeric'}).format(new Date(value));}
export function availabilityTime(value:string){return displayDate(value)+' '+displayTime(value);}
export function displayTitle(value:string){return String(value).replace(/\p{L}/u,letter=>letter.toLocaleUpperCase('en-US'));}
export function caseLabel(summary:CaseSummary){
  if(state.preview?.caseId===summary.caseId||summary.status==='ACTIVE')return 'In progress';
  switch(summary.phase){
    case 'PRESENT_RESULTS': return 'Ready';
    case 'NEEDS_INPUT': return 'Needs details';
    case 'NO_VERIFIED_RESULT': return 'No verified results';
    case 'FAILED': return summary.stopped?'Stopped':'Failed';
    default: return summary.status==='NEEDS_YOU'?'Needs details':summary.status==='WAITING'?'Waiting':'Completed';
  }
}

export function citationSourceName(value:string){
 try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol))return 'Open page';const host=url.hostname.replace(/^www\./i,'');
 if(host==='tabelog.com'||host.endsWith('.tabelog.com'))return 'Tabelog';if(host==='tablecheck.com'||host.endsWith('.tablecheck.com'))return 'TableCheck';
 if(['maps.google.com','maps.app.goo.gl','goo.gl'].includes(host)||host==='google.com'&&url.pathname.startsWith('/maps'))return 'Google Maps';return host||'Open page';
 }catch{return 'Open page';}
}
