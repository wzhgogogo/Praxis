import type { CaseSummary, PageQuestion, WorkspaceUser, WorkspaceView } from './view-contracts.js';
import type { ConditionKind, ConditionValue } from './actions.js';
import { previewPace } from './preview.js';
import { connectWorkspace } from "./actions.js";
import { bindPhotoGestures, closePhotos, movePhoto, observePhotoCredits, openPhotos } from "./photos.js";
import { accept, api, casePath, currentCase, openStream, receiveCase, refreshCaseLinks, reportCaseError, resetCaseRequests, resumeCase, scheduleCaseListSync, updateCases } from "./transport.js";
import { $, clearError, desktopLayout, element, report, requestId, requireView, show, state, text } from "./runtime.js";
import { render, renderAnswer, renderConditions } from "./views.js";
import { availabilityExpired, clearSlotSelection, currentHandoff, forgetSlotSelection, needsSlotReselection, offerFor, selectSlot } from "./selected-slot.js";
import { closePlans, loadCase, moveCard, newPlan, setView, syncBrand, syncSidebar } from "./navigation.js";
import { canAskCurrentPlace, canRefresh, canShortlist, candidate, ids } from "./queries.js";
import { key, savePosition } from "./position.js";
import { draftKey } from "./session.js";
import { blurComposer, cancelClarificationReveal, focusComposer, focusAdjustment, resizeMessage, setMessage, syncComposerViewport, updateComposerClearance } from "./composer.js";
import { cancelPreparation, clearEntryTransition, fixturePresentation } from "./preview.js";
'use strict';
connectWorkspace({render,accept,api,casePath,closeAnswer,currentCase,editCondition,finishPreparation,loadCase,openAnswer,openStream,refreshCaseLinks,reportCaseError,resetCaseRequests,scheduleCaseListSync,setView,updateCases});
observePhotoCredits();
desktopLayout.addEventListener('change',()=>{closePlans();syncSidebar();});syncSidebar();
$('collapse-plans').onclick=event=>{if(desktopLayout.matches){state.sidebarCollapsed=true;syncSidebar();if(event.detail===0)$('menu').focus({preventScroll:true});}else closePlans(event.detail===0);};

// The card shows short labels. About retains the full source excerpts.

