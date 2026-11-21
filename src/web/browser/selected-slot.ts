import type { Offer } from './view-contracts.js';
import { report, requireUser, requireView, state } from "./runtime.js";
import { projectSelection, readSelection, reconfirmationKey, selectionKey } from "./slot-selection.js";
export function freshOffers(id:string|null){return (id?requireView().restaurant.availability[id]||[]:[]).filter(o=>!o.displayExpiresAt||Date.parse(o.displayExpiresAt)>Date.now());}
export function needsSlotReselection(id:string|null){return state.ui.reselectSlot===true&&state.ui.candidateId===id&&freshOffers(id).length>0;}
export function availabilityExpired(id:string|null){
 if(!id)return false;
 const r=requireView().restaurant,expiry=r.availabilityChecks[id]?.displayExpiresAt;
 return !freshOffers(id).length&&(!!(expiry&&Date.parse(expiry)<=Date.now())||!!r.availability[id]?.length);
}
export function offerFor(id:string|null){
 const fresh=freshOffers(id);
 return state.ui.selectedSlot||state.ui.reconfirmSlot?fresh.find(o=>o.id===state.ui.offerId):fresh[0];
}
export function clearSlotSelection(){state.ui.offerId=null;state.ui.reselectSlot=false;state.ui.reconfirmSlot=false;delete state.ui.selectedSlot;}
export function revisionScope(){return {userId:requireUser().id,caseId:requireView().case.caseId,revision:requireView().restaurant.requirementRevision};}
export function reconfirmationRequired(){return !!sessionStorage.getItem(reconfirmationKey(revisionScope()));}
export function requireReconfirmation(){sessionStorage.setItem(reconfirmationKey(revisionScope()),JSON.stringify({kind:'RECONFIRM'}));}
export function forgetSlotSelection(){
 if(state.view&&state.user)sessionStorage.removeItem(reconfirmationKey(revisionScope()));
 if(state.view&&state.user&&state.ui.candidateId)sessionStorage.removeItem(selectionKey(selectionScope()));
 clearSlotSelection();
}
export function selectionScope(){
 if(!state.ui.candidateId)throw new Error('No selected restaurant');
 return {userId:requireUser().id,caseId:requireView().case.caseId,revision:requireView().restaurant.requirementRevision,candidateId:state.ui.candidateId};
}
export function selectSlot(offer:Offer){
 sessionStorage.setItem(selectionKey(selectionScope()),JSON.stringify({kind:'SELECTED',dateTime:offer.dateTime,partySize:offer.partySize}));
 sessionStorage.removeItem(reconfirmationKey(revisionScope()));
 reconcileSlot();
}
export function reconcileSlot(){
 if(!state.view||!state.user||!state.ui.candidateId)return;
 const selected=readSelection(sessionStorage,selectionScope());
 state.ui.selectedSlot=selected?.kind==='SELECTED'?{dateTime:selected.dateTime,partySize:selected.partySize}:undefined;
 state.ui.reconfirmSlot=selected?.kind==='RECONFIRM';
 if(requireView().restaurant.progress.active&&!state.ui.reconfirmSlot)return;
 const choice=projectSelection(selected,freshOffers(state.ui.candidateId));
 state.ui.offerId=choice.offerId??null;
 state.ui.reselectSlot=choice.reselect;
 if(choice.reselect&&state.ui.view==='HANDOFF'){
   state.ui.view='CANDIDATES';state.handoffKey='';
   if(choice.reselect)report(new Error("Availability couldn't be confirmed. Try again."));
 }
}
export function handoffs(){return (requireView().restaurant.bookingHandoffs||[]).filter(h=>h.candidateId===state.ui.candidateId&&Date.parse(h.displayExpiresAt)>Date.now());}
export function currentHandoff(){if(state.ui.reconfirmSlot)return undefined;const list=handoffs();return state.ui.selectedSlot?list.find(h=>h.offerId===state.ui.offerId):list[0];}
