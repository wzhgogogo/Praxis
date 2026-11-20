import type { CaseSummary } from './view-contracts.js';
import { element, state } from "./runtime.js";
export function sourceName(value:string|undefined){return (new Map(Object.entries({TABLECHECK:'TableCheck',TABELOG:'Tabelog',GOOGLE_PLACES:'Google Maps',FIXTURE:'Fixture',fixture:'Fixture'}))).get(value??'')||String(value||'Source');}
export function safeLink(value:string|undefined){try{const u=new URL(value??'');return u.protocol==='https:'?u.href:null;}catch{return null;}}
export function link(label:string,url:string|undefined){const n=element('a',label);const href=safeLink(url);if(href){n.href=href;n.target='_blank';n.rel='noopener noreferrer';}return n;}
export function money(value:number){return '¥'+Number(value).toLocaleString('en-US');}
export function displayTime(value:string){return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value));}
export function displayDate(value:string){return new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',weekday:'short',month:'short',day:'numeric'}).format(new Date(value.length===10?value+'T12:00:00+09:00':value));}
export function readAt(value:string){return 'Read at: '+displayDate(value)+' · '+displayTime(value)+' JST';}
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