export function closeAnswer(){show('answer-sheet',false);show('answer-backdrop',false);}
export function openAnswer(q:PageQuestion){
  const c=candidate();if(!c||q.candidateId!==c.restaurant.id)return;
  text('answer-place',c.restaurant.outletName);text('answer-question',q.question);if(q.result)renderAnswer($('question-result'),q.result);
  show('answer-sheet',true);show('answer-backdrop',true);$('answer-sheet').focus({preventScroll:true});
}
export async function askCurrentPlace(message:string){
  const old=state.view,c=candidate(),nav=state.nav,caseId=old?.case.caseId;
  if(!old||!c||!caseId||!canAskCurrentPlace())return;
  const id=requestId();state.pendingQuestion={requestId:id,caseId,candidateId:c.restaurant.id};
  state.asking=true;state.askingId=id;render();clearError();
  try{
    const p=await api<{view:WorkspaceView}>(casePath(caseId)+'/questions',{method:'POST',body:JSON.stringify({
      candidateId:c.restaurant.id,question:message,taskVersion:old.case.taskVersion,requestId:id,
    })});
    if(state.drafts.get(caseId)?.trim()===message)state.drafts.delete(caseId);
    if(draftKey()===caseId&&$('message').value.trim()===message)setMessage('');
    receiveCase(p.view,nav,caseId);
  }catch(error){
    if(currentCase(nav,caseId)&&state.askingId===id){state.pendingQuestion=null;await reportCaseError(error,nav,caseId);}
  }finally{
    if(state.askingId===id){state.asking=false;state.askingId=null;render();}
  }
}
export function editCondition(button:HTMLButtonElement,label:string,kind:ConditionKind,value:ConditionValue,removable=false){
  if(state.blocked||state.asking)return;
  if(state.conditionEditor)state.conditionEditor.cancel();
  const bounds=button.getBoundingClientRect(),anchor=element('span',undefined,'condition-edit-anchor');if(desktopLayout.matches){anchor.style.width=bounds.width+'px';anchor.style.height=bounds.height+'px';}
  const form=element('form',undefined,'condition-editor'),input=element('input'),save=element('button',undefined,'editor-save'),cancel=element('button',undefined,'editor-cancel');
  form.noValidate=true;const inputs=[input];input.type=kind==='date'?'date':kind==='time'?'time':kind==='guests'?'number':'text';input.required=true;
  input.value=kind==='text'?label:kind==='time'&&typeof value==='object'?value.earliest:String(value);input.setAttribute('aria-label','Edit '+label);input.autocomplete='off';
  if(kind==='text')input.maxLength=30;if(kind==='guests'){input.min='1';input.step='1';}
  if(kind==='time'){const end=element('input');end.type='time';end.required=true;end.value=typeof value==='object'?value.latest:'';end.setAttribute('aria-label','End time');inputs.push(end);}
  const newValue=()=>kind==='time'?input.value+(inputs[1].value===input.value?'':'–'+inputs[1].value):kind==='guests'&&input.value?String(input.valueAsNumber):input.value.trim();
  const originalValue=newValue();
  save.type='submit';save.setAttribute('aria-label','Save');save.setAttribute('aria-busy','false');save.innerHTML='<svg viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg>';
  cancel.type='button';cancel.setAttribute('aria-label','Cancel condition change');cancel.innerHTML='<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17"/></svg>';
  const remove=removable?element('button',undefined,'editor-remove'):null;
  if(remove){remove.type='button';remove.setAttribute('aria-label','Remove '+label);remove.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>';}
  let busy=false;
  const position=()=>{if(!desktopLayout.matches){anchor.style.width='';anchor.style.height='';form.style.left='';form.style.maxWidth='';return;}form.style.left='0px';const host=$('request-conditions').getBoundingClientRect();form.style.maxWidth=host.width+'px';const rect=form.getBoundingClientRect(),at=anchor.getBoundingClientRect();form.style.left=Math.max(host.left-at.left,Math.min(0,host.right-at.left-rect.width))+'px';};
  const update=()=>{const n=Array.from(newValue()).length,valid=inputs.every(i=>i.validity.valid)&&!(kind==='time'&&input.value>inputs[1].value);save.disabled=busy||!newValue()||n>30||!valid;cancel.disabled=busy;if(remove)remove.disabled=busy;for(const i of inputs)i.disabled=busy;if(kind==='text')input.style.width=Math.min(Math.max(n,3)+1,18)+'ch';if(form.isConnected)position();};
  const close=(refresh=true)=>{if(anchor.isConnected)anchor.replaceWith(button);if(state.conditionEditor&&state.conditionEditor.form===form)state.conditionEditor=null;if(refresh&&state.view)renderConditions();};
  cancel.onclick=event=>{if(busy)return;close();if(event.detail===0)button.focus({preventScroll:true});};
  for(const i of inputs)i.oninput=update;form.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();cancel.click();}};
  const submitEdit=async(message:string,button:HTMLButtonElement)=>{if(busy||state.blocked||state.asking)return;
    busy=true;button.setAttribute('aria-busy','true');update();
    const accepted=await submitRequirement(message,true);
    busy=false;button.setAttribute('aria-busy','false');if(accepted)close();else update();
  };
  form.onsubmit=event=>{event.preventDefault();if(save.disabled)return;const value=newValue();if(value===originalValue){cancel.click();return;}void submitEdit('Change '+label+' to '+value,save);};
  form.append(input);if(kind==='time')form.append(element('span','–'),inputs[1]);form.append(save,cancel);
  if(remove){remove.onclick=()=>{void submitEdit('Remove '+label,remove);};form.append(remove);}
  anchor.append(form);button.replaceWith(anchor);
  if(!desktopLayout.matches)$('request-conditions').scrollLeft=0;
  state.conditionEditor={form,anchor,caseId:requireView().case.caseId,get busy(){return busy;},cancel:()=>{if(!busy)close(false);},position};update();input.focus({preventScroll:true});if(kind==='text')input.select();
}

