import { projectSelection, readSelection, selectionKey } from "./slot-selection.js";
import { report, state } from "./runtime.js";
export function freshOffers(id){return (state.view.restaurant.availability[id]||[]).filter(o=>!o.displayExpiresAt||Date.parse(o.displayExpiresAt)>Date.now());}
export function needsSlotReselection(id){return state.ui.reselectSlot===true&&state.ui.candidateId===id&&freshOffers(id).length>0;}
export function availabilityExpired(id){
 const r=state.view.restaurant,expiry=r.availabilityChecks[id]?.displayExpiresAt;
 return !freshOffers(id).length&&(!!(expiry&&Date.parse(expiry)<=Date.now())||!!r.availability[id]?.length);
}
export function offerFor(id){
 const fresh=freshOffers(id);
 return state.ui.selectedSlot?fresh.find(o=>o.id===state.ui.offerId):fresh[0];
}
export function clearSlotSelection(){state.ui.offerId=null;state.ui.reselectSlot=false;delete state.ui.selectedSlot;}
export function forgetSlotSelection(){
 if(state.view&&state.user&&state.ui.candidateId)localStorage.removeItem(selectionKey(selectionScope()));
 clearSlotSelection();
}
export function selectionScope(){
 return {userId:state.user.id,caseId:state.view.case.caseId,revision:state.view.restaurant.requirementRevision,candidateId:state.ui.candidateId};
}
export function selectSlot(offer){
 localStorage.setItem(selectionKey(selectionScope()),JSON.stringify({dateTime:offer.dateTime,partySize:offer.partySize}));
 reconcileSlot();
}
export function reconcileSlot(){
 if(!state.view||!state.user||!state.ui.candidateId)return;
 const selected=readSelection(localStorage,selectionScope());
 state.ui.selectedSlot=selected;
 if(state.view.restaurant.progress.active)return;
 const choice=projectSelection(selected,freshOffers(state.ui.candidateId));
 state.ui.offerId=choice.offerId??null;
 state.ui.reselectSlot=choice.reselect;
 if(choice.reselect&&state.ui.view==='HANDOFF'){
   state.ui.view='CANDIDATES';state.handoffKey='';
   if(choice.reselect)report(new Error("Availability couldn't be confirmed. Try again."));
 }
}
export function handoffs(){return (state.view.restaurant.bookingHandoffs||[]).filter(h=>h.candidateId===state.ui.candidateId&&Date.parse(h.displayExpiresAt)>Date.now());}
export function currentHandoff(){const list=handoffs();return state.ui.selectedSlot?list.find(h=>h.offerId===state.ui.offerId):list[0];}
