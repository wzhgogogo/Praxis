import type { WorkspaceView } from './view-contracts.js';
import type { WorkspaceViewName } from './actions.js';
import { $, clearError, desktopLayout, report, requireUser, requireView, show, state } from "./runtime.js";
import { forgetSlotSelection } from "./selected-slot.js";
import { closePhotos } from "./photos.js";
import { ids } from "./queries.js";
import { restorePosition, savePosition } from "./position.js";
import { restoreDraft, saveDraft } from "./session.js";
import { cancelPreparation, clearEntryPreview, clearEntryTransition } from "./preview.js";
import { actions } from "./actions.js";

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
export function setView(view:WorkspaceViewName){if(state.ui.view==='DETAILS'&&view!=='DETAILS')state.pendingQuestion=null;closePhotos();clearEntryTransition();cancelPreparation();actions.closeAnswer();state.ui.view=view;savePosition();clearError();actions.render();$('case-workspace').scrollTop=0;}
// Fixture pacing changes presentation only; state.view remains the accepted server projection.
export async function loadCase(caseId:string){
  saveDraft();
  const nav=++state.nav,previousId=state.view?.case.caseId;
  actions.resetCaseRequests();state.blocked=true;actions.render();actions.scheduleCaseListSync(true);
  try{
    const p=await actions.api<{view:WorkspaceView}>(actions.casePath(caseId));
    if(!actions.currentCase(nav,previousId)){actions.updateCases(p.view.case);return;}
    saveDraft();state.blocked=false;state.view=null;state.ui=restorePosition(caseId);state.detailKey='';state.handoffKey='';
    restoreDraft(caseId);actions.accept(p.view);savePosition();actions.openStream(caseId,nav);closePlans();
  }catch(error){
    if(!actions.currentCase(nav,previousId))return;
    state.blocked=false;if(previousId)actions.openStream(previousId,nav);
    actions.render();report(error);
  }
}
export function newPlan(){
  saveDraft();++state.nav;actions.resetCaseRequests();
  state.view=null;clearTimeout(state.expiry);localStorage.removeItem('praxis:active:'+requireUser().id);
  state.ui={view:'CANDIDATES',candidateId:null,reselectSlot:false};state.drafts.delete('HOME');restoreDraft('HOME');
  closePlans();actions.render();actions.refreshCaseLinks();actions.scheduleCaseListSync(true);$('message').focus();
}
export function moveCard(delta:number){
  clearEntryPreview();cancelPreparation();const list=ids(),i=list.indexOf(state.ui.candidateId??'');
  if(state.ui.atEnd&&delta<0){state.ui.atEnd=false;savePosition();actions.render();return;}
  const id=list[i+delta];
  if(id){actions.closeAnswer();forgetSlotSelection();state.ui.candidateId=id;state.ui.atEnd=false;state.detailKey='';state.handoffKey='';savePosition();actions.render();}
  else if(delta>0&&i===list.length-1&&requireView().case.phase==='PRESENT_RESULTS'&&!requireView().restaurant.progress.active){state.ui.atEnd=true;savePosition();actions.render();}
}
