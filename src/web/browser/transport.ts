import { savePosition } from "./position.js";
import type { CaseSummary, WorkspaceView } from './view-contracts.js';
import { $, clearError, element, report, requireView, show, state } from "./runtime.js";
import { clearSlotSelection, reconcileSlot, requireReconfirmation } from "./selected-slot.js";
import { caseLabel, displayTitle } from "./format.js";
import { claimFeedback } from "./session.js";
import { cancelPreparation, clearEntryPreview, clearEntryTransition, fixturePresentation, startEntryPreview } from "./preview.js";
import { actions } from "./actions.js";
export async function api<T>(path:string,options?:RequestInit):Promise<T>{
 const init=options??{},response=await fetch(path,{...init,headers:{...(init.body?{'content-type':'application/json'}:{}),...init.headers}});
 const payload:unknown=await response.json();
 if(!response.ok){
  const detail=payload&&typeof payload==='object'?payload:{};
  const error:Error&{status:number;actualVersion?:number}=Object.assign(new Error('error' in detail&&typeof detail.error==='string'?detail.error:'Please try again.'),{status:response.status});
  if('actualVersion' in detail&&typeof detail.actualVersion==='number')error.actualVersion=detail.actualVersion;
  throw error;
 }
 return payload as T;
}
export function casePath(caseId:string){return '/api/cases/'+encodeURIComponent(caseId);}
export function currentCase(nav:number,caseId:string|undefined){return nav===state.nav&&state.view?.case.caseId===caseId;}
export function updateCases(summary:CaseSummary){
  const prior=state.cases.get(summary.caseId);
  if(prior&&prior.taskVersion>summary.taskVersion)return;
  state.cases.set(summary.caseId,summary);
  const list=$('case-list');
  let button=list.querySelector<HTMLButtonElement>('[data-case-id="'+CSS.escape(summary.caseId)+'"]');
  if(!button){
    button=element('button',undefined,'case-link');button.dataset.caseId=summary.caseId;
    button.append(element('span'),element('small'));button.onclick=()=>actions.loadCase(summary.caseId);
  }
  button.classList.toggle('active',summary.caseId===state.view?.case.caseId);
  button.firstElementChild!.textContent=displayTitle(summary.title);button.title=summary.title;button.lastElementChild!.textContent=caseLabel(summary);
  const next=[...list.querySelectorAll<HTMLButtonElement>(':scope > button')].find(row=>{
    if(row===button)return false;
    const other=state.cases.get(row.dataset.caseId??'');
    if(!other)return false;
    const byTime=Date.parse(summary.updatedAt)-Date.parse(other.updatedAt);
    return byTime>0||(byTime===0&&summary.caseId.localeCompare(other.caseId)<0);
  })||null;
  if(button.parentElement!==list||button.nextElementSibling!==next){
    const focused=document.activeElement===button;
    list.insertBefore(button,next);
    if(focused)button.focus({preventScroll:true});
  }
  scheduleCaseListSync();
}
export function refreshCaseLinks(){for(const s of state.cases.values())updateCases(s);}
export function hasBackgroundActiveCase(){
  return [...state.cases.values()].some(item=>
    (item.caseId!==state.streamCaseId||state.stream?.readyState===EventSource.CLOSED)
    &&(item.status==='ACTIVE'||['UNDERSTANDING','SEARCHING','SELECTION_REQUIRED'].includes(item.phase)));
}
export function scheduleCaseListSync(immediate=false){
  if(!state.user||state.signingOut||!hasBackgroundActiveCase()){
    clearTimeout(state.caseListTimer);state.caseListTimer=undefined;return;
  }
  if(state.caseListSyncing||state.caseListTimer!==undefined&&!immediate)return;
  clearTimeout(state.caseListTimer);
  state.caseListTimer=setTimeout(syncCaseList,immediate?0:1750);
}
export async function syncCaseList(){
  state.caseListTimer=undefined;
  if(state.signingOut||!hasBackgroundActiveCase())return;
  const user=state.user;state.caseListSyncing=true;
  try{
    const p=await api<{cases:CaseSummary[]}>('/api/cases');
    if(user===state.user&&!state.signingOut)for(const item of p.cases)updateCases(item);
  }catch{/* A later background sync can retry without interrupting the current plan. */}
  finally{state.caseListSyncing=false;scheduleCaseListSync();}
}
export function closeStream(){state.stream?.close();state.stream=null;state.streamCaseId=null;state.deferredView=null;}
export function openStream(caseId:string,nav:number){
  closeStream();show('reconnecting',false);
  const stream=new EventSource(casePath(caseId)+'/events');state.stream=stream;state.streamCaseId=caseId;
  const current=()=>currentCase(nav,caseId)&&state.stream===stream;
  stream.addEventListener('open',()=>{if(current())show('reconnecting',false);});
  stream.addEventListener('error',()=>{if(current()){show('reconnecting',stream.readyState===EventSource.CONNECTING);scheduleCaseListSync();}});
  stream.addEventListener('case',event=>{if(!current())return;try{receiveCase(JSON.parse(event.data) as WorkspaceView,nav,caseId);}catch(error){report(error);}});
  scheduleCaseListSync();
}
export function receiveCase(view:WorkspaceView,nav:number,caseId:string){
  if(!currentCase(nav,caseId)){updateCases(view.case);return false;}
  if(state.blocked){
    const version=view.case.taskVersion;
    if(version>=requireView().case.taskVersion&&(!state.deferredView||version>=state.deferredView.view.case.taskVersion)){
      state.deferredView={nav,caseId,view};updateCases(view.case);actions.render();
    }
  }else accept(view);
  return true;
}
export function flushDeferredView(){
  const next=state.deferredView;state.deferredView=null;
  return !!next&&currentCase(next.nav,next.caseId)&&accept(next.view);
}
export function resumeCase(nav:number,caseId:string|undefined){
  if(!currentCase(nav,caseId))return;
  state.blocked=false;
  if(!flushDeferredView())actions.render();
}
export async function reportCaseError(error:unknown,nav:number,caseId:string|undefined){
  if(!currentCase(nav,caseId))return;
  if(error instanceof Error&&'status' in error&&error.status===409&&caseId){
    flushDeferredView();
    if(typeof ('actualVersion' in error?error.actualVersion:undefined)!=='number'||requireView().case.taskVersion<('actualVersion' in error&&typeof error.actualVersion==='number'?error.actualVersion:Infinity)){
      try{
        const p=await api<{view:WorkspaceView}>(casePath(caseId));
        if(currentCase(nav,caseId))accept(p.view);else updateCases(p.view.case);
      }catch{/* Preserve the original conflict when the latest snapshot cannot be read. */}
    }
  }
  if(currentCase(nav,caseId))report(error);
}
export function accept(view:WorkspaceView){
  if(state.view&&view.case.caseId!==requireView().case.caseId)return false;
  const next=state.deferredView;
  if(next&&currentCase(next.nav,next.caseId)&&next.caseId===view.case.caseId&&next.view.case.taskVersion>=view.case.taskVersion)view=next.view;
  state.deferredView=null;
  if(state.view&&view.case.taskVersion<requireView().case.taskVersion)return false;
  if(state.ui.atEnd&&view.case.phase==='PRESENT_RESULTS'&&state.view&&JSON.stringify(view.restaurant.presentedCandidateIds)!==JSON.stringify(requireView().restaurant.presentedCandidateIds)){state.ui.atEnd=false;state.ui.candidateId=null;}
  if(state.entryPace!==null){
   if(!fixturePresentation(view)||view.restaurant.progress.active&&view.case.phase!=='UNDERSTANDING'||['MODEL_FAILURE','NO_QUALIFIED_RESULTS','ALL_SOURCES_FAILED','OTHER_FAILURE'].includes(view.restaurant.readStatus.kind))state.entryPace=null;
   else if(view.case.phase==='PRESENT_RESULTS'){const startedAt=state.entryPace;state.entryPace=null;startEntryPreview(view,startedAt);}
  }
  if(state.preview&&(view.restaurant.progress.active||view.case.phase!=='PRESENT_RESULTS'))clearEntryPreview();
  const priorRevision=state.view?.restaurant.requirementRevision;
  const changedRevision=priorRevision!==undefined&&view.restaurant.requirementRevision!==priorRevision;
  const staleRestoredHandoff=priorRevision===undefined&&state.ui.view==='HANDOFF'&&state.ui.revision!==view.restaurant.requirementRevision;
  const exitHandoff=(changedRevision||staleRestoredHandoff)&&state.ui.view==='HANDOFF';
  if(changedRevision||staleRestoredHandoff){
    cancelPreparation();clearSlotSelection();
    if(exitHandoff){state.ui.view='CANDIDATES';state.handoffKey='';}
  }
  state.view=view;
  if(exitHandoff)requireReconfirmation();
  updateCases(view.case);reconcileSlot();actions.finishPreparation();actions.render();
  if(exitHandoff){savePosition();report(new Error('Plan conditions changed. Confirm the time again.'));}
  const pending=state.pendingQuestion,q=view.restaurant.pageQuestion;
  if(pending&&pending.caseId===view.case.caseId&&q&&q.requestId===pending.requestId&&q.result){
    state.pendingQuestion=null;
    if(state.ui.view==='DETAILS'&&state.ui.candidateId===pending.candidateId)actions.openAnswer(q);
  }
  if(view.restaurant.bookingFeedbackAvailable)void claimFeedback();
  return true;
}
export function resetCaseRequests(){
  clearEntryTransition();cancelPreparation();actions.closeAnswer();closeStream();
  state.sending=false;state.asking=false;state.askingId=null;state.locating=null;
  state.blocked=false;state.pendingQuestion=null;
  show('reconnecting',false);clearError();
}
