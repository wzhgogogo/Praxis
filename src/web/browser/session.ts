import type { FeedbackPrompt } from './view-contracts.js';
import { $, requireView, show, state } from "./runtime.js";
import { key } from "./position.js";
import { setMessage } from "./composer.js";
import { actions } from "./actions.js";
export function draftKey(){return state.view?.case.caseId??'HOME';}
export function saveDraft(){
  const id=draftKey(),value=$('message').value;
  if(value)state.drafts.set(id,value);else state.drafts.delete(id);
}
export function restoreDraft(id:string){setMessage(state.drafts.get(id)||'');}
export async function claimFeedback(){
 if(!state.view)return;
 const nav=state.nav,caseId=requireView().case.caseId,returnKey=key(caseId)+':return';
 const returning=localStorage.getItem(returnKey),shown=state.feedbackPrompts.get(caseId);
 if(state.signingOut||state.claiming.has(caseId)||shown&&(!returning||shown.departure.id===returning))return;
 state.claiming.add(caseId);
 try{
   const p=await actions.api<{prompt?:FeedbackPrompt}>(actions.casePath(caseId)+'/booking-feedback/claim',{method:'POST',body:'{}'});
   if(localStorage.getItem(returnKey)===returning)localStorage.removeItem(returnKey);
   if(p.prompt)state.feedbackPrompts.set(caseId,p.prompt);
   if(draftKey()===caseId&&!state.signingOut)show('feedback',state.feedbackPrompts.has(caseId));
 }catch(error){await actions.reportCaseError(error,nav,caseId);}
 finally{state.claiming.delete(caseId);}
}
