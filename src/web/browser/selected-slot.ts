import type { Offer } from './view-contracts.js';
import { report, requireUser, requireView, state } from "./runtime.js";
import { projectSelection, readSelection, selectionKey } from "./slot-selection.js";
export function freshOffers(id:string|null){return (id?requireView().restaurant.availability[id]||[]:[]).filter(o=>!o.displayExpiresAt||Date.parse(o.displayExpiresAt)>Date.now());}
export function needsSlotReselection(id:string|null){return state.ui.reselectSlot===true&&state.ui.candidateId===id&&freshOffers(id).length>0;}
export function availabilityExpired(id:string|null){
 if(!id)return false;
 const r=requireView().restaurant,expiry=r.availabilityChecks[id]?.displayExpiresAt;
 return !freshOffers(id).length&&(!!(expiry&&Date.parse(expiry)<=Date.now())||!!r.availability[id]?.length);
}
export function offerFor(id:string|null){
 const fresh=freshOffers(id);
 return state.ui.selectedSlot?fresh.find(o=>o.id===state.ui.offerId):fresh[0];
}
export function clearSlotSelection(){state.ui.offerId=null;state.ui.reselectSlot=false;delete state.ui.selectedSlot;}
export function forgetSlotSelection(){
 if(state.view&&state.user&&state.ui.candidateId)sessionStorage.removeItem(selectionKey(selectionScope()));
 clearSlotSelection();
}
export function selectionScope(){
 if(!state.ui.candidateId)throw new Error('No selected restaurant');
 return {userId:requireUser().id,caseId:requireView().case.caseId,revision:requireView().restaurant.requirementRevision,candidateId:state.ui.candidateId};
}
export function selectSlot(offer:Offer){
 sessionStorage.setItem(selectionKey(selectionScope()),JSON.stringify({dateTime:offer.dateTime,partySize:offer.partySize}));
 reconcileSlot();
}
export function reconcileSlot(){
 if(!state.view||!state.user||!state.ui.candidateId)return;
 const selected=readSelection(sessionStorage,selectionScope());
 state.ui.selectedSlot=selected;
 if(requireView().restaurant.progress.active)return;
 const choice=projectSelection(selected,freshOffers(state.ui.candidateId));
 state.ui.offerId=choice.offerId??null;
 state.ui.reselectSlot=choice.reselect;
 if(choice.reselect&&state.ui.view==='HANDOFF'){
   state.ui.view='CANDIDATES';state.handoffKey='';
   if(choice.reselect)report(new Error("Availability couldn't be confirmed. Try again."));
 }
}
export function handoffs(){return (requireView().restaurant.bookingHandoffs||[]).filter(h=>h.candidateId===state.ui.candidateId&&Date.parse(h.displayExpiresAt)>Date.now());}
export function currentHandoff(){const list=handoffs();return state.ui.selectedSlot?list.find(h=>h.offerId===state.ui.offerId):list[0];}