$('message').addEventListener('blur',blurComposer);
$('message').addEventListener('focus',focusComposer);
window.visualViewport?.addEventListener('resize',syncComposerViewport);
window.visualViewport?.addEventListener('scroll',syncComposerViewport);
$('message').addEventListener('input',resizeMessage);
$('message').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('composer').requestSubmit();}});
new ResizeObserver(updateComposerClearance).observe($('workspace-composer'));window.addEventListener('resize',()=>{syncComposerViewport();resizeMessage();updateComposerClearance();if(state.conditionEditor)state.conditionEditor.position();});
const caseScroller=$('case-workspace');
caseScroller.addEventListener('wheel',cancelClarificationReveal,{passive:true});caseScroller.addEventListener('touchmove',cancelClarificationReveal,{passive:true});
new IntersectionObserver(entries=>{$('topbar').classList.toggle('scrolled',!caseScroller.hidden&&!entries[0].isIntersecting);},{root:caseScroller,threshold:0}).observe($('topbar-sentinel'));

$('cover-open').onclick=openPhotos;$('detail-photo-open').onclick=openPhotos;$('photo-close').onclick=closePhotos;
bindPhotoGestures();
$('detail-photo-previous').onclick=()=>movePhoto(-1);$('detail-photo-next').onclick=()=>movePhoto(1);$('photo-previous').onclick=()=>movePhoto(-1);$('photo-next').onclick=()=>movePhoto(1);
$('photo-viewer').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();movePhoto(-1);}if(event.key==='ArrowRight'){event.preventDefault();movePhoto(1);}});

