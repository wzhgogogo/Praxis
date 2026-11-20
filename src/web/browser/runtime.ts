
export const $ = (id: string): any => document.getElementById(id);

export const state: any = {sidebarCollapsed:false,user:null, cases:new Map(), drafts:new Map(), view:null, nav:0, stream:null, streamCaseId:null, caseListTimer:null, caseListSyncing:false, signingOut:false, deferredView:null, blocked:false, ui:{view:'CANDIDATES',candidateId:null,reselectSlot:false}, expiry:null, feedbackPrompts:new Map(), detailKey:'',questionKey:'',handoffKey:'',pendingQuestion:null,asking:false,askingId:null,locating:null,claiming:new Set(),diffKey:'',pendingCase:null,preview:null,entryPace:null};
export function requestId(){
  const crypto=globalThis.crypto;
  if(crypto?.randomUUID)return crypto.randomUUID();
  const bytes=new Uint8Array(16);
  if(crypto?.getRandomValues)crypto.getRandomValues(bytes);
  else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
  bytes[6]=(bytes[6]&15)|64;
  bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
  return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
export const text = (id,value) => {const node=$(id), next=String(value == null?'':value);if(node.textContent!==next)node.textContent=next;};
export const show = (id,visible) => {$(id).hidden=!visible;};
export const element = (tag: string,value?: unknown,className?: string): any => {const n=document.createElement(tag);if(value!==undefined)n.textContent=String(value);if(className)n.className=className;return n;};
export function report(error){
 const alert=$('error');text('error',error.message||'Please try again.');show('error',true);
 requestAnimationFrame(()=>{
   if(!alert.hidden&&!$('case-workspace').hidden&&$('case-workspace').contains(alert))alert.scrollIntoView({block:'nearest',behavior:'instant'});
 });
}
export function clearError(){text('error','');show('error',false);}
export const desktopLayout=matchMedia('(min-width:960px)');
