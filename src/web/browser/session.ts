import { key } from "./navigation.js";
import { setMessage } from "./entry.js";
import { $, show, state } from "./runtime.js";
import { api, casePath, reportCaseError } from "./transport.js";
export function draftKey(){return state.view?.case.caseId??'HOME';}
export function saveDraft(){
  const id=draftKey(),value=$('message').value;
  if(value)state.drafts.set(id,value);else state.drafts.delete(id);
}
export function restoreDraft(id){setMessage(state.drafts.get(id)||'');}
export async function claimFeedback(){
 if(!state.view)return;
 const nav=state.nav,caseId=state.view.case.caseId,returnKey=key(caseId)+':return';
 if(state.signingOut||state.feedbackPrompts.has(caseId)||state.claiming.has(caseId))return;
 state.claiming.add(caseId);
 try{
   const p=await api(casePath(caseId)+'/booking-feedback/claim',{method:'POST',body:'{}'});
   localStorage.removeItem(returnKey);
   if(p.prompt)state.feedbackPrompts.set(caseId,p.prompt);
   if(draftKey()===caseId&&!state.signingOut)show('feedback',state.feedbackPrompts.has(caseId));
 }catch(error){await reportCaseError(error,nav,caseId);}
 finally{state.claiming.delete(caseId);}
}
