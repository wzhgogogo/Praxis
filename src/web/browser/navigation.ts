import { render } from "./views.js";
import { clearSlotSelection, forgetSlotSelection } from "./selected-slot.js";
import { closePhotos } from "./photos.js";
import { cancelPreparation, clearEntryPreview, clearEntryTransition, closeAnswer, ids } from "./entry.js";
import { $, clearError, desktopLayout, report, show, state } from "./runtime.js";
import { restoreDraft, saveDraft } from "./session.js";
import { accept, api, casePath, currentCase, openStream, refreshCaseLinks, resetCaseRequests, scheduleCaseListSync, updateCases } from "./transport.js";
export function key(caseId){return 'praxis:workspace:'+state.user.id+':'+caseId;}
export function savePosition(){if(!state.view)return;sessionStorage.setItem(key(state.view.case.caseId),JSON.stringify({view:state.ui.view,candidateId:state.ui.candidateId,atEnd:state.ui.atEnd}));localStorage.setItem('praxis:active:'+state.user.id,state.view.case.caseId);}
export function restorePosition(caseId){
 const defaults={view:'CANDIDATES',candidateId:null,reselectSlot:false};
 try{return {...defaults,...JSON.parse(sessionStorage.getItem(key(caseId)))};}catch{return defaults;}
}
export function closePlans(restoreFocus=false){const wasOpen=$('plans').classList.contains('open');$('plans').classList.remove('open');show('backdrop',false);$('menu').setAttribute('aria-expanded','false');syncBrand();if(restoreFocus&&wasOpen)$('menu').focus({preventScroll:true});}
export function syncBrand(){
 const inSidebar=desktopLayout.matches?!state.sidebarCollapsed:$('plans').classList.contains('open');
 const brandHost=inSidebar?$('plans-brand'):$('topbar');
 if($('brand').parentElement!==brandHost){if(brandHost===$('topbar'))$('menu').after($('brand'));else brandHost.prepend($('brand'));}
}
export function syncSidebar(){
 const desktop=desktopLayout.matches,collapsed=desktop&&state.sidebarCollapsed;
 document.body.classList.toggle('sidebar-collapsed',collapsed);$('plans').inert=collapsed;
 if(desktop)closePlans();else syncBrand();
 $('menu').setAttribute('aria-label',desktop?'Expand sidebar':'My plans');$('collapse-plans').setAttribute('aria-label',desktop?'Collapse sidebar':'Close sidebar');
}
export function setView(view){closePhotos();clearEntryTransition();cancelPreparation();closeAnswer();state.ui.view=view;savePosition();clearError();render();$('case-workspace').scrollTop=0;}
// Fixture pacing changes presentation only; state.view remains the accepted server projection.
export async function loadCase(caseId){
  saveDraft();
  const nav=++state.nav,previousId=state.view?.case.caseId;
  resetCaseRequests();state.blocked=true;render();scheduleCaseListSync(true);
  try{
    const p=await api(casePath(caseId));
    if(!currentCase(nav,previousId)){updateCases(p.view.case);return;}
    saveDraft();state.blocked=false;state.view=null;state.ui=restorePosition(caseId);state.detailKey='';state.handoffKey='';
    restoreDraft(caseId);accept(p.view);savePosition();openStream(caseId,nav);closePlans();
  }catch(error){
    if(!currentCase(nav,previousId))return;
    state.blocked=false;if(previousId)openStream(previousId,nav);
    render();report(error);
  }
}
export function newPlan(){
  saveDraft();++state.nav;resetCaseRequests();
  state.view=null;clearTimeout(state.expiry);localStorage.removeItem('praxis:active:'+state.user.id);
  state.ui={view:'CANDIDATES',candidateId:null,reselectSlot:false};state.drafts.delete('HOME');restoreDraft('HOME');
  closePlans();render();refreshCaseLinks();scheduleCaseListSync(true);$('message').focus();
}
export function moveCard(delta){
  clearEntryPreview();cancelPreparation();const list=ids(),i=list.indexOf(state.ui.candidateId);
  if(state.ui.atEnd&&delta<0){state.ui.atEnd=false;savePosition();render();return;}
  const id=list[i+delta];
  if(id){closeAnswer();forgetSlotSelection();state.ui.candidateId=id;state.ui.atEnd=false;state.detailKey='';state.handoffKey='';savePosition();render();}
  else if(delta>0&&i===list.length-1&&state.view.case.phase==='PRESENT_RESULTS'&&!state.view.restaurant.progress.active){state.ui.atEnd=true;savePosition();render();}
}