export function viewContext(){return {view:state.view?state.ui.view:'HOME',...(state.view&&!state.ui.atEnd&&state.ui.candidateId&&['CANDIDATES','DETAILS','HANDOFF'].includes(state.ui.view)?{candidateId:state.ui.candidateId}:{}),comparedCandidateIds:[]};}
export async function submitRequirement(message:string,preserveComposer=false){
 if(!message||state.blocked||state.asking)return false;
 $('message').removeAttribute('placeholder');
 const nav=state.nav,old=state.view,caseId=old?.case.caseId,context=viewContext(),draft=$('message').value,startedAt=performance.now();
 clearEntryTransition();state.blocked=true;state.researching=!!old;state.sending=!preserveComposer;clearError();
 if(!old){state.pendingCase={title:message};if(!preserveComposer)setMessage('');}
 render();
 try{
  const path=old?'/api/conversations/'+encodeURIComponent(old.conversation.id)+'/messages':'/api/cases';
  const body={message,requestId:requestId(),viewContext:context,...(old?{taskVersion:old.case.taskVersion}:{})};
  const p=await api<{view:WorkspaceView}>(path,{method:'POST',body:JSON.stringify(body)});
  const modelFailed=p.view.restaurant.readStatus.kind==='MODEL_FAILURE';
  if(!preserveComposer&&!modelFailed){
    const targetKey=caseId||'HOME';
    if(state.drafts.get(targetKey)?.trim()===message)state.drafts.delete(targetKey);
    if(draftKey()===targetKey&&$('message').value.trim()===message)setMessage('');
  }
  if(!currentCase(nav,caseId)){updateCases(p.view.case);return false;}
  state.pendingCase=null;state.blocked=false;state.sending=false;
  if(!modelFailed&&old&&context.view==='CANDIDATES'&&p.view.restaurant.requirementRevision!==old.restaurant.requirementRevision)forgetSlotSelection();
  if(!modelFailed||!old)state.ui={view:'CANDIDATES',candidateId:null,reselectSlot:false};
  state.detailKey='';state.handoffKey='';
  if(!old&&modelFailed&&!$('message').value)setMessage(draft);
  if(!old&&previewPace&&fixturePresentation(p.view))state.entryPace=startedAt;
  if(modelFailed)state.researching=false;
  accept(p.view);
  if(modelFailed)$('understanding-error').scrollIntoView({block:'nearest',behavior:'instant'});
  if(!old||state.streamCaseId!==p.view.case.caseId)openStream(p.view.case.caseId,nav);
  savePosition();return !modelFailed;
 }catch(error){
  if(currentCase(nav,caseId)){
    if(!old)clearEntryTransition();
    state.sending=false;
    if(!$('message').value)setMessage(draft);
    await reportCaseError(error,nav,caseId);
  }
  return false;
 }finally{resumeCase(nav,caseId);}
}
$('composer').onsubmit=async event=>{event.preventDefault();const message=$('message').value.trim();if(!message||$('send').disabled)return;if(state.view&&state.ui.view==='DETAILS'){await askCurrentPlace(message);return;}await submitRequirement(message);};
export async function stopCurrentRead(){
  if(state.blocked||!state.view)return;
  const nav=state.nav,{caseId,taskVersion}=requireView().case,readRunId=requireView().restaurant.sourceReadContext?.runId,handleId=requireView().restaurant.sourceReadContext?.handleId;
  if(!readRunId)return;
  clearError();
  state.blocked=true;$('stop').disabled=true;$('question-stop').disabled=true;
  try{
    const p=await api<{view:WorkspaceView}>(casePath(caseId)+'/run',{method:'DELETE',body:JSON.stringify({readRunId,taskVersion,...(handleId?{handleId}:{})})});
    receiveCase(p.view,nav,caseId);
  }catch(error){await reportCaseError(error,nav,caseId);}
  finally{resumeCase(nav,caseId);}
};
$('stop').onclick=stopCurrentRead;$('question-stop').onclick=stopCurrentRead;
// Keep the mobile composer layout stable through pointerup so Stop receives its click.
for(const id of ['stop','question-stop'])$(id).addEventListener('pointerdown',event=>{if(!desktopLayout.matches&&document.activeElement===$('message'))event.preventDefault();});
$('bookmark').onclick=async()=>{
  const c=candidate();if(state.blocked||!c||!canShortlist())return;
  const nav=state.nav,caseId=requireView().case.caseId;
  try{
    const p=await api<{view:WorkspaceView}>(casePath(caseId)+'/shortlist',{method:'POST',body:JSON.stringify({
      candidateId:c.restaurant.id,shortlisted:!(requireView().restaurant.shortlistCandidateIds||[]).includes(c.restaurant.id),
      taskVersion:requireView().case.taskVersion,requestId:requestId(),
    })});
    receiveCase(p.view,nav,caseId);
  }catch(error){await reportCaseError(error,nav,caseId);}
};
$('previous').onclick=()=>moveCard(-1);$('next').onclick=()=>moveCard(1);
$('details-button').onclick=()=>setView('DETAILS');$('details-back').onclick=()=>setView('CANDIDATES');$('saved').onclick=()=>setView('SAVED');$('saved-back').onclick=()=>setView('CANDIDATES');$('choose').onclick=prepareBooking;$('handoff-back').onclick=()=>setView('CANDIDATES');
export async function refreshCase(){
 if(state.blocked||!state.view)return false;
 const nav=state.nav,caseId=requireView().case.caseId;
 state.blocked=true;state.researching=true;render();
 try{
  const p=await api<{view:WorkspaceView}>(casePath(caseId)+'/refresh',{method:'POST',body:JSON.stringify({taskVersion:requireView().case.taskVersion,requestId:requestId()})});
  return receiveCase(p.view,nav,caseId);
 }catch(error){
  if(currentCase(nav,caseId))cancelPreparation();
  await reportCaseError(error,nav,caseId);return false;
 }finally{resumeCase(nav,caseId);}
}
export function finishPreparation(){
 const pending=state.preparing;if(!pending)return;
 if(!currentCase(pending.nav,pending.caseId)||state.ui.candidateId!==pending.id
  ||!['CANDIDATES','HANDOFF'].includes(state.ui.view)||requireView().restaurant.requirementRevision!==pending.revision){cancelPreparation();return;}
 if(requireView().restaurant.progress.active)return;
 cancelPreparation();
 const matched=offerFor(pending.id);
 if(ids().includes(pending.id)&&requireView().restaurant.readyCandidateIds.includes(pending.id)&&matched){
   selectSlot(matched);closeAnswer();state.ui.view='HANDOFF';savePosition();clearError();
 }else{
   if(state.ui.view==='HANDOFF'){state.ui.view='CANDIDATES';state.handoffKey='';}
   savePosition();report(new Error("Availability couldn't be confirmed. Try again."));
 }
}
export async function refreshSelectedSlot(){
 if(!canRefresh()||state.blocked||state.preparing||state.ui.reconfirmSlot)return;
 const id=state.ui.candidateId;if(!id)return;
 const nav=state.nav,caseId=requireView().case.caseId,revision=requireView().restaurant.requirementRevision;
 const old=(requireView().restaurant.availability[id]||[])[0];
 if(old&&!state.ui.selectedSlot)selectSlot(old);
 const pending={id,nav,caseId,revision};
 state.preparing=pending;clearError();
 const refreshed=await refreshCase();
 if(!refreshed&&state.preparing===pending){cancelPreparation();if(currentCase(nav,caseId))render();}
}
export async function prepareBooking(){
 if(state.blocked||state.preparing||!candidate()||!ids().includes(state.ui.candidateId??''))return;
 const id=state.ui.candidateId;
 if(state.ui.reconfirmSlot||needsSlotReselection(id))return;
 if(!availabilityExpired(id)){const viewed=offerFor(id);if(state.ui.selectedSlot&&!viewed)return;if(viewed)selectSlot(viewed);setView('HANDOFF');return;}
 await refreshSelectedSlot();
}
$('refresh').onclick=refreshCase;
$('answer-close').onclick=closeAnswer;$('answer-backdrop').onclick=closeAnswer;$('answer-dismiss').onclick=closeAnswer;
let answerDragY:number|null=null;$('answer-dismiss').onpointerdown=event=>{answerDragY=event.clientY;$('answer-dismiss').setPointerCapture(event.pointerId);};
$('answer-dismiss').onpointerup=event=>{if(answerDragY!==null&&event.clientY-answerDragY>40)closeAnswer();answerDragY=null;};
$('batch-back').onclick=()=>moveCard(-1);$('end-adjust').onclick=focusAdjustment;
export async function findMore(){
  if(state.blocked||!state.view)return;
  const nav=state.nav,caseId=requireView().case.caseId;
  state.blocked=true;state.researching=true;render();
  try{
    const p=await api<{view:WorkspaceView}>(casePath(caseId)+'/another-batch',{method:'POST',body:JSON.stringify({taskVersion:requireView().case.taskVersion,requestId:requestId()})});
    if(currentCase(nav,caseId)){state.ui.atEnd=false;state.ui.candidateId=null;clearSlotSelection();}
    receiveCase(p.view,nav,caseId);
  }catch(error){await reportCaseError(error,nav,caseId);}
  finally{resumeCase(nav,caseId);}
}
$('find-more').onclick=findMore;$('empty-more').onclick=findMore;$('empty-retry').onclick=refreshCase;$('empty-adjust').onclick=focusAdjustment;
export async function depart(event:MouseEvent){
 event.preventDefault();
 if(!state.view||state.blocked||state.preparing||state.ui.reconfirmSlot)return;
 const nav=state.nav,caseId=requireView().case.caseId,h=currentHandoff();
 if(!h){await refreshSelectedSlot();return;}
 const returnKey=key(caseId)+':return';
 const target=window.open('about:blank','_blank');
 if(!target){report(new Error('Please allow this source tab to open.'));return;}
 target.opener=null;
 try{
  const p=await api<{url:string;departure:{id:string}}>(casePath(caseId)+'/booking-departures',{method:'POST',body:JSON.stringify({
    candidateId:h.candidateId,offerId:h.offerId,taskVersion:requireView().case.taskVersion,requestId:requestId(),
  })});
  if(state.signingOut){target.close();return;}
  localStorage.setItem(returnKey,p.departure.id);target.location.href=p.url;
 }catch(error){target.close();await reportCaseError(error,nav,caseId);}
}
$('departure').onclick=depart;$('direct-source').onclick=event=>{if(currentHandoff())void depart(event);};
window.addEventListener('focus',async()=>{
 scheduleCaseListSync(true);
 const nav=state.nav,caseId=state.view?.case.caseId;
 if(!caseId||!localStorage.getItem(key(caseId)+':return'))return;
 try{const p=await api<{view:WorkspaceView}>(casePath(caseId));receiveCase(p.view,nav,caseId);}
 catch(error){await reportCaseError(error,nav,caseId);}
});
for(const button of $('feedback').querySelectorAll<HTMLButtonElement>('[data-answer]'))button.onclick=async()=>{
 const nav=state.nav,caseId=state.view?.case.caseId,prompt=caseId?state.feedbackPrompts.get(caseId):undefined;
 if(!prompt||!caseId)return;
 try{
   await api<{view:WorkspaceView}>(casePath(caseId)+'/booking-feedback',{method:'POST',body:JSON.stringify({departureId:prompt.departure.id,answer:button.dataset.answer})});
   if(state.feedbackPrompts.get(caseId)===prompt){
     state.feedbackPrompts.delete(caseId);
     if(draftKey()===caseId)show('feedback',false);
   }
 }catch(error){await reportCaseError(error,nav,caseId);}
};
$('menu').onclick=event=>{
 if(desktopLayout.matches){state.sidebarCollapsed=false;syncSidebar();if(event.detail===0)$('collapse-plans').focus({preventScroll:true});return;}
 if($('plans').classList.contains('open'))return closePlans(event.detail===0);
 $('plans').classList.add('open');show('backdrop',true);$('menu').setAttribute('aria-expanded','true');syncBrand();scheduleCaseListSync(true);
 if(event.detail===0)$('collapse-plans').focus({preventScroll:true});
};$('backdrop').onclick=()=>closePlans();
document.addEventListener('pointerdown',event=>{
 if(!(event.target instanceof Node))return;
 const editor=state.conditionEditor;
 if(editor&&!editor.busy&&!editor.anchor.contains(event.target)){
  const otherCondition=event.target instanceof Element&&event.target.closest('#request-conditions > button');
  if(otherCondition)event.preventDefault();
  else editor.cancel();
 }
 if($('profile').open&&!$('profile').contains(event.target))$('profile').open=false;
});
document.addEventListener('keydown',event=>{
 if($('photo-viewer').open)return;
 if(event.key==='Escape'){if(state.conditionEditor&&!state.conditionEditor.busy)state.conditionEditor.cancel();$('profile').open=false;closeAnswer();closePlans(true);return;}
 if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.metaKey||event.ctrlKey||event.altKey||event.isComposing||!state.view||state.ui.view!=='CANDIDATES'||state.ui.atEnd||!$('answer-sheet').hidden||$('plans').classList.contains('open')||state.conditionEditor||document.activeElement?.closest('input,textarea,select,[contenteditable]'))return;
 const button=$(event.key==='ArrowLeft'?'previous':'next');if(!button.disabled){event.preventDefault();button.click();}
});
$('new-case').onclick=newPlan;$('brand').onclick=event=>{event.preventDefault();newPlan();};
$('logout').onclick=async()=>{
 clearEntryTransition();++state.nav;state.signingOut=true;scheduleCaseListSync();
 try{await api<{user:WorkspaceUser}>('/api/session',{method:'DELETE'});state.feedbackPrompts.clear();location.reload();}
 catch(error){
  state.signingOut=false;resetCaseRequests();render();
  if(state.view)openStream(requireView().case.caseId,state.nav);
  scheduleCaseListSync(true);report(error);
 }
};
$('use-location').onclick=()=>{
 const nav=state.nav,caseId=state.view?.case.caseId,taskVersion=state.view?.case.taskVersion;
 if(!caseId||state.locating||state.blocked)return;
 const fallback=new Error('Type a nearby station, address, or district instead.');
 clearError();
 if(!navigator.geolocation){report(fallback);return;}
 const id=requestId();state.locating=id;$('use-location').disabled=true;
 const finish=()=>{if(state.locating===id){state.locating=null;render();}};
 const denied=()=>{if(currentCase(nav,caseId))report(fallback);finish();};
 try{
  navigator.geolocation.getCurrentPosition(async p=>{
    if(!currentCase(nav,caseId))return;
    try{
      const result=await api<{view:WorkspaceView}>(casePath(caseId)+'/location',{method:'POST',body:JSON.stringify({
        taskVersion,requestId:id,latitude:p.coords.latitude,longitude:p.coords.longitude,accuracyMeters:p.coords.accuracy,
      })});
      receiveCase(result.view,nav,caseId);
    }catch(error){await reportCaseError(error,nav,caseId);}
    finally{finish();}
  },denied);
 }catch{denied();}
};
export async function enter(user:WorkspaceUser){state.user=user;show('login',false);show('app',true);text('profile-label',user.displayName||'Profile');text('profile-avatar',Array.from(String(user.displayName||'P'))[0].toLocaleUpperCase('en-US'));render();const nav=state.nav;const p=await api<{cases:CaseSummary[]}>('/api/cases');for(const item of p.cases)updateCases(item);const active=localStorage.getItem('praxis:active:'+user.id);if(nav===state.nav&&active&&state.cases.has(active))await loadCase(active);}
$('login-form').onsubmit=async event=>{event.preventDefault();try{const p=await api<{user:WorkspaceUser}>('/api/session',{method:'POST',body:JSON.stringify({accessToken:$('access-token').value})});await enter(p.user);}catch(error){text('login-error',error instanceof Error?error.message:'Please try again.');show('login-error',true);}};
void api<{user:WorkspaceUser}>('/api/session').then(p=>enter(p.user)).catch(()=>{show('login',true);show('app',false);});
